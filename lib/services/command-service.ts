import { 
  CommandResult, 
  TerminalSession, 
  CommandExecution,
  ValidationResult 
} from '@/types/command';
import { docker } from '@/lib/docker';
import { ValidationError, NotFoundError, DockerError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';

/**
 * Command Service for executing Docker commands and shell commands
 */
export class CommandService {
  private executions: Map<string, CommandExecution>;
  private sessions: Map<string, TerminalSession>;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    this.executions = new Map();
    this.sessions = new Map();
    this.abortControllers = new Map();
  }

  /**
   * Execute a Docker command with real-time output
   */
  async executeDockerCommand(
    command: string,
    ws?: WebSocket
  ): Promise<CommandResult> {
    // Validate command
    const validation = this.validateCommand(command);
    if (!validation.valid) {
      throw new ValidationError(
        'Invalid Docker command',
        { errors: validation.errors },
        ['Check command syntax', 'Ensure command starts with docker']
      );
    }

    const executionId = uuidv4();
    const startTime = new Date();

    const execution: CommandExecution = {
      id: executionId,
      command,
      startTime,
      status: 'running',
      output: []
    };

    this.executions.set(executionId, execution);

    try {
      // Parse the Docker command
      const args = this.parseCommand(command);
      const dockerCommand = args[0]; // e.g., 'ps', 'images', 'pull'
      const dockerArgs = args.slice(1);

      // Execute based on command type
      let output = '';
      
      switch (dockerCommand) {
        case 'ps':
          output = await this.executeDockerPs(dockerArgs);
          break;
        case 'images':
          output = await this.executeDockerImages(dockerArgs);
          break;
        case 'pull':
          output = await this.executeDockerPull(dockerArgs, ws);
          break;
        case 'inspect':
          output = await this.executeDockerInspect(dockerArgs);
          break;
        default:
          throw new ValidationError(
            `Unsupported Docker command: ${dockerCommand}`,
            {},
            ['Supported commands: ps, images, pull, inspect']
          );
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      execution.status = 'completed';
      execution.endTime = endTime;
      execution.exitCode = 0;
      execution.output.push(output);

      return {
        executionId,
        command,
        output,
        exitCode: 0,
        duration,
        timestamp: startTime
      };
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.exitCode = 1;

      throw new DockerError(
        `Command execution failed: ${error.message}`,
        error,
        ['Check Docker is running', 'Verify command syntax']
      );
    }
  }

  /**
   * Execute a shell command inside a container
   */
  async executeContainerCommand(
    containerId: string,
    command: string,
    ws?: WebSocket
  ): Promise<CommandResult> {
    const executionId = uuidv4();
    const startTime = new Date();

    try {
      const container = docker.getContainer(containerId);
      
      // Check if container is running
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new ValidationError(
          'Container is not running',
          { containerId, state: containerInfo.State.Status },
          ['Start the container first']
        );
      }

      // Create exec instance
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false
      });

      // Start exec and capture output
      const stream = await exec.start({ Detach: false, Tty: false });
      
      let output = '';

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          output += data;
          
          // Send to WebSocket if available
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'command-output',
              data: { executionId, output: data }
            }));
          }
        });

        stream.on('end', async () => {
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();

          // Get exit code
          const execInfo = await exec.inspect();
          const exitCode = execInfo.ExitCode || 0;

          resolve({
            executionId,
            command,
            output,
            exitCode,
            duration,
            timestamp: startTime
          });
        });

        stream.on('error', (error: Error) => {
          reject(new DockerError(
            `Command execution failed: ${error.message}`,
            error
          ));
        });
      });
    } catch (error: any) {
      throw new DockerError(
        `Failed to execute command in container: ${error.message}`,
        error,
        ['Check container is running', 'Verify container ID']
      );
    }
  }

  /**
   * Create an interactive terminal session
   */
  async createTerminalSession(
    containerId: string,
    ws: WebSocket
  ): Promise<TerminalSession> {
    const sessionId = uuidv4();

    try {
      const container = docker.getContainer(containerId);
      
      // Check if container is running
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new ValidationError(
          'Container is not running',
          { containerId },
          ['Start the container first']
        );
      }

      const session: TerminalSession = {
        sessionId,
        containerId,
        createdAt: new Date(),
        active: true
      };

      this.sessions.set(sessionId, session);

      // Create exec instance for interactive shell
      const exec = await container.exec({
        Cmd: ['/bin/sh'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
      });

      const stream = await exec.start({ 
        Detach: false, 
        Tty: true,
        hijack: true,
        stdin: true
      });

      // Handle output from container
      stream.on('data', (chunk: Buffer) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'terminal-output',
            data: { sessionId, output: chunk.toString() }
          }));
        }
      });

      // Handle input from WebSocket
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'terminal-input' && data.sessionId === sessionId) {
            stream.write(data.input);
          }
        } catch (error) {
          console.error('Error processing terminal input:', error);
        }
      });

      // Handle session end
      stream.on('end', () => {
        session.active = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'terminal-closed',
            data: { sessionId }
          }));
        }
      });

      ws.on('close', () => {
        session.active = false;
        stream.end();
      });

      return session;
    } catch (error: any) {
      throw new DockerError(
        `Failed to create terminal session: ${error.message}`,
        error,
        ['Check container is running', 'Verify container has shell']
      );
    }
  }

  /**
   * Validate Docker command syntax
   */
  validateCommand(command: string): ValidationResult {
    const errors: string[] = [];

    if (!command || command.trim().length === 0) {
      errors.push('Command cannot be empty');
    }

    const trimmed = command.trim();
    
    // Check if command starts with 'docker'
    if (!trimmed.startsWith('docker ')) {
      errors.push('Command must start with "docker"');
    }

    // Check for dangerous commands
    const dangerousCommands = ['rm -rf /', 'dd if=', 'mkfs', ':(){:|:&};:'];
    if (dangerousCommands.some(cmd => trimmed.includes(cmd))) {
      errors.push('Command contains potentially dangerous operations');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Cancel a running command
   */
  async cancelCommand(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    
    if (!execution) {
      throw new NotFoundError('Execution', executionId);
    }

    if (execution.status !== 'running') {
      throw new ValidationError(
        'Cannot cancel command that is not running',
        { status: execution.status }
      );
    }

    const abortController = this.abortControllers.get(executionId);
    if (abortController) {
      abortController.abort();
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): CommandExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get terminal session
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Close terminal session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      this.sessions.delete(sessionId);
    }
  }

  // Private helper methods

  private parseCommand(command: string): string[] {
    // Remove 'docker' prefix and split by spaces
    const withoutDocker = command.replace(/^docker\s+/, '');
    return withoutDocker.split(/\s+/);
  }

  private async executeDockerPs(args: string[]): Promise<string> {
    const containers = await docker.listContainers({ all: args.includes('-a') });
    
    // Format output similar to docker ps
    let output = 'CONTAINER ID   IMAGE          COMMAND       CREATED        STATUS         PORTS          NAMES\n';
    
    containers.forEach(container => {
      const id = container.Id.substring(0, 12);
      const image = container.Image;
      const command = container.Command.substring(0, 20);
      const created = this.formatTimestamp(container.Created);
      const status = container.Status;
      const ports = this.formatPorts(container.Ports);
      const names = container.Names.map(n => n.replace('/', '')).join(', ');
      
      output += `${id}   ${image.padEnd(14)}   ${command.padEnd(13)}   ${created.padEnd(14)}   ${status.padEnd(14)}   ${ports.padEnd(14)}   ${names}\n`;
    });

    return output;
  }

  private async executeDockerImages(args: string[]): Promise<string> {
    const images = await docker.listImages();
    
    let output = 'REPOSITORY          TAG          IMAGE ID       CREATED        SIZE\n';
    
    images.forEach(image => {
      const repoTags = image.RepoTags || ['<none>:<none>'];
      repoTags.forEach(tag => {
        const [repo, tagName] = tag.split(':');
        const id = image.Id.replace('sha256:', '').substring(0, 12);
        const created = this.formatTimestamp(Math.floor(image.Created));
        const size = this.formatSize(image.Size);
        
        output += `${repo.padEnd(20)}   ${tagName.padEnd(12)}   ${id}   ${created.padEnd(14)}   ${size}\n`;
      });
    });

    return output;
  }

  private async executeDockerPull(args: string[], ws?: WebSocket): Promise<string> {
    if (args.length === 0) {
      throw new ValidationError('Image name required for pull command');
    }

    const imageName = args[0];
    let output = '';

    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) {
          reject(err);
          return;
        }

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          output += data;
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              event: 'command-output',
              data: { output: data }
            }));
          }
        });

        docker.modem.followProgress(stream, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(output || `Successfully pulled ${imageName}`);
          }
        });
      });
    });
  }

  private async executeDockerInspect(args: string[]): Promise<string> {
    if (args.length === 0) {
      throw new ValidationError('Container or image ID required for inspect command');
    }

    const id = args[0];
    
    try {
      // Try as container first
      const container = docker.getContainer(id);
      const info = await container.inspect();
      return JSON.stringify(info, null, 2);
    } catch {
      // Try as image
      try {
        const image = docker.getImage(id);
        const info = await image.inspect();
        return JSON.stringify(info, null, 2);
      } catch (error: any) {
        throw new NotFoundError('Container or Image', id);
      }
    }
  }

  private formatTimestamp(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  private formatPorts(ports: any[]): string {
    if (!ports || ports.length === 0) return '';
    
    return ports
      .map(p => `${p.PublicPort || ''}:${p.PrivatePort}/${p.Type}`)
      .join(', ')
      .substring(0, 30);
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}

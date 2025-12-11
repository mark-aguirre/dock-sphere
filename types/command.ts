/**
 * Command execution data models
 */

export interface CommandResult {
  executionId: string;
  command: string;
  output: string;
  exitCode: number;
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface TerminalSession {
  sessionId: string;
  containerId: string;
  createdAt: Date;
  active: boolean;
}

export interface CommandExecution {
  id: string;
  command: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  output: string[];
  exitCode?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

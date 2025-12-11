import Docker from 'dockerode';

// Initialize Docker client
// This will be used by all services

// Determine the correct socket path based on the platform
const getDockerConfig = () => {
  console.log('Docker config - Platform:', process.platform);
  console.log('Docker config - DOCKER_SOCKET env:', process.env.DOCKER_SOCKET);
  
  // On Windows, always use the named pipe (ignore env var if it's wrong)
  if (process.platform === 'win32') {
    const windowsPipe = '//./pipe/docker_engine';
    console.log('Using Windows named pipe:', windowsPipe);
    return { socketPath: windowsPipe };
  }

  // If DOCKER_SOCKET is explicitly set on non-Windows, use it
  if (process.env.DOCKER_SOCKET) {
    console.log('Using DOCKER_SOCKET from env:', process.env.DOCKER_SOCKET);
    return { socketPath: process.env.DOCKER_SOCKET };
  }

  // On Unix-like systems (Linux, macOS), use the default socket
  console.log('Using Unix socket: /var/run/docker.sock');
  return { socketPath: '/var/run/docker.sock' };
};

const config = getDockerConfig();
console.log('Final Docker config:', config);

export const docker = new Docker(config);

// Export for use in API routes and services
export default docker;

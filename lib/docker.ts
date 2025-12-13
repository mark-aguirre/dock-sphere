import Docker from 'dockerode';

// Initialize Docker client
// This will be used by all services

// Determine the correct socket path based on the platform
const getDockerConfig = () => {
  // On Windows, always use the named pipe (ignore env var if it's wrong)
  if (process.platform === 'win32') {
    const windowsPipe = '//./pipe/docker_engine';
    return { socketPath: windowsPipe };
  }

  // If DOCKER_SOCKET is explicitly set on non-Windows, use it
  if (process.env.DOCKER_SOCKET) {
    return { socketPath: process.env.DOCKER_SOCKET };
  }

  // On Unix-like systems (Linux, macOS), use the default socket
  return { socketPath: '/var/run/docker.sock' };
};

const config = getDockerConfig();

export const docker = new Docker(config);

// Export for use in API routes and services
export default docker;

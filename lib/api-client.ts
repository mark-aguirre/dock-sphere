/**
 * API Client for Container Manager Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: {},
        suggestions: []
      }
    }));

    throw new APIError(
      error.error?.message || 'Request failed',
      response.status,
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.details,
      error.error?.suggestions
    );
  }

  return response.json();
}

export const apiClient = {
  // Templates
  templates: {
    list: () =>
      fetch(`${API_BASE_URL}/api/templates`).then(handleResponse),
    
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/templates/${id}`).then(handleResponse),
    
    install: (id: string, config: any) =>
      fetch(`${API_BASE_URL}/api/templates/${id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).then(handleResponse),
  },

  // Networks
  networks: {
    list: () =>
      fetch(`${API_BASE_URL}/api/networks`).then(handleResponse),
    
    create: (config: any) =>
      fetch(`${API_BASE_URL}/api/networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).then(handleResponse),
    
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/networks/${id}`).then(handleResponse),
    
    delete: (id: string) =>
      fetch(`${API_BASE_URL}/api/networks/${id}`, {
        method: 'DELETE'
      }).then(handleResponse),
    
    connect: (id: string, containerId: string, options?: any) =>
      fetch(`${API_BASE_URL}/api/networks/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId, options })
      }).then(handleResponse),
    
    disconnect: (id: string, containerId: string) =>
      fetch(`${API_BASE_URL}/api/networks/${id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId })
      }).then(handleResponse),
  },

  // Volumes
  volumes: {
    list: () =>
      fetch(`${API_BASE_URL}/api/volumes`).then(handleResponse),
    
    create: (config: any) =>
      fetch(`${API_BASE_URL}/api/volumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).then(handleResponse),
    
    get: (name: string) =>
      fetch(`${API_BASE_URL}/api/volumes/${name}`).then(handleResponse),
    
    delete: (name: string) =>
      fetch(`${API_BASE_URL}/api/volumes/${name}`, {
        method: 'DELETE'
      }).then(handleResponse),
    
    browse: (name: string, path: string = '/') =>
      fetch(`${API_BASE_URL}/api/volumes/${name}/browse?path=${encodeURIComponent(path)}`)
        .then(handleResponse),
  },

  // Commands
  commands: {
    execute: (command: string) =>
      fetch(`${API_BASE_URL}/api/commands/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      }).then(handleResponse),
    
    cancel: (id: string) =>
      fetch(`${API_BASE_URL}/api/commands/${id}/cancel`, {
        method: 'POST'
      }).then(handleResponse),
  },

  // Containers
  containers: {
    list: (all: boolean = true) =>
      fetch(`${API_BASE_URL}/api/containers?all=${all}`).then(handleResponse),
    
    create: (config: any) =>
      fetch(`${API_BASE_URL}/api/containers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).then(handleResponse),
    
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`).then(handleResponse),
    
    start: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      }).then(handleResponse),
    
    stop: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      }).then(handleResponse),
    
    restart: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      }).then(handleResponse),
    
    pause: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      }).then(handleResponse),
    
    unpause: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpause' })
      }).then(handleResponse),
    
    kill: (id: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kill' })
      }).then(handleResponse),
    
    remove: (id: string, force: boolean = false) =>
      fetch(`${API_BASE_URL}/api/containers/${id}?force=${force}`, {
        method: 'DELETE'
      }).then(handleResponse),
    
    logs: (id: string, tail: string = '100', timestamps: boolean = false) =>
      fetch(`${API_BASE_URL}/api/containers/${id}/logs?tail=${tail}&timestamps=${timestamps}`)
        .then(handleResponse),
    
    executeShell: (id: string, command: string) =>
      fetch(`${API_BASE_URL}/api/containers/${id}/shell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      }).then(handleResponse),
  },

  // Images
  images: {
    list: (all: boolean = false) =>
      fetch(`${API_BASE_URL}/api/images?all=${all}`).then(handleResponse),
    
    pull: (image: string, tag: string = 'latest') =>
      fetch(`${API_BASE_URL}/api/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, tag })
      }).then(handleResponse),
    
    remove: (id: string) =>
      fetch(`${API_BASE_URL}/api/images?id=${id}`, {
        method: 'DELETE'
      }).then(handleResponse),
  },

  // Stats
  stats: {
    aggregate: () =>
      fetch(`${API_BASE_URL}/api/stats`).then(handleResponse),
  },

  // Stacks
  stacks: {
    list: () =>
      fetch(`${API_BASE_URL}/api/stacks`).then(handleResponse),
    
    deploy: (stackName: string, composeContent: string) =>
      fetch(`${API_BASE_URL}/api/stacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackName, composeContent })
      }).then(handleResponse),
    
    parse: (composeContent: string) =>
      fetch(`${API_BASE_URL}/api/stacks/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composeContent })
      }).then(handleResponse),
    
    get: (name: string) =>
      fetch(`${API_BASE_URL}/api/stacks/${name}`).then(handleResponse),
    
    stop: (name: string) =>
      fetch(`${API_BASE_URL}/api/stacks/${name}/stop`, {
        method: 'POST'
      }).then(handleResponse),
    
    delete: (name: string, removeVolumes: boolean = false) =>
      fetch(`${API_BASE_URL}/api/stacks/${name}?volumes=${removeVolumes}`, {
        method: 'DELETE'
      }).then(handleResponse),
  },

  // Health
  health: () =>
    fetch(`${API_BASE_URL}/api/health`).then(handleResponse),

  // Builds
  builds: {
    checkAuth: (provider: string) =>
      fetch(`${API_BASE_URL}/api/builds/auth/${provider}`).then(handleResponse),
    
    authenticate: (provider: string) =>
      fetch(`${API_BASE_URL}/api/builds/auth/${provider}`, {
        method: 'POST',
      }).then(handleResponse),
    
    fetchRepositories: (provider: string) =>
      fetch(`${API_BASE_URL}/api/builds/repositories/fetch?provider=${provider}`)
        .then(handleResponse),
    
    listRepositories: () =>
      fetch(`${API_BASE_URL}/api/builds/repositories`).then(handleResponse),
    
    connectRepository: (config: any) =>
      fetch(`${API_BASE_URL}/api/builds/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).then(handleResponse),
    
    getRepositoryDetails: (id: string) =>
      fetch(`${API_BASE_URL}/api/builds/repositories/${id}`).then(handleResponse),
    
    updateRepository: (id: string, updates: any) =>
      fetch(`${API_BASE_URL}/api/builds/repositories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
    
    deleteRepository: (id: string) =>
      fetch(`${API_BASE_URL}/api/builds/repositories/${id}`, {
        method: 'DELETE',
      }).then(handleResponse),
    
    listBuilds: () =>
      fetch(`${API_BASE_URL}/api/builds`).then(handleResponse),
    
    buildImage: (config: any) =>
      fetch(`${API_BASE_URL}/api/builds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).then(handleResponse),
  },
};

export { APIError };

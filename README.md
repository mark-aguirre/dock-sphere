# Container Hub Plus

A comprehensive Docker management platform built with Next.js, featuring:

• **Advanced Container Orchestration** - Complete Docker ecosystem management
• **Real-time Monitoring** - WebSocket-based live updates and statistics tracking  
• **Git Integration** - Direct deployment from GitHub/GitLab repositories
• **Enhanced Logging** - Enterprise-grade structured logging with request correlation
• **Secure Authentication** - Google OAuth integration
• **Template Deployment** - Quick-deploy application templates
• **Docker Compose Support** - Multi-container stack management
• **Performance Monitoring** - Request correlation and performance tracking

## Features

- 🔐 **Google Authentication** - Secure sign-in with Google OAuth
- 📦 **Container Management** - Create, start, stop, and manage Docker containers
- 🖼️ **Image Management** - Pull, build, and manage Docker images
- 🌐 **Network Management** - Create and manage Docker networks
- 💾 **Volume Management** - Manage persistent storage volumes
- 📋 **Application Templates** - Quick deploy common applications (PostgreSQL, Redis, etc.)
- ⚡ **Real-time Updates** - WebSocket-based live updates
- 📊 **Statistics & Monitoring** - Real-time resource usage tracking
- 🐙 **Git Integration** - Build and deploy directly from GitHub/GitLab
- 📚 **Docker Compose** - Manage multi-container stacks
- 🔍 **Search & Filter** - Advanced search and filtering capabilities
- 📝 **Enhanced Logging** - Structured logging with request correlation, performance monitoring, and investigation tools

## Prerequisites

- Node.js 18+
- Docker Engine installed and running
- Access to Docker socket (usually `/var/run/docker.sock`)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings.

### Google Authentication Setup

To enable Google Sign-In, you need to:

1. Create a Google Cloud project and OAuth credentials
2. Configure the OAuth consent screen
3. Add your credentials to `.env.local`

See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) for detailed instructions.

### Logging Configuration

Configure logging behavior with these environment variables:

```bash
# Logging Configuration
LOG_LEVEL=INFO                    # ERROR, WARN, INFO, DEBUG, TRACE
ENABLE_REQUEST_LOGGING=true       # Log all API requests/responses
ENABLE_PERFORMANCE_LOGGING=true   # Log performance metrics
ENABLE_DOCKER_LOGGING=true        # Log Docker operations
LOG_FORMAT=pretty                 # pretty (dev) or json (prod)
MAX_LOG_SIZE=10485760            # Maximum log size in bytes (10MB)
LOG_RETENTION_DAYS=30            # Log retention period
```

See [docs/LOGGING.md](./docs/LOGGING.md) for detailed logging documentation.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
container-hub-plus/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (backend)
│   ├── containers/        # Container pages
│   ├── images/            # Image pages
│   ├── networks/          # Network pages
│   ├── volumes/           # Volume pages
│   ├── templates/         # Template pages
│   └── ...
├── components/            # React components
├── lib/                   # Backend services and utilities
│   ├── services/         # Business logic layer
│   ├── config/           # Configuration files
│   ├── middleware/       # Request middleware
│   ├── docker.ts         # Docker client
│   ├── docker-logger.ts  # Docker operation logging
│   ├── logger.ts         # Enhanced logging system
│   ├── errors.ts         # Error handling
│   └── websocket-manager.ts
├── docs/                  # Documentation
│   └── LOGGING.md        # Logging system documentation
├── __tests__/            # Test files
└── types/                # TypeScript types
```

## Architecture

- **Frontend**: Next.js 14 with App Router, React Server Components
- **Backend**: Next.js API Routes with enhanced logging middleware
- **Real-time**: WebSocket for live updates
- **Docker**: Dockerode for Docker API integration
- **Logging**: Structured logging with request correlation and performance monitoring
- **Testing**: Jest + fast-check for property-based testing

## API Routes

All API routes are under `/api` with comprehensive logging:

- `/api/health` - Health check
- `/api/containers` - Container management
- `/api/images` - Image management
- `/api/networks` - Network management
- `/api/volumes` - Volume management
- `/api/templates` - Application templates
- `/api/stacks` - Docker Compose stacks
- `/api/stats` - Container statistics
- `/api/git` - Git integration

Each API route includes:
- Request/response logging with unique request IDs
- Performance monitoring and timing
- Error tracking with full context
- Docker operation logging

## Logging and Debugging

The application includes a comprehensive logging system for debugging and monitoring:

- **Structured Logs**: JSON format in production, pretty format in development
- **Request Correlation**: Every request gets a unique ID for tracing
- **Performance Monitoring**: Automatic timing of operations with slow request warnings
- **Docker Operation Tracking**: Specialized logging for all Docker operations
- **Error Context**: Rich error information with stack traces and operation context

### Log Levels

- `ERROR`: Critical errors requiring immediate attention
- `WARN`: Warning conditions that should be monitored
- `INFO`: General application flow information
- `DEBUG`: Detailed debugging information
- `TRACE`: Very detailed tracing information

### Investigation

Use request IDs to trace operations across the system:

```bash
# Find all logs for a specific request
grep "requestId=req_123" logs.txt

# Find slow operations
grep "duration.*[0-9]{4,}" logs.txt

# Find Docker errors
grep "Docker Error" logs.txt
```

## Building for Production

```bash
npm run build
npm start
```

For production deployments, set `LOG_FORMAT=json` and appropriate `LOG_LEVEL` for optimal performance.

## License

MIT

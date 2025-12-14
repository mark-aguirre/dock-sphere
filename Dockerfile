# Use the official Node.js 18 Alpine image as base
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat su-exec
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Set build-time environment variables for Next.js build
ENV DOCKER_SOCKET=/var/run/docker.sock

# Build arguments for environment variables (passed during build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG GITHUB_CALLBACK_URL
ARG GITLAB_CLIENT_ID
ARG GITLAB_CLIENT_SECRET
ARG GITLAB_CALLBACK_URL
ARG ADMIN_EMAILS

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
ENV GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
ENV GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}
ENV GITLAB_CLIENT_ID=${GITLAB_CLIENT_ID}
ENV GITLAB_CLIENT_SECRET=${GITLAB_CLIENT_SECRET}
ENV GITLAB_CALLBACK_URL=${GITLAB_CALLBACK_URL}
ENV ADMIN_EMAILS=${ADMIN_EMAILS}

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install su-exec for user switching
RUN apk add --no-cache su-exec

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create docker group and add nextjs user to it
# Use a different GID initially, will be updated at runtime
RUN addgroup --system --gid 998 docker || addgroup --system docker
RUN adduser nextjs docker

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create startup script that handles Docker socket permissions
RUN echo '#!/bin/sh' > docker-startup.sh && \
    echo 'echo "Starting Container Hub Plus in Docker..."' >> docker-startup.sh && \
    echo 'echo "Docker environment detected:"' >> docker-startup.sh && \
    echo 'echo "- Node environment: $NODE_ENV"' >> docker-startup.sh && \
    echo 'echo "- Hostname: $HOSTNAME"' >> docker-startup.sh && \
    echo 'echo "- Port: $PORT"' >> docker-startup.sh && \
    echo 'echo "- Docker socket: $DOCKER_SOCKET"' >> docker-startup.sh && \
    echo '' >> docker-startup.sh && \
    echo '# Fix Docker socket permissions' >> docker-startup.sh && \
    echo 'if [ -S /var/run/docker.sock ]; then' >> docker-startup.sh && \
    echo '  DOCKER_GID=$(stat -c %g /var/run/docker.sock)' >> docker-startup.sh && \
    echo '  echo "Docker socket GID: $DOCKER_GID"' >> docker-startup.sh && \
    echo '  if [ "$DOCKER_GID" != "999" ]; then' >> docker-startup.sh && \
    echo '    echo "Updating docker group GID to match host..."' >> docker-startup.sh && \
    echo '    groupmod -g $DOCKER_GID docker 2>/dev/null || true' >> docker-startup.sh && \
    echo '  fi' >> docker-startup.sh && \
    echo '  echo "Docker socket permissions fixed"' >> docker-startup.sh && \
    echo 'else' >> docker-startup.sh && \
    echo '  echo "Warning: Docker socket not found at /var/run/docker.sock"' >> docker-startup.sh && \
    echo 'fi' >> docker-startup.sh && \
    echo '' >> docker-startup.sh && \
    echo 'echo "Switching to nextjs user and starting server..."' >> docker-startup.sh && \
    echo 'exec su-exec nextjs node server.js' >> docker-startup.sh && \
    chmod +x docker-startup.sh

# Don't switch to nextjs user yet - startup script needs root permissions
EXPOSE 3009

ENV PORT=3009
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# Use startup script instead of direct node command
CMD ["./docker-startup.sh"]
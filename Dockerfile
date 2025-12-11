# Use the official Node.js 18 Alpine image as base
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
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
ENV NEXT_TELEMETRY_DISABLED 1

# Set build-time environment variables for Next.js build
ENV DOCKER_SOCKET=/var/run/docker.sock
ENV NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
ENV DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres
ENV SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create startup script directly
RUN echo '#!/bin/sh' > docker-startup.sh && \
    echo 'echo "Starting Container Hub Plus in Docker..."' >> docker-startup.sh && \
    echo 'echo "Docker environment detected:"' >> docker-startup.sh && \
    echo 'echo "- Node environment: $NODE_ENV"' >> docker-startup.sh && \
    echo 'echo "- Hostname: $HOSTNAME"' >> docker-startup.sh && \
    echo 'echo "- Port: $PORT"' >> docker-startup.sh && \
    echo 'echo "- Docker socket: $DOCKER_SOCKET"' >> docker-startup.sh && \
    echo 'echo "Starting Next.js server..."' >> docker-startup.sh && \
    echo 'exec node server.js' >> docker-startup.sh && \
    chmod +x docker-startup.sh

USER nextjs

EXPOSE 3009

ENV PORT 3009
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Use startup script instead of direct node command
CMD ["./docker-startup.sh"]
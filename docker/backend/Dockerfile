# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev:backend"]

# Build stage
FROM base AS build
RUN npm ci --only=production
COPY . .
RUN npm run build:shared
RUN npm run build:backend

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=backend:nodejs /app/packages/backend/dist ./dist
COPY --from=build --chown=backend:nodejs /app/packages/backend/package*.json ./
COPY --from=build --chown=backend:nodejs /app/packages/shared/dist ./node_modules/@local-vendor-ai/shared/dist
COPY --from=build --chown=backend:nodejs /app/packages/shared/package.json ./node_modules/@local-vendor-ai/shared/

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

USER backend

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/index.js"]
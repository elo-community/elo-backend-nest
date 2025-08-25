# Multi-stage build for ELO Community Monorepo
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm ci

# Copy source code
COPY . .

# Build stage for contracts
FROM base AS contracts-builder
WORKDIR /app/packages/contracts
# Copy contracts package.json and install dependencies
COPY packages/contracts/package*.json ./
RUN npm ci
# Copy contracts source code
COPY packages/contracts/ ./
RUN npm run compile

# Build stage for backend
FROM base AS backend-builder
WORKDIR /app/packages/backend
# Copy backend package.json and install dependencies
COPY packages/backend/package*.json ./
RUN npm ci
# Copy backend source code
COPY packages/backend/ ./
RUN npm run build
RUN npm prune --omit=dev

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy runtime dependencies and built application
COPY --from=backend-builder /app/packages/backend/package*.json ./
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/packages/backend/dist ./dist

# Copy built contracts from builder stage (if needed)
COPY --from=contracts-builder /app/packages/contracts/artifacts ./artifacts
COPY --from=contracts-builder /app/packages/contracts/typechain-types ./typechain-types

# Copy shared files
COPY --from=backend-builder /app/packages/backend/src/shared ./src/shared

# Set production environment
ENV NODE_ENV=production
ENV NETWORK=very

# Verify build output
RUN ls -la dist/ && \
    ls -la dist/main.js

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
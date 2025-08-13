# Multi-stage build for ELO Community Monorepo
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/*/package*.json ./

# Install dependencies for all packages
RUN npm ci

# Copy source code
COPY . .

# Build stage for contracts
FROM base AS contracts-builder
WORKDIR /app/packages/contracts
RUN npm run compile

# Build stage for backend
FROM base AS backend-builder
WORKDIR /app/packages/nest-backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY packages/nest-backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built backend from builder stage
COPY --from=backend-builder /app/packages/nest-backend/dist ./dist

# Copy built contracts from builder stage (if needed)
COPY --from=contracts-builder /app/packages/contracts/artifacts ./artifacts
COPY --from=contracts-builder /app/packages/contracts/typechain-types ./typechain-types

# Copy shared files
COPY --from=backend-builder /app/packages/nest-backend/src/shared ./src/shared

# Verify build output
RUN ls -la dist/ && \
    ls -la dist/main.js

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
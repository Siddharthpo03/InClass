# Multi-stage build for InClass backend
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for sharp prebuilt binaries)
RUN npm ci

# Stage 2: Production
FROM node:22-alpine

# Install dumb-init to properly handle signals
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY backend ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

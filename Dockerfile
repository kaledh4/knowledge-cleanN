# Multi-stage build for better space optimization
FROM node:20-alpine AS dependencies

# Install required runtime libs for native modules (better-sqlite3)
RUN apk add --no-cache libc6-compat libstdc++ python3 make g++ && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci --no-audit --no-fund

# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependencies from previous stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=dependencies /usr/src/app/package*.json ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install required runtime libs for better-sqlite3
RUN apk add --no-cache libc6-compat libstdc++ && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Set environment variables for production
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DB_PATH=/usr/src/app/data/knowledge.db

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/migrations ./migrations

# Create data directory with proper permissions
RUN mkdir -p /usr/src/app/data && \
    chmod -R 777 /usr/src/app/data

# Expose port
EXPOSE 3000

# Create volume for persistent data
VOLUME ["/usr/src/app/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
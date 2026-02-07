# ============================================
# Base stage - common dependencies
# ============================================
FROM node:20-alpine AS base

WORKDIR /backend

# Install security updates
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache wget

# ============================================
# Dependencies stage - install node modules
# ============================================
FROM base AS dependencies

COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci --prefer-offline

# ============================================
# Development stage - for local development
# ============================================
FROM dependencies AS development

# Copy source code
COPY . .

# Set development environment
ENV NODE_ENV=dev

EXPOSE 4000

CMD ["npm", "run", "dev"]

# ============================================
# Builder stage - compile TypeScript
# ============================================
FROM dependencies AS builder

COPY . .

RUN npm run build

# ============================================
# Production stage - minimal runtime image
# ============================================
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --prefer-offline && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /backend/dist ./dist

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs /backend

# Switch to non-root user
USER nodejs

ENV NODE_ENV=prod

EXPOSE 4000

CMD ["node", "dist/app.js"]

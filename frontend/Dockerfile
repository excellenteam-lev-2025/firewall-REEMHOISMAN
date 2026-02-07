# ============================================
# Base stage - common dependencies
# ============================================
FROM node:20-alpine AS base

WORKDIR /frontend

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
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ============================================
# Builder stage - build Next.js app
# ============================================
FROM dependencies AS builder

COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================
# Production stage - minimal runtime image
# ============================================
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --prefer-offline && npm cache clean --force

# Copy built application from builder
COPY --from=builder /frontend/.next ./.next
COPY --from=builder /frontend/public ./public
COPY --from=builder /frontend/next.config.ts ./

# Set proper ownership
RUN chown -R nextjs:nodejs /frontend

# Switch to non-root user
USER nextjs

ENV NODE_ENV=prod
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "start"]
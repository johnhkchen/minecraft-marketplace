# Multi-stage build for Minecraft Marketplace
# Following 000_consolidated_specification.md architecture with PostgreSQL

FROM node:22-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Build stage  
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 astro

# Copy built application
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=deps --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astro:nodejs /app/package.json ./package.json

# Create uploads directory for file uploads
RUN mkdir -p uploads && chown astro:nodejs uploads

USER astro

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

# Health check for PostgreSQL app
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "./dist/server/entry.mjs"]
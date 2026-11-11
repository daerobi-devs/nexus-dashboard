# ==============================================================================
# BUATIN x Nexus Command Center - Production Multi-Stage Dockerfile
# Optimized for Coolify v4 / Docker using Node.js 24 LTS (Debian Bookworm Slim)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder (Compile Vite TypeScript & Tailwind Frontend)
# ------------------------------------------------------------------------------
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests first for Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including Vite & TypeScript devDependencies regardless of build-time NODE_ENV)
RUN NODE_ENV=development npm ci --include=dev --no-audit --no-fund

# Copy full application source
COPY . .

# Compile production SPA bundle into dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Install production-only dependencies (includes sharp prebuilds & pg driver)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled frontend assets and runtime server
COPY --from=builder /app/dist ./dist
COPY server.mjs ./
COPY server ./server

# Ensure persistent SQLite fallback directory exists
RUN mkdir -p /app/data

# Expose container HTTP port (map 3000 in Coolify Ports Exposes)
EXPOSE 3000

# Lightweight healthcheck for Coolify & container orchestrators
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start standalone Node.js 24 production server
CMD ["node", "server.mjs"]

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — layer cached unless dependencies change
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript → dist/
COPY . .
RUN npm run build


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies — no devDependencies in final image
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage only — no source, no node_modules bloat
COPY --from=builder /app/dist ./dist

# ── Security: run as non-root user ────────────────────────────────────────────
# node:20-alpine ships with a built-in 'node' user (uid 1000)
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Healthcheck — Docker marks container unhealthy if /health stops responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]

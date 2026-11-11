# FrameCompile: the Next.js app, including the conversion engine.
#
# Follows Next.js's standalone Docker setup, on Debian slim instead of Alpine:
# conversions run headless Chromium through playwright-core, and Playwright's
# Chromium doesn't run on Alpine. Only the Chromium headless shell the engine
# launches is installed, at the version playwright-core in package.json expects.

ARG NODE_IMAGE=node:22-bookworm-slim

# Build stage
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first, so they are cached until package files change
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application. No secrets are needed here: the app reads its
# environment variables when a request needs them, not at build time.
RUN npm run build

# Production stage
FROM ${NODE_IMAGE}

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# git pushes converted projects to GitHub; dumb-init forwards signals so the
# server shuts down cleanly on redeploys
RUN apt-get update \
    && apt-get install -y --no-install-recommends git dumb-init ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Chromium headless shell plus the libraries it needs, at the version this
# playwright-core expects. Cached until playwright-core changes.
COPY --from=builder /app/node_modules/playwright-core /tmp/playwright-core
RUN node /tmp/playwright-core/cli.js install --with-deps --only-shell chromium \
    && rm -rf /tmp/playwright-core /var/lib/apt/lists/*

# The standalone server with only the dependencies it uses, plus the static
# files it serves
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# The image's own non-root user. Conversions work in /tmp, which it can write.
USER node

# server.js listens on $PORT (Railway and Render set it), 3000 by default
EXPOSE 3000

# Use dumb-init to run the application
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

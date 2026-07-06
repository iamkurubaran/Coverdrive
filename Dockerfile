# Coverdrive — single-container deploy for Render.com
# Builds the Vite client, then runs the Express server, which serves
# both the API and the built client from one process.

# ---- 1. Build the client -------------------------------------------------
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- 2. Install server deps (prod only) ----------------------------------
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev

# ---- 3. Runtime -----------------------------------------------------------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY server/ ./server/
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY --from=client-build /app/client/dist ./client/dist

# Writable dir for the cards-rated counter; run as non-root
RUN mkdir -p /app/server/data && chown -R node:node /app
USER node

# Render injects PORT; the server reads it (falls back to 8787 locally)
EXPOSE 8787
CMD ["node", "server/index.js"]

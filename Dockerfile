# Taxila web + API image (built in Azure Container Registry from the GitHub repo).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY data ./data
# server/ imports pure-logic .ts from src/ (grading re-check, duplex rules); node 22 strips the types at load.
# tests/runtime-image-imports.test.mjs fails if a server import reaches a path this stage does not copy.
COPY src ./src
EXPOSE 8080
CMD ["node", "server/serve.mjs"]

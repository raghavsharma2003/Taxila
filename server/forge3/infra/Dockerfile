# forge3 visual-QA service (round 3, stream forge; server/forge3/qa-service.mjs). It renders artifacts that came from a
# model or a generator in Chromium, so it runs HERE, in the untrusted environment (like infra/studio-qa: ingress internal,
# egress denied, no secrets, no child data), never in the trusted API. Built by ACR from the GitHub tree:
#   az acr build -r <acr> -f server/forge3/infra/Dockerfile -t forge3-qa:<sha> .
# Node 22 + Chromium come from the Playwright image pinned to the driver's version. The harness page is built at image
# build time from the same src/ the product ships (src/studio, src/studio-v2, src/modules/whiteboard, src/play), so the QA
# renders exactly what a child's browser renders.
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY src ./src
COPY shared ./shared
COPY server/forge3 ./server/forge3
COPY public/fonts ./public/fonts
ENV FORGE3_QA_OUT=/app/harness
RUN npx vite build --config server/forge3/qa/vite.config.mjs

FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/ms-playwright FORGE3_QA_LOCAL=1 FORGE3_QA_HARNESS=/app/harness PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm install --no-save playwright@1.63.0 && npm cache clean --force
COPY --from=build /app/harness ./harness
COPY shared ./shared
COPY server/forge3 ./server/forge3
COPY public/fonts ./public/fonts
RUN chown -R pwuser:pwuser /app
USER pwuser
EXPOSE 8080
CMD ["node", "server/forge3/qa-service.mjs"]

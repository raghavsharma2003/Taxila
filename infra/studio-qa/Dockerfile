# Live Studio gate service (LIVE-STUDIO D7 / S2): the gate plays generated code in Chromium, so it runs HERE, in the
# untrusted environment `taxila-forge-untrusted` (ingress internal, egress denied, no secrets, no child data), never in
# the trusted API. Built by ACR taxilacr from the GitHub tree (scripts/deploy-studio-qa.mjs). Node 22 + Chromium come
# from the Playwright image pinned to the same version as the driver. Only the gate's own files are copied in.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/ms-playwright STUDIO_QA_LOCAL=1 PORT=8080
WORKDIR /app
COPY infra/studio-qa/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/studio/qa ./server/studio/qa
COPY server/studio/archetypes ./server/studio/archetypes
COPY server/studio/fixers.js ./server/studio/fixers.js
COPY infra/studio-qa/server.mjs ./infra/studio-qa/server.mjs
RUN chown -R pwuser:pwuser /app
USER pwuser
EXPOSE 8080
CMD ["node", "infra/studio-qa/server.mjs"]

# Forge G2 runner (FACTORY.md §2.2 forge-runner, Phase 0): one ACA Job execution = one build = one disposable
# container (replicaRetryLimit 0). Built by ACR taxilacr (scripts/forge-g2-deploy.mjs). Node 22 + Chromium come from
# the Playwright image pinned to the same version as playwright-core, so the browser and the driver always match.
# Agent-written code executes ONLY inside Chromium (opaque-origin iframe, hash CSP, dead proxy); never in node.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/ms-playwright FORGE_CHROMIUM_SANDBOX=1
WORKDIR /app
COPY infra/forge-runner/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
# only what a build reads: the G2 harness/kit/gate, the kit-truth helpers it imports, and the verified kits
COPY server/forge/g2 ./server/forge/g2
COPY server/forge/kitmath.js ./server/forge/kitmath.js
COPY server/director/items.js ./server/director/items.js
COPY server/director/register.js ./server/director/register.js
COPY server/azure.js ./server/azure.js
COPY data/kits ./data/kits
RUN chown -R pwuser:pwuser /app
# non-root, so Chromium's own sandbox can start (the gate records whether it did)
USER pwuser
CMD ["node", "server/forge/g2/job-entry.js"]

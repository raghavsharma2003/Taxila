# The probe fleet image (BUILD-PLAN W1-D item 5): Playwright's Chromium with real UDP for WebRTC, the probe runner and
# the fake-microphone WAV. Built by infra/probes/deploy.mjs from an explicit file list (no repo .dockerignore).
FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /app
RUN echo '{"type":"module","private":true,"dependencies":{"playwright":"1.63.0","@neondatabase/serverless":"^1.2.0"}}' > package.json \
 && npm install --no-audit --no-fund --omit=dev
COPY infra/azure.mjs infra/azure.mjs
COPY infra/probes infra/probes
COPY tests/prod/lib.mjs tests/prod/lib.mjs
# W1-D acceptance files that must run from Azure (no sandbox proxy): the eyes check runs ad hoc (deploy.mjs --adhoc)
COPY tests/prod/w1d-eyes.mjs tests/prod/w1d-eyes.mjs
# W1-A: the text-lane timing bar (self-contained; imports only ./lib.mjs) must run from Azure, not the sandbox
COPY tests/prod/w1a-text-voice.mjs tests/prod/w1a-text-voice.mjs
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright NODE_ENV=production
CMD ["node", "infra/probes/probe.mjs"]

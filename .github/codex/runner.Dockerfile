FROM node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752

# The slim Node image removes its build-time CA bundle. Codex's native HTTPS
# client needs the OS trust store even though npm uses Node's bundled roots.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && test -s /etc/ssl/certs/ca-certificates.crt

RUN npm install --global --ignore-scripts @openai/codex@0.155.1 \
    && npm cache clean --force

ENTRYPOINT ["codex"]

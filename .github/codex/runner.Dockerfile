FROM node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752

RUN npm install --global --ignore-scripts @openai/codex@0.155.1 \
    && npm cache clean --force

ENTRYPOINT ["codex"]

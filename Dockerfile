# Node.js pour le serveur Fastify et Expo Metro.
# Docker prepare l'environnement, sans construire un APK/IPA.
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
EXPOSE 3001 8081
CMD ["bash"]

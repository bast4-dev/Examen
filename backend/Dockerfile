FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Dépendances de production uniquement (couche mise en cache tant que package*.json ne change pas)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN mkdir -p logs && chown -R node:node /app

# Le conteneur ne tourne pas en root
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "server.js"]

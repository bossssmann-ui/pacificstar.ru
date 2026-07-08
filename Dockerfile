# Timeweb App Platform — API-only backend (static site stays on shared hosting)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

ENV NODE_ENV=production
ENV API_ONLY=true
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]

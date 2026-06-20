# ==========================================================
# YourCourse — Dockerfile Backend (Node.js / Express)
# Multi-stage: development con hot-reload, production optimizado
# ==========================================================

# ── Etapa base: imagen mínima de Node.js ──────────────────
FROM node:22-alpine AS base

WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt y pg
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de dependencias primero (cache eficiente)
COPY package*.json ./

# ── Etapa de desarrollo ───────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

# Instalar TODAS las dependencias (incluyendo devDependencies)
RUN npm install

# Copiar código fuente
COPY . .

EXPOSE 3000

# Hot-reload con nodemon
CMD ["npx", "nodemon", "--watch", "src", "--ext", "js,json", "src/index.js"]

# ── Etapa de producción ───────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Solo dependencias de producción
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]

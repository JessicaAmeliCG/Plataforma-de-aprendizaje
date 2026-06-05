# ==========================================================
# YourCourse — Dockerfile Frontend (React + Vite)
# Multi-stage: development con HMR, production con Nginx
# ==========================================================

# ── Etapa base ────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# ── Etapa de desarrollo ───────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

# Instalar todas las dependencias
RUN npm install

COPY . .

EXPOSE 5173

# Vite dev server con HMR accesible desde el host
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ── Etapa de build ────────────────────────────────────────
FROM base AS builder

ENV NODE_ENV=production

RUN npm ci

COPY . .

RUN npm run build

# ── Etapa de producción (Nginx) ───────────────────────────
FROM nginx:alpine AS production

# Copiar el build de Vite al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

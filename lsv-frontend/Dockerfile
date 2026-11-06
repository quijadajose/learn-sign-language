# Base stage for dependencies
FROM node:24-alpine3.22 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Build stage for production
FROM base AS builder
COPY . .
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

# Production stage with Nginx
FROM nginx:1.31.1-alpine3.23-slim AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

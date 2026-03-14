# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config for SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

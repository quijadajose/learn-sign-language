FROM node:24-alpine3.22 AS development

WORKDIR /src/app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY test ./test
COPY nest-cli.json ./
COPY tsconfig*.json ./

RUN npm run build

################
## PRODUCTION ##
################
# INF-08: solo runtime y dependencias de producción; sin src, test ni devDependencies; no como root.
FROM node:24-alpine3.22 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=development /src/app/dist ./dist

# Carpetas con escritura para el usuario no root (volúmenes con nombre heredan el dueño).
RUN mkdir -p shared uploads && chown -R node:node /src/app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD [ "node", "dist/main.js" ]

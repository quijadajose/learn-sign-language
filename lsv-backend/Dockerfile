FROM node:20.18.3-alpine3.21 AS development

WORKDIR /src/app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY test ./test
COPY nest-cli.json .
COPY tsconfig*.json .
COPY .env* ./

RUN npm run build

################
## PRODUCTION ##
################
FROM node:20.18.3-alpine3.21 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /src/app

COPY --from=development /src/app/ .

EXPOSE 8080

# Run app
CMD [ "node", "dist/main" ]
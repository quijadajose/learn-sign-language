FROM node:24-alpine3.22 AS development

WORKDIR /src/app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY test ./test
COPY nest-cli.json ./
COPY tsconfig*.json ./

RUN npm run build

################
## PRODUCTION ##
################
FROM node:24-alpine3.22 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /src/app

COPY --from=development /src/app/ .

EXPOSE 3000

# Run app
CMD [ "node", "dist/main" ]

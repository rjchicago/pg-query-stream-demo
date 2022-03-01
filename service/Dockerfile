FROM node:17-alpine as base

RUN apk add --update curl

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --quiet
COPY src ./src

EXPOSE 3000

CMD [ "npm", "run", "start" ]
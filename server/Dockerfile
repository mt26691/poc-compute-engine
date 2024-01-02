FROM node:16-alpine

WORKDIR /server

COPY package* .

RUN npm ci

COPY . .

RUN npm run build

ENTRYPOINT ["node", "build/index.js"]

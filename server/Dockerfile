FROM node:16-alpine

WORKDIR /server

COPY package* .

RUN npm ci

COPY . .

RUN npm run build

CMD ["node", "build/index.js"]

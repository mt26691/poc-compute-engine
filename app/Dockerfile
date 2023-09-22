FROM node:16-alpine

COPY package* .

RUN npm ci

COPY . .

RUN npm run build

CMD ["node", "build/server.js"]

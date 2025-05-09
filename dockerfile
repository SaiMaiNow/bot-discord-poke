FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV TOKEN=
ENV CLIENT_ID=
ENV GUILD_ID=

CMD ["npm", "run", "start"]

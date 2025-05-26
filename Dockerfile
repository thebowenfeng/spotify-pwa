FROM node:20.15.1

WORKDIR /app

RUN npm install --global http-server

ADD /build /app

CMD ["npx", "http-server", "./"]
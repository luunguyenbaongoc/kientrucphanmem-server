FROM node:18.20-alpine AS test
WORKDIR /usr/src/app
COPY  ["package.json", "package-lock.json", "./"]
RUN npm i
ENV PATH="./node_modules/.bin:$PATH"
COPY ./ ./
RUN npm run build


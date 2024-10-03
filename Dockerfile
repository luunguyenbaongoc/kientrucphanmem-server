FROM node:18.15.0-alpine as development
WORKDIR /usr/src/app
COPY  ["package.json", "package-lock.json", "./"]
RUN npm i 
COPY ./ ./
RUN npm run build


# /usr/src/app/dist/


FROM node:18.15.0-alpine AS production
WORKDIR /usr/src/app
COPY  ["package.json", "package-lock.json", "./"]
RUN npm i --production
COPY  --from=development /usr/src/app/dist ./dist
CMD [ "node", "dist/main.js" ]
FROM node:slim

WORKDIR /kevgir

COPY . .

RUN yarn install --production


CMD [ "yarn", "start" ]
FROM node:12-alpine
RUN mkdir -p /usr/src/app
RUN apk add vim python python-dev py-pip build-base curl ffmpeg
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app
EXPOSE 8700
WORKDIR /usr/src/app
CMD [ "npm", "start" ]

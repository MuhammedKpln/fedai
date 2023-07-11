FROM node:alpine


RUN apk update
RUN apk add git libwebp-tools ffmpeg-libs ffmpeg


WORKDIR /usr/app/fedai
RUN git clone https://github.com/MuhammedKpln/fedai /usr/app/fedai

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer



RUN npm install

RUN npm run build

WORKDIR /usr/app/fedai/build/src/


CMD ["node", "main.js"]
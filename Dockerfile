FROM node:20-alpine

RUN apk add git libwebp-tools ffmpeg-libs ffmpeg

COPY . /root/fedai
WORKDIR /root/fedai/
RUN npm install -g pm2 
RUN npm install
RUN npm run build
WORKDIR /root/fedai/build/src/
CMD ["pm2-runtime", "start", "main.js"]

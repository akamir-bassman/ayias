
FROM node:16
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

RUN mkdir -p /frontend
WORKDIR /frontend

# ADD . /app
COPY .next ./.next
COPY public ./public
COPY package.json ./package.json
COPY next.config.js ./next.config.js
COPY .env ./.env
ENV PORT 19504
RUN npm i --production --legacy-peer-deps
RUN npm i --save @nrwl/next --legacy-peer-deps
RUN npm i -g next
# CMD next start -p $PORT
CMD npm start
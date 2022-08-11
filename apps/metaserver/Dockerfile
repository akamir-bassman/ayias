FROM node:16-alpine
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
RUN mkdir -p /workspace
WORKDIR /workspace
COPY ./package.json ./package.json
RUN npm i --omit=dev --legacy-peer-deps
COPY . .
CMD ["node", "main.js", "--max-old-space-size=8192"]
# CMD ["sleep", "36000"]
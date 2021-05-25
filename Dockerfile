FROM node:12
WORKDIR /app
COPY src/ src/
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
RUN yarn install
RUN yarn build
CMD yarn cron
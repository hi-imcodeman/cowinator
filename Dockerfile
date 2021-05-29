FROM node:14
WORKDIR /app
COPY src/ src/
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
ENV TZ="Asia/Kolkata"
RUN yarn install
RUN yarn build
CMD yarn dockerEntrypoint
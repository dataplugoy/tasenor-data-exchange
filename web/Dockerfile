FROM node:18-alpine

WORKDIR /var/app

RUN apk update
RUN apk upgrade
RUN apk add nano curl git openssh-client bash python3 make gcc g++ libc-dev jq
RUN ln -sf /usr/bin/python3 /usr/bin/python

RUN npm install -g pnpm

ADD package.json .
RUN pnpm install

ADD docs/ docs/
ADD public/ public/
ADD src/ src/
ADD i18n/ i18n/
ADD docusaurus.config*.ts .
ADD sidebars.ts .

RUN pnpm build

CMD ["pnpm", "run", "docker"]

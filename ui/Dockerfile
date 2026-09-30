FROM node:24-alpine

WORKDIR /var/app

RUN apk update
RUN apk upgrade
RUN apk add nano curl git openssl openssh-client bash python3 make gcc g++ libc-dev jq
RUN ln -sf /usr/bin/python3 /usr/bin/python

RUN npm install -g pnpm@10.27.0

ADD package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

ADD tsconfig.json .
ADD src src

RUN pnpm build

CMD ["pnpm", "run", "docker"]

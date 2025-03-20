# Tasenor Data Exchange (TaDeX)

[![TaDeX CI](https://github.com/dataplugoy/tasenor-data-exchange/actions/workflows/node.js.yml/badge.svg)](https://github.com/dataplugoy/tasenor-data-exchange/actions/workflows/node.js.yml)

## Features

* High accuracy math.
* Automatically handle different currencies.
* Keep record for assets bought and sold and calculate profits and losses.
* Handle splits and stock renamings.
* Comprehensive testing with real world data.

## Database

Development database is accessible with
```
psql postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex
```

To initialize it, first do
```
cd database
pnpm run dev
```
then the server will create initial tables
```
cd backend
pnpm run dev
```

To reset it later
```
cd database
pnpm run clear
pnpm run init
```

## Processing Sample

To run test batch
```
bin/tadex.mjs run 'Unit Testing'
```


## Building a Staging Release

You need to set DOCKER_USER and DOCKER_PASSWORD first.

* Edit version number on the top level `package.json`.
* Build
  ```
  pnpm build-version
  bin/docker-publish latest
  ```
* TODO: Tag and push.
* Release
  ```
  bin/update-staging
  ```


## Updating Production

* Build
  ```
  bin/docker-publish prod
  ```
* Release
  ```
  bin/update-prods
  ```

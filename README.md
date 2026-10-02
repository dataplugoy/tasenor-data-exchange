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
* Release (we have only prod currently)
  ```
  bin/update-staging
  ```


## Updating Production

* Build
  ```
  bin/docker-publish prod
  ```
* Release (production runs in the shared stack on `ssh dataplug`, in `/home/wigy/dataplug`)
  ```
  bin/update-prod
  ```
  The API runs `prisma db push --accept-data-loss` at start, so check schema changes before a release.

## Copying Production Locally

```
ssh dataplug 'docker exec tadex-db sh -c "pg_dump --clean --if-exists -U dev -p 7300 tadex"' > prod.sql
docker exec -i tadex-db psql -q postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex < prod.sql
```

Configured outputs are live, so disable them before experimenting:
```
docker exec tadex-db psql postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex -c \
  "update output_destinations set settings = settings || jsonb_build_object('_originalType', type::text), type='NO_ACTION' where type <> 'NO_ACTION'"
```

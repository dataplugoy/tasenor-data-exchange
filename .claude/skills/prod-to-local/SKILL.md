---
name: prod-to-local
description: Copy the TaDeX production database (ssh dataplug) into the local tadex-db, neutralize live outputs and prod-encrypted secrets, and launch the backend and UI dev servers. Use when asked to update/refresh the local copy from prod, pull prod data, or start the dev environment on prod data.
---

# Copy prod to local and launch dev servers

Work from the repo root. `S` is the session scratchpad directory.

## 1. Start the local DB and dump prod (in parallel)

```bash
docker compose up -d tadex-db --wait
ssh dataplug 'docker exec tadex-db sh -c "pg_dump --clean --if-exists -U dev -p 7300 tadex"' > $S/dump.sql
```

The dump only reads prod. Check that it ends with `-- PostgreSQL database dump complete`.

## 2. Load it locally

This replaces the local data.

```bash
docker exec -i tadex-db psql -q -U dev -p 7300 tadex < $S/dump.sql
```

## 3. Neutralize live outputs and prod secrets

TASENOR outputs point at the live bookkeeper-api.tasenor.com, so turn them into `NO_ACTION`. Values starting with `enc:v1:` are encrypted with the prod SECRET. Decrypting them locally throws (for example, batch rollback returns 500), so drop every such key from `settings`.

```bash
docker exec tadex-db psql -U dev -p 7300 tadex \
  -c "update output_destinations set type='NO_ACTION' where type='TASENOR'" \
  -c "update output_destinations set settings = (select coalesce(jsonb_object_agg(k, v), '{}') from jsonb_each(settings) as e(k, v) where not (jsonb_typeof(v) = 'string' and v #>> '{}' like 'enc:v1:%')) where settings::text like '%enc:v1:%'" \
  -c "update services set settings = (select coalesce(jsonb_object_agg(k, v), '{}') from jsonb_each(settings) as e(k, v) where not (jsonb_typeof(v) = 'string' and v #>> '{}' like 'enc:v1:%')) where settings::text like '%enc:v1:%'" \
  -c "select (select count(*) from output_destinations where type='TASENOR' or settings::text like '%enc:v1:%') as outputs_left, (select count(*) from services where settings::text like '%enc:v1:%') as services_left"
```

Both counts must be 0. If they aren't, a secret is nested deeper in the JSON: inspect it and remove it by hand.

## 4. Launch the dev servers

Don't use `pnpm dev` in `backend`. It runs `prisma db push --accept-data-loss`, which Prisma refuses to run from Claude Code without the user's explicit consent. First check, read-only, whether a push is needed:

```bash
cd backend && DATABASE_URL=postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

- If it prints `-- This is an empty migration.`, skip the push.
- If it prints SQL, stop. Show the SQL to the user and ask them to run `cd backend && pnpm run migrate` themselves, or to give explicit consent.

Then start both servers in the background:

```bash
cd backend && npx prisma generate && DATABASE_URL=postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex NODE_ENV=dev pnpm run api
cd ui && pnpm dev
```

Wait until `curl localhost:7302` responds (404 on `/` is fine) and `curl localhost:7301` returns 200.

## 5. Report

- UI: http://localhost:7301
- API: http://localhost:7302
- Which outputs and services were neutralized.
- Whether a schema push was needed.

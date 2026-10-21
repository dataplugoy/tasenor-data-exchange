---
name: release-prod
description: Release TaDeX to production - bump the version, commit and push, publish the Docker images as latest and prod, and update the production host (ssh dataplug). Use when asked to push, publish and deploy, release, or update prod.
---

# Release to production

Production runs on `ssh dataplug` (compose dir `/home/wigy/dataplug`, containers `tadex-api`, `tadex-app`,
`tadex-db`). Work from the repo root.

## 1. Check the tree

- `git status` must be clean and the branch `main`. Commit or ask about anything left over first.
- `DOCKER_USER` and `DOCKER_PASSWORD` must be set; `bin/docker-publish` needs them.

## 2. Bump the version

Find the previous release with `git log --oneline | grep -E "^[0-9a-f]+ v[0-9]"` and look at what has been
committed since. Bump the minor version for new features and the patch version for fixes only. Say which one
you chose and why.

```bash
sed -i 's/"version": "X.Y.Z"/"version": "NEW"/' package.json
pnpm build-version
git commit -am "vNEW"
git push
```

`pnpm build-version` copies the version to all sub-packages: six `package.json` files change.

## 3. Publish the images

```bash
bin/docker-publish latest
bin/docker-publish prod
```

- `latest` builds every image with `docker compose build` and pushes them tagged with the version and `latest`.
  It takes several minutes, so run it in the background and wait for it to finish.
- `prod` retags `latest` as `prod`.
- If either one fails, stop and report. Don't update prod with half-published images.

## 4. Update the production host

```bash
bin/update-prod
```

This pulls `tadex-api` and `tadex-app` on dataplug and restarts them. The database container is not touched.
The API runs `prisma db push --accept-data-loss` when it starts, so schema changes are applied then.

Before updating, check the diff of `backend/prisma/schema.prisma` since the previous release. Adding enum values,
optional fields and tables is safe. If something is removed or renamed, stop and ask, since the push would drop
data in production.

## 5. Verify

```bash
ssh dataplug 'docker ps --format "{{.Names}} {{.Status}}" | grep tadex'
ssh dataplug 'docker exec tadex-api sh -c "grep \"\\\"version\\\"\" package.json"'
ssh dataplug 'docker logs --since 5m tadex-api 2>&1 | grep -iv "GET \|PATCH \|POST " | tail -30'
```

- Both containers should be up for a few seconds only.
- The version should be the new one.
- The log should show the schema in sync and `Server started on port 7302`, with no errors.

## 6. Report

Give the version, the commits included since the previous release, and the result of the verification.

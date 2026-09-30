import { defineConfig } from 'prisma/config'

// The URL is needed only by commands using the database (e.g. `db push`), not by `generate`.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})

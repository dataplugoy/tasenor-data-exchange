import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const QUERY_LOGGING = false

export async function connect(db: string | undefined = undefined): Promise<PrismaClient> {
  if (!db) {
    db = process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = db
  }
  if (!db) {
    throw new Error('DATABASE_URL not set.')
  }
  const url = new URL(db)
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error(`Cannot handle database URL protocol ${url.protocol}.`)
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: db }),
    log: [{ level: 'query', emit: 'event' }],
  })

  prisma.$on('query', (e) => {
    if (QUERY_LOGGING) console.log(e)
  })

  return prisma
}

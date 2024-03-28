import { PrismaClient } from '@prisma/client'

export async function connect(): Promise<PrismaClient> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set.')
  }
  const url = new URL(process.env.DATABASE_URL)
  if (url.protocol !== 'postgresql:'  && url.protocol !== 'postgres:') {
    throw new Error(`Cannot handle database URL protocol ${url.protocol}.`)
  }

  const prisma = new PrismaClient()
  return prisma
}

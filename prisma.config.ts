import { defineConfig } from 'prisma/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasource: {
    url: dbUrl,
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  } as any,
})

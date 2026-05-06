import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('demo', 12)
  await prisma.user.upsert({
    where: { email: 'demo@invariant.sh' },
    update: {},
    create: {
      email: 'demo@invariant.sh',
      name: 'Demo User',
      password: hash,
      plan: 'growth',
    },
  })
  console.log('Seeded demo user: demo@invariant.sh / demo')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

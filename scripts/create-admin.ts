import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/security'

const db = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim()

  if (!email || !password || !name) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME are required'
    )
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters')
  }

  const user = await db.user.upsert({
    where: { email },
    update: {
      name,
      password: hashPassword(password),
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email,
      name,
      password: hashPassword(password),
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log(`Administrator provisioned: ${user.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
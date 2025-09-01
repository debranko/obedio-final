const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Simple password hashing function
function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@obedio.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@obedio.com',
      password: hash('admin'),
      role: 'ADMIN',
      department: 'Management',
      team: 'Administration',
      status: 'on_duty',
      phone: '+1234567890',
      cabin: 'A1'
    },
  })
  console.log(`Created user: ${adminUser.name} (${adminUser.email})`)

  // Create crew user
  const crewUser = await prisma.user.upsert({
    where: { email: 'crew@obedio.com' },
    update: {},
    create: {
      name: 'Crew Member',
      email: 'crew@obedio.com',
      password: hash('crew'),
      role: 'CREW',
      department: 'Housekeeping',
      team: 'Guest Services',
      status: 'on_duty',
      phone: '+1234567891',
      cabin: 'B2'
    },
  })
  console.log(`Created user: ${crewUser.name} (${crewUser.email})`)

  // Create engineer user
  const engineerUser = await prisma.user.upsert({
    where: { email: 'engineer@obedio.com' },
    update: {},
    create: {
      name: 'System Engineer',
      email: 'engineer@obedio.com',
      password: hash('engineer'),
      role: 'ENGINEER',
      department: 'IT',
      team: 'Technical',
      status: 'on_duty',
      phone: '+1234567892',
      cabin: 'C3'
    },
  })
  console.log(`Created user: ${engineerUser.name} (${engineerUser.email})`)

  // Create test device
  const device1 = await prisma.device.upsert({
    where: { uid: 'OB-2024-MYA1-001' },
    update: {},
    create: {
      uid: 'OB-2024-MYA1-001',
      name: 'Master Cabin Button',
      room: 'Master Cabin',
      battery: 95,
      signal: 80,
    },
  })
  console.log(`Created device: ${device1.name} (${device1.uid})`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Simple password hashing function
function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding database...')

  // Create admin user (only using fields that exist in schema)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@obedio.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@obedio.com',
      password: hash('admin'),
      role: 'ADMIN'
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
      role: 'CREW'
    },
  })
  console.log(`Created user: ${crewUser.name} (${crewUser.email})`)

  // Create some sample devices
  const device1 = await prisma.device.upsert({
    where: { uid: 'DEV001' },
    update: {},
    create: {
      uid: 'DEV001',
      name: 'Button Device 1',
      room: 'Room 101',
      type: 'BUTTON',
      battery: 85,
      signal: 95,
      isActive: true,
      lastSeen: new Date()
    },
  })
  console.log(`Created device: ${device1.name} (${device1.uid})`)

  const device2 = await prisma.device.upsert({
    where: { uid: 'DEV002' },
    update: {},
    create: {
      uid: 'DEV002',
      name: 'Smart Watch 1',
      room: 'Crew Quarters',
      type: 'SMART_WATCH',
      battery: 72,
      signal: 88,
      isActive: true,
      lastSeen: new Date()
    },
  })
  console.log(`Created device: ${device2.name} (${device2.uid})`)

  // Create sample locations
  const location1 = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Main Deck',
      deck: 'Deck 1',
      type: 'Public Area',
      capacity: 50,
      isActive: true,
      description: 'Main public area on deck 1'
    },
  })
  console.log(`Created location: ${location1.name}`)

  const location2 = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Guest Cabin 101',
      deck: 'Deck 2',
      type: 'Guest Room',
      capacity: 2,
      isActive: true,
      description: 'Standard guest cabin'
    },
  })
  console.log(`Created location: ${location2.name}`)

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// Simple password hashing function
async function hash(password: string): Promise<string> {
  return createHash('sha256').update(password).digest('hex')
}

async function seedCrew() {
  console.log('Seeding crew members...')

  const crewMembers = [
    {
      name: 'Captain John Smith',
      email: 'john.smith@yacht.com',
      password: await hash('password123'),
      role: 'Captain',
      department: 'Deck',
      phone: '+385 91 234 5678',
      cabin: 'Captain\'s Quarters',
      languages: JSON.stringify(['English', 'Croatian', 'Italian']),
      certifications: JSON.stringify(['STCW', 'Medical Care', 'GMDSS', 'Yachtmaster Ocean']),
      emergencyContact: JSON.stringify({
        name: 'Sarah Smith',
        phone: '+44 7700 900123',
        relationship: 'Wife'
      }),
      onLeave: false
    },
    {
      name: 'Maria Garcia',
      email: 'maria.garcia@yacht.com',
      password: await hash('password123'),
      role: 'Chief Stewardess',
      department: 'Interior',
      phone: '+385 91 345 6789',
      cabin: 'Crew Deck - Cabin 2',
      languages: JSON.stringify(['Spanish', 'English', 'French']),
      certifications: JSON.stringify(['STCW', 'Silver Service', 'Wine Sommelier']),
      emergencyContact: JSON.stringify({
        name: 'Carlos Garcia',
        phone: '+34 612 345 678',
        relationship: 'Brother'
      }),
      onLeave: false
    },
    {
      name: 'David Chen',
      email: 'david.chen@yacht.com',
      password: await hash('password123'),
      role: 'Chief Engineer',
      department: 'Engineering',
      phone: '+385 91 456 7890',
      cabin: 'Crew Deck - Cabin 3',
      languages: JSON.stringify(['English', 'Mandarin', 'German']),
      certifications: JSON.stringify(['STCW', 'Y3', 'Y4', 'MCA Chief Engineer']),
      emergencyContact: JSON.stringify({
        name: 'Li Chen',
        phone: '+86 138 0013 8000',
        relationship: 'Father'
      }),
      onLeave: false
    },
    {
      name: 'Sophie Laurent',
      email: 'sophie.laurent@yacht.com',
      password: await hash('password123'),
      role: 'Head Chef',
      department: 'Galley',
      phone: '+385 91 567 8901',
      cabin: 'Crew Deck - Cabin 4',
      languages: JSON.stringify(['French', 'English', 'Italian']),
      certifications: JSON.stringify(['STCW', 'Food Safety Level 3', 'Culinary Arts Diploma']),
      emergencyContact: JSON.stringify({
        name: 'Pierre Laurent',
        phone: '+33 6 12 34 56 78',
        relationship: 'Husband'
      }),
      onLeave: false
    },
    {
      name: 'James Wilson',
      email: 'james.wilson@yacht.com',
      password: await hash('password123'),
      role: 'First Officer',
      department: 'Deck',
      phone: '+385 91 678 9012',
      cabin: 'Crew Deck - Cabin 5',
      languages: JSON.stringify(['English', 'Dutch']),
      certifications: JSON.stringify(['STCW', 'OOW', 'Medical First Aid']),
      emergencyContact: JSON.stringify({
        name: 'Emma Wilson',
        phone: '+44 7911 123456',
        relationship: 'Sister'
      }),
      onLeave: false
    },
    {
      name: 'Anna Petrova',
      email: 'anna.petrova@yacht.com',
      password: await hash('password123'),
      role: 'Second Stewardess',
      department: 'Interior',
      phone: '+385 91 789 0123',
      cabin: 'Crew Deck - Cabin 6',
      languages: JSON.stringify(['Russian', 'English', 'German']),
      certifications: JSON.stringify(['STCW', 'Housekeeping Management']),
      emergencyContact: JSON.stringify({
        name: 'Mikhail Petrov',
        phone: '+7 916 123 4567',
        relationship: 'Father'
      }),
      onLeave: false
    },
    {
      name: 'Marco Rossi',
      email: 'marco.rossi@yacht.com',
      password: await hash('password123'),
      role: 'Bosun',
      department: 'Deck',
      phone: '+385 91 890 1234',
      cabin: 'Crew Deck - Cabin 7',
      languages: JSON.stringify(['Italian', 'English', 'Croatian']),
      certifications: JSON.stringify(['STCW', 'Tender Driving License', 'PWC License']),
      emergencyContact: JSON.stringify({
        name: 'Giulia Rossi',
        phone: '+39 333 123 4567',
        relationship: 'Wife'
      }),
      onLeave: false
    },
    {
      name: 'Lisa Anderson',
      email: 'lisa.anderson@yacht.com',
      password: await hash('password123'),
      role: 'Third Stewardess',
      department: 'Interior',
      phone: '+385 91 901 2345',
      cabin: 'Crew Deck - Cabin 8',
      languages: JSON.stringify(['English', 'Swedish']),
      certifications: JSON.stringify(['STCW', 'Laundry Management']),
      emergencyContact: JSON.stringify({
        name: 'Erik Anderson',
        phone: '+46 70 123 4567',
        relationship: 'Brother'
      }),
      onLeave: true // On leave
    },
    {
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@yacht.com',
      password: await hash('password123'),
      role: 'Second Engineer',
      department: 'Engineering',
      phone: '+385 91 012 3456',
      cabin: 'Crew Deck - Cabin 9',
      languages: JSON.stringify(['Arabic', 'English', 'French']),
      certifications: JSON.stringify(['STCW', 'Y2', 'Electrical Systems']),
      emergencyContact: JSON.stringify({
        name: 'Fatima Hassan',
        phone: '+20 100 123 4567',
        relationship: 'Mother'
      }),
      onLeave: false
    },
    {
      name: 'Tom Baker',
      email: 'tom.baker@yacht.com',
      password: await hash('password123'),
      role: 'Deckhand',
      department: 'Deck',
      phone: '+385 91 123 4567',
      cabin: 'Crew Deck - Cabin 10',
      languages: JSON.stringify(['English']),
      certifications: JSON.stringify(['STCW', 'Tender Driving License']),
      emergencyContact: JSON.stringify({
        name: 'Mary Baker',
        phone: '+1 555 123 4567',
        relationship: 'Mother'
      }),
      onLeave: false
    }
  ]

  for (const member of crewMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: member,
      create: member
    })
    console.log(`Created crew member: ${user.name} (${user.role})`)
  }

  console.log('Crew members seeded successfully!')
}

seedCrew()
  .catch((e) => {
    console.error('Error seeding crew members:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
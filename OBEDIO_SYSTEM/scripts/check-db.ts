import { prisma } from '../lib/prisma';

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection by querying some tables
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`Found ${users.length} users`);
    
    const guests = await prisma.guest.findMany({ take: 5 });
    console.log(`Found ${guests.length} guests`);
    
    const devices = await prisma.device.findMany({ take: 5 });
    console.log(`Found ${devices.length} devices`);
    
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

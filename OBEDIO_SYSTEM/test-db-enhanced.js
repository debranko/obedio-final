require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('=== Enhanced Database Diagnostic ===\n');

// 1. Show current working directory
console.log('1. Current Working Directory:');
console.log('   ', process.cwd());
console.log('');

// 2. Check DATABASE_URL resolution
console.log('2. Database URL Resolution:');
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
console.log('   Raw URL:', dbUrl);

if (dbUrl.startsWith('file:')) {
  const relativePath = dbUrl.replace('file:', '');
  const absolutePath = path.resolve(process.cwd(), relativePath);
  console.log('   Relative path:', relativePath);
  console.log('   Absolute path:', absolutePath);
  console.log('   File exists before connection:', fs.existsSync(absolutePath));
}
console.log('');

// 3. Test Prisma connection with detailed logging
console.log('3. Testing Prisma Connection:');
async function testPrismaConnection() {
  const prisma = new PrismaClient({
    log: [
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db'
      }
    }
  });

  try {
    console.log('   Creating Prisma client...');
    
    // Force connection
    console.log('   Forcing connection with $connect()...');
    await prisma.$connect();
    console.log('   ✓ Connected successfully');
    
    // Check if database file was created
    if (dbUrl.startsWith('file:')) {
      const relativePath = dbUrl.replace('file:', '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      console.log('   File exists after connection:', fs.existsSync(absolutePath));
      
      if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        console.log('   Database file size:', stats.size, 'bytes');
      }
    }
    
    // Try to query
    console.log('   Attempting to query users table...');
    const users = await prisma.user.findMany();
    console.log('   ✓ Query successful. Users found:', users.length);
    
    // Check all tables
    console.log('\n4. Database Tables Status:');
    const tables = [
      'User', 'Location', 'Device', 'Request', 
      'ProvisionToken', 'ProvisionLog', 'Shift', 'Guest', 'ServiceRequest'
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`   ${table}: ${count} records`);
      } catch (err) {
        console.log(`   ${table}: ✗ Error - ${err.message}`);
      }
    }
    
    await prisma.$disconnect();
    console.log('\n   ✓ Disconnected successfully');
    
  } catch (error) {
    console.log('   ✗ Error:', error.message);
    console.log('   Error code:', error.code);
    
    // Detailed error diagnosis
    if (error.message.includes('P1003') || error.message.includes('does not exist')) {
      console.log('\n   DIAGNOSIS: Database file does not exist');
      console.log('   SOLUTION: The database needs to be initialized.');
      console.log('   Run these commands:');
      console.log('     1. npx prisma migrate dev --name init');
      console.log('     2. npm run seed (if you have seed data)');
    } else if (error.message.includes('P2021') || error.message.includes('table')) {
      console.log('\n   DIAGNOSIS: Database exists but tables are missing');
      console.log('   SOLUTION: Run migrations:');
      console.log('     npx prisma migrate deploy');
    } else if (error.message.includes('P1001')) {
      console.log('\n   DIAGNOSIS: Cannot connect to database');
      console.log('   SOLUTION: Check DATABASE_URL in .env file');
    }
    
    await prisma.$disconnect().catch(() => {});
  }
}

// 4. Check if app can import Prisma client
console.log('5. Testing Prisma Import from lib/prisma:');
try {
  const { prisma: libPrisma } = require('../lib/prisma');
  console.log('   ✓ Successfully imported prisma from lib/prisma');
  
  // Test the imported client
  libPrisma.$connect()
    .then(() => {
      console.log('   ✓ lib/prisma client can connect');
      return libPrisma.$disconnect();
    })
    .catch(err => {
      console.log('   ✗ lib/prisma client connection failed:', err.message);
    });
} catch (err) {
  console.log('   ✗ Failed to import from lib/prisma:', err.message);
}

// Run the test
testPrismaConnection().then(() => {
  console.log('\n=== Diagnostic Complete ===\n');
  
  // Final recommendations
  console.log('SUMMARY:');
  const dbPath = path.resolve(process.cwd(), './dev.db');
  if (!fs.existsSync(dbPath)) {
    console.log('✗ Database file does not exist');
    console.log('\nRECOMMENDED ACTIONS:');
    console.log('1. Initialize the database:');
    console.log('   npx prisma migrate dev --name init');
    console.log('\n2. (Optional) Seed the database:');
    console.log('   npm run seed');
    console.log('\n3. Start the application:');
    console.log('   npm run dev');
  } else {
    console.log('✓ Database file exists');
    console.log('\nTo start the application:');
    console.log('   npm run dev');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
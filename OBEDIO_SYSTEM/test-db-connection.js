const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('=== Database Connection Diagnostic ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('');

// 2. Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('2. Environment File:');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL'));
  if (dbUrlLine) {
    console.log('   ✓ DATABASE_URL found in .env:', dbUrlLine);
  } else {
    console.log('   ✗ DATABASE_URL not found in .env');
  }
} else {
  console.log('   ✗ .env file does not exist');
}
console.log('');

// 3. Check if database file exists (for SQLite)
console.log('3. Database File:');
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
if (dbUrl.startsWith('file:')) {
  const dbPath = path.join(__dirname, dbUrl.replace('file:', ''));
  if (fs.existsSync(dbPath)) {
    console.log('   ✓ Database file exists at:', dbPath);
    const stats = fs.statSync(dbPath);
    console.log('   File size:', stats.size, 'bytes');
  } else {
    console.log('   ✗ Database file does not exist at:', dbPath);
  }
} else {
  console.log('   Using non-file database URL');
}
console.log('');

// 4. Check Prisma client
console.log('4. Prisma Client:');
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
  console.log('   ✓ Prisma client is generated');
} else {
  console.log('   ✗ Prisma client is NOT generated');
  console.log('   Run: npm run prisma:generate');
}
console.log('');

// 5. Check migrations
console.log('5. Migrations:');
const migrationsPath = path.join(__dirname, 'prisma', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath).filter(f => !f.startsWith('.'));
  console.log('   Found', migrations.length, 'migration(s)');
  migrations.forEach(m => console.log('   -', m));
} else {
  console.log('   ✗ No migrations folder found');
}
console.log('');

// 6. Try to connect to database
console.log('6. Database Connection Test:');
async function testConnection() {
  try {
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    console.log('   Attempting to connect...');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('   ✓ Connection successful!');
    console.log('   Users in database:', userCount);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('   ✗ Connection failed!');
    console.log('   Error:', error.message);
    
    if (error.message.includes('P1003')) {
      console.log('\n   DIAGNOSIS: Database file does not exist');
      console.log('   SOLUTION: Run: npm run prisma:migrate');
    } else if (error.message.includes('P1001')) {
      console.log('\n   DIAGNOSIS: Cannot reach database server');
      console.log('   SOLUTION: Check DATABASE_URL and ensure database server is running');
    } else if (error.message.includes('P2021')) {
      console.log('\n   DIAGNOSIS: Table does not exist');
      console.log('   SOLUTION: Run: npm run prisma:migrate');
    }
  }
}

testConnection().then(() => {
  console.log('\n=== Diagnostic Complete ===');
}).catch(err => {
  console.error('\nUnexpected error:', err);
});
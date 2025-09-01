const { execSync } = require('child_process');
const path = require('path');

console.log('Initializing database...\n');

try {
  // Set working directory
  process.chdir(__dirname);
  
  // Generate Prisma Client
  console.log('1. Generating Prisma Client...');
  execSync('node node_modules/prisma/build/index.js generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  // Push database schema
  console.log('\n2. Pushing database schema...');
  execSync('node node_modules/prisma/build/index.js db push --accept-data-loss', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('\n✅ Database initialized successfully!');
  
} catch (error) {
  console.error('Error initializing database:', error.message);
  process.exit(1);
}
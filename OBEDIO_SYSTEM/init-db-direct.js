const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'dev.db');

console.log('Initializing database directly with SQLite...\n');
console.log('Database path:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// SQL statements to create tables based on Prisma schema
const createTables = `
-- User table
CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Location table
CREATE TABLE IF NOT EXISTS Location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  deck TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER DEFAULT 1,
  isActive BOOLEAN DEFAULT 1,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Device table
CREATE TABLE IF NOT EXISTS Device (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT UNIQUE NOT NULL,
  name TEXT,
  room TEXT NOT NULL,
  type TEXT DEFAULT 'BUTTON',
  battery INTEGER DEFAULT 100,
  signal INTEGER DEFAULT 100,
  isActive BOOLEAN DEFAULT 1,
  lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  firmwareVersion TEXT,
  location TEXT,
  model TEXT,
  assignedToUserId INTEGER,
  lastSync DATETIME,
  connectionType TEXT,
  operatingFrequency TEXT,
  isEmergencyMode BOOLEAN DEFAULT 0,
  connectedDevices INTEGER DEFAULT 0,
  coverageArea TEXT,
  meshRole TEXT,
  ipAddress TEXT,
  macAddress TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  locationId INTEGER,
  specificLocation TEXT
);

-- Request table
CREATE TABLE IF NOT EXISTS Request (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deviceId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'OPEN',
  assignedTo INTEGER,
  voiceUrl TEXT,
  transcript TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deviceId) REFERENCES Device(id),
  FOREIGN KEY (assignedTo) REFERENCES User(id)
);

-- ProvisionToken table
CREATE TABLE IF NOT EXISTS ProvisionToken (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  qrPayload TEXT NOT NULL,
  room TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  expiresAt DATETIME NOT NULL,
  createdBy INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  usedAt DATETIME,
  deviceId INTEGER
);

-- ProvisionLog table
CREATE TABLE IF NOT EXISTS ProvisionLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tokenId INTEGER NOT NULL,
  action TEXT NOT NULL,
  deviceUid TEXT,
  message TEXT,
  metadata TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  ipAddress TEXT,
  FOREIGN KEY (tokenId) REFERENCES ProvisionToken(id)
);

-- Shift table
CREATE TABLE IF NOT EXISTS Shift (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  startsAt DATETIME NOT NULL,
  endsAt DATETIME NOT NULL,
  completed BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Guest table
CREATE TABLE IF NOT EXISTS Guest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  room TEXT,
  status TEXT DEFAULT 'Checked-In',
  isVip BOOLEAN DEFAULT 0,
  guestType TEXT NOT NULL,
  partySize INTEGER DEFAULT 1,
  arrivalDate DATETIME NOT NULL,
  departureDate DATETIME NOT NULL,
  notes TEXT,
  assignedCrew TEXT,
  location TEXT,
  preferences TEXT,
  broker TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  imageUrl TEXT,
  languagesSpoken TEXT,
  nationality TEXT,
  tags TEXT,
  locationId INTEGER
);

-- ServiceRequest table
CREATE TABLE IF NOT EXISTS ServiceRequest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  room TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  guestId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guestId) REFERENCES Guest(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_device_locationId ON Device(locationId);
CREATE INDEX IF NOT EXISTS idx_guest_locationId ON Guest(locationId);
`;

// Execute the SQL
db.exec(createTables, (err) => {
  if (err) {
    console.error('Error creating tables:', err);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ All tables created successfully!');
  
  // Verify tables were created
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      console.log('\nCreated tables:');
      tables.forEach(table => console.log('  -', table.name));
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\n✅ Database initialization complete!');
      }
    });
  });
});
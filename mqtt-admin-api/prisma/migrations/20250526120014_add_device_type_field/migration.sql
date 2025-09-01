-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" TEXT NOT NULL,
    "name" TEXT,
    "room" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUTTON',
    "battery" INTEGER NOT NULL DEFAULT 100,
    "signal" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firmwareVersion" TEXT,
    "location" TEXT,
    "model" TEXT,
    "assignedToUserId" INTEGER,
    "lastSync" DATETIME,
    "connectionType" TEXT,
    "operatingFrequency" TEXT,
    "isEmergencyMode" BOOLEAN DEFAULT false,
    "connectedDevices" INTEGER DEFAULT 0,
    "coverageArea" TEXT,
    "meshRole" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Device" ("battery", "createdAt", "id", "lastSeen", "name", "room", "signal", "uid", "updatedAt") SELECT "battery", "createdAt", "id", "lastSeen", "name", "room", "signal", "uid", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_uid_key" ON "Device"("uid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

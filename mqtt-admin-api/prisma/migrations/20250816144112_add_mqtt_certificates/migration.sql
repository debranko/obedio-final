-- CreateTable
CREATE TABLE "MqttCertificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "deviceType" TEXT,
    "deviceId" TEXT,
    "organization" TEXT NOT NULL DEFAULT 'OBEDIO',
    "organizationUnit" TEXT,
    "locality" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "keyUsage" TEXT NOT NULL,
    "extendedKeyUsage" TEXT NOT NULL,
    "subjectAltNames" TEXT,
    "serialNumber" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "issuerFingerprint" TEXT,
    "keySize" INTEGER NOT NULL DEFAULT 2048,
    "signatureAlgorithm" TEXT NOT NULL DEFAULT 'SHA256withRSA',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revokedAt" DATETIME,
    "revocationReason" TEXT,
    "certificatePath" TEXT NOT NULL,
    "privateKeyPath" TEXT,
    "chainPath" TEXT,
    "bundlePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER,
    "revokedBy" INTEGER,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "MqttCertificateLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT,
    "metadata" TEXT,
    "performedBy" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MqttCertificateLog_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "MqttCertificate" ("certificateId") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "updatedAt" DATETIME NOT NULL,
    "locationId" INTEGER,
    "specificLocation" TEXT,
    CONSTRAINT "Device_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("assignedToUserId", "battery", "connectedDevices", "connectionType", "coverageArea", "createdAt", "firmwareVersion", "id", "ipAddress", "isActive", "isEmergencyMode", "lastSeen", "lastSync", "location", "locationId", "macAddress", "meshRole", "model", "name", "operatingFrequency", "room", "signal", "specificLocation", "type", "uid", "updatedAt") SELECT "assignedToUserId", "battery", "connectedDevices", "connectionType", "coverageArea", "createdAt", "firmwareVersion", "id", "ipAddress", "isActive", "isEmergencyMode", "lastSeen", "lastSync", "location", "locationId", "macAddress", "meshRole", "model", "name", "operatingFrequency", "room", "signal", "specificLocation", "type", "uid", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_uid_key" ON "Device"("uid");
CREATE INDEX "Device_locationId_idx" ON "Device"("locationId");
CREATE TABLE "new_Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "room" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Checked-In',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "guestType" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "arrivalDate" DATETIME NOT NULL,
    "departureDate" DATETIME NOT NULL,
    "notes" TEXT,
    "assignedCrew" TEXT,
    "location" TEXT,
    "preferences" TEXT,
    "broker" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "languagesSpoken" TEXT,
    "nationality" TEXT,
    "tags" TEXT,
    "locationId" INTEGER,
    CONSTRAINT "Guest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("arrivalDate", "assignedCrew", "broker", "createdAt", "departureDate", "guestType", "id", "imageUrl", "isVip", "languagesSpoken", "location", "locationId", "name", "nationality", "notes", "partySize", "preferences", "room", "status", "tags", "updatedAt") SELECT "arrivalDate", "assignedCrew", "broker", "createdAt", "departureDate", "guestType", "id", "imageUrl", "isVip", "languagesSpoken", "location", "locationId", "name", "nationality", "notes", "partySize", "preferences", "room", "status", "tags", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE INDEX "Guest_locationId_idx" ON "Guest"("locationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MqttCertificate_certificateId_key" ON "MqttCertificate"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "MqttCertificate_serialNumber_key" ON "MqttCertificate"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MqttCertificate_fingerprint_key" ON "MqttCertificate"("fingerprint");

-- CreateIndex
CREATE INDEX "MqttCertificate_certificateType_idx" ON "MqttCertificate"("certificateType");

-- CreateIndex
CREATE INDEX "MqttCertificate_deviceType_idx" ON "MqttCertificate"("deviceType");

-- CreateIndex
CREATE INDEX "MqttCertificate_deviceId_idx" ON "MqttCertificate"("deviceId");

-- CreateIndex
CREATE INDEX "MqttCertificate_status_idx" ON "MqttCertificate"("status");

-- CreateIndex
CREATE INDEX "MqttCertificate_expiresAt_idx" ON "MqttCertificate"("expiresAt");

-- CreateIndex
CREATE INDEX "MqttCertificateLog_certificateId_idx" ON "MqttCertificateLog"("certificateId");

-- CreateIndex
CREATE INDEX "MqttCertificateLog_action_idx" ON "MqttCertificateLog"("action");

-- CreateIndex
CREATE INDEX "MqttCertificateLog_createdAt_idx" ON "MqttCertificateLog"("createdAt");

/*
  Warnings:

  - You are about to drop the column `createdAt` on the `MqttCertificateLog` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `MqttCertificateLog` table. All the data in the column will be lost.
  - You are about to alter the column `certificateId` on the `MqttCertificateLog` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- DropIndex
DROP INDEX "MqttCertificate_deviceType_idx";

-- DropIndex
DROP INDEX "MqttCertificate_certificateType_idx";

-- CreateTable
CREATE TABLE "MqttDevice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "model" TEXT,
    "firmwareVersion" TEXT,
    "ipAddress" TEXT,
    "macAddress" TEXT
);

-- CreateTable
CREATE TABLE "MqttPresence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "battery" INTEGER,
    "rssi" INTEGER,
    "connectedAt" DATETIME,
    "disconnectedAt" DATETIME,
    "metadata" TEXT,
    CONSTRAINT "MqttPresence_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "MqttDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MqttTraffic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" TEXT,
    "payloadSize" INTEGER NOT NULL DEFAULT 0,
    "qos" INTEGER NOT NULL DEFAULT 0,
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "direction" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MqttTraffic_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "MqttDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceCredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "qrCode" TEXT,
    "mqttConfig" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" DATETIME,
    CONSTRAINT "DeviceCredential_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "MqttDevice" ("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MqttCertificateLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" INTEGER,
    CONSTRAINT "MqttCertificateLog_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "MqttCertificate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MqttCertificateLog" ("action", "certificateId", "id", "ipAddress", "metadata", "performedBy", "userAgent") SELECT "action", "certificateId", "id", "ipAddress", "metadata", "performedBy", "userAgent" FROM "MqttCertificateLog";
DROP TABLE "MqttCertificateLog";
ALTER TABLE "new_MqttCertificateLog" RENAME TO "MqttCertificateLog";
CREATE INDEX "MqttCertificateLog_certificateId_idx" ON "MqttCertificateLog"("certificateId");
CREATE INDEX "MqttCertificateLog_action_idx" ON "MqttCertificateLog"("action");
CREATE INDEX "MqttCertificateLog_timestamp_idx" ON "MqttCertificateLog"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MqttDevice_deviceId_key" ON "MqttDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "MqttDevice_username_key" ON "MqttDevice"("username");

-- CreateIndex
CREATE INDEX "MqttDevice_site_room_idx" ON "MqttDevice"("site", "room");

-- CreateIndex
CREATE INDEX "MqttDevice_deviceType_idx" ON "MqttDevice"("deviceType");

-- CreateIndex
CREATE INDEX "MqttDevice_isActive_idx" ON "MqttDevice"("isActive");

-- CreateIndex
CREATE INDEX "MqttDevice_lastSeen_idx" ON "MqttDevice"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "MqttPresence_deviceId_key" ON "MqttPresence"("deviceId");

-- CreateIndex
CREATE INDEX "MqttPresence_status_idx" ON "MqttPresence"("status");

-- CreateIndex
CREATE INDEX "MqttPresence_lastSeen_idx" ON "MqttPresence"("lastSeen");

-- CreateIndex
CREATE INDEX "MqttTraffic_deviceId_idx" ON "MqttTraffic"("deviceId");

-- CreateIndex
CREATE INDEX "MqttTraffic_topic_idx" ON "MqttTraffic"("topic");

-- CreateIndex
CREATE INDEX "MqttTraffic_timestamp_idx" ON "MqttTraffic"("timestamp");

-- CreateIndex
CREATE INDEX "MqttTraffic_direction_idx" ON "MqttTraffic"("direction");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCredential_deviceId_key" ON "DeviceCredential"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceCredential_expiresAt_idx" ON "DeviceCredential"("expiresAt");

-- CreateIndex
CREATE INDEX "DeviceCredential_createdAt_idx" ON "DeviceCredential"("createdAt");

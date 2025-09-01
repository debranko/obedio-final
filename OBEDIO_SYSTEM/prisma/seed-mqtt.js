const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedMqttDevices() {
  try {
    console.log('🔌 Seeding MQTT devices...')

    // Clear existing MQTT data
    await prisma.mqttTrafficLog.deleteMany()
    await prisma.mqttSecurityProfile.deleteMany()
    await prisma.mqttDevice.deleteMany()

    // Create MQTT devices for hospitality demo
    const mqttDevices = [
      // Hotel buttons
      {
        deviceId: 'BTN-ROOM-101',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_101',
        site: 'Grand Plaza Hotel',
        room: 'Room 101',
        isOnline: true,
        mqttUsername: 'btn_101',
        mqttPasswordHash: 'secure_password_101',
        lastMqttActivity: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        deviceId: 'BTN-ROOM-102',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_102',
        site: 'Grand Plaza Hotel',
        room: 'Room 102',
        isOnline: true,
        mqttUsername: 'btn_102',
        mqttPasswordHash: 'secure_password_102',
        lastMqttActivity: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        deviceId: 'BTN-ROOM-201',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_201',
        site: 'Grand Plaza Hotel',
        room: 'Room 201',
        isOnline: false,
        mqttUsername: 'btn_201',
        mqttPasswordHash: 'secure_password_201',
        lastMqttActivity: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      },
      // Staff smartwatches
      {
        deviceId: 'WATCH-STAFF-001',
        deviceType: 'smartwatch',
        mqttClientId: 'obedio_watch_001',
        site: 'Grand Plaza Hotel',
        room: 'Staff Area',
        isOnline: true,
        mqttUsername: 'watch_001',
        mqttPasswordHash: 'secure_password_watch1',
        lastMqttActivity: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      },
      {
        deviceId: 'WATCH-STAFF-002',
        deviceType: 'smartwatch',
        mqttClientId: 'obedio_watch_002',
        site: 'Grand Plaza Hotel',
        room: 'Reception',
        isOnline: true,
        mqttUsername: 'watch_002',
        mqttPasswordHash: 'secure_password_watch2',
        lastMqttActivity: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
      },
      // Network repeaters
      {
        deviceId: 'REP-FLOOR-1',
        deviceType: 'repeater',
        mqttClientId: 'obedio_rep_f1',
        site: 'Grand Plaza Hotel',
        room: 'Floor 1 Corridor',
        isOnline: true,
        mqttUsername: 'rep_f1',
        mqttPasswordHash: 'secure_password_rep1',
        lastMqttActivity: new Date(Date.now() - 30 * 1000) // 30 seconds ago
      },
      {
        deviceId: 'REP-FLOOR-2',
        deviceType: 'repeater',
        mqttClientId: 'obedio_rep_f2',
        site: 'Grand Plaza Hotel',
        room: 'Floor 2 Corridor',
        isOnline: true,
        mqttUsername: 'rep_f2',
        mqttPasswordHash: 'secure_password_rep2',
        lastMqttActivity: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      },
      // Sensors
      {
        deviceId: 'SENSOR-LOBBY',
        deviceType: 'sensor',
        mqttClientId: 'obedio_sensor_lobby',
        site: 'Grand Plaza Hotel',
        room: 'Main Lobby',
        isOnline: true,
        mqttUsername: 'sensor_lobby',
        mqttPasswordHash: 'secure_password_sensor1',
        lastMqttActivity: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        deviceId: 'SENSOR-POOL',
        deviceType: 'sensor',
        mqttClientId: 'obedio_sensor_pool',
        site: 'Grand Plaza Hotel',
        room: 'Pool Area',
        isOnline: false,
        mqttUsername: 'sensor_pool',
        mqttPasswordHash: 'secure_password_sensor2',
        lastMqttActivity: new Date(Date.now() - 120 * 60 * 1000) // 2 hours ago
      },
      // Additional rooms for impressive scale
      {
        deviceId: 'BTN-ROOM-103',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_103',
        site: 'Grand Plaza Hotel',
        room: 'Room 103',
        isOnline: true,
        mqttUsername: 'btn_103',
        mqttPasswordHash: 'secure_password_103',
        lastMqttActivity: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
      },
      {
        deviceId: 'BTN-ROOM-202',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_202',
        site: 'Grand Plaza Hotel',
        room: 'Room 202',
        isOnline: true,
        mqttUsername: 'btn_202',
        mqttPasswordHash: 'secure_password_202',
        lastMqttActivity: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
      },
      {
        deviceId: 'BTN-ROOM-203',
        deviceType: 'button',
        mqttClientId: 'obedio_btn_203',
        site: 'Grand Plaza Hotel',
        room: 'Room 203',
        isOnline: false,
        mqttUsername: 'btn_203',
        mqttPasswordHash: 'secure_password_203',
        lastMqttActivity: new Date(Date.now() - 35 * 60 * 1000) // 35 minutes ago
      }
    ]

    // Create devices
    for (const deviceData of mqttDevices) {
      await prisma.mqttDevice.create({ data: deviceData })
    }

    // Create security profiles for password-based authentication
    const securityProfiles = [
      {
        profileName: 'Hotel Guest Buttons',
        aclPattern: 'obedio/button/+/+',
        description: 'Security profile for guest room emergency buttons',
        maxQos: 1,
        maxConnections: 1,
        clientCertRequired: false
      },
      {
        profileName: 'Staff Devices',
        aclPattern: 'obedio/watch/+/+',
        description: 'Security profile for staff smartwatches and devices',
        maxQos: 1,
        maxConnections: 1,
        clientCertRequired: false
      },
      {
        profileName: 'Infrastructure',
        aclPattern: 'obedio/+/+/+',
        description: 'Security profile for repeaters and sensors',
        maxQos: 2,
        maxConnections: 5,
        clientCertRequired: false
      }
    ]

    for (const profileData of securityProfiles) {
      await prisma.mqttSecurityProfile.create({ data: profileData })
    }

    // Skip traffic logs for now due to BigInt autoincrement issues in SQLite
    console.log('⚠️  Skipping traffic logs - will be populated during runtime')

    console.log(`✅ Created ${mqttDevices.length} MQTT devices`)
    console.log(`✅ Created ${securityProfiles.length} security profiles`)
    console.log('🎉 MQTT seeding completed!')

  } catch (error) {
    console.error('❌ Error seeding MQTT data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedMqttDevices()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedMqttDevices }
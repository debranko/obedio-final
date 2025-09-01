/**
 * OBEDIO MQTT Server
 * 
 * A Node.js application that serves as the central server for the OBEDIO IoT system.
 * It connects to an MQTT broker, processes messages from repeaters, buttons and smartwatches,
 * and provides a web dashboard for monitoring and control.
 * 
 * Features:
 * - MQTT message processing
 * - Device tracking and management
 * - Real-time web dashboard
 * - API endpoints for external integration
 * - Message logging and analytics
 * - Device configuration management
 */

// Load environment variables from .env file
require('dotenv').config();

const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Configuration
const config = {
  mqtt: {
    broker: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: process.env.MQTT_CLIENT_ID || 'obedio-server-' + Math.random().toString(16).substring(2, 8),
    baseTopic: process.env.MQTT_TOPIC_PREFIX || 'obedio'
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    dataPath: process.env.DATA_PATH || './data',
    maxMessagesPerDevice: parseInt(process.env.MAX_MESSAGES_PER_DEVICE) || 50,
    maxGlobalMessages: parseInt(process.env.MAX_GLOBAL_MESSAGES) || 1000,
    offlineTimeoutMinutes: parseInt(process.env.OFFLINE_TIMEOUT_MINUTES) || 5,
    statusCheckInterval: parseInt(process.env.STATUS_CHECK_INTERVAL) || 60000,
    defaultMessageLimit: parseInt(process.env.DEFAULT_MESSAGE_LIMIT) || 100
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  api: {
    key: process.env.API_KEY || '',
    authEnabled: process.env.ENABLE_API_AUTH === 'true'
  },
  ui: {
    companyName: process.env.COMPANY_NAME || 'OBEDIO',
    refreshInterval: parseInt(process.env.REFRESH_INTERVAL) || 5000
  },
  version: process.env.VERSION || '1.0.0'
};

// Ensure data directory exists
if (!fs.existsSync(config.server.dataPath)) {
  fs.mkdirSync(config.server.dataPath, { recursive: true });
}

// Initialize device storage
let devices = {};
let messages = [];
let stats = {
  totalMessages: 0,
  messagesPerHour: Array(24).fill(0),
  deviceCounts: {
    repeaters: 0,
    buttons: 0,
    smartwatches: 0
  },
  activeAlerts: 0,
  uptime: 0
};

// Load existing data if available
try {
  if (fs.existsSync(path.join(config.server.dataPath, 'devices.json'))) {
    devices = JSON.parse(fs.readFileSync(path.join(config.server.dataPath, 'devices.json')));
    console.log(`Loaded ${Object.keys(devices).length} devices from storage`);
  } else {
    // If no devices.json exists, try to load test data
    const testDataPath = path.join(config.server.dataPath, 'test-devices.json');
    if (fs.existsSync(testDataPath)) {
      devices = JSON.parse(fs.readFileSync(testDataPath));
      console.log(`Loaded ${Object.keys(devices).length} test devices`);
      
      // Update device counts based on test data
      Object.values(devices).forEach(device => {
        if (device.type === 'repeater') stats.deviceCounts.repeaters++;
        else if (device.type === 'button') stats.deviceCounts.buttons++;
        else if (device.type === 'smartwatch') stats.deviceCounts.smartwatches++;
      });
    }
  }
} catch (err) {
  console.error('Error loading devices:', err);
}

// Start Express server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Connect to MQTT broker
const mqttClient = mqtt.connect(config.mqtt.broker, {
  clientId: config.mqtt.clientId,
  username: config.mqtt.username,
  password: config.mqtt.password,
  clean: true
});

// MQTT connection handling
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker:', config.mqtt.broker);
  
  // Subscribe to relevant topics
  const baseTopic = config.mqtt.baseTopic.endsWith('/') 
    ? config.mqtt.baseTopic.slice(0, -1) 
    : config.mqtt.baseTopic;
  
  // Subscribe to device status updates
  mqttClient.subscribe(`${baseTopic}/status/#`);
  
  // Subscribe to relay messages
  mqttClient.subscribe(`${baseTopic}/relay/#`);
  
  // Subscribe to command responses
  mqttClient.subscribe(`${baseTopic}/response/#`);
  
  // Send server online status
  mqttClient.publish(
    `${baseTopic}/server/status`, 
    JSON.stringify({
      status: 'online',
      timestamp: new Date().toISOString(),
      version: config.version
    }),
    { retain: true }
  );
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err);
});

mqttClient.on('message', (topic, message) => {
  try {
    const baseTopic = config.mqtt.baseTopic.endsWith('/') 
      ? config.mqtt.baseTopic.slice(0, -1) 
      : config.mqtt.baseTopic;
    
    // Parse message
    const payload = JSON.parse(message.toString());
    const timestamp = new Date();
    
    // Update stats
    stats.totalMessages++;
    stats.messagesPerHour[new Date().getHours()]++;
    
    // Process message based on topic
    if (topic.startsWith(`${baseTopic}/status/`)) {
      // Handle device status update
      const deviceId = topic.split('/').pop();
      handleDeviceStatus(deviceId, payload, timestamp);
    } 
    else if (topic.startsWith(`${baseTopic}/relay/`)) {
      // Handle relay message (messages being relayed between devices)
      const repeaterId = topic.split('/').pop();
      handleRelayMessage(repeaterId, payload, timestamp);
    }
    
    // Store message in history (limited size)
    messages.unshift({
      topic,
      payload,
      timestamp: timestamp.toISOString()
    });
    
    // Keep only the configured number of global messages
    if (messages.length > config.server.maxGlobalMessages) {
      messages.pop();
    }
    
    // Broadcast to connected clients
    io.emit('mqtt-message', {
      topic,
      payload,
      timestamp: timestamp.toISOString()
    });
    
  } catch (err) {
    console.error('Error processing MQTT message:', err);
  }
});

// Handle device status updates
function handleDeviceStatus(deviceId, payload, timestamp) {
  // Create device if it doesn't exist
  if (!devices[deviceId]) {
    devices[deviceId] = {
      id: deviceId,
      firstSeen: timestamp.toISOString(),
      type: payload.type || 'unknown',
      messages: []
    };
    
    // Update device count
    if (payload.type === 'repeater') stats.deviceCounts.repeaters++;
    else if (payload.type === 'button') stats.deviceCounts.buttons++;
    else if (payload.type === 'smartwatch') stats.deviceCounts.smartwatches++;
  }
  
  // Update device information
  devices[deviceId].name = payload.name || devices[deviceId].name || deviceId;
  devices[deviceId].lastSeen = timestamp.toISOString();
  devices[deviceId].firmware = payload.firmware || devices[deviceId].firmware;
  devices[deviceId].status = 'online';
  devices[deviceId].details = payload;
  
  // Add message to device history
  devices[deviceId].messages.unshift({
    type: 'status',
    payload,
    timestamp: timestamp.toISOString()
  });
  
  // Keep only the configured number of messages per device
  if (devices[deviceId].messages.length > config.server.maxMessagesPerDevice) {
    devices[deviceId].messages.pop();
  }
  
  // Save updated devices
  saveDevices();
  
  // Notify connected clients about device update
  io.emit('device-update', {
    device: devices[deviceId]
  });
}

// Handle relay messages
function handleRelayMessage(repeaterId, payload, timestamp) {
  // Get message details
  const { source, target, type } = payload;
  
  // Update source device if it exists
  if (devices[source]) {
    devices[source].lastSeen = timestamp.toISOString();
    devices[source].status = 'online';
    
    // Add message to device history
    devices[source].messages.unshift({
      type: 'message',
      direction: 'outgoing',
      target,
      payload,
      timestamp: timestamp.toISOString()
    });
    
    // Keep only the configured number of messages per device
    if (devices[source].messages.length > config.server.maxMessagesPerDevice) {
      devices[source].messages.pop();
    }
    
    // Notify connected clients about device update
    io.emit('device-update', {
      device: devices[source]
    });
  }
  
  // Update target device if it exists
  if (devices[target]) {
    // Add message to device history
    devices[target].messages.unshift({
      type: 'message',
      direction: 'incoming',
      source,
      payload,
      timestamp: timestamp.toISOString()
    });
    
    // Keep only the configured number of messages per device
    if (devices[target].messages.length > config.server.maxMessagesPerDevice) {
      devices[target].messages.pop();
    }
    
    // Notify connected clients about device update
    io.emit('device-update', {
      device: devices[target]
    });
  }
  
  // Update repeater device if it exists
  if (devices[repeaterId]) {
    devices[repeaterId].lastSeen = timestamp.toISOString();
    devices[repeaterId].status = 'online';
    
    // Add message to device history
    devices[repeaterId].messages.unshift({
      type: 'relay',
      source,
      target,
      payload,
      timestamp: timestamp.toISOString()
    });
    
    // Keep only the configured number of messages per device
    if (devices[repeaterId].messages.length > config.server.maxMessagesPerDevice) {
      devices[repeaterId].messages.pop();
    }
    
    // Notify connected clients about device update
    io.emit('device-update', {
      device: devices[repeaterId]
    });
  }
  
  // Handle alert messages
  if (type === 'ALERT' || type === 'EMERGENCY') {
    stats.activeAlerts++;
    io.emit('new-alert', {
      source,
      target,
      payload,
      repeaterId,
      timestamp: timestamp.toISOString()
    });
  }
  
  // Save updated devices
  saveDevices();
}

// Save devices to disk
function saveDevices() {
  try {
    fs.writeFileSync(
      path.join(config.server.dataPath, 'devices.json'),
      JSON.stringify(devices, null, 2)
    );
  } catch (err) {
    console.error('Error saving devices:', err);
  }
}

// API Routes
// Get all devices
app.get('/api/devices', (req, res) => {
  res.json(Object.values(devices));
});

// Get specific device
app.get('/api/devices/:id', (req, res) => {
  const device = devices[req.params.id];
  if (device) {
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

// Get recent messages
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || config.server.defaultMessageLimit;
  res.json(messages.slice(0, limit));
});

// Get system stats
app.get('/api/stats', (req, res) => {
  // Update uptime
  stats.uptime = process.uptime();
  res.json(stats);
});

// Send command to device
app.post('/api/devices/:id/command', (req, res) => {
  const deviceId = req.params.id;
  const device = devices[deviceId];
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const { command, params } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  try {
    const baseTopic = config.mqtt.baseTopic.endsWith('/') 
      ? config.mqtt.baseTopic.slice(0, -1) 
      : config.mqtt.baseTopic;
    
    // Publish command
    mqttClient.publish(
      `${baseTopic}/command/${deviceId}`,
      JSON.stringify({
        command,
        params: params || {},
        timestamp: new Date().toISOString(),
        requestId: Date.now().toString()
      })
    );
    
    res.json({ success: true, message: 'Command sent' });
  } catch (err) {
    console.error('Error sending command:', err);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data
  socket.emit('init', {
    devices: Object.values(devices),
    recentMessages: messages.slice(0, config.server.defaultMessageLimit),
    stats
  });
  
  // Handle device command
  socket.on('device-command', (data) => {
    try {
      const { deviceId, command, params } = data;
      
      if (!devices[deviceId]) {
        socket.emit('command-error', { 
          error: 'Device not found',
          deviceId,
          command 
        });
        return;
      }
      
      const baseTopic = config.mqtt.baseTopic.endsWith('/') 
        ? config.mqtt.baseTopic.slice(0, -1) 
        : config.mqtt.baseTopic;
      
      // Publish command
      mqttClient.publish(
        `${baseTopic}/command/${deviceId}`,
        JSON.stringify({
          command,
          params: params || {},
          timestamp: new Date().toISOString(),
          requestId: Date.now().toString()
        })
      );
      
      socket.emit('command-sent', { deviceId, command });
    } catch (err) {
      console.error('Error handling socket command:', err);
      socket.emit('command-error', { error: err.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Check for inactive devices periodically
setInterval(() => {
  const now = new Date();
  let changed = false;
  
  Object.keys(devices).forEach(deviceId => {
    const device = devices[deviceId];
    const lastSeen = new Date(device.lastSeen);
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    // Mark device as offline if not seen for configured timeout period
    if (diffMinutes > config.server.offlineTimeoutMinutes && device.status !== 'offline') {
      device.status = 'offline';
      changed = true;
      
      // Notify connected clients
      io.emit('device-update', {
        device
      });
    }
  });
  
  // Save if changes were made
  if (changed) {
    saveDevices();
  }
}, config.server.statusCheckInterval); // Check at configured interval

// Start server
server.listen(config.server.port, () => {
  console.log(`OBEDIO MQTT Server listening on port ${config.server.port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  
  // Send server offline status
  const baseTopic = config.mqtt.baseTopic.endsWith('/') 
    ? config.mqtt.baseTopic.slice(0, -1) 
    : config.mqtt.baseTopic;
  
  mqttClient.publish(
    `${baseTopic}/server/status`, 
    JSON.stringify({
      status: 'offline',
      timestamp: new Date().toISOString()
    }),
    { retain: true }
  );
  
  // Close MQTT connection
  mqttClient.end(true, () => {
    // Save data before exit
    saveDevices();
    process.exit(0);
  });
});
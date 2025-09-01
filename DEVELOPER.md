# OBEDIO MQTT Server Developer Guide

This document provides information for developers who want to extend or modify the OBEDIO MQTT Server.

## Project Structure

```
obedio-mqtt-server/
├── obedio-mqtt-server.js   # Main server file
├── package.json            # Project dependencies
├── .env.example            # Example environment variables
├── data/                   # Data storage directory
│   └── test-devices.json   # Sample test devices
├── public/                 # Web dashboard files
│   ├── index.html          # Dashboard HTML
│   ├── css/                # CSS styles
│   │   └── dashboard.css   # Custom dashboard styles
│   └── js/                 # JavaScript
│       └── dashboard.js    # Dashboard functionality
├── start.sh                # Linux/macOS startup script
└── start.bat               # Windows startup script
```

## Adding New Device Types

To add a new device type:

1. Update the device handling functions in `obedio-mqtt-server.js`:

```javascript
function handleDeviceStatus(deviceId, payload, timestamp) {
  // ...
  
  // Update device count
  if (payload.type === 'repeater') stats.deviceCounts.repeaters++;
  else if (payload.type === 'button') stats.deviceCounts.buttons++;
  else if (payload.type === 'smartwatch') stats.deviceCounts.smartwatches++;
  else if (payload.type === 'your-new-device-type') {
    // Initialize counter if it doesn't exist
    if (!stats.deviceCounts['your-new-device-type']) {
      stats.deviceCounts['your-new-device-type'] = 0;
    }
    stats.deviceCounts['your-new-device-type']++;
  }
  
  // ...
}
```

2. Update the dashboard UI in `public/js/dashboard.js`:

```javascript
// Device type icons
const deviceIcons = {
  'repeater': '<i class="bi bi-broadcast-pin"></i>',
  'button': '<i class="bi bi-record-circle"></i>',
  'smartwatch': '<i class="bi bi-smartwatch"></i>',
  'your-new-device-type': '<i class="bi bi-your-icon"></i>',
  'unknown': '<i class="bi bi-question-circle"></i>'
};
```

3. Add device-specific commands in the `showDeviceDetails` function in dashboard.js:

```javascript
// Add commands based on device type
if (device.type === 'your-new-device-type') {
  addCommandButton(commandsContainer, deviceId, 'command1', 'Command 1');
  addCommandButton(commandsContainer, deviceId, 'command2', 'Command 2');
}
```

## MQTT Topic Structure

The MQTT topics are structured as follows:

- `obedio/status/{deviceId}` - Device status updates
- `obedio/relay/{repeaterId}` - Messages being relayed through a repeater
- `obedio/command/{deviceId}` - Commands sent to devices
- `obedio/response/{deviceId}` - Device responses to commands
- `obedio/server/status` - Server status

## Adding New API Endpoints

To add a new API endpoint:

```javascript
// Add to obedio-mqtt-server.js
app.get('/api/your-new-endpoint', (req, res) => {
  // Handle the request
  res.json({
    // Your response data
  });
});

app.post('/api/your-new-endpoint', (req, res) => {
  const data = req.body;
  // Process the data
  res.json({
    success: true
  });
});
```

## Working with WebSockets

The dashboard uses Socket.IO for real-time communication. To add a new event:

1. In `obedio-mqtt-server.js`, emit the event:

```javascript
io.emit('your-new-event', {
  // Event data
});
```

2. In `public/js/dashboard.js`, listen for the event:

```javascript
socket.on('your-new-event', (data) => {
  console.log('New event:', data);
  // Handle the event
});
```

## Data Storage

Device data is stored in the `data/devices.json` file. The structure is:

```javascript
{
  "device-id": {
    "id": "device-id",
    "name": "Device Name",
    "type": "device-type",
    "status": "online|offline",
    "firstSeen": "ISO date string",
    "lastSeen": "ISO date string",
    "firmware": "version",
    "details": {
      // Device-specific details
    },
    "messages": [
      // Array of recent messages
    ]
  }
}
```

## Testing

You can use the `data/test-devices.json` file to simulate devices without actual hardware.

For MQTT testing, you can use the `mosquitto_pub` command line tool:

```bash
mosquitto_pub -h localhost -t "obedio/status/test-device" -m '{"type":"repeater","name":"Test Repeater","firmware":"1.0.0","battery":100,"signal":-60}'
```

## License

This project is licensed under the MIT License.
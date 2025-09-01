# OBEDIO IoT Device Management System

![OBEDIO IoT Dashboard](https://img.shields.io/badge/OBEDIO-IoT_Dashboard-007bff?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A comprehensive IoT device management system with a real-time dashboard for monitoring and controlling repeaters, buttons, and smart watches. Built with Node.js, Express, Socket.IO, and MQTT.

## Features

- 📡 **Real-time Device Monitoring**: Track device status, battery levels, and signal strength
- 📊 **Dashboard**: User-friendly web interface showing device statistics and activity
- ⚡ **Device Control**: Send commands to devices remotely
- 🔔 **Notifications**: Get alerts when devices go offline or have low battery
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure**: Configurable authentication for API endpoints
- 🔄 **Auto-reconnect**: Devices automatically reconnect to the server
- 📝 **Logging**: Detailed logs of device activity and server events

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- An MQTT broker (like [Mosquitto](https://mosquitto.org/))

### Installation

1. Clone this repository or download the source code
2. Install dependencies:

```bash
npm install
```

3. Configure the server:

Create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file to set your configuration options.

### Running the Server

#### On Linux/macOS:

```bash
./start.sh
```

#### On Windows:

```bash
start.bat
```

Or manually:

```bash
node obedio-mqtt-server.js
```

The web dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Device Types

### Repeaters

Repeaters relay messages between devices and the server. They're used to extend the network's range and provide connectivity to devices that can't directly connect to the server.

### Buttons

Simple IoT buttons that send signals when pressed. They can be used for various triggers like calling assistance, controlling devices, etc.

### Smart Watches

Wearable devices that monitor wearer status and allow sending alerts. They provide data like heart rate, step count, and location.

## MQTT Topics

The system uses the following MQTT topics:

- `obedio/status/{deviceId}` - Device status updates
- `obedio/relay/{repeaterId}` - Messages relayed through a repeater
- `obedio/command/{deviceId}` - Commands to devices
- `obedio/response/{deviceId}` - Device responses to commands
- `obedio/server/status` - Server status updates

## API Endpoints

The server provides RESTful API endpoints:

- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get details for a specific device
- `POST /api/devices/:id/command` - Send a command to a device
- `GET /api/stats` - Get system statistics

## Configuration

The server can be configured using environment variables or the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | 3000 |
| `MQTT_BROKER_URL` | MQTT broker URL | mqtt://localhost |
| `MQTT_USERNAME` | MQTT broker username | |
| `MQTT_PASSWORD` | MQTT broker password | |
| `DATA_PATH` | Path to store data | ./data |
| `LOG_LEVEL` | Logging level | info |
| `API_KEY` | API authentication key | |

## Development

For development information, see [DEVELOPER.md](DEVELOPER.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express](https://expressjs.com/) - Web server framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client
- [Bootstrap](https://getbootstrap.com/) - UI framework

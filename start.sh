#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p data

# Check if Mosquitto MQTT broker is installed
if ! command -v mosquitto &> /dev/null; then
    echo "Mosquitto MQTT broker not found. You may need to install it."
    echo "On Ubuntu/Debian: sudo apt-get install mosquitto"
    echo "On macOS: brew install mosquitto"
    echo "On Windows: Download from https://mosquitto.org/download/"
    echo ""
    echo "Attempting to continue anyway, in case you have another MQTT broker running..."
    echo ""
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js to run this server."
    echo "Download from https://nodejs.org/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting OBEDIO MQTT Server..."
node obedio-mqtt-server.js
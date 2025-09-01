@echo off
REM OBEDIO MQTT Server Startup Script for Windows

REM Create data directory if it doesn't exist
if not exist data mkdir data

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js to run this server.
    echo Download from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Start the server
echo Starting OBEDIO MQTT Server...
node obedio-mqtt-server.js
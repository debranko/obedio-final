// Simple script to start the MQTT Bridge process
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting MQTT Bridge service...');

// Command to run the TypeScript file using ts-node
const command = 'npx';
const args = ['ts-node', path.join(__dirname, 'mqttBridge.ts')];

// Spawn process
const process = spawn(command, args, {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Handle process output
process.stdout.on('data', (data) => {
  console.log(`MQTT Bridge: ${data.toString().trim()}`);
});

process.stderr.on('data', (data) => {
  console.error(`MQTT Bridge Error: ${data.toString().trim()}`);
});

process.on('close', (code) => {
  console.log(`MQTT Bridge process exited with code ${code}`);
});

// Unref process to allow the parent to exit
process.unref();

console.log(`MQTT Bridge started with PID: ${process.pid}`);
console.log('You can close this terminal window, and the MQTT Bridge will continue running in the background.');

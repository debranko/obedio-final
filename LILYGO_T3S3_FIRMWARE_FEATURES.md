# LilyGO T3 S3 MQTT Repeater Firmware - Enhanced Features

## Hardware Configuration
- **Board**: LilyGO T3-S3 v1.0 with SX1262 868MHz [H595]
- **Frequency**: 868.1 MHz (Europe ISM band)
- **Pin Configuration**: Optimized for SX1262 chip (DIO1 instead of DIO0)

## Key Enhancements

### 1. SX1262 Optimization
- Correct pin mapping for SX1262 chip
- DIO1 pin configuration (pin 33)
- BUSY pin support (pin 34)
- Enhanced LoRa initialization with communication test

### 2. Advanced LoRa Configuration
- **4 Preset Configurations**:
  - Max Range: SF12, 125kHz BW, 22dBm (default)
  - Balanced: SF10, 125kHz BW, 20dBm
  - Fast: SF7, 125kHz BW, 17dBm
  - Wide Bandwidth: SF9, 250kHz BW, 20dBm
- Button-triggered configuration switching
- Runtime configuration changes via MQTT

### 3. Message Queuing System
- **Queue Size**: 10 messages
- **Retry Logic**: Up to 3 attempts per message
- **Message Expiry**: 5-minute timeout
- **Bidirectional**: MQTT→LoRa and LoRa→MQTT queuing

### 4. Error Handling & Recovery
- **Automatic Recovery**: LoRa and WiFi reconnection
- **Error Counters**: Separate tracking for LoRa and MQTT errors
- **Backup WiFi**: Automatic fallback to secondary network
- **Watchdog**: System reset on critical failures

### 5. Enhanced Monitoring
- **Comprehensive Telemetry**: Queue status, error counts, configuration info
- **Diagnostic Messages**: Periodic LoRa health checks
- **Status Reporting**: Detailed system status via serial and MQTT

### 6. Button Interface
- **Single Press**: Cycle through LoRa configurations
- **Debouncing**: 200ms debounce protection
- **Visual Feedback**: LED status indication

## LED Status Indicators
- **Solid ON**: All systems operational (WiFi + MQTT + LoRa)
- **Slow Blink**: WiFi connected, MQTT/LoRa issues
- **Fast Blink**: WiFi disconnected

## MQTT Topics
- **Commands**: `obedio/yacht-1/Hodnik/repeater_1756077845409/command`
- **Telemetry**: `obedio/yacht-1/Hodnik/repeater_1756077845409/telemetry`
- **Status**: `obedio/yacht-1/Hodnik/repeater_1756077845409/status`

## Configuration Options
```cpp
// Primary WiFi
WIFI_SSID = "Brother RX3900"
WIFI_PASSWORD = "brankobbb"

// Backup WiFi
WIFI_SSID_BACKUP = "OBEDIO_GUEST"
WIFI_PASSWORD_BACKUP = "obedio2025"

// LoRa Settings
FREQUENCY = 868.1 MHz
SYNC_WORD = 0x12 (private)
TX_POWER = 22 dBm (max for SX1262)
```

## Usage Instructions

### 1. Hardware Setup
- Connect LilyGO T3 S3 with SX1262 868MHz module
- Ensure antenna is properly connected
- Power via USB or external 3.3V-5V supply

### 2. Software Upload
- Install required libraries: WiFi, PubSubClient, ArduinoJson, LoRa
- Upload firmware via Arduino IDE or PlatformIO
- Monitor serial output for initialization status

### 3. Operation
- Device auto-connects to WiFi and MQTT broker
- Button press cycles through LoRa configurations
- Monitor status via serial console or MQTT telemetry

### 4. Troubleshooting
- Check serial output for error messages
- Verify WiFi credentials and MQTT broker settings
- Ensure LoRa antenna is properly connected
- Use button to switch LoRa configurations if needed

## Performance Characteristics
- **Range**: Up to several kilometers (depending on configuration)
- **Data Rate**: 293 bps to 5.47 kbps (configuration dependent)
- **Reliability**: Message queuing with retry logic
- **Power**: Optimized for continuous operation
- **Recovery**: Automatic error recovery and reconnection

## Future Enhancements
- EEPROM configuration storage
- Over-the-air (OTA) updates
- Web interface for configuration
- GPS integration for location tracking
- Battery monitoring and power management
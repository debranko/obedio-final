# LilyGO T3-S3 MQTT LoRa Repeater

## Pregled

Ovaj firmware implementira MQTT bridge funkcionalnost na LilyGO T3-S3 v1.0 board-u, omogućavajući komunikaciju između WiFi/MQTT mreže i LoRa uređaja.

## Hardware Specifikacije

- **Board**: LilyGO T3-S3 v1.0
- **MCU**: ESP32-S3
- **LoRa**: SX1262/76/80
- **Frekvencija**: 868MHz (Evropa/Srbija)
- **Antena**: Ugrađena LoRa antena

## Funkcionalnosti

### Osnovne funkcije
- ✅ WiFi connection manager sa auto-reconnect
- ✅ MQTT client sa reconnect logikom
- ✅ LoRa radio komunikacija (868MHz)
- ✅ Bidirekcijski message bridge (MQTT ↔ LoRa)
- ✅ Status reporting i heartbeat (60s interval)
- ✅ Error handling i watchdog
- ✅ LED status indikator

### Message Bridge
- **MQTT → LoRa**: Prima komande preko MQTT-a i prosleđuje ih LoRa uređajima
- **LoRa → MQTT**: Prima poruke od LoRa uređaja i prosleđuje ih na MQTT telemetry topic

## Konfiguracija

### WiFi Postavke
```cpp
const char* WIFI_SSID = "Brother RX3900";
const char* WIFI_PASSWORD = "brankobbb";
```

### MQTT Postavke
```cpp
const char* MQTT_SERVER = "mqtt.obedio.local";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "obedio_repeater_1756077845409";
const char* MQTT_USERNAME = "repeater_hodnik_";
const char* MQTT_PASSWORD = "6tMGojSEJKrNDSBo";
```

### MQTT Topics
- **Command**: `obedio/yacht-1/Hodnik/repeater_1756077845409/command`
- **Telemetry**: `obedio/yacht-1/Hodnik/repeater_1756077845409/telemetry`
- **Status**: `obedio/yacht-1/Hodnik/repeater_1756077845409/status`

### LoRa Parametri
- **Frekvencija**: 868.1 MHz
- **Spreading Factor**: 10 (dobar balans domet/brzina)
- **Bandwidth**: 125 kHz
- **Coding Rate**: 4/5
- **TX Power**: 20 dBm (maksimalno)

## Instalacija

### Potrebne biblioteke

Instaliraj sledeće biblioteke preko Arduino IDE Library Manager-a:

1. **WiFi** (ugrađena u ESP32 core)
2. **PubSubClient** by Nick O'Leary
   ```
   Sketch → Include Library → Manage Libraries → Search "PubSubClient"
   ```

3. **ArduinoJson** by Benoit Blanchon
   ```
   Sketch → Include Library → Manage Libraries → Search "ArduinoJson"
   ```

4. **LoRa** by Sandeep Mistry
   ```
   Sketch → Include Library → Manage Libraries → Search "LoRa"
   ```

### Board Setup

1. **Instaliraj ESP32 Board Package**:
   - File → Preferences → Additional Board Manager URLs
   - Dodaj: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. **Selektuj Board**:
   - Tools → Board → ESP32 Arduino → ESP32S3 Dev Module

3. **Podesi Board Settings**:
   ```
   Board: "ESP32S3 Dev Module"
   USB CDC On Boot: "Enabled"
   CPU Frequency: "240MHz (WiFi/BT)"
   Flash Mode: "QIO"
   Flash Size: "16MB (128Mb)"
   Partition Scheme: "Default 4MB with spiffs"
   PSRAM: "PSRAM"
   Upload Mode: "UART0 / Hardware CDC"
   Upload Speed: "921600"
   ```

### Upload Procedure

1. **Pripremi Board**:
   - Povezuj LilyGO T3-S3 na računar preko USB-C kabla
   - Pritisni i drži BOOT dugme
   - Kratko pritisni RESET dugme
   - Otpusti BOOT dugme (board je sada u download mode)

2. **Upload Firmware**:
   - Otvori `LILYGO_T3S3_MQTT_REPEATER.ino` u Arduino IDE
   - Selektuj odgovarajući COM port (Tools → Port)
   - Klikni Upload (Ctrl+U)

3. **Monitor Serial Output**:
   - Tools → Serial Monitor
   - Set baud rate na 115200
   - Pritisni RESET dugme na board-u da restartuje

## LED Status Indikatori

- **Solid ON**: Sve je u redu (WiFi + MQTT + LoRa)
- **Slow Blink (1s)**: WiFi povezan, ali MQTT ili LoRa problem
- **Fast Blink (200ms)**: WiFi nije povezan

## Serial Monitor Output

Firmware ispisuje detaljne informacije preko Serial Monitor-a:

```
=================================
LilyGO T3-S3 MQTT LoRa Repeater
=================================
✓ Pins initialized
✓ Watchdog initialized
✓ LoRa configured: 868100000 Hz, SF10, BW125000, CR4/5, 20dBm
✓ LoRa initialized successfully
Connecting to WiFi: Brother RX3900..........
✓ WiFi connected! IP: 192.168.1.100
✓ Signal strength: -45 dBm
Setup completed!
=================================
```

## Message Format

### MQTT → LoRa
```json
{
  "topic": "obedio/yacht-1/Hodnik/repeater_1756077845409/command",
  "message": "original_mqtt_message",
  "timestamp": 12345678,
  "source": "mqtt"
}
```

### LoRa → MQTT
```json
{
  "originalMessage": "lora_message_content",
  "rssi": -85,
  "snr": 8.5,
  "timestamp": 12345678,
  "source": "lora"
}
```

## Telemetry Data

Repeater šalje telemetriju svakih 60 sekundi:

```json
{
  "deviceId": "obedio_repeater_1756077845409",
  "timestamp": 12345678,
  "uptime": 300000,
  "wifi": {
    "connected": true,
    "rssi": -45,
    "ip": "192.168.1.100"
  },
  "mqtt": {
    "connected": true
  },
  "lora": {
    "initialized": true
  },
  "stats": {
    "messagesReceived": 25,
    "messagesSent": 30,
    "mqttToLora": 15,
    "loraToMqtt": 10
  },
  "system": {
    "freeHeap": 245760,
    "cpuFreq": 240
  }
}
```

## Troubleshooting

### WiFi Connection Issues
- Proverite SSID i password
- Proverite da li je router u dometu
- Restartujte board (RESET dugme)

### MQTT Connection Issues
- Proverite da li je MQTT broker dostupan
- Proverite username/password
- Proverite network connectivity

### LoRa Issues
- Proverite antenu konekciju
- Proverite da li su drugi LoRa uređaji na istoj frekvenciji
- Proverite LoRa parametre (SF, BW, CR)

### Upload Issues
- Proverite da li je board u download mode (BOOT + RESET)
- Proverite USB kabel i driver
- Proverite COM port selection

## Napredne Funkcije (Buduće Verzije)

- 🔄 Mesh networking
- 💾 Message caching
- 🔐 Encryption
- 📊 Advanced statistics
- 🌐 Web interface
- 📱 OTA updates

## Support

Za pitanja i podršku, kontaktirajte OBEDIO development tim.

---
**Verzija**: 1.0  
**Datum**: 2025  
**Autor**: OBEDIO System
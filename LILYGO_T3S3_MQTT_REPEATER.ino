
/*
 * LilyGO T3-S3 MQTT LoRa Repeater
 * 
 * Hardware: LilyGO T3-S3 v1.0 (ESP32-S3 + SX1262 LoRa)
 * Function: MQTT Bridge between WiFi and LoRa networks
 * Frequency: 868MHz (Europe/Serbia)
 * 
 * Author: Generated for OBEDIO System
 * Date: 2025
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <LoRa.h>
#include <esp_task_wdt.h>

// ===== HARDWARE CONFIGURATION =====
// LilyGO T3-S3 v1.0 with SX1262 868MHz [H595] Pin Definitions
#define LORA_SCK_PIN        5
#define LORA_MISO_PIN       3
#define LORA_MOSI_PIN       6
#define LORA_SS_PIN         7
#define LORA_RST_PIN        8
#define LORA_DIO1_PIN       33    // SX1262 uses DIO1 instead of DIO0
#define LORA_BUSY_PIN       34    // SX1262 BUSY pin
#define LORA_TXEN_PIN       -1    // Not used on this board
#define LORA_RXEN_PIN       -1    // Not used on this board

// OLED Display (optional)
#define OLED_SDA_PIN        17
#define OLED_SCL_PIN        18
#define OLED_RST_PIN        -1

// Built-in LED
#define LED_PIN             37

// Button (if available)
#define BUTTON_PIN          0

// ===== NETWORK CONFIGURATION =====
// TODO: Move these to EEPROM or config file for production
const char* WIFI_SSID = "Brother RX3900";
const char* WIFI_PASSWORD = "brankobbb";

// Alternative WiFi networks (fallback)
const char* WIFI_SSID_BACKUP = "OBEDIO_GUEST";
const char* WIFI_PASSWORD_BACKUP = "obedio2025";

// ===== MQTT CONFIGURATION =====
const char* MQTT_SERVER = "mqtt.obedio.local";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "obedio_repeater_1756077845409";
const char* MQTT_USERNAME = "repeater_hodnik_";
const char* MQTT_PASSWORD = "6tMGojSEJKrNDSBo";

// MQTT Topics
const char* MQTT_COMMAND_TOPIC = "obedio/yacht-1/Hodnik/repeater_1756077845409/command";
const char* MQTT_TELEMETRY_TOPIC = "obedio/yacht-1/Hodnik/repeater_1756077845409/telemetry";
const char* MQTT_STATUS_TOPIC = "obedio/yacht-1/Hodnik/repeater_1756077845409/status";

// ===== LORA CONFIGURATION =====
// Optimized for SX1262 868MHz operation in Europe
const long LORA_FREQUENCY = 868100000;  // 868.1 MHz (Europe ISM band)
const int LORA_SF = 12;                  // Spreading Factor (12 for maximum range)
const long LORA_BW = 125000;             // Bandwidth 125 kHz (standard)
const int LORA_CR = 5;                   // Coding Rate 4/5 (good error correction)
const int LORA_TX_POWER = 22;            // TX Power 22 dBm (max for SX1262)
const int LORA_PREAMBLE = 8;             // Preamble length (standard)
const int LORA_SYNC_WORD = 0x12;         // Private sync word (avoid interference)

// Alternative LoRa configurations for different scenarios
struct LoRaConfig {
  int sf;
  long bw;
  int cr;
  int power;
  const char* description;
};

const LoRaConfig LORA_CONFIGS[] = {
  {12, 125000, 5, 22, "Max Range"},      // Current default
  {10, 125000, 5, 20, "Balanced"},       // Good range/speed balance
  {7,  125000, 5, 17, "Fast"},           // Higher data rate
  {9,  250000, 5, 20, "Wide Bandwidth"}  // Better for high traffic
};
const int LORA_CONFIG_COUNT = 4;
int currentLoRaConfig = 0; // Index of current configuration

// ===== TIMING CONFIGURATION =====
const unsigned long HEARTBEAT_INTERVAL = 60000;      // 60 seconds
const unsigned long WIFI_RECONNECT_INTERVAL = 30000; // 30 seconds
const unsigned long MQTT_RECONNECT_INTERVAL = 5000;  // 5 seconds
const unsigned long WATCHDOG_TIMEOUT = 120000;       // 2 minutes
const unsigned long LORA_RETRY_DELAY = 1000;         // 1 second between LoRa retries
const int MAX_LORA_RETRIES = 3;                      // Maximum LoRa transmission retries

// ===== GLOBAL VARIABLES =====
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastHeartbeat = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastMqttCheck = 0;
unsigned long bootTime = 0;

bool wifiConnected = false;
bool mqttConnected = false;
bool loraInitialized = false;

// Statistics
unsigned long messagesReceived = 0;
unsigned long messagesSent = 0;
unsigned long mqttToLoraCount = 0;
unsigned long loraToMqttCount = 0;
unsigned long loraErrors = 0;
unsigned long mqttErrors = 0;

// Message queue for reliability
struct QueuedMessage {
  String payload;
  unsigned long timestamp;
  int retryCount;
  bool isMqttToLora;
};

const int MAX_QUEUE_SIZE = 10;
QueuedMessage messageQueue[MAX_QUEUE_SIZE];
int queueHead = 0;
int queueTail = 0;
int queueSize = 0;

// Button handling
unsigned long lastButtonPress = 0;
bool buttonPressed = false;
const unsigned long BUTTON_DEBOUNCE = 200;

// ===== FUNCTION DECLARATIONS =====
void initializePins();
void initializeWatchdog();
bool initializeLoRa();
bool testLoRaCommunication();
void initializeWiFi();
void handleWiFi();
void handleMQTT();
void attemptMqttConnection();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
void forwardMqttToLoRa(const String& topic, const String& message);
bool sendLoRaMessage(const String& payload);
void queueMessage(const String& payload, bool isMqttToLora);
void processMessageQueue();
void removeFromQueue();
void handleLoRa();
void forwardLoRaToMqtt(const String& loraMessage, int rssi, float snr);
void handleHeartbeat();
void publishTelemetry();
void publishStatus(const char* status);
void printStatus();
void updateStatusLED();
void handleButton();
void onButtonPress();
bool applyLoRaConfig(int configIndex);
void publishConfigChange();
bool tryBackupWiFi();
void sendDiagnosticMessage();
void performErrorRecovery();

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("LilyGO T3-S3 MQTT LoRa Repeater");
  Serial.println("=================================");
  
  bootTime = millis();
  
  // Initialize hardware
  initializePins();
  initializeWatchdog();
  
  // Initialize LoRa with retries
  int loraRetries = 0;
  while (!loraInitialized && loraRetries < 3) {
    if (initializeLoRa()) {
      Serial.println("✓ LoRa initialized successfully");
      loraInitialized = true;
    } else {
      loraRetries++;
      Serial.printf("✗ LoRa initialization failed (attempt %d/3)\n", loraRetries);
      if (loraRetries < 3) {
        delay(2000);
      }
    }
  }
  
  if (!loraInitialized) {
    Serial.println("✗ LoRa initialization failed after 3 attempts");
    Serial.println("⚠️  Continuing without LoRa functionality");
  }
  
  // Initialize WiFi
  initializeWiFi();
  
  // Initialize MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  
  Serial.println("Setup completed!");
  Serial.println("=================================");
}

// ===== MAIN LOOP =====
void loop() {
  // Reset watchdog
  esp_task_wdt_reset();
  
  // Handle button press
  handleButton();
  
  // Handle WiFi connection
  handleWiFi();
  
  // Handle MQTT connection
  handleMQTT();
  
  // Handle LoRa messages
  handleLoRa();
  
  // Process message queue
  processMessageQueue();
  
  // Send heartbeat
  handleHeartbeat();
  
  // Update LED status
  updateStatusLED();
  
  delay(100); // Small delay to prevent overwhelming the system
}

// ===== INITIALIZATION FUNCTIONS =====
void initializePins() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize button pin if available
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  Serial.println("✓ Pins initialized");
}

void initializeWatchdog() {
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = WATCHDOG_TIMEOUT,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);
  
  Serial.println("✓ Watchdog initialized");
}

bool initializeLoRa() {
  Serial.println("Initializing LoRa SX1262...");
  
  // Configure SPI pins for LoRa
  SPI.begin(LORA_SCK_PIN, LORA_MISO_PIN, LORA_MOSI_PIN, LORA_SS_PIN);
  
  // Set LoRa pins for SX1262
  LoRa.setPins(LORA_SS_PIN, LORA_RST_PIN, LORA_DIO1_PIN);
  
  // Initialize LoRa with frequency
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("✗ LoRa.begin() failed");
    return false;
  }
  
  // Configure LoRa parameters optimized for SX1262
  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.setTxPower(LORA_TX_POWER);
  LoRa.setPreambleLength(LORA_PREAMBLE);
  LoRa.setSyncWord(LORA_SYNC_WORD);
  
  // Enable CRC for error detection
  LoRa.enableCrc();
  
  // Test LoRa communication
  delay(100);
  if (!testLoRaCommunication()) {
    Serial.println("✗ LoRa communication test failed");
    return false;
  }
  
  Serial.printf("✓ LoRa SX1262 configured: %ld Hz, SF%d, BW%ld, CR4/%d, %ddBm\n", 
                LORA_FREQUENCY, LORA_SF, LORA_BW, LORA_CR, LORA_TX_POWER);
  
  return true;
}

bool testLoRaCommunication() {
  // Send a test packet to verify LoRa is working
  LoRa.beginPacket();
  LoRa.print("INIT_TEST");
  if (LoRa.endPacket()) {
    Serial.println("✓ LoRa test transmission successful");
    return true;
  } else {
    Serial.println("✗ LoRa test transmission failed");
    return false;
  }
}

void initializeWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.printf("✓ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("✓ Signal strength: %d dBm\n", WiFi.RSSI());
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("✗ WiFi connection failed");
  }
}

// ===== WIFI HANDLING =====
void handleWiFi() {
  if (millis() - lastWiFiCheck > WIFI_RECONNECT_INTERVAL) {
    lastWiFiCheck = millis();
    
    if (WiFi.status() != WL_CONNECTED) {
      if (wifiConnected) {
        Serial.println("WiFi connection lost, attempting reconnect...");
        wifiConnected = false;
        mqttConnected = false;
      }
      
      WiFi.reconnect();
      delay(1000);
      
      if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
        wifiConnected = true;
        Serial.printf("✓ WiFi reconnected! IP: %s\n", WiFi.localIP().toString().c_str());
      }
    } else if (!wifiConnected) {
      wifiConnected = true;
      Serial.printf("✓ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    }
  }
}

// ===== MQTT HANDLING =====
void handleMQTT() {
  if (!wifiConnected) {
    mqttConnected = false;
    return;
  }
  
  if (!mqttClient.connected()) {
    if (mqttConnected) {
      Serial.println("MQTT connection lost");
      mqttConnected = false;
    }
    
    if (millis() - lastMqttCheck > MQTT_RECONNECT_INTERVAL) {
      lastMqttCheck = millis();
      attemptMqttConnection();
    }
  } else {
    mqttClient.loop();
    
    if (!mqttConnected) {
      mqttConnected = true;
      Serial.println("✓ MQTT connected and subscribed");
      publishStatus("online");
    }
  }
}

void attemptMqttConnection() {
  Serial.printf("Attempting MQTT connection to %s:%d...", MQTT_SERVER, MQTT_PORT);
  
  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" connected!");
    
    // Subscribe to command topic
    if (mqttClient.subscribe(MQTT_COMMAND_TOPIC)) {
      Serial.printf("✓ Subscribed to: %s\n", MQTT_COMMAND_TOPIC);
    } else {
      Serial.printf("✗ Failed to subscribe to: %s\n", MQTT_COMMAND_TOPIC);
    }
    
    mqttConnected = true;
  } else {
    Serial.printf(" failed, rc=%d\n", mqttClient.state());
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("MQTT received [%s]: %s\n", topic, message.c_str());
  messagesReceived++;
  
  // Forward message to LoRa
  if (loraInitialized) {
    forwardMqttToLoRa(topic, message);
  }
}

void forwardMqttToLoRa(const String& topic, const String& message) {
  // Create LoRa packet with topic and message
  DynamicJsonDocument doc(512);
  doc["topic"] = topic;
  doc["message"] = message;
  doc["timestamp"] = millis();
  doc["source"] = "mqtt";
  
  String loraPayload;
  serializeJson(doc, loraPayload);
  
  // Try to send immediately, if fails add to queue
  if (!sendLoRaMessage(loraPayload)) {
    queueMessage(loraPayload, true);
  } else {
    mqttToLoraCount++;
    messagesSent++;
    Serial.printf("LoRa sent: %s\n", loraPayload.c_str());
  }
}

bool sendLoRaMessage(const String& payload) {
  if (!loraInitialized) {
    Serial.println("✗ LoRa not initialized, cannot send message");
    return false;
  }
  
  // Check payload size (LoRa has limited packet size)
  if (payload.length() > 255) {
    Serial.printf("✗ Message too long (%d bytes), max 255\n", payload.length());
    loraErrors++;
    return false;
  }
  
  // Send with retry mechanism
  for (int retry = 0; retry < MAX_LORA_RETRIES; retry++) {
    LoRa.beginPacket();
    LoRa.print(payload);
    
    if (LoRa.endPacket()) {
      return true; // Success
    } else {
      Serial.printf("✗ LoRa transmission failed (attempt %d/%d)\n", retry + 1, MAX_LORA_RETRIES);
      if (retry < MAX_LORA_RETRIES - 1) {
        delay(LORA_RETRY_DELAY);
      }
    }
  }
  
  loraErrors++;
  return false; // All retries failed
}

void queueMessage(const String& payload, bool isMqttToLora) {
  if (queueSize >= MAX_QUEUE_SIZE) {
    Serial.println("⚠️  Message queue full, dropping oldest message");
    // Remove oldest message
    queueHead = (queueHead + 1) % MAX_QUEUE_SIZE;
    queueSize--;
  }
  
  // Add new message to queue
  messageQueue[queueTail].payload = payload;
  messageQueue[queueTail].timestamp = millis();
  messageQueue[queueTail].retryCount = 0;
  messageQueue[queueTail].isMqttToLora = isMqttToLora;
  
  queueTail = (queueTail + 1) % MAX_QUEUE_SIZE;
  queueSize++;
  
  Serial.printf("Message queued (queue size: %d)\n", queueSize);
}

void processMessageQueue() {
  if (queueSize == 0) return;
  
  static unsigned long lastQueueProcess = 0;
  if (millis() - lastQueueProcess < 2000) return; // Process queue every 2 seconds
  lastQueueProcess = millis();
  
  // Process oldest message in queue
  QueuedMessage& msg = messageQueue[queueHead];
  
  // Check if message is too old (5 minutes)
  if (millis() - msg.timestamp > 300000) {
    Serial.println("⚠️  Dropping expired message from queue");
    removeFromQueue();
    return;
  }
  
  bool success = false;
  if (msg.isMqttToLora && loraInitialized) {
    success = sendLoRaMessage(msg.payload);
    if (success) {
      mqttToLoraCount++;
      messagesSent++;
    }
  } else if (!msg.isMqttToLora && mqttConnected) {
    success = mqttClient.publish(MQTT_TELEMETRY_TOPIC, msg.payload.c_str());
    if (success) {
      loraToMqttCount++;
      messagesSent++;
    }
  }
  
  if (success) {
    Serial.printf("✓ Queued message sent successfully\n");
    removeFromQueue();
  } else {
    msg.retryCount++;
    if (msg.retryCount >= MAX_LORA_RETRIES) {
      Serial.printf("✗ Message failed after %d retries, dropping\n", MAX_LORA_RETRIES);
      removeFromQueue();
    }
  }
}

void removeFromQueue() {
  if (queueSize > 0) {
    queueHead = (queueHead + 1) % MAX_QUEUE_SIZE;
    queueSize--;
  }
}

// ===== LORA HANDLING =====
void handleLoRa() {
  if (!loraInitialized) return;
  
  // Check for incoming LoRa packets
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String loraMessage = "";
    
    // Read packet
    while (LoRa.available()) {
      loraMessage += (char)LoRa.read();
    }
    
    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();
    
    Serial.printf("LoRa received (RSSI: %d, SNR: %.2f): %s\n", rssi, snr, loraMessage.c_str());
    messagesReceived++;
    
    // Forward to MQTT if connected
    if (mqttConnected) {
      forwardLoRaToMqtt(loraMessage, rssi, snr);
    }
  }
}

void forwardLoRaToMqtt(const String& loraMessage, int rssi, float snr) {
  // Parse LoRa message
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, loraMessage);
  
  if (error) {
    Serial.printf("JSON parse error: %s\n", error.c_str());
    return;
  }
  
  // Create telemetry message
  DynamicJsonDocument telemetryDoc(512);
  telemetryDoc["originalMessage"] = loraMessage;
  telemetryDoc["rssi"] = rssi;
  telemetryDoc["snr"] = snr;
  telemetryDoc["timestamp"] = millis();
  telemetryDoc["source"] = "lora";
  
  String telemetryPayload;
  serializeJson(telemetryDoc, telemetryPayload);
  
  // Try to publish immediately, if fails add to queue
  if (mqttConnected && mqttClient.publish(MQTT_TELEMETRY_TOPIC, telemetryPayload.c_str())) {
    loraToMqttCount++;
    messagesSent++;
    Serial.printf("MQTT published to telemetry: %s\n", telemetryPayload.c_str());
  } else {
    if (!mqttConnected) {
      Serial.println("⚠️  MQTT not connected, queueing message");
    } else {
      Serial.println("✗ Failed to publish to MQTT, queueing message");
      mqttErrors++;
    }
    queueMessage(telemetryPayload, false);
  }
}

// ===== STATUS AND HEARTBEAT =====
void handleHeartbeat() {
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    
    if (mqttConnected) {
      publishTelemetry();
      publishStatus("online");
    }
    
    // Send diagnostic LoRa message every 5 minutes
    static unsigned long lastDiagnostic = 0;
    if (millis() - lastDiagnostic > 300000) { // 5 minutes
      lastDiagnostic = millis();
      sendDiagnosticMessage();
    }
    
    // Perform error recovery if needed
    static unsigned long lastErrorCheck = 0;
    if (millis() - lastErrorCheck > 120000) { // 2 minutes
      lastErrorCheck = millis();
      if (loraErrors > 5 || mqttErrors > 5) {
        performErrorRecovery();
      }
    }
    
    // Print status to serial
    printStatus();
  }
}

void publishTelemetry() {
  DynamicJsonDocument doc(512);
  
  // Device info
  doc["deviceId"] = MQTT_CLIENT_ID;
  doc["timestamp"] = millis();
  doc["uptime"] = millis() - bootTime;
  
  // Network status
  doc["wifi"]["connected"] = wifiConnected;
  if (wifiConnected) {
    doc["wifi"]["rssi"] = WiFi.RSSI();
    doc["wifi"]["ip"] = WiFi.localIP().toString();
  }
  
  doc["mqtt"]["connected"] = mqttConnected;
  doc["lora"]["initialized"] = loraInitialized;
  
  // Statistics
  doc["stats"]["messagesReceived"] = messagesReceived;
  doc["stats"]["messagesSent"] = messagesSent;
  doc["stats"]["mqttToLora"] = mqttToLoraCount;
  doc["stats"]["loraToMqtt"] = loraToMqttCount;
  doc["stats"]["loraErrors"] = loraErrors;
  doc["stats"]["mqttErrors"] = mqttErrors;
  
  // Queue status
  doc["queue"]["size"] = queueSize;
  doc["queue"]["maxSize"] = MAX_QUEUE_SIZE;
  
  // LoRa configuration
  doc["lora"]["frequency"] = LORA_FREQUENCY;
  doc["lora"]["config"] = LORA_CONFIGS[currentLoRaConfig].description;
  doc["lora"]["configIndex"] = currentLoRaConfig;
  doc["lora"]["sf"] = LORA_CONFIGS[currentLoRaConfig].sf;
  doc["lora"]["bandwidth"] = LORA_CONFIGS[currentLoRaConfig].bw;
  doc["lora"]["power"] = LORA_CONFIGS[currentLoRaConfig].power;
  
  // System info
  doc["system"]["freeHeap"] = ESP.getFreeHeap();
  doc["system"]["cpuFreq"] = ESP.getCpuFreqMHz();
  doc["system"]["temperature"] = temperatureRead();
  
  String payload;
  serializeJson(doc, payload);
  
  mqttClient.publish(MQTT_TELEMETRY_TOPIC, payload.c_str());
  Serial.printf("Telemetry published: %s\n", payload.c_str());
}

void publishStatus(const char* status) {
  DynamicJsonDocument doc(256);
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["deviceId"] = MQTT_CLIENT_ID;
  
  String payload;
  serializeJson(doc, payload);
  
  mqttClient.publish(MQTT_STATUS_TOPIC, payload.c_str());
  Serial.printf("Status published: %s\n", payload.c_str());
}

void printStatus() {
  Serial.println("=== STATUS REPORT ===");
  Serial.printf("Uptime: %lu ms\n", millis() - bootTime);
  Serial.printf("WiFi: %s", wifiConnected ? "Connected" : "Disconnected");
  if (wifiConnected) {
    Serial.printf(" (RSSI: %d dBm)", WiFi.RSSI());
  }
  Serial.println();
  Serial.printf("MQTT: %s\n", mqttConnected ? "Connected" : "Disconnected");
  Serial.printf("LoRa: %s", loraInitialized ? "Initialized" : "Failed");
  if (loraInitialized) {
    Serial.printf(" (%s)", LORA_CONFIGS[currentLoRaConfig].description);
  }
  Serial.println();
  Serial.printf("Messages: RX=%lu, TX=%lu\n", messagesReceived, messagesSent);
  Serial.printf("Bridge: MQTT→LoRa=%lu, LoRa→MQTT=%lu\n", mqttToLoraCount, loraToMqttCount);
  Serial.printf("Errors: LoRa=%lu, MQTT=%lu\n", loraErrors, mqttErrors);
  Serial.printf("Queue: %d/%d messages\n", queueSize, MAX_QUEUE_SIZE);
  Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.println("====================");
}

// ===== LED STATUS =====
void updateStatusLED() {
  static unsigned long lastLedUpdate = 0;
  static bool ledState = false;
  
  if (millis() - lastLedUpdate > 1000) {
    lastLedUpdate = millis();
    
    if (wifiConnected && mqttConnected && loraInitialized) {
      // All systems operational - solid on
      digitalWrite(LED_PIN, HIGH);
    } else if (wifiConnected) {
      // WiFi connected but MQTT or LoRa issues - slow blink
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
    } else {
      // WiFi disconnected - fast blink
      if (millis() % 200 < 100) {
        digitalWrite(LED_PIN, HIGH);
      } else {
        digitalWrite(LED_PIN, LOW);
      }
    }
  }
}

// ===== BUTTON HANDLING =====
void handleButton() {
  if (digitalRead(BUTTON_PIN) == LOW && !buttonPressed) {
    if (millis() - lastButtonPress > BUTTON_DEBOUNCE) {
      buttonPressed = true;
      lastButtonPress = millis();
      onButtonPress();
    }
  } else if (digitalRead(BUTTON_PIN) == HIGH && buttonPressed) {
    buttonPressed = false;
  }
}

void onButtonPress() {
  Serial.println("Button pressed - switching LoRa configuration");
  
  // Cycle through LoRa configurations
  currentLoRaConfig = (currentLoRaConfig + 1) % LORA_CONFIG_COUNT;
  
  // Apply new configuration
  if (applyLoRaConfig(currentLoRaConfig)) {
    Serial.printf("✓ Switched to LoRa config: %s\n", LORA_CONFIGS[currentLoRaConfig].description);
    
    // Publish configuration change via MQTT
    if (mqttConnected) {
      publishConfigChange();
    }
  } else {
    Serial.println("✗ Failed to apply LoRa configuration");
    // Revert to previous config
    currentLoRaConfig = (currentLoRaConfig - 1 + LORA_CONFIG_COUNT) % LORA_CONFIG_COUNT;
  }
}

bool applyLoRaConfig(int configIndex) {
  if (configIndex < 0 || configIndex >= LORA_CONFIG_COUNT) {
    return false;
  }
  
  const LoRaConfig& config = LORA_CONFIGS[configIndex];
  
  // Apply new LoRa parameters
  LoRa.setSpreadingFactor(config.sf);
  LoRa.setSignalBandwidth(config.bw);
  LoRa.setCodingRate4(config.cr);
  LoRa.setTxPower(config.power);
  
  Serial.printf("Applied LoRa config: SF%d, BW%ld, CR4/%d, %ddBm (%s)\n", 
                config.sf, config.bw, config.cr, config.power, config.description);
  
  return true;
}

void publishConfigChange() {
  DynamicJsonDocument doc(256);
  doc["event"] = "config_change";
  doc["timestamp"] = millis();
  doc["deviceId"] = MQTT_CLIENT_ID;
  doc["newConfig"] = LORA_CONFIGS[currentLoRaConfig].description;
  doc["configIndex"] = currentLoRaConfig;
  
  String payload;
  serializeJson(doc, payload);
  
  mqttClient.publish(MQTT_STATUS_TOPIC, payload.c_str());
  Serial.printf("Config change published: %s\n", payload.c_str());
}

// ===== WIFI FALLBACK =====
bool tryBackupWiFi() {
  Serial.printf("Trying backup WiFi: %s\n", WIFI_SSID_BACKUP);
  
  WiFi.begin(WIFI_SSID_BACKUP, WIFI_PASSWORD_BACKUP);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("✓ Connected to backup WiFi! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  } else {
    Serial.println();
    Serial.println("✗ Backup WiFi connection failed");
    return false;
  }
}

// ===== DIAGNOSTIC FUNCTIONS =====
void sendDiagnosticMessage() {
  if (!loraInitialized) return;
  
  DynamicJsonDocument doc(256);
  doc["type"] = "diagnostic";
  doc["deviceId"] = MQTT_CLIENT_ID;
  doc["timestamp"] = millis();
  doc["uptime"] = millis() - bootTime;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiRssi"] = wifiConnected ? WiFi.RSSI() : -999;
  doc["config"] = LORA_CONFIGS[currentLoRaConfig].description;
  
  String payload;
  serializeJson(doc, payload);
  
  if (sendLoRaMessage(payload)) {
    Serial.printf("Diagnostic message sent: %s\n", payload.c_str());
  } else {
    Serial.println("Failed to send diagnostic message");
  }
}

// ===== ENHANCED ERROR RECOVERY =====
void performErrorRecovery() {
  Serial.println("=== PERFORMING ERROR RECOVERY ===");
  
  // Reset error counters
  unsigned long totalErrors = loraErrors + mqttErrors;
  
  if (totalErrors > 50) {
    Serial.println("High error count detected, performing full reset...");
    ESP.restart();
  }
  
  // Try to recover LoRa if it has errors
  if (loraErrors > 10 && loraInitialized) {
    Serial.println("Attempting LoRa recovery...");
    LoRa.end();
    delay(1000);
    if (initializeLoRa()) {
      Serial.println("✓ LoRa recovery successful");
      loraErrors = 0;
    } else {
      Serial.println("✗ LoRa recovery failed");
    }
  }
  
  // Try backup WiFi if primary fails repeatedly
  if (mqttErrors > 5 && !wifiConnected) {
    Serial.println("Attempting backup WiFi...");
    if (tryBackupWiFi()) {
      wifiConnected = true;
      mqttErrors = 0;
    }
  }
  
  Serial.println("=== ERROR RECOVERY COMPLETE ===");
}
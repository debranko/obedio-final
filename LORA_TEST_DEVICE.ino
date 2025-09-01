/*
 * LoRa Test Device for LilyGO T3-S3 MQTT Repeater
 * 
 * Ovaj kod simulira LoRa uređaj koji komunicira sa repeaterom
 * Koristi se za testiranje bridge funkcionalnosti
 * 
 * Hardware: Bilo koji ESP32 + LoRa modul (SX1276/SX1278/SX1262)
 * Frequency: 868MHz
 */

#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>

// ===== LORA CONFIGURATION =====
// Prilagodi pinove prema tvom LoRa modulu
#define LORA_SCK_PIN        5
#define LORA_MISO_PIN       19
#define LORA_MOSI_PIN       27
#define LORA_SS_PIN         18
#define LORA_RST_PIN        14
#define LORA_DIO0_PIN       26

// LoRa parametri (moraju biti isti kao na repeateru)
const long LORA_FREQUENCY = 868100000;  // 868.1 MHz
const int LORA_SF = 10;                  // Spreading Factor
const long LORA_BW = 125000;             // Bandwidth 125 kHz
const int LORA_CR = 5;                   // Coding Rate 4/5
const int LORA_TX_POWER = 20;            // TX Power 20 dBm

// ===== TEST CONFIGURATION =====
const unsigned long SEND_INTERVAL = 30000;  // Šalji test poruku svakih 30 sekundi
const char* DEVICE_ID = "lora_test_001";

// ===== GLOBAL VARIABLES =====
unsigned long lastSend = 0;
unsigned long messageCounter = 0;
bool loraInitialized = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("================================");
  Serial.println("LoRa Test Device for Repeater");
  Serial.println("================================");
  
  // Initialize LoRa
  if (initializeLoRa()) {
    Serial.println("✓ LoRa initialized successfully");
    loraInitialized = true;
  } else {
    Serial.println("✗ LoRa initialization failed");
    while(1); // Stop execution if LoRa fails
  }
  
  Serial.println("Test device ready!");
  Serial.println("Sending test messages every 30 seconds...");
  Serial.println("================================");
}

void loop() {
  if (!loraInitialized) return;
  
  // Send test message periodically
  if (millis() - lastSend > SEND_INTERVAL) {
    sendTestMessage();
    lastSend = millis();
  }
  
  // Listen for incoming messages
  handleIncomingMessages();
  
  delay(100);
}

bool initializeLoRa() {
  // Configure SPI pins
  SPI.begin(LORA_SCK_PIN, LORA_MISO_PIN, LORA_MOSI_PIN, LORA_SS_PIN);
  
  // Set LoRa pins
  LoRa.setPins(LORA_SS_PIN, LORA_RST_PIN, LORA_DIO0_PIN);
  
  // Initialize LoRa
  if (!LoRa.begin(LORA_FREQUENCY)) {
    return false;
  }
  
  // Configure LoRa parameters (moraju biti isti kao na repeateru)
  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.setTxPower(LORA_TX_POWER);
  
  // Enable CRC
  LoRa.enableCrc();
  
  Serial.printf("✓ LoRa configured: %ld Hz, SF%d, BW%ld, CR4/%d, %ddBm\n", 
                LORA_FREQUENCY, LORA_SF, LORA_BW, LORA_CR, LORA_TX_POWER);
  
  return true;
}

void sendTestMessage() {
  messageCounter++;
  
  // Create test message
  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["messageId"] = messageCounter;
  doc["timestamp"] = millis();
  doc["type"] = "test";
  doc["data"]["temperature"] = random(20, 30);
  doc["data"]["humidity"] = random(40, 80);
  doc["data"]["battery"] = random(70, 100);
  
  String payload;
  serializeJson(doc, payload);
  
  // Send via LoRa
  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();
  
  Serial.printf("Sent message #%lu: %s\n", messageCounter, payload.c_str());
}

void handleIncomingMessages() {
  // Check for incoming LoRa packets
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String receivedMessage = "";
    
    // Read packet
    while (LoRa.available()) {
      receivedMessage += (char)LoRa.read();
    }
    
    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();
    
    Serial.printf("Received (RSSI: %d, SNR: %.2f): %s\n", rssi, snr, receivedMessage.c_str());
    
    // Parse and respond to commands
    parseIncomingMessage(receivedMessage);
  }
}

void parseIncomingMessage(const String& message) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.printf("JSON parse error: %s\n", error.c_str());
    return;
  }
  
  // Check if this is a command from MQTT (via repeater)
  if (doc.containsKey("topic") && doc.containsKey("source")) {
    String source = doc["source"];
    if (source == "mqtt") {
      String topic = doc["topic"];
      String mqttMessage = doc["message"];
      
      Serial.printf("Command from MQTT [%s]: %s\n", topic.c_str(), mqttMessage.c_str());
      
      // Respond to command
      respondToCommand(mqttMessage);
    }
  }
}

void respondToCommand(const String& command) {
  // Create response message
  DynamicJsonDocument doc(256);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = millis();
  doc["type"] = "response";
  doc["originalCommand"] = command;
  
  // Simple command processing
  if (command.indexOf("status") >= 0) {
    doc["response"]["status"] = "online";
    doc["response"]["uptime"] = millis();
    doc["response"]["messagesSent"] = messageCounter;
  } else if (command.indexOf("ping") >= 0) {
    doc["response"]["pong"] = true;
  } else {
    doc["response"]["error"] = "unknown_command";
  }
  
  String payload;
  serializeJson(doc, payload);
  
  // Send response via LoRa
  delay(1000); // Small delay to avoid collision
  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();
  
  Serial.printf("Response sent: %s\n", payload.c_str());
}
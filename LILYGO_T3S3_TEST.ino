/*
 * LilyGO T3-S3 Basic Test - Samo za testiranje
 * Hardware: LilyGO T3-S3 v1.0 (ESP32-S3 + SX1262 LoRa)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <LoRa.h>

// Pinovi za LilyGO T3-S3 sa SX1262
#define LORA_SCK_PIN        5
#define LORA_MISO_PIN       3
#define LORA_MOSI_PIN       6
#define LORA_SS_PIN         7
#define LORA_RST_PIN        8
#define LORA_DIO1_PIN       33
#define LED_PIN             37

// WiFi
const char* WIFI_SSID = "Brother RX3900";
const char* WIFI_PASSWORD = "brankobbb";

// MQTT
const char* MQTT_SERVER = "mqtt.obedio.local";
const char* MQTT_CLIENT_ID = "test_repeater";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== LilyGO T3-S3 Test ===");
  
  // LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  // LoRa test
  SPI.begin(LORA_SCK_PIN, LORA_MISO_PIN, LORA_MOSI_PIN, LORA_SS_PIN);
  LoRa.setPins(LORA_SS_PIN, LORA_RST_PIN, LORA_DIO1_PIN);
  
  if (LoRa.begin(868100000)) {
    Serial.println("LoRa OK!");
    LoRa.setSpreadingFactor(12);
    LoRa.setSignalBandwidth(125000);
    LoRa.setTxPower(20);
  } else {
    Serial.println("LoRa FAIL!");
  }
  
  // WiFi test
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi connecting");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi FAIL!");
  }
  
  // MQTT test
  mqttClient.setServer(MQTT_SERVER, 1883);
  if (mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.println("MQTT OK!");
  } else {
    Serial.println("MQTT FAIL!");
  }
  
  Serial.println("=== Test completed ===");
}

void loop() {
  // Blink LED
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  delay(1000);
  
  // Test LoRa send
  LoRa.beginPacket();
  LoRa.print("Test message ");
  LoRa.print(millis());
  LoRa.endPacket();
  
  Serial.println("LoRa message sent");
  
  // Check for LoRa receive
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String message = "";
    while (LoRa.available()) {
      message += (char)LoRa.read();
    }
    Serial.print("LoRa received: ");
    Serial.println(message);
  }
  
  // MQTT keep alive
  mqttClient.loop();
}
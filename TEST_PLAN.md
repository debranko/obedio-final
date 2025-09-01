# Test Plan za LilyGO T3-S3 MQTT LoRa Repeater

## Pregled Testiranja

Ovaj dokument opisuje kako da testirate osnovnu funkcionalnost MQTT LoRa repeatera.

## Potrebna Oprema

1. **LilyGO T3-S3 v1.0** - glavni repeater
2. **Drugi LoRa uređaj** - za testiranje (može biti drugi ESP32 + LoRa modul)
3. **MQTT Broker** - mqtt.obedio.local ili lokalni test broker
4. **MQTT Client** - za slanje komandi (MQTT Explorer, mosquitto_pub, itd.)

## Test Scenariji

### 1. Osnovni Startup Test

**Cilj**: Proveriti da li se repeater pravilno inicijalizuje

**Koraci**:
1. Upload firmware na LilyGO T3-S3
2. Otvori Serial Monitor (115200 baud)
3. Pritisni RESET dugme

**Očekivani rezultat**:
```
=================================
LilyGO T3-S3 MQTT LoRa Repeater
=================================
✓ Pins initialized
✓ Watchdog initialized
✓ LoRa configured: 868100000 Hz, SF10, BW125000, CR4/5, 20dBm
✓ LoRa initialized successfully
Connecting to WiFi: Brother RX3900..........
✓ WiFi connected! IP: 192.168.1.xxx
✓ Signal strength: -xx dBm
Attempting MQTT connection to mqtt.obedio.local:1883... connected!
✓ Subscribed to: obedio/yacht-1/Hodnik/repeater_1756077845409/command
✓ MQTT connected and subscribed
Setup completed!
=================================
```

**Status**: ✅ PASS / ❌ FAIL

---

### 2. WiFi Connection Test

**Cilj**: Proveriti WiFi konekciju i reconnect funkcionalnost

**Koraci**:
1. Pokreni repeater
2. Isključi WiFi router na 30 sekundi
3. Uključi router ponovo
4. Posmatraj Serial Monitor

**Očekivani rezultat**:
- Repeater detektuje gubitak konekcije
- Automatski pokušava reconnect
- Uspešno se povezuje kada je router dostupan
- LED indikator menja status

**Status**: ✅ PASS / ❌ FAIL

---

### 3. MQTT Connection Test

**Cilj**: Proveriti MQTT konekciju i subscription

**Koraci**:
1. Pokreni repeater
2. Koristi MQTT client da se povezuješ na broker
3. Posmatraj MQTT topics

**Očekivani rezultat**:
- Repeater se povezuje na MQTT broker
- Subscribe na command topic
- Publish na status topic ("online")
- Heartbeat poruke svakih 60 sekundi

**MQTT Topics za monitoring**:
- `obedio/yacht-1/Hodnik/repeater_1756077845409/status`
- `obedio/yacht-1/Hodnik/repeater_1756077845409/telemetry`

**Status**: ✅ PASS / ❌ FAIL

---

### 4. LoRa Communication Test

**Cilj**: Proveriti LoRa radio funkcionalnost

**Koraci**:
1. Upload `LORA_TEST_DEVICE.ino` na drugi LoRa uređaj
2. Pokreni oba uređaja
3. Posmatraj Serial Monitor na oba uređaja

**Očekivani rezultat**:
- Test device šalje poruke svakih 30 sekundi
- Repeater prima LoRa poruke
- Repeater prosleđuje poruke na MQTT telemetry topic

**Serial output na repeateru**:
```
LoRa received (RSSI: -85, SNR: 8.5): {"deviceId":"lora_test_001",...}
MQTT published to telemetry: {"originalMessage":...}
```

**Status**: ✅ PASS / ❌ FAIL

---

### 5. MQTT to LoRa Bridge Test

**Cilj**: Testirati prosleđivanje MQTT komandi na LoRa

**Koraci**:
1. Pokreni repeater i test device
2. Koristi MQTT client da pošalješ komandu:
   ```
   Topic: obedio/yacht-1/Hodnik/repeater_1756077845409/command
   Message: {"command": "status"}
   ```
3. Posmatraj Serial Monitor na oba uređaja

**Očekivani rezultat**:
- Repeater prima MQTT komandu
- Prosleđuje je preko LoRa
- Test device prima komandu i odgovara
- Odgovor se prosleđuje nazad preko MQTT

**Status**: ✅ PASS / ❌ FAIL

---

### 6. LoRa to MQTT Bridge Test

**Cilj**: Testirati prosleđivanje LoRa poruka na MQTT

**Koraci**:
1. Pokreni repeater i test device
2. Test device automatski šalje poruke
3. Posmatraj MQTT telemetry topic

**Očekivani rezultat**:
- LoRa poruke se prosleđuju na MQTT
- Telemetry sadrži originalnu poruku + RSSI/SNR
- JSON format je ispravan

**Primer telemetry poruke**:
```json
{
  "originalMessage": "{\"deviceId\":\"lora_test_001\",\"messageId\":1,...}",
  "rssi": -85,
  "snr": 8.5,
  "timestamp": 12345678,
  "source": "lora"
}
```

**Status**: ✅ PASS / ❌ FAIL

---

### 7. Heartbeat and Telemetry Test

**Cilj**: Proveriti redovno slanje telemetrije

**Koraci**:
1. Pokreni repeater
2. Posmatraj MQTT telemetry topic 60+ sekundi
3. Analiziraj telemetry podatke

**Očekivani rezultat**:
- Telemetry se šalje svakih 60 sekundi
- Sadrži sve potrebne podatke (WiFi, MQTT, LoRa status)
- Statistike se ažuriraju

**Status**: ✅ PASS / ❌ FAIL

---

### 8. LED Status Indicator Test

**Cilj**: Proveriti LED status indikatore

**Koraci**:
1. Pokreni repeater u različitim stanjima
2. Posmatraj LED ponašanje

**Očekivani rezultat**:
- **Solid ON**: Sve OK (WiFi + MQTT + LoRa)
- **Slow Blink (1s)**: WiFi OK, MQTT ili LoRa problem
- **Fast Blink (200ms)**: WiFi problem

**Status**: ✅ PASS / ❌ FAIL

---

### 9. Error Recovery Test

**Cilj**: Testirati oporavak od grešaka

**Koraci**:
1. Simuliraj različite greške:
   - Isključi WiFi router
   - Isključi MQTT broker
   - Prekini LoRa komunikaciju
2. Vrati sve u normalno stanje
3. Posmatraj oporavak

**Očekivani rezultat**:
- Automatski reconnect za WiFi
- Automatski reconnect za MQTT
- Watchdog sprečava zamrzavanje
- Sistem se oporavlja bez restart-a

**Status**: ✅ PASS / ❌ FAIL

---

### 10. Performance Test

**Cilj**: Testirati performanse pod opterećenjem

**Koraci**:
1. Pošalji više MQTT komandi u kratkom vremenu
2. Generiši više LoRa poruka
3. Posmatraj memory usage i response time

**Očekivani rezultat**:
- Nema memory leak-ova
- Poruke se obrađuju bez gubitka
- Response time ostaje razuman
- Free heap ostaje stabilan

**Status**: ✅ PASS / ❌ FAIL

---

## MQTT Test Commands

### Slanje komande preko MQTT-a:
```bash
mosquitto_pub -h mqtt.obedio.local -p 1883 \
  -u "repeater_hodnik_" -P "6tMGojSEJKrNDSBo" \
  -t "obedio/yacht-1/Hodnik/repeater_1756077845409/command" \
  -m '{"command": "ping"}'
```

### Monitoring telemetrije:
```bash
mosquitto_sub -h mqtt.obedio.local -p 1883 \
  -u "repeater_hodnik_" -P "6tMGojSEJKrNDSBo" \
  -t "obedio/yacht-1/Hodnik/repeater_1756077845409/telemetry"
```

### Monitoring statusa:
```bash
mosquitto_sub -h mqtt.obedio.local -p 1883 \
  -u "repeater_hodnik_" -P "6tMGojSEJKrNDSBo" \
  -t "obedio/yacht-1/Hodnik/repeater_1756077845409/status"
```

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Startup Test | ⏳ | |
| WiFi Connection | ⏳ | |
| MQTT Connection | ⏳ | |
| LoRa Communication | ⏳ | |
| MQTT to LoRa Bridge | ⏳ | |
| LoRa to MQTT Bridge | ⏳ | |
| Heartbeat/Telemetry | ⏳ | |
| LED Status | ⏳ | |
| Error Recovery | ⏳ | |
| Performance | ⏳ | |

**Legend**: ⏳ Pending, ✅ Pass, ❌ Fail

## Troubleshooting

### Česti problemi i rešenja:

1. **LoRa ne radi**:
   - Proverite antenu
   - Proverite pin konfiguraciju
   - Proverite frekvenciju

2. **WiFi se ne povezuje**:
   - Proverite SSID/password
   - Proverite signal strength
   - Restartujte router

3. **MQTT ne radi**:
   - Proverite broker dostupnost
   - Proverite credentials
   - Proverite network connectivity

4. **Poruke se gube**:
   - Proverite LoRa parametre
   - Smanjite send rate
   - Proverite interference

## Zaključak

Ovaj test plan pokriva sve osnovne funkcionalnosti MQTT LoRa repeatera. Uspešno prolaženje svih testova potvrđuje da je firmware spreman za produkciju.
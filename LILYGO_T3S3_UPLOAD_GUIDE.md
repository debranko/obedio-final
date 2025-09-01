# LilyGO T3 S3 Upload Troubleshooting Guide

## ✅ Compilation Success
- **Sketch Size**: 916,859 bytes (69% of 1,310,720 bytes) - Good size
- **RAM Usage**: 44,728 bytes (13% of 327,680 bytes) - Excellent memory usage
- **Status**: Firmware compiled successfully with no errors

## ❌ Upload Issue: Port Not Found

The error `/dev/cu.usbmodem101` port not found is a common hardware connection issue.

### Step-by-Step Solution:

#### 1. **Check Physical Connection**
- Ensure USB-C cable is firmly connected to LilyGO T3 S3
- Try a different USB-C cable (some cables are power-only)
- Use a different USB port on your computer
- Check for loose connections

#### 2. **Put Device in Download Mode**
For LilyGO T3 S3, you need to manually enter download mode:

1. **Hold BOOT button** (usually labeled "BOOT" or "IO0")
2. **Press and release RESET button** while holding BOOT
3. **Release BOOT button** after 1-2 seconds
4. **Immediately try uploading** in Arduino IDE

#### 3. **Find Correct Port**
In Arduino IDE:
- Go to **Tools → Port**
- Look for available ports (might be different than `/dev/cu.usbmodem101`)
- Common port names on macOS:
  - `/dev/cu.usbserial-*`
  - `/dev/cu.SLAB_USBtoUART`
  - `/dev/cu.wchusbserial*`

#### 4. **Install/Update Drivers**
If no port appears, install CP210x or CH340 drivers:

**For CP210x (Silicon Labs):**
```bash
# Download from: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
```

**For CH340 (WCH):**
```bash
# Download from: https://github.com/WCHSoftGroup/ch34xser_macos
```

#### 5. **Arduino IDE Settings**
Verify these settings in Arduino IDE:
- **Board**: "ESP32S3 Dev Module" or "LilyGO T3-S3"
- **Upload Speed**: 921600 (try 115200 if issues persist)
- **CPU Frequency**: 240MHz
- **Flash Mode**: QIO
- **Flash Size**: 16MB
- **Partition Scheme**: "Default 4MB with spiffs"
- **PSRAM**: "Enabled"

#### 6. **Alternative Upload Methods**

**Method A: Using esptool directly**
```bash
# First, put device in download mode, then:
esptool.py --chip esp32s3 --port /dev/cu.usbserial-* write_flash 0x0 firmware.bin
```

**Method B: Using PlatformIO**
```bash
# If you have PlatformIO installed:
pio run --target upload
```

#### 7. **Reset and Retry Sequence**
1. Disconnect USB cable
2. Wait 5 seconds
3. Reconnect USB cable
4. Put device in download mode (BOOT + RESET)
5. Select correct port in Arduino IDE
6. Click Upload immediately

### Common Port Names by Operating System:

**macOS:**
- `/dev/cu.usbserial-*`
- `/dev/cu.SLAB_USBtoUART`
- `/dev/cu.wchusbserial*`
- `/dev/cu.usbmodem*`

**Windows:**
- `COM3`, `COM4`, `COM5`, etc.

**Linux:**
- `/dev/ttyUSB0`
- `/dev/ttyACM0`

### Verification After Upload:
Once uploaded successfully, open Serial Monitor (115200 baud) to see:
```
=================================
LilyGO T3-S3 MQTT LoRa Repeater
=================================
✓ Pins initialized
✓ Watchdog initialized
Initializing LoRa SX1262...
✓ LoRa test transmission successful
✓ LoRa SX1262 configured: 868100000 Hz, SF12, BW125000, CR4/5, 22dBm
```

### If Still Having Issues:
1. Try a different computer
2. Check if device is recognized in System Information (macOS) or Device Manager (Windows)
3. Test with a simple "Blink" sketch first
4. Contact LilyGO support for hardware-specific issues

## 🎯 Next Steps After Successful Upload:
1. Monitor serial output for initialization messages
2. Check WiFi connection to your network
3. Verify MQTT broker connectivity
4. Test LoRa transmission with another device
5. Use button to cycle through LoRa configurations
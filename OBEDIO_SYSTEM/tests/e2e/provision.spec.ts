import { test, expect } from '@playwright/test'
import * as mqtt from 'mqtt'

// Konstante za podešavanja MQTT-a
const MQTT_HOST = process.env.MQTT_HOST || 'mqtt://localhost:1883'
const PROVISION_TOPIC = 'obedio/provision/request'

/**
 * Test funkcija za simulaciju MQTT klijenta koji će odgovoriti na provisioning zahtev
 */
async function setupMqttMockClient() {
  // Kreiranje MQTT mock klijenta
  const mockMqttClient = mqtt.connect(MQTT_HOST, {
    clientId: `test-mock-${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  })
  
  // Čekanje da se klijent poveže
  return new Promise<mqtt.MqttClient>((resolve, reject) => {
    mockMqttClient.on('connect', () => {
      console.log('Mock MQTT client connected for test')
      
      // Pretplata na MQTT temu
      mockMqttClient.subscribe(PROVISION_TOPIC, (err) => {
        if (err) {
          reject(err)
        } else {
          console.log(`Mock client subscribed to ${PROVISION_TOPIC}`)
          resolve(mockMqttClient)
        }
      })
    })
    
    mockMqttClient.on('error', (err) => {
      reject(err)
    })
  })
}

test.describe('Device Provisioning Flow', () => {
  test('should create a provision token and successfully provision a device', async ({ page }) => {
    // 1. Kreiraj MQTT mock klijent koji će simulirati uređaj
    const mockMqttClient = await setupMqttMockClient()
    
    // 2. Prijavi se kao admin
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Prijavi se' }).click()
    
    // 3. Idi na stranicu uređaja
    await page.goto('/devices')
    await page.waitForLoadState('networkidle')
    
    // 4. Klikni na dugme za dodavanje uređaja
    await page.getByRole('button', { name: 'Dodaj uređaj' }).click()
    
    // 5. Popuni formu za dodavanje uređaja
    await page.waitForSelector('text=Dodaj novi uređaj')
    await page.getByText('Izaberite sobu').click()
    await page.getByText('Dnevni boravak').click()
    await page.getByRole('button', { name: 'Generiši QR kod' }).click()
    
    // 6. Sačekaj da se prikaže QR kod
    await page.waitForSelector('text=Skenirajte QR kod')
    
    // Pomoćna funkcija koja će obraditi MQTT poruku i simulirati uređaj
    const mqttHandlerPromise = new Promise<void>((resolve) => {
      let token: string | null = null
      
      mockMqttClient.on('message', async (topic, message) => {
        if (topic === PROVISION_TOPIC) {
          console.log('Received message on provisioning topic')
          const payload = JSON.parse(message.toString())
          token = payload.token
          
          // Simuliraj odgovor od strane uređaja
          const responsePayload = {
            token,
            deviceType: 'BUTTON',
            battery: 100,
            signal: 95,
            ipAddress: '192.168.1.100',
            replyTopic: 'obedio/device/response'
          }
          
          // Pošalji odgovor na MQTT server
          mockMqttClient.publish(PROVISION_TOPIC, JSON.stringify(responsePayload))
          
          // Sačekaj malo da se zahtev obradi
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          resolve()
        }
      })
    })
    
    // Extract token iz QR koda
    const qrCodeValue = await page.evaluate(() => {
      const svgElement = document.querySelector('svg')
      // Vraća QR kod vrednost ako je to moguće
      if (svgElement) {
        const parentElement = svgElement.closest('[value]')
        return parentElement?.getAttribute('value') || null
      }
      return null
    })
    
    expect(qrCodeValue).not.toBeNull()
    console.log('QR Code Value:', qrCodeValue)
    
    // 7. Simuliraj MQTT zahtev za provisioniranje
    if (qrCodeValue) {
      const qrData = JSON.parse(qrCodeValue)
      
      // Pošalji MQTT poruku koja simulira uređaj
      mockMqttClient.publish(PROVISION_TOPIC, JSON.stringify({
        token: qrData.token,
        deviceType: 'BUTTON',
        battery: 100,
        signal: 95,
        ipAddress: '192.168.1.100',
        replyTopic: 'obedio/device/response'
      }))
    }
    
    // 8. Čekaj da se MQTT zahtev obradi
    await mqttHandlerPromise
    
    // 9. Sačekaj da se novi uređaj pojavi u listi
    await page.waitForTimeout(2000) // Daj SSE-u vremena da ažurira UI
    
    // 10. Idi na stranicu uređaja da proverimo da li je uređaj dodat
    await page.goto('/devices')
    await page.waitForLoadState('networkidle')
    
    // 11. Proveri da li je uređaj dodat
    const deviceName = 'living_room BUTTON' // Očekivani naziv uređaja
    const deviceExists = await page.getByText(deviceName).isVisible()
    
    expect(deviceExists).toBeTruthy()
    
    // Zatvaranje MQTT klijenta
    mockMqttClient.end()
  })
})

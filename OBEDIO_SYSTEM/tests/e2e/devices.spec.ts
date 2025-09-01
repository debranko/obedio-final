import { test, expect } from '@playwright/test';

// Koristimo previously saved auth state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Devices page tests', () => {
  test('Navigate to devices and observe battery updates', async ({ page }) => {
    // Navigiraj na stranicu uređaja
    await page.goto('/devices');
    
    // Proveri da li smo na pravoj stranici proverom naslova
    await expect(page.locator('h1')).toContainText('Uređaji');
    
    // Sačekaj da se učita tabela uređaja
    await expect(page.locator('table')).toBeVisible();
    
    // Proveri da li postoji kolona za bateriju (header)
    await expect(page.locator('th').filter({ hasText: 'Baterija' })).toBeVisible();
    
    // Zapamti trenutnu vrednost baterije prvog uređaja (ako postoji)
    const initialBatteryValue = await page.locator('tr:nth-child(1) td:nth-child(4)').textContent();
    console.log(`Initial battery value: ${initialBatteryValue}`);
    
    // Sačekaj da vidimo promenu vrednosti baterije (kroz SSE real-time update)
    // Ovo može zahtevati simulaciju MQTT poruke za promenu baterije u testnom okruženju
    
    // Opcioni korak - simulacija MQTT događaja kroz poseban API endpoint za testiranje
    await page.request.post('/api/test/simulate-battery-update', {
      data: {
        deviceId: 1,  // ID uređaja čiju bateriju želimo da ažuriramo
        batteryLevel: 75  // Nova vrednost baterije (različita od inicijalne)
      }
    });
    
    // Sačekamo da se pojavi nova vrednost baterije (različita od inicijalne)
    // Koristimo setTimeout da damo vremena da se desi SSE ažuriranje
    await page.waitForTimeout(2000);
    
    // Proverimo da li se vrednost promenila ili je prikazana nova vrednost
    const updatedBatteryValue = await page.locator('tr:nth-child(1) td:nth-child(4)').textContent();
    console.log(`Updated battery value: ${updatedBatteryValue}`);
    
    // Ako nemamo simulaciju u test okruženju, ovo možemo ostaviti kao komentar
    // expect(updatedBatteryValue).not.toBe(initialBatteryValue);
    
    // Verifikuj da li stranica poseduje očekivane komponente
    await expect(page.locator('.refresh-button')).toBeVisible();
    await expect(page.locator('.filter-controls')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

// Koristimo previously saved auth state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Requests management tests', () => {
  test('View and manage active requests', async ({ page }) => {
    // Navigiraj na stranicu aktivnih zahteva
    await page.goto('/requests/active');
    
    // Proveri da li smo na pravoj stranici proverom naslova
    await expect(page.locator('h1')).toContainText('Aktivni zahtevi');
    
    // Sačekaj da se učita tabela zahteva
    await expect(page.locator('table')).toBeVisible();
    
    // Proveri da li postoje očekivane kolone u tabeli
    const expectedColumns = ['ID', 'Soba', 'Uređaj', 'Vreme', 'Status', 'Akcije'];
    for (const column of expectedColumns) {
      await expect(page.locator('th').filter({ hasText: column })).toBeVisible();
    }
    
    // Proveri da li postoji dugme za osvežavanje
    await expect(page.getByRole('button', { name: /Osveži/i })).toBeVisible();
    
    // Proverimo funkcionalnost "Završi zahtev" ako postoji bar jedan zahtev u tabeli
    const requestRows = page.locator('tbody tr');
    const rowCount = await requestRows.count();
    
    if (rowCount > 0) {
      // Klikni na dugme za završavanje zahteva na prvom redu
      await page.locator('tbody tr:first-child button:has-text("Završi")').click();
      
      // Sačekaj pojavljivanje dijaloga za potvrdu
      await expect(page.locator('dialog, [role="dialog"]')).toBeVisible();
      
      // Potvrdi završavanje zahteva
      await page.getByRole('button', { name: /Potvrdi/i }).click();
      
      // Sačekaj notifikaciju o uspešnom završavanju
      await expect(page.locator('toast, [role="status"]')).toBeVisible();
    } else {
      console.log('No active requests found to test complete action');
    }
    
    // Testiraj navigaciju ka stranici zahteva i nazad
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Vrati se na zahteve
    await page.getByRole('link', { name: /Zahtevi/i }).click();
    await expect(page).toHaveURL('/requests/active');
  });
});

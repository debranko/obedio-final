// authentication.setup.ts
import { test as setup, expect } from '@playwright/test';

// Kreiranje state-a za already authenticated korisnika
setup('authenticate', async ({ page }) => {
  // Navigacija na login stranicu
  await page.goto('/login');
  
  // Čekaj da se forma učita
  await expect(page.locator('form')).toBeVisible();
  
  // Unos kredencijala administratora
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Klikni na login dugme
  await page.click('button[type="submit"]');
  
  // Čekaj redirekciju na dashboard stranicu
  await expect(page).toHaveURL('/dashboard');
  
  // Sačuvaj storage state (cookies/localStorage) za kasnije testove
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracija Playwright za Obedio Admin Web App e2e testove
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Maksimalno vreme izvršavanja testa */
  timeout: 30 * 1000,
  /* Očekivanje prvog izvršavanja browser-a */
  expect: {
    /**
     * Maksimalno vreme čekanja assertion-a
     * @see https://playwright.dev/docs/test-assertions
     */
    timeout: 5000
  },
  /* Ne pokreći testove paralelno u CI okruženju */
  fullyParallel: !process.env.CI,
  /* Zadrži rezultate prethodnih pokretanja */
  preserveOutput: 'always',
  /* Reporter za prikazivanje rezultata testa */
  reporter: process.env.CI ? 'dot' : 'html',
  
  /* Konfiguracija za svako pokretanje testa */
  use: {
    /* Koristimo baseURL za apsolutnu URL navigaciju */
    baseURL: 'http://localhost:3000',
    
    /* Veličina viewporta po defaultu */
    viewport: { width: 1280, height: 720 },
    
    /* Snimaj video za svaki failed test */
    video: 'on-first-retry',
    
    /* Snimaj trace za svaki failed test */
    trace: 'on-first-retry',
  },

  /* Konfiguracija projekata za različite browsere */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test u mobilnom viewportu */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Konfigurisanje dev servera za testiranje */
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});

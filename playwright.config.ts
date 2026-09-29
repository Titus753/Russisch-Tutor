import { defineConfig, devices } from '@playwright/test';

// E2E-Tests laufen gegen den Produktions-Build mit denselben Sicherheits-Headern wie auf Netlify.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iPhone SE', use: { ...devices['iPhone SE'] } },
    { name: 'iPhone 15', use: { ...devices['iPhone 15'] } },
    // Volles Chromium statt Headless-Shell: ein Browser-Download weniger
    { name: 'Pixel 7', use: { ...devices['Pixel 7'], channel: 'chromium' } },
  ],
  webServer: {
    // Immer frisch bauen, eigener Port: nie versehentlich gegen einen veralteten Server testen
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

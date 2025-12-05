import { test, expect } from '@playwright/test';

// 1. Increase timeout to 60s for slower local builds/hydration
test.slow(); 

test('Landing page loads and navigation works', async ({ page }) => {
  await page.goto('/');

  // 2. CRITICAL FIX: Wait for the "Loading Wallet Connectors..." text to disappear
  // This ensures Wagmi/RainbowKit has initialized and the real UI is visible
  await expect(page.getByText('Loading Wallet Connectors...')).not.toBeVisible({ timeout: 20000 });

  // 3. Check Title
  await expect(page).toHaveTitle(/IStory/i);
  
  // 4. Verify Hero Text
  // We use a relaxed regex matcher to find the heading even if it's split across lines
  await expect(page.getByRole('heading', { name: /Your Life/i })).toBeVisible();

  // 5. Check "Explore Stories" button navigation
  const exploreBtn = page.getByRole('button', { name: /Explore Stories/i });
  await expect(exploreBtn).toBeVisible();
  
  // 6. Click and wait for navigation
  await exploreBtn.click();
  
  // FIX: Increase timeout to 30s because Next.js compiles the new page on-demand
  await expect(page).toHaveURL(/.*social/, { timeout: 30000 });
  
  // 7. Verify Social Page Load
  // Wait for the specific heading on the destination page
  await expect(page.getByRole('heading', { name: /Community Stories/i })).toBeVisible({ timeout: 30000 });
});

test('Record page protects route when disconnected', async ({ page }) => {
  await page.goto('/record');
  
  // Wait for hydration loader to finish
  await expect(page.getByText('Loading Wallet Connectors...')).not.toBeVisible({ timeout: 20000 });
  
  // Since we are not connecting a wallet in Playwright, it should show the Auth Guard
  await expect(page.getByText('Connect Your Wallet', { exact: false })).toBeVisible();
});
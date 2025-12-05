import { test, expect } from '@playwright/test';

// 1. Increase global timeout for this file to handle slow local compilation
test.slow(); 

test('Landing page loads and navigation works', async ({ page }) => {
  await page.goto('/');

  // 2. Wait for hydration
  await expect(page.getByText('Loading Wallet Connectors...')).not.toBeVisible({ timeout: 30000 });

  // 3. Check Title
  await expect(page).toHaveTitle(/IStory/i);
  
  // 4. Verify Hero Text
  await expect(page.getByRole('heading', { name: /Your Life/i })).toBeVisible({ timeout: 10000 });

  // 5. Check "Explore Stories" button
  const exploreBtn = page.getByRole('button', { name: /Explore Stories/i });
  await expect(exploreBtn).toBeVisible();
  
  // 6. Click and wait for navigation
  await exploreBtn.click();
  
  // 7. Verify Social Page Load (Increased timeout for page compilation)
  await expect(page).toHaveURL(/.*social/, { timeout: 60000 });
  await expect(page.getByRole('heading', { name: /Community Stories/i })).toBeVisible({ timeout: 30000 });
});

test('Record page protects route when disconnected', async ({ page }) => {
  await page.goto('/record');
  
  // 1. Wait for hydration loader to finish
  await expect(page.getByText('Loading Wallet Connectors...')).not.toBeVisible({ timeout: 30000 });
  
  // 2. FIX: Use getByRole and increase timeout to 15s
  // This waits specifically for the H1 heading "Connect Your Wallet"
  await expect(page.getByRole('heading', { name: /Connect Your Wallet/i })).toBeVisible({ timeout: 15000 });
});
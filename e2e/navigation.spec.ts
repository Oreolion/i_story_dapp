import { test, expect } from '@playwright/test';

test('Landing page loads and navigation works', async ({ page }) => {
  // 1. Go to Home
  await page.goto('http://localhost:3000');

  // 2. Check Title
  await expect(page).toHaveTitle(/IStory/);
  
  // 3. Verify Hero Text
  await expect(page.getByText('Your Life,')).toBeVisible();
  await expect(page.getByText('Etched Forever.')).toBeVisible();

  // 4. Check "Explore Stories" button navigation
  const exploreBtn = page.getByRole('button', { name: 'Explore Stories' });
  await exploreBtn.click();

  // 5. Should navigate to /social
  await expect(page).toHaveURL(/.*social/);
  
  // 6. Check Social Page content (Empty state)
  await expect(page.getByText('Community Stories')).toBeVisible();
});

test('Record page protects route when disconnected', async ({ page }) => {
  await page.goto('http://localhost:3000/record');
  
  // Since we are not connecting a wallet in Playwright, it should show the "Please Connect" state
  await expect(page.getByText('Connect Your Wallet')).toBeVisible();
});

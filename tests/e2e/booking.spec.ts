import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test('complete ticket booking flow', async ({ page }) => {
  // Authentication
  await page.goto('/');
  if (!process.env.GITHUB_TEST_TOKEN) {
    throw new Error('GITHUB_TEST_TOKEN is not defined');
  }
  await page.evaluate((token) => {
    window.localStorage.setItem('github_token', token);
  }, process.env.GITHUB_TEST_TOKEN);

  // Navigate to movies and wait for page load
  await page.goto('/movies');
  await page.waitForLoadState('networkidle');
  
  // Verify and click movie
  const movieCard = page.locator('.movie-card', { hasText: 'Rocky IV' });
  await expect(movieCard).toBeVisible();
  await movieCard.click();

  // Verify and select showtime
  const showtime = page.locator('.showtime-card', { hasText: 'Mi., 12. Feb. 2025, 12:43 Uhr' });
  await expect(showtime).toBeVisible();
  await showtime.click();
  
  // Verify and select seat
  // Wait for seat plan to be visible
  await page.waitForSelector('.seat-plan');
  const seat = page.locator('.seat-button', { hasText: 'C1' });
  await expect(seat).toBeVisible();
  await seat.click();
  
  // Continue with booking
  const continueButton = page.locator('button', { hasText: 'Continue' });
  await expect(continueButton).toBeVisible();
  await continueButton.click();
});
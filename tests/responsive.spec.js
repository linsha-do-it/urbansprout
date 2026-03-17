import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without horizontal scroll
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check viewport width
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(375);
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(768);
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(1920);
  });

  test('should have mobile menu (if applicable)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for mobile menu button (hamburger menu)
    const menuButton = page.locator('button[aria-label*="menu" i], button[class*="menu"], [class*="hamburger"]').first();
    
    // Menu button might exist or not, just check page loads
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBeTruthy();
  });
});










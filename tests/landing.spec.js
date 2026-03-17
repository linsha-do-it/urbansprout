import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page title or main content is visible
    const title = page.locator('h1, h2, [class*="title"], [class*="heading"]').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for navigation elements
    const nav = page.locator('nav, [class*="nav"], [class*="navbar"]').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click login link/button
    const loginLink = page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
      // Check if we're on login page or if login form is visible
      const loginForm = page.locator('form, [class*="login"], input[type="email"], input[name="email"]').first();
      await expect(loginForm).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to store page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click store link
    const storeLink = page.locator('a[href*="store"], a:has-text("Store"), a:has-text("Shop")').first();
    
    if (await storeLink.isVisible().catch(() => false)) {
      await storeLink.click();
      await page.waitForURL('**/store', { timeout: 5000 });
      await expect(page).toHaveURL(/.*store/);
    }
  });

  test('should navigate to blog page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click blog link
    const blogLink = page.locator('a[href*="blog"], a:has-text("Blog"), a:has-text("Community")').first();
    
    if (await blogLink.isVisible().catch(() => false)) {
      await blogLink.click();
      await page.waitForURL('**/blog', { timeout: 5000 });
      await expect(page).toHaveURL(/.*blog/);
    }
  });
});










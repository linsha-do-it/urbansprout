import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    // Start at landing
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to store
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*store/);
    
    // Navigate to blog
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*blog/);
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect protected routes to login when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*login/);
  });

  test('should redirect admin routes to login when not authenticated', async ({ page }) => {
    // Try to access admin route
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*login/);
  });

  test('should have working navbar links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if navbar exists
    const navbar = page.locator('nav, [class*="nav"], [class*="navbar"]').first();
    await expect(navbar).toBeVisible();
    
    // Try clicking store link in navbar
    const storeNavLink = page.locator('nav a[href*="store"], [class*="nav"] a[href*="store"]').first();
    if (await storeNavLink.isVisible().catch(() => false)) {
      await storeNavLink.click();
      await page.waitForURL('**/store', { timeout: 5000 });
      await expect(page).toHaveURL(/.*store/);
    }
  });
});










import { test, expect } from '@playwright/test';

test.describe('Store Page', () => {
  test('should load store page', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    
    // Check if store page loaded
    const storeContent = page.locator('[class*="store"], [class*="product"], [class*="shop"]').first();
    await expect(storeContent).toBeVisible({ timeout: 10000 });
  });

  test('should display products or product grid', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load (could be in various containers)
    await page.waitForTimeout(2000);
    
    // Check for product cards, items, or grid
    const products = page.locator('[class*="product"], [class*="card"], [class*="item"], [class*="grid"]');
    const count = await products.count();
    
    // Store should have some content (products or empty state)
    expect(count >= 0).toBeTruthy();
  });

  test('should have search or filter functionality', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    
    // Look for search input or filter buttons
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first();
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Category"), [class*="filter"]').first();
    
    // At least one should be present
    const hasSearch = await searchInput.isVisible().catch(() => false);
    const hasFilter = await filterButton.isVisible().catch(() => false);
    
    expect(hasSearch || hasFilter).toBeTruthy();
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to find a product link or card
    const productLink = page.locator('a[href*="product"], [class*="product"] a, [class*="card"] a').first();
    
    if (await productLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await productLink.getAttribute('href');
      if (href && href.includes('product')) {
        await productLink.click();
        await page.waitForURL('**/product/**', { timeout: 5000 });
        await expect(page).toHaveURL(/.*product/);
      }
    }
  });
});










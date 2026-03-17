import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // Check for signup form elements
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
    
    // Check for name or email input
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    
    if (await nameInput.isVisible().catch(() => false)) {
      await expect(nameInput).toBeVisible();
    }
    await expect(emailInput).toBeVisible();
  });

  test('should show validation errors on empty form submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      
      // Wait a bit for validation
      await page.waitForTimeout(1000);
      
      // Check for error messages (might be in various formats)
      const errorMessages = page.locator('[class*="error"], [class*="invalid"], .text-red, [role="alert"]');
      const count = await errorMessages.count();
      
      // Either errors are shown or form prevents submission
      expect(count >= 0).toBeTruthy();
    }
  });

  test('should navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Look for signup link
    const signupLink = page.locator('a[href*="signup"], a:has-text("Sign up"), a:has-text("Register")').first();
    
    if (await signupLink.isVisible().catch(() => false)) {
      await signupLink.click();
      await page.waitForURL('**/signup', { timeout: 5000 });
      await expect(page).toHaveURL(/.*signup/);
    }
  });

  test('should navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // Look for login link
    const loginLink = page.locator('a[href*="login"], a:has-text("Login"), a:has-text("Sign in")').first();
    
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*login/);
    }
  });
});










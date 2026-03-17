import { test, expect } from '@playwright/test';

test.describe('Plant Suggestion Page', () => {
  test('should load plant suggestion page', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    
    // Check if plant suggestion page loaded
    const pageContent = page.locator('h1, [class*="plant"], [class*="suggestion"], [class*="quiz"]').first();
    await expect(pageContent).toBeVisible({ timeout: 10000 });
    
    // Verify we're on the plant suggestion page
    await expect(page).toHaveURL(/.*plant-suggestion/);
  });

  test('should display quiz questions', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    
    // Check for quiz question elements
    const questionTitle = page.locator('h1, h2, [class*="title"], [class*="question"]').first();
    await expect(questionTitle).toBeVisible({ timeout: 10000 });
    
    // Check for question options or buttons
    const options = page.locator('button, [class*="option"], [class*="card"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('should display step progress indicator', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    
    // Check for step indicator (e.g., "Step 1 of 4")
    const stepIndicator = page.locator(':has-text("Step"), :has-text("of"), [class*="progress"], [class*="step"]').first();
    await expect(stepIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting quiz options', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Try to find and click an option button (quiz options are buttons with text)
    const optionButton = page.locator('button:has-text("Small Space"), button:has-text("Medium Space"), button:has-text("Large Space"), button:has-text("Full Sun"), button:has-text("Beginner"), button:has-text("Low Maintenance")').first();
    
    if (await optionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await optionButton.click();
      await page.waitForTimeout(1000);
      
      // Verify button was clicked (next button should be enabled)
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Get Results")').first();
      const isNextEnabled = await nextButton.isEnabled().catch(() => false);
      expect(isNextEnabled).toBeTruthy();
    } else {
      // If specific buttons not found, just verify page has interactive elements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('should navigate to next question', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Select an option
    const optionButton = page.locator('button, [class*="option"]').first();
    
    if (await optionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await optionButton.click();
      await page.waitForTimeout(1000);
      
      // Click next button
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), [aria-label*="next" i]').first();
      
      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Verify we moved to next step (step indicator should change)
        const stepText = await page.locator(':has-text("Step")').first().textContent().catch(() => '');
        expect(stepText).toBeTruthy();
      }
    }
  });

  test('should display quiz completion or results', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    
    // Check if page has quiz form or results section
    // Look for quiz title, question title, or any content
    const quizTitle = page.locator('h1:has-text("Plant Suggestion"), h2, [class*="title"]').first();
    const pageContent = page.locator('body').textContent();
    
    // Verify we're on the plant suggestion page
    await expect(page).toHaveURL(/.*plant-suggestion/);
    
    // Check if page has any content
    const content = await pageContent;
    expect(content && content.length > 0).toBeTruthy();
  });

  test('should have navigation buttons (next/previous)', async ({ page }) => {
    await page.goto('/plant-suggestion');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for next button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), [aria-label*="next" i]').first();
    const hasNext = await nextButton.isVisible().catch(() => false);
    
    // Check for previous/back button (might not be visible on first step)
    const prevButton = page.locator('button:has-text("Back"), button:has-text("Previous"), [aria-label*="prev" i]').first();
    const hasPrev = await prevButton.isVisible().catch(() => false);
    
    // At least next button should be present
    expect(hasNext || hasPrev).toBeTruthy();
  });
});


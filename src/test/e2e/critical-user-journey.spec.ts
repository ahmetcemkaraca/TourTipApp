import { test, expect } from '@playwright/test';

test.describe('Critical User Journey - Tour Booking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Complete tour booking journey', async ({ page }) => {
    // 1. Landing page should load
    await expect(page).toHaveTitle(/TourTrip/);
    await expect(page.locator('h1')).toContainText(/Türkiye'nin/);

    // 2. Search for tours
    await page.click('[data-testid="search-button"]');
    await page.fill('[data-testid="search-input"]', 'İstanbul');
    await page.click('[data-testid="search-submit"]');

    // 3. Tour results should appear
    await expect(page.locator('[data-testid="tour-card"]')).toBeVisible();
    
    // 4. Click on first tour
    await page.click('[data-testid="tour-card"]:first-child');

    // 5. Tour detail page should load
    await expect(page.locator('[data-testid="tour-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tour-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-now-button"]')).toBeVisible();

    // 6. Click book now
    await page.click('[data-testid="book-now-button"]');

    // 7. Should redirect to auth if not logged in
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // 8. Register new user
    await page.click('[data-testid="register-tab"]');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="phone-input"]', '+905551234567');
    await page.click('[data-testid="register-button"]');

    // 9. Should redirect to booking form
    await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();

    // 10. Fill booking form
    await page.selectOption('[data-testid="booking-date"]', '2024-09-15');
    await page.fill('[data-testid="participant-count"]', '2');
    
    // Add participant details
    await page.fill('[data-testid="participant-1-name"]', 'Test User');
    await page.fill('[data-testid="participant-1-email"]', 'test@example.com');
    await page.fill('[data-testid="participant-2-name"]', 'Jane Doe');
    await page.fill('[data-testid="participant-2-email"]', 'jane@example.com');

    // 11. Continue to payment
    await page.click('[data-testid="continue-to-payment"]');

    // 12. Payment form should load
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('300');

    // 13. Fill payment details (test card)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.fill('[data-testid="cardholder-name"]', 'Test User');

    // 14. Submit payment
    await page.click('[data-testid="pay-now-button"]');

    // 15. Wait for payment processing
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

    // 16. Booking confirmation should appear
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-email"]')).toContainText('test@example.com');

    // 17. Navigate to user dashboard
    await page.click('[data-testid="view-my-bookings"]');

    // 18. Booking should appear in dashboard
    await expect(page.locator('[data-testid="booking-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-item"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('Confirmed');
  });

  test('User login journey', async ({ page }) => {
    // 1. Click login button
    await page.click('[data-testid="login-button"]');

    // 2. Login form should appear
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // 3. Fill login credentials
    await page.fill('[data-testid="email-input"]', 'test@tourtrip.app');
    await page.fill('[data-testid="password-input"]', 'password123');

    // 4. Submit login
    await page.click('[data-testid="login-submit"]');

    // 5. Should redirect to dashboard
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Hoş geldiniz');

    // 6. User menu should show user info
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-email"]')).toContainText('test@tourtrip.app');
  });

  test('Tour search and filtering', async ({ page }) => {
    // 1. Open search
    await page.click('[data-testid="search-button"]');

    // 2. Search for location
    await page.fill('[data-testid="search-input"]', 'Kapadokya');
    await page.click('[data-testid="search-submit"]');

    // 3. Results should appear
    await expect(page.locator('[data-testid="tour-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-count"]')).toContainText(/\d+ tur bulundu/);

    // 4. Apply price filter
    await page.selectOption('[data-testid="price-filter"]', '100-500');
    await page.waitForSelector('[data-testid="tour-card"]');

    // 5. Apply category filter
    await page.check('[data-testid="category-adventure"]');
    await page.waitForSelector('[data-testid="tour-card"]');

    // 6. Sort by price
    await page.selectOption('[data-testid="sort-by"]', 'price-asc');
    await page.waitForSelector('[data-testid="tour-card"]');

    // 7. Verify first result has lowest price
    const firstPrice = await page.locator('[data-testid="tour-card"]:first-child [data-testid="tour-price"]').textContent();
    const secondPrice = await page.locator('[data-testid="tour-card"]:nth-child(2) [data-testid="tour-price"]').textContent();
    
    expect(parseInt(firstPrice?.replace(/\D/g, '') || '0')).toBeLessThanOrEqual(
      parseInt(secondPrice?.replace(/\D/g, '') || '999999')
    );
  });

  test('Mobile responsive design', async ({ page }) => {
    // 1. Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. Landing page should be mobile-friendly
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // 3. Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // 4. Navigate to tours
    await page.click('[data-testid="mobile-menu-tours"]');
    await expect(page.locator('[data-testid="tour-grid"]')).toBeVisible();

    // 5. Tour cards should stack vertically
    const tourCards = page.locator('[data-testid="tour-card"]');
    const count = await tourCards.count();
    if (count > 1) {
      const firstCard = tourCards.nth(0);
      const secondCard = tourCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      expect(secondBox?.y).toBeGreaterThan(firstBox?.y! + firstBox?.height! - 10);
    }
  });

  test('PWA installation prompt', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('/');

    // 2. Wait for PWA install prompt
    await page.waitForSelector('[data-testid="pwa-install-prompt"]', { timeout: 10000 });

    // 3. Click install
    await page.click('[data-testid="pwa-install-button"]');

    // 4. Prompt should be hidden
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeHidden();
  });

  test('Offline functionality', async ({ page }) => {
    // 1. Navigate to app and wait for load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. Go offline
    await page.context().setOffline(true);

    // 3. Navigate to tours page
    await page.click('[data-testid="tours-link"]');

    // 4. Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // 5. Should show cached content
    await expect(page.locator('[data-testid="tour-card"]')).toBeVisible();

    // 6. Try to book (should queue)
    await page.click('[data-testid="tour-card"]:first-child');
    await page.click('[data-testid="book-now-button"]');

    // 7. Should show offline message
    await expect(page.locator('[data-testid="offline-booking-message"]')).toBeVisible();

    // 8. Go back online
    await page.context().setOffline(false);

    // 9. Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeHidden();
  });
});

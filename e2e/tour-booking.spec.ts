import { test, expect } from '@playwright/test'

test.describe('Tour Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display homepage correctly', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('h1')).toBeVisible()

    // Check for navigation
    await expect(page.locator('nav')).toBeVisible()

    // Check for featured tours section
    await expect(page.locator('[data-testid="featured-tours"]')).toBeVisible()
  })

  test('should navigate to tours page', async ({ page }) => {
    // Click on tours link in navigation
    await page.locator('nav').getByRole('link', { name: /turlar/i }).click()

    // Wait for navigation
    await page.waitForURL('**/tours')

    // Check if tours page loaded
    await expect(page.locator('h1')).toContainText(/turlar/i)

    // Check for tour filters
    await expect(page.locator('[data-testid="tour-filters"]')).toBeVisible()

    // Check for tour listings
    await expect(page.locator('[data-testid="tour-list"]')).toBeVisible()
  })

  test('should filter tours by category', async ({ page }) => {
    // Navigate to tours page
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')

    // Click on a category filter
    await page.locator('[data-testid="category-filter"]').getByText('Kültürel').click()

    // Wait for filtering
    await page.waitForTimeout(1000)

    // Check if filtered results are shown
    const tourCards = page.locator('[data-testid="tour-card"]')
    await expect(tourCards.first()).toBeVisible()

    // Verify all shown tours are in the selected category
    const tourCount = await tourCards.count()
    for (let i = 0; i < Math.min(tourCount, 3); i++) {
      await expect(tourCards.nth(i)).toContainText('Kültürel')
    }
  })

  test('should display tour details correctly', async ({ page }) => {
    // Navigate to tours page
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')

    // Click on the first tour
    await page.locator('[data-testid="tour-card"]').first().click()

    // Wait for navigation to tour detail page
    await page.waitForURL('**/tours/**')

    // Check if tour detail elements are present
    await expect(page.locator('[data-testid="tour-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-images"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-widget"]')).toBeVisible()
  })

  test('should add tour to cart', async ({ page }) => {
    // Navigate to a tour detail page
    await page.goto('/tours/e2e-test-tour')
    await page.waitForLoadState('networkidle')

    // Select booking options
    await page.locator('[data-testid="participant-select"]').selectOption('2')
    await page.locator('[data-testid="date-select"]').fill('2024-12-01')

    // Click add to cart button
    await page.locator('[data-testid="add-to-cart"]').click()

    // Check if success message appears
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Check cart icon shows item count
    const cartIcon = page.locator('[data-testid="cart-icon"]')
    await expect(cartIcon).toContainText('1')
  })

  test('should complete booking flow', async ({ page }) => {
    // Assume user is logged in or handle login
    await handleUserLogin(page)

    // Navigate to cart
    await page.locator('[data-testid="cart-icon"]').click()
    await page.waitForURL('**/cart')

    // Proceed to checkout
    await page.locator('[data-testid="checkout-button"]').click()
    await page.waitForURL('**/checkout')

    // Fill in booking details
    await page.locator('[data-testid="full-name"]').fill('Test User')
    await page.locator('[data-testid="email"]').fill('test@example.com')
    await page.locator('[data-testid="phone"]').fill('+901234567890')

    // Fill in payment details (use test card)
    await page.locator('[data-testid="card-number"]').fill('4242424242424242')
    await page.locator('[data-testid="expiry-date"]').fill('1225')
    await page.locator('[data-testid="cvv"]').fill('123')

    // Accept terms and conditions
    await page.locator('[data-testid="terms-checkbox"]').check()

    // Complete booking
    await page.locator('[data-testid="complete-booking"]').click()

    // Check for success page
    await page.waitForURL('**/booking/success')
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
  })

  test('should handle booking errors gracefully', async ({ page }) => {
    // Navigate to a tour that might be unavailable
    await page.goto('/tours/unavailable-tour')
    await page.waitForLoadState('networkidle')

    // Try to book unavailable tour
    await page.locator('[data-testid="book-now"]').click()

    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('mevcut değil')
  })

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) test.skip()

    // Navigate to tours page
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')

    // Check mobile navigation
    await page.locator('[data-testid="mobile-menu-toggle"]').click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Check tour cards are properly sized for mobile
    const tourCard = page.locator('[data-testid="tour-card"]').first()
    const boundingBox = await tourCard.boundingBox()

    // Ensure card is properly sized for mobile viewport
    expect(boundingBox?.width).toBeLessThanOrEqual(390)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to tours page
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')

    // Simulate network disconnection
    await page.context().setOffline(true)

    // Try to load more tours or perform an action
    await page.locator('[data-testid="load-more-tours"]').click()

    // Check for offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()

    // Reconnect and check if functionality resumes
    await page.context().setOffline(false)
    await page.reload()
    await expect(page.locator('[data-testid="tour-list"]')).toBeVisible()
  })

  test('should maintain accessibility standards', async ({ page }) => {
    // Navigate to tours page
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')

    // Check for skip links
    await expect(page.locator('[data-testid="skip-to-content"]')).toBeVisible()

    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1) // Should have exactly one h1

    // Check for alt text on images
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy() // Should have alt text
    }

    // Check for proper form labels
    const inputs = page.locator('input, select, textarea')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const label = page.locator(`label[for="${id}"]`)

      if (id) {
        await expect(label).toBeVisible() // Should have associated label
      }
    }
  })

  test('should handle PWA installation', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'PWA tests only run on Chromium')

    // Navigate to homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for install prompt trigger
    const installButton = page.locator('[data-testid="install-pwa"]')
    const isVisible = await installButton.isVisible()

    if (isVisible) {
      // Click install button
      await installButton.click()

      // Check if install prompt appears
      const installPrompt = page.locator('[data-testid="pwa-install-prompt"]')
      await expect(installPrompt).toBeVisible()
    } else {
      console.log('PWA install prompt not available in this environment')
    }
  })
})

// Helper function for user authentication in tests
async function handleUserLogin(page: any) {
  // Check if user is already logged in
  const logoutButton = page.locator('[data-testid="logout-button"]')

  if (await logoutButton.isVisible()) {
    return // User is already logged in
  }

  // Navigate to login page
  await page.locator('[data-testid="login-link"]').click()
  await page.waitForURL('**/auth/login')

  // Fill in login credentials
  await page.locator('[data-testid="email-input"]').fill('test@example.com')
  await page.locator('[data-testid="password-input"]').fill('testpassword123')

  // Submit login form
  await page.locator('[data-testid="login-submit"]').click()

  // Wait for successful login
  await page.waitForURL('**', { timeout: 10000 })
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
}

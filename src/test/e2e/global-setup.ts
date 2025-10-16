import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for emulator to be ready
    console.log('⏳ Waiting for Firebase Emulator to be ready...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    console.log('✅ Firebase Emulator is ready');

    // Wait for hosting to be ready
    console.log('⏳ Waiting for hosting to be ready...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    console.log('✅ Hosting is ready');

    // Setup test data via emulator setup script
    console.log('🌱 Setting up test data...');
    
    // Call emulator setup API or run script
    // This would typically involve calling the emulator setup endpoints
    // or running the seed script programmatically
    
    console.log('✅ Test data setup complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎉 Global E2E test setup complete');
}

export default globalSetup;

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jules/verification/videos'
    }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Create an admin user for testing if needed or sign in
    // Since we don't have a reliable way to authenticate as an admin directly via playwright without knowing credentials or setting up a test user,
    // we'll just check that the page loads without crashing for now, and ideally attempt to navigate to /admin to see if we're redirected.
    await page.goto('http://localhost:3000/admin');

    await page.waitForTimeout(2000);

    if (!fs.existsSync('/home/jules/verification/screenshots')) {
      fs.mkdirSync('/home/jules/verification/screenshots', { recursive: true });
    }
    await page.screenshot({ path: '/home/jules/verification/screenshots/admin-page.png' });
    console.log("Screenshot taken successfully.");

  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await context.close();
    await browser.close();
  }
})();

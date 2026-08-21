const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/custom');

  await page.screenshot({ path: 'custom-page-screenshot.png' });

  console.log('Screenshot saved to custom-page-screenshot.png');
  await browser.close();
})();

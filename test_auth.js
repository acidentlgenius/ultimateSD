const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/#problems');
  await page.waitForTimeout(2000);

  const buttons = await page.getByRole('button', { name: /Unlock Design Uber/i }).all();
  console.log(`Found ${buttons.length} buttons matching /Unlock Design Uber/i`);
  for (let i = 0; i < buttons.length; i++) {
     const visible = await buttons[i].isVisible();
     console.log(`Button ${i} visible: ${visible}`);
     if (visible) {
         await buttons[i].click({ force: true });
         await page.waitForTimeout(1000);
         const headings = await page.getByRole('heading', { name: /Unlock Premium Problems/i }).all();
         console.log(`Found ${headings.length} headings after clicking`);
     }
  }

  await browser.close();
})();

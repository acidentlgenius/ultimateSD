#!/usr/bin/env node
/**
 * Generates LinkedIn-ready PNG assets from marketing/linkedin/*.html
 *
 * One-time setup:
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 * Run:
 *   node scripts/generate-linkedin-media.mjs              # launch carousel + banner
 *   node scripts/generate-linkedin-media.mjs tinyurl-followups
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const linkedinDir = path.join(root, 'marketing/linkedin');

const CAROUSELS = {
  launch: {
    html: 'slides.html',
    outputDir: 'output',
    slides: [
      { id: 'slide-1', name: '01-cover' },
      { id: 'slide-2', name: '02-problem' },
      { id: 'slide-3', name: '03-solution' },
      { id: 'slide-4', name: '04-features' },
      { id: 'slide-5', name: '05-how-it-works' },
      { id: 'slide-6', name: '06-cta' },
      { id: 'banner', name: 'linkedin-banner-1584x396' },
    ],
  },
  'tinyurl-followups': {
    html: 'slides-tinyurl-followups.html',
    outputDir: 'output/tinyurl-followups',
    slides: [
      { id: 'slide-1', name: '01-cover' },
      { id: 'slide-2', name: '02-collisions' },
      { id: 'slide-3', name: '03-caching' },
      { id: 'slide-4', name: '04-aliases-redirects' },
      { id: 'slide-5', name: '05-cta' },
    ],
  },
};

async function generateCarousel(browser, carouselKey) {
  // Known keys use their explicit config; any other key auto-discovers
  // slides-<key>.html and screenshots every section.slide in document order.
  // Adding a new carousel = drop a slides-<key>.html file, no script edits.
  let carousel = CAROUSELS[carouselKey];
  if (!carousel) {
    carousel = {
      html: `slides-${carouselKey}.html`,
      outputDir: `output/${carouselKey}`,
      slides: null, // discovered from the DOM below
    };
  }

  const htmlPath = path.join(linkedinDir, carousel.html);
  const outputDir = path.join(linkedinDir, carousel.outputDir);

  if (!fs.existsSync(htmlPath)) {
    console.error('Missing HTML at', htmlPath);
    console.error(`Known carousels: ${Object.keys(CAROUSELS).join(', ')} — or create marketing/linkedin/slides-${carouselKey}.html`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  if (!carousel.slides) {
    const ids = await page.$$eval('section.slide[id]', (els) =>
      els.map((el) => ({ id: el.id, name: el.dataset.name || el.id }))
    );
    carousel.slides = ids.map((s, i) => ({
      id: s.id,
      name: `${String(i + 1).padStart(2, '0')}-${s.name.replace(/^slide-/, '')}`,
    }));
    console.log(`Auto-discovered ${carousel.slides.length} slides in ${carousel.html}`);
  }

  for (const slide of carousel.slides) {
    const el = page.locator(`#${slide.id}`);
    await el.scrollIntoViewIfNeeded();
    const outPath = path.join(outputDir, `${slide.name}.png`);
    await el.screenshot({ path: outPath, type: 'png' });
    console.log('Generated', outPath);
  }

  await page.close();
  console.log('Done:', outputDir);
}

async function main() {
  const requested = process.argv.slice(2);
  const carouselKeys = requested.length > 0 ? requested : ['launch'];

  const browser = await chromium.launch();

  for (const key of carouselKeys) {
    console.log(`\n--- ${key} ---`);
    await generateCarousel(browser, key);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

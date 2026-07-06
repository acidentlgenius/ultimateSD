---
name: verify
description: Build, launch, and drive the Ultimate SD Next.js app to verify UI changes end-to-end
---

# Verifying Ultimate SD changes

## Launch

From `ultimate-sd/`:

```bash
npx next dev -p 3777   # run in background; ready in ~15s
```

## Gotchas

- The landing page (`/`), `/pricing`, and `/roadmap` require Postgres
  (`localhost:5432`, see `docker.yaml`). Docker is NOT available in this
  WSL distro unless Docker Desktop WSL integration is enabled — those
  routes 500 with Prisma P1001 when the DB is down.
- DB-free routes that render the full global header/layout: `/blog`,
  `/login`, `/draw`. Use these to verify shared chrome (Header,
  MobileMenu, theme) when the DB is unavailable.

## Drive (browser)

Playwright is installed as `@playwright/test` (import `chromium` from
there, not `playwright`). ESM scripts must live inside `ultimate-sd/`
to resolve pnpm's node_modules — copy the script in, run, delete.

```js
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 835 } }); // mobile
await page.goto('http://localhost:3777/blog');
```

Mobile menu toggle button: `getByRole('button', { name: /toggle menu/i })`.
Give framer-motion spring animations ~800ms before screenshotting.

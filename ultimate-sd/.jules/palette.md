
## 2026-07-31 - [Button and Link Nesting]
**Learning:** Wrapping a shadcn/Radix Button inside a Next.js Link without using asChild creates invalid HTML (button inside anchor) and causes screen reader accessibility issues and hydration warnings.
**Action:** Always use the <Button asChild><Link>...</Link></Button> pattern when making links look like buttons.

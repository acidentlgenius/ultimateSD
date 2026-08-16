## 2025-02-23 - Added ARIA attributes to View Toggle Buttons
**Learning:** Icon-only view toggle buttons require explicit `aria-label`s, `aria-pressed` states, and a grouping role for screen reader accessibility to ensure users know their purpose and current state.
**Action:** When creating icon-only toggles, always include `aria-label` and `aria-pressed` attributes, and group them with `role="group"` and an `aria-label` for context.

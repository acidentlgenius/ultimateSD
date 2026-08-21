## 2024-05-19 - Accessibility for Icon-only Buttons
**Learning:** Found multiple instances where icon-only buttons (`<Button size="icon">`) lacked full accessibility attributes. Some were missing `aria-label` (crucial for screen readers), and several were missing `title` (crucial for sighted users to get native browser tooltips).
**Action:** Enforce a strict convention: all `<Button size="icon">` components must explicitly include both `aria-label` and `title` attributes.

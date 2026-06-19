# Ultimate SD Design System

primary source of truth for UI/UX consistency. based on shadcn/ui + tailwind css.

## 1. Typography
We use **Geist** font family.

- **Primary Font**: `Geist Sans` (`var(--font-geist-sans)`)
  - Usage: Body text, UI elements, Headings.
- **Monospace Font**: `Geist Mono` (`var(--font-geist-mono)`)
  - Usage: Code snippets, technical data, pricing numbers, IDs.

### Type Scale (Tokens)
- `--type-lg`: 1.25rem (20px) - Large headings
- `--type-md`: 1rem (16px) - Body text / Default
- `--type-sm`: 0.875rem (14px) - Metadata, captions

## 2. Colors
HSL-based color system supporting Dark/Light modes.

### Core Roles
- **Primary**: `hsl(221.2 83.2% 53.3%)` (Blue-600) - Main actions, active states.
- **Secondary**: `hsl(210 40% 96%)` - Secondary actions, muted backgrounds.
- **Destructive**: `hsl(0 84.2% 60.2%)` - Errors, delete actions.
- **Muted**: `hsl(210 40% 96%)` - Backgrounds, disabled states.
- **Accent**: `hsl(210 40% 96%)` - Highlights, hover effects.

### Backgrounds
- **Background**: Page background.
- **Card**: Card background (elevated).
- **Popover**: Popover/Modal background.

## 3. Spacing & Radius
### Radius Tokens
- `--radius-lg`: 0.75rem (12px) - Cards, Modals
- `--radius-md`: 0.5rem (8px) - Buttons, Inputs
- `--radius-sm`: 0.375rem (6px) - Small tags, checkboxes

### Spacing Guidelines
Use standard Tailwind spacing:
- `gap-4` / `p-4` (1rem) - Default spacing
- `gap-2` / `p-2` (0.5rem) - Tight spacing
- `gap-6` / `p-6` (1.5rem) - Section spacing

## 4. Effects & Polish
### Glassmorphism
Use these utility classes for premium feel:
- `.glass`: High blur, transparency. Use for sticky headers, overlays.
- `.glass-card`: Card with glass effect + hover lift. Use for interactive cards.

### Animations
Custom animations defined in `globals.css`:
- `.animate-fade-in`: Smooth entry opacity + translate Y.
- `.animate-slide-in`: Slide from left.
- `.animate-slide-up`: Slide up with fade (good for lists).
- `.animate-float`: Gentle floating motion (hero images).
- `.animate-shimmer`: Loading states.
- `.animate-confetti`: Celebration states.

## 5. Component Usage Guidelines
- **Cards**: Use `.glass-card` for primary dashboard items. Use standard `Card` for dense data.
- **Buttons**:
  - Primary: Solid background (brand color).
  - Ghost: Use for secondary actions to reduce visual noise.
- **Gradients**: Use `.gradient-text` for main landing page headings.

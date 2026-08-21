## 2023-11-20 - Accessible Tiptap Blog Editor Toolbar
**Learning:** Tiptap WYSIWYG editor integration often involves implementing custom toolbars using icon-only buttons (e.g. Radix UI or shadcn `<Button size="icon">`). These buttons are completely inaccessible to screen readers without explicit `aria-label` and `title` attributes.
**Action:** Always verify custom WYSIWYG toolbars for icon-only buttons and explicitly attach `aria-label` and `title` properties pointing to the button's formatting action to maintain WCAG accessibility.

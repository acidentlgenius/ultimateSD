## 2026-09-08 - Icon-only buttons accessibility in BlogEditor
**Learning:** Tiptap toolbar icon buttons in BlogEditor lack `aria-label` and `title` attributes by default, making them completely opaque to screen readers.
**Action:** Always add descriptive `aria-label` and `title` properties when creating icon-only action buttons for WYSIWYG toolbars to ensure accessibility and proper hover tooltips.

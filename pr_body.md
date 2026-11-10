💡 What: Added `aria-label` and `title` attributes to all icon-only formatting buttons in the `BlogEditor` toolbar (e.g., Bold, Italic, Heading 2).
🎯 Why: Without these attributes, screen readers only announce these buttons as "button", making the editor completely inaccessible to visually impaired users. The missing titles also meant sighted users had no tooltips to understand less obvious icons.
📸 Before/After:
Before: `<Button size="icon-sm"><Bold /></Button>`
After: `<Button size="icon-sm" aria-label="Bold" title="Bold"><Bold /></Button>`
♿ Accessibility: The toolbar is now fully navigable and understandable by screen readers, adhering to WCAG guidelines for icon-only interactive elements.

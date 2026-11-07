💡 What:
Added `aria-label` and `title` attributes to icon-only buttons that were missing them. Specifically, the back button in the custom problem page and the 10 toolbar buttons in the blog editor.

🎯 Why:
To ensure screen reader users can understand the purpose of these buttons, and to provide helpful tooltips for sighted users. Buttons that only contain icons without labels are inaccessible and can be confusing.

📸 Before/After:
Before: Buttons only had an icon inside (e.g. `<Button><Heading2 /></Button>`).
After: Buttons include descriptive text via ARIA and titles (e.g. `<Button aria-label="Toggle Heading 2" title="Toggle Heading 2"><Heading2 /></Button>`).

♿ Accessibility:
Significantly improves screen reader navigation in the blog editor and custom problem page by providing context to previously opaque interactive elements.

💡 What: Added `aria-label` and `title` to the `ArrowLeft` back button on the Custom Practice creation page.
🎯 Why: Icon-only buttons without text content are inaccessible to screen readers. Adding these attributes ensures the button is properly announced to assistive technologies and provides a helpful tooltip for sighted users on hover.
📸 Before/After: Visual change is a tooltip appearing on hover. Functionally, screen readers now announce "Go back" instead of reading nothing or the raw element tag.
♿ Accessibility: Improved semantic markup and screen reader support for the back navigation action.

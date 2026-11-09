🎨 Palette: Add missing ARIA labels and titles to icon-only buttons

💡 What:
Added missing `aria-label` and `title` attributes to numerous icon-only `Button` components across several files, focusing prominently on the `BlogEditor` toolbar, `PracticeUI` navigation, `HelpAssistant` send button, `CustomProblemPage` back button, and `WhatsNewNotifier` bell icon.

🎯 Why:
Users interacting with the application via screen readers were previously unable to determine the purpose of these icon-only buttons because they lacked accessible text alternatives. Furthermore, sighted mouse users were deprived of native tooltip functionality, which helps discoverability for smaller icons.

📸 Before/After:
Before: `<Button variant="ghost" size="icon-sm"><Bold className="h-4 w-4" /></Button>`
After: `<Button variant="ghost" size="icon-sm" aria-label="Bold" title="Bold"><Bold className="h-4 w-4" /></Button>`

♿ Accessibility:
This change directly improves WCAG 2.1 compliance (Success Criterion 1.1.1 Non-text Content and 4.1.2 Name, Role, Value) by ensuring interactive components convey their meaning programmatically and visually.

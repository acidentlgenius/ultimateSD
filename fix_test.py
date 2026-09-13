import re

with open('ultimate-sd/e2e/auth.spec.ts', 'r') as f:
    content = f.read()

# Instead of "Practice Design TinyURL", the link text is just "Practice"
content = content.replace("await page.getByRole('link', { name: /Practice Design TinyURL/i }).click();", "await page.getByRole('link', { name: /Practice/i }).first().click();")

with open('ultimate-sd/e2e/auth.spec.ts', 'w') as f:
    f.write(content)

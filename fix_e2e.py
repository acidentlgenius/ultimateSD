import re

files_to_fix = [
    'ultimate-sd/e2e/persistence.spec.ts'
]

for file in files_to_fix:
    with open(file, 'r') as f:
        content = f.read()

    # The button text seems to be "Submit answer" or "Submit design" instead of "Submit for Review"
    content = content.replace("await page.getByRole('button', { name: /Submit for Review/i }).click();", "await page.getByRole('button', { name: /Submit answer/i }).click();")

    with open(file, 'w') as f:
        f.write(content)

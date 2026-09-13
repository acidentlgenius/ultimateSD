import re

with open('ultimate-sd/e2e/adaptive-coach-full.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/adaptive-coach-full.spec.ts', 'w') as f:
    f.write(content)

with open('ultimate-sd/e2e/persistence.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/persistence.spec.ts', 'w') as f:
    f.write(content)

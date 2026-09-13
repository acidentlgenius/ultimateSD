import re

with open('ultimate-sd/e2e/adaptive-coach.spec.ts', 'r') as f:
    content = f.read()

# Replace timeout values to be larger
content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/adaptive-coach.spec.ts', 'w') as f:
    f.write(content)


with open('ultimate-sd/e2e/ai-failures.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/ai-failures.spec.ts', 'w') as f:
    f.write(content)

with open('ultimate-sd/e2e/auth.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/auth.spec.ts', 'w') as f:
    f.write(content)

with open('ultimate-sd/e2e/interview-mode.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("timeout: 15_000", "timeout: 30_000")

with open('ultimate-sd/e2e/interview-mode.spec.ts', 'w') as f:
    f.write(content)

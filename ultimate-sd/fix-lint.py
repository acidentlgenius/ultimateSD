import re

with open("ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx", "r") as f:
    content = f.read()

# Replace useRef with useState
content = content.replace(
    "const preferReducedMotion = useRef(false);",
    "const [preferReducedMotion, setPreferReducedMotion] = useState(false);"
)

# Update setting the value
content = content.replace(
    "preferReducedMotion.current =\n      typeof window !== 'undefined' &&\n      window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
    "setPreferReducedMotion(\n      typeof window !== 'undefined' &&\n      window.matchMedia('(prefers-reduced-motion: reduce)').matches\n    );"
)

# Update reading the value during render
content = content.replace(
    "preferReducedMotion.current",
    "preferReducedMotion"
)


with open("ultimate-sd/src/components/landing/AdaptiveCoachDemo.tsx", "w") as f:
    f.write(content)

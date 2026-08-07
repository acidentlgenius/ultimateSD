import re

def find_interval_starvation(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Look for useEffect containing setInterval where the state modified is in the dependency array
    # This is a bit complex for a simple regex, so we'll do a simpler heuristic

    use_effect_blocks = re.findall(r'useEffect\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[([^\]]*)\]\s*\);', content)

    for block, deps in use_effect_blocks:
        if 'setInterval' in block:
            print(f"File: {file_path}")
            print(f"Dependencies: {deps}")
            print("-" * 20)

import glob
for file in glob.glob('ultimate-sd/src/components/widgets/**/*.tsx', recursive=True):
    find_interval_starvation(file)

import sys

filepath = 'ultimate-sd/src/components/widgets/BlockchainDemo.tsx'

with open(filepath, 'r') as f:
    content = f.read()

search_str = """        // Simulate async mining loop
        const mineLoop = setInterval(() => {"""

replace_str = """        // Simulate async mining loop
        if (mineLoopRef.current) clearInterval(mineLoopRef.current);
        const mineLoop = setInterval(() => {"""

new_content = content.replace(search_str, replace_str)

with open(filepath, 'w') as f:
    f.write(new_content)

print("Modification complete.")

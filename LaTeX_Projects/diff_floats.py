with open("main_backup_user.tex", "r", encoding="utf-8") as f:
    backup_content = f.read()

with open("main.tex", "r", encoding="utf-8") as f:
    compiled_content = f.read()

import re

# Find all occurrences of \begin{figure}[...] or \begin{table}[...]
bf = re.findall(r'\\begin\{(figure|table|longtable)\}\[?([^\]]*?)\]?', backup_content)
cf = re.findall(r'\\begin\{(figure|table|longtable)\}\[?([^\]]*?)\]?', compiled_content)

print(f"Backup floats count: {len(bf)}")
print(f"Current floats count: {len(cf)}")

# Print mismatches
for i in range(max(len(bf), len(cf))):
    b = bf[i] if i < len(bf) else "N/A"
    c = cf[i] if i < len(cf) else "N/A"
    if b != c:
        print(f"Index {i:02d}:")
        print(f"  B: {b}")
        print(f"  C: {c}")

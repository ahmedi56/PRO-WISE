with open("main_backup_user.tex", "r", encoding="utf-8") as f:
    backup_content = f.read()

with open("main.tex", "r", encoding="utf-8") as f:
    compiled_content = f.read()

import re
bg = re.findall(r'\\includegraphics\[[^\]]+\]\{[^}]+\}', backup_content)
cg = re.findall(r'\\includegraphics\[[^\]]+\]\{[^}]+\}', compiled_content)

print(f"Backup list length: {len(bg)}")
print(f"Current list length: {len(cg)}")

for i in range(max(len(bg), len(cg))):
    b = bg[i] if i < len(bg) else "N/A"
    c = cg[i] if i < len(cg) else "N/A"
    if b != c:
        print(f"Index {i:02d}:")
        print(f"  B: {b}")
        print(f"  C: {c}")

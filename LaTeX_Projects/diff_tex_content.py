with open("main_backup_user.tex", "r", encoding="utf-8") as f:
    backup_content = f.read()

with open("main.tex", "r", encoding="utf-8") as f:
    compiled_content = f.read()

# Let's search for screenshots/images or formatting command changes specifically.
# E.g., check sizes of graphics in each release.
import re

def find_graphics(content):
    return re.findall(r'\\includegraphics\[([^\]]+)\]\{([^}]+)\}', content)

bg = find_graphics(backup_content)
cg = find_graphics(compiled_content)

print(f"Total graphics in backup: {len(bg)}")
print(f"Total graphics in current: {len(cg)}")

print("\nDifferences in graphics options:")
for (b_opt, b_file), (c_opt, c_file) in zip(bg, cg):
    if b_file != c_file or b_opt != c_opt:
        print(f"Backup: [{b_opt}] {{{b_file}}}  VS  Current: [{c_opt}] {{{c_file}}}")

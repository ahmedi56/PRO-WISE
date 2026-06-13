import difflib

with open("main_backup_user.tex", "r", encoding="utf-8") as f:
    user_lines = f.readlines()

with open("main.tex", "r", encoding="utf-8") as f:
    compiled_lines = f.readlines()

diff = difflib.unified_diff(
    user_lines, compiled_lines,
    fromfile="main_backup_user.tex",
    tofile="main.tex",
    n=2
)

# Print first 200 lines of diff or write to a file
with open("tex_diff.txt", "w", encoding="utf-8") as f:
    f.writelines(diff)

print("Diff written to tex_diff.txt")

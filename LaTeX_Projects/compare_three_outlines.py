import fitz

def get_outline(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        return len(doc), doc.get_toc()
    except Exception as e:
        return 0, []

len_target, toc_target = get_outline(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
len_backup, toc_backup = get_outline("main_backup_compiled.pdf")
len_compiled, toc_compiled = get_outline("main_compiled.pdf")

target_dict = {item[1]: item[2] for item in toc_target}
backup_dict = {item[1]: item[2] for item in toc_backup}
compiled_dict = {item[1]: item[2] for item in toc_compiled}

all_titles = []
for item in toc_target:
    if item[1] not in all_titles:
        all_titles.append(item[1])

with open("comparison_three.txt", "w", encoding="utf-8") as f:
    f.write(f"Target Pages: {len_target} | User Backup Compiled: {len_backup} | Current Compiled: {len_compiled}\n\n")
    f.write(f"{'Title / Section':<65} | {'Target':<7} | {'Backup':<7} | {'Current':<7}\n")
    f.write("-" * 95 + "\n")
    for title in all_titles:
        t_page = target_dict.get(title, "N/A")
        b_page = backup_dict.get(title, "N/A")
        c_page = compiled_dict.get(title, "N/A")
        f.write(f"{title:<65} | {t_page:<7} | {b_page:<7} | {c_page:<7}\n")

print("Done writing comparison_three.txt")

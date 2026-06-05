def load_outline(file_path):
    sections = []
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    total_pages = lines[0].strip()
    for line in lines[1:]:
        if " -> Page " in line:
            parts = line.strip().split(" -> Page ")
            title = parts[0]
            page = int(parts[1])
            sections.append((title, page))
    return total_pages, sections

t_total, t_sec = load_outline("backup_outline.txt")
b_total, b_sec = load_outline("compiled_outline.txt") # wait, this is main_compiled.pdf outline

with open("comparison_sequential.txt", "w", encoding="utf-8") as f:
    f.write(f"Target Pages: {t_total} | Compiled Pages: {b_total}\n\n")
    f.write(f"{'Idx':<4} | {'Target Title / Section':<65} | {'Target':<6} | {'Compiled':<6} | {'Diff':<4}\n")
    f.write("-" * 95 + "\n")
    for idx in range(min(len(t_sec), len(b_sec))):
        t_title, t_page = t_sec[idx]
        b_title, b_page = b_sec[idx]
        
        diff = b_page - t_page
        title_disp = t_title
        if t_title != b_title:
            title_disp = f"{t_title} (Mismatched with Compiled: {b_title})"
            
        f.write(f"{idx:<4} | {title_disp:<65} | {t_page:<6} | {b_page:<6} | {diff:<4}\n")
        
print("Done writing comparison_sequential.txt")

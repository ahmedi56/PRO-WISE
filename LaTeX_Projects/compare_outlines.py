def parse_outline_file(file_path):
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

b_total, b_sec = parse_outline_file("backup_outline.txt")
c_total, c_sec = parse_outline_file("compiled_outline.txt")

print(f"Backup {b_total} | Compiled {c_total}\n")
print(f"{'Section / Title':<70} | {'Backup Page':<12} | {'Compiled Page':<15} | {'Diff':<5}")
print("-" * 108)

# Match sections by title
b_dict = {title: page for title, page in b_sec}
c_dict = {title: page for title, page in c_sec}

# Let's print sequentially to see where the shift happens
for i, (title, b_page) in enumerate(b_sec):
    c_page = c_dict.get(title, "NOT FOUND")
    if isinstance(c_page, int):
        diff = c_page - b_page
    else:
        diff = "N/A"
    print(f"{title:<70} | {b_page:<12} | {c_page:<15} | {diff:<5}")

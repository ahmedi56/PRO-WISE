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

with open("comparison.txt", "w", encoding="utf-8") as f:
    f.write(f"Backup {b_total} | Compiled {c_total}\n\n")
    f.write(f"{'Index':<5} | {'Section / Title':<75} | {'Backup Page':<12} | {'Compiled Page':<15} | {'Diff':<5}\n")
    f.write("-" * 118 + "\n")
    
    # We will match them by matching titles, but since some titles are duplicate (like "Level 2: Introduction"),
    # we should step through both lists using sequence alignment or simple index matching where appropriate,
    # or just show them side by side.
    max_len = max(len(b_sec), len(c_sec))
    for idx in range(max_len):
        b_title, b_page = b_sec[idx] if idx < len(b_sec) else ("N/A", "N/A")
        c_title, c_page = c_sec[idx] if idx < len(c_sec) else ("N/A", "N/A")
        
        # We can also compute diff if both are valid numbers and titles match
        diff = "N/A"
        if isinstance(b_page, int) and isinstance(c_page, int):
            if b_title == c_title:
                diff = str(c_page - b_page)
            else:
                diff = f"Title Mismatch: {b_title} vs {c_title}"
        f.write(f"{idx:<5} | {b_title:<75} | {str(b_page):<12} | {str(c_page):<15} | {diff:<5}\n")

print("Done comparing outlines to comparison.txt")

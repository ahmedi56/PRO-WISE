import fitz

doc = fitz.open("main_backup_compiled.pdf")
print("Total Pages:", len(doc))
outline = doc.get_toc()
for item in outline:
    if item[1].startswith("Adopted Software Development Methodology") or "Chapter 1" in item[1] or "Chapter 2" in item[1]:
        print(f"Level {item[0]}: {item[1]} -> Page {item[2]}")

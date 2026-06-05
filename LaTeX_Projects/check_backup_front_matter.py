import fitz

doc = fitz.open("main_backup_compiled.pdf")
print("TOC Outline in main_backup_compiled.pdf:")
for item in doc.get_toc():
    print(f"Level {item[0]}: {item[1]} -> Page {item[2]}")

import fitz

doc = fitz.open("main_backup_compiled.pdf")
print("BACKUP COMPILED Page 20 coordinates:")
page = doc[19] # page 20 (0-indexed 19)
text = page.get_text("blocks")
for b in text:
    txt = b[4].replace('\n', ' ').strip()
    if len(txt) > 80:
        txt = txt[:80] + "..."
    print(f"  [{b[1]:.1f} - {b[3]:.1f}]: {txt}")

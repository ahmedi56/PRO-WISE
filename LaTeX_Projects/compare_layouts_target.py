import fitz

doc = fitz.open(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
with open("target_layout.txt", "w", encoding="utf-8") as f:
    f.write("=== TARGET PDF ===\n")
    for p in range(16, min(24, len(doc))):
        page = doc[p]
        text = page.get_text("blocks")
        f.write(f"--- Physical Page {p+1} ---\n")
        for b in text:
            txt = b[4].replace('\n', ' ').strip()
            if len(txt) > 80:
                txt = txt[:80] + "..."
            f.write(f"  [{b[1]:.1f} - {b[3]:.1f}]: {txt}\n")
print("Done writing target_layout.txt")

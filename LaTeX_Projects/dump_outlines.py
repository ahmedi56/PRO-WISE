import fitz

def dump_outline(pdf_path, out_txt_path):
    doc = fitz.open(pdf_path)
    outline = doc.get_toc()
    with open(out_txt_path, "w", encoding="utf-8") as f:
        f.write(f"Total Pages: {len(doc)}\n")
        for item in outline:
            f.write(f"Level {item[0]}: {item[1]} -> Page {item[2]}\n")

dump_outline(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf", "backup_outline.txt")
dump_outline(r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\main.pdf", "compiled_outline.txt")
print("Outlines dumped successfully.")

import fitz

def print_page_content(pdf_path, name):
    print(f"\n=================== {name} ===================")
    doc = fitz.open(pdf_path)
    for p in range(16, min(24, len(doc))):
        page = doc[p]
        text = page.get_text("blocks")
        print(f"--- Physical Page {p+1} ---")
        for b in text:
            # block format: (x0, y0, x1, y1, "text", block_no, block_type)
            txt = b[4].replace('\n', ' ').strip()
            if len(txt) > 80:
                txt = txt[:80] + "..."
            print(f"  [{b[1]:.1f} - {b[3]:.1f}]: {txt}")

print_page_content(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf", "TARGET")
print_page_content("main_compiled.pdf", "COMPILED")

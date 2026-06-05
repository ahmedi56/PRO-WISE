import fitz

def dump_pages(pdf_path, out_file_path, start_page, end_page):
    doc = fitz.open(pdf_path)
    with open(out_file_path, "w", encoding="utf-8") as f:
        f.write(f"--- DUMP OF PAGES {start_page} to {end_page} of {pdf_path} ---\n\n")
        for page_num in range(start_page - 1, min(end_page, len(doc))):
            f.write(f"=== PAGE {page_num + 1} ===\n")
            text = doc[page_num].get_text("text")
            f.write(text)
            f.write("\n\n")

dump_pages(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf", "backup_pages_18_23.txt", 18, 23)
dump_pages(r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\main_compiled.pdf", "compiled_pages_18_23.txt", 18, 23)
print("Pages dumped successfully.")

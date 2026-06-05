import fitz

def print_fig_info(pdf_path, name):
    print(f"\n=================== {name} ===================")
    doc = fitz.open(pdf_path)
    for p in range(38, min(55, len(doc))):
        page = doc[p]
        text = page.get_text("text")
        # Search for figure captions
        figures = []
        for line in text.split("\n"):
            if "Figure " in line or "Table " in line:
                figures.append(line.strip())
        print(f"Page {p+1}: {figures if figures else 'No figures/tables'}")

print_fig_info(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf", "TARGET")
print_fig_info("main_compiled.pdf", "COMPILED")

import fitz

doc = fitz.open(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
print("TOC pages in backup PDF:")
for p in [5, 6, 7, 8]:
    print(f"--- PAGE {p+1} ---")
    print(doc[p].get_text("text"))

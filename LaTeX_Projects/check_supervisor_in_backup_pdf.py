import fitz

doc = fitz.open(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
print("Total pages in backup PDF:", len(doc))

print("\n--- PAGE 1 (Cover Page) ---")
print(doc[0].get_text("text"))

print("\n--- PAGE 2 ---")
print(doc[1].get_text("text"))

print("\n--- PAGE 3 ---")
print(doc[2].get_text("text"))

print("\n--- PAGE 4 ---")
print(doc[3].get_text("text"))

import fitz

doc = fitz.open(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
print("Target PDF Pages 48 and 49:")
for p in [47, 48]: # 0-indexed: 47 is page 48, 48 is page 49
    print(f"\n--- PAGE {p+1} ---")
    print(doc[p].get_text("text"))

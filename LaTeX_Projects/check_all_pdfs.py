import fitz
import os

pdf_dirs = [
    r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects",
    r"C:\Users\T560\Desktop\raje3ou belahi"
]

for d in pdf_dirs:
    if not os.path.exists(d):
        continue
    print(f"\n--- Directory: {d} ---")
    for f in os.listdir(d):
        if f.endswith(".pdf"):
            path = os.path.join(d, f)
            try:
                doc = fitz.open(path)
                print(f"  {f:<30} : {len(doc)} pages (size: {os.path.getsize(path)} bytes)")
            except Exception as e:
                print(f"  {f:<30} : Error ({e})")

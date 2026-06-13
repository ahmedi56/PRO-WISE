import fitz

def print_image_rects(pdf_path):
    print(f"\n--- Images in {pdf_path} ---")
    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)
        if image_list:
            print(f"Page {page_num + 1}:")
            for img in image_list:
                xref = img[0]
                rects = page.get_image_rects(xref)
                for r in rects:
                    print(f"  Image xref: {xref}, width: {r.x1 - r.x0:.2f}, height: {r.y1 - r.y0:.2f}, rect: {r}")

print_image_rects(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
print_image_rects("main_compiled.pdf")

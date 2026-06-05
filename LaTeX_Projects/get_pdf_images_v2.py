import fitz

def format_images(pdf_path):
    out = []
    doc = fitz.open(pdf_path)
    out.append(f"PDF: {pdf_path} (Total Pages: {len(doc)})\n")
    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)
        if image_list:
            out.append(f"Page {page_num + 1}:\n")
            for img in image_list:
                xref = img[0]
                rects = page.get_image_rects(xref)
                for r in rects:
                    out.append(f"  Image xref: {xref}, width: {r.x1 - r.x0:.2f}, height: {r.y1 - r.y0:.2f}, rect: {r}\n")
    return "".join(out)

target_info = format_images(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf")
compiled_info = format_images("main_compiled.pdf")

with open("pdf_images_diff.txt", "w", encoding="utf-8") as f:
    f.write("=== TARGET PDF ===\n")
    f.write(target_info)
    f.write("\n\n=== COMPILED PDF ===\n")
    f.write(compiled_info)

print("Done writing pdf_images_diff.txt")

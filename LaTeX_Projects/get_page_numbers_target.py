import fitz

def print_page_numbers(pdf_path, name):
    print(f"\n=================== {name} ===================")
    doc = fitz.open(pdf_path)
    for p in range(13, min(26, len(doc))):
        page = doc[p]
        text = page.get_text("text").strip()
        # Find page number (typically the last few characters/lines)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        footer = "None"
        if lines:
            # Let's inspect the last 3 lines to look for single digits/roman numerals
            for l in reversed(lines[-3:]):
                if l.isdigit() or l.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                    footer = l
                    break
        print(f"Physical Page {p+1}: Printed Page: {footer} | Last line: {lines[-1] if lines else ''}")

print_page_numbers(r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf", "TARGET")
print_page_numbers("main_compiled.pdf", "COMPILED")

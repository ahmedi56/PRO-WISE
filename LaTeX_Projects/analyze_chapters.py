import fitz # PyMuPDF
import os

def analyze_pdf(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} does not exist.")
        return {}
    
    doc = fitz.open(pdf_path)
    print(f"\nAnalyzing: {pdf_path}")
    print(f"Total Pages: {len(doc)}")
    
    headings = {
        "DEDICATION": ["dedication"],
        "ACKNOWLEDGEMENT": ["acknowledgements", "acknowledgment"],
        "ABSTRACT": ["abstract"],
        "TABLE OF CONTENTS": ["table of contents"],
        "LIST OF FIGURES": ["list of figures"],
        "LIST OF TABLES": ["list of tables"],
        "INTRODUCTION": ["general introduction"],
        "CHAPTER 1": ["chapter 1", "general presentation"],
        "CHAPTER 2": ["chapter 2", "architecture, tools"],
        "CHAPTER 3": ["chapter 3", "release 1"],
        "CHAPTER 4": ["chapter 4", "release 2"],
        "CHAPTER 5": ["chapter 5", "release 3"],
        "CHAPTER 6": ["chapter 6", "release 4"],
        "CHAPTER 7": ["chapter 7", "release 5"],
        "CONCLUSION": ["general conclusion"],
        "BIBLIOGRAPHY": ["bibliography", "references"],
        "WEBOGRAPHY": ["webography"],
    }
    
    results = {}
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").lower()
        
        # Check for headings
        for h_name, keywords in headings.items():
            if h_name in results:
                continue
            for kw in keywords:
                if kw in text:
                    # Let's verify if this page contains the actual section title
                    # e.g., to prevent matching in TOC, look for it outside page 5-15 (TOC pages)
                    if page_num > 15 or h_name not in ["CHAPTER 1", "CHAPTER 2", "CHAPTER 3", "CHAPTER 4", "CHAPTER 5", "CHAPTER 6", "CHAPTER 7", "BIBLIOGRAPHY", "WEBOGRAPHY"]:
                        results[h_name] = page_num + 1
                        break
                    elif page_num > 4 and h_name in ["CHAPTER 1", "CHAPTER 2", "CHAPTER 3", "CHAPTER 4", "CHAPTER 5", "CHAPTER 6", "CHAPTER 7", "BIBLIOGRAPHY", "WEBOGRAPHY"]:
                        # Avoid TOC page hits for chapter titles
                        # Let's count occurrences or check if it starts with "chapter" or matches a larger block
                        lines = [line.strip() for line in text.split('\n') if line.strip()]
                        is_toc = any("table of contents" in l or "list of" in l for l in lines[:5])
                        # If the page has dot leaders or page numbers next to chapter titles, it's likely TOC
                        dot_leaders = text.count('.') > 15
                        if not dot_leaders:
                            results[h_name] = page_num + 1
                            break
    
    # Let's do a fallback search with a more standard TOC parser or outline if available
    outline = doc.get_toc()
    if outline:
        print("TOC Outline:")
        for item in outline:
            print(f"  Level {item[0]}: {item[1]} -> Page {item[2]}")
            
    for k, v in results.items():
        print(f"  {k}: Page {v}")
        
    return results

backup_pdf = r"C:\Users\T560\Desktop\raje3ou belahi\main.pdf"
compiled_pdf = r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\main_compiled.pdf"

print("--- BACKUP PDF ---")
backup_results = analyze_pdf(backup_pdf)

print("\n--- COMPILED PDF ---")
compiled_results = analyze_pdf(compiled_pdf)

print("\n--- COMPARISON ---")
all_keys = sorted(list(set(backup_results.keys()) | set(compiled_results.keys())))
print(f"{'Section':<25} | {'Backup Page':<12} | {'Compiled Page':<15} | {'Diff':<5}")
print("-" * 65)
for k in all_keys:
    b_p = backup_results.get(k, "N/A")
    c_p = compiled_results.get(k, "N/A")
    if isinstance(b_p, int) and isinstance(c_p, int):
        diff = c_p - b_p
    else:
        diff = "N/A"
    print(f"{k:<25} | {b_p:<12} | {c_p:<15} | {diff:<5}")

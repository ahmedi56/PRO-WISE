import sys

print("Python version:", sys.version)

libraries = ['pypdf', 'PyPDF2', 'fitz', 'pdfplumber', 'pdfminer', 'reportlab']
for lib in libraries:
    try:
        __import__(lib)
        print(f"  {lib}: Available")
    except ImportError:
        print(f"  {lib}: Not available")

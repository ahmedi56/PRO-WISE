with open("main.tex", "r", encoding="utf-8") as f:
    content = f.read()

import re

figures = re.findall(r'\\begin\{figure\}(.*?)\\end\{figure\}', content, re.DOTALL)
print(f"Total figures: {len(figures)}")
for idx, fig in enumerate(figures):
    img = re.search(r'\\includegraphics\[?([^\]]*?)\]?\{([^\}]+)\}', fig)
    caption = re.search(r'\\caption\{([^\}]+)\}', fig)
    label = re.search(r'\\label\{([^\}]+)\}', fig)
    
    img_str = img.group(0) if img else "No image"
    cap_str = caption.group(1) if caption else "No caption"
    lbl_str = label.group(1) if label else "No label"
    
    print(f"Figure {idx+1}:")
    print(f"  Image: {img_str}")
    print(f"  Caption: {cap_str}")
    print(f"  Label: {lbl_str}")

import os
import re

with open("main.tex", "r", encoding="utf-8") as f:
    tex_content = f.read()

referenced = set(re.findall(r'\{images/([^}]+)\}', tex_content))
# Also check relative to graphics path
referenced.update(re.findall(r'\{([^}]+)\}', tex_content))

images_dir = "images"
if os.path.exists(images_dir):
    files = os.listdir(images_dir)
    print("Files in images/ that are NOT referenced in main.tex:")
    for f in files:
        # Check if file or any part of it is referenced
        is_ref = False
        for ref in referenced:
            if f in ref or ref in f:
                is_ref = True
                break
        if not is_ref:
            print(f"  {f}")

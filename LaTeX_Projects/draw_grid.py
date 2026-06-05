from PIL import Image, ImageDraw, ImageFont

def overlay_grid(img_path, out_path):
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    # Draw horizontal and vertical grid lines every 50 pixels
    for x in range(0, w, 50):
        draw.line([(x, 0), (x, h)], fill="red" if x % 100 == 0 else "gray", width=1 if x % 100 != 0 else 2)
        if x % 100 == 0:
            draw.text((x, 10), str(x), fill="red")
            
    for y in range(0, h, 50):
        draw.line([(0, y), (w, y)], fill="red" if y % 100 == 0 else "gray", width=1 if y % 100 != 0 else 2)
        if y % 100 == 0:
            draw.text((10, y), str(y), fill="red")
            
    img.save(out_path)

overlay_grid(r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\images\hybrid_parts_compatibility.png", 
             r"C:\Users\T560\.gemini\antigravity\brain\b6cedd80-4cdf-44f0-973f-81456fda08c4\grid_hybrid.png")

overlay_grid(r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\images\with_rag_pipeline.png", 
             r"C:\Users\T560\.gemini\antigravity\brain\b6cedd80-4cdf-44f0-973f-81456fda08c4\grid_rag.png")

print("Grids generated!")

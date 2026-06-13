from PIL import Image, ImageDraw, ImageFont
import os

# Load fonts
font_path_reg = r"C:\Windows\Fonts\arial.ttf"
font_path_bold = r"C:\Windows\Fonts\arialbd.ttf"

font_bold_22 = ImageFont.truetype(font_path_bold, 22)
font_reg_20 = ImageFont.truetype(font_path_reg, 20)
font_reg_18 = ImageFont.truetype(font_path_reg, 18)

# 1. Edit hybrid_parts_compatibility.png
def edit_compatibility():
    img_path = r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\images\hybrid_parts_compatibility.png"
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    
    # Draw white rectangle to cover the old text inside STAGE 1 white box
    # Coordinates: X from 302 to 698, Y from 356 to 474
    draw.rectangle([302, 356, 698, 474], fill="white")
    
    # Write new text
    t1 = "Evaluate Relevance Score"
    t2 = "based on descriptions (NLP/AI)"
    t3 = "Filter Candidates"
    t4 = "(threshold applied, e.g., >0.7)"
    
    # Centered X positions (center of the image is at X = 500 in 1024x1024)
    # Using anchor='mm' to center text horizontally and vertically
    draw.text((500, 375), t1, fill="black", font=font_bold_22, anchor="mm")
    draw.text((500, 405), t2, fill="black", font=font_reg_20, anchor="mm")
    draw.text((500, 435), t3, fill="black", font=font_reg_20, anchor="mm")
    draw.text((500, 460), t4, fill="black", font=font_reg_18, anchor="mm")
    
    img.save(img_path)
    print("Compatibility flowchart updated!")

# 2. Edit with_rag_pipeline.png
def edit_rag():
    img_path = r"C:\Users\T560\Desktop\PRO-WISE\LaTeX_Projects\images\with_rag_pipeline.png"
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    
    # Draw white rectangle to cover "Vector Satorage" and "(FAISS/Pinecone)"
    # Coordinates: X from 755 to 960, Y from 325 to 385
    draw.rectangle([755, 325, 960, 385], fill="white")
    
    t1 = "Vector Storage"
    t2 = "(MongoDB)"
    
    # Centered under the database icon (center X is around 855)
    draw.text((858, 342), t1, fill="black", font=font_bold_22, anchor="mm")
    draw.text((858, 372), t2, fill="#546e7a", font=font_reg_20, anchor="mm")
    
    img.save(img_path)
    print("RAG Pipeline flowchart updated!")

if __name__ == "__main__":
    edit_compatibility()
    edit_rag()

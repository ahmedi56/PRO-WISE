"""
Generate square mobile app icon assets from pro-wise.png.
Outputs:
  mobile/assets/icon.png          - 1024x1024 (app icon)
  mobile/assets/adaptive-icon.png - 1024x1024 (Android adaptive icon foreground)
  mobile/assets/splash.png        - 1284x2778 (splash screen)
"""
from PIL import Image, ImageOps
import os

SOURCE = "pro-wise.png"
OUTPUT_DIR = "mobile/assets"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def make_padded_square(src_path, out_path, canvas_size, fg_size, bg_color=(22, 27, 34, 255)):
    """
    Open src_path, resize preserving aspect ratio to fg_size,
    paste centred on a canvas_size square with bg_color background.
    """
    img = Image.open(src_path).convert("RGBA")
    img.thumbnail(fg_size, Image.LANCZOS)
    canvas = Image.new("RGBA", canvas_size, bg_color)
    x = (canvas_size[0] - img.width) // 2
    y = (canvas_size[1] - img.height) // 2
    canvas.paste(img, (x, y), img)
    canvas.save(out_path, "PNG")
    print(f"  Saved {out_path} ({canvas_size[0]}x{canvas_size[1]})")


print("Generating mobile/assets/icon.png (1024x1024) ...")
make_padded_square(SOURCE, f"{OUTPUT_DIR}/icon.png",
                   canvas_size=(1024, 1024),
                   fg_size=(820, 820))

print("Generating mobile/assets/adaptive-icon.png (1024x1024, 72% safe zone) ...")
make_padded_square(SOURCE, f"{OUTPUT_DIR}/adaptive-icon.png",
                   canvas_size=(1024, 1024),
                   fg_size=(700, 700))

print("Generating mobile/assets/splash.png (1284x2778) ...")
make_padded_square(SOURCE, f"{OUTPUT_DIR}/splash.png",
                   canvas_size=(1284, 2778),
                   fg_size=(900, 900))

print("\nDone!")

from PIL import Image
import sys

src = sys.argv[1]
targets = [
    (r"d:\000-CURSOR\001-oatstone\000-OATSTONE\frontend\public\assets\oatstone-logo.png", (255, 255, 255)),
    (r"d:\000-CURSOR\001-oatstone\000-OATSTONE\frontend\public\assets\oatstone-logo-footer.png", (245, 245, 245)),
]

img = Image.open(src).convert("RGBA")
w, h = img.size

for out, bg in targets:
    out_img = img.copy()
    pixels = out_img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > 230 and g > 230 and b > 230:
                pixels[x, y] = (*bg, 255)
    out_img.save(out)
    print("saved", out)

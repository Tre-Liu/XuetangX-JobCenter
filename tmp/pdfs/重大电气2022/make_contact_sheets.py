from pathlib import Path
from PIL import Image, ImageDraw

root = Path("tmp/pdfs/重大电气2022")
pages = sorted(root.glob("page-*.png"))
for start in range(0, len(pages), 5):
    batch = pages[start:start + 5]
    thumbs = []
    for path in batch:
        image = Image.open(path).convert("RGB")
        image.thumbnail((520, 675))
        thumbs.append((path.name, image.copy()))
    canvas = Image.new("RGB", (len(thumbs) * 540, 725), "white")
    draw = ImageDraw.Draw(canvas)
    for col, (name, image) in enumerate(thumbs):
        x = col * 540 + 10
        draw.text((x, 8), name, fill="black")
        canvas.paste(image, (x, 40))
    out = root / f"contact-{start + 1:02d}-{start + len(batch):02d}.jpg"
    canvas.save(out, quality=90)
    print(out)

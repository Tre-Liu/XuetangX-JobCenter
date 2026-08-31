from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/交付文档/_qa6")
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"


def build(folder: str, output: str):
    pages = sorted((ROOT / folder).glob("page-*.png"))
    thumbs = []
    for page in pages:
        image = Image.open(page).convert("RGB")
        image.thumbnail((510, 660))
        thumbs.append((page.name, image.copy()))
    columns = 3
    rows = (len(thumbs) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * 540, rows * 710), "#D9DEDC")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(FONT, 22)
    for idx, (name, image) in enumerate(thumbs):
        x = (idx % columns) * 540 + 15
        y = (idx // columns) * 710 + 15
        canvas.paste(image, (x, y))
        draw.text((x, y + 667), name, font=font, fill="#24313A")
    canvas.save(ROOT / output, quality=92)


build("关键技术", "关键技术-contact.png")
build("功能说明", "功能说明-contact.png")

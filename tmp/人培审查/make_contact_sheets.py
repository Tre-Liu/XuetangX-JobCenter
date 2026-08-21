from pathlib import Path

from PIL import Image, ImageDraw


def page_number(path: Path) -> int:
    return int(path.stem.split("-")[1])


def build(folder: Path, name: str, output: Path) -> None:
    files = sorted(folder.glob("page-*.png"), key=page_number)
    for sheet_index in range((len(files) + 5) // 6):
        batch = files[sheet_index * 6 : (sheet_index + 1) * 6]
        canvas = Image.new("RGB", (1200, 1100), "white")
        draw = ImageDraw.Draw(canvas)
        for item_index, path in enumerate(batch):
            image = Image.open(path).convert("RGB")
            image.thumbnail((360, 500))
            x = (item_index % 3) * 400
            y = (item_index // 3) * 550
            draw.text((x + 4, y + 4), f"{name} p{page_number(path)}", fill="black")
            canvas.paste(image, (x, y + 24))
        canvas.save(output / f"{name}_{sheet_index + 1}.jpg", quality=88)


base = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/tmp/人培审查")
output = base / "contact"
output.mkdir(exist_ok=True)
build(base / "docx_render", "docx", output)
build(base / "pdf_render", "standard", output)

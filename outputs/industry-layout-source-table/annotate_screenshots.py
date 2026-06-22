from pathlib import Path

from PIL import Image, ImageDraw


BASE = Path("/Users/liuhongzhe/Documents/专业建设/outputs/industry-layout-source-table/screenshots")


def annotate(path: Path, output: Path, boxes):
    image = Image.open(path).convert("RGBA")
    draw = ImageDraw.Draw(image)
    for x1, y1, x2, y2 in boxes:
        for offset in range(5):
            draw.rectangle(
                (x1 - offset, y1 - offset, x2 + offset, y2 + offset),
                outline=(255, 72, 72, 255),
            )
    image.save(output)


annotate(
    BASE / "fig1-industry-chain-overview.png",
    BASE / "fig1-industry-chain-overview-annotated.png",
    [
        (276, 166, 2016, 303),
        (300, 382, 1996, 490),
        (302, 504, 1992, 1048),
        (302, 1064, 1992, 1302),
    ],
)

annotate(
    BASE / "fig2-national-industry-metric-dialog.png",
    BASE / "fig2-national-industry-metric-dialog-annotated.png",
    [
        (663, 218, 1385, 1004),
        (688, 532, 1358, 613),
        (688, 632, 1358, 711),
        (688, 748, 1210, 855),
    ],
)

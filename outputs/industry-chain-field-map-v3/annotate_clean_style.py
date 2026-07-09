from __future__ import annotations

from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程")
OUT = ROOT / "outputs/industry-chain-field-map-v3"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
RED = (255, 76, 76, 255)
TEXT = (255, 76, 76, 255)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size=size)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], width: int = 5) -> None:
    draw.line((start, end), fill=RED, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    head = 24
    spread = math.radians(24)
    points = [
        end,
        (
            int(end[0] - head * math.cos(angle - spread)),
            int(end[1] - head * math.sin(angle - spread)),
        ),
        (
            int(end[0] - head * math.cos(angle + spread)),
            int(end[1] - head * math.sin(angle + spread)),
        ),
    ]
    draw.polygon(points, fill=RED)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int = 26) -> None:
    x, y = xy
    f = font(size)
    # Light halo keeps red text readable without adding a heavy label box.
    for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1)]:
        draw.text((x + dx, y + dy), text, fill=(255, 255, 255, 230), font=f)
    draw.text((x, y), text, fill=TEXT, font=f)


def save_clean_tree() -> None:
    image = Image.open(ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png").convert("RGBA")
    draw = ImageDraw.Draw(image)

    label(draw, (638, 760), "产业环节名称")
    arrow(draw, (628, 792), (510, 860))

    label(draw, (1040, 760), "代表企业数")
    arrow(draw, (1050, 792), (1022, 898))

    label(draw, (1420, 760), "关键技术/产品/服务标签")
    arrow(draw, (1430, 792), (1422, 940))

    image.convert("RGB").save(OUT / "产业链图谱-字段映射清爽版_v3.png", quality=95)


def save_single_annotation(
    source: Path,
    output_name: str,
    text: str,
    label_xy: tuple[int, int],
    arrow_start: tuple[int, int],
    arrow_end: tuple[int, int],
    size: int = 30,
) -> None:
    image = Image.open(source).convert("RGBA")
    draw = ImageDraw.Draw(image)
    label(draw, label_xy, text, size=size)
    arrow(draw, arrow_start, arrow_end, width=5)
    image.convert("RGB").save(OUT / output_name, quality=95)


def save_single_field_set() -> None:
    tree = ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png"
    save_single_annotation(
        tree,
        "01-当前产业链-产业链名称.png",
        "当前产业链：产业链.名称",
        (1260, 250),
        (1420, 285),
        (1830, 106),
    )
    save_single_annotation(
        tree,
        "02-产业环节名称.png",
        "产业环节名称",
        (640, 760),
        (632, 792),
        (510, 860),
    )
    save_single_annotation(
        tree,
        "03-阶段字段-上中下游.png",
        "阶段：上游 / 中游 / 下游",
        (410, 745),
        (520, 780),
        (342, 545),
    )
    save_single_annotation(
        tree,
        "04-代表企业数.png",
        "代表企业数",
        (1060, 760),
        (1075, 792),
        (1022, 898),
    )
    save_single_annotation(
        tree,
        "05-关键技术产品服务标签.png",
        "关键技术 / 产品 / 服务标签",
        (1390, 760),
        (1460, 792),
        (1422, 940),
    )
    save_single_annotation(
        tree,
        "06-国标行业KPI聚合.png",
        "国标行业KPI：行业关联聚合",
        (1180, 402),
        (1180, 436),
        (1160, 418),
        size=28,
    )


def save_clean_sankey() -> None:
    image = Image.open(ROOT / "major-construction-platform/outputs/prd/current-demo-screenshots/01-industry-chain.png").convert("RGBA")
    draw = ImageDraw.Draw(image)

    label(draw, (1180, 96), "当前产业链：产业链.名称", 24)
    arrow(draw, (1180, 128), (1714, 106), width=4)

    label(draw, (520, 352), "流向关系：建议新增产业链环节关系表", 24)
    arrow(draw, (710, 386), (870, 710), width=4)

    label(draw, (382, 568), "节点名称")
    arrow(draw, (475, 600), (512, 620))

    label(draw, (1006, 568), "环节企业数")
    arrow(draw, (1068, 600), (1082, 696))

    label(draw, (1360, 600), "应用场景/关键技术")
    arrow(draw, (1420, 632), (1624, 734))

    image.convert("RGB").save(OUT / "产业链图谱-桑基图字段映射清爽版_v3.png", quality=95)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    save_clean_tree()
    save_clean_sankey()
    save_single_field_set()
    print(OUT)

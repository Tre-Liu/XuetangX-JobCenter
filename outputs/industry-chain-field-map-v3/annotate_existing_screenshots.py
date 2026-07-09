from __future__ import annotations

from pathlib import Path
import textwrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程")
OUT = ROOT / "outputs/industry-chain-field-map-v3"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size=size)


def wrapped(text: str, width: int = 24) -> str:
    lines: list[str] = []
    for part in text.split("\n"):
        lines.extend(textwrap.wrap(part, width=width, break_long_words=False) or [""])
    return "\n".join(lines)


def callout(draw: ImageDraw.ImageDraw, xy: tuple[int, int], number: int, text: str) -> None:
    x, y = xy
    body = wrapped(text)
    label_font = font(22)
    body_font = font(20)
    line_height = 28
    lines = body.splitlines()
    width = max(360, min(620, max((draw.textlength(line, font=body_font) for line in lines), default=300) + 76))
    height = max(60, len(lines) * line_height + 26)
    draw.rounded_rectangle((x, y, x + width, y + height), radius=10, fill=(255, 255, 255, 244), outline=(255, 59, 48, 255), width=3)
    draw.ellipse((x + 12, y + 15, x + 44, y + 47), fill=(255, 59, 48, 255))
    draw.text((x + 21, y + 18), str(number), fill=(255, 255, 255, 255), font=label_font, anchor="la")
    draw.multiline_text((x + 56, y + 15), body, fill=(17, 24, 39, 255), font=body_font, spacing=4)


def box(draw: ImageDraw.ImageDraw, xyxy: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = xyxy
    draw.rounded_rectangle((x1, y1, x2, y2), radius=10, outline=(255, 59, 48, 255), width=5)


def annotate(source: Path, output: Path, items: list[dict]) -> None:
    image = Image.open(source).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for item in items:
        box(draw, item["box"])
        callout(draw, item["label_xy"], item["number"], item["text"])
    Image.alpha_composite(image, overlay).convert("RGB").save(output, quality=95)


annotate(
    ROOT / "major-construction-platform/outputs/prd/current-demo-screenshots/01-industry-chain.png",
    OUT / "产业链图谱-桑基图字段映射_v3.png",
    [
        {
            "number": 1,
            "box": (280, 84, 1888, 164),
            "label_xy": (300, 84),
            "text": "当前产业链：产业链.名称\n可由 专业-产业链 关联确定当前上下文",
        },
        {
            "number": 2,
            "box": (280, 170, 1888, 318),
            "label_xy": (315, 182),
            "text": "顶部研判：产业链.介绍 / 发展分析\nAI摘要需记录生成来源与审核状态",
        },
        {
            "number": 3,
            "box": (300, 392, 1430, 426),
            "label_xy": (306, 438),
            "text": "上/中/下游标签：产业链环节.阶段_ps上中下游\n阶段说明来自 产业链环节.介绍/分类",
        },
        {
            "number": 4,
            "box": (303, 432, 1865, 495),
            "label_xy": (310, 508),
            "text": "阶段统计：count(产业链环节) + count(产业链环节_企业)\n建议落为统计快照或视图",
        },
        {
            "number": 5,
            "box": (365, 598, 662, 1068),
            "label_xy": (372, 608),
            "text": "上游节点卡：产业链环节.名称\n关键技术/关键产品/关键材料",
        },
        {
            "number": 6,
            "box": (938, 646, 1234, 1070),
            "label_xy": (950, 608),
            "text": "中游节点卡：产业链环节.应用场景 / 细分领域\n企业数由关联企业聚合",
        },
        {
            "number": 7,
            "box": (1512, 694, 1810, 1068),
            "label_xy": (1278, 624),
            "text": "下游节点卡：产业链环节.发展建议 / 短板 / 是否高价值",
        },
        {
            "number": 8,
            "box": (650, 626, 1525, 1044),
            "label_xy": (945, 518),
            "text": "桑基流向：v3缺显式关系表\n建议新增 产业链环节关系(source,target,value,type)",
        },
    ],
)

annotate(
    ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png",
    OUT / "产业链图谱-矩形树图字段映射_v3.png",
    [
        {
            "number": 1,
            "box": (280, 88, 2020, 154),
            "label_xy": (320, 92),
            "text": "页面标题/当前产业链：产业链.名称\n专业上下文来自 专业-产业链 关联",
        },
        {
            "number": 2,
            "box": (280, 170, 2018, 300),
            "label_xy": (328, 180),
            "text": "研判摘要：产业链.介绍 / 发展分析\n建议保存AI生成版本、依据与审核人",
        },
        {
            "number": 3,
            "box": (302, 385, 1992, 488),
            "label_xy": (315, 396),
            "text": "国标行业KPI：行业 + 产业链环节_行业 聚合\n当前v3需补统计口径/快照",
        },
        {
            "number": 4,
            "box": (318, 520, 1980, 596),
            "label_xy": (340, 532),
            "text": "上中下游分组：产业链环节.阶段_ps上中下游\n展示分类、介绍、国标行业覆盖",
        },
        {
            "number": 5,
            "box": (332, 612, 1962, 1018),
            "label_xy": (348, 625),
            "text": "节点卡片：产业链环节.名称 / 关键技术 / 关键产品 / 应用场景\n企业数=count(产业链环节_企业)",
        },
        {
            "number": 6,
            "box": (304, 1064, 1986, 1220),
            "label_xy": (335, 1080),
            "text": "代表企业行业覆盖/增长信号：企业、行业、产业链环节_企业、产业链环节_行业聚合\n建议增加统计日期与样本来源",
        },
    ],
)

print(OUT)

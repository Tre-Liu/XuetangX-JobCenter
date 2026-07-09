from __future__ import annotations

from pathlib import Path
import textwrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程")
OUT = ROOT / "outputs/industry-chain-field-map-v3"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
RED = (255, 72, 72, 255)
INK = (24, 33, 52, 255)
MUTED = (82, 96, 122, 255)
LINE = (223, 231, 245, 255)
PANEL = (255, 255, 255, 255)


def f(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size=size)


def wrap(text: str, width: int = 29) -> list[str]:
    lines: list[str] = []
    for part in text.split("\n"):
        lines.extend(textwrap.wrap(part, width=width, break_long_words=False) or [""])
    return lines


def badge(draw: ImageDraw.ImageDraw, xy: tuple[int, int], number: int) -> None:
    x, y = xy
    r = 13
    draw.ellipse((x - r, y - r, x + r, y + r), fill=RED)
    draw.text((x, y - 1), str(number), font=f(15), fill=(255, 255, 255, 255), anchor="mm")


def legend(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, entries: list[dict], columns: int = 1) -> None:
    panel_w = 610 if columns == 1 else 1030
    draw.rounded_rectangle((x, y, x + panel_w, y + 1120), radius=18, fill=PANEL, outline=LINE, width=2)
    draw.text((x + 24, y + 24), title, font=f(26), fill=INK)
    draw.text((x + 24, y + 62), "红色编号贴在页面真实字段位置；右侧为对应 v3 数据库字段。", font=f(16), fill=MUTED)
    per_col = (len(entries) + columns - 1) // columns
    col_w = (panel_w - 48) // columns
    for col in range(columns):
        xx = x + 24 + col * col_w
        yy = y + 100
        for item in entries[col * per_col:(col + 1) * per_col]:
            draw.ellipse((xx, yy + 4, xx + 24, yy + 28), fill=RED)
            draw.text((xx + 12, yy + 16), str(item["n"]), font=f(13), fill=(255, 255, 255, 255), anchor="mm")
            draw.text((xx + 34, yy), item["field"], font=f(16), fill=INK)
            yy += 23
            for line in wrap(item["db"], width=25 if columns > 1 else 32)[:2]:
                draw.text((xx + 34, yy), line, font=f(13), fill=MUTED)
                yy += 17
            yy += 7
            draw.line((xx, yy, xx + col_w - 18, yy), fill=LINE, width=1)
            yy += 9


def render(source: Path, output: Path, title: str, entries: list[dict]) -> None:
    image = Image.open(source).convert("RGBA")
    columns = 2 if len(entries) > 16 else 1
    panel_extra = 1080 if columns == 2 else 660
    canvas = Image.new("RGBA", (image.width + panel_extra, max(image.height, 1224)), (246, 249, 255, 255))
    canvas.paste(image, (0, 0))
    draw = ImageDraw.Draw(canvas)
    for item in entries:
        badge(draw, item["xy"], item["n"])
    legend(draw, image.width + 24, 30, title, entries, columns=columns)
    canvas.convert("RGB").save(output, quality=95)


def render_meaning(source: Path, output: Path, title: str, entries: list[dict], meanings: dict[int, str]) -> None:
    meaning_entries = []
    for item in entries:
        meaning = meanings.get(item["n"], item["field"])
        meaning_entries.append({
            **item,
            "field": f'{item["field"]}',
            "db": f'含义：{meaning}',
        })
    render(source, output, title, meaning_entries)


def crop_content(source: Path, output: Path, box: tuple[int, int, int, int]) -> None:
    Image.open(source).convert("RGB").crop(box).save(output, quality=95)


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    *,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    width: int,
    line_gap: int = 8,
) -> int:
    x, y = xy
    yy = y
    for line in wrap(text, width=width):
        draw.text((x, yy), line, font=font, fill=fill)
        yy += font.size + line_gap
    return yy


def render_kpi_meaning(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    crop_box = (260, 325, 1995, 500)
    crop = image.crop(crop_box)
    scale = 1.1
    crop = crop.resize((int(crop.width * scale), int(crop.height * scale)))

    canvas_w = max(crop.width + 80, 1980)
    canvas_h = 940
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (246, 249, 255, 255))
    draw = ImageDraw.Draw(canvas)

    draw.text((40, 34), "产业链图谱 KPI 指标含义说明", font=f(34), fill=INK)
    draw.text(
        (40, 82),
        "红色编号对应页面上方 4 张统计卡片；下方解释指标的业务含义和统计口径。",
        font=f(18),
        fill=MUTED,
    )

    crop_x, crop_y = 40, 130
    draw.rounded_rectangle(
        (crop_x - 12, crop_y - 12, crop_x + crop.width + 12, crop_y + crop.height + 12),
        radius=16,
        fill=(255, 255, 255, 255),
        outline=LINE,
        width=2,
    )
    canvas.paste(crop, (crop_x, crop_y))

    cards = [
        {
            "n": 1,
            "label": "关联国标行业",
            "box": (48, 50, 450, 152),
            "meaning": "本产业链能映射到的 GB/T 4754 行业分类数量。12个表示页面把上中下游环节关联到了12个国标行业，用来判断产业链覆盖广度。",
            "db": "来自 行业 + 产业链环节_行业 的去重聚合。",
        },
        {
            "n": 2,
            "label": "覆盖门类",
            "box": (468, 50, 868, 152),
            "meaning": "“门类”是 GB/T 4754 国民经济行业分类的最高层级，例如 E建筑业、C制造业、I信息传输/软件和信息技术服务业。5类表示当前产业链跨5个行业门类。",
            "db": "来自关联行业的门类字段去重计数。",
        },
        {
            "n": 3,
            "label": "核心关联行业",
            "box": (888, 50, 1288, 152),
            "meaning": "与当前专业和产业链关系最集中的行业，通常是代表企业、岗位需求、产业环节数量最密集的行业。它提示专业建设优先对接的主赛道。",
            "db": "由环节-行业、环节-企业、环节-岗位等关系聚合排序得到。",
        },
        {
            "n": 4,
            "label": "增长行业",
            "box": (1308, 50, 1710, 152),
            "meaning": "在关联行业中表现出更高增量机会的方向，例如招聘热度更高、政策支持更明显、企业活跃度更强的行业。",
            "db": "可来自招聘热度、政策热度、企业活跃度等统计快照或规则/AI判断。",
        },
    ]

    for item in cards:
        x1, y1, x2, y2 = item["box"]
        x1 = crop_x + int(x1 * scale)
        y1 = crop_y + int(y1 * scale)
        x2 = crop_x + int(x2 * scale)
        y2 = crop_y + int(y2 * scale)
        draw.rounded_rectangle((x1, y1, x2, y2), radius=10, outline=RED, width=5)
        badge(draw, (x1 + 18, y1 + 18), item["n"])

    explain_y = crop_y + crop.height + 60
    card_w = (canvas_w - 120) // 2
    card_h = 250
    for idx, item in enumerate(cards):
        col = idx % 2
        row = idx // 2
        x = 40 + col * (card_w + 40)
        y = explain_y + row * (card_h + 28)
        draw.rounded_rectangle((x, y, x + card_w, y + card_h), radius=14, fill=PANEL, outline=LINE, width=2)
        badge(draw, (x + 26, y + 32), item["n"])
        draw.text((x + 56, y + 18), item["label"], font=f(24), fill=INK)
        draw.text((x + 56, y + 56), "具体意思", font=f(16), fill=RED)
        next_y = draw_wrapped(
            draw,
            (x + 56, y + 84),
            item["meaning"],
            font=f(18),
            fill=INK,
            width=38,
            line_gap=8,
        )
        draw.text((x + 56, min(next_y + 10, y + 200)), "数据库口径", font=f(16), fill=RED)
        draw_wrapped(
            draw,
            (x + 56, min(next_y + 38, y + 226)),
            item["db"],
            font=f(15),
            fill=MUTED,
            width=42,
            line_gap=6,
        )

    canvas.convert("RGB").save(output, quality=95)


tree_entries = [
    {"n": 1, "xy": (304, 108), "field": "页面标题", "db": "页面文案；可固定，不一定入库。"},
    {"n": 2, "xy": (284, 144), "field": "页面说明", "db": "页面文案；说明产业链图谱用途。"},
    {"n": 3, "xy": (1742, 104), "field": "当前产业链标签", "db": "页面状态字段；用于提示当前选择。"},
    {"n": 4, "xy": (1846, 106), "field": "当前产业链名称", "db": "产业链.名称；当前专业上下文来自专业-产业链关联。"},
    {"n": 5, "xy": (358, 260), "field": "AI研判标题", "db": "产业链.发展分析标题；AI生成需保存生成来源/审核状态。"},
    {"n": 6, "xy": (438, 196), "field": "AI研判要点", "db": "产业链.介绍 / 发展分析；可按段落存储。"},
    {"n": 7, "xy": (318, 333), "field": "图谱区标题", "db": "页面区块标题；固定文案。"},
    {"n": 8, "xy": (302, 356), "field": "图谱区说明", "db": "页面区块说明；固定文案。"},
    {"n": 9, "xy": (1870, 344), "field": "视图切换", "db": "前端状态 industryChainViewMode；非业务入库字段。"},
    {"n": 10, "xy": (316, 404), "field": "KPI名称", "db": "行业统计指标.名称；或统计快照.metric_name。"},
    {"n": 11, "xy": (322, 426), "field": "KPI值", "db": "统计快照.metric_value；由行业与环节关联聚合。"},
    {"n": 12, "xy": (318, 446), "field": "KPI说明", "db": "统计快照.metric_note / 统计口径。"},
    {"n": 13, "xy": (322, 468), "field": "查看详情入口", "db": "交互入口；打开指标详情，不是业务字段。"},
    {"n": 14, "xy": (340, 544), "field": "阶段名称", "db": "产业链环节.阶段_ps上中下游。"},
    {"n": 15, "xy": (326, 572), "field": "阶段说明", "db": "产业链环节.介绍 / 分类。"},
    {"n": 16, "xy": (468, 542), "field": "阶段环节数/企业数", "db": "count(产业链环节) + count(产业链环节_企业)。"},
    {"n": 17, "xy": (622, 540), "field": "阶段关联国标行业", "db": "行业.名称；关联表：产业链环节_行业。"},
    {"n": 18, "xy": (418, 632), "field": "产业环节名称", "db": "产业链环节.名称。"},
    {"n": 19, "xy": (420, 652), "field": "代表企业数", "db": "count(产业链环节_企业)；也可存入统计快照。"},
    {"n": 20, "xy": (430, 676), "field": "技术/产品/服务标签", "db": "产业链环节.关键技术 / 关键产品 / 应用场景。"},
    {"n": 21, "xy": (320, 1088), "field": "国标行业关联分析标题", "db": "页面区块标题；下方为统计聚合结果。"},
    {"n": 22, "xy": (320, 1122), "field": "代表企业行业覆盖标题", "db": "统计快照.dimension=enterprise_coverage。"},
    {"n": 23, "xy": (326, 1152), "field": "覆盖行业门类", "db": "行业.门类 / 行业.名称。"},
    {"n": 24, "xy": (326, 1172), "field": "细分行业代码/名称", "db": "行业.代码 / 行业.名称。"},
    {"n": 25, "xy": (332, 1198), "field": "覆盖占比进度条", "db": "统计快照.metric_value；建议保存统计日期和样本来源。"},
    {"n": 26, "xy": (1228, 1122), "field": "行业增长信号标题", "db": "统计快照.dimension=growth_signal。"},
    {"n": 27, "xy": (1230, 1154), "field": "增长行业代码/名称", "db": "行业.代码 / 行业.名称。"},
    {"n": 28, "xy": (1230, 1184), "field": "招聘/政策/企业活跃度标签", "db": "统计快照.recruitment_heat / policy_heat / enterprise_activity。"},
]

tree_meanings = {
    1: "告诉用户当前看的页面是产业链图谱。",
    2: "说明本页面用于梳理产业链上下游和专业对接入口。",
    3: "提示右侧按钮组是当前产业链选择区。",
    4: "展示当前选中的产业链名称，决定本页图谱数据范围。",
    5: "AI研判模块的标题，概括下方分析主题。",
    6: "AI生成的产业链结构、岗位需求和建设建议要点。",
    7: "产业链结构图谱模块标题。",
    8: "说明图谱以矩形树图展示上中下游和节点。",
    9: "切换矩形树图或桑基图的前端交互按钮。",
    10: "国标行业统计卡片的名称，如关联国标行业、覆盖门类。",
    11: "该指标的统计值；覆盖门类5类=覆盖5个国民经济行业门类。",
    12: "解释统计口径；门类指GB/T4754最高层级行业大类组。",
    13: "打开指标详情弹窗的交互入口。",
    14: "产业链阶段分组，即上游、中游、下游。",
    15: "解释该阶段在产业链中的功能定位。",
    16: "该阶段包含多少产业环节和代表企业。",
    17: "该阶段映射到的GB/T4754行业，如制造业、信息服务业。",
    18: "具体产业环节或产业节点名称。",
    19: "该产业环节下关联的代表企业数量。",
    20: "该产业环节对应的技术、产品或服务关键词。",
    21: "国标行业关联分析模块标题。",
    22: "统计代表企业样本主要分布在哪些国民经济行业。",
    23: "行业门类，如E建筑业、I信息传输/软件服务业。",
    24: "门类下的细分行业代码和名称，如47房屋建筑业。",
    25: "该行业在代表企业样本中的占比/权重进度条。",
    26: "行业增长信号模块标题。",
    27: "增长行业=招聘、政策、企业活跃度更高的行业方向。",
    28: "判断增长的依据标签：招聘热、政策热、企业活跃。",
}

sankey_entries = [
    {"n": 1, "xy": (304, 108), "field": "页面标题", "db": "页面文案；固定。"},
    {"n": 2, "xy": (1685, 106), "field": "当前产业链名称", "db": "产业链.名称。"},
    {"n": 3, "xy": (320, 196), "field": "AI研判标题", "db": "产业链.发展分析标题。"},
    {"n": 4, "xy": (300, 226), "field": "AI研判要点", "db": "产业链.介绍 / 发展分析。"},
    {"n": 5, "xy": (316, 354), "field": "桑基图区标题", "db": "页面区块标题。"},
    {"n": 6, "xy": (760, 408), "field": "阶段图例", "db": "产业链环节.阶段_ps上中下游 + 阶段说明。"},
    {"n": 7, "xy": (338, 454), "field": "阶段统计", "db": "count(产业链环节) + count(产业链环节_企业)。"},
    {"n": 8, "xy": (516, 622), "field": "节点名称", "db": "产业链环节.名称。"},
    {"n": 9, "xy": (518, 646), "field": "代表企业数", "db": "count(产业链环节_企业)。"},
    {"n": 10, "xy": (520, 668), "field": "节点技术标签", "db": "产业链环节.关键技术 / 关键产品 / 应用场景。"},
    {"n": 11, "xy": (825, 705), "field": "桑基流向线", "db": "建议新增：产业链环节关系.source环节id / target环节id / value / 关系类型。"},
    {"n": 12, "xy": (1074, 548), "field": "阶段列标题", "db": "产业链环节.阶段_ps上中下游。"},
]

sankey_meanings = {
    1: "当前页面标题。",
    2: "当前桑基图展示的产业链名称。",
    3: "AI研判模块标题。",
    4: "AI生成的产业链结构分析要点。",
    5: "桑基图模块标题。",
    6: "上游、中游、下游阶段图例。",
    7: "各阶段产业环节数和代表企业数。",
    8: "桑基图节点对应的产业环节名称。",
    9: "节点关联的代表企业数量。",
    10: "节点对应的关键技术、产品或应用场景。",
    11: "不同产业环节之间的流向和关联强度。",
    12: "桑基图每一列的阶段标题。",
}

lower_entries = [
    {"n": 1, "xy": (320, 480), "field": "洞察卡片标题", "db": "产业链洞察.标题；也可映射到产业链.发展分析分段标题。"},
    {"n": 2, "xy": (315, 506), "field": "洞察卡片正文", "db": "产业链洞察.内容；AI生成需记录依据和审核状态。"},
    {"n": 3, "xy": (743, 480), "field": "建设切入点标题", "db": "产业链环节.发展建议 或 产业链洞察.标题。"},
    {"n": 4, "xy": (742, 506), "field": "建设切入点正文", "db": "产业链环节.发展建议；可由AI生成后人工审核。"},
    {"n": 5, "xy": (1158, 480), "field": "企业反馈标题", "db": "产业链洞察.标题 / 企业反馈摘要。"},
    {"n": 6, "xy": (1156, 506), "field": "企业反馈正文", "db": "企业调研反馈.内容；也可落为产业链.发展分析。"},
    {"n": 7, "xy": (306, 626), "field": "代表企业区标题", "db": "页面区块标题；下方数据来自企业及关联表。"},
    {"n": 8, "xy": (804, 632), "field": "代表企业归类口径", "db": "产业链环节_企业；按产业链环节分组。"},
    {"n": 9, "xy": (312, 684), "field": "企业分组名称", "db": "产业链环节.阶段_ps上中下游。"},
    {"n": 10, "xy": (328, 724), "field": "企业名称", "db": "企业.企业名称。"},
    {"n": 11, "xy": (382, 724), "field": "企业能力/产品说明", "db": "企业.主营产品 / 核心技术 / 供应链关系。"},
    {"n": 12, "xy": (962, 626), "field": "核心岗位区标题", "db": "页面区块标题；下方数据来自岗位及关联表。"},
    {"n": 13, "xy": (1392, 632), "field": "核心岗位拆分口径", "db": "产业链环节_岗位；按上下游能力需求拆分。"},
    {"n": 14, "xy": (962, 684), "field": "岗位分组名称", "db": "产业链环节.阶段_ps上中下游。"},
    {"n": 15, "xy": (978, 724), "field": "岗位名称", "db": "岗位.名称。"},
    {"n": 16, "xy": (306, 1240), "field": "建设建议区标题", "db": "页面区块标题；建议数据可关联产业链或环节。"},
    {"n": 17, "xy": (1412, 1240), "field": "建设建议服务对象", "db": "产业链建设建议.适用场景 / 服务对象。"},
    {"n": 18, "xy": (326, 1310), "field": "建议序号", "db": "产业链建设建议.排序号。"},
    {"n": 19, "xy": (356, 1308), "field": "建议标题", "db": "产业链建设建议.标题。"},
    {"n": 20, "xy": (356, 1348), "field": "建议内容", "db": "产业链建设建议.内容；可回写到产业链环节.发展建议。"},
]

lower_meanings = {
    1: "产业链洞察卡片的标题。",
    2: "对产业链价值流的判断正文。",
    3: "专业建设切入点卡片标题。",
    4: "说明专业建设应优先切入哪些产业环节。",
    5: "企业反馈卡片标题。",
    6: "总结企业对学生能力和项目实践的反馈。",
    7: "代表企业列表模块标题。",
    8: "说明企业按产业链环节分组展示。",
    9: "企业所属上游、中游、下游分组。",
    10: "代表企业名称。",
    11: "企业可提供的产品、技术或服务能力。",
    12: "核心岗位列表模块标题。",
    13: "说明岗位按上下游能力需求拆分。",
    14: "岗位所属上游、中游、下游分组。",
    15: "具体岗位名称。",
    16: "产业链建设建议模块标题。",
    17: "说明建议服务于岗位画像与实训项目设计。",
    18: "建议排序编号。",
    19: "建议主题标题。",
    20: "建议的具体建设动作或课程实训方向。",
}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    render(
        ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png",
        OUT / "产业链图谱-全字段映射_矩形树图_v3.png",
        "产业链图谱全字段映射 - 矩形树图",
        tree_entries,
    )
    render_meaning(
        ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png",
        OUT / "产业链图谱-编号含义说明_矩形树图_v3.png",
        "产业链图谱编号含义说明 - 矩形树图",
        tree_entries,
        tree_meanings,
    )
    render_kpi_meaning(
        ROOT / "outputs/industry-layout-source-table/screenshots/fig3-industry-chain-lower-lists.png",
        OUT / "产业链图谱-KPI指标含义说明_v3.png",
    )
    render(
        ROOT / "major-construction-platform/outputs/prd/current-demo-screenshots/01-industry-chain.png",
        OUT / "产业链图谱-全字段映射_桑基图_v3.png",
        "产业链图谱全字段映射 - 桑基图",
        sankey_entries,
    )
    render_meaning(
        ROOT / "major-construction-platform/outputs/prd/current-demo-screenshots/01-industry-chain.png",
        OUT / "产业链图谱-编号含义说明_桑基图_v3.png",
        "产业链图谱编号含义说明 - 桑基图",
        sankey_entries,
        sankey_meanings,
    )
    render(
        OUT / "产业链图谱-完整页-下半段.png",
        OUT / "产业链图谱-全字段映射_下半段_v3.png",
        "产业链图谱全字段映射 - 下半段",
        lower_entries,
    )
    crop_content(
        OUT / "产业链图谱-全字段映射_下半段_v3.png",
        OUT / "产业链图谱-全字段映射_下半段内容区_v3.png",
        (190, 340, 2680, 1450),
    )
    render_meaning(
        OUT / "产业链图谱-完整页-下半段.png",
        OUT / "产业链图谱-编号含义说明_下半段_v3.png",
        "产业链图谱编号含义说明 - 下半段",
        lower_entries,
        lower_meanings,
    )
    crop_content(
        OUT / "产业链图谱-编号含义说明_下半段_v3.png",
        OUT / "产业链图谱-编号含义说明_下半段内容区_v3.png",
        (190, 340, 2680, 1450),
    )
    print(OUT)

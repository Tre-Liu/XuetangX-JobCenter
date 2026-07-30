from __future__ import annotations

import html
import os
import re
import shutil
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
SOURCE_HTML = ROOT / "国务院关于印发《教育发展“十五五”规划》的通知（国发〔2026〕19号）-中国政府网原文.html"
OUTPUT = ROOT / "国务院关于印发《教育发展“十五五”规划》的通知（国发〔2026〕19号）-中国政府网公开版.pdf"
ASSET_DIR = ROOT / "tmp" / "pdfs" / "education_15_5_assets"
SOURCE_URL = "https://www.gov.cn/zhengce/content/202606/content_7073640.htm"
CHINESE_FONT = "/System/Library/Fonts/Supplemental/Songti.ttc"
FONT_NAME = "Songti"


class ContentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.items: list[dict] = []
        self.in_p = False
        self.parts: list[str] = []
        self.style = ""
        self.bold = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        if tag == "p":
            self.in_p = True
            self.parts = []
            self.style = attr.get("style", "")
            self.bold = False
        elif tag == "strong" and self.in_p:
            self.bold = True
        elif tag == "br" and self.in_p:
            self.parts.append(" ")
        elif tag == "img" and self.in_p:
            src = attr.get("src")
            if src:
                self.items.append({"kind": "image", "src": src})

    def handle_endtag(self, tag: str) -> None:
        if tag == "strong":
            self.bold = False
        elif tag == "p" and self.in_p:
            text = " ".join("".join(self.parts).split())
            if text and text.strip("。．、，；： "):
                self.items.append({"kind": "paragraph", "text": text, "style": self.style, "bold": self.bold})
            self.in_p = False

    def handle_data(self, data: str) -> None:
        if self.in_p:
            self.parts.append(data)


def get_items() -> list[dict]:
    raw = SOURCE_HTML.read_text(encoding="utf-8")
    match = re.search(r'<div class="trs_editor_view.*?">(.*?)</div>\s*</div>', raw, flags=re.S)
    if not match:
        raise RuntimeError("未在下载的中国政府网页中定位到正文内容。")
    parser = ContentParser()
    parser.feed(match.group(1))
    return parser.items


def download_image(relative_url: str, number: int) -> Path | None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    remote = urljoin(SOURCE_URL, relative_url)
    suffix = Path(relative_url).suffix or ".jpg"
    target = ASSET_DIR / f"column-{number:02d}{suffix}"
    if not target.exists():
        try:
            request = urllib.request.Request(remote, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request, timeout=30) as response, target.open("wb") as stream:
                shutil.copyfileobj(response, stream)
        except Exception as error:
            print(f"跳过无法获取的图片 {remote}: {error}")
            return None
    return target


def paragraph_kind(item: dict) -> str:
    text = item["text"]
    style = item.get("style", "")
    if "font-size: 24px" in style:
        return "title"
    if item.get("bold") or re.match(r"^[一二三四五六七八九十]+、", text):
        return "section"
    if "text-align: right" in style:
        return "right"
    if "text-align: center" in style:
        return "center"
    if re.match(r"^（[一二三四五六七八九十]+）", text):
        return "subsection"
    return "body"


def footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9D9D9"))
    canvas.line(2.15 * cm, 1.55 * cm, A4[0] - 2.15 * cm, 1.55 * cm)
    canvas.setFont(FONT_NAME, 8)
    canvas.setFillColor(colors.HexColor("#777777"))
    canvas.drawString(2.15 * cm, 1.05 * cm, "来源：中国政府网公开版（本文有删减）")
    canvas.drawRightString(A4[0] - 2.15 * cm, 1.05 * cm, f"第 {doc.page} 页")
    canvas.restoreState()


def build() -> None:
    pdfmetrics.registerFont(TTFont(FONT_NAME, CHINESE_FONT, subfontIndex=0))
    styles = getSampleStyleSheet()
    base = dict(fontName=FONT_NAME, textColor=colors.HexColor("#222222"))
    body = ParagraphStyle("BodyCN", parent=styles["BodyText"], **base, fontSize=11.3, leading=20, alignment=TA_JUSTIFY, firstLineIndent=22.6, spaceAfter=8)
    title = ParagraphStyle("TitleCN", parent=styles["Title"], **base, fontSize=19, leading=28, alignment=TA_CENTER, spaceAfter=10)
    section = ParagraphStyle("SectionCN", parent=body, fontSize=14, leading=23, firstLineIndent=0, spaceBefore=10, spaceAfter=7)
    subsection = ParagraphStyle("SubsectionCN", parent=body, fontSize=12, leading=21, firstLineIndent=0, spaceBefore=6, spaceAfter=5)
    center = ParagraphStyle("CenterCN", parent=body, alignment=TA_CENTER, firstLineIndent=0)
    right = ParagraphStyle("RightCN", parent=body, alignment=TA_RIGHT, firstLineIndent=0)
    note = ParagraphStyle("NoteCN", parent=body, textColor=colors.HexColor("#666666"), firstLineIndent=0, alignment=TA_CENTER)
    mapping = {"title": title, "section": section, "subsection": subsection, "center": center, "right": right, "body": body}

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=2.15 * cm, rightMargin=2.15 * cm, topMargin=2.05 * cm, bottomMargin=2.15 * cm, title="教育发展“十五五”规划", author="中国政府网")
    story = []
    image_number = 0
    for item in get_items():
        if item["kind"] == "image":
            image_number += 1
            image_path = download_image(item["src"], image_number)
            if image_path:
                try:
                    image = Image(str(image_path))
                    image._restrictSize(15.8 * cm, 20.5 * cm)
                    story.extend([Spacer(1, 5), image, Spacer(1, 9)])
                except Exception as error:
                    print(f"跳过无法嵌入的图片 {image_path}: {error}")
            continue
        kind = paragraph_kind(item)
        text = html.escape(item["text"])
        if text == "（本文有删减）":
            story.append(Paragraph(text, note))
        else:
            story.append(Paragraph(text, mapping[kind]))

    story.extend([Spacer(1, 14), Paragraph("正式来源：https://www.gov.cn/zhengce/content/202606/content_7073640.htm", note)])
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()

import json
import shutil
import tempfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

base = Path("/Users/liuhongzhe/Documents/专业建设/outputs/a_share_credit_code_enrichment")
xlsx_path = base / "中国A股上市公司清单_补充统一社会信用代码.xlsx"
data_path = base / "credit_codes.json"

NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ET.register_namespace("", NS["main"])

codes = {item["rowNumber"]: item.get("creditCode") or "" for item in json.loads(data_path.read_text("utf-8"))}
codes[1] = "统一社会信用代码"

tmp_dir = Path(tempfile.mkdtemp(prefix="xlsx-inline-"))
unzipped = tmp_dir / "xlsx"
with zipfile.ZipFile(xlsx_path, "r") as zf:
    zf.extractall(unzipped)

sheet_path = unzipped / "xl" / "worksheets" / "sheet1.xml"
tree = ET.parse(sheet_path)
root = tree.getroot()
sheet_data = root.find("main:sheetData", NS)
dimension = root.find("main:dimension", NS)
if dimension is not None:
    dimension.set("ref", "A1:K5191")

def cell_col(cell_ref: str) -> str:
    return "".join(ch for ch in cell_ref if ch.isalpha())

def make_text_cell(row_number: int, value: str, style: str | None) -> ET.Element:
    cell = ET.Element(f"{{{NS['main']}}}c", {"r": f"K{row_number}", "t": "inlineStr"})
    if style:
        cell.set("s", style)
    inline = ET.SubElement(cell, f"{{{NS['main']}}}is")
    text = ET.SubElement(inline, f"{{{NS['main']}}}t")
    text.text = value
    return cell

for row in sheet_data.findall("main:row", NS):
    row_number = int(row.get("r"))
    if row_number not in codes:
        continue
    value = codes[row_number]
    cells = list(row)
    existing = None
    existing_index = len(cells)
    for index, cell in enumerate(cells):
        ref = cell.get("r", "")
        if ref == f"K{row_number}":
            existing = cell
            existing_index = index
            break
        if cell_col(ref) > "K" and existing_index == len(cells):
            existing_index = index
    style = existing.get("s") if existing is not None else None
    if existing is not None:
        row.remove(existing)
    if value:
        row.insert(existing_index, make_text_cell(row_number, value, style))

styles_path = unzipped / "xl" / "styles.xml"
styles_tree = ET.parse(styles_path)
styles_root = styles_tree.getroot()
cell_xfs = styles_root.find("main:cellXfs", NS)
text_style_index = None
if cell_xfs is not None:
    for index, xf in enumerate(cell_xfs.findall("main:xf", NS)):
        if xf.get("numFmtId") == "49" and xf.get("quotePrefix") == "1":
            text_style_index = str(index)
            break
    if text_style_index is None:
        xf = ET.Element(
            f"{{{NS['main']}}}xf",
            {
                "numFmtId": "49",
                "fontId": "0",
                "fillId": "0",
                "borderId": "0",
                "xfId": "0",
                "applyNumberFormat": "1",
                "quotePrefix": "1",
                "applyAlignment": "1",
            },
        )
        ET.SubElement(xf, f"{{{NS['main']}}}alignment", {"horizontal": "left"})
        cell_xfs.append(xf)
        cell_xfs.set("count", str(len(cell_xfs.findall("main:xf", NS))))
        text_style_index = str(len(cell_xfs.findall("main:xf", NS)) - 1)
    for row in sheet_data.findall("main:row", NS):
        row_number = int(row.get("r"))
        if row_number < 2:
            continue
        cell = row.find(f"main:c[@r='K{row_number}']", NS)
        if cell is not None:
            cell.set("s", text_style_index)

styles_tree.write(styles_path, encoding="utf-8", xml_declaration=True)

tree.write(sheet_path, encoding="utf-8", xml_declaration=True)

fixed_path = base / "中国A股上市公司清单_补充统一社会信用代码.xlsx"
backup_path = base / "中国A股上市公司清单_补充统一社会信用代码.before-inline-fix.xlsx"
if not backup_path.exists():
    shutil.copy2(xlsx_path, backup_path)

with zipfile.ZipFile(fixed_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for path in unzipped.rglob("*"):
        if path.is_file():
            zf.write(path, path.relative_to(unzipped).as_posix())

shutil.rmtree(tmp_dir)
print(fixed_path)

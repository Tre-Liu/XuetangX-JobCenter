from pathlib import Path
import pdfplumber

source = Path("/Users/liuhongzhe/Desktop/重大-专业培养方案示例-2022级电气工程及其自动化本科培养方案.pdf")
output = Path("tmp/pdfs/重大电气2022/培养方案.txt")

parts = []
with pdfplumber.open(source) as pdf:
    for index, page in enumerate(pdf.pages, start=1):
        parts.append(f"\n===== PDF PAGE {index} =====\n")
        parts.append(page.extract_text(x_tolerance=2, y_tolerance=3, layout=True) or "[NO TEXT]")
output.write_text("\n".join(parts), encoding="utf-8")
print(f"wrote {output} with {len(parts)//2} pages")

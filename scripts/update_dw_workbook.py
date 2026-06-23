from __future__ import annotations

from copy import copy
from pathlib import Path
import shutil

import openpyxl


SOURCE_XLSX = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/V1.0需求（2026.6.11）/官方数据/【DW】专业建设数据模型设计.xlsx")
OUT_DIR = Path("output/dw-er")
UPDATED_XLSX = OUT_DIR / "DW_专业建设数据模型设计_岗位所属行业更新.xlsx"


JOB_FIELDS = [
    [
        "industry_code",
        "所属行业代码",
        "string",
        "是",
        "FK",
        "岗位所属行业代码，按岗位归属行业映射到国民经济行业分类。",
        "I65",
        "行业库/招聘归并/人工维护",
        "按批次",
        "关联02_行业库",
    ],
    [
        "industry_name",
        "所属行业名称",
        "string",
        "否",
        "IDX",
        "岗位所属行业展示名称，冗余自行业库用于页面展示和筛选。",
        "软件和信息技术服务业",
        "行业库/规则映射",
        "按批次",
        "冗余展示字段",
    ],
]

RELATION_ROW = [
    "rel_job_industry",
    "岗位",
    "行业",
    "N:1",
    "industry_code",
    "岗位按国民经济行业分类归属行业，用于行业维度筛选、统计和趋势分析。",
]


def copy_style(src, dst) -> None:
    if src.has_style:
        dst._style = copy(src._style)
    if src.number_format:
        dst.number_format = src.number_format
    if src.font:
        dst.font = copy(src.font)
    if src.fill:
        dst.fill = copy(src.fill)
    if src.border:
        dst.border = copy(src.border)
    if src.alignment:
        dst.alignment = copy(src.alignment)
    if src.protection:
        dst.protection = copy(src.protection)


def ensure_job_fields(ws) -> None:
    existing = {ws.cell(row=row, column=1).value: row for row in range(2, ws.max_row + 1)}
    if all(field[0] in existing for field in JOB_FIELDS):
        return

    chain_row = existing.get("chain_id")
    insert_at = (chain_row + 1) if chain_row else ws.max_row + 1
    rows_to_add = [field for field in JOB_FIELDS if field[0] not in existing]
    ws.insert_rows(insert_at, amount=len(rows_to_add))

    template_row = max(2, insert_at - 1)
    for offset, values in enumerate(rows_to_add):
        row_idx = insert_at + offset
        for col_idx, value in enumerate(values, start=1):
            cell = ws.cell(row=row_idx, column=col_idx)
            copy_style(ws.cell(row=template_row, column=col_idx), cell)
            cell.value = value


def ensure_relation(ws) -> None:
    existing = {ws.cell(row=row, column=1).value for row in range(2, ws.max_row + 1)}
    if RELATION_ROW[0] in existing:
        return
    row_idx = ws.max_row + 1
    template_row = max(2, row_idx - 1)
    for col_idx, value in enumerate(RELATION_ROW, start=1):
        cell = ws.cell(row=row_idx, column=col_idx)
        copy_style(ws.cell(row=template_row, column=col_idx), cell)
        cell.value = value


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_XLSX, UPDATED_XLSX)
    wb = openpyxl.load_workbook(UPDATED_XLSX)
    ensure_job_fields(wb["06_岗位库"])
    ensure_relation(wb["18_关联关系"])
    wb.save(UPDATED_XLSX)
    print(f"Wrote {UPDATED_XLSX}")


if __name__ == "__main__":
    main()

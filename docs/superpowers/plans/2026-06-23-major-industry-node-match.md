# Major Industry Node Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a DW object that explicitly relates majors to industry nodes and regenerate the relationship graph.

**Architecture:** Extend the existing workbook update script so the derived DW workbook owns the new `04B_专业产业环节匹配库` sheet and its rows in `18_关联关系`. Extend the ER generator mapping and verification script so the HTML/JSON graph shows `专业 -> 专业产业环节匹配 -> 产业环节`.

**Tech Stack:** Python 3, openpyxl, existing DW workbook and SVG/HTML generator.

## Global Constraints

- Preserve the existing generated workbook pattern and do not refactor unrelated DW objects.
- Keep the new relationship evidence-bearing, with score, reason, tags, source batch, and update timestamp.
- Verify the Excel workbook, JSON schema, coverage file, and HTML graph after regeneration.
- Do not touch unrelated dirty worktree changes.

---

### Task 1: Verification First

**Files:**
- Modify: `scripts/verify_dw_industry_node_relation.py`

**Interfaces:**
- Consumes: `V1.0需求（2026.6.11）/官方数据/DW_专业建设数据模型设计_岗位所属行业更新.xlsx`
- Produces: a failing verification when `04B_专业产业环节匹配库`, `rel_major_node_match_major`, or `rel_major_node_match_node` is missing.

- [ ] **Step 1: Add expected sheet, fields, and relation checks**

Update the script to check:

```python
MATCH_SHEET = "04B_专业产业环节匹配库"
EXPECTED_MATCH_FIELDS = {
    "match_id",
    "major_id",
    "major_code",
    "industry_node_id",
    "chain_id",
    "match_score",
    "match_reason",
    "evidence_tags",
    "is_primary_node",
    "source_batch_id",
    "updated_at",
}
EXPECTED_RELATIONS = {
    "rel_node_relation_source",
    "rel_node_relation_target",
    "rel_major_node_match_major",
    "rel_major_node_match_node",
}
```

- [ ] **Step 2: Run verification and confirm RED**

Run: `python3 scripts/verify_dw_industry_node_relation.py`

Expected: `FAIL: missing sheet: 04B_专业产业环节匹配库`

### Task 2: Workbook Generator

**Files:**
- Modify: `scripts/update_dw_workbook.py`

**Interfaces:**
- Consumes: source workbook `V1.0需求（2026.6.11）/官方数据/【DW】专业建设数据模型设计.xlsx`
- Produces: updated workbook at `V1.0需求（2026.6.11）/官方数据/DW_专业建设数据模型设计_岗位所属行业更新.xlsx`

- [ ] **Step 1: Add `04B_专业产业环节匹配库` rows**

Create the sheet after `04A_产业环节关系库` with field rows for `match_id`, `major_id`, `major_code`, `industry_node_id`, `chain_id`, `match_score`, `match_reason`, `evidence_tags`, `is_primary_node`, `source_batch_id`, and `updated_at`.

- [ ] **Step 2: Add relation rows**

Append these rows to `18_关联关系` if absent:

```python
[
    "rel_major_node_match_major",
    "专业",
    "专业产业环节匹配",
    "1:N",
    "major_id -> major_id",
    "专业可匹配多个产业环节，匹配库沉淀匹配分、依据和是否重点环节。",
]
[
    "rel_major_node_match_node",
    "专业产业环节匹配",
    "产业环节",
    "N:1",
    "industry_node_id -> industry_node_id",
    "专业产业环节匹配记录指向具体产业环节，用于按专业查看重点产业节点。",
]
```

- [ ] **Step 3: Generate workbook**

Run: `python3 scripts/update_dw_workbook.py`

Expected: writes `V1.0需求（2026.6.11）/官方数据/DW_专业建设数据模型设计_岗位所属行业更新.xlsx`

### Task 3: ER Mapping And Output

**Files:**
- Modify: `scripts/build_dw_er.py`
- Generated: `output/dw-er/dw_schema.json`
- Generated: `output/dw-er/dw_er.html`
- Generated: `output/dw-er/coverage.md`

**Interfaces:**
- Consumes: the updated workbook from Task 2.
- Produces: ER graph containing the new object and two relationships.

- [ ] **Step 1: Register the new sheet**

Add `04B_专业产业环节匹配库` to `SHEET_TO_OBJECT` with key `major_industry_node_match` and label `专业产业环节匹配`.

- [ ] **Step 2: Place the new node**

Add a position between `major` and `industry_node`, leaving existing nodes readable.

- [ ] **Step 3: Add field overrides**

Ensure the two new relation rows bind `major_id -> major_id` and `industry_node_id -> industry_node_id`.

- [ ] **Step 4: Generate ER outputs**

Run: `python3 scripts/build_dw_er.py`

Expected: writes `output/dw-er/dw_er.html`, `output/dw-er/dw_schema.json`, and `output/dw-er/coverage.md`.

### Task 4: GREEN Verification

**Files:**
- Test: `scripts/verify_dw_industry_node_relation.py`
- Read: `output/dw-er/dw_schema.json`
- Read: `output/dw-er/coverage.md`
- Read: `output/dw-er/dw_er.html`

**Interfaces:**
- Consumes: generated workbook and ER outputs.
- Produces: passing verification and grep evidence.

- [ ] **Step 1: Run verification**

Run: `python3 scripts/verify_dw_industry_node_relation.py`

Expected: `PASS: industry node relation DW model is present`

- [ ] **Step 2: Check generated outputs**

Run: `rg -n "专业产业环节匹配|rel_major_node_match|major_industry_node_match" output/dw-er V1.0需求（2026.6.11）/官方数据`

Expected: matching lines in JSON, HTML, coverage, and workbook inspection output if present.

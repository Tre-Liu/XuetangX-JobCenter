# Enterprise Name Cleaning Workbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `产业链企业名称数据清洗规则.md` to all enterprise primary workbooks and produce a traceable Excel of every flagged enterprise with its proposed handling result.

**Architecture:** A tested Python analysis module performs read-only streaming extraction from the source `.xlsx` files, normalizes and classifies records, and emits compact JSON evidence. A JavaScript builder using `@oai/artifact-tool` turns that evidence into a formatted workbook with summary, detail, conflict, and rule sheets.

**Tech Stack:** Bundled Python 3 standard library, Node.js, `@oai/artifact-tool`, Excel `.xlsx` source files.

## Global Constraints

- Never modify source workbooks.
- Treat the unified social credit code as the preferred entity key.
- Preserve original name and source file/sheet/row.
- Keep strong invalid, inactive, cleaned, and review outcomes distinct.
- Use artifact-tool for final workbook authoring and verification.

---

### Task 1: Rule engine

**Files:**
- Create: `.tmp/enterprise-name-audit/enterprise_cleaning.py`
- Test: `.tmp/enterprise-name-audit/test_enterprise_cleaning.py`

**Interfaces:**
- Consumes: raw name, credit code, registration status.
- Produces: `classify_record(name, credit, status)` returning cleaned fields, reason codes, severity, and action.

- [ ] Write literal test cases for placeholders, credit-code names, judicial notices, former-name extraction, inactive status, unknown status, and valid numeric brands.
- [ ] Run the tests and verify they fail because the module does not exist.
- [ ] Implement the minimal classification functions.
- [ ] Run the tests and verify all rule-engine tests pass.

### Task 2: Source extraction and entity aggregation

**Files:**
- Modify: `.tmp/enterprise-name-audit/enterprise_cleaning.py`
- Modify: `.tmp/enterprise-name-audit/test_enterprise_cleaning.py`

**Interfaces:**
- Consumes: primary workbooks under `/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据/`.
- Produces: `enterprise-cleaning-results.json` with entity-level issue rows, conflict rows, category counts, and audit totals.

- [ ] Add a fixture-level test proving duplicate source rows with the same credit code merge into one entity while retaining source count.
- [ ] Verify the new aggregation test fails.
- [ ] Implement streaming extraction, source tracing, issue aggregation, conflict detection, and outcome precedence.
- [ ] Run unit tests and a targeted scan of the wind-power workbook.
- [ ] Verify credit code `91440300053864005T` is classified as `QUARANTINE` with source row 4171.

### Task 3: Full scan

**Files:**
- Create: `.tmp/enterprise-name-audit/enterprise-cleaning-results.json`

**Interfaces:**
- Consumes: Task 2 analysis module.
- Produces: complete issue and summary evidence for workbook generation.

- [ ] Scan every source workbook but exclude honor/qualification workbooks from primary entity counts.
- [ ] Reconcile workbook count, input row count, unique entity count, issue-row count, and action counts.
- [ ] Verify every issue row has an action, reason code, severity, and source location.

### Task 4: Excel workbook

**Files:**
- Create: `.tmp/enterprise-name-audit/build_cleaning_workbook.mjs`
- Create: `outputs/enterprise-name-cleaning/产业链企业名称清洗处理结果.xlsx`

**Interfaces:**
- Consumes: `enterprise-cleaning-results.json` and the approved Markdown cleaning rule.
- Produces: a standalone `.xlsx` with `处理汇总`, `异常企业明细`, `名称冲突`, and `规则说明` sheets.

- [ ] Build all four sheets with explicit headers, filters, frozen panes, text formatting for identifiers, and action/severity color cues.
- [ ] Add visible summary totals and category/action tables.
- [ ] Export the workbook with artifact-tool.

### Task 5: Verification

**Files:**
- Verify: `outputs/enterprise-name-cleaning/产业链企业名称清洗处理结果.xlsx`

**Interfaces:**
- Consumes: Task 4 workbook.
- Produces: verified final artifact.

- [ ] Inspect summary and representative detail ranges.
- [ ] Scan formulas for Excel errors.
- [ ] Render every worksheet at least once and inspect the previews.
- [ ] Reconcile workbook row counts against the JSON evidence.
- [ ] Confirm the target judicial-invalid record appears once at entity grain with all source references retained.

# 人培文件真实文件名修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将新双高人培目录中的 UUID、哈希和通用虚拟附件名恢复为官网公开的真实附件名；官网没有公开附件名时，按“学校-专业群-专业.pdf”命名，并同步来源清单与交付工作簿。

**Architecture:** 以 `_catalog/manifest.csv` 为唯一记录入口，先识别机器名，再从官网 HTML 的 `sudyfile-attr`、匹配下载链接的锚文本和候选清单 `link_text` 中恢复真实文件名。修复程序输出逐条映射清单，执行安全重命名并更新 manifest；随后按新路径更新人培抽取 JSON，使用原有 Artifact Tool 构建脚本重新生成两份含来源字段的工作簿。

**Tech Stack:** Python 3.12 标准库、unittest、CSV/JSON、Artifact Tool 2.8.6、Node.js。

**Spec:** 用户请求（2026-09-03）：优先真实文件名；没有文件名时使用“学校-专业群-专业”命名。

## Global Constraints

- 不改变 PDF 内容、SHA-256、来源 URL、来源页、页码或抽取内容。
- 不覆盖已存在的不同文件；目标冲突必须中止。
- 工作簿只刷新来源文件名和来源路径相关值，保持原有工作表、表头、行数和样式。
- 原始 manifest 在执行前保留带日期的备份；改名映射清单可用于反向恢复。
- AI 生成任务和 AI 生成能力分卷不含来源文件字段，不重建。

---

### Task 1: 文件名识别与官网标题解析

**Files:**
- Create: `scripts/repair_training_plan_filenames.py`
- Create: `tests/test_repair_training_plan_filenames.py`

**Interfaces:**
- Consumes: manifest 行、候选清单行、官网 HTML。
- Produces: `is_machine_filename(name) -> bool`、`extract_official_filename(html, download_url) -> str | None`、`fallback_filename(relative_path) -> str`。

- [ ] **Step 1: Write the failing tests**

```python
def test_uuid_and_hash_names_are_machine_names():
    assert is_machine_filename("4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf")
    assert is_machine_filename("B0A724568D88A1A89A7C521EAA1_F114B0DB_4CF705.pdf")
    assert not is_machine_filename("2025banchengshiguidaocheliangyingyongjishuzhuanyerencaipeiyangfangan.pdf")

def test_extracts_webplus_real_title_for_matching_pdf():
    html = """<span pdfsrc='/x/uuid.pdf' sudyfile-attr=\"{'title':'2025级人物形象设计专业人才培养方案.pdf'}\"></span>"""
    assert extract_official_filename(html, "https://example.edu/x/uuid.pdf") == "2025级人物形象设计专业人才培养方案.pdf"

def test_fallback_uses_school_group_major():
    path = "documents/湖南/HNIVC_湖南工业职业技术学院/数控技术专业群/460103_数控技术/hash.pdf"
    assert fallback_filename(path) == "湖南工业职业技术学院-数控技术专业群-数控技术.pdf"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests/test_repair_training_plan_filenames.py -v`

Expected: FAIL because the repair module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement the three tested functions with machine-name regular expressions, HTML entity decoding, URL matching and filesystem-safe filename sanitization.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests/test_repair_training_plan_filenames.py -v`

Expected: all tests PASS.

### Task 2: Dry-run audit and safe source repair

**Files:**
- Modify: `scripts/repair_training_plan_filenames.py`
- Test: `tests/test_repair_training_plan_filenames.py`
- Create: `outputs/typical-task-full-20260902/人培文件名替换清单.csv`
- Modify: `/Users/liuhongzhe/Desktop/新双高人培/_catalog/manifest.csv`
- Rename: matched PDFs under `/Users/liuhongzhe/Desktop/新双高人培/documents/`

**Interfaces:**
- Consumes: catalog root, candidates CSV, optional HTML cache.
- Produces: audit rows with old/new path, naming basis, official source page, SHA-256 and status.

- [ ] **Step 1: Add a failing integration test**

Create a temporary mini-catalog with one official-title case and one fallback case; assert dry-run does not mutate files and apply mode renames both files while updating manifest paths.

- [ ] **Step 2: Run the integration test and confirm expected failure**

Run: `python -m unittest tests/test_repair_training_plan_filenames.py -v`

- [ ] **Step 3: Implement dry-run/apply modes**

Fetch each unique HTML source page once, refuse collisions, verify each old file SHA-256 before rename, write a dated manifest backup, rename with `Path.rename`, and atomically rewrite manifest.

- [ ] **Step 4: Run tests and dry-run audit**

Run: `python -m unittest tests/test_repair_training_plan_filenames.py -v`

Run: `python scripts/repair_training_plan_filenames.py --catalog-root /Users/liuhongzhe/Desktop/新双高人培 --audit-csv outputs/typical-task-full-20260902/人培文件名替换清单.csv`

Expected: no mutations; every suspicious manifest row has a unique, safe target and a naming basis.

- [ ] **Step 5: Apply after audit passes**

Run the same command with `--apply`, then confirm zero remaining machine names in manifest and zero missing manifest files.

### Task 3: Update extracted source data and rebuild source-backed workbooks

**Files:**
- Modify: source JSON files under `.worktrees/full-position-task-generation/.tmp/typical-task-extraction/data/`
- Modify: source JSON files under `.worktrees/full-position-task-generation/.tmp/typical-task-extraction/full_generation/data/`
- Rebuild: `.worktrees/full-position-task-generation/outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx`
- Rebuild: `.worktrees/full-position-task-generation/outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_参考文件与总览.xlsx`
- Copy final outputs to their matching paths under the root `outputs/` directory.

**Interfaces:**
- Consumes: Task 2 old/new path mapping.
- Produces: source JSON and two rebuilt workbooks containing the new file names and paths.

- [ ] **Step 1: Add a failing JSON update test**

Assert a row with `source_path`/`source_file` and a row with `来源路径`/`参考人培文件` both update from one mapping without changing unrelated fields.

- [ ] **Step 2: Implement JSON mapping update and run tests**

Only update dictionaries whose exact source path matches an audit mapping; update the paired filename field from the new path basename.

- [ ] **Step 3: Mark the spreadsheet edit operation once**

Run the required Artifact Tool operation marker for two XLSX edits.

- [ ] **Step 4: Rebuild the old detail workbook and new reference workbook**

Run the existing Artifact Tool builders from the full-position task worktree with the bundled Node runtime and node_modules path.

- [ ] **Step 5: Copy the verified outputs to the user-facing output directory**

Use explicit source and destination paths; do not replace AI-only workbooks.

### Task 4: End-to-end verification

**Files:**
- Verify: repaired source catalog, mapping CSV, source JSON and two final workbooks.

**Interfaces:**
- Consumes: final artifacts from Tasks 2–3.
- Produces: fresh counts and validation evidence.

- [ ] **Step 1: Verify source catalog**

Check: machine-name count is zero, every manifest path exists, every file SHA-256 matches manifest, no old path remains, and PDF count/manifest row count are unchanged.

- [ ] **Step 2: Verify workbooks**

Run existing workbook verification scripts, scan for formula errors and remaining old machine filenames, inspect representative source-name/path cells, render all sheets in the two changed workbooks, and run `unzip -t`.

- [ ] **Step 3: Verify change scope**

Confirm AI-only workbooks are byte-identical and report exact repaired row/file counts split by official-title versus fallback naming.

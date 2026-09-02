# 全量岗位典型工作任务与原子能力项生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留原参考数据与来源证据的前提下，为全部 57,552 个岗位生成分来源、可复现、可验证的典型工作任务与原子能力项正式工作簿。

**Architecture:** 在 `.tmp/typical-task-extraction/full_generation/` 建立与现有课程拆解任务隔离的生成流水线。Python 模块负责参考岗位正式纳入、AI 岗位分类、固定种子随机生成和数据 QA；独立 JavaScript 构建器只读取最终 JSON，用 `@oai/artifact-tool` 分块写入新工作簿。开发阶段不读取正在变化的最终结果，合并阶段等待课程拆解任务完成后再取得一致快照。

**Tech Stack:** Python 3.12 标准库、`unittest`、Node.js、`@oai/artifact-tool`、Excel `.xlsx`、JSON。

**Spec:** `docs/superpowers/specs/2026-09-02-full-position-task-ability-generation-design.md`

## Global Constraints

- 原始输出 `outputs/01a056b0-f9d8-7391-9ead-f2406424a741/岗位典型工作任务与原子能力项.xlsx` 不得覆盖。
- 原“需复核”2,475 个岗位正式纳入参考文件数据，但必须保留原匹配状态与匹配分。
- 原“未匹配”54,709 个岗位只能进入 AI 生成表，不得伪造学校、专业、人培文件、页码、来源路径或 SHA-256。
- AI 岗位生成 2–4 个任务；每任务生成 3–4 个能力项，并至少包含知识、技能、素养各一项。
- 固定生成版本为 `AI-RULESET-20260902-V1`，所有随机结果只由岗位 ID、岗位名称和生成版本派生。
- 现有工作区的未提交修改属于其他任务；本计划只新增 `full_generation/` 内容和新的输出目录。
- 工作簿创建必须使用工作区加载器提供的 Node.js 与 `@oai/artifact-tool`，并在首次创作命令前仅运行一次 artifact operation marker。
- 最终工作簿路径固定为 `outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_全量正式版.xlsx`。

---

### Task 1: 确定性岗位分类与 AI 生成器

**Files:**
- Create: `.tmp/typical-task-extraction/full_generation/generator.py`
- Create: `.tmp/typical-task-extraction/full_generation/tests/test_generator.py`

**Interfaces:**
- Produces: `classify_position(position_name: str) -> str`
- Produces: `generate_ai_position(position_id: str, position_name: str, version: str = GENERATION_VERSION) -> dict`
- Produces: `stable_id(prefix: str, *parts: str) -> str`
- Output object keys: `position`, `tasks`, `generation_version`, `seed_digest`
- Each task keys: `任务ID`, `任务序号`, `典型工作任务`, `能力项`
- Each ability keys: `能力项ID`, `能力类别`, `原子能力项`

- [ ] **Step 1: Write failing tests for deterministic generation and range rules**

```python
class GeneratorTests(unittest.TestCase):
    def test_same_position_generates_identical_content(self):
        first = generate_ai_position("28318", "安装岗位通用")
        second = generate_ai_position("28318", "安装岗位通用")
        self.assertEqual(first, second)

    def test_input_order_does_not_change_position_result(self):
        expected = generate_ai_position("28318", "安装岗位通用")
        generate_ai_position("28319", "检测技术支持工程师")
        self.assertEqual(generate_ai_position("28318", "安装岗位通用"), expected)

    def test_task_and_ability_counts_stay_in_required_ranges(self):
        result = generate_ai_position("28323", "烧烤师傅")
        self.assertIn(len(result["tasks"]), range(2, 5))
        for task in result["tasks"]:
            self.assertIn(len(task["能力项"]), range(3, 5))

    def test_every_task_has_knowledge_skill_and_quality(self):
        result = generate_ai_position("28323", "烧烤师傅")
        for task in result["tasks"]:
            self.assertEqual(
                {"知识", "技能", "素养"},
                {item["能力类别"] for item in task["能力项"]},
            )

    def test_ids_and_text_are_unique_within_position(self):
        result = generate_ai_position("28320", "会员客服")
        self.assertEqual(len(result["tasks"]), len({task["任务ID"] for task in result["tasks"]}))
        self.assertEqual(len(result["tasks"]), len({task["典型工作任务"] for task in result["tasks"]}))
        for task in result["tasks"]:
            abilities = task["能力项"]
            self.assertEqual(len(abilities), len({item["能力项ID"] for item in abilities}))
            self.assertEqual(len(abilities), len({item["原子能力项"] for item in abilities}))
```

- [ ] **Step 2: Run the generator tests and verify RED**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest .tmp/typical-task-extraction/full_generation/tests/test_generator.py -v
```

Expected: FAIL because `full_generation.generator` and its functions do not exist.

- [ ] **Step 3: Implement the minimal deterministic generator**

Implement:

```python
GENERATION_VERSION = "AI-RULESET-20260902-V1"

def seed_int(*parts):
    raw = "|".join(str(part) for part in parts)
    return int(hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16], 16)

def rng_for(position_id, position_name, purpose):
    return random.Random(seed_int(position_id, position_name, GENERATION_VERSION, purpose))
```

Define ordered keyword rules for the 19 categories in the spec. Give every category at least six task templates and category-specific knowledge, skill and quality templates. Use the job name in each selected task. Select tasks without replacement, generate exactly one knowledge, one skill and one quality item, and generate the optional fourth item from a separately seeded candidate pool.

- [ ] **Step 4: Run the generator tests and verify GREEN**

Run the Step 2 command. Expected: all generator tests PASS with no warnings.

- [ ] **Step 5: Add category coverage tests**

```python
def test_representative_positions_use_specific_categories(self):
    cases = {
        "Java开发工程师": "软件与数据",
        "自动化设备维修工程师": "机械与自动化",
        "财务审计专员": "财务与审计",
        "护理人员": "医疗健康",
        "平面设计师": "设计与传媒",
        "仓储物流主管": "物流与供应链",
    }
    for position, expected in cases.items():
        self.assertEqual(classify_position(position), expected)
```

- [ ] **Step 6: Run the new test and verify RED, then complete keyword precedence and verify GREEN**

Run the Step 2 command before and after completing ordered keyword rules. Expected first failure: at least one representative岗位 falls into the wrong category. Expected final result: all tests PASS.

---

### Task 2: 参考岗位正式纳入与全量数据组装

**Files:**
- Modify: `.tmp/typical-task-extraction/full_generation/generator.py`
- Create: `.tmp/typical-task-extraction/full_generation/assemble_dataset.py`
- Create: `.tmp/typical-task-extraction/full_generation/tests/test_assemble_dataset.py`

**Interfaces:**
- Consumes: final `coverage.json`, `source_records.json`, `source_audit.json`
- Consumes: `generate_ai_position(...)`
- Produces: `build_reference_rows(coverage, source_records) -> tuple[list, list, list]`
- Produces: `assemble_all(coverage, source_records, source_audit) -> dict[str, list | dict]`
- Dataset keys: `reference_tasks`, `reference_abilities`, `ai_tasks`, `ai_abilities`, `position_overview`, `reference_gaps`, `source_audit`, `summary`

- [ ] **Step 1: Write failing tests for source separation and promotion**

```python
class AssembleDatasetTests(unittest.TestCase):
    def test_review_position_is_promoted_to_reference_data(self):
        dataset = assemble_all(self.coverage_fixture, self.source_fixture, [])
        row = next(item for item in dataset["position_overview"] if item["岗位ID"] == "2")
        self.assertEqual(row["正式数据状态"], "已纳入")
        self.assertEqual(row["数据来源类型"], "参考文件")
        self.assertEqual(row["原匹配状态"], "需复核")
        self.assertTrue(any(item["岗位ID"] == "2" for item in dataset["reference_tasks"]))

    def test_unmatched_position_only_appears_in_ai_data(self):
        dataset = assemble_all(self.coverage_fixture, self.source_fixture, [])
        self.assertTrue(any(item["岗位ID"] == "3" for item in dataset["ai_tasks"]))
        self.assertFalse(any(item["岗位ID"] == "3" for item in dataset["reference_tasks"]))

    def test_ai_rows_have_no_reference_source_fields(self):
        dataset = assemble_all(self.coverage_fixture, self.source_fixture, [])
        forbidden = {"学校", "专业", "参考人培文件", "来源定位", "来源路径", "SHA-256"}
        for row in dataset["ai_tasks"] + dataset["ai_abilities"]:
            self.assertTrue(forbidden.isdisjoint(row))
```

- [ ] **Step 2: Run assembly tests and verify RED**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest .tmp/typical-task-extraction/full_generation/tests/test_assemble_dataset.py -v
```

Expected: FAIL because `assemble_dataset.py` does not exist.

- [ ] **Step 3: Implement reference mapping from final candidate fields**

Group `source_records.json` by `(source_job, major_code, major)`. For each coverage row with original status `已匹配` or `需复核`, resolve the group from `匹配来源岗位`, `匹配专业代码`, and `匹配专业`; call the existing finalized atomization rules only after the course task has completed. Deduplicate reference task rows by `(岗位ID, 任务ID)` and reference ability rows by `(岗位ID, 任务ID, 能力类别, 原子能力项, 学校, 专业代码)`.

- [ ] **Step 4: Implement AI and overview flattening**

For original `未匹配` rows, flatten `generate_ai_position(...)` into task and ability lists. Build one overview row per input岗位 with `正式数据状态=已纳入`, preserving `原匹配状态`; compute task and ability counts from the flattened data.

- [ ] **Step 5: Run assembly tests and verify GREEN**

Run the Step 2 command. Expected: all assembly tests PASS.

- [ ] **Step 6: Add and pass referential-integrity tests**

```python
def test_all_ability_task_ids_resolve(self):
    dataset = assemble_all(self.coverage_fixture, self.source_fixture, [])
    task_ids = {row["任务ID"] for row in dataset["reference_tasks"] + dataset["ai_tasks"]}
    ability_task_ids = {row["任务ID"] for row in dataset["reference_abilities"] + dataset["ai_abilities"]}
    self.assertTrue(ability_task_ids <= task_ids)

def test_overview_contains_each_position_once(self):
    dataset = assemble_all(self.coverage_fixture, self.source_fixture, [])
    ids = [row["岗位ID"] for row in dataset["position_overview"]]
    self.assertEqual(len(ids), len(set(ids)))
```

Run the Step 2 command before completing integrity validation and confirm the new test fails for a deliberately incomplete fixture; complete validation and rerun until all tests PASS.

---

### Task 3: 全量 QA、快照读取与中间 JSON

**Files:**
- Modify: `.tmp/typical-task-extraction/full_generation/assemble_dataset.py`
- Create: `.tmp/typical-task-extraction/full_generation/verify_dataset.py`
- Create: `.tmp/typical-task-extraction/full_generation/tests/test_verify_dataset.py`
- Create at runtime: `.tmp/typical-task-extraction/full_generation/data/*.json`
- Create at runtime: `.tmp/typical-task-extraction/full_generation/data/qa_report.json`

**Interfaces:**
- Produces: `verify_dataset(dataset: dict, expected_total: int = 57552) -> dict`
- Produces QA keys: `errors`, `warnings`, `counts`, `uniques`, `ranges`, `category_completeness`, `reference_resolution`

- [ ] **Step 1: Write failing QA tests**

```python
class VerifyDatasetTests(unittest.TestCase):
    def test_rejects_missing_position(self):
        report = verify_dataset(self.dataset_fixture, expected_total=4)
        self.assertIn("岗位总数不等于4", report["errors"])

    def test_rejects_ai_task_without_three_categories(self):
        broken = copy.deepcopy(self.dataset_fixture)
        broken["ai_abilities"] = [row for row in broken["ai_abilities"] if row["能力类别"] != "素养"]
        report = verify_dataset(broken, expected_total=3)
        self.assertTrue(any("能力类别不完整" in error for error in report["errors"]))

    def test_valid_fixture_has_no_errors(self):
        report = verify_dataset(self.dataset_fixture, expected_total=3)
        self.assertEqual(report["errors"], [])
```

- [ ] **Step 2: Run QA tests and verify RED**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest .tmp/typical-task-extraction/full_generation/tests/test_verify_dataset.py -v
```

Expected: FAIL because `verify_dataset.py` does not exist.

- [ ] **Step 3: Implement QA validation**

Validate exact total and source-group counts, unique岗位/任务/能力 ID, task and ability count ranges, category completeness, source separation, reference source resolution, and referential integrity. Return all defects in `errors` rather than stopping at the first one.

- [ ] **Step 4: Run QA tests and verify GREEN**

Run the Step 2 command. Expected: all QA tests PASS.

- [ ] **Step 5: Wait for the course decomposition task to finish and capture a consistent source snapshot**

Use the Codex task status tool for task `01a056b0-f9d8-7391-9ead-f2406424a741`. Do not copy or read the final reference JSON while that task is writing. Once it is complete or idle with a final response, record SHA-256 for `coverage.json`, `source_records.json`, and `source_audit.json`, then invoke `assemble_dataset.py`.

- [ ] **Step 6: Generate full JSON and run full QA**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 .tmp/typical-task-extraction/full_generation/assemble_dataset.py
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 .tmp/typical-task-extraction/full_generation/verify_dataset.py
```

Expected: `qa_report.json` has `errors: []`, 57,552 unique overview岗位, 2,843 reference岗位, and 54,709 AI岗位.

---

### Task 4: 分来源工作簿构建器

**Files:**
- Create: `.tmp/typical-task-extraction/full_generation/build_workbook.mjs`
- Create: `.tmp/typical-task-extraction/full_generation/verify_workbook.mjs`
- Create at runtime: `.tmp/typical-task-extraction/full_generation/previews/*.png`
- Create at runtime: `outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_全量正式版.xlsx`

**Interfaces:**
- Consumes: Task 3 JSON files and `qa_report.json`
- Produces sheets: `说明与统计`, `参考文件-任务`, `参考文件-能力项`, `AI生成-任务`, `AI生成-能力项`, `岗位总览`, `参考数据缺口`, `人培来源审计`

- [ ] **Step 1: Write workbook verification before the builder exists**

`verify_workbook.mjs` must import the expected output and assert all eight sheet names, exact used-row counts from `qa_report.json`, representative source fields in reference sheets, absence of source columns in AI sheets, zero formula-error matches, and non-empty key ranges.

- [ ] **Step 2: Run workbook verification and verify RED**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node .tmp/typical-task-extraction/full_generation/verify_workbook.mjs
```

Expected: FAIL because the new output workbook does not exist.

- [ ] **Step 3: Mark the artifact operation exactly once**

Run immediately before the first workbook-creation command:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node container_tools/mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 1 --output-format xlsx
```

- [ ] **Step 4: Implement the chunked workbook builder**

Use `Workbook.create()`. Write headers once and data in blocks of at most 20,000 rows through `getRangeByIndexes(...).values`. Add tables only after all rows are written. Apply consistent source colors, freeze panes, filters, explicit widths, wrapping and numeric formats. Do not apply formatting to unused full columns on the large AI ability sheet.

- [ ] **Step 5: Render and inspect all sheets**

Render a representative range from every sheet to `.tmp/typical-task-extraction/full_generation/previews/`. Inspect all eight PNGs for clipped headers, unreadable source labels, broken wrapping, blank sheets or overlapping content. Patch only the affected widths, heights or styles and rebuild.

- [ ] **Step 6: Run workbook verification and verify GREEN**

Run the Step 2 command. Expected: all eight sheets resolve, row counts match QA, source separation checks pass, and formula errors equal zero.

- [ ] **Step 7: Run file-level verification**

Run:

```bash
file outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_全量正式版.xlsx
unzip -t outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_全量正式版.xlsx
shasum -a 256 outputs/typical-task-full-20260902/岗位典型工作任务与原子能力项_全量正式版.xlsx
```

Expected: Office Open XML workbook, `No errors detected`, and one SHA-256 digest.

---

### Task 5: Full regression and delivery audit

**Files:**
- Modify only if verification exposes defects: files created by Tasks 1–4

**Interfaces:**
- Consumes all prior task outputs
- Produces final verification evidence and the delivered workbook

- [ ] **Step 1: Run the complete Python test suite**

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest discover -s .tmp/typical-task-extraction/full_generation/tests -v
```

Expected: every generator, assembly and QA test PASS.

- [ ] **Step 2: Run existing extraction regression tests**

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest discover -s .tmp/typical-task-extraction/tests -v
```

Expected: existing extraction tests PASS, including the course line-boundary test from the completed course task.

- [ ] **Step 3: Re-run full data and workbook verifiers**

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 .tmp/typical-task-extraction/full_generation/verify_dataset.py
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node .tmp/typical-task-extraction/full_generation/verify_workbook.mjs
```

Expected: dataset `errors: []`, workbook status `ok`, exact group totals, and zero formula errors.

- [ ] **Step 4: Audit repository scope**

```bash
git status --short
git diff --check -- .tmp/typical-task-extraction/full_generation docs/superpowers outputs/typical-task-full-20260902
```

Expected: no whitespace errors; no unrelated files staged or committed; original workbook still present.

- [ ] **Step 5: Deliver the workbook with exact counts and caveats**

Report the final reference and AI岗位、任务、能力项 counts, workbook SHA-256, test results, and the distinction that AI-generated content is formal data by user instruction but not reference-file evidence.

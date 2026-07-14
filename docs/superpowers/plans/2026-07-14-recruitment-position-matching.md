# Recruitment Position Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable pipeline that matches every 2014—2025 graduate recruitment record to up to three existing or newly created positions, exports database-compatible relations, and produces an auditable Excel review workbook.

**Architecture:** A Python package streams yearly CSV files in chunks, normalizes and deduplicates records, builds a character n-gram candidate index over the 1,356 position profiles, scores candidates with explicit components, applies confidence and multi-position rules, and clusters only stable low-confidence title groups for new-position creation. Parquet/CSV artifacts and manifests are written incrementally; a separate bundled-Node builder uses `@oai/artifact-tool` to author the final Excel review workbook.

**Tech Stack:** Python 3.12, pandas, NumPy, PyArrow, scikit-learn, standard-library `unittest`, bundled Node.js, `@oai/artifact-tool`.

## Global Constraints

- Read recruitment data only from the twelve yearly CSV files under `/Users/liuhongzhe/Desktop/应届生招聘大数据（2014-2025.6）/分年份保存数据/`; do not also process the consolidated 11GB CSV.
- Never modify `/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position.xlsx` or the source recruitment CSV files.
- Preserve every existing `position_id`; same-name rows in different industry catalogs remain distinct candidates.
- A recruitment record has at most one primary relation and at most two secondary relations.
- Only high-confidence relations enter `job_position_jd_csv`; medium-confidence candidates go to review; low-confidence records remain unmatched unless a stable new-position cluster is created.
- A new position requires at least 10 effective recruitment records from at least 3 distinct companies.
- Full outputs live under `outputs/recruitment_position_matching/v1/`; workbook output lives in that same version directory.
- Spreadsheet authoring must use bundled Node.js and `@oai/artifact-tool`, with inspection, formula-error scan, render verification, and final XLSX export.
- The existing untracked directory `outputs/recruitment_2025/` is unrelated and must remain untouched.

---

## File Structure

- Create `requirements-recruitment-position-matching.txt`: pinned Python runtime dependencies.
- Modify `.gitignore`: ignore the task-specific virtual environment and generated matching outputs.
- Create `configs/recruitment_position_matching_v1.json`: source paths, scoring weights, initial thresholds, new-position constraints, and output version.
- Create `recruitment_position_matching/__init__.py`: package version.
- Create `recruitment_position_matching/config.py`: typed configuration loader and path validation.
- Create `recruitment_position_matching/io.py`: source discovery, chunked CSV/XLSX reads, Parquet/CSV writes, manifests, and checkpoints.
- Create `recruitment_position_matching/normalize.py`: text cleaning, stable ID generation, and duplicate keys.
- Create `recruitment_position_matching/profiles.py`: existing-position profile construction.
- Create `recruitment_position_matching/matcher.py`: candidate index, component scores, ranking, and explanations.
- Create `recruitment_position_matching/decisions.py`: confidence tiers, primary/secondary selection, and bridge-row conversion.
- Create `recruitment_position_matching/new_positions.py`: low-confidence aggregation, fuzzy clustering, naming, ID assignment, and extended position rows.
- Create `recruitment_position_matching/pipeline.py`: year/chunk orchestration and resume behavior.
- Create `recruitment_position_matching/qa.py`: reconciliations, stratified samples, summary metrics, and acceptance checks.
- Create `recruitment_position_matching/cli.py`: `scan`, `pilot`, `run`, `qa`, and `finalize` commands.
- Create `scripts/build_recruitment_position_review.mjs`: review workbook builder using `@oai/artifact-tool`.
- Create `tests/recruitment_position_matching/fixtures/`: small UTF-8-SIG CSV and position XLSX fixtures.
- Create focused test modules under `tests/recruitment_position_matching/` matching each Python module.
- Create `outputs/recruitment_position_matching/v1/README.md`: generated artifact inventory, run metadata, and import order.

---

### Task 1: Runtime, Configuration, and CLI Contract

**Files:**
- Create: `requirements-recruitment-position-matching.txt`
- Modify: `.gitignore`
- Create: `configs/recruitment_position_matching_v1.json`
- Create: `recruitment_position_matching/__init__.py`
- Create: `recruitment_position_matching/config.py`
- Create: `recruitment_position_matching/cli.py`
- Test: `tests/recruitment_position_matching/test_config.py`

**Interfaces:**
- Produces: `PipelineConfig`, `load_config(path: Path) -> PipelineConfig`, and `python -m recruitment_position_matching.cli`.
- Consumes: no earlier task output.

- [ ] **Step 1: Write the failing configuration tests**

```python
from pathlib import Path
import json
import tempfile
import unittest

from recruitment_position_matching.config import load_config


class ConfigTests(unittest.TestCase):
    def test_loads_thresholds_and_hard_new_position_limits(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            yearly = root / "yearly"
            yearly.mkdir()
            position = root / "job_position.xlsx"
            position.touch()
            output = root / "out"
            path = root / "config.json"
            path.write_text(json.dumps({
                "yearly_input_dir": str(yearly),
                "position_workbook": str(position),
                "output_dir": str(output),
                "version": "v1",
                "chunk_rows": 50000,
                "weights": {"title": 0.45, "occupation": 0.20, "description": 0.20,
                            "industry": 0.10, "requirements": 0.05},
                "thresholds": {"high": 0.78, "medium": 0.62, "primary_margin": 0.06,
                               "secondary": 0.78, "secondary_max_gap": 0.12},
                "new_positions": {"min_jobs": 10, "min_companies": 3,
                                  "min_cohesion": 0.82, "max_existing_score": 0.62}
            }), encoding="utf-8")
            cfg = load_config(path)
            self.assertEqual(cfg.new_positions.min_jobs, 10)
            self.assertEqual(cfg.new_positions.min_companies, 3)
            self.assertAlmostEqual(sum(cfg.weights.values()), 1.0)

    def test_rejects_invalid_weight_sum(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            yearly = root / "yearly"
            yearly.mkdir()
            position = root / "job_position.xlsx"
            position.touch()
            path = root / "config.json"
            path.write_text(json.dumps({
                "yearly_input_dir": str(yearly),
                "position_workbook": str(position),
                "output_dir": str(root / "out"),
                "version": "v1",
                "chunk_rows": 50000,
                "weights": {"title": 0.40, "occupation": 0.20, "description": 0.20,
                            "industry": 0.10, "requirements": 0.05},
                "thresholds": {"high": 0.78, "medium": 0.62, "primary_margin": 0.06,
                               "secondary": 0.78, "secondary_max_gap": 0.12},
                "new_positions": {"min_jobs": 10, "min_companies": 3,
                                  "min_cohesion": 0.82, "max_existing_score": 0.62}
            }), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "weights must sum to 1.0"):
                load_config(path)
```

- [ ] **Step 2: Run the tests and verify the missing module failure**

Run: `python3 -m unittest tests/recruitment_position_matching/test_config.py -v`

Expected: `ModuleNotFoundError: No module named 'recruitment_position_matching'`.

- [ ] **Step 3: Add the pinned runtime contract and configuration implementation**

`requirements-recruitment-position-matching.txt`:

```text
numpy==2.3.5
pandas==2.2.3
pyarrow==23.0.1
scikit-learn==1.8.0
openpyxl==3.1.5
```

Append to `.gitignore`:

```text
.venv-recruitment-position-matching/
outputs/recruitment_position_matching/
```

Create `PipelineConfig` with frozen dataclasses for paths, weights, thresholds, and new-position limits. `load_config()` must resolve paths, require the input directory and workbook to exist, require positive `chunk_rows`, require score thresholds in descending order, require weights to sum to 1.0 within `1e-9`, and enforce `min_jobs >= 10` and `min_companies >= 3`.

Use this exact initial configuration in `configs/recruitment_position_matching_v1.json`:

```json
{
  "yearly_input_dir": "/Users/liuhongzhe/Desktop/应届生招聘大数据（2014-2025.6）/分年份保存数据",
  "position_workbook": "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position.xlsx",
  "job_jds_reference": "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_jds.csv",
  "job_position_jd_reference": "/Users/liuhongzhe/Desktop/学堂/专业建设/需求/V1.0/数据搬移/job_position_jd.xlsx",
  "output_dir": "outputs/recruitment_position_matching/v1",
  "version": "v1",
  "chunk_rows": 50000,
  "weights": {"title": 0.45, "occupation": 0.20, "description": 0.20, "industry": 0.10, "requirements": 0.05},
  "thresholds": {"high": 0.78, "medium": 0.62, "primary_margin": 0.06, "secondary": 0.78, "secondary_max_gap": 0.12},
  "new_positions": {"min_jobs": 10, "min_companies": 3, "min_cohesion": 0.82, "max_existing_score": 0.62},
  "link_source": "graduate_recruitment_2014_2025_v1",
  "random_seed": 20260714
}
```

The CLI parser must expose:

```python
parser.add_argument("command", choices=["scan", "pilot", "run", "qa", "finalize"])
parser.add_argument("--config", default="configs/recruitment_position_matching_v1.json")
parser.add_argument("--year", type=int)
parser.add_argument("--force", action="store_true")
```

- [ ] **Step 4: Create and verify the isolated Python environment**

Run:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m venv .venv-recruitment-position-matching
.venv-recruitment-position-matching/bin/pip install -r requirements-recruitment-position-matching.txt
.venv-recruitment-position-matching/bin/python -c "import pandas, pyarrow, sklearn; print('runtime ok')"
```

Expected: `runtime ok`.

- [ ] **Step 5: Run tests and commit**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_config.py -v`

Expected: all configuration tests pass.

```bash
git add .gitignore requirements-recruitment-position-matching.txt configs/recruitment_position_matching_v1.json recruitment_position_matching/__init__.py recruitment_position_matching/config.py recruitment_position_matching/cli.py tests/recruitment_position_matching/test_config.py
git commit -m "feat: add recruitment matching runtime contract"
```

---

### Task 2: Source Discovery and Schema-Safe Streaming

**Files:**
- Create: `recruitment_position_matching/io.py`
- Create: `tests/recruitment_position_matching/test_io.py`
- Create: `tests/recruitment_position_matching/fixtures/jobs_2024.csv`
- Create: `tests/recruitment_position_matching/fixtures/jobs_2025.csv`

**Interfaces:**
- Consumes: `PipelineConfig`.
- Produces: `discover_yearly_files(input_dir: Path) -> dict[int, Path]`, `iter_job_chunks(path: Path, chunk_rows: int) -> Iterator[pd.DataFrame]`, `read_positions(path: Path) -> pd.DataFrame`, and atomic `write_parquet_part()` / `write_csv_part()` helpers.

- [ ] **Step 1: Write failing tests for twelve-year discovery and malformed extra-column handling**

```python
class IoTests(unittest.TestCase):
    def test_discovery_requires_exactly_2014_through_2025(self):
        files = discover_yearly_files(self.input_dir)
        self.assertEqual(sorted(files), list(range(2014, 2026)))

    def test_reader_removes_only_unnamed_trailing_columns(self):
        frame = next(iter_job_chunks(self.fixture_2017, chunk_rows=2))
        self.assertIn("企业名称", frame.columns)
        self.assertIn("来源", frame.columns)
        self.assertNotIn("", frame.columns)
        self.assertNotIn("Unnamed: 19", frame.columns)

    def test_reader_preserves_multiline_description(self):
        frame = next(iter_job_chunks(self.fixture_2025, chunk_rows=2))
        self.assertIn("岗位职责", frame.loc[0, "职位描述"])
        self.assertIn("任职要求", frame.loc[0, "职位描述"])
```

- [ ] **Step 2: Run tests and verify they fail on missing functions**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_io.py -v`

Expected: import failure for `recruitment_position_matching.io`.

- [ ] **Step 3: Implement schema-safe readers and atomic writers**

Use `encoding="utf-8-sig"`, `dtype=str`, `keep_default_na=False`, `on_bad_lines="warn"`, and pandas chunking. Normalize known headers to this ordered schema:

```python
JOB_COLUMNS = [
    "企业名称", "招聘岗位", "工作城市", "工作区域", "最低月薪", "最高月薪",
    "职位描述", "学历要求", "要求经验", "招聘人数", "招聘类别", "初级分类",
    "公司地点", "工作地点", "招聘发布日期", "招聘结束日期",
    "招聘发布年份", "招聘结束年份", "来源",
]
```

Unknown non-empty columns must raise `ValueError`; empty trailing columns from 2016—2021 are removed. Atomic writers first write `*.tmp`, then use `Path.replace()` so interrupted chunks cannot appear complete.

- [ ] **Step 4: Add `scan` command output**

`scan` must write `manifests/source_scan.json` containing filename, year, byte size, header columns, SHA-256 fingerprint over file size plus first and last 1 MiB, and discovered position row count. It must fail if a year is missing or duplicated.

- [ ] **Step 5: Run tests, scan real sources, and commit**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_io.py -v
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli scan --config configs/recruitment_position_matching_v1.json
```

Expected: tests pass and the scan reports 12 files for 2014—2025 plus 1,356 position rows.

```bash
git add recruitment_position_matching/io.py recruitment_position_matching/cli.py tests/recruitment_position_matching
git commit -m "feat: add schema-safe recruitment source reader"
```

---

### Task 3: Recruitment Normalization, Stable IDs, and Duplicate Accounting

**Files:**
- Create: `recruitment_position_matching/normalize.py`
- Create: `tests/recruitment_position_matching/test_normalize.py`

**Interfaces:**
- Consumes: raw job chunks from `iter_job_chunks()`.
- Produces: `normalize_title(text: str) -> str`, `normalize_job_chunk(frame: pd.DataFrame, source_year: int) -> pd.DataFrame`, `stable_jd_id(row: Mapping[str, str]) -> int`, and `duplicate_key(row) -> str`.

- [ ] **Step 1: Write failing normalization tests**

```python
class NormalizeTests(unittest.TestCase):
    def test_title_removes_recruiting_noise_but_keeps_role_identity(self):
        self.assertEqual(normalize_title("高薪急聘-北京 Java开发工程师（应届）"), "java开发工程师")
        self.assertEqual(normalize_title("生产领班/组长/储备干部"), "生产领班/组长")

    def test_stable_id_is_positive_63_bit_and_repeatable(self):
        first = stable_jd_id(self.row)
        second = stable_jd_id(dict(self.row))
        self.assertEqual(first, second)
        self.assertGreater(first, 0)
        self.assertLess(first, 2 ** 63)

    def test_same_title_different_company_is_not_duplicate(self):
        a = dict(self.row, 企业名称="甲公司")
        b = dict(self.row, 企业名称="乙公司")
        self.assertNotEqual(duplicate_key(a), duplicate_key(b))
```

- [ ] **Step 2: Run tests and verify missing implementation failure**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_normalize.py -v`

Expected: import failure for normalization functions.

- [ ] **Step 3: Implement deterministic normalization**

Apply Unicode NFKC, lowercase Latin text, collapse whitespace, normalize slashes, and remove only anchored noise tokens. Preserve original values in `*_raw` columns. Generate `jd_id` from SHA-256 of this canonical tuple and mask to positive signed BIGINT:

```python
identity = "\x1f".join([
    canonical(row["企业名称"]), canonical(row["招聘岗位"]),
    canonical(row["工作城市"]), canonical(row["工作地点"]),
    canonical(row["招聘发布日期"]), canonical(row["职位描述"]),
])
jd_id = int.from_bytes(hashlib.sha256(identity.encode("utf-8")).digest()[:8], "big") & ((1 << 63) - 1)
return jd_id or 1
```

The duplicate key uses the same tuple. `normalize_job_chunk()` adds `source_year`, `source_file`, `source_row_number`, `normalized_title`, `normalized_description`, `duplicate_key`, `is_duplicate`, and `invalid_reason`. Empty title rows are preserved with `invalid_reason="missing_title"`.

- [ ] **Step 4: Verify tests and commit**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_normalize.py -v`

Expected: all tests pass.

```bash
git add recruitment_position_matching/normalize.py tests/recruitment_position_matching/test_normalize.py
git commit -m "feat: normalize recruitment records and assign stable ids"
```

---

### Task 4: Existing Position Profiles and Candidate Scoring

**Files:**
- Create: `recruitment_position_matching/profiles.py`
- Create: `recruitment_position_matching/matcher.py`
- Create: `tests/recruitment_position_matching/test_matcher.py`

**Interfaces:**
- Consumes: position workbook rows and normalized recruitment chunks.
- Produces: `build_position_profiles(frame) -> pd.DataFrame`, `CandidateIndex.fit(profiles)`, `CandidateIndex.rank_jobs(jobs, top_k=10) -> pd.DataFrame`.

- [ ] **Step 1: Write failing profile and ranking tests**

```python
class MatcherTests(unittest.TestCase):
    def test_same_name_position_ids_are_preserved(self):
        profiles = build_position_profiles(self.positions)
        self.assertEqual(len(profiles[profiles.position_name == "项目经理"]), 2)

    def test_machine_learning_job_ranks_machine_learning_position_first(self):
        ranked = self.index.rank_jobs(pd.DataFrame([{
            "jd_id": 7,
            "normalized_title": "机器学习工程师",
            "normalized_description": "负责模型训练 特征工程 算法优化 python",
            "初级分类": "技术",
        }]), top_k=3)
        self.assertEqual(ranked.iloc[0].position_name, "机器学习工程师")
        self.assertGreater(ranked.iloc[0].title_score, ranked.iloc[1].title_score)

    def test_cross_industry_same_name_uses_industry_context(self):
        ranked = self.index.rank_jobs(self.manufacturing_project_manager_job, top_k=3)
        self.assertEqual(ranked.iloc[0].source_industry_catalog_id, 301)
```

- [ ] **Step 2: Run tests and verify missing module failures**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_matcher.py -v`

Expected: import failures for profiles and matcher.

- [ ] **Step 3: Implement position profiles**

Build one profile per original row using the exact concatenation below; do not group by name:

```python
profile_text = " ".join(filter(None, [
    position_name, primary_occupation_name, work_summary, requirements_text,
    str(cluster_id), str(source_industry_catalog_id), job_level, education_target,
]))
```

Add normalized `position_title`, `occupation_text`, `description_text`, `requirements_text_norm`, and `industry_context`. Assert `position_id` is unique and row count remains 1,356.

- [ ] **Step 4: Implement candidate retrieval and explicit component scores**

Fit two `TfidfVectorizer` instances:

```python
title_vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(2, 4), min_df=1, sublinear_tf=True)
text_vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(2, 3), min_df=1, sublinear_tf=True, max_features=120000)
```

Use cosine nearest neighbors to retrieve 10 title candidates per normalized title. Rerank each candidate with:

```python
total = (
    0.45 * title_score
    + 0.20 * occupation_score
    + 0.20 * description_score
    + 0.10 * industry_score
    + 0.05 * requirements_score
    - conflict_penalty
)
total = max(0.0, min(1.0, total))
```

`industry_score` is 1.0 for aligned category/industry keywords, 0.5 when unknown, and 0.0 for an explicit conflict. `conflict_penalty` is 0.20 for mutually exclusive function families such as sales versus R&D or production operator versus software development. Emit candidate rank, every component, total score, matched evidence tokens, and conflict reason.

- [ ] **Step 5: Add cache behavior and run tests**

Cache title-neighbor results by `(normalized_title, 初级分类)` within a run. Verify two identical title/category pairs call nearest-neighbor search once while descriptions are still reranked independently.

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_matcher.py -v`

Expected: all matcher tests pass.

- [ ] **Step 6: Commit**

```bash
git add recruitment_position_matching/profiles.py recruitment_position_matching/matcher.py tests/recruitment_position_matching/test_matcher.py
git commit -m "feat: rank position candidates with explainable scores"
```

---

### Task 5: Confidence Tiers, Multi-Position Rules, and Bridge Export

**Files:**
- Create: `recruitment_position_matching/decisions.py`
- Create: `tests/recruitment_position_matching/test_decisions.py`

**Interfaces:**
- Consumes: ranked candidate rows and `ThresholdConfig`.
- Produces: `classify_candidates(candidates, thresholds) -> DecisionResult`, `select_relations(candidates, thresholds) -> pd.DataFrame`, and `to_bridge_rows(relations, id_start, link_source) -> pd.DataFrame`.

- [ ] **Step 1: Write failing decision tests**

```python
class DecisionTests(unittest.TestCase):
    def test_high_primary_requires_score_and_margin(self):
        result = classify_candidates(self.candidates(scores=[0.84, 0.70]), self.thresholds)
        self.assertEqual(result.confidence, "high")

    def test_ambiguous_high_scores_go_to_medium_review(self):
        result = classify_candidates(self.candidates(scores=[0.82, 0.80]), self.thresholds)
        self.assertEqual(result.confidence, "medium")

    def test_at_most_one_primary_and_two_secondaries(self):
        relations = select_relations(self.four_distinct_high_candidates, self.thresholds)
        self.assertEqual((relations.relation_type == "primary").sum(), 1)
        self.assertLessEqual((relations.relation_type == "secondary").sum(), 2)

    def test_same_name_cross_catalog_is_not_added_as_secondary(self):
        relations = select_relations(self.same_name_cross_catalog_candidates, self.thresholds)
        self.assertEqual(len(relations), 1)
```

- [ ] **Step 2: Run tests and verify missing module failure**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_decisions.py -v`

Expected: import failure for decision functions.

- [ ] **Step 3: Implement decision rules**

Use initial thresholds from configuration. A primary is high only when `top_score >= high` and either there is no second candidate or `top_score - second_score >= primary_margin`. Scores at or above `medium` that fail the high rule are medium. Lower scores are low.

A secondary relation must satisfy all conditions:

```python
candidate.score >= thresholds.secondary
candidate.score >= primary.score - thresholds.secondary_max_gap
candidate.position_name != primary.position_name
candidate.function_family != primary.function_family
candidate.independent_responsibility_evidence is True
```

Sort relations deterministically by `jd_id`, primary before secondary, score descending, then `position_id`. Keep rejected candidates in the audit table with an exact rejection reason.

- [ ] **Step 4: Implement bridge compatibility**

Emit exactly these database columns in order:

```python
BRIDGE_COLUMNS = [
    "id", "position_id", "jd_id", "profile_version", "period", "industry_id",
    "match_score", "match_method", "link_source", "created_at",
]
```

Use `period=str(source_year)`, `match_method="hybrid_title_description_v1"`, the configured link source, the selected position's `profile_version` and `source_industry_catalog_id`, and deterministic sequential IDs beginning after the maximum reference bridge `id`.

- [ ] **Step 5: Run tests and commit**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_decisions.py -v`

Expected: all decision tests pass.

```bash
git add recruitment_position_matching/decisions.py tests/recruitment_position_matching/test_decisions.py
git commit -m "feat: apply confidence and multi-position rules"
```

---

### Task 6: Stable Low-Confidence Clusters and New Positions

**Files:**
- Create: `recruitment_position_matching/new_positions.py`
- Create: `tests/recruitment_position_matching/test_new_positions.py`

**Interfaces:**
- Consumes: low-confidence jobs, candidate maxima, and the original position table.
- Produces: `aggregate_unmatched_titles()`, `cluster_unmatched_titles()`, `create_new_positions()`, and `relations_for_new_positions()`.

- [ ] **Step 1: Write failing hard-constraint tests**

```python
class NewPositionTests(unittest.TestCase):
    def test_rejects_cluster_with_only_two_companies(self):
        cluster = self.cluster(job_count=20, companies=["甲", "乙"])
        self.assertEqual(create_new_positions([cluster], self.positions), [])

    def test_rejects_cluster_with_only_nine_jobs(self):
        cluster = self.cluster(job_count=9, companies=["甲", "乙", "丙"])
        self.assertEqual(create_new_positions([cluster], self.positions), [])

    def test_creates_clean_name_and_deterministic_id(self):
        cluster = self.cluster(job_count=12, companies=["甲", "乙", "丙"],
                               titles=["高薪急聘AIGC应用工程师", "AIGC应用工程师（应届）"])
        first = create_new_positions([cluster], self.positions)[0]
        second = create_new_positions([cluster], self.positions)[0]
        self.assertEqual(first.position_name, "aigc应用工程师")
        self.assertEqual(first.position_id, second.position_id)
        self.assertTrue(first.position_id.startswith("AUTO-JP-"))
```

- [ ] **Step 2: Run tests and verify missing module failure**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_new_positions.py -v`

Expected: import failure for new-position functions.

- [ ] **Step 3: Aggregate and cluster unmatched titles**

First aggregate by exact `(normalized_title, function_family, industry_context)` and retain job count, distinct-company count, representative descriptions, and maximum existing-position score. Then fuzzy-merge only aggregated titles whose character n-gram cosine similarity is at least 0.86 and whose function family is identical. Compute cohesion as the mean cosine similarity to the cluster medoid.

Reject any cluster when:

```python
job_count < 10
or distinct_company_count < 3
or cohesion < 0.82
or max_existing_position_score >= 0.62
or cleaned_name == ""
```

- [ ] **Step 4: Create import-compatible position rows**

Use `position_id = "AUTO-JP-" + sha256(cluster_signature).hexdigest()[:12].upper()`. Allocate numeric `id` sequentially after the maximum original `id`. Set `profile_version="1.0"`, `source_module="graduate_recruitment_cluster_v1"`, `status=1`, `is_active=1`, and use the nearest non-conflicting industry catalog only when its industry evidence is positive; otherwise leave `source_industry_catalog_id` empty. Generate `work_summary` from the three most frequent responsibility phrases and `requirements_text` from the three most frequent requirement phrases. Preserve cluster evidence in `new_positions.csv` even though evidence columns are not appended to the database position table.

- [ ] **Step 5: Build new-position relations and run tests**

All eligible jobs in an accepted cluster receive one primary relation to its new position with `match_method="stable_unmatched_cluster_v1"`, `is_new_position=True`, and a score equal to the cluster cohesion capped at 0.95. Existing high-confidence relations take precedence and cannot be replaced by a new-position relation.

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_new_positions.py -v`

Expected: all new-position tests pass.

- [ ] **Step 6: Commit**

```bash
git add recruitment_position_matching/new_positions.py tests/recruitment_position_matching/test_new_positions.py
git commit -m "feat: create positions from stable unmatched clusters"
```

---

### Task 7: Chunked Pipeline, Checkpoints, and Database Artifacts

**Files:**
- Create: `recruitment_position_matching/pipeline.py`
- Modify: `recruitment_position_matching/cli.py`
- Create: `tests/recruitment_position_matching/test_pipeline.py`

**Interfaces:**
- Consumes: all prior Python modules.
- Produces: `run_year(config, year, force=False) -> YearRunSummary`, `finalize_run(config) -> RunSummary`, and the versioned output directory.

- [ ] **Step 1: Write failing resume and reconciliation tests**

```python
class PipelineTests(unittest.TestCase):
    def test_completed_chunk_is_not_reprocessed_without_force(self):
        first = run_year(self.config, 2025)
        second = run_year(self.config, 2025)
        self.assertEqual(first.processed_chunks, 2)
        self.assertEqual(second.processed_chunks, 0)
        self.assertEqual(second.skipped_chunks, 2)

    def test_source_rows_reconcile_to_valid_duplicate_and_invalid(self):
        summary = run_year(self.config, 2025, force=True)
        self.assertEqual(
            summary.source_rows,
            summary.valid_unique_rows + summary.duplicate_rows + summary.invalid_rows,
        )

    def test_each_job_has_at_most_three_formal_relations(self):
        run_year(self.config, 2025, force=True)
        relations = pd.read_parquet(self.output / "job_position_relations/year=2025")
        self.assertLessEqual(relations.groupby("jd_id").size().max(), 3)

    def test_duplicate_key_is_detected_across_chunk_boundary(self):
        summary = run_year(self.config_with_cross_chunk_duplicate, 2025, force=True)
        self.assertEqual(summary.duplicate_rows, 1)
```

- [ ] **Step 2: Run tests and verify missing pipeline failure**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_pipeline.py -v`

Expected: import failure for pipeline functions.

- [ ] **Step 3: Implement chunk orchestration and checkpoint manifests**

For each year, stream 50,000 rows per chunk and write:

```text
normalized_jobs/year=YYYY/part-00000.parquet
match_candidates_audit/year=YYYY/part-00000.parquet
job_position_relations/year=YYYY/part-00000.parquet
review_medium/year=YYYY/part-00000.parquet
unmatched_jobs/year=YYYY/part-00000.parquet
manifests/year=YYYY/part-00000.json
```

Each chunk manifest contains source fingerprint, chunk index, source row range, row counts by outcome, output filenames, output SHA-256 hashes, config hash, and completion timestamp. Resume skips a chunk only when the source/config hashes and all output hashes match.

Maintain cross-chunk and cross-year duplicate state in `state/dedupe.sqlite` using a table with `duplicate_key TEXT PRIMARY KEY`, first `jd_id`, first year, and first source-row coordinates. Insert with `ON CONFLICT DO NOTHING`; a non-inserted key is a duplicate. Commit once per source chunk and store the SQLite state fingerprint in the chunk manifest so resume behavior remains auditable without holding all duplicate keys in memory.

- [ ] **Step 4: Implement yearly and final CSV exports**

After every year succeeds, concatenate that year's formal relations into `job_position_jd_csv/YYYY.csv` with the exact bridge columns. `finalize` aggregates unmatched titles across all years before new-position creation, rewrites the affected formal relations, then exports `job_position_extended.csv` and `new_positions.csv`. The polished review workbook remains the only generated XLSX artifact and includes the complete extended position table as one sheet.

- [ ] **Step 5: Implement pilot and run commands**

`pilot --year 2025` processes the first 20,000 source rows into `outputs/recruitment_position_matching/v1/pilot/` and never marks the full year complete. `run --year YYYY` processes one year. `run` with no year processes all twelve years in ascending order. `--force` invalidates only the requested year or pilot area.

- [ ] **Step 6: Run pipeline tests and a real pilot**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_pipeline.py -v
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli pilot --year 2025 --config configs/recruitment_position_matching_v1.json --force
```

Expected: tests pass; pilot reports 20,000 source rows and all five outcome datasets plus a manifest.

- [ ] **Step 7: Commit**

```bash
git add recruitment_position_matching/pipeline.py recruitment_position_matching/cli.py tests/recruitment_position_matching/test_pipeline.py
git commit -m "feat: add resumable yearly matching pipeline"
```

---

### Task 8: Calibration, QA, and Acceptance Gates

**Files:**
- Create: `recruitment_position_matching/qa.py`
- Modify: `recruitment_position_matching/cli.py`
- Create: `tests/recruitment_position_matching/test_qa.py`

**Interfaces:**
- Consumes: pilot or full-run Parquet datasets and manifests.
- Produces: stratified review samples, `qa/summary.json`, `qa/acceptance.json`, and `qa/summary.md`.

- [ ] **Step 1: Write failing QA tests**

```python
class QaTests(unittest.TestCase):
    def test_stratified_sample_is_deterministic(self):
        a = stratified_sample(self.candidates, n_per_stratum=5, seed=20260714)
        b = stratified_sample(self.candidates, n_per_stratum=5, seed=20260714)
        pd.testing.assert_frame_equal(a, b)

    def test_acceptance_rejects_orphan_position_ids(self):
        result = validate_relations(self.relations_with_orphan, self.jobs, self.positions)
        self.assertFalse(result.passed)
        self.assertIn("orphan_position_id", result.failures)

    def test_acceptance_rejects_new_position_below_hard_limits(self):
        result = validate_new_positions(self.invalid_new_positions)
        self.assertIn("new_position_min_companies", result.failures)
```

- [ ] **Step 2: Run tests and verify missing QA module failure**

Run: `.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_qa.py -v`

Expected: import failure for QA functions.

- [ ] **Step 3: Implement deterministic stratified samples and metrics**

Sample by year, source, confidence tier, match method, multi-position count, and same-name-cross-industry flag. Calculate source records, valid unique records, duplicates, invalid records, formally matched jobs, formal relation count, medium review count, unmatched count, new-position count, and covered jobs. Always report both asset count and relation count.

- [ ] **Step 4: Implement calibration procedure**

Export 300 pilot candidates across score bins `[0.00,0.50)`, `[0.50,0.62)`, `[0.62,0.70)`, `[0.70,0.78)`, `[0.78,0.86)`, and `[0.86,1.00]`, balanced across common job families and same-name catalog cases. Review and label them as `correct`, `incorrect`, or `ambiguous` in `qa/calibration_labels.csv`. Evaluate high thresholds from 0.70 through 0.90 in 0.02 increments and choose the lowest threshold with at least 93% precision among labeled non-ambiguous samples; choose the medium threshold as the lowest threshold with at least 80% precision. Keep `primary_margin >= 0.06`. Record the chosen values and evidence counts in `qa/calibration.json`, then update the config before the full run.

- [ ] **Step 5: Implement final acceptance gates**

`qa` exits nonzero unless all of these pass:

```text
source_rows == valid_unique_rows + duplicate_rows + invalid_rows
formal relations reference known jd_id and extended position_id
primary relations per jd_id <= 1
all formal relations per jd_id <= 3
medium-confidence rows absent from bridge CSV
every new position has job_count >= 10
every new position has distinct_company_count >= 3
all twelve year manifests complete and hash-valid
bridge CSV column order equals the reference schema
```

- [ ] **Step 6: Run tests, run pilot QA, and commit**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_qa.py -v
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli qa --config configs/recruitment_position_matching_v1.json
```

Expected: unit tests pass; pilot QA produces summary and calibration sample. Full-run manifest completeness may remain false until Task 10 and must be clearly labeled `pilot_only`, not silently passed.

```bash
git add recruitment_position_matching/qa.py recruitment_position_matching/cli.py tests/recruitment_position_matching/test_qa.py
git commit -m "feat: add recruitment matching quality gates"
```

---

### Task 9: Review Workbook with Artifact Tool

**Files:**
- Create: `scripts/build_recruitment_position_review.mjs`
- Create: `tests/recruitment_position_matching/test_workbook_inputs.py`

**Interfaces:**
- Consumes: compact CSV/JSON review inputs produced by `qa.py`.
- Produces: `outputs/recruitment_position_matching/v1/recruitment_position_matching_review.xlsx`.

- [ ] **Step 1: Read the required spreadsheet references before authoring**

Read completely:

```text
/Users/liuhongzhe/.codex/plugins/cache/openai-primary-runtime/spreadsheets/26.709.11516/skills/spreadsheets/style_guidelines.md
/Users/liuhongzhe/.codex/plugins/cache/openai-primary-runtime/spreadsheets/26.709.11516/skills/spreadsheets/API_QUICK_START.md
```

Use the bundled Node executable and the existing root `node_modules` symlink. Confirm `import('@oai/artifact-tool')` succeeds; if not, stop and report the workbook-authoring blocker instead of substituting another XLSX library.

- [ ] **Step 2: Write failing workbook-input tests**

```python
class WorkbookInputTests(unittest.TestCase):
    def test_review_tables_respect_excel_row_limit(self):
        tables = build_workbook_inputs(self.run_dir)
        for name, rows in tables.items():
            self.assertLess(len(rows), 1_048_576, name)

    def test_required_sheets_have_rows_and_field_definitions(self):
        tables = build_workbook_inputs(self.run_dir)
        self.assertIn("汇总说明", tables)
        self.assertIn("中置信度待复核", tables)
        self.assertIn("字段说明", tables)
```

- [ ] **Step 3: Create compact workbook inputs**

`qa.py` must output UTF-8 CSV/JSON inputs for these sheets:

```text
汇总说明
中置信度待复核
高置信度抽样
多岗位匹配抽样
同名跨产业抽样
扩展岗位表
新增岗位
未匹配抽样
字段说明
```

Limit detailed sample sheets to 20,000 rows each, sorted by year and score, while keeping full data in Parquet/CSV artifacts.

- [ ] **Step 4: Build and format the workbook**

The `.mjs` builder must create all nine sheets, freeze header rows, enable filters, use a dark-blue header with white text, set typed count/percentage/date formats, wrap descriptions, cap description columns at 60 characters, and add conditional formatting for confidence levels and review decisions. `扩展岗位表` contains all original and newly created position rows. `汇总说明` must contain formulas referencing summary input cells for formal match rate, multi-position rate, medium-review rate, and unmatched rate.

Run with:

```bash
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build_recruitment_position_review.mjs outputs/recruitment_position_matching/v1
```

- [ ] **Step 5: Inspect, scan, render, and export**

Inside the builder, inspect `汇总说明!A1:H30` and `中置信度待复核!A1:N20`, scan the workbook for `#REF!|#DIV/0!|#VALUE!|#NAME?|#N/A`, render at least one range from every sheet, and save the rendered previews under `/tmp/recruitment-position-review-render/`. Export exactly one final workbook to `outputs/recruitment_position_matching/v1/recruitment_position_matching_review.xlsx`.

- [ ] **Step 6: Run workbook tests, visually review previews, and commit**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m unittest tests/recruitment_position_matching/test_workbook_inputs.py -v
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build_recruitment_position_review.mjs outputs/recruitment_position_matching/v1
```

Expected: tests pass, formula-error scan returns zero results, all nine rendered previews are legible, and the final XLSX opens successfully.

```bash
git add recruitment_position_matching/qa.py scripts/build_recruitment_position_review.mjs tests/recruitment_position_matching/test_workbook_inputs.py
git commit -m "feat: build recruitment matching review workbook"
```

---

### Task 10: Pilot Review, Full Run, Final Verification, and Handoff

**Files:**
- Modify: `configs/recruitment_position_matching_v1.json` only if calibration selects different thresholds.
- Create: `outputs/recruitment_position_matching/v1/README.md`
- Generated: all Parquet, CSV, JSON, Markdown, and XLSX outputs under the version directory.

**Interfaces:**
- Consumes: completed pipeline, calibration evidence, and workbook builder.
- Produces: final verified dataset and user handoff.

- [ ] **Step 1: Run all unit tests before the full dataset**

Run: `.venv-recruitment-position-matching/bin/python -m unittest discover -s tests/recruitment_position_matching -v`

Expected: all tests pass with zero failures and zero errors.

- [ ] **Step 2: Review the 2025 pilot and finalize calibrated thresholds**

Inspect the 300-row calibration sample, save explicit labels, run the threshold grid, and update only the threshold values justified by `qa/calibration.json`. Rerun the pilot and require the high-confidence labeled precision gate of at least 93% before starting all years.

- [ ] **Step 3: Run all twelve years with resumable checkpoints**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli run --config configs/recruitment_position_matching_v1.json
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli finalize --config configs/recruitment_position_matching_v1.json
```

Expected: each year reports complete; finalize creates extended positions, new-position evidence, yearly bridge CSVs, all Parquet partitions, and final manifests.

- [ ] **Step 4: Run final QA and workbook build**

Run:

```bash
.venv-recruitment-position-matching/bin/python -m recruitment_position_matching.cli qa --config configs/recruitment_position_matching_v1.json
/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build_recruitment_position_review.mjs outputs/recruitment_position_matching/v1
```

Expected: `qa/acceptance.json` has `"passed": true`; workbook verification has no formula errors and all sheets render legibly.

- [ ] **Step 5: Write the output inventory and import order**

`README.md` must record source fingerprints, chosen thresholds, total counts, run timestamps, code commit, config hash, artifact paths, and this import order:

```text
1. job_position_extended.csv (new AUTO-JP rows only when importing into an existing database)
2. normalized_jobs / the corresponding JD import table
3. job_position_jd_csv/YYYY.csv in ascending year order
4. keep audit/review artifacts outside production tables
```

It must also explain that `job_position_extended.csv` contains all original positions plus new positions, while `new_positions.csv` contains only additions.

- [ ] **Step 6: Verify artifacts without loading full datasets into memory**

Use PyArrow dataset metadata and streaming CSV checks to verify file readability, row totals, column order, orphan-free foreign keys, per-JD relation limits, and checksums. Confirm the final workbook exists and is non-empty.

- [ ] **Step 7: Commit reproducible code and small metadata only**

Do not commit generated output data, including the small generated metadata kept under the ignored output directory. Commit only the calibrated configuration when its thresholds changed:

```bash
git add configs/recruitment_position_matching_v1.json
git commit -m "chore: record calibrated recruitment thresholds"
```

- [ ] **Step 8: Deliver the result**

Lead with source-record count, formally matched recruitment count, formal relation count, medium-review count, new-position count, and unmatched count. Link the final review workbook, output `README.md`, extended position file, new-position file, and yearly bridge CSV directory. State the exact QA result and any remaining limitations.

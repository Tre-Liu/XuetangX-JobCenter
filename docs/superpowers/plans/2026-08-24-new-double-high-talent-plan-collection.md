# 2025 New Double-High Talent Plan Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a resumable, evidence-preserving collector that downloads official 2025 talent-training plans for every verified member major in the 280 second-phase Double-High professional groups, beginning with a stratified 10-school pilot.

**Architecture:** A Python 3 standard-library package reads verified CSV baselines, discovers candidates only inside seeded official domains, classifies year/document evidence, downloads validated attachments, and atomically writes manifests, gaps, hashes, and JSONL events to `/Volumes/新加卷/vocational_colleges/2025/new_double_high/`. A volume guard verifies a persistent marker plus mount-device identity before and during writes, stops safely on disconnect, records a local fallback alert, and raises both terminal and macOS notifications.

**Tech Stack:** Python 3 (`dataclasses`, `csv`, `urllib`, `urllib.robotparser`, `html.parser`, `hashlib`, `shutil`, `subprocess`, `unittest`), CSV/JSONL, macOS Notification Center, exFAT external storage.

**Spec:** `docs/superpowers/specs/2026-08-24-new-double-high-talent-plan-collection-design.md`

## Global Constraints

- Accept only PDF, DOC, DOCX, XLS, XLSX files published by a verified school or education-authority domain.
- A record is `downloaded_official_2025` only when the page, title, filename, or document evidence proves it applies to the 2025 cohort/version.
- Do not use 2024 or earlier plans as substitutes; record a gap instead.
- Third-party lists are discovery inputs only; every school-group and group-major relation needs an official evidence URL before download completion.
- Do not bypass login, CAPTCHA, paywall, robots rules, or access controls.
- Per-domain concurrency is 1 and the delay between requests is at least 1 second.
- Retry HTTP 429 and 503 at most 3 times with exponential backoff.
- Refuse individual files larger than 200 MB and stop all new downloads when the external volume free space falls below 30 GB.
- Verify `/Volumes/新加卷` with both `.renpei-volume-id` and `st_dev` at startup, before each download, before each streamed write, and at least every 5 seconds.
- On volume disconnect, stop new requests, preserve `.part` state, append an alert to `work/new-double-high-collector-runtime/alerts.jsonl`, show a macOS notification, and exit 74.
- Preserve original filenames, SHA-256 values, source page URLs, attachment URLs, publication dates, and fetch times.
- Do not delete existing external-volume files or overwrite different-content files with the same name.
- Do not depend on Unix permissions, hard links, symbolic links, or extended attributes because the external volume is exFAT.
- The pilot covers 10 stratified schools; nationwide execution starts only after pilot QA passes.
- Implementation occurs in an isolated `codex/new-double-high-collector` worktree because the main worktree contains unrelated user changes.

---

## File Map

- Create `tools/new-double-high-collector/new_double_high_collector/models.py`: immutable row models and enum-like status constants.
- Create `tools/new-double-high-collector/new_double_high_collector/baseline.py`: CSV loading, cross-file validation, and pilot selection validation.
- Create `tools/new-double-high-collector/new_double_high_collector/http_client.py`: robots-aware, rate-limited HTTP client and disk guard.
- Create `tools/new-double-high-collector/new_double_high_collector/volume_guard.py`: marker/device verification, heartbeat checks, fallback alerts, and macOS notification.
- Create `tools/new-double-high-collector/new_double_high_collector/discovery.py`: same-domain sitemap/page discovery and attachment extraction.
- Create `tools/new-double-high-collector/new_double_high_collector/classifier.py`: 2025/year/type/major evidence classification.
- Create `tools/new-double-high-collector/new_double_high_collector/catalog.py`: atomic CSV writes and append-only JSONL events.
- Create `tools/new-double-high-collector/new_double_high_collector/downloader.py`: signature checks, SHA-256 dedupe, safe path creation, and quarantine.
- Create `tools/new-double-high-collector/new_double_high_collector/qa.py`: manifest/gap/source/file consistency checks and summary generation.
- Create `tools/new-double-high-collector/new_double_high_collector/cli.py`: `validate-baseline`, `discover`, `download`, and `qa` commands.
- Create `tools/new-double-high-collector/data/pilot/*.csv`: verified 10-school pilot baselines and manually reviewed candidate seeds.
- Create `tools/new-double-high-collector/tests/`: standard-library unit and local HTTP integration tests.
- Create `tools/new-double-high-collector/README.md`: local test, external-volume setup, resume, notification, and live-run commands.
- Modify `.gitignore`: ignore `work/new-double-high-collector-runtime/` fallback runtime alerts.

---

### Task 1: Create the collector package and strict baseline models

**Files:**
- Create: `tools/new-double-high-collector/new_double_high_collector/__init__.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/models.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/baseline.py`
- Create: `tools/new-double-high-collector/tests/test_baseline.py`

**Interfaces:**
- Consumes: `institutions.csv`, `professional_groups.csv`, `group_majors.csv` encoded as UTF-8 with headers from the spec.
- Produces: `Baseline.load(root: Path) -> Baseline`, `Baseline.validate() -> list[str]`, and dataclasses `Institution`, `ProfessionalGroup`, `GroupMajor`.

- [ ] **Step 1: Write failing baseline tests**

```python
def test_baseline_requires_official_evidence_for_verified_rows(self):
    root = write_baseline(
        institutions=[["I001", "北京", "示例职业学院", "https://www.example.edu.cn", "示例学院"]],
        groups=[["G001", "I001", "high_level_group", "智能制造专业群", "", "verified"]],
        majors=[["G001", "460301", "机电一体化技术", "https://www.example.edu.cn/group.pdf", "verified"]],
    )
    errors = Baseline.load(root).validate()
    self.assertIn("G001: verified group requires official evidence URL", errors)

def test_baseline_rejects_major_without_parent_group(self):
    root = write_baseline(institutions=[], groups=[], majors=[["G404", "460301", "机电一体化技术", "https://example.edu.cn/a", "verified"]])
    errors = Baseline.load(root).validate()
    self.assertIn("G404/460301: missing parent group", errors)
```

- [ ] **Step 2: Run the tests and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_baseline.py -v`

Expected: import failure for `new_double_high_collector.baseline`.

- [ ] **Step 3: Implement models and baseline validation**

Define these exact dataclasses and statuses:

```python
@dataclass(frozen=True)
class Institution:
    institution_code: str
    province: str
    institution_name: str
    official_domain: str
    aliases: tuple[str, ...]

@dataclass(frozen=True)
class ProfessionalGroup:
    group_id: str
    institution_code: str
    project_type: str
    group_name: str
    group_evidence_url: str
    verification_status: str

@dataclass(frozen=True)
class GroupMajor:
    group_id: str
    major_code: str
    major_name: str
    membership_evidence_url: str
    verification_status: str
```

`Baseline.validate()` must reject duplicate IDs, missing parents, non-HTTPS official domains unless the site is proven HTTP-only, invalid project types, verified rows without official evidence, and verified major codes that are not six digits.

- [ ] **Step 4: Run the baseline tests and verify green**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_baseline.py -v`

Expected: all baseline tests pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add tools/new-double-high-collector/new_double_high_collector tools/new-double-high-collector/tests/test_baseline.py
git commit -m "feat: add double-high collection baseline models"
```

---

### Task 2: Add the robots-aware HTTP client and external-volume guard

**Files:**
- Create: `tools/new-double-high-collector/new_double_high_collector/http_client.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/volume_guard.py`
- Create: `tools/new-double-high-collector/tests/test_http_client.py`
- Create: `tools/new-double-high-collector/tests/test_volume_guard.py`

**Interfaces:**
- Consumes: absolute HTTP(S) URL, external-volume root, local fallback-alert root, request policy.
- Produces: `HttpClient.fetch(url: str) -> HttpResponse`, `HttpClient.allowed(url: str) -> bool`, `VolumeGuard.initialize() -> VolumeIdentity`, `VolumeGuard.check() -> None`, and `ensure_disk_space(path: Path, minimum_free_bytes: int) -> None`.

`HttpResponse` exposes `url: str`, `status: int`, `headers: Mapping[str, str]`, `stream: BinaryIO`, and `attempts: int`. Tests close every stream through a context manager.

`VolumeIdentity` is a frozen dataclass with `marker: str`, `st_dev: int`, and `mount_path: str`. `VolumeGuard.check()` raises `VolumeDisconnected` when the path, marker, or `st_dev` differs from initialization.

- [ ] **Step 1: Write failing HTTP policy tests with a local server and fake clock**

```python
def test_robots_denial_prevents_request(self):
    client = HttpClient(user_agent="RenpeiCollector/1.0", sleeper=lambda _: None)
    client._robots[self.base_url] = FakeRobots(allowed=False)
    with self.assertRaises(RobotsDenied):
        client.fetch(self.base_url + "/private/plan.pdf")

def test_retry_after_503_is_capped_at_three_retries(self):
    response = self.fetch_sequence([503, 503, 503, 503])
    self.assertEqual(response.attempts, 4)
    self.assertEqual(self.request_count, 4)

def test_disk_guard_stops_below_thirty_gib(self):
    with mock.patch("shutil.disk_usage", return_value=(100, 80, 20 * 1024**3)):
        with self.assertRaises(DiskSpaceStop):
            ensure_disk_space(Path("/tmp"), 30 * 1024**3)

def test_volume_guard_rejects_same_path_on_different_device(self):
    guard = VolumeGuard(self.volume, self.alerts, notifier=self.notifications.append)
    guard.initialize()
    with mock.patch("pathlib.Path.stat", return_value=SimpleNamespace(st_dev=guard.identity.st_dev + 1)):
        with self.assertRaises(VolumeDisconnected):
            guard.check()

def test_disconnect_writes_local_alert_and_notifies(self):
    guard = VolumeGuard(self.volume, self.alerts, notifier=self.notifications.append)
    guard.initialize()
    (self.volume / ".renpei-volume-id").unlink()
    with self.assertRaises(VolumeDisconnected):
        guard.check()
    self.assertIn("storage_disconnected", self.alerts.read_text(encoding="utf-8"))
    self.assertEqual(len(self.notifications), 1)
```

- [ ] **Step 2: Run the HTTP tests and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_http_client.py tools/new-double-high-collector/tests/test_volume_guard.py -v`

Expected: import failures for `new_double_high_collector.http_client` and `new_double_high_collector.volume_guard`.

- [ ] **Step 3: Implement the HTTP client**

Implement a descriptive `User-Agent`, `urllib.robotparser`, one request at a time per hostname, a monotonic-clock delay of at least 1 second, 10/20/40-second retry backoff for 429/503, a 30-second socket timeout, and response streaming. Reject non-HTTP(S) URLs and redirects that leave the verified official domain unless explicitly allow-listed by the baseline.

- [ ] **Step 4: Implement the volume guard and notifications**

Create `.renpei-volume-id` once with a UUID, store its value and the root directory `st_dev`, and recheck both before every download plus once per streamed chunk when 5 seconds have elapsed. On mismatch, append a UTF-8 JSONL `storage_disconnected` event to `work/new-double-high-collector-runtime/alerts.jsonl`, write a prominent stderr message, call `osascript -e 'display notification ...'` through a fixed argument list, and raise `VolumeDisconnected`. Notification failure must not hide the disconnect exception.

- [ ] **Step 5: Run the HTTP and volume tests and verify green**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_http_client.py tools/new-double-high-collector/tests/test_volume_guard.py -v`

Expected: all HTTP and volume-guard tests pass without internet access or real notifications.

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/new-double-high-collector/new_double_high_collector/http_client.py tools/new-double-high-collector/new_double_high_collector/volume_guard.py tools/new-double-high-collector/tests/test_http_client.py tools/new-double-high-collector/tests/test_volume_guard.py
git commit -m "feat: guard collection HTTP and external storage"
```

---

### Task 3: Implement same-domain discovery and candidate classification

**Files:**
- Create: `tools/new-double-high-collector/new_double_high_collector/discovery.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/classifier.py`
- Create: `tools/new-double-high-collector/tests/fixtures/discovery/index.html`
- Create: `tools/new-double-high-collector/tests/fixtures/discovery/notice.html`
- Create: `tools/new-double-high-collector/tests/test_discovery.py`
- Create: `tools/new-double-high-collector/tests/test_classifier.py`

**Interfaces:**
- Consumes: verified `Institution`, `ProfessionalGroup`, `GroupMajor`, seed page URLs, and fetched HTML.
- Produces: `discover_candidates(...) -> list[Candidate]` and `classify_candidate(candidate, group_major) -> Classification`.

Use these exact immutable shapes:

```python
@dataclass(frozen=True)
class Candidate:
    group_id: str
    major_code: str
    title: str
    link_text: str
    filename: str
    page_text: str
    source_page_url: str
    download_url: str

@dataclass(frozen=True)
class Classification:
    status: str
    year_evidence: str
    major_evidence: str
    document_evidence: str
    notes: str
```

- [ ] **Step 1: Write failing discovery and classifier tests**

```python
def test_discovery_keeps_official_attachment_and_rejects_external_reprint(self):
    candidates = discover_from_html(
        page_url="https://jwc.example.edu.cn/notice/1.html",
        html='''<a href="/files/2025-460301.pdf">2025级人才培养方案</a>
                <a href="https://wenku.example.com/copy.pdf">转载</a>''',
        official_hosts={"example.edu.cn"},
    )
    self.assertEqual([c.download_url for c in candidates], ["https://jwc.example.edu.cn/files/2025-460301.pdf"])

def test_classifier_requires_2025_and_major_evidence(self):
    classification = classify_candidate(
        Candidate(title="机电一体化技术2025级人才培养方案", filename="460301.pdf", page_text="", source_page_url="https://jwc.example.edu.cn/a", download_url="https://jwc.example.edu.cn/a.pdf"),
        GroupMajor("G001", "460301", "机电一体化技术", "https://jwc.example.edu.cn/group", "verified"),
    )
    self.assertEqual(classification.status, "eligible_official_2025")
```

- [ ] **Step 2: Run discovery/classifier tests and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_discovery.py tools/new-double-high-collector/tests/test_classifier.py -v`

Expected: import failures for discovery/classifier modules.

- [ ] **Step 3: Implement bounded discovery**

Use `html.parser.HTMLParser` to extract links. Follow only seeded pages, sitemap URLs, and same-official-domain pages containing one of: `人才培养方案`, `培养方案`, `2025级`, `2025版`, the six-digit major code, or the exact major name. Limit page depth to 2 and visited HTML pages to 500 per institution. Never follow logout, login, search-result pagination without a configured seed, or non-official domains.

- [ ] **Step 4: Implement evidence classification**

Return one of `eligible_official_2025`, `year_ambiguous`, `wrong_year`, `wrong_document_type`, `major_mismatch`, or `non_official_excluded`. Require both a 2025 marker and either exact major code or normalized major name across page title, link text, filename, or nearby page text. Treat `2024-2025学年` alone as ambiguous rather than 2025-cohort proof.

- [ ] **Step 5: Run discovery/classifier tests and verify green**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_discovery.py tools/new-double-high-collector/tests/test_classifier.py -v`

Expected: all tests pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add tools/new-double-high-collector/new_double_high_collector/discovery.py tools/new-double-high-collector/new_double_high_collector/classifier.py tools/new-double-high-collector/tests
git commit -m "feat: discover and classify official 2025 plans"
```

---

### Task 4: Add safe downloading, signatures, dedupe, and atomic catalogs

**Files:**
- Create: `tools/new-double-high-collector/new_double_high_collector/catalog.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/downloader.py`
- Create: `tools/new-double-high-collector/tests/test_catalog.py`
- Create: `tools/new-double-high-collector/tests/test_downloader.py`

**Interfaces:**
- Consumes: eligible `Candidate`, `Institution`, `ProfessionalGroup`, `GroupMajor`, external-volume root, initialized `VolumeGuard`.
- Produces: `DownloadRecord`, `GapRecord`, `download_candidate(...) -> DownloadRecord`, `Catalog.upsert_manifest(...)`, `Catalog.upsert_gap(...)`, `Catalog.append_event(...)`.

`DownloadRecord` contains the exact `manifest.csv` fields from spec section 8.3. `GapRecord` contains the exact `gaps.csv` fields from spec section 8.4. Both are frozen dataclasses and expose `to_row() -> dict[str, str]`; `file_size_bytes` is serialized as a base-10 integer string.

- [ ] **Step 1: Write failing downloader/catalog tests**

```python
def test_pdf_magic_is_required_even_when_content_type_claims_pdf(self):
    response = FakeResponse(body=b"<html>login</html>", headers={"Content-Type": "application/pdf"})
    with self.assertRaises(FileSignatureMismatch):
        download_candidate(self.context, response, self.root)

def test_same_filename_different_hash_gets_hash_suffix(self):
    first = store_bytes(self.context, b"%PDF-1.7\nfirst", "plan.pdf", self.root)
    second = store_bytes(self.context, b"%PDF-1.7\nsecond", "plan.pdf", self.root)
    self.assertNotEqual(first.relative_path, second.relative_path)
    self.assertTrue(second.relative_path.endswith("__a5bd426d.pdf"))

def test_manifest_write_is_atomic(self):
    catalog = Catalog(self.root)
    catalog.upsert_manifest(self.record)
    self.assertFalse((self.root / "_catalog/manifest.csv.tmp").exists())
    self.assertEqual(read_rows(self.root / "_catalog/manifest.csv")[0]["record_id"], self.record.record_id)
```

- [ ] **Step 2: Run downloader/catalog tests and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_downloader.py tools/new-double-high-collector/tests/test_catalog.py -v`

Expected: import failures for downloader/catalog modules.

- [ ] **Step 3: Implement safe file storage**

Recognize `%PDF-`, OLE compound files for DOC/XLS, and ZIP-based OOXML for DOCX/XLSX. Stream to a `.part` file, call `VolumeGuard.check()` before writes and at least every 5 seconds during streaming, enforce the 200 MB limit, calculate SHA-256 while streaming, fsync, then atomically rename. Sanitize path segments without losing Chinese names. If the target filename exists with another hash, append the first eight SHA-256 characters before the extension. Do not use hard links for SHA-256 dedupe on exFAT.

- [ ] **Step 4: Implement atomic catalogs and append-only events**

Write `manifest.csv` and `gaps.csv` through same-directory temporary files plus `os.replace`. Keep stable field order from the spec. Append UTF-8 JSON objects to `_logs/events.jsonl` and `_logs/errors.jsonl`, with `event_type`, `record_id`, `url`, `timestamp`, and `details`.

- [ ] **Step 5: Run downloader/catalog tests and verify green**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_downloader.py tools/new-double-high-collector/tests/test_catalog.py -v`

Expected: all tests pass.

- [ ] **Step 6: Commit Task 4**

```bash
git add tools/new-double-high-collector/new_double_high_collector/catalog.py tools/new-double-high-collector/new_double_high_collector/downloader.py tools/new-double-high-collector/tests
git commit -m "feat: store and catalog official talent plans safely"
```

---

### Task 5: Add CLI orchestration, resume behavior, and QA

**Files:**
- Create: `tools/new-double-high-collector/new_double_high_collector/qa.py`
- Create: `tools/new-double-high-collector/new_double_high_collector/cli.py`
- Create: `tools/new-double-high-collector/tests/test_cli.py`
- Create: `tools/new-double-high-collector/tests/test_qa.py`

**Interfaces:**
- Consumes: baseline root, output root, optional institution IDs.
- Produces: CLI commands and `run_qa(root: Path, baseline: Baseline) -> QaReport`.

`QaReport` exposes `errors: list[str]`, `institutions_checked: int`, `groups_checked: int`, `majors_checked: int`, `downloaded_records: int`, `gaps_by_status: dict[str, int]`, and `downloaded_bytes: int`, plus `to_json() -> dict[str, object]`.

- [ ] **Step 1: Write failing CLI and QA tests**

```python
def test_resume_skips_completed_url_and_hash(self):
    result = run_cli(["download", "--baseline", str(self.baseline), "--output", str(self.output), "--resume"])
    self.assertEqual(result.exit_code, 0)
    self.assertEqual(self.http_requests_for_completed_url, 0)

def test_qa_requires_each_verified_major_to_have_manifest_or_gap(self):
    report = run_qa(self.output, self.baseline)
    self.assertIn("G001/460301 has no terminal state", report.errors)
```

- [ ] **Step 2: Run CLI/QA tests and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_cli.py tools/new-double-high-collector/tests/test_qa.py -v`

Expected: import failures for CLI/QA modules.

- [ ] **Step 3: Implement the CLI**

Expose these commands:

```text
python3 -m new_double_high_collector.cli init-volume --output <external-dir>
python3 -m new_double_high_collector.cli check-volume --output <external-dir>
python3 -m new_double_high_collector.cli validate-baseline --baseline <dir>
python3 -m new_double_high_collector.cli discover --baseline <dir> --output <dir> [--institution I001]
python3 -m new_double_high_collector.cli download --baseline <dir> --output <dir> --resume [--institution I001]
python3 -m new_double_high_collector.cli qa --baseline <dir> --output <dir>
```

Return exit code 0 only when the requested operation finishes without policy or validation errors. Catch `VolumeDisconnected`, write the fallback alert, and exit 74. Catch `DiskSpaceStop`, log `disk_space_stop`, and exit 75 so an operator can distinguish disconnect, capacity stop, and data failure.

- [ ] **Step 4: Implement QA and `run_summary.json`**

QA must detect missing terminal states, non-official domains, missing files, size/hash mismatches, duplicate record IDs, invalid statuses, wrong-year inclusions, and manifest/gap overlap. Write counts for institutions, groups, majors, candidates, downloaded records, gaps by status, bytes, and errors.

- [ ] **Step 5: Run CLI/QA tests and verify green**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_cli.py tools/new-double-high-collector/tests/test_qa.py -v`

Expected: all tests pass.

- [ ] **Step 6: Commit Task 5**

```bash
git add tools/new-double-high-collector/new_double_high_collector/qa.py tools/new-double-high-collector/new_double_high_collector/cli.py tools/new-double-high-collector/tests
git commit -m "feat: orchestrate and audit talent plan collection"
```

---

### Task 6: Build and verify the 10-school pilot baseline

**Files:**
- Create: `tools/new-double-high-collector/data/pilot/institutions.csv`
- Create: `tools/new-double-high-collector/data/pilot/professional_groups.csv`
- Create: `tools/new-double-high-collector/data/pilot/group_majors.csv`
- Create: `tools/new-double-high-collector/data/pilot/seeds.csv`
- Create: `tools/new-double-high-collector/data/pilot/source_notes.md`
- Test: `tools/new-double-high-collector/tests/test_pilot_data.py`
- Read only: `work/double-high-summary/build_double_high.mjs`
- Read only: `outputs/double-high-schools-20260730/国家及河南省双高汇总.xlsx.inspect.ndjson`

**Interfaces:**
- Consumes: existing 220-school discovery list plus official government/school evidence gathered live.
- Produces: a verified baseline for Beijing, Tianjin, Jiangsu, Zhejiang, Shandong, Guangdong, Henan, Hunan, Chongqing, and Xinjiang pilot schools.

`seeds.csv` uses `institution_code,seed_url,seed_type,evidence_url,verification_status`; `seed_type` is one of `official_home`, `sitemap`, `teaching_affairs`, `double_high_topic`, or `official_search`.

- [ ] **Step 1: Select the fixed stratified pilot schools**

Use these candidates, replacing a school only if official second-phase evidence proves it is not in the final list:

```text
北京科技职业大学
天津市职业大学
无锡职业技术大学
金华职业技术大学
山东商业职业技术学院
深圳职业技术大学
黄河水利职业技术大学
长沙民政职业技术学院
重庆电子科技职业大学
新疆农业职业技术大学
```

- [ ] **Step 2: Write a failing pilot-data test**

```python
def test_pilot_has_ten_verified_schools_and_no_unverified_relations(self):
    baseline = Baseline.load(PILOT_DATA)
    self.assertEqual(len(baseline.institutions), 10)
    self.assertEqual(baseline.validate(), [])
    self.assertTrue(all(group.verification_status == "verified" for group in baseline.groups))
    self.assertTrue(all(major.verification_status == "verified" for major in baseline.majors))
```

- [ ] **Step 3: Run the pilot-data test and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_pilot_data.py -v`

Expected: missing pilot CSV files.

- [ ] **Step 4: Research and record official evidence for each pilot school**

For every school, record the final-list evidence URL, official domain, official group name(s), group-member majors, and at least one official page or sitemap seed. Use the existing `nationalRaw` only to discover names; set `verification_status=verified` only after an official government or school URL is recorded. Put rejected or superseded sources in `source_notes.md` with the reason.

- [ ] **Step 5: Run baseline validation and pilot-data tests**

Run: `PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli validate-baseline --baseline tools/new-double-high-collector/data/pilot`

Expected: exit 0 and `0 baseline errors`.

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_pilot_data.py -v`

Expected: test passes with 10 verified institutions and no unresolved pilot relation.

- [ ] **Step 6: Commit Task 6**

```bash
git add tools/new-double-high-collector/data/pilot tools/new-double-high-collector/tests/test_pilot_data.py
git commit -m "data: add verified double-high pilot baseline"
```

---

### Task 7: Run the full local test suite and a mock-site end-to-end crawl

**Files:**
- Create: `tools/new-double-high-collector/tests/test_end_to_end.py`
- Create: `tools/new-double-high-collector/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: all collector modules and a local temporary HTTP server.
- Produces: a complete mock output tree with one downloaded plan, one gap, consistent logs, and passing QA.

- [ ] **Step 1: Write the failing end-to-end test**

```python
def test_end_to_end_download_and_gap_are_auditable(self):
    run_discovery_and_download(self.baseline, self.server_url, self.output)
    report = run_qa(self.output, Baseline.load(self.baseline))
    self.assertEqual(report.errors, [])
    self.assertEqual(report.downloaded_records, 1)
    self.assertEqual(report.gaps_by_status["not_found_official_2025"], 1)
```

- [ ] **Step 2: Run the test and verify red**

Run: `python3 -m unittest tools/new-double-high-collector/tests/test_end_to_end.py -v`

Expected: failure until the end-to-end fixture and orchestration helper are complete.

- [ ] **Step 3: Complete the fixture, README, and runtime ignore rule**

Document exact test, baseline-validation, external-volume initialization, live crawl, resume, QA, disconnect recovery, notification, disk-space-stop, and log-inspection commands. The end-to-end fixture must serve robots.txt, an index page, one eligible PDF, one wrong-year PDF, and a major with no plan. Add `/work/new-double-high-collector-runtime/` to `.gitignore` so fallback alerts never become source changes.

- [ ] **Step 4: Run all tests**

Run: `PYTHONPATH=tools/new-double-high-collector python3 -m unittest discover -s tools/new-double-high-collector/tests -v`

Expected: all tests pass with no real internet requests.

- [ ] **Step 5: Run static syntax validation**

Run: `python3 -m compileall -q tools/new-double-high-collector/new_double_high_collector tools/new-double-high-collector/tests`

Expected: exit 0 with no output.

- [ ] **Step 6: Commit Task 7**

```bash
git add tools/new-double-high-collector/tests/test_end_to_end.py tools/new-double-high-collector/README.md .gitignore
git commit -m "test: verify double-high collector end to end"
```

---

### Task 8: Initialize the external volume and execute the 10-school live pilot

**Files:**
- Local code: `tools/new-double-high-collector/new_double_high_collector/`
- Local baseline: `tools/new-double-high-collector/data/pilot/`
- External output: `/Volumes/新加卷/vocational_colleges/2025/new_double_high/`
- Local fallback alerts: `work/new-double-high-collector-runtime/alerts.jsonl`

**Interfaces:**
- Consumes: tested package, verified pilot baseline, mounted external volume supplied by the user.
- Produces: live documents, manifests, gaps, JSONL logs, `run_summary.json`, and an operator-visible QA result.

- [ ] **Step 1: Verify the local runtime, mount identity, format, and capacity**

Run locally:

```bash
python3 --version
mount | rg '/Volumes/新加卷'
df -h '/Volumes/新加卷'
stat -f 'device=%d filesystem=%T' '/Volumes/新加卷'
```

Expected: Python 3 is available; the volume is mounted as exFAT with roughly 894 GiB free and a stable device ID.

- [ ] **Step 2: Create the output tree and initialize the volume marker**

Run:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli init-volume --output '/Volumes/新加卷/vocational_colleges/2025/new_double_high'
```

Expected: `documents`, `_catalog`, `_logs`, `_quarantine`, and `.renpei-volume-id` exist; the command reports the stored device ID and exits 0.

- [ ] **Step 3: Run the write-rename-hash smoke test**

Run locally:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli check-volume --output '/Volumes/新加卷/vocational_colleges/2025/new_double_high'
```

Expected: the command creates a temporary file, fsyncs it, renames it, verifies its SHA-256, removes it, verifies the marker/device identity, and exits 0.

- [ ] **Step 4: Validate the pilot baseline**

Run locally:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli validate-baseline --baseline tools/new-double-high-collector/data/pilot
```

Expected: exit 0 and `0 baseline errors`.

- [ ] **Step 5: Run discovery for the pilot while monitoring the volume**

Run locally:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli discover --baseline tools/new-double-high-collector/data/pilot --output '/Volumes/新加卷/vocational_colleges/2025/new_double_high'
```

Expected: each of the 10 institutions reaches a discovery terminal event; site-level blocks are recorded rather than retried indefinitely. If the volume disconnects, exit 74 is returned, a local fallback alert is written, macOS shows a notification, and Codex notifies the user.

- [ ] **Step 6: Download eligible files with resume enabled**

Run locally:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli download --baseline tools/new-double-high-collector/data/pilot --output '/Volumes/新加卷/vocational_colleges/2025/new_double_high' --resume
```

Expected: eligible files enter `documents/`; ambiguous, blocked, missing, or rejected items enter catalog states. Exit 74 is acceptable only for a verified volume disconnect; exit 75 is acceptable only for the 30 GB disk guard.

- [ ] **Step 7: Run QA**

Run locally:

```bash
PYTHONPATH=tools/new-double-high-collector python3 -m new_double_high_collector.cli qa --baseline tools/new-double-high-collector/data/pilot --output '/Volumes/新加卷/vocational_colleges/2025/new_double_high'
```

Expected: `run_summary.json` is written; no official downloaded record has a wrong year, non-official domain, missing file, or hash mismatch.

- [ ] **Step 8: Independently verify counts and sample files**

Run locally:

```bash
find '/Volumes/新加卷/vocational_colleges/2025/new_double_high/documents' -type f | wc -l
du -sh '/Volumes/新加卷/vocational_colleges/2025/new_double_high/documents' '/Volumes/新加卷/vocational_colleges/2025/new_double_high/_catalog' '/Volumes/新加卷/vocational_colleges/2025/new_double_high/_logs' '/Volumes/新加卷/vocational_colleges/2025/new_double_high/_quarantine'
find '/Volumes/新加卷/vocational_colleges/2025/new_double_high/documents' -type f | sort | head -10
```

Open at least 10 downloaded files and compare document title, major, year, and source page against `manifest.csv`.

- [ ] **Step 9: Record pilot findings without claiming nationwide completion**

Report: schools checked, groups verified, member majors verified, downloaded official 2025 plans, gap counts by status, bytes used, blocked sites, and extrapolated nationwide raw-storage range. Do not report a match percentage and do not count unchecked records as gaps or completion.

---

## Plan Self-Review Result

- Spec coverage: baseline authority, group membership, official-only discovery, 2025 evidence, robots/rate limits, retries, 200 MB cap, 30 GB stop, volume identity, 5-second disconnect checks, local fallback alerts, macOS notifications, signatures, exFAT-safe dedupe, atomic catalogs, resume, gaps, logs, pilot stratification, local live execution, and QA are each assigned to a task.
- Scope boundary: this plan ends after the 10-school pilot and its QA report; the 220-school rollout requires pilot approval and a separate execution checkpoint.
- Type consistency: `Baseline`, `Institution`, `ProfessionalGroup`, `GroupMajor`, `Candidate`, `Classification`, `DownloadRecord`, `GapRecord`, `Catalog`, and `QaReport` have one canonical name throughout the plan.

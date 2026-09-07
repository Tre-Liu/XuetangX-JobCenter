# AI Career Matrix Image Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a revised high-fidelity page image that replaces the old “毕业要求 - 指标点” matrix with an AI-major “产业 - 岗位 - 能力 - 课程” card-flow matrix and upgrades the right-side planner drawer with a lightweight岗位能力图谱.

**Architecture:** Work from the approved design spec, treat the provided screenshot as the structural base, and use model-assisted image editing to create a polished static deliverable. Save intermediate and final image assets in a dedicated output directory, then visually verify the result against the spec before finalizing.

**Tech Stack:** Codex built-in image generation/editing, local filesystem asset organization, visual inspection with image preview

---

### Task 1: Prepare worktree deliverable structure

**Files:**
- Create: `major-construction-platform/docs/superpowers/plans/2026-06-01-ai-career-matrix.md`
- Create: `major-construction-platform/outputs/ai-career-matrix/`
- Create: `major-construction-platform/outputs/ai-career-matrix/notes.md`

- [ ] **Step 1: Confirm the worktree branch and directory**

Run: `git branch --show-current`
Expected: `codex/ai-career-matrix`

- [ ] **Step 2: Create the deliverable directory**

Run: `mkdir -p major-construction-platform/outputs/ai-career-matrix`
Expected: command exits with no output

- [ ] **Step 3: Write a short notes file that records source assets and output targets**

Create `major-construction-platform/outputs/ai-career-matrix/notes.md` with:

```md
# AI Career Matrix Output Notes

- Base image source: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/image.png`
- Reference style source: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/素材样例/1e17e1f9fba6fb6d42d5ecd2de0a99b4.png`
- Primary spec: `major-construction-platform/docs/superpowers/specs/2026-06-01-ai-career-matrix-design.md`
- Final output target: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png`
```

- [ ] **Step 4: Verify the notes file exists**

Run: `sed -n '1,80p' major-construction-platform/outputs/ai-career-matrix/notes.md`
Expected: shows the four bullet points above

- [ ] **Step 5: Commit the preparation task**

```bash
git add major-construction-platform/docs/superpowers/plans/2026-06-01-ai-career-matrix.md \
  major-construction-platform/outputs/ai-career-matrix/notes.md
git commit -m "chore: prepare ai career matrix output workspace"
```

### Task 2: Generate the first edited redesign candidate

**Files:**
- Use: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/image.png`
- Use: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/素材样例/1e17e1f9fba6fb6d42d5ecd2de0a99b4.png`
- Create: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-v1.png`

- [ ] **Step 1: Load the base image and style reference into the conversation context**

Action: preview both local images with the image viewer before editing
Expected: the current screenshot and the soft purple-blue reference style are both visible for comparison

- [ ] **Step 2: Generate one edited candidate from the base screenshot**

Use the image editing prompt below:

```text
Edit this existing UI screenshot while preserving the overall page shell, camera angle, proportions, and clean product screenshot quality.

Replace the center “支撑矩阵” content so it becomes an AI major training relationship matrix. Do not keep the old “毕业要求 / 指标点” two-column layout.

New center matrix:
- Use a readable four-column card-flow structure across the center panel
- Columns are: 产业, 岗位, 能力, 课程
- Show multiple cards in each column with clear Chinese labels
- Industries include: 智慧医疗, 智能制造, 智慧城市, AIGC内容服务
- Jobs include: 机器学习工程师, AI应用开发工程师, 计算机视觉工程师, 数据智能工程师, 智能系统运维工程师
- Capabilities include: 数据采集与治理, 模型训练与优化, 视觉/语言智能应用, AI系统部署, 工程化开发协同
- Courses include: Python程序设计, 数据结构与算法, 数据库原理, 机器学习, 深度学习基础, 计算机视觉基础, 自然语言处理导论, AI系统部署实训
- Make the relationships many-to-many with elegant thin curved connector lines and small glowing nodes
- Do not turn it into a dense table; keep it airy and readable
- Typical work tasks, graduation requirements, indicator points, and knowledge points should appear as small supporting labels attached to job, capability, and course cards rather than as full extra columns

Right-side planner drawer:
- Keep the “职业生涯规划师” concept and similar overall size, but make the drawer slightly wider
- Add a compact 岗位能力图谱 section in the lower-middle portion of the drawer
- This mini graph should show job abilities on one side and recommended courses / knowledge tags on the other side, with a few soft connector lines
- Keep the drawer elegant, readable, and subordinate to the center matrix

Style direction:
- Keep the existing light blue-white product UI base
- Lightly borrow the reference image mood: soft purple-blue ambient glow, subtle floating-layer feel, low-saturation glowing nodes
- Do not make it look like a fantasy poster or heavy 3D concept art
- Keep text crisp, product-like, presentation-ready, and believable as an education platform screen

Important constraints:
- This must clearly read as an Artificial Intelligence major page, not materials engineering
- Preserve the left navigation shell and top professional summary area structure
- Keep the screenshot polished, high fidelity, and balanced
```

- [ ] **Step 3: Save the selected generated image into the workspace as `ai-career-matrix-v1.png`**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-v1.png`
Expected: command exits with no output

- [ ] **Step 4: Review the candidate visually**

Action: open `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-v1.png`
Expected: the middle matrix reads as four layers and the right drawer includes the new graph section

- [ ] **Step 5: Commit the first candidate**

```bash
git add major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-v1.png
git commit -m "feat: generate first ai career matrix redesign candidate"
```

### Task 3: Refine the image until it matches the approved spec

**Files:**
- Modify: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-v1.png`
- Create: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png`

- [ ] **Step 1: Compare the first candidate against the spec checklist**

Check these exact points:

- The center reads as `产业 - 岗位 - 能力 - 课程`
- The content is clearly AI-major specific
- The relationship lines show many-to-many links without becoming cluttered
- The right drawer is only slightly wider
- The mini capability graph is visible and readable
- The style only lightly borrows the purple-blue reference mood

Expected: identify the smallest set of fixes needed for one refinement pass

- [ ] **Step 2: Run one targeted edit pass on the generated candidate**

Use a refinement prompt shaped like this, filling in the actual issues found in Step 1:

```text
Edit this generated UI mockup and keep the overall composition.
Fix only these issues:
1. <issue one>
2. <issue two>
3. <issue three>

Do not redesign from scratch. Preserve the center four-column AI matrix, preserve the right planner drawer, and keep the overall light blue education platform style.
```

- [ ] **Step 3: Save the refined result as the final deliverable**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png`
Expected: command exits with no output

- [ ] **Step 4: Perform final visual verification**

Action: open `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png`
Expected:
- center matrix is readable and layered
- drawer contains the compact capability graph and recommendation logic
- no materials-engineering wording remains
- the image is suitable for presentation use

- [ ] **Step 5: Commit the final asset**

```bash
git add major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png
git commit -m "feat: finalize ai career matrix redesign image"
```

### Task 4: Package and verify the deliverable

**Files:**
- Verify: `major-construction-platform/outputs/ai-career-matrix/notes.md`
- Verify: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final.png`

- [ ] **Step 1: List the deliverable files**

Run: `find major-construction-platform/outputs/ai-career-matrix -maxdepth 1 -type f | sort`
Expected: includes `notes.md`, `ai-career-matrix-v1.png`, and `ai-career-matrix-final.png`

- [ ] **Step 2: Check git status for only the expected branch changes**

Run: `git status --short`
Expected: only the plan file, notes file, and image assets are part of this task

- [ ] **Step 3: Record the final branch state**

Run: `git log --oneline -3`
Expected: shows the three task commits for workspace prep, first candidate, and final asset

- [ ] **Step 4: Prepare final handoff summary**

Report:
- final output path
- branch name
- whether one or more refinement passes were needed
- any remaining visual tradeoffs

- [ ] **Step 5: Commit any final metadata change if needed**

If no further file changes were made in Task 4, skip this commit step.

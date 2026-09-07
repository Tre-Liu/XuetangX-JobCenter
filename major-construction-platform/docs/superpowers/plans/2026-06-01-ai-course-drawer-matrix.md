# AI Course Drawer Matrix Image Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a second high-fidelity AI-major image that keeps the course-detail drawer structure, replaces the bottom matrix with the approved AI career matrix, and converts the drawer content into an AI course detail plus岗位能力雷达.

**Architecture:** Treat the provided second screenshot as the structural base, reuse the approved first-image matrix language for the lower matrix, and use model-assisted image editing to transform the course drawer into an AI-course version. Save intermediate and final outputs in a dedicated directory so the user can compare revisions cleanly.

**Tech Stack:** Codex built-in image editing, local filesystem asset management, visual inspection with image preview

---

### Task 1: Prepare the second-image output workspace

**Files:**
- Create: `major-construction-platform/docs/superpowers/plans/2026-06-01-ai-course-drawer-matrix.md`
- Create: `major-construction-platform/outputs/ai-course-drawer-matrix/`
- Create: `major-construction-platform/outputs/ai-course-drawer-matrix/notes.md`

- [ ] **Step 1: Confirm the current branch**

Run: `git branch --show-current`
Expected: `codex/ai-career-matrix`

- [ ] **Step 2: Create the output directory**

Run: `mkdir -p major-construction-platform/outputs/ai-course-drawer-matrix`
Expected: command exits with no output

- [ ] **Step 3: Write the notes file for source assets and targets**

Create `major-construction-platform/outputs/ai-course-drawer-matrix/notes.md` with:

```md
# AI Course Drawer Matrix Output Notes

- Base image source: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/原图/2.png`
- Matrix style source: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final-v4.png`
- Primary spec: `major-construction-platform/docs/superpowers/specs/2026-06-01-ai-course-drawer-matrix-design.md`
- Final output target: `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png`
```

- [ ] **Step 4: Verify the notes file**

Run: `sed -n '1,80p' major-construction-platform/outputs/ai-course-drawer-matrix/notes.md`
Expected: shows the four bullet points above

- [ ] **Step 5: Commit the workspace prep**

```bash
git add major-construction-platform/docs/superpowers/plans/2026-06-01-ai-course-drawer-matrix.md \
  major-construction-platform/outputs/ai-course-drawer-matrix/notes.md
git commit -m "chore: prepare ai course drawer matrix workspace"
```

### Task 2: Generate the first AI-course redraw candidate

**Files:**
- Use: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/原图/2.png`
- Use: `major-construction-platform/outputs/ai-career-matrix/ai-career-matrix-final-v4.png`
- Create: `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-v1.png`

- [ ] **Step 1: Load the second base image and first-image matrix reference**

Action: preview the second base screenshot and the first-image AI matrix result
Expected: both images are visible in the conversation context for aligned editing

- [ ] **Step 2: Generate the first edited candidate**

Use this image editing prompt:

```text
Edit this existing education platform UI screenshot while preserving the page shell, left navigation, overall composition, and clean product screenshot style.

Bottom matrix:
- Replace the old bottom support matrix area with the same AI-major matrix language used in the approved first image
- Use the readable four-column structure: 产业, 岗位, 能力, 课程
- Keep the vertically elongated card-flow layout and elegant many-to-many connector lines
- Industries: 智慧医疗, 智能制造, 智慧城市, AIGC内容服务
- Jobs: 机器学习工程师, AI应用开发工程师, 计算机视觉工程师, 数据智能工程师, 智能系统运维工程师
- Capabilities: 数据采集与治理, 模型训练与优化, 视觉/语言智能应用, AI系统部署, 工程化开发协同
- Courses: Python程序设计, 数据结构与算法, 数据库原理, 机器学习, 深度学习基础, 计算机视觉基础, 自然语言处理导论, AI系统部署实训
- Keep the same soft blue-purple product feel as the first approved image

Right drawer:
- Keep it as a course detail drawer, not a career planner drawer
- Convert all drawer content from materials engineering to AI-major course semantics
- Top should read like an AI core course, for example: 专业必修 / 3学分 / 机器学习基础
- Keep the course objective section with two goal cards, but rewrite them for AI learning objectives
- Keep the 支撑专业 chips, but change them to AI-related majors
- Keep the 支撑岗位 chips, but change them to AI-related jobs
- Keep the bottom 知识图谱 area in the same position, but make it an AI岗位能力雷达图, not a network graph
- Radar dimensions should feel like: 数据处理能力, 模型训练能力, 算法理解能力, 工程实现能力, 系统部署能力, 问题分析能力
- Keep the drawer refined, readable, and consistent with the first image style

Important constraints:
- This image must still clearly look like a course detail page
- Do not turn the drawer into a职业规划师面板
- Do not keep any materials engineering wording
- Keep the visual quality polished and presentation-ready
```

- [ ] **Step 3: Save the selected result as `ai-course-drawer-matrix-v1.png`**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-v1.png`
Expected: command exits with no output

- [ ] **Step 4: Review the candidate visually**

Action: open `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-v1.png`
Expected: the bottom matrix matches the AI matrix language and the right drawer reads as an AI course detail drawer with a radar chart

- [ ] **Step 5: Commit the first candidate**

```bash
git add major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-v1.png
git commit -m "feat: generate ai course drawer matrix candidate"
```

### Task 3: Refine and finalize the second image

**Files:**
- Modify: `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-v1.png`
- Create: `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png`

- [ ] **Step 1: Compare the candidate against the spec checklist**

Check these exact points:

- The bottom matrix looks like the first approved AI image
- The drawer still reads as a course detail drawer
- The course title and objectives are AI-specific
- The supporting majors and jobs are AI-specific
- The bottom chart is a radar, not a node graph
- No materials engineering terminology remains

Expected: identify only the smallest necessary set of fixes

- [ ] **Step 2: Run one targeted refinement pass**

Use a refinement prompt shaped like this:

```text
Edit this generated UI mockup and keep the overall composition.
Fix only these issues:
1. <issue one>
2. <issue two>
3. <issue three>

Preserve the bottom AI matrix, preserve the course detail drawer structure, and preserve the radar chart format.
Do not redesign from scratch.
```

- [ ] **Step 3: Save the refined image as the final deliverable**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png`
Expected: command exits with no output

- [ ] **Step 4: Perform final visual verification**

Action: open `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png`
Expected:
- bottom matrix matches the first-image series
- drawer content is AI-course specific
- radar chart is clear and believable
- the image is presentation-ready

- [ ] **Step 5: Commit the final asset**

```bash
git add major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png
git commit -m "feat: finalize ai course drawer matrix image"
```

### Task 4: Verify deliverables and branch state

**Files:**
- Verify: `major-construction-platform/outputs/ai-course-drawer-matrix/notes.md`
- Verify: `major-construction-platform/outputs/ai-course-drawer-matrix/ai-course-drawer-matrix-final.png`

- [ ] **Step 1: List the deliverable files**

Run: `find major-construction-platform/outputs/ai-course-drawer-matrix -maxdepth 1 -type f | sort`
Expected: includes `notes.md`, `ai-course-drawer-matrix-v1.png`, and `ai-course-drawer-matrix-final.png`

- [ ] **Step 2: Check git status**

Run: `git status --short`
Expected: no unexpected branch changes remain after the task commits

- [ ] **Step 3: Review the recent branch history**

Run: `git log --oneline -4`
Expected: shows the spec commit plus the three implementation commits for this image task

- [ ] **Step 4: Prepare the handoff summary**

Report:
- final output path
- whether a refinement pass was needed
- whether the radar remained as a radar
- any remaining visual tradeoff

- [ ] **Step 5: Skip commit if there are no further file changes**

If Task 4 does not modify files, do not create an extra commit.

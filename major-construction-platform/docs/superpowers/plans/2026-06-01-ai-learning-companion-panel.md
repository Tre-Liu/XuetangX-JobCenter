# AI Learning Companion Panel Image Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a third high-fidelity AI-major image that preserves the course-learning page shell while transforming the right side into a structured learning companion panel with job growth path, job capability mapping, and concrete learning suggestions.

**Architecture:** Treat the third provided screenshot as the base layout, keep the course-learning center content intact, and use model-assisted image editing to convert the right panel from a generic profession helper into a focused AI learning companion panel. Save intermediate and final results in a dedicated output directory so the user can compare revisions if needed.

**Tech Stack:** Codex built-in image editing, local filesystem artifact management, visual inspection with image preview

---

### Task 1: Prepare the third-image output workspace

**Files:**
- Create: `major-construction-platform/docs/superpowers/plans/2026-06-01-ai-learning-companion-panel.md`
- Create: `major-construction-platform/outputs/ai-learning-companion-panel/`
- Create: `major-construction-platform/outputs/ai-learning-companion-panel/notes.md`

- [ ] **Step 1: Confirm the branch**

Run: `git branch --show-current`
Expected: `codex/ai-career-matrix`

- [ ] **Step 2: Create the output directory**

Run: `mkdir -p major-construction-platform/outputs/ai-learning-companion-panel`
Expected: command exits with no output

- [ ] **Step 3: Write the notes file**

Create `major-construction-platform/outputs/ai-learning-companion-panel/notes.md` with:

```md
# AI Learning Companion Panel Output Notes

- Base image source: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/原图/3.png`
- Primary spec: `major-construction-platform/docs/superpowers/specs/2026-06-01-ai-learning-companion-panel-design.md`
- Final output target: `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png`
```

- [ ] **Step 4: Verify the notes file**

Run: `sed -n '1,80p' major-construction-platform/outputs/ai-learning-companion-panel/notes.md`
Expected: shows the three bullet points above

- [ ] **Step 5: Commit the workspace prep**

```bash
git add major-construction-platform/docs/superpowers/plans/2026-06-01-ai-learning-companion-panel.md \
  major-construction-platform/outputs/ai-learning-companion-panel/notes.md
git commit -m "chore: prepare ai learning companion panel workspace"
```

### Task 2: Generate the first learning-companion candidate

**Files:**
- Use: `/Users/liuhongzhe/Desktop/学堂/专业建设/活动彩页/原图/3.png`
- Create: `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-v1.png`

- [ ] **Step 1: Load the third base image into the conversation context**

Action: preview the third screenshot before editing
Expected: the course-learning page and existing right panel are visible

- [ ] **Step 2: Generate the first edited candidate**

Use this image editing prompt:

```text
Edit this existing education platform course-learning UI screenshot while preserving the page shell, left navigation, central course-learning content, and clean product screenshot quality.

Professional context:
- Convert the page semantics from materials engineering to artificial intelligence major
- Keep the page as a course-learning scene, not a career planner home page

Center content:
- Preserve the video-learning layout and course-study structure
- If needed, lightly AI-ify obvious materials-engineering wording so the page feels consistent with an AI major
- Keep the center as the primary learning area

Right panel:
- Transform the current generic profession helper panel into a structured 学习伴随面板
- Keep the top title role concept, but reduce the chat feel and increase the structured learning-assistant feel
- The panel should clearly support the current course-learning context

Panel structure:
1. A short introduction explaining that the current course is building key AI岗位能力
2. A clear 岗位发展路径 section showing something like:
   当前课程：机器学习基础
   核心能力：数据处理 / 模型训练 / 算法理解
   岗位方向：机器学习工程师 / 数据智能工程师 / AI应用开发工程师
   后续课程：数据结构与算法 / 深度学习基础 / 计算机视觉基础
3. A compact 岗位能力图谱 or capability mapping area that shows how the course strengthens AI job capabilities such as 数据处理能力, 模型训练能力, 算法理解能力, 工程实现能力, 问题分析能力
4. A learning suggestion area with actionable guidance such as:
   先修建议：补强 Python 编程基础
   下一门课程推荐：数据结构与算法 / 深度学习基础
   继续学习主题：特征工程 / 模型评估 / 监督学习

Design constraints:
- Do not turn the right panel into a heavy career-planning dashboard
- Do not keep materials-engineering terminology
- The right panel should feel like a companion to the current course
- Use the same soft blue-white and purple-blue product style as the previous AI images
- Keep the whole image polished, believable, and presentation-ready
```

- [ ] **Step 3: Save the generated candidate**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-v1.png`
Expected: command exits with no output

- [ ] **Step 4: Review the candidate visually**

Action: open `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-v1.png`
Expected: the right panel reads as an AI learning companion with path, capability mapping, and study suggestions

- [ ] **Step 5: Commit the first candidate**

```bash
git add major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-v1.png
git commit -m "feat: generate ai learning companion panel candidate"
```

### Task 3: Refine and finalize the third image

**Files:**
- Modify: `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-v1.png`
- Create: `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png`

- [ ] **Step 1: Compare the candidate against the spec checklist**

Check these exact points:

- The page still reads as a course-learning page
- The right panel no longer feels like a plain chat box
- The panel clearly shows 岗位发展路径
- The panel includes a capability mapping expression
- The panel includes concrete learning suggestions
- The overall semantics are AI-major specific

Expected: identify only the smallest necessary refinements

- [ ] **Step 2: Run one targeted refinement pass**

Use a refinement prompt shaped like this:

```text
Edit this generated UI mockup and keep the overall composition.
Fix only these issues:
1. <issue one>
2. <issue two>
3. <issue three>

Preserve the course-learning page structure and preserve the right panel as a structured AI learning companion panel.
Do not redesign from scratch.
```

- [ ] **Step 3: Save the refined result as the final deliverable**

Run: `cp '<generated-image-path>' major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png`
Expected: command exits with no output

- [ ] **Step 4: Perform final visual verification**

Action: open `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png`
Expected:
- center remains a learning page
- right panel shows path + capability + suggestions
- the image is AI-major specific
- the image is presentation-ready

- [ ] **Step 5: Commit the final asset**

```bash
git add major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png
git commit -m "feat: finalize ai learning companion panel image"
```

### Task 4: Verify deliverables and branch state

**Files:**
- Verify: `major-construction-platform/outputs/ai-learning-companion-panel/notes.md`
- Verify: `major-construction-platform/outputs/ai-learning-companion-panel/ai-learning-companion-panel-final.png`

- [ ] **Step 1: List the deliverables**

Run: `find major-construction-platform/outputs/ai-learning-companion-panel -maxdepth 1 -type f | sort`
Expected: includes `notes.md`, `ai-learning-companion-panel-v1.png`, and `ai-learning-companion-panel-final.png`

- [ ] **Step 2: Check git status**

Run: `git status --short`
Expected: no unexpected new tracked changes remain after commits

- [ ] **Step 3: Review recent branch history**

Run: `git log --oneline -4`
Expected: shows the spec commit plus the three implementation commits for this image task

- [ ] **Step 4: Prepare the handoff summary**

Report:
- final output path
- whether a refinement pass was needed
- whether the page still reads as a course-learning page
- any remaining visual tradeoff

- [ ] **Step 5: Skip commit if Task 4 makes no file changes**

If no file changes were made in Task 4, do not create another commit.

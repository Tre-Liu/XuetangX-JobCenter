# Typical Task Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual typical-work-task dialog with template import on the job detail task tab.

**Architecture:** Keep the feature local to `App.vue`, matching the existing add-job dialog pattern. Store manually added tasks in reactive state keyed by job id, merge them into the displayed task list, and style the dialog in `styles.css`.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vite, existing CSS.

---

### Task 1: Task Dialog State And Behavior

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/App.vue`

- [ ] Add reactive dialog state for open/close, form fields, and per-job added tasks.
- [ ] Add `openTaskDialog`, `closeTaskDialog`, `importTaskTemplate`, and `saveManualTask` functions.
- [ ] Add a computed list that merges `selectedJobDetail.tasks` with tasks added for the current job.
- [ ] Wire the “手动添加” button to open the dialog.

### Task 2: Dialog Template

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/App.vue`

- [ ] Render an “添加典型工作任务” modal using existing `dialog-backdrop`, `dialog-header`, `template-import-strip`, and `dialog-footer` patterns.
- [ ] Include fields for task name, task description, and ability tags.
- [ ] Include a template import button that fills the fields with a realistic AI model deployment task.
- [ ] Disable saving until name and description are present.

### Task 3: Styling And Verification

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/styles.css`

- [ ] Add compact form styling for the task dialog.
- [ ] Run `npm run build`.
- [ ] If build fails, fix the reported TypeScript or Vue template issue and rerun.

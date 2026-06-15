# Talent Plan Manual Entry Design

## Goal

Clicking "手工录入" in the talent plan creation dialog enters a complete demonstration state for 人才方案管理 that can be opened from `index.html`.

## Scope

The first iteration builds the usable framework and demo data views for five sections: 培养目标, 毕业要求, 课程管理, 支撑矩阵, and 学生管理. Editing, persistence, backend APIs, and upload parsing are out of scope.

## Experience

The initial talent page remains the empty state with "创建培养目标". The existing creation dialog keeps "智能导入" and "手工录入". Choosing "手工录入" closes the dialog, switches the talent module into demo mode, and lands on 培养目标.

In demo mode, the left menu highlights the active section and switches the main white content panel. The layout follows the supplied screenshots: pale blue shell, compact left navigation, large white panel, edit action in the panel header, and the floating assistant avatar.

## Views

培养目标 shows an overview paragraph and six目标 rows.

毕业要求 shows an overview paragraph and hierarchical R1/R1.1 style requirement rows.

课程管理 shows top tabs, search/filter controls, action buttons, a table of course demo rows, and pagination.

支撑矩阵 shows a matrix of 毕业要求 rows by 培养目标 columns with blue check marks.

学生管理 shows the 2026级全部学生(0) title, search control, empty table, and pagination.

## Implementation Notes

Use existing `src/App.vue` and `src/styles.css` patterns. Add local constants for demo data, a `talentPlanCreated` state flag, and an `activeTalentSection` ref. Update the file-protocol static fallback in `index.html` so opening the file directly supports the same manual-entry flow.

## Verification

Add tests that assert the Vue entry and static `index.html` include the manual-entry transition and all five demo sections. Run the node test suite and the production build.

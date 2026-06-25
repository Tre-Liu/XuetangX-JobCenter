# CMS AI Course Creation Flow Design

Date: 2026-06-24

## Goal

Rebuild the CMS AI course creation demo so it forms a complete business loop:

1. Start from a CMS AI course management page matching the provided upper-level page screenshot.
2. Open a "create AI course" modal from the table toolbar.
3. Select a school, then progressively reveal the longer configuration form.
4. Choose type, college, and official major.
5. Confirm creation and enter the existing industry research management page, where the user can initialize industry research data.

The experience should feel like the existing CMS product, not a new marketing-style or standalone prototype.

## Existing Context

The current project already has a CMS standalone industry research management entry:

- Vue route: `?view=industry-research-admin`
- Static file: `major-construction-platform/industry-research-admin.html`
- Existing state handoff key: `major-construction-platform:industry-research`
- Existing tests: `major-construction-platform/tests/industry-research-management.test.mjs`

The implementation should extend this existing CMS surface instead of creating a separate unrelated page.

## User Flow

### 1. CMS AI Course Management Page

The initial CMS page should match the reference "AI课程" list page:

- Left CMS sidebar with platform management expanded and "AI 课程" active.
- Top breadcrumb: `平台管理 / AI 课程`.
- Tabs: `AI课管理`, `AI课使用`, `AI课运营管理`.
- Filter controls for course name/id, school, platform, status, source, type, AI course level, contract fields, xue tang status, and tags.
- Results table with existing AI course rows.
- Primary action: `创建AI课`.

This page is the upper-level entry before the current industry research management page.

### 2. Create AI Course Modal

Clicking `创建AI课` opens a centered CMS modal over the list page. The modal uses the existing CMS visual style:

- White panel, narrow gray border, 3px radius.
- Dark overlay behind it.
- Fixed footer with `取消` and `确定`.
- Scrollable body for long content.

Initial fields:

- Required `名称`
- `名称英文`
- `介绍`
- Required `所属学校`
- `是否开放`
- `课程封面`
- `工作室`
- `是否为学分AI课`
- Contract management fields, including service tier, contract status, delivery status, AI course tier, and xue tang display status.

### 3. School Selection Expansion

After choosing `清华大学（envning）（uvid = 91）`, the form expands with the school-dependent fields shown in the screenshots:

- `平台类型`: `教学平台` selected by default, `培训平台` optional.
- `来源`: `学堂自研`.
- Base model matrix with `智谱GLM-4-Plus` selected by default and realistic model options.
- Default base model selector.
- Capability display description and upload slot.
- `类型` with two selects.
- `所属学院`.
- Course cover and other lower fields remain available through modal scrolling.

The interaction can be demo-local. It does not need to call a backend.

### 4. Type, College, And Major

When the user selects:

- Type first level: `学科共建`
- Type second level: `专业建设`
- College: for example `学堂`

Then `所属专业` appears.

The `所属专业` row has:

- Search/select input placeholder: `输入并选择专业`
- Button: `添加专业`

Clicking `添加专业` opens an official major picker.

### 5. Official Major Picker

The picker lets the user select an official major before returning to the create modal.

Required behavior:

- Switch between `本科` and `职教`.
- Search by major name or code.
- Show realistic official major options.
- Allow one selected major at a time.
- Confirm inserts the selected major into the create modal.

Recommended demo options:

- Undergraduate:
  - `080717T 人工智能`
  - `081008T 智能建造`
  - `080901 计算机科学与技术`
  - `080910T 数据科学与大数据技术`
- Vocational:
  - `510209 人工智能技术应用`
  - `440304 智能建造技术`
  - `510203 软件技术`
  - `510205 大数据技术`

### 6. Confirm And Handoff

When the user clicks `确定` in the create modal:

- Validate that a name, school, type, college, and official major have been selected.
- Persist a demo state entry for the created AI course.
- Navigate or switch to the existing industry research management page.
- Show the page as `新专业建设` with the `产业调研` tab active, preserving the current data initialization workflow.

The industry research page remains responsible for `数据初始化` and industry chain recommendation selection.

## Data Model

Add a small local state model for the demo flow.

Suggested fields:

- `name`
- `schoolId`
- `schoolLabel`
- `platformType`
- `source`
- `model`
- `typeLevel1`
- `typeLevel2`
- `college`
- `majorCode`
- `majorName`
- `majorEducationLevel`
- `createdAt`

Use local component state for transient modal editing. Use `localStorage` only for handoff state needed across standalone/demo pages.

Suggested storage key:

`major-construction-platform:cms-ai-course-creation`

Keep the existing industry research key separate:

`major-construction-platform:industry-research`

## Architecture

### Vue App

Extend `src/App.vue` around the existing `isIndustryResearchAdminView` branch:

- Add a CMS page mode for `ai-course-list` and `industry-research-admin`.
- Default `view=industry-research-admin` can still render the existing industry page for compatibility.
- Add state and event handlers for:
  - opening and closing create modal
  - school selection
  - type/college selection
  - opening and confirming official major picker
  - confirming course creation and handing off to industry research management

The first implementation can keep the CMS creation flow in `App.vue` to match the current single-file pattern. If the section becomes unwieldy, extract constants and data arrays into a focused file under `src/app/`.

### Static Standalone HTML

Update `major-construction-platform/industry-research-admin.html` so the file opened directly can demonstrate the same business loop:

- Start from the AI course list page.
- Open the create modal.
- Support school expansion, official major picker, confirmation, and transition into the existing industry research management content.

This mirrors the repository convention that static demo entry points are maintained alongside Vue.

## Visual Design

Match the supplied CMS screenshots:

- Dense admin layout.
- Small radius around 3px.
- Blue primary buttons.
- Light gray form rows and borders.
- Dark blue left sidebar.
- No decorative hero, cards inside cards, or illustrative embellishments.
- Modal body scrolls independently; footer remains visible.

The official major picker should look like a CMS selection dialog, not a new design language.

## Error Handling And Validation

Required validation on create confirm:

- Missing name: show inline message near `名称`.
- Missing school: show inline message near `所属学校`.
- Missing `学科共建 / 专业建设`: show inline message near `类型`.
- Missing college: show inline message near `所属学院`.
- Missing major: show inline message near `所属专业`.

The demo may keep validation client-side only. No server errors are needed.

## Testing Strategy

Use test-first implementation.

Add or extend Node tests to verify:

- The AI course list page contains `创建AI课`, filters, table rows, and the three AI course tabs.
- The create modal markup includes the initial fields and scrollable body/fixed footer classes.
- School selection reveals platform type, source, model matrix, type, and college controls.
- The `学科共建 / 专业建设` path reveals `所属专业` and `添加专业`.
- The official major picker includes undergraduate/vocational tabs and searchable official major options.
- Confirmation persists creation handoff state and leads into the existing industry research management page.
- Both `src/App.vue` and `industry-research-admin.html` include the required loop markers.

Run:

- `npm test` in `major-construction-platform`
- `npm run build` in `major-construction-platform`

Known non-blocking build warnings about external scripts/chunk size should not be treated as failure if the command exits successfully.

## Scope Boundaries

In scope:

- Demo-local CMS AI course creation loop.
- Functional modal and official major picker.
- Local handoff into existing industry research management.
- Vue and standalone HTML parity.
- Tests for the new flow.

Out of scope:

- Real CMS API integration.
- Authentication or permissions.
- Real file upload processing.
- Full AI course use or operation management pages.
- Backend persistence.

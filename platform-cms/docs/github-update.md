# GitHub 独立 CMS 提交说明

基于 `main` 的 `a64ed7f9` 整理，分支 `codex/platform-cms-extraction`。

## 目录和范围

- `platform-cms/`：独立管理应用，包含课程管理、产业管理、返回管理首页和本地文件入口修复。
- `packages/`：共用专业产业目录、配置契约、导航桥接及离线构建。
- `ai-course/`、`major-construction-platform/`：调用公共模块，保留旧管理入口与离线页面。同步 CMS 所依赖的多专业关联兼容代码。
- 本提交不包含原工作区尚未提交的课程任务确认编辑、人培编辑和学生移动端改动；相关本地文件保持原状。课程静态页面由本分支的课程源码重新构建。

## 验证

课程、专业建设、独立 CMS 三个生产构建通过。公共包与 CMS 36 项测试通过。课程完整测试 216 项通过。专业建设完整测试为 736 项、694 通过、42 失败。42 项与隔离前已记录的失败集合一致；因此保留为草稿 PR，未直接合并 main。依赖复用本机各项目已安装版本，生成目录一致性检查及提交差异空白检查通过。

`batch1-delivery.md` 记录的是原本地综合工作区的第一批交付；本文件为本次 GitHub 隔离提交的范围和验证口径。

## 专业建设未通过的测试

- `generated AI chain bundle preserves the complete reconciled dataset`
- `generated AI chain bundle retains all source node families and province evidence`
- `job portrait AI summary and cards match the Figma compact card specification`
- `job portrait level filter narrows the list results`
- `job portrait search matches visible job content instead of hidden associations`
- `portrait company cards use a coordinated summary layout`
- `static custom chain input appears only for the custom select option`
- `static custom job uniqueness uses only the current chain visible candidates`
- `static custom-chain ADS matches the empty-id serialization contract`
- `static default TOC allows adding a root and deleting its child`
- `static demo shows initialized industry research data after CMS chain selection is stored`
- `static file talent sidebar runtime transitions keep one current page and active group`
- `static generation ignores an old callback after leaving and editing another report`
- `static html can deep-link directly to the industry research layout view`
- `static html can deep-link directly to the report library view`
- `static html default file view opens the results portal in a new tab from 建设成果展示`
- `static html default file view starts empty but can add jobs from job analysis candidates`
- `static html file view renders the dark results portal without throwing`
- `static html results editor opens a separate editable results URL`
- `static industry chain keeps the graph view switch without exposing a palette control`
- `static industry chain switch opens sankey view from treemap view`
- `static job analysis deep links render the selected uninitialized tab without runtime errors`
- `static job analysis tabs keep rich sections and clickable portrait cards`
- `static portrait graph launcher opens the selected job in a nested dialog without opening a tab`
- `static professional model tab opens the restored course model view`
- `static regeneration stays done and ADS keeps reverse job order`
- `static report TOC edits persist when returning to parameters`
- `static report accepts unique custom chain and multiple custom jobs`
- `static report chain controls gate and filter job choices`
- `static report creation allows selecting more than ten jobs`
- `static report navigation renders library and creation states without errors`
- `static report region search panel closes on outside click`
- `static report rejects library-name custom chain and generates custom jobs`
- `static report renders a read-only major and native chain select`
- `static report restores a normalized legacy library chain when returning to parameters`
- `static report restores a saved custom chain name when editing`
- `static report searches do not rerender during Chinese IME composition`
- `static reports keep their adjusted TOC and file count after reload`
- `static talent course names open the course model view`
- `static validation requires an industry chain and at least one region`
- `switching back to 岗位中心 clears a stale course-model view parameter`
- `talent goal text cells keep balanced inner spacing`

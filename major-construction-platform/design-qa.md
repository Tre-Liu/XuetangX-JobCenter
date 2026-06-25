# 岗位中心侧边栏 Design QA

source visual truth path: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-a61758af-8b79-489f-8d19-f59d3deaa334.png`

implementation screenshot path: `/private/tmp/design-qa-job-sidebar-final.png`

viewport: in-app browser default 1280x720

state: Vue demo opened at `http://localhost:5174/?reportView=library&tab=demand&view=job-research`; route renders `岗位中心`, default sidebar state is `产业调研 / 岗位分析 / 招聘需求趋势`.

full-view comparison evidence: source highlights the secondary sidebar immediately to the right of the dark product rail. Implementation renders the same target area as `.job-module-menu` / `.section-menu.job-figma-menu`, with `岗位中心` active in the top navigation and a Figma-style `产业调研` group header.

focused region comparison evidence: browser measurement confirmed `.job-figma-menu` at `x=74`, width `205px`, gradient panel background, padding `31px 24px 16px`. The group icon renders as a 34x34 gradient search mark. The selected `招聘需求趋势` cell measured `156x37`, with blue-purple gradient `linear-gradient(90deg, rgb(29, 111, 255) 0%, rgb(139, 92, 246) 100%)`.

**Findings**
- No P0/P1/P2 findings.

**Required Fidelity Surfaces**
- Fonts and typography: retained the existing app font stack; primary and secondary navigation use compact bold labels that match the operational sidebar style.
- Spacing and layout rhythm: sidebar width and x-position match the screenshot target area; top item, grouped subtitles, and nested buttons stay aligned in one column.
- Colors and visual tokens: sidebar background now uses a subtle light-blue gradient, and active cells use the Figma blue-purple gradient.
- Copy and content: `view=job-research&tab=demand` now shows `产业调研`, `· 岗位分析 ·`, `岗位画像分析`, `招聘需求趋势`, and `新岗位新技术预判` in the red-boxed sidebar position.
- State handling: saved decision-center state no longer hijacks the root `index` route; decision-center state is restored only when entering that module.

**Patches Made**
- Restored the mistakenly changed decision-center sidebar data and styling.
- Updated Vue root/query defaults so `view=job-research&tab=demand` opens the `岗位分析` group directly.
- Updated static `index.html` fallback to render the same Figma-style research group.
- Added regression coverage for the correct sidebar target and root-route behavior.

final result: passed

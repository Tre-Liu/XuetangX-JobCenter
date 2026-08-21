# 人才方案管理侧边栏对齐产教模型 Product Design QA

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-0311e9af-ace8-4665-baf6-8092dbfc00e6.png`
- QA 内副本：`.codex-qa/old-talent-sidebar-source.png`
- Reference component：同一应用内的“产教模型”侧边栏。
- Reference screenshots：`.codex-qa/vue-industry-reference-2048x1240.png`、`.codex-qa/vue-industry-reference-1440x720-top.png`、`.codex-qa/vue-industry-reference-1440x720-bottom.png`
- Implementation screenshots：`.codex-qa/vue-talent-2048x1240.png`、`.codex-qa/vue-talent-1440x720-top.png`、`.codex-qa/vue-talent-1440x720-after-sidebar-wheel.png`、`.codex-qa/vue-talent-1440x600-internal-scroll.png`
- Focus evidence：`.codex-qa/vue-talent-focus-2048x1240.png`
- Full-view comparison：`.codex-qa/talent-sidebar-comparison-board.png`
- Focused comparison：`.codex-qa/talent-sidebar-focused-comparison.png`
- Browser-verified entry：仅 Vue `http://127.0.0.1:4173/`，已完成七入口、焦点、响应式、滚动和控制台检查；本轮可访问 token 修复后重新截图并检查活动态与焦点态。
- Not browser-verified：实际 `file://` 静态分支。所选浏览器的 URL 安全策略在导航前拦截该地址；同一 `index.html` 的本地 HTTP 路径进入 Vue 分支，不能替代 file-only 交互证据。
- Sole blocker：缺少 `file://` 分支的直接浏览器点击与渲染证据；这是当前 QA verdict 为 blocked 的唯一原因。
- Browser surface：内置 Browser 不可用后，按已批准的 Browser 工作流使用 Chrome browser-client；未使用独立 Playwright、CDP 或其他浏览器表面。

## Capture Normalization

| Evidence | CSS viewport / state | Output pixels | Density and normalization |
| --- | --- | --- | --- |
| 用户旧截图 | 原浏览器 viewport 不可从图片可靠恢复；旧平铺侧栏、培养目标活动态 | 3442 × 2108 | 原图疑似 Retina 2x，含浏览器框架；只用于层级改造上下文，不做像素级判断 |
| 产教参考 + 人才实现宽屏 | 2048 × 1240；分别为“产业链图谱”和“培养目标”活动态 | 各 2048 × 1240 | `devicePixelRatio=1`；应用 `--workspace-scale=0.90`；等像素同状态对照 |
| 产教参考 + 人才实现矮视口 | 1440 × 720；顶部状态 | 各 1440 × 720 | `devicePixelRatio=1`；应用 `--workspace-scale=1`；等像素同视口对照 |
| 人才焦点局部 | 来自 2048 × 1240；“人才培养方案比对”键盘聚焦 | 176 × 760 | `devicePixelRatio=1`，未放大；与参考/实现侧栏一起进入 focused comparison |
| 同图对照板 | 1721 × 877 比较页窗口，完整页面 | 1721 × 3577 | `devicePixelRatio=1`；所有 11 个引用图像均完成加载后截图 |
| 局部对照板 | 1721 × 877 比较页窗口 | 1721 × 877 | `devicePixelRatio=1`；同屏并列参考、修复后实现和键盘焦点证据 |

## Full-view and Focused Evidence

- 完整对照板把用户旧截图、产教模型参考、新人才侧栏、两个要求视口和滚动证据放在同一个浏览器渲染输入中后再判断；未从分离截图或代码记忆直接下结论。
- 2048 × 1240 全景：参考与实现的 dock、顶栏、侧栏起点、侧栏背景和主内容起点稳定；人才侧栏从旧平铺结构重组为“方案建设 / 方案调研 / 方案比对”三段层级。
- 1440 × 720 全景：三组和七个入口全部可见，主内容没有被侧栏挤压或横向溢出。
- 局部对照板在同一输入中并列 176 × 664 CSS px 的参考/实现侧栏及键盘焦点截图，用于检查图标、按钮、字号、分组节奏、选中态和焦点轮廓。
- 可访问 token 修复后重新生成两张对照板；蓝紫活动态仅轻微加深，层级、密度、对齐和整体视觉语言未出现新的 P0/P1/P2 差异。

## Geometry Evidence

- CSS 视觉契约：侧栏 `176px`，分组/按钮 `128px`，按钮 `30px` 高，图标 `34px × 34px`，选中态为 `#1a66ed → #8054e8` 的 90° 渐变，焦点轮廓为不透明 `#1d4ed8`。
- 2048 × 1240 因应用统一 0.90 工作区缩放，参考与实现均实测：侧栏 `158.398px`，按钮 `115.195px × 27px`；这与 CSS token 的 0.90 缩放一致，不是组件漂移。
- 1440 × 720 在 1.00 工作区缩放下，人才侧栏实测 `176px × 664px`，七个菜单均为 `128px × 30px`，三枚图标均为 `34px × 34px`。
- 1440 × 720 页面 `scrollWidth=clientWidth=1440`、`scrollHeight=clientHeight=720`；主画布 `1162px × 636px`，无全局横向或纵向溢出。
- 两个长标签的 `clientWidth=scrollWidth=126px`，`white-space: nowrap`，无换行、截断或省略号。
- 13px 白色活动文字与渐变蓝端、紫端的 WCAG 对比度分别为 `5.0392:1`、`4.8262:1`，1000 点采样的全渐变最小值为 `4.8262:1`，高于 `4.5:1`。
- `#1d4ed8` 焦点轮廓与侧栏三个实际合成背景的对比度为 `5.3584:1`、`5.7300:1`、`6.3519:1`，均高于非文本焦点可见性的 `3:1` 门槛。

## Required Fidelity Surfaces

- Fonts and typography：实现与参考均使用现有 Inter / 苹方 / 微软雅黑字体栈；分组标题、辅助分隔标题、菜单文字的字号、字重、行高与层级一致。七个标签均保持单行且光学密度稳定。
- Spacing and layout rhythm：176px 侧栏、31/24/16px 内边距、128px 菜单列、74px 标题区、8px 菜单间隔和 20px 分组间距沿用产教模型节奏；两个要求视口没有碰撞、裁切或主体位移。
- Colors and visual tokens：浅蓝三段渐变、白色半透明按钮、深蓝活动分组标题、蓝紫选中态和阴影保持参考语言；活动渐变轻微加深为 `rgb(26, 102, 237) → rgb(128, 84, 232)`，焦点轮廓为 `rgb(29, 78, 216)`，以满足 WCAG 对比度而不改变视觉语义。
- Image quality and asset fidelity：侧栏不含照片、位图插画、品牌标志或待替换产品图；三枚 34px 功能图标沿用现有应用的渐变、描边和阴影语言，边缘清晰，无压缩、拉伸、透明光晕或占位资产。
- Copy and content：保留“培养目标、毕业要求、课程管理、支撑矩阵、学生管理、人才培养方案调研、人才培养方案比对”七个业务入口；分组文案清晰对应建设、调研、比对任务，未出现提示词泄漏或无关占位文案。

## Primary Interactions

- 在 Vue 入口依次点击七个入口；每一步内容标题分别切换到目标页，且仅有一个 `aria-current="page"`。
- 培养目标、毕业要求、课程管理、支撑矩阵、学生管理均同步高亮“方案建设”；人才培养方案调研同步高亮“方案调研”；人才培养方案比对同步高亮“方案比对”。
- 从版本按钮开始连续按 Tab，七个入口按 DOM/视觉顺序全部获得焦点；修复后末项实测 `outline-color: rgb(29, 78, 216)`、`outline-style: solid`，CSS 2px 轮廓在 0.90 工作区缩放下约为 `1.667px`，清晰可见。
- 1440 × 720 时第三组末项底边为 `y=673px`，已在 720px 视口内完整可达；对侧栏执行滚轮后，侧栏、主内容和文档 `scrollTop` 均保持 0，说明没有不必要的滚动或滚动串扰。
- 补充 1440 × 600 压力检查：侧栏从 `scrollTop=0` 滚到 `89`，第三组末项仍可见；主内容和文档均保持 `scrollTop=0`，证明需要滚动时由侧栏内部独立承接。
- 参考产教侧栏在 1440 × 720 从 `scrollTop=0` 滚到 `147`，主内容保持 0；人才侧栏继承了相同的内部滚动模式。

## Static `file://` Entry Evidence

- 已请求工作树内实际地址：`file:///Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.worktrees/talent-sidebar-alignment/major-construction-platform/index.html`。
- 所选 Chrome browser-client 在导航前返回 URL-policy 拦截，当前页保持 `about:blank`；这是浏览器环境限制，不是页面加载或运行时错误。根据安全规则未使用间接协议伪装、CDP、脚本注入或其他浏览器规避。
- 浏览器支持的本地 HTTP 路径 `http://127.0.0.1:4173/index.html` 成功渲染同一入口文件的 Vue 分支，七项侧栏结构与 Vue 根路径一致，控制台无 error/warning；截图为 `.codex-qa/served-index-http-fallback-browser-window-1721x877.png`。
- HTTP 协议按设计进入 Vue 分支，因此不能替代 file-only 委托分支的浏览器证据；页面实测 `data-talent-section=0`、`data-talent-subsystem=0`，未把该 HTTP 结果冒充 `file://` 结果。
- file-only 代码路径仍未声称人工浏览器验证。新增 VM 运行时测试执行真实 file bootstrap 和委托点击，依次切换五个建设入口、调研和比对；七个状态均验证恰好一个 `aria-current="page"`、恰好一个活动分组和正确内容标题。它显著增强静态路径回归覆盖，但不替代实际 `file://` 像素/浏览器证据。

## Console and Automated Checks

- Vue 入口在七个点击状态、两种要求视口、键盘焦点和滚动检查后：console errors `[]`，warnings `[]`。
- 可访问 token 修复后的 Vue 与同图对照板复检：console errors `[]`，warnings `[]`。
- 同一 `index.html` 的 HTTP 回退路径：console errors `[]`，warnings `[]`。
- 专项 GREEN：4 tests，4 pass，0 fail；包括两项 WCAG 数值测试、一项真实静态运行时七状态测试和更新后的视觉/减少动态效果契约测试。
- `npm test`：350 tests，350 pass，0 fail。
- `npm run build`：退出码 0；Vue TypeScript 检查、客户端构建和 SSR 构建完成。现有非模块脚本与大 chunk 提示为构建 warning，不是本次侧栏运行时错误。

## Findings

- P0：无。
- P1：无。
- P2：无。
- P3：无新增建议；本轮只调整活动态与焦点态的可访问颜色 token，没有进行非阻塞视觉润色。
- Blocking evidence gap：无法在所选浏览器中直接打开 `file://`，因此静态委托点击没有直接浏览器像素/交互证据。这是唯一 blocker；HTTP Vue 渲染、完整测试和专项代码契约只能覆盖可验证部分，不能解除该 blocker。

## Comparison History

1. Pass 1：在同一对照板中比较旧截图、产教模型参考和新人才侧栏；五个必查表面、全景、局部、活动态、焦点态和滚动隔离均未发现 P0/P1/P2。
2. Review correction：保留 Vue/视觉/自动化测试的通过事实，但按 Product Design QA 证据门槛将总体 verdict 改为 blocked；未对缺少的 `file://` 直接浏览器证据作通过推断。
3. Accessibility review：独立计算确认旧活动渐变最小文字对比度 `4.2344:1`，旧半透明焦点轮廓最小对比度 `1.7724:1`，分别低于 `4.5:1` 与 `3:1` 门槛。
4. Accessibility fix：将活动渐变调整为 `#1a66ed → #8054e8`，焦点轮廓调整为 `#1d4ed8`；专项与完整测试、生产构建全部通过。
5. Post-fix visual pass：在同一对照板中重新比较参考、2048 × 1240、1440 × 720 与焦点局部，未发现新的 P0/P1/P2；总体 verdict 仍仅因直接 `file://` 浏览器证据缺口而 blocked。

final result: blocked

---

# AI 助手悬浮入口与建议弹层设计 QA

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-1f4194cd-f05f-4a09-bbf8-9146299003a9.png`、`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-a3c2fe68-49f7-4f61-b6a8-161d56c21998.png`
- Implementation URL：`http://localhost:4173/?view=job-research&tab=portrait`
- Implementation screenshots：`.tmp/ai-assistant-qa/closed-1280x720.png`、`.tmp/ai-assistant-qa/open-final-1280x720.png`
- Full-view and focused comparison evidence：`.tmp/ai-assistant-qa/comparison-full-and-focus.png`
- Focus crops：`.tmp/ai-assistant-qa/reference-assistant-focus.png`、`.tmp/ai-assistant-qa/implementation-assistant-focus.png`
- State：岗位画像分析页；AI 助手关闭态与打开态。

## Capture Normalization

| Evidence | CSS viewport / state | Output pixels | Density and normalization |
| --- | --- | --- | --- |
| 用户参考截图 | 参考浏览器视图约 2048 × 1228；弹层打开 | 原图 3596 × 2158 | 按页面比例归一化为 2048 × 1228；只判断悬浮组件，排除浏览器框架与业务数据状态差异 |
| 浏览器实现 | 1280 × 720；弹层打开/关闭 | 1280 × 720 | `devicePixelRatio=1`；内置 Browser 实际渲染截图 |
| 聚焦对照 | 右下组件区域 | 各 400 × 510 | 参考与实现分别从归一化截图和浏览器截图裁取为同等像素画布，同屏并列比较 |

## Full-view and Focused Evidence

- 同屏对照板同时包含参考全视图、实现全视图、参考组件聚焦和实现组件聚焦；没有根据分离图片或代码记忆作视觉判断。
- 全视图用于检查悬浮入口是否稳定停靠在右下方、是否遮挡主导航以及打开弹层后的整体层级；页面业务数据初始化状态不同，属于本次组件范围外差异。
- 400 × 510 聚焦对照用于检查弹层宽高、圆角、阴影、标题区、四行信息密度、图标清晰度、文字层级和头像缩略图。

## Required Fidelity Surfaces

- Fonts and typography：沿用现有 Inter / 苹方 / 微软雅黑字体栈；标题 17px、菜单标题 15px、说明 13px 的层级与参考一致，未出现换行、裁切或字重漂移。
- Spacing and layout rhythm：弹层 336px 宽、18px 圆角、78px 标题区、4 × 83px 菜单行；最终高度约 412px，与参考组件约 413px 的密度一致。入口 58 × 58px，距右/底 28px。
- Colors and visual tokens：白色主体、淡蓝紫标题底、蓝紫标题、深色主文案、灰蓝说明和轻阴影与参考一致；对比度与现有产品浅色主题保持稳定。
- Image quality and asset fidelity：入口使用生成的高清 1254 × 1254 PNG 人物头像并以圆形遮罩显示；菜单使用项目已有蓝紫 AI 图标资产，无 emoji、文本符号或占位图形。
- Copy and content：标题“优化专业结构，从这里开始！”及四项菜单标题/说明与参考一致；“热门岗位分析建议”按用户要求保持无动作。

## Primary Interactions

- 点击右下 AI 助手打开弹层；再次点击可关闭；`aria-expanded` 与打开状态同步。
- 点击弹层标题区和菜单内部不会误关闭；点击页面空白处关闭。
- “课程交叉分析”“培养方案诊断分析”“培养方案对比分析”分别进入对应既有页面/模式，弹层随导航关闭。
- 点击“热门岗位分析建议”后 URL 不变、弹层保持打开、未创建分析弹窗，确认当前为无动作占位。
- 浏览器控制台 error 日志为 `[]`。

## Findings

- P0：无。
- P1：无。
- P2：无。
- P3：参考图的四枚小图标造型略有差异，实现为统一 AI 图标；在当前 20px 显示尺寸下不影响识别或层级，可在后续品牌图标资产齐备时替换。
- Intentional deviation：参考图中头像位于弹层右上方；本实现按用户文字要求将“AI助手”固定在屏幕右下，并让弹层在其上方展开，避免入口随弹层移动。

## Comparison History

1. Pass 1：同屏比较发现弹层结构、字体、配色与阴影无 P0/P1/P2；菜单总高度比参考少约 12px，记为 P3 密度微调。
2. Polish fix：将单行最小高度从 80px 调整为 83px，使弹层总高度从约 400px 对齐到约 412px。
3. Pass 2：重新浏览器截图、重新裁切并更新同屏对照；五个必查表面与关键交互均无剩余 P0/P1/P2。

## Implementation Checklist

- [x] 全局右下 AI 助手入口与真实头像资产
- [x] 四项建议弹层及打开、关闭、外部点击状态
- [x] 三项既有导航联动
- [x] 热门岗位分析建议保持无动作
- [x] Vue 与静态回退入口共用行为契约
- [x] 浏览器截图、同屏视觉对照、控制台检查

## Automated Checks

- 专项测试：15 tests，15 pass，0 fail。
- 全量测试：426 tests，426 pass，0 fail。
- 生产构建：`npm run build` 退出码 0；现有非模块脚本与大 chunk 提示为 warning，不是本次功能错误。

final result: passed

---

# Design QA — 毕业要求智能优化

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-3e534ad4-482e-470b-849f-3a323793c268.png`
- Implementation URL：`http://localhost:4173/`
- 页面截图：`design-qa-graduation-optimizer-page.png`
- 弹窗截图：`design-qa-graduation-optimizer-dialog.png`
- 优化结果截图：`design-qa-graduation-optimizer-result.png`
- 同屏对照：`design-qa-graduation-optimizer-comparison.png`
- Browser viewport：1280 × 720 CSS px，device scale factor 1
- Source pixels：3584 × 2136（包含浏览器框架）；对照仅判断应用内共享区域与红框指定按钮位

## 同屏视觉对照

- 参考图与最终页面已放入同一 2600 × 820 对照输入。智能优化按钮位于参考图红框区域，原有“智能导入”和“编辑”均保留，顺序为“智能优化 / 智能导入 / 编辑”。
- 页面沿用现有浅蓝白色产品壳、蓝紫选中态、紧凑描边按钮、同一字体与圆角体系；未引入新的页面结构或视觉主题。
- 弹窗采用左侧六岗位选择、右侧任务与能力双栏预览、底部固定操作区。1280 × 720 下内容完整，无裁切、遮挡、溢出或按钮碰撞。

## 关键交互验收

- 点击“智能优化”显示“检测出该专业与 6 个岗位强相关”，默认选择匹配度最高的 2 个岗位。
- 选择“装配式建筑深化设计师”后，计数更新为 3，典型任务和核心能力同步增加该岗位内容；任务与能力保持只读。
- 点击“优化”立即进入“AI润色中…”禁用态；约 700ms 后弹窗关闭，页面显示“已基于 3 个强相关岗位完成智能优化”。
- 优化结果保留前 5 项通用基础要求，并将 R6-R8 写回为 BIM 深化设计、智慧工地实施、装配式深化建造三类岗位能力要求。
- 原有“智能导入”入口可正常打开并关闭，关闭后“智能优化”仍可再次打开；浏览器 console errors 为 `[]`。

## Vue 与静态入口一致性

- Vue 与根目录 `index.html` 均包含相同的 6 个岗位、选择联动、任务/能力预览、优化写回与成功提示。
- 静态入口的真实委托交互 VM 测试覆盖：打开弹窗、六岗位渲染、增选岗位、只读证据更新、确认优化、弹窗关闭和毕业要求写回。
- 直接打开静态 HTML 的现有回归测试继续通过；当前浏览器安全策略不用于 `file://` 直接截图，因此视觉证据来自共享样式的 Vue 主入口，静态行为由 VM 交互测试验证。

## 自动化验证

- 专项测试：毕业要求智能优化逻辑 2/2 PASS；静态人才方案主路径 1/1 PASS。
- 全量测试：479/479 PASS，0 fail。
- 生产构建：PASS；仅有仓库既有 non-module script 与大 chunk warning。
- 浏览器交互：岗位选择、任务/能力联动、加载态、写回、原智能导入回归均 PASS。

## Findings

- P0：无。
- P1：无。
- P2：无。
- P3：无阻塞项。

final result: passed

# 人才方案空状态与智能导入 Design QA

## 验证环境

- 视口：应用内浏览器 CSS viewport `1920 × 999`，`devicePixelRatio=1`；浏览器截图稳定输出左侧 `1680 × 999` 可见区域，因此参考图也按相同区域裁切后同屏比较，未做非等比缩放。
- Vue 入口：`http://127.0.0.1:4173/`。
- 静态入口：根目录 `index.html` 的 `file://` 回退运行时；当前应用内浏览器安全策略拒绝直接导航本地文件，行为一致性由真实注册事件处理器的 VM 交互测试覆盖，结构和视觉继续复用同一 `src/styles.css`。
- 参考：用户提供的 5 张空状态、1 张上传态和 5 张解析结果截图。
- 实现截图：`artifacts/talent-plan-empty.png`、`talent-plan-course-empty.png`、`talent-plan-matrix-empty.png`、`talent-plan-import-upload.png`，以及 `talent-plan-import-review*.png` 的五个解析模块预览。
- 同屏对照：`artifacts/talent-plan-empty-comparison.png`、`talent-plan-course-comparison.png`、`talent-plan-matrix-comparison.png`、`talent-plan-import-upload-comparison.png`、`talent-plan-import-review-comparison.png`。

## 已验证状态

- 有数据时“空状态重置”可用；点击后原子清空方案模块、关闭弹窗、回到培养目标，重置按钮转为禁用。
- 培养目标与毕业要求分别保留“智能导入”和创建按钮；课程管理保留筛选、表头、暂无数据和分页；支撑矩阵保留双标签与引导；学生管理保持 0 人表格且不出现导入入口。
- 上传态支持点击选择和拖放，接受 `pdf/doc/docx/jpg/jpeg/png`；无文件及格式错误时“开始解析”禁用，合法文件只展示文件名，不发送解析网络请求。
- 解析结果默认勾选五个模块；鼠标和键盘均可切换 11 个培养目标、8 组/30 项毕业要求、74 门课程、11 × 8 支撑矩阵及课程矩阵空提示。
- 取消全部模块时确认按钮禁用；重新解析恢复干净上传态；仅确认培养目标与课程后，未选毕业要求和两个矩阵继续为空，学生仍为 0。
- 浏览器控制台新增 error 为 `[]`。

## 几何与视觉证据

- 上传弹窗：`516 × 394`；header `56px`、上传区 `444 × 204`、footer `72px`，白卡圆角、均匀暗色遮罩、浅橙警告和淡紫蓝虚线区与参考一致。
- 解析结果弹窗：`1118 × 750`；header `56px`、固定 footer `72px`、主体 `622px`；成功提示位于主体顶部，模块栏 `192 × 570`、预览区 `838 × 570`，预览内容独立滚动。
- 空目标内容簇、课程白卡、矩阵标签与引导均在同画布对照中保持参考的信息层级、间距、蓝紫主色、细边框和现有 demo 字体体系。
- 用户参考为新能源专业线上壳，实现按要求保留当前“人工智能专业”demo 外壳并使用智能建造数据；外围壳与业务数据差异为有意偏差，不计为视觉缺陷。

## 问题与修复

- P0：无。
- P1：无。
- P2（已修复）：点击模块文字会触发关联 checkbox 的默认行为，导致“切换预览”同时改变导入勾选。修复 `TalentPlanImportDialog.vue` 与静态委托处理后，文字使用独立预览按钮，checkbox 单独控制选择；浏览器复验五项勾选状态保持不变。
- P2（已修复）：首轮实现上传标题/说明和结果态成功提示不完整。按参考统一为“智能导入”、补齐“AI自动解析并输出规范化培养方案”及绿色解析成功提示，并把结果主体调整为固定提示行 + 双栏滚动工作区；重新截图对照后无剩余 P0/P1/P2。
- P2（已修复）：培养目标/毕业要求缺少二级标题，目标标签、课程表头和矩阵列名比参考简写，课程矩阵使用了不匹配的符号图。补齐“培养目标”“毕业要求”标题、`培养目标1…11`、课程序号/课程学分，并复用 demo 既有空态插画与两行提示；五模块分别复拍通过。
- P2（已修复）：父模块卡的 Space 监听会截获焦点位于 checkbox 时的原生键盘切换；最终移除卡片按钮角色，预览按钮与原生 checkbox 改为同级控件。浏览器复验 checkbox 空格切换时 active 预览不变，SSR/VM 测试覆盖两种独立控件。
- P2（已修复）：首轮矩阵空态内容簇比参考低约 100px。将内容簇上移后，应用内浏览器实测容器顶边 `344.27px`、文案顶边 `502.67px`，与参考约 `344px / 506px` 对齐；更新同屏对照后偏移消除。
- P2（已修复）：最终整分支审查复现 Vue 弹窗打开后焦点仍停在遮罩后触发器、阶段切换移除当前按钮后焦点丢失、模块卡嵌套 checkbox 交互语义冲突，以及静态弹窗 Escape 后无法重开、上传区缺键盘触发。现将预览按钮与 checkbox 改为同级独立控件；Vue 增加初始/阶段切换聚焦、Tab 回绕、Escape 关闭与触发器焦点恢复，并让“创建培养目标/毕业要求 → 智能导入”链式入口在关闭后回到持久创建按钮；静态通用关闭清理缓存引用、为上传区补 Enter/Space，并在 DOM 重绘、专用关闭、遮罩关闭、重置及链式入口中统一焦点与引用生命周期。应用内浏览器已复验直接/链式打开、回绕、关闭与恢复，控制器回归覆盖 Vue 阶段变化，VM 覆盖静态全部重绘和关闭边界。
- P2（已修复）：只选择计数为“暂无数据”的课程矩阵确认时，旧状态会把方案标为已创建，导致所有页面为空而重置按钮仍可用。Vue/静态现均只按实际可展示模块推导方案状态；该选择结果保持整套空态且重置禁用。
- P3：课程空表的数据行比参考约短 20px、分页略高；解析结果底栏的已选摘要未重复展示模块数量，“重新解析”按钮未额外放置刷新图标。两项均不影响信息层级、状态理解或交互完成，且沿用当前 demo 的紧凑控件规范，本轮不扩大范围调整。

## 对照迭代

1. 首轮同屏对照确认五类空状态、课程表格和矩阵引导结构正确；上传与结果弹窗尺寸达到参考规格。
2. 同屏放大检查发现上传文案、结果成功提示及模块内部标题/表头/空态图差异，浏览器交互发现模块标签误切选择和 checkbox 键盘事件冒泡，均按 P2 修复。
3. 第二轮对照确认上传与解析结果的标题、提示、五模块内容、工作区、遮罩、固定底栏和按钮状态均与参考设计语言一致；鼠标标签切换、键盘切换、独立勾选、重新解析和部分导入全部通过。
4. 最终矩阵复核发现空态内容簇垂直偏低；按同画布坐标上移并重新生成对照，插画与两行说明回到参考位置，无剩余 P0/P1/P2。
5. 提交后整分支审查发现四条键盘/状态边界回归；逐条写入 RED 测试后完成最小修复，聚焦自动化与应用内浏览器键盘复验均转为 GREEN。

## 自动化验证

- 人才方案状态与 SSR 专项测试：24/24 PASS；静态回退主路径测试：1/1 PASS。
- 全量测试：462/462 PASS，0 fail。
- 生产构建：PASS；仅保留仓库既有的 non-module script 与大 chunk warning。
- `git diff --check`：PASS。

## 最终结论

P0/P1/P2 均为 0；Vue 主路径、五类空状态、上传/解析/部分导入交互、直接与链式键盘焦点、同屏视觉比较、控制台和静态回退行为契约均已复验通过。静态 `file://` 的直接浏览器截图受应用内浏览器本地文件安全策略限制，已如实记录，并由真实事件 VM 测试及共享样式契约补足行为证据。

final result: passed

---

# Design QA — 毕业要求编辑态

- Source visual truth: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-bcf92db7-3407-4569-a5c6-35849d7d5492.png`
- Normalized source: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/design-qa-graduation-reference.png`
- Implementation screenshot: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/design-qa-graduation-editor.png`
- Side-by-side comparison: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/design-qa-graduation-comparison.png`
- Focused comparison: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/design-qa-graduation-focused.png`
- Browser viewport: 1600 × 874 CSS px at device scale factor 1
- Source pixels: 3562 × 2104; browser chrome was cropped at y = 161, then the page surface was normalized to 1600 × 874
- State: 培养方案 → 毕业要求 → 编辑

## Required fidelity surfaces

- Page state: the display page switches in place to the edit surface, matching the reference rather than opening a modal.
- Header: `编辑毕业要求`, `粘贴识别`, `取消`, and `确定` are present in the same action hierarchy.
- Content: the overview becomes a textarea; parent and child requirements become editable fields with visible hierarchical codes.
- Hierarchy: child items retain the reference branch-line treatment, while the existing intelligent-construction source content remains intact.
- Layout: the edit body and header title share the same 920 px content axis, with a pale blue-gray work surface and compact vertical rhythm.
- Responsive behavior: narrow layouts collapse the three-column editor row without hiding edit controls.

## Interaction and runtime checks

- Add child: verified R1 child count changed from 5 to 6.
- Cancel: verified the added child and an edited R1 value both rolled back.
- Paste recognition: verified clipboard text populated the overview field.
- Confirm: verified an edited R1 value persisted, then restored the original value and confirmed again.
- Drag reorder: covered by the pure state transition test; hierarchy codes are regenerated after movement.
- Browser console warnings/errors: none.

## Verification

- Targeted editor/import tests: 28 passed, 0 failed.
- Existing graduation-requirement grouping regression test: 1 passed, 0 failed.
- Production build: passed.
- Static inline script syntax parse: passed.
- Diff whitespace check: passed.
- Full-suite context: the earlier repository-wide run produced 446 passed / 31 failed; the remaining failures are in the pre-existing results-portal static harness where `window.__industryRegionCityData.rankMetrics` is unavailable, outside this editor change.

## Findings

- P0: none.
- P1: none.
- P2: the first pass was too wide, action placement drifted right, and the edit surface was white. The body was narrowed to 920 px, the title was aligned to the same axis, and the reference pale work-surface color was restored.
- P3: the reference uses icon-only drag/add/delete affordances; this implementation keeps compact text labels for clarity because the current project has no matching icon asset set.
- Intentional content difference: the reference shows mostly empty child fields, while the implementation preserves the demo's existing graduation-requirement content.

## Static-file entry

The Vue entry and standalone `index.html` contain the same editor behavior and styling contract. The application browser's URL policy rejected direct `file://` navigation, so standalone browser interaction is not claimed; its inline script was syntax-validated and the shared static implementation was kept in sync.

final result: passed

---

# 专业选择弹窗分页修复设计验收

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-a9adfac6-bf11-4afb-9fde-a52a47473271.png`
- Implementation screenshot：`artifacts/major-picker-pagination-fixed.png`
- Full-view comparison：`artifacts/major-picker-pagination-full-comparison.png`
- Focused comparison：`artifacts/major-picker-pagination-focused-comparison.png`
- Viewports：2048 × 1240、1440 × 720
- State：产业调研待初始化，打开“选择教育部备案专业”弹窗；本科专业共 105 页。

## Findings

- P0：无。
- P1：无。
- P2：无。
- 字体与层级：保留现有苹方 / 微软雅黑字体栈、字号、字重和信息层级。
- 间距与布局：弹窗保持 760px 目标宽度；分页、取消和确定按钮均位于弹窗底部区域内。
- 颜色与令牌：沿用现有蓝色选中态、灰色边框和遮罩透明度。
- 图片与资产：该弹窗不包含图片资源，本次未新增或替换资产。
- 文案：专业层次、搜索提示、专业名称和操作文案均保持不变；仅将连续全量页码压缩为首尾页、当前页邻近页和省略号。

## Geometry Evidence

- 2048 × 1240：弹窗 `left=644`、`right=1404`、`width=760`，页面 `scrollWidth=2048`；分页器共 6 个按钮和 1 个省略号。
- 1440 × 720：弹窗 `left=340`、`right=1100`、`width=760`，页面 `scrollWidth=1440`；底部操作区完整可见。

## Primary Interactions

- “下一页”从第 1 页切换到第 2 页，紧凑页码窗口同步更新。
- 切换到“职教”后搜索 `510209`，可定位并选择“人工智能技术应用”。
- 点击“确定”后初始化流程完成，关联专业和人工智能产业链正常显示。
- DOM 状态和开发服务器输出未出现运行时错误；浏览器页内控制台读取接口未暴露，本次以交互完成和服务端运行日志作为错误检查依据。

## Comparison History

1. 原始 P1：全部 105 个页码一次性渲染，分页器的最小内容宽度把弹窗横向撑出屏幕。
2. 修复：页码改为紧凑窗口，并为弹窗网格、内容区、底部和分页器添加宽度收缩约束。
3. 复验：完整页和局部对比均显示弹窗、分页和操作按钮完整收纳；无剩余 P0/P1/P2 问题。

## Final Result

passed

---

# 产业链图谱连续泳道设计 QA

- 参考图：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-2c5a4007-39a8-4107-b26a-4fe7eebdfce6.png`
- 实现页面：`http://127.0.0.1:5173/?view=job-industry&tab=chain`
- 对照图：`artifacts/industry-treemap-continuity-comparison.png`
- 检查状态：矩形树图、默认智能建造产业链、桌面布局

## 检查结果

- 顶部上游、中游、下游箭头首尾咬合，前一段箭头与后一段凹口重叠 18px，无白色断缝。
- 三列容器取消独立圆角和独立边框，共用一个 16px 外轮廓。
- 三列间距为 0，列背景从标题下方连续延伸到底部。
- 三列实测顶边和底边一致，相邻列的右边界与下一列左边界完全重合。
- 桌面窄内容区使用可收缩比例列宽，不再因最小宽度溢出而裁切下游内容。
- 1180px 以下恢复分栏堆叠、独立边框和圆角，避免移动端连续箭头变形。

final result: passed

---

# 关联国标行业 / 去重企业详情弹窗 Figma 还原 QA

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-9a50f64c-0d87-4265-a08a-a04973f621c2.png`
- 修复前实现截图：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-704832a9-a812-4548-9852-72e1cb73ae77.png`
- Viewport：3570 × 2170；Figma 画布缩放 98%。
- 状态：产业链图谱页，打开“关联国标行业”详情弹窗。

## 修复前差异

- P1：实现弹窗约 720 × 835px，Figma 目标约 620 × 700px，整体明显过宽、过高。
- P1：摘要区错误使用外层描边加内层卡片，Figma 是单层浅蓝渐变卡片。
- P1：通用 section 的 22px 外边距与弹窗 grid gap 叠加，导致各模块纵向间距膨胀。
- P2：关闭按钮错误使用圆形底；统计卡错误使用白底描边；标签、提示框的颜色与圆角也不一致。

## 已落地修正

- 弹窗宽度锁定为 620px，头部 72px，内容左右边距 24px。
- 摘要区改为蓝色胶囊、蓝色主值、同卡摘要正文的单层结构。
- section 外边距归零，统一由 22px grid gap 控制垂直节奏。
- 统计卡改为无边框浅紫灰底，数值改为 Figma 蓝；关联行业改为圆形胶囊标签。
- 专业建设提示改为独立标题加浅蓝提示框，并使用 Tabler Icons 灯泡资产。
- Vue 与直接打开的静态 `index.html` 共用同一结构和视觉契约。

## 阻塞项

- 本地页面通过 `file://` 打开；当前内置浏览器安全策略拒绝该 URL，且不允许用其他浏览器表面或本地 HTTP 规避。因此无法生成修复后的实现截图，也无法按要求制作 source + implementation 的同图对照输入。
- 代码视觉契约、全量测试与生产构建均可验证，但最终像素 QA 仍需用户刷新后的截图。

final result: blocked

---

## Current Task Verdict — AI 助手悬浮入口

当前任务的完整 QA 记录见上方“AI 助手悬浮入口与建议弹层设计 QA”。浏览器渲染、同屏全景与聚焦对照、四项交互、控制台和视觉密度复验均已完成；无剩余 P0/P1/P2。

final result: passed

---

## Current Task Verdict — 人才方案空状态与智能导入

完整 QA 记录见上方“人才方案空状态与智能导入 Design QA”。五类空状态、上传与解析结果弹窗、模块预览/勾选分离、重新解析、部分确认、461 项全量测试、生产构建、控制台和五张同屏视觉对照均已完成；无剩余 P0/P1/P2。静态 `file://` 直接截图受应用内浏览器安全策略限制，已由真实事件 VM 主路径测试和 Vue/静态共享视觉契约补证。

final result: passed

---

# Design QA — 产业链图谱配色对比

- Source visual truth: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-6d8484df-3b5b-4da3-9446-48ec9d2fc37a.png`
- Implementation screenshot: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/design-qa-reference.png`
- Browser viewport: 1280 × 720 CSS px
- Source pixels: 2666 × 1358
- Implementation pixels: 1280 × 720 at device scale factor 1
- Density normalization: none; the source is a focused graph crop while the implementation is the live page viewport. Comparison was limited to the shared treemap region and requested color behavior, not page geometry.
- State: intelligent-construction chain, treemap view, reference palette active

## Full-view comparison evidence

The live page keeps the existing demo structure and adds the palette control beside the treemap/Sankey control. The control does not displace the title or KPI cards at the verified desktop viewport. The source and implementation were opened together for visual comparison.

## Focused region comparison evidence

The graph region reproduces the requested semantic palette: upstream uses a very light blue field with periwinkle card accents, midstream uses a mint field with teal accents, and downstream changes from purple to a warm pale peach field with coral accents and coral enterprise-count text. The existing arrow headers remain intentionally unchanged in geometry because the request was color-only.

## Required fidelity surfaces

- Fonts and typography: existing product typography, weights, wrapping, and hierarchy are preserved; no regression observed.
- Spacing and layout rhythm: the new control aligns with the existing view switch, with an 8 px gap and no visible overlap at 1280 × 720.
- Colors and visual tokens: the three stage surfaces, header treatments, card accents, and enterprise-count colors follow the reference blue / mint / peach-coral direction.
- Image quality and asset fidelity: no new image assets are required; existing assets remain unchanged and render sharply.
- Copy and content: graph content is unchanged. The control labels clearly expose `图二配色` and `恢复原配色` states.

## Interaction and runtime checks

- Clicked `图二配色`: button changed to pressed state and the treemap changed palette without changing view.
- Clicked `恢复原配色`: pressed state returned to false and the original palette returned.
- Clicked `图二配色` again: pressed state returned to true.
- Browser console errors: none.

## Findings

No actionable P0, P1, or P2 mismatches in the requested color-comparison scope.

## Comparison history

- Initial comparison: no P0/P1/P2 issues found; no visual fix iteration was required.

## Follow-up polish

- P3: the source reference uses flatter stage fields while the existing demo uses directional header gradients. This is retained intentionally to isolate the color validation from a layout/style redesign.

final result: passed

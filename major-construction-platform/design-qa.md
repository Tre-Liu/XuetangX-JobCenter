# 人才方案管理侧边栏对齐产教模型 Product Design QA

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-0311e9af-ace8-4665-baf6-8092dbfc00e6.png`
- QA 内副本：`.codex-qa/old-talent-sidebar-source.png`
- Reference component：同一应用内的“产教模型”侧边栏。
- Reference screenshots：`.codex-qa/vue-industry-reference-2048x1240.png`、`.codex-qa/vue-industry-reference-1440x720-top.png`、`.codex-qa/vue-industry-reference-1440x720-bottom.png`
- Implementation screenshots：`.codex-qa/vue-talent-2048x1240.png`、`.codex-qa/vue-talent-1440x720-top.png`、`.codex-qa/vue-talent-1440x720-after-sidebar-wheel.png`、`.codex-qa/vue-talent-1440x600-internal-scroll.png`
- Focus evidence：`.codex-qa/vue-talent-focus-2048x1240.png`
- Full-view comparison：`.codex-qa/talent-sidebar-comparison-board.png`
- Focused comparison：`.codex-qa/talent-sidebar-focused-comparison.png`
- Verified entries：Vue `http://127.0.0.1:4173/`；实际 `file://` 地址已尝试，但被所选浏览器的 URL 安全策略在导航前拦截；同一 `index.html` 的本地 HTTP 路径与 file-only 代码测试见下文。
- Browser surface：内置 Browser 不可用后，按已批准的 Browser 工作流使用 Chrome browser-client；未使用独立 Playwright、CDP 或其他浏览器表面。

## Capture Normalization

| Evidence | CSS viewport / state | Output pixels | Density and normalization |
| --- | --- | --- | --- |
| 用户旧截图 | 原浏览器 viewport 不可从图片可靠恢复；旧平铺侧栏、培养目标活动态 | 3442 × 2108 | 原图疑似 Retina 2x，含浏览器框架；只用于层级改造上下文，不做像素级判断 |
| 产教参考 + 人才实现宽屏 | 2048 × 1240；分别为“产业链图谱”和“培养目标”活动态 | 各 2048 × 1240 | `devicePixelRatio=1`；应用 `--workspace-scale=0.90`；等像素同状态对照 |
| 产教参考 + 人才实现矮视口 | 1440 × 720；顶部状态 | 各 1440 × 720 | `devicePixelRatio=1`；应用 `--workspace-scale=1`；等像素同视口对照 |
| 人才焦点局部 | 来自 2048 × 1240；“人才培养方案比对”键盘聚焦 | 176 × 760 | `devicePixelRatio=1`，未放大；与参考/实现侧栏一起进入 focused comparison |
| 同图对照板 | 1721 × 877 比较页窗口，完整页面 | 1721 × 3552 | 宿主页报告 DPR 2；截图 API 输出已按 CSS 像素归一化 |
| 局部对照板 | 1721 × 877 比较页窗口 | 1721 × 877 | 宿主页报告 DPR 2；截图 API 输出已按 CSS 像素归一化 |

## Full-view and Focused Evidence

- 完整对照板把用户旧截图、产教模型参考、新人才侧栏、两个要求视口和滚动证据放在同一个浏览器渲染输入中后再判断；未从分离截图或代码记忆直接下结论。
- 2048 × 1240 全景：参考与实现的 dock、顶栏、侧栏起点、侧栏背景和主内容起点稳定；人才侧栏从旧平铺结构重组为“方案建设 / 方案调研 / 方案比对”三段层级。
- 1440 × 720 全景：三组和七个入口全部可见，主内容没有被侧栏挤压或横向溢出。
- 局部对照板在同一输入中并列 176 × 664 CSS px 的参考/实现侧栏及键盘焦点截图，用于检查图标、按钮、字号、分组节奏、选中态和焦点轮廓。

## Geometry Evidence

- CSS 视觉契约：侧栏 `176px`，分组/按钮 `128px`，按钮 `30px` 高，图标 `34px × 34px`，选中态为 `#1d6fff → #8b5cf6` 的 90° 渐变。
- 2048 × 1240 因应用统一 0.90 工作区缩放，参考与实现均实测：侧栏 `158.398px`，按钮 `115.195px × 27px`；这与 CSS token 的 0.90 缩放一致，不是组件漂移。
- 1440 × 720 在 1.00 工作区缩放下，人才侧栏实测 `176px × 664px`，七个菜单均为 `128px × 30px`，三枚图标均为 `34px × 34px`。
- 1440 × 720 页面 `scrollWidth=clientWidth=1440`、`scrollHeight=clientHeight=720`；主画布 `1162px × 636px`，无全局横向或纵向溢出。
- 两个长标签的 `clientWidth=scrollWidth=126px`，`white-space: nowrap`，无换行、截断或省略号。

## Required Fidelity Surfaces

- Fonts and typography：实现与参考均使用现有 Inter / 苹方 / 微软雅黑字体栈；分组标题、辅助分隔标题、菜单文字的字号、字重、行高与层级一致。七个标签均保持单行且光学密度稳定。
- Spacing and layout rhythm：176px 侧栏、31/24/16px 内边距、128px 菜单列、74px 标题区、8px 菜单间隔和 20px 分组间距沿用产教模型节奏；两个要求视口没有碰撞、裁切或主体位移。
- Colors and visual tokens：浅蓝三段渐变、白色半透明按钮、深蓝活动分组标题、蓝紫选中态和阴影与参考一致；活动/非活动标题实测分别为 `rgb(29, 78, 216)` / `rgb(31, 45, 74)`。
- Image quality and asset fidelity：侧栏不含照片、位图插画、品牌标志或待替换产品图；三枚 34px 功能图标沿用现有应用的渐变、描边和阴影语言，边缘清晰，无压缩、拉伸、透明光晕或占位资产。
- Copy and content：保留“培养目标、毕业要求、课程管理、支撑矩阵、学生管理、人才培养方案调研、人才培养方案比对”七个业务入口；分组文案清晰对应建设、调研、比对任务，未出现提示词泄漏或无关占位文案。

## Primary Interactions

- 在 Vue 入口依次点击七个入口；每一步内容标题分别切换到目标页，且仅有一个 `aria-current="page"`。
- 培养目标、毕业要求、课程管理、支撑矩阵、学生管理均同步高亮“方案建设”；人才培养方案调研同步高亮“方案调研”；人才培养方案比对同步高亮“方案比对”。
- 从版本按钮开始连续按 Tab，七个入口按 DOM/视觉顺序全部获得焦点；CSS 2px 焦点轮廓在 0.90 工作区缩放下实测为约 1.667px，并保持可见。
- 1440 × 720 时第三组末项底边为 `y=673px`，已在 720px 视口内完整可达；对侧栏执行滚轮后，侧栏、主内容和文档 `scrollTop` 均保持 0，说明没有不必要的滚动或滚动串扰。
- 补充 1440 × 600 压力检查：侧栏从 `scrollTop=0` 滚到 `89`，第三组末项仍可见；主内容和文档均保持 `scrollTop=0`，证明需要滚动时由侧栏内部独立承接。
- 参考产教侧栏在 1440 × 720 从 `scrollTop=0` 滚到 `147`，主内容保持 0；人才侧栏继承了相同的内部滚动模式。

## Static `file://` Entry Evidence

- 已请求工作树内实际地址：`file:///Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.worktrees/talent-sidebar-alignment/major-construction-platform/index.html`。
- 所选 Chrome browser-client 在导航前返回 URL-policy 拦截，当前页保持 `about:blank`；这是浏览器环境限制，不是页面加载或运行时错误。根据安全规则未使用间接协议伪装、CDP、脚本注入或其他浏览器规避。
- 浏览器支持的本地 HTTP 路径 `http://127.0.0.1:4173/index.html` 成功渲染同一入口文件，七项侧栏结构与 Vue 根路径一致，控制台无 error/warning；截图为 `.codex-qa/served-index-http-fallback-1440x720.png`。
- HTTP 协议按设计进入 Vue 分支，因此不能替代 file-only 委托分支的浏览器证据；页面实测 `data-talent-section=0`、`data-talent-subsystem=0`，未把该 HTTP 结果冒充 `file://` 结果。
- file-only 代码路径由完整测试和专项测试覆盖：静态入口包含五个 `data-talent-section` 与两个 `data-talent-subsystem` 入口、三组结构、唯一 `aria-current` 生成逻辑，以及兼容文本节点点击目标的委托逻辑。专项结果为 3/3 + 1/1 通过。

## Console and Automated Checks

- Vue 入口在七个点击状态、两种要求视口、键盘焦点和滚动检查后：console errors `[]`，warnings `[]`。
- 同一 `index.html` 的 HTTP 回退路径：console errors `[]`，warnings `[]`。
- `npm test`：347 tests，347 pass，0 fail。
- `npm run build`：退出码 0；Vue TypeScript 检查、客户端构建和 SSR 构建完成。现有非模块脚本与大 chunk 提示为构建 warning，不是本次侧栏运行时错误。

## Findings

- P0：无。
- P1：无。
- P2：无。
- P3：无新增建议；本轮未为非阻塞润色修改生产代码。
- 环境限制：无法在所选浏览器中直接打开 `file://`，因此静态委托点击没有浏览器像素/交互证据；已如实保留此残余测试缺口，并以同文件 HTTP 渲染、完整测试和专项代码契约验证覆盖可验证部分。

## Comparison History

1. Pass 1：在同一对照板中比较旧截图、产教模型参考和新人才侧栏；五个必查表面、全景、局部、活动态、焦点态和滚动隔离均未发现 P0/P1/P2。
2. 本轮没有视觉修复或生产代码变化，因此不需要第二轮修复后对照；最终证据即上述截图与同图对照板。

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

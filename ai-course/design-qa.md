# AI 课程框架视觉与交互检查

final result: passed

范围：本地桌面课程框架与项目编辑主流程。通过不代表已实现知识图谱、真实 AI 或班级发布。

## 视觉依据

- 主参考：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-49692fb6-dd0f-4608-829d-b264c804ca63.png`（3462 × 1908）。
- 弹窗参考：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-6ea9229d-96ba-438f-b492-2ab3c4231d93.png`（3600 × 2100；排除浏览器工具栏）。
- 实现：`http://localhost:5186/`，Codex 内置浏览器。
- CSS 视口：1728 × 953；紧凑桌面 1200 × 900；临时视口设置已恢复。
- 首轮：`outputs/qa/project-full.png`；修正后：`outputs/qa/project-after.png`。
- 同图并列比较：`outputs/qa/comparison.png`；弹窗局部比较：`outputs/qa/modal-comparison.png`。
- 浏览器 fullPage 导出在 CSS 大小的画布左上角提供 0.5 倍内容，右下方为空白画布。比较时裁去空白，参考图同比例缩至 864 × 477；未据此宣称像素级误差。局部弹窗扩大以检查层级，截图重采样造成的模糊不计为产品字体缺陷。

## 发现与修正记录

1. 初版桌面侧栏及全局栏总宽 306 px，比截图目标窄，主卡片偏左。已调整至 68 + 255 px，顶部 46 px，概览最小高度 160 px。修正后截图与并列比较确认主要分区和对齐接近参考，无待处理 P0/P1/P2。
2. 顶部菜单在紧凑桌面宽度下改用更小间距，1200 px DOM 测得 scrollWidth = innerWidth = 1200，无水平溢出。

## 五项检查

- 字体：系统中文字体，课程标题、模块名、正文与说明分级；项目/阶段/任务长名称可换行，侧栏简介省略。
- 间距：保留顶部白色导航、深色全局栏、白色课程侧栏、蓝色概览、阶段圆标和任务白卡。首屏展示两个阶段。
- 色彩：蓝色主操作，绿色第二阶段，浅蓝内容添加条，紫色计分标签。
- 图像/图标：Phosphor 图标用于功能图标；框架不复刻第三方专属品牌、助手头像及旧版系统入口。知识图谱模块仅为空态入口，本期不声称还原图谱画布。
- 文案：顶部和侧栏按截图组织；生成与发布弹窗明确本地演示边界。侧栏多出的「智能制造实践」是主流程检查创建的示例项目。

## 浏览器主流程

- 默认项目：2 阶段、2 任务、0 学习单元、0 拓展学习。
- 新建项目：0/0/0/0；生成后：3 阶段、6 任务，学习内容仍为 0。
- 新增「工业机器人工作站认知」学习单元后，学习单元计数为 1，预览可见。
- 关闭顺序解锁后，预览显示可自由选择学习阶段。
- 阶段改名、增加、删除确认、计数回落、收起/展开均实测。
- 刷新后新建项目仍保留；知识库、AI应用、AI决策中心、成员均可切换到对应框架页。
- 浏览器捕获的 warn/error 日志为空。

## 构建与边界

- 业务模型与离线入口测试 6/6；构建与站点打包测试 4/4 通过。
- 根目录 index.html 和 offline.html 从 dev.html 同源构建，CSS/JS 均已内嵌。已修复源代码开发入口无法双击的问题，并将内联脚本移至 body 末尾，避免 React 在 #root 创建之前启动。
- JSDOM 使用 file: 来源执行完整 index.html，实测课程挂载及点击添加阶段成功；不是仅做语法检查。
- 浏览器安全策略禁止 file:// 导航，因此未进行离线文件的浏览器视觉/交互验收；没有绕过策略。在线原型的浏览器检查已完成。
- 手机端不作为本期交付验收目标；真实 AI、学习资源、评价和班级发布为后续建设范围。

## 后续微调

- P3：如需完全对齐原系统，可补充已授权品牌素材与准确字体；当前以独立课程框架为准。

## 知识图谱迭代（2026-09-07）

知识图谱已由空态升级为 121 节点环形图谱。最新视觉依据、修正、浏览器与离线验证详见 `outputs/qa/knowledge-qa.md`，该迭代 final result: passed。此前本文件中“图谱仅为空态”的描述仅对应初版框架，已被本次实现替代。

## 2026-09-07 岗位任务教学化转化

- 已完成四步宽弹窗，延续白色面板、蓝色高亮和原课程导航；桌面 1440 × 1000 检查了任务来源选择和生成审阅页。
- 窄屏 390 × 844：DOM 检查文档宽度 390，弹窗与滚动内容宽度均为 358，无横向溢出。当前截图工具在切换视口后有缩放异常，未以该缩略截图断言字体视觉质量。
- 浏览器走通人培样本岗位 → 六项能力 → 教学设计 → 审阅确认 → 创建新项目；原项目保留。
- 浏览器走通无岗位样本人培 → 手动岗位 → 能力草稿编辑 → 基础型 → 填充工作对象及工具 → 审阅 → 创建项目，控制台无 error。
- 独立 HTML 在 file-origin JSDOM 中验证挂载、前置条件禁用、完整项目生成、已有项目保留、学习活动编辑入口和学习者预览；浏览器自动化不直接访问 file://，未绕过该限制。
- 生成内容明确标为本地规则草稿；人培样本注明学校、文件、PDF 定位和原始岗位名称，未冒充真实课程后台关联或在线 AI 输出。
- 截图：outputs/qa/job-project-source.png、outputs/qa/job-project-review.png。
- 构建同时更新根 index.html 与 offline.html；保留 Sites 打包结构。

## 2026-09-07 新增项目基础信息弹窗验收

- Source visual truth: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-1cdd70e8-40db-4fd8-a9f9-97d03bb1efac.png`，3530 × 2100。
- Implementation screenshot: `outputs/qa/project-create/implementation.png`，900 × 911，开发预览 `http://127.0.0.1:5186/`。
- State: 知识图谱背景，空白“新增”弹窗，默认叠层图标，确定禁用。
- Full-view evidence: 本任务 CUA 全屏截图已检查，窄桌面顶部菜单使用原有响应式布局，所有弹窗控件可见。
- Focused comparison: `outputs/qa/project-create/comparison.png`。原图按 2048 × 1218 展示坐标截取 (818,330)-(1417,983)，归一化到 520 × 566；实现截取 (190,173)-(710,739)，并排比较。仅对弹窗做等比例比较，不把不同屏宽下的背景布局作为偏差。
- 字体：沿用系统中文字体，14px 字段、16px 标题，标签与输入内容层级清楚。
- 间距：520px 弹窗、36px 左右内边距、80px 标签列、36px 输入框、75px 文本域；分隔线、行距与底部按钮位置符合参考。
- 颜色：白色表单、浅灰蓝边框、红色必填标记、浅蓝禁用按钮与参考保持一致。
- 图像与图标：无新增栅格素材；使用现有 Phosphor 图标库。P3：圆环、三角与叠层图标的内部笔画不是原产品专有图标的逐像素复刻。
- 文案：新增、ICON、标题、标题（英文）、描述、描述（英文）、占位文字和取消/确定均对应截图。
- 浏览器交互：默认图标选中；填写中文两项后确定启用；切换图标；取消后恢复空白默认表单。验收填写已取消，未创建真实教学项目。
- Standalone 交互检查：空值/纯空格阻止提交、英文可选、图标及英文字段保存、编辑回填、取消、关闭、新增重置、原项目保留均通过；隔离 JSDOM 的运行错误为 0。
- Existing regression checks: `npm test` 15/15；`npm run test:sites` 4/4；`npm run build` 成功，index.html 与 offline.html 已同步。
- 限制：浏览器策略禁止直接访问原 file URL；离线入口通过构建产物的 JSDOM 交互检查，视觉检查使用开发服务器。手机全流程和浏览器控制台未单独验收。
- Comparison history: 首次并排对比无 P0/P1/P2 问题；P3 图标内部笔画差异作为后续精细还原项。
- final result: passed

## 2026-09-07 添加任务内容浮层

- Source visual truth: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-8f74dcd6-d19b-412d-acc4-dd668421c98d.png`，3530 × 2100。
- Implementation screenshot: `outputs/qa/task-content/implementation-after.png`，1728 × 980；CSS viewport 为 1728 × 980，截图像素与 CSS 大小按 1:1 处理。实现截图渲染略模糊，未据此声称逐像素一致。
- State: 项目编辑页，当前任务的“添加任务内容”浮层展开；默认项目既有两阶段和两条目标保留，截图参考的空任务数据没有覆盖本地草稿。本次视觉验收范围为新增浮层，背景沿用既有课程框架。
- Full-view evidence: `outputs/qa/task-content/full-comparison.png`；来源全图缩至 864 × 514，实现缩至 864 × 490，含原图浏览器工具栏差异，用于检查浮层与任务区域关系，不用于断言全页像素还原。
- Focused evidence: `outputs/qa/task-content/comparison-after.png`。参考按 2048 宽显示坐标裁取 (1066,602)-(1576,971)，映射回原始像素后等比例归一化至 440 × 318；实现按 CSS 坐标 (856,517)-(1296,835) 裁取，两图以相同面板尺寸并排比较。
- Comparison history: 首轮 `comparison.png` 发现卡片内边距使浮层高出参考 10px；将计分卡片调整为 56px 高，复验 `comparison-after.png` 的两卡片、分组标题、底部按钮均已对齐。无待处理 P0/P1/P2。
- 字体与文案：14px 标题与选项、13px 说明，逐项对应截图；系统中文字体沿用项目设置。
- 间距与色彩：440px 白色浮层、25px 水平内边距、12px 卡片间距、32px 分组间距；知识点蓝色、学习单元绿色，底部三按钮并排。Phosphor 图标复用现有库。P3：图标内部笔画与原产品专属图标存在差异。
- Position: 桌面浮层距按钮底部 12px，水平居中；下方空间不足时翻转到上方，屏幕边缘限制与内容滚动可用。390 × 844 检查 documentWidth=390，浮层 x=12、宽366，无横向溢出。
- Browser interactions: 学习单元打开计分表单、云盘打开不计分表单；取消可返回；展开浮层与窄屏显示已实测。浏览器 warn/error 日志为空。
- Regression: `npm test` 16/16，含五个入口、Escape 焦点返回、点击外部关闭、选中第二阶段任务保存且不修改第一阶段、来源/计分持久化和计数；`npm run test:sites` 4/4；`npm run build` 成功，保留现有大包体积提示。
- Offline: 根 index.html 与 offline.html 已同源更新，既有 file-origin DOM 挂载检查通过；新菜单完整交互测试运行在隔离 JSDOM 的 HTTP 来源中，以便核验 localStorage。未声称 file:// 的真实浏览器视觉验收。
- Scope: 五个来源入口和草稿保存可用；真实课程资源选择、知识点连带学习单元关联、云端上传与班级记录同步仍未接后台。本地文件仅保存名称、大小与类型，表单明确提示尚未上传。
- final result: passed

## 2026-09-07 知识点与学习单元关联弹窗

- Source visual truth: 知识点 `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-0d777dd4-4dd7-4971-85a2-7f803e32cdf1.png`；学习单元 `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-3eb4a9a2-14d7-4feb-ba8a-8fe7ae922922.png`，均为 3530 × 2100。
- Implementation: `outputs/qa/associations/knowledge-after.png`、`outputs/qa/associations/units-after.png`，1728 × 980，CSS 视口 1728 × 980，像素按 1:1 归一化。
- State: 对应弹窗初始展开、未搜索、无新选项、确定禁用；知识点首屏展示 2/3/4 级节点，课程资源展示截图中的唯一图文记录。背景保留现有项目数据，未覆盖为截图空任务。
- Full-view evidence: `outputs/qa/associations/knowledge-full-comparison.png`、`outputs/qa/associations/units-full-comparison.png`，已经打开检查；背景沿用已有框架与其他任务的独立改动，不在此次重画范围。
- Focused evidence: `outputs/qa/associations/knowledge-comparison.png`、`outputs/qa/associations/units-comparison.png`，已并列打开逐项核对。参考按 2048 宽显示坐标 (702,263)-(1533,887) 换算原图裁取后归一化为 720 × 540；实现裁取 (504,220)-(1224,760)。两侧均为同样大小与交互状态。
- Comparison history: 首轮发现全局 `.modal` 样式覆盖导致实际宽416px，知识名称列挤压。提高专用弹窗样式优先级后，实际尺寸720 × 540，表格列宽与首屏五行恢复。随后将学习单元类型列居中，与参考对齐。后续比较无本次弹窗范围内待处理 P0/P1/P2。
- 五项视觉检查：系统中文字体与16px标题、14px表格层级清楚；24px内边距、32px筛选框、58px表格行与参考接近；浅灰表头、蓝色查询与确定、浅蓝禁用状态对应；仅用现有图标库和原生复选框；标题、表头、占位文字与图文资源名均对应附件。P3：原生复选框及下拉箭头笔画与参考有细微差异。
- Browser QA: 实测知识点“智能制造”+“4级”联合筛选，仅返回两个对应节点；全选后确定启用；取消返回；学习单元弹窗内容和禁用状态正确。浏览器记录 warn/error 为空。390 × 844 下关联弹窗宽358px、x=16、内部无水平溢出；并行新增岗位任务模式导致背景操作条临时溢出已通知对应任务处理，不作为关联表格通过的依据。
- Data linkage: App 维护共享 graph 状态，KnowledgeGraph 与关联列表使用同一节点 ID；按 ID 解析任务标题，图谱改名可同步。节点默认从二级列出，根节点不用于任务关联。计数仅来自节点直接关联资源；添加不递归包含子节点。同一任务的已关联项标记并禁用，保留其他筛选下的选择，当前查询结果全选不改变隐藏选择。
- Resources: 初始图文记录来自用户截图，保存稳定 resourceId、名称和类型；未提供文件正文，未声称可以阅读该报告或已连接真实后台。现有知识节点无直接资源关系时，显示图文0个、视频0个。
- Verification: `npm test` 18/18，另 `node --test tests/knowledge-availability.test.mjs` 1/1，`npm run test:sites` 4/4；`npm run build` 成功并同步 index.html/offline.html。新增测试覆盖已有图谱修订、按 ID 关联、直接资源范围、去重、跨筛选多选、无结果、资源类型筛选、准确任务归属、关闭知识点可用性时清空选择与禁用确认。继承的包体积提示仍存在。
- final result: passed

- 最终窄屏复验：为原有 `.hero-actions` 增加窄屏换行，岗位任务模式独占一行，未改动其业务行为或 ProjectEditor.jsx。390 × 844 复测 documentWidth=390、弹窗宽358px、内部无水平溢出，证据 `outputs/qa/associations/mobile-after.png`；上文并行背景溢出已解决。
- 最终集成收口：并行任务随后将岗位任务模式移回生成弹窗，已移除临时操作条换行补丁，保留该任务最新实现。中间一次测试读取到旧离线产物与新模式测试不一致；统一重新构建后 `npm test` 19/19（已含知识点可用性测试）、`npm run test:sites` 4/4，全部通过。本次关联实现与测试保持完好，最终仍为 passed。

## 2026-09-07 项目预览：横向阶段看板

- Source visual truth: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-cdafda32-a00a-4e06-b0dc-90cf4b3023c7.png`（图1预览态）；图2用于确认编辑态切换入口。
- Implementation: `http://127.0.0.1:4173/`；`outputs/project-preview/desktop.png`、`outputs/project-preview/mobile.png`。
- Viewport: desktop 1708 × 969 CSS px；mobile 390 × 844 CSS px。源图 3530 × 2100 px，含浏览器工具栏和外部工具侧栏，按约 2×密度理解；实现捕获以实际页面像素为准。仅比较应用主内容区结构与卡片，不把浏览器外框差异算成缺陷。
- State: 点击“预览”后的页面看板。当前项目仍为原有两阶段两任务，和源图五阶段十五任务的数据不同；未追加或替换现有项目来追求截图数量一致。
- Full-view evidence: 原图与桌面截图均已打开比较，主内容区切换为横向阶段列，保留课程导航，右上方提供“退出预览”。
- Focused evidence: 首列任务卡、计分标签、空任务内容与连接箭头在桌面/窄屏捕获中均清晰可辨；未另裁剪区域。

### Findings and comparison history

1. [P2, fixed] 第一轮渲染受到旧弹窗 `.preview h3` 样式影响，任务标题呈蓝色。删除已不再使用的旧预览样式；最后桌面截图任务标题恢复深色，图标沿用阶段色。
2. [P2, fixed] 空项目在页面加载后立即进入预览，会被初始导航 effect 清空预览状态。将重置移至导航事件，同一回归测试失败后已通过，浏览器重新点击预览正常。
3. [P3] 未复制原站标题区右上角的折面装饰图片；使用现有界面浅色背景处理。此次验收范围为已确认的看板结构和切换行为，无自绘替代插图。

### Required fidelity surfaces

- Fonts/typography: 沿用现有 PingFang SC / Microsoft YaHei 系统字栈；阶段与任务标题 16px、内容 14px、标签 12px。标题单行省略并保留完整 title，内容名称允许换行。
- Spacing/layout: 桌面阶段列 350px、间距 48px，白色任务卡纵向排列，圆角与内边距跟随参考；窄屏列宽 320px。390px 视口页面宽度仍为 390px，看板内容宽度 704px，滚动后 scrollLeft=314，退出按钮始终在视口内。
- Colors/tokens: 蓝、绿、紫、青、橙五组阶段色循环；淡色阶段底板、深色任务标题、紫色计分标签、浅灰空内容条。
- Image/icon quality: 文档和连接箭头使用现有 Phosphor 图标库；无嵌入截图充当交互页面。课程外壳沿用现有组件。
- Copy/content: 使用实时项目阶段/任务/关联资源，资源类型与计分标签分别展示；无内容“暂无任务内容”，无阶段提示退出预览创建框架。已生成项目的学习说明与活动信息保留。

### Verification

- `npm run build`: passed（现有大 bundle 提示，不阻断构建）。
- `npm test`: 21 passed；`npm run test:sites`: 4 passed。
- 验证了预览/退出、折叠状态与草稿不变、空项目、多项目切换、关联资源名称与图文/计分/不计分标签、岗位活动保留、发布预览复用看板。
- 浏览器检查：桌面和窄屏预览，横向滚动，退出按钮，console errors=[]。
- `index.html` 与 `offline.html` 同步构建且内容相同；file-origin DOM 运行检查通过。浏览器 file:// 入口被 URL 安全策略阻止，未做该协议下的像素验收。
- 验收过程中“开始生成”被自动审批拒绝，因为追加项目框架不属于本次布局任务；未执行也未绕过。

final result: passed

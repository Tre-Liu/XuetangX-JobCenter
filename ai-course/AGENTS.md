# Prototype Instructions

知识图谱主画布左下角保留隐蔽的知识点有/无演示开关：鼠标移入或键盘聚焦后显现入口，点击选择状态；状态在浏览器记忆，并同步项目任务的知识点关联列表。“无”展示空图谱和空关联列表；切换不删除图谱、教师编辑或已有任务关联，切回“有”恢复。源码与根目录 index.html、offline.html 同步构建。

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## AI 课程的岗位项目设计

「岗位任务模式」必须作为生成弹窗内部的开关项，不能放在项目页。点击「AI 生成框架」默认打开原有小弹窗，开关关闭；打开开关切换到岗位工作任务向导，向导内仍可关闭开关切回原弹窗。普通模式保留向当前项目追加阶段、任务的行为。同步构建根目录 index.html 与 offline.html。

岗位项目生成的关联专业和人培方案均为选填，可独立选择或留空并直接下一步；移除“启用该专业的产教模型”复选框及启用前置条件。只按已选专业、人培筛选参考岗位，两者都选时保留专业一致性校验；无合适岗位时允许手动补充。按用户附件的学习型工作任务方法进行教学化转化，保留岗位任务与原子能力出处，区分资料参考、AI/规则草稿与教师修订。课程页面须同步构建可通过 Finder 打开的根目录 index.html。

岗位项目生成弹窗不展示左侧“转化方法依据”说明块，也不展示底部“本地原型 · 关联信息与生成草稿仅保存在此浏览器”提示。

新增「项目式学习」弹窗以用户提供的雨课堂截图为准：标题为“新增”，包含三种可选 ICON、必填中文标题、选填英文标题、必填中文描述、选填英文描述，底部“取消 / 确定”；中文必填项未填完整时禁用“确定”。保存图标及中英文字段，编辑时回填；同步根目录 index.html 与 offline.html。

“添加任务内容”使用用户截图中的按钮下方白色浮层：计分区为知识点、学习单元两张卡片，不计分区为知识库、云盘、本地文件三个并排按钮。保留截图文案与蓝/绿配色，支持点击外部和 Escape 关闭；内容来源与计分口径随所选入口保存，同步 index.html 与 offline.html。

项目任务的“知识点”入口打开“关联知识点”列表，和知识图谱共用节点数据及 ID，支持名称搜索、2/3/4 级筛选、多选及当前查询结果全选；关联只包含所选节点和它的直接学习单元，不递归包含子节点。“学习单元”入口打开“关联课程资源”，包含名称搜索、图文/视频类型筛选及多选；列表以用户第二张截图的图文资源为初始记录，保留来源证据，不捏造文件正文。已关联项禁止重复添加，无选择时确定禁用；图谱改名后任务名称同步。

点击项目页“预览”切换主内容区为横向阶段看板，保留顶部与左侧导航；不同颜色阶段列用箭头连接，列内任务卡展示当前关联内容、资源类型及计分标签，空内容显示“暂无任务内容”。预览不提供编辑操作，溢出横向滚动；“退出预览”恢复编辑态与折叠状态。源码与 index.html、offline.html 同步构建。

项目学习说明默认展示简易岗位能力图谱：学习型工作任务关联典型工作任务与岗位，典型任务可展开本学习任务关联的能力项，岗位可向上展开产业环节与产业链。沿用已有岗位、任务、能力 ID 与来源；产业归属缺失时展示未关联，历史推断保留待复核标记。源码、index.html、offline.html 同步构建。

项目预览采用“项目步骤 / 岗位关联图谱”两个互斥可切换视角，默认项目步骤。岗位关联图谱复用成果页的 JobCompetencyMap 图谱形态和节点展开交互，独占主内容区，默认展开产业归属；不使用横向五卡片，不叠放在步骤看板上方。保留当前项目、典型工作任务、岗位、产业环节、产业链及关联能力项，产业关系保留原始来源与复核状态，缺失时显示未关联，不按课程名称猜测。兼容已有浏览器草稿，源码与 index.html、offline.html 同步构建。

项目式学习侧栏每个项目右侧提供省略号菜单，包含“编辑 / 删除”。编辑打开“修改”弹窗并回填图标、中英文标题和描述；删除弹出含项目名称的不可恢复二次确认，“取消 / 确定”。操作绑定所点项目；删掉当前项目后切到剩余项目，最后一个项目删除后保留空状态，刷新不得恢复示例。源码与 index.html、offline.html 同步构建。

课程关联图谱以用户提供的专业全景图谱（public/opendesign/industry-education-graph-prototype.html）为视觉依据：分区、半透明节点、正交关系线与选中高亮。只展示当前课程及其左右真实关联链路，按已保存数据隐藏缺失维度，不展示培养目标、毕业要求、课程目标的占位或草稿。产业、专业、课程图谱的开关删除；保留项目步骤与图谱两个独立视角。专业、产业链、产业环节、岗位、项目任务、能力项、知识点按实际关联展示，知识点仅取项目明确关联且可用的节点，禁止导入参考图里的无关专业课程及全量知识库。覆盖前述复用 JobCompetencyMap 的预览要求，原生成成果说明不受影响。

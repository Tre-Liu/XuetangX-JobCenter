# 人才培养方案修订记录与操作记录交付说明

日期：2026-10-22

## 交付范围

- 人培首页的当前草稿、暂存草稿、现有方案、最新归档成果卡片均提供“修订记录”入口、最近两条操作和“查看更多”入口。修订记录使用主操作右侧的小文字按钮，不再占用整条色块。
- “修订记录”保存业务修订说明：标题、适用版本（选填）、内容、创建人与创建时间、最近更新人与时间。专业负责人可以新增、编辑；专业成员只读。标题与内容必填。
- “操作记录”按方案标识独立保存，支持关键词与操作类型组合筛选，展示实际已记录的操作人、身份、时间、动作、功能模块、操作对象、详情以及有记录的变更前后内容。
- 变更前后内容使用中文业务名称与可读值，例如“修订标题”“适用版本”“修订内容”，关联方案、岗位、课程和能力显示名称。页面不展示内部记录、方案和操作人编号；原始字段与标识仍保留于存储和数据档案。
- 新建、载入/解析、继续修订、方案字段修改、岗位与课程引用/移除、课程创建、岗课关系调整、章节管理、正文编辑、引用依据、应用建议、生成、归档、导出和删除均接入自然业务操作。浏览、搜索和无变化的字段提交不新增日志。
- 正文输入仍自动保存，操作日志按一次编辑批次结算；完成编辑、离开章节、离开流程、切换身份、归档、导出或页面离开时记录，不按每次键入记录。
- 保存失败不生成成功日志。修订记录保存失败保留输入并回滚记录；删除失败恢复卡片及原有待保存操作。与正文无关的说明保存不会把失败的正文操作记作已保存。
- 删除方案保留该方案的历史记录；不会把被删方案的动作归到当前草稿。归档与继续修订分别使用新的方案标识，通过来源关系关联，避免将来源方案的旧操作冒充新版本操作。

## 数据与证据边界

按用户 2026-10-22 的追加要求，首次加载时为现有方案、当时已保存的旧草稿和归档分别补充三条修订说明，覆盖培养目标与 BIM 能力、装配式建造实践、智慧工地与质量安全评价。依据本工程智能建造工程的培养目标、毕业要求和已有课程名称组织内容；修订人“张明”、版本、时间与业务变化是生成情境，不代表真实学校修订、任职或审批事实。原有用户说明完整保留，三条内容追加到原记录中。具体来源同时保存在 `TalentPlanData.provenance.revisionNotes` 和每条记录的 `provenance` 中，数据档案导出保留这些字段。

说明默认日期为 2026-04-13、2026-06-08、2026-08-24。若归档的 `savedAt`（或旧草稿 `updatedAt`）更早，三条说明整体前移，使最后一条早于该时间七天。说明初始化不修改方案正文、更新日期或已有操作记录，也不生成任何自动操作日志。后续真实新增或编辑说明的动作才记入 `activity`。

初始化使用 `state.revisionNoteSeedVersion = 1` 和稳定说明 ID，刷新及重复加载不重复追加。说明来源尚未加载时不写完成标记；若已有完成标记但所有记录均无初始化来源标记、且仍有符合条件的既有方案，允许恢复补齐一次；任何一条初始化说明已存在则保持完成。新建草稿使用 `revisionNotesPolicy = 'blank'`，保持真实空态；初始化完成后的新方案、归档和续修版本也不自动填入过去的说明。负责人仍可编辑这些说明，成员只读；编辑保留初始来源标记，并以实际编辑人和时间记入操作记录。

历史 `draft.history` 在加载时迁移为操作记录，保留已有标题、详情和时间；缺失的操作人、角色或时间不补造，页面以“未记录”或“时间未记录”呈现。迁移使用稳定标识避免重复。已被旧版本 80 条上限删除的历史无法从现有存储恢复；新记录不再使用该上限。

已有岗位、课程、标准、生成内容及其来源仍沿用原数据档案。本次没有把岗位画像、结构化规则生成内容或用户本地录入转为已核验的学校、招聘或企业事实。数据档案导出同时包含本方案的记录及既有 provenance / references。

## 身份与权限接入契约

当前仓库未发现可复用的人培登录会话或专业负责人授权源。课程成员面板的角色选择只是角色列表展示，不作为当前用户身份。

两入口显式配置本地“专业负责人”身份，记录弹窗展示“当前身份”和有明确标识的“身份预览”切换，供负责人/成员行为验收。该选择不表示真实学校人员授权，也不是后端安全控制；生产环境需要从登录会话与专业成员授权取得身份，在服务端再次校验写权限，并关闭身份预览。

Vue 宿主 `TalentPlanWorkspace.vue` 接口：

```ts
actor: {
  id: string
  name: string
  role: 'professional-lead' | 'member'
}
identityPreview: boolean
```

共享 `talent-plan-workbench` 元素接口：

| 属性 | 含义 |
| --- | --- |
| `mode` | `workbench` 或 `results` |
| `actor-id` | 当前操作人的稳定标识 |
| `actor-name` | 当前操作人的业务姓名/名称 |
| `actor-role` | `professional-lead` 或 `member`；其他值不具有修订记录编辑权 |
| `identity-preview` | 设置为 `false` 隐藏并禁止身份预览切换 |

负责人权限同时检查于视图、事件处理和模型 `saveRevision`。这是前端交互约束，不能防止用户直接更改本机存储或脚本。正文编辑批次在首次修改时固定操作人，身份变化先结算当前批次；异步 Word 导出在启动时固定操作人，防止结束时身份变化导致归属错误。

## 持久化结构

继续使用 `localStorage` 键 `major-construction.ai-talent-plan.v1`，增加 `state.planRecords[planId]`：

```ts
{
  revisionNotes: [{
    id, title, version, content,
    createdAt, updatedAt,
    createdBy: { id, name, role },
    updatedBy: { id, name, role },
    provenance?: { kind, version, source, generatedAt }
  }],
  activity: [{
    id, planId, type, action, module, object, detail, at,
    actor: { id, name, role },
    before?, after?
  }],
  sourcePlanId?,
  relation? // archive / revision / source-replacement / conflict
}
```

固定现有方案使用 `planId = 'existing'`，与当前草稿的记录分离。普通方案与归档继续使用其现有 ID。

跨窗口合并按活动 ID 去重合并，不覆盖另一窗口追加的日志；修订说明按记录 ID 与更新时间合并，编辑保存检查 `expectedUpdatedAt`，旧窗口不能静默覆盖新内容。发生正文冲突时保留独立分支，待结算正文日志与归档来源同步指向正确分支。

这是本机持久化，不是服务端审计、跨设备同步或不可篡改日志。清理浏览器数据会移除本机记录；存储空间不足时页面提示未保存。本次不包含账号系统、服务器存储、修订记录删除、远程同步或新的审批流程。

## 双入口与文件范围

Vue 与静态 `index.html` 使用同一套 `model.js`、`element.js`、`views.js`、`workbench.css`。身份由 `App.vue` / `TalentPlanWorkspace.vue` 和静态元素属性显式传入，记录逻辑不重复实现。

本次变更文件：

- `src/talent-plan/data.js`：三条既有方案修订说明及其内部生成依据。
- `src/talent-plan/model.js`：数据模型、迁移、一次性说明初始化、筛选、权限、说明保存、记录合并与来源关系。
- `src/talent-plan/element.js`：记录弹窗事件、保存事务、操作记录、身份切换、编辑批次、键盘与焦点。
- `src/talent-plan/views.js`、`src/talent-plan/workbench.css`：卡片、记录弹窗、权限视图、筛选与响应式样式。
- `src/components/TalentPlanWorkspace.vue`、`src/App.vue`、`index.html`：宿主身份接口与双入口一致接入。
- `tests/talent-plan-records.test.mjs`：27 项专项测试。
- 本交付说明。

未修改 `ai-course` 或其他项目的用户未提交内容。

## 验证结果

1. 记录专项：27 项通过，0 失败。涵盖历史迁移与超 80 条完整性、负责人/成员限制、无变化保存、转义、所有卡片入口、真空态、关键词/类型筛选、刷新保留、跨窗口合并、说明冲突恢复、保存失败、删除留痕、归档/续修关系、正文批次、Esc 及焦点恢复、固定宿主身份、身份切换、异步导出归属以及业务文案与原始数据保留。追加验证一次性初始化、不覆盖用户说明、不产生虚构操作日志、新草稿保持空白、归档日期顺序、生成说明权限与来源保留、共享组件加载持久化且不改正文、缺少说明来源数据时不误写初始化完成标记，以及只有完成标记而无说明时的恢复边界。
2. 记录专项与现有人培相关回归一起运行：68 项通过，0 失败。命令：

   ```sh
   node --test tests/talent-plan-records.test.mjs tests/ai-talent-plan.test.mjs tests/ai-talent-plan-integration.test.mjs tests/talent-plan-delete.test.mjs tests/talent-plan-outline.test.mjs tests/talent-plan-standard-fields.test.mjs tests/talent-plan-richtext.test.mjs
   ```

   输出留存：`/private/tmp/talent-plan-targeted-tests.tap`。

3. 前一轮 `npm run build`：退出码 0，Vue 类型检查、Vite 客户端构建与服务端构建完成。仍存在项目现有的非 module 脚本打包提示及大于 500 kB 的 chunk 提示。输出留存：`/private/tmp/talent-plan-final-build.log`。轻入口与说明初始化更新后的 `npm run build` 也已退出码 0，输出留存 `/private/tmp/talent-plan-light-revision-build.log`。
4. `git diff --check -- .`：通过。
5. 完整 `npm test` 已执行一次，退出码 1，未通过。全量终端输出包含大量被测源码而发生截断，因此不据此声明全量通过/失败总数。下列失败已经确认，均位于本次记录功能未改动的产业链、岗位页面或培养目标表格测试逻辑：

| 文件与测试 | 失败原因 |
| --- | --- |
| `tests/ai-industry-chain-data.test.mjs` — generated AI chain bundle preserves the complete reconciled dataset | 外部输入工作簿缺失 |
| `tests/ai-industry-chain-data.test.mjs` — generated AI chain bundle retains all source node families and province evidence | 同一外部输入工作簿缺失 |
| `tests/results-portal.test.mjs` — static job analysis tabs keep rich sections and clickable portrait cards | `portraitStart > -1` 断言失败 |
| `tests/results-portal.test.mjs` — static job analysis deep links render the selected uninitialized tab without runtime errors | 独立测试环境中 `IndustryDomain is not defined` |
| `tests/results-portal.test.mjs` — job portrait level filter narrows the list results | 期望旧内联筛选表达式，实际使用共享筛选调用 |
| `tests/results-portal.test.mjs` — job portrait search matches visible job content instead of hidden associations | 期望旧 `job.name` 内联表达式，实际使用共享筛选调用 |
| `tests/results-portal.test.mjs` — portrait company cards use a coordinated summary layout | 未找到测试期望的 `portrait-company-body` 标记 |
| `tests/results-portal.test.mjs` — talent goal text cells keep balanced inner spacing | 测试期望 `11px 22px`，实际样式为 `10px 16px` |

   缺失工作簿路径：`/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据/人工智能产业链企查查/人工智能产业链.xlsx`。

   为保留完整失败名单，仅复核了 `results-portal.test.mjs`，该文件 171 项中 165 通过、6 失败；未重复运行全套。复核输出：`/private/tmp/talent-plan-results-portal-tests.tap`。

## 浏览器验收记录

以下为补充三条初始化说明之前的验收证据，由主任务在真实页面操作后提供；其中数量和空态反映当时状态：

- Vue 入口（`http://127.0.0.1:5178`，`view=ai-talent-plan`）：实际新增、编辑修订说明分别生成操作记录；当前共 1 条说明、2 条日志。
- 身份预览切换为专业成员后，新增、编辑入口消失，已有说明内容可读。
- Esc 关闭弹窗，焦点返回原触发按钮。
- 操作日志关键词无匹配时显示 0 条；关键词“编辑”与“修订记录”类型组合筛选得到 1 条。
- 页面刷新后保留 1 条说明、2 条日志；浏览器 warn/error 日志为空。
- 静态 `file://` 原页面已有 8 张方案卡，全部出现记录入口；第一卡展示最近 2 条操作，完整弹窗展示 3 条。旧历史缺失操作人时显示“未记录”。修订记录弹窗显示真实的 0 条空态。
- 静态入口的原有方案内容未被验收操作修改。

操作详情的中文字段与内部编号隐藏已完成代码修正和回归验证，最终可见文案截图由主任务继续验收；上述结果不代表已完成移动视口检查。

追加的轻入口已在 Vue 与静态页面检查，位于主操作右侧，不再显示整条色块和数量。静态页面原有草稿打开后显示 3 条；Vue 新浏览器存储显示 3 条，已有 1 条用户说明的存储显示 4 条，原说明和 2 条操作日志保留。开发服务热更新未及时提供新脚本，重启 Vite 后双入口显示正常；不能据此认定发生过错误的初始化标记。Vue 浏览器 warning/error 输出为空。最终截图位于 `outputs/01a16307-tracking/revision-button-light.png` 和 `outputs/01a16307-tracking/release-notes-populated.png`。

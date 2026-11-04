# 词条分条配置交付记录

日期：2026-11-04

## 行为

- 词条按行编辑，每条包含名称与类型，类型可选大、中、小。
- 类型控制词云显示字号；出现次数与岗位关联仍由现有岗位描述档案统计。
- 支持新增、删除和全部清空，最多 24 条；校验空名称、重复名称及 30 字符长度限制。
- 初始化恢复默认词条及按默认词频划分的大、中、小类型；点击确定后保存，取消不改变已保存配置。
- 初始化位于弹窗顶部，在新增词条左侧，与编辑数据共用顶部操作区样式；滚动列表时保持可见，底部仅保留取消、确定。
- 兼容原有纯名称列表，名称与类型刷新后保留。
- 静态 index.html 与 Vue ResultsIndustryModel.vue 均引用共用 industry-editor.js、industry-model.js 和 industry-model.css。

## 验证

- `node --test tests/results-industry-editing.test.mjs tests/results-word-cloud.test.mjs tests/results-industry-model.test.mjs`：17 / 17 通过。
- `node scripts/verify-results-term-controls.mjs`：静态与 Vue 双入口交互通过，覆盖保存、刷新持久化、初始化后取消、初始化后保存、重复名称、删除后序号关联、删空、新增上限及键盘焦点循环。
- 浏览器尺寸：1600×1000、1280×720、768×900、390×844。双入口查看与编辑模式、模块切换、滚轮上下操作后整页不移动；编辑弹窗内部可滚动，初始化、新增词条、取消、确定保持可见。根元素的 overscroll-behavior 为 none。未使用实体触控板进行人工验证。
- 检查可见模块文案，没有演示身份措辞残留。
- `npm run build`：通过，仍有打包体积警告。
- JS 语法检查、`git diff --check`：通过。

完整浏览器数据见 browser-checks.json；同目录保存双入口四种尺寸截图。

## 全量测试限制

`npm test -- --test-timeout=60000` 记录 557 项，554 通过、2 失败、1 取消；不能视为全量通过。未完成的长时间运行被终止。

- `generated AI chain bundle preserves the complete reconciled dataset`：缺少 `/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据/人工智能产业链企查查/人工智能产业链.xlsx`。
- `generated AI chain bundle retains all source node families and province evidence`：同一外部文件缺失。
- `tests/results-portal.test.mjs`：未完成，报告 `Promise resolution is still pending but the event loop has already resolved`。

此次没有修改上述测试或其所依赖的产业数据生成脚本。

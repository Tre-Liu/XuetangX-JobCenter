# 产教模型统计项编辑修复

2026-11-04

- “初始化”按当前产业链档案恢复产业节点、已收录企业、关联岗位、相关行业四项统计；与页面默认统计共用计算逻辑。
- “添加”新增空白统计项，自动聚焦名称。最多四项，达到上限禁用，删除后重新启用。
- 全部删除并保存后仍保留编辑入口，重新打开可以初始化或添加。
- 点击“确定”保存；取消和关闭不写入。统计值依据已有档案，不代表实时招聘统计，保留资料核验说明。

## 验证结果

- `node scripts/verify-results-metric-controls.mjs`：静态文件与 Vue 两入口通过。覆盖删空保存与刷新、逐项增加、四项限制、删除中间项再添加、初始化与取消、不同产业链隔离。
- 两入口均验证 1600×1000、1280×720、768×900、390×844：弹窗操作可见，内容内部滚动，根页面不滚动。结果见 `browser-checks.json`，截图位于同目录。
- `node scripts/verify-results-industry-editing.mjs`：原有描述、统计项、岗位编辑、词条、取消、保存、刷新、模块切换及查看/编辑模式的浏览器回归通过（在词条编辑的并行修改进入工作区前运行）。
- `node --test tests/results-industry-editing.test.mjs tests/results-industry-model.test.mjs tests/results-editor-settings.test.mjs tests/results-word-cloud.test.mjs`：21/21 通过。
- `npm run build`：通过；保留已有非模块脚本与大包警告。
- `git diff --check`：通过。

## 全量测试边界

`npm test`：555 项中 552 项通过，3 项未通过：

1. `generated AI chain bundle preserves the complete reconciled dataset`
2. `generated AI chain bundle retains all source node families and province evidence`

以上两项依赖的 `/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据/人工智能产业链企查查/人工智能产业链.xlsx` 缺失，报 ENOENT。

3. `tests/results-portal.test.mjs`：运行约 145 秒未返回后主动终止该测试子进程；该文件未完成，不能视作通过。

完整本次全量测试日志：`/private/tmp/results-metric-tests-20261104.log`。

# Task 1 — 三段式导航结构与语义契约

## 实现摘要

- 将人才方案导航在 Vue 与 `file://` 静态入口中同步调整为始终展开的三个分组：方案建设、方案调研、方案比对。
- 为两个子系统条目补充 `groupLabel` 与 `iconClass`，保留既有 `icon` 字段。
- 保留 Vue 的 `selectTalentSection` / `openTalentSubsystem` 状态与静态入口的 `data-talent-section` / `data-talent-subsystem` 事件委托契约；新增选中项的 `aria-current="page"`。
- 用结构契约测试替换旧的平铺入口与单行文本样式断言。

## 变更文件

- `major-construction-platform/tests/results-portal.test.mjs`
- `major-construction-platform/src/app/app-config.ts`
- `major-construction-platform/src/App.vue`
- `major-construction-platform/index.html`
- `.superpowers/sdd/task-1-report.md`

## RED

命令：

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar mirrors" tests/results-portal.test.mjs
```

结果：预期失败，`pass 0`、`fail 1`。首个失败断言为：

```text
The input did not match the regular expression /talent-module-menu talent-figma-menu/
```

## GREEN

命令：

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar mirrors" tests/results-portal.test.mjs
```

结果：通过，`pass 1`、`fail 0`。

## 完整套件

命令：

```bash
cd major-construction-platform
npm test
```

结果：`346` 个测试中 `344` 通过、`2` 失败。失败均来自既有的 `tests/ai-industry-chain-data.test.mjs`，其生成器导入 `xlsx` 时因隔离工作树未安装该依赖而报 `ERR_MODULE_NOT_FOUND`；人才侧边栏结构测试通过。

## 提交

`feat: align talent sidebar navigation structure`

## 自审

- Vue 与静态入口均含 `.talent-module-menu`、`.talent-menu-group`、`.talent-menu-heading`、`.talent-sub-menu` 和 `.talent-menu-button`。
- 方案建设继续使用五个既有 `sideItems`；两个子系统继续由原有状态与点击行为驱动。
- 静态入口仍输出既有数据属性，未改动画布、助手按钮或事件委托。
- 未修改 Task 2 的 CSS，亦未涉及 Task 3 QA。
- `git diff --check` 无空白错误。

## 关注项

- 完整套件目前被工作树缺少 `xlsx` 依赖阻塞；该问题未由本任务造成，也未在此任务范围内安装或修改依赖。
- 新结构的视觉样式由后续 Task 2 负责，因此本提交只建立语义和交互契约。

## 依赖安装后的完整套件复跑

命令：

```bash
cd /Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.worktrees/talent-sidebar-alignment/major-construction-platform
npm test
```

结果：

```text
tests 346
suites 0
pass 346
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 28420.098625
```

此前两个 `xlsx` 模块缺失失败在依赖可用后均已通过。

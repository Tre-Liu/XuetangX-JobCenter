# 专业建设数据治理驾驶舱

## 首次运行

1. `npm install`
2. `npm run refresh`
3. `npm run dev`

以上命令均在 `data-governance-dashboard` 目录执行。默认数据工作区为本工程父目录；从仓库的 linked worktree 运行时，脚本会自动回到对应主工作区读取源数据，避免把 worktree 目录误当成数据根目录。

## 数据刷新

默认数据工作区为本工程父目录。其他位置使用：

`npm run refresh -- --workspace-root /absolute/path/to/workspace`

刷新脚本仅在全部源校验通过后替换快照。

## 验证与构建

- `npm test`
- `npm run refresh:check`
- `npm run build`
- `npm run verify`

`npm run verify` 会依次执行测试、真实数据基线检查、TypeScript 检查和 Vite 构建。

## 当前数据边界

招聘处理清单当前覆盖 2014—2016；2017—2025 不计入当前成果。
57 个标准阶段环节与 1,133 个精细产业节点属于不同粒度，不相加。

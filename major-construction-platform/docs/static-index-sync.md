# Static Index Sync Rule

本项目存在两个可见入口：

- `src/App.vue`：Vite/Vue 源码入口。
- `index.html`：浏览器以 `file://.../major-construction-platform/index.html` 打开时使用的静态演示入口。

当用户截图或地址栏显示正在访问 `index.html`，涉及页面文案、弹窗、列表、按钮、交互或样式的改动，必须同步检查并更新静态入口。

交付前至少做三件事：

1. 在相关测试中同时断言 `src/App.vue` 和 `index.html`，避免只改源码入口。
2. 运行对应定向测试，例如 `npm test -- tests/portrait-dialog.test.mjs`。
3. 若改动可能影响 Vue 编译，继续运行 `npm run build`。

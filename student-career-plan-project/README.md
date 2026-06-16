# 学涯规划助手 Vue 工程

这是从根目录 `student-career-plan.html` 拆出的独立 Vue/Vite 项目工程，后续可以单独修改、测试、构建和运行。

## 目录结构

```text
student-career-plan-project/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    App.vue
    main.ts
    data/student-career-plan-data.ts
    styles/base.css
    styles/student-career-plan.css
  tests/
    project-structure.test.mjs
```

## 启动

可以直接双击根目录的 `index.html` 预览。它会自动打开当前已构建的 `dist/index.html`。

开发时推荐使用 Vite 服务，能获得热更新：

```bash
cd /Users/liuhongzhe/Documents/专业建设/student-career-plan-project
npm install
npm run dev
```

默认地址：

```text
http://localhost:5174/
```

## 常用命令

```bash
npm test
npm run build
```

如果修改过源码并希望双击 `index.html` 看到最新效果，先运行 `npm run build` 刷新 `dist/`。

## 后续修改位置

- 页面结构和交互：`src/App.vue`
- 培养目标、毕业要求、课程、岗位和快捷指令数据：`src/data/student-career-plan-data.ts`
- 页面样式：`src/styles/student-career-plan.css`

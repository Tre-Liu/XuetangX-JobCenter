# 学涯规划助手本地项目

## 项目入口

源码项目位于：

```bash
/Users/liuhongzhe/Documents/专业建设/major-construction-platform
```

学生端 Vue 页面入口：

```bash
http://localhost:5173/index.html?view=student-career-plan
```

## 启动方式

方式一：双击根目录的 `student-career-plan.command`。

方式二：在终端运行：

```bash
cd /Users/liuhongzhe/Documents/专业建设/major-construction-platform
npm run dev:student
```

## 后续主要修改位置

- 页面结构与交互：`src/App.vue`
- 学生端培养方案数据：`src/app/student-career-plan-data.ts`
- 学生端样式：`src/styles/25-student-career-plan.css`
- 旧链接兼容入口：`student-career-plan/index.html`

根目录的 `student-career-plan.html` 是原始静态稿，可作为迁移参考，不再作为主维护入口。

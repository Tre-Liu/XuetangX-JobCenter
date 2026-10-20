# 人培公共PDF阅读器界面

本次为阅读器界面示意，Vue 与静态入口共用 `src/pdf-preview/element.js`。
深色工具栏、页面缩略图、灰色画布和纸张保留现有方案信息与占位正文，不代表已读取学校PDF原文件。页数沿用原记录，未做原文核验。
缩放、适合页面和缩略图显隐可操作；翻页、打印、下载未关联原文件，按钮禁用。

## 验证

- `npm run build` 通过。
- Vue / 静态入口浏览器检查：打开方案、缩放、适合页面、缩略图显隐、返回搜索结果通过，无 pageerror，无禁用文案残留。
- 人培调研定向回归 3/3 通过；原预览外壳断言已更新为共用组件入口。
- 全量测试首次运行 635 项，625 项通过，10 项失败。其中旧预览外壳断言在更新后已通过定向复测；另有 9 项其他失败，本次未调整相关代码：
  - generated AI chain bundle preserves the complete reconciled dataset
  - generated AI chain bundle retains all source node families and province evidence
  - static portrait dialog consumes the shared calculated data instead of legacy major tags
  - static job analysis tabs keep rich sections and clickable portrait cards
  - static job analysis deep links render the selected uninitialized tab without runtime errors
  - job portrait level filter narrows the list results
  - job portrait search matches visible job content instead of hidden associations
  - portrait company cards use a coordinated summary layout
  - talent goal text cells keep balanced inner spacing

产业链两项测试报告缺少外部源文件：`人工智能产业链.xlsx`。本次未对其他失败进行修复或声称全量通过。

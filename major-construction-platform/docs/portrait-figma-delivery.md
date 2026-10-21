# 岗位详情与岗位能力图谱交付说明

日期：2026-10-21。

## 设计依据

用户指定 Figma：L3DHrr4pSM3lv6AmHyjSzr，原入口2062:80752。Figma连接器要求编辑权限，未申请权限；通过用户已登录Chrome的只读属性面板读取。详情原型2295:4565，内卡6005:48894宽916px、高1060px；图谱简约6068:32935、展开6074:41180，内框1408×1148。尺寸按实际视口约束，保留滚动。

## 实现

- Vue与静态index同步；岗位详情四项指标、两条能力预览、编号任务、专业匹配表格、地域地图与右侧TOP10。
- 图谱从详情的“查看岗位能力图谱”按钮打开第二层弹窗；关闭保留原详情和滚动，焦点回到入口；Escape、Tab循环与背景inert已处理。
- 三列图谱、简约与展开、实际关联高亮、能力搜索、浅深色与完整PNG导出。两入口复用buildGraph/renderGraph、专业匹配和分布渲染器。
- 叶节点数量和连线以现有任务关系计算，保留未分类/无关联/空数据边界，未按照设计图虚构固定能力项数。

## 数据档案

本次仅调整展示与交互，不更新岗位事实或招聘数据。岗位任务能力仍来自既有岗位画像与其映射配置；专业匹配保留已有候选评分和方法说明。src/utils/portrait-job-distribution.js中的分布来自现有城市计数配置（getDemo），不是本次核验的招聘统计。详情的固定“BOSS直聘/智联招聘、2176条”声明缺少逐岗位支持，已改为“数据依据：岗位画像测算”，地图无障碍说明同样保留测算边界。数据的生成/测算依据以此档案和源码注释保留。

## 验证

- 51项岗位详情、任务关系、专业匹配、地域分布、图谱state/static/export专项全部通过。
- 静态入口新测试实际执行点击分发与共享renderer，验证所选岗位、第二层dialog、父详情inert、重复打开防重和没有window.open。
- Vue浏览器实测1440×1000、1280×720；320px和390px真实iframe容器检查关闭控制、搜索/列标题间距、底部开关及详情筛选布局。
- 浏览器验证任务选择21项关联高亮、BIM搜索5项并定位共享能力、深色/展开、重复打开、Tab循环、Escape返回详情；PNG已导出并目视检查，控制台无error/warn。
- 静态file://浏览器打开被URL策略禁止，未绕过。静态入口依据运行时/DOM边界测试及共享renderer核对，未声称具备file专属像素验证。
- 构建和git diff --check通过；全量654项，646通过、8失败；8项均为修改前已存在的问题，HEAD文件对照确认见下。

## 全量测试原有失败

1. generated AI chain bundle preserves the complete reconciled dataset：外部人工智能产业链.xlsx缺失。
2. generated AI chain bundle retains all source node families and province evidence：同上。
3. static job analysis tabs keep rich sections and clickable portrait cards：旧portraitBody模板断言。
4. static job analysis deep links render the selected uninitialized tab without runtime errors：VM fixture未提供IndustryDomain。
5. job portrait level filter narrows the list results：旧内联筛选断言，当前已由IndustryDomain.filterJobs处理。
6. job portrait search matches visible job content instead of hidden associations：旧内联搜索断言。
7. portrait company cards use a coordinated summary layout：旧portrait-company-body结构断言。
8. talent goal text cells keep balanced inner spacing：旧间距断言与HEAD样式不一致。

## 截图

- outputs/qa/portrait-figma/portrait-detail.png
- outputs/qa/portrait-figma/competency-dialog.png
- outputs/qa/portrait-figma/portrait-distribution.png

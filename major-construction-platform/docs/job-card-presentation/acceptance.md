# 岗位卡片展示与未归属岗位验收

日期：2026-10-14。

移除岗位画像列表卡片的初级、中级、高级标签，保留岗位等级筛选和详情中的等级字段。Vue 与静态入口同步修改。岗位群标签仅在有归属时显示，未归属岗位保留产业环节与技能信息。

## 数据档案

以下4个现有生成岗位的默认归属设为空，未新增真实招聘记录，未核验实际企业需求或薪资。沿用原有岗位画像的产业环节、能力、任务、薪资与需求测算数据。此归属配置用于产品空归属状态呈现，不代表已经验证的行业分类结论。

| 岗位ID | 岗位名称 |
| --- | --- |
| job-parametric-design | 参数化建筑设计技术员 |
| job-quality-data | 工程质量数据工程师 |
| job-energy-carbon | 建筑能耗与碳管理专员 |
| job-construction-platform-implementation | 智慧建造平台实施顾问 |

默认24个岗位保持不变，20个有岗位群，4个未归属。用户已有手工归属记录继续优先生效，未清除本地配置。修正空归属情况下的职业路径和能力定义；静态任务模板通过相同产业节点的岗位确定技术领域，避免归属为空后改变原任务内容。

## 验证

- 构建通过。
- 岗位群、领域模型、岗位详情、任务能力关系专项测试25项通过。
- 直接执行静态卡片渲染函数，并用Vue SSR执行源码中的卡片模板，两个入口均生成24张卡片且等级标签数为0。未归属岗位不包含岗位群标签，产业环节保留。领域模型确认全部岗位24个、群内岗位合计20个。
- 浏览器检查独立渲染预览，两个入口无控制台错误、未出现禁止的身份说明文案；截图见 static-cards.png。该预览未执行详情点击或真实初始化提交，不能作为完整应用交互验收。
- 本地初始化表单的最终提交被自动审批拦截，原因是会改变持久化应用状态。随后使用不写应用状态的独立渲染预览。

全量测试587项，579通过、8失败。未更改无关代码来消除这些失败：

1. generated AI chain bundle preserves the complete reconciled dataset：源人工智能产业链.xlsx不存在。
2. generated AI chain bundle retains all source node families and province evidence：同一源文件不存在。
3. BIM demo sources are opt-in, clearly marked, and do not replace historical sources：未改动的来源配置不满足旧isDemo字段断言。
4. static job analysis tabs keep rich sections and clickable portrait cards：断言查找的旧静态代码标记不存在。
5. static job analysis deep links render the selected uninitialized tab without runtime errors：测试上下文缺少IndustryDomain。
6. job portrait level filter narrows the list results：断言仍要求旧内联筛选实现。
7. job portrait search matches visible job content instead of hidden associations：断言仍要求旧内联搜索实现。
8. portrait company cards use a coordinated summary layout：断言仍要求旧企业卡片结构。

后5项在隔离副本中还原卡片标签改动后仍以相同原因失败；前3项涉及未改动的源文件和来源配置。

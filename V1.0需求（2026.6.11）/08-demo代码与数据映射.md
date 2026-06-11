# Demo 代码与数据映射

## 当前 demo 技术形态

当前 demo 是 Vue/Vite 项目，核心页面集中在 `src/App.vue`，数据主要集中在 `src/mock/*.ts` 和 `src/app/*.ts`。本次拆解只覆盖 V1.0 一期三模块相关部分。

## 文件职责映射

| 文件 | 当前职责 | 本期相关性 | 生产化建议 |
| --- | --- | --- | --- |
| `src/App.vue` | 页面状态、模板、交互集中承载 | 高 | 拆成 CMS 初始化页、岗位画像页、招聘趋势页和详情弹窗组件 |
| `src/mock/job-research.ts` | 岗位画像、岗位详情、证书企业、招聘趋势 mock | 高 | 转为接口数据结构和前端类型定义 |
| `src/app/industry-research-management.ts` | CMS 推荐产业链 mock | 高 | 转为 CMS 初始化接口返回结构 |
| `src/mock/job-center.ts` | 岗位库、任务、能力项、课程关联基础数据 | 中 | 后续岗位建设中心复用 |
| `src/app/talent-industry-data.ts` | 产业调研 Tab、产业链、区域、政策、企业等数据 | 中 | 本期只读取默认产业链上下文 |
| `src/styles/30-job-research.css` | 岗位分析相关样式 | 高 | 可保留并拆分到页面样式 |
| `src/styles/60-portrait.css` | 岗位画像详情和能力图谱相关样式 | 中 | 本期复用详情弹窗部分 |
| `src/styles/95-cms-admin.css` | CMS 后台页面样式 | 高 | 本期复用 CMS 初始化页样式 |

## 关键状态变量

| 状态 | 当前位置 | 用途 | 生产化去向 |
| --- | --- | --- | --- |
| `isIndustryResearchAdminView` | `src/App.vue` | 判断是否显示 CMS 初始化页 | 路由配置 |
| `currentJobResearchMode` | `src/App.vue` | 区分产业调研与岗位分析模式 | 岗位中心页面状态 |
| `currentJobResearchTab` | `src/App.vue` | 岗位画像、招聘需求、新技术预判 Tab | 岗位分析子路由或 Tab 状态 |
| `currentJobIndustryTab` | `src/App.vue` | 产业链、区域、政策、企业 Tab | 非本期主范围 |
| `industryResearchStatus` | `src/App.vue` | CMS 初始化状态 | 后端初始化批次状态 |
| `selectedIndustryResearchChainIds` | `src/App.vue` | CMS 已选产业链 | 专业默认产业链配置 |
| `portraitSearchInput` | `src/App.vue` | 岗位画像搜索输入 | 查询条件 |
| `portraitLevelFilter` | `src/App.vue` | 岗位等级筛选 | 查询条件 |

## 数据对象映射

### CMS 数据初始化

| Demo 对象 | 当前文件 | 生产对象 |
| --- | --- | --- |
| `IndustryResearchChainRecommendation` | `src/app/industry-research-management.ts` | `ChainRecommendation` |
| `INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS` | `src/app/industry-research-management.ts` | 初始化推荐结果列表 |
| `industryResearchStatus` | `src/App.vue` | 初始化批次状态 |
| `selectedIndustryResearchChainIds` | `src/App.vue` | 专业默认产业链 |

### 岗位画像分析

| Demo 对象 | 当前文件 | 生产对象 |
| --- | --- | --- |
| `PORTRAIT_INSIGHTS` | `src/mock/job-research.ts` | 岗位画像洞察 |
| `PORTRAIT_JOB_PROFILES` | `src/mock/job-research.ts` | 岗位画像列表 |
| `PORTRAIT_JOB_DETAILS` | `src/mock/job-research.ts` | 岗位画像详情 |
| `PortraitJobDetail` | `src/mock/job-research.ts` | 岗位画像详情 DTO |
| `PortraitAbilityGroup` | `src/mock/job-research.ts` | 岗位能力分组 |
| `PortraitCertificateSummary` | `src/mock/job-research.ts` | 岗位证书摘要 |
| `PortraitCompanySummary` | `src/mock/job-research.ts` | 企业样本摘要 |

### 招聘需求趋势

| Demo 对象 | 当前文件 | 生产对象 |
| --- | --- | --- |
| `DEMAND_KPIS` | `src/mock/job-research.ts` | 招聘趋势 KPI |
| `DEMAND_TREND` | `src/mock/job-research.ts` | 月度招聘趋势 |
| `DEMAND_SKILL_BARS` | `src/mock/job-research.ts` | 技能需求热度 |
| `DEMAND_JOB_ROWS` | `src/mock/job-research.ts` | 热门岗位招聘明细 |

## 交互函数映射

| 交互 | 当前函数/逻辑 | 生产化建议 |
| --- | --- | --- |
| 打开 CMS 初始化页 | `industryResearchCmsInitializationUrl` | 后台路由 |
| 发起初始化 | `startIndustryResearchInitialization` | 调用 POST 初始化接口并轮询状态 |
| 选择产业链 | CMS 推荐列表按钮逻辑 | 调用 PUT 默认产业链接口 |
| 切换岗位分析 Tab | `selectJobResearchTab` | 前端 Tab 状态或子路由 |
| 搜索岗位画像 | `searchPortraitJobs` | 调用列表接口或前端过滤 |
| 岗位等级筛选 | `applyPortraitLevelFilter` | 调用列表接口或前端过滤 |
| 打开岗位详情 | `openPortraitJobDialog` | 调用详情接口后打开弹窗 |
| 关闭岗位详情 | `closePortraitJobDialog` | 前端状态 |

## 建议组件拆分

```text
src/
  pages/
    cms/
      IndustryInitializationPage.vue
    job-research/
      JobResearchPage.vue
      JobPortraitPanel.vue
      JobDemandTrendPanel.vue
  components/
    job-research/
      JobPortraitCard.vue
      JobPortraitDialog.vue
      JobResearchBrief.vue
      DemandKpiGrid.vue
      DemandTrendChart.vue
      SkillHeatList.vue
      DemandJobTable.vue
    cms/
      ChainRecommendationList.vue
      InitializationStatusPanel.vue
  services/
    industryInitializationApi.ts
    jobProfileApi.ts
    recruitmentTrendApi.ts
  types/
    industryInitialization.ts
    jobProfile.ts
    recruitmentTrend.ts
```

## 生产化改造优先级

P0：

- CMS 初始化状态接口化。
- 默认产业链保存与读取。
- 岗位画像列表和详情接口化。
- 招聘趋势 KPI、月度趋势、技能热度、岗位明细接口化。

P1：

- 岗位画像列表与招聘明细互相跳转。
- 初始化批次历史。
- 证书和企业详情弹窗。

P2：

- 新岗位新技术预判。
- 自主添加产业链。
- 复杂权限和审计日志。

## 注意事项

- 当前 `src/App.vue` 承载内容较多，生产化时不要继续把所有新逻辑堆在一个文件里。
- 岗位能力项名称要保持稳定，否则后续岗位能力图谱、课程映射和技能热度会断开。
- 招聘趋势必须保留统计周期和样本口径，否则数据可信度不足。
- CMS 重新初始化需要批次概念，避免覆盖历史数据后无法追溯。

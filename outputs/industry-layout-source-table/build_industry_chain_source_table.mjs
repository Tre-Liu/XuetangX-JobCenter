import fs from 'node:fs/promises'
import path from 'node:path'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = '/Users/liuhongzhe/Documents/专业建设/outputs/industry-layout-source-table'
const outputPath = `${outputDir}/产业布局-产业链图谱数据源梳理.xlsx`
const projectRoot = '/Users/liuhongzhe/Documents/专业建设/major-construction-platform'
const screenshotRoot = `${projectRoot}/outputs/prd/current-demo-screenshots`
const localScreenshotRoot = `${outputDir}/screenshots`
const fieldShotRoot = `${outputDir}/field-shots`

const headers = ['模块', '一级功能', '二级功能', '字段描述', '截图', '数据来源', '是否AI输出', '建议提示词']

const source = {
  app: 'major-construction-platform/src/App.vue',
  industryData: 'major-construction-platform/src/app/talent-industry-data.ts',
  jobData: 'major-construction-platform/src/mock/job-research.ts',
  report: 'major-construction-platform/src/mock/research-report.ts',
  design: 'major-construction-platform/docs/superpowers/specs/2026-06-22-industry-chain-national-industry-metrics-design.md',
  gbt: 'V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx',
  chainNodes: 'V1.0需求（2026.6.11）/官方数据/10个产业链节点汇总.xlsx',
  companyList: 'V1.0需求（2026.6.11）/官方数据/中国A股上市公司清单xlsx.xlsx'
}

const noPrompt = '/'
const prompt = {
  brief: '请基于【页面名称】【产业链名称】【页面目标】【关键数据表】生成页面顶部研判摘要。要求说明该页面用于什么业务判断、覆盖哪些数据域、如何服务专业建设；语言采用专业建设评审材料口径，不写营销文案，不虚构统计来源。',
  metricDetail: '请基于【指标名称】【指标值】【统计口径】【关键指标】【关联行业】【专业建设场景】生成指标详情弹窗文案。输出指标说明、统计口径、关键指标解释、关联行业说明、专业建设提示；必须明确样本口径和使用边界。',
  signal: '请基于【行业名称】【招聘热度】【政策热度】【企业活跃度】【产业节点/岗位方向】生成行业增长信号解释。要求稳健表达增长原因和专业建设启示，不使用未经验证的实时排名或绝对化判断。',
  insight: '请基于【上中下游环节】【企业样本】【岗位需求】【课程/实训建设目标】生成产业链洞察或建设建议。要求把产业结构转化为课程、岗位画像、实训项目和校企合作动作。',
  region: '请基于【区域名称】【产业方向】【企业/工程场景】【可合作资源】生成区域合作方向描述。要求说明该区域适合对接哪些校企合作、课程项目或实训基地任务。',
  policy: '请基于【政策标题】【发布机构】【发布时间】【政策原文摘要】【产业链关联方向】生成政策影响分析和专业建设任务。要求提炼为课程、实训、校企合作或建设路线动作，并保留政策来源边界。',
  company: '请基于【企业名称】【所属产业】【产品/技术/服务节点】【代表岗位】【合作场景】生成企业资源研判摘要。要求判断企业能为岗位画像、课程案例、实训项目提供什么支撑。',
  portrait: '请基于【岗位名称】【薪资区间】【需求量】【产业链节点】【能力项】【典型任务】【证书/企业】生成岗位画像详情文案。要求输出岗位概述、三维能力、典型任务、证书建议和对接企业，不夸大招聘数据。',
  demand: '请基于【岗位需求KPI】【月度趋势】【技能热度】【热门岗位明细】生成招聘需求趋势判断。要求说明优先建设的岗位方向、技能高频项、城市与薪资参考，以及课程建设启示。',
  forecast: '请基于【新技术方向】【成熟度/阶段】【产业影响】【新增岗位】【相关专业】【推荐能力】生成新岗位新技术研判。要求输出技术趋势、人才缺口、课程实训建议和专业协同方向。'
}

const rows = [
  ['产业布局', '左侧导航', '产业布局分组与页面切换', '页面左侧“产业布局”分组包含产业链图谱、区域产业分析、产业政策库、产业企业库。点击任一按钮会调用 selectJobIndustryTab(tab.key)，切换 currentJobResearchMode=industry 和 currentJobIndustryTab，并刷新主内容区的 activeResearchBrief、页面标题、页面目的和下方区块。', '系统页面：01-industry-chain.png；左侧导航区域', `${source.app} -> industryLayoutTabs, selectJobIndustryTab, activeIndustryResearchTitle, activeJobResearchPurpose；${source.industryData} -> INDUSTRY_RESEARCH_TABS`, '否', noPrompt],
  ['产业布局', '产业链图谱', '页面顶部研判摘要', '字段包括页面标题、当前产业链选择器、研判标题、摘要条目。摘要用于说明产业链上游基础能力、中游工程数字化服务与实施转化、下游施工交付与监管运维应用，以及专业认知、岗位画像和课程矩阵组织建议。', '系统页面：01-industry-chain.png；顶部“产业链结构分析”摘要区', `${source.app} -> industryResearchBriefs.chain, activeResearchBrief, selectedIndustryChain；${source.report} -> 报告数据来源说明`, '是', prompt.brief],
  ['产业布局', '产业链图谱', '产业链结构图谱-视图切换', '字段包括视图模式 industryChainViewMode、矩形树图按钮、桑基图按钮、图谱说明文案。点击“矩形树图”展示 stage/node 卡片；点击“桑基图”展示节点、流向、权重与 hover 详情。', '系统页面：01-industry-chain.png；“矩形树图/桑基图”切换按钮', `${source.app} -> industryChainViewMode, industry-chain-view-switch；${source.industryData} -> industrySankeyStages, industrySankeyNodes, industrySankeyLinks`, '否', noPrompt],
  ['产业布局', '产业链图谱', '国标行业KPI卡片', '字段包括 KPI 名称、指标值、说明、查看详情入口。当前展示关联国标行业、覆盖门类、核心关联行业、增长行业。点击任一卡片打开国标行业指标详情弹窗。', '系统页面：01-industry-chain.png；国标行业 KPI 卡片区', `${source.app} -> openNationalIndustryMetricDialog(metric.label)；${source.jobData} -> NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics；${source.gbt}`, '否', noPrompt],
  ['产业布局', '产业链图谱', '国标行业KPI详情弹窗', '弹窗字段包括弹窗标题、GB/T 4754 分类提示、指标说明、指标值、详情摘要、统计口径、关键指标、关联行业、专业建设提示、关闭按钮。该详情页解释 KPI 的计算边界和专业建设使用方式。', '系统页面：fig2-national-industry-metric-dialog.png；国标行业指标详情弹窗', `${source.app} -> selectedNationalIndustryMetric, closeNationalIndustryMetricDialog；${source.jobData} -> NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics.detail；${source.design}`, '部分', prompt.metricDetail],
  ['产业布局', '产业链图谱', '矩形树图-阶段分布', '字段包括阶段 key、阶段名称、阶段说明、阶段统计、覆盖国标行业。阶段为上游/中游/下游，上游示例为设计、勘察、材料与装备供给，6类上游产业 / 644家代表企业。', '系统页面：01-industry-chain.png；上中下游矩形树图区', `${source.app} -> industryTreemapStagesForView, formatIndustryStageNationalIndustries；${source.industryData} -> industrySankeyStages；${source.jobData} -> NATIONAL_INDUSTRY_CHAIN_METRICS.stageDistributions`, '否', noPrompt],
  ['产业布局', '产业链图谱', '矩形树图-产业节点', '字段包括节点 id、所属阶段、节点名称、代表企业数、产品/技术/服务标签、卡片样式权重。节点示例包括建筑设计产业、工程勘察测绘产业、工程软件与数据服务产业、BIM咨询与工程数字化服务产业、智能施工产业等。', '系统页面：01-industry-chain.png；产业节点卡片', `${source.app} -> industryTreemapNodeStyle；${source.industryData} -> industrySankeyNodes；${source.chainNodes}`, '否', noPrompt],
  ['产业布局', '产业链图谱', '桑基图-流向与hover详情', '字段包括节点列、节点名称、节点企业数、技术标签、连线 source/target/value、渐变色、连线宽度、hover 激活状态、hover 详情标题/指标/说明。鼠标悬停节点或连线会高亮相关节点并展示详情卡。', '系统页面：01-industry-chain.png；切换到桑基图后的主图区域', `${source.app} -> industrySankeyHoverId, industrySankeyHoverDetail, isIndustrySankeyLinkActive, isIndustrySankeyNodeActive；${source.industryData} -> industrySankeyPaths`, '否', noPrompt],
  ['产业布局', '产业链图谱', '国标行业关联分析-代表企业行业覆盖', '字段包括行业门类、细分行业、覆盖占比、代表企业数量、样本企业、占比进度条。当前样例包含 E 建筑业、I 信息传输/软件和信息技术服务业、C 制造业、M 科学研究和技术服务业。', '系统页面：01-industry-chain.png；代表企业行业覆盖列表', `${source.app} -> industry-national-coverage-row；${source.jobData} -> NATIONAL_INDUSTRY_CHAIN_METRICS.enterpriseCoverage；${source.companyList}`, '否', noPrompt],
  ['产业布局', '产业链图谱', '国标行业关联分析-行业增长信号', '字段包括行业名称、招聘热度、政策热度、企业活跃度、解释说明。用于把国标行业与岗位、政策、企业活跃度信号关联起来。', '系统页面：01-industry-chain.png；行业增长信号列表', `${source.app} -> industry-national-growth；${source.jobData} -> NATIONAL_INDUSTRY_CHAIN_METRICS.growthSignals`, '部分', prompt.signal],
  ['产业布局', '产业链图谱', '产业链洞察卡片', '字段包括卡片标题和正文。当前包括价值流判断、建设切入点、企业反馈，用于把上中下游关系转化为课程项目、真实工程任务和企业能力诉求。', '系统页面：01-industry-chain.png；产业链洞察三张卡片', `${source.app} -> industry-chain-info-grid；${source.industryData} -> industryChainInsights`, '是', prompt.insight],
  ['产业布局', '产业链图谱', '代表企业列表', '字段按上游企业、中游企业、下游企业分组，展示企业名称和对接能力说明，如 BIM 标准、工程数据、智能建造实施、装配式建筑、结构设计软件、智慧工地等。', '系统页面：01-industry-chain.png；代表企业区块', `${source.app} -> 代表企业静态列表；${source.jobData} -> COMPANY_DETAILS；${source.chainNodes}`, '部分', prompt.company],
  ['产业布局', '产业链图谱', '核心岗位列表', '字段按上游岗位、中游岗位、下游岗位分组，展示智能测量工程师、BIM深化设计工程师、智慧建造平台实施顾问、智能建造施工技术员、结构健康监测工程师等岗位入口。', '系统页面：01-industry-chain.png；核心岗位区块', `${source.app} -> 核心岗位静态列表；${source.jobData} -> SMART_CONSTRUCTION_JOBS, RESEARCH_JOB_CANDIDATES`, '否', noPrompt],
  ['产业布局', '产业链图谱', '产业链建设建议', '字段包括建议序号、建议标题、建议描述。当前建议为以 BIM 协同与智慧工地作为专业主线、补齐装配式与智能施工装备能力、面向检测监测与绿色运维做交付。', '系统页面：01-industry-chain.png；产业链建设建议区块', `${source.app} -> industry-suggestion-row；${source.industryData} -> industryChainSuggestions`, '是', prompt.insight],
  ['产业布局', '区域产业分析', '页面顶部研判摘要', '字段包括页面标题、页面目的和区域产业布局研判摘要。摘要强调企业与工程场景在重点区域形成集聚，辽宁样本适合围绕智慧工地、装配式建筑、检测监测和城市更新建立区域岗位需求清单。', '系统页面：02-industry-region.png；顶部摘要区', `${source.app} -> industryResearchBriefs.region, industryResearchPurposeByTab.region`, '是', prompt.brief],
  ['产业布局', '区域产业分析', '区域KPI卡片', '字段包括覆盖省份、企业样本、重点城市、合作线索及说明。当前展示 31 个省份、12680 家智能建造相关企业、18 个产业集聚城市、52 条企业项目/实训基地合作线索。', '系统页面：02-industry-region.png；区域 KPI 卡片', `${source.app} -> currentJobIndustryTab === "region" KPI 静态区块`, '否', noPrompt],
  ['产业布局', '区域产业分析', '区域合作方向卡片', '字段包括区域名称、产业方向字段、合作/实训方向描述。当前包括辽宁沈阳-大连建筑产业带、京津冀建设科技产业带、长三角智能建造产业带、东北老工业基地更新场景。', '系统页面：02-industry-region.png；区域合作方向卡片', `${source.app} -> industry-region-grid；${source.industryData} -> industryRegionCards`, '部分', prompt.region],
  ['产业布局', '产业政策库', '页面顶部研判摘要', '字段包括政策趋势解读摘要、页面目的、当前产业链。摘要说明数字设计、智能生产、智能施工、智慧运维、BIM报建审查、智慧工地监管、建筑机器人和绿色低碳建造等政策信号。', '系统页面：03-industry-policy.png；顶部摘要区', `${source.app} -> industryResearchBriefs.policy, industryResearchPurposeByTab.policy`, '是', prompt.brief],
  ['产业布局', '产业政策库', '政策筛选工具栏', '字段包括政策级别下拉、关键词输入框、搜索按钮。当前模板呈现筛选 UI，但未绑定 v-model 或实际筛选函数；后续接接口时应落到 policyLevel、policyKeyword、searchPolicyItems 等状态字段。', '系统页面：03-industry-policy.png；政策级别/关键词/搜索工具栏', `${source.app} -> policy-toolbar select/input/button`, '否', noPrompt],
  ['产业布局', '产业政策库', '政策时间线列表', '字段包括 date、publishDate、title、level、tag、agency、source、url、desc、summary、impact、tasks，并在页面展示政策日期、标题、摘要/描述、政策级别、来源、发布时间、原始地址。点击政策查看影响分析目前为提示文案，列表项未绑定详情弹窗。', '系统页面：03-industry-policy.png；产业政策库时间线', `${source.app} -> industryPolicyItems v-for；${source.industryData} -> industryPolicyItems`, '部分', prompt.policy],
  ['产业布局', '产业政策库', '政策关键词云', '字段包括关键词 text、大小 size、色调 tone。用于展示高频政策方向，例如智能建造、智慧工地、绿色低碳、装配式、建筑机器人等。', '系统页面：03-industry-policy.png；政策关键词云', `${source.app} -> policy-word-cloud；${source.industryData} -> industryPolicyKeywords`, '否', noPrompt],
  ['产业布局', '产业政策库', '年度政策趋势', '字段包括年份 year 和柱状高度 height。用于展示不同年度政策关注度走势。', '系统页面：03-industry-policy.png；年度政策趋势柱状图', `${source.app} -> policy-bars；${source.industryData} -> industryPolicyTrends`, '否', noPrompt],
  ['产业布局', '产业企业库', '页面顶部研判摘要', '字段包括企业资源研判摘要、页面目的、当前产业链。摘要说明企业库应沉淀能提供真实工程项目、平台工具、设备应用、岗位任务样本的代表企业。', '系统页面：04-industry-company.png；顶部摘要区', `${source.app} -> industryResearchBriefs.company, industryResearchPurposeByTab.company`, '是', prompt.brief],
  ['产业布局', '产业企业库', '企业搜索交互', '字段包括搜索关键词 industryCompanySearchText、搜索范围、匹配企业数量。输入框会按企业名称、统一社会信用代码、注册地址、企业规模、具体产品/技术/服务节点、企业所属产业进行模糊过滤，并重算分页。', '系统页面：04-industry-company.png；企业搜索框', `${source.app} -> industryCompanySearchText, filteredIndustryCompanyItems, currentIndustryCompanyPage`, '否', noPrompt],
  ['产业布局', '产业企业库', '企业列表表格', '字段包括企业名称、统一社会信用代码、企业注册地址、企业规模、具体产品/技术/服务节点、企业所属产业。表格数据按 paginatedIndustryCompanyItems 渲染，来自过滤后的企业库数据。', '系统页面：04-industry-company.png；企业列表表格', `${source.app} -> paginatedIndustryCompanyItems；${source.industryData} 或页面导入数据 -> industryCompanyItems`, '否', noPrompt],
  ['产业布局', '产业企业库', '分页与空状态', '字段包括当前页、总页数、页码数组、上一页、下一页、空状态文案。交互包括 setIndustryCompanyPage(page)、上一页/下一页禁用状态、未找到匹配企业提示。', '系统页面：04-industry-company.png；底部分页与空状态', `${source.app} -> industryCompanyPageSize, industryCompanyPageCount, industryCompanyPageNumbers, setIndustryCompanyPage`, '否', noPrompt],
  ['岗位分析', '左侧导航', '岗位分析分组与页面切换', '页面左侧“岗位分析”分组包含岗位画像分析、招聘需求趋势、新岗位新技术。点击任一按钮会调用 selectJobResearchTab(tab.key)，切换 currentJobResearchMode=job 和 currentJobResearchTab，并刷新岗位分析主内容。', '系统页面：05-job-portrait.png；左侧导航岗位分析区域', `${source.app} -> JOB_RESEARCH_TABS, selectJobResearchTab, activeResearchTab, jobResearchPurposeByTab；${source.jobData} -> JOB_RESEARCH_TABS`, '否', noPrompt],
  ['岗位分析', '岗位画像分析', '页面顶部研判摘要', '字段包括岗位画像洞察摘要、页面目的、当前产业链。摘要说明 BIM深化设计、智慧工地管理、智能检测监测等岗位需求集中，并给出课程体系补强方向。', '系统页面：05-job-portrait.png；顶部摘要区', `${source.app} -> jobResearchBriefs.portrait, jobResearchPurposeByTab.portrait；${source.jobData} -> PORTRAIT_INSIGHTS`, '是', prompt.brief],
  ['岗位分析', '岗位画像分析', 'KPI与岗位搜索', '字段包括 PORTRAIT_KPIS 的 label/value/unit/tone，搜索关键词 portraitSearchInput，搜索按钮和回车搜索。搜索范围覆盖岗位名称、技能关键词、产业链环节。', '系统页面：05-job-portrait.png；KPI 与搜索框', `${source.app} -> PORTRAIT_KPIS, portraitSearchInput, searchPortraitJobs`, '否', noPrompt],
  ['岗位分析', '岗位画像分析', '岗位列表、等级筛选与分页', '字段包括岗位等级筛选 portraitLevelFilter、岗位等级选项、过滤后岗位数量、岗位卡片 id/name/level/salary/demand/chain/skills、当前页、页码、上一页、下一页。点击岗位卡片打开岗位画像详情弹窗。', '系统页面：05-job-portrait.png；岗位列表卡片与分页', `${source.app} -> portraitLevelOptions, applyPortraitLevelFilter, filteredPortraitJobs, paginatedPortraitJobs, setPortraitPage, openPortraitJobDialog；${source.jobData} -> RESEARCH_JOB_CANDIDATES, PORTRAIT_JOB_PROFILES`, '否', noPrompt],
  ['岗位分析', '岗位画像分析', '岗位画像详情弹窗', '弹窗字段包括岗位名称、数据来源说明、薪资、薪资单位、学历要求、经验要求、岗位层级、职业路径、岗位概述、标签、三维能力、典型工作任务、推荐证书、对接专业、相关企业、关闭按钮、岗位能力图谱按钮。', '系统页面：06-job-portrait-detail.png；岗位画像详情弹窗', `${source.app} -> selectedPortraitJobId, selectedPortraitJobDetail, closePortraitJobDialog, openPortraitCompetencyMap；${source.jobData} -> getPortraitJobDetail`, '部分', prompt.portrait],
  ['岗位分析', '岗位画像分析', '三维能力分析与雷达图', '字段包括能力组 key/label/items、能力数量、雷达图标签、雷达序列 label/values/color。该区块用于展示知识、技能、素养三维能力及能力强弱。', '系统页面：06-job-portrait-detail.png；三维能力分析与雷达图区', `${source.app} -> portraitRadarLabels, portraitRadarPoints, selectedPortraitJobDetail.abilityGroups, selectedPortraitJobDetail.radarSeries；${source.jobData} -> PortraitJobDetail.abilityGroups/radarSeries`, '部分', prompt.portrait],
  ['岗位分析', '岗位画像分析', '证书入口与详情数据缺口', '交互入口为岗位详情中的推荐职业资格证书。当前页面可展示证书名称与等级，但智能建造岗位生成的证书 id（cert-bim、cert-smart-site）未在 CERTIFICATE_DETAILS 中配置详情记录，因此点击后不会弹出证书详情。ADS 应记录为“入口已具备、详情数据待补齐”。', '字段截图：岗位详情内推荐职业资格证书入口', `${source.app} -> openCertificateDialog, selectedCertificateDetail, closeCertificateDialog；${source.jobData} -> getCertificateDetail, CERTIFICATE_DETAILS；当前缺口：cert-bim / cert-smart-site 无详情记录`, '部分', '请基于【证书名称】【等级】【颁发机构】【考试科目】【适用岗位】【岗位能力要求】生成证书详情数据。要求补齐证书详情结构，并说明证书与岗位能力、课程模块、实训评价之间的关系，不夸大证书效力。'],
  ['岗位分析', '岗位画像分析', '相关企业详情弹窗', '交互入口为岗位详情中的相关企业卡片。弹窗字段包括企业名称、企业全称、标签、企业摘要、所在地区、所属行业、企业规模、成立时间、年均招聘、产业链环节、核心产品、技术方向、主要招聘岗位、校企合作类型和合作详情。', '系统页面：06-job-portrait-detail.png；岗位详情内相关企业入口；企业弹窗为嵌套弹窗', `${source.app} -> openCompanyDialog, selectedCompanyDetail, closeCompanyDialog；${source.jobData} -> getCompanyDetail, COMPANY_DETAILS`, '部分', prompt.company],
  ['岗位分析', '岗位画像分析', '岗位能力图谱入口', '交互入口为岗位画像详情弹窗右上“岗位能力图谱”按钮。点击后打开能力图谱页面/弹窗，用当前岗位 id 构建任务节点、能力节点、连接线、激活任务和能力侧栏，支持任务切换联动高亮。', '系统页面：18-job-detail-ability-map.png；岗位能力图谱', `${source.app} -> openPortraitCompetencyMap, portraitCompetencyTasks, portraitCompetencyNodes, portraitCompetencyLinePaths, activePortraitCompetencyTaskIndex；${source.jobData} -> PORTRAIT_COMPETENCY_MAP_CONFIGS`, '部分', '请基于【岗位详情】【典型任务】【知识/技能/素养能力项】生成岗位能力图谱关系。要求输出任务-能力映射、能力分类和课程训练建议，关系要能追溯到岗位任务。'],
  ['岗位分析', '招聘需求趋势', '页面顶部研判摘要', '字段包括招聘需求趋势判断摘要、页面目的、当前产业链。摘要用于说明岗位招聘热度、岗位描述高频能力、薪资区间、城市分布和技能热度对岗位能力包建设的影响。', '系统页面：07-job-demand.png；顶部摘要区', `${source.app} -> jobResearchBriefs.demand, jobResearchPurposeByTab.demand`, '是', prompt.demand],
  ['岗位分析', '招聘需求趋势', '需求KPI卡片', '字段包括近12月岗位需求、高频招聘岗位、平均薪资、企业样本及趋势值。当前示例为 126480、48、10.6K、1860。', '系统页面：07-job-demand.png；需求 KPI 卡片', `${source.app} -> DEMAND_KPIS v-for；${source.jobData} -> DEMAND_KPIS`, '否', noPrompt],
  ['岗位分析', '招聘需求趋势', '岗位需求月度趋势', '字段包括月份 month、需求指数 value、柱形高度。页面左侧显示招聘总数轴，右侧按 1-12 月展示需求趋势。', '系统页面：07-job-demand.png；岗位需求月度趋势柱状图', `${source.app} -> DEMAND_TREND v-for；${source.jobData} -> DEMAND_TREND`, '否', noPrompt],
  ['岗位分析', '招聘需求趋势', '技能需求热度', '字段包括技能名称、热度百分比、进度条宽度。当前包含 BIM建模与深化设计、智慧工地平台应用、智能测量与三维扫描、智能检测监测数据分析、装配式构件深化与生产、建筑机器人与设备联调。', '系统页面：07-job-demand.png；技能需求热度条形列表', `${source.app} -> DEMAND_SKILL_BARS v-for；${source.jobData} -> DEMAND_SKILL_BARS`, '否', noPrompt],
  ['岗位分析', '招聘需求趋势', '热门岗位招聘明细表', '字段包括岗位名称、招聘需求、薪资区间、增长趋势、重点城市。用于按需求增长排序展示重点岗位，如 BIM深化设计工程师、智慧工地管理工程师等。', '系统页面：07-job-demand.png；热门岗位招聘明细表', `${source.app} -> DEMAND_JOB_ROWS v-for；${source.jobData} -> DEMAND_JOB_ROWS`, '否', noPrompt],
  ['岗位分析', '新岗位新技术', '页面顶部研判摘要', '字段包括新岗位新技术摘要、页面目的、当前产业链。摘要说明 BIM+数字孪生工地、建筑机器人、结构健康监测、低碳建造等方向对新增岗位和课程实训布局的影响。', '系统页面：08-job-forecast.png；顶部摘要区', `${source.app} -> jobResearchBriefs.forecast, jobResearchPurposeByTab.forecast`, '是', prompt.forecast],
  ['岗位分析', '新岗位新技术', '新兴技术方向卡片', '字段包括技术方向名称、阶段/成熟度、产业影响、关联岗位、推荐专业。当前包含建筑机器人协同施工、BIM+数字孪生工地、结构健康智能监测、装配式构件数字工厂等。', '系统页面：08-job-forecast.png；新兴技术方向卡片', `${source.app} -> FORECAST_DIRECTIONS v-for；${source.jobData} -> FORECAST_DIRECTIONS`, '部分', prompt.forecast],
  ['岗位分析', '新岗位新技术', '新岗位×专业匹配', '字段包括岗位名称、紧缺度、薪资、匹配专业、相关专业、推荐能力。用于判断新岗位可由哪些专业协同建设，以及课程/实训需要覆盖哪些能力。', '系统页面：08-job-forecast.png；新岗位×专业匹配卡片', `${source.app} -> FORECAST_NEW_JOBS v-for；${source.jobData} -> FORECAST_NEW_JOBS`, '部分', prompt.forecast],
  ['岗位分析', '新岗位新技术', '人才培养方向建议表', '字段包括技术方向、建议课程、相关专业。该表把新技术方向转译为课程建设与专业协同建议。', '系统页面：08-job-forecast.png；人才培养方向建议表', `${source.app} -> FORECAST_TRAINING_TABLE v-for；${source.jobData} -> FORECAST_TRAINING_TABLE`, '部分', prompt.forecast]
]

const sources = [
  ['来源类型', '来源名称/文件', '位置或链接', '本表使用方式', '边界说明'],
  ['页面实现', '岗位中心/产业调研页面模板', source.app, '逐页面识别标题、卡片、表格、弹窗、筛选、分页、视图切换和 hover 交互', '以前端当前 demo 为准，后续接口化后需回查接口字段'],
  ['页面数据', '产业布局与产业链数据', source.industryData, '提取产业链节点、上中下游、区域卡片、政策库、专业分析、企业库等页面数据结构', '静态 demo 数据，适合作为 ADS 字段梳理样本'],
  ['页面数据', '岗位分析与国标行业 mock 数据', source.jobData, '提取岗位画像、招聘趋势、新岗位新技术、国标行业指标、详情弹窗和企业/证书详情字段', '样本与相对热度为 demo 口径，不等同实时全量统计'],
  ['设计文档', '产业链国标行业指标设计', source.design, '确认 GB/T 4754 指标、统计口径、详情弹窗与非实时统计边界', '设计文档定义的是本轮 demo 实现口径'],
  ['官方/标准数据', '国民经济行业分类_GBT4754-2017.xlsx', source.gbt, '作为行业门类、大类、中类分类依据', '正式交付建议回查国家标准原文或官方发布页'],
  ['整理数据', '10个产业链节点汇总.xlsx', source.chainNodes, '作为产业链节点、环节和样本企业整理底稿', '属于整理型工作簿，需保留来源链路'],
  ['整理数据', '中国A股上市公司清单xlsx.xlsx', source.companyList, '作为代表企业样本补充底稿', '仅为样本来源之一，不代表实时企业全量库'],
  ['字段截图', '当前 demo 行级字段标注截图', 'outputs/industry-layout-source-table/field-shots', '作为 ADS 表“截图”列的直接嵌入图片，每行用红框标出字段位置', '通过当前 Vite demo 按 DOM 元素重新截图，不使用用户手绘标记截图作为数据来源'],
  ['报告口径', '报告数据来源说明', source.report, '确认报告层面的综合数据来源范围', '具体字段仍以页面数据文件和页面实现为准']
]

const workbook = Workbook.create()
const main = workbook.worksheets.add('ADS表')
const sourceSheet = workbook.worksheets.add('来源索引')
const lastRow = rows.length + 1

function styleHeader(range) {
  range.format.fill = { color: '#1f4e79' }
  range.format.font = { bold: true, color: '#ffffff' }
  range.format.wrapText = true
  range.format.horizontalAlignment = 'center'
  range.format.verticalAlignment = 'center'
}

main.showGridLines = false
const rowsForSheet = rows.map((row) => {
  const next = [...row]
  next[4] = ''
  return next
})

main.getRange('A1:H1').values = [headers]
main.getRangeByIndexes(1, 0, rows.length, headers.length).values = rowsForSheet
styleHeader(main.getRange('A1:H1'))
main.getRange(`A1:H${lastRow}`).format.borders = { preset: 'all', style: 'thin', color: '#d8e3f0' }
main.getRange(`A2:H${lastRow}`).format.wrapText = true
main.getRange(`A2:H${lastRow}`).format.verticalAlignment = 'top'
main.getRange('A:A').format.columnWidth = 12
main.getRange('B:B').format.columnWidth = 18
main.getRange('C:C').format.columnWidth = 28
main.getRange('D:D').format.columnWidth = 62
main.getRange('E:E').format.columnWidth = 42
main.getRange('F:F').format.columnWidth = 58
main.getRange('G:G').format.columnWidth = 14
main.getRange('H:H').format.columnWidth = 62
main.getRange(`G2:G${lastRow}`).format.horizontalAlignment = 'center'
main.getRange(`G2:G${lastRow}`).dataValidation = { rule: { type: 'list', values: ['是', '否', '部分'] } }
main.getRange('A1:H1').format.rowHeight = 30
main.getRange(`A2:H${lastRow}`).format.rowHeight = 152
main.freezePanes.freezeRows(1)
main.tables.add(`A1:H${lastRow}`, true, 'PageLevelADSTable')

async function addCellImage(sheet, imagePath, rowNumber) {
  const image = await fs.readFile(imagePath)
  const dataUrl = `data:image/png;base64,${image.toString('base64')}`
  sheet.images.add({
    dataUrl,
    anchor: {
      from: { row: rowNumber - 1, col: 4 },
      extent: { widthPx: 286, heightPx: 142 }
    }
  })
}

const fieldShotFiles = await fs.readdir(fieldShotRoot)
for (let rowNumber = 2; rowNumber <= lastRow; rowNumber += 1) {
  const prefix = `row-${String(rowNumber).padStart(2, '0')}-`
  const fileName = fieldShotFiles.find((file) => file.startsWith(prefix) && file.endsWith('.png'))
  if (fileName) {
    await addCellImage(main, path.join(fieldShotRoot, fileName), rowNumber)
  }
}

sourceSheet.showGridLines = false
sourceSheet.getRange('A1:E1').values = [sources[0]]
sourceSheet.getRangeByIndexes(1, 0, sources.length - 1, 5).values = sources.slice(1)
styleHeader(sourceSheet.getRange('A1:E1'))
sourceSheet.getRange(`A1:E${sources.length}`).format.borders = { preset: 'all', style: 'thin', color: '#d8e3f0' }
sourceSheet.getRange(`A2:E${sources.length}`).format.wrapText = true
sourceSheet.getRange(`A2:E${sources.length}`).format.verticalAlignment = 'top'
sourceSheet.getRange('A:A').format.columnWidth = 16
sourceSheet.getRange('B:B').format.columnWidth = 32
sourceSheet.getRange('C:C').format.columnWidth = 68
sourceSheet.getRange('D:D').format.columnWidth = 48
sourceSheet.getRange('E:E').format.columnWidth = 48
sourceSheet.freezePanes.freezeRows(1)
sourceSheet.tables.add(`A1:E${sources.length}`, true, 'SourceIndexTable')

const inspect = await workbook.inspect({
  kind: 'sheet,table',
  maxChars: 4000,
  tableMaxRows: 6,
  tableMaxCols: 8
})
console.log(inspect.ndjson)

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'formula error scan'
})
console.log(errors.ndjson)

const preview = await workbook.render({ sheetName: 'ADS表', range: `A1:H${lastRow}`, scale: 1, format: 'png' })
await fs.writeFile(`${outputDir}/preview-data-source-table.png`, new Uint8Array(await preview.arrayBuffer()))
const previewSources = await workbook.render({ sheetName: '来源索引', range: `A1:E${sources.length}`, scale: 1, format: 'png' })
await fs.writeFile(`${outputDir}/preview-source-index.png`, new Uint8Array(await previewSources.arrayBuffer()))

await fs.mkdir(outputDir, { recursive: true })
const xlsx = await SpreadsheetFile.exportXlsx(workbook)
await xlsx.save(outputPath)
console.log(outputPath)

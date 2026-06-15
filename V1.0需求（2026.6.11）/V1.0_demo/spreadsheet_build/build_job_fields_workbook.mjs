import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputPath = new URL('../../岗位详情字段爬取模板.xlsx', import.meta.url)
const previewDir = new URL('../outputs/job_center_fields/render_check/', import.meta.url)

const headers = ['字段编码', '字段名称', '数据类型', '是否必填', '关联/枚举', '爬取说明', '示例值']

const sheets = [
  {
    name: '基本信息',
    description: '岗位建设中心岗位详情页字段，兼容岗位画像弹窗进入后的岗位主数据；不包含岗位图片。',
    rows: [
      ['job_id', '岗位ID', 'string', '是', '主键', '岗位唯一标识，可来自详情页URL、列表接口或调研画像卡片。', 'job-model-deploy'],
      ['source_module', '来源模块', 'enum', '是', '岗位建设中心；岗位数据调研', '标记字段来自建设中心详情页还是岗位数据调研画像。', '岗位数据调研'],
      ['job_name', '岗位名称', 'string', '是', '-', '岗位详情标题、画像卡片标题或基本信息区岗位名称。', 'AI模型部署工程师'],
      ['occupation_name', '所属职业', 'string', '是', '-', '岗位关联的国家职业或平台职业名称。', '人工智能工程技术人员'],
      ['occupation_code', '职业编码', 'string', '是', '-', '国家职业分类编码，保留短横线。', '2-02-10-09'],
      ['job_level', '岗位层级', 'string', '否', '-', '岗位层级或招聘难度等级。', '中级'],
      ['industry_chain', '岗位所属产业链', 'string', '是', '-', '岗位归属的产业链。', '人工智能产业链'],
      ['industry_node', '岗位所属产业节点', 'string', '是', '-', '岗位归属的产业节点或产业环节。', 'AI算法开发与部署'],
      ['job_group', '所属岗位群', 'string', '否', '-', '岗位归属的岗位群名称。', '算法部署岗位群'],
      ['related_company_ids', '岗位关联企业ID', 'string[]', '否', '关联企业详情.company_id', '关联企业唯一标识，多个用中文分号分隔。', 'company-baidu；company-iflytek'],
      ['related_company_names', '岗位关联企业', 'string[]', '否', '关联企业详情.company_short_name', '多个企业用中文分号分隔，便于人工核验。', '百度智能云；科大讯飞；商汤科技'],
      ['salary_range', '薪资范围', 'string', '否', '-', '保留页面展示文本。', '10K-18K'],
      ['salary_unit', '薪资单位', 'string', '否', '-', '从弹窗薪资后的单位提取。', '/月'],
      ['demand_level', '需求等级', 'string', '否', '-', '岗位需求热度或等级。', '高'],
      ['demand_volume', '需求量', 'number', '否', '-', '岗位需求数量，去除千分位后可转数字。', '18640'],
      ['education_requirement', '学历要求', 'string', '否', '-', '岗位学历要求。', '大专及以上'],
      ['experience_requirement', '经验要求', 'string', '否', '-', '岗位经验要求。', '1-3年'],
      ['career_path', '职业发展路径', 'text', '否', '-', '岗位详情或画像弹窗中的职业发展路径。', '模型部署工程师→MLOps工程师→AI平台架构师'],
      ['work_summary', '工作内容概述', 'text', '否', '-', '岗位详情中的工作内容概述或画像摘要。', '负责模型服务化、接口联调、性能监控和上线运维。'],
      ['requirements', '任职条件', 'text', '否', '-', '岗位详情中的任职条件，保留序号文本。', '熟悉Python、Linux、Docker和模型推理服务部署。'],
      ['profile_tags', '画像标签', 'string[]', '否', '-', '岗位画像弹窗中的标签，多个用中文分号分隔。', 'AI算法开发与部署；核心；需求量 18,640'],
      ['source_url', '来源URL', 'string', '否', '-', '岗位详情页或岗位画像详情URL。', 'https://example.com/position/detail?id=job-model-deploy'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  },
  {
    name: '典型工作任务',
    description: '岗位下属典型工作任务字段，一岗多任务；需保留与能力项的多对多关系。',
    rows: [
      ['task_id', '任务编码', 'string', '是', '主键', '任务唯一编码，建议由岗位ID+序号生成。', 'TASK-AI-DEPLOY-001'],
      ['job_id', '岗位ID', 'string', '是', '关联基本信息.job_id', '关联岗位主数据。', 'job-model-deploy'],
      ['task_name', '典型工作任务名称', 'string', '是', '-', '任务卡片标题或任务列表名称。', '模型服务化方案设计'],
      ['task_description', '任务描述', 'text', '是', '-', '任务卡片说明文本。', '根据业务场景选择模型推理框架、接口协议和部署架构，形成上线方案。'],
      ['task_order', '任务排序', 'number', '否', '-', '页面中的展示顺序。', '1'],
      ['ability_ids', '关联能力项编码', 'string[]', '否', '关联岗位能力项.ability_id', '任务关联的能力项编码，多个用中文分号分隔。', 'ABL-AI-DEPLOY-001；ABL-AI-DEPLOY-018'],
      ['ability_names', '关联能力项名称', 'string[]', '否', '关联岗位能力项.ability_name', '任务卡片或能力图谱中展示的能力项标签。', '机器学习模型推理流程；Python工程开发；跨团队协作'],
      ['source_module', '来源模块', 'enum', '否', '岗位建设中心；岗位数据调研', '任务来自岗位详情页还是画像弹窗。', '岗位建设中心'],
      ['source_url', '来源URL', 'string', '否', '-', '任务详情或岗位详情页面URL。', 'https://example.com/position/detail?id=job-model-deploy&tab=tasks'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  },
  {
    name: '岗位能力项',
    description: '岗位能力项字段；能力类别统一为知识、技能、素养，并通过关联任务编码建立任务-能力关系。',
    rows: [
      ['ability_id', '能力项编码', 'string', '是', '主键', '能力项唯一编码，建议由岗位ID+能力序号生成。', 'ABL-AI-DEPLOY-001'],
      ['job_id', '岗位ID', 'string', '是', '关联基本信息.job_id', '关联岗位主数据。', 'job-model-deploy'],
      ['related_task_ids', '关联任务编码', 'string[]', '是', '关联典型工作任务.task_id', '关联典型工作任务，多个用中文分号分隔。', 'TASK-AI-DEPLOY-001；TASK-AI-DEPLOY-002'],
      ['ability_name', '能力项名称', 'string', '是', '-', '能力项列表、画像弹窗或能力图谱中的能力项名称。', '模型服务部署'],
      ['ability_category', '能力类别', 'enum', '是', '知识；技能；素养', '新功能统一的三类能力维度。', '技能'],
      ['ability_definition', '能力项定义', 'text', '否', '-', '能力项定义说明；若画像弹窗只提供名称，可为空。', '能够使用FastAPI、Docker等工具完成模型服务部署与调试。'],
      ['ability_order', '能力项排序', 'number', '否', '-', '同一岗位同一能力类别内的展示顺序。', '2'],
      ['source_task_names', '关联任务名称', 'string[]', '否', '冗余核验字段', '为研发核验关系保留任务名称冗余字段。', '模型服务化方案设计；模型部署与接口联调'],
      ['source_module', '来源模块', 'enum', '否', '岗位建设中心；岗位数据调研', '字段来自岗位详情页能力列表还是岗位画像弹窗。', '岗位数据调研'],
      ['source_url', '来源URL', 'string', '否', '-', '能力项列表、能力图谱或详情来源URL。', 'https://example.com/position/detail?id=job-model-deploy&tab=ability'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  },
  {
    name: '岗位画像详情',
    description: '岗位数据调研-岗位画像分析中，点击岗位卡片弹窗展示的画像详情字段。',
    rows: [
      ['profile_id', '画像ID', 'string', '是', '主键', '岗位画像记录唯一标识，可与岗位ID一致。', 'profile-job-model-deploy'],
      ['job_id', '岗位ID', 'string', '是', '关联基本信息.job_id', '关联岗位主数据。', 'job-model-deploy'],
      ['job_name', '岗位名称', 'string', '是', '-', '画像弹窗标题。', 'AI模型部署工程师'],
      ['salary_range', '薪资范围', 'string', '否', '-', '画像弹窗薪资区间。', '10K-18K'],
      ['salary_unit', '薪资单位', 'string', '否', '-', '画像弹窗薪资单位。', '/月'],
      ['education_requirement', '学历要求', 'string', '否', '-', '画像弹窗学历要求。', '大专及以上'],
      ['experience_requirement', '经验要求', 'string', '否', '-', '画像弹窗经验要求。', '1-3年'],
      ['job_level', '岗位层级', 'string', '否', '-', '画像弹窗岗位层级。', '中级'],
      ['demand_volume', '需求量', 'number', '否', '-', '画像弹窗或卡片中的需求量。', '18640'],
      ['career_path', '职业路径', 'text', '否', '-', '画像弹窗职业路径。', '模型部署工程师→MLOps工程师→AI平台架构师'],
      ['industry_chain', '产业链', 'string', '是', '-', '画像所属产业链。', '人工智能产业链'],
      ['industry_node', '产业节点', 'string', '是', '-', '画像所属产业节点。', 'AI算法开发与部署'],
      ['profile_tags', '画像标签', 'string[]', '否', '-', '画像弹窗顶部标签。', 'AI算法开发与部署；核心；需求量 18,640'],
      ['portrait_summary', '画像摘要', 'text', '否', '-', '岗位画像弹窗中的岗位职责/画像概述。', '负责将训练完成的机器学习或大模型能力部署到业务系统。'],
      ['knowledge_items', '知识能力项', 'string[]', '是', '关联岗位能力项.ability_category=知识', '三维能力分析中的知识列表。', '机器学习模型推理流程；Linux与容器基础；MLOps生命周期'],
      ['skill_items', '技能能力项', 'string[]', '是', '关联岗位能力项.ability_category=技能', '三维能力分析中的技能列表。', 'Python工程开发；模型服务部署；Docker镜像构建'],
      ['quality_items', '素养能力项', 'string[]', '是', '关联岗位能力项.ability_category=素养', '三维能力分析中的素养列表。', '数据安全与合规意识；跨团队协作；规范化交付意识'],
      ['radar_labels', '雷达维度标签', 'string[]', '否', '-', '画像弹窗能力雷达图维度。', '知识基础；工程实践；工具平台；业务场景；交付协作'],
      ['radar_knowledge_scores', '知识雷达得分', 'number[]', '否', '与radar_labels顺序一致', '知识维度雷达得分。', '88；80；84；86；78'],
      ['radar_skill_scores', '技能雷达得分', 'number[]', '否', '与radar_labels顺序一致', '技能维度雷达得分。', '82；90；76；80；86'],
      ['radar_quality_scores', '素养雷达得分', 'number[]', '否', '与radar_labels顺序一致', '素养维度雷达得分。', '76；84；90；82；88'],
      ['task_names', '典型工作任务', 'string[]', '否', '关联典型工作任务.task_name', '画像弹窗中的典型工作任务。', '模型服务化方案设计；模型部署与接口联调；推理性能优化'],
      ['certificate_ids', '推荐证书ID', 'string[]', '否', '关联证书详情.cert_id', '画像弹窗推荐职业资格证书ID。', 'cert-ai-engineer；cert-python-ai'],
      ['certificate_names', '推荐证书名称', 'string[]', '否', '关联证书详情.cert_name', '画像弹窗推荐职业资格证书名称。', '人工智能工程技术人员专业技术证书；Python人工智能应用开发证书'],
      ['major_names', '对接专业', 'string[]', '否', '-', '画像弹窗对接专业。', '人工智能技术应用；软件技术；大数据技术'],
      ['company_ids', '相关企业ID', 'string[]', '否', '关联企业详情.company_id', '画像弹窗相关企业ID。', 'company-baidu；company-iflytek'],
      ['company_names', '相关企业名称', 'string[]', '否', '关联企业详情.company_short_name', '画像弹窗相关企业名称。', '百度智能云；科大讯飞；商汤科技'],
      ['source_url', '来源URL', 'string', '否', '-', '岗位画像详情来源URL。', 'https://example.com/job-research/portrait?id=job-model-deploy'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  },
  {
    name: '证书详情',
    description: '岗位画像详情弹窗中点击推荐职业资格证书后展示的证书详情字段。',
    rows: [
      ['cert_id', '证书ID', 'string', '是', '主键', '证书唯一标识。', 'cert-ai-engineer'],
      ['cert_name', '证书名称', 'string', '是', '-', '证书详情弹窗标题。', '人工智能工程技术人员专业技术证书'],
      ['cert_level', '证书等级', 'string', '否', '-', '证书等级或级别。', '中级'],
      ['cert_category', '证书类型', 'string', '否', '-', '证书类型。', '专业技术证书'],
      ['cert_summary', '证书说明', 'text', '否', '-', '证书详情中的能力认证说明。', '面向AI工程化、模型部署和智能应用交付能力的综合认证。'],
      ['cert_tags', '证书标签', 'string[]', '否', '-', '证书标签，多个用中文分号分隔。', '模型部署；工程化；数据安全'],
      ['issuer', '颁发机构', 'string', '否', '-', '证书颁发机构。', '中国电子学会'],
      ['valid_period', '有效期', 'string', '否', '-', '证书有效期。', '3年'],
      ['pass_rate', '通过率', 'percent/string', '否', '-', '保留页面展示文本。', '62%'],
      ['salary_boost', '薪资加成', 'string', '否', '-', '证书对薪资的影响展示文本。', '+16%'],
      ['requirements', '报考条件', 'text', '否', '-', '证书报考条件。', '大专及以上学历，计算机、人工智能、软件或相关专业。'],
      ['exam_items', '考试科目', 'string[]', '否', '-', '证书考试科目，多个用中文分号分隔。', '机器学习基础；模型部署实践；数据安全与合规'],
      ['fit_job_ids', '适用岗位ID', 'string[]', '否', '关联基本信息.job_id', '证书适用岗位ID。', 'job-model-deploy；job-vision'],
      ['fit_job_names', '适用岗位', 'string[]', '否', '关联基本信息.job_name', '证书适用岗位名称。', 'AI模型部署工程师；工业视觉检测工程师'],
      ['source_job_id', '来源岗位ID', 'string', '否', '关联岗位画像详情.job_id', '从哪个岗位画像弹窗进入该证书。', 'job-model-deploy'],
      ['source_url', '来源URL', 'string', '否', '-', '证书详情来源URL。', 'https://example.com/certificate/detail?id=cert-ai-engineer'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  },
  {
    name: '企业详情',
    description: '岗位画像详情弹窗中点击相关企业后展示的企业详情字段。',
    rows: [
      ['company_id', '企业ID', 'string', '是', '主键', '企业唯一标识。', 'company-baidu'],
      ['company_short_name', '企业简称', 'string', '是', '-', '企业详情弹窗标题或卡片名称。', '百度智能云'],
      ['company_full_name', '企业全称', 'string', '是', '-', '企业详情正文中的企业全称。', '百度在线网络技术（北京）有限公司'],
      ['company_tags', '企业标签', 'string[]', '否', '-', '企业标签，多个用中文分号分隔。', '大模型平台；云计算；AI原生应用'],
      ['company_summary', '企业简介', 'text', '否', '-', '企业详情中的简介段落。', '依托文心大模型和飞桨生态，为企业提供模型训练和推理部署服务。'],
      ['region', '所在地区', 'string', '否', '-', '企业所在地区。', '北京海淀'],
      ['industry', '所属行业', 'string', '否', '-', '企业所属行业。', 'AI平台 / 云计算'],
      ['company_scale', '企业规模', 'string', '否', '-', '企业规模。', '大型互联网企业'],
      ['company_type', '企业类型', 'string', '否', '-', '上市公司、民营企业、国企等。', '大型互联网企业'],
      ['founded_year', '成立时间', 'string', '否', '-', '企业成立时间，保留页面展示文本。', '2000年'],
      ['registered_capital', '注册资本', 'string', '否', '-', '企业注册资本。', '10亿元'],
      ['employee_count', '员工人数', 'string', '否', '-', '企业员工人数。', '约45000人'],
      ['annual_revenue', '营业收入', 'string', '否', '-', '企业营收信息。', '约1345亿元（2024年）'],
      ['annual_recruit_count', '年均招聘', 'string', '否', '-', '企业年均招聘规模。', '约6000人/年'],
      ['industry_chain_node', '产业链环节', 'string', '否', '-', '企业对应产业链环节。', '中游-AI算法平台与部署'],
      ['main_business', '主营业务', 'text', '否', '-', '企业主营业务。', 'AI平台、云计算、智能应用开发和行业解决方案。'],
      ['products', '核心产品', 'string[]', '否', '-', '企业核心产品，多个用中文分号分隔。', '文心大模型；飞桨PaddlePaddle；千帆大模型平台'],
      ['tech_directions', '技术方向', 'string[]', '否', '-', '企业技术方向。', '大模型部署；AI应用开发；模型推理优化'],
      ['recruiting_job_ids', '主要招聘岗位ID', 'string[]', '否', '关联基本信息.job_id', '企业主要招聘岗位ID。', 'job-model-deploy；job-data-analyst'],
      ['recruiting_job_names', '主要招聘岗位', 'string[]', '否', '关联基本信息.job_name', '企业主要招聘岗位名称。', 'AI模型部署工程师；AI数据分析师'],
      ['cooperation_type', '校企合作类型', 'string', '否', '-', '校企合作类型。', '产业学院 / 实训基地'],
      ['cooperation_detail', '校企合作详情', 'text', '否', '-', '校企合作说明。', '共建AI工程化课程，提供模型部署与智能应用项目案例。'],
      ['source_job_id', '来源岗位ID', 'string', '否', '关联岗位画像详情.job_id', '从哪个岗位画像弹窗进入该企业。', 'job-model-deploy'],
      ['source_url', '来源URL', 'string', '否', '-', '企业详情来源URL。', 'https://example.com/company/detail?id=company-baidu'],
      ['crawl_time', '爬取时间', 'datetime', '否', 'yyyy-mm-dd hh:mm:ss', '数据爬取时间。', '2026-05-25 11:30:00']
    ]
  }
]

const workbook = Workbook.create()

for (const sheetData of sheets) {
  const sheet = workbook.worksheets.add(sheetData.name)
  const lastRow = sheetData.rows.length + 4

  sheet.getRange('A1:G1').merge()
  sheet.getRange('A1').values = [[`${sheetData.name}字段说明`]]
  sheet.getRange('A2:G2').merge()
  sheet.getRange('A2').values = [[sheetData.description]]
  sheet.getRange('A4:G4').values = [headers]
  sheet.getRange(`A5:G${lastRow}`).values = sheetData.rows

  sheet.getRange('A1:G1').format = {
    font: { bold: true, size: 16, color: '#17233a' },
    fill: { color: '#eaf2ff' },
    horizontalAlignment: 'left',
    verticalAlignment: 'middle'
  }
  sheet.getRange('A2:G2').format = {
    font: { color: '#64748b', size: 11 },
    fill: { color: '#f8fbff' },
    verticalAlignment: 'top',
    wrapText: true
  }
  sheet.getRange('A4:G4').format = {
    font: { bold: true, color: '#17233a' },
    fill: { color: '#2f66ff' },
    horizontalAlignment: 'center',
    verticalAlignment: 'middle'
  }
  sheet.getRange(`A5:G${lastRow}`).format = {
    font: { color: '#253854', size: 10 },
    verticalAlignment: 'top',
    wrapText: true
  }
  sheet.getRange(`A5:A${lastRow}`).format = {
    font: { bold: true, color: '#2450a5' },
    fill: { color: '#f4f8ff' },
    verticalAlignment: 'top',
    wrapText: true
  }
  sheet.getRange(`D5:D${lastRow}`).format = {
    horizontalAlignment: 'center',
    verticalAlignment: 'top'
  }

  sheet.getRange('A:A').format.columnWidthPx = 170
  sheet.getRange('B:B').format.columnWidthPx = 150
  sheet.getRange('C:C').format.columnWidthPx = 110
  sheet.getRange('D:D').format.columnWidthPx = 86
  sheet.getRange('E:E').format.columnWidthPx = 210
  sheet.getRange('F:F').format.columnWidthPx = 380
  sheet.getRange('G:G').format.columnWidthPx = 300
}

await fs.mkdir(previewDir, { recursive: true })

for (const sheetData of sheets) {
  const lastRow = sheetData.rows.length + 4
  const rendered = await workbook.render({
    sheetName: sheetData.name,
    range: `A1:G${Math.min(lastRow, 18)}`,
    scale: 1
  })
  await fs.writeFile(new URL(`${sheetData.name}.png`, previewDir), Buffer.from(await rendered.arrayBuffer()))
}

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)

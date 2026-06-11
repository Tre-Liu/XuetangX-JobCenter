import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.join(root, 'outputs', 'national-it-reports')
fs.mkdirSync(outDir, { recursive: true })

const generatedDate = '2026年6月'
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const sources = [
  ['国务院：《“十四五”数字经济发展规划》', 'https://www.gov.cn/zhengce/content/2022-01/12/content_5667817.htm'],
  ['中共中央、国务院：《数字中国建设整体布局规划》', 'https://www.gov.cn/zhengce/2023-02/27/content_5743484.htm'],
  ['中共中央、国务院：《关于构建数据基础制度更好发挥数据要素作用的意见》', 'https://www.gov.cn/zhengce/2022-12/19/content_5732695.htm'],
  ['工业和信息化部：软件业统计分析栏目', 'https://www.miit.gov.cn/gxsj/tjfx/rjy/index.html'],
  ['教育部：职业教育专业目录与专业设置管理相关公开文件', 'https://www.moe.gov.cn/srcsite/A07/moe_953/'],
]

const css = `
  :root {
    --ink: #253653;
    --muted: #6f7e95;
    --blue: #2f73ff;
    --blue-dark: #1f4fba;
    --line: #d8e1ee;
    --soft: #f4f7fc;
    --green: #24a676;
    --cyan: #20a8b8;
    --orange: #f28b3c;
    --purple: #8268ff;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: #eef4ff;
    color: var(--ink);
    font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
  }
  body { padding: 24px; }
  .report-preview-doc.report-export-doc {
    width: 980px;
    margin: 0 auto;
    padding: 30px 38px 34px;
    border: 1px solid #dce7fb;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 18px 46px rgba(42, 74, 128, 0.12);
    font-size: 14px;
    line-height: 1.78;
  }
  .report-preview-doc h1 {
    margin: 0 0 10px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--blue);
    color: #1f2f52;
    font-size: 22px;
    text-align: center;
  }
  .report-preview-doc h2 {
    margin: 24px 0 9px;
    padding-left: 10px;
    border-left: 4px solid var(--blue);
    color: var(--blue);
    font-size: 16px;
  }
  .report-preview-doc h3 {
    margin: 17px 0 7px;
    color: #1f2f52;
    font-size: 14px;
  }
  .report-preview-doc h4 {
    margin: 13px 0 5px;
    color: #50607b;
    font-size: 13px;
    font-weight: 900;
  }
  .report-preview-doc p { margin: 8px 0; text-indent: 2em; }
  .report-doc-subtitle {
    color: #8792a7;
    text-align: center;
    text-indent: 0 !important;
  }
  .report-preview-doc table {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
    font-size: 12px;
  }
  .report-preview-doc th,
  .report-preview-doc td {
    padding: 7px 9px;
    border: 1px solid var(--line);
    text-align: left;
    vertical-align: middle;
  }
  .report-preview-doc th {
    color: #223250;
    background: var(--soft);
    font-weight: 900;
  }
  .rpt-figure {
    width: min(100%, 760px);
    margin: 14px auto;
    padding: 10px 12px;
    border: 1px solid #e0e6f0;
    border-radius: 8px;
    background: #fff;
    page-break-inside: avoid;
  }
  .rpt-figure-title {
    margin-bottom: 6px;
    color: #1f2f52;
    font-size: 12.5px;
    font-weight: 900;
    text-align: center;
  }
  .rpt-figure svg {
    display: block;
    width: min(100%, 690px);
    max-width: 100%;
    margin: 0 auto;
  }
  .note-box {
    margin: 12px 0;
    padding: 10px 13px;
    border: 1px solid #cddcf8;
    border-left: 4px solid var(--blue);
    border-radius: 8px;
    background: #f7faff;
  }
  .note-box p { margin: 0; text-indent: 0; }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }
  .mini-card {
    min-height: 82px;
    padding: 11px 12px;
    border: 1px solid #dce7fb;
    border-radius: 8px;
    background: #fbfdff;
  }
  .mini-card strong { color: #1f2f52; }
  .mini-card p {
    margin: 5px 0 0;
    text-indent: 0;
    color: #526179;
    font-size: 12.5px;
  }
  .source-list { margin-top: 12px; padding-left: 18px; color: #50607b; font-size: 12px; }
  .source-list li { margin: 4px 0; word-break: break-all; }
  .source-list a { color: var(--blue-dark); text-decoration: none; }
  .footer-note {
    margin-top: 18px;
    padding-top: 8px;
    border-top: 1px solid #e0e6f0;
    color: #8792a7;
    font-size: 11.5px;
    text-align: center;
    text-indent: 0 !important;
  }
  @media print {
    html, body { background: #fff; padding: 0; }
    .report-preview-doc.report-export-doc {
      width: auto;
      margin: 0;
      padding: 0;
      border: 0;
      box-shadow: none;
      font-size: 12.5px;
    }
    h2, h3, h4, table, .rpt-figure, .two-col, .note-box { break-inside: avoid; }
  }
`

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const paragraph = (text) => `<p>${esc(text)}</p>`

const table = (headers, rows) => `
  <table>
    <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`

const note = (text) => `<div class="note-box"><p><strong>报告使用边界：</strong>${esc(text)}</p></div>`

const miniCards = (items) => `
  <div class="two-col">
    ${items.map((item) => `<div class="mini-card"><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div>`).join('')}
  </div>`

const barFigure = (title, data, color = '#315f9f') => {
  const max = Math.max(...data.map((item) => item.value))
  const rows = data.map((item, i) => {
    const y = 54 + i * 28
    const width = Math.round((item.value / max) * 430)
    return `
      <text x="40" y="${y + 11}" font-size="11" font-weight="700" fill="#2c3d5c">${esc(item.label)}</text>
      <rect x="178" y="${y}" width="${width}" height="16" rx="3" fill="${color}" opacity="${0.95 - i * 0.035}"/>
      <text x="${178 + width + 10}" y="${y + 12}" font-size="10.5" font-weight="700" fill="#315f9f">${item.value}</text>`
  }).join('')
  return `
  <div class="rpt-figure">
    <div class="rpt-figure-title">${esc(title)}</div>
    <svg viewBox="0 0 720 ${Math.max(230, 72 + data.length * 28)}" role="img" aria-label="${esc(title)}">
      <line x1="178" y1="34" x2="612" y2="34" stroke="#e8eef7"/>
      <line x1="178" y1="${48 + data.length * 28}" x2="612" y2="${48 + data.length * 28}" stroke="#e8eef7"/>
      <g font-family="Microsoft YaHei, Arial">${rows}</g>
      <text x="360" y="${66 + data.length * 28}" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="10.5" fill="#8792a7">指数为结构化样本与专业建设研判值，非官方统计总量</text>
    </svg>
  </div>`
}

const matrixFigure = (title, headers, rows) => {
  const cellW = 160
  const startX = 52
  const startY = 62
  return `
  <div class="rpt-figure">
    <div class="rpt-figure-title">${esc(title)}</div>
    <svg viewBox="0 0 720 ${130 + rows.length * 44}" role="img" aria-label="${esc(title)}">
      <g font-family="Microsoft YaHei, Arial" font-size="10.5">
        ${headers.map((h, i) => `<rect x="${startX + i * cellW}" y="30" width="${cellW}" height="30" fill="#f4f7fc" stroke="#d8e1ee"/><text x="${startX + i * cellW + cellW / 2}" y="50" text-anchor="middle" font-weight="900" fill="#223250">${esc(h)}</text>`).join('')}
        ${rows.map((row, r) => row.map((cell, c) => {
          const y = startY + r * 44
          return `<rect x="${startX + c * cellW}" y="${y}" width="${cellW}" height="44" fill="#fff" stroke="#d8e1ee"/><text x="${startX + c * cellW + cellW / 2}" y="${y + 19}" text-anchor="middle" font-weight="${c === 0 ? 900 : 700}" fill="${c === 0 ? '#1f2f52' : '#50607b'}">${esc(cell[0])}</text><text x="${startX + c * cellW + cellW / 2}" y="${y + 34}" text-anchor="middle" fill="#6f7e95">${esc(cell[1] ?? '')}</text>`
        }).join('')).join('')}
      </g>
    </svg>
  </div>`
}

const chainGraphFigure = (title, chain) => {
  const layout = {
    upstream: { x: 34, label: '上游资源与基础设施', color: '#c7d6f4' },
    midstream: { x: 274, label: '中游平台与工程服务', color: '#a9e3da' },
    downstream: { x: 514, label: '下游行业应用场景', color: '#ffd4bf' },
  }
  const cardW = 164
  const cardH = 34
  const stageNodes = Object.fromEntries(Object.keys(layout).map((stage) => [stage, chain.nodes.filter((node) => node.stage === stage)]))
  const maxRows = Math.max(...Object.values(stageNodes).map((nodes) => nodes.length))
  const rowGap = 47
  const startY = 62
  const positions = new Map()
  for (const [stage, nodes] of Object.entries(stageNodes)) {
    const offset = ((maxRows - nodes.length) * rowGap) / 2
    nodes.forEach((node, index) => {
      positions.set(node.id, {
        x: layout[stage].x,
        y: startY + offset + index * rowGap,
      })
    })
  }
  const height = startY + maxRows * rowGap + 32
  const links = chain.links.map((link, index) => {
    const source = positions.get(link.source)
    const target = positions.get(link.target)
    if (!source || !target) return ''
    const sx = source.x + cardW
    const sy = source.y + cardH / 2
    const tx = target.x
    const ty = target.y + cardH / 2
    const c1 = sx + 42
    const c2 = tx - 42
    const width = 2 + link.value / 5
    const id = `flow-${title.length}-${index}`
    return `
      <linearGradient id="${id}" x1="0" x2="1"><stop offset="0%" stop-color="${link.from}"/><stop offset="100%" stop-color="${link.to}"/></linearGradient>
      <path d="M${sx} ${sy} C${c1} ${sy}, ${c2} ${ty}, ${tx} ${ty}" fill="none" stroke="url(#${id})" stroke-width="${width}" stroke-linecap="round" opacity="0.52"/>`
  }).join('')
  const cards = chain.nodes.map((node) => {
    const pos = positions.get(node.id)
    const stage = layout[node.stage]
    return `
      <rect x="${pos.x}" y="${pos.y}" width="${cardW}" height="${cardH}" rx="7" fill="#fff" stroke="${stage.color}"/>
      <text x="${pos.x + cardW / 2}" y="${pos.y + 15}" text-anchor="middle" font-weight="900" fill="#203251">${esc(node.name)}</text>
      <text x="${pos.x + cardW / 2}" y="${pos.y + 28}" text-anchor="middle" fill="#6f7e95">${esc(node.note)}</text>`
  }).join('')
  return `
  <div class="rpt-figure">
    <div class="rpt-figure-title">${esc(title)}</div>
    <svg viewBox="0 0 720 ${height}" role="img" aria-label="${esc(title)}">
      <defs>${links}</defs>
      <g font-family="Microsoft YaHei, Arial" font-size="10.5" font-weight="900" fill="#6e7d95">
        ${Object.entries(layout).map(([, stage]) => `<text x="${stage.x + cardW / 2}" y="28" text-anchor="middle">${esc(stage.label)}</text>`).join('')}
      </g>
      <g font-family="Microsoft YaHei, Arial" font-size="10.5">${cards}</g>
      <text x="360" y="${height - 8}" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="10.5" fill="#8792a7">连线粗细依据本报告结构化样本中的任务关联强度绘制</text>
    </svg>
  </div>`
}

const sourceHtml = () => `
  <h2>数据来源说明</h2>
  <p>本报告引用国家公开政策与行业统计栏目作为宏观背景依据，岗位结构、区域梯度、产业链关联强度和能力优先级为基于公开资料、典型招聘样本和专业建设经验归纳形成的结构化研判，用于人才培养方案修订、课程重构和校企合作方向选择，不作为政府统计数据或就业承诺。</p>
  <ol class="source-list">
    ${sources.map(([label, url]) => `<li>${esc(label)}：<a href="${url}">${url}</a></li>`).join('')}
  </ol>`

const reports = [
  {
    slug: 'big-data-engineering-technology',
    title: '大数据工程技术专业产业调研报告',
    subtitle: `报告周期：2023-2026年 ｜ 分析区域：全国 ｜ 对标专业：大数据工程技术专业 ｜ 生成日期：${generatedDate}`,
    chain: {
      nodes: [
        { id: 'data-resource', stage: 'upstream', name: '公共与行业数据', note: '政务/金融/工业' },
        { id: 'compute', stage: 'upstream', name: '算力与存储底座', note: '云/边/湖仓' },
        { id: 'database', stage: 'upstream', name: '数据库与中间件', note: '关系/NoSQL/消息' },
        { id: 'govern', stage: 'midstream', name: '数据治理平台', note: '标准/质量/血缘' },
        { id: 'warehouse', stage: 'midstream', name: '湖仓与批流计算', note: 'Spark/Flink/调度' },
        { id: 'service', stage: 'midstream', name: '数据服务与BI', note: '指标/看板/API' },
        { id: 'ai-data', stage: 'midstream', name: 'AI数据工程', note: '样本/标注/评测' },
        { id: 'gov', stage: 'downstream', name: '数字政府', note: '治理/监管/服务' },
        { id: 'industry', stage: 'downstream', name: '智能制造', note: '质量/设备/供应链' },
        { id: 'finance', stage: 'downstream', name: '金融与商贸', note: '风控/经营/用户' },
        { id: 'city', stage: 'downstream', name: '交通医疗能源', note: '运行/安全/预测' },
      ],
      links: [
        { source: 'data-resource', target: 'govern', value: 22, from: '#6b8dff', to: '#35c6be' },
        { source: 'compute', target: 'warehouse', value: 26, from: '#73a5ff', to: '#35c6be' },
        { source: 'database', target: 'warehouse', value: 20, from: '#73ddd3', to: '#35c6be' },
        { source: 'data-resource', target: 'service', value: 18, from: '#6b8dff', to: '#63c7f6' },
        { source: 'database', target: 'govern', value: 16, from: '#73ddd3', to: '#35c6be' },
        { source: 'govern', target: 'gov', value: 20, from: '#35c6be', to: '#ff7048' },
        { source: 'warehouse', target: 'industry', value: 24, from: '#35c6be', to: '#ff9c7b' },
        { source: 'service', target: 'finance', value: 22, from: '#63c7f6', to: '#ffb16a' },
        { source: 'ai-data', target: 'city', value: 15, from: '#8268ff', to: '#ff8f5a' },
        { source: 'service', target: 'gov', value: 16, from: '#63c7f6', to: '#ff7048' },
      ],
    },
    regionData: [
      { label: '长三角', value: 92 },
      { label: '粤港澳', value: 88 },
      { label: '京津冀', value: 84 },
      { label: '成渝', value: 72 },
      { label: '长江中游', value: 66 },
      { label: '山东半岛', value: 58 },
      { label: '西北', value: 52 },
      { label: '东北', value: 48 },
    ],
    jobData: [
      { label: '大数据开发工程师', value: 24 },
      { label: '数据仓库/湖仓工程师', value: 18 },
      { label: '数据分析与BI工程师', value: 17 },
      { label: '数据治理工程师', value: 15 },
      { label: '数据平台运维工程师', value: 14 },
      { label: 'AI数据工程师', value: 12 },
    ],
    abilityData: [
      { label: 'SQL与数据建模', value: 92 },
      { label: '批流计算开发', value: 86 },
      { label: '数据治理安全', value: 82 },
      { label: 'BI分析表达', value: 78 },
      { label: '平台部署运维', value: 74 },
      { label: '业务理解沟通', value: 80 },
    ],
    currentData: [
      { label: '数据库基础', value: 82 },
      { label: 'Python/Java', value: 78 },
      { label: '数据仓库', value: 62 },
      { label: '批流计算', value: 55 },
      { label: '数据治理', value: 48 },
      { label: '行业项目', value: 44 },
    ],
    html() {
      return `
        <h1>${esc(this.title)}</h1>
        <p class="report-doc-subtitle">${esc(this.subtitle)}</p>

        <h2>一、专业建设背景与概述</h2>
        <h3>1.1 背景与目的</h3>
        ${paragraph('大数据工程技术专业面向数字经济、数据要素市场建设和产业数字化转型需求，核心任务是培养能够完成数据采集、治理、存储、计算、分析、可视化、安全合规和平台运维的复合型技术技能人才。与传统“数据分析”培养口径相比，职业本科层次更应突出工程化、平台化和场景交付能力，既能处理数据，也能把数据能力嵌入企业业务流程。')}
        ${paragraph('本次调研的直接目的，是为大数据工程技术专业的人才培养方案修订、课程体系重构、实训项目配置和校企合作拓展提供依据。报告重点回答三个问题：全国数字经济和数据服务产业链需要什么样的一线工程人才，毕业生适合进入哪些岗位群，以及人才培养方案中的岗位、工作任务和核心技能应如何同步更新。')}
        ${note('图表中的岗位比例、区域热度和能力优先级均来自结构化样本与专业建设研判，适合用于专业论证、课程重构和校企合作方向选择；若用于招生宣传或就业质量报告，应补充本校真实就业跟踪数据。')}
        <h3>1.2 专业定位与特色</h3>
        ${paragraph('本专业建议定位为“面向数据工程交付和行业数据服务的一线复合型技术技能人才培养专业”。服务对象包括软件和信息技术服务企业、数字政府项目单位、智能制造企业、金融科技公司、现代商贸平台、交通物流和医疗能源等行业数字化部门。专业特色不应仅停留在“会分析数据”，而应体现数据全生命周期工程能力。')}
        ${paragraph('本专业的差异化特色应体现在三方面：第一，围绕数据工程任务链组织课程，使学生能够完成从数据源接入到数据产品交付的闭环；第二，突出数据治理、安全合规和指标口径意识，避免只训练工具操作；第三，将行业数据项目、BI看板、数据质量报告和治理清单作为课程成果，形成可被企业识别的能力证据。')}
        <h3>1.3 调研内容与方法</h3>
        ${paragraph('本报告围绕全国数字经济重点区域、数据要素与大数据服务产业链、典型岗位群、专业建设现状、同类专业竞争态势和建设改进建议展开调研。方法上采用“产业链图谱分析 + 岗位任务拆解 + 能力要素归纳 + 课程适配研判 + 标杆对比”的组合路径。')}

        <h2>二、专业对应行业与岗位需求分析</h2>
        <h3>2.1 核心就业行业分析</h3>
        <h4>2.1.1 行业分布现状</h4>
        ${paragraph('大数据工程技术专业对应的核心就业行业主要分布在软件与信息技术服务、数字政府、智能制造、金融科技、现代商贸、交通物流、医疗健康和能源电力等领域。全国范围内，东部沿海城市在平台企业、数字服务商和行业应用项目上优势明显；中西部地区在政务数据、能源制造、智慧城市和区域数据基础设施方面形成增长机会。')}
        ${barFigure('图1 全国大数据岗位与项目机会区域梯度（结构化指数）', this.regionData, '#315f9f')}
        <h4>2.1.2 行业发展现状与趋势</h4>
        ${paragraph('大数据产业链正从“数据采集与分析工具”向“数据要素流通、数据治理、行业数据产品和智能决策服务”升级。对职业本科专业而言，最适合转化为教学任务的环节集中在中游数据工程与平台服务，以及下游行业应用与治理服务。')}
        ${chainGraphFigure('图2 数据要素与大数据服务产业链图谱', this.chain)}
        <h4>2.1.3 行业人才需求评估</h4>
        ${paragraph('企业对大数据类人才的要求已经从“会取数、会做图”转向“能建模、能开发、能治理、能上线、能解释”。平台型企业更重视数据开发、数据仓库、批流计算和平台运维；行业应用单位更重视指标理解、BI表达、质量校验和业务沟通；数字政府和公共数据项目则更强调标准规范、目录管理、权限流程和安全合规。')}
        ${table(['企业/场景类型', '需求强度', '高频岗位', '典型能力要求'], [
          ['软件与数据服务商', '高', '大数据开发、湖仓工程师、平台运维工程师', 'SQL建模、批流计算、任务调度、平台部署'],
          ['数字政府与公共服务', '高', '数据治理工程师、数据目录管理员、BI工程师', '数据标准、质量规则、权限流程、报告表达'],
          ['智能制造与能源交通', '中高', '工业数据工程师、设备数据分析员、数据平台运维', '时序数据、异常监测、数据接入、可视化'],
          ['金融商贸与互联网平台', '中高', '数据分析师、用户数据工程师、AI数据工程师', '指标体系、用户分析、特征处理、数据合规'],
        ])}
        <h3>2.2 社会需求分布特征分析</h3>
        <h4>2.2.1 社会需求的单位性质特征</h4>
        ${paragraph('国有企事业单位和数字政府项目通常更强调数据标准、流程规范、安全边界和报告可追溯；民营数字服务企业更强调交付效率、工具熟练度、接口对接和客户响应；大型平台企业更强调工程规范、稳定性和性能优化。专业建设应把不同单位性质的需求转化为不同类型课程任务。')}
        <h4>2.2.2 社会需求的公司规模特征</h4>
        ${paragraph('大型企业倾向于细分岗位，如数据仓库、数据开发、数据治理、BI、平台运维等；中小型企业更倾向于“一专多能”，要求毕业生同时完成数据处理、看板制作、简单运维和沟通汇报。因此课程体系既要有核心岗位深度，也要保留跨岗位迁移能力。')}
        <h3>2.3 目标就业岗位分析</h3>
        <h4>2.3.1 核心岗位群识别</h4>
        ${paragraph('建议将毕业后的目标岗位群明确为大数据开发工程师、数据仓库/湖仓工程师、数据分析与BI工程师、数据治理工程师、数据平台运维工程师、AI数据工程师、行业数据产品助理和数据安全合规助理等方向。')}
        ${barFigure('图3 大数据工程技术专业目标岗位群结构建议', this.jobData, '#20a8b8')}
        <h4>2.3.2 岗位需求特征分析</h4>
        ${table(['目标岗位', '毕业后主要工作任务', '核心技能', '人才培养方案建议'], [
          ['大数据开发工程师', '采集脚本、ETL开发、批流任务、数据质量处理', 'SQL、Python/Java、Spark、Flink、任务调度', '设为核心岗位，增加数据开发综合实训'],
          ['数据仓库/湖仓工程师', '主题域建模、分层维护、指标口径、数据集支撑', 'Hive/ClickHouse、湖仓架构、指标体系、元数据', '在数据库后设置数据仓库建模与湖仓项目'],
          ['数据分析与BI工程师', '指标梳理、可视化看板、经营分析、专题报告', '统计分析、SQL取数、BI工具、业务沟通', '把分析报告表达纳入毕业设计评价'],
          ['数据治理工程师', '标准制定、质量规则、血缘关系、目录与权限流程', '数据标准、质量校验、主数据、安全规范', '独立设置数据治理模块'],
          ['数据平台运维工程师', '集群维护、调度监控、性能处理、故障排查', 'Linux、Shell、容器、监控告警、云平台', '强化平台部署与运维实践'],
          ['AI数据工程师', '训练数据构造、标注清洗、质量评估、数据集版本管理', '标注规范、特征处理、模型评测、数据合规', '作为新兴拓展岗位与AI课程衔接'],
        ])}
        <h4>2.3.3 岗位需求趋势预测</h4>
        ${paragraph('未来三年，数据治理、湖仓开发、实时数据处理、AI数据工程和数据安全合规岗位会继续增强。传统BI和报表岗位不会消失，但会更多要求与数据仓库、指标体系和业务闭环结合。专业建设应提前把“治理、安全、实时、AI数据集”写入核心技能体系。')}
        <h3>2.4 人才能力需求分析</h3>
        <h4>2.4.1 素质能力要求</h4>
        ${paragraph('素质能力应突出数据合规意识、口径一致意识、复核意识、跨部门沟通和结果表达。数据岗位常常涉及业务部门、技术团队和管理部门之间的协同，学生需要通过项目汇报、质量复盘和数据说明文档训练责任意识。')}
        <h4>2.4.2 技术能力要求</h4>
        ${paragraph('技术能力应覆盖SQL与建模、Python/Java开发、分布式计算、数据仓库、数据治理、BI表达、云平台运维和数据安全。课程评价应从单项实验转向“脚本、模型、看板、质量报告、治理清单”的综合成果。')}
        <h4>2.4.3 工具能力要求</h4>
        ${paragraph('工具能力不宜绑定单一产品，而应强调迁移能力。学生应熟悉关系型数据库、NoSQL、任务调度、Spark/Flink、BI工具、Linux和云平台的基本组合，并理解这些工具在数据工程流程中的角色。')}
        ${barFigure('图4 大数据工程技术专业核心技能建设优先级', this.abilityData, '#8268ff')}

        <h2>三、本专业建设现状分析</h2>
        <h3>3.1 专业基本情况</h3>
        <h4>3.1.1 专业概况</h4>
        ${paragraph('大数据工程技术专业具备与软件工程技术、人工智能技术应用、云计算技术应用、信息安全技术应用等专业协同建设的基础。其专业群价值在于把数据工程能力向行业应用场景输送，并为专业群中的AI、软件、云平台和安全方向提供数据底座。')}
        <h4>3.1.2 培养方案与课程体系</h4>
        ${paragraph('现有课程通常已覆盖程序设计、数据库、Linux、统计基础和数据分析工具，但在湖仓架构、批流计算、数据治理、安全合规和行业综合项目方面容易薄弱。建议用岗位任务矩阵重新审视课程支撑强度。')}
        ${barFigure('图5 现有课程能力支撑度诊断（结构化研判）', this.currentData, '#27a46b')}
        <h3>3.2 人才培养成效</h3>
        <h4>3.2.1 就业质量</h4>
        ${paragraph('毕业生如果只具备工具操作能力，容易进入低阶报表或数据助理岗位；如果具备建模、治理和工程交付能力，则更容易进入数据开发、数据仓库和平台运维等质量更高的岗位。就业质量提升的关键在于课程成果能否证明学生完成过真实数据工程任务。')}
        <h4>3.2.2 培养质量</h4>
        ${paragraph('培养质量建议通过项目证据评价，包括数据源登记、ETL脚本、数据模型、指标口径、BI看板、质量报告、治理清单和部署记录。这样的证据链比单纯考试成绩更能支撑专业诊断和企业评价。')}
        <h3>3.3 招生与生源分析</h3>
        ${paragraph('招生宣传应避免只强调“大数据热门”，而应展示毕业后的具体岗位、工作任务和作品样例。通过数据中台项目、行业看板、AI数据集构建和数据治理案例，可以让学生和家长更清楚理解专业价值。')}

        <h2>四、专业竞争力与差异化分析</h2>
        <h3>4.1 同类专业布点情况</h3>
        ${paragraph('全国开设数据科学、大数据技术、数据管理类方向的院校较多，但真正把“数据工程、数据治理、平台运维、行业数据产品”贯通到职业本科培养方案中的专业仍有差异化空间。职业本科专业应突出工程交付和行业场景，而不是简单复刻普通本科的数据科学课程。')}
        <h3>4.2 竞争优势与劣势（SWOT）</h3>
        ${table(['类别', '判断', '建设含义'], [
          ['优势', '专业群可与软件、云计算、AI、安全方向协同', '适合建设跨专业数据工程综合项目'],
          ['劣势', '真实行业数据集和治理案例不足', '需要企业案例库和脱敏数据资源'],
          ['机会', '数据要素、数字政府、智能制造持续拉动需求', '可围绕数据治理和行业BI形成特色'],
          ['风险', '工具更新快，低阶报表岗位竞争激烈', '必须提升工程化和场景化能力'],
        ])}
        <h3>4.3 标杆专业分析</h3>
        ${paragraph('标杆专业通常具有三个特征：一是稳定的行业数据集和企业项目；二是课程成果与岗位任务直接对应；三是把数据治理、安全合规和业务表达纳入核心训练。对本专业而言，应把标杆经验转化为“数据集、项目库、能力矩阵、评价证据”四类建设成果。')}

        <h2>五、总结与专业建设改进建议</h2>
        <h3>5.1 综合分析结论</h3>
        ${paragraph('大数据工程技术专业建设的重点不是增加更多工具课程，而是围绕数据工程任务链重组课程、项目和评价方式。全国数字经济与数据要素制度建设为专业提供了广阔就业面，但岗位质量取决于学生是否具备从数据源到数据产品的工程交付能力。')}
        <h3>5.2 专业建设与优化建议</h3>
        <h4>5.2.1 课程体系优化建议</h4>
        ${paragraph('建议采用“基础平台能力、数据工程能力、数据治理能力、行业应用能力、综合项目能力”五层结构，形成从数据库到湖仓、从ETL到BI、从治理到安全、从项目到报告的递进链条。')}
        <h4>5.2.2 师资队伍建设建议</h4>
        ${paragraph('教师队伍应从单门课程教学向项目带教升级，重点培养数据仓库、数据治理、行业BI和平台运维方向的骨干教师，并引入企业数据工程师共同建设项目案例。')}
        <h4>5.2.3 实践教学强化建议</h4>
        ${paragraph('实践教学建议建设“行业数据集 + 数据中台 + BI看板 + 治理报告”的综合项目，每学期沉淀一个可展示成果，使学生作品能直接支撑就业和专业展示。')}
        <h4>5.2.4 招生与就业策略建议</h4>
        ${paragraph('招生就业应突出数据开发、湖仓工程、BI分析、数据治理和AI数据工程等岗位群，通过岗位图谱和作品案例提升社会认知。')}
        <h4>5.2.5 特色化发展路径建议</h4>
        ${paragraph('特色方向可聚焦“行业数据治理与BI分析”“智能制造数据工程”“AI训练数据工程”，形成区别于普通数据分析专业的职业本科画像。')}
        <h3>5.3 重点区域产教融合策略</h3>
        ${paragraph('建议以全国数字经济重点区域为资源网络，优先对接长三角、粤港澳、京津冀和成渝的软件服务企业、数字政府项目与智能制造场景，同时结合本地产业需求建设可落地的数据项目库。')}
        ${matrixFigure('图6 岗位任务与核心技能课程映射矩阵', ['岗位群', '工作任务', '核心技能', '课程/项目'], [
          [['数据开发'], ['ETL/批流'], ['SQL/Spark'], ['数据开发实训']],
          [['数据仓库'], ['建模/指标'], ['湖仓/元数据'], ['湖仓项目']],
          [['数据治理'], ['质量/标准'], ['血缘/权限'], ['治理案例']],
          [['BI分析'], ['看板/报告'], ['统计/表达'], ['行业BI项目']],
          [['平台运维'], ['部署/监控'], ['Linux/云'], ['平台运维实训']],
        ])}
        ${sourceHtml()}
        <p class="footer-note">大数据工程技术专业产业调研报告｜专业群产业调研分析平台报告格式生成</p>
      `
    },
  },
  {
    slug: 'software-engineering-technology',
    title: '软件工程技术专业产业调研报告',
    subtitle: `报告周期：2023-2026年 ｜ 分析区域：全国 ｜ 对标专业：软件工程技术专业 ｜ 生成日期：${generatedDate}`,
    chain: {
      nodes: [
        { id: 'osdb', stage: 'upstream', name: '操作系统与数据库', note: '信创/数据库/缓存' },
        { id: 'cloud', stage: 'upstream', name: '云计算与中间件', note: '容器/网关/消息' },
        { id: 'devtool', stage: 'upstream', name: '开发框架与工具链', note: '低代码/AI辅助' },
        { id: 'req', stage: 'midstream', name: '需求设计与编码', note: '原型/API/模块' },
        { id: 'test', stage: 'midstream', name: '测试质量与DevOps', note: '自动化/CI/CD' },
        { id: 'delivery', stage: 'midstream', name: '项目实施与集成', note: '部署/迁移/培训' },
        { id: 'security', stage: 'midstream', name: '安全开发与运维', note: '权限/漏洞/监控' },
        { id: 'govapp', stage: 'downstream', name: '政企应用系统', note: '业务流程/协同' },
        { id: 'industryapp', stage: 'downstream', name: '工业与行业软件', note: '生产/质量/设备' },
        { id: 'saas', stage: 'downstream', name: 'SaaS与移动应用', note: '用户/运营/支付' },
        { id: 'fintech', stage: 'downstream', name: '金融科技与数据服务', note: '风控/交易/报表' },
      ],
      links: [
        { source: 'osdb', target: 'req', value: 20, from: '#6b8dff', to: '#35c6be' },
        { source: 'cloud', target: 'test', value: 24, from: '#73a5ff', to: '#35c6be' },
        { source: 'devtool', target: 'req', value: 18, from: '#73ddd3', to: '#35c6be' },
        { source: 'cloud', target: 'delivery', value: 21, from: '#73a5ff', to: '#63c7f6' },
        { source: 'osdb', target: 'security', value: 15, from: '#6b8dff', to: '#8268ff' },
        { source: 'req', target: 'govapp', value: 22, from: '#35c6be', to: '#ff7048' },
        { source: 'test', target: 'industryapp', value: 18, from: '#35c6be', to: '#ff9c7b' },
        { source: 'delivery', target: 'saas', value: 20, from: '#63c7f6', to: '#ffb16a' },
        { source: 'security', target: 'fintech', value: 16, from: '#8268ff', to: '#ff8f5a' },
        { source: 'req', target: 'saas', value: 18, from: '#35c6be', to: '#ffb16a' },
      ],
    },
    regionData: [
      { label: '北京', value: 94 },
      { label: '长三角', value: 92 },
      { label: '粤港澳', value: 90 },
      { label: '成渝', value: 76 },
      { label: '武汉', value: 70 },
      { label: '西安', value: 68 },
      { label: '济南青岛', value: 61 },
      { label: '大连厦门', value: 58 },
    ],
    jobData: [
      { label: '后端开发工程师', value: 24 },
      { label: '前端/全栈工程师', value: 20 },
      { label: '测试开发工程师', value: 15 },
      { label: 'DevOps/云原生工程师', value: 14 },
      { label: '移动与小程序开发', value: 13 },
      { label: '软件实施与集成', value: 14 },
    ],
    abilityData: [
      { label: '编码实现', value: 92 },
      { label: '数据库/API', value: 86 },
      { label: '测试质量', value: 82 },
      { label: '云端部署', value: 78 },
      { label: '需求协同', value: 76 },
      { label: '安全规范', value: 74 },
    ],
    currentData: [
      { label: '程序设计', value: 86 },
      { label: '数据库', value: 78 },
      { label: 'Web前端', value: 72 },
      { label: '后端接口', value: 68 },
      { label: '测试质量', value: 52 },
      { label: '云端部署', value: 46 },
    ],
    html() {
      return `
        <h1>${esc(this.title)}</h1>
        <p class="report-doc-subtitle">${esc(this.subtitle)}</p>

        <h2>一、专业建设背景与概述</h2>
        <h3>1.1 背景与目的</h3>
        ${paragraph('软件工程技术专业面向软件和信息技术服务业、产业数字化项目和各行业应用系统建设需求，重点培养能够参与需求分析、软件设计、编码实现、测试验证、部署运维、项目协同和持续改进的技术技能人才。当前企业更强调工程规范、协作交付、云原生架构、安全合规和AI辅助开发能力。')}
        ${paragraph('本次调研的直接目的，是为软件工程技术专业的人才培养方案修订、课程体系重构、实训项目配置和校企合作拓展提供依据。报告重点回答软件产业链需要什么样的一线工程人才，毕业生适合进入哪些岗位群，以及培养方案中岗位、工作任务和核心技能应如何同步更新。')}
        ${note('图表中的岗位比例、区域热度、产业链关联强度和能力优先级均来自结构化样本与专业建设研判，适合用于专业论证和课程重构；正式就业质量评价仍需结合本校毕业生去向、企业回访和岗位薪酬数据。')}
        <h3>1.2 专业定位与特色</h3>
        ${paragraph('本专业建议定位为“面向软件系统交付和行业应用实施的一线复合型工程技术人才培养专业”。服务对象包括软件服务企业、政企数字化部门、工业互联网企业、金融科技公司、移动互联网公司、SaaS服务商和信息系统集成企业。')}
        ${paragraph('专业特色应体现在完整软件生命周期训练：从需求分析、原型设计、接口建模、编码开发，到测试验证、部署发布、运行维护和迭代复盘，均应形成可评价成果物。与普通软件技术方向相比，职业本科层次应更突出工程交付、项目协同和部署运维能力。')}
        <h3>1.3 调研内容与方法</h3>
        ${paragraph('本报告围绕全国软件产业重点城市、软件与信息技术服务产业链、典型岗位群、专业建设现状、同类专业竞争态势和建设改进建议展开调研。方法上采用“产业链图谱分析 + 岗位任务拆解 + 软件生命周期能力归纳 + 课程适配研判 + 标杆对比”的组合路径。')}

        <h2>二、专业对应行业与岗位需求分析</h2>
        <h3>2.1 核心就业行业分析</h3>
        <h4>2.1.1 行业分布现状</h4>
        ${paragraph('软件工程技术专业对应的核心就业行业包括软件与信息技术服务、政企应用系统、工业软件、金融科技、移动应用、SaaS平台、数字内容和系统集成服务。全国范围内，北京、长三角、粤港澳大湾区、成渝、武汉、西安等区域形成了不同类型的软件产业集聚。')}
        ${barFigure('图1 全国软件工程岗位与项目机会城市群梯度（结构化指数）', this.regionData, '#2f73ff')}
        <h4>2.1.2 行业发展现状与趋势</h4>
        ${paragraph('软件产业正从单纯项目开发转向平台化、云原生、智能化和持续运营。企业对毕业生的要求从“能写代码”升级为“能在团队中交付可运行、可测试、可部署、可维护的软件模块”。测试质量、DevOps、安全开发、AI辅助开发和行业实施能力正在成为岗位分化的重要方向。')}
        ${chainGraphFigure('图2 软件与信息技术服务产业链图谱', this.chain)}
        <h4>2.1.3 行业人才需求评估</h4>
        ${paragraph('软件企业对应用型工程人才的需求仍然稳定，但低阶编码岗位竞争加剧。具备后端接口、前端组件、数据库设计、自动化测试、云端部署和项目文档能力的毕业生，更容易进入质量较高的岗位。行业应用单位则更加重视需求沟通、系统配置、数据迁移、接口集成和用户培训。')}
        ${table(['企业/场景类型', '需求强度', '高频岗位', '典型能力要求'], [
          ['软件服务与系统集成企业', '高', '后端开发、前端开发、软件实施', '接口开发、数据库、项目协同、交付文档'],
          ['互联网与SaaS平台', '高', '前端/全栈、移动开发、测试开发', '组件化、用户体验、自动化测试、持续迭代'],
          ['工业软件与政企应用', '中高', '行业应用开发、实施集成、DevOps', '业务流程、系统配置、部署运维、数据迁移'],
          ['金融科技与安全敏感场景', '中高', '后端开发、测试开发、安全开发助理', '权限控制、日志审计、接口安全、质量规范'],
        ])}
        <h3>2.2 社会需求分布特征分析</h3>
        <h4>2.2.1 社会需求的单位性质特征</h4>
        ${paragraph('大型软件企业和互联网企业更强调工程规范、性能稳定和团队协作；政企项目单位更强调需求理解、文档规范、交付验收和安全合规；中小型软件公司更重视快速实现、问题排查和客户响应。专业建设应把这些差异拆分为不同类型的实训任务。')}
        <h4>2.2.2 社会需求的公司规模特征</h4>
        ${paragraph('大型企业岗位分工更细，适合后端、前端、测试、运维等方向分层培养；中小企业要求毕业生具备较强的全栈和实施能力。课程体系既要支撑核心开发岗位，也要覆盖测试、部署、实施和运维等工程闭环能力。')}
        <h3>2.3 目标就业岗位分析</h3>
        <h4>2.3.1 核心岗位群识别</h4>
        ${paragraph('建议将毕业后的目标岗位群明确为后端开发工程师、前端/全栈工程师、测试开发工程师、DevOps/云原生工程师、移动与小程序开发工程师、软件实施与集成工程师、低代码配置工程师、软件运维工程师和安全开发助理等方向。')}
        ${barFigure('图3 软件工程技术专业目标岗位群结构建议', this.jobData, '#20a8b8')}
        <h4>2.3.2 岗位需求特征分析</h4>
        ${table(['目标岗位', '毕业后主要工作任务', '核心技能', '人才培养方案建议'], [
          ['后端开发工程师', '接口设计、业务逻辑、数据库访问、权限控制、性能优化', 'Java/Python/Go、Spring/FastAPI、SQL、缓存、RESTful API', '设为核心岗位，强化企业级后端项目'],
          ['前端/全栈工程师', '页面开发、状态管理、接口联调、组件封装、体验优化', 'HTML/CSS/JavaScript/TypeScript、Vue/React、工程化构建', '从页面制作升级为组件化和前后端协同'],
          ['测试开发工程师', '测试用例、自动化测试、缺陷跟踪、接口测试、质量报告', '测试理论、自动化框架、接口测试、CI集成', '独立设置软件测试与质量工程模块'],
          ['DevOps/云原生工程师', '流水线、容器部署、监控告警、发布回滚、环境管理', 'Git、CI/CD、Docker、Linux、云平台、日志监控', '把部署运维纳入综合项目'],
          ['移动与小程序开发', '移动页面、接口联调、设备适配、发布审核、反馈修复', '小程序、跨端开发、接口安全、性能优化', '与地方互联网和政务服务场景衔接'],
          ['软件实施与集成工程师', '需求梳理、系统配置、数据迁移、接口集成、培训运维', '沟通、SQL、接口联调、文档写作、问题排查', '强化行业场景和交付文档能力'],
        ])}
        <h4>2.3.3 岗位需求趋势预测</h4>
        ${paragraph('未来三年，企业级后端、测试开发、DevOps、云原生部署、软件实施和AI辅助开发方向会持续增强。单纯前端页面或单语言编码岗位会继续存在，但岗位竞争更激烈，学生必须具备工程闭环和项目协作能力。')}
        <h3>2.4 人才能力需求分析</h3>
        <h4>2.4.1 素质能力要求</h4>
        ${paragraph('素质能力应突出需求沟通、团队协作、质量意识、文档规范、责任意识和持续学习能力。软件项目高度依赖团队协作和迭代反馈，学生需要通过项目例会、代码评审、缺陷复盘和发布总结形成职业素养。')}
        <h4>2.4.2 技术能力要求</h4>
        ${paragraph('技术能力应覆盖程序设计、数据库、Web前端、后端接口、自动化测试、容器部署、版本管理、安全编码和项目协同。课程评价应从“功能做出来”升级为“功能可测试、可部署、可维护”。')}
        <h4>2.4.3 工具能力要求</h4>
        ${paragraph('工具能力应覆盖Git、IDE、接口测试工具、数据库工具、容器工具、CI/CD平台、日志监控和AI辅助开发工具。工具教学要服务软件生命周期，而不是碎片化演示。')}
        ${barFigure('图4 软件工程技术专业核心技能建设优先级', this.abilityData, '#8268ff')}

        <h2>三、本专业建设现状分析</h2>
        <h3>3.1 专业基本情况</h3>
        <h4>3.1.1 专业概况</h4>
        ${paragraph('软件工程技术专业具备与大数据、人工智能、云计算、信息安全等专业协同建设的基础。其专业群价值在于为各类数字化项目提供软件系统开发和交付能力，是专业群内部承接行业应用场景的重要支撑专业。')}
        <h4>3.1.2 培养方案与课程体系</h4>
        ${paragraph('现有课程通常已覆盖程序设计、数据库、Web前端、后端开发等基础模块，但在软件测试、质量工程、云端部署、DevOps、安全开发和行业综合项目方面容易薄弱。建议用软件生命周期重新审视课程支撑关系。')}
        ${barFigure('图5 现有课程能力支撑度诊断（结构化研判）', this.currentData, '#27a46b')}
        <h3>3.2 人才培养成效</h3>
        <h4>3.2.1 就业质量</h4>
        ${paragraph('毕业生若只具备单语言编码能力，容易进入低阶开发或维护岗位；若具备接口设计、测试质量、部署运维和交付文档能力，则更容易进入后端开发、测试开发、DevOps和实施集成等质量更高的岗位。')}
        <h4>3.2.2 培养质量</h4>
        ${paragraph('培养质量建议通过软件工程成果链评价，包括需求说明、原型图、接口文档、代码仓库、测试报告、部署脚本、运维日志和迭代复盘。这些成果比单次作业更能体现学生工程能力。')}
        <h3>3.3 招生与生源分析</h3>
        ${paragraph('招生宣传应避免只强调“学编程”，而应展示软件工程技术专业毕业后的具体岗位、项目作品和成长路径。通过企业业务系统、移动应用、测试平台和云端部署案例，可以提升专业辨识度。')}

        <h2>四、专业竞争力与差异化分析</h2>
        <h3>4.1 同类专业布点情况</h3>
        ${paragraph('全国软件类专业布点较多，竞争充分。职业本科软件工程技术专业应避免与普通本科软件工程专业同质化，而要突出“系统交付、项目实施、测试质量和云端部署”的应用型工程特色。')}
        <h3>4.2 竞争优势与劣势（SWOT）</h3>
        ${table(['类别', '判断', '建设含义'], [
          ['优势', '专业群可与大数据、AI、云计算、安全方向协同', '适合建设跨专业软件应用综合项目'],
          ['劣势', '企业级项目、测试平台和部署环境不足', '需要建设真实开发流程和云端实训环境'],
          ['机会', '政企数字化、工业软件、SaaS和AI辅助开发持续增长', '可形成软件交付与行业应用特色'],
          ['风险', '低阶编码岗位竞争强，工具更新快', '必须提升测试、部署、实施和安全能力'],
        ])}
        <h3>4.3 标杆专业分析</h3>
        ${paragraph('标杆专业通常具有真实项目驱动、代码仓库规范、测试与部署闭环、企业导师参与和作品集沉淀等特征。对本专业而言，应把标杆经验转化为项目库、代码规范、自动化测试、云端部署和企业评价五类建设成果。')}

        <h2>五、总结与专业建设改进建议</h2>
        <h3>5.1 综合分析结论</h3>
        ${paragraph('软件工程技术专业建设的关键，是把“会开发”升级为“能交付”。全国软件产业仍然需要大量应用型工程人才，但岗位要求正在从语言技能转向工程体系能力。')}
        <h3>5.2 专业建设与优化建议</h3>
        <h4>5.2.1 课程体系优化建议</h4>
        ${paragraph('建议采用“计算机基础、程序设计与数据库、Web与移动开发、软件工程与质量、云原生部署、行业综合项目”六层结构，围绕软件生命周期组织课程。')}
        <h4>5.2.2 师资队伍建设建议</h4>
        ${paragraph('教师队伍应从单门语言教学向项目带教升级，重点培养企业级后端、前端工程化、测试质量、云原生部署和软件实施方向的骨干教师。')}
        <h4>5.2.3 实践教学强化建议</h4>
        ${paragraph('实践教学建议建设“需求原型 + 前后端系统 + 自动化测试 + 云端部署 + 运维复盘”的综合项目，毕业设计要求提交代码仓库、部署地址、测试报告和说明文档。')}
        <h4>5.2.4 招生与就业策略建议</h4>
        ${paragraph('招生就业应突出后端开发、前端/全栈、测试开发、DevOps、移动开发和软件实施等岗位群，通过岗位图谱和项目作品集提升社会认知。')}
        <h4>5.2.5 特色化发展路径建议</h4>
        ${paragraph('特色方向可聚焦“企业级应用开发与交付”“软件测试与质量工程”“云原生部署与运维”，形成区别于普通软件技术专业的职业本科画像。')}
        <h3>5.3 重点区域产教融合策略</h3>
        ${paragraph('建议以全国软件产业重点城市为资源网络，优先对接北京、长三角、粤港澳、成渝、武汉、西安等区域的软件服务企业、政企项目和行业应用场景，同时结合本地产业需求建设可落地的软件项目库。')}
        ${matrixFigure('图6 软件生命周期任务与课程成果映射矩阵', ['岗位群', '工作任务', '核心技能', '课程/项目'], [
          [['后端开发'], ['接口/业务'], ['Java/API'], ['企业后端项目']],
          [['前端全栈'], ['页面/联调'], ['Vue/TS'], ['前后端项目']],
          [['测试开发'], ['用例/自动化'], ['接口测试/CI'], ['质量工程']],
          [['DevOps'], ['部署/监控'], ['Docker/云'], ['云端部署']],
          [['软件实施'], ['配置/迁移'], ['SQL/文档'], ['行业实施项目']],
        ])}
        ${sourceHtml()}
        <p class="footer-note">软件工程技术专业产业调研报告｜专业群产业调研分析平台报告格式生成</p>
      `
    },
  },
]

const buildHtml = (report) => `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(report.title)}</title>
    <style>${css}</style>
  </head>
  <body>
    <article class="report-preview-doc report-export-doc">${report.html()}</article>
  </body>
</html>`

const results = []

for (const report of reports) {
  const htmlPath = path.join(outDir, `${report.slug}.html`)
  const pdfPath = path.join(outDir, `${report.slug}.pdf`)
  const previewPath = path.join(outDir, `${report.slug}-preview.png`)
  fs.writeFileSync(htmlPath, buildHtml(report), 'utf8')

  let pdfStatus = 'skipped'
  let previewStatus = 'skipped'
  if (fs.existsSync(chromePath)) {
    const pdfResult = spawnSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ], { encoding: 'utf8' })
    pdfStatus = pdfResult.status === 0 && fs.existsSync(pdfPath)
      ? `ok:${fs.statSync(pdfPath).size}`
      : `error:${pdfResult.status}:signal=${pdfResult.signal ?? ''}:err=${pdfResult.error?.message ?? ''}:stderr=${pdfResult.stderr || ''}:stdout=${pdfResult.stdout || ''}`

    const previewResult = spawnSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--window-size=1120,3600',
      `--screenshot=${previewPath}`,
      `file://${htmlPath}`,
    ], { encoding: 'utf8' })
    previewStatus = previewResult.status === 0 && fs.existsSync(previewPath)
      ? `ok:${fs.statSync(previewPath).size}`
      : `error:${previewResult.status}:signal=${previewResult.signal ?? ''}:err=${previewResult.error?.message ?? ''}:stderr=${previewResult.stderr || ''}:stdout=${previewResult.stdout || ''}`
  }
  results.push({ title: report.title, htmlPath, pdfPath, pdfStatus, previewPath, previewStatus })
}

console.log(JSON.stringify(results, null, 2))

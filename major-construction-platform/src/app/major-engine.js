export const DEFAULT_MAJOR_ENGINE_SECTION = 'knowledge'

export const MAJOR_ENGINE_SECTIONS = [
  { key: 'knowledge', label: '知识库' },
  { key: 'major-graph', label: '专业图谱' },
  { key: 'knowledge-domain-graph', label: '知识领域图谱' },
  { key: 'course-group-graph', label: '课程群图谱' },
  { key: 'ability-dimension-graph', label: '能力维度图谱' },
  { key: 'quality-goal-graph', label: '素质目标图谱' },
  { key: 'custom-graph', label: '自定义图谱' },
]

export const MAJOR_ENGINE_KNOWLEDGE_STATS = [
  { key: 'files', icon: 'document', label: '文件数', value: '0', unit: '个' },
  { key: 'media', icon: 'media', label: '音视频时长', value: '0', unit: '小时' },
  { key: 'characters', icon: 'characters', label: '解析字符', value: '0', unit: '字符' },
  {
    key: 'slices',
    icon: 'slices',
    label: '知识切片',
    value: '0',
    unit: '个',
    detail: '含公式 0 个、图片 0 个、表格 0 个',
  },
]

export const MAJOR_ENGINE_KNOWLEDGE_ROWS = [
  { key: 'training-plan', name: '培养方案', icon: 'book', tone: 'magenta', processed: 0, uploaded: 0 },
  { key: 'major-certification', name: '专业认证', icon: 'certificate', tone: 'purple', processed: 0, uploaded: 0 },
  { key: 'policy-document', name: '政策文件', icon: 'document', tone: 'violet', processed: 0, uploaded: 0 },
  { key: 'industry-report', name: '行业报告', icon: 'report', tone: 'blue', processed: 0, uploaded: 0 },
]

const majorEngineSectionKeys = new Set(MAJOR_ENGINE_SECTIONS.map((item) => item.key))

export const resolveMajorEngineSection = (key) =>
  majorEngineSectionKeys.has(key) ? key : DEFAULT_MAJOR_ENGINE_SECTION

export const getMajorEngineContentMode = (key) =>
  resolveMajorEngineSection(key) === DEFAULT_MAJOR_ENGINE_SECTION ? 'knowledge' : 'placeholder'

export const createMajorEngineUploadFeedback = (resourceName = '专业资料') =>
  `已打开${resourceName}上传演示，本次不会读取或保存真实文件`

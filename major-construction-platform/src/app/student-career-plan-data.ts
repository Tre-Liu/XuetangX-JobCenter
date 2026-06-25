export type StudentPlanRequirement = {
  code: string
  title: string
  children: string[]
}

export type StudentPlanCourse = {
  code: string
  name: string
  credits: string
  type: string
  target: string
  prerequisite: string
  agent: string
}

export type StudentPlanSemester = {
  name: string
  courses: StudentPlanCourse[]
}

export type StudentPlanJob = {
  name: string
  meta: string
  skills: string
}

export const studentCareerPlanData = {
  title: '智能建造工程（学生端培养方案）',
  subtitle: '学生端培养方案',
  cohort: '2026级',
  schoolMark: 'AI',
  courseYear: '2026学年',
  tabs: ['培养目标', '毕业要求', '课程体系'] as const,
  overview:
    '坚持扎根辽西、服务辽宁、对接产业、面向一线的服务面向定位，主动融入辽宁现代化产业体系，培养掌握较为系统的智能建造工程基础理论知识和技术技能，能够从事装配式建筑设计与生产、智能建造技术与装备应用、智慧工地与数字化运维等工作的高端技能人才。',
  goals: [
    '能够践行社会主义核心价值观，传承与创新技能文明，德智体美劳全面发展，具有坚定的理想信念和深厚的家国情怀。',
    '具备良好的人文底蕴、科学精神与数字思维，能够适应建筑行业数字化、智能化转型发展需求。',
    '具备爱岗敬业的职业精神、精益求精的工匠精神和诚实守信的职业道德，恪守工程伦理与行业规范。',
    '系统掌握装配式建筑设计与生产、智能建造技术与装备、智慧工地与数字化运维等岗位群所需知识和技能。',
    '具备智能建造施工工艺优化、建筑机器人应用方案设计、BIM深化设计等技术研发与改造能力。',
    '能够胜任装配式深化设计、智能建造施工、智慧工地管理等复合岗位，具备跨专业协同和团队协作能力。'
  ],
  graduationOverview:
    '本专业毕业要求围绕素质、知识、能力三类要求展开，强调价值塑造、工程基础、BIM与智能装备应用、智慧工地管理、智能检测监测、绿色安全施工、跨专业协作和终身学习能力的系统达成。',
  requirements: [
    {
      code: 'R1',
      title: '价值塑造与职业素养',
      children: [
        '坚定拥护中国共产党领导和中国特色社会主义制度，践行社会主义核心价值观。',
        '具有良好的职业道德、职业素养和职业荣誉感，诚实守信、爱岗敬业。'
      ]
    },
    {
      code: 'R2',
      title: '工程法规与绿色安全素养',
      children: [
        '掌握与本专业对应职业活动相关的国家法律、行业规定和绿色生产要求。',
        '具备质量意识、环保意识、安全意识和创新思维。'
      ]
    },
    {
      code: 'R3',
      title: '工程基础与智能建造专业知识',
      children: [
        '掌握数学、物理、信息技术、人工智能基础等文化基础知识。',
        '掌握建筑制图与CAD、建筑构造与识图、建筑材料、建筑力学、建筑结构等专业基础知识。'
      ]
    },
    {
      code: 'R4',
      title: '复杂工程问题与数字工具应用',
      children: [
        '能够识别、分析并解决智能建造工程中的复杂技术问题。',
        '能够熟练使用BIM软件、智能检测设备、智慧管理平台等数字化工具。'
      ]
    },
    {
      code: 'R5',
      title: '智慧工地管理、智能检测与创新发展',
      children: [
        '能够应用智慧工地平台进行进度、质量、安全、成本综合管控。',
        '能够选择智能化检测设备，对采集数据进行分析与判断并提出解决办法。'
      ]
    }
  ] satisfies StudentPlanRequirement[],
  semesters: [
    {
      name: '第1学期',
      courses: [
        { code: 'B260002', name: '中国近现代史纲要', credits: '3', type: '公共必修', target: '课程目标2', prerequisite: '基础先修', agent: '' },
        { code: 'B260008', name: '大学生心理健康教育', credits: '2', type: '公共必修', target: '课程目标2', prerequisite: '基础先修', agent: '' },
        { code: 'B260009', name: '高等数学A-1', credits: '3', type: '公共必修', target: '课程目标2', prerequisite: '基础先修', agent: '' },
        { code: 'B260017', name: '大学英语1/小语种外语1', credits: '4', type: '公共必修', target: '课程目标2', prerequisite: '基础先修', agent: '' }
      ]
    },
    {
      name: '第2学期',
      courses: [
        { code: 'B260001', name: '思想道德与法治', credits: '3', type: '公共必修', target: '课程目标2', prerequisite: '基础先修', agent: '' },
        { code: 'B260010', name: '高等数学A-2', credits: '4', type: '公共必修', target: '课程目标2', prerequisite: '高等数学A-1', agent: '' },
        { code: 'B260013', name: '线性代数', credits: '2', type: '公共必修', target: '课程目标2', prerequisite: '高等数学A-1', agent: '' },
        { code: 'B261301', name: '建筑力学', credits: '3', type: '专业基础必修', target: '课程目标3', prerequisite: '高等数学A-1', agent: '' }
      ]
    },
    {
      name: '第3学期',
      courses: [
        { code: 'B261302', name: '建筑制图与CAD', credits: '2', type: '专业基础必修', target: '课程目标3', prerequisite: '工程基础课程', agent: '' },
        { code: 'B261303', name: '建筑构造与识图', credits: '2', type: '专业基础必修', target: '课程目标3', prerequisite: '建筑制图与CAD', agent: '' },
        { code: 'B261304', name: '建筑材料', credits: '2', type: '专业基础必修', target: '课程目标3', prerequisite: '工程基础课程', agent: '' },
        { code: 'B261306', name: '建筑信息模型基础', credits: '2', type: '专业基础必修', target: '课程目标3', prerequisite: '建筑制图与CAD', agent: '建筑信息模型基础-智能体' }
      ]
    }
  ] satisfies StudentPlanSemester[],
  jobs: [
    { name: 'BIM建模工程师', meta: 'BIM协同设计与算量平台 / 初级', skills: '建筑工程识图 / BIM模型应用 / 协同交付' },
    { name: 'BIM深化设计工程师', meta: 'BIM协同设计与算量平台 / 中级', skills: '深化设计 / 碰撞检查 / 工程量提取' },
    { name: '智慧工地管理工程师', meta: '智慧工地平台产业 / 中级', skills: '平台部署 / 数据看板 / 现场协同' },
    { name: '智能检测数据分析师', meta: '质量检测与监测产业 / 初级', skills: '检测设备 / 数据分析 / 质量判断' },
    { name: '装配式建筑深化设计师', meta: '装配式构件生产与数字工厂 / 中级', skills: '构件深化 / 生产排程 / 质量验收' }
  ] satisfies StudentPlanJob[],
  prompts: ['查课程目标', '查毕业要求', '查教学大纲', '查先后续关系'] as const
}

export type CareerCommandId = 'goals' | 'requirements' | 'outline' | 'relations' | 'abilities' | 'plan'

export const careerCommands: { id: CareerCommandId; label: string; question: string }[] = [
  { id: 'goals', label: '课程目标', question: '高等数学的课程目标是什么？' },
  { id: 'requirements', label: '毕业支撑', question: '高等数学支撑哪些毕业要求？' },
  { id: 'outline', label: '教学大纲', question: '查看高等数学的教学大纲与学时安排' },
  { id: 'relations', label: '先后修', question: '高等数学有哪些先修基础与后续课程？' },
  { id: 'abilities', label: '专业能力', question: '高等数学对应哪些专业能力和岗位需求？' },
  { id: 'plan', label: '培养方案', question: '高等数学在培养方案中的位置是什么？' }
]

export const learningCourse: {
  name: string
  planCourseName: string
  code: string
  major: string
  className: string
  term: string
  teacher: string
  credits: number
  hours: number
  goals: { id: string; title: string; description: string; requirementCodes: string[] }[]
  outline: { title: string; hours: number; topics: string[] }[]
  prerequisites: { name: string; description: string }[]
  followUps: { name: string; description: string }[]
} = {
  name: '高等数学',
  planCourseName: '高等数学A-1',
  code: 'B260009',
  major: '智能建造工程',
  className: '2026级智能建造01班',
  term: '2026—2027学年 第一学期',
  teacher: '课程教学团队',
  credits: 3,
  hours: 48,
  goals: [
    {
      id: 'G1',
      title: '理解函数、极限与连续的基本概念',
      description: '能识别函数的定义域与变化规律，正确计算常见极限，判断连续性，并用规范的数学语言说明计算条件。',
      requirementCodes: ['R3']
    },
    {
      id: 'G2',
      title: '掌握一元函数微积分的基础计算方法',
      description: '能运用求导法则、微分与初步积分方法完成基础计算，解释导数的几何意义与变化率意义，检查结果的单位和适用范围。',
      requirementCodes: ['R3', 'R4']
    },
    {
      id: 'G3',
      title: '用数学方法分析简单工程量与变化趋势',
      description: '能将尺寸、位移或进度等简单情境表达为函数，利用变化率、单调性和极值进行分析，并说明模型假设与结论边界，为后续专业课程的数据判断奠定基础。',
      requirementCodes: ['R4', 'R5']
    }
  ],
  outline: [
    { title: '函数与极限', hours: 10, topics: ['函数及其表示', '数列与函数的极限', '无穷小与无穷大', '极限运算法则'] },
    { title: '函数的连续性', hours: 6, topics: ['连续与间断点', '闭区间连续函数性质', '两个重要极限与计算条件'] },
    { title: '导数与求导法则', hours: 10, topics: ['导数的定义与意义', '基本初等函数求导', '复合函数与隐函数求导', '高阶导数'] },
    { title: '微分与近似计算', hours: 4, topics: ['微分的定义', '导数与微分的联系', '近似计算与误差解释'] },
    { title: '中值定理与导数应用', hours: 10, topics: ['中值定理', '洛必达法则及使用条件', '单调性与极值', '最值问题与曲线变化趋势'] },
    { title: '积分初步', hours: 8, topics: ['原函数与不定积分', '基本积分公式', '定积分的概念', '简单几何量的累积解释'] }
  ],
  prerequisites: [
    { name: '高中代数与函数基础', description: '复习方程、不等式、指数与对数运算，能够求常见函数的定义域并阅读函数图像。' },
    { name: '高中三角与解析几何基础', description: '复习三角函数、弧度制和直线斜率，为重要极限与导数的几何意义做好衔接。' }
  ],
  followUps: [
    { name: '高等数学A-2', description: '第2学期继续学习微积分方法，承接本课程的极限、导数与积分基础。' },
    { name: '线性代数', description: '第2学期学习矩阵与线性方程组；本课程提供符号运算、逻辑表达和问题抽象的基础。' },
    { name: '建筑力学', description: '第2学期结合受力、变形等问题使用函数与变化率；力学模型及工程判据在专业课程中学习。' }
  ]
}

export type LearningUnit = {
  id: string
  title: string
  type: '视频' | '图文' | '练习'
  duration: string
  completed: boolean
  description: string
  formula: string
  guide: { time: string; title: string; description: string }[]
  transcript: string[]
}

// Teaching content and local graph animations are authored for this course configuration; they are not classroom recordings.
export const learningChapters: { id: string; title: string; units: LearningUnit[] }[] = [
  {
    id: 'functions-limits',
    title: '第一章 函数、极限与连续',
    units: [
      {
        id: 'function-domain',
        title: '函数的表示与定义域',
        type: '图文',
        duration: '阅读 12 分钟',
        completed: true,
        description: '从变量之间的依赖关系出发，练习解析式、图像与表格三种函数表示，并确定表达式成立的范围。',
        formula: 'f(x) = √(x − 1)，定义域为 [1, +∞)',
        guide: [
          { time: '01', title: '识别自变量与因变量', description: '先说明量的含义与单位，再判断函数关系能否成立。' },
          { time: '02', title: '确定定义域', description: '逐项检查分母、根式和对数的限制，取条件的交集。' },
          { time: '03', title: '解释情境约束', description: '工程时间、长度等量还需要满足实际取值范围。' }
        ],
        transcript: [
          '函数描述一个量随另一个量变化的确定关系。给出函数时，需要同时说明对应法则与定义域。',
          '对于 f(x)=√(x−1)，根号内必须非负，因此 x≥1。若 x 表示某段观测时间，还要结合观测区间进一步限制范围。',
          '读图时先看坐标轴与单位，再辨认增长、下降和可能的拐折；图像上的趋势不能替代对表达式成立条件的检查。'
        ]
      },
      {
        id: 'limit-introduction',
        title: '极限的直观认识与计算',
        type: '视频',
        duration: '00:36',
        completed: true,
        description: '通过逐步接近的数值与图像理解极限，分清函数值与极限值。',
        formula: 'lim(x→1) (x² − 1)/(x − 1) = 2',
        guide: [
          { time: '00:00', title: '观察接近过程', description: '分别从左右两侧取值，记录函数值的变化趋势。' },
          { time: '00:10', title: '化简后计算', description: '在 x≠1 的条件下约去公因式，再考察趋近于 1 的结果。' },
          { time: '00:22', title: '区分极限与函数值', description: '极限研究邻域内的趋势，不要求该点有定义。' }
        ],
        transcript: [
          '当 x 越来越接近某一点时，函数值是否逐步接近一个确定的数，这是极限所研究的问题。左右两侧趋近的结果一致时，才有对应的双侧极限。',
          '对 (x²−1)/(x−1)，当 x≠1 时可因式分解并化为 x+1。因此 x 趋近于 1 时，函数值趋近于 2。',
          '原式在 x=1 处没有定义，这并不妨碍极限存在。计算时应保留化简的条件，避免把可去间断点误判为没有极限。'
        ]
      },
      {
        id: 'continuity-practice',
        title: '连续性与分段函数判断',
        type: '练习',
        duration: '练习 10 分钟',
        completed: true,
        description: '围绕函数值、左极限与右极限完成连续性判断，写出理由并核查分段连接点。',
        formula: '连续条件：lim(x→x₀) f(x) = f(x₀)',
        guide: [
          { time: '任务 1', title: '求连接点函数值', description: '按分段定义确定该点由哪一段表达式取值。' },
          { time: '任务 2', title: '比较左右极限', description: '分别计算两侧极限，确认是否相等。' },
          { time: '任务 3', title: '给出判断依据', description: '用三者相等说明连续，或指出不成立的条件。' }
        ],
        transcript: [
          '在点 x₀ 连续，需要函数在该点有定义、极限存在，并且极限等于函数值。三个条件缺一不可。',
          '设 x<1 时 f(x)=2x，x≥1 时 f(x)=x+1。连接点的左极限、右极限和函数值都为 2，因此函数在 x=1 处连续。',
          '提交计算时，应展示两侧趋近过程和该点取值；只写连续或不连续，不能体现判断依据。'
        ]
      }
    ]
  },
  {
    id: 'derivatives-differentials',
    title: '第二章 导数与微分',
    units: [
      {
        id: 'derivative-meaning',
        title: '导数的概念与几何意义',
        type: '视频',
        duration: '00:36',
        completed: true,
        description: '从平均变化率过渡到瞬时变化率，把割线斜率、切线斜率和导数定义联系起来。',
        formula: 'f′(x₀) = lim(Δx→0) [f(x₀ + Δx) − f(x₀)] / Δx',
        guide: [
          { time: '00:00', title: '平均变化率', description: '用两个时刻的位移差与时间差构造比值，保留单位。' },
          { time: '00:09', title: '从割线到切线', description: '观察区间缩小时割线斜率的变化，理解极限的作用。' },
          { time: '00:19', title: '导数与工程解释', description: '对 s(t)=t² 求导，解释给定时刻的变化速度。' },
          { time: '00:29', title: '可导条件', description: '区分连续与可导，检查尖点处的两侧变化率。' }
        ],
        transcript: [
          '平均变化率是函数增量与自变量增量的比值。对于位移函数 s(t)，它表示某一时间区间内的平均速度。',
          '当时间间隔趋近于零，如果这个比值趋近于确定的数，就得到该时刻的导数。几何上，割线趋于切线，导数对应切线斜率。',
          '若 s(t)=t²，按定义可得 [s(t+Δt)−s(t)]/Δt=2t+Δt，因此 s′(t)=2t。若 t 的单位为秒、s 的单位为米，导数的单位为米每秒。',
          '可导一定连续，连续却不一定可导。例如绝对值函数在零点连续，但左右导数不同，不能给出唯一的切线斜率。'
        ]
      },
      {
        id: 'derivative-rules',
        title: '求导法则与复合函数',
        type: '图文',
        duration: '阅读 16 分钟',
        completed: false,
        description: '整理和、积、商的求导法则，练习识别复合层次并逐层应用链式法则。',
        formula: '[f(g(x))]′ = f′(g(x)) · g′(x)',
        guide: [
          { time: '01', title: '识别函数结构', description: '先判断是和、积、商还是复合函数，避免套错法则。' },
          { time: '02', title: '逐层求导', description: '从外层到内层保留中间变量及其导数。' },
          { time: '03', title: '回查定义域', description: '化简结果后检查分母及根式的限制条件。' }
        ],
        transcript: [
          '求导前先看表达式结构。乘积的导数为 u′v+uv′，不能把两项分别求导后相乘。',
          '对 y=(3x²+1)⁴，外层为四次幂，内层为 3x²+1。链式法则给出 y′=4(3x²+1)³·6x=24x(3x²+1)³。',
          '求导结果仍受原函数定义域约束。规范书写中间步骤，有助于发现漏乘内层导数等常见问题。'
        ]
      },
      {
        id: 'differential-approximation',
        title: '微分与长度变化的近似计算',
        type: '练习',
        duration: '练习 15 分钟',
        completed: false,
        description: '用微分估计小幅尺寸变化引起的面积变化，比较近似结果与精确增量，说明误差来源。',
        formula: 'A = a²，dA = 2a · da，ΔA = 2aΔa + (Δa)²',
        guide: [
          { time: '任务 1', title: '建立量之间的关系', description: '以正方形面积为背景，写出面积与边长的函数及单位。' },
          { time: '任务 2', title: '计算微分', description: '取 a=2 m、da=0.01 m，计算 dA=0.04 m²。' },
          { time: '任务 3', title: '检查近似误差', description: '与精确增量 0.0401 m² 比较，说明省略的二阶项。' }
        ],
        transcript: [
          '微分 dy=f′(x)dx 是函数增量的线性近似。使用时需要自变量变化足够小，并关注近似误差。',
          '正方形边长由 2 m 增加到 2.01 m，微分估计面积增加 2×2×0.01=0.04 m²。精确面积增量为 2.01²−2²=0.0401 m²。',
          '两者相差 0.0001 m²，来自被忽略的 (Δa)²。此处只说明数学近似方法；工程验收还需要遵守专业规范与允许偏差要求。'
        ]
      }
    ]
  },
  {
    id: 'derivative-applications',
    title: '第三章 导数应用与工程量分析',
    units: [
      {
        id: 'monotonicity-extrema',
        title: '单调性、极值与最值',
        type: '视频',
        duration: '00:36',
        completed: false,
        description: '利用导数符号判断增减，结合区间端点与驻点寻找最值。',
        formula: 'f′(x)>0：递增；f′(x)<0：递减；最值需比较驻点与端点',
        guide: [
          { time: '00:00', title: '列出分析区间', description: '先确定定义域，再标出驻点和不可导点。' },
          { time: '00:10', title: '画导数符号表', description: '逐段判断导数正负，检查符号是否发生变化。' },
          { time: '00:22', title: '比较候选点', description: '闭区间上把符合条件的内部点与端点函数值一同比较。' }
        ],
        transcript: [
          '导数的符号反映函数的局部变化方向。在区间内导数恒正，函数递增；导数恒负，函数递减。',
          '导数为零的点称为驻点，驻点不一定是极值点。还需要比较其左右两侧导数符号，或使用满足条件的其他判别方法。',
          '闭区间最值问题还必须检查端点。比如 f(x)=x²−4x+5 在 [0,3] 上的驻点为 x=2，比较 f(0)=5、f(2)=1、f(3)=2，得到最小值 1、最大值 5。'
        ]
      },
      {
        id: 'engineering-model',
        title: '简单工程问题的函数建模',
        type: '图文',
        duration: '阅读 14 分钟',
        completed: false,
        description: '通过固定周长下的面积问题，练习提出假设、建立函数、求解与解释适用范围。',
        formula: '2x + 2y = 20，A(x) = x(10 − x)，0 < x < 10',
        guide: [
          { time: '01', title: '列出已知与假设', description: '假设围合区域为矩形，总边长 20 m，不计连接件与材料损耗。' },
          { time: '02', title: '消去一个变量', description: '用周长约束写出 y=10−x，再构造面积函数。' },
          { time: '03', title: '解释数学结论', description: '计算最优尺寸，补充说明现场边界与其他工程约束。' }
        ],
        transcript: [
          '建模首先明确已知条件、待求量和假设。固定周长的矩形面积问题，可以把长与宽用一个变量表示。',
          '设一边为 x m，另一边为 10−x m，则 A(x)=10x−x²。由 A′(x)=10−2x 得驻点 x=5，面积最大为 25 m²。',
          '该结论建立在矩形、周长固定且忽略损耗等假设上。实际布置还受到场地、通行、安全及材料规格约束，需要在后续专业学习中补充。'
        ]
      },
      {
        id: 'monitoring-trend',
        title: '监测量变化率与趋势解释',
        type: '练习',
        duration: '练习 12 分钟',
        completed: false,
        description: '使用给定函数解释监测量的变化速度，区分变化率增大与监测量超限，避免仅凭趋势作安全结论。',
        formula: 's(t) = 0.02t² + 0.1t，s′(t) = 0.04t + 0.1',
        guide: [
          { time: '任务 1', title: '核对变量单位', description: '约定 t 为小时、s 为毫米，计算导数的单位。' },
          { time: '任务 2', title: '解释瞬时变化率', description: '计算 t=2 时的 s′(2)=0.18 mm/h，并说明含义。' },
          { time: '任务 3', title: '限定判断范围', description: '指出安全判定仍需观测质量、允许值与专业规范。' }
        ],
        transcript: [
          '把监测量表示为时间的函数后，导数可以帮助描述单位时间内的变化速度。此处给定函数用于练习变化率解释。',
          '若 s(t)=0.02t²+0.1t，则 s′(t)=0.04t+0.1。t=2 小时时，变化率为 0.18 mm/h，表示该时刻监测量的瞬时增长速度。',
          '变化率增加并不直接等于超限或危险。实际判断需要核对设备与观测误差、设计允许值、监测方案和专业规范，本课程提供计算与趋势分析基础。'
        ]
      }
    ]
  }
]

export const professionalAbilities: {
  id: string
  title: string
  description: string
  goalIds: string[]
  demands: { job: string; task: string; requirement: string }[]
}[] = [
  {
    id: 'quantitative-reasoning',
    title: '工程量化与结果核验',
    description: '把长度、面积、时间等量表达为数学关系，核对单位、定义域与计算结果的合理性。',
    goalIds: ['G1', 'G2'],
    demands: [
      { job: 'BIM建模工程师', task: '复核模型尺寸与工程量的数量关系', requirement: '理解几何量与变量关系，检查结果的量纲；BIM建模操作仍需在专业课程中学习。' },
      { job: 'BIM深化设计工程师', task: '解释构件尺寸变化对简单几何量的影响', requirement: '具备计算与近似估算基础，再结合识图、构件规则和软件操作完成专业任务。' }
    ]
  },
  {
    id: 'engineering-modeling',
    title: '简单工程问题的数学建模',
    description: '识别变量与约束，用函数刻画简单工程情境，使用导数求解并说明假设和适用范围。',
    goalIds: ['G1', 'G2', 'G3'],
    demands: [
      { job: '智慧工地管理工程师', task: '分析给定进度函数中的变化率与阶段趋势', requirement: '能解释函数、变化率和区间约束；平台配置、进度组织和现场管理另需专业训练。' },
      { job: '装配式建筑深化设计师', task: '比较给定尺寸约束下的简单几何方案', requirement: '能建立数量关系并比较计算结果；构件深化与设计合规须结合后续专业课程。' }
    ]
  },
  {
    id: 'data-trend-analysis',
    title: '监测数据趋势的数学解释',
    description: '理解函数值、平均变化率与瞬时变化率的区别，利用导数描述趋势并保留数据和判据的适用边界。',
    goalIds: ['G2', 'G3'],
    demands: [
      { job: '智能检测数据分析师', task: '解释给定监测曲线的变化方向与变化速度', requirement: '具备变化率计算、单位检查和趋势解释基础；设备校准、数据处理和质量判定还需专业学习。' },
      { job: '智慧工地管理工程师', task: '阅读现场数据曲线并定位变化加快的区间', requirement: '能区分变化趋势与管理结论，结合后续课程学习指标口径、预警阈值和现场处置。' }
    ]
  }
]

type CareerReply = { kind: CareerCommandId | 'help'; title: string; paragraphs: string[] }

const graduationRequirementDescriptions: Record<string, string> = {
  R3: '工程基础与智能建造专业知识：建立数学概念、运算方法和规范表达基础。',
  R4: '复杂工程问题与数字工具应用：支撑变量识别、函数建模与计算分析，数字工具的操作能力由相关专业课程继续培养。',
  R5: '智慧工地管理、智能检测与创新发展：为进度和监测数据的变化率、趋势解释提供数学基础。'
}

function replyFor(kind: CareerCommandId): CareerReply {
  switch (kind) {
    case 'goals':
      return {
        kind,
        title: '高等数学的课程目标',
        paragraphs: learningCourse.goals.map((goal) => `${goal.id} ${goal.title}：${goal.description} 支撑 ${goal.requirementCodes.join('、')}。`)
      }
    case 'requirements':
      return {
        kind,
        title: '课程目标与毕业要求的支撑关系',
        paragraphs: [
          ...Object.entries(graduationRequirementDescriptions).map(([code, description]) => `${code} ${description} 对应课程目标：${learningCourse.goals.filter((goal) => goal.requirementCodes.includes(code)).map((goal) => goal.id).join('、')}。`),
          '这些关系描述本课程提供的基础支撑。完成高等数学不等于达成整项毕业要求；R1 职业素养与 R2 法规绿色安全由培养方案中的相应课程与实践共同支撑。'
        ]
      }
    case 'outline':
      return {
        kind,
        title: '高等数学教学大纲',
        paragraphs: [
          `本课程共 ${learningCourse.hours} 学时，${learningCourse.credits} 学分。章节安排如下，具体教学进度以课程发布安排为准。`,
          ...learningCourse.outline.map((chapter, index) => `${index + 1}. ${chapter.title}（${chapter.hours} 学时）：${chapter.topics.join('、')}。`)
        ]
      }
    case 'relations':
      return {
        kind,
        title: '先修基础与后续课程',
        paragraphs: [
          ...learningCourse.prerequisites.map((course) => `先修基础｜${course.name}：${course.description}`),
          ...learningCourse.followUps.map((course) => `后续课程｜${course.name}：${course.description}`),
          '本课程位于第1学期，先修内容用于入学衔接；后续课程按当前培养方案的第2学期课程关系列出。'
        ]
      }
    case 'abilities':
      return {
        kind,
        title: '数学基础如何支撑专业能力与岗位任务',
        paragraphs: [
          ...professionalAbilities.map((ability) => `${ability.title}（${ability.goalIds.join('、')}）：${ability.description} 相关岗位任务：${ability.demands.map((demand) => `${demand.job}—${demand.task}；${demand.requirement}`).join(' ')}`),
          '岗位任务用于说明专业学习的衔接方向，属于基于当前培养方案的能力映射。高等数学提供量化、建模与趋势分析基础；BIM工具、智能检测设备和智慧工地平台的操作还需后续专业课程与实践训练。'
        ]
      }
    case 'plan':
      return {
        kind,
        title: '课程在培养方案中的位置',
        paragraphs: [
          `${learningCourse.major}专业｜${learningCourse.planCourseName}｜课程代码 ${learningCourse.code}｜公共必修｜第1学期｜${learningCourse.credits} 学分｜${learningCourse.hours} 学时。`,
          `${learningCourse.className}当前学习空间对应${learningCourse.term}。培养方案中的课程名称为“${learningCourse.planCourseName}”，学习空间使用“${learningCourse.name}”。`,
          '本课程承接高中数学基础，为第2学期的高等数学A-2、线性代数与建筑力学提供基础，再衔接后续智能建造专业课程。'
        ]
      }
  }
}

export function resolveCareerReply(question: string): CareerReply {
  const normalized = question.trim().replace(/\s+/g, '')
  const matchedCommand = careerCommands.find((command) => command.question.replace(/\s+/g, '') === normalized)
  if (matchedCommand) return replyFor(matchedCommand.id)

  // Only explicit course intents select a prepared answer; unrelated requests stay bounded.
  const outsideCourseScope = /天气|薪资|工资|招聘|预测.*成绩|代写|选课操作|修改成绩/.test(normalized)
  if (!outsideCourseScope) {
    const asksCourseGraduationSupport = /毕业/.test(normalized) && /支撑|支持|对应|贡献/.test(normalized)
    if (asksCourseGraduationSupport) return replyFor('requirements')
    if (/专业介绍|课程体系|专业.*培养目标|专业.*毕业|毕业.*专业/.test(normalized)) return replyFor('plan')
    if (/毕业|毕业支撑/.test(normalized)) return replyFor('requirements')
    if (/大纲|章节|教学内容|课时安排|学时安排/.test(normalized)) return replyFor('outline')
    if (/先修|后修|后续|先后|课程关系|前置|衔接课程/.test(normalized)) return replyFor('relations')
    if (/岗位|能力|就业|专业.*关系|关系.*专业/.test(normalized)) return replyFor('abilities')
    if (/培养方案|学分|第几学期|课程代码|课程编码|课程位置/.test(normalized)) return replyFor('plan')
    if (/目标|学会什么|学到什么/.test(normalized)) return replyFor('goals')
  }

  return {
    kind: 'help',
    title: '当前可查询的课程信息',
    paragraphs: [
      '当前可根据已配置的课程资料查询六类内容：课程目标、毕业要求支撑、教学大纲、先修与后续课程、专业能力与岗位任务、培养方案位置。',
      '请选择快捷指令，或围绕高等数学的上述范围提问。回答依据当前课程配置提供，尚未接入实时问答与外部信息检索。'
    ]
  }
}

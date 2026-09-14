// Turn earlier structured activity drafts into a student-facing explanation.
// Explicit teacher text (including an intentionally empty string) always wins.
export function taskDescription(task, design, stage) {
 if (typeof task.description === 'string') return task.description.replace(/[；;]建议用时\s*\d+(?:\.\d+)?\s*课时[。.]?/g, '').replace(/分工与\d+(?:\.\d+)?课时条件相符/g, '分工与实训条件相符');
 const activity = task.learningActivity;
 if (!activity) return '';
 const phases = {
  '明确任务与获取信息': ['能从任务书和技术资料中提取工作目标、质量要求与约束，识别信息缺口，并说明判断依据。', '阅读任务书，观察工作对象；查阅资料并标注来源；小组整理已知条件与待确认问题，向教师汇报并完善任务分析单。'],
  '制定工作计划': ['能把工作要求分解为可执行的步骤，合理安排分工、资源与检查节点。', '依据任务分析结果拆分工作步骤；讨论人员分工、工具和时间安排；设置关键检查点，检查计划是否具备实施条件。'],
  '方案决策': ['能比较备选方案，从可行性、质量和实施条件出发说明取舍，形成有依据的决策。', '提出并比较备选方案；核对工具、资源与实施条件；小组陈述方案依据，听取同伴质询和教师反馈后修订。'],
  '实施与过程记录': ['能按方案规范完成操作，如实记录过程，并依据现象分析问题、调整方法。', '检查准备条件并确认分工；按已确认方案实施，记录关键操作与结果；遇到偏差先分析原因，再在教师指导下调整并验证。'],
  '检查与质量控制': ['能依据质量要求选择检查方法，用证据判断成果是否达标，并完成问题整改与复测。', '对照任务书逐项检查成果；记录检查结果与不符合项；分析原因并改进，复测后整理可追溯的验证证据。'],
  '评价反馈与迁移': ['能清晰交接成果，基于证据评价工作过程，并将所学方法用于变化后的任务条件。', '展示成果并说明关键决策；开展自评与同伴互评，结合教师反馈总结改进点；尝试迁移挑战，比较新旧条件并说明调整依据。'],
 };
 const phase = phases[stage?.title];
 // Replace only the old default wording; retain a teacher's custom criteria.
 const legacyCriteria = design ? {
  '明确任务与获取信息': [`说明“${design.problem}”的目标、约束和信息依据`, '工作目标与约束提取准确，关键判断注明资料来源，待确认问题清楚；能解释这些条件对后续操作的影响'],
  '制定工作计划': [`步骤覆盖“${design.content}”，分工与${design.hours}课时条件相符`, '计划覆盖主要工作环节，分工明确，资源与时间安排可行，关键检查点有对应负责人'],
  '方案决策': [`说明工具选用及方案依据，落实${design.environment}`, '能根据工作要求与实训条件比较方案，说明工具选用和取舍依据，并根据讨论意见完善方案'],
 } : {};
 const defaults = legacyCriteria[stage?.title];
 const criteria = defaults && activity.criteria === defaults[0] ? defaults[1] : activity.criteria;
 const sentence = value => value ? value.replace(/[。；;]+$/, '') + '。' : '';
 const sections = [];
 const add = (label, value) => { if (value) sections.push(`${label}：${value}`); };
 add('任务情境', design ? `围绕“${design.title}”项目，本任务需要你${task.title}。${design.environment || ''}` : `本任务需要你${task.title}。`);
 add('学习目标', activity.goal || phase?.[0] || design?.courseGoal);
 add('实施步骤', activity.steps || phase?.[1]);
 add('思考问题', activity.question);
 add('成果与评价', [activity.evidence && sentence(`提交${activity.evidence}`), criteria && sentence(`评价要求：${criteria}`)].filter(Boolean).join(''));
 add('学习准备与支持', [design?.prerequisites, design?.organization, design?.tools && `可使用${design.tools}`, activity.support].filter(Boolean).join('；'));
 return sections.join('\n\n');
}

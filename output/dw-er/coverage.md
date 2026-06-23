# DW 专业建设数据模型 ER 图覆盖清单

- 来源 Excel: `output/dw-er/DW_专业建设数据模型设计_岗位所属行业更新.xlsx`
- DW 对象节点: 17
- 字段总数: 202
- 字段级关系: 24
- 数据来源条目: 42

## 对象
- `major` (专业库): 13 字段
- `industry` (行业库): 10 字段
- `industry_chain` (产业链库): 12 字段
- `industry_node` (产业环节库): 10 字段
- `occupation` (职业库): 12 字段
- `job` (岗位库): 20 字段
- `job_task` (岗位任务库): 7 字段
- `job_ability` (岗位能力库): 9 字段
- `company` (企业库): 15 字段
- `job_posting` (招聘信息库): 20 字段
- `recruitment_trend` (招聘趋势库): 14 字段
- `competition` (赛事库): 11 字段
- `certificate` (证书库): 12 字段
- `course` (课程库): 10 字段
- `policy` (政策库): 13 字段
- `init_batch` (初始化批次库): 10 字段
- `source_catalog` (数据来源目录): 4 字段

## 关系
- `专业.major_id` -> `产业链.chain_id` (1:N推荐/N:1默认)
- `产业链.chain_id` -> `产业环节.chain_id` (1:N)
- `产业环节.industry_node_id` -> `岗位.industry_node_id` (1:N)
- `岗位.occupation_code` -> `职业.occupation_code` (N:1)
- `岗位.job_id` -> `岗位任务.job_id` (1:N)
- `岗位.job_id` -> `岗位能力.job_id` (1:N)
- `岗位任务.ability_ids` -> `岗位能力.ability_id` (N:M)
- `岗位.job_id` -> `课程.course_id` (N:M)
- `岗位能力.ability_id` -> `课程.course_id` (N:M)
- `岗位.job_id` -> `证书.certificate_id` (N:M)
- `岗位.job_id` -> `企业.company_id` (N:M)
- `企业.industry_code` -> `行业.industry_code` (N:1)
- `招聘信息.normalized_job_id` -> `岗位.job_id` (N:1)
- `招聘信息.company_id` -> `企业.company_id` (N:1)
- `招聘趋势.job_id` -> `岗位.job_id` (聚合)
- `招聘趋势.chain_id` -> `产业链.chain_id` (聚合)
- `赛事.major_codes` -> `专业.major_code` (N:M)
- `赛事.ability_requirements` -> `岗位能力.ability_id` (N:M)
- `政策.topic_tags` -> `产业链.chain_id` (N:M)
- `政策.topic_tags` -> `专业.major_id` (N:M)
- `政策.topic_tags` -> `岗位.job_id` (N:M)
- `岗位.industry_code` -> `行业.industry_code` (N:1)
- `初始化批次.major_id` -> `专业.major_id` (N:1)
- `初始化批次.selected_chain_id` -> `产业链.chain_id` (N:1)

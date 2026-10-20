/** AI人培修制定。由工程岗位库和教务课程生成，保留原始ID；来源与测算边界见provenance。 */
;(function(root){ root.TalentPlanData = {
  "schemaVersion": 1,
  "jobs": [
    {
      "id": "job-bim-modeler",
      "name": "BIM建模工程师",
      "group": "BIM深化设计与数字建模岗位群",
      "occupation": "建筑信息模型技术员",
      "occupationCode": "4-04-05-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-bim-modeler:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和BIM建模工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-bim-modeler:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-bim-modeler:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-bim-modeler:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-bim-modeler:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-bim-modeler:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-bim-modeler:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-bim-modeler:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-bim-modeler:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-bim-modeler:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-bim-modeler:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-bim-modeler:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-bim-modeler:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-bim-modeler:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-bim-modeler:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-bim-modeler:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-bim-modeler:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-bim-modeler:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-bim-modeler:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑BIM建模工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-modeler:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-modeler:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-modeler:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在BIM建模工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-bim-deepening",
      "name": "BIM深化设计工程师",
      "group": "BIM深化设计与数字建模岗位群",
      "occupation": "建筑信息模型技术员",
      "occupationCode": "4-04-05-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-bim-deepening:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和BIM深化设计工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-bim-deepening:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-bim-deepening:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-bim-deepening:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-bim-deepening:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-bim-deepening:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-bim-deepening:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-bim-deepening:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-bim-deepening:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-bim-deepening:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-bim-deepening:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-bim-deepening:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-bim-deepening:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-bim-deepening:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-bim-deepening:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-bim-deepening:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-bim-deepening:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-bim-deepening:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-bim-deepening:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑BIM深化设计工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-deepening:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在BIM深化设计与数字建模岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-deepening:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-deepening:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在BIM深化设计工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-parametric-design",
      "name": "参数化建筑设计技术员",
      "group": "",
      "occupation": "数字化设计技术员",
      "occupationCode": "2-02-18-99",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-parametric-design:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和参数化建筑设计技术员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-parametric-design:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-parametric-design:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-parametric-design:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-parametric-design:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-parametric-design:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-parametric-design:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-parametric-design:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-parametric-design:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-parametric-design:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-parametric-design:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-parametric-design:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-parametric-design:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-parametric-design:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-parametric-design:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-parametric-design:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-parametric-design:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-parametric-design:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-parametric-design:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑参数化建筑设计技术员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-parametric-design:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在参数化建筑设计技术员场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-parametric-design:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-parametric-design:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在参数化建筑设计技术员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-prefab-designer",
      "name": "装配式建筑深化设计师",
      "group": "装配式设计生产岗位群",
      "occupation": "土木建筑工程技术人员",
      "occupationCode": "2-02-18-03",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-prefab-designer:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和装配式建筑深化设计师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-prefab-designer:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-prefab-designer:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-prefab-designer:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-prefab-designer:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-prefab-designer:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-prefab-designer:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-prefab-designer:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-prefab-designer:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-prefab-designer:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-prefab-designer:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-prefab-designer:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-prefab-designer:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-prefab-designer:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-prefab-designer:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-prefab-designer:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-prefab-designer:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-prefab-designer:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-prefab-designer:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑装配式建筑深化设计师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-designer:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-designer:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-designer:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在装配式建筑深化设计师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-component-production",
      "name": "装配式构件生产工艺员",
      "group": "装配式设计生产岗位群",
      "occupation": "建筑构件生产技术员",
      "occupationCode": "6-15-01-99",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-component-production:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和装配式构件生产工艺员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-component-production:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-component-production:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-component-production:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-component-production:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-component-production:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-component-production:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-component-production:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-component-production:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-component-production:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-component-production:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-component-production:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-component-production:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-component-production:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-component-production:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-component-production:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-component-production:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-component-production:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-component-production:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑装配式构件生产工艺员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-component-production:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-component-production:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-component-production:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在装配式构件生产工艺员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-prefab-quality",
      "name": "装配式构件质量检测员",
      "group": "装配式设计生产岗位群",
      "occupation": "建筑工程质量检测员",
      "occupationCode": "4-08-05-03",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-prefab-quality:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和装配式构件质量检测员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-prefab-quality:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-prefab-quality:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-prefab-quality:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-prefab-quality:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-prefab-quality:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-prefab-quality:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-prefab-quality:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-prefab-quality:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-prefab-quality:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-prefab-quality:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-prefab-quality:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-prefab-quality:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-prefab-quality:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-prefab-quality:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-prefab-quality:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-prefab-quality:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-prefab-quality:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-prefab-quality:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑装配式构件质量检测员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-prefab-quality:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在装配式设计生产岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-prefab-quality:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-prefab-quality:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在装配式构件质量检测员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-smart-construction-tech",
      "name": "智能建造施工技术员",
      "group": "智能施工与机器人应用岗位群",
      "occupation": "土木建筑工程技术人员",
      "occupationCode": "2-02-18-03",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-smart-construction-tech:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智能建造施工技术员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-smart-construction-tech:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-smart-construction-tech:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-smart-construction-tech:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-smart-construction-tech:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-smart-construction-tech:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-smart-construction-tech:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-smart-construction-tech:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-smart-construction-tech:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-smart-construction-tech:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-smart-construction-tech:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-smart-construction-tech:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-smart-construction-tech:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-smart-construction-tech:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-smart-construction-tech:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-smart-construction-tech:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-smart-construction-tech:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-smart-construction-tech:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-smart-construction-tech:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智能建造施工技术员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-construction-tech:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-construction-tech:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-construction-tech:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智能建造施工技术员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-construction-robot-operator",
      "name": "建筑机器人应用工程师",
      "group": "智能施工与机器人应用岗位群",
      "occupation": "智能制造工程技术人员",
      "occupationCode": "2-02-07-13",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-construction-robot-operator:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和建筑机器人应用工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-construction-robot-operator:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-construction-robot-operator:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-construction-robot-operator:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-construction-robot-operator:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-construction-robot-operator:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-construction-robot-operator:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-construction-robot-operator:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-construction-robot-operator:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-construction-robot-operator:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-construction-robot-operator:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-construction-robot-operator:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-construction-robot-operator:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-construction-robot-operator:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-construction-robot-operator:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-construction-robot-operator:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-construction-robot-operator:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-construction-robot-operator:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-construction-robot-operator:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑建筑机器人应用工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-robot-operator:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-robot-operator:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-robot-operator:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在建筑机器人应用工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-uav-construction",
      "name": "无人机智能建造应用工程师",
      "group": "智能施工与机器人应用岗位群",
      "occupation": "无人机驾驶员",
      "occupationCode": "4-99-00-00",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-uav-construction:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和无人机智能建造应用工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-uav-construction:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-uav-construction:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-uav-construction:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-uav-construction:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-uav-construction:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-uav-construction:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-uav-construction:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-uav-construction:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-uav-construction:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-uav-construction:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-uav-construction:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-uav-construction:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-uav-construction:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-uav-construction:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-uav-construction:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-uav-construction:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-uav-construction:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-uav-construction:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑无人机智能建造应用工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-uav-construction:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能施工与机器人应用岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-uav-construction:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-uav-construction:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在无人机智能建造应用工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-smart-site-manager",
      "name": "智慧工地管理工程师",
      "group": "智慧工地管理岗位群",
      "occupation": "项目管理工程技术人员",
      "occupationCode": "2-02-30-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-smart-site-manager:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智慧工地管理工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-smart-site-manager:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-smart-site-manager:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-smart-site-manager:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-smart-site-manager:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-smart-site-manager:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-smart-site-manager:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-smart-site-manager:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-smart-site-manager:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-smart-site-manager:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-smart-site-manager:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-smart-site-manager:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-smart-site-manager:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-smart-site-manager:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-smart-site-manager:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-smart-site-manager:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-smart-site-manager:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-smart-site-manager:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-smart-site-manager:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智慧工地管理工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-site-manager:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-site-manager:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-site-manager:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智慧工地管理工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-project-digital-manager",
      "name": "工程项目数字化管理员",
      "group": "智慧工地管理岗位群",
      "occupation": "项目管理工程技术人员",
      "occupationCode": "2-02-30-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-project-digital-manager:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和工程项目数字化管理员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-project-digital-manager:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-project-digital-manager:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-project-digital-manager:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-project-digital-manager:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-project-digital-manager:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-project-digital-manager:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-project-digital-manager:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-project-digital-manager:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-project-digital-manager:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-project-digital-manager:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-project-digital-manager:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-project-digital-manager:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-project-digital-manager:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-project-digital-manager:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-project-digital-manager:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-project-digital-manager:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-project-digital-manager:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-project-digital-manager:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑工程项目数字化管理员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-project-digital-manager:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-project-digital-manager:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-project-digital-manager:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在工程项目数字化管理员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-safety-iot",
      "name": "智慧工地安全物联专员",
      "group": "智慧工地管理岗位群",
      "occupation": "安全工程技术人员",
      "occupationCode": "2-02-28-03",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-safety-iot:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智慧工地安全物联专员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-safety-iot:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-safety-iot:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-safety-iot:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-safety-iot:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-safety-iot:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-safety-iot:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-safety-iot:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-safety-iot:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-safety-iot:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-safety-iot:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-safety-iot:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-safety-iot:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-safety-iot:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-safety-iot:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-safety-iot:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-safety-iot:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-safety-iot:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-safety-iot:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智慧工地安全物联专员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-safety-iot:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智慧工地管理岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-safety-iot:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-safety-iot:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智慧工地安全物联专员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-structure-monitoring",
      "name": "结构健康监测工程师",
      "group": "智能检测监测岗位群",
      "occupation": "建筑工程检测工程技术人员",
      "occupationCode": "2-02-18-99",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-structure-monitoring:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和结构健康监测工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-structure-monitoring:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-structure-monitoring:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-structure-monitoring:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-structure-monitoring:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-structure-monitoring:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-structure-monitoring:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-structure-monitoring:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-structure-monitoring:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-structure-monitoring:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-structure-monitoring:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-structure-monitoring:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-structure-monitoring:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-structure-monitoring:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-structure-monitoring:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-structure-monitoring:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-structure-monitoring:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-structure-monitoring:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-structure-monitoring:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑结构健康监测工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-structure-monitoring:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-structure-monitoring:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-structure-monitoring:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在结构健康监测工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-smart-inspection",
      "name": "智能检测数据分析师",
      "group": "智能检测监测岗位群",
      "occupation": "检验检测工程技术人员",
      "occupationCode": "2-02-29-11",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-smart-inspection:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智能检测数据分析师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-smart-inspection:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-smart-inspection:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-smart-inspection:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-smart-inspection:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-smart-inspection:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-smart-inspection:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-smart-inspection:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-smart-inspection:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-smart-inspection:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-smart-inspection:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-smart-inspection:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-smart-inspection:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-smart-inspection:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-smart-inspection:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-smart-inspection:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-smart-inspection:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-smart-inspection:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-smart-inspection:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智能检测数据分析师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-inspection:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能检测监测岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-inspection:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-inspection:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智能检测数据分析师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-quality-data",
      "name": "工程质量数据工程师",
      "group": "",
      "occupation": "数据分析处理工程技术人员",
      "occupationCode": "2-02-30-09",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-quality-data:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和工程质量数据工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-quality-data:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-quality-data:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-quality-data:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-quality-data:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-quality-data:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-quality-data:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-quality-data:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-quality-data:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-quality-data:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-quality-data:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-quality-data:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-quality-data:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-quality-data:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-quality-data:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-quality-data:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-quality-data:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-quality-data:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-quality-data:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑工程质量数据工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-quality-data:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在工程质量数据工程师场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-quality-data:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-quality-data:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在工程质量数据工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-smart-survey",
      "name": "智能测量工程师",
      "group": "智能测绘与数据采集岗位群",
      "occupation": "测绘工程技术人员",
      "occupationCode": "2-02-02-02",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-smart-survey:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智能测量工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-smart-survey:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-smart-survey:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-smart-survey:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-smart-survey:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-smart-survey:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-smart-survey:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-smart-survey:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-smart-survey:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-smart-survey:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-smart-survey:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-smart-survey:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-smart-survey:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-smart-survey:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-smart-survey:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-smart-survey:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-smart-survey:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-smart-survey:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-smart-survey:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智能测量工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智能测量工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智能测量工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智能测量工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智能测量工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-smart-survey:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-smart-survey:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-smart-survey:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智能测量工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-laser-scan",
      "name": "三维激光扫描建模师",
      "group": "智能测绘与数据采集岗位群",
      "occupation": "测绘工程技术人员",
      "occupationCode": "2-02-02-02",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-laser-scan:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和三维激光扫描建模师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-laser-scan:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-laser-scan:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-laser-scan:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-laser-scan:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-laser-scan:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-laser-scan:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-laser-scan:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-laser-scan:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-laser-scan:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-laser-scan:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-laser-scan:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-laser-scan:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-laser-scan:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-laser-scan:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-laser-scan:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-laser-scan:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-laser-scan:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-laser-scan:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑三维激光扫描建模师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-laser-scan:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-laser-scan:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-laser-scan:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在三维激光扫描建模师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-site-data-collector",
      "name": "施工现场数据采集员",
      "group": "智能测绘与数据采集岗位群",
      "occupation": "工程测量员",
      "occupationCode": "4-08-03-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-site-data-collector:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和施工现场数据采集员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-site-data-collector:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-site-data-collector:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-site-data-collector:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-site-data-collector:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-site-data-collector:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-site-data-collector:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-site-data-collector:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-site-data-collector:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-site-data-collector:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-site-data-collector:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-site-data-collector:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-site-data-collector:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-site-data-collector:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-site-data-collector:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-site-data-collector:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-site-data-collector:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-site-data-collector:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-site-data-collector:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑施工现场数据采集员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-site-data-collector:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智能测绘与数据采集岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-site-data-collector:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-site-data-collector:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在施工现场数据采集员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-green-construction",
      "name": "绿色施工管理工程师",
      "group": "绿色建造与智慧运维岗位群",
      "occupation": "环境保护工程技术人员",
      "occupationCode": "2-02-27-02",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-green-construction:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和绿色施工管理工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-green-construction:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-green-construction:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-green-construction:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-green-construction:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-green-construction:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-green-construction:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-green-construction:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-green-construction:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-green-construction:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-green-construction:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-green-construction:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-green-construction:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-green-construction:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-green-construction:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-green-construction:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-green-construction:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-green-construction:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-green-construction:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑绿色施工管理工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-green-construction:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-green-construction:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-green-construction:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在绿色施工管理工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-building-smart-ops",
      "name": "建筑智能运维工程师",
      "group": "绿色建造与智慧运维岗位群",
      "occupation": "智能楼宇管理员",
      "occupationCode": "4-07-05-03",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-building-smart-ops:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和建筑智能运维工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-building-smart-ops:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-building-smart-ops:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-building-smart-ops:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-building-smart-ops:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-building-smart-ops:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-building-smart-ops:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-building-smart-ops:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-building-smart-ops:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-building-smart-ops:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-building-smart-ops:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-building-smart-ops:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-building-smart-ops:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-building-smart-ops:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-building-smart-ops:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-building-smart-ops:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-building-smart-ops:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-building-smart-ops:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-building-smart-ops:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑建筑智能运维工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-building-smart-ops:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在绿色建造与智慧运维岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-building-smart-ops:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-building-smart-ops:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在建筑智能运维工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-energy-carbon",
      "name": "建筑能耗与碳管理专员",
      "group": "",
      "occupation": "碳排放管理员",
      "occupationCode": "4-09-07-04",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-energy-carbon:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和建筑能耗与碳管理专员岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-energy-carbon:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-energy-carbon:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-energy-carbon:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-energy-carbon:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-energy-carbon:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-energy-carbon:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-energy-carbon:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-energy-carbon:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-energy-carbon:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-energy-carbon:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-energy-carbon:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-energy-carbon:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-energy-carbon:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-energy-carbon:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-energy-carbon:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-energy-carbon:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-energy-carbon:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-energy-carbon:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑建筑能耗与碳管理专员理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-energy-carbon:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在建筑能耗与碳管理专员场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-energy-carbon:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-energy-carbon:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在建筑能耗与碳管理专员岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-bim-data-governance",
      "name": "建筑数据治理工程师",
      "group": "建筑数据治理与平台实施岗位群",
      "occupation": "大数据工程技术人员",
      "occupationCode": "2-02-10-11",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-bim-data-governance:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和建筑数据治理工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-bim-data-governance:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-bim-data-governance:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-bim-data-governance:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-bim-data-governance:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-bim-data-governance:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-bim-data-governance:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-bim-data-governance:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-bim-data-governance:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-bim-data-governance:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-bim-data-governance:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-bim-data-governance:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-bim-data-governance:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-bim-data-governance:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-bim-data-governance:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-bim-data-governance:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-bim-data-governance:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-bim-data-governance:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-bim-data-governance:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑建筑数据治理工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-bim-data-governance:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-bim-data-governance:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-bim-data-governance:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在建筑数据治理工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-construction-platform-implementation",
      "name": "智慧建造平台实施顾问",
      "group": "",
      "occupation": "数字化解决方案设计师",
      "occupationCode": "4-04-05-02",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-construction-platform-implementation:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和智慧建造平台实施顾问岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-construction-platform-implementation:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-construction-platform-implementation:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-construction-platform-implementation:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-construction-platform-implementation:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-construction-platform-implementation:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-construction-platform-implementation:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-construction-platform-implementation:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-construction-platform-implementation:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-construction-platform-implementation:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-construction-platform-implementation:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-construction-platform-implementation:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-construction-platform-implementation:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-construction-platform-implementation:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-construction-platform-implementation:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-construction-platform-implementation:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-construction-platform-implementation:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-construction-platform-implementation:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-construction-platform-implementation:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑智慧建造平台实施顾问理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-construction-platform-implementation:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在智慧建造平台实施顾问场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-construction-platform-implementation:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-construction-platform-implementation:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在智慧建造平台实施顾问岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    },
    {
      "id": "job-iot-device-integration",
      "name": "建筑物联网集成工程师",
      "group": "建筑数据治理与平台实施岗位群",
      "occupation": "物联网工程技术人员",
      "occupationCode": "2-02-10-10",
      "source": "专业岗位库",
      "sourceFile": "src/mock/job-center.ts",
      "evidence": "岗位画像测算",
      "tasks": [
        {
          "id": "job-iot-device-integration:task-1",
          "name": "岗位任务策划与资料准备",
          "description": "根据项目阶段和建筑物联网集成工程师岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。",
          "abilities": [
            "智能建造产业链认知",
            "建筑工程识图与构造理解",
            "工程资料归档",
            "跨专业协同沟通",
            "建筑工程项目全生命周期认知",
            "建筑制图与工程识图基础",
            "建筑材料与构件性能认知",
            "工程质量验收规范知识",
            "绿色建造与节能标准知识",
            "BIM模型信息标准知识",
            "工程计量与造价基础知识",
            "装配式建筑体系知识",
            "工程数据治理标准知识",
            "项目管理与进度控制知识",
            "工程合同与招采流程知识",
            "施工进度计划编排",
            "绿色低碳责任意识",
            "客户需求理解能力",
            "团队协作意识",
            "标准执行意识",
            "资料留痕意识"
          ]
        },
        {
          "id": "job-iot-device-integration:task-2",
          "name": "数字模型与现场数据处理",
          "description": "围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。",
          "abilities": [
            "BIM模型应用与协同",
            "工程数据采集与校核",
            "智慧工地平台操作",
            "数据质量意识",
            "建筑构造与结构体系理解",
            "安全生产法律法规知识",
            "构件深化设计规则知识",
            "无人机航测作业知识",
            "建筑机器人施工场景知识",
            "智能装备运行机理知识",
            "智慧工地平台架构知识",
            "物联网传感网络知识",
            "数据质量与主数据管理知识",
            "结构健康监测原理知识",
            "智能检测评价方法知识",
            "BIM模型创建与校核",
            "BIM深化设计表达",
            "构件族库维护",
            "工程量提取与复核",
            "参数化建模配置",
            "装配式构件拆分",
            "构件生产数据整理",
            "智慧工地平台配置",
            "传感器安装与联调",
            "智能测量数据采集",
            "点云数据处理",
            "无人机航线规划",
            "影像建模成果校核",
            "建筑机器人路径配置",
            "智能装备现场调试",
            "质量安全巡检记录",
            "检测监测数据判读",
            "工程质量责任意识",
            "数据真实完整意识",
            "现场问题闭环意识",
            "风险预判意识",
            "设备安全操作意识",
            "隐私与数据安全意识"
          ]
        },
        {
          "id": "job-iot-device-integration:task-3",
          "name": "智能建造现场协同实施",
          "description": "对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。",
          "abilities": [
            "施工组织与现场协调",
            "设备联调与应用",
            "质量安全与规范意识",
            "跨专业协同沟通",
            "智能测量与测绘基础知识",
            "现场物联设备接入",
            "数字化思维",
            "进度节点意识"
          ]
        },
        {
          "id": "job-iot-device-integration:task-4",
          "name": "质量安全检查与效果评价",
          "description": "依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。",
          "abilities": [
            "质量安全与规范意识",
            "工程数据采集与校核",
            "问题分析与改进",
            "持续改进与数字化思维",
            "施工组织与工序逻辑知识",
            "三维激光点云基础知识",
            "安全生产红线意识"
          ]
        },
        {
          "id": "job-iot-device-integration:task-5",
          "name": "交付文档编制与复盘优化",
          "description": "输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。",
          "abilities": [
            "工程资料归档",
            "BIM模型应用与协同",
            "沟通表达能力",
            "持续改进与数字化思维",
            "BIM协同交付流程知识",
            "多专业模型协同检查",
            "施工图协同审查",
            "施工工艺方案编制",
            "规范化交付意识",
            "持续学习能力",
            "工匠精神与精益意识",
            "成本控制意识"
          ]
        }
      ],
      "abilities": [
        {
          "id": "job-iot-device-integration:ability-1",
          "name": "智能建造产业链认知",
          "category": "知识",
          "definition": "理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。"
        },
        {
          "id": "job-iot-device-integration:ability-2",
          "name": "建筑工程识图与构造理解",
          "category": "知识",
          "definition": "掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。"
        },
        {
          "id": "job-iot-device-integration:ability-3",
          "name": "BIM模型应用与协同",
          "category": "技能",
          "definition": "能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。"
        },
        {
          "id": "job-iot-device-integration:ability-4",
          "name": "智慧工地平台操作",
          "category": "技能",
          "definition": "能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。"
        },
        {
          "id": "job-iot-device-integration:ability-5",
          "name": "工程数据采集与校核",
          "category": "技能",
          "definition": "能够采集现场数据、校核数据质量并形成可追溯的工程记录。"
        },
        {
          "id": "job-iot-device-integration:ability-6",
          "name": "质量安全与规范意识",
          "category": "素养",
          "definition": "遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。"
        },
        {
          "id": "job-iot-device-integration:ability-7",
          "name": "跨专业协同沟通",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现跨专业协同沟通，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-8",
          "name": "持续改进与数字化思维",
          "category": "素养",
          "definition": "关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。"
        },
        {
          "id": "job-iot-device-integration:ability-9",
          "name": "工程资料归档",
          "category": "技能",
          "definition": "能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。"
        },
        {
          "id": "job-iot-device-integration:ability-10",
          "name": "施工组织与现场协调",
          "category": "技能",
          "definition": "能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。"
        },
        {
          "id": "job-iot-device-integration:ability-11",
          "name": "设备联调与应用",
          "category": "技能",
          "definition": "能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。"
        },
        {
          "id": "job-iot-device-integration:ability-12",
          "name": "数据质量意识",
          "category": "素养",
          "definition": "关注工程数据的准确性、完整性、时效性和可追溯性。"
        },
        {
          "id": "job-iot-device-integration:ability-13",
          "name": "问题分析与改进",
          "category": "素养",
          "definition": "能够基于现场问题、数据异常和交付反馈提出改进措施。"
        },
        {
          "id": "job-iot-device-integration:ability-14",
          "name": "沟通表达能力",
          "category": "素养",
          "definition": "能够清晰表达技术方案、现场问题、质量风险和协作需求。"
        },
        {
          "id": "job-iot-device-integration:ability-15",
          "name": "建筑工程项目全生命周期认知",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解建筑工程项目全生命周期认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-16",
          "name": "建筑制图与工程识图基础",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解建筑制图与工程识图基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-17",
          "name": "建筑构造与结构体系理解",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解建筑构造与结构体系理解，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-18",
          "name": "建筑材料与构件性能认知",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解建筑材料与构件性能认知，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-19",
          "name": "施工组织与工序逻辑知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解施工组织与工序逻辑，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-20",
          "name": "工程质量验收规范知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解工程质量验收规范，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-21",
          "name": "安全生产法律法规知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解安全生产法律法规，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-22",
          "name": "绿色建造与节能标准知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解绿色建造与节能标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-23",
          "name": "BIM模型信息标准知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解BIM模型信息标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-24",
          "name": "BIM协同交付流程知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解BIM协同交付流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-25",
          "name": "工程计量与造价基础知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解工程计量与造价基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-26",
          "name": "装配式建筑体系知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解装配式建筑体系，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-27",
          "name": "构件深化设计规则知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解构件深化设计规则，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-28",
          "name": "智能测量与测绘基础知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解智能测量与测绘基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-29",
          "name": "三维激光点云基础知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解三维激光点云基础，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-30",
          "name": "无人机航测作业知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解无人机航测作业，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-31",
          "name": "建筑机器人施工场景知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解建筑机器人施工场景，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-32",
          "name": "智能装备运行机理知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解智能装备运行机理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-33",
          "name": "智慧工地平台架构知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解智慧工地平台架构，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-34",
          "name": "物联网传感网络知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解物联网传感网络，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-35",
          "name": "工程数据治理标准知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解工程数据治理标准，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-36",
          "name": "数据质量与主数据管理知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解数据质量与主数据管理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-37",
          "name": "结构健康监测原理知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解结构健康监测原理，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-38",
          "name": "智能检测评价方法知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解智能检测评价方法，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-39",
          "name": "项目管理与进度控制知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解项目管理与进度控制，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-40",
          "name": "工程合同与招采流程知识",
          "category": "知识",
          "definition": "支撑建筑物联网集成工程师理解工程合同与招采流程，用于判断岗位任务中的技术边界、规范要求和工程约束。"
        },
        {
          "id": "job-iot-device-integration:ability-41",
          "name": "BIM模型创建与校核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成BIM模型创建与校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-42",
          "name": "BIM深化设计表达",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成BIM深化设计表达，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-43",
          "name": "多专业模型协同检查",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成多专业模型协同检查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-44",
          "name": "构件族库维护",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成构件族库维护，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-45",
          "name": "工程量提取与复核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成工程量提取与复核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-46",
          "name": "施工图协同审查",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工图协同审查，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-47",
          "name": "参数化建模配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成参数化建模配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-48",
          "name": "装配式构件拆分",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成装配式构件拆分，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-49",
          "name": "构件生产数据整理",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成构件生产数据整理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-50",
          "name": "施工工艺方案编制",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工工艺方案编制，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-51",
          "name": "施工进度计划编排",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成施工进度计划编排，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-52",
          "name": "智慧工地平台配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智慧工地平台配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-53",
          "name": "现场物联设备接入",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成现场物联设备接入，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-54",
          "name": "传感器安装与联调",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成传感器安装与联调，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-55",
          "name": "智能测量数据采集",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智能测量数据采集，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-56",
          "name": "点云数据处理",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成点云数据处理，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-57",
          "name": "无人机航线规划",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成无人机航线规划，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-58",
          "name": "影像建模成果校核",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成影像建模成果校核，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-59",
          "name": "建筑机器人路径配置",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成建筑机器人路径配置，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-60",
          "name": "智能装备现场调试",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成智能装备现场调试，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-61",
          "name": "质量安全巡检记录",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成质量安全巡检记录，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-62",
          "name": "检测监测数据判读",
          "category": "技能",
          "definition": "能够在建筑数据治理与平台实施岗位群场景中完成检测监测数据判读，并形成可验收、可追溯的岗位工作成果。"
        },
        {
          "id": "job-iot-device-integration:ability-63",
          "name": "工程质量责任意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现工程质量责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-64",
          "name": "安全生产红线意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现安全生产红线意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-65",
          "name": "规范化交付意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现规范化交付意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-66",
          "name": "数据真实完整意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现数据真实完整意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-67",
          "name": "现场问题闭环意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现现场问题闭环意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-68",
          "name": "数字化思维",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现数字化思维，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-69",
          "name": "持续学习能力",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现持续学习能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-70",
          "name": "工匠精神与精益意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现工匠精神与精益意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-71",
          "name": "绿色低碳责任意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现绿色低碳责任意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-72",
          "name": "客户需求理解能力",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现客户需求理解能力，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-73",
          "name": "进度节点意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现进度节点意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-74",
          "name": "成本控制意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现成本控制意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-75",
          "name": "风险预判意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现风险预判意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-76",
          "name": "团队协作意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现团队协作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-77",
          "name": "标准执行意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现标准执行意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-78",
          "name": "资料留痕意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现资料留痕意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-79",
          "name": "设备安全操作意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现设备安全操作意识，保障项目协同、质量安全和持续改进。"
        },
        {
          "id": "job-iot-device-integration:ability-80",
          "name": "隐私与数据安全意识",
          "category": "素养",
          "definition": "在建筑物联网集成工程师岗位工作中体现隐私与数据安全意识，保障项目协同、质量安全和持续改进。"
        }
      ]
    }
  ],
  "courses": [
    {
      "id": "B260001",
      "code": "B260001",
      "name": "思想道德与法治",
      "college": "马克思主义学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260002",
      "code": "B260002",
      "name": "中国近现代史纲要",
      "college": "马克思主义学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260003",
      "code": "B260003",
      "name": "马克思主义基本原理",
      "college": "马克思主义学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260004",
      "code": "B260004",
      "name": "毛泽东思想和中国特色社会主义理论体系概论",
      "college": "马克思主义学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260005",
      "code": "B260005",
      "name": "习近平新时代中国特色社会主义思想概论",
      "college": "马克思主义学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260006",
      "code": "B260006",
      "name": "“四史”概论",
      "college": "马克思主义学院",
      "credits": 1,
      "type": "公共必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260007-（1-8）",
      "code": "B260007-（1-8）",
      "name": "形势与政策（1-8）",
      "college": "马克思主义学院",
      "credits": 2,
      "type": "公共必修",
      "semester": "第1-8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260008",
      "code": "B260008",
      "name": "大学生心理健康教育",
      "college": "心理健康教育与咨询中心",
      "credits": 2,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260009",
      "code": "B260009",
      "name": "高等数学A-1",
      "college": "基础教研部",
      "credits": 3,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260010",
      "code": "B260010",
      "name": "高等数学A-2",
      "college": "基础教研部",
      "credits": 4,
      "type": "公共必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260013",
      "code": "B260013",
      "name": "线性代数",
      "college": "基础教研部",
      "credits": 2,
      "type": "公共必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260014",
      "code": "B260014",
      "name": "概率论与数理统计",
      "college": "基础教研部",
      "credits": 3,
      "type": "公共必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260015",
      "code": "B260015",
      "name": "大学物理",
      "college": "基础教研部",
      "credits": 3,
      "type": "公共必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260016",
      "code": "B260016",
      "name": "大学物理实验",
      "college": "基础教研部",
      "credits": 2,
      "type": "公共必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260017",
      "code": "B260017",
      "name": "大学英语1/小语种外语1",
      "college": "基础教研部",
      "credits": 4,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260018",
      "code": "B260018",
      "name": "大学英语2/小语种外语2",
      "college": "基础教研部",
      "credits": 4,
      "type": "公共必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260019",
      "code": "B260019",
      "name": "军事理论",
      "college": "基础教研部",
      "credits": 2,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260020",
      "code": "B260020",
      "name": "国家安全教育",
      "college": "基础教研部",
      "credits": 1,
      "type": "公共必修",
      "semester": "第1-8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260021-（1-4）",
      "code": "B260021-（1-4）",
      "name": "体育（1-4）",
      "college": "体育教研部",
      "credits": 4,
      "type": "公共必修",
      "semester": "第1学期、第2学期、第3学期、第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260022",
      "code": "B260022",
      "name": "劳动教育理论与实践",
      "college": "素质教育教研部",
      "credits": 2,
      "type": "公共必修",
      "semester": "第1-8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260023",
      "code": "B260023",
      "name": "大学生职业生涯规划",
      "college": "创新创业学院",
      "credits": 1,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260024",
      "code": "B260024",
      "name": "大学生就业指导",
      "college": "创新创业学院",
      "credits": 1,
      "type": "公共必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260025",
      "code": "B260025",
      "name": "创新创业基础",
      "college": "创新创业学院",
      "credits": 2,
      "type": "公共必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260026",
      "code": "B260026",
      "name": "信息技术与人工智能基础",
      "college": "信息工程学院",
      "credits": 3,
      "type": "公共必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261301",
      "code": "B261301",
      "name": "建筑力学",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业基础必修",
      "semester": "第2学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261302",
      "code": "B261302",
      "name": "建筑制图与CAD",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业基础必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261303",
      "code": "B261303",
      "name": "建筑构造与识图",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业基础必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261304",
      "code": "B261304",
      "name": "建筑材料",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业基础必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261305",
      "code": "B261305",
      "name": "建筑结构",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业基础必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261306",
      "code": "B261306",
      "name": "建筑信息模型基础",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业基础必修",
      "semester": "第3学期",
      "hours": null,
      "jobIds": [
        "job-bim-modeler",
        "job-bim-deepening",
        "job-bim-data-governance"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261307",
      "code": "B261307",
      "name": "智能测量技术",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业基础必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [
        "job-smart-survey",
        "job-laser-scan",
        "job-site-data-collector"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261308",
      "code": "B261308",
      "name": "土力学与地基基础",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业基础必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261309",
      "code": "B261309",
      "name": "建筑抗震",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业核心必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261310",
      "code": "B261310",
      "name": "建筑工程计量与计价",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业核心必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261311",
      "code": "B261311",
      "name": "智能建造施工技术",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [
        "job-smart-construction-tech",
        "job-construction-robot-operator",
        "job-uav-construction"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261312",
      "code": "B261312",
      "name": "建筑工程质量与安全管理",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业核心必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [
        "job-safety-iot",
        "job-prefab-quality",
        "job-quality-data"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261313",
      "code": "B261313",
      "name": "智能检测与监测技术",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [
        "job-structure-monitoring",
        "job-smart-inspection",
        "job-quality-data"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261314",
      "code": "B261314",
      "name": "智能机械与机器人",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业核心必修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [
        "job-construction-robot-operator",
        "job-smart-construction-tech",
        "job-iot-device-integration"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261315",
      "code": "B261315",
      "name": "建筑信息模型应用",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [
        "job-bim-deepening",
        "job-parametric-design",
        "job-project-digital-manager"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261316",
      "code": "B261316",
      "name": "建筑施工组织",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261317",
      "code": "B261317",
      "name": "工程项目智慧管理",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [
        "job-smart-site-manager",
        "job-project-digital-manager",
        "job-construction-platform-implementation"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261318",
      "code": "B261318",
      "name": "高层建筑施工",
      "college": "建筑工程学院",
      "credits": 3,
      "type": "专业核心必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261319",
      "code": "B261319",
      "name": "Python程序设计基础",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261320",
      "code": "B261320",
      "name": "装配式深化设计协同与应用",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [
        "job-prefab-designer",
        "job-bim-deepening",
        "job-prefab-quality"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261321",
      "code": "B261321",
      "name": "无人机智能建造应用",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261322",
      "code": "B261322",
      "name": "建筑机器人操作与维护",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261323",
      "code": "B261323",
      "name": "结构数智化设计",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261324",
      "code": "B261324",
      "name": "5G与物联网在智慧工地应用",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [
        "job-iot-device-integration",
        "job-safety-iot",
        "job-smart-site-manager"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261325",
      "code": "B261325",
      "name": "装配式建筑结构设计",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261326",
      "code": "B261326",
      "name": "建筑元宇宙与VR/AR可视化",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261327",
      "code": "B261327",
      "name": "装配式建筑构件生产与管理",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [
        "job-component-production",
        "job-prefab-quality",
        "job-prefab-designer"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261328",
      "code": "B261328",
      "name": "工程大数据与云计算",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261329",
      "code": "B261329",
      "name": "自动控制与人工智能",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261330",
      "code": "B261330",
      "name": "绿色建造与节能技术",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261331",
      "code": "B261331",
      "name": "建筑物联网技术",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261332",
      "code": "B261332",
      "name": "钢结构BIM深化设计",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第5学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261333",
      "code": "B261333",
      "name": "建筑智能化与智慧运维",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [
        "job-building-smart-ops",
        "job-energy-carbon",
        "job-green-construction"
      ],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261334",
      "code": "B261334",
      "name": "建筑智能运维与设施管理",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261335",
      "code": "B261335",
      "name": "建筑大数据分析与可视化",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261336",
      "code": "B261336",
      "name": "区块链与建筑产业互联网",
      "college": "建筑工程学院",
      "credits": 2,
      "type": "专业拓展选修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261337",
      "code": "B261337",
      "name": "多层框架结构BIM深化设计",
      "college": "建筑工程学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第6学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261338",
      "code": "B261338",
      "name": "装配式混凝土构件深化设计",
      "college": "建筑工程学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第7学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261339",
      "code": "B261339",
      "name": "危大工程专项施工方案编制",
      "college": "建筑工程学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第7学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261340",
      "code": "B261340",
      "name": "智慧工地平台部署与管理",
      "college": "建筑工程学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第7学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B261341",
      "code": "B261341",
      "name": "建筑结构智能检测与健康监测",
      "college": "建筑工程学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第7学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260027",
      "code": "B260027",
      "name": "军事训练",
      "college": "基础教研部",
      "credits": 3,
      "type": "集中实践必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260028",
      "code": "B260028",
      "name": "社会实践",
      "college": "团委、各学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第4学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260029",
      "code": "B260029",
      "name": "入学教育",
      "college": "各学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260030",
      "code": "B260030",
      "name": "毕业教育",
      "college": "各学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260031",
      "code": "B260031",
      "name": "认识实习",
      "college": "各学院",
      "credits": 1,
      "type": "集中实践必修",
      "semester": "第1学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260032",
      "code": "B260032",
      "name": "岗位实习",
      "college": "各学院",
      "credits": 24,
      "type": "集中实践必修",
      "semester": "第7学期、第8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260033",
      "code": "B260033",
      "name": "毕业设计",
      "college": "各学院",
      "credits": 8,
      "type": "集中实践必修",
      "semester": "第8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260034",
      "code": "B260034",
      "name": "创新创业实践",
      "college": "教务处、各学院",
      "credits": 2,
      "type": "第二课堂",
      "semester": "第8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    },
    {
      "id": "B260035",
      "code": "B260035",
      "name": "综合素养",
      "college": "相关单位",
      "credits": 2,
      "type": "第二课堂",
      "semester": "第8学期",
      "hours": null,
      "jobIds": [],
      "source": "教务课程库",
      "sourceFile": "src/app/talent-industry-data.ts"
    }
  ],
  "existing": {
    "name": "智能建造工程2026级人才培养方案",
    "major": "智能建造工程",
    "code": "240302",
    "level": "职业本科",
    "years": 4,
    "year": "2026",
    "goals": "坚持“扎根辽西、服务辽宁、对接产业、面向一线”的服务面向定位，主动融入辽宁现代化产业体系，精准对接区域产业发展布局，培养能够践行社会主义核心价值观，传承与创新技能文明，德智体美劳全面发展；具有较高的科学文化水平，良好的人文素养、科学素养、数字素养、职业道德；爱岗敬业的职业精神和精益求精的工匠精神；一定的国际视野；掌握较为系统的智能建造工程基础理论知识和技术技能；具备一定的技术研发与改造、工艺设计、技术实践能力；能够从事科技成果、实验成果转化，能够生产加工中高端产品、提供中高端服务；能够解决较复杂问题、进行较复杂操作；具有复合岗位胜任力、跨领域协作力；具有一定的创新能力，具有较强的就业创业能力和可持续发展能力，具备职业综合素质和行动能力，面向房屋建筑、土木工程建筑等行业的土木建筑工程技术人员、项目管理工程技术人员、建筑信息模型技术员等职业，能够从事装配式建筑设计与生产、智能建造技术与装备应用、智慧工地与数字化运维等工作的高端技能人才。\n\n目标1：能够践行社会主义核心价值观，传承与创新技能文明，德智体美劳全面发展，具有坚定的理想信念和深厚的家国情怀\n目标2：具备良好的人文底蕴、科学精神与数字思维，能够适应建筑行业数字化、智能化转型发展需求\n目标3：具备爱岗敬业的职业精神、精益求精的工匠精神和诚实守信的职业道德，恪守工程伦理与行业规范\n目标4：具有一定的国际视野，能够跟踪智能建造领域国际前沿技术，具备终身学习和可持续发展的能力\n目标5：系统掌握装配式建筑设计与生产、智能建造技术与装备、智慧工地与数字化运维等三个岗位群所需的建筑力学、建筑结构、BIM技术、智能测量、自动控制等基础理论知识和技术技能\n目标6：具备智能建造施工工艺优化、建筑机器人应用方案设计、BIM深化设计等技术研发与改造能力，能够将新技术、新工艺、新材料、新设备在工程实践中转化应用\n目标7：能够完成装配式混凝土构件深化设计、智慧工地平台部署、建筑结构智能检测等中高端技术服务工作，提供高质量的智能建造解决方案\n目标8：能够解决大型复杂建筑工程中的施工技术难题、危大工程专项方案编制、智能检测数据判读等较复杂问题，熟练操作建筑机器人、无人机等智能装备\n目标9：能够胜任装配式深化设计、智能建造施工、智慧工地管理等复合岗位，具备多专业协同和跨领域团队协作能力\n目标10：具有技术改进、工艺创新、管理优化的创新能力，具备较强的就业竞争力和自主创业潜力\n目标11：面向房屋建筑业、土木工程建筑业等行业的土木建筑工程技术人员、项目管理工程技术人员、建筑信息模型技术员等职业，能够从事装配式建筑设计与生产、智能建造技术与装备应用、智慧工地与数字化运维等工作的高端技能人才",
    "requirements": "本专业毕业要求依据智能建造工程专业教学标准、国家职业技能标准及行业企业岗位能力要求，围绕素质、知识、能力三类共30项要求展开，强调价值塑造、工程基础、BIM与智能装备应用、智慧工地管理、智能检测监测、绿色安全施工、跨专业协作和终身学习能力的系统达成。\n\nR1 价值塑造与职业素养\n坚定拥护中国共产党领导和中国特色社会主义制度，以习近平新时代中国特色社会主义思想为指导，践行社会主义核心价值观，具有坚定的理想信念、深厚的爱国情感和中华民族自豪感；\n具有良好的职业道德、职业素养和职业荣誉感,诚实守信、爱岗敬业,遵守职业道德准则行为规范,具备社会责任感和担当精神；\n具有智能建造工程技术人员的劳动素养，弘扬劳模精神、劳动精神、工匠精神，崇尚劳动、尊重劳动、热爱劳动；\n具有良好的身心素质和人文素养。并达到国家大学生体质测试合格标准,养成良好的运动习惯,卫生习惯和行为习惯；\n具有一定的美育素质、文化修养和审美素质，至少形成1项艺术特长或爱好。\n\nR2 工程法规与绿色安全素养\n掌握与本专业对应职业活动相关的国家法律、行业规定，掌握绿色生产、环境保护、安全防护、质量管理等相关知识与技能，具有质量意识、环保意识、安全意识和创新思维；\n熟悉绿色建造、节能环保、安全生产、工程建设法律法规等相关政策与标准。\n具有绿色施工、安全防护、质量管理、节能减排意识及正确应用建设工程法律法规的能力；\n\nR3 工程基础与智能建造专业知识\n掌握支撑本专业学习和可持续发展的数学（高等数学、线性代数、概率论与数理统计）、物理、信息技术（含人工智能基础）等文化基础知识；\n掌握建筑制图与CAD、建筑构造与识图、建筑材料、建筑力学、建筑结构、土力学与地基基础等专业基础理论知识；\n掌握建筑信息模型（BIM）基础与应用、智能测量技术、智能机械与机器人等数字化与智能化技术知识；\n掌握智能建造施工技术、高层建筑施工、建筑施工组织、建筑工程质量与安全管理、建筑工程计量与计价等施工与管理知识；\n掌握智能检测与监测技术、工程项目智慧管理、建筑抗震等专业核心知识；\n\nR4 装配式建筑与智慧运维方向知识\n掌握装配式建筑结构设计、装配式建筑构件生产与管理、结构数智化设计等装配式方向专业知识；\n掌握自动控制与人工智能、无人机智能建造应用、建筑大数据分析与可视化等智能装备与数据分析方向专业知识；\n掌握建筑物联网技术、建筑智能化与智慧运维等智慧运维方向专业知识；\n\nR5 沟通协作与终身发展\n具有较强的集体意识和团队合作意识，能够在多专业协作中有效沟通、协同工作；\n具有自主学习和终身学习的意识，能够主动适应建筑行业技术迭代和产业升级；\n具有理论联系实际、实事求是的科学态度和严谨的工作作风，具有批判性思维、创新思维、创业意识；\n具备良好的语言表达能力、文字表达能力、沟通合作能力，具有一定的国际视野和跨文化交流能力；\n具有探究学习、终身学习和可持续发展的能力，能够适应新技术、新岗位的要求，具备职业生涯规划能力；\n\nR6 复杂工程问题与数字工具应用\n具有较强的分析问题和解决问题的能力，能够识别、分析并解决智能建造工程中的复杂技术问题；\n具有较强的整合知识和综合运用知识的能力，能够将BIM、物联网、人工智能等技术集成应用于工程实践；\n具备适应建筑行业数字化和智能化发展需求的数字技能，能够熟练使用BIM软件、智能检测设备、智慧管理平台等数字化工具；\n\nR7 装配式深化设计与智能化施工\n具有运用建筑结构与构造知识并借助深化设计软件进行构件深化设计的能力，能够完成装配式混凝土构件拆分与配筋深化；\n具有施工计算、临时支撑设计、检算的能力，能够编制危大工程专项施工方案并进行技术论证；\n具有进行智能化施工项目策划、编制智能化施工方案、指导智能化施工的能力；\n\nR8 智慧工地管理、智能检测与创新发展\n具有设计开发智能化施工工艺与方法、进行项目信息化管理的能力，能够应用智慧工地平台进行进度、质量、安全、成本综合管控；\n具有选择智能化检测设备、编制工程质量检测方案、对采集数据进行分析与判断并提出解决办法的能力；\n具有一定的国际视野、创新能力及适应建筑业数字化转型升级的数字化应用与管理能力。",
    "courseIds": [
      "B261306",
      "B261307",
      "B261311",
      "B261312",
      "B261313",
      "B261314",
      "B261315",
      "B261317",
      "B261320",
      "B261324",
      "B261327",
      "B261333"
    ]
  },
  "provenance": {
    "generatedAt": "2026-10-15",
    "scope": "前端交互数据档案",
    "jobs": "复用工程岗位画像，不等于实测招聘事实",
    "courses": "复用工程教务课程内容，未连接实时教务系统；学时未提供，保持为空",
    "generation": "本地结构化规则起草，未连接在线大模型",
    "relations": "原岗位—课程关系为匹配候选；能力关系经用户确认后计入覆盖"
  }
}
})(globalThis)

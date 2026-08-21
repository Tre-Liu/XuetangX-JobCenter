import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourcePath = "outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a/mapping_analysis.json";
const catalogPath = "work/job-occupation-mapping/osta_occupation_catalog.json";
const outputDir = "outputs/01a018f8-24d8-7651-b292-e4dc705bf026";
const outputPath = path.join(outputDir, "19条产业链岗位与职业匹配表.xlsx");
const sourceWorkbookPath = "outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a/岗位与产业节点关联表.xlsx";
const officialCatalogUrl = "https://www.osta.org.cn/career";
const officialAnnouncementUrl = "https://www.mohrss.gov.cn/SYrlzyhshbzb/dongtaixinwen/buneiyaowen/hyhd/202209/t20220929_487969.html";

const mappingAnalysis = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const catalogPayload = JSON.parse(await fs.readFile(catalogPath, "utf8"));

const cleanOccupationName = (value) => String(value ?? "")
  .replace(/(?:L\/S|S\/L|[LS])$/u, "")
  .trim();
const normalizeText = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[\s·•（）()]/gu, "")
  .replace(/／/gu, "/");

const occupationByName = new Map();
const occupationByCode = new Map();
for (const item of catalogPayload.records) {
  const name = cleanOccupationName(item.name);
  const occupation = {
    code: item.careerCode,
    name,
    smallCode: item.smallCode,
    smallName: item.smallName,
  };
  occupationByName.set(name, occupation);
  occupationByCode.set(item.careerCode, occupation);
}

function official(...names) {
  return names.map((name) => {
    const item = occupationByName.get(name);
    if (!item) throw new Error(`Official occupation not found: ${name}`);
    return item;
  });
}

const rules = [
  { id: "medical-internal", test: ({ title }) => /内科医生/u.test(title), occupations: official("内科医师") },
  { id: "medical-surgery", test: ({ title }) => /外科医生/u.test(title), occupations: official("外科医师") },
  { id: "medical-pediatrics", test: ({ title }) => /儿科医生/u.test(title), occupations: official("儿科医师") },
  { id: "medical-obstetrics", test: ({ title }) => /妇产科医生/u.test(title), occupations: official("妇产科医师") },
  { id: "medical-dentist", test: ({ title }) => /牙科医生/u.test(title), occupations: official("口腔科医师") },
  { id: "medical-ophthalmology", test: ({ title }) => /眼科医生/u.test(title), occupations: official("眼科医师") },
  { id: "medical-anesthesia", test: ({ title }) => /麻醉医生/u.test(title), occupations: official("麻醉科医师") },
  { id: "medical-nuclear", test: ({ title }) => /核医学/u.test(title), occupations: official("核医学科医师") },
  { id: "medical-imaging", test: ({ title }) => /超声影像|放射科/u.test(title), occupations: official("超声科医师", "放射科医师") },
  { id: "medical-tcm", test: ({ title }) => /中医科医生/u.test(title), occupations: official("中医内科医师") },
  { id: "medical-general", test: ({ title }) => /综合门诊|全科医生/u.test(title), occupations: official("全科医师") },
  { id: "medical-public-health", test: ({ title }) => /公共卫生|疾病控制/u.test(title), occupations: official("公共卫生医师") },
  { id: "medical-lab", test: ({ title }) => /医学检验|核酸检测/u.test(title), occupations: official("临床检验技师") },
  { id: "medical-pharmacy", test: ({ title }) => /药库主任|药剂师/u.test(title), occupations: official("药师") },
  { id: "medical-optometry", test: ({ title }) => /验光师/u.test(title), occupations: official("眼镜验光师") },
  { id: "medical-care", test: ({ title }) => /^护工$/u.test(title), occupations: official("医疗护理员") },
  { id: "medical-childcare", test: ({ title }) => /育婴师|保育员/u.test(title), occupations: official("保育师") },
  { id: "medical-rehab", test: ({ title }) => /理疗师/u.test(title), occupations: official("康复技师") },
  { id: "medical-research", test: ({ title }) => /病理研究员|临床研究员/u.test(title), occupations: official("医学研究人员") },
  { id: "pharma-rd", test: ({ title }) => /制剂研究|药物分析研究|药物合成|有机合成|药理研究|试剂研发|生物工程|生物制药|细胞培养|医药技术研发/u.test(title), occupations: official("制药工程技术人员", "医学研究人员") },
  { id: "pharma-production", test: ({ title }) => /药品生产|药物制剂/u.test(title), occupations: official("制药工程技术人员", "药物制剂工") },
  { id: "medical-device-rd", test: ({ title }) => /医疗器械研发/u.test(title), occupations: official("机械设计工程技术人员", "医疗器械装配工") },
  { id: "medical-device-quality", test: ({ title }) => /医疗器械生产|医疗器械.*质量/u.test(title), occupations: official("质量管理工程技术人员", "医疗器械装配工") },
  { id: "medical-device-repair", test: ({ title }) => /医疗器械维修/u.test(title), occupations: official("医疗器械装配工", "设备点检员") },

  { id: "food-chinese-cook", test: ({ title }) => /中餐厨师|日式厨师|厨师助理|行政主厨|厨师长/u.test(title), occupations: official("中式烹调师") },
  { id: "food-western-cook", test: ({ title }) => /西餐厨师/u.test(title), occupations: official("西式烹调师") },
  { id: "food-pastry", test: ({ title }) => /西点师/u.test(title), occupations: official("西式面点师", "糕点面包烘焙师") },
  { id: "food-noodle", test: ({ title }) => /^面点师$/u.test(title), occupations: official("中式面点师") },
  { id: "food-coffee", test: ({ title }) => /咖啡师/u.test(title), occupations: official("咖啡师") },
  { id: "food-tea", test: ({ title }) => /茶艺师/u.test(title), occupations: official("茶艺师") },
  { id: "food-drinks", test: ({ title }) => /调饮师/u.test(title), occupations: official("调饮师") },
  { id: "food-safety", test: ({ title }) => /食品安全管理师/u.test(title), occupations: official("食品安全管理师") },
  { id: "food-rd", test: ({ title }) => /食品\/饮料研发/u.test(title), occupations: official("食品工程技术人员") },

  { id: "smart-driving-test", test: ({ title }) => /智能驾驶测试/u.test(title), occupations: official("人工智能工程技术人员", "汽车工程技术人员", "计算机软件测试员") },
  { id: "smart-driving", test: ({ title }) => /智能驾驶工程师/u.test(title), occupations: official("人工智能工程技术人员", "汽车工程技术人员") },
  { id: "ai-training", test: ({ title }) => /数据标注师|人工智能训练/u.test(title), occupations: official("人工智能训练师") },
  { id: "ai-engineering", test: ({ title }) => /机器学习|深度学习|机器视觉|算法工程师|自然语言处理|语音识别/u.test(title), occupations: official("人工智能工程技术人员") },
  { id: "data-bi", test: ({ title }) => /\bbi工程师\b|数据分析师|数据分析经理|临床数据分析/u.test(title), occupations: official("数据分析处理工程技术人员", "商务数据分析师") },
  { id: "data-engineering", test: ({ title }) => /etl开发|数据仓库|数据开发|数据采集|数据治理|爬虫工程师/u.test(title), occupations: official("大数据工程技术人员", "计算机软件工程技术人员") },
  { id: "database", test: ({ title }) => /dba运维/u.test(title), occupations: official("数据库运行管理员", "信息系统运行维护工程技术人员") },
  { id: "software-testing", test: ({ title }) => /功能测试|性能测试|自动化测试|测试工程师|测试开发|测试经理|软件测试|游戏测试/u.test(title), occupations: official("计算机软件测试员") },
  { id: "cybersecurity", test: ({ title }) => /网络安全工程师|安防系统工程师|电子数据取证分析师|密码技术应用员/u.test(title), occupations: official("信息安全工程技术人员", "网络与信息安全管理员") },
  { id: "network-engineering", test: ({ title }) => /^网络工程师$|通信网络工程师/u.test(title), occupations: official("计算机网络工程技术人员", "通信工程技术人员") },
  { id: "system-ops", test: ({ title }) => /自动化运维|it技术支持|首席信息官cio/u.test(title), occupations: official("信息系统运行维护工程技术人员") },
  { id: "embedded-software", test: ({ title }) => /嵌入式软件/u.test(title), occupations: official("嵌入式系统设计工程技术人员", "计算机软件工程技术人员") },
  { id: "embedded-hardware", test: ({ title }) => /嵌入式硬件/u.test(title), occupations: official("嵌入式系统设计工程技术人员", "电子元器件工程技术人员") },
  { id: "blockchain", test: ({ title }) => /区块链开发/u.test(title), occupations: official("区块链工程技术人员", "计算机软件工程技术人员") },
  { id: "vr-development", test: ({ title }) => /u3d前端|ue4前端|cocos前端|ar\/vr产品/u.test(title), occupations: official("虚拟现实工程技术人员", "计算机软件工程技术人员") },
  { id: "game-development", test: ({ title }) => /游戏开发工程师/u.test(title), occupations: official("虚拟现实工程技术人员", "计算机软件工程技术人员") },
  { id: "software-development", test: ({ title }) => /后端开发|前端开发|移动开发|全栈工程师|软件工程师|架构师|鸿蒙系统开发|语音\/视频\/图形开发|gis工程师/u.test(title), occupations: official("计算机软件工程技术人员", "计算机程序设计员") },

  { id: "integrated-circuit", test: ({ title, chain }) => /半导体|芯片|eda工程师|fpga|ic版图|ic验证|集成电路ic设计|数字前端工程师|数字后端工程师/u.test(title) && /半导体|集成电路|软件/u.test(chain), occupations: official("集成电路工程技术人员", "电子元器件工程技术人员") },
  { id: "radio-frequency", test: ({ title }) => /射频工程师/u.test(title), occupations: official("电子元器件工程技术人员", "通信工程技术人员") },
  { id: "iot", test: ({ title }) => /iot产品|车联网/u.test(title), occupations: official("物联网工程技术人员", "嵌入式系统设计工程技术人员") },
  { id: "smart-hardware-install", test: ({ title }) => /智能硬件装调员/u.test(title), occupations: official("物联网安装调试员", "电子设备装接工") },
  { id: "electronics", test: ({ title }) => /pcb工程师|smt工程师|电子元器件工程师|电子工程师|电子工艺工程师|电子设备工程师|电子软件开发|电路工程师|硬件工程师|高级硬件工程师|硬件测试工程师|家用电器\/数码产品研发|变压器与磁电/u.test(title), occupations: official("电子元器件工程技术人员") },

  { id: "robot-debug", test: ({ title }) => /机器人调试工程师/u.test(title), occupations: official("机器人工程技术人员", "工业机器人系统运维员") },
  { id: "robot-service", test: ({ title }) => /服务机器人应用技术员/u.test(title), occupations: official("服务机器人应用技术员", "机器人工程技术人员") },
  { id: "robot-general", test: ({ title }) => /机器人工程|机器人开发/u.test(title), occupations: official("机器人工程技术人员") },

  { id: "cnc-operation", test: ({ title }) => /cnc\/数控操机/u.test(title), occupations: official("多工序数控机床操作调整工", "机械制造工程技术人员") },
  { id: "cnc-programming", test: ({ title }) => /cnc\/数控编程/u.test(title), occupations: official("机械制造工程技术人员", "计算机程序设计员") },
  { id: "lathe", test: ({ title }) => /^车工$/u.test(title), occupations: official("车工") },
  { id: "milling", test: ({ title }) => /^铣工$/u.test(title), occupations: official("铣工") },
  { id: "welding-worker", test: ({ title }) => /^焊工$|氩弧焊工/u.test(title), occupations: official("焊工") },
  { id: "welding-engineer", test: ({ title }) => /焊接工程师|焊接工艺工程师/u.test(title), occupations: official("机械制造工程技术人员", "焊工") },
  { id: "fitter", test: ({ title }) => /^钳工$/u.test(title), occupations: official("装配钳工", "机修钳工") },
  { id: "machine-repair", test: ({ title }) => /机修工|机械维修\/保养/u.test(title), occupations: official("机修钳工", "设备点检员") },
  { id: "elevator", test: ({ title }) => /电梯工/u.test(title), occupations: official("电梯安装维修工") },
  { id: "mechanical-project", test: ({ title }) => /机械项目管理/u.test(title), occupations: official("机械制造工程技术人员", "项目管理工程技术人员") },
  { id: "mechanical-design", test: ({ title }) => /机械设计|机械研发|机械结构|机械制图|模具设计|模具工程师/u.test(title), occupations: official("机械设计工程技术人员") },
  { id: "mechanical-manufacturing", test: ({ title }) => /机械工程师|机械产品|机械装配|机械设备|工业工程师|冲压工程师|冲压工艺|注塑工程师|机电工程师/u.test(title), occupations: official("机械制造工程技术人员") },

  { id: "bim", test: ({ title }) => /bim工程师/u.test(title), occupations: official("建筑信息模型技术员", "土木建筑工程技术人员") },
  { id: "construction-cost", test: ({ title }) => /工程造价|预结算/u.test(title), occupations: official("工程造价工程技术人员") },
  { id: "survey", test: ({ title }) => /测绘\/测量/u.test(title), occupations: official("工程测量工程技术人员", "工程测量员") },
  { id: "landscape", test: ({ title }) => /园艺\/园林\/景观设计/u.test(title), occupations: official("风景园林工程技术人员", "园林绿化工程技术人员") },
  { id: "construction-design", test: ({ title }) => /城市规划设计|建筑制图|建筑设计师|建筑结构设计|建筑机电设计|暖通设计|给排水设计|幕墙设计|钢结构设计/u.test(title), occupations: official("建筑和市政设计工程技术人员") },
  { id: "civil-engineering", test: ({ title }) => /建筑工程师|高级建筑工程师|结构\/土木\/土建|岩土工程|公路\/桥梁\/港口\/隧道|市政工程师|施工员|工程监理|建筑工程验收/u.test(title), occupations: official("土木建筑工程技术人员") },
  { id: "construction-management", test: ({ title }) => /建筑工程管理|建筑项目助理/u.test(title), occupations: official("土木建筑工程技术人员", "项目管理工程技术人员") },
  { id: "safety-ehs", test: ({ title }) => /ehs安全|施工安全员|生产安全员|消防安全/u.test(title), occupations: official("安全生产管理工程技术人员", "健康安全环境工程技术人员") },

  { id: "power-photovoltaic", test: ({ title }) => /光伏系统工程师/u.test(title), occupations: official("发电工程技术人员", "光伏发电运维值班员") },
  { id: "power-engineer", test: ({ title }) => /^电力工程师$/u.test(title), occupations: official("电力工程安装工程技术人员", "发电工程技术人员") },
  { id: "electrical-engineer", test: ({ title }) => /电气工程师|电气\/电器工程师|电池\/电源开发|变压器与磁电/u.test(title), occupations: official("电工电器工程技术人员") },
  { id: "new-energy-battery", test: ({ title }) => /新能源电池工程师/u.test(title), occupations: official("汽车工程技术人员", "电工电器工程技术人员", "电池制造工") },
  { id: "new-energy-control", test: ({ title }) => /新能源电机工程师|新能源电控工程师/u.test(title), occupations: official("汽车工程技术人员", "电工电器工程技术人员") },

  { id: "auto-smart", test: ({ title }) => /车联网工程师/u.test(title), occupations: official("汽车工程技术人员", "物联网工程技术人员") },
  { id: "auto-quality", test: ({ title }) => /汽车质量工程师|汽车检验\/检测|汽车试验工程师|汽车安全性能/u.test(title), occupations: official("汽车工程技术人员", "质量管理工程技术人员") },
  { id: "auto-repair", test: ({ title }) => /汽车维修|汽车喷漆|汽车钣金|汽车电工|汽车改装/u.test(title), occupations: official("汽车维修工") },
  { id: "auto-engineering", test: ({ title }) => /动力总成|发动机匹配|汽车\/摩托车工程师|汽车标定|汽车电子工程师|汽车结构工程师|汽车装配工艺|汽车设计工程师|汽车项目管理|总装工程师/u.test(title), occupations: official("汽车工程技术人员") },

  { id: "communications", test: ({ title }) => /光通信|基站工程师|核心网|无线通信|有线传输|数据通信|通信技术|通信测试|通信电源|通信设备|通信项目管理|通信产品/u.test(title), occupations: official("通信工程技术人员") },

  { id: "environment-monitor", test: ({ title }) => /环保检测|水质检测员/u.test(title), occupations: official("环境监测工程技术人员", "环境监测员") },
  { id: "environment-water", test: ({ title }) => /水处理工程师/u.test(title), occupations: official("健康安全环境工程技术人员", "污水处理工") },
  { id: "environment-solid", test: ({ title }) => /固废工程师/u.test(title), occupations: official("健康安全环境工程技术人员", "工业固体废物处理处置工") },
  { id: "environment-general", test: ({ title }) => /环保工程师|废气处理工程师/u.test(title), occupations: official("健康安全环境工程技术人员") },
  { id: "environment-ecology", test: ({ title }) => /生态治理\/规划/u.test(title), occupations: official("土地整治与生态修复工程技术人员") },

  { id: "chemical-lab", test: ({ title }) => /化工实验室|化学分析测试员/u.test(title), occupations: official("化工实验工程技术人员") },
  { id: "chemical-engineering", test: ({ title }) => /化工技术应用|塑料工程师|涂料研发/u.test(title), occupations: official("化工生产工程技术人员", "化工实验工程技术人员") },
  { id: "oil-gas", test: ({ title }) => /石油天然气技术人员/u.test(title), occupations: official("石油天然气开采工程技术人员", "石油天然气储运工程技术人员") },

  { id: "textile-design", test: ({ title }) => /服装\/纺织设计|服装\/纺织设计总监/u.test(title), occupations: official("服装设计人员", "纺织面料设计师") },
  { id: "textile-material", test: ({ title }) => /面料辅料开发/u.test(title), occupations: official("纺织工程技术人员", "纺织面料设计师") },
  { id: "textile-process", test: ({ title }) => /服装\/纺织\/皮革工艺师|服装纺织质检员/u.test(title), occupations: official("纺织工程技术人员", "质量管理工程技术人员") },
  { id: "textile-spinning", test: ({ title }) => /^纺织工$|^细纱工$|^挡车工$/u.test(title), occupations: official("纺纱工") },
  { id: "textile-warping", test: ({ title }) => /^整经工$/u.test(title), occupations: official("整经工") },
  { id: "textile-sizing", test: ({ title }) => /^浆纱工$/u.test(title), occupations: official("浆纱浆染工") },
  { id: "textile-printing", test: ({ title }) => /^印染工$/u.test(title), occupations: official("纺织染色工") },
  { id: "textile-cutting", test: ({ title }) => /^裁剪工$/u.test(title), occupations: official("裁剪工") },
  { id: "textile-sewing", test: ({ title }) => /^缝纫工$/u.test(title), occupations: official("缝纫工") },

  { id: "aviation-flight", test: ({ title }) => /飞机机长|副机长/u.test(title), occupations: official("飞行驾驶员") },
  { id: "aviation-attendant", test: ({ title, chain }) => /空乘人员|乘务员/u.test(title) && /空天|低空/u.test(chain), occupations: official("民航乘务员") },
  { id: "aviation-design", test: ({ title }) => /飞行器设计与制造/u.test(title), occupations: official("飞行器设计工程技术人员", "飞机装配工", "飞机系统安装调试工") },
  { id: "aviation-repair", test: ({ title }) => /飞机维修机械师/u.test(title), occupations: official("民用航空器维修与适航工程技术人员", "航空器机械维护员") },

  { id: "content-writer", test: ({ title }) => /作家\/撰稿人/u.test(title), occupations: official("文学作家") },
  { id: "content-screenwriter", test: ({ title }) => /^编剧$/u.test(title), occupations: official("剧作家") },
  { id: "content-director", test: ({ title }) => /导演\/编导/u.test(title), occupations: official("导演") },
  { id: "content-photography", test: ({ title }) => /摄影师\/摄像师/u.test(title), occupations: official("商业摄影师", "电视摄像员") },
  { id: "print-prepress", test: ({ title }) => /印刷排版\/制版/u.test(title), occupations: official("印前处理和制作员") },
  { id: "data-product", test: ({ title }) => /数据产品经理/u.test(title), occupations: official("信息系统分析工程技术人员", "大数据工程技术人员") },
  { id: "product-operation", test: ({ title }) => /^产品运营$/u.test(title), occupations: official("用户增长运营师", "互联网营销师") },
  { id: "property-management", test: ({ title }) => /物业管理专员|物业管理主管|物业管理经理|物业设施管理人员/u.test(title), occupations: official("物业管理师") },
  { id: "intelligence-analysis", test: ({ title }) => /情报信息分析人员/u.test(title), occupations: official("数据分析处理工程技术人员") },

  { id: "ecommerce", test: ({ title }) => /国内电商运营|跨境电商运营|电商专员|电商产品经理|电商总监|电商经理|网络销售|在线销售|店铺推广/u.test(title), occupations: official("电子商务师", "互联网营销师") },
  { id: "live-media", test: ({ title }) => /新媒体运营|直播助理|直播场控|直播运营|直播销售|用户运营/u.test(title), occupations: official("全媒体运营师", "互联网营销师") },
  { id: "marketing-online", test: ({ title }) => /seo\/sem|网络推广|互联网营销师/u.test(title), occupations: official("互联网营销师") },
  { id: "visual-design", test: ({ title }) => /ui设计|交互设计|网页设计|平面设计|视觉设计|广告创意\/设计|排版设计|美工\/电商设计/u.test(title), occupations: official("视觉传达设计人员") },
  { id: "digital-media", test: ({ title }) => /动画\/3d设计|多媒体设计|后期制作|视频剪辑|游戏动作设计|游戏动画师|游戏原画师|游戏场景设计|游戏特效设计|游戏界面设计|游戏角色设计|ue4特效师|特效设计师|原画师/u.test(title), occupations: official("数字媒体艺术专业人员") },
  { id: "reporter", test: ({ title }) => /^记者$/u.test(title), occupations: official("文字记者", "摄影记者") },
  { id: "editor", test: ({ title }) => /^编辑$|出版\/发行/u.test(title), occupations: official("网络编辑") },
];

const confidenceBonus = { "高": 12, "中": 6, "低": 0 };
const grouped = new Map();
for (const relation of mappingAnalysis.mappingRows) {
  const { job, node } = relation;
  const key = [job.id, node.chainName, node.stage, node.nodeName].join("||");
  if (!grouped.has(key)) {
    grouped.set(key, {
      jobId: job.id,
      positionId: job.position_id,
      title: String(job.position_name).trim(),
      chain: node.chainName,
      stage: node.stage,
      node: node.nodeName,
      relations: [],
    });
  }
  grouped.get(key).relations.push(relation);
}

const chainOrder = [...new Set(mappingAnalysis.nodes.map((item) => item.chainName))];
const stageOrder = new Map([["上游", 0], ["中游", 1], ["下游", 2]]);

function directOfficialMatch(title) {
  const exact = occupationByName.get(title);
  if (exact) return [exact];
  return [];
}

function bestSourceOccupations(group) {
  const scores = new Map();
  for (const relation of group.relations) {
    const code = relation.job.primary_occupation_code;
    const officialItem = occupationByCode.get(code);
    if (!officialItem) continue;
    const score = Number(relation.relevanceScore || 0) + (confidenceBonus[relation.confidence] || 0);
    const current = scores.get(code) || { occupation: officialItem, score: -1, count: 0 };
    current.score = Math.max(current.score, score);
    current.count += 1;
    scores.set(code, current);
  }
  return [...scores.values()]
    .sort((a, b) => (b.score - a.score) || (b.count - a.count) || a.occupation.code.localeCompare(b.occupation.code))
    .map((item) => item.occupation);
}

const groups = [];
for (const group of grouped.values()) {
  const context = {
    title: normalizeText(group.title),
    chain: normalizeText(group.chain),
    stage: group.stage,
    node: normalizeText(group.node),
  };
  const sourceOccupations = bestSourceOccupations(group);
  const direct = directOfficialMatch(group.title);
  const matchedRule = rules.find((rule) => rule.test(context));
  let finalOccupations;
  let basis;
  if (direct.length) {
    finalOccupations = direct;
    basis = "职业名称直接命中";
  } else if (matchedRule) {
    finalOccupations = matchedRule.occupations;
    basis = `规则校正：${matchedRule.id}`;
  } else {
    finalOccupations = sourceOccupations.slice(0, 1);
    basis = "沿用岗位主表职业映射";
  }

  const deduped = [];
  const seen = new Set();
  for (const occupation of finalOccupations) {
    if (!seen.has(occupation.code)) {
      deduped.push(occupation);
      seen.add(occupation.code);
    }
  }
  if (!deduped.length) throw new Error(`No occupation for ${group.title}`);

  const sourceCodes = new Set(sourceOccupations.map((item) => item.code));
  const finalCodes = new Set(deduped.map((item) => item.code));
  const relationScores = group.relations.map((item) => Number(item.relevanceScore || 0));
  const relationConfidences = group.relations.map((item) => item.confidence);
  const changed = [...sourceCodes].some((code) => !finalCodes.has(code)) || [...finalCodes].some((code) => !sourceCodes.has(code));
  const reviewReasons = [];
  if (sourceOccupations.length > 1) reviewReasons.push("同名岗位源职业不一致，已按职业任务重新归并");
  if (changed && matchedRule) reviewReasons.push("已纠正或补充源职业映射");
  if (relationConfidences.includes("低")) reviewReasons.push("原岗位—产业环节关系含低置信记录");
  if (Math.max(...relationScores) < 70) reviewReasons.push("原岗位—产业环节最高相关度低于70分");
  if (!matchedRule && !direct.length && Math.max(...relationScores) < 75) reviewReasons.push("职业沿用源表且产业关系证据偏弱");

  groups.push({
    ...group,
    context,
    occupations: deduped,
    sourceOccupations,
    basis,
    maxRelationScore: Math.max(...relationScores),
    confidence: relationConfidences.includes("高") ? "高" : relationConfidences.includes("中") ? "中" : "低",
    reviewReasons,
  });
}

groups.sort((a, b) => {
  return (chainOrder.indexOf(a.chain) - chainOrder.indexOf(b.chain))
    || ((stageOrder.get(a.stage) ?? 99) - (stageOrder.get(b.stage) ?? 99))
    || a.node.localeCompare(b.node, "zh-CN")
    || a.title.localeCompare(b.title, "zh-CN")
    || String(a.positionId).localeCompare(String(b.positionId), "zh-CN");
});

const flatRows = [];
for (const [groupIndex, group] of groups.entries()) {
  const groupId = `G${String(groupIndex + 1).padStart(4, "0")}`;
  const chainStage = `${group.chain}｜${group.stage}｜${group.node}`;
  for (const [occupationIndex, occupation] of group.occupations.entries()) {
    flatRows.push({
      groupId,
      group,
      chainStage,
      occupation,
      occupationIndex,
    });
  }
}

const displayGroupMap = new Map();
for (const group of groups) {
  const occupationKey = group.occupations.map((item) => item.code).sort().join(";");
  const key = [group.title, group.chain, group.stage, group.node, occupationKey].join("||");
  if (!displayGroupMap.has(key)) {
    displayGroupMap.set(key, {
      title: group.title,
      chain: group.chain,
      stage: group.stage,
      node: group.node,
      occupations: group.occupations,
      sourceGroups: [],
      jobIds: [],
      positionIds: [],
    });
  }
  const displayGroup = displayGroupMap.get(key);
  displayGroup.sourceGroups.push(group);
  if (!displayGroup.jobIds.includes(group.jobId)) displayGroup.jobIds.push(group.jobId);
  if (!displayGroup.positionIds.includes(group.positionId)) displayGroup.positionIds.push(group.positionId);
}

const displayGroups = [...displayGroupMap.values()];
const mappingRows = [];
for (const [displayIndex, displayGroup] of displayGroups.entries()) {
  displayGroup.displayGroupId = `M${String(displayIndex + 1).padStart(4, "0")}`;
  displayGroup.positionIdText = displayGroup.positionIds.join("；");
  for (const sourceGroup of displayGroup.sourceGroups) sourceGroup.displayGroupId = displayGroup.displayGroupId;
  const chainStage = `${displayGroup.chain}｜${displayGroup.stage}｜${displayGroup.node}`;
  for (const [occupationIndex, occupation] of displayGroup.occupations.entries()) {
    mappingRows.push({ displayGroup, chainStage, occupation, occupationIndex });
  }
}

const workbook = Workbook.create();
const summarySheet = workbook.worksheets.add("说明与统计");
const mappingSheet = workbook.worksheets.add("岗位-职业匹配表");
const detailSheet = workbook.worksheets.add("匹配明细（不合并）");
const dictionarySheet = workbook.worksheets.add("职业字典（本表使用）");
for (const sheet of [summarySheet, mappingSheet, detailSheet, dictionarySheet]) {
  sheet.showGridLines = false;
}

const colors = {
  navy: "#15324A",
  blue: "#1F5A7A",
  teal: "#167C80",
  paleBlue: "#EAF3F8",
  paleTeal: "#E9F5F4",
  paleGold: "#FFF6DC",
  white: "#FFFFFF",
  text: "#243746",
  muted: "#5D6B78",
  border: "#CBD6DE",
  groupAlt: "#F7FAFC",
};

function styleTitle(sheet, title, subtitle, endColumn) {
  sheet.getRange(`A1:${endColumn}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A2:${endColumn}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A1:${endColumn}1`).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  sheet.getRange(`A2:${endColumn}2`).format = {
    fill: colors.paleBlue,
    font: { color: colors.muted, size: 10 },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange("1:1").format.rowHeight = 34;
  sheet.getRange("2:2").format.rowHeight = 34;
}

function styleHeader(range) {
  range.format = {
    fill: colors.blue,
    font: { bold: true, color: colors.white, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.border },
  };
}

styleTitle(
  mappingSheet,
  "19条产业链岗位—职业匹配表",
  "完全相同的岗位映射已合并，多个源岗位编号集中列示；同一岗位对应多个职业时分行展示，并纵向合并前三列。",
  "E",
);
mappingSheet.getRange("A3:E3").values = [["岗位名称", "岗位编号", "所在产业链-产业环节", "对应职业", "职业编码"]];
styleHeader(mappingSheet.getRange("A3:E3"));
mappingSheet.getRange("3:3").format.rowHeight = 30;

const mappingValues = mappingRows.map((row) => [
  row.occupationIndex === 0 ? row.displayGroup.title : null,
  row.occupationIndex === 0 ? row.displayGroup.positionIdText : null,
  row.occupationIndex === 0 ? row.chainStage : null,
  row.occupation.name,
  row.occupation.code,
]);
const mappingLastRow = mappingValues.length + 3;
mappingSheet.getRange(`A4:E${mappingLastRow}`).values = mappingValues;
mappingSheet.getRange(`A4:E${mappingLastRow}`).format = {
  font: { color: colors.text, size: 9 },
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "inside", style: "thin", color: colors.border },
};
mappingSheet.getRange(`B4:B${mappingLastRow}`).format.horizontalAlignment = "center";
mappingSheet.getRange(`E4:E${mappingLastRow}`).format.horizontalAlignment = "center";
mappingSheet.getRange(`A4:C${mappingLastRow}`).format.verticalAlignment = "center";

let mappingCursor = 4;
for (const [groupIndex, group] of displayGroups.entries()) {
  const start = mappingCursor;
  const end = mappingCursor + group.occupations.length - 1;
  if (end > start) {
    mappingSheet.getRange(`A${start}:A${end}`).merge();
    mappingSheet.getRange(`B${start}:B${end}`).merge();
    mappingSheet.getRange(`C${start}:C${end}`).merge();
  }
  if (groupIndex % 2 === 1) mappingSheet.getRange(`A${start}:E${end}`).format.fill = colors.groupAlt;
  mappingSheet.getRange(`A${end}:E${end}`).format.borders = {
    bottom: { style: "medium", color: colors.border },
  };
  mappingCursor = end + 1;
}
mappingSheet.freezePanes.freezeRows(3);
mappingSheet.freezePanes.freezeColumns(3);
mappingSheet.getRange(`A4:E${mappingLastRow}`).format.rowHeight = 27;
mappingSheet.getRange(`A1:A${mappingLastRow}`).format.columnWidthPx = 185;
mappingSheet.getRange(`B1:B${mappingLastRow}`).format.columnWidthPx = 185;
mappingSheet.getRange(`C1:C${mappingLastRow}`).format.columnWidthPx = 350;
mappingSheet.getRange(`D1:D${mappingLastRow}`).format.columnWidthPx = 230;
mappingSheet.getRange(`E1:E${mappingLastRow}`).format.columnWidthPx = 120;

styleTitle(
  detailSheet,
  "岗位—职业匹配明细（不合并）",
  "该页保留全部源岗位记录，并通过主表合并组ID关联合并后的主表岗位，可用于筛选、排序及追溯。",
  "I",
);
const detailHeaders = ["主表合并组ID", "源关系组ID", "岗位记录ID", "岗位编号", "岗位名称", "所在产业链-产业环节", "对应职业", "职业编码", "匹配依据"];
detailSheet.getRange("A3:I3").values = [detailHeaders];
styleHeader(detailSheet.getRange("A3:I3"));
const detailValues = flatRows.map((row) => [
  row.group.displayGroupId,
  row.groupId,
  row.group.jobId,
  row.group.positionId,
  row.group.title,
  row.chainStage,
  row.occupation.name,
  row.occupation.code,
  row.group.basis,
]);
const detailLastRow = detailValues.length + 3;
detailSheet.getRange(`A4:I${detailLastRow}`).values = detailValues;
detailSheet.tables.add(`A3:I${detailLastRow}`, true, "JobOccupationDetailTable").style = "TableStyleMedium2";
detailSheet.getRange(`A4:I${detailLastRow}`).format = { font: { size: 9 }, verticalAlignment: "center", wrapText: true };
detailSheet.freezePanes.freezeRows(3);
detailSheet.freezePanes.freezeColumns(5);
const detailWidths = [100, 90, 100, 115, 180, 350, 220, 110, 260];
detailWidths.forEach((width, index) => detailSheet.getRangeByIndexes(0, index, detailLastRow, 1).format.columnWidthPx = width);

const usedOccupations = [...new Map(flatRows.map((row) => [row.occupation.code, row.occupation])).values()]
  .sort((a, b) => a.code.localeCompare(b.code));
styleTitle(
  dictionarySheet,
  "职业字典（本表使用）",
  "仅列出匹配表实际使用的职业；职业名称中的数字职业/绿色职业标识已从展示名中去除，职业编码保持官方原值。",
  "E",
);
dictionarySheet.getRange("A3:E3").values = [["职业名称", "职业编码", "所属小类", "分类版本", "来源URL"]];
styleHeader(dictionarySheet.getRange("A3:E3"));
const dictionaryValues = usedOccupations.map((item) => [item.name, item.code, `${item.smallCode} ${item.smallName}`, "2022年版（versionId=2）", officialCatalogUrl]);
const dictionaryLastRow = dictionaryValues.length + 3;
dictionarySheet.getRange(`A4:E${dictionaryLastRow}`).values = dictionaryValues;
dictionarySheet.tables.add(`A3:E${dictionaryLastRow}`, true, "UsedOccupationDictionaryTable").style = "TableStyleMedium2";
dictionarySheet.getRange(`A4:E${dictionaryLastRow}`).format = { font: { size: 9 }, verticalAlignment: "center", wrapText: true };
dictionarySheet.freezePanes.freezeRows(3);
const dictionaryWidths = [240, 120, 280, 170, 410];
dictionaryWidths.forEach((width, index) => dictionarySheet.getRangeByIndexes(0, index, dictionaryLastRow, 1).format.columnWidthPx = width);

styleTitle(
  summarySheet,
  "19条产业链岗位—职业匹配说明与统计",
  "范围：项目现有19条产业链岗位—产业节点关系；职业口径：中华人民共和国职业分类大典（2022年版）。",
  "H",
);
summarySheet.getRange("A4:H4").values = [["产业链数", null, "匹配岗位记录", null, "岗位-产业关系", null, "岗位-职业行数", null]];
summarySheet.getRange("A7:H7").values = [["唯一岗位名称", null, "合并后岗位关系", null, "使用职业数", null, "源记录保留率", null]];
const summaryLabels = ["A4:B4", "C4:D4", "E4:F4", "G4:H4", "A7:B7", "C7:D7", "E7:F7", "G7:H7"];
for (const rangeAddress of summaryLabels) summarySheet.getRange(rangeAddress).merge();
summarySheet.getRange("A5:B5").merge();
summarySheet.getRange("C5:D5").merge();
summarySheet.getRange("E5:F5").merge();
summarySheet.getRange("G5:H5").merge();
summarySheet.getRange("A8:B8").merge();
summarySheet.getRange("C8:D8").merge();
summarySheet.getRange("E8:F8").merge();
summarySheet.getRange("G8:H8").merge();
summarySheet.getRange("A5").values = [[chainOrder.length]];
summarySheet.getRange("C5").values = [[new Set(groups.map((group) => group.jobId)).size]];
summarySheet.getRange("E5").values = [[groups.length]];
summarySheet.getRange("G5").formulas = [[`=COUNTA('岗位-职业匹配表'!$D$4:$D$${mappingLastRow})`]];
summarySheet.getRange("A8").values = [[new Set(groups.map((group) => normalizeText(group.title))).size]];
summarySheet.getRange("C8").values = [[displayGroups.length]];
summarySheet.getRange("E8").formulas = [[`=COUNTA('职业字典（本表使用）'!$A$4:$A$${dictionaryLastRow})`]];
summarySheet.getRange("G8").formulas = [[`=C5/${mappingAnalysis.stats.matchedJobCount}`]];
for (const rangeAddress of ["A4:B4", "C4:D4", "E4:F4", "G4:H4", "A7:B7", "C7:D7", "E7:F7", "G7:H7"]) {
  summarySheet.getRange(rangeAddress).format = {
    fill: colors.paleBlue,
    font: { bold: true, color: colors.navy, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.border },
  };
}
for (const rangeAddress of ["A5:B5", "C5:D5", "E5:F5", "G5:H5", "A8:B8", "C8:D8", "E8:F8", "G8:H8"]) {
  summarySheet.getRange(rangeAddress).format = {
    fill: colors.white,
    font: { bold: true, color: colors.teal, size: 16 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.border },
    numberFormat: "#,##0",
  };
}
summarySheet.getRange("G8:H8").format.numberFormat = "0%";
summarySheet.getRange("A10:H10").merge();
summarySheet.getRange("A10").values = [["口径、方法与限制"]];
summarySheet.getRange("A10:H10").format = { fill: colors.teal, font: { bold: true, color: colors.white, size: 11 }, verticalAlignment: "center" };
const notes = [
  ["岗位范围", `源岗位库共${mappingAnalysis.stats.jobCount}条岗位记录，其中${mappingAnalysis.stats.matchedJobCount}条岗位记录匹配到19条产业链；形成${mappingAnalysis.mappingRows.length}条源岗位—产业节点关系。`],
  ["职业口径", "职业名称和编码按人社部门职业分类系统的2022版（versionId=2）核验；不使用招聘网站自建职业编码。"],
  ["多职业规则", "当岗位职责横跨两个或多个国家职业活动范围时分行列示；每个岗位—产业环节组最多列出3个核心职业。"],
  ["重复合并规则", `主表按“岗位名称+产业链环节+对应职业集合”合并完全相同的岗位映射；${groups.length}条源关系合并为${displayGroups.length}条主表岗位关系。`],
  ["编号与追溯", `被合并岗位的多个岗位编号在主表集中列示；明细页保留全部${mappingAnalysis.stats.matchedJobCount}个岗位ID和${groups.length}条源关系，并记录主表合并组ID。`],
  ["质量处理", "已针对源表中厨师、医疗、网络安全、集成电路、数控、纺织等明显职业错配进行规则校正；职业不同的同名岗位不强制合并。"],
  ["使用限制", "本表用于专业建设、课程与岗位分析，不等同于职业资格认定、职业技能等级认定或用人单位岗位定级结论。"],
  ["岗位产业来源", sourceWorkbookPath],
  ["官方职业系统", officialCatalogUrl],
  ["官方颁布说明", officialAnnouncementUrl],
];
summarySheet.getRange("A11:A20").values = notes.map((row) => [row[0]]);
summarySheet.getRange("B11:H20").merge(true);
summarySheet.getRange("B11:B20").values = notes.map((row) => [row[1]]);
summarySheet.getRange("A11:A20").format = { fill: colors.paleTeal, font: { bold: true, color: colors.navy, size: 9 }, verticalAlignment: "top", wrapText: true };
summarySheet.getRange("B11:H20").format = { font: { color: colors.text, size: 9 }, verticalAlignment: "top", wrapText: true, borders: { preset: "inside", style: "thin", color: colors.border } };

summarySheet.getRange("A22:D22").values = [["标准产业链", "源岗位-产业关系", "合并后岗位关系", "主表岗位-职业行"]];
styleHeader(summarySheet.getRange("A22:D22"));
summarySheet.getRange("A23:A41").values = chainOrder.map((chain) => [chain]);
summarySheet.getRange("B23:B41").values = chainOrder.map((chain) => [groups.filter((group) => group.chain === chain).length]);
summarySheet.getRange("C23:C41").values = chainOrder.map((chain) => [displayGroups.filter((group) => group.chain === chain).length]);
summarySheet.getRange("D23:D41").values = chainOrder.map((chain) => [mappingRows.filter((row) => row.displayGroup.chain === chain).length]);
summarySheet.tables.add("A22:D41", true, "ChainSummaryTable").style = "TableStyleMedium2";
summarySheet.getRange("B23:D41").format.numberFormat = "#,##0";
summarySheet.freezePanes.freezeRows(2);
summarySheet.getRange("4:8").format.rowHeight = 28;
summarySheet.getRange("10:10").format.rowHeight = 28;
summarySheet.getRange("11:20").format.rowHeight = 34;
summarySheet.getRange("A1:A41").format.columnWidthPx = 185;
for (let col = 1; col < 8; col += 1) summarySheet.getRangeByIndexes(0, col, 41, 1).format.columnWidthPx = 120;

await fs.mkdir(outputDir, { recursive: true });

const inspections = {
  summary: await workbook.inspect({
    kind: "table",
    range: "说明与统计!A1:H16",
    include: "values,formulas",
    tableMaxRows: 15,
    tableMaxCols: 8,
    maxChars: 8000,
  }),
  mappingStart: await workbook.inspect({
    kind: "table",
    range: "岗位-职业匹配表!A1:E30",
    include: "values,formulas",
    tableMaxRows: 30,
    tableMaxCols: 5,
    maxChars: 10000,
  }),
  mappingEnd: await workbook.inspect({
    kind: "table",
    range: `岗位-职业匹配表!A${Math.max(4, mappingLastRow - 20)}:E${mappingLastRow}`,
    include: "values,formulas",
    tableMaxRows: 24,
    tableMaxCols: 5,
    maxChars: 8000,
  }),
  errors: await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "final formula error scan",
    maxChars: 5000,
  }),
};

const renderSpecs = [
  ["说明与统计", "A1:H41", "preview_summary.png", 1.15],
  ["岗位-职业匹配表", "A1:E34", "preview_mapping.png", 1.0],
  ["匹配明细（不合并）", "A1:I24", "preview_detail.png", 0.9],
  ["职业字典（本表使用）", "A1:E24", "preview_dictionary.png", 1.0],
];
for (const [sheetName, range, fileName, scale] of renderSpecs) {
  const preview = await workbook.render({ sheetName, range, scale, format: "png" });
  await fs.writeFile(path.join(outputDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const qa = {
  sourceRelationCount: mappingAnalysis.mappingRows.length,
  sourceJobCount: mappingAnalysis.stats.jobCount,
  matchedJobRecordCount: new Set(groups.map((group) => group.jobId)).size,
  uniquePositionIdCount: new Set(groups.map((group) => group.positionId)).size,
  chainCount: chainOrder.length,
  jobIndustryRelationCount: groups.length,
  canonicalDisplayGroupCount: displayGroups.length,
  mergedSourceRelationCount: groups.length - displayGroups.length,
  uniqueJobNameCount: new Set(groups.map((group) => normalizeText(group.title))).size,
  mappingRowCount: mappingRows.length,
  detailRowCount: flatRows.length,
  multiOccupationGroupCount: displayGroups.filter((group) => group.occupations.length > 1).length,
  usedOccupationCount: usedOccupations.length,
  matchedRelationCount: groups.length,
  jobRecordRetentionRate: new Set(groups.map((group) => group.jobId)).size / mappingAnalysis.stats.matchedJobCount,
  maxOccupationsPerGroup: Math.max(...groups.map((group) => group.occupations.length)),
  missingOccupationCount: flatRows.filter((row) => !occupationByCode.has(row.occupation.code)).length,
  duplicateWithinGroupCount: groups.filter((group) => new Set(group.occupations.map((item) => item.code)).size !== group.occupations.length).length,
  directMatchGroupCount: groups.filter((group) => group.basis === "职业名称直接命中").length,
  ruleCorrectedGroupCount: groups.filter((group) => group.basis.startsWith("规则校正：")).length,
  sourceFallbackGroupCount: groups.filter((group) => group.basis === "沿用岗位主表职业映射").length,
  outputPath,
};
await fs.writeFile(path.join(outputDir, "mapping_qa.json"), JSON.stringify(qa, null, 2));
await fs.writeFile(path.join(outputDir, "inspect_summary.ndjson"), [
  inspections.summary.ndjson,
  inspections.mappingStart.ndjson,
  inspections.mappingEnd.ndjson,
  inspections.errors.ndjson,
].join("\n"));

console.log(JSON.stringify(qa, null, 2));
console.log(inspections.errors.ndjson);

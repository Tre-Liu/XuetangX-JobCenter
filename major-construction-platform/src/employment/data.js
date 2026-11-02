/** Employment analysis school profile and deterministic anonymous fixtures.
 * All graduate/employer records below are synthetic, never verified school outcomes.
 * Public materials support topic selection only; no recorded employer is a real respondent.
 */
;(function(root){
  if(root.EmploymentData)return
  const profile={school:'内蒙古大学',college:'计算机学院（软件学院）',major:'数据科学与大数据技术',province:'内蒙古自治区',city:'呼和浩特市',surveyDate:'2026-09-30',surveyStage:'毕业中期跟踪',verification:'测算口径 · 待核验'}
  const pages=[['overview','就业概览'],['destinations','就业去向'],['region','内蒙古区域'],['career','职业发展'],['education','培养反馈'],['alumni','校友发展']]
  const cohorts=[{year:'2023',invited:132,responses:120,employed:96,studying:16,local:52},{year:'2022',invited:126,responses:112,employed:92,studying:12,local:49},{year:'2021',invited:118,responses:104,employed:88,studying:10,local:44}]
  const cityNames=['呼和浩特','包头','鄂尔多斯','乌兰察布','赤峰','通辽','呼伦贝尔','巴彦淖尔','乌海','兴安盟','锡林郭勒盟','阿拉善盟']
  const localCities=Array.from({length:52},(_,i)=>i<25?cityNames[0]:i<33?cityNames[1]:i<40?cityNames[2]:i<45?cityNames[3]:i<48?cityNames[4]:i<50?cityNames[5]:i<51?cityNames[6]:cityNames[7])
  const outsideCities=[...Array(16).fill(['北京','北京']),...Array(6).fill(['上海','上海']),...Array(5).fill(['浙江','杭州']),...Array(5).fill(['广东','深圳']),...Array(4).fill(['陕西','西安']),...Array(3).fill(['天津','天津']),...Array(5).fill(['其他省份','其他城市'])]
  const jobs=['大数据开发工程师','数据分析师','算法工程师','数据平台工程师','软件开发工程师','数据治理工程师','其他岗位']
  const industries=['信息传输与软件服务','能源与电力','制造业','金融业','公共管理与社会服务','科学研究与技术服务']
  const skills=['数据工程与治理','机器学习与建模','业务分析与表达','工程部署与运维','数据安全与伦理','跨团队协作']
  const courses=['数据库原理与应用','大数据处理技术','机器学习','统计分析与数据可视化','分布式系统','数据安全与隐私保护']
  const goals=['专业基础与工程实践','问题分析与技术创新','团队协作与沟通','社会责任与职业伦理','自主学习与持续发展']
  const feedback=['课程教学','专业教育','通识教育','实践教学','科研训练']
  const positive=(i,j,cut=80)=>((i*37+j*19)%100)<cut
  const records=cohorts.flatMap((c,ci)=>Array.from({length:c.responses},(_,i)=>{
    const employed=i<c.employed,studying=!employed&&i<c.employed+c.studying,local=employed&&i<c.local
    const outside=outsideCities[(i-c.local+44)%44],city=local?localCities[Math.min(51,Math.floor(i*52/c.local))]:employed?outside[1]:null
    const job=jobs[i%10<3?0:i%10<5?1:i%10===5?2:i%10===6?3:i%10===7?4:i%10===8?5:6]
    const industry=industries[local?(i%10<4?0:i%10<7?1:i%10===7?2:i%10===8?4:5):(i%10<6?0:i%10===6?3:i%10===7?2:i%10===8?5:4)]
    return {id:`graduate-${c.year}-${String(i+1).padStart(3,'0')}`,year:c.year,status:employed?'在职':studying?'继续深造':i<c.responses-2?'求职中':'其他状态',province:employed?(local?'内蒙古':outside[0]):null,city,origin:i%5<3?'内蒙古':'区外',initialProvince:employed?(i%7===0?(local?'北京':'内蒙古'):local?'内蒙古':outside[0]):null,job:employed?job:null,industry:employed?industry:null,employerType:employed?['民营企业','国有企业','事业单位','其他单位'][local?i%4:i%9<6?0:i%9===6?1:i%9===7?2:3]:null,position:employed?(i%11===0?'管理岗位':i%7===0?'研究岗位':'专业技术岗位'):null,
      income:employed?(local?6200+(i*7%17)*170:9400+(i*11%19)*260)+ci*450:null,incomeValid:employed&&i%23!==22,related:employed?positive(i,ci,83):null,satisfied:employed?positive(i,ci+1,86):null,promoted:employed?positive(i,ci+2,48+ci*7):null,promotionType:employed?(i%3?'职级提升':'管理职责扩大'):null,promotionCount:employed?(positive(i,ci+2,48+ci*7)?(i%5===0?2:1):0):null,stable:employed?i%5!==0:null,industryChanged:employed&&i%5===0,jobChanged:employed&&i%4===0,changeReason:['职业发展空间','薪酬与福利','专业兴趣','家庭与生活'][i%4],regionReason:['产业机会与岗位匹配','家庭与生活安排','收入与生活成本','长期发展空间'][i%4],
      highestDegree:studying?(i%4===0?'博士在读':'硕士在读'):i%6===0?'硕士':'本科',studyLocation:studying?(i%8===0?'境外':'境内'):null,studyRelated:studying?i%7!==0:null,firstClass:studying&&i%8!==0&&i%3!==0,
      aiFrequency:employed?['每日使用','每周使用','偶尔使用','尚未使用'][i%10<6?0:i%10<8?1:i%10===8?2:3]:null,aiScenes:employed?['代码编写与调试','数据清洗与分析','文档与方案撰写','模型训练与评估'].filter((_,j)=>positive(i,j,65-j*8)):[],strategic:employed&&['信息传输与软件服务','能源与电力','科学研究与技术服务'].includes(industry),future:employed&&job==='算法工程师',innovation:employed&&i%7===0,innovationLevel:['单位内部改进','省级项目参与','跨区域项目参与'][i%3],entrepreneur:employed&&i%31===0,businessProfit:employed&&i%62===0,service:i%4===0,
      goals:goals.map((_,j)=>({reasonable:positive(i,j,88-j),achieved:positive(i,j+2,83-j*2)})),knowledge:skills.map((_,j)=>positive(i,j,82-j*3)),feedback:feedback.map((_,j)=>positive(i,j,89-j*4)),courseSupport:courses.map((_,j)=>positive(i,j+3,88-j*3)),improvements:['增加真实业务项目','加强工程部署训练','补充数据安全实践','强化业务沟通表达'].filter((_,j)=>positive(i,j,68-j*9)),researchHelp:positive(i,4,78),recommend:positive(i,5,89),schoolSatisfaction:positive(i,7,91),giveback:positive(i,6,76),givebackTypes:['实习岗位推荐','行业经验分享','参与课程共建','导师结对'].filter((_,j)=>positive(i,j,68-j*10)),services:['区域校友交流','职业发展辅导','持续学习资源','科研与创业对接'].filter((_,j)=>positive(i,j+4,77-j*8)),activities:['行业沙龙','返校交流','项目合作','公益服务'].filter((_,j)=>positive(i,j+2,72-j*9))}
  }))
  const employers=cohorts.flatMap((c,ci)=>Array.from({length:36},(_,i)=>({id:`employer-${c.year}-${i+1}`,year:c.year,province:i<22?'内蒙古':'区外',skills:skills.map((_,j)=>({demand:positive(i,j,95-j*2),satisfaction:positive(i,j+2,83-j*4)})),qualities:['职业责任','团队协作','持续学习'].map((_,j)=>({demand:positive(i,j,94),satisfaction:positive(i,j+3,87-j*3)})),knowledge:['统计与数学基础','计算机基础','行业知识'].map((_,j)=>({demand:positive(i,j+1,92),satisfaction:positive(i,j+4,84-j*5)}))})))
  const sources=[{title:'用户提供的就业报告大纲',type:'分析维度依据',path:'/Users/liuhongzhe/Desktop/学堂/项目/河南科技大学/河南科技大学-材料科学与工程学院报告大纲-麦可思.pdf'},{title:'内蒙古大学计算机学院·数据科学系',type:'专业方向背景',url:'https://ccs.imu.edu.cn/xyjj/jxjg/sjkxx.htm'},{title:'自治区能源局·算力产业配套建设意见',type:'区域产业背景',url:'https://nyj.nmg.gov.cn/zwgk/zfxxgkzl/fdzdgknr/jytabl/202606/t20260602_2910924.html'}]
  root.EmploymentData={profile,pages,cohorts,records,employers,skills,courses,goals,feedback,cityNames,sources,provenance:{kind:'synthetic',verified:false,createdAt:'2026-10-29',method:'deterministic-anonymous-fixtures-v1',scope:'用户授权的内蒙古大学专业场景；不代表实际毕业生调查或企业反馈',boundary:'公开资料仅用于专业与产业背景，所有问卷、收入、流向、评价数值均为生成内容，未接入真实调查'}}
})(globalThis)

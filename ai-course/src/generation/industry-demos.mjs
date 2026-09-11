// Prototype-only ancestry for the curated cultural demo roles.
const chains={
 culture:['文化内容与公共文化服务产业链',{
  '文化研究助理':['research','文化资源调查与研究','上游'],
  '文化项目策划':['planning','文化活动策划与组织','中游'],
  '公共文化服务专员':['service','公共文化服务与推广','下游'],
  '文化内容编辑':['editing','文化内容编辑与制作','中游']}],
 heritage:['文博与文化遗产服务产业链',{
  '文博讲解员':['guide','展览导览与公众教育','下游'],
  '展览策划助理':['exhibition','展览策划与展示制作','中游'],
  '文化遗产保护助理':['protection','文化遗产调查与保护','上游']}],
 archive:['文献档案与数字出版产业链',{
  '文献整理专员':['catalog','文献整理与数字化','上游'],
  '档案整理专员':['archive','档案整理与数字化','上游'],
  '史料研究助理':['history','史料整理与专题研究','上游'],
  '学术出版助理':['publishing','学术内容编辑与出版','中游']}],
 study:['文化研学服务产业链',{
  '研学课程策划':['curriculum','研学课程设计与产品开发','中游']}]
};

export function demoIndustryRelations(role){
 if(role?.origin!=='simulation'||!/^major-job:/.test(role?.id||''))return [];
 for(const [key,[chainName,roles]] of Object.entries(chains)){
  const segment=roles[role.name];
  if(!segment)continue;
  const [id,name,stage]=segment;
  return [{job_id:role.id,cleaned_position:role.name,chain_id:`demo-industry:${key}`,
   chain_name:chainName,industry_node_id:`demo-industry:${key}:${id}`,
   chain_node_name:name,chain_node_stage:stage,origin:'simulation',
   review_status:'模拟数据',source:'文化岗位产业归属演示数据',
   match_basis:'为文化类演示岗位配置的产业链与环节示例，非正式产业调研结果'}];
 }
 return [];
}

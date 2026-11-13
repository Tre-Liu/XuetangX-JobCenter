import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const core = await import('../index.mjs').catch(() => ({}));

test('shared matching retains first-match precedence, stable IDs and measured counts', () => {
  assert.equal(typeof core.matchMajorJobs, 'function');
  const jobs = core.matchMajorJobs({code:'030201',name:'  政治学与行政学  '});
  assert.equal(jobs.length,16);
  assert.equal(jobs[0].id,'major-job:030201:1');
  assert.equal(jobs[0].name,'政策研究助理');
  assert.equal(jobs[0].majorName,'政治学与行政学');
  assert.equal(jobs[0].source,'岗位画像测算');
  assert.equal(jobs[0].taskCount,6);
  assert.equal(jobs[0].abilityCount,27);
  assert.equal(core.matchMajorJobs({code:'x',name:'健康教育'})[0].name,'教学助理');
  assert.deepEqual(core.matchMajorJobs(null),[]);
  assert.equal(core.matchMajorJobs({code:'010102',name:'逻辑学'})[0].name,'逻辑学教学助理');
  assert.equal(core.matchMajorJobs({code:'010102',name:'逻辑学'}).length,6);
});

test('catalog queries preserve original levels, provenance and exact relation evidence', () => {
  assert.equal(typeof core.matchChains,'function');
  assert.equal(core.industryDataset.majors.length,2142);
  assert.equal(core.industryDataset.chains.length,19);
  assert.equal(core.industryDataset.relations.length,791);
  assert.equal(core.directory.sources['MOE-BK-2025'].title,'教育部《普通高等学校本科专业目录（2025年）》');
  assert.equal(core.findMajor('010101').row,2);
  assert.equal(core.findMajor('010101','普通本科').name,'哲学');
  assert.equal(core.findMajor('010101','中等职业教育'),undefined);
  const chains=core.matchChains('080717T','普通本科');
  assert.deepEqual(chains.map(c=>c.name),['人工智能产业链']);
  assert.equal(chains[0].evidence[0].majorKey,'普通本科:080717T');
  assert.equal(chains[0].evidence[0].node,'智能感知、语音视觉与平台工具');
  assert.deepEqual(core.matchChains('080717T','高等职业教育'),[]);
  assert.deepEqual(core.matchChains('010101'),[]);
  assert.ok(core.catalogProvenance.industry.workbook.endsWith('专业与产业链产业环节匹配结果.xlsx'));
});

test('classic matching artifact and shared rules return identical jobs for every catalog major', () => {
  assert.equal(typeof core.matchMajorJobs,'function');
  const context={globalThis:{}};
  vm.runInNewContext(readFileSync(new URL('../../../major-construction-platform/src/data/major-job-matching.js',import.meta.url),'utf8'),context);
  for(const major of core.industryDataset.majors){
    assert.deepEqual(JSON.parse(JSON.stringify(context.globalThis.MAJOR_JOB_MATCHING.match(major))),core.matchMajorJobs(major));
  }
});

test('course adapter keeps task-library counts while sharing job identities and source', async () => {
  assert.equal(typeof core.matchMajorJobs,'function');
  const {matchMajorJobs}=await import('../../../ai-course/src/cms/major-job-matching.mjs');
  const {jobTaskDemos}=await import('../../../ai-course/src/generation/job-task-demos.mjs');
  for(const major of [{code:'081001',name:'土木工程'},{code:'010102',name:'逻辑学'}]){
    const base=core.matchMajorJobs(major),course=matchMajorJobs(major);
    assert.deepEqual(course.map(j=>[j.id,j.name,j.source]),base.map(j=>[j.id,j.name,j.source]));
    course.forEach((job,index)=>{
      const tasks=jobTaskDemos(job);
      assert.equal(job.taskCount,tasks.length||base[index].taskCount);
      assert.equal(job.abilityCount,tasks.length?tasks.reduce((sum,t)=>sum+t.abilities.length,0):base[index].abilityCount);
    });
  }
});

test('selection restores multi-major identities without merging education levels', () => {
  assert.equal(typeof core.IndustryMajorSelection?.restore,'function');
  const majors=[{key:'中职:1',uiLevel:'vocational',sourceLevel:'中职',code:'000001',name:'甲'}, {key:'高职:1',uiLevel:'vocational',sourceLevel:'高职',code:'000001',name:'乙'}];
  assert.deepEqual(core.IndustryMajorSelection.restore(majors,{officialMajor:{level:'vocational',code:'1'}}),[]);
  const restored=core.IndustryMajorSelection.restore(majors,{officialMajors:[{level:'vocational',sourceLevel:'高职',code:'1'},{level:'vocational',sourceLevel:'中职',code:'1'},{level:'vocational',sourceLevel:'高职',code:'1'}]});
  assert.deepEqual(restored.map(m=>m.key),['高职:1','中职:1']);
  const merged=core.IndustryMajorSelection.mergeChains(restored.map((major,i)=>({major,chains:[{id:'chain-a',node:i?'下游':'上游',evidence:major.key}]})));
  assert.equal(merged.length,1);
  assert.equal(merged[0].node,'上游、下游');
  assert.deepEqual(merged[0].matchedMajors.map(m=>m.key),['高职:1','中职:1']);
});

test('legacy course task-library adapter retains saved custom tasks', async () => {
  const legacy=await import('../../../ai-course/src/generation/job-task-demos.mjs');
  assert.equal(typeof legacy.withJobTaskDemos,'function');
  const job={id:'custom-job',name:'自定义岗位',tasks:[{id:'existing',name:'既有任务',abilities:[]}]};
  const result=legacy.withJobTaskDemos(job,null,{tasks:job.tasks});
  assert.deepEqual(result.tasks,job.tasks);
  assert.equal(result.id,'custom-job');
  assert.equal(result.origin,'simulation');
});

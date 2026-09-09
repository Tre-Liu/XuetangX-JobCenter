import test from 'node:test';
import assert from 'node:assert/strict';
const config=await import('../src/cms/config.mjs').catch(()=>({}));
test('model requires a configured official major and confirmed chain; defaults off',()=>{
 assert.equal(typeof config.normalizeConfig,'function');
 const base=config.normalizeConfig({});
 assert.equal(base.industryEnabled,false);
 assert.equal(config.normalizeConfig({major:null,industryEnabled:true,chainIds:['bad']}).industryEnabled,false);
 const chains=config.matchChains('460305');assert.ok(chains.length);
 const valid=config.normalizeConfig({major:{code:'460305'},chainIds:[chains[0].id],industryEnabled:true});
 assert.equal(valid.major.name,'工业机器人技术');assert.equal(valid.industryEnabled,true);
 assert.equal(config.normalizeConfig({...valid,chainIds:[]}).industryEnabled,false);
});
test('changing major clears previous chain confirmation and disables model',()=>{
 assert.equal(typeof config.changeMajor,'function');
 const current={major:{code:'460305'},chainIds:['old'],industryEnabled:true};
 const next=config.changeMajor(current,{code:'080901'});
 assert.deepEqual(next.chainIds,[]);assert.equal(next.industryEnabled,false);
});
test('file navigation carries configuration without trusting arbitrary fields',()=>{
 assert.equal(typeof config.configHash,'function');
 const value={major:{code:'460305'},chainIds:[],industryEnabled:false};
 assert.deepEqual(config.fromHash(config.configHash(value)),config.normalizeConfig(value));
 assert.equal(config.fromHash('#course-cms=broken'),null);
 assert.equal(config.fromHash('#other=1'),null);
});

test('industry model follows valid chain selection regardless of legacy switch',()=>{
 const selected={major:{code:'460305'},chainIds:[matchChainsForTest()],industryEnabled:false};
 assert.equal(config.normalizeConfig(selected).industryEnabled,true);
 assert.equal(config.normalizeConfig({...selected,chainIds:[]}).industryEnabled,false);
});
function matchChainsForTest(){return config.matchChains('460305')[0].id;}

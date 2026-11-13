import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const generator=await import('../scripts/generate-compat.mjs').catch(()=>({}));

test('committed classic and course artifacts are derived from the canonical catalog', () => {
  assert.equal(typeof generator.generateCompatibility,'function');
  assert.doesNotThrow(()=>generator.generateCompatibility({check:true}));
});

test('compatibility check detects drift without overwriting files and regeneration is deterministic',()=>{
  assert.equal(typeof generator.generateCompatibility,'function');
  const root=mkdtempSync(path.join(tmpdir(),'industry-compat-'));
  try {
    generator.generateCompatibility({root});
    rmSync(path.join(root,'major-construction-platform/outputs'), {recursive:true,force:true});
    assert.doesNotThrow(()=>generator.generateCompatibility({root,check:true}));
    const file=path.join(root,'major-construction-platform/industry-major-chain-data.js');
    const expected=readFileSync(file,'utf8');
    generator.generateCompatibility({root});
    assert.equal(readFileSync(file,'utf8'),expected);
    writeFileSync(file,expected.replace('普通本科:010101','普通本科:999999'));
    assert.throws(()=>generator.generateCompatibility({root,check:true}),/industry-major-chain-data\.js/);
    assert.notEqual(readFileSync(file,'utf8'),expected);
    generator.generateCompatibility({root});
    assert.equal(readFileSync(file,'utf8'),expected);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

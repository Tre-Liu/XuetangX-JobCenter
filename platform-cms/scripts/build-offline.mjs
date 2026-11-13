import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {compileStandalone,stripFileEntryFallback} from '../../packages/build-tools/standalone.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const onlyIndustry=process.argv.includes('--industry-compat');
await mkdir(new URL('../offline/',import.meta.url),{recursive:true});
if(!onlyIndustry){
 const course=await compileStandalone({build,plugins:[react()],root,entry:'src/course/main.jsx',template:'course.html'});
 await writeFile(new URL('../offline/course.html',import.meta.url),course);
 await writeFile(new URL('../offline/index.html',import.meta.url),stripFileEntryFallback(await readFile(new URL('../index.html',import.meta.url),'utf8')));
}
const industry=await compileStandalone({build,plugins:[],root,entry:'src/industry/main.js',template:'industry.html'});
await writeFile(new URL('../offline/industry.html',import.meta.url),industry);
if(onlyIndustry)await writeFile(new URL('../../major-construction-platform/industry-research-admin.html',import.meta.url),industry);
console.log(onlyIndustry?'Generated legacy industry CMS entry from platform-cms sources.':'Built independent offline CMS entries.');

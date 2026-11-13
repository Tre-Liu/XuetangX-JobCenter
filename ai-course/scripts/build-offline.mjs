import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {compileStandalone} from '../../packages/build-tools/standalone.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
// Online entries keep external assets and independent chunks.
await rename(new URL('../dist/client/dev.html',import.meta.url),new URL('../dist/client/index.html',import.meta.url));
await mkdir(new URL('../dist/client/cms/',import.meta.url),{recursive:true});
const cmsOnline=await readFile(new URL('../dist/client/cms-dev.html',import.meta.url),'utf8');
await writeFile(new URL('../dist/client/cms/index.html',import.meta.url),cmsOnline);
const course=await compileStandalone({build,plugins:[react()],root,entry:'src/main.jsx',template:'dev.html'});
await writeFile(new URL('../index.html',import.meta.url),course);
await writeFile(new URL('../offline.html',import.meta.url),course);
const cms=await compileStandalone({build,plugins:[react()],root,entry:'cms-main.jsx',template:'cms-dev.html'});
await mkdir(new URL('../cms/',import.meta.url),{recursive:true});
await writeFile(new URL('../cms/index.html',import.meta.url),cms);
console.log('Built separate online course/CMS entries and compatible offline pages.');

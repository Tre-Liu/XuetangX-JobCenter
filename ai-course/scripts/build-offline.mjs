import fs from 'node:fs';
import path from 'node:path';
const root='dist/client';
const entryPath=path.join(root,'dev.html');
let html=fs.readFileSync(entryPath,'utf8');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.unlinkSync(entryPath);
// Classic inline scripts must run after #root exists. Vite puts module scripts
// in <head>; removing type=module in place would run React before the body.
const scripts=[];
html=html.replace(/[ \t]*<script type="module" crossorigin src="([^"]+)"><\/script>/g,(_,url)=>{
  scripts.push(fs.readFileSync(path.join(root,url),'utf8').replaceAll('</script','<\\/script'));
  return '';
});
if(!scripts.length) throw new Error('No compiled application script found');
html=html.replace('</body>',()=>scripts.map(code=>`<script>${code}</script>`).join('\n')+'\n</body>');
html=html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,(_,url)=>`<style>${fs.readFileSync(path.join(root,url),'utf8')}</style>`);
fs.writeFileSync('index.html',html);
fs.writeFileSync('offline.html',html);
console.log('Built double-click index.html and offline.html from dev.html.');

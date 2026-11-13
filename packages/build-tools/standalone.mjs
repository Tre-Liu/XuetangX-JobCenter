import {readFile} from 'node:fs/promises';
import path from 'node:path';
/** Source-only file redirects must never be copied into their offline targets. */
export const stripFileEntryFallback = html => html.replace(/<script\b[^>]*\bdata-file-entry(?:\s|=|>)[\s\S]*?<\/script>/gi, '');
/** Separate IIFE build: offline pages never depend on online chunk layout. */
export async function compileStandalone({build,plugins,root,entry,template,define={}}) {
 const result=await build({configFile:false,root,plugins,publicDir:false,
  define:{'process.env.NODE_ENV':JSON.stringify('production'),...define},
  resolve:{dedupe:['react','react-dom']},
  build:{write:false,minify:'esbuild',cssCodeSplit:false,lib:{entry:path.resolve(root,entry),name:'PlatformEntry',formats:['iife']},rollupOptions:{output:{inlineDynamicImports:true}}},
 });
 const output=(Array.isArray(result)?result:[result]).flatMap(item=>item.output);
 const js=output.filter(item=>item.type==='chunk').map(item=>item.code).join('\n');
 const css=output.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.source).join('\n');
 if(!js)throw new Error('Standalone entry did not produce a script: '+entry);
 let html=stripFileEntryFallback(await readFile(path.resolve(root,template),'utf8'));
 html=html.replace(/[ \t]*<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/g,'');
 html=html.replace('</head>',()=>`<style>${css.replaceAll('</style','<\\/style')}</style></head>`);
 return html.replace('</body>',()=>`<script>${js.replaceAll('</script','<\\/script')}</script></body>`);
}

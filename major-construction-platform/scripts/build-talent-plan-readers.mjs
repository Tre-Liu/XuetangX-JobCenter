import { build } from 'esbuild'
import { mkdir, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const runtime='/Users/liuhongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
await mkdir(new URL('../vendor/talent-plan/',import.meta.url),{recursive:true})
await build({stdin:{contents:`import * as pdf from '${runtime}/pdfjs-dist/build/pdf.mjs'; import {WorkerMessageHandler} from '${runtime}/pdfjs-dist/build/pdf.worker.mjs'; globalThis.pdfjsWorker={WorkerMessageHandler};globalThis.TalentPlanPDF=pdf;`,resolveDir:process.cwd()},bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,outfile:fileURLToPath(new URL('../vendor/talent-plan/pdf-reader.js',import.meta.url)),legalComments:'eof'})
await copyFile(`${runtime}/jszip/dist/jszip.min.js`,new URL('../vendor/talent-plan/jszip.min.js',import.meta.url))
console.log('PDF与Word本地读取依赖已构建')

await mkdir(new URL('../public/document-readers/',import.meta.url),{recursive:true})
for(const name of ['pdf-reader.js','jszip.min.js'])await copyFile(new URL('../vendor/talent-plan/'+name,import.meta.url),new URL('../public/document-readers/'+name,import.meta.url))

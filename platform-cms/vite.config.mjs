import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const file = value => fileURLToPath(new URL(value, import.meta.url));
export default defineConfig(({command})=>({
 base:'./',
 define: command==='serve' ? {'import.meta.env.VITE_COURSE_URL':JSON.stringify(process.env.VITE_COURSE_URL || 'http://127.0.0.1:5186/index.html')} : {},
 plugins:[react()],
 resolve:{dedupe:['react','react-dom']},
 server:{fs:{allow:[file('..')]}},
 build:{outDir:'dist',rollupOptions:{input:{index:file('./index.html'),course:file('./course.html'),industry:file('./industry.html')}}},
}));

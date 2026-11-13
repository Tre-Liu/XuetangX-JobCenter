import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Compile shared bridge logic; the classic entry reuses already-loaded canonical data.
export async function buildIndustryCmsBridge() {
  await build({
    entryPoints: [fileURLToPath(new URL('../src/app/industry-cms-bridge-entry.mjs', import.meta.url))],
    outfile: fileURLToPath(new URL('../src/app/industry-cms-bridge.js', import.meta.url)),
    bundle: true, format: 'iife', target: 'es2020',
    banner: { js: '// Generated from packages/data-access; run node scripts/build-industry-cms-bridge.mjs.' },
    plugins: [{ name: 'existing-industry-globals', setup(plugin) {
      plugin.onResolve({ filter: /industry-core\/index\.mjs$/ }, () => ({ path: 'industry-globals', namespace: 'industry-globals' }));
      plugin.onLoad({ filter: /.*/, namespace: 'industry-globals' }, () => ({ contents: 'export const industryDataset = globalThis.INDUSTRY_MAJOR_CHAIN_DATA; export const industryMajorSelection = globalThis.IndustryMajorSelection;' }));
    } }],
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildIndustryCmsBridge();

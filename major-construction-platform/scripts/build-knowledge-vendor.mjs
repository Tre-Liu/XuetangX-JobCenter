import { build } from 'esbuild'
import { copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const exports = [
  'BufferGeometry', 'CanvasTexture', 'Float32BufferAttribute', 'DoubleSide', 'Mesh', 'PerspectiveCamera',
  'Points', 'Scene', 'ShaderMaterial', 'WebGLRenderer',
]
await build({
  absWorkingDir: root,
  stdin: { contents: `export { ${exports.join(', ')} } from 'three'`, resolveDir: root },
  format: 'iife',
  globalName: 'KnowledgeThree',
  outfile: 'public/vendor/knowledge-three.min.js',
  bundle: true,
  minify: true,
  legalComments: 'none',
  banner: { js: '/*! Three.js | MIT | See knowledge-three.LICENSE.txt */' },
})
await copyFile(new URL('../node_modules/three/LICENSE', import.meta.url),
  new URL('../public/vendor/knowledge-three.LICENSE.txt', import.meta.url))

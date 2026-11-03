import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const source = await readFile(new URL('../src/results-home/motion.js', import.meta.url), 'utf8')
function environment() {
  const listeners = new Map(), instances = [], scripts = []
  const media = { matches: false, addEventListener() {}, removeEventListener() {} }
  const canvases = ['frame', 'ray', 'star'].map(name => ({ dataset: { motion: name }, style: {}, getBoundingClientRect: () => ({ width: 800, height: 190 }) }))
  const document = {
    hidden: false, baseURI: 'http://localhost:5186/',
    createElement: () => ({}), head: { appendChild: script => scripts.push(script) },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name)
  }
  const runtime = {
    RuntimeLoader: { setWasmUrl() {}, setWasmFallbackUrl() {} },
    Fit: { Fill: 'fill', Contain: 'contain' }, Alignment: { Center: 'center' }, Layout: class { constructor(options) { Object.assign(this, options) } },
    Rive: class {
      constructor(options) { this.options = options; instances.push(this); queueMicrotask(options.onLoad) }
      resizeDrawingSurfaceToCanvas() {} play() { this.playing = true } pause() { this.playing = false }
      startRendering() { this.rendering = true } stopRendering() { this.rendering = false }
      cleanup() { this.cleaned = true }
    }
  }
  const context = vm.createContext({ document, URL, location: { protocol: 'http:' }, matchMedia: () => media,
    ResizeObserver: class { observe() {} disconnect() { this.disconnected = true } },
    console, Promise, queueMicrotask, devicePixelRatio: 2,
    requestAnimationFrame: fn => { fn(); return 1 }, cancelAnimationFrame() {},
  })
  vm.runInContext(source, context)
  return { context, runtime, canvases, instances, scripts, document, listeners, media,
    host: { isConnected: true, querySelectorAll: () => canvases, getBoundingClientRect: () => ({ width: 1600, height: 900 }) } }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

test('leaving the home page before runtime load does not create orphan animation instances', async () => {
  const e = environment()
  const cleanup = e.context.ResultsHomeMotion.mount(e.host, './results-assets/')
  cleanup()
  e.context.rive = e.runtime
  e.scripts[0].onload()
  await settle()
  assert.equal(e.instances.length, 0)
  assert.equal(e.listeners.size, 0)
})

test('all three local animations stop while hidden and release resources on unmount', async () => {
  const e = environment()
  const cleanup = e.context.ResultsHomeMotion.mount(e.host, './results-assets/')
  e.context.rive = e.runtime
  e.scripts[0].onload()
  await settle()
  assert.equal(e.instances.length, 3)
  assert.ok(e.instances.every(instance => instance.options.src.startsWith('http://localhost:5186/results-assets/motion/')))
  e.document.hidden = true
  e.listeners.get('visibilitychange')()
  assert.ok(e.instances.every(instance => instance.rendering === false))
  e.document.hidden = false
  e.listeners.get('visibilitychange')()
  assert.ok(e.instances.every(instance => instance.rendering === true))
  cleanup()
  assert.ok(e.instances.every(instance => instance.cleaned))
  assert.equal(e.listeners.size, 0)
})

test('reduced motion does not autoplay decorative animation', async () => {
  const e = environment()
  e.media.matches = true
  const cleanup = e.context.ResultsHomeMotion.mount(e.host, './results-assets/')
  e.context.rive = e.runtime
  e.scripts[0].onload()
  await settle()
  assert.ok(e.instances.every(instance => instance.options.autoplay === false && instance.playing === false))
  cleanup()
})

test('direct-file fallback contains the exact local animation and WASM bytes', async () => {
  const base = new URL('../public/results-assets/motion/', import.meta.url)
  const context = vm.createContext({})
  vm.runInContext(await readFile(new URL('file-assets.js', base), 'utf8'), context)
  for (const kind of ['ray', 'star', 'frame', 'wasm']) {
    const filename = kind === 'wasm' ? 'rive.wasm' : `light-${kind}.riv`
    assert.deepEqual(Buffer.from(context.ResultsMotionFileAssets[kind], 'base64'), await readFile(new URL(filename, base)))
  }
})

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9223
const outputDir = '/Users/liuhongzhe/Documents/专业建设/outputs/industry-layout-source-table/screenshots'
const pageUrl = 'file:///Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/index.html?tab=chain&reportView=library&view=job-industry'

await fs.mkdir(outputDir, { recursive: true })

const proc = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-features=MediaRouter',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=/tmp/codex-chrome-industry-source-table',
  '--window-size=2048,1311',
  'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const log = (message) => console.log(`[capture] ${message}`)

async function waitForJsonEndpoint() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (res.ok) return await res.json()
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome DevTools endpoint did not start')
}

log('waiting for Chrome DevTools')
const pages = await waitForJsonEndpoint()
const wsUrl = pages[0].webSocketDebuggerUrl
const ws = new WebSocket(wsUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})
log('connected')

let id = 0
const pending = new Map()
const waiters = new Map()

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
    return
  }
  if (msg.method && waiters.has(msg.method)) {
    const callbacks = waiters.get(msg.method)
    waiters.delete(msg.method)
    callbacks.forEach((cb) => cb(msg))
  }
})

function send(method, params = {}) {
  const callId = ++id
  ws.send(JSON.stringify({ id: callId, method, params }))
  return new Promise((resolve, reject) => {
    pending.set(callId, (msg) => msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result))
  })
}

function waitFor(method) {
  return new Promise((resolve) => {
    const callbacks = waiters.get(method) ?? []
    callbacks.push(resolve)
    waiters.set(method, callbacks)
  })
}

async function navigateAndWait(url) {
  await send('Page.navigate', { url })
  await sleep(2500)
}

async function capture(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await fs.writeFile(`${outputDir}/${name}`, Buffer.from(result.data, 'base64'))
}

try {
  log('enabling page/runtime')
  await send('Page.enable')
  await send('Runtime.enable')
  log('opening page')
  await navigateAndWait(pageUrl)
  log('setting initialized localStorage')
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('major-construction-platform:industry-research', JSON.stringify({ initialized: true, selectedChainIds: ['chain-platform'], selectedChainId: 'chain-platform' }))`,
    awaitPromise: true
  })
  log('reloading initialized page')
  await navigateAndWait(pageUrl)
  await sleep(1200)
  log('capturing overview')
  await capture('fig1-industry-chain-overview.png')
  log('opening dialog')
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[aria-label="查看关联国标行业详情"]')?.click()`,
    awaitPromise: true
  })
  await sleep(600)
  log('capturing dialog')
  await capture('fig2-national-industry-metric-dialog.png')
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[aria-label="关闭国标行业指标详情"]')?.click()`,
    awaitPromise: true
  })
  await sleep(400)
  log('scrolling to lower lists')
  await send('Runtime.evaluate', {
    expression: `window.scrollTo(0, 1150)`,
    awaitPromise: true
  })
  await sleep(700)
  log('capturing lower lists')
  await capture('fig3-industry-chain-lower-lists.png')
} finally {
  log('closing Chrome')
  ws.close()
  proc.kill('SIGTERM')
}

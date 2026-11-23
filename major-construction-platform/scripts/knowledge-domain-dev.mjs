import { Readable } from 'node:stream'
import { loadEnv } from 'vite'
import { handleAbilityDimensionRequest } from '../src/server/ability-dimension.js'
import { handleKnowledgeDomainRequest } from '../src/server/knowledge-domain.js'

// Use the same handler in the local workspace and in the published worker.
export function knowledgeDomainDev() {
  let modelEnv
  const mount = (server, path, handler) => {
    server.middlewares.use(path, async (incoming, outgoing) => {
      const controller = new AbortController()
      outgoing.on('close', () => { if (!outgoing.writableEnded) controller.abort() })
      try {
        const host = incoming.headers.host
        if (incoming.headers.origin && new URL(incoming.headers.origin).host !== host) {
          outgoing.writeHead(403).end()
          return
        }
        const method = incoming.method || 'GET'
        const init = {method, headers: incoming.headers, signal: controller.signal}
        if (method !== 'GET' && method !== 'HEAD') {
          init.body = Readable.toWeb(incoming)
          init.duplex = 'half'
        }
        const request = new Request('http://localhost'+path, init)
        const result = await handler(request, modelEnv)
        if (!outgoing.destroyed) {
          outgoing.writeHead(result.status, Object.fromEntries(result.headers))
          outgoing.end(await result.text())
        }
      } catch {
        if (!outgoing.destroyed) outgoing.writeHead(500).end()
      }
    })
  }
  const middleware = server => {
    mount(server, '/api/knowledge-domain', handleKnowledgeDomainRequest)
    mount(server, '/api/ability-dimension', handleAbilityDimensionRequest)
  }
  return {
    name: 'knowledge-domain-api',
    configResolved(config) {
      // No VITE_ prefix: provider credentials are server-only.
      const local = loadEnv(config.mode, config.envDir, ['OPENAI_API_KEY', 'AI_SUMMARY_', 'KNOWLEDGE_DOMAIN_MODEL', 'ABILITY_DIMENSION_MODEL'])
      modelEnv = { ...local }
      for (const key of ['OPENAI_API_KEY', 'AI_SUMMARY_MODEL', 'AI_SUMMARY_API_URL', 'KNOWLEDGE_DOMAIN_MODEL', 'ABILITY_DIMENSION_MODEL']) {
        if (process.env[key]) modelEnv[key] = process.env[key]
      }
    },
    configureServer: middleware,
    configurePreviewServer: middleware,
  }
}

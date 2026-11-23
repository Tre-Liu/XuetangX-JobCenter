// Load the rendering engine only when a graph is opened.
;(function (root) {
  const base = new URL('.', document.currentScript.src)
  let pending
  const script = url => new Promise((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = url
    tag.onload = resolve
    tag.onerror = () => { tag.remove(); reject(new Error('图谱组件未能加载，请重试')) }
    document.head.append(tag)
  })
  root.loadKnowledgeDomainScene = () => {
    if (root.KnowledgeDomainScene) return Promise.resolve(root.KnowledgeDomainScene)
    if (!pending) {
      const vendor = location.protocol === 'file:' ? '../../public/vendor/knowledge-three.min.js' : '../../vendor/knowledge-three.min.js'
      pending = script(new URL(vendor, base))
        .catch(() => { /* The renderer also supports a projected canvas. */ })
        .then(() => script(new URL('atlas-paint.js', base)))
        .then(() => script(new URL('scene.js', base)))
        .then(() => root.KnowledgeDomainScene)
        .catch(error => { pending = undefined; throw error })
    }
    return pending
  }
})(globalThis)

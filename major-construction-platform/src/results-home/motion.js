/* Source animation files and sizing follow the production RiveRayCanvas component. */
;(function (root) {
  if (root.ResultsHomeMotion) return
  let runtimePromise
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = () => { script.remove?.(); reject(new Error(`Unable to load animation runtime: ${src}`)) }
    document.head.appendChild(script)
  })
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0)).buffer
  function loadRuntime(base) {
    if (!runtimePromise) runtimePromise = (async () => {
      if (!root.rive) await loadScript(new URL('motion/rive.js', base).href)
      const runtime = root.rive
      runtime.RuntimeLoader.setWasmFallbackUrl(null)
      if (root.location.protocol === 'file:') {
        if (!root.ResultsMotionFileAssets) await loadScript(new URL('motion/file-assets.js', base).href)
        runtime.RuntimeLoader.setWasmBinary(decode(root.ResultsMotionFileAssets.wasm))
      } else runtime.RuntimeLoader.setWasmUrl(new URL('motion/rive.wasm', base).href)
      return runtime
    })().catch(error => { runtimePromise = null; throw error })
    return runtimePromise
  }
  root.ResultsHomeMotion = {
    mount(host, assetBase, topInset = 90) {
      const base = new URL(assetBase, document.baseURI)
      const reducedMotion = root.matchMedia('(prefers-reduced-motion: reduce)')
      let disposed = false
      const entries = []
      const canvases = [...host.querySelectorAll('canvas[data-motion]')]
      const syncPlayback = () => {
        for (const { player, canvas } of entries) {
          if (canvas.dataset.motionState !== 'ready') continue
          if (document.hidden) player.stopRendering()
          else {
            player.startRendering()
            if (reducedMotion.matches) player.pause()
            else player.play()
          }
        }
      }
      const resize = () => {
        if (disposed) return
        const bounds = host.getBoundingClientRect()
        const width = bounds.width, height = bounds.height + topInset
        for (const canvas of canvases) {
          if (canvas.dataset.motion === 'ray') canvas.style.transform = `scale(${Math.min(width / 1600, height / 900)})`
          else if (canvas.dataset.motion === 'star') canvas.style.transform = `scale(${width / 1600}, ${height / 900})`
        }
        for (const { player } of entries) player.resizeDrawingSurfaceToCanvas(Math.min(root.devicePixelRatio || 1, 2))
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      document.addEventListener('visibilitychange', syncPlayback)
      reducedMotion.addEventListener('change', syncPlayback)
      resize()
      loadRuntime(base).then(runtime => {
        if (disposed || !host.isConnected) return
        for (const canvas of canvases) {
          const kind = canvas.dataset.motion
          const name = `light-${kind}.riv`
          const fileBuffer = root.location.protocol === 'file:' ? decode(root.ResultsMotionFileAssets[kind]) : null
          let player
          player = new runtime.Rive({
            ...(fileBuffer ? { buffer: fileBuffer } : { src: new URL(`motion/${name}`, base).href }),
            canvas,
            autoplay: !reducedMotion.matches,
            ...(kind === 'frame' ? { layout: new runtime.Layout({ fit: runtime.Fit.Fill, alignment: runtime.Alignment.Center }) } : {}),
            onLoad: () => {
              if (disposed) return
              canvas.dataset.motionState = 'ready'
              player.resizeDrawingSurfaceToCanvas(Math.min(root.devicePixelRatio || 1, 2))
              syncPlayback()
            },
            onLoadError: () => { canvas.dataset.motionState = 'error' }
          })
          entries.push({ player, canvas })
        }
      }).catch(error => {
        if (disposed) return
        canvases.forEach(canvas => { canvas.dataset.motionState = 'error' })
        console.warn('Professional results animation unavailable', error)
      })
      return () => {
        if (disposed) return
        disposed = true
        observer.disconnect()
        document.removeEventListener('visibilitychange', syncPlayback)
        reducedMotion.removeEventListener('change', syncPlayback)
        entries.forEach(({ player }) => player.cleanup())
        entries.length = 0
      }
    }
  }
})(globalThis)

// Reader layout illustration. Research records are not linked to original PDFs.
// Do not treat the rendered text or metadata as verified source document content.
(() => {
  if (typeof customElements === 'undefined' || customElements.get('talent-pdf-preview')) return
  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
  class TalentPdfPreview extends HTMLElement {
    static get observedAttributes() { return ['name', 'school', 'year', 'major', 'pages'] }
    constructor() { super(); this.attachShadow({mode:'open'}); this.zoom = 100; this.collapsed = false }
    connectedCallback() { this.render() }
    attributeChangedCallback() { if (this.isConnected) this.render() }
    render() {
      const get = key => esc(this.getAttribute(key))
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;min-width:0;color:#30343b;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
        *{box-sizing:border-box}button{font:inherit;cursor:pointer}button:focus-visible{outline:2px solid #6aabff;outline-offset:2px}
        .reader{border:1px solid #c7c9cc;border-radius:8px;overflow:hidden;background:#d5d7da}
        .toolbar{min-height:54px;display:flex;align-items:center;gap:12px;padding:8px 16px;color:#eee;background:#323639;flex-wrap:wrap}
        button{border:0;border-radius:4px;background:transparent;color:inherit;min-width:30px;height:30px}button:hover:enabled{background:#ffffff20}button:disabled{opacity:.4;cursor:default}
        .file{display:flex;gap:10px;align-items:center;flex:1;min-width:100px}.filename{max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badge{font-size:10px;font-weight:700;background:#df4b42;padding:5px;border-radius:3px}
        .controls{display:flex;align-items:center;gap:6px;white-space:nowrap}.divider{height:22px;width:1px;background:#626569;margin:0 5px}.page-number,.zoom{background:#202326;border:1px solid #585c60;border-radius:3px;padding:5px 9px;color:#fff}.zoom{min-width:54px;text-align:center}
        .body{display:flex;height:650px;max-height:72vh;min-height:420px}.sidebar{width:176px;flex-shrink:0;border-right:1px solid #bcbec2;background:#e8e9eb;padding:18px 24px;overflow:auto}.sidebar[hidden]{display:none}.side-title{font-size:12px;margin:0 0 20px;color:#62666d}
        .thumbnail{width:104px;height:145px;background:white;border:2px solid #4584e8;box-shadow:0 2px 7px #0002;margin:auto;padding:18px 10px;position:relative}.thumbnail strong{display:block;font-size:6px;text-align:center;line-height:1.6;margin:5px 0 14px}.thumbnail i{display:block;height:2px;background:#d2d5da;margin:6px 0}.thumbnail i:last-child{width:65%}.number{text-align:center;color:#2874d7;font-size:12px;margin-top:10px}
        .canvas{flex:1;min-width:0;overflow:auto;padding:30px 28px 48px;background:#d5d7da}.paper{width:680px;min-height:910px;margin:0 auto;padding:44px 54px 55px;background:#fff;box-shadow:0 2px 9px #0003;color:#263144;zoom:var(--scale);font-size:14px;line-height:2;position:relative}.paper header{display:flex;justify-content:space-between;color:#78808e;font-size:12px;border-bottom:1px solid #e4e6ea;padding-bottom:12px}.paper h1{font-size:22px;line-height:1.7;text-align:center;margin:48px 0 40px}.paper h2{font-size:15px;margin:30px 0 14px}.paper p{margin:0;text-align:justify;text-indent:2em}.paper footer{position:absolute;bottom:32px;left:0;right:0;text-align:center;font-size:11px;color:#818894}
        .status{height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:11px;background:#f0f1f2;color:#6a6e75;border-top:1px solid #c7c9cc}
        @media(max-width:900px){.sidebar{width:140px;padding:18px 14px}.filename{max-width:220px}.toolbar{gap:5px}.canvas{padding:22px 18px}.paper{margin:0 auto}}
        @media(max-width:600px){.sidebar{display:none}.filename{max-width:170px}.body{min-height:400px}.paper{margin:0}.status{font-size:10px}}
      </style><section class="reader" aria-label="人才培养方案PDF阅读器">
        <div class="toolbar" role="toolbar" aria-label="PDF阅读工具">
          <button data-action="sidebar" aria-label="页面缩略图" aria-pressed="${!this.collapsed}" title="页面缩略图">☰</button>
          <div class="file"><span class="badge">PDF</span><span class="filename" title="${get('name')}.pdf">${get('name')}.pdf</span></div>
          <div class="controls"><button disabled aria-label="上一页">‹</button><span class="page-number">1</span><span>/ ${get('pages') || '1'}</span><button disabled aria-label="下一页" title="关联PDF原文件后可翻页">›</button><span class="divider"></span><button data-action="out" aria-label="缩小" ${this.zoom<=50?'disabled':''}>−</button><span class="zoom">${this.zoom}%</span><button data-action="in" aria-label="放大" ${this.zoom>=150?'disabled':''}>＋</button><button data-action="fit" aria-label="适合页面" title="适合页面">⛶</button><span class="divider"></span><button disabled aria-label="打印" title="关联PDF原文件后可打印">▤</button><button disabled aria-label="下载" title="关联PDF原文件后可下载">↓</button></div>
        </div>
        <div class="body"><aside class="sidebar" ${this.collapsed?'hidden':''} aria-label="页面缩略图"><div class="side-title">页面缩略图</div><div class="thumbnail" aria-label="第1页" aria-current="page"><strong>${get('name')}</strong>${'<i></i>'.repeat(8)}</div><div class="number">1</div></aside>
        <div class="canvas" tabindex="0" aria-label="文档阅读区"><article class="paper" style="--scale:${this.zoom/100}"><header><span>${get('school')}</span><span>${get('year')}级</span></header><h1>${get('name')}</h1><h2>一、专业名称与代码</h2><p>${get('major')}，面向区域产业发展和数字化转型需要，培养能够胜任岗位任务的高素质技术技能人才。</p><h2>二、培养目标</h2><p>本方案围绕职业岗位能力、课程体系、实践教学与毕业要求进行系统设计。</p><footer>— 1 —</footer></article></div></div>
        <div class="status"><span>第 1 页</span><span>PDF · ${this.zoom}%</span></div>
      </section>`
      this.shadowRoot.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
        const action = button.dataset.action
        if (action === 'sidebar') this.collapsed = !this.collapsed
        else if (action === 'fit') {
          const width = this.shadowRoot.querySelector('.canvas').clientWidth - 56
          this.zoom = Math.max(50, Math.min(150, Math.floor(width / 680 * 100)))
        } else this.zoom = Math.max(50, Math.min(150, this.zoom + (action === 'in' ? 10 : -10)))
        this.render()
        this.shadowRoot.querySelector(`[data-action="${action}"]`)?.focus()
      }))
    }
  }
  customElements.define('talent-pdf-preview', TalentPdfPreview)
})()

/* Shared by the Vue application and the directly opened static entry. */
;(function (root) {
  if (!root.customElements || root.customElements.get('results-home')) return
  const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  const questions = ['本专业的人才培养目标是什么？', '本专业核心课程有哪些？', '本专业面向的就业方向与发展赛道有哪些？']
  const icons = ['\ue8b7', '\ue845', '\ue95f', '\ue9c3', '\ue873']
  class ResultsHome extends HTMLElement {
    connectedCallback() {
      if (this.ready) { this.startMotion(); return }
      this.ready = true
      let config = {}
      try { config = JSON.parse(this.getAttribute('config') || '{}') } catch { /* Empty content remains usable. */ }
      this.config = config
      const assetBase = this.getAttribute('asset-base') || './results-assets/'
      this.innerHTML = `
        <div class="results-home-layout">
          <div class="results-home-atmosphere" aria-hidden="true"><canvas class="results-motion-ray" data-motion="ray"></canvas><canvas class="results-motion-star" data-motion="star"></canvas></div>
          <section class="results-home-overview" aria-label="专业概况">
            <h1>${escape(config.name || '专业概况')}</h1>
            <div class="results-home-description"><p tabindex="0" aria-label="专业介绍">${escape(config.summary || '暂无专业介绍')}</p></div>
            <div class="results-home-metrics" aria-label="专业建设统计">
              <canvas class="results-motion-frame" data-motion="frame" aria-hidden="true"></canvas>
              ${(config.metrics || []).map((item, index) => `<article tabindex="0" title="${escape(item.basis || '按当前专业资料统计，待核验')}"><span class="results-source-icon" aria-hidden="true">${icons[index] || ''}</span><strong>${escape(item.value ?? '—')}</strong><span>${escape(item.label)}</span></article>`).join('')}
            </div>
          </section>
          <aside class="results-guide" aria-label="智慧专业领航员">
            <header class="results-guide-header"><img src="${escape(assetBase)}navigator.png" alt="智慧专业领航员形象"><h2>智慧专业领航员</h2></header>
            <div class="results-guide-scroll">
              <div class="results-guide-welcome">
                <p>你好！我是智慧专业领航员。我可以为你解答本专业的相关问题，欢迎随时向我提问～</p>
                <div class="results-guide-questions">${questions.map((question, index) => `<button type="button" data-question="${index}"><span aria-hidden="true">${['🎓', '📚', '💼'][index]}</span> ${question}</button>`).join('')}</div>
              </div>
              <div class="results-guide-messages" role="log" aria-live="polite" aria-label="问答记录"></div>
            </div>
            <form class="results-guide-form">
              <button class="results-guide-thinking" type="button" aria-pressed="false" title="展开资料依据与核验提示"><span class="results-source-icon" aria-hidden="true">&#xe965;</span> 深度思考</button>
              <div class="results-guide-composer"><textarea aria-label="向智慧专业领航员提问" placeholder="你想了解什么？问问吧～" rows="2" maxlength="1000"></textarea><button type="submit" aria-label="发送问题" disabled><span class="results-source-icon" aria-hidden="true">&#xe89a;</span></button></div>
              <p class="results-guide-source">回答依据当前专业资料整理，相关信息待核验</p>
            </form>
          </aside>
        </div>`
      this.addEventListener('click', event => {
        const question = event.target.closest('[data-question]')
        if (question) this.ask((this.config.questions || questions)[Number(question.dataset.question)])
        const thinking = event.target.closest('.results-guide-thinking')
        if (thinking) thinking.setAttribute('aria-pressed', String(thinking.getAttribute('aria-pressed') !== 'true'))
      })
      this.addEventListener('input', () => this.updateSend())
      this.querySelector('form').addEventListener('submit', event => {
        event.preventDefault()
        this.ask(this.querySelector('textarea').value)
      })
      this.querySelector('textarea').addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault()
          this.ask(event.target.value)
        }
      })
      this.startMotion()
    }
    startMotion() {
      this.stopMotion?.()
      this.stopMotion = root.ResultsHomeMotion?.mount(this.querySelector('.results-home-layout'), this.getAttribute('asset-base') || './results-assets/')
    }
    disconnectedCallback() { this.stopMotion?.(); this.stopMotion = null }
    updateSend() { this.querySelector('[type="submit"]').disabled = !this.querySelector('textarea').value.trim() }
    ask(value) {
      const question = String(value || '').trim()
      if (!question) return
      const config = this.config
      let answer = '当前资料尚未包含这一问题的完整信息，请查看培养方案、课程体系或岗位中心中的相关内容。'
      if (/培养|目标|介绍|专业概况/.test(question)) answer = config.summary || '暂无专业介绍。'
      else if (/课程/.test(question)) answer = config.courses?.length ? `当前关联课程包括：${config.courses.join('、')}。课程设置请以审定培养方案为准。` : '课程目录尚待补充，请以审定培养方案为准。'
      else if (/就业|岗位|方向|赛道/.test(question)) answer = config.jobs?.length ? `当前关联岗位包括：${config.jobs.join('、')}。可在岗位中心继续查看任务、能力与课程关联；岗位关联不代表当前招聘空缺。` : '岗位方向资料尚待补充。'
      if (this.querySelector('.results-guide-thinking').getAttribute('aria-pressed') === 'true') answer += '\n\n资料依据：当前页面的专业介绍、关联课程与岗位档案。以上资料仍需结合审定培养方案核验。'
      const log = this.querySelector('[role="log"]')
      for (const [role, text] of [['question', question], ['answer', answer]]) {
        const message = document.createElement('p')
        message.className = `results-guide-message ${role}`
        message.textContent = text
        log.appendChild(message)
      }
      this.querySelector('textarea').value = ''
      this.updateSend()
      const scroll = this.querySelector('.results-guide-scroll')
      scroll.scrollTop = scroll.scrollHeight
    }
  }
  root.customElements.define('results-home', ResultsHome)
})(globalThis)

# AI Assistant Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a screenshot-matched, globally available AI assistant launcher and suggestion menu while keeping “热门岗位分析建议” inert in this iteration.

**Architecture:** Reuse the existing `aiSuggestionPanelOpen`, `aiSuggestionItems`, and navigation functions in the Vue application, then mirror the same contract in the `file://` fallback runtime. Move the right-side assistant trigger out of the talent-only branch so every main workspace can use it, share one CSS implementation, and leave the already-present hot-job analysis data dormant rather than expanding that later feature now.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vite 6, project CSS, Node.js built-in test runner.

## Global Constraints

- The launcher is fixed at the lower-right of the viewport and uses an approximately `56px × 56px` circular visual.
- The desktop suggestion menu targets approximately `330px × 410px` and opens above the launcher without a blocking backdrop.
- The menu copy is exactly `优化专业结构，从这里开始！` with the four existing suggestion labels.
- The first three suggestion items preserve their current navigation behavior.
- Clicking `热门岗位分析建议` performs no navigation, modal opening, notification, or menu close.
- Vue and `file://` fallback behavior must remain aligned.
- No backend, persistence, analytics, or unrelated navigation changes.
- Preserve all unrelated working-tree changes.

---

## File Structure

- Create `major-construction-platform/src/assets/ai-assistant-avatar.png`: raster assistant portrait used by both Vue and static fallback launchers.
- Modify `major-construction-platform/src/App.vue`: expose one global launcher, accessibility state, outside-click behavior, and the inert `hot-jobs` branch.
- Modify `major-construction-platform/index.html`: mirror the global launcher and behavior in the static fallback runtime.
- Modify `major-construction-platform/src/styles/10-shell.css`: style the shared launcher and portrait asset.
- Modify `major-construction-platform/src/styles/90-decision.css`: match the suggestion menu, responsive containment, interaction states, and reduced-motion behavior.
- Modify `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`: define the source-level behavior and presentation contract.
- Create `major-construction-platform/design-qa.md`: record reference-versus-prototype visual review and the final gate result.

### Task 1: Lock the Interaction Contract

**Files:**
- Modify: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/index.html`

**Interfaces:**
- Consumes: `aiSuggestionPanelOpen: Ref<boolean>`, `AiSuggestionItem['key']`, `staticAiSuggestionPanelOpen: boolean`.
- Produces: `openAiSuggestion(key)` and `openStaticAiSuggestion(key)` where `hot-jobs` returns without changing state; one global `[data-ai-dock-toggle]` per rendered shell; `aria-expanded` synchronized with panel state.

- [ ] **Step 1: Replace the modal-opening test with failing behavior tests**

Add these source-contract tests:

```js
test('AI assistant is globally available and reports its expanded state', () => {
  assert.match(appVue, /class="support-avatar global-ai-assistant"/)
  assert.match(appVue, /aria-label="AI助手"/)
  assert.match(appVue, /:aria-expanded="aiSuggestionPanelOpen"/)
  assert.match(staticHtml, /class="support-avatar global-ai-assistant"/)
  assert.match(staticHtml, /aria-label="AI助手"/)
})

test('hot-job suggestion remains inert in Vue and static fallback', () => {
  assert.match(appVue, /if \(key === 'hot-jobs'\) return/)
  assert.doesNotMatch(appVue, /if \(key === 'hot-jobs'\) \{\s*activeAiAnalysisKey\.value = 'hot-jobs'/)
  assert.match(staticHtml, /if \(key === 'hot-jobs'\) return/)
  assert.doesNotMatch(staticHtml, /if \(key === 'hot-jobs'\) \{\s*app\.insertAdjacentHTML\('beforeend', staticAiAnalysisModalHtml\(\)\)/)
})

test('AI suggestion panel supports outside click without closing from panel clicks', () => {
  assert.match(appVue, /<main v-else class="app-shell" @click="closeAiSuggestionPanel">/)
  assert.match(appVue, /id="ai-suggestion-panel"[\s\S]*@click\.stop/)
  assert.match(staticHtml, /staticAiSuggestionPanelOpen && !target\.closest\('\.ai-suggestion-panel'\)/)
})
```

Retain the existing assertions for the four menu labels and the shared trigger.

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL because the launcher is talent-only, `aria-expanded` is absent, outside-click behavior is absent, and `hot-jobs` still opens the analysis modal.

- [ ] **Step 3: Implement the Vue interaction contract**

In `src/App.vue`:

```ts
const openAiSuggestion = (key: AiSuggestionItem['key']) => {
  if (key === 'hot-jobs') return
  closeAiSuggestionPanel()
  openDecisionCenter()
  if (key === 'course-cross') {
    selectDecisionPage('governance', 'course-diagnosis')
    activeDecisionCourseTab.value = '课程交叉分析'
    decisionCourseStatus.value = 'result'
  } else if (key === 'plan-diagnosis') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案诊断分析'
  } else if (key === 'plan-compare') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案对比分析'
  }
  persistDecisionState()
}
```

Make the main shell close the menu on outside clicks, stop propagation from the panel, and expose state:

```vue
<main v-else class="app-shell" @click="closeAiSuggestionPanel">
  <button
    class="support-avatar global-ai-assistant"
    type="button"
    aria-label="AI助手"
    aria-controls="ai-suggestion-panel"
    :aria-expanded="aiSuggestionPanelOpen"
    data-ai-dock-toggle
    @click.stop="toggleAiSuggestionPanel"
  >
    <img :src="aiAssistantAvatar" alt="">
  </button>

  <aside
    v-if="aiSuggestionPanelOpen"
    id="ai-suggestion-panel"
    class="ai-suggestion-panel"
    aria-label="AI建议面板"
    @click.stop
  >
    <header>
      <span></span>
      <strong>优化专业结构，从这里开始！</strong>
    </header>
    <button
      v-for="item in aiSuggestionItems"
      :key="item.key"
      class="ai-suggestion-item"
      type="button"
      :data-ai-suggestion-key="item.key"
      @click="openAiSuggestion(item.key)"
    >
      <span>{{ item.icon }}</span>
      <div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.subtitle }}</p>
      </div>
      <em>›</em>
    </button>
  </aside>
</main>
```

Remove the talent-only duplicate `support-avatar`. Keep the left dock orb as its existing secondary trigger, but change its accessible label to `AI助手` and add the same `aria-controls` and `:aria-expanded` state.

- [ ] **Step 4: Implement the static fallback interaction contract**

In `index.html`:

```js
const openStaticAiSuggestion = (key = '') => {
  if (key === 'hot-jobs') return
  staticAiSuggestionPanelOpen = false
  removeStaticAiPanels()
  if (key === 'course-cross') {
    activeDecisionGroup = 'governance'
    activeDecisionPage = 'course-diagnosis'
    activeDecisionCourseTab = '课程交叉分析'
    decisionCourseStatus = 'result'
  } else if (key === 'plan-diagnosis') {
    activeDecisionGroup = 'governance'
    activeDecisionPage = 'plan-analysis'
    activeDecisionPlanModeTab = '培养方案诊断分析'
  } else if (key === 'plan-compare') {
    activeDecisionGroup = 'governance'
    activeDecisionPage = 'plan-analysis'
    activeDecisionPlanModeTab = '培养方案对比分析'
  }
  renderDecisionCenter()
}
```

Return one `.global-ai-assistant` sibling with the dock fragment, remove the talent-only duplicate, set `aria-expanded="false"` initially, and update all `[data-ai-dock-toggle]` attributes inside `removeStaticAiPanels()` and `renderStaticAiSuggestionPanel()`.

Add the outside-click branch after AI item handling so it does not consume normal page actions:

```js
if (staticAiSuggestionPanelOpen && !target.closest('.ai-suggestion-panel')) {
  staticAiSuggestionPanelOpen = false
  renderStaticAiSuggestionPanel()
}
```

- [ ] **Step 5: Run the targeted test and verify it passes**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the interaction slice**

```bash
git add major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs major-construction-platform/src/App.vue major-construction-platform/index.html
git commit -m "feat: add global AI assistant interaction"
```

### Task 2: Match the Reference Visual

**Files:**
- Create: `major-construction-platform/src/assets/ai-assistant-avatar.png`
- Modify: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/src/styles/10-shell.css`
- Modify: `major-construction-platform/src/styles/90-decision.css`

**Interfaces:**
- Consumes: `.global-ai-assistant`, `.ai-suggestion-panel`, `.ai-suggestion-item`, `aiAssistantAvatar`.
- Produces: a 1:1 square raster avatar, a fixed `58px` launcher, and a `336px` desktop menu constrained to the viewport.

- [ ] **Step 1: Add failing style and asset assertions**

Append these tests:

```js
test('AI assistant matches the reference dimensions and responsive bounds', () => {
  assert.match(stylesCss, /\.global-ai-assistant\s*\{[\s\S]*position:\s*fixed;[\s\S]*right:\s*28px;[\s\S]*bottom:\s*28px;/)
  assert.match(stylesCss, /\.global-ai-assistant\s*\{[\s\S]*width:\s*58px;[\s\S]*height:\s*58px;/)
  assert.match(stylesCss, /\.ai-suggestion-panel\s*\{[\s\S]*width:\s*336px;[\s\S]*border-radius:\s*18px;/)
  assert.match(stylesCss, /max-width:\s*calc\(100vw - 32px\);/)
  assert.match(stylesCss, /max-height:\s*calc\(100vh - 118px\);/)
  assert.match(stylesCss, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(appVue, /ai-assistant-avatar\.png/)
  assert.match(staticHtml, /src\/assets\/ai-assistant-avatar\.png/)
})
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL because the current panel is `374px` wide with a `4px` radius, lacks viewport bounds, and uses an emoji instead of a raster portrait.

- [ ] **Step 3: Generate and place the assistant portrait**

Use Image Gen with this exact art direction:

```text
Square circular-profile AI education assistant avatar, friendly young Chinese woman, dark shoulder-length hair, subtle futuristic blue-violet visor, navy blazer, polished 3D illustration, cool blue and lavender rim light, centered head and shoulders, clean pale blue background, no text, no logo, no border, designed to remain legible at 52 pixels.
```

Inspect the result, crop to a square if needed without adding drawn elements, and save it as `src/assets/ai-assistant-avatar.png`. Import it in Vue as `aiAssistantAvatar`; reference `./src/assets/ai-assistant-avatar.png` in the static fallback.

- [ ] **Step 4: Implement the launcher styling**

In `src/styles/10-shell.css`, retain `.support-avatar` as a shared base and add:

```css
.global-ai-assistant {
  position: fixed;
  right: 28px;
  bottom: 28px;
  top: auto;
  z-index: 32;
  width: 58px;
  height: 58px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.96);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 28px rgba(62, 89, 184, 0.28), 0 0 0 3px rgba(103, 118, 255, 0.12);
}

.global-ai-assistant img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
```

Provide visible `:hover`, `:focus-visible`, and `.active` shadows without moving the control.

- [ ] **Step 5: Implement the menu styling**

Replace the existing menu geometry in `src/styles/90-decision.css` with:

```css
.ai-suggestion-panel {
  position: fixed;
  right: 28px;
  bottom: 100px;
  z-index: 31;
  display: grid;
  width: 336px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 118px);
  gap: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0;
  border: 1px solid rgba(220, 225, 250, 0.92);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 56px rgba(54, 72, 135, 0.2);
}
```

Give the header a `78px` pale lavender gradient region and each item a stable `80px` minimum height with `22px 24px` horizontal rhythm, subtle separators, and hover/focus backgrounds. Add a narrow-screen rule that changes `right` to `16px`, keeps the panel inside the viewport, and keeps the launcher reachable. Add `@media (prefers-reduced-motion: reduce)` to remove nonessential transitions.

- [ ] **Step 6: Run the targeted test and production build**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
npm run build
```

Expected: targeted tests PASS and Vite production build exits `0`.

- [ ] **Step 7: Commit the visual slice**

```bash
git add major-construction-platform/src/assets/ai-assistant-avatar.png major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/10-shell.css major-construction-platform/src/styles/90-decision.css
git commit -m "style: match AI assistant reference"
```

### Task 3: Browser Verification and Design QA

**Files:**
- Create: `major-construction-platform/design-qa.md`
- Modify only if QA finds a P0/P1/P2 issue: files listed in Tasks 1–2.

**Interfaces:**
- Consumes: running Vite application and both supplied reference screenshots.
- Produces: verified closed/open interaction states and `design-qa.md` with `final result: passed`.

- [ ] **Step 1: Run the complete automated verification**

Run:

```bash
cd major-construction-platform
npm test
npm run build
```

Expected: all tests PASS and build exits `0`.

- [ ] **Step 2: Start the local preview**

Run the existing Vite `dev` script on an available fixed port and keep the process running for the user:

```bash
cd major-construction-platform
npm run dev -- --port 4173 --strictPort
```

Expected: Vite serves the application at `http://localhost:4173/`.

- [ ] **Step 3: Verify primary interactions in a browser**

At a desktop viewport close to `2048 × 1228`:

1. Open the main professional workspace.
2. Confirm the circular assistant stays at the lower-right while the content scrolls.
3. Click it and confirm the menu opens above it.
4. Click inside the header and confirm the menu remains open.
5. Click `热门岗位分析建议` and confirm the menu remains open with no route, modal, notification, or console error.
6. Click outside and confirm the menu closes.
7. Reopen and click each of the first three items, confirming their existing target behavior.
8. Inspect the browser console and require zero new errors.

- [ ] **Step 4: Capture and compare both visual states**

Capture the closed and open states at the same viewport. Compare them with the supplied references for launcher diameter, lower-right offset, portrait crop, panel width and height, `18px` corner radius, shadow softness, lavender header, type hierarchy, icon alignment, and row spacing.

- [ ] **Step 5: Write the blocking QA report**

Create `design-qa.md` using:

```markdown
# AI Assistant Design QA

## Compared states
- Reference: closed launcher screenshot
- Reference: open suggestion menu screenshot
- Prototype: closed launcher capture
- Prototype: open suggestion menu capture

## Findings
- P0: none
- P1: none
- P2: none
- P3: none

## Interaction checks
- Toggle: passed
- Outside click: passed
- Hot-job item inert: passed
- Existing three routes: passed
- Console: passed

final result: passed
```

If any P0/P1/P2 issue exists, document it, fix it, recapture the affected state, and update the report only after the issue is resolved.

- [ ] **Step 6: Commit the verified result**

```bash
git add major-construction-platform/design-qa.md major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/10-shell.css major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs major-construction-platform/src/assets/ai-assistant-avatar.png
git commit -m "test: verify AI assistant experience"
```

# 产业政策库 Design QA

source visual truth path: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/artifacts/policy-library-remediation/00-figma-reference-1440x988.png`

implementation screenshot path: `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/artifacts/policy-library-remediation/23-vue-1440x988-final.jpg`

viewport: 1440x988

state: Vue demo opened at `http://127.0.0.1:5173/?view=job-industry&tab=policy`; `智能建造产业链` is selected, search is empty, policy level is `全部`, and no detail dialog is open.

full-view comparison evidence: the Figma export and final implementation were opened together at the same 1440x988 viewport. The comparison covers the complete policy board: four-chain segmented row, 106px AI interpretation card, 732px two-column lower region, policy list, keyword card, and six-year trend card.

focused region comparison evidence: the Figma right-column crop `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/artifacts/policy-library-remediation/14-figma-right-focus.jpg` and final implementation crop `/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/artifacts/policy-library-remediation/24-vue-right-focus-final.jpg` were opened together after the last trend calibration. The final curve follows the reference sequence: 2022 medium, 2023 low, 2024/2025 high, 2026 lower, and 2027 rebound.

## Findings

- No P0/P1/P2 findings remain.
- The visible policy count and policy copy intentionally use the project's verified current records rather than duplicating Figma placeholder data.
- The surrounding product shell retains the current project's module naming and navigation state; the policy-library target region follows the supplied Figma node.

## Required fidelity surfaces

- Layout: the policy board is 938px high with `32px / 106px / 732px` rows, 18px gaps, and 16px padding. At 1440px the measured policy list item width is approximately 691px and the right-side cards remain stacked at 306px each.
- Typography and tokens: list, card, title, summary, placeholder, border, fill, and focus tokens match the audited Figma values, including `#2B2E35` list headings and `#A0ACC5` regular-weight placeholders.
- Assets: the existing AI image is reused; search and section markers use licensed Tabler icon assets instead of text symbols or CSS-drawn approximations.
- Content: four policy-chain views drive their own AI interpretation, records, keyword set, counts, and six-year trend data. Policy titles, agencies, source links, and verified record copy were not replaced with invented text.
- Trend semantics: the visible label remains `政策关注度` to match Figma. Its title and accessible name identify it as a demonstration-only normalized index, and 2027 is explicitly announced as a forecast.
- Interaction: tabs support click, ArrowLeft/ArrowRight, Home, and End; search preserves IME state, selection, and focus; level filtering restores focus; details open in a focus-trapped dialog with Escape close and trigger-focus return.
- Accessibility: the standalone entry keeps a persistent `role=status`, `aria-live=polite`, `aria-atomic=true` result announcer outside the replaced app subtree. Vue and standalone trend bars expose equivalent accessible labels.
- Responsive behavior: at 1180x720 the list toolbar reflows without clipping; independent measurement confirmed the list head and scroll width are both 518px.

## Comparison and fix history

1. P1: the right-side cards initially expanded with content and pushed the trend below the reference region. Fixed by enforcing the 732px lower row and two 306px cards with a fixed 18px gap.
2. P1: the first policy row measured about 642px wide and the board carried an extra outer margin. Fixed the flat-canvas margin and lower-column ratio; the row now measures approximately 691px at 1440px.
3. P1: later shared styles overrode card fills, short policy lists stretched vertically, and a concurrently added global industry option leaked into the Figma four-tab policy view. Fixed selector specificity, `align-content:start` plus `grid-auto-rows:max-content`, and policy-local four-chain options.
4. P1: the 1180px toolbar columns exceeded the available list width. Added a 1240px media rule with `120px minmax(180px, 1fr) 132px`; remeasurement shows no horizontal overflow.
5. P2: the default trend rose almost monotonically and did not match the Figma trajectory. Calibrated both entries to `72, 46, 102, 98, 66, 90` with proportionate bar heights and added the demonstration/forecast semantics.
6. P2: standalone filtering replaced its live-result node and the level select lost focus. Moved announcements to a stable sibling node and restored the new select after render.

## Verification evidence

- Policy-focused regression suite: 15/15 passed.
- Full project regression suite: 246/246 passed.
- Production build: `vue-tsc -b && vite build` completed successfully; only the repository's existing external-script and chunk-size warnings remain.
- 1440x988 browser state: four tabs, final six bar heights, explanatory metric title, and board geometry verified from the rendered DOM.
- Primary interactions verified: chain switching, keyboard tab navigation, search, level filter, policy detail open/close, focus trap, Escape, and focus restoration.
- Browser console: no runtime errors in the final Vue policy state.
- Standalone entry: source-parity and behavior tests cover the matching view, stable announcer, filter focus restoration, keyboard tabs, and policy dialog lifecycle.

final result: passed

---

# 人工智能产业链统一展示 Design QA

source visual truth paths:

- `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-7e490697-9548-4ddb-a859-eb502a17ba67.png`
- `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-2365021e-c156-478f-b390-41cde02c2726.png`
- `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-7a3d1009-3eb8-49c5-911f-6d90077f2f49.png`
- `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-2c852c50-a744-4d34-8201-b2d2f70b85f5.png`
- `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-9c029fb8-1070-4ea3-b66d-2e3899bd6a58.png`

implementation screenshot path: unavailable in this run because the in-app browser screenshot command timed out repeatedly on the 18 MB lazy-loaded data page. The rendered page was instead verified through live browser DOM, computed geometry, visible-state semantics, and console inspection.

viewport: 1982x1278

state: Vue demo opened at `http://127.0.0.1:5174/?view=job-industry&tab=chain`; CMS initialization completed, `人工智能产业链` selected, then chain, policy, region, and company states were inspected.

## Findings

- Five enterprise-chain tabs render on one row at `top=67`, each 164px wide with `white-space: nowrap`.
- Five policy-chain tabs render on one row at `top=67`, each 164px wide with `white-space: nowrap`.
- AI treemap uses the shared `.industry-treemap-board` structure with three stages, 24 default visible nodes, and three stage expansion controls exposing all 109 nodes.
- AI Sankey uses the shared `.industry-sankey-board` structure; it is mutually exclusive with the treemap and renders 27 aggregated display nodes with 123 positive-weight relationships derived from company memberships.
- AI regional analysis renders one China heatmap with 35 geographic paths. KPI values are 32 covered regions, 32,403 companies, and 221 records awaiting region completion.
- AI policy view is selected inside the five-chain policy row and renders 4 applicable policy records, 10 AI-specific keywords, and the six-year trend panel.
- AI enterprise library displays 32,403 total companies and 12 records on the current page.
- Browser console inspection returned zero warnings and zero errors.

## Dual-entry evidence

- Vue runtime was verified in the live browser at the target viewport.
- The source `file://` URL is blocked by the in-app browser security policy and the Chrome extension was unavailable, so the standalone path was verified through the project VM-based static-entry tests plus source-contract tests.
- Static tests execute the inline `file://` bootstrap without throwing and verify the AI treemap/Sankey switch, five-chain policy mapping, China-map renderer reuse, node expansion hooks, loading/retry states, company filters, and pagination.

## Data integrity evidence

- Standard stages: 3.
- Detailed nodes: 109.
- Source-reported sample count: 33,975.
- Normalized source memberships: 33,961.
- Deduplicated companies: 32,403.
- Sankey links reference existing display nodes and all weights are positive.

final result: passed

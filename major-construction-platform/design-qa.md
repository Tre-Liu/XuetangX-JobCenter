# Design QA

- Reference: Figma file `L3DHrr4pSM3lv6AmHyjSzr`, node `3281:11937`, plus the three supplied reference screenshots.
- Implementation: `http://127.0.0.1:4173/`
- Primary comparison viewport: `1440 × 1322`.
- Comparison artifacts: `tmp/qa-comparison-chain.png`, `tmp/qa-comparison-modal.png`, `tmp/qa-comparison-region.png`.

## Fidelity checks

- Chain graph: hierarchy, four KPI cards, three stage columns, blue/teal/purple stage treatments, compact node cards, and treemap/Sankey switch align with the reference composition.
- KPI detail: centered 720px dialog, title/subtitle order, summary callout, metric row, industry tags, and highlighted construction guidance match the supplied modal state.
- Region analysis: three KPI cards, map/ranking split, nine-stop Figma palette, compact TOP15 list, and four-column cooperation cards align with the reference.
- AI branch: the shared chain and region presentation renders 32,403 deduplicated companies, 109 nodes, three stages, adaptive map tones, and national-to-province-to-city drilldown without visual regressions.
- Typography, borders, radii, spacing, shadows, active states, and card density were checked in combined reference/implementation comparisons.

## Interaction and accessibility checks

- KPI modal opens from its semantic button, closes with Escape, and restores focus to the originating KPI.
- Treemap/Sankey switch, industry-chain switch, region navigation, and Guangdong province drilldown were exercised.
- Region map labels do not block pointer interaction; interactive provinces expose keyboard semantics on the AI branch.
- Browser console produced no warnings or errors during the checked flows.
- The existing application shell intentionally retains its project-wide 1180px minimum desktop width; the requested 1440px Figma frame is fully supported, and module-level grids collapse at their existing breakpoints without introducing new overflow.

## Verification

- `npm test`: 263 passed.
- `vue-tsc -b`: passed.
- `vite build`: passed; only the repository's existing large-chunk advisory remains.

passed

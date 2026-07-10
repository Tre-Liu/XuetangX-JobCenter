import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticIndexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

const styleBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = stylesCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${selector} style block should exist`)
  return match[1]
}

test('industry company library mirrors the Figma list structure in Vue and static entries', () => {
  for (const [label, source] of [
    ['Vue entry', appVue],
    ['static entry', staticIndexHtml],
  ]) {
    assert.match(source, /job-company-flat-content/, `${label} should flatten the content-area background for enterprise library`)
	    assert.match(source, /industry-company-board/, `${label} should render the enterprise library board`)
	    assert.match(source, /industry-company-chain-row/, `${label} should render the policy-style chain row`)
	    assert.match(source, /industry-company-segments/, `${label} should expose segmented industry tabs`)
	    assert.match(source, /企业资源研判/, `${label} should include the Figma AI recommendation heading`)
	    assert.match(source, /industry-company-ai-bullets/, `${label} should render the Figma bullet list in the AI recommendation card`)
	    assert.match(source, /岗位任务清晰、技术场景可教学、项目资源可共建/, `${label} should include the Figma enterprise screening standard copy`)
	    assert.doesNotMatch(source, /industry-company-chain-row[^>]*>\s*<span class="research-chain-select-label">当前产业链：<\/span>/, `${label} should not render the old chain label in the enterprise library segmented control`)
	    assert.match(source, /产业企业库（(?:\{\{\s*industryCompanyItems\.length\s*\}\}|\$\{industryCompanyItems\.length\}|24)）/, `${label} should show the list title and count`)
    assert.match(source, /搜索企业名称、信用代码、注册地址、产品或产业/, `${label} should keep the searchable enterprise field`)
    assert.match(source, /industry-company-logo/, `${label} should render enterprise logos in the company information column`)
    assert.match(source, /company-logos\//, `${label} should use local company logo assets`)
  }
})

test('industry company library uses the Figma-style light blue surface and compact table treatment', () => {
  const companyBoardStyles = styleBlock('.industry-company-board')
  assert.match(companyBoardStyles, /grid-template-rows:\s*32px 106px 732px/)
  assert.match(companyBoardStyles, /gap:\s*18px/)
  assert.match(companyBoardStyles, /height:\s*938px/)
  assert.match(companyBoardStyles, /min-height:\s*938px/)
  assert.match(companyBoardStyles, /padding:\s*16px/)
  assert.match(companyBoardStyles, /background:\s*var\(--library-board-bg\)/)
  assert.match(styleBlock('.job-company-flat-content'), /background:\s*#dbeafe/)
  assert.match(styleBlock('.job-research-flat-canvas'), /background:\s*#dbeafe/)
  assert.match(styleBlock('.job-research-flat-canvas'), /box-shadow:\s*none/)
  assert.match(styleBlock('.industry-company-page'), /background:\s*#dbeafe/)
  assert.match(styleBlock('.job-research-flat-canvas .job-research-page'), /background:\s*#dbeafe/)
  assert.match(styleBlock('.industry-company-chain-row'), /justify-content:\s*flex-start/)
  assert.match(styleBlock('.industry-company-chain-row'), /width:\s*min\(920px, 100%\)/)
  assert.match(styleBlock('.industry-company-chain-row'), /overflow:\s*hidden/)
  assert.match(styleBlock('.industry-company-chain-row'), /border:\s*1px solid rgba\(255, 255, 255, 0\.9\)/)
  assert.match(styleBlock('.industry-company-chain-row'), /border-radius:\s*8px/)
  assert.match(styleBlock('.industry-company-chain-row'), /height:\s*32px/)
  assert.match(styleBlock('.industry-company-chain-row'), /background:\s*rgba\(255, 255, 255, 0\.42\)/)
  assert.match(styleBlock('.industry-company-chain-row'), /grid-template-columns:\s*1fr/)
  assert.match(styleBlock('.industry-company-segments'), /background:\s*transparent/)
  assert.match(styleBlock('.industry-company-segments'), /display:\s*grid/)
  assert.match(styleBlock('.industry-company-segments'), /grid-template-columns:\s*repeat\(5, minmax\(150px, 1fr\)\)/)
  assert.match(styleBlock('.industry-company-segments button'), /min-height:\s*28px/)
  assert.match(styleBlock('.industry-company-segments button'), /font-size:\s*13px/)
  assert.match(styleBlock('.industry-company-segments button'), /font-weight:\s*600/)
  assert.match(styleBlock('.industry-company-segments button'), /white-space:\s*nowrap/)
  assert.match(styleBlock('.industry-company-segments button.active'), /border-color:\s*transparent/)
  assert.match(styleBlock('.industry-company-segments button.active'), /background:\s*rgba\(255, 255, 255, 0\.92\)/)
  assert.match(styleBlock('.industry-company-ai-card'), /height:\s*106px/)
  assert.match(styleBlock('.industry-company-ai-card'), /grid-template-columns:\s*118px minmax\(0, 1fr\)/)
  assert.match(styleBlock('.industry-company-ai-card'), /gap:\s*24px/)
  assert.match(styleBlock('.industry-company-ai-card'), /padding:\s*10px 20px 12px/)
  assert.match(styleBlock('.industry-company-ai-card'), /border:\s*1px solid #ffffff/)
  assert.match(styleBlock('.industry-company-ai-card'), /background:\s*#eff4ff/)
  assert.match(styleBlock('.industry-company-ai-card'), /position:\s*relative/)
  assert.match(styleBlock('.industry-company-ai-card::before'), /linear-gradient\(90deg, rgba\(150, 151, 255, 0\.3\) 0%, rgba\(150, 151, 255, 0\.12\) 22%, rgba\(255, 255, 255, 0\) 46%\)/)
  assert.match(styleBlock('.industry-company-ai-card strong'), /font-size:\s*14px/)
  assert.match(styleBlock('.industry-company-ai-card strong'), /font-weight:\s*600/)
  assert.match(styleBlock('.industry-company-ai-bullets'), /gap:\s*0/)
  assert.match(styleBlock('.industry-company-ai-bullets li'), /font-size:\s*14px/)
  assert.match(styleBlock('.industry-company-ai-bullets li'), /font-weight:\s*400/)
  assert.match(styleBlock('.industry-company-ai-bullets li'), /line-height:\s*24px/)
  assert.match(styleBlock('.industry-company-list-card'), /height:\s*732px/)
  assert.match(styleBlock('.industry-company-list-card'), /border:\s*1px solid var\(--library-border\)/)
  assert.match(styleBlock('.industry-company-list-card'), /background:\s*var\(--library-card-bg\)/)
  assert.match(styleBlock('.industry-company-table-wrap'), /border:\s*0/)
  assert.match(stylesCss, /\.industry-company-table th,\s*\.industry-company-table td\s*\{[\s\S]*border-bottom:\s*1px solid #d5e2f6/)
  assert.match(stylesCss, /\.industry-company-table th,\s*\.industry-company-table td\s*\{[\s\S]*font-size:\s*13px/)
  assert.match(styleBlock('.industry-company-table th'), /background:\s*transparent/)
  assert.match(styleBlock('.industry-company-table strong'), /font-size:\s*13px/)
  assert.match(styleBlock('.industry-company-table small'), /font-size:\s*12px/)
  assert.match(styleBlock('.industry-company-table tbody tr:last-child td'), /border-bottom:\s*1px solid #d5e2f6/)
  assert.match(styleBlock('.industry-company-table td span'), /background:\s*#eaf2ff/)
  assert.match(styleBlock('.industry-company-logo'), /width:\s*42px/)
})

test('industry company library pagination matches the Figma compact pager', () => {
  for (const [label, source] of [
    ['Vue entry', appVue],
    ['static entry', staticIndexHtml],
  ]) {
    assert.match(source, /industry-company-pagination/, `${label} should render the enterprise library pager`)
    assert.match(source, /industry-company-page-ellipsis/, `${label} should render the ellipsis before the last page`)
    assert.match(source, /industryCompanyDisplayPageCount|staticIndustryCompanyDisplayPageCount/, `${label} should keep the Figma demo page count`)
    assert.match(source, /(?:industryCompanyPageSize|staticIndustryCompanyPageSize)\s*=\s*6/, `${label} should show six companies per page to avoid an empty first-screen row`)
    assert.doesNotMatch(source, /第\s*(?:\{\{|\$\{)\s*(?:currentIndustryCompanyPage|staticCompanyPage)/, `${label} should not render the old page summary text`)
  }

  assert.match(styleBlock('.pagination.portrait-pagination.industry-company-pagination'), /justify-content:\s*center/)
  assert.match(styleBlock('.pagination.portrait-pagination.industry-company-pagination'), /width:\s*100%/)
  assert.match(styleBlock('.pagination.portrait-pagination.industry-company-pagination'), /margin-top:\s*auto/)
  assert.match(styleBlock('.industry-company-pagination button'), /width:\s*30px/)
  assert.match(styleBlock('.industry-company-pagination button.active'), /color:\s*#ffffff/)
  assert.match(styleBlock('.industry-company-pagination button.active'), /background:\s*#2f6fff/)
  assert.match(styleBlock('.industry-company-page-ellipsis'), /letter-spacing:\s*2px/)
  assert.match(stylesCss, /\.job-sub-button:focus-visible\s*\{[\s\S]*outline:\s*2px solid rgba\(47, 111, 255, 0\.28\)/)
})

test('industry company library removes the old standalone page header', () => {
  assert.match(
    appVue,
    /const showIndustryResearchChrome = computed\(\(\) => currentJobIndustryTab\.value !== 'policy' && currentJobIndustryTab\.value !== 'company'\)/,
    'Vue entry should exclude the company tab from the old standalone research chrome',
  )
  assert.match(
    appVue,
    /<header\s+v-if="showIndustryResearchChrome"\s+class="research-title-row">/,
    'Vue entry should not render the old standalone research title row for the company tab',
  )
  assert.match(
    appVue,
    /<p\s+v-if="showIndustryResearchChrome"\s+class="research-page-purpose">/,
    'Vue entry should not render the old standalone purpose line for the company tab',
  )
  assert.match(
    staticIndexHtml,
    /const header = tab === 'policy' \|\| tab === 'company' \? ''/,
    'static entry should skip the old standalone title row for the company tab',
  )
  assert.match(
    staticIndexHtml,
    /const purposeLine = tab === 'policy' \|\| tab === 'company' \? ''/,
    'static entry should skip the old standalone purpose line for the company tab',
  )
})

test('Vue enterprise library exposes policy-compatible tab and live-result behavior', () => {
  assert.match(appVue, /handleIndustryCompanyTabKeydown/)
  assert.match(appVue, /:tabindex="activeIndustryCompanySegmentKey === segment\.key \? 0 : -1"/)
  assert.match(appVue, /:aria-controls="'industry-company-panel'"/)
  assert.match(appVue, /id="industry-company-panel"/)
  assert.match(appVue, /industry-company-segments" role="tablist" aria-label="人工智能产业企业库分类"/)
  assert.match(appVue, /@keydown="handleAiIndustryCompanyTabKeydown\(\$event, industry\)"/)
  assert.match(appVue, /class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(appVue, /class="industry-company-search industry-company-search-box"/)
  assert.match(appVue, /role="status" aria-live="polite"[\s\S]*?未找到匹配企业/)
})

test('static enterprise library preserves keyboard focus and announces filtered results', () => {
  assert.match(staticIndexHtml, /id="static-company-result-announcer" class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(staticIndexHtml, /const announceStaticCompanyResults = \(count\) =>/)
  assert.match(staticIndexHtml, /data-company-tabpanel/)
  assert.match(staticIndexHtml, /data-static-company-segment[^>]*tabindex="\$\{segment\.key === activeSegment\.key \? '0' : '-1'\}"/)
  assert.match(staticIndexHtml, /const companyTab = target\.closest\('\.industry-company-segments \[data-static-company-segment\]'\)/)
  assert.match(staticIndexHtml, /const aiCompanyChainTab = target\.closest\('\.industry-company-segments \[data-current-industry-chain-tab\]'\)/)
  assert.match(staticIndexHtml, /if \(target\.matches\('\[data-static-company-search\]'\)\) \{[\s\S]*?if \(event\.isComposing\) return/)
  assert.match(staticIndexHtml, /setSelectionRange\(selectionStart, selectionEnd\)/)
})

test('enterprise library exposes the same five industry chains as the policy library', () => {
  assert.match(appVue, /const industryCompanySegments = \[[\s\S]*?key: 'ai',[\s\S]*?label: '人工智能产业链'/)
  assert.match(appVue, /key: 'green-low-carbon',[\s\S]*?label: '绿色低碳建造产业链'/)
  assert.match(staticIndexHtml, /const staticIndustryCompanySegments = \[[\s\S]*?key: 'ai', label: '人工智能产业链'/)
  assert.match(staticIndexHtml, /key: 'green-low-carbon', label: '绿色低碳建造产业链'/)
  assert.match(appVue, /const handleAiIndustryCompanyTabKeydown/)
  assert.match(appVue, /@keydown="handleAiIndustryCompanyTabKeydown\(\$event, industry\)"/)
  assert.match(appVue, /const focusIndustryCompanyActiveTab = async[\s\S]*?#industry-company-panel/)
  assert.match(appVue, /const handleIndustryCompanyTabKeydown = async[\s\S]*?await ensureAiIndustryChainData\(\)[\s\S]*?await focusIndustryCompanyActiveTab\(\)/)
  assert.match(appVue, /const handleAiIndustryCompanyTabKeydown = async[\s\S]*?await ensureAiIndustryChainData\(\)[\s\S]*?await focusIndustryCompanyActiveTab\(\)/)
  assert.match(staticIndexHtml, /const focusStaticIndustryCompanyActiveTab = \(\) =>/)
  assert.match(staticIndexHtml, /ensureStaticAiIndustryChainData\(\)\.catch\(\(\) => \{\}\)\.finally\(focusStaticIndustryCompanyActiveTab\)/)
  assert.match(staticIndexHtml, /staticIndustryCompanySegments\.length/)
})

test('enterprise library follows the policy breakpoints without global overflow', () => {
  assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.industry-company-list-head \{[\s\S]*?grid-template-columns:\s*minmax\(160px, 1fr\) minmax\(220px, 1\.4fr\)/)
  assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.ai-company-filters \{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(stylesCss, /@media \(max-width:\s*900px\) \{[\s\S]*?\.industry-company-ai-card \{[\s\S]*?grid-template-columns:\s*1fr[\s\S]*?height:\s*auto/)
  assert.match(styleBlock('.industry-company-table-wrap'), /overflow:\s*auto/)
  assert.match(styleBlock('.industry-company-table-wrap'), /scrollbar-gutter:\s*stable/)
})

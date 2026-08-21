import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultOutput = resolve(projectRoot, 'output/job-occupation-task-er/job_occupation_task_er.html')
const sourceCaptureDirectory = resolve(projectRoot, 'assets/job-occupation-task-er/source-captures')
const sourceCaptureFiles = {
  'pdf-page-02': 'pdf-page-02.png',
  'pdf-page-04': 'pdf-page-04.png',
  'pdf-page-05': 'pdf-page-05.png',
  'pdf-page-06': 'pdf-page-06.png',
  'catalog-robot-engineer-096': 'catalog-robot-engineer-096.png',
  'catalog-maintainer-562': 'catalog-maintainer-562.png',
  'occupation-standard-007': 'occupation-standard-007.png',
  'occupation-standard-012': 'occupation-standard-012.png',
  'occupation-standard-014': 'occupation-standard-014.png',
  'occupation-standard-015': 'occupation-standard-015.png',
  'occupation-standard-016': 'occupation-standard-016.png',
  'occupation-standard-017': 'occupation-standard-017.png',
  'occupation-standard-018': 'occupation-standard-018.png',
  'teaching-460304-p04': 'teaching-460304-p04.png',
  'teaching-460304-core': 'teaching-460304-core.png',
  'teaching-460305-p04': 'teaching-460305-p04.png',
  'teaching-460305-core': 'teaching-460305-core.png',
  'teaching-460305-p06': 'teaching-460305-p06.png',
  'excel-job-occupation-532-533': 'excel-job-occupation-532-533.png',
  'excel-match-detail-693-696': 'excel-match-detail-693-696.png',
  'excel-occupation-dictionary-48': 'excel-occupation-dictionary-48.png',
  'excel-occupation-dictionary-166': 'excel-occupation-dictionary-166.png'
}

function getOutputPath() {
  const index = process.argv.indexOf('--output')
  return index >= 0 && process.argv[index + 1] ? resolve(process.argv[index + 1]) : defaultOutput
}

async function buildHtml() {
  const sourceCaptures = Object.fromEntries(await Promise.all(
    Object.entries(sourceCaptureFiles).map(async ([captureId, fileName]) => {
      const image = await readFile(resolve(sourceCaptureDirectory, fileName))
      return [captureId, `data:image/png;base64,${image.toString('base64')}`]
    })
  ))
  const sourceCaptureJson = JSON.stringify(sourceCaptures)
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>岗位—职业—典型工作任务—知识能力素养关系图</title>
  <style>
    :root {
      --ink: #172033;
      --muted: #657089;
      --line: #dbe1ec;
      --surface: #ffffff;
      --surface-soft: #f6f8fc;
      --navy: #132b4f;
      --blue: #2866d7;
      --cyan: #0f8f9d;
      --green: #28845e;
      --amber: #b66a0b;
      --red: #b83a4b;
      --purple: #7352b9;
      --shadow: 0 14px 40px rgba(25, 42, 73, .09);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: linear-gradient(180deg, #eef3fb 0, #f7f9fc 360px, #f4f6fa 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.6;
    }
    button, input { font: inherit; }
    .page { width: min(1540px, calc(100% - 40px)); margin: 0 auto; padding: 28px 0 64px; }
    .hero {
      position: relative;
      overflow: hidden;
      padding: 36px 40px;
      color: #fff;
      border-radius: 24px;
      background: linear-gradient(128deg, #132b4f 0%, #1c4b7d 60%, #126e7d 100%);
      box-shadow: 0 22px 60px rgba(17, 43, 80, .22);
    }
    .hero::after {
      content: "";
      position: absolute;
      width: 360px; height: 360px; right: -90px; top: -190px;
      border-radius: 50%; border: 56px solid rgba(255,255,255,.07);
    }
    .eyebrow { margin: 0 0 8px; color: #aee8ee; font-weight: 700; letter-spacing: .12em; font-size: 13px; }
    h1 { margin: 0; max-width: 980px; font-size: clamp(28px, 3.4vw, 48px); line-height: 1.2; letter-spacing: -.025em; }
    .hero p { margin: 16px 0 0; max-width: 1050px; color: #dceafd; font-size: 16px; }
    .hero-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
    .hero-tags span { padding: 6px 11px; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; background: rgba(255,255,255,.09); font-size: 13px; }
    .toolbar {
      position: sticky; top: 0; z-index: 20;
      display: flex; gap: 12px; align-items: center; justify-content: space-between;
      margin: 18px 0; padding: 12px 16px; border: 1px solid rgba(219,225,236,.86);
      border-radius: 16px; background: rgba(255,255,255,.91); backdrop-filter: blur(14px); box-shadow: 0 8px 24px rgba(27,45,77,.07);
    }
    .search-wrap { position: relative; flex: 1; max-width: 680px; }
    .search-wrap::before { content: "⌕"; position: absolute; left: 14px; top: 7px; color: var(--blue); font-size: 23px; }
    #graph-search { width: 100%; height: 44px; padding: 0 42px; border: 1px solid #ccd5e5; border-radius: 12px; color: var(--ink); background: #fff; outline: none; }
    #graph-search:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(40,102,215,.12); }
    .toolbar-nav { display: flex; flex-wrap: wrap; gap: 7px; }
    .toolbar-nav a { color: #29486f; text-decoration: none; padding: 7px 10px; border-radius: 8px; font-size: 13px; font-weight: 650; }
    .toolbar-nav a:hover { background: #edf3ff; color: var(--blue); }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 18px 0; }
    .stat { padding: 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: 0 8px 24px rgba(28,45,76,.05); }
    .stat strong { display: block; font-size: 27px; color: var(--navy); line-height: 1.2; }
    .stat span { color: var(--muted); font-size: 13px; }
    .section { scroll-margin-top: 90px; margin-top: 22px; padding: 26px; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); box-shadow: var(--shadow); }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
    .section h2 { margin: 0; color: var(--navy); font-size: 24px; }
    .section-kicker { margin: 0 0 3px; color: var(--blue); font-weight: 750; font-size: 12px; letter-spacing: .08em; }
    .section-desc { margin: 5px 0 0; color: var(--muted); font-size: 14px; }
    .briefing-section { overflow: hidden; padding: 0; }
    .briefing-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px 26px 18px; border-bottom: 1px solid #e3e8f0; }
    .briefing-header h2 { margin: 0; }
    .briefing-header-actions { display: flex; align-items: center; gap: 10px; }
    .source-status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 999px; color: #245b49; background: #e9f7f0; font-size: 12px; font-weight: 750; }
    .source-status::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #2b8b68; box-shadow: 0 0 0 4px rgba(43,139,104,.12); }
    .evidence-button { min-height: 38px; padding: 0 14px; border: 1px solid #bfcce0; border-radius: 10px; color: #23476f; background: #fff; cursor: pointer; font-weight: 750; font-size: 13px; }
    .evidence-button:hover { border-color: var(--blue); color: var(--blue); background: #f5f8ff; }
    .briefing-job { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(360px, .7fr); gap: 20px; padding: 22px 26px; color: #fff; background: linear-gradient(125deg, #102b50 0%, #164f78 64%, #0f7d83 100%); }
    .job-overline { margin: 0 0 3px; color: #9edfe6; font-size: 12px; font-weight: 800; letter-spacing: .08em; }
    .briefing-job h3 { margin: 0; font-size: clamp(25px, 3vw, 38px); line-height: 1.22; }
    .job-context { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; }
    .job-context span { padding: 5px 9px; border: 1px solid rgba(255,255,255,.2); border-radius: 8px; color: #e7f3ff; background: rgba(255,255,255,.08); font-size: 12px; }
    .briefing-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; align-self: center; }
    .briefing-metrics div { min-height: 75px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.18); border-radius: 13px; background: rgba(255,255,255,.09); }
    .briefing-metrics strong { display: block; font-size: 24px; line-height: 1.1; }
    .briefing-metrics span { color: #d6e9f7; font-size: 11px; }
    .briefing-workspace { display: grid; grid-template-columns: minmax(310px, .38fr) minmax(0, .62fr); min-height: 500px; }
    .task-selector { padding: 22px; border-right: 1px solid #e1e6ef; background: #fbfcff; }
    .panel-label { margin: 0 0 3px; color: var(--blue); font-size: 11px; font-weight: 800; letter-spacing: .08em; }
    .task-selector h3, .task-detail h3 { margin: 0; color: var(--navy); font-size: 19px; }
    .task-selector-intro { margin: 6px 0 15px; color: var(--muted); font-size: 12px; }
    .task-list { display: grid; gap: 9px; }
    .task-choice-row { display: grid; grid-template-columns: minmax(0, 1fr) 40px; gap: 6px; }
    .task-choice { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 10px; width: 100%; padding: 12px; border: 1px solid #d7dfeb; border-radius: 12px; color: #263c5d; background: #fff; text-align: left; cursor: pointer; transition: .16s; }
    .task-choice:hover { border-color: #8fadd5; transform: translateY(-1px); box-shadow: 0 7px 18px rgba(26,56,93,.07); }
    .task-choice[aria-selected="true"] { border-color: var(--blue); color: #143c73; background: #edf4ff; box-shadow: 0 0 0 3px rgba(40,102,215,.08); }
    .task-number { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 9px; color: #fff; background: #91a2bb; font-size: 11px; font-weight: 800; }
    .task-choice[aria-selected="true"] .task-number { background: var(--blue); }
    .task-name { font-size: 13px; font-weight: 750; line-height: 1.4; }
    .task-page { color: #7a879c; font-size: 10px; white-space: nowrap; }
    .field-detail-button { display: grid; place-items: center; border: 1px solid #cfd9e8; border-radius: 11px; color: #496581; background: #f8fbff; cursor: pointer; font-size: 16px; transition: .16s; }
    .field-detail-button:hover, .field-detail-button:focus-visible { border-color: var(--blue); color: var(--blue); background: #edf4ff; outline: none; }
    .candidate-note { width: 100%; margin-top: 14px; padding: 11px 12px; border: 0; border-left: 4px solid var(--amber); border-radius: 8px; color: #725622; background: #fff8e9; font-size: 11px; text-align: left; cursor: pointer; }
    .candidate-note:hover { background: #fff2d8; }
    .task-detail { padding: 22px 24px 24px; }
    .task-detail-head { display: flex; justify-content: space-between; gap: 14px; align-items: start; padding-bottom: 15px; border-bottom: 1px solid #e3e8f0; }
    .task-detail-summary { min-width: 0; padding: 0; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
    .task-detail-summary:hover h3 { color: var(--blue); }
    .task-detail-head p { margin: 5px 0 0; max-width: 780px; color: var(--muted); font-size: 12px; }
    .evidence-chip { flex: none; padding: 5px 9px; border: 0; border-radius: 999px; color: #81530e; background: #fff2d8; font-size: 10px; font-weight: 800; cursor: pointer; }
    .evidence-chip:hover { background: #ffe5ae; }
    .requirement-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11px; margin-top: 16px; }
    .requirement-column { overflow: hidden; border: 1px solid #dce3ed; border-radius: 13px; background: #fff; }
    .requirement-column header { padding: 0; }
    .requirement-kind-detail { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 12px; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
    .requirement-kind-detail:hover { filter: brightness(.97); }
    .requirement-kind-detail strong { font-size: 13px; }
    .requirement-kind-detail span { display: grid; place-items: center; width: 23px; height: 23px; border-radius: 7px; color: #fff; font-size: 10px; font-weight: 800; }
    .requirement-column.knowledge header { color: #245ca9; background: #edf4ff; }
    .requirement-column.knowledge header span { background: #2866d7; }
    .requirement-column.ability header { color: #166c73; background: #eaf9fa; }
    .requirement-column.ability header span { background: #0f8f9d; }
    .requirement-column.quality header { color: #27684e; background: #edf8f2; }
    .requirement-column.quality header span { background: #28845e; }
    .requirement-items { display: grid; gap: 0; }
    .requirement-item { width: 100%; padding: 11px 12px; border: 0; border-top: 1px solid #edf0f5; background: #fff; text-align: left; cursor: pointer; }
    .requirement-item:hover { background: #f6f9fe; }
    .requirement-item strong { display: block; color: #263a58; font-size: 12px; line-height: 1.45; }
    .requirement-item small { display: block; margin-top: 4px; color: #7a879a; font-size: 10px; line-height: 1.45; }
    .requirement-source-tag { display: inline-flex; margin-top: 6px; padding: 2px 6px; border-radius: 999px; background: #eef3fb; color: #58708f; font-size: 9px; font-style: normal; font-weight: 800; }
    .occupation-band { padding: 0 24px 23px; }
    .occupation-band-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
    .occupation-band-head h4 { margin: 0; color: var(--navy); font-size: 14px; }
    .occupation-band-head span { color: var(--muted); font-size: 10px; }
    .occupation-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .occupation-card { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 12px; border: 1px solid #dbe2ec; border-radius: 12px; color: inherit; background: #fafcff; text-align: left; cursor: pointer; }
    .occupation-card:hover { border-color: var(--blue); box-shadow: 0 7px 18px rgba(26,56,93,.07); }
    .occupation-card.primary { border-color: #9fcdb9; background: #eff9f4; }
    .occupation-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #fff; background: #6280a5; font-size: 15px; }
    .occupation-card.primary .occupation-icon { background: #28845e; }
    .occupation-card strong { display: block; color: #1e3656; font-size: 12px; }
    .occupation-card code { display: inline-block; margin-top: 2px; }
    .occupation-card em { color: #7e5b1b; font-size: 10px; font-style: normal; font-weight: 750; }
    .evidence-drawer-layer { position: fixed; inset: 0; z-index: 100; display: grid; grid-template-columns: minmax(0, 1fr) minmax(380px, 560px); background: rgba(10,24,45,.38); backdrop-filter: blur(3px); }
    .evidence-drawer-layer[hidden] { display: none; }
    .evidence-drawer { grid-column: 2; overflow: auto; height: 100%; padding: 24px; color: var(--ink); background: #fff; box-shadow: -20px 0 60px rgba(9,25,50,.24); }
    .drawer-head { display: flex; align-items: start; justify-content: space-between; gap: 14px; padding-bottom: 17px; border-bottom: 1px solid #e2e7ef; }
    .drawer-head h2 { margin: 0; color: var(--navy); font-size: 22px; }
    .drawer-head p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
    .drawer-close { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #cfd8e5; border-radius: 10px; color: #47607f; background: #fff; cursor: pointer; font-size: 20px; }
    .evidence-timeline { display: grid; gap: 12px; margin-top: 18px; }
    .evidence-record { position: relative; padding: 15px 15px 15px 50px; border: 1px solid #dce3ed; border-radius: 13px; background: #fbfcff; }
    .evidence-record::before { content: attr(data-step); position: absolute; left: 14px; top: 15px; display: grid; place-items: center; width: 25px; height: 25px; border-radius: 8px; color: #fff; background: #526f96; font-size: 10px; font-weight: 800; }
    .evidence-record.rule-record::before { background: var(--amber); }
    .evidence-record.candidate-record::before { background: var(--cyan); }
    .evidence-record h3 { margin: 0; color: #243b5a; font-size: 14px; }
    .evidence-record p { margin: 5px 0 0; color: #5e6c82; font-size: 12px; }
    .evidence-record dl { display: grid; grid-template-columns: 88px 1fr; gap: 6px 10px; margin: 11px 0 0; font-size: 11px; }
    .evidence-record dt { color: #8390a3; }
    .evidence-record dd { margin: 0; color: #344761; word-break: break-word; }
    .evidence-boundary { margin-top: 15px; padding: 13px; border: 1px solid #efcc92; border-radius: 11px; color: #6f541f; background: #fff8e9; font-size: 12px; }
    .field-drawer-content { display: grid; gap: 16px; margin-top: 18px; }
    .field-drawer-placeholder { padding: 18px; border: 1px solid #dce3ed; border-radius: 14px; color: #52647d; background: #f8faff; }
    #robot-field-drawer { grid-template-columns: minmax(0, 1fr) minmax(580px, 760px); }
    .field-value-card { padding: 15px; border: 1px solid #cbd9ec; border-radius: 14px; background: linear-gradient(135deg, #eef5ff, #f7fbff); }
    .field-value-card small { display: block; color: #6d7c92; font-size: 10px; font-weight: 800; letter-spacing: .08em; }
    .field-value-card strong { display: block; margin-top: 3px; color: #173253; font-size: 18px; line-height: 1.4; }
    .field-value-card p { margin: 5px 0 0; color: #596b84; font-size: 12px; }
    .field-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; color: #203a5d; font-size: 13px; }
    .field-section-title b { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 8px; color: #fff; background: var(--blue); font-size: 11px; }
    .source-preview { overflow: hidden; border: 1px solid #d6deea; border-radius: 14px; background: #fff; box-shadow: 0 8px 20px rgba(26,49,81,.06); }
    .source-preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; color: #344a67; background: #f3f6fb; font-size: 10px; }
    .source-preview-head strong { color: #1e385b; font-size: 11px; }
    .source-capture-grid { display: grid; gap: 10px; padding: 12px; background: #edf1f6; }
    .source-capture-button { overflow: hidden; width: 100%; padding: 0; border: 1px solid #c8d3e2; border-radius: 10px; color: #294766; background: #fff; text-align: left; cursor: zoom-in; box-shadow: 0 5px 14px rgba(22,44,74,.08); }
    .source-capture-button:hover, .source-capture-button:focus-visible { border-color: var(--blue); outline: 3px solid rgba(40,102,215,.1); }
    .source-capture-image { display: block; width: 100%; max-height: 340px; object-fit: contain; object-position: left top; background: #fff; }
    .source-capture-caption { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-top: 1px solid #e0e6ef; font-size: 10px; }
    .source-capture-caption strong { color: #23466f; }
    .source-capture-caption span { color: #6c7b90; }
    .source-capture-lightbox { position: fixed; inset: 0; z-index: 180; display: grid; grid-template-rows: auto minmax(0, 1fr); padding: 18px; color: #fff; background: rgba(6,17,32,.93); }
    .source-capture-lightbox[hidden] { display: none; }
    .source-capture-lightbox-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 0 0 12px; }
    .source-capture-lightbox-head strong { font-size: 14px; }
    .source-capture-lightbox-close { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.32); border-radius: 10px; color: #fff; background: rgba(255,255,255,.1); cursor: pointer; font-size: 22px; }
    .source-capture-lightbox-stage { overflow: auto; display: grid; place-items: start center; border-radius: 12px; background: #d9dee6; }
    .source-capture-lightbox-image { display: block; max-width: none; min-width: 100%; height: auto; background: #fff; }
    .field-process-flow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
    .process-step { position: relative; min-height: 116px; padding: 12px; border: 1px solid #d8e0ec; border-radius: 12px; background: #fbfcff; }
    .process-step:not(:last-child)::after { content: "→"; position: absolute; right: -15px; top: 43px; color: #8e9db3; font-size: 18px; font-weight: 800; }
    .process-step i { display: grid; place-items: center; width: 23px; height: 23px; margin-bottom: 7px; border-radius: 7px; color: #fff; background: #55749a; font-size: 10px; font-style: normal; font-weight: 800; }
    .process-step strong { display: block; color: #29415f; font-size: 11px; }
    .process-step span { display: block; margin-top: 4px; color: #6a7890; font-size: 9px; line-height: 1.5; }
    .process-step.result { border-color: #a9d2c1; background: #eff9f4; }
    .process-step.result i { background: var(--green); }
    .field-calculation { padding: 13px 14px; border: 1px solid #bcd6e9; border-radius: 12px; color: #38566f; background: #f0f8fd; font-size: 11px; }
    .field-calculation code { display: block; margin: 6px 0; color: #164e6d; background: #dff1fb; font-size: 11px; white-space: normal; }
    .field-boundary { padding: 13px 14px; border: 1px solid #efc98b; border-radius: 12px; color: #6c511e; background: #fff8e9; font-size: 11px; }
    .legend { display: flex; flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 12px; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 32px; height: 0; border-top: 3px solid var(--blue); }
    .legend .rule { border-top-style: dashed; border-color: var(--amber); }
    .legend .inferred { border-top-style: dotted; border-color: var(--red); }
    .graph-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 16px; }
    .graph-shell { overflow: auto; min-height: 590px; padding: 10px; border: 1px solid #e1e6ef; border-radius: 16px; background: radial-gradient(circle at 1px 1px, #dce3ef 1px, transparent 1.5px) 0 0/20px 20px, #f9fbfe; }
    svg { min-width: 1060px; width: 100%; height: auto; display: block; }
    .edge { fill: none; stroke-width: 3; cursor: pointer; opacity: .78; transition: .18s; }
    .edge.direct { stroke: var(--blue); }
    .edge.rule { stroke: var(--amber); stroke-dasharray: 10 7; }
    .edge.inferred { stroke: var(--red); stroke-dasharray: 2 8; stroke-linecap: round; }
    .edge:hover, .edge.active { opacity: 1; stroke-width: 5; filter: drop-shadow(0 2px 3px rgba(0,0,0,.16)); }
    .edge-label { font-size: 11px; fill: #475670; font-weight: 700; pointer-events: none; paint-order: stroke; stroke: #f9fbfe; stroke-width: 6px; stroke-linejoin: round; }
    .node { cursor: pointer; transition: .18s; }
    .node rect { stroke: #d2dbe8; stroke-width: 1.5; filter: drop-shadow(0 8px 10px rgba(27,47,77,.08)); }
    .node:hover rect, .node.active rect { stroke: var(--blue); stroke-width: 3; filter: drop-shadow(0 10px 14px rgba(40,102,215,.18)); }
    .node.dim, .edge.dim, .searchable.dim { opacity: .18; }
    .node-title { font-size: 16px; fill: #12233e; font-weight: 800; }
    .node-field { font-size: 11px; fill: #5d6980; }
    .node-chip { font-size: 9px; fill: #fff; font-weight: 800; letter-spacing: .05em; }
    #detail-panel { position: sticky; top: 86px; align-self: start; min-height: 420px; padding: 20px; border: 1px solid #d9e1ed; border-radius: 16px; background: linear-gradient(160deg, #fff, #f7f9fd); }
    #detail-panel h3 { margin: 6px 0 5px; color: var(--navy); font-size: 20px; }
    #detail-panel .type { display: inline-flex; padding: 3px 8px; border-radius: 999px; color: #fff; background: var(--blue); font-size: 11px; font-weight: 750; }
    #detail-panel p { margin: 8px 0 14px; color: var(--muted); font-size: 13px; }
    #detail-panel dl { margin: 0; }
    #detail-panel dt { margin-top: 12px; color: #71809a; font-size: 11px; font-weight: 750; text-transform: uppercase; }
    #detail-panel dd { margin: 3px 0 0; color: #273650; font-size: 13px; word-break: break-word; }
    .schema-note { margin-top: 16px; padding: 13px; border-left: 4px solid var(--cyan); border-radius: 9px; background: #edf9fa; color: #285c63; font-size: 13px; }
    .chain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .chain { padding: 20px; border: 1px solid var(--line); border-radius: 16px; background: #fbfcff; }
    .chain h3 { margin: 0; color: var(--navy); font-size: 18px; }
    .chain-meta { margin: 4px 0 16px; color: var(--muted); font-size: 12px; }
    .flow { display: flex; flex-wrap: wrap; gap: 7px; align-items: stretch; }
    .flow-item { flex: 1 1 145px; min-height: 88px; padding: 12px; border: 1px solid #d5dfec; border-radius: 11px; background: #fff; }
    .flow-item small { display: block; color: var(--muted); font-size: 10px; }
    .flow-item strong { display: block; margin-top: 4px; color: #183254; font-size: 13px; line-height: 1.45; }
    .flow-item code { color: var(--blue); font-size: 11px; }
    .gap { margin-top: 12px; padding: 10px 12px; border: 1px solid #efb8bf; border-radius: 10px; color: #912c3b; background: #fff3f5; font-size: 12px; font-weight: 700; }
    .ok { margin-top: 12px; padding: 10px 12px; border: 1px solid #b7dfce; border-radius: 10px; color: #25654c; background: #effaf5; font-size: 12px; }
    .table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; min-width: 1050px; font-size: 13px; }
    th { position: sticky; top: 0; z-index: 2; padding: 12px; color: #e8f1ff; background: var(--navy); text-align: left; white-space: nowrap; }
    td { padding: 12px; border-bottom: 1px solid #e5e9f1; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f8faff; }
    tbody tr:hover { background: #edf4ff; }
    code { padding: 2px 5px; border-radius: 5px; color: #354f79; background: #edf2fa; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 800; white-space: nowrap; }
    .badge.direct { color: #1f5f47; background: #e8f7f0; }
    .badge.rule { color: #85510a; background: #fff3da; }
    .badge.inferred { color: #8f3040; background: #ffedf0; }
    .callout { display: grid; grid-template-columns: auto 1fr; gap: 12px; margin: 16px 0 0; padding: 16px; border: 1px solid #f0d3a5; border-radius: 13px; background: #fff9ee; }
    .callout b { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; color: #fff; background: var(--amber); }
    .callout p { margin: 0; color: #6b511f; font-size: 13px; }
    .requirement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .req-card { padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: #fbfcff; }
    .req-card h3 { margin: 0 0 8px; font-size: 16px; }
    .req-card ul { margin: 0; padding-left: 19px; color: #4f5d73; font-size: 13px; }
    .footer { margin-top: 20px; padding: 18px 4px; color: #68748b; font-size: 12px; text-align: center; }
    mark { padding: 0 2px; color: inherit; background: #ffe394; }
    .no-results { display: none; margin: 14px 0 0; padding: 12px; border-radius: 10px; color: #883444; background: #fff1f3; }
    @media (max-width: 1050px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .graph-layout, .chain-grid { grid-template-columns: 1fr; }
      .briefing-job, .briefing-workspace { grid-template-columns: 1fr; }
      .task-selector { border-right: 0; border-bottom: 1px solid #e1e6ef; }
      #detail-panel { position: static; }
      .requirement-grid { grid-template-columns: 1fr; }
      .toolbar { position: static; align-items: stretch; flex-direction: column; }
      .search-wrap { max-width: none; }
    }
    @media (max-width: 640px) {
      .page { width: min(100% - 20px, 1540px); padding-top: 10px; }
      .hero, .section { padding: 20px; border-radius: 16px; }
      .stats { grid-template-columns: 1fr; }
      .section-head { align-items: start; flex-direction: column; }
      .briefing-header { align-items: start; flex-direction: column; }
      .briefing-header-actions { width: 100%; justify-content: space-between; }
      .briefing-job { padding: 20px; }
      .briefing-metrics, .occupation-cards, .requirement-columns { grid-template-columns: 1fr; }
      .task-selector, .task-detail, .occupation-band { padding-left: 18px; padding-right: 18px; }
      .evidence-drawer-layer { grid-template-columns: 1fr; }
      #robot-field-drawer { grid-template-columns: 1fr; }
      .evidence-drawer { grid-column: 1; }
      .field-process-flow { grid-template-columns: 1fr; }
      .process-step:not(:last-child)::after { content: "↓"; right: auto; left: 50%; top: auto; bottom: -18px; }
      .source-capture-image { max-height: 230px; }
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { width: 100%; }
      .section, .hero { break-inside: avoid; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">SOURCE-AWARE JOB CHAIN · 2026-08-20</p>
      <h1>岗位—职业—典型工作任务—知识能力素养关系图</h1>
      <p>把岗位数据、职业分类、职业标准、专业教学标准和岗位详情模板放进同一套可追溯模型。图中区分直接证据、规则匹配与推断待核；任何缺失标准都保留为空缺，不用“相似内容”冒充正式依据。</p>
      <div class="hero-tags"><span>岗位 ≠ 职业</span><span>岗位与职业是 N:M</span><span>职业编码是主匹配键</span><span>任务—要求用关系表</span><span>来源证据可追溯</span></div>
    </header>

    <nav class="toolbar" aria-label="页面导航与搜索">
      <div class="search-wrap"><input id="graph-search" type="search" placeholder="搜索岗位、职业编码、文件名、字段或任务……" autocomplete="off"></div>
      <div class="toolbar-nav"><a href="#job-full-chain">汇报视图</a><a href="#er">ER关系</a><a href="#chains">证据链</a><a href="#mapping">字段映射</a><a href="#examples">岗位样例</a><a href="#rules">落库规则</a></div>
    </nav>

    <section class="stats" aria-label="源文件概览">
      <div class="stat"><strong>5</strong><span>类核心数据源</span></div>
      <div class="stat"><strong>471</strong><span>匹配表去重岗位名称</span></div>
      <div class="stat"><strong>163</strong><span>匹配表去重职业</span></div>
      <div class="stat"><strong>715</strong><span>岗位—职业关系行</span></div>
      <div class="stat"><strong>N:M</strong><span>岗位与职业基数</span></div>
    </section>

    <section class="section briefing-section searchable" id="job-full-chain" data-search="机器人调试工程师 机器人工程技术人员 2-02-38-10 典型工作任务 知识 能力 素养 关联依据">
      <div class="briefing-header">
        <div>
          <p class="section-kicker">00 · 汇报视图</p>
          <h2>一个岗位，看清任务、能力与职业依据</h2>
          <p class="section-desc">以库内真实岗位为起点；点击任务切换知识、能力、素养，关联依据可随时追溯。</p>
        </div>
        <div class="briefing-header-actions">
          <span class="source-status">库内岗位已核验</span>
          <button class="evidence-button" type="button" data-open-robot-evidence aria-controls="robot-evidence-drawer">查看关联依据</button>
        </div>
      </div>

      <div class="briefing-job">
        <div>
          <p class="job-overline">机器人产业链 · 中游岗位</p>
          <h3>机器人调试工程师</h3>
          <div class="job-context">
            <span>合并组 M0428</span>
            <span>源岗位 IC-L3-1309</span>
            <span>源岗位 IC-L3-815</span>
            <span>机器人本体制造与系统集成</span>
          </div>
        </div>
        <div class="briefing-metrics" aria-label="岗位全链条摘要">
          <div><strong>2</strong><span>条源岗位记录</span></div>
          <div><strong>2</strong><span>个关联职业</span></div>
          <div><strong>5</strong><span>项典型任务候选</span></div>
          <div><strong id="robot-requirement-total">12</strong><span>当前任务要求</span></div>
        </div>
      </div>

      <div class="briefing-workspace">
        <aside class="task-selector" aria-label="典型工作任务列表">
          <p class="panel-label">典型工作任务</p>
          <h3>选择任务，查看能力要求</h3>
          <p class="task-selector-intro">任务按“动作 + 对象 + 产出”归并，并逐条保留职业大典、职业标准和教学标准证据。</p>
          <div class="task-list" role="tablist" aria-label="机器人调试工程师典型工作任务">
            <div class="task-choice-row"><button class="task-choice" type="button" role="tab" data-task-id="robot-install" aria-selected="true" aria-controls="robot-task-detail"><span class="task-number">01</span><span class="task-name">机器人系统安装与现场调试</span><span class="task-page">多源</span></button><button class="field-detail-button" type="button" data-field-detail="task:robot-install" aria-label="查看机器人系统安装与现场调试详情">⌕</button></div>
            <div class="task-choice-row"><button class="task-choice" type="button" role="tab" data-task-id="robot-program" aria-selected="false" aria-controls="robot-task-detail"><span class="task-number">02</span><span class="task-name">机器人编程与离线仿真</span><span class="task-page">多源</span></button><button class="field-detail-button" type="button" data-field-detail="task:robot-program" aria-label="查看机器人编程与离线仿真详情">⌕</button></div>
            <div class="task-choice-row"><button class="task-choice" type="button" role="tab" data-task-id="robot-integration" aria-selected="false" aria-controls="robot-task-detail"><span class="task-number">03</span><span class="task-name">机器人应用系统集成与联调</span><span class="task-page">多源</span></button><button class="field-detail-button" type="button" data-field-detail="task:robot-integration" aria-label="查看机器人应用系统集成与联调详情">⌕</button></div>
            <div class="task-choice-row"><button class="task-choice" type="button" role="tab" data-task-id="robot-virtual" aria-selected="false" aria-controls="robot-task-detail"><span class="task-number">04</span><span class="task-name">机器人生产线虚拟调试</span><span class="task-page">多源</span></button><button class="field-detail-button" type="button" data-field-detail="task:robot-virtual" aria-label="查看机器人生产线虚拟调试详情">⌕</button></div>
            <div class="task-choice-row"><button class="task-choice" type="button" role="tab" data-task-id="robot-maintenance" aria-selected="false" aria-controls="robot-task-detail"><span class="task-number">05</span><span class="task-name">机器人系统运行维护与故障诊断</span><span class="task-page">多源</span></button><button class="field-detail-button" type="button" data-field-detail="task:robot-maintenance" aria-label="查看机器人系统运行维护与故障诊断详情">⌕</button></div>
          </div>
          <button class="candidate-note" type="button" data-field-detail="candidate-boundary"><strong>口径说明：</strong>企业原文尚未采集；以下候选由职业大典定边界、职业标准拆要求、多份教学标准补培养侧证据。 <u>查看详情</u></button>
        </aside>

        <div>
          <section class="task-detail" id="robot-task-detail" role="tabpanel" aria-live="polite">
            <div class="task-detail-head">
              <button class="task-detail-summary" type="button" data-field-detail="current-task"><p class="panel-label">当前任务 · 点击查看字段详情</p><h3 id="robot-task-title">机器人系统安装与现场调试</h3><p id="robot-task-description">依据装配图、电气图和系统方案完成机器人本体、外围设备及控制系统安装，完成参数配置、坐标标定和现场联调。</p></button>
              <button class="evidence-chip" id="robot-task-source" type="button" data-field-detail="current-task-source">多源标准归并</button>
            </div>
            <div class="requirement-columns">
              <article class="requirement-column knowledge" data-requirement-type="knowledge"><header><button class="requirement-kind-detail" type="button" data-field-detail="category:knowledge"><strong>知识</strong><span>K</span></button></header><div class="requirement-items" id="robot-knowledge-items"><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:knowledge:0"><strong>机器人系统结构与安全规范</strong><small>理解系统构成、安装方法和安全操作边界。</small></button><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:knowledge:1"><strong>坐标系、接口与参数配置原理</strong><small>掌握坐标标定、I/O 接口和外围设备连接方法。</small></button></div></article>
              <article class="requirement-column ability" data-requirement-type="ability"><header><button class="requirement-kind-detail" type="button" data-field-detail="category:ability"><strong>能力</strong><span>A</span></button></header><div class="requirement-items" id="robot-ability-items"><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:ability:0"><strong>机器人本体与外围设备安装</strong><small>能依据图纸完成装配、接线和接口检查。</small></button><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:ability:1"><strong>参数设置、标定与现场联调</strong><small>能配置参数并验证单元动作和系统节拍。</small></button></div></article>
              <article class="requirement-column quality" data-requirement-type="quality"><header><button class="requirement-kind-detail" type="button" data-field-detail="category:quality"><strong>素养</strong><span>Q</span></button></header><div class="requirement-items" id="robot-quality-items"><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:quality:0"><strong>安全与规范意识</strong><small>按规程隔离风险、复核接线和运行条件。</small></button><button class="requirement-item" type="button" data-field-detail="requirement:robot-install:quality:1"><strong>质量与记录意识</strong><small>完整保留参数、标定和调试记录，确保可追溯。</small></button></div></article>
            </div>
          </section>

          <section class="occupation-band" aria-label="岗位关联职业">
            <div class="occupation-band-head"><h4>该岗位关联的国家职业</h4><span>岗位与职业为 N:M 关系，以下两条分别落库</span></div>
            <div class="occupation-cards">
              <button class="occupation-card primary" type="button" data-field-detail="occupation:2-02-38-10"><span class="occupation-icon">主</span><span><strong>机器人工程技术人员</strong><code>2-02-38-10</code></span><em>查看详情</em></button>
              <button class="occupation-card" type="button" data-field-detail="occupation:6-31-07-01"><span class="occupation-icon">兼</span><span><strong>工业机器人系统运维员</strong><code>6-31-07-01</code></span><em>查看详情</em></button>
            </div>
          </section>
        </div>
      </div>
    </section>

    <section class="section" id="er">
      <div class="section-head">
        <div><p class="section-kicker">01 · 目标数据模型</p><h2>从文件证据到岗位典型工作任务</h2><p class="section-desc">点击实体或关系线查看主键、来源字段和匹配规则；悬停可突出当前对象。</p></div>
        <div class="legend"><span><i></i>直接证据</span><span><i class="rule"></i>规则匹配</span><span><i class="inferred"></i>推断/待核</span></div>
      </div>
      <div class="graph-layout">
        <div class="graph-shell">
          <svg viewBox="0 0 1440 720" role="img" aria-label="岗位职业典型工作任务知识能力素养ER图">
            <defs>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#2866d7"/></marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b66a0b"/></marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b83a4b"/></marker>
            </defs>

            <path class="edge direct" data-edge-id="document-source-evidence" data-source="source-document" data-target="source-evidence" d="M210 165 C260 165 260 165 310 165" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="233" y="151">1:N 提取</text>
            <path class="edge direct" data-edge-id="job-job-occupation" data-source="job" data-target="job-occupation" d="M210 465 C260 465 260 465 310 465" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="226" y="450">1:N</text>
            <path class="edge direct" data-edge-id="job-occupation-occupation" data-source="job-occupation" data-target="occupation" d="M530 465 C580 465 580 465 630 465" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="546" y="450">N:1 编码</text>
            <path class="edge direct" data-edge-id="occupation-standard-item" data-source="occupation" data-target="standard-work-item" d="M850 465 C900 465 900 465 950 465" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="868" y="450">1:N</text>
            <path class="edge rule" data-edge-id="standard-item-job-task" data-source="standard-work-item" data-target="job-task" d="M1170 465 C1220 465 1220 465 1270 465" marker-end="url(#arrow-amber)"/>
            <text class="edge-label" x="1180" y="450">N:M 归并</text>
            <path class="edge direct" data-edge-id="job-task-task-requirement" data-source="job-task" data-target="task-requirement" d="M1270 525 C1240 590 1190 610 1150 610" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="1190" y="575">1:N</text>
            <path class="edge direct" data-edge-id="task-requirement-requirement" data-source="task-requirement" data-target="requirement" d="M930 610 C880 610 880 610 830 610" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="858" y="596">N:1</text>
            <path class="edge direct" data-edge-id="evidence-entities" data-source="source-evidence" data-target="occupation" d="M420 225 C450 310 610 325 700 405" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="495" y="310">证据引用</text>
            <path class="edge direct" data-edge-id="evidence-standard-item" data-source="source-evidence" data-target="standard-work-item" d="M530 165 C710 165 860 285 1030 405" marker-end="url(#arrow-blue)"/>
            <text class="edge-label" x="760" y="230">章节/页码/表格字段</text>
            <path class="edge rule" data-edge-id="evidence-job-task" data-source="source-evidence" data-target="job-task" d="M530 125 C850 40 1250 180 1350 405" marker-end="url(#arrow-amber)"/>
            <text class="edge-label" x="940" y="105">证据综合与任务归并</text>
            <path class="edge inferred" data-edge-id="review-loop" data-source="requirement" data-target="source-evidence" d="M720 550 C690 335 565 275 460 225" marker-end="url(#arrow-red)"/>
            <text class="edge-label" x="610" y="355">复核状态/反向追溯</text>

            <g class="node searchable" data-node-id="source-document" data-search="源文件 专业教学标准 职业分类大典 国家职业标准 岗位模板 匹配表">
              <rect x="30" y="105" width="180" height="120" rx="14" fill="#eef5ff"/>
              <rect x="30" y="105" width="180" height="25" rx="14" fill="#2866d7"/>
              <text class="node-chip" x="43" y="121">SOURCE</text><text class="node-title" x="45" y="157">source_document</text>
              <text class="node-field" x="45" y="180">PK document_id</text><text class="node-field" x="45" y="198">document_type / version</text><text class="node-field" x="45" y="216">file_path / authority</text>
            </g>
            <g class="node searchable" data-node-id="source-evidence" data-search="来源证据 页码 章节 表格 原文 evidence source">
              <rect x="310" y="105" width="220" height="120" rx="14" fill="#eefaf8"/>
              <rect x="310" y="105" width="220" height="25" rx="14" fill="#28845e"/>
              <text class="node-chip" x="323" y="121">EVIDENCE</text><text class="node-title" x="325" y="157">source_evidence</text>
              <text class="node-field" x="325" y="180">PK evidence_id · FK document_id</text><text class="node-field" x="325" y="198">page / section / table_field</text><text class="node-field" x="325" y="216">source_text / review_status</text>
            </g>
            <g class="node searchable" data-node-id="job" data-search="岗位 job 岗位编号 岗位名称 产业链 环节">
              <rect x="30" y="405" width="180" height="120" rx="14" fill="#fff5e7"/>
              <rect x="30" y="405" width="180" height="25" rx="14" fill="#b66a0b"/>
              <text class="node-chip" x="43" y="421">BUSINESS</text><text class="node-title" x="45" y="457">job</text>
              <text class="node-field" x="45" y="480">PK job_id</text><text class="node-field" x="45" y="498">job_name</text><text class="node-field" x="45" y="516">industry_chain / node</text>
            </g>
            <g class="node searchable" data-node-id="job-occupation" data-search="岗位职业关系 relation match basis confidence review">
              <rect x="310" y="405" width="220" height="120" rx="14" fill="#fff5e7"/>
              <rect x="310" y="405" width="220" height="25" rx="14" fill="#b66a0b"/>
              <text class="node-chip" x="323" y="421">RELATION</text><text class="node-title" x="325" y="457">job_occupation_relation</text>
              <text class="node-field" x="325" y="480">PK relation_id · FK job_id</text><text class="node-field" x="325" y="498">FK occupation_code</text><text class="node-field" x="325" y="516">match_basis / confidence / status</text>
            </g>
            <g class="node searchable" data-node-id="occupation" data-search="国家职业 职业编码 职业名称 职业定义 occupation">
              <rect x="630" y="405" width="220" height="120" rx="14" fill="#eef5ff"/>
              <rect x="630" y="405" width="220" height="25" rx="14" fill="#2866d7"/>
              <text class="node-chip" x="643" y="421">NATIONAL</text><text class="node-title" x="645" y="457">occupation</text>
              <text class="node-field" x="645" y="480">PK occupation_code</text><text class="node-field" x="645" y="498">occupation_name / definition</text><text class="node-field" x="645" y="516">classification_version</text>
            </g>
            <g class="node searchable" data-node-id="standard-work-item" data-search="标准工作项 职业功能 工作内容 大典主要工作任务 教学标准典型工作任务">
              <rect x="950" y="405" width="220" height="120" rx="14" fill="#f2edff"/>
              <rect x="950" y="405" width="220" height="25" rx="14" fill="#7352b9"/>
              <text class="node-chip" x="963" y="421">STANDARD</text><text class="node-title" x="965" y="457">standard_work_item</text>
              <text class="node-field" x="965" y="480">PK work_item_id</text><text class="node-field" x="965" y="498">source_type / level / function</text><text class="node-field" x="965" y="516">work_content / evidence_id</text>
            </g>
            <g class="node searchable" data-node-id="job-task" data-search="岗位典型工作任务 task 任务名称 任务描述 产出">
              <rect x="1270" y="405" width="150" height="120" rx="14" fill="#eaf9fb"/>
              <rect x="1270" y="405" width="150" height="25" rx="14" fill="#0f8f9d"/>
              <text class="node-chip" x="1283" y="421">TASK</text><text class="node-title" x="1285" y="457">job_task</text>
              <text class="node-field" x="1285" y="480">PK task_id</text><text class="node-field" x="1285" y="498">FK job_id</text><text class="node-field" x="1285" y="516">name / desc / output</text>
            </g>
            <g class="node searchable" data-node-id="task-requirement" data-search="任务要求关联 task requirement relation 唯一事实来源">
              <rect x="930" y="555" width="220" height="115" rx="14" fill="#eaf9fb"/>
              <rect x="930" y="555" width="220" height="25" rx="14" fill="#0f8f9d"/>
              <text class="node-chip" x="943" y="571">RELATION</text><text class="node-title" x="945" y="607">task_requirement_relation</text>
              <text class="node-field" x="945" y="630">PK relation_id · FK task_id</text><text class="node-field" x="945" y="648">FK requirement_id / relevance</text><text class="node-field" x="945" y="666">evidence_id / review_status</text>
            </g>
            <g class="node searchable" data-node-id="requirement" data-search="知识 能力 素养 requirement knowledge ability quality">
              <rect x="610" y="555" width="220" height="115" rx="14" fill="#eefaf2"/>
              <rect x="610" y="555" width="220" height="25" rx="14" fill="#28845e"/>
              <text class="node-chip" x="623" y="571">K · A · Q</text><text class="node-title" x="625" y="607">requirement_item</text>
              <text class="node-field" x="625" y="630">PK requirement_id</text><text class="node-field" x="625" y="648">type: 知识 / 能力 / 素养</text><text class="node-field" x="625" y="666">statement / level / evidence_id</text>
            </g>
          </svg>
        </div>
        <aside id="detail-panel" aria-live="polite">
          <span class="type">使用说明</span><h3>点击图中实体或连线</h3>
          <p>这里会显示字段、来源文件、匹配键、证据等级和复核要求。搜索框也会同步筛选图、证据链与表格行。</p>
          <dl><dt>核心原则</dt><dd>岗位是企业用工单元；职业是国家职业分类单元。两者通过关系表匹配，不能直接把岗位名称当职业名称。</dd><dt>推荐主键</dt><dd><code>job_id</code>、<code>occupation_code</code>、<code>task_id</code>、<code>requirement_id</code>。</dd><dt>关系事实</dt><dd>岗位—职业、任务—知识能力素养均按 N:M 建模。</dd></dl>
          <div class="schema-note"><strong>规范化建议：</strong>以 <code>task_requirement_relation</code> 作为任务—知识/能力/素养关联的唯一事实来源；模板中的 <code>ability_ids</code>、<code>related_task_ids</code> 只作为派生展示字段，避免双向数组不一致。</div>
        </aside>
      </div>
    </section>

    <section class="section" id="chains">
      <div class="section-head"><div><p class="section-kicker">02 · 真实证据链</p><h2>两条可审计样例，明确哪里有证据、哪里缺证据</h2><p class="section-desc">机械链条用于展示“岗位→职业→专业教学标准”；广告设计师链条用于展示“职业→国家职业标准→知识能力素养”。两条链不交叉冒充。</p></div></div>
      <div class="chain-grid">
        <article class="chain searchable" data-search="机械设计 2-02-07-01 460301 机电一体化 机械设计工程技术人员">
          <h3>链 A｜机械设计岗位</h3><p class="chain-meta">岗位映射表 + 职业分类大典 + 专业教学标准</p>
          <div class="flow">
            <div class="flow-item"><small>岗位</small><strong>机械设计</strong><code>IC-L3-1130；IC-L3-792</code></div>
            <div class="flow-item"><small>岗位—职业关系</small><strong>对应职业</strong><code>规则匹配 / 待复核</code></div>
            <div class="flow-item"><small>国家职业</small><strong>机械设计工程技术人员</strong><code>2-02-07-01</code></div>
            <div class="flow-item"><small>职业分类大典主要工作任务</small><strong>研究设计方法、机械零部件设计、性能试验、设计流程管理等</strong><code>PDF 第41页</code></div>
            <div class="flow-item"><small>专业教学标准</small><strong>机电一体化技术</strong><code>460301 · 第1—3页</code></div>
            <div class="flow-item"><small>岗位典型任务候选</small><strong>机械产品数字化设计与仿真验证</strong><code>教学标准核心课程表</code></div>
          </div>
          <div class="ok">已确认的直接连接：岗位匹配表中的职业编码 <code>2-02-07-01</code> 与《职业分类大典》及 460301 教学标准“主要职业类别”一致。</div>
          <div class="gap">职业标准缺口/待补：当前工作区未发现“机械设计工程技术人员”对应国家职业标准，不能借用《广告设计师国家职业标准》填充其技能、知识要求。</div>
        </article>
        <article class="chain searchable" data-search="广告设计师 4-08-08-08 国家职业标准 职业功能 工作内容 技能要求 相关知识要求">
          <h3>链 B｜广告设计师职业</h3><p class="chain-meta">职业分类大典 + 国家职业标准</p>
          <div class="flow">
            <div class="flow-item"><small>国家职业</small><strong>广告设计师</strong><code>4-08-08-08</code></div>
            <div class="flow-item"><small>职业分类大典</small><strong>广告创意、宣传、形象设计；含内容确认、构思策划、图稿设计、制作检查</strong><code>PDF 第248页</code></div>
            <div class="flow-item"><small>国家职业标准</small><strong>职业功能 → 工作内容</strong><code>第12页起</code></div>
            <div class="flow-item"><small>工作内容样例</small><strong>图形绘制、图像处理、色彩配置</strong><code>设计制作</code></div>
            <div class="flow-item"><small>能力与知识</small><strong>技能要求 → 能力；相关知识要求 → 知识</strong><code>直接证据</code></div>
            <div class="flow-item"><small>素养</small><strong>职业道德、职业守则、安全质量等</strong><code>第9页起</code></div>
          </div>
          <div class="ok">已确认的直接连接：职业名称、职业编码与国家职业标准一致，可按职业等级拆分标准工作项及知识能力素养。</div>
          <div class="gap">未与19条产业链岗位表建立岗位映射：该工作簿中未检出“广告设计师”，因此这里只能落到职业层，不能虚构企业岗位或产业链节点。</div>
        </article>
      </div>
    </section>

    <section class="section" id="mapping">
      <div class="section-head"><div><p class="section-kicker">03 · 文件字段匹配</p><h2>每类文件的哪些字段进入哪些实体</h2><p class="section-desc">“匹配键”负责建立身份关系；“内容字段”负责生成任务和知识能力素养；“证据字段”负责追溯。</p></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>来源文件</th><th>源字段/位置</th><th>目标实体.字段</th><th>匹配键或转换规则</th><th>证据等级</th><th>用途与边界</th></tr></thead>
          <tbody>
            <tr class="searchable" data-search="19条产业链 岗位编号 岗位名称"><td>19条产业链岗位与职业匹配表.xlsx<br><small>岗位-职业匹配表 / 匹配明细</small></td><td><code>岗位编号</code>、<code>岗位名称</code>、<code>所在产业链-产业环节</code></td><td><code>job.job_id</code><br><code>job.job_name</code><br><code>job.industry_chain / node</code></td><td>同一岗位多来源编号保留原值；另生成稳定内部 <code>job_id</code></td><td><span class="badge direct">直接证据</span></td><td>定义企业岗位，不等同于国家职业。</td></tr>
            <tr class="searchable" data-search="19条产业链 对应职业 职业编码 匹配依据"><td>19条产业链岗位与职业匹配表.xlsx<br><small>岗位-职业匹配表 / 匹配明细</small></td><td><code>对应职业</code>、<code>职业编码</code>、<code>匹配依据</code>、源关系组ID</td><td><code>job_occupation_relation</code><br><code>occupation</code></td><td><code>职业编码</code>为主键；职业名称用于交叉校验。多职业必须拆多行。</td><td><span class="badge rule">规则匹配</span></td><td>保存匹配依据、置信度、审核状态；不能只在岗位表放单个职业编码。</td></tr>
            <tr class="searchable" data-search="职业分类大典 职业编码 职业名称 定义"><td>中华人民共和国职业分类大典（2022年版）.pdf</td><td><code>职业编码</code>、<code>职业名称</code>、职业定义、所属中小类</td><td><code>occupation.occupation_code</code><br><code>occupation_name / definition</code></td><td>严格按规范化职业编码等值连接；名称仅辅助校验。</td><td><span class="badge direct">直接证据</span></td><td>国家职业主数据的权威来源。</td></tr>
            <tr class="searchable" data-search="职业分类大典 主要工作任务"><td>中华人民共和国职业分类大典（2022年版）.pdf</td><td>“主要工作任务”编号条目</td><td><code>standard_work_item.work_content</code></td><td>按职业编码挂接；每个编号任务拆一条，保留页码与原文。</td><td><span class="badge direct">直接证据</span></td><td>作为岗位任务上位候选，不直接复制成所有岗位的典型任务。</td></tr>
            <tr class="searchable" data-search="国家职业标准 职业名称 职业编码 等级"><td>国家职业标准 PDF<br><small>如：广告设计师国家职业标准（2024年版）.pdf</small></td><td>职业名称、职业编码、职业定义、职业技能等级</td><td><code>occupation</code><br><code>standard_work_item.level</code></td><td>职业编码与大典等值；等级单独建维度，不拼入职业编码。</td><td><span class="badge direct">直接证据</span></td><td>用于确认标准适用职业和分级范围。</td></tr>
            <tr class="searchable" data-search="职业功能 工作内容"><td>国家职业标准 PDF<br><small>“工作要求”表</small></td><td><code>职业功能</code>、<code>工作内容</code></td><td><code>standard_work_item.function_name</code><br><code>work_content</code></td><td>按“职业编码 + 等级 + 职业功能 + 工作内容”生成稳定键。</td><td><span class="badge direct">直接证据</span></td><td>是生成岗位典型工作任务最核心的职业标准字段。</td></tr>
            <tr class="searchable" data-search="技能要求 相关知识要求 职业道德 职业守则"><td>国家职业标准 PDF</td><td><code>技能要求</code>、<code>相关知识要求</code>、职业道德、职业守则</td><td><code>requirement_item</code><br>能力 / 知识 / 素养</td><td>“能……”→能力；知识条目→知识；道德守则及安全质量行为→素养。每条保留工作内容上下文。</td><td><span class="badge direct">直接证据</span></td><td>不能只靠关键词分类；技能要求须与具体工作内容关联。</td></tr>
            <tr class="searchable" data-search="专业教学标准 主要职业类别 主要岗位群 技术领域"><td>460301_机电一体化技术.pdf<br><small>第1页“职业面向”</small></td><td>主要职业类别（含代码）、主要岗位（群）或技术领域、对应行业</td><td><code>major_occupation_relation</code><br><code>job_group_candidate</code></td><td>从括号提取职业编码；岗位群只生成岗位候选，需与企业岗位库复核。</td><td><span class="badge direct">直接证据</span> <span class="badge inferred">推断/待核</span></td><td>职业代码连接是直接证据；岗位群到具体岗位是待核映射。</td></tr>
            <tr class="searchable" data-search="专业教学标准 典型工作任务描述 课程涉及的主要领域 教学内容与要求"><td>460301_机电一体化技术.pdf<br><small>第3页起“专业核心课程”表</small></td><td><code>课程涉及的主要领域</code>、<code>典型工作任务描述</code>、<code>主要教学内容与要求</code></td><td><code>standard_work_item</code><br><code>job_task</code><br><code>requirement_item</code></td><td>课程领域限定任务域；任务描述与职业标准工作内容语义归并；教学要求拆为知识/能力候选。</td><td><span class="badge rule">规则匹配</span></td><td>教学标准是专业人才培养要求，不应覆盖职业标准原始要求。</td></tr>
            <tr class="searchable" data-search="专业教学标准 培养规格 知识 能力 素养"><td>460301_机电一体化技术.pdf<br><small>第2页“培养规格”</small></td><td>知识、能力、素质要求条目</td><td><code>requirement_item.statement</code><br><code>type</code></td><td>按原章节优先分类；跨任务通用项标记 <code>scope=major_common</code>。</td><td><span class="badge direct">直接证据</span></td><td>用于校验岗位任务要求是否覆盖专业培养规格。</td></tr>
            <tr class="searchable" data-search="岗位详情字段爬取模板 task_id job_id task_name task_description"><td>岗位详情字段爬取模板_更新版.xlsx<br><small>典型工作任务</small></td><td><code>task_id</code>、<code>job_id</code>、<code>task_name</code>、<code>task_description</code>、<code>task_stage</code>、<code>task_output</code></td><td><code>job_task.*</code></td><td><code>job_id</code>连接岗位；同岗位内按“对象 + 动作 + 产出”去重。</td><td><span class="badge direct">直接证据</span></td><td>落地岗位典型工作任务及岗位画像展示。</td></tr>
            <tr class="searchable" data-search="岗位详情字段爬取模板 ability_id ability_category evidence_text"><td>岗位详情字段爬取模板_更新版.xlsx<br><small>岗位能力项</small></td><td><code>ability_id</code>、<code>ability_name</code>、<code>ability_category</code>、<code>ability_definition</code>、<code>evidence_text</code></td><td><code>requirement_item.*</code></td><td><code>ability_category</code>“知识/技能/素养”规范化为“知识/能力/素养”。</td><td><span class="badge direct">直接证据</span></td><td>保留原始分类值；平台统一术语用“能力”。</td></tr>
            <tr class="searchable" data-search="ability_ids related_task_ids task_requirement_relation 唯一事实来源"><td>岗位详情字段爬取模板_更新版.xlsx<br><small>任务与能力双向数组</small></td><td><code>ability_ids</code>、<code>related_task_ids</code></td><td><code>task_requirement_relation</code></td><td>导入时拆为关系行；关系表是唯一事实来源，双向数组由关系表聚合生成。</td><td><span class="badge rule">规则匹配</span></td><td>避免两侧数组更新不同步；关系上可保存关联强度、证据与复核状态。</td></tr>
          </tbody>
        </table>
      </div>
      <div id="no-results" class="no-results">没有找到匹配内容，请尝试职业编码、字段名、文件名或任务关键词。</div>
      <div class="callout"><b>!</b><p><strong>严格区分身份字段与内容字段：</strong>职业编码用于“连接到哪个职业”；工作内容/典型工作任务描述用于“这个职业或岗位做什么”；技能要求、相关知识要求和职业守则用于“完成任务需要什么”。三类字段不能相互代替。</p></div>
    </section>

    <section class="section" id="examples">
      <div class="section-head"><div><p class="section-kicker">04 · 岗位—职业样例</p><h2>岗位与职业为什么必须使用关系表</h2><p class="section-desc">同一职业可对应多个企业岗位；同一岗位也可能对应多个国家职业。</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>岗位名称</th><th>岗位编号</th><th>产业链—环节</th><th>对应职业</th><th>职业编码</th><th>关系解释</th></tr></thead>
        <tbody>
          <tr class="searchable" data-search="机械设计 IC-L3-1130 IC-L3-792 机械设计工程技术人员 2-02-07-01"><td>机械设计</td><td><code>IC-L3-1130；IC-L3-792</code></td><td>高端装备与智能制造产业链｜上游｜关键基础件与工业母机</td><td>机械设计工程技术人员</td><td><code>2-02-07-01</code></td><td>多个来源岗位编号合并到同一岗位—职业关系。</td></tr>
          <tr class="searchable" data-search="机械研发工程师 IC-L3-785 机械设计工程技术人员 2-02-07-01"><td>机械研发工程师</td><td><code>IC-L3-785</code></td><td>高端装备与智能制造产业链｜上游｜关键基础件与工业母机</td><td>机械设计工程技术人员</td><td><code>2-02-07-01</code></td><td>说明多个不同岗位可归入同一国家职业。</td></tr>
          <tr class="searchable" data-search="模具工程师 IC-L3-796 IC-L3-825 机械设计工程技术人员 2-02-07-01"><td>模具工程师</td><td><code>IC-L3-796；IC-L3-825</code></td><td>高端装备与智能制造产业链｜上游｜关键基础件与工业母机</td><td>机械设计工程技术人员</td><td><code>2-02-07-01</code></td><td>名称不同不妨碍按职业编码汇聚。</td></tr>
          <tr class="searchable" data-search="机器人调试工程师 机器人工程技术人员 工业机器人系统运维员 2-02-38-10 6-31-07-01"><td rowspan="2">机器人调试工程师</td><td rowspan="2"><code>IC-L3-1309；IC-L3-815</code></td><td rowspan="2">机器人产业链｜中游｜机器人本体制造与系统集成</td><td>机器人工程技术人员</td><td><code>2-02-38-10</code></td><td rowspan="2">同一岗位映射两个核心职业，必须拆两条关系行，不能把编码拼进一个字段。</td></tr>
          <tr class="searchable" data-search="机器人调试工程师 工业机器人系统运维员 6-31-07-01"><td>工业机器人系统运维员</td><td><code>6-31-07-01</code></td></tr>
        </tbody>
      </table></div>
    </section>

    <section class="section" id="rules">
      <div class="section-head"><div><p class="section-kicker">05 · 任务与知识能力素养</p><h2>从标准条目生成岗位典型工作任务的规则</h2><p class="section-desc">先确认证据身份，再归并任务，最后将要求逐条关联；任何自动结果都保留人工复核口。</p></div></div>
      <div class="requirement-grid">
        <article class="req-card searchable" data-search="知识 相关知识要求 教学内容 原理 规范"><h3 style="color:#2866d7">知识 K</h3><ul><li>国家职业标准“相关知识要求”逐条入库。</li><li>教学标准“主要教学内容与要求”、培养规格中的知识条目用于补充与校验。</li><li>表述采用“掌握/理解 + 对象 + 范围”，保留来源上下文。</li></ul></article>
        <article class="req-card searchable" data-search="能力 技能要求 能够完成 工作内容"><h3 style="color:#0f8f9d">能力 A</h3><ul><li>国家职业标准“技能要求”直接转为能力候选。</li><li>能力必须落回具体工作内容或岗位任务，不建立悬空能力。</li><li>表述采用“能 + 动作 + 对象 + 条件/质量”，可标等级。</li></ul></article>
        <article class="req-card searchable" data-search="素养 职业道德 职业守则 安全 质量 团队"><h3 style="color:#28845e">素养 Q</h3><ul><li>职业道德、职业守则、安全、质量、环保、协作形成素养项。</li><li>用可观察行为描述，如“按规范留存记录并主动复核”。</li><li>通用素养可跨任务复用，但每条关系仍需说明适用场景。</li></ul></article>
      </div>
      <div class="table-wrap" style="margin-top:16px"><table>
        <thead><tr><th>步骤</th><th>输入</th><th>处理规则</th><th>输出</th><th>质量检查</th></tr></thead>
        <tbody>
          <tr class="searchable" data-search="身份对齐 职业编码"><td>1. 身份对齐</td><td>岗位名称/编号 + 对应职业/职业编码</td><td>以职业编码连接国家职业；岗位与职业多对多落关系表。</td><td><code>job_occupation_relation</code></td><td>编码存在于大典；名称一致或有更名依据。</td></tr>
          <tr class="searchable" data-search="标准工作项 职业功能 工作内容 大典主要工作任务"><td>2. 标准解构</td><td>大典主要工作任务、职业标准工作要求、教学标准典型工作任务</td><td>逐条拆分 <code>standard_work_item</code>，保留来源类型、等级、页码、原文。</td><td>标准工作项池</td><td>不得跨职业挪用；等级上下文完整。</td></tr>
          <tr class="searchable" data-search="任务归并 语义 动作 对象 产出"><td>3. 岗位任务归并</td><td>标准工作项 + 企业岗位任务</td><td>按“动作 + 对象 + 产出/质量”语义聚类；企业语境命名，标准原文做证据。</td><td><code>job_task</code></td><td>一条任务应可独立完成和评价；过大拆分、过碎合并。</td></tr>
          <tr class="searchable" data-search="知识能力素养 关联 relevance"><td>4. 要求拆分与关联</td><td>技能要求、相关知识要求、培养规格、职业守则</td><td>原子化成 K/A/Q；通过关系表关联任务，并标核心/支撑/通用。</td><td><code>requirement_item</code> + <code>task_requirement_relation</code></td><td>每项有证据；每项至少关联一条任务或标专业通用。</td></tr>
          <tr class="searchable" data-search="审核 缺口 直接 规则 推断"><td>5. 人工复核</td><td>自动匹配结果与证据</td><td>按直接证据、规则匹配、推断/待核分层；冲突和缺失进入审核队列。</td><td><code>review_status</code> / <code>review_note</code></td><td>不得把“未找到”自动解释为“不存在”。</td></tr>
        </tbody>
      </table></div>
    </section>

    <footer class="footer">本页为独立离线 HTML；数据字段依据当前工作区文件审计结果生成。统计口径来自“19条产业链岗位与职业匹配表.xlsx”的说明与统计页。</footer>
  </main>

  <div class="evidence-drawer-layer" id="robot-evidence-drawer" hidden>
    <aside class="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="robot-evidence-title">
      <div class="drawer-head">
        <div><h2 id="robot-evidence-title">岗位—职业—任务关联依据</h2><p>每一跳都说明数据来自哪里、按什么字段连接、属于哪种证据。</p></div>
        <button class="drawer-close" type="button" data-close-robot-evidence aria-label="关闭关联依据">×</button>
      </div>
      <div class="evidence-timeline">
        <article class="evidence-record" data-step="01">
          <h3>岗位身份：库内直接数据</h3>
          <p>两条源岗位记录按岗位名称和产业链节点合并为一个展示岗位。</p>
          <dl><dt>来源文件</dt><dd>19条产业链岗位与职业匹配表.xlsx</dd><dt>定位</dt><dd>岗位-职业匹配表第 532–533 行；匹配明细（不合并）第 693–696 行</dd><dt>连接字段</dt><dd>主表合并组ID M0428；源岗位编号 IC-L3-1309、IC-L3-815</dd><dt>证据等级</dt><dd><span class="badge direct">库内数据</span></dd></dl>
        </article>
        <article class="evidence-record rule-record" data-step="02">
          <h3>岗位 → 职业：规则关联</h3>
          <p>同一岗位拆成两条职业关系，职业编码分别连接职业主数据。</p>
          <dl><dt>来源字段</dt><dd>对应职业、职业编码、匹配依据</dd><dt>主职业</dt><dd>机器人工程技术人员（2-02-38-10）</dd><dt>第二职业</dt><dd>工业机器人系统运维员（6-31-07-01）</dd><dt>匹配依据</dt><dd>规则校正：robot-debug</dd><dt>证据等级</dt><dd><span class="badge rule">规则关联</span></dd></dl>
        </article>
        <article class="evidence-record" data-step="03">
          <h3>职业身份与边界：职业大典校验</h3>
          <p>以职业编码为主键确认两个职业的名称、定义和主要工作任务，名称只做交叉校验。</p>
          <dl><dt>来源文件</dt><dd>中华人民共和国职业分类大典（2022年版）.pdf</dd><dt>主职业定位</dt><dd>职业大典第 96 页：机器人工程技术人员</dd><dt>第二职业定位</dt><dd>职业大典第 562 页：工业机器人系统运维员</dd><dt>证据等级</dt><dd><span class="badge direct">国家职业主数据</span></dd></dl>
        </article>
        <article class="evidence-record candidate-record" data-step="04">
          <h3>任务与 K/A/Q：三层标准综合归并</h3>
          <p>职业大典定职业边界 → 职业标准拆工作内容与能力要求 → 多份教学标准补充培养侧候选；每个字段保留自己的截图和页码。</p>
          <dl><dt>来源文件</dt><dd>机器人工程技术人员国家职业标准.pdf；260304_机器人技术.pdf；460304_智能机器人技术.pdf；460305_工业机器人技术.pdf</dd><dt>定位</dt><dd>职业标准第 10–18 页；三份教学标准第 2、4–6 页相关表格</dd><dt>使用字段</dt><dd>工作内容、技能要求、相关知识、职业守则、典型工作任务、主要教学内容与要求、培养规格</dd><dt>证据等级</dt><dd><span class="badge inferred">多源归并候选</span></dd></dl>
        </article>
      </div>
      <div class="evidence-boundary"><strong>数据边界：</strong>本模块可确认岗位与两个职业的库内关系，并可展示国家文件中的职业边界、工作内容和能力要求；但归并成该具体岗位的任务与 K/A/Q 仍属于待企业复核候选，不能冒充招聘原文。</div>
    </aside>
  </div>

  <div class="evidence-drawer-layer" id="robot-field-drawer" hidden>
    <aside class="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="robot-field-title">
      <div class="drawer-head">
        <div><p class="panel-label" id="robot-field-type">字段详情</p><h2 id="robot-field-title">字段如何形成</h2><p id="robot-field-summary">查看当前值、来源与处理过程。</p></div>
        <button class="drawer-close" type="button" data-close-robot-field aria-label="关闭字段详情">×</button>
      </div>
      <div class="field-drawer-content" id="robot-field-content">
        <div class="field-drawer-placeholder">选择任意任务、知识、能力、素养、职业或口径说明，即可查看该字段的追溯详情。</div>
      </div>
    </aside>
  </div>

  <div class="source-capture-lightbox" id="source-capture-lightbox" role="dialog" aria-modal="true" aria-labelledby="source-capture-lightbox-title" hidden>
    <div class="source-capture-lightbox-head">
      <strong id="source-capture-lightbox-title">原始文件截图</strong>
      <button class="source-capture-lightbox-close" type="button" data-close-source-capture aria-label="关闭原始截图">×</button>
    </div>
    <div class="source-capture-lightbox-stage">
      <img class="source-capture-lightbox-image" id="source-capture-lightbox-image" alt="原始文件放大截图">
    </div>
  </div>

  <script>
    const sourceCaptureImages = ${sourceCaptureJson};
    const sourceCaptureAttributes = {
      'pdf-page-02': 'data-source-capture="pdf-page-02"',
      'pdf-page-04': 'data-source-capture="pdf-page-04"',
      'pdf-page-05': 'data-source-capture="pdf-page-05"',
      'pdf-page-06': 'data-source-capture="pdf-page-06"',
      'catalog-robot-engineer-096': 'data-source-capture="catalog-robot-engineer-096"',
      'catalog-maintainer-562': 'data-source-capture="catalog-maintainer-562"',
      'occupation-standard-007': 'data-source-capture="occupation-standard-007"',
      'occupation-standard-012': 'data-source-capture="occupation-standard-012"',
      'occupation-standard-014': 'data-source-capture="occupation-standard-014"',
      'occupation-standard-015': 'data-source-capture="occupation-standard-015"',
      'occupation-standard-016': 'data-source-capture="occupation-standard-016"',
      'occupation-standard-017': 'data-source-capture="occupation-standard-017"',
      'occupation-standard-018': 'data-source-capture="occupation-standard-018"',
      'teaching-460304-p04': 'data-source-capture="teaching-460304-p04"',
      'teaching-460304-core': 'data-source-capture="teaching-460304-core"',
      'teaching-460305-p04': 'data-source-capture="teaching-460305-p04"',
      'teaching-460305-core': 'data-source-capture="teaching-460305-core"',
      'teaching-460305-p06': 'data-source-capture="teaching-460305-p06"',
      'excel-job-occupation-532-533': 'data-source-capture="excel-job-occupation-532-533"',
      'excel-match-detail-693-696': 'data-source-capture="excel-match-detail-693-696"',
      'excel-occupation-dictionary-48': 'data-source-capture="excel-occupation-dictionary-48"',
      'excel-occupation-dictionary-166': 'data-source-capture="excel-occupation-dictionary-166"'
    };
    const robotTaskData = {
      'robot-install': {
        title: '机器人系统安装与现场调试',
        description: '依据装配图、电气图和系统方案完成机器人本体、外围设备及控制系统安装，完成参数配置、坐标标定和现场联调。',
        source: '多源标准归并 · 大典 / 职业标准 / 教学标准',
        knowledge: [
          ['电气布局、原理图与装配规范', '理解控制器、驱动器、I/O 模块布局、电气原理图和接线规范。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 14 页', locator: '3.1 电气布局、3.2 电气原理图设计、3.3 电气装配', captureKeys: ['occupation-standard-014'] }],
          ['机械装配、测量与性能标定知识', '理解机械装配注意事项、测量仪器使用及机器人性能参数标定方法。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 12 页', locator: '4.1 机器人装配、4.2 机器人功能调试', captureKeys: ['occupation-standard-012'] }],
          ['机器人控制器件与接口知识', '掌握控制器、驱动器、传感器及外围执行机构的选型和接口关系。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 14 页', locator: '3.1 电气布局、4.1 机器人交互控制设计', captureKeys: ['occupation-standard-014'] }],
          ['工业机器人系统集成流程', '理解生产工艺分析、I/O 与外围通信、系统搭建和单元联调的关键步骤。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '工业机器人应用系统集成', captureKeys: ['teaching-460305-core'] }]
        ],
        ability: [
          ['识读装配图并完成机械装配', '能识读装配关系和安装注意事项，完成机器人机械结构装配。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 12 页', locator: '4.1 机器人装配', captureKeys: ['occupation-standard-012'] }],
          ['控制器、驱动器与 I/O 选型', '能根据系统需求对关键电气器件选型并设计安装布局。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 14 页', locator: '3.1 电气布局', captureKeys: ['occupation-standard-014'] }],
          ['元器件装配、接线与上电检查', '能依据布局图和电气原理图完成装配接线，并使用仪表进行上电前检查。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 14 页', locator: '3.3 电气装配', captureKeys: ['occupation-standard-014'] }],
          ['参数设置、标定与现场联调', '能完成系统参数设置、坐标标定、单元调试和生产联调。', { sourceType: '专业教学标准', file: '260304_机器人技术.pdf、460305_工业机器人技术.pdf', page: '第 4–5 页', locator: '机器人编程技术、机器人应用系统集成', captureKeys: ['pdf-page-04', 'pdf-page-05', 'teaching-460305-core'] }]
        ],
        quality: [
          ['安全操作意识', '爱护设备，落实机械、电气和现场安全操作要求。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }],
          ['遵章执行意识', '遵守规程并按既定工艺完成装配、接线和调试。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（4）', captureKeys: ['occupation-standard-007'] }],
          ['认真严谨意识', '对接线、参数和运行条件进行逐项复核，不带故障上电。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（5）', captureKeys: ['occupation-standard-007'] }],
          ['精益求精意识', '持续修正装配偏差和调试问题，提升交付质量。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（2）', captureKeys: ['occupation-standard-007'] }]
        ]
      },
      'robot-program': {
        title: '机器人编程与离线仿真',
        description: '分析机器人作业流程，编制现场程序和离线仿真程序，验证轨迹、节拍与安全边界并完成程序优化。',
        source: '多源标准归并 · 职业标准 / 2份教学标准',
        knowledge: [
          ['现场编程、坐标与指令知识', '掌握示教器、坐标设定、程序结构、指令使用和系统备份方法。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '工业机器人现场编程', captureKeys: ['teaching-460305-p04'] }],
          ['PLC、通信与运动控制知识', '理解 PLC 原理、工业机器人通信、人机界面和电机控制关系。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '可编程控制技术', captureKeys: ['teaching-460305-p04'] }],
          ['离线编程、建模与仿真知识', '理解仿真系统建模、参数设置、离线程序和真机验证方法。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '工业机器人离线编程与仿真', captureKeys: ['teaching-460305-p04'] }],
          ['代码版本与系统开发知识', '掌握版本管理、常用开发工具、数据库和应用模块部署方法。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 17 页', locator: '2.2 应用软件部署、2.3 系统软件功能开发', captureKeys: ['occupation-standard-017'] }]
        ],
        ability: [
          ['现场程序编制与单元调试', '能使用示教器编制程序并完成单元功能调试和生产联调。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '工业机器人现场编程典型工作任务', captureKeys: ['teaching-460305-p04'] }],
          ['PLC、人机界面和电机程序调试', '能编制 PLC、人机交互界面和电机程序并完成单元功能调试。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '可编程控制技术典型工作任务', captureKeys: ['teaching-460305-p04'] }],
          ['仿真系统搭建与离线程序验证', '能搭建仿真系统、设置参数、编制离线程序并进行真机验证。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '工业机器人离线编程与仿真', captureKeys: ['teaching-460305-p04'] }],
          ['代码版本管理与功能模块修改', '能使用版本管理工具，按系统架构修改后台服务或交互逻辑。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 17 页', locator: '2.3 机器人系统软件功能开发', captureKeys: ['occupation-standard-017'] }]
        ],
        quality: [
          ['认真严谨意识', '对程序逻辑、参数和仿真结果进行逐项验证。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（5）', captureKeys: ['occupation-standard-007'] }],
          ['遵守规程意识', '按编程、备份、变更和真机验证流程执行。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（4）', captureKeys: ['occupation-standard-007'] }],
          ['安全操作意识', '在仿真和现场程序切换时确认安全边界和设备状态。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }],
          ['创新改进意识', '通过轨迹、节拍和程序结构优化持续改进运行效果。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（2）', captureKeys: ['occupation-standard-007'] }]
        ]
      },
      'robot-integration': {
        title: '机器人应用系统集成与联调',
        description: '完成机器人、PLC、传感器和外围执行机构选型与接口集成，进行单元调试、系统联调和操作规程编制。',
        source: '多源标准归并 · 大典 / 职业标准 / 3份教学标准',
        knowledge: [
          ['系统需求与解决方案知识', '掌握机器人系统需求分析、性能需求报告和产品解决方案整理方法。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 16 页', locator: '1.1 需求调研与分析、1.2 系统软件设计方案编写', captureKeys: ['occupation-standard-016'] }],
          ['服务器、网络与工控机接口知识', '理解服务器接口、网络设备和工控机的选型与参数配置。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 17 页', locator: '2.1 机器人软件系统设备选型', captureKeys: ['occupation-standard-017'] }],
          ['I/O、通信与系统集成流程', '理解机器人、PLC、传感器、末端执行器之间的输入输出和外围通信。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '工业机器人应用系统集成', captureKeys: ['teaching-460305-core'] }],
          ['稳定性、兼容性与安全测试知识', '掌握系统负载、压力、兼容、安全和配置测试方法。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 18 页', locator: '4.3 机器人软件系统性能测试', captureKeys: ['occupation-standard-018'] }]
        ],
        ability: [
          ['设备选型与通信方案设计', '能根据工艺要求完成机器人、执行器、传感器和 PLC 选型并设计通信连接。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '工业机器人应用系统集成典型工作任务', captureKeys: ['teaching-460305-core'] }],
          ['机械电气集成与上电检查', '能依据布局图、原理图完成装配接线并进行上电前检查。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 14 页', locator: '3.1–3.3 机器人驱动、控制开发及调试', captureKeys: ['occupation-standard-014'] }],
          ['应用组件部署与功能集成', '能安装部署功能组件、配置服务并按系统技术方案完成功能集成。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 17 页', locator: '2.2 应用软件部署、3.1 操作系统集成', captureKeys: ['occupation-standard-017'] }],
          ['系统联调、测试与报告输出', '能完成单元调试、系统联调、性能测试并整理测试数据和报告。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 18 页', locator: '4.1–4.4 机器人软件系统测试', captureKeys: ['occupation-standard-018'] }]
        ],
        quality: [
          ['遵章执行意识', '按系统集成步骤、接口规范和调试规程组织实施。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（4）', captureKeys: ['occupation-standard-007'] }],
          ['安全操作意识', '集成前确认机械、电气、网络和运行环境安全条件。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }],
          ['认真严谨意识', '保持接口清单、参数配置、测试记录和问题闭环一致。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（5）', captureKeys: ['occupation-standard-007'] }],
          ['爱岗敬业意识', '主动协调机械、电气、软件等专业边界并承担交付责任。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（1）', captureKeys: ['occupation-standard-007'] }]
        ]
      },
      'robot-virtual': {
        title: '机器人生产线虚拟调试',
        description: '规划机器人生产线，构建数字孪生模型，配置模型接口和逻辑，联合机器人程序与主控程序完成虚拟验证。',
        source: '多源标准归并 · 大典 / 职业标准 / 2份教学标准',
        knowledge: [
          ['数字孪生系统设计与建模知识', '理解数字孪生系统设计、建模、参数设置及半实物虚拟调试方法。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '数字孪生与虚拟调试技术应用', captureKeys: ['teaching-460305-core'] }],
          ['离线仿真与系统综合验证知识', '掌握机器人应用系统建模、离线程序、综合仿真和真机验证方法。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 4 页', locator: '工业机器人离线编程与仿真', captureKeys: ['teaching-460305-p04'] }],
          ['系统架构与性能需求知识', '理解系统需求、功能描述、性能需求报告和产品解决方案。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 16 页', locator: '机器人产品架构设计', captureKeys: ['occupation-standard-016'] }],
          ['稳定性、兼容性和配置测试知识', '理解虚拟验证后面向真实运行环境的性能、兼容和配置测试要求。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 18 页', locator: '4.3 机器人软件系统性能测试', captureKeys: ['occupation-standard-018'] }]
        ],
        ability: [
          ['数字孪生系统搭建与参数设置', '能使用建模和仿真软件搭建工业机器人应用数字孪生系统。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '数字孪生与虚拟调试典型工作任务（1）', captureKeys: ['teaching-460305-core'] }],
          ['半实物虚拟调试', '能联合机器人、PLC、控制器和触摸屏进行半实物系统调试。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '数字孪生与虚拟调试典型工作任务（2）', captureKeys: ['teaching-460305-core'] }],
          ['仿真设计、验证与问题修正', '能进行系统仿真设计及验证，根据碰撞、时序和接口问题修正方案。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 5 页', locator: '数字孪生与虚拟调试典型工作任务（3）', captureKeys: ['teaching-460305-core'] }],
          ['测试数据整理与报告编写', '能整理测试过程、测试数据并按开发计划输出测试报告。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 18 页', locator: '4.4 机器人软件系统测试报告编写', captureKeys: ['occupation-standard-018'] }]
        ],
        quality: [
          ['精益求精意识', '持续比较虚拟调试结果并优化节拍、稳定性和可维护性。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（2）', captureKeys: ['occupation-standard-007'] }],
          ['认真严谨意识', '以模型、参数、测试用例和结果数据支撑判断。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（5）', captureKeys: ['occupation-standard-007'] }],
          ['遵守规程意识', '按模型版本、接口定义和验证流程执行变更。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（4）', captureKeys: ['occupation-standard-007'] }],
          ['安全操作意识', '在虚实切换和真机验证前确认人员、设备与程序安全边界。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }]
        ]
      },
      'robot-maintenance': {
        title: '机器人系统运行维护与故障诊断',
        description: '监测机器人系统运行状态，开展巡检、参数备份、故障定位与恢复，形成维护记录并推动问题闭环。',
        source: '多源标准归并 · 大典 / 职业标准 / 3份教学标准',
        knowledge: [
          ['工业机器人系统运维工作范围', '理解数据采集、状态监测、机械电气检查、维护保养和故障维修的职业边界。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '6-31-07-01 工业机器人系统运维员', captureKeys: ['catalog-maintainer-562'] }],
          ['机械、电控与驱动系统知识', '理解机器人本体、末端执行器、周边装置、电控系统、驱动系统和线路结构。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '主要工作任务第 1–2 项', captureKeys: ['catalog-maintainer-562'] }],
          ['传感器测试与电气故障排查知识', '掌握传感器性能分析、软硬件调试和电气故障排查方法。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 15 页', locator: '4.3 机器人常用传感器测试', captureKeys: ['occupation-standard-015'] }],
          ['运行数据监测与智能运维知识', '理解系统运行数据采集、远程监测、维护记录和运维报告编制。', { sourceType: '专业教学标准', file: '460305_工业机器人技术.pdf', page: '第 6 页', locator: '工业机器人系统智能运维', captureKeys: ['teaching-460305-p06'] }]
        ],
        ability: [
          ['机械与电气系统检查诊断', '能检查诊断机器人机械系统、电控系统、驱动系统、电源和线路。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '主要工作任务第 1–2 项', captureKeys: ['catalog-maintainer-562'] }],
          ['零位校准与维护保养', '能完成零位校准、防尘、电池和润滑油更换等维护保养。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '主要工作任务第 3 项', captureKeys: ['catalog-maintainer-562'] }],
          ['运行参数采集与状态监测', '能使用测量设备采集运行参数和工作状态数据并进行监测。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '主要工作任务第 4 项', captureKeys: ['catalog-maintainer-562'] }],
          ['故障分析维修与报告编制', '能分析诊断系统故障、实施维修并编制运行维护和维修报告。', { sourceType: '职业大典', file: '中华人民共和国职业分类大典（2022年版）.pdf', page: '第 562 页', locator: '主要工作任务第 5–6 项', captureKeys: ['catalog-maintainer-562'] }]
        ],
        quality: [
          ['爱护设备意识', '规范使用工具、量具和检测仪器，保护机器人及周边设备。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }],
          ['安全操作意识', '发现风险及时停机、隔离并按应急要求处置。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（3）', captureKeys: ['occupation-standard-007'] }],
          ['忠于职守意识', '如实记录故障现象、原因、措施和复测结果。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（5）', captureKeys: ['occupation-standard-007'] }],
          ['遵章执行意识', '按巡检、保养、维修和报告规程形成闭环。', { sourceType: '职业标准', file: '机器人工程技术人员国家职业标准.pdf', page: '第 7 页', locator: '2.1.2 职业守则（4）', captureKeys: ['occupation-standard-007'] }]
        ]
      }
    };

    const robotTaskSourceData = {
      'robot-install': { file: '职业大典 + 职业标准 + 260304 / 460304 / 460305 教学标准', page: '职业大典第 96、562 页；职业标准第 12、14 页；教学标准第 4–6 页', locator: '大典主要工作任务；职业标准机械/电气装配与调试；三份教学标准装调和系统集成表', excerpt: '机器人机械、电气与控制系统安装，完成参数设置、坐标标定和现场联调。', captureKeys: ['catalog-robot-engineer-096', 'catalog-maintainer-562', 'occupation-standard-012', 'occupation-standard-014', 'pdf-page-04', 'teaching-460304-p04', 'teaching-460305-core'] },
      'robot-program': { file: '职业标准 + 260304 / 460305 教学标准', page: '职业标准第 17 页；教学标准第 4–5 页', locator: '职业标准系统功能开发；机器人编程、PLC 与离线仿真教学内容', excerpt: '完成机器人程序、PLC 控制、离线仿真与功能集成。', captureKeys: ['occupation-standard-017', 'pdf-page-04', 'pdf-page-05', 'teaching-460305-p04'] },
      'robot-integration': { file: '职业大典 + 职业标准 + 260304 / 460304 / 460305 教学标准', page: '职业大典第 96 页；职业标准第 14–18 页；教学标准第 5–6 页', locator: '大典系统集成任务；职业标准控制、应用和测试；三份教学标准系统集成表', excerpt: '完成机器人、PLC、传感器和外围执行机构选型、接口集成、系统联调与验收。', captureKeys: ['catalog-robot-engineer-096', 'occupation-standard-014', 'occupation-standard-015', 'occupation-standard-017', 'occupation-standard-018', 'pdf-page-05', 'pdf-page-06', 'teaching-460304-core', 'teaching-460305-core'] },
      'robot-virtual': { file: '职业大典 + 职业标准 + 260304 / 460305 教学标准', page: '职业大典第 96 页；职业标准第 16–18 页；教学标准第 5–6 页', locator: '大典仿真与测试任务；职业标准测试方案/系统测试；虚拟调试教学内容', excerpt: '建立数字化模型，编制主控程序，在虚拟环境中完成生产线验证和优化。', captureKeys: ['catalog-robot-engineer-096', 'occupation-standard-016', 'occupation-standard-018', 'pdf-page-06', 'teaching-460305-core'] },
      'robot-maintenance': { file: '职业大典 + 职业标准 + 260304 / 460304 / 460305 教学标准', page: '职业大典第 562 页；职业标准第 7、15、18 页；教学标准第 2、4–6 页', locator: '运维员主要工作任务；职业守则、故障与测试要求；三份教学标准运行维护内容', excerpt: '采集运行状态，诊断系统故障，实施维修保养并形成可追溯报告。', captureKeys: ['catalog-maintainer-562', 'occupation-standard-007', 'occupation-standard-015', 'occupation-standard-018', 'pdf-page-02', 'teaching-460304-p04', 'teaching-460305-p06'] }
    };

    const robotOccupationData = {
      '2-02-38-10': {
        title: '机器人工程技术人员',
        role: '岗位关联职业',
        mainRows: '岗位-职业匹配表第 532–533 行',
        detailRows: '匹配明细（不合并）第 693–696 行',
        dictionaryRow: '职业字典（本表使用）第 48 行',
        category: '2-02-38 数字技术工程技术人员',
        rowNumber: '532',
        detailRowNumbers: '693、695'
      },
      '6-31-07-01': {
        title: '工业机器人系统运维员',
        role: '岗位关联职业',
        mainRows: '岗位-职业匹配表第 532–533 行',
        detailRows: '匹配明细（不合并）第 693–696 行',
        dictionaryRow: '职业字典（本表使用）第 166 行',
        category: '6-31-07 工业机器人操作运维人员',
        rowNumber: '533',
        detailRowNumbers: '694、696'
      }
    };

    const robotCategoryData = {
      knowledge: { label: '知识 K', definition: '解释“为什么这样做、依据什么原理”，主要从教学内容、相关知识和规范要求中拆分。', cue: '结构、原理、方法、规范、流程等认知性表述' },
      ability: { label: '能力 A', definition: '说明“能完成什么操作或产出”，主要从教学要求和培养规格的可执行能力表述中拆分。', cue: '能、具备、设计、安装、编程、调试、诊断等行为性表述' },
      quality: { label: '素养 Q', definition: '说明完成任务应遵循的职业态度和行为边界，主要从培养目标、培养规格与任务风险中提炼。', cue: '安全、质量、协作、责任、记录、创新等职业行为表述' }
    };

    let currentRobotTaskId = 'robot-install';

    function renderRobotRequirementItems(items, taskId, type) {
      return items.map(function (item, index) {
        return '<button class="requirement-item" type="button" data-field-detail="requirement:' + taskId + ':' + type + ':' + index + '"><strong>' + item[0] + '</strong><small>' + item[1] + '</small><em class="requirement-source-tag">' + item[2].sourceType + '</em></button>';
      }).join('');
    }

    function selectRobotTask(taskId) {
      const task = robotTaskData[taskId];
      if (!task) return;
      currentRobotTaskId = taskId;
      document.querySelectorAll('[data-task-id]').forEach(function (button) {
        button.setAttribute('aria-selected', String(button.dataset.taskId === taskId));
      });
      document.getElementById('robot-task-title').textContent = task.title;
      document.getElementById('robot-task-description').textContent = task.description;
      document.getElementById('robot-task-source').textContent = task.source;
      document.getElementById('robot-knowledge-items').innerHTML = renderRobotRequirementItems(task.knowledge, taskId, 'knowledge');
      document.getElementById('robot-ability-items').innerHTML = renderRobotRequirementItems(task.ability, taskId, 'ability');
      document.getElementById('robot-quality-items').innerHTML = renderRobotRequirementItems(task.quality, taskId, 'quality');
      document.getElementById('robot-requirement-total').textContent = task.knowledge.length + task.ability.length + task.quality.length;
    }

    document.querySelectorAll('[data-task-id]').forEach(function (button) {
      button.addEventListener('click', function () { selectRobotTask(button.dataset.taskId); });
    });
    selectRobotTask(currentRobotTaskId);

    const robotEvidenceDrawer = document.getElementById('robot-evidence-drawer');
    const openRobotEvidenceButton = document.querySelector('[data-open-robot-evidence]');
    const closeRobotEvidenceButton = document.querySelector('[data-close-robot-evidence]');
    function openRobotEvidence() {
      robotEvidenceDrawer.hidden = false;
      document.body.style.overflow = 'hidden';
      closeRobotEvidenceButton.focus();
    }
    function closeRobotEvidence() {
      robotEvidenceDrawer.hidden = true;
      document.body.style.overflow = '';
      openRobotEvidenceButton.focus();
    }
    openRobotEvidenceButton.addEventListener('click', openRobotEvidence);
    closeRobotEvidenceButton.addEventListener('click', closeRobotEvidence);
    robotEvidenceDrawer.addEventListener('click', function (event) {
      if (event.target === robotEvidenceDrawer) closeRobotEvidence();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !robotEvidenceDrawer.hidden) closeRobotEvidence();
    });

    const robotFieldDrawer = document.getElementById('robot-field-drawer');
    const closeRobotFieldButton = document.querySelector('[data-close-robot-field]');
    let lastRobotFieldTrigger = null;

    function escapeFieldHtml(value) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return map[character]; });
    }

    function captureLabel(captureKey) {
      const labels = {
        'pdf-page-02': 'PDF 第 2 页 · 培养目标与培养规格',
        'pdf-page-04': 'PDF 第 4 页 · 专业核心课程表',
        'pdf-page-05': 'PDF 第 5 页 · 专业核心课程表',
        'pdf-page-06': 'PDF 第 6 页 · 专业核心课程表',
        'catalog-robot-engineer-096': '职业大典第 96 页 · 机器人工程技术人员',
        'catalog-maintainer-562': '职业大典第 562 页 · 工业机器人系统运维员',
        'occupation-standard-007': '职业标准第 7 页 · 职业道德与基础知识',
        'occupation-standard-012': '职业标准第 12 页 · 装配、调试与测试',
        'occupation-standard-014': '职业标准第 14 页 · 电气布局、装配与控制',
        'occupation-standard-015': '职业标准第 15 页 · 传感器、故障与系统测试',
        'occupation-standard-016': '职业标准第 16 页 · 测试方案与系统架构',
        'occupation-standard-017': '职业标准第 17 页 · 系统应用与功能开发',
        'occupation-standard-018': '职业标准第 18 页 · 系统性能测试',
        'teaching-460304-p04': '460304 第 4 页 · 智能机器人装调任务',
        'teaching-460304-core': '460304 第 6 页 · 智能机器人系统集成',
        'teaching-460305-p04': '460305 第 4 页 · 编程、PLC 与离线仿真',
        'teaching-460305-core': '460305 第 5 页 · 虚拟调试与系统集成',
        'teaching-460305-p06': '460305 第 6 页 · 智能运维与故障诊断',
        'excel-job-occupation-532-533': '岗位-职业匹配表 · 第 532–533 行',
        'excel-match-detail-693-696': '匹配明细（不合并）· 第 693–696 行',
        'excel-occupation-dictionary-48': '职业字典（本表使用）· 第 48 行',
        'excel-occupation-dictionary-166': '职业字典（本表使用）· 第 166 行'
      };
      return labels[captureKey] || captureKey;
    }

    function renderSourceCapture(captureKey) {
      const image = sourceCaptureImages[captureKey];
      const captureAttribute = sourceCaptureAttributes[captureKey];
      if (!image || !captureAttribute) return '';
      const label = captureLabel(captureKey);
      return '<button class="source-capture-button" type="button" ' + captureAttribute + ' aria-label="点击查看原始截图：' + escapeFieldHtml(label) + '">' +
        '<img class="source-capture-image" src="' + image + '" alt="' + escapeFieldHtml(label) + '">' +
        '<span class="source-capture-caption"><strong>' + escapeFieldHtml(label) + '</strong><span>点击查看原始截图 ↗</span></span></button>';
    }

    function renderSourcePreviewBody(source) {
      const captures = (source.captureKeys || []).map(renderSourceCapture).join('');
      return '<div class="source-capture-grid">' + captures + '</div>' +
        '<div class="source-preview-head"><span>精确定位</span><strong>' + escapeFieldHtml(source.locator) + '</strong></div>';
    }

    function renderPdfSourcePreview(source) {
      return '<div class="source-preview pdf-preview"><div class="source-preview-head"><strong>PDF 原页真实截图</strong><span>' + escapeFieldHtml(source.file) + '</span></div>' + renderSourcePreviewBody(source) + '</div>';
    }

    function renderExcelSourcePreview(source) {
      if (source.kind === 'mixed') {
        return '<div class="source-preview mixed-preview"><div class="source-preview-head"><strong>参考文件真实截图</strong><span>' + escapeFieldHtml(source.file) + '</span></div>' + renderSourcePreviewBody(source) + '</div>';
      }
      return '<div class="source-preview excel-preview"><div class="source-preview-head"><strong>Excel 原始行真实截图</strong><span>' + escapeFieldHtml(source.file) + '</span></div>' + renderSourcePreviewBody(source) + '</div>';
    }

    function renderFieldProcessFlow(steps) {
      const labels = ['原始数据', '字段标准化', '规则处理', '展示结果'];
      return '<div class="field-process-flow">' + steps.map(function (step, index) {
        return '<div class="process-step' + (index === 3 ? ' result' : '') + '"><i>0' + (index + 1) + '</i><strong>' + labels[index] + '</strong><span>' + escapeFieldHtml(step) + '</span></div>';
      }).join('') + '</div>';
    }

    function buildTaskFieldDetail(taskId, sourceOnly) {
      const task = robotTaskData[taskId];
      const source = robotTaskSourceData[taskId];
      if (!task || !source) return null;
      return {
        type: sourceOnly ? '来源定位' : '典型工作任务 · 多源归并候选',
        title: sourceOnly ? task.source : task.title,
        summary: sourceOnly ? '该标签汇总当前任务引用的职业大典、职业标准和教学标准页码。' : task.description,
        valueNote: sourceOnly ? source.page + ' · ' + source.locator : '归并后的展示任务，不是招聘原文。',
        source: { kind: 'mixed', file: source.file, page: source.page, locator: source.locator, excerpt: source.excerpt, captureKeys: source.captureKeys },
        steps: sourceOnly ? [
          source.page,
          '分别记录文件名、页码、章节或表格栏目',
          '职业大典定边界，职业标准拆要求，教学标准补培养侧候选',
          task.source
        ] : [
          source.excerpt,
          '拆成“动作 + 对象 + 产出/质量”原子表述',
          '按机器人调试场景归并同义项，并逐条保留来源页和截图',
          task.title
        ],
        calculation: sourceOnly ? '页码由来源证据直接登记，不进行数值计算。' : '5 项任务候选 = 标准表任务拆分后按“动作 + 对象 + 产出”归并去重；不计算匹配度百分比。',
        boundary: '国家文件可证明职业边界和标准要求；归并到“机器人调试工程师”这一具体岗位仍为候选，需企业岗位数据复核。'
      };
    }

    function buildRequirementFieldDetail(taskId, type, index) {
      const task = robotTaskData[taskId];
      const source = robotTaskSourceData[taskId];
      const category = robotCategoryData[type];
      const item = task && task[type] ? task[type][index] : null;
      if (!task || !source || !category || !item) return null;
      const itemSource = item[2];
      return {
        type: category.label + ' · 原子要求',
        title: item[0],
        summary: item[1],
        valueNote: '关联当前任务：' + task.title,
        source: { kind: 'mixed', file: itemSource.file, page: itemSource.page, locator: itemSource.locator, excerpt: item[1], captureKeys: itemSource.captureKeys },
        steps: [
          itemSource.file + ' · ' + itemSource.page + ' · ' + itemSource.locator,
          '抽取可独立评价的单一要求：' + category.cue,
          '分类为 ' + category.label + '，并通过 task_requirement_relation 关联当前任务',
          item[0]
        ],
        calculation: 'K/A/Q 仅按原始栏目与语义线索分类，不计算匹配度百分比；同一要求可关联多条任务，关系表逐条保存。',
        boundary: '该条保留国家标准或教学标准原始定位，但映射到具体岗位任务仍需人工复核，不代表企业招聘要求原文。'
      };
    }

    function buildCategoryFieldDetail(type) {
      const task = robotTaskData[currentRobotTaskId];
      const source = robotTaskSourceData[currentRobotTaskId];
      const category = robotCategoryData[type];
      if (!task || !source || !category) return null;
      const itemNames = task[type].map(function (item) { return item[0]; }).join('；');
      const itemSources = task[type].map(function (item) { return item[2]; });
      const sourceFiles = Array.from(new Set(itemSources.map(function (itemSource) { return itemSource.file; }))).join('；');
      const sourceLocator = itemSources.map(function (itemSource) { return itemSource.sourceType + '：' + itemSource.page + ' ' + itemSource.locator; }).join('；');
      const categoryCaptureKeys = Array.from(new Set(itemSources.flatMap(function (itemSource) { return itemSource.captureKeys; })));
      return {
        type: '能力要求分类',
        title: category.label,
        summary: category.definition,
        valueNote: '当前任务共展示 ' + task[type].length + ' 条：' + itemNames,
        source: { kind: 'mixed', file: sourceFiles, page: '逐条定位', locator: sourceLocator, excerpt: category.cue, captureKeys: categoryCaptureKeys },
        steps: [
          '职业标准与教学标准原文要求',
          '拆成单一、可评价的原子要求',
          '依据栏目与语义线索归入 ' + category.label,
          task[type].length + ' 条当前任务要求'
        ],
        calculation: task[type].length + ' 条 = 当前任务下该分类数组的条目数；不跨任务求和，不计算匹配度百分比。',
        boundary: '分类数量用于说明页面结构，不代表能力权重、重要度或达成度。'
      };
    }

    function buildOccupationFieldDetail(code) {
      const occupation = robotOccupationData[code];
      if (!occupation) return null;
      return {
        type: '国家职业 · 规则关联后目录校验',
        title: occupation.title + '（' + code + '）',
        summary: occupation.role + '；岗位与职业按 N:M 关系分别落库。',
        valueNote: occupation.category,
        source: {
          kind: 'mixed',
          file: '19条产业链岗位与职业匹配表.xlsx；中华人民共和国职业分类大典（2022年版）.pdf；机器人工程技术人员国家职业标准.pdf',
          locator: occupation.mainRows + '；' + occupation.detailRows + '；' + occupation.dictionaryRow + '；' + (code === '2-02-38-10' ? '职业大典第 96 页；职业标准第 14 页' : '职业大典第 562 页'),
          captureKeys: ['excel-job-occupation-532-533', 'excel-match-detail-693-696', code === '2-02-38-10' ? 'excel-occupation-dictionary-48' : 'excel-occupation-dictionary-166', code === '2-02-38-10' ? 'catalog-robot-engineer-096' : 'catalog-maintainer-562'].concat(code === '2-02-38-10' ? ['occupation-standard-014'] : []),
          rows: [
            ['行', '合并组 / 源岗位', '职业', '职业编码'],
            [occupation.rowNumber, 'M0428 / IC-L3-1309；IC-L3-815', occupation.title, code],
            [occupation.detailRowNumbers, '两条源岗位明细', '规则校正：robot-debug', occupation.dictionaryRow]
          ]
        },
        steps: [
          'M0428 的两条源岗位记录与四条职业关系明细',
          '岗位名称、产业链节点和 occupation_code 标准化',
          '规则校正后按 job_id + occupation_code 拆分，并用职业大典编码/名称校验',
          occupation.title + '（' + code + '）'
        ],
        calculation: 'COUNT DISTINCT occupation_code = 2（限定合并组 M0428；两条源岗位都保留，再按职业编码去重）。规则只说明关联依据，不计算匹配度百分比。',
        boundary: '职业名称和编码由职业字典校验；岗位—职业关系来自本地规则匹配表，不等同于国家文件直接声明该企业岗位只能对应该职业。'
      };
    }

    function buildBoundaryFieldDetail() {
      return {
        type: '数据边界 · 缺口保留',
        title: '标准证据如何补充，但不替代企业岗位原文',
        summary: '岗位身份和职业关系已有库内记录；企业任务原文缺失时，使用三层标准形成可追溯候选。',
        valueNote: '缺失不自动补真值；国家标准、教学标准候选与招聘原文分层展示。',
        source: {
          kind: 'mixed',
          file: '岗位详情字段爬取模板_更新版.xlsx；职业分类大典；机器人工程技术人员国家职业标准；3 份专业教学标准',
          locator: '企业模板无该岗位任务/能力原文；职业大典第 96、562 页；职业标准第 7、12、14–18 页；教学标准第 2、4–6 页',
          captureKeys: ['excel-job-occupation-532-533', 'catalog-robot-engineer-096', 'catalog-maintainer-562', 'occupation-standard-007', 'occupation-standard-012', 'occupation-standard-014', 'occupation-standard-015', 'occupation-standard-016', 'occupation-standard-017', 'occupation-standard-018', 'pdf-page-02', 'pdf-page-04', 'teaching-460304-core', 'teaching-460305-core'],
          rows: [
            ['证据层', '作用', '是否直接等于岗位原文', '处理'],
            ['职业大典 / 职业标准', '职业边界与标准要求', '否', '保留页码与截图'],
            ['多份教学标准', '培养侧任务与能力候选', '否', '归并后待复核']
          ]
        },
        steps: [
          '检索企业岗位模板与全部参考标准',
          '企业原文字段为空，登记数据缺口',
          '职业大典定职业边界；职业标准拆工作内容与能力要求；多份教学标准补充培养侧候选',
          '页面逐条显示来源类型、文件、页码和真实截图'
        ],
        calculation: '这是证据分层判断，不是数值计算；不计算匹配度百分比，也不把“未采集”解释为“不存在”。',
        boundary: '可确认岗位身份、两个职业关系及国家文件原文；任务和 K/A/Q 映射到具体岗位的结论仍需企业逐条复核。'
      };
    }

    function resolveRobotFieldDetail(fieldKey) {
      if (fieldKey === 'current-task') return buildTaskFieldDetail(currentRobotTaskId, false);
      if (fieldKey === 'current-task-source') return buildTaskFieldDetail(currentRobotTaskId, true);
      if (fieldKey === 'candidate-boundary') return buildBoundaryFieldDetail();
      const parts = fieldKey.split(':');
      if (parts[0] === 'task') return buildTaskFieldDetail(parts[1], false);
      if (parts[0] === 'requirement') return buildRequirementFieldDetail(parts[1], parts[2], Number(parts[3]));
      if (parts[0] === 'category') return buildCategoryFieldDetail(parts[1]);
      if (parts[0] === 'occupation') return buildOccupationFieldDetail(parts[1]);
      return null;
    }

    function renderRobotFieldDetail(detail) {
      if (!detail) return;
      document.getElementById('robot-field-type').textContent = detail.type;
      document.getElementById('robot-field-title').textContent = detail.title;
      document.getElementById('robot-field-summary').textContent = detail.summary;
      const preview = detail.source.kind === 'pdf' ? renderPdfSourcePreview(detail.source) : renderExcelSourcePreview(detail.source);
      document.getElementById('robot-field-content').innerHTML =
        '<div class="field-value-card"><small>当前展示值</small><strong>' + escapeFieldHtml(detail.title) + '</strong><p>' + escapeFieldHtml(detail.valueNote) + '</p></div>' +
        '<section><h3 class="field-section-title"><b>1</b>内容从哪里来</h3>' + preview + '</section>' +
        '<section><h3 class="field-section-title"><b>2</b>如何汇总 / 计算</h3>' + renderFieldProcessFlow(detail.steps) + '</section>' +
        '<div class="field-calculation"><strong>计算口径</strong><code>' + escapeFieldHtml(detail.calculation) + '</code>所有中间键、页码和规则名称均保留，便于复核。</div>' +
        '<div class="field-boundary"><strong>证据边界：</strong>' + escapeFieldHtml(detail.boundary) + '</div>';
    }

    function openRobotFieldDetail(fieldKey, trigger) {
      lastRobotFieldTrigger = trigger || null;
      renderRobotFieldDetail(resolveRobotFieldDetail(fieldKey));
      robotFieldDrawer.hidden = false;
      document.body.style.overflow = 'hidden';
      closeRobotFieldButton.focus();
    }
    function closeRobotFieldDetail() {
      robotFieldDrawer.hidden = true;
      document.body.style.overflow = '';
      if (lastRobotFieldTrigger) lastRobotFieldTrigger.focus();
    }
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-field-detail]');
      if (trigger) openRobotFieldDetail(trigger.dataset.fieldDetail, trigger);
    });
    closeRobotFieldButton.addEventListener('click', closeRobotFieldDetail);
    robotFieldDrawer.addEventListener('click', function (event) {
      if (event.target === robotFieldDrawer) closeRobotFieldDetail();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !robotFieldDrawer.hidden) closeRobotFieldDetail();
    });

    const sourceCaptureLightbox = document.getElementById('source-capture-lightbox');
    const sourceCaptureLightboxImage = document.getElementById('source-capture-lightbox-image');
    const sourceCaptureLightboxTitle = document.getElementById('source-capture-lightbox-title');
    const closeSourceCaptureButton = document.querySelector('[data-close-source-capture]');
    let lastSourceCaptureTrigger = null;
    function openSourceCapture(captureKey, trigger) {
      if (!sourceCaptureImages[captureKey]) return;
      lastSourceCaptureTrigger = trigger;
      sourceCaptureLightboxImage.src = sourceCaptureImages[captureKey];
      sourceCaptureLightboxTitle.textContent = captureLabel(captureKey);
      sourceCaptureLightbox.hidden = false;
      closeSourceCaptureButton.focus();
    }
    function closeSourceCapture() {
      sourceCaptureLightbox.hidden = true;
      sourceCaptureLightboxImage.removeAttribute('src');
      if (lastSourceCaptureTrigger) lastSourceCaptureTrigger.focus();
    }
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-source-capture]');
      if (trigger) openSourceCapture(trigger.dataset.sourceCapture, trigger);
    });
    closeSourceCaptureButton.addEventListener('click', closeSourceCapture);
    sourceCaptureLightbox.addEventListener('click', function (event) {
      if (event.target === sourceCaptureLightbox) closeSourceCapture();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !sourceCaptureLightbox.hidden) {
        event.stopImmediatePropagation();
        closeSourceCapture();
      }
    }, true);

    const details = {
      'source-document': { type: '来源实体', title: 'source_document', desc: '登记标准文件与业务数据文件，保存版本、权威性和本地路径。', key: 'document_id', source: '五类源文件统一登记', rule: '文件版本变化时新增版本记录，不覆盖历史证据。', evidence: '直接证据' },
      'source-evidence': { type: '证据实体', title: 'source_evidence', desc: '保存页码、章节、表格字段、原文和复核状态，是所有业务内容的追溯锚点。', key: 'evidence_id → document_id', source: 'PDF页码/章节；Excel工作表/字段/行', rule: '一段可独立引用的原文或一个结构化单元形成一条证据。', evidence: '直接证据' },
      job: { type: '业务实体', title: 'job（岗位）', desc: '企业或产业链中的用工单元，名称受组织、场景和层级影响。岗位不是国家职业。', key: 'job_id', source: '岗位匹配表：岗位编号、岗位名称、所在产业链-产业环节；岗位详情模板：基本信息', rule: '来源岗位编号保留，平台另生成稳定内部ID。', evidence: '直接证据' },
      'job-occupation': { type: '关系实体', title: 'job_occupation_relation', desc: '解决岗位与职业的多对多关系，承载匹配依据、置信度和审核状态。', key: 'relation_id；job_id + occupation_code 唯一约束', source: '岗位匹配表：对应职业、职业编码；匹配明细：匹配依据', rule: '职业编码为主匹配键；一个岗位多职业必须拆多行。', evidence: '规则匹配' },
      occupation: { type: '国家主数据', title: 'occupation（职业）', desc: '国家职业分类中的标准职业单元，编码相对稳定，是跨文件对齐的核心身份键。', key: 'occupation_code', source: '《职业分类大典》职业编码、职业名称、定义；国家职业标准职业编码', rule: '编码严格等值，名称用于交叉校验与版本差异提示。', evidence: '直接证据' },
      'standard-work-item': { type: '标准实体', title: 'standard_work_item', desc: '统一承载大典主要工作任务、职业标准工作内容、教学标准典型工作任务。', key: 'work_item_id', source: '大典“主要工作任务”；职业标准“职业功能/工作内容”；教学标准“典型工作任务描述”', rule: '不同来源不互相覆盖，通过 source_type 区分并建立映射。', evidence: '直接证据 + 规则匹配' },
      'job-task': { type: '业务实体', title: 'job_task（岗位典型工作任务）', desc: '针对具体岗位场景形成、可独立完成和评价的工作任务。', key: 'task_id → job_id', source: '岗位模板“典型工作任务”；标准工作项综合归并', rule: '按动作、对象、产出和质量归并；自动生成项必须待复核。', evidence: '规则匹配' },
      'task-requirement': { type: '关系实体', title: 'task_requirement_relation', desc: '任务与知识、能力、素养的多对多关系，是关联的唯一事实来源。', key: 'relation_id；task_id + requirement_id 唯一约束', source: '岗位模板 ability_ids / related_task_ids；标准要求上下文', rule: '双向数组仅派生展示；关系行保存关联强度、证据与审核状态。', evidence: '直接证据 + 规则匹配' },
      requirement: { type: '要求实体', title: 'requirement_item（知识/能力/素养）', desc: '完成岗位任务需要的原子化要求，按 K/A/Q 分类并保留证据。', key: 'requirement_id', source: '职业标准技能要求/相关知识要求/职业守则；教学标准培养规格/教学内容', rule: '知识、能力、素养分类后仍保留原始字段类型，不丢失上下文。', evidence: '直接证据' },
      'document-source-evidence': { type: '直接关系', title: '文件 1:N 证据', desc: '一个文件可以产生多条页级、章节级或字段级证据。', key: 'source_evidence.document_id', source: '文件元数据 + 位置元数据', rule: '保留版本与定位信息。', evidence: '直接证据' },
      'job-job-occupation': { type: '直接关系', title: '岗位 1:N 岗位—职业关系', desc: '一个岗位可以挂接多个职业关系行。', key: 'job_occupation_relation.job_id', source: '岗位编号/内部 job_id', rule: '岗位多职业分行，不使用拼接字符串。', evidence: '直接证据' },
      'job-occupation-occupation': { type: '直接关系', title: '岗位—职业关系 N:1 职业', desc: '每条关系行只指向一个国家职业。', key: 'occupation_code', source: '匹配表职业编码 + 大典职业编码', rule: '以编码等值连接。', evidence: '直接证据' },
      'occupation-standard-item': { type: '直接关系', title: '职业 1:N 标准工作项', desc: '标准工作项必须归属明确职业。', key: 'occupation_code', source: '大典或职业标准标题中的职业编码', rule: '不得跨职业挪用标准工作项。', evidence: '直接证据' },
      'standard-item-job-task': { type: '规则关系', title: '标准工作项 N:M 岗位任务', desc: '多个来源标准条目可支撑一条岗位任务，一条标准条目也可用于多个岗位。', key: '语义映射关系', source: '动作 + 对象 + 产出/质量；领域与等级上下文', rule: '机器匹配后人工确认；保存 match_basis。', evidence: '规则匹配' },
      'job-task-task-requirement': { type: '直接关系', title: '任务 1:N 要求关系', desc: '一条岗位任务对应多条知识、能力、素养关系。', key: 'task_id', source: '任务—要求关系表', rule: '关系表为唯一事实来源。', evidence: '直接证据' },
      'task-requirement-requirement': { type: '直接关系', title: '要求 1:N 任务关系', desc: '一项知识、能力或素养可支撑多个岗位任务。', key: 'requirement_id', source: '任务—要求关系表', rule: '复用要求时仍逐关系保存适用强度。', evidence: '直接证据' },
      'evidence-entities': { type: '直接关系', title: '证据 → 业务实体', desc: '职业等业务实体引用可定位的来源证据。', key: 'evidence_id', source: '大典职业条目、匹配表字段', rule: '身份字段必须有直接证据。', evidence: '直接证据' },
      'evidence-standard-item': { type: '直接关系', title: '证据 → 标准工作项', desc: '每条标准工作项回指页码、章节或表格字段。', key: 'evidence_id', source: '大典主要工作任务、职业标准工作要求、教学标准课程表', rule: '不同来源类型并存，不相互覆盖。', evidence: '直接证据' },
      'evidence-job-task': { type: '规则关系', title: '证据综合 → 岗位任务', desc: '多条标准证据与企业任务经过归并形成岗位典型工作任务。', key: 'task_evidence_relation', source: '标准工作项 + 岗位任务原文', rule: '自动归并后进入人工复核。', evidence: '规则匹配' },
      'review-loop': { type: '待核关系', title: '要求 → 证据反向追溯', desc: '发现悬空、冲突或缺失要求时，回到原始证据核查。', key: 'review_status / review_note', source: '证据原文与审核记录', rule: '未找到证据时标记缺口，不自动判定不存在。', evidence: '推断/待核' }
    };

    const panel = document.getElementById('detail-panel');
    function renderDetail(item) {
      if (!item) return;
      panel.innerHTML = '<span class="type">' + item.type + '</span><h3>' + item.title + '</h3><p>' + item.desc + '</p><dl>' +
        '<dt>主键 / 连接键</dt><dd><code>' + item.key + '</code></dd>' +
        '<dt>来源字段</dt><dd>' + item.source + '</dd>' +
        '<dt>处理规则</dt><dd>' + item.rule + '</dd>' +
        '<dt>证据等级</dt><dd>' + item.evidence + '</dd></dl>';
    }

    document.querySelectorAll('[data-node-id]').forEach(element => {
      element.addEventListener('click', () => {
        document.querySelectorAll('.node,.edge').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        document.querySelectorAll('.edge').forEach(edge => {
          if (edge.dataset.source === element.dataset.nodeId || edge.dataset.target === element.dataset.nodeId) edge.classList.add('active');
        });
        renderDetail(details[element.dataset.nodeId]);
      });
    });

    document.querySelectorAll('[data-edge-id]').forEach(element => {
      element.addEventListener('click', () => {
        document.querySelectorAll('.node,.edge').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        const source = element.dataset.source;
        const target = element.dataset.target;
        document.querySelector('[data-node-id="' + source + '"]')?.classList.add('active');
        document.querySelector('[data-node-id="' + target + '"]')?.classList.add('active');
        renderDetail(details[element.dataset.edgeId]);
      });
    });

    const search = document.getElementById('graph-search');
    const searchable = [...document.querySelectorAll('.searchable')];
    const nodes = [...document.querySelectorAll('.node')];
    const edges = [...document.querySelectorAll('.edge')];
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      let totalMatches = 0;
      searchable.forEach(item => {
        const value = (item.dataset.search || item.textContent).toLowerCase();
        const match = !query || value.includes(query);
        item.classList.toggle('dim', !match);
        if (match) totalMatches += 1;
      });
      nodes.forEach(node => {
        if (!query) return node.classList.remove('dim');
        const match = (node.dataset.search || '').toLowerCase().includes(query);
        node.classList.toggle('dim', !match);
      });
      edges.forEach(edge => {
        if (!query) return edge.classList.remove('dim');
        const source = document.querySelector('[data-node-id="' + edge.dataset.source + '"]');
        const target = document.querySelector('[data-node-id="' + edge.dataset.target + '"]');
        edge.classList.toggle('dim', source?.classList.contains('dim') && target?.classList.contains('dim'));
      });
      document.getElementById('no-results').style.display = query && totalMatches === 0 ? 'block' : 'none';
    });
  </script>
</body>
</html>`
}

const outputPath = getOutputPath()
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, await buildHtml(), 'utf8')
console.log(`Generated ${outputPath}`)

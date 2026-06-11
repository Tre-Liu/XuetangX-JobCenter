import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourcePath = path.join(root, 'src/mock/research-report.ts')
const outputPath = path.join(root, 'outputs/report-export-harness.html')

const source = fs.readFileSync(sourcePath, 'utf8')
const match = source.match(/export const REPORT_CONTENT = `([\s\S]*?)`\n/)

if (!match) {
  throw new Error('REPORT_CONTENT not found')
}

const reportHtml = match[1]

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>report-export-harness</title>
    <link rel="stylesheet" href="../src/styles.css" />
    <script src="../node_modules/html2canvas/dist/html2canvas.min.js"></script>
    <script src="../node_modules/jspdf/dist/jspdf.umd.min.js"></script>
    <style>
      body { margin: 0; padding: 24px; background: #eef4ff; font-family: "Microsoft YaHei", sans-serif; }
      #status { position: fixed; top: 12px; right: 12px; z-index: 1000; padding: 10px 14px; border-radius: 10px; background: #fff; color: #22324d; font-size: 14px; box-shadow: 0 8px 24px rgba(53, 91, 165, 0.12); }
    </style>
  </head>
  <body>
    <div id="status">pending</div>
    <article class="report-preview-doc report-export-doc" id="export-doc">${reportHtml}</article>
    <script>
      ;(async () => {
        const status = document.getElementById('status')
        const exportDoc = document.getElementById('export-doc')
        try {
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          await new Promise((resolve) => setTimeout(resolve, 200))
          const canvas = await window.html2canvas(exportDoc, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            windowWidth: exportDoc.scrollWidth,
            windowHeight: exportDoc.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            logging: false
          })
          const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF
          const pdf = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' })
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const marginX = 10
          const marginTop = 10
          const marginBottom = 12
          const usableWidth = pageWidth - marginX * 2
          const usableHeight = pageHeight - marginTop - marginBottom
          const pageHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth)
          let renderedHeight = 0
          let pageIndex = 0
          while (renderedHeight < canvas.height) {
            const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight)
            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = canvas.width
            pageCanvas.height = sliceHeight
            const ctx = pageCanvas.getContext('2d')
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
            ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, pageCanvas.width, pageCanvas.height)
            const imageData = pageCanvas.toDataURL('image/jpeg', 0.98)
            if (pageIndex > 0) pdf.addPage()
            const imageHeight = (sliceHeight * usableWidth) / canvas.width
            pdf.addImage(imageData, 'JPEG', marginX, marginTop, usableWidth, imageHeight, undefined, 'FAST')
            renderedHeight += sliceHeight
            pageIndex += 1
          }
          const blob = pdf.output('blob')
          status.textContent = 'ok|pages=' + pdf.getNumberOfPages() + '|bytes=' + blob.size + '|canvas=' + canvas.width + 'x' + canvas.height
          document.title = status.textContent
        } catch (error) {
          status.textContent = 'error|' + (error && error.message ? error.message : String(error))
          document.title = status.textContent
        }
      })()
    </script>
  </body>
</html>`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, html)
console.log(outputPath)

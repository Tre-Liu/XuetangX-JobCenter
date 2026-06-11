(function () {
  const run = async () => {
    const titleNode = document.querySelector('.report-preview-doc h1')
    const title = (titleNode?.textContent || '专业群产业调研报告').trim()
    const sourceNode =
      document.querySelector('[data-report-editable]') ||
      document.querySelector('.report-preview-doc.full') ||
      document.querySelector('.report-preview-doc')

    if (!sourceNode) {
      console.error('report export source not found')
      return
    }

    const exportShell = document.createElement('div')
    exportShell.className = 'report-export-shell'
    exportShell.setAttribute('aria-hidden', 'true')

    const exportDoc = document.createElement('article')
    exportDoc.className = 'report-preview-doc report-export-doc'
    exportDoc.innerHTML = sourceNode.innerHTML

    const footer = document.createElement('p')
    footer.className = 'report-export-footer'
    footer.textContent = `${title}｜专业群产业调研分析平台自动生成`
    exportDoc.appendChild(footer)
    exportShell.appendChild(exportDoc)
    document.body.appendChild(exportShell)

    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await new Promise((resolve) => setTimeout(resolve, 180))

      const canvas = await window.html2canvas(exportDoc, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: exportDoc.scrollWidth,
        windowHeight: exportDoc.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      })

      const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF
      if (!jsPDFCtor) throw new Error('jsPDF unavailable')

      const pdf = new jsPDFCtor({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      })

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
        if (!ctx) break

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height,
        )

        const imageData = pageCanvas.toDataURL('image/jpeg', 0.98)
        if (pageIndex > 0) pdf.addPage()
        const imageHeight = (sliceHeight * usableWidth) / canvas.width
        pdf.addImage(imageData, 'JPEG', marginX, marginTop, usableWidth, imageHeight, undefined, 'FAST')
        renderedHeight += sliceHeight
        pageIndex += 1
      }

      pdf.save(`${title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)
      console.log('runtime export saved')
    } catch (error) {
      console.error('runtime export failed', error)
    } finally {
      exportShell.remove()
    }
  }

  setTimeout(() => {
    run()
  }, 40)

  return 'codex-runtime-export-started'
})()

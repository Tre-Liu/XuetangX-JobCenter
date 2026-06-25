export const buildStandaloneViewUrl = (
  view: string,
  extraParams: Record<string, string> = {}
) => {
  if (typeof window === 'undefined') {
    const query = new URLSearchParams({ view, ...extraParams })
    return `?${query.toString()}`
  }

  const url = new URL('./index.html', window.location.href)
  url.search = ''
  url.searchParams.set('view', view)
  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

export const openStandaloneView = (urlString: string) => {
  if (typeof window === 'undefined') return
  const opened = window.open(urlString, '_blank')
  if (opened) {
    opened.opener = null
    return
  }
  window.location.href = urlString
}

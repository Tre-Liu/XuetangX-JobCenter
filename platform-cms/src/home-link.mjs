/** Keep the landing page reachable from independent and legacy CMS entries. */
export function managementHomeHref(href = location.href) {
  const url = new URL(href);
  const offline = url.protocol === 'file:' ? 'offline/' : '';
  if (/\/cms\/index\.html$/.test(url.pathname)) {
    return new URL(`../../platform-cms/${offline}index.html`, url).href;
  }
  if (/\/industry-research-admin\.html$/.test(url.pathname)) {
    return new URL(`../platform-cms/${offline}index.html`, url).href;
  }
  return new URL('./index.html', url).href;
}

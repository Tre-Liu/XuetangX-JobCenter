/** Limit caller navigation to this deployment (or another local port). */
export function safeReturnUrl(raw, base) {
 if (typeof raw !== 'string' || !raw.trim()) return null;
 try {
  const from = new URL(base), to = new URL(raw, from);
  if (to.username || to.password) return null;
  if (from.protocol === 'file:') {
   return to.protocol === 'file:' && /\.html$/i.test(to.pathname) ? to.href : null;
  }
  if (!['http:', 'https:'].includes(to.protocol) || to.hostname !== from.hostname) return null;
  if (from.protocol === 'https:' && to.protocol !== 'https:') return null;
  return to.href;
 } catch { return null; }
}

/**
 * Page-view tracking without putting Firebase on the critical path.
 *
 * The Firebase compat SDK is a few hundred KB, so it is fetched only once the
 * browser is idle after the page has painted, and nothing waits on it.
 */
export function trackPageView(pagePath: string): void {
  const send = () => {
    void import('../firebase').then((m) => m.trackPageView(pagePath)).catch(() => undefined);
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(send, { timeout: 4000 });
  } else {
    setTimeout(send, 2000);
  }
}

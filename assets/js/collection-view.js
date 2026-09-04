document.addEventListener('DOMContentLoaded', async () => {
  const VERSION = 'v2.17.9';
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href.includes('/assets/css/style.css') || link.href.includes('/assets/css/pages.css')) {
      const url = new URL(link.href, window.location.href);
      url.searchParams.set('v', VERSION.slice(1));
      link.href = url.href;
    }
  });
  try { await import(`./app.js?v=${VERSION.slice(1)}`); }
  catch (error) { console.error('[Chi MERCH] application bootstrap failed', error); }
});

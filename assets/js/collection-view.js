document.addEventListener('DOMContentLoaded', async () => {
  const VERSION = 'v2.10.3';
  document.querySelectorAll('.sidebar-footer span:last-child, #settings dd, .footer span:last-child').forEach((element) => {
    if (/^v\d+\.\d+\.\d+$/.test(element.textContent.trim())) element.textContent = VERSION;
  });
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href.includes('/assets/css/style.css') || link.href.includes('/assets/css/pages.css')) {
      const url = new URL(link.href, window.location.href);
      url.searchParams.set('v', VERSION.slice(1));
      link.href = url.href;
    }
  });
  try { await import('./app.js?v=2.10.3'); }
  catch (error) { console.error('[Chi MERCH] application bootstrap failed', error); }
});

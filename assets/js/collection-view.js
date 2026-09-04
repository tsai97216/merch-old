document.addEventListener('DOMContentLoaded', async () => {
  const VERSION = 'v2.18.9';
  const pages = [...document.querySelectorAll('.page')];
  const navItems = [...document.querySelectorAll('.nav-item')];
  const pageNames = new Set(pages.map((page) => page.id));

  function renderRoute() {
    const requested = window.location.hash.replace(/^#/, '');
    const activeId = pageNames.has(requested) ? requested : 'home';
    pages.forEach((page) => {
      const active = page.id === activeId;
      page.classList.toggle('is-active', active);
      page.hidden = !active;
    });
    navItems.forEach((item) => {
      const target = item.getAttribute('href')?.replace(/^#/, '');
      const active = target === activeId;
      item.classList.toggle('is-active', active);
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href.includes('/assets/css/style.css') || link.href.includes('/assets/css/pages.css')) {
      const url = new URL(link.href, window.location.href);
      url.searchParams.set('v', VERSION.slice(1));
      link.href = url.href;
    }
  });

  renderRoute();
  window.addEventListener('hashchange', renderRoute);

  try {
    await import(`./app.js?v=${VERSION.slice(1)}`);
  } catch (error) {
    console.error('[Chi MERCH] application bootstrap failed', error);
    const content = document.querySelector('.content');
    if (content) {
      const notice = document.createElement('div');
      notice.className = 'data-error';
      notice.innerHTML = '<strong>網站程式載入失敗</strong><p>頁面骨架已載入，但應用程式模組沒有成功啟動。請開啟瀏覽器主控台查看詳細錯誤。</p>';
      content.prepend(notice);
    }
  }
});

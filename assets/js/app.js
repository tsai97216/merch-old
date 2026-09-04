import { loadMerch } from './data.js';

const routes = {
  home: { title: '首頁', description: '收藏概況與最近加入的周邊。' },
  collection: { title: '收藏', description: '搜尋、篩選與瀏覽你的周邊收藏。' },
  stats: { title: '統計', description: '從作品、角色、類型與花費看看收藏分布。' },
  manage: { title: '管理', description: '新增、編輯與刪除周邊資料。' },
  settings: { title: '設定', description: '帳號、資料同步與網站設定。' },
};

function getRoute() {
  const value = location.hash.replace(/^#\/?/, '').split('/')[0];
  return value || 'home';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
}

function render(route, merch) {
  const meta = routes[route] || routes.home;
  document.title = `${meta.title}｜Chi 的周邊收藏`;
  document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === route));

  const received = merch.filter(item => item.status === '已收到');
  const pending = merch.filter(item => item.status !== '已收到');

  const content = route === 'home' ? `
    <h1 class="page-title">${meta.title}</h1>
    <p class="page-description">${meta.description}</p>
    <section class="grid stats-grid">
      <div class="card"><div class="stat-label">總數</div><div class="stat-value">${received.length}</div></div>
      <div class="card"><div class="stat-label">待到貨</div><div class="stat-value">${pending.length}</div></div>
      <div class="card"><div class="stat-label">作品</div><div class="stat-value">${new Set(merch.map(x => x.work).filter(Boolean)).size}</div></div>
      <div class="card"><div class="stat-label">角色</div><div class="stat-value">${new Set(merch.map(x => x.character).filter(Boolean)).size}</div></div>
    </section>
    <section class="section card"><h2>最近加入</h2><div class="empty">目前還沒有收藏資料，之後會在這裡顯示最近加入的周邊。</div></section>
  ` : `
    <h1 class="page-title">${meta.title}</h1>
    <p class="page-description">${meta.description}</p>
    <section class="card"><div class="empty">${escapeHtml(meta.title)}功能正在建置中。</div></section>
  `;

  document.querySelector('#main-content').innerHTML = content;
}

async function start() {
  const merch = await loadMerch();
  render(getRoute(), merch);
  window.addEventListener('hashchange', () => render(getRoute(), merch));
}

start();

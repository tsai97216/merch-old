import { loadMerch } from './data.js';

const routes = {
  home: { title: '首頁', eyebrow: 'COLLECTION / OVERVIEW', description: '這裡是你的周邊收藏檔案館。從近期加入的物件開始，慢慢整理屬於自己的收藏目錄。' },
  collection: { title: '收藏', eyebrow: 'THE ARCHIVE', description: '瀏覽、搜尋與整理所有收藏物件。' },
  stats: { title: '統計', eyebrow: 'COLLECTION REPORT', description: '從作品、角色、類型與花費查看收藏的輪廓。' },
  manage: { title: '管理', eyebrow: 'CATALOG / EDIT', description: '新增、編輯與維護收藏資料。' },
  settings: { title: '設定', eyebrow: 'ARCHIVE SETTINGS', description: '帳號、同步與網站偏好設定。' },
};

function getRoute() { const value = location.hash.replace(/^#\/?/, '').split('/')[0]; return value || 'home'; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
function unique(values) { return new Set(values.filter(Boolean)).size; }
function itemDate(item) { return item.createdAt || item.purchase?.date || item.release?.releaseDate || ''; }

function renderItem(item) {
  const image = item.images?.[0];
  return `<article class="archive-item"><div class="item-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name || '')}" loading="lazy">` : '<span>NO IMAGE</span>'}</div><div class="item-meta"><span>${escapeHtml(item.work || '未分類')}</span><span>${escapeHtml(item.status || '未設定')}</span></div><h3>${escapeHtml(item.name || '未命名收藏')}</h3><p>${escapeHtml(item.character || '未設定角色')}</p></article>`;
}

function renderHome(merch) {
  const received = merch.filter(item => item.status === '已收到');
  const pending = merch.filter(item => item.status !== '已收到');
  const recent = [...merch].sort((a, b) => itemDate(b).localeCompare(itemDate(a))).slice(0, 6);
  return `<div class="archive-heading"><div class="eyebrow">${routes.home.eyebrow}</div><h1 class="page-title">我的<br>周邊收藏</h1><p class="page-description">${routes.home.description}</p></div><section class="stats-grid"><div class="card"><div class="stat-label">已收到</div><div class="stat-value">${received.length}</div></div><div class="card"><div class="stat-label">待到貨</div><div class="stat-value">${pending.length}</div></div><div class="card"><div class="stat-label">作品</div><div class="stat-value">${unique(merch.map(x => x.work))}</div></div><div class="card"><div class="stat-label">角色</div><div class="stat-value">${unique(merch.map(x => x.character))}</div></div></section><section class="section"><div class="section-kicker"><span>RECENT ADDITIONS</span><span>${String(merch.length).padStart(2, '0')} ITEMS</span></div>${recent.length ? `<div class="archive-grid">${recent.map(renderItem).join('')}</div>` : '<div class="empty"><strong>收藏櫃還是空的。</strong><br>之後新增的周邊會從這裡開始留下紀錄。</div>'}</section>`;
}

function render(route, merch) {
  const meta = routes[route] || routes.home;
  document.title = `${meta.title}｜Chi's Merch Archive`;
  document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === route));
  const content = route === 'home' ? renderHome(merch) : `<div class="archive-heading"><div class="eyebrow">${meta.eyebrow}</div><h1 class="page-title">${escapeHtml(meta.title)}</h1><p class="page-description">${escapeHtml(meta.description)}</p></div><section class="section"><div class="empty"><strong>${escapeHtml(meta.title)}頁面</strong><br>介面骨架已建立，接下來會在這個 Archive 系統上逐頁完成功能。</div></section>`;
  document.querySelector('#main-content').innerHTML = content;
}

async function start() {
  try {
    const merch = await loadMerch();
    const data = Array.isArray(merch) ? merch : [];
    render(getRoute(), data);
    window.addEventListener('hashchange', () => render(getRoute(), data));
  } catch (error) {
    document.querySelector('#main-content').innerHTML = '<div class="error-state"><div class="eyebrow">ARCHIVE ERROR</div><h1 class="page-title">無法讀取收藏</h1><p>資料檔案目前無法載入，請稍後再試。</p></div>';
    console.error(error);
  }
}
start();

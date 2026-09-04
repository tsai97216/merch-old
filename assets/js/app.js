const app = document.querySelector('#app');
const nav = document.querySelector('.main-nav');
const menuButton = document.querySelector('.mobile-menu');
let merch = [];

const routes = {
  home: { label: '首頁', eyebrow: '01 / ARCHIVE', title: '私人收藏，完整記錄。', desc: '把每一件買過、等待中與已經到手的收藏，整理成一座可以慢慢翻閱的數位展示櫃。' },
  collection: { label: '收藏', eyebrow: '02 / COLLECTION', title: '收藏目錄', desc: '以作品、角色、類型與狀態整理所有收藏。搜尋、篩選，再進入每件物品的詳細資料。' },
  stats: { label: '統計', eyebrow: '03 / STATISTICS', title: '收藏統計', desc: '數量、作品、角色與支出都集中在這裡，讓收藏不只是漂亮，也有自己的數字。' },
  manage: { label: '管理', eyebrow: '04 / MANAGEMENT', title: '管理收藏', desc: '新增、修改與整理收藏資料。之後會在這裡接上 GitHub 儲存與圖片管理。' },
  settings: { label: '設定', eyebrow: '05 / SETTINGS', title: '系統設定', desc: '登入、同步、顯示方式與資料來源設定。' }
};

function routeName() {
  const key = location.hash.replace(/^#\/?/, '').split('/')[0];
  return routes[key] ? key : 'home';
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}

function received(item) { return item?.shipping?.status === '已收到' || item?.release?.receivedDate; }
function pending(item) { return !received(item); }
function money(item) {
  const price = item?.purchase?.price;
  if (price === undefined || price === null || price === '') return '—';
  return `${item?.purchase?.currency || 'TWD'} ${Number(price).toLocaleString()}`;
}
function imageOf(item) { return item?.images?.[0] || item?.image || ''; }

function itemCard(item) {
  const image = imageOf(item);
  return `<a class="item-card" href="#/collection/${encodeURIComponent(item.id || '')}">
    <div class="item-image">${image ? `<img src="${esc(image)}" alt="${esc(item.name)}" loading="lazy">` : '<div class="item-placeholder">NO IMAGE</div>'}</div>
    <div class="item-title">${esc(item.name || '未命名收藏')}</div>
    <div class="item-sub">${esc(item.character || item.work || '未分類')}</div>
    <div class="item-meta"><span>${esc(item.type || 'MERCH')}</span><span>${esc(item.shipping?.status || '待整理')}</span></div>
  </a>`;
}

function stats() {
  const works = new Set(merch.map(x => x.work).filter(Boolean)).size;
  const chars = new Set(merch.map(x => x.character).filter(Boolean)).size;
  return { total: merch.length, received: merch.filter(received).length, pending: merch.filter(pending).length, works, chars };
}

function home() {
  const s = stats();
  const recent = [...merch].sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 8);
  return `<section class="hero">
    <div><div class="eyebrow">${routes.home.eyebrow}</div><h1>收藏不是清單。<br>它是一段時間。</h1></div>
    <div class="hero-copy"><p>${routes.home.desc}</p><a class="text-link" href="#/collection">進入收藏目錄 <span>→</span></a></div>
  </section>
  <section class="stats-strip">
    <div class="stat"><span class="stat-label">TOTAL ITEMS</span><span class="stat-value">${s.total}</span><span class="stat-label">全部收藏</span></div>
    <div class="stat"><span class="stat-label">RECEIVED</span><span class="stat-value">${s.received}</span><span class="stat-label">已收到</span></div>
    <div class="stat"><span class="stat-label">PENDING</span><span class="stat-value">${s.pending}</span><span class="stat-label">等待中</span></div>
    <div class="stat"><span class="stat-label">WORKS</span><span class="stat-value">${s.works}</span><span class="stat-label">作品</span></div>
  </section>
  <section class="section">
    <div class="section-head"><h2 class="section-title">最近加入</h2><a class="text-link" href="#/collection">查看全部 →</a></div>
    ${recent.length ? `<div class="archive-grid">${recent.map(itemCard).join('')}</div>` : `<div class="empty"><h2>收藏館目前還是空的。</h2><p>第一件收藏加入後，它就會從這裡開始長出自己的目錄。</p></div>`}
  </section>`;
}

function collection(id) {
  if (id) {
    const item = merch.find(x => String(x.id) === decodeURIComponent(id));
    if (!item) return emptyPage('找不到這件收藏', '資料庫中沒有對應的項目。');
    const image = imageOf(item);
    const rows = [
      ['作品', item.work], ['角色', item.character], ['類型', item.type], ['狀態', item.shipping?.status],
      ['購買平台', item.purchase?.platform], ['購買日期', item.purchase?.date], ['價格', money(item)],
      ['預計發售', item.release?.expectedDate], ['實際到貨', item.release?.receivedDate], ['備註', item.note]
    ].filter(([,v]) => v !== undefined && v !== null && v !== '');
    return `<section class="detail-layout">
      <div class="detail-image">${image ? `<img src="${esc(image)}" alt="${esc(item.name)}">` : '<div class="item-placeholder">NO IMAGE</div>'}</div>
      <div><div class="eyebrow">COLLECTION / ITEM</div><h1 class="detail-title">${esc(item.name)}</h1><div style="height:34px"></div>${rows.map(([k,v]) => `<div class="detail-row"><div class="detail-key">${esc(k)}</div><div>${esc(v)}</div></div>`).join('')}<div style="height:28px"></div><a class="text-link" href="#/collection">← 返回收藏</a></div>
    </section>`;
  }
  return `<div class="page-head"><div><div class="eyebrow">${routes.collection.eyebrow}</div><h1>${routes.collection.title}</h1></div><p class="page-desc">${routes.collection.desc}</p></div>
    <div class="toolbar">
      <input class="field" id="search" placeholder="搜尋名稱、作品、角色、備註…">
      <select class="select" id="work"><option value="">所有作品</option>${options('work')}</select>
      <select class="select" id="character"><option value="">所有角色</option>${options('character')}</select>
      <select class="select" id="type"><option value="">所有類型</option>${options('type')}</select>
      <select class="select" id="status"><option value="">所有狀態</option>${options('shipping.status')}</select>
    </div>
    <div class="collection-tools"><span class="result-count" id="result-count"></span><select class="select" id="sort"><option value="created">最近加入</option><option value="name">名稱</option><option value="price">價格</option><option value="date">購買日期</option></select></div>
    <div id="collection-results"></div>`;
}

function options(path) {
  const values = [...new Set(merch.map(x => path.split('.').reduce((a,k) => a?.[k], x)).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b), 'zh-Hant'));
  return values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

function bindCollection() {
  const els = ['search','work','character','type','status','sort'].map(id => document.getElementById(id)).filter(Boolean);
  const render = () => {
    const q = document.getElementById('search')?.value.trim().toLowerCase() || '';
    const filters = { work: document.getElementById('work')?.value, character: document.getElementById('character')?.value, type: document.getElementById('type')?.value, status: document.getElementById('status')?.value };
    let list = merch.filter(item => {
      const haystack = [item.name,item.work,item.character,item.note,item.description].filter(Boolean).join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (!filters.work || item.work === filters.work) && (!filters.character || item.character === filters.character) && (!filters.type || item.type === filters.type) && (!filters.status || item.shipping?.status === filters.status);
    });
    const sort = document.getElementById('sort')?.value;
    list.sort((a,b) => sort === 'name' ? String(a.name).localeCompare(String(b.name),'zh-Hant') : sort === 'price' ? Number(b.purchase?.price || 0) - Number(a.purchase?.price || 0) : sort === 'date' ? String(b.purchase?.date || '').localeCompare(String(a.purchase?.date || '')) : String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    document.getElementById('result-count').textContent = `${list.length} ITEMS`;
    document.getElementById('collection-results').innerHTML = list.length ? `<div class="archive-grid">${list.map(itemCard).join('')}</div>` : `<div class="empty"><h2>沒有符合條件的收藏</h2><p>試著放寬搜尋或清除其中一個篩選條件。</p></div>`;
  };
  els.forEach(el => el.addEventListener('input', render));
  els.forEach(el => el.addEventListener('change', render));
  render();
}

function statsPage() {
  const s = stats();
  const works = countBy('work');
  const chars = countBy('character');
  const totalSpent = merch.reduce((sum,x) => sum + Number(x.purchase?.price || 0), 0);
  return `<div class="page-head"><div><div class="eyebrow">${routes.stats.eyebrow}</div><h1>${routes.stats.title}</h1></div><p class="page-desc">${routes.stats.desc}</p></div>
  <section class="section"><div class="stats-strip"><div class="stat"><span class="stat-label">TOTAL</span><span class="stat-value">${s.total}</span></div><div class="stat"><span class="stat-label">RECEIVED</span><span class="stat-value">${s.received}</span></div><div class="stat"><span class="stat-label">PENDING</span><span class="stat-value">${s.pending}</span></div><div class="stat"><span class="stat-label">SPENDING</span><span class="stat-value">${totalSpent.toLocaleString()}</span></div></div></section>
  <section class="section"><div class="dashboard-grid"><div class="panel"><h3>作品分布</h3>${bars(works)}</div><div class="panel"><h3>角色分布</h3>${bars(chars)}</div><div class="panel"><h3>類型</h3>${bars(countBy('type'))}</div></div></section>`;
}
function countBy(path) { const map = {}; merch.forEach(x => { const v = path.split('.').reduce((a,k)=>a?.[k],x) || '未分類'; map[v]=(map[v]||0)+1; }); return map; }
function bars(map) { const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8); const max = entries[0]?.[1] || 1; return entries.length ? entries.map(([name,n])=>`<div class="bar-row"><span>${esc(name)}</span><span class="bar"><i style="width:${n/max*100}%"></i></span><span>${n}</span></div>`).join('') : '<p class="section-note">尚無資料</p>'; }

function managePage() {
  return `<div class="page-head"><div><div class="eyebrow">${routes.manage.eyebrow}</div><h1>${routes.manage.title}</h1></div><p class="page-desc">${routes.manage.desc}</p></div>
  <section class="section"><div class="notice">管理功能的資料寫入層尚未接上 GitHub API。介面先完整保留，後續接上登入與 commit 後即可直接使用。</div><div style="height:30px"></div><form class="form-grid" onsubmit="return false"><div class="form-field"><label>NAME</label><input class="field" placeholder="收藏名稱"></div><div class="form-field"><label>WORK</label><input class="field" placeholder="作品名稱"></div><div class="form-field"><label>CHARACTER</label><input class="field" placeholder="角色名稱"></div><div class="form-field"><label>TYPE</label><input class="field" placeholder="Figure / Acrylic / Card…"></div><div class="form-field full"><label>NOTE</label><textarea class="field" rows="5" placeholder="備註"></textarea></div><div class="form-field full"><button class="action" type="button">預覽新增資料</button></div></form></section>`;
}
function settingsPage() {
  return `<div class="page-head"><div><div class="eyebrow">${routes.settings.eyebrow}</div><h1>${routes.settings.title}</h1></div><p class="page-desc">${routes.settings.desc}</p></div>
  <section class="section"><div class="detail-row"><div class="detail-key">GITHUB</div><div>尚未登入</div></div><div class="detail-row"><div class="detail-key">REPOSITORY</div><div>tsai97216/merch</div></div><div class="detail-row"><div class="detail-key">BRANCH</div><div>main</div></div><div class="detail-row"><div class="detail-key">DATA</div><div>data/merch.json</div></div></section>`;
}
function emptyPage(title, desc) { return `<div class="empty" style="margin-top:70px"><h2>${esc(title)}</h2><p>${esc(desc)}</p></div>`; }

async function render() {
  const route = routeName();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  if (route === 'home') app.innerHTML = home();
  if (route === 'collection') app.innerHTML = collection(parts[1]);
  if (route === 'stats') app.innerHTML = statsPage();
  if (route === 'manage') app.innerHTML = managePage();
  if (route === 'settings') app.innerHTML = settingsPage();
  if (route === 'collection' && !parts[1]) bindCollection();
  nav.classList.remove('open');
}

menuButton?.addEventListener('click', () => nav.classList.toggle('open'));
window.addEventListener('hashchange', render);
(async () => { merch = await window.MerchData.loadMerch(); await render(); })();

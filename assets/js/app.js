import { github } from './github.js?build=stable1';
import { loadData } from './data.js?build=stable1';
import { createItemDetail } from './item-detail.js';
import { createDashboard } from './dashboard.js';
import { createCollection } from './collection.js';
import { createStatistics } from './statistics.js';
import { createManagement } from './management.js';
import { createSettings } from './settings.js?build=stable1';
import { attachSyncBridge } from './sync-bridge.js?build=stable1';
import { getVersion } from './version.js?build=stable1';

const pages = [...document.querySelectorAll('.page')];
const navItems = [...document.querySelectorAll('.nav-item')];
const pageIds = new Set(pages.map((page) => page.id));

function route() {
  const requested = location.hash.replace(/^#/, '');
  const activeId = pageIds.has(requested) ? requested : 'home';
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

function renderVersion() {
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = getVersion();
  });
}

function showError(title, message) {
  const content = document.querySelector('.content');
  if (!content) return;
  const notice = document.createElement('div');
  notice.className = 'data-error';
  notice.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
  content.prepend(notice);
}

window.addEventListener('hashchange', route);
window.addEventListener('chi-merch:version', renderVersion);
route();
document.documentElement.classList.add('app-ready');

async function boot() {
  try { await github.loadVersion(); }
  catch (error) { console.warn('[Chi MERCH] remote version unavailable:', error); }
  renderVersion();

  try {
    const data = await loadData();
    const detail = createItemDetail();
    const dashboard = createDashboard({ home: document.querySelector('#home'), items: data.items, works: data.works, detail });
    const collection = createCollection({ collection: document.querySelector('#collection'), items: data.items, works: data.works, detail });
    const statistics = createStatistics({ statistics: document.querySelector('#statistics'), works: data.works, items: data.items });
    createManagement({ management: document.querySelector('#management'), store: data });
    createSettings({ settings: document.querySelector('#settings') });
    attachSyncBridge(document.querySelector('#management'), data);
    data.subscribe(() => { dashboard?.render?.(); collection?.render?.(); statistics?.render?.(); });
    document.documentElement.dataset.dataReady = 'true';
  } catch (error) {
    console.error('[Chi MERCH] data bootstrap failed', error);
    showError('資料載入失敗', '無法讀取收藏資料庫，請稍後再試。');
  }
}

boot();

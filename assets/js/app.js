import { loadData } from './data.js';
import { createItemDetail } from './item-detail.js';
import { createDashboard } from './dashboard.js';
import { createCollection } from './collection.js';
import { createStatistics } from './statistics.js';
import { createManagement } from './management.js';

const VERSION = 'v2.1.0';

function updateVersion() {
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
}
function showError(error) {
  console.error('[Chi MERCH]', error);
  const content = document.querySelector('.content');
  if (!content) return;
  const notice = document.createElement('div'); notice.className = 'data-error';
  notice.innerHTML = '<strong>資料載入失敗</strong><p>無法讀取收藏資料庫，請確認網站可以正常讀取 data/ 下的 JSON 檔案。</p>'; content.prepend(notice);
}
async function boot() {
  updateVersion();
  try {
    const data = await loadData();
    const detail = createItemDetail();
    const dashboard = createDashboard({ home: document.querySelector('#home'), items: data.items, works: data.works, detail });
    const collection = createCollection({ collection: document.querySelector('#collection'), items: data.items, works: data.works, detail });
    const statistics = createStatistics({ statistics: document.querySelector('#statistics'), works: data.works, items: data.items });
    createManagement({ management: document.querySelector('#management'), store: data });
    data.subscribe(() => { dashboard?.render?.(); collection?.render?.(); statistics?.render?.(); });
    document.documentElement.dataset.dataReady = 'true';
  } catch (error) { showError(error); }
}
boot();

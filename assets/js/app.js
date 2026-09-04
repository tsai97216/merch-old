import { loadData } from './data.js?v=2.16.5';
import { createItemDetail } from './item-detail.js?v=2.16.5';
import { createDashboard } from './dashboard.js?v=2.16.5';
import { createCollection } from './collection.js?v=2.16.5';
import { createStatistics } from './statistics.js?v=2.16.5';
import { createManagement } from './management.js?v=2.16.5';
import { createSettings } from './settings.js?v=2.16.5';
import { attachSyncBridge } from './sync-bridge.js?v=2.16.5';
import { getVersion, setVersion } from './version.js?v=2.16.5';

function updateVersion() {
  const version = getVersion();
  document.querySelectorAll('.sidebar-footer span:last-child,#settings dd,.footer span:last-child,[data-version]').forEach((element) => {
    if (/^v\d+\.\d+\.\d+$/.test(element.textContent.trim())) element.textContent = version;
  });
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href.includes('/assets/css/style.css') || link.href.includes('/assets/css/pages.css')) {
      const url = new URL(link.href, location.href);
      url.searchParams.set('v', version.slice(1));
      link.href = url.href;
    }
  });
}

window.addEventListener('chi-merch:version', (event) => {
  if (event.detail?.version) setVersion(event.detail.version);
  updateVersion();
});

function showError(error) {
  console.error('[Chi MERCH]', error);
  const content = document.querySelector('.content');
  if (content) {
    const notice = document.createElement('div');
    notice.className = 'data-error';
    notice.innerHTML = '<strong>資料載入失敗</strong><p>無法讀取收藏資料庫，請確認網站可以正常讀取 data/ 下的 JSON 檔案。</p>';
    content.prepend(notice);
  }
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
    createSettings({ settings: document.querySelector('#settings') });
    attachSyncBridge(document.querySelector('#management'), data);
    data.subscribe(() => {
      dashboard?.render?.();
      collection?.render?.();
      statistics?.render?.();
    });
    document.documentElement.dataset.dataReady = 'true';
  } catch (error) {
    showError(error);
  }
}

boot();

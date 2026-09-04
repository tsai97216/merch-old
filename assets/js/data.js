const DATA_URL = 'data/merch.json';

const EMPTY_DATABASE = {
  schemaVersion: 1,
  currency: 'TWD',
  items: []
};

function normalizeItem(item = {}) {
  return {
    id: String(item.id || crypto.randomUUID()),
    name: String(item.name || ''),
    work: String(item.work || ''),
    character: String(item.character || ''),
    type: String(item.type || ''),
    status: String(item.status || '待整理'),
    description: String(item.description || ''),
    images: Array.isArray(item.images) ? item.images : [],
    purchase: {
      price: item.purchase?.price ?? null,
      currency: item.purchase?.currency || 'TWD',
      platform: item.purchase?.platform || '',
      date: item.purchase?.date || '',
      url: item.purchase?.url || '',
      order: item.purchase?.order || ''
    },
    release: {
      releaseDate: item.release?.releaseDate || '',
      expectedDate: item.release?.expectedDate || '',
      receivedDate: item.release?.receivedDate || ''
    },
    shipping: {
      status: item.shipping?.status || item.status || '待整理',
      method: item.shipping?.method || '',
      trackingNumber: item.shipping?.trackingNumber || '',
      note: item.shipping?.note || ''
    },
    afterSales: {
      status: item.afterSales?.status || '',
      note: item.afterSales?.note || ''
    },
    note: String(item.note || ''),
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || ''
  };
}

function normalizeDatabase(payload) {
  if (Array.isArray(payload)) return { ...EMPTY_DATABASE, items: payload.map(normalizeItem) };
  if (!payload || typeof payload !== 'object') return { ...EMPTY_DATABASE };
  return {
    schemaVersion: Number(payload.schemaVersion) || 1,
    currency: payload.currency || 'TWD',
    items: Array.isArray(payload.items) ? payload.items.map(normalizeItem) : []
  };
}

async function loadDatabase() {
  const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return normalizeDatabase(await response.json());
}

window.MerchData = {
  loadDatabase,
  normalizeItem,
  normalizeDatabase,
  emptyDatabase: () => structuredClone(EMPTY_DATABASE)
};

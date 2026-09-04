const DATA_URL = 'data/merch.json';

const fallbackMerch = [];

async function loadMerch() {
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : fallbackMerch;
  } catch (error) {
    console.warn('Unable to load merch.json:', error);
    return fallbackMerch;
  }
}

window.MerchData = { loadMerch };

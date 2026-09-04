export async function loadMerch() {
  try {
    const response = await fetch('./data/merch.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('無法載入收藏資料，使用空資料集。', error);
    return [];
  }
}

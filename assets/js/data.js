const WORK_INDEX_PATH = 'data/works.json';

let cache = null;

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`無法載入資料：${path} (${response.status})`);
  return response.json();
}

export async function loadData() {
  if (cache) return cache;

  const index = await fetchJson(WORK_INDEX_PATH);
  const works = await Promise.all(
    index.works.map(async (work) => {
      const data = await fetchJson(work.data);
      return {
        ...work,
        ...data,
        id: work.id,
        name: work.name,
        items: Array.isArray(data.items)
          ? data.items.map((item) => ({ ...item, workId: work.id, workName: work.name }))
          : []
      };
    })
  );

  const items = works.flatMap((work) => work.items);
  cache = {
    schemaVersion: index.schemaVersion || 1,
    works,
    items,
    getWork(id) { return works.find((work) => work.id === id) || null; },
    getItem(id) { return items.find((item) => item.id === id) || null; }
  };
  return cache;
}

export function clearDataCache() {
  cache = null;
}

import { github } from './github.js?v=2.11.3';

const WORK_INDEX_PATH = 'data/works.json';

let cache = null;
const listeners = new Set();

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`無法載入資料：${path} (${response.status})`);
  return response.json();
}

async function loadWorkData(work) {
  if (github.connected) {
    const remote = await github.readWorkFile(work.id);
    return remote.data;
  }
  return fetchJson(work.data);
}

export async function loadData() {
  if (cache) return cache;

  const index = await fetchJson(WORK_INDEX_PATH);
  const works = await Promise.all(
    index.works.map(async (work) => {
      const data = await loadWorkData(work);
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
    getItem(id) { return items.find((item) => item.id === id) || null; },
    addItem(item) {
      const work = works.find((entry) => entry.id === item.workId);
      if (!work) throw new Error('找不到指定作品。');
      const normalized = { ...item, workId: work.id, workName: work.name };
      work.items.push(normalized);
      items.push(normalized);
      notify();
      return normalized;
    },
    updateItem(id, patch) {
      const current = items.find((item) => item.id === id);
      if (!current) throw new Error('找不到指定收藏。');
      const nextWorkId = patch.workId || current.workId;
      const nextWork = works.find((entry) => entry.id === nextWorkId);
      if (!nextWork) throw new Error('找不到指定作品。');

      const index = items.indexOf(current);
      const oldWork = works.find((entry) => entry.id === current.workId);
      const next = { ...current, ...patch, workId: nextWork.id, workName: nextWork.name };
      items[index] = next;

      if (oldWork && oldWork !== nextWork) {
        const oldIndex = oldWork.items.indexOf(current);
        if (oldIndex >= 0) oldWork.items.splice(oldIndex, 1);
        nextWork.items.push(next);
      } else {
        const workIndex = nextWork.items.indexOf(current);
        if (workIndex >= 0) nextWork.items[workIndex] = next;
      }
      notify();
      return next;
    },
    removeItem(id) {
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return false;
      const [removed] = items.splice(index, 1);
      const work = works.find((entry) => entry.id === removed.workId);
      if (work) {
        const workIndex = work.items.indexOf(removed);
        if (workIndex >= 0) work.items.splice(workIndex, 1);
      }
      notify();
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
  return cache;
}

function notify() {
  listeners.forEach((listener) => {
    try { listener(cache); } catch (error) { console.error('[Chi MERCH] render listener error', error); }
  });
}

export function clearDataCache() {
  cache = null;
  listeners.clear();
}

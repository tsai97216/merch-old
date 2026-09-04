import { github } from './github.js?v=2.17.5';

const WORK_INDEX_PATH = 'data/works.json';

let cache = null;
const listeners = new Set();
let reloadPromise = null;

async function loadWorkData(work) {
  const remote = await github.readWorkFile(work.id);
  return remote.data;
}

async function fetchSnapshot() {
  const index = await github.readFile(WORK_INDEX_PATH);
  const works = await Promise.all(
    index.data.works.map(async (work) => {
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
  return { schemaVersion: index.data?.schemaVersion || 1, works, items: works.flatMap((work) => work.items) };
}

function applySnapshot(snapshot) {
  if (!cache) return;
  cache.schemaVersion = snapshot.schemaVersion;
  cache.works = snapshot.works;
  cache.items = snapshot.items;
  notify();
}

async function reload() {
  if (reloadPromise) return reloadPromise;
  reloadPromise = fetchSnapshot()
    .then((snapshot) => {
      if (!cache) cache = createStore(snapshot);
      else applySnapshot(snapshot);
      return cache;
    })
    .finally(() => { reloadPromise = null; });
  return reloadPromise;
}

function createStore(snapshot) {
  return {
    schemaVersion: snapshot.schemaVersion,
    works: snapshot.works,
    items: snapshot.items,
    getWork(id) { return this.works.find((work) => work.id === id) || null; },
    getItem(id) { return this.items.find((item) => item.id === id) || null; },
    addItem(item) {
      const work = this.works.find((entry) => entry.id === item.workId);
      if (!work) throw new Error('找不到指定作品。');
      const normalized = { ...item, workId: work.id, workName: work.name };
      work.items.push(normalized);
      this.items.push(normalized);
      notify();
      return normalized;
    },
    updateItem(id, patch) {
      const current = this.items.find((item) => item.id === id);
      if (!current) throw new Error('找不到指定收藏。');
      const nextWorkId = patch.workId || current.workId;
      const nextWork = this.works.find((entry) => entry.id === nextWorkId);
      if (!nextWork) throw new Error('找不到指定作品。');

      const index = this.items.indexOf(current);
      const oldWork = this.works.find((entry) => entry.id === current.workId);
      const next = { ...current, ...patch, workId: nextWork.id, workName: nextWork.name };
      this.items[index] = next;

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
      const index = this.items.findIndex((item) => item.id === id);
      if (index < 0) return false;
      const [removed] = this.items.splice(index, 1);
      const work = this.works.find((entry) => entry.id === removed.workId);
      if (work) {
        const workIndex = work.items.indexOf(removed);
        if (workIndex >= 0) work.items.splice(workIndex, 1);
      }
      notify();
      return true;
    },
    async reload() { return reload(); },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

function notify() {
  listeners.forEach((listener) => {
    try { listener(cache); } catch (error) { console.error('[Chi MERCH] render listener error', error); }
  });
}

window.addEventListener('chi-merch:github', () => {
  if (cache) reload().catch((error) => console.error('[Chi MERCH] data reload error', error));
});

export async function loadData() {
  return reload();
}

export async function reloadData() {
  return reload();
}

export function clearDataCache() {
  cache = null;
  reloadPromise = null;
}

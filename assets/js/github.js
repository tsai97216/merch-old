import { getVersion, setVersion } from './version.js?v=2.17.9';

const API_BASE = 'https://chi-merch-api.tsai97216.workers.dev';
const REPO_OWNER = 'tsai97216';
const REPO_NAME = 'merch';
const BRANCH = 'main';
const WORK_INDEX_PATH = 'data/works.json';
const VERSION_PATH = 'data/version.json';

let connected = false;
let adminSecret = '';

function apiHeaders(jsonBody = false) {
  return {
    ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(adminSecret ? { Authorization: `Bearer ${adminSecret}` } : {})
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'omit',
    headers: { ...apiHeaders(Boolean(options.body)), ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `API 錯誤：${response.status}`);
  return body;
}

function encodeText(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeText(value) {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBytes(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return btoa(binary);
}

function apiPath(path) {
  return `/github/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(BRANCH)}`;
}

export async function readFile(path) {
  const data = await request(apiPath(path));
  return { path, sha: data.sha, url: data.html_url, data: JSON.parse(decodeText(data.content)) };
}

async function writeFile(path, file, message) {
  const response = await request(`/github/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: encodeText(JSON.stringify(file.data, null, 2) + '\n'), sha: file.sha, branch: BRANCH })
  });
  return response.commit.sha;
}

async function readWorkFile(workId) {
  const index = await readFile(WORK_INDEX_PATH);
  const work = index.data.works.find((entry) => entry.id === workId);
  if (!work) throw new Error(`找不到作品：${workId}`);
  return readFile(work.data);
}

async function loadRemoteVersion() {
  const file = await readFile(VERSION_PATH);
  const version = String(file.data?.version || '').replace(/^v/, '');
  if (/^\d+\.\d+\.\d+$/.test(version)) setVersion(`v${version}`);
  return getVersion();
}

function cleanItem(item) {
  return {
    id: item.id, images: Array.isArray(item.images) ? item.images : [], workId: item.workId, title: item.title,
    series: item.series || '', characters: Array.isArray(item.characters) ? item.characters : [], category: item.category || '',
    manufacturer: item.manufacturer || '', status: item.status || '', description: item.description || '', notes: item.notes || '',
    purchase: item.purchase || {}, release: item.release || {}, shipping: item.shipping || {}, afterSales: item.afterSales || {},
    createdAt: item.createdAt || '', updatedAt: item.updatedAt || ''
  };
}

async function bumpCollectionVersion(delta) {
  const file = await readFile(VERSION_PATH);
  const raw = String(file.data?.version || getVersion()).replace(/^v/, '');
  const parts = raw.split('.').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) throw new Error('版本資料格式無效。');
  parts[2] += delta;
  const version = parts.join('.');
  file.data = { version, updatedAt: new Date().toISOString() };
  await writeFile(VERSION_PATH, file, `chore: bump version to v${version}`);
  setVersion(`v${version}`);
  window.dispatchEvent(new CustomEvent('chi-merch:version', { detail: { version: `v${version}` } }));
  return `v${version}`;
}

export const github = {
  get connected() { return connected; },
  get user() { return connected ? 'Admin' : ''; },
  async test(secret = '') {
    const token = secret.trim();
    if (!token) throw new Error('Admin Secret 不可為空。');
    adminSecret = token;
    try {
      const result = await request('/auth/status');
      if (!result.authenticated) throw new Error('Admin Secret 驗證失敗。');
      connected = true;
      window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: true, email: 'Admin' } }));
      return { user: 'Admin', repository: `${REPO_OWNER}/${REPO_NAME}` };
    } catch (error) {
      adminSecret = '';
      connected = false;
      throw error;
    }
  },
  connect() {
    const secret = window.prompt('請輸入 Admin Secret');
    if (secret === null) throw new Error('已取消。');
    return this.test(secret);
  },
  disconnect() {
    connected = false;
    adminSecret = '';
    window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: false } }));
  },
  async loadVersion() { return loadRemoteVersion(); },
  async readAllWorks() {
    const index = await readFile(WORK_INDEX_PATH);
    const works = await Promise.all(index.data.works.map(async (work) => ({ ...work, file: await readFile(work.data) })));
    return { index, works };
  },
  async readWorkFile(workId) {
    return readWorkFile(workId);
  },
  async syncAdd(item) {
    const file = await readWorkFile(item.workId);
    file.data.items = [...(file.data.items || []), cleanItem(item)];
    file.data.updatedAt = new Date().toISOString();
    await writeFile(file.path, file, `feat: add collection item ${item.id}`);
    return { version: await bumpCollectionVersion(1) };
  },
  async syncUpdate(before, after, oldWork, newWork) {
    if (!oldWork || !newWork) throw new Error('找不到收藏所屬作品。');
    if (oldWork.id === newWork.id) {
      const file = await readWorkFile(newWork.id);
      const items = (file.data.items || []).map((entry) => entry.id === before.id ? cleanItem(after) : entry);
      if (!items.some((entry) => entry.id === before.id)) throw new Error('找不到要更新的收藏。');
      file.data = { ...file.data, items, updatedAt: new Date().toISOString() };
      return { results: [await writeFile(file.path, file, `fix: update ${after.title}`)] };
    }
    const oldFile = await readWorkFile(oldWork.id);
    const newFile = await readWorkFile(newWork.id);
    const oldItems = (oldFile.data.items || []).filter((entry) => entry.id !== before.id);
    const newItems = [...(newFile.data.items || [])];
    if (newItems.some((entry) => entry.id === after.id)) throw new Error('目標作品已有相同 ID 的收藏。');
    newItems.push(cleanItem(after));
    oldFile.data = { ...oldFile.data, items: oldItems, updatedAt: new Date().toISOString() };
    newFile.data = { ...newFile.data, items: newItems, updatedAt: new Date().toISOString() };
    const results = [await writeFile(oldFile.path, oldFile, `refactor: move ${after.title}`)];
    try { results.push(await writeFile(newFile.path, newFile, `refactor: move ${after.title}`)); }
    catch (error) { throw new Error(`原作品已更新，但新作品寫入失敗：${error.message}`); }
    return { results };
  },
  async syncDelete(item) {
    const file = await readWorkFile(item.workId);
    const before = (file.data.items || []).length;
    file.data.items = (file.data.items || []).filter((entry) => entry.id !== item.id);
    if (file.data.items.length === before) throw new Error('找不到要刪除的收藏。');
    file.data.updatedAt = new Date().toISOString();
    await writeFile(file.path, file, `feat: delete collection item ${item.id}`);
    return { version: await bumpCollectionVersion(1) };
  },
  async uploadImage({ path, file, message }) {
    if (!(file instanceof File)) throw new Error('無效的圖片檔案。');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const response = await request(`/github/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'PUT',
      body: JSON.stringify({ message, content: encodeBytes(bytes), branch: BRANCH })
    });
    return { path, sha: response.content?.sha || '', url: response.content?.download_url || `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`, commit: response.commit?.sha || '' };
  },
  async deleteFile(path, sha, message) {
    const response = await request(`/github/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha, branch: BRANCH })
    });
    return response.commit.sha;
  },
  async bumpImageVersion(delta = 1) { return bumpCollectionVersion(delta); }
};

export { REPO_OWNER, REPO_NAME, BRANCH, API_BASE };

import { getVersion, setVersion } from './version.js';

const SESSION_KEY = 'chi-merch-github-token';
const REPO_OWNER = 'tsai97216';
const REPO_NAME = 'merch';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const WORK_INDEX_PATH = 'data/works.json';
const VERSION_PATH = 'data/version.json';

let token = sessionStorage.getItem(SESSION_KEY) || '';

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

async function request(path, options = {}) {
  if (!token) throw new Error('尚未連接 GitHub。');
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `GitHub API 錯誤：${response.status}`);
  }
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
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function readFile(path) {
  const data = await request(`contents/${path}?ref=${encodeURIComponent(BRANCH)}`);
  return {
    path,
    sha: data.sha,
    url: data.html_url,
    data: JSON.parse(decodeText(data.content))
  };
}

async function writeFile(path, file, message) {
  const response = await request(`contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: encodeText(JSON.stringify(file.data, null, 2) + '\n'),
      sha: file.sha,
      branch: BRANCH
    })
  });
  return response.commit.sha;
}

async function readWorkFile(workId) {
  const index = await readFile(WORK_INDEX_PATH);
  const work = index.data.works.find((entry) => entry.id === workId);
  if (!work) throw new Error(`找不到作品：${workId}`);
  return readFile(work.data);
}

function cleanItem(item) {
  return {
    id: item.id,
    images: Array.isArray(item.images) ? item.images : [],
    workId: item.workId,
    title: item.title,
    series: item.series || '',
    characters: Array.isArray(item.characters) ? item.characters : [],
    category: item.category || '',
    manufacturer: item.manufacturer || '',
    status: item.status || '',
    description: item.description || '',
    notes: item.notes || '',
    purchase: item.purchase || {},
    release: item.release || {},
    shipping: item.shipping || {},
    afterSales: item.afterSales || {},
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || ''
  };
}

async function bumpCollectionVersion(delta) {
  const file = await readFile(VERSION_PATH);
  const raw = String(file.data?.version || getVersion()).replace(/^v/, '');
  const parts = raw.split('.').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error('版本資料格式無效。');
  }
  parts[2] += delta;
  const version = parts.join('.');
  file.data = { version, updatedAt: new Date().toISOString() };
  await writeFile(VERSION_PATH, file, `chore: bump version to v${version}`);
  setVersion(`v${version}`);
  window.dispatchEvent(new CustomEvent('chi-merch:version', { detail: { version: `v${version}` } }));
  return `v${version}`;
}

export const github = {
  get connected() {
    return Boolean(token);
  },
  connect(nextToken) {
    token = nextToken.trim();
    if (!token) throw new Error('請輸入 GitHub Token。');
    sessionStorage.setItem(SESSION_KEY, token);
    window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: true } }));
  },
  disconnect() {
    token = '';
    sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: false } }));
  },
  async test() {
    const data = await request('contents/data/works.json?ref=' + encodeURIComponent(BRANCH));
    return Boolean(data.sha);
  },
  async readAllWorks() {
    const index = await readFile(WORK_INDEX_PATH);
    const works = await Promise.all(index.data.works.map(async (work) => {
      const file = await readFile(work.data);
      return { ...work, file };
    }));
    return { index, works };
  },
  async syncAdd(item) {
    const file = await readWorkFile(item.workId);
    file.data.items = [...file.data.items, cleanItem(item)];
    file.data.updatedAt = new Date().toISOString();
    await writeFile(file.path, file, `feat: add collection item ${item.id}`);
    return { version: await bumpCollectionVersion(1) };
  },
  async syncUpdate(item) {
    const target = await readWorkFile(item.workId);
    const next = cleanItem(item);
    const index = target.data.items.findIndex((entry) => entry.id === item.id);
    if (index < 0) throw new Error('找不到要更新的收藏。');
    target.data.items[index] = next;
    target.data.updatedAt = new Date().toISOString();
    await writeFile(target.path, target, `feat: update collection item ${item.id}`);
    return { version: getVersion() };
  },
  async syncDelete(item) {
    const file = await readWorkFile(item.workId);
    const before = file.data.items.length;
    file.data.items = file.data.items.filter((entry) => entry.id !== item.id);
    if (file.data.items.length === before) throw new Error('找不到要刪除的收藏。');
    file.data.updatedAt = new Date().toISOString();
    await writeFile(file.path, file, `feat: delete collection item ${item.id}`);
    return { version: await bumpCollectionVersion(1) };
  },
  async uploadImage({ path, file, message }) {
    if (!(file instanceof File)) throw new Error('無效的圖片檔案。');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const response = await request(`contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: encodeBytes(bytes),
        branch: BRANCH
      })
    });
    return {
      path,
      sha: response.content?.sha || '',
      url: response.content?.download_url || `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`,
      commit: response.commit?.sha || ''
    };
  },
  async deleteFile(path, sha, message) {
    const response = await request(`contents/${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sha, branch: BRANCH })
    });
    return response.commit.sha;
  },
  async bumpImageVersion(delta = 1) {
    return bumpCollectionVersion(delta);
  }
};

export { REPO_OWNER, REPO_NAME, BRANCH };

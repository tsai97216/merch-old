const REPO = 'tsai97216/merch';
const BRANCH = 'main';
const TOKEN_KEY = 'chi-merch-github-token';
const API = 'https://api.github.com';

const headers = (token) => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  Authorization: `Bearer ${token}`
});

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
function setToken(token) {
  try { if (token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY); } catch {}
}
function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}
function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function pathFor(workId) { return `data/${workId}/data.json`; }

async function request(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('尚未連線 GitHub。');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) }
  });
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const message = body?.message || `GitHub API 錯誤 (${response.status})`;
    throw new Error(message);
  }
  return body;
}

async function readWorkFile(workId) {
  const body = await request(`/repos/${REPO}/contents/${pathFor(workId)}?ref=${encodeURIComponent(BRANCH)}`);
  return {
    sha: body.sha,
    data: JSON.parse(decodeBase64(body.content))
  };
}

async function writeWorkFile(workId, file, message) {
  const content = JSON.stringify(file.data, null, 2) + '\n';
  return request(`/repos/${REPO}/contents/${pathFor(workId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: encodeBase64(content), sha: file.sha, branch: BRANCH })
  });
}

function cleanItem(item, work) {
  const { workName, ...rest } = item;
  return { ...rest, workId: work.id };
}

export const github = {
  get connected() { return Boolean(getToken()); },
  setToken,
  clearToken() { setToken(''); },
  async readWorkFile(workId) { return readWorkFile(workId); },

  async testConnection(token) {
    if (token !== undefined) setToken(token.trim());
    const user = await request('/user');
    const repo = await request(`/repos/${REPO}`);
    return { user: user.login, repository: repo.full_name, permissions: repo.permissions || {} };
  },

  async syncAdd(item, work) {
    const file = await readWorkFile(work.id);
    const items = Array.isArray(file.data.items) ? [...file.data.items] : [];
    if (items.some((entry) => entry.id === item.id)) throw new Error('GitHub 上已存在相同 ID 的收藏。');
    items.push(cleanItem(item, work));
    file.data = { ...file.data, schemaVersion: file.data.schemaVersion || 1, work: work.id, name: work.name, items, updatedAt: new Date().toISOString() };
    return writeWorkFile(work.id, file, `feat: add ${item.title}`);
  },

  async syncUpdate(before, after, oldWork, newWork) {
    if (oldWork.id === newWork.id) {
      const file = await readWorkFile(newWork.id);
      const items = Array.isArray(file.data.items) ? file.data.items.map((entry) => entry.id === before.id ? cleanItem(after, newWork) : entry) : [];
      if (!items.some((entry) => entry.id === before.id)) throw new Error('GitHub 上找不到要更新的收藏。');
      file.data = { ...file.data, schemaVersion: file.data.schemaVersion || 1, work: newWork.id, name: newWork.name, items, updatedAt: new Date().toISOString() };
      return [await writeWorkFile(newWork.id, file, `fix: update ${after.title}`)];
    }

    const oldFile = await readWorkFile(oldWork.id);
    const newFile = await readWorkFile(newWork.id);
    const oldItems = (oldFile.data.items || []).filter((entry) => entry.id !== before.id);
    const newItems = [...(newFile.data.items || [])];
    if (newItems.some((entry) => entry.id === after.id)) throw new Error('目標作品已有相同 ID 的收藏。');
    newItems.push(cleanItem(after, newWork));
    oldFile.data = { ...oldFile.data, items: oldItems, updatedAt: new Date().toISOString() };
    newFile.data = { ...newFile.data, items: newItems, updatedAt: new Date().toISOString() };
    const result = [];
    result.push(await writeWorkFile(oldWork.id, oldFile, `refactor: move ${after.title}`));
    try {
      result.push(await writeWorkFile(newWork.id, newFile, `refactor: move ${after.title}`));
    } catch (error) {
      throw new Error(`原作品已更新，但新作品寫入失敗：${error.message}`);
    }
    return result;
  },

  async syncDelete(item, work) {
    const file = await readWorkFile(work.id);
    const items = Array.isArray(file.data.items) ? file.data.items.filter((entry) => entry.id !== item.id) : [];
    if (items.length === file.data.items?.length) throw new Error('GitHub 上找不到要刪除的收藏。');
    file.data = { ...file.data, items, updatedAt: new Date().toISOString() };
    return writeWorkFile(work.id, file, `feat: remove ${item.title}`);
  }
};

const REPO_OWNER = 'tsai97216';
const REPO_NAME = 'merch';
const BRANCH = 'main';
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const ALLOWED_PREFIXES = ['data/', 'assets/'];
const ALLOWED_ORIGIN = 'https://merch.chi.qzz.io';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
      ...extraHeaders
    }
  });
}

function normalizePath(pathname) {
  const prefix = '/github/contents/';
  if (!pathname.startsWith(prefix)) return '';
  const path = decodeURIComponent(pathname.slice(prefix.length)).replace(/^\/+/, '');
  if (!path || path.includes('..') || !ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) return '';
  return path;
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function isAuthorized(request, env) {
  if (!env.ADMIN_SECRET) return false;
  const token = getBearerToken(request);
  return Boolean(token) && token === env.ADMIN_SECRET;
}

function githubHeaders(env, jsonBody = false) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tsai97216-merch/2.12.3',
    ...(jsonBody ? { 'Content-Type': 'application/json' } : {})
  };
}

function githubResponseHeaders(response) {
  const headers = {};
  for (const name of [
    'x-github-request-id',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'x-ratelimit-resource',
    'x-accepted-github-permissions',
    'retry-after'
  ]) {
    const value = response.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

async function githubRequest(request, env, path) {
  if (!env.GITHUB_TOKEN) return json({ error: 'Worker 尚未設定 GITHUB_TOKEN。' }, 503);
  const url = new URL(`${GITHUB_API}/contents/${path}`);
  url.searchParams.set('ref', BRANCH);
  const method = request.method;
  const options = { method, headers: githubHeaders(env, method !== 'GET') };
  if (method !== 'GET' && method !== 'HEAD') options.body = await request.text();

  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  return json(body, response.status, githubResponseHeaders(response));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Vary': 'Origin'
        }
      });
    }

    if (!env.ADMIN_SECRET) return json({ error: 'Worker 尚未設定 ADMIN_SECRET。' }, 503);
    if (!isAuthorized(request, env)) return json({ error: 'Admin Secret 無效或未提供。' }, 401);

    const url = new URL(request.url);
    if (url.pathname === '/auth/status' && request.method === 'GET') {
      return json({ authenticated: true });
    }

    const path = normalizePath(url.pathname);
    if (!path) return json({ error: '不允許的 API 路徑。' }, 404);
    if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return json({ error: '不支援的 HTTP 方法。' }, 405);

    return githubRequest(request, env, path);
  }
};

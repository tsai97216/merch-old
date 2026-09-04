const REPO_OWNER = 'tsai97216';
const REPO_NAME = 'merch';
const BRANCH = 'main';
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const ALLOWED_PREFIXES = ['data/', 'assets/'];

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'https://merch.chi.qzz.io',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
      ...extraHeaders
    }
  });
}

function cors(request) {
  const origin = request.headers.get('Origin');
  if (!origin || origin === 'https://merch.chi.qzz.io') return true;
  return false;
}

function normalizePath(pathname) {
  const prefix = '/github/contents/';
  if (!pathname.startsWith(prefix)) return '';
  const path = decodeURIComponent(pathname.slice(prefix.length)).replace(/^\/+/, '');
  if (!path || path.includes('..') || !ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) return '';
  return path;
}

function githubHeaders(env, jsonBody = false) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(jsonBody ? { 'Content-Type': 'application/json' } : {})
  };
}

async function githubRequest(request, env, path) {
  if (!env.GITHUB_TOKEN) return json({ error: 'Worker 尚未設定 GITHUB_TOKEN。' }, 503);
  const url = new URL(`${GITHUB_API}/contents/${path}`);
  url.searchParams.set('ref', BRANCH);

  const method = request.method;
  const headers = githubHeaders(env, method !== 'GET');
  const options = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') options.body = await request.text();

  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }

  return json(body, response.status);
}

export default {
  async fetch(request, env, ctx) {
    if (!cors(request)) return json({ error: '不允許的來源。' }, 403);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://merch.chi.qzz.io',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
          'Vary': 'Origin'
        }
      });
    }

    if (!ctx.access) return json({ error: '需要 Cloudflare Access 認證。' }, 401);
    const identity = await ctx.access.getIdentity();
    if (!identity?.email) return json({ error: '無法取得 Cloudflare Access 身分。' }, 403);

    const url = new URL(request.url);
    if (url.pathname === '/auth/status' && request.method === 'GET') {
      return json({ authenticated: true, email: identity.email });
    }

    const path = normalizePath(url.pathname);
    if (!path) return json({ error: '不允許的 API 路徑。' }, 404);
    if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return json({ error: '不支援的 HTTP 方法。' }, 405);

    return githubRequest(request, env, path);
  }
};

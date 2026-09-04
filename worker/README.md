# Chi MERCH Cloudflare Worker

這個 Worker 是 `merch.chi.qzz.io` 的 GitHub API 閘道。前端不保存 GitHub Token，GitHub Token 只放在 Cloudflare Worker Secret；管理操作使用 Admin Secret 驗證。

## Cloudflare Worker

- Worker name: `chi-merch-api`
- Endpoint: `https://chi-merch-api.tsai97216.workers.dev`
- Entry: `worker/src/index.js`
- Wrangler config: `worker/wrangler.toml`

## Secrets

在 Cloudflare Workers > `chi-merch-api` > Settings > Variables and Secrets 新增兩個 Secret：

- `GITHUB_TOKEN`: 具有 `tsai97216/merch` Contents 寫入權限的 GitHub token
- `ADMIN_SECRET`: 管理頁使用的 Admin Secret

兩個 Secret 都不會回傳給前端。前端只會在管理工作階段記憶 Admin Secret，並以 `Authorization: Bearer <Admin Secret>` 呼叫 Worker。

## API

- `GET /auth/status`
- `GET /github/contents/<path>`
- `PUT /github/contents/<path>`
- `DELETE /github/contents/<path>`

所有 API 都需要有效的 `Authorization: Bearer <Admin Secret>`。目前只允許 `data/` 與 `assets/` 路徑，並固定操作 `main` branch。

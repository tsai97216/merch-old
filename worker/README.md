# Chi MERCH Cloudflare Worker

這個 Worker 是 `merch.chi.qzz.io` 的 GitHub API 閘道。前端不再保存 GitHub Token，Token 只放在 Cloudflare Worker Secret。

## Cloudflare Worker

- Worker name: `chi-merch-api`
- Custom Domain: `api.merch.chi.qzz.io`
- Entry: `worker/src/index.js`
- Wrangler config: `worker/wrangler.toml`

## Secret

在 Cloudflare Workers > `chi-merch-api` > Settings > Variables and Secrets 新增：

- Type: Secret
- Name: `GITHUB_TOKEN`
- Value: 具有 `tsai97216/merch` Contents 寫入權限的 GitHub token

Secret 不會回傳給前端。

## Cloudflare Access

保護 `api.merch.chi.qzz.io`，並建立 Allow policy，只允許自己的 Google 帳號。

Google IdP 設定完成後，使用者從網站「設定」頁按「Google 帳號認證」，Cloudflare Access 負責登入；回到網站後按「檢查並連線 GitHub」。

Worker 會透過 `ctx.access.getIdentity()` 取得已認證的 email，未經 Access 認證的請求會被拒絕。

## API

- `GET /auth/status`
- `GET /github/contents/<path>`
- `PUT /github/contents/<path>`
- `DELETE /github/contents/<path>`

目前只允許 `data/` 與 `assets/` 路徑，並固定操作 `main` branch。

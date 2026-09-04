import { github } from './github.js';
import { getVersion } from './version.js';
import { API_BASE } from './github.js';

export function createSettings({ settings }) {
  if (!settings) return;
  settings.innerHTML = `<div class="page-heading"><div><span class="eyebrow">05 / SETTINGS</span><h2>設定</h2><p>資料來源、同步與顯示偏好。</p></div></div><div class="two-column"><section class="panel"><div class="panel-heading"><div><span class="panel-label">DATA SOURCE</span><h3>GitHub</h3></div><span class="tag" data-state>未認證</span></div><div class="settings-connect"><p class="settings-description">GitHub Token 不會出現在網站或瀏覽器中。請先使用 Google 帳號完成 Cloudflare Access 認證，再由安全的 Worker 代為連線 GitHub。</p><div class="form-actions"><span class="form-message" data-message></span><button class="button" type="button" data-auth>Google 帳號認證</button><button class="button primary" type="button" data-connect>檢查並連線 GitHub</button><button class="button" type="button" data-disconnect>解除連線</button></div></div><dl class="settings-list"><div><dt>Repository</dt><dd>tsai97216/merch</dd></div><div><dt>Branch</dt><dd>main</dd></div><div><dt>認證方式</dt><dd>Cloudflare Access · Google</dd></div><div><dt>Token 保存</dt><dd>Cloudflare Worker Secret</dd></div></dl></section><section class="panel"><div class="panel-heading"><div><span class="panel-label">DISPLAY</span><h3>顯示設定</h3></div></div><dl class="settings-list"><div><dt>主題</dt><dd>跟隨系統</dd></div><div><dt>收藏檢視</dt><dd>卡片／清單</dd></div><div><dt>貨幣</dt><dd>TWD</dd></div><div><dt>版本</dt><dd data-version>${getVersion()}</dd></div></dl></section></div>`;
  const state = settings.querySelector('[data-state]');
  const message = settings.querySelector('[data-message]');
  const auth = settings.querySelector('[data-auth]');
  const connect = settings.querySelector('[data-connect]');
  const disconnect = settings.querySelector('[data-disconnect]');

  function render() {
    const connected = github.connected;
    state.textContent = connected ? '已連線' : '未認證';
    state.classList.toggle('received', connected);
    settings.querySelector('[data-version]')?.replaceChildren(document.createTextNode(getVersion()));
  }

  auth.onclick = () => {
    window.open(`${API_BASE}/auth/login`, '_blank', 'noopener,noreferrer');
    message.textContent = '已開啟 Cloudflare Access，完成 Google 登入後回到這裡按「檢查並連線 GitHub」。';
    message.dataset.kind = 'success';
  };

  connect.onclick = async () => {
    connect.disabled = true;
    message.textContent = '正在檢查 Cloudflare Access 與 GitHub 連線…';
    message.dataset.kind = '';
    try {
      const result = await github.test();
      message.textContent = `連線成功：${result.user} · ${result.repository}`;
      message.dataset.kind = 'success';
      render();
    } catch (error) {
      github.disconnect();
      message.textContent = `連線失敗：${error.message}`;
      message.dataset.kind = 'error';
      render();
    } finally { connect.disabled = false; }
  };

  disconnect.onclick = () => {
    github.disconnect();
    message.textContent = '已解除本次瀏覽器工作階段的 GitHub 連線。';
    message.dataset.kind = 'success';
    render();
  };

  window.addEventListener('chi-merch:version', render);
  window.addEventListener('chi-merch:github', render);
  render();
}

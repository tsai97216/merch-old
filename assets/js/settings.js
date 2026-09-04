import { github } from './github.js';
import { getVersion } from './version.js';

export function createSettings({ settings }) {
  if (!settings) return;
  settings.innerHTML = `<div class="page-heading"><div><span class="eyebrow">05 / SETTINGS</span><h2>設定</h2><p>資料來源、同步與顯示偏好。</p></div></div><div class="two-column"><section class="panel"><div class="panel-heading"><div><span class="panel-label">DATA SOURCE</span><h3>GitHub</h3></div><span class="tag" data-state>未連線</span></div><div class="settings-connect"><label>GitHub Token<input type="password" data-token autocomplete="off" placeholder="輸入具有 repo Contents 寫入權限的 Token"></label><div class="form-actions"><span class="form-message" data-message></span><button class="button primary" type="button" data-connect>連線並測試</button><button class="button" type="button" data-disconnect>解除連線</button></div></div><dl class="settings-list"><div><dt>Repository</dt><dd>tsai97216/merch</dd></div><div><dt>Branch</dt><dd>main</dd></div><div><dt>資料結構</dt><dd>每個作品一個 data.json</dd></div><div><dt>Token 保存</dt><dd>僅本次瀏覽器工作階段</dd></div></dl></section><section class="panel"><div class="panel-heading"><div><span class="panel-label">DISPLAY</span><h3>顯示設定</h3></div></div><dl class="settings-list"><div><dt>主題</dt><dd>跟隨系統</dd></div><div><dt>收藏檢視</dt><dd>卡片／清單</dd></div><div><dt>貨幣</dt><dd>TWD</dd></div><div><dt>版本</dt><dd data-version>${getVersion()}</dd></div></dl></section></div>`;
  const token = settings.querySelector('[data-token]');
  const state = settings.querySelector('[data-state]');
  const message = settings.querySelector('[data-message]');
  const connect = settings.querySelector('[data-connect]');
  const disconnect = settings.querySelector('[data-disconnect]');
  function render() {
    const connected = github.connected;
    state.textContent = connected ? '已連線' : '未連線';
    state.classList.toggle('received', connected);
    token.value = '';
    settings.querySelector('[data-version]')?.replaceChildren(document.createTextNode(getVersion()));
  }
  connect.onclick = async () => {
    const value = token.value.trim();
    if (!value) { message.textContent = '請先輸入 Token。'; message.dataset.kind = 'error'; return; }
    connect.disabled = true;
    message.textContent = '正在測試 GitHub 連線…';
    try {
      const result = await github.testConnection(value);
      message.textContent = `連線成功：${result.user} · ${result.repository}`;
      message.dataset.kind = 'success';
      render();
      window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: true } }));
    } catch (error) {
      github.clearToken();
      message.textContent = `連線失敗：${error.message}`;
      message.dataset.kind = 'error';
      render();
    } finally { connect.disabled = false; }
  };
  disconnect.onclick = () => { github.clearToken(); message.textContent = '已解除 GitHub 連線。'; message.dataset.kind = 'success'; render(); window.dispatchEvent(new CustomEvent('chi-merch:github', { detail: { connected: false } })); };
  window.addEventListener('chi-merch:version', render);
  render();
}

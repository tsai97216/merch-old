const STATUS_OPTIONS = [['received', '已收到'], ['pending', '待到貨'], ['preorder', '預購'], ['organizing', '待整理']];
const AFTER_SALES_OPTIONS = [['none', '無售後'], ['pending', '處理中'], ['completed', '已完成']];
const SHIPPING_OPTIONS = [['', '未設定'], ['宅配', '宅配'], ['超商取貨', '超商取貨'], ['集運', '集運'], ['現場取得', '現場取得']];

const value = (form, name) => form.elements[name]?.value?.trim() || '';
const money = (number) => `NT$ ${Number(number || 0).toLocaleString('zh-TW')}`;

function blankItem(workId) {
  const now = new Date().toISOString();
  return { id: '', title: '', series: '', characters: [], category: '', manufacturer: '', description: '', status: 'pending', images: [],
    purchase: { price: 0, currency: 'TWD', platform: '', date: '', url: '', orderId: '' },
    release: { date: '', expectedDate: '', receivedDate: '' }, shipping: { status: '', method: '', trackingNumber: '', note: '' },
    afterSales: { status: 'none', note: '', updatedAt: '' }, notes: '', createdAt: now, updatedAt: now, workId };
}
function escapeHtml(text) { return String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

export function createManagement({ management, store }) {
  if (!management || !store) return;
  management.innerHTML = `<div class="page-heading"><div><span class="eyebrow">04 / MANAGEMENT</span><h2>管理</h2><p>新增、編輯與整理收藏資料。</p></div><button class="button primary" type="button" data-new-item><i class="fa-solid fa-plus"></i> 新增收藏</button></div>
    <div class="management-status" data-management-status role="status"></div>
    <div class="management-layout"><section class="panel management-items"><div class="panel-heading"><div><span class="panel-label">COLLECTION</span><h3>收藏清單</h3></div><span class="muted" data-item-count></span></div><div class="management-list" data-management-list></div></section>
    <section class="panel management-editor"><div class="panel-heading"><div><span class="panel-label">ITEM FORM</span><h3 data-form-title>新增收藏</h3></div><button type="button" class="button danger" data-delete hidden><i class="fa-solid fa-trash"></i> 刪除</button></div>
    <form data-item-form novalidate><div class="form-grid">
      <label>作品<select name="workId" required></select></label><label>標題<input name="title" required placeholder="收藏名稱"></label><label>系列<input name="series" placeholder="作品系列／商品系列"></label><label>角色<input name="characters" placeholder="多個角色請用、分隔"></label><label>類型<input name="category" placeholder="模型、壓克力、徽章…"></label><label>製造商<input name="manufacturer" placeholder="製造商"></label>
      <label>狀態<select name="status">${STATUS_OPTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label><label>價格 <span class="field-hint">TWD</span><input name="price" type="number" min="0" step="1" inputmode="numeric" placeholder="0"></label><label>購買平台<input name="platform" placeholder="官方商城、蝦皮、淘寶…"></label><label>購買日期<input name="purchaseDate" type="date"></label><label>發售日期<input name="releaseDate" type="date"></label><label>預計到貨<input name="expectedDate" type="date"></label><label>收到日期<input name="receivedDate" type="date"></label>
      <label>物流方式<select name="shippingMethod">${SHIPPING_OPTIONS.map(([v, l]) => `<option value="${escapeHtml(v)}">${l}</option>`).join('')}</select></label><label>物流單號<input name="trackingNumber" placeholder="選填"></label><label>售後狀態<select name="afterSalesStatus">${AFTER_SALES_OPTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      <label class="full">商品描述<textarea name="description" placeholder="商品相關說明…"></textarea></label><label class="full">物流備註<textarea name="shippingNote" placeholder="物流或到貨補充…"></textarea></label><label class="full">售後備註<textarea name="afterSalesNote" placeholder="售後處理紀錄…"></textarea></label><label class="full">備註<textarea name="notes" placeholder="其他補充說明…"></textarea></label>
    </div><div class="form-actions"><span class="form-message" data-form-message></span><button class="button primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> 儲存資料</button></div></form></section></div>
    <div class="notice management-persistence"><i class="fa-solid fa-circle-info"></i><span>目前修改只存在本次頁面工作階段，尚未寫回 GitHub。完成本地 CRUD 後再接入 GitHub API。</span></div>`;

  const form = management.querySelector('[data-item-form]'), list = management.querySelector('[data-management-list]'), count = management.querySelector('[data-item-count]');
  const formTitle = management.querySelector('[data-form-title]'), deleteButton = management.querySelector('[data-delete]'), status = management.querySelector('[data-management-status]'), message = management.querySelector('[data-form-message]'), newButton = management.querySelector('[data-new-item]');
  let editingId = null;
  const setMessage = (text, kind = '') => { message.textContent = text; message.dataset.kind = kind; };
  function populateWorks(selected) { const select = form.elements.workId; select.innerHTML = store.works.map((work) => `<option value="${work.id}">${escapeHtml(work.name)}</option>`).join(''); if (selected) select.value = selected; }
  function fill(item) {
    populateWorks(item.workId);
    const fields = { title: item.title, series: item.series, characters: (item.characters || []).join('、'), category: item.category, manufacturer: item.manufacturer, status: item.status || 'pending', price: item.purchase?.price ?? 0, platform: item.purchase?.platform, purchaseDate: item.purchase?.date, releaseDate: item.release?.date, expectedDate: item.release?.expectedDate, receivedDate: item.release?.receivedDate, shippingMethod: item.shipping?.method, trackingNumber: item.shipping?.trackingNumber, afterSalesStatus: item.afterSales?.status || 'none', description: item.description, shippingNote: item.shipping?.note, afterSalesNote: item.afterSales?.note, notes: item.notes };
    Object.entries(fields).forEach(([name, fieldValue]) => { if (form.elements[name]) form.elements[name].value = fieldValue ?? ''; });
  }
  function startNew() { editingId = null; formTitle.textContent = '新增收藏'; deleteButton.hidden = true; fill(blankItem(store.works[0]?.id || '')); setMessage(''); status.textContent = '準備新增收藏'; form.elements.title.focus(); renderList(); }
  function edit(item) { if (!item) return; editingId = item.id; formTitle.textContent = '編輯收藏'; deleteButton.hidden = false; fill(item); setMessage(''); status.textContent = `正在編輯：${item.title}`; renderList(); }
  function renderList() {
    count.textContent = `${store.items.length} ITEMS`;
    if (!store.items.length) { list.innerHTML = '<div class="empty-state">目前沒有收藏資料。</div>'; return; }
    list.innerHTML = [...store.items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((item) => `<button type="button" class="management-item ${item.id === editingId ? 'is-active' : ''}" data-edit-id="${escapeHtml(item.id)}"><span class="management-item-main"><strong>${escapeHtml(item.title || '未命名收藏')}</strong><small>${escapeHtml(item.workName || '')} · ${escapeHtml(item.category || '其他')}</small></span><span class="management-item-price">${money(item.purchase?.price)}</span></button>`).join('');
    list.querySelectorAll('[data-edit-id]').forEach((button) => button.addEventListener('click', () => edit(store.getItem(button.dataset.editId))));
  }
  function validate() {
    const errors = [], price = Number(value(form, 'price')), purchaseDate = value(form, 'purchaseDate'), releaseDate = value(form, 'releaseDate'), receivedDate = value(form, 'receivedDate');
    if (!value(form, 'workId')) errors.push('請選擇作品'); if (!value(form, 'title')) errors.push('請輸入標題'); if (!Number.isFinite(price) || price < 0) errors.push('價格必須是 0 以上的數字');
    if (purchaseDate && releaseDate && releaseDate < purchaseDate) errors.push('發售日期不能早於購買日期'); if (receivedDate && purchaseDate && receivedDate < purchaseDate) errors.push('收到日期不能早於購買日期');
    if (form.elements.status.value === 'received' && !receivedDate) errors.push('狀態為「已收到」時請填寫收到日期'); return errors;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const errors = validate(); if (errors.length) { setMessage(errors[0], 'error'); return; }
    const existing = editingId ? store.getItem(editingId) : null, now = new Date().toISOString(), workId = value(form, 'workId');
    const next = { ...(existing || blankItem(workId)), id: existing?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, workId, title: value(form, 'title'), series: value(form, 'series'), characters: value(form, 'characters').split(/[、,，]/).map((item) => item.trim()).filter(Boolean), category: value(form, 'category'), manufacturer: value(form, 'manufacturer'), status: value(form, 'status'), description: value(form, 'description'), notes: value(form, 'notes'),
      purchase: { ...(existing?.purchase || {}), price: Number(value(form, 'price')) || 0, currency: 'TWD', platform: value(form, 'platform'), date: value(form, 'purchaseDate'), url: existing?.purchase?.url || '', orderId: existing?.purchase?.orderId || '' },
      release: { ...(existing?.release || {}), date: value(form, 'releaseDate'), expectedDate: value(form, 'expectedDate'), receivedDate: value(form, 'receivedDate') }, shipping: { ...(existing?.shipping || {}), status: value(form, 'status') === 'received' ? 'received' : 'pending', method: value(form, 'shippingMethod'), trackingNumber: value(form, 'trackingNumber'), note: value(form, 'shippingNote') }, afterSales: { ...(existing?.afterSales || {}), status: value(form, 'afterSalesStatus'), note: value(form, 'afterSalesNote'), updatedAt: now }, createdAt: existing?.createdAt || now, updatedAt: now };
    if (existing) store.updateItem(editingId, next); else { store.addItem(next); editingId = next.id; }
    formTitle.textContent = '編輯收藏'; deleteButton.hidden = false; setMessage('已更新本次工作階段資料。', 'success'); status.textContent = `已儲存：${next.title}`; renderList();
  });
  deleteButton.addEventListener('click', () => { if (!editingId) return; const item = store.getItem(editingId); if (!item || !window.confirm(`確定要刪除「${item.title}」嗎？`)) return; store.removeItem(editingId); editingId = null; setMessage('已刪除本次工作階段資料。', 'success'); status.textContent = '收藏已刪除'; startNew(); });
  newButton.addEventListener('click', startNew); store.subscribe(() => renderList()); startNew();
}

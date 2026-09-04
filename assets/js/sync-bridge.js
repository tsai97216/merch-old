import { github } from './github.js';

const value = (form, name) => form.elements[name]?.value?.trim() || '';
const setStatus = (management, text, kind = '') => {
  const status = management.querySelector('[data-management-status]');
  const message = management.querySelector('[data-form-message]');
  if (status) status.textContent = text;
  if (message) {
    message.textContent = text;
    message.dataset.kind = kind;
  }
};

function buildItem(form, old) {
  const now = new Date().toISOString();
  const workId = value(form, 'workId');
  return {
    ...(old || { id: '', images: [] }),
    id: old?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workId,
    title: value(form, 'title'),
    series: value(form, 'series'),
    characters: value(form, 'characters').split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
    category: value(form, 'category'),
    manufacturer: value(form, 'manufacturer'),
    status: value(form, 'status'),
    description: value(form, 'description'),
    notes: value(form, 'notes'),
    purchase: {
      ...(old?.purchase || {}),
      price: Number(value(form, 'price')) || 0,
      currency: 'TWD',
      platform: value(form, 'platform'),
      date: value(form, 'purchaseDate'),
      url: old?.purchase?.url || '',
      orderId: old?.purchase?.orderId || ''
    },
    release: {
      ...(old?.release || {}),
      date: value(form, 'releaseDate'),
      expectedDate: value(form, 'expectedDate'),
      receivedDate: value(form, 'receivedDate')
    },
    shipping: {
      ...(old?.shipping || {}),
      status: value(form, 'status') === 'received' ? 'received' : 'pending',
      method: value(form, 'shippingMethod'),
      trackingNumber: value(form, 'trackingNumber'),
      note: value(form, 'shippingNote')
    },
    afterSales: {
      ...(old?.afterSales || {}),
      status: value(form, 'afterSalesStatus'),
      note: value(form, 'afterSalesNote'),
      updatedAt: now
    },
    createdAt: old?.createdAt || now,
    updatedAt: now
  };
}

function validate(form) {
  const price = Number(value(form, 'price'));
  const purchaseDate = value(form, 'purchaseDate');
  const releaseDate = value(form, 'releaseDate');
  const receivedDate = value(form, 'receivedDate');
  if (!value(form, 'workId')) return '請選擇作品';
  if (!value(form, 'title')) return '請輸入標題';
  if (!Number.isFinite(price) || price < 0) return '價格必須是 0 以上的數字';
  if (purchaseDate && releaseDate && releaseDate < purchaseDate) return '發售日期不能早於購買日期';
  if (purchaseDate && receivedDate && receivedDate < purchaseDate) return '收到日期不能早於購買日期';
  if (value(form, 'status') === 'received' && !receivedDate) return '狀態為「已收到」時請填寫收到日期';
  return '';
}

export function attachSyncBridge(management, store) {
  if (!management || !store) return;

  management.addEventListener('submit', async (event) => {
    if (!github.connected) return;
    const form = event.target;
    if (!form.matches('[data-item-form]')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const error = validate(form);
    if (error) {
      setStatus(management, error, 'error');
      return;
    }

    const activeButton = management.querySelector('.management-item.is-active');
    const activeId = activeButton?.dataset.editId || null;
    const old = activeId ? store.getItem(activeId) : null;
    const next = buildItem(form, old);
    const oldWork = old ? store.getWork(old.workId) : null;
    const newWork = store.getWork(next.workId);
    const submitButton = form.querySelector('[type="submit"]');

    if (!newWork) {
      setStatus(management, '找不到指定作品。', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(management, '正在同步 GitHub…');
    try {
      if (old) {
        await github.syncUpdate(old, next, oldWork, newWork);
        store.updateItem(activeId, next);
      } else {
        await github.syncAdd(next, newWork);
        store.addItem(next);
      }
      setStatus(management, '已儲存並同步到 GitHub。', 'success');
    } catch (error) {
      setStatus(management, `同步失敗：${error.message}`, 'error');
    } finally {
      submitButton.disabled = false;
    }
  }, true);

  management.addEventListener('click', async (event) => {
    if (!github.connected) return;
    const button = event.target.closest('[data-delete]');
    if (!button || button.hidden) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const activeButton = management.querySelector('.management-item.is-active');
    const activeId = activeButton?.dataset.editId || null;
    const item = activeId ? store.getItem(activeId) : null;
    if (!item || !window.confirm(`確定要刪除「${item.title}」嗎？`)) return;

    const work = store.getWork(item.workId);
    if (!work) {
      setStatus(management, '找不到收藏所屬作品。', 'error');
      return;
    }

    button.disabled = true;
    setStatus(management, '正在同步刪除…');
    try {
      await github.syncDelete(item, work);
      store.removeItem(activeId);
      setStatus(management, '已刪除並同步到 GitHub。', 'success');
    } catch (error) {
      setStatus(management, `刪除失敗：${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  }, true);

  window.addEventListener('chi-merch:github', () => {
    const notice = management.querySelector('.management-persistence');
    if (notice) {
      notice.innerHTML = `<i class="fa-solid fa-circle-info"></i><span>${github.connected ? '已連線 GitHub。儲存與刪除會寫回對應作品的 data.json。' : '目前未連線 GitHub。修改只存在本次工作階段，請先到「設定」連線。'}</span>`;
    }
  });
}

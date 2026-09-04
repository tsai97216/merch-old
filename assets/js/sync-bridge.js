import { github } from './github.js?v=2.8.3';

const value = (form, name) => form.elements[name]?.value?.trim() || '';
const setStatus = (management, text, kind = '') => {
  const status = management.querySelector('[data-management-status]');
  const message = management.querySelector('[data-form-message]');
  if (status) status.textContent = text;
  if (message) { message.textContent = text; message.dataset.kind = kind; }
};

function buildItem(form, old) {
  const now = new Date().toISOString();
  const workId = value(form, 'workId');
  return {
    ...(old || { id: '', images: [] }), id: old?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, workId,
    title: value(form, 'title'), series: value(form, 'series'), characters: value(form, 'characters').split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
    category: value(form, 'category'), manufacturer: value(form, 'manufacturer'), status: value(form, 'status'), description: value(form, 'description'), notes: value(form, 'notes'),
    purchase: { ...(old?.purchase || {}), price: Number(value(form, 'price')) || 0, currency: 'TWD', platform: value(form, 'platform'), date: value(form, 'purchaseDate'), url: old?.purchase?.url || '', orderId: old?.purchase?.orderId || '' },
    release: { ...(old?.release || {}), date: value(form, 'releaseDate'), expectedDate: value(form, 'expectedDate'), receivedDate: value(form, 'receivedDate') },
    shipping: { ...(old?.shipping || {}), status: value(form, 'status') === 'received' ? 'received' : 'pending', method: value(form, 'shippingMethod'), trackingNumber: value(form, 'trackingNumber'), note: value(form, 'shippingNote') },
    afterSales: { ...(old?.afterSales || {}), status: value(form, 'afterSalesStatus'), note: value(form, 'afterSalesNote'), updatedAt: now },
    createdAt: old?.createdAt || now, updatedAt: now
  };
}

function validate(form) {
  const price = Number(value(form, 'price')), purchaseDate = value(form, 'purchaseDate'), releaseDate = value(form, 'releaseDate'), receivedDate = value(form, 'receivedDate');
  if (!value(form, 'workId')) return '請選擇作品'; if (!value(form, 'title')) return '請輸入標題'; if (!Number.isFinite(price) || price < 0) return '價格必須是 0 以上的數字';
  if (purchaseDate && releaseDate && releaseDate < purchaseDate) return '發售日期不能早於購買日期'; if (purchaseDate && receivedDate && receivedDate < purchaseDate) return '收到日期不能早於購買日期';
  if (value(form, 'status') === 'received' && !receivedDate) return '狀態為「已收到」時請填寫收到日期'; return '';
}

function imageId() { return `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function imageExtension(file) { const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }; return map[file.type] || 'bin'; }
function getActiveItem(management, store) {
  const id = management.querySelector('.management-item.is-active')?.dataset.editId;
  return id ? store.getItem(id) : null;
}

export function attachSyncBridge(management, store) {
  if (!management || !store) return;

  management.addEventListener('submit', async (event) => {
    if (!github.connected) return;
    const form = event.target;
    if (!form.matches('[data-item-form]')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const error = validate(form);
    if (error) { setStatus(management, error, 'error'); return; }
    const activeButton = management.querySelector('.management-item.is-active'), activeId = activeButton?.dataset.editId || null;
    const old = activeId ? store.getItem(activeId) : null, next = buildItem(form, old), oldWork = old ? store.getWork(old.workId) : null, newWork = store.getWork(next.workId), submitButton = form.querySelector('[type="submit"]');
    if (!newWork) { setStatus(management, '找不到指定作品。', 'error'); return; }
    submitButton.disabled = true; setStatus(management, '正在同步 GitHub…');
    try {
      if (old) { await github.syncUpdate(old, next, oldWork, newWork); store.updateItem(activeId, next); }
      else { await github.syncAdd(next); store.addItem(next); }
      setStatus(management, '已儲存並同步到 GitHub。', 'success');
    } catch (error) { setStatus(management, `同步失敗：${error.message}`, 'error'); }
    finally { submitButton.disabled = false; }
  }, true);

  management.addEventListener('click', async (event) => {
    if (!github.connected) return;
    const deleteButton = event.target.closest('[data-delete]');
    if (deleteButton && !deleteButton.hidden) {
      event.preventDefault(); event.stopImmediatePropagation();
      const item = getActiveItem(management, store);
      if (!item || !window.confirm(`確定要刪除「${item.title}」嗎？`)) return;
      deleteButton.disabled = true; setStatus(management, '正在同步刪除…');
      try { await github.syncDelete(item); store.removeItem(item.id); setStatus(management, '已刪除並同步到 GitHub。', 'success'); }
      catch (error) { setStatus(management, `刪除失敗：${error.message}`, 'error'); }
      finally { deleteButton.disabled = false; }
      return;
    }

    const coverButton = event.target.closest('[data-image-cover]');
    if (coverButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      const item = getActiveItem(management, store); if (!item) return;
      const id = coverButton.dataset.imageCover;
      const images = (item.images || []).map((image) => ({ ...image, isCover: image.id === id }));
      if (!images.some((image) => image.isCover)) return;
      const next = { ...item, images, updatedAt: new Date().toISOString() };
      coverButton.disabled = true; setStatus(management, '正在更新封面…');
      try { await github.syncUpdate(item, next, store.getWork(item.workId), store.getWork(item.workId)); store.updateItem(item.id, next); setStatus(management, '封面已更新。', 'success'); }
      catch (error) { setStatus(management, `封面更新失敗：${error.message}`, 'error'); }
      finally { coverButton.disabled = false; }
      return;
    }

    const imageDelete = event.target.closest('[data-image-delete]');
    if (imageDelete) {
      event.preventDefault(); event.stopImmediatePropagation();
      const item = getActiveItem(management, store); if (!item) return;
      const image = (item.images || []).find((entry, index) => (entry.id || String(index)) === imageDelete.dataset.imageDelete);
      if (!image || !window.confirm('確定要刪除這張圖片嗎？')) return;
      const nextImages = (item.images || []).filter((entry) => entry.id !== image.id);
      if (image.isCover && nextImages.length) nextImages[0] = { ...nextImages[0], isCover: true };
      const next = { ...item, images: nextImages, updatedAt: new Date().toISOString() };
      imageDelete.disabled = true; setStatus(management, '正在刪除圖片…');
      try {
        await github.syncUpdate(item, next, store.getWork(item.workId), store.getWork(item.workId));
        if (image.path && image.sha) await github.deleteFile(image.path, image.sha, `feat: delete image ${image.id || 'unknown'}`);
        await github.bumpImageVersion(1);
        store.updateItem(item.id, next); setStatus(management, '圖片已刪除並同步到 GitHub。', 'success');
      } catch (error) { setStatus(management, `圖片刪除失敗：${error.message}`, 'error'); }
      finally { imageDelete.disabled = false; }
    }
  }, true);

  management.addEventListener('change', async (event) => {
    if (!github.connected) return;
    const input = event.target.closest('[data-image-upload]');
    if (!input || !input.files?.length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const item = getActiveItem(management, store);
    if (!item) { setStatus(management, '請先選擇一筆收藏，再新增圖片。', 'error'); input.value = ''; return; }
    const work = store.getWork(item.workId);
    if (!work) { setStatus(management, '找不到收藏所屬作品。', 'error'); input.value = ''; return; }
    const files = [...input.files];
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) { setStatus(management, '只支援 JPG、PNG、WebP、GIF。', 'error'); input.value = ''; return; }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) { setStatus(management, '單張圖片不可超過 10 MB。', 'error'); input.value = ''; return; }
    input.disabled = true; setStatus(management, `正在上傳 ${files.length} 張圖片…`);
    try {
      const images = [...(item.images || [])];
      for (const file of files) {
        const id = imageId(), path = `data/${work.id}/images/${item.id}/${id}.${imageExtension(file)}`;
        const uploaded = await github.uploadImage({ path, file, message: `feat: add image ${item.id}` });
        images.push({ id, path, url: uploaded.url, sha: uploaded.sha, alt: item.title || '收藏圖片', isCover: images.length === 0 });
      }
      const next = { ...item, images, updatedAt: new Date().toISOString() };
      await github.syncUpdate(item, next, work, work);
      await github.bumpImageVersion(files.length);
      store.updateItem(item.id, next); setStatus(management, `已上傳 ${files.length} 張圖片並同步到 GitHub。`, 'success');
    } catch (error) { setStatus(management, `圖片上傳失敗：${error.message}`, 'error'); }
    finally { input.disabled = false; input.value = ''; }
  }, true);

  window.addEventListener('chi-merch:github', () => {
    const notice = management.querySelector('.management-persistence');
    if (notice) notice.innerHTML = `<i class="fa-solid fa-circle-info"></i><span>${github.connected ? '已連線 GitHub。儲存、刪除與圖片管理會寫回 GitHub。' : '目前未連線 GitHub。修改只存在本次工作階段，請先到「設定」連線。'}</span>`;
  });
}

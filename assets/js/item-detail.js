export function createItemDetail() {
  const modal = document.createElement('div');
  modal.className = 'item-detail-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="item-detail-backdrop" data-detail-close></div>
    <section class="item-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
      <button type="button" class="item-detail-close" aria-label="關閉" data-detail-close><i class="fa-solid fa-xmark"></i></button>
      <div class="item-detail-header">
        <div class="item-detail-image" id="item-detail-image">IMAGE</div>
        <div><span class="eyebrow">ITEM DETAIL</span><h2 id="item-detail-title"></h2><p id="item-detail-subtitle"></p><div id="item-detail-status"></div></div>
      </div>
      <div class="item-detail-grid">
        <section><span class="detail-label">基本資訊</span><dl><div><dt>作品</dt><dd id="detail-work"></dd></div><div><dt>角色</dt><dd id="detail-character"></dd></div><div><dt>類型</dt><dd id="detail-type"></dd></div><div><dt>製造商</dt><dd id="detail-manufacturer"></dd></div></dl></section>
        <section><span class="detail-label">購買資訊</span><dl><div><dt>價格</dt><dd id="detail-price"></dd></div><div><dt>平台</dt><dd id="detail-platform"></dd></div><div><dt>購買日期</dt><dd id="detail-purchase-date"></dd></div></dl></section>
        <section><span class="detail-label">發售與到貨</span><dl><div><dt>發售日期</dt><dd id="detail-release-date"></dd></div><div><dt>收到日期</dt><dd id="detail-received-date"></dd></div><div><dt>物流方式</dt><dd id="detail-shipping"></dd></div><div><dt>物流單號</dt><dd id="detail-tracking"></dd></div></dl></section>
        <section><span class="detail-label">售後</span><dl><div><dt>狀態</dt><dd id="detail-after-sales"></dd></div></dl></section>
      </div>
      <section class="item-detail-text"><div><span class="detail-label">商品描述</span><p id="detail-description"></p></div><div><span class="detail-label">備註</span><p id="detail-notes"></p></div></section>
      <div class="item-detail-footer"><span>建立：<b id="detail-created"></b></span><span>更新：<b id="detail-updated"></b></span></div>
    </section>`;
  document.body.appendChild(modal);

  const text = (id, value) => { const node = modal.querySelector(`#${id}`); if (node) node.textContent = value ?? '—'; };
  const dateText = (value) => value || '—';
  const money = (item) => item.purchase?.price == null ? '—' : `NT$ ${Number(item.purchase.price).toLocaleString('zh-TW')}`;
  const statusLabel = (status) => ({ received: '已收到', pending: '待到貨', preorder: '預購', organizing: '待整理' }[status] || status || '待整理');

  function open(item) {
    const characters = Array.isArray(item.characters) ? item.characters.join('、') : (item.character || '—');
    text('item-detail-title', item.title || '收藏詳細資訊');
    text('item-detail-subtitle', `${item.workName || item.series || '—'} · ${characters}`);
    text('detail-work', item.workName || item.series);
    text('detail-character', characters);
    text('detail-type', item.category);
    text('detail-manufacturer', item.manufacturer);
    text('detail-price', money(item));
    text('detail-platform', item.purchase?.platform);
    text('detail-purchase-date', dateText(item.purchase?.date));
    text('detail-release-date', dateText(item.release?.date || item.release?.expectedDate));
    text('detail-received-date', dateText(item.release?.receivedDate));
    text('detail-shipping', item.shipping?.method || item.shipping?.status);
    text('detail-tracking', item.shipping?.trackingNumber);
    text('detail-after-sales', item.afterSales?.status || '—');
    text('detail-description', item.description);
    text('detail-notes', item.notes);
    text('detail-created', dateText(item.createdAt));
    text('detail-updated', dateText(item.updatedAt));

    const status = modal.querySelector('#item-detail-status');
    status.innerHTML = `<span class="tag ${item.status === 'received' ? 'received' : 'pending'}">${statusLabel(item.status)}</span>`;

    const image = modal.querySelector('#item-detail-image');
    const cover = Array.isArray(item.images) ? item.images.find((entry) => entry.isCover) || item.images[0] : null;
    if (cover?.path) {
      image.innerHTML = `<img src="${cover.path}" alt="${cover.alt || item.title || ''}">`;
    } else {
      image.textContent = 'IMAGE';
    }

    modal.hidden = false;
    document.body.classList.add('detail-modal-open');
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove('detail-modal-open');
  }

  modal.querySelectorAll('[data-detail-close]').forEach((node) => node.addEventListener('click', close));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) close(); });

  return { open, close };
}

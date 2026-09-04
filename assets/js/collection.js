const statusLabel = (status) => ({ received: '已收到', pending: '待到貨', preorder: '預購', organizing: '待整理' }[status] || status || '待整理');
const priceOf = (item) => Number(item.purchase?.price) || 0;
const money = (value) => `NT$ ${value.toLocaleString('zh-TW')}`;
const text = (value) => value || '';

export function createCollection({ collection, items, works, detail }) {
  if (!collection) return { render() {} };
  const search = collection.querySelector('.collection-search');
  const filters = collection.querySelector('.collection-filters');
  const meta = collection.querySelector('.collection-meta');
  const cardsView = collection.querySelector('[data-collection-view="cards"]');
  const listView = collection.querySelector('[data-collection-view="list"]');
  if (!cardsView || !listView) return { render() {} };

  if (search) search.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="搜尋標題、作品、角色、備註…" aria-label="搜尋收藏">';
  const searchInput = search?.querySelector('input');
  const filterDefinitions = [
    ['work', '作品', works.map((work) => [work.id, work.name])],
    ['character', '角色', [...new Set(items.flatMap((item) => item.characters || []))].sort().map((value) => [value, value])],
    ['category', '類型', [...new Set(items.map((item) => item.category).filter(Boolean))].sort().map((value) => [value, value])],
    ['status', '狀態', [...new Set(items.map((item) => item.status).filter(Boolean))].map((value) => [value, statusLabel(value)])]
  ];
  if (filters) filters.innerHTML = filterDefinitions.map(([name, label, options]) => `<label class="select-placeholder"><span class="sr-only">${label}</span><select data-filter="${name}"><option value="">${label}</option>${options.map(([value, option]) => `<option value="${value}">${option}</option>`).join('')}</select></label>`).join('');

  const sort = collection.querySelector('.collection-actions .sort');
  if (sort) sort.innerHTML = '<select aria-label="排序" data-sort><option value="createdAt">排序：建立時間</option><option value="purchaseDate">排序：購買日期</option><option value="releaseDate">排序：發售日期</option><option value="price">排序：價格</option><option value="title">排序：名稱</option></select>';
  const sortSelect = collection.querySelector('[data-sort]');
  let view = 'cards';
  const state = { search: '', work: '', character: '', category: '', status: '', sort: 'createdAt' };

  function filteredItems() {
    const query = state.search.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = [item.title, item.workName, item.description, item.notes, ...(item.characters || [])].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!state.work || item.workId === state.work) && (!state.character || (item.characters || []).includes(state.character)) && (!state.category || item.category === state.category) && (!state.status || item.status === state.status);
    }).sort((a, b) => {
      if (state.sort === 'price') return priceOf(b) - priceOf(a);
      if (state.sort === 'title') return text(a.title).localeCompare(text(b.title), 'zh-Hant');
      const key = state.sort === 'purchaseDate' ? a.purchase?.date : state.sort === 'releaseDate' ? (a.release?.date || a.release?.expectedDate) : a.createdAt;
      const other = state.sort === 'purchaseDate' ? b.purchase?.date : state.sort === 'releaseDate' ? (b.release?.date || b.release?.expectedDate) : b.createdAt;
      return text(other).localeCompare(text(key));
    });
  }

  function imageMarkup(item, className) {
    const cover = item.images?.find((image) => image.isCover) || item.images?.[0];
    return `<div class="${className}">${cover?.path ? `<img src="${cover.path}" alt="${cover.alt || item.title || ''}">` : 'IMAGE'}</div>`;
  }
  function card(item) {
    const characters = (item.characters || []).join('、');
    return `<article class="item-card" data-item-id="${item.id}" tabindex="0" role="button">${imageMarkup(item, 'item-image')}<h4>${item.title}</h4><p>${item.workName}${characters ? ` · ${characters}` : ''}</p><div class="item-bottom"><span class="tag ${item.status === 'received' ? 'received' : 'pending'}">${statusLabel(item.status)}</span><b>${money(priceOf(item))}</b></div></article>`;
  }
  function row(item) {
    const characters = (item.characters || []).join('、');
    return `<article class="collection-list-row" data-item-id="${item.id}" tabindex="0" role="button">${imageMarkup(item, 'list-image')}<div class="list-main"><h4>${item.title}</h4><p>${item.workName}${characters ? ` · ${characters}` : ''}</p></div><span class="tag ${item.status === 'received' ? 'received' : 'pending'}">${statusLabel(item.status)}</span><span class="list-type">${item.category || '其他'}</span><strong>${money(priceOf(item))}</strong></article>`;
  }
  function bindDetails(root) {
    root.querySelectorAll('[data-item-id]').forEach((node) => {
      const item = items.find((entry) => entry.id === node.dataset.itemId);
      if (!item) return;
      node.addEventListener('click', () => detail.open(item));
      node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); detail.open(item); } });
    });
  }
  function render() {
    const result = filteredItems();
    const cards = cardsView.querySelector('.collection-grid');
    const list = listView.querySelector('.collection-list');
    if (cards) cards.innerHTML = result.length ? result.map(card).join('') : '<div class="empty-state">找不到符合條件的收藏。</div>';
    if (list) list.innerHTML = result.length ? result.map(row).join('') : '<div class="empty-state">找不到符合條件的收藏。</div>';
    bindDetails(cardsView); bindDetails(listView);
    const count = meta?.querySelector(':scope > span');
    if (count) count.textContent = `${result.length} ITEMS`;
    const summary = collection.querySelector('.collection-summary strong');
    if (summary) summary.textContent = result.length;
  }

  searchInput?.addEventListener('input', (event) => { state.search = event.target.value; render(); });
  filters?.querySelectorAll('[data-filter]').forEach((select) => select.addEventListener('change', (event) => { state[event.target.dataset.filter] = event.target.value; render(); }));
  sortSelect?.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  collection.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    view = button.dataset.view;
    collection.querySelectorAll('[data-view]').forEach((node) => { const active = node === button; node.classList.toggle('is-active', active); node.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    cardsView.hidden = view !== 'cards'; listView.hidden = view !== 'list';
  }));
  render();
  return { render };
}

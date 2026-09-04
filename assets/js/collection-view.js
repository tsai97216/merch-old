document.addEventListener('DOMContentLoaded', () => {
  const VERSION = 'v1.15.0';

  document.querySelectorAll('.sidebar-footer span:last-child, #settings dd, .footer span:last-child').forEach((element) => {
    if (/^v\d+\.\d+\.\d+$/.test(element.textContent.trim())) element.textContent = VERSION;
  });

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href.includes('/assets/css/style.css') || link.href.includes('/assets/css/pages.css')) {
      const url = new URL(link.href, window.location.href);
      url.searchParams.set('v', VERSION.slice(1));
      link.href = url.href;
    }
  });

  const collection = document.querySelector('#collection');
  if (collection) {
    const buttons = collection.querySelectorAll('[data-view]');
    const views = collection.querySelectorAll('[data-collection-view]');
    buttons.forEach((button) => button.addEventListener('click', () => {
      const view = button.dataset.view;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      views.forEach((panel) => { panel.hidden = panel.dataset.collectionView !== view; });
    }));

    const details = {
      '流螢 1/7 比例模型': { work: '崩壞：星穹鐵道', character: '流螢', type: '模型', manufacturer: '示範製造商', status: '已收到', price: 'NT$ 3,200', platform: '官方商城', purchaseDate: '2026-06-12', releaseDate: '2026-08', receivedDate: '2026-08-24', shipping: '宅配', tracking: '—', afterSales: '無', description: '流螢 1/7 比例收藏模型。', notes: '示範資料，之後由作品資料庫提供完整內容。', createdAt: '2026-06-12', updatedAt: '2026-08-24' },
      '銀狼系列周邊': { work: '崩壞：星穹鐵道', character: '銀狼', type: '其他', manufacturer: '示範製造商', status: '待整理', price: 'NT$ 980', platform: '淘寶', purchaseDate: '2026-07-03', releaseDate: '2026-09', receivedDate: '—', shipping: '集運', tracking: '—', afterSales: '無', description: '銀狼系列周邊收藏。', notes: '待補充商品規格與圖片。', createdAt: '2026-07-03', updatedAt: '2026-07-03' },
      '妮可掛軸': { work: '絕區零', character: '妮可', type: '掛軸', manufacturer: '示範製造商', status: '預購', price: 'NT$ 1,280', platform: '官方商城', purchaseDate: '2026-08-10', releaseDate: '2026-10', receivedDate: '—', shipping: '待出貨', tracking: '—', afterSales: '無', description: '妮可主題掛軸。', notes: '預購商品，等待發售。', createdAt: '2026-08-10', updatedAt: '2026-08-10' },
      '今汐壓克力立牌': { work: '鳴潮', character: '今汐', type: '壓克力', manufacturer: '示範製造商', status: '已收到', price: 'NT$ 450', platform: '蝦皮', purchaseDate: '2026-08-02', releaseDate: '2026-08', receivedDate: '2026-08-18', shipping: '超商取貨', tracking: '—', afterSales: '無', description: '今汐主題壓克力立牌。', notes: '—', createdAt: '2026-08-02', updatedAt: '2026-08-18' },
      '芙寧娜徽章組': { work: '原神', character: '芙寧娜', type: '徽章', manufacturer: '示範製造商', status: '已收到', price: 'NT$ 320', platform: '同人展', purchaseDate: '2026-08-16', releaseDate: '2026-08', receivedDate: '2026-08-16', shipping: '現場取得', tracking: '—', afterSales: '無', description: '芙寧娜主題徽章組。', notes: '—', createdAt: '2026-08-16', updatedAt: '2026-08-16' },
      '示範收藏': { work: '作品', character: '角色', type: '其他', manufacturer: '—', status: '待整理', price: 'NT$ 680', platform: '—', purchaseDate: '—', releaseDate: '—', receivedDate: '—', shipping: '—', tracking: '—', afterSales: '—', description: '用於展示詳細資訊介面的示範資料。', notes: '之後替換為正式收藏資料。', createdAt: '—', updatedAt: '—' }
    };

    const modal = document.createElement('div');
    modal.className = 'item-detail-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="item-detail-backdrop" data-detail-close></div>
      <section class="item-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
        <button type="button" class="item-detail-close" aria-label="關閉" data-detail-close><i class="fa-solid fa-xmark"></i></button>
        <div class="item-detail-header"><div class="item-detail-image" id="item-detail-image">IMAGE</div><div><span class="eyebrow">ITEM DETAIL</span><h2 id="item-detail-title"></h2><p id="item-detail-subtitle"></p><div id="item-detail-status"></div></div></div>
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

    const setText = (id, value) => { const el = modal.querySelector(`#${id}`); if (el) el.textContent = value || '—'; };
    const openDetail = (card) => {
      const title = card.querySelector('h4')?.textContent.trim();
      const item = details[title] || { work: '—', character: '—', type: '—', manufacturer: '—', status: '待整理', price: '—', platform: '—', purchaseDate: '—', releaseDate: '—', receivedDate: '—', shipping: '—', tracking: '—', afterSales: '—', description: '尚未建立詳細資料。', notes: '可在管理頁補充。', createdAt: '—', updatedAt: '—' };
      setText('item-detail-title', title || '收藏詳細資訊');
      setText('item-detail-subtitle', `${item.work} · ${item.character}`);
      setText('detail-work', item.work); setText('detail-character', item.character); setText('detail-type', item.type); setText('detail-manufacturer', item.manufacturer);
      setText('detail-price', item.price); setText('detail-platform', item.platform); setText('detail-purchase-date', item.purchaseDate);
      setText('detail-release-date', item.releaseDate); setText('detail-received-date', item.receivedDate); setText('detail-shipping', item.shipping); setText('detail-tracking', item.tracking); setText('detail-after-sales', item.afterSales);
      setText('detail-description', item.description); setText('detail-notes', item.notes); setText('detail-created', item.createdAt); setText('detail-updated', item.updatedAt);
      const status = modal.querySelector('#item-detail-status');
      status.innerHTML = `<span class="tag ${item.status === '已收到' ? 'received' : 'pending'}">${item.status}</span>`;
      modal.hidden = false;
      document.body.classList.add('detail-modal-open');
    };
    const closeDetail = () => { modal.hidden = true; document.body.classList.remove('detail-modal-open'); };
    document.querySelectorAll('#home .item-card, #collection .item-card, #collection .collection-list-row').forEach((item) => {
      item.setAttribute('role', 'button'); item.setAttribute('tabindex', '0');
      item.addEventListener('click', () => openDetail(item));
      item.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(item); } });
    });
    modal.querySelectorAll('[data-detail-close]').forEach((button) => button.addEventListener('click', closeDetail));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeDetail(); });
  }

  const statistics = document.querySelector('#statistics');
  if (!statistics) return;
  const overview = statistics.querySelector('.stats-overview');
  const chartArea = statistics.querySelector('.two-column');
  if (!overview || !chartArea) return;

  const works = [
    { name: '崩壞：星穹鐵道', count: 42, received: 34, pending: 8, spending: '32,500', month: '5,280', year: '21,640', characters: [['流螢',16],['銀狼',9],['昔漣',7],['遐蝶',5]], categories: [['模型',18],['壓克力',11],['徽章',7],['其他',6]] },
    { name: '原神', count: 25, received: 23, pending: 2, spending: '16,420', month: '2,180', year: '11,360', characters: [['芙寧娜',8],['胡桃',5],['甘雨',4],['妮露',3]], categories: [['模型',8],['壓克力',7],['徽章',6],['其他',4]] },
    { name: '絕區零', count: 31, received: 22, pending: 9, spending: '21,800', month: '3,640', year: '14,520', characters: [['妮可',9],['朱鳶',7],['艾蓮',6],['星見雅',4]], categories: [['模型',10],['壓克力',8],['徽章',7],['其他',6]] },
    { name: '鳴潮', count: 18, received: 15, pending: 3, spending: '10,700', month: '1,580', year: '7,420', characters: [['今汐',6],['長離',4],['吟霖',3],['守岸人',2]], categories: [['模型',6],['壓克力',5],['徽章',4],['其他',3]] }
  ];
  const renderPie = (container, data, label, colors) => { const total = data.reduce((sum, item) => sum + item[1], 0); let angle = 0; const stops = data.map((item, index) => { const next = angle + item[1] / total * 360; const stop = `${colors[index % colors.length]} ${angle}deg ${next}deg`; angle = next; return stop; }); container.style.background = `conic-gradient(${stops.join(', ')})`; container.setAttribute('role', 'img'); container.setAttribute('aria-label', label); };
  const renderAll = () => {
    overview.style.display = 'grid';
    overview.innerHTML = `<article class="stat-card"><span>COLLECTION</span><strong>128</strong><small>收藏件數</small></article><article class="stat-card"><span>RECEIVED</span><strong>104</strong><small>已收到</small></article><article class="stat-card"><span>PENDING</span><strong>24</strong><small>尚未收到</small></article><article class="stat-card"><span>TOTAL SPENDING</span><strong>NT$ 86,420</strong><small>全部收藏</small></article><article class="stat-card"><span>THIS MONTH</span><strong>NT$ 12,680</strong><small>本月花費</small></article><article class="stat-card"><span>THIS YEAR</span><strong>NT$ 58,240</strong><small>今年花費</small></article>`;
    chartArea.style.display = 'grid';
    chartArea.innerHTML = `<section class="panel"><div class="panel-heading"><div><span class="panel-label">MONTHLY</span><h3>每月新增</h3></div><span class="muted">2026</span></div><div class="chart-placeholder"><i style="height:35%"></i><i style="height:48%"></i><i style="height:42%"></i><i style="height:62%"></i><i style="height:54%"></i><i style="height:76%"></i><i style="height:68%"></i><i style="height:88%"></i><i style="height:72%"></i><i style="height:92%"></i><i style="height:82%"></i><i style="height:66%"></i></div><div class="chart-labels"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span></div></section><section class="panel category-panel"><div class="panel-heading"><div><span class="panel-label">BY WORK</span><h3>作品分布</h3></div><i class="fa-solid fa-chart-pie"></i></div><div class="category-chart"><div class="category-pie work-distribution-pie"></div><div class="category-legend">${works.map((work, index) => `<div><i class="legend-dot stat-work-${index}"></i><span>${work.name}</span><b>${work.count}</b></div>`).join('')}</div></div></section><section class="panel category-panel"><div class="panel-heading"><div><span class="panel-label">CATEGORY</span><h3>類型分布</h3></div><i class="fa-solid fa-chart-pie"></i></div><div class="category-chart"><div class="category-pie category-distribution-pie"></div><div class="category-legend"><div><i class="legend-dot model"></i><span>模型</span><b>46</b></div><div><i class="legend-dot acrylic"></i><span>壓克力</span><b>31</b></div><div><i class="legend-dot badge"></i><span>徽章</span><b>24</b></div><div><i class="legend-dot other"></i><span>其他</span><b>27</b></div></div></div></section>`;
    renderPie(chartArea.querySelector('.work-distribution-pie'), works.map((work) => [work.name, work.count]), '作品分布圓餅圖', ['var(--accent)', '#6f8fdc', '#8da7d7', '#b9c7dc']);
    renderPie(chartArea.querySelector('.category-distribution-pie'), [['模型',46],['壓克力',31],['徽章',24],['其他',27]], '類型分布圓餅圖', ['var(--accent)', '#6f8fdc', '#8da7d7', '#b9c7dc']);
  };
  const tabs = document.createElement('div'); tabs.className = 'stats-work-tabs'; tabs.setAttribute('role', 'tablist'); tabs.innerHTML = ['全部', ...works.map((work) => work.name)].map((name, i) => `<button type="button" role="tab" aria-selected="${i === 0}" class="stats-work-tab${i === 0 ? ' is-active' : ''}" data-work-index="${i - 1}">${name}</button>`).join(''); overview.before(tabs);
  const renderWork = (work) => { if (!work) return; overview.style.display = 'grid'; overview.innerHTML = `<article class="stat-card"><span>COLLECTION</span><strong>${work.count}</strong><small>收藏件數</small></article><article class="stat-card"><span>RECEIVED</span><strong>${work.received}</strong><small>已收到</small></article><article class="stat-card"><span>PENDING</span><strong>${work.pending}</strong><small>尚未收到</small></article><article class="stat-card"><span>TOTAL SPENDING</span><strong>NT$ ${work.spending}</strong><small>${work.name}</small></article><article class="stat-card"><span>THIS MONTH</span><strong>NT$ ${work.month}</strong><small>本月花費</small></article><article class="stat-card"><span>THIS YEAR</span><strong>NT$ ${work.year}</strong><small>今年花費</small></article>`; chartArea.style.display = 'grid'; chartArea.innerHTML = `<section class="panel"><div class="panel-heading"><div><span class="panel-label">CHARACTERS</span><h3>${work.name} · 角色排行</h3></div><i class="fa-solid fa-ranking-star"></i></div><ol class="ranking stats-ranking">${work.characters.map((x, i) => `<li><span>0${i + 1}</span><strong>${x[0]}</strong><b>${x[1]}</b></li>`).join('')}</ol></section><section class="panel category-panel"><div class="panel-heading"><div><span class="panel-label">CATEGORY</span><h3>類型分布</h3></div><i class="fa-solid fa-chart-pie"></i></div><div class="category-chart"><div class="category-pie work-stat-pie"></div><div class="category-legend">${work.categories.map((x, i) => `<div><i class="legend-dot stat-cat-${i}"></i><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div></section>`; renderPie(chartArea.querySelector('.work-stat-pie'), work.categories, `${work.name} 類型分布`, ['var(--accent)', '#6f8fdc', '#8da7d7', '#b9c7dc']); };
  tabs.querySelectorAll('.stats-work-tab').forEach((tab) => tab.addEventListener('click', () => { tabs.querySelectorAll('.stats-work-tab').forEach((item) => { const active = item === tab; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', active ? 'true' : 'false'); }); const index = Number(tab.dataset.workIndex); if (index >= 0) renderWork(works[index]); else renderAll(); }));
  renderAll();
});

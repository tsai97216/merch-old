document.addEventListener('DOMContentLoaded', () => {
  const VERSION = 'v1.12.0';

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

  const tabs = document.createElement('div');
  tabs.className = 'stats-work-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = ['全部', ...works.map((work) => work.name)].map((name, i) => `<button type="button" role="tab" aria-selected="${i === 0}" class="stats-work-tab${i === 0 ? ' is-active' : ''}" data-work-index="${i - 1}">${name}</button>`).join('');
  overview.before(tabs);

  const renderWork = (work) => {
    if (!work) return;
    overview.style.display = 'grid';
    overview.innerHTML = `
      <article class="stat-card"><span>COLLECTION</span><strong>${work.count}</strong><small>收藏件數</small></article>
      <article class="stat-card"><span>RECEIVED</span><strong>${work.received}</strong><small>已收到</small></article>
      <article class="stat-card"><span>PENDING</span><strong>${work.pending}</strong><small>尚未收到</small></article>
      <article class="stat-card"><span>TOTAL SPENDING</span><strong>NT$ ${work.spending}</strong><small>${work.name}</small></article>
      <article class="stat-card"><span>THIS MONTH</span><strong>NT$ ${work.month}</strong><small>本月花費</small></article>
      <article class="stat-card"><span>THIS YEAR</span><strong>NT$ ${work.year}</strong><small>今年花費</small></article>`;
    chartArea.style.display = 'grid';
    chartArea.innerHTML = `
      <section class="panel"><div class="panel-heading"><div><span class="panel-label">CHARACTERS</span><h3>${work.name} · 角色排行</h3></div><i class="fa-solid fa-ranking-star"></i></div>
      <ol class="ranking stats-ranking">${work.characters.map((x, i) => `<li><span>0${i + 1}</span><strong>${x[0]}</strong><b>${x[1]}</b></li>`).join('')}</ol></section>
      <section class="panel category-panel"><div class="panel-heading"><div><span class="panel-label">CATEGORY</span><h3>類型分布</h3></div><i class="fa-solid fa-chart-pie"></i></div>
      <div class="category-chart"><div class="category-pie work-stat-pie" role="img" aria-label="${work.name} 類型分布"></div><div class="category-legend">${work.categories.map((x, i) => `<div><i class="legend-dot stat-cat-${i}"></i><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div></section>`;
    const total = work.categories.reduce((sum, x) => sum + x[1], 0);
    let angle = 0;
    const colors = ['var(--accent)', '#6f8fdc', '#8da7d7', '#b9c7dc'];
    const stops = work.categories.map((x, i) => { const next = angle + x[1] / total * 360; const value = `${colors[i]} ${angle}deg ${next}deg`; angle = next; return value; });
    chartArea.querySelector('.work-stat-pie').style.background = `conic-gradient(${stops.join(', ')})`;
  };

  tabs.querySelectorAll('.stats-work-tab').forEach((tab) => tab.addEventListener('click', () => {
    tabs.querySelectorAll('.stats-work-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const index = Number(tab.dataset.workIndex);
    if (index >= 0) renderWork(works[index]);
    else location.reload();
  }));

  const categoryPie = statistics.querySelector('.category-pie');
  if (categoryPie) categoryPie.setAttribute('role', 'img');
});

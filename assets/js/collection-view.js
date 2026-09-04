document.addEventListener('DOMContentLoaded', () => {
  const collection = document.querySelector('#collection');
  if (collection) {
    const buttons = collection.querySelectorAll('[data-view]');
    const views = collection.querySelectorAll('[data-collection-view]');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.view;
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        views.forEach((panel) => {
          panel.hidden = panel.dataset.collectionView !== view;
        });
      });
    });
  }

  const statistics = document.querySelector('#statistics');
  const grid = statistics?.querySelector('.stat-grid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.stat-card');
  const averageCard = Array.from(cards).find((card) => card.querySelector('span')?.textContent.trim() === 'AVERAGE');

  if (averageCard) {
    averageCard.querySelector('span').textContent = 'THIS MONTH';
    averageCard.querySelector('strong').textContent = '12,680';
    averageCard.querySelector('small').textContent = '本月花費 · TWD';
  }

  const yearlyCard = document.createElement('article');
  yearlyCard.className = 'stat-card';
  yearlyCard.innerHTML = '<span>THIS YEAR</span><strong>58,240</strong><small>今年花費 · TWD</small>';
  grid.appendChild(yearlyCard);

  const categoryPie = statistics.querySelector('.category-pie');
  if (categoryPie) {
    categoryPie.style.background = 'conic-gradient(var(--accent) 0deg 129.375deg, #6f8fdc 129.375deg 216.5625deg, #8da7d7 216.5625deg 284.0625deg, #b9c7dc 284.0625deg 360deg)';
    categoryPie.setAttribute('role', 'img');
  }

  const categoryLegend = statistics.querySelector('.category-legend');
  const workPanel = document.createElement('section');
  workPanel.className = 'panel category-panel work-distribution-panel';
  workPanel.innerHTML = `
    <div class="panel-heading">
      <div><span class="panel-label">WORKS</span><h3>作品分布</h3></div>
      <i class="fa-solid fa-layer-group"></i>
    </div>
    <div class="category-chart">
      <div class="category-pie work-pie" role="img" aria-label="作品分布圓餅圖"></div>
      <div class="category-legend work-legend" aria-label="作品分布圖例">
        <div><i class="legend-dot work-1"></i><span>崩壞：星穹鐵道</span><b>42</b></div>
        <div><i class="legend-dot work-2"></i><span>絕區零</span><b>31</b></div>
        <div><i class="legend-dot work-3"></i><span>原神</span><b>25</b></div>
        <div><i class="legend-dot work-4"></i><span>鳴潮</span><b>18</b></div>
      </div>
    </div>`;

  const workPie = workPanel.querySelector('.work-pie');
  workPie.style.background = 'conic-gradient(var(--accent) 0deg 130.3448deg, #6f8fdc 130.3448deg 226.5517deg, #8da7d7 226.5517deg 304.1379deg, #b9c7dc 304.1379deg 360deg)';

  const twoColumns = statistics.querySelector('.two-column');
  if (twoColumns && !statistics.querySelector('.work-distribution-panel')) {
    twoColumns.appendChild(workPanel);
  }

  document.querySelectorAll('.sidebar-footer span:last-child, #settings dd, .footer span:last-child').forEach((element) => {
    if (element.textContent.trim() === 'v1.7.0') element.textContent = 'v1.9.0';
  });
});

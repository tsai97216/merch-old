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

  document.querySelectorAll('.sidebar-footer span:last-child, #settings dd, .footer span:last-child').forEach((element) => {
    if (element.textContent.trim() === 'v1.7.0') element.textContent = 'v1.8.0';
  });
});
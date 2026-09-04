document.addEventListener('DOMContentLoaded', () => {
  const statistics = document.querySelector('#statistics');
  if (!statistics) return;

  const grid = statistics.querySelector('.stat-grid');
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

  document.querySelectorAll('.sidebar-footer span:last-child, #settings dd').forEach((element) => {
    if (element.textContent.trim() === 'v1.7.0') element.textContent = 'v1.8.0';
  });
  const footerVersion = document.querySelector('.footer span:last-child');
  if (footerVersion?.textContent.trim() === 'v1.7.0') footerVersion.textContent = 'v1.8.0';
});
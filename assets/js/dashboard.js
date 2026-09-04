const received = (item) => item.status === 'received';
const priceOf = (item) => Number(item.purchase?.price) || 0;
const dateOf = (item) => item.purchase?.date ? new Date(`${item.purchase.date}T00:00:00`) : null;
const money = (value) => `NT$ ${value.toLocaleString('zh-TW')}`;

export function createDashboard({ home, items, works, detail }) {
  if (!home) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const total = items.length;
  const receivedCount = items.filter(received).length;
  const pendingCount = total - receivedCount;
  const monthSpending = items.filter((item) => item.purchase?.date?.startsWith(monthKey)).reduce((sum, item) => sum + priceOf(item), 0);
  const totalSpending = items.reduce((sum, item) => sum + priceOf(item), 0);

  const cards = home.querySelector('.card-grid');
  const recent = [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8);
  if (cards) {
    cards.innerHTML = recent.length ? recent.map((item) => {
      const character = Array.isArray(item.characters) ? item.characters.join('、') : '';
      return `<article class="item-card" data-item-id="${item.id}" tabindex="0" role="button"><div class="item-image">IMAGE</div><h4>${item.title}</h4><p>${item.workName}${character ? ` · ${character}` : ''}</p><div class="item-bottom"><span class="tag ${item.status === 'received' ? 'received' : 'pending'}">${item.status === 'received' ? '已收到' : item.status === 'preorder' ? '預購' : item.status === 'pending' ? '待到貨' : '待整理'}</span><b>${money(priceOf(item))}</b></div></article>`;
    }).join('') : '<div class="empty-state">目前尚無收藏資料。</div>';
    cards.querySelectorAll('[data-item-id]').forEach((card) => {
      const item = items.find((entry) => entry.id === card.dataset.itemId);
      card.addEventListener('click', () => detail.open(item));
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); detail.open(item); } });
    });
  }

  const statCards = home.querySelectorAll('.stat-grid .stat-card');
  if (statCards.length >= 4) {
    statCards[0].querySelector('strong').textContent = receivedCount;
    statCards[0].querySelector('small').textContent = '已收到';
    statCards[1].querySelector('strong').textContent = pendingCount;
    statCards[1].querySelector('small').textContent = '含預購';
    statCards[2].querySelector('strong').textContent = money(monthSpending);
    statCards[2].querySelector('small').textContent = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
    statCards[3].querySelector('strong').textContent = money(totalSpending);
    statCards[3].querySelector('small').textContent = '目前資料';
  }

  const bars = home.querySelector('.bars');
  if (bars) {
    const workCounts = works.map((work) => ({ ...work, count: items.filter((item) => item.workId === work.id).length })).sort((a, b) => b.count - a.count);
    const max = Math.max(...workCounts.map((work) => work.count), 1);
    bars.innerHTML = workCounts.map((work) => `<div class="bar-row"><div><span>${work.name}</span><b>${work.count}</b></div><i style="width:${work.count / max * 100}%"></i></div>`).join('');
  }

  const ranking = home.querySelector('.ranking');
  if (ranking) {
    const counts = {};
    items.flatMap((item) => Array.isArray(item.characters) ? item.characters : []).forEach((character) => { counts[character] = (counts[character] || 0) + 1; });
    ranking.innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count], index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><strong>${name}</strong><b>${count}</b></li>`).join('') || '<li><span>--</span><strong>尚無資料</strong><b>0</b></li>';
  }
}

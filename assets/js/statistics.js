const STATUS_RECEIVED = 'received';

const toDate = (value) => value ? new Date(`${value}T00:00:00`) : null;
const priceOf = (item) => Number(item.purchase?.price) || 0;
const isReceived = (item) => item.status === STATUS_RECEIVED;
const monthKey = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : null;

function summarize(items, now = new Date()) {
  const total = items.length;
  const received = items.filter(isReceived).length;
  const pending = total - received;
  const totalSpending = items.reduce((sum, item) => sum + priceOf(item), 0);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYear = now.getFullYear();
  const thisMonth = items.filter((item) => monthKey(toDate(item.purchase?.date)) === currentMonth).reduce((sum, item) => sum + priceOf(item), 0);
  const thisYear = items.filter((item) => toDate(item.purchase?.date)?.getFullYear() === currentYear).reduce((sum, item) => sum + priceOf(item), 0);

  const counts = (values) => values.reduce((map, value) => { if (!value) return map; map[value] = (map[value] || 0) + 1; return map; }, {});
  const characters = counts(items.flatMap((item) => Array.isArray(item.characters) ? item.characters : []));
  const categories = counts(items.map((item) => item.category));
  const platforms = counts(items.map((item) => item.purchase?.platform));

  const monthly = Array.from({ length: 12 }, (_, index) => {
    const key = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
    const inMonth = items.filter((item) => monthKey(toDate(item.purchase?.date)) === key);
    return { month: index + 1, count: inMonth.length, spending: inMonth.reduce((sum, item) => sum + priceOf(item), 0) };
  });

  return { total, received, pending, totalSpending, thisMonth, thisYear, characters, categories, platforms, monthly };
}

const sortedEntries = (map) => Object.entries(map).sort((a, b) => b[1] - a[1]);
const money = (value) => `NT$ ${value.toLocaleString('zh-TW')}`;

function pieStyle(entries) {
  if (!entries.length) return 'conic-gradient(#d9dde5 0 360deg)';
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const palette = ['#356ae6', '#7b61ff', '#17a673', '#f59e0b', '#ef5b6f', '#8c98a8'];
  let angle = 0;
  return `conic-gradient(${entries.map(([label, value], index) => { const end = angle + value / total * 360; const segment = `${palette[index % palette.length]} ${angle}deg ${end}deg`; angle = end; return segment; }).join(', ')})`;
}

function renderPiePanel(title, entries) {
  const rows = entries.slice(0, 6).map(([label, value], index) => `<div><i class="legend-dot c${index}"></i><span>${label}</span><b>${value}</b></div>`).join('');
  return `<section class="panel category-panel"><div class="panel-heading"><div><span class="panel-label">${title === '類型分布' ? 'CATEGORY' : 'CHARACTERS'}</span><h3>${title}</h3></div><i class="fa-solid fa-chart-pie"></i></div><div class="category-chart"><div class="category-pie" data-pie></div><div class="category-legend">${rows || '<div><span>尚無資料</span></div>'}</div></div></section>`;
}

export function createStatistics({ statistics, works, items }) {
  if (!statistics) return;
  const overview = statistics.querySelector('.stats-overview');
  const chartArea = statistics.querySelector('.two-column');
  if (!overview || !chartArea) return;

  let activeWork = 'all';
  const tabs = document.createElement('div');
  tabs.className = 'statistics-work-tabs';
  tabs.innerHTML = `<button class="is-active" data-work="all">全部</button>${works.map((work) => `<button data-work="${work.id}">${work.name}</button>`).join('')}`;
  statistics.querySelector('.page-heading')?.after(tabs);

  function render() {
    const selectedItems = activeWork === 'all' ? items : items.filter((item) => item.workId === activeWork);
    const summary = summarize(selectedItems);
    overview.innerHTML = [
      ['COLLECTION', summary.total, '收藏件數'],
      ['RECEIVED', summary.received, '已收到'],
      ['PENDING', summary.pending, '尚未收到'],
      ['TOTAL SPENDING', money(summary.totalSpending), '全部收藏'],
      ['THIS MONTH', money(summary.thisMonth), '本月花費'],
      ['THIS YEAR', money(summary.thisYear), '今年花費']
    ].map(([label, value, note]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');

    const maxCount = Math.max(...summary.monthly.map((entry) => entry.count), 1);
    chartArea.innerHTML = `
      <section class="panel"><div class="panel-heading"><div><span class="panel-label">MONTHLY</span><h3>每月新增</h3></div><span class="muted">${new Date().getFullYear()}</span></div><div class="chart-placeholder">${summary.monthly.map((entry) => `<i style="height:${Math.max(4, entry.count / maxCount * 100)}%" title="${entry.month} 月：${entry.count} 件"></i>`).join('')}</div><div class="chart-labels">${summary.monthly.map((entry) => `<span>${entry.month}</span>`).join('')}</div></section>
      ${renderPiePanel('類型分布', sortedEntries(summary.categories))}
      ${renderPiePanel('角色分布', sortedEntries(summary.characters))}`;

    chartArea.querySelectorAll('[data-pie]').forEach((node, index) => {
      const entries = index === 0 ? sortedEntries(summary.categories) : sortedEntries(summary.characters);
      node.style.background = pieStyle(entries);
    });
  }

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-work]');
    if (!button) return;
    activeWork = button.dataset.work;
    tabs.querySelectorAll('button').forEach((node) => node.classList.toggle('is-active', node === button));
    render();
  });

  render();
}

export { summarize };

export function renderChartRows(data){const rows=Object.entries(data).sort((a,b)=>b[1]-a[1]),max=rows[0]?.[1]||1;return rows.map(([name,value])=>`<div class="chart-row"><span title="${String(name).replace(/"/g,'&quot;')}">${name}</span><span class="chart-bar"><i style="width:${value/max*100}%"></i></span><strong>${value}</strong></div>`).join('')}
export const renderers={};

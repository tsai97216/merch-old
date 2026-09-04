const app = document.querySelector('#app');
const nav = document.querySelector('.nav-menu');
const globalSearch = document.querySelector('#global-search');
const searchBox = document.querySelector('#global-search-box');
const pageTitle = document.querySelector('#page-title');
const pageDesc = document.querySelector('#page-desc');
const toast = document.querySelector('#toast');

let db = { schemaVersion: 1, currency: 'TWD', items: [] };
let viewState = { query: '', work: '', character: '', type: '', status: '', sort: 'created' };

const ROUTES = {
  home: { title: '我的收藏', desc: '收藏、購買與到貨狀態，集中整理在同一個地方。', eyebrow: '01 / HOME' },
  collection: { title: '收藏', desc: '搜尋、篩選並瀏覽所有收藏資料。', eyebrow: '02 / COLLECTION' },
  stats: { title: '統計', desc: '從作品、角色到支出，查看收藏的整體分布。', eyebrow: '03 / STATISTICS' },
  manage: { title: '管理', desc: '新增與整理收藏資料，維持資料庫內容一致。', eyebrow: '04 / MANAGEMENT' },
  settings: { title: '設定', desc: '資料來源、顯示方式與網站狀態。', eyebrow: '05 / SETTINGS' }
};

const TYPES = ['Figure','PVC','Nendoroid','Plush','Acrylic','Badge','Card','Book','CD','Game','Other'];
const STATUSES = ['待整理','待發售','預購','已出貨','運送中','已收到','其他'];

const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const items = () => db.items || [];
const imageOf = item => item.images?.[0] || '';
const isReceived = item => item.status === '已收到' || !!item.release?.receivedDate;
const money = item => item.purchase?.price == null || item.purchase.price === '' ? '—' : `${item.purchase.currency || db.currency} ${Number(item.purchase.price).toLocaleString()}`;
const dateValue = value => value ? new Date(value).getTime() || 0 : 0;

function routeParts(){ return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); }
function routeName(){ const r=routeParts()[0]; return ROUTES[r] ? r : 'home'; }
function showToast(message, type='success'){ toast.textContent=message; toast.className=`toast show ${type}`; clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.className='toast',2200); }
function setHeader(route){ pageTitle.textContent=ROUTES[route].title; pageDesc.textContent=ROUTES[route].desc; nav.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',a.dataset.route===route)); }

function card(item){
  const image=imageOf(item);
  const badgeClass=isReceived(item)?'received':item.status==='其他'?'other':'pending';
  return `<a class="card" href="#/collection/${encodeURIComponent(item.id)}">
    <div class="card-image">${image?`<img src="${esc(image)}" alt="${esc(item.name)}" loading="lazy">`:'<div class="card-placeholder">NO IMAGE</div>'}</div>
    <strong class="card-title">${esc(item.name || '未命名收藏')}</strong>
    <span class="card-sub">${esc(item.character || item.work || '未分類')}</span>
    <div class="card-meta"><span class="badge">${esc(item.type || 'Other')}</span><span class="badge ${badgeClass}">${esc(item.status || '待整理')}</span></div>
  </a>`;
}

function empty(icon,title,desc){return `<div class="empty-state"><i class="fa-solid ${icon}"></i><strong>${esc(title)}</strong><p>${esc(desc)}</p></div>`;}
function pageHead(route, action=''){return `<div class="page-head"><div><span class="eyebrow">${ROUTES[route].eyebrow}</span><h1>${ROUTES[route].title}</h1></div><p>${ROUTES[route].desc}</p>${action}</div>`;}

function stats(){
  const list=items();
  return { total:list.length, received:list.filter(isReceived).length, pending:list.filter(x=>!isReceived(x)).length, works:new Set(list.map(x=>x.work).filter(Boolean)).size, characters:new Set(list.map(x=>x.character).filter(Boolean)).size, spent:list.reduce((n,x)=>n+Number(x.purchase?.price||0),0) };
}

function home(){
  const s=stats();
  const recent=[...items()].sort((a,b)=>dateValue(b.createdAt)-dateValue(a.createdAt)).slice(0,8);
  return `<div class="home-intro"><div><span class="eyebrow">${ROUTES.home.eyebrow}</span><h1>收藏，<br>好好記下來。</h1></div><div class="home-copy"><p>這裡不是單純的商品清單，而是你的收藏資料庫。每一件收藏都保留作品、角色、價格、發售與物流資訊。</p><a class="link" href="#/collection">瀏覽全部收藏 →</a></div></div>
  <section class="section"><div class="stats">${stat('TOTAL ITEMS',s.total,'全部收藏')}${stat('RECEIVED',s.received,'已收到')}${stat('PENDING',s.pending,'等待中')}${stat('WORKS',s.works,'作品')}</div></section>
  <section class="section"><div class="section-header"><h3><i class="fa-solid fa-clock-rotate-left"></i>最近加入</h3><a class="link" href="#/collection">查看全部 →</a></div>${recent.length?`<div class="grid">${recent.map(card).join('')}</div>`:empty('fa-box-open','收藏庫目前是空的','到管理頁新增第一件收藏。')}</section>`;
}
function stat(label,value,note){return `<div class="stat"><span class="stat-label">${label}</span><strong class="stat-value">${value.toLocaleString?.()??value}</strong><span class="stat-note">${note}</span></div>`;}

function collectionPage(){
  const works=unique('work'), chars=unique('character');
  return `${pageHead('collection')}<div class="toolbar"><input class="field search-field" id="collection-query" placeholder="搜尋名稱、作品、角色、備註…" value="${esc(viewState.query)}"><select class="select" id="filter-work"><option value="">所有作品</option>${works.map(x=>option(x,viewState.work)).join('')}</select><select class="select" id="filter-character"><option value="">所有角色</option>${chars.map(x=>option(x,viewState.character)).join('')}</select><select class="select" id="filter-type"><option value="">所有類型</option>${TYPES.map(x=>option(x,viewState.type)).join('')}</select><select class="select" id="filter-status"><option value="">所有狀態</option>${STATUSES.map(x=>option(x,viewState.status)).join('')}</select></div><div class="collection-bar"><span class="result-count" id="result-count"></span><select class="select sort" id="sort"><option value="created">最近加入</option><option value="name">名稱</option><option value="price">價格</option><option value="purchase">購買日期</option><option value="release">發售日期</option></select></div><div id="collection-results"></div>`;
}
function option(value,current){return `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(value)}</option>`;}
function unique(key){return [...new Set(items().map(x=>x[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'zh-Hant'));}
function filtered(){
  const q=viewState.query.trim().toLocaleLowerCase();
  let list=items().filter(x=>{const hay=[x.name,x.work,x.character,x.description,x.note,x.shipping?.note,x.afterSales?.note].filter(Boolean).join(' ').toLocaleLowerCase();return (!q||hay.includes(q))&&(!viewState.work||x.work===viewState.work)&&(!viewState.character||x.character===viewState.character)&&(!viewState.type||x.type===viewState.type)&&(!viewState.status||x.status===viewState.status);});
  list.sort((a,b)=>{switch(viewState.sort){case'name':return String(a.name).localeCompare(String(b.name),'zh-Hant');case'price':return Number(b.purchase?.price||0)-Number(a.purchase?.price||0);case'purchase':return dateValue(b.purchase?.date)-dateValue(a.purchase?.date);case'release':return dateValue(b.release?.releaseDate)-dateValue(a.release?.releaseDate);default:return dateValue(b.createdAt)-dateValue(a.createdAt);}});return list;
}
function bindCollection(){
  const map={query:'collection-query',work:'filter-work',character:'filter-character',type:'filter-type',status:'filter-status',sort:'sort'};
  Object.entries(map).forEach(([key,id])=>document.getElementById(id)?.addEventListener(key==='query'?'input':'change',e=>{viewState[key]=e.target.value;renderCollectionResults();}));
  document.getElementById('sort').value=viewState.sort; renderCollectionResults();
}
function renderCollectionResults(){const list=filtered();const count=document.getElementById('result-count');const out=document.getElementById('collection-results');if(!count||!out)return;count.textContent=`${list.length} ITEMS`;out.innerHTML=list.length?`<div class="grid">${list.map(card).join('')}</div>`:empty('fa-filter-circle-xmark','沒有符合條件的收藏','試著清除部分篩選條件。');}

function detailPage(id){
  const item=items().find(x=>String(x.id)===decodeURIComponent(id));
  if(!item)return empty('fa-circle-question','找不到這件收藏','資料庫中沒有對應的項目。');
  const image=imageOf(item);
  return `<div class="section"><a class="link" href="#/collection">← 返回收藏</a></div><div class="detail-layout"><div class="detail-gallery"><div class="detail-main-image">${image?`<img src="${esc(image)}" alt="${esc(item.name)}">`:'<div class="card-placeholder">NO IMAGE</div>'}</div>${item.images?.length>1?`<div class="thumbs">${item.images.map(x=>`<img src="${esc(x)}" alt="" loading="lazy">`).join('')}</div>`:''}</div><div><span class="eyebrow">COLLECTION / ITEM</span><h1 class="detail-title">${esc(item.name)}</h1><p class="detail-summary">${esc(item.description)}</p>${detailSection('基本資料',[['作品',item.work],['角色',item.character],['類型',item.type],['狀態',item.status]])}${detailSection('購買資料',[['價格',money(item)],['平台',item.purchase?.platform],['購買日期',item.purchase?.date],['訂單',item.purchase?.order],['連結',item.purchase?.url]])}${detailSection('發售與物流',[['發售日期',item.release?.releaseDate],['預計日期',item.release?.expectedDate],['到貨日期',item.release?.receivedDate],['物流狀態',item.shipping?.status],['方式',item.shipping?.method],['單號',item.shipping?.trackingNumber],['物流備註',item.shipping?.note]])}${detailSection('售後與備註',[['售後狀態',item.afterSales?.status],['售後備註',item.afterSales?.note],['備註',item.note]])}</div></div>`;
}
function detailSection(title,rows){const valid=rows.filter(([,v])=>v!==undefined&&v!==null&&v!=='');if(!valid.length)return '';return `<section class="detail-section"><h3><i class="fa-solid fa-circle-info"></i>${title}</h3><div class="detail-table">${valid.map(([k,v])=>`<div class="detail-row"><span class="detail-key">${esc(k)}</span><span class="detail-value">${esc(v)}</span></div>`).join('')}</div></section>`;}

function statsPage(){
 const s=stats();
 return `${pageHead('stats')}<section class="section"><div class="stats">${stat('TOTAL',s.total,'收藏總數')}${stat('RECEIVED',s.received,'已收到')}${stat('PENDING',s.pending,'尚未收到')}${stat('SPENDING',s.spent,db.currency+' 累計')}</div></section><section class="section"><div class="dashboard">${chartPanel('作品分布',countBy('work'))}${chartPanel('角色分布',countBy('character'))}${chartPanel('類型分布',countBy('type'))}</div></section>`;
}
function countBy(key){const m={};items().forEach(x=>{const v=x[key]||'未分類';m[v]=(m[v]||0)+1;});return m;}
function chartPanel(title,data){const e=Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,10),max=e[0]?.[1]||1;return `<div class="content-frame"><div class="section-header"><h3>${esc(title)}</h3></div><div class="chart-list">${e.length?e.map(([n,v])=>`<div class="chart-row"><span>${esc(n)}</span><span class="chart-bar"><i style="width:${v/max*100}%"></i></span><strong>${v}</strong></div>`).join(''): '<span class="section-note">尚無資料</span>'}</div></div>`;}

function managePage(){
 return `${pageHead('manage')}<section class="section"><div class="content-frame"><div class="section-header"><h3><i class="fa-solid fa-plus"></i>新增收藏</h3></div><form id="item-form" class="form-grid"><div class="form-field"><label>名稱 *</label><input class="field" name="name" required></div><div class="form-field"><label>作品</label><input class="field" name="work"></div><div class="form-field"><label>角色</label><input class="field" name="character"></div><div class="form-field"><label>類型</label><select class="select" name="type"><option value="">請選擇</option>${TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="form-field"><label>狀態</label><select class="select" name="status">${STATUSES.map(x=>`<option ${x==='待整理'?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>價格</label><input class="field" name="price" type="number" min="0" step="0.01"></div><div class="form-field"><label>購買平台</label><input class="field" name="platform"></div><div class="form-field"><label>購買日期</label><input class="field" name="purchaseDate" type="date"></div><div class="form-field"><label>預計發售</label><input class="field" name="expectedDate" type="date"></div><div class="form-field"><label>圖片 URL</label><input class="field" name="image" type="url"></div><div class="form-field full"><label>描述</label><textarea class="field" name="description"></textarea></div><div class="form-field full"><label>備註</label><textarea class="field" name="note"></textarea></div><div class="form-field full"><div class="actions"><button class="button primary" type="submit"><i class="fa-solid fa-plus"></i>加入收藏</button><button class="button" type="reset">清除</button></div></div></form></div></section><section class="section"><div class="section-header"><h3><i class="fa-solid fa-list-check"></i>資料庫項目</h3><small>${items().length} 件</small></div>${items().length?`<div class="grid">${items().map(manageCard).join('')}</div>`:empty('fa-box-open','目前沒有收藏','新增第一件收藏後會出現在這裡。')}</section>`;
}
function manageCard(item){return `<div class="card"><div class="card-image">${imageOf(item)?`<img src="${esc(imageOf(item))}" alt="" loading="lazy">`:'<div class="card-placeholder">NO IMAGE</div>'}</div><strong class="card-title">${esc(item.name)}</strong><span class="card-sub">${esc(item.work||'未分類')} · ${esc(item.status)}</span><div class="actions"><a class="button" href="#/collection/${encodeURIComponent(item.id)}">查看</a><button class="button" data-delete="${esc(item.id)}" type="button">刪除</button></div></div>`;}
function bindManage(){document.getElementById('item-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const now=new Date().toISOString();const item=window.MerchData.normalizeItem({id:crypto.randomUUID(),name:f.get('name'),work:f.get('work'),character:f.get('character'),type:f.get('type'),status:f.get('status'),description:f.get('description'),note:f.get('note'),images:f.get('image')?[f.get('image')]:[],purchase:{price:f.get('price')||null,currency:db.currency,platform:f.get('platform'),date:f.get('purchaseDate')},release:{expectedDate:f.get('expectedDate')},createdAt:now,updatedAt:now});db.items.unshift(item);saveDraft();e.currentTarget.reset();showToast('已加入本機草稿');render();});document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.delete;if(confirm('確定要刪除這件收藏嗎？')){db.items=db.items.filter(x=>String(x.id)!==id);saveDraft();showToast('已刪除本機草稿');render();}}));}
function saveDraft(){localStorage.setItem('chi-merch-draft',JSON.stringify(db));}

function settingsPage(){return `${pageHead('settings')}<section class="section"><div class="content-frame">${row('資料庫狀態',`${items().length} 件收藏`)}${row('Schema',`v${db.schemaVersion}`)}${row('資料來源','data/merch.json')}${row('GitHub','tsai97216/merch · main')}${row('本機草稿',localStorage.getItem('chi-merch-draft')?'存在':'無')}</div></section><section class="section"><div class="content-frame"><div class="section-header"><h3><i class="fa-solid fa-palette"></i>外觀</h3></div><label class="form-field"><span>主題</span><select class="select" id="theme"><option value="light">淺色</option><option value="dark">深色</option><option value="system">跟隨系統</option></select></label></div></section>`;}
function row(k,v){return `<div class="detail-row"><span class="detail-key">${esc(k)}</span><span class="detail-value">${esc(v)}</span></div>`;}
function bindSettings(){const select=document.getElementById('theme');if(!select)return;const saved=localStorage.getItem('chi-merch-theme')||'light';select.value=saved;applyTheme(saved);select.addEventListener('change',()=>{localStorage.setItem('chi-merch-theme',select.value);applyTheme(select.value);});}
function applyTheme(v){document.documentElement.dataset.theme=v==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):v;}

function globalSearchPage(){const q=globalSearch.value.trim();viewState.query=q;location.hash='#/collection';}
function render(){const parts=routeParts(),route=routeName(),id=parts[1];setHeader(route);if(route==='home')app.innerHTML=home();else if(route==='collection')app.innerHTML=id?detailPage(id):collectionPage();else if(route==='stats')app.innerHTML=statsPage();else if(route==='manage')app.innerHTML=managePage();else app.innerHTML=settingsPage();app.setAttribute('aria-busy','false');if(route==='collection'&&!id)bindCollection();if(route==='manage')bindManage();if(route==='settings')bindSettings();}

async function init(){try{const draft=localStorage.getItem('chi-merch-draft');db=draft?window.MerchData.normalizeDatabase(JSON.parse(draft)):await window.MerchData.loadDatabase();}catch(e){console.error(e);db=window.MerchData.emptyDatabase();app.innerHTML=empty('fa-triangle-exclamation','資料載入失敗','請稍後重新整理頁面。');return;}render();}

globalSearch.addEventListener('input',()=>searchBox.classList.toggle('has-value',!!globalSearch.value));
globalSearch.addEventListener('keydown',e=>{if(e.key==='Enter')globalSearchPage();});document.getElementById('search-clear').addEventListener('click',()=>{globalSearch.value='';searchBox.classList.remove('has-value');});
window.addEventListener('hashchange',render);window.addEventListener('online',()=>location.reload());
init();

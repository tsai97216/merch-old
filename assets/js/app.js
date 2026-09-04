import { loadData } from './data.js';
import { createItemDetail } from './item-detail.js';
import { createDashboard } from './dashboard.js';
import { createCollection } from './collection.js';
import { createStatistics } from './statistics.js';
import { createManagement } from './management.js';
import { createSettings } from './settings.js';
import { attachSyncBridge } from './sync-bridge.js';
const VERSION='v2.4.0';
function updateVersion(){document.querySelectorAll('.sidebar-footer span:last-child,#settings dd,.footer span:last-child').forEach(e=>{if(/^v\d+\.\d+\.\d+$/.test(e.textContent.trim()))e.textContent=VERSION});document.querySelectorAll('link[rel="stylesheet"]').forEach(l=>{if(l.href.includes('/assets/css/style.css')||l.href.includes('/assets/css/pages.css')){let u=new URL(l.href,location.href);u.searchParams.set('v',VERSION.slice(1));l.href=u.href}})}
function showError(error){console.error('[Chi MERCH]',error);const c=document.querySelector('.content');if(c){let n=document.createElement('div');n.className='data-error';n.innerHTML='<strong>資料載入失敗</strong><p>無法讀取收藏資料庫，請確認網站可以正常讀取 data/ 下的 JSON 檔案。</p>';c.prepend(n)}}
async function boot(){updateVersion();try{const data=await loadData(),detail=createItemDetail(),dashboard=createDashboard({home:document.querySelector('#home'),items:data.items,works:data.works,detail}),collection=createCollection({collection:document.querySelector('#collection'),items:data.items,works:data.works,detail}),statistics=createStatistics({statistics:document.querySelector('#statistics'),works:data.works,items:data.items});createManagement({management:document.querySelector('#management'),store:data});createSettings({settings:document.querySelector('#settings')});attachSyncBridge(document.querySelector('#management'),data);data.subscribe(()=>{dashboard?.render?.();collection?.render?.();statistics?.render?.()});document.documentElement.dataset.dataReady='true'}catch(error){showError(error)}}
boot();

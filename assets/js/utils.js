export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
export const uid=()=>crypto.randomUUID?.()||`item-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
export const toTime=v=>v?Date.parse(v)||0:0;
export const money=(value,currency='TWD')=>value==null||value===''?'—':`${currency} ${Number(value).toLocaleString()}`;
export const formatDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'});};
export const debounce=(fn,wait=150)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait)}};
export const unique=values=>[...new Set(values.filter(v=>v!==null&&v!==undefined&&v!==''))];

const KEY='chi-merch-theme';const modes=['light','dark','system'];
export function getTheme(){try{const v=localStorage.getItem(KEY);return modes.includes(v)?v:'system'}catch{return'system'}}
export function applyTheme(mode=getTheme()){const dark=mode==='dark'||(mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.dataset.themeMode=mode;try{localStorage.setItem(KEY,mode)}catch{}return mode}
export function initTheme(){applyTheme();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(getTheme()==='system')applyTheme('system')})}

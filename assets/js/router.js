const routes=[{name:'home',path:'/'},{name:'collection',path:'/collection'},{name:'stats',path:'/stats'},{name:'manage',path:'/manage'},{name:'settings',path:'/settings'}];
export function parseRoute(hash=location.hash){const parts=hash.replace(/^#\/?/,'').split('/').filter(Boolean);const name=parts[0]||'home';return routes.some(r=>r.name===name)?{name,id:parts[1]?decodeURIComponent(parts[1]):null}:{name:'home',id:null};}
export function href(name,id){return `#/${name}${id?`/${encodeURIComponent(id)}`:''}`;}
export function initRouter(onRoute){const go=()=>onRoute(parseRoute());window.addEventListener('hashchange',go);if(!location.hash)location.hash='#/';go();return()=>window.removeEventListener('hashchange',go)}
export const routeDefinitions=routes;

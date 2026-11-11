// Calendar service worker: offline shell kept in TWO places (Cache Storage + IndexedDB),
// because other apps on the same github.io address can delete Cache Storage entries.
const V='mycal-v5',SC=self.registration.scope,
 SHELL=['index.html','manifest.webmanifest','firebase-config.js','icon-192.png','icon-512.png','icon-192%20(1).png','icon-512%20(1).png','icon-maskable.png'];
const sdb=()=>new Promise((res,rej)=>{const q=indexedDB.open('mycal-shell',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
async function sput(key,resp){try{const b=await resp.clone().arrayBuffer(),d=await sdb();d.transaction('f','readwrite').objectStore('f').put({b,t:resp.headers.get('content-type')||''},key)}catch(e){}}
async function sget(key){try{const d=await sdb();return await new Promise(r=>{const q=d.transaction('f').objectStore('f').get(key);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
const keep=k=>/index\.html$|firebase-config\.js$|manifest\.webmanifest$/.test(k);
async function precache(){const c=await caches.open(V);
 await Promise.all(SHELL.map(async f=>{try{const u=SC+f,r=await fetch(u,{cache:'reload'});if(r.ok&&!r.redirected){await c.put(u,r.clone());if(keep(u))await sput(u,r)}}catch(e){}}))}
self.addEventListener('install',e=>{e.waitUntil(precache().then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('mycal-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='refresh')e.waitUntil(precache())});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(SC))return;
 const nav=r.mode==='navigate',key=nav?SC+'index.html':r.url.split('?')[0];
 e.respondWith((async()=>{
  const c=await caches.open(V).catch(()=>null);
  const net=fetch(r).then(x=>{if(x.ok&&!x.redirected){if(c)c.put(key,x.clone());if(nav||keep(key))sput(key,x)}return x}).catch(()=>null);
  const local=async()=>{const h=c&&await c.match(key,{ignoreSearch:true});if(h)return h;const v=await sget(key);return v?new Response(v.b,{headers:{'Content-Type':v.t||'text/html'}}):null};
  if(nav){const res=await Promise.race([net,new Promise(s=>setTimeout(()=>s(null),3500))]);return res||await local()||await net||Response.error()}
  const h=await local();if(h){e.waitUntil(net);return h}
  return(await net)||Response.error()})())});
// Push alerts from Firebase Cloud Messaging (no Firebase code needed in the worker)
self.addEventListener('push',e=>{let p={};try{p=e.data?e.data.json():{}}catch(x){}
 const d=Object.assign({},p.notification||{},p.data||{});
 e.waitUntil(self.registration.showNotification(d.title||'Calendar',{body:d.body||'',tag:d.tag||undefined}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});

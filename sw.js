try{importScripts('firebase-config.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
 if(self.FB_CONFIG&&!/^PASTE/.test(self.FB_CONFIG.apiKey)){firebase.initializeApp(self.FB_CONFIG);
  firebase.messaging().onBackgroundMessage(p=>{const d=p.data||{};return self.registration.showNotification(d.title||'Calendar',{body:d.body,icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||undefined})})}}catch(e){}
const V='mycal-v4',A=['./','./index.html','./manifest.webmanifest','./firebase-config.js','./icon-192.png','./icon-512.png','./icon-maskable.png'];
// Cache each file on its own so one missing file can't break offline support
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// App files: open instantly from cache, refresh the cache quietly in the background
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 if(r.mode==='navigate'){e.respondWith((async()=>{const c=await caches.open(V);
  const net=fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>null);
  const res=await Promise.race([net,new Promise(rs=>setTimeout(()=>rs(null),3500))]);
  return res||(await c.match(r,{ignoreSearch:true}))||(await net)||(await c.match('./index.html'))||Response.error()})());return}
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(r.mode==='navigate'?await c.match('./index.html'):Response.error())}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});

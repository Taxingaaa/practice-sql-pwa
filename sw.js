const C='practice-sql-pwa-v2.2-full-review';
const LOCAL=['./','index.html','style.css','app.js','enhancements.js','problems.json','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
const CDN='https://cdn.jsdelivr.net/npm/sql.js@1.16.0/dist/sql-wasm-inline.js';
self.addEventListener('install',event=>event.waitUntil(caches.open(C).then(cache=>cache.addAll([...LOCAL,CDN])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==C).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request).then(network=>{const copy=network.clone();caches.open(C).then(cache=>cache.put(event.request,copy));return network;}).catch(()=>caches.match('index.html'))));});

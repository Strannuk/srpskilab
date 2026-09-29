/* Оффлайн-кеш статического курса. Версию менять после обновлений сайта. */
const CACHE='srpskilab-cache-v1';
const FILES=['./','./index.html','./style.css','./app.js','./curriculum-core.js','./curriculum-a0-a1.js','./curriculum-a2.js','./curriculum-b1-b2.js','./lesson-addons.js','./assets/favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}return response;}).catch(()=>hit)));});

// ITOGO – Offline-Cache. Version erhöhen, wenn sich index.html ändert.
const CACHE = "itogo-v42";
const DATA = "itogo-data-v1"; // Produktdatenbank (pdb-…) bleibt über App-Updates erhalten
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./zxing.min.js", "./koch.html", "./koch.webmanifest", "./koch-180.png", "./koch-192.png", "./koch-512.png", "./pdb-meta.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== DATA).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); if (u.origin !== self.location.origin) return;
  if (/\/pdb-[ps]\d+\.json$/.test(u.pathname)){ // Daten: Cache zuerst
    e.respondWith(caches.open(DATA).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })))); return; }
  // Netz zuerst (immer die neueste Version), bei Funkloch aus dem Cache
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});

// ITOGO – Offline-Cache. Version erhöhen, wenn sich index.html ändert.
const CACHE = "itogo-v76-rezepte";
const DATA = "itogo-data-v1"; // Produktdatenbank (pdb-…) und Bilder-Pakete (img-…) bleiben über App-Updates erhalten
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./zxing.min.js", "./koch.html", "./koch.webmanifest", "./koch-180.png", "./koch-192.png", "./koch-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== DATA).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const fromData = req => caches.open(DATA).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); if (u.origin !== self.location.origin) return;
  // Daten und Bilder: Dateinamen ändern sich bei neuem Inhalt → Cache zuerst
  if (/\/pdb-[ps]\d+\.json$/.test(u.pathname) || /\/img-[0-9a-f]+\.bin$/.test(u.pathname)){ e.respondWith(fromData(e.request)); return; }
  // App: Netz zuerst (neueste Version) – bei langsamem Netz nach 3 s aus dem Cache, bei Funkloch sofort
  const net = fetch(e.request).then(r => { if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; });
  const cached = () => caches.match(e.request).then(r => r || caches.match("./index.html"));
  e.respondWith(new Promise(res => {
    let done = false; const fin = r => { if (!done && r){ done = true; res(r); } };
    const t = setTimeout(() => cached().then(r => r ? fin(r) : null), 3000);
    net.then(r => { clearTimeout(t); fin(r); }).catch(() => { clearTimeout(t); cached().then(r => fin(r || Response.error())); });
  }));
});

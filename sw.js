// Service worker: aplicația merge offline după prima încărcare.
const VERSIUNE = 'gqh-v1.0.0';
const NUCLEU = [
  './', 'index.html', 'manifest.json', 'css/style.css',
  'js/app.js', 'js/engine.js', 'js/storage.js', 'js/ui.js', 'js/atlas.js', 'js/atlas-geo.js', 'js/harta-interactiva.js', 'js/atlas-calibrare.js', 'js/profesor.js',
  'data/atlas.json', 'data/insigne.json',
  'assets/atlas/asia_hidrografie.webp', 'assets/atlas/asia_pozitie.webp', 'assets/atlas/asia_relief.webp', 'assets/atlas/asia_hidrografie.jpg', 'assets/atlas/asia_pozitie.jpg', 'assets/atlas/asia_relief.jpg',
  'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png'
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSIUNE).then(c => c.addAll(NUCLEU)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIUNE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // rețea mai întâi (conținut proaspăt), cache la nevoie – inclusiv fonturile Google
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const copie = r.clone(); caches.open(VERSIUNE).then(c => c.put(e.request, copie)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});

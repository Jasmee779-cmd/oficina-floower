/* Service worker mínimo de la Oficina FLOOWER.PE (atajo / PWA).
   - Los .json (estado, respuestas, datos-dia, historico, eventos) NUNCA se cachean: van siempre directo a la red.
   - Otros orígenes (CDN de three.js, API de GitHub, webhook) tampoco se tocan.
   - Solo el "shell" (páginas, manifest, íconos) con network-first: red primero y, si no hay conexión, la última copia. */
const CACHE = 'oficina-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icono-192.png', './icono-512.png', './icono-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;     // otros orígenes: sin intervenir
  if (/\.json$/i.test(url.pathname)) return;                                   // datos en vivo: siempre frescos, sin caché
  const esShell = req.mode === 'navigate' || /\/$|\.html$|\.webmanifest$|\/icono-\d+\.png$/i.test(url.pathname);
  if (!esShell) return;
  e.respondWith(
    fetch(req).then(r => {                                                     // network-first
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});

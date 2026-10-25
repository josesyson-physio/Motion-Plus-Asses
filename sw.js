/* MotionPlus Pro service worker: opens fast and works offline after the first visit.
   Pages are fetched fresh when online (so updates show at once) and fall back to the saved copy offline.
   The pose model, its runtime and the PDF libraries are large and never change at a given address, so they come from the cache first. */
const VERSION = "mp-2026-10-25c";
const PAGES = VERSION + "-pages", STATIC = VERSION + "-static";
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(PAGES).then(c => c.addAll(["./", "posture/"])).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }
  catch (e) { return (await cache.match(req, { ignoreSearch: true })) || Response.error(); }
}
async function cacheFirst(req) {
  const cache = await caches.open(STATIC), hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url), same = url.origin === location.origin;
  if (req.mode === "navigate" || (same && /\.html?$|\/$/.test(url.pathname))) return e.respondWith(networkFirst(req));
  if ((same && /\/(posture\/(models|wasm)\/|posture\/vision_bundle\.mjs|assets\/)/.test(url.pathname)) || LIBS.test(req.url)) return e.respondWith(cacheFirst(req));
});

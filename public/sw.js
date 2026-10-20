// Service worker minimal : l'app reste installable et les assets de marque
// sont servis depuis le cache. Les pages et données passent toujours par le réseau.
const CACHE = "subarashii-v1";
const PRECACHE = ["/brand/logo.png", "/brand/logo-intro.mp4", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/brand/") && !url.pathname.startsWith("/icons/") && !url.pathname.startsWith("/_next/static/")) return;
  // Les requêtes Range (lecture vidéo) ne passent pas par le cache.
  if (event.request.headers.has("range")) return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }),
    ),
  );
});

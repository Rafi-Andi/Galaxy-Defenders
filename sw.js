const CACHE_NAME = "defenders-v1";
const assetsToCache = [
  "/",
  "/index.html",
  "/img",
  "/style.css",
  "/script.js",
  "/sw.js",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  const preCache = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(assetsToCache);
      return self.skipWaiting();
    } catch (error) {
      console.error("Gagal pre-cache:", error);
    }
  };
  event.waitUntil(preCache());
});

self.addEventListener("activate", (event) => {
  const cleanup = async () => {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
      return self.clients.claim();
    } catch (error) {
      console.error("Gagal aktivasi:", error);
    }
  };
  event.waitUntil(cleanup());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const handleFetch = async () => {
    try {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      return await fetch(event.request);
    } catch (error) {
      const acceptHeader = event.request.headers.get("accept");
      if (acceptHeader && acceptHeader.includes("text/html")) {
        return await caches.match("/index.html");
      }
    }
  };
  event.respondWith(handleFetch());
});

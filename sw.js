const CACHE_NAME = "smart-gardening-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/database.js",
  "./js/genealogy.js",
  "./js/timeline.js"
];

// 安裝：快取主要程式檔案
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// 啟用：清除舊版本 Cache
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 請求：優先使用網路，失敗時使用快取
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || caches.match("./index.html");
          });
      })
  );
});

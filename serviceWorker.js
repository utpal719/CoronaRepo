const staticCacheName = "site-static-v2";
const dynamicCacheName = "site-dynamic-v1";

const EXP_TIME = 12 * 60 * 60;

const assets = [
  "index.html",
  "offline.html",
  "http://localhost:1337/home",
  "https://fonts.googleapis.com/css?family=Sofia",
  "https://fonts.googleapis.com/css?family=Roboto:300,400,500",
];

const self = this;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      //console.log(keys);
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (!(event.request.url.indexOf("http") === 0)) return;
  return event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      if (
        assets.includes(event.request.url) &&
        cacheRes.headers.get("cache-control")
      ) {
        const maxAge = cacheRes.headers
          .get("cache-control")
          .match(/max-age=(\d+)/);

        const cachedTime = parseInt(maxAge ? maxAge[1] : 0, 10);
        const timeNow = new Date().getTime();

        if (timeNow - cachedTime >= EXP_TIME) {
          return fetch(event.request).then((fetchRes) => {
            return caches.open(staticCacheName).then((cache) => {
              cache.put(event.request.url, fetchRes.clone());
              return fetchRes;
            });
          });
        }
      }

      return (
        cacheRes ||
        fetch(event.request).then((fetchRes) => {
          return caches.open(dynamicCacheName).then((cache) => {
            cache.put(event.request.url, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});

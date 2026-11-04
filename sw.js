// Bump this version string to force devices to re-cache everything
// (e.g. after regenerating the clue data).
//
// Prefix is deliberately different from the full game's "jeopardy-cache-"
// caches: all GitHub Pages sites under bluepotato00.github.io share one
// browser origin, so each service worker must only ever delete its OWN
// old caches, never another project's.
const CACHE_PREFIX = "clues-study-cache-";
const CACHE_NAME = CACHE_PREFIX + "v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./study.js",
  "./clues_manifest.js",
  "./manifest.json",
  "./icon-180.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache-first, and opportunistically cache anything fetched over the
// network (the clue_data_part files) so the first online load caches
// everything needed for full offline use afterward.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

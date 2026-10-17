/* Offline support: the app and the Bibles are kept on the device; sermons that were opened are
   remembered too. Bump VERSION when publishing a new version of the web app. */
const VERSION = "bp-mobile-1.3";
const SERMON_CACHE = "bp-lists-sermons";  // kept across versions
const SHELL = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest",
               "icon-192.png", "icon-512.png", "apple-touch-icon.png", "data/sermons-index.json", "data/SV.json"];

self.addEventListener("install", (e) => {
  // {cache: "reload"}: take the files from the server, never an older copy from the browser cache
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== SERMON_CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/** The app's own files: always the newest when online (so all files are the same version);
    the stored copy without internet. */
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await Promise.race([fetch(req, { cache: "no-cache" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), 5000))]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}
/** Big files that rarely change (the Bibles): from the device, fetched once. */
async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    const isBible = /\/data\/[A-Za-z0-9_-]+\.json$/.test(url.pathname) && !url.pathname.endsWith("sermons-index.json");
    e.respondWith(isBible ? cacheFirst(VERSION, req) : networkFirst(req));
  } else if (url.hostname === "search.messagehub.info" && url.pathname.endsWith("/blocks")) {
    // sermon texts: keep the ones that were opened, so they also work offline
    e.respondWith(cacheFirst(SERMON_CACHE, req));
  }
});

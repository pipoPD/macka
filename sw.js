// Jednoduchý service worker: aplikácia sa otvorí aj bez internetu (naposledy načítaná verzia).
var C = "mt-cache-v20";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(clients.claim()); });
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var u = new URL(e.request.url);
  var ok = u.origin === location.origin || u.hostname === "www.gstatic.com" ||
           u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (!ok) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && (r.ok || r.type === "opaque")) {
        var c = r.clone();
        caches.open(C).then(function (ch) { ch.put(e.request, c); });
      }
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});

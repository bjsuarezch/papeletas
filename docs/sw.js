/* Service worker: la app funciona sin conexion despues de la primera carga */
var CACHE = "papeletas-s24-v12";
var ARCHIVOS = [
  ".",
  "index.html",
  "pdf-lib.min.js",
  "plantilla.js",
  "plantilla-en.js",
  "rellenar.js",
  "manifest.webmanifest",
  "icono-180.png",
  "icono-192.png",
  "icono-512.png"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  if (ev.request.method !== "GET") return;
  if (ev.request.mode === "navigate") {
    ev.respondWith(
      fetch(ev.request).then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        return resp;
      }).catch(function () {
        return caches.match(ev.request);
      })
    );
    return;
  }
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then(function (enCache) {
      return enCache || fetch(ev.request).then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        return resp;
      });
    })
  );
});

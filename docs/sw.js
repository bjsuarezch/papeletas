/* Service worker: la app funciona sin conexion despues de la primera carga */
var CACHE = "papeletas-s24-v1";
var ARCHIVOS = [
  ".",
  "index.html",
  "pdf-lib.min.js",
  "plantilla.js",
  "rellenar.js",
  "manifest.webmanifest",
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

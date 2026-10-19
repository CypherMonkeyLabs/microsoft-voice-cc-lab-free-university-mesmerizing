/* Offline shell for the Teams Phone university. Same-origin GET only. */
var CACHE = "mvcc-university-v4";
var SHELL = [
  "./",
  "./index.html",
  "./start.html",
  "./help.html",
  "./legal.html",
  "./downloads.html",
  "./diagrams.html",
  "./flows.html",
  "./charts.html",
  "./play.html",
  "./ecosystem.html",
  "./bridges.html",
  "./careers.html",
  "./glossary.html",
  "./quizzes.html",
  "./flashcards.html",
  "./labs.html",
  "./troubleshooting.html",
  "./assets/css/canon.css",
  "./assets/css/shell.css",
  "./assets/css/university.css",
  "./assets/css/wow.css",
  "./assets/css/frame.css",
  "./assets/css/footer.css",
  "./assets/css/polish.css",
  "./assets/css/round2.css",
  "./assets/css/round3.css",
  "./assets/js/university.js",
  "./assets/js/theme-boot.js",
  "./assets/js/port-game.js",
  "./assets/js/frame.js",
  "./assets/js/phone-nav.js",
  "./assets/js/wow.js",
  "./assets/js/round2-bot.js",
  "./assets/js/dragbot.js",
  "./assets/js/round3.js",
  "./assets/js/sources-block.js",
  "./assets/js/brand.js",
  "./assets/data/guide-index.json",
  "./favicon.svg",
  "./favicon.ico",
  "./manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL);
  }).then(function () { return self.skipWaiting(); }).catch(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(function (hit) {
    var network = fetch(request).then(function (response) {
      if (response && response.ok && response.type === "basic") {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return hit; });
    return hit || network;
  }));
});

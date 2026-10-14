/* Offline cache for the Voice Lab. Generated. Cache f96f2d2b4040. */
"use strict";
const CACHE = "mvcc-lab-f96f2d2b4040";
const PRECACHE = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./studios/topology.js",
  "./vendor/three.module.min.js",
  "./vendor/OrbitControls.js",
  "./og-card.png",
  "./data/manifest.json",
  "./data/quiz.json",
  "./data/cards.json",
  "./data/glossary.json",
  "./data/charts.json",
  "./data/bosses.json",
  "./data/tracks/t01.json",
  "./data/tracks/t02.json",
  "./data/tracks/t03.json",
  "./data/tracks/t04.json",
  "./data/tracks/t05.json",
  "./data/tracks/t06.json",
  "./data/tracks/t07.json",
  "./data/tracks/t08.json",
  "./data/tracks/t09.json",
  "./data/tracks/t10.json",
  "./data/tracks/t11.json",
  "./data/tracks/t12.json",
  "./data/tracks/t13.json",
  "./data/tracks/t14.json",
  "./data/tracks/t15.json",
  "./data/tracks/t16.json",
  "./data/tracks/t17.json",
  "./audio/aa-goodbye.wav",
  "./audio/aa-hold.wav",
  "./audio/aa-hours.wav",
  "./audio/aa-operator.wav",
  "./audio/aa-record.wav",
  "./audio/aa-sales.wav",
  "./audio/aa-support.wav",
  "./audio/aa-welcome.wav",
  "./audio/dtmf-0.wav",
  "./audio/dtmf-1.wav",
  "./audio/dtmf-2.wav",
  "./audio/dtmf-3.wav",
  "./audio/dtmf-4.wav",
  "./audio/dtmf-5.wav",
  "./audio/dtmf-6.wav",
  "./audio/dtmf-7.wav",
  "./audio/dtmf-8.wav",
  "./audio/dtmf-9.wav",
  "./audio/dtmf-pound.wav",
  "./audio/dtmf-star.wav",
  "./audio/intro-cc.wav",
  "./audio/intro-emergency.wav",
  "./audio/intro-exams.wav",
  "./audio/intro-qos.wav",
  "./audio/intro-queue.wav",
  "./audio/intro-record.wav",
  "./audio/intro-routing.wav",
  "./audio/intro-tenant.wav",
  "./audio/tone-busy.wav",
  "./audio/tone-dial.wav",
  "./audio/tone-reorder.wav",
  "./audio/tone-ringback.wav"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (cached) {
    const fetched = fetch(event.request).then(function (response) {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      }
      return response;
    }).catch(function () { return cached || caches.match("./index.html"); });
    return cached || fetched;
  }));
});

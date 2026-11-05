// Automatisch erzeugt von werkzeuge/web/bauen.js
const CACHE = "lazi-0.3.14-5a53929468";
const DATEIEN = ["./","icon-192.png","icon-512.png","js/ablage.js","js/auftraege.js","js/begleiter.js","js/bestehende.js","js/dorf.js","js/dorfleben.js","js/einstellungen.js","js/fabrik.js","js/fehlerbericht.js","js/finale.js","js/gebaeude.js","js/gegenstaende.js","js/geschichte.js","js/grafik.js","js/grafik2.js","js/kampf.js","js/kraftwerk.js","js/lib/three.min.js","js/markt.js","js/meister.js","js/mission.js","js/optionen.js","js/rostbrecher.js","js/speicher.js","js/sprache.js","js/sprache_en.js","js/sprache_zh.js","js/start.js","js/texte.js","js/ton.js","js/unterwelt.js","js/wehr.js","js/welt.js","js/weltkarte.js","js/zwiespalt.js","manifest.webmanifest","schriften/OFL-fusionpixel.txt","schriften/OFL-pixelifysans.txt","schriften/OFL-silkscreen.txt","schriften/fusion-pixel-zh.woff2","schriften/pixelify-latin-ext.woff2","schriften/pixelify-latin.woff2","schriften/schriften.css","schriften/silkscreen-latin-ext.woff2","schriften/silkscreen-latin.woff2"];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith('lazi-') && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(t => t || fetch(e.request))));
});

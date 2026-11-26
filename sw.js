// Offline support: cache the app shell, serve cache-first.
const CACHE = 'independent-steps-v2';
const PHOTOS = ["images/laundry-1.jpg", "images/laundry-2.jpg", "images/laundry-3.jpg", "images/laundry-4.jpg", "images/laundry-5.jpg", "images/laundry-6.jpg", "images/laundry-7.jpg", "images/laundry-8.jpg", "images/laundry-9.jpg", "images/dishes-1.jpg", "images/dishes-2.jpg", "images/dishes-3.jpg", "images/dishes-4.jpg", "images/dishes-5.jpg", "images/dishes-6.jpg", "images/dishes-7.jpg", "images/dishes-8.jpg", "images/dishes-9.jpg", "images/bed-1.jpg", "images/bed-2.jpg", "images/bed-3.jpg", "images/bed-4.jpg", "images/bed-5.jpg", "images/pet-1.jpg", "images/pet-3.jpg", "images/pet-4.jpg", "images/pet-5.jpg"];
const SHELL = ['./', 'index.html', 'styles.css', 'credits.js', 'app.js', 'manifest.webmanifest', 'icon.svg', ...PHOTOS];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('index.html')))
  );
});

// Tapping a reminder notification opens (or focuses) the app on that chore.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data && e.notification.data.url ? e.notification.data.url : './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { w.navigate(target); return w.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});

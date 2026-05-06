const CACHE_NAME = 'tiktokwatermarkremover-v3';
const ASSETS = [
  '/',
  '/?source=pwa',
  '/index.html',
  '/manifest.json',
  '/og-image.webp',
  '/screenshot-mobile.webp',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, error: "You're offline. Connect to the internet to download videos.", code: "OFFLINE" }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).then(netRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, netRes.clone());
          return netRes;
        });
      });
    }).catch(() => {
      // Offline fallback
      return caches.match('/index.html');
    })
  );
});

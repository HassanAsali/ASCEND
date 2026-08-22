const BUILD = '0.6.0.11.3';
const CACHE = `ascend-v${BUILD}`;
const SHELL = `/index.html?v=${BUILD}`;
const CORE = [SHELL, `/styles.css?v=${BUILD}`, `/state-scope.js?v=${BUILD}`, `/skill-system.js?v=${BUILD}`, `/daily-cycle.js?v=${BUILD}`, `/planner-system.js?v=${BUILD}`, `/habit-system.js?v=${BUILD}`, `/app.js?v=${BUILD}`, '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestPath=new URL(event.request.url).pathname;
  if (event.request.method !== 'GET' || requestPath.startsWith('/api/') || requestPath.startsWith('/request/')) return;
  event.respondWith(
    fetch(event.request, { cache:'no-store' })
      .then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request.mode === 'navigate' ? SHELL : event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request.mode === 'navigate' ? SHELL : event.request).then(hit => hit || caches.match(SHELL)))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(windows => {
      const existing = windows.find(client => 'focus' in client);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return clients.openWindow ? clients.openWindow(target) : undefined;
    })
  );
});

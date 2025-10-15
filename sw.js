self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  self.clients.claim();
});
// This SW mainly enables showNotification via registration; no offline cache by default.
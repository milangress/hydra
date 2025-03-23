const CACHE_NAME = 'hydra-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.js',
  '/css/style.css',
  '/css/codemirror.css',
  '/css/tomorrow-night-eighties.css',
  '/css/show-hint.css',
  '/css/modal.css',
  '/css/fontawesome.css',
  '/manifest.json',
  '/icon512_rounded.png',
  '/icon512_maskable.png',
  'https://unpkg.com/hydra-synth',
  'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js',
  'https://fonts.googleapis.com/css?family=Chivo:300,400,700'
];

// Install service worker and cache all resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
}); 
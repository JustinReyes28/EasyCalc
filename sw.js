// sw.js - Your Service Worker file

const CACHE_NAME = 'easycalc-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/arithmetic.html',
    '/datetime.html',
    '/gwa.html',
    '/health.html',
    '/scientific.html',
    '/unit-conversion.html',
    '/arithmetic.css',
    '/datetime.css',
    '/gwa.css',
    '/health.css',
    '/landing.css',
    '/scientific.css',
    '/unit-conversion.css',
    '/datetime.js',
    '/health.js',
    '/landing.js',
    '/script.js',
    '/unit-conversion.js'
    // Add all other static assets your site needs to function offline
    // e.g., images, fonts, other JS/CSS files
];

// Install event: Caches all static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Force the waiting service worker to become active
            .catch(err => console.error('Service Worker: Cache addAll failed', err))
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of un-controlled clients
    );
});

// Fetch event: Intercepts network requests
self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests and not ignore Chrome-extension:// for example
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return response;
                }

                // No cache hit - fetch from network
                console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // we can consume the stream twice: one for the browser
                        // and one for the cache.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // This catch() is triggered when `fetch()` fails
                        // (e.g., no network connection).
                        // You can return an offline page here if desired.
                        console.log('Service Worker: Fetch failed and no cache for:', event.request.url);
                        // Example: Return a custom offline page
                        // return caches.match('/offline.html');
                    });
            })
    );
});
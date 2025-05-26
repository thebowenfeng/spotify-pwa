import { BASE_URL } from "./constants";

const sw: ServiceWorkerGlobalScope = self as unknown as ServiceWorkerGlobalScope;

let isOnline: boolean | undefined = undefined;

const CACHE_KEY = 'pwa-assets';

const URLS_TO_MATCH = [
  'fonts.google.com', 
  'index.js', 
  'app.webmanifest', 
  'favicon.ico', 
  'https://static-00.iconduck.com/assets.00/spotify-icon-512x512-l4zex9yc.png',
  'woff2',
  'api.spotify.com',
  'sw.js',
];

caches.open(CACHE_KEY).then((cache) => cache.addAll(['/', '/sw.js']));

sw.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(CACHE_KEY).then(cache => {
      return cache.add('/sw.js')
    })
  )
})

const matchURL = (urlToMatch: string): boolean => {
  const exactMatch = URLS_TO_MATCH.some((url) => url === urlToMatch);
  const partialMatch = URLS_TO_MATCH.some((url) => urlToMatch.includes(url));
  return exactMatch || partialMatch;
}

const fetchAndCache = async (event: FetchEvent): Promise<Response> => {
  const retrieveCache = async () => {
    const cacheMatch = await caches.match(event.request);
    if (cacheMatch) {
      return cacheMatch;
    }
    throw Error(`No content cached for ${event.request.url}`);
  }

  try {
    const response = event.request.url === BASE_URL || event.request.url === `${BASE_URL}/` ? await fetch(event.request, { signal: AbortSignal.timeout(3000) }) : await fetch(event.request, { signal: AbortSignal.timeout(30000) });
    if (matchURL(event.request.url)) {
      const responseClone = response.clone();
      caches.open(CACHE_KEY).then((cache) => cache.put(event.request, responseClone));
    }
    return response;
  } catch (_) {
    return await retrieveCache();
  }
}

sw.addEventListener('fetch', (event) => {
  event.respondWith(fetchAndCache(event))
});
/* Learny service worker — v2 (bump to invalidate old cache) */
var CACHE_NAME = 'learny-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  var url = req.url || '';

  /* Never cache API calls — always fresh translations */
  if(url.indexOf('api.mymemory.translated.net') >= 0){
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(response){
        if(req.method === 'GET' && response.status === 200 && url.indexOf('http') === 0){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, clone); });
        }
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
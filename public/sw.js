const CACHE_NAME = 'schedule-management-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// インストールイベント
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 1) 基本ファイルをキャッシュ
      await cache.addAll(urlsToCache);
      // 2) asset-manifest からハッシュ付きビルド資産をプリキャッシュ
      try {
        const res = await fetch('/asset-manifest.json', { cache: 'no-cache' });
        if (res.ok) {
          const manifest = await res.json();
          const files = new Set();
          const addPath = (p) => {
            if (typeof p === 'string') files.add(p);
          };
          // CRAのmanifest構造を考慮
          if (manifest.files) {
            Object.values(manifest.files).forEach(addPath);
          }
          if (Array.isArray(manifest.entrypoints)) {
            manifest.entrypoints.forEach(addPath);
          }
          const toCache = Array.from(files)
            .filter((p) => typeof p === 'string')
            .map((p) => (p.startsWith('/') ? p : `/${p}`));
          await cache.addAll(toCache);
        }
      } catch (e) {
        // 取得失敗時はスキップ（初回オンラインアクセス後にランタイムキャッシュ）
      }
      await self.skipWaiting();
    })()
  );
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ナビゲーションは SPA として index.html にフォールバック
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したレスポンスをキャッシュに保存
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/index.html');
          return cached || cache.match('/offline.html');
        })
    );
    return;
  }

  // それ以外は cache-first → network の簡易戦略
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // キャッシュ可能なレスポンスのみ保存
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => undefined);
    })
  );
});

// アクティベートイベント
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

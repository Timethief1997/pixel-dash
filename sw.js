/* PIXEL DASH · Service Worker
   策略：
   - 导航请求（HTML）network-first：始终优先拿最新页面，断网时回退缓存
   - 静态资源（js / css / 图标）stale-while-revalidate：先用缓存秒开，后台静默更新
   - BGM 不进缓存（4.3MB），交给浏览器自身的 HTTP 缓存
   新版本安装后不会自动接管：页面上会出现「发现新版本」提示，点更新才 skipWaiting。 */
const VERSION = 'v7';
const CACHE = 'pixel-dash-' + VERSION;

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/icon-180.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'js/01-core.js',
  'js/02-audio.js',
  'js/03-state.js',
  'js/04-run.js',
  'js/05-meta.js',
  'js/06-input.js',
  'js/07-combat.js',
  'js/08-spawn.js',
  'js/09-shop.js',
  'js/10-render.js',
  'js/11-main.js',
  'js/12-shop.js',
  'js/13-modes.js',
  'js/14-sw.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // 不调用 skipWaiting：等页面提示用户点「立即更新」
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function cachePut(req, res) {
  if (!res || !res.ok) return;
  const cache = await caches.open(CACHE);
  try { await cache.put(req, res.clone()); } catch (e) {}
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    cachePut(req, res);
    return res;
  } catch (e) {
    const cache = await caches.open(CACHE);
    return (await cache.match(req, { ignoreSearch: true })) ||
           (await cache.match('index.html', { ignoreSearch: true })) ||
           new Response('离线状态，且本地没有可用缓存。', {
             status: 503,
             headers: { 'Content-Type': 'text/plain; charset=utf-8' },
           });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req)
    .then((res) => { cachePut(req, res); return res; })
    .catch(() => null);
  return hit || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.mp3')) return;   // BGM 不进 SW 缓存

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});

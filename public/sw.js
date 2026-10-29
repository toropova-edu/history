/* Офлайн: оболочка, шрифты и все фото кладутся в кэш при установке; аудио — при первом прослушивании или по кнопке в настройках.
   Код (html/js/css) берём из сети с запасом по таймауту — так версии файлов не расходятся; остальное — из кэша. */
const VERSION = 'imus-guide-v32';
const CORE = ['./', 'index.html', 'css/app.css', 'js/content.js', 'js/i18n.js', 'js/app.js', 'js/vendor/jsqr.min.js', 'fonts/fonts.css',
  'fonts/H4clBXOCl9bbnla_nHIq65u9uqc.woff2', 'fonts/H4clBXOCl9bbnla_nHIq75u9.woff2', 'fonts/H4clBXOCl9bbnla_nHIq4Zu9uqc.woff2',
  'fonts/nwpStKy2OAdR1K-IwhWudF-R3wsaZfrc.woff2', 'fonts/nwpStKy2OAdR1K-IwhWudF-R3w8aZQ.woff2', 'fonts/nwpStKy2OAdR1K-IwhWudF-R3wEaZfrc.woff2',
  'img/logo-512.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable.png', 'img/qr-sample.svg', 'manifest.webmanifest'];
const IMAGES = ['regalia', 'mantle', 'crown-medieval-1', 'crown-medieval-2', 'konak', 'obrenovic-silver', 'colors-crop', 'yatagan', 'death-mask', 'mihailo', 'ljubica', 'draga', 'medicine-chest', 'jewellery-brooch', 'order-milos'].map(n => `img/${n}.jpg`);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    await Promise.allSettled(IMAGES.map(u => c.add(u)));       // фото не критичны для установки
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION), net = fetch(req);
  try {
    const res = await Promise.race([net, new Promise((_, no) => setTimeout(no, 3000))]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || net;
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(VERSION), hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

/* аудио: Safari и Chrome просят файл кусками (Range), поэтому из кэша отдаём нужный отрезок */
async function slice(res, range) {
  const buf = await res.arrayBuffer(), len = buf.byteLength, m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const s = m[1] === '' ? Math.max(0, len - +m[2]) : +m[1] || 0;
  const en = m[1] === '' || m[2] === '' || m[2] === undefined ? len - 1 : Math.min(+m[2], len - 1);
  if (s >= len) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${len}` } });
  return new Response(buf.slice(s, en + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Length': en - s + 1, 'Content-Range': `bytes ${s}-${en}/${len}`, 'Accept-Ranges': 'bytes' } });
}
const isAudioRes = r => r.ok && /audio|mpeg|ogg|octet/i.test(r.headers.get('content-type') || '');   // не кладём в кэш html-заглушку вместо файла
const pending = new Set();
async function audio(e) {
  const req = e.request, cache = await caches.open(VERSION), hit = await cache.match(req.url);
  if (hit) {
    if (req.method === 'HEAD') return new Response(null, { headers: hit.headers });
    return req.headers.has('range') ? slice(hit, req.headers.get('range')) : hit;
  }
  const res = await fetch(req);
  if (req.method === 'GET' && isAudioRes(res) && !pending.has(req.url)) {
    if (res.status === 200) cache.put(req.url, res.clone());
    else if (res.status === 206) {                                   // плеер взял кусок — докачиваем файл целиком
      pending.add(req.url);
      e.waitUntil(fetch(req.url).then(r => { if (r.status === 200 && isAudioRes(r)) return cache.put(req.url, r); }).catch(() => {}).finally(() => pending.delete(req.url)));
    }
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/audio/')) { if (req.method === 'GET' || req.method === 'HEAD') e.respondWith(audio(e)); return; }
  if (req.method !== 'GET') return;
  const code = req.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/');
  e.respondWith(code ? networkFirst(req) : cacheFirst(req));
});

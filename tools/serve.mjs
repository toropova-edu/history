// Мини-сервер для разработки (с поддержкой Range для аудио). npm start → http://localhost:8080
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const ROOT = resolve(new URL('../public', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const PORT = +process.env.PORT || 8080;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4' };

createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(ROOT, p));
  let st;
  try { if (!file.startsWith(ROOT)) throw 0; st = statSync(file); if (!st.isFile()) throw 0; } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  const head = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  if (range) {
    const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, 'Content-Length': st.size });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Guide:   http://localhost:${PORT}`);
  for (const l of Object.values(networkInterfaces()).flat()) if (l.family === 'IPv4' && !l.internal) console.log(`Phone:   http://${l.address}:${PORT}  (same Wi-Fi)`);
});

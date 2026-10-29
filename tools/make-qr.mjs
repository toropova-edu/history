// Генерация QR-кодов для всех экспонатов + печатный лист A4.
//   BASE_URL=https://guide.example.org/ npm run qr       (адрес, где опубликован гид)
// Результат: qr/<id>.svg  и  qr/print.html (откройте в браузере → Печать → PDF)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import QRCode from 'qrcode';

const base = (process.env.BASE_URL || process.argv[2] || 'http://localhost:8080/').replace(/\/?$/, '/');
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../public/js/content.js', import.meta.url), 'utf8'), ctx);
const M = ctx.window.MUSEUM;
const out = new URL('../qr/', import.meta.url);
mkdirSync(out, { recursive: true });

const targets = M.items.map(i => ({ id: i.id, n: i.n, url: `${base}#/e/${i.n}`, title: i.title, sub: M.halls[i.hall].name }));
const entrance = { id: 'start', n: '', url: base, title: { sr: 'Добродошли', en: 'Welcome', ru: 'Добро пожаловать', zh: '欢迎' }, sub: M.exhibition };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SCAN = 'Скенирајте · Scan · Сканируйте · 扫码';
const phone = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>';
let cards = '';
for (const t of [entrance, ...targets]) {
  const svg = await QRCode.toString(t.url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 1, color: { dark: '#161012', light: '#FFFFFF' } });
  writeFileSync(new URL(`${t.n || t.id}.svg`, out), svg);
  cards += `<figure><div class="no">${t.n || '★'}</div><div class="qr">${svg}</div><p class="scan">${phone} ${SCAN}</p>
    <figcaption><b>${esc(t.title.sr)}</b><span>${esc(t.title.en)}</span></figcaption><img class="lg" src="../public/img/logo-512.png" alt=""></figure>\n`;
}
writeFileSync(new URL('print.html', out), `<!doctype html><html lang="sr"><meta charset="utf-8"><title>Таблице — Српски историјски музеј</title>
<style>
@page{size:A4;margin:10mm}body{font-family:system-ui,sans-serif;margin:0;color:#161012}
.sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:7mm}
figure{margin:0;border:1.2mm solid #161012;border-top:7mm solid #C6363C;border-radius:3mm;padding:5mm;text-align:center;break-inside:avoid;position:relative}
.no{position:absolute;top:-6.2mm;left:50%;transform:translateX(-50%);background:#D2AA55;border-radius:1.5mm;font:700 15pt Georgia,serif;padding:0 4mm;line-height:5.4mm;color:#161012}
.qr svg{width:62%;height:auto;display:block;margin:3mm auto 0}
.scan{margin:3mm 0 0;font-weight:700;font-size:9pt;display:flex;gap:2mm;justify-content:center;align-items:center}
figcaption{display:grid;gap:1mm;margin-top:3mm}b{font-size:12pt;line-height:1.2}span{font-size:9.5pt;color:#555}
.lg{position:absolute;right:3mm;bottom:3mm;width:9mm;opacity:.9}
</style><body><div class="sheet">${cards}</div></body></html>`);
console.log(`QR: ${targets.length + 1} шт. → qr/  (база ${base})`);

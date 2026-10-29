// One-off: download Google Fonts subsets (cyrillic, latin, latin-ext) and write a local fonts.css
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const css = readFileSync(new URL('./fonts.css', import.meta.url), 'utf8');
const blocks = css.split('/*').slice(1).map(b => '/*' + b);
let out = '';
for (const b of blocks) {
  const subset = b.match(/^\/\* ([\w-]+) \*\//)[1];
  if (!['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'].includes(subset)) continue;
  const url = b.match(/url\((https[^)]+)\)/)[1];
  const name = url.split('/').pop();
  const file = new URL('../public/fonts/' + name, import.meta.url);
  if (!existsSync(file)) writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
  out += b.replace(url, '/fonts/' + name).replace(/\n\/\*.*$/s, '').trimEnd() + '\n';
}
writeFileSync(new URL('../public/fonts/fonts.css', import.meta.url), out.replace(/\/fonts\//g, './'));
console.log('ok');

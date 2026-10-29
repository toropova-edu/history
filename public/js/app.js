/* Српски историјски музеј — водич. Без зависимостей и сборки. */
(function () {
  'use strict';
  const M = window.MUSEUM, UI = window.UI, LANGS = window.LANGS;
  const FS_STEPS = [1, 1.15, 1.3, 1.5, 1.75, 2];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NUM_RANGES = (() => { const ns = M.items.map(i => i.n).sort((a, b) => a - b), out = []; for (let i = 0, j; i < ns.length; i = j + 1) { j = i; while (ns[j + 1] === ns[j] + 1) j++; out.push(j > i ? ns[i] + '–' + ns[j] : String(ns[i])); } return out.join(', '); })();
  const find = key => M.items.find(i => i.id === key || String(i.n) === String(key)) || null;

  /* ---------------- Настройки ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('imus.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('imus.' + k, v); } catch (e) { /* приватный режим */ } }
  };
  function detectLang() {
    const q = new URLSearchParams(location.search).get('l');
    if (q && LANGS.some(l => l.code === q)) return q;
    const saved = store.get('lang');
    if (saved && LANGS.some(l => l.code === saved)) return saved;
    for (const n of navigator.languages || [navigator.language || 'en']) {
      const c = n.toLowerCase().slice(0, 2);
      if (['sr', 'hr', 'bs'].includes(c)) return 'sr';
      if (['ru', 'be', 'uk'].includes(c)) return 'ru';
      if (c === 'zh') return 'zh';
      if (c === 'en') return 'en';
    }
    return 'en';
  }
  const S = {
    lang: detectLang(),
    fs: Math.min(FS_STEPS.length - 1, Math.max(0, parseInt(store.get('fs', '0'), 10) || 0)),
    contrast: store.get('contrast', '0') === '1',
    script: store.get('script', 'cyr'),
    theme: ['system', 'light', 'dark'].includes(store.get('theme')) ? store.get('theme') : 'system'
  };
  const schemeMQ = matchMedia('(prefers-color-scheme: light)');
  const langInfo = () => LANGS.find(l => l.code === S.lang);
  const htmlLang = () => (S.lang === 'sr' && S.script === 'lat') ? 'sr-Latn' : langInfo().htmlLang;
  const tr = o => { const v = o[S.lang] ?? o.en; return S.lang === 'sr' && S.script === 'lat' ? window.cyrToLat(v) : v; };
  const ui = k => tr(UI[k]);
  const save = () => { store.set('lang', S.lang); store.set('fs', S.fs); store.set('contrast', S.contrast ? '1' : '0'); store.set('script', S.script); store.set('theme', S.theme); };
  function applySettings() {
    const r = document.documentElement;
    r.style.setProperty('--fs', FS_STEPS[S.fs]);
    r.dataset.contrast = S.contrast ? 'high' : 'normal';
    r.dataset.big = S.fs >= 3 ? '1' : '0';
    const light = S.theme === 'light' || (S.theme === 'system' && schemeMQ.matches);
    r.dataset.scheme = light ? 'light' : 'dark';
    const tc = $('#themeColor'); if (tc) tc.content = light ? '#F5EEDD' : '#161012';
    r.lang = htmlLang();
    $('#skip').textContent = ui('skip');
  }

  /* ---------------- Иконки ---------------- */
  const P = {
    crown: '<path d="M5 17.5L3.8 8.800l4.2 3.500L12 6.200l4 6.1 4.2-3.500L19 17.500zM5 20.500h14"/><path d="M3.8 6.600h.01M12 4h.01M20.2 6.600h.01" stroke-width="2.6"/>',
    sword: '<path d="M20.5 3.5c-.4 5.6-5.2 10.4-11.2 12.6L8 14.3c5.2-2 9.6-5.6 12.5-10.8z"/><path d="M6.6 13.6l3.8 3.8M8.6 15.6L4.2 20M2.8 18.6l2.6 2.6"/>',
    chest: '<path d="M4 10h16v9.5H4z"/><path d="M4 10V8.5A2.5 2.5 0 016.5 6h11A2.5 2.5 0 0120 8.5V10M10 6V4.5h4V6M12 12.2v4.6M9.7 14.5h4.6"/>',
    mask: '<path d="M6 4c4-1.5 8-1.5 12 0v8c0 4-3 8-6 8s-6-4-6-8zM9 10h1.5M13.5 10H15M12 12v3M10 17h4"/>',
    jewel: '<path d="M5 3.5c0 7.5 3 10.6 7 10.6s7-3.1 7-10.6"/><path d="M12 14.1v6.9M9.3 17h5.4"/><circle cx="12" cy="14.1" r="1.1"/>',
    portrait: '<path d="M12 2.5a7.5 9.5 0 100 19 7.5 9.5 0 000-19z"/><circle cx="12" cy="10" r="2.7"/><path d="M7.6 18.3c.9-2.7 2.6-3.9 4.4-3.9s3.5 1.200 4.4 3.9"/>',
    lock: '<path d="M12 6.3C9.7 3 6 4.4 7.4 7.1c1 1.800 3.7.2 4.6-.8 1 1 3.6 2.6 4.6.8 1.4-2.7-2.3-4.1-4.6-.8z"/><path d="M12 6.800L10.4 10.200M12 6.800l1.6 3.4"/><path d="M10 10.800c-2.4 3.200 1.6 5 -.4 10.200M12 10.800c-1.5 3.6 1.5 5.6 0 10.6M14 10.800c-1 3.6 2 5.5.8 10"/>',
    medal: '<path d="M8.5 2.5L12 7.3l3.5-4.800"/><path d="M12 8l1.7 3.4 3.800.5-2.800 2.6.7 3.7L12 16.4 8.6 18.200l.7-3.7L6.5 11.9l3.800-.5z"/>',
    monogram: '<circle cx="12" cy="12" r="9.2"/><path d="M9 7.200l.8-1.8 1.3 1.2.9-2 .9 2 1.3-1.2.8 1.800z" stroke-width="1.1"/><text x="12" y="17.3" font-size="8.2" text-anchor="middle" font-family="Cormorant, Georgia, serif" font-weight="700" fill="currentColor" stroke="none">АД</text>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    download: '<path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 20h14"/>'
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"/></svg>';

  /* ---------------- Вспомогательное ---------------- */
  const hallItems = h => M.items.filter(i => i.hall === h && i.type === 'object');
  const station = h => M.items.find(i => i.type === 'hall' && i.hall === h);
  const wingName = h => tr(M.halls[h].name).split(/\s+—\s+/)[0];
  const color = h => `style="--c:${M.halls[h].color}"`;
  const bg = it => it.images[0] ? `style="background-image:url('${it.images[0].src}')"` : '';
  const sentences = p => p.match(/[^.!?。！？…]+(?:[.!?。！？…]+["”»”)]*)?\s*/g) || [p];
  const bodyHtml = it => tr(it.text).split('\n\n').map(p => '<p>' + sentences(p).map(s => `<span class="snt">${esc(s)}</span>`).join('') + '</p>').join('');
  const langSeg = () => `<div class="lang-seg" role="group" aria-label="${esc(ui('language'))}">${LANGS.map(l => `<button type="button" data-act="lang" data-v="${l.code}" lang="${l.htmlLang}" aria-pressed="${l.code === S.lang}">${l.label}</button>`).join('')}</div>`;
  const langRow = () => `<button class="lang-row" type="button" data-act="menu"><span>${esc(ui('language'))}</span><b>${esc(langInfo().label)}</b>${ic('chev')}</button>`;
  /* «Автор, Название» → автор отдельной строкой под заголовком */
  const splitTitle = t => {
    const m = /[,，]/.exec(t), none = { by: '', title: t };
    if (!m || m.index > 40 || /[0-9]/.test(t.slice(0, m.index))) return none;
    const rest = t.slice(m.index + 1).trim(), c = rest.charAt(0);
    return c && (c !== c.toLowerCase() || c.charCodeAt(0) >= 0x4e00) ? { by: t.slice(0, m.index).trim(), title: rest } : none;
  };
  const menuBtn = `<button class="ibtn menu-btn" type="button" data-act="menu" aria-haspopup="dialog" aria-label="${esc(ui('menu'))}">${ic('menu')}</button>`;

  /* ---------------- Роутер ---------------- */
  let cleanup = null, player = null, depth = 0, firstRoute = true, onboardChecked = false;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trail = [location.hash || '#/'];
  function fadeImages(root) {            // плавное появление фото, когда загрузились
    root.querySelectorAll('.xbg, .xi, .tbg, .slide img').forEach(el => {
      el.classList.add('fi');
      const done = () => el.classList.add('ld');
      if (el.tagName === 'IMG') { if (el.complete) done(); else { el.addEventListener('load', done); el.addEventListener('error', done); } return; }
      const m = /url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage); if (!m) return done();
      const im = new Image(); im.onload = im.onerror = done; im.src = m[1]; if (im.complete) done();
    });
  }
  function stop() { if (cleanup) { cleanup(); cleanup = null; } if (player) { player.destroy(); player = null; } }
  /* пока открыто окно, страница под ним недоступна ни мыши, ни клавиатуре, ни скринридеру, и не прокручивается */
  function syncModal() {
    const open = !$('#overlay').hidden || !$('#drawerWrap').hidden || !$('#onboard').hidden || !$('#lightbox').hidden;
    ['#skip', '#bar', '#main', '#dock'].forEach(s => $(s).toggleAttribute('inert', open));
    document.body.classList.toggle('modal', open);
  }
  /* отступ под фиксированной панелью (кнопка сканирования или плеер) считаем по факту: при крупном тексте она выше */
  let dockRO = null, ctaMarkup = '';
  function watchDock() {
    if (dockRO) { dockRO.disconnect(); dockRO = null; }
    const root = document.documentElement.style, el = $('#dock').firstElementChild;
    if (!el || el.classList.contains('inline')) return root.setProperty('--dock-h', '0px');
    dockRO = new ResizeObserver(() => root.setProperty('--dock-h', Math.ceil(el.offsetHeight) + 34 + 'px'));
    dockRO.observe(el);
  }
  function setChrome(kind) {
    document.body.className = 'is-' + kind;
    const bar = $('#bar'), dock = $('#dock');
    bar.hidden = kind === 'scan'; dock.innerHTML = '';
    document.documentElement.style.setProperty('--dock-h', '0px');
    const cta = `<div class="cta"><button class="btn primary" type="button" data-act="scan">${ic('qr')}<span>${esc(ui('scan'))}</span></button>
      <button class="btn sq" type="button" data-act="number">${ic('hash')}<span>${esc(ui('number'))}</span></button></div>`;
    ctaMarkup = cta;
    if (kind === 'start') {
      bar.innerHTML = `<span class="sp"></span>${menuBtn}`;
      dock.innerHTML = cta;
    } else if (kind === 'exh') {
      bar.innerHTML = `<button class="ibtn" type="button" data-act="back" aria-label="${esc(ui('back'))}">${ic('back')}</button><span class="sp"></span>${menuBtn}`;
      dock.innerHTML = cta;
    } else if (kind !== 'scan') {
      bar.innerHTML = `<button class="ibtn" type="button" data-act="back" aria-label="${esc(ui('back'))}">${ic('back')}</button><span class="sp"></span>${menuBtn}`;
    }
    watchDock();
  }
  /* keep: перерисовка на месте (смена языка/письма) — без перехода, с тем же скроллом и фокусом */
  function route(keep) {
    stop(); closeLightbox(true);
    const y = window.scrollY, focused = keep && document.activeElement && document.activeElement.dataset ? { act: document.activeElement.dataset.act, v: document.activeElement.dataset.v } : null;
    const draw = () => {
      const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
      let v;
      if ((a === 'e' || a === 'o') && b) { const it = find(b); v = it ? viewItem(it) : viewNotFound(); }
      else if (a === 'x' && b) v = viewExhibition(b);
      else if (a === 'map') v = viewMap(b);
      else if (a === 'scan') v = viewScan();
      else v = viewStart();
      setChrome(v.kind);
      $('#main').innerHTML = v.html;
      fadeImages($('#main'));
      document.title = (v.title ? v.title + ' · ' : '') + tr(M.name);
      cleanup = v.mount ? v.mount() || null : null;
      if (keep) {
        window.scrollTo(0, y);
        const same = focused && focused.act && document.querySelector(`[data-act="${focused.act}"]${focused.v ? `[data-v="${focused.v}"]` : ''}`);
        const t = same || document.querySelector('[data-act="menu"]'); if (t) t.focus({ preventScroll: true });
        return;
      }
      window.scrollTo(0, 0);
      const h1 = $('#main h1');
      if (h1) { h1.tabIndex = -1; try { h1.focus({ preventScroll: true }); } catch (e) { /* ok */ } $('#live').textContent = h1.textContent; }
    };
    if (document.startViewTransition && !reduceMotion() && !firstRoute && !keep) { const vt = document.startViewTransition(draw); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(x => x && x.catch(() => {})); } else draw();
    if (!onboardChecked) {
      onboardChecked = true;
      const kind = (location.hash || '#/').replace(/^#[/]?/, '').split('/')[0];
      if (store.get('onb') !== '1') { if (kind === '') setTimeout(openOnb, 350); else store.set('onb', '1'); }
    }
    firstRoute = false;
  }
  const go = h => { location.hash = h; };

  /* ---------------- Старт: выбор экспозиции ---------------- */
  const rule = `<div class="rule" aria-hidden="true"><span></span><i class="orn"></i><span></span></div>`;
  function viewStart() {
    const inf = M.info;
    const cards = M.exhibitions.map(x => {
      const inner = `<span class="xi" style="background-image:url('${x.image}');background-position:${x.pos}"></span><i class="b1"></i><i class="b2"></i><i class="b3"></i>
        <span class="xb"><b>${esc(tr(x.title))}</b><small>${esc(tr(x.line))}</small>
        ${x.active ? '' : `<em>${esc(ui(x.status === 'closed' ? 'closed' : 'soon'))}</em>`}</span>${x.active ? ic('chev') : ''}`;
      return x.active ? `<a class="xcard on" href="#/x/${x.id}">${inner}</a>` : `<div class="xcard off">${inner}</div>`;
    }).join('');
    return {
      kind: 'start', title: '',
      html: `<div class="panel">
        <div class="brand"><span class="emb" aria-hidden="true"></span><h1>${esc(tr(M.name))}</h1><p>${esc(tr(inf.address))}</p></div>
        ${langSeg()}${langRow()}
        ${rule}
        <h2 class="lead">${esc(ui('chooseExhibition'))}</h2>
        <div class="xlist">${cards}</div>
        <a class="link-row" href="#/map">${ic('map')}<span>${esc(ui('mapTitle'))}</span><span class="sp"></span>${ic('chev')}</a>
        <button class="link-row" type="button" data-act="offline">${ic('download')}<span>${esc(ui('offline'))}</span><span class="sp"></span><span class="off-st" id="offSt" role="status"></span></button>
        <section class="about"><dl><div><dt>${esc(ui('hours'))}</dt><dd>${esc(tr(inf.hours))}</dd></div>
          <div><dt>${esc(ui('website'))}</dt><dd><a href="${inf.web}" target="_blank" rel="noopener">imus.org.rs</a></dd></div></dl></section>
      </div>`
    };
  }

  /* ---------------- Экспозиция ---------------- */
  function viewExhibition(id) {
    const x = M.exhibitions.find(e => e.id === id && e.active);
    if (!x) return viewNotFound();
    const tile = (k, wide) => {
      const st = station(k), parts = tr(M.halls[k].name).split(/\s+—\s+/);
      return `<a class="tile ${wide ? 'wide' : ''}" href="#/e/${st.n}" style="--c:${M.halls[k].color}"><span class="tbg" style="background-image:url('${st.images[0].src}')"></span>
        <span class="seal">${st.n}</span>${parts[1] ? `<small>${esc(parts[0])}</small><b>${esc(parts[1])}</b>` : `<b>${esc(parts[0])}</b>`}</a>`;
    };
    const sections = `<div class="bento">${tile('left')}${tile('right')}${tile('medieval', true)}
      <a class="tile map" href="#/map">${ic('map')}<b>${esc(ui('mapTitle'))}</b>${ic('chev')}</a></div>`;
    return {
      kind: 'exh', title: tr(x.title),
      html: `<header class="xhero"><div class="xbg" style="background-image:url('${x.image}');background-position:${x.pos}"></div><i class="b1"></i><i class="b2"></i><i class="b3"></i><div class="xh-in">
          <h1>${esc(tr(x.title))}</h1><p>${esc(ui('tagline'))}</p></div></header>
      <div class="panel" style="padding-top:6px">
        ${rule}
        ${sections}
        <details class="more" open><summary>${esc(ui('aboutExhibition'))}</summary><div id="introPlayer"></div><div class="prose" id="body">${tr(M.intro).split(String.fromCharCode(10, 10)).map(p => `<p>${sentences(p).map(t => `<span class="snt">${esc(t)}</span>`).join('')}</p>`).join('')}</div></details>
      </div>`,
      mount() { mountPlayer($('#introPlayer'), { id: 'exhibition-' + x.id, title: x.title, images: [] }, true); }
    };
  }
  const viewNotFound = () => ({ kind: 'item', title: '', html: `<div class="art"><h1>${esc(ui('notFound'))}</h1><p><a class="btn primary" href="#/">${esc(ui('toHome'))}</a></p></div>` });

  /* ---------------- Экспонат ---------------- */
  function viewItem(it) {
    const isHall = it.type === 'hall';
    const split = splitTitle(tr(it.title));
    const sib = isHall ? [] : hallItems(it.hall), idx = sib.indexOf(it);
    const next = !isHall && idx < sib.length - 1 ? sib[idx + 1] : null;
    const media = it.images.length ? `<div class="gallery" role="region" aria-roledescription="carousel" aria-label="${esc(tr(it.title))}"><div class="track" id="track" tabindex="0" aria-label="${esc(ui('slide'))}">${it.images.map((im, i) => `
        <figure class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${it.images.length}"><button type="button" data-act="zoom" data-i="${i}" aria-label="${esc(ui('zoom') + ': ' + tr(im.alt))}"><img src="${im.src}" alt="${esc(tr(im.alt))}" style="object-position:${im.pos || 'center'}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></button></figure>`).join('')}</div>
        <span class="zoom-ic">${ic('zoom')}</span>
        ${it.images.length > 1 ? `<div class="dots" aria-hidden="true"><div class="dots-in" id="dotsIn"><span class="pip"></span>${it.images.map(() => '<i></i>').join('')}</div></div>` : ''}</div>`
      : `<div class="noimg"><div class="medal">${ic(it.icon)}</div><span class="hint">${esc(ui('photoSoon'))}</span></div>`;
    const hallRows = isHall ? `<h2 style="margin:26px 0 4px;font-size:1.1rem">${esc(ui('hallObjects'))}</h2><ul class="rows">${hallItems(it.hall).map(o =>
      `<li><a class="row" href="#/e/${o.n}"><span class="seal">${o.n}</span><span class="t">${esc(tr(o.title))}</span>${ic('chev')}</a></li>`).join('')}</ul>` : '';
    return {
      kind: 'item', item: it, title: tr(it.title),
      html: `${media}
      <article class="art" lang="${htmlLang()}" ${color(it.hall)}>
        ${[...new Set(it.images.map(i => i.credit).filter(Boolean).map(c => tr(c)))].map(c => `<p class="credit">${esc(c)}</p>`).join('')}
        ${isHall ? '' : `<a class="where" href="#/map/${it.n}">${ic('pin')}<span>${esc(wingName(it.hall))}</span></a>`}
        <h1>${esc(split.title)}</h1>${split.by ? `<p class="byline">${esc(split.by)}</p>` : ''}
        <div class="prose" id="body">${bodyHtml(it)}</div>
        ${hallRows}
        ${next ? `<a class="next" href="#/e/${next.n}"><span class="seal">${next.n}</span><span class="t"><small>${esc(ui('next'))}</small>${esc(tr(next.title))}</span>${ic('chev')}</a>` : ''}
      </article>`,
      mount() {
        mountPlayer($('#dock'), it);
        const track = $('#track');
        if (track) track.addEventListener('scroll', () => {
          const i = Math.round(track.scrollLeft / track.clientWidth);
          const di = $('#dotsIn'); if (di) di.style.setProperty('--i', i);
        }, { passive: true });
      }
    };
  }

  /* ---------------- Аудиоплеер ---------------- */
  const probe = {};
  async function hasFile(src) {
    if (src in probe) return probe[src];
    try { const r = await fetch(src, { method: 'HEAD' }); probe[src] = r.ok && /audio|mpeg|ogg|octet/i.test(r.headers.get('content-type') || ''); }
    catch (e) { probe[src] = false; }
    return probe[src];
  }
  const fmt = s => { s = Math.max(0, Math.floor(isFinite(s) ? s : 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const RATES = [1, 1.25, 1.5, 0.75];
  /* кайма килима по нижнему краю: ступенчатые ромбы (узор пиротского ковра), в центре красная клетка */
  const KILIM = (() => {
    const c = 1.8, rows = [1, 3, 5, 7, 5, 3, 1]; let g = '', r = '';
    rows.forEach((n, i) => { g += `<rect x="${(7 - n) / 2 * c}" y="${2 + i * c}" width="${n * c}" height="${c}"/>`; });
    [2, 3, 4].forEach(i => { r += `<rect x="${3 * c}" y="${2 + i * c}" width="${c}" height="${c}"/>`; });
    g += `<rect x="${7 * c + 3}" y="${2 + 3 * c}" width="${c}" height="${c}"/>`;
    return `<svg class="kilim" aria-hidden="true" width="100%" height="17"><defs><pattern id="kl" width="20" height="17" patternUnits="userSpaceOnUse"><g class="kg">${g}</g><g class="kr">${r}</g></pattern></defs><rect width="100%" height="17" fill="url(#kl)"/><rect class="kg" width="100%" height="1"/><rect class="kg" y="16" width="100%" height="1"/></svg>`;
  })();

  function mountPlayer(dock, it, inline) {
    let mode = 'loading', destroyed = false, rateIdx = 0, playing = false, au = null;
    let sents = [], spans = [], cum = [], total = 1, pos = 0, token = 0, voice = null;
    const ttsLang = langInfo().tts, src = `audio/${it.id}.${S.lang}.mp3`;
    /* плеер рисуем только когда ясно, что звук есть (запись или голос), — без «мигающей» кнопки, которая потом исчезает */
    const html = `<section class="player ${inline ? 'inline' : ''}" aria-label="${esc(ui('listen'))}">
      <div class="p-row"><button type="button" class="p-play" id="pPlay"></button>
        <div class="p-mid">
          <div class="p-bar" id="pBar"><div class="p-line"></div><div class="p-prog" id="pProg"></div><i class="p-thumb" id="pThumb"></i><input class="p-seek" id="pSeek" type="range" min="0" max="1000" step="10" value="0" aria-label="${esc(ui('seek'))}"></div>
          <div class="p-times"><span id="pCur">0:00</span><small id="pSt"></small><span id="pTot"></span></div></div>
        <button type="button" class="p-rate" id="pRate"></button></div>
      ${KILIM}</section>`;
    dock.innerHTML = '';
    if (!inline) document.documentElement.style.setProperty('--dock-h', '114px');
    const el = id => $('#' + id, dock);
    const icon = () => { el('pPlay').innerHTML = playing ? PAUSE : PLAY; el('pPlay').setAttribute('aria-label', ui(playing ? 'pause' : 'play')); };
    const rate = () => { el('pRate').textContent = RATES[rateIdx] + '×'; el('pRate').setAttribute('aria-label', ui('speed') + ' ' + RATES[rateIdx] + '×'); };
    /* нить: тонкая линия, пройденное — золотое, ручка — ромб килима */
    let scrub = false;   // пока ведут пальцем, плеер не перебивает положение
    const paint = () => {
      const sk = el('pSeek'), bar = el('pBar'); if (!sk || !bar) return;
      const p = (+sk.value) / 1000;
      el('pProg').style.transform = 'scaleX(' + p + ')';
      el('pThumb').style.transform = 'translateX(' + (p * bar.clientWidth) + 'px) rotate(45deg)';
    };
    const setSeek = (v, force) => { const sk = el('pSeek'); if (sk && (force || !scrub)) { sk.value = v; paint(); } };
    const setTimes = (c, d) => { const a = el('pCur'), b = el('pTot'); if (a) a.textContent = fmt(c); if (b && isFinite(d)) b.textContent = fmt(d); };
    const status = (t, warn) => { const s = el('pSt'); s.textContent = t || ' '; s.classList.toggle('warn', !!warn); };
    const build = () => { if (destroyed) return false; dock.innerHTML = html; if (!inline) watchDock(); icon(); rate(); paint(); bind(); return true; };
    /* голоса/записи нет: плеер убираем, вместо него — обычная панель «Сканировать / №» и одна строка под заголовком */
    const disable = msg => {
      destroyed = true; token++; try { speechSynthesis.cancel(); } catch (e) { /* ok */ }
      if (inline) { dock.innerHTML = `<p class="note">${esc(msg)}</p>`; return; }
      dock.innerHTML = ctaMarkup; watchDock();
      const h = $('#main .art h1'); if (h && !$('#main .note')) h.insertAdjacentHTML('afterend', `<p class="note">${esc(msg)}</p>`);
    };

    const play = a => { const p = a.play(); if (p && p.catch) p.catch(err => { if (!destroyed && err.name !== 'AbortError') status(ui('audioError'), true); }); };
    function startFile() {
      mode = 'file';
      const a = au = new Audio(src); a.preload = 'metadata';
      const upd = () => {
        if (destroyed) return;
        const t = fmt(a.currentTime) + ' / ' + fmt(a.duration);
        if (a.duration) setSeek(Math.round(a.currentTime / a.duration * 1000));
        el('pSeek').setAttribute('aria-valuetext', t); setTimes(a.currentTime, a.duration);
        if ('mediaSession' in navigator && a.duration) { try { navigator.mediaSession.setPositionState({ duration: a.duration, playbackRate: a.playbackRate, position: Math.min(a.currentTime, a.duration) }); } catch (e) { /* ok */ } }
      };
      a.addEventListener('loadedmetadata', upd); a.addEventListener('timeupdate', upd);
      a.addEventListener('error', () => { if (!destroyed) { playing = false; icon(); status(ui('audioError'), true); } });
      a.addEventListener('ended', () => { if (!destroyed) { playing = false; icon(); } });
      a.addEventListener('play', () => { if (!destroyed) { playing = true; icon(); } });
      a.addEventListener('pause', () => { if (!destroyed) { playing = false; icon(); } });
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.metadata = new MediaMetadata({ title: tr(it.title), artist: tr(M.name), album: tr(M.exhibition), artwork: it.images[0] ? [{ src: it.images[0].src }] : [] }); } catch (e) { /* ok */ }
        const handlers = { play: () => play(a), pause: () => a.pause(), seekbackward: () => { a.currentTime = Math.max(0, a.currentTime - 10); }, seekforward: () => { a.currentTime = Math.min(a.duration || 0, a.currentTime + 10); }, seekto: d => { a.currentTime = d.seekTime; } };
        Object.entries(handlers).forEach(([k, h]) => { try { navigator.mediaSession.setActionHandler(k, h); } catch (e) { /* не везде есть */ } });
      }
    }
    function pickVoice() {
      const vs = speechSynthesis.getVoices(); if (!vs.length) return null;
      const pre = ttsLang.slice(0, 2).toLowerCase(), norm = v => v.lang.replace('_', '-').toLowerCase();
      const c = vs.filter(v => norm(v).startsWith(pre));
      return c.length ? (c.find(v => norm(v) === ttsLang.toLowerCase()) || c[0]) : false;
    }
    async function startTts() {
      mode = 'tts';
      const nodes = [...document.querySelectorAll('#body .snt')].filter(s => s.textContent.trim());
      spans = nodes; sents = [tr(it.title) + '.', ...nodes.map(s => s.textContent.trim())];
      let acc = 0; cum = sents.map(s => { const c = acc; acc += s.length; return c; }); total = acc || 1;
      voice = pickVoice();
      if (voice === null) { await new Promise(r => { speechSynthesis.addEventListener('voiceschanged', r, { once: true }); setTimeout(r, 1200); }); voice = pickVoice(); }
      if (destroyed) return;
      if (voice === false) { disable(ui('noVoice')); return; }
      if (build()) status(ui('ttsNote'));
    }
    const mark = i => {
      document.querySelectorAll('#body .snt.on').forEach(s => s.classList.remove('on'));
      const s = spans[i - 1]; if (!s) return;
      s.classList.add('on');
      const r = s.getBoundingClientRect(), top = 76, bottom = innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-h')) || 0) - 24;
      if (r.top < top || r.bottom > bottom) s.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
    };
    function speakFrom(i) {
      const my = ++token; speechSynthesis.cancel(); pos = Math.max(0, Math.min(sents.length - 1, i));
      setTimeout(() => {
        if (my !== token || destroyed) return;
        const u = new SpeechSynthesisUtterance(sents[pos]);
        u.lang = ttsLang; if (voice) u.voice = voice; u.rate = RATES[rateIdx];
        u.onboundary = e => { if (my === token) setSeek(Math.round((cum[pos] + (e.charIndex || 0)) / total * 1000)); };
        u.onend = () => {
          if (my !== token) return;
          if (pos + 1 < sents.length) speakFrom(pos + 1); else { playing = false; pos = 0; icon(); mark(-1); setSeek(0); }
        };
        u.onerror = e => {
          if (my !== token || e.error === 'canceled' || e.error === 'interrupted') return;
          playing = false; icon(); if (/language|voice|unavailable/.test(e.error)) disable(ui('noVoice'));
        };
        mark(pos); setSeek(Math.round(cum[pos] / total * 1000));
        speechSynthesis.speak(u);
      }, 40);
    }
    function bind() {
    el('pSeek').addEventListener('input', paint);
    const bar = el('pBar'); let dn = null;
    const frac = e => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    bar.addEventListener('pointerdown', e => { dn = true; scrub = true; bar.classList.add('scrub'); try { bar.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } setSeek(Math.round(frac(e) * 1000), true); });
    bar.addEventListener('pointermove', e => { if (dn) setSeek(Math.round(frac(e) * 1000), true); });
    bar.addEventListener('pointerup', e => { if (!dn) return; dn = null; scrub = false; bar.classList.remove('scrub'); setSeek(Math.round(frac(e) * 1000), true); el('pSeek').dispatchEvent(new Event('input')); });
    bar.addEventListener('pointercancel', () => { dn = null; scrub = false; bar.classList.remove('scrub'); });
    el('pPlay').addEventListener('click', () => {
      if (mode === 'file') { playing ? au.pause() : play(au); return; }
      if (mode !== 'tts') return;
      if (playing) { token++; speechSynthesis.cancel(); playing = false; icon(); } else { playing = true; icon(); speakFrom(pos); }
    });
    el('pRate').addEventListener('click', () => {
      rateIdx = (rateIdx + 1) % RATES.length; rate();
      if (mode === 'file') au.playbackRate = RATES[rateIdx]; else if (mode === 'tts' && playing) speakFrom(pos);
    });
    el('pSeek').addEventListener('input', e => {
      const f = e.target.value / 1000;
      if (mode === 'file' && au.duration) au.currentTime = f * au.duration;
      else if (mode === 'tts') { const c = f * total; let i = 0; while (i + 1 < cum.length && cum[i + 1] <= c) i++; if (playing) speakFrom(i); else { pos = i; mark(i); } }
    });
    }
    hasFile(src).then(ok => {
      if (destroyed) return;
      if (ok) { if (build()) startFile(); }
      else if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) startTts();
      else disable(ui('noVoice'));
    });
    player = {
      destroy() {
        destroyed = true; token++;
        if (au) { au.pause(); au.removeAttribute('src'); au.load(); au = null; }
        try { speechSynthesis.cancel(); } catch (e) { /* ok */ }
        if ('mediaSession' in navigator) ['play', 'pause', 'seekbackward', 'seekforward', 'seekto'].forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch (e) { /* ok */ } });
      }
    };
  }

  /* ---------------- Сканер QR ---------------- */
  function keyFromText(txt) {
    const m = /#\/(?:e|o)\/([\w-]+)/.exec(txt || '');
    return m && find(m[1]) ? m[1] : null;
  }
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/jsqr.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function viewScan() {
    return {
      kind: 'scan', title: ui('scan'),
      html: `<div class="scan"><video id="cam" playsinline muted></video>
        <div class="scan-top"><button class="ibtn" type="button" data-act="back" aria-label="${esc(ui('back'))}" style="background:rgba(0,0,0,.55);color:#fff">${ic('back')}</button></div>
        <div class="frame" aria-hidden="true"></div>
        <div class="scan-bot"><h1 style="font-size:1.15rem;font-family:var(--sans)">${esc(ui('scanTitle'))}</h1><p id="scanMsg" role="status">${esc(ui('camStarting'))}</p>
          <button class="btn" type="button" data-act="number">${ic('hash')}${esc(ui('number'))}</button></div></div>`,
      mount() {
        let alive = true, stream = null, timer = 0;
        const msg = t => { const m = $('#scanMsg'); if (m) { m.textContent = t; } };
        const found = txt => {
          const k = keyFromText(txt); if (!k) { msg(ui('notMuseumQr')); return false; }
          alive = false;
          try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* ok */ }
          const fr = $('.frame'); if (fr) fr.classList.add('ok');
          setTimeout(() => location.replace('#/e/' + find(k).n), reduceMotion() ? 0 : 150); return true;
        };
        (async () => {
          const video = $('#cam');
          try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
          catch (e) { const fr = $('.frame'); if (fr) fr.hidden = true; msg(ui('camDenied')); $('#scanMsg').style.color = '#FFD7D9'; return; }
          if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
          video.srcObject = stream; await video.play().catch(() => {}); msg(ui('scanHint'));
          let det = null;
          if ('BarcodeDetector' in window) { try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { det = null; } }
          if (!det) await loadJsQR();
          const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
          let lastBad = '';
          const tick = async () => {
            if (!alive) return;
            if (video.readyState >= 2 && video.videoWidth) {
              try {
                let txt = '';
                if (det) { const r = await det.detect(video); txt = r[0] ? r[0].rawValue : ''; }
                else {
                  const sc = Math.min(1, 640 / video.videoWidth); cv.width = video.videoWidth * sc; cv.height = video.videoHeight * sc;
                  cx.drawImage(video, 0, 0, cv.width, cv.height);
                  const r = window.jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' });
                  txt = r ? r.data : '';
                }
                if (txt && txt !== lastBad && found(txt)) return; else if (txt) lastBad = txt;
              } catch (e) { /* кадр не готов */ }
            }
            timer = setTimeout(tick, 160);
          };
          tick();
        })();
        return () => { alive = false; clearTimeout(timer); if (stream) stream.getTracks().forEach(t => t.stop()); };
      }
    };
  }

  /* ---------------- Карта ---------------- */
  function viewMap(key) {
    const sel = key ? find(key) : null, [W, H] = M.map.viewBox;
    const zone = (x, y, w, h, name) => {
      let parts = name.split(/\s+—\s+/);
      if (parts.length === 1 && name.length > 14 && name.includes(' ')) { const m = name.indexOf(' ', Math.floor(name.length / 2) - 4); if (m > 0) parts = [name.slice(0, m), name.slice(m + 1)]; }
      return `<rect class="zone" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>` + parts.map((p, i) => `<text class="zl" x="${x + w / 2}" y="${y + 16 + i * 12}">${esc(p)}</text>`).join('');
    };
    const zones = M.map.image ? `<image href="${M.map.image}" width="${W}" height="${H}"/>` :
      zone(15, 25, 115, 240, tr(M.halls.left.name)) + zone(270, 25, 115, 240, tr(M.halls.right.name)) +
      zone(130, 25, 140, 120, tr(M.halls.medieval.name)) +
      `<rect class="foyer" x="130" y="145" width="140" height="120" rx="4"/><text class="zl dim" x="200" y="208">${esc(ui('foyer'))}</text>`;
    const en = M.map.entrance;
    const entrance = `<path class="door" d="M${en.x - 12} ${en.y - 8} l12 -10 l12 10"/><text class="zl dim" x="${en.x}" y="${en.y + 6}">${esc(ui('entrance'))}</text>`;
    const pins = M.items.map(it => `<g class="pin ${it.type === 'hall' ? 'big' : ''} ${sel && sel.id === it.id ? 'sel' : ''}" data-pin="${it.n}" tabindex="0" role="button" aria-label="${it.n}. ${esc(tr(it.title))}" transform="translate(${it.x} ${it.y})">
      <circle class="hit" r="26" fill="transparent"/><circle class="ring" r="${it.type === 'hall' ? 18 : 15.5}"/><circle class="in" r="${it.type === 'hall' ? 15 : 12.5}"/><text>${it.n}</text></g>`).join('');
    return {
      kind: 'map', title: ui('mapTitle'),
      html: `<div class="art"><h1 style="margin-bottom:6px">${esc(ui('mapTitle'))}</h1><p style="color:var(--muted);margin:0 0 14px">${esc(ui('mapTap'))}</p>
        <svg class="map-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(ui('mapTitle'))}">${zones}${entrance}${pins}</svg>
        <div class="map-sel" id="mapSel" aria-live="polite"></div>
        <p style="color:var(--muted);font-size:.85rem;margin-top:14px">${esc(ui('mapSchematic'))}</p></div>`,
      mount() {
        const box = $('#mapSel');
        const show = n => {
          const it = find(n);
          document.querySelectorAll('.pin').forEach(p => p.classList.toggle('sel', p.dataset.pin === String(it.n)));
          box.innerHTML = `<span class="seal">${it.n}</span><span class="t">${esc(tr(it.title))}</span><a class="btn primary" style="flex:none;min-height:48px" href="#/e/${it.n}">${esc(ui('go'))}</a>`;
        };
        if (sel) show(sel.n);
        document.querySelectorAll('.pin').forEach(p => {
          p.addEventListener('click', () => show(p.dataset.pin));
          p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p.dataset.pin); } });
        });
      }
    };
  }

  /* ---------------- Листы: настройки и номер ---------------- */
  let sheetFrom = null;
  function openSheet(kind) {
    sheetFrom = document.activeElement; $('#overlay').hidden = false; syncModal(); drawSheet(kind);
    const f = $('#sheet input, #sheet button:not(.x)'); (f || $('#sheet .x')).focus();
  }
  function closeSheet(now) {
    const ov = $('#overlay'); if (ov.hidden) return;
    const fin = () => { ov.hidden = true; ov.classList.remove('out'); syncModal(); const sh = $('#sheet'); sh.innerHTML = ''; sh.style.transform = ''; sh.style.transition = ''; if (!now && sheetFrom && sheetFrom.focus) sheetFrom.focus(); };
    if (now || reduceMotion()) return fin();
    $('#sheet').style.transform = ''; ov.classList.add('out'); setTimeout(fin, 180);
  }
  /* свайп вниз по шапке листа: закрытие по расстоянию или по скорости (> 0.11 пикс/мс), у верхней границы — трение */
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const h = e.target.closest('.sheet-h, .grab'); if (!h || drag || e.target.closest('button')) return;
    drag = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0, el: h }; try { h.setPointerCapture(e.pointerId); } catch (err) { /* синтетические события */ }
    $('#sheet').style.transition = 'none';
  });
  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = e.clientY - drag.y; drag.dy = d;
    $('#sheet').style.transform = `translateY(${d > 0 ? d : d * 0.15}px)`;
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = drag.dy / Math.max(1, performance.now() - drag.t), sh = $('#sheet'), d = drag; drag = null;
    sh.style.transition = '';
    if (d.dy > 90 || v > 0.11) { sh.style.transition = 'transform .18s cubic-bezier(.23,1,.32,1)'; sh.style.transform = 'translateY(100%)'; $('#overlay').classList.add('out'); setTimeout(() => { closeSheet(true); if (sheetFrom && sheetFrom.focus) sheetFrom.focus(); }, 180); }
    else { sh.style.transition = 'transform .22s cubic-bezier(.23,1,.32,1)'; sh.style.transform = ''; setTimeout(() => { sh.style.transition = ''; }, 230); }
  };
  document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);
  function drawSheet(kind) {
    const sh = $('#sheet'); sh.dataset.kind = kind;
    {
      sh.innerHTML = `<i class="grab" aria-hidden="true"></i><div class="sheet-h"><h2 id="sheetTitle">${esc(ui('enterNumber'))}</h2><button class="x" type="button" data-act="overlay-close" aria-label="${esc(ui('close'))}">×</button></div>
        <form id="numForm"><input class="num-in" id="numIn" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" aria-label="${esc(ui('number'))}">
        <p class="hint-n">${esc(ui('plaques'))}: ${NUM_RANGES}</p><p class="err" id="numErr" role="alert"></p><button class="btn primary" style="width:100%;margin-top:6px" type="submit">${esc(ui('go'))}</button></form>`;
      $('#numIn').addEventListener('input', e => { if (e.target.value.trim().length >= 2) $('#numForm').requestSubmit(); });
      $('#numForm').addEventListener('submit', e => {
        e.preventDefault(); const it = find($('#numIn').value.trim());
        if (!it) { $('#numErr').textContent = ui('noNumber'); return; }
        closeSheet(); go('#/e/' + it.n);
      });
      return;
    }
  }

  /* ---------------- Боковое меню ---------------- */
  /* язык, оформление и доступность живут здесь; шапка остаётся лёгкой */
  const settingsHtml = () => `
    <div class="set"><div class="set-h"><b>${esc(ui('theme'))}</b></div><div class="seg three">${[['system', 'themeSystem'], ['light', 'themeLight'], ['dark', 'themeDark']].map(([v, k]) => `<button type="button" id="th-${v}" data-act="theme" data-v="${v}" aria-pressed="${S.theme === v}">${esc(ui(k))}</button>`).join('')}</div></div>
    <div class="set"><div class="set-h"><b>${esc(ui('textSize'))}</b><span class="set-v">${Math.round(FS_STEPS[S.fs] * 100)}%</span></div><div class="size-row">
      <button type="button" id="fsDown" data-act="fs-" aria-label="${esc(ui('smaller'))}" style="font-size:17px" ${S.fs === 0 ? 'disabled' : ''}>A</button>
      <div class="steps" aria-hidden="true">${FS_STEPS.map((_, i) => `<i class="${i <= S.fs ? 'on' : ''}"></i>`).join('')}</div>
      <button type="button" id="fsUp" data-act="fs+" aria-label="${esc(ui('larger'))}" style="font-size:28px" ${S.fs === FS_STEPS.length - 1 ? 'disabled' : ''}>A</button></div></div>
    <div class="set"><button type="button" class="switch" id="hc" data-act="contrast" aria-pressed="${S.contrast}"><span>${esc(ui('contrast'))}</span><span class="knob"></span></button></div>
    ${S.lang === 'sr' ? `<div class="set"><div class="set-h"><b>${esc(ui('script'))}</b></div><div class="seg"><button type="button" data-act="script" data-v="cyr" aria-pressed="${S.script === 'cyr'}">Ћирилица</button><button type="button" data-act="script" data-v="lat" aria-pressed="${S.script === 'lat'}">Latinica</button></div></div>` : ''}`;
  const drawerHtml = () => `
    <div class="dr-head"><i class="hm" aria-hidden="true"></i><h2 id="drawerTitle">${esc(tr(M.name))}</h2><button class="x" type="button" id="drClose" data-act="menu-close" aria-label="${esc(ui('close'))}">${ic('close')}</button></div>
    <button class="btn primary dr-scan" type="button" data-act="scan">${ic('qr')}<span>${esc(ui('scan'))}</span></button>
    <nav class="dr-grid" aria-label="${esc(ui('menu'))}">
      <a class="dr-tile" href="#/" data-act="menu-go"><i class="hm" aria-hidden="true"></i><span>${esc(ui('home'))}</span></a>
      <button class="dr-tile" type="button" data-act="number">${ic('hash')}<span>${esc(ui('number'))}</span></button>
      <a class="dr-tile" href="#/map" data-act="menu-go">${ic('map')}<span>${esc(ui('mapTitle'))}</span></a>
    </nav>
    <section class="dr-card" aria-label="${esc(ui('language'))}"><div class="set-h"><b>${esc(ui('language'))}</b></div>${langSeg()}</section>
    <section class="dr-card" aria-label="${esc(ui('settings'))}"><div class="dr-ct">${esc(ui('settings'))}</div>${settingsHtml()}</section>
    <div class="dr-foot">
      <button type="button" class="dr-link" data-act="offline">${ic('download')}<span>${esc(ui('offline'))}</span><span class="off-st" id="offSt" role="status"></span></button>
      <button type="button" class="dr-link" data-act="onboard">${ic('chev')}<span>${esc(ui('howTo'))}</span></button>
    </div>`;
  let drawerFrom = null;
  const drawerOpen = () => !$('#drawerWrap').hidden;
  function drawDrawer() {
    const a = document.activeElement, key = a && a.closest && a.closest('#drawer') ? (a.id ? '#' + a.id : a.dataset.act ? '[data-act="' + a.dataset.act + '"]' + (a.dataset.v ? '[data-v="' + a.dataset.v + '"]' : '') : '') : '';
    const dr = $('#drawer'), top = dr.scrollTop;
    dr.innerHTML = drawerHtml(); dr.scrollTop = top;
    const again = key && dr.querySelector(key); if (again) again.focus({ preventScroll: true });
  }
  function openDrawer() {
    if (drawerOpen()) return;
    drawerFrom = document.activeElement; $('#drawerWrap').hidden = false; syncModal(); drawDrawer(); $('#drClose').focus();
    const dr = $('#drawer'); dr.classList.add('enter'); setTimeout(() => dr.classList.remove('enter'), 600);
  }
  function closeDrawer(now) {
    const w = $('#drawerWrap'); if (w.hidden) return;
    const fin = () => { w.hidden = true; w.classList.remove('out'); $('#drawer').style.transform = ''; $('#drawer').style.transition = ''; syncModal(); $('#drawer').innerHTML = ''; if (!now) { const f = drawerFrom && drawerFrom.isConnected ? drawerFrom : document.querySelector('[data-act="menu"]'); if (f) f.focus(); } };
    if (now || reduceMotion()) return fin();
    w.classList.add('out'); setTimeout(fin, 200);
  }
  /* свайп вправо закрывает меню */
  let dsw = null;
  document.addEventListener('touchstart', e => { dsw = e.target.closest('#drawer') && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: '', t: performance.now() } : null; }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!dsw) return;
    const dx = e.touches[0].clientX - dsw.x, dy = e.touches[0].clientY - dsw.y;
    if (!dsw.lock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) dsw.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (dsw.lock === 'x') { dsw.dx = dx; const d = $('#drawer'); d.style.transition = 'none'; d.style.transform = 'translateX(' + (dx > 0 ? dx : dx * 0.15) + 'px)'; }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!dsw) return; const s = dsw; dsw = null; if (s.lock !== 'x') return;
    const d = $('#drawer');
    const v = s.dx / Math.max(1, performance.now() - s.t);
    if (s.dx > 80 || (s.dx > 24 && v > 0.11)) { d.style.transition = 'transform .18s cubic-bezier(.23,1,.32,1)'; d.style.transform = 'translateX(100%)'; setTimeout(() => closeDrawer(true), 170); setTimeout(() => { if (drawerFrom && drawerFrom.focus) drawerFrom.focus(); }, 180); }
    else { d.style.transition = 'transform .2s cubic-bezier(.23,1,.32,1)'; d.style.transform = ''; }
  }, { passive: true });

  /* ---------------- Аудио без интернета ---------------- */
  /* Service Worker кладёт в кэш каждый целиком загруженный аудиофайл, поэтому достаточно просто скачать их все */
  let offBusy = false;
  async function saveOffline() {
    const st = () => $('#offSt'), say = (t, ok) => { const e = st(); if (e) { e.textContent = t; e.classList.toggle('ok', !!ok); } };
    if (offBusy) return;
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return say(ui('offlineNA'));
    offBusy = true;
    const urls = ['exhibition-waiting', ...M.items.map(i => i.id)].map(id => 'audio/' + id + '.' + S.lang + '.mp3');
    let done = 0, total = 0;
    try {
      const have = (await Promise.all(urls.map(async u => (await hasFile(u)) ? u : null))).filter(Boolean);
      total = have.length;
      if (!total) return say(ui('offlineNone'));
      say('0/' + total);
      for (const u of have) { const r = await fetch(u); if (!r.ok) throw new Error(r.status); await r.arrayBuffer(); say(++done + '/' + total); }
      say('✓ ' + ui('offlineDone'), true);
    } catch (err) { say(ui('audioError') + (total ? ' ' + done + '/' + total : '')); }
    finally { offBusy = false; }
  }

  /* ---------------- Онбординг ---------------- */
  /* Иллюстрации онбординга — не значки, а «живые» фрагменты интерфейса и таблички */
  const ONB_ART = [
    '<i class="onb-logo" aria-hidden="true"></i>',
    `<div class="onb-qr" aria-hidden="true"><img src="img/qr-sample.svg" alt=""><i class="pl-c tl"></i><i class="pl-c tr"></i><i class="pl-c bl"></i><i class="pl-c br"></i><i class="pl-line"></i></div>`,
    `<div class="mini-player" aria-hidden="true"><span class="mp-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      <span class="mp-mid"><i class="mp-t"></i><i class="mp-bar"><b></b></i></span><span class="mp-rate">1×</span></div>`
  ];
  let onb = null;
  function openOnb() { onb = { i: 0, from: document.activeElement }; $('#onboard').hidden = false; syncModal(); drawOnb(); const b = $('#onboard .btn.primary'); if (b) b.focus(); }
  function closeOnb() {
    store.set('onb', '1'); const o = $('#onboard'); if (o.hidden) return;
    o.classList.add('out'); setTimeout(() => { o.hidden = true; o.classList.remove('out'); syncModal(); o.innerHTML = ''; if (onb && onb.from && onb.from.focus) onb.from.focus(); onb = null; }, reduceMotion() ? 0 : 200);
  }
  function onbNext() { if (onb.i >= 2) return closeOnb(); onb.i++; onbUpdate(); }
  function onbUpdate() {
    const o = $('#onboard'), btn = $('.btn.primary', o), label = ui(onb.i >= 2 ? 'onbStart' : 'onbNext');
    $('.onb-track', o).style.transform = `translateX(-${onb.i * 100}%)`;
    $('.onb-dots', o).style.setProperty('--i', onb.i);
    o.querySelectorAll('.onb-slide').forEach((sl, k) => { sl.toggleAttribute('inert', k !== onb.i); sl.classList.toggle('active', k === onb.i); });
    if (btn.dataset.l !== label) { btn.dataset.l = label; btn.innerHTML = `<span class="lbl">${esc(label)}</span>`; }   // подпись «выплывает» заново при смене
  }
  function drawOnb() {
    const o = $('#onboard'), i = onb ? onb.i : 0; o.setAttribute('aria-label', ui('howTo'));
    o.innerHTML = `<div class="onb-top"><button type="button" class="onb-skip" data-act="onb-skip">${esc(ui('onbSkip'))}</button></div>
      <div class="onb-view"><div class="onb-track">${[1, 2, 3].map((n, k) => `<section class="onb-slide ${k === i ? 'active' : ''}" ${k !== i ? 'inert' : ''}>
        <div class="onb-art-wrap">${ONB_ART[k]}</div><h2>${esc(ui('onb' + n + 't'))}</h2><p>${esc(ui('onb' + n + 'b'))}</p>${k === 0 ? langSeg() : ''}</section>`).join('')}</div></div>
      <div class="onb-dots" aria-hidden="true"><span class="onb-pill"></span><i></i><i></i><i></i></div>
      <div class="onb-cta"><button class="btn primary" type="button" data-act="onb-next"></button></div>`;
    $('.onb-track', o).style.transition = 'none'; onbUpdate(); requestAnimationFrame(() => { $('.onb-track', o).style.transition = ''; });
  }

  /* ---------------- Лайтбокс ---------------- */
  let lb = null, lbFrom = null;
  function openLightbox(it, i, from) { lb = { it, i, z: false }; lbFrom = from; drawLb(); $('#lightbox').hidden = false; syncModal(); $('#lbClose').focus(); }
  function drawLb() {
    const { it, i, z } = lb, im = it.images[i], box = $('#lightbox'); box.setAttribute('aria-label', tr(it.title));
    box.innerHTML = `<div class="lb-bar"><button type="button" id="lbClose" data-act="lb-close" aria-label="${esc(ui('close'))}">${ic('close')}</button><span style="display:flex;gap:8px">
      ${it.images.length > 1 ? `<button type="button" data-act="lb-prev" aria-label="${esc(ui('back'))}">${ic('back')}</button><button type="button" data-act="lb-next" aria-label="${esc(ui('next'))}">${ic('chev')}</button>` : ''}
      <button type="button" id="lbZoom" data-act="lb-zoom" aria-label="${esc(ui('zoom'))}" aria-pressed="${z}">${ic('zoom')}</button></span></div>
      <div class="lb-scroll ${z ? 'z' : ''}"><img src="${im.src}" alt="${esc(tr(im.alt))}"></div><div class="lb-cap">${esc(tr(im.alt))}${im.credit ? `<br><small style="opacity:.7">${esc(tr(im.credit))}</small>` : ''}</div>`;
  }
  function closeLightbox(silent) { const b = $('#lightbox'); if (b.hidden) return; b.hidden = true; syncModal(); b.innerHTML = ''; lb = null; if (!silent && lbFrom && lbFrom.focus) lbFrom.focus(); }

  /* ---------------- События (делегирование) ---------------- */
  function setLang(code) {
    S.lang = code; save(); applySettings(); closeSheet(true);
    if (!$('#onboard').hidden) drawOnb(); else { route(true); if (drawerOpen()) drawDrawer(); }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const a = t.dataset.act;
    if (a === 'menu') openDrawer();
    else if (a === 'menu-close') closeDrawer();
    else if (a === 'menu-go') closeDrawer(true);
    else if (a === 'lang') setLang(t.dataset.v);
    else if (a === 'offline') saveOffline();
    else if (a === 'onboard') { closeDrawer(true); openOnb(); }
    else if (a === 'onb-next') onbNext();
    else if (a === 'onb-skip') closeOnb();
    else if (a === 'number') { closeDrawer(true); openSheet('number'); }
    else if (a === 'overlay-close') closeSheet();
    else if (a === 'scan') { closeDrawer(true); go('#/scan'); }
    else if (a === 'back') { if (depth > 0) history.back(); else go(location.hash.startsWith('#/x/') ? '#/' : '#/x/waiting'); }
    else if (a === 'fs-') { S.fs = Math.max(0, S.fs - 1); save(); applySettings(); drawDrawer(); }
    else if (a === 'fs+') { S.fs = Math.min(FS_STEPS.length - 1, S.fs + 1); save(); applySettings(); drawDrawer(); }
    else if (a === 'contrast') { S.contrast = !S.contrast; save(); applySettings(); drawDrawer(); }
    else if (a === 'theme') { S.theme = t.dataset.v; save(); applySettings(); drawDrawer(); }
    else if (a === 'script') { S.script = t.dataset.v; save(); applySettings(); route(true); drawDrawer(); }
    else if (a === 'zoom') { const it = find(location.hash.split('/')[2]); if (it) openLightbox(it, +t.dataset.i, t); }
    else if (a === 'lb-close') closeLightbox();
    else if (a === 'lb-zoom') { lb.z = !lb.z; drawLb(); $('#lbZoom').focus(); }
    else if (a === 'lb-prev' || a === 'lb-next') { const n = lb.it.images.length; lb.i = (lb.i + (a === 'lb-next' ? 1 : n - 1)) % n; drawLb(); }
  });
  /* лайтбокс: свайп влево/вправо листает фото (если не увеличено) */
  let swipeX = null;
  document.addEventListener('touchstart', e => { swipeX = e.target.closest('.lb-scroll:not(.z)') && e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (swipeX === null || !lb || lb.it.images.length < 2) return;
    const dx = e.changedTouches[0].clientX - swipeX; swipeX = null;
    if (Math.abs(dx) > 50) { const n = lb.it.images.length; lb.i = (lb.i + (dx < 0 ? 1 : n - 1)) % n; drawLb(); }
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#onboard').hidden) return closeOnb();
    if (!$('#lightbox').hidden) closeLightbox(); else if (drawerOpen()) closeDrawer(); else closeSheet();
  });
  window.addEventListener('hashchange', () => {
    const h = location.hash || '#/';
    const back = trail.length > 1 && trail[trail.length - 2] === h;
    if (back) trail.pop(); else trail.push(h);
    depth = Math.max(0, depth + (back ? -1 : 1));
    document.documentElement.dataset.nav = back ? 'back' : 'fwd';
    closeSheet(true); closeDrawer(true); route();
  });
  window.addEventListener('pagehide', stop);
  schemeMQ.addEventListener('change', () => { if (S.theme === 'system') applySettings(); });
  applySettings(); route();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.IMUS = { keyFromText, find };
})();

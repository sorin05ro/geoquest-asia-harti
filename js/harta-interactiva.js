// HartaInteractiva: imaginea hărții + un strat SVG (măști, zone, pini), cu zoom și deplasare
// (degete, mouse, butoane) și atingere „cu confirmare”. Toate coordonatele exterioare sunt fracții 0–1,
// așa că imaginea se poate înlocui oricând cu o hartă proprie, fără a rescrie itemii.
import { h } from './ui.js';
import { centru, cutie } from './atlas-geo.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) e.setAttribute(k, v); return e; };

/**
 * @param {object} o
 *  - harta: obiectul hărții din data/atlas.json (imagine, latime, inaltime, masti_fixe, legenda)
 *  - elemente: elementele ale căror măști se pot desena
 *  - masti: true = acoperă denumirile tipărite (joc), false = hartă curată (Explorează)
 *  - ascundeLegenda: acoperă legenda (de ex. la „Spre ce ocean curge?”)
 *  - onAtinge(fx, fy): atingere (nu deplasare) pe hartă
 *  - eticheta: text alternativ
 */
export function hartaInteractiva({ harta, elemente = [], masti = true, ascundeLegenda = false, onAtinge = null, eticheta = '', clasa = '' } = {}) {
  const W = harta.latime, H = harta.inaltime;
  const img = h('picture', {},
    h('source', { srcset: harta.imagine, type: 'image/webp' }),
    h('img', { src: harta.imagine_jpg, alt: eticheta || `Harta ${harta.titlu}`, width: W, height: H, draggable: 'false', decoding: 'async' }));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'hi-strat', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  const gMasti = s('g', { class: 'hi-masti' }), gZone = s('g', { class: 'hi-zone' }), gPini = s('g', { class: 'hi-pini' });
  svg.append(gMasti, gZone, gPini);
  const scena = h('div', { class: 'hi-scena' }, img, svg);
  const cutieEl = h('div', { class: `hi ${clasa}`, style: { aspectRatio: `${W} / ${H}` } }, scena);
  const controale = h('div', { class: 'hi-controale' },
    h('button', { type: 'button', class: 'hi-btn', 'aria-label': 'Mărește harta', onclick: () => zoomLa(stare.z * 1.6) }, '+'),
    h('button', { type: 'button', class: 'hi-btn', 'aria-label': 'Micșorează harta', onclick: () => zoomLa(stare.z / 1.6) }, '−'),
    h('button', { type: 'button', class: 'hi-btn', 'aria-label': 'Toată harta', onclick: () => reset() }, '⤢'));
  // harta nu se deformează niciodată: limităm lățimea, nu înălțimea
  const radacina = h('div', { class: 'hi-cadru', style: { maxWidth: `calc(74vh * ${(W / H).toFixed(4)})` } }, cutieEl, controale);

  // ------------------------------------------------------------ măști
  const mastiEl = new Map(); // id element → [rect]
  const rect = (m, cls) => s('rect', { x: m.x * W, y: m.y * H, width: m.w * W, height: m.h * H, rx: Math.min(m.w * W, m.h * H) * .25, fill: m.culoare, class: cls });
  for (const m of harta.masti_fixe || []) gMasti.append(rect(m, 'masca fixa'));
  let legendaEl = null;
  if (harta.legenda) { legendaEl = rect(harta.legenda, 'masca legenda'); gMasti.append(legendaEl); }
  for (const e of elemente) {
    const r = e.masti.map(m => rect(m, 'masca'));
    mastiEl.set(e.id, r); gMasti.append(...r);
  }
  function arataMasti(da) { for (const r of mastiEl.values()) r.forEach(x => x.style.display = da ? '' : 'none'); }
  function arataLegenda(da) { if (legendaEl) legendaEl.style.display = da ? 'none' : ''; }
  arataMasti(masti); arataLegenda(!ascundeLegenda);

  // ------------------------------------------------------------ desene
  const R0 = Math.max(W, H) * 0.011; // raza unui pin în pixeli ai imaginii
  function deseneazaZona(el, cls = 'zona') {
    const g = el.geometrie;
    let n;
    if (g.tip === 'punct') n = s('circle', { cx: g.c[0] * W, cy: g.c[1] * H, r: Math.max(g.r * W, R0 * .9), class: cls });
    else n = s('polyline', { points: g.puncte.map(([x, y]) => `${x * W},${y * H}`).join(' '), style: `stroke-width:${Math.max(g.toleranta * W * 2, R0)}px`, class: cls + ' linie' });
    gZone.append(n); return n;
  }
  function pin(fx, fy, cls = 'pin-ales') {
    gPini.querySelectorAll('.pin-ales').forEach(p => p.remove());
    const g = s('g', { class: cls, transform: `translate(${fx * W} ${fy * H})` });
    g.append(s('circle', { r: R0 * 1.25, class: 'pin-halou' }), s('circle', { r: R0 * .55, class: 'pin-miez' }));
    gPini.append(g); return g;
  }
  function pinNumerotat(fx, fy, text, { onclick = null, cls = '' } = {}) {
    const g = s('g', { class: `pin-nr ${cls}`, transform: `translate(${fx * W} ${fy * H})`, tabindex: onclick ? 0 : null, role: onclick ? 'button' : null, 'aria-label': onclick ? `Marcajul ${text}` : null });
    g.append(s('circle', { r: R0 * 1.35 }));
    const t = s('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': R0 * 1.5 }); t.textContent = text;
    g.append(t);
    if (onclick) {
      g.addEventListener('click', (ev) => { ev.stopPropagation(); onclick(); });
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onclick(); } });
      g.addEventListener('pointerup', (ev) => ev.stopPropagation());
    }
    gPini.append(g); return g;
  }
  function descopera(el) { (mastiEl.get(el.id) || []).forEach(x => x.style.display = 'none'); }
  function curata() { gZone.replaceChildren(); gPini.replaceChildren(); }

  // ------------------------------------------------------------ zoom și deplasare
  const stare = { z: 1, tx: 0, ty: 0 };
  const ZMAX = Math.max(4, W / 400);
  function aplica() {
    const L = cutieEl.clientWidth, I = cutieEl.clientHeight;
    stare.z = Math.min(ZMAX, Math.max(1, stare.z));
    stare.tx = Math.min(0, Math.max(L - L * stare.z, stare.tx));
    stare.ty = Math.min(0, Math.max(I - I * stare.z, stare.ty));
    scena.style.transform = `translate(${stare.tx}px, ${stare.ty}px) scale(${stare.z})`;
    cutieEl.classList.toggle('marita', stare.z > 1.01);
    // pinii și liniile rămân lizibili la zoom
    svg.style.setProperty('--zoom', stare.z);
  }
  function zoomLa(z, cx = cutieEl.clientWidth / 2, cy = cutieEl.clientHeight / 2) {
    const z0 = stare.z; z = Math.min(ZMAX, Math.max(1, z));
    stare.tx = cx - (cx - stare.tx) * (z / z0); stare.ty = cy - (cy - stare.ty) * (z / z0); stare.z = z; aplica();
  }
  function reset() { stare.z = 1; stare.tx = 0; stare.ty = 0; aplica(); }
  /** mărește harta în jurul unui element (fracții) */
  function centreaza(el, factor = null) {
    const L = cutieEl.clientWidth, I = cutieEl.clientHeight; if (!L) return;
    const [x0, y0, x1, y1] = cutie(el.geometrie, W, H);
    const z = factor || Math.min(ZMAX, Math.max(1, .55 / Math.max(x1 - x0, (y1 - y0) * H / W, .05)));
    const [cx, cy] = centru(el.geometrie);
    stare.z = z; stare.tx = L / 2 - cx * L * z; stare.ty = I / 2 - cy * I * z; aplica();
  }

  const ptr = new Map(); let start = null, pinch = null, mutat = false;
  cutieEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    cutieEl.setPointerCapture?.(e.pointerId);
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1) { start = { x: e.clientX, y: e.clientY, tx: stare.tx, ty: stare.ty, t: Date.now() }; mutat = false; }
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: stare.z }; mutat = true; }
  });
  cutieEl.addEventListener('pointermove', (e) => {
    if (!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 2 && pinch) {
      const [a, b] = [...ptr.values()]; const r = cutieEl.getBoundingClientRect();
      zoomLa(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    } else if (ptr.size === 1 && start) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 7) mutat = true;
      if (mutat && stare.z > 1) { stare.tx = start.tx + dx; stare.ty = start.ty + dy; aplica(); }
    }
  });
  const sfarsit = (e) => {
    if (!ptr.has(e.pointerId)) return;
    ptr.delete(e.pointerId);
    if (ptr.size < 2) pinch = null;
    if (ptr.size === 0) {
      if (!mutat && start && e.type === 'pointerup' && onAtinge) {
        const r = scena.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) onAtinge(fx, fy);
      }
      start = null;
    }
  };
  cutieEl.addEventListener('pointerup', sfarsit);
  cutieEl.addEventListener('pointercancel', sfarsit);
  cutieEl.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey && stare.z === 1) return; // derularea paginii rămâne normală
    e.preventDefault(); const r = cutieEl.getBoundingClientRect();
    zoomLa(stare.z * (e.deltaY < 0 ? 1.25 : .8), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  new ResizeObserver(() => aplica()).observe(cutieEl);

  Object.assign(radacina, { svg, W, H, pin, pinNumerotat, deseneazaZona, descopera, arataMasti, arataLegenda, curata, centreaza, reset, zoomLa });
  return radacina;
}

/** decupaj static în jurul unui element (pentru flashcard-uri) – fără interacțiune */
export function decupajAtlas(harta, el, { masti = [], evidentiaza = true } = {}) {
  const W = harta.latime, H = harta.inaltime;
  const [x0, y0, x1, y1] = cutie(el.geometrie, W, H);
  const [cx, cy] = centru(el.geometrie);
  const lat = Math.min(1, Math.max(.28, (x1 - x0) * 1.8)), ina = Math.min(1, lat * W / H * .75);
  const vx = Math.max(0, Math.min(1 - lat, cx - lat / 2)) * W, vy = Math.max(0, Math.min(1 - ina, cy - ina / 2)) * H;
  const svg = s('svg', { viewBox: `${vx} ${vy} ${lat * W} ${ina * H}`, class: 'decupaj', role: 'img', 'aria-label': `Fragment din harta ${harta.titlu}` });
  svg.append(s('image', { href: harta.imagine_jpg, width: W, height: H }));
  for (const m of [...(harta.masti_fixe || []), ...masti]) svg.append(s('rect', { x: m.x * W, y: m.y * H, width: m.w * W, height: m.h * H, rx: 4, fill: m.culoare }));
  if (evidentiaza) {
    const g = el.geometrie; const R0 = Math.max(W, H) * 0.011;
    svg.append(g.tip === 'punct'
      ? s('circle', { cx: g.c[0] * W, cy: g.c[1] * H, r: Math.max(g.r * W, R0), class: 'zona intreaba' })
      : s('polyline', { points: g.puncte.map(([x, y]) => `${x * W},${y * H}`).join(' '), style: `stroke-width:${Math.max(g.toleranta * W * 2, R0)}px`, class: 'zona intreaba linie' }));
  }
  return h('div', { class: 'harta decupat' }, svg);
}

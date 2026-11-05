// Ajutoare de interfață: creare elemente, mascota Geo, toast, confetti, sunete.
import { incarca } from './storage.js';

export function h(tag, attrs = {}, ...copii) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of copii.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const amesteca = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Geo, bufnița-cartograf (aceeași mascotă ca în GeoQuest). stare: normal | bucuros | gandeste | trist */
export function geoSvg(stare = 'normal', marime = 64) {
  const ochi = stare === 'bucuros'
    ? '<path d="M30 44 q6 -7 12 0"/><path d="M58 44 q6 -7 12 0"/>'
    : stare === 'trist'
      ? '<path d="M30 42 q6 5 12 0"/><path d="M58 42 q6 5 12 0"/>'
      : '<circle cx="36" cy="44" r="5" fill="var(--mare)" stroke="none"/><circle cx="64" cy="44" r="5" fill="var(--mare)" stroke="none"/>';
  const extra = stare === 'gandeste'
    ? '<text x="78" y="22" font-size="22" fill="var(--pion)" font-weight="700">?</text>'
    : '<path d="M84 52 l-6 -14 a6 6 0 1 1 12 0 z" fill="var(--pion)"/>';
  return `<svg class="geo" width="${marime}" height="${marime}" viewBox="0 0 100 100" aria-hidden="true">
  <path d="M50 12 C76 12 86 34 86 58 C86 82 70 94 50 94 C30 94 14 82 14 58 C14 34 24 12 50 12 Z" fill="var(--munte)"/>
  <path d="M28 20 L22 6 L38 16 Z M72 20 L78 6 L62 16 Z" fill="var(--munte)"/>
  <path d="M50 52 C68 52 74 66 74 76 C74 88 62 92 50 92 C38 92 26 88 26 76 C26 66 32 52 50 52 Z" fill="var(--podis-pal)"/>
  <g fill="none" stroke="var(--podis)" stroke-width="2"><path d="M36 70 C42 77 58 77 64 70"/><path d="M41 79 C46 84 54 84 59 79"/></g>
  <circle cx="36" cy="44" r="13" fill="var(--hartie-geo)"/><circle cx="64" cy="44" r="13" fill="var(--hartie-geo)"/>
  <g fill="none" stroke="var(--mare)" stroke-width="3" stroke-linecap="round">${ochi}</g>
  <path d="M46 54 L50 62 L54 54 Z" fill="var(--podis)"/>${extra}</svg>`;
}

export function geoSpune(text, stare = 'normal') {
  return h('div', { class: `geo-spune geo-${stare}`, role: 'status' },
    h('span', { class: 'geo-avatar', html: geoSvg(stare, 56) }),
    h('div', { class: 'geo-bula' }, h('strong', {}, 'Geo: '), text));
}

let toastT;
export function toast(text, tip = 'info') {
  let t = document.getElementById('toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
  t.className = `toast toast-${tip} vizibil`;
  t.textContent = text;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('vizibil'), 2600);
}

const miscareRedusa = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function confetti(n = 40) {
  if (miscareRedusa()) return;
  const c = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const sim = ['🏔️', '⭐', '🌲', '🦉', '✨', '🗺️'];
  for (let i = 0; i < n; i++) {
    c.append(h('span', { style: { left: Math.random() * 100 + 'vw', animationDelay: Math.random() * .6 + 's', fontSize: 14 + Math.random() * 18 + 'px' } }, sim[i % sim.length]));
  }
  document.body.append(c);
  setTimeout(() => c.remove(), 2600);
}

let ctx;
export function sunet(tip) {
  if (!incarca().setari.sunet) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const note = { corect: [660, 880], gresit: [300, 220], insigna: [523, 659, 784, 1046], nivel: [440, 554, 659] }[tip] || [440];
    note.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(.0001, ctx.currentTime + i * .12);
      g.gain.exponentialRampToValueAtTime(.18, ctx.currentTime + i * .12 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + i * .12 + .18);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * .12); o.stop(ctx.currentTime + i * .12 + .2);
    });
  } catch (e) { /* fără sunet */ }
}

export function modal(continut, { titlu = '', inchide = true } = {}) {
  const fundal = h('div', { class: 'modal-fundal', role: 'dialog', 'aria-modal': 'true', 'aria-label': titlu });
  const cutie = h('div', { class: 'modal' }, titlu ? h('h2', {}, titlu) : null, continut);
  const close = () => fundal.remove();
  if (inchide) cutie.append(h('div', { class: 'rand-butoane' }, h('button', { class: 'btn', onclick: close }, 'Închide')));
  fundal.append(cutie);
  fundal.addEventListener('click', e => { if (e.target === fundal && inchide) close(); });
  document.body.append(fundal);
  cutie.querySelector('button, input, select')?.focus();
  return close;
}

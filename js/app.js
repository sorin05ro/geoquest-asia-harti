// GeoQuest – Hărțile Asiei: router și ecrane comune (start, flashcard-uri, profil, setări).
import { incarca, salveaza } from './storage.js';
import { h, geoSvg, geoSpune, toast, confetti } from './ui.js';
import * as E from './engine.js';
import { ecranAtlas, ecranRegiune, ecranNivelAtlas, ecranExplora } from './atlas.js';
import { decupajAtlas } from './harta-interactiva.js';
import { ecranProfesor } from './profesor.js';

const app = document.getElementById('app');
const AVATARURI = ['🦉', '🐯', '🐼', '🐘', '🦌', '🐫', '🦧', '🐻', '🦊', '🐍'];

export function antet() {
  const s = incarca(); const r = E.rang();
  document.getElementById('antet').replaceChildren(
    h('a', { href: '#/', class: 'logo', 'aria-label': 'Acasă' }, h('span', { html: geoSvg('normal', 36) }), h('span', {}, h('b', {}, 'GeoQuest'), h('small', {}, 'Hărțile Asiei'))),
    s.porecla ? h('div', { class: 'stat-antet' },
      h('span', { class: 'pastila', title: 'Seria de zile' }, '🔥 ', s.seria.zile || 0),
      h('a', { class: 'pastila', href: '#/profil', title: `Rang: ${r.nume}` }, r.icon, ' ', h('span', { class: 'ascuns-mic' }, r.nume + ' · '), s.xp, ' XP'),
      h('a', { class: 'pastila avatar', href: '#/profil', 'aria-label': 'Profil' }, s.avatar)) : '');
}

const RUTE = [
  [/^#\/?$/, acasa], [/^#\/r\/([\w-]+)$/, (id) => ecranRegiune(app, id)],
  [/^#\/n\/([\w-]+)$/, (id) => ecranNivelAtlas(app, id, { antet, reia: () => ruta() })], [/^#\/explora\/(\w+)$/, (id) => ecranExplora(app, id)],
  [/^#\/flash(?:\/(\w+))?$/, ecranFlash], [/^#\/profil$/, ecranProfil], [/^#\/setari$/, ecranSetari], [/^#\/profesor$/, () => ecranProfesor(app)],
];
function ruta() {
  const s = incarca(); aplicaSetari();
  if (!s.porecla && location.hash !== '#/profesor') { antet(); return ecranStart(); }
  const hs = location.hash || '#/';
  for (const [re, f] of RUTE) { const m = hs.match(re); if (m) { antet(); app.replaceChildren(); window.scrollTo(0, 0); f(...m.slice(1)); app.focus({ preventScroll: true }); return; } }
  location.hash = '#/';
}
export function aplicaSetari() {
  const s = incarca();
  document.documentElement.toggleAttribute('data-text-mare', !!s.setari.textMare);
  document.documentElement.toggleAttribute('data-proiectie', !!s.setari.proiectie);
}

function ecranStart() {
  let avatar = '🦉';
  const inp = h('input', { class: 'camp', id: 'porecla', maxlength: 20, placeholder: 'de ex. Cartograful Siberiei', 'aria-label': 'Porecla ta', autocomplete: 'off' });
  const av = AVATARURI.map(a => h('button', { class: 'avatar-btn', type: 'button', 'aria-pressed': String(a === avatar), 'aria-label': 'Avatar ' + a, onclick: () => { avatar = a; av.forEach(b => b.setAttribute('aria-pressed', String(b.textContent === a))); } }, a));
  app.replaceChildren(h('section', { class: 'card start' },
    h('div', { class: 'geo-mare', html: geoSvg('bucuros', 120) }),
    h('h1', {}, 'Bun venit la Hărțile Asiei!'),
    h('p', {}, 'Sunt Geo, bufnița-cartograf. Pe trei hărți ale Asiei – ape, țărmuri și relief – am acoperit denumirile. Tu trebuie să găsești unde se află fiecare râu, munte, insulă sau mare.'),
    h('label', { class: 'eticheta' }, 'Alege o poreclă (nu folosi numele tău real):', inp),
    h('p', { class: 'eticheta' }, 'Alege un avatar:'), h('div', { class: 'avatare' }, av),
    h('button', { class: 'btn mare', onclick: () => {
      const p = inp.value.trim(); if (!p) { toast('Scrie o poreclă.'); inp.focus(); return; }
      const s = incarca(); s.porecla = p.slice(0, 20); s.avatar = avatar; salveaza(); E.marcheazaZi(); location.hash = '#/'; ruta();
    } }, 'Pornim! 🧭'),
    h('p', { class: 'mic' }, 'Progresul se păstrează doar pe acest dispozitiv. Nu se colectează date personale.')));
}

function acasa() {
  const s = incarca();
  if (s.seria.zile >= 2) app.append(geoSpune(`Salut, ${s.porecla}! Ești în a ${s.seria.zile}-a zi la rând. 🔥`, 'bucuros'));
  ecranAtlas(app);
  app.append(h('h2', { class: 'titlu-sectiune' }, 'Antrenament'),
    h('div', { class: 'actiuni' },
      h('a', { class: 'actiune', href: '#/flash' }, h('span', {}, '🃏'), h('strong', {}, 'Flashcard-uri'), h('small', {}, `${E.carduriScadente(null, 999).length} de repetat azi`)),
      h('a', { class: 'actiune', href: '#/profil' }, h('span', {}, '🏅'), h('strong', {}, 'Insigne'), h('small', {}, `${s.insigne.length} / ${E.D.insigne.length}`)),
      h('a', { class: 'actiune', href: '#/setari' }, h('span', {}, '⚙️'), h('strong', {}, 'Setări'), h('small', {}, 'Sunet, text mare, proiecție'))));
}

function ecranFlash(harta) {
  const lista = E.carduriScadente(harta || null, 20); const cutii = E.statisticaLeitner();
  app.append(h('nav', { class: 'pesmet' }, h('a', { href: '#/' }, '← Acasă')), h('h1', { class: 'titlu-sectiune' }, '🃏 Flashcard-uri'),
    h('p', { class: 'leitner' }, ['Cutia 1', 'Cutia 2', 'Cutia 3', 'Cutia 4', 'Cutia 5'].map((c, i) => h('span', { class: 'cutie c' + (i + 1) }, c + ': ', h('b', {}, cutii[i])))));
  if (!lista.length) { app.append(geoSpune('Nu ai carduri de repetat acum. Elementele pe care le greșești în niveluri ajung aici.', 'bucuros')); return; }
  let i = 0, stiute = 0; const zona = h('div'); app.append(zona);
  const desen = () => {
    if (i >= lista.length) { zona.replaceChildren(geoSpune(`Gata! Ai știut ${stiute} din ${lista.length} carduri. Cele știute revin mai rar, cele greșite – mâine.`, 'bucuros'), h('a', { class: 'btn', href: '#/' }, 'Acasă')); antet(); return; }
    const c = lista[i]; const H = E.D.atlas.harti[c.atlas.harta];
    const card = h('button', { class: 'flashcard', type: 'button', 'aria-label': 'Întoarce cardul', onclick: () => { card.classList.toggle('intors'); btns.hidden = !card.classList.contains('intors'); } },
      h('div', { class: 'fata' }, h('small', {}, `Cardul ${i + 1} din ${lista.length} · atinge ca să-l întorci`),
        decupajAtlas(H, c.atlas, { masti: E.D.atlas.elemente.filter(e => e.harta === c.atlas.harta).flatMap(e => e.masti) }), h('p', {}, c.fata)),
      h('div', { class: 'verso' }, h('p', { class: 'raspuns' }, c.verso), h('small', {}, '📖 ' + c.sursa)));
    const btns = h('div', { class: 'rand-butoane', hidden: true },
      h('button', { class: 'btn sec', onclick: () => { E.raspunsCard(c.id, false); i++; desen(); } }, '✗ Nu știam'),
      h('button', { class: 'btn', onclick: () => { const ins = E.raspunsCard(c.id, true); if (ins) { confetti(); toast(`Insignă nouă: ${ins.icon} ${ins.nume}`, 'ok'); } stiute++; E.adaugaXP(2); i++; desen(); } }, '✓ Știam'));
    zona.replaceChildren(card, btns); card.focus();
  };
  desen();
}

function ecranProfil() {
  const s = incarca(); const r = E.rang();
  const stele = Object.values(s.atlas?.stele || {}).reduce((a, b) => a + b, 0);
  app.append(h('section', { class: 'card profil' },
    h('div', { class: 'avatar-mare' }, s.avatar), h('h1', {}, s.porecla),
    h('p', { class: 'rang' }, r.icon, ' ', h('strong', {}, r.nume), ` · ${s.xp} XP`),
    h('div', { class: 'progres lat', role: 'progressbar', 'aria-valuenow': Math.round(r.progres * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: { width: r.progres * 100 + '%' } })),
    h('p', { class: 'mic' }, r.urmator ? `Încă ${r.urmator.xp - s.xp} XP până la ${r.urmator.icon} ${r.urmator.nume}` : 'Ai atins rangul suprem!'),
    h('p', {}, `🔥 Seria: ${s.seria.zile || 0} zile · ⭐ ${stele} stele · 📍 ${Object.keys(s.atlas?.corecte || {}).length} elemente găsite`)),
    h('h2', { class: 'titlu-sectiune' }, `Insigne (${s.insigne.length} / ${E.D.insigne.length})`),
    h('div', { class: 'insigne' }, E.D.insigne.map(i => h('div', { class: 'insigna' + (s.insigne.includes(i.id) ? ' castigata' : '') },
      h('span', { class: 'ic' }, s.insigne.includes(i.id) ? i.icon : '🔒'), h('strong', {}, i.nume), h('small', {}, i.descriere)))),
    h('h2', { class: 'titlu-sectiune' }, 'Ranguri'),
    h('ol', { class: 'ranguri' }, E.RANGURI.map((x, k) => h('li', { class: k <= r.index ? 'atins' : '' }, x.icon, ' ', x.nume, h('small', {}, ` – ${x.xp} XP`)))));
}

function ecranSetari() {
  const s = incarca();
  const comut = (cheie, text, desc) => h('label', { class: 'comutator' }, h('input', { type: 'checkbox', id: 'set-' + cheie, checked: !!s.setari[cheie], onchange: (e) => { s.setari[cheie] = e.target.checked; salveaza(); aplicaSetari(); } }), h('span', {}, h('strong', {}, text), h('small', {}, desc)));
  const inp = h('input', { class: 'camp', id: 'porecla-set', value: s.porecla, maxlength: 20, 'aria-label': 'Porecla' });
  app.append(h('h1', { class: 'titlu-sectiune' }, '⚙️ Setări'),
    h('section', { class: 'card setari' },
      comut('sunet', 'Sunet', 'Efecte scurte la răspunsuri și insigne.'),
      comut('textMare', 'Text mare', 'Litere și butoane mai mari.'),
      comut('proiectie', 'Mod proiecție (tablă interactivă)', 'Contrast ridicat, totul mai mare.'),
      h('label', { class: 'eticheta' }, 'Porecla', inp),
      h('div', { class: 'avatare' }, AVATARURI.map(a => h('button', { class: 'avatar-btn', 'aria-pressed': String(a === s.avatar), onclick: (e) => { s.avatar = a; salveaza(); e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === a))); antet(); } }, a))),
      h('div', { class: 'rand-butoane' }, h('button', { class: 'btn', onclick: () => { if (inp.value.trim()) { s.porecla = inp.value.trim(); salveaza(); antet(); toast('Salvat.', 'ok'); } } }, 'Salvează porecla'),
        h('a', { class: 'btn sec', href: '#/profesor' }, '🔐 Modul Profesor'))));
}

window.addEventListener('hashchange', ruta);
(async () => {
  try { await E.incarcaDate(); }
  catch (e) { app.replaceChildren(h('div', { class: 'card' }, h('h1', {}, 'Nu am putut încărca datele'), h('p', {}, 'Verifică conexiunea și reîncarcă pagina.'))); return; }
  if (incarca().porecla) E.marcheazaZi();
  ruta();
})();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
export { ruta };

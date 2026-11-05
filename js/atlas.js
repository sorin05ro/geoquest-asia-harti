// GeoQuest – Atlasul Asiei: localizare pe cele trei hărți (ape, poziție și țărmuri, relief).
// Ecrane: #/ (acasă) · #/r/<regiune> · #/n/<nivel> · #/explora/<harta>
import { incarca, salveaza } from './storage.js';
import { h, geoSpune, geoSvg, toast, confetti, sunet, amesteca } from './ui.js';
import * as E from './engine.js';
import { inZona, apropiere, centru, elementLa, stele as steleAtlas } from './atlas-geo.js';
import { hartaInteractiva } from './harta-interactiva.js';

export const NIVEL_MARE = 'atlas-mare';
const NUME_EX = { gaseste: 'Găsește pe hartă', ce_e_aici: 'Ce e aici?', eticheta: 'Pune etichetele', ocean: 'Spre ce ocean curge?', clasifica: 'Ce formă de relief este?' };
const CLASE_RELIEF = ['campie', 'podis', 'munti', 'desert', 'depresiune'];

// ---------------------------------------------------------------- date + stare
export function stareAtlas() {
  const s = incarca();
  s.atlas = Object.assign({ stele: {}, corecte: {}, greseli: {}, calibrare: {}, doarVerificate: false, deblocat: false }, s.atlas || {});
  return s.atlas;
}
const A = () => E.D.atlas;
/** elementele, cu corecturile de calibrare ale profesorului aplicate peste datele din fișier */
export function elemente({ toate = false } = {}) {
  const st = stareAtlas(); const dz = new Set(incarca().dezactivate);
  return A().elemente.map(e => st.calibrare[e.id] ? { ...e, ...st.calibrare[e.id] } : e)
    .filter(e => toate || (!dz.has('atlas:' + e.id) && (!st.doarVerificate || e.verificat)));
}
export const harta = (id) => A().harti[id];
const regiuneNivel = (nid) => A().regiuni.find(r => r.niveluri.some(n => n.id === nid));

function poolNivel(nid) {
  const toate = elemente();
  if (nid === NIVEL_MARE) return toate;
  const r = regiuneNivel(nid); const n = r.niveluri.find(x => x.id === nid);
  return toate.filter(e => e.harta === r.harta && (
    (!n.categorii || n.categorii.includes(e.categorie)) && (!n.filtru || Object.entries(n.filtru).every(([k, v]) => v.includes(e[k])))
    || (n.extra_ids || []).includes(e.id)));
}

/** distractori: aceeași categorie (de preferat aceeași regiune), apoi aceeași hartă */
function distractori(el, n = 3, filtru = () => true) {
  const toate = elemente({ toate: true }).filter(e => e.id !== el.id && e.harta === el.harta && e.nume !== el.nume && filtru(e));
  const cat = toate.filter(e => e.categorie === el.categorie);
  const ales = [...amesteca(cat.filter(e => e.regiune === el.regiune)), ...amesteca(cat.filter(e => e.regiune !== el.regiune)), ...amesteca(toate.filter(e => e.categorie !== el.categorie))];
  const out = []; for (const e of ales) if (!out.some(o => o.nume === e.nume) && out.length < n) out.push(e);
  return out;
}

// ---------------------------------------------------------------- construirea unui nivel
export function construiesteNivel(nid) {
  const pool = poolNivel(nid); if (!pool.length) return [];
  const st = stareAtlas();
  let tipuri;
  if (nid === NIVEL_MARE) tipuri = ['gaseste', 'ce_e_aici', 'gaseste', 'eticheta', 'ocean', 'clasifica'];
  else tipuri = regiuneNivel(nid).niveluri.find(n => n.id === nid).tipuri;
  const total = nid === NIVEL_MARE ? 12 : Math.min(10, Math.max(8, pool.length));
  const ord = amesteca(pool).sort((a, b) => (st.greseli[b.id] || 0) - (st.greseli[a.id] || 0));
  const itemi = []; let k = 0, t = Math.floor(Math.random() * tipuri.length);
  for (let guard = 0; itemi.length < total && guard < total * 6; guard++) {
    const tip = tipuri[t++ % tipuri.length];
    const el = ord[k % ord.length];
    if (tip === 'ocean' && !el.bazin) continue;
    if (tip === 'clasifica' && !CLASE_RELIEF.includes(el.categorie)) continue;
    k++;
    if (tip === 'eticheta') {
      const alti = amesteca(pool.filter(e => e.id !== el.id && e.harta === el.harta)).filter((e, i, a) => a.findIndex(x => x.nume === e.nume) === i).slice(0, 3);
      if (alti.length < 3) { itemi.push({ tip: 'gaseste', el }); continue; }
      itemi.push({ tip, el, grup: amesteca([el, ...alti]) });
    } else itemi.push({ tip, el });
  }
  return itemi;
}

// ---------------------------------------------------------------- exerciții
function variante(lista, onAlege) {
  let ales = null;
  const btn = lista.map((txt, i) => h('button', { type: 'button', class: 'varianta', 'data-i': i, 'aria-pressed': 'false', onclick: (e) => {
    ales = i; btn.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); onAlege?.(i);
  } }, txt));
  return { el: h('div', { class: 'variante' }, btn), ales: () => ales, btn };
}

function exercitiu(item) {
  const { tip, el } = item; const H = harta(el.harta);
  const toateH = elemente({ toate: true }).filter(e => e.harta === el.harta);
  const mk = (o) => hartaInteractiva({ harta: H, elemente: toateH, eticheta: `Harta ${H.titlu}, cu denumirile acoperite`, ...o });

  if (tip === 'gaseste') {
    let atins = null, faraHarta = null;
    const hi = mk({ onAtinge: (fx, fy) => { if (faraHarta) return; atins = [fx, fy]; hi.pin(fx, fy); } });
    const alt = h('button', { type: 'button', class: 'link-mic', onclick: () => {
      // variantă accesibilă: patru marcaje numerotate, elevul alege numărul
      const opt = amesteca([el, ...distractori(el)]);
      faraHarta = { opt, ales: null };
      hi.curata();
      const v = variante(opt.map((_, i) => `Marcajul ${i + 1}`), (i) => { faraHarta.ales = i; });
      opt.forEach((o, i) => { const [x, y] = centru(o.geometrie); hi.pinNumerotat(x, y, String(i + 1), { onclick: () => v.btn[i].click() }); });
      alt.replaceWith(h('div', {}, h('p', { class: 'instr' }, 'Care marcaj arată elementul cerut?'), v.el));
    } }, '♿ Nu pot atinge precis harta – alege dintre marcaje');
    return {
      enunt: h('span', {}, 'Găsește pe hartă: ', h('strong', {}, el.nume)),
      corp: h('div', {}, h('p', { class: 'instr' }, 'Atinge locul pe hartă (poți mări harta), apoi apasă „Verifică”.'), hi, alt),
      citeste: () => faraHarta ? (faraHarta.ales === null ? null : { i: faraHarta.ales }) : atins,
      evalueaza: (a) => a.i !== undefined ? (faraHarta.opt[a.i].id === el.id ? 1 : 0) : (inZona(el.geometrie, a[0], a[1], H.latime, H.inaltime) ? 1 : 0),
      marcheaza: (a, ok) => {
        hi.descopera(el); hi.deseneazaZona(el, ok ? 'zona corect' : 'zona solutie');
        if (!ok && a.i === undefined) hi.pin(a[0], a[1], 'pin-gresit');
        hi.centreaza(el, 1.6); alt.remove();
      },
      solutie: (a) => a && a.i === undefined ? `${apropiere(el.geometrie, a[0], a[1], H.latime)} Locul corect este evidențiat, cu denumirea descoperită.` : `Răspuns: ${el.nume}.`,
      elemente: [el],
    };
  }

  if (tip === 'ce_e_aici' || tip === 'ocean' || tip === 'clasifica') {
    const hi = mk({ ascundeLegenda: tip === 'ocean' || tip === 'clasifica' });
    let opt, corect, enunt;
    if (tip === 'ce_e_aici') { opt = amesteca([el, ...distractori(el)]).map(o => o.nume); corect = opt.indexOf(el.nume); enunt = 'Ce este evidențiat pe hartă?'; }
    else if (tip === 'ocean') { const b = A().bazine; opt = ['arctic', 'pacific', 'indian', 'neagra', 'endoreic'].map(k => b[k]); corect = opt.indexOf(b[el.bazin]); enunt = 'Spre ce ocean (sau mare) curge râul evidențiat?'; }
    else { opt = CLASE_RELIEF.map(c => A().categorii[c]); corect = CLASE_RELIEF.indexOf(el.categorie); enunt = 'Ce formă de relief este evidențiată?'; }
    const v = variante(opt);
    const z = hi.deseneazaZona(el, 'zona intreaba');
    requestAnimationFrame(() => hi.centreaza(el, 1.4));
    return {
      enunt, corp: h('div', {}, hi, v.el),
      citeste: () => v.ales(),
      evalueaza: (i) => i === corect ? 1 : 0,
      marcheaza: (i, ok) => {
        v.btn[corect].classList.add('corect'); if (!ok) v.btn[i].classList.add('gresit');
        z.setAttribute('class', z.getAttribute('class').replace('intreaba', ok ? 'corect' : 'solutie'));
        hi.descopera(el); hi.arataLegenda(true);
      },
      solutie: () => tip === 'ce_e_aici' ? `Răspuns: ${el.nume}.` : `${el.nume}: ${opt[corect]}.`,
      elemente: [el],
    };
  }

  if (tip === 'eticheta') {
    const grup = item.grup; const asoc = new Map(); let etichetaAleasa = null;
    const hi = mk({});
    const pini = grup.map((g, i) => { const [x, y] = centru(g.geometrie); return hi.pinNumerotat(x, y, String(i + 1), { onclick: () => atingePin(i) }); });
    const nume = amesteca(grup.map(g => g.nume));
    const chips = nume.map(n => h('button', { type: 'button', class: 'eticheta-chip', 'aria-pressed': 'false', onclick: (e) => {
      etichetaAleasa = n; chips.forEach(c => c.setAttribute('aria-pressed', String(c === e.currentTarget)));
    } }, n));
    const tabel = h('ol', { class: 'asocieri' });
    function atingePin(i) {
      if (!etichetaAleasa) { toast('Alege întâi o denumire de sub hartă.'); return; }
      for (const [k, v] of asoc) if (v === etichetaAleasa) asoc.delete(k);
      asoc.set(i, etichetaAleasa); etichetaAleasa = null; chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      desen();
    }
    function desen() {
      chips.forEach(c => c.classList.toggle('folosit', [...asoc.values()].includes(c.textContent)));
      pini.forEach((p, i) => p.classList.toggle('completat', asoc.has(i)));
      tabel.replaceChildren(...grup.map((_, i) => h('li', {}, h('button', { type: 'button', class: 'loc-asociere', onclick: () => atingePin(i) }, asoc.get(i) || '— atinge aici sau pinul ' + (i + 1) + ' —'))));
    }
    desen();
    return {
      enunt: 'Pune fiecare denumire la marcajul potrivit.',
      corp: h('div', {}, h('p', { class: 'instr' }, 'Alege o denumire, apoi atinge marcajul numerotat (pe hartă sau în listă).'), hi, h('div', { class: 'chips' }, chips), tabel),
      citeste: () => asoc.size === grup.length ? new Map(asoc) : null,
      evalueaza: (m) => grup.filter((g, i) => m.get(i) === g.nume).length / grup.length,
      marcheaza: (m) => {
        grup.forEach((g, i) => { const ok = m.get(i) === g.nume; pini[i].classList.add(ok ? 'corect' : 'gresit'); tabel.children[i].classList.add(ok ? 'corect' : 'gresit'); hi.descopera(g); });
      },
      solutie: () => h('span', {}, 'Corect: ', grup.map((g, i) => `${i + 1} – ${g.nume}`).join(' · ')),
      elemente: grup, rezultatePe: (m) => grup.map((g, i) => [g, m.get(i) === g.nume]),
    };
  }
}

// ---------------------------------------------------------------- recompense
function inregistreaza(lista) {
  const st = stareAtlas(); const noi = [];
  for (const [el, ok] of lista) {
    if (ok) st.corecte[el.id] = true;
    else { st.greseli[el.id] = (st.greseli[el.id] || 0) + 1; E.raspunsCard('atlas:' + el.id, false); }
  }
  salveaza();
  for (const ins of A().insigne) if (ins.ids.length && ins.ids.every(id => st.corecte[id])) { const i = E.acordaInsigna(ins.id); if (i) noi.push(i); }
  return noi;
}
export function progresRegiune(r) {
  const st = stareAtlas(); const max = r.niveluri.length * 3;
  const are = r.niveluri.reduce((a, n) => a + (st.stele[n.id] || 0), 0);
  return { are, max, procent: are / max };
}
export function mareDeblocat() {
  const st = stareAtlas(); if (st.deblocat) return true;
  return A().regiuni.every(r => (st.stele[r.niveluri[r.niveluri.length - 1].id] || 0) >= 2);
}

// ---------------------------------------------------------------- ecrane
export function ecranAtlas(app) {
  const deblocat = mareDeblocat();
  app.append(
    h('header', { class: 'cap-atlas' }, h('span', { class: 'icon' }, '🗺️'), h('div', {}, h('h1', {}, 'Hărțile Asiei'), h('p', { class: 'mic' }, `${elemente().length} de elemente de găsit pe trei hărți`))),
    geoSpune('Pe aceste hărți am acoperit denumirile. Tu trebuie să știi unde se află fiecare râu, munte, insulă sau mare. Începe cu „Explorează” dacă vrei să le vezi întâi pe toate.', 'bucuros'),
    h('div', { class: 'taramuri' }, A().regiuni.map((r, i) => {
      const p = progresRegiune(r);
      return h('a', { class: 'taram', href: `#/r/${r.id}`, style: { '--c': r.culoare } },
        h('span', { class: 'icon' }, r.icon), h('span', { class: 'nr' }, `Harta ${i + 1}`), h('strong', {}, r.nume),
        h('span', { class: 'progres', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': p.max, 'aria-valuenow': p.are, 'aria-label': 'Stele' }, h('span', { style: { width: (p.procent * 100) + '%' } })),
        h('span', { class: 'mic' }, `⭐ ${p.are} / ${p.max}`));
    }),
      h(deblocat ? 'a' : 'div', { class: 'taram boss' + (deblocat ? '' : ' blocat'), href: deblocat ? `#/n/${NIVEL_MARE}` : null, style: { '--c': '#12355b' } },
        h('span', { class: 'icon' }, deblocat ? '🏆' : '🔒'), h('span', { class: 'nr' }, 'Toate hărțile'), h('strong', {}, 'Marele Atlas'),
        h('span', { class: 'mic' }, deblocat ? `12 itemi amestecați. Cea mai bună: ${'★'.repeat(stareAtlas().stele[NIVEL_MARE] || 0) || '–'}` : 'Se deschide cu cel puțin 2 stele la nivelul „Amestec” din fiecare hartă.'))),
    h('h2', { class: 'titlu-sectiune' }, 'Explorează (fără notă)'),
    h('div', { class: 'actiuni' }, Object.entries(A().harti).map(([id, m]) => h('a', { class: 'actiune', href: `#/explora/${id}` },
      h('span', {}, { hidrografie: '🌊', pozitie: '🧭', relief: '🏔️' }[id]), h('strong', {}, m.nume), h('small', {}, 'Atinge harta și află ce e acolo')))));
}

export function ecranRegiune(app, id) {
  const r = A().regiuni.find(x => x.id === id); if (!r) return (location.hash = '#/');
  const st = stareAtlas();
  app.append(h('nav', { class: 'pesmet' }, h('a', { href: '#/' }, '← Acasă')),
    h('header', { class: 'cap-taram', style: { '--c': r.culoare } }, h('span', { class: 'icon' }, r.icon), h('h1', {}, r.nume)),
    h('div', { class: 'actiuni doua' },
      h('a', { class: 'actiune', href: `#/explora/${r.harta}` }, h('span', {}, '🔍'), h('strong', {}, 'Explorează harta'), h('small', {}, 'Fără notă, cu toate denumirile')),
      h('a', { class: 'actiune', href: '#/flash' }, h('span', {}, '🃏'), h('strong', {}, 'Flashcard-uri'), h('small', {}, 'Elementele greșite revin aici'))),
    h('ol', { class: 'niveluri' }, r.niveluri.map((n, i) => {
      const s = st.stele[n.id] || 0; const nr = poolNivel(n.id).length;
      return h('li', {}, h('a', { class: 'nivel', href: `#/n/${n.id}` },
        h('span', { class: 'nr-nivel' }, i + 1), h('span', { class: 'tn' }, h('strong', {}, n.titlu), h('small', {}, `${nr} elemente · ${n.tipuri.map(t => NUME_EX[t]).join(', ')}`)),
        h('span', { class: 'stele', 'aria-label': `${s} stele din 3` }, '★'.repeat(s), h('span', { class: 'gol' }, '★'.repeat(3 - s)))));
    })));
}

export function ecranNivelAtlas(app, nid, { antet, reia }) {
  const mare = nid === NIVEL_MARE;
  if (mare && !mareDeblocat()) return (location.hash = '#/');
  const r = mare ? null : regiuneNivel(nid); if (!mare && !r) return (location.hash = '#/');
  const titlu = mare ? 'Marele Atlas' : r.niveluri.find(n => n.id === nid).titlu;
  const coada = construiesteNivel(nid).map(q => ({ q, repetat: false }));
  const inapoi = mare ? '#/' : `#/r/${r.id}`;
  const zona = h('div', { class: 'zona-nivel' });
  app.append(h('nav', { class: 'pesmet' }, h('a', { href: inapoi }, '← ' + (mare ? 'Acasă' : r.nume))), h('h1', { class: 'titlu-nivel' }, titlu), zona);
  if (!coada.length) { zona.append(geoSpune('Nu există elemente active pentru acest nivel. Profesorul le poate activa din Modul Profesor.', 'trist')); return; }
  const total = coada.length; let poz = 0, primaIncercare = 0, xpCastigat = 0, serie = 0; const insigneNoi = [];

  function urmatoarea() {
    if (poz >= coada.length) return final();
    const { q, repetat } = coada[poz]; let verificat = false;
    const ex = exercitiu(q);
    const progres = Math.min(poz, total) / total;
    const btnVer = h('button', { class: 'btn', type: 'button', onclick: () => verifica() }, 'Verifică');
    const feedback = h('div', { 'aria-live': 'polite' });
    zona.replaceChildren(
      h('div', { class: 'bara-progres', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(progres * 100) }, h('span', { style: { width: progres * 100 + '%' } })),
      h('div', { class: 'card intrebare atlas-q' },
        h('div', { class: 'meta-q' }, h('span', { class: 'eticheta-tip' }, NUME_EX[q.tip]), h('span', { class: 'eticheta-test' }, harta(q.el.harta).nume), repetat ? h('span', { class: 'eticheta-rep' }, '↻ Mai încearcă') : null),
        h('h2', { class: 'enunt' }, ex.enunt), ex.corp, feedback, h('div', { class: 'rand-butoane' }, btnVer)));
    function verifica() {
      if (verificat) return;
      const a = ex.citeste();
      if (a === null || a === undefined) { toast(q.tip === 'gaseste' ? 'Atinge mai întâi un loc pe hartă. 🙂' : 'Mai întâi răspunde complet. 🙂'); return; }
      verificat = true;
      const fr = ex.evalueaza(a); const ok = fr >= .999;
      ex.marcheaza(a, ok);
      zona.querySelectorAll('.variante button, .chips button, .loc-asociere').forEach(b => b.disabled = true);
      if (!repetat) primaIncercare += ok ? 1 : fr >= .5 ? .5 : 0;
      let xp = ok ? (repetat ? 5 : 10) : fr >= .5 ? 3 : 0;
      if (ok) { serie++; if (serie % 5 === 0) { xp += 20; toast(`Serie de ${serie}! +20 XP bonus 🔥`, 'ok'); } } else serie = 0;
      xpCastigat += xp; const rangNou = xp ? E.adaugaXP(xp) : null;
      insigneNoi.push(...inregistreaza(ex.rezultatePe ? ex.rezultatePe(a) : ex.elemente.map(e => [e, ok])));
      if (!ok && !repetat) coada.push({ q, repetat: true });
      sunet(ok ? 'corect' : 'gresit');
      const el = q.el;
      feedback.replaceChildren(h('div', { class: 'feedback ' + (ok ? 'ok' : 'nu') },
        geoSpune(h('span', {}, h('strong', {}, ok ? ['Bravo! ', 'Exact! ', 'Corect! ', 'Super! '][poz % 4] : fr >= .5 ? 'Aproape! ' : 'Nu-i nimic, învățăm! '),
          ok ? '' : ex.solutie(a), ' ', q.tip === 'eticheta' ? '' : h('span', {}, h('strong', {}, 'Știai că? '), el.info)), ok ? 'bucuros' : 'gandeste'),
        h('details', { class: 'sursa' }, h('summary', {}, '📖 Sursa'), h('p', {}, el.sursa)),
        xp ? h('p', { class: 'xp-castigat' }, `+${xp} XP`) : null));
      if (rangNou) { confetti(); toast(`Rang nou: ${rangNou.icon} ${rangNou.nume}!`, 'ok'); }
      btnVer.textContent = poz + 1 >= coada.length ? 'Vezi rezultatul' : 'Continuă →';
      btnVer.onclick = () => { poz++; urmatoarea(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      btnVer.focus({ preventScroll: true });
    }
  }

  function final() {
    const proc = primaIncercare / total; const st = steleAtlas(proc);
    const sa = stareAtlas(); if (!(sa.stele[nid] >= st)) sa.stele[nid] = st; salveaza();
    if (mare && proc >= .999) { const i = E.acordaInsigna('cartograful'); if (i) insigneNoi.push(i); }
    for (const [id, ok] of [['primul-pas', true], ['trei-stele', st === 3], ['toate-nivelurile', A().regiuni.every(r => r.niveluri.every(n => (sa.stele[n.id] || 0) >= 1))]])
      if (ok) { const i = E.acordaInsigna(id); if (i) insigneNoi.push(i); }
    E.marcheazaZi(); insigneNoi.push(...E.inregistreaza());
    if (st >= 2) confetti(); sunet(st ? 'nivel' : 'gresit');
    const lista = mare ? [] : r.niveluri; const idx = lista.findIndex(n => n.id === nid); const urm = lista[idx + 1];
    zona.replaceChildren(h('section', { class: 'card final' },
      h('div', { class: 'geo-mare', html: geoSvg(st >= 2 ? 'bucuros' : st ? 'normal' : 'trist', 110) }),
      h('h2', {}, st === 3 ? 'Ochi de cartograf!' : st === 2 ? 'Foarte bine!' : st === 1 ? 'Ai trecut nivelul!' : 'Mai încearcă o dată!'),
      h('p', { class: 'stele mari', 'aria-label': `${st} stele din 3` }, '★'.repeat(st), h('span', { class: 'gol' }, '★'.repeat(3 - st))),
      h('p', {}, `Corecte din prima: ${Math.round(proc * 100)}% · +${xpCastigat} XP`),
      h('p', { class: 'mic' }, '1★ de la 60% · 2★ de la 80% · 3★ de la 95%'),
      insigneNoi.length ? h('div', { class: 'insigne-noi' }, h('h3', {}, 'Insigne noi!'), insigneNoi.map(i => h('div', { class: 'insigna castigata' }, h('span', { class: 'ic' }, i.icon), h('strong', {}, i.nume)))) : null,
      h('div', { class: 'rand-butoane' },
        h('button', { class: 'btn sec', onclick: () => reia() }, '↻ Reia nivelul'),
        urm ? h('a', { class: 'btn', href: `#/n/${urm.id}` }, 'Nivelul următor →') : h('a', { class: 'btn', href: inapoi }, 'Înapoi'))));
    if (insigneNoi.length) { sunet('insigna'); confetti(60); }
    antet();
  }
  urmatoarea();
}

export function ecranExplora(app, hid) {
  const H = harta(hid); if (!H) return (location.hash = '#/');
  const lista = elemente({ toate: true }).filter(e => e.harta === hid);
  const fisa = h('div', { 'aria-live': 'polite' });
  let hi;
  const arata = (el) => {
    hi.curata(); hi.deseneazaZona(el, 'zona corect');
    fisa.replaceChildren(h('div', { class: 'card fisa-element' },
      h('p', { class: 'mic' }, A().categorii[el.categorie]), h('h2', {}, el.nume), h('p', {}, el.info),
      el.bazin ? h('p', { class: 'mic' }, 'Bazin: ', A().bazine[el.bazin]) : null,
      h('details', { class: 'sursa' }, h('summary', {}, '📖 Sursa'), h('p', {}, el.sursa))));
  };
  hi = hartaInteractiva({ harta: H, elemente: lista, masti: false, eticheta: `Harta ${H.titlu}`, onAtinge: (fx, fy) => {
    const el = elementLa(lista, fx, fy, H.latime, H.inaltime);
    if (el) arata(el); else { hi.curata(); hi.pin(fx, fy); fisa.replaceChildren(geoSpune('Aici nu am un element din listă. Încearcă pe o denumire, un râu sau un munte.', 'gandeste')); }
  } });
  const cauta = h('select', { class: 'camp', 'aria-label': 'Arată pe hartă', onchange: (e) => { const el = lista.find(x => x.id === e.target.value); if (el) { arata(el); hi.centreaza(el); } } },
    h('option', { value: '' }, '🔍 Arată pe hartă…'),
    Object.entries(A().categorii).filter(([c]) => lista.some(e => e.categorie === c)).map(([c, nume]) =>
      h('optgroup', { label: nume }, lista.filter(e => e.categorie === c).sort((a, b) => a.nume.localeCompare(b.nume, 'ro')).map(e => h('option', { value: e.id }, e.nume)))));
  app.append(h('nav', { class: 'pesmet' }, h('a', { href: '#/' }, '← Acasă')),
    h('h1', { class: 'titlu-sectiune' }, '🔍 Explorează: ', H.nume),
    geoSpune('Atinge harta (o poți mări cu degetele sau cu butoanele) sau alege un element din listă.', 'gandeste'),
    cauta, hi, fisa, h('p', { class: 'mic' }, 'Harta: ', H.sursa));
}

// Modul Profesor → Calibrare Atlas: profesorul mută zonele de răspuns, desenează măștile peste denumirile
// tipărite și marchează elementele verificate. Corecturile se păstrează pe dispozitiv și se exportă
// într-un atlas.json nou, care înlocuiește data/atlas.json din repository.
import { incarca, salveaza } from './storage.js';
import { h, geoSpune, toast } from './ui.js';
import * as E from './engine.js';
import { hartaInteractiva } from './harta-interactiva.js';
import { stareAtlas, elemente } from './atlas.js';

const NS = 'http://www.w3.org/2000/svg';
const rot = (v) => Math.round(v * 1e5) / 1e5;
const copie = (o) => JSON.parse(JSON.stringify(o));

/** culoarea dominantă dintr-o zonă a imaginii (ca la generator) */
async function culoareFond(H, m) {
  try {
    const img = await new Promise((ok, nu) => { const i = new Image(); i.onload = () => ok(i); i.onerror = nu; i.src = H.imagine_jpg; });
    const c = document.createElement('canvas'); const x = m.x * H.latime, y = m.y * H.inaltime, w = Math.max(1, m.w * H.latime), hh = Math.max(1, m.h * H.inaltime);
    c.width = w; c.height = hh; const ctx = c.getContext('2d'); ctx.drawImage(img, x, y, w, hh, 0, 0, w, hh);
    const d = ctx.getImageData(0, 0, w, hh).data; const cos = new Map();
    for (let i = 0; i < d.length; i += 8) {
      if (d[i] + d[i + 1] + d[i + 2] < 240) continue;
      const k = `${d[i] / 24 | 0},${d[i + 1] / 24 | 0},${d[i + 2] / 24 | 0}`; const g = cos.get(k) || [0, 0, 0, 0];
      g[0] += d[i]; g[1] += d[i + 1]; g[2] += d[i + 2]; g[3]++; cos.set(k, g);
    }
    const g = [...cos.values()].sort((a, b) => b[3] - a[3])[0]; if (!g) return '#e8eef0';
    return '#' + [g[0], g[1], g[2]].map(v => Math.round(v / g[3]).toString(16).padStart(2, '0')).join('');
  } catch (e) { return '#e8eef0'; }
}

export function tabCalibrare() {
  const s = incarca(); const st = stareAtlas(); const A = E.D.atlas;
  let hid = 'hidrografie', curent = null, lucru = null, mod = 'zona', coltMasca = null;
  const zonaEditor = h('div');
  const dz = () => new Set(incarca().dezactivate);

  const sumar = () => { const t = elemente({ toate: true }); return `${t.filter(e => e.verificat).length} din ${t.length} elemente verificate · ${Object.keys(st.calibrare).length} corectate pe acest dispozitiv`; };
  const pSumar = h('p', { class: 'mic' }, sumar());

  function exporta() {
    const date = copie(A);
    date.elemente = date.elemente.map(e => st.calibrare[e.id] ? { ...e, ...copie(st.calibrare[e.id]) } : e);
    const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(date, null, 1)], { type: 'application/json' })), download: 'atlas.json' });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const fis = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Fișier atlas.json', onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); if (!Array.isArray(d.elemente)) throw new Error('Nu este un fișier atlas.json.');
      let n = 0;
      for (const x of d.elemente) if (A.elemente.some(e => e.id === x.id)) { st.calibrare[x.id] = { geometrie: x.geometrie, masti: x.masti, verificat: !!x.verificat }; n++; }
      salveaza(); toast(`Am importat ${n} elemente.`, 'ok'); pSumar.textContent = sumar(); deseneazaLista();
    } catch (err) { toast(err.message || 'Fișier invalid.'); }
  } });

  const selHarta = h('select', { class: 'camp', 'aria-label': 'Harta', onchange: (e) => { hid = e.target.value; curent = null; deseneazaLista(); } },
    Object.entries(A.harti).map(([id, m]) => h('option', { value: id }, m.nume)));
  const lista = h('div', { class: 'lista-prof lista-atlas' });

  function deseneazaLista() {
    const d = dz();
    const el = elemente({ toate: true }).filter(e => e.harta === hid);
    lista.replaceChildren(...el.map(e => h('div', { class: 'rand-prof' + (d.has('atlas:' + e.id) ? ' inactiv' : '') + (curent === e.id ? ' ales' : '') },
      h('label', {}, h('input', { type: 'checkbox', checked: !d.has('atlas:' + e.id), 'aria-label': 'Activ în joc', onchange: (ev) => {
        const x = dz(); if (ev.target.checked) x.delete('atlas:' + e.id); else x.add('atlas:' + e.id); s.dezactivate = [...x]; salveaza(); deseneazaLista();
      } })),
      h('span', { class: 'id', title: e.verificat ? 'Verificat' : 'Neverificat' }, e.verificat ? '✅' : '⬜'),
      h('span', { class: 'tip' }, A.categorii[e.categorie]),
      h('span', { class: 'txt' }, e.nume, st.calibrare[e.id] ? h('small', {}, ' · corectat') : null, e.de_confirmat ? h('small', {}, ' · de confirmat') : null),
      h('button', { class: 'mini', onclick: () => { curent = e.id; deseneazaLista(); editor(e); } }, 'Calibrează'))));
  }

  function editor(e) {
    lucru = { geometrie: copie(e.geometrie), masti: copie(e.masti), verificat: !!e.verificat };
    const H = A.harti[hid]; coltMasca = null;
    const hi = hartaInteractiva({ harta: H, elemente: [], masti: false, eticheta: 'Harta pentru calibrare', onAtinge: (fx, fy) => atinge(fx, fy) });
    const gz = hi.svg.querySelector('.hi-zone');
    const info = h('p', { class: 'instr' });
    const W = H.latime;
    function redeseneaza() {
      hi.curata();
      hi.deseneazaZona({ geometrie: lucru.geometrie }, 'zona editare');
      for (const [i, m] of lucru.masti.entries()) {
        const r = document.createElementNS(NS, 'rect');
        Object.entries({ x: m.x * W, y: m.y * H.inaltime, width: m.w * W, height: m.h * H.inaltime, fill: m.culoare, class: 'masca-edit' }).forEach(([k, v]) => r.setAttribute(k, v));
        const t = document.createElementNS(NS, 'title'); t.textContent = `Masca ${i + 1}`; r.append(t); gz.append(r);
      }
      if (lucru.geometrie.tip === 'polilinie') lucru.geometrie.puncte.forEach(([x, y]) => hi.pin(x, y, 'pin-nod'));
      if (coltMasca) hi.pin(coltMasca[0], coltMasca[1], 'pin-ales');
      const g = lucru.geometrie;
      info.textContent = mod === 'masca' ? (coltMasca ? 'Atinge colțul opus al măștii.' : 'Atinge un colț al denumirii tipărite, apoi colțul opus.')
        : g.tip === 'punct' ? 'Atinge harta ca să muți centrul zonei. Reglează raza cu glisorul.'
          : 'Fiecare atingere adaugă un punct la capătul liniei. Reglează lățimea cu glisorul.';
      glisor.value = Math.round((g.tip === 'punct' ? g.r : g.toleranta) * W);
      eticGlisor.firstChild.textContent = (g.tip === 'punct' ? 'Raza zonei' : 'Toleranța liniei') + `: ${glisor.value} px `;
    }
    async function atinge(fx, fy) {
      const g = lucru.geometrie;
      if (mod === 'masca') {
        if (!coltMasca) { coltMasca = [fx, fy]; redeseneaza(); return; }
        const m = { x: rot(Math.min(fx, coltMasca[0])), y: rot(Math.min(fy, coltMasca[1])), w: rot(Math.abs(fx - coltMasca[0])), h: rot(Math.abs(fy - coltMasca[1])) };
        coltMasca = null;
        if (m.w < .003 || m.h < .003) { toast('Masca e prea mică.'); redeseneaza(); return; }
        m.culoare = await culoareFond(H, m); lucru.masti.push(m);
      } else if (g.tip === 'punct') g.c = [rot(fx), rot(fy)];
      else g.puncte.push([rot(fx), rot(fy)]);
      redeseneaza();
    }
    const glisor = h('input', { type: 'range', min: 3, max: Math.round(W / 6), step: 1, oninput: () => {
      const g = lucru.geometrie; const v = rot(glisor.value / W); if (g.tip === 'punct') g.r = v; else g.toleranta = v; redeseneaza();
    } });
    const eticGlisor = h('label', { class: 'eticheta' }, 'Raza ', glisor);
    const btnMod = (m, t) => h('button', { type: 'button', class: 'btn sec mic', 'aria-pressed': String(mod === m), onclick: (ev) => { mod = m; coltMasca = null; ev.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); redeseneaza(); } }, t);
    const verif = h('input', { type: 'checkbox', checked: lucru.verificat, onchange: (ev) => { lucru.verificat = ev.target.checked; } });
    zonaEditor.replaceChildren(h('section', { class: 'card editor-atlas' },
      h('h3', {}, e.nume), h('p', { class: 'mic' }, A.categorii[e.categorie], ' · ', e.info),
      h('div', { class: 'rand-butoane stanga' }, btnMod('zona', '🎯 Zona de răspuns'), btnMod('masca', '▭ Mască peste denumire')),
      h('div', { class: 'rand-butoane stanga' },
        h('button', { type: 'button', class: 'btn sec mic', onclick: () => { const g = lucru.geometrie; lucru.geometrie = g.tip === 'punct' ? { tip: 'polilinie', puncte: [], toleranta: g.r / 2 } : { tip: 'punct', c: g.puncte[0] || [.5, .5], r: g.toleranta * 2 }; redeseneaza(); } }, '⇄ Punct / linie'),
        h('button', { type: 'button', class: 'btn sec mic', onclick: () => { if (lucru.geometrie.tip === 'polilinie') { lucru.geometrie.puncte.pop(); redeseneaza(); } } }, '↶ Ultimul punct'),
        h('button', { type: 'button', class: 'btn sec mic', onclick: () => { if (lucru.geometrie.tip === 'polilinie') { lucru.geometrie.puncte = []; redeseneaza(); } } }, 'Golește linia'),
        h('button', { type: 'button', class: 'btn sec mic', onclick: () => { lucru.masti.pop(); redeseneaza(); } }, '↶ Ultima mască'),
        h('button', { type: 'button', class: 'btn sec mic', onclick: () => hi.centreaza({ geometrie: lucru.geometrie }) }, '🔍 Mărește aici')),
      eticGlisor, info, hi,
      h('label', { class: 'comutator' }, verif, h('span', {}, h('strong', {}, 'Verificat'), h('small', {}, 'Zona și măștile sunt corecte pe hartă.'))),
      h('div', { class: 'rand-butoane' },
        st.calibrare[e.id] ? h('button', { class: 'btn sec', onclick: () => { delete st.calibrare[e.id]; salveaza(); toast('Am revenit la datele din fișier.', 'ok'); pSumar.textContent = sumar(); deseneazaLista(); editor(A.elemente.find(x => x.id === e.id)); } }, 'Renunță la corecturi') : null,
        h('button', { class: 'btn', onclick: () => {
          const g = lucru.geometrie; if (g.tip === 'polilinie' && g.puncte.length < 2) { toast('Linia are nevoie de cel puțin 2 puncte.'); return; }
          st.calibrare[e.id] = copie(lucru); salveaza(); toast('Salvat pe acest dispozitiv.', 'ok'); pSumar.textContent = sumar(); deseneazaLista();
        } }, '💾 Salvează'))));
    redeseneaza();
    zonaEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  deseneazaLista();
  return h('div', {},
    h('section', { class: 'card setari' },
      geoSpune('Coordonatele Atlasului au fost puse aproximativ, după hărți. Verificați fiecare element: mutați zona de răspuns, acoperiți denumirea tipărită cu o mască și bifați „Verificat”. La final exportați atlas.json și înlocuiți data/atlas.json din repository.', 'gandeste'),
      pSumar,
      h('label', { class: 'comutator' }, h('input', { type: 'checkbox', checked: !!st.doarVerificate, onchange: (e) => { st.doarVerificate = e.target.checked; salveaza(); } }),
        h('span', {}, h('strong', {}, 'În joc, doar elementele verificate'), h('small', {}, 'Până terminați calibrarea, lăsați debifat: altfel nivelurile rămân goale.'))),
      h('label', { class: 'comutator' }, h('input', { type: 'checkbox', checked: !!st.deblocat, onchange: (e) => { st.deblocat = e.target.checked; salveaza(); } }),
        h('span', {}, h('strong', {}, 'Deblochează Marele Atlas'), h('small', {}, 'Fără condiția de 2 stele la nivelurile „Amestec”.'))),
      h('div', { class: 'rand-butoane stanga' },
        h('button', { class: 'btn sec', onclick: exporta }, '⬇ Exportă atlas.json'),
        h('label', { class: 'btn sec' }, '⬆ Importă atlas.json', fis))),
    h('section', { class: 'card' }, h('label', { class: 'eticheta' }, 'Harta', selHarta), lista),
    zonaEditor);
}

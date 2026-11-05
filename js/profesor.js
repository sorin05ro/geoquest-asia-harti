// Modul Profesor (PIN local): calibrarea hărților, greșeli frecvente, export/import al progresului.
import { incarca, salveaza, exporta, importa, reseteaza } from './storage.js';
import { h, geoSpune, toast } from './ui.js';
import * as E from './engine.js';
import { tabCalibrare } from './atlas-calibrare.js';

let deblocat = false;
const hashPin = async (p) => {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gq-harti:' + p)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return 'p:' + p; }
};

export function ecranProfesor(app) {
  const s = incarca();
  app.append(h('nav', { class: 'pesmet' }, h('a', { href: '#/' }, '← Acasă')), h('h1', { class: 'titlu-sectiune' }, '🔐 Modul Profesor'));
  if (!deblocat) {
    const inp = h('input', { class: 'camp', id: 'pin', type: 'password', inputmode: 'numeric', maxlength: 8, 'aria-label': 'PIN', autocomplete: 'off' });
    const nou = !s.pin;
    app.append(h('section', { class: 'card' },
      h('p', {}, nou ? 'Setează un PIN (4–8 cifre). Se păstrează doar pe acest dispozitiv.' : 'Introdu PIN-ul profesorului.'),
      h('label', { class: 'eticheta' }, 'PIN', inp),
      h('div', { class: 'rand-butoane' }, h('button', { class: 'btn', onclick: async () => {
        const v = inp.value.trim(); if (!/^\d{4,8}$/.test(v)) { toast('PIN-ul are 4–8 cifre.'); return; }
        const hp = await hashPin(v);
        if (nou) { s.pin = hp; salveaza(); deblocat = true; toast('PIN salvat.', 'ok'); }
        else if (hp === s.pin) deblocat = true; else { toast('PIN greșit.'); return; }
        app.replaceChildren(); ecranProfesor(app);
      } }, nou ? 'Setează PIN' : 'Intră'))));
    setTimeout(() => inp.focus(), 0);
    return;
  }
  const taburi = [['calibrare', '📍 Calibrarea hărților'], ['greseli', '📉 Greșeli frecvente'], ['date', '💾 Date și progres']];
  const zona = h('div'); let activ = 'calibrare';
  const bar = h('div', { class: 'taburi', role: 'tablist' }, taburi.map(([id, t]) => h('button', { role: 'tab', 'aria-selected': String(id === activ), onclick: (e) => { activ = id; bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === e.currentTarget))); desen(); } }, t)));
  app.append(bar, zona);
  const desen = () => zona.replaceChildren(({ calibrare: tabCalibrare, greseli: tabGreseli, date: tabDate })[activ]());
  desen();
}

function tabGreseli() {
  const g = Object.entries(incarca().atlas?.greseli || {}).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return h('section', { class: 'card' }, geoSpune('Elementele greșite cel mai des pe acest dispozitiv (de exemplu, tabla din clasă).', 'gandeste'),
    g.length ? h('ol', { class: 'lista-greseli' }, g.map(([id, n]) => { const e = E.D.atlas.elemente.find(x => x.id === id); return h('li', {}, h('strong', {}, `${n}×`), ' ', e ? e.nume : id, h('small', {}, e ? ` (${E.D.atlas.harti[e.harta].nume})` : '')); }))
      : h('p', {}, 'Încă nu există greșeli înregistrate.'));
}

function descarca(nume, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: nume }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function tabDate() {
  const s = incarca();
  const fis = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Fișier de progres', onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { importa(await f.text()); toast('Progres importat.', 'ok'); } catch (err) { toast(err.message || 'Fișier invalid.'); }
  } });
  return h('section', { class: 'card setari' },
    h('div', { class: 'rand-butoane stanga' },
      h('button', { class: 'btn sec', onclick: () => descarca(`progres-harti-${s.porecla || 'elev'}.json`, exporta()) }, '⬇ Exportă progresul'),
      h('label', { class: 'btn sec' }, '⬆ Importă progresul', fis)),
    h('div', { class: 'rand-butoane stanga' }, h('button', { class: 'btn pericol', onclick: (ev) => {
      const b = ev.currentTarget;
      if (b.dataset.sigur !== '1') { b.dataset.sigur = '1'; b.textContent = 'Apasă din nou ca să ștergi tot progresul'; return; }
      reseteaza(true); toast('Progres resetat. PIN-ul și corecturile de calibrare au rămas.', 'ok'); location.hash = '#/';
    } }, '🗑 Resetează progresul')));
}

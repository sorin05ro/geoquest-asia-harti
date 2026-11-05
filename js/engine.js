// GeoQuest – Hărțile Asiei. Motorul comun: date, XP, ranguri, seria zilnică, insigne, repetiție spațiată (Leitner).
import { incarca, salveaza } from './storage.js';
import { amesteca } from './ui.js';

export const D = { atlas: null, insigne: [] };

export async function incarcaDate() {
  const f = (p) => fetch(new URL('../' + p, import.meta.url)).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const [atlas, insigne] = await Promise.all([f('data/atlas.json'), f('data/insigne.json')]);
  D.atlas = atlas;
  D.insigne = [...insigne, ...atlas.insigne.map(i => ({ id: i.id, nume: i.nume, icon: i.icon, descriere: i.descriere }))];
}

// ---------------------------------------------------------------- ranguri și XP
export const RANGURI = [
  { nume: 'Călător', xp: 0, icon: '🎒' }, { nume: 'Explorator', xp: 150, icon: '🧭' }, { nume: 'Navigator', xp: 400, icon: '⛵' },
  { nume: 'Alpinist', xp: 800, icon: '🧗' }, { nume: 'Cartograf', xp: 1400, icon: '🗺️' }, { nume: 'Maestrul hărților', xp: 2200, icon: '👑' }];
export function rang(xp = incarca().xp) {
  let i = RANGURI.length - 1; while (i > 0 && xp < RANGURI[i].xp) i--;
  const urm = RANGURI[i + 1];
  return { ...RANGURI[i], index: i, urmator: urm || null, progres: urm ? (xp - RANGURI[i].xp) / (urm.xp - RANGURI[i].xp) : 1 };
}
export function adaugaXP(n) {
  const s = incarca(); const inainte = rang(s.xp).index;
  s.xp += n; salveaza();
  return rang(s.xp).index > inainte ? rang(s.xp) : null;
}

// ---------------------------------------------------------------- seria zilnică
const azi = () => new Date().toISOString().slice(0, 10);
export function marcheazaZi() {
  const s = incarca(); const z = azi();
  if (s.seria.ultimaZi === z) return s.seria.zile;
  const ieri = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  s.seria.zile = s.seria.ultimaZi === ieri ? s.seria.zile + 1 : 1;
  s.seria.ultimaZi = z; salveaza();
  return s.seria.zile;
}

// ---------------------------------------------------------------- insigne
export function acordaInsigna(id) {
  const s = incarca(); if (s.insigne.includes(id)) return null;
  s.insigne.push(id); salveaza();
  return D.insigne.find(i => i.id === id) || null;
}
/** după fiecare nivel: insignele legate de zile */
export function inregistreaza() {
  const s = incarca(); const noi = [];
  if (s.seria.zile >= 5) { const i = acordaInsigna('seria-de-foc'); if (i) noi.push(i); }
  return noi;
}

// ---------------------------------------------------------------- flashcard-uri + Leitner (5 cutii)
const INTERVAL = [0, 1, 2, 4, 7];
/** doar elementele greșite cel puțin o dată intră în cutii */
export function carduri() {
  const s = incarca(); const dz = new Set(s.dezactivate); const cal = s.atlas?.calibrare || {}; const out = [];
  for (const e of D.atlas.elemente) {
    const id = 'atlas:' + e.id;
    if (!s.leitner[id] || dz.has(id)) continue;
    out.push({ id, harta: e.harta, atlas: cal[e.id] ? { ...e, ...cal[e.id] } : e, fata: 'Ce element este evidențiat pe hartă?', verso: e.nume, sursa: e.sursa });
  }
  return out;
}
export function carduriScadente(harta = null, max = 20) {
  const s = incarca(); const acum = Date.now();
  const lista = carduri().filter(c => !harta || c.harta === harta);
  const scadente = lista.filter(c => { const l = s.leitner[c.id]; return !l || l.scadent <= acum; });
  scadente.sort((a, b) => (s.leitner[a.id]?.cutie || 0) - (s.leitner[b.id]?.cutie || 0));
  return amesteca(scadente.slice(0, max * 2)).slice(0, max);
}
export function raspunsCard(id, stiut) {
  const s = incarca(); const l = s.leitner[id] || { cutie: 1 };
  l.cutie = stiut ? Math.min(5, l.cutie + 1) : 1;
  l.scadent = Date.now() + INTERVAL[l.cutie - 1] * 864e5;
  s.leitner[id] = l; salveaza();
  const in5 = Object.values(s.leitner).filter(x => x.cutie === 5).length;
  return in5 >= 10 ? acordaInsigna('memorie-de-bufnita') : null;
}
export function statisticaLeitner() {
  const s = incarca(); const c = [0, 0, 0, 0, 0];
  for (const v of Object.values(s.leitner)) c[v.cutie - 1]++;
  return c;
}

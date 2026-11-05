// Strat de stocare înlocuibil (azi localStorage; mâine, eventual, un server din UE).
// Orice citire/scriere e protejată: dacă stocarea nu e disponibilă, progresul rămâne doar în sesiune.
const CHEIE = 'geoquest-asia-harti-v1';
let memorie = null;

export const stareImplicita = () => ({
  porecla: '', avatar: '🦉', xp: 0, insigne: [], stele: {}, seria: { ultimaZi: '', zile: 0 },
  leitner: {}, contoare: {}, setari: { sunet: false, textMare: false },
  pin: '', dezactivate: [], atlas: null
});

export function incarca() {
  if (memorie) return memorie;
  let s = null;
  try { s = JSON.parse(localStorage.getItem(CHEIE) || 'null'); } catch (e) { s = null; }
  memorie = Object.assign(stareImplicita(), s || {});
  memorie.setari = Object.assign(stareImplicita().setari, memorie.setari || {});
  return memorie;
}

export function salveaza() {
  try { localStorage.setItem(CHEIE, JSON.stringify(memorie)); return true; } catch (e) { return false; }
}

export function reseteaza(pastreazaPin = true) {
  const pin = memorie?.pin || ''; const calibrare = memorie?.atlas?.calibrare;
  memorie = stareImplicita();
  if (pastreazaPin) memorie.pin = pin;
  if (calibrare) memorie.atlas = { calibrare }; // corecturile profesorului nu se pierd la resetarea progresului
  salveaza();
  return memorie;
}

export function exporta() { return JSON.stringify(memorie, null, 1); }
export function importa(text) {
  const s = JSON.parse(text);
  if (typeof s !== 'object' || s === null || typeof s.xp !== 'number') throw new Error('Fișier de progres invalid.');
  memorie = Object.assign(stareImplicita(), s);
  salveaza();
  return memorie;
}

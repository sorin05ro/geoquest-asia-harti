// Atlasul Asiei – geometrie pură (fără DOM), folosită de joc, de editor și de testele automate.
// Coordonatele sunt fracții (0–1) din imagine; distanțele se calculează în pixeli ai imaginii,
// ca un cerc să rămână cerc indiferent de raportul lățime/înălțime.

/** distanța (în pixeli ai imaginii) de la punctul (fx, fy) la zona elementului; 0 = înăuntru */
export function distantaLaZona(geom, fx, fy, W, H) {
  const px = fx * W, py = fy * H;
  if (geom.tip === 'punct') {
    const d = Math.hypot(px - geom.c[0] * W, py - geom.c[1] * H);
    return Math.max(0, d - geom.r * W);
  }
  const pts = geom.puncte.map(([x, y]) => [x * W, y * H]);
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) min = Math.min(min, distSegment(px, py, pts[i], pts[i + 1]));
  if (pts.length === 1) min = Math.hypot(px - pts[0][0], py - pts[0][1]);
  return Math.max(0, min - geom.toleranta * W);
}

function distSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** atingerea este acceptată? (cu o mică marjă pentru degete) */
export function inZona(geom, fx, fy, W, H, marja = 0.006) { return distantaLaZona(geom, fx, fy, W, H) <= marja * W; }

/** punctul „reprezentativ” al unui element (pentru pini, etichete, decupaje) */
export function centru(geom) {
  if (geom.tip === 'punct') return geom.c;
  const p = geom.puncte;
  if (p.length === 1) return p[0];
  // mijlocul lungimii poliliniei
  const seg = []; let tot = 0;
  for (let i = 0; i < p.length - 1; i++) { const l = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); seg.push(l); tot += l; }
  let rest = tot / 2;
  for (let i = 0; i < seg.length; i++) {
    if (rest <= seg[i]) { const t = seg[i] ? rest / seg[i] : 0; return [p[i][0] + t * (p[i + 1][0] - p[i][0]), p[i][1] + t * (p[i + 1][1] - p[i][1])]; }
    rest -= seg[i];
  }
  return p[p.length - 1];
}

/** dreptunghiul care cuprinde zona (fracții): [x0, y0, x1, y1] */
export function cutie(geom, W, H) {
  if (geom.tip === 'punct') {
    const rx = geom.r, ry = geom.r * W / H;
    return [geom.c[0] - rx, geom.c[1] - ry, geom.c[0] + rx, geom.c[1] + ry];
  }
  const tx = geom.toleranta, ty = geom.toleranta * W / H;
  const xs = geom.puncte.map(p => p[0]), ys = geom.puncte.map(p => p[1]);
  return [Math.min(...xs) - tx, Math.min(...ys) - ty, Math.max(...xs) + tx, Math.max(...ys) + ty];
}

/** cât de aproape a fost o atingere greșită – mesaj prietenos, fără kilometri (scara hărții nu e valabilă peste tot) */
export function apropiere(geom, fx, fy, W) {
  const d = distantaLaZona(geom, fx, fy, W, W) / W; // aproximativ, relativ la lățime
  if (d < 0.04) return 'Ai fost foarte aproape!';
  if (d < 0.12) return 'Ai fost în regiunea potrivită, dar nu chiar acolo.';
  return 'Ai căutat departe de locul corect.';
}

/** elementul cel mai potrivit pentru o atingere (pentru modul Explorează) */
export function elementLa(elemente, fx, fy, W, H) {
  let best = null, bd = Infinity;
  for (const e of elemente) {
    const d = distantaLaZona(e.geometrie, fx, fy, W, H);
    // la egalitate (înăuntru în mai multe zone), câștigă zona mai mică – de obicei cea vizată
    const marime = e.geometrie.tip === 'punct' ? e.geometrie.r : e.geometrie.toleranta;
    const scor = d + marime * W * 0.15;
    if (d <= 0.015 * W && scor < bd) { bd = scor; best = e; }
  }
  return best;
}

export function stele(procent) { return procent >= .95 ? 3 : procent >= .8 ? 2 : procent >= .6 ? 1 : 0; }

/** verifică un set de date: geometria e în interiorul hărții, centrul fiecărui element e în propria zonă */
export function valideaza(date) {
  const probleme = [];
  const ids = new Set();
  for (const e of date.elemente) {
    if (ids.has(e.id)) probleme.push(`id dublat: ${e.id}`); ids.add(e.id);
    const h = date.harti[e.harta]; if (!h) { probleme.push(`hartă lipsă: ${e.id}`); continue; }
    const pts = e.geometrie.tip === 'punct' ? [e.geometrie.c] : e.geometrie.puncte;
    if (pts.some(([x, y]) => !(x >= 0 && x <= 1 && y >= 0 && y <= 1))) probleme.push(`în afara hărții: ${e.id}`);
    const [cx, cy] = centru(e.geometrie);
    if (!inZona(e.geometrie, cx, cy, h.latime, h.inaltime, 0)) probleme.push(`centrul nu e în zonă: ${e.id}`);
    for (const m of e.masti) if (!(m.x >= 0 && m.y >= 0 && m.x + m.w <= 1.001 && m.y + m.h <= 1.001)) probleme.push(`mască în afara hărții: ${e.id}`);
    if (!date.categorii[e.categorie]) probleme.push(`categorie necunoscută: ${e.id}`);
  }
  return probleme;
}

// =====================================================================
// GRAFIK: Alle Figuren und Gebäude werden hier per Code gemalt.
//
// Wie es funktioniert:
//  - Ein "Maler" hat eine kleine Leinwand (z. B. 24 x 32 Pixel).
//  - Mit maler.form(...) malst du eine Form (Kreis, Rechteck, Vieleck).
//  - Jede Form bekommt eine "Farbrampe" aus 4 Tönen:
//      [Linie, Schatten, Grundfarbe, Licht]
//    Der Maler schattiert automatisch: Licht kommt von oben links,
//    Schatten liegt unten rechts.
//  - Zum Schluss bekommt alles einen dunklen Umriss.
// =====================================================================

const UMRISS = '#1d1328';

// Farbrampen: [Linie, Schatten, Grund, Licht]
const RAMPE = {
  haut:     ['#5c2b2e', '#b4614a', '#e89a6c', '#ffcf9e'],
  haar:     ['#2b1420', '#7c3424', '#b9592c', '#ec9a4a'],
  gruen:    ['#16303a', '#25664c', '#38a05e', '#7ad37a'],
  rot:      ['#3a1028', '#8a1f3a', '#d2373f', '#ff7a5e'],
  leder:    ['#2b1622', '#5e3326', '#8f5536', '#c48550'],
  lederDkl: ['#1f1018', '#3e2220', '#5c3428', '#7e4a32'],
  stahl:    ['#262a44', '#5a6688', '#a7b6cf', '#f2f7ff'],
  gold:     ['#4a2410', '#b06a18', '#eab03a', '#fff07a'],
  kapuze:   ['#2a0e1e', '#5e1830', '#8c2a3a', '#b8484a'],
  kapuzeGr: ['#14261e', '#22473a', '#33684a', '#55906a'],
  stoff:    ['#2a1e2a', '#5a4450', '#857080', '#b49aa4'],
  rost:     ['#34141a', '#7a3220', '#c0612c', '#f0a04c'],
  metall:   ['#1e2236', '#3e4660', '#68728e', '#9aa6c0'],
  lazi:     ['#0e3a4a', '#1aa0a8', '#5ff0e0', '#e0fff8'],
  stein:    ['#1f1e30', '#4a4862', '#77768e', '#a9a8bc'],
  moos:     ['#16301e', '#2e5a2a', '#4e8a36', '#86c04e'],
  blau:     ['#141c40', '#24408a', '#3a6ad0', '#78a8ff'],
  holz:     ['#2a1418', '#5a2e22', '#8a4e30', '#bc7a44'],
  stroh:    ['#4a2a14', '#a0681e', '#dcaa3e', '#ffe282'],
  putz:     ['#4a3a3a', '#a89080', '#e0cdb0', '#fff4dc'],
  ziegel:   ['#3a1418', '#7e2a2a', '#b44a3a', '#e07c5a'],
  feuer:    ['#6a1a10', '#e0521c', '#ffb030', '#fff4a0'],
  beton:    ['#2a2838', '#5c5a6e', '#8a8898', '#b8b6c2'],
  gelb:     ['#4a3010', '#b08018', '#e8c040', '#fff090'],
  blatt:    ['#121e18', '#22402a', '#355e34', '#5a8040'],
  blattH:   ['#18261a', '#2e4a2a', '#4a6c34', '#76924a'],
  nadel:    ['#0c1a1a', '#16322e', '#22483c', '#3a6648'],
  sack:     ['#3a2a1a', '#8a6a44', '#c0a070', '#e8d0a0'],
  rotDkl:   ['#24101c', '#5a1a2a', '#86283a', '#a8443e'],
  blauDkl:  ['#101830', '#1e3060', '#2e4a88', '#5a78b8'],
  mantel:   ['#0e141c', '#1c2a36', '#2c4250', '#48626e'],
  hose:     ['#141826', '#283048', '#3c4664', '#56627e'],
  eis:      ['#1a2a4a', '#5a8ac8', '#a8d8f8', '#f0ffff'],
  eisenDkl: ['#120e14', '#2a2228', '#40363c', '#5a4c50'],
  lumpen:   ['#1e1a1a', '#3e3634', '#5a504a', '#776a60'],
  olive:    ['#1a1e12', '#363e24', '#4e5834', '#6a744a'],
  tuch:     ['#0c0a14', '#1c1626', '#2c2238', '#443650'],
  fell:     ['#141018', '#2e2a36', '#4a4656', '#6e6a7a'],
  fellDkl:  ['#0c080e', '#1e1820', '#302832', '#4a3e48'],
  fleisch:  ['#3a1018', '#8a2a2e', '#c4544a', '#f08a70'],
  violett:  ['#2a0e3a', '#5a2a8a', '#8a4ac8', '#c890ff'],
};

function Maler(w, h) {
  this.w = w; this.h = h;
  this.px = new Array(w * h).fill(null);
}
Maler.prototype.get = function (x, y) {
  if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
  return this.px[y * this.w + x];
};
Maler.prototype.set = function (x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
  this.px[y * this.w + x] = c;
};
// Eine Form malen. maske(x, y) sagt, ob ein Pixel zur Form gehört.
// opt.kante: dunkle Linie dort, wo die Form auf schon Gemaltes trifft
// opt.tiefe: wie viele Pixel breit der Schatten ist
Maler.prototype.form = function (maske, r, opt) {
  opt = opt || {};
  const tiefe = opt.tiefe || 1, kante = opt.kante !== false, licht = opt.licht !== false;
  const korn = opt.korn === undefined ? 0.07 : opt.korn;    // feine Körnung für mehr Detail
  const innen = (x, y) => maske(x + 0.5, y + 0.5);
  const neu = [];
  for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
    if (!innen(x, y)) continue;
    let c = r[2];
    let schatten = false, halbschatten = false;
    for (let t = 1; t <= tiefe; t++) if (!innen(x + t, y) || !innen(x, y + t) || !innen(x + t, y + t)) schatten = true;
    if (!schatten && licht && (!innen(x + tiefe + 1, y) || !innen(x, y + tiefe + 1))) halbschatten = (x + y) % 2 === 0;
    if (schatten) c = r[1];
    else if (licht && (!innen(x - 1, y) || !innen(x, y - 1))) c = r[3];
    else if (halbschatten) c = r[1];
    else if (korn) {
      // Körnung: an festen Stellen etwas heller oder dunkler, damit Flächen nicht flach wirken
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, z = h - Math.floor(h);
      if (z < korn) c = r[1]; else if (z > 1 - korn * 0.6 && licht) c = r[3];
    }
    if (kante) {
      const rand = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !innen(x + dx, y + dy) && this.get(x + dx, y + dy));
      if (rand) c = r[0];
    }
    neu.push([x, y, c]);
  }
  neu.forEach(([x, y, c]) => this.set(x, y, c));
  return this;
};
Maler.prototype.punkt = function (x, y, c) { this.set(x, y, c); return this; };
Maler.prototype.leinwand = function (umriss) {
  const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
  const g = c.getContext('2d');
  const farbe = this.px.slice();
  if (umriss !== false) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.get(x + dx, y + dy))) farbe[y * this.w + x] = UMRISS;
    }
  }
  for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
    const f = farbe[y * this.w + x];
    if (f) { g.fillStyle = f; g.fillRect(x, y, 1, 1); }
  }
  return c;
};

// Masken: Grundformen
const M = {
  ell: (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
  box: (x0, y0, w, h) => (x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h,
  // Kapsel: dicke Linie mit runden Enden (für Arme, Beine, Klingen)
  kap: (x0, y0, x1, y1, r) => (x, y) => {
    const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l));
    return (x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2 <= r * r;
  },
  poly: (pts) => (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  },
  und: (...m) => (x, y) => m.every(f => f(x, y)),
  oder: (...m) => (x, y) => m.some(f => f(x, y)),
  ohne: (a, b) => (x, y) => a(x, y) && !b(x, y),
};

// Zufall mit Startwert, damit Bäume usw. immer gleich aussehen
function zufall(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------------
// FIGUREN
// ---------------------------------------------------------------------

// Spielfigur. p = Pose: beinV/beinH (Schrittweite), hand [x,y], klinge (Winkel), bob, hocke
// opt.klasse: 'ritter', 'soldat', 'beschwoerer' oder 'architekt'. opt.waffe: wie die Waffe aussieht.
function malHeld(p, opt) {
  opt = opt || {};
  const klasse = opt.klasse || 'ritter', waffe = opt.waffe || 'schwert';
  // 32 x 39 Pixel: Kopf etwa ein Fünftel der Höhe, lange Beine, breite Schultern
  const m = new Maler(32, 39);
  const b = p.bob || 0, h = p.hocke ? 2 : 0;
  const oy = b + h;
  const bh = p.beinH || 0, bv = p.beinV || 0;
  const ritter = klasse === 'ritter' || klasse === 'soldat';
  const umhang = klasse === 'soldat' ? RAMPE.blauDkl : RAMPE.rotDkl;
  const [hx, hy0] = p.hand || [19, 19];
  const hy = hy0 + 1;

  if (klasse === 'schatten') return malSchattenlaeufer(m, p, oy, h, bh, bv, hx, hy, opt.begleiter);
  // --- hinten: Umhang, Rucksack ---
  if (ritter) m.form(M.poly([[10, 12 + oy], [14, 12 + oy], [12.5, 30 + oy - h], [5, 31 + oy - h], [5.5, 25 + oy]]), umhang);
  if (klasse === 'beschwoerer') {
    m.form(M.box(6, 13 + oy, 6, 10), RAMPE.metall);
    m.form(M.oder(M.ell(9, 15.5 + oy, 1.6, 1.6), M.ell(9, 20 + oy, 1.6, 1.6)), RAMPE.lazi, { licht: false });
    m.form(M.kap(7, 13 + oy, 5, 7 + oy, 0.6), RAMPE.metall);
  }
  // --- hinteres Bein und hinterer Arm ---
  const hose = klasse === 'architekt' ? RAMPE.hose : klasse === 'beschwoerer' ? RAMPE.lederDkl : RAMPE.leder;
  const armRampe = ritter ? RAMPE.metall : klasse === 'beschwoerer' ? RAMPE.mantel : RAMPE.haut;
  m.form(M.oder(M.kap(12.4, 25 + oy, 12.2 + bh * 0.6, 30 + oy * 0.5, 2.0), M.kap(12.2 + bh * 0.6, 30 + oy * 0.5, 12.2 + bh, 34, 1.6)), RAMPE.lederDkl);
  m.form(M.box(10 + bh, 34, 5, 3), RAMPE.lederDkl);
  m.form(M.oder(M.kap(10.4, 14.6 + oy, 9.5, 19 + oy, 1.9), M.kap(9.5, 19 + oy, 9.7, 23 + oy, 1.6), M.ell(9.7, 23.4 + oy, 1.6, 1.6)), armRampe);
  // --- Körper: schlanke Schultern, schmale Taille, etwas Hüfte ---
  const rumpf = M.oder(M.poly([[9.2, 13.4 + oy], [19.6, 13.4 + oy], [18.4, 18 + oy], [17.3, 21.5 + oy], [18, 25 + oy], [10.8, 25 + oy], [11.4, 21.5 + oy], [10.2, 18 + oy]]), M.ell(14.4, 14 + oy, 5.4, 2.2));
  if (ritter) {
    m.form(rumpf, RAMPE.stahl, { tiefe: 2 });
    m.form(M.oder(M.box(14, 15 + oy, 1, 5), M.box(12, 17.5 + oy, 5, 1)), [RAMPE.stahl[2], RAMPE.stahl[2], RAMPE.stahl[2], RAMPE.stahl[2]], { licht: false, kante: false, korn: 0 });
    m.form(M.box(12.8, 21 + oy, 3, 7.5), umhang, { licht: false });
    m.form(M.box(10.8, 23.5 + oy, 7.4, 2), RAMPE.leder);
    m.punkt(14, 24 + oy, RAMPE.gold[2]).punkt(14, 25 + oy, RAMPE.gold[1]);
  } else if (klasse === 'beschwoerer') {
    m.form(M.oder(rumpf, M.poly([[10.6, 22 + oy], [18.2, 22 + oy], [20, 31 + oy - h], [9, 31 + oy - h]])), RAMPE.mantel, { tiefe: 2 });
    m.form(M.box(13.8, 16 + oy, 1.6, 15 - h), [RAMPE.mantel[0], RAMPE.mantel[1], RAMPE.mantel[1], RAMPE.mantel[1]], { licht: false, kante: false });
    m.form(M.box(11, 22 + oy, 7.2, 2), RAMPE.lederDkl);
    m.punkt(16, 23 + oy, RAMPE.lazi[2]);
  } else {
    m.form(rumpf, RAMPE.stoff, { tiefe: 2 });
    m.form(M.oder(M.ell(10.4, 14.2 + oy, 2.1, 1.7), M.ell(18.6, 14.2 + oy, 2.1, 1.7)), RAMPE.stoff);
    m.form(M.poly([[11.6, 16 + oy], [17.4, 16 + oy], [17, 21.5 + oy], [18, 26.5 + oy], [11, 26.5 + oy], [11.8, 21.5 + oy]]), RAMPE.leder);
    m.form(M.box(10.8, 23 + oy, 7.6, 2), RAMPE.lederDkl);
    m.form(M.oder(M.box(10, 24 + oy, 2.5, 3), M.box(16.5, 24 + oy, 2.5, 3)), RAMPE.lederDkl);
    m.punkt(11, 25 + oy, RAMPE.stahl[2]);
  }
  // Begleiter aus dem Dorf tragen eine blaue Schärpe
  if (opt.begleiter && !ritter) m.form(M.kap(10.8, 14.2 + oy, 17.8, 22.5 + oy, 0.9), RAMPE.blau, { licht: false });
  // --- vorderes Bein: kräftiger Oberschenkel, Knie, Stiefel ---
  m.form(M.oder(M.kap(15.2, 26 + oy, 15 + bv * 0.6, 30 + oy * 0.5, 2.2), M.kap(15 + bv * 0.6, 30 + oy * 0.5, 15 + bv, 34, 1.8), M.ell(15.3, 26.3 + oy, 2.5, 2)), hose);
  m.form(M.box(13.6 + bv, 34, 5.6, 3), RAMPE.lederDkl);
  if (ritter) m.form(M.ell(15 + bv * 0.6, 30 + oy * 0.5, 1.8, 1.5), RAMPE.metall);
  // --- Hals und Kopf: kleiner als früher, damit er zum Körper passt ---
  if (ritter) {
    m.form(M.box(13, 10 + oy, 4, 3), RAMPE.metall);
    // geschlossener Topfhelm mit Sehschlitz
    m.form(M.oder(M.ell(15, 6 + oy, 4.4, 4), M.box(10.8, 6 + oy, 8.6, 5)), RAMPE.stahl, { tiefe: 2 });
    m.form(M.box(14, 7 + oy, 6, 1), [UMRISS, UMRISS, UMRISS, UMRISS], { licht: false, kante: false });
    m.form(M.box(16, 8 + oy, 1, 2), [RAMPE.stahl[0], RAMPE.stahl[0], RAMPE.stahl[0], RAMPE.stahl[0]], { licht: false, kante: false });
    m.punkt(18, 9 + oy, UMRISS).punkt(19, 9 + oy, UMRISS);
    if (klasse === 'ritter') m.form(M.oder(M.kap(13, 1.5 + oy, 8.5, 1 + oy, 1.2), M.kap(8.5, 1 + oy, 6, 3.5 + oy, 0.9)), umhang);
  } else if (klasse === 'beschwoerer') {
    // Kapuze, darunter nur Dunkelheit und zwei Lazi-Linsen
    m.form(M.oder(M.ell(14.8, 7 + oy, 5, 4.9), M.poly([[10, 5 + oy], [7.5, 12 + oy], [12, 11 + oy]])), RAMPE.mantel, { tiefe: 2 });
    m.form(M.ell(16.6, 8 + oy, 3.1, 3), [UMRISS, '#0a0a14', '#10101c', '#181828'], { licht: false });
    m.punkt(17, 8 + oy, RAMPE.lazi[2]).punkt(19, 8 + oy, RAMPE.lazi[2]).punkt(18, 8 + oy, RAMPE.lazi[0]);
  } else {
    // Mütze, Schweißerbrille und Tuch vor dem Mund
    m.form(M.box(13, 10 + oy, 4, 3), RAMPE.haut);
    m.form(M.ell(15, 7 + oy, 4.1, 4.1), RAMPE.haut);
    m.form(M.oder(M.ell(14.2, 4.5 + oy, 4.7, 2.8), M.box(10, 4.5 + oy, 3.5, 5)), RAMPE.lederDkl);
    m.form(M.box(13.5, 6 + oy, 6.5, 2.5), RAMPE.metall, { licht: false });
    m.form(M.oder(M.box(15, 7 + oy, 2, 1), M.box(18, 7 + oy, 1.5, 1)), [RAMPE.feuer[0], RAMPE.feuer[1], RAMPE.feuer[1], RAMPE.feuer[2]], { licht: false, kante: false });
    m.form(M.poly([[11.5, 9 + oy], [19.5, 9 + oy], [19.5, 12 + oy], [12.5, 12.5 + oy]]), RAMPE.sack);
  }
  // --- Waffe und vorderer Arm: Oberarm, Ellbogen, Unterarm ---
  const a = p.klinge === undefined ? -1.2 : p.klinge;
  if (!p.waffeVorne) zeichneWaffe(m, waffe, hx, hy + oy, a);
  const sx = 18.2, sy = 14.8 + oy;
  const ex = sx + (hx - sx) * 0.45 + 0.6, ey = sy + (hy + oy - sy) * 0.5 + 0.6;
  m.form(M.oder(M.kap(sx, sy, ex, ey, 1.9), M.kap(ex, ey, hx, hy + oy, 1.6)), armRampe);
  if (ritter) m.form(M.ell(18.3, 13.9 + oy, 3, 2.3), RAMPE.stahl, { tiefe: 2 });
  if (klasse === 'architekt') m.form(M.ell(18.5, 14.2 + oy, 2.3, 1.9), RAMPE.stoff);
  m.form(M.ell(hx, hy + oy, 1.6, 1.6), ritter ? RAMPE.metall : klasse === 'architekt' ? RAMPE.haut : RAMPE.lederDkl);
  if (p.waffeVorne) zeichneWaffe(m, waffe, hx, hy + oy, a);
  return m.leinwand();
}

// Schattenläufer: schlank, aber athletisch, vermummt, zwei Dolche
function malSchattenlaeufer(m, p, oy, h, bh, bv, hx, hy, begleiter) {
  const a = p.klinge === undefined ? -1.2 : p.klinge;
  const schal = begleiter ? RAMPE.blau : RAMPE.violett;
  // Schal weht nach hinten
  m.form(M.poly([[11, 11 + oy], [14, 12 + oy], [9, 16 + oy], [4, 18.5 + oy], [6, 14 + oy]]), schal);
  // zweiter Dolch in der hinteren Hand
  zeichneWaffe(m, 'dolch', 10.5, 23 + oy, a + 2.2);
  m.form(M.oder(M.kap(10.6, 14.5 + oy, 10, 19 + oy, 1.7), M.kap(10, 19 + oy, 10.8, 23 + oy, 1.5)), RAMPE.tuch);
  m.form(M.ell(10.5, 23 + oy, 1.5, 1.5), RAMPE.stoff);
  // Beine
  m.form(M.oder(M.kap(12.2, 25 + oy, 12 + bh * 0.6, 30 + oy * 0.5, 2.1), M.kap(12 + bh * 0.6, 30 + oy * 0.5, 12 + bh, 34, 1.7)), RAMPE.lederDkl);
  m.form(M.box(10 + bh, 34, 5, 3), RAMPE.tuch);
  // Körper: breite Schultern, schmale Hüfte
  m.form(M.oder(M.poly([[9.6, 13.4 + oy], [19.2, 13.4 + oy], [18, 18 + oy], [17, 21.5 + oy], [17.8, 25 + oy], [11, 25 + oy], [11.6, 21.5 + oy], [10.6, 18 + oy]]), M.ell(14.4, 14 + oy, 5, 2.1)), RAMPE.tuch);
  m.form(M.kap(11.6, 13.8 + oy, 16.6, 23.5 + oy, 0.6), RAMPE.leder, { licht: false });
  m.form(M.box(11, 22.5 + oy, 7, 2), RAMPE.lederDkl);
  m.form(M.oder(M.box(11, 24 + oy, 2, 2), M.box(15.6, 24 + oy, 2, 2)), RAMPE.leder);
  m.form(M.oder(M.kap(15.2, 26 + oy, 15 + bv * 0.6, 30 + oy * 0.5, 2.2), M.kap(15 + bv * 0.6, 30 + oy * 0.5, 15 + bv, 34, 1.8), M.ell(15.3, 26.5 + oy, 2.4, 2)), RAMPE.lederDkl);
  m.form(M.box(14 + bv, 34, 6, 3), RAMPE.tuch);
  // Kapuze und Maske, nur die Augen schimmern
  m.form(M.oder(M.ell(14.8, 7 + oy, 4.6, 4.6), M.poly([[10, 5 + oy], [8, 11 + oy], [12, 10 + oy]])), RAMPE.tuch, { tiefe: 2 });
  m.form(M.ell(16.6, 8 + oy, 2.9, 2.7), [UMRISS, '#08060c', '#0e0a14', '#14101c'], { licht: false, korn: 0 });
  m.form(M.box(14, 9 + oy, 5.5, 2.5), schal, { korn: 0 });
  m.punkt(17, 7 + oy, '#e8dcff').punkt(19, 7 + oy, '#e8dcff');
  // vorderer Arm mit Dolch
  if (!p.waffeVorne) zeichneWaffe(m, 'dolch', hx, hy + oy, a);
  const sx = 18, sy = 14.6 + oy, ex = sx + (hx - sx) * 0.45 + 0.5, ey = sy + (hy + oy - sy) * 0.5 + 0.5;
  m.form(M.oder(M.kap(sx, sy, ex, ey, 1.9), M.kap(ex, ey, hx, hy + oy, 1.6)), RAMPE.tuch);
  m.form(M.ell(hx, hy + oy, 1.6, 1.6), RAMPE.stoff);
  if (p.waffeVorne) zeichneWaffe(m, 'dolch', hx, hy + oy, a);
  return m.leinwand();
}

function zeichneWaffe(m, waffe, hx, hy, a) {
  const cx = Math.cos(a), cy = Math.sin(a), nx = -cy, ny = cx;
  const spitze = l => [hx + cx * l, hy + cy * l];
  if (waffe === 'axt' || waffe === 'beil') {
    const l = waffe === 'axt' ? 9 : 7, k = waffe === 'axt' ? 5 : 3.5;
    const [tx, ty] = spitze(l);
    m.form(M.kap(hx - cx * 2, hy - cy * 2, tx, ty, 1), RAMPE.holz);
    m.form(M.poly([[tx - cx * 3, ty - cy * 3], [tx + nx * k - cx * 4, ty + ny * k - cy * 4], [tx + nx * k + cx * 2, ty + ny * k + cy * 2], [tx, ty]]), RAMPE.stahl);
    return;
  }
  if (waffe === 'hammer') {
    const [tx, ty] = spitze(8);
    m.form(M.kap(hx - cx * 2, hy - cy * 2, tx, ty, 0.9), RAMPE.holz);
    m.form(M.poly([[tx + nx * 3.5 - cx * 1.5, ty + ny * 3.5 - cy * 1.5], [tx + nx * 3.5 + cx * 2, ty + ny * 3.5 + cy * 2], [tx - nx * 2.5 + cx * 2, ty - ny * 2.5 + cy * 2], [tx - nx * 2.5 - cx * 1.5, ty - ny * 2.5 - cy * 1.5]]), RAMPE.metall);
    return;
  }
  if (waffe === 'stab') {
    const [tx, ty] = spitze(12);
    m.form(M.kap(hx - cx * 6, hy - cy * 6, tx, ty, 0.8), RAMPE.metall);
    m.form(M.oder(M.kap(tx - cx * 3 - nx * 1.6, ty - cy * 3 - ny * 1.6, tx - cx * 3 + nx * 1.6, ty - cy * 3 + ny * 1.6, 0.6), M.kap(tx - cx * 5 - nx * 1.4, ty - cy * 5 - ny * 1.4, tx - cx * 5 + nx * 1.4, ty - cy * 5 + ny * 1.4, 0.6)), RAMPE.rost, { licht: false });
    m.form(M.ell(tx + cx, ty + cy, 2.3, 2.3), RAMPE.lazi);
    return;
  }
  const l = waffe === 'langschwert' ? 14 : waffe === 'dolch' ? 6 : 11;
  const [tx, ty] = spitze(l);
  m.form(M.kap(hx + cx * 2, hy + cy * 2, tx, ty, waffe === 'langschwert' ? 1 : 1.2), RAMPE.stahl);
  const q = waffe === 'dolch' ? 1.6 : 2.5;
  m.form(M.kap(hx + cx * 1.5 - nx * q, hy + cy * 1.5 - ny * q, hx + cx * 1.5 + nx * q, hy + cy * 1.5 + ny * q, 0.9), RAMPE.gold);
}

const POSEN_HELD = {
  stand:   { hand: [19, 19], klinge: -1.25 },
  stand2:  { hand: [19, 19], klinge: -1.25, bob: 1 },
  lauf1:   { hand: [19, 18], klinge: -1.1, beinV: 2, beinH: -2 },
  lauf2:   { hand: [19, 19], klinge: -1.2, bob: 1 },
  lauf3:   { hand: [19, 18], klinge: -1.1, beinV: -2, beinH: 2 },
  hieb:    { hand: [22, 17], klinge: 0.15, beinV: 2, beinH: -1, waffeVorne: true },
  hiebOben:{ hand: [20, 13], klinge: -2.3, beinV: 1, beinH: -1 },
  laden:   { hand: [12, 19], klinge: -2.6, hocke: true, beinV: 2, beinH: -2 },
  rolle:   { hand: [18, 21], klinge: 0.6, hocke: true, beinV: 1, beinH: 1, waffeVorne: true },
};

// Kleine mechanische Elementargolems des Beschwörers
// k: Größe (1 = normal, 1.6 = Riesengolem)
function malKleingolem(element, f, k) {
  k = k || 1;
  const m = new Maler(Math.round(26 * k), Math.round(28 * k));
  const z = v => v * k, s = f ? 1 : 0;
  const B = (x, y, w, h) => M.box(z(x), z(y), z(w), z(h)), E = (x, y, rx, ry) => M.ell(z(x), z(y), z(rx), z(ry)), K = (x0, y0, x1, y1, r) => M.kap(z(x0), z(y0), z(x1), z(y1), z(r));
  const P = pts => M.poly(pts.map(([x, y]) => [z(x), z(y)]));
  const pk = (x, y, c) => m.punkt(Math.round(z(x)), Math.round(z(y)), c);
  const koerper = element === 'eis' ? RAMPE.eis : element === 'feuer' ? RAMPE.eisenDkl : RAMPE.metall;
  const kern = element === 'eis' ? RAMPE.eis : element === 'feuer' ? RAMPE.feuer : element === 'blitz' ? RAMPE.gelb : RAMPE.gold;
  const t = k > 1 ? 2 : 1;
  m.form(M.oder(B(8, 20, 4, 6 - s), B(15, 20, 4, 5 + s)), RAMPE.metall, { tiefe: t });
  m.form(M.oder(B(7, 25 - s, 6, 3), B(14, 24 + s, 6, 3)), RAMPE.metall, { tiefe: t });
  m.form(K(6, 12, 4, 20 + s, 2.4), koerper, { tiefe: t });
  m.form(M.oder(E(13, 15, 7, 6.5), B(7, 15, 13, 6)), koerper, { tiefe: t + 1 });
  if (k > 1) m.form(M.oder(B(9, 18, 9, 1), B(12, 11, 1, 9)), [koerper[0], koerper[1], koerper[1], koerper[1]], { licht: false, kante: false });
  m.form(E(13, 15, 2.8, 2.8), kern, { licht: false });
  m.form(M.oder(E(14, 6, 4.5, 4), B(10, 6, 9, 4)), koerper, { tiefe: t });
  m.form(B(13, 6, 5, 2), [UMRISS, '#0a0a14', '#0a0a14', '#0a0a14'], { licht: false });
  pk(16, 6, kern[2]); pk(17, 6, kern[3]);
  m.form(K(20, 12, 22, 20 - s, 2.6), koerper, { tiefe: t });
  if (element === 'eis') m.form(M.oder(P([[6, 10], [8, 3], [10, 10]]), P([[17, 9], [20, 2], [21, 10]])), RAMPE.eis, { tiefe: 1 });
  if (element === 'feuer') { m.form(P([[9, 9], [11, 2 + s], [13, 7], [15, 1 - s], [18, 9]]), RAMPE.feuer, { kante: false }); pk(10, 17, RAMPE.feuer[2]); pk(17, 18, RAMPE.feuer[2]); }
  if (element === 'blitz') { m.form(M.oder(K(10, 2, 8, 0.5, 0.6), K(17, 2, 19, 0.5, 0.6)), RAMPE.metall); pk(8, 0.5, RAMPE.gelb[3]); pk(19, 0.5, RAMPE.gelb[3]); pk(5, 16, RAMPE.gelb[3]); pk(22, 14, RAMPE.gelb[3]); }
  if (element === 'metall') m.form(M.oder(E(7, 11, 3.5, 2.5), E(20, 11, 3.5, 2.5)), RAMPE.stahl);
  if (k > 1) for (let i = 0; i < 5; i++) pk(9 + i * 2, 21, kern[2]);
  return m.leinwand();
}

// Bauwerke des Architekten
function malBolzenwerfer() {
  const m = new Maler(26, 30);
  m.form(M.oder(M.kap(13, 14, 5, 29, 1), M.kap(13, 14, 21, 29, 1), M.kap(13, 14, 13, 29, 1)), RAMPE.holz);
  m.form(M.box(6, 11, 15, 4), RAMPE.holz);
  m.form(M.oder(M.kap(19, 4, 22, 13, 0.9), M.kap(22, 13, 19, 22, 0.9)), RAMPE.stahl);
  m.form(M.box(8, 12, 16, 1), RAMPE.stahl, { licht: false, kante: false });
  m.form(M.box(10, 8, 5, 3), RAMPE.metall);
  return m.leinwand();
}
function malMoerser() {
  const m = new Maler(28, 24);
  m.form(M.box(2, 16, 24, 7), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(M.box(2, 18, 24, 1), M.box(8, 16, 1, 7), M.box(18, 16, 1, 7)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.poly([[7, 17], [19, 17], [22, 4], [12, 2]]), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.ell(17, 3.5, 5, 2.2), [UMRISS, '#0a0a14', '#14101c', '#14101c'], { licht: false });
  m.form(M.oder(M.box(8, 12, 13, 2)), RAMPE.rost, { licht: false });
  return m.leinwand();
}
function malPfahlwall() {
  const m = new Maler(32, 24);
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 5, top = 2 + (i % 2) * 3;
    m.form(M.poly([[x, 22], [x + 4, 22], [x + 4, top + 4], [x + 2, top], [x, top + 4]]), RAMPE.holz);
  }
  m.form(M.oder(M.kap(1, 12, 31, 16, 1.2), M.kap(1, 18, 31, 14, 1.2)), RAMPE.lederDkl);
  return m.leinwand();
}

// art: undefined (Hackmesser), 'schuetze', 'schild', 'brand', 'trommel'. f: zweites Bild (Trommelschlag)
function malPluenderer(schritt, art, f) {
  if (art === true) art = 'schuetze';
  // 28 x 36 Pixel: schmaler Kopf, kräftiger Oberkörper, lange Beine
  const m = new Maler(art === 'schild' ? 32 : 28, 36);
  const kap = art === 'schuetze' ? RAMPE.kapuzeGr : art === 'brand' ? RAMPE.rost : art === 'trommel' ? RAMPE.lumpen : art === 'schild' ? RAMPE.eisenDkl : RAMPE.kapuze;
  const Y = 3;   // alles unterhalb des Kopfes rutscht nach unten
  if (art === 'brand') {
    m.form(M.box(3, 12 + Y, 6, 9), RAMPE.rot, { tiefe: 2 });
    m.form(M.box(4, 10 + Y, 2, 2), RAMPE.metall);
    m.punkt(5, 15 + Y, RAMPE.gelb[2]).punkt(6, 15 + Y, RAMPE.gelb[2]);
  }
  // hinteres Bein
  m.form(M.oder(M.kap(11, 22 + Y, 11 - schritt * 0.6, 27 + Y, 2), M.kap(11 - schritt * 0.6, 27 + Y, 11 - schritt, 31.5, 1.7)), RAMPE.lederDkl);
  m.form(M.box(9 - schritt, 31, 5, 3), RAMPE.lederDkl);
  // Körper mit Schrott-Panzer
  m.form(M.oder(M.poly([[7.6, 12.2 + Y], [18.6, 12.2 + Y], [17.2, 17.5 + Y], [16.4, 20.5 + Y], [17.2, 23 + Y], [9, 23 + Y], [9.8, 20.5 + Y], [9, 17.5 + Y]]), M.ell(13.1, 12.9 + Y, 5.8, 2.4)), RAMPE.leder, { tiefe: 2 });
  m.form(M.oder(M.kap(8.4, 13.2 + Y, 7.4, 17.5 + Y, 1.8), M.kap(7.4, 17.5 + Y, 7.4, 21 + Y, 1.5)), RAMPE.leder);
  m.form(M.poly([[9.6, 13 + Y], [16.6, 12.4 + Y], [17, 18.6 + Y], [10.4, 19.4 + Y]]), art === 'schild' ? RAMPE.stahl : RAMPE.metall);
  m.punkt(12, 15 + Y, RAMPE.rost[2]).punkt(13, 16 + Y, RAMPE.rost[1]).punkt(16, 14 + Y, RAMPE.rost[2]);
  m.form(M.box(9.2, 21 + Y, 8, 2), RAMPE.lederDkl);
  // vorderes Bein
  m.form(M.oder(M.kap(15, 22 + Y, 15 + schritt * 0.6, 27 + Y, 2.1), M.kap(15 + schritt * 0.6, 27 + Y, 15 + schritt, 31.5, 1.8)), RAMPE.leder);
  m.form(M.box(14 + schritt, 31, 6, 3), RAMPE.lederDkl);
  // Hals und Kapuze mit dunklem Gesicht und leuchtenden Augen (kleiner Kopf)
  m.form(M.box(11.5, 9 + Y, 4, 3), RAMPE.lederDkl);
  m.form(M.oder(M.ell(13.2, 6.5 + Y * 0.5, 4.6, 4.6), M.poly([[8.5, 6 + Y * 0.5], [13, 1.5], [9.5, 12 + Y * 0.5]])), kap, { tiefe: 2 });
  m.form(M.ell(15, 7.5 + Y * 0.5, 2.8, 2.7), [UMRISS, '#2a1830', '#3a2440', '#4a3050']);
  m.punkt(15, 7 + Y * 0.5, '#ffe060').punkt(17, 7 + Y * 0.5, '#ffe060').punkt(16, 7 + Y * 0.5, '#a08030');
  if (art === 'trommel') {
    m.punkt(14, 9.5 + Y * 0.5, RAMPE.rot[2]).punkt(16, 9.5 + Y * 0.5, RAMPE.rot[2]).punkt(18, 9.5 + Y * 0.5, RAMPE.rot[2]);
    m.form(M.oder(M.ell(16, 19 + Y, 6, 5), M.box(10, 16 + Y, 12, 6)), RAMPE.holz, { tiefe: 2 });
    m.form(M.oder(M.box(10, 16 + Y, 12, 1), M.box(10, 21 + Y, 12, 1)), RAMPE.metall, { licht: false });
    m.form(M.ell(21, 18.5 + Y, 1.6, 3.6), RAMPE.putz);
    const o = f ? -4 : 0;
    m.form(M.oder(M.kap(18, 15 + Y, 24, 11 + Y + o, 0.7), M.kap(12, 15 + Y, 19, 9 + Y - o, 0.7)), RAMPE.holz, { licht: false });
    m.form(M.ell(24, 11 + Y + o, 1.2, 1.2), RAMPE.putz);
    m.form(M.ell(19, 9 + Y - o, 1.2, 1.2), RAMPE.putz);
  } else if (art === 'schuetze') {
    m.form(M.kap(14, 17 + Y, 25, 16 + Y, 1.1), RAMPE.holz);
    m.form(M.oder(M.kap(23, 11 + Y, 25, 16 + Y, 0.8), M.kap(25, 16 + Y, 23, 21 + Y, 0.8)), RAMPE.stahl);
    m.form(M.ell(16, 18 + Y, 1.8, 1.8), RAMPE.haut);
  } else if (art === 'brand') {
    m.form(M.kap(16, 16 + Y, 20, 10 + Y, 1.4), RAMPE.leder);
    m.form(M.box(19, 4 + Y, 3, 6), [RAMPE.olive[0], RAMPE.olive[1], RAMPE.olive[2], '#9ab070']);
    m.form(M.poly([[19, 4 + Y], [20.5, -1 + Y + (f ? 1 : 0)], [22, 4 + Y]]), RAMPE.feuer, { kante: false });
    m.form(M.ell(20, 10 + Y, 1.8, 1.8), RAMPE.haut);
  } else if (art === 'schild') {
    m.form(M.kap(9, 16 + Y, 4, 5 + Y, 1.2), RAMPE.holz);
    m.form(M.ell(4, 5 + Y, 2.2, 2.2), RAMPE.metall);
    m.form(M.poly([[19, 9 + Y], [29, 8 + Y], [30, 28 + Y], [20, 29 + Y]]), RAMPE.metall, { tiefe: 2 });
    m.form(M.poly([[21, 10 + Y], [28, 9.5 + Y], [28.5, 16 + Y], [21.5, 16.5 + Y]]), [UMRISS, '#1e2a40', '#2a3c58', '#4a6a90'], { licht: false });
    m.form(M.box(22, 20 + Y, 4, 1), RAMPE.stahl, { licht: false });
    m.punkt(24, 24 + Y, RAMPE.rost[2]).punkt(27, 22 + Y, RAMPE.rost[1]).punkt(21, 26 + Y, RAMPE.rost[2]).punkt(26, 11 + Y, '#9ac0e8');
  } else {
    m.form(M.kap(17, 17 + Y, 20, 10 + Y, 0.9), RAMPE.holz);
    m.form(M.poly([[19, 11 + Y], [22, 3 + Y], [25, 5 + Y], [21, 12 + Y]]), RAMPE.stahl);
    m.form(M.oder(M.kap(14, 14 + Y, 16.5, 16.5 + Y, 1.8), M.kap(16.5, 16.5 + Y, 18, 17 + Y, 1.5)), RAMPE.leder);
    m.form(M.ell(18, 17 + Y, 1.8, 1.8), RAMPE.haut);
  }
  return m.leinwand();
}

// Mutierter Wolf: Fell mit leuchtenden Lazi-Adern. alpha = größer, mit Knochenkamm
function malWolf(f, alpha, heuler) {
  const k = alpha ? 1.45 : heuler ? 1.1 : 1, W = Math.round(34 * k), H = Math.round(22 * k);
  const m = new Maler(W, H);
  const s = (v) => v * k, fell = alpha ? RAMPE.fellDkl : heuler ? RAMPE.stein : RAMPE.fell;
  const schritt = f === 1 ? 2 : f === 2 ? -2 : 0;
  // Beine hinten
  m.form(M.oder(M.kap(s(9), s(14), s(8 - schritt), s(20.5), s(1.3)), M.kap(s(23), s(14), s(24 + schritt), s(20.5), s(1.3))), fell, { licht: false });
  // Schwanz
  m.form(M.kap(s(5), s(11), s(1), s(8 + (f === 1 ? 1 : 0)), s(1.6)), fell);
  // Körper
  m.form(M.oder(M.ell(s(15), s(12), s(10), s(5)), M.ell(s(22), s(11), s(5), s(5.2))), fell, { tiefe: 2 });
  // Kopf mit Schnauze und Ohren
  m.form(M.oder(M.ell(s(27), s(9), s(4.2), s(3.8)), M.poly([[s(29), s(8)], [s(33.5), s(10)], [s(29.5), s(12)]])), fell, { tiefe: 2 });
  m.form(M.oder(M.poly([[s(25), s(6)], [s(26), s(1.5)], [s(27.5), s(6)]]), M.poly([[s(27), s(6)], [s(28.5), s(2)], [s(29.5), s(6)]])), fell);
  m.punkt(Math.round(s(29)), Math.round(s(8)), RAMPE.lazi[3]).punkt(Math.round(s(30)), Math.round(s(8)), RAMPE.lazi[2]);
  m.punkt(Math.round(s(33)), Math.round(s(10)), UMRISS);
  // Zähne
  m.punkt(Math.round(s(31)), Math.round(s(11)), '#e8e0d0').punkt(Math.round(s(32)), Math.round(s(11)), '#e8e0d0');
  // Beine vorne
  m.form(M.oder(M.kap(s(12), s(15), s(12 + schritt), s(20.5), s(1.5)), M.kap(s(21), s(15), s(20 - schritt), s(20.5), s(1.5))), fell);
  // Leuchtende Adern
  [[10, 10], [11, 11], [12, 11], [16, 9], [17, 10], [18, 10], [21, 13], [22, 12]].forEach(([x, y]) => m.punkt(Math.round(s(x)), Math.round(s(y)), RAMPE.lazi[2]));
  if (heuler) {
    // aufgestellte Mähne und eine leuchtende Kehle
    m.form(M.poly([[s(17), s(8)], [s(19), s(3)], [s(21), s(7)], [s(23), s(2.5)], [s(25), s(7)]]), RAMPE.putz);
    m.form(M.ell(s(27), s(12), s(1.6), s(1.4)), RAMPE.gelb, { licht: false });
  }
  if (alpha) {
    m.form(M.poly([[s(10), s(7.5)], [s(12), s(4)], [s(14), s(7)], [s(16), s(3.5)], [s(18), s(7)], [s(20), s(4)], [s(22), s(7.5)]]), RAMPE.putz);
    m.punkt(Math.round(s(26)), Math.round(s(10)), '#c03030').punkt(Math.round(s(26)), Math.round(s(11)), '#c03030');
  }
  return m.leinwand();
}

// Großes Lagerfeuer für die Nachtwache. stufe 0 = lodert, 1 = klein, 2 = nur noch Glut
function malGrossesFeuer(stufe, f) {
  const m = new Maler(34, 30);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; m.form(M.ell(17 + Math.cos(a) * 12, 24 + Math.sin(a) * 4.5, 2.6, 2), RAMPE.stein); }
  m.form(M.oder(M.kap(8, 25, 26, 20, 1.8), M.kap(9, 20, 25, 26, 1.8), M.kap(17, 27, 17, 19, 1.6)), RAMPE.holz);
  if (stufe === 2) { m.form(M.ell(17, 23, 6, 2.5), [RAMPE.feuer[0], RAMPE.feuer[0], RAMPE.feuer[1], RAMPE.feuer[2]], { kante: false }); return m.leinwand(); }
  const h = stufe === 0 ? 0 : 6, o = f ? 1 : 0;
  m.form(M.poly([[9, 22], [11, 12 + h + o], [14, 16 + h], [17, 3 + h * 1.5 - o], [20, 15 + h], [23, 10 + h + o], [25, 22]]), RAMPE.feuer, { kante: false, tiefe: 2 });
  m.form(M.poly([[13, 22], [15, 14 + h - o], [17, 9 + h * 1.4], [19, 14 + h + o], [21, 22]]), [RAMPE.feuer[3], RAMPE.feuer[2], RAMPE.feuer[3], '#ffffff'], { kante: false, korn: 0 });
  return m.leinwand();
}
function malHolzbuendel() {
  const m = new Maler(12, 8);
  m.form(M.oder(M.kap(1.5, 5.5, 10.5, 5.5, 1.4), M.kap(2, 3, 10, 3, 1.3)), RAMPE.holz);
  m.form(M.box(5, 1, 2, 7), RAMPE.leder, { licht: false });
  return m.leinwand();
}
function malFleisch() {
  const m = new Maler(11, 8);
  m.form(M.kap(1.5, 6, 4, 4, 0.9), RAMPE.putz);
  m.form(M.ell(7, 3.8, 3.6, 3), RAMPE.fleisch);
  return m.leinwand();
}

function malKaefer(f, funken) {
  const m = new Maler(26, 18);
  const s = f ? 1 : 0, panzer = funken ? RAMPE.gelb : RAMPE.rost;
  // Beine
  m.form(M.oder(M.kap(6, 11, 3 - s, 16, 0.9), M.kap(12, 12, 11 + s, 16, 0.9), M.kap(18, 11, 21 - s, 16, 0.9)), RAMPE.metall, { licht: false });
  // Panzer
  m.form(M.ell(12, 9, 9, 6), panzer, { tiefe: 2 });
  m.form(M.box(11, 3, 1, 11), [panzer[0], panzer[0], panzer[0], panzer[0]], { licht: false, kante: false });
  m.punkt(7, 7, panzer[3]).punkt(8, 6, panzer[3]).punkt(15, 6, panzer[3]);
  if (funken) {
    // Warnstreifen und ein glühender Hinterleib voller Funken
    for (let x = 5; x < 19; x += 4) m.form(M.und(M.ell(12, 9, 8, 5), M.box(x, 4, 2, 10)), [UMRISS, '#1a1420', '#1a1420', '#2a2030'], { licht: false, kante: false });
    m.form(M.ell(5, 10, 3, 2.6), RAMPE.feuer, { licht: false });
    m.punkt(4, 9, '#ffffff').punkt(2, 7 - s, RAMPE.gelb[3]).punkt(1, 11 + s, RAMPE.gelb[3]);
  }
  m.punkt(8, 10, RAMPE.metall[2]).punkt(16, 11, RAMPE.metall[2]);
  // Kopf mit Lazi-Auge
  m.form(M.ell(20, 10, 4, 3.5), RAMPE.metall);
  m.form(M.ell(21.5, 9.5, 1.8, 1.6), RAMPE.lazi);
  m.punkt(22, 9, RAMPE.lazi[3]);
  return m.leinwand();
}

function malGolem(f) {
  const m = new Maler(52, 56);
  const s = f ? 1 : 0;
  // Beine
  m.form(M.oder(M.box(15, 40, 8, 12), M.box(29, 40, 8, 12)), RAMPE.stein, { tiefe: 2 });
  m.form(M.oder(M.box(13, 50 - s, 11, 5), M.box(28, 50 + s - 1, 11, 5)), RAMPE.stein, { tiefe: 2 });
  // hinterer Arm
  m.form(M.kap(12, 22, 7, 38 + s, 5), RAMPE.stein, { tiefe: 2 });
  // Rumpf
  m.form(M.oder(M.ell(26, 27, 16, 14), M.box(13, 30, 26, 12)), RAMPE.stein, { tiefe: 3 });
  // Moos auf den Schultern
  m.form(M.oder(M.ell(16, 15, 7, 3), M.ell(35, 14, 6, 2.6)), RAMPE.moos);
  m.punkt(13, 18, RAMPE.moos[2]).punkt(14, 19, RAMPE.moos[1]).punkt(36, 17, RAMPE.moos[2]);
  // Platten und Risse
  m.form(M.poly([[20, 32], [32, 32], [30, 40], [22, 40]]), RAMPE.metall);
  for (let i = 0; i < 6; i++) m.punkt(17 + i, 22 + (i % 2), RAMPE.stein[0]);
  // Lazi-Kern
  m.form(M.ell(26, 26, 5, 5), RAMPE.metall);
  m.form(M.ell(26, 26, 3.4, 3.4), RAMPE.lazi);
  m.punkt(25, 25, RAMPE.lazi[3]).punkt(26, 25, RAMPE.lazi[3]);
  // Kopf
  m.form(M.oder(M.ell(27, 11, 7, 6), M.box(21, 11, 13, 5)), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(23, 10, 10, 3), [UMRISS, '#141020', '#1c1630', '#241c3a'], { licht: false });
  m.punkt(30, 11, RAMPE.lazi[2]).punkt(31, 11, RAMPE.lazi[3]).punkt(29, 11, RAMPE.lazi[1]);
  // vorderer Arm
  m.form(M.kap(38, 22, 44, 37 - s, 5.5), RAMPE.stein, { tiefe: 2 });
  m.form(M.ell(44, 40 - s, 6, 5), RAMPE.stein, { tiefe: 2 });
  m.punkt(42, 27, RAMPE.moos[2]).punkt(43, 28, RAMPE.moos[1]);
  return m.leinwand();
}

// Dorfbewohner: die meisten mit Kapuze oder Tuch, nur wenige zeigen ihr Gesicht
function malDorfbewohner(seed, schritt) {
  const r = zufall(seed);
  const kleider = [RAMPE.lumpen, RAMPE.olive, RAMPE.stoff, RAMPE.mantel, RAMPE.sack, RAMPE.hose];
  const k = kleider[Math.floor(r() * kleider.length)];
  const kopf = [RAMPE.lumpen, RAMPE.mantel, RAMPE.lederDkl, RAMPE.olive][Math.floor(r() * 4)];
  const art = seed % 5 === 0 ? 'offen' : seed % 2 ? 'kapuze' : 'tuch';
  const m = new Maler(18, 27);
  m.form(M.kap(8, 19, 8 - schritt, 25, 1.3), RAMPE.lederDkl);
  m.form(M.kap(10.5, 19, 10.5 + schritt, 25, 1.3), RAMPE.lederDkl);
  m.form(M.oder(M.ell(9.3, 11.6, 3.7, 1.9), M.poly([[5.8, 11.2], [12.8, 11.2], [12, 15], [11.3, 17.5], [12.6, 21], [6, 21], [7.2, 17.5], [6.6, 15]])), k);
  m.form(M.box(6.8, 17, 5, 1), RAMPE.lederDkl, { licht: false });
  if (r() < 0.5) m.form(M.box(3, 11, 3, 6), RAMPE.sack);  // Bündel auf dem Rücken
  if (art === 'kapuze') {
    m.form(M.oder(M.ell(9.5, 6.2, 3.7, 3.6), M.poly([[6, 5], [4.5, 9.5], [8, 9]])), kopf, { tiefe: 2 });
    m.form(M.ell(10.7, 7, 2.1, 2), [UMRISS, '#0c0a10', '#14101a', '#1c1622'], { licht: false });
  } else if (art === 'tuch') {
    m.form(M.ell(9.8, 6.3, 3.1, 3.2), RAMPE.haut);
    m.form(M.oder(M.ell(9, 4.3, 3.5, 2), M.box(6, 4.3, 2.5, 4)), kopf);
    m.form(M.box(7.5, 7, 6, 2.5), RAMPE.lumpen);
    m.punkt(11, 6, UMRISS);
  } else {
    m.form(M.ell(9.8, 6.3, 3.1, 3.2), RAMPE.haut);
    m.form(M.oder(M.ell(9, 4.3, 3.5, 2), M.box(6, 4.3, 2.5, 4)), RAMPE.haar);
    m.punkt(11, 6, UMRISS).punkt(12, 8, RAMPE.haut[1]);
  }
  return m.leinwand();
}

// ---------------------------------------------------------------------
// GEGENSTÄNDE
// ---------------------------------------------------------------------
function malWaffenSymbol(art) {
  const m = new Maler(14, 14);
  if (art === 'axt') {
    m.form(M.kap(2, 12, 10, 3, 1), RAMPE.holz);
    m.form(M.poly([[8, 1], [13, 3], [12, 8], [9, 5]]), RAMPE.stahl);
  } else if (art === 'beil') {
    m.form(M.kap(2, 12, 7, 7, 1), RAMPE.holz);
    m.form(M.poly([[6, 6], [11, 1], [13, 3], [8, 8]]), RAMPE.stahl);
  } else if (art === 'hammer') {
    m.form(M.kap(2, 12, 8, 6, 1), RAMPE.holz);
    m.form(M.poly([[6, 2], [12, 8], [10, 10], [4, 4]]), RAMPE.metall);
  } else if (art === 'stab') {
    m.form(M.kap(2, 12, 10, 4, 0.8), RAMPE.metall);
    m.form(M.ell(11, 3, 2.3, 2.3), RAMPE.lazi);
  } else if (art === 'dolch' || art === 'dolche') {
    if (art === 'dolche') { m.form(M.kap(9, 9, 13, 3, 0.9), RAMPE.stahl); m.form(M.kap(8, 6, 11, 8, 0.7), RAMPE.violett); }
    m.form(M.kap(5, 9, 11, 3, 1), RAMPE.stahl);
    m.form(M.kap(3, 7, 7, 11, 0.8), RAMPE.gold);
    m.form(M.kap(2, 12, 4, 10, 0.8), RAMPE.holz);
  } else {
    m.form(M.kap(4, 10, 12, 2, art === 'langschwert' ? 0.9 : 1.1), RAMPE.stahl);
    m.form(M.kap(2, 7, 6, 11, 0.9), RAMPE.gold);
    m.form(M.kap(1, 13, 4, 10, 0.9), RAMPE.holz);
  }
  return m.leinwand();
}
function malMuenze() { const m = new Maler(7, 7); m.form(M.ell(3.5, 3.5, 3, 3), RAMPE.gold); m.punkt(3, 3, RAMPE.gold[1]); return m.leinwand(); }
function malTeil() {
  const m = new Maler(9, 9);
  m.form(M.oder(M.ell(4.5, 4.5, 3.4, 3.4), M.box(4, 0, 1, 9), M.box(0, 4, 9, 1)), RAMPE.metall);
  m.form(M.ell(4.5, 4.5, 1.7, 1.7), RAMPE.lazi);
  return m.leinwand();
}
function malBrot() {
  const m = new Maler(10, 7);
  m.form(M.ell(5, 4, 4.5, 2.8), RAMPE.stroh, { tiefe: 2 });
  m.punkt(3, 3, RAMPE.stroh[1]).punkt(5, 2, RAMPE.stroh[1]).punkt(7, 3, RAMPE.stroh[1]);
  return m.leinwand();
}
function malBolzen() { const m = new Maler(5, 5); m.form(M.ell(2.5, 2.5, 2, 2), RAMPE.lazi); return m.leinwand(false); }
function malPfeil() { const m = new Maler(7, 3); m.form(M.box(0, 1, 6, 1), RAMPE.holz, { licht: false }); m.punkt(6, 1, RAMPE.stahl[3]); return m.leinwand(); }
function malAusruf() {
  const m = new Maler(5, 10);
  m.form(M.box(1, 0, 3, 6), RAMPE.gelb); m.form(M.box(1, 7, 3, 3), RAMPE.gelb);
  return m.leinwand();
}

function malTruhe(offen) {
  const m = new Maler(24, 20);
  if (offen) {
    m.form(M.box(2, 1, 20, 6), RAMPE.holz);
    m.form(M.oder(M.box(5, 1, 2, 6), M.box(17, 1, 2, 6)), RAMPE.gold);
    m.form(M.box(3, 7, 18, 3), [UMRISS, '#ffb030', '#ffe070', '#fff8c0'], { licht: false });
  } else {
    m.form(M.und(M.ell(12, 10, 10.5, 6), M.box(0, 3, 24, 7)), RAMPE.holz, { tiefe: 2 });
  }
  m.form(M.box(2, 9, 20, 10), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(M.box(5, offen ? 9 : 4, 2, offen ? 10 : 15), M.box(17, offen ? 9 : 4, 2, offen ? 10 : 15)), RAMPE.gold, { licht: false });
  m.form(M.box(10, 9, 4, 4), RAMPE.gold);
  m.punkt(12, 11, UMRISS);
  return m.leinwand();
}

function malLaziTurm() {
  const m = new Maler(20, 38);
  // Sockel aus Stein und Schrott
  m.form(M.poly([[3, 37], [17, 37], [15, 22], [5, 22]]), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(4, 26, 12, 2), RAMPE.metall);
  m.form(M.box(6, 31, 3, 3), RAMPE.lazi);
  // Mast
  m.form(M.box(8, 12, 4, 11), RAMPE.metall);
  m.form(M.oder(M.kap(10, 14, 4, 10, 0.8), M.kap(10, 14, 16, 10, 0.8)), RAMPE.rost);
  // Lazi-Kristall
  m.form(M.poly([[10, 1], [14, 6], [10, 12], [6, 6]]), RAMPE.lazi, { tiefe: 2 });
  m.punkt(9, 4, RAMPE.lazi[3]).punkt(9, 5, RAMPE.lazi[3]);
  return m.leinwand();
}

// ---------------------------------------------------------------------
// MISSION: Schulhof
// ---------------------------------------------------------------------
function malSchule() {
  const w = 176, h = 96, m = new Maler(w, h), r = zufall(42);
  // Gebäude mit abgebrochener rechter Ecke
  const bruch = (x, y) => x > 140 && y < 10 + (x - 140) * 0.9;
  m.form(M.ohne(M.box(4, 10, w - 8, h - 10), bruch), RAMPE.beton, { tiefe: 2 });
  // Dachkante
  m.form(M.ohne(M.box(2, 8, w - 4, 5), bruch), RAMPE.stein);
  // Fenster
  for (let reihe = 0; reihe < 2; reihe++) for (let i = 0; i < 7; i++) {
    const x = 10 + i * 23, y = 20 + reihe * 30;
    if (i === 3) continue;
    if (bruch(x + 10, y)) continue;
    m.form(M.box(x, y, 16, 18), [UMRISS, '#141a2a', '#1e2a40', '#2a3c58'], { licht: false });
    m.form(M.oder(M.box(x, y + 8, 16, 2), M.box(x + 7, y, 2, 18)), RAMPE.metall, { licht: false });
    if (r() < 0.6) { m.punkt(x + 2, y + 2, '#6a8ab0').punkt(x + 3, y + 2, '#6a8ab0').punkt(x + 2, y + 3, '#4a6a90'); }
    if (r() < 0.4) m.form(M.poly([[x + 9, y + 10], [x + 16, y + 10], [x + 16, y + 18]]), [UMRISS, '#0c1018', '#0c1018', '#0c1018'], { licht: false });
  }
  // Eingang mit Uhr darüber
  m.form(M.box(76, 50, 26, 46), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(80, 56, 18, 40), [UMRISS, '#1a1220', '#241828', '#2e2032'], { licht: false });
  m.form(M.ell(89, 30, 8, 8), RAMPE.stein);
  m.form(M.ell(89, 30, 6, 6), RAMPE.putz);
  m.punkt(89, 30, UMRISS).punkt(89, 29, UMRISS).punkt(89, 28, UMRISS).punkt(90, 31, UMRISS).punkt(91, 32, UMRISS);
  // Schriftzug-Rest: verblasste Buchstaben-Balken
  for (let i = 0; i < 9; i++) if (r() < 0.75) m.form(M.box(64 + i * 6, 14, 4, 3), RAMPE.gelb, { licht: false, kante: false });
  // Risse
  for (let k = 0; k < 10; k++) {
    let x = 10 + r() * 150 | 0, y = 14 + r() * 60 | 0;
    for (let s = 0; s < 16; s++) { if (m.get(x, y)) m.punkt(x, y, RAMPE.beton[0]); x += r() < 0.5 ? 1 : -1; y += 1; }
  }
  // Ranken und Efeu
  for (let k = 0; k < 14; k++) {
    let x = 6 + r() * 160 | 0, y = h - 1;
    const len = 12 + r() * 50;
    for (let s = 0; s < len; s++) {
      if (m.get(x, y)) { m.punkt(x, y, r() < 0.5 ? RAMPE.blatt[2] : RAMPE.blatt[1]); if (r() < 0.5 && m.get(x + 1, y)) m.punkt(x + 1, y, RAMPE.blatt[3]); }
      y -= 1; x += r() < 0.3 ? (r() < 0.5 ? 1 : -1) : 0; if (y < 12) break;
    }
  }
  return m.leinwand();
}

function malKellertuer(stufe) {
  const m = new Maler(40, 26);
  // Sandsäcke
  m.form(M.oder(M.ell(5, 21, 5, 3.5), M.ell(35, 21, 5, 3.5), M.ell(8, 17, 4.5, 3)), RAMPE.sack);
  // schräge Doppeltür aus Metall
  m.form(M.poly([[9, 23], [31, 23], [28, 6], [12, 6]]), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(19, 6, 2, 17), [UMRISS, UMRISS, UMRISS, UMRISS], { licht: false });
  m.form(M.oder(M.box(14, 13, 4, 2), M.box(22, 13, 4, 2)), RAMPE.gold);
  if (stufe >= 1) {
    for (let i = 0; i < 7; i++) m.punkt(13 + i * 2, 9 + (i % 3) * 3, RAMPE.rost[2]);
    m.form(M.poly([[23, 7], [28, 7], [26, 12]]), [UMRISS, '#0c0810', '#0c0810', '#0c0810'], { licht: false });
  }
  if (stufe >= 2) {
    m.form(M.poly([[12, 14], [19, 10], [19, 22], [11, 22]]), [UMRISS, '#0c0810', '#160e18', '#160e18'], { licht: false });
    m.punkt(15, 18, '#ffd070').punkt(16, 18, '#ffb050');
  }
  m.form(M.ell(31, 18, 4, 2.6), RAMPE.sack);
  return m.leinwand();
}

// Bunkertor: runde Stahltür der Alten in einem Betonrahmen, Rad in der Mitte, Nummer und Statuslicht.
// stufe 0 bis 2: unversehrt, verbeult, aufgebrochen
function malBunkertor(stufe) {
  const m = new Maler(40, 28);
  m.form(M.oder(M.ell(4, 23, 4.5, 3.4), M.ell(36, 23, 4.5, 3.4)), RAMPE.sack);
  m.form(M.box(6, 3, 28, 23), RAMPE.beton, { tiefe: 2 });
  m.form(M.ell(20, 14, 10, 10), [UMRISS, '#1e2236', '#2e3450', '#3e4660'], { licht: false });
  m.form(M.ell(20, 14, 8.6, 8.6), RAMPE.stahl, { tiefe: 2 });
  m.form(M.ell(20, 14, 3.4, 3.4), RAMPE.metall);
  m.form(M.oder(M.kap(16, 14, 24, 14, 0.6), M.kap(20, 10, 20, 18, 0.6)), RAMPE.gelb);
  m.punkt(20, 14, RAMPE.gelb[3]);
  // Schablonen-Nummer 17 und das Statuslicht
  [[13, 7], [13, 8], [13, 9], [15, 7], [16, 7], [16, 8], [15, 9]].forEach(([x, y]) => m.punkt(x, y, '#e8c040'));
  m.punkt(30, 5, stufe < 2 ? '#7ad37a' : '#ff5a4a').punkt(31, 5, stufe < 2 ? '#c0ffb0' : '#ff9a80');
  if (stufe >= 1) {
    for (let i = 0; i < 8; i++) m.punkt(14 + (i * 5) % 13, 9 + (i * 3) % 10, RAMPE.rost[2]);
    m.form(M.poly([[24, 7], [28, 9], [25, 12]]), [UMRISS, '#0c0810', '#0c0810', '#0c0810'], { licht: false });
  }
  if (stufe >= 2) {
    m.form(M.poly([[12, 12], [19, 8], [21, 20], [13, 21]]), [UMRISS, '#0c0810', '#160e18', '#160e18'], { licht: false });
    m.punkt(16, 16, '#e0f0ff').punkt(17, 16, '#a0c0ff');
  }
  m.form(M.ell(33, 20, 4, 2.6), RAMPE.sack);
  return m.leinwand();
}
// Der Betonklotz über dem Bunker: Lüftungsschächte, Moos, eine verblasste Aufschrift
function malBunkerklotz() {
  const w = 120, h = 64, m = new Maler(w, h), r = zufall(17);
  m.form(M.poly([[6, h - 2], [14, 8], [w - 14, 8], [w - 6, h - 2]]), RAMPE.beton, { tiefe: 3 });
  m.form(M.box(12, 6, w - 24, 4), RAMPE.stein);
  [[28, 0], [w - 34, 2]].forEach(([x, y]) => { m.form(M.box(x, y, 8, 10), RAMPE.metall, { tiefe: 2 }); for (let i = 0; i < 3; i++) m.form(M.box(x + 1, y + 2 + i * 3, 6, 1), [UMRISS, UMRISS, UMRISS, UMRISS], { licht: false }); });
  for (let i = 0; i < 160; i++) { const x = 10 + r() * (w - 20) | 0, y = 12 + r() * (h - 16) | 0; if (r() < 0.5) m.punkt(x, y, r() < 0.5 ? RAMPE.moos[1] : RAMPE.moos[2]); else if (r() < 0.3) m.punkt(x, y, '#3e3c4c'); }
  // L.A.C.I. in Schablonenschrift, halb abgeblättert
  const buchstaben = [[0, 0, 1, 5], [0, 4, 3, 1], [5, 0, 1, 5], [5, 0, 3, 1], [7, 0, 1, 5], [5, 2, 3, 1], [10, 0, 1, 5], [10, 0, 3, 1], [10, 4, 3, 1], [15, 0, 1, 5]];
  buchstaben.forEach(([x, y, bw, bh], i) => { if (i % 4 !== 3) m.form(M.box(46 + x, 22 + y, bw, bh), ['#8a7a48', '#8a7a48', '#a89458', '#a89458'], { licht: false, kante: false }); });
  return m.leinwand();
}

function malZaun() {
  const m = new Maler(18, 16);
  m.form(M.oder(M.box(1, 2, 2, 14), M.box(15, 2, 2, 14)), RAMPE.metall);
  for (let y = 4; y < 15; y += 2) for (let x = 3; x < 15; x++) if ((x + y) % 4 === 0) m.punkt(x, y, RAMPE.metall[2]);
  for (let y = 5; y < 15; y += 2) for (let x = 3; x < 15; x++) if ((x - y) % 4 === 0) m.punkt(x, y, RAMPE.metall[1]);
  m.form(M.box(1, 2, 16, 1), RAMPE.rost, { licht: false });
  m.punkt(6, 9, RAMPE.rost[2]).punkt(11, 7, RAMPE.rost[2]);
  return m.leinwand();
}

function malBus() {
  const m = new Maler(84, 40), r = zufall(5);
  // Räder
  m.form(M.oder(M.ell(18, 34, 5, 5), M.ell(66, 34, 5, 5)), [UMRISS, '#1a1420', '#2a2230', '#3a3040']);
  // Karosserie
  m.form(M.poly([[2, 34], [82, 34], [82, 10], [76, 4], [4, 4], [2, 8]]), RAMPE.gelb, { tiefe: 2 });
  m.form(M.box(2, 25, 80, 3), RAMPE.metall, { licht: false });
  // Fenster
  for (let i = 0; i < 7; i++) {
    const x = 6 + i * 10;
    m.form(M.box(x, 8, 8, 10), [UMRISS, '#141a2a', '#2a3a58', '#4a6a90'], { licht: false });
    if (r() < 0.5) m.form(M.poly([[x + 2, 8], [x + 8, 8], [x + 8, 15]]), [UMRISS, '#0c1018', '#0c1018', '#0c1018'], { licht: false });
  }
  m.form(M.box(74, 8, 6, 14), [UMRISS, '#141a2a', '#2a3a58', '#4a6a90'], { licht: false });
  // Rost und Pflanzen
  for (let k = 0; k < 40; k++) { const x = 3 + r() * 78 | 0, y = 19 + r() * 14 | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.5 ? RAMPE.rost[1] : RAMPE.rost[2]); }
  for (let k = 0; k < 18; k++) { const x = 3 + r() * 78 | 0, y = 3 + r() * 4 | 0; m.punkt(x, y, r() < 0.5 ? RAMPE.blatt[2] : RAMPE.blattH[3]); }
  return m.leinwand();
}

function malFahrradstaender() {
  const m = new Maler(30, 18);
  m.form(M.box(1, 14, 28, 2), RAMPE.metall);
  for (let i = 0; i < 4; i++) m.form(M.kap(4 + i * 7, 14, 4 + i * 7, 6, 0.7), RAMPE.metall, { licht: false });
  // ein altes Fahrrad
  m.form(M.oder(M.ell(9, 12, 4, 4), M.ell(20, 12, 4, 4)), [RAMPE.rost[0], RAMPE.rost[1], RAMPE.rost[1], RAMPE.rost[2]]);
  m.form(M.oder(M.ell(9, 12, 2.6, 2.6), M.ell(20, 12, 2.6, 2.6)), [UMRISS, UMRISS, UMRISS, UMRISS], { licht: false, kante: false });
  m.form(M.oder(M.kap(9, 12, 14, 7, 0.6), M.kap(14, 7, 20, 12, 0.6), M.kap(14, 7, 18, 6, 0.6)), RAMPE.rot, { licht: false });
  return m.leinwand();
}

function malKorb() {
  const m = new Maler(22, 48);
  m.form(M.box(9, 14, 3, 34), RAMPE.metall);
  m.form(M.box(3, 2, 16, 12), RAMPE.putz);
  m.form(M.box(7, 7, 8, 5), [RAMPE.rot[0], RAMPE.rot[2], RAMPE.rot[2], RAMPE.rot[2]], { licht: false });
  m.form(M.box(8, 8, 6, 3), RAMPE.putz, { licht: false });
  m.form(M.ell(11, 14, 5, 1.5), RAMPE.rost);
  return m.leinwand();
}
function malTonne() {
  const m = new Maler(14, 18);
  m.form(M.box(2, 4, 10, 14), RAMPE.blau);
  m.form(M.box(1, 2, 12, 3), RAMPE.metall);
  m.punkt(5, 9, RAMPE.rost[2]).punkt(9, 12, RAMPE.rost[1]);
  return m.leinwand();
}
function malBarrikade() {
  const m = new Maler(30, 20);
  m.form(M.box(2, 8, 11, 11), RAMPE.holz);
  m.form(M.oder(M.box(2, 13, 11, 1), M.box(7, 8, 1, 11)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.box(14, 11, 13, 8), RAMPE.holz);
  m.form(M.kap(1, 5, 28, 12, 1.4), RAMPE.holz);
  m.form(M.oder(M.ell(22, 8, 5, 3), M.ell(17, 18, 4, 2)), RAMPE.sack);
  return m.leinwand();
}

// ---------------------------------------------------------------------
// NATUR
// ---------------------------------------------------------------------
function malLaubbaum(seed) {
  const r = zufall(seed);
  const m = new Maler(40, 52);
  m.form(M.oder(M.kap(20, 50, 20, 30, 2.8), M.kap(20, 36, 13, 28, 1.4), M.kap(20, 34, 27, 27, 1.4)), RAMPE.holz, { tiefe: 2 });
  const blobs = [];
  for (let i = 0; i < 7; i++) blobs.push([10 + r() * 20, 10 + r() * 16, 6 + r() * 5]);
  blobs.push([20, 18, 11]);
  m.form(M.oder(...blobs.map(([x, y, rr]) => M.ell(x, y, rr, rr * 0.9))), seed % 2 ? RAMPE.blatt : RAMPE.blattH, { tiefe: 3 });
  for (let i = 0; i < 30; i++) {
    const x = r() * 40 | 0, y = r() * 36 | 0, c = m.get(x, y);
    if (c && c !== UMRISS) m.punkt(x, y, r() < 0.5 ? (seed % 2 ? RAMPE.blatt[3] : RAMPE.blattH[3]) : (seed % 2 ? RAMPE.blatt[1] : RAMPE.blattH[1]));
  }
  return m.leinwand();
}
function malTanne(seed) {
  const r = zufall(seed);
  const m = new Maler(30, 48);
  m.form(M.box(13, 38, 4, 10), RAMPE.holz);
  for (let s = 0; s < 4; s++) {
    const top = 2 + s * 9, breite = 6 + s * 3.2;
    m.form(M.poly([[15, top], [15 + breite, top + 13], [15 - breite, top + 13]]), RAMPE.nadel, { tiefe: 2 });
  }
  for (let i = 0; i < 16; i++) { const x = r() * 30 | 0, y = r() * 44 | 0, c = m.get(x, y); if (c && c !== UMRISS && c !== RAMPE.nadel[0]) m.punkt(x, y, RAMPE.nadel[3]); }
  return m.leinwand();
}
function malBusch(seed) {
  const r = zufall(seed);
  const m = new Maler(22, 14);
  m.form(M.oder(M.ell(7, 9, 6, 5), M.ell(14, 8, 7, 6), M.ell(11, 6, 5, 4)), RAMPE.blattH, { tiefe: 2 });
  if (seed % 3 === 0) for (let i = 0; i < 4; i++) { const x = 4 + r() * 14 | 0, y = 4 + r() * 6 | 0; m.punkt(x, y, '#ff8ab0'); }
  return m.leinwand();
}

// ---------------------------------------------------------------------
// DORF-GEBÄUDE
// ---------------------------------------------------------------------
function malWohnhaus(seed) {
  const r = zufall(seed);
  const m = new Maler(40, 40);
  // Wände mit Fachwerk
  m.form(M.box(5, 18, 30, 21), RAMPE.putz, { tiefe: 2 });
  m.form(M.oder(M.box(5, 18, 30, 2), M.box(5, 28, 30, 1), M.box(5, 18, 2, 21), M.box(33, 18, 2, 21), M.kap(8, 20, 14, 27, 0.6), M.kap(26, 27, 32, 20, 0.6)), RAMPE.holz, { licht: false });
  // Tür und Fenster mit warmem Licht
  m.form(M.box(17, 28, 7, 11), RAMPE.holz);
  m.punkt(22, 33, RAMPE.gold[2]);
  m.form(M.box(8, 30, 6, 5), [RAMPE.holz[0], '#e08a30', '#ffc860', '#fff0a0']);
  m.form(M.box(27, 30, 6, 5), [RAMPE.holz[0], '#e08a30', '#ffc860', '#fff0a0']);
  // Strohdach
  m.form(M.poly([[1, 20], [20, 3], [39, 20], [36, 22], [4, 22]]), RAMPE.stroh, { tiefe: 2 });
  for (let i = 0; i < 26; i++) { const x = 4 + r() * 32 | 0, y = 6 + r() * 15 | 0, c = m.get(x, y); if (c === RAMPE.stroh[2]) m.punkt(x, y, r() < 0.5 ? RAMPE.stroh[1] : RAMPE.stroh[3]); }
  // Schornstein
  m.form(M.box(27, 4, 4, 9), RAMPE.ziegel);
  return m.leinwand();
}
function malLager() {
  const m = new Maler(40, 42);
  // Pfähle
  m.form(M.oder(M.box(8, 32, 3, 9), M.box(29, 32, 3, 9)), RAMPE.holz);
  // Speicher aus Brettern
  m.form(M.box(5, 16, 30, 17), RAMPE.holz, { tiefe: 2 });
  for (let x = 9; x < 35; x += 5) m.form(M.box(x, 17, 1, 15), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.box(16, 21, 8, 8), RAMPE.lederDkl);
  // Dach
  m.form(M.poly([[2, 18], [20, 4], [38, 18]]), RAMPE.ziegel, { tiefe: 2 });
  // Säcke, Fass, Kürbisse davor
  m.form(M.oder(M.ell(6, 37, 4, 4), M.ell(12, 38, 3.5, 3.5)), RAMPE.sack);
  m.form(M.box(28, 33, 7, 8), RAMPE.holz);
  m.form(M.oder(M.box(28, 35, 7, 1), M.box(28, 39, 7, 1)), RAMPE.metall, { licht: false });
  m.form(M.ell(20, 39, 3, 2.5), RAMPE.rost);
  return m.leinwand();
}
function malSchmiede(glut) {
  const m = new Maler(52, 44);
  // Steinsockel und Wand
  m.form(M.box(3, 18, 46, 25), RAMPE.stein, { tiefe: 2 });
  for (let y = 22; y < 42; y += 5) for (let x = (y % 2 ? 3 : 7); x < 48; x += 8) m.form(M.box(x, y, 1, 4), [RAMPE.stein[0], RAMPE.stein[1], RAMPE.stein[1], RAMPE.stein[1]], { licht: false, kante: false });
  // offene Front mit Esse
  m.form(M.box(8, 24, 20, 19), [UMRISS, '#2a1418', '#3a1c1e', '#4a2422'], { licht: false });
  m.form(M.ell(18, 38, 7, 4), glut ? RAMPE.feuer : [RAMPE.feuer[0], RAMPE.feuer[0], RAMPE.feuer[1], RAMPE.feuer[2]]);
  // Amboss
  m.form(M.oder(M.box(32, 34, 12, 3), M.box(35, 37, 6, 5)), RAMPE.metall);
  // Dach aus Holzschindeln
  m.form(M.poly([[0, 20], [8, 6], [44, 6], [52, 20]]), RAMPE.holz, { tiefe: 2 });
  for (let x = 4; x < 50; x += 4) m.form(M.box(x, 9, 1, 10), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  // Schornstein
  m.form(M.box(38, 0, 7, 12), RAMPE.ziegel);
  return m.leinwand();
}
function malWerkstatt(an) {
  const m = new Maler(52, 46), r = zufall(11);
  // Wände aus Wellblech
  m.form(M.box(3, 18, 46, 27), RAMPE.metall, { tiefe: 2 });
  for (let x = 5; x < 48; x += 3) m.form(M.box(x, 19, 1, 25), [RAMPE.metall[0], RAMPE.metall[1], RAMPE.metall[1], RAMPE.metall[1]], { licht: false, kante: false });
  for (let k = 0; k < 30; k++) { const x = 4 + r() * 44 | 0, y = 19 + r() * 25 | 0; m.punkt(x, y, r() < 0.5 ? RAMPE.rost[1] : RAMPE.rost[2]); }
  // Tor
  m.form(M.box(14, 28, 18, 17), [UMRISS, '#141826', '#1c2234', '#262e44'], { licht: false });
  // Lazi-Lichter
  const l = an ? RAMPE.lazi : [RAMPE.lazi[0], RAMPE.lazi[0], RAMPE.lazi[1], RAMPE.lazi[2]];
  m.form(M.oder(M.ell(9, 26, 2, 2), M.ell(39, 26, 2, 2), M.box(16, 31, 14, 1)), l, { licht: false });
  // Zahnrad an der Wand
  m.form(M.oder(M.ell(40, 37, 5, 5), M.box(39, 30, 3, 14), M.box(33, 36, 14, 3)), RAMPE.rost);
  m.form(M.ell(40, 37, 2, 2), RAMPE.metall);
  // schräges Blechdach mit Antenne
  m.form(M.poly([[0, 20], [6, 8], [48, 4], [52, 18]]), RAMPE.rost, { tiefe: 2 });
  m.form(M.kap(12, 7, 12, 0, 0.6), RAMPE.metall);
  m.punkt(12, 0, l[3]);
  return m.leinwand();
}
function malKaserne() {
  const m = new Maler(52, 44);
  // Palisade
  for (let x = 2; x < 50; x += 4) m.form(M.poly([[x, 43], [x + 4, 43], [x + 4, 20], [x + 2, 16], [x, 20]]), RAMPE.holz);
  // Tor
  m.form(M.box(19, 26, 14, 17), RAMPE.lederDkl);
  m.form(M.oder(M.box(19, 30, 14, 1), M.box(19, 37, 14, 1)), RAMPE.metall, { licht: false });
  // Fahne
  m.form(M.box(25, 0, 2, 18), RAMPE.metall);
  m.form(M.poly([[27, 1], [38, 4], [27, 8]]), RAMPE.blau);
  return m.leinwand();
}
function malLagerfeuer(f) {
  const m = new Maler(22, 20);
  m.form(M.oder(M.ell(4, 16, 3, 2.5), M.ell(18, 16, 3, 2.5), M.ell(8, 18, 3, 2), M.ell(14, 18, 3, 2)), RAMPE.stein);
  m.form(M.oder(M.kap(5, 17, 16, 13, 1.5), M.kap(6, 13, 17, 17, 1.5)), RAMPE.holz);
  const o = f ? 1 : 0;
  m.form(M.poly([[6, 14], [9, 5 + o], [11, 9], [13, 2 - o], [16, 14]]), RAMPE.feuer, { kante: false });
  m.form(M.poly([[9, 14], [11, 8 - o], [13, 14]]), [RAMPE.feuer[3], RAMPE.feuer[3], RAMPE.feuer[3], '#ffffff'], { kante: false });
  return m.leinwand();
}

// ---------------------------------------------------------------------
// FÄHIGKEITEN: Feuerballiste, Sprengfalle, Köderpuppe, Wurfdolch, Klinge
// ---------------------------------------------------------------------
function malFeuerballiste(f) {
  const m = new Maler(36, 32);
  // Gestell aus Eisen auf einem Holzsockel
  m.form(M.box(4, 24, 28, 7), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(M.box(4, 26, 28, 1), M.box(12, 24, 1, 7), M.box(23, 24, 1, 7)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.oder(M.kap(18, 22, 10, 25, 1.4), M.kap(18, 22, 26, 25, 1.4)), RAMPE.eisenDkl);
  m.form(M.box(6, 15, 25, 5), RAMPE.eisenDkl, { tiefe: 2 });
  // Bogen und Sehne
  m.form(M.oder(M.kap(27, 4, 31, 15, 1.3), M.kap(31, 15, 27, 26, 1.3)), RAMPE.stahl, { tiefe: 2 });
  m.form(M.kap(27, 4, 27, 26, 0.4), RAMPE.putz, { licht: false });
  // Brennender Bolzen
  m.form(M.box(9, 16, 24, 2), RAMPE.holz, { licht: false });
  m.form(M.poly([[32, 14], [36, 17], [32, 20]]), RAMPE.stahl);
  m.form(M.poly([[30, 15], [33, 9 + (f ? 1 : 0)], [35, 13], [36, 17], [31, 19]]), RAMPE.feuer, { kante: false });
  // Glutbecken
  m.form(M.box(5, 19, 6, 5), RAMPE.metall);
  m.form(M.poly([[5, 19], [7, 13 - (f ? 1 : 0)], [8, 16], [10, 12 + (f ? 1 : 0)], [11, 19]]), RAMPE.feuer, { kante: false });
  return m.leinwand();
}
function malSprengfalle() {
  const m = new Maler(14, 8);
  m.form(M.ell(7, 5, 6, 2.6), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.ell(7, 4, 4, 1.6), RAMPE.metall);
  m.punkt(7, 3, '#ff3a3a').punkt(6, 3, '#ff9a80');
  return m.leinwand();
}
function malKoederpuppe() {
  const m = new Maler(20, 32);
  m.form(M.box(9, 18, 2, 14), RAMPE.holz);
  m.form(M.kap(3, 14, 17, 14, 1.3), RAMPE.holz);
  // Strohkörper mit violettem Schal, wie der Schattenläufer
  m.form(M.oder(M.ell(10, 16, 5, 6), M.box(6, 12, 8, 8)), RAMPE.sack, { tiefe: 2 });
  m.form(M.ell(10, 7, 4, 4), RAMPE.sack);
  m.form(M.poly([[5, 10], [15, 10], [14, 13], [8, 13], [3, 17]]), RAMPE.violett);
  m.punkt(9, 6, UMRISS).punkt(12, 6, UMRISS);
  for (let i = 0; i < 4; i++) m.punkt(7 + i * 2, 18 + (i % 2), RAMPE.stroh[3]);
  m.form(M.box(8, 15, 4, 1), RAMPE.rot, { licht: false });
  return m.leinwand();
}
function malWurfdolch() {
  const m = new Maler(10, 4);
  m.form(M.poly([[3, 1], [9, 2], [3, 3]]), RAMPE.stahl, { licht: false });
  m.form(M.box(2, 0, 1, 4), RAMPE.gold, { licht: false });
  m.form(M.box(0, 1, 2, 2), RAMPE.lederDkl, { licht: false });
  return m.leinwand();
}
function malGeisterklinge() {
  const m = new Maler(16, 6);
  m.form(M.poly([[4, 1.5], [15, 3], [4, 4.5]]), RAMPE.lazi);
  m.form(M.box(3, 0, 1, 6), RAMPE.gold, { licht: false });
  m.form(M.box(0, 2, 3, 2), RAMPE.metall, { licht: false });
  return m.leinwand();
}
function malOelfass() {
  const m = new Maler(14, 18);
  m.form(M.box(2, 3, 10, 14), RAMPE.rot, { tiefe: 2 });
  m.form(M.oder(M.box(2, 6, 10, 1), M.box(2, 13, 10, 1)), RAMPE.metall, { licht: false });
  m.form(M.ell(7, 3, 5, 1.6), RAMPE.metall);
  m.punkt(5, 9, RAMPE.gelb[2]).punkt(6, 9, RAMPE.gelb[2]).punkt(7, 9, RAMPE.gelb[2]);
  return m.leinwand();
}

// ---------------------------------------------------------------------
// SYMBOLE: Rüstungen, Lazi-Module und Werte (für Beutel und Karten)
// ---------------------------------------------------------------------
function malRuestungSymbol(art) {
  const m = new Maler(14, 14);
  const r = { lumpen: RAMPE.lumpen, leder: RAMPE.leder, mantel: RAMPE.mantel, kette: RAMPE.metall, platte: RAMPE.stahl, weste: RAMPE.mantel }[art] || RAMPE.leder;
  const rumpf = M.oder(M.poly([[3, 3], [11, 3], [12, 12], [2, 12]]), M.ell(2.5, 4.5, 2, 2), M.ell(11.5, 4.5, 2, 2));
  if (art === 'mantel') m.form(M.oder(M.poly([[3, 1], [11, 1], [13, 13], [1, 13]]), M.ell(7, 2, 4, 2)), r);
  else m.form(rumpf, r);
  if (art === 'kette') for (let y = 4; y < 12; y += 2) for (let x = 3 + (y % 4 ? 1 : 0); x < 12; x += 2) m.punkt(x, y, RAMPE.metall[1]);
  if (art === 'platte') { m.form(M.box(6.5, 3, 1, 9), RAMPE.stahl, { licht: false, kante: false }); m.punkt(7, 11, RAMPE.gold[2]); }
  if (art === 'leder') m.form(M.box(3, 8, 9, 1), RAMPE.lederDkl, { licht: false });
  if (art === 'lumpen') { m.punkt(5, 6, RAMPE.sack[2]).punkt(6, 6, RAMPE.sack[2]).punkt(9, 9, RAMPE.olive[2]).punkt(10, 9, RAMPE.olive[2]); }
  if (art === 'weste') { m.form(M.oder(M.ell(5, 7, 1.3, 1.3), M.ell(9, 7, 1.3, 1.3)), RAMPE.lazi, { licht: false }); m.form(M.box(6.5, 3, 1, 9), RAMPE.metall, { licht: false, kante: false }); }
  if (art !== 'mantel') m.form(M.ell(7, 2.5, 2, 1.2), [UMRISS, '#0a0812', '#0a0812', '#0a0812'], { licht: false, kante: false });
  return m.leinwand();
}
function malModulSymbol(art) {
  const m = new Maler(14, 14);
  m.form(M.kap(7, 0, 7, 2, 0.5), RAMPE.metall, { licht: false });
  if (art === 'zahnrad') {
    const zahn = [];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; zahn.push(M.ell(7 + Math.cos(a) * 4.8, 8 + Math.sin(a) * 4.8, 1.2, 1.2)); }
    m.form(M.oder(M.ell(7, 8, 4.3, 4.3), ...zahn), RAMPE.gold);
    m.form(M.ell(7, 8, 1.6, 1.6), [UMRISS, '#0a0812', '#0a0812', '#0a0812'], { licht: false });
  } else if (art === 'spule') {
    m.form(M.box(3, 4, 8, 9), RAMPE.rost, { licht: false });
    for (let y = 5; y < 13; y += 2) m.form(M.box(3, y, 8, 1), RAMPE.gold, { licht: false, kante: false });
    m.form(M.oder(M.box(2, 3, 10, 1), M.box(2, 12, 10, 1)), RAMPE.metall, { licht: false });
  } else if (art === 'linse') {
    m.form(M.ell(7, 8, 5, 5), RAMPE.metall);
    m.form(M.ell(7, 8, 3.4, 3.4), RAMPE.blau);
    m.punkt(5, 6, '#e0f0ff').punkt(8, 9, UMRISS).punkt(9, 10, UMRISS).punkt(10, 11, UMRISS);
  } else if (art === 'chip') {
    m.form(M.box(3, 4, 8, 8), RAMPE.olive);
    for (let i = 0; i < 4; i++) { m.punkt(2, 5 + i * 2, RAMPE.gold[2]); m.punkt(11, 5 + i * 2, RAMPE.gold[2]); }
    m.form(M.box(5, 6, 4, 4), RAMPE.eisenDkl, { licht: false });
    m.punkt(6, 7, RAMPE.lazi[2]);
  } else {
    m.form(M.poly([[7, 2], [12, 8], [7, 14], [2, 8]]), RAMPE.metall);
    m.form(M.poly([[7, 4], [10, 8], [7, 12], [4, 8]]), RAMPE.lazi, { licht: false });
    m.punkt(6, 7, RAMPE.lazi[3]);
  }
  return m.leinwand();
}
// Wert-Symbole 9 x 9: Schwert, Uhr, Tropfen, Herz, Schild, springender Schuh, geteilter Bluttropfen
function malWertSymbol(art) {
  const m = new Maler(9, 9);
  if (art === 'schaden') {
    m.form(M.kap(3, 6, 8, 1, 0.7), RAMPE.stahl, { licht: false });
    m.form(M.kap(1, 4, 5, 8, 0.6), RAMPE.gold, { licht: false });
    m.punkt(1, 8, RAMPE.holz[2]);
  } else if (art === 'tempo') {
    m.form(M.ell(4.5, 4.5, 4, 4), RAMPE.putz, { licht: false });
    m.punkt(4, 2, UMRISS).punkt(4, 3, UMRISS).punkt(4, 4, UMRISS).punkt(5, 4, UMRISS).punkt(6, 4, UMRISS);
  } else if (art === 'mana') {
    m.form(M.oder(M.poly([[4.5, 0], [8, 5], [1, 5]]), M.ell(4.5, 5.5, 3.4, 3.2)), RAMPE.blau, { licht: false });
    m.punkt(3, 5, '#c0e0ff');
  } else if (art === 'leben') {
    m.form(M.oder(M.ell(2.6, 3, 2.4, 2.2), M.ell(6.4, 3, 2.4, 2.2), M.poly([[0.4, 3.6], [8.6, 3.6], [4.5, 8.6]])), RAMPE.rot, { licht: false });
    m.punkt(2, 2, '#ffc0b0');
  } else if (art === 'ruestung') {
    m.form(M.oder(M.box(1, 0.5, 7, 4.5), M.poly([[1, 4], [8, 4], [4.5, 9]])), RAMPE.stahl, { licht: false });
    m.form(M.box(4, 1, 1, 6), RAMPE.metall, { licht: false, kante: false });
  } else if (art === 'ausweichen') {
    // Schuh, schräg im Sprung, mit Bewegungsstrichen
    m.form(M.poly([[3, 1], [6, 1], [6, 4], [9, 6], [8.5, 7.5], [3.5, 6.5]]), RAMPE.leder, { licht: false });
    m.form(M.box(3.5, 6.5, 5, 1), RAMPE.lederDkl, { licht: false, kante: false });
    m.punkt(0, 3, RAMPE.putz[2]).punkt(1, 3, RAMPE.putz[2]).punkt(0, 6, RAMPE.putz[1]).punkt(1, 5, RAMPE.putz[2]);
  } else if (art === 'krit') {
    // Bluttropfen, in der Mitte durchgeschnitten
    m.form(M.oder(M.poly([[4.5, 0], [8, 5], [1, 5]]), M.ell(4.5, 5.5, 3.4, 3.2)), RAMPE.rot, { licht: false });
    for (let i = 0; i < 9; i++) m.set(8 - i, i, null);
    m.punkt(8, 0, '#ffffff').punkt(7, 1, '#e0e0e0');
  }
  return m.leinwand();
}

// ---------------------------------------------------------------------
// NEUE DORF-GEBÄUDE
// ---------------------------------------------------------------------
function malSteinhaus(seed) {
  const r = zufall(seed + 50);
  const m = new Maler(40, 42);
  m.form(M.box(5, 18, 30, 23), RAMPE.stein, { tiefe: 2 });
  for (let y = 21; y < 40; y += 4) for (let x = (y % 8 ? 5 : 9); x < 34; x += 8) m.form(M.box(x, y, 1, 3), [RAMPE.stein[0], RAMPE.stein[1], RAMPE.stein[1], RAMPE.stein[1]], { licht: false, kante: false });
  m.form(M.box(17, 29, 7, 12), RAMPE.holz);
  m.form(M.oder(M.box(17, 33, 7, 1)), RAMPE.metall, { licht: false });
  m.form(M.box(8, 25, 6, 6), [RAMPE.metall[0], '#e08a30', '#ffc860', '#fff0a0']);
  m.form(M.box(27, 25, 6, 6), [RAMPE.metall[0], '#e08a30', '#ffc860', '#fff0a0']);
  m.form(M.oder(M.box(8, 27, 6, 1), M.box(27, 27, 6, 1)), RAMPE.metall, { licht: false, kante: false });
  m.form(M.poly([[1, 20], [20, 2], [39, 20], [36, 22], [4, 22]]), RAMPE.ziegel, { tiefe: 2 });
  for (let y = 6; y < 21; y += 3) for (let x = 2; x < 38; x++) { const c = m.get(x, y); if (c === RAMPE.ziegel[2] && (x + y) % 3 === 0) m.punkt(x, y, RAMPE.ziegel[1]); }
  m.form(M.box(28, 3, 5, 10), RAMPE.ziegel);
  if (r() < 0.5) m.punkt(14, 40, RAMPE.blatt[2]).punkt(15, 40, RAMPE.blatt[3]);
  return m.leinwand();
}
function malHolzfaeller() {
  const m = new Maler(40, 40);
  // Blockhütte
  m.form(M.box(6, 18, 22, 20), RAMPE.holz, { tiefe: 2 });
  for (let y = 20; y < 38; y += 3) m.form(M.box(6, y, 22, 1), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.box(13, 28, 6, 10), RAMPE.lederDkl);
  m.form(M.poly([[3, 20], [17, 7], [31, 20]]), RAMPE.lederDkl, { tiefe: 2 });
  // Holzstapel
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) m.form(M.ell(32 + j * 2.6 + i * 1.3, 37 - i * 2.6, 1.5, 1.5), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[2], RAMPE.stroh[3]]);
  // Hackklotz mit Axt
  m.form(M.box(28, 26, 6, 6), RAMPE.holz);
  m.form(M.ell(31, 26, 3, 1.2), RAMPE.stroh, { licht: false });
  m.form(M.poly([[29, 26.5], [33, 26.5], [32.5, 24], [29.5, 24.5]]), RAMPE.stahl);
  m.form(M.kap(31, 24.5, 35, 16, 0.75), RAMPE.holz, { licht: false });
  return m.leinwand();
}
function malSteinmetz() {
  const m = new Maler(40, 40);
  m.form(M.box(4, 20, 20, 18), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(9, 28, 7, 10), [UMRISS, '#1a1620', '#241e2c', '#2e2836'], { licht: false });
  m.form(M.poly([[1, 22], [14, 10], [27, 22]]), RAMPE.holz, { tiefe: 2 });
  // Steinblöcke und eine halbfertige Säule
  m.form(M.box(26, 31, 7, 6), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(33, 33, 5, 4), RAMPE.beton);
  m.form(M.box(28, 21, 5, 10), RAMPE.putz, { tiefe: 1 });
  m.form(M.box(27, 20, 7, 2), RAMPE.putz);
  m.form(M.kap(35, 24, 38, 31, 0.6), RAMPE.holz, { licht: false });
  m.form(M.box(34, 22, 3, 2), RAMPE.metall);
  return m.leinwand();
}
function malBauernhof() {
  const m = new Maler(52, 42);
  // Feld mit Furchen und Ähren
  m.form(M.poly([[2, 30], [30, 30], [34, 41], [0, 41]]), ['#3a2414', '#5a3a20', '#7a5030', '#946440'], { kante: false, korn: 0 });
  for (let y = 32; y < 41; y += 3) for (let x = 2; x < 32; x++) {
    if (!m.get(x, y)) continue;
    m.punkt(x, y, x % 2 ? RAMPE.stroh[2] : RAMPE.olive[3]);
    if (x % 2) m.punkt(x, y - 1, RAMPE.stroh[3]);
  }
  // Hof
  m.form(M.box(30, 16, 19, 18), RAMPE.putz, { tiefe: 2 });
  m.form(M.oder(M.box(30, 16, 19, 2), M.box(30, 16, 2, 18), M.box(47, 16, 2, 18), M.kap(32, 25, 47, 25, 0.6)), RAMPE.holz, { licht: false });
  m.form(M.box(36, 25, 7, 9), RAMPE.holz);
  m.form(M.poly([[27, 18], [39, 4], [51, 18]]), RAMPE.stroh, { tiefe: 2 });
  // Scheune hinten links
  m.form(M.box(6, 14, 18, 15), RAMPE.rotDkl, { tiefe: 2 });
  m.form(M.oder(M.kap(10, 17, 20, 27, 0.6), M.kap(20, 17, 10, 27, 0.6)), RAMPE.putz, { licht: false });
  m.form(M.poly([[3, 16], [15, 5], [27, 16]]), RAMPE.lederDkl, { tiefe: 2 });
  return m.leinwand();
}
function malKoehlerei(f) {
  const m = new Maler(40, 38);
  // Meiler: Erdhügel mit Rauchlöchern
  m.form(M.und(M.ell(17, 30, 14, 12), M.box(0, 0, 40, 33)), ['#1a1210', '#3a2a1e', '#52402c', '#6a5438'], { tiefe: 2 });
  for (let i = 0; i < 5; i++) m.form(M.ell(9 + i * 4, 24 + (i % 2) * 4, 1, 0.8), [UMRISS, '#e0521c', '#ffb030', '#fff4a0'], { licht: false, kante: false });
  m.form(M.box(3, 31, 28, 3), RAMPE.lederDkl);
  // Holzstapel und Hütte
  for (let i = 0; i < 4; i++) m.form(M.ell(31 + (i % 2) * 3, 34 - Math.floor(i / 2) * 3, 1.6, 1.6), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[2], RAMPE.stroh[3]]);
  m.form(M.box(30, 18, 9, 10), RAMPE.holz);
  m.form(M.poly([[28, 19], [34.5, 12], [40, 19]]), RAMPE.lederDkl);
  // Kohlesäcke
  m.form(M.ell(6, 35, 3, 2.5), RAMPE.sack);
  m.punkt(6, 33, UMRISS).punkt(5, 33, '#1a1420');
  if (f) m.punkt(17, 18, '#8a8090').punkt(18, 17, '#a8a0b0');
  return m.leinwand();
}
function malWirtshaus(f) {
  const m = new Maler(56, 46);
  m.form(M.box(4, 20, 44, 25), RAMPE.putz, { tiefe: 2 });
  m.form(M.oder(M.box(4, 20, 44, 2), M.box(4, 31, 44, 1), M.box(4, 20, 2, 25), M.box(46, 20, 2, 25), M.box(25, 20, 2, 25), M.kap(7, 23, 13, 30, 0.6), M.kap(39, 30, 45, 23, 0.6)), RAMPE.holz, { licht: false });
  const fenster = [RAMPE.holz[0], '#e08a30', f ? '#ffd070' : '#ffc860', '#fff0a0'];
  m.form(M.oder(M.box(8, 34, 7, 6), M.box(36, 34, 7, 6), M.box(16, 24, 6, 5), M.box(30, 24, 6, 5)), fenster);
  m.form(M.box(21, 33, 10, 12), RAMPE.holz);
  m.form(M.ell(26, 33, 5, 2), RAMPE.holz);
  m.punkt(29, 39, RAMPE.gold[2]);
  // Dach
  m.form(M.poly([[0, 22], [10, 6], [42, 6], [52, 22]]), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.box(38, 1, 5, 9), RAMPE.ziegel);
  // Wirtshausschild mit Krug
  m.form(M.kap(48, 26, 54, 26, 0.5), RAMPE.metall, { licht: false });
  m.form(M.box(49, 27, 6, 7), RAMPE.holz);
  m.form(M.box(51, 28, 2, 4), RAMPE.gelb, { licht: false });
  m.punkt(53, 29, RAMPE.gelb[1]);
  // Fass vor der Tür
  m.form(M.box(14, 39, 5, 6), RAMPE.holz);
  m.form(M.box(14, 41, 5, 1), RAMPE.metall, { licht: false });
  return m.leinwand();
}
function malKirche() {
  const m = new Maler(52, 60);
  // Schiff
  m.form(M.box(4, 34, 32, 25), RAMPE.stein, { tiefe: 2 });
  for (let y = 37; y < 58; y += 4) for (let x = (y % 8 ? 4 : 8); x < 35; x += 8) m.form(M.box(x, y, 1, 3), [RAMPE.stein[0], RAMPE.stein[1], RAMPE.stein[1], RAMPE.stein[1]], { licht: false, kante: false });
  m.form(M.poly([[1, 36], [20, 22], [39, 36]]), RAMPE.lederDkl, { tiefe: 2 });
  m.form(M.oder(M.ell(12, 44, 2.5, 3), M.box(9.5, 44, 5, 6), M.ell(28, 44, 2.5, 3), M.box(25.5, 44, 5, 6)), [UMRISS, '#5a2a8a', '#8a4ac8', '#e0b060'], { licht: false });
  // Turm
  m.form(M.box(34, 14, 14, 45), RAMPE.stein, { tiefe: 2 });
  m.form(M.oder(M.ell(41, 22, 3, 3.5), M.box(38, 22, 6, 5)), [UMRISS, '#0e0a14', '#0e0a14', '#0e0a14'], { licht: false });
  m.form(M.ell(41, 25, 2, 1.6), RAMPE.gold);
  m.form(M.poly([[32, 16], [41, 1], [50, 16]]), RAMPE.lederDkl, { tiefe: 2 });
  m.form(M.oder(M.box(40.5, 0, 1, 1), M.box(39.5, 0, 3, 1)), RAMPE.gold, { licht: false });
  // Portal
  m.form(M.oder(M.ell(41, 49, 4, 4), M.box(37, 49, 8, 10)), RAMPE.holz);
  m.form(M.box(40.5, 49, 1, 10), RAMPE.holz[0] ? [RAMPE.holz[0], RAMPE.holz[0], RAMPE.holz[0], RAMPE.holz[0]] : RAMPE.holz, { licht: false, kante: false });
  return m.leinwand();
}

// Zustands-Symbole 7 x 7 über Gegnern: Flamme, Gifttropfen, Blutstropfen, Eiskristall, Blitz, Öltropfen
function malZustandSymbol(art) {
  const m = new Maler(9, 9);
  if (art === 'brennen') { m.form(M.poly([[1.5, 8.5], [2.5, 3], [4, 5], [4.5, 0.5], [6.5, 4], [7.5, 8.5]]), RAMPE.feuer, { licht: false }); m.form(M.poly([[3.5, 8.5], [4.5, 5], [5.5, 8.5]]), RAMPE.gelb, { licht: false, kante: false }); }
  else if (art === 'gift') { m.form(M.oder(M.poly([[4.5, 0], [8, 5], [1, 5]]), M.ell(4.5, 5.5, 3.4, 3.2)), RAMPE.gruen, { licht: false }); m.punkt(3, 5, '#d0ffb0'); }
  else if (art === 'blutung') { m.form(M.oder(M.poly([[4.5, 0], [8, 5], [1, 5]]), M.ell(4.5, 5.5, 3.4, 3.2)), RAMPE.rot, { licht: false }); m.punkt(3, 5, '#ffc0b0'); }
  else if (art === 'frost') { m.form(M.oder(M.box(4, 0, 1, 9), M.box(0, 4, 9, 1), M.kap(1, 1, 7.5, 7.5, 0.5), M.kap(7.5, 1, 1, 7.5, 0.5)), RAMPE.eis, { licht: false }); }
  else if (art === 'schock') { m.form(M.poly([[5, 0], [1.5, 5], [4, 5], [3, 9], [7.5, 3.5], [5, 3.5], [6.5, 0]]), RAMPE.gelb, { licht: false }); }
  else { m.form(M.oder(M.poly([[4.5, 0], [8, 5], [1, 5]]), M.ell(4.5, 5.5, 3.4, 3.2)), [UMRISS, '#1a1420', '#2a2030', '#6a6080'], { licht: false }); m.punkt(3, 5, '#9a90b0'); }
  return m.leinwand();
}
// Wertloses Zeug aus leeren Truhen
function malSchrottFund(art) {
  const m = new Maler(12, 10);
  if (art === 'schuh') { m.form(M.poly([[1, 3], [5, 3], [5, 6], [11, 7], [11, 9], [1, 9]]), RAMPE.lederDkl); m.form(M.box(1, 8, 10, 1), RAMPE.lumpen, { licht: false, kante: false }); m.punkt(8, 7, UMRISS).punkt(9, 8, UMRISS); }
  else if (art === 'lumpen') { m.form(M.poly([[1, 4], [6, 1], [11, 3], [10, 9], [5, 8], [2, 9]]), RAMPE.lumpen); m.punkt(4, 5, RAMPE.sack[2]).punkt(8, 6, RAMPE.olive[2]); }
  else if (art === 'dose') { m.form(M.box(3, 2, 6, 7), RAMPE.metall); m.form(M.box(3, 4, 6, 3), RAMPE.rot, { licht: false }); m.punkt(5, 1, RAMPE.rost[2]); }
  else { m.form(M.oder(M.kap(2, 7, 10, 3, 1), M.ell(2, 7, 1.6, 1.6), M.ell(10, 3, 1.6, 1.6)), RAMPE.putz); }
  return m.leinwand();
}

// Vorschau für einen Weg in der Bauleiste
function malWeg() {
  const m = new Maler(20, 12), r = zufall(4);
  m.form(M.poly([[2, 2], [18, 2], [19, 11], [1, 11]]), ['#3a2a1e', '#5e4632', '#6a5038', '#846446'], { korn: 0 });
  for (let i = 0; i < 9; i++) { const x = 3 + Math.floor(r() * 13), y = 3 + Math.floor(r() * 6); m.form(M.box(x, y, 3, 2), RAMPE.stein, { licht: false }); }
  return m.leinwand();
}

// Forschungslabor: Wellblech, Glaskuppel, Antenne und blubbernde Kolben
function malLabor(f) {
  const m = new Maler(52, 48), r = zufall(31);
  m.form(M.box(3, 22, 46, 25), RAMPE.beton, { tiefe: 2 });
  for (let x = 5; x < 48; x += 4) m.form(M.box(x, 23, 1, 23), [RAMPE.beton[0], RAMPE.beton[1], RAMPE.beton[1], RAMPE.beton[1]], { licht: false, kante: false });
  // Glaskuppel mit Lazi-Licht
  m.form(M.und(M.ell(20, 22, 12, 11), M.box(0, 0, 52, 22)), [UMRISS, '#1a4a5a', '#2a6a7a', '#7ad0e0'], { tiefe: 2 });
  for (let i = 0; i < 4; i++) m.form(M.box(11 + i * 6, 12, 1, 10), [RAMPE.metall[0], RAMPE.metall[1], RAMPE.metall[1], RAMPE.metall[1]], { licht: false, kante: false });
  m.form(M.ell(20, 18, 3, 2.5), f ? RAMPE.lazi : [RAMPE.lazi[0], RAMPE.lazi[1], RAMPE.lazi[1], RAMPE.lazi[2]], { licht: false });
  // Antenne mit blinkendem Licht
  m.form(M.oder(M.kap(40, 22, 40, 4, 0.7), M.kap(36, 10, 44, 10, 0.5)), RAMPE.metall);
  m.punkt(40, 3, f ? '#ff5a4a' : '#7a2a2a');
  // Tür und Fenster mit Kolben
  m.form(M.box(32, 32, 9, 15), [UMRISS, '#141826', '#1c2234', '#262e44'], { licht: false });
  m.form(M.box(8, 30, 14, 8), [RAMPE.metall[0], '#2a6a5a', '#3a8a6a', '#8ad8a0']);
  [[10, 'gruen'], [14, 'violett'], [18, 'lazi']].forEach(([x, rp]) => { m.form(M.oder(M.ell(x + 1, 35.5, 1.6, 1.6), M.box(x + 0.5, 32, 1, 3)), RAMPE[rp], { licht: false }); });
  for (let k = 0; k < 18; k++) { const x = 4 + r() * 44 | 0, y = 23 + r() * 23 | 0; if (m.get(x, y) === RAMPE.beton[2]) m.punkt(x, y, RAMPE.rost[1]); }
  return m.leinwand();
}
// Symbole für seltene Materialien 10 x 10
function malMaterialSymbol(art) {
  const m = new Maler(10, 10);
  if (art === 'wolfsfell' || art === 'alphafell') {
    const f = art === 'alphafell' ? RAMPE.fellDkl : RAMPE.fell;
    m.form(M.poly([[1, 3], [4, 1], [7, 2], [9, 5], [8, 9], [3, 9], [0, 6]]), f);
    m.punkt(4, 5, RAMPE.lazi[2]).punkt(5, 6, RAMPE.lazi[2]);
    if (art === 'alphafell') m.form(M.poly([[2, 2], [3, 0], [4, 2], [5, 0], [6, 2]]), RAMPE.putz, { licht: false });
  } else if (art === 'golemkern') { m.form(M.ell(5, 5, 4.4, 4.4), RAMPE.stein); m.form(M.ell(5, 5, 2.5, 2.5), RAMPE.lazi, { licht: false }); m.punkt(4, 4, '#ffffff'); }
  else if (art === 'lazisplitter') { m.form(M.poly([[5, 0], [8, 4], [6, 9], [2, 6]]), RAMPE.lazi); }
  else if (art === 'herzkristall') {
    m.form(M.oder(M.ell(3.2, 3.6, 2.6, 2.6), M.ell(6.8, 3.6, 2.6, 2.6), M.poly([[0.8, 4.4], [9.2, 4.4], [5, 9.6]])), ['#3a0a2a', '#a01e5a', '#ff4a8a', '#ffc0e0']);
    m.punkt(3, 3, '#ffffff').punkt(5, 6, '#ffe0f0');
  }
  else if (art === 'bauteile') { m.form(M.box(1, 3, 8, 6), RAMPE.stahl); m.form(M.box(3, 1, 4, 3), RAMPE.metall); m.punkt(2, 5, RAMPE.lazi[3]).punkt(7, 5, RAMPE.lazi[3]).punkt(5, 7, '#e8c040'); }
  else if (art === 'schildblech') { m.form(M.poly([[1, 2], [9, 1], [9, 8], [1, 9]]), RAMPE.metall); m.punkt(3, 3, RAMPE.rost[2]).punkt(7, 6, RAMPE.rost[1]); }
  else { m.form(M.box(1, 1, 8, 8), RAMPE.rotDkl); m.form(M.box(2, 7, 7, 2), RAMPE.putz, { licht: false }); m.form(M.box(4, 1, 1, 6), RAMPE.gold, { licht: false, kante: false }); }
  return m.leinwand();
}

// Rohstoff-Symbole für die Oberfläche (12 x 12 Pixel)
function malRohstoffSymbol(art) {
  const m = new Maler(12, 12);
  if (art === 'gold') {
    m.form(M.ell(6, 6, 5, 5), RAMPE.gold, { tiefe: 2 });
    m.form(M.ell(6, 6, 2.6, 2.6), [RAMPE.gold[1], RAMPE.gold[1], RAMPE.gold[2], RAMPE.gold[2]], { licht: false, kante: false });
    m.punkt(4, 3, RAMPE.gold[3]);
  } else if (art === 'holz') {
    // drei gestapelte Stämme mit Jahresringen
    [[3.2, 8.2], [8.8, 8.2], [6, 4]].forEach(([x, y]) => {
      m.form(M.ell(x, y, 2.9, 2.9), RAMPE.holz, { tiefe: 2 });
      m.form(M.ell(x, y, 1.4, 1.4), RAMPE.stroh, { licht: false });
      m.punkt(Math.round(x), Math.round(y), RAMPE.holz[1]);
    });
  } else if (art === 'stein') {
    m.form(M.oder(M.ell(3.5, 8.5, 3.2, 2.6), M.ell(8.5, 8.5, 3.2, 2.6), M.ell(6, 4.5, 3, 2.8)), RAMPE.stein, { tiefe: 2 });
    m.punkt(5, 3, RAMPE.stein[3]).punkt(2, 7, RAMPE.stein[3]);
  } else if (art === 'teile') {
    // Zahnrad mit Lazi-Licht in der Mitte
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; m.form(M.ell(6 + Math.cos(a) * 4.6, 6 + Math.sin(a) * 4.6, 1.2, 1.2), RAMPE.metall); }
    m.form(M.ell(6, 6, 4, 4), RAMPE.metall, { tiefe: 2 });
    m.form(M.ell(6, 6, 1.7, 1.7), RAMPE.lazi, { licht: false });
  } else if (art === 'holzkohle') {
    m.form(M.oder(M.poly([[1, 9], [3, 5], [6, 6], [6, 11], [1, 11]]), M.poly([[5, 7], [8, 3], [11, 6], [10, 11], [5, 11]])), RAMPE.eisenDkl, { tiefe: 2 });
    m.punkt(8, 5, '#8a7c88').punkt(3, 7, '#8a7c88').punkt(9, 9, RAMPE.feuer[1]);
  } else if (art === 'beschlaege') {
    // Winkeleisen und eine Schraube
    m.form(M.oder(M.box(1, 2, 2.5, 9), M.box(1, 8.5, 7, 2.5)), RAMPE.metall, { tiefe: 2 });
    m.punkt(2, 4, UMRISS).punkt(5, 9, UMRISS);
    m.form(M.kap(9, 2, 9, 9, 0.9), RAMPE.stahl);
    m.form(M.box(7, 1, 5, 2), RAMPE.stahl);
    m.punkt(8, 5, RAMPE.stahl[0]).punkt(9, 7, RAMPE.stahl[0]);
  } else if (art === 'nahrung') {
    // Brotlaib und ein Apfel
    m.form(M.ell(5, 7.5, 4.6, 3.2), RAMPE.stroh, { tiefe: 2 });
    m.form(M.oder(M.kap(3, 6, 4, 8, 0.4), M.kap(5.5, 5.5, 6.5, 7.5, 0.4)), [RAMPE.stroh[1], RAMPE.stroh[1], RAMPE.stroh[1], RAMPE.stroh[1]], { licht: false, kante: false });
    m.form(M.ell(9, 8.5, 2.6, 2.6), RAMPE.rot);
    m.punkt(9, 5, RAMPE.blatt[3]);
  } else if (art === 'einwohner') {
    m.form(M.ell(6, 4, 2.6, 2.6), RAMPE.haut);
    m.form(M.poly([[1.5, 11.5], [2.5, 8], [6, 7], [9.5, 8], [10.5, 11.5]]), RAMPE.blau, { tiefe: 2 });
  } else if (art === 'frei') {
    // Hammer: freie Hände
    m.form(M.kap(3, 10, 8, 4, 0.9), RAMPE.holz);
    m.form(M.poly([[5.5, 1], [10.5, 5], [9, 7], [4, 3]]), RAMPE.metall, { tiefe: 2 });
  } else if (art === 'standard') {
    // Herz
    m.form(M.oder(M.ell(4, 4.5, 2.8, 2.8), M.ell(8, 4.5, 2.8, 2.8), M.poly([[1.4, 5.5], [10.6, 5.5], [6, 11]])), RAMPE.rot, { tiefe: 2 });
    m.punkt(3, 3, RAMPE.rot[3]);
  } else if (art === 'tag') {
    // Sonne
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; m.form(M.kap(6 + Math.cos(a) * 3.5, 6 + Math.sin(a) * 3.5, 6 + Math.cos(a) * 5.4, 6 + Math.sin(a) * 5.4, 0.5), RAMPE.gelb, { licht: false }); }
    m.form(M.ell(6, 6, 3, 3), RAMPE.gelb, { tiefe: 2 });
  } else if (art === 'strom') {
    m.form(M.poly([[7, 0], [2, 7], [5.5, 7], [4, 12], [10, 4], [6.5, 4], [9, 0]]), RAMPE.gelb, { tiefe: 2 });
  } else if (art === 'kraeuter') {
    // Ein Bund Kräuter mit Schnur
    m.form(M.oder(M.kap(6, 11, 3, 3, 0.8), M.kap(6, 11, 6, 2, 0.8), M.kap(6, 11, 9, 3, 0.8)), ['#1e3a14', '#3a7a2e', '#6aaa44', '#b0e070']);
    m.form(M.oder(M.ell(3, 3, 2, 1.6), M.ell(9, 3, 2, 1.6), M.ell(6, 2, 2, 1.8)), ['#1e3a14', '#3a7a2e', '#6aaa44', '#b0e070']);
    m.form(M.box(4, 8, 4, 1), RAMPE.rot, { licht: false });
  } else if (art === 'altmetall') {
    // Ein Stück verbogenes Blech mit Rost und einer Schraube
    m.form(M.poly([[1, 9], [3, 3], [7, 1], [11, 4], [10, 10], [5, 11]]), RAMPE.rost, { tiefe: 2 });
    m.form(M.kap(3, 8, 9, 4, 0.6), RAMPE.metall, { licht: false });
    m.punkt(6, 6, RAMPE.metall[3]).punkt(8, 8, RAMPE.rost[3]).punkt(4, 5, RAMPE.rost[3]);
  } else if (art === 'mauer') {
    m.form(M.box(1, 3, 10, 8), RAMPE.stein, { tiefe: 2 });
    m.form(M.oder(M.box(1, 6, 10, 1), M.box(5, 3, 1, 3), M.box(3, 7, 1, 4), M.box(8, 7, 1, 4)), [RAMPE.stein[0], RAMPE.stein[0], RAMPE.stein[0], RAMPE.stein[0]], { licht: false, kante: false });
    m.form(M.oder(M.box(1, 1, 2, 2), M.box(5, 1, 2, 2), M.box(9, 1, 2, 2)), RAMPE.stein);
  }
  return m.leinwand();
}

// ---------------------------------------------------------------------
// DORFVERTEIDIGUNG: Stachelbarrikaden, Palisade, Tore, Wachturm
// ---------------------------------------------------------------------
// Spanischer Reiter: gekreuzte, angespitzte Pfähle auf einem Querbalken
function malStachelreiter(v) {
  const m = new Maler(28, 20), r = zufall(70 + v);
  for (let i = 0; i < 3; i++) {
    const x = 5 + i * 9 + (r() - 0.5) * 1.5;
    m.form(M.kap(x - 4.5, 19, x + 3, 2.5 + r() * 2, 1.1), RAMPE.holz);
    m.form(M.kap(x + 4.5, 19, x - 3, 2.5 + r() * 2, 1.1), RAMPE.holz);
  }
  m.form(M.kap(1, 13, 27, 13, 1.5), RAMPE.lederDkl, { tiefe: 2 });
  for (let i = 0; i < 3; i++) { const x = 5 + i * 9; m.punkt(x - 1, 12, RAMPE.sack[2]).punkt(x, 13, RAMPE.sack[1]); }
  return m.leinwand();
}
// Ein Stück Palisade: zwei Felder breit, angespitzte Stämme mit Querbalken
function malPalisade(v) {
  const m = new Maler(32, 36), r = zufall(90 + v);
  for (let i = 0; i < 8; i++) {
    const x = i * 4, top = 2 + Math.floor(r() * 5);
    m.form(M.poly([[x, 35], [x + 4, 35], [x + 4, top + 3], [x + 2, top], [x, top + 3]]), r() < 0.25 ? RAMPE.lederDkl : RAMPE.holz);
  }
  m.form(M.oder(M.box(0, 14, 32, 2), M.box(0, 27, 32, 2)), RAMPE.lederDkl, { licht: false });
  m.punkt(6, 15, RAMPE.metall[2]).punkt(22, 28, RAMPE.metall[2]);
  return m.leinwand();
}
// Tore. art: 'barrikade' (Karren und Säcke) oder 'palisade'. schaden: 0, 1, 2
function malTor(art, schaden) {
  if (art === 'barrikade') {
    const m = new Maler(40, 26);
    // umgekippter Karren mit Rad, davor Säcke und Pfähle
    m.form(M.poly([[3, 22], [6, 6], [30, 4], [34, 20]]), RAMPE.holz, { tiefe: 2 });
    m.form(M.oder(M.box(6, 10, 26, 1), M.box(5, 15, 28, 1)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
    m.form(M.ell(31, 9, 6, 6), RAMPE.lederDkl); m.form(M.ell(31, 9, 2, 2), RAMPE.metall);
    m.form(M.oder(M.ell(8, 21, 5, 3.5), M.ell(17, 22, 5, 3.4), M.ell(26, 21.5, 5, 3.5)), RAMPE.sack, { tiefe: 2 });
    for (let i = 0; i < 4; i++) m.form(M.kap(4 + i * 10, 25, 7 + i * 10, 13, 0.9), RAMPE.holz);
    if (schaden >= 1) { m.form(M.oder(M.ell(14, 10, 3, 2), M.ell(25, 16, 2, 1.5)), [UMRISS, UMRISS, '#1d1328', '#1d1328'], { licht: false }); }
    if (schaden >= 2) { m.form(M.ell(20, 8, 4, 3), [UMRISS, UMRISS, '#1d1328', '#1d1328'], { licht: false }); m.form(M.ell(26, 21.5, 5, 3.5), RAMPE.lumpen); }
    return m.leinwand();
  }
  const m = new Maler(40, 40);
  m.form(M.oder(M.box(1, 4, 6, 36), M.box(33, 4, 6, 36)), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(M.poly([[1, 4], [4, 0], [7, 4]]), M.poly([[33, 4], [36, 0], [39, 4]])), RAMPE.holz);
  m.form(M.box(0, 5, 40, 4), RAMPE.lederDkl, { tiefe: 2 });
  m.form(M.box(7, 10, 26, 30), RAMPE.leder, { tiefe: 2 });
  m.form(M.oder(...[11, 15, 19.5, 24, 28].map(x => M.box(x, 10, 1, 30))), [RAMPE.lederDkl[0], RAMPE.lederDkl[1], RAMPE.lederDkl[1], RAMPE.lederDkl[1]], { licht: false, kante: false });
  m.form(M.oder(M.box(7, 15, 26, 2), M.box(7, 32, 26, 2)), RAMPE.metall);
  m.punkt(18, 24, RAMPE.metall[3]).punkt(21, 24, RAMPE.metall[3]);
  if (schaden >= 1) m.form(M.oder(M.poly([[12, 20], [16, 18], [15, 26]]), M.poly([[25, 33], [29, 30], [28, 37]])), [UMRISS, UMRISS, '#1d1328', '#1d1328'], { licht: false });
  if (schaden >= 2) m.form(M.poly([[17, 12], [24, 14], [22, 28], [16, 25]]), [UMRISS, UMRISS, '#1d1328', '#1d1328'], { licht: false });
  return m.leinwand();
}
// Wachturm aus Stämmen mit Strohdach, Leiter und einem Wächter oben
function malWachturm() {
  const m = new Maler(32, 56);
  m.form(M.oder(M.kap(7, 55, 9, 22, 1.4), M.kap(25, 55, 23, 22, 1.4)), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(M.kap(8, 50, 24, 31, 0.7), M.kap(24, 50, 8, 31, 0.7)), RAMPE.lederDkl);
  m.form(M.oder(M.box(14, 24, 1, 31), M.box(18, 24, 1, 31)), RAMPE.holz, { licht: false });
  for (let y = 27; y < 55; y += 4) m.form(M.box(14, y, 5, 1), RAMPE.holz, { licht: false, kante: false });
  // Wächter mit Armbrust hinter der Brüstung
  m.form(M.ell(18, 11.5, 2.2, 2.2), RAMPE.haut);
  m.form(M.ell(18, 10.3, 2.4, 1.4), RAMPE.blauDkl);
  m.form(M.kap(19, 13, 27, 12, 0.6), RAMPE.holz); m.form(M.kap(25, 10, 26, 14.5, 0.5), RAMPE.metall);
  m.form(M.box(4, 20, 24, 4), RAMPE.lederDkl, { tiefe: 2 });
  m.form(M.box(3, 13, 26, 8), RAMPE.holz, { tiefe: 2 });
  m.form(M.oder(...[9, 15, 21].map(x => M.box(x, 13, 1, 8))), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.oder(M.box(5, 6, 2, 8), M.box(25, 6, 2, 8)), RAMPE.holz);
  m.form(M.poly([[0, 7], [16, 0], [32, 7], [28, 8], [4, 8]]), RAMPE.stroh, { tiefe: 2 });
  m.punkt(28, 18, RAMPE.blau[2]).punkt(28, 19, RAMPE.blau[1]);
  return m.leinwand();
}

// ---------------------------------------------------------------------
// NEUE MISSIONEN: Dieb, Plündererlager, Eskorte, verlassene Stadt
// ---------------------------------------------------------------------
// Der Fuchs: schmaler Dieb mit Kapuze und einem leuchtenden Lazi-Kern im Sack
function malDieb(schritt) {
  const m = new Maler(26, 34);
  const s = schritt;
  m.form(M.oder(M.kap(11, 22, 11 - s * 0.7, 27, 1.7), M.kap(11 - s * 0.7, 27, 11 - s, 31, 1.4)), RAMPE.lederDkl);
  m.form(M.box(9 - s, 30.5, 4, 2.5), RAMPE.tuch);
  // Sack auf dem Rücken mit Lazi-Licht
  m.form(M.ell(6.5, 15, 4.2, 5), RAMPE.sack, { tiefe: 2 });
  m.form(M.ell(6.5, 13, 1.8, 1.6), RAMPE.lazi, { licht: false });
  m.form(M.oder(M.poly([[8, 11], [17.5, 11], [16, 22.5], [10, 22.5]]), M.ell(12.8, 12, 5, 2)), RAMPE.olive, { tiefe: 2 });
  m.form(M.box(9.5, 20.5, 7.5, 2), RAMPE.lederDkl);
  m.form(M.oder(M.kap(14, 22, 14 + s * 0.7, 27, 1.8), M.kap(14 + s * 0.7, 27, 14 + s, 31, 1.5)), RAMPE.leder);
  m.form(M.box(12.5 + s, 30.5, 5, 2.5), RAMPE.tuch);
  m.form(M.box(11, 8, 3.5, 3), RAMPE.lederDkl);
  m.form(M.oder(M.ell(13, 5.6, 3.8, 3.8), M.poly([[9.5, 5], [7, 9.5], [11, 9]])), RAMPE.kapuzeGr, { tiefe: 2 });
  m.form(M.ell(14.5, 6.4, 2.2, 2.1), [UMRISS, '#141018', '#1c1622', '#241c2c'], { licht: false });
  m.punkt(15, 6, '#ffe060').punkt(16.5, 6, '#ffe060');
  m.form(M.box(13.5, 7.5, 4, 1.5), RAMPE.rotDkl, { licht: false });
  m.form(M.oder(M.kap(16, 13, 20, 16, 1.4), M.kap(20, 16, 22, 13, 1.2)), RAMPE.olive);
  m.form(M.ell(22, 13, 1.5, 1.5), RAMPE.haut);
  return m.leinwand();
}
// Vorratszelt der Plünderer mit Fahne und Kisten
function malZelt(stufe) {
  const m = new Maler(48, 40), r = zufall(13);
  m.form(M.poly([[2, 37], [24, 6], [46, 37]]), RAMPE.lumpen, { tiefe: 2 });
  m.form(M.poly([[18, 37], [24, 18], [30, 37]]), [UMRISS, '#120e14', '#1a1418', '#221c20'], { licht: false });
  for (let i = 0; i < 6; i++) { const x = 6 + r() * 34 | 0, y = 14 + r() * 20 | 0; if (m.get(x, y) === RAMPE.lumpen[2]) m.form(M.box(x, y, 4, 3), r() < 0.5 ? RAMPE.sack : RAMPE.olive, { licht: false }); }
  m.form(M.kap(24, 6, 24, 0, 0.6), RAMPE.holz);
  m.form(M.poly([[24, 0], [33, 2], [24, 5]]), RAMPE.rot, { licht: false });
  m.punkt(27, 2, '#f2e8d0').punkt(28, 2, '#f2e8d0');
  m.form(M.box(36, 30, 8, 7), RAMPE.holz);
  m.form(M.box(36, 32, 8, 1), RAMPE.metall, { licht: false });
  m.form(M.box(38, 25, 6, 5), RAMPE.holz);
  m.form(M.ell(9, 35, 4, 2.4), RAMPE.sack);
  if (stufe >= 1) { m.form(M.poly([[12, 20], [16, 24], [10, 28]]), [UMRISS, '#120e14', '#120e14', '#120e14'], { licht: false }); m.form(M.poly([[30, 26], [35, 30], [31, 33]]), [UMRISS, '#120e14', '#120e14', '#120e14'], { licht: false }); }
  if (stufe >= 2) { m.form(M.poly([[16, 8], [20, 14], [14, 15]]), RAMPE.feuer, { kante: false }); m.form(M.poly([[30, 16], [34, 22], [28, 22]]), RAMPE.feuer, { kante: false }); }
  return m.leinwand();
}
// Ausguck: Holzturm mit Armbrustschütze
function malAusguck() {
  const m = new Maler(30, 52);
  m.form(M.oder(M.kap(6, 51, 9, 22, 1.2), M.kap(24, 51, 21, 22, 1.2), M.kap(7, 40, 23, 28, 0.8), M.kap(23, 40, 7, 28, 0.8)), RAMPE.holz);
  m.form(M.box(3, 18, 24, 6), RAMPE.holz, { tiefe: 2 });
  for (let x = 5; x < 26; x += 4) m.form(M.box(x, 19, 1, 5), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  // Schütze mit Kapuze
  m.form(M.box(11, 11, 8, 7), RAMPE.leder);
  m.form(M.oder(M.ell(15, 8, 3.6, 3.6), M.poly([[11.5, 7], [10, 11], [13, 10]])), RAMPE.kapuzeGr, { tiefe: 2 });
  m.form(M.ell(16.4, 8.6, 2, 1.9), [UMRISS, '#2a1830', '#3a2440', '#4a3050']);
  m.punkt(17, 8, '#ffe060');
  m.form(M.kap(16, 14, 27, 13, 1), RAMPE.holz);
  m.form(M.oder(M.kap(25, 9, 27, 13, 0.7), M.kap(27, 13, 25, 17, 0.7)), RAMPE.stahl);
  m.form(M.poly([[2, 18], [15, 2], [28, 18]]), RAMPE.lumpen, { tiefe: 2 });
  return m.leinwand();
}
// Handkarren mit Kornsäcken, gezogen von einem alten Lastläufer (vierbeiniger Lazi-Roboter)
function malWagen(f, kisten) {
  const m = new Maler(60, 34);
  const s = f ? 1 : 0;
  // Lastläufer
  m.form(M.oder(M.kap(44, 22, 42 - s, 31, 1.2), M.kap(54, 22, 56 + s, 31, 1.2)), RAMPE.metall, { licht: false });
  m.form(M.oder(M.ell(49, 18, 8, 5), M.box(42, 16, 14, 6)), RAMPE.rost, { tiefe: 2 });
  m.form(M.oder(M.kap(46, 22, 46 + s, 31, 1.3), M.kap(52, 22, 52 - s, 31, 1.3)), RAMPE.metall);
  m.form(M.oder(M.ell(57, 13, 3.5, 3), M.box(55, 12, 4, 4)), RAMPE.metall);
  m.form(M.ell(58.5, 12.5, 1.3, 1.2), RAMPE.lazi, { licht: false });
  m.punkt(46, 17, RAMPE.lazi[2]).punkt(50, 15, RAMPE.lazi[2]);
  m.form(M.kap(36, 20, 42, 19, 0.8), RAMPE.holz);
  // Karren
  m.form(M.box(4, 16, 34, 8), RAMPE.holz, { tiefe: 2 });
  for (let x = 8; x < 36; x += 6) m.form(M.box(x, 17, 1, 6), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  if (kisten) {
    // Ladung des Konvois: Kisten mit Lazi-Teilen, mit Seilen festgezurrt
    [[5, 7, 10, 9], [16, 5, 10, 11], [27, 8, 9, 8], [10, 0, 9, 7]].forEach(([x, y, w, h]) => {
      m.form(M.box(x, y, w, h), RAMPE.holz, { tiefe: 2 });
      m.form(M.oder(M.box(x, y + 1, w, 1), M.box(x + w / 2 | 0, y, 1, h)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
    });
    m.punkt(20, 9, RAMPE.lazi[2]).punkt(21, 9, RAMPE.lazi[3]).punkt(30, 11, RAMPE.lazi[2]);
    m.form(M.kap(4, 9, 36, 12, 0.4), RAMPE.stroh, { licht: false });
  } else m.form(M.oder(M.ell(10, 13, 5, 4), M.ell(19, 12, 5, 4.5), M.ell(28, 13, 5, 4), M.ell(15, 8, 4, 3.5), M.ell(24, 8, 4, 3.5)), RAMPE.sack, { tiefe: 2 });
  m.form(M.oder(M.ell(10, 27, 5, 5), M.ell(31, 27, 5, 5)), [UMRISS, '#2a1e14', '#3a2a1e', '#5a3a20']);
  m.form(M.oder(M.ell(10, 27, 1.5, 1.5), M.ell(31, 27, 1.5, 1.5)), RAMPE.metall, { licht: false });
  return m.leinwand();
}
// Kulisse der verlassenen Stadt
function malHochhaus(seed) {
  const r = zufall(seed), w = 56 + Math.floor(r() * 24), h = 120 + Math.floor(r() * 50);
  const m = new Maler(w, h);
  const kaputt = [];
  for (let x = 0; x < w; x++) kaputt.push(Math.floor(Math.abs(Math.sin(x * 0.21 + seed)) * 14 + (x > w * 0.6 ? 10 : 0)));
  m.form((x, y) => x >= 1 && x < w - 1 && y >= kaputt[Math.floor(x)] && y < h, RAMPE.beton, { tiefe: 3, korn: 0.1 });
  for (let y = 18; y < h - 14; y += 9) for (let x = 5; x < w - 8; x += 8) {
    if (y < kaputt[x] + 4) continue;
    const dunkel = r() < 0.75;
    m.form(M.box(x, y, 5, 6), dunkel ? [UMRISS, '#10141e', '#161c2a', '#1e2638'] : [UMRISS, '#1a4a5a', '#2a7a8a', '#7ad0e0'], { licht: false });
    if (r() < 0.3) m.form(M.poly([[x, y], [x + 5, y], [x + 5, y + 4]]), [UMRISS, '#0a0c12', '#0a0c12', '#0a0c12'], { licht: false });
  }
  // Moos, Ranken und Büsche: seit Jahrhunderten verlassen
  for (let k = 0; k < 26; k++) {
    let x = 2 + r() * (w - 4) | 0, y = h - 1;
    const len = 10 + r() * h * 0.6;
    for (let i = 0; i < len; i++) { if (m.get(x, y)) m.punkt(x, y, r() < 0.5 ? RAMPE.blatt[2] : RAMPE.moos[2]); y--; if (r() < 0.3) x += r() < 0.5 ? 1 : -1; if (y < 0) break; }
  }
  for (let x = 1; x < w - 1; x++) { const y = kaputt[x]; if (m.get(x, y)) { m.punkt(x, y, RAMPE.moos[3]); if (r() < 0.6) m.punkt(x, y - 1, RAMPE.moos[2]); } }
  m.form(M.oder(M.ell(8, h - 4, 9, 5), M.ell(w - 10, h - 3, 10, 4)), RAMPE.blattH, { tiefe: 2 });
  return m.leinwand();
}
function malAutowrack(seed) {
  const r = zufall(seed), m = new Maler(46, 24);
  const farbe = [RAMPE.blau, RAMPE.rot, RAMPE.gelb, RAMPE.metall][seed % 4];
  m.form(M.oder(M.ell(10, 19, 4, 4), M.ell(35, 19, 4, 4)), [UMRISS, '#1a1420', '#2a2230', '#3a3040']);
  m.form(M.poly([[2, 19], [44, 19], [44, 12], [34, 11], [28, 4], [14, 4], [9, 11], [2, 12]]), farbe, { tiefe: 2 });
  m.form(M.poly([[15, 6], [27, 6], [31, 11], [12, 11]]), [UMRISS, '#10141e', '#1e2a40', '#3a5a80'], { licht: false });
  for (let k = 0; k < 30; k++) { const x = 3 + r() * 40 | 0, y = 6 + r() * 13 | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.5 ? RAMPE.rost[1] : RAMPE.rost[2]); }
  for (let k = 0; k < 12; k++) m.punkt(3 + r() * 40 | 0, 3 + r() * 3 | 0, r() < 0.5 ? RAMPE.moos[2] : RAMPE.blatt[3]);
  return m.leinwand();
}
function malSchutt(seed) {
  const r = zufall(seed), m = new Maler(36, 20);
  const steine = [];
  for (let i = 0; i < 9; i++) steine.push(M.ell(4 + r() * 28, 10 + r() * 8, 3 + r() * 4, 2 + r() * 3));
  m.form(M.oder(...steine), RAMPE.beton, { tiefe: 2 });
  m.form(M.oder(M.kap(6, 8, 18, 3, 0.7), M.kap(20, 6, 30, 10, 0.6)), RAMPE.rost, { licht: false });
  for (let k = 0; k < 8; k++) m.punkt(3 + r() * 30 | 0, 6 + r() * 12 | 0, RAMPE.moos[2]);
  return m.leinwand();
}
// ---------------------------------------------------------------------
// DAS ALTE KOHLEKRAFTWERK
// ---------------------------------------------------------------------
// Schutzturm: eine Lazi-Säule auf Betonsockel, oben ein drehbarer Geschützkopf.
// Der blaue Kern lädt die Schüsse auf (f = 1: kurz vor dem Schuss)
function malSchutzturm(f) {
  const m = new Maler(32, 60);
  // Sockel mit Warnstreifen
  m.form(M.poly([[3, 59], [29, 59], [26, 50], [6, 50]]), RAMPE.beton, { tiefe: 2 });
  for (let x = 6; x < 27; x++) m.punkt(x, 51, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  // Säule mit Kühlrippen
  m.form(M.box(10, 24, 12, 27), RAMPE.metall, { tiefe: 2 });
  for (let y = 26; y < 50; y += 3) m.form(M.box(9, y, 14, 1), [RAMPE.metall[0], RAMPE.metall[1], RAMPE.metall[1], RAMPE.metall[1]], { licht: false, kante: false });
  // Kern
  m.form(M.box(13, 28, 6, 16), [UMRISS, '#0e3a4a', '#1aa0a8', f ? '#e0fff8' : '#5ff0e0'], { licht: false });
  for (let y = 29; y < 44; y += 2) m.punkt(15 + (y % 4 ? 1 : 0), y, f ? '#ffffff' : RAMPE.lazi[3]);
  // Kabel
  m.form(M.oder(M.kap(10, 46, 5, 54, 0.8), M.kap(22, 46, 27, 54, 0.8)), RAMPE.eisenDkl, { licht: false });
  // Geschützkopf
  m.form(M.oder(M.ell(16, 18, 10, 7), M.box(6, 16, 20, 6)), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.box(6, 21, 20, 2), RAMPE.metall, { licht: false });
  m.form(M.oder(M.kap(20, 16, 31, 14, 1.8), M.box(28, 12, 3, 5)), RAMPE.metall, { tiefe: 1 });
  m.punkt(31, 14, f ? '#ffffff' : RAMPE.lazi[2]);
  m.form(M.ell(15, 17, 3.4, 3.4), RAMPE.lazi, { licht: false });
  m.punkt(14, 16, '#ffffff');
  // Antennen mit Warnlicht
  m.form(M.oder(M.kap(8, 13, 6, 4, 0.6), M.kap(24, 13, 25, 3, 0.6)), RAMPE.metall);
  m.punkt(6, 3, f ? '#ff6040' : '#a02020').punkt(25, 2, f ? '#ff6040' : '#a02020');
  return m.leinwand();
}
// Wartungsroboter: klein, rund, gelb lackiert, mit Schraubschlüssel und Schweißbrenner.
// Er repariert, was du kaputt machst.
// variante: 'kaputt' (liegt still, Funken), 'freund' (repariert, läuft für euch: blaues Blech)
function malWartungsbot(f, variante) {
  const m = new Maler(24, 26);
  const s = f ? 1 : 0;
  if (variante === 'kaputt') {
    // Eingeknickte Beine, der Körper liegt schief auf dem Boden, das Auge ist dunkel
    m.form(M.oder(M.kap(5, 22, 1, 25, 1), M.kap(9, 23, 7, 25, 1), M.kap(15, 23, 19, 24, 1), M.kap(19, 21, 23, 25, 1)), RAMPE.metall);
    m.form(M.ell(12, 19, 8, 5.5), RAMPE.gelb, { tiefe: 2 });
    m.form(M.und(M.ell(12, 19, 8, 5.5), M.box(3, 19, 18, 2)), [RAMPE.eisenDkl[0], '#1d1328', '#2a2230', '#3a3040'], { licht: false, kante: false });
    m.form(M.ell(10, 16.5, 3.5, 2.5), [UMRISS, '#14141c', '#22222c', '#34343e'], { licht: false });
    m.form(M.kap(18, 19, 22, 20, 0.8), RAMPE.metall);
    m.punkt(6, 18, RAMPE.rost[2]).punkt(14, 21, RAMPE.rost[1]).punkt(17, 17, RAMPE.rost[2]).punkt(9, 21, RAMPE.rost[1]);
    // Funken aus dem offenen Deckel
    if (f) m.punkt(14, 12, '#ffffff').punkt(15, 11, '#5ff0e0').punkt(13, 10, '#ffe060');
    else m.punkt(14, 13, '#5ff0e0').punkt(16, 12, '#ffffff');
    m.form(M.box(12, 14, 4, 1), RAMPE.eisenDkl, { licht: false });
    return m.leinwand();
  }
  const blech = variante === 'freund' ? RAMPE.blau : RAMPE.gelb;
  // Spinnenbeinchen
  m.form(M.oder(M.kap(7, 18, 4 - s, 25, 1), M.kap(10, 19, 9 + s, 25, 1), M.kap(14, 19, 15 - s, 25, 1), M.kap(17, 18, 20 + s, 25, 1)), RAMPE.metall);
  // Körper
  m.form(M.ell(12, 14, 8, 7), blech, { tiefe: 2 });
  m.form(M.und(M.ell(12, 14, 8, 7), M.box(3, 15, 18, 2)), [RAMPE.eisenDkl[0], '#1d1328', '#2a2230', '#3a3040'], { licht: false, kante: false });
  for (let x = 5; x < 20; x += 4) m.punkt(x, 15, variante === 'freund' ? (x % 8 < 4 ? '#8ad860' : '#1d1328') : (x % 8 < 4) ? '#e8c040' : '#1d1328');
  m.form(M.ell(12, 11, 4, 3), [UMRISS, '#0e3a4a', '#1aa0a8', '#5ff0e0'], { licht: false });
  m.punkt(13, 10, '#e0fff8');
  m.punkt(8, 18, RAMPE.rost[2]).punkt(16, 18, RAMPE.rost[1]).punkt(6, 12, RAMPE.rost[1]);
  // Arm mit Schlüssel und Arm mit Brenner
  m.form(M.kap(19, 14, 23, 9 - s * 2, 0.8), RAMPE.metall);
  m.form(M.oder(M.ell(23, 8 - s * 2, 1.8, 1.8), M.box(22, 4 - s * 2, 1, 3)), RAMPE.stahl);
  m.form(M.kap(5, 14, 1, 10 + s, 0.8), RAMPE.metall);
  m.punkt(1, 9 + s, f ? '#ffffff' : '#5ff0e0').punkt(0, 9 + s, f ? '#5ff0e0' : '#1aa0a8');
  m.form(M.kap(12, 7.5, 12, 3, 0.4), RAMPE.metall); m.punkt(12, 2, f ? '#ff6040' : '#ffe060');
  return m.leinwand();
}
// Der Kesselwärter K-7: ein riesiger Heizroboter. Kesselbauch mit Eisenbändern und Nieten,
// Ofentür mit Gitter und Glut, Manometer, Rohre zum Schlot im Nacken, hydraulische Beine,
// links eine Kohlenschaufel, rechts eine Greifzange.
// pose: 'ruhe' | 'lauf' | 'hoch' (Schaufel erhoben) | 'heiss' (überhitzt). f: 0/1 Bild
function malKesselwaerter(pose, f) {
  if (typeof pose === 'number') { f = pose === 1 ? 1 : 0; pose = pose === 2 ? 'heiss' : 'ruhe'; }
  f = f || 0;
  const m = new Maler(80, 88);
  const heiss = pose === 'heiss', s = pose === 'lauf' ? (f ? 3 : -3) : 0, hoch = pose === 'hoch';
  const blech = heiss ? ['#3a0e08', '#8a2a10', '#c8501c', '#f08a40'] : RAMPE.eisenDkl;
  const band = heiss ? RAMPE.rost : RAMPE.metall;
  const glut = heiss ? ['#6a1a10', '#ff6020', '#ffd060', '#ffffff'] : f ? ['#6a1a10', '#e0521c', '#ffb030', '#fff4a0'] : ['#6a1a10', '#c8401a', '#ff9a30', '#ffe080'];
  const warn = (mx, my, w, h) => { for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) m.punkt(mx + x, my + y, (x + y) % 4 < 2 ? '#e8c040' : '#1d1328'); };
  // ---- Rohre im Rücken zum Schlot ----
  m.form(M.oder(M.kap(30, 30, 26, 8, 2.2), M.kap(50, 30, 54, 8, 2.2)), RAMPE.rost, { tiefe: 2 });
  m.form(M.box(46, 0, 10, 14), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.box(45, 0, 12, 3), RAMPE.eisenDkl);
  m.form(M.oder(M.box(47, 5, 8, 1), M.box(47, 9, 8, 1)), [RAMPE.ziegel[0], RAMPE.ziegel[0], RAMPE.ziegel[0], RAMPE.ziegel[0]], { licht: false, kante: false });
  // ---- Beine: Oberschenkel, Kolben, Knie, breite Füße ----
  const bein = (x, dy) => {
    m.form(M.box(x, 58 + dy, 11, 10), RAMPE.metall, { tiefe: 2 });
    m.form(M.box(x + 2.5, 66 + dy, 6, 14 - dy), RAMPE.stahl, { tiefe: 1 });
    m.form(M.box(x + 1.5, 70 + dy, 8, 2), RAMPE.eisenDkl, { licht: false });
    m.form(M.ell(x + 5.5, 67 + dy, 4, 3), band, { tiefe: 2 });
    m.form(M.poly([[x - 3, 87], [x + 14, 87], [x + 12, 78 + Math.min(0, dy)], [x - 1, 78 + Math.min(0, dy)]]), blech, { tiefe: 2 });
    m.punkt(x + 1, 82, RAMPE.stahl[2]).punkt(x + 10, 82, RAMPE.stahl[2]);
  };
  bein(20, s > 0 ? -2 : 0); bein(49, s < 0 ? -2 : 0);
  // ---- Kesselbauch ----
  m.form(M.oder(M.ell(40, 42, 25, 20), M.box(15, 32, 50, 22)), blech, { tiefe: 3 });
  // Eisenbänder mit Nieten
  [29, 43, 56].forEach(y => {
    m.form(M.und(M.box(13, y, 54, 2.5), M.oder(M.ell(40, 42, 26, 21), M.box(14, 31, 52, 24))), band, { licht: false });
    for (let x = 16; x < 65; x += 4) if (m.get(x, y + 1)) m.punkt(x, y + 1, heiss ? '#ffd0a0' : RAMPE.stahl[2]);
  });
  // Ruß und Rost
  const r = zufall(707);
  for (let k = 0; k < 60; k++) { const x = 16 + r() * 48 | 0, y = 26 + r() * 32 | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.5 ? (heiss ? '#ff8a40' : RAMPE.rost[1]) : '#14101a'); }
  // Ofentür mit Gitter, darin die Glut
  m.form(M.oder(M.ell(40, 46, 11, 8), M.box(29, 46, 22, 7)), [UMRISS, '#2a1a14', '#3a2418', '#4a2e1c'], { tiefe: 2 });
  m.form(M.oder(M.ell(40, 47, 9, 6), M.box(31, 47, 18, 5)), glut, { licht: false, korn: 0.15 });
  for (let x = 32; x <= 48; x += 3) m.form(M.box(x, 41, 1, 12), RAMPE.eisenDkl, { licht: false, kante: false });
  m.form(M.box(29, 40, 22, 2), RAMPE.metall);
  m.punkt(30, 47, RAMPE.stahl[3]).punkt(50, 47, RAMPE.stahl[3]);
  // Manometer und Ventil
  m.form(M.ell(58, 36, 4.2, 4.2), RAMPE.metall, { tiefe: 1 });
  m.form(M.ell(58, 36, 3, 3), ['#3a3a40', '#d8d0b8', '#ece4cc', '#fff8e8'], { licht: false });
  m.form(M.kap(58, 36, heiss ? 60.5 : 56, heiss ? 34 : 34.5, 0.4), heiss ? RAMPE.rot : [UMRISS, UMRISS, UMRISS, UMRISS], { licht: false, kante: false });
  m.form(M.oder(M.kap(22, 30, 22, 25, 1.2), M.ell(22, 24, 2.4, 1.2)), RAMPE.gold);
  // Schild „K-7“
  m.form(M.box(18, 34, 10, 6), RAMPE.putz, { licht: false });
  [[19, 35], [19, 36], [19, 37], [19, 38], [20, 36], [21, 35], [21, 38], [23, 36], [24, 36], [26, 35], [26, 36], [25, 37], [25, 38]].forEach(([x, y]) => m.punkt(x, y, UMRISS));
  // ---- Kopf: kleine Kabine mit Sehschlitz ----
  m.form(M.box(30, 14, 20, 14), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(28, 22, 24, 4), band);
  m.form(M.box(33, 17, 14, 4), [UMRISS, '#0e3a4a', '#1aa0a8', heiss ? '#ff6040' : '#5ff0e0'], { licht: false });
  m.punkt(36, 18, heiss ? '#ffd0a0' : '#e0fff8').punkt(43, 18, heiss ? '#ffd0a0' : '#e0fff8');
  m.form(M.kap(33, 14, 31, 7, 0.6), RAMPE.metall); m.punkt(31, 6, f ? '#ff6040' : '#a02020');
  warn(30, 26, 20, 2);
  // ---- Arme ----
  // Schulterpanzer mit Warnstreifen
  m.form(M.ell(14, 33, 7, 5), blech, { tiefe: 2 }); warn(10, 30, 8, 2);
  m.form(M.ell(66, 33, 7, 5), blech, { tiefe: 2 }); warn(62, 30, 8, 2);
  // Linker Arm mit Schaufel (oben oder unten)
  if (hoch) {
    m.form(M.oder(M.kap(12, 32, 8, 18, 3.4), M.kap(8, 18, 12, 6, 2.6)), RAMPE.metall, { tiefe: 2 });
    m.form(M.kap(10, 30, 8, 20, 1), RAMPE.stahl, { licht: false });
    m.form(M.poly([[2, 0], [20, 0], [19, 7], [3, 7]]), RAMPE.stahl, { tiefe: 2 });
    m.form(M.ell(11, 2, 6, 2.4), glut, { licht: false });
  } else {
    m.form(M.oder(M.kap(12, 34, 6, 50 + s * 0.3, 3.4), M.kap(6, 50 + s * 0.3, 7, 63, 2.8)), RAMPE.metall, { tiefe: 2 });
    m.form(M.kap(10, 38, 7, 48, 1), RAMPE.stahl, { licht: false });
    m.form(M.ell(6, 50 + s * 0.3, 2.6, 2.6), band);
    m.form(M.poly([[0, 62], [15, 62], [14, 75], [1, 75]]), RAMPE.stahl, { tiefe: 2 });
    m.form(M.ell(7.5, 64, 5.5, 2), glut, { licht: false });
  }
  // Rechter Arm mit Greifzange
  m.form(M.oder(M.kap(68, 34, 74, 50 - s * 0.3, 3.4), M.kap(74, 50 - s * 0.3, 74, 60, 2.8)), RAMPE.metall, { tiefe: 2 });
  m.form(M.kap(70, 38, 73, 48, 1), RAMPE.stahl, { licht: false });
  m.form(M.ell(74, 50 - s * 0.3, 2.6, 2.6), band);
  m.form(M.oder(M.kap(72, 60, 69, 68, 1.4), M.kap(76, 60, 79, 68, 1.4), M.kap(74, 61, 74, 69, 1.2)), RAMPE.stahl);
  return m.leinwand();
}
// ---- Requisiten für Hof und Halle des Kraftwerks ----
function malLore() {
  const m = new Maler(30, 22);
  m.form(M.oder(M.ell(7, 18, 3.2, 3.2), M.ell(23, 18, 3.2, 3.2)), [UMRISS, '#1a1420', '#2a2230', '#3a3040']);
  m.form(M.poly([[1, 6], [29, 6], [26, 17], [4, 17]]), RAMPE.rost, { tiefe: 2 });
  m.form(M.oder(M.box(2, 9, 26, 1), M.box(3, 13, 24, 1)), [RAMPE.rost[0], RAMPE.rost[0], RAMPE.rost[0], RAMPE.rost[0]], { licht: false, kante: false });
  const r = zufall(31);
  m.form(M.ell(15, 6, 12, 3.5), ['#0e0c12', '#1c1a22', '#2e2a34', '#4a4452'], { korn: 0.3 });
  for (let i = 0; i < 4; i++) m.punkt(6 + r() * 18 | 0, 4 + r() * 3 | 0, '#6a6474');
  return m.leinwand();
}
function malKohlehaufen(seed) {
  const r = zufall(seed + 140), m = new Maler(40, 22);
  const brocken = [];
  for (let i = 0; i < 16; i++) brocken.push(M.ell(4 + r() * 32, 12 + r() * 9, 2.5 + r() * 4, 2 + r() * 3));
  brocken.push(M.ell(20, 16, 16, 6));
  m.form(M.oder(...brocken), ['#0a080e', '#1a1820', '#2a2630', '#4a4452'], { tiefe: 2, korn: 0.25 });
  for (let k = 0; k < 14; k++) { const x = 4 + r() * 32 | 0, y = 8 + r() * 12 | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.7 ? '#6a6474' : '#8a8494'); }
  return m.leinwand();
}
function malKisten(seed) {
  const r = zufall(seed + 160), m = new Maler(26, 26);
  const kiste = (x, y, w) => {
    m.form(M.box(x, y, w, w), RAMPE.holz, { tiefe: 2 });
    m.form(M.oder(M.kap(x + 1, y + 1, x + w - 2, y + w - 2, 0.5), M.box(x, y + 1, w, 1), M.box(x, y + w - 2, w, 1)), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  };
  kiste(1, 13, 12); kiste(13, 13, 12); kiste(6 + (r() < 0.5 ? -2 : 2), 2, 11);
  m.form(M.box(16, 17, 6, 3), RAMPE.putz, { licht: false });
  return m.leinwand();
}
function malIndustrielampe(f) {
  const m = new Maler(16, 46);
  m.form(M.box(7, 8, 2, 37), RAMPE.metall);
  m.form(M.box(4, 43, 8, 3), RAMPE.eisenDkl);
  m.form(M.kap(8, 8, 13, 5, 0.8), RAMPE.metall);
  m.form(M.poly([[9, 4], [16, 4], [15, 8], [10, 8]]), RAMPE.eisenDkl);
  m.form(M.box(10, 8, 5, 2), f ? ['#6a4a10', '#ffd060', '#fff4a0', '#ffffff'] : ['#3a3020', '#5a4a30', '#6a5a38', '#7a6a40'], { licht: false });
  return m.leinwand();
}
function malRohrleitung(seed) {
  const r = zufall(seed + 180), m = new Maler(32, 20);
  m.form(M.oder(M.box(6, 12, 2, 8), M.box(24, 12, 2, 8)), RAMPE.metall);
  m.form(M.box(0, 5, 32, 8), RAMPE.rost, { tiefe: 2 });
  m.form(M.oder(M.box(10, 3, 3, 12), M.box(26, 3, 3, 12)), RAMPE.metall, { tiefe: 1 });
  if (r() < 0.6) { m.form(M.oder(M.box(17, 0, 2, 6), M.ell(18, 0.5, 3, 1)), RAMPE.metall); m.punkt(18, 0, RAMPE.rot[2]); }
  for (let k = 0; k < 8; k++) m.punkt(r() * 31 | 0, 6 + r() * 6 | 0, RAMPE.rost[3]);
  return m.leinwand();
}
function malSchaltschrank(f) {
  const m = new Maler(18, 30);
  m.form(M.box(1, 2, 16, 27), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(3, 5, 12, 10), [UMRISS, '#0e1a22', '#14262e', '#1e3440'], { licht: false });
  const an = f ? ['#5ff0e0', '#1d1328', '#ff6040'] : ['#1d1328', '#ffe060', '#5ff0e0'];
  [[5, 7], [8, 7], [11, 7], [5, 10], [8, 10], [11, 10]].forEach(([x, y], i) => m.punkt(x, y, an[i % 3]).punkt(x + 1, y, an[(i + 1) % 3]));
  m.form(M.oder(M.ell(6, 20, 1.6, 1.6), M.ell(12, 20, 1.6, 1.6)), RAMPE.putz);
  m.form(M.kap(9, 24, 9, 27, 0.6), RAMPE.rot, { licht: false });
  for (let x = 2; x < 16; x++) m.punkt(x, 3, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  return m.leinwand();
}
function malSaeule() {
  const m = new Maler(16, 64);
  m.form(M.box(3, 4, 10, 58), RAMPE.metall, { tiefe: 2 });
  m.form(M.oder(M.box(1, 0, 14, 5), M.box(1, 58, 14, 6)), RAMPE.eisenDkl, { tiefe: 1 });
  for (let y = 8; y < 58; y += 5) m.punkt(4, y, RAMPE.stahl[3]).punkt(11, y, RAMPE.stahl[2]);
  for (let y = 20; y < 46; y++) if (y % 6 < 3) m.punkt(7, y, '#e8c040').punkt(8, y, '#e8c040');
  m.form(M.box(3, 30, 10, 4), RAMPE.rost, { licht: false });
  return m.leinwand();
}
// Elementturm des Lehrlings: Steinsockel, Metallsäule, glühender Kristall in der Farbe des Elements
const ELEMENT_RAMPE = {
  feuer:  ['#4a1406', '#b83a10', '#ff8a30', '#ffe080'],
  eis:    ['#16305a', '#3a7ac0', '#8ad0ff', '#eef8ff'],
  blitz:  ['#4a3a06', '#b89a18', '#ffe060', '#fffbd8'],
  metall: ['#22242e', '#5a6278', '#a7b6cf', '#f2f6ff'],
};
function malElementturm(el, f) {
  const F = ELEMENT_RAMPE[el], m = new Maler(26, 48);
  m.form(M.poly([[2, 47], [24, 47], [20, 39], [6, 39]]), RAMPE.beton, { tiefe: 2 });
  m.form(M.poly([[8, 40], [18, 40], [16, 19], [10, 19]]), RAMPE.metall, { tiefe: 2 });
  m.form(M.oder(M.box(7, 18, 12, 3), M.box(6, 37, 14, 3)), RAMPE.eisenDkl, { tiefe: 1 });
  for (let y = 23; y < 37; y += 4) m.punkt(13, y + (f ? 2 : 0), F[2]).punkt(12, y + (f ? 2 : 0), F[1]);
  // schwebender Kristall
  const o = f ? 1 : 0;
  m.form(M.poly([[13, 1 + o], [19, 8 + o], [13, 16 + o], [7, 8 + o]]), F, { tiefe: 2 });
  m.punkt(11, 5 + o, F[3]).punkt(12, 4 + o, F[3]).punkt(11, 6 + o, F[3]);
  if (f) { m.punkt(4, 6, F[2]).punkt(22, 11, F[2]).punkt(20, 2, F[3]); } else { m.punkt(5, 12, F[2]).punkt(21, 5, F[3]); }
  return m.leinwand();
}
function malFoerderband(f) {
  const m = new Maler(48, 18);
  m.form(M.oder(M.box(4, 9, 2, 9), M.box(42, 9, 2, 9), M.box(23, 9, 2, 9)), RAMPE.metall);
  m.form(M.box(0, 4, 48, 6), RAMPE.eisenDkl, { tiefe: 2 });
  for (let x = (f ? 2 : 0); x < 48; x += 4) m.punkt(x, 5, '#4a4452');
  const r = zufall(f ? 3 : 4);
  for (let i = 0; i < 9; i++) m.form(M.ell(3 + i * 5 + (f ? 2 : 0), 3, 2, 1.6), ['#0a080e', '#1a1820', '#2a2630', '#4a4452']);
  m.form(M.oder(M.ell(2, 7, 2.4, 2.4), M.ell(46, 7, 2.4, 2.4)), RAMPE.metall);
  return m.leinwand();
}
// Ein Schlot aus Ziegeln, zwei davon ragen über das Kraftwerk
function malSchlot(seed) {
  const r = zufall(seed + 70), m = new Maler(30, 120);
  m.form(M.poly([[4, 119], [26, 119], [22, 6], [8, 6]]), RAMPE.ziegel, { tiefe: 3 });
  for (let y = 12; y < 118; y += 4) for (let x = 6 + (y % 8 ? 2 : 0); x < 25; x += 5) if (r() < 0.6) m.punkt(x, y, RAMPE.ziegel[0]);
  m.form(M.oder(M.box(6, 2, 18, 5), M.box(5, 30, 20, 2), M.box(5, 70, 22, 2)), RAMPE.beton);
  for (let k = 0; k < 14; k++) m.punkt(6 + r() * 18 | 0, 8 + r() * 100 | 0, RAMPE.moos[2]);
  return m.leinwand();
}
// Ein Dampfkessel mit Rohren
function malKessel(seed) {
  const r = zufall(seed + 90), m = new Maler(44, 40);
  m.form(M.oder(M.ell(22, 22, 18, 14), M.box(4, 14, 36, 16)), RAMPE.eisenDkl, { tiefe: 3 });
  m.form(M.oder(M.box(4, 13, 36, 2), M.box(4, 30, 36, 2)), RAMPE.metall, { licht: false });
  for (let x = 7; x < 40; x += 4) m.punkt(x, 14, RAMPE.stahl[2]);
  m.form(M.oder(M.kap(30, 8, 30, 0, 2), M.kap(30, 0, 43, 0, 2)), RAMPE.rost);
  m.form(M.ell(14, 22, 4, 4), RAMPE.putz); m.form(M.kap(14, 22, 16, 20, 0.4), RAMPE.rot, { licht: false });
  m.form(M.oder(M.box(6, 34, 5, 6), M.box(33, 34, 5, 6)), RAMPE.metall);
  for (let k = 0; k < 10; k++) m.punkt(5 + r() * 34 | 0, 12 + r() * 20 | 0, RAMPE.rost[2]);
  return m.leinwand();
}
// Das Tor zur Kesselhalle: zu (0) oder aufgesprengt (1)
function malKraftwerkTor(offen) {
  const m = new Maler(64, 44);
  m.form(M.oder(M.box(0, 4, 8, 40), M.box(56, 4, 8, 40)), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.box(0, 0, 64, 7), RAMPE.beton, { tiefe: 2 });
  if (!offen) {
    m.form(M.box(8, 7, 48, 37), RAMPE.metall, { tiefe: 2 });
    for (let x = 12; x < 56; x += 6) m.form(M.box(x, 8, 1, 35), [RAMPE.metall[0], RAMPE.metall[0], RAMPE.metall[0], RAMPE.metall[0]], { licht: false, kante: false });
    m.form(M.box(26, 20, 12, 6), RAMPE.gelb, { licht: false });
    m.punkt(28, 22, UMRISS).punkt(31, 22, UMRISS).punkt(34, 22, UMRISS);
    m.form(M.ell(32, 12, 2, 2), [UMRISS, '#0e3a4a', '#1aa0a8', '#5ff0e0'], { licht: false });
  } else {
    m.form(M.box(8, 7, 48, 37), [UMRISS, '#0e0a10', '#16101a', '#1e1824'], { licht: false });
    m.form(M.oder(M.poly([[8, 7], [16, 9], [14, 44], [8, 44]]), M.poly([[56, 7], [48, 10], [51, 44], [56, 44]])), RAMPE.metall, { tiefe: 2 });
  }
  return m.leinwand();
}
// Ziegelmauer des Kraftwerks
function malZiegelwand(seed) {
  const r = zufall(seed + 120), m = new Maler(32, 44);
  m.form(M.box(0, 4, 32, 40), RAMPE.ziegel, { tiefe: 2 });
  for (let y = 7; y < 44; y += 4) { m.form(M.box(0, y, 32, 1), [RAMPE.ziegel[0], RAMPE.ziegel[0], RAMPE.ziegel[0], RAMPE.ziegel[0]], { licht: false, kante: false }); for (let x = (y % 8 ? 2 : 6); x < 32; x += 8) m.punkt(x, y + 1, RAMPE.ziegel[0]).punkt(x, y + 2, RAMPE.ziegel[0]); }
  m.form(M.box(0, 0, 32, 5), RAMPE.beton);
  if (r() < 0.6) m.form(M.box(10, 14, 12, 10), [UMRISS, '#0e3a4a', '#16222a', '#1e2e3a'], { licht: false });
  for (let k = 0; k < 10; k++) m.punkt(r() * 31 | 0, 5 + r() * 38 | 0, RAMPE.moos[2]);
  return m.leinwand();
}
// Funkturm im Dorf: ein Gittermast mit Antennen und einer Hütte
function malFunkturm(f) {
  const m = new Maler(36, 72);
  m.form(M.oder(M.kap(10, 70, 17, 6, 0.9), M.kap(26, 70, 19, 6, 0.9)), RAMPE.metall);
  for (let y = 14; y < 66; y += 7) { const w = 3 + (y - 6) * 0.11; m.form(M.oder(M.kap(18 - w, y, 18 + w, y + 6, 0.5), M.kap(18 + w, y, 18 - w, y + 6, 0.5)), RAMPE.metall, { licht: false }); }
  m.form(M.kap(18, 6, 18, 0, 0.6), RAMPE.stahl);
  m.form(M.oder(M.kap(12, 10, 24, 10, 0.5), M.kap(14, 4, 22, 4, 0.5)), RAMPE.stahl);
  m.punkt(18, 0, f ? '#ff6040' : '#a02020').punkt(17, 0, f ? '#ff9a70' : '#802020');
  m.form(M.box(0, 52, 16, 19), RAMPE.holz, { tiefe: 2 });
  m.form(M.poly([[-1, 53], [8, 47], [17, 53]]), RAMPE.ziegel);
  m.form(M.box(4, 57, 7, 5), [UMRISS, '#0e3a4a', '#1aa0a8', f ? '#e0fff8' : '#5ff0e0'], { licht: false });
  return m.leinwand();
}

// ---------------------------------------------------------------------
// DIE BESTEHENDEN: Eiferer und ihre Hauptleute
// ---------------------------------------------------------------------
const KUTTE = ['#14181e', '#262e38', '#38444e', '#4e5e68'];
// Eiferer: Kutte, über der Brust gesalbte Kabel wie eine Stola, in der Hand ein Ölkanister
function malEiferer(schritt, f) {
  const m = new Maler(26, 36), Y = 2, s = schritt;
  m.form(M.oder(M.kap(10, 24 + Y, 10 - s * 0.6, 30 + Y, 1.6), M.kap(10 - s * 0.6, 30 + Y, 10 - s, 33.5, 1.4)), RAMPE.lederDkl);
  // Kutte, unten weit
  m.form(M.oder(M.poly([[7, 12 + Y], [18, 12 + Y], [20, 30 + Y], [5, 30 + Y]]), M.ell(12.5, 12.5 + Y, 5.5, 2.2)), KUTTE, { tiefe: 2 });
  m.form(M.box(12, 15 + Y, 1, 15), [KUTTE[0], KUTTE[1], KUTTE[1], KUTTE[1]], { licht: false, kante: false });
  // Kabel-Stola mit Kupferenden, glänzend vom Öl
  m.form(M.oder(M.kap(8.5, 13 + Y, 15, 27 + Y, 0.8), M.kap(16.5, 13 + Y, 10, 27 + Y, 0.8)), ['#0a0a0e', '#1a1a20', '#2a2a34', '#6a6a7a'], { licht: false });
  m.punkt(15, 28 + Y, RAMPE.gold[2]).punkt(10, 28 + Y, RAMPE.gold[2]);
  m.form(M.box(6.5, 20 + Y, 12, 1.5), RAMPE.lederDkl, { licht: false });
  m.form(M.oder(M.kap(14, 24 + Y, 14 + s * 0.6, 30 + Y, 1.6), M.kap(14 + s * 0.6, 30 + Y, 14 + s, 33.5, 1.4)), KUTTE);
  m.form(M.box(8 - s, 33, 4, 2.5), RAMPE.lederDkl); m.form(M.box(12 + s, 33, 4, 2.5), RAMPE.lederDkl);
  // Kopf: Kapuze, Gesicht mit Ölstreifen
  m.form(M.box(10.5, 9 + Y, 4, 3), RAMPE.haut);
  m.form(M.ell(13, 6.5 + Y, 3.4, 3.6), RAMPE.haut);
  m.form(M.oder(M.ell(12.4, 5.5 + Y, 4.8, 4.6), M.poly([[7.5, 6 + Y], [6.5, 12 + Y], [10, 11 + Y]])), KUTTE, { tiefe: 2 });
  m.form(M.ell(14.2, 7.6 + Y, 2.6, 2.6), RAMPE.haut, { licht: false });
  m.punkt(15, 7 + Y, UMRISS).punkt(13.5, 7 + Y, UMRISS);
  m.form(M.kap(13, 8.6 + Y, 16, 9.4 + Y, 0.4), ['#0a0a0e', '#14141a', '#14141a', '#14141a'], { licht: false, kante: false });
  // Ölkanister in der vorderen Hand, oben ein brennender Docht
  m.form(M.kap(17, 15 + Y, 20, 20 + Y, 1.4), KUTTE);
  m.form(M.box(18, 18 + Y, 7, 8), RAMPE.rot, { tiefe: 2 });
  m.form(M.box(19, 20 + Y, 5, 1), RAMPE.rotDkl, { licht: false });
  m.form(M.box(23, 16 + Y, 1.6, 3), RAMPE.metall);
  m.form(M.poly([[23, 16 + Y], [24, 12 + Y + (f ? 1 : 0)], [25, 16 + Y]]), RAMPE.feuer, { kante: false, licht: false });
  return m.leinwand();
}
// Eiferer-Hauptmann: größer, Kupferdraht-Krone, Stab mit Lazi-Kristall, Umhang aus Kabelgeflecht
function malHauptmann(schritt, stufe) {
  const m = new Maler(36, 46), Y = 4, s = schritt;
  const umhang = ['#0e1014', '#1e2228', '#2e343c', '#46505a'];
  m.form(M.poly([[9, 13 + Y], [24, 13 + Y], [30, 38 + Y], [4, 38 + Y]]), umhang, { tiefe: 2 });
  for (let x = 6; x < 29; x += 3) m.form(M.kap(x, 20 + Y, x + 1, 37 + Y, 0.4), ['#0a0a0e', '#1a1a20', '#1a1a20', '#2a2a34'], { licht: false, kante: false });
  m.form(M.oder(M.kap(14, 31 + Y, 14 - s * 0.6, 37 + Y, 1.9), M.kap(14 - s * 0.6, 37 + Y, 14 - s, 42, 1.6)), RAMPE.lederDkl);
  m.form(M.oder(M.poly([[11, 13 + Y], [23, 13 + Y], [25, 34 + Y], [9, 34 + Y]]), M.ell(17, 13.5 + Y, 6.5, 2.6)), KUTTE, { tiefe: 2 });
  // Goldene Kabelstola
  m.form(M.oder(M.kap(12, 14 + Y, 19.5, 31 + Y, 0.9), M.kap(22, 14 + Y, 14.5, 31 + Y, 0.9)), RAMPE.gold, { licht: false });
  m.form(M.ell(17, 21 + Y, 2.2, 2.2), RAMPE.lazi, { licht: false }); m.punkt(16, 20 + Y, '#ffffff');
  m.form(M.oder(M.kap(19, 31 + Y, 19 + s * 0.6, 37 + Y, 1.9), M.kap(19 + s * 0.6, 37 + Y, 19 + s, 42, 1.6)), KUTTE);
  m.form(M.box(11 - s, 41, 6, 3), RAMPE.lederDkl); m.form(M.box(17 + s, 41, 6, 3), RAMPE.lederDkl);
  // Kopf mit Krone aus Kupferdraht
  m.form(M.box(15, 9 + Y, 4, 4), RAMPE.haut);
  m.form(M.ell(17.4, 6.5 + Y, 3.8, 3.9), RAMPE.haut);
  m.form(M.oder(M.ell(16.6, 5.4 + Y, 5.2, 4.8), M.poly([[11.5, 6 + Y], [10, 13 + Y], [14, 12 + Y]])), KUTTE, { tiefe: 2 });
  m.form(M.ell(18.6, 7.8 + Y, 2.8, 2.8), RAMPE.haut, { licht: false });
  m.punkt(19.5, 7 + Y, UMRISS).punkt(18, 7 + Y, UMRISS).punkt(18, 9.6 + Y, RAMPE.haut[0]);
  for (let i = 0; i < 4 + Math.min(3, stufe || 0); i++) m.form(M.kap(13 + i * 2, 1.5 + Y, 13.5 + i * 2, -1.5 + Y - (i % 2), 0.45), RAMPE.rost, { licht: false });
  m.form(M.box(12, 1 + Y, 10, 1.4), RAMPE.rost, { licht: false });
  // Stab mit Kristall
  m.form(M.kap(29, 8 + Y, 27, 41, 0.8), RAMPE.metall);
  m.form(M.kap(22, 18 + Y, 28, 22 + Y, 1.6), KUTTE);
  m.form(M.poly([[29, -1 + Y], [32, 5 + Y], [29, 10 + Y], [26, 5 + Y]]), RAMPE.lazi, { tiefe: 1 });
  m.punkt(28, 3 + Y, '#ffffff');
  return m.leinwand();
}
// Der Dorfhund
function malHund(f) {
  const m = new Maler(20, 14), s = f ? 1 : 0;
  m.form(M.oder(M.kap(5, 9, 4 - s, 13, 0.9), M.kap(8, 9, 8 + s, 13, 0.9), M.kap(13, 9, 12 - s, 13, 0.9), M.kap(15, 9, 16 + s, 13, 0.9)), RAMPE.leder);
  m.form(M.ell(10, 8, 6.5, 3.2), RAMPE.leder, { tiefe: 2 });
  m.form(M.kap(4, 7, 1, 3 + s, 0.8), RAMPE.leder);
  m.form(M.ell(16, 5, 3.4, 3), RAMPE.leder, { tiefe: 1 });
  m.form(M.ell(18.5, 6, 1.6, 1.2), RAMPE.lederDkl);
  m.form(M.poly([[14, 3], [15, 0], [16.5, 3]]), RAMPE.lederDkl);
  m.punkt(17, 4, UMRISS).punkt(19, 6, UMRISS);
  m.form(M.box(12, 7, 2, 2), RAMPE.rot, { licht: false });
  return m.leinwand();
}
// Kläranlage: zwei runde Becken, Rohre und ein Pumpenhaus
// Verbund-Terminal: Schaltschrank der Alten mit Bildschirm, darauf die fünf Verbünde als Balken.
// f = -1: ohne Strom (Bildschirm schwarz), 0 und 1: zwei Bilder zum Flackern
function malVerbundTerminal(f) {
  const m = new Maler(34, 42), an = f >= 0;
  m.form(M.box(1, 33, 32, 8), RAMPE.stein, { tiefe: 2 });
  m.form(M.oder(M.kap(28, 16, 31, 30, 0.9), M.kap(31, 30, 33, 35, 0.9)), ['#0a0a0e', '#1a1a20', '#2a2a34', '#4a4a5a'], { licht: false });
  m.form(M.box(5, 9, 23, 25), RAMPE.metall, { tiefe: 3 });
  m.form(M.box(4, 7, 25, 3), RAMPE.stahl);
  m.form(M.box(8, 12, 17, 11), an ? [UMRISS, '#0e3a4a', '#103440', '#1aa0a8'] : [UMRISS, '#101018', '#14141c', '#1c1c26'], { licht: false });
  if (an) ['#ffd060', '#7ad37a', '#ff9a40', '#5ff0e0', '#c890ff'].forEach((c, i) => {
    const h = [6, 3, 7, 4, 5][(i + f * 2) % 5];
    for (let y = 0; y < h; y++) m.punkt(10 + i * 3, 21 - y, c).punkt(11 + i * 3, 21 - y, c);
  });
  m.punkt(8, 26, an && f ? '#ff6040' : '#601818').punkt(11, 26, an ? '#5ff0e0' : '#1a3a40').punkt(14, 26, an && !f ? '#7ad37a' : '#2a402a');
  m.form(M.box(17, 25, 8, 4), RAMPE.stahl);
  m.form(M.kap(25, 7, 27, 1, 0.5), RAMPE.stahl);
  m.punkt(27, 0, an ? (f ? '#e0fff8' : '#5ff0e0') : '#1a3a40');
  return m.leinwand();
}

function malKlaeranlage(f) {
  const m = new Maler(48, 36);
  m.form(M.oder(M.ell(12, 26, 11, 6), M.box(1, 20, 22, 6)), RAMPE.beton, { tiefe: 2 });
  m.form(M.ell(12, 21, 9, 3.6), f ? ['#1e3a5a', '#2e5480', '#4a78a8', '#9ac0e8'] : ['#1e3a5a', '#24466a', '#3a6a98', '#78a8d8'], { licht: false });
  m.form(M.oder(M.ell(36, 28, 10, 5.5), M.box(26, 22, 20, 6)), RAMPE.beton, { tiefe: 2 });
  m.form(M.ell(36, 23, 8, 3.2), ['#2a4a2a', '#3a6a3a', '#5a8a4a', '#8ab870'], { licht: false });
  m.form(M.box(18, 4, 14, 14), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.poly([[16, 5], [25, -1], [34, 5]]), RAMPE.metall);
  m.form(M.box(22, 9, 6, 5), [UMRISS, '#0e3a4a', '#1aa0a8', f ? '#e0fff8' : '#5ff0e0'], { licht: false });
  m.form(M.oder(M.kap(18, 14, 12, 18, 1), M.kap(32, 14, 36, 19, 1)), RAMPE.rost);
  return m.leinwand();
}

// ---------------------------------------------------------------------
// DEKO IM DORF
// ---------------------------------------------------------------------
function malFahne() {
  const m = new Maler(18, 40);
  m.form(M.box(3, 2, 1.6, 37), RAMPE.holz);
  m.form(M.ell(3.8, 2, 1.4, 1.4), RAMPE.gold);
  m.form(M.poly([[5, 4], [17, 5], [15, 10], [17, 15], [5, 14]]), RAMPE.blau, { tiefe: 2 });
  // Das Dorfzeichen: ein Lagerfeuer
  m.form(M.poly([[9, 12], [11, 7], [13, 12]]), RAMPE.feuer, { licht: false });
  m.form(M.box(8.5, 12, 5, 1), RAMPE.holz, { licht: false });
  m.form(M.ell(4, 39, 3, 1.2), RAMPE.stein);
  return m.leinwand();
}
// Eine Statue des Helden: die Spielfigur in Stein, auf einem Sockel
function malStatue(held) {
  const w = held.width, h = held.height, c = document.createElement('canvas');
  c.width = w + 4; c.height = h + 12;
  const g = c.getContext('2d');
  const quelle = held.getContext('2d').getImageData(0, 0, w, h), ziel = g.createImageData(w, h);
  const stein = ['#2a2838', '#5c5a6e', '#8a8898', '#b8b6c2'].map(hexRgb);
  for (let i = 0; i < quelle.data.length; i += 4) {
    if (quelle.data[i + 3] < 128) continue;
    const l = (quelle.data[i] * 0.3 + quelle.data[i + 1] * 0.55 + quelle.data[i + 2] * 0.15) / 255;
    const s = stein[Math.min(3, Math.floor(l * 4.2 + 0.9))];
    ziel.data[i] = s[0]; ziel.data[i + 1] = s[1]; ziel.data[i + 2] = s[2]; ziel.data[i + 3] = 255;
  }
  g.putImageData(ziel, 2, 0);
  // Gestufter Sockel mit Messingtafel, Moos und Blumen am Fuß
  const r = zufall(21), m = new Maler(w + 4, 12);
  m.form(M.box(4, 0, w - 4, 6), RAMPE.stein, { tiefe: 2 });
  m.form(M.box(2, 5, w, 4), RAMPE.stein, { tiefe: 1 });
  m.form(M.box(0, 8, w + 4, 4), RAMPE.beton);
  m.form(M.box(9, 1.5, w - 14, 3), RAMPE.gold, { licht: false });
  for (let k = 0; k < 8; k++) m.punkt(1 + r() * (w + 2) | 0, 6 + r() * 5 | 0, RAMPE.moos[2 + (r() < 0.5 ? 1 : 0)]);
  for (const x of [1, 5, w - 3, w]) { m.punkt(x, 10, LAUB[2]).punkt(x + 1, 10, LAUB[1]); bluete(m, x, 8, BLUETEN[x % 5]); }
  g.drawImage(m.leinwand(), 0, h - 2);
  return c;
}
// Eine halb eingestürzte Hauswand: niedrig genug, dass man dahinter noch etwas sieht
function malRuine(seed) {
  const r = zufall(seed + 300), w = 44 + Math.floor(r() * 12), m = new Maler(w, 34);
  const oben = []; for (let x = 0; x <= w; x += 4) oben.push([x, 6 + Math.floor(r() * 16)]);
  m.form(M.poly([[0, 33], ...oben.map(([x, y]) => [Math.min(x, w), y]), [w, 33]]), r() < 0.5 ? RAMPE.ziegel : RAMPE.beton, { tiefe: 2 });
  for (let x = 4; x < w - 8; x += 12) if (r() < 0.7) m.form(M.box(x, 16 + Math.floor(r() * 4), 6, 7), [UMRISS, '#14101c', '#1c1626', '#241e30'], { licht: false });
  for (let k = 0; k < 18; k++) m.punkt(r() * w | 0, 10 + r() * 22 | 0, r() < 0.5 ? RAMPE.moos[2] : RAMPE.blatt[3]);
  m.form(M.oder(M.ell(6, 31, 6, 3), M.ell(w - 8, 31, 7, 3)), RAMPE.beton);
  return m.leinwand();
}
// Kaputte Leuchtreklame der Alten: L.A.C.I., nur noch zwei Buchstaben glimmen
function malLeuchtreklame(f) {
  const m = new Maler(40, 46);
  m.form(M.oder(M.box(18, 18, 3, 28), M.box(13, 43, 13, 3)), RAMPE.metall);
  m.form(M.box(2, 2, 36, 17), RAMPE.eisenDkl, { tiefe: 2 });
  const an = [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8'], aus = [UMRISS, '#1a2a30', '#24363c', '#2e4248'];
  // L
  m.form(M.oder(M.box(5, 5, 2, 10), M.box(5, 13, 5, 2)), f ? an : aus, { licht: false });
  // A
  m.form(M.oder(M.box(12, 5, 2, 10), M.box(16, 5, 2, 10), M.box(12, 5, 6, 2), M.box(12, 9, 6, 2)), an, { licht: false });
  // C
  m.form(M.oder(M.box(21, 5, 2, 10), M.box(21, 5, 5, 2), M.box(21, 13, 5, 2)), aus, { licht: false });
  // I
  m.form(M.box(29, 5, 2, 10), f ? aus : an, { licht: false });
  m.punkt(8, 5, '#3ff0d8').punkt(34, 16, RAMPE.rost[2]).punkt(3, 17, RAMPE.rost[1]);
  for (let i = 0; i < 6; i++) m.punkt(2 + i * 6, 18, RAMPE.moos[2]);
  return m.leinwand();
}
// Lazi-Tafel in der Universität: flimmert noch immer
function malLaziTafel(f) {
  const m = new Maler(30, 34);
  m.form(M.oder(M.box(6, 18, 2, 16), M.box(22, 18, 2, 16)), RAMPE.metall);
  m.form(M.box(1, 1, 28, 19), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(3, 3, 24, 15), [UMRISS, '#0e3a4a', '#13505e', '#1a6a78'], { licht: false });
  const z = f ? RAMPE.lazi[3] : RAMPE.lazi[2];
  for (let y = 5; y < 16; y += 3) for (let x = 5; x < 24; x++) if ((x * 7 + y * 3 + (f ? 1 : 0)) % 5 < 3) m.punkt(x, y, z);
  m.punkt(24, 5, '#ff5a4a');
  return m.leinwand();
}

// Die große Lazi-Tafel im Lesesaal: ein Bildschirm so groß wie ein Scheunentor. stufe 0–2: heil bis zerschlagen
function malGrosseTafel(stufe) {
  const m = new Maler(56, 50), r = zufall(stufe + 300);
  m.form(M.oder(M.box(8, 34, 4, 16), M.box(44, 34, 4, 16)), RAMPE.metall, { tiefe: 1 });
  m.form(M.box(4, 46, 48, 4), RAMPE.eisenDkl);
  m.form(M.box(1, 1, 54, 36), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(4, 4, 48, 30), [UMRISS, '#0e3a4a', '#13505e', '#1a6a78'], { licht: false });
  // Schriftzeilen und ein Kreis in der Mitte: das Zeichen der Universität
  for (let y = 7; y < 31; y += 3) for (let x = 7; x < 49; x++) if ((x * 5 + y * 7) % 6 < 3 && Math.hypot(x - 28, y - 18) > 8) m.punkt(x, y, stufe ? RAMPE.lazi[2] : RAMPE.lazi[3]);
  for (let a = 0; a < Math.PI * 2; a += 0.08) m.punkt(28 + Math.cos(a) * 6 | 0, 18 + Math.sin(a) * 6 | 0, RAMPE.lazi[3]);
  m.punkt(28, 18, '#ffffff').punkt(27, 18, RAMPE.lazi[3]).punkt(29, 18, RAMPE.lazi[3]);
  m.punkt(50, 6, '#ff5a4a').punkt(48, 6, '#5ff0e0');
  if (stufe >= 1) {
    // Sprünge im Glas, Ölflecken der Eiferer
    for (let k = 0; k < stufe * 3; k++) { let x = 10 + r() * 36 | 0, y = 6 + r() * 24 | 0; for (let i = 0; i < 10; i++) { m.punkt(x, y, '#d8f8ff'); x += r() < 0.5 ? 1 : -1; y += r() < 0.6 ? 1 : 0; } }
    for (let k = 0; k < stufe * 4; k++) m.form(M.ell(6 + r() * 44, 6 + r() * 26, 2 + r() * 2, 1.5), [UMRISS, '#1d1328', '#2a2230', '#3a3040'], { licht: false, kante: false });
  }
  if (stufe >= 2) m.form(M.poly([[30, 4], [40, 4], [34, 20], [26, 14]]), [UMRISS, '#05080c', '#0a0e14', '#10161e'], { licht: false });
  return m.leinwand();
}
// Bücherregal der Alten, schief, halb ausgeräumt
function malRegal(seed) {
  const r = zufall(seed + 320), m = new Maler(30, 40);
  m.form(M.box(1, 1, 28, 38), RAMPE.holz, { tiefe: 2 });
  m.form(M.box(3, 3, 24, 34), [UMRISS, '#1a120c', '#22180e', '#2c2012'], { licht: false });
  const farben = [RAMPE.rot, RAMPE.blau, RAMPE.gruen, RAMPE.leder, RAMPE.stoff, RAMPE.olive];
  for (let y = 3; y < 37; y += 9) {
    m.form(M.box(2, y + 7, 26, 2), RAMPE.holz, { licht: false });
    for (let x = 3; x < 27;) {
      if (r() < 0.22) { x += 2 + r() * 3 | 0; continue; }
      const w = 2 + (r() * 2 | 0), h = 5 + (r() * 2 | 0), f = farben[r() * farben.length | 0];
      if (r() < 0.12 && x < 22) { m.form(M.poly([[x, y + 7], [x + 2, y + 7], [x + 6, y + 3], [x + 4, y + 2]]), f, { licht: false }); x += 6; continue; }
      m.form(M.box(x, y + 7 - h, w, h), f, { licht: false, kante: false });
      m.punkt(x, y + 7 - h + 1, f[3]);
      x += w;
    }
  }
  return m.leinwand();
}
// Lesepult mit kleinem Lazi-Bildschirm
function malLesepult(f) {
  const m = new Maler(26, 22);
  m.form(M.oder(M.box(3, 12, 2, 10), M.box(21, 12, 2, 10)), RAMPE.metall);
  m.form(M.box(1, 10, 24, 4), RAMPE.holz, { tiefe: 1 });
  m.form(M.box(8, 1, 12, 10), RAMPE.metall, { tiefe: 1 });
  m.form(M.box(9, 2, 10, 7), [UMRISS, '#0e3a4a', '#13505e', '#1a6a78'], { licht: false });
  for (let x = 10; x < 18; x++) if ((x + (f ? 1 : 0)) % 3) m.punkt(x, 4, RAMPE.lazi[2]).punkt(x, 6, (x % 2) ? RAMPE.lazi[3] : RAMPE.lazi[1]);
  m.form(M.box(3, 8, 4, 3), RAMPE.rot, { licht: false });
  return m.leinwand();
}

// =====================================================================
// DIE LAZI-FABRIK: Drohnen, Wachroboter, Torsteuerung, der Vorarbeiter
// =====================================================================
// Drohne: runder Körper, zwei Rotorarme, ein Lazi-Auge. f: Rotor-Bild
function malDrohne(f) {
  const m = new Maler(22, 20);
  m.form(M.oder(M.kap(4, 8, 9, 10, 0.8), M.kap(18, 8, 13, 10, 0.8)), RAMPE.metall);
  const rotor = f ? [[1, 7, 7, 1], [15, 7, 7, 1]] : [[2, 6, 5, 1], [16, 8, 5, 1]];
  rotor.forEach(([x, y, w, h]) => m.form(M.box(x, y, w, h), [UMRISS, '#8a8898', '#b8b6c8', '#e0e0f0'], { licht: false }));
  m.form(M.ell(11, 11, 5, 4.5), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.ell(11, 11, 2.2, 2), [UMRISS, '#6a1a10', '#e0521c', '#ffd060'], { licht: false });
  m.punkt(11, 10, '#ffffff');
  m.form(M.oder(M.kap(9, 15, 8, 18, 0.5), M.kap(13, 15, 14, 18, 0.5)), RAMPE.metall);
  for (let x = 7; x < 16; x += 2) m.punkt(x, 14, '#e8c040');
  return m.leinwand();
}
// Wachroboter der Fabrik: zweibeinig, kastenförmig, rotes Visier, Nietenkanone am Arm. f: 0 stehen, 1/2 gehen
function malWachbot(f) {
  const m = new Maler(26, 36);
  const s = f === 1 ? 2 : f === 2 ? -2 : 0;
  m.form(M.oder(M.kap(10, 22, 9 - s, 34, 1.4), M.kap(16, 22, 17 + s, 34, 1.4)), RAMPE.metall);
  m.form(M.oder(M.box(6 - s, 33, 5, 3), M.box(15 + s, 33, 5, 3)), RAMPE.eisenDkl);
  m.form(M.box(6, 10, 14, 14), RAMPE.eisenDkl, { tiefe: 2 });
  for (let x = 7; x < 19; x++) m.punkt(x, 22, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  m.form(M.box(8, 3, 10, 8), RAMPE.metall, { tiefe: 1 });
  m.form(M.box(9, 6, 8, 2), [UMRISS, '#6a1010', '#d02020', '#ff6040'], { licht: false });
  m.punkt(11, 6, '#ffd0c0');
  m.form(M.kap(13, 3, 13, 0, 0.4), RAMPE.metall); m.punkt(13, 0, '#ff4040');
  // Nietenkanone rechts, Greifer links
  m.form(M.oder(M.box(19, 12, 6, 4), M.box(23, 13, 3, 2)), RAMPE.stahl, { tiefe: 1 });
  m.form(M.kap(6, 12, 2, 19, 1), RAMPE.metall);
  m.form(M.oder(M.kap(2, 19, 0, 22, 0.5), M.kap(2, 19, 4, 22, 0.5)), RAMPE.stahl);
  m.form(M.box(9, 13, 8, 5), [UMRISS, '#0e3a4a', '#13505e', '#1a6a78'], { licht: false });
  m.punkt(10, 15, RAMPE.lazi[3]).punkt(12, 15, RAMPE.lazi[2]).punkt(14, 15, RAMPE.lazi[3]);
  return m.leinwand();
}
// Torsteuerung: ein Schaltkasten mit Antennen neben dem Werkstor. stufe 0–2: heil bis kaputt
function malSchaltkasten(stufe) {
  const m = new Maler(28, 36), r = zufall(stufe + 410);
  m.form(M.box(2, 8, 24, 27), RAMPE.metall, { tiefe: 2 });
  for (let x = 3; x < 25; x++) m.punkt(x, 9, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  m.form(M.box(5, 12, 18, 10), [UMRISS, '#0e1a22', '#14262e', '#1e3440'], { licht: false });
  const an = stufe < 2 ? ['#5ff0e0', '#ff6040', '#ffe060'] : ['#1d1328', '#1d1328', '#3a3040'];
  [[7, 14], [11, 14], [15, 14], [19, 14], [7, 18], [11, 18], [15, 18], [19, 18]].forEach(([x, y], i) => m.punkt(x, y, an[i % 3]).punkt(x + 1, y, an[(i + 1) % 3]));
  m.form(M.oder(M.kap(7, 8, 5, 1, 0.5), M.kap(21, 8, 23, 2, 0.5)), RAMPE.metall);
  m.punkt(5, 1, stufe < 2 ? '#ff4040' : '#3a3040').punkt(23, 2, stufe < 2 ? '#5ff0e0' : '#3a3040');
  m.form(M.oder(M.box(6, 25, 6, 6), M.box(16, 25, 6, 6)), RAMPE.eisenDkl, { tiefe: 1 });
  if (stufe >= 1) for (let k = 0; k < 4 + stufe * 4; k++) { let x = 4 + r() * 20 | 0, y = 10 + r() * 22 | 0; for (let i = 0; i < 5; i++) { m.punkt(x, y, '#141018'); x += r() < 0.5 ? 1 : -1; y++; } }
  if (stufe >= 2) { m.form(M.poly([[2, 8], [12, 8], [6, 20]]), [UMRISS, '#05080c', '#0a0e14', '#10161e'], { licht: false }); m.punkt(14, 12, '#ffe060').punkt(15, 11, '#ffffff'); }
  return m.leinwand();
}
// Der Vorarbeiter: ein Koloss auf Ketten. Oben eine Anzeige, die ununterbrochen zählt.
// Vorn die Klappe zum Kern: zu (gepanzert) oder offen während der Inventur. f: 0/1 Bild
function malVorarbeiter(f, offen) {
  const m = new Maler(92, 98);
  // Ketten
  m.form(M.oder(M.box(10, 82, 30, 14), M.box(52, 82, 30, 14)), RAMPE.eisenDkl, { tiefe: 2 });
  for (let x = 12; x < 40; x += 4) m.punkt(x + (f ? 2 : 0), 84, RAMPE.metall[2]).punkt(x + 40 + (f ? 2 : 0), 84, RAMPE.metall[2]);
  // Rumpf mit Warnstreifen und Nieten
  m.form(M.box(14, 34, 64, 50), RAMPE.metall, { tiefe: 3, korn: 0.08 });
  for (let x = 15; x < 77; x++) m.punkt(x, 80, (x % 6 < 3) ? '#e8c040' : '#1d1328');
  for (let y = 38; y < 80; y += 6) m.punkt(17, y, RAMPE.stahl[3]).punkt(74, y, RAMPE.stahl[2]);
  // Kopf mit Zähler-Anzeige
  m.form(M.box(28, 6, 36, 26), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.box(31, 10, 30, 12), [UMRISS, '#1a0a06', '#2a120a', '#3a1a10'], { licht: false });
  const ziffer = (x, y, n, farbe) => {
    const seg = [[1, 1, 1, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1, 0], [1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1], [0, 1, 1, 1, 0, 1, 0], [1, 1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 1], [1, 0, 1, 0, 0, 1, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]][n];
    if (seg[0]) for (let i = 0; i < 4; i++) m.punkt(x + i, y, farbe);
    if (seg[1]) for (let i = 0; i < 3; i++) m.punkt(x, y + i, farbe);
    if (seg[2]) for (let i = 0; i < 3; i++) m.punkt(x + 3, y + i, farbe);
    if (seg[3]) for (let i = 0; i < 4; i++) m.punkt(x + i, y + 3, farbe);
    if (seg[4]) for (let i = 0; i < 3; i++) m.punkt(x, y + 4 + i, farbe);
    if (seg[5]) for (let i = 0; i < 3; i++) m.punkt(x + 3, y + 4 + i, farbe);
    if (seg[6]) for (let i = 0; i < 4; i++) m.punkt(x + i, y + 7, farbe);
  };
  const farbe = offen ? '#ff6040' : '#ffb030';
  (offen ? [0, 0, f ? 2 : 1, 7] : f ? [0, 4, 4, 7] : [0, 4, 4, 6]).forEach((n, i) => ziffer(34 + i * 6, 12, n, farbe));
  m.form(M.oder(M.kap(34, 6, 30, 0, 0.6), M.kap(58, 6, 62, 0, 0.6)), RAMPE.metall);
  m.punkt(30, 0, offen ? '#ff4040' : '#5ff0e0').punkt(62, 0, '#ffe060');
  // Kernklappe: zu oder offen mit glühendem Kern
  if (offen) {
    m.form(M.box(32, 44, 28, 26), [UMRISS, '#1a0a06', '#2a120a', '#3a1a10'], { licht: false });
    m.form(M.ell(46, 57, 9, 9), [UMRISS, '#6a1a10', '#e0521c', '#ffd060'], { licht: false });
    m.form(M.ell(46, 57, 4.5, 4.5), [UMRISS, '#ffb030', '#fff4a0', '#ffffff'], { licht: false });
    m.form(M.box(30, 36, 32, 8), RAMPE.stahl, { tiefe: 1 });
    for (let x = 33; x < 60; x += 5) m.punkt(x, 39, '#ff6040');
  } else {
    m.form(M.box(32, 44, 28, 26), RAMPE.stahl, { tiefe: 2 });
    for (let y = 46; y < 69; y += 5) m.punkt(34, y, RAMPE.metall[3]).punkt(57, y, RAMPE.metall[3]);
    m.form(M.box(40, 54, 12, 6), [UMRISS, '#3a3020', '#5a4a30', '#6a5a38'], { licht: false });
    m.punkt(44, 56, '#e8c040').punkt(47, 56, '#e8c040');
  }
  // Links der Stanzhammer, rechts die Nietenkanone
  m.form(M.kap(14, 44, 4, 62 - (f ? 3 : 0), 2.4), RAMPE.metall);
  m.form(M.box(0, 60 - (f ? 3 : 0), 12, 10), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.kap(78, 44, 86, 54, 2.2), RAMPE.metall);
  m.form(M.oder(M.box(80, 52, 12, 7), M.box(88, 54, 4, 3)), RAMPE.stahl, { tiefe: 1 });
  m.punkt(91, 55, f ? '#ffe060' : '#ff6040');
  return m.leinwand();
}
// Altmetall-Sammelstelle im Dorf: ein Hof mit Schrotthaufen, Waage und einem kleinen Kran. stufe 1–3
function malAltmetall(stufe) {
  const m = new Maler(52, 40), r = zufall(stufe + 430);
  m.form(M.box(1, 24, 50, 15), [UMRISS, '#3a3628', '#46402e', '#524a36'], { licht: false });
  for (let x = 2; x < 50; x += 4) m.form(M.box(x, 22, 1, 6), RAMPE.holz, { licht: false });
  m.form(M.box(1, 22, 50, 1), RAMPE.holz, { licht: false });
  const haufen = (cx, cy, w, h) => {
    m.form(M.poly([[cx - w, cy], [cx - w * 0.4, cy - h], [cx + w * 0.3, cy - h * 0.8], [cx + w, cy]]), RAMPE.rost, { tiefe: 2 });
    for (let k = 0; k < w * 2; k++) m.punkt(cx - w + 2 + r() * (w * 2 - 4) | 0, cy - 1 - r() * h * 0.7 | 0, r() < 0.5 ? RAMPE.metall[2] : RAMPE.rost[3]);
    m.form(M.kap(cx - w * 0.6, cy - h * 0.5, cx + w * 0.2, cy - h * 0.7, 0.6), RAMPE.metall);
  };
  haufen(12, 34, 10, 10); haufen(28, 35, 8, 8);
  if (stufe >= 2) haufen(41, 34, 8, 11);
  // Waage mit Lazi-Anzeige
  m.form(M.box(20, 30, 12, 4), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.box(22, 22, 6, 6), RAMPE.metall); m.form(M.box(23, 23, 4, 3), [UMRISS, '#0e3a4a', '#13505e', '#5ff0e0'], { licht: false });
  if (stufe >= 2) {
    // Kran mit Haken
    m.form(M.box(44, 4, 3, 26), RAMPE.gelb, { tiefe: 1 });
    m.form(M.box(26, 4, 21, 3), RAMPE.gelb, { tiefe: 1 });
    m.form(M.kap(30, 7, 30, 15, 0.3), RAMPE.metall);
    m.form(M.oder(M.box(28, 15, 5, 2), M.box(28, 15, 1, 4)), RAMPE.stahl);
  }
  if (stufe >= 3) { m.form(M.box(2, 10, 12, 12), RAMPE.metall, { tiefe: 2 }); m.form(M.box(4, 12, 8, 4), [UMRISS, '#0e3a4a', '#13505e', '#1a6a78'], { licht: false }); m.punkt(6, 13, RAMPE.lazi[3]).punkt(9, 13, RAMPE.lazi[2]); m.form(M.box(5, 18, 6, 4), RAMPE.eisenDkl); }
  return m.leinwand();
}

// =====================================================================
// NEUE GEBÄUDE (Epoche 1 bis 4)
// =====================================================================
const GLAS = [UMRISS, '#3a6a78', '#7ab8c8', '#d0f0f8'];
const FENSTER_WARM = [RAMPE.holz[0], '#e08a30', '#ffc860', '#fff0a0'];
// Fischerhütte am Bach: Holzhütte auf Pfählen, Steg, Reuse, Netze. stufe 3: Räucherofen
function malFischerhuette(stufe) {
  const m = new Maler(40, 40);
  m.form(M.oder(M.ell(10, 36, 10, 3.5), M.box(0, 34, 22, 6)), ['#1e3a5a', '#24466a', '#3a6a98', '#78a8d8'], { licht: false });
  m.form(M.oder(M.box(4, 30, 2, 8), M.box(14, 30, 2, 8), M.box(24, 30, 2, 8)), RAMPE.holz);
  m.form(M.box(2, 29, 26, 3), RAMPE.holz, { tiefe: 1 });
  m.form(M.box(14, 16, 22, 15), RAMPE.holz, { tiefe: 2 });
  for (let x = 17; x < 36; x += 4) m.form(M.box(x, 17, 1, 13), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.box(22, 22, 6, 9), RAMPE.lederDkl);
  m.form(M.box(30, 20, 4, 4), FENSTER_WARM);
  m.form(M.poly([[11, 18], [25, 6], [39, 18]]), RAMPE.stroh, { tiefe: 2 });
  // Netz zum Trocknen und eine Reuse
  for (let x = 2; x < 12; x += 2) for (let y = 18; y < 28; y += 2) m.punkt(x + (y % 4 ? 1 : 0), y, '#c8b890');
  m.form(M.kap(1, 17, 12, 17, 0.5), RAMPE.holz);
  m.form(M.ell(8, 36, 3, 2), RAMPE.stroh);
  if (stufe >= 2) m.form(M.box(26, 33, 14, 2), RAMPE.holz);
  if (stufe >= 3) { m.form(M.box(32, 2, 5, 12), RAMPE.stein, { tiefe: 1 }); m.punkt(33, 0, '#8a8898').punkt(35, 1, '#6a6878'); }
  return m.leinwand();
}
// Kräutergarten: Beete mit Kräutern in Reihen, ein Zaun, eine Gießkanne. 2 x 1
function malKraeutergarten(stufe) {
  const m = new Maler(40, 24), r = zufall(stufe + 450);
  m.form(M.box(1, 8, 38, 15), [UMRISS, '#3a2a1c', '#4a3624', '#5a4430'], { licht: false });
  const kraut = [['#2a4a1e', '#4a7a2e', '#7aaa44'], ['#2a3a4a', '#5a7a5a', '#a0c0a0'], ['#3a4a1a', '#6a8a2a', '#d0c040']];
  for (let row = 0; row < 3; row++) for (let x = 3; x < 37; x += 3) {
    const k = kraut[(row + stufe) % 3], y = 11 + row * 4;
    m.punkt(x, y, k[0]).punkt(x + 1, y - 1, k[1]).punkt(x, y - 1, k[2]);
    if (r() < 0.25) m.punkt(x + 1, y - 2, row === 2 ? '#ffe060' : '#e0e0ff');
  }
  for (let x = 0; x < 40; x += 3) m.form(M.box(x, 6, 1, 5), RAMPE.holz, { licht: false });
  m.form(M.box(0, 7, 40, 1), RAMPE.holz, { licht: false });
  m.form(M.oder(M.box(32, 15, 5, 5), M.kap(37, 16, 39, 13, 0.5)), RAMPE.metall);
  if (stufe >= 2) { m.form(M.box(2, 1, 8, 7), RAMPE.holz, { tiefe: 1 }); m.form(M.poly([[1, 2], [6, -1], [11, 2]]), RAMPE.ziegel); }
  return m.leinwand();
}
// Späherposten: Hochsitz aus Stämmen mit Leiter und Fähnchen. stufe 2: Späherturm aus Stein unten
function malSpaeherposten(stufe) {
  const m = new Maler(34, 48);
  if (stufe >= 2) m.form(M.box(8, 30, 18, 17), RAMPE.stein, { tiefe: 2 });
  m.form(M.oder(M.kap(9, 47, 12, 14, 1.2), M.kap(25, 47, 22, 14, 1.2)), RAMPE.holz);
  m.form(M.oder(M.kap(10, 38, 24, 30, 0.6), M.kap(24, 38, 10, 30, 0.6)), RAMPE.holz, { licht: false });
  for (let y = 18; y < 46; y += 4) m.form(M.box(27, y, 5, 1), RAMPE.holz, { licht: false });
  m.form(M.oder(M.box(27, 16, 1, 30), M.box(31, 16, 1, 30)), RAMPE.holz, { licht: false });
  m.form(M.box(8, 10, 18, 6), RAMPE.holz, { tiefe: 1 });
  m.form(M.poly([[6, 10], [17, 2], [28, 10]]), RAMPE.stroh, { tiefe: 1 });
  m.form(M.box(14, 11, 6, 3), [UMRISS, '#14141c', '#1e1e28', '#2a2a36'], { licht: false });
  m.punkt(17, 12, '#ffe0a0');
  m.form(M.kap(26, 10, 26, 0, 0.4), RAMPE.holz); m.form(M.poly([[26, 0], [33, 2], [26, 4]]), RAMPE.blau);
  return m.leinwand();
}
// Rathaus: Steinhaus mit Säulen, Treppe, Fahne. stufe 2: Uhrturm, stufe 3: Kuppel
function malRathaus(stufe) {
  const m = new Maler(52, 48);
  m.form(M.box(4, 22, 44, 24), RAMPE.putz, { tiefe: 2 });
  m.form(M.box(2, 44, 48, 3), RAMPE.stein);
  [8, 16, 34, 42].forEach(x => m.form(M.box(x, 24, 3, 20), RAMPE.stein, { tiefe: 1 }));
  m.form(M.box(21, 30, 10, 14), RAMPE.holz, { tiefe: 1 }); m.punkt(29, 37, RAMPE.gold[2]);
  [12, 38].forEach(x => m.form(M.box(x - 1, 27, 4, 6), FENSTER_WARM));
  m.form(M.poly([[1, 23], [26, 10], [51, 23]]), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.ell(26, 18, 3.5, 3.5), RAMPE.gold);
  if (stufe >= 2) {
    m.form(M.box(21, 2, 10, 14), RAMPE.stein, { tiefe: 1 });
    m.form(M.ell(26, 7, 3.4, 3.4), RAMPE.putz); m.form(M.kap(26, 7, 26, 4.5, 0.3), RAMPE.eisenDkl); m.form(M.kap(26, 7, 28, 7, 0.3), RAMPE.eisenDkl);
    m.form(M.poly([[20, 2], [26, -2], [32, 2]]), RAMPE.ziegel);
  }
  if (stufe >= 3) { m.form(M.oder(M.box(6, 46, 40, 2)), RAMPE.gold, { licht: false }); m.form(M.kap(44, 22, 44, 8, 0.5), RAMPE.holz); m.form(M.poly([[44, 8], [51, 10], [44, 12]]), RAMPE.rot); }
  return m.leinwand();
}
// Bäckerei: Fachwerk, großer Ofen mit Glut, Brezel als Schild. f: Rauch
function malBaeckerei(f) {
  const m = new Maler(40, 42);
  m.form(M.box(4, 18, 32, 22), RAMPE.putz, { tiefe: 2 });
  m.form(M.oder(M.box(4, 18, 32, 2), M.box(4, 28, 32, 1), M.box(4, 18, 2, 22), M.box(34, 18, 2, 22)), RAMPE.holz, { licht: false });
  m.form(M.box(8, 29, 10, 10), RAMPE.ziegel, { tiefe: 1 });
  m.form(M.ell(13, 35, 3.5, 3), ['#6a1a10', '#e0521c', '#ffb030', '#fff4a0'], { licht: false });
  m.form(M.box(23, 28, 7, 11), RAMPE.holz); m.form(M.box(29, 21, 5, 5), FENSTER_WARM);
  m.form(M.poly([[1, 20], [20, 4], [39, 20]]), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.box(28, 4, 5, 12), RAMPE.ziegel);
  if (f) { m.punkt(30, 1, '#b8b6c8').punkt(31, 0, '#8a8898'); }
  // Brezel-Schild
  m.form(M.kap(36, 22, 40, 22, 0.5), RAMPE.eisenDkl);
  m.form(M.oder(M.ell(37, 26, 2, 2), M.ell(40, 26, 2, 2)), [UMRISS, '#6a3a10', '#c07a2a', '#e8b060'], { licht: false });
  m.form(M.oder(M.ell(10, 40, 3, 1.5), M.ell(16, 41, 3, 1.5)), RAMPE.sack);
  return m.leinwand();
}
// Archiv: Steinbau mit hohen Fenstern, Bücherstapel im Fenster, Lampe an der Tür
function malArchiv(stufe) {
  const m = new Maler(40, 44);
  m.form(M.box(4, 14, 32, 28), RAMPE.stein, { tiefe: 2 });
  for (let y = 16; y < 40; y += 4) m.form(M.box(4, y, 32, 1), [RAMPE.stein[0], RAMPE.stein[1], RAMPE.stein[1], RAMPE.stein[1]], { licht: false, kante: false });
  [8, 28].forEach(x => { m.form(M.oder(M.box(x, 20, 5, 10), M.ell(x + 2.5, 20, 2.5, 2.5)), FENSTER_WARM); m.form(M.box(x + 1, 27, 3, 2), RAMPE.rot, { licht: false }); });
  m.form(M.oder(M.box(16, 28, 8, 14), M.ell(20, 28, 4, 4)), RAMPE.holz, { tiefe: 1 });
  m.form(M.poly([[1, 15], [20, 3], [39, 15]]), RAMPE.metall, { tiefe: 2 });
  m.punkt(25, 26, '#ffe060').punkt(25, 27, '#ffc860');
  if (stufe >= 2) { m.form(M.box(16, 4, 8, 6), RAMPE.stein); m.form(M.ell(20, 7, 2, 2), FENSTER_WARM); }
  return m.leinwand();
}
// Lastläufer-Depot: offene Halle mit Rampe, zwei Lastläufer stehen darin
function malDepot(stufe) {
  const m = new Maler(52, 40);
  m.form(M.box(2, 26, 48, 13), [UMRISS, '#3a3846', '#4a4858', '#5a5868'], { tiefe: 1 });
  m.form(M.oder(M.box(4, 10, 3, 18), M.box(45, 10, 3, 18), M.box(24, 10, 3, 18)), RAMPE.metall);
  m.form(M.poly([[1, 12], [26, 2], [51, 12], [51, 14], [1, 14]]), RAMPE.metall, { tiefe: 2 });
  for (let x = 4; x < 50; x += 5) m.punkt(x, 13, (x % 10 < 5) ? '#e8c040' : '#1d1328');
  const lauf = (x) => {
    m.form(M.oder(M.kap(x + 2, 28, x, 36, 1), M.kap(x + 8, 28, x + 10, 36, 1)), RAMPE.metall);
    m.form(M.ell(x + 5, 25, 7, 4.5), RAMPE.rost, { tiefe: 2 });
    m.form(M.ell(x + 11, 21, 2.6, 2.2), RAMPE.metall); m.punkt(x + 12, 21, RAMPE.lazi[3]);
  };
  lauf(8); if (stufe >= 2) lauf(30);
  m.form(M.oder(M.box(34, 30, 6, 6), M.box(41, 31, 6, 5)), RAMPE.holz, { tiefe: 1 });
  return m.leinwand();
}
// Ladestation: Schaltkasten mit Kabeln und leuchtenden Zellen. f: -1 aus, 0/1 an
function malLadestation(f) {
  const m = new Maler(40, 42), an = f >= 0;
  m.form(M.box(6, 20, 28, 20), RAMPE.metall, { tiefe: 2 });
  for (let x = 7; x < 33; x++) m.punkt(x, 21, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  [10, 17, 24].forEach((x, i) => {
    m.form(M.box(x, 25, 5, 11), [UMRISS, '#14262e', '#1e3440', '#2a4a58'], { licht: false });
    const voll = an ? (f + i) % 3 + 1 : 0;
    for (let k = 0; k < 4; k++) m.form(M.box(x + 1, 34 - k * 2, 3, 1), k < voll + 1 && an ? [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8'] : [UMRISS, '#1d1328', '#2a2230', '#2a2230'], { licht: false });
  });
  m.form(M.oder(M.kap(34, 30, 39, 36, 0.8), M.kap(6, 30, 1, 38, 0.8)), RAMPE.eisenDkl);
  m.form(M.box(12, 6, 16, 14), RAMPE.eisenDkl, { tiefe: 2 });
  m.form(M.poly([[20, 8], [16, 14], [19, 14], [17, 19], [23, 12], [20, 12], [22, 8]]), an ? RAMPE.gelb : [UMRISS, '#3a3040', '#4a4050', '#5a5060'], { licht: false });
  return m.leinwand();
}
// Gewächshaus: Glasdach auf Metallrahmen, drinnen grüne Reihen und Lazi-Lampen. f: -1 ohne Strom
function malGewaechshaus(f) {
  const m = new Maler(52, 38), an = f >= 0;
  m.form(M.box(2, 14, 48, 23), RAMPE.metall, { tiefe: 1 });
  m.form(M.box(4, 16, 44, 19), [UMRISS, '#1e3a2a', '#2a4a34', '#3a5a40'], { licht: false });
  for (let row = 0; row < 3; row++) for (let x = 6; x < 46; x += 3) { const y = 21 + row * 5; m.punkt(x, y, '#3a7a2e').punkt(x + 1, y - 1, '#7aaa44').punkt(x, y - 1, row === 1 ? '#e04030' : '#5a9a3a'); }
  m.form(M.poly([[1, 15], [10, 4], [42, 4], [51, 15]]), GLAS, { licht: false });
  for (let x = 6; x < 48; x += 6) m.form(M.kap(x, 15, x + (x < 26 ? 3 : -3), 5, 0.4), RAMPE.metall);
  m.form(M.box(9, 4, 34, 1), RAMPE.metall, { licht: false });
  if (an) [12, 26, 40].forEach(x => { m.punkt(x, 6, f ? '#e0fff8' : '#5ff0e0').punkt(x, 7, '#5ff0e0'); });
  m.form(M.box(22, 26, 8, 10), GLAS, { licht: false });
  return m.leinwand();
}
// Krankenstation: weißes Haus mit grünem Kreuz aus Kräutern, Betten im Fenster
function malKrankenstation(stufe) {
  const m = new Maler(40, 42);
  m.form(M.box(4, 16, 32, 24), ['#5a5868', '#c8c4d0', '#e0dce8', '#f4f0f8'], { tiefe: 2 });
  m.form(M.oder(M.box(17, 20, 6, 14), M.box(13, 24, 14, 6)), ['#1e4a1e', '#3a8a3a', '#5aba4a', '#9ae07a'], { licht: false });
  m.form(M.box(7, 22, 5, 5), FENSTER_WARM); m.form(M.box(28, 22, 5, 5), FENSTER_WARM);
  m.form(M.box(17, 33, 6, 7), RAMPE.holz);
  m.form(M.poly([[1, 17], [20, 4], [39, 17]]), RAMPE.ziegel, { tiefe: 2 });
  m.form(M.oder(M.ell(4, 40, 3, 1.6), M.ell(36, 40, 3, 1.6)), ['#2a4a1e', '#4a7a2e', '#7aaa44', '#c0e070']);
  if (stufe >= 2) { m.form(M.box(28, 6, 8, 10), ['#5a5868', '#c8c4d0', '#e0dce8', '#f4f0f8'], { tiefe: 1 }); m.form(M.box(30, 8, 4, 4), FENSTER_WARM); }
  return m.leinwand();
}
// Bunker-Funkstelle: Betonhäuschen mit großer Antenne, grünes Licht. f: -1 ohne Strom
function malBunkerfunk(f) {
  const m = new Maler(40, 52), an = f >= 0;
  m.form(M.box(6, 30, 28, 20), RAMPE.beton, { tiefe: 2 });
  m.form(M.box(16, 38, 8, 12), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.ell(20, 34, 2, 2), an ? ['#0a3a1a', '#1aa040', '#5ff080', '#e0ffe8'] : [UMRISS, '#1d1328', '#2a2230', '#3a3040'], { licht: false });
  m.form(M.oder(M.kap(20, 30, 14, 2, 0.6), M.kap(20, 30, 26, 2, 0.6), M.kap(17, 16, 23, 16, 0.4), M.kap(16, 9, 24, 9, 0.4)), RAMPE.metall);
  m.form(M.kap(20, 30, 20, 0, 0.6), RAMPE.metall);
  m.punkt(20, 0, an ? (f ? '#5ff080' : '#e0ffe8') : '#3a3040');
  for (let x = 7; x < 33; x++) m.punkt(x, 31, (x % 4 < 2) ? '#e8c040' : '#1d1328');
  m.form(M.ell(30, 44, 3, 3), RAMPE.metall); m.form(M.ell(30, 44, 1.5, 1.5), RAMPE.eisenDkl, { licht: false });
  return m.leinwand();
}
// Wohnblock: fünf Stockwerke, Fenster mit Licht (nur mit Strom). f: -1 ohne Strom
function malWohnblock(f) {
  const m = new Maler(40, 76), r = zufall(470), an = f >= 0;
  m.form(M.box(4, 6, 32, 68), RAMPE.beton, { tiefe: 3, korn: 0.08 });
  for (let y = 10; y < 66; y += 11) for (let x = 7; x < 33; x += 7) m.form(M.box(x, y, 5, 6), an && r() < 0.7 ? FENSTER_WARM : [UMRISS, '#10141e', '#161c2a', '#1e2638'], { licht: false });
  for (let y = 16; y < 70; y += 11) m.form(M.box(4, y, 32, 1), RAMPE.metall, { licht: false });
  m.form(M.box(16, 64, 8, 10), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.box(2, 3, 36, 4), RAMPE.metall, { tiefe: 1 });
  m.form(M.oder(M.box(8, 0, 3, 3), M.box(28, 0, 4, 3)), RAMPE.metall);
  for (let k = 0; k < 6; k++) m.punkt(5 + r() * 30 | 0, 10 + r() * 50 | 0, '#4a6a3a');
  return m.leinwand();
}
// Montagehalle: Sägezahndach, Rolltor, ein Kran mit Bauteil. f: -1 ohne Strom
function malMontagehalle(f) {
  const m = new Maler(52, 42), an = f >= 0;
  m.form(M.box(2, 16, 48, 25), RAMPE.metall, { tiefe: 2 });
  for (let i = 0; i < 4; i++) m.form(M.poly([[2 + i * 12, 16], [2 + i * 12, 6], [14 + i * 12, 16]]), RAMPE.eisenDkl, { tiefe: 1 });
  for (let i = 0; i < 4; i++) m.form(M.box(3 + i * 12, 8, 2, 7), an ? GLAS : [UMRISS, '#10141e', '#161c2a', '#1e2638'], { licht: false });
  m.form(M.box(18, 24, 16, 17), [UMRISS, '#3a3846', '#4a4858', '#5a5868'], { licht: false });
  for (let y = 25; y < 41; y += 2) m.form(M.box(18, y, 16, 1), RAMPE.metall, { licht: false });
  for (let x = 3; x < 49; x++) m.punkt(x, 17, (x % 6 < 3) ? '#e8c040' : '#1d1328');
  m.form(M.oder(M.box(4, 30, 10, 8), M.box(38, 30, 10, 8)), [UMRISS, '#14262e', '#1e3440', an ? '#5ff0e0' : '#2a4a58'], { licht: false });
  m.form(M.box(40, 0, 3, 16), RAMPE.gelb, { tiefe: 1 }); m.form(M.box(30, 0, 13, 2), RAMPE.gelb);
  m.form(M.kap(32, 2, 32, 6, 0.3), RAMPE.metall); m.form(M.box(30, 6, 5, 3), RAMPE.stahl, { tiefe: 1 });
  return m.leinwand();
}
// Roboter-Garage: Wellblech, offenes Tor, darin blaue Wartungsroboter
function malRobotergarage(stufe) {
  const m = new Maler(40, 36);
  m.form(M.box(2, 10, 36, 25), RAMPE.metall, { tiefe: 2 });
  for (let x = 3; x < 38; x += 2) m.form(M.box(x, 11, 1, 23), [RAMPE.metall[0], RAMPE.metall[1], RAMPE.metall[1], RAMPE.metall[1]], { licht: false, kante: false });
  m.form(M.oder(M.ell(20, 10, 19, 6), M.box(1, 10, 38, 2)), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(8, 17, 24, 17), [UMRISS, '#14141c', '#1e1e28', '#2a2a36'], { licht: false });
  const bot = x => { m.form(M.ell(x, 29, 4, 3.5), RAMPE.blau, { tiefe: 1 }); m.form(M.ell(x, 27, 2, 1.5), [UMRISS, '#0e3a4a', '#1aa0a8', '#5ff0e0'], { licht: false }); m.form(M.oder(M.kap(x - 3, 31, x - 4, 34, 0.5), M.kap(x + 3, 31, x + 4, 34, 0.5)), RAMPE.metall); };
  bot(15); if (stufe >= 2) bot(25);
  m.form(M.box(8, 17, 24, 2), RAMPE.gelb, { licht: false });
  return m.leinwand();
}
// Signalturm: Gittermast mit Schüsseln, oben ein pulsierendes Licht. f: -1 ohne Strom
function malSignalturm(f) {
  const m = new Maler(36, 74), an = f >= 0;
  m.form(M.oder(M.kap(8, 72, 16, 8, 1), M.kap(28, 72, 20, 8, 1)), RAMPE.metall);
  for (let y = 14; y < 70; y += 7) { const w = 4 + (y - 8) * 0.12; m.form(M.oder(M.kap(18 - w, y, 18 + w, y + 7, 0.4), M.kap(18 + w, y, 18 - w, y + 7, 0.4)), RAMPE.metall, { licht: false }); }
  m.form(M.box(6, 68, 24, 5), RAMPE.beton, { tiefe: 1 });
  m.form(M.oder(M.ell(10, 26, 5, 6), M.ell(27, 40, 5, 6)), RAMPE.putz, { tiefe: 1 });
  m.form(M.oder(M.ell(10, 26, 2, 2.5), M.ell(27, 40, 2, 2.5)), RAMPE.metall, { licht: false });
  m.form(M.kap(18, 8, 18, 0, 0.6), RAMPE.metall);
  m.form(M.ell(18, 2, 2.2, 2.2), an ? (f ? ['#0a3a3a', '#1aa0a8', '#5ff0e0', '#ffffff'] : ['#0a3a3a', '#1aa0a8', '#3ac0c8', '#9ff8ec']) : [UMRISS, '#1d1328', '#2a2230', '#3a3040'], { licht: false });
  return m.leinwand();
}

// =====================================================================
// MARKT VON ALTBRÜCK: Anschlagbretter, Bühne, Spielplatz, Ausschlachterei
// =====================================================================
// Anschlagbrett: schwarz (Marktaufträge) oder weiß (Geschichten, Gesuche). Zettel daran
function malBrett(weiss) {
  const m = new Maler(30, 34), r = zufall(weiss ? 501 : 502);
  m.form(M.oder(M.box(4, 14, 2, 20), M.box(24, 14, 2, 20)), RAMPE.holz);
  m.form(M.box(1, 1, 28, 18), RAMPE.holz, { tiefe: 2 });
  m.form(M.box(3, 3, 24, 14), weiss ? ['#5a5868', '#d8d4e0', '#ece8f0', '#ffffff'] : [UMRISS, '#1a1820', '#24222c', '#2e2c38'], { licht: false });
  for (let k = 0; k < 5; k++) {
    const x = 4 + r() * 18 | 0, y = 4 + r() * 8 | 0, w = 4 + r() * 3 | 0;
    m.form(M.box(x, y, w, 5), weiss ? [UMRISS, '#b8b090', '#e8e0c0', '#fff8e0'] : [UMRISS, '#c8b890', '#efe4c0', '#fff8e0'], { licht: false, kante: false });
    m.punkt(x + 1, y, '#d04040');
    for (let i = 1; i < w - 1; i++) m.punkt(x + i, y + 2, '#6a6070').punkt(x + i, y + 3, r() < 0.5 ? '#6a6070' : '#efe4c0');
  }
  m.form(M.poly([[0, 3], [15, -1], [30, 3]]), RAMPE.ziegel, { licht: false });
  return m.leinwand();
}
// Kleine Bühne aus Brettern mit Treppe und Fahnenmast
function malBuehne() {
  const m = new Maler(56, 30);
  m.form(M.box(2, 12, 52, 10), RAMPE.holz, { tiefe: 2 });
  for (let x = 4; x < 54; x += 6) m.form(M.box(x, 13, 1, 8), [RAMPE.holz[0], RAMPE.holz[1], RAMPE.holz[1], RAMPE.holz[1]], { licht: false, kante: false });
  m.form(M.oder(M.box(4, 22, 3, 7), M.box(49, 22, 3, 7)), RAMPE.holz);
  for (let i = 0; i < 3; i++) m.form(M.box(22 + i * 2, 22 + i * 2, 12 - i * 4, 2), RAMPE.holz, { licht: false });
  m.form(M.kap(50, 12, 50, 0, 0.5), RAMPE.holz); m.form(M.poly([[50, 0], [56, 2], [50, 5]]), RAMPE.blau);
  for (let x = 6; x < 46; x += 8) m.form(M.ell(x, 12, 3, 1.4), x % 16 ? RAMPE.rot : RAMPE.gelb, { licht: false });
  return m.leinwand();
}
// Schaukel und Wippe für die Kinder
function malSchaukel() {
  const m = new Maler(24, 28);
  m.form(M.oder(M.kap(3, 27, 7, 2, 0.8), M.kap(21, 27, 17, 2, 0.8), M.box(6, 1, 12, 2)), RAMPE.holz);
  m.form(M.oder(M.kap(10, 3, 10, 19, 0.3), M.kap(14, 3, 14, 19, 0.3)), RAMPE.metall, { licht: false });
  m.form(M.box(8, 19, 8, 2), RAMPE.rot);
  return m.leinwand();
}
function malWippe() {
  const m = new Maler(28, 14);
  m.form(M.poly([[11, 13], [14, 7], [17, 13]]), RAMPE.metall);
  m.form(M.kap(1, 11, 27, 5, 1), RAMPE.holz, { tiefe: 1 });
  m.form(M.oder(M.box(3, 6, 1, 4), M.box(25, 1, 1, 4)), RAMPE.metall);
  return m.leinwand();
}
// Ausschlachterei: Schrotthof mit Roboterteilen an Haken, Funken. stufe 1–2
function malAusschlachterei(stufe) {
  const m = new Maler(40, 40), r = zufall(stufe + 520);
  m.form(M.box(2, 24, 36, 15), [UMRISS, '#3a3228', '#4a4034', '#5a5040'], { licht: false });
  m.form(M.oder(M.box(4, 6, 2, 24), M.box(34, 6, 2, 24), M.box(4, 6, 32, 2)), RAMPE.eisenDkl, { tiefe: 1 });
  [10, 18, 26].forEach((x, i) => {
    m.form(M.kap(x, 8, x, 13, 0.3), RAMPE.metall);
    m.form(M.ell(x, 16, 3.5, 3), RAMPE.gelb, { tiefe: 1 });
    m.form(M.ell(x, 15, 1.6, 1.2), [UMRISS, '#1d1328', '#2a2230', '#3a3040'], { licht: false });
    if (i === 1 || stufe >= 2) m.form(M.oder(M.kap(x - 2, 18, x - 3, 22, 0.5), M.kap(x + 2, 18, x + 3, 22, 0.5)), RAMPE.metall);
  });
  m.form(M.poly([[6, 38], [10, 29], [16, 31], [20, 38]]), RAMPE.rost, { tiefe: 1 });
  for (let k = 0; k < 10; k++) m.punkt(7 + r() * 12 | 0, 31 + r() * 6 | 0, r() < 0.5 ? RAMPE.metall[2] : RAMPE.gelb[2]);
  m.form(M.box(24, 28, 12, 9), RAMPE.metall, { tiefe: 1 });
  m.form(M.poly([[29, 30], [27, 33], [29, 33], [28, 36], [32, 32], [30, 32], [31, 30]]), RAMPE.lazi, { licht: false });
  m.punkt(22, 26, '#ffffff').punkt(23, 25, '#ffe060');
  return m.leinwand();
}

// =====================================================================
// DEKO (Version 12): üppiger, wärmer, mehr Kleinkram
// =====================================================================
const BLUETEN = [
  ['#5a1830', '#b8385e', '#ec7a9a', '#ffd4e0'],   // Rosen
  ['#6a5a3a', '#d8c8a0', '#fff6e0', '#ffffff'],   // weiße Margeriten
  ['#6a4a08', '#d0a018', '#ffe050', '#fff8c0'],   // gelbe Ringelblumen
  ['#2a1a5a', '#5a40b0', '#9a80f0', '#e0d4ff'],   // Lavendel und Glockenblumen
  ['#6a1a10', '#d0401c', '#ff8040', '#ffd0a0'],   // Mohn
];
const LAUB = ['#0e2216', '#1e4426', '#36702e', '#6aa844'];
// Ein Büschel Blüten: 2x2 mit Glanzpunkt
function bluete(m, x, y, f) { m.punkt(x, y, f[2]).punkt(x + 1, y, f[1]).punkt(x, y + 1, f[1]).punkt(x + 1, y + 1, f[0]).punkt(x, y, f[3]); }
function blattTupfer(m, r, x0, y0, w, h, n) { for (let i = 0; i < n; i++) { const x = x0 + r() * w | 0, y = y0 + r() * h | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.5 ? LAUB[3] : LAUB[1]); } }

// Pflanzkasten aus Holz, randvoll mit Blumen (drei Sorten)
function malBlumenbeet(seed) {
  const r = zufall(seed * 31 + 40), m = new Maler(22, 20);
  const farben = seed === 1 ? [BLUETEN[0], BLUETEN[1]] : seed === 2 ? [BLUETEN[2], BLUETEN[1], BLUETEN[4]] : [BLUETEN[3], BLUETEN[0]];
  m.form(M.box(2, 12, 18, 7), RAMPE.holz, { tiefe: 1 });
  m.form(M.oder(M.box(2, 12, 2, 7), M.box(18, 12, 2, 7)), RAMPE.lederDkl, { licht: false });
  for (let x = 5; x < 18; x += 3) m.punkt(x, 15, RAMPE.holz[1]);
  m.form(M.box(2, 11, 18, 2), RAMPE.lederDkl);
  // Laub in drei Hügeln
  m.form(M.oder(M.ell(6, 9, 5, 4), M.ell(15, 8.5, 5.5, 4.5), M.ell(10.5, 6, 5, 4)), LAUB, { tiefe: 2 });
  blattTupfer(m, r, 2, 3, 18, 9, 10);
  // Blüten dicht an dicht
  for (let i = 0; i < 16; i++) {
    const x = 2 + r() * 17 | 0, y = 2 + r() * 9 | 0;
    if (!m.get(x, y + 1)) continue;
    bluete(m, x, y, farben[Math.floor(r() * farben.length)]);
  }
  // ein paar Ranken hängen über den Rand
  for (const x of [3, 9, 16]) { m.punkt(x, 13, LAUB[2]).punkt(x, 14, LAUB[1]); if (r() < 0.6) m.punkt(x + 1, 15, LAUB[2]); }
  return m.leinwand();
}

// Gartenbank mit Lehne, Armlehnen und einem Blumentopf daneben
function malBank() {
  const m = new Maler(28, 20);
  m.form(M.oder(M.box(3, 2, 2, 12), M.box(21, 2, 2, 12)), RAMPE.lederDkl);
  m.form(M.oder(M.box(2, 3, 22, 2), M.box(2, 6, 22, 2)), RAMPE.holz, { korn: 0.12 });
  m.form(M.box(1, 10, 24, 3), RAMPE.holz, { tiefe: 1, korn: 0.12 });
  m.form(M.oder(M.box(3, 13, 2, 6), M.box(21, 13, 2, 6)), RAMPE.lederDkl);
  m.form(M.oder(M.kap(1, 9, 4, 9, 0.8), M.kap(22, 9, 25, 9, 0.8)), RAMPE.lederDkl);
  // Topf mit Margeriten
  m.form(M.poly([[23, 14], [27.5, 14], [27, 19.5], [23.5, 19.5]]), RAMPE.ziegel);
  m.form(M.ell(25.2, 12, 2.6, 2.2), LAUB);
  bluete(m, 24, 11, BLUETEN[1]); m.punkt(26, 12, BLUETEN[2][2]);
  return m.leinwand();
}

// Ziehbrunnen aus Feldstein mit Schindeldach, Kurbel und Eimer
function malBrunnen() {
  const r = zufall(77), m = new Maler(38, 44);
  m.form(M.ell(19, 39, 18, 4.5), RAMPE.beton, { korn: 0.2 });
  m.form(M.oder(M.box(6, 7, 3, 22), M.box(29, 7, 3, 22)), RAMPE.holz, { tiefe: 1 });
  m.form(M.kap(6, 12, 33, 12, 1), RAMPE.lederDkl);
  m.form(M.oder(M.kap(33, 12, 36, 12, 0.6), M.kap(36, 12, 36, 15, 0.6)), RAMPE.metall);
  // Dach mit Schindelreihen
  m.form(M.poly([[0, 10], [19, 0], [38, 10], [35, 12.5], [3, 12.5]]), RAMPE.ziegel, { tiefe: 2 });
  for (let y = 4; y < 12; y += 3) for (let x = 2 + (y % 2) * 2; x < 37; x += 4) if (m.get(x, y)) m.punkt(x, y, RAMPE.ziegel[1]);
  m.form(M.kap(19, 1, 19, 1, 1.4), RAMPE.holz);
  // Seil und Eimer
  m.form(M.kap(19, 13, 19, 19, 0.45), RAMPE.sack, { licht: false });
  m.form(M.poly([[16.5, 19], [21.5, 19], [21, 24], [17, 24]]), RAMPE.holz);
  m.form(M.box(16.5, 20.5, 5, 1), RAMPE.metall, { licht: false });
  // Brunnenring aus Feldsteinen
  m.form(M.oder(M.box(5, 27, 28, 11), M.ell(19, 37, 14, 3.5)), RAMPE.stein, { tiefe: 2 });
  for (let y = 29; y < 38; y += 3) for (let x = 6 + ((y / 3) % 2) * 3; x < 32; x += 6) { m.punkt(x, y, RAMPE.stein[1]).punkt(x + 1, y, RAMPE.stein[1]); m.punkt(x + 3, y + 1, RAMPE.stein[3]); }
  m.form(M.ell(19, 27, 14.5, 3.6), RAMPE.stein);
  m.form(M.ell(19, 27, 11, 2.3), [UMRISS, '#10203a', '#1c3a60', '#2e5c90'], { licht: false });
  m.punkt(14, 27, '#8ac0ff').punkt(15, 27, '#5a90d8').punkt(23, 26, '#8ac0ff');
  // Moos, Gras und Blumen am Fuß
  for (let k = 0; k < 10; k++) m.punkt(6 + r() * 26 | 0, 34 + r() * 4 | 0, RAMPE.moos[2 + (r() < 0.5 ? 1 : 0)]);
  for (const [x, y] of [[3, 38], [33, 37], [8, 41], [29, 41]]) { m.punkt(x, y + 1, LAUB[2]).punkt(x + 1, y + 1, LAUB[1]); bluete(m, x, y - 1, BLUETEN[(x + y) % 5]); }
  return m.leinwand();
}

// Gusseiserne Laterne mit Glaskasten und Zierring
function malLaterne() {
  const m = new Maler(18, 50);
  m.form(M.poly([[4, 49], [13, 49], [11, 44], [6, 44]]), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.box(7.5, 12, 2, 33), RAMPE.eisenDkl);
  m.form(M.oder(M.ell(8.5, 30, 2.4, 1.2), M.ell(8.5, 43.5, 3, 1.2)), RAMPE.metall);
  // Querarm mit Schnörkel
  m.form(M.oder(M.kap(8.5, 12, 15, 12, 0.6), M.kap(8.5, 15, 12, 12, 0.5)), RAMPE.eisenDkl);
  m.form(M.kap(15, 12, 15, 14, 0.5), RAMPE.eisenDkl);
  // Laterne
  m.form(M.poly([[12, 14.5], [18, 14.5], [15, 12.5]]), RAMPE.eisenDkl);
  m.form(M.box(12.5, 15, 5, 7), RAMPE.eisenDkl, { licht: false });
  m.form(M.box(13.5, 16, 3, 5), RAMPE.gelb, { licht: false, kante: false });
  m.punkt(14, 17, RAMPE.gelb[3]).punkt(15, 18, '#ffffff');
  m.form(M.box(12, 22, 6, 1.5), RAMPE.eisenDkl);
  // eine zweite Laterne links, kleiner
  m.form(M.kap(8.5, 9, 3, 9, 0.5), RAMPE.eisenDkl);
  m.form(M.box(1, 10, 4, 5), RAMPE.eisenDkl, { licht: false });
  m.form(M.box(2, 11, 2, 3), RAMPE.gelb, { licht: false, kante: false });
  m.form(M.ell(8.5, 7, 1.6, 1.6), RAMPE.gold);
  return m.leinwand();
}

// Wimpelkette zwischen zwei Masten, bunt wie zum Fest
function malWimpelkette() {
  const m = new Maler(38, 34);
  m.form(M.oder(M.box(2, 4, 2, 29), M.box(34, 4, 2, 29)), RAMPE.holz);
  m.form(M.oder(M.ell(3, 4, 1.6, 1.6), M.ell(35, 4, 1.6, 1.6)), RAMPE.gold);
  m.form(M.oder(M.ell(3, 33, 3, 1), M.ell(35, 33, 3, 1)), RAMPE.stein);
  const farben = [RAMPE.rot, RAMPE.gelb, RAMPE.gruen, RAMPE.blau, RAMPE.violett];
  const seilY = x => 6 + 7 * (1 - ((x - 19) / 16) ** 2);
  for (let x = 4; x <= 34; x++) m.punkt(x, Math.round(seilY(x)), RAMPE.sack[1]);
  let i = 0;
  for (let x = 6; x <= 30; x += 4) {
    const y = Math.round(seilY(x + 1.5)) + 1, f = farben[i++ % farben.length];
    m.form(M.poly([[x - 0.5, y], [x + 3.9, y], [x + 1.7, y + 6]]), f, { licht: false });
    m.punkt(x + 1, y, f[3]);
  }
  return m.leinwand();
}

// Rosenbogen: ein Torbogen aus Laub und Blüten
function malRosenbogen() {
  const r = zufall(12), m = new Maler(38, 44);
  m.form(M.oder(M.box(3, 16, 4, 27), M.box(31, 16, 4, 27)), RAMPE.holz);
  const bogen = M.und(M.ohne(M.ell(19, 18, 18, 17), M.ell(19, 18, 12, 11.5)), (x, y) => y <= 18);
  m.form(M.oder(bogen, M.box(1, 17, 8, 24), M.box(29, 17, 8, 24)), LAUB, { tiefe: 2 });
  blattTupfer(m, r, 0, 0, 38, 42, 40);
  for (let i = 0; i < 34; i++) {
    const x = r() * 37 | 0, y = r() * 41 | 0;
    if (!m.get(x, y) || !m.get(x + 1, y + 1)) continue;
    bluete(m, x, y, i % 3 === 0 ? BLUETEN[1] : BLUETEN[0]);
  }
  m.form(M.oder(M.ell(5, 43, 4, 1), M.ell(33, 43, 4, 1)), RAMPE.lederDkl);
  return m.leinwand();
}

// Marktstand mit gestreiftem Dach und Obstkisten
// farbe: Tuch des Dachs (Standard rot). zu: zugenagelte Bude ohne Ware
function malMarktstand(farbe, zu) {
  const r = zufall(5), m = new Maler(40, 38), tuch = farbe || RAMPE.rot;
  m.form(M.oder(M.box(3, 10, 2, 27), M.box(35, 10, 2, 27)), RAMPE.holz);
  // gestreiftes Tuchdach
  const dach = M.poly([[0, 12], [3, 3], [37, 3], [40, 12]]);
  if (zu) {
    m.form(dach, [UMRISS, '#3a3228', '#4a4034', '#5a5040'], { tiefe: 2 });
    m.form(M.box(4, 13, 32, 22), RAMPE.holz, { tiefe: 1 });
    for (let y = 15; y < 34; y += 5) m.form(M.box(4, y, 32, 1), [RAMPE.holz[0], RAMPE.holz[0], RAMPE.holz[0], RAMPE.holz[0]], { licht: false, kante: false });
    m.form(M.oder(M.kap(5, 15, 35, 31, 0.8), M.kap(5, 31, 35, 15, 0.8)), RAMPE.holz);
    m.form(M.box(12, 20, 16, 7), RAMPE.putz, { licht: false });
    for (let x = 14; x < 26; x += 2) m.punkt(x, 23, '#3a3040');
    return m.leinwand();
  }
  m.form(dach, tuch, { tiefe: 2 });
  for (let x = 4; x < 38; x += 6) m.form(M.und(dach, M.poly([[x, 3], [x + 3, 3], [x + 3.6, 12], [x + 0.4, 12]])), RAMPE.putz, { licht: false, kante: false });
  for (let x = 0; x < 40; x += 4) m.form(M.ell(x + 2, 12.5, 2, 1.6), x % 8 ? RAMPE.putz : tuch, { licht: false });
  // Tisch mit weißem Tuch
  m.form(M.box(4, 24, 32, 3), RAMPE.putz, { tiefe: 1 });
  m.form(M.poly([[4, 26], [36, 26], [35, 33], [5, 33]]), RAMPE.putz, { licht: false });
  for (let x = 6; x < 35; x += 5) m.punkt(x, 32, RAMPE.putz[1]);
  // Kisten mit Äpfeln, Birnen, Kohl
  const ware = [['#4a0c10', '#a01c24', '#e0443a', '#ffa080'], ['#4a3a08', '#b09a20', '#e8d050', '#fff6a0'], ['#12301a', '#2e6a2a', '#5aa040', '#a8e070']];
  for (let k = 0; k < 3; k++) {
    const x0 = 6 + k * 10;
    m.form(M.box(x0, 18, 8, 6), RAMPE.holz, { tiefe: 1 });
    m.form(M.ell(x0 + 4, 18, 4, 2.2), ware[k]);
    for (let i = 0; i < 4; i++) m.punkt(x0 + 1 + r() * 6 | 0, 17 + r() * 2 | 0, ware[k][3]);
  }
  // Fass daneben
  m.form(M.oder(M.box(34, 27, 6, 10), M.ell(37, 27, 3, 1.2)), RAMPE.holz);
  m.form(M.oder(M.box(34, 29, 6, 1), M.box(34, 34, 6, 1)), RAMPE.metall, { licht: false });
  return m.leinwand();
}

// Fässer, Kisten und ein Mehlsack
function malFaesser(seed) {
  const r = zufall(seed + 90), m = new Maler(24, 24);
  m.form(M.oder(M.box(1, 9, 9, 14), M.ell(5.5, 9, 4.5, 1.8)), RAMPE.holz, { tiefe: 1, korn: 0.15 });
  m.form(M.oder(M.box(1, 12, 9, 1), M.box(1, 19, 9, 1)), RAMPE.metall, { licht: false });
  m.form(M.ell(5.5, 9, 3.5, 1.2), RAMPE.lederDkl, { licht: false });
  m.form(M.box(10, 13, 11, 10), RAMPE.holz, { tiefe: 1, korn: 0.15 });
  m.form(M.oder(M.kap(10.5, 13.5, 20.5, 22.5, 0.6), M.box(10, 13, 11, 1)), RAMPE.lederDkl, { licht: false });
  m.form(M.oder(M.box(12, 4, 8, 9), M.ell(16, 4, 4, 1.6)), RAMPE.holz, { tiefe: 1, korn: 0.15 });
  m.form(M.oder(M.box(12, 6, 8, 1), M.box(12, 10, 8, 1)), RAMPE.metall, { licht: false });
  m.form(M.oder(M.ell(20, 20, 3.4, 3.4), M.ell(20, 16.5, 2, 1.6)), RAMPE.sack);
  if (r() < 0.5) bluete(m, 4, 7, BLUETEN[2]);
  return m.leinwand();
}

// Handkarren voller Blumentöpfe
function malBlumenkarren() {
  const r = zufall(9), m = new Maler(40, 30);
  m.form(M.kap(30, 18, 39, 23, 0.8), RAMPE.holz);
  m.form(M.box(3, 13, 28, 9), RAMPE.holz, { tiefe: 1, korn: 0.15 });
  for (let x = 6; x < 30; x += 5) m.punkt(x, 17, RAMPE.holz[1]);
  m.form(M.oder(M.ell(11, 13, 7, 4.5), M.ell(23, 12, 7.5, 5)), LAUB, { tiefe: 2 });
  for (let i = 0; i < 16; i++) { const x = 4 + r() * 26 | 0, y = 7 + r() * 8 | 0; if (m.get(x, y + 1)) bluete(m, x, y, BLUETEN[i % 5]); }
  m.form(M.oder(M.ell(9, 24, 5, 5), M.ell(25, 24, 5, 5)), RAMPE.holz, { tiefe: 1 });
  m.form(M.oder(M.ell(9, 24, 1.4, 1.4), M.ell(25, 24, 1.4, 1.4)), RAMPE.metall);
  for (const [cx] of [[9], [25]]) for (let a = 0; a < 6; a++) m.punkt(cx + Math.round(Math.cos(a) * 3), 24 + Math.round(Math.sin(a) * 3), RAMPE.holz[1]);
  return m.leinwand();
}

// Zypresse: schlank, dunkel, mit Licht an der Kante
function malZypresse(seed) {
  const r = zufall(seed + 3), m = new Maler(16, 44);
  m.form(M.box(7, 38, 2, 5), RAMPE.lederDkl);
  m.form(M.oder(M.ell(8, 22, 6.5, 17), M.ell(8, 8, 3.5, 8)), RAMPE.nadel, { tiefe: 2 });
  for (let i = 0; i < 30; i++) { const x = 2 + r() * 12 | 0, y = 2 + r() * 36 | 0; if (m.get(x, y)) m.punkt(x, y, r() < 0.4 ? RAMPE.blatt[3] : RAMPE.nadel[1]); }
  m.form(M.ell(8, 43, 5, 1), RAMPE.lederDkl);
  return m.leinwand();
}

// =====================================================================
// ALTBRÜCK (5.6b): Stadthäuser, das Haus „Zur Waage“, die Gasse und die Unterwelt
// =====================================================================
const FASSADEN = [
  RAMPE.putz,
  ['#4a3010', '#a87a3a', '#d8a858', '#f0d090'],   // Ocker
  ['#4a2a2a', '#a86a6a', '#d89a8a', '#f4c8b8'],   // Rosa
  ['#262a3a', '#5a6a80', '#8a9ab0', '#c0cad8'],   // Blaugrau
  ['#1e2a22', '#4a6a52', '#7a9a7a', '#b0c8a8'],   // Salbei
  ['#3a1a14', '#7a3a2a', '#a8584a', '#d08068'],   // Backstein-Rot
];
const SCHIEFER = ['#141420', '#262838', '#3a3c50', '#565a70'];
const FENSTER_DUNKEL = [UMRISS, '#10141e', '#161c2a', '#242c3e'];
// Ein Fenster: hell, dunkel, mit Läden oder vernagelt
function stadtFenster(m, r, x, y, w, h) {
  const art = r();
  if (art < 0.18) {   // vernagelt
    m.form(M.box(x, y, w, h), FENSTER_DUNKEL, { licht: false });
    m.form(M.oder(M.kap(x, y + 1, x + w - 1, y + h - 2, 0.6), M.box(x, y + (h >> 1), w, 1)), RAMPE.holz, { licht: false });
    return;
  }
  m.form(M.box(x, y, w, h), art < 0.55 ? FENSTER_DUNKEL : FENSTER_WARM, { licht: false });
  m.form(M.oder(M.box(x + (w >> 1), y, 1, h), M.box(x, y + (h >> 1), w, 1)), RAMPE.holz, { licht: false, kante: false });
  if (art > 0.8) m.form(M.oder(M.box(x - 2, y, 2, h), M.box(x + w, y, 2, h)), RAMPE.gruen, { licht: false });
  if (r() < 0.35) { m.form(M.box(x - 1, y + h, w + 2, 2), RAMPE.holz, { licht: false }); for (let i = 0; i < w; i += 2) m.punkt(x + i, y + h - 1, r() < 0.5 ? BLUETEN[0][2] : BLUETEN[2][2]); }
}
// Ein Stadthaus an der Marktseite: zwei Stockwerke, unten ein Laden mit Markise
function malStadthaus(seed) {
  const r = zufall(seed * 13 + 700), m = new Maler(44, 62);
  const fassade = FASSADEN[seed % FASSADEN.length], dach = seed % 3 === 1 ? SCHIEFER : RAMPE.ziegel;
  const markise = [RAMPE.rot, RAMPE.gruen, RAMPE.blau, RAMPE.gelb][seed % 4];
  m.form(M.box(3, 16, 38, 45), fassade, { tiefe: 2 });
  if (seed % 2) for (let y = 19; y < 40; y += 10) m.form(M.box(3, y, 38, 1), RAMPE.holz, { licht: false, kante: false });
  m.form(M.box(2, 39, 40, 2), RAMPE.stein, { licht: false });
  [7, 19, 31].forEach(x => { stadtFenster(m, r, x, 20, 6, 7); stadtFenster(m, r, x, 30, 6, 7); });
  // Laden unten: Schaufenster, Tür, Markise
  m.form(M.box(6, 47, 18, 10), r() < 0.3 ? FENSTER_DUNKEL : FENSTER_WARM, { licht: false });
  for (let k = 0; k < 4; k++) m.punkt(8 + r() * 14 | 0, 54 + r() * 2 | 0, [RAMPE.gelb[2], RAMPE.rot[2], RAMPE.gruen[3]][k % 3]);
  m.form(M.box(28, 46, 8, 15), RAMPE.holz, { tiefe: 1 }); m.punkt(34, 53, RAMPE.gold[2]);
  const mk = M.poly([[4, 42], [40, 42], [42, 47], [2, 47]]);
  m.form(mk, markise, { tiefe: 1 });
  for (let x = 4; x < 42; x += 6) m.form(M.und(mk, M.box(x, 42, 3, 5)), RAMPE.putz, { licht: false, kante: false });
  // Dach: Giebel oder Treppengiebel
  if (seed % 4 === 3) {
    m.form(M.oder(M.box(3, 12, 38, 5), M.box(8, 7, 28, 5), M.box(14, 2, 16, 5)), fassade, { tiefe: 1 });
    m.form(M.box(19, 4, 6, 6), FENSTER_DUNKEL, { licht: false });
  } else {
    m.form(M.poly([[0, 18], [22, 1], [44, 18], [41, 19], [3, 19]]), dach, { tiefe: 2 });
    m.form(M.oder(M.box(18, 8, 8, 7), M.poly([[17, 8], [22, 4], [27, 8]])), fassade, { tiefe: 1 });
    m.form(M.box(20, 10, 4, 4), r() < 0.5 ? FENSTER_WARM : FENSTER_DUNKEL, { licht: false });
  }
  if (r() < 0.6) m.form(M.box(32, 3, 4, 9), RAMPE.ziegel);
  // dreihundert Jahre: Risse, Moos, Ranken
  for (let k = 0; k < 14; k++) m.punkt(4 + r() * 36 | 0, 17 + r() * 42 | 0, r() < 0.5 ? fassade[1] : RAMPE.moos[2]);
  if (r() < 0.6) { let x = r() < 0.5 ? 4 : 39; for (let y = 60; y > 30; y--) { m.punkt(x, y, r() < 0.6 ? RAMPE.blatt[2] : RAMPE.moos[3]); if (r() < 0.3) x += r() < 0.5 ? 1 : -1; } }
  return m.leinwand();
}
// Das Haus „Zur Waage“: dunkle Ziegel, Stahltür mit Guckloch, rote Lampe, Schild mit Waage
function malHausWaage(f) {
  const r = zufall(911), m = new Maler(56, 66), ziegel = ['#1e0e12', '#4a1a1e', '#6a2a2a', '#8a3e36'];
  m.form(M.box(3, 10, 50, 55), ziegel, { tiefe: 2 });
  for (let y = 13; y < 64; y += 4) { m.form(M.box(3, y, 50, 1), [ziegel[0], ziegel[0], ziegel[0], ziegel[0]], { licht: false, kante: false }); for (let x = (y % 8 ? 5 : 9); x < 52; x += 8) m.punkt(x, y + 1, ziegel[0]).punkt(x, y + 2, ziegel[0]); }
  m.form(M.box(1, 6, 54, 5), RAMPE.beton, { tiefe: 1 });
  // vergitterte Fenster, eines mit Licht
  [[8, 16], [24, 16], [40, 16], [8, 30], [40, 30]].forEach(([x, y], i) => {
    m.form(M.box(x, y, 8, 8), i === 1 ? FENSTER_WARM : FENSTER_DUNKEL, { licht: false });
    m.form(M.oder(M.box(x + 2, y, 1, 8), M.box(x + 5, y, 1, 8)), RAMPE.eisenDkl, { licht: false, kante: false });
  });
  // Stahltür mit Guckloch und Nieten
  m.form(M.box(21, 42, 14, 23), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(25, 46, 6, 2), f ? [UMRISS, '#e8c040', '#ffe070', '#fff8c0'] : FENSTER_DUNKEL, { licht: false });
  for (let y = 44; y < 64; y += 5) m.punkt(23, y, RAMPE.metall[3]).punkt(33, y, RAMPE.metall[3]);
  m.form(M.box(32, 54, 2, 2), RAMPE.gold, { licht: false });
  // rote Lampe
  m.form(M.kap(38, 40, 42, 40, 0.5), RAMPE.eisenDkl, { licht: false });
  m.form(M.ell(42, 43, 2.4, 2.6), f ? ['#5a0a10', '#e02030', '#ff5060', '#ffd0d0'] : ['#3a0a10', '#a01828', '#d03040', '#ff9090']);
  // Schild mit der Waage
  m.form(M.kap(8, 38, 16, 38, 0.5), RAMPE.eisenDkl, { licht: false });
  m.form(M.box(6, 39, 12, 9), RAMPE.holz, { tiefe: 1 });
  m.form(M.oder(M.box(11.5, 40, 1, 6), M.box(8, 41, 8, 1)), RAMPE.gold, { licht: false, kante: false });
  m.form(M.oder(M.ell(9, 44, 1.6, 0.8), M.ell(15, 44, 1.6, 0.8)), RAMPE.gold, { licht: false });
  // Plakate, Fässer, ein Kreidezeichen
  m.form(M.box(41, 50, 7, 9), RAMPE.putz, { licht: false }); m.form(M.box(42, 52, 5, 1), RAMPE.rot, { licht: false });
  m.form(M.oder(M.box(4, 56, 6, 9), M.ell(7, 56, 3, 1.2)), RAMPE.holz); m.form(M.box(4, 59, 6, 1), RAMPE.metall, { licht: false });
  m.form(M.kap(14, 58, 18, 54, 0.4), RAMPE.putz, { licht: false });
  for (let k = 0; k < 12; k++) m.punkt(4 + r() * 48 | 0, 12 + r() * 50 | 0, RAMPE.moos[2]);
  return m.leinwand();
}
// Der Stand des Hehlers: Plane, Kram, eine Laterne. Alles „gefunden“.
function malHehlerstand() {
  const r = zufall(913), m = new Maler(40, 36);
  m.form(M.oder(M.kap(4, 8, 4, 35, 0.8), M.kap(36, 8, 36, 35, 0.8)), RAMPE.holz);
  m.form(M.poly([[0, 10], [4, 4], [36, 4], [40, 10], [30, 13], [20, 11], [10, 13]]), RAMPE.tuch, { tiefe: 2 });
  m.form(M.box(5, 24, 30, 4), RAMPE.holz, { tiefe: 1 });
  m.form(M.poly([[5, 27], [35, 27], [34, 34], [6, 34]]), RAMPE.lumpen, { licht: false });
  // Ware: Zahnräder, Flaschen, eine Armbrust, ein glimmendes Lazi-Teil
  m.form(M.ell(10, 22, 3, 3), RAMPE.metall); m.punkt(10, 22, UMRISS);
  m.form(M.box(15, 18, 2, 6), ['#0a1a10', '#1a4a2a', '#2a7a3a', '#8ae08a']); m.form(M.box(18, 19, 2, 5), ['#2a0a0a', '#6a1a1a', '#a02a2a', '#e06a6a']);
  m.form(M.oder(M.kap(22, 23, 31, 20, 0.6), M.kap(26, 18, 27, 25, 0.5)), RAMPE.holz, { licht: false });
  m.form(M.ell(32, 22, 1.6, 1.6), RAMPE.lazi, { licht: false }); m.punkt(32, 21, '#ffffff');
  m.form(M.kap(20, 4, 20, 9, 0.3), RAMPE.eisenDkl, { licht: false }); m.form(M.box(18.5, 9, 3, 3), RAMPE.gelb, { licht: false });
  for (let k = 0; k < 6; k++) m.punkt(7 + r() * 26 | 0, 29 + r() * 4 | 0, RAMPE.lumpen[3]);
  return m.leinwand();
}
// Figuren der Gasse: Hehler, Informantin, Türsteher
function malGassenfigur(art) {
  if (art === 'tuersteher') {
    const m = new Maler(26, 34);
    m.form(M.oder(M.box(7, 22, 5, 10), M.box(14, 22, 5, 10)), RAMPE.hose);
    m.form(M.oder(M.box(6, 31, 6, 3), M.box(14, 31, 6, 3)), RAMPE.eisenDkl);
    m.form(M.oder(M.ell(13, 13, 9, 3.5), M.poly([[4, 13], [22, 13], [20, 24], [6, 24]])), RAMPE.mantel, { tiefe: 2 });
    m.form(M.oder(M.kap(6, 17, 20, 17, 2.2)), RAMPE.mantel);   // verschränkte Arme
    m.form(M.oder(M.ell(7, 17, 1.6, 1.6), M.ell(19, 17, 1.6, 1.6)), RAMPE.haut, { licht: false });
    m.form(M.box(11, 8, 5, 4), RAMPE.haut);
    m.form(M.ell(13.5, 5.5, 4, 4.2), RAMPE.haut);
    m.form(M.box(10, 4.5, 8, 1.5), [UMRISS, '#141018', '#141018', '#2a2a34'], { licht: false });   // Sonnenbrille aus Glas der Alten
    m.punkt(13, 8, RAMPE.haut[0]).punkt(14, 8, RAMPE.haut[0]);
    return m.leinwand();
  }
  const m = new Maler(20, 30);
  if (art === 'hehler') {
    m.form(M.oder(M.box(6, 22, 3, 7), M.box(11, 22, 3, 7)), RAMPE.lederDkl);
    m.form(M.oder(M.ell(10, 17, 7, 7), M.ell(10, 12, 5, 2.5)), ['#2a1a10', '#5a3a1a', '#7e5428', '#a87438'], { tiefe: 2 });
    m.form(M.box(8, 12, 4, 11), RAMPE.putz, { licht: false });
    m.form(M.kap(9, 15, 13, 18, 0.4), RAMPE.gold, { licht: false });   // Uhrkette
    m.form(M.ell(10.5, 7.5, 3.3, 3.4), RAMPE.haut);
    m.form(M.oder(M.box(6, 3, 9, 2), M.box(7.5, 0, 6, 3.5)), RAMPE.tuch, { tiefe: 1 });   // Melone
    m.form(M.ell(12, 7.5, 1.2, 1.2), RAMPE.lazi, { licht: false });   // Monokel
    m.form(M.box(9, 9.5, 4, 1), RAMPE.haar, { licht: false });
    return m.leinwand();
  }
  if (art === 'hanne') {
    // Hanne Kehl von den Rostbrechern: Schutzbrille, rostroter Schal, Brecheisen
    m.form(M.oder(M.kap(8, 20, 7, 28, 1.3), M.kap(12, 20, 13, 28, 1.3)), RAMPE.hose);
    m.form(M.box(5, 27, 4, 2), RAMPE.eisenDkl); m.form(M.box(11, 27, 4, 2), RAMPE.eisenDkl);
    m.form(M.poly([[5, 11], [15, 11], [14, 21], [6, 21]]), RAMPE.olive, { tiefe: 2 });
    m.form(M.box(6, 18, 8, 2), RAMPE.lederDkl, { licht: false });
    m.form(M.oder(M.box(5, 10, 10, 3), M.kap(6, 12, 4, 17, 0.9)), RAMPE.rost, { licht: false });
    m.form(M.ell(10, 6.5, 3.2, 3.3), RAMPE.haut);
    m.form(M.oder(M.ell(9.5, 4.2, 3.6, 2.2), M.kap(6.5, 4, 5.5, 9, 1)), RAMPE.haar, { tiefe: 1 });
    m.form(M.box(7, 5.5, 7, 2), [UMRISS, '#2a4a3a', '#4a8a6a', '#a8f0c8'], { licht: false });
    m.form(M.kap(16, 8, 14, 26, 0.7), RAMPE.rost); m.form(M.kap(16, 8, 18, 7, 0.6), RAMPE.rost);
    m.form(M.ell(14.5, 16, 1.4, 1.4), RAMPE.haut);
    return m.leinwand();
  }
  // Informantin „Die Elster“: schmal, langer Mantel, Schal, lehnt an der Wand
  m.form(M.oder(M.kap(9, 20, 8, 28, 1.2), M.kap(12, 20, 14, 28, 1.2)), RAMPE.hose);
  m.form(M.poly([[6, 11], [14, 11], [16, 27], [5, 27]]), RAMPE.fell, { tiefe: 2 });
  m.form(M.oder(M.box(6, 10, 9, 3), M.kap(14, 11, 15, 16, 0.8)), ['#101820', '#20304a', '#3a5a8a', '#e0e8f0'], { licht: false });   // Schal schwarz-weiß wie eine Elster
  m.form(M.ell(10, 6.5, 3, 3.2), RAMPE.haut);
  m.form(M.oder(M.ell(9.4, 5, 3.6, 3), M.poly([[6, 5], [5, 11], [8, 9]])), RAMPE.tuch, { tiefe: 1 });
  m.punkt(11, 6.5, UMRISS).punkt(12.5, 6.5, UMRISS);
  m.form(M.kap(14, 15, 17, 13, 0.6), RAMPE.fell); m.form(M.box(16, 11, 2, 2), RAMPE.putz, { licht: false });   // Zettel in der Hand
  return m.leinwand();
}
// Schläger des Waagmeisters. art: 'knueppel', 'messer', 'armbrust', 'leibwache'
function malSchlaeger(schritt, art) {
  const gross = art === 'leibwache', m = new Maler(gross ? 34 : 28, gross ? 42 : 36), s = schritt, Y = gross ? 6 : 3, k = gross ? 1.2 : 1;
  const weste = art === 'messer' ? RAMPE.rotDkl : art === 'armbrust' ? RAMPE.olive : gross ? RAMPE.eisenDkl : RAMPE.lederDkl;
  m.form(M.oder(M.kap(11 * k, 22 + Y, 11 * k - s * 0.6, 27 + Y, 2 * k), M.kap(11 * k - s * 0.6, 27 + Y, 11 * k - s, 31.5 + Y, 1.7 * k)), RAMPE.hose);
  m.form(M.box(9 * k - s, 31 + Y, 5 * k, 3), RAMPE.eisenDkl);
  m.form(M.oder(M.poly([[7.6 * k, 12 + Y], [18.6 * k, 12 + Y], [17.2 * k, 23 + Y], [9 * k, 23 + Y]]), M.ell(13.1 * k, 12.9 + Y, 5.8 * k, 2.4)), RAMPE.putz, { tiefe: 2 });
  m.form(M.oder(M.poly([[7.6 * k, 12.5 + Y], [11 * k, 12.5 + Y], [11 * k, 22 + Y], [9 * k, 22 + Y]]), M.poly([[15 * k, 12.5 + Y], [18.6 * k, 12.5 + Y], [17.2 * k, 22 + Y], [15 * k, 22 + Y]])), weste);
  m.form(M.oder(M.kap(15 * k, 22 + Y, 15 * k + s * 0.6, 27 + Y, 2.1 * k), M.kap(15 * k + s * 0.6, 27 + Y, 15 * k + s, 31.5 + Y, 1.8 * k)), RAMPE.hose);
  m.form(M.box(14 * k + s, 31 + Y, 6 * k, 3), RAMPE.eisenDkl);
  m.form(M.box(11.5 * k, 9 + Y, 4 * k, 3), RAMPE.haut);
  m.form(M.ell(13.4 * k, 6.5 + Y * 0.6, 4 * k, 4 * k), RAMPE.haut);
  // Schiebermütze
  m.form(M.oder(M.ell(13 * k, 3.8 + Y * 0.6, 4.6 * k, 2.2), M.box(13 * k, 4.4 + Y * 0.6, 6 * k, 1.4)), gross ? RAMPE.tuch : RAMPE.lumpen, { tiefe: 1 });
  m.punkt(15.5 * k, 7 + Y * 0.6, UMRISS).punkt(17 * k, 7 + Y * 0.6, UMRISS);
  if (art === 'messer') {
    m.form(M.box(10 * k, 11 + Y, 8, 2), RAMPE.rot, { licht: false });
    m.form(M.kap(18, 18 + Y, 23, 15 + Y, 0.5), RAMPE.stahl); m.form(M.ell(17.5, 18 + Y, 1.6, 1.6), RAMPE.haut);
  } else if (art === 'armbrust') {
    m.form(M.kap(14, 17 + Y, 25, 16 + Y, 1.1), RAMPE.holz);
    m.form(M.oder(M.kap(23, 11 + Y, 25, 16 + Y, 0.7), M.kap(25, 16 + Y, 23, 21 + Y, 0.7)), RAMPE.metall);
    m.form(M.ell(16, 18 + Y, 1.8, 1.8), RAMPE.haut);
  } else if (gross) {
    // ein Gewicht der großen Waage als Schild
    m.form(M.poly([[21, 14 + Y], [31, 14 + Y], [33, 28 + Y], [19, 28 + Y]]), RAMPE.gold, { tiefe: 2 });
    m.form(M.box(24, 10 + Y, 4, 4), RAMPE.gold, { licht: false });
    m.form(M.box(23, 20 + Y, 6, 1), RAMPE.gold[0] ? [RAMPE.gold[0], RAMPE.gold[0], RAMPE.gold[0], RAMPE.gold[0]] : RAMPE.gold, { licht: false, kante: false });
  } else {
    m.form(M.kap(17, 19 + Y, 23, 9 + Y, 1.1), RAMPE.holz); m.form(M.ell(23, 9 + Y, 1.6, 1.6), RAMPE.holz);
    m.form(M.ell(17, 19 + Y, 1.8, 1.8), RAMPE.haut);
  }
  return m.leinwand();
}
// Der Waagmeister: schwerer Mantel, Zylinder, ein großes Messinggewicht an der Kette. wankt: aus dem Gleichgewicht
function malWaagmeister(f, wankt, panzer) {
  const m = new Maler(46, 54), Y = 6, s = f ? 1.5 : -1.5, kipp = wankt ? 3 : 0;
  const rock = ['#1a0a10', '#4a1420', '#6e2030', '#94343e'];
  m.form(M.oder(M.kap(17, 34 + Y, 17 - s * 0.6, 41 + Y, 2.4), M.kap(17 - s * 0.6, 41 + Y, 17 - s, 46 + Y, 2)), RAMPE.hose);
  m.form(M.oder(M.kap(25, 34 + Y, 25 + s * 0.6, 41 + Y, 2.4), M.kap(25 + s * 0.6, 41 + Y, 25 + s, 46 + Y, 2)), RAMPE.hose);
  m.form(M.oder(M.box(13 - s, 45 + Y, 7, 3), M.box(23 + s, 45 + Y, 7, 3)), RAMPE.eisenDkl);
  m.form(M.oder(M.poly([[11 + kipp, 14 + Y], [31 + kipp, 14 + Y], [35, 38 + Y], [7, 38 + Y]]), M.ell(21 + kipp, 16 + Y, 11, 4)), rock, { tiefe: 2 });
  m.form(M.poly([[18 + kipp, 15 + Y], [24 + kipp, 15 + Y], [22, 30 + Y], [20, 30 + Y]]), RAMPE.putz, { licht: false });
  m.form(M.oder(M.kap(19 + kipp, 22 + Y, 27 + kipp, 26 + Y, 0.5), M.ell(27 + kipp, 26 + Y, 1.2, 1.2)), RAMPE.gold, { licht: false });   // Uhrkette
  // Kopf mit Backenbart und Zylinder
  m.form(M.box(18 + kipp, 10 + Y, 6, 5), RAMPE.haut);
  m.form(M.ell(21 + kipp, 7 + Y, 5, 5), RAMPE.haut);
  m.form(M.oder(M.ell(17 + kipp, 9 + Y, 2, 3), M.ell(25 + kipp, 9 + Y, 2, 3)), RAMPE.haar, { licht: false });
  m.punkt(19 + kipp, 6 + Y, UMRISS).punkt(23 + kipp, 6 + Y, UMRISS).punkt(21 + kipp, 10 + Y, RAMPE.haut[0]);
  m.form(M.oder(M.box(14 + kipp, 1.5 + Y, 14, 2), M.box(16 + kipp, -6 + Y, 10, 8)), RAMPE.tuch, { tiefe: 1 });
  m.form(M.box(16 + kipp, -1 + Y, 10, 1.5), RAMPE.rot, { licht: false });
  // Arm mit Kette und Gewicht
  m.form(M.kap(31 + kipp, 18 + Y, 36, 28 + Y, 2.2), rock);
  m.form(M.ell(36, 29 + Y, 2, 2), RAMPE.haut);
  for (let i = 0; i < 5; i++) m.form(M.ell(37 + i * 0.8, 31 + Y + i * 2, 0.9, 0.9), RAMPE.metall, { licht: false });
  m.form(M.oder(M.poly([[36, 41 + Y], [44, 41 + Y], [45, 47 + Y], [35, 47 + Y]]), M.box(38.5, 39 + Y, 3, 2)), RAMPE.gold, { tiefe: 1 });
  if (wankt) { m.punkt(18, Y - 8, '#ffe060').punkt(24, Y - 9, '#ffe060').punkt(30, Y - 7, '#ffe060'); }
  if (panzer) {
    // Rüstung aus Kernblech: Schulterplatten, Brustplatte mit türkisem Licht, ein Visier statt Zylinderband
    m.form(M.oder(M.ell(12, 16 + Y, 5, 3.4), M.ell(30, 16 + Y, 5, 3.4)), RAMPE.metall, { tiefe: 1 });
    m.form(M.poly([[14, 19 + Y], [28, 19 + Y], [26, 31 + Y], [16, 31 + Y]]), RAMPE.stahl, { tiefe: 2 });
    m.form(M.ell(21, 25 + Y, 2.2, 2.2), RAMPE.lazi, { licht: false });
    m.form(M.box(17, 5 + Y, 8, 2), [UMRISS, '#0e3a4a', '#1aa0a8', '#5ff0e0'], { licht: false });
  }
  return m.leinwand();
}
// Die große Waage im Lager: neigung -1, 0, 1
function malGrosseWaage(neigung) {
  const m = new Maler(56, 44), n = neigung * 5;
  m.form(M.oder(M.box(26, 8, 4, 32), M.poly([[18, 43], [38, 43], [32, 38], [24, 38]])), RAMPE.gold, { tiefe: 1 });
  m.form(M.kap(6, 10 + n, 50, 10 - n, 1), RAMPE.gold);
  m.form(M.ell(28, 8, 3, 3), RAMPE.gold);
  [[8, 10 + n], [48, 10 - n]].forEach(([x, y]) => {
    m.form(M.oder(M.kap(x, y, x - 5, y + 14, 0.35), M.kap(x, y, x + 5, y + 14, 0.35)), RAMPE.metall, { licht: false });
    m.form(M.ell(x, y + 15, 7, 2.2), RAMPE.gold, { tiefe: 1 });
  });
  return m.leinwand();
}

// =====================================================================
// DIE ROSTBRECHER (5.7b): Störsender und Sprengladungen
// =====================================================================
// Störsender: ein Mast aus Schrott, Schüsseln aus Autodächern, rote Lampe. stufe 1–2
function malStoersender(stufe) {
  const m = new Maler(36, 52), r = zufall(stufe + 930);
  m.form(M.box(3, 40, 30, 11), RAMPE.eisenDkl, { tiefe: 1 });
  m.form(M.box(6, 42, 9, 7), RAMPE.rost, { tiefe: 1 }); m.form(M.box(20, 43, 9, 7), RAMPE.metall, { tiefe: 1 });
  m.form(M.oder(M.kap(14, 40, 17, 4, 0.8), M.kap(22, 40, 19, 4, 0.8)), RAMPE.rost, { licht: false });
  for (let y = 10; y < 40; y += 6) m.form(M.kap(14 + (40 - y) * 0.08, y, 22 - (40 - y) * 0.08, y + 3, 0.4), RAMPE.rost, { licht: false });
  m.form(M.oder(M.ell(9, 16, 5, 3), M.ell(27, 22, 5, 3)), RAMPE.metall, { tiefe: 1 });
  m.form(M.oder(M.ell(9, 16, 2, 1), M.ell(27, 22, 2, 1)), RAMPE.eisenDkl, { licht: false });
  if (stufe >= 2) { m.form(M.ell(18, 30, 6, 3.4), RAMPE.metall, { tiefe: 1 }); m.form(M.kap(18, 8, 18, 0, 0.5), RAMPE.metall); }
  m.form(M.ell(18, 4, 2, 2), ['#5a0a10', '#e02030', '#ff5060', '#ffd0d0']);
  // Zickzack-Antennen: hier wird gestört, nicht gesendet
  m.form(M.oder(M.kap(18, 6, 13, 3, 0.4), M.kap(13, 3, 15, 0, 0.4), M.kap(18, 6, 23, 3, 0.4), M.kap(23, 3, 21, 0, 0.4)), RAMPE.stahl, { licht: false });
  for (let k = 0; k < 8; k++) m.punkt(4 + r() * 28 | 0, 41 + r() * 9 | 0, RAMPE.rost[3]);
  return m.leinwand();
}
// Sprengladung der Rostbrecher am Schaltschrank. f: Lampe an/aus
function malLadung(f) {
  const m = new Maler(12, 10);
  m.form(M.box(1, 3, 10, 6), RAMPE.olive, { tiefe: 1 });
  m.form(M.oder(M.box(1, 5, 10, 1), M.box(5, 3, 1, 6)), RAMPE.lederDkl, { licht: false, kante: false });
  m.form(M.kap(9, 3, 11, 0, 0.4), RAMPE.rot, { licht: false });
  m.form(M.ell(3, 2, 1.4, 1.4), f ? ['#5a0a10', '#ff3040', '#ff8090', '#ffffff'] : ['#2a0a10', '#5a1018', '#7a1a22', '#9a2a30']);
  return m.leinwand();
}

// =====================================================================
// DER NULLBUNKER (5.7): Zählsäulen, der Kern von KUSTOS, der Erste Zähler
// =====================================================================
// Zählsäule: Beton, ein senkrechter Lichtschlitz, Zifferntafel. f: Licht, zaehlt: rot statt türkis
function malZaehlsaeule(f, zaehlt) {
  const m = new Maler(22, 48), licht = zaehlt ? ['#5a0a10', '#e02030', '#ff6070', '#ffe0e0'] : RAMPE.lazi;
  m.form(M.box(2, 42, 18, 6), RAMPE.beton, { tiefe: 1 });
  m.form(M.box(4, 4, 14, 39), RAMPE.beton, { tiefe: 2 });
  m.form(M.box(9, 8, 4, 30), [UMRISS, '#0a0c12', '#0a0c12', '#141820'], { licht: false });
  m.form(M.box(10, 8 + (f ? 14 : 4), 2, 10), licht, { licht: false });
  m.form(M.box(5, 2, 12, 3), RAMPE.metall, { licht: false });
  // Ziffern: ...0 0 0 1
  [[6, 39], [9, 39], [12, 39], [15, 39]].forEach(([x, y], i) => m.form(M.box(x, y - 2, 2, 3), i === 3 ? licht : [UMRISS, '#3a4050', '#3a4050', '#3a4050'], { licht: false, kante: false }));
  return m.leinwand();
}
// Der Kern von KUSTOS: eine Kugel aus Lazi-Kristall in einem Käfig aus Kabeln. f: Puls
function malKern(f) {
  const m = new Maler(64, 70), r = zufall(1000);
  m.form(M.poly([[8, 69], [14, 56], [50, 56], [56, 69]]), RAMPE.beton, { tiefe: 2 });
  m.form(M.ell(32, 32, f ? 21 : 20, f ? 21 : 20), [UMRISS, '#0e3a4a', '#1aa0a8', '#5ff0e0'], { tiefe: 3 });
  m.form(M.ell(32, 32, 12, 12), [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8'], { licht: false });
  m.form(M.ell(27, 26, 4, 3), ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], { licht: false, kante: false });
  // Käfig und Kabel
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; m.form(M.kap(32 + Math.cos(a) * 24, 32 - Math.sin(a) * 24, 32 + Math.cos(a) * 18, 56, 0.6), RAMPE.metall, { licht: false }); }
  m.form(M.oder(M.ell(32, 32, 24, 1.2), M.kap(8, 32, 56, 32, 0.6)), RAMPE.metall, { licht: false });
  for (let k = 0; k < 7; k++) { let x = 10 + r() * 44, y = 58; for (let i = 0; i < 12; i++) { m.punkt(x, y, RAMPE.eisenDkl[2]); y += 1; x += r() < 0.5 ? -1 : 1; } }
  // Die Null in der Mitte
  m.form(M.ohne(M.ell(32, 32, 4, 6), M.ell(32, 32, 2.2, 4.2)), [UMRISS, '#0e3a4a', '#0e3a4a', '#0e3a4a'], { licht: false, kante: false });
  return m.leinwand();
}
// Der Erste Zähler: Hohepriester des inneren Kreises, Maske mit einer Null, ein Ring aus Zählperlen
function malErsterZaehler(f, offen) {
  const m = new Maler(44, 56), Y = 6, s = f ? 1.4 : -1.4;
  m.form(M.poly([[12, 14 + Y], [32, 14 + Y], [38, 48 + Y], [6, 48 + Y]]), KUTTE, { tiefe: 2 });
  for (let x = 9; x < 36; x += 4) m.form(M.kap(x, 24 + Y, x + 1, 47 + Y, 0.4), ['#0a0a0e', '#1a1a20', '#1a1a20', '#2a2a34'], { licht: false, kante: false });
  m.form(M.oder(M.kap(15, 15 + Y, 22, 46 + Y, 1), M.kap(29, 15 + Y, 22, 46 + Y, 1)), RAMPE.gold, { licht: false });
  m.form(M.box(14 - s, 47 + Y, 6, 3), RAMPE.lederDkl); m.form(M.box(24 + s, 47 + Y, 6, 3), RAMPE.lederDkl);
  // Kopf: Kapuze und Maske mit Null
  m.form(M.oder(M.ell(22, 8 + Y, 7, 7.5), M.poly([[15, 9 + Y], [13, 17 + Y], [18, 15 + Y]])), KUTTE, { tiefe: 2 });
  m.form(M.ell(23, 10 + Y, 4.5, 5), RAMPE.putz, { licht: false });
  m.form(M.ohne(M.ell(23, 10 + Y, 2.2, 3.2), M.ell(23, 10 + Y, 1.1, 2.1)), offen ? ['#5a0a10', '#e02030', '#e02030', '#e02030'] : [UMRISS, '#0e3a4a', '#0e3a4a', '#0e3a4a'], { licht: false, kante: false });
  // Ring aus Zählperlen über dem Kopf
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + (f ? 0.26 : 0); m.form(M.ell(22 + Math.cos(a) * 13, -1 + Y + Math.sin(a) * 3.5, 1.4, 1.4), i % 3 ? RAMPE.gold : RAMPE.lazi, { licht: false }); }
  // Hände mit Zählstab
  m.form(M.kap(32, 22 + Y, 39, 30 + Y, 1.8), KUTTE); m.form(M.ell(39, 30 + Y, 1.6, 1.6), RAMPE.haut);
  m.form(M.kap(40, 18 + Y, 38, 50 + Y, 0.7), RAMPE.gold);
  for (let i = 0; i < 4; i++) m.form(M.ell(39.5 - i * 0.15, 20 + Y + i * 3, 1.2, 1), RAMPE.lazi, { licht: false });
  return m.leinwand();
}

// Schloss mit Ketten über Gebäuden, die erst in einer späteren Epoche kommen
function malSchloss() {
  const m = new Maler(40, 36);
  // zwei Ketten über Kreuz, Glied für Glied
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    m.form(M.ohne(M.ell(2 + t * 36, 3 + t * 30, 2.4, 1.8), M.ell(2 + t * 36, 3 + t * 30, 1, 0.6)), RAMPE.metall, { licht: false });
    m.form(M.ohne(M.ell(38 - t * 36, 3 + t * 30, 2.4, 1.8), M.ell(38 - t * 36, 3 + t * 30, 1, 0.6)), RAMPE.metall, { licht: false });
  }
  // Vorhängeschloss in der Mitte
  m.form(M.ohne(M.ell(20, 14, 6, 6.5), M.ell(20, 14, 3.4, 4)), RAMPE.stahl, { tiefe: 1 });
  m.form(M.box(12, 15, 16, 13), RAMPE.gold, { tiefe: 2 });
  m.form(M.oder(M.ell(20, 20, 2, 2), M.box(19.2, 20, 1.6, 5)), [UMRISS, '#2a1a08', '#2a1a08', '#2a1a08'], { licht: false, kante: false });
  return m.leinwand();
}

// Denkmal der Wege: ein Obelisk mit sechs Zeichen (offene Hand, Schalter, Krone, Hirtenstab, Auge, Berg)
function malDenkmal() {
  const m = new Maler(36, 52);
  m.form(M.poly([[2, 51], [6, 43], [30, 43], [34, 51]]), RAMPE.stein, { tiefe: 2 });
  m.form(M.poly([[13, 43], [14, 8], [18, 2], [22, 8], [23, 43]]), RAMPE.putz, { tiefe: 2 });
  m.form(M.poly([[18, 2], [16, 6], [20, 6]]), RAMPE.gold, { licht: false });
  // vier Zeichen übereinander
  m.form(M.oder(M.ell(18, 13, 2.4, 2), M.kap(16, 11, 16, 9, 0.5), M.kap(18, 11, 18, 8.5, 0.5), M.kap(20, 11, 20, 9, 0.5)), RAMPE.gold, { licht: false });   // Hand
  m.form(M.ohne(M.ell(18, 21, 2.6, 2.6), M.ell(18, 21, 1.4, 1.4)), RAMPE.lazi, { licht: false }); m.form(M.box(17.5, 17.5, 1, 3), RAMPE.lazi, { licht: false });   // Schalter
  m.form(M.poly([[15, 31], [15, 27], [16.5, 29], [18, 26.5], [19.5, 29], [21, 27], [21, 31]]), RAMPE.gold, { licht: false });   // Krone
  m.form(M.oder(M.kap(18, 40, 18, 35, 0.5), M.ohne(M.ell(19.4, 35, 1.6, 1.6), M.ell(19.4, 35.6, 0.8, 0.9))), RAMPE.holz, { licht: false });   // Hirtenstab
  m.form(M.ell(9, 47, 2.2, 1.4), RAMPE.lazi, { licht: false }); m.punkt(9, 47, UMRISS);   // Auge, am Sockel
  m.form(M.poly([[24, 49], [27, 44.5], [30, 49]]), RAMPE.stein, { licht: false }); m.punkt(27, 45, '#ffffff');   // Berg, am Sockel
  for (let x = 5; x < 32; x += 3) m.punkt(x, 47, BLUETEN[x % 5][2]);
  return m.leinwand();
}

// =====================================================================
// DER ZWIESPALT: Schaltwächter, Treiber und Herde, Thron, Nummer Null, Kabelknoten, Anselm
// =====================================================================
// Der Schaltwächter: ein Schaltschrank auf Spinnenbeinen, vorne ein großer Hebel, Blitze zwischen den Polen
function malSchaltwaechter(f) {
  const m = new Maler(50, 54), s = f ? 1.5 : -1.5;
  [[8, 40, 2, 52], [16, 42, 12, 53], [34, 42, 38, 53], [42, 40, 48, 52]].forEach(([x0, y0, x1, y1], i) => m.form(M.kap(x0, y0, x1 + (i % 2 ? s : -s), y1, 1.6), RAMPE.eisenDkl));
  m.form(M.box(9, 10, 32, 34), RAMPE.metall, { tiefe: 3 });
  m.form(M.box(12, 14, 26, 20), [UMRISS, '#0a0c12', '#141820', '#1e2430'], { licht: false });
  for (let i = 0; i < 4; i++) m.form(M.box(14 + i * 6, 17, 4, 3), i % 2 === (f ? 1 : 0) ? ['#5a0a10', '#e02030', '#ff6070', '#ffe0e0'] : RAMPE.lazi, { licht: false });
  m.form(M.oder(M.box(14, 26, 22, 2), M.box(14, 30, 16, 2)), RAMPE.eisenDkl, { licht: false, kante: false });
  // Der große Hebel
  m.form(M.kap(25, 40, 25 + (f ? 6 : -6), 47, 1.6), RAMPE.stahl); m.form(M.ell(25 + (f ? 6 : -6), 48, 2.4, 2.4), RAMPE.rot);
  // Zwei Pole mit Blitz dazwischen
  m.form(M.oder(M.box(10, 2, 3, 9), M.box(37, 2, 3, 9)), RAMPE.stahl, { tiefe: 1 });
  m.form(M.oder(M.ell(11.5, 2, 2.2, 2.2), M.ell(38.5, 2, 2.2, 2.2)), RAMPE.lazi, { licht: false });
  let y = 3; for (let x = 13; x < 37; x += 2) { y = f ? 3 + ((x / 2) % 2 ? 2 : -1) : 3 + ((x / 2) % 2 ? -1 : 2); m.punkt(x, y, '#ffe060').punkt(x + 1, y, '#fff8c0'); }
  return m.leinwand();
}
// Der Treiber: hoher Hirtenroboter mit Mantel aus Planen und einem langen Stab mit Lampe
function malTreiber(f) {
  const m = new Maler(46, 60), s = f ? 1.6 : -1.6;
  m.form(M.oder(M.kap(18, 38, 16 - s, 57, 2.2), M.kap(28, 38, 30 + s, 57, 2.2)), RAMPE.eisenDkl);
  m.form(M.oder(M.box(12 - s, 55, 8, 4), M.box(26 + s, 55, 8, 4)), RAMPE.metall);
  m.form(M.poly([[12, 16], [34, 16], [38, 44], [8, 44]]), RAMPE.olive, { tiefe: 2 });
  for (let x = 11; x < 36; x += 5) m.form(M.kap(x, 24, x + 1, 43, 0.4), ['#1a2010', '#2a3418', '#2a3418', '#3a4422'], { licht: false, kante: false });
  m.form(M.box(16, 16, 14, 10), RAMPE.rost, { tiefe: 1 });
  // Kopf: ein Scheinwerfer wie ein Auge, Antennen wie Hörner
  m.form(M.box(16, 4, 14, 11), RAMPE.metall, { tiefe: 2 });
  m.form(M.ell(23, 9.5, 3.4, 3.4), [UMRISS, '#7a6a20', '#e8c040', '#fff8c0'], { licht: false });
  m.form(M.oder(M.kap(17, 5, 13, 0, 0.6), M.kap(29, 5, 33, 0, 0.6)), RAMPE.stahl, { licht: false });
  // Der Stab mit Lampe
  m.form(M.kap(38, 22, 40, 58, 0.9), RAMPE.holz);
  m.form(M.ohne(M.ell(37, 8, 5, 5), M.ell(36, 9.5, 3, 3.3)), RAMPE.holz, { licht: false });
  m.form(M.ell(33, 11, 1.8, 2.2), f ? RAMPE.lazi : [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8'], { licht: false });
  m.form(M.kap(32, 22, 38, 26, 1.8), RAMPE.olive); m.form(M.ell(38.5, 26, 1.8, 1.8), RAMPE.metall);
  return m.leinwand();
}
// Ein Lastläufer der Herde: vier Beine, ein Rücken wie ein Tisch, ein Auge
function malHerdenlaeufer(f) {
  const m = new Maler(30, 24), s = f ? 1 : -1;
  m.form(M.oder(M.kap(7, 14, 5 - s, 23, 1.1), M.kap(22, 14, 24 + s, 23, 1.1)), RAMPE.metall, { licht: false });
  m.form(M.oder(M.ell(14, 11, 10, 5), M.box(5, 9, 19, 5)), RAMPE.rost, { tiefe: 2 });
  m.form(M.box(6, 6, 17, 3), RAMPE.holz, { tiefe: 1 });
  m.form(M.oder(M.kap(10, 14, 10 + s, 23, 1.2), M.kap(18, 14, 18 - s, 23, 1.2)), RAMPE.metall);
  m.form(M.oder(M.ell(26, 9, 3.5, 3), M.box(23, 7, 4, 5)), RAMPE.metall);
  m.form(M.ell(27.5, 8.5, 1.3, 1.2), RAMPE.lazi, { licht: false });
  return m.leinwand();
}
// Nummer Null: die erste Einheit. Ein schwebender Ring um einen Kern mit einer Null, darunter Kabel wie Wurzeln
function malNummerNull(f) {
  const m = new Maler(44, 56), r = zufall(77), h = f ? 1 : 0;
  for (let k = 0; k < 6; k++) { let x = 14 + k * 3.2, y = 36 - h; for (let i = 0; i < 16; i++) { m.punkt(x, y, i % 4 ? RAMPE.eisenDkl[2] : RAMPE.lazi[2]); y += 1; x += r() < 0.5 ? -1 : 1; } }
  m.form(M.ohne(M.ell(22, 22 - h, 18, 6), M.ell(22, 22 - h, 15, 4)), RAMPE.stahl, { tiefe: 1 });
  m.form(M.ell(22, 22 - h, 11, 12), [UMRISS, '#e0e8f0', '#f4f8fc', '#ffffff'], { tiefe: 2 });
  m.form(M.ohne(M.ell(22, 22 - h, 4.5, 7), M.ell(22, 22 - h, 2.4, 4.8)), f ? RAMPE.lazi : [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8'], { licht: false, kante: false });
  m.form(M.oder(M.ell(4, 22 - h, 2, 2), M.ell(40, 22 - h, 2, 2)), RAMPE.lazi, { licht: false });
  return m.leinwand();
}
// Kabelknoten: Verteilerkasten, aus dem drei Kabel zum Kern laufen. an: verbunden (leuchtet)
function malKabelknoten(an, f) {
  const m = new Maler(22, 26), licht = an ? (f ? RAMPE.lazi : [UMRISS, '#1aa0a8', '#5ff0e0', '#e0fff8']) : ['#2a0a10', '#5a1018', '#7a1a22', '#9a2a30'];
  m.form(M.box(2, 20, 18, 5), RAMPE.beton, { tiefe: 1 });
  m.form(M.box(4, 6, 14, 15), RAMPE.metall, { tiefe: 2 });
  m.form(M.box(7, 9, 8, 6), [UMRISS, '#0a0c12', '#141820', '#1e2430'], { licht: false });
  m.form(M.ell(11, 12, 2.2, 2.2), licht, { licht: false });
  m.form(M.oder(M.kap(6, 6, 3, 0, 0.8), M.kap(11, 6, 11, 0, 0.8), M.kap(16, 6, 19, 0, 0.8)), an ? licht : RAMPE.eisenDkl, { licht: false });
  return m.leinwand();
}
// Bruder Anselm im Bunker: Kutte, eine Lampe statt Gesicht unter der Kapuze, Gebetskette aus Lazi-Perlen
function malAnselmFigur() {
  const m = new Maler(20, 30);
  m.form(M.poly([[5, 10], [15, 10], [17, 29], [3, 29]]), KUTTE, { tiefe: 2 });
  m.form(M.kap(10, 12, 10, 28, 0.5), RAMPE.stoff, { licht: false, kante: false });
  m.form(M.oder(M.ell(10, 6, 4.6, 5), M.poly([[5, 7], [4, 12], [8, 10]])), KUTTE, { tiefe: 2 });
  m.form(M.ell(10.5, 7, 2.6, 3), [UMRISS, '#0a0c12', '#0a0c12', '#141820'], { licht: false });
  m.form(M.ell(10.5, 7, 1.2, 1.2), RAMPE.lazi, { licht: false });
  for (let i = 0; i < 6; i++) m.form(M.ell(7 + i * 1.2, 14 + Math.sin(i) * 1.5, 0.7, 0.7), RAMPE.lazi, { licht: false, kante: false });
  m.form(M.ell(14, 17, 1.4, 1.4), RAMPE.metall);
  return m.leinwand();
}
// Der Schaltthron: ein runder Sockel mit Stufen, darauf ein Stuhl aus Kabeln und Blech
function malSchaltthron() {
  const m = new Maler(56, 48);
  m.form(M.ell(28, 40, 26, 7), RAMPE.beton, { tiefe: 2 });
  m.form(M.ell(28, 37, 20, 5), RAMPE.metall, { tiefe: 1 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; m.punkt(28 + Math.cos(a) * 20, 37 + Math.sin(a) * 5, RAMPE.lazi[2]); }
  m.form(M.oder(M.box(18, 6, 20, 26), M.ell(28, 6, 10, 4)), RAMPE.stahl, { tiefe: 2 });
  m.form(M.box(21, 10, 14, 14), [UMRISS, '#0e3a4a', '#123440', '#18404c'], { licht: false });
  m.form(M.oder(M.box(14, 22, 6, 4), M.box(36, 22, 6, 4)), RAMPE.gold, { tiefe: 1 });
  m.form(M.ohne(M.ell(28, 16, 3, 4.5), M.ell(28, 16, 1.6, 3)), RAMPE.gold, { licht: false, kante: false });
  return m.leinwand();
}

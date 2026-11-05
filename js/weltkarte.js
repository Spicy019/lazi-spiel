// =====================================================================
// WELTKARTE: das Tal von Altbrück. Ort wählen, hinreisen, unterwegs
// Ereignisse erleben, Nachrichten lesen, dann die Mission spielen.
// =====================================================================

const KARTE_W = 384, KARTE_H = 216;   // gemalte Karte in Pixeln, wird auf den Bildschirm hochskaliert
let REISE = null;                      // aktuelle Reise: { ort, leben }
let kartenAuswahl = 'dorf';

// Weiches Rauschen für natürliche Formen (Waldränder, Felsen, Küsten)
function rauschen2d(seed) {
  const r = zufall(seed), g = [];
  for (let i = 0; i < 64 * 64; i++) g.push(r());
  const wert = (x, y) => g[((y & 63) * 64) + (x & 63)];
  const glatt = t => t * t * (3 - 2 * t);
  const einfach = (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = glatt(x - x0), fy = glatt(y - y0);
    const a = wert(x0, y0), b = wert(x0 + 1, y0), c = wert(x0, y0 + 1), d = wert(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y) => (einfach(x, y) * 0.6 + einfach(x * 2.3 + 7, y * 2.3 + 3) * 0.28 + einfach(x * 5.1 + 11, y * 5.1 + 5) * 0.12);
}

// Der Fluss schlängelt sich von oben nach unten durch die Mitte
const flussX = v => 0.53 + Math.sin(v * 5.2) * 0.045 + v * 0.03;

function karteMalen(c) {
  c.width = KARTE_W; c.height = KARTE_H;
  const g = c.getContext('2d');
  const img = g.createImageData(KARTE_W, KARTE_H), d = img.data;
  const n1 = rauschen2d(3), n2 = rauschen2d(17), n3 = rauschen2d(29), r = zufall(5);
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const F = {
    wiese: ['#4a6a3a', '#527444', '#425e34'].map(hex), wald: ['#1e3a24', '#244428', '#1a321e', '#2c4e2e'].map(hex),
    fels: ['#5a5868', '#666478', '#4c4a5a'].map(hex), schnee: ['#d8dce8', '#eef2f8', '#c0c6d6'].map(hex),
    feld: [['#b09a4a', '#c4ac56'], ['#6a8a3a', '#7a9a44'], ['#7a5a3a', '#6a4c30']].map(p => p.map(hex)),
    stadt: ['#4a4856', '#55525f', '#3e3c48'].map(hex), wasser: ['#2e5a8a', '#3a6a9a'].map(hex), sand: hex('#8a7a5a'),
  };
  const art = new Array(KARTE_W * KARTE_H);
  // Die Felder um das Dorf wachsen mit der Epoche und mit jedem Bauernhof
  const D = ORTE.dorf, feldR = 11 + SPIEL.epoche * 9 + Math.min(6, anzahlGebaeude('bauernhof')) * 4;
  // Straßenraster der verlassenen Stadt
  const strasse = (x, y) => ((x - 236 + Math.floor(y * 0.25)) % 15 + 15) % 15 < 2 || ((y - 128) % 13 + 13) % 13 < 2;
  for (let y = 0; y < KARTE_H; y++) for (let x = 0; x < KARTE_W; x++) {
    const u = x / KARTE_W, v = y / KARTE_H, i = y * KARTE_W + x;
    const rau = n1(u * 7, v * 4);
    const hoehe = u * 0.75 + (1 - v) * 0.75 + (rau - 0.5) * 0.5;
    const fluss = Math.abs(u - flussX(v)) < 0.0055 + v * 0.004 + (n2(u * 20, v * 20) - 0.5) * 0.003;
    const ufer = Math.abs(u - flussX(v)) < 0.011 + v * 0.004;
    let a, col;
    const feldD = Math.hypot((u - D.x) * KARTE_W, (v - D.y) * KARTE_H * 1.35) + (rau - 0.5) * 16;
    const istStadt = u > 0.645 + (rau - 0.5) * 0.08 && v > 0.63 + (n3(u * 6, v * 6) - 0.5) * 0.1 && !ufer;
    if (fluss && hoehe < 1.12) { a = 'wasser'; col = F.wasser[(x + y) % 5 === 0 ? 1 : 0]; }
    else if (istStadt && hoehe <= 0.98) {
      if (strasse(x, y)) { a = 'strasse'; col = (x * 7 + y * 3) % 11 === 0 ? hex('#4a4a3a') : hex('#2e2c36'); }
      else if (n2(u * 26, v * 26) > 0.68) { a = 'stadt'; col = n3(u * 60, v * 60) > 0.5 ? hex('#3a5a34') : hex('#2e4a2a'); }
      else { a = 'stadt'; col = F.stadt[Math.floor(n2(u * 40, v * 40) * 2.99)]; }
    }
    else if (hoehe > 1.2 + (n3(u * 9, v * 9) - 0.5) * 0.12) { a = 'schnee'; col = F.schnee[Math.floor(n2(u * 30, v * 30) * 2.99)]; }
    else if (hoehe > 0.98) { a = 'fels'; col = F.fels[Math.floor(n3(u * 25, v * 25) * 2.99)]; }
    else if (feldD < feldR && feldD > 6 && hoehe < 0.9) {
      a = 'feld';
      const parzelle = Math.floor(n2(Math.floor(u * 14) * 1.7, Math.floor(v * 10) * 1.3) * 2.99);
      col = F.feld[parzelle][(y % 3 === 0) ? 1 : 0];
      if ((x + Math.floor(y / 3)) % 9 === 0 || y % 6 === 0) col = F.wiese[2];
    }
    else if (ufer) { a = 'ufer'; col = F.sand; }
    else {
      const dichte = n2(u * 9, v * 9) + (1 - v) * 0.25 + (0.5 - Math.abs(u - 0.45)) * 0.35;
      if (dichte > 0.72) { a = 'wald'; col = F.wald[Math.floor(n3(u * 50, v * 50) * 3.99)]; }
      else { a = 'wiese'; col = F.wiese[Math.floor(n3(u * 40, v * 40) * 2.99)]; }
    }
    art[i] = a;
    const o = i * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const px = (x, y, f) => { g.fillStyle = f; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const at = (x, y) => art[Math.max(0, Math.min(KARTE_H - 1, Math.round(y))) * KARTE_W + Math.max(0, Math.min(KARTE_W - 1, Math.round(x)))];
  // Baumkronen im Wald, mit Licht oben links
  for (let k = 0; k < 2600; k++) {
    const x = r() * KARTE_W, y = r() * KARTE_H;
    if (at(x, y) !== 'wald' && !(at(x, y) === 'wiese' && r() < 0.04)) continue;
    const dunkel = r() < 0.5;
    g.fillStyle = '#0e1e12'; g.fillRect(x - 1, y, 4, 3);
    g.fillStyle = dunkel ? '#1e3e26' : '#2c5430'; g.fillRect(x - 1, y - 1, 3, 3);
    px(x - 1, y - 1, dunkel ? '#2c5430' : '#4a7a3e');
  }
  // Berggipfel
  for (let k = 0; k < 160; k++) {
    const x = r() * KARTE_W, y = r() * KARTE_H, a = at(x, y);
    if (a !== 'fels' && a !== 'schnee') continue;
    const h = 3 + Math.floor(r() * 5);
    for (let j = 0; j < h; j++) {
      g.fillStyle = a === 'schnee' ? '#f4f8ff' : '#7a788c'; g.fillRect(x - j, y - h + j, j + 1, 1);
      g.fillStyle = a === 'schnee' ? '#aab2c4' : '#3e3c4c'; g.fillRect(x + 1, y - h + j, j, 1);
    }
  }
  // Die verlassene Stadt: Hochhäuser zwischen den Straßen, überwuchert von Moos und Büschen
  const tuerme = [];
  for (let by = 128; by < KARTE_H; by += 13) for (let bx = 236 - 30; bx < KARTE_W; bx += 15) {
    const x0 = bx - Math.floor(by * 0.25) + 3 + Math.floor(r() * 4), y0 = by + 11;
    if (at(x0 + 3, y0 - 2) !== 'stadt' || r() < 0.18) continue;
    const mitte = 1 - Math.min(1, Math.hypot(x0 - 330, y0 - 190) / 110);
    tuerme.push({ x: x0, y: y0, w: 5 + Math.floor(r() * 5), h: 8 + Math.floor(r() * 10 + mitte * 26), kaputt: r() < 0.55, seed: r() });
  }
  tuerme.sort((p, q) => p.y - q.y).forEach(t => {
    const { x, y, w, h } = t;
    g.fillStyle = 'rgba(10,8,18,0.45)'; g.fillRect(x + 2, y - 1, w + 2, 3);
    // Jede Spalte einzeln, damit eingestürzte Dächer zackig aussehen
    const hoehe = [];
    for (let i = 0; i < w; i++) hoehe.push(h - (t.kaputt ? Math.floor(r() * (i % 3 ? 5 : 2) + (i > w / 2 ? 2 : 0)) : 0));
    hoehe.forEach((hh, i) => { g.fillStyle = i === 0 ? '#82809a' : i >= w - 2 ? '#4a4858' : '#6a687e'; g.fillRect(x + i, y - hh, 1, hh); });
    for (let wy = y - h + 2; wy < y - 1; wy += 2) for (let wx = x + 1; wx < x + w - 2; wx += 2) if (wy > y - hoehe[wx - x] + 1) px(wx, wy, r() < 0.06 ? '#c8b060' : '#1e1c2a');
    // Moos auf dem Dach, Ranken an der Wand, Büsche am Fuß
    hoehe.forEach((hh, i) => { px(x + i, y - hh, '#3a6a34'); if (r() < 0.6) px(x + i, y - hh - 1, r() < 0.5 ? '#4e8a36' : '#2e5a2a'); });
    for (let k2 = 0; k2 < 2 + h / 6; k2++) { const rx = x + Math.floor(r() * w); let ry = y - 1; const len = 2 + Math.floor(r() * h * 0.7); for (let i = 0; i < len; i++) px(rx + (r() < 0.2 ? 1 : 0), ry - i, r() < 0.5 ? '#2e5a2a' : '#4e8a36'); }
    for (let i = -1; i < w + 1; i += 2) if (r() < 0.7) { px(x + i, y, '#2e5a2a'); px(x + i, y - 1, '#4e8a36'); }
  });
  // Büsche und Bäume auf den Straßen der Stadt
  for (let k2 = 0; k2 < 260; k2++) {
    const x = r() * KARTE_W, y = r() * KARTE_H;
    if (at(x, y) !== 'strasse') continue;
    px(x, y, '#2e5a2a'); px(x + 1, y, '#4e8a36'); if (r() < 0.4) px(x, y - 1, '#4e8a36');
  }
  // Der Fluss kommt aus den Bergen: dünner Bach oben, dann ein Wasserfall
  let quelleY = -1;
  for (let y = 0; y < KARTE_H; y++) { const x = Math.round(flussX(y / KARTE_H) * KARTE_W); if (at(x, y) === 'wasser') { quelleY = y; break; } }
  if (quelleY > 8) {
    for (let y = 0; y < quelleY - 16; y++) { const x = Math.round(flussX(y / KARTE_H) * KARTE_W); px(x, y, y % 3 ? '#6a8ac0' : '#a8c8f0'); }
    const fx = Math.round(flussX(quelleY / KARTE_H) * KARTE_W), top = quelleY - 16;
    g.fillStyle = '#3e3c4c'; g.fillRect(fx - 5, top - 2, 11, 2);
    g.fillStyle = '#5a5868'; g.fillRect(fx - 6, top - 1, 13, 1);
    for (let y = top; y < quelleY + 1; y++) for (let dx = -1; dx <= 2; dx++) px(fx + dx, y, (y + dx * 2) % 4 === 0 ? '#ffffff' : (y + dx) % 3 === 0 ? '#a8d0ff' : '#e0f0ff');
    for (let i = 0; i < 26; i++) { const a2 = r() * Math.PI, d = r() * 6; px(fx + Math.cos(a2) * d, quelleY + Math.sin(a2) * d * 0.6, r() < 0.5 ? '#ffffff' : '#c8e4ff'); }
    g.fillStyle = 'rgba(230,240,255,0.25)'; g.fillRect(fx - 6, quelleY - 4, 13, 6);
  }
  // Wege zwischen bekannten Orten
  const weg = (a, b, sichtbar) => {
    if (!sichtbar) return;
    const A = ORTE[a], B = ORTE[b], mx = (A.x + B.x) / 2 + (A.y - B.y) * 0.12, my = (A.y + B.y) / 2 + (B.x - A.x) * 0.12;
    for (let t = 0; t <= 1; t += 0.006) {
      if (Math.floor(t * 160) % 3 === 2) continue;
      const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x, y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
      const wx = x * KARTE_W, wy = y * KARTE_H;
      px(wx, wy, at(wx, wy) === 'wasser' ? '#7a5a3a' : '#c8a46a');
    }
  };
  const k = id => ortBekannt(id);
  weg('dorf', 'markt', true); weg('dorf', 'wald', true); weg('markt', 'universitaet', true); weg('wald', 'universitaet', true);
  weg('dorf', 'birkenhain', k('birkenhain')); weg('universitaet', 'kraftwerk', k('kraftwerk')); weg('universitaet', 'lazifabrik', k('lazifabrik'));
  weg('universitaet', 'stadt', k('stadt')); weg('stadt', 'kraftwerk', k('stadt') && k('kraftwerk')); weg('markt', 'lager', k('lager')); weg('dorf', 'birkenstrasse', k('birkenstrasse')); weg('lazifabrik', 'eisenfurt', k('eisenfurt')); weg('wald', 'hort', k('hort') && !SPIEL.karte.erledigt.hort); weg('stadt', 'nullbunker', k('nullbunker'));
  // Orte als kleine Bilder
  Object.keys(ORTE).forEach(id => { if (k(id) && !(id === 'hort' && SPIEL.karte.erledigt.hort)) ortSymbol(g, id); });
  // Nebel über unbekannten Orten und am Kartenrand
  Object.keys(ORTE).forEach(id => {
    if (k(id)) return;
    const o = ORTE[id], cx = o.x * KARTE_W, cy = o.y * KARTE_H;
    const grad = g.createRadialGradient(cx, cy, 2, cx, cy, 26);
    grad.addColorStop(0, 'rgba(14,12,22,0.92)'); grad.addColorStop(1, 'rgba(14,12,22,0)');
    g.fillStyle = grad; g.fillRect(cx - 30, cy - 30, 60, 60);
  });
  const rand = g.createRadialGradient(KARTE_W * 0.45, KARTE_H * 0.55, KARTE_H * 0.45, KARTE_W * 0.45, KARTE_H * 0.55, KARTE_W * 0.7);
  rand.addColorStop(0, 'rgba(14,12,22,0)'); rand.addColorStop(1, 'rgba(14,12,22,0.7)');
  g.fillStyle = rand; g.fillRect(0, 0, KARTE_W, KARTE_H);
}

// Kleine Pixelbilder für jeden Ort
function ortSymbol(g, id) {
  const o = ORTE[id], x = Math.round(o.x * KARTE_W), y = Math.round(o.y * KARTE_H);
  const b = (dx, dy, w, h, f) => { g.fillStyle = f; g.fillRect(x + dx, y + dy, w, h); };
  const schatten = (w) => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - w / 2, y + 2, w, 2); };
  switch (o.art) {
    case 'dorf': {
      // Wächst mit der Zahl der Gebäude und wird mit jeder Epoche moderner
      const n = Math.min(16, Math.max(3, SPIEL.gebaeude.filter(g => g.typ !== 'weg').length)), ep = SPIEL.epoche;
      const plaetze = [];
      for (let i = 0; i < n; i++) { const a = i * 2.4, d = 4 + Math.sqrt(i) * 3.2; plaetze.push([Math.round(Math.cos(a) * d * 1.3), Math.round(Math.sin(a) * d * 0.8)]); }
      plaetze.sort((p, q) => p[1] - q[1]);
      schatten(10 + n * 1.5);
      if (ep >= 1) { for (let a = 0; a < Math.PI * 2; a += 0.08) { const rr = 8 + Math.sqrt(n) * 3.4; b(Math.round(Math.cos(a) * rr * 1.3), Math.round(Math.sin(a) * rr * 0.8) + 1, 1, 2, ep >= 2 ? '#8a8898' : '#6a4628'); } }
      plaetze.forEach(([dx, dy], i) => {
        if (ep === 0) { for (let j = 0; j < 4; j++) b(dx + 1 - j, dy - 3 + j, j * 2 + 1, 1, j < 2 ? '#c8b080' : '#a08a60'); b(dx, dy, 1, 1, '#2a1e14'); }
        else if (ep === 1) { b(dx - 2, dy - 2, 5, 3, '#e0cdb0'); b(dx - 3, dy - 4, 7, 2, '#b44a3a'); b(dx, dy - 1, 1, 2, '#5a3a20'); }
        else { b(dx - 2, dy - 4, 5, 5, '#8a8898'); b(dx - 3, dy - 5, 7, 1, '#7e2a2a'); b(dx - 1, dy - 3, 1, 1, '#ffd070'); b(dx + 1, dy - 3, 1, 1, '#ffd070'); }
      });
      if (hatGebaeude('kirche')) { b(6, -14, 3, 8, '#8a8898'); b(6, -16, 3, 2, '#3a2a2a'); b(7, -17, 1, 1, '#eab03a'); }
      if (hatGebaeude('koehlerei')) { b(-14, -2, 4, 2, '#3a2a1e'); b(-13, -4, 1, 1, '#8a8090'); }
      b(0, 0, 2, 1, '#ffb030'); b(0, -1, 1, 1, '#ff7a30');
      break;
    }
    case 'markt':
      schatten(16);
      [['#d2373f', -7], ['#eab03a', -2], ['#3a6ad0', 3]].forEach(([f, dx]) => { b(dx, -4, 4, 2, f); b(dx, -2, 1, 3, '#5a2e22'); b(dx + 3, -2, 1, 3, '#5a2e22'); });
      break;
    case 'universitaet':
      schatten(18);
      b(-8, -9, 16, 10, '#8a8898'); b(-9, -10, 18, 2, '#5a5868'); b(-2, -13, 4, 3, '#5a5868');
      for (let i = 0; i < 4; i++) b(-7 + i * 4, -6, 1, 6, '#c0bed0');
      b(-1, -3, 2, 4, '#1a1622');
      break;
    case 'wald':
      b(-1, 0, 3, 2, '#5a3a20'); b(0, -1, 1, 1, '#ffb030'); b(0, -2, 1, 1, '#ff7a30');
      break;
    case 'kraftwerk':
      schatten(18);
      b(-9, -6, 16, 7, '#6a3a30'); b(-9, -7, 16, 1, '#8a4a3a');
      b(-6, -17, 4, 11, '#7e2a2a'); b(-5, -17, 1, 11, '#b44a3a'); b(1, -15, 4, 9, '#7e2a2a'); b(2, -15, 1, 9, '#b44a3a');
      b(-6, -18, 4, 1, '#3a1418'); b(1, -16, 4, 1, '#3a1418');
      b(-7, -4, 3, 3, '#1a1622'); b(-2, -4, 3, 3, '#1a1622'); b(3, -4, 3, 3, '#1a1622');
      break;
    case 'fabrik':
      schatten(20);
      b(-9, -6, 18, 7, '#4a4856'); b(-5, -11, 10, 6, '#5a5868'); b(-2, -10, 4, 3, '#5ff0e0'); b(-1, -9, 2, 1, '#e0fff8');
      break;
    case 'nullbunker':
      schatten(14);
      b(-6, -6, 12, 6, '#3a3a48'); b(-4, -5, 8, 4, '#16161e'); b(-1, -5, 2, 4, '#5ff0e0'); b(-2, -4, 1, 2, '#5ff0e0'); b(1, -4, 1, 2, '#5ff0e0');
      break;
    case 'stadt':
      b(-6, -12, 4, 12, '#8a8898'); b(-1, -16, 4, 16, '#77768e'); b(4, -9, 3, 9, '#8a8898');
      break;
    case 'siedlung':
      schatten(14);
      b(-6, -4, 4, 3, '#a89080'); b(-7, -6, 6, 2, '#5a3a20'); b(2, -3, 4, 3, '#a89080'); b(1, -5, 6, 2, '#5a3a20');
      break;
    case 'lager':
      schatten(18);
      [[-7, 0], [0, -3], [6, 0]].forEach(([dx, dy]) => { for (let j = 0; j < 5; j++) b(dx + 2 - j, dy - 4 + j, j * 2 + 1, 1, j < 2 ? '#7a6a5a' : '#5a5048'); });
      b(0, -10, 1, 6, '#5a3a20'); b(1, -10, 3, 2, '#d2373f'); b(-1, 2, 2, 1, '#ffb030');
      break;
    case 'strasse':
      b(-7, 0, 9, 3, '#8a4e30'); b(-6, -3, 7, 3, '#c0a070'); b(-6, 3, 2, 2, '#2a1e14'); b(0, 3, 2, 2, '#2a1e14');
      b(3, -2, 5, 3, '#c0612c'); b(7, -3, 2, 2, '#68728e'); b(8, -3, 1, 1, '#5ff0e0');
      break;
    case 'geheim':
      for (let i = -3; i <= 3; i++) { b(i, i, 1, 1, '#c890ff'); b(i, -i, 1, 1, '#c890ff'); }
      break;
  }
}

// ---------------------------------------------------------------------
// Bildschirm der Weltkarte
// ---------------------------------------------------------------------
function weltkarteZeigen() {
  const box = document.getElementById('weltkarte');
  karteMalen(document.getElementById('karteBild'));
  const orte = document.getElementById('karteOrte'), liste = document.getElementById('ortListe');
  orte.textContent = ''; liste.textContent = '';
  Object.keys(ORTE).forEach(id => {
    const o = ORTE[id];
    if (!ortBekannt(id) || (id === 'hort' && SPIEL.karte.erledigt.hort)) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ort-knopf' + (o.geheim ? ' geheim' : '') + (o.status === 'bald' ? ' bald' : '') + (id === 'dorf' ? ' heim' : '') + (anfrageBei(id) ? ' anfrage' : '') + (o.x > 0.86 ? ' rechts' : o.x < 0.12 ? ' links' : '');
    b.style.left = (o.x * 100) + '%'; b.style.top = (o.y * 100) + '%';
    b.dataset.ort = id;
    b.innerHTML = `<span class="ort-name">${esc(o.name)}</span>${o.gefahr ? `<span class="pips">${'■'.repeat(o.gefahr)}<span>${'■'.repeat(5 - o.gefahr)}</span></span>` : ''}`;
    b.setAttribute('aria-label', o.name + (o.gefahr ? TX`, Gefahr ${o.gefahr} von 5` : ''));
    b.addEventListener('click', () => { kartenAuswahl = id; geraeusch('klick'); kartenInfo(); });
    orte.append(b);
    // Handy: dieselben Orte noch einmal als Liste unter der Karte
    const l = document.createElement('button');
    l.type = 'button'; l.dataset.ort = id; l.className = (id === 'dorf' ? 'heim' : '') + (anfrageBei(id) ? ' anfrage' : ''); l.textContent = o.name;
    l.addEventListener('click', () => { kartenAuswahl = id; geraeusch('klick'); kartenInfo(); karteZentrieren(true); });
    liste.append(l);
  });
  document.getElementById('kTag').textContent = TX`Tag ${SPIEL.tag}`;
  document.getElementById('kVorrat').innerHTML = vorratHtml(['gold', 'holz', 'stein', 'nahrung', 'teile']);
  if (!ortBekannt(kartenAuswahl)) kartenAuswahl = 'dorf';
  kartenInfo();
  box.hidden = false;
  document.getElementById('dorfUi').hidden = true;
  karteZentrieren(false);
}
// Auf dem Handy: die Karte zum gewählten Ort schieben
function karteZentrieren(weich) {
  const sc = document.querySelector('.karte-scroll');
  if (!sc || sc.scrollWidth <= sc.clientWidth) return;
  const x = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, ORTE[kartenAuswahl].x * sc.scrollWidth - sc.clientWidth / 2));
  if (weich && sc.scrollTo) sc.scrollTo({ left: x, behavior: 'smooth' }); else sc.scrollLeft = x;
}
function weltkarteSchliessen() {
  document.getElementById('weltkarte').hidden = true;
  if (modus === 'dorf') document.getElementById('dorfUi').hidden = false;
}

function kartenInfo() {
  const id = kartenAuswahl, o = ORTE[id], p = document.getElementById('karteInfo');
  document.querySelectorAll('.ort-knopf, #ortListe button').forEach(b => b.classList.toggle('gewaehlt', b.dataset.ort === id));
  const lb = document.querySelector('#ortListe button.gewaehlt');
  if (lb) { const l = lb.parentElement; if (lb.offsetLeft < l.scrollLeft || lb.offsetLeft + lb.offsetWidth > l.scrollLeft + l.clientWidth) l.scrollLeft = lb.offsetLeft - 8; }
  const besuche = SPIEL.karte.besucht[id] || 0, siege = SPIEL.karte.erledigt[id] || 0;
  const zeilen = [];
  // Was es dort gibt, weiß man erst, wenn man einmal dort war
  const bekanntGenug = id === 'dorf' || besuche > 0;
  if (bekanntGenug && o.ressourcen) zeilen.push([TX('Ressourcen'), o.ressourcen]);
  if (bekanntGenug && o.plaene) zeilen.push([TX('Weitere Pläne'), o.plaene]);
  if (!bekanntGenug) zeilen.push([TX('Ressourcen'), TX('Unbekannt. Du warst noch nie dort.')]);
  if (o.mission || o.handel) zeilen.push([TX('Besuche'), besuche ? besuche + (o.mission ? ' ' + TX`(${siege} erfolgreich)` : '') : TX('noch nie')]);
  if (o.handel) zeilen.push([TX('Beziehung'), beziehungText(SPIEL.beziehungen[id] || 0)]);
  const spaeher = id !== 'dorf' && (o.mission || o.handel) ? spaeherZeile(id) : null;
  if (spaeher) zeilen.push(spaeher);
  if (id === 'stadt' && SPIEL.karte.fuchs) zeilen.push([TX('Gerücht'), TX('Der Fuchs wurde gesehen! Diesmal wartet kein Bunker, sondern die Jagd auf ihn.')]);
  let aktionen = '';
  if (id === 'dorf') aktionen = TX('<button class="btn" data-a="heim" type="button">Zurück ins Dorf</button>');
  else if (o.abEpoche && !regel('alleOrteOffen') && SPIEL.epoche < o.abEpoche) aktionen = TX`<p class="note">Dafür ist dein Dorf noch nicht bereit. Ab Epoche ${o.abEpoche + 1}.</p>`;
  else if (o.status === 'offen' && o.mission) aktionen = '<button class="btn" data-a="reisen" type="button">' + (id === 'kraftwerk' && stromFrei() ? TX('Das Kraftwerk erneut säubern · 1 Tag') : id === 'lazifabrik' && fabrikFrei() ? TX('Die Werkhalle erneut säubern · 1 Tag') : TX('Hinreisen · 1 Tag')) + '</button>';
  if (id === 'kraftwerk') aktionen = stromKarteHtml() + aktionen;
  if (id === 'lazifabrik') aktionen = fabrikKarteHtml() + aktionen;
  else if (o.status === 'bald') aktionen = TX('<p class="note">Diesen Ort kannst du in einer späteren Version besuchen.</p>');
  // Anfrage eines Verbunds oder seltene Mission an diesem Ort
  const anf = anfrageBei(id);
  if (anf && !(o.abEpoche && !regel('alleOrteOffen') && SPIEL.epoche < o.abEpoche)) {
    const m = MISSIONEN[anf.mission], rest = anf.bis - SPIEL.tag;
    aktionen = TX`<div class="anfrage-box"><span class="label">${anf.art === 'verbund' ? TX`Anfrage · Verbund ${CLUSTER[anf.verbund].name}` : TX('Seltene Gelegenheit')}</span>
      <b>${esc(m.titel)}</b><p class="note">${esc(anfrageText(anf))} ${esc(rest === 1 ? TX('Nur noch heute.') : TX`Noch ${rest} Tage.`)}</p>
      <button class="btn" data-a="anfrage" type="button">Annehmen und hinreisen · 1 Tag</button></div>` + aktionen;
  }
  if (o.handel) {
    if ((SPIEL.beziehungen[id] || 0) < 0) aktionen += TX('<p class="note">Sie wollen nicht mit dir handeln. Vielleicht hilft eine Kirche, die euer Ansehen verbessert.</p>');
    else aktionen += TX('<button class="btn" data-a="handeln" type="button">Hinreisen und handeln · 1 Tag</button>');
  }
  if (id === 'wald' && siege > 0 && !SPIEL.aussenposten.wald) {
    const frei = dorfWerte().frei >= AUSSENPOSTEN.arbeiter;
    aktionen += TX`<div class="aussenposten"><b>Außenposten bauen</b><p class="note">+${AUSSENPOSTEN.proTag.holz} Holz, +${AUSSENPOSTEN.proTag.stein} Stein, +${AUSSENPOSTEN.proTag.nahrung} Nahrung pro Tag · ${kostenHtml(AUSSENPOSTEN.kosten)} · ${AUSSENPOSTEN.arbeiter} Arbeiter</p>
      <button class="btn small" data-a="posten" type="button" ${kannBezahlen(AUSSENPOSTEN.kosten) && frei ? '' : 'disabled'}>Bauen</button></div>`;
  }
  if (id === 'wald' && SPIEL.aussenposten.wald) aktionen += TX`<p class="note">Dein Außenposten liefert jeden Tag ${AUSSENPOSTEN.proTag.holz} Holz, ${AUSSENPOSTEN.proTag.stein} Stein und ${AUSSENPOSTEN.proTag.nahrung} Nahrung.</p>`;
  p.innerHTML = `<div class="label">${o.geheim ? TX('Geheimmission') : o.gefahr ? TX`Gefahr ${o.gefahr} von 5` : TX('Sicher')}</div>
    <h2>${esc(o.name)}</h2>
    ${o.gefahr ? `<div class="pips">${'■'.repeat(o.gefahr)}<span>${'■'.repeat(5 - o.gefahr)}</span></div>` : ''}
    <p class="story">${esc(o.text)}</p>
    ${zeilen.length ? '<dl class="facts">' + zeilen.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('') + '</dl>' : ''}
    <div class="karte-aktionen">${aktionen}</div>`;
  const q = s => p.querySelector(s);
  if (q('[data-a="heim"]')) q('[data-a="heim"]').addEventListener('click', weltkarteSchliessen);
  if (q('[data-a="reisen"]')) q('[data-a="reisen"]').addEventListener('click', () => reiseBeginnen(id));
  if (q('[data-a="anfrage"]')) q('[data-a="anfrage"]').addEventListener('click', () => reiseBeginnen(id, anfrageAnnehmen(id)));
  if (q('[data-a="posten"]')) q('[data-a="posten"]').addEventListener('click', () => {
    bezahlen(AUSSENPOSTEN.kosten); SPIEL.aussenposten.wald = true; spielSpeichern(); geraeusch('bauen');
    meldung(TX('Außenposten im dunklen Wald'), TX('Er liefert ab morgen Rohstoffe'), 2000); weltkarteZeigen();
  });
  if (q('[data-a="handeln"]')) q('[data-a="handeln"]').addEventListener('click', () => handelsreise(id));
  p.querySelectorAll('[data-strom]').forEach(b => b.addEventListener('click', () => stromLieferung(Number(b.dataset.strom))));
}

// ---------------------------------------------------------------------
// Handel in den Nachbardörfern: hinreisen (ein Tag vergeht), mehrere Händler
// ---------------------------------------------------------------------
function handelsPreis(gib, ort) {
  const depot = SPIEL.gebaeude.find(b => b.typ === 'lastlaeuferdepot');
  const rel = SPIEL.beziehungen[ort] || 0, mal = (rel >= 3 ? 0.8 : rel >= 1 ? 0.9 : 1) * (clusterUnser('logistik') ? 0.9 : clusterFeind('logistik') ? 1.15 : 1) * (depot ? stufeVon(depot).handel : 1) * (MARKT_AKTIV ? marktRabatt() : 1);
  const k = {};
  for (const r in gib) k[r] = Math.max(1, Math.round(gib[r] * mal));
  return k;
}
function handelsreise(ort) {
  document.getElementById('weltkarte').hidden = true;
  const erst = !(SPIEL.karte.besucht[ort] || 0);
  SPIEL.karte.besucht[ort] = (SPIEL.karte.besucht[ort] || 0) + 1;
  // Mit Lastläufer-Depot holen die Lastläufer die Ware: Es vergeht kein Tag
  const bericht = gebaeudeWert('depot') === true ? [TX('Die Lastläufer aus dem Depot holen die Ware. Dafür vergeht kein Tag.')] : tagVergeht();
  spielSpeichern(); dorfHudAktualisieren();
  const vorrat = {};   // jedes Angebot gibt es dreimal pro Besuch
  const markt = () => handelZeigen(ort, vorrat, bericht);
  if (erst && ERSTEINDRUCK[ort]) gespraechZeigen(TX`Erster Besuch in ${ORTE[ort].name}`, ERSTEINDRUCK[ort], markt);
  else markt();
}
// fertig: Auf dem Markt von Altbrück geht es danach zurück auf den Platz statt nach Hause
function handelZeigen(ort, vorrat, bericht, fertig) {
  const rel = SPIEL.beziehungen[ort] || 0;
  const text = k => Object.keys(k).map(r => `<span class="kost">${k[r]}${rsym(r, r === 'einwohner' ? TX('Einwohner') : null)}</span>`).join(' + ');
  const platz = dorfWerte().platz - SPIEL.einwohner;
  const haendler = HAENDLER[ort].map((h, hi) => {
    const zu = h.braucht && rel < h.braucht;
    return `<div class="haendler"><b>${esc(h.name)}</b><p class="note">${esc(zu ? TX('Mit Fremden machen wir solche Geschäfte nicht. Werdet erst mal freundlich mit uns.') : h.text)}</p>
      ${zu ? '' : h.angebote.map((a, ai) => {
        const key = hi + '-' + ai, rest = vorrat[key] === undefined ? 3 : vorrat[key], gib = handelsPreis(a.gib, ort);
        const voll = a.nimm.einwohner && platz < a.nimm.einwohner;
        return `<button class="btn small ghost" type="button" data-h="${key}" ${rest > 0 && kannBezahlen(gib) && !voll ? '' : 'disabled'}>${text(gib)} → ${text(a.nimm)}<small>${voll ? TX('kein Wohnraum') : TX`noch ${rest}×`}</small></button>`;
      }).join('')}</div>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="hd">
    <div class="label">Tag ${SPIEL.tag} · Beziehung: ${esc(beziehungText(rel))}${rel >= 1 ? TX(' · bessere Preise') : ''}</div>
    <h1 id="hd">${ort === 'karawane' ? TX('Die Karawane Rostrot') : fertig ? esc(TX`Stand aus ${ORTE[ort].name}`) : esc(TX`Markttag in ${ORTE[ort].name}`)}</h1>
    <p class="note">Du hast ${vorratHtml(['gold', 'holz', 'stein', 'nahrung', 'holzkohle', 'teile'])}. Jeder Handel verbessert eure Beziehung.</p>
    ${vorrat.bilanz && Object.keys(vorrat.bilanz).length ? TX`<p class="note">Heute gehandelt: ${bilanzHtml(vorrat.bilanz)}</p>` : ''}
    <div class="haendler-liste">${haendler}</div>
    ${bericht && bericht.length ? tagesberichtHtml(bericht, TX('Daheim ist ein Tag vergangen')) : ''}
    <button class="btn" data-a="heim" type="button">${fertig ? TX('Zurück auf den Platz') : ort === 'karawane' ? TX('Fertig') : TX('Heimreisen')}</button>
  </div>`);
  overlay.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => {
    const [hi, ai] = b.dataset.h.split('-').map(Number), a = HAENDLER[ort][hi].angebote[ai], gib = handelsPreis(a.gib, ort);
    if (!kannBezahlen(gib)) return;
    bezahlen(gib);
    if (a.nimm.einwohner) SPIEL.einwohner += a.nimm.einwohner;
    gutschreiben(Object.fromEntries(Object.entries(a.nimm).filter(([r]) => r !== 'einwohner')));
    // Bilanz des Markttags: was rein- und rausging
    const bil = vorrat.bilanz = vorrat.bilanz || {};
    for (const r in gib) bil[r] = (bil[r] || 0) - gib[r];
    for (const r in a.nimm) bil[r] = (bil[r] || 0) + a.nimm[r];
    dorfHudAktualisieren();
    vorrat[b.dataset.h] = (vorrat[b.dataset.h] === undefined ? 3 : vorrat[b.dataset.h]) - 1;
    SPIEL.beziehungen[ort] = Math.min(5, rel + 0.3);
    // Auf dem Markt steigt dazu das Ansehen (nur die ersten Geschäfte am Tag zählen)
    if (fertig && G && G.auftrag && G.auftrag.handel < MARKT.ansehen.maxHandelProBesuch) { G.auftrag.handel++; marktAnsehen(MARKT.ansehen.handel); }
    spielSpeichern(); geraeusch('muenze');
    handelZeigen(ort, vorrat, bericht, fertig);
  }));
  // Heimreisen führt ins Dorf, nicht zurück auf die Karte
  overlay.querySelector('[data-a="heim"]').addEventListener('click', () => {
    if (fertig) return fertig();
    overlayWeg(); weltkarteSchliessen(); dorfHudAktualisieren();
    if (vorrat.bilanz && Object.keys(vorrat.bilanz).length) meldung(TX`Zurück aus ${ORTE[ort].name}`, Object.keys(vorrat.bilanz).filter(r => vorrat.bilanz[r]).map(r => (vorrat.bilanz[r] > 0 ? '+' : '') + vorrat.bilanz[r] + ' ' + (ROHSTOFF_NAME[r] || TX('Einwohner'))).join(' · '), 3200);
    nachRueckkehr();
  });
}
function beziehungText(w) {
  if (w <= -2) return TX('feindselig');
  if (w < 0) return TX('misstrauisch');
  if (w < 1) return TX('neutral');
  if (w < 3) return TX('freundlich');
  return TX('verbündet');
}

// ---------------------------------------------------------------------
// Reise: Ereignis, Nachrichten, Briefing, Mission
// ---------------------------------------------------------------------
function reiseBeginnen(ort, mission) {
  REISE = { ort, leben: 1, mission: mission || null };
  document.getElementById('weltkarte').hidden = true;
  // Ob unterwegs etwas passiert, wird einmal pro Tag und Ort ausgewürfelt (der Späher kann es vorher sehen)
  const e = reiseEreignisFuer(ort);
  if (e) ereignisZeigen(e);
  else nachrichtenZeigen();
}

function ereignisZeigen(e) {
  const optionen = e.optionen.map((o, i) => `<button class="btn${i ? ' ghost' : ''}" data-o="${i}" type="button" ${o.kosten && !kannBezahlen(o.kosten) ? 'disabled' : ''}>${esc(o.text)}</button>`).join('');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ev">
    <div class="label">Unterwegs nach ${esc(ORTE[REISE.ort].name)}</div>
    <h1 id="ev">${esc(e.titel)}</h1>
    <p class="story">${esc(e.text)}</p>
    <div class="ereignis-optionen">${optionen}</div>
  </div>`);
  overlay.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
    const o = e.optionen[Number(b.dataset.o)];
    if (o.kosten) bezahlen(o.kosten);
    let folge = o.folge;
    if (o.zufall) { let z = Math.random(); folge = o.zufall.find(f => (z -= f.chance) < 0).folge || o.zufall[0].folge; }
    const zeilen = folgeAnwenden(folge);
    spielSpeichern();
    overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ev2">
      <div class="label">${esc(e.titel)}</div>
      <h1 id="ev2">${esc(o.text.replace(/ \(.*\)$/, ''))}</h1>
      <p class="story">${esc(folge.text)}</p>
      ${zeilen.length ? '<ul class="folgen">' + zeilen.map(z => `<li>${esc(z)}</li>`).join('') + '</ul>' : ''}
      <button class="btn" data-a="weiter" type="button">Weiterreisen</button>
    </div>`);
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', nachrichtenZeigen);
  }));
}

function folgeAnwenden(f) {
  const z = [];
  ['gold', 'holz', 'stein', 'nahrung', 'teile'].forEach(r => { if (f[r]) { SPIEL[r] = Math.max(0, SPIEL[r] + f[r]); z.push((f[r] > 0 ? '+' : '') + f[r] + ' ' + ROHSTOFF_NAME[r]); } });
  if (f.leben) { REISE.leben = Math.min(REISE.leben, f.leben); z.push(TX`Du beginnst die Mission mit ${Math.round(f.leben * 100)} % Leben`); }
  if (f.beziehung) Object.keys(f.beziehung).forEach(o => {
    SPIEL.beziehungen[o] = (SPIEL.beziehungen[o] || 0) + f.beziehung[o];
    if (f.beziehung[o]) z.push((f.beziehung[o] > 0 ? TX`${ORTE[o].name}: Beziehung besser` : TX`${ORTE[o].name}: Beziehung schlechter`));
  });
  if (f.entdecken && !SPIEL.karte.bekannt.includes(f.entdecken)) { SPIEL.karte.bekannt.push(f.entdecken); z.push(TX('Neu auf der Karte: ') + ORTE[f.entdecken].name); }
  if (f.lore && chronikEintragen(f.lore)) z.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === f.lore).titel);
  return z;
}

// Nachrichten wie Funksprüche, eine nach der anderen
function nachrichtenZeigen() {
  const ort = REISE.ort, erst = !(SPIEL.karte.besucht[ort] || 0);
  if (!regel('nachrichten')) { missionsBriefing(ort); return; }
  if (erst && ERSTEINDRUCK[ort] && !REISE.eindruck) { REISE.eindruck = true; gespraechZeigen(TX('Erster Besuch: ') + ORTE[ort].name, ERSTEINDRUCK[ort], nachrichtenZeigen); return; }
  let liste = REISE.mission ? NACHRICHTEN[REISE.mission] : NACHRICHTEN[ort + '_erst'] && erst ? NACHRICHTEN[ort + '_erst'] : NACHRICHTEN[ort];
  if (liste && Array.isArray(liste[0][0])) {
    const passend = liste.filter(g => g.every(([wer]) => figurDa(wer)));
    liste = passend.length ? passend[Math.floor(Math.random() * passend.length)] : null;
  }
  if (!liste || (!erst && Math.random() < 0.4)) { missionsBriefing(ort); return; }
  let i = 0;
  const zeige = () => {
    const [wer, text] = liste[i], p = PERSONEN[wer];
    overlayZeigen(TX`<div class="card panel nachricht" role="dialog" aria-labelledby="na">
      <div class="label">Nachricht ${i + 1} von ${liste.length}</div>
      <div class="nachricht-zeile">
        <canvas class="portrait" width="18" height="27" aria-hidden="true" style="border-color:${p.farbe}"></canvas>
        <div class="nachricht-text"><b id="na" style="color:${p.farbe}">${esc(p.name)}</b><span class="label">${esc(p.rolle)}</span><p class="${wer === 'funk' ? 'funk' : ''}">${esc(text)}</p></div>
      </div>
      <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">${i < liste.length - 1 ? TX('Weiter') : TX('Zur Mission')}</button>
      <button class="btn ghost" data-a="ueberspringen" type="button">Überspringen</button></div>
    </div>`);
    portraitMalen(overlay.querySelector('.portrait'), wer);
    geraeusch('klick');
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => { i++; if (i < liste.length) zeige(); else missionsBriefing(ort); });
    overlay.querySelector('[data-a="ueberspringen"]').addEventListener('click', () => missionsBriefing(ort));
  };
  zeige();
}
function portraitMalen(c, wer) {
  if (neueGrafik() && neuesPortrait(c, wer === 'erzaehler' && SPIEL && SPIEL.klasse ? '@held' : wer)) return;
  // Der Erzähler ist der Spieler selbst: dann zeigt das Bild die eigene Klasse
  if (wer === 'erzaehler' && SPIEL && SPIEL.klasse) {
    const w = aktuelleWaffe(), q = BILD.held[bildKlasse(SPIEL.klasse)][w.bild] || Object.values(BILD.held[bildKlasse(SPIEL.klasse)])[0];
    c.width = 24; c.height = 30;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0812'; g.fillRect(0, 0, 24, 30);
    g.drawImage(q.stand.quelle, 4, 0, 24, 30, 0, 1, 24, 30);
    return;
  }
  const g = c.getContext('2d');
  g.fillStyle = '#0a0812'; g.fillRect(0, 0, c.width, c.height);
  const n = PERSONEN[wer].bild, quelle = n === null || n === undefined ? null : BILD.bewohner[n][0];
  if (quelle) g.drawImage(quelle.quelle, 0, 2);
  else { g.drawImage(BILD.teil.quelle, 4, 7, 9, 9); for (let y = 0; y < 27; y += 2) { g.fillStyle = 'rgba(95,240,224,0.12)'; g.fillRect(0, y, 18, 1); } }
}

// Chronik: alle gefundenen Lore-Fragmente
// Die Chronik: nach Kapiteln, jeder Eintrag in seiner Stimme, mit Randnotizen und Hinweisen auf das, was noch fehlt
const CHRONIK_STIMME = { ebert: TX('aufgeschrieben vom alten Ebert'), mara: TX('erzählt von Mara'), anselm: TX('erzählt von Bruder Anselm'), fund: TX('Fundstück'), funk: TX('Funkspruch'), fuchs: TX('Zettel des Fuchses'), kustos: TX('Antwort von KUSTOS') };
function chronikNeu() { return SPIEL.chronik.filter(id => !(SPIEL.chronikGelesen || []).includes(id)).length; }
function chronikZeigen(zurueck, kapitel) {
  const gelesen = SPIEL.chronikGelesen || [];
  const gefunden = id => SPIEL.chronik.includes(id);
  const wahl = kapitel || (KAPITEL.find(k => LORE.some(l => l.kapitel === k.id && gefunden(l.id) && !gelesen.includes(l.id))) || KAPITEL[0]).id;
  const reiter = KAPITEL.map(k => {
    const alle = LORE.filter(l => l.kapitel === k.id), n = alle.filter(l => gefunden(l.id)).length, neu = alle.some(l => gefunden(l.id) && !gelesen.includes(l.id));
    return `<button type="button" class="chronik-reiter${k.id === wahl ? ' aktiv' : ''}${neu ? ' neu' : ''}" data-kapitel="${k.id}">${esc(k.titel)} <small>${n}/${alle.length}</small></button>`;
  }).join('');
  const K = KAPITEL.find(k => k.id === wahl);
  const eintrag = l => {
    if (!gefunden(l.id)) return `<div class="chronik-eintrag leer"><b>???</b><p>${esc(loreHinweis(l) || TX('Noch nicht gefunden.'))}</p></div>`;
    const p = PERSONEN[l.wer], stimme = CHRONIK_STIMME[l.wer] || '';
    const notizen = (l.nachtrag || []).filter(n => n.wenn()).map(n => `<p class="nachtrag"><span class="label">${esc(TX('Randnotiz von Ebert'))}</span>${esc(n.text)}</p>`).join('');
    return `<div class="chronik-eintrag stimme-${l.wer}">
      <div class="chronik-kopf"><b>${esc(l.titel)}</b>${gelesen.includes(l.id) ? '' : `<span class="chronik-neu">${esc(TX('Neu'))}</span>`}</div>
      <span class="label chronik-stimme"${p ? ` style="color:${p.farbe}"` : ''}>${esc(stimme)}</span>
      <p class="chronik-text">${esc(l.text)}</p>${notizen}</div>`;
  };
  overlayZeigen(TX`<div class="card panel chronik-karte" role="dialog" aria-labelledby="ch">
    <div class="label">${SPIEL.chronik.length} von ${LORE.length} Einträgen${endenGefunden().length ? TX` · Enden gefunden: ${endenGefunden().length} von ${Object.keys(ENDEN).length}` : ''}</div>
    <h1 id="ch">Chronik</h1>
    <p class="note">Was der alte Ebert über die Welt zusammengetragen hat, und was andere dazugelegt haben. Manche Einträge bekommen später Randnotizen.</p>
    <div class="chronik-reiterleiste">${reiter}</div>
    <p class="note chronik-kapiteltext">${esc(K.text)}</p>
    <div class="chronik">${LORE.filter(l => l.kapitel === wahl).map(eintrag).join('')}</div>
    <button class="btn" data-a="zu" type="button">Schließen</button>
  </div>`);
  // Was jetzt zu sehen war, gilt als gelesen
  SPIEL.chronikGelesen = gelesen.concat(LORE.filter(l => l.kapitel === wahl && gefunden(l.id) && !gelesen.includes(l.id)).map(l => l.id));
  spielSpeichern();
  overlay.querySelectorAll('[data-kapitel]').forEach(b => b.addEventListener('click', () => { geraeusch('klick'); chronikZeigen(zurueck, b.dataset.kapitel); }));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { if (zurueck) zurueck(); else overlayWeg(); });
}

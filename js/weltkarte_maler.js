// =====================================================================
// WELTKARTE, MALER: malt das Tal aus WK.gelaende in der Pixelgrafik des Spiels (Endfassung F).
// Grundbild je Palette (Tag, Abend, Nacht) einmal, stückweise im Leerlauf vorbereitet;
// Wege, Ortsbilder und Nebel je nach Spielstand darüber. Der Tag läuft von selbst
// (ein Tag = 10 Minuten), zwischen Morgen, Tag, Abend und Nacht wird weich überblendet.
// Vorlage: docs/weltkarte-entwuerfe-6 (pixelland.js, tageszeit.js).
// =====================================================================
'use strict';
const PL = {}, TZ = {};
(function () {   // eigener Bereich, damit keine Namen mit dem Spiel zusammenstoßen
PL.hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
PL.PALETTEN = {
  tag: {
    wiese: ['#4a6a3a', '#527444', '#425e34'], wald: ['#1e3a24', '#244428', '#1a321e', '#2c4e2e'],
    fels: ['#5a5868', '#666478', '#4c4a5a'], schnee: ['#d8dce8', '#eef2f8', '#c0c6d6'],
    feld: [['#b09a4a', '#c4ac56'], ['#6a8a3a', '#7a9a44'], ['#7a5a3a', '#6a4c30']],
    stadt: ['#4a4856', '#55525f', '#3e3c48'], industrie: ['#5a5652', '#625e58', '#4e4a46'],
    tagebau: ['#7a4a30', '#8a5a3a', '#6a3e28'], wasser: ['#2e5a8a', '#3a6a9a'], rot: ['#8a3a26', '#a8482a'], ufer: ['#8a7a5a'],
    baumDunkel: '#1e3e26', baumHell: '#2c5430', baumLicht: '#4a7a3e', baumSchatten: '#0e1e12',
    strasse: ['#c8a46a', '#a88a54'], pfad: '#b89a64', ueberWasser: ['#7a5a3a', '#5a4028'], nebel: [14, 12, 22],
    heide: ['#7a7448', '#86804e', '#6c6640'], aue: ['#3e7a4a', '#468452', '#367042'], krater: ['#2e2a36', '#3a3442', '#24202c'],
    birkenwald: ['#3a5a32', '#426438', '#34522e', '#4a6c3c'],   // heller Boden unter den Birken
  },
  // Abendlicht: wärmer, Schatten violett, Wege staubig graurosa (Gold bleibt der Auswahl)
  abend: {
    wiese: ['#5a6438', '#636c3e', '#4e5832'], wald: ['#22342a', '#28392c', '#1c2c24', '#30442e'],
    fels: ['#6a5a66', '#786672', '#5a4c5a'], schnee: ['#f0d8d0', '#ffe8de', '#d8bcc0'],
    feld: [['#c49a48', '#d8ae54'], ['#7e8a3a', '#8e9a44'], ['#8a5a38', '#7a4c30']],
    stadt: ['#4e4458', '#5a4e62', '#423a4c'], industrie: ['#665450', '#705c56', '#584844'],
    tagebau: ['#8a4a2c', '#9a5a36', '#783e26'], wasser: ['#3a5a8a', '#5a72a0'], rot: ['#9a3a26', '#b8502e'], ufer: ['#9a7a58'],
    baumDunkel: '#22382a', baumHell: '#34502e', baumLicht: '#7a7a3e', baumSchatten: '#140e18',
    strasse: ['#b49c8c', '#8a7468'], pfad: '#a48e80', ueberWasser: ['#6a4e3e', '#4e382c'], nebel: [22, 12, 26],
    heide: ['#8a7044', '#967a4a', '#7a623c'], aue: ['#4a6a40', '#527446', '#425e3a'], krater: ['#30243a', '#3c2e46', '#261c30'],
    birkenwald: ['#46543a', '#4e5c3e', '#404e34', '#566442'],
  },
  // Nacht: Mondlicht, jede Bodenart behält ihren Ton; Bäume, Wege und feste Farben bekommen PL.nachtTon
  nacht: {
    wiese: ['#2a4436', '#2f4a3b', '#253c30'], wald: ['#122220', '#152824', '#0f1c1a', '#1a302a'],
    fels: ['#3e4458', '#4a5068', '#363c50'], schnee: ['#a8b8d8', '#c4d2ee', '#90a0c4'],
    feld: [['#5c5a44', '#686650'], ['#34483a', '#3c5242'], ['#4a3c3a', '#403434']],
    stadt: ['#2a2c40', '#313349', '#24263a'], industrie: ['#34343e', '#3a3a46', '#2c2c36'],
    tagebau: ['#4e3436', '#5a3a3c', '#422c30'], wasser: ['#1c3868', '#3a5e96'], rot: ['#4e2430', '#62303a'], ufer: ['#4a4a56'],
    baumDunkel: '#1e3e26', baumHell: '#2c5430', baumLicht: '#4a7a3e', baumSchatten: '#0e1e12',
    strasse: ['#787088', '#5e5872'], pfad: '#6a6480', ueberWasser: ['#463a4e', '#342c3e'], nebel: [6, 8, 18],
    heide: ['#4c4658', '#554e62', '#433d4e'], aue: ['#1a433f', '#1f4b46', '#163a37'], krater: ['#1a1622', '#221c2c', '#14101a'],
    birkenwald: ['#203a34', '#243f38', '#1c342e', '#2a463e'],
  },
};

// Grundbild (als Generator, stückweise): Gelände, Bäume, Berge, Stadt, Werke, Kleinigkeiten.
// o: { seed, palette, relief (Licht für Hang- und Schlagschatten), ton (Farbe fester Teile, nachts) }
PL.grundMalenG = function* (o = {}) {
  const W = WK.W, H = WK.H, G = WK.gelaende, P = PL.PALETTEN[o.palette || 'tag'];
  const F = {}; for (const k in P) F[k] = Array.isArray(P[k]) ? P[k].map(v => Array.isArray(v) ? v.map(PL.hex) : typeof v === 'string' ? PL.hex(v) : v) : P[k];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: !!o.ton }), img = g.createImageData(W, H), d = img.data, art = new Array(W * H);
  const { n2, n3 } = G, r = WK.zufall(o.seed || 5);
  const DK = WK.DEKO, SX0 = DK.stadtX0, SY0 = DK.stadtY0;
  const RF = o.relief ? yield* PL.reliefG(o.relief) : null;   // Hangschatten, Höhenstufen, Schlagschatten
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H, i = y * W + x;
      let a = G.art(x, y), col;
      if (a === 'wasser') col = F.wasser[(x + y) % 5 === 0 ? 1 : 0];
      else if (a === 'rotwasser') col = F.rot[(x + y) % 4 === 0 ? 1 : 0];
      else if (a === 'stadt') {
        const strasse = ((x - SX0 + Math.floor(y * 0.25)) % 22 + 22) % 22 < 2 || (y % 18) < 2;
        if (strasse) { a = 'gasse'; col = (x * 7 + y * 3) % 11 === 0 ? PL.hex('#4a4a3a') : PL.hex('#2e2c36'); }
        else if (n2(u * 26, v * 26) > 0.66) col = n3(u * 60, v * 60) > 0.5 ? PL.hex('#3a5a34') : PL.hex('#2e4a2a');
        else col = F.stadt[Math.floor(n2(u * 40, v * 40) * 2.99)];
      }
      else if (a === 'industrie') {
        const gleis = Math.abs(((y - 0.18 * x) % 26 + 26) % 26 - 13) < 1;
        col = gleis ? PL.hex('#3a302c') : F.industrie[Math.floor(n3(u * 50, v * 50) * 2.99)];
        if (!gleis && n2(u * 30, v * 30) > 0.7) col = PL.hex('#5a6a3a');   // Unkraut zwischen den Platten
      }
      else if (a === 'tagebau') { const t = Math.floor((Math.hypot(x - WK.ORTE.erzwaesche.x, (y - WK.ORTE.erzwaesche.y) * 1.4) + n2(x / 6, y / 6) * 4) / 4); col = F.tagebau[t % 3]; }
      else if (a === 'schnee') col = F.schnee[Math.floor(n2(u * 30, v * 30) * 2.99)];
      else if (a === 'fels') col = F.fels[Math.floor(n3(u * 25, v * 25) * 2.99)];
      else if (a === 'feld') {
        const parz = Math.floor(n2(Math.floor(x / 14) * 1.7, Math.floor(y / 9) * 1.3) * 2.99);
        col = F.feld[parz][(y % 3 === 0) ? 1 : 0];
        if ((x + Math.floor(y / 3)) % 14 === 0 || y % 9 === 0) col = F.wiese[2];
      }
      else if (a === 'ufer') col = F.ufer[0];
      else if (a === 'wald') col = F.wald[Math.floor(n3(u * 50, v * 50) * 3.99)];
      else if (a === 'birkenwald') col = F.birkenwald[Math.floor(n3(u * 50, v * 50) * 3.99)];
      else if (a === 'heide') col = F.heide[Math.floor(n3(u * 34, v * 34) * 2.99)];
      else if (a === 'aue') col = F.aue[Math.floor(n3(u * 40, v * 40) * 2.99)];
      else if (a === 'krater') { const t = Math.floor((Math.hypot(x - DK.krater[0], (y - DK.krater[1]) * 1.3) + n2(x / 6, y / 6) * 5) / 5); col = F.krater[t % 3]; }
      else col = F.wiese[Math.floor(n3(u * 40, v * 40) * 2.99)];
      if (RF) { const f = (a === 'wasser' || a === 'rotwasser') ? RF.wasser[y * W + x] : RF.faktor[y * W + x]; if (f !== 1) col = PL.toenen(col, f, RF.schattenFarbe, RF.schlag[y * W + x]); }
      art[i] = a;
      const q = i * 4; d[q] = col[0]; d[q + 1] = col[1]; d[q + 2] = col[2]; d[q + 3] = 255;
    }
    if ((y & 7) === 7) yield;
  }
  g.putImageData(img, 0, 0);
  const px = (x, y, f) => { g.fillStyle = f; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const at = (x, y) => art[Math.max(0, Math.min(H - 1, Math.round(y))) * W + Math.max(0, Math.min(W - 1, Math.round(x)))];
  const nahOrt = (x, y, R) => WK.IDS.some(id => Math.hypot(WK.ORTE[id].x - x, WK.ORTE[id].y - y) < R);
  const nahWeg = (x, y, R) => PL.wegLinien().some(pts => WK.abstand(pts, x, y) < R);
  // Baumkronen: Birken nach dem Birkenanteil der Stelle, sonst dunkle Bäume
  const BA = DK.baumArt;   // Anteil einzelner Bäume außerhalb des Waldes
  const baeume = [];   // x, y, Birke (1/0) je Baum, zum Zählen in den Tests
  for (let k = 0; k < 12000; k++) {
    if ((k & 1023) === 1023) yield;
    const x = r() * W, y = r() * H, a0 = at(x, y);
    if (a0 !== 'wald' && a0 !== 'birkenwald' && !(BA[a0] && r() < BA[a0])) continue;
    if (nahOrt(x, y, 13)) continue;
    const birke = r() < DK.birkenAnteil(x, y);
    baeume.push(Math.round(x), Math.round(y), birke ? 1 : 0);
    if (birke) {
      px(x, y - 3, '#8aa84a'); g.fillStyle = '#a8c060'; g.fillRect(x - 1, y - 4, 3, 2); g.fillStyle = '#e8e4d8'; g.fillRect(x, y - 2, 1, 3); px(x, y - 1, '#3a3430');
      continue;
    }
    const dunkel = r() < 0.5;
    g.fillStyle = P.baumSchatten; g.fillRect(x - 1, y, 4, 3);
    g.fillStyle = dunkel ? P.baumDunkel : P.baumHell; g.fillRect(x - 1, y - 1, 3, 3);
    px(x - 1, y - 1, dunkel ? P.baumHell : P.baumLicht);
  }
  // Berggipfel
  for (let k = 0; k < 900; k++) {
    const x = r() * W, y = r() * H, a = at(x, y);
    if ((a !== 'fels' && a !== 'schnee') || nahOrt(x, y, 16) || G.dFluss(x, y) < 8 || G.dBach(x, y) < 6) continue;
    const h = 3 + Math.floor(r() * 6);
    for (let j = 0; j < h; j++) {
      g.fillStyle = a === 'schnee' ? '#f4f8ff' : '#7a788c'; g.fillRect(x - j, y - h + j, j + 1, 1);
      g.fillStyle = a === 'schnee' ? '#aab2c4' : '#3e3c4c'; g.fillRect(x + 1, y - h + j, j, 1);
    }
  }
  yield;
  // Verlassene Stadt: Hochhäuser, zur Mitte höher, Moos und Ranken
  const tuerme = [], fenster = [], kern = { x: DK.stadtKern[0], y: DK.stadtKern[1] };
  for (let by = SY0; by < H + 20; by += 18) for (let bx = SX0; bx < W + 30; bx += 22) {
    const x0 = bx - Math.floor(by * 0.25) + 4 + Math.floor(r() * 6), y0 = by + 16;
    if (at(x0 + 3, y0 - 2) !== 'stadt' || r() < 0.2 || nahOrt(x0 + 3, y0 - 6, 20) || nahWeg(x0 + 3, y0 - 2, 5)) continue;
    const mitte = 1 - Math.min(1, Math.hypot(x0 - kern.x, y0 - kern.y) / 190);
    tuerme.push({ x: x0, y: y0, w: 6 + Math.floor(r() * 7), h: 8 + Math.floor(r() * 10 + mitte * 26), kaputt: r() < 0.55 });
  }
  yield;
  if (o.relief) PL.stempel(g, tg => tuerme.forEach(t => { tg.setTransform(1, 0, o.relief.lx * 1.1, o.relief.ly * 0.9, t.x, t.y); tg.fillRect(0, -t.h, t.w, t.h); }), [8, 14, 40, 105]);
  tuerme.sort((p, q) => p.y - q.y).forEach(t => {
    const { x, y, w, h } = t;
    g.fillStyle = 'rgba(10,8,18,0.45)'; g.fillRect(x + 2, y - 1, w + 2, 3);
    const hh = []; for (let i = 0; i < w; i++) hh.push(h - (t.kaputt ? Math.floor(r() * (i % 3 ? 5 : 2) + (i > w / 2 ? 2 : 0)) : 0));
    hh.forEach((q, i) => { g.fillStyle = i === 0 ? '#82809a' : i >= w - 2 ? '#4a4858' : '#6a687e'; g.fillRect(x + i, y - q, 1, q); });
    for (let wy = y - h + 2; wy < y - 1; wy += 2) for (let wx = x + 1; wx < x + w - 2; wx += 2) if (wy > y - hh[wx - x] + 1) { const an = r() < 0.06; px(wx, wy, an ? '#c8b060' : '#1e1c2a'); if (!an) fenster.push(wx, wy); }   // dunkle Fenster merken (nachts brennen mehr)
    hh.forEach((q, i) => { px(x + i, y - q, '#3a6a34'); if (r() < 0.6) px(x + i, y - q - 1, r() < 0.5 ? '#4e8a36' : '#2e5a2a'); });
    for (let k = 0; k < 2 + h / 6; k++) { const rx = x + Math.floor(r() * w), len = 2 + Math.floor(r() * h * 0.7); for (let i = 0; i < len; i++) px(rx, y - 1 - i, r() < 0.5 ? '#2e5a2a' : '#4e8a36'); }
  });
  yield;
  // Werke: Hallen mit Sägedach, Schlote, Rohre, Schlackehalden
  for (let k = 0; k < DK.werkeAnzahl; k++) {
    const [wx0, ww, wy0, wh] = DK.werke, x = Math.round(wx0 + r() * ww), y = Math.round(wy0 + r() * wh);
    if (at(x, y) !== 'industrie' || nahOrt(x, y, 22) || nahWeg(x, y, 6)) continue;
    const art2 = r();
    if (art2 < 0.45) { const w = 8 + Math.floor(r() * 8); g.fillStyle = '#4a4246'; g.fillRect(x, y - 5, w, 6); for (let i = 0; i < w; i += 3) { g.fillStyle = '#6a5e5a'; g.fillRect(x + i, y - 7, 2, 2); g.fillStyle = '#8a7e6a'; g.fillRect(x + i, y - 7, 1, 1); } g.fillStyle = 'rgba(10,8,18,.4)'; g.fillRect(x + 1, y + 1, w, 2); }
    else if (art2 < 0.65) { g.fillStyle = '#5a3a30'; g.fillRect(x, y - 12, 2, 12); g.fillStyle = '#7e4a3a'; g.fillRect(x, y - 12, 1, 12); g.fillStyle = '#2a2024'; g.fillRect(x, y - 13, 2, 1); }
    else if (art2 < 0.85) { g.fillStyle = '#3a3438'; for (let i = 0; i < 4; i++) g.fillRect(x - i, y - 3 + i, 1 + i * 2, 1); }
    else { g.fillStyle = '#7a7a86'; g.fillRect(x, y, 12, 1); g.fillStyle = '#9a9aa6'; g.fillRect(x, y - 1, 12, 1); g.fillRect(x, y - 3, 1, 3); g.fillRect(x + 11, y - 3, 1, 3); }
  }
  // Ruinen im Tal: Mauerreste und Autowracks, nie auf Orten
  const RA = DK.ruinenArt;
  for (let k = 0; k < DK.ruinen; k++) {
    const x = Math.round(r() * W), y = Math.round(r() * H);
    if (!RA.includes(at(x, y)) || nahOrt(x, y, 22) || nahWeg(x, y, 4)) continue;
    if (r() < 0.6) { g.fillStyle = '#6a6878'; g.fillRect(x, y, 5, 1); g.fillRect(x, y - 3, 1, 3); g.fillStyle = '#8a8898'; g.fillRect(x, y - 3, 1, 1); g.fillStyle = '#4e8a36'; g.fillRect(x + 2, y - 1, 2, 1); }
    else { g.fillStyle = '#8a4e30'; g.fillRect(x, y - 2, 6, 3); g.fillStyle = '#5a3a28'; g.fillRect(x + 1, y - 3, 3, 1); g.fillStyle = '#1a1622'; g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 4, y + 1, 1, 1); }
  }
  yield;
  // Hochspannungsleitung: vom Kraftwerk über das Umspannwerk ins Tal
  DK.leitungen.forEach(l => PL.leitung(g, l));
  // Der gelbe Bus, aus dem ein Baum wächst
  { const [x, y] = DK.bus; g.fillStyle = '#c8a030'; g.fillRect(x, y - 3, 11, 4); g.fillStyle = '#1e1c2a'; for (let i = 1; i < 10; i += 2) g.fillRect(x + i, y - 2, 1, 1); g.fillStyle = '#2c5430'; g.fillRect(x + 3, y - 9, 5, 5); g.fillStyle = '#4a7a3e'; g.fillRect(x + 4, y - 10, 3, 2); g.fillStyle = '#5a3a20'; g.fillRect(x + 5, y - 5, 1, 3); }
  // Laternen der Laternenallee: leuchten noch immer
  for (const [x, y] of DK.laternen) { g.fillStyle = '#4a4858'; g.fillRect(x, y - 5, 1, 5); g.fillStyle = '#5ff0e0'; g.fillRect(x - 1, y - 6, 3, 1); }
  // Wasserfall, wo der Fluss über die Felsstufe fällt
  { const [fx, top, unten] = DK.wasserfall;
    g.fillStyle = '#3e3c4c'; g.fillRect(fx - 7, top - 2, 15, 2);
    for (let y = top; y < unten; y++) for (let dx = -1; dx <= 2; dx++) px(fx + dx, y, (y + dx * 2) % 4 === 0 ? '#ffffff' : (y + dx) % 3 === 0 ? '#a8d0ff' : '#e0f0ff');
    for (let i = 0; i < 30; i++) { const a2 = r() * Math.PI, dd = r() * 7; px(fx + Math.cos(a2) * dd, unten + Math.sin(a2) * dd * 0.6, r() < 0.5 ? '#ffffff' : '#c8e4ff'); } }
  // Kähne, die flussaufwärts vor der Schleuse warten
  for (const [x, y] of WK.kurve(WK.FLUSS, 9).filter(DK.kaehne)) { g.fillStyle = '#5a3a22'; g.fillRect(Math.round(x) - 1, Math.round(y) - 3, 3, 6); g.fillStyle = '#8a5a30'; g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 3, 1); }
  yield* DK.malen(g, { r, at, px, nahOrt, nahWeg, P });   // Schilf, Hecken, Campus, Krater, Grenzen
  // Nachts: alles, was über den Boden gemalt wurde (feste Farben), mit o.ton färben; Lichtfarben bleiben
  if (o.ton) {
    const fin = g.getImageData(0, 0, W, H), f = fin.data;
    for (let q = 0; q < f.length; q += 4) {
      if ((q & 262143) === 0) yield;
      if (f[q] === d[q] && f[q + 1] === d[q + 1] && f[q + 2] === d[q + 2]) continue;
      if (PL.istLicht(f[q], f[q + 1], f[q + 2])) continue;
      const t = o.ton([f[q], f[q + 1], f[q + 2]]); f[q] = t[0]; f[q + 1] = t[1]; f[q + 2] = t[2];
    }
    g.putImageData(fin, 0, 0);
  }
  return { canvas: c, art, at, fenster, baeume };
};
// Brücke (Straße), Steg (Pfad) oder Furt quer über Wasser; q = { x, y, dx, dy, art } aus WK.uebergaenge
PL.uebergang = function (g, q) {
  const l = Math.hypot(q.dx, q.dy) || 1, dx = q.dx / l, dy = q.dy / l, nx = -dy, ny = dx;
  const p = (t, s, f, w = 1, h = 1) => { g.fillStyle = f; g.fillRect(Math.round(q.x + dx * t + nx * s), Math.round(q.y + dy * t + ny * s), w, h); };
  if (q.art === 'bruecke') {
    for (let t = -8; t <= 8; t += 0.5) { for (let s = -1; s <= 1; s += 0.5) p(t, s, Math.abs(t) > 6.5 ? '#4a4858' : '#6a6878'); if (Math.round(t * 2) % 4 === 0) { p(t, -2.5, '#9a98a8'); p(t, 2.5, '#9a98a8'); } }
  } else if (q.art === 'steg') {
    for (let t = -7; t <= 7; t += 0.5) for (let s = -0.5; s <= 0.5; s += 0.5) p(t, s, Math.round(t * 2) % 3 === 0 ? '#5a4028' : '#8a6a42');
  } else {
    for (let t = -7; t <= 7; t += 3.5) { p(t, -0.5, '#8a8898', 2, 2); p(t + 1, 0.5, '#5a5868'); }
  }
};
// Strommasten entlang einer Linie
PL.leitung = function (g, punkte) {
  const pts = WK.kurve(punkte, 2); let rest = 0;
  for (let i = 1; i < pts.length; i++) {
    rest += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const [x, y] = pts[i].map(Math.round);
    if (i % 2 === 0) { g.fillStyle = 'rgba(30,26,40,.55)'; g.fillRect(x, y - 6, 1, 1); }
    if (rest > 16) { rest = 0; g.fillStyle = '#8a8ea0'; g.fillRect(x, y - 7, 1, 7); g.fillRect(x - 2, y - 7, 5, 1); g.fillStyle = '#c0c6d6'; g.fillRect(x, y - 8, 1, 1); }
  }
};
let wegCache = null;
PL.wegLinien = () => wegCache || (wegCache = WK.WEGE.map(WK.wegPunkte));

// Wege, Brücke, Damm, Übergänge, Ortsbilder, Nebel: ändert sich mit dem Spielstand. o: { palette, schlag, ton }
PL.oberMalen = function (c, grund, o = {}) {
  const W = WK.W, H = WK.H, P = PL.PALETTEN[o.palette || 'tag'];
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(grund.canvas, 0, 0);
  const px = (x, y, f) => { g.fillStyle = f; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  WK.WEGE.forEach(w => {
    if (!WK.wegSichtbar(w)) return;
    WK.wegPunkte(w).forEach(([x, y], i) => {
      if (w.art === 'pfad' && i % 4 === 3) return;
      const wasser = grund.at(x, y) === 'wasser' || grund.at(x, y) === 'rotwasser';
      if (w.art === 'strasse') { px(x, y, wasser ? P.ueberWasser[0] : P.strasse[0]); px(x + 1, y, wasser ? P.ueberWasser[1] : P.strasse[1]); }
      else px(x, y, wasser ? P.ueberWasser[0] : P.pfad);
    });
  });
  // Feste Farben (Brücke, Damm, Ortsbilder) bei o.ton auf eigener Ebene malen und färben
  const g0 = g, lage = o.ton ? document.createElement('canvas') : null;
  if (lage) { lage.width = W; lage.height = H; }
  { const g = lage ? lage.getContext('2d') : g0;
  // Die alte Brücke von Altbrück: Pfeiler und Geländer quer über dem Fluss
  { const [x, y] = WK.BRUECKE; g.fillStyle = '#6a6878'; for (let i = -6; i <= 6; i++) { g.fillRect(x + i - 2, y - i * 0.9 - 1, 5, 1); } g.fillStyle = '#9a98a8'; for (let i = -6; i <= 6; i += 2) { g.fillRect(x + i - 3, y - i * 0.9 - 2, 1, 1); g.fillRect(x + i + 3, y - i * 0.9, 1, 1); } }
  // Der Damm der Schleuse
  { const [x, y] = WK.DAMM; g.fillStyle = '#6a6c78'; g.fillRect(x - 3, y - 10, 4, 16); g.fillStyle = '#8a8c98'; g.fillRect(x - 3, y - 10, 1, 16); g.fillStyle = '#c8a030'; g.fillRect(x - 2, y - 2, 2, 2); }
  // Brücken, Stege und Furten, wo sichtbare Wege Wasser queren; Tor des alten Kanals am Abzweig
  WK.WEGE.forEach(w => { if (WK.wegSichtbar(w)) WK.uebergaenge(w).forEach(q => PL.uebergang(g, q)); });
  { const [x, y] = WK.KANAL_TOR; g.fillStyle = '#5a5c68'; g.fillRect(x - 6, y - 4, 2, 6); g.fillRect(x + 5, y - 4, 2, 6); g.fillStyle = '#8a8c98'; g.fillRect(x - 6, y - 4, 1, 6); g.fillRect(x + 5, y - 4, 1, 6);
    g.fillStyle = '#4a3a2c'; g.fillRect(x - 4, y - 2, 9, 3); g.fillStyle = '#6a5038'; g.fillRect(x - 4, y - 2, 9, 1); g.fillStyle = '#c8a030'; g.fillRect(x, y - 1, 2, 1); }
  // Schlagschatten der Ortsbilder, vom Licht weg
  if (o.schlag) PL.stempel(g0, tg => WK.IDS.forEach(id => {
    if (!WK.bekannt(id)) return;
    const q = WK.ORTE[id], t = document.createElement('canvas'); t.width = 48; t.height = 40; WK.symbol(t.getContext('2d'), q.art, 24, 32);
    tg.setTransform(1, 0, o.schlag.lx * 1.1, o.schlag.ly * 0.9, q.x, q.y); tg.drawImage(t, 0, 0, 48, 33, -24, -32, 48, 33);
  }), [8, 14, 40, 105]);
  // Ortsbilder: gesperrte Orte grau
  WK.IDS.forEach(id => {
    if (!WK.bekannt(id)) return;
    const q = WK.ORTE[id];
    g.save(); if (WK.zustandVon(id) === 'gesperrt') g.filter = 'grayscale(1) brightness(0.7)';
    WK.symbol(g, q.art, q.x, q.y); g.restore();
  });
  }
  if (lage) { PL.bildTonen(lage, o.ton); g.drawImage(lage, 0, 0); }
  // Nebel über unbekannten Orten und am Kartenrand
  const N = P.nebel.join(',');
  WK.IDS.forEach(id => {
    if (WK.zustandVon(id) !== 'unbekannt') return;
    const q = WK.ORTE[id], grad = g.createRadialGradient(q.x, q.y, 4, q.x, q.y, 46);
    grad.addColorStop(0, `rgba(${N},0.92)`); grad.addColorStop(1, `rgba(${N},0)`);
    g.fillStyle = grad; g.fillRect(q.x - 50, q.y - 50, 100, 100);
  });
  const rand = g.createRadialGradient(W * 0.45, H * 0.55, H * 0.55, W * 0.45, H * 0.55, W * 0.72);
  rand.addColorStop(0, `rgba(${N},0)`); rand.addColorStop(1, `rgba(${N},0.5)`);
  g.fillStyle = rand; g.fillRect(0, 0, W, H);
};

// ---------------------------------------------------------------------
// Relief: Hangschatten, Höhenstufen und Schlagschatten der Berge als Faktor je Kartenpixel
// cfg: { lx, ly, lz (Richtung ZUM Licht), ueber (Überhöhung), hang, stufe (Kartenpixel je Höhenstufe), schattenFarbe }
// ---------------------------------------------------------------------
PL.E = 8;   // 1 Höheneinheit = 8 Kartenpixel
PL.reliefHoehe = function (x, y) {
  const G = WK.gelaende;
  let h = Math.max(0, G.hoehe(x, y) - 0.4) * 9.5;
  const df = G.dFluss(x, y); if (df < 7) h -= (7 - df) / 7 * 0.6;
  if (G.stadt(x, y) || G.industrie(x, y)) h = Math.min(h, 0.8);
  return h;
};
// Farbe abdunkeln/aufhellen; im Schlagschatten zur Schattenfarbe hin (bläulich, wie Himmelslicht)
PL.toenen = function (col, f, sf, schlag) {
  let c = col.map(k => k * f);
  if (schlag) c = c.map((k, i) => k * 0.82 + sf[i] * 0.18);
  return c.map(k => Math.max(0, Math.min(255, Math.round(k))));
};
const reliefStuecke = {};   // gleiche Lichtangabe nur einmal rechnen (Tag, Morgen und Nacht teilen das Relief)
PL.reliefG = function* (cfg) {
  const key = JSON.stringify(cfg);
  const s = reliefStuecke[key] || (reliefStuecke[key] = WK.stueck(() => reliefNeuG(cfg)));
  while (!s.weiter(performance.now() + 4)) yield;
  return s.holen();
};
PL.reliefFreigeben = () => { for (const k in reliefStuecke) delete reliefStuecke[k]; };
function* reliefNeuG(cfg) {
  const W = WK.W, H = WK.H, N = W * H, E = PL.E, ueber = cfg.ueber || 1;
  const hr = new Float32Array(N);
  for (let y = 0; y < H; y++) { for (let x = 0; x < W; x++) hr[y * W + x] = PL.reliefHoehe(x, y) * E * ueber; if ((y & 15) === 15) yield; }
  const h = (x, y) => hr[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const ll = Math.hypot(cfg.lx, cfg.ly, cfg.lz), L = [cfg.lx / ll, cfg.ly / ll, cfg.lz / ll];
  const lxy = Math.hypot(L[0], L[1]), dx = L[0] / lxy, dy = L[1] / lxy, steig = L[2] / lxy;
  const stufe = cfg.stufe || 12, faktor = new Float32Array(N), wasser = new Float32Array(N), schlag = new Uint8Array(N);
  const band = (x, y) => Math.floor(h(x, y) / stufe);
  let hMax = 0; for (let i = 0; i < N; i++) hMax = Math.max(hMax, hr[i]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, h0 = hr[i];
      // Hang: Normale aus dem Gefälle, Licht im Verhältnis zur Ebene, in sechs Stufen (Pixelstil, keine Verläufe)
      const k = (cfg.hang || 1) / 2, gx = (h(x + 1, y) - h(x - 1, y)) * k, gy = (h(x, y + 1) - h(x, y - 1)) * k, nl = Math.hypot(gx, gy, 1);
      const lam = Math.max(0, (-gx * L[0] - gy * L[1] + L[2]) / nl) / L[2];
      let f = lam < 0.45 ? 0.62 : lam < 0.72 ? 0.76 : lam < 0.9 ? 0.88 : lam < 1.06 ? 1 : lam < 1.18 ? 1.08 : 1.16;
      // Höhenstufen: oben etwas heller, Kante zum Licht hell, Kante vom Licht weg dunkel
      const b0 = band(x, y);
      if (b0 > 0) {
        f *= 1 + Math.min(6, b0) * 0.018;
        if (b0 > band(x - Math.sign(dx), y - Math.sign(dy))) f *= 0.84;
        else if (b0 > band(x + Math.sign(dx), y + Math.sign(dy))) f *= 1.1;
      }
      // Schlagschatten: Strahl zum Licht, liegt Gelände darüber?
      let s = 0;
      if (hMax > h0) for (let t = 2; t < 160; t += 1.5) {
        const zh = h0 + t * steig; if (zh > hMax) break;
        if (h(Math.round(x + dx * t), Math.round(y + dy * t)) > zh + 0.5) { s = 1; break; }
      }
      if (s) { f *= 0.7; schlag[i] = 1; }
      faktor[i] = f; wasser[i] = s ? 0.78 : 1;
    }
    if ((y & 3) === 3) yield;
  }
  return { faktor, wasser, schlag, schattenFarbe: cfg.schattenFarbe || [40, 60, 120] };
}
// Schatten pixelgenau stempeln: zeichne(tg) malt Formen (beliebige Transformation), danach hart abgeschnitten (kein Kantenglätten)
PL.stempel = function (g, zeichne, farbe) {
  const W = WK.W, H = WK.H, t = document.createElement('canvas'); t.width = W; t.height = H;
  const tg = t.getContext('2d'); tg.fillStyle = '#000'; zeichne(tg); tg.setTransform(1, 0, 0, 1, 0, 0);
  const img = tg.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 110) { d[i] = farbe[0]; d[i + 1] = farbe[1]; d[i + 2] = farbe[2]; d[i + 3] = farbe[3]; } else d[i + 3] = 0; }
  tg.putImageData(img, 0, 0); g.drawImage(t, 0, 0);
};

// ---------------------------------------------------------------------
// Tageszeiten im flachen Pixelbild: Lichtfarben, Töne, Nachtlichter
// ---------------------------------------------------------------------
PL.LICHTFARBEN = ['#ffb030', '#ff7a30', '#5ff0e0', '#e0fff8', '#c8b060', '#ffe060', '#e8c040', '#8ad0ff', '#c08a26', '#ffc060', '#ff9a40'];
let lichtRgb = null;
PL.istLicht = function (r, g, b) {
  lichtRgb = lichtRgb || PL.LICHTFARBEN.map(PL.hex);
  for (const f of lichtRgb) if (Math.abs(f[0] - r) < 3 && Math.abs(f[1] - g) < 3 && Math.abs(f[2] - b) < 3) return true;
  return false;
};
// Mondlicht für feste Farben: halb entsättigt, kühl, dunkler (Lichtfarben bleiben unberührt)
PL.nachtTon = c => { const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], m = c.map(k => k * 0.45 + l * 0.55); return [m[0] * 0.5 + 4, m[1] * 0.58 + 6, m[2] * 0.85 + 16].map(k => Math.max(0, Math.min(255, Math.round(k)))); };
// Abend: warmes Licht in den hellen Tönen, violette Schatten in den dunklen
PL.abendTon = c => [c[0] * 1.03 + 8, c[1] * 0.9 + 1, c[2] * 0.76 + 22].map(k => Math.max(0, Math.min(255, Math.round(k))));
// Morgen: kühl, leicht dunstig, Schatten rosa angehoben
PL.morgenTon = c => { const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], m = c.map(k => k * 0.84 + l * 0.16); return [m[0] * 0.88 + 22, m[1] * 0.86 + 16, m[2] * 0.92 + 30].map(k => Math.max(0, Math.min(255, Math.round(k)))); };
// Ein Bild (Canvas) mit fn färben; Lichtfarben und durchsichtige Pixel bleiben
PL.bildTonen = function (c, fn) {
  const g = c.getContext('2d', { willReadFrequently: true }), img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3] || PL.istLicht(d[i], d[i + 1], d[i + 2])) continue;
    const t = fn([d[i], d[i + 1], d[i + 2]]); d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2];
  }
  g.putImageData(img, 0, 0);
};
// Orte, an denen nachts Licht brennt: warm = Feuer und Fenster, lazi = Lazi-Leuchten, bunker = Bunkerlicht
PL.NACHTLICHT = { dorf: ['warm', 1.1, 8], markt: ['warm', 0.8, 6], birkenhain: ['warm', 0.8, 6], eisenfurt: ['warm', 0.8, 6], karawane: ['warm', 0.7, 5], lager: ['warm', 0.7, 5],
  umspannwerk: ['lazi', 0.8, 6], lazifabrik: ['lazi', 1.0, 7], nullbunker: ['bunker', 1.4, 8], planarchiv: ['lazi', 0.6, 5] };
// Nachtlichter ins Pixelbild: Fenster und Feuer an bekannten Orten, dann Lichtschein um jede Lichtquelle,
// in Stufen mit Bayer-Raster (Pixelstil, kein weicher Verlauf). o: { staerke, radius }
PL.nachtLichtMalen = function (c, o = {}) {
  const W = WK.W, H = WK.H, g = c.getContext('2d', { willReadFrequently: true }), r = WK.zufall(7), quellen = [];
  for (const id in PL.NACHTLICHT) {
    if (!WK.ORTE[id] || !WK.bekannt(id)) continue;
    const q = WK.ORTE[id], [art, stark, rad] = PL.NACHTLICHT[id];
    quellen.push([q.x, q.y - 6, art, stark, rad]);
    const n = art === 'warm' ? rad * 2 : rad;
    for (let k = 0; k < n; k++) {
      const a = r() * 6.28, dd = 3 + r() * rad * 1.4, x = Math.round(q.x + Math.cos(a) * dd * 1.3), y = Math.round(q.y + Math.sin(a) * dd * 0.8), f = art === 'warm' ? (r() < 0.5 ? '#ffc060' : '#ff9a40') : '#5ff0e0';
      if (Math.abs(x - q.x) < 13 && y > q.y - 28 && y < q.y + 7) continue;
      g.fillStyle = f; g.fillRect(x, y, 1, 1);
    }
  }
  const L = document.createElement('canvas'); L.width = W; L.height = H;
  const lg = L.getContext('2d', { willReadFrequently: true }); lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.globalCompositeOperation = 'lighter';
  const FARBE = { warm: '255,150,60', lazi: '80,230,215', bunker: '60,220,255' }, k0 = o.staerke || 1;
  const kreis = (x, y, R, rgb, a) => { const gr = lg.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); lg.fillStyle = gr; lg.fillRect(x - R, y - R, 2 * R, 2 * R); };
  quellen.forEach(([x, y, art, stark, rad]) => kreis(x, y, rad * 4.5 * (o.radius || 1), FARBE[art], Math.min(1, 0.5 * stark * k0)));
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) if (PL.istLicht(d[i], d[i + 1], d[i + 2])) kreis(p % W + 0.5, ((p / W) | 0) + 0.5, 7, `${d[i]},${d[i + 1]},${d[i + 2]}`, 0.12 * k0);
  const ld = lg.getImageData(0, 0, W, H).data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const lm = Math.max(ld[i], ld[i + 1], ld[i + 2]); if (lm < 6) continue;
    if (PL.istLicht(d[i], d[i + 1], d[i + 2])) continue;
    const x = p % W, y = (p / W) | 0, q = Math.min(4, Math.floor(lm / 255 * 5 + WK.BAYER[(y & 3) * 4 + (x & 3)])) / 4;
    if (!q) continue;
    for (let k = 0; k < 3; k++) { const cf = ld[i + k] / lm; d[i + k] = Math.min(255, Math.round(d[i + k] * (1 + q * 1.5 * cf) + q * 64 * cf)); }
  }
  g.putImageData(img, 0, 0);
};

// =====================================================================
// Tageslauf: läuft von selbst, ein Tag = 10 Minuten; der Spieler stellt die Tageszeit nicht ein.
// Ein Bild je Tageszeit (Morgen, Tag, Abend, Nacht), alle mit gleicher Lage jedes Pixels; dazwischen wird überblendet.
// TZ.uhr.h ist die Uhrzeit (0–24).
// =====================================================================
TZ.LICHT = { lx: -0.6, ly: -0.5, lz: 0.62, ueber: 1.2, hang: 2.6, stufe: 7 };
// Abend: tiefe Sonne aus Westen, lange Schatten, violette Schattenfarbe
TZ.LICHT_ABEND = { lx: -0.9, ly: 0.15, lz: 0.42, ueber: 1.2, hang: 2.6, stufe: 7, schattenFarbe: [90, 40, 120] };
const lichtVon = pal => (pal === 'abend' ? TZ.LICHT_ABEND : TZ.LICHT);
TZ.PALETTE = { morgen: 'tag', tag: 'tag', abend: 'abend', nacht: 'nacht' };
TZ.HIMMEL = { morgen: '#2c2a3e', tag: '#16201c', abend: '#2a1a30', nacht: '#070a14' };   // Fläche um die Karte
// Stützpunkte des Tageslaufs: [Stunde, Bild]; dazwischen weich überblendet
TZ.STUETZ = [[0, 'nacht'], [4.5, 'nacht'], [6.5, 'morgen'], [8.5, 'tag'], [16.5, 'tag'], [18.5, 'abend'], [19.5, 'abend'], [22, 'nacht'], [24, 'nacht']];
TZ.SPRUNG = { morgen: 6.5, tag: 12, abend: 18.5, nacht: 23 };
TZ.STUNDE_MS = 25000;   // eine Spielstunde = 25 s, ein Tag = 600 s = 10 Minuten
TZ.uhr = { h: 18.5, laeuft: false };

TZ.mischung = function (h) {
  h = ((h % 24) + 24) % 24;
  for (let i = 1; i < TZ.STUETZ.length; i++) {
    const [h0, a] = TZ.STUETZ[i - 1], [h1, b] = TZ.STUETZ[i];
    if (h <= h1) { if (a === b) return { a, b, w: 0 }; const k = (h - h0) / (h1 - h0), w = k * k * (3 - 2 * k); return { a, b, w }; }
  }
  return { a: 'nacht', b: 'nacht', w: 0 };
};
TZ.artBei = h => { const m = TZ.mischung(h); return m.w < 0.5 ? m.a : m.b; };
TZ.anteil = (m, art) => (m.a === art ? 1 - m.w : 0) + (m.b === art && m.b !== m.a ? m.w : 0);
TZ.farbe = (m, tab) => { const a = PL.hex(tab[m.a]), b = PL.hex(tab[m.b]); return '#' + a.map((k, i) => Math.round(k + (b[i] - k) * m.w).toString(16).padStart(2, '0')).join(''); };

// ---- Grundbilder je Palette (nur vom Land abhängig, nicht vom Spielstand): stückweise vorbereitet ----
const grundStuecke = {};
TZ.grundStueck = pal => grundStuecke[pal] || (grundStuecke[pal] = WK.stueck(() => PL.grundMalenG({ seed: 5, palette: pal, relief: lichtVon(pal), ton: pal === 'nacht' ? PL.nachtTon : null })));
TZ.grund = pal => TZ.grundStueck(pal).holen();
// Grenze der Felder: feine grüne Strichlinie (Farbregel: Grün = sicher), nachts gedämpft
let felderPx = null;
function felderRand(c, art) {
  if (!felderPx) {
    felderPx = []; const K = WK.regionKarte(), W = WK.W, H = WK.H, f = WK.RIDS.indexOf('felder');
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; if (K[i] !== f) continue;
      if ((K[i - 1] !== f || K[i + 1] !== f || K[i - W] !== f || K[i + W] !== f) && (x + y) % 4 < 2) felderPx.push(x, y);
    }
  }
  const g = c.getContext('2d'); g.fillStyle = art === 'nacht' ? '#4e8a40' : art === 'abend' ? '#a0d060' : '#8ad860';
  for (let i = 0; i < felderPx.length; i += 2) g.fillRect(felderPx[i], felderPx[i + 1], 1, 1);
}
// ---- Bilder je Tageszeit für den aktuellen Spielstand (schluessel = Zustand aller Orte und Bild des Dorfs) ----
let bildC = {}, bildSchluessel = '';
TZ.schluessel = () => WK.IDS.map(id => WK.zustandVon(id)[0]).join('') + '|' + WK.dorfSchluessel();
TZ.bild = function (art) {
  const s = TZ.schluessel();
  if (s !== bildSchluessel) { bildC = {}; bildSchluessel = s; }
  if (bildC[art]) return bildC[art];
  const c = document.createElement('canvas'), nacht = art === 'nacht', pal = TZ.PALETTE[art], grund = TZ.grund(pal);
  c.getContext('2d', { willReadFrequently: true });
  PL.oberMalen(c, grund, { palette: pal, schlag: nacht ? null : lichtVon(pal), ton: nacht ? PL.nachtTon : null });
  felderRand(c, art);
  if (art === 'morgen') PL.bildTonen(c, PL.morgenTon);
  if (art === 'abend') { PL.bildTonen(c, PL.abendTon); PL.nachtLichtMalen(c, { staerke: 0.15, radius: 0.6 }); }   // erste Feuer am Abend, schwacher Schein
  if (nacht) {
    // nachts brennt in gut jedem siebten Fenster der toten Stadt Licht (eigener Zufall, Lage der Malerei bleibt gleich)
    const g = c.getContext('2d'), r = WK.zufall(23), f = grund.fenster;
    for (let i = 0; i < f.length; i += 2) if (r() < 0.15) { g.fillStyle = r() < 0.6 ? '#c8b060' : '#ffe060'; g.fillRect(f[i], f[i + 1], 1, 1); }
    PL.nachtLichtMalen(c);
  }
  return (bildC[art] = c);
};
TZ.bildFertig = art => TZ.schluessel() === bildSchluessel && !!bildC[art];
// Mischbild zur Uhrzeit h in ziel (768×432)
TZ.mischen = function (ziel, h) {
  const m = TZ.mischung(h), g = ziel.getContext('2d');
  if (ziel.width !== WK.W || ziel.height !== WK.H) { ziel.width = WK.W; ziel.height = WK.H; }
  g.globalAlpha = 1; g.drawImage(TZ.bild(m.a), 0, 0);
  if (m.w > 0.004) { g.globalAlpha = m.w; g.drawImage(TZ.bild(m.b), 0, 0); g.globalAlpha = 1; }
  return m;
};

// ---- Vorbereiten im Leerlauf: Landstriche, Abstandsfelder, Relief und die drei Grundbilder in kleinen Stücken ----
// Nach dem Laden des Spiels, nur wenn der Browser Zeit hat. Wird die Karte vorher geöffnet, rechnet sie den Rest sofort.
TZ.vorbereitung = (function () {
  const reihe = () => [WK.regionStueck, WK.weichStueck, ...WK.gelaende.abstandStuecke, TZ.grundStueck('tag'), TZ.grundStueck('abend'), TZ.grundStueck('nacht')];
  let laeuft = false, fertigMs = 0, t0 = 0;
  const fertig = () => reihe().every(s => s.fertig);
  const aufraeumen = () => { if (fertig()) PL.reliefFreigeben(); };   // Relief braucht nur das Grundbild
  function schritt(frist) {
    const bis = performance.now() + Math.max(2, Math.min(8, frist));
    for (const s of reihe()) { if (s.fertig) continue; if (!s.weiter(bis)) return false; if (performance.now() >= bis) return fertig(); }
    return true;
  }
  const planen = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 400 }) : setTimeout(() => f(null), 40));
  function lauf(deadline) {
    const frist = deadline && deadline.timeRemaining ? deadline.timeRemaining() - 1 : 6;
    if (schritt(frist)) { laeuft = false; fertigMs = Math.round(performance.now() - t0); aufraeumen(); return; }
    planen(lauf);
  }
  return {
    starten() { if (laeuft || fertig()) return; laeuft = true; t0 = performance.now(); planen(lauf); },
    get fertig() { return fertig(); },
    get dauerMs() { return fertigMs; },
    aufraeumen,
  };
})();
})();

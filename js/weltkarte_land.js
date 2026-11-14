// =====================================================================
// WELTKARTE, LAND: das Tal von Altbrück in der Endfassung F (Runde 6, vom Inhaber gewählt).
// Daten und Gelände: Fluss mit Gabelung und altem Kanal nach Süden, Bach, Wege, Landstriche,
// Birkenwald im Westen, Bodenart je Kartenpixel. Gemalt wird in weltkarte_maler.js,
// die Bedienung steht in weltkarte.js. Vorlage: docs/weltkarte-entwuerfe-6 (gemeinsam.js, gemeinsam-f.js).
// Die Lage der Orte kommt aus ORTE (geschichte.js, Anteile 0–1), Zustand und Sichtbarkeit aus dem Spiel.
// Karte 768 × 432 Kartenpixel.
// =====================================================================
'use strict';
const WK = {};
(function () {   // alles Weitere in eigenem Bereich, damit keine Namen mit dem Spiel zusammenstoßen
WK.W = 768; WK.H = 432;

// Orte in Kartenpixeln, aus ORTE (x, y als Anteil der Karte)
WK.ORTE = {};
for (const id in ORTE) WK.ORTE[id] = { x: Math.round(ORTE[id].x * WK.W), y: Math.round(ORTE[id].y * WK.H), art: ORTE[id].art };
WK.IDS = Object.keys(WK.ORTE);

// ---------------------------------------------------------------------
// Stückweise rechnen: Die großen Rechnungen (Landstriche, Relief, Grundbilder) laufen als Generator.
// holen() rechnet sofort zu Ende, weiter(bis) nur bis zur Zeitmarke bis (für das Vorbereiten im Leerlauf).
// ---------------------------------------------------------------------
WK.stueck = function (erzeuger) {
  let gen = null, fertig = false, wert;
  const s = {
    get fertig() { return fertig; },
    weiter(bis) {
      if (fertig) return true;
      if (!gen) gen = erzeuger();
      for (;;) {
        const r = gen.next();
        if (r.done) { fertig = true; wert = r.value; gen = null; return true; }
        if (bis && performance.now() >= bis) return false;
      }
    },
    holen() { s.weiter(0); return wert; },
  };
  return s;
};

// ---------------------------------------------------------------------
// Zufall, Rauschen, Linien
// ---------------------------------------------------------------------
WK.zufall = function (seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
WK.rauschen = function (seed) {
  const r = WK.zufall(seed), g = [];
  for (let i = 0; i < 64 * 64; i++) g.push(r());
  const wert = (x, y) => g[((y & 63) * 64) + (x & 63)];
  const glatt = t => t * t * (3 - 2 * t);
  const einfach = (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = glatt(x - x0), fy = glatt(y - y0);
    const a = wert(x0, y0), b = wert(x0 + 1, y0), c = wert(x0, y0 + 1), d = wert(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y) => einfach(x, y) * 0.6 + einfach(x * 2.3 + 7, y * 2.3 + 3) * 0.28 + einfach(x * 5.1 + 11, y * 5.1 + 5) * 0.12;
};
// Glatte Linie durch Punkte (Catmull-Rom), schritt in Kartenpixeln
WK.kurve = function (punkte, schritt = 2) {
  const p = punkte, aus = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / schritt));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      aus.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  aus.push(p[p.length - 1].slice());
  return aus;
};
WK.wegPunkte = w => { const A = WK.ORTE[w.a], B = WK.ORTE[w.b]; return WK.kurve([[A.x, A.y], ...w.ueber, [B.x, B.y]], 2); };
// Abstand eines Punkts zu einer Linie aus Punkten (für Fluss und Wege)
WK.abstand = function (pts, x, y) {
  let best = 1e9;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0;
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < best) best = d;
  }
  return best;
};
// Weichzeichner (zweimal Kastenunschärfe)
WK.weich = function (src, R) {
  const W = WK.W, H = WK.H;
  const blur = (q, R) => {
    const t = new Float32Array(W * H), o = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -R; x <= R; x++) s += q[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { t[y * W + x] = s / (2 * R + 1); s += q[y * W + Math.min(W - 1, x + R + 1)] - q[y * W + Math.max(0, x - R)]; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -R; y <= R; y++) s += t[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { o[y * W + x] = s / (2 * R + 1); s += t[Math.min(H - 1, y + R + 1) * W + x] - t[Math.max(0, y - R) * W + x]; } }
    return o;
  };
  return blur(blur(src, R), R);
};
WK.BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

// ---------------------------------------------------------------------
// Das Tal (Satz F): Fluss, Kanal, Bach, Brücke, Damm, Wege, Gelände
// ---------------------------------------------------------------------
// Fluss aus den Eisenbergen über den Wasserfall nach Westen; er trennt die Felder vom Dunkelwald
WK.FLUSS = [[522, -6], [523, 40], [521, 90], [508, 124], [485, 150], [452, 172], [412, 188], [368, 200], [320, 208], [268, 214], [222, 220], [180, 226], [140, 228], [100, 228], [56, 226], [-6, 222]];
const flussBreiteF = (x, y, n) => (y < 120 ? 1.6 + y / 120 : 2.6 + Math.min(1, Math.max(0, (480 - x) / 480)) * 2.4 + (n(x / 38, y / 38) - 0.5) * 1.2);
// Roter Bach: aus den Bergen durch Eisenfurt, an der Erzwäsche vorbei nach Osten (ab der Erzwäsche rot)
WK.BACH = [[572, -6], [582, 24], [600, 62], [632, 86], [676, 104], [722, 128], [775, 146]];
WK.BACH_ROT_AB = 676;
WK.BRUECKE = [212, 221];   // die alte Brücke von Altbrück
WK.DAMM = [485, 150];
// Alter Kanal: zweigt in der Mitte nach Süden ab und trennt Felder (Westen) und tote Stadt (Osten)
WK.KANAL = [[266, 208], [264, 236], [257, 262], [240, 288], [224, 316], [215, 350], [210, 390], [207, 440]];
WK.KANAL_TOR = [265, 223];
const kanalBreiteF = (x, y, n) => 3.1 + (n(x / 30, y / 30) - 0.5) * 0.6;
const KANAL_GRENZE = ['felder', 'stadt', 262];
WK.flussLinie = WK.kurve(WK.FLUSS, 3);
WK.bachLinie = WK.kurve(WK.BACH, 3);
WK.kanalLinie = WK.kurve(WK.KANAL, 3);
// Gelände-Formen
const BERG = [660, -30, 230, 190], KUPPE = [326, 108, 60, 45, 0.16], HUEGEL = [[60, 150, 40, 34, 0.3]], KRATER = [724, 404], CAMPUS = [270, 50, 140, 110];
// Birkenwald: Grenzlinie Nord → Süd; westlich davon Birken, östlich dunkler Wald, schmaler Saum
const BIRKENWALD = { grenze: [[152, -6], [142, 60], [134, 120], [140, 170], [150, 236]], saum: 9, wirbel: 14, innen: 0.93, aussen: 0.03 };

// Wege (nur Zeichnung): a, b, art (strasse | pfad), ueber: Zwischenpunkte; furt: Stelle der Furt
WK.WEGE = [
  ['dorf', 'markt', 'strasse', [[146, 272]]],
  ['dorf', 'birkenstrasse', 'strasse', [[104, 240]]],
  ['birkenstrasse', 'birkenhain', 'strasse', [[76, 136]]],
  ['dorf', 'wald', 'pfad', [[136, 250], [158, 190]]],
  ['wald', 'hort', 'pfad', [[226, 76]]],
  ['markt', 'universitaet', 'strasse', [WK.BRUECKE, [246, 184]]],
  ['universitaet', 'planarchiv', 'strasse', [[330, 104]]],
  ['markt', 'lager', 'strasse', [[256, 238]]],
  ['lager', 'stadt', 'strasse', [[314, 292]]],
  ['lager', 'karawane', 'pfad', [[366, 222]]],
  ['lager', 'schleuse', 'pfad', [[380, 232], [456, 190]]],
  ['karawane', 'stadt', 'pfad', [[384, 290]]],
  ['planarchiv', 'eisenfurt', 'pfad', [[450, 70], [520, 66], [556, 54]], [520, 66]],
  ['schleuse', 'umspannwerk', 'strasse', [[506, 200]]],
  ['stadt', 'ersatzteillager', 'strasse', [[366, 378]]],
  ['ersatzteillager', 'kraftwerk', 'strasse', [[495, 384]]],
  ['umspannwerk', 'kraftwerk', 'strasse', [[544, 310]]],
  ['umspannwerk', 'lazifabrik', 'strasse', [[580, 258]]],
  ['lazifabrik', 'erzwaesche', 'pfad', [[668, 196]]],
  ['erzwaesche', 'eisenfurt', 'pfad', [[634, 76]]],
  ['kraftwerk', 'nullbunker', 'pfad', [[646, 384]]],
].map(([a, b, art, ueber, furt]) => Object.assign({ a, b, art, ueber }, furt ? { furt } : {}));

// ---------------------------------------------------------------------
// Zustand der Orte: kommt aus dem Spiel (weltkarte.js setzt WK.zustandVon).
// 'offen', 'gesperrt' (Epoche fehlt), 'unbekannt' (im Nebel), 'weg' (nicht auf der Karte, z. B. die Karawane)
// ---------------------------------------------------------------------
WK.zustandVon = () => 'offen';
WK.bekannt = id => { const z = WK.zustandVon(id); return z === 'offen' || z === 'gesperrt'; };
WK.wegSichtbar = w => WK.bekannt(w.a) && WK.bekannt(w.b);

// ---------------------------------------------------------------------
// Landstriche: Kerne (Voronoi, Ränder verwirbelt). Jeder Landstrich ist ein zusammenhängendes Gebiet.
// ---------------------------------------------------------------------
WK.REGIONEN = {
  felder: { farbe: [176, 154, 74], kerne: [[100, 300], [40, 270], [160, 280], [60, 360], [130, 380], [40, 420], [180, 420], [200, 330]] },
  wald: { farbe: [36, 68, 40], kerne: [[45, 105], [110, 175], [190, 118], [250, 30], [20, 30], [100, 40], [175, 60], [40, 180], [160, 190], [300, 20], [215, 170]] },
  anhoehe: { farbe: [134, 128, 78], kerne: [[270, 150], [380, 70], [326, 112], [360, 150]] },
  fluss: { farbe: [70, 132, 82], kerne: [[190, 240], [320, 226], [410, 204], [485, 150], [260, 228], [370, 214], [450, 176], [130, 236]] },
  stadt: { farbe: [85, 82, 95], kerne: [[300, 360], [240, 300], [250, 400], [340, 410], [380, 300], [400, 360], [300, 280], [230, 360]] },
  werke: { farbe: [98, 94, 88], kerne: [[430, 380], [520, 250], [560, 370], [640, 280], [470, 300], [600, 220], [500, 420], [620, 400], [470, 240], [680, 220]] },
  berge: { farbe: [102, 100, 120], kerne: [[590, 50], [680, 110], [460, 60], [520, 30], [640, 20], [740, 40], [740, 150], [560, 130], [440, 120]] },
  tiefe: { farbe: [58, 52, 66], kerne: [[728, 372], [744, 412], [700, 420], [750, 320]] },
};
WK.RIDS = Object.keys(WK.REGIONEN);
// Birkenhain und die Birkenstraße gehören zum Dunkelwald (Wunsch des Inhabers, Runde 5)
WK.ORT_REGION = { dorf: 'felder', birkenhain: 'wald', birkenstrasse: 'wald', wald: 'wald', hort: 'wald', universitaet: 'anhoehe', planarchiv: 'anhoehe',
  markt: 'fluss', lager: 'fluss', karawane: 'fluss', schleuse: 'fluss', stadt: 'stadt', ersatzteillager: 'werke', umspannwerk: 'werke', kraftwerk: 'werke', lazifabrik: 'werke',
  eisenfurt: 'berge', erzwaesche: 'berge', nullbunker: 'tiefe' };
// Wo die Namen der Landstriche stehen, dazu Ausweichstellen
WK.NAMENSORT = { felder: [64, 380], wald: [196, 78], anhoehe: [330, 140], fluss: [308, 204], stadt: [270, 328], werke: [560, 300], berge: [656, 148], tiefe: [700, 420] };
WK.NAMENSORT_NOCH = { felder: [[150, 340]], fluss: [[380, 240]] };

// x des Kanals je Bildzeile (für die Grenze Felder | tote Stadt)
const kanalX = (function () {
  const kx = new Float32Array(WK.H).fill(NaN), dicht = WK.kurve(WK.KANAL, 1);
  for (const [x, y] of dicht) { const r = Math.round(y); if (r >= 0 && r < WK.H) kx[r] = x; }
  let letzt = NaN; for (let y = 0; y < WK.H; y++) { if (isNaN(kx[y])) kx[y] = letzt; else letzt = kx[y]; }
  return kx;
})();
// Birkenanteil der Bäume (1 = nur Birken, 0 = nur dunkle Bäume); Grenzlinie mit Wirbel, schmaler Mischsaum
const nBi = WK.rauschen(73);
const birkenGrenzeX = y => { const g = BIRKENWALD.grenze; if (y <= g[0][1]) return g[0][0];
  for (let i = 1; i < g.length; i++) if (y <= g[i][1]) { const t = (y - g[i - 1][1]) / (g[i][1] - g[i - 1][1]); return g[i - 1][0] + t * (g[i][0] - g[i - 1][0]); }
  return g[g.length - 1][0]; };
WK.birkenAnteil = (x, y) => {
  const BW = BIRKENWALD, s = (x - birkenGrenzeX(y) + (nBi(x / 22, y / 22) - 0.5) * 2 * BW.wirbel) / BW.saum;   // < 0 Westen (Birken), > 0 Osten (dunkel)
  const t = Math.min(1, Math.max(0, 0.5 - s / 2)), w = t * t * (3 - 2 * t);
  return BW.aussen + (BW.innen - BW.aussen) * w;
};

const nW = WK.rauschen(41);
WK.regionStueck = WK.stueck(function* () {
  const W = WK.W, H = WK.H, kerne = [], karte = new Uint8Array(W * H);
  WK.RIDS.forEach((rid, k) => WK.REGIONEN[rid].kerne.forEach(([x, y]) => kerne.push([x, y, k])));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wx = x + (nW(x / 34, y / 34) - 0.5) * 44, wy = y + (nW(x / 34 + 9, y / 34 + 4) - 0.5) * 44;
      let best = 1e9, k = 0;
      for (const [kx, ky, r] of kerne) { const d = (wx - kx) ** 2 + (wy - ky) ** 2; if (d < best) { best = d; k = r; } }
      karte[y * W + x] = k;
    }
    if ((y & 15) === 15) yield;
  }
  // Felder und tote Stadt teilen sich am Kanal (Wasser = Grenze)
  { const [wR, oR, y0] = KANAL_GRENZE, wI = WK.RIDS.indexOf(wR), oI = WK.RIDS.indexOf(oR);
    for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (karte[i] === wI || karte[i] === oI) karte[i] = x < kanalX[y] ? wI : oI; } }
  WK.IDS.forEach(id => { const o = WK.ORTE[id], k = WK.RIDS.indexOf(WK.ORT_REGION[id]);
    for (let y = Math.max(0, o.y - 24); y < Math.min(H, o.y + 24); y++) for (let x = Math.max(0, o.x - 24); x < Math.min(W, o.x + 24); x++) if (Math.hypot(x - o.x, y - o.y) < 24) karte[y * W + x] = k; });
  yield;
  // Kleine Inseln (abgetrennte Zipfel) dem umgebenden Landstrich zuschlagen: jeder Landstrich bleibt ein Stück
  const seen = new Int32Array(W * H).fill(-1), teile = [];
  for (let i = 0; i < W * H; i++) {
    if ((i & 32767) === 32767) yield;
    if (seen[i] >= 0) continue;
    const k = karte[i], st = [i], px = [], nach = {}; seen[i] = teile.length;
    while (st.length) { const j = st.pop(); px.push(j); const x = j % W, y = (j / W) | 0;
      for (const q of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, y > 0 ? j - W : -1, y < H - 1 ? j + W : -1]) { if (q < 0) continue; if (karte[q] === k) { if (seen[q] < 0) { seen[q] = teile.length; st.push(q); } } else nach[karte[q]] = (nach[karte[q]] || 0) + 1; } }
    teile.push({ k, px, nach });
  }
  const groesstes = {}; teile.forEach((t, n) => { if (groesstes[t.k] === undefined || t.px.length > teile[groesstes[t.k]].px.length) groesstes[t.k] = n; });
  teile.forEach((t, n) => { if (groesstes[t.k] === n) return; const ziel = +Object.entries(t.nach).sort((a, b) => b[1] - a[1])[0][0]; t.px.forEach(j => { karte[j] = ziel; }); });
  return karte;
});
WK.regionKarte = () => WK.regionStueck.holen();
const regIdx = (x, y) => Math.min(WK.H - 1, Math.max(0, Math.round(y))) * WK.W + Math.min(WK.W - 1, Math.max(0, Math.round(x)));
WK.landstrichBei = (x, y) => WK.RIDS[WK.regionKarte()[regIdx(x, y)]];
// Weiche Anteile je Landstrich (für die Höhe, damit Berge und Anhöhe genau ihren Landstrich füllen; Felder für den Waldrand)
WK.weichStueck = WK.stueck(function* () {
  const karte = WK.regionKarte(), N = WK.W * WK.H, c = {};
  for (const r of ['berge', 'anhoehe', 'wald', 'fluss', 'tiefe', 'felder']) {
    const k = WK.RIDS.indexOf(r), f = new Float32Array(N); for (let i = 0; i < N; i++) f[i] = karte[i] === k ? 1 : 0;
    c[r] = WK.weich(f, r === 'felder' ? 3 : 12);
    yield;
  }
  return c;
});
const weichAnteil = (rid, x, y) => WK.weichStueck.holen()[rid][regIdx(x, y)];

// ---------------------------------------------------------------------
// Gelände: Höhe und Bodenart folgen den Landstrichen
// ---------------------------------------------------------------------
WK.gelaende = (function () {
  const n1 = WK.rauschen(3), n2 = WK.rauschen(17), n3 = WK.rauschen(29);
  const glocke = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
  const eben = ['eisenfurt', 'erzwaesche', 'lazifabrik', 'planarchiv', 'universitaet', 'umspannwerk', 'hort', 'birkenhain'];
  function hoehe(x, y) {
    const u = x / WK.W, v = y / WK.H;
    const mB = weichAnteil('berge', x, y), mA = weichAnteil('anhoehe', x, y), mW = weichAnteil('wald', x, y), mF = weichAnteil('fluss', x, y);
    let h = 0.3 + (n1(u * 7, v * 4) - 0.5) * 0.3
      + mB * (0.75 + 0.9 * glocke(x, y, BERG[0], BERG[1], BERG[2], BERG[3])) * (0.55 + 0.6 * n3(u * 13, v * 9) + 0.35 * Math.abs(n2(u * 30, v * 22) - 0.5))   // Eisenberge, zerklüftet
      + mA * (0.22 + KUPPE[4] * glocke(x, y, KUPPE[0], KUPPE[1], KUPPE[2], KUPPE[3]))   // Anhöhe: Hochfläche mit Kuppe
      + mW * 0.16 * (0.5 + n2(u * 12, v * 12))                  // Waldhügel
      - mF * 0.1;                                                // Flusstal liegt tiefer
    for (const [hx, hy, rx, ry, hh] of HUEGEL) h += hh * glocke(x, y, hx, hy, rx, ry);
    const dK = Math.hypot(x - KRATER[0], (y - KRATER[1]) * 1.25);
    h += 0.32 * Math.exp(-(((dK - 50) / 15) ** 2)) - 0.2 * Math.exp(-((dK / 30) ** 2));   // Kraterrand der Tiefe
    for (const id of eben) { const o = WK.ORTE[id], d = Math.hypot(x - o.x, y - o.y); h -= 0.3 * Math.exp(-(d * d) / (2 * 22 * 22)) * (id === 'eisenfurt' || id === 'erzwaesche' || id === 'lazifabrik' ? 2 : 1); }
    for (const [rid, ziel, rx, ry, vor] of [['berge', 0.6, 104, 24, 12], ['tiefe', 0.3, 68, 14, 0]]) { const [nx, ny] = WK.NAMENSORT[rid], w = Math.exp(-(((x - nx) / rx) ** 4 + ((y - ny - vor) / ry) ** 4)); h = h * (1 - w) + ziel * w; }
    return h;
  }
  const stadt = (x, y) => WK.landstrichBei(x, y) === 'stadt';
  const industrie = (x, y) => WK.landstrichBei(x, y) === 'werke';
  function tagebau(x, y) { const o = WK.ORTE.erzwaesche; return Math.hypot((x - o.x - 10) / 1.4, y - o.y + 4) + (n2(x / 9, y / 9) - 0.5) * 10 < 24; }
  function feld(x, y) {
    const dD = Math.hypot(x - WK.ORTE.dorf.x, (y - WK.ORTE.dorf.y) * 1.3), dB = Math.hypot(x - WK.ORTE.birkenhain.x, (y - WK.ORTE.birkenhain.y) * 1.3);
    if (dD < 16 || dB < 13) return false;
    return n1(x / 26 + 3, y / 22) + (n2(x / 9, y / 9) - 0.5) * 0.12 > 0.47;
  }
  // Abstandsfelder zu Fluss, Bach und Kanal, je einmal gerechnet
  const feldAbstand = (linie, R) => WK.stueck(function* () {
    const f = new Float32Array(WK.W * WK.H).fill(R + 1), dicht = WK.kurve(linie, 1);
    let n = 0;
    for (const [px, py] of dicht) {
      for (let y = Math.max(0, Math.floor(py - R)); y <= Math.min(WK.H - 1, py + R); y++) for (let x = Math.max(0, Math.floor(px - R)); x <= Math.min(WK.W - 1, px + R); x++) {
        const d = Math.hypot(x - px, y - py), i = y * WK.W + x; if (d < f[i]) f[i] = d;
      }
      if (++n % 40 === 0) yield;
    }
    return f;
  });
  const fF = feldAbstand(WK.FLUSS, 40), fB = feldAbstand(WK.BACH, 10), fK = feldAbstand(WK.KANAL, 12);
  const dFluss = (x, y) => fF.holen()[regIdx(x, y)];
  const dBach = (x, y) => fB.holen()[regIdx(x, y)];
  const dKanal = (x, y) => fK.holen()[regIdx(x, y)];
  const kanalBreite = (x, y) => kanalBreiteF(x, y, n2);
  const flussBreite = (x, y) => flussBreiteF(x, y, n2);
  function art(x, y) {
    const u = x / WK.W, v = y / WK.H;
    const df = dFluss(x, y), db = dBach(x, y), breite = flussBreite(x, y);
    if (df < breite) return 'wasser';
    const dk = dKanal(x, y), kb = kanalBreite(x, y);
    if (dk < kb) return 'wasser';
    if (db < 1.4 + Math.max(0, x - WK.BACH[0][0]) / 170) return x > WK.BACH_ROT_AB ? 'rotwasser' : 'wasser';
    const r = WK.landstrichBei(x, y), ufer = df < breite + 3 || dk < kb + 2;
    switch (r) {
      case 'berge': {
        if (tagebau(x, y)) return 'tagebau';
        const h = hoehe(x, y);
        if (h > 1.62 + (n3(u * 9, v * 9) - 0.5) * 0.3) return 'schnee';
        if (Math.hypot(x - WK.ORTE.eisenfurt.x, y - WK.ORTE.eisenfurt.y) < 20 + n2(u * 20, v * 20) * 8) return 'wiese';
        return ufer ? 'ufer' : 'fels';
      }
      case 'werke': return ufer ? 'ufer' : 'industrie';
      case 'stadt': return df < 8 || dk < kb + 2.5 ? 'ufer' : 'stadt';   // Kanal: Kaimauer
      case 'tiefe': return 'krater';
      case 'wald': {
        if (ufer) return 'ufer';
        // Rodung um Birkenhain: kleine Felder und Wiese mitten im Wald
        const o = WK.ORTE.birkenhain, dB = Math.hypot(x - o.x, (y - o.y) * 1.2);
        if (dB < 30 + (n2(u * 20, v * 20) - 0.5) * 10) return dB > 14 && feld(x, y) ? 'feld' : 'wiese';
        // westlich der Birkengrenze heller Birkenwaldboden mit etwas mehr Lichtungen
        const bi = WK.birkenAnteil(x, y) > 0.5, boden = bi ? 'birkenwald' : 'wald';
        // Waldrand zu den Feldern: dicht, ohne Lichtungen (sichtbare Grenze)
        if (weichAnteil('felder', x, y) > 0.02) return boden;
        return n2(u * 14, v * 14) < (bi ? 0.34 : 0.3) ? 'wiese' : boden;
      }
      case 'anhoehe': return n2(u * 16 + 4, v * 16) > 0.78 ? 'wald' : 'heide';
      case 'fluss': return ufer ? 'ufer' : 'aue';
      default: if (ufer) return 'ufer'; if (feld(x, y)) return 'feld'; return n2(u * 18, v * 18) > 0.68 ? 'wald' : 'wiese';
    }
  }
  return { hoehe, art, stadt, industrie, tagebau, feld, dFluss, dBach, dKanal, kanalBreite, flussBreite, glocke, n1, n2, n3, abstandStuecke: [fF, fB, fK] };
})();

// ---------------------------------------------------------------------
// Übergänge (Brücke, Steg, Furt) an jeder Stelle, wo ein Weg Wasser quert; ohne die alte Brücke und den Damm
// ---------------------------------------------------------------------
const ueCache = {};
WK.uebergaenge = w => ueCache[w.a + '-' + w.b] || (ueCache[w.a + '-' + w.b] = uebergaengeRechnen(w));
function uebergaengeRechnen(w) {
  const pts = WK.wegPunkte(w), G = WK.gelaende, nass = ([x, y]) => { const a = G.art(Math.round(x), Math.round(y)); return a === 'wasser' || a === 'rotwasser'; };
  const furt = w.furt || null, aus = [];
  for (let i = 0; i < pts.length; i++) {
    if (!nass(pts[i])) continue;
    let j = i; while (j + 1 < pts.length && nass(pts[j + 1])) j++;
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, j + 1)], m = pts[(i + j) >> 1];
    const nah = q => q && Math.hypot(m[0] - q[0], m[1] - q[1]) < 14;
    if (!nah(WK.BRUECKE) && !nah(WK.DAMM)) aus.push({ x: m[0], y: m[1], dx: b[0] - a[0], dy: b[1] - a[1], art: furt && Math.hypot(m[0] - furt[0], m[1] - furt[1]) < 16 ? 'furt' : w.art === 'strasse' ? 'bruecke' : 'steg', weg: w.a + '-' + w.b });
    i = j;
  }
  return aus;
}

// ---------------------------------------------------------------------
// Malerei der Landschaft (weltkarte_maler.js liest WK.DEKO)
// ---------------------------------------------------------------------
WK.DEKO = {
  stadtX0: 120, stadtY0: 250, stadtKern: [320, 400], werke: [420, 300, 180, 252], werkeAnzahl: 260, krater: KRATER,
  leitungen: [[[560, 370], [544, 310], [520, 250]], [[520, 250], [430, 256], [340, 268], [220, 284], [140, 296]]],
  bus: [326, 104], laternen: [[340, 374], [356, 376], [384, 378], [400, 380]], wasserfall: [521, 64, 100],
  kaehne: ([x, y]) => x > 250 && x < 470 && y > 160, baumArt: { wiese: 0.035, aue: 0.03, heide: 0.012 }, ruinenArt: ['wiese', 'heide', 'aue'], ruinen: 170,
  birkenAnteil: WK.birkenAnteil,
  // Eigene Malerei: Schilf, Hecken, Feldrain, Campus, Krater, Grenzen der Landstriche (als Generator, stückweise)
  *malen(g, h) {
    const { r, at, px, nahOrt, nahWeg } = h, W = WK.W, H = WK.H;
    // Schilf an den Ufern im Flusstal
    for (let k = 0; k < 2600; k++) {
      const x = Math.round(r() * W), y = Math.round(r() * H);
      if (at(x, y) !== 'ufer' || WK.landstrichBei(x, y) !== 'fluss' || nahOrt(x, y, 14)) continue;
      px(x, y - 1, '#7a8a3a'); px(x, y - 2, r() < 0.5 ? '#9aa848' : '#6a7a30'); if (r() < 0.3) px(x, y - 3, '#a88a4a');
    }
    yield;
    // Hecken zwischen den Feldern
    for (let k = 0; k < 900; k++) {
      const x = Math.round(r() * W), y = Math.round(r() * H);
      if (at(x, y) !== 'feld' || at(x + 3, y) === 'feld' || nahOrt(x, y, 12) || nahWeg(x, y, 3)) continue;
      g.fillStyle = '#2c4a2a'; g.fillRect(x, y - 1, 2, 2); px(x, y - 1, '#3e6a36');
    }
    yield;
    // Feldrain mit Hecke an der Grenze Felder/Dunkelwald (auf der Feldseite)
    const karte = WK.regionKarte(), fI = WK.RIDS.indexOf('felder'), wI = WK.RIDS.indexOf('wald');
    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const i = y * W + x; if (karte[i] !== fI) continue;
        let nah = false; for (const q of [i - 2, i + 2, i - 2 * W, i + 2 * W]) if (karte[q] === wI) nah = true;
        if (!nah || nahWeg(x, y, 3) || nahOrt(x, y, 10)) continue;
        const a = at(x, y); if (a === 'wasser') continue;
        if ((x * 7 + y * 3) % 5 < 3) { px(x, y, '#2a4426'); if ((x + y) % 3 === 0) px(x, y - 1, '#3e6a36'); }
      }
      if ((y & 31) === 31) yield;
    }
    // Anhöhe: Mauerreste des alten Campus und Schautafeln
    const [cx0, cw, cy0, ch] = CAMPUS;
    for (let k = 0; k < 60; k++) {
      const x = Math.round(cx0 + r() * cw), y = Math.round(cy0 + r() * ch);
      if (at(x, y) !== 'heide' || nahOrt(x, y, 20) || nahWeg(x, y, 5)) continue;
      if (r() < 0.86) { g.fillStyle = '#7a788a'; g.fillRect(x, y - 2, 7, 2); g.fillStyle = '#9a98aa'; g.fillRect(x, y - 3, 7, 1); g.fillStyle = '#5a586a'; g.fillRect(x + 7, y - 2, 1, 2); }
      else { g.fillStyle = '#4a4858'; g.fillRect(x, y - 6, 1, 6); g.fillRect(x + 4, y - 6, 1, 6); g.fillStyle = '#3a6ab0'; g.fillRect(x - 1, y - 9, 7, 3); }
    }
    // Krater der Tiefe: Trümmer am Rand, Bunkerlichter im Grund
    const [kx, ky] = KRATER;
    for (let k = 0; k < 340; k++) {
      const a = r() * Math.PI * 2, d = 36 + r() * 26, x = Math.round(kx + Math.cos(a) * d), y = Math.round(ky + Math.sin(a) * d / 1.25);
      if (at(x, y) !== 'krater' || nahOrt(x, y, 16)) continue;
      g.fillStyle = r() < 0.5 ? '#5a5668' : '#46424e'; g.fillRect(x, y, 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
    }
    for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2, d = r() * 22, x = Math.round(kx + Math.cos(a) * d), y = Math.round(ky + Math.sin(a) * d / 1.25); if (!nahOrt(x, y, 12)) px(x, y, '#5ff0e0'); }
    yield;
    // Grenzen der Landstriche: feine Punktlinie, damit jedes Gebiet als eines lesbar ist
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x, k = karte[i];
        if (k === karte[i + 1] && k === karte[i + W]) continue;
        if ((x + y) % 3) continue;
        const a = at(x, y); if (a === 'wasser' || a === 'rotwasser' || nahWeg(x, y, 2)) continue;
        px(x, y, 'rgba(242,232,208,0.55)');
      }
      if ((y & 31) === 31) yield;
    }
  },
};

// ---------------------------------------------------------------------
// Pixelbilder der Orte (Stil der Endfassung F; das Dorf wächst mit Gebäuden und Epoche wie bisher)
// ---------------------------------------------------------------------
WK.dorfSchluessel = () => (typeof SPIEL === 'undefined' || !SPIEL) ? '-' : [Math.min(16, Math.max(3, SPIEL.gebaeude.filter(g => g.typ !== 'weg').length)), SPIEL.epoche, hatGebaeude('kirche'), hatGebaeude('koehlerei')].join(',');
WK.symbol = function (g, art, x, y) {
  const b = (dx, dy, w, h, f) => { g.fillStyle = f; g.fillRect(x + dx, y + dy, w, h); };
  const schatten = w => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - w / 2, y + 2, w, 2); };
  switch (art) {
    case 'dorf': {
      // Wächst mit der Zahl der Gebäude und wird mit jeder Epoche moderner
      const n = Math.min(16, Math.max(3, SPIEL.gebaeude.filter(q => q.typ !== 'weg').length)), ep = SPIEL.epoche;
      const plaetze = [];
      for (let i = 0; i < n; i++) { const a = i * 2.4, d = 4 + Math.sqrt(i) * 3.2; plaetze.push([Math.round(Math.cos(a) * d * 1.3), Math.round(Math.sin(a) * d * 0.8)]); }
      plaetze.sort((p, q) => p[1] - q[1]);
      schatten(10 + n * 1.5);
      if (ep >= 1) { for (let a = 0; a < Math.PI * 2; a += 0.08) { const rr = 8 + Math.sqrt(n) * 3.4; b(Math.round(Math.cos(a) * rr * 1.3), Math.round(Math.sin(a) * rr * 0.8) + 1, 1, 2, ep >= 2 ? '#8a8898' : '#6a4628'); } }
      plaetze.forEach(([dx, dy]) => {
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
      b(-1, -3, 2, 4, '#1a1622'); b(9, -2, 6, 3, '#e8c040'); b(10, -4, 3, 2, '#4e8a36');
      break;
    case 'wald':
      for (const [dx, dy] of [[-8, -6], [6, -7], [-3, -11], [3, -3], [-9, 1]]) { b(dx - 2, dy, 5, 4, '#1e3e26'); b(dx - 1, dy - 2, 3, 3, '#2c5430'); b(dx - 1, dy - 2, 1, 1, '#4a7a3e'); }
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
      b(6, -15, 3, 9, '#3e3c48');
      break;
    case 'nullbunker':
      schatten(14);
      b(-6, -6, 12, 6, '#3a3a48'); b(-4, -5, 8, 4, '#16161e'); b(-1, -5, 2, 4, '#5ff0e0'); b(-2, -4, 1, 2, '#5ff0e0'); b(1, -4, 1, 2, '#5ff0e0');
      break;
    case 'stadt':
      b(-6, -12, 4, 12, '#8a8898'); b(-1, -16, 4, 16, '#77768e'); b(4, -9, 3, 9, '#8a8898');
      b(-1, -16, 4, 1, '#4e8a36'); b(-6, -12, 4, 1, '#4e8a36'); b(0, -10, 1, 1, '#c8b060');
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
    case 'ersatzteillager':
      schatten(18);
      b(-9, -5, 18, 8, '#6c6e78'); for (let i = 0; i < 3; i++) { b(-9 + i * 6, -8, 3, 3, '#4c4e58'); b(-6 + i * 6, -7, 3, 2, '#4c4e58'); }
      b(-2, -1, 4, 4, '#2a2830'); b(-8, -3, 3, 2, '#e8c040'); b(5, -3, 3, 2, '#e8c040');
      break;
    case 'planarchiv':
      schatten(16);
      b(-9, -1, 18, 5, '#3a3442'); b(-7, -5, 14, 4, '#3a6ab0'); b(-5, -8, 10, 3, '#3a6ab0'); b(-3, -10, 6, 2, '#5a8ad8'); b(-5, -7, 2, 2, '#8ad0ff');
      b(-1, -13, 2, 3, '#9aa6b8'); b(-2, -15, 4, 2, '#8ad0ff'); b(-2, 0, 4, 4, '#14101a');
      break;
    case 'umspannwerk':
      schatten(16);
      b(-9, -2, 6, 5, '#68728e'); b(3, -2, 6, 5, '#68728e');
      b(-1, -13, 2, 14, '#a7b6cf'); b(-6, -11, 12, 1, '#a7b6cf'); b(-4, -8, 8, 1, '#a7b6cf');
      b(-6, -10, 1, 2, '#8ad0ff'); b(5, -10, 1, 2, '#8ad0ff'); b(-1, -15, 2, 2, '#8ad0ff');
      b(-7, -1, 2, 1, '#ffe060'); b(5, -1, 2, 1, '#ffe060');
      break;
    case 'erzwaesche':
      schatten(22);
      b(-11, -2, 12, 6, '#8a3e26'); b(-9, -4, 8, 2, '#a8482a'); b(1, -7, 9, 7, '#6c6e78'); b(1, -9, 9, 2, '#c0612c'); b(8, -14, 2, 7, '#4c4e58');
      b(-7, -9, 5, 5, '#3a3c46'); b(-6, -8, 3, 3, '#c08a26');
      break;
    case 'schleuse':
      schatten(16);
      b(-9, -4, 18, 3, '#6a6c78'); b(-2, -7, 4, 6, '#4a4c58'); b(-1, -6, 2, 1, '#c8a030'); b(-9, -1, 7, 3, '#3a6a9a'); b(2, -1, 7, 3, '#2e5a8a');
      b(-7, 2, 5, 2, '#8a4e30'); b(3, 3, 5, 2, '#8a4e30');
      break;
    case 'strasse':
      b(-7, 0, 9, 3, '#8a4e30'); b(-6, -3, 7, 3, '#c0a070'); b(-6, 3, 2, 2, '#2a1e14'); b(0, 3, 2, 2, '#2a1e14');
      b(3, -2, 5, 3, '#c0612c');
      break;
    case 'geheim':
      for (let i = -3; i <= 3; i++) { b(i, i - 2, 1, 1, '#c890ff'); b(i, -i - 2, 1, 1, '#c890ff'); }
      break;
  }
};
})();

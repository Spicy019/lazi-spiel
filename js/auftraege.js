// =====================================================================
// AUFTRÄGE: Missionen, die nicht nach Wellen ablaufen.
//  - Verfolgung: Den Fuchs durch die verlassene Stadt jagen
//  - Sturm: Das Plündererlager am Fluss ausräuchern
//  - Eskorte: Einen Karren aus Birkenhain sicher ins Dorf bringen (und den Konvoi der Lastläufer)
//  - Reparatur: Kaputte Wartungsroboter wieder in Gang setzen, bevor die Eiferer sie salben
// Statt Wellen schickt ein "Spielleiter" nach und nach Gegner.
// =====================================================================

const ANIM_DEKO = [];   // Kulissen, die flackern (Lazi-Tafeln, Leuchtreklame)
function animDeko(o, bilder, tempo) { ANIM_DEKO.push({ o, bilder, tempo }); }

// ---------------------------------------------------------------------
// Spielfelder
// ---------------------------------------------------------------------
const decoBild = (b, x, z, r, schatten) => {
  z = dekoPlatz(b, x, z, r);
  const o = figur(b, schatten === undefined ? (r ? r * 1.1 : 0) : schatten);
  stelle(o, x, z);
  if (r) HINDERNISSE.push({ x, z, r });
  return o;
};

// Die Fuchsjagd (seit 0.3.23): eine verwinkelte Strecke quer durch die verlassene Stadt, in Abschnitten:
// überwucherte Ausfahrt, Allee mit Schienen, Trümmerfeld eines eingestürzten Hochhauses, Querstraße und enge Gasse,
// verwilderter Park, altes Busdepot, Gleisfeld mit dem Zaun am Ende. Niemand wohnt hier, Licht gibt es nur in einem Schild.
const STADT_WEG = [[-14, 42], [-14, 30], [4, 26], [14, 18], [14, 6], [0, 2], [-14, -4], [-14, -16], [-2, -22], [12, -26], [12, -34], [0, -38], [0, -46]];
// Bis zu welcher Weglänge welcher Abschnitt reicht (Bodenart und Hindernisse); 'gasse' ist die Querstraße mit den Kisten der Plünderer
const STADT_ABSCHNITTE = [{ bis: 12, art: 'ausfahrt' }, { bis: 43.3, art: 'asphalt' }, { bis: 55.3, art: 'truemmer' }, { bis: 85, art: 'gasse' }, { bis: 110.5, art: 'park' }, { bis: 133, art: 'depot' }, { bis: 999, art: 'schotter' }];
const STADT_BREITE = 4.2;
// Weglänge, an der der Zaun steht (z = -42,6 auf dem letzten Stück, das bei z = -38 beginnt)
const STADT_FUCHS_ZAUN = (() => { let s = 0; for (let i = 0; i < STADT_WEG.length - 2; i++) s += Math.hypot(STADT_WEG[i + 1][0] - STADT_WEG[i][0], STADT_WEG[i + 1][1] - STADT_WEG[i][1]); return s + 4.6; })();
// Nächster Punkt auf dem Weg: [Abstand, x, z, Weglänge bis dorthin]
function wegNaechster(x, z, weg) {
  weg = weg || STADT_WEG;
  let best = [Infinity, 0, 0, 0], laenge = 0;
  for (let i = 0; i < weg.length - 1; i++) {
    const [ax, az] = weg[i], [bx, bz] = weg[i + 1], lx = bx - ax, lz = bz - az, l2 = lx * lx + lz * lz, l = Math.sqrt(l2);
    const t = Math.max(0, Math.min(1, ((x - ax) * lx + (z - az) * lz) / l2));
    const px = ax + lx * t, pz = az + lz * t, d = Math.hypot(x - px, z - pz);
    if (d < best[0]) best = [d, px, pz, laenge + l * t];
    laenge += l;
  }
  return best;
}
// Punkt auf dem Weg nach s Metern
function wegPunkt(s, weg) {
  weg = weg || STADT_WEG;
  for (let i = 0; i < weg.length - 1; i++) {
    const [ax, az] = weg[i], [bx, bz] = weg[i + 1], l = Math.hypot(bx - ax, bz - az);
    if (s <= l) return [ax + (bx - ax) * s / l, az + (bz - az) * s / l];
    s -= l;
  }
  return weg[weg.length - 1].slice();
}
const STADT_LAENGE = STADT_WEG.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - STADT_WEG[i][0], p[1] - STADT_WEG[i][1]), 0);
// Bunker in der Stadt (seit 0.3.22): der alte Rathausplatz. Im Norden der Betonklotz mit der Bunkertür, in der Mitte ein kopfloses Denkmal.
// Davor die breite Allee mit Straßenbahnschienen, dazu eine Südstraße, eine Seitenstraße nach Nordosten und eine schräge Gasse nach Nordwesten.
// Die Plünderer kommen über alle fünf Straßenenden. Jede Straße reicht ein Stück in Platz oder Allee hinein, sonst klemmt der Übergang.
// Ein Rechteck: Abgeschrägte Ecken lassen mit den Gassen Kerben, in denen man hängen bleibt
const BUNKER_PLATZ = { form: [[-12.5, -8.6], [12.5, -8.6], [12.5, 4.6], [-12.5, 4.6]] };
const BUNKER_ALLEE = [-25.5, 2.6, 25.5, 9.2];
// Die Nordost-Straße liegt direkt am Platz (sonst wäre dort eine unsichtbare Kante), die Gasse reicht weit in den Platz (sonst hängt man an der Ecke).
const BUNKER_FLAECHEN = [BUNKER_PLATZ, BUNKER_ALLEE, [-2.6, 7.6, 2.6, 19.5], [11, -13.5, 18.4, 4.4], { form: [[-5.6, -5.2], [-20.1, -14.1], [-22, -11], [-7.6, -2.0]] }];
const BUNKER_ZUGAENGE = [[-24.8, 6], [24.8, 6], [0, 18.8], [16, -12.6], [-19.5, -11.6]];   // jeder mindestens 0,6 innerhalb seiner Fläche
function aufbauBunker() {
  szene.background = new THREE.Color('#0a0c10');
  const fein = neueGrafik() ? 2 : 1;
  // Liegt ein Punkt in einer Fläche, mit Rand m (negativ: nur weit genug innen)?
  const inFl = (f, x, z, m) => { if (Array.isArray(f)) return x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m; const q = flaecheKlemmen(f, x, z, Math.max(0, -m)); return Math.hypot(q[0] - x, q[1] - z) <= Math.max(0, m) + 1e-6; };
  // Für den Boden (jeder Pixel) nur einfache Rechnungen: die Gasse als Linie mit Abstand
  const gasseD = (x, z) => { const ax = -8.6, az = -4.8, bx = -21, bz = -12.6, lx = bx - ax, lz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * lx + (z - az) * lz) / (lx * lx + lz * lz))); return Math.hypot(x - ax - lx * t, z - az - lz * t); };
  const imRechteck = (f, x, z, m) => x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m;
  const begehbar = (x, z, m) => BUNKER_FLAECHEN.some(f => inFl(f, x, z, m));
  const park = (x, z) => x > -13.5 && x < -4 && z > 10.2 && z < 19;
  const boden = malBoden(76, 16 * fein, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.3 + Math.cos(z * 1.3) * 0.3;
    if (z < -8.4 && Math.abs(x) < 7) return 'beton';
    if (imVieleck(BUNKER_PLATZ.form, x, z)) return Math.abs(x) < 2.4 && z > -1.6 && z < 2.6 ? 'beet' : 'platz';
    if (z > 3.2 && z < 8.6 && Math.abs(x) < 25.5) return 'asphalt';
    if (imRechteck(BUNKER_FLAECHEN[2], x, z, -0.7) || imRechteck(BUNKER_FLAECHEN[3], x, z, -0.7) || gasseD(x, z) < 1.1) return 'asphalt';
    if (imRechteck(BUNKER_ALLEE, x, z, 0.1) || imRechteck(BUNKER_FLAECHEN[2], x, z, 0.1) || imRechteck(BUNKER_FLAECHEN[3], x, z, 0.1) || gasseD(x, z) < 2.1) return 'gehweg';
    if (park(x, z)) return 'park';
    return Math.sin(x * 0.9) * Math.cos(z * 0.7) + Math.sin((x - z) * 0.37) * 0.6 + wob > 0.55 ? 'moos' : 'schutt';
  }, {
    asphalt: ['#34323e', '#3a3846', '#2e2c38', '#44424e'],
    gehweg:  ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    platz:   ['#5e5650', '#686058', '#544c48', '#726a60'],
    beton:   ['#4e4c5a', '#565462', '#46444f', '#5e5c6a'],
    beet:    ['#2e3a26', '#36442c', '#283220', '#3e4e30'],
    park:    ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    schutt:  ['#2a2832', '#322f3a', '#24222c', '#3a3742'],
    moos:    ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
  }, 19);
  const { g, toPx, r } = boden, P2 = toPx, w = v => Math.max(1, v * fein);
  // Pflaster: Fugen im Raster, ein paar fehlende Steine
  for (let x = -12.5; x < 12.5; x += 0.5) for (let z = -8.6; z < 4.6; z += 0.5) {
    if (!imVieleck(BUNKER_PLATZ.form, x, z) || (Math.abs(x) < 2.6 && z > -1.8 && z < 2.8)) continue;
    g.fillStyle = 'rgba(30,26,30,0.35)'; g.fillRect(P2(x), P2(z), P2(x + 0.5) - P2(x), w(1)); g.fillRect(P2(x), P2(z), w(1), P2(z + 0.5) - P2(z));
    if (r() < 0.035) { g.fillStyle = '#2a2622'; g.fillRect(P2(x) + w(1), P2(z) + w(1), P2(x + 0.5) - P2(x) - w(1), P2(z + 0.5) - P2(z) - w(1)); }
  }
  // Beeteinfassung um das Denkmal
  g.fillStyle = '#7a7268'; for (const [a, b, c, d] of [[-2.4, -1.6, 2.4, -1.45], [-2.4, 2.45, 2.4, 2.6], [-2.4, -1.6, -2.25, 2.6], [2.25, -1.6, 2.4, 2.6]]) g.fillRect(P2(a), P2(b), P2(c) - P2(a), P2(d) - P2(b));
  // Straßenbahnschienen auf der Allee, Schwellen dazwischen, an zwei Stellen hochgebogen
  for (const z of [5.3, 6.5]) for (let x = -26; x < 26; x += 0.25) { if ((x > -8 && x < -6.6 && z === 5.3) || (x > 9 && x < 10.2)) continue; g.fillStyle = '#7e7a86'; g.fillRect(P2(x), P2(z), P2(x + 0.25) - P2(x) + 1, w(1)); g.fillStyle = '#26242c'; g.fillRect(P2(x), P2(z) + w(1), P2(x + 0.25) - P2(x) + 1, w(1)); }
  for (let x = -25.6; x < 26; x += 0.9) { g.fillStyle = '#2c2a30'; g.fillRect(P2(x), P2(5.2), w(3), P2(6.7) - P2(5.2)); }
  // Gestrichelte Randlinien der Allee, Zebrastreifen in die Südstraße, Gullydeckel
  for (let x = -25; x < 25; x += 1.4) for (const z of [3.9, 7.9]) { g.fillStyle = '#7a7254'; g.fillRect(P2(x), P2(z), P2(x + 0.7) - P2(x), w(1)); }
  for (let x = -2.2; x < 2.2; x += 0.6) { g.fillStyle = '#9a96a0'; g.fillRect(P2(x), P2(9.4), P2(x + 0.35) - P2(x), P2(10.6) - P2(9.4)); }
  for (const [x, z] of [[-18, 4.2], [7, 8.1], [0.9, 15], [16, -6], [-14.5, -8.6]]) { g.fillStyle = '#24222a'; g.beginPath(); g.arc(P2(x), P2(z), P2(x + 0.35) - P2(x), 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a4852'; g.fillRect(P2(x - 0.25), P2(z) - w(1), P2(x + 0.25) - P2(x - 0.25), w(1)); }
  // Risse, aus denen Gras wächst
  for (let k = 0; k < 90; k++) {
    let x = P2(-25 + r() * 50), y = P2(-13 + r() * 32), dx = r() < 0.5 ? 1 : -1;
    for (let s = 0; s < (20 + r() * 40) * fein; s++) { g.fillStyle = '#1e1c24'; g.fillRect(x, y, 1, 1); if (r() < 0.2) { g.fillStyle = '#3e5a34'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += dx; else y += 1; }
  }
  streuGras(boden, (px, py) => { const a = boden.artBei(px, py); return a === 'moos' || a === 'park' || a === 'beet'; }, 3000 * fein * fein, [['#1e3420', '#4a6a3a'], ['#243c26', '#5a7a44']]);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'beet', 2400 * fein * fein);
  bodenMesh(boden, 76);
  const deko = (b, x, z, rad, schatten) => { z = dekoPlatz(b, x, z, rad); const o = figur(b, schatten === undefined ? (rad ? rad * 1.1 : 0) : schatten); stelle(o, x, z); if (rad) HINDERNISSE.push({ x, z, r: rad }); return o; };
  // Verdeckt ein Bild an dieser Stelle eine Straße? (Bilder decken die Fläche nördlich ihres Fußpunkts ab.)
  const hoehe = b => b.h * PX / 0.819, breite = b => b.w * PX / 2;
  const verdeckt = (b, x, z) => { const h = hoehe(b), bw = breite(b) * 0.8; for (let k = 0; k <= h; k += 0.5) for (const dx of [-bw, 0, bw]) if (begehbar(x + dx, z - k, 0.4)) return true; return false; };
  // Die Stadt ist verlassen, die Menschen leben unten in den Bunkern: keine heilen Häuser, keine brennenden Laternen.
  // Licht gibt es nur am Bunker (das grüne Licht an der Tür) und in der Leuchtreklame der Alten, die seit Jahrhunderten flackert.
  // Der Bunker mit Barrikaden der Plünderer davor
  deko(BILD.bunkerklotz, 0, -10.4, 0, 0);
  deko(BILD.barrikade, -2.9, -7.4, 0.8); deko(BILD.barrikade, 2.9, -7.4, 0.8);
  // Platz: Statue im verwilderten Beet, die flackernde L.A.C.I.-Reklame, Kisten der Plünderer (keine Bänke: die vom Markt tragen Blumentöpfe)
  deko(BILD.platzfigur, 0, 0.8, 1.0, 0.9);
  for (const [x, z] of [[-1.7, -1], [1.8, -0.9]]) deko(BILD.busch[Math.floor(r() * 6)], x, z, 0, 0.4);   // nur hinter der Figur, sonst verdecken sie sie
  animDeko(deko(BILD.reklame[0], -12, 3.2, 0.3), BILD.reklame, 1.3);   // am Westrand, nicht in der Mündung der Gasse
  deko(BILD.schutt[1], 9.8, -7.6, 0.9);
  deko(BILD.kisten[0], -10.8, -1.2, 0.7); deko(BILD.tonne, -11.2, 0.6, 0.4); deko(BILD.tonne, 10.9, 1.4, 0.4);
  // Allee: ein ausgebrannter Bus und Autowracks am Rand. Der Bus braucht drei Hindernisse, er ist lang.
  { const bx = -16.5, bz = 8.4; deko(BILD.bus, bx, bz, 0, 1.2); const L = BILD.bus.w * PX / 2 - 0.6; for (const dx of [-L, 0, L]) HINDERNISSE.push({ x: bx + dx, z: bz - 0.5, r: 0.85 }); }
  // Wracks nur auf der breiten Allee; in den schmalen Straßen liegt nur kleiner Schutt am Rand, damit kein Zugang zugeht (Modern legt an Wracks zusätzliche Hindernisse an)
  deko(BILD.autowrack[0], 19.5, 3.6, 1.1); deko(BILD.autowrack[2], 6.8, 8.4, 1.1);
  deko(BILD.schutt[0], 1.9, 15.2, 0.5); deko(BILD.schutt[2], 17.9, -6.4, 0.5);
  // Ringsum Hochhausruinen (wo sie keine Straße verdecken), sonst eingestürzte Häuser und Trümmer. Nichts verdeckt eine Straße.
  const rr = zufall(53);
  const haus = (x, z, i) => {
    if (begehbar(x, z, 1.4) || park(x, z)) return false;
    let b = BILD.hochhaus[i % 4];
    if (rr() < 0.25 || verdeckt(b, x, z)) b = rr() < 0.6 ? BILD.ruine[i % 4] : BILD.truemmer[i % 3];
    if (verdeckt(b, x, z)) return false;
    deko(b, x, z, 0, 0.6); return true;
  };
  for (let z = -26, i = 0; z <= 34; z += 4.4) for (let x = -38; x <= 38; x += 4.6, i++) {
    const px = x + (rr() - 0.5) * 1.6, pz = z + (rr() - 0.5) * 1.4;
    if (haus(px, pz, i)) continue;
    if (!begehbar(px, pz, 1.2) && !park(px, pz) && rr() < 0.5) { const b = rr() < 0.5 ? BILD.schutt[i % 3] : BILD.busch[i % 6]; if (!verdeckt(b, px, pz)) deko(b, px, pz, 0, 0.5); }
  }
  // Der verwilderte Park zwischen Südstraße und Allee
  for (let i = 0; i < 9; i++) { const x = -12.5 + rr() * 8, z = 11 + rr() * 7.5, b = BILD.laubbaum[i % 4]; if (!verdeckt(b, x, z)) deko(b, x, z, 0.5, 1); else deko(BILD.busch[i % 6], x, z, 0, 0.5); }
}

// Der Fuchs wird in der Stadt gesehen: Dann wartet dort statt eines Bunkers die Jagd auf ihn
function fuchsSichtung(bericht) {
  const K = SPIEL.karte;
  if (K.fuchs || SPIEL.epoche < FUCHS.abEpoche || (K.erledigt.universitaet || 0) < FUCHS.abUniSiegen || !ortBekannt('stadt') || !(K.besucht.stadt || 0)) return;
  if (SPIEL.tag < (K.fuchsTag || -99) + FUCHS.pause) return;
  if (!K.fuchsGesehen || Math.random() < FUCHS.chance) {
    K.fuchs = true; K.fuchsGesehen = (K.fuchsGesehen || 0) + 1;
    bericht.push(K.fuchsGesehen === 1 ? TX('Kalle kommt außer Atem ins Dorf: In der Stadt rennt ein Dieb herum, mit etwas Rotem, Glühendem im Sack. Sie nennen ihn den Fuchs.') : TX('Der Fuchs wurde wieder in der Stadt gesehen. Wer schnell ist, erwischt ihn.'));
  }
}

function aufbauStadt() {
  szene.background = new THREE.Color('#0a0c10');
  const fein = neueGrafik() ? 2 : 1;
  const abschnitt = s => STADT_ABSCHNITTE.find(a => s < a.bis) || STADT_ABSCHNITTE[STADT_ABSCHNITTE.length - 1];
  const boden = malBoden(104, 16 * fein, (x, z) => {
    const [d, , , s] = wegNaechster(x, z), a = abschnitt(s).art, wob = Math.sin(x * 0.7 + z * 0.5) * 0.25;
    if (d < 3.4 + wob) return a;
    if (d < 4.7 + wob) return a === 'park' ? 'parkrand' : a === 'schotter' ? 'schotter' : 'gehweg';
    return Math.sin(x * 0.9 + z * 0.4) + wob > 0.3 ? 'moos' : 'schutt';
  }, {
    ausfahrt: ['#30303a', '#363640', '#2a2a34', '#3e3e48'],
    asphalt:  ['#34323e', '#3a3846', '#2e2c38', '#44424e'],
    truemmer: ['#4a4650', '#524e58', '#423e48', '#5c5862'],
    gasse:    ['#3a3640', '#423e48', '#34303a', '#4a4650'],
    park:     ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    parkrand: ['#3a3a30', '#424234', '#34342a', '#4a4a3a'],
    depot:    ['#4e4c5a', '#565462', '#46444f', '#5e5c6a'],
    schotter: ['#3e3a36', '#46423c', '#36322e', '#4e4a44'],
    gehweg:   ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    schutt:   neueGrafik() ? ['#46444e', '#4e4c58', '#3e3c46', '#5a5862'] : ['#2e2c38', '#36343f', '#26242e', '#3e3c48'],
    moos:     neueGrafik() ? ['#3a4c3e', '#425844', '#344436', '#4e664c'] : ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
  }, 17);
  const { g, toPx, r } = boden, P2 = toPx, w = v => Math.max(1, v * fein);
  const quer = s => { const [ax, az] = wegPunkt(s), [bx, bz] = wegPunkt(s + 0.5), l = Math.hypot(bx - ax, bz - az) || 1; return [-(bz - az) / l, (bx - ax) / l]; };
  // Je Abschnitt eigene Spuren auf dem Boden
  for (let s = 0; s < STADT_LAENGE; s += 0.5) {
    const a = abschnitt(s).art, [x, z] = wegPunkt(s), [nx, nz] = quer(s);
    if (a === 'asphalt') for (const q of [-0.7, 0.7]) { g.fillStyle = '#7e7a86'; g.fillRect(P2(x + nx * q), P2(z + nz * q), w(1.5), w(1.5)); }   // Straßenbahnschienen
    if (a === 'asphalt' && Math.round(s * 2) % 4 === 0) { g.fillStyle = '#2c2a30'; g.fillRect(P2(x - nx * 0.9), P2(z - nz * 0.9), P2(x + nx * 0.9) - P2(x - nx * 0.9) || w(1), w(2)); }
    if (a === 'ausfahrt' && Math.round(s * 2) % 5 < 2) { g.fillStyle = '#8a8060'; g.fillRect(P2(x), P2(z), w(2), w(2)); }   // verblasste Mittellinie
    if (a === 'depot' && Math.round(s * 2) % 7 === 0) for (const q of [-3.2, 3.2]) { g.fillStyle = '#9a9468'; g.fillRect(P2(x + nx * q) - w(4), P2(z + nz * q), w(8), w(1)); }   // Parkbuchten
  }
  // Gleise quer über das Gleisfeld am Ende, Schwellen dazwischen
  for (const z0 of [-40.6, -44.6]) for (let x = -10; x < 10; x += 0.25) { g.fillStyle = '#7e7a86'; g.fillRect(P2(x), P2(z0), P2(x + 0.25) - P2(x) + 1, w(1)); g.fillRect(P2(x), P2(z0 + 1.2), P2(x + 0.25) - P2(x) + 1, w(1)); if (Math.round(x * 4) % 4 === 0) { g.fillStyle = '#3a2c22'; g.fillRect(P2(x), P2(z0 - 0.15), w(2), P2(z0 + 1.35) - P2(z0 - 0.15)); } }
  // Risse mit Moos überall, im Park und an der Ausfahrt mehr Gras
  for (let k = 0; k < 240; k++) {
    let x = P2(-19 + r() * 38), y = P2(-46 + r() * 90);
    for (let s = 0; s < (20 + r() * 40) * fein; s++) { g.fillStyle = '#1e1c26'; g.fillRect(x, y, 1, 1); if (r() < 0.3) { g.fillStyle = r() < 0.5 ? '#3e5a34' : '#5a7a40'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += r() < 0.5 ? 1 : -1; else y += 1; }
  }
  streuGras(boden, (px, py) => { const a = boden.artBei(px, py); return a === 'park' || a === 'parkrand' || a === 'moos' || ((a === 'ausfahrt' || a === 'schotter') && r() < 0.3) || r() < 0.05; }, 4600 * fein * fein, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, () => true, 3400 * fein * fein);
  bodenMesh(boden, 104);
  // Was nah an der Strecke steht, darf sie nicht verdecken: Bilder decken die Fläche nördlich ihres Fußpunkts ab
  const verdeckt = (b, x, z) => { const h = b.h * PX / 0.819, bw = b.w * PX / 2 * 0.8; for (let k = 0; k <= h; k += 0.5) for (const dx of [-bw, 0, bw]) if (wegNaechster(x + dx, z - k)[0] < STADT_BREITE + 0.4) return true; return false; };
  // Ringsum nur Ruinen: Hochhausruinen, eingestürzte Häuser, Trümmer, im Park Bäume. Niemand wohnt hier.
  const rr = zufall(9);
  for (let z = -50; z <= 50; z += 3.6) for (let x = -26; x <= 26; x += 4.2) {
    const px = x + (rr() - 0.5) * 1.2, pz = z + (rr() - 0.5) * 1.2, [d, , , s] = wegNaechster(px, pz);
    if (d < STADT_BREITE + 1.4) continue;
    const a = abschnitt(s).art;
    const wahl = a === 'park' ? [BILD.laubbaum[Math.floor(rr() * 4)], BILD.busch[Math.floor(rr() * 6)]]
      : a === 'truemmer' ? [BILD.truemmer[Math.floor(rr() * 3)], BILD.ruine[Math.floor(rr() * 4)]]
      : [rr() < 0.8 ? BILD.hochhaus[Math.floor(rr() * 4)] : BILD.ruine[Math.floor(rr() * 4)], rr() < 0.6 ? BILD.truemmer[Math.floor(rr() * 3)] : BILD.schutt[Math.floor(rr() * 3)]];
    const b = wahl.find(q => !verdeckt(q, px, pz));
    if (b) decoBild(b, px, pz, 0, b === BILD.busch[0] ? 0.5 : 0.6);
    else if (rr() < 0.6) decoBild(BILD.busch[Math.floor(rr() * 6)], px, pz, 0, 0.5);
  }
  // Busdepot: ausgebrannte Busse in einer Reihe an der Nordseite, außerhalb der Strecke
  for (let s = 110; s < 132; s += 7.2) { const [x, z] = wegPunkt(s), [nx, nz] = quer(s), q = nz > 0 ? -5.6 : 5.6, bx = x + nx * q, bz = z + nz * q; if (!verdeckt(BILD.bus, bx, bz)) decoBild(BILD.bus, bx, bz, 0, 1.2); }
  // Hindernisse mitten auf der Strecke: Der Fuchs klettert darüber, du läufst drumherum. Je Abschnitt etwas Passendes.
  const route = [];
  for (let s = 6, n = 0; s < STADT_LAENGE - 12; s += 6, n++) {
    const [x, z] = wegPunkt(s), hin = n % 3 === 1, a = abschnitt(s).art;
    route.push([x, z, hin]);
    if (!hin) continue;
    const [nx] = wegPunkt(s + 1), laengs = Math.abs(nx - x) < 0.5;   // Läuft die Strecke hier von Nord nach Süd?
    const zwei = (o, rad) => { o.sprite.position.z = z; HINDERNISSE.push(laengs ? { x: x - 0.8, z, r: rad } : { x, z: z - 0.5, r: rad }, laengs ? { x: x + 0.8, z, r: rad } : { x, z: z + 0.5, r: rad }); };
    if (a === 'asphalt' || a === 'depot' || a === 'ausfahrt') zwei(decoBild(BILD.autowrack[n % 4], x, z, 0, 1.4), 0.85);
    else if (a === 'park') decoBild(BILD.busch[n % 6], x, z, 0.9, 0.6);
    else if (a === 'gasse') decoBild(BILD.kisten[n % 2], x, z, 0.9, 0.7);
    else decoBild(BILD.schutt[n % 3], x, z, 1.0);
  }
  STADT_ROUTE = route.concat([[0, -40, false], [0, -42.4, 'zaun'], [0, -46, false]]);
  // Am Ende der Strecke, hinter dem Gleisfeld: ein mannshoher Gitterzaun mit Stacheldraht über die ganze Breite.
  // Er sperrt wirklich ab: Nur der Fuchs klettert hinüber, wer hier ankommt, hat ihn verloren.
  for (let x = -4.8; x <= 4.8; x += neueGrafik() ? 1.5 : 1.2) decoBild(BILD.gitterzaun, x, -42.6, 0, 0);
  for (let x = -5; x <= 5; x += 0.5) HINDERNISSE.push({ x, z: -42.4, r: 0.4 });
  // Schilder der Alten an einigen Ecken, alle dunkel. Nur eines flackert noch, seit Jahrhunderten.
  STADT_WEG.slice(1, -2).forEach(([x, z], i) => {
    if (i % 2) return;
    const sx = x + (x > 0 ? 4.6 : -4.6), sz = z - 3.6;
    if (wegNaechster(sx, sz)[0] < STADT_BREITE + 0.3) return;
    const o = decoBild(BILD.reklameAus, sx, sz, 0.3);
    if (i === 2) animDeko(o, BILD.reklame, 0.9);
  });
}
let STADT_ROUTE = [];

// Das Plündererlager am Fluss (seit 0.3.25, nach der Lore): Im Norden fließt der Fluss. Über ihn kommen die Plünderer mit
// ihren Kähnen an zwei Anlegern, am Ufer stehen die zwei wackligen Ausgucke und schauen aufs Wasser. In der Mitte die drei
// großen Vorratszelte, davor das Lagerfeuer mit den Ölfässern. Ringsum Hütten aus Planen und Autotüren, hinten am Ufer der
// Käfig mit den Gefangenen (bei der Befreiung: ein Lastläufer). Eine Palisade aus Treibholz schließt das Lager nach Süden ab,
// mit einem Tor und einer Bresche. Davor die Lichtung, auf der man ankommt.
const LAGER_FLAECHEN = [[-12.6, -12.4, 12.6, 3.2], [-2.3, 1.2, 2.3, 7.4], [-10.4, 1.2, -7.8, 7.4], [-16, 5.4, 16, 12.6], [-5.4, -16, -3, -10.6], [6, -16, 8.4, -10.6]];
const LAGER_ZUGAENGE = [[-4.2, -15.2], [7.2, -15.2]];
const LAGER_ZELTE = [[-6.5, -5], [0, -7.6], [6.5, -5]];
const lagerFlussZ = x => -13.4 + Math.sin(x * 0.22) * 0.4;
function aufbauLager(befreiung) {
  szene.background = new THREE.Color('#0c100e');
  const fein = neueGrafik() ? 2 : 1, [INNEN, TOR, BRESCHE, VORFELD, STEG1, STEG2] = LAGER_FLAECHEN;
  const imR = (f, x, z, m) => x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m;
  const begehbar = (x, z, m) => LAGER_FLAECHEN.some(f => imR(f, x, z, m));
  const boden = malBoden(64, 16 * fein, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.5 + Math.cos(z * 1.3) * 0.5;
    if ((imR(STEG1, x, z, 0) || imR(STEG2, x, z, 0)) && z < lagerFlussZ(x) + 0.6) return 'steg';
    if (z < lagerFlussZ(x) - 7.6 + wob * 0.3) return 'wald';   /* das andere Ufer */
    if (z < lagerFlussZ(x) - 6.6 + wob * 0.3) return 'ufer';
    if (z < lagerFlussZ(x)) return 'wasser';
    if (z < lagerFlussZ(x) + 1.4 + wob * 0.3) return 'ufer';
    if (imR(TOR, x, z, 0) || imR(BRESCHE, x, z, 0) || (z > 5 && z < 12.8 && (Math.abs(x + wob * 0.3) < 1.3 || Math.abs(x + 9.1 - (z - 7.4) * 0.6 + wob * 0.3) < 1.0 && z < 10))) return 'pfad';
    if (imR(INNEN, x, z, 0.3)) return 'erde';
    if (imR(VORFELD, x, z, 0.6 + wob * 0.4)) return 'gras';
    return 'wald';
  }, {
    gras:   ['#3e5a34', '#46643a', '#36502e', '#52703f'],
    wald:   ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    erde:   ['#4e3c2a', '#5a4630', '#443424', '#664e36'],
    pfad:   ['#5a4630', '#664e36', '#4e3c2a', '#725a3e'],
    ufer:   ['#5e5444', '#6a604e', '#54493a', '#766a56'],
    steg:   ['#6a6058', '#766c62', '#5e544c', '#82786c'],
    wasser: ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
  }, 29);
  const { g, toPx, r } = boden, P2 = toPx, w = v => Math.max(1, v * fein);
  // Stege aus Treibholz: Bohlen quer, dunkle Fugen, Pfähle an den Ecken
  for (const S of [STEG1, STEG2]) {
    for (let z = S[1]; z < lagerFlussZ((S[0] + S[2]) / 2) + 0.6; z += 0.4) { g.fillStyle = '#3a342e'; g.fillRect(P2(S[0]), P2(z), P2(S[2]) - P2(S[0]), w(1)); }
    for (const x of [S[0], S[2] - 0.25]) for (const z of [S[1], S[1] + 2.6]) { g.fillStyle = '#2a2420'; g.fillRect(P2(x), P2(z), P2(x + 0.25) - P2(x), P2(z + 0.25) - P2(z)); }
  }
  // Fluss: Strömung quer, am Ufer Schaum
  for (let i = 0; i < 300; i++) { const x = -32 + r() * 64, z = lagerFlussZ(x) - 0.3 - r() * 3; if (imR(STEG1, x, z, 0.2) || imR(STEG2, x, z, 0.2)) continue; g.fillStyle = r() < 0.5 ? 'rgba(150,190,230,0.2)' : 'rgba(110,150,200,0.16)'; g.fillRect(P2(x), P2(z), (2 + r() * 6) * fein, w(1)); }
  // Asche und Abfall im Lager, Spuren vor den Zelten
  for (let k = 0; k < 10; k++) { const cx = P2(-11 + r() * 22), cy = P2(-11 + r() * 13); for (let i = 0; i < 40 * fein; i++) { g.fillStyle = r() < 0.6 ? '#2e241a' : '#3a3026'; g.fillRect(cx + (r() * 12 - 6) * fein | 0, cy + (r() * 7 - 3.5) * fein | 0, w(1), w(1)); } }
  { const cx = P2(0), cy = P2(-1.6); for (let i = 0; i < 140 * fein; i++) { const a = r() * 6.3, d = r() * 1.6; g.fillStyle = r() < 0.5 ? '#1e1a18' : '#2a2420'; g.fillRect(P2(Math.cos(a) * d), P2(-1.6 + Math.sin(a) * d * 0.7), w(1), w(1)); } }
  const istGras = (px, py) => boden.artBei(px, py) === 'gras';
  streuGras(boden, istGras, 2600 * fein * fein, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuBlumen(boden, istGras, 80 * fein);
  streuDetails(boden, (px, py) => { const a = boden.artBei(px, py); return a !== 'wasser' && a !== 'steg'; }, 2200 * fein * fein);
  bodenMesh(boden, 64);
  const verdeckt = (b, x, z) => { const h = b.h * PX / 0.819, bw = b.w * PX / 2 * 0.8; for (let k = 0; k <= h; k += 0.5) for (const dx of [-bw, 0, bw]) if (begehbar(x + dx, z - k, 0.4)) return true; return false; };
  // Palisade aus Treibholz: im Süden mit Tor und Bresche, an den Seiten bis ans Ufer
  for (let x = -12.6, i = 0; x <= 12.7; x += 1.05, i++) {
    if (Math.abs(x) < 2.6 || (x > -10.7 && x < -7.5)) continue;
    decoBild(BILD.treibpalisade[i % 2], x, 3.7, 0, 0);
  }
  decoBild(BILD.treibpalisade[2], -11.4, 4.5, 0, 0); decoBild(BILD.treibpalisade[2], -6.8, 4.9, 0, 0);
  for (const x of [-10.9, -7.3]) decoBild(BILD.treibpalisade[4], x, 3.7, 0, 0);   /* abgebrochene Stümpfe an der Bresche */
  for (const x of [-2.85, 2.85]) decoBild(BILD.treibpalisade[3], x, 3.75, 0.3);   /* Torpfosten mit Lappen und Radkappe */
  for (const s of [-1, 1]) for (let z = 3.2, i = 0; z > -11.6; z -= 1.05, i++) decoBild(BILD.treibpalisade[(i + (s > 0 ? 1 : 0)) % 2], s * 13.2, z, 0, 0);
  // Lagerfeuer in der Mitte, die Fässer liegen gleich daneben
  const feuerBilder = neueGrafik() ? BILD.feuerGross[0] : BILD.gebaeude.lagerfeuer, feuer = decoBild(feuerBilder[0], 0, -1.6, 0.8);
  animDeko(feuer, feuerBilder, neueGrafik() ? 12 : 7);
  lichtFleck(0, -1.6, 5.5, 0xffa040, 0.16, 0.06);
  // Hütten aus Planen und Autotüren an den Seiten, Kisten mit der Beute zwischen den Zelten
  [[-11.1, -6.4, 0], [11.1, -5.6, 1], [-11.1, -1.2, 1], [11.1, 0.4, 0]].forEach(([x, z, v]) => decoBild(BILD.planenhuette[v], x, z, 1.1));
  decoBild(BILD.kisten[0], -3.3, -8.8, 0.7); decoBild(BILD.kisten[1], 3.4, -9.4, 0.7);
  // Hinten am Ufer der Käfig mit den Gefangenen
  if (befreiung) { decoBild(BILD.kaefig[1], -1.4, -11.4, 1.0); decoBild(BILD.kaefig[1], 1.7, -11.4, 1.0); decoBild(BILD.zerlegt, 4.9, -11.7, 0, 0.6); }   /* drei Lastläufer: „DREI EINHEITEN FESTGEHALTEN … WIRD ZERLEGT“ */
  else decoBild(BILD.kaefig[0], 1.8, -11.3, 1.0);
  // Kähne an den Anlegern, Treibholz am Ufer
  for (const [x, z] of [[-6.6, -14.6], [-1.8, -14.9], [4.6, -14.5], [9.8, -14.7]]) decoBild(BILD.kahn, x, z, 0, 0.5);
  for (const [x, z] of [[-9.2, -12.9], [11.6, -12.8], [-13.8, -12.7]]) decoBild(BILD.treibholz, x, z, 0, 0.3);
  // Wald ringsum und am anderen Ufer. Nichts verdeckt einen Weg.
  const rr = zufall(44);
  for (let i = 0; i < 220; i++) {
    const x = -32 + rr() * 64, z = -26 + rr() * 50;
    if (begehbar(x, z, 1.6) || Math.abs(x) < 14.4 && z > -13 && z < 4.4) continue;
    if (z > lagerFlussZ(x) - 8.4 && z < lagerFlussZ(x) + 2) continue;   /* nichts im Fluss und am Ufer */
    const b = rr() < 0.55 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4];
    if (!verdeckt(b, x, z)) decoBild(b, x, z, 0, 1);
    else if (!verdeckt(BILD.busch[i % 6], x, z)) decoBild(BILD.busch[i % 6], x, z, 0, 0.5);
  }
}

// Die Birkenstraße: ein Waldweg von Westen nach Osten
const eskorteZ = x => Math.sin(x * 0.12) * 2.2;
function aufbauStrasse() {
  szene.background = new THREE.Color('#0a0e0c');
  const F = FELD;
  const boden = malBoden(104, 16, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.4 + Math.cos(z * 1.3) * 0.4;
    if (Math.abs(z - eskorteZ(x)) < 1.6 + wob * 0.3) return 'weg';
    if (Math.abs(z) > F.zMax + 1 + wob) return 'wald';
    return 'moos';
  }, {
    moos: ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    wald: ['#121c14', '#162218', '#0e1810', '#1c2a1e'],
    weg:  ['#5e4632', '#6a5038', '#54402c', '#76583e'],
  }, 61);
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'moos', 4200, [['#1e3420', '#4a6a3a'], ['#243c26', '#5a7a44']]);
  streuBlumen(boden, (px, py) => boden.artBei(px, py) === 'moos', 220);
  streuDetails(boden, () => true, 3200);
  bodenMesh(boden, 104);
  const r = zufall(71);
  for (let i = 0, n = 0; i < 300 && n < 40; i++) {
    const x = -F.x + 2 + r() * (F.x * 2 - 4), z = F.zMin + 1 + r() * (F.zMax - F.zMin - 2);
    if (Math.abs(z - eskorteZ(x)) < 3) continue;
    if (HINDERNISSE.some(h => Math.hypot(h.x - x, h.z - z) < 2.6)) continue;
    decoBild(r() < 0.6 ? BILD.tanne[n % 3] : BILD.laubbaum[n % 4], x, z, 0.55); n++;
  }
  for (let i = 0; i < 260; i++) {
    const x = -56 + r() * 112, z = -26 + r() * 52;
    if (Math.abs(x) < F.x + 1.4 && Math.abs(z) < F.zMax + 1.4) continue;
    decoBild(r() < 0.65 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
  // Ein umgestürzter Baum und ein Wegweiser
  decoBild(BILD.barrikade, -8, eskorteZ(-8) + 2.6, 0.8);
  decoBild(BILD.barrikade, 18, eskorteZ(18) - 2.6, 0.8);
}

// ---------------------------------------------------------------------
// Start und Ablauf der Aufträge
// ---------------------------------------------------------------------
// Tabelle der Missionstypen: je Typ starten(A), ablauf(dt, A) und hud(A). Jede Missionsdatei meldet ihren Typ selbst an
// (auftragstypAnmelden neben ihren drei Funktionen), ein neuer Typ steht also ganz in seiner Datei.
// eigenesEnde: Der Typ läuft auch in der Phase „fertig“ weiter und beendet sich selbst (der Markt hat keinen Kampf).
// stand(A): nach dem Laden eines Missionsstands (missionsstand.js). Die Mission ist frisch gestartet, die gespeicherten Daten liegen
// schon in A und G. Hier stellt der Typ her, was sein Start nicht anlegt: 3D-Objekte, die erst im Lauf entstehen, Bilder und
// Hindernisse, die sich nur einmal ändern (ein Tor, das schon offen ist). STAND_NICHTS, wenn es nichts gibt.
const AUFTRAGSTYPEN = {};
function auftragstypAnmelden(typ, T) { AUFTRAGSTYPEN[typ] = T; }
function auftragstypen() { return AUFTRAGSTYPEN; }

function auftragStarten() {
  const A = G.auftrag = { t: 0, spawnT: 3, fertig: false, ueberfaelle: 0 };
  G.phase = 'kampf'; G.welle = 0;
  const T = auftragstypen()[MIS.typ];
  if (T) T.starten(A);
}

function auftragAblauf(dt) {
  const A = G.auftrag;
  A.t += dt;
  const T = auftragstypen()[MIS.typ];
  if (T && T.eigenesEnde) return T.ablauf(dt, A);
  if (G.phase === 'fertig') { G.endeT -= dt; if (G.endeT <= 0) gewonnen(); return; }
  if (T) return T.ablauf(dt, A);
}

// Gegner, die für den Nachschub zählen (ohne Objekte, Fliehende und fest Stehende), gezählt am Anfang des Bildes, und der Zuschlag je Sieg
function auftragLebend() {
  let n = 0;
  for (const e of G.gegner) if (!e.def.objekt && !e.def.flieht && !e.def.stationaer) n++;
  return n;
}
const auftragMult = () => 1 + (SPIEL.siege || 0) * 0.05;

auftragstypAnmelden('verfolgung', { starten: verfolgungStarten, ablauf: verfolgungAblauf, hud: verfolgungHud, stand: STAND_NICHTS });
// Verfolgung: der Fuchs in der Stadt
function verfolgungStarten(A) {
  // Die Route des Fuchses folgt der Straße um alle Ecken, über Wracks klettert er
  A.route = STADT_ROUTE.map(([x, z, k]) => [x, z, k]);
  A.fallen = []; A.trickStufe = 0;
  const d = gegnerErstellen('dieb', -12, 35);
  d.treffer = [];
  G.dieb = d; d.wp = 0; d.letzteHp = d.hp; d.beuteStufe = 0;
  meldung(TX('Der Fuchs!'), TX('Er hat einen Herzkristall. Hol ihn ein, bevor er am Ende der Stadt verschwindet. Pass auf seine Tricks auf.'), 3000);
  [[40, 'pluenderer'], [46, 'pluenderer'], [70, 'kaefer'], [95, 'schuetze'], [118, 'pluenderer'], [140, 'schildtraeger'], [165, 'kaefer'], [170, 'schuetze']].forEach(([s, t]) => { const [x, z] = wegPunkt(Math.min(STADT_FUCHS_ZAUN - 6, s * STADT_LAENGE / 172)); gegnerErstellen(t, x + zz(-2, 2), z + zz(-2, 2)); });   // Die Stellen stammen von der alten, 172 m langen Strecke
}
function verfolgungAblauf(dt, A) {
  const lebend = auftragLebend();
  const d = G.dieb;
  if (!d || d.hp <= 0) return auftragGeschafft(TX('Gefasst!'));
  // Krähenfüße: Wer hineinläuft, wird langsamer und sticht sich die Füße wund
  A.fallen = A.fallen.filter(f => {
    f.t -= dt;
    if (f.t <= 0) { szene.remove(f.mesh); return false; }
    if (Math.hypot(P.x - f.x, P.z - f.z) < 1.0 && P.rolleT <= 0) {
      P.gebremst = 0.5;
      if (G.zeit - (P.dornT || -9) > 1) { P.dornT = G.zeit; spielerTreffen(4, f.x, f.z); zahl(P.x, 2.2, P.z, TX('Krähenfüße!'), 'hurt'); }
    }
    return true;
  });
  // Hinterhalte vor dem Spieler, an der Straße entlang
  A.spawnT -= dt;
  if (A.spawnT <= 0 && lebend < 7 * auftragMult()) {
    A.spawnT = 7;
    const s = wegNaechster(P.x, P.z)[3] + 14 + Math.random() * 6;
    const [x, z] = wegPunkt(Math.min(STADT_FUCHS_ZAUN - 4, s));   // hinter dem Zaun lauert niemand mehr
    const typen = s > STADT_LAENGE / 2 ? ['pluenderer', 'kaefer', 'funkenkaefer', 'brandstifter', 'schildtraeger'] : ['pluenderer', 'kaefer', 'schuetze'];
    for (let i = 0; i < 2 + (s > STADT_LAENGE / 2 ? 1 : 0); i++) gegnerErstellen(typen[Math.floor(Math.random() * typen.length)], x + zz(-2.5, 2.5), z + zz(-2.5, 2.5));
  }
}

auftragstypAnmelden('sturm', { starten: sturmStarten, ablauf: sturmAblauf, hud: sturmHud, stand: STAND_NICHTS });
// Sturm aufs Plündererlager
function sturmStarten(A) {
  A.zelte = LAGER_ZELTE.map(([x, z]) => { const e = gegnerErstellen('zelt', x, z); stelle(e, x, z); return e; });
  A.zelteGesamt = A.zelte.length;
  [[-10.4, -10.6], [10.6, -10.2]].forEach(([x, z]) => gegnerErstellen('ausguck', x, z));   /* am Ufer, sie schauen aufs Wasser */
  [['pluenderer', -4, -2.6], ['pluenderer', 4, -2], ['schildtraeger', 0, -4.4], ['brandstifter', -6, -9.6], ['trommler', 3.6, -11]].forEach(([t, x, z]) => gegnerErstellen(t, x, z));
  A.spawnT = 14;
  [[-1.9, -0.8], [2.0, -1.2], [-8.6, -3.4]].forEach(([x, z]) => fassErstellen(x, z));   /* zwei Fässer am Lagerfeuer, eins nah am Zelt im Westen */
  meldung(TX('Das Plündererlager'), TX('Brenn die drei Vorratszelte nieder. Feuer wirkt am besten: Öl, Fässer, Brandstifter, Feuerwaffen.'), 3200);
}
function sturmAblauf(dt, A) {
  const lebend = auftragLebend();
  A.zelte = A.zelte.filter(z => z.hp > 0);
  if (!A.zelte.length) return auftragGeschafft(TX('Das Lager brennt'));
  A.spawnT -= dt;
  if (A.spawnT <= 0 && lebend < 8 * auftragMult()) {
    A.spawnT = 7;
    const typen = ['pluenderer', 'pluenderer', 'schuetze', 'schildtraeger', 'brandstifter', 'kaefer'];
    const [x, z] = spawnPunkt();   /* Nachschub kommt mit den Kähnen an einem der Anleger */
    for (let i = 0; i < 2 + (A.t > 60 ? 1 : 0); i++) { const [a, b] = feldKlemmen(x + zz(-0.8, 0.8), z + zz(-1, 1), 0.6); gegnerErstellen(typen[Math.floor(Math.random() * typen.length)], a, b); }
  }
}

auftragstypAnmelden('eskorte', { starten: eskorteStarten, ablauf: eskorteAblauf, hud: eskorteHud, stand: STAND_NICHTS });
// Eskorte: Karren oder Konvoi
function eskorteStarten(A) {
  const E = MIS.eskorte || ESKORTE_BIRKE;
  A.ueberfallPunkte = E.punkte.slice();
  meldung(E.titel, E.start, 2800);
}
function eskorteAblauf(dt, A) {
  const lebend = auftragLebend();   // vor dem Überfall gezählt: Die neuen Gegner zählen erst im nächsten Bild
  const w = G.tuer, E = MIS.eskorte || ESKORTE_BIRKE;
  // Der Karren fährt nur, wenn du in der Nähe bist und keine Gegner am Karren stehen
  const nahGegner = G.gegner.some(e => abstand(e, w) < 3);
  w.faehrt = abstand(P, w) < 7 && !nahGegner && w.hp > 0;
  if (w.faehrt) { w.x += E.tempo * dt; w.z = (MIS.wegZ || eskorteZ)(w.x); }
  if (w.x >= FELD.x - 4) return auftragGeschafft(E.ankunft);
  if (A.ueberfallPunkte.length && w.x > A.ueberfallPunkte[0]) {
    A.ueberfallPunkte.shift(); A.ueberfaelle++;
    const vorne = w.x + 10;
    const gruppen = E.gruppen[Math.min(A.ueberfaelle - 1, E.gruppen.length - 1)];
    // Angriffe von beiden Seiten und von hinten, damit du nicht nur vorneweg läufst
    gruppen.forEach(([t, n]) => { for (let i = 0; i < n; i++) { const hinten = i % 3 === 2; gegnerErstellen(t, Math.max(-FELD.x + 2, Math.min(FELD.x - 2, hinten ? w.x - zz(6, 9) : vorne + zz(-2, 4))), (Math.random() < 0.5 ? -1 : 1) * zz(4, 7)); } });
    const letzter = A.ueberfaelle === E.punkte.length;
    meldung(letzter ? E.letzter[0] : TX('Überfall!'), letzter ? E.letzter[1] : E.halten, 1800);
    // Vom Karren wirft man dir Brot zu
    if (A.ueberfaelle > 1) for (let i = 0; i < 2; i++) beuteErstellen('brot', w.x, w.z, CFG.brotHeilung);
  }
  A.spawnT -= dt;
  if (A.spawnT <= 0 && lebend < 6) {
    A.spawnT = 8;
    gegnerErstellen(E.nachschub(Math.random()), Math.min(FELD.x - 2, w.x + zz(8, 14)), (Math.random() < 0.5 ? -1 : 1) * zz(4, 7));
  }
}

// Die Eskorten: Birkenstraße (Karren mit Korn) und der Konvoi der Lastläufer
const ESKORTE_BIRKE = {
  titel: TX('Die Birkenstraße'), start: TX('Bleib beim Karren, dann fährt er. Sind Gegner in der Nähe, hält er an.'), ankunft: TX('Angekommen'),
  tempo: 1.35, punkte: [-32, -20, -8, 4, 16, 26, 35],
  gruppen: [
    [['wolf', 4]], [['pluenderer', 3], ['brandstifter', 1], ['schuetze', 1]], [['wolf', 4], ['heuler', 1]],
    [['pluenderer', 3], ['schildtraeger', 1], ['brandstifter', 1], ['trommler', 1]], [['wolf', 3], ['heuler', 1], ['pluenderer', 2]],
    [['pluenderer', 3], ['schuetze', 2], ['brandstifter', 2]], [['alpha', 1], ['wolf', 4], ['heuler', 1]],
  ],
  letzter: [TX('Der Alpha!'), TX('Er wittert das Korn. Schütz den Karren.')], halten: TX('Halte sie vom Karren fern.'),
  nachschub: r => r < 0.6 ? 'wolf' : 'pluenderer',
  hud: [TX('Der Karren rollt'), TX('Der Karren wartet auf dich'), TX('Gegner am Karren!')],
};
const ESKORTE_KONVOI = {
  titel: TX('Der Konvoi'), start: TX('Bleib bei den Lastläufern, dann laufen sie. Sind Gegner in der Nähe, bleiben sie stehen.'), ankunft: TX('Abschnitt geschafft'),
  tempo: 1.5, punkte: [-30, -16, -2, 12, 26, 36],
  gruppen: [
    [['eiferer', 2], ['pluenderer', 2]], [['wartungsbot', 3], ['eiferer', 1]], [['pluenderer', 3], ['schuetze', 2], ['eiferer', 1]],
    [['eiferer', 3], ['schildtraeger', 1], ['wartungsbot', 2]], [['pluenderer', 2], ['brandstifter', 2], ['eiferer', 2], ['trommler', 1]],
    [['eiferer', 3], ['wartungsbot', 3], ['schuetze', 1], ['schildtraeger', 1]],
  ],
  letzter: [TX('Die Sperre!'), TX('Die Eiferer haben die Straße gesperrt. Brich durch.')], halten: TX('Halte sie von den Lastläufern fern.'),
  nachschub: r => r < 0.4 ? 'eiferer' : r < 0.75 ? 'pluenderer' : 'wartungsbot',
  hud: [TX('Die Lastläufer laufen'), TX('Die Lastläufer warten auf dich'), TX('Gegner an den Lastläufern!')],
};
const konvoiZ = x => Math.sin(x * 0.07) * 1.6 + Math.sin(x * 0.19 + 1) * 0.5;

// ---------------------------------------------------------------------
// Wartungshalle: kaputte Roboter reparieren, bevor die Eiferer sie salben
// ---------------------------------------------------------------------
const HALLE_BOTS = [[-9, -4.5], [9, -4], [-6, 3.5], [6.5, 4]];
auftragstypAnmelden('reparatur', { starten: reparaturStarten, ablauf: reparaturAblauf, hud: reparaturHud, stand: STAND_NICHTS });
function reparaturStarten(A) {
  A.bots = HALLE_BOTS.map(([x, z]) => {
    const v = Object.assign(figur(BILD.botKaputt[0], 0.5), { art: 'roboter', x, z, r: 0.55, blick: 1, cd: 0, hiebT: 0, laufT: 0, bewegt: false, blitz: 0, laeuft: false, repar: 0, hinweis: '' });
    v.hp = v.maxHp = Math.round(REPARATUR.leben * Math.max(1, G.mult.schaden));   // hält in jeder Epoche gleich viele Treffer aus
    stelle(v, x, z); G.verbuendete.push(v);
    return v;
  });
  // Trupps der Eiferer: [Sekunde, Gegner]
  A.gruppen = [
    [5, [['eiferer', 2], ['kaefer', 2]]], [18, [['eiferer', 3], ['pluenderer', 1]]], [32, [['eiferer', 2], ['kaefer', 3], ['schildtraeger', 1]]],
    [48, [['eiferer', 4], ['schuetze', 1]]], [64, [['eiferer', 3], ['schildtraeger', 1], ['kaefer', 2], ['wartungsbot', 1]]],
  ];
  A.trupps = A.gruppen.length;
  meldung(TX('Die Wartungshalle'), TX('Stell dich neben einen kaputten Roboter, um ihn zu reparieren. Die Eiferer wollen sie salben, dann gehören sie dem inneren Kreis.'), 3600);
}
function reparaturAblauf(dt, A) {
  // Reparieren: Wer neben einem Roboter steht, setzt ihn wieder in Gang. Architekten können das schneller.
  const tempo = (SPIEL.klasse === 'architekt' ? REPARATUR.architekt : 1) / REPARATUR.zeit;
  for (const v of A.bots) {
    if (v.laeuft || v.hp <= 0) continue;
    if (P.hp > 0 && abstand(v, P) < REPARATUR.reichweite) {
      v.repar = Math.min(1, v.repar + tempo * dt);
      if (Math.random() < dt * 8) partikel(v.x, 0.6, v.z, 0x5ff0e0, 1, 2);
      if (v.repar >= 1) {
        v.laeuft = true; v.gerettet = true; v.abfahrtT = REPARATUR.abfahrt; v.bilder = BILD.helferbot; v.hp = v.maxHp; v.hinweis = undefined;
        zahl(v.x, 2, v.z, TX('Gerettet!'), 'big'); partikel(v.x, 0.8, v.z, 0x5ff0e0, 14, 3); geraeusch('bauen');
        continue;
      }
    }
    v.hinweis = TX`Reparatur ${Math.round(v.repar * 100)} %`;
  }
  // Die Trupps kommen nacheinander, beim letzten vielleicht der Erzfeind
  while (A.gruppen.length && A.t >= A.gruppen[0][0]) {
    const [, liste] = A.gruppen.shift();
    liste.forEach(([t, n]) => { for (let i = 0; i < n + Math.ceil(Math.min(G.extra, REPARATUR.extraMax) * n / 6); i++) gegnerErstellen(t); });   /* höchstens doppelte Trupps, sonst erdrücken sie den Helden beim Reparieren */
    meldung(TX('Eiferer!'), TX('Sie haben Ölkannen dabei. Halte sie von den Robotern fern.'), 1600);
    if (!A.gruppen.length && SPIEL.bestehende && SPIEL.bestehende.nemesis) spaeter(3, 'nemesisTrupp');
  }
  const offen = A.bots.filter(v => !v.laeuft && v.hp > 0).length, laufen = A.bots.filter(v => v.laeuft && v.hp > 0).length;
  if (!offen && !laufen) return verloren(TX('Kein Roboter läuft mehr'));
  if (!A.gruppen.length && !offen && !G.gegner.some(e => e.hp > 0 && !e.def.objekt)) auftragGeschafft(TX('Die Halle läuft wieder'));
}
// Ein reparierter Roboter ist gerettet: Er rollt zum Rand und verlässt die Halle, statt sich in den Kampf zu werfen.
// Für Sieg und Wahl zählt er weiter (laeuft und hp bleiben), nur aus dem Kampf ist er heraus.
function roboterAbfahrt(v, dt) {
  v.abfahrtT -= dt;
  const zx = v.x < 0 ? -FELD.x : FELD.x, dx = zx - v.x;
  v.x += Math.sign(dx) * Math.min(Math.abs(dx), 3.2 * dt); v.bewegt = true; v.laufT += dt; v.blick = dx >= 0 ? 1 : -1;
  if (v.abfahrtT <= 0 || Math.abs(dx) < 0.8) { const i = G.verbuendete.indexOf(v); if (i >= 0) G.verbuendete.splice(i, 1); entfernen(v); infoWeg(v); partikel(v.x, 0.8, v.z, 0x5ff0e0, 8, 2); }
}
// Ein Roboter fällt: Kaputte werden gesalbt und kämpfen für den inneren Kreis
function roboterVerloren(v) {
  const A = G.auftrag;
  if (!A || !A.bots) return;
  if (v.laeuft) { meldung(TX('Ein Roboter ist zerstört'), null, 1400); return; }
  A.gesalbt = (A.gesalbt || 0) + 1;
  gegnerErstellen('wartungsbot', v.x, v.z);
  zahl(v.x, 2.2, v.z, TX('Gesalbt!'), 'hurt'); partikel(v.x, 0.8, v.z, 0x3a3040, 12, 3);
  meldung(TX('Ein Roboter wurde gesalbt'), TX('Jetzt kämpft er für den inneren Kreis.'), 1800);
}
// Am Ende: die reparierten Roboter laufen lassen oder verschrotten
function reparaturWahl() {
  const A = G.auftrag, n = A.bots.filter(v => v.laeuft && v.hp > 0).length, R = REPARATUR;
  return {
    frage: TX`${n} von ${A.bots.length} Robotern laufen wieder. Was soll mit ihnen geschehen?`,
    optionen: [
      { text: TX('Laufen lassen'), info: TX`Sie arbeiten weiter für ihren Verbund. Wartung +${R.laufen.wartung * n}`,
        wirkung: () => { clusterAendern('wartung', R.laufen.wartung * n); SPIEL.roboterFreunde = (SPIEL.roboterFreunde || 0) + n; } },
      { text: TX('Verschrotten'), info: TX`+${R.schrott.teile * n} Lazi-Teile · Produktion +${R.schrott.produktion * n} · Wartung ${R.schrott.wartung * n}`,
        wirkung: erg => { erg.teile += R.schrott.teile * n; SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + n; clusterAendern('produktion', R.schrott.produktion * n); clusterAendern('wartung', R.schrott.wartung * n); } },
    ],
  };
}

// ---------------------------------------------------------------------
// Spielfelder der Verbund-Missionen
// ---------------------------------------------------------------------
// Die Wartungshalle neben dem Kraftwerk: Betonboden mit Warnstreifen, Schaltschränke, Rohre, Kisten
function aufbauWartungshalle() {
  szene.background = new THREE.Color('#08080c');
  const F = FELD;
  const boden = malBoden(60, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.4 + Math.cos(z * 1.1) * 0.4;
    if (Math.abs(x) > F.x + 0.8 + wob || z < F.zMin - 0.6) return 'mauer';
    if (z > F.zMax + 1 + wob) return 'kies';
    return Math.sin(x * 0.45 + z * 0.3) + Math.cos(z * 0.7 - x * 0.2) > 1.3 ? 'oel' : 'halle';
  }, {
    halle: ['#3a3846', '#403e4c', '#34323e', '#484654'],
    oel:   ['#24202a', '#2a2630', '#1e1a24', '#302c36'],
    kies:  ['#3e3c46', '#46444e', '#36343e', '#504e5a'],
    mauer: ['#3a1418', '#4a1c1e', '#2e1014', '#5a2424'],
  }, 83);
  const { g, toPx, r } = boden;
  // Platten mit Fugen und Nieten, gelbe Warnstreifen um die Arbeitsplätze der Roboter
  for (let z = F.zMin; z < F.zMax + 1; z += 2) for (let x = -F.x; x < F.x; x += 2) {
    g.fillStyle = '#26242e'; g.fillRect(toPx(x), toPx(z), 32, 1); g.fillRect(toPx(x), toPx(z), 1, 32);
    g.fillStyle = '#5a5868'; g.fillRect(toPx(x) + 2, toPx(z) + 2, 1, 1); g.fillRect(toPx(x) + 29, toPx(z) + 29, 1, 1);
  }
  HALLE_BOTS.forEach(([bx, bz]) => {
    for (let a = 0; a < Math.PI * 2; a += 0.03) { const x = bx + Math.cos(a) * 1.9, z = bz + Math.sin(a) * 1.9; g.fillStyle = Math.floor(a * 6) % 2 ? '#c8a030' : '#1d1328'; g.fillRect(toPx(x), toPx(z), 2, 2); }
  });
  for (let k = 0; k < 9; k++) { const cx = toPx(-13 + r() * 26), cy = toPx(F.zMin + 1 + r() * 16); for (let i = 0; i < 50; i++) { g.fillStyle = r() < 0.6 ? '#141018' : '#1e1824'; g.fillRect(cx + (r() * 12 - 6 | 0), cy + (r() * 7 - 3 | 0), 1, 1); } }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 1600);
  bodenMesh(boden, 60);
  // Hinten die Ziegelwand mit Schaltschränken, an den Seiten Rohre und Kisten
  for (let x = -F.x - 1; x <= F.x + 1; x += 2) decoBild(BILD.ziegelwand[Math.abs(x) % 3], x, F.zMin - 0.4, 0, 0);
  [-10, -6, -2, 2, 6, 10].forEach((x, i) => animDeko(decoBild(BILD.schaltschrank[0], x, F.zMin + 0.3, 0.5), BILD.schaltschrank, 1.1 + i * 0.3));
  [-12, 12].forEach(x => animDeko(decoBild(BILD.foerderband[0], x, F.zMin + 1.4, 0, 0), BILD.foerderband, 4));
  [[-13, 1], [13, -1], [-13.4, 6.5], [13.2, 7]].forEach(([x, z], i) => decoBild(BILD.kisten[i % 2], x, z, 0.9, 1));
  [[-11, -1.5], [11.5, 1.5], [-2.8, 8.2], [3.2, 8.4]].forEach(([x, z]) => decoBild(BILD.oelfass, x, z, 0.4));
  [[-14.5, -6], [14.5, -6], [-14.5, 4], [14.5, 4]].forEach(([x, z], i) => animDeko(decoBild(BILD.industrielampe[0], x, z, 0.3, 0.3), BILD.industrielampe, 0.6 + i * 0.4));
  [[0, -2], [-3, -6.5], [3.5, 0.5]].forEach(([x, z]) => decoBild(BILD.saeule, x, z, 0.55, 0.6));
  [[-6, F.zMin - 0.1], [6, F.zMin - 0.1]].forEach(([x, z], i) => decoBild(BILD.rohr[i], x, z + 1.0, 0, 0));
  lichtFleck(0, F.zMin + 2, 4, 0x5ff0e0, 0.07, 0.03);
}

// Der Konvoi: eine alte Schnellstraße quer durch die Stadt, Wracks am Rand, Hochhäuser dahinter
function aufbauKonvoi() {
  szene.background = new THREE.Color('#0a0c10');
  const F = FELD;
  const boden = malBoden(104, 16, (x, z) => {
    const d = Math.abs(z - konvoiZ(x)), wob = neueGrafik() ? 0 : Math.sin(x * 0.7 + z * 0.5) * 0.25;
    if (d < 2.6 + wob) return 'asphalt';
    if (d < 3.6 + wob) return 'gehweg';
    if (Math.abs(z) > F.zMax + 1 + wob) return 'schutt';
    return Math.sin(x * 0.9 + z * 0.4) + Math.cos(x * 0.31 - z) * 0.5 > 0.4 ? 'moos' : 'schutt';
  }, {
    asphalt: ['#34323e', '#3a3846', '#2e2c38', '#44424e'],
    gehweg:  ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    schutt:  ['#2e2c38', '#36343f', '#26242e', '#3e3c48'],
    moos:    ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
  }, 91);
  const { g, toPx, r } = boden;
  // Mittelstreifen und Risse mit Gras
  for (let x = -F.x; x < F.x; x += 1.4) { g.fillStyle = '#8a8058'; g.fillRect(toPx(x), toPx(konvoiZ(x)), 10, 2); }
  for (let k = 0; k < 60; k++) {
    let x = toPx(-F.x + r() * F.x * 2), y = toPx(-4 + r() * 8), dx = r() < 0.5 ? 1 : -1;
    for (let st = 0; st < 16 + r() * 30; st++) { g.fillStyle = '#22202a'; g.fillRect(x, y, 1, 1); if (r() < 0.25) { g.fillStyle = '#3e5a34'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += dx; else y += 1; }
  }
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'moos', 3200, [['#1e3420', '#4a6a3a'], ['#243c26', '#5a7a44']]);
  streuDetails(boden, () => true, 3000);
  bodenMesh(boden, 104);
  const rr = zufall(97);
  // Wracks und Schutt neben der Straße (Deckung), dahinter Hochhäuser
  for (let x = -40; x < 40; x += 6 + rr() * 5) {
    const seite = rr() < 0.5 ? -1 : 1, z = konvoiZ(x) + seite * (4.4 + rr() * 2);
    if (Math.abs(z) > F.zMax - 1) continue;
    if (rr() < 0.55) decoBild(BILD.autowrack[Math.floor(rr() * 4)], x, z, 1.1); else decoBild(BILD.schutt[Math.floor(rr() * 3)], x, z, 0.9);
  }
  for (let x = -54; x < 54; x += 8 + rr() * 6) decoBild(BILD.hochhaus[Math.floor(rr() * 4)], x, -F.zMax - 4 - rr() * 4, 0, 0);
  for (let x = -54; x < 54; x += 5 + rr() * 5) decoBild(rr() < 0.5 ? BILD.ruine[Math.floor(rr() * 4)] : BILD.laubbaum[Math.floor(rr() * 4)], x, F.zMax + 2.5 + rr() * 4, 0, 0.8);
  for (let x = -44; x < 44; x += 14) animDeko(decoBild(BILD.reklame[Math.abs(Math.round(x)) % 2], x, -F.zMax - 1.2, 0.3), BILD.reklame, 0.7 + Math.abs(x) * 0.01);
  [-20, 6, 30].forEach(x => decoBild(BILD.laterne, x, konvoiZ(x) - 3.4, 0.22));
}

// Der Lesesaal unter der Universität: Regale, Lesepulte, vorne die große Lazi-Tafel
// Der Lesesaal unter dem Archiv (seit 0.3.24): eine Halle mit zwei Säulenreihen. Im Mittelschiff stehen Lesepulte,
// in den Seitenschiffen Regale, im Norden leuchtet die große Lazi-Tafel. Die Eiferer kommen die Treppe vom Archiv herunter,
// Käfer und Plünderer durch die zwei Seitentüren (alte Gänge unter der Universität). Licht geben nur Tafel und Pulte.
const SAAL_FLAECHEN = [[-12.6, -7.6, 12.6, 9], [-2.4, 7, 2.4, 11.6], [-16, -0.6, -10.6, 2.6], [10.6, -0.6, 16, 2.6]];   // Türen reichen weit in den Saal, damit auch breite Gegner durchkommen
const SAAL_ZUGAENGE = [[0, 11], [-15.4, 1], [15.4, 1]];
function aufbauLesesaal() {
  szene.background = new THREE.Color('#07080c');
  const fein = neueGrafik() ? 2 : 1, [HALLE, TREPPE, TUER_W, TUER_O] = SAAL_FLAECHEN;
  const imR = (f, x, z, m) => x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m;
  const boden = malBoden(48, 16 * fein, (x, z) => {
    if (imR(TREPPE, x, z, 0) && z > HALLE[3]) return 'treppe';
    if ((imR(TUER_W, x, z, 0) || imR(TUER_O, x, z, 0)) && !imR(HALLE, x, z, 0)) return 'gang';
    if (!imR(HALLE, x, z, 0.2)) return 'mauer';
    if (Math.abs(x) < 1.8) return 'teppich';
    if (Math.abs(x) < 7.6) return 'marmor';
    return 'parkett';
  }, {
    marmor:  ['#4e4a52', '#58545c', '#46424a', '#625e66'],
    parkett: ['#4a3624', '#54402c', '#402e1e', '#5e4832'],
    teppich: ['#4a1a22', '#5a2028', '#3e141c', '#6a2a30'],
    treppe:  ['#4a464e', '#54505a', '#403c46', '#5e5a64'],
    gang:    ['#24222a', '#2a2830', '#201e26', '#302e36'],
    mauer:   ['#1a1820', '#201e28', '#16141c', '#26242e'],
  }, 101);
  const { g, toPx, r } = boden, P2 = toPx, w = v => Math.max(1, v * fein);
  // Marmorplatten im Schachbrett, Dielen in den Seitenschiffen, goldene Kante am Teppich
  for (let x = -7.6; x < 7.6; x += 1.2) for (let z = HALLE[1]; z < HALLE[3]; z += 1.2) if (Math.abs(x + 0.6) > 1.8 && (Math.round(x / 1.2) + Math.round(z / 1.2)) % 2) { g.fillStyle = 'rgba(20,18,24,0.22)'; g.fillRect(P2(x), P2(z), P2(x + 1.2) - P2(x), P2(z + 1.2) - P2(z)); }
  for (const s of [-1, 1]) for (let z = HALLE[1]; z < HALLE[3]; z += 0.5) { g.fillStyle = '#2e2014'; g.fillRect(P2(s > 0 ? 7.6 : -12.6), P2(z), P2(12.6) - P2(7.6), w(1)); }
  for (let z = HALLE[1]; z < HALLE[3] + 0.2; z += 1) for (const x of [-1.8, 1.8]) { g.fillStyle = '#c8a030'; g.fillRect(P2(x), P2(z), w(1), w(4)); }
  // Treppe hinauf ins Archiv: Stufen werden nach oben heller, oben fällt Licht aus dem Archiv herein
  for (let z = HALLE[3], n = 0; z < TREPPE[3] + 1; z += 0.45, n++) { const h = Math.min(1, n / 7); g.fillStyle = `rgb(${70 + h * 120},${66 + h * 112},${74 + h * 96})`; g.fillRect(P2(TREPPE[0]), P2(z), P2(TREPPE[2]) - P2(TREPPE[0]), P2(z + 0.45) - P2(z)); g.fillStyle = `rgb(${120 + h * 110},${116 + h * 104},${124 + h * 90})`; g.fillRect(P2(TREPPE[0]), P2(z), P2(TREPPE[2]) - P2(TREPPE[0]), w(1)); g.fillStyle = '#2a2830'; g.fillRect(P2(TREPPE[0]), P2(z + 0.3), P2(TREPPE[2]) - P2(TREPPE[0]), w(1)); }
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(240,220,170,${0.06 + i * 0.05})`; g.fillRect(P2(TREPPE[0] - 0.3), P2(TREPPE[3] - 2.4 + i * 0.4), P2(TREPPE[2] + 0.3) - P2(TREPPE[0] - 0.3), P2(TREPPE[3] + 1) - P2(TREPPE[3] - 2.4 + i * 0.4)); }   // Licht aus dem Archiv oben
  // Wände rings um den Saal (Mauerkrone), offen an Treppe und Türen; Türrahmen aus dunklem Holz
  const wand = (x0, z0, x1, z1) => { g.fillStyle = '#3a3640'; g.fillRect(P2(x0), P2(z0), P2(x1) - P2(x0), P2(z1) - P2(z0)); g.fillStyle = '#4e4a56'; g.fillRect(P2(x0), P2(z0), P2(x1) - P2(x0), w(1)); for (let x = x0; x < x1; x += 0.6) { g.fillStyle = '#2a2830'; g.fillRect(P2(x), P2(z0), w(1), P2(z1) - P2(z0)); } };
  for (const s of [-1, 1]) { const a = s < 0 ? -13.3 : 12.6, b = a + 0.7; wand(a, HALLE[1] - 0.3, b, TUER_W[1]); wand(a, TUER_W[3], b, HALLE[3] + 0.6); for (const z of [TUER_W[1] - 0.4, TUER_W[3]]) { g.fillStyle = '#8a5a34'; g.fillRect(P2(a - 0.25), P2(z), P2(b + 0.25) - P2(a - 0.25), P2(z + 0.4) - P2(z)); g.fillStyle = '#b07a48'; g.fillRect(P2(a - 0.25), P2(z), P2(b + 0.25) - P2(a - 0.25), w(1)); g.fillStyle = '#3a2414'; g.fillRect(P2(a - 0.25), P2(z + 0.32), P2(b + 0.25) - P2(a - 0.25), w(1)); } }
  wand(-13.3, HALLE[3], TREPPE[0], HALLE[3] + 0.6); wand(TREPPE[2], HALLE[3], 13.3, HALLE[3] + 0.6);
  // Staub und Ölflecken der Eiferer
  for (let k = 0; k < 8; k++) { const cx = P2(-10 + r() * 20), cy = P2(-5 + r() * 12); for (let i = 0; i < 50 * fein; i++) { g.fillStyle = r() < 0.6 ? '#141018' : '#1e1824'; g.fillRect(cx + (r() * 10 - 5) * fein | 0, cy + (r() * 6 - 3) * fein | 0, w(1), w(1)); } }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 900 * fein * fein);
  bodenMesh(boden, 48);
  // Hinten eine Wand aus Regalen hinter der Tafel, an den Seitenwänden Regale (an den Türen frei)
  for (let x = -13.6; x <= 13.6; x += 1.9) if (Math.abs(x) > 3.6) decoBild(BILD.regal[Math.abs(Math.round(x)) % 3], x, HALLE[1] - 0.6, 0, 0);
  for (const x of [-11.6, 11.6]) for (const z of [-5.2, 5.6]) decoBild(BILD.regal[(Math.round(Math.abs(x)) + Math.round(z)) % 3], x, z, 1.0, 0.9);
  // Zwei Säulenreihen trennen Mittel- und Seitenschiffe
  for (const x of [-8.2, 8.2]) for (const z of [-5, -1, 3, 7]) decoBild(BILD.saeule, x, z, 0.55, 0.6);
  // Lesepulte im Mittelschiff, sie zeigen noch Text der Alten
  [[-4.2, -3], [4.2, -3], [-4.2, 1], [4.2, 1], [-4.2, 5], [4.2, 5]].forEach(([x, z], i) => animDeko(decoBild(BILD.lesepult[0], x, z, 0.6, 0.6), BILD.lesepult, 1.1 + i * 0.3));
  // Die Eiferer haben Kisten mit Öl an den Türen abgestellt
  [[-10.6, 3.4], [10.6, -2.4]].forEach(([x, z], i) => decoBild(BILD.kisten[i], x, z, 0.8, 0.8));
  lichtFleck(0, HALLE[1] + 1.6, 4.5, 0x5ff0e0, 0.1, 0.04);
}

function auftragGeschafft(titel) {
  if (G.phase === 'fertig') return;
  G.phase = 'fertig'; G.endeT = 1.8;
  G.punkte += 200;
  meldung(titel, MIS.siegTitel, 2000);
  geraeusch('welle');
}

// Der Fuchs flieht über seine Route. Ist der Spieler weit weg, wartet er und verspottet ihn.
function diebBewegen(e, dt) {
  const A = G.auftrag, ziel = A.route[e.wp];
  if (!ziel) { if (G.zustand === 'spiel') verloren(TX('Der Fuchs ist entkommen')); return; }
  // Getroffen: kurz stolpern. Fünf Treffer kurz hintereinander: Er schlägt einen Haken und sprintet davon.
  e.stolperCd = (e.stolperCd || 0) - dt;
  if (e.hp < e.letzteHp) {
    if (e.stolperCd <= 0) { e.stolperT = 0.35; e.stolperCd = 1.6; }
    e.treffer = e.treffer.filter(t => G.zeit - t < 2); e.treffer.push(G.zeit);
    if (e.treffer.length >= 5 && !(e.sprintT > 0)) { e.sprintT = 1.1; e.treffer = []; e.stolperT = 0; zahl(e.x, 2.4, e.z, TX('Haken!'), 'block'); partikel(e.x, 0.3, e.z, 0x77768e, 8, 3); }
  }
  e.letzteHp = e.hp;
  // Bei jedem Viertel verliert er etwas aus dem Sack
  const stufe = Math.floor((1 - e.hp / e.maxHp) * 4);
  while (e.beuteStufe < stufe) { e.beuteStufe++; for (let i = 0; i < 4; i++) beuteErstellen('gold', e.x, e.z, 3); beuteErstellen('teil', e.x, e.z, 1); zahl(e.x, 2.2, e.z, TX('Der Sack reißt!'), 'loot'); }
  // Seine Tricks: Bei 70 % pfeift er Kumpane herbei, bei 40 % wirft er eine Rauchbombe
  const anteil = e.hp / e.maxHp;
  if (A.trickStufe === 0 && anteil < 0.7) {
    A.trickStufe = 1; zahl(e.x, 2.6, e.z, '*Pfiff*', 'big'); meldung(TX('Der Fuchs pfeift'), TX('Seine Kumpane springen aus den Ruinen'), 1800);
    const s = wegNaechster(e.x, e.z)[3];
    for (let i = 0; i < 3; i++) { const [x, z] = wegPunkt(Math.min(STADT_FUCHS_ZAUN - 4, Math.max(0, s - 2 + i * 2))); /* Kumpane nie hinter dem Zaun */ gegnerErstellen(i === 1 ? 'schildtraeger' : 'pluenderer', x + zz(-3, 3), z + zz(-3, 3)); }
  }
  if (A.trickStufe === 1 && anteil < 0.4) {
    A.trickStufe = 2; e.rauchT = 2.2; e.sprintT = 1.6;
    for (let i = 0; i < 26; i++) partikel(e.x + zz(-1.5, 1.5), 0.6, e.z + zz(-1.5, 1.5), 0x8a8898, 1, 1.5);
    zahl(e.x, 2.6, e.z, TX('Rauchbombe!'), 'big'); geraeusch('explosion');
  }
  if (e.rauchT > 0) { e.rauchT -= dt; e.sprite.visible = Math.floor(G.zeit * 10) % 3 === 0; if (Math.random() < dt * 12) partikel(e.x, 0.8, e.z, 0x8a8898, 1, 1); }
  else e.sprite.visible = true;
  const dp = abstand(e, P);
  e.bewegt = false;
  // Krähenfüße hinter sich werfen, wenn du ihm auf den Fersen bist
  e.fallenT = (e.fallenT === undefined ? 5 : e.fallenT) - dt;
  if (e.fallenT <= 0 && dp < 8 && A.fallen.length < 4) {
    e.fallenT = 5.5 + Math.random() * 2;
    const m = bodenFlaeche(scheibeGeo, 0x9a98ac, 0.5); m.position.set(e.x, 0.02, e.z); m.scale.setScalar(0.9);
    A.fallen.push({ x: e.x, z: e.z, t: 12, mesh: m });
    zahl(e.x, 2.2, e.z, TX('Krähenfüße'), 'block');
  }
  if (dp > 9 && e.wp > 0) {
    e.blick = P.x > e.x ? 1 : -1;
    e.spottT = (e.spottT || 0) - dt;
    if (e.spottT <= 0) { e.spottT = 3.5; zahl(e.x, 2.4, e.z, DIEB_SPRUECHE[Math.floor(Math.random() * DIEB_SPRUECHE.length)], 'block'); }
    return;
  }
  // Er ist immer ein bisschen langsamer als du, egal welche Klasse du spielst
  let tempo = Math.min(e.def.tempo, P.tempo * 0.9) * gegnerTempoMal(e);
  // Alle paar Sekunden muss er verschnaufen. Das ist deine Chance.
  e.puste = (e.puste === undefined ? 8 : e.puste) - dt;
  if (e.puste <= 0 && !(e.sprintT > 0)) { e.puste = 5.5 + Math.random() * 2.5; e.keuchT = 1.7; zahl(e.x, 2.4, e.z, 'keucht', 'block'); }
  if (e.keuchT > 0) { e.keuchT -= dt; e.blick = P.x > e.x ? 1 : -1; return; }
  if (e.sprintT > 0) { e.sprintT -= dt; tempo *= 2.0; }
  else if (e.stolperT > 0) { e.stolperT -= dt; tempo *= 0.3; }
  if (e.klettern > 0) { e.klettern -= dt; tempo *= 0.35; if (Math.random() < dt * 10) partikel(e.x, 0.5, e.z, 0x77768e, 1, 1); }
  const dx = ziel[0] - e.x, dz = ziel[1] - e.z, d = Math.hypot(dx, dz);
  if (d < 0.6) {
    e.wp++;
    if (ziel[2] === 'zaun') { e.klettern = 4.0; zahl(e.x, 2.4, e.z, TX('Er klettert über den Zaun!'), 'big'); }
    else if (ziel[2]) { e.klettern = 1.4; zahl(e.x, 2.2, e.z, 'klettert', 'block'); }
    return;
  }
  e.x += dx / d * tempo * dt; e.z += dz / d * tempo * dt;
  e.bewegt = true; e.laufT += dt; e.blick = dx >= 0 ? 1 : -1;
}

// Was geschieht, wenn ein Objekt zerstört wird: Jeder Typ steht genau einmal in dieser Tabelle. Objekte ohne Eintrag verschwinden einfach.
// Jede Missionsdatei meldet ihre Objekte selbst an (objektFolgeAnmelden neben der Funktion, die die Folge ausführt).
const OBJEKT_ZERSTOERT = {};
function objektFolgeAnmelden(typ, folge) { OBJEKT_ZERSTOERT[typ] = folge; }
function objektFolgen() { return OBJEKT_ZERSTOERT; }
function objektZerstoert(e) {
  const folge = objektFolgen()[e.typ];
  if (folge) return folge(e);
}
objektFolgeAnmelden('zelt', zeltZerstoert);
// Zerstörte Zelte brennen weiter
function zeltZerstoert(e) {
  const rest = figur(BILD.zeltKaputt[1], 0);
  stelle(rest, e.x, e.z);
  animDeko(rest, BILD.zeltKaputt, 3);
  oelPfuetze(e.x, e.z + 0.5, 1.8, true);
  wackeln(0.3); geraeusch('explosion');
  const A = G.auftrag;
  if (A) zahl(e.x, 3, e.z, TX`Zelt ${A.zelteGesamt - A.zelte.filter(z => z.hp > 0 && z !== e).length} / ${A.zelteGesamt}`, 'big');
}

// Anzeige oben in der Mitte
function auftragHud() {
  const T = auftragstypen()[MIS.typ];
  if (T) T.hud(G.auftrag);
}
function verfolgungHud() {
  const d = G.dieb, weg = d ? Math.round(Math.min(1, wegNaechster(d.x, d.z)[3] / STADT_LAENGE) * 100) : 100;
  hudText('waveLabel', TX('Verfolgung'));
  hudText('waveSub', d && d.hp > 0 ? (abstand(d, P) > 9 ? TX('Er wartet auf dich. Lauf!') : TX`Abstand ${Math.round(abstand(d, P))} m`) : TX('Gefasst'));
  hudText('doorLabel', TX`Fluchtweg ${weg} %`);
  document.getElementById('doorFill').style.width = weg + '%';
}
function sturmHud(A) {
  const n = A.zelte.filter(z => z.hp > 0).length;
  hudText('waveLabel', MIS.lastlaeufer ? MIS.titel : TX('Sturm aufs Lager'));
  hudText('waveSub', TX`${A.zelteGesamt - n} von ${A.zelteGesamt} Zelten zerstört`);
  hudText('doorLabel', TX('Vorratszelte'));
  const hp = A.zelte.reduce((s, z) => s + Math.max(0, z.hp), 0), max = A.zelte.reduce((s, z) => s + z.maxHp, 0) || 1;
  document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
}
function eskorteHud() {
  const w = G.tuer, weg = Math.round(Math.max(0, Math.min(1, (w.x + 40) / (FELD.x - 4 + 40))) * 100);
  hudText('waveLabel', (G.runden ? TX`Abschnitt ${G.runde} · ` : TX('Eskorte · ')) + weg + ' %');
  const E = MIS.eskorte || ESKORTE_BIRKE;
  hudText('waveSub', w.faehrt ? E.hud[0] : abstand(P, w) >= 7 ? E.hud[1] : E.hud[2]);
  hudText('doorLabel', MIS.ziel.name);
  document.getElementById('doorFill').style.width = Math.max(0, w.hp / w.maxHp * 100) + '%';
}
function reparaturHud(A) {
  const B = A.bots, ok = B.filter(v => v.laeuft && v.hp > 0).length, weg = B.filter(v => v.hp <= 0).length;
  hudText('waveLabel', TX('Wartungshalle'));
  hudText('waveSub', TX`${ok} repariert · ${weg} verloren · noch ${A.gruppen.length} von ${A.trupps} Trupps`);
  hudText('doorLabel', TX('Roboter'));
  document.getElementById('doorFill').style.width = ((B.length - weg) / B.length * 100) + '%';
}

// ---------------------------------------------------------------------
// Die Aufträge als Missionen
// ---------------------------------------------------------------------
const DIEB_SPRUECHE = [TX('Zu langsam, Blechdose!'), TX('Hier drüben!'), TX('Hehehe!'), TX('Der Kern gehört jetzt mir!'), TX('Na komm schon!'), TX('Gähn.')];
Object.assign(MISSIONEN, {
  verfolgung: { ...MISSIONSTEXTE.verfolgung, ort: 'stadt', typ: 'verfolgung',
    feld: { x: 19.5, zMin: -46, zMax: 44, korridor: { weg: STADT_WEG, breite: STADT_BREITE } }, start: [-14, 41], aufbau: () => aufbauStadt(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 40; erg.teile += 6; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + 2; erg.material.herzkristall = (erg.material.herzkristall || 0) + 1; erg.ueberlebende = 1; erg.lore = [['fuchs', 'fuchs2', 'fuchs3'].find(id => !hatLore(id)) || 'fuchs3']; } },
  bunker: { ...MISSIONSTEXTE.bunker, ort: 'stadt', stand: {},
    feld: { x: 26, zMin: -14.5, zMax: 19.6, flaechen: BUNKER_FLAECHEN, zugaenge: BUNKER_ZUGAENGE, freieDeko: true }, start: [0, -5.5], aufbau: () => aufbauBunker(),
    wellen: () => WELLEN_BUNKER, musik: 'kampf',
    ziel: { name: TX('Bunkertür'), art: 'tuer', x: 0, z: -9.1, r: 1.3, leben: () => CFG.kellertuer.leben, bilder: () => BILD.bunkertor, verlust: TX('Die Bunkertür ist aufgebrochen') },
    runden: () => SPIEL.epoche >= 1 && (SPIEL.karte.erledigt.stadt || 0) >= 1 && Math.random() < RUNDEN.bunkerChance + (gebaeudeWert('bunkerfunk') || 0) ? { anzahl: 2, freiwillig: true } : null,
    belohnung: (erg, siege) => { erg.ueberlebende += zzGanz(3, 6) + Math.floor((SPIEL.siege || 0) / 4) + (gebaeudeWert('bunkerLeute') || 0); erg.teile += zzGanz(1, 3); erg.lore = siege ? [] : ['bunker']; } },
  sturm: { ...MISSIONSTEXTE.sturm, ort: 'lager', typ: 'sturm',
    feld: { x: 16.5, zMin: -16, zMax: 12.6, flaechen: LAGER_FLAECHEN, zugaenge: LAGER_ZUGAENGE, freieDeko: true }, start: [0, 10.4], aufbau: () => aufbauLager(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 60; erg.holz += 30; erg.stein += 20; erg.teile += 6; erg.nahrung += 30; erg.ueberlebende = zzGanz(2, 4); erg.lore = ['lager']; } },
  eskorte: { ...MISSIONSTEXTE.eskorte, ort: 'birkenstrasse', typ: 'eskorte',
    feld: { x: 46, zMin: -8, zMax: 8 }, start: [-37, neueGrafik() ? 4 : 1.5], aufbau: () => aufbauStrasse(), ziel: { name: TX('Karren'), art: 'wagen', x: -40, z: 0, r: 1.4, leben: () => 340 },
    wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.nahrung += 70; erg.gold += 20; erg.holz += 15; erg.ueberlebende = 2; erg.beziehung = { birkenhain: 1.5 }; erg.lore = ['lastlaeufer']; clusterAendern('logistik', 10); } },
});

// ---------------------------------------------------------------------
// Geschichten der Verbund-Missionen und der seltenen Missionen
// ---------------------------------------------------------------------

Object.assign(MISSIONEN, {
  wartungshalle: { ...MISSIONSTEXTE.wartungshalle, ort: 'kraftwerk', typ: 'reparatur',
    feld: { x: 15, zMin: -9, zMax: 9.5 }, start: [0, 7], aufbau: () => aufbauWartungshalle(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 25; erg.teile += zzGanz(2, 4); const n = G.auftrag.gesalbt || 0; if (n) clusterAendern('wartung', REPARATUR.gesalbt.wartung * n); erg.lore = ['halle']; },
    wahl: () => reparaturWahl() },
  konvoi: { ...MISSIONSTEXTE.konvoi, ort: 'stadt', typ: 'eskorte', eskorte: ESKORTE_KONVOI, wegZ: konvoiZ,
    feld: { x: 46, zMin: -8, zMax: 8 }, start: [-37, neueGrafik() ? 4 : 1.5], aufbau: () => aufbauKonvoi(),
    ziel: { name: TX('Lastläufer'), art: 'wagen', x: -40, z: 0, r: 1.4, leben: () => 420, bilder: () => BILD.konvoi, verlust: TX('Der Konvoi ist zerstört') },
    wellen: () => [], musik: 'kampf',
    runden: () => ({ anzahl: 2, freiwillig: false }),
    belohnung: erg => { erg.gold += 20; erg.teile += zzGanz(4, 6); erg.nahrung += 15; clusterAendern('logistik', 8); erg.lore = ['konvoi']; } },
  lesesaal: { ...MISSIONSTEXTE.lesesaal, ort: 'universitaet', belohnungAllein: true, stand: {},
    feld: { x: 16, zMin: -7.6, zMax: 11.6, flaechen: SAAL_FLAECHEN, zugaenge: SAAL_ZUGAENGE, freieDeko: true }, start: [0, -4.5], aufbau: () => aufbauLesesaal(),
    wellen: () => WELLEN_LESESAAL, musik: 'kampf',
    ziel: { name: TX('Große Lazi-Tafel'), art: 'tuer', x: 0, z: -8.2, r: 2.0, leben: () => Math.round(CFG.kellertuer.leben * 1.2), bilder: () => BILD.grosseTafel, verlust: TX('Die große Tafel ist zerschlagen') },
    pauseText: TX('Eine Truhe ist aufgetaucht. Ebert wischt das Öl von der Tafel.'),
    runden: () => Math.random() < RUNDEN.lesesaalChance ? { anzahl: 2, freiwillig: true } : null,
    belohnung: erg => { erg.gold += 20; erg.teile += zzGanz(3, 5); erg.material.buecher = (erg.material.buecher || 0) + zzGanz(3, 5); clusterAendern('wissen', 10); erg.lore = ['lesesaal']; } },
  pilger: Object.assign({}, MISSIONEN.wald, { ...MISSIONSTEXTE.pilger, belohnungAllein: true,
    belohnung: erg => {
      erg.nahrung += 10 + G.fleisch * 5; erg.holz += 10 + G.holzGesammelt * 2; erg.ueberlebende += zzGanz(1, 3);
      const B = SPIEL.bestehende; if (B) B.zorn = Math.max(0, B.zorn - 10);
      clusterAendern('wartung', 5); clusterAendern('energie', 3); erg.lore = ['pilger'];
    } }),
  befreiung: Object.assign({}, MISSIONEN.sturm, { ...MISSIONSTEXTE.befreiung, lastlaeufer: true, aufbau: () => aufbauLager(true), belohnung: erg => { erg.gold += 40; erg.teile += zzGanz(6, 9); erg.nahrung += 15; clusterAendern('logistik', 10); clusterAendern('wartung', 4); erg.lore = ['befreiung']; } }),
});

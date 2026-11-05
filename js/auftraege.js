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

// Die verlassene Stadt: ein verwinkelter Weg zwischen überwucherten Häuserblöcken.
// Die Straße biegt immer wieder nach links und rechts ab, außerhalb liegt Schutt.
const STADT_WEG = [[-12, 42], [-12, 26], [12, 26], [12, 8], [-12, 8], [-12, -10], [12, -10], [12, -28], [0, -28], [0, -46]];
const STADT_BREITE = 4.2;
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
// Bunker in der Stadt: ein Platz zwischen Hochhausruinen, im Norden der Betonklotz mit der Bunkertür
// Die Bunkertür liegt am Ende einer Sackgasse an einer Straßenkreuzung. Zwischen den Straßen stehen Häuserblöcke,
// die Plünderer kommen über die drei Straßenenden (anders als im runden Hof der Universität).
const BUNKER_STRASSEN = [[-4.5, -8.6, 4.5, 13], [-15, -0.5, 15, 6.5], [-8, -8.6, 8, -4.5]];
function aufbauBunker() {
  szene.background = new THREE.Color('#0a0c10');
  const F = FELD;
  const strasse = (x, z, rand) => BUNKER_STRASSEN.some(([x0, z0, x1, z1]) => x > x0 - rand && x < x1 + rand && z > z0 - rand && z < z1 + rand);
  const boden = malBoden(60, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 1.1) * 0.4 + Math.cos(z * 1.3) * 0.4;
    if (z < -9.6) return 'beton';
    if (strasse(x, z, 0)) return Math.abs(x) < 3.2 + wob * 0.3 || Math.abs(z - 3) < 2.6 + wob * 0.3 ? 'asphalt' : 'gehweg';
    if (strasse(x, z, 0.9 + wob * 0.3)) return 'gehweg';
    return Math.sin(x * 0.9) * Math.cos(z * 0.7) + Math.sin((x - z) * 0.37) * 0.6 > 0.55 ? 'moos' : 'schutt';
  }, {
    asphalt: ['#34323e', '#3a3846', '#2e2c38', '#44424e'],
    gehweg:  ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    beton:   ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    schutt:  ['#2e2c38', '#36343f', '#26242e', '#3e3c48'],
    moos:    ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
  }, 19);
  const { g, toPx, r } = boden;
  // Risse im Asphalt, aus denen Gras wächst, und verblasste Straßenlinien
  for (let k = 0; k < 36; k++) {
    let x = toPx(-13 + r() * 26), y = toPx(-8 + r() * 20), dx = r() < 0.5 ? 1 : -1, dy = 1;
    for (let s = 0; s < 20 + r() * 40; s++) { g.fillStyle = '#22202a'; g.fillRect(x, y, 1, 1); if (r() < 0.25) { g.fillStyle = '#3e5a34'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += dx; else y += dy; }
  }
  for (let x = -14; x < 14; x += 1.2) { g.fillStyle = '#8a8058'; g.fillRect(toPx(x), toPx(3), 8, 2); }
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'moos', 2200, [['#1e3420', '#4a6a3a'], ['#243c26', '#5a7a44']]);
  streuDetails(boden, () => true, 2000);
  bodenMesh(boden, 60);
  const deko = (b, x, z, rad, schatten) => { z = dekoPlatz(b, x, z, rad); const o = figur(b, schatten === undefined ? (rad ? rad * 1.1 : 0) : schatten); stelle(o, x, z); if (rad) HINDERNISSE.push({ x, z, r: rad }); return o; };
  deko(BILD.bunkerklotz, 0, -10.4, 0, 0);
  deko(BILD.hochhaus[0], -12, -12.5, 0, 0); deko(BILD.hochhaus[2], 12.5, -13, 0, 0); deko(BILD.hochhaus[1], -20, -9, 0, 0); deko(BILD.hochhaus[3], 21, -8, 0, 0);
  deko(BILD.autowrack[0], -9.5, 4.8, 1.1); deko(BILD.autowrack[2], 8.8, 0.6, 1.1); deko(BILD.autowrack[1], 2.2, 10.6, 1.1);
  // Häuserblöcke zwischen den Straßen
  [[-11, -4.5], [-14, -6.5], [11, -4.5], [14, -6.5], [-9, 10], [-13.5, 10.5], [9, 10], [13.5, 10.5]].forEach(([x, z], i) => deko(i % 3 === 2 ? BILD.ruine[i % 4] : BILD.stadthaus[(i * 3) % BILD.stadthaus.length], x, z, 0, 0.6));
  deko(BILD.schutt[0], -6.4, 8.6, 0, 0); deko(BILD.schutt[1], 6.6, 8.2, 0, 0); deko(BILD.schutt[2], -10, -1.6, 0, 0);
  { const a = neueGrafik() ? 5.6 : 4.4; deko(BILD.laterne, -a, -7.6, 0.22); deko(BILD.laterne, a, -7.6, 0.22); }
  deko(BILD.barrikade, -2.9, -7.4, 0.8); deko(BILD.barrikade, 2.9, -7.4, 0.8);
  deko(BILD.tonne, -13.4, -6.4, 0.4); deko(BILD.tonne, 13.6, 2.6, 0.4);
  animDeko(deko(BILD.reklame[0], -9, -9.6, 0, 0), BILD.reklame, 1.3);
  const rr = zufall(53);
  for (let i = 0; i < 26; i++) {
    const x = -28 + rr() * 56, z = -6 + rr() * 26;
    if (Math.abs(x) < F.x + 2 && z < F.zMax + 2) continue;
    deko(rr() < 0.5 ? BILD.ruine[i % 4] : BILD.laubbaum[i % 4], x, z, 0, 0.8);
  }
}

// Der Fuchs wird in der Stadt gesehen: Dann wartet dort statt eines Bunkers die Jagd auf ihn
function fuchsSichtung(bericht) {
  const K = SPIEL.karte;
  if (K.fuchs || SPIEL.epoche < FUCHS.abEpoche || (K.erledigt.universitaet || 0) < FUCHS.abUniSiegen || !ortBekannt('stadt')) return;
  if (SPIEL.tag < (K.fuchsTag || -99) + FUCHS.pause) return;
  if (!K.fuchsGesehen || Math.random() < FUCHS.chance) {
    K.fuchs = true; K.fuchsGesehen = (K.fuchsGesehen || 0) + 1;
    bericht.push(K.fuchsGesehen === 1 ? TX('Kalle kommt außer Atem ins Dorf: In der Stadt rennt ein Dieb herum, mit etwas Rotem, Glühendem im Sack. Sie nennen ihn den Fuchs.') : TX('Der Fuchs wurde wieder in der Stadt gesehen. Wer schnell ist, erwischt ihn.'));
  }
}

function aufbauStadt() {
  szene.background = new THREE.Color('#0a0c10');
  const F = FELD;
  const boden = malBoden(104, 16, (x, z) => {
    const d = wegNaechster(x, z)[0], wob = neueGrafik() ? 0 : Math.sin(x * 0.7 + z * 0.5) * 0.25;
    if (d < 3.1 + wob) return 'asphalt';
    if (d < 4.5 + wob) return 'gehweg';
    return Math.sin(x * 0.9 + z * 0.4) > 0.3 ? 'moos' : 'schutt';
  }, {
    asphalt: ['#34323e', '#3a3846', '#2e2c38', '#44424e'],
    gehweg:  ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    schutt:  neueGrafik() ? ['#46444e', '#4e4c58', '#3e3c46', '#5a5862'] : ['#2e2c38', '#36343f', '#26242e', '#3e3c48'],
    moos:    neueGrafik() ? ['#3a4c3e', '#425844', '#344436', '#4e664c'] : ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
  }, 17);
  const { g, toPx, r } = boden;
  // Mittelstreifen entlang des Wegs, Risse mit Moos
  for (let s = 0; s < STADT_LAENGE; s += 2.4) { const [x, z] = wegPunkt(s); g.fillStyle = r() < 0.7 ? '#8a8060' : '#5a5440'; g.fillRect(toPx(x) - 1, toPx(z) - 1, 3, 3); }
  for (let k = 0; k < 220; k++) {
    let x = toPx(-17 + r() * 34), y = toPx(-46 + r() * 90);
    for (let s = 0; s < 20 + r() * 40; s++) { g.fillStyle = '#1e1c26'; g.fillRect(x, y, 1, 1); if (r() < 0.3) { g.fillStyle = r() < 0.5 ? '#3e5a34' : '#5a7a40'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += r() < 0.5 ? 1 : -1; else y += 1; }
  }
  streuGras(boden, (px, py) => boden.artBei(px, py) !== 'asphalt' || r() < 0.08, 4200, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, () => true, 3400);
  bodenMesh(boden, 104);
  // Häuserblöcke außerhalb der Straße. Hohe Türme nur dort, wo sie keine Straße verdecken.
  const rr = zufall(9);
  for (let z = -48; z <= 50; z += 3.6) for (let x = -24; x <= 24; x += 4.2) {
    const px = x + (rr() - 0.5) * 1.2, pz = z + (rr() - 0.5) * 1.2, d = wegNaechster(px, pz)[0];
    if (d < STADT_BREITE + 1.4) continue;
    let frei = true;
    for (let k = 1; k <= (neueGrafik() ? 15.5 : 12) && frei; k += 1.5) if (wegNaechster(px, pz - k)[0] < STADT_BREITE + 0.5) frei = false;
    if (frei && rr() < 0.85) decoBild(BILD.hochhaus[Math.floor(rr() * 4)], px, pz, 0, 0);
    else if (rr() < 0.75 && (!neueGrafik() || [1.5, 3, 4.5, 6.5].every(k => wegNaechster(px, pz - k)[0] >= STADT_BREITE + 0.5))) decoBild(BILD.ruine[Math.floor(rr() * 4)], px, pz, 0, 0);
    else decoBild(rr() < 0.5 ? BILD.schutt[Math.floor(rr() * 3)] : BILD.busch[Math.floor(rr() * 6)], px, pz, 0, 0.5);
  }
  // Autowracks und Schutt mitten auf der Straße. Der Fuchs klettert darüber, du läufst drumherum.
  const route = [];
  for (let s = 6, n = 0; s < STADT_LAENGE - 12; s += 6, n++) {
    const [x, z] = wegPunkt(s), wrack = n % 3 === 1;
    route.push([x, z, wrack]);
    if (wrack) {
      const [nx] = wegPunkt(s + 1), quer = Math.abs(nx - x) < 0.5;   // Fährt die Straße hier nach Süden?
      if (n % 2) { const o = decoBild(BILD.autowrack[n % 4], x, z, 0, 1.4); o.sprite.position.z = z;
        HINDERNISSE.push(quer ? { x: x - 0.8, z, r: 0.85 } : { x, z: z - 0.5, r: 0.85 }, quer ? { x: x + 0.8, z, r: 0.85 } : { x, z: z + 0.5, r: 0.85 }); }
      else decoBild(BILD.schutt[n % 3], x, z, 1.0);
    }
  }
  STADT_ROUTE = route.concat([[0, -40, false], [0, -42.4, 'zaun'], [0, -46, false]]);
  // Am Ende der Straße: ein hoher Zaun. Darüber muss der Fuchs klettern.
  for (let x = -4.6; x <= 4.6; x += 1.1) decoBild(BILD.zaun, x, -42.6, 0, 0);
  // Leuchtreklamen der Alten an den Ecken
  STADT_WEG.slice(1, -2).forEach(([x, z], i) => animDeko(decoBild(BILD.reklame[i % 2], x + (x > 0 ? 3.6 : -3.6), z - 3.6, 0.3), BILD.reklame, 0.7 + i * 0.3));
}
let STADT_ROUTE = [];

// Das Plündererlager am Fluss
function aufbauLager() {
  szene.background = new THREE.Color('#0c100e');
  const F = FELD;
  const fluss = z => 13.5 + Math.sin(z * 0.3) * 1.2;
  const boden = malBoden(64, 16, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.5 + Math.cos(z * 1.3) * 0.5;
    if (Math.abs(x - fluss(z)) < 1.6) return 'wasser';
    if (Math.abs(x) > F.x + 1 + wob || Math.abs(z) > F.zMax + 1 + wob) return 'wald';
    if (z < 2 + wob && Math.abs(x) < 12 + wob) return 'erde';
    return 'gras';
  }, {
    gras:   ['#3e5a34', '#46643a', '#36502e', '#52703f'],
    wald:   ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    erde:   ['#5a4630', '#664e36', '#4e3c2a', '#725a3e'],
    wasser: ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
  }, 29);
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'gras', 2200, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'wasser', 2400);
  bodenMesh(boden, 64);
  for (let z = -F.zMax - 2; z <= F.zMax + 2; z += 0.9) HINDERNISSE.push({ x: fluss(z), z, r: 1.3 });
  // Palisade, Barrikaden, Lagerfeuer
  for (let x = -13; x <= 13; x += 1.1) if (Math.abs(x) > 2.2) decoBild(BILD.zaun, x, 3.2, 0, 0);
  decoBild(BILD.barrikade, -3.5, 3.6, 0.8); decoBild(BILD.barrikade, 3.5, 3.6, 0.8);
  const feuerBilder = neueGrafik() ? BILD.feuerGross[0] : BILD.gebaeude.lagerfeuer, feuer = decoBild(feuerBilder[0], 0, -3, 0.8);
  animDeko(feuer, feuerBilder, neueGrafik() ? 12 : 7);
  const r = zufall(44);
  for (let i = 0; i < 120; i++) {
    const x = -30 + r() * 60, z = -24 + r() * 48;
    if (Math.abs(x) < F.x + 1.5 && Math.abs(z) < F.zMax + 1.5) continue;
    decoBild(r() < 0.55 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
  for (let i = 0; i < 6; i++) decoBild(BILD.laubbaum[i % 4], -14 + i * 5.4, 9 + (i % 2) * 2, 0.55, 1);
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
function auftragStarten() {
  const A = G.auftrag = { t: 0, spawnT: 3, fertig: false, ueberfaelle: 0 };
  G.phase = 'kampf'; G.welle = 0;
  if (MIS.typ === 'verfolgung') {
    // Die Route des Fuchses folgt der Straße um alle Ecken, über Wracks klettert er
    A.route = STADT_ROUTE.map(([x, z, k]) => [x, z, k]);
    A.fallen = []; A.trickStufe = 0;
    const d = gegnerErstellen('dieb', -12, 35);
    d.treffer = [];
    G.dieb = d; d.wp = 0; d.letzteHp = d.hp; d.beuteStufe = 0;
    meldung(TX('Der Fuchs!'), TX('Er hat einen Herzkristall. Hol ihn ein, bevor er am Ende der Stadt verschwindet. Pass auf seine Tricks auf.'), 3000);
    [[40, 'pluenderer'], [46, 'pluenderer'], [70, 'kaefer'], [95, 'schuetze'], [118, 'pluenderer'], [140, 'schildtraeger'], [165, 'kaefer'], [170, 'schuetze']].forEach(([s, t]) => { const [x, z] = wegPunkt(s); gegnerErstellen(t, x + zz(-2, 2), z + zz(-2, 2)); });
  } else if (MIS.typ === 'sturm') {
    A.zelte = [[-8, -7], [0, -9], [8, -6]].map(([x, z]) => { const e = gegnerErstellen('zelt', x, z); stelle(e, x, z); return e; });
    A.zelteGesamt = A.zelte.length;
    [[-11.5, -2], [11.5, -1]].forEach(([x, z]) => gegnerErstellen('ausguck', x, z));
    [['pluenderer', -4, -2], ['pluenderer', 4, -1], ['schildtraeger', 0, -5], ['brandstifter', -6, -10], ['trommler', 2, -11]].forEach(([t, x, z]) => gegnerErstellen(t, x, z));
    A.spawnT = 14;
    [[-3, -6.5], [5, -3.2], [-9, -1]].forEach(([x, z]) => fassErstellen(x, z));
    meldung(TX('Das Plündererlager'), TX('Brenn die drei Vorratszelte nieder. Feuer wirkt am besten: Öl, Fässer, Brandstifter, Feuerwaffen.'), 3200);
  } else if (MIS.typ === 'kraftwerk') {
    kraftwerkStarten();
  } else if (MIS.typ === 'fabrik') {
    fabrikStarten();
  } else if (MIS.typ === 'unterwelt') {
    unterweltStarten();
  } else if (MIS.typ === 'sabotage') {
    sabotageStarten();
  } else if (MIS.typ === 'finale') {
    finaleStarten();
  } else if (MIS.typ === 'zwiespalt') {
    zwiespaltStarten();
  } else if (MIS.typ === 'eskorte') {
    const E = MIS.eskorte || ESKORTE_BIRKE;
    A.ueberfallPunkte = E.punkte.slice();
    meldung(E.titel, E.start, 2800);
  } else if (MIS.typ === 'reparatur') {
    reparaturStarten(A);
  } else if (MIS.typ === 'markt') {
    marktStarten();
  }
}

function auftragAblauf(dt) {
  const A = G.auftrag;
  A.t += dt;
  if (MIS.typ === 'markt') return marktAblauf(dt);
  if (G.phase === 'fertig') { G.endeT -= dt; if (G.endeT <= 0) gewonnen(); return; }
  const lebend = G.gegner.filter(e => !e.def.objekt && !e.def.flieht && !e.def.stationaer).length;
  const mult = 1 + (SPIEL.siege || 0) * 0.05;
  if (MIS.typ === 'verfolgung') {
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
    if (A.spawnT <= 0 && lebend < 7 * mult) {
      A.spawnT = 7;
      const s = wegNaechster(P.x, P.z)[3] + 14 + Math.random() * 6;
      const [x, z] = wegPunkt(Math.min(STADT_LAENGE - 4, s));
      const typen = s > STADT_LAENGE / 2 ? ['pluenderer', 'kaefer', 'funkenkaefer', 'brandstifter', 'schildtraeger'] : ['pluenderer', 'kaefer', 'schuetze'];
      for (let i = 0; i < 2 + (s > STADT_LAENGE / 2 ? 1 : 0); i++) gegnerErstellen(typen[Math.floor(Math.random() * typen.length)], x + zz(-2.5, 2.5), z + zz(-2.5, 2.5));
    }
  } else if (MIS.typ === 'sturm') {
    A.zelte = A.zelte.filter(z => z.hp > 0);
    if (!A.zelte.length) return auftragGeschafft(TX('Das Lager brennt'));
    A.spawnT -= dt;
    if (A.spawnT <= 0 && lebend < 8 * mult) {
      A.spawnT = 7;
      const typen = ['pluenderer', 'pluenderer', 'schuetze', 'schildtraeger', 'brandstifter', 'kaefer'];
      const x = zz(-10, 10);
      for (let i = 0; i < 2 + (A.t > 60 ? 1 : 0); i++) gegnerErstellen(typen[Math.floor(Math.random() * typen.length)], x + zz(-1.5, 1.5), FELD.zMin + 0.8);
    }
  } else if (MIS.typ === 'kraftwerk') {
    kraftwerkAblauf(dt);
  } else if (MIS.typ === 'fabrik') {
    fabrikAblauf(dt);
  } else if (MIS.typ === 'unterwelt') {
    unterweltAblauf(dt);
  } else if (MIS.typ === 'sabotage') {
    sabotageAblauf(dt);
  } else if (MIS.typ === 'finale') {
    finaleAblauf(dt);
  } else if (MIS.typ === 'zwiespalt') {
    zwiespaltAblauf(dt);
  } else if (MIS.typ === 'eskorte') {
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
  } else if (MIS.typ === 'reparatur') {
    reparaturAblauf(A, dt);
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
function reparaturStarten(A) {
  A.bots = HALLE_BOTS.map(([x, z]) => {
    const v = Object.assign(figur(BILD.botKaputt[0], 0.5), { art: 'roboter', x, z, r: 0.55, hp: REPARATUR.leben, maxHp: REPARATUR.leben, blick: 1, cd: 0, hiebT: 0, laufT: 0, bewegt: false, blitz: 0, laeuft: false, repar: 0, hinweis: '' });
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
function reparaturAblauf(A, dt) {
  // Reparieren: Wer neben einem Roboter steht, setzt ihn wieder in Gang. Architekten können das schneller.
  const tempo = (SPIEL.klasse === 'architekt' ? REPARATUR.architekt : 1) / REPARATUR.zeit;
  for (const v of A.bots) {
    if (v.laeuft || v.hp <= 0) continue;
    if (P.hp > 0 && abstand(v, P) < REPARATUR.reichweite) {
      v.repar = Math.min(1, v.repar + tempo * dt);
      if (Math.random() < dt * 8) partikel(v.x, 0.6, v.z, 0x5ff0e0, 1, 2);
      if (v.repar >= 1) {
        v.laeuft = true; v.bilder = BILD.helferbot; v.hp = v.maxHp; v.hinweis = undefined;
        zahl(v.x, 2, v.z, TX('Läuft wieder!'), 'big'); partikel(v.x, 0.8, v.z, 0x5ff0e0, 14, 3); geraeusch('bauen');
        continue;
      }
    }
    v.hinweis = TX`Reparatur ${Math.round(v.repar * 100)} %`;
  }
  // Die Trupps kommen nacheinander, beim letzten vielleicht der Erzfeind
  while (A.gruppen.length && A.t >= A.gruppen[0][0]) {
    const [, liste] = A.gruppen.shift();
    liste.forEach(([t, n]) => { for (let i = 0; i < n + Math.ceil(G.extra * n / 6); i++) gegnerErstellen(t); });
    meldung(TX('Eiferer!'), TX('Sie haben Ölkannen dabei. Halte sie von den Robotern fern.'), 1600);
    if (!A.gruppen.length && SPIEL.bestehende && SPIEL.bestehende.nemesis) spaeter(3, () => { if (G && G.zustand === 'spiel') nemesisAufstellen(0, FELD.zMax - 1); });
  }
  const offen = A.bots.filter(v => !v.laeuft && v.hp > 0).length, laufen = A.bots.filter(v => v.laeuft && v.hp > 0).length;
  if (!offen && !laufen) return verloren(TX('Kein Roboter läuft mehr'));
  if (!A.gruppen.length && !offen && !G.gegner.some(e => e.hp > 0 && !e.def.objekt)) auftragGeschafft(TX('Die Halle läuft wieder'));
}
// Ein Roboter fällt: Kaputte werden gesalbt und kämpfen für den inneren Kreis, reparierte sind einfach hin
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
function aufbauLesesaal() {
  szene.background = new THREE.Color('#07080c');
  const F = FELD;
  const boden = malBoden(60, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 1.1) * 0.3 + Math.cos(z * 1.3) * 0.3;
    if (Math.abs(x) > F.x + 0.8 + wob || z < F.zMin - 1.2 || z > F.zMax + 1.2 + wob) return 'mauer';
    if (Math.abs(x) < 2.2 + wob * 0.2) return 'teppich';
    return 'parkett';
  }, {
    parkett: ['#4a3624', '#54402c', '#402e1e', '#5e4832'],
    teppich: ['#4a1a22', '#5a2028', '#3e141c', '#6a2a30'],
    mauer:   ['#1a1820', '#201e28', '#16141c', '#26242e'],
  }, 101);
  const { g, toPx, r } = boden;
  // Dielen, Staub und Ölflecken der Eiferer
  for (let z = F.zMin - 1; z < F.zMax + 1; z += 0.5) { g.fillStyle = '#2e2014'; g.fillRect(toPx(-F.x - 1), toPx(z), toPx(F.x + 1) - toPx(-F.x - 1), 1); }
  for (let k = 0; k < 80; k++) { g.fillStyle = '#2e2014'; g.fillRect(toPx(-F.x + r() * F.x * 2), toPx(F.zMin + r() * (F.zMax - F.zMin)), 1, 8); }
  for (let z = F.zMin; z < F.zMax + 1; z += 1) { g.fillStyle = '#c8a030'; g.fillRect(toPx(-2.2), toPx(z), 1, 4); g.fillRect(toPx(2.2), toPx(z), 1, 4); }
  for (let k = 0; k < 6; k++) { const cx = toPx(-12 + r() * 24), cy = toPx(-4 + r() * 12); for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.6 ? '#141018' : '#1e1824'; g.fillRect(cx + (r() * 10 - 5 | 0), cy + (r() * 6 - 3 | 0), 1, 1); } }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 900);
  bodenMesh(boden, 60);
  // Hinten eine Wand aus Regalen, an den Seiten weitere Regale, dazwischen Lesepulte in Reihen
  for (let x = -F.x - 1; x <= F.x + 1; x += 1.9) if (Math.abs(x) > 3.6) decoBild(BILD.regal[Math.abs(Math.round(x)) % 3], x, F.zMin - 0.6, 0, 0);
  [-9.5, -5.5, 5.5, 9.5].forEach(x => [-3.5, 2.5].forEach((z, i) => decoBild(BILD.regal[(Math.round(Math.abs(x)) + i) % 3], x, z, 1.0, 0.9)));
  [[-7.5, 6.5], [-3.6, 6.5], [3.6, 6.5], [7.5, 6.5], [-7.5, -0.5], [7.5, -0.5]].forEach(([x, z], i) => animDeko(decoBild(BILD.lesepult[0], x, z, 0.7, 0.6), BILD.lesepult, 1.1 + i * 0.3));
  [[-13.2, -6], [13.2, -6], [-13.2, 5], [13.2, 5]].forEach(([x, z]) => decoBild(BILD.saeule, x, z, 0.55, 0.6));
  [[-12.5, 8.8], [12.4, 8.6]].forEach(([x, z], i) => decoBild(BILD.kisten[i], x, z, 0.9, 1));
  lichtFleck(0, F.zMin + 1.6, 4.5, 0x5ff0e0, 0.1, 0.04);
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
    for (let i = 0; i < 3; i++) { const [x, z] = wegPunkt(Math.max(0, s - 2 + i * 2)); gegnerErstellen(i === 1 ? 'schildtraeger' : 'pluenderer', x + zz(-3, 3), z + zz(-3, 3)); }
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

// Zerstörte Zelte brennen weiter
function objektZerstoert(e) {
  if (e.typ !== 'zelt') return;
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
  const A = G.auftrag;
  if (MIS.typ === 'verfolgung') {
    const d = G.dieb, weg = d ? Math.round(Math.min(1, wegNaechster(d.x, d.z)[3] / STADT_LAENGE) * 100) : 100;
    hudText('waveLabel', TX('Verfolgung'));
    hudText('waveSub', d && d.hp > 0 ? (abstand(d, P) > 9 ? TX('Er wartet auf dich. Lauf!') : TX`Abstand ${Math.round(abstand(d, P))} m`) : TX('Gefasst'));
    hudText('doorLabel', TX`Fluchtweg ${weg} %`);
    document.getElementById('doorFill').style.width = weg + '%';
  } else if (MIS.typ === 'sturm') {
    const n = A.zelte.filter(z => z.hp > 0).length;
    hudText('waveLabel', TX('Sturm aufs Lager'));
    hudText('waveSub', TX`${A.zelteGesamt - n} von ${A.zelteGesamt} Zelten zerstört`);
    hudText('doorLabel', TX('Vorratszelte'));
    const hp = A.zelte.reduce((s, z) => s + Math.max(0, z.hp), 0), max = A.zelte.reduce((s, z) => s + z.maxHp, 0) || 1;
    document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
  } else if (MIS.typ === 'kraftwerk') {
    kraftwerkHud();
  } else if (MIS.typ === 'markt') {
    marktHud();
  } else if (MIS.typ === 'fabrik') {
    fabrikHud();
  } else if (MIS.typ === 'unterwelt') {
    unterweltHud();
  } else if (MIS.typ === 'sabotage') {
    sabotageHud();
  } else if (MIS.typ === 'finale') {
    finaleHud();
  } else if (MIS.typ === 'zwiespalt') {
    zwiespaltHud();
  } else if (MIS.typ === 'eskorte') {
    const w = G.tuer, weg = Math.round(Math.max(0, Math.min(1, (w.x + 40) / (FELD.x - 4 + 40))) * 100);
    hudText('waveLabel', (G.runden ? TX`Abschnitt ${G.runde} · ` : TX('Eskorte · ')) + weg + ' %');
    const E = MIS.eskorte || ESKORTE_BIRKE;
    hudText('waveSub', w.faehrt ? E.hud[0] : abstand(P, w) >= 7 ? E.hud[1] : E.hud[2]);
    hudText('doorLabel', MIS.ziel.name);
    document.getElementById('doorFill').style.width = Math.max(0, w.hp / w.maxHp * 100) + '%';
  } else if (MIS.typ === 'reparatur') {
    const B = A.bots, ok = B.filter(v => v.laeuft && v.hp > 0).length, weg = B.filter(v => v.hp <= 0).length;
    hudText('waveLabel', TX('Wartungshalle'));
    hudText('waveSub', TX`${ok} repariert · ${weg} verloren · noch ${A.gruppen.length} von ${A.trupps} Trupps`);
    hudText('doorLabel', TX('Roboter'));
    document.getElementById('doorFill').style.width = ((B.length - weg) / B.length * 100) + '%';
  }
}

// ---------------------------------------------------------------------
// Die Aufträge als Missionen
// ---------------------------------------------------------------------
const DIEB_SPRUECHE = [TX('Zu langsam, Blechdose!'), TX('Hier drüben!'), TX('Hehehe!'), TX('Der Kern gehört jetzt mir!'), TX('Na komm schon!'), TX('Gähn.')];
Object.assign(MISSIONEN, {
  verfolgung: { ...MISSIONSTEXTE.verfolgung, ort: 'stadt', typ: 'verfolgung',
    feld: { x: 18, zMin: -46, zMax: 44, korridor: { weg: STADT_WEG, breite: STADT_BREITE } }, start: [-12, 41], aufbau: () => aufbauStadt(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 40; erg.teile += 6; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + 2; erg.material.herzkristall = (erg.material.herzkristall || 0) + 1; erg.ueberlebende = 1; erg.lore = [['fuchs', 'fuchs2', 'fuchs3'].find(id => !hatLore(id)) || 'fuchs3']; } },
  bunker: { ...MISSIONSTEXTE.bunker, ort: 'stadt',
    feld: { x: 15, zMin: -8.6, zMax: 13, flaechen: BUNKER_STRASSEN, zugaenge: [[-15, 3], [15, 3], [0, 13]] }, start: [0, -5.5], aufbau: () => aufbauBunker(),
    wellen: () => WELLEN_BUNKER, musik: 'kampf',
    ziel: { name: TX('Bunkertür'), art: 'tuer', x: 0, z: -9.1, r: 1.3, leben: () => CFG.kellertuer.leben, bilder: () => BILD.bunkertor, verlust: TX('Die Bunkertür ist aufgebrochen') },
    runden: () => SPIEL.epoche >= 1 && (SPIEL.karte.erledigt.stadt || 0) >= 1 && Math.random() < RUNDEN.bunkerChance + (gebaeudeWert('bunkerfunk') || 0) ? { anzahl: 2, freiwillig: true } : null,
    belohnung: (erg, siege) => { erg.ueberlebende += zzGanz(3, 6) + Math.floor((SPIEL.siege || 0) / 4) + (gebaeudeWert('bunkerLeute') || 0); erg.teile += zzGanz(1, 3); erg.lore = siege ? [] : ['bunker']; } },
  sturm: { ...MISSIONSTEXTE.sturm, ort: 'lager', typ: 'sturm',
    feld: { x: 16, zMin: -12, zMax: 12 }, start: [0, 9.5], aufbau: () => aufbauLager(), ziel: null,
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
  lesesaal: { ...MISSIONSTEXTE.lesesaal, ort: 'universitaet', belohnungAllein: true,
    feld: { x: 14, zMin: -7.6, zMax: 9.5 }, start: [0, -4.5], aufbau: () => aufbauLesesaal(),
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
  befreiung: Object.assign({}, MISSIONEN.sturm, { ...MISSIONSTEXTE.befreiung, belohnung: erg => { erg.gold += 40; erg.teile += zzGanz(6, 9); erg.nahrung += 15; clusterAendern('logistik', 10); clusterAendern('wartung', 4); erg.lore = ['befreiung']; } }),
});

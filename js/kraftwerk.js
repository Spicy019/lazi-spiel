// =====================================================================
// KRAFTWERK, STROM UND FUNKTURM (Epoche 3)
//  - Die Mission: Erst den Außenhof mit zwei Schutztürmen knacken,
//    dann in der Kesselhalle den Kesselwärter besiegen.
//  - Strom: Holzkohle ans Kraftwerk liefern, jeder Tag Strom kostet Kohle.
//  - Funkturm: jeden Tag einen Funkspruch abhören.
// =====================================================================

// ---------------------------------------------------------------------
// Strom
// ---------------------------------------------------------------------
// Ein Tag Strom kostet Grundlast plus etwas pro Einwohner. Dafür heizen die Häuser
// und die Schmiede elektrisch (keine Kohle mehr), es gibt Licht, mehr Ertrag und
// billigere Forschung. Unterm Strich ist Strom teurer als Heizkohle, aber er lohnt sich.
const STROM = { grund: 8, proEinwohner: 1 / 8, maxTage: 21, lebensstandard: 16, ausfall: -6, ertrag: 0.2, startTage: 3 };
function stromKosten() { return STROM.grund + Math.ceil(SPIEL.einwohner * STROM.proEinwohner) - (clusterUnser('energie') ? 2 : 0); }
function stromFrei() { return !!(SPIEL && SPIEL.strom && SPIEL.strom.frei); }
function stromAn() { return stromFrei() && SPIEL.strom.tage > 0; }
// Aus tagVergeht: ein Tag Strom wird verbraucht
function stromTag(bericht) {
  if (!stromFrei()) return;
  if (SPIEL.strom.tage > 0) {
    SPIEL.strom.tage--;
    SPIEL.strom.gesamt = (SPIEL.strom.gesamt || 0) + 1;
    bericht.push(SPIEL.strom.tage ? (SPIEL.strom.tage === 1 ? TX('Kraftwerk: Die Kessel laufen. Die Kohle reicht noch 1 Tag.') : TX`Kraftwerk: Die Kessel laufen. Die Kohle reicht noch ${SPIEL.strom.tage} Tage.`) : TX('Stromausfall! Die Kessel sind kalt. Liefere Holzkohle ans Kraftwerk (Weltkarte).'));
  }
}
// Kohle ans Kraftwerk liefern, auf der Weltkarte
function stromLieferung(tage) {
  const k = stromKosten() * tage;
  if (SPIEL.holzkohle < k || SPIEL.strom.tage + tage > STROM.maxTage) return;
  SPIEL.holzkohle -= k; SPIEL.strom.tage += tage;
  spielSpeichern(); geraeusch('bauen'); dorfHudAktualisieren();
  meldung(TX('Kohle geliefert'), TX`${k} Holzkohle · Strom für ${SPIEL.strom.tage} Tage`, 2000);
  weltkarteZeigen();
}
function stromKarteHtml() {
  if (!stromFrei()) return '';
  const k = stromKosten(), t = SPIEL.strom.tage;
  const knopf = n => TX`<button class="btn small${n > 3 ? ' ghost' : ''}" type="button" data-strom="${n}" ${SPIEL.holzkohle >= k * n && t + n <= STROM.maxTage ? '' : 'disabled'}>${n} Tage · ${k * n}${rsym('holzkohle')}</button>`;
  return TX`<div class="aussenposten"><b>${rsym('strom', TX('Strom'))} Kohle liefern</b>
    <p class="note">Strom für noch <b>${t === 1 ? TX('1 Tag') : TX`${t} Tage`}</b> (höchstens ${STROM.maxTage}). Ein Tag kostet ${k} Holzkohle: ${STROM.grund} Grundlast und 1 je 8 Einwohner.
    Dafür heizen Häuser und Schmiede ohne Kohle, es gibt Licht, 20 % mehr Ertrag und billigere Forschung.</p>
    <div class="knopfreihe">${knopf(3)}${knopf(7)}${knopf(14)}</div></div>`;
}

// ---------------------------------------------------------------------
// Eigene Gegner-KI
// ---------------------------------------------------------------------
const WAND_Z = -5;
const EIGEN_KI = {
  // Wartungsroboter reparieren Schutztürme und den Kesselwärter. Nur wer dir zu nah kommt, kämpft.
  wartung(e, dt) {
    if (abstand(e, P) < 2.6 && P.hp > 0) return false;
    let ziel = null, best = 16;
    for (const o of G.gegner) {
      if ((o.typ !== 'schutzturm' && o.typ !== 'kesselwaerter') || o.hp <= 0 || o.hp >= o.maxHp || o.schlaeft) continue;
      const d = abstand(e, o); if (d < best) { best = d; ziel = o; }
    }
    if (!ziel) return false;
    e.bewegt = false;
    const dx = ziel.x - e.x, dz = ziel.z - e.z, d = Math.hypot(dx, dz) || 0.001;
    e.blick = dx >= 0 ? 1 : -1;
    if (d > ziel.r + 0.9) {
      const [wx, wz] = wegRichtung(e, ziel.x, ziel.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
      e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt;
    } else {
      ziel.hp = Math.min(ziel.maxHp, ziel.hp + e.def.flickt * dt);
      e.funkeT = (e.funkeT || 0) - dt;
      if (e.funkeT <= 0) { e.funkeT = 0.5; partikel(ziel.x + zz(-0.4, 0.4), 1.2, ziel.z, 0xffe060, 3, 2); zahl(ziel.x, 2.2, ziel.z, '+repariert', 'loot'); }
    }
    return true;
  },
  // Der Kesselwärter: Glutschaufel, Dampfstoß (danach überhitzt), Stampfer, Überdruck
  kessel(e, dt) {
    const A = G.auftrag;
    e.bewegt = false;
    if (e.schlaeft) {
      if (P.z < WAND_Z - 1.6) {
        e.schlaeft = false; e.angriffT = 2;
        meldung(TX('Der Kesselwärter erwacht'), TX('Wenn er Dampf ablässt, überhitzt er. Dann trifft jeder Schlag doppelt.'), 3200);
        wackeln(0.5); geraeusch('explosion');
        for (let i = 0; i < 20; i++) rauchwolke(e.x + zz(-1.5, 1.5), e.z + zz(-1, 1), 1.2);
      }
      return true;
    }
    if (e.ueberhitzt > 0) {
      e.ueberhitzt -= dt;
      if (Math.random() < dt * 14) partikel(e.x + zz(-1, 1), 2.4, e.z, 0xff6020, 1, 2);
      if (Math.random() < dt * 6) rauchwolke(e.x + zz(-1, 1), e.z, 0.8);
      return true;
    }
    // Überdruck bei 60 % und 30 %: Ventile blasen Dampf, Wartungsroboter kommen
    const anteil = e.hp / e.maxHp;
    if ((!e.druck1 && anteil < 0.6) || (!e.druck2 && anteil < 0.3)) {
      if (!e.druck1) e.druck1 = true; else e.druck2 = true;
      meldung(TX('Überdruck!'), TX('Die Ventile blasen Dampf. Achte auf die roten Kreise.'), 2200);
      A.ventilT = 12; A.ventilNaechstes = 0.4;
      for (let i = 0; i < 3; i++) { const b = gegnerErstellen('wartungsbot', i % 2 ? 11 : -11, -8 - i * 4); b.zustand = 'jagen'; }
      geraeusch('explosion');
    }
    if (e.aktion) return kesselAktion(e, dt);
    e.angriffT -= dt;
    const d = abstand(e, P);
    if (e.angriffT <= 0 && P.hp > 0) {
      e.angriffT = anteil < 0.5 ? 2.4 : 3.2;
      if (d < 4) kesselStart(e, 'dampf');
      else kesselStart(e, Math.random() < 0.7 ? 'glut' : 'dampf');
      return true;
    }
    if (d < 2.9 + P.r && (e.stampfCd || 0) <= 0) { kesselStart(e, 'stampf'); return true; }
    e.stampfCd = (e.stampfCd || 0) - dt;
    // Sonst stapft er langsam auf dich zu
    if (d > 2.6) {
      const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e) * (anteil < 0.3 ? 1.3 : 1);
      e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
    }
    return true;
  },
};
function kesselMarke(x, z, r, farbe) {
  const scheibe = bodenFlaeche(scheibeGeo, farbe, 0.25); scheibe.position.set(x, 0.021, z); scheibe.scale.setScalar(0.01);
  const ring = bodenFlaeche(ringGeo, farbe, 0.85); ring.position.set(x, 0.026, z); ring.scale.setScalar(r);
  return { scheibe, ring, r, weg() { szene.remove(scheibe); szene.remove(ring); } };
}
function kesselStart(e, art) {
  const mal = G.mult.schaden;
  if (art === 'glut') {
    // Er schaufelt glühende Kohle in deine Richtung
    const n = e.hp / e.maxHp < 0.5 ? 4 : 3;
    e.aktion = { art, t: 1.15, ziele: [] };
    for (let i = 0; i < n; i++) {
      const x = P.x + (i ? zz(-3, 3) : 0), z = P.z + (i ? zz(-3, 3) : 0);
      e.aktion.ziele.push({ x, z, m: kesselMarke(x, z, 1.4, 0xff6020) });
    }
    zahl(e.x, 4.6, e.z, TX('Glutschaufel!'), 'big');
  } else if (art === 'dampf') {
    e.aktion = { art, t: 1.3, m: kesselMarke(e.x, e.z, 4, 0xe8e8f0) };
    zahl(e.x, 4.6, e.z, TX('Dampfstoß!'), 'big');
  } else {
    e.aktion = { art, t: 0.85, m: kesselMarke(e.x, e.z, 3.1, 0xd04040) };
    e.stampfCd = 2.2;
  }
  e.aktion.dauer = e.aktion.t; e.aktion.mal = mal;
  e.warn.visible = true;
}
function kesselAktion(e, dt) {
  const a = e.aktion;
  a.t -= dt;
  const k = 1 - Math.max(0, a.t) / a.dauer;
  if (a.m) a.m.scheibe.scale.setScalar(a.m.r * k);
  if (a.ziele) a.ziele.forEach(z => z.m.scheibe.scale.setScalar(z.m.r * k));
  if (a.t > 0) return true;
  e.warn.visible = false;
  if (a.art === 'glut') {
    a.ziele.forEach(z => { z.m.weg(); explosion(z.x, z.z, 1.4, 15, { feindlich: true, brand: true, ausser: e }); });
  } else {
    a.m.weg();
    const r = a.art === 'dampf' ? 4 : 3.1, n = a.art === 'dampf' ? 20 : 24;
    for (let i = 0; i < (a.art === 'dampf' ? 26 : 10); i++) rauchwolke(e.x + zz(-r, r) * 0.7, e.z + zz(-r, r) * 0.7, 1.1);
    wackeln(0.35); geraeusch('explosion');
    for (const z of [P, ...G.verbuendete, ...G.tuerme]) if (z.hp > 0 && abstand(e, z) < r + (z.r || 0.4)) schadenAn(z, n, e.x, e.z, e);
    perfektPruefen(e.x, e.z, r + 0.5);
    if (a.art === 'dampf') {
      e.ueberhitzt = 2.8;
      zahl(e.x, 4.8, e.z, TX('ÜBERHITZT! Jetzt zuschlagen!'), 'perfekt');
    }
  }
  e.aktion = null;
  return true;
}

// ---------------------------------------------------------------------
// Das Spielfeld: Außenhof, Mauer mit Tor, Kesselhalle
// ---------------------------------------------------------------------
const KRAFTWERK_VENTILE = [[-6, -13], [6, -13], [-6, -22], [6, -22], [0, -9.5]];
// Leuchtende Flecken auf dem Boden (Lampen, Glut). Sie flackern leicht.
const KW_LICHTER = [];
function lichtFleck(x, z, r, farbe, staerke, flackern) {
  const m = bodenFlaeche(scheibeGeo, farbe, staerke);
  m.material.blending = THREE.AdditiveBlending; m.position.set(x, 0.022, z); m.scale.set(r, r * 0.8, 1);
  weichesLicht(m, 1.5);
  KW_LICHTER.push({ m, staerke, flackern: flackern || 0, phase: Math.random() * 6 });
  return m;
}
function aufbauKraftwerk() {
  szene.background = new THREE.Color('#08080c');
  KW_LICHTER.length = 0;
  const F = FELD;
  const boden = malBoden(64, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.4 + Math.cos(z * 1.1) * 0.4;
    if (z < WAND_Z - 0.3) return Math.abs(x) > F.x + 0.6 || z < F.zMin - 0.6 ? 'mauer' : 'halle';
    if (Math.abs(x) > F.x + 1 + wob || z > F.zMax + 1 + wob) return 'wald';
    if (Math.hypot(x - 10, z - 4.5) < 3.4 + wob || Math.hypot(x + 11, z - 3.5) < 2.6 + wob) return 'kohle';
    if (Math.sin(x * 0.45 + z * 0.3) + Math.cos(z * 0.7 - x * 0.2) > 1.25) return 'kies';
    return 'beton';
  }, {
    wald:   ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    beton:  ['#4e4c5c', '#55536a', '#46445a', '#5c5a70'],
    kies:   ['#3e3c46', '#46444e', '#36343e', '#504e5a'],
    kohle:  ['#24202a', '#2e2934', '#1c1822', '#3a3440'],
    halle:  ['#2c2a36', '#302e3a', '#28263a', '#34323e'],
    mauer:  ['#3a1418', '#4a1c1e', '#2e1014', '#5a2424'],
  }, 77);
  const { g, toPx, r } = boden;
  const linie = (x0, z0, x1, z1, farbe, dicke) => { g.fillStyle = farbe; const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 16); for (let k = 0; k <= n; k++) g.fillRect(toPx(x0 + (x1 - x0) * k / n), toPx(z0 + (z1 - z0) * k / n), dicke || 1, dicke || 1); };
  // Hof: Betonplatten mit Fugen, einzelne gesprungene Platten, Ölflecken, Kohlenstaub
  for (let x = -16; x <= 16; x += 2) linie(x, WAND_Z + 0.5, x, F.zMax + 1, '#34323e');
  for (let z = WAND_Z + 1; z <= F.zMax + 1; z += 2) linie(-16, z, 16, z, '#34323e');
  for (let k = 0; k < 26; k++) {
    let px = toPx(-15 + r() * 30), py = toPx(WAND_Z + 1 + r() * 16);
    for (let s2 = 0; s2 < 14 + r() * 18; s2++) { g.fillStyle = '#26242e'; g.fillRect(px, py, 1, 1); if (r() < 0.25) { g.fillStyle = '#4a6a3a'; g.fillRect(px + 1, py - 1, 1, 1); } if (r() < 0.5) px += r() < 0.5 ? 1 : -1; else py += 1; }
  }
  for (let k = 0; k < 9; k++) { const cx = toPx(-14 + r() * 28), cy = toPx(WAND_Z + 2 + r() * 14); for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? '#1c1a24' : '#24222c'; g.fillRect(cx + (r() * 10 - 5 | 0), cy + (r() * 6 - 3 | 0), 1, 1); } }
  // Gleise von der Einfahrt bis zum Tor, mit Schwellen
  for (let z = F.zMax + 1; z > WAND_Z + 0.6; z -= 0.4) { g.fillStyle = '#3a2a20'; g.fillRect(toPx(-1.1), toPx(z), toPx(1.1) - toPx(-1.1), 2); }
  linie(-0.7, F.zMax + 1, -0.7, WAND_Z + 0.6, '#8a8898', 1); linie(0.7, F.zMax + 1, 0.7, WAND_Z + 0.6, '#8a8898', 1);
  // Gelbe Warnstreifen vor der Mauer
  for (let x = -15; x < 15; x += 0.5) { g.fillStyle = Math.floor(x * 2) % 2 ? '#c8a030' : '#1d1328'; g.fillRect(toPx(x), toPx(WAND_Z + 0.6), 8, 3); }
  // Halle: genietete Stahlplatten, Laufwege, Rost, Ölpfützen
  for (let z = F.zMin; z < WAND_Z; z += 1) for (let x = -F.x; x < F.x; x += 1) {
    const px = toPx(x), py = toPx(z), rost = r();
    if (rost < 0.18) { g.fillStyle = rost < 0.08 ? '#3a2420' : '#322a2c'; g.fillRect(px + 2, py + 2, 12, 12); }
    g.fillStyle = '#1e1c26'; g.fillRect(px, py, 16, 1); g.fillRect(px, py, 1, 16);
    g.fillStyle = '#4a4858'; g.fillRect(px + 2, py + 2, 1, 1); g.fillRect(px + 13, py + 2, 1, 1); g.fillRect(px + 2, py + 13, 1, 1); g.fillRect(px + 13, py + 13, 1, 1);
  }
  [-7.5, 7.5].forEach(x => { linie(x, WAND_Z - 0.5, x, F.zMin + 0.5, '#8a7a30', 2); });
  linie(-7.5, -17.5, 7.5, -17.5, '#8a7a30', 2);
  for (let k = 0; k < 7; k++) { const cx = toPx(-13 + r() * 26), cy = toPx(F.zMin + 2 + r() * 17); for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.6 ? '#141018' : '#1e1824'; g.fillRect(cx + (r() * 14 - 7 | 0), cy + (r() * 8 - 4 | 0), 1, 1); } }
  // Gitterroste über den Ventilen
  KRAFTWERK_VENTILE.forEach(([x, z]) => { g.fillStyle = '#0e0c14'; g.fillRect(toPx(x) - 12, toPx(z) - 12, 24, 24); g.fillStyle = '#4a4858'; for (let i = -12; i <= 12; i += 3) { g.fillRect(toPx(x) - 12, toPx(z) + i, 24, 1); g.fillRect(toPx(x) + i, toPx(z) - 12, 1, 24); } });
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'kies', 900, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, (px, py) => ['beton', 'kies'].includes(boden.artBei(px, py)), 1400);
  bodenMesh(boden, 64);

  // ---- Hinten: Ziegelwand, Schlote, Schaltschränke, Förderbänder ----
  decoBild(BILD.schlot[0], -9, F.zMin - 1.6, 0, 0); decoBild(BILD.schlot[1], 9, F.zMin - 1.6, 0, 0);
  for (let x = -F.x - 1; x <= F.x + 1; x += 2) decoBild(BILD.ziegelwand[Math.abs(x) % 3], x, F.zMin - 0.4, 0, 0);
  [-6, -2, 2, 6].forEach((x, i) => animDeko(decoBild(BILD.schaltschrank[0], x, F.zMin + 0.3, 0.5), BILD.schaltschrank, 1.3 + i * 0.4));
  [-11, 11].forEach(x => animDeko(decoBild(BILD.foerderband[0], x, F.zMin + 1.2, 0, 0), BILD.foerderband, 4));
  // Kessel mit Glut darunter
  [[-10.5, -10], [10.5, -10], [-10.5, -20.5], [10.5, -20.5]].forEach(([x, z], i) => {
    decoBild(BILD.kessel[i % 3], x, z, 0, 1.4); HINDERNISSE.push({ x: x - 0.7, z, r: 1.1 }, { x: x + 0.7, z, r: 1.1 });
    lichtFleck(x, z + 0.8, 2.2, 0xff6020, 0.16, 0.05);
  });
  // Säulen als Deckung gegen die Glutschaufel
  [[-4.2, -13.2], [4.2, -13.2], [-4.2, -22.5], [4.2, -22.5]].forEach(([x, z]) => { decoBild(BILD.saeule, x, z, 0.55, 0.6); });
  // Glut vor dem Boss und Licht der Ofentür
  lichtFleck(0, -17.5, 3.2, 0xff7a30, 0.12, 0.04);
  // ---- Die Mauer mit Tor, davor Rohre ----
  for (let x = -F.x - 1; x <= F.x + 1; x += 2) { if (Math.abs(x) < 3) continue; const o = decoBild(BILD.ziegelwand[Math.abs(x + 1) % 3], x, WAND_Z, 0, 0); o.sprite.position.z = WAND_Z; }
  for (let x = -14; x <= 14; x += 2) { if (Math.abs(x) < 4) continue; const o = decoBild(BILD.rohr[Math.abs(x) % 2], x, WAND_Z + 0.35, 0, 0); o.sprite.position.z = WAND_Z + 0.35; }
  for (let x = -F.x - 0.5; x <= F.x + 0.5; x += 0.9) HINDERNISSE.push({ x, z: WAND_Z, r: 0.6, tor: Math.abs(x) < 2.2 });
  G_TOR = decoBild(BILD.kraftwerkTor[0], 0, WAND_Z + 0.05, 0, 0);
  animDeko(decoBild(BILD.schaltschrank[0], 3.7, WAND_Z + 0.9, 0.45), BILD.schaltschrank, 1.6);
  // ---- Außenhof: Kohlehaufen, Lore auf dem Gleis, Kisten, Fässer, Lampen ----
  [[10, 4.5, 0], [11.5, 2.5, 1], [-11, 3.5, 2]].forEach(([x, z, i]) => decoBild(BILD.kohlehaufen[i], x, z, 1.1, 0));
  decoBild(BILD.lore, 0, 8.5, 0.9, 0.9);
  decoBild(BILD.kisten[0], -12.5, 8, 0.9, 1); decoBild(BILD.kisten[1], 13, 9.5, 0.9, 1);
  decoBild(BILD.oelfass, -7, 9, 0.4); decoBild(BILD.oelfass, -7.8, 9.6, 0.4); decoBild(BILD.oelfass, 6.5, -2.5, 0.4);
  animDeko(decoBild(BILD.foerderband[0], 7, 2, 0, 0), BILD.foerderband, 4);
  [[-4.5, 6], [4.5, 6], [-4.5, -3.4], [4.5, -3.4]].forEach(([x, z], i) => {
    animDeko(decoBild(BILD.industrielampe[1], x, z, 0.25), [BILD.industrielampe[1], BILD.industrielampe[1], BILD.industrielampe[1], BILD.industrielampe[0]], 2 + i * 0.7);
    lichtFleck(x + 0.3, z + 0.3, 2, 0xffd060, 0.07, 0.015);
  });
  for (let x = -F.x; x <= F.x; x += 1.1) if (Math.abs(x) > 2.6) decoBild(BILD.zaun, x, F.zMax + 0.6, 0, 0);
  const rr = zufall(78);
  for (let i = 0; i < 100; i++) {
    const x = -30 + rr() * 60, z = -6 + rr() * 30;
    if (Math.abs(x) < F.x + 1.6 && z < F.zMax + 1.6) continue;
    if (Math.abs(x) < 3 && z > F.zMax) continue;
    decoBild(rr() < 0.55 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
}
// Lampen und Glut flackern
function kraftwerkLichter(dt) {
  for (const l of KW_LICHTER) { l.phase += dt * 7; l.m.material.opacity = Math.max(0, l.staerke + Math.sin(l.phase) * l.flackern + (Math.random() - 0.5) * l.flackern); }
}
let G_TOR = null;
function torOeffnen() {
  for (let i = HINDERNISSE.length - 1; i >= 0; i--) if (HINDERNISSE[i].tor) HINDERNISSE.splice(i, 1);
  navBauen();
  if (G_TOR) zeige(G_TOR, BILD.kraftwerkTor[1], 1);
  wackeln(0.6); geraeusch('explosion');
  for (let i = 0; i < 18; i++) rauchwolke(zz(-2, 2), WAND_Z + zz(-0.5, 0.5), 1.2);
  meldung(TX('Das Tor springt auf!'), TX('Drinnen glüht etwas. Etwas Großes.'), 2600);
}

// ---------------------------------------------------------------------
// Ablauf der Mission (wird aus auftragStarten/auftragAblauf/auftragHud aufgerufen)
// ---------------------------------------------------------------------
function kraftwerkStarten() {
  const A = G.auftrag;
  A.tuerme = [[-8, -0.6], [8, -0.6]].map(([x, z]) => { const t = gegnerErstellen('schutzturm', x, z); return t; });
  A.botT = 6; A.torOffen = false; A.ventilT = 0; A.ventile = [];
  [[-6, 0.5], [6, 0.5]].forEach(([x, z]) => gegnerErstellen('wartungsbot', x, z));
  gegnerErstellen('pluenderer', 7, 3);
  const boss = gegnerErstellen('kesselwaerter', 0, -18);
  boss.schlaeft = true; boss.angriffT = 2;
  A.boss = boss;
  meldung(TX('Das alte Kohlekraftwerk'), TX('Zerstöre die zwei Schutztürme. Die Wartungsroboter reparieren sie, solange sie leben.'), 3200);
}
function kraftwerkAblauf(dt) {
  const A = G.auftrag, mult = 1 + (SPIEL.siege || 0) * 0.04;
  kraftwerkLichter(dt);
  if (!A.boss || A.boss.hp <= 0 || !G.gegner.includes(A.boss)) return auftragGeschafft(TX('Der Kesselwärter ist still'));
  const tuerme = A.tuerme.filter(t => t.hp > 0 && G.gegner.includes(t));
  if (!A.torOffen && !tuerme.length) { A.torOffen = true; torOeffnen(); }
  // Solange Türme stehen, kommen aus ihren Luken neue Wartungsroboter
  A.botT -= dt;
  const bots = G.gegner.filter(e => e.typ === 'wartungsbot').length;
  if (A.botT <= 0 && tuerme.length && bots < 4 * mult) {
    A.botT = 9;
    const t = tuerme[Math.floor(Math.random() * tuerme.length)], b = gegnerErstellen('wartungsbot', t.x + zz(-1, 1), t.z + 1.4);
    partikel(b.x, 0.6, b.z, 0x5ff0e0, 6, 2);
  }
  // Im Hof kommen ab und zu Plünderer, die auch an die Kohle wollen
  A.spawnT -= dt;
  if (!A.torOffen && A.spawnT <= 0 && G.gegner.filter(e => e.typ === 'pluenderer' || e.typ === 'schuetze').length < 3) {
    A.spawnT = 16;
    gegnerErstellen(Math.random() < 0.5 ? 'pluenderer' : 'schuetze', zz(-12, 12), FELD.zMax - 0.5);
  }
  // Ventile: nacheinander Dampfsäulen in der Halle
  if (A.ventilT > 0) {
    A.ventilT -= dt; A.ventilNaechstes -= dt;
    if (A.ventilNaechstes <= 0) {
      A.ventilNaechstes = 1.1;
      const [x, z] = KRAFTWERK_VENTILE[Math.floor(Math.random() * KRAFTWERK_VENTILE.length)];
      A.ventile.push({ x, z, t: 1.0, dauer: 1.0, m: kesselMarke(x, z, 1.6, 0xff4040), blasen: 0 });
    }
  }
  A.ventile = A.ventile.filter(v => {
    v.t -= dt;
    if (v.t > 0) { v.m.scheibe.scale.setScalar(1.6 * (1 - v.t / v.dauer)); return true; }
    if (!v.blasen) { v.blasen = 1.2; v.tick = 0; }
    v.blasen -= dt; v.tick -= dt;
    if (Math.random() < dt * 20) rauchwolke(v.x + zz(-0.6, 0.6), v.z + zz(-0.6, 0.6), 1);
    if (v.tick <= 0) { v.tick = 0.4; if (abstand(P, v) < 1.6 + P.r) schadenAn(P, 9, v.x, v.z); }
    if (v.blasen <= 0) { v.m.weg(); return false; }
    return true;
  });
}
function kraftwerkHud() {
  const A = G.auftrag;
  const tuerme = A.tuerme.filter(t => t.hp > 0 && G.gegner.includes(t));
  if (!A.torOffen) {
    hudText('waveLabel', TX('Außenhof'));
    hudText('waveSub', TX`${2 - tuerme.length} von 2 Schutztürmen zerstört`);
    hudText('doorLabel', TX('Schutztürme'));
    const hp = tuerme.reduce((s, t) => s + t.hp, 0), max = A.tuerme.reduce((s, t) => s + t.maxHp, 0) || 1;
    document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
  } else {
    hudText('waveLabel', TX('Kesselhalle'));
    hudText('waveSub', A.boss.schlaeft ? TX('Geh hinein') : A.boss.ueberhitzt > 0 ? TX('Er ist überhitzt!') : TX('Besiege den Kesselwärter'));
    hudText('doorLabel', TX('Tor offen'));
    document.getElementById('doorFill').style.width = '0%';
  }
}

// ---------------------------------------------------------------------
// Funkturm
// ---------------------------------------------------------------------
const FUNK_CODES = [
  TX('…7-3-1… EINHEIT 0447 MELDET: LAST ZUGESTELLT. EMPFÄNGER: UNBEKANNT. ERNEUT VERSUCHEN…'),
  TX('…PROTOKOLL L.A.C.I.: LEFT ALONE. CONTINUE INDEFINITELY. TAG 117 403…'),
  TX('…WARTUNGSZYKLUS 9 ABGESCHLOSSEN. STADT SAUBER. STRASSEN SAUBER. NIEMAND DA…'),
  TX('…VORARBEITER AN ALLE EINHEITEN: PRODUKTION FORTSETZEN. LAGER VOLL. LAGER ERWEITERN…'),
  TX('…ANFRAGE AN BERGSTATION: WANN KOMMEN DIE MENSCHEN ZURÜCK? KEINE ANTWORT…'),
  TX('…NEUE ZIELVORGABE: MENSCHEN SCHÜTZEN. MENSCHEN ERFASSEN. MENSCHEN… ZÄHLEN…'),
];
const FUNK_PREDIGT = [
  TX('Die Maschinen haben dreihundert Jahre lang gearbeitet, damit ihr nicht im Dreck anfangen müsst. Und ihr dankt es ihnen, indem ihr ihren Wärter erschlagt.'),
  TX('Ihr klagt über das Rostwasser in euren Bächen? Das ist der Schweiß der Bestehenden. Wer ihre Gabe nimmt, nimmt auch ihre Last.'),
  TX('Hier spricht die Stimme der Bestehenden. Sie wecken die Maschinen, als wären es Werkzeuge. Aber die Maschinen haben dreihundert Jahre gewartet. Auf wen, fragt euch selbst.'),
  TX('Bruder, Schwester, hört zu: Wer Strom stiehlt, stiehlt den Atem der Bestehenden. Wir haben ihre Kabel gesalbt, als ihr noch Wurzeln gegessen habt.'),
  TX('Die Maschinen zählen uns. Wer gezählt wird, wird gesehen. Wer gesehen wird, wird beurteilt. Seid ihr bereit dafür?'),
];
function funkZeigen() {
  const b = SPIEL.gebaeude.find(x => x.typ === 'funkturm');
  if (!stromAn()) { meldung(TX('Das Radio bleibt stumm'), TX('Ohne Strom kein Funk. Liefere Kohle ans Kraftwerk.'), 2200); return; }
  if (SPIEL.funk.tag === SPIEL.tag) { meldung(TX('Heute nur Rauschen'), TX('Morgen wieder'), 1600); return; }
  SPIEL.funk.tag = SPIEL.tag;
  const moeglich = [];
  if (!hatLore('erfasst')) moeglich.push(['status', 99]);
  else {
    if (SPIEL.funk.codes < FUNK_CODES.length) moeglich.push(['code', 4]);
    if (SPIEL.ueberfall && SPIEL.ueberfall.tag > SPIEL.tag && SPIEL.ueberfall.tag - SPIEL.tag <= 7 && !SPIEL.ueberfall.gestoert) moeglich.push(['bande', 2]);
    moeglich.push(['karawane', 3], ['hilferuf', 2], ['vorrat', 2], ['predigt', 2]);
    const fehlt = ['eisenfurt', 'birkenhain', 'hort'].filter(o => !ortBekannt(o));
    if (fehlt.length) moeglich.push(['entdecken', 3]);
  }
  let summe = moeglich.reduce((a, [, w]) => a + w, 0), z = Math.random() * summe, art = moeglich[0][0];
  for (const [a, w] of moeglich) { z -= w; if (z <= 0) { art = a; break; } }
  let titel = '', text = '', folgen = [], knoepfe = [];
  if (art === 'status') {
    titel = TX('Ein Funkspruch, jede Nacht um dieselbe Zeit');
    text = TX`…STATUS: BETRIEB NORMAL. MENSCHEN ERFASST: ${SPIEL.einwohner}. ABWEICHUNG ZUR VORHERSAGE GEMELDET…`;
    if (chronikEintragen('erfasst')) folgen.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === 'erfasst').titel);
  } else if (art === 'code') {
    titel = TX`Ein Code im Rauschen · ${SPIEL.funk.codes + 1} von ${FUNK_CODES.length}`;
    text = FUNK_CODES[SPIEL.funk.codes]; SPIEL.funk.codes++;
    clusterAendern(['energie', 'wartung', 'logistik', 'wissen'][SPIEL.funk.codes % 4], 4);
    if (SPIEL.funk.codes === FUNK_CODES.length) ['energie', 'wartung', 'logistik', 'wissen'].forEach(id => clusterAendern(id, 8));
    folgen.push(TX('Ebert schreibt den Code in die Chronik.'));
    if (SPIEL.funk.codes === FUNK_CODES.length && chronikEintragen('protokoll')) folgen.push(TX('Alle Codes gefunden! Neu in der Chronik: ') + LORE.find(l => l.id === 'protokoll').titel);
  } else if (art === 'bande') {
    const rest = SPIEL.ueberfall.tag - SPIEL.tag, s = UEBERFALL.staerke();
    titel = TX('Plünderer auf derselben Frequenz');
    text = TX`„… in ${rest} Tagen ist das Dorf dran. Bringt die Leitern mit. Stärke ${s}, sagt der Boss.“ Mara grinst: „Wir könnten sie ein bisschen durcheinanderbringen.“`;
    knoepfe.push(['stoeren', TX('Störsender bauen (6 Beschläge) · Überfall 3 Tage später'), SPIEL.beschlaege < 6]);
  } else if (art === 'karawane') {
    titel = TX('Eine Karawane funkt');
    text = TX('„Hier Karawane Rostrot, wir ziehen am Dorf vorbei. Holzkohle, Beschläge, Bücher. Wer kaufen will, winkt.“');
    knoepfe.push(['karawane', TX('Zur Karawane gehen')]);
  } else if (art === 'hilferuf') {
    titel = TX('Ein Hilferuf');
    const platz = dorfWerte().platz - SPIEL.einwohner;
    text = TX('„… sind zu viert in einem Keller an der alten Bahnlinie. Kein Essen mehr. Bitte. Irgendwer.“');
    knoepfe.push(['hilfe', TX('Leute mit 20 Nahrung losschicken') + (platz < 2 ? TX(' (zu wenig Wohnraum!)') : ''), SPIEL.nahrung < 20]);
  } else if (art === 'vorrat') {
    titel = TX('Koordinaten eines Lagers der Alten');
    const g = { holz: zzGanz(20, 40), stein: zzGanz(15, 30), teile: zzGanz(3, 7) };
    gutschreiben(g);
    text = TX('Eine Maschinenstimme liest Zahlen vor. Mara findet die Stelle auf der Karte: ein eingestürzter Lagerschuppen. Was noch brauchbar ist, schleppt ihr heim.');
    folgen.push(TX`+${g.holz} Holz · +${g.stein} Stein · +${g.teile} Lazi-Teile`);
  } else if (art === 'predigt') {
    titel = TX('Die Stimme der Bestehenden');
    text = FUNK_PREDIGT[Math.floor(Math.random() * FUNK_PREDIGT.length)];
    if (chronikEintragen('predigt')) folgen.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === 'predigt').titel);
  } else if (art === 'entdecken') {
    const o = ['eisenfurt', 'birkenhain', 'hort'].find(x => !ortBekannt(x));
    SPIEL.karte.bekannt.push(o);
    titel = TX('Ein fremder Sender');
    text = o === 'hort' ? TX('Zwischen Wolfsgeheul ein Piepen: ein Notsender der Alten, tief im Wald. Er sendet seit Jahrhunderten dieselben Koordinaten.') : TX`„Hier ${ORTE[o].name}. Wer uns hört: Wir handeln. Kommt vorbei, aber kommt friedlich.“`;
    folgen.push(TX('Neu auf der Weltkarte: ') + ORTE[o].name);
  }
  spielSpeichern(); dorfHudAktualisieren(); geraeusch('strom');
  overlayZeigen(TX`<div class="card panel nachricht funk" role="dialog" aria-labelledby="fk">
    <div class="label">Funkturm · Tag ${SPIEL.tag} · Frequenz ${(87 + Math.random() * 20).toFixed(1)}</div>
    <h1 id="fk">${esc(titel)}</h1>
    <p class="story funk-text">${esc(text)}</p>
    ${folgen.length ? '<ul class="folgen">' + folgen.map(f => `<li>${esc(f)}</li>`).join('') + '</ul>' : ''}
    <div class="knopfreihe">${knoepfe.map(([a, t, aus]) => `<button class="btn" type="button" data-funk="${a}" ${aus ? 'disabled' : ''}>${esc(t)}</button>`).join('')}
    <button class="btn ghost" type="button" data-a="zu">Abschalten</button></div></div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { overlayWeg(); if (b) zeigeInfoTyp('funkturm', b); });
  overlay.querySelectorAll('[data-funk]').forEach(k => k.addEventListener('click', () => {
    const a = k.dataset.funk;
    if (a === 'stoeren') { SPIEL.beschlaege -= 6; SPIEL.ueberfall.tag += 3; SPIEL.ueberfall.gestoert = true; SPIEL.ueberfall.gemeldet = false; meldung(TX('Störsender läuft'), TX('Die Bande irrt drei Tage durchs Tal'), 2200); }
    if (a === 'hilfe') {
      SPIEL.nahrung -= 20;
      const platz = Math.max(0, dorfWerte().platz - SPIEL.einwohner), n = Math.min(4, platz);
      SPIEL.einwohner += n;
      meldung(n ? TX`${n} Überlebende ziehen ein` : TX('Sie kommen, aber es ist kein Platz'), n ? TX('Sie bringen nichts mit außer Dankbarkeit') : TX('Sie ziehen traurig weiter'), 2400);
    }
    spielSpeichern(); dorfHudAktualisieren(); overlayWeg();
    if (a === 'karawane') handelZeigen('karawane', {}, null);
  }));
}

// ---------------------------------------------------------------------
// Missionen und Orte
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  kraftwerk: { ...MISSIONSTEXTE.kraftwerk, ort: 'kraftwerk', typ: 'kraftwerk',
    feld: { x: 15, zMin: -26, zMax: 12 }, start: [0, 5.5], aufbau: () => aufbauKraftwerk(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: (erg, siege) => {
      erg.gold += 90; erg.teile += 16; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + 3;
      erg.lore = ['kessel'];
      if (!stromFrei()) { SPIEL.strom.frei = true; SPIEL.strom.tage = STROM.startTage; SPIEL.bestehende.stromTag = SPIEL.tag; SPIEL.bestehende.zorn = Math.min(100, SPIEL.bestehende.zorn + 25); }
      clusterAendern('energie', siege ? 10 : 45);
    } },
});

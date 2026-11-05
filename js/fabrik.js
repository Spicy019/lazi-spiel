// =====================================================================
// DIE LAZI-FABRIK
//  - Mission: Im Werkshof die zwei Torsteuerungen zerstören, dann in der
//    Werkhalle den Vorarbeiter besiegen. Er zählt ununterbrochen seine
//    Drohnen. Fehlen ihm zu viele, macht er Inventur: Er steht still, die
//    Klappe zu seinem Kern ist offen, und nur dann nimmt er vollen Schaden.
//  - Danach: Jeden Tag macht die Fabrik mit Strom aus Altmetall Lazi-Teile.
//    Altmetall kommt aus der Altmetall-Sammelstelle im Dorf.
// =====================================================================

function fabrikFrei() { return (SPIEL.karte.erledigt.lazifabrik || 0) >= 1; }

// Jeden Tag: Altmetall sammeln, in der Fabrik Lazi-Teile herstellen
function fabrikTag(bericht) {
  const w = dorfWerte(), sammeln = Math.floor(gebaeudeWert('altmetallProTag') * w.besetzt) + (SPIEL.epoche >= 3 ? gebaeudeWert('altmetallPlus') || 0 : 0);
  if (sammeln) {
    const n = sammeln + (clusterUnser('logistik') ? 1 : 0);
    SPIEL.altmetall = (SPIEL.altmetall || 0) + n;
    bericht.push(clusterUnser('logistik') ? TX('An der Sammelstelle türmt sich Altmetall. Lastläufer haben beim Tragen geholfen, ohne dass jemand sie darum gebeten hat.') : satz(TX('Die Sammler kommen mit Altmetall aus den Ruinen zurück, die Hände voller Rost.'), TX('An der Sammelstelle scheppert es den ganzen Tag: neues Altmetall.')));
  }
  if (!fabrikFrei()) return;
  const F = FABRIK.produktion;
  if (!stromAn()) { bericht.push(TX('Lazi-Fabrik: Ohne Strom stehen die Bänder still.')); return; }
  if ((SPIEL.altmetall || 0) < F.altmetall) { bericht.push(TX`Lazi-Fabrik: Es fehlt Altmetall (${F.altmetall} pro Tag). Die Bänder laufen leer.`); return; }
  const n = Math.max(1, F.teile + (clusterUnser('produktion') ? F.verbundBonus : 0) - (clusterFeind('produktion') ? F.verbundBonus : 0));
  SPIEL.altmetall -= F.altmetall; SPIEL.teile += n;
  bericht.push(satz(TX('In der Lazi-Fabrik laufen die Bänder. Aus Altmetall werden blanke Lazi-Teile.'), TX('Die Fabrik summt. Am Ende des Bandes liegen frische Lazi-Teile, noch warm.')));
}
// Auf der Weltkarte: was die Fabrik gerade schafft
function fabrikKarteHtml() {
  if (!fabrikFrei()) return '';
  const F = FABRIK.produktion, n = F.teile + (clusterUnser('produktion') ? F.verbundBonus : 0) - (clusterFeind('produktion') ? F.verbundBonus : 0);
  const grund = !stromAn() ? TX('Ohne Strom stehen die Bänder still.') : (SPIEL.altmetall || 0) < F.altmetall ? TX('Es fehlt Altmetall. Baue eine Altmetall-Sammelstelle.') : TX('Die Bänder laufen.');
  return TX`<div class="aussenposten"><b>Die Fabrik arbeitet für euch</b><p class="note">Jeden Tag ${F.altmetall} Altmetall → ${n} Lazi-Teile. Altmetall im Lager: ${SPIEL.altmetall || 0}. ${grund}</p></div>`;
}

// ---------------------------------------------------------------------
// Das Spielfeld: Werkshof, Mauer mit Tor, Werkhalle mit Fließbändern
// ---------------------------------------------------------------------
const FABRIK_WAND = -5;
const FABRIK_LUKEN = [[-12, -10], [12, -10], [-12, -19], [12, -19]];
let FABRIK_TOR = null;
function aufbauFabrik() {
  szene.background = new THREE.Color('#07070b');
  KW_LICHTER.length = 0;
  const F = FELD;
  const boden = malBoden(64, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.4 + Math.cos(z * 1.1) * 0.4;
    if (z < FABRIK_WAND - 0.3) return Math.abs(x) > F.x + 0.6 || z < F.zMin - 0.6 ? 'mauer' : 'halle';
    if (Math.abs(x) > F.x + 1 + wob || z > F.zMax + 1 + wob) return 'schutt';
    if (Math.hypot(x - 10, z - 5) < 3.2 + wob || Math.hypot(x + 11, z - 2.5) < 2.6 + wob) return 'altmetall';
    return 'beton';
  }, {
    schutt:    ['#2e2c38', '#36343f', '#26242e', '#3e3c48'],
    beton:     ['#4a4858', '#504e60', '#42404e', '#585668'],
    altmetall: ['#3a2a22', '#4a3428', '#2e221c', '#5a4030'],
    halle:     ['#24222e', '#282632', '#201e2a', '#2e2c38'],
    mauer:     ['#1a1820', '#201e28', '#16141c', '#26242e'],
  }, 113);
  const { g, toPx, r } = boden;
  const linie = (x0, z0, x1, z1, farbe, dicke) => { g.fillStyle = farbe; const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 16); for (let k = 0; k <= n; k++) g.fillRect(toPx(x0 + (x1 - x0) * k / n), toPx(z0 + (z1 - z0) * k / n), dicke || 1, dicke || 1); };
  // Hof: Platten, Gleise zum Tor, Warnstreifen
  for (let x = -16; x <= 16; x += 2) linie(x, FABRIK_WAND + 0.5, x, F.zMax + 1, '#34323e');
  for (let z = FABRIK_WAND + 1; z <= F.zMax + 1; z += 2) linie(-16, z, 16, z, '#34323e');
  for (let z = F.zMax + 1; z > FABRIK_WAND + 0.6; z -= 0.4) { g.fillStyle = '#3a2a20'; g.fillRect(toPx(-1.1), toPx(z), toPx(1.1) - toPx(-1.1), 2); }
  linie(-0.7, F.zMax + 1, -0.7, FABRIK_WAND + 0.6, '#8a8898', 1); linie(0.7, F.zMax + 1, 0.7, FABRIK_WAND + 0.6, '#8a8898', 1);
  for (let x = -15; x < 15; x += 0.5) { g.fillStyle = Math.floor(x * 2) % 2 ? '#c8a030' : '#1d1328'; g.fillRect(toPx(x), toPx(FABRIK_WAND + 0.6), 8, 3); }
  // Halle: Gitterplatten, Laufwege, Ölflecken; ein Kreis aus Warnfarbe, wo der Vorarbeiter steht
  for (let z = F.zMin; z < FABRIK_WAND; z += 1) for (let x = -F.x; x < F.x; x += 1) {
    g.fillStyle = '#16141e'; g.fillRect(toPx(x), toPx(z), 16, 1); g.fillRect(toPx(x), toPx(z), 1, 16);
    if (r() < 0.12) { g.fillStyle = '#1e1a24'; g.fillRect(toPx(x) + 3, toPx(z) + 3, 10, 10); }
  }
  [-8, 8].forEach(x => linie(x, FABRIK_WAND - 0.5, x, F.zMin + 0.5, '#8a7a30', 2));
  for (let a = 0; a < Math.PI * 2; a += 0.02) { g.fillStyle = Math.floor(a * 8) % 2 ? '#c8a030' : '#1d1328'; g.fillRect(toPx(Math.cos(a) * 4), toPx(-18 + Math.sin(a) * 4), 3, 3); }
  for (let k = 0; k < 8; k++) { const cx = toPx(-13 + r() * 26), cy = toPx(F.zMin + 2 + r() * 16); for (let i = 0; i < 50; i++) { g.fillStyle = r() < 0.6 ? '#100c14' : '#1a1620'; g.fillRect(cx + (r() * 12 - 6 | 0), cy + (r() * 7 - 3 | 0), 1, 1); } }
  streuDetails(boden, (px, py) => ['beton', 'schutt'].includes(boden.artBei(px, py)), 1400);
  bodenMesh(boden, 64);
  // Hinten: Wand, Schlote, Fließbänder mit Luken, aus denen Drohnen kommen
  decoBild(BILD.schlot[0], -10, F.zMin - 1.6, 0, 0); decoBild(BILD.schlot[1], 10, F.zMin - 1.6, 0, 0);
  for (let x = -F.x - 1; x <= F.x + 1; x += 2) decoBild(BILD.ziegelwand[Math.abs(x) % 3], x, F.zMin - 0.4, 0, 0);
  [-6, -2, 2, 6].forEach((x, i) => animDeko(decoBild(BILD.schaltschrank[0], x, F.zMin + 0.3, 0.5), BILD.schaltschrank, 1.4 + i * 0.4));
  FABRIK_LUKEN.forEach(([x, z]) => { animDeko(decoBild(BILD.foerderband[0], x, z, 0, 0), BILD.foerderband, 5); lichtFleck(x, z + 0.6, 1.6, 0xff6020, 0.1, 0.04); });
  [[-4.6, -12], [4.6, -12], [-4.6, -23], [4.6, -23]].forEach(([x, z]) => decoBild(BILD.saeule, x, z, 0.55, 0.6));
  [[-13, -14.5], [13, -14.5], [-13, -24], [13, -24]].forEach(([x, z], i) => decoBild(BILD.kisten[i % 2], x, z, 0.9, 1));
  lichtFleck(0, -18, 4, 0xffb030, 0.08, 0.03);
  // Mauer mit Tor, davor Rohre und die zwei Torsteuerungen
  for (let x = -F.x - 1; x <= F.x + 1; x += 2) { if (Math.abs(x) < 3) continue; const o = decoBild(BILD.ziegelwand[Math.abs(x + 1) % 3], x, FABRIK_WAND, 0, 0); o.sprite.position.z = FABRIK_WAND; }
  for (let x = -14; x <= 14; x += 2) { if (Math.abs(x) < 4 || Math.abs(Math.abs(x) - 6) < 1.5) continue; const o = decoBild(BILD.rohr[Math.abs(x) % 2], x, FABRIK_WAND + 0.35, 0, 0); o.sprite.position.z = FABRIK_WAND + 0.35; }
  for (let x = -F.x - 0.5; x <= F.x + 0.5; x += 0.9) HINDERNISSE.push({ x, z: FABRIK_WAND, r: 0.6, tor: Math.abs(x) < 2.2 });
  FABRIK_TOR = decoBild(BILD.kraftwerkTor[0], 0, FABRIK_WAND + 0.05, 0, 0);
  // Hof: Altmetallhaufen, Lore, Kisten, Lampen
  [[10, 5, 0], [11.5, 3, 1], [-11, 2.5, 2]].forEach(([x, z, i]) => decoBild(BILD.schutt[i], x, z, 1.0, 0));
  decoBild(BILD.lore, 0, 8.5, 0.9, 0.9);
  decoBild(BILD.kisten[0], -12.5, 8, 0.9, 1); decoBild(BILD.kisten[1], 13, 9.5, 0.9, 1);
  decoBild(BILD.autowrack[1], -8, 9.5, 1.1);
  [[-4.5, 6], [4.5, 6], [-10, -3], [10, -3]].forEach(([x, z], i) => {
    animDeko(decoBild(BILD.industrielampe[1], x, z, 0.25), [BILD.industrielampe[1], BILD.industrielampe[1], BILD.industrielampe[0]], 2 + i * 0.6);
    lichtFleck(x + 0.3, z + 0.3, 2, 0xffd060, 0.07, 0.015);
  });
  for (let x = -F.x; x <= F.x; x += 1.1) if (Math.abs(x) > 2.6) decoBild(BILD.zaun, x, F.zMax + 0.6, 0, 0);
  const rr = zufall(117);
  for (let i = 0; i < 80; i++) {
    const x = -30 + rr() * 60, z = -6 + rr() * 30;
    if (Math.abs(x) < F.x + 1.6 && z < F.zMax + 1.6) continue;
    if (Math.abs(x) < 3 && z > F.zMax) continue;
    decoBild(rr() < 0.5 ? BILD.ruine[i % 4] : BILD.hochhaus[i % 4], x, z, 0, 0.8);
  }
}
function fabrikTorOeffnen() {
  for (let i = HINDERNISSE.length - 1; i >= 0; i--) if (HINDERNISSE[i].tor) HINDERNISSE.splice(i, 1);
  navBauen();
  if (FABRIK_TOR) zeige(FABRIK_TOR, BILD.kraftwerkTor[1], 1);
  wackeln(0.6); geraeusch('explosion');
  for (let i = 0; i < 18; i++) rauchwolke(zz(-2, 2), FABRIK_WAND + zz(-0.5, 0.5), 1.2);
  meldung(TX('Das Werkstor ist offen!'), TX('Drinnen zählt jemand. Laut und ohne Pause.'), 2600);
}

// ---------------------------------------------------------------------
// Ablauf (wird aus auftragStarten/auftragAblauf/auftragHud aufgerufen)
// ---------------------------------------------------------------------
function fabrikStarten() {
  const A = G.auftrag;
  A.kaesten = [[-6, FABRIK_WAND + 1.4], [6, FABRIK_WAND + 1.4]].map(([x, z]) => { const k = gegnerErstellen('schaltkasten', x, z); stelle(k, x, z); return k; });
  A.torOffen = false; A.wachT = 10;
  [[-5, 1], [5, 1.5], [0, -1]].forEach(([x, z]) => gegnerErstellen('wachbot', x, z));
  [[-9, 4], [9, 4]].forEach(([x, z]) => gegnerErstellen('drohne', x, z));
  const boss = gegnerErstellen('vorarbeiter', 0, -18);
  boss.schlaeft = true; boss.angriffT = 2; boss.panzer = FABRIK.inventur.panzer;
  A.boss = boss; A.soll = 0;
  meldung(TX('Die Lazi-Fabrik'), TX('Zerstöre die zwei Torsteuerungen am Werkstor. Die Wachroboter schießen von weitem.'), 3200);
}
// Drohnen, die zum Vorarbeiter gehören
function fabrikDrohnen() { return G.gegner.filter(e => e.vonVorarbeiter && e.hp > 0); }
function drohnenNachbauen(n) {
  for (let i = 0; i < n; i++) {
    const [x, z] = FABRIK_LUKEN[i % FABRIK_LUKEN.length];
    const d = gegnerErstellen('drohne', x + zz(-1, 1), z + 1.2);
    d.vonVorarbeiter = true;
    partikel(d.x, 0.6, d.z, 0xffb030, 6, 2);
  }
}
function fabrikAblauf(dt) {
  const A = G.auftrag;
  kraftwerkLichter(dt);
  if (!A.boss || A.boss.hp <= 0 || !G.gegner.includes(A.boss)) return auftragGeschafft(TX('Der Vorarbeiter steht still'));
  const kaesten = A.kaesten.filter(k => k.hp > 0 && G.gegner.includes(k));
  if (!A.torOffen && !kaesten.length) { A.torOffen = true; fabrikTorOeffnen(); }
  // Solange das Tor zu ist, schickt die Fabrik Wachroboter durch eine Seitentür
  A.wachT -= dt;
  if (!A.torOffen && A.wachT <= 0 && G.gegner.filter(e => e.typ === 'wachbot').length < 4) {
    A.wachT = 12;
    gegnerErstellen('wachbot', Math.random() < 0.5 ? -13 : 13, FABRIK_WAND + 1.2);
    if (Math.random() < 0.6) gegnerErstellen('drohne', zz(-10, 10), FABRIK_WAND + 1.5);
  }
}
function fabrikHud() {
  const A = G.auftrag;
  const kaesten = A.kaesten.filter(k => k.hp > 0 && G.gegner.includes(k));
  if (!A.torOffen) {
    hudText('waveLabel', TX('Werkshof'));
    hudText('waveSub', TX`${2 - kaesten.length} von 2 Torsteuerungen zerstört`);
    hudText('doorLabel', TX('Torsteuerungen'));
    const hp = kaesten.reduce((s, k) => s + k.hp, 0), max = A.kaesten.reduce((s, k) => s + k.maxHp, 0) || 1;
    document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
  } else {
    const b = A.boss, ist = fabrikDrohnen().length;
    hudText('waveLabel', TX('Werkhalle'));
    hudText('waveSub', b.schlaeft ? TX('Geh hinein') : b.inventur > 0 ? TX('INVENTUR! Der Kern ist offen, jetzt zuschlagen!') : TX`Er zählt ${A.soll} Drohnen. Da sind noch ${ist}.`);
    hudText('doorLabel', TX('Panzerung'));
    document.getElementById('doorFill').style.width = (b.inventur > 0 ? 0 : 100) + '%';
  }
}

// Der Vorarbeiter: zählt, stanzt, nietet. Fehlen ihm Drohnen, macht er Inventur.
EIGEN_KI.vorarbeiter = function (e, dt) {
  const A = G.auftrag, I = FABRIK.inventur;
  e.bewegt = false;
  if (e.schlaeft) {
    if (P.z < FABRIK_WAND - 1.6) {
      e.schlaeft = false; e.angriffT = 2.5;
      A.soll = I.drohnen; drohnenNachbauen(I.drohnen);
      meldung(TX('Der Vorarbeiter'), TX('„BESTAND: SECHS EINHEITEN. ZÄHLUNG LÄUFT.“ Er zählt seine Drohnen, immer wieder. Seine Panzerung hält fast alles ab.'), 3600);
      wackeln(0.5); geraeusch('explosion');
    }
    return true;
  }
  // Inventur: still stehen, laut zählen, Kern offen. Danach baut er nach, was fehlt.
  if (e.inventur > 0) {
    e.inventur -= dt; e.zaehlT = (e.zaehlT || 0) - dt;
    if (e.zaehlT <= 0) { e.zaehlT = 0.75; e.gezaehlt = (e.gezaehlt || 0) + 1; zahl(e.x, 5.4, e.z, TX`… ${e.gezaehlt} …`, 'block'); }
    if (Math.random() < dt * 8) partikel(e.x + zz(-0.6, 0.6), 2.2, e.z + 0.8, 0xffb030, 1, 2);
    if (e.inventur <= 0) {
      e.panzer = I.panzer; e.gezaehlt = 0;
      const fehlt = A.soll - fabrikDrohnen().length;
      drohnenNachbauen(fehlt);
      zahl(e.x, 5.6, e.z, TX('BESTAND KORRIGIERT'), 'big');
      e.angriffT = 1.2;
    }
    return true;
  }
  if ((A.soll - fabrikDrohnen().length) >= I.abweichung) {
    e.inventur = I.dauer; e.panzer = I.kern; e.zaehlT = 0; e.aktion = null; e.warn.visible = false;
    meldung(TX('INVENTUR!'), TX('Die Zahl stimmt nicht mehr. Er zählt neu, und die Klappe zu seinem Kern ist offen.'), 2400);
    geraeusch('welle');
    return true;
  }
  const anteil = e.hp / e.maxHp;
  if (!e.ueberstunden && anteil < 0.5) {
    e.ueberstunden = true; A.soll += 2; drohnenNachbauen(2);
    meldung(TX('Überstunden!'), TX('Er wird schneller und holt zwei Drohnen mehr ans Band.'), 2200);
  }
  if (e.aktion) return vorarbeiterAktion(e, dt);
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (e.angriffT <= 0 && P.hp > 0) {
    e.angriffT = e.ueberstunden ? 2.2 : 3;
    vorarbeiterStart(e, d < 5 || Math.random() < 0.45 ? 'stanze' : 'nieten');
    return true;
  }
  if (d > 3) {
    const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e) * (e.ueberstunden ? 1.3 : 1);
    e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
  }
  return true;
};
function vorarbeiterStart(e, art) {
  if (art === 'stanze') {
    // Der Stanzhammer fällt dorthin, wo du gerade stehst
    e.aktion = { art, t: 1.0, x: P.x, z: P.z, m: kesselMarke(P.x, P.z, 2.1, 0xd04040) };
    zahl(e.x, 5, e.z, TX('Stanze!'), 'big');
  } else {
    // Nietenkanone: ein Fächer aus Nieten
    e.aktion = { art, t: 0.7 };
    zahl(e.x, 5, e.z, TX('Nieten!'), 'big');
  }
  e.aktion.dauer = e.aktion.t;
  e.warn.visible = true;
}
function vorarbeiterAktion(e, dt) {
  const a = e.aktion;
  a.t -= dt;
  if (a.m) a.m.scheibe.scale.setScalar(a.m.r * (1 - Math.max(0, a.t) / a.dauer));
  if (a.t > 0) return true;
  e.warn.visible = false;
  if (a.art === 'stanze') {
    a.m.weg();
    wackeln(0.35); geraeusch('explosion');
    for (let i = 0; i < 10; i++) rauchwolke(a.x + zz(-1.5, 1.5), a.z + zz(-1.5, 1.5), 0.9);
    for (const z of [P, ...G.verbuendete, ...G.tuerme]) if (z.hp > 0 && abstand(z, a) < 2.1 + (z.r || 0.4)) schadenAn(z, e.def.schaden, a.x, a.z, e);
    perfektPruefen(a.x, a.z, 2.6);
  } else {
    const w = Math.atan2(P.z - e.z, P.x - e.x);
    for (let i = -2; i <= 2; i++) {
      const dx = Math.cos(w + i * 0.22), dz = Math.sin(w + i * 0.22);
      const pf = Object.assign(figur(BILD.pfeil, 0), { x: e.x + dx * 1.8, z: e.z + dz * 1.8, dx, dz, life: 1.6, schaden: 9, von: e });
      pf.sprite.material.rotation = -Math.atan2(-dz * Math.sin(NEIGUNG), dx);
      pf.sprite.center.set(0.5, 0.5);
      G.pfeile.push(pf);
    }
    geraeusch('turm');
  }
  e.aktion = null;
  return true;
}

// ---------------------------------------------------------------------
// Geschichten und Mission
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  fabrik: { ...MISSIONSTEXTE.fabrik, ort: 'lazifabrik', typ: 'fabrik',
    feld: { x: 15, zMin: -26, zMax: 12 }, start: [0, 5.5], aufbau: () => aufbauFabrik(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: (erg, siege) => {
      erg.gold += 120; erg.teile += 25; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + 4;
      SPIEL.altmetall = (SPIEL.altmetall || 0) + 12;
      erg.lore = ['vorarbeiter'];
      if (!siege && SPIEL.bestehende) SPIEL.bestehende.zorn = Math.min(100, SPIEL.bestehende.zorn + FABRIK.zorn);
      clusterAendern('produktion', siege ? 10 : FABRIK.produktionVerbund);
    } },
});

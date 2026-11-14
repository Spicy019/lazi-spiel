// =====================================================================
// DER ROTE FLUSS (Erzwäsche unter Eisenfurt, Verbund Produktion)
//  - Die Vorgeschichte (Inhaber, 08.11.2026): Der Erzschürfer stand 300 Jahre still, weil die Fabrik nie Bedarf gemeldet hat.
//    Befreit man die Lazi-Fabrik, meldet sie zum ersten Mal Bedarf, und er fängt an zu graben. Drei Tage später läuft
//    ein Bote aus Eisenfurt ins Dorf: Ihr Fluss ist rot. Erst dann erscheint die Karte (SPIEL.erzRuf).
//  - Die Mission: Drei Abraumschieber spülen roten Schlamm in den Fluss. Erst sie zerstören, dann wacht der Erzschürfer auf.
//    Er wirft Schlamm, und wer im Schlamm steht, wird gepanzert. Die Spülventile der Waschleute spülen ihn weg.
//  - Danach die Wahl (nach der Rückkehr, wie an der Schleuse): abschalten (Hanne), umlenken (Bodo)
//    oder reparieren (Anselm, mit dem Verbund Produktion). Jede Wahl ändert den Fluss, Eisenfurt und den Wald-Außenposten.
//  - Wiederholt: Rostkäfer haben sich im Tagebau eingenistet, drei Nester.
// =====================================================================

// ---------------------------------------------------------------------
// Die Karte (Blick nach Norden): Oben die Bergflanke unter Eisenfurt. Im Westen der Tagebau mit Terrassen und Erzhaufen,
// in der Grube schläft der Erzschürfer. Ein Förderband läuft zur Erzwäsche im Nordosten. Davor das Schlammbecken,
// aus dem drei Schieber den Abraum in den Fluss spülen: Oberhalb ist das Wasser klar, unterhalb rot.
// Unten die Uferstraße, über die man ankommt.
// ---------------------------------------------------------------------
const ERZ = {
  fluss: 12.2,                         // Westufer des Flusses
  becken: [4.4, -2.6, 8.6, 2.6],       // Schlammbecken (nicht begehbar)
  schieber: [[10.2, -1.6], [10.2, 1.6], [6.5, -3.9]],
  nester: [[-12, -6], [-4, -9], [-8, 2]],
  ventile: [[9.4, -7.2], [-14.6, 4.6]],
  bossStart: [-9, -6.5],
  wache: 8, plage: 5,                  // Nachschub der Käfer: alle 8 s, höchstens 5 zugleich
};
// Tagebau, Waschplatz, Uferstraße und der schmale Streifen am Fluss (zu schmal für den Erzschürfer)
const ERZ_FLAECHEN = [[-20, -12, 4, 8], [-2, -12, 11.6, -3], [-21, 3.2, 11.6, 11.2], [8.8, -6, 11.6, 6]];
const ERZ_ZUGAENGE = [[-20.2, 9], [9.6, 9.4], [-18.4, -10]];
// Nachschub nur aus den beiden hinteren Zugängen
function erzSpawn() { const [x, z] = ERZ_ZUGAENGE[1 + Math.floor(Math.random() * 2)]; return feldKlemmen(x + zz(-1, 1), z + zz(-1, 1), 0.6); }
function aufbauErzwaesche() {
  szene.background = new THREE.Color('#0e0a0c');
  KW_LICHTER.length = 0;
  const E = ERZ, fein = neueGrafik() ? 2 : 1, klar = ['aus', 'alle'].includes(erzWahl());
  const imR = (f, x, z, m) => x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m;
  const begehbar = (x, z, m) => ERZ_FLAECHEN.some(f => imR(f, x, z, m)) && !imR(E.becken, x, z, -m);
  const boden = malBoden(64, 16 * fein, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.4 + Math.cos(z * 1.3) * 0.4;
    if (x > E.fluss + wob * 0.5) {
      if (x > 25 + wob) return 'wald';
      if (x > 22.6 + wob) return 'ufer';
      if (klar || z < -4.4 + wob) return 'wasser';                         // unterhalb der Schieber ist der Fluss rot, bis man es ändert
      const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1, rotAnteil = Math.min(1, (z + 4.4) / 5 + Math.sin(x * 0.9 + z * 0.4) * 0.25);
      return h < rotAnteil ? 'rotwasser' : 'wasser';
    }
    if (imR(E.becken, x, z, 0)) return 'schlamm';
    if (z < -12.6 + wob * 0.5 || x < -21 + wob * 0.5) return 'fels';      // Bergflanke unter Eisenfurt, im Westen der Hang
    if (imR(ERZ_FLAECHEN[2], x, z, 0.2)) return z > 10.4 ? 'gras' : 'weg';
    if (imR(ERZ_FLAECHEN[1], x, z, 0.3) && x > -1) return 'beton';
    if (imR(ERZ_FLAECHEN[3], x, z, 0.3)) return 'beton';
    if (imR(ERZ_FLAECHEN[0], x, z, 0.3)) return Math.hypot(x - E.bossStart[0], (z - E.bossStart[1]) * 1.2) < 4.6 ? 'grube' : 'erde';
    return z > 11.2 ? 'gras' : 'fels';
  }, {
    erde:      ['#5a3428', '#663c2e', '#4e2c22', '#744634'],
    grube:     ['#40241c', '#4a2a20', '#381e18', '#563226'],
    fels:      ['#3e3a40', '#46424a', '#36323a', '#524e56'],
    beton:     ['#4c4e58', '#54565f', '#44464f', '#5c5e68'],
    weg:       ['#5a4c40', '#645446', '#50443a', '#6e5e4e'],
    gras:      ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    wald:      ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    ufer:      ['#5e5444', '#6a604e', '#54493a', '#766a56'],
    wasser:    ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
    rotwasser: ['#5a1a16', '#6a221c', '#4e1612', '#7a2a20'],
    schlamm:   ['#6a1e14', '#7a2818', '#5a1810', '#8a3420'],
  }, 61);
  const { g, toPx, r } = boden, w = v => Math.max(1, v * fein);
  const linie = (x0, z0, x1, z1, farbe, dicke) => { g.fillStyle = farbe; const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 16 * fein); for (let k = 0; k <= n; k++) g.fillRect(toPx(x0 + (x1 - x0) * k / n), toPx(z0 + (z1 - z0) * k / n), w(dicke || 1), w(dicke || 1)); };
  // Tagebau: Terrassenkanten, Fahrspuren, rote Erzflecken
  for (const z of [-10.4, -3.2, 1.8]) { const bis = -2 + (z > 0 ? 6 : 0); linie(-20, z + 0.12, bis, z + 0.52, '#2a140e', 3); linie(-20, z - 0.1, bis, z + 0.3, '#8a5440', 1); for (let x = -20; x < bis; x += 0.6) { g.fillStyle = 'rgba(20,8,6,0.35)'; g.fillRect(toPx(x), toPx(z + 0.5 + (x + 20) / (bis + 20) * 0.4), w(6), w(5)); } }
  for (let k = 0; k < 2; k++) { let x = -18, z = 7 - k * 1.2; for (let i = 0; i < 90; i++) { g.fillStyle = '#4a2a20'; g.fillRect(toPx(x), toPx(z), w(2), w(2)); x += 0.18; z -= 0.12 + Math.sin(i * 0.2) * 0.05; } }
  for (let i = 0; i < 700 * fein; i++) { const x = -20 + r() * 24, z = -12 + r() * 20; if (!imR(ERZ_FLAECHEN[0], x, z, 0)) continue; g.fillStyle = r() < 0.5 ? '#8a3a24' : '#a8482a'; g.fillRect(toPx(x), toPx(z), w(1), w(1)); }
  // Waschplatz: Betonplatten mit roten Schlieren
  for (let x = -1; x <= 11.6; x += 2.2) linie(x, -12, x, -3, '#3a3c46');
  for (let i = 0; i < 300 * fein; i++) { const x = -1 + r() * 12, z = -12 + r() * 9; g.fillStyle = 'rgba(140,40,24,0.35)'; g.fillRect(toPx(x), toPx(z), w(2 + r() * 3), w(1)); }
  // Schlammbecken: Rand, Blasen; Abfluss der Schieber in den Fluss
  linie(E.becken[0], E.becken[1], E.becken[2], E.becken[1], '#2a1410', 2); linie(E.becken[0], E.becken[3], E.becken[2], E.becken[3], '#2a1410', 2);
  linie(E.becken[0], E.becken[1], E.becken[0], E.becken[3], '#2a1410', 2); linie(E.becken[2], E.becken[1], E.becken[2], E.becken[3], '#2a1410', 2);
  for (let i = 0; i < 80 * fein; i++) { g.fillStyle = 'rgba(200,90,60,0.5)'; g.fillRect(toPx(E.becken[0] + 0.3 + r() * 3.6), toPx(E.becken[1] + 0.3 + r() * 4.6), w(1), w(1)); }
  if (!klar) for (const [x, z] of E.schieber.slice(0, 2)) for (let i = 0; i < 60 * fein; i++) { g.fillStyle = 'rgba(150,40,24,0.6)'; g.fillRect(toPx(x + 0.6 + r() * 2), toPx(z + (r() - 0.5) * 0.8), w(2), w(1)); }
  // Fluss: Strömung, oben klar, unten rot; Uferkante
  for (let i = 0; i < 360; i++) { const x = E.fluss + 0.4 + r() * 10, z = -14 + r() * 28; g.fillStyle = z < -3.6 || klar ? 'rgba(150,190,230,0.2)' : 'rgba(230,120,90,0.2)'; g.fillRect(toPx(x), toPx(z), w(1), w(3 + r() * 6)); }
  linie(E.fluss, -14, E.fluss, 14, '#2a2420', 2);
  // Bergflanke: Risse
  for (let k = 0; k < 14; k++) { let x = -22 + r() * 44, z = -13; for (let i = 0; i < 30; i++) { g.fillStyle = '#26222a'; g.fillRect(toPx(x), toPx(z), w(1), w(1)); x += (r() - 0.5) * 0.4; z -= 0.12; } }
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'gras', 1200 * fein * fein, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, (px, py) => ['beton', 'weg', 'erde', 'fels'].includes(boden.artBei(px, py)), 2000 * fein * fein);
  bodenMesh(boden, 64);
  const verdeckt = (b, x, z) => { const h = b.h * PX / 0.819, bw = b.w * PX / 2 * 0.8; for (let k = 0; k <= h; k += 0.5) for (const dx of [-bw, 0, bw]) if (begehbar(x + dx, z - k, 0.4)) return true; return false; };

  // ---- Die Erzwäsche: Halle mit Waschtrommeln am Hang, das Förderband aus dem Tagebau ----
  if (!erzMitBoss()) E.schieber.forEach(([x, z]) => decoBild(BILD.schieberKaputt, x, z, 0, 0.3));   /* die Schieber vom ersten Besuch */
  decoBild(BILD.waschanlage, 5.4, -12.6, 0, 1.4); HINDERNISSE.push({ x: 3.4, z: -12.4, r: 1 }, { x: 5.4, z: -12.4, r: 1 }, { x: 7.4, z: -12.4, r: 1 });
  for (let x = -7.6; x <= 1.4; x += 2.95) animDeko(decoBild(BILD.foerderband[0], x, -10.9, 0, 0.6), BILD.foerderband, 4);   /* von der Grube bis an die Halle */
  // ---- Tagebau: Erzhaufen am Rand, Lampen; Bergflanke mit Tannen, Eisenfurt oben am Hang (Lichter) ----
  [[-19, -5, 0], [-19, -1, 1], [-21.8, 5.6, 2], [-15, -11.4, 1], [3.2, 11.9, 0]].forEach(([x, z, v]) => decoBild(BILD.erzhaufen[v], x, z, 0.9));
  [[-6.4, -11.6], [2.8, -5.8]].forEach(([x, z], i) => { animDeko(decoBild(BILD.industrielampe[1], x, z, 0.25), [BILD.industrielampe[1], BILD.industrielampe[1], BILD.industrielampe[0], BILD.industrielampe[1]], 1.4 + i); lichtFleck(x + 0.3, z + 0.3, 2.2, 0xffd060, 0.06, 0.02); });
  { const rw = zufall(67); for (let z = -12; z < 12; z += 1.6 + rw() * 2.2) { const q = rw(); if (q < 0.15) continue; decoBild(q < 0.55 ? BILD.felsen[Math.floor(rw() * 3)] : BILD.tanne[Math.floor(rw() * 3)], -22.4 - rw() * 1.6, z, 0, 0.6); } }
  for (let x = -22; x < 12; x += 3.2) decoBild(BILD.felsen[Math.abs(Math.round(x)) % 3], x + zz(-0.6, 0.6), -14.4 + zz(-0.4, 0.4), 0, 0.6);
  for (let i = 0; i < 6; i++) lichtFleck(-16 + i * 5.6, -17, 0.6, 0xffb040, 0.08, 0.02);   /* die Fenster von Eisenfurt */
  // ---- Ringsum: Wald jenseits des Flusses, Tannen an der Bergflanke, Schutt am Weg ----
  const rr = zufall(63), stellen = [];
  for (let i = 0; i < 400 && stellen.length < 36; i++) {
    const x = -32 + rr() * 64, z = -16 + rr() * 30;
    if (begehbar(x, z, 1.4) || (x > E.fluss - 1 && x < 25.6)) continue;
    if (stellen.some(([a, c]) => Math.hypot(a - x, c - z) < 3)) continue;
    const q = rr(), b = x > 25 || z < -12 ? BILD.tanne[i % 3] : q < 0.4 ? BILD.felsen[i % 3] : q < 0.7 ? BILD.tanne[i % 3] : BILD.schutt[i % 3];
    if (verdeckt(b, x, z)) { if (!verdeckt(BILD.schutt[i % 3], x, z)) decoBild(BILD.schutt[i % 3], x, z, 0, 0); continue; }
    decoBild(b, x, z, 0, 1); stellen.push([x, z]);
  }
}

// ---------------------------------------------------------------------
// Der Erzschürfer: Schaufelrad (nah, Bogen vor ihm), Abraumwurf (Schlammklumpen, die Pfützen hinterlassen) und Suhlen:
// Jede dritte Aktion wälzt er sich im Schlamm und trägt danach einen Schlammpanzer (schlammig), wo er auch steht.
// Dreht man ein Spülventil auf (kurz daneben stehen), wäscht der Strahl allen Schlamm weg. Steht er dabei gepanzert in
// Reichweite des Strahls (spuelR), ist er festgespült: Jetzt trifft jeder Schlag fester. Man muss ihn also ans Ventil locken.
// Eingraben (seit 0.3.43, Regel des Inhabers vom 09.11.2026): Jede vierte Aktion gräbt er sich ein und bricht unter dem Helden
// hervor. Wer rechtzeitig aus dem Kreis rollt, lässt das Schaufelrad ins Leere schlagen: Es steckt 3 s fest, er ist offen.
// (Inhaber, 08.11.2026: Vorher stand er kaum je im Schlamm, und das Ventil half nichts. Simulation: werkzeuge, siehe PLAN.)
// ---------------------------------------------------------------------
const ERZSCHUERFER = { schaufel: 22, schaufelR: 2.6, schaufelVor: 2.2, wurf: 12, wurfR: 1.5, pfuetzeR: 1.7, pfuetzeDauer: 9, pfuetzeSchaden: 4,
  panzer: 0.45, gespuelt: 4.5, ventilZeit: 1, ventilPause: 10, suhlenAlle: 3, suhlenZeit: 1.4, suhlR: 2.4, schlammig: 14, spuelR: 6.5,
  grabenAlle: 4, grabenTauchen: 0.8, grabenSuchen: 1.3, grabenWarn: 0.9, grabenR: 2.5, graben: 30, fest: 3 };
Object.assign(EIGEN_KI, {
  erz(e, dt) {
    const A = G.auftrag, W = ERZSCHUERFER;
    e.bewegt = false;
    if (e.schlaeft) { if (A && A.bossFrei) erzschuerferWeckt(e); return true; }
    e.schlammig = Math.max(0, (e.schlammig || 0) - dt);
    e.panzer = e.ueberhitzt > 0 ? undefined : e.schlammig > 0 || erzImSchlamm(e.x, e.z, e.r * 0.6) ? W.panzer : undefined;
    if (e.schlammig > 0 && Math.random() < dt * 5) partikel(e.x + zz(-1, 1), 1, e.z, 0xe0784a, 2, 1.2);   /* hell genug für den roten Boden */
    if (e.aktion) return erzAktion(e, dt);
    if (e.ueberhitzt > 0) {
      e.ueberhitzt -= dt;
      if (Math.random() < dt * 6) partikel(e.x + zz(-0.6, 0.6), 2.4, e.z, 0xa8d8f8, 1, 1.5);
      return true;
    }
    // Bei der Hälfte: Käfer kriechen aus dem Erz
    const anteil = e.hp / e.maxHp;
    if (!e.welle1 && anteil < 0.5) {
      e.welle1 = true;
      meldung(TX('Das Erz bewegt sich!'), TX('Rostkäfer kriechen aus den Erzhaufen.'), 2200);
      for (let i = 0; i < 4; i++) { const [x, z] = erzSpawn(); gegnerErstellen(i ? 'kaefer' : 'funkenkaefer', x, z).zustand = 'jagen'; }
    }
    e.angriffT -= dt;
    const d = abstand(e, P);
    if (e.angriffT <= 0 && P.hp > 0) {
      e.angriffT = anteil < 0.5 ? 2.3 : 3;
      e.zug = (e.zug || 0) + 1;
      erzStart(e, e.zug % W.suhlenAlle === 1 && !(e.schlammig > 0) ? 'suhlen' : e.zug % W.grabenAlle === 0 ? 'graben' : d < 4.4 ? 'schaufel' : 'wurf');
      return true;
    }
    if (d > 2.6) {
      const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
      e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
    }
    return true;
  },
});
function erzschuerferWeckt(e) {
  e.schlaeft = false; e.angriffT = 2; e.unverwundbar = false;
  meldung(TX('BEDARF NICHT GEDECKT'), TX('Der Erzschürfer erwacht. Wälzt er sich im Schlamm, prallt alles an ihm ab. Lock ihn nah an ein Spülventil und dreh es auf! Gräbt er sich ein, roll aus dem roten Kreis.'), 4400);
  zahl(e.x, 3.4, e.z, TX('FÖRDERUNG FORTSETZEN.'), 'big');
  wackeln(0.4); geraeusch('explosion');
}
function erzStart(e, art) {
  const W = ERZSCHUERFER;
  if (art === 'schaufel') {
    // Das Schaufelrad schlägt einen Bogen vor ihm
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1, x = e.x + dx / d * W.schaufelVor, z = e.z + dz / d * W.schaufelVor;
    e.aktion = { art, t: 1, x, z, m: kesselMarke(x, z, W.schaufelR, 0xd04040) };
    e.blick = dx >= 0 ? 1 : -1;
    zahl(e.x, 3.4, e.z, TX('Schaufelrad!'), 'big');
  } else if (art === 'graben') {
    // Er taucht ab, sucht den Helden unter der Erde und bricht dort hervor (Ablauf in erzGraben)
    e.aktion = { art, t: W.grabenTauchen + W.grabenSuchen + W.grabenWarn };
    zahl(e.x, 3.4, e.z, TX('Er gräbt sich ein!'), 'big'); geraeusch('explosion');
  } else if (art === 'suhlen') {
    // Er gräbt sich in seinen eigenen Schlamm und kommt gepanzert wieder hoch
    e.aktion = { art, t: W.suhlenZeit };
    zahl(e.x, 3.4, e.z, TX('Er wälzt sich im Schlamm!'), 'big');
  } else {
    // Abraum: Schlammklumpen dorthin, wo du gleich stehst
    const n = e.hp / e.maxHp < 0.5 ? 4 : 3;
    e.aktion = { art, t: 1.25, ziele: [] };
    for (let i = 0; i < n; i++) { const x = P.x + (i ? zz(-3, 3) : 0), z = P.z + (i ? zz(-3, 3) : 0); e.aktion.ziele.push({ x, z, m: kesselMarke(x, z, W.wurfR, 0xc04a2a) }); }
    zahl(e.x, 3.4, e.z, TX('Abraum!'), 'big');
  }
  e.aktion.dauer = e.aktion.t;
  if (art !== 'suhlen' && art !== 'graben') e.warn.visible = true;
}
// Eingraben: abtauchen (noch sichtbar), unter der Erde dem Helden folgen (Staub zeigt, wo), Kreis legen, hervorbrechen
function erzGraben(e, dt) {
  const a = e.aktion, W = ERZSCHUERFER;
  a.t -= dt;
  if (!a.unten && a.t <= W.grabenSuchen + W.grabenWarn) { a.unten = true; e.sprite.visible = false; e.unverwundbar = true; partikel(e.x, 0.6, e.z, 0x8a3a24, 18, 5); wackeln(0.3); }
  if (a.unten && !a.m) {
    if (Math.random() < dt * 14) partikel(P.x + zz(-0.8, 0.8), 0.2, P.z + zz(-0.8, 0.8), 0x8a3a24, 2, 2);
    if (a.t <= W.grabenWarn) { a.x = P.x; a.z = P.z; a.m = kesselMarke(a.x, a.z, W.grabenR, 0xd04040); wackeln(0.15); }
  }
  if (a.m) a.m.scheibe.scale.setScalar(a.m.r * (1 - Math.max(0, a.t) / W.grabenWarn));
  if (a.t > 0) return true;
  a.m.weg(); e.x = a.x; e.z = a.z; erzAuftauchen(e); e.aktion = null;
  for (let i = 0; i < 8; i++) rauchwolke(a.x + zz(-1.6, 1.6), a.z + zz(-1.6, 1.6), 0.9);
  partikel(a.x, 0.6, a.z, 0x8a3a24, 20, 6); wackeln(0.5); geraeusch('explosion');
  const vorher = P.hp;
  for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - a.x, ziel.z - a.z) < W.grabenR + (ziel.r || 0.4)) schadenAn(ziel, W.graben, a.x, a.z, e);
  perfektPruefen(a.x, a.z, W.grabenR + 0.5);
  if (P.hp >= vorher && P.hp > 0) { e.ueberhitzt = W.fest; zahl(e.x, 3.6, e.z, TX('Das Schaufelrad steckt fest! Jetzt zuschlagen!'), 'perfekt'); }
  return true;
}
function erzAuftauchen(e) { e.sprite.visible = true; e.unverwundbar = false; }
function erzAktion(e, dt) {
  const a = e.aktion, W = ERZSCHUERFER;
  if (a.art === 'graben') return erzGraben(e, dt);
  a.t -= dt;
  const k = 1 - Math.max(0, a.t) / a.dauer;
  if (a.m) a.m.scheibe.scale.setScalar(a.m.r * k);
  if (a.ziele) a.ziele.forEach(z => z.m.scheibe.scale.setScalar(z.m.r * k));
  if (a.t > 0) return true;
  e.warn.visible = false;
  const treffe = (x, z, r, n) => {
    for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - x, ziel.z - z) < r + (ziel.r || 0.4)) schadenAn(ziel, n, x, z, e);
    perfektPruefen(x, z, r + 0.5);
  };
  if (a.art === 'suhlen') {
    erzPfuetze(e.x, e.z, W.suhlR); e.schlammig = W.schlammig;
    partikel(e.x, 0.6, e.z, 0x8a2a18, 16, 4); geraeusch('explosion');
  } else if (a.art === 'wurf') {
    a.ziele.forEach(z => { z.m.weg(); partikel(z.x, 0.5, z.z, 0x8a2a18, 12, 4); treffe(z.x, z.z, W.wurfR, W.wurf); erzPfuetze(z.x, z.z); });
    wackeln(0.25); geraeusch('explosion');
  } else {
    a.m.weg();
    for (let i = 0; i < 8; i++) rauchwolke(a.x + zz(-1.6, 1.6), a.z + zz(-1.6, 1.6), 0.9);
    partikel(a.x, 0.6, a.z, 0x8a3a24, 14, 5);
    wackeln(0.4); geraeusch('explosion');
    treffe(a.x, a.z, W.schaufelR, W.schaufel);
  }
  e.aktion = null;
  return true;
}
// Schlammpfützen: Wer drin steht, nimmt ein wenig Schaden; der Erzschürfer wird darin gepanzert
const erzPfuetzeGeo = new THREE.CircleGeometry(1, 20);
STAND_FLAECHEN.erzPfuetze = () => erzPfuetzeGeo;   // entsteht nach dem Laden eines Missionsstands aus ihrer Lage neu
function erzPfuetze(x, z, r) {
  const A = G.auftrag, W = ERZSCHUERFER; r = r || W.pfuetzeR;
  if (!A || !A.schlamm) return;
  const mesh = bodenFlaeche(erzPfuetzeGeo, 0x8a2a18, 0.8);
  mesh.position.set(x, 0.015, z); mesh.scale.set(r, r * 0.85, 1);
  const rand = bodenFlaeche(ringGeo, 0xe0784a, 0.75); rand.position.set(x, 0.02, z); rand.scale.set(r, r, 1);
  A.schlamm.push({ x, z, r, rest: W.pfuetzeDauer, mesh, rand });
}
function erzImSchlamm(x, z, m) { const A = G.auftrag; return !!(A && A.schlamm && A.schlamm.some(p => Math.hypot(p.x - x, p.z - z) < p.r + (m || 0))); }
function erzSchlammWeg(p) { szene.remove(p.mesh); szene.remove(p.rand); p.rest = 0; }
// Ein Spülventil: kurz daneben stehen, dann rauscht das Wasser durch den Tagebau
function erzSpuelen(v) {
  const A = G.auftrag, B = A.boss, W = ERZSCHUERFER;
  v.pause = W.ventilPause; v.lade = 0;
  zeige(v.o, BILD.spuelventil[1], 1);
  const gepanzert = B && B.hp > 0 && !B.schlaeft && (B.schlammig > 0 || erzImSchlamm(B.x, B.z, B.r * 0.6)), nah = B && Math.hypot(B.x - v.x, B.z - v.z) < W.spuelR + B.r, traf = gepanzert && nah;
  if (traf) B.schlammig = 0;
  A.schlamm.forEach(p => { for (let i = 0; i < 6; i++) partikel(p.x + zz(-1, 1), 0.3, p.z + zz(-1, 1), 0xa8d8f8, 2, 3); erzSchlammWeg(p); });
  A.schlamm = A.schlamm.filter(p => p.rest > 0);
  geraeusch('klick');
  if (traf) {
    B.ueberhitzt = W.gespuelt; B.aktion && (B.aktion.m && B.aktion.m.weg(), B.aktion.ziele && B.aktion.ziele.forEach(z => z.m.weg()), B.aktion = null); erzAuftauchen(B); B.warn.visible = false;
    zahl(B.x, 3.6, B.z, TX('Festgespült! Jetzt zuschlagen!'), 'perfekt');
    wackeln(0.3);
  } else zahl(v.x, 2.6, v.z, gepanzert ? TX('Zu weit weg: Der Strahl erreicht ihn nicht!') : TX('Der Schlamm ist weg'), 'big');
}
gegnerBildAnmelden('erzschuerfer', erzschuerferBild);
// Welches Bild der Erzschürfer gerade zeigt (aus missionZeichnen)
function erzschuerferBild(e, b) {
  if (e.ueberhitzt > 0) return BILD.erzGespuelt;
  if (e.aktion) return e.aktion.art === 'wurf' ? BILD.erzWurf : BILD.erzSchaufel;   /* beim Suhlen gräbt das Rad im Schlamm */
  return e.bewegt ? b : BILD.erzRuhe[Math.floor(G.zeit * 2) % 2];
}

// ---------------------------------------------------------------------
// Ablauf der Mission (aus auftragStarten/auftragAblauf/auftragHud)
// ---------------------------------------------------------------------
function erzMitBoss() { return !SPIEL.erz; }
auftragstypAnmelden('erzwaesche', { starten: erzStarten, ablauf: erzAblauf, hud: erzHud, stand: STAND_NICHTS });
function erzStarten() {
  const A = G.auftrag, E = ERZ;
  A.schlamm = []; A.spawnT = 5; A.bossFrei = false;
  A.ziele = (erzMitBoss() ? E.schieber : E.nester).map(([x, z]) => gegnerErstellen(erzMitBoss() ? 'abraumschieber' : 'kaefernest', x, z));
  A.ventile = E.ventile.map(([x, z]) => { const o = decoBild(BILD.spuelventil[0], x, z, 0.5); const ring = bodenFlaeche(ringGeo, 0x7ad0ff, 0.7); ring.position.set(x, 0.03, z); ring.scale.setScalar(1.4); const reich = bodenFlaeche(ringGeo, 0x7ad0ff, 0.22); reich.position.set(x, 0.028, z); reich.scale.setScalar(ERZSCHUERFER.spuelR); return { x, z, o, ring, reich, lade: 0, pause: 0 }; });
  [[-6, 5, 'kaefer'], [-10, 0, 'kaefer'], [2, -6, 'wachbot'], [-3, -2, 'kaefer']].forEach(([x, z, t]) => gegnerErstellen(t, x, z));
  if (erzMitBoss()) {
    const boss = gegnerErstellen('erzschuerfer', E.bossStart[0], E.bossStart[1]);
    boss.schlaeft = true; boss.angriffT = 2; boss.blick = 1; boss.unverwundbar = true;   /* erst wenn die Schieber zu sind */
    A.boss = boss;
    if (!hatLore('erz_ruf')) SPIEL.chronik.push('erz_ruf');   /* was der Bote aus Eisenfurt erzählt hat */
    meldung(TX('Der rote Fluss'), TX('Zerstöre die drei Abraumschieber am Schlammbecken. Die Schürfmaschine gräbt in ihrer Grube und beachtet dich nicht. Noch nicht.'), 3400);
  } else meldung(TX('Der rote Fluss'), TX('Rostkäfer haben sich im Tagebau eingenistet. Zerstöre ihre drei Nester.'), 3000);
}
function erzZieleUebrig() { return G.auftrag.ziele.filter(k => k.hp > 0 && G.gegner.includes(k)).length; }
objektFolgeAnmelden('abraumschieber', erzObjektWeg);
objektFolgeAnmelden('kaefernest', erzObjektWeg);
// Aus objektZerstoert
function erzObjektWeg(e) {
  const A = G.auftrag;
  partikel(e.x, 0.6, e.z, e.typ === 'abraumschieber' ? 0x8a2a18 : 0x6a4a3a, 14, 4);
  wackeln(0.3); geraeusch('explosion');
  if (e.typ === 'abraumschieber') restFigur(BILD.schieberKaputt, e.x, e.z);
  if (A && A.ziele) zahl(e.x, 2.6, e.z, TX`${A.ziele.length - A.ziele.filter(k => k.hp > 0 && k !== e && G.gegner.includes(k)).length} / ${A.ziele.length}`, 'big');
}
function erzAblauf(dt) {
  const A = G.auftrag, E = ERZ, W = ERZSCHUERFER;
  kraftwerkLichter(dt);
  A.ziele.forEach((k, i) => { const [x, z] = (erzMitBoss() ? E.schieber : E.nester)[i]; k.x = x; k.z = z; });
  // Schlamm: läuft aus, schadet dem Spieler
  A.schlammT = (A.schlammT || 0) - dt;
  A.schlamm.forEach(p => { p.rest -= dt; if (p.rest < 2) { p.mesh.material.opacity = Math.max(0, p.rest / 2 * 0.8); p.rand.material.opacity = Math.max(0, p.rest / 2 * 0.75); } if (p.rest <= 0) { szene.remove(p.mesh); szene.remove(p.rand); } });
  A.schlamm = A.schlamm.filter(p => p.rest > 0);
  if (A.schlammT <= 0 && P.hp > 0 && erzImSchlamm(P.x, P.z, P.r * 0.5)) { A.schlammT = 0.6; schadenAn(P, W.pfuetzeSchaden, P.x, P.z, null); }
  // Spülventile
  for (const v of A.ventile) {
    v.reich.visible = !!(A.boss && !A.boss.schlaeft && A.boss.hp > 0 && v.pause <= 0);
    if (v.pause > 0) { v.pause -= dt; v.ring.material.opacity = 0.2; if (v.pause <= 0) zeige(v.o, BILD.spuelventil[0], 1); continue; }
    v.ring.material.opacity = 0.7;
    if (Math.hypot(P.x - v.x, P.z - v.z) < 1.5 && P.hp > 0) { v.lade += dt; if (v.lade >= W.ventilZeit) erzSpuelen(v); }
    else v.lade = Math.max(0, v.lade - dt);
    v.ring.scale.setScalar(1.4 - v.lade / W.ventilZeit * 0.8);
  }
  const uebrig = erzZieleUebrig();
  if (!A.boss) { if (!uebrig) auftragGeschafft(TX('Die Nester sind zerstört')); }
  else if (A.bossFrei && (A.boss.hp <= 0 || !G.gegner.includes(A.boss))) return auftragGeschafft(TX('Der Erzschürfer steht still'));
  else if (!uebrig && !A.bossFrei) {
    A.bossFrei = true;
    meldung(TX('Die Schieber sind zu'), TX('In der Grube heult ein Motor auf. Der Erzschürfer hat gemerkt, dass sein Abraum nicht mehr abfließt.'), 3000);
  }
  // Solange Ziele stehen, kommen Käfer und Wachroboter nach
  A.spawnT -= dt;
  if (uebrig && A.spawnT <= 0 && G.gegner.filter(e => !e.def.objekt && !e.def.boss).length < E.plage) {
    A.spawnT = E.wache;
    const [x, z] = erzSpawn(), q = Math.random();
    gegnerErstellen(q < 0.5 ? 'kaefer' : q < 0.75 ? 'funkenkaefer' : 'wachbot', x, z);
  }
}
function erzHud() {
  const A = G.auftrag, uebrig = erzZieleUebrig();
  if (uebrig || !A.boss) {
    hudText('waveLabel', A.boss ? TX('Das Schlammbecken') : TX('Der Tagebau'));
    hudText('waveSub', A.boss ? TX`${A.ziele.length - uebrig} von ${A.ziele.length} Abraumschiebern zerstört` : TX`${A.ziele.length - uebrig} von ${A.ziele.length} Nestern zerstört`);
    hudText('doorLabel', A.boss ? TX('Abraumschieber') : TX('Käfernester'));
    const hp = A.ziele.reduce((s, k) => s + Math.max(0, k.hp), 0), max = A.ziele.reduce((s, k) => s + k.maxHp, 0) || 1;
    document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
  } else {
    const B = A.boss;
    hudText('waveLabel', TX('Der Erzschürfer'));
    hudText('waveSub', B.schlaeft ? TX('Er gräbt') : B.ueberhitzt > 0 ? TX('Festgespült: zuschlagen!') : B.panzer ? TX('Schlammpanzer: lock ihn ans Spülventil!') : TX('Besiege den Erzschürfer'));
    hudText('doorLabel', TX('Erzschürfer'));
    document.getElementById('doorFill').style.width = (Math.max(0, B.hp) / B.maxHp * 100) + '%';
  }
}

// ---------------------------------------------------------------------
// Die Wahl nach dem Sieg (Inhaber, 08.11.2026): drei Wege, wie an der Schleuse.
//  aus:  Abschalten (Hanne, Rostbrecher). Fluss klar, Eisenfurt dankbar, Verschmutzung sinkt, Produktion verärgert.
//        Aus dem Stahl der Maschine schmiedet man bessere Äxte: Der Wald-Außenposten gibt mehr Holz. Zählt für die Stille.
//  uns:  Umlenken (Bodo). Das Erz geht an euch. Die Maschine schürft am Wald-Außenposten Altmetall und Teile,
//        dafür etwas weniger Holz, der Fluss bleibt rot, Eisenfurt ist verärgert. Zählt für die Krone.
//  alle: Reparieren (Anselm, mit dem Verbund Produktion). Klärfilter: Fluss klarer, Produktion und Eisenfurt zufrieden.
//        Am Wald-Außenposten arbeitet der Rodeschürfer: braucht Holzkohle (später Strom), bringt Holz, Stein
//        und ab und zu Altmetall. Zählt für Pakt und Hirte.
// ---------------------------------------------------------------------
const ERZWAHL = {
  aus:  { produktion: -15, eisenfurt: 2, verschmutzung: -15, altmetall: 25, schrott: 1, holz: 4 },
  uns:  { produktion: 5, eisenfurt: -2, verschmutzung: 5, holz: -2, altmetall: 3, teileAlle: 2 },
  alle: { produktion: 15, eisenfurt: 1, verschmutzung: -8, kohle: 1, holz: 9, stein: 3, fundAlle: 3, fund: [1, 2],
          umruesten: { beschlaege: 10, teile: 8 }, stromHolz: 11, stromStein: 5 },
};
function erzWahl() { return SPIEL.erz && SPIEL.erz.wahl || null; }
function erzWahlPruefen(weiter) {
  if (!SPIEL.erz || SPIEL.erz.wahl) return weiter();
  const fremd = !rostbrecherBekannt(), still = verbundStill('produktion'), rep = figurDa('anselm') ? 'anselm' : 'ebert';   /* ist Anselm vertrieben, spricht Ebert für die Reparatur */
  if (still && fremd) return weiter();   // nur Abschalten ginge, aber dafür fehlt noch Hanne: später noch einmal fragen
  entscheidung(TX('Am Schaltkasten'), TX('Der rote Fluss'), [
    ['ebert', TX('Der Erzschürfer liegt still in seiner Grube, aber er lebt noch. Auf seinem Schaltkasten blinkt: „BEDARF NICHT GEDECKT. AUFTRAG ÄNDERN?“ In Eisenfurt warten sie, was wir tun.')],
    ...(fremd ? [] : [['hanne', TX('Abschalten. Für immer. Er hat dreihundert Jahre geschlafen, und kaum hat er einen Auftrag, ist der Fluss von Eisenfurt rot. Wir haben ihn geweckt, also legen wir ihn auch wieder schlafen. Aus seinem Stahl macht Grimbart euch Äxte, die nicht stumpf werden.')]]),
    ['bodo', TX('Abschalten? Das ist die beste Schaufel im ganzen Tal! Stellt sie an euren Außenposten im Wald. Da liegt alter Schrott unter jedem Baum. Und die Wäsche lassen wir für uns weiterlaufen. Irgendwo muss der Dreck halt hin.')],
    [rep, TX('Repariert ihn. Er tut nur, wofür er gebaut wurde. Gebt ihm einen Filter und einen neuen Auftrag, dann rodet er für euch, statt den Berg zu fressen. Der Verbund Produktion wird sich daran erinnern.')],
    ...(still ? [['ebert', TX('Nur: Der Verbund Produktion ist stillgelegt. Ohne ihn nimmt der Erzschürfer keinen neuen Auftrag an, und niemand baut einen Filter. Es bleibt nur, ihn abzuschalten.')]] : []),
  ], [
    fremd ? [TX('Abschalten · Dafür fehlt euch noch jemand, der sich das traut. Auf dem Markt hängen manchmal Flugblätter.'), () => erzWaehlen('aus'), true] : [TX('Abschalten: der Fluss wird klar'), () => erzWaehlen('aus')],
    [still ? TX('Umlenken (ohne den Verbund Produktion nicht möglich)') : TX('Umlenken: das Erz gehört euch'), () => erzWaehlen('uns'), still],
    [still ? TX('Reparieren (ohne den Verbund Produktion nicht möglich)') : TX('Reparieren: ein Filter und ein neuer Auftrag'), () => erzWaehlen('alle'), still],
  ], weiter);
}
function erzWaehlen(w) {
  const W = ERZWAHL[w];
  SPIEL.erz.wahl = w; SPIEL.erz.wahlTag = SPIEL.tag;
  clusterAendern('produktion', W.produktion);
  SPIEL.beziehungen.eisenfurt = Math.max(-3, Math.min(3, (SPIEL.beziehungen.eisenfurt || 0) + W.eisenfurt));
  SPIEL.verschmutzung = Math.max(0, (SPIEL.verschmutzung || 0) + W.verschmutzung);
  if (w === 'aus') { SPIEL.altmetall = (SPIEL.altmetall || 0) + W.altmetall; SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + W.schrott; }
  const lore = 'erz_' + w;
  if (!hatLore(lore)) SPIEL.chronik.push(lore);
  const posten = SPIEL.aussenposten.wald ? [] : [['mara', TX('Für den Wald braucht es erst einen Außenposten. Sobald er steht, merkt ihr den Unterschied.')]];
  return w === 'aus' ? [
    ['erzaehler', TX('Hanne zieht die Sicherungen, eine nach der anderen. Das Schaufelrad läuft aus. Unten am Fluss wird das Wasser hinter den Schiebern erst braun, dann grau, dann klar.')],
    ['hanne', TX('Grimbart holt sich morgen den Stahl. Und die Leute in Eisenfurt können endlich aus ihrem Fluss trinken.')],
    ...posten,
  ] : w === 'uns' ? [
    ['erzaehler', TX('Ihr tippt einen neuen Auftrag in den Schaltkasten: „FÖRDERORT: DUNKLER WALD. EMPFÄNGER: UNS.“ Der Erzschürfer setzt sich schwerfällig in Bewegung, nach Westen. Die Wäsche läuft weiter, jetzt für euch, und unter ihr bleibt der Fluss rot.')],
    ['bodo', TX('Eisenfurt wird sich beschweren. Eisenfurt beschwert sich immer. Wir haben dafür ab jetzt Altmetall, jeden Tag.')],
    ...posten,
  ] : [
    ['erzaehler', TX('Zwei Tage lang schweißen Roboter des Verbunds Produktion einen Filter an die Schieber. Dann tippt ihr einen neuen Auftrag ein: „RODEN. FILTERN. NICHT MEHR NEHMEN, ALS NACHWÄCHST.“ Der Schaltkasten antwortet: „AUFTRAG VERSTANDEN.“')],
    ...(clusterUnser('produktion') ? [['ebert', TX('Der Verbund Produktion steht jetzt auf unserer Seite. Die Fabrik wird uns mehr Lazi-Teile schicken.')]] : []),
    [figurDa('anselm') ? 'anselm' : 'ebert', TX('Seht ihr? Man muss ihnen nur sagen, wann genug ist. Das hat ihnen noch nie jemand gesagt.')],
    ...posten,
  ];
}
const ERZ_RUF_TAGE = 3;   // so viele Tage nach der Befreiung der Fabrik kommt der Bote aus Eisenfurt
// Aus tagVergeht: der Bote aus Eisenfurt, danach was die Wahl am Wald-Außenposten bewirkt
function erzTag(bericht) {
  if (!SPIEL.erzRuf && typeof fabrikFrei === 'function' && fabrikFrei()) {
    SPIEL.erzVorlauf = (SPIEL.erzVorlauf || 0) + 1;
    if (SPIEL.erzVorlauf >= ERZ_RUF_TAGE) {
      SPIEL.erzRuf = SPIEL.tag;
      for (const id of ['eisenfurt', 'erzwaesche']) if (!SPIEL.karte.bekannt.includes(id)) SPIEL.karte.bekannt.push(id);
      if (!hatLore('erz_ruf')) SPIEL.chronik.push('erz_ruf');
      bericht.push(TX('Ein Junge aus Eisenfurt ist die ganze Nacht gelaufen. Unter seinem Dorf ist eine alte Maschine aufgewacht, und seitdem ist der Fluss rot. Neu auf der Weltkarte: Der rote Fluss.'));
    }
  }
  koeniginRuf(bericht);
  const w = erzWahl();
  if (!w || !SPIEL.aussenposten.wald) return;
  const W = ERZWAHL[w], E = SPIEL.erz;
  if (w === 'aus') { SPIEL.holz += W.holz; return; }
  if (verbundStill('produktion')) { if (!E.stillGemeldet) { E.stillGemeldet = true; bericht.push(w === 'uns' ? TX('Seit der Verbund Produktion stillgelegt ist, steht der Erzschürfer im Wald still.') : TX('Seit der Verbund Produktion stillgelegt ist, wartet niemand mehr den Rodeschürfer. Er steht still.')); } return; }   /* die besseren Äxte stehen im Tagesbericht des Außenpostens nicht extra */
  if (w === 'uns') {
    SPIEL.holz = Math.max(0, SPIEL.holz + W.holz);
    SPIEL.altmetall = (SPIEL.altmetall || 0) + W.altmetall;
    const teile = SPIEL.tag % W.teileAlle === 0 ? 1 : 0; SPIEL.teile += teile;
    if (SPIEL.tag % 3 === 0) SPIEL.verschmutzung = (SPIEL.verschmutzung || 0) + 1;
    bericht.push(teile ? TX`Der Erzschürfer im Wald hat ${W.altmetall} Altmetall und ein Lazi-Teil aus dem Boden gegraben.` : TX`Der Erzschürfer im Wald hat ${W.altmetall} Altmetall aus dem Boden gegraben.`);
    return;
  }
  // Reparieren: Der Rodeschürfer braucht Holzkohle, umgerüstet Strom
  const mitStrom = E.strom && stromAn();
  if (!mitStrom) {
    if ((SPIEL.holzkohle || 0) < W.kohle) { if (!E.stillGemeldet) { E.stillGemeldet = true; bericht.push(E.strom ? TX('Der Rodeschürfer steht still: kein Strom und keine Holzkohle.') : TX('Der Rodeschürfer steht still: Es fehlt Holzkohle.')); } return; }
    SPIEL.holzkohle -= W.kohle;
  }
  E.stillGemeldet = false;
  const holz = mitStrom ? W.stromHolz : W.holz, stein = mitStrom ? W.stromStein : W.stein;
  SPIEL.holz += holz; SPIEL.stein += stein;
  E.fundTag = E.fundTag || SPIEL.tag;
  let fund = 0;
  if (SPIEL.tag - E.fundTag >= W.fundAlle) { E.fundTag = SPIEL.tag; fund = W.fund[0] + Math.floor(Math.random() * (W.fund[1] - W.fund[0] + 1)); SPIEL.altmetall = (SPIEL.altmetall || 0) + fund; }
  bericht.push(fund ? TX`Der Rodeschürfer hat Wurzelstöcke gerodet und Findlinge gehoben: ${holz} Holz, ${stein} Stein und ${fund} Altmetall aus dem Boden.` : TX`Der Rodeschürfer hat Wurzelstöcke gerodet und Findlinge gehoben: ${holz} Holz, ${stein} Stein.`);
}
// Der umgerüstete Rodeschürfer braucht beim Kraftwerk etwas mehr Kohle
function erzStromKosten() { return erzWahl() === 'alle' && SPIEL.erz.strom ? 1 : 0; }
// Auf der Weltkarte beim Wald: was dort die Schürfmaschine tut
function erzWaldHtml() {
  const w = erzWahl(), W = w && ERZWAHL[w];
  if (!w || !SPIEL.aussenposten.wald) return '';
  if (w === 'aus') return TX`<p class="note">Aus dem Stahl des Erzschürfers hat Grimbart Äxte geschmiedet: +${W.holz} Holz pro Tag.</p>`;
  if (w === 'uns') return TX`<p class="note">Der Erzschürfer gräbt im Wald: +${W.altmetall} Altmetall pro Tag, alle ${W.teileAlle} Tage ein Lazi-Teil, aber ${-W.holz} Holz weniger.</p>`;
  const E = SPIEL.erz;
  let html = E.strom ? TX`<p class="note">Der Rodeschürfer läuft mit Strom: +${W.stromHolz} Holz, +${W.stromStein} Stein pro Tag, ab und zu Altmetall. Ohne Strom braucht er ${W.kohle} Holzkohle pro Tag.</p>`
    : TX`<p class="note">Der Rodeschürfer braucht ${W.kohle} Holzkohle pro Tag: +${W.holz} Holz, +${W.stein} Stein, ab und zu Altmetall.</p>`;
  if (!E.strom) {
    const grund = !stromFrei() ? TX('Erst wenn das Kraftwerk läuft') : !kannBezahlen(W.umruesten) ? TX('Zu wenig Rohstoffe') : '';
    html += TX`<div class="aussenposten"><b>Auf Strom umrüsten</b><p class="note">Dann braucht er keine Holzkohle mehr, solange Strom da ist, und schafft mehr: +${W.stromHolz} Holz, +${W.stromStein} Stein. Das Kraftwerk braucht dafür 1 Kohle mehr. · ${kostenHtml(W.umruesten)}${grund ? ' · ' + esc(grund) : ''}</p>
      <button class="btn small" data-a="umruesten" type="button" ${grund ? 'disabled' : ''}>Umrüsten</button></div>`;
  }
  return html;
}
function erzUmruesten() {
  const W = ERZWAHL.alle;
  if (erzWahl() !== 'alle' || SPIEL.erz.strom || !stromFrei() || !kannBezahlen(W.umruesten)) return;
  bezahlen(W.umruesten); SPIEL.erz.strom = true; spielSpeichern(); geraeusch('bauen');
  meldung(TX('Der Rodeschürfer'), TX('Er läuft jetzt mit Strom'), 2000); weltkarteZeigen();
}

// ---------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  erzwaesche: { ...MISSIONSTEXTE.erzwaesche, ort: 'erzwaesche', typ: 'erzwaesche',
    feld: { x: 21, zMin: -12, zMax: 11.2, flaechen: ERZ_FLAECHEN, zugaenge: ERZ_ZUGAENGE, freieDeko: true }, start: [-17, 8.6], aufbau: () => aufbauErzwaesche(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: (erg, siege) => {
      const erstes = erzMitBoss();
      erg.gold += erstes ? 80 : 40; erg.teile += erstes ? 14 : 6; erg.stein += erstes ? 30 : 15;
      erg.material.bauteile = (erg.material.bauteile || 0) + (erstes ? 3 : 1);
      SPIEL.altmetall = (SPIEL.altmetall || 0) + (erstes ? 20 : 8);
      erg.lore = ['erzwaesche'];
      if (erstes) SPIEL.erz = { tag: SPIEL.tag, wahl: null };
    } },
});

// ---------------------------------------------------------------------
// Die zweite Mission der Produktion (Verbund-Geschichten, Punkt B; Inhaber, 08.11.2026: Produktion bekommt eine weitere Mission):
// Die Rostkönigin. Ein paar Tage nach der Wahl sacken in Eisenfurt die Stollen ein: Unter dem Tagebau sitzt Einheit 0001,
// die erste Wartungseinheit, die die Prüfung nicht bestanden hat. Sie hat die anderen viertausend gebaut.
// Sie gräbt sich ein und wandert als Erdhügel auf den Helden zu (unverwundbar), bricht mit Vorwarnung unter ihm hervor,
// bleibt kurz oben (verwundbar, beißt) und legt beim Eingraben Eier. Wer den Hügel an ein Spülventil lockt und es aufdreht,
// spült sie heraus: Sie liegt betäubt auf dem Rücken und nimmt mehr Schaden.
// ---------------------------------------------------------------------
const ROSTKOENIGIN = { tempoUnten: 3.4, unten: [4.5, 6.5], warn: 1.0, ausbruchR: 2.2, ausbruch: 24, oben: 5, eier: 2, betaeubt: 6, betaeubtMal: 1.5, spuelR: 4.5, ventilZeit: 1, ventilPause: 9, ruf: 4 };
function koeniginRuf(bericht) {
  const E = SPIEL.erz;
  if (!E || !E.wahl || E.koenigin) return;
  E.wahlTag = E.wahlTag || SPIEL.tag;
  if (SPIEL.tag - E.wahlTag < ROSTKOENIGIN.ruf) return;
  E.koenigin = 'ruf';
  bericht.push(TX('Aus Eisenfurt kommt wieder ein Bote: In den alten Stollen sacken die Stützen weg, angenagt bis auf einen Faden. Unter dem Tagebau rumort etwas, größer als jeder Käfer. Neue Mission am roten Fluss: Die Rostkönigin.'));
}
auftragstypAnmelden('rostkoenigin', { starten: rostkoeniginStarten, ablauf: rostkoeniginAblauf, hud: rostkoeniginHud, stand: STAND_NICHTS });
function rostkoeniginStarten() {
  const A = G.auftrag, E = ERZ, W = ROSTKOENIGIN;
  A.schlamm = []; A.spawnT = 6;
  A.ventile = E.ventile.map(([x, z]) => {
    const o = decoBild(BILD.spuelventil[0], x, z, 0.5);
    const ring = bodenFlaeche(ringGeo, 0x7ad0ff, 0.7); ring.position.set(x, 0.03, z); ring.scale.setScalar(1.4);
    const reich = bodenFlaeche(ringGeo, 0x7ad0ff, 0.22); reich.position.set(x, 0.028, z); reich.scale.setScalar(W.spuelR);
    return { x, z, o, ring, reich, lade: 0, pause: 0 };
  });
  A.huegel = bodenFlaeche(ringGeo, 0xc06a3a, 0.75); A.huegel.scale.setScalar(1.4);
  const b = gegnerErstellen('rostkoenigin', E.bossStart[0], E.bossStart[1]);
  rkPhase(b, 'unten', 3); A.boss = b;
  [[-6, 5], [-10, 0]].forEach(([x, z]) => gegnerErstellen('kaefer', x, z));
  meldung(TX('Die Rostkönigin'), TX('Sie wühlt sich durch den Boden auf dich zu. Lock den Erdhügel an ein Spülventil und dreh es auf, dann spült es sie heraus.'), 4200);
}
function rkPhase(e, phase, t) { e.phase = phase; e.phaseT = t; e.unverwundbar = phase === 'unten' || phase === 'warn'; }
function rkSpuelen(A, v) {
  const B = A.boss, W = ROSTKOENIGIN;
  if (B && B.hp > 0 && !(B.phase === 'unten' || B.phase === 'warn')) { v.lade = 0; zahl(v.x, 2.6, v.z, TX('Sie ist nicht unter der Erde!'), 'big'); return; }
  v.pause = W.ventilPause; v.lade = 0; zeige(v.o, BILD.spuelventil[1], 1); geraeusch('klick');
  for (let i = 0; i < 10; i++) partikel(v.x + zz(-2, 2), 0.3, v.z + zz(-2, 2), 0xa8d8f8, 2, 3);
  const nah = B && B.hp > 0 && (B.phase === 'unten' || B.phase === 'warn') && Math.hypot(B.x - v.x, B.z - v.z) < W.spuelR + 0.6;
  if (!nah) { zahl(v.x, 2.6, v.z, TX('Zu weit weg: Der Strahl erreicht den Hügel nicht!'), 'big'); return; }
  if (B.aktion && B.aktion.m) B.aktion.m.weg();
  B.aktion = null;
  rkPhase(B, 'betaeubt', W.betaeubt);
  for (let i = 0; i < 6; i++) rauchwolke(B.x + zz(-1, 1), B.z + zz(-1, 1), 0.9);
  zahl(B.x, 3.4, B.z, TX('Herausgespült! Jetzt zuschlagen!'), 'perfekt'); wackeln(0.35);
}
function rostkoeniginAblauf(dt) {
  const A = G.auftrag, B = A.boss, W = ROSTKOENIGIN;
  kraftwerkLichter(dt);
  if (!B || B.hp <= 0 || !G.gegner.includes(B)) { A.huegel.visible = false; return auftragGeschafft(TX('Die Rostkönigin ist tot')); }
  const unten = B.phase === 'unten' || B.phase === 'warn';
  A.huegel.visible = unten; A.huegel.position.set(B.x, 0.03, B.z - 0.5);   /* der Ring sitzt um den Buckel, nicht davor */
  if (B.phase === 'unten' && Math.random() < dt * 20) partikel(B.x + zz(-1.2, 1.2), 0.2, B.z + zz(-0.8, 0.8), 0x8a5a3a, 1, 1.5);   /* Wühlspur */
  // Betäubt nimmt sie mehr Schaden: über den Panzer-Faktor (größer als 1)
  B.panzer = B.phase === 'betaeubt' ? W.betaeubtMal : undefined;
  for (const v of A.ventile) {
    v.reich.visible = v.pause <= 0 && unten;
    if (v.pause > 0) { v.pause -= dt; v.ring.material.opacity = 0.2; if (v.pause <= 0) zeige(v.o, BILD.spuelventil[0], 1); continue; }
    v.ring.material.opacity = 0.7;
    if (Math.hypot(P.x - v.x, P.z - v.z) < 1.5 && P.hp > 0) { v.lade += dt; if (v.lade >= W.ventilZeit) rkSpuelen(A, v); }
    else v.lade = Math.max(0, v.lade - dt);
    v.ring.scale.setScalar(1.4 - v.lade / W.ventilZeit * 0.8);
  }
  A.spawnT -= dt;
  if (A.spawnT <= 0 && G.gegner.filter(e => !e.def.boss && e.hp > 0).length < 4) { A.spawnT = 9; const [x, z] = erzSpawn(); gegnerErstellen(Math.random() < 0.7 ? 'kaefer' : 'nagekaefer', x, z); }
}
function rostkoeniginHud() {
  const B = G.auftrag.boss;
  hudText('waveLabel', TX('Die Rostkönigin'));
  hudText('waveSub', !B ? '' : B.phase === 'betaeubt' ? TX('Herausgespült: zuschlagen!') : B.phase === 'oben' ? TX('Sie ist oben: zuschlagen!') : B.phase === 'warn' ? TX('Gleich bricht sie hervor!') : TX('Lock den Hügel an ein Spülventil'));
  hudText('doorLabel', TX('Rostkönigin'));
  document.getElementById('doorFill').style.width = (B ? Math.max(0, B.hp) / B.maxHp * 100 : 0) + '%';
}
Object.assign(EIGEN_KI, {
  rostkoenigin(e, dt) {
    const A = G.auftrag, W = ROSTKOENIGIN;
    if (!A || !A.ventile) return false;
    e.phaseT -= dt;
    if (e.phase === 'betaeubt') { e.bewegt = false; if (e.phaseT <= 0) rkPhase(e, 'oben', 2); return true; }
    if (e.phase === 'unten') {
      e.blick = P.x >= e.x ? 1 : -1;
      const d = Math.hypot(P.x - e.x, P.z - e.z);
      if (d > 0.3) { const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1; e.x += wx / wl * W.tempoUnten * dt; e.z += wz / wl * W.tempoUnten * dt; }
      e.bewegt = false;
      if (e.phaseT <= 0 || d < 0.8) { rkPhase(e, 'warn', W.warn); e.aktion = { m: kesselMarke(e.x, e.z, W.ausbruchR, 0xd06a3a) }; zahl(e.x, 2, e.z, TX('Der Boden bebt!'), 'big'); }
      return true;
    }
    if (e.phase === 'warn') {
      e.bewegt = false;
      if (e.aktion) e.aktion.m.scheibe.scale.setScalar(W.ausbruchR * (1 - Math.max(0, e.phaseT) / W.warn));
      if (e.phaseT > 0) return true;
      if (e.aktion) e.aktion.m.weg();
      e.aktion = null;
      for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - e.x, ziel.z - e.z) < W.ausbruchR + (ziel.r || 0.4)) schadenAn(ziel, W.ausbruch, e.x, e.z, e);
      partikel(e.x, 0.6, e.z, 0x8a5a3a, 18, 5); wackeln(0.4); geraeusch('explosion');
      rkPhase(e, 'oben', W.oben);
      return true;
    }
    // oben: Sie kämpft wie ein großer Käfer; danach gräbt sie sich wieder ein und legt Eier
    if (e.phaseT <= 0) {
      const frei = Math.max(0, 5 - G.gegner.filter(g => !g.def.boss && g.hp > 0).length);   /* die Eier zählen zur Obergrenze */
      for (let i = 0; i < Math.min(W.eier, frei); i++) gegnerErstellen('kaefer', e.x + zz(-1.5, 1.5), e.z + zz(-1.5, 1.5));
      partikel(e.x, 0.4, e.z, 0x8a5a3a, 12, 3); zahl(e.x, 2.6, e.z, TX('Sie gräbt sich ein!'), 'big');
      rkPhase(e, 'unten', zz(W.unten[0], W.unten[1]));
      return true;
    }
    return false;
  },
});
gegnerBildAnmelden('rostkoenigin', rostkoeniginBild);
function rostkoeniginBild(e, b) {
  if (e.phase === 'unten' || e.phase === 'warn') return BILD.rkHuegel[Math.floor(G.zeit * 6) % 2];
  if (e.phase === 'betaeubt') return BILD.rkRuecken[Math.floor(G.zeit * 4) % 2];
  return b;
}
Object.assign(MISSIONEN, {
  rostkoenigin: { ...MISSIONSTEXTE.rostkoenigin, ort: 'erzwaesche', typ: 'rostkoenigin', gefahr: 4,
    feld: { x: 21, zMin: -12, zMax: 11.2, flaechen: ERZ_FLAECHEN, zugaenge: ERZ_ZUGAENGE, freieDeko: true }, start: [-17, 8.6], aufbau: () => aufbauErzwaesche(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      erg.gold += 80; erg.teile += 12; erg.stein += 20; SPIEL.altmetall = (SPIEL.altmetall || 0) + 15;
      erg.material.bauteile = (erg.material.bauteile || 0) + 2;
      erg.lore = ['erz_koenigin']; SPIEL.erz.koenigin = 'erledigt'; clusterAendern('produktion', 6);
      if (ortBekannt('eisenfurt')) SPIEL.beziehungen.eisenfurt = Math.min(3, (SPIEL.beziehungen.eisenfurt || 0) + 1);
    } },
});

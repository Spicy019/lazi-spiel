// =====================================================================
// DIE ALTE SCHLEUSE (Staustufe 3, Verbund Logistik)
//  - Die Mission: Am Kai schlachten Plünderer die Kähne der Warteschlange aus. Erst ihre zwei
//    Beutekähne versenken, dann den Schleusenwärter besiegen, der seit 300 Jahren auf eine Freigabe wartet.
//  - Danach ist der Fluss offen: Alle paar Tage legt ein Kahn aus der Warteschlange an, und der Handel wird billiger.
// =====================================================================

// ---------------------------------------------------------------------
// Die Karte (Blick nach Norden): Quer über die Karte zieht sich der Damm der Staustufe, dahinter das Oberwasser mit der
// Warteschlange der Kähne. Westlich der Kai mit Containern, Portalkran und Steuerhaus, in der Mitte die Schleusenkammer mit
// Ober- und Untertor, östlich hinter der Trennmole das Wehr und der Fluss, der nach Süden abfließt. Unten am Kai die
// Uferstraße, über die man ankommt; am Steg im Süden legen die Plünderer an.
// ---------------------------------------------------------------------
const SCHLEUSE = {
  damm: -15.2,                  // Südkante des Damms; nördlich davon das Oberwasser
  kammer: [4, 10],              // Schleusenkammer zwischen den Kaimauern (x von bis)
  oberTor: -14.2, unterTor: -3, // z der beiden Tore
  mole: [10, 11.2],             // Trennmole zwischen Kammer und Fluss
  kaehne: [[5.0, 0.6], [5.0, 5.6]],   // Beutekähne der Plünderer, festgemacht an der Kaimauer
  bossStart: [-3, -10.6],
  wache: 9, plage: 4,           // Nachschub der Plünderer: alle 9 s, höchstens 4 zugleich
};
// Kai und Uferstraße überlappen breit: Auch der große Schleusenwärter kommt von einer Fläche auf die andere
const SCHLEUSE_FLAECHEN = [[-14, -14.2, 3.6, 11.8], [-21, 7, 3.6, 11.8], [2.2, 8.8, 6.8, 10.6]];
const SCHLEUSE_ZUGAENGE = [[-20.2, 9.4], [6, 9.7]];
function aufbauSchleuse() {
  szene.background = new THREE.Color('#0a0e12');
  KW_LICHTER.length = 0;
  const S = SCHLEUSE, [K0, K1] = S.kammer, fein = neueGrafik() ? 2 : 1;
  const imR = (f, x, z, m) => x > f[0] - m && x < f[2] + m && z > f[1] - m && z < f[3] + m;
  const begehbar = (x, z, m) => SCHLEUSE_FLAECHEN.some(f => imR(f, x, z, m));
  const boden = malBoden(64, 16 * fein, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.4 + Math.cos(z * 1.3) * 0.4;
    if (x > 3.6 && imR(SCHLEUSE_FLAECHEN[2], x, z, 0)) return 'steg';                                // Steg der Plünderer über dem Wasser
    if (z < S.damm - 1.2) return z < S.damm - 9 + wob * 0.4 ? 'ufer' : 'wasser';                  // Oberwasser, weit hinten das andere Ufer
    if (z < S.damm + 0.9) return 'beton';                                                           // Dammkrone mit Wehr
    if (x > S.mole[1]) return x > 25 + wob ? 'wald' : x > 23 + wob ? 'ufer' : 'wasser';           // Fluss unterhalb des Wehrs
    if (x > S.mole[0]) return z > 3 ? 'wasser' : 'beton';                                           // Trennmole, unten offen
    if (x > K0) return z < S.unterTor ? 'kammer' : 'wasser';                                         // Schleusenkammer und Unterwasser
    if (x > K0 - 0.5) return 'beton';                                                               // Kaimauer
    if (imR(SCHLEUSE_FLAECHEN[1], x, z, 0.2)) return z > 11.2 || z < 7.6 ? 'gehweg' : 'pflaster';
    if (imR(SCHLEUSE_FLAECHEN[0], x, z, 0.3)) return 'beton';
    if (z > 11.8 + wob * 0.5) return x > 3.6 ? 'wasser' : 'gras';
    return Math.sin(x * 0.7) + Math.cos(z * 0.9) > 0.9 + wob * 0.3 ? 'gras' : 'schutt';
  }, {
    beton:   ['#4c4e58', '#54565f', '#44464f', '#5c5e68'],
    pflaster:['#4a4650', '#524e58', '#423e48', '#5a5660'],
    gehweg:  ['#56545e', '#5e5c66', '#4e4c56', '#66646e'],
    steg:    ['#6a6058', '#766c62', '#5e544c', '#82786c'],
    schutt:  ['#4a4650', '#524e58', '#423e48', '#5a5660'],
    gras:    ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    wald:    ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    ufer:    ['#5e5444', '#6a604e', '#54493a', '#766a56'],
    wasser:  ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
    kammer:  ['#142438', '#182c42', '#10202e', '#1e344c'],
  }, 53);
  const { g, toPx, r } = boden, w = v => Math.max(1, v * fein);
  const linie = (x0, z0, x1, z1, farbe, dicke) => { g.fillStyle = farbe; const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 16 * fein); for (let k = 0; k <= n; k++) g.fillRect(toPx(x0 + (x1 - x0) * k / n), toPx(z0 + (z1 - z0) * k / n), w(dicke || 1), w(dicke || 1)); };
  // Kai: Betonplatten mit Fugen, Ölflecken, gelbe Kante an der Kaimauer; Kranschienen
  for (let x = -14; x <= 3.6; x += 2.2) linie(x, -14, x, 7.4, '#3a3c46');
  for (let z = -13; z <= 7.4; z += 2.2) linie(-14, z, 3.6, z, '#3a3c46');
  for (let z = -14; z < 12.4; z += 0.5) { g.fillStyle = Math.floor(z * 2) % 2 ? '#c8a030' : '#1d1328'; g.fillRect(toPx(K0 - 0.6), toPx(z), w(3), w(8)); }
  for (const x of [0.6, 2.8]) linie(x, -13.6, x, 7.2, '#7a7a88', 1);
  for (let k = 0; k < 8; k++) { const cx = toPx(-12 + r() * 14), cy = toPx(-12 + r() * 18); for (let i = 0; i < 50 * fein; i++) { g.fillStyle = r() < 0.6 ? '#22202a' : '#2a2832'; g.fillRect(cx + (r() * 12 - 6) * fein | 0, cy + (r() * 7 - 3.5) * fein | 0, w(1), w(1)); } }
  // Damm: Kante zum Oberwasser, Wehrfelder, unter dem Wehr Schaum; in der Kammer liegt das Wasser tiefer (dunkle Kante)
  linie(-32, S.damm - 1.2, 32, S.damm - 1.2, '#2a2c36', 2); linie(-32, S.damm + 0.9, K0 - 0.5, S.damm + 0.9, '#2a2c36', 2);
  for (let x = S.mole[1] + 1; x < 32; x += 2.6) linie(x, S.damm - 1.1, x, S.damm + 0.8, '#3a3c46', 2);
  for (let i = 0; i < 900 * fein; i++) { const x = S.mole[1] + r() * 21, z = S.damm + 0.9 + Math.pow(r(), 2) * 5; g.fillStyle = r() < 0.5 ? 'rgba(220,235,250,0.5)' : 'rgba(160,190,230,0.35)'; g.fillRect(toPx(x), toPx(z), w(1 + r() * 2), w(1)); }
  for (let i = 0; i < 260; i++) { const x = S.mole[1] + 0.5 + r() * 12, z = S.damm + 6 + r() * 30; g.fillStyle = 'rgba(150,190,230,0.2)'; g.fillRect(toPx(x), toPx(z), w(1), w(3 + r() * 6)); }   /* Strömung nach Süden */
  for (let i = 0; i < 200; i++) { const x = -32 + r() * 64, z = S.damm - 2 - r() * 6; g.fillStyle = 'rgba(150,190,230,0.16)'; g.fillRect(toPx(x), toPx(z), w(3 + r() * 6), w(1)); }
  linie(K0 + 0.05, S.oberTor, K0 + 0.05, S.unterTor, '#0a121c', 2); linie(K1 - 0.15, S.oberTor, K1 - 0.15, S.unterTor, '#0a121c', 2);
  for (let i = 0; i < 120; i++) { const x = K0 + 0.4 + r() * 5.2, z = S.unterTor + 0.3 + r() * 1.4; g.fillStyle = 'rgba(200,225,250,0.3)'; g.fillRect(toPx(x), toPx(z), w(1 + r() * 2), w(1)); }
  // Steg der Plünderer: Bohlen
  { const F = SCHLEUSE_FLAECHEN[2]; for (let x = 3.6; x < F[2]; x += 0.4) { g.fillStyle = '#3a342e'; g.fillRect(toPx(x), toPx(F[1]), w(1), toPx(F[3]) - toPx(F[1])); } }
  streuGras(boden, (px, py) => ['gras', 'schutt'].includes(boden.artBei(px, py)), 1800 * fein * fein, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, (px, py) => ['beton', 'pflaster', 'schutt', 'gehweg'].includes(boden.artBei(px, py)), 2200 * fein * fein);
  bodenMesh(boden, 64);
  const verdeckt = (b, x, z) => { const h = b.h * PX / 0.819, bw = b.w * PX / 2 * 0.8; for (let k = 0; k <= h; k += 0.5) for (const dx of [-bw, 0, bw]) if (begehbar(x + dx, z - k, 0.4)) return true; return false; };

  // ---- Hinten: die Warteschlange im Oberwasser. Kahn 1 liegt mit Kohle direkt vor dem Obertor. ----
  decoBild(BILD.lastkahn[1], (K0 + K1) / 2, S.oberTor - 3.8, 0, 0.6);
  [[7, -22.4], [7.4, -26.6], [1, -20.8], [13.2, -20.6], [-5, -21.6], [19.4, -22.2], [1.6, -25.4], [13.6, -25.6], [-10.6, -23.2], [-4.4, -26.4], [-16, -24.8], [25, -24]].forEach(([x, z], i) => decoBild(BILD.lastkahn[i % 4 === 1 ? 1 : 3], x, z, 0, 0.6));
  decoBild(BILD.kahn, 8.8, 9.9, 0, 0.5);   /* der Kahn der Plünderer am Steg */
  // ---- Die Schleuse: Obertor und Untertor, Poller an der Kaimauer ----
  G_SCHLEUSENTORE = [S.oberTor, S.unterTor].map(z => decoBild(BILD.schleusentor[0], (K0 + K1) / 2, z, 0, 0));
  for (let z = -12; z <= 7; z += 3.2) decoBild(BILD.poller, K0 - 0.9, z, 0.3, 0.2);
  // ---- Kai: Steuerhaus am Obertor, Portalkran auf den Schienen, Container (manche aufgebrochen), Kisten, Fässer ----
  decoBild(BILD.steuerhaus, 2.15, -12.5, 1.45, 1.2); HINDERNISSE.push({ x: 3.2, z: -13.6, r: 0.7 }, { x: 2.2, z: -14.3, r: 0.7 });   /* bündig an Damm und Kaimauer: keine Nische dahinter */
  { const kx = 2.7, kz = -1.2; decoBild(BILD.kran, kx, kz, 0, 1.2); HINDERNISSE.push({ x: kx - 1.38, z: kz, r: 0.45 }, { x: kx + 0.78, z: kz, r: 0.45 }); }
  /* Container in zwei Blöcken bündig an der Westseite und einer frei auf dem Kai: Zwischen allem bleiben Gassen, durch die auch der Schleusenwärter passt */
  [[-12.2, -8.4, 0], [-12.2, -6.2, 1], [-12.2, 2.4, 2], [-12.2, 4.6, 0], [-6.2, -1.6, 1]].forEach(([x, z, v]) => { decoBild(BILD.container[v], x, z, 0, 1.3); HINDERNISSE.push({ x: x - 0.8, z, r: 0.95 }, { x: x + 0.8, z, r: 0.95 }); });
  decoBild(BILD.kisten[0], -12.4, -10.2, 0.7); decoBild(BILD.kisten[1], -9.7, 3.4, 0.7);
  decoBild(BILD.oelfass, -13.4, -1.8, 0.4); decoBild(BILD.oelfass, -13.4, -0.9, 0.4);
  [[-13.4, -12.8], [-13.4, 8]].forEach(([x, z], i) => { animDeko(decoBild(BILD.industrielampe[1], x, z, 0.25), [BILD.industrielampe[1], BILD.industrielampe[1], BILD.industrielampe[0], BILD.industrielampe[1]], 1.6 + i); lichtFleck(x + 0.3, z + 0.3, 2.2, 0xffd060, 0.06, 0.02); });
  lichtFleck(1.2, -10.6, 1.6, 0x5ff0e0, 0.06, 0.01);   /* die Tafel im Steuerhaus */
  // ---- Ringsum: Lagerhallen als Ruinen im Westen, Wald jenseits des Flusses, Treibholz am Ufer ----
  for (const [x, z] of [[14.4, 6], [16, 12.6], [21.4, -6.6]]) decoBild(BILD.treibholz, x, z, 0, 0.3);
  const rr = zufall(57), stellen = [];
  for (let i = 0; i < 400 && stellen.length < 40; i++) {
    const x = -32 + rr() * 64, z = S.damm + 1.4 + rr() * 26;
    if (begehbar(x, z, 1.4) || x > K0 - 1.4 && x < 25.6) continue;
    if (stellen.some(([a, c]) => Math.hypot(a - x, c - z) < 3)) continue;
    const q = rr(), b = x > 25 ? (q < 0.6 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4]) : q < 0.45 ? BILD.ruine[i % 4] : q < 0.7 ? BILD.truemmer[i % 3] : q < 0.85 ? BILD.laubbaum[i % 4] : BILD.schutt[i % 3];
    if (verdeckt(b, x, z)) { if (!verdeckt(BILD.schutt[i % 3], x, z)) decoBild(BILD.schutt[i % 3], x, z, 0, 0); continue; }
    decoBild(b, x, z, 0, 1); stellen.push([x, z]);
  }
  for (let i = 0; i < 60; i++) { const x = -32 + rr() * 64, z = S.damm - 9.6 - rr() * 8; decoBild(rr() < 0.6 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 0.8); }   /* das andere Ufer des Oberwassers */
}
let G_SCHLEUSENTORE = [];
function schleuseOeffnen() {
  G_SCHLEUSENTORE.forEach(o => zeige(o, BILD.schleusentor[1], 1));
  for (let i = 0; i < 12; i++) partikel((SCHLEUSE.kammer[0] + SCHLEUSE.kammer[1]) / 2 + zz(-2.5, 2.5), 0.4, SCHLEUSE.unterTor + zz(-0.3, 0.6), 0xa8d8f8, 2, 3);
}

// ---------------------------------------------------------------------
// Der Schleusenwärter: Stempel (nah), Ladung ab (Kisten vom Haken), Rotlicht (wer sich bewegt, wird bestraft) und danach
// Freigabe (grünes Licht: Jetzt trifft jeder Schlag fester). Bei der Hälfte und einem Viertel legt ein Kahn Plünderer an.
// ---------------------------------------------------------------------
const SCHLEUSENWAERTER = { stempel: 22, stempelR: 2.8, ladung: 14, ladungR: 1.5, strafe: 14, rot: 2.2, gruenRuhig: 4.2, gruenUnruhig: 1.6, ruhigBis: 0.7 };
Object.assign(EIGEN_KI, {
  schleuse(e, dt) {
    const A = G.auftrag, W = SCHLEUSENWAERTER;
    e.bewegt = false;
    if (e.schlaeft) {
      if (A && A.bossFrei) schleusenwaerterWeckt(e);
      return true;
    }
    if (e.aktion) return schleuseAktion(e, dt);
    if (e.ueberhitzt > 0) {
      e.ueberhitzt -= dt;
      if (Math.random() < dt * 6) partikel(e.x + zz(-0.6, 0.6), 3.6, e.z, 0x7ad37a, 1, 1.5);
      return true;
    }
    // Bei der Hälfte und einem Viertel: Ein Kahn mit Plünderern legt an
    const anteil = e.hp / e.maxHp;
    if ((!e.welle1 && anteil < 0.5) || (!e.welle2 && anteil < 0.25)) {
      if (!e.welle1) e.welle1 = true; else e.welle2 = true;
      meldung(TX('Ein Kahn legt an!'), TX('Die Plünderer wollen wissen, was die Maschine bewacht.'), 2200);
      for (let i = 0; i < 3; i++) { const [x, z] = spawnPunkt(); const p = gegnerErstellen(i ? 'pluenderer' : 'schuetze', x, z); p.zustand = 'jagen'; }
    }
    e.angriffT -= dt;
    const d = abstand(e, P);
    if (e.angriffT <= 0 && P.hp > 0) {
      e.zug = (e.zug || 0) + 1;
      e.angriffT = anteil < 0.5 ? 2.2 : 2.9;
      schleuseStart(e, e.zug % 3 === 0 ? 'rot' : d < 4 ? 'stempel' : 'ladung');
      return true;
    }
    if (d < W.stempelR + P.r && (e.stempelCd || 0) <= 0) { schleuseStart(e, 'stempel'); return true; }
    e.stempelCd = (e.stempelCd || 0) - dt;
    if (d > 2.4) {
      const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e) * (anteil < 0.25 ? 1.3 : 1);
      e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
    }
    return true;
  },
});
function schleusenwaerterWeckt(e) {
  e.schlaeft = false; e.angriffT = 2; e.unverwundbar = false;
  meldung(TX('REIHENFOLGE GESTÖRT'), TX('Der Schleusenwärter erwacht. Bei Rot stehen bleiben, bei Grün zuschlagen.'), 3400);
  zahl(e.x, 3.4, e.z, TX('BITTE WARTEN.'), 'big');
  wackeln(0.4); geraeusch('explosion');
}
function schleuseStart(e, art) {
  const W = SCHLEUSENWAERTER;
  if (art === 'stempel') {
    e.aktion = { art, t: 0.9, m: kesselMarke(e.x, e.z, W.stempelR, 0xd04040) };
    e.stempelCd = 2.4;
    zahl(e.x, 3.4, e.z, TX('Abgestempelt!'), 'big');
  } else if (art === 'ladung') {
    // Er hebt Kisten vom Haken und lässt sie dort fallen, wo du gleich stehst
    const n = e.hp / e.maxHp < 0.5 ? 4 : 3;
    e.aktion = { art, t: 1.2, ziele: [] };
    for (let i = 0; i < n; i++) { const x = P.x + (i ? zz(-3, 3) : 0), z = P.z + (i ? zz(-3, 3) : 0); e.aktion.ziele.push({ x, z, m: kesselMarke(x, z, W.ladungR, 0xe8c040) }); }
    zahl(e.x, 3.4, e.z, TX('Ladung ab!'), 'big');
  } else {
    // Rotlicht: Wer sich jetzt bewegt, verstößt gegen die Reihenfolge
    e.aktion = { art, t: W.rot, dauer: W.rot, weg: 0 };
    // BITTE WARTEN gilt für alle: Auch die Plünderer bleiben stehen, solange Rot ist
    const wartende = G.gegner.filter(g => g !== e && g.hp > 0 && !g.def.objekt);
    for (const g of wartende) { g.zs.betaeubt = Math.max(g.zs.betaeubt || 0, W.rot); if (g.warn) g.warn.visible = false; g.aktion = null; }
    wartende.sort((a, b) => abstand(a, P) - abstand(b, P)).slice(0, 2).forEach(g => zahl(g.x, 2.2, g.z, TX('wartet …'), 'block'));   /* nur zwei Schilder, sonst überlappen sie */
    meldung(TX('ROT'), TX('BITTE WARTEN. Nicht bewegen!'), 1600);
    geraeusch('klick');
  }
  e.aktion.dauer = e.aktion.dauer || e.aktion.t;   /* schadenAn rechnet die Schwierigkeit selbst ein */
  if (art !== 'rot') e.warn.visible = true;
}
function schleuseAktion(e, dt) {
  const a = e.aktion, W = SCHLEUSENWAERTER;
  a.t -= dt;
  if (a.art === 'rot') {
    /* Nur was du selbst tust, zählt: Joystick/Tasten, Rolle, Sturm. Rückstoß durch Treffer ist keine Bewegung. */
    if (Math.hypot(eingabe.mx, eingabe.mz) > 0.2 || P.rolleT > 0 || P.sturm) a.weg += dt * 4;
    if (a.t > 0) return true;
    e.aktion = null;
    if (a.weg > W.ruhigBis) {
      schadenAn(P, W.strafe, e.x, e.z, e);
      zahl(P.x, 2.6, P.z, TX('Verstoß gegen die Reihenfolge!'), 'big');
      partikel(P.x, 1.2, P.z, 0xff5a4a, 10, 3);
      e.ueberhitzt = W.gruenUnruhig;
    } else {
      e.ueberhitzt = W.gruenRuhig;
      zahl(e.x, 3.6, e.z, TX('FREIGABE ERTEILT. Jetzt zuschlagen!'), 'perfekt');
    }
    geraeusch('klick');
    return true;
  }
  const k = 1 - Math.max(0, a.t) / a.dauer;
  if (a.m) a.m.scheibe.scale.setScalar(a.m.r * k);
  if (a.ziele) a.ziele.forEach(z => z.m.scheibe.scale.setScalar(z.m.r * k));
  if (a.t > 0) return true;
  e.warn.visible = false;
  const treffe = (x, z, r, n) => {
    for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - x, ziel.z - z) < r + (ziel.r || 0.4)) schadenAn(ziel, n, x, z, e);
    perfektPruefen(x, z, r + 0.5);
  };
  if (a.art === 'ladung') {
    a.ziele.forEach(z => { z.m.weg(); partikel(z.x, 0.5, z.z, 0x8a4e30, 10, 4); partikel(z.x, 0.4, z.z, 0x68728e, 6, 3); rauchwolke(z.x, z.z, 0.9); treffe(z.x, z.z, W.ladungR, W.ladung); });
    wackeln(0.3); geraeusch('explosion');
  } else {
    a.m.weg();
    for (let i = 0; i < 10; i++) rauchwolke(e.x + zz(-W.stempelR, W.stempelR) * 0.7, e.z + zz(-W.stempelR, W.stempelR) * 0.7, 1);
    wackeln(0.4); geraeusch('explosion');
    treffe(e.x, e.z, W.stempelR, W.stempel);
  }
  e.aktion = null;
  return true;
}
gegnerBildAnmelden('schleusenwaerter', schleusenwaerterBild);
// Welches Bild der Schleusenwärter gerade zeigt (aus missionZeichnen)
function schleusenwaerterBild(e, b) {
  if (e.aktion && e.aktion.art === 'rot') return BILD.schleusenRot;
  if (e.ueberhitzt > 0) return BILD.schleusenGruen;
  if (e.aktion && e.aktion.art === 'stempel') return BILD.schleusenStempel;
  return e.bewegt ? b : BILD.schleusenRuhe[Math.floor(G.zeit * 2) % 2];
}

// ---------------------------------------------------------------------
// Ablauf der Mission (aus auftragStarten/auftragAblauf/auftragHud)
// ---------------------------------------------------------------------
// Beim ersten Mal wartet der Schleusenwärter. Ist die Schleuse schon offen, kommen nur noch die Plünderer.
function schleuseMitBoss() { return !(SPIEL.flussroute && SPIEL.flussroute.offen); }
auftragstypAnmelden('schleuse', { starten: schleuseStarten, ablauf: schleuseAblauf, hud: schleuseHud, stand: STAND_NICHTS });
function schleuseStarten() {
  const A = G.auftrag, S = SCHLEUSE;
  A.kaehne = S.kaehne.map(([x, z]) => gegnerErstellen('beutekahn', x, z));
  A.spawnT = 4; A.bossFrei = false;
  [[-4, -3, 'pluenderer'], [-8.4, -1.6, 'pluenderer'], [-1.4, -6, 'schuetze'], [-6.8, -9.4, 'pluenderer']].forEach(([x, z, t]) => gegnerErstellen(t, x, z));
  if (schleuseMitBoss()) {
    const boss = gegnerErstellen('schleusenwaerter', S.bossStart[0], S.bossStart[1]);
    boss.schlaeft = true; boss.angriffT = 2; boss.blick = 1; boss.unverwundbar = true;   /* erst wenn die Beutekähne versenkt sind */
    A.boss = boss;
    A.ampel = bodenFlaeche(ringGeo, 0xff4040, 0.9); A.ampel.position.y = 0.03; A.ampel.visible = false;
    if (!hatLore('rotlicht')) SPIEL.chronik.push('rotlicht');   /* was man am Fluss über die Ampel weiß */
    meldung(TX('Die alte Schleuse'), TX('Versenke die zwei Beutekähne der Plünderer. Die große Maschine am Steuerhaus rührt sich nicht. Noch nicht.'), 3400);
  } else meldung(TX('Die alte Schleuse'), TX('Die Plünderer sind zurück. Versenke ihre zwei Beutekähne.'), 3000);
}
function schleuseKaehneUebrig() { return G.auftrag.kaehne.filter(k => k.hp > 0 && G.gegner.includes(k)).length; }
objektFolgeAnmelden('beutekahn', schleuseKahnSinkt);
// Aus objektZerstoert: Ein Beutekahn läuft voll und sinkt
function schleuseKahnSinkt(e) {
  restFigur(BILD.lastkahn[2], e.x, e.z);
  for (let i = 0; i < 14; i++) partikel(e.x + zz(-1, 1), 0.3, e.z + zz(-0.4, 0.4), 0xa8d8f8, 2, 3);
  wackeln(0.3); geraeusch('explosion');
  const A = G.auftrag;
  e.x = 1.8;   /* die Beute landet auf dem Kai, nicht im Wasser */
  if (A && A.kaehne) zahl(e.x, 2.6, e.z, TX`Kahn ${A.kaehne.length - A.kaehne.filter(k => k.hp > 0 && k !== e && G.gegner.includes(k)).length} / ${A.kaehne.length}`, 'big');
}
function schleuseAblauf(dt) {
  const A = G.auftrag, S = SCHLEUSE;
  kraftwerkLichter(dt);
  if (A.ampel) {
    const B = A.boss, rot = B.aktion && B.aktion.art === 'rot', gruen = B.ueberhitzt > 0 && B.hp > 0;
    A.ampel.visible = (rot || gruen) && G.gegner.includes(B);
    if (A.ampel.visible) { A.ampel.material.color.setHex(rot ? 0xff4040 : 0x6ae070); A.ampel.position.x = B.x; A.ampel.position.z = B.z; A.ampel.scale.setScalar(B.r + 0.9 + Math.sin(G.zeit * 8) * 0.12); }
  }
  A.kaehne.forEach((k, i) => { k.x = S.kaehne[i][0]; k.z = S.kaehne[i][1]; });   /* liegen im Wasser, nicht im Feld: nichts schiebt sie an Land */
  const uebrig = schleuseKaehneUebrig();
  if (!A.boss) { if (!uebrig) auftragGeschafft(TX('Die Kähne sind versenkt')); }
  else if (A.bossFrei && (A.boss.hp <= 0 || !G.gegner.includes(A.boss))) { if (!A.offen) { A.offen = true; schleuseOeffnen(); } return auftragGeschafft(TX('Die Schleuse ist frei')); }
  else if (!uebrig && !A.bossFrei) {
    A.bossFrei = true;
    meldung(TX('Die Plünderer fliehen'), TX('Am Steuerhaus springt eine Ampel auf Rot. Etwas Großes setzt sich in Bewegung.'), 3000);
  }
  // Solange ihre Kähne schwimmen, holen die Plünderer Verstärkung
  A.spawnT -= dt;
  if (uebrig && A.spawnT <= 0 && G.gegner.filter(e => e.typ === 'pluenderer' || e.typ === 'schuetze' || e.typ === 'schildtraeger').length < S.plage) {
    A.spawnT = S.wache;
    const [x, z] = spawnPunkt(), q = Math.random();
    gegnerErstellen(q < 0.55 ? 'pluenderer' : q < 0.85 ? 'schuetze' : 'schildtraeger', x, z);
  }
}
function schleuseHud() {
  const A = G.auftrag, uebrig = schleuseKaehneUebrig();
  if (uebrig || !A.boss) {
    hudText('waveLabel', TX('Der Kai'));
    hudText('waveSub', TX`${A.kaehne.length - uebrig} von ${A.kaehne.length} Beutekähnen versenkt`);
    hudText('doorLabel', TX('Beutekähne'));
    const hp = A.kaehne.reduce((s, k) => s + Math.max(0, k.hp), 0), max = A.kaehne.reduce((s, k) => s + k.maxHp, 0) || 1;
    document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
  } else {
    const B = A.boss;
    hudText('waveLabel', TX('Der Schleusenwärter'));
    hudText('waveSub', B.schlaeft ? TX('Er wartet') : B.aktion && B.aktion.art === 'rot' ? TX('Rot: nicht bewegen!') : B.ueberhitzt > 0 ? TX('Grün: zuschlagen!') : TX('Besiege den Schleusenwärter'));
    hudText('doorLabel', TX('Schleusenwärter'));
    document.getElementById('doorFill').style.width = (Math.max(0, B.hp) / B.maxHp * 100) + '%';
  }
}

// ---------------------------------------------------------------------
// Die Flussroute: Ist die Schleuse offen, legt alle paar Tage ein Kahn aus der Warteschlange an.
// Ihre Fracht ist dreihundert Jahre alt, aber sie ist für euch: „Bevölkerung, sobald zurückgekehrt“.
// ---------------------------------------------------------------------
const FLUSSROUTE = { alle: 4, handel: 0.9, letzter: 212,
  fracht: [['holz', 14], ['nahrung', 16], ['stein', 10], ['holzkohle', 8], ['teile', 3], ['altmetall', 6], ['beschlaege', 3]] };
// Der Anleger an der Schleuse (Inhaber, 07.11.2026): wird wie der Außenposten im Wald auf der Weltkarte gebaut und dreimal
// ausgebaut. Kähne kommen öfter und bringen mehr, und mit ihnen Leute von flussaufwärts, wenn im Dorf Platz ist.
// epoche zählt wie SPIEL.epoche ab 0 (2 = dritte Epoche)
const ANLEGER = [
  { name: TX('Anleger'), kosten: { gold: 80, holz: 30, stein: 20 }, arbeiter: 2, kahnAlle: 3, fracht: 1, leuteAlle: 3, leute: [1, 1] },
  { name: TX('Kai mit Kran'), kosten: { gold: 140, holz: 40, beschlaege: 10, teile: 8 }, arbeiter: 3, kahnAlle: 2, fracht: 1.5, leuteAlle: 2, leute: [1, 1] },
  { name: TX('Flusshafen'), epoche: 3, kosten: { gold: 220, stein: 60, beschlaege: 20, teile: 20 }, arbeiter: 4, kahnAlle: 1, fracht: 2, leuteAlle: 1, leute: [1, 2] },
];
function flussrouteOffen() { return !!(SPIEL && SPIEL.flussroute && SPIEL.flussroute.offen); }
function anlegerStufe() { return flussrouteOffen() ? SPIEL.flussroute.anleger || 0 : 0; }
function anlegerWerte() { const st = anlegerStufe(); return st ? ANLEGER[st - 1] : null; }
function anlegerArbeiter() { const A = anlegerWerte(); return (A ? A.arbeiter : 0) + (flussWahl() === 'hand' ? FLUSSWAHL.hand.traeger[anlegerStufe()] : 0); }
// Die Wahl an der Schleuse (Inhaber, 07.11.2026): Nach dem Schleusenwärter fragt die Tafel im Steuerhaus, wie es weitergeht.
//  alle: Mit den Maschinen. Die Reihenfolge bleibt, die Schleuse dient allen, die Lastläufer tragen. Logistik dazu,
//        billigerer Handel, Fremde von flussaufwärts: manche bringen Ärger (Dieb, Husten, Späher), manche etwas Gutes.
//        Zählt für Pakt und Hirte.
//  uns:  Für euch allein (Bodo). Euer Name steht auf der Tafel, eure Kähne zuerst, fremde Kähne warten. Die Maschine
//        gehorcht euch: Fracht ×1,4 und Durchfahrtszoll von den wartenden Kähnen, kein billigerer Handel, keine Fremden.
//        Die Plünderer wissen, wohin die Ware fährt: Überfälle kommen früher, je größer der Anleger. Zählt für die Krone.
//  hand: Gegen die Maschinen, der Weg der Rostbrecher. Hanne schaltet Tafel und Lastläufer ab, eure Leute tragen von Hand.
//        Das braucht Träger (Arbeiter), bringt aber Lohn (Gold je Kahn) und etwas mehr Fracht, und es läuft auch,
//        wenn der Verbund Logistik euch feind oder stillgelegt ist. Logistik sinkt, der innere Kreis ist wütend,
//        die Lastläufer werden zu Altmetall. Am Kai stehen Menschen statt Maschinen: Überfälle kommen früher. Zählt für die Stille.
// je Anleger-Stufe 0 bis 3: ueberfall = so viele Tage früher, lohn = Gold je Kahn, traeger = zusätzliche Arbeiter
const FLUSSWAHL = {
  alle: { logistik: 35, fracht: 1, aerger: 0.25, gut: 0.25, ueberfall: [0, 0, 1, 1], quittung: 5 },
  uns:  { logistik: 10, fracht: 1.4, ueberfall: [1, 1, 2, 3], zoll: [2, 4, 6, 8] },
  hand: { logistik: -20, zorn: 6, altmetall: 20, schrott: 2, fracht: 1.2, ueberfall: [1, 1, 2, 2], lohn: [4, 6, 9, 12], traeger: [1, 1, 2, 2] },
};
function flussWahl() { return flussrouteOffen() && SPIEL.flussroute.wahl || null; }
function flussUeberfallFrueher() { const w = flussWahl(); return w ? Math.max(0, FLUSSWAHL[w].ueberfall[anlegerStufe()] - (kaiWache() ? 1 : 0)) : 0; }   /* die Kai-Wache nach den Kistendieben */
// Nach der Rückkehr ins Dorf: Ist die Schleuse offen und noch nichts entschieden, fragt die Tafel.
// Kennt man die Rostbrecher noch nicht (Inhaber, 08.11.2026), ist „von Hand“ zu sehen, aber gesperrt, mit einem Hinweis; Hanne spricht dann nicht.
function flussWahlPruefen(weiter) {
  if (!flussrouteOffen() || SPIEL.flussroute.wahl) return weiter();
  const still = verbundLastlaeuferStill(), traeger = FLUSSWAHL.hand.traeger[anlegerStufe()], ohneArbeiter = dorfWerte().frei < traeger, fremd = !rostbrecherBekannt();
  if (still && (ohneArbeiter || fremd)) return weiter();   // geht gerade gar nichts: später noch einmal fragen
  entscheidung(TX('Die Tafel im Steuerhaus'), TX('Die alte Schleuse'), [
    ['ebert', TX('Die Tafel im Steuerhaus blinkt seit gestern: „REIHENFOLGE FESTLEGEN? 1: WIE BISHER, WER ZUERST KAM. 2: BERECHTIGTE ZUERST. 3: STEUERUNG MANUELL.“ Unter der Zwei ist ein leeres Feld für einen Namen. Die Lastläufer am Kai stehen still und warten auf die Antwort.')],
    ['piet', TX('Lass die Reihenfolge, wie sie ist. Der Fluss hat nie jemandem gehört. Wenn die Kähne für alle fahren, kommen auch Leute von flussaufwärts zu uns. Nicht alle werden nett sein. Aber so ist das mit Nachbarn.')],
    ['bodo', TX('Schreib unseren Namen rein. Wir haben das Ding besiegt, also sind wir berechtigt. Die Fracht gehört uns, und wer durch die Schleuse will, zahlt Zoll. Dass die Plünderer dann wissen, wohin die Ware geht, ist eben der Preis.')],
    ...(fremd ? [] : [['hanne', TX('Drück die Drei, und dann zieh den Stecker. Die Lastläufer, die Tafel, alles. Unsere Leute können Säcke tragen, und wer trägt, wird bezahlt. Wenn die Maschinen alles machen, wovon sollen die Leute dann leben? Wer gefüttert wird, verlernt, sich selbst zu ernähren.')]]),
    ...(still ? [['ebert', TX('Nur: Der Verbund Logistik ist stillgelegt. Ohne ihn trägt kein Lastläufer mehr etwas, egal was auf der Tafel steht. Wenn hier noch Kähne entladen werden sollen, dann von Hand.')]] : []),
  ], [
    [still ? TX('Die Reihenfolge lassen (ohne den Verbund Logistik nicht möglich)') : TX('Die Reihenfolge lassen: die Schleuse für alle'), () => flussWaehlen('alle'), still],
    [still ? TX('Euren Namen eintragen (ohne den Verbund Logistik nicht möglich)') : TX('Euren Namen eintragen: die Schleuse nur für euch'), () => flussWaehlen('uns'), still],
    fremd ? [TX('Steuerung manuell · Dafür fehlt euch noch jemand, der sich das traut. Auf dem Markt hängen manchmal Flugblätter.'), () => flussWaehlen('hand'), true] :
    [ohneArbeiter ? (traeger === 1 ? TX('Steuerung manuell (braucht 1 freien Arbeiter als Träger)') : TX`Steuerung manuell (braucht ${traeger} freie Arbeiter als Träger)`) : TX`Steuerung manuell: eure Leute übernehmen den Kai (${traeger} Arbeiter als Träger)`, () => flussWaehlen('hand'), ohneArbeiter],
  ], weiter);
}
function flussWaehlen(w) {
  const W = FLUSSWAHL[w];
  SPIEL.flussroute.wahl = w;
  clusterAendern('logistik', W.logistik);
  if (w === 'hand') {
    SPIEL.altmetall = (SPIEL.altmetall || 0) + W.altmetall;
    SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + W.schrott;
    if (SPIEL.bestehende) SPIEL.bestehende.zorn = Math.min(100, (SPIEL.bestehende.zorn || 0) + W.zorn);
  }
  const lore = 'fluss_' + w;
  if (!hatLore(lore)) SPIEL.chronik.push(lore);
  return w === 'alle' ? [
    ['erzaehler', TX('Die Tafel flackert: „REIHENFOLGE BESTÄTIGT. ALLE BERECHTIGT. NÄCHSTER: WER ZUERST KAM.“ Am Kai stellen sich die Lastläufer in eine Reihe, einer hinter dem anderen, und der vorderste hebt kurz die Hand, als würde er grüßen.')],
    ['piet', TX('Das ist das erste Mal, dass eine Maschine etwas mit mir teilt. Ich weiß noch nicht, ob mir das gefällt.')],
    ['ebert', TX('Dreihundert Jahre haben sie gewartet, dass jemand ihnen sagt, für wen sie das alles tun. Jetzt haben wir es gesagt: für alle. Ich hoffe, wir meinen es auch so.')],
  ] : w === 'uns' ? [
    ['erzaehler', TX('Du tippst euren Namen ein. Die Tafel flackert: „BERECHTIGT: 1. ALLE ANDEREN: BITTE WARTEN.“ Der Schleusenwärter hat dreihundert Jahre lang niemanden vorgelassen. Jetzt lässt er nur noch euch vor.')],
    ['bodo', TX('Siehst du? Die Maschine hat es sofort verstanden. Ordnung muss sein. Unsere Ordnung.')],
    ['ebert', TX('Die Lastläufer gehorchen dir jetzt, ohne zu fragen. Das haben sie beim inneren Kreis auch getan. Ich sage nur, was ich sehe.')],
  ] : [
    ['erzaehler', TX('Hanne zieht den Hauptschalter. Die Tafel flackert ein letztes Mal: „STEUERUNG: MANUELL. BITTE …“ Dann wird sie dunkel. Am Kai bleiben die Lastläufer mitten im Schritt stehen. Hanne schraubt den ersten schon auf, bevor er ganz still ist.')],
    ['hanne', TX('Hörst du das? Nichts piept. So klingt Arbeit, die uns gehört. Morgen stehen die ersten von euch am Kai, und jeder bekommt seinen Lohn.')],
    ['ebert', TX('Die Lastläufer geben gutes Altmetall. Ich schreibe auf, wie viele es waren. Irgendwer sollte es tun.')],
  ];
}
// Fremde von flussaufwärts (nur „für alle“): Manche bringen Ärger, Nachtwache und Krankenstation helfen. Manche bringen Gutes.
function flussFremde(bericht) {
  const art = Math.floor(Math.random() * 3);
  if (art === 0) {
    if (SPIEL.nachtwache > 0) return bericht.push(TX('Die Nachtwache hat einen der Fremden an der Dorfkasse erwischt. Er ist mit dem nächsten Kahn wieder abgefahren.'));
    const n = Math.min(40, Math.floor(SPIEL.gold * 0.08));
    if (n > 0) { SPIEL.gold -= n; bericht.push(TX`Einer der Fremden ist über Nacht verschwunden, und mit ihm ${n} Gold aus der Dorfkasse.`); }
  } else if (art === 1) {
    if (pflegeAktiv()) return bericht.push(TX('Ein Fremder hat Husten mitgebracht. Hilde hat ihn in der Krankenstation ins Bett gesteckt, bevor es sich ausbreitet.'));
    const n = Math.min(SPIEL.nahrung, 12);
    SPIEL.nahrung -= n; bericht.push(TX`Ein Fremder hat Husten mitgebracht. Hilde kocht Brühe für alle, die es erwischt hat: ${n} Nahrung.`);
  } else {
    const U = SPIEL.ueberfall;
    if (U && !U.gemeldet && U.tag > SPIEL.tag + 1) U.tag--;
    bericht.push(TX('Einer der Fremden hat sich die Mauer und das Tor sehr genau angesehen und ist dann weitergezogen. Mara gefällt das nicht.'));
  }
}
function flussFremdeGut(bericht) {
  const art = Math.floor(Math.random() * 3);
  if (art === 0) { SPIEL.beschlaege = (SPIEL.beschlaege || 0) + 3; bericht.push(TX('Unter den Fremden ist ein Kesselflicker. Er bedankt sich für das Dach über dem Kopf mit 3 Beschlägen aus seinem Werkzeugkasten.')); }
  else if (art === 1) { SPIEL.kraeuter = (SPIEL.kraeuter || 0) + 3; bericht.push(TX('Eine Kräuterfrau von flussaufwärts hat 3 Kräuterbeutel mitgebracht. Hilde und sie streiten schon über Kamille.')); }
  else { SPIEL.teile += 2; bericht.push(TX('Ein Junge von flussaufwärts kann mit Lastläufern reden, sagt er. Jedenfalls folgen sie ihm. Abends bringt er 2 Lazi-Teile vom Kai.')); }
}
// Aus tagVergeht
function flussrouteTag(bericht) {
  if (!flussrouteOffen()) return;
  const R = SPIEL.flussroute, A = anlegerWerte();
  if (SPIEL.tag - R.tag < (A ? A.kahnAlle : FLUSSROUTE.alle)) return;
  const W = flussWahl() && FLUSSWAHL[flussWahl()], vonHand = flussWahl() === 'hand';
  // Von Hand läuft der Kai auch ohne den Verbund Logistik
  if (!vonHand && verbundLastlaeuferStill()) { if (!R.still) { R.still = true; bericht.push(TX('Die Kähne auf dem Fluss liegen still. Der Verbund Logistik hört nicht mehr auf euch.')); } return; }
  R.still = false; R.tag = SPIEL.tag; R.kahn++;
  const [res, grund] = FLUSSROUTE.fracht[R.kahn % FLUSSROUTE.fracht.length], menge = Math.round(grund * (A ? A.fracht : 1) * (W ? W.fracht : 1));
  SPIEL[res] = (SPIEL[res] || 0) + menge;
  if (vonHand) {
    const lohn = W.lohn[anlegerStufe()]; SPIEL.gold += lohn;
    bericht.push(R.kahn <= FLUSSROUTE.letzter ? TX`Kahn ${R.kahn} aus der Warteschlange hat angelegt. Eure Träger schleppen die Fracht ins Dorf: ${menge} ${ROHSTOFF_NAME[res]}. Was sie nebenbei auf dem Markt verkaufen, bringt eine Abgabe von ${lohn} Gold in die Dorfkasse.` : TX`Ein Kahn von flussaufwärts hat angelegt. Eure Träger schleppen die Fracht ins Dorf: ${menge} ${ROHSTOFF_NAME[res]}. Was sie nebenbei auf dem Markt verkaufen, bringt eine Abgabe von ${lohn} Gold in die Dorfkasse.`);
  } else bericht.push(R.kahn <= FLUSSROUTE.letzter ? TX`Kahn ${R.kahn} aus der Warteschlange hat angelegt. Die Lastläufer tragen die Fracht ins Dorf: ${menge} ${ROHSTOFF_NAME[res]}.` : TX`Ein Kahn von flussaufwärts hat angelegt. Die Lastläufer tragen die Fracht ins Dorf: ${menge} ${ROHSTOFF_NAME[res]}.`);
  if (R.kahn === FLUSSROUTE.letzter) bericht.push(TX('Auf der Tafel im Steuerhaus steht: „WARTESCHLANGE: 0.“ Zum ersten Mal seit dreihundert Jahren wartet niemand mehr.'));
  kaiDiebeRuf(bericht);
  if (R.kahn === 4 && !hatLore('frachtbriefe')) { SPIEL.chronik.push('frachtbriefe'); bericht.push(TX('Im Laderaum von Kahn 4 lagen Durchschläge der Frachtbriefe 1 bis 3. Ebert hat sie in die Chronik geklebt.')); }
  if (flussWahl() === 'uns') { const zoll = W.zoll[anlegerStufe()]; SPIEL.gold += zoll; bericht.push(TX`Hinter euren Kähnen warten fremde. Wer nicht ewig warten will, zahlt Bodo Zoll und kommt nach euch dran: ${zoll} Gold.`); }
  if (flussWahl() === 'alle' && R.kahn % W.quittung === 0) { clusterAendern('logistik', 1); bericht.push(TX('Ein Lastläufer bringt eine gestempelte Quittung ins Dorf: „LIEFERUNG AN ALLE. DANKE.“ Der Verbund Logistik merkt sich so etwas.')); }
  // Kahn 10: Was die Wahl an der Schleuse flussaufwärts angerichtet hat
  const spaeter = flussWahl() && 'fluss_' + flussWahl() + '2';
  if (R.kahn >= 10 && spaeter && !hatLore(spaeter)) { SPIEL.chronik.push(spaeter); bericht.push(flussWahl() === 'alle' ? TX('Mit Kahn 10 kam ein Brief von flussaufwärts. Ebert hat ihn in die Chronik geklebt.') : flussWahl() === 'uns' ? TX('Vor dem Damm liegen fremde Kähne und warten. Ebert hat etwas in die Chronik geschrieben.') : TX('Im Schuppen am Kai liegen die zerlegten Lastläufer. Ebert hat etwas in die Chronik geschrieben.')); }
  // Mit dem Anleger kommen Leute von flussaufwärts, sie haben gehört, dass die Kähne wieder fahren
  if (A && SPIEL.tag - (R.leuteTag || 0) >= A.leuteAlle) {
    const frei = dorfWerte().platz - SPIEL.einwohner;
    if (frei > 0) {
      R.leuteTag = SPIEL.tag;
      const n = Math.min(frei, A.leute[0] + Math.floor(Math.random() * (A.leute[1] - A.leute[0] + 1)));
      SPIEL.einwohner += n;
      bericht.push(n === 1 ? (vonHand ? TX('Mit dem Kahn ist jemand von flussaufwärts gekommen und bleibt. Am Kai wird Arbeit bezahlt, das hat sich herumgesprochen.') : TX('Mit dem Kahn ist jemand von flussaufwärts gekommen und bleibt. Es hat sich herumgesprochen, dass die Kähne wieder fahren.')) : vonHand ? TX`Mit dem Kahn sind ${n} Leute von flussaufwärts gekommen und bleiben. Am Kai wird Arbeit bezahlt, das hat sich herumgesprochen.` : TX`Mit dem Kahn sind ${n} Leute von flussaufwärts gekommen und bleiben. Es hat sich herumgesprochen, dass die Kähne wieder fahren.`);
      const z = Math.random();
      if (flussWahl() === 'alle') { if (z < W.aerger) flussFremde(bericht); else if (z < W.aerger + W.gut) flussFremdeGut(bericht); }
    }
  }
}
// Auf der Weltkarte bei der Schleuse: Anleger bauen und ausbauen
const rhythmus = n => n === 1 ? TX('jeden Tag') : TX`alle ${n} Tage`;
function anlegerKarteHtml() {
  if (!flussrouteOffen()) return '';
  const st = anlegerStufe(), A = anlegerWerte(), naechste = ANLEGER[st];
  let html = A ? TX`<p class="note"><b>${esc(A.name)}</b> (Stufe ${st} von ${ANLEGER.length}) · Kähne: ${rhythmus(A.kahnAlle)}, Fracht ×${A.fracht} · Leute von flussaufwärts: ${rhythmus(A.leuteAlle)}, wenn Platz ist · ${anlegerArbeiter()} Arbeiter</p>` : TX`<p class="note">Alle ${FLUSSROUTE.alle} Tage legt ein Kahn aus der Warteschlange an.</p>`;
  const w = flussWahl();
  if (w) html += `<p class="note">${w === 'alle' ? TX('Die Schleuse dient allen: billigerer Handel, Fremde kommen mit den Kähnen, nicht alle meinen es gut.') : w === 'uns' ? TX`Die Schleuse hört nur auf euch: Fracht ×1,4, ${FLUSSWAHL.uns.zoll[st]} Gold Zoll je Kahn, kein billigerer Handel. Die Plünderer kommen früher, je größer der Anleger.` : TX`Der Kai läuft von Hand: ${FLUSSWAHL.hand.traeger[st]} Träger, ${FLUSSWAHL.hand.lohn[st]} Gold Abgabe je Kahn, Fracht ×1,2, auch ohne den Verbund Logistik. Am Kai stehen Menschen statt Maschinen, die Plünderer kommen früher, je größer der Anleger.`}</p>`;
  const mehr = naechste ? naechste.arbeiter - (A ? A.arbeiter : 0) + (w === 'hand' ? FLUSSWAHL.hand.traeger[st + 1] - FLUSSWAHL.hand.traeger[st] : 0) : 0;
  if (naechste) {
    const grund = naechste.epoche > SPIEL.epoche ? TX`Ab Epoche ${naechste.epoche + 1}` : dorfWerte().frei < mehr ? TX`Braucht ${mehr} freie Arbeiter` : !kannBezahlen(naechste.kosten) ? TX('Zu wenig Rohstoffe') : '';
    html += TX`<div class="aussenposten"><b>${st ? TX`Ausbauen: ${esc(naechste.name)}` : TX`Bauen: ${esc(naechste.name)}`}</b><p class="note">Kähne: ${rhythmus(naechste.kahnAlle)}, Fracht ×${naechste.fracht} · Leute von flussaufwärts: ${rhythmus(naechste.leuteAlle)} · ${kostenHtml(naechste.kosten)} · ${naechste.arbeiter + (w === 'hand' ? FLUSSWAHL.hand.traeger[st + 1] : 0)} Arbeiter${grund ? ' · ' + esc(grund) : ''}</p>
      <button class="btn small" data-a="anleger" type="button" ${grund ? 'disabled' : ''}>${st ? TX('Ausbauen') : TX('Bauen')}</button></div>`;
  }
  return html;
}
function anlegerBauen() {
  const naechste = ANLEGER[anlegerStufe()];
  if (!naechste || !kannBezahlen(naechste.kosten)) return;
  bezahlen(naechste.kosten); SPIEL.flussroute.anleger = anlegerStufe() + 1; spielSpeichern(); geraeusch('bauen');
  meldung(naechste.name, TX('Ab morgen legen die Kähne öfter an'), 2000); weltkarteZeigen();
}

// ---------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  schleuse: { ...MISSIONSTEXTE.schleuse, ort: 'schleuse', typ: 'schleuse',
    feld: { x: 21, zMin: -14.2, zMax: 12.6, flaechen: SCHLEUSE_FLAECHEN, zugaenge: SCHLEUSE_ZUGAENGE, freieDeko: true }, start: [-10, 9.4], aufbau: () => aufbauSchleuse(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: (erg, siege) => {
      const erstes = schleuseMitBoss();
      erg.gold += erstes ? 70 : 35; erg.teile += erstes ? 12 : 5; erg.holz += erstes ? 20 : 10; erg.nahrung += erstes ? 25 : 12; erg.stein += erstes ? 10 : 6;
      erg.material.bauteile = (erg.material.bauteile || 0) + (erstes ? 3 : 1);
      erg.lore = ['schleuse'];
      if (erstes) { SPIEL.flussroute = { offen: true, tag: SPIEL.tag, kahn: 1, wahl: null }; SPIEL.holzkohle = (SPIEL.holzkohle || 0) + 20; }   /* die Kohle aus Kahn 1 */
      clusterAendern('logistik', erstes ? 10 : 8);   /* den Rest bringt die Wahl „für alle“ (FLUSSWAHL) */
    } },
});

// ---------------------------------------------------------------------
// Die zweite Mission der Logistik (Verbund-Geschichten, Punkt B; Inhaber, 08.11.2026: Logistik bekommt eine weitere Mission):
// Kistendiebe am Kai. Ab Kahn 6 (wenn die Wahl getroffen ist) fehlen am Kai Kisten. Der große Kahn wird entladen, die Kisten stehen
// auf einem Stapel, und Diebe rennen vom Steg herüber, greifen sich eine Kiste und rennen zurück. Fällt ein Dieb, bleibt
// seine Kiste liegen: drübergehen, dann steht sie wieder auf dem Stapel. Wer genug Kisten hält, bis der Kahn leer ist, gewinnt.
// Bei den Dieben findet man einen Frachtbrief mit dem Stempel des inneren Kreises. Danach hält eine Kai-Wache die Augen offen:
// Die Plünderer kommen einen Tag weniger früher.
// Die Wahl ändert, wie viele Diebe kommen: Bei „nur für euch“ wissen die Plünderer am besten, wohin die Ware fährt.
// ---------------------------------------------------------------------
const KAI = { kisten: 12, halten: 8, dauer: 75, stapel: [-5, -8.6], steg: [6, 9.7], nimm: 1.3, aufheben: 1.1, hoechstens: 3,
  dieb: { alle: 5.2, uns: 3.8, hand: 4.6 }, wache: 8, wacheHoechstens: 3, ruf: 6 };
function kaiDiebeRuf(bericht) {
  const R = SPIEL.flussroute;
  if (!flussWahl() || R.diebe || R.kahn < KAI.ruf) return;
  R.diebe = 'ruf';
  bericht.push(TX('Am Kai fehlen Kisten. Nachts legen fremde Boote am Steg an, und morgens ist ein Stapel kleiner. Mara will dabei sein, wenn der nächste große Kahn entladen wird. Neue Mission an der alten Schleuse: Kistendiebe am Kai.'));
}
function kaiWache() { return !!(SPIEL.flussroute && SPIEL.flussroute.diebe === 'erledigt'); }
auftragstypAnmelden('kaidiebe', { starten: kaidiebeStarten, ablauf: kaidiebeAblauf, hud: kaidiebeHud, stand: STAND_NICHTS });
function kaidiebeStarten() {
  const A = G.auftrag, w = flussWahl() || 'alle';
  A.kisten = KAI.kisten; A.verloren = 0; A.zeit = KAI.dauer; A.diebe = []; A.liegt = []; A.diebT = 3; A.wacheT = 5;
  A.stapel = decoBild(BILD.kistenstapel[2], KAI.stapel[0], KAI.stapel[1], 1.1, 1.0);
  A.sx = A.stapel.sprite.position.x; A.sz = A.stapel.sprite.position.z;
  A.ring = bodenFlaeche(ringGeo, 0xe8c040, 0.6); A.ring.position.set(A.sx, 0.03, A.sz); A.ring.scale.setScalar(KAI.nimm + 0.6);
  [[-8, 4], [-2, 6]].forEach(([x, z]) => gegnerErstellen('pluenderer', x, z));
  meldung(TX('Kistendiebe am Kai'), w === 'uns' ? TX('Die Plünderer wissen genau, wohin eure Fracht fährt. Halt sie vom Stapel fern, bis der Kahn leer ist.') : w === 'hand' ? TX('Eure Träger entladen den Kahn. Halt die Diebe vom Stapel fern, bis er leer ist.') : TX('Unter den Fremden vom Fluss sind Diebe. Halt sie vom Stapel fern, bis der Kahn leer ist.'), 4000);
}
function kaiKisteWeg(d) { if (d.kisteO) { szene.remove(d.kisteO.sprite); d.kisteO = null; } d.kiste = false; }
function kaidiebeAblauf(dt) {
  const A = G.auftrag, w = flussWahl() || 'alle';
  A.zeit -= dt;
  // Diebe: tot mit Kiste = die Kiste liegt da; am Steg angekommen = die Kiste ist weg
  for (const d of A.diebe.slice()) {
    if (G.gegner.includes(d) && d.hp > 0) { if (d.kisteO) d.kisteO.sprite.position.set(d.x, 2.7, d.z); if (d.marke) d.marke.position.set(d.x, 0.03, d.z); continue; }
    if (d.kiste) {
      const o = figur(BILD.kisteKlein, 0.4); o.sprite.scale.multiplyScalar(1.3); stelle(o, d.x, d.z);
      const ring = bodenFlaeche(ringGeo, 0xe8c040, 0.8); ring.position.set(d.x, 0.03, d.z); ring.scale.setScalar(KAI.aufheben);
      A.liegt.push({ x: d.x, z: d.z, o, ring }); zahl(d.x, 2.2, d.z, TX('Kiste fallen gelassen!'), 'loot');
    }
    kaiKisteWeg(d); if (d.marke) szene.remove(d.marke); A.diebe.splice(A.diebe.indexOf(d), 1);
  }
  for (const k of A.liegt.slice()) if (P.hp > 0 && Math.hypot(P.x - k.x, P.z - k.z) < KAI.aufheben + 0.3) {
    szene.remove(k.o.sprite); if (k.o.shadow) szene.remove(k.o.shadow); szene.remove(k.ring); A.liegt.splice(A.liegt.indexOf(k), 1);
    A.kisten++; zahl(P.x, 2.4, P.z, TX('Zurück auf den Stapel!'), 'block'); geraeusch('teil');
  }
  zeige(A.stapel, BILD.kistenstapel[A.kisten > KAI.kisten * 2 / 3 ? 2 : A.kisten > KAI.kisten / 3 ? 1 : 0], 1); A.stapel.sprite.visible = A.kisten > 0;
  if (KAI.kisten - A.verloren < KAI.halten) { kaiAufraeumen(A); return verloren(TX('Zu viele Kisten sind weg')); }
  if (A.zeit <= 0) { kaiAufraeumen(A); return auftragGeschafft(TX('Der Kahn ist entladen')); }
  A.diebT -= dt;
  if (A.diebT <= 0 && A.diebe.length < KAI.hoechstens) {
    A.diebT = KAI.dieb[w] || KAI.dieb.alle;
    const [x, z] = SCHLEUSE_ZUGAENGE[Math.random() < 0.6 ? 1 : 0], d = gegnerErstellen('kistendieb', x + zz(-0.5, 0.5), z);
    d.marke = bodenFlaeche(ringGeo, 0xe8c040, 0.85); d.marke.scale.setScalar(0.75);   /* Diebe erkennt man am gelben Ring */
    A.diebe.push(d);
  }
  A.wacheT -= dt;
  if (A.wacheT <= 0 && G.gegner.filter(e => e.hp > 0 && e.typ !== 'kistendieb').length < KAI.wacheHoechstens) {
    A.wacheT = KAI.wache; const [x, z] = SCHLEUSE_ZUGAENGE[Math.floor(Math.random() * 2)];
    gegnerErstellen(Math.random() < 0.7 ? 'pluenderer' : 'schildtraeger', x, z);
  }
}
function kaiAufraeumen(A) { (A.diebe || []).forEach(d => { kaiKisteWeg(d); if (d.marke) d.marke.visible = false; }); if (A.ring) A.ring.visible = false; }
function kaidiebeHud() {
  const A = G.auftrag, n = A.diebe.filter(d => d.kiste).length;
  hudText('waveLabel', TX('Kistendiebe am Kai'));
  hudText('waveSub', n ? (n === 1 ? TX('Ein Dieb rennt mit einer Kiste zum Steg!') : TX`${n} Diebe rennen mit Kisten zum Steg!`) : TX`Noch ${Math.ceil(Math.max(0, A.zeit))} Sekunden bis der Kahn leer ist · ${KAI.kisten - A.verloren} von ${KAI.kisten} Kisten`);
  hudText('doorLabel', TX('Kisten'));
  document.getElementById('doorFill').style.width = ((KAI.kisten - A.verloren) / KAI.kisten * 100) + '%';
}
// Der Dieb rennt zum Stapel, greift eine Kiste und rennt zurück zum Steg. Er kämpft nicht.
Object.assign(EIGEN_KI, {
  kistendieb(e, dt) {
    const A = G.auftrag;
    if (!A || A.kisten == null) return false;
    const [tx, tz] = e.kiste ? KAI.steg : [A.sx, A.sz];
    e.blick = tx >= e.x ? 1 : -1;
    if (!e.kiste && A.kisten <= 0) { lvBewegen(e, KAI.steg[0], KAI.steg[1], dt); return true; }
    if (!e.kiste && Math.hypot(e.x - A.sx, e.z - A.sz) < KAI.nimm + 0.5) {
      A.kisten--; e.kiste = true; e.kisteO = figur(BILD.kisteKlein, 0);
      zahl(e.x, 2.4, e.z, TX('Geschnappt!'), 'hurt'); return true;
    }
    if (e.kiste && Math.hypot(e.x - KAI.steg[0], e.z - KAI.steg[1]) < 1.2) {
      kaiKisteWeg(e); if (e.marke) szene.remove(e.marke); A.verloren++; zahl(e.x, 2.4, e.z, TX('Kiste weg!'), 'hurt');
      const i = G.gegner.indexOf(e); if (i >= 0) { G.gegner.splice(i, 1); entfernen(e); infoWeg(e); }
      A.diebe.splice(A.diebe.indexOf(e), 1);
      return true;
    }
    lvBewegen(e, tx, tz, dt);
    return true;
  },
});
Object.assign(MISSIONEN, {
  kaidiebe: { ...MISSIONSTEXTE.kaidiebe, ort: 'schleuse', typ: 'kaidiebe', gefahr: 3,
    feld: { x: 21, zMin: -14.2, zMax: 12.6, flaechen: SCHLEUSE_FLAECHEN, zugaenge: SCHLEUSE_ZUGAENGE, freieDeko: true }, start: [-8, -4], aufbau: () => aufbauSchleuse(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      const A = G.auftrag, behalten = A ? KAI.kisten - A.verloren : KAI.halten;
      erg.gold += 30 + behalten * 4; erg.teile += Math.round(behalten / 2); erg.nahrung += behalten * 2;
      erg.material.bauteile = (erg.material.bauteile || 0) + 2;
      erg.lore = ['kai_diebe']; SPIEL.flussroute.diebe = 'erledigt'; clusterAendern('logistik', 6);
    } },
});

// =====================================================================
// DIE UNTERWELT VON ALTBRÜCK: der Kampf gegen den Waagmeister (5.6b)
//  - Erst der Hof hinter dem Haus „Zur Waage“: drei Wellen Schläger.
//  - Dann das Lager mit der großen Waage. Der Waagmeister rechnet mit
//    Zinsen (seit 0.3.38, vorher Leibwachen): Nur der erste Treffer nach
//    einer Atempause zählt, und dann mehrfach („Zahltag“). Wer zu schnell
//    schlägt, macht keinen Schaden, und er schreibt Zinsen an (heilt sich).
// Wer gewinnt, kontrolliert den Markt und kassiert Gebühren (markt.js).
// Werte in WAAGE (einstellungen.js).
// =====================================================================

let WAAGE_DEKO = null;
const WAAGE_HOF = [
  ['schlaeger', 'schlaeger', 'messerstecher'],
  ['schlaeger', 'messerstecher', 'messerstecher', 'armbruster'],
  ['schlaeger', 'schlaeger', 'armbruster', 'armbruster', 'messerstecher'],
];

function aufbauUnterwelt() {
  szene.background = new THREE.Color('#0a0a0e');
  const F = FELD;
  const boden = malBoden(52, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 1.1) * 0.3 + Math.cos(z * 0.9) * 0.3;
    if (Math.abs(x) > F.x + 0.8 + wob || z < F.zMin - 0.8 || z > F.zMax + 1 + wob) return 'mauer';
    return z < -3 + wob * 0.5 ? 'dielen' : 'hof';
  }, {
    dielen: ['#3a2a1e', '#443224', '#322418', '#4e3a2a'],
    hof:    ['#38343e', '#3e3a44', '#322e38', '#46424c'],
    mauer:  ['#1a1418', '#20181c', '#161014', '#28202a'],
  }, 141);
  const { g, toPx, r } = boden;
  for (let z = F.zMin - 1; z < -3; z += 0.5) { g.fillStyle = '#261a12'; g.fillRect(toPx(-F.x - 1), toPx(z), toPx(F.x + 1) - toPx(-F.x - 1), 1); }
  for (let z = -3; z < F.zMax + 1; z += 0.5) for (let x = -F.x - 1; x < F.x + 1; x += 0.5) { g.fillStyle = r() < 0.5 ? '#2c2832' : '#2a2630'; g.fillRect(toPx(x), toPx(z), 8, 1); }
  for (let k = 0; k < 8; k++) { const cx = toPx(-F.x + r() * F.x * 2), cy = toPx(-2 + r() * 10); for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.6 ? '#141820' : '#1c2230'; g.fillRect(cx + (r() * 12 - 6 | 0), cy + (r() * 5 - 2 | 0), 1, 1); } }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 700);
  bodenMesh(boden, 52);
  // Hinten das Lager: Ziegelwand, die große Waage, Kisten, ein Spieltisch
  for (let x = -F.x - 1; x <= F.x + 1; x += 1.9) decoBild(BILD.ziegelwand[Math.abs(Math.round(x)) % 3], x, F.zMin - 0.7, 0, 0);
  WAAGE_DEKO = decoBild(BILD.grosseWaage[1], 0, F.zMin + 1.8, 1.2, 0.9);
  [[-9, -9], [9, -9.5], [-11.5, -5], [11.5, -4.5], [-6.5, -11], [7, -11]].forEach(([x, z], i) => decoBild(i % 2 ? BILD.kisten[i % 2] : missionBau('faesser', i % 2), x, z, 0.9, 0.8));
  [[-5, -7], [5, -7.5], [-8, -3.6], [8.5, -3.4]].forEach(([x, z], i) => decoBild(i % 2 ? missionBau('faesser', 1) : BILD.kisten[i % 2], x, z, 0.9, 0.8));
  [[-12.5, -11], [12.5, -11], [-12.5, 0], [12.5, 0]].forEach(([x, z]) => animDeko(decoBild(BILD.industrielampe[0], x, z, 0.3, 0.3), BILD.industrielampe, 2));
  // Vorne der Hof mit Tonnen und einem Durchgang zur Gasse
  [[-10, 3], [10, 2.5], [-6, 6.5], [7, 7]].forEach(([x, z]) => decoBild(BILD.tonne, x, z, 0.4));
  for (let x = -F.x; x <= F.x; x += 1.1) if (Math.abs(x) > 2.4) decoBild(BILD.zaun, x, F.zMax + 0.6, 0, 0);
  [-20, -7, 8, 21].forEach((x, i) => decoBild(BILD.stadthaus[(i * 3 + 1) % BILD.stadthaus.length], x, F.zMax + 3.5, 0, 0.6));
  [-22, 22].forEach((x, i) => decoBild(BILD.hochhaus[i + 1], x, F.zMin - 5, 0, 0));
}

auftragstypAnmelden('unterwelt', { starten: unterweltStarten, ablauf: unterweltAblauf, hud: unterweltHud, stand: STAND_NICHTS });
function unterweltStarten() {
  const A = G.auftrag;
  A.phase = 'hof'; A.hofWelle = 0; A.rufT = WAAGE.rufAlle;
  hofWelle(0);
  meldung(TX('Der Hof hinter „Zur Waage“'), TX('Die Schläger des Waagmeisters versperren den Weg ins Lager. Wirf sie aus dem Hof.'), 3000);
}
function hofWelle(i) {
  WAAGE_HOF[i].forEach((t, k) => gegnerErstellen(t, (k % 2 ? 1 : -1) * (5 + k * 1.3), k % 3 === 0 ? FELD.zMax - 1 : -2 - k * 0.6));
}
function waagmeisterAuftritt() {
  const A = G.auftrag;
  A.phase = 'boss';
  const b = gegnerErstellen('waagmeister', 0, FELD.zMin + 5.5);
  b.zinsen = { bereitT: 0, schuld: 0 }; b.angriffT = 2.5; A.boss = b;
  meldung(TX('Der Waagmeister'), TX('„Bei mir wird alles angeschrieben.“ Nur der erste Schlag nach einer Atempause zählt, dann dreifach. Schlägst du zu schnell, schreibt er Zinsen an und heilt sich.'), 4200);
  wackeln(0.4); geraeusch('welle');
}
// Zinsen: Wird aus gegnerTreffen gerufen und gibt den Schaden zurück, der wirklich zählt
function zinsenTreffer(e, n, spieler) {
  const Z = e.zinsen, W = WAAGE;
  if (Z.bereitT <= 0) {
    Z.bereitT = W.zinsPause; Z.schuld = 0; e.wankt = 0.6;   // er taumelt kurz (Bild waagmeisterWankt)
    zahl(e.x, 5.2, e.z, TX('Zahltag!'), 'perfekt');
    partikel(e.x, 3, e.z, 0xffe060, 12, 4); wackeln(0.15);
    return n * W.zahltagMal;
  }
  if (!spieler) return n * W.fremdMal;
  Z.schuld++;
  e.hp = Math.min(e.maxHp, e.hp + e.maxHp * W.zinsHeil);
  zahl(e.x, 4.6, e.z, TX('+Zinsen'), 'block');
  if (Z.schuld === 3) meldung(TX('Angeschrieben'), TX('Zu schnell! Warte, bis es an ihm golden blitzt, dann schlag einmal richtig zu.'), 2000);
  return 0;
}

function unterweltAblauf() {
  const A = G.auftrag;
  if (A.phase === 'hof') {
    if (G.gegner.some(e => e.hp > 0)) return;
    A.hofWelle++;
    if (A.hofWelle < WAAGE.hofWellen) { hofWelle(A.hofWelle); meldung(TX('Mehr Schläger!'), TX`Welle ${A.hofWelle + 1} von ${WAAGE.hofWellen}`, 1600); return; }
    return waagmeisterAuftritt();
  }
  const b = A.boss;
  if (!b || b.hp <= 0 || !G.gegner.includes(b)) return auftragGeschafft(TX('Die Waage ist umgekippt'));
  // Die große Waage zeigt, wie es um ihn steht: gerade = Zahltag, schief = Schulden
  const neig = b.zinsen.bereitT <= 0 ? 1 : b.zinsen.schuld ? 2 : 0;
  if (WAAGE_DEKO && A.neig !== neig) { A.neig = neig; zeige(WAAGE_DEKO, BILD.grosseWaage[neig], 1); }
}

// Der Waagmeister: Zinsen-Takt, Gewichte werfen, Schläger rufen
EIGEN_KI.waage = function (e, dt) {
  const A = G.auftrag, W = WAAGE, Z = e.zinsen;
  e.bewegt = false;
  if (Z) {
    const vorher = Z.bereitT;
    Z.bereitT -= dt; if (e.wankt > 0) e.wankt -= dt;
    if (vorher > 0 && Z.bereitT <= 0) { partikel(e.x, 3.4, e.z, 0xffe060, 10, 3); geraeusch('klick'); }   // Zahltag: Jetzt zählt der nächste Schlag
    if (Z.bereitT <= 0 && Math.random() < dt * 8) partikel(e.x + zz(-0.6, 0.6), 3.2, e.z, 0xffe060, 1, 1);
  }
  // Verstärkung aus der Gasse
  A.rufT -= dt;
  if (A.rufT <= 0) {
    A.rufT = W.rufAlle;
    const da = G.gegner.filter(x => x.hp > 0 && ['schlaeger', 'messerstecher', 'armbruster'].includes(x.typ)).length;
    if (da < W.schlaegerMax) { ['schlaeger', Math.random() < 0.5 ? 'messerstecher' : 'armbruster'].forEach((t, i) => gegnerErstellen(t, (i ? 1 : -1) * (FELD.x - 1), FELD.zMax - 1)); zahl(e.x, 4.8, e.z, TX('Jungs!'), 'big'); }
  }
  if (e.aktion) return waagmeisterAktion(e, dt);
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (e.angriffT <= 0 && P.hp > 0) {
    e.angriffT = e.hp < e.maxHp * 0.5 ? 2.2 : 3;
    // Er wirft Gewichte dorthin, wo du stehst. Unter halber Kraft drei auf einmal.
    const ziele = [[P.x, P.z]];
    if (e.hp < e.maxHp * 0.5) ziele.push([P.x + zz(-3, 3), P.z + zz(-3, 3)], [P.x + zz(-3, 3), P.z + zz(-3, 3)]);
    e.aktion = { t: 1.1, dauer: 1.1, ziele };
    e.marke = ziele.map(([x, z]) => kesselMarke(x, z, W.gewichtRadius, 0xeab03a));
    zahl(e.x, 4.8, e.z, TX('Gewicht!'), 'big');
    e.warn.visible = true;
    return true;
  }
  if (d > 3.5) {
    const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
    e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
  }
  return true;
};
function waagmeisterAktion(e, dt) {
  const a = e.aktion;
  a.t -= dt;
  if (e.marke) e.marke.forEach(m => m.scheibe.scale.setScalar(m.r * (1 - Math.max(0, a.t) / a.dauer)));
  if (a.t > 0) return true;
  e.warn.visible = false;
  if (e.marke) e.marke.forEach(m => m.weg());
  e.marke = null; e.aktion = null;
  wackeln(0.3); geraeusch('explosion');
  for (const [x, z] of a.ziele) {
    for (let i = 0; i < 6; i++) rauchwolke(x + zz(-1, 1), z + zz(-1, 1), 0.8);
    for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - x, ziel.z - z) < WAAGE.gewichtRadius + (ziel.r || 0.4)) schadenAn(ziel, WAAGE.gewichtSchaden, x, z, e);
    perfektPruefen(x, z, WAAGE.gewichtRadius + 0.5);
  }
  return true;
}

function unterweltHud() {
  const A = G.auftrag;
  if (A.phase === 'hof') {
    const da = G.gegner.filter(e => e.hp > 0).length;
    hudText('waveLabel', TX`Der Hof · Welle ${A.hofWelle + 1} von ${WAAGE.hofWellen}`);
    hudText('waveSub', TX`Noch ${da} Schläger`);
    hudText('doorLabel', TX('Hof'));
    document.getElementById('doorFill').style.width = Math.round((A.hofWelle / WAAGE.hofWellen) * 100) + '%';
    return;
  }
  const b = A.boss, Z = b && b.zinsen, bereit = Z && Z.bereitT <= 0;
  hudText('waveLabel', TX('Der Waagmeister'));
  hudText('waveSub', bereit ? TX('Zahltag! Jetzt einmal zuschlagen!') : Z && Z.schuld ? TX`Angeschrieben: ${Z.schuld} Zinsen. Warte!` : TX('Warte auf den Zahltag.'));
  // Der Balken ist das Schuldbuch: voll = der nächste Schlag zählt dreifach
  hudText('doorLabel', TX('Schuldbuch'));
  document.getElementById('doorFill').style.width = (Z ? Math.round((1 - Math.max(0, Z.bereitT) / WAAGE.zinsPause) * 100) : 0) + '%';
}

Object.assign(MISSIONEN, {
  waage: { ...MISSIONSTEXTE.waage, ort: 'markt', typ: 'unterwelt', gefahr: 4,   // Boss der Unterwelt: härter als der Markt selbst
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauUnterwelt(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      const M = marktDaten();
      erg.gold += MARKT.boss.belohnungGold;
      erg.lore = ['schuldbuch'];
      M.kontrolle = true; M.gebuehr = M.gebuehr || 'mittel';
      marktAnsehen(MARKT.boss.ansehenSieg);
    } },
});

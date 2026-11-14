// =====================================================================
// DIE GESCHICHTE DES VERBUNDS WARTUNG (Verbund-Geschichten, Punkt B; Inhaber, 08.11.2026)
//  Drei Aufträge, dann die Dreier-Wahl:
//   1. Die Wartungshalle (gibt es schon, Anfrage des Verbunds). Danach meldet sich W-1, die Oberwartung,
//      und das Ersatzteillager erscheint auf der Weltkarte.
//   2. Instandsetzung im Ersatzteillager: drei Schaltschränke reparieren, während Rostkäfer an ihnen nagen.
//   3. Die Oberwartung: W-1 hält sich mit drei Reparaturstationen am Leben. Stationen zerstören, Wartungsroboter
//      flicken sie wieder; W-1 schweißt (Linie) und nietet (Einschläge).
//   Danach (nach der Rückkehr, wie an der Schleuse): neu programmieren (mit den Maschinen), Bauplan „unser Dorf“
//   (nur für euch) oder abschalten (Rostbrecher). Ohne bekannte Rostbrecher ist Abschalten sichtbar, aber gesperrt.
// Die Lore: W-1 hält alles „nach Bauplan 1.0“ instand. Alles, was Menschen seitdem gebaut haben, ist für W-1
// eine Abweichung, auch euer Dorf. Die Rostkäfer sind Wartungseinheiten, die die Prüfung nicht bestanden haben.
// =====================================================================

function wartungG() { return SPIEL.wartungG || (SPIEL.wartungG = { schritt: 0, wahl: null }); }
// Schritt 1 ist geschafft, sobald die Wartungshalle gewonnen ist (Lore „halle“)
function wartungStillAbschluss(bericht) {
  const W = wartungG(), Z = WARTUNGWAHL.aus;
  W.wahl = 'aus'; SPIEL.altmetall = (SPIEL.altmetall || 0) + Z.altmetall;
  if (!hatLore('w_aus')) SPIEL.chronik.push('w_aus');
  if (bericht) bericht.push(TX`Seit der Verbund Wartung stillgelegt ist, schweigt auch W-1. Die Rostbrecher haben sie zerlegt: ${Z.altmetall} Altmetall.`);
}
function wartungTag(bericht) {
  const W = wartungG();
  if (W.schritt >= 1 && !W.wahl && verbundStill('wartung')) return wartungStillAbschluss(bericht);
  if (W.schritt === 0 && hatLore('halle')) {
    W.schritt = 1;
    if (!SPIEL.karte.bekannt.includes('ersatzteillager')) SPIEL.karte.bekannt.push('ersatzteillager');
    if (!hatLore('w_ruf')) SPIEL.chronik.push('w_ruf');
    bericht.push(TX('Ein Wartungsroboter steht am Tor und spielt eine Nachricht ab: „AN DIE EINHEIT, DIE HALLE 2 INSTAND GESETZT HAT. BITTE MELDEN SIE SICH IM ERSATZTEILLAGER.“ Neu auf der Weltkarte: Das Ersatzteillager.'));
  }
}

// ---------------------------------------------------------------------
// Auftrag 2: Instandsetzung. Die Karte ist der Knoten des Verbunds (aufbauSabotage mit REISE.verbund = 'wartung').
// ---------------------------------------------------------------------
const INSTAND = { zeit: 7, reichweite: 1.7, nagen: 0.06, nachschub: 6, hoechstens: 7 };
auftragstypAnmelden('instand', { starten: instandStarten, ablauf: instandAblauf, hud: instandHud, stand: STAND_NICHTS });
function instandStarten() {
  const A = G.auftrag;
  A.schraenke = SABOTAGE_SCHRAENKE.map(([x, z]) => {
    const o = decoBild(BILD.schaltschrank[0], x, z, 0.7, 0.6);
    const ring = bodenFlaeche(ringGeo, 0x7ad37a, 0.6); ring.position.set(x, 0.03, z + 1); ring.scale.setScalar(INSTAND.reichweite);
    return { x, z, o, ring, fortschritt: 0.15, fertig: false, anzeigeT: 0, nagT: 0 };
  });
  A.nachT = 3;
  [[-6, -2], [6, -3], [0, 2]].forEach(([x, z]) => gegnerErstellen('nagekaefer', x, z));
  meldung(TX('Das Ersatzteillager'), TX('Stell dich an die drei Schaltschränke, um sie instand zu setzen. Rostkäfer nagen an ihnen: Halte sie fern.'), 3600);
}
function instandAblauf(dt) {
  const A = G.auftrag, I = INSTAND;
  for (const s of A.schraenke) {
    if (s.fertig) continue;
    const nah = P.hp > 0 && Math.hypot(P.x - s.x, P.z - (s.z + 1)) < I.reichweite;
    const nager = G.gegner.filter(e => e.typ === 'nagekaefer' && e.hp > 0 && Math.hypot(e.x - s.x, e.z - (s.z + 1)) < 1.4).length;
    s.fortschritt = Math.max(0, Math.min(1, s.fortschritt + (nah ? dt / I.zeit : 0) - nager * I.nagen * dt));
    s.anzeigeT -= dt;
    if (s.anzeigeT <= 0 && (nah || nager)) { s.anzeigeT = 0.7; zahl(s.x, 2.4, s.z, nager && !nah ? TX('Käfer nagen!') : TX`Instand ${Math.round(s.fortschritt * 100)} %`, 'block'); }
    if (s.fortschritt >= 1) { s.fertig = true; szene.remove(s.ring); zeige(s.o, BILD.schaltschrank[1], 1); zahl(s.x, 2.6, s.z, TX('Läuft wieder!'), 'big'); geraeusch('bauen'); }
  }
  A.nachT -= dt;
  if (A.nachT <= 0 && G.gegner.filter(e => e.hp > 0).length < I.hoechstens) {
    A.nachT = I.nachschub;
    for (let i = 0; i < 2; i++) gegnerErstellen(i ? 'nagekaefer' : 'kaefer', zz(-FELD.x + 2, FELD.x - 2), FELD.zMin + 1.5);
  }
  if (A.schraenke.every(s => s.fertig)) auftragGeschafft(TX('Das Lager läuft wieder'));
}
function instandHud() {
  const A = G.auftrag, n = A.schraenke.filter(s => s.fertig).length, summe = A.schraenke.reduce((a, s) => a + s.fortschritt, 0);
  hudText('waveLabel', TX('Das Ersatzteillager'));
  hudText('waveSub', TX`${n} von ${A.schraenke.length} Schaltschränken instand gesetzt`);
  hudText('doorLabel', TX('Instandsetzung'));
  document.getElementById('doorFill').style.width = (summe / A.schraenke.length * 100) + '%';
}
// Rostkäfer, die lieber Metall fressen: Sie laufen zum nächsten Schaltschrank, der noch nicht läuft, und nagen.
// Kommt der Held nah, greifen sie ihn an wie jeder Käfer.
Object.assign(EIGEN_KI, {
  nager(e, dt) {
    const A = G.auftrag;
    if (!A || !A.schraenke || abstand(e, P) < 3.2) return false;
    const ziel = A.schraenke.filter(s => !s.fertig).sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
    if (!ziel) return false;
    const tx = ziel.x + (e.x < ziel.x ? -0.6 : 0.6), tz = ziel.z + 1;
    if (Math.hypot(tx - e.x, tz - e.z) < 0.5) { e.bewegt = false; if (Math.random() < dt * 4) partikel(ziel.x, 1, ziel.z + 0.6, 0xc0612c, 1, 1.5); return true; }
    const [wx, wz] = wegRichtung(e, tx, tz, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
    e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
    return true;
  },
});

// ---------------------------------------------------------------------
// Auftrag 3: Die Oberwartung (W-1). Drei Reparaturstationen halten sie heil und gepanzert. Wartungsroboter
// laufen zu zerstörten Stationen und flicken sie. W-1 schweißt (eine Linie vor ihr) und nietet (drei Einschläge).
// ---------------------------------------------------------------------
const OBERWARTUNG = { heilung: 0.018, panzer: 0.35, flicken: 7, bots: 9, schweiss: 20, schweissLang: 7, nieten: 13, nietR: 1.4 };
auftragstypAnmelden('oberwartung', { starten: oberwartungStarten, ablauf: oberwartungAblauf, hud: oberwartungHud, stand: STAND_NICHTS });
function oberwartungStarten() {
  const A = G.auftrag;
  A.stationen = SABOTAGE_SCHRAENKE.map(([x, z]) => { const s = gegnerErstellen('reparaturstation', x, z); stelle(s, x, z); s.station = true; return s; });
  A.strahlen = A.stationen.map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.2), new THREE.MeshBasicMaterial({ color: 0x9af09a, transparent: true, opacity: 0.9, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.05;   /* hell genug für den dunklen Boden */ szene.add(m); return m; });
  const b = gegnerErstellen('oberwartung', 0, FELD.zMin + 4.5); b.angriffT = 2.5; A.boss = b;
  A.botT = 5; A.wrack = [];
  meldung(TX('Die Oberwartung'), TX('W-1 hält sich mit drei Reparaturstationen am Leben. Zerstöre sie, dann ist sie verwundbar. Ihre Wartungsroboter flicken die Stationen wieder.'), 4000);
}
function oberwartungStationen() { const A = G.auftrag; return A.stationen.filter(s => s.hp > 0 && G.gegner.includes(s)); }
objektFolgeAnmelden('reparaturstation', stationZerstoert);
// Aus objektZerstoert: Die Station bleibt als Wrack liegen, bis ein Wartungsroboter sie flickt
function stationZerstoert(e) {
  const A = G.auftrag; if (!A || !A.stationen) return;
  const w = { x: e.x, z: e.z, o: figur(BILD.schaltkastenKaputt, 0), flick: 0 }; stelle(w.o, e.x, e.z); A.wrack.push(w);
  partikel(e.x, 1, e.z, 0x7ad37a, 12, 4); wackeln(0.3); geraeusch('explosion');
  zahl(e.x, 2.6, e.z, TX('Station aus!'), 'big');
}
function oberwartungAblauf(dt) {
  const A = G.auftrag, B = A.boss, O = OBERWARTUNG;
  if (!B || B.hp <= 0 || !G.gegner.includes(B)) { A.strahlen.forEach(m => szene.remove(m)); return auftragGeschafft(TX('W-1 steht still')); }
  const aktiv = oberwartungStationen();
  // Strahlen von den Stationen zu W-1; solange einer steht, heilt und panzert sie
  A.stationen.forEach((s, i) => {
    const m = A.strahlen[i], an = aktiv.includes(s);
    m.visible = an; if (!an) return;
    const dx = B.x - s.x, dz = B.z - s.z, d = Math.hypot(dx, dz);
    m.position.set((B.x + s.x) / 2, 0.05, (B.z + s.z) / 2); m.scale.set(d, 1 + Math.sin(G.zeit * 9 + i) * 0.4, 1); m.rotation.z = -Math.atan2(dz, dx);
  });
  B.panzer = aktiv.length ? O.panzer : undefined;
  if (aktiv.length) B.hp = Math.min(B.maxHp, B.hp + B.maxHp * O.heilung * aktiv.length / 3 * dt);
  // Wartungsroboter flicken Wracks: Steht einer lange genug daneben, läuft die Station wieder
  for (const w of A.wrack.slice()) {
    const bot = G.gegner.find(e => e.typ === 'wartungsbot' && e.hp > 0 && Math.hypot(e.x - w.x, e.z - w.z) < 1.6);
    if (bot) { w.flick += dt; if (Math.random() < dt * 3) partikel(w.x, 1.2, w.z, 0xffd060, 1, 2); }
    if (w.flick >= O.flicken) {
      szene.remove(w.o); A.wrack.splice(A.wrack.indexOf(w), 1);
      const i = A.stationen.findIndex(s => Math.hypot(s.x - w.x, s.z - w.z) < 0.5);
      const s = gegnerErstellen('reparaturstation', w.x, w.z); stelle(s, w.x, w.z); s.station = true; A.stationen[i] = s;
      zahl(w.x, 2.6, w.z, TX('Station geflickt!'), 'big');
    }
  }
  // Nachschub: Wartungsroboter, die zu den Wracks laufen
  A.botT -= dt;
  if (A.botT <= 0 && A.wrack.length && G.gegner.filter(e => e.typ === 'wartungsbot' && e.hp > 0).length < 2) {
    A.botT = O.bots;
    const w = A.wrack[Math.floor(Math.random() * A.wrack.length)], b = gegnerErstellen('wartungsbot', zz(-FELD.x + 2, FELD.x - 2), FELD.zMin + 1.5); b.flickZiel = w;
  }
}
function oberwartungHud() {
  const A = G.auftrag, B = A.boss, n = oberwartungStationen().length;
  hudText('waveLabel', TX('Die Oberwartung'));
  hudText('waveSub', n ? (n === 1 ? TX('1 Reparaturstation hält sie heil') : TX`${n} Reparaturstationen halten sie heil`) : TX('Keine Station mehr: zuschlagen!'));
  hudText('doorLabel', TX('W-1'));
  document.getElementById('doorFill').style.width = (B ? Math.max(0, B.hp) / B.maxHp * 100 : 0) + '%';
}
Object.assign(EIGEN_KI, {
  // W-1 bleibt nah am Terminal und arbeitet wie in der Werkstatt: schweißen oder nieten
  oberwartung(e, dt) {
    if (e.aktion) return oberwartungAktion(e, dt);
    e.angriffT -= dt;
    const d = abstand(e, P);
    if (e.angriffT <= 0 && P.hp > 0) { e.angriffT = oberwartungStationen().length ? 3.2 : 2.4; oberwartungStart(e, d < 7 ? 'schweissen' : 'nieten'); return true; }
    const hz = FELD.zMin + 4.5;   // sie entfernt sich nicht weit von ihren Stationen
    const tx = Math.max(-8, Math.min(8, P.x)), tz = Math.max(hz - 1, Math.min(hz + 5, P.z));
    if (Math.hypot(tx - e.x, tz - e.z) > 0.8) { const [wx, wz] = wegRichtung(e, tx, tz, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e); e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1; }
    else e.bewegt = false;
    return true;
  },
});
// Wartungsroboter mit einem Wrack als Ziel laufen dorthin, statt anzugreifen; sonst wie bisher (kraftwerk.js)
const WARTUNG_KI_ALT = EIGEN_KI.wartung;
EIGEN_KI.wartung = function (e, dt) {
    const w = e.flickZiel; if (!w || !G.auftrag || !G.auftrag.wrack || !G.auftrag.wrack.includes(w)) return WARTUNG_KI_ALT(e, dt);
    if (Math.hypot(w.x - e.x, w.z - e.z) < 1.2) { e.bewegt = false; return true; }
    const [wx, wz] = wegRichtung(e, w.x, w.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
    e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
    return true;
};
function oberwartungStart(e, art) {
  const O = OBERWARTUNG;
  if (art === 'schweissen') {
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1, punkte = [];
    for (let k = 1; k <= 5; k++) { const x = e.x + dx / d * k * O.schweissLang / 5, z = e.z + dz / d * k * O.schweissLang / 5; punkte.push({ x, z, m: kesselMarke(x, z, 0.9, 0xffa030) }); }
    e.aktion = { art, t: 1.1, ziele: punkte }; e.blick = dx >= 0 ? 1 : -1;
    zahl(e.x, 3.6, e.z, TX('Schweißen!'), 'big');
  } else {
    const ziele = [];
    for (let i = 0; i < 3; i++) { const x = P.x + (i ? zz(-2.5, 2.5) : 0), z = P.z + (i ? zz(-2.5, 2.5) : 0); ziele.push({ x, z, m: kesselMarke(x, z, O.nietR, 0xa7b6cf) }); }
    e.aktion = { art, t: 1.3, ziele };
    zahl(e.x, 3.6, e.z, TX('Nieten!'), 'big');
  }
  e.aktion.dauer = e.aktion.t; e.warn.visible = true;
}
function oberwartungAktion(e, dt) {
  const a = e.aktion, O = OBERWARTUNG;
  a.t -= dt;
  const k = 1 - Math.max(0, a.t) / a.dauer;
  a.ziele.forEach(z => z.m.scheibe.scale.setScalar(z.m.r * k));
  if (a.t > 0) return true;
  e.warn.visible = false;
  const n = a.art === 'schweissen' ? O.schweiss : O.nieten, r = a.art === 'schweissen' ? 0.9 : O.nietR;
  const getroffen = new Set();
  a.ziele.forEach(z => {
    z.m.weg(); partikel(z.x, 0.6, z.z, a.art === 'schweissen' ? 0xffa030 : 0xa7b6cf, 8, 4);
    for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (!getroffen.has(ziel) && ziel.hp > 0 && Math.hypot(ziel.x - z.x, ziel.z - z.z) < r + (ziel.r || 0.4)) { getroffen.add(ziel); schadenAn(ziel, n, z.x, z.z, e); }
  });
  wackeln(0.25); geraeusch('explosion');
  e.aktion = null;
  return true;
}
gegnerBildAnmelden('oberwartung', oberwartungBild);
function oberwartungBild(e, b) {
  if (e.aktion) return e.aktion.art === 'schweissen' ? BILD.w1Schweissen : BILD.w1Nieten;
  return e.bewegt ? b : BILD.w1Ruhe[Math.floor(G.zeit * 2) % 2];
}

// ---------------------------------------------------------------------
// Die Wahl nach der Oberwartung
//  alle: neu programmieren (Anselm): „Instand halten, was die Menschen bauen.“ Wartung im Bund, die Roboter helfen
//        auch Birkenhain. Pakt +2, Hirte +1.
//  uns:  Bauplan „unser Dorf“ (Bodo): Die Roboter halten nur euer Dorf instand. Ausbauten dauerhaft 10 % günstiger,
//        Birkenhain verärgert. Krone +2.
//  aus:  abschalten (Hanne): Der Verbund ist zerschlagen, W-1 wird zu Altmetall. Stille +2.
// ---------------------------------------------------------------------
const WARTUNGWAHL = { alle: { wartung: 85, birkenhain: 1 }, uns: { wartung: 60, birkenhain: -1, ausbauMal: 0.9 }, aus: { altmetall: 40, schrott: 2 } };
function wartungWahl() { return SPIEL.wartungG && SPIEL.wartungG.wahl || null; }
function wartungWahlPruefen(weiter) {
  const W = wartungG();
  if (W.schritt < 3 || W.wahl) return weiter();
  const fremd = !rostbrecherBekannt(), still = verbundStill('wartung'), rep = figurDa('anselm') ? 'anselm' : 'ebert';
  if (still) { wartungStillAbschluss(null); return weiter(); }   // stillgelegt: Es gibt nichts mehr zu entscheiden
  entscheidung(TX('W-1 wartet'), TX('Das Ersatzteillager'), [
    ['ebert', TX('W-1 liegt im Ersatzteillager, die Linse blinkt noch. Auf ihrer Anzeige steht: „BAUPLAN 1.0. ABWEICHUNG: DORF. BITTE NEUEN BAUPLAN EINGEBEN.“ Sie wartet auf uns.')],
    [rep, TX('Gebt ihr einen neuen Auftrag: Instand halten, was die Menschen bauen. Dann flickt sie unsere Dächer und die von Birkenhain gleich mit. Sie wollte nie etwas anderes als helfen.')],
    ['bodo', TX('Bauplan: unser Dorf. Nur unser Dorf. Wer Roboter will, die ihm die Dächer flicken, soll sich seine eigenen besiegen.')],
    ...(fremd ? [] : [['hanne', TX('Abschalten. Sie hätte euer Dorf eines Tages abgerissen, weil es nicht im Bauplan stand. Wer so etwas einmal denkt, denkt es wieder.')]]),
  ], [
    [TX('Neu programmieren: Instand halten, was Menschen bauen'), () => wartungWaehlen('alle')],
    [TX('Bauplan „unser Dorf“: nur für euch'), () => wartungWaehlen('uns')],
    fremd ? [TX('Abschalten · Dafür fehlt euch noch jemand, der sich das traut. Auf dem Markt hängen manchmal Flugblätter.'), () => wartungWaehlen('aus'), true] : [TX('Abschalten: W-1 wird zu Altmetall'), () => wartungWaehlen('aus')],
  ], weiter);
}
function wartungWaehlen(w) {
  const W = wartungG(), Z = WARTUNGWAHL[w];
  W.wahl = w;
  if (w === 'alle' || w === 'uns') { SPIEL.cluster.wartung = Math.max(cluster('wartung'), Z.wartung); SPIEL.beziehungen.birkenhain = Math.max(-3, Math.min(3, (SPIEL.beziehungen.birkenhain || 0) + Z.birkenhain)); }
  else { verbundStilllegen('wartung'); SPIEL.altmetall = (SPIEL.altmetall || 0) + Z.altmetall; SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + Z.schrott; }
  const lore = 'w_' + w; if (!hatLore(lore)) SPIEL.chronik.push(lore);
  return w === 'alle' ? [
    ['erzaehler', TX('Ihr tippt den neuen Auftrag ein. Die Linse von W-1 wird grün. „BAUPLAN 2.0 ÜBERNOMMEN: INSTAND HALTEN, WAS DIE MENSCHEN BAUEN. ERSTE MASSNAHME: DACH DES ALTEN EBERT.“')],
    ['ebert', TX('Mein Dach tropft seit vier Jahren. Woher weiß sie das?')],
  ] : w === 'uns' ? [
    ['erzaehler', TX('„BAUPLAN ÜBERNOMMEN: DORF. ANDERE ORTE: KEINE WARTUNG.“ Am nächsten Morgen streichen zwanzig Roboter euren Zaun. In Birkenhain regnet es durch die Dächer.')],
    ['bodo', TX('Ordnung muss sein. Und wer Ordnung will, muss Prioritäten setzen.')],
  ] : [
    ['erzaehler', TX('Hanne zieht W-1 die Leitungen, eine nach der anderen. Die Linse wird dunkel. Im Lager werden die Wartungsroboter still, mitten im Schritt.')],
    ['hanne', TX('Jetzt flickt ihr eure Dächer selbst. Glaubt mir, sie halten dann auch besser.')],
  ];
}

// Die Knoten-Karte, dazu Regale an den Seiten: Es ist ein Ersatzteillager
function aufbauErsatzteillager() {
  REISE.verbund = 'wartung'; aufbauSabotage();
  /* Teileregale mit Lücken und Kisten dazwischen, damit es keine geschlossene Wand wird */
  for (const x of [-15.4, 15.4]) for (let z = -10, i = 0; z <= 7; z += 2.6, i++) decoBild(i % 3 === 2 ? BILD.kisten[i % 2] : BILD.teileregal[(i + (x > 0 ? 1 : 0)) % 3], x, z, 0, 0.4);
}
// ---------------------------------------------------------------------
// Missionen und Ort
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  instandsetzung: { ...MISSIONSTEXTE.instandsetzung, ort: 'ersatzteillager', typ: 'instand', gefahr: 3,
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauErsatzteillager(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => { const erst = wartungG().schritt < 2 && !wartungWahl(); erg.gold += erst ? 40 : 20; erg.teile += erst ? 8 : 4; if (erst) { erg.material.bauteile = (erg.material.bauteile || 0) + 1; erg.lore = ['w_kaefer']; wartungG().schritt = 2; } clusterAendern('wartung', erst ? 8 : 3); } },
  oberwartung: { ...MISSIONSTEXTE.oberwartung, ort: 'ersatzteillager', typ: 'oberwartung', gefahr: 4,
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauErsatzteillager(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 80; erg.teile += 16; erg.material.bauteile = (erg.material.bauteile || 0) + 2; erg.lore = ['w_bauplan']; if (wartungG().schritt < 3) wartungG().schritt = 3; } },
});

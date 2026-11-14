// =====================================================================
// DIE GESCHICHTE DES VERBUNDS ENERGIE (Verbund-Geschichten, Punkt B; Inhaber, 08.11.2026:
// jeder Verbund bekommt eine eigene Geschichte, wie tief, richtet sich nach seiner Wichtigkeit. Energie ist der wichtigste.)
//  1. Das Kraftwerk (gibt es schon). Drei Tage, nachdem es läuft, brennen nachts in der toten Stadt die Laternen:
//     Der Lastverteiler schickt fast allen Strom dorthin, nach einem Lastplan von vor dreihundert Jahren.
//     Das Umspannwerk erscheint auf der Weltkarte.
//  2. Kurzschluss: Funkenkäfer nisten im Umspannwerk. Drei Nester zerstören, während die Leitungen am Boden überschlagen.
//  3. Der Lastverteiler: Er hängt an einem von drei Trafos und springt über die Leitungen. Wer die Sicherungen beider
//     Leitungen an seinem Trafo auslöst, schneidet ihn ab: Überlast, keine Panzerung.
//  Danach (nach der Rückkehr): neuer Lastplan für alle Dörfer (Anselm), alles Licht für euer Dorf (Bodo)
//  oder abschalten und von Hand (Hanne). Ohne bekannte Rostbrecher ist Abschalten sichtbar, aber gesperrt.
// Die Lore: Der Lastverteiler versorgt Häuser, nicht Menschen. Im Lastplan steht die Stadt mit 40 000 Einwohnern,
// euer Dorf steht nicht darin. Er zählt nur, was verbraucht wird, und so zählt er auch euch.
// =====================================================================

const ENERGIE_RUF_TAGE = 3;
function energieG() { return SPIEL.energieG || (SPIEL.energieG = { schritt: 0, wahl: null }); }
function energieWahl() { return SPIEL.energieG && SPIEL.energieG.wahl || null; }
function energieStillAbschluss(bericht) {
  const E = energieG(), Z = ENERGIEWAHL.aus;
  E.wahl = 'aus'; SPIEL.altmetall = (SPIEL.altmetall || 0) + Z.altmetall;
  if (!hatLore('e_aus')) SPIEL.chronik.push('e_aus');
  if (bericht) bericht.push(TX`Seit der Verbund Energie stillgelegt ist, schweigt auch der Lastverteiler. Die Rostbrecher haben seine Leitungen gekappt: ${Z.altmetall} Altmetall.`);
}
function energieTag(bericht) {
  const E = energieG();
  if (E.schritt >= 1 && !E.wahl && verbundStill('energie')) return energieStillAbschluss(bericht);
  if (E.schritt !== 0 || !stromFrei() || verbundStill('energie')) return;   /* stillgelegt: Die Leitungen sind gekappt, keine Laternen */
  if (E.seit == null) E.seit = SPIEL.tag;
  if (SPIEL.tag - E.seit < ENERGIE_RUF_TAGE) return;
  E.schritt = 1;
  if (!SPIEL.karte.bekannt.includes('umspannwerk')) SPIEL.karte.bekannt.push('umspannwerk');
  if (!hatLore('e_ruf')) SPIEL.chronik.push('e_ruf');
  bericht.push(TX('Heute Nacht brennen in der toten Stadt die Laternen, alle, Straße für Straße. Mara hat nachgerechnet: Von eurem Strom kommt bei euch kaum ein Zehntel an. Der Rest geht in die Stadt, über ein Umspannwerk im Osten. Neu auf der Weltkarte: Das Umspannwerk.'));
}
// Zusätzlicher Strom-Rabatt nach der Wahl (kraftwerk.js, stromKosten)
function energieWahlRabatt() {
  const w = energieWahl(); if (!w || w === 'aus' || verbundStill('energie')) return 0;
  return ENERGIEWAHL[w].strom;
}

// ---------------------------------------------------------------------
// Die Karte: der Knoten des Verbunds (aufbauSabotage mit REISE.verbund = 'energie'), dazu drei Trafos
// und die Leitungen zwischen ihnen. Die Leitungen schlagen über: erst blinken sie gelb, dann trifft es jeden, der darauf steht.
// ---------------------------------------------------------------------
const UW_TRAFOS = [[-8, -6.5], [8, -6.5], [0, 0]];
const UW_LEITUNGEN = [[0, 1], [1, 2], [2, 0]];
const UW_SICHERUNGEN = [[0, -8.7], [5.8, -2.3], [-5.8, -2.3]];   // je eine pro Leitung, gleiche Reihenfolge
const UW_NESTER = [[-6.5, 3], [6.5, 3], [0, -9.6]];
// Wo der Lastverteiler an seinem Trafo steht: seitlich daneben, zur Mitte hin, sonst verdeckt sein Mast den Trafo (Grafik-Prüfer)
const UW_STAND = [[2.6, 1.5], [-2.6, 1.5], [2.8, 1.5]];
function uwStand(i) { return [UW_TRAFOS[i][0] + UW_STAND[i][0], UW_TRAFOS[i][1] + UW_STAND[i][1]]; }
const UW = { warnZeit: 1.3, schlagZeit: 0.45, schlag: 14, breite: 0.6 };
function aufbauUmspannwerk() {
  REISE.verbund = 'energie'; aufbauSabotage();
  UW_TRAFOS.forEach(([x, z], i) => animDeko(decoBild(BILD.trafo[i % 2], x, z, 1.1, 0.8), BILD.trafo, 1.5 + i * 0.3));
}
function uwLeitungenBauen() {
  return UW_LEITUNGEN.map(([a, b]) => {
    const [ax, az] = UW_TRAFOS[a], [bx, bz] = UW_TRAFOS[b];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.3), new THREE.MeshBasicMaterial({ color: 0x5a9ad8, transparent: true, opacity: 0.8, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set((ax + bx) / 2, 0.04, (az + bz) / 2); m.scale.set(Math.hypot(bx - ax, bz - az), 1, 1); m.rotation.z = -Math.atan2(bz - az, bx - ax);
    szene.add(m);
    return { a, b, ax, az, bx, bz, m, tot: 0, warn: 0, schlag: 0 };
  });
}
function uwAufraeumen(A) { (A.leitungen || []).forEach(l => szene.remove(l.m)); if (A.trafoRing) szene.remove(A.trafoRing); }
function uwPunkt(l, x, z) {
  const dx = l.bx - l.ax, dz = l.bz - l.az, t = Math.max(0, Math.min(1, ((x - l.ax) * dx + (z - l.az) * dz) / (dx * dx + dz * dz)));
  return [l.ax + dx * t, l.az + dz * t];
}
function uwSchlag(l) {
  for (let k = 0; k <= 6; k++) partikel(l.ax + (l.bx - l.ax) * k / 6, 0.4, l.az + (l.bz - l.az) * k / 6, 0x8ad0ff, 3, 3);
  geraeusch('strom');
  for (const ziel of [P, ...G.verbuendete]) {
    if (ziel.hp <= 0) continue;
    const [px, pz] = uwPunkt(l, ziel.x, ziel.z);
    if (Math.hypot(ziel.x - px, ziel.z - pz) < UW.breite + (ziel.r || 0.4)) schadenAn(ziel, UW.schlag, px, pz);
  }
}
function uwLeitungenAblauf(A, dt) {
  for (const l of A.leitungen) {
    if (l.tot > 0) l.tot -= dt;
    if (l.warn > 0) { l.warn -= dt; if (l.warn <= 0 && l.tot <= 0) { l.schlag = UW.schlagZeit; uwSchlag(l); } }
    if (l.schlag > 0) l.schlag -= dt;
    const mat = l.m.material;
    if (l.tot > 0) { mat.color.setHex(0x30303a); mat.opacity = 0.45; l.m.scale.y = 1; }
    else if (l.schlag > 0) { mat.color.setHex(0xeaf6ff); mat.opacity = 1; l.m.scale.y = 3.2 + Math.random(); }
    else if (l.warn > 0) { mat.color.setHex(Math.floor(G.zeit * 10) % 2 ? 0xffe060 : 0x8ad0ff); mat.opacity = 0.95; l.m.scale.y = 2.4; }
    else { mat.color.setHex(0x5a9ad8); mat.opacity = 0.8; l.m.scale.y = 1; }
  }
}

// ---------------------------------------------------------------------
// Auftrag 2: Kurzschluss. Drei Funkennester, aus denen Funkenkäfer schlüpfen. Ab und zu schlägt eine Leitung über.
// ---------------------------------------------------------------------
const KURZ = { nachschub: 7, hoechstens: 6, pause: [4.5, 7.5] };
auftragstypAnmelden('kurzschluss', { starten: kurzschlussStarten, ablauf: kurzschlussAblauf, hud: kurzschlussHud, stand: STAND_NICHTS });
function kurzschlussStarten() {
  const A = G.auftrag;
  A.leitungen = uwLeitungenBauen(); A.schlagT = 4; A.nachT = 3;
  A.nester = UW_NESTER.map(([x, z]) => { const n = gegnerErstellen('funkennest', x, z); stelle(n, x, z); return n; });
  [[-4, -2], [4, -3]].forEach(([x, z]) => gegnerErstellen('funkenkaefer', x, z));
  meldung(TX('Das Umspannwerk'), TX('Zerstöre die drei Funkennester. Blinkt eine Leitung gelb, geh herunter: Gleich schlägt sie über.'), 3800);
}
function kurzschlussAblauf(dt) {
  const A = G.auftrag;
  uwLeitungenAblauf(A, dt);
  A.schlagT -= dt;
  if (A.schlagT <= 0) {
    A.schlagT = zz(KURZ.pause[0], KURZ.pause[1]);
    const frei = A.leitungen.filter(l => l.warn <= 0 && l.schlag <= 0);
    if (frei.length) frei[Math.floor(Math.random() * frei.length)].warn = UW.warnZeit;
  }
  const nester = A.nester.filter(n => n.hp > 0 && G.gegner.includes(n));
  if (!nester.length) { uwAufraeumen(A); return auftragGeschafft(TX('Die Leitungen sind frei')); }
  A.nachT -= dt;
  if (A.nachT <= 0 && G.gegner.filter(e => e.hp > 0 && !e.def.objekt).length < KURZ.hoechstens) {
    A.nachT = KURZ.nachschub;
    const n = nester[Math.floor(Math.random() * nester.length)], k = gegnerErstellen('funkenkaefer', n.x + zz(-1, 1), n.z + 1.3);
    partikel(k.x, 0.6, k.z, 0x8ad0ff, 6, 2);
  }
}
function kurzschlussHud() {
  const A = G.auftrag, nester = A.nester.filter(n => n.hp > 0 && G.gegner.includes(n));
  hudText('waveLabel', TX('Das Umspannwerk'));
  hudText('waveSub', TX`${A.nester.length - nester.length} von ${A.nester.length} Funkennestern zerstört`);
  hudText('doorLabel', TX('Funkennester'));
  const hp = nester.reduce((s, n) => s + n.hp, 0), max = A.nester.reduce((s, n) => s + n.maxHp, 0) || 1;
  document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
}
objektFolgeAnmelden('funkennest', funkennestWeg);
// Aus objektZerstoert
function funkennestWeg(e) {
  partikel(e.x, 0.8, e.z, 0x8ad0ff, 14, 4); wackeln(0.3); geraeusch('explosion');
  zahl(e.x, 2.4, e.z, TX('Nest zerstört!'), 'big');
}

// ---------------------------------------------------------------------
// Auftrag 3: Der Lastverteiler. Er hängt an einem Trafo (gepanzert) und springt über lebende Leitungen zu einem anderen.
// Jede Leitung hat einen Sicherungskasten. Ist er zerschlagen, ist die Leitung eine Weile tot. Sind beide Leitungen
// an seinem Trafo tot, ist er abgeschnitten: Überlast, ohne Panzer, bis die Sicherungen wieder drin sind.
// Angriffe: Ring um ihn herum (wer zu nah steht) und Netzschlag (alle lebenden Leitungen schlagen über).
// ---------------------------------------------------------------------
const LASTVERTEILER = { panzer: 0.3, ueberlast: 6.5, sicherungAus: 16, sprungTempo: 12, ringR: 3.2, ring: 18, angriffAlle: 3.2, sprungAlle: 11, kaefer: 10, sprungSchaden: 16 };
function uwSicherung(A, i) { const [x, z] = UW_SICHERUNGEN[i]; const s = gegnerErstellen('sicherung', x, z); stelle(s, x, z); s.leitung = i; A.sicherungen[i] = s; return s; }
function uwLebend(A, t) { return A.leitungen.filter(l => (l.a === t || l.b === t) && l.tot <= 0); }
auftragstypAnmelden('lastverteiler', { starten: lastverteilerStarten, ablauf: lastverteilerAblauf, hud: lastverteilerHud, stand: STAND_NICHTS });
function lastverteilerStarten() {
  const A = G.auftrag;
  A.leitungen = uwLeitungenBauen(); A.sicherungen = []; A.wrack = []; A.kaeferT = 8;
  UW_SICHERUNGEN.forEach((_, i) => uwSicherung(A, i));
  A.trafoRing = bodenFlaeche(ringGeo, 0x8ad0ff, 0.7); A.trafoRing.scale.setScalar(1.9);
  const [tx, tz] = uwStand(0), b = gegnerErstellen('lastverteiler', tx, tz);
  b.trafo = 0; b.angriffT = 3; b.sprungT = LASTVERTEILER.sprungAlle; A.boss = b;
  meldung(TX('Der Lastverteiler'), TX('Er hängt an einem Trafo und springt über die Leitungen. Zerschlag die Sicherungen beider Leitungen an seinem Trafo, dann ist er abgeschnitten.'), 4400);
}
objektFolgeAnmelden('sicherung', sicherungAusgeloest);
// Aus objektZerstoert: Die Leitung ist tot, bis die Sicherung wieder drin ist
function sicherungAusgeloest(e) {
  const A = G.auftrag; if (!A || !A.leitungen || e.leitung == null) return;
  const l = A.leitungen[e.leitung]; l.tot = LASTVERTEILER.sicherungAus; l.warn = 0; l.schlag = 0;
  const w = { i: e.leitung, x: e.x, z: e.z, o: figur(BILD.sicherungAus, 0) }; stelle(w.o, e.x, e.z); A.wrack.push(w);
  partikel(e.x, 1, e.z, 0xffe060, 10, 3); geraeusch('strom');
  zahl(e.x, 2.4, e.z, TX('Sicherung raus!'), 'big');
}
function lastverteilerAblauf(dt) {
  const A = G.auftrag, B = A.boss, L = LASTVERTEILER;
  if (!B || B.hp <= 0 || !G.gegner.includes(B)) { uwAufraeumen(A); return auftragGeschafft(TX('Der Lastverteiler ist still')); }
  uwLeitungenAblauf(A, dt);
  // Sicherungen gehen von selbst wieder rein
  for (const w of A.wrack) if (Math.random() < dt * 2.5) rauchwolke(w.x + zz(-0.3, 0.3), w.z, 0.6);
  for (const w of A.wrack.slice()) if (A.leitungen[w.i].tot <= 0) {
    szene.remove(w.o.sprite); A.wrack.splice(A.wrack.indexOf(w), 1); uwSicherung(A, w.i);
    zahl(w.x, 2.4, w.z, TX('Sicherung wieder drin'), 'block');
  }
  if (B.ueberlast > 0) {
    B.ueberlast -= dt;
    if (B.ueberlast <= 0) { A.leitungen.forEach(l => { l.tot = 0; }); B.sprungT = 0.6; }
  } else if (!B.sprung && !uwLebend(A, B.trafo).length) {
    B.ueberlast = L.ueberlast; lvAbbrechen(B);
    zahl(B.x, 3.8, B.z, TX('Überlast!'), 'big'); wackeln(0.4); geraeusch('explosion');
  }
  B.panzer = B.ueberlast > 0 ? undefined : L.panzer;
  // Der Ring zeigt, an welchem Trafo er hängt
  const [tx, tz] = UW_TRAFOS[B.sprung ? B.sprung.ziel : B.trafo];
  A.trafoRing.position.set(tx, 0.03, tz); A.trafoRing.visible = !(B.ueberlast > 0);
  A.kaeferT -= dt;
  if (A.kaeferT <= 0 && G.gegner.filter(e => e.typ === 'funkenkaefer' && e.hp > 0).length < 2) { A.kaeferT = L.kaefer; gegnerErstellen('funkenkaefer', zz(-FELD.x + 2, FELD.x - 2), FELD.zMin + 1.5); }
}
function lastverteilerHud() {
  const A = G.auftrag, B = A.boss, n = B ? uwLebend(A, B.trafo).length : 0;
  hudText('waveLabel', TX('Der Lastverteiler'));
  hudText('waveSub', B && B.ueberlast > 0 ? TX('Überlast: zuschlagen!') : B && B.sprung ? TX('Er springt!') : n === 1 ? TX('Noch 1 Leitung an seinem Trafo') : TX`Noch ${n} Leitungen an seinem Trafo`);
  hudText('doorLabel', TX('Lastverteiler'));
  document.getElementById('doorFill').style.width = (B ? Math.max(0, B.hp) / B.maxHp * 100 : 0) + '%';
}
function lvAbbrechen(e) {
  if (e.aktion && e.aktion.marke) e.aktion.marke.weg();
  e.aktion = null; if (e.warn) e.warn.visible = false;
}
function lvBewegen(e, tx, tz, dt) {
  if (Math.hypot(tx - e.x, tz - e.z) < 0.4) { e.bewegt = false; return; }
  const [wx, wz] = wegRichtung(e, tx, tz, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
  e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt;
}
Object.assign(EIGEN_KI, {
  lastverteiler(e, dt) {
    const A = G.auftrag, L = LASTVERTEILER;
    if (!A || !A.leitungen) return false;
    e.blick = P.x >= e.x ? 1 : -1;
    if (e.ueberlast > 0) { e.bewegt = false; if (Math.random() < dt * 8) partikel(e.x, 2.5, e.z, 0x8ad0ff, 1, 3); return true; }
    if (e.sprung) return lvSprung(e, dt);
    if (e.aktion) return lvAktion(e, dt);
    e.sprungT -= dt; e.angriffT -= dt;
    if (e.sprungT <= 0) {
      const wege = uwLebend(A, e.trafo);
      if (wege.length) {
        // Er springt zu dem Trafo, der näher am Helden steht
        const ende = l => UW_TRAFOS[l.a === e.trafo ? l.b : l.a], l = wege.sort((a, b) => Math.hypot(ende(a)[0] - P.x, ende(a)[1] - P.z) - Math.hypot(ende(b)[0] - P.x, ende(b)[1] - P.z))[0];
        e.sprungT = L.sprungAlle; l.warn = UW.warnZeit;
        e.sprung = { l, ziel: l.a === e.trafo ? l.b : l.a, warte: UW.warnZeit, t: 0, getroffen: false };
        zahl(e.x, 3.8, e.z, TX('Sprung!'), 'big');
        return true;
      }
    }
    if (e.angriffT <= 0 && P.hp > 0) {
      e.angriffT = L.angriffAlle;
      if (abstand(e, P) < L.ringR + 1.5) { e.aktion = { art: 'ring', t: 1.1, dauer: 1.1, marke: kesselMarke(e.x, e.z, L.ringR, 0x8ad0ff) }; zahl(e.x, 3.8, e.z, TX('Entladung!'), 'big'); }
      else { e.aktion = { art: 'netz', t: UW.warnZeit + 0.3, dauer: UW.warnZeit + 0.3 }; A.leitungen.forEach(l => { if (l.tot <= 0 && l.warn <= 0) l.warn = UW.warnZeit; }); zahl(e.x, 3.8, e.z, TX('Netzschlag!'), 'big'); }
      e.warn.visible = true;
      return true;
    }
    // Er bleibt vor seinem Trafo und rückt dem Helden nur ein Stück entgegen
    const [tx, tz] = uwStand(e.trafo);
    lvBewegen(e, tx + Math.max(-1.2, Math.min(1.2, (P.x - tx) * 0.2)), tz, dt);
    return true;
  },
});
function lvSprung(e, dt) {
  const s = e.sprung, L = LASTVERTEILER;
  if (s.warte > 0 && s.l.tot > 0) { e.sprung = null; return true; }   // Leitung tot, bevor er losspringt: Er bleibt, wo er ist
  if (s.warte > 0) { s.warte -= dt; e.bewegt = false; if (Math.random() < dt * 10) partikel(e.x, 2.2, e.z, 0x8ad0ff, 1, 3); if (s.warte <= 0) { s.vx = e.x; s.vz = e.z; } return true; }
  const [nx, nz] = uwStand(s.ziel), d = Math.hypot(nx - s.vx, nz - s.vz) || 1;
  s.t += dt * L.sprungTempo / d;
  const k = Math.min(1, s.t);
  e.x = s.vx + (nx - s.vx) * k; e.z = s.vz + (nz - s.vz) * k; e.bewegt = true;
  if (Math.random() < dt * 30) partikel(e.x, 1.5, e.z, 0xeaf6ff, 1, 4);
  if (!s.getroffen && P.hp > 0 && abstand(e, P) < e.r + P.r + 0.3) { s.getroffen = true; schadenAn(P, L.sprungSchaden, e.x, e.z, e); }
  if (k >= 1) { e.trafo = s.ziel; e.sprung = null; e.angriffT = Math.max(e.angriffT, 1.2); }
  return true;
}
function lvAktion(e, dt) {
  const a = e.aktion, L = e.typ === 'archivar' ? ARCHIVAR : LASTVERTEILER;   /* der Archivar stempelt mit derselben Aktion */
  a.t -= dt; e.bewegt = false;
  if (a.marke) a.marke.scheibe.scale.setScalar(a.marke.r * (1 - Math.max(0, a.t) / a.dauer));
  if (a.t > 0) return true;
  if (a.art === 'ring') {
    for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - e.x, ziel.z - e.z) < L.ringR + (ziel.r || 0.4)) schadenAn(ziel, L.ring, e.x, e.z, e);
    partikel(e.x, 0.6, e.z, 0x8ad0ff, 16, 5); wackeln(0.25); geraeusch('strom');
  }
  lvAbbrechen(e);
  return true;
}
gegnerBildAnmelden('lastverteiler', lastverteilerBild);
function lastverteilerBild(e, b) {
  if (e.ueberlast > 0) return BILD.lvUeberlast[Math.floor(G.zeit * 6) % 2];
  if (e.aktion || (e.sprung && e.sprung.warte > 0)) return BILD.lvBogen;
  return e.bewegt ? b : BILD.lvRuhe[Math.floor(G.zeit * 3) % 2];
}

// ---------------------------------------------------------------------
// Die Wahl nach dem Lastverteiler
//  alle: neuer Lastplan für alle Dörfer (Anselm). Energie im Bund, Birkenhain und Eisenfurt freuen sich, Strom 1 Holzkohle billiger,
//        und die Scheinwerfer an der Mauer bleiben für immer (Überfälle eine Stufe schwächer), auch ohne Bund.
//  uns:  alles Licht für euer Dorf (Bodo). Strom 3 Holzkohle billiger, Birkenhain und Eisenfurt verärgert.
//  aus:  abschalten (Hanne). Der Verbund ist zerschlagen: eigener Generator (teurer), Altmetall aus den Leitungen.
// ---------------------------------------------------------------------
const ENERGIEWAHL = { alle: { energie: 85, birkenhain: 1, eisenfurt: 1, strom: 1 }, uns: { energie: 60, birkenhain: -1, eisenfurt: -1, strom: 3 }, aus: { altmetall: 40, schrott: 2 } };
function energieWahlPruefen(weiter) {
  const E = energieG();
  if (E.schritt < 3 || E.wahl) return weiter();
  const fremd = !rostbrecherBekannt(), rep = figurDa('anselm') ? 'anselm' : 'ebert';
  if (verbundStill('energie')) { energieStillAbschluss(null); return weiter(); }
  entscheidung(TX('Der Lastplan'), TX('Das Umspannwerk'), [
    ['ebert', TX('Der Lastverteiler liegt zwischen seinen Trafos und summt leise. Auf seiner Anzeige steht: „LASTPLAN 1.0. STADT: 40 000 EINWOHNER. VERSORGUNG: VOLL. BITTE BESTÄTIGEN.“ Er will wissen, für wen er den Strom verteilen soll.')],
    [rep, ortBekannt('eisenfurt') ? TX('Schreibt einen neuen Lastplan: unser Dorf, Birkenhain, Eisenfurt. Alle, die wirklich da sind. Die tote Stadt braucht kein Licht mehr.') : TX('Schreibt einen neuen Lastplan: unser Dorf, Birkenhain und wer sonst noch im Tal lebt. Alle, die wirklich da sind. Die tote Stadt braucht kein Licht mehr.')],
    ['bodo', TX('Wir haben das Kraftwerk befreit, mit unserer Holzkohle. Dann gehört der Strom auch uns. Alles davon.')],
    ...(fremd ? [] : [['hanne', TX('Schaltet ihn ab und kappt die Leitungen. Wir schaufeln die Kohle selbst in einen Generator. Dann zählt wenigstens keiner mehr mit, wie viele wir sind.')]]),
  ], [
    [TX('Neuer Lastplan: Strom für alle Dörfer'), () => energieWaehlen('alle')],
    [TX('Alles Licht für euer Dorf'), () => energieWaehlen('uns')],
    fremd ? [TX('Abschalten · Dafür fehlt euch noch jemand, der sich das traut. Auf dem Markt hängen manchmal Flugblätter.'), () => energieWaehlen('aus'), true] : [TX('Abschalten: Strom nur noch von Hand'), () => energieWaehlen('aus')],
  ], weiter);
}
function energieWaehlen(w) {
  const E = energieG(), Z = ENERGIEWAHL[w];
  E.wahl = w;
  if (w === 'alle' || w === 'uns') {
    SPIEL.cluster.energie = Math.max(cluster('energie'), Z.energie);
    for (const o of ['birkenhain', 'eisenfurt']) if (ortBekannt(o)) SPIEL.beziehungen[o] = Math.max(-3, Math.min(3, (SPIEL.beziehungen[o] || 0) + Z[o]));
  } else { verbundStilllegen('energie'); SPIEL.altmetall = (SPIEL.altmetall || 0) + Z.altmetall; SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + Z.schrott; }
  const lore = 'e_' + w; if (!hatLore(lore)) SPIEL.chronik.push(lore);
  const rep = figurDa('anselm') ? 'anselm' : 'ebert';
  return w === 'alle' ? [
    ['erzaehler', TX('Ihr tippt die Namen der Dörfer ein. Der Lastverteiler fragt nach: „STADT: VERSORGUNG NULL? BITTE BESTÄTIGEN.“ Ihr bestätigt. In dieser Nacht geht in der toten Stadt das Licht aus, Straße für Straße. In Birkenhain geht es an.')],
    [rep, TX('Dreihundert Jahre lang hat er für niemanden geleuchtet. Jetzt leuchtet er für jemanden.')],
  ] : w === 'uns' ? [
    ['erzaehler', TX('„LASTPLAN ÜBERNOMMEN: DORF. ANDERE VERBRAUCHER: ABGESCHALTET.“ Am Abend brennt bei euch jede Lampe, auch die im Hühnerstall. Von Birkenhain aus sieht man euer Dorf leuchten.')],
    ['bodo', TX('Sollen sie herschauen. Dann wissen sie wenigstens, wer hier das Licht macht.')],
  ] : [
    ['erzaehler', TX('Hanne kappt die Leitungen mit einer Axt, eine nach der anderen. Funken, dann Stille. Der Lastverteiler sinkt zwischen seinen Trafos zusammen, der Glühfaden wird dunkel.')],
    ['hanne', TX('Ab morgen schaufelt ihr selbst. Es wird laut. Aber jedes Licht, das brennt, habt ihr selbst gemacht.')],
  ];
}

// ---------------------------------------------------------------------
// Missionen
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  kurzschluss: { ...MISSIONSTEXTE.kurzschluss, ort: 'umspannwerk', typ: 'kurzschluss', gefahr: 3,
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauUmspannwerk(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      const erst = energieG().schritt < 2 && !energieWahl();
      erg.gold += erst ? 40 : 20; erg.teile += erst ? 8 : 4; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + (erst ? 2 : 1);
      if (erst) { erg.lore = ['e_funken']; energieG().schritt = 2; }
      clusterAendern('energie', erst ? 8 : 3);
    } },
  lastverteiler: { ...MISSIONSTEXTE.lastverteiler, ort: 'umspannwerk', typ: 'lastverteiler', gefahr: 4,
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauUmspannwerk(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      erg.gold += 80; erg.teile += 16; erg.material.lazisplitter = (erg.material.lazisplitter || 0) + 3;
      erg.lore = ['e_lastplan']; if (energieG().schritt < 3) energieG().schritt = 3;
    } },
});

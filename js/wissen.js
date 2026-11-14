// =====================================================================
// DIE GESCHICHTE DES VERBUNDS WISSEN (Verbund-Geschichten, Punkt B; Inhaber, 08.11.2026:
// jeder Verbund bekommt eine eigene Geschichte, Wissen eine volle, mit den Bauplänen der Alten.)
//  1. Der Lesesaal (gibt es schon, Anfrage des Verbunds). In Eberts Abschrift steht danach eine Seite, die er nicht
//     geschrieben hat: Unter der Universität liegt das Planarchiv. Es erscheint auf der Weltkarte.
//  2. Brandwache: Die Eiferer des inneren Kreises zünden die Planregale an. Fünf Planrollen zu Ebert tragen,
//     brennende Regale löschen (danebenstehen), bevor die Rollen darin verbrennen.
//  3. Der Archivar: Er liest mit einem Lichtstrahl, der den Helden sucht, kurz zielt und dann trifft. Wer einen
//     Lesespiegel zu ihm dreht (zerschlagen) und sich dahinter stellt, lenkt den Strahl zurück: geblendet, ohne Panzer.
//  Danach (nach der Rückkehr): Das Archiv steht allen offen (Ebert), die Pläne nur für euch (Bodo)
//  oder abschalten und von Hand abschreiben (Hanne). Ohne bekannte Rostbrecher ist Abschalten sichtbar, aber gesperrt.
// Die Lore: Der Archivar gibt Baupläne nur an Ingenieure heraus. Der letzte hat sich vor 297 Jahren abgemeldet.
// Der innere Kreis lässt die Pläne verbrennen: Wer selbst bauen kann, braucht die Maschinen nicht.
// Die Baupläne der Alten schalten eine vierte Ausbaustufe frei (GEBAEUDE[...].stufen mit bauplan: true).
// =====================================================================

function wissenG() { return SPIEL.wissenG || (SPIEL.wissenG = { schritt: 0, wahl: null }); }
function wissenWahl() { return SPIEL.wissenG && SPIEL.wissenG.wahl || null; }
// Welche Gebäude eine vierte Stufe bekommen. Abschriften von Hand (Wahl „aus“) gibt es nur für die ersten beiden.
const BAUPLAENE = ['bauernhof', 'wohnhaus', 'werkstatt', 'wachturm'], BAUPLAENE_ABSCHRIFT = 2;
function bauplanBekannt(typ) {
  const w = wissenWahl(); if (!w) return false;
  const i = BAUPLAENE.indexOf(typ); return i >= 0 && (w !== 'aus' || (!SPIEL.wissenG.ohnePlaene && i < BAUPLAENE_ABSCHRIFT));
}
// Mit den Originalen (nur für euch) wird die vierte Stufe billiger
function bauplanKosten(k) {
  if (wissenWahl() !== 'uns') return k;
  const n = {}; for (const r in k) n[r] = Math.ceil(k[r] * WISSENWAHL.uns.kosten); return n;
}
// Wie viele Stufen das Gebäude für euch hat (unbekannte Baupläne zählen nicht)
function stufenAnzahl(typ) { return GEBAEUDE[typ].stufen.filter(s => !s.bauplan || bauplanBekannt(typ)).length; }
function wissenStillAbschluss(bericht) {
  const W = wissenG(), Z = WISSENWAHL.aus;
  W.wahl = 'aus';
  if (W.schritt < 2) {   /* niemand war im Archiv: keine Abschriften */
    W.ohnePlaene = true; SPIEL.buecher = (SPIEL.buecher || 0) + Z.buecherFrueh;
    if (bericht) bericht.push(TX`Seit der Verbund Wissen stillgelegt ist, ist das Planarchiv verschüttet. Die Rostbrecher haben am Eingang ${Z.buecherFrueh} alte Bücher gefunden.`);
    return;
  }
  SPIEL.buecher = (SPIEL.buecher || 0) + Z.buecher;
  if (!hatLore('wi_aus')) SPIEL.chronik.push('wi_aus');
  if (bericht) bericht.push(TX`Seit der Verbund Wissen stillgelegt ist, schweigt auch der Archivar. Ebert hat abgeschrieben, was er konnte: zwei Baupläne der Alten und ${Z.buecher} alte Bücher.`);
}
function wissenTag(bericht) {
  const W = wissenG();
  if (W.schritt >= 1 && !W.wahl && verbundStill('wissen')) return wissenStillAbschluss(bericht);
  if (W.schritt !== 0 || !hatLore('lesesaal') || verbundStill('wissen')) return;
  W.schritt = 1;
  if (!SPIEL.karte.bekannt.includes('planarchiv')) SPIEL.karte.bekannt.push('planarchiv');
  if (!hatLore('wi_ruf')) SPIEL.chronik.push('wi_ruf');
  bericht.push(TX('In Eberts Abschrift aus dem Lesesaal steht eine Seite, die er nicht geschrieben hat: „PLANARCHIV. 1 204 BAUPLÄNE. AUSGABE NUR AN INGENIEURE.“ Darunter riecht das Papier nach Rauch. Neu auf der Weltkarte: Das Planarchiv.'));
}

// ---------------------------------------------------------------------
// Die Karte: der Saal unter der Universität (wie der Lesesaal), dazu die Planregale und Eberts Kartentisch.
// ---------------------------------------------------------------------
const PA_REGALE = [[-6.2, -5.4], [6.2, -5.4], [-6.2, 3.2], [6.2, 3.2]];
const PA_TISCH = [0, -6.2];
const PA_SPIEGEL = [[-6.4, 1.2], [6.4, 1.2], [0, 6.8]];
function aufbauPlanarchiv() {
  aufbauLesesaal();
  lichtFleck(PA_TISCH[0], PA_TISCH[1], 1.8, 0xffd890, 0.08, 0.04);
}

// ---------------------------------------------------------------------
// Auftrag 2: Brandwache. Die Eiferer werfen Öl in die Regale. Ein brennendes Regal hat BRAND.zeit Sekunden,
// dann sind seine Rollen verbrannt. Wer BRAND.loeschen Sekunden danebensteht, löscht es.
// Rollen trägt der Held einzeln zu Ebert. Reichen die übrigen Rollen nicht mehr, ist der Auftrag verloren.
// ---------------------------------------------------------------------
const BRAND = { rollen: 2, ziel: 5, zeit: 9, loeschen: 1.2, nah: 1.7, wurf: [5, 8], weit: 10, nachschub: 4.5, hoechstens: 6 };
auftragstypAnmelden('brandwache', { starten: brandwacheStarten, ablauf: brandwacheAblauf, hud: brandwacheHud, stand: STAND_NICHTS });
function brandwacheStarten() {
  const A = G.auftrag;
  A.regale = PA_REGALE.map(([x, z]) => {
    const o = decoBild(BILD.planregal[BRAND.rollen], x, z, 0.9, 0.8);
    const ring = bodenFlaeche(ringGeo, 0xff6020, 0.85); ring.position.set(x, 0.03, z); ring.scale.setScalar(BRAND.nah); ring.visible = false;
    const fleck = bodenFlaeche(scheibeGeo, 0x8ad0ff, 0.35); fleck.position.set(x, 0.025, z); fleck.scale.setScalar(0.01); fleck.visible = false;
    return { x, z, o, ring, fleck, rollen: BRAND.rollen, brennt: 0, loesch: 0, asche: false };
  });
  A.tisch = decoBild(BILD.kartentisch[0], PA_TISCH[0], PA_TISCH[1], 1.0, 0.9);
  A.abgabe = bodenFlaeche(ringGeo, 0xffd060, 0.7); A.abgabe.position.set(PA_TISCH[0], 0.03, PA_TISCH[1]); A.abgabe.scale.setScalar(BRAND.nah + 0.4);
  A.traegt = false; A.gerettet = 0; A.wurfT = 3.5; A.nachT = 2;
  A.rolle = figur(BILD.planrolle, 0); A.rolle.sprite.visible = false; A.rolle.sprite.scale.multiplyScalar(1.7);   /* über dem Kopf, auch am Handy erkennbar */
  [[-12, 1], [12, 1], [0, 9]].forEach(([x, z]) => gegnerErstellen('eiferer', x, z));
  meldung(TX('Das Planarchiv'), TX('Trag fünf Planrollen zu Ebert. Brennt ein Regal, stell dich daneben, bis es gelöscht ist.'), 4000);
}
function paRegalBild(r) { zeige(r.o, r.asche ? BILD.planregalAsche : BILD.planregal[r.rollen], 1); }
function paRest(A) { return A.gerettet + (A.traegt ? 1 : 0) + A.regale.reduce((s, r) => s + (r.asche ? 0 : r.rollen), 0); }
function brandwacheAblauf(dt) {
  const A = G.auftrag;
  // Die Eiferer werfen Öl auf das Regal, das ihnen am nächsten steht
  A.wurfT -= dt;
  if (A.wurfT <= 0) {
    A.wurfT = zz(BRAND.wurf[0], BRAND.wurf[1]);
    let best = null;
    for (const e of G.gegner) if (e.typ === 'eiferer' && e.hp > 0) for (const r of A.regale) {
      if (r.asche || r.brennt > 0 || !r.rollen) continue;
      const d = Math.hypot(e.x - r.x, e.z - r.z); if (d < BRAND.weit && (!best || d < best.d)) best = { e, r, d };
    }
    if (best) {
      const { e, r } = best; r.brennt = BRAND.zeit; r.loesch = 0; r.ring.visible = true;
      for (let k = 0; k <= 5; k++) partikel(e.x + (r.x - e.x) * k / 5, 1.2 + Math.sin(k / 5 * Math.PI), e.z + (r.z - e.z) * k / 5, 0x3a2a1a, 2, 1);
      zahl(e.x, 2.4, e.z, TX('Ins Feuer damit!'), 'big'); zahl(r.x, 2.8, r.z, TX('Es brennt!'), 'hurt'); geraeusch('zuenden');
    }
  }
  for (const r of A.regale) {
    if (r.brennt <= 0) continue;
    r.brennt -= dt;
    if (Math.random() < dt * 14) partikel(r.x + zz(-0.6, 0.6), 0.8 + Math.random() * 1.4, r.z, Math.random() < 0.5 ? 0xff8030 : 0xffd060, 1, 2);
    if (Math.random() < dt * 3) rauchwolke(r.x + zz(-0.4, 0.4), r.z, 0.7);
    r.ring.scale.setScalar(BRAND.nah * (0.4 + 0.6 * Math.max(0, r.brennt) / BRAND.zeit));
    const nah = P.hp > 0 && Math.hypot(P.x - r.x, P.z - r.z) < BRAND.nah + 0.4;
    r.loesch = nah ? r.loesch + dt : Math.max(0, r.loesch - dt * 0.5);
    r.fleck.visible = r.loesch > 0; r.fleck.scale.setScalar(Math.max(0.01, BRAND.nah * r.loesch / BRAND.loeschen));
    if (r.loesch >= BRAND.loeschen) {
      r.brennt = 0; r.loesch = 0; r.ring.visible = r.fleck.visible = false;
      rauchwolke(r.x, r.z, 1.2); zahl(r.x, 2.8, r.z, TX('Gelöscht!'), 'block');
    } else if (r.brennt <= 0) {
      r.brennt = 0; r.asche = true; r.rollen = 0; r.ring.visible = r.fleck.visible = false; paRegalBild(r);
      rauchwolke(r.x, r.z, 1.6); zahl(r.x, 2.8, r.z, TX('Verbrannt!'), 'hurt'); geraeusch('explosion');
    }
  }
  // Rollen nehmen und zu Ebert bringen
  if (P.hp > 0 && !A.traegt) for (const r of A.regale) {
    if (r.asche || r.brennt > 0 || !r.rollen || Math.hypot(P.x - r.x, P.z - r.z) > BRAND.nah) continue;
    r.rollen--; A.traegt = true; paRegalBild(r); zahl(P.x, 2.6, P.z, TX('Planrolle!'), 'loot'); geraeusch('teil');
    break;
  }
  if (A.traegt && Math.hypot(P.x - PA_TISCH[0], P.z - PA_TISCH[1]) < BRAND.nah + 0.4) {
    A.traegt = false; A.gerettet++; zeige(A.tisch, BILD.kartentisch[Math.min(BILD.kartentisch.length - 1, Math.ceil(A.gerettet / 2))], 1);
    zahl(PA_TISCH[0], 2.6, PA_TISCH[1], TX`${A.gerettet} von ${BRAND.ziel}`, 'big'); geraeusch('muenze');
  }
  A.rolle.sprite.visible = A.traegt && P.hp > 0;
  A.abgabe.material.opacity = A.traegt ? 0.6 + 0.35 * Math.sin(G.zeit * 7) : 0.35; A.abgabe.scale.setScalar((BRAND.nah + 0.4) * (A.traegt ? 1 + 0.06 * Math.sin(G.zeit * 7) : 1));
  if (A.traegt) A.rolle.sprite.position.set(P.x, 3.2 + Math.sin(G.zeit * 6) * 0.08, P.z);
  if (A.gerettet >= BRAND.ziel) { brandAufraeumen(A); return auftragGeschafft(TX('Die Pläne sind gerettet')); }
  if (paRest(A) < BRAND.ziel) { brandAufraeumen(A); return verloren(TX('Die Pläne sind verbrannt')); }
  // Nachschub an Eiferern durch die Türen und über die Treppe
  A.nachT -= dt;
  if (A.nachT <= 0 && G.gegner.filter(e => e.hp > 0 && !e.def.objekt).length < BRAND.hoechstens) {
    A.nachT = BRAND.nachschub;
    const [x, z] = SAAL_ZUGAENGE[Math.floor(Math.random() * SAAL_ZUGAENGE.length)];
    gegnerErstellen(Math.random() < 0.75 ? 'eiferer' : 'schuetze', x, z);
  }
}
function brandAufraeumen(A) { (A.regale || []).forEach(r => { r.ring.visible = r.fleck.visible = false; }); if (A.rolle) A.rolle.sprite.visible = false; if (A.abgabe) A.abgabe.visible = false; }
function brandwacheHud() {
  const A = G.auftrag, brennt = A.regale.filter(r => r.brennt > 0).length;
  hudText('waveLabel', TX('Das Planarchiv'));
  hudText('waveSub', brennt ? (brennt === 1 ? TX('Ein Regal brennt!') : TX`${brennt} Regale brennen!`) : A.traegt ? TX('Bring die Rolle zu Ebert') : TX`${A.gerettet} von ${BRAND.ziel} Planrollen gerettet`);
  hudText('doorLabel', TX('Planrollen'));
  document.getElementById('doorFill').style.width = (A.gerettet / BRAND.ziel * 100) + '%';
}

// ---------------------------------------------------------------------
// Auftrag 3: Der Archivar. Ein Karteischrank auf drei Beinen mit einem Projektor als Kopf.
// Sein Lesestrahl dreht sich zum Helden (suchen), bleibt kurz stehen und blinkt (zielen), dann trifft er alles
// auf der Linie (lesen). Steht ein gedrehter Lesespiegel vor dem Helden, wirft er den Strahl zurück: geblendet.
// Lesespiegel dreht man, indem man sie zerschlägt; nach einem Rückwurf oder nach einer Weile stehen sie wieder schräg.
// ---------------------------------------------------------------------
const ARCHIVAR = { panzer: 0.25, blind: 6, dreh: 1.0, zielen: 0.85, lesen: 0.35, strahl: 24, breite: 0.6, pause: [1.4, 2.4],
  ringR: 3.2, ring: 18, stempelAlle: 3.2, drohneAlle: 12, spiegelZurueck: 16, stand: [0, -4.4] };
const PA_HALLE = [-12.6, -7.6, 12.6, 9];
function paSpiegel(A, i) { const [x, z] = PA_SPIEGEL[i]; const s = gegnerErstellen('lesespiegel', x, z); stelle(s, x, z); s.spiegel = i; A.spiegel[i] = s; return s; }
auftragstypAnmelden('archivar', { starten: archivarStarten, ablauf: archivarAblauf, hud: archivarHud, stand: STAND_NICHTS });
function archivarStarten() {
  const A = G.auftrag;
  A.spiegel = []; A.gedreht = []; A.drohneT = 6;
  PA_SPIEGEL.forEach((_, i) => paSpiegel(A, i));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.4), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.35, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.05; szene.add(m); A.strahlM = m;
  const [x, z] = ARCHIVAR.stand, b = gegnerErstellen('archivar', x, z);
  b.winkel = Math.PI / 2; b.phase = 'suchen'; b.phaseT = 2; b.stempelT = 2; A.boss = b;
  meldung(TX('Der Archivar'), TX('Sein Lichtstrahl liest alles, was er trifft. Zerschlag einen Lesespiegel, damit er sich zu ihm dreht, und stell dich dahinter.'), 4600);
}
objektFolgeAnmelden('lesespiegel', spiegelGedreht);
// Aus objektZerstoert: Der Spiegel dreht sich zum Archivar
function spiegelGedreht(e) {
  const A = G.auftrag; if (!A || !A.gedreht || e.spiegel == null) return;
  const s = { i: e.spiegel, x: e.x, z: e.z, t: ARCHIVAR.spiegelZurueck, o: figur(BILD.spiegelAktiv, 0.6) }; stelle(s.o, e.x, e.z); A.gedreht.push(s);
  partikel(e.x, 1.4, e.z, 0xfff0b0, 10, 3); zahl(e.x, 2.6, e.z, TX('Gedreht!'), 'big'); geraeusch('klick');
}
function paSpiegelZurueck(A, s) { szene.remove(s.o.sprite); if (s.o.shadow) szene.remove(s.o.shadow); A.gedreht.splice(A.gedreht.indexOf(s), 1); paSpiegel(A, s.i); }
// Wie weit der Strahl reicht, bis er an die Wand stößt
function paStrahlLaenge(x, z, dx, dz) {
  let t = 40;
  if (dx > 1e-6) t = Math.min(t, (PA_HALLE[2] - x) / dx); else if (dx < -1e-6) t = Math.min(t, (PA_HALLE[0] - x) / dx);
  if (dz > 1e-6) t = Math.min(t, (PA_HALLE[3] - z) / dz); else if (dz < -1e-6) t = Math.min(t, (PA_HALLE[1] - z) / dz);
  return Math.max(1, t);
}
// Auf der Linie: wie weit vorn (entlang) und wie weit daneben
function paAufLinie(B, x, z) { const dx = Math.cos(B.winkel), dz = Math.sin(B.winkel), rx = x - B.x, rz = z - B.z; return { entlang: rx * dx + rz * dz, daneben: Math.abs(rz * dx - rx * dz) }; }
function paStrahlZeigen(A, B) {
  const m = A.strahlM, dx = Math.cos(B.winkel), dz = Math.sin(B.winkel), L = paStrahlLaenge(B.x, B.z, dx, dz);
  m.visible = !(B.blind > 0) && B.hp > 0;
  m.position.set(B.x + dx * L / 2, 0.05, B.z + dz * L / 2); m.scale.set(L, 1, 1); m.rotation.z = -B.winkel;
  const mat = m.material;
  if (B.phase === 'lesen') { mat.color.setHex(0xffffff); mat.opacity = 0.95; m.scale.y = 3; }
  else if (B.phase === 'zielen') { mat.color.setHex(Math.floor(G.zeit * 10) % 2 ? 0xffe060 : 0xfff0b0); mat.opacity = 0.8; m.scale.y = 1.8; }
  else { mat.color.setHex(0xfff0b0); mat.opacity = 0.3; m.scale.y = 1; }
  return L;
}
function archivarLesen(A, B) {
  const L = paStrahlLaenge(B.x, B.z, Math.cos(B.winkel), Math.sin(B.winkel)), W = ARCHIVAR;
  // Ein gedrehter Spiegel vor allen anderen Zielen wirft den Strahl zurück
  const vorn = (s, r) => { const l = paAufLinie(B, s.x, s.z); return l.entlang > 0 && l.entlang < L && l.daneben < W.breite + r ? l.entlang : null; };
  let spiegel = null, sw = 1e9;
  for (const s of A.gedreht) { const w = vorn(s, 0.6); if (w != null && w < sw) { spiegel = s; sw = w; } }
  for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) {
    if (ziel.hp <= 0) continue;
    const w = vorn(ziel, ziel.r || 0.4);
    if (w != null && w < sw) schadenAn(ziel, W.strahl, B.x, B.z, B);
  }
  geraeusch('strom');
  if (!spiegel) return;
  B.blind = W.blind; B.phase = 'suchen'; B.phaseT = W.blind; lvAbbrechen(B);
  for (let k = 0; k <= 8; k++) partikel(B.x + (spiegel.x - B.x) * k / 8, 1.4, B.z + (spiegel.z - B.z) * k / 8, 0xffffff, 2, 3);
  zahl(B.x, 4, B.z, TX('Geblendet!'), 'big'); wackeln(0.35); geraeusch('explosion');
  paSpiegelZurueck(A, spiegel);
}
function archivarAblauf(dt) {
  const A = G.auftrag, B = A.boss, W = ARCHIVAR;
  if (!B || B.hp <= 0 || !G.gegner.includes(B)) { if (A.strahlM) A.strahlM.visible = false; return auftragGeschafft(TX('Der Archivar ist still')); }
  for (const s of A.gedreht.slice()) { s.t -= dt; if (s.t <= 0) paSpiegelZurueck(A, s); }
  if (B.blind > 0) { B.blind -= dt; if (Math.random() < dt * 8) partikel(B.x, 3.2, B.z, 0xffffff, 1, 2); }
  B.panzer = B.blind > 0 ? undefined : W.panzer;
  paStrahlZeigen(A, B);
  A.drohneT -= dt;
  if (A.drohneT <= 0 && G.gegner.filter(e => e.typ === 'drohne' && e.hp > 0).length < 2) {
    A.drohneT = W.drohneAlle; const [x, z] = SAAL_ZUGAENGE[1 + Math.floor(Math.random() * 2)]; gegnerErstellen('drohne', x, z);
  }
}
function archivarHud() {
  const A = G.auftrag, B = A.boss;
  hudText('waveLabel', TX('Der Archivar'));
  hudText('waveSub', B && B.blind > 0 ? TX('Geblendet: zuschlagen!') : B && B.phase === 'zielen' ? TX('Er zielt!') : A.gedreht.length ? TX('Stell dich hinter den Spiegel') : TX('Zerschlag einen Lesespiegel'));
  hudText('doorLabel', TX('Archivar'));
  document.getElementById('doorFill').style.width = (B ? Math.max(0, B.hp) / B.maxHp * 100 : 0) + '%';
}
Object.assign(EIGEN_KI, {
  archivar(e, dt) {
    const A = G.auftrag, W = ARCHIVAR;
    if (!A || !A.strahlM) return false;
    e.blick = P.x >= e.x ? 1 : -1;
    if (e.blind > 0) { e.bewegt = false; return true; }
    if (e.aktion) return lvAktion(e, dt);
    // Der Strahl
    const soll = Math.atan2(P.z - e.z, P.x - e.x);
    let d = soll - e.winkel; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    e.phaseT -= dt;
    if (e.phase === 'suchen') {
      e.winkel += Math.max(-W.dreh * dt, Math.min(W.dreh * dt, d));
      if (e.phaseT <= 0 && Math.abs(d) < 0.2 && P.hp > 0) { e.phase = 'zielen'; e.phaseT = W.zielen; zahl(e.x, 4, e.z, TX('Lesen!'), 'big'); }
    } else if (e.phase === 'zielen') {
      if (e.phaseT <= 0) { e.phase = 'lesen'; e.phaseT = W.lesen; archivarLesen(A, e); }
    } else if (e.phaseT <= 0 && !(e.blind > 0)) { e.phase = 'suchen'; e.phaseT = zz(W.pause[0], W.pause[1]); }
    // Wer zu nah kommt, bekommt den Stempel
    e.stempelT -= dt;
    if (e.phase === 'suchen' && e.stempelT <= 0 && P.hp > 0 && abstand(e, P) < W.ringR + 1.2) {
      e.stempelT = W.stempelAlle;
      e.aktion = { art: 'ring', t: 1.0, dauer: 1.0, marke: kesselMarke(e.x, e.z, W.ringR, 0xfff0b0) }; zahl(e.x, 4, e.z, TX('Abgestempelt!'), 'big');
      if (e.warn) e.warn.visible = true;
      return true;
    }
    // Er bleibt vor dem Kartentisch der Alten und rückt dem Helden nur ein Stück nach
    const [sx, sz] = W.stand;
    if (e.phase === 'suchen') lvBewegen(e, sx + Math.max(-2.5, Math.min(2.5, (P.x - sx) * 0.3)), sz, dt); else e.bewegt = false;
    return true;
  },
});
gegnerBildAnmelden('archivar', archivarBild);
function archivarBild(e, b) {
  if (e.blind > 0) return BILD.arBlind[Math.floor(G.zeit * 6) % 2];
  if (e.phase === 'zielen' || e.phase === 'lesen' || e.aktion) return BILD.arStrahl;
  return e.bewegt ? b : BILD.arRuhe[Math.floor(G.zeit * 3) % 2];
}

// ---------------------------------------------------------------------
// Die Wahl nach dem Archivar
//  alle: Das Archiv steht allen offen (Ebert). Wissen im Bund, Birkenhain und Eisenfurt freuen sich, alle vier Baupläne,
//        und Ebert darf immer ins Archiv: Forschung für immer einen Tag schneller, auch ohne Bund.
//  uns:  Die Pläne nur für euch (Bodo). Alle vier Baupläne als Originale, die vierte Stufe kostet ein Fünftel weniger.
//        Birkenhain und Eisenfurt verärgert.
//  aus:  abschalten (Hanne). Der Verbund ist zerschlagen, Ebert schreibt von Hand ab: zwei Baupläne und alte Bücher.
// ---------------------------------------------------------------------
const WISSENWAHL = { alle: { wissen: 85, birkenhain: 1, eisenfurt: 1 }, uns: { wissen: 60, birkenhain: -1, eisenfurt: -1, kosten: 0.8 }, aus: { buecher: 12, buecherFrueh: 4, schrott: 2 } };
function wissenWahlPruefen(weiter) {
  const W = wissenG();
  if (W.schritt < 3 || W.wahl) return weiter();
  if (verbundStill('wissen')) { wissenStillAbschluss(null); return weiter(); }
  const fremd = !rostbrecherBekannt();
  entscheidung(TX('Die Baupläne der Alten'), TX('Das Planarchiv'), [
    ['ebert', TX('Der Archivar hat eine Frage auf seinem Schirm: „KEIN INGENIEUR ANWESEND. WER DARF BAUEN?“ Dahinter liegen über tausend Pläne. Häuser, Höfe, Werkstätten, alles, was die Alten konnten.')],
    ['ebert', ortBekannt('eisenfurt') ? TX('Gib ihm alle Namen: unser Dorf, Birkenhain, Eisenfurt. Wer bauen will, soll lesen dürfen. Ich habe dreißig Jahre darauf gewartet, dass jemand die Pläne der Alten aufmacht.') : TX('Gib ihm alle Namen, die wir kennen, und lass Platz für die, die noch kommen. Wer bauen will, soll lesen dürfen. Ich habe dreißig Jahre darauf gewartet, dass jemand die Pläne der Alten aufmacht.')],
    ['bodo', TX('Wir haben die Rollen aus dem Feuer geholt, nicht Birkenhain. Unser Name, sonst keiner. Wer die Pläne hat, hat die besseren Häuser.')],
    ...(fremd ? [] : [['hanne', TX('Schaltet ihn ab. Ebert schreibt ab, was er schafft, von Hand. Was wir verstehen, können wir bauen. Was wir nicht verstehen, brauchen wir nicht.')]]),
  ], [
    [TX('Das Archiv steht allen offen'), () => wissenWaehlen('alle')],
    [TX('Die Pläne nur für euch'), () => wissenWaehlen('uns')],
    fremd ? [TX('Abschalten · Dafür fehlt euch noch jemand, der sich das traut. Auf dem Markt hängen manchmal Flugblätter.'), () => wissenWaehlen('aus'), true] : [TX('Abschalten: von Hand abschreiben'), () => wissenWaehlen('aus')],
  ], weiter);
}
function wissenWaehlen(w) {
  const W = wissenG(), Z = WISSENWAHL[w];
  W.wahl = w;
  if (w === 'alle' || w === 'uns') {
    SPIEL.cluster.wissen = Math.max(cluster('wissen'), Z.wissen);
    for (const o of ['birkenhain', 'eisenfurt']) if (ortBekannt(o)) SPIEL.beziehungen[o] = Math.max(-3, Math.min(3, (SPIEL.beziehungen[o] || 0) + Z[o]));
  } else { verbundStilllegen('wissen'); SPIEL.buecher = (SPIEL.buecher || 0) + Z.buecher; SPIEL.roboterSchrott = (SPIEL.roboterSchrott || 0) + Z.schrott; }
  const lore = 'wi_' + w; if (!hatLore(lore)) SPIEL.chronik.push(lore);
  const plaene = TX('Neu: Baupläne der Alten. Bauernhof, Wohnhaus, Lazi-Werkstatt und Wachturm bekommen eine vierte Ausbaustufe.');
  return w === 'alle' ? [
    ['erzaehler', TX('Ihr tippt die Namen ein. Der Archivar fragt nach: „ALLE SIND INGENIEURE? BITTE BESTÄTIGEN.“ Ihr bestätigt. Die Regale fahren auf, eines nach dem anderen, und das Licht seines Strahls wird warm.')],
    ['ebert', TX('Er hat nie Ingenieure gebraucht. Nur Leute, die fragen.')],
    ['erzaehler', plaene],
  ] : w === 'uns' ? [
    ['erzaehler', TX('„BERECHTIGT: 1 DORF. ALLE ANDEREN: BITTE WARTEN.“ Der Archivar gibt euch die Originale, versiegelt in Blechrollen. Hinter euch schließen sich die Regale.')],
    ['bodo', TX('Originale. Kein Gekritzel von Hand. Damit bauen wir billiger als alle anderen.')],
    ['erzaehler', plaene],
  ] : [
    ['erzaehler', TX('Hanne zieht dem Archivar die Linse heraus. Der Strahl erlischt, die Regale bleiben, wo sie sind. Ebert sitzt drei Nächte lang am Kartentisch und zeichnet ab.')],
    ['ebert', TX('Zwei Pläne. Mehr schaffen meine Augen nicht. Aber die verstehe ich jetzt bis zur letzten Schraube.')],
    ['erzaehler', TX('Neu: Baupläne der Alten, von Hand abgeschrieben. Bauernhof und Wohnhaus bekommen eine vierte Ausbaustufe.')],
  ];
}

// ---------------------------------------------------------------------
// Die vierte Stufe sieht man: Auf dem Dach steht ein Mast mit einer blauen Lampe und einer Planfahne.
// ---------------------------------------------------------------------
const BAUPLAN_BILD = new Map();
function bauplanBild(b0) {
  if (BAUPLAN_BILD.has(b0)) return BAUPLAN_BILD.get(b0);
  const q = b0.quelle, w = q.width, h = q.height, oben = Math.round(w * 0.3), c = document.createElement('canvas');
  c.width = w; c.height = h + oben;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(q, 0, oben);
  // Wo das Dach in der Mitte anfängt
  const d = g.getImageData(Math.floor(w / 2), 0, 1, c.height).data; let dach = c.height - 1;
  for (let y = 0; y < c.height; y++) if (d[y * 4 + 3] > 128) { dach = y; break; }
  const s = Math.max(1, Math.round(w / 44)), mx = Math.floor(w / 2) - s, top = Math.max(0, dach - oben);
  // Mast mit dunklem Rand, große Planfahne mit Umriss, oben eine blaue Lampe mit Schein (Grafik-Prüfer: muss auch vor vollem Hintergrund auffallen)
  g.fillStyle = '#101828'; g.fillRect(mx - 1, top + 3 * s, 2 * s + 2, dach - top - 2 * s);
  g.fillStyle = '#9aa6b8'; g.fillRect(mx, top + 3 * s, 2 * s, dach - top - 2 * s);
  g.fillStyle = '#101828'; g.fillRect(mx + 2 * s, top + 4 * s - 1, 13 * s + 1, 9 * s + 2);
  g.fillStyle = '#3a6ab0'; g.fillRect(mx + 2 * s, top + 4 * s, 12 * s, 9 * s);
  g.fillStyle = '#5a8ad8'; g.fillRect(mx + 2 * s, top + 4 * s, 12 * s, 2 * s);
  g.fillStyle = '#eaf6ff'; for (let k = 0; k < 3; k++) g.fillRect(mx + 4 * s, top + (7 + k * 2) * s, (k === 1 ? 6 : 8) * s, s);
  g.fillStyle = 'rgba(138,208,255,0.45)'; g.fillRect(mx - 2 * s, top - s < 0 ? 0 : top - s, 6 * s, 5 * s);
  g.fillStyle = '#8ad0ff'; g.fillRect(mx - s, top, 4 * s, 3 * s);
  g.fillStyle = '#ffffff'; g.fillRect(mx, top + s, 2 * s, s);
  const b = bild(c), k = b0.w / w; b.w = c.width * k; b.h = c.height * k;
  BAUPLAN_BILD.set(b0, b);
  return b;
}

// ---------------------------------------------------------------------
// Missionen
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  brandwache: { ...MISSIONSTEXTE.brandwache, ort: 'planarchiv', typ: 'brandwache', gefahr: 3,
    feld: { x: 16, zMin: -7.6, zMax: 11.6, flaechen: SAAL_FLAECHEN, zugaenge: SAAL_ZUGAENGE, freieDeko: true }, start: [0, -3.6], aufbau: () => aufbauPlanarchiv(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      const erst = wissenG().schritt < 2 && !wissenWahl();
      erg.gold += erst ? 40 : 20; erg.teile += erst ? 6 : 3; erg.material.buecher = (erg.material.buecher || 0) + (erst ? 5 : 2);
      if (erst) { erg.lore = ['wi_brand']; wissenG().schritt = 2; }
      clusterAendern('wissen', erst ? 8 : 3);
    } },
  archivar: { ...MISSIONSTEXTE.archivar, ort: 'planarchiv', typ: 'archivar', gefahr: 4,
    feld: { x: 16, zMin: -7.6, zMax: 11.6, flaechen: SAAL_FLAECHEN, zugaenge: SAAL_ZUGAENGE, freieDeko: true }, start: [0, 7], aufbau: () => aufbauPlanarchiv(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      erg.gold += 80; erg.teile += 14; erg.material.buecher = (erg.material.buecher || 0) + 6;
      erg.lore = ['wi_archivar']; if (wissenG().schritt < 3) wissenG().schritt = 3;
    } },
});

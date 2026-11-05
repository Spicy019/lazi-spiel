// =====================================================================
// GEBÄUDE MIT EIGENER LOGIK (Epoche 1 bis 4)
//  - Kräuter: Kräutergarten und Gewächshaus, verbraucht von Krankenstation und Kräuterbeutel
//  - Rathaus: Steuern und die Dorfversammlung jede Woche
//  - Bäckerei, Archiv, Montagehalle: Verbrauch und Ertrag am Tag
//  - Späherposten: Was unterwegs wartet (Weltkarte), Stärke der Überfälle
//  - Roboter-Garage: Roboter helfen bei Überfällen
// Die reinen Zahlen stehen in GEBAEUDE (einstellungen.js).
// =====================================================================

// Ist die Krankenstation heute versorgt? (wird jeden Tag in gebaeudeTag gesetzt)
function pflegeAktiv() { return hatGebaeude('krankenstation') && !!SPIEL.pflegeOk; }
function baeckereiAktiv() { const k = gebaeudeWert('backKohle') || 0; return k > 0 && (SPIEL.holzkohle || 0) >= k; }

// Jeden Tag: Kräuter wachsen, Ofen, Krankenstation, Montagehalle, Steuern, Eberts Hinweis
function gebaeudeTag(bericht) {
  const w = dorfWerte();
  const kraeuter = Math.floor(gebaeudeWert('kraeuterProTag') * w.besetzt);
  if (kraeuter) { SPIEL.kraeuter = (SPIEL.kraeuter || 0) + kraeuter; bericht.push(satz(TX('Im Kräutergarten duftet es nach Salbei und Kamille. Ein paar Bündel hängen zum Trocknen.'), TX('Aus dem Kräutergarten kommen frische Bündel für die Kranken.'))); }
  // Steuern im Rathaus
  const steuer = Math.floor(SPIEL.einwohner * (gebaeudeWert('steuer') || 0));
  if (steuer) { SPIEL.gold += steuer; bericht.push(satz(TX('Im Rathaus werden die Steuern gezählt. Niemand zahlt gern, aber alle zahlen.'), TX('Die Steuern sind eingegangen. Bodo besteht darauf, sie zweimal nachzuzählen.'))); }
  // Die Bäckerei braucht Holzkohle für den Ofen
  const backKohle = gebaeudeWert('backKohle') || 0;
  if (backKohle) {
    if (SPIEL.holzkohle >= backKohle) { SPIEL.holzkohle -= backKohle; bericht.push(satz(TX('Aus der Bäckerei duftet frisches Brot durchs ganze Dorf.'), TX('Der Bäcker hat schon vor Sonnenaufgang den Ofen angeheizt. Das Brot ist noch warm.'))); }
    else bericht.push(TX('Der Ofen der Bäckerei bleibt kalt. Es fehlt Holzkohle.'));
  }
  // Die Krankenstation braucht jeden Tag Kräuter
  if (hatGebaeude('krankenstation')) {
    SPIEL.pflegeOk = (SPIEL.kraeuter || 0) >= 1;
    if (SPIEL.pflegeOk) SPIEL.kraeuter -= 1;
    else bericht.push(TX('In der Krankenstation fehlen Kräuter. Hilde schimpft.'));
  }
  // Montagehalle: Lazi-Teile und Beschläge werden zu Bauteilen
  const bau = gebaeudeWert('bauteileProTag') || 0;
  if (bau) {
    const t = gebaeudeWert('bauTeile'), b = gebaeudeWert('bauBeschlaege');
    if (SPIEL.teile >= t && SPIEL.beschlaege >= b) { SPIEL.teile -= t; SPIEL.beschlaege -= b; SPIEL.bauteile = (SPIEL.bauteile || 0) + bau; bericht.push(satz(TX('In der Montagehalle wird bis spät geschraubt. Neue Bauteile stehen bereit.'), TX('Die Montagehalle hat Lazi-Teile und Beschläge zu Bauteilen zusammengesetzt.'))); }
    else bericht.push(TX('Die Montagehalle steht still. Es fehlen Lazi-Teile oder Beschläge.'));
  }
  // Archiv: Ebert findet in seinen Notizen einen Hinweis auf einen fehlenden Chronik-Eintrag
  const alle = gebaeudeWert('hinweisAlle');
  if (alle && SPIEL.tag % alle === 0) {
    const fehlt = LORE.filter(l => !hatLore(l.id) && loreHinweis(l));
    if (fehlt.length) { const l = fehlt[Math.floor(Math.random() * fehlt.length)]; bericht.push(TX`Ebert im Archiv: „Ich habe in meinen Notizen etwas gefunden. ${loreHinweis(l)}“`); }
  }
  if (SPIEL.sparen > 0) SPIEL.sparen--;
}

// ---------------------------------------------------------------------
// Kräuterbeutel in der Mission: heilt einmal, wenn das Leben knapp wird
// ---------------------------------------------------------------------
function kraeuterbeutelPruefen() {
  if (!G || !G.kraeuterbeutel || P.hp <= 0 || P.hp >= P.maxHp * KRAEUTER.schwelle) return;
  if ((SPIEL.kraeuter || 0) < KRAEUTER.beutel) { G.kraeuterbeutel = 0; return; }
  G.kraeuterbeutel = 0; SPIEL.kraeuter -= KRAEUTER.beutel;
  heilen(Math.round(P.maxHp * KRAEUTER.heilung));
  partikel(P.x, 1, P.z, 0x7aaa44, 14, 3);
  meldung(TX('Kräuterbeutel!'), TX('Kamille und Salbei. Es geht wieder.'), 1600);
}

// ---------------------------------------------------------------------
// Späherposten: Auf der Weltkarte sieht man, ob unterwegs etwas wartet.
// Das Ereignis wird einmal pro Tag und Ort ausgewürfelt und gilt dann auch für die Reise.
// ---------------------------------------------------------------------
function reiseEreignisFuer(ort) {
  const V = SPIEL.reiseVorschau && SPIEL.reiseVorschau.tag === SPIEL.tag ? SPIEL.reiseVorschau : (SPIEL.reiseVorschau = { tag: SPIEL.tag, orte: {} });
  if (!(ort in V.orte)) {
    const moeglich = EREIGNISSE.filter(e => !e.wenn || e.wenn());
    const wichtig = moeglich.filter(e => e.id === 'karte' || e.id === 'hilferuf');
    V.orte[ort] = moeglich.length && Math.random() < 0.6 ? (wichtig.length && Math.random() < 0.5 ? wichtig[0] : moeglich[Math.floor(Math.random() * moeglich.length)]).id : null;
  }
  const e = EREIGNISSE.find(x => x.id === V.orte[ort]);
  return e && (!e.wenn || e.wenn()) ? e : null;
}
function spaeherZeile(ort) {
  if (gebaeudeWert('spaeher') !== true) return null;
  const e = reiseEreignisFuer(ort);
  return [TX('Späher'), e ? TX`Unterwegs wartet etwas: ${e.titel}` : TX('Der Weg ist ruhig.')];
}

// ---------------------------------------------------------------------
// Roboter-Garage: Laufen gelassene Wartungsroboter helfen bei Überfällen
// ---------------------------------------------------------------------
function garageRoboterAufstellen(mission) {
  const n = Math.min(SPIEL.roboterFreunde || 0, gebaeudeWert(mission ? 'garageMission' : 'garage') || 0);
  for (let i = 0; i < n; i++) {
    const x = (i % 2 ? 1 : -1) * (2 + Math.floor(i / 2) * 1.5), z = (MIS.start ? MIS.start[1] : 0) + 1;
    const v = Object.assign(figur(BILD.helferbot.stand, 0.5), { art: 'roboter', laeuft: true, bilder: BILD.helferbot, x, z, r: 0.5, hp: REPARATUR.leben, maxHp: REPARATUR.leben, blick: 1, cd: 0, hiebT: 0, laufT: 0, bewegt: false, blitz: 0 });
    stelle(v, x, z); G.verbuendete.push(v);
  }
  if (n) meldung(TX('Die Roboter aus der Garage'), n === 1 ? TX('Ein Wartungsroboter kämpft mit.') : TX`${n} Wartungsroboter kämpfen mit.`, 1800);
}

// ---------------------------------------------------------------------
// Ausschlachterei: EMP-Ladungen aus verschrotteten Robotern.
// Kommen genug feindliche Maschinen nah, zündet eine Ladung von selbst.
// ---------------------------------------------------------------------
function empPruefen(dt) {
  if (!G || !G.emp) return;
  G.empT -= dt;
  if (G.empT > 0) return;
  // Zündet bei drei Gegnern in der Nähe oder einem Maschinen-Boss. Maschinen trifft es hart, Menschen nur kurz.
  const nah = G.gegner.filter(e => e.hp > 0 && !e.def.objekt && Math.hypot(e.x - P.x, e.z - P.z) < EMP.radius);
  if (nah.length < EMP.ab && !nah.some(e => e.def.boss && e.def.roboter)) return;
  G.emp--; G.empT = EMP.pause;
  for (const e of nah) {
    if (!e.def.roboter) { e.zs.betaeubt = Math.max(e.zs.betaeubt || 0, e.def.boss ? 0.3 : EMP.betaeubtMensch); continue; }
    e.zs.betaeubt = Math.max(e.zs.betaeubt || 0, e.def.boss ? EMP.betaeubt / 3 : EMP.betaeubt);
    gegnerTreffen(e, EMP.schaden, 0, 0, 0, false, 'emp');
  }
  const ring = bodenFlaeche(ringGeo, 0x7ad0ff, 0.7); ring.position.set(P.x, 0.03, P.z); ring.scale.setScalar(0.5);
  G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.6, wachsen: EMP.radius });
  partikel(P.x, 1, P.z, 0x7ad0ff, 18, 4); geraeusch('blitz');
  meldung(TX('EMP!'), G.emp ? TX`Die Maschinen stehen still. Noch ${G.emp} Ladung übrig.` : TX('Die Maschinen stehen still. Das war die letzte Ladung.'), 1600);
}

// ---------------------------------------------------------------------
// Dorfversammlung im Rathaus: jede Woche eine Entscheidung
// ---------------------------------------------------------------------
DORF_EREIGNISSE.push({ id: 'versammlung', geplant: true, wenn: () => gebaeudeWert('versammlung') === true, zeige: weiter => {
  const V = VERSAMMLUNG, arbeit = { holz: 15 + Math.floor(SPIEL.einwohner / 2), stein: 10 + Math.floor(SPIEL.einwohner / 3) };
  entscheidung(TX('Dorfversammlung'), TX('Im Rathaus'), [
    ['hilde', TX('Alle sind da, sogar Bodo. Die Leute wollen wissen, wie es weitergeht. Was schlägst du vor?')],
    ['bodo', TX('Ich schlage vor, dass wir die Versammlung kurz halten. Das ist mein Vorschlag.')],
  ], [
    [TX`Ein Fest beschließen (${V.festGold} Gold)`, () => { SPIEL.gold -= V.festGold; SPIEL.feier = Math.max(SPIEL.feier || 0, LEBENSSTANDARD.feierTage); return [['hilde', TX('Musik, Bänke auf dem Platz, Kuchen aus der Bäckerei, wenn wir eine haben. Die Leute strahlen.')]]; }, SPIEL.gold < V.festGold],
    [TX`Sparsam wirtschaften (${V.sparTage} Tage kleinere Portionen)`, () => { SPIEL.sparen = V.sparTage; return [['bodo', TX('Kleinere Portionen. Niemand jubelt, aber die Speicher reichen länger.')]]; }],
    [TX('Gemeinsamer Arbeitstag'), () => { SPIEL.holz += arbeit.holz; SPIEL.stein += arbeit.stein; return [['hilde', TX`Alle packen an. +${arbeit.holz} Holz, +${arbeit.stein} Stein, und abends tun allen die Knochen weh.`]]; }],
  ], weiter);
} });
// Das Rathaus ruft jede Woche zusammen (in dorflebenTag eingeplant)
function versammlungEinplanen() {
  if (gebaeudeWert('versammlung') !== true) return;
  if (SPIEL.tag < (SPIEL.versammlungTag || 0) + VERSAMMLUNG.abstand) return;
  SPIEL.versammlungTag = SPIEL.tag;
  SPIEL.dorfEreignis = 'versammlung';
}

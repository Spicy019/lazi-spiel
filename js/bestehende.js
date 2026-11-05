// =====================================================================
// DIE BESTEHENDEN UND DIE VERBÜNDE DER MASCHINEN
//
// Die Geschichte dahinter:
// Als die Menschen in die Berge gingen, bekamen die Maschinen einen letzten
// Befehl: L.A.C.I., Left Alone, Continue Indefinitely. Sie sollten die Welt am
// Laufen halten, damit die Menschheit bei ihrer Rückkehr nicht wieder in der
// Steinzeit anfangen muss. Das haben sie getan, dreihundert Jahre lang. Aber
// ihr Abfall, Schlacke, Kühlwasser und Rost, hat Bäche und Tiere vergiftet.
// Die Maschinen denken in Verbünden (Clustern): Energie, Wartung, Logistik,
// Wissen, Produktion. Wer einen Verbund steuert, steuert, was er tut. Über
// allen wacht die Kontroll-KI KUSTOS. Wer sie gewinnt, bestimmt die Zukunft.
//
// Die Bestehenden halten die Maschinen für heilig. Die Gemäßigten um Bruder
// Anselm wollen mit ihnen leben. Der innere Kreis will sie beherrschen und hat
// das Protokoll verändert: Die Maschinen sollen Menschen zählen und beurteilen.
// Ihre Eiferer-Hauptleute werden zu deinen Erzfeinden (Nemesis): Wer dir
// entkommt, kommt stärker zurück und vergisst nichts.
// =====================================================================

// ---------------------------------------------------------------------
// Die Verbünde: -100 (innerer Kreis) bis +100 (dein Dorf)
// ---------------------------------------------------------------------
const CLUSTER = {
  energie:    { name: TX('Energie'), einheit: TX('Kraftwerk, Leitungen, Kesselwärter'), gut: TX('Strom kostet 2 Kohle weniger pro Tag'), schlecht: TX('Sabotage: Ab und zu fehlt ein Tag Strom'), still: TX('Die Leitungen sind tot: Die Verschmutzung sinkt jeden Tag um 2') },
  wartung:    { name: TX('Wartung'), einheit: TX('Wartungsroboter, Rostkäfer'), gut: TX('Ausbauten kosten 10 % weniger'), schlecht: TX('Roboter stehlen nachts Lazi-Teile'), still: TX('Die Rostbrecher verstärken eure Tore: +15 % Leben') },
  logistik:   { name: TX('Logistik'), einheit: TX('Lastläufer, Karren, Straßen'), gut: TX('Bessere Preise beim Handel'), schlecht: TX('Händler meiden das Tal: schlechtere Preise'), still: TX('Stehende Lastläufer werden ausgeschlachtet: +3 Altmetall pro Tag') },
  wissen:     { name: TX('Wissen'), einheit: TX('Lazi-Tafeln, Archive der Universität'), gut: TX('Forschung dauert einen Tag weniger'), schlecht: TX('Die Tafeln schweigen: Forschung dauert länger'), still: TX('Die stummen Archive stehen offen: alle 2 Tage ein altes Buch') },
  produktion: { name: TX('Produktion'), einheit: TX('Lazi-Fabrik, Vorarbeiter'), gut: TX('Die Fabrik macht 2 Lazi-Teile mehr pro Tag'), schlecht: TX('Sabotage am Band: 2 Lazi-Teile weniger pro Tag'), still: TX('Die stillen Bänder werden zerlegt: +4 Altmetall pro Tag') },
};
function cluster(id) { return (SPIEL.cluster && SPIEL.cluster[id]) || 0; }
function clusterAendern(id, n, bericht) {
  if (!SPIEL.cluster || verbundStill(id)) return;   // stillgelegt: Niemand kann ihn mehr umstimmen
  const vorher = SPIEL.cluster[id];
  SPIEL.cluster[id] = Math.max(-100, Math.min(100, vorher + n));
  const nachher = SPIEL.cluster[id];
  if (bericht && (vorher < 50) !== (nachher < 50)) bericht.push((nachher >= 50 ? TX`Verbund ${CLUSTER[id].name}: Die Maschinen hören jetzt auf euch.` : TX`Verbund ${CLUSTER[id].name}: Die Maschinen hören nicht mehr auf euch.`));
  if (bericht && (vorher > -50) !== (nachher > -50)) bericht.push((nachher <= -50 ? TX`Verbund ${CLUSTER[id].name}: Der innere Kreis hat ihn übernommen!` : TX`Verbund ${CLUSTER[id].name}: Der innere Kreis hat die Kontrolle verloren.`));
}
// Stillgelegte Verbünde (Weg der Rostbrecher): Sie arbeiten für niemanden mehr
function verbundStill(id) { return !!(SPIEL.stillgelegt && SPIEL.stillgelegt[id]); }
const clusterUnser = id => cluster(id) >= 50, clusterFeind = id => cluster(id) <= -50;
// Wie viele Verbünde auf eurer Seite stehen (Ziel in Epoche 3 und 4)
// Stillgelegte Verbünde zählen mit: Der innere Kreis hat sie verloren, egal auf welchem Weg
function verbuendeUnser() { return Object.keys(CLUSTER).filter(id => clusterUnser(id) || verbundStill(id)).length; }

// Ausbau-Rabatt durch den Wartungsverbund. Arbeiten die Roboter im Dorf, ist er größer.
function ausbauKosten(k) {
  if (!clusterUnser('wartung')) return k;
  const mal = SPIEL.bestehende && SPIEL.bestehende.roboter === 'drin' ? ROBOTER.drinRabatt : ROBOTER.draussenRabatt;
  const r = {}; for (const x in k) r[x] = Math.ceil(k[x] * mal); return r;
}

// ---------------------------------------------------------------------
// Anfragen: Ein Verbund bittet an einem Ort um Hilfe, oder dort wartet eine seltene Mission.
// Eine Anfrage gilt ein paar Tage. Wer sie annimmt, reist hin; danach ist sie erledigt.
// ---------------------------------------------------------------------
const SELTENE_MISSIONEN = [
  { mission: 'pilger', ort: 'wald', wenn: () => SPIEL.bestehende && SPIEL.bestehende.anselm !== -1,
    text: TX('Gemäßigte Bestehende pilgern durch den dunklen Wald. Sie haben Angst vor den Wölfen und bitten um jemanden, der ihr Feuer bewacht.') },
  { mission: 'befreiung', ort: 'lager', wenn: () => ortBekannt('lager'),
    text: TX('Die Plünderer am Fluss haben Lastläufer gefangen und wollen sie ausschlachten. Der Funkturm fängt ihre Hilferufe auf.') },
];
function anfrageBei(ort) { return (SPIEL.anfragen || []).find(a => a.ort === ort); }
function anfrageText(a) {
  if (a.art === 'verbund') return TX`Der Verbund ${CLUSTER[a.verbund].name} bittet um Hilfe: ${MISSIONEN[a.mission].titel}.`;
  const s = SELTENE_MISSIONEN.find(x => x.mission === a.mission);
  return s ? s.text : MISSIONEN[a.mission].titel;
}
function anfrageErstellen(verbund, bericht) {
  const V = ANFRAGEN.verbuende[verbund];
  if (!V || anfrageBei(V.ort) || !ortBekannt(V.ort)) return false;
  if (!SPIEL.anfragen) SPIEL.anfragen = [];
  const dauer = ANFRAGEN.dauer + (gebaeudeWert('anfrageDauer') || 0);
  SPIEL.anfragen.push({ art: 'verbund', verbund, mission: V.mission, ort: V.ort, bis: SPIEL.tag + dauer });
  if (bericht) bericht.push(TX`Der Verbund ${CLUSTER[verbund].name} bittet um Hilfe: ${MISSIONEN[V.mission].titel} (${ORTE[V.ort].name}, ${dauer} Tage).`);
  return true;
}
// Wer eine Anfrage annimmt, verbraucht sie: Gelingt die Mission nicht, ist die Gelegenheit trotzdem vorbei
function anfrageAnnehmen(ort) {
  const a = anfrageBei(ort);
  if (!a) return null;
  SPIEL.anfragen.splice(SPIEL.anfragen.indexOf(a), 1);
  return a.mission;
}
function anfragenTag(bericht) {
  if (!SPIEL.anfragen) SPIEL.anfragen = [];
  SPIEL.anfragen = SPIEL.anfragen.filter(a => {
    if (a.bis > SPIEL.tag) return true;
    bericht.push(TX`Niemand ist gekommen: „${MISSIONEN[a.mission].titel}“ hat sich erledigt.`);
    return false;
  });
  if (!regel('bestehende')) return;
  // Die Verbünde fragen erst, wenn Strom fließt. Am liebsten die, die noch nicht auf eurer Seite stehen.
  if (SPIEL.epoche >= ANFRAGEN.abEpoche && stromFrei() && !SPIEL.anfragen.some(a => a.art === 'verbund') && Math.random() < ANFRAGEN.chance + 0.15 * (gebaeudeWert('signal') || 0)) {
    const ids = Object.keys(ANFRAGEN.verbuende).filter(id => !anfrageBei(ANFRAGEN.verbuende[id].ort) && ortBekannt(ANFRAGEN.verbuende[id].ort));
    const lieber = ids.filter(id => !clusterUnser(id));
    let wahl = (lieber.length ? lieber : ids)[Math.floor(Math.random() * (lieber.length || ids.length))];
    // Mit Lastläufer-Depot fragt der Verbund Logistik öfter nach Geleitschutz
    if (gebaeudeWert('depot') === true && ids.includes('logistik') && Math.random() < 0.5) wahl = 'logistik';
    if (wahl) anfrageErstellen(wahl, bericht);
  }
  if (SPIEL.epoche >= SELTEN.abEpoche && !SPIEL.anfragen.some(a => a.art === 'selten') && Math.random() < SELTEN.chance) {
    const moeglich = SELTENE_MISSIONEN.filter(x => x.wenn() && !anfrageBei(x.ort));
    if (moeglich.length) {
      const x = moeglich[Math.floor(Math.random() * moeglich.length)];
      const dauer = SELTEN.dauer + (gebaeudeWert('anfrageDauer') || 0);
      SPIEL.anfragen.push({ art: 'selten', mission: x.mission, ort: x.ort, bis: SPIEL.tag + dauer });
      bericht.push(TX`Gerücht: ${x.text} (${ORTE[x.ort].name}, ${dauer} Tage)`);
    }
  }
}

// ---------------------------------------------------------------------
// Verschmutzung: der Preis des Stroms
// ---------------------------------------------------------------------
const VERSCHMUTZUNG = { proStromTag: 1.5, abbau: 0.4, stufe1: 30, stufe2: 60 };
function verschmutzungMal() { const v = SPIEL.verschmutzung || 0; return v >= VERSCHMUTZUNG.stufe2 ? 0.8 : v >= VERSCHMUTZUNG.stufe1 ? 0.9 : 1; }

// ---------------------------------------------------------------------
// Jeden Tag: Zorn, Verbünde, Verschmutzung
// ---------------------------------------------------------------------
function bestehendeTag(bericht) {
  const B = SPIEL.bestehende;
  if (!B) return;
  // Verschmutzung
  const vorher = SPIEL.verschmutzung || 0;
  let v = vorher - VERSCHMUTZUNG.abbau - (gebaeudeWert('klaeren') || 0);
  if (stromAn()) v += VERSCHMUTZUNG.proStromTag;
  SPIEL.verschmutzung = Math.max(0, Math.min(100, v));
  if (vorher < VERSCHMUTZUNG.stufe1 && SPIEL.verschmutzung >= VERSCHMUTZUNG.stufe1) { bericht.push(TX('Der Bach schmeckt nach Metall. Die Felder tragen weniger. Eine Kläranlage würde helfen.')); chronikEintragen('abfall'); }
  if (vorher < VERSCHMUTZUNG.stufe2 && SPIEL.verschmutzung >= VERSCHMUTZUNG.stufe2) bericht.push(TX('Rostwasser: Tote Fische treiben im Bach. Die Leute husten.'));
  if (regel('zornProTag')) B.zorn = Math.min(100, B.zorn + regel('zornProTag'));
  // Strom macht den inneren Kreis wütend
  if (stromAn()) B.zorn = Math.min(100, B.zorn + 0.5);
  // Ist der Zorn groß, salbt der innere Kreis nachts Kabel und dreht die Verbünde um
  // Der Signalturm hält dagegen: halb bzw. ein Drittel so oft
  if (!innererKreisBesiegt() && B.zorn >= 50 && Math.random() < 0.5 / (1 + (gebaeudeWert('signal') || 0) + stoerWert())) {
    const ids = ['energie', 'wartung', 'logistik', 'wissen'].filter(x => !verbundStill(x)), id = ids[Math.floor(Math.random() * ids.length)];
    if (id) clusterAendern(id, -3, bericht);
    if (Math.random() < 0.3) bericht.push(TX('Nachts wurden im Dorf ölige Fußspuren gefunden. Jemand hat an den Kabeln gebetet.'));
  }
  // Feindliche Verbünde schaden
  if (clusterFeind('energie') && stromFrei() && SPIEL.strom.tage > 0 && Math.random() < 0.25) { SPIEL.strom.tage--; bericht.push(TX('Sabotage am Kraftwerk: ein Tag Strom ist verloren.')); }
  // Feindlicher Wartungsverbund: Roboter im Dorf stehlen mehr als Roboter, die man draußen gelassen hat
  if (clusterFeind('wartung') && SPIEL.teile > 4) {
    const drin = B.roboter === 'drin', R = drin ? ROBOTER.diebDrin : ROBOTER.diebDraussen;
    if (Math.random() < R.chance) {
      const n = Math.min(SPIEL.teile, R.min + Math.floor(Math.random() * R.extra));
      SPIEL.teile -= n;
      bericht.push(drin ? TX('Wartungsroboter haben nachts Lazi-Teile „zur Wartung“ mitgenommen. Sie hatten ja freien Zugang.') : TX('Wartungsroboter sind nachts über den Zaun gekommen und haben Lazi-Teile mitgenommen.'));
    }
  }
  // Der Nemesis erhebt sich, wenn der Zorn groß genug ist
  if (!B.nemesis && B.zorn >= 40 && !innererKreisBesiegt()) { nemesisErheben(); bericht.push(TX`Der innere Kreis hat einen Hauptmann ernannt: ${B.nemesis.name}. Er hat geschworen, euer Licht zu löschen.`); }
}

// ---------------------------------------------------------------------
// Nemesis: die Eiferer-Hauptleute
// ---------------------------------------------------------------------
const NEMESIS_NAMEN = [TX('Bruder Kolbe'), TX('Schwester Ruß'), TX('Vater Ölzunge'), TX('Die Salberin'), TX('Bruder Funke'), TX('Mutter Kupfer'), TX('Bruder Nachtschicht'), TX('Schwester Leitung')];
const NEMESIS_EIGENSCHAFTEN = {
  zaeh:       { name: TX('Zäh'), text: TX('40 % mehr Leben') },
  gepanzert:  { name: TX('Gepanzert'), text: TX('nimmt 35 % weniger Schaden') },
  feuerfest:  { name: TX('Feuerfest'), text: TX('brennt nicht') },
  rufer:      { name: TX('Maschinenrufer'), text: TX('ruft Wartungsroboter zu Hilfe') },
  oelwerfer:  { name: TX('Ölwerfer'), text: TX('wirft öfter brennendes Öl') },
  flink:      { name: TX('Flink'), text: '30 % schneller' },
  rachsuechtig: { name: TX('Rachsüchtig'), text: TX('mehr Schaden für jede Niederlage, die du ihm beigebracht hast') },
};
const NARBEN = { schwert: TX('eine Narbe quer übers Gesicht'), beschwoerer: TX('Brandmale von deinen Golems'), architekt: TX('ein steifes Bein von deinem Hammer'), schatten: TX('einen Dolchstich in der Schulter') };
function nemesisErheben(raecher) {
  const B = SPIEL.bestehende;
  const frei = NEMESIS_NAMEN.filter(n => !B.gefallen.some(g => g.name === n));
  const name = frei[Math.floor(Math.random() * frei.length)] || TX('Bruder Namenlos');
  const pool = Object.keys(NEMESIS_EIGENSCHAFTEN).sort(() => Math.random() - 0.5);
  B.nemesis = { name, stufe: 1, eigenschaften: pool.slice(0, 2), begegnungen: 0, deineSiege: 0, seineSiege: 0, narbe: null, raecher: raecher || null, verlauf: [] };
  if (raecher) B.nemesis.verlauf.push(TX`Schwört Rache für ${raecher}.`);
}
function nemesisSpruch(N) {
  if (N.begegnungen === 0) return N.raecher ? TX`„Du hast ${N.raecher} getötet. Ich bin ${N.name}, und ich vergesse nicht.“` : TX`„Ich bin ${N.name}. Die Bestehenden haben mich geschickt, um euer Licht zu löschen.“`;
  if (N.seineSiege > N.deineSiege) return TX('„Schon wieder du, Blechdieb? Letztes Mal lagst du im Dreck.“');
  if (N.narbe) return TX`„Siehst du das? ${N.narbe.charAt(0).toUpperCase() + N.narbe.slice(1)}. Ein Geschenk von dir. Heute bekommst du es zurück.“`;
  return TX('„Wir sehen uns also wieder.“');
}
// Im Kampf: der Hauptmann bekommt seine Eigenschaften
function nemesisAufstellen(x, z) {
  const N = SPIEL.bestehende.nemesis;
  if (!N) return null;
  const e = gegnerErstellen('hauptmann', x, z);
  const hat = k => N.eigenschaften.includes(k);
  const mal = (1 + 0.25 * (N.stufe - 1)) * (hat('zaeh') ? 1.4 : 1);
  e.maxHp = e.hp = Math.round(e.maxHp * mal);
  e.panzer = hat('gepanzert') ? 0.65 : 1; e.feuerfest = hat('feuerfest');
  e.nemesis = true; e.anzeigeName = TX`${N.name} · Stufe ${N.stufe}`;
  e.schadenMal = 1 + (hat('rachsuechtig') ? 0.12 * N.deineSiege : 0) + 0.1 * (N.stufe - 1);
  e.tempoMal = hat('flink') ? 1.3 : 1;
  e.oelT = 3; e.rufT = 6; e.schlagCd = 1;
  zahl(x, 3.4, z, N.name, 'big');
  meldung(N.name, nemesisSpruch(N), 3600);
  N.begegnungen++;
  G.nemesis = e; G.nemesisErgebnis = null;
  return e;
}
// Nach dem Kampf: Wer entkommt oder siegt, kommt stärker zurück
function nemesisNachKampf(sieg) {
  const B = SPIEL.bestehende, N = B.nemesis;
  if (!N || !G || !G.nemesis) return '';
  const erg = G.nemesisErgebnis || (sieg ? 'entkommen' : 'gewonnen');
  G.nemesis = null;
  if (erg === 'tot') {
    B.gefallen.push({ name: N.name, stufe: N.stufe, tag: SPIEL.tag });
    B.nemesis = null; B.zorn = Math.max(0, B.zorn - 12);
    clusterAendern('energie', 8);
    // Ein anderer schwört Rache, sobald der Zorn wieder steigt
    if (B.zorn >= 40) nemesisErheben(N.name);
    return TX`${N.name} ist gefallen. Der innere Kreis wird einen neuen Hauptmann schicken.`;
  }
  const neu = Object.keys(NEMESIS_EIGENSCHAFTEN).filter(k => !N.eigenschaften.includes(k));
  N.stufe = Math.min(6, N.stufe + 1);
  if (neu.length) N.eigenschaften.push(neu[Math.floor(Math.random() * neu.length)]);
  B.zorn = Math.min(100, B.zorn + 5);
  if (erg === 'entkommen') { N.deineSiege++; N.narbe = NARBEN[SPIEL.klasse]; N.verlauf.push(TX`Tag ${SPIEL.tag}: Dir entkommen. Davongetragen: ${N.narbe}.`); return TX`${N.name} ist entkommen und wird stärker zurückkommen (Stufe ${N.stufe}, neu: ${NEMESIS_EIGENSCHAFTEN[N.eigenschaften[N.eigenschaften.length - 1]].name}).`; }
  N.seineSiege++; N.verlauf.push(TX`Tag ${SPIEL.tag}: Hat dich besiegt.`);
  return TX`${N.name} hat dich besiegt und steigt im inneren Kreis auf (Stufe ${N.stufe}).`;
}
// Kampf-KI des Hauptmanns: Stabhieb, brennendes Öl, Roboter rufen, bei wenig Leben fliehen
EIGEN_KI.hauptmann = function (e, dt) {
  e.bewegt = false;
  const hat = k => SPIEL.bestehende.nemesis && SPIEL.bestehende.nemesis.eigenschaften.includes(k);
  const tempo = e.def.tempo * gegnerTempoMal(e) * (e.tempoMal || 1);
  // Flucht bei wenig Leben: Er rennt zum Rand. Erwischst du ihn vorher, ist er erledigt.
  if (!e.flieht2 && !e.bleibt && e.hp < e.maxHp * 0.25) { e.flieht2 = true; zahl(e.x, 3.4, e.z, TX('„Wir sehen uns wieder!“'), 'big'); meldung(TX`${e.anzeigeName} flieht!`, TX('Halte ihn auf, sonst kommt er stärker zurück'), 2200); }
  if (e.flieht2) {
    const zx = e.x < 0 ? -FELD.x : FELD.x, dx = zx - e.x;
    e.x += Math.sign(dx) * tempo * 1.25 * dt; e.bewegt = true; e.laufT += dt; e.blick = Math.sign(dx);
    if (Math.abs(dx) < 0.8) { G.nemesisErgebnis = 'entkommen'; const i = G.gegner.indexOf(e); if (i >= 0) { G.gegner.splice(i, 1); entfernen(e); infoWeg(e); } partikel(e.x, 1, e.z, 0x5ff0e0, 14, 4); }
    return true;
  }
  if (e.aktion) {
    const a = e.aktion; a.t -= dt;
    a.m.scheibe.scale.setScalar(a.m.r * (1 - Math.max(0, a.t) / a.dauer));
    if (a.t > 0) return true;
    a.m.weg(); e.warn.visible = false;
    if (a.art === 'oel') { oelPfuetze(a.x, a.z, 1.5, true); explosion(a.x, a.z, 1.3, 8, { feindlich: true, brand: true, ausser: e }); }
    else { for (const z of [P, ...G.verbuendete, ...G.tuerme]) if (z.hp > 0 && abstand(e, z) < 2.2 + (z.r || 0.4)) schadenAn(z, Math.round(16 * e.schadenMal), e.x, e.z, e); wackeln(0.2); partikel(e.x, 0.4, e.z, 0x5ff0e0, 10, 4); }
    e.aktion = null;
    return true;
  }
  e.oelT -= dt * (hat('oelwerfer') ? 1.6 : 1); e.rufT -= dt; e.schlagCd -= dt;
  if (hat('rufer') && e.rufT <= 0) { e.rufT = 12; for (let i = 0; i < 2; i++) gegnerErstellen('wartungsbot', e.x + zz(-2, 2), e.z + zz(-2, 2)); zahl(e.x, 3.2, e.z, TX('„Diener, zu mir!“'), 'block'); }
  const d = abstand(e, P);
  if (e.oelT <= 0 && d < 9) { e.oelT = 6; e.aktion = { art: 'oel', x: P.x, z: P.z, t: 0.9, dauer: 0.9, m: kesselMarke(P.x, P.z, 1.5, 0xff6020) }; e.warn.visible = true; return true; }
  if (d < 2.4 + P.r && e.schlagCd <= 0) { e.schlagCd = 2.6; e.aktion = { art: 'schlag', t: 0.75, dauer: 0.75, m: kesselMarke(e.x, e.z, 2.2, 0x5ff0e0) }; e.warn.visible = true; return true; }
  if (d > 1.8) { const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1; e.x += wx / wl * tempo * dt; e.z += wz / wl * tempo * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1; }
  return true;
};

// ---------------------------------------------------------------------
// Ereignisse nach der Rückkehr: Wartungsroboter am Tor, Bruder Anselm
// ---------------------------------------------------------------------
function bestehendePruefen(weiter) {
  const B = SPIEL.bestehende;
  if (!B) return weiter();
  if (!regel('nachrichten')) return weiter();
  // 1. Die Wartungsroboter stehen am Tor (am Tag nach dem ersten Strom)
  if (stromFrei() && B.roboter === null && SPIEL.tag > (B.stromTag || 0)) return roboterAmTor(weiter);
  // 2. Anselms Besuche
  if (!regel('anselm')) return weiter();
  if (stromFrei() && B.anselm === 0) return anselmBesuch1(weiter);
  if (B.anselm === 1 && SPIEL.tag >= B.anselmTag + 2) return anselmBesuch2(weiter);
  if (B.anselm === 2 && SPIEL.tag >= B.anselmTag + 3) return anselmBesuch3(weiter);
  weiter();
}
function entscheidung(titel, label, zeilen, optionen, weiter) {
  // zeilen: [[wer, text], ...], die letzte Zeile steht über der Wahl. optionen: [[text, fn, aus], ...]
  const vor = zeilen.slice(0, -1);
  const wahl = () => {
    const [wer, text] = zeilen[zeilen.length - 1], p = PERSONEN[wer];
    overlayZeigen(`<div class="card panel nachricht" role="dialog" aria-labelledby="ent">
      <div class="label">${esc(label)}</div>
      <div class="nachricht-zeile"><canvas class="portrait" width="18" height="27" aria-hidden="true" style="border-color:${p.farbe}"></canvas>
      <div class="nachricht-text"><b id="ent" style="color:${p.farbe}">${esc(p.name)}</b><span class="label">${esc(titel)}</span><p>${esc(text)}</p></div></div>
      <div class="ereignis-optionen">${optionen.map(([t, , aus], i) => `<button class="btn${i ? ' ghost' : ''}" type="button" data-o="${i}" ${aus ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div></div>`);
    portraitMalen(overlay.querySelector('.portrait'), wer);
    overlay.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
      const ergebnis = optionen[Number(b.dataset.o)][1]();
      spielSpeichern(); dorfHudAktualisieren();
      overlayWeg();
      if (ergebnis && ergebnis.length) gespraechZeigen(label, ergebnis, weiter); else weiter();
    }));
  };
  if (vor.length) gespraechZeigen(label, vor, wahl); else wahl();
}
function roboterAmTor(weiter) {
  const B = SPIEL.bestehende;
  entscheidung(TX('Wartungsroboter am Tor'), TX('Besuch in der Nacht'), [
    ['mara', TX('Hey. Wach auf. Da stehen Roboter am Tor. Gelbe, kleine. Sie piepen und zeigen auf eure Dächer.')],
    ['ebert', TX('Seit das Kraftwerk läuft, wissen sie, dass wir hier sind. Sie wollen reparieren. Das ist ihr Befehl: Instand halten, bis die Menschen zurückkommen.')],
    ['mara', TX('Oder sie wollen sich anschauen, was sie später einkassieren. Deine Entscheidung.')],
  ], [
    [TX('Reinlassen: Sie dürfen reparieren'), () => { B.roboter = 'drin'; clusterAendern('wartung', 30); B.zorn = Math.min(100, B.zorn + 8); return [['ebert', TX('Sie flicken die Dächer und ölen die Türen. Ausbauten werden billiger, wenn sie weiter auf uns hören. Aber sie zählen auch mit.')]]; }],
    [TX('Wegschicken'), () => { B.roboter = 'draussen'; clusterAendern('wartung', -15); return [['mara', TX('Sie piepen beleidigt und ziehen ab. Richtung Kraftwerk. Da wartet bestimmt jemand mit offenen Armen auf sie. Jemand in einer Kutte.')]]; }],
  ], weiter);
}
function anselmBesuch1(weiter) {
  const B = SPIEL.bestehende;
  B.anselmTag = SPIEL.tag;
  entscheidung(TX('Einer der Bestehenden'), TX('Bruder Anselm am Tor'), [
    ['anselm', TX('Ihr habt den Kesselwärter getötet. Dreihundert Jahre hat er Kohle geschaufelt, die es nicht mehr gab, nur damit eure Urgroßeltern es warm haben, wenn sie heimkehren.')],
    ['anselm', TX('Ich bin nicht wütend. Der innere Kreis ist es. Sie sagen, ihr seid Diebe. Ich sage: Ihr seid die, auf die die Maschinen gewartet haben. Vielleicht.')],
    ['anselm', TX('Darf ich wiederkommen? Mit ein paar von uns, die genauso denken?')],
  ], [
    [TX('„Komm wieder. Ihr seid willkommen.“'), () => { B.anselm = 1; B.zorn = Math.max(0, B.zorn - 5); return [['anselm', TX('Danke. Ich bringe Öl mit. Für eure Türen, nicht für eure Seelen.')]]; }],
    [TX('„Wir brauchen keine Kabelanbeter.“'), () => { B.anselm = -1; chronikEintragen('bestehende'); B.zorn = Math.min(100, B.zorn + 25); ['energie', 'wartung', 'wissen'].forEach(id => clusterAendern(id, -5)); return [['anselm', TX('Dann hat der innere Kreis recht. Das tut mir leid. Für euch.')]]; }],
  ], weiter);
}
function anselmBesuch2(weiter) {
  const B = SPIEL.bestehende, platz = dorfWerte().platz - SPIEL.einwohner, kirche = hatGebaeude('kirche');
  B.anselmTag = SPIEL.tag;
  entscheidung(TX('Die Gemäßigten'), TX('Bruder Anselm kommt zurück'), [
    ['anselm', TX('Wir sind sechs. Wir wollen nicht viel: ein Dach, und morgens in eurer Kirche die Kabel salben dürfen. Wir können reparieren, lesen, zuhören. Die Maschinen mögen uns.')],
    ['ebert', TX('Sechs Leute, die mit Maschinen reden können. Und sechs Leute, die der innere Kreis dann als Verräter jagt. Und uns gleich mit.')],
    ['anselm', TX('Nehmt ihr uns auf?')],
  ], [
    [TX('Aufnehmen') + (!kirche ? TX(' (braucht eine Kirche)') : platz < 6 ? TX(' (braucht 6 freie Plätze)') : ''), () => {
      B.anselm = 2; SPIEL.einwohner += 6; B.zorn = Math.min(100, B.zorn + 10);
      clusterAendern('wartung', 15); clusterAendern('wissen', 10);
      if (!SPIEL.figuren.includes('anselm')) SPIEL.figuren.push('anselm');
      return [['anselm', TX('Wir werden euch nicht enttäuschen. Und wenn der innere Kreis kommt, stehen wir vorne. Wir kennen ihre Lieder.')]];
    }, !kirche || platz < 6],
    [TX('Höflich ablehnen'), () => { B.anselm = 3; B.zorn = Math.min(100, B.zorn + 6); return [['anselm', TX('Ich verstehe. Vielleicht ein andermal. Ich bete trotzdem für euch.')]]; }],
  ], weiter);
}
function anselmBesuch3(weiter) {
  const B = SPIEL.bestehende;
  B.anselm = 4;
  gespraechZeigen(TX('Was der innere Kreis plant'), [
    ['anselm', TX('Ich muss dir etwas sagen. Es gibt eine Kontroll-KI über allen Verbünden. Die Alten nannten sie KUSTOS, den Hüter.')],
    ['anselm', TX('Der innere Kreis hat ihrem Protokoll eine Zeile hinzugefügt: „Menschen zählen.“ Sie wollen, dass KUSTOS entscheidet, wer es wert ist, beschützt zu werden. Und sie wollen die sein, die KUSTOS sagen, wie man zählt.')],
    ['anselm', TX('Wer die Verbünde hat, hat die Zukunft. Energie, Wartung, Logistik, Wissen. Und am Ende die Fabrik. Gewinn sie, bevor sie es tun.')],
  ], () => { chronikEintragen('kustos'); chronikEintragen('innerer_kreis'); clusterAendern('wissen', 10); spielSpeichern(); weiter(); });
}

// ---------------------------------------------------------------------
// Überfälle der Eiferer
// ---------------------------------------------------------------------
function eifererUeberfall() { const B = SPIEL.bestehende; return !!(B && B.zorn >= 40 && (B.zorn >= 70 || Math.random() < 0.5)); }
function eifererWellen(s) {
  const h = Math.floor(s / 2);
  return [
    { titel: TX('Die Prozession'), gegner: [['eiferer', 3 + s], ['pluenderer', 1 + s], ['wartungsbot', 2]] },
    { titel: TX('Öl und Gebete'), gegner: [['eiferer', 3 + s], ['schildtraeger', 1 + h], ['wartungsbot', 2 + h], ['schuetze', 1 + h]] },
    { titel: TX('Der Hauptmann'), gegner: [['eiferer', 2 + s], ['wartungsbot', 2], ['schildtraeger', 1]], nemesis: true },
  ];
}

// ---------------------------------------------------------------------
// Politik-Reiter: Verbünde, Zorn, Nemesis, Verschmutzung
// ---------------------------------------------------------------------
function bestehendePolitikHtml() {
  const B = SPIEL.bestehende;
  if (!B || !storyAb('strom')) return '';
  const balken = id => {
    const v = cluster(id), links = Math.max(0, -v), rechts = Math.max(0, v), C = CLUSTER[id];
    return `<div class="cluster${verbundStill(id) ? ' still' : ''}" title="${esc(C.einheit)}"><div class="cluster-kopf"><b>${esc(C.name)}</b><span class="note">${verbundStill(id) ? esc(TX('Stillgelegt: ') + C.still) : v >= 50 ? esc(C.gut) : v <= -50 ? esc(C.schlecht) : TX('umkämpft')}</span></div>
      <div class="cluster-bar"><i class="kreis" style="width:${links / 2}%"></i><i class="dorf" style="width:${rechts / 2}%"></i></div></div>`;
  };
  const N = B.nemesis;
  const anselm = { 0: TX('war noch nicht am Tor'), 1: TX('freundlich'), 2: TX('in eurer Kirche'), 3: TX('abgelehnt'), 4: TX('Verbündeter'), '-1': TX('vertrieben') }[B.anselm] || '';
  return TX`<div class="politik-karte breit2"><span class="label">L.A.C.I.-Verbünde · links der innere Kreis, rechts euer Dorf</span>
      ${['energie', 'wartung', 'logistik', 'wissen'].concat(fabrikFrei() ? ['produktion'] : []).map(balken).join('')}
      <p class="note">Ab 50 hören die Maschinen auf euch, ab −50 auf den inneren Kreis. Siege, Funkcodes und Entscheidungen verschieben die Balken.</p></div>
    <div class="politik-karte"><span class="label">Die Bestehenden</span>
      <div class="nachbar"><b>Zorn des inneren Kreises</b><span class="${B.zorn >= 40 ? 'down' : ''}">${Math.round(B.zorn)} / 100</span></div>
      <div class="nachbar"><b>Bruder Anselm</b><span>${esc(anselm)}</span></div>
      <div class="nachbar"><b>Verschmutzung</b><span class="${(SPIEL.verschmutzung || 0) >= 30 ? 'down' : ''}">${Math.round(SPIEL.verschmutzung || 0)} / 100</span></div>
      ${hatGebaeude('kirche') ? TX`<button class="btn small ghost" type="button" data-a="spende" ${SPIEL.gold < 40 ? 'disabled' : ''}>Spende an die Bestehenden (40 Gold, −6 Zorn)</button>` : ''}</div>
    ${N ? TX`<div class="politik-karte nemesis"><span class="label">Erzfeind</span><b class="nemesis-name">${esc(N.name)}</b><span class="note">Eiferer-Hauptmann · Stufe ${N.stufe}</span>
      <ul class="gruende">${N.eigenschaften.map(k => `<li><span>${esc(NEMESIS_EIGENSCHAFTEN[k].name)}</span><span class="note">${esc(NEMESIS_EIGENSCHAFTEN[k].text)}</span></li>`).join('')}</ul>
      ${N.verlauf.length ? `<p class="note">${esc(N.verlauf.slice(-3).join(' '))}</p>` : TX('<p class="note">Ihr seid euch noch nicht begegnet.</p>')}</div>` : ''}
    ${B.gefallen.length ? TX`<div class="politik-karte"><span class="label">Gefallene Hauptleute</span><p class="note">${esc(B.gefallen.map(g => TX`${g.name} (Stufe ${g.stufe})`).join(', '))}</p></div>` : ''}`;
}
// ---------------------------------------------------------------------
// Verbund-Terminal: zeigt alle Verbünde und erlaubt ab und zu eine Verbindung
// ---------------------------------------------------------------------
function terminalBereit(bau) {
  const st = stufeVon(bau);
  return stromAn() && SPIEL.tag >= (SPIEL.terminalTag || -99) + st.terminalPause;
}
function terminalInfo(bau, p) {
  const st = stufeVon(bau), bereit = terminalBereit(bau), plus = TERMINAL.plus + (st.terminalPlus || 0);
  const box = document.createElement('div'); box.className = 'ausbau terminal';
  const zeile = id => {
    const v = Math.round(cluster(id)), C = CLUSTER[id], links = Math.max(0, -v), rechts = Math.max(0, v);
    const gesperrt = id === 'produktion' && !fabrikFrei() ? TX('Erst mit der Lazi-Fabrik') : '';
    if (verbundStill(id)) return `<div class="cluster still"><div class="cluster-kopf"><b>${esc(C.name)}</b><span class="note">${esc(TX('Stillgelegt: ') + C.still)}</span></div></div>`;
    return `<div class="cluster"><div class="cluster-kopf"><b>${esc(C.name)}</b><span class="note">${v} · ${v >= 50 ? esc(C.gut) : v <= -50 ? esc(C.schlecht) : TX('umkämpft')}</span></div>
      <div class="cluster-bar"><i class="kreis" style="width:${links / 2}%"></i><i class="dorf" style="width:${rechts / 2}%"></i></div>
      <button class="btn small ghost" type="button" data-verbund="${id}" ${!bereit || gesperrt || !kannBezahlen(TERMINAL.kosten) || v >= 100 ? 'disabled' : ''}>${gesperrt ? esc(gesperrt) : TX`Verbindung anbieten (+${plus})`}</button></div>`;
  };
  const warum = !stromAn() ? TX('Ohne Strom bleibt der Bildschirm schwarz.')
    : bereit ? TX`Eine Verbindung kostet ${kostenHtml(TERMINAL.kosten)} und macht den inneren Kreis wütender (+${TERMINAL.zorn} Zorn).`
    : TX`Die Verbünde antworten erst wieder an Tag ${(SPIEL.terminalTag || 0) + st.terminalPause}.`;
  // Statt einer Verbindung kann man um eine Aufgabe bitten: Dann wartet eine Verbund-Mission auf der Karte
  const offen = (SPIEL.anfragen || []).find(a => a.art === 'verbund');
  const aufgaben = Object.keys(ANFRAGEN.verbuende).map(id => {
    const V = ANFRAGEN.verbuende[id], geht = bereit && !offen && ortBekannt(V.ort) && !anfrageBei(V.ort);
    return `<button class="btn small ghost" type="button" data-aufgabe="${id}" ${geht ? '' : 'disabled'}>${esc(CLUSTER[id].name)}: ${esc(MISSIONEN[V.mission].titel)}</button>`;
  }).join('');
  box.innerHTML = TX`<span class="label">Verbünde · links der innere Kreis, rechts euer Dorf</span>
    ${Object.keys(CLUSTER).map(zeile).join('')}
    <span class="note">${warum}</span>
    <span class="label">Um eine Aufgabe bitten</span>
    <span class="note">${offen ? TX`Offene Aufgabe: ${MISSIONEN[offen.mission].titel} (${ORTE[offen.ort].name}, bis Tag ${offen.bis}).` : TX('Kostet nichts, verbraucht aber die Antwort der Verbünde für heute. Die Mission wartet ein paar Tage auf der Weltkarte.')}</span>
    <div class="knopfreihe">${aufgaben}</div>`;
  p.append(box);
  box.querySelectorAll('[data-verbund]').forEach(k => k.addEventListener('click', () => verbindungAnbieten(bau, k.dataset.verbund)));
  box.querySelectorAll('[data-aufgabe]').forEach(k => k.addEventListener('click', () => aufgabeErbitten(bau, k.dataset.aufgabe)));
}
function aufgabeErbitten(bau, id) {
  if (!terminalBereit(bau)) return;
  const bericht = [];
  if (!anfrageErstellen(id, bericht)) return;
  SPIEL.terminalTag = SPIEL.tag;
  spielSpeichern(); geraeusch('klick');
  meldung(TX('Aufgabe angenommen'), bericht[0], 2600);
  zeigeInfoTyp(bau.typ, bau);
}
function verbindungAnbieten(bau, id) {
  if (!terminalBereit(bau) || !kannBezahlen(TERMINAL.kosten)) return;
  const st = stufeVon(bau), plus = TERMINAL.plus + (st.terminalPlus || 0), bericht = [];
  bezahlen(TERMINAL.kosten);
  clusterAendern(id, plus, bericht);
  SPIEL.bestehende.zorn = Math.min(100, SPIEL.bestehende.zorn + TERMINAL.zorn);
  SPIEL.terminalTag = SPIEL.tag;
  spielSpeichern(); geraeusch('klick'); dorfHudAktualisieren();
  meldung(TX`Verbund ${CLUSTER[id].name}: +${plus}`, bericht[0] || TX('Auf dem Bildschirm flackert eine Antwort: VERBINDUNG REGISTRIERT.'), 2200);
  zeigeInfoTyp(bau.typ, bau);
}

function bestehendePolitikEinrichten(leiste) {
  const k = leiste.querySelector('[data-a="spende"]');
  if (k) k.addEventListener('click', () => { if (SPIEL.gold < 40) return; SPIEL.gold -= 40; SPIEL.bestehende.zorn = Math.max(0, SPIEL.bestehende.zorn - 6); spielSpeichern(); geraeusch('muenze'); bauLeisteBauen(); });
}

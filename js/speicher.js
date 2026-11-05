// =====================================================================
// SPIELSTAND: alles, was zwischen Missionen erhalten bleibt.
// Gespeichert wird über die Ablage (ablage.js), getrennt nach Modus und Platz.
// In einem privaten Fenster oder nach dem Löschen der Website-Daten ist er weg.
// =====================================================================

let SPIEL = null;
let aktiverPlatz = 1;

// Regel des aktuellen Spielmodus aus MODI, z. B. regel('anselm')
function regel(name) {
  const m = MODI[(SPIEL && SPIEL.modus) || 'story'] || MODI.story;
  return m[name];
}

function neuerHeld() {
  return { stufe: 1, erfahrung: 0, punkte: 0, werte: { leben: 0, tempo: 0, schaden: 0 }, faehigkeiten: {} };
}

function neuesSpiel(platz, modus) {
  aktiverPlatz = platz || aktiverPlatz;
  SPIEL = {
    version: SPIELSTAND.version, modus: MODI[modus] ? modus : 'story', tag: 1, epoche: 0,
    gold: START.gold, teile: START.teile, einwohner: START.einwohner,
    holz: START.holz, stein: START.stein, nahrung: START.nahrung, holzkohle: START.holzkohle, beschlaege: START.beschlaege, altmetall: START.altmetall, kraeuter: START.kraeuter,
    feier: 0, siedlerTage: 0, gespraeche: {}, forschung: { fertig: [], laufend: null }, meister: false, forscherin: false, figuren: [],
    karte: { bekannt: [], besucht: {}, erledigt: {} }, chronik: [], chronikGelesen: [], beziehungen: {}, aussenposten: {},
    gebaeude: [
      { id: 1, typ: 'lagerfeuer', gx: -2, gz: -2 },
      { id: 2, typ: 'wohnhaus', gx: -10, gz: -6 },
      { id: 3, typ: 'lager', gx: 6, gz: -6 },
    ],
    naechsteId: 4,
    beutel: [], ausruestung: { waffe: null, ruestung: null, modul: null },
    klasse: null, element: 'metall',
    held: neuerHeld(),
    rekord: 0, missionen: 0, siege: 0, intro: false, dorfherz: DORFHERZ.leben,
    mauer: 0, ueberfall: null, ueberfaelle: 0, angst: 0, stolz: 0,
    strom: { frei: false, tage: 0, gesamt: 0 }, funk: { tag: 0, codes: 0 },
    cluster: { energie: 0, wartung: 0, logistik: 0, wissen: 0, produktion: 0 }, verschmutzung: 0,
    bestehende: { zorn: 10, anselm: 0, roboter: null, nemesis: null, gefallen: [] },
  };
}

// Fehlende Felder aus älteren Versionen ergänzen
// Version 5: Das Raster ist doppelt so groß. Alle Positionen verdoppeln sich, so bleibt jedes Gebäude an seinem Platz und nichts überlappt.
// Ein Weg bleibt ein Block groß, aus einem alten Wegfeld werden deshalb vier.
function rasterVerdoppeln(s) {
  const neu = [];
  (s.gebaeude || []).forEach(b => {
    const gx = b.gx * 2, gz = b.gz * 2;
    if (b.typ !== 'weg') { neu.push(Object.assign(b, { gx, gz })); return; }
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([x, z], i) => neu.push(Object.assign({}, b, { id: i ? s.naechsteId++ : b.id, gx: gx + x, gz: gz + z })));
  });
  s.gebaeude = neu;
}
function spielstandErgaenzen(s) {
  if (s.version < 5 && s.gebaeude) rasterVerdoppeln(s);
  if (s.dorfherz === undefined) s.dorfherz = DORFHERZ.leben;
  if (s.siege === undefined) s.siege = 0;
  if (!s.element) s.element = 'metall';
  if (!s.held) s.held = neuerHeld();
  if (s.holz === undefined) { s.holz = START.holz; s.stein = START.stein; s.nahrung = START.nahrung; }
  if (!s.karte) s.karte = { bekannt: [], besucht: {}, erledigt: {} };
  if (!s.chronik) s.chronik = [];
  if (!s.beziehungen) s.beziehungen = {};
  if (!s.aussenposten) s.aussenposten = {};
  // Version 6: Gegenstände, neue Rohstoffe, Ausbaustufen, Kohlekraftwerk statt Generatorfabrik
  beutelUmwandeln(s);
  if (s.holzkohle === undefined) { s.holzkohle = 0; s.beschlaege = 0; }
  if (s.feier === undefined) { s.feier = 0; s.siedlerTage = 0; }
  if (!s.gespraeche) s.gespraeche = {};
  if (!s.forschung) s.forschung = { fertig: [], laufend: null };
  if (!s.figuren) s.figuren = [];
  Object.keys(MATERIALIEN).forEach(m => { if (s[m] === undefined) s[m] = 0; });
  s.gebaeude.forEach(b => { if (!b.stufe) b.stufe = 1; });
  // Version 9: Mauer, Überfälle, Begleiter
  if (s.mauer === undefined) { s.mauer = 0; s.ueberfall = null; s.ueberfaelle = 0; s.angst = 0; s.stolz = 0; }
  // Version 10: Strom und Funk
  if (!s.strom) s.strom = { frei: false, tage: 0 };
  if (!s.funk) s.funk = { tag: 0, codes: 0 };
  // Version 11: Verbünde, Bestehende, Verschmutzung
  if (!s.cluster) s.cluster = { energie: s.strom.frei ? 45 : 0, wartung: 0, logistik: 0, wissen: 0, produktion: 0 };
  if (!s.bestehende) s.bestehende = { zorn: s.strom.frei ? 35 : 10, anselm: 0, roboter: null, nemesis: null, gefallen: [] };
  if (s.verschmutzung === undefined) s.verschmutzung = 0;
  if (s.strom.gesamt === undefined) s.strom.gesamt = 0;   // Tage mit Strom insgesamt (Ziel in Epoche 3)
  if (!s.anfragen) s.anfragen = [];                         // Anfragen der Verbünde und seltene Missionen
  if (s.altmetall === undefined) s.altmetall = 0;            // Rohstoff für die Lazi-Fabrik (Epoche 4)
  if (s.kraeuter === undefined) s.kraeuter = 0;              // Kräuter (Kräutergarten, Gewächshaus)
  if (!s.chronikGelesen) s.chronikGelesen = s.chronik.slice();   // Was es vor der neuen Chronik schon gab, gilt als gelesen
  s.karte.bekannt = s.karte.bekannt.map(o => o === 'generator' ? 'kraftwerk' : o);
  // Spielstand-Version 4: Spielmodus. Alles Ältere ist Story.
  if (!MODI[s.modus]) s.modus = 'story';
  s.version = SPIELSTAND.version;
  return s;
}

// Ein Spielstand auf einem Platz, schon ergänzt; null, wenn leer oder unlesbar
function platzLesen(n, modus = 'story') {
  const s = ablageJsonLesen(ABLAGE.platz(modus, n), null);
  if (!s || typeof s !== 'object' || !(s.version >= 2 && s.version <= SPIELSTAND.version)) return null;
  try { s.modus = modus; return spielstandErgaenzen(s); } catch (e) { return null; }
}
// Liegt auf dem Platz überhaupt etwas? Auch ein Stand aus einer neueren Version oder ein kaputter
// zählt als belegt: Er darf nicht ohne Rückfrage überschrieben werden.
function platzBelegt(n, modus = 'story') { return ablageLesen(ABLAGE.platz(modus, n)) !== null; }
// Einmaliger Umzug alter Spielstände in die Story-Plätze. Die alten Einträge bleiben als
// Sicherung liegen; der Vermerk in ABLAGE.umzug verhindert, dass sie ein zweites Mal übernommen werden.
function spielstaendeUmziehen() {
  if (ablageLesen(ABLAGE.umzug)) return;
  const sv2 = ablageLesen(ABLAGE.altSpielstand);
  if (sv2 && !ablageLesen(ABLAGE.altPlatz(1)) && !ablageLesen(ABLAGE.platz('story', 1))) ablageSchreiben(ABLAGE.platz('story', 1), sv2);
  for (let n = 1; n <= SPIELSTAND.plaetze; n++) {
    const alt = ablageLesen(ABLAGE.altPlatz(n));
    if (alt && !ablageLesen(ABLAGE.platz('story', n))) ablageSchreiben(ABLAGE.platz('story', n), alt);
  }
  if (!ablageLesen(ABLAGE.letzter)) {
    const n = Number(ablageLesen(ABLAGE.altLetzter)) || (sv2 ? 1 : 0);
    if (n >= 1 && n <= SPIELSTAND.plaetze) ablageSchreiben(ABLAGE.letzter, 'story:' + n);
  }
  ablageSchreiben(ABLAGE.umzug, 4);
}
function spielLaden(n, modus = 'story') {
  const s = platzLesen(n, modus);
  if (!s) return false;
  SPIEL = s; aktiverPlatz = n;
  gegenstandNamenAuffrischen();
  ablageSchreiben(ABLAGE.letzter, modus + ':' + n);
  return true;
}
// Gegenstände tragen ihren Namen im Spielstand. Nach einem Sprachwechsel kommt er wieder aus der Vorlage.
function gegenstandNamenAuffrischen() {
  const vorlage = it => (it.art === 'waffe' ? WAFFEN : it.art === 'ruestung' ? RUESTUNGEN : MODULE).find(v => v.id === it.basis);
  (SPIEL.beutel || []).forEach(it => { const v = vorlage(it); if (v) it.name = v.name; });
}
// Der zuletzt gespielte Stand als { modus, platz }, oder null
function letzterStand() {
  const [modus, text] = String(ablageLesen(ABLAGE.letzter) || '').split(':');
  const platz = Number(text);
  return MODI[modus] && platz >= 1 && platz <= SPIELSTAND.plaetze && platzLesen(platz, modus) ? { modus, platz } : null;
}
function spielSpeichern() {
  if (!SPIEL) return false;
  SPIEL.gespeichert = Date.now();
  // Klappt das Speichern nicht (kein Platz, privates Fenster), läuft das Spiel trotzdem weiter,
  // aber der Spieler erfährt es einmal, statt sich auf einen Stand zu verlassen, den es nicht gibt
  const ok = ablageJsonSchreiben(ABLAGE.platz(SPIEL.modus, aktiverPlatz), SPIEL);
  if (ok) { ablageSchreiben(ABLAGE.letzter, SPIEL.modus + ':' + aktiverPlatz); spielSpeichern.gewarnt = false; }
  else if (!spielSpeichern.gewarnt) {
    spielSpeichern.gewarnt = true;
    meldung(TX('Speichern fehlgeschlagen'), TX('Der Browser lässt keinen Spielstand mehr zu. Sichere ihn unter „Spiel laden“ als Text.'), 6000);
  }
  return ok;
}

// ---------- Sicherung: ein Spielstand als Text zum Kopieren und Einfügen ----------
// Funktioniert überall, auch wo Dateien nicht heruntergeladen werden können (Artifact, Android-App).
const SICHERUNG_KENNUNG = 'LAZI1:', SICHERUNG_ALLE = 'LAZIALLE1:';
function sicherungKodieren(s) {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
// Ein verlorener Überfall trifft das Dorfherz: Einwohner fliehen, ein ausgebautes Gebäude verliert eine Stufe. Gibt die Folgen als Sätze zurück.
function dorfherzTreffen(dorf = SPIEL) {
  dorf.dorfherz = Math.max(0, (dorf.dorfherz || 0) - DORFHERZ.schadenProNiederlage);
  const folgen = [TX`Das Dorfherz ist verletzt: noch ${dorf.dorfherz} von ${DORFHERZ.leben}. Erlischt es, ist das Dorf verloren.`];
  const weg = Math.min(dorf.einwohner, Math.ceil(dorf.einwohner * DORFHERZ.fliehen));
  dorf.einwohner -= weg;
  if (weg) folgen.push(weg === 1 ? TX('Eine Person flieht aus dem Dorf.') : TX`${weg} Einwohner fliehen aus dem Dorf.`);
  const ausgebaut = dorf.gebaeude.filter(b => (b.stufe || 1) > 1 && !GEBAEUDE[b.typ].fest && GEBAEUDE[b.typ].kategorie !== 'deko');
  if (ausgebaut.length) {
    const b = ausgebaut[Math.floor(Math.random() * ausgebaut.length)];
    b.stufe--;
    if (typeof Dorf !== 'undefined' && Dorf.bauten) { const x = Dorf.bauten.find(e => e.b === b); if (x) zeige(x.o, gebaeudeBild(b), 1); }
    folgen.push(TX`${GEBAEUDE[b.typ].name} ist beschädigt und verliert eine Stufe.`);
  }
  return folgen;
}
// Verloren: Das Dorfherz ist erloschen oder niemand wohnt mehr hier. Ergibt sich aus dem Stand, also hilft kein Neuladen.
function dorfVerloren(dorf = SPIEL) {
  return !!dorf && MODI[dorf.modus || 'story'].verlieren && !!dorf.klasse && (dorf.dorfherz <= 0 || dorf.einwohner <= 0);
}
// Bestenliste im Endless: Ein Lauf kommt einmal hinein, wenn das Dorf fällt. Sortiert nach Dorfwert, dann nach Tagen.
function bestenlisteLesen() {
  const l = ablageJsonLesen(ABLAGE.bestenliste, []);
  return Array.isArray(l) ? l : [];
}
function bestenlisteSortieren(l) {
  return l.slice().sort((a, b) => b.wert - a.wert || b.tage - a.tage).slice(0, BESTENLISTE.plaetze);
}
function bestenlisteEintragen() {
  if (SPIEL.gewertet) return SPIEL.gewertet;
  const eintrag = { id: Date.now() + '-' + Math.floor(Math.random() * 1e6), wert: dorfPunkte(), tage: SPIEL.tag, klasse: SPIEL.klasse, epoche: SPIEL.epoche, zeit: Math.round(SPIEL.spielzeit || 0) };
  ablageJsonSchreiben(ABLAGE.bestenliste, bestenlisteSortieren(bestenlisteLesen().concat(eintrag)));
  SPIEL.gewertet = eintrag.id;
  spielSpeichern();
  return eintrag.id;
}
// Der Dorfwert fasst ein Dorf in einer Zahl zusammen (Menü, später Highscore und Multiplayer).
// Der Lebensstandard wird noch aus SPIEL berechnet, deshalb zählt er vorerst nur beim laufenden Dorf (Umbau in Schritt 11).
function dorfPunkte(dorf = SPIEL) {
  const W = DORFWERT;
  const stufen = (dorf.gebaeude || []).filter(b => GEBAEUDE[b.typ] && !GEBAEUDE[b.typ].fest && GEBAEUDE[b.typ].kategorie !== 'deko').reduce((n, b) => n + (b.stufe || 1), 0);
  return Math.round((dorf.einwohner || 0) * W.einwohner + stufen * W.gebaeudeStufe + (dorf.mauer || 0) * W.mauer + (dorf.epoche || 0) * W.epoche
    + (dorf.abgewehrt || 0) * W.ueberfall + (dorf === SPIEL ? lebensstandard().wert : 0) * W.lebensstandard + (dorf.missionsPunkte || 0) * W.missionspunkte);
}
// Die Spielzeit eines Stands, dazu wann er welche Epoche erreicht hat
function spielzeitZeile(s) {
  if (s.spielzeit === undefined) return TX('noch nicht gemessen');
  const e = s.epochenZeit || {};
  return [spielzeitText(s.spielzeit)].concat(Object.keys(e).map(n => TX`Epoche ${Number(n) + 1} nach ${spielzeitText(e[n])}`)).join(' · ');
}
// Die Kopfzeile einer Sicherung ist für Menschen: So sieht man, was im Text steckt. Beim Einfügen wird sie übersprungen.
function sicherungKopf(s, name) { return TX`LAZI ${SPIEL_VERSION} · ${name} · Tag ${s.tag} · Spielzeit ${spielzeitZeile(s)}`; }
function sicherungRumpf(text, kennung) {
  const m = text.match(/^(LAZI1:|LAZIALLE1:)(.*)$/ms);
  return m && m[1] === kennung ? m[2] : null;
}
function sicherungText(s) { return sicherungKopf(s, MODI[s.modus || 'story'].name) + '\n' + SICHERUNG_KENNUNG + sicherungKodieren(s); }
// Alle Spielstände und die gefundenen Enden in einem Text: zum Umzug auf ein anderes Gerät oder eine andere Adresse
function alleSicherungText() {
  const eintraege = {};
  ablageSchluessel().filter(k => /^lazi-[a-z]+-platz-\d+$/.test(k) || k === ABLAGE.enden || k === ABLAGE.bestenliste || k === ABLAGE.letzter).forEach(k => { eintraege[k] = ablageLesen(k); });
  const kopf = Object.keys(eintraege).sort().map(k => {
    const m = k.match(/^lazi-([a-z]+)-platz-(\d+)$/);
    if (!m || !MODI[m[1]]) return null;
    try { return sicherungKopf(JSON.parse(eintraege[k]), TX`${MODI[m[1]].name}, Speicherplatz ${m[2]}`); } catch (e) { return null; }
  }).filter(Boolean);
  return kopf.concat(SICHERUNG_ALLE + sicherungKodieren({ eintraege })).join('\n');
}
// Eine eingefügte Gesamtsicherung als { plaetze: { schlüssel: text }, enden, letzter, unlesbar }, oder null.
// Stände aus einer neueren Version oder kaputte Stände werden nicht übernommen, sondern gezählt.
function alleSicherungLesen(text) {
  text = String(text || '').trim();
  const rumpf = sicherungRumpf(text, SICHERUNG_ALLE);
  if (rumpf === null) return null;
  let d;
  try {
    const bin = atob(rumpf.replace(/\s+/g, ''));
    d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))).eintraege;
  } catch (e) { return null; }
  if (!d || typeof d !== 'object') return null;
  const erg = { plaetze: {}, enden: [], letzter: d[ABLAGE.letzter] || null, unlesbar: 0 };
  for (const k of Object.keys(d)) {
    const m = k.match(/^lazi-([a-z]+)-platz-(\d+)$/);
    if (!m) continue;
    if (MODI[m[1]] && m[2] >= 1 && m[2] <= SPIELSTAND.plaetze && sicherungLesen(d[k])) erg.plaetze[k] = d[k]; else erg.unlesbar++;
  }
  try { erg.enden = JSON.parse(d[ABLAGE.enden] || '[]'); } catch (e) { /* ohne Enden */ }
  try { const l = JSON.parse(d[ABLAGE.bestenliste] || '[]'); erg.bestenliste = Array.isArray(l) ? l : []; } catch (e) { erg.bestenliste = []; }
  return erg;
}
function alleSicherungEinspielen(a) {
  let ok = true;
  for (const k of Object.keys(a.plaetze)) ok = ablageSchreiben(k, a.plaetze[k]) && ok;
  if (a.enden.length) ok = ablageJsonSchreiben(ABLAGE.enden, [...new Set([...ablageJsonLesen(ABLAGE.enden, []), ...a.enden])]) && ok;
  if (a.bestenliste && a.bestenliste.length) {
    const da = bestenlisteLesen(), neu = a.bestenliste.filter(e => !da.some(x => x.id === e.id));
    ok = ablageJsonSchreiben(ABLAGE.bestenliste, bestenlisteSortieren(da.concat(neu))) && ok;
  }
  if (a.letzter && a.plaetze[ABLAGE.platz(...a.letzter.split(':'))]) ablageSchreiben(ABLAGE.letzter, a.letzter);
  return ok;
}
// Ein eingefügter Text als Spielstand, schon ergänzt; null, wenn er nicht passt
function sicherungLesen(text) {
  text = String(text || '').trim();
  let s = null;
  try {
    const rumpf = sicherungRumpf(text, SICHERUNG_KENNUNG);
    if (rumpf !== null) {
      const bin = atob(rumpf.replace(/\s+/g, ''));
      s = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    } else if (text.startsWith('{')) s = JSON.parse(text);
  } catch (e) { return null; }
  if (!s || typeof s !== 'object' || !(s.version >= 2 && s.version <= SPIELSTAND.version) || !Array.isArray(s.gebaeude)) return null;
  try { return spielstandErgaenzen(s); } catch (e) { return null; }
}
// Merkt sich den Tag der letzten Sicherung im Spielstand (für die Erinnerung im Tagesbericht)
const SICHERUNG_ERINNERN = 5;   // alle 5 Tage ohne Sicherung
function sicherungMerken(n, modus) {
  if (SPIEL && aktiverPlatz === n && SPIEL.modus === modus) { SPIEL.gesichertTag = SPIEL.tag; spielSpeichern(); return; }
  const s = platzLesen(n, modus);
  if (s) { s.gesichertTag = s.tag; ablageJsonSchreiben(ABLAGE.platz(modus, n), s); }
}
function sicherungErinnerung(bericht) {
  if (!ablageUnsicher()) return;
  const seit = SPIEL.tag - (SPIEL.gesichertTag || 0);
  if (seit >= SICHERUNG_ERINNERN && seit % SICHERUNG_ERINNERN === 0) bericht.push(TX`Seit ${seit} Tagen nicht gesichert. Der Browser kann Spielstände löschen. Sichern geht im Menü unter „Spielstand sichern“.`);
}
function platzLoeschen(n, modus = 'story') {
  ablageLoeschen(ABLAGE.platz(modus, n));
  if (ablageLesen(ABLAGE.letzter) === modus + ':' + n) ablageLoeschen(ABLAGE.letzter);
}

// ---------- Held: Stufen, Werte, Fähigkeiten ----------
function hatFaehigkeit(id) {
  const f = SPIEL && SPIEL.held && SPIEL.held.faehigkeiten;
  return !!f && Object.values(f).includes(id);
}
// Gibt zurück, wie viele Stufen gewonnen wurden
function erfahrungGeben(n) {
  const h = SPIEL.held;
  let neu = 0;
  h.erfahrung += n;
  while (h.erfahrung >= STUFEN.erfahrung(h.stufe)) {
    h.erfahrung -= STUFEN.erfahrung(h.stufe);
    h.stufe++; h.punkte++; neu++;
  }
  return neu;
}
function offeneMeilensteine() {
  return STUFEN.meilensteine.filter(m => SPIEL.held.stufe >= m && !SPIEL.held.faehigkeiten[m]);
}
// Werte des Helden aus Klasse, Stufenpunkten und Fähigkeiten
// items: die ausgerüsteten Gegenstände (Standard: die gespeicherten, in der Mission die aktuellen)
function heldWerte(items) {
  const K = KLASSEN[SPIEL.klasse], w = SPIEL.held.werte, S = STUFEN.werte;
  const a = ausruestungWerte(items || SLOTS.map(sl => ausgeruestet(sl)));
  return {
    leben: Math.round((K.leben || CFG.spieler.leben) * K.werte + w.leben * S.leben.pro + a.leben),
    tempo: CFG.spieler.tempo * K.werte * (K.tempoMal || 1),
    schaden: K.werte * (1 + w.schaden * S.schaden.pro),
    angriffTempo: 1 / ((1 + w.tempo * S.tempo.pro) * (1 + a.tempo / 100)),   // kleiner = schneller
    mana: MANA.max + a.mana,
    ruestung: Math.min(GRENZEN.ruestung, a.ruestung),
    ausweichen: Math.min(GRENZEN.ausweichen, a.ausweichen),
    krit: Math.min(GRENZEN.krit, GRUND_KRIT + a.krit),
    effekte: a.effekte,
  };
}

// Die ausgerüstete Waffe. Fehlt sie (oder passt nicht zur Klasse), gibt es die Startwaffe.
function aktuelleWaffe() {
  const w = ausgeruestet('waffe');
  if (w) return w;
  let start = SPIEL.beutel.find(x => x.art === 'waffe' && x.klasse === SPIEL.klasse);
  if (!start) { start = gegenstandAusVorlage('waffe', WAFFEN.find(v => v.id === KLASSEN[SPIEL.klasse].startWaffe)); SPIEL.beutel.unshift(start); }
  SPIEL.ausruestung.waffe = start.uid;
  return start;
}
// Klasse festlegen: einmal pro Spielstand
function klasseFestlegen(k) {
  SPIEL.klasse = k;
  aktuelleWaffe();
  spielSpeichern();
}
function anzahlGebaeude(typ) { return SPIEL.gebaeude.filter(b => b.typ === typ).length; }
function hatGebaeude(typ) { return anzahlGebaeude(typ) > 0; }
// Was ein Gebäude auf seiner aktuellen Ausbaustufe bewirkt
function stufeVon(b) { const st = GEBAEUDE[b.typ].stufen; return st[Math.min(st.length, b.stufe || 1) - 1]; }
function gebaeudeName(b) { return stufeVon(b).name || GEBAEUDE[b.typ].name; }
// Summe eines Werts über alle Gebäude (z. B. 'holzProTag')
function gebaeudeWert(feld) {
  let summe = 0;
  for (const b of SPIEL.gebaeude) {
    if (GEBAEUDE[b.typ].strom && !stromAn()) continue;   // Stromgebäude wirken nur mit Strom
    const v = stufeVon(b)[feld]; if (v === true) return true; if (v) summe += v;
  }
  return summe;
}

// Werte, die sich aus den Gebäuden ergeben
function dorfWerte() {
  let wohnraum = 0, nahrungProTag = 0, vorrat = NAHRUNG.grundVorrat, arbeiter = 0;
  for (const b of SPIEL.gebaeude) {
    const st = stufeVon(b);
    wohnraum += st.wohnraum || 0; nahrungProTag += st.nahrungProTag || 0; vorrat += st.vorrat || 0; arbeiter += GEBAEUDE[b.typ].arbeiter || 0;
  }
  for (const ort in SPIEL.aussenposten) { nahrungProTag += AUSSENPOSTEN.proTag.nahrung; arbeiter += AUSSENPOSTEN.arbeiter; }
  // Fehlen Arbeiter (zum Beispiel nach einer Hungersnot), arbeiten alle Gebäude langsamer
  const besetzt = arbeiter ? Math.min(1, SPIEL.einwohner / arbeiter) : 1;
  nahrungProTag = Math.floor(nahrungProTag * besetzt);
  // Dorfversammlung „sparsam wirtschaften“: weniger Verbrauch
  const verbrauch = Math.ceil(SPIEL.einwohner * NAHRUNG.proEinwohner * (SPIEL.sparen > 0 ? VERSAMMLUNG.sparMal : 1));
  // Mit Strom heizen die Häuser elektrisch und die Maschinen helfen mit
  const strom = stromAn(), plus = strom ? 1 + STROM.ertrag : 1;
  nahrungProTag = Math.floor(nahrungProTag * plus * verschmutzungMal() * (baeckereiAktiv() ? 1 + gebaeudeWert('backen') : 1));
  // Gewächshaus: Gemüse unter Glas, unabhängig von der Verschmutzung
  nahrungProTag += Math.floor((gebaeudeWert('gemuese') || 0) * besetzt);
  const kohleBedarf = !strom && SPIEL.epoche >= LEBENSSTANDARD.kohleAbEpoche ? Math.ceil(SPIEL.einwohner * LEBENSSTANDARD.kohleProEinwohner) : 0;
  return {
    wohnraum, nahrungProTag, verbrauch, bilanz: nahrungProTag - verbrauch, vorrat, arbeiter, besetzt,
    frei: SPIEL.einwohner - arbeiter, platz: wohnraum,
    holzProTag: Math.floor(gebaeudeWert('holzProTag') * besetzt * plus) + (Object.keys(SPIEL.aussenposten).length ? AUSSENPOSTEN.proTag.holz : 0),
    steinProTag: Math.floor(gebaeudeWert('steinProTag') * besetzt * plus) + (Object.keys(SPIEL.aussenposten).length ? AUSSENPOSTEN.proTag.stein : 0),
    kohleProTag: Math.floor(gebaeudeWert('kohleProTag') * besetzt), holzVerbrauch: gebaeudeWert('holzVerbrauch'),
    beschlaegeProTag: Math.floor(gebaeudeWert('beschlaegeProTag') * besetzt) + (strom && gebaeudeWert('beschlaegeProTag') ? 1 : 0), kohleVerbrauch: strom ? 0 : gebaeudeWert('kohleVerbrauch'),
    strom,
    kohleBedarf,
  };
}

// Lebensstandard 0 bis 100 und die Gründe dafür
function lebensstandard(w) {
  w = w || dorfWerte();
  const L = LEBENSSTANDARD, g = [];
  g.push([TX('Grundstimmung'), L.grund]);
  const puffer = w.wohnraum - SPIEL.einwohner;
  if (puffer >= 2) g.push([TX('Platz zum Leben'), Math.min(L.wohnraumPuffer, puffer * 2)]);
  else g.push([TX('Enge Häuser'), -5]);
  // Zählt, wie viele Tage der Vorrat reicht, nicht die Tagesbilanz
  const tage = SPIEL.einwohner ? SPIEL.nahrung / Math.max(1, w.verbrauch - Math.max(0, w.nahrungProTag)) : 99;
  if (SPIEL.hunger) g.push([TX('Hunger'), L.hunger]);
  else if (w.bilanz >= 0 || tage >= 6) g.push([TX('Volle Speicher'), L.satt]);
  else if (tage >= 2) g.push([TX`Vorrat reicht noch ${Math.floor(tage)} Tage`, 4]);
  else g.push([TX('Knappes Essen'), -10]);
  const schmuck = SPIEL.gebaeude.reduce((a, b) => a + (GEBAEUDE[b.typ].strom && !stromAn() ? 0 : stufeVon(b).schmuck || 0), 0);
  if (schmuck) g.push([TX('Schmuck im Dorf'), Math.min(L.schmuckMax, Math.floor(schmuck))]);
  const st = gebaeudeWert('stimmung');
  if (st) g.push([TX('Wirtshaus, Kirche, Steinhäuser'), Math.min(30, st)]);
  if (SPIEL.feier > 0) g.push([TX('Die Runde im Wirtshaus'), L.feier]);
  if (SPIEL.fest > 0) g.push([TX('Dorffest'), FEST.standard]);
  if (SPIEL.hund) g.push([TX`Dorfhund ${SPIEL.hund}`, 2]);
  if (SPIEL.figuren.includes('jupp')) g.push([TX('Jupps gute Laune'), 3]);
  if (SPIEL.figuren.includes('bodo')) g.push([TX('Bodo nervt alle'), -3]);
  const wege = anzahlGebaeude('weg');
  if (wege >= 20) g.push([TX('Gepflegte Wege'), Math.min(5, Math.floor(wege / 20))]);
  if (SPIEL.mauer) g.push([TX`Schutz durch ${MAUERN[SPIEL.mauer].name}`, SPIEL.mauer * 2]);
  if (SPIEL.angst > 0) g.push([TX('Angst nach dem Überfall'), UEBERFALL.angst]);
  if (SPIEL.stolz > 0) g.push([TX('Stolz: Überfall abgewehrt'), UEBERFALL.stolz]);
  if (w.strom) g.push([TX('Strom: Licht und warme Stuben'), STROM.lebensstandard]);
  else if (stromFrei()) g.push([TX('Stromausfall'), STROM.ausfall]);
  if ((SPIEL.verschmutzung || 0) >= VERSCHMUTZUNG.stufe2) g.push([TX('Rostwasser im Bach'), -8]);
  else if ((SPIEL.verschmutzung || 0) >= VERSCHMUTZUNG.stufe1) g.push([TX('Der Bach schmeckt nach Metall'), -3]);
  if (hatGebaeude('krankenstation')) g.push(pflegeAktiv() ? [TX('Krankenstation'), gebaeudeWert('pflege')] : [TX('Krankenstation ohne Kräuter'), 0]);
  const bloecke = anzahlGebaeude('wohnblock');
  if (bloecke && !stromAn()) g.push([TX('Kalte Treppenhäuser'), -3 * bloecke]);
  if (SPIEL.sparen > 0) g.push([TX('Strenge Rationen'), VERSAMMLUNG.sparStandard]);
  if (w.kohleBedarf) g.push(SPIEL.kohleOk ? [TX('Warme Stuben (Holzkohle)'), L.kohleOk] : [TX('Kalte Stuben: Holzkohle fehlt'), L.kohleFehlt]);
  const wert = Math.max(0, Math.min(100, g.reduce((a, [, v]) => a + v, 0)));
  return { wert, gruende: g };
}
function standardText(v) { return v >= 80 ? TX('blühend') : v >= LEBENSSTANDARD.hoch ? TX('gut') : v >= 50 ? TX('ordentlich') : v >= LEBENSSTANDARD.niedrig ? TX('mau') : TX('elend'); }

// Was im Tagesbericht als Zahl erscheint: Vorher und nachher vergleichen
const BERICHT_ZAHLEN = ['gold', 'nahrung', 'holz', 'stein', 'holzkohle', 'beschlaege', 'teile', 'altmetall', 'kraeuter', 'buecher', 'bauteile', 'einwohner'];
function berichtStand() { return Object.fromEntries(BERICHT_ZAHLEN.map(r => [r, SPIEL[r] || 0])); }
// Ein Satz aus mehreren, je nach Tag ein anderer: Der Bericht soll nicht jeden Morgen gleich klingen
function satz(...v) { return v[SPIEL.tag % v.length]; }

// Ein Tag vergeht: Gebäude arbeiten, Einwohner essen und heizen.
// Gibt den Bericht als erzählte Sätze zurück; bericht.bilanz enthält die Zahlen (was sich verändert hat).
function tagVergeht() {
  if (typeof Dorf !== 'undefined') Dorf.rueck = [];  // Rückgängig gilt nur für den laufenden Tag
  const w = dorfWerte(), bericht = [], vorher = berichtStand();
  SPIEL.tag++;
  SPIEL.dorfherz = Math.min(DORFHERZ.leben, (SPIEL.dorfherz || 0) + DORFHERZ.heilungProTag);
  SPIEL.nahrung += w.nahrungProTag;
  SPIEL.holz += w.holzProTag; SPIEL.stein += w.steinProTag;
  const markt = gebaeudeWert('goldProTag');
  if (markt) { SPIEL.gold += markt; bericht.push(satz(TX('Am Marktstand vor dem Tor klimpern die Münzen.'), TX('Am Marktstand haben Reisende Brot und Seile gekauft.'))); }
  // Erzählt wird nur, was wirklich hereinkommt (Zahlen stehen in der Bilanz)
  if (w.holzProTag && w.steinProTag) bericht.push(satz(TX('Den ganzen Tag hört man Äxte im Wald und Meißel im Steinbruch.'), TX('Holzfäller und Steinmetze kommen staubig und zufrieden zurück.'), TX('Frisches Holz stapelt sich am Lager, daneben behauene Steine.')));
  else if (w.holzProTag) bericht.push(satz(TX('Den ganzen Tag hört man Äxte im Wald.'), TX('Die Holzfäller kommen mit harzigen Händen zurück.'), TX('Frisches Holz stapelt sich am Lager.')));
  else if (w.steinProTag) bericht.push(satz(TX('Den ganzen Tag klingen Meißel im Steinbruch.'), TX('Die Steinmetze kommen staubig und zufrieden zurück.'), TX('Behauene Steine stapeln sich am Lager.')));
  if (w.kohleProTag) {
    if (SPIEL.holz >= w.holzVerbrauch) { SPIEL.holz -= w.holzVerbrauch; SPIEL.holzkohle += w.kohleProTag; bericht.push(satz(TX('Über dem Meiler steigt dünner Rauch auf. Abends liegt neue Holzkohle bereit.'), TX('Der Köhler hat den Meiler geöffnet: schwarze, glänzende Kohle.'))); }
    else bericht.push(TX('Der Meiler bleibt kalt. Dem Köhler fehlt Holz.'));
  }
  if (w.beschlaegeProTag) {
    if (SPIEL.holzkohle >= w.kohleVerbrauch) { SPIEL.holzkohle -= w.kohleVerbrauch; SPIEL.beschlaege += w.beschlaegeProTag; bericht.push(satz(TX('In der Schmiede klingt der Hammer bis in die Nacht. Neue Beschläge hängen am Haken.'), TX('Funken fliegen aus der Schmiede. Die Beschläge sind gut geworden.'))); }
    else bericht.push(TX('Die Esse der Schmiede ist kalt. Ohne Holzkohle gibt es keine Beschläge.'));
  }
  if (w.kohleBedarf) {
    SPIEL.kohleOk = SPIEL.holzkohle >= w.kohleBedarf;
    if (SPIEL.kohleOk) { SPIEL.holzkohle -= w.kohleBedarf; bericht.push(satz(TX('In den Stuben glühen die Öfen. Niemand friert.'), TX('Abends riecht das ganze Dorf nach Holzkohle und warmen Stuben.'))); }
    else { SPIEL.holzkohle = 0; bericht.push(TX('Es fehlt Holzkohle zum Heizen. Die Stuben bleiben kalt, die Kinder schlafen in Mänteln.')); }
  }
  SPIEL.nahrung -= w.verbrauch;
  SPIEL.hunger = false;
  if (SPIEL.nahrung < 0) {
    // Mit versorgter Krankenstation gehen nur halb so viele
    const weg = Math.max(0, Math.min(SPIEL.einwohner - regel('minEinwohnerHunger'), Math.ceil(-SPIEL.nahrung / 2 * (pflegeAktiv() ? 0.5 : 1))));
    SPIEL.einwohner -= weg; SPIEL.nahrung = 0; SPIEL.hunger = true;
    if (weg > 0) bericht.push(weg === 1 ? TX('Der Hunger treibt jemanden fort. Ein Bett bleibt heute leer.') : TX('Der Hunger treibt Leute fort. Mehrere Betten bleiben heute leer.'));
  }
  if (SPIEL.nahrung > w.vorrat) { bericht.push(TX('Die Speicher quellen über. Ein Teil der Ernte verdirbt, bevor jemand sie essen kann.')); SPIEL.nahrung = w.vorrat; }
  if (SPIEL.feier > 0) SPIEL.feier--;
  forschungTag(bericht);
  ueberfallTag(bericht);
  stromTag(bericht);
  fabrikTag(bericht);
  gebaeudeTag(bericht);
  marktTag(bericht);
  rostbrecherTag(bericht);
  finaleTag(bericht);
  bestehendeTag(bericht);
  dorflebenTag(bericht);
  fuchsSichtung(bericht);
  anfragenTag(bericht);
  sicherungErinnerung(bericht);
  // Bodo Kranz treibt „Gebühren“ ein. Niemand weiß, wofür.
  if (regel('figuren') && SPIEL.figuren.includes('bodo') && SPIEL.gold > 10 && Math.random() < 0.2) {
    const n = Math.min(SPIEL.gold, 3 + Math.floor(Math.random() * 6));
    SPIEL.gold -= n; bericht.push(SPIEL.figuren.includes('hilde') ? TX('Bodo Kranz hat eine „Verwaltungsgebühr“ eingetrieben. Hilde hat ihm dafür das Nudelholz gezeigt.') : TX('Bodo Kranz hat eine „Verwaltungsgebühr“ eingetrieben. Wofür, sagt er nicht.'));
  }
  // Lebensstandard: gute Dörfer locken Siedler an, schlechte verlieren Leute
  const ls = lebensstandard().wert, frei = dorfWerte().platz - SPIEL.einwohner;
  if (ls >= LEBENSSTANDARD.hoch && frei > 0) {
    SPIEL.siedlerTage = (SPIEL.siedlerTage || 0) + 1;
    if (SPIEL.siedlerTage >= 2) { SPIEL.siedlerTage = 0; SPIEL.einwohner++; bericht.push(TX('Es spricht sich herum, dass es sich hier gut lebt. Ein Siedler zieht ein.')); }
  }
  const kirche = gebaeudeWert('siedler');
  if (kirche && frei > 1 && SPIEL.tag % kirche === 0) { SPIEL.einwohner++; bericht.push(TX('Ein Pilger bleibt bei der Kirche und zieht ein.')); }
  if (ls < LEBENSSTANDARD.niedrig && SPIEL.einwohner > regel('minEinwohnerStandard')) { SPIEL.einwohner--; bericht.push(TX`Das Leben hier ist ${standardText(ls)}. Eine Familie packt ihre Sachen und geht.`); }
  const ansehen = gebaeudeWert('ansehen');
  if (ansehen) for (const o in SPIEL.beziehungen) if (SPIEL.beziehungen[o] < 3) SPIEL.beziehungen[o] = Math.min(3, SPIEL.beziehungen[o] + ansehen);
  const nachher = berichtStand();
  // Wie es mit dem Essen steht, nach allem, was heute passiert ist
  const satt = nachher.nahrung - vorher.nahrung;
  if (!SPIEL.hunger) bericht.unshift(satt > 5 ? satz(TX('Felder, Fischer und Jäger bringen mehr, als alle essen können. Abends ist die Suppe dick.'), TX('Die Speicher füllen sich. Heute ist niemand hungrig zu Bett gegangen.'), TX('Es gibt Brot, Brei und noch einen Rest für morgen.'))
    : satt >= 0 ? satz(TX('Es reicht für alle, aber nicht für mehr. Die Köchin kratzt den Topf sauber aus.'), TX('Gerade genug zu essen. Niemand beschwert sich, niemand lobt.'))
    : satz(TX('Mehr Münder als Ernte: Die Vorräte schrumpfen.'), TX('Die Teller werden kleiner. Die Leute zählen die Tage bis zur nächsten Ernte.')));
  else bericht.unshift(TX('Die Vorräte sind aufgebraucht. Heute gehen Leute hungrig zu Bett.'));
  bericht.bilanz = Object.fromEntries(BERICHT_ZAHLEN.map(r => [r, nachher[r] - vorher[r]]).filter(([, n]) => n));
  return bericht;
}
// Der Tagesbericht: oben die Zahlen mit Symbolen, darunter die Erzählung (in den Optionen umschaltbar)
function tagesberichtHtml(bericht, titel) {
  const art = OPT.bericht || 'beides', b = bericht.bilanz || {};
  const zahlen = art !== 'erzaehlung' ? `<div class="bericht-zahlen">${Object.keys(b).length ? bilanzHtml(b) : esc(TX('Keine Veränderung'))}</div>` : '';
  const text = art !== 'zahlen' ? `<div class="bericht-text">${bericht.map(z => `<p>${esc(z)}</p>`).join('')}</div>` : '';
  return `<div class="tagesbericht"><span class="label">${esc(titel || TX('Ein Tag vergeht'))}</span>${zahlen}${text}</div>`;
}

// Rohstoffe: kosten = { gold, holz, stein, teile, nahrung, holzkohle, beschlaege }
const ROHSTOFF_NAME = { gold: TX('Gold'), holz: TX('Holz'), stein: TX('Stein'), teile: TX('Lazi-Teile'), nahrung: TX('Nahrung'), holzkohle: TX('Holzkohle'), beschlaege: TX('Beschläge'), altmetall: TX('Altmetall'), kraeuter: TX('Kräuter') };
Object.keys(MATERIALIEN).forEach(m => { ROHSTOFF_NAME[m] = MATERIALIEN[m].name; });
function kannBezahlen(k) { return Object.keys(k || {}).every(r => (SPIEL[r] || 0) >= k[r]); }
function bezahlen(k) { Object.keys(k || {}).forEach(r => { SPIEL[r] -= k[r]; }); }
function gutschreiben(k) { Object.keys(k || {}).forEach(r => { SPIEL[r] = (SPIEL[r] || 0) + k[r]; }); }
function kostenText(k) {
  const t = Object.keys(k || {}).filter(r => k[r]).map(r => k[r] + ' ' + ROHSTOFF_NAME[r]);
  return t.join(' · ') || TX('kostenlos');
}
function chronikEintragen(id) {
  if (!id || SPIEL.chronik.includes(id)) return false;
  SPIEL.chronik.push(id);
  return true;
}

// Was das Dorf in der Mission bringt
function missionsBoni() {
  const werkstatt = gebaeudeWert('werkstatt') === true, w = SPIEL.gebaeude.find(b => b.typ === 'werkstatt'), ws = w ? stufeVon(w) : {};
  return {
    schaden: gebaeudeWert('schaden') || 0,
    turmSchaden: 1 + (ws.werkstattBonus || 0) + (gebaeudeWert('turmPlus') || 0),
    werkstatt, extraMax: ws.extraMax || 0, startBonus: ws.startBonus || 0,
    startTeile: CFG.start.teile + (ws.startBonus || 0),
    soldaten: anzahlGebaeude('kaserne'),
    ladung: gebaeudeWert('ladung') || 0,   // Ladestation (nur mit Strom)
  };
}

function epochenZiel() {
  const e = EPOCHEN[SPIEL.epoche];
  if (!e || !e.ziel) return null;
  const punkte = [{ text: TX`${e.ziel.einwohner} Einwohner`, ok: SPIEL.einwohner >= e.ziel.einwohner, stand: Math.min(SPIEL.einwohner, e.ziel.einwohner) + ' / ' + e.ziel.einwohner }];
  (e.ziel.gebaeude || []).forEach(t => punkte.push({ text: GEBAEUDE[t].name, ok: hatGebaeude(t) }));
  for (const t in e.ziel.stufen || {}) { const n = e.ziel.stufen[t], b = SPIEL.gebaeude.find(x => x.typ === t && (x.stufe || 1) >= n); punkte.push({ text: GEBAEUDE[t].stufen[n - 1].name || GEBAEUDE[t].name, ok: !!b }); }
  if (e.ziel.mauer) punkte.push({ text: MAUERN[e.ziel.mauer].name, ok: (SPIEL.mauer || 0) >= e.ziel.mauer });
  for (const o in e.ziel.erledigt || {}) punkte.push({ text: TX`${ORTE[o].name} bezwungen`, ok: (SPIEL.karte.erledigt[o] || 0) >= e.ziel.erledigt[o] });
  if (e.ziel.siege) punkte.push({ text: TX`${e.ziel.siege} gewonnene Missionen`, ok: (SPIEL.siege || 0) >= e.ziel.siege, stand: Math.min(SPIEL.siege || 0, e.ziel.siege) + ' / ' + e.ziel.siege });
  if (e.ziel.stromGesamt) { const n = e.ziel.stromGesamt, g = SPIEL.strom.gesamt || 0; punkte.push({ text: TX`${n} Tage Strom insgesamt`, ok: g >= n, stand: Math.min(g, n) + ' / ' + n }); }
  if (e.ziel.verschmutzungUnter) { const n = e.ziel.verschmutzungUnter, v = Math.round(SPIEL.verschmutzung || 0); punkte.push({ text: TX`Verschmutzung unter ${n}`, ok: v < n, stand: v + ' / ' + n }); }
  if (e.ziel.verbuende) { const n = e.ziel.verbuende, k = verbuendeUnser(); punkte.push({ text: Object.keys(CLUSTER).some(verbundStill) ? TX`${n} Verbünde gewonnen oder stillgelegt` : TX`${n} Verbünde auf eurer Seite`, ok: k >= n, stand: Math.min(k, n) + ' / ' + n }); }
  if (e.ziel.nemesisBesiegt) { const n = e.ziel.nemesisBesiegt, k = SPIEL.bestehende ? SPIEL.bestehende.gefallen.length : 0; punkte.push({ text: n === 1 ? TX('Einen Erzfeind endgültig besiegt') : TX`${n} Erzfeinde endgültig besiegt`, ok: k >= n, stand: Math.min(k, n) + ' / ' + n }); }
  if (e.ziel.lebensstandard) { const ls = lebensstandard().wert; punkte.push({ text: TX`Lebensstandard ${e.ziel.lebensstandard}`, ok: ls >= e.ziel.lebensstandard, stand: ls + ' / ' + e.ziel.lebensstandard }); }
  return { punkte, fertig: punkte.every(p => p.ok) };
}

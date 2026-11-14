// =====================================================================
// MISSIONSSTAND: Eine laufende Mission übersteht das Neuladen.
// Gespeichert wird ein Abbild der Daten (G, P, Hindernisse, flackernde Kulissen, Reise) im
// Spielstand (SPIEL.laufend.stand). Beim Laden startet die Mission frisch
// mit ihrem eigenen Code (Landschaft, Figuren, 3D-Objekte), danach werden
// die gespeicherten Daten darübergelegt. Fortgesetzt wird als Pause.
//
// Neuer Missionstyp, Gegner, Turm, Verbündeter: Daten kommen von selbst mit,
// ebenso die Lage aller 3D-Objekte (Ort, sichtbar, Größe, gezeigtes Bild).
// Von selbst neu gebaut wird, was aus figur(), bodenFlaeche() oder einem
// angemeldeten Bauteil (standBauteil, z. B. kesselMarke) stammt.
// Was ein Typ sonst an 3D-Objekten erst im Lauf der Mission erzeugt, stellt sein
// Eintrag „stand“ bzw. „ausStand“ in seiner Tabelle wieder her (siehe unten).
// Der Testfall „missionsstand“ meldet, was nach dem Laden fehlt.
// =====================================================================

// alle: so viele Sekunden Spielzeit zwischen zwei Speicherungen (Safari meldet das Entladen nicht: höchstens so viel geht verloren)
const STAND = { fassung: 1, alle: 2 };
// Für Tabellen-Einträge, die nichts Eigenes wiederherstellen müssen: ausdrücklich eingetragen statt vergessen
function STAND_NICHTS() {}

// Felder von G, die nicht gespeichert werden: reine Anzeige (Partikel, Effekte, Zahlen, Flecken, Bäume, Ziellinie)
// und Geschosse im Flug (leben unter 1,5 Sekunden). Nach dem Laden bleiben sie, wie der frische Start sie anlegt.
const STAND_OHNE = ['partikel', 'effekte', 'zahlen', 'flecken', 'baeume', 'ziellinie', 'geschosse', 'pfeile', 'granaten', 'wurf'];
// Felder mit einer Uhrzeit der Seite (performance.now, nur für die Anzeige der neuen Grafik: Schlagbild bis, letzte Drehung). Nach dem Neuladen
// beginnt die Uhr der Seite wieder bei null: Mitgespeichert würde ein Gegner bis zu Minuten lang das Schlagbild zeigen und sich nicht drehen.
const STAND_UHR = new Set(['schlagBis', 'ringSeit']);

// Feste Tabellen: Ein Verweis dorthin (e.def, f.T, g.el) wird als Pfad gespeichert, nicht als Kopie
const standTabellen = () => ({ GEGNER, TECHNIKEN, KLASSEN, ELEMENTE, BAUWERKE, ELITE, ZUSTAENDE, BEGLEITER, WACHTURM, CFG, MAUERN });
let STAND_PFADE = null;
function standPfade() {
  if (STAND_PFADE) return STAND_PFADE;
  STAND_PFADE = new Map();
  const geh = (v, pfad, tiefe) => {
    if (!v || typeof v !== 'object' || STAND_PFADE.has(v) || standArt(v)) return;
    STAND_PFADE.set(v, pfad);
    if (tiefe < 4) for (const f of Object.keys(v)) geh(v[f], pfad + '.' + f, tiefe + 1);
  };
  const T = standTabellen();
  for (const name of Object.keys(T)) geh(T[name], name, 0);
  return STAND_PFADE;
}
function standPfadLesen(pfad) {
  const teile = pfad.split('.');
  let v = teile[0] === 'BILD' ? BILD : standTabellen()[teile[0]];
  for (let i = 1; i < teile.length && v; i++) v = v[teile[i]];
  return v;
}
// Bilder: Auch ein Verweis in die Bildertabelle BILD (e.bilder, das gerade gezeigte Bild einer Figur) wird als Pfad gespeichert.
// BILD ist groß und zum Teil faul (ein Bild entsteht erst beim ersten Zugriff): Durchlaufen wird nur, was schon gemalt ist.
// Ergebnis: Bild oder Bilderliste -> Pfad, Textur -> [Pfad des Bildes, Seite r/l/rw/lw]. Je Mission einmal neu.
let STAND_BILDER = null;
// Ein Bild, das standBilder nicht kennt, ist vielleicht erst nach dem letzten Durchlauf gemalt worden: Dann wird einmal neu durchlaufen
// (je unbekanntem Bild nur einmal, hier vermerkt).
const STAND_BILD_FREMD = new WeakSet();
function standBildFremd(v) { if (!STAND_BILD_FREMD.has(v)) { STAND_BILD_FREMD.add(v); STAND.bildFehlt = true; } }
function standBilder() {
  if (STAND_BILDER) return STAND_BILDER;
  const M = STAND_BILDER = new Map();
  const geh = (v, pfad, tiefe) => {
    if (!v || typeof v !== 'object' || M.has(v) || v.isTexture || v.isObject3D || v.isMaterial || (typeof Node !== 'undefined' && v instanceof Node)) return;
    M.set(v, pfad);
    if (v.r && v.r.isTexture) {
      for (const s of ['r', 'l', 'rw', 'lw']) if (v[s] && !M.has(v[s])) M.set(v[s], [pfad, s]);
      // Lichtkarten der neuen Grafik nur, wenn schon gemalt (ein Getter würde sie sonst jetzt malen)
      const ld = Object.getOwnPropertyDescriptor(v, 'licht'), licht = ld && 'value' in ld ? ld.value : null;
      if (licht) for (const s of ['r', 'l']) if (licht[s] && licht[s].map && !M.has(licht[s].map)) M.set(licht[s].map, [pfad, s]);
      return;
    }
    if (tiefe >= 5) return;
    for (const f of Object.keys(v)) { const d = Object.getOwnPropertyDescriptor(v, f); if (d && 'value' in d) geh(d.value, pfad + '.' + f, tiefe + 1); }
  };
  geh(BILD, 'BILD', 0);
  return M;
}

// Bauteile, die erst im Lauf einer Mission entstehen und aus Daten und 3D-Teilen bestehen (Figur, Warnmarke am Boden):
// Wer sie baut, vermerkt im Bauteil „bau“ (Name hier) und die Angaben, aus denen es sich neu bauen lässt.
// Beim Laden entsteht es über seinen Eintrag neu: neu(k, hol) mit k = gespeicherte Felder, hol(k.feld) löst einen Verweis auf.
// Gibt neu() nichts zurück (Angabe fehlt), bleibt die Stelle dem Eintrag „stand“ des Typs überlassen.
const STAND_BAUTEILE = {
  figur: (k, hol) => { const b = hol(k.bauBild); return b && b.r ? figur(b, k.bauSchatten) : null; },
};
function standBauteil(name, neu) { STAND_BAUTEILE[name] = neu; }
// Bodenflächen (bodenFlaeche): Ringe und Scheiben entstehen aus ihrer Lage neu. Name -> Form.
const STAND_FLAECHEN = { ring: () => ringGeo, scheibe: () => scheibeGeo };
function standFlaeche(geo) { for (const n of Object.keys(STAND_FLAECHEN)) if (STAND_FLAECHEN[n]() === geo) return n; return null; }

// Lage eines 3D-Objekts: n Nummer (dasselbe Objekt an zwei Stellen bleibt eines), p Ort, v sichtbar, w nicht mehr im Bild, b gezeigtes Bild,
// s Größe, d Drehung, o Deckkraft, f Bodenfläche [Form, Farbe]. So steht nach dem Laden alles dort, wo es stand
// (der Ablauf setzt vieles nur, wenn sich etwas ändert).
function standLage(o, n) {
  const r = x => Math.round(x * 1e5) / 1e5, p = o.position, m = o.material;
  const L = { n, p: [p.x, p.y, p.z], v: o.visible ? 1 : 0 };
  if (!o.parent) L.w = 1;
  const b = m && m.map && standBilder().get(m.map);
  if (m && m.map && !b) standBildFremd(m.map);
  if (b) { L.b = b; if (m.color && m.color.r > 1.5) L.h = 1; return L; }   // Figuren: Die Größe gibt das Bild vor
  if (o.isSprite) return L;
  const s = o.scale, d = o.rotation;
  L.s = [r(s.x), r(s.y), r(s.z)]; L.d = [r(d.x), r(d.y), r(d.z)];
  if (m && typeof m.opacity === 'number') L.o = r(m.opacity);
  if (o.userData.flaeche && m && m.color) L.f = [o.userData.flaeche, m.color.getHex()];
  return L;
}
// besitzer, feld: wo das Objekt hängt. Nur das Bild einer Figur (Feld „sprite“) bekommt sein gezeigtes Bild zurück.
function standLageSetzen(o, L, besitzer, feld) {
  o.position.set(L.p[0], L.p[1], L.p[2]); o.visible = !!L.v;
  if (L.w && o.parent) o.parent.remove(o);
  if (L.b && feld === 'sprite') { const b = standPfadLesen(L.b[0]); if (b && b.r) zeige(besitzer, b, L.b[1][0] === 'l' ? -1 : 1, !!L.h || L.b[1].length > 1); }
  if (L.s) o.scale.set(L.s[0], L.s[1], L.s[2]);
  if (L.d) o.rotation.set(L.d[0], L.d[1], L.d[2]);
  if (L.o !== undefined && o.material && typeof o.material.opacity === 'number') o.material.opacity = L.o;
  if (L.f && o.material && o.material.color) o.material.color.setHex(L.f[1]);
}

// Was sich nicht als Daten speichern lässt: Funktionen, 3D-Objekte, Seitenelemente, Bilder. null = Daten.
function standArt(v) {
  if (typeof v === 'function') return 'fn';
  if (v.isObject3D || v.isMaterial || v.isTexture || v.isBufferGeometry) return '3d';
  if (typeof Node !== 'undefined' && v instanceof Node) return 'dom';
  if (v.r && v.r.isTexture) return 'bild';
  return null;
}

// ---------------------------------------------------------------------
// Abbild: der Zustand als Liste von Knoten. Verweise bleiben Verweise ({ r: Nummer }), auch im Kreis.
// Knoten: { t: 'o' Objekt | 'a' Liste | 'm' Map | 's' Set, d: Inhalt, a: ausgelassene Felder mit ihrer Art (3D-Objekte: ihre Lage),
//           x: 1 = nur Ausgelassenes }
// Werte: Zahl, Text, wahr/falsch, null direkt; sonst { r } Knoten, { k } Pfad in eine feste Tabelle oder in BILD, { b } Gegenstand im Beutel,
// { g } Gebäude im Dorf, { z } Unendlich/NaN, { v } Vektor, { c } Farbe
// ---------------------------------------------------------------------
function standAbbild(wurzeln) {
  const K = [], nummer = new Map(), pfade = standPfade(), bilder = standBilder(), dreiD = new Map();
  const beutel = new Map((SPIEL.beutel || []).map(it => [it, it.uid])), bauten = new Map((SPIEL.gebaeude || []).map(b => [b, b.id]));
  const AUS = {};   // Rückgabe für Ausgelassenes
  const wert = v => {
    if (v === null || v === undefined) return v === null ? null : AUS;
    const typ = typeof v;
    if (typ === 'number') return Number.isFinite(v) ? v : { z: String(v) };
    if (typ === 'string' || typ === 'boolean') return v;
    if (typ === 'object' && !v.isTexture && bilder.has(v)) return { k: bilder.get(v) };
    const art = standArt(v);
    if (art) {
      if (v.isObject3D) { if (!dreiD.has(v)) dreiD.set(v, dreiD.size); AUS.art = standLage(v, dreiD.get(v)); } else AUS.art = art;
      if (art === 'bild') standBildFremd(v);
      return AUS;
    }
    if (nummer.has(v)) return { r: nummer.get(v) };
    if (pfade.has(v)) return { k: pfade.get(v) };
    if (beutel.has(v)) return { b: beutel.get(v) };
    if (bauten.has(v)) return { g: bauten.get(v) };
    if (v.isVector3 || v.isVector2) return { v: v.toArray() };
    if (v.isColor) return { c: v.getHex() };
    const n = K.length, k = { t: 'o', d: null };
    K.push(k); nummer.set(v, n);
    let daten = 0, aus = 0;
    const merke = (f, w) => { if (w === AUS) { if (AUS.art) { (k.a = k.a || {})[f] = AUS.art; aus++; AUS.art = null; } return true; } daten++; return false; };
    if (Array.isArray(v)) {
      k.t = 'a'; k.d = new Array(v.length);
      for (let i = 0; i < v.length; i++) { const w = wert(v[i]); k.d[i] = merke(i, w) ? null : w; }
    } else if (v instanceof Map) {
      k.t = 'm'; k.d = [];
      for (const [s, w] of v) { const a = wert(s), b = wert(w); if (a !== AUS && b !== AUS) k.d.push([a, b]); AUS.art = null; }
      daten = 1;
    } else if (v instanceof Set) {
      k.t = 's'; k.d = [];
      for (const w of v) { const a = wert(w); if (a !== AUS) k.d.push(a); AUS.art = null; }
      daten = 1;
    } else {
      k.d = {};
      for (const f of Object.keys(v)) { if (STAND_UHR.has(f)) continue; const w = wert(v[f]); if (!merke(f, w)) k.d[f] = w; }
    }
    // Enthält ein Objekt nur Ausgelassenes (Liste von 3D-Teilen), wird es beim Laden nicht als leere Hülle angelegt:
    // Es gilt für das frische Objekt gleicher Stelle, oder es entsteht aus den Lagen seiner Teile neu
    if (!daten && aus) k.x = 1;
    return { r: n };
  };
  const w = {};
  for (const name of Object.keys(wurzeln)) { const r = wert(wurzeln[name]); if (r !== AUS) w[name] = r; AUS.art = null; }
  return { k: K, w };
}

// Der Stand der laufenden Mission, so wie er in SPIEL.laufend.stand steht
function missionsstandAbbild() {
  const g = Object.assign({}, G);
  for (const f of STAND_OHNE) delete g[f];
  const bild = standAbbild({ G: g, P, H: HINDERNISSE, D: ANIM_DEKO });
  const kg = bild.k[bild.w.G.r]; kg.a = kg.a || {};
  for (const f of STAND_OHNE) kg.a[f] = 'ohne';
  return { f: STAND.fassung, version: SPIEL_VERSION, reise: REISE ? JSON.parse(JSON.stringify(REISE)) : null, runde: G.runde || 1, k: bild.k, w: bild.w };
}
// Aus spielSpeichern: Solange eine Mission läuft, geht ihr Stand mit jedem Speichern mit (Spielstand und Mission passen immer zusammen)
function missionsstandAuffrischen() {
  const L = SPIEL && SPIEL.laufend;
  if (!L || !G || modus !== 'mission' || MIS.markt || L.erg || L.verloren) return;
  // „sieg“ ohne Ergebnis: der Bildschirm zwischen zwei Runden
  if (G.zustand !== 'spiel' && G.zustand !== 'pause' && !(G.zustand === 'sieg' && G.runden && G.runde < G.runden.anzahl && !G.heimkehr)) return;
  if (!L.stand) STAND_BILDER = null;   // erstes Speichern dieser Mission: Bilder neu durchlaufen (seit der letzten Mission können neue gemalt sein)
  const t0 = performance.now();
  STAND.bildFehlt = false;
  L.stand = missionsstandAbbild();
  if (STAND.bildFehlt) { STAND_BILDER = null; L.stand = missionsstandAbbild(); }
  STAND.dauer = performance.now() - t0;   // für Tests: so lange hat das Abbild gedauert
}
let standZeit = 0;
// Aus der Hauptschleife, solange gespielt wird
function missionsstandTakt(dt) {
  standZeit += dt;
  if (standZeit < STAND.alle) return;
  standZeit = 0;
  if (SPIEL.laufend) spielSpeichern();
}
// Wer die Seite verlässt, ohne dass die Mission vorher pausiert hat (Safari meldet das nicht immer): Chrome, Firefox und Android speichern hier noch einmal
addEventListener('pagehide', () => { if (SPIEL && SPIEL.laufend && G && modus === 'mission') spielSpeichern(); });

// ---------------------------------------------------------------------
// Listen mit Figuren: Beim Laden wird jeder gespeicherte Eintrag neu erzeugt (Bild und Schatten), die Daten kommen danach darüber.
// neu(k, hol): k = gespeicherte Felder des Eintrags, hol(k.feld) löst einen Verweis auf. nach(o): wenn die Daten aufgelegt sind.
// Türme, Verbündete und Beute schlagen in ihren eigenen Tabellen nach (TURMTYPEN, verbuendetenArten, BEUTE_ARTEN).
// ---------------------------------------------------------------------
const STAND_LISTEN = {
  // Wer gerade ausholt, zeigt wieder, wohin er schlägt
  gegner:      { neu: k => gegnerErstellen(k.typ, k.x, k.z), nach: e => { if (e.zustand === 'ausholen' && !e.anzeige) angriffsAnzeige(e, Math.hypot(P.x - e.x, P.z - e.z)); } },
  tuerme:      { neu: k => figur(turmTyp(k).bild(k), 0.6) },
  verbuendete: { neu: k => verbuendetenArten()[k.art].ausStand(k) },
  beute:       { neu: k => figur(beuteBild(k.art, k.name), k.art === 'holz' && !k.vy && !k.y ? 0.3 : 0.2) },
  truhen:      { neu: k => figur(k.offen ? BILD.truheOffen : BILD.truhe, 0.7) },
  faesser:     { neu: () => figur(BILD.oelfass, 0.4), nach: f => { if (f.hp <= 0) entfernen(f); } },
  items:       { neu: (k, hol) => gegenstandFigur(hol(k.it)) },
  fallen:      { neu: () => figur(BILD.sprengfalle, 0) },
  oel:         { neu: k => ({ mesh: oelMesh(k.x, k.z, k.r) }), nach: o => { if (o.brennt > 0) oelFarbeBrand(o); } },
};

// ---------------------------------------------------------------------
// Auflegen: gespeicherte Knoten auf die frisch gestartete Mission legen
// ---------------------------------------------------------------------
// Alle 3D-Objekte und Seitenelemente, die von einem Zustand aus erreichbar sind
function standSichtbares(wurzeln) {
  const gefunden = new Set(), gesehen = new Set();
  const geh = (v, tiefe) => {
    if (!v || typeof v !== 'object' || gesehen.has(v)) return;
    gesehen.add(v);
    if (v.isObject3D || (typeof Node !== 'undefined' && v instanceof Node)) { gefunden.add(v); return; }
    if (standArt(v) || tiefe > 12) return;
    if (v instanceof Map) { for (const [s, w] of v) { geh(s, tiefe + 1); geh(w, tiefe + 1); } return; }
    if (v instanceof Set) { for (const w of v) geh(w, tiefe + 1); return; }
    for (const f of Object.keys(v)) geh(v[f], tiefe + 1);
  };
  wurzeln.forEach(w => geh(w, 0));
  return gefunden;
}
// Rückgabe: lagen(), noch einmal aufzurufen, wenn die Einträge „stand“ der Typen ihre 3D-Objekte angelegt haben (sie bekommen dann ihre Lage)
function standAuflegen(stand, wurzeln, listen) {
  const K = stand.k, lebend = new Array(K.length), fertig = new Array(K.length), gepaart = new Array(K.length), vergeben = new Set();
  const dreiD = new Map();   // Nummer eines 3D-Objekts im Stand -> das Objekt, das jetzt dafür steht
  const vorher = standSichtbares(Object.values(wurzeln));
  const gleich = (a, b) => typeof a !== 'string' || typeof b !== 'string' || a === b;
  const passt = (k, frisch) => !!frisch && typeof frisch === 'object' && !vergeben.has(frisch) && !standArt(frisch) && !standPfade().has(frisch) && !standBilder().has(frisch)
    && (k.t === 'a') === Array.isArray(frisch) && (k.t === 'm') === (frisch instanceof Map) && (k.t === 's') === (frisch instanceof Set)
    && (k.t !== 'o' || (gleich(k.d.art, frisch.art) && gleich(k.d.typ, frisch.typ)));
  const felder = k => k.t === 'a' ? k.d.map((_, i) => i) : k.t === 'o' ? Object.keys(k.d) : [];
  // Paaren: Jeder gespeicherte Knoten bekommt das frische Objekt, das an derselben Stelle hängt (von den Wurzeln aus, Feld für Feld).
  // Erst wenn alle Paare feststehen, wird gefüllt: So entscheidet der eigene Platz eines Objekts, nicht der erste Verweis darauf.
  const paaren = n => {
    if (gepaart[n]) return;
    gepaart[n] = true;
    const k = K[n], z = lebend[n];
    for (const f of felder(k)) {
      const w = k.d[f];
      if (!w || typeof w !== 'object' || w.r === undefined) continue;
      if (lebend[w.r] === undefined && passt(K[w.r], z[f])) { lebend[w.r] = z[f]; vergeben.add(z[f]); }
      if (lebend[w.r] !== undefined) paaren(w.r);
    }
  };
  const wert = w => {
    if (w === null || typeof w !== 'object') return w;
    if (w.z !== undefined) return Number(w.z);
    if (w.k !== undefined) return standPfadLesen(w.k);
    if (w.b !== undefined) return SPIEL.beutel.find(it => it.uid === w.b) || null;
    if (w.g !== undefined) return SPIEL.gebaeude.find(b => b.id === w.g) || null;
    if (w.v !== undefined) return w.v.length === 2 ? new THREE.Vector2().fromArray(w.v) : new THREE.Vector3().fromArray(w.v);
    if (w.c !== undefined) return new THREE.Color(w.c);
    const n = w.r, k = K[n];
    if (lebend[n] === undefined) {
      const bau = k.t === 'o' && typeof k.d.bau === 'string' && STAND_BAUTEILE[k.d.bau];
      const o = bau ? bau(k.d, wert) : null;
      if (o) lebend[n] = o;
      else if (k.x) return undefined;   // nur 3D-Teile und nichts Frisches an dieser Stelle: entsteht aus den Lagen (bauen) oder über „stand“ des Typs
      else lebend[n] = k.t === 'a' ? [] : k.t === 'm' ? new Map() : k.t === 's' ? new Set() : {};
      vergeben.add(lebend[n]);
    }
    fuellen(n);
    return lebend[n];
  };
  const lage = (z, f, L, bauen) => {
    if (!L || typeof L !== 'object') return;
    let o = z[f];
    if (!(o && o.isObject3D)) {
      if (!bauen || L.w) return;
      o = dreiD.get(L.n) || (L.f && STAND_FLAECHEN[L.f[0]] ? bodenFlaeche(STAND_FLAECHEN[L.f[0]](), L.f[1], L.o === undefined ? 1 : L.o) : null);
      if (!o) return;
      z[f] = o;
    }
    if (!dreiD.has(L.n)) dreiD.set(L.n, o);
    standLageSetzen(o, L, z, f);
  };
  const fuellen = n => {
    if (fertig[n]) return;
    fertig[n] = true;
    const k = K[n], z = lebend[n];
    if (k.t === 'a') {
      for (let i = 0; i < k.d.length; i++) { if (k.a && i in k.a) continue; const w = wert(k.d[i]); z[i] = w === undefined ? (z[i] === undefined ? null : z[i]) : w; }
      z.length = k.d.length;
    } else if (k.t === 'm') {
      z.clear(); for (const [s, w] of k.d) z.set(wert(s), wert(w));
    } else if (k.t === 's') {
      z.clear(); for (const w of k.d) z.add(wert(w));
    } else {
      for (const f of Object.keys(z)) if (!(f in k.d) && !(k.a && f in k.a)) delete z[f];
      for (const f of Object.keys(k.d)) { const w = wert(k.d[f]); if (w === undefined) delete z[f]; else z[f] = w; }
    }
    if (k.a) for (const f of Object.keys(k.a)) lage(z, f, k.a[f], false);
  };
  // 3D-Objekte, die es noch nicht gibt, aus ihrer Lage bauen (Bodenflächen) und jedem seine Lage geben. Läuft zweimal: nach dem Füllen
  // und nach den Einträgen „stand“ der Typen.
  const lagen = () => {
    for (let n = 0; n < K.length; n++) {
      const k = K[n], z = lebend[n];
      if (!z || k.t === 'm' || k.t === 's') continue;
      for (const f of felder(k)) {
        // Hüllen aus lauter 3D-Teilen (Liste von Ringen), die frisch nicht da waren: übernehmen, was „stand“ angelegt hat, oder neu anlegen
        const w = k.d[f];
        if (!w || typeof w !== 'object' || w.r === undefined || lebend[w.r] !== undefined || !K[w.r].x) continue;
        const kk = K[w.r], da = z[f] && typeof z[f] === 'object' && !standArt(z[f]) && !vergeben.has(z[f]);
        const baubar = Object.keys(kk.a || {}).some(g => kk.a[g] && typeof kk.a[g] === 'object' && (kk.a[g].f || dreiD.has(kk.a[g].n)));
        if (!da && !baubar) continue;
        if (!da) z[f] = kk.t === 'a' ? [] : {};
        lebend[w.r] = z[f]; vergeben.add(z[f]);
        if (w.r < n) for (const g of Object.keys(kk.a)) lage(z[f], g, kk.a[g], true);   // schon vorbei: gleich behandeln
      }
      if (k.a) for (const f of Object.keys(k.a)) lage(z, f, k.a[f], true);
    }
  };
  // Die Wurzeln selbst
  const wurzelNr = [];
  for (const name of Object.keys(wurzeln)) { const w = stand.w[name]; if (w && w.r !== undefined) { lebend[w.r] = wurzeln[name]; vergeben.add(wurzeln[name]); wurzelNr.push(w.r); } }
  // Zuerst die Listen mit Figuren: frische Einträge weg, gespeicherte neu erzeugen. So zeigen alle Verweise (A.boss, e.ziel) auf die neuen Figuren.
  const neue = [];
  const g = stand.w.G && K[stand.w.G.r];
  for (const name of Object.keys(listen)) {
    const L = listen[name], liste = wurzeln.G[name], w = g && g.d[name];
    if (!Array.isArray(liste) || !w || w.r === undefined) continue;
    liste.forEach(o => { if (o.anzeige) anzeigeWeg(o); infoWeg(o); entfernen(o); });
    liste.length = 0;
    lebend[w.r] = liste; vergeben.add(liste); fertig[w.r] = true; gepaart[w.r] = true;
    for (const e of K[w.r].d) {
      if (!e || e.r === undefined) continue;
      const k = K[e.r], o = L.neu(k.d, wert);
      lebend[e.r] = o; vergeben.add(o);
      if (!liste.includes(o)) liste.push(o);
      neue.push([L, o, e.r]);
    }
  }
  for (const n of wurzelNr) paaren(n);
  for (const [, , n] of neue) paaren(n);
  for (const n of wurzelNr) fuellen(n);
  for (const [, , n] of neue) fuellen(n);
  lagen();
  // Was frisch entstanden ist und im Stand nicht mehr vorkommt, verschwindet aus dem Bild
  const nachher = standSichtbares(Object.values(wurzeln));
  for (const o of vorher) if (!nachher.has(o)) { if (o.isObject3D) { if (o.parent) o.parent.remove(o); objektEntsorgen(o); } else o.remove(); }
  for (const [L, o] of neue) if (L.nach) L.nach(o);
  return lagen;
}

// ---------------------------------------------------------------------
// Fortsetzen nach dem Laden
// ---------------------------------------------------------------------
let STAND_LAEDT = false;   // true, während eine Mission aus dem Stand neu aufgebaut wird (missionStarten vermerkt dann nichts)
function missionFortsetzen(L) {
  const S = L.stand, g = S.k[S.w.G.r].d;
  REISE = S.reise;
  // Spätere Runden einer Mission starten wie beim Weiterspielen (stärkere Gegner, Spielfeld der Runde)
  RUNDE_WEITER = S.runde > 1 ? { nr: S.runde, runden: null, leben: 1, gold: 0, teile: 0, material: {}, gefunden: [], punkte: 0, siege: 0, erfahrung: 0 } : null;
  const mis = MISSIONEN[L.mission];
  if (mis.stand && mis.stand.vor) mis.stand.vor();
  STAND_LAEDT = true;
  let lagen;
  try {
    missionStarten(g.startOrt, L.mission);
    lagen = standAuflegen(S, { G, P, H: HINDERNISSE, D: ANIM_DEKO }, STAND_LISTEN);
    // Kulissen, die im Lauf dazukamen (brennendes Zelt): nur, was sich neu bauen ließ
    for (let i = ANIM_DEKO.length - 1; i >= 0; i--) { const a = ANIM_DEKO[i]; if (!a || !a.bilder || !a.o || !a.o.sprite) ANIM_DEKO.splice(i, 1); }
  } finally { STAND_LAEDT = false; RUNDE_WEITER = null; }
  const toast = document.getElementById('toast'); if (toast) toast.classList.remove('show');   // Meldungen des frischen Starts
  G.partikel.forEach(p => szene.remove(p.sprite)); G.partikel = [];                              // und sein Staub
  navBauen();
  // Je Typ: was der frische Start nicht anlegt (Tabellen der Verzögerungen, Klassen, Missionen und Missionstypen)
  for (const s of G.spaeter) { const A = SPAETER_ARTEN[s.art]; if (A && A.stand) A.stand(s.daten || {}); }
  KLASSEN_ABLAUF[P.klasse].stand();
  if (mis.stand && mis.stand.nach) mis.stand.nach();
  const T = mis.typ && auftragstypen()[mis.typ];
  if (T) T.stand(G.auftrag);
  lagen();
  // Eingaben überstehen das Laden nicht: Niemand hält gerade eine Taste
  eingabe.mausGedrueckt = false; eingabe.touchAngriff = false; P.laedt = false; P.ladung = 0; P.zielen = null;
  if (P.ladeRing) P.ladeRing.visible = false;
  missionsUiEinrichten();
  const zwischen = G.zustand === 'sieg';
  G.zustand = 'spiel';
  missionHudAktualisieren(true);
  missionDarstellen(0);
  if (zwischen) return rundeGeschafft();
  G.zustand = 'pause';
  pauseBildschirm();
  meldung(TX('Mission fortgesetzt'), TX('Du machst dort weiter, wo du aufgehört hast.'), 3200);
}

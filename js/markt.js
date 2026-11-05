// =====================================================================
// DER MARKT VON ALTBRÜCK: ein Platz zum Herumlaufen, ohne Kampf.
//  - In der Mitte der Brunnen mit Blumenbeeten und Bänken, im Norden die Bühne
//    mit dem schwarzen Brett (Marktaufträge) und dem weißen Brett (Geschichten,
//    Gesuche, Anfragen), im Süden ein Spielplatz und das Tor nach Hause.
//  - 10 Stände im Kreis: Birkenhain, Eisenfurt, dein eigener Stand, der Rest
//    ist zugenagelt (für Mitspieler und spätere Händler).
//  - Ansehen 0–100: steigt mit Handel und Aushängen, senkt die Preise.
// Ein Besuch kostet einen Tag (beim Verlassen).
// =====================================================================

let MARKT_AKTIV = false;
function marktDaten() {
  if (!SPIEL.markt) SPIEL.markt = { ansehen: MARKT.ansehen.start, stand: null, aushaenge: [], aushangTag: -99, notizen: [], geruechtTag: -1 };
  return SPIEL.markt;
}
function marktRabatt() { const a = marktDaten().ansehen; for (const [ab, m] of MARKT.rabatt) if (a >= ab) return m; return 1; }
function marktAnsehen(n) { const M = marktDaten(); M.ansehen = Math.max(0, Math.min(100, M.ansehen + n)); }

// Die zehn Plätze für Stände. Belegung: die bekannten Dörfer, dein Stand, der Rest zugenagelt.
const MARKT_PLAETZE = [[-13, -8.5], [-7, -9.5], [7, -9.5], [13, -8.5], [-15.5, -1.5], [-15.5, 4.5], [15.5, -5], [14.5, 8.2], [-11.5, 9.5], [9.5, 10]];
const MARKT_STAENDE = [];   // die Bilder der Stände, damit ein gekaufter Stand sofort aufgeht
const MARKT_BELEGUNG = [
  { art: 'dorf', ort: 'birkenhain', farbe: 0, wer: 2 },
  { art: 'dorf', ort: 'eisenfurt', farbe: 1, wer: 5 },
  { art: 'spieler', farbe: 3 },
  { art: 'rostbrecher', farbe: 4 },
];
const MARKT_MITTE = [0, 0];

// Gesuche und Geschichten am weißen Brett: jede einmal, sie kommen in die Chronik
const MARKT_NOTIZEN = [
  { id: 'vermisst', lore: 'vermisst', wenn: () => (SPIEL.karte.erledigt.stadt || 0) >= 1 },
  { id: 'kopfgeld', lore: 'kopfgeld', wenn: () => hatLore('fuchs') },
  { id: 'rostbrecher', lore: 'rostbrecher', wenn: () => SPIEL.epoche >= 2 && storyAb('verbuende') },
];

// ---------------------------------------------------------------------
// Das Spielfeld
// ---------------------------------------------------------------------
// Die Gasse im Osten: ein Rechteck, das vom Platz abgeht. Darin der Hehler, die Elster und das Haus „Zur Waage“.
const MARKT_GASSE = [16, -1.6, 27, 5];
const MARKT_RUND = { kreis: [0, 0.5, 18] };   // der Platz ist rund, in den Ecken stehen Häuser
const MARKT_ORTE = { hehler: [21.5, 3.4], elster: [18.4, -0.4], tuer: [23.5, -0.6] };
function aufbauMarkt() {
  szene.background = new THREE.Color('#0c100e');
  const F = FELD, [gx0, gz0, gx1, gz1] = MARKT_GASSE;
  const boden = malBoden(72, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.3 + Math.cos(z * 1.1) * 0.3;
    if (x > gx0 && x < gx1 + 0.6 && z > gz0 - 0.6 && z < gz1 + 0.6) return 'gasse';
    if (Math.hypot(x - MARKT_RUND.kreis[0], z - MARKT_RUND.kreis[1]) > MARKT_RUND.kreis[2] + 0.8 + wob || z < F.zMin - 1 + wob) return 'mauer';
    if (z > F.zMax + 0.8 && Math.abs(x) > 2.6) return 'mauer';
    const d = Math.hypot(x - MARKT_MITTE[0], (z - MARKT_MITTE[1]) * 1.25);
    if (d < 2.6) return 'pflaster';
    if (d < 4.4 + wob * 0.3) return 'beet';
    return 'platz';
  }, {
    platz:    ['#5a5060', '#625868', '#544a5a', '#6a6070'],
    pflaster: ['#6a6070', '#74687a', '#605668', '#7e7286'],
    beet:     ['#2e4a28', '#36542e', '#284224', '#40603a'],
    gasse:    ['#2e2a34', '#34303a', '#28242e', '#3a3440'],
    mauer:    ['#2a2228', '#30282e', '#241e24', '#3a3036'],
  }, 131);
  const { g, toPx, r } = boden;
  // Pflastersteine
  for (let z = F.zMin; z < F.zMax + 2; z += 0.5) for (let x = -18; x < gx1; x += 0.5) {
    const art = boden.artBei(toPx(x) + 2, toPx(z) + 2);
    if (art !== 'platz' && art !== 'gasse') continue;
    g.fillStyle = art === 'gasse' ? '#201c26' : r() < 0.5 ? '#4a4252' : '#463e4e'; g.fillRect(toPx(x), toPx(z), 8, 1); g.fillRect(toPx(x) + ((z * 2) % 2 ? 4 : 0), toPx(z), 1, 8);
  }
  // Pfützen und Unrat in der Gasse
  for (let k = 0; k < 6; k++) { const cx = toPx(gx0 + 1 + r() * (gx1 - gx0 - 2)), cy = toPx(gz0 + 0.5 + r() * 3); for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.6 ? '#1a2030' : '#2a3448'; g.fillRect(cx + (r() * 12 - 6 | 0), cy + (r() * 5 - 2 | 0), 1, 1); } }
  streuBlumen(boden, (px, py) => boden.artBei(px, py) === 'beet', 260);
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'beet', 400, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuDetails(boden, (px, py) => boden.artBei(px, py) === 'platz', 900);
  bodenMesh(boden, 72);
  // Mitte: Brunnen, Bänke, Laternen
  decoBild(missionBau('brunnen'), MARKT_MITTE[0], MARKT_MITTE[1] + 0.4, 1.4, 0);
  [[-3.6, 3.4], [3.6, 3.4], [-3.6, -3.2], [3.6, -3.2]].forEach(([x, z]) => decoBild(BILD.bank, x, z, 0.5));
  [[-5, 0], [5, 0], [0, 4.4]].forEach(([x, z]) => decoBild(BILD.laterne, x, z, 0.22));
  [[-2.8, 2], [2.8, 2], [-2.8, -1.8], [2.8, -1.8]].forEach(([x, z], i) => decoBild(missionBau('blumenbeet', i % 3), x, z, 0, 0));
  // Norden: Bühne mit den beiden Brettern, dahinter die alte Marktkirche
  decoBild(BILD.buehne, 0, -10.6, 0, 0);
  for (let x = -2.8; x <= 2.8; x += 0.9) HINDERNISSE.push({ x, z: -10.8, r: 0.7 });
  decoBild(BILD.brettSchwarz, -3, -8.3, 0.6);
  decoBild(BILD.brettWeiss, 3, -8.3, 0.6);
  decoBild(missionBau('kirche'), 0.5, -13.4, 0, 0.8);
  // Süden: Spielplatz mit Kindern, das Tor
  decoBild(BILD.schaukel, -6.5, 7.5, 0.6); decoBild(BILD.wippe, -4, 9.2, 0.6);
  decoBild(BILD.bewohner[4][0], neueGrafik() ? -8.4 : -6.5, 8.2, 0, 0.3); decoBild(BILD.bewohner[1][0], -4.8, 9.6, 0, 0.3);
  for (let x = -17; x <= 17; x += 1.1) if (Math.abs(x) > 2.4) decoBild(BILD.zaun, x, F.zMax + 0.6, 0, 0);
  // Ringsum Stadthäuser, jedes anders; dazwischen eine Ruine und weit hinten die Hochhäuser der Alten
  const rr = zufall(133); let n = 0;
  const haus = (x, z) => { const i = n++; decoBild(i % 7 === 5 ? BILD.ruine[i % 4] : BILD.stadthaus[(i * 3) % BILD.stadthaus.length], x + (rr() - 0.5) * 0.4, z, 0, 0.6); };
  // Die Häuser folgen dem runden Platz: in den Ecken rücken sie nach innen
  const rund = (x, z) => { const [cx, cz, rad] = MARKT_RUND.kreis, d = Math.hypot(x - cx, z - cz); return d < rad + 1.6 ? [cx + (x - cx) / d * (rad + 1.6), cz + (z - cz) / d * (rad + 1.6)] : [x, z]; };
  for (let x = -16.5; x <= 16.5; x += 2.9) if (Math.abs(x) > 3.6) haus(...rund(x, -13.2));
  for (let z = -10; z <= 10; z += 2.8) haus(...rund(-19.6, z));
  for (let z = -10; z <= 10; z += 2.8) if (z < gz0 - 1.4) haus(...rund(19.6, z));
  [[-16.6, -11.2], [16.2, -11.2], [-16.8, 10.6]].forEach(([x, z]) => haus(x, z));
  // südlich der Gasse nur Niedriges, sonst verdecken die Häuser den Blick hinein
  decoBild(BILD.ruine[2], 20, gz1 + (neueGrafik() ? 6.5 : 5.5), 0, 0.6); decoBild(missionBau('faesser', 0), 18.2, gz1 + 2.4, 0, 0.6); decoBild(BILD.laubbaum[2], 21.5, 11, 0, 0.8);
  [-24, -8, 9, 26].forEach((x, i) => decoBild(BILD.hochhaus[i], x, -22 - i % 2 * 3, 0, 0));
  [-12, -8, 8, 12].forEach((x, i) => decoBild(BILD.laubbaum[i], x, F.zMax + 3.5, 0, 0.8));
  // Osten: die Gasse. Nordseite: das Haus „Zur Waage“, Südseite nur Kisten und Fässer, damit man hineinsieht
  decoBild(BILD.stadthaus[5], 18.6, gz0 - 0.9, 0, 0.6); decoBild(BILD.stadthaus[2], 26.2, gz0 - 0.9, 0, 0.6);
  animDeko(decoBild(BILD.hausWaage[0], MARKT_ORTE.tuer[0], gz0 - 0.5, 0, 0.6), BILD.hausWaage, 1.2);
  decoBild(BILD.ziegelwand[1], gx1 + 1.2, 1.6, 0, 0);
  decoBild(BILD.tuersteher, MARKT_ORTE.tuer[0] + 2, gz0 + 0.6, 0.5, 0.4);
  decoBild(BILD.hehlerstand, MARKT_ORTE.hehler[0], gz1 + 0.3, 0, 0.6);
  decoBild(BILD.hehler, MARKT_ORTE.hehler[0] + 1.6, gz1, 0, 0.3);
  decoBild(BILD.elster, MARKT_ORTE.elster[0], gz0 + 0.1, 0, 0.3);
  [[17.4, gz1 + 0.4], [25.2, gz1 + 0.2]].forEach(([x, z], i) => decoBild(BILD.kisten[i], x, z, 0, 0.6));
  decoBild(BILD.tonne, 19.2, gz1 + 0.2, 0, 0.4); decoBild(missionBau('faesser', 1), 26.4, 2.4, 0.6, 0.6);
  [[16.6, gz0 - 0.4], [16.6, gz1 + 0.4], [21, gz0 - 0.3], [25.5, gz1 + 0.5]].forEach(([x, z]) => decoBild(BILD.laterne, x, z, 0, 0.2));
  for (let x = gx0 + 0.6; x < gx1; x += 1.1) if (Math.abs(x - MARKT_ORTE.hehler[0]) > 2.2) decoBild(BILD.zaun, x, gz1 + 1.2, 0, 0);
  // Die Stände
  MARKT_PLAETZE.forEach(([x, z], i) => {
    const b = MARKT_BELEGUNG[i], offen = b && marktStandOffen(b);
    MARKT_STAENDE[i] = decoBild(offen ? BILD.bude[b.farbe] : BILD.budeZu, x, z, 1.3, 0);
    if (offen && b.art === 'dorf') decoBild(BILD.bewohner[b.wer][0], x + 1.1, z + 0.5, 0, 0.3);
    if (offen && b.art === 'rostbrecher') decoBild(BILD.hanne, x + 1.1, z + 0.5, 0, 0.3);
  });
}
// Ein Dorf stellt seinen Stand erst auf, wenn man es selbst besucht hat und gut miteinander auskommt
function dorfStandGrund(ort) {
  const D = MARKT.dorfStand, n = (SPIEL.karte.besucht[ort] || 0), rel = SPIEL.beziehungen[ort] || 0, name = ORTE[ort].name;
  if (!ortBekannt(ort)) return TX('Ein leerer Stand. Ein Zettel daran: „Reserviert für ein Nachbardorf.“');
  if (n < D.besuche) return TX`Der Stand von ${name} bleibt noch zu. Besucht das Dorf erst selbst (${n} von ${D.besuche} Besuchen).`;
  if (rel < 0) return TX`${name} ist mit euch verstritten. Auf dem Markt handeln sie nicht mit euch.`;
  if (rel < D.beziehung) return TX`${name} kennt euch noch zu wenig. Erst wenn ihr freundlich miteinander seid, handeln sie hier mit euch.`;
  return '';
}
// Ist ein Stand belegt? Dorfstände erst, wenn man das Dorf kennt; dein Stand erst, wenn du ihn gekauft hast
function marktStandOffen(b) {
  if (b.art === 'dorf') return !dorfStandGrund(b.ort);
  if (b.art === 'spieler') return !!marktDaten().stand;
  if (b.art === 'rostbrecher') return rostbrecherBekannt();
  return false;
}

// ---------------------------------------------------------------------
// Ablauf: herumlaufen, an Ständen und Brettern handeln, durchs Tor heim
// ---------------------------------------------------------------------
function marktStarten() {
  const A = G.auftrag;
  MARKT_AKTIV = true; marktDaten();
  A.vorrat = {}; A.handel = 0; A.muenze = false;
  A.punkte = [
    ...MARKT_PLAETZE.map(([x, z], i) => ({ x, z: z + 1.3, art: 'stand', i })),
    { x: -3, z: -7.2, art: 'brett' }, { x: 3, z: -7.2, art: 'weiss' },
    { x: MARKT_MITTE[0], z: MARKT_MITTE[1] + 2, art: 'brunnen' },
    { x: MARKT_ORTE.tuer[0], z: MARKT_ORTE.tuer[1], art: 'tuer' }, { x: MARKT_ORTE.hehler[0], z: MARKT_ORTE.hehler[1], art: 'hehler' }, { x: MARKT_ORTE.elster[0], z: MARKT_ORTE.elster[1], art: 'elster' },
    { x: 0, z: FELD.zMax - 0.4, art: 'ausgang' },
  ];
  ['tbtns', 'technikLeiste', 'hint'].forEach(id => { const el = document.getElementById(id); if (el) el.dataset.marktVorher = el.hidden ? '1' : '0', el.hidden = true; });
  let k = document.getElementById('marktKnopf');
  if (!k) {
    k = document.createElement('button'); k.id = 'marktKnopf'; k.type = 'button'; k.className = 'btn';
    k.addEventListener('click', () => marktInteragieren());
    document.body.append(k);
  }
  k.hidden = true;
  meldung(TX('Der Markt von Altbrück'), TX('Lauf zu einem Stand oder Brett und drück F (oder tipp auf den Knopf). Durchs Tor im Süden geht es heim.'), 3200);
}
function marktUiAus() {
  MARKT_AKTIV = false;
  ['tbtns', 'technikLeiste', 'hint'].forEach(id => { const el = document.getElementById(id); if (el && el.dataset.marktVorher !== undefined) { el.hidden = el.dataset.marktVorher === '1'; delete el.dataset.marktVorher; } });
  const k = document.getElementById('marktKnopf'); if (k) k.hidden = true;
}
// Was liegt in Reichweite?
function marktNaechster() {
  let best = null, bd = 2.6;
  for (const p of G.auftrag.punkte) { const d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd) { bd = d; best = p; } }
  return best;
}
function marktPunktText(p) {
  if (p.art === 'stand') {
    const b = MARKT_BELEGUNG[p.i];
    if (b && b.art === 'dorf' && marktStandOffen(b)) return TX`Handeln: Stand aus ${ORTE[b.ort].name}`;
    if (b && b.art === 'dorf' && ortBekannt(b.ort)) return TX`Der Stand aus ${ORTE[b.ort].name} (geschlossen)`;
    if (b && b.art === 'spieler') return marktStandOffen(b) ? TX('Dein Stand') : TX('Stand zu verkaufen');
    if (b && b.art === 'rostbrecher' && marktStandOffen(b)) return TX('Der Stand der Rostbrecher');
    return TX('Zugenagelter Stand');
  }
  return { brett: TX('Schwarzes Brett: Marktaufträge'), weiss: TX('Weißes Brett: Gesuche und Geschichten'), brunnen: TX('Eine Münze in den Brunnen werfen'), tuer: marktDaten().kontrolle ? TX('Dein Kontor im Haus „Zur Waage“') : TX('Die Tür des Hauses „Zur Waage“'), hehler: TX('Der Hehler'), elster: TX('Die Elster: Neuigkeiten gegen Gold'), ausgang: TX('Markt verlassen (ein Tag vergeht)') }[p.art];
}
function marktAblauf() {
  const p = marktNaechster(), k = document.getElementById('marktKnopf');
  if (!k) return;
  k.hidden = !p;
  if (p) { const t = marktPunktText(p) + (istTouch ? '' : ' · F'); if (k.textContent !== t) k.textContent = t; }
}
function marktHud() {
  const M = marktDaten();
  hudText('waveLabel', TX('Markt von Altbrück'));
  hudText('waveSub', TX`Ansehen ${Math.round(M.ansehen)} / 100${marktRabatt() < 1 ? TX` · Preise −${Math.round((1 - marktRabatt()) * 100)} %` : ''}`);
  hudText('doorLabel', TX('Ansehen'));
  document.getElementById('doorFill').style.width = M.ansehen + '%';
}
// Ein Dialog hält das Spiel an; danach geht es auf dem Platz weiter
function marktDialog(fn) {
  G.zustand = 'markt';
  const k = document.getElementById('marktKnopf'); if (k) k.hidden = true;
  fn(() => { overlayWeg(); if (G) G.zustand = 'spiel'; });
}
function marktInteragieren() {
  if (!G || G.zustand !== 'spiel' || !MIS.markt) return;
  const p = marktNaechster();
  if (!p) return;
  geraeusch('klick');
  if (p.art === 'ausgang') return marktVerlassen();
  if (p.art === 'stand') {
    const b = MARKT_BELEGUNG[p.i];
    if (b && b.art === 'dorf' && marktStandOffen(b)) return marktDialog(zurueck => { G.auftrag.vorrat[b.ort] = G.auftrag.vorrat[b.ort] || {}; handelZeigen(b.ort, G.auftrag.vorrat[b.ort], null, zurueck); });
    if (b && b.art === 'spieler') return marktDialog(zurueck => standZeigen(zurueck));
    if (b && b.art === 'dorf') return marktDialog(zurueck => marktHinweis(TX`Der Stand aus ${ORTE[b.ort].name}`, dorfStandGrund(b.ort), zurueck));
    if (b && b.art === 'rostbrecher' && marktStandOffen(b)) return marktDialog(zurueck => rostbrecherZeigen(zurueck));
    return marktDialog(zurueck => marktHinweis(TX('Zu vermieten'), TX('Bretter vor der Bude, ein Zettel: „Zu vermieten. Nachfragen beim Marktvogt.“ Vielleicht zieht hier bald jemand ein.'), zurueck));
  }
  if (p.art === 'brett') return marktDialog(zurueck => brettZeigen(zurueck));
  if (p.art === 'weiss') return marktDialog(zurueck => weissesBrettZeigen(zurueck));
  if (p.art === 'tuer') return marktDialog(zurueck => tuerZeigen(zurueck));
  if (p.art === 'hehler') return marktDialog(zurueck => hehlerZeigen(zurueck));
  if (p.art === 'elster') return marktDialog(zurueck => elsterZeigen(zurueck));
  if (p.art === 'brunnen') {
    if (G.auftrag.muenze || SPIEL.gold < 1) return marktDialog(zurueck => marktHinweis(TX('Der Brunnen'), TX('Das Wasser glitzert. Für heute hast du dir genug gewünscht.'), zurueck));
    SPIEL.gold -= 1; G.auftrag.muenze = true; marktAnsehen(1);
    return marktDialog(zurueck => marktHinweis(TX('Der Brunnen'), [TX('Die Münze klingt hell auf dem Grund. Ein Kind am Rand grinst dich an.'), TX('Plopp. Eine alte Frau nickt dir zu. „Wer hier wirft, kommt wieder“, sagt sie.'), TX('Die Münze landet zwischen hundert anderen. Irgendwer hat hier einmal einen Lazi-Splitter hineingeworfen, er leuchtet noch.')][Math.floor(Math.random() * 3)], zurueck));
  }
}
function marktHinweis(titel, text, zurueck) {
  overlayZeigen(`<div class="card panel" role="dialog" aria-labelledby="mh"><div class="label">${esc(TX('Markt von Altbrück'))}</div>
    <h1 id="mh">${esc(titel)}</h1><p class="story">${esc(text)}</p>
    <button class="btn" data-a="zurueck" type="button">${esc(TX('Zurück auf den Platz'))}</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
}

// ---------------------------------------------------------------------
// Dein eigener Stand: Waren hineinlegen, Preis wählen. Verkauft wird jeden Tag (marktTag).
// ---------------------------------------------------------------------
function standKaufbar() { const M = marktDaten(); return M.ansehen >= MARKT.stand.ansehen && SPIEL.gold >= MARKT.stand.gold; }
function standErwartung(r) {
  const S = marktDaten().stand, n = S.lager[r] || 0, st = S.stufe[r] === undefined ? 2 : S.stufe[r];
  const menge = Math.min(n, Math.round(MARKT.nachfrage[r] * MARKT.absatz[st] * (0.75 + marktDaten().ansehen / 200)));
  return { menge, gold: Math.round(menge * WARENWERT[r] * MARKT.stand.preisstufen[st]) };
}
function standZeigen(zurueck) {
  const M = marktDaten(), S = M.stand, X = MARKT.stand;
  if (!S) {
    const grund = M.ansehen < X.ansehen ? TX`Erst ab Ansehen ${X.ansehen}. Handle mehr oder erledige Aushänge.` : SPIEL.gold < X.gold ? TX('Dafür fehlt Gold.') : '';
    overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="sk"><div class="label">Markt von Altbrück · Ansehen ${Math.round(M.ansehen)}</div>
      <h1 id="sk">Ein Stand zu verkaufen</h1>
      <p class="story">Eine leere Bude mit gelbem Dach. Der Marktvogt lehnt daneben. „Für ${X.gold} Gold gehört sie dir. Aber nur, wenn man dich hier kennt.“</p>
      <p class="note">Mit einem eigenen Stand verkaufst du jeden Tag Waren aus dem Dorf, auch wenn du nicht hier bist. Den Preis bestimmst du selbst: Billig verkauft sich schneller.</p>
      ${grund ? `<p class="note schlecht">${esc(grund)}</p>` : ''}
      <div class="knopfreihe"><button class="btn" data-a="kaufen" type="button" ${grund ? 'disabled' : ''}>Stand kaufen (${X.gold} Gold)</button>
      <button class="btn ghost" data-a="zurueck" type="button">Zurück auf den Platz</button></div></div>`);
    overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
    overlay.querySelector('[data-a="kaufen"]').addEventListener('click', () => {
      if (!standKaufbar()) return;
      SPIEL.gold -= X.gold; M.stand = { lager: {}, stufe: {} };
      const i = MARKT_BELEGUNG.findIndex(b => b.art === 'spieler');
      if (MARKT_STAENDE[i]) zeige(MARKT_STAENDE[i], BILD.bude[MARKT_BELEGUNG[i].farbe], 1);   // Die Bretter kommen sofort ab
      spielSpeichern(); geraeusch('muenze'); dorfHudAktualisieren();
      standZeigen(zurueck);
    });
    return;
  }
  const zeile = r => {
    const n = S.lager[r] || 0, st = S.stufe[r] === undefined ? 2 : S.stufe[r], e = standErwartung(r), preis = WARENWERT[r] * X.preisstufen[st];
    return `<div class="stand-zeile"><span class="stand-ware">${rsym(r)} ${esc(ROHSTOFF_NAME[r])}</span>
      <span class="note">${esc(TX`im Stand ${n} · daheim ${SPIEL[r] || 0}`)}</span>
      <span class="stand-knoepfe"><button class="btn small ghost" type="button" data-rein="${r}" ${(SPIEL[r] || 0) < X.menge ? 'disabled' : ''}>+${X.menge}</button>
      <button class="btn small ghost" type="button" data-raus="${r}" ${n < 1 ? 'disabled' : ''}>−${X.menge}</button>
      <button class="btn small ghost" type="button" data-preis="${r}" data-d="-1" ${st <= 0 ? 'disabled' : ''}>${esc(TX('billiger'))}</button>
      <button class="btn small ghost" type="button" data-preis="${r}" data-d="1" ${st >= X.preisstufen.length - 1 ? 'disabled' : ''}>${esc(TX('teurer'))}</button></span>
      <span class="note">${TX`Preis <b class="preis" data-stufe="${st}">${Math.round(X.preisstufen[st] * 100)} %</b> (<span class="gold-zahl">${preis.toFixed(1)} Gold</span>) · erwartet ${e.menge} am Tag, <span class="gold-zahl">${e.gold} Gold</span>`}</span></div>`;
  };
  const summe = MARKT.waren.reduce((a, r) => a + standErwartung(r).gold, 0);
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="st"><div class="label">Markt von Altbrück · Ansehen ${Math.round(M.ansehen)}</div>
    <h1 id="st">Dein Stand</h1>
    <p class="note">Leg Waren aus dem Dorf hinein und wähl einen Preis. Jeden Tag kaufen die Leute davon, je nach Preis und Ansehen. Erwartet morgen: etwa ${summe} Gold.</p>
    <div class="stand-liste">${MARKT.waren.map(zeile).join('')}</div>
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-rein]').forEach(b => b.addEventListener('click', () => { const r = b.dataset.rein; if ((SPIEL[r] || 0) < X.menge) return; SPIEL[r] -= X.menge; S.lager[r] = (S.lager[r] || 0) + X.menge; spielSpeichern(); dorfHudAktualisieren(); standZeigen(zurueck); }));
  overlay.querySelectorAll('[data-raus]').forEach(b => b.addEventListener('click', () => { const r = b.dataset.raus, n = Math.min(X.menge, S.lager[r] || 0); S.lager[r] -= n; SPIEL[r] = (SPIEL[r] || 0) + n; spielSpeichern(); dorfHudAktualisieren(); standZeigen(zurueck); }));
  overlay.querySelectorAll('[data-preis]').forEach(b => b.addEventListener('click', () => { const r = b.dataset.preis, st = S.stufe[r] === undefined ? 2 : S.stufe[r]; S.stufe[r] = Math.max(0, Math.min(X.preisstufen.length - 1, st + Number(b.dataset.d))); spielSpeichern(); standZeigen(zurueck); }));
}
// Jeden Tag (aus tagVergeht): Der Stand verkauft
function marktTag(bericht) {
  marktGebuehren(bericht);
  const M = SPIEL.markt;
  if (!M || !M.stand) return;
  let gold = 0; const verkauft = [];
  for (const r of MARKT.waren) {
    const e = standErwartung(r);
    if (!e.menge) continue;
    M.stand.lager[r] -= e.menge; gold += e.gold; verkauft.push(e.menge + ' ' + ROHSTOFF_NAME[r]);
  }
  if (!verkauft.length) return;
  SPIEL.gold += gold; marktAnsehen(0.5);
  bericht.push(TX`An deinem Marktstand in Altbrück gingen heute über den Tresen: ${verkauft.join(', ')}.`);
}
// Gebühren, wenn der Markt euch gehört
function marktGebuehren(bericht) {
  const M = SPIEL.markt;
  if (!M || !M.kontrolle) return;
  const g = MARKT.gebuehren.find(x => x.id === (M.gebuehr || 'mittel'));
  const gold = g.gold + Math.floor(M.ansehen / 10);
  SPIEL.gold += gold; marktAnsehen(g.ansehen);
  bericht.push(satz(TX('Die Händler in Altbrück haben ihre Gebühren bezahlt. Manche lächeln dabei, manche nicht.'), TX('Die Gebühren vom Markt in Altbrück sind da, sauber abgezählt im Schuldbuch des Waagmeisters.')));
}

// ---------------------------------------------------------------------
// Schwarzes Brett: Marktaufträge (bring X, bekomm Gold und Ansehen)
// ---------------------------------------------------------------------
function aushaengeAuffrischen() {
  const M = marktDaten();
  if (SPIEL.tag < M.aushangTag + MARKT.aushang.tage && M.aushaenge.length) return;
  M.aushangTag = SPIEL.tag;
  const moeglich = ['holz', 'stein', 'nahrung'].concat(SPIEL.epoche >= 1 ? ['holzkohle', 'beschlaege'] : [], ['teile'], SPIEL.epoche >= 3 ? ['altmetall'] : [], (SPIEL.kraeuter || 0) > 0 ? ['kraeuter'] : []);
  const wer = [TX('Die Bäckerin vom Eck'), TX('Ein Zimmermann aus Altbrück'), TX('Der Marktvogt'), TX('Eine Familie aus Bunker 17'), TX('Der Kesselflicker'), TX('Die Wirtin vom „Rostigen Anker“')];
  M.aushaenge = [];
  for (let i = 0; i < MARKT.aushang.anzahl; i++) {
    const r = moeglich[Math.floor(Math.random() * moeglich.length)], wert = 30 + Math.random() * 50;
    const menge = Math.max(2, Math.round(wert / WARENWERT[r] / (WARENWERT[r] < 2 ? 5 : 1)) * (WARENWERT[r] < 2 ? 5 : 1));
    M.aushaenge.push({ ware: r, menge, gold: Math.round(menge * WARENWERT[r] * MARKT.aushang.aufschlag), wer: wer[Math.floor(Math.random() * wer.length)], erledigt: false });
  }
}
function brettZeigen(zurueck) {
  aushaengeAuffrischen();
  const M = marktDaten();
  const zettel = M.aushaenge.map((a, i) => `<div class="aushang${a.erledigt ? ' erledigt' : ''}"><b>${esc(a.wer)}</b>
    <p class="note">${esc(TX`Sucht ${a.menge} ${ROHSTOFF_NAME[a.ware]}. Zahlt ${a.gold} Gold.`)}</p>
    ${a.erledigt ? `<span class="label">${esc(TX('Erledigt'))}</span>` : `<button class="btn small" type="button" data-aushang="${i}" ${(SPIEL[a.ware] || 0) < a.menge ? 'disabled' : ''}>${esc(TX`Liefern (${a.menge} ${ROHSTOFF_NAME[a.ware]})`)}</button>`}</div>`).join('');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="sb"><div class="label">Markt von Altbrück · Ansehen ${Math.round(M.ansehen)}</div>
    <h1 id="sb">Das schwarze Brett</h1>
    <p class="note">Marktaufträge der Leute aus Altbrück. Jeder bringt Gold und Ansehen. Alle ${MARKT.aushang.tage} Tage hängen neue.</p>
    <div class="aushaenge">${zettel}</div>
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-aushang]').forEach(b => b.addEventListener('click', () => {
    const a = M.aushaenge[Number(b.dataset.aushang)];
    if (a.erledigt || (SPIEL[a.ware] || 0) < a.menge) return;
    SPIEL[a.ware] -= a.menge; SPIEL.gold += a.gold; a.erledigt = true; marktAnsehen(MARKT.ansehen.aushang);
    G.auftrag.bilanz = G.auftrag.bilanz || {};
    G.auftrag.bilanz[a.ware] = (G.auftrag.bilanz[a.ware] || 0) - a.menge; G.auftrag.bilanz.gold = (G.auftrag.bilanz.gold || 0) + a.gold;
    spielSpeichern(); dorfHudAktualisieren(); geraeusch('muenze');
    brettZeigen(zurueck);
  }));
}

// ---------------------------------------------------------------------
// Weißes Brett: Gesuche und Geschichten (Chronik), Anfragen, ein Gerücht am Tag
// ---------------------------------------------------------------------
function weissesBrettZeigen(zurueck) {
  const M = marktDaten();
  const anfragen = (SPIEL.anfragen || []).map(a => `<div class="aushang"><b>${esc(MISSIONEN[a.mission].titel)}</b><p class="note">${esc(anfrageText(a))} (${esc(ORTE[a.ort].name)})</p></div>`).join('');
  const notizen = MARKT_NOTIZEN.filter(n => n.wenn() && !M.notizen.includes(n.id));
  const geruecht = M.geruechtTag !== SPIEL.tag ? GERUECHTE.find(g => g.folge && (!g.wenn || g.wenn()) && !(g.folge.entdecken && ortBekannt(g.folge.entdecken)) && !(g.folge.lore && hatLore(g.folge.lore) && !g.folge.entdecken)) : null;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="wb"><div class="label">Markt von Altbrück</div>
    <h1 id="wb">Das weiße Brett</h1>
    <p class="note">Gesuche, Nachrichten und Geschichten. Wer hier liest, erfährt, was im Tal los ist.</p>
    ${notizen.length ? `<div class="aushaenge">${notizen.map(n => `<div class="aushang"><b>${esc(LORE.find(l => l.id === n.lore).titel)}</b><button class="btn small" type="button" data-notiz="${n.id}">${esc(TX('Lesen'))}</button></div>`).join('')}</div>` : ''}
    ${geruecht ? `<div class="aushang"><b>${esc(TX('Ein Zettel, eilig angeheftet'))}</b><button class="btn small" type="button" data-a="geruecht">${esc(TX('Lesen'))}</button></div>` : ''}
    ${anfragen ? `<span class="label">${esc(TX('Gesucht: Hilfe'))}</span><div class="aushaenge">${anfragen}</div>` : ''}
    ${!notizen.length && !geruecht && !anfragen ? `<p class="story">${esc(TX('Heute hängt nichts Neues hier. Nur ein Kinderbild von einem Roboter mit Blumen.'))}</p>` : ''}
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-notiz]').forEach(b => b.addEventListener('click', () => {
    const n = MARKT_NOTIZEN.find(x => x.id === b.dataset.notiz), l = LORE.find(x => x.id === n.lore);
    M.notizen.push(n.id); chronikEintragen(n.lore); spielSpeichern();
    marktHinweis(l.titel, l.text + ' ' + TX('(Neu in der Chronik)'), () => weissesBrettZeigen(zurueck));
  }));
  const gb = overlay.querySelector('[data-a="geruecht"]');
  if (gb) gb.addEventListener('click', () => {
    M.geruechtTag = SPIEL.tag;
    const folgen = [];
    if (geruecht.folge.entdecken && !SPIEL.karte.bekannt.includes(geruecht.folge.entdecken)) { SPIEL.karte.bekannt.push(geruecht.folge.entdecken); folgen.push(TX('Neu auf der Weltkarte: ') + ORTE[geruecht.folge.entdecken].name); }
    if (geruecht.folge.lore && chronikEintragen(geruecht.folge.lore)) folgen.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === geruecht.folge.lore).titel);
    spielSpeichern();
    marktHinweis(TX('Ein Zettel, eilig angeheftet'), geruecht.text + (folgen.length ? ' (' + folgen.join(', ') + ')' : ''), () => weissesBrettZeigen(zurueck));
  });
}

// ---------------------------------------------------------------------
// Die Gasse: der Hehler (kauft Beute, verkauft heiße Ware), die Elster (Neuigkeiten), die Tür des Waagmeisters
// ---------------------------------------------------------------------
function hehlerAngebote() {
  const n = HEHLERWARE.length, a = [];
  for (let k = 0; a.length < MARKT.hehler.angebote; k++) { const i = (SPIEL.tag * 5 + k * 3) % n; if (!a.includes(i)) a.push(i); }
  return a;
}
function hehlerZeigen(zurueck) {
  const M = marktDaten(), H = MARKT.hehler;
  if (M.hehlerTag !== SPIEL.tag) { M.hehlerTag = SPIEL.tag; M.hehlerGekauft = []; }
  const mal = M.kontrolle ? H.ankaufKontrolle : H.ankauf;
  const an = it => SLOTS.some(sl => SPIEL.ausruestung[sl] === it.uid);
  const beute = SPIEL.beutel.filter(it => !an(it));
  const preis = it => Math.round(SELTENHEIT[it.selten].wert * mal);
  const text = k => Object.keys(k).map(r => `<span class="kost">${k[r]}${rsym(r, MATERIALIEN[r] ? MATERIALIEN[r].name : null)}</span>`).join(' + ');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="hh"><div class="label">Die Gasse · Ansehen ${Math.round(M.ansehen)}</div>
    <h1 id="hh">Der Hehler</h1>
    <p class="story">Ein runder Mann mit Melone und einem Monokel aus Lazi-Glas. „Alles gefunden, nichts gestohlen. Und wenn doch, dann von jemandem, der es nicht mehr braucht.“</p>
    <span class="label">Heiße Ware (heute)</span>
    <div class="aushaenge">${hehlerAngebote().map(i => { const w = HEHLERWARE[i], weg = M.hehlerGekauft.includes(i); return TX`<div class="aushang"><p class="note">${text(w.nimm)} · ${w.gold} Gold</p><button class="btn small" type="button" data-heiss="${i}" ${weg || SPIEL.gold < w.gold ? 'disabled' : ''}>${weg ? TX('Verkauft') : TX('Kaufen')}</button></div>`; }).join('')}</div>
    <p class="note">${M.kontrolle ? TX('Seit der Markt dir gehört, sieht niemand mehr hin, wenn du hier kaufst.') : TX`Wer hier kauft, wird gesehen: ${H.ansehen} Ansehen je Kauf.`}</p>
    <span class="label">Er kauft deine Beute</span>
    <div class="aushaenge">${beute.length ? beute.map(it => `<div class="aushang"><p class="note"><span style="color:${SELTENHEIT[it.selten].farbe}">${esc(it.name)}</span></p><button class="btn small ghost" type="button" data-ankauf="${it.uid}">${esc(TX`Verkaufen +${preis(it)} Gold`)}</button></div>`).join('') : `<p class="note">${esc(TX('Dein Beutel ist leer, bis auf das, was du am Leib trägst.'))}</p>`}</div>
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-heiss]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.dataset.heiss), w = HEHLERWARE[i];
    if (M.hehlerGekauft.includes(i) || SPIEL.gold < w.gold) return;
    SPIEL.gold -= w.gold; gutschreiben(w.nimm); M.hehlerGekauft.push(i);
    if (!M.kontrolle) marktAnsehen(H.ansehen);
    spielSpeichern(); dorfHudAktualisieren(); geraeusch('muenze'); hehlerZeigen(zurueck);
  }));
  overlay.querySelectorAll('[data-ankauf]').forEach(b => b.addEventListener('click', () => {
    const it = SPIEL.beutel.find(x => String(x.uid) === b.dataset.ankauf);
    if (!it || an(it)) return;
    SPIEL.beutel = SPIEL.beutel.filter(x => x !== it); SPIEL.gold += preis(it);
    spielSpeichern(); dorfHudAktualisieren(); geraeusch('muenze'); hehlerZeigen(zurueck);
  }));
}
// Die Elster weiß, was im Tal los ist. Jede Frage einmal am Tag.
function elsterAntwort(art) {
  if (art === 'ueberfall') {
    const U = SPIEL.ueberfall;
    if (!U) return TX('„Die Bande vom Fluss? Still. Zu still. Ich höre mich um.“');
    const n = Math.max(0, U.tag - SPIEL.tag);
    const st = UEBERFALL.staerke();
    return (n > 1 ? TX`„Die Bande vom Fluss kommt in ${n} Tagen. Ich habe sie gezählt: Stärke ${st}.“` : n === 1 ? TX`„Die Bande vom Fluss kommt morgen. Ich habe sie gezählt: Stärke ${st}.“` : TX`„Sie sind schon unterwegs. Heute noch. Stärke ${st}.“`) + (U.eiferer ? ' ' + TX('„Und Kutten sind dabei. Eiferer.“') : '');
  }
  if (art === 'kreis') {
    const ids = Object.keys(CLUSTER).filter(id => !verbundStill(id)).sort((a, b) => cluster(a) - cluster(b));
    if (!ids.length || cluster(ids[0]) >= 50) return TX('„Der innere Kreis hat keinen Fuß mehr in der Tür. Er wartet. Das gefällt mir noch weniger.“');
    const id = ids[0];
    return TX`„Die Kutten flüstern gerade am liebsten mit dem Verbund ${CLUSTER[id].name}. Da steht es ${Math.round(cluster(id))} zu hundert. Wenn du ihn willst, beeil dich.“`;
  }
  if (art === 'geheimnis') {
    const fehlt = LORE.filter(l => !hatLore(l.id) && loreHinweis(l));
    if (!fehlt.length) return TX('„Du weißt schon alles, was ich weiß. Das ist schlecht fürs Geschäft.“');
    return TX`„Eine Sache noch, ganz unter uns: ${loreHinweis(fehlt[Math.floor(Math.random() * fehlt.length)])}“`;
  }
  return marktDaten().kontrolle ? TX('„Der Waagmeister? Weg. Die Gasse gehört jetzt dir. Ich verkaufe trotzdem an jeden, das weißt du.“')
    : TX`„Der Waagmeister. Ihm gehört die Gasse, die Hälfte der Stände und jeder, der ihm etwas schuldet. Er empfängt nur Leute, die man hier kennt. Ab Ansehen ${MARKT.boss.ansehen} öffnet sein Türsteher vielleicht.“`;
}
function elsterZeigen(zurueck) {
  const M = marktDaten(), E = MARKT.elster;
  if (M.elsterTag !== SPIEL.tag) { M.elsterTag = SPIEL.tag; M.elsterGefragt = []; }
  // Nach dem inneren Kreis fragt man erst, wenn man von ihm weiß
  const fragen = [['boss', 0, TX('Wer ist der Boss hier?')], ['ueberfall', E.ueberfall, TX('Wann kommen die Plünderer?')], ['kreis', E.kreis, TX('Was plant der innere Kreis?')], ['geheimnis', E.geheimnis, TX('Was weißt du, was ich nicht weiß?')]]
    .filter(([id]) => id !== 'kreis' || storyAb('verbuende'));
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="el"><div class="label">Die Gasse</div>
    <h1 id="el">Die Elster</h1>
    <p class="story">Sie lehnt an der Hauswand, Schal in Schwarz und Weiß, und blättert in einem Bündel Zettel. „Alles hat seinen Preis. Neuigkeiten auch. Aber ich bin fair: Eine Frage, eine Antwort.“</p>
    <div class="ereignis-optionen">${fragen.map(([id, gold, t]) => `<button class="btn ghost" type="button" data-frage="${id}" ${M.elsterGefragt.includes(id) || SPIEL.gold < gold ? 'disabled' : ''}>${esc(t)}<small>${esc(M.elsterGefragt.includes(id) ? TX('Heute schon gefragt') : gold ? TX`${gold} Gold` : TX('Das erzählt sie umsonst'))}</small></button>`).join('')}</div>
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-frage]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.frage, gold = fragen.find(f => f[0] === id)[1];
    if (M.elsterGefragt.includes(id) || SPIEL.gold < gold) return;
    SPIEL.gold -= gold; M.elsterGefragt.push(id);
    spielSpeichern(); dorfHudAktualisieren(); if (gold) geraeusch('muenze');
    marktHinweis(TX('Die Elster'), elsterAntwort(id), () => elsterZeigen(zurueck));
  }));
}
// Die Tür: erst der Türsteher, ab genug Ansehen der Waagmeister, nach seinem Sturz dein Kontor
function tuerZeigen(zurueck) {
  const M = marktDaten(), B = MARKT.boss;
  if (M.kontrolle) return kontorZeigen(zurueck);
  if (M.ansehen < B.ansehen) return marktHinweis(TX('Die Tür des Hauses „Zur Waage“'), TX`Ein Türsteher, breit wie ein Schrank, schüttelt den Kopf. „Der Boss empfängt niemanden. Noch nicht. Komm wieder, wenn man hier deinen Namen kennt.“ (Ansehen ${Math.round(M.ansehen)} von ${B.ansehen})`, zurueck);
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="wm"><div class="label">Haus „Zur Waage“</div>
    <h1 id="wm">Der Waagmeister</h1>
    <p class="story">Ein Raum voller Kisten, in der Mitte eine Waage aus Messing, groß wie ein Karren. Dahinter ein schwerer Mann mit Zylinder, der in einem dicken Buch blättert. „Ah. Jemand aus dem Dorf. Alle reden von dir. Das ist schlecht für mich, verstehst du? Auf diesem Markt redet man nur von einem.“</p>
    <p class="story">„Ich mache dir ein Angebot: Du verkaufst weiter, und ich wiege, was du mir schuldest. Oder du versuchst, meine Waage umzuwerfen. Das haben schon andere versucht. Sie stehen jetzt in meinem Buch.“</p>
    <p class="note">Wer ihn besiegt, kontrolliert den Markt und kassiert jeden Tag Gebühren. Die Mission beginnt sofort.</p>
    <div class="knopfreihe"><button class="btn" data-a="kampf" type="button">Die Waage umwerfen</button>
    <button class="btn ghost" data-a="zurueck" type="button">Gehen</button></div></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelector('[data-a="kampf"]').addEventListener('click', () => {
    overlayWeg(); M.bossGesehen = true;
    missionAufraeumen(); marktUiAus();
    REISE = { ort: 'markt', leben: 1, mission: 'waage' };
    missionStarten('markt');
  });
}
function kontorZeigen(zurueck) {
  const M = marktDaten(), jetzt = M.gebuehr || 'mittel';
  const name = { niedrig: TX('Niedrig'), mittel: TX('Mittel'), hoch: TX('Hoch') }, folge = g => g.ansehen > 0 ? TX('Ansehen steigt') : g.ansehen < 0 ? TX('Ansehen sinkt') : TX('Ansehen bleibt');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ko"><div class="label">Haus „Zur Waage“ · Ansehen ${Math.round(M.ansehen)}</div>
    <h1 id="ko">Dein Kontor</h1>
    <p class="story">Die große Waage steht schief, so wie du sie verlassen hast. Die Händler zahlen jetzt an dich. Wie viel, bestimmst du.</p>
    <div class="ereignis-optionen">${MARKT.gebuehren.map(g => `<button class="btn${g.id === jetzt ? '' : ' ghost'}" type="button" data-gebuehr="${g.id}">${esc(name[g.id])}<small>${esc(TX`${g.gold + Math.floor(M.ansehen / 10)} Gold am Tag · ${folge(g)}`)}</small></button>`).join('')}</div>
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-gebuehr]').forEach(b => b.addEventListener('click', () => { M.gebuehr = b.dataset.gebuehr; spielSpeichern(); geraeusch('klick'); kontorZeigen(zurueck); }));
}

// ---------------------------------------------------------------------
// Heimweg: Ein Tag vergeht, Bilanz des Markttags
// ---------------------------------------------------------------------
function marktVerlassen() {
  if (!G || G.zustand === 'heim') return;
  G.zustand = 'heim';
  const A = G.auftrag, bil = Object.assign({}, A.bilanz || {});
  for (const ort in A.vorrat) for (const r in (A.vorrat[ort].bilanz || {})) bil[r] = (bil[r] || 0) + A.vorrat[ort].bilanz[r];
  missionAufraeumen(); marktUiAus(); REISE = null;
  SPIEL.karte.besucht.markt = (SPIEL.karte.besucht.markt || 0) + 1;
  const bericht = tagVergeht();
  spielSpeichern(); modusDorf();
  const handel = Object.keys(bil).filter(r => bil[r]);
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="mv">
    <div class="label">Tag ${SPIEL.tag} · Zurück vom Markt</div>
    <h1 id="mv">Ein Tag in Altbrück</h1>
    <p class="note">${handel.length ? TX`Gehandelt: ${bilanzHtml(bil)}` : TX('Heute hast du nur geschaut.')} · Ansehen ${Math.round(marktDaten().ansehen)}</p>
    ${tagesberichtHtml(bericht)}
    <button class="btn" data-a="zu" type="button">Ins Dorf</button></div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { overlayWeg(); nachRueckkehr(); });
}

Object.assign(MISSIONEN, {
  markt: { ...MISSIONSTEXTE.markt, ort: 'markt', typ: 'markt', markt: true,
    feld: { x: 25, zMin: -11, zMax: 12, flaechen: [MARKT_RUND, MARKT_GASSE] }, start: [0, 9.5], aufbau: () => aufbauMarkt(), ziel: null,
    wellen: () => [], musik: 'dorf',
    nachher: () => { marktUiAus(); modusDorf(); overlayWeg(); nachRueckkehr(); } },
});

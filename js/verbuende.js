// =====================================================================
// DIE VERBUND-STUFEN (Inhaber, 08.11.2026): Jeder Verbund hat Stufen in beide Richtungen.
//  Mit den Maschinen (+):  Kontakt ab 25, Vertrauen ab 50, Bund ab 80.
//  Gegen die Maschinen (−, durch Sabotage, Abschalten, Wegschicken): Störung ab −25, Lahmgelegt ab −50,
//  Zerschlagen ab −80 oder stillgelegt (Rostbrecher-Sabotage). Die Minus-Seite bringt Vorteile mit Preis.
//  Der innere Kreis ist eine eigene Gruppe: Er schiebt die Verbünde nicht ins Minus, sondern zehrt am
//  Vertrauen (nur bis 0). Später (Punkt C) kann er Knoten besetzen (SPIEL.besetzt): Das ist ein reiner Nachteil.
// Werte je Verbund und Stufe in VERBUND_STUFEN; Texte für die Anzeige in VERBUND_TEXTE.
// =====================================================================

const VERBUND_SCHWELLEN = [25, 50, 80];
const VERBUND_STUFENNAME = { 3: TX('Bund'), 2: TX('Vertrauen'), 1: TX('Kontakt'), 0: TX('Unentschieden'), '-1': TX('Störung'), '-2': TX('Lahmgelegt'), '-3': TX('Zerschlagen') };
// Zahlen je Stufe (Schlüssel −3 … 3). Was fehlt, ist 0.
const VERBUND_STUFEN = {
  energie: {
    stromRabatt: { 1: 1, 2: 2, 3: 2, '-1': -1, '-3': -3 },          // Holzkohle pro Strom-Tag weniger (−3: eigener Generator, teurer)
    ueberfallSchwaecher: { 3: 1 },                        // Scheinwerfer an der Mauer
    verschmutzung: { '-1': 1, '-3': 2 },                  // pro Tag weniger
    altmetall: { '-1': 1, '-2': 2, '-3': 2 },             // Kupfer aus den Leitungen
    stromVerlust: { '-2': 4 },                            // jeder 4. Tag kostet einen Strom-Tag mehr
  },
  wartung: {
    ausbauMal: { 1: 0.95, 2: 0.9, 3: 0.9, '-1': 1.05, '-3': 1.1 },
    teileAlle: { '-1': 1 },                               // Rostbrecher holen Lazi-Teile aus Schrott: jeden Tag eins
    torPlus: { '-2': 0.15, '-3': 0.25 },
    holzMal: { '-2': 1.1 },                               // Reparaturen kosten mehr Holz (Ausbauten: Holz +10 %)
    pluenderMal: { 3: 0.5 },                              // Roboter flicken Mauer und Lager nach jedem Überfall
  },
  logistik: {
    handelMal: { 1: 0.95, 2: 0.9, 3: 0.9, '-1': 1.05, '-2': 1.1, '-3': 1.15 },
    karawane: { 3: 7 },                                   // alle 7 Tage eine Karawane
    altmetall: { '-1': 2, '-2': 3, '-3': 3 },
    lohn: { '-3': 6 },                                    // eigene Träger: Abgaben in Gold
  },
  produktion: {
    fabrikTeile: { 1: 1, 2: 2, 3: 2, '-1': -1, '-2': -1 },
    altmetall: { '-1': 3, '-2': 4, '-3': 4 },
    meisterMal: { '-3': 0.75 },                           // Grimbart: Aufwertungen günstiger
    zerlegt: { '-3': 120 },                               // einmalig Altmetall, wenn die Fabrik zerlegt wird
  },
  wissen: {
    forschungKosten: { 1: 0.9, 2: 0.9, 3: 0.85, '-1': 1.1 },
    forschungTage: { 2: -1, 3: -2, '-2': 1 },
    buchAlle: { '-1': 2, '-2': 1 },                       // die Rostbrecher öffnen die Archive
    schule: { '-3': 1 },                                  // eigene Dorfschule: Forschung kostet Bücher statt Tage
  },
};
// Was eine Stufe bringt, für die Anzeige
const VERBUND_TEXTE = {
  energie: { 1: TX('Strom kostet 1 Holzkohle weniger am Tag'), 2: TX('Strom kostet 2 Holzkohle weniger am Tag'), 3: TX('Dazu Scheinwerfer an der Mauer: Überfälle sind eine Stufe schwächer'),
    '-1': TX('Verschmutzung sinkt jeden Tag um 1, Kupfer aus den Leitungen: +1 Altmetall am Tag, aber Strom kostet 1 Holzkohle mehr'), '-2': TX('+2 Altmetall am Tag, aber jeder 4. Tag kostet einen Tag Strom mehr'), '-3': TX('Verschmutzung sinkt jeden Tag um 2, +2 Altmetall am Tag, Strom nur noch über einen eigenen Generator: 3 Holzkohle mehr am Tag') },
  wartung: { 1: TX('Ausbauten kosten 5 % weniger'), 2: TX('Ausbauten kosten 10 % weniger, mit Robotern im Dorf 15 %'), 3: TX('Dazu flicken Roboter Mauer und Lager: Überfälle rauben nur halb so viel'),
    '-1': TX('Die Rostbrecher holen Lazi-Teile aus dem Schrott: +1 am Tag, aber Ausbauten 5 % teurer'), '-2': TX('Tore +15 % Leben, aber Ausbauten brauchen 10 % mehr Holz'), '-3': TX('Eigene Handwerkergilde: Tore +25 % Leben, Ausbauten 10 % teurer') },
  logistik: { 1: TX('Handel 5 % günstiger'), 2: TX('Handel 10 % günstiger, Lastläufer helfen an der Sammelstelle: +1 Altmetall'), 3: TX('Dazu kommt alle 7 Tage eine Karawane mit dem, was euch am meisten fehlt'),
    '-1': TX('Ausgeschlachtete Lastläufer: +2 Altmetall am Tag, aber Handel 5 % teurer'), '-2': TX('+3 Altmetall am Tag, aber Handel 10 % teurer und Lastläufer tragen nichts mehr'), '-3': TX('Eigene Träger: +6 Gold und +3 Altmetall am Tag, Handel 15 % teurer, Lastläufer tragen nichts mehr') },
  produktion: { 1: TX('Die Fabrik macht 1 Lazi-Teil mehr am Tag'), 2: TX('Die Fabrik macht 2 Lazi-Teile mehr am Tag'), 3: TX('Dazu Bestellungen in der Fabrik: Lazi-Waffen und Module gegen Altmetall'),
    '-1': TX('Gestohlene Bänder: +3 Altmetall am Tag, aber die Fabrik macht 1 Lazi-Teil weniger'), '-2': TX('+4 Altmetall am Tag, aber die Fabrik macht 1 Lazi-Teil weniger'), '-3': TX('Die Fabrik wird zerlegt und steht still: einmalig 120 Altmetall, danach +4 am Tag, Grimbarts Aufwertungen 25 % günstiger') },
  wissen: { 1: TX('Forschung 10 % günstiger'), 2: TX('Forschung 10 % günstiger und einen Tag schneller'), 3: TX('Forschung 15 % günstiger, zwei Tage schneller'),
    '-1': TX('Die Rostbrecher öffnen die Archive: alle 2 Tage ein altes Buch, aber Forschung 10 % teurer'), '-2': TX('Jeden Tag ein altes Buch, aber Forschung dauert einen Tag länger'), '-3': TX('Eigene Dorfschule: Forschung kostet Bücher statt Tage') },
};

const KREIS_ZORN_BESETZT = 60;   // ab diesem Zorn greift der innere Kreis nach Verbünden, die euch nicht vertrauen
function verbundBesetzt(id) {
  if (!SPIEL) return false;
  if (SPIEL.besetzt && SPIEL.besetzt[id]) return true;
  const B = SPIEL.bestehende;
  return !!(B && B.zorn >= KREIS_ZORN_BESETZT && !verbundStill(id) && cluster(id) <= 0 && verbundStufe(id) > -3 && !(typeof innererKreisBesiegt === 'function' && innererKreisBesiegt()));
}
function verbundStufe(id) {
  if (verbundStill(id)) return -3;
  const v = cluster(id), [a, b, c] = VERBUND_SCHWELLEN;
  return v >= c ? 3 : v >= b ? 2 : v >= a ? 1 : v <= -c ? -3 : v <= -b ? -2 : v <= -a ? -1 : 0;
}
// Ein Wert für einen Verbund auf seiner aktuellen Stufe (oder der Ersatzwert)
function verbundWert(id, art, ersatz) {
  if (!SPIEL || !SPIEL.cluster || (id === 'produktion' && typeof fabrikFrei === 'function' && !fabrikFrei() && !verbundStill(id))) return ersatz === undefined ? 0 : ersatz;
  const t = VERBUND_STUFEN[id][art], w = t && t[verbundStufe(id)];
  return w === undefined ? (ersatz === undefined ? 0 : ersatz) : w;
}
// Der innere Kreis zehrt am Vertrauen, ins Minus schiebt er die Verbünde nicht (das tun nur die Rostbrecher und ihr)
function kreisZehrt(id, n, bericht) { const v = cluster(id); if (v > 0) clusterAendern(id, -Math.min(v, n), bericht); }

// Hilfen für die Stellen im Spiel, an denen die Verbünde wirken
function verbundStromRabatt() { return verbundWert('energie', 'stromRabatt'); }
function verbundHandelMal() { return verbundWert('logistik', 'handelMal', 1); }
function verbundFabrikTeile() { return verbundWert('produktion', 'fabrikTeile'); }
function verbundMeisterMal() { return verbundWert('produktion', 'meisterMal', 1); }
function verbundTorPlus() { return verbundWert('wartung', 'torPlus'); }
function verbundPluenderMal() { return verbundWert('wartung', 'pluenderMal', 1); }
function verbundUeberfallSchwaecher() { return Math.max(verbundWert('energie', 'ueberfallSchwaecher'), typeof energieWahl === 'function' && energieWahl() === 'alle' && !verbundStill('energie') ? 1 : 0); }   /* neuer Lastplan: Scheinwerfer für immer */
function verbundForschungTage() { return Math.min(verbundWert('wissen', 'forschungTage'), typeof wissenWahl === 'function' && wissenWahl() === 'alle' && !verbundStill('wissen') ? -1 : 0); }   /* offenes Archiv: Ebert darf immer hinein */
function verbundSchule() { return !!verbundWert('wissen', 'schule'); }
function verbundLastlaeuferStill() { return verbundStufe('logistik') <= -2; }

// Jeden Tag (aus tagVergeht): was die Stufen bringen
function verbuendeTag(bericht) {
  if (!SPIEL.cluster) return;
  const W = (id, art) => verbundWert(id, art);
  SPIEL.verbundEinmal = SPIEL.verbundEinmal || {};
  const metall = W('energie', 'altmetall') + W('logistik', 'altmetall') + W('produktion', 'altmetall');
  if (metall) { SPIEL.altmetall = (SPIEL.altmetall || 0) + metall; bericht.push(TX`Aus Leitungen, Lastläufern und Bändern schneiden die Leute Altmetall: +${metall}.`); }
  const sauber = W('energie', 'verschmutzung');
  if (sauber) SPIEL.verschmutzung = Math.max(0, (SPIEL.verschmutzung || 0) - sauber);
  const verlust = W('energie', 'stromVerlust');
  if (verlust && SPIEL.tag % verlust === 0 && typeof stromFrei === 'function' && stromFrei() && SPIEL.strom.tage > 0) { SPIEL.strom.tage--; bericht.push(TX('Die lahmgelegten Leitungen verlieren Strom: ein Tag ist weg.')); }
  if (W('wartung', 'teileAlle')) { SPIEL.teile += 1; bericht.push(TX('Die Rostbrecher haben ein brauchbares Lazi-Teil aus dem Schrott geholt.')); }
  const lohn = W('logistik', 'lohn');
  if (lohn) { SPIEL.gold += lohn; bericht.push(TX`Eure Träger ersetzen die Lastläufer. Ihre Abgaben bringen ${lohn} Gold.`); }
  const kar = W('logistik', 'karawane');
  if (kar && SPIEL.tag % kar === 0) {
    const r = ['holz', 'stein', 'nahrung', 'holzkohle'].sort((a, b) => (SPIEL[a] || 0) - (SPIEL[b] || 0))[0];
    SPIEL[r] = (SPIEL[r] || 0) + 40; bericht.push(TX`Eine Karawane des Verbunds Logistik bringt, was euch am meisten fehlt: 40 ${ROHSTOFF_NAME[r]}.`);
  }
  const buch = W('wissen', 'buchAlle');
  if (buch && SPIEL.tag % buch === 0) { SPIEL.buecher = (SPIEL.buecher || 0) + 1; bericht.push(TX('Aus den offenen Archiven: ein altes Buch.')); }
  const zerlegt = W('produktion', 'zerlegt');
  if (zerlegt && !SPIEL.verbundEinmal.fabrikZerlegt) { SPIEL.verbundEinmal.fabrikZerlegt = true; SPIEL.altmetall = (SPIEL.altmetall || 0) + zerlegt; bericht.push(TX`Die Fabrik wird zerlegt, Band für Band: ${zerlegt} Altmetall.`); }
  // Meldung, wenn ein Verbund die Stufe wechselt
  SPIEL.verbundStufen = SPIEL.verbundStufen || {};
  for (const id of Object.keys(CLUSTER)) {
    if (id === 'produktion' && !fabrikFrei() && !verbundStill(id)) continue;
    const st = verbundStufe(id), vor = SPIEL.verbundStufen[id];
    if (vor !== undefined && vor !== st) bericht.push(TX`Verbund ${CLUSTER[id].name}: ${VERBUND_STUFENNAME[st]}. ${VERBUND_TEXTE[id][st] || TX('Keine Wirkung mehr.')}`);
    SPIEL.verbundStufen[id] = st;
  }
}
// Für die Anzeige: Stufe, was sie bringt und was als Nächstes kommt
function verbundZeileHtml(id) {
  const st = verbundStufe(id), v = Math.round(cluster(id)), T = VERBUND_TEXTE[id];
  const naechst = st >= 3 || st <= -3 ? '' : v >= 0 ? TX`Ab ${VERBUND_SCHWELLEN[Math.max(0, st)]}: ${VERBUND_STUFENNAME[Math.max(0, st) + 1]}` : TX`Ab −${VERBUND_SCHWELLEN[Math.max(0, -st)]}: ${VERBUND_STUFENNAME[-(Math.max(0, -st) + 1)]}`;
  return `<b class="${st > 0 ? 'up' : st < 0 ? 'down' : ''}">${esc(VERBUND_STUFENNAME[st])}</b> · ${esc(T[st] || TX('Noch keine Wirkung'))}${verbundBesetzt(id) ? ' · ' + esc(TX('Vom inneren Kreis besetzt!')) : ''}${naechst ? `<br><span class="note">${esc(naechst)}</span>` : ''}`;
}

// Die kurzen Texte der Verbünde (Rostbrecher-Stand, alte Anzeigen) folgen den Stufen
Object.keys(CLUSTER).forEach(id => { CLUSTER[id].gut = VERBUND_TEXTE[id][2]; CLUSTER[id].still = VERBUND_TEXTE[id]['-3']; });

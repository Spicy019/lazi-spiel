// =====================================================================
// DORFLEBEN: Tag und Nacht, Lichter, Wetter, Leute mit Tagesablauf,
// Dorfereignisse mit Entscheidungen, Dorffest und der Dorfhund.
// =====================================================================

const TAGESLAUF = { dauer: 210, dunkel: 0.58 };   // Sekunden für einen Tag im Dorf, wie dunkel die Nacht wird
// Wie dunkel ist es gerade? 0 = Tag, 1 = tiefe Nacht
function nachtAnteil(u) {
  if (u < 0.5) return 0;
  if (u < 0.6) return (u - 0.5) / 0.1;
  if (u < 0.9) return 1;
  return 1 - (u - 0.9) / 0.1;
}
const istNacht = () => nachtAnteil(Dorf.uhr || 0) > 0.6;

// Lichtquellen: welches Gebäude leuchtet wie
const LICHT_ART = {
  wohnhaus: { farbe: '255,190,110', r: 46, y: 0.9, nacht: true }, wirtshaus: { farbe: '255,170,90', r: 70, y: 1.2, nacht: true },
  kirche: { farbe: '255,220,150', r: 60, y: 1.6, nacht: true }, schmiede: { farbe: '255,120,50', r: 64, y: 0.9, flackern: true },
  lagerfeuer: { farbe: '255,150,60', r: 96, y: 0.4, flackern: true, immer: 0.35 }, labor: { farbe: '120,240,230', r: 56, y: 1.0, nacht: true },
  laterne: { farbe: '255,230,160', r: 58, y: 1.9, strom: true }, funkturm: { farbe: '255,80,60', r: 20, y: 4.4, strom: true, blinken: true },
  wachturm: { farbe: '255,160,70', r: 40, y: 2.6, flackern: true, nacht: true }, koehlerei: { farbe: '255,110,40', r: 50, y: 0.5, flackern: true },
  brunnen: { farbe: '150,190,255', r: 30, y: 0.6, nacht: true }, kaserne: { farbe: '255,190,110', r: 44, y: 1.0, nacht: true },
  marktstand: { farbe: '255,200,120', r: 40, y: 1.2, nacht: true },
};
function dorflebenAufbauen() {
  const box = document.getElementById('dorfLicht');
  box.innerHTML = '<div class="nacht"></div><div class="regen"></div><div class="nebel"></div>';
  Dorf.lichter = [];
  if (Dorf.uhr === undefined) Dorf.uhr = 0.2;
  for (const x of Dorf.bauten) {
    const L = LICHT_ART[x.b.typ];
    if (!L) continue;
    const el = document.createElement('div'); el.className = 'licht';
    el.style.setProperty('--f', L.farbe); el.style.width = el.style.height = (L.r * 2) + 'px';
    box.append(el);
    Dorf.lichter.push({ el, x: x.cx, z: x.b.gz + GEBAEUDE[x.b.typ].groesse[1] - 0.2, L, phase: Math.random() * 6 });
  }
  // Der Dorfhund
  if (SPIEL.hund && !Dorf.hund) {
    const h = figur(BILD.hund[0], 0.25);
    Object.assign(h, { x: 1, z: 2, zx: 1, zz: 2, warte: 1, blick: 1, schritt: 0 });
    stelle(h, h.x, h.z); Dorf.hund = h;
  }
}
// Jeden Frame im Dorf
function dorflebenTick(dt) {
  Dorf.uhr = ((Dorf.uhr || 0) + dt / TAGESLAUF.dauer) % 1;
  const n = nachtAnteil(Dorf.uhr), box = document.getElementById('dorfLicht');
  if (!box || box.hidden) return;
  box.querySelector('.nacht').style.opacity = String(n * TAGESLAUF.dunkel);
  box.querySelector('.regen').style.opacity = SPIEL.wetter === 'regen' ? '0.55' : '0';
  box.querySelector('.nebel').style.opacity = SPIEL.wetter === 'nebel' ? String(0.5 - n * 0.2) : '0';
  const strom = stromAn(), fest = SPIEL.fest > 0;
  for (const l of Dorf.lichter || []) {
    l.phase += dt * 8;
    let a = l.L.immer || 0;
    if (l.L.nacht || l.L.flackern) a = Math.max(a, n * 0.9);
    if (l.L.strom) a = strom ? n : 0;
    if (l.L.flackern) a *= 0.85 + Math.sin(l.phase) * 0.08 + Math.random() * 0.07;
    if (l.L.blinken) a = strom ? (Math.floor(Dorf.zeit * 1.5) % 2 ? 0.9 : 0.15) * Math.max(0.3, n) : 0;
    if (fest && n > 0.3) a = Math.min(1, a + 0.15);
    if (a <= 0.02) { if (l.el.style.opacity !== '0') l.el.style.opacity = '0'; continue; }
    const p = weltZuBildschirm(l.x, l.L.y * 2, l.z), s = ansicht.s / 3 * 2 * cam.zoom;
    l.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${s})`;
    l.el.style.opacity = String(a);
  }
  hundBewegen(dt);
}

// Leute: tagsüber zur Arbeit, nachts nach Hause, ins Wirtshaus oder ans Feuer
// Wer einen festen Arbeitsplatz hat, ist tagsüber meist dort zu finden
const LEUTE_ARBEIT = { rudi: 'wirtshaus', lotte: 'wirtshaus', grimbart: 'schmiede', wenzel: 'labor', ebert: 'archiv', bodo: 'rathaus', mara: 'wachturm' };
function leuteZiel(p) {
  const nacht = istNacht();
  let kandidaten;
  if (!nacht && p.wer && LEUTE_ARBEIT[p.wer] && Math.random() < 0.6) {
    const arbeit = Dorf.bauten.filter(x => x.b.typ === LEUTE_ARBEIT[p.wer]);
    if (arbeit.length) return arbeit[Math.floor(Math.random() * arbeit.length)];
  }
  if (nacht) kandidaten = Dorf.bauten.filter(x => ['wohnhaus', 'wirtshaus', 'lagerfeuer'].includes(x.b.typ) || (SPIEL.fest > 0 && x.b.typ === 'brunnen'));
  else kandidaten = Dorf.bauten.filter(x => GEBAEUDE[x.b.typ].arbeiter > 0 || ['brunnen', 'lagerfeuer', 'bank', 'statue'].includes(x.b.typ));
  if (!kandidaten.length) kandidaten = Dorf.bauten;
  if (SPIEL.fest > 0 && Math.random() < 0.5) kandidaten = Dorf.bauten.filter(x => x.b.typ === 'lagerfeuer');
  return kandidaten[Math.floor(Math.random() * kandidaten.length)];
}

// Der Hund läuft hinter Leuten her, schnüffelt und legt sich ans Feuer
function hundBewegen(dt) {
  const h = Dorf.hund;
  if (!h) return;
  if (h.warte > 0) {
    h.warte -= dt;
    if (h.warte <= 0) {
      const mensch = Dorf.leute.filter(p => p.sprite.visible)[Math.floor(Math.random() * Dorf.leute.length)];
      if (mensch && Math.random() < 0.7) { h.zx = mensch.x + zz(-0.8, 0.8); h.zz = mensch.z + 0.5; }
      else { h.zx = zz(-2, 2); h.zz = zz(0, 2.5); }
    }
    zeige(h, BILD.hund[0], h.blick);
    return;
  }
  const dx = h.zx - h.x, dz = h.zz - h.z, d = Math.hypot(dx, dz);
  if (d < 0.1) { h.warte = zz(1, 5); return; }
  h.x += dx / d * 2.2 * dt; h.z += dz / d * 2.2 * dt; h.blick = dx >= 0 ? 1 : -1; h.schritt += dt;
  zeige(h, BILD.hund[Math.floor(h.schritt * 8) % 2], h.blick);
  stelle(h, h.x, h.z);
}

// ---------------------------------------------------------------------
// Wetter und Dorfereignisse (aus tagVergeht)
// ---------------------------------------------------------------------
function dorflebenTag(bericht) {
  const z = Math.random();
  SPIEL.wetter = z < 0.2 ? 'regen' : z < 0.28 ? 'nebel' : 'klar';
  if (SPIEL.wetter === 'regen') { SPIEL.nahrung += 5; bericht.push(TX('Regen in der Nacht. Die Felder freuen sich.')); }
  if (SPIEL.fest > 0) SPIEL.fest--;
  if (SPIEL.nachtwache > 0) SPIEL.nachtwache--;
  // Ein Ereignis für morgen früh. Die Dorfversammlung ist eingeplant und geht vor.
  versammlungEinplanen();
  if (!SPIEL.dorfEreignis && SPIEL.tag > 3 && Math.random() < 0.3) {
    const moeglich = DORF_EREIGNISSE.filter(e => !e.geplant && (!e.wenn || e.wenn()));
    if (moeglich.length) SPIEL.dorfEreignis = moeglich[Math.floor(Math.random() * moeglich.length)].id;
  }
}
const DORF_EREIGNISSE = [
  { id: 'feuer', wenn: () => SPIEL.holz > 40, zeige: weiter => {
    const brunnen = hatGebaeude('brunnen');
    entscheidung(TX('Feuer!'), TX('Nachts im Dorf'), [
      ['mara', TX('Feuer am Holzstapel! Irgendwer hat eine Laterne umgestoßen. Oder jemand in einer Kutte hat nachgeholfen.')],
      ['hilde', brunnen ? TX('Eimer! Alle an den Brunnen, Kette bilden!') : TX('Wir haben keinen Brunnen! Wir müssen das Wasser vom Bach holen!')],
    ], [
      [TX('Alle zum Löschen'), () => { const n = Math.floor(SPIEL.holz * (brunnen ? 0.05 : 0.25)); SPIEL.holz -= n; SPIEL.stolz = Math.max(SPIEL.stolz || 0, 2); return [['hilde', brunnen ? TX`Gelöscht, bevor es richtig losging. Nur ${n} Holz verkohlt. Der Brunnen hat sich bezahlt gemacht.` : TX`Wir haben es geschafft, aber ${n} Holz sind verbrannt. Ein Brunnen wäre gut.`]]; }],
      [TX('Brennen lassen, Leute schützen'), () => { const n = Math.floor(SPIEL.holz * 0.5); SPIEL.holz -= n; return [['mara', TX`${n} Holz sind weg. Aber niemand ist verletzt.`]]; }],
    ], weiter); } },
  { id: 'hochzeit', wenn: () => SPIEL.einwohner >= 12, zeige: weiter => entscheidung(TX('Eine Hochzeit'), TX('Im Dorf'), [
      ['jupp', TX('Ey, hast du gehört? Die Tochter vom Schmied und der lange Kerl vom Steinbruch wollen heiraten. Morgen schon!')],
      ['hilde', TX('Ein Fest würde allen guttun. Aber Feste kosten.')],
    ], [
      [TX('Fest ausrichten (30 Gold, 30 Nahrung)'), () => { SPIEL.gold -= 30; SPIEL.nahrung -= 30; SPIEL.feier = Math.max(SPIEL.feier || 0, LEBENSSTANDARD.feierTage); return [['jupp', TX('Was für eine Nacht! Alle haben getanzt, sogar Bodo. Ganz kurz.')]]; }, SPIEL.gold < 30 || SPIEL.nahrung < 30],
      [TX('Nur gratulieren'), () => [['hilde', TX('Sie freuen sich trotzdem. Ein bisschen.')]]],
    ], weiter) },
  { id: 'hund', wenn: () => !SPIEL.hund, zeige: weiter => entscheidung(TX('Ein streunender Hund'), TX('Am Tor'), [
      ['mara', TX('Da sitzt ein Hund am Tor. Mager, ein Ohr kaputt. Er wedelt, sobald jemand hinschaut.')],
      ['junge', TX('Dürfen wir ihn behalten? Bitte, bitte, bitte!')],
    ], [
      [TX('Behalten'), () => { SPIEL.hund = [TX('Bolzen'), TX('Rost'), TX('Funke'), TX('Kessel'), TX('Brösel')][Math.floor(Math.random() * 5)]; return [['junge', TX`Er heißt ${SPIEL.hund}! Er bellt, wenn Fremde kommen. Das ist praktisch, sagt Mara.`]]; }],
      [TX('Wegjagen'), () => [['junge', TX('Ooch.')]]],
    ], weiter) },
  { id: 'statue', wenn: () => hatGebaeude('statue'), zeige: weiter => entscheidung(TX('Kinder auf der Statue'), TX('Auf dem Dorfplatz'), [
      ['hilde', TX('Die Kinder klettern schon wieder auf deiner Statue herum. Einer hat dir einen Blumenkranz aufgesetzt. Aus Brennnesseln.')],
    ], [
      [TX('Lachen und mitspielen'), () => { SPIEL.feier = Math.max(SPIEL.feier || 0, 1); return [['hilde', TX('Jetzt erzählen sie überall, dass der Held Brennnesseln trägt. Die Leute mögen dich.')]]; }],
      [TX('Runterholen'), () => [['hilde', TX('Sie maulen, aber sie gehorchen. Die Statue glänzt wieder.')]]],
    ], weiter) },
  { id: 'krankheit', wenn: () => ((SPIEL.verschmutzung || 0) >= 25 || SPIEL.einwohner > 30) && !pflegeAktiv(), zeige: weiter => entscheidung(TX('Husten im Dorf'), TX('Krankheit'), [
      ['hilde', TX('Ein halbes Dutzend Leute hustet. Fieber, Ausschlag.') + ' ' + ((SPIEL.verschmutzung || 0) >= 25 ? TX('Das kommt vom Wasser, sag ich dir.') : TX('Zu viele Leute auf zu engem Raum.'))],
    ], [
      [TX`Mit eigenen Kräutern behandeln (${KRAEUTER.krankheit} Kräuter)`, () => { SPIEL.kraeuter -= KRAEUTER.krankheit; return [['hilde', TX('Kamillentee, Salbeiwickel und viel Schlaf. Nach drei Tagen sind alle wieder auf den Beinen.')]]; }, (SPIEL.kraeuter || 0) < KRAEUTER.krankheit],
      [TX('Kräuter vom Markt holen (25 Gold)'), () => { SPIEL.gold -= 25; return [['hilde', TX('Tee, Wickel, Ruhe. Alle werden wieder gesund.')]]; }, SPIEL.gold < 25],
      [TX('Abwarten'), () => { const n = Math.min(2, Math.max(0, SPIEL.einwohner - 4)); SPIEL.einwohner -= n; return [['hilde', n > 1 ? TX`${n} Leute sind gegangen, zu Verwandten nach Birkenhain. Sie kommen vielleicht nie zurück.` : n ? TX('Einer ist gegangen, zu Verwandten nach Birkenhain. Er kommt vielleicht nie zurück.') : TX('Glück gehabt.')]]; }],
    ], weiter) },
  { id: 'dieb', wenn: () => SPIEL.gold > 60 && !(SPIEL.nachtwache > 0), zeige: weiter => {
    const n = Math.floor(SPIEL.gold * 0.1);
    entscheidung(TX('Diebstahl'), TX('Am Morgen'), [
      ['bodo', TX`Aus der Dorfkasse fehlen ${n} Gold. Ich war es nicht. Ich sage das nur, bevor jemand fragt.`],
      ['mara', TX('Fußspuren bis zum Wald. Klein, leicht. Vielleicht der Fuchs. Vielleicht ein Kind.')],
    ], [
      [TX('Nachtwache aufstellen'), () => { SPIEL.gold -= n; SPIEL.nachtwache = 5; return [['mara', TX('Die nächsten Nächte schläft keiner von uns. Wer jetzt noch klaut, wird erwischt.')]]; }],
      [TX('Abhaken'), () => { SPIEL.gold -= n; return [['bodo', TX('Sehr vernünftig. Geld ist ja auch nur Metall.')]]; }],
    ], weiter); } },
  { id: 'wanderer', zeige: weiter => entscheidung(TX('Ein Wanderer'), TX('Am Tor'), [
      ['piet', TX('Ein Wanderer am Tor. Er sagt, er kann gut mit Werkzeug umgehen und sucht ein Dach.')],
    ], [
      [TX('Aufnehmen'), () => { const platz = dorfWerte().platz - SPIEL.einwohner; if (platz > 0) { SPIEL.einwohner++; return [['piet', TX('Er stellt sich vor und fängt gleich an, einen Zaun zu flicken.')]]; } return [['piet', TX('Wir haben keinen Platz. Er zieht weiter.')]]; }],
      [TX('Weiterschicken'), () => [['piet', TX('Er nickt und geht.')]]],
    ], weiter) },
  { id: 'streit', wenn: () => SPIEL.bestehende && SPIEL.bestehende.anselm === 2, zeige: weiter => entscheidung(TX('Streit am Brunnen'), TX('Im Dorf'), [
      ['bodo', TX('Die Kabelanbeter salben schon wieder unseren Brunnen. Das ist Wasser, keine Kirche!')],
      ['anselm', TX('Wir segnen ihn nur. Das Wasser ist sauberer, seit wir es tun. Fragt Hilde.')],
    ], [
      [TX('Anselm recht geben'), () => { SPIEL.bestehende.zorn = Math.max(0, SPIEL.bestehende.zorn - 3); clusterAendern('wartung', 3); return [['anselm', TX('Danke. Bodo, ich bringe dir morgen Öl für deine Tür. Sie quietscht.')]]; }],
      [TX('Bodo recht geben'), () => [['bodo', TX('Na also. Ordnung muss sein.')], ['anselm', TX('Wie ihr meint.')]]],
    ], weiter) },
];
function dorfEreignisPruefen(weiter) {
  const id = SPIEL.dorfEreignis;
  if (!id) return weiter();
  SPIEL.dorfEreignis = null; spielSpeichern();
  const e = DORF_EREIGNISSE.find(x => x.id === id);
  if (!e || (e.wenn && !e.wenn())) return weiter();
  e.zeige(weiter);
}
// Nach jeder Rückkehr ins Dorf: erst Überfall, dann Bestehende, dann Dorfereignis, neue Leute, Epoche
function nachRueckkehr() {
  ueberfallPruefen(() => bestehendePruefen(() => dorfEreignisPruefen(() => figurenPruefen(epochePruefenUndZeigen))));
}

// ---------------------------------------------------------------------
// Dorffest: bei hohem Lebensstandard, alle zehn Tage
// ---------------------------------------------------------------------
const FEST = { abStandard: 75, pause: 10, goldProEinwohner: 2, nahrungProEinwohner: 2, tage: 3, standard: 18 };
function festKosten() { return { gold: FEST.goldProEinwohner * SPIEL.einwohner, nahrung: FEST.nahrungProEinwohner * SPIEL.einwohner }; }
function festMoeglich() { return lebensstandard().wert >= FEST.abStandard && SPIEL.tag >= (SPIEL.festTag || -99) + FEST.pause; }
function festFeiern() {
  const k = festKosten();
  if (!festMoeglich() || !kannBezahlen(k)) return;
  bezahlen(k); SPIEL.fest = FEST.tage; SPIEL.festTag = SPIEL.tag;
  const platz = Math.max(0, dorfWerte().platz - SPIEL.einwohner), neu = Math.min(platz, 3);
  SPIEL.einwohner += neu;
  Dorf.uhr = 0.62;   // Das Fest beginnt am Abend
  spielSpeichern(); geraeusch('sieg'); dorfHudAktualisieren();
  gespraechZeigen(TX('Dorffest'), [
    ['jupp', TX('Musik! Irgendwer hat eine Geige aus der Universität mitgebracht, und sie spielt sogar noch.')],
    ['hilde', TX('Es gibt Eintopf für alle, Brot und den Rest vom Bier. Morgen haben alle Kopfschmerzen. Heute ist das egal.')],
    ['mara', neu ? TX`Von den Hügeln aus hat man das Feuer gesehen. ${neu} Leute sind gekommen und wollen bleiben.` : TX('Von den Hügeln aus hat man das Feuer gesehen. Hoffentlich nur Freunde.')],
  ], () => bauLeisteBauen());
}
function festHtml() {
  const k = festKosten(), ls = lebensstandard().wert;
  const grund = ls < FEST.abStandard ? TX`Ab Lebensstandard ${FEST.abStandard}` : SPIEL.tag < (SPIEL.festTag || -99) + FEST.pause ? TX('Das letzte Fest ist noch nicht lange her') : !kannBezahlen(k) ? TX('Es fehlt etwas') : '';
  return TX`<div class="politik-karte"><span class="label">Dorffest</span>
    <p class="note">${SPIEL.fest > 0 ? (SPIEL.fest === 1 ? TX('Es wird gefeiert! Noch 1 Tag.') : TX`Es wird gefeiert! Noch ${SPIEL.fest} Tage.`) : TX`+${FEST.standard} Lebensstandard für ${FEST.tage} Tage, lockt Siedler an.`}</p>
    <div class="kosten">${kostenHtml(k)}</div>
    <button class="btn small" type="button" data-a="fest" ${grund ? 'disabled' : ''}>${esc(grund || TX('Fest feiern'))}</button></div>`;
}

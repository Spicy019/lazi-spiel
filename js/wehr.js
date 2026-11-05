// =====================================================================
// WEHR: Dorfmauer, Wachtürme, Überfälle aufs Dorf und die Begleiter
// aus der Kaserne. Dazu die Rohstoff-Symbole für die Oberfläche.
// =====================================================================

// ---------------------------------------------------------------------
// Rohstoff-Symbole
// ---------------------------------------------------------------------
function rsym(r, titel) {
  const b = BILD.rohstoff[r];
  if (!b) return BILD.material[r] ? materialSymbol(r) : '';
  return `<img class="rsym" src="${symbolUrl(b)}" alt="${esc(titel || ROHSTOFF_NAME[r] || '')}" title="${esc(titel || ROHSTOFF_NAME[r] || '')}">`;
}
// Kosten mit Symbolen statt Wörtern: "25 (Münze) · 10 (Holz)"
function kostenHtml(k) {
  const t = Object.keys(k || {}).filter(r => k[r]).map(r => `<span class="kost${(SPIEL[r] || 0) < k[r] ? ' fehlt' : ''}">${k[r]}${rsym(r)}</span>`);
  return t.join(' ') || TX('kostenlos');
}
// "120 (Münze) · 40 (Holz)": der aktuelle Vorrat mit Symbolen
function vorratHtml(liste) { return liste.map(r => `<span class="kost">${SPIEL[r] || 0}${rsym(r)}</span>`).join(' '); }
function bilanzHtml(b) { return Object.keys(b).filter(r => b[r]).map(r => `<span class="kost ${b[r] > 0 ? 'up' : 'down'}">${b[r] > 0 ? '+' : ''}${b[r]}${rsym(r, r === 'einwohner' ? TX('Einwohner') : null)}</span>`).join(' '); }
function symboleEinsetzen(wurzel) {
  (wurzel || document).querySelectorAll('[data-sym]').forEach(el => { if (!el.dataset.fertig) { el.insertAdjacentHTML('afterbegin', rsym(el.dataset.sym, el.textContent.trim())); el.dataset.fertig = '1'; } });
}

// ---------------------------------------------------------------------
// Dorfmauer
// ---------------------------------------------------------------------
function mauer() { return MAUERN[SPIEL.mauer || 0]; }
function wachtuerme() { return anzahlGebaeude('wachturm'); }

// Die Mauer läuft rund um die bebaubare Fläche. An den Straßen bleiben Tore frei.
function dorfMauerAufstellen() {
  (Dorf.mauerTeile || []).forEach(entfernen);
  Dorf.mauerTeile = [];
  const stufe = SPIEL.mauer || 0;
  if (!stufe) return;
  const R = DORF_RASTER, x0 = R.x0 - 0.9, x1 = R.x0 + R.breite + 0.9, z0 = R.z0 - 0.9, z1 = R.z0 + R.tiefe + 0.9;
  const r = zufall(55), palisade = stufe >= 2;
  const schritt = palisade ? 1.9 : 1.6;
  const tore = [];
  const setze = (x, z, seite) => {
    if (aufStrasse(x, z) || aufStrasse(x + (seite ? 0 : 0.8), z + (seite ? 0.8 : 0)) || aufStrasse(x - (seite ? 0 : 0.8), z - (seite ? 0.8 : 0))) {
      if (!tore.some(t => Math.hypot(t.x - x, t.z - z) < 4.3)) tore.push({ x, z });
      return;
    }
    // Die Palisade ist nicht ganz geschlossen: hier und da fehlt noch ein Stück
    if (palisade && r() < 0.08) return;
    const b = palisade ? BILD.palisade[Math.floor(r() * 4)] : BILD.stachelreiter[Math.floor(r() * 3)];
    const o = figur(b, 0); stelle(o, x, z);
    Dorf.mauerTeile.push(o);
  };
  for (let x = x0; x <= x1; x += schritt) { setze(x, z0, false); setze(x, z1, false); }
  for (let z = z0 + 0.7; z <= z1 - 0.3; z += palisade ? 0.75 : 1.1) { setze(x0, z, true); setze(x1, z, true); }
  tore.forEach(t => { const o = figur(BILD.tor[palisade ? 'palisade' : 'barrikade'][0], 0); stelle(o, t.x, t.z + 0.05); Dorf.mauerTeile.push(o); });
}

function mauerKarte(leiste) {
  const st = SPIEL.mauer || 0, jetzt = MAUERN[st], naechste = MAUERN[st + 1];
  let grund = '';
  if (naechste) {
    if (naechste.epoche > SPIEL.epoche) grund = TX`Ab Epoche ${naechste.epoche + 1}`;
    else if (!kannBezahlen(naechste.kosten)) grund = TX('Zu wenig Rohstoffe');
  }
  const k = document.createElement('div');
  k.className = 'mauer-karte';
  k.innerHTML = TX`<canvas width="32" height="36" aria-hidden="true"></canvas>
    <div><b>${rsym('mauer', TX('Mauer'))} Dorfmauer: ${esc(jetzt.name)}</b>
    <p class="note">${esc(st ? jetzt.text : TX('Noch offen. Bei Überfällen verteidigst du das Vorratslager mitten im Dorf.'))}</p>
    ${naechste ? TX`<p class="note">Als Nächstes: <b>${esc(naechste.name)}</b> · ${esc(naechste.epoche > SPIEL.epoche ? naechste.text : MAUERN[st + 1].text)}</p>
      <div class="kosten">${kostenHtml(naechste.kosten)}</div>
      <button class="btn small" type="button" data-a="mauer" ${grund ? 'disabled' : ''}>${esc(grund || TX`${naechste.name} bauen`)}</button>` : TX('<p class="note">Die stärkste Mauer steht.</p>')}</div>`;
  const c = k.querySelector('canvas'), q = (st >= 2 ? BILD.palisade[0] : BILD.stachelreiter[0]).quelle;
  if (neueGrafik()) bildEinpassen(c, q);
  else { c.width = q.width; c.height = q.height; c.getContext('2d').drawImage(q, 0, 0); }
  leiste.append(k);
  const knopf = k.querySelector('[data-a="mauer"]');
  if (knopf) knopf.addEventListener('click', () => {
    if (grund) return;
    bezahlen(naechste.kosten); SPIEL.mauer = st + 1;
    spielSpeichern(); geraeusch('bauen'); dorfMauerAufstellen();
    meldung(TX`${naechste.name} steht`, TX('Rund ums Dorf'), 1800);
    bauLeisteBauen();
  });
}

// Wie gut hält das Dorf ohne dich? Mauer, Wachtürme und Begleiter zählen.
function dorfSchutz() {
  const tuerme = SPIEL.gebaeude.filter(b => b.typ === 'wachturm').reduce((a, b) => a + (stufeVon(b).turmMal || 1), 0);
  const kasernen = SPIEL.gebaeude.filter(b => b.typ === 'kaserne').reduce((a, b) => a + (b.rang || 1) * (stufeVon(b).begleiterMal || 1), 0);
  return Math.round(mauer().schutz + tuerme * UEBERFALL.turmSchutz + kasernen * UEBERFALL.begleiterSchutz);
}

// ---------------------------------------------------------------------
// Überfälle: planen, melden, auslösen
// ---------------------------------------------------------------------
function ueberfallPlanen(ab) {
  const A = regel('ueberfallAbstand');
  const [a, b] = A ? A.start.map((n, i) => Math.round(Math.max(A.ende[i], n - SPIEL.tag * A.kuerzerProTag))) : UEBERFALL.abstand;
  SPIEL.ueberfall = { tag: Math.max(UEBERFALL.ersterTag + zzGanz(0, 2), ab + zzGanz(a, b)), gemeldet: false };
}
function vorwarnung() { return UEBERFALL.vorwarnung + Math.min(2, wachtuerme()) + (gebaeudeWert('vorwarnung') || 0); }
// Wird jeden Tag aus tagVergeht aufgerufen
function ueberfallTag(bericht) {
  if (!SPIEL.ueberfall) ueberfallPlanen(SPIEL.tag);
  if (SPIEL.angst > 0) SPIEL.angst--;
  if (SPIEL.stolz > 0) SPIEL.stolz--;
  const rest = SPIEL.ueberfall.tag - SPIEL.tag;
  if (!SPIEL.ueberfall.gemeldet && rest <= vorwarnung() && rest > 0) {
    SPIEL.ueberfall.gemeldet = true;
    bericht.push((wachtuerme() ? TX('Vom Wachturm aus sieht man Rauch am Fluss: ') : TX('Ein Späher kommt zurück: ')) + (rest === 1 ? TX('Plünderer sammeln sich. Morgen sind sie hier.') : TX`Plünderer sammeln sich. In ${rest} Tagen sind sie hier.`));
    if (gebaeudeWert('spaeher') === true) bericht.push(TX`Der Späher hat sie gezählt: Stärke ${UEBERFALL.staerke()}${SPIEL.ueberfall.eiferer ? TX(', Eiferer sind dabei') : ''}.`);
  }
}
function ueberfallFaellig() { return !!(SPIEL.ueberfall && SPIEL.tag >= SPIEL.ueberfall.tag); }
function ueberfallHinweis() {
  if (!SPIEL.ueberfall || !SPIEL.ueberfall.gemeldet) return '';
  const rest = SPIEL.ueberfall.tag - SPIEL.tag;
  return rest <= 0 ? TX('Überfall heute!') : rest === 1 ? TX('Überfall morgen') : TX`Überfall in ${rest} Tagen`;
}
// Nach jeder Rückkehr: Steht ein Überfall an, kommt er jetzt. Sonst geht es normal weiter.
function ueberfallPruefen(weiter) {
  if (!ueberfallFaellig()) { if (weiter) weiter(); return; }
  ueberfallZeigen(weiter);
}

const UEBERFALL_TEXTE = [
  TX('Hörner im Morgennebel. Vom Fluss her kommen Plünderer, Fackeln in der Hand, und sie wissen genau, wo eure Vorräte liegen.'),
  TX('Die Hunde bellen, bevor jemand etwas sieht. Dann sieht man es: eine Bande, die nicht zum Reden gekommen ist.'),
  TX('Die Liste aus dem Lager war kein Scherz. Sie kommen, und sie haben Leitern dabei.'),
];
function ueberfallZeigen(weiter) {
  const s = UEBERFALL.staerke(), schutz = dorfSchutz(), angriff = Math.round(UEBERFALL.angriff(s) * schwierigkeit().schaden);
  SPIEL.ueberfall.staerke = s;
  // Ist der innere Kreis wütend genug, kommen statt Plünderern die Eiferer
  if (SPIEL.ueberfall.eiferer === undefined) SPIEL.ueberfall.eiferer = eifererUeberfall();
  const eif = SPIEL.ueberfall.eiferer, N = SPIEL.bestehende && SPIEL.bestehende.nemesis;
  const m = mauer(), sicher = schutz >= angriff;
  const begl = SPIEL.gebaeude.filter(b => b.typ === 'kaserne');
  modusDorf();
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="uf">
    <div class="label">Tag ${SPIEL.tag} · Überfall</div>
    <h1 id="uf">${eif ? TX('Die Eiferer kommen!') : (SPIEL.mauer ? TX('Plünderer am Tor!') : TX('Plünderer am Dorfrand!'))}</h1>
    <p class="story">${esc(eif ? TX('Eine Prozession in Kutten, Kanister voller Öl, Kabel um den Hals. Sie singen. Hinter ihnen piepen Wartungsroboter.') + (N ? ' ' + TX`Vorneweg: ${N.name}.` : '') : UEBERFALL_TEXTE[(SPIEL.ueberfaelle || 0) % UEBERFALL_TEXTE.length])}</p>
    <dl class="facts">
      <dt>Bande</dt><dd>Stärke ${s} · ${s >= 2 ? TX('drei') : TX('zwei')} Wellen</dd>
      <dt>Mauer</dt><dd>${esc(m.name)}${SPIEL.mauer ? ' · ' + esc(TX`${m.torName} hält ${m.tor} Schaden`) : TX(' · sie greifen das Vorratslager an')}</dd>
      <dt>Wachtürme</dt><dd>${wachtuerme() || TX('keine')}${wachtuerme() ? TX(' · schießen mit') : ''}</dd>
      <dt>Begleiter</dt><dd>${begl.length ? esc(begl.map(b => begleiterName(b)).join(', ')) : TX('keine')}</dd>
      <dt>Ohne dich</dt><dd>Schutz ${schutz} gegen Angriff ${angriff}: ${sicher ? TX('<b class="up">die Mauer hält</b>') : TX('<b class="down">sie kommen durch und plündern</b>')}</dd>
    </dl>
    <p class="note">Kämpfst du selbst, verteidigst du ${SPIEL.mauer ? TX('das Tor') : TX('das Vorratslager')} in Wellen. Gewinnst du, nimmst du der Bande ihre Beute ab, und die Leute sind stolz auf ihr Dorf.</p>
    <div class="knopfreihe">
      <button class="btn" data-a="kampf" type="button">Verteidigen</button>
      <button class="btn ghost" data-a="warten" type="button">Hinter der Mauer ausharren</button>
    </div></div>`);
  overlay.querySelector('[data-a="kampf"]').addEventListener('click', () => { overlayWeg(); ueberfallKaempfen(weiter); });
  overlay.querySelector('[data-a="warten"]').addEventListener('click', () => { overlayWeg(); ueberfallAbwarten(weiter); });
  geraeusch('welle');
}

// Was die Bande mitnimmt, wenn sie durchkommt
function pluendern(anteil) {
  const weg = {};
  ['gold', 'nahrung', 'holz', 'stein'].forEach(r => { const n = Math.floor((SPIEL[r] || 0) * anteil); if (n > 0) { SPIEL[r] -= n; weg[r] = n; } });
  return weg;
}
let ueberfallFolgen = [];   // was der verlorene Überfall am Dorf angerichtet hat, für den Bericht
function ueberfallVorbei(sieg) {
  SPIEL.ueberfaelle = (SPIEL.ueberfaelle || 0) + 1;
  ueberfallPlanen(SPIEL.tag);
  if (sieg) { SPIEL.stolz = UEBERFALL.stolzTage; SPIEL.abgewehrt = (SPIEL.abgewehrt || 0) + 1; }
  else { SPIEL.angst = UEBERFALL.angstTage; ueberfallFolgen = dorfherzTreffen(); }
  spielSpeichern();
}
function ueberfallAbwarten(weiter) {
  const s = SPIEL.ueberfall.staerke, angriff = Math.round(UEBERFALL.angriff(s) * schwierigkeit().schaden), schutz = dorfSchutz();
  let text, weg = {};
  if (schutz >= angriff) {
    text = SPIEL.mauer ? TX`Die Plünderer rennen gegen die ${mauer().name}, schießen ein paar Pfeile über die Spitzen und ziehen fluchend ab. Niemand ist verletzt.` : TX('Die Wachen halten sie auf. Die Bande zieht ab.');
    ueberfallVorbei(true);
    SPIEL.stolz = 0;
  } else {
    const anteil = Math.min(UEBERFALL.verlustMax, (angriff - schutz) / angriff * 0.4);
    weg = pluendern(anteil);
    // Der Hauptmann der Eiferer prahlt im inneren Kreis mit seinem Sieg
    const N = SPIEL.ueberfall.eiferer && SPIEL.bestehende.nemesis;
    if (N) { N.stufe = Math.min(6, N.stufe + 1); N.seineSiege++; N.verlauf.push(TX`Tag ${SPIEL.tag}: Hat euer Dorf geplündert, ohne dich zu sehen.`); }
    text = SPIEL.mauer ? TX`Die Bande bricht durch die ${mauer().name}. Bis die Leute sich gesammelt haben, sind die Plünderer mit vollen Säcken wieder weg.` : TX('Ohne Mauer ist das Dorf offen. Die Plünderer laufen durch die Gassen und nehmen mit, was sie tragen können.');
    ueberfallVorbei(false);
  }
  ueberfallBericht(TX('Hinter der Mauer'), text, weg, weiter);
}
function ueberfallBericht(titel, text, weg, weiter, extra) {
  dorfHudAktualisieren();
  const verlust = Object.keys(weg).map(r => `<div class="reward x"><b>−${weg[r]}${rsym(r)}</b><span class="label">${esc(ROHSTOFF_NAME[r])}</span></div>`).join('');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ub">
    <div class="label">Tag ${SPIEL.tag} · Überfall</div>
    <h1 id="ub">${esc(titel)}</h1>
    <p class="story">${esc(text)}</p>
    ${verlust ? `<div class="rewards">${verlust}</div>` : ''}
    ${extra || ''}
    ${ueberfallFolgen.map(f => `<p class="note"><b>${esc(f)}</b></p>`).join('')}
    <p class="note">${SPIEL.angst ? TX`Die Leute haben Angst: ${UEBERFALL.angst} Lebensstandard für ${SPIEL.angst} Tage.` + ' ' : ''}${SPIEL.stolz ? TX`Das Dorf ist stolz: +${UEBERFALL.stolz} Lebensstandard für ${SPIEL.stolz} Tage.` + ' ' : ''}Die nächste Bande kommt in etwa ${SPIEL.ueberfall.tag - SPIEL.tag} Tagen. Mauern, Wachtürme und Begleiter helfen.</p>
    <button class="btn" data-a="zu" type="button">Weiter</button></div>`);
  ueberfallFolgen = [];
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { overlayWeg(); dorfHudAktualisieren(); if (weiter) weiter(); });
}
// Die Bestenliste als Tafel. Der eigene Lauf ist hervorgehoben.
function bestenlisteHtml(markiert) {
  const zeilen = bestenlisteLesen().map((e, i) => `<tr class="${e.id === markiert ? 'eigener' : ''}"><td>${i + 1}</td><td>${e.wert}</td><td>${esc(TX`Tag ${e.tage}`)}</td><td>${esc(KLASSEN[e.klasse] ? KLASSEN[e.klasse].name : '')}</td><td>${esc(spielzeitText(e.zeit || 0))}</td></tr>`).join('');
  return TX`<div class="label">Bestenliste</div><table class="bestenliste"><thead><tr><th>Platz</th><th>Dorfwert</th><th>Überlebt</th><th>Klasse</th><th>Spielzeit</th></tr></thead><tbody>${zeilen}</tbody></table>`;
}
// Das Dorf ist verloren: Der Stand bleibt zum Ansehen, weitergespielt wird er nicht.
function dorfZerstoertZeigen() {
  const leer = SPIEL.einwohner <= 0;
  const liste = regel('bestenliste') ? bestenlisteHtml(bestenlisteEintragen()) : '';
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="dz">
    <div class="label">${esc(MODI[SPIEL.modus].name)} · Tag ${SPIEL.tag} · ${esc(EPOCHEN[SPIEL.epoche].name)}</div>
    <h1 id="dz">${leer ? TX('Das Dorf steht leer') : TX('Das Dorfherz ist erloschen')}</h1>
    <p class="story">${leer ? TX('Der Letzte hat die Tür hinter sich zugezogen. Niemand ist mehr da, der das Feuer hütet. In ein paar Jahren holt sich der Wald auch diese Häuser.') : TX('Die Asche ist kalt. Wer noch laufen kann, packt zusammen und geht. Auf den Karten der Plünderer wird das Dorf durchgestrichen.')}</p>
    <dl class="facts">
      <dt>Dorfwert</dt><dd>${dorfPunkte()}</dd>
      <dt>Spielzeit</dt><dd>${esc(spielzeitZeile(SPIEL))}</dd>
    </dl>
    ${liste}
    <p class="note">Dieses Spiel ist zu Ende. Der Spielstand bleibt zum Ansehen im Speicherplatz, bis du ihn überschreibst.</p>
    <button class="btn" data-a="menue" type="button">Zum Hauptmenü</button></div>`);
  overlay.querySelector('[data-a="menue"]').addEventListener('click', hauptmenueZeigen);
}

// ---------------------------------------------------------------------
// Der Kampf am Dorfrand
// ---------------------------------------------------------------------
const MAUER_Z = -5.2;
let ueberfallWeiter = null;
function ueberfallKaempfen(weiter) {
  ueberfallWeiter = weiter;
  const m = mauer(), st = SPIEL.mauer || 0;
  const mis = MISSIONEN.ueberfall;
  mis.feld = st ? { x: 15, zMin: MAUER_Z + 0.9, zMax: 12 } : { x: 15, zMin: -9, zMax: 12 };
  mis.start = [0, st ? -2.6 : -3.8];
  mis.ziel = st
    ? { name: m.torName, art: 'tor', x: 0, z: MAUER_Z, r: 1.3, leben: () => Math.round(m.tor * (1 + (gebaeudeWert('torPlus') || 0) + (verbundStill('wartung') ? ROSTBRECHER.still.wartung.torPlus : 0))), bilder: () => BILD.tor[st >= 2 ? 'palisade' : 'barrikade'], verlust: TX('Das Tor ist gefallen') }
    : { name: TX('Vorratslager'), art: 'tor', x: 0, z: -6.4, r: 1.2, leben: () => 450, bilder: () => [missionBau('lager'), missionBau('lager'), missionBau('lager')], verlust: TX('Das Vorratslager brennt') };
  REISE = null;
  missionStarten('ueberfall');
}
function ueberfallWellen() {
  const s = (SPIEL.ueberfall && SPIEL.ueberfall.staerke) || 1, h = Math.floor(s / 2);
  if (SPIEL.ueberfall && SPIEL.ueberfall.eiferer) return eifererWellen(s).map(x => ({ titel: x.titel, nemesis: x.nemesis, gegner: x.gegner.filter(([, n]) => n > 0) }));
  const w = [
    { titel: TX('Die Vorhut'), gegner: [['pluenderer', 3 + 2 * s], ['schuetze', 1 + h]] },
    { titel: TX('Fackeln am Tor'), gegner: [['pluenderer', 2 + 2 * s], ['brandstifter', 1 + h], ['schildtraeger', 1 + h], ['schuetze', h], ['trommler', s >= 2 ? 1 : 0]] },
  ];
  if (s >= 2) w.push({ titel: TX('Der Anführer kommt'), gegner: [['pluenderer', 3 + 2 * s], ['schildtraeger', 1 + h], ['schuetze', 1 + h], ['brandstifter', 1 + h], ['funkenkaefer', s >= 3 ? 2 : 0], ['trommler', 1]] });
  return w.map(x => ({ titel: x.titel, gegner: x.gegner.filter(([, n]) => n > 0) }));
}
function aufbauDorfrand() {
  const st = SPIEL.mauer || 0;
  szene.background = new THREE.Color('#0c100e');
  const boden = malBoden(60, 16, (x, z) => {
    const wob = Math.sin(x * 0.9) * 0.4 + Math.cos(z * 1.3) * 0.4;
    if (Math.abs(x - Math.sin(z * 0.25) * 1.2) < 1.2 + wob * 0.15) return 'erde';
    if (z < MAUER_Z - 0.6) return Math.hypot(x, z + 9) < 3 + wob ? 'erde' : 'gras';
    if (Math.abs(x) > FELD.x + 1.2 + wob || z > FELD.zMax + 1.2 + wob) return 'wald';
    if (z > 5 && Math.sin(x * 0.5) > 0.2) return 'acker';
    return 'gras';
  }, {
    gras:  ['#3e5a34', '#46643a', '#36502e', '#52703f'],
    wald:  ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    erde:  ['#6a5038', '#76583e', '#5e4632', '#846446'],
    acker: ['#5a4430', '#4e3a28', '#644c34', '#6e5438'],
  }, 41);
  const { g, toPx, r } = boden;
  // Furchen im Acker vor dem Dorf
  for (let z = 5.2; z < 12; z += 0.5) for (let x = -14; x < 14; x += 0.25) if (boden.artBei(toPx(x), toPx(z)) === 'acker' && r() < 0.7) { g.fillStyle = '#3e2e20'; g.fillRect(toPx(x), toPx(z), 2, 1); }
  const istGras = (px, py) => boden.artBei(px, py) === 'gras';
  streuGras(boden, istGras, 2400, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuBlumen(boden, istGras, 120);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'wald', 1600);
  bodenMesh(boden, 60);
  // Hinter der Mauer: Häuser des Dorfes
  [[-11, -8.6, 'wohnhaus', 0], [-6.5, -9.4, 'holzfaeller', 0], [5.5, -9.2, 'wohnhaus', 1], [10.5, -8.4, 'wohnhaus', 2], [-2.8, -11.5, 'wirtshaus', 0]].forEach(([x, z, typ, i]) => {
    const b = BILD.gebaeude[typ]; if (b) decoBild(missionBau(typ, i % b.length), x, z, 0, 0);
  });
  if (!st) [[-4.5, -6.8], [4.6, -6.6]].forEach(([x, z]) => decoBild(BILD.tonne, x, z, 0.4));
  // Die Mauer: eine Linie quer übers Feld, in der Mitte das Tor
  if (st) {
    const breit = st >= 2 ? 1.9 : 1.6;
    for (let x = -FELD.x - 1; x <= FELD.x + 1; x += breit) {
      if (Math.abs(x) < 1.6) continue;
      const o = decoBild(st >= 2 ? BILD.palisade[Math.abs(Math.round(x * 3)) % 4] : BILD.stachelreiter[Math.abs(Math.round(x * 3)) % 3], x, MAUER_Z, 0, 0);
      o.sprite.position.z = MAUER_Z;
    }
    for (let x = -FELD.x - 0.5; x <= FELD.x + 0.5; x += 0.9) if (Math.abs(x) > 1.2) HINDERNISSE.push({ x, z: MAUER_Z, r: 0.55, mauer: true });
  }
  // Wald und Büsche außen herum
  const rr = zufall(43);
  for (let i = 0; i < 120; i++) {
    const x = -30 + rr() * 60, z = -14 + rr() * 36;
    if (Math.abs(x) < FELD.x + 1.6 && z < FELD.zMax + 1.6 && z > MAUER_Z - 8) continue;
    if (Math.abs(x) < 3 && z > FELD.zMax) continue;
    decoBild(rr() < 0.55 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
  for (let i = 0; i < 8; i++) decoBild(BILD.busch[i % 6], (i % 2 ? 1 : -1) * (6 + rr() * 8), 1 + rr() * 9, 0, 0.5);
}
// Wachtürme stehen hinter der Mauer und schießen mit
function ueberfallTuermeAufstellen() {
  const st = SPIEL.mauer || 0, liste = SPIEL.gebaeude.filter(b => b.typ === 'wachturm');
  [-5.5, 5.5, -11, 11].slice(0, liste.length).forEach((x, i) => {
    const mal = (stufeVon(liste[i]).turmMal || 1) * (stromAn() ? 1.25 : 1);
    const t = { art: 'turm', typ: 'wachturm', dorf: true, mal, x, z: st ? MAUER_Z - 1.1 : -7.6, r: 0.6 };
    turmAufstellen(t, missionBau('wachturm'), Math.round(WACHTURM.leben * mal));
  });
}
// Stacheln an der Mauer: Wer davor steht, blutet
function ueberfallTick(dt) {
  const m = mauer();
  if (!m.stacheln) return;
  G.stachelT = (G.stachelT || 0) - dt;
  if (G.stachelT > 0) return;
  G.stachelT = 0.5;
  for (const e of G.gegner.slice()) {
    if (e.hp <= 0 || e.def.objekt) continue;
    const anDerMauer = e.z < MAUER_Z + 1.2 + e.r && (Math.abs(e.x) > 1.4 || SPIEL.mauer === 1);
    if (anDerMauer) { gegnerTreffen(e, Math.ceil(m.stacheln * 0.5 * G.mult.leben), 0, 1, 0.5, false, 'zustand'); if (Math.random() < 0.4) partikel(e.x, 0.5, e.z, 0xa83040, 2, 2); }
  }
}
// Nach dem Kampf: kein weiterer Tag vergeht, die Beute geht direkt ins Dorf
function ueberfallEnde(erg) {
  const nemesisText = nemesisNachKampf(erg.sieg);
  modusDorf();
  if (erg.sieg) {
    gutschreiben({ gold: erg.gold || 0, teile: erg.teile || 0 });
    gutschreiben(erg.material || {});
    const { rein } = inDenBeutel(erg.items || []);
    SLOTS.forEach(sl => { const it = erg.ausItems && erg.ausItems[sl]; if (it && SPIEL.beutel.some(x => x.uid === it.uid)) SPIEL.ausruestung[sl] = it.uid; });
    ueberfallVorbei(true);
    const neu = (erg.lore || []).filter(id => chronikEintragen(id)).map(id => LORE.find(l => l.id === id).titel);
    spielSpeichern();
    ueberfallBericht(TX('Die Bande ist geschlagen'), TX('Die letzten Plünderer rennen zurück zum Fluss. Im Dorf wird bis spät in die Nacht erzählt, wer wen mit welcher Bratpfanne getroffen hat.'), {}, ueberfallWeiter,
      TX`<div class="rewards"><div class="reward g"><b>+${erg.gold}${rsym('gold')}</b><span class="label">Gold</span></div>${erg.teile ? TX`<div class="reward t"><b>+${erg.teile}${rsym('teile')}</b><span class="label">Lazi-Teile</span></div>` : ''}</div>
       ${rein.length ? TX`<p class="note">Neu im Beutel: ${rein.map(it => `<span style="color:${SELTENHEIT[it.selten].farbe}">${esc(it.name)}</span>`).join(', ')}</p>` : ''}
       ${neu.length ? TX`<p class="note">Neu in der Chronik: <b>${esc(neu.join(', '))}</b></p>` : ''}
       ${nemesisText ? `<p class="note"><b>${esc(nemesisText)}</b></p>` : ''}`);
  } else {
    const weg = pluendern(UEBERFALL.verlustMax);
    ueberfallVorbei(false);
    ueberfallBericht(TX('Das Dorf wurde geplündert'), TX('Du wachst neben dem Tor auf, Hilde tupft dir die Stirn ab. Die Bande ist weg, und mit ihr ein guter Teil eurer Vorräte.'), weg, ueberfallWeiter, nemesisText ? `<p class="note"><b>${esc(nemesisText)}</b></p>` : '');
  }
  ueberfallWeiter = null;
}
Object.assign(MISSIONEN, {
  ueberfall: { ...MISSIONSTEXTE.ueberfall, ort: 'dorf', ueberfall: true,
    feld: { x: 15, zMin: -4.3, zMax: 12 }, start: [0, -2.6], aufbau: () => aufbauDorfrand(), ziel: null,
    wellen: ueberfallWellen, musik: 'kampf',
    nachStart: () => { ueberfallTuermeAufstellen(); garageRoboterAufstellen(); }, tick: dt => ueberfallTick(dt), nachher: erg => ueberfallEnde(erg),
    belohnung: erg => { const s = (SPIEL.ueberfall && SPIEL.ueberfall.staerke) || 1; erg.gold += 20 + 12 * s; erg.teile += 1 + s; erg.lore = (SPIEL.ueberfaelle || 0) >= 1 ? ['bande'] : []; } },
});

// ---------------------------------------------------------------------
// Begleiter aus der Kaserne
// ---------------------------------------------------------------------
function begleiterName(b) { const d = BEGLEITER[b.begleiter || 'waechter']; return (b.name || d.name) + ' (' + d.name + (b.rang > 1 ? TX`, Rang ${b.rang}` : '') + ')'; }
function begleiterWerte(b) {
  const d = BEGLEITER[b.begleiter || 'waechter'], mal = (1 + BEGLEITER_RANG.mal * ((b.rang || 1) - 1)) * (stufeVon(b).begleiterMal || 1);
  return { leben: Math.round(d.leben * mal), schaden: Math.round(d.schaden * mal), mal };
}
function begleiterWahl(b, weiter) {
  const karten = Object.keys(BEGLEITER).map(k => {
    const d = BEGLEITER[k];
    return TX`<button type="button" class="begleiter-karte" data-b="${k}">
      <canvas width="32" height="39" aria-hidden="true" data-bild="${k}"></canvas>
      <b>${esc(d.name)}</b><span class="label">wie ${esc(KLASSEN[d.klasse].name)}</span>
      <small>${esc(d.text)}</small><small class="note">${d.leben} Leben · ${d.schaden} Schaden${d.fern ? TX(' · Fernkampf') : ''}</small>
      <small class="bf-kurz">${BEGLEITER_FAEHIG[k].map(F => esc(F.name)).join(' · ')}</small></button>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="bw">
    <div class="label">Kaserne · Wen bildest du aus?</div>
    <h1 id="bw">Ein Begleiter für dich</h1>
    <p class="story">Ein paar Leute aus dem Dorf melden sich freiwillig. Einer zieht in die Kaserne, begleitet dich auf jede Mission und hilft bei Überfällen. Über die Kaserne bildest du ihn später weiter aus.</p>
    <div class="begleiter-wahl">${karten}</div></div>`);
  overlay.querySelectorAll('canvas[data-bild]').forEach(c => { const q = BILD.begleiter[c.dataset.bild].stand.quelle; if (neueGrafik()) bildEinpassen(c, q); else c.getContext('2d').drawImage(q, 0, 0); });
  overlay.querySelectorAll('[data-b]').forEach(k => k.addEventListener('click', () => {
    const vergeben = SPIEL.gebaeude.filter(x => x.typ === 'kaserne' && x.name).map(x => x.name);
    const frei = BEGLEITER_NAMEN.filter(n => !vergeben.includes(n));
    b.begleiter = k.dataset.b; b.rang = 1; b.name = frei[Math.floor(Math.random() * frei.length)] || TX('Kurt');
    spielSpeichern(); geraeusch('welle'); overlayWeg();
    meldung(TX`${b.name} zieht in die Kaserne`, TX`${BEGLEITER[b.begleiter].name} · begleitet dich ab jetzt`, 2200);
    if (weiter) weiter();
  }));
}
function begleiterAusbilden(b) {
  const rang = b.rang || 1, k = BEGLEITER_RANG.kosten(rang);
  if (rang >= BEGLEITER_RANG.max || !kannBezahlen(k)) return;
  bezahlen(k); b.rang = rang + 1;
  spielSpeichern(); geraeusch('bauen');
  meldung(TX`${b.name} ist jetzt Rang ${b.rang}`, TX`+${Math.round(BEGLEITER_RANG.mal * 100)} % Leben und Schaden`, 1800);
  dorfHudAktualisieren(); zeigeInfoTyp('kaserne', b);
}
// Im Infofenster der Kaserne
function kaserneInfo(b, p, knopf) {
  if (!b.begleiter) { knopf(TX('Begleiter wählen'), () => begleiterWahl(b, () => zeigeInfoTyp('kaserne', b))); return; }
  const d = BEGLEITER[b.begleiter], w = begleiterWerte(b), rang = b.rang || 1;
  const box = document.createElement('div'); box.className = 'ausbau';
  box.innerHTML = TX`<span class="label">${esc(b.name)} · ${esc(d.name)} · Rang ${rang} von ${BEGLEITER_RANG.max}</span>
    <span class="note">${esc(d.text)}</span><span class="info-wirkung">${w.leben} Leben · ${w.schaden} Schaden</span>
    <span class="bf-liste">${begleiterFaehigHtml(b.begleiter)}</span>
    ${rang < 3 ? TX('<span class="note">Ab Rang 3 laden die Fähigkeiten ein Viertel schneller.</span>') : TX('<span class="note">Rang 3 erreicht: Fähigkeiten laden schneller.</span>')}
    ${b.begleiter === 'lehrling' ? TX`<span class="label">Element</span><span class="bf-elemente">${Object.keys(BEGLEITER_ELEMENTE).map(k => `<button type="button" class="btn small ghost${(b.element || 'blitz') === k ? ' gewaehlt' : ''}" data-bel="${k}" style="--elf:${BEGLEITER_ELEMENTE[k].farbe}">${BEGLEITER_ELEMENTE[k].name}</button>`).join('')}</span>` : ''}
    ${rang < BEGLEITER_RANG.max ? TX`<span class="note">Ausbilden: ${kostenHtml(BEGLEITER_RANG.kosten(rang))} · +${Math.round(BEGLEITER_RANG.mal * 100)} % Leben und Schaden</span>` : TX('<span class="note">Voll ausgebildet.</span>')}`;
  p.append(box);
  box.querySelectorAll('[data-bel]').forEach(k => k.addEventListener('click', () => { b.element = k.dataset.bel; spielSpeichern(); geraeusch('klick'); zeigeInfoTyp('kaserne', b); }));
  if (rang < BEGLEITER_RANG.max) knopf(TX`Ausbilden zu Rang ${rang + 1}`, () => begleiterAusbilden(b), !kannBezahlen(BEGLEITER_RANG.kosten(rang)));
}

// In der Mission: ein Begleiter je Kaserne
function begleiterAufstellen() {
  SPIEL.gebaeude.filter(b => b.typ === 'kaserne').forEach((b, i) => {
    const art = b.begleiter || 'waechter', d = BEGLEITER[art], w = begleiterWerte(b);
    const x = MIS.start[0] + (i ? 1.5 : -1.5), z = MIS.start[1] - 1;
    G.verbuendete.push(Object.assign(figur(BILD.begleiter[art].stand, 0.5), {
      art: 'begleiter', def: d, bilder: BILD.begleiter[art], name: b.name || d.name, x, z, r: 0.4,
      hp: w.leben, maxHp: w.leben, schaden: w.schaden + G.boni.schaden, mal: w.mal, spott: !!d.spott, ausweichen: d.ausweichen || 0,
      blick: 1, cd: 0, hiebT: 0, laufT: 0, bewegt: false, blitz: 0,
      typB: art, rang: b.rang || 1, bau: b, element: b.element || 'blitz', fcd: [3, 6], schild: 0, koeder: 0, koederR: 0, turm: null, barrikade: null,
    }));
  });
}
// Bewegung und Angriff eines Begleiters. Gibt true zurück, wenn er diesen Schritt fertig ist.
function begleiterBewegen(v, dt) {
  const d = v.def;
  if (begleiterFaehigkeiten(v, dt)) return true;
  // Der Geselle flickt, wenn gerade niemand in der Nähe angreift
  if (d.flickt && !naechster(v, G.gegner, 4.5)) {
    const kaputt = [G.tuer, ...G.tuerme].filter(t => t && t.hp > 0 && t.hp < t.maxHp && t.zielArt !== 'feuer')[0];
    if (kaputt) {
      const dx = kaputt.x - v.x, dz = kaputt.z - v.z, dist = Math.hypot(dx, dz) || 0.001;
      v.blick = dx >= 0 ? 1 : -1;
      if (dist > kaputt.r + 1.0) { const [wx, wz] = wegRichtung(v, kaputt.x, kaputt.z, dt), wl = Math.hypot(wx, wz) || 1; v.x += wx / wl * d.tempo * dt; v.z += wz / wl * d.tempo * dt; v.bewegt = true; }
      else {
        kaputt.hp = Math.min(kaputt.maxHp, kaputt.hp + d.flickt * v.mal * dt);
        if (v.cd <= 0) { v.cd = 0.6; v.hiebT = 0.15; partikel(kaputt.x, 0.9, kaputt.z, 0xeab03a, 3, 2); }
      }
      return true;
    }
  }
  const ziel = naechster(v, G.gegner, d.fern ? 11 : 9);
  if (!ziel) return false;
  const dx = ziel.x - v.x, dz = ziel.z - v.z, dist = Math.hypot(dx, dz) || 0.001;
  v.blick = dx >= 0 ? 1 : -1;
  if (d.fern) {
    // Der Lehrling hält Abstand und schießt
    if (dist < 2.6) { v.x -= dx / dist * d.tempo * dt; v.z -= dz / dist * d.tempo * dt; v.bewegt = true; }
    else if (dist > d.fern || !sichtFrei(v.x, v.z, ziel.x, ziel.z)) { const [wx, wz] = wegRichtung(v, ziel.x, ziel.z, dt), wl = Math.hypot(wx, wz) || 1; v.x += wx / wl * d.tempo * dt; v.z += wz / wl * d.tempo * dt; v.bewegt = true; }
    if (dist <= d.fern + 0.5 && v.cd <= 0) {
      v.cd = d.pause; v.hiebT = 0.15;
      // Elementblitz: das gewählte Element fliegt mit
      const E = BEGLEITER_ELEMENTE[v.element] || BEGLEITER_ELEMENTE.blitz;
      const g = Object.assign(figur(BILD.bolzen, 0), { x: v.x, z: v.z, y: 1.4, ziel, tempo: 13, life: 1.4, schaden: v.schaden, status: E.status, rueckstoss: E.rueckstoss, farbe: new THREE.Color(E.farbe).getHex() });
      g.sprite.material.color.set(g.farbe);
      G.geschosse.push(g);
    }
    return true;
  }
  if (dist > ziel.r + 1.0) { const [wx, wz] = wegRichtung(v, ziel.x, ziel.z, dt), wl = Math.hypot(wx, wz) || 1; v.x += wx / wl * d.tempo * dt; v.z += wz / wl * d.tempo * dt; v.bewegt = true; }
  else if (v.cd <= 0) { v.cd = d.pause; v.hiebT = 0.15; gegnerTreffen(ziel, v.schaden, dx / dist, dz / dist, d.spott ? 4 : 2, false, 'soldat'); }
  return true;
}

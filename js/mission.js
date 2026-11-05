// =====================================================================
// MISSIONEN: Die verlassene Universität, der dunkle Wald und
// Geheimmissionen. Jede Mission verteidigt ein Ziel gegen Wellen.
// =====================================================================


// Der Hof der Universität: ein Halbkreis vor der Archivtür, wie die Ränge eines Hörsaals
const UNI_HOF = { halbkreis: [0, -9.4, 17.5] }, UNI_LUECKEN = [0.45, Math.PI / 2, Math.PI - 0.45];
// Jede Mission: Spielfeld, Aufbau, Wellen, das zu schützende Ziel und die Belohnung
const MISSIONEN = {
  universitaet: { ...MISSIONSTEXTE.universitaet, ort: 'universitaet',
    feld: { x: 15, zMin: -8.6, zMax: 13, flaechen: [UNI_HOF], zugaenge: UNI_LUECKEN.map(a => [Math.cos(a) * 17.5, -9.4 + Math.sin(a) * 17.5]) }, start: [0, -5.5], aufbau: () => aufbauUniversitaet(),
    wellen: () => WELLEN, musik: 'kampf',
    ziel: { name: TX('Archivtür'), art: 'tuer', x: 0, z: -9.1, r: 1.3, leben: () => CFG.kellertuer.leben, verlust: TX('Die Archivtür ist gefallen') } },
  wald: { ...MISSIONSTEXTE.wald, ort: 'wald',
    feld: { x: 14, zMin: -10, zMax: 10 }, start: [0, neueGrafik() ? 3.8 : 2.6], aufbau: () => aufbauWald(false), nebel: true,
    wellen: () => WELLEN_WALD, musik: 'kampf',
    ziel: { name: TX('Lagerfeuer'), art: 'feuer', x: 0, z: 0, r: 1.1, leben: () => LAGERFEUER.leben } },
  hort: { ...MISSIONSTEXTE.hort, ort: 'hort',
    feld: { x: 13, zMin: -9, zMax: 9 }, start: neueGrafik() ? [-4.2, 3.8] : [0, 2.6], aufbau: () => aufbauWald(true), nebel: true, legendaer: true,
    wellen: () => WELLEN_HORT, musik: 'kampf',
    ziel: { name: TX('Lagerfeuer'), art: 'feuer', x: 0, z: 0, r: 1.1, leben: () => LAGERFEUER.leben } },
};

let FELD = MISSIONEN.universitaet.feld;  // begehbare Fläche der aktuellen Mission
let MIS = MISSIONEN.universitaet;         // aktuelle Mission
let G = null, P = null;
const zielArt = () => MIS.ziel ? MIS.ziel.art : 'keins';
// Welche Mission an einem Ort wartet: fest, oder je nach Lage (z. B. Bunker oder Fuchs in der Stadt)
// Eine angenommene Anfrage (Verbund oder seltene Mission) gilt für diese eine Reise.
function ortMission(ortId) {
  if (REISE && REISE.mission && REISE.ort === ortId) return REISE.mission;
  const o = ORTE[ortId]; return o && o.missionWahl ? o.missionWahl() : o && o.mission;
}
// Missionen in Runden: Was aus der letzten Runde mitgenommen wird (Leben, Beute, Punkte)
let RUNDE_WEITER = null, RUNDE_JETZT = 1;
const bildKlasse = k => k === 'schwert' ? 'ritter' : k;
const LADE_NAME = { schwert: TX('Wirbel'), beschwoerer: TX('Golem'), architekt: TX('Bauen'), schatten: TX('Stoß') };

// ---------------------------------------------------------------------
// Briefing vor der Mission
// ---------------------------------------------------------------------
function missionsBriefing(ortId) {
  const mis = MISSIONEN[ortMission(ortId || 'universitaet')];
  if (mis.markt) { overlayWeg(); mitLadebild(() => missionStarten(mis.ort)); return; }   // Auf den Markt ohne Briefing
  const g = mis.geschichten[(SPIEL.karte.besucht[mis.ort] || 0) % mis.geschichten.length];
  const boni = missionsBoni(), w = aktuelleWaffe(), K = KLASSEN[SPIEL.klasse];
  const gefahr = ORTE[mis.ort].gefahr;
  const pips = '■'.repeat(gefahr) + '<span>' + '■'.repeat(5 - gefahr) + '</span>';
  const dorfBoni = [];
  if (boni.schaden) dorfBoni.push(TX('Schmiede: +2 Schaden'));
  if (boni.werkstatt) dorfBoni.push(TX('Werkstatt: ') + (SPIEL.klasse === 'schwert' ? TX('Türme') : SPIEL.klasse === 'beschwoerer' ? TX('Golems') : TX('Bauwerke')) + ' +' + Math.round((boni.turmSchaden - 1) * 100) + ' %');
  if (boni.soldaten) dorfBoni.push(TX('Begleiter: ') + SPIEL.gebaeude.filter(b => b.typ === 'kaserne').map(begleiterName).join(', '));
  let klassenTeil = '';
  if (SPIEL.klasse === 'beschwoerer') {
    klassenTeil += TX`<div class="wahl"><span class="label">Welche Golems beschwörst du?</span><div class="wahl-knoepfe">` +
      Object.keys(ELEMENTE).map(e => `<button type="button" class="wahl-knopf${SPIEL.element === e ? ' an' : ''}" data-element="${e}" aria-pressed="${SPIEL.element === e}">
        <b style="color:${ELEMENTE[e].farbe}">${ELEMENTE[e].name}</b><small>${esc(ELEMENTE[e].text)}</small></button>`).join('') + '</div></div>';
  }
  // Lehrlinge aus der Kaserne: Element für Elementblitz und Elementturm
  SPIEL.gebaeude.filter(b => b.typ === 'kaserne' && b.begleiter === 'lehrling').forEach(b => {
    klassenTeil += TX`<div class="wahl"><span class="label">Element von ${esc(b.name || TX('Lehrling'))} (Lehrling)</span><div class="wahl-knoepfe">` +
      Object.keys(BEGLEITER_ELEMENTE).map(e => `<button type="button" class="wahl-knopf${(b.element || 'blitz') === e ? ' an' : ''}" data-belement="${e}" data-bau="${b.id}" aria-pressed="${(b.element || 'blitz') === e}">
        <b style="color:${BEGLEITER_ELEMENTE[e].farbe}">${BEGLEITER_ELEMENTE[e].name}</b><small>${esc(BEGLEITER_ELEMENTE[e].text)}</small></button>`).join('') + '</div></div>';
  });
  if (SPIEL.klasse === 'architekt') {
    klassenTeil += '<dl class="facts">' + Object.keys(BAUWERKE).map(b => TX`<dt>${esc(BAUWERKE[b].name)}</dt><dd>${BAUWERKE[b].kosten} Schrott · ${esc(BAUWERKE[b].text)}</dd>`).join('') + '</dl>';
  }
  const startLeben = REISE && REISE.ort === mis.ort && REISE.leben < 1 ? Math.round(REISE.leben * 100) : 100;
  overlayZeigen(TX`
    <div class="card panel" role="dialog" aria-labelledby="mt">
      <div class="label">Tag ${SPIEL.tag} · ${esc(mis.art)}</div>
      <h1 id="mt">${esc(mis.titel)}</h1>
      <p class="story">${esc(g.intro)}</p>
      <dl class="facts">
        <dt>Ziel</dt><dd>${esc(mis.zielText)}</dd>
        <dt>Gefahr</dt><dd><span class="pips">${pips}</span> Jeder Sieg macht die Gegner etwas stärker</dd>
        <dt>Held</dt><dd>${esc(K.name)}, Stufe ${SPIEL.held.stufe}${startLeben < 100 ? TX` · <span class="schlecht">startet mit ${startLeben} % Leben</span>` : ''}</dd>
        <dt>Waffe</dt><dd style="color:${SELTENHEIT[w.selten].farbe}">${esc(w.name)}</dd>
        <dt>Fähigkeiten</dt><dd>${['q', 'e', 'r'].map(k => `<kbd>${k.toUpperCase()}</kbd> ${esc(TECHNIKEN[SPIEL.klasse][k].name)}`).join(' · ')}</dd>
        <dt>Dorf</dt><dd>${dorfBoni.length ? esc(dorfBoni.join(' · ')) : TX('Noch keine Boni. Baue Schmiede, Werkstatt oder Kaserne.')}</dd>
      </dl>
      ${klassenTeil}
      ${steuerungHtml()}
      <div class="knopfreihe">
        <button class="btn" data-a="los">Aufbrechen</button>
        <button class="btn ghost" data-a="zu">Umkehren</button>
      </div>
    </div>`);
  overlay.querySelectorAll('[data-element]').forEach(b => b.addEventListener('click', () => {
    SPIEL.element = b.dataset.element; spielSpeichern(); geraeusch('klick');
    overlay.querySelectorAll('[data-element]').forEach(x => { x.classList.toggle('an', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
  overlay.querySelectorAll('[data-belement]').forEach(b => b.addEventListener('click', () => {
    const bau = SPIEL.gebaeude.find(x => String(x.id) === b.dataset.bau);
    if (bau) bau.element = b.dataset.belement;
    spielSpeichern(); geraeusch('klick');
    overlay.querySelectorAll(`[data-bau="${b.dataset.bau}"]`).forEach(x => { x.classList.toggle('an', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
  overlay.querySelector('[data-a="los"]').addEventListener('click', () => { overlayWeg(); mitLadebild(() => missionStarten(mis.ort)); });
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { overlayWeg(); REISE = null; weltkarteZeigen(); });
}

function steuerungHtml() {
  const K = KLASSEN[SPIEL.klasse];
  const T = TECHNIKEN[SPIEL.klasse];
  const zeilen = istTouch
    ? [[TX('Stick'), TX('laufen')], [TX('Angriff'), TX`${K.angriff}, gedrückt halten für Dauerangriff`], [LADE_NAME[SPIEL.klasse], TX('halten zum Aufladen, loslassen: ') + K.laden], [SPIEL.klasse === 'schatten' ? TX('Sprung') : TX('Rolle'), SPIEL.klasse === 'schatten' ? TX('Phasensprung') : TX('ausweichen, dabei unverwundbar')]]
    : [['WASD', TX('laufen, die Maus zielt')], [TX('Linksklick J'), K.angriff], [TX('Rechtsklick K'), TX('halten und loslassen: ') + K.laden], [TX('Leertaste'), SPIEL.klasse === 'schatten' ? TX('Phasensprung in Laufrichtung') : TX('Ausweichrolle, dabei unverwundbar')]];
  ['q', 'e', 'r'].forEach(k => zeilen.push([istTouch ? T[k].name : k.toUpperCase(), (istTouch ? '' : T[k].name + ': ') + T[k].text + ' ' + TX`(${T[k].mana} Mana)`]));
  if (SPIEL.klasse === 'schatten') zeilen.push([TX('Tipp'), TX('Springst du kurz bevor ein Angriff trifft, ist das ein perfektes Ausweichen. Volle Phase: nächster Angriff x3.')]);
  if (SPIEL.klasse === 'schwert') zeilen.push([istTouch ? TX('Turm') : 'T', TX`Lazi-Turm bauen (${CFG.turm.kosten} Lazi-Teile)`]);
  if (SPIEL.klasse === 'architekt') zeilen.push([istTouch ? TX('Typ') : 'T 1 2 3', TX('Bauwerk wählen')]);
  if (!istTouch) zeilen.push(['F', TX('Waffe aufheben')], ['P', TX('Pause')], ['M', TX('Musik an oder aus')]);
  return '<div class="controls">' + zeilen.map(([k, t]) => `<span>${k.split(' ').map(x => '<kbd>' + esc(x) + '</kbd>').join(' ')}</span><span>${esc(t)}</span>`).join('') + '</div>';
}

// ---------------------------------------------------------------------
// Aufbau der Spielfelder
// ---------------------------------------------------------------------
const HINDERNISSE = [];
let missionSzene = null;   // die Szene der laufenden (oder letzten) Mission
function missionAufbauen() {
  const alt = missionSzene;
  szene = missionSzene = new THREE.Scene();
  szeneEntsorgen(alt);     // z. B. die vorige Runde einer Mission in Runden
  szene.background = new THREE.Color('#0c100e');
  HINDERNISSE.length = 0; ANIM_DEKO.length = 0;
  document.querySelectorAll('#fx .figur-info').forEach(e => e.remove());   // Namensschilder der vorigen Runde
  szene.userData.licht = GRAFIK_STUFE === 'hoch' && !!MIS.nebel;   // Probelauf: echtes Licht zuerst im dunklen Wald
  renderer.shadowMap.enabled = szene.userData.licht;
  MIS.aufbau();
  randHintergrund(MIS.ort);
  if (szene.userData.licht) lichtAnschalten();
}
function aufbauUniversitaet() {

  // Der Hof ist ein Halbkreis vor der Archivtür: Pflaster, darauf Ränge wie in einem Hörsaal, außen eine Hecke mit drei Lücken
  const [hx, hz, hr] = UNI_HOF.halbkreis;
  const boden = malBoden(60, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 1.3) * 0.4 + Math.cos(z * 1.7) * 0.4, d = Math.hypot(x - hx, z - hz);
    if (z < -12) return 'beton';
    if (z < hz + 0.3 && Math.abs(x) < 15) return 'asphalt';
    if (d < hr - 0.2) return Math.abs(((d + 1.4) % 3.2) - 1.6) < 0.18 ? 'beton' : 'asphalt';
    if (d < hr + 0.9 + wob * 0.3) return 'beton';
    if (d > hr + 5 + wob) return 'wald';
    if (Math.abs(x + Math.sin(z * 0.5) * 1.2) < 1.3 && z > 5.5) return 'erde';
    return 'gras';
  }, {
    gras:    ['#3e5a34', '#46643a', '#36502e', '#52703f'],
    wald:    ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    asphalt: ['#4a4a58', '#525264', '#40404e', '#5c5c70'],
    beton:   ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    erde:    ['#6a5038', '#76583e', '#5e4632', '#846446'],
  }, 7);
  // verblasste Spielfeldlinien, Risse mit Gras, Blutflecken der letzten Kämpfe
  const { g, toPx, r } = boden;
  const linie = (x0, z0, x1, z1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0)) * 16;
    for (let s = 0; s <= n; s++) {
      if (r() < 0.35) continue;
      const t = s / n;
      g.fillStyle = r() < 0.6 ? '#9a9068' : '#827a5c';
      g.fillRect(toPx(x0 + (x1 - x0) * t), toPx(z0 + (z1 - z0) * t), 1, 1);
    }
  };
  linie(-8.5, -6, 8.5, -6); linie(0, -6, 0, 4);
  for (let a = 0; a < Math.PI * 2; a += 0.015) { if (r() < 0.35) continue; g.fillStyle = '#9a9068'; g.fillRect(toPx(Math.cos(a) * 2), toPx(-1 + Math.sin(a) * 2), 1, 1); }
  for (let k = 0; k < 40; k++) {
    let x = toPx(-10 + r() * 20), y = toPx(-8.5 + r() * 14);
    let dx = r() < 0.5 ? 1 : -1, dy = r() < 0.5 ? 1 : -1;
    for (let s = 0; s < 30 + r() * 50; s++) {
      g.fillStyle = '#2c2c3a'; g.fillRect(x, y, 1, 1);
      if (r() < 0.2) { g.fillStyle = r() < 0.5 ? '#3e5a34' : '#5a7a40'; g.fillRect(x + 1, y - 1, 1, 2); }
      if (r() < 0.6) x += dx; else y += dy;
      if (r() < 0.1) dx = -dx;
    }
  }
  for (let k = 0; k < 7; k++) {
    const cx = toPx(-9 + r() * 18), cy = toPx(-7 + r() * 12);
    for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? '#4a2228' : '#3a1a20'; g.fillRect(cx + (r() * 8 - 4 | 0), cy + (r() * 5 - 2 | 0), 1, 1); }
  }
  const istGras = (px, py) => boden.artBei(px, py) === 'gras';
  streuGras(boden, istGras, 2600, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  streuBlumen(boden, istGras, 160);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'wald', 1800);
  bodenMesh(boden, 60);

  // Die Schule im Norden, davor die Kellertür
  const schule = figur(BILD.schule, 0);
  stelle(schule, 0, -10.6);

  const deko = (b, x, z, r, schatten) => {
    z = dekoPlatz(b, x, z, r);
    const o = figur(b, schatten === undefined ? (r ? r * 1.1 : 0) : schatten);
    stelle(o, x, z);
    if (r) HINDERNISSE.push({ x, z, r });
    return o;
  };
  deko(BILD.bus, -11.2, 7.2, 0);
  [-13.4, -12.1, -10.8, -9.5].forEach(x => HINDERNISSE.push({ x, z: 6.6, r: 0.75 }));
  deko(BILD.rad, 10.5, -7.9, 0.8);
  deko(BILD.bank, -4, 4.6, 0.55); deko(BILD.bank, 4, 4.6, 0.55);
  deko(BILD.korb, -9.7, -1.2, 0.3); deko(BILD.korb, 9.7, -1.2, 0.3);
  { const a = neueGrafik() ? 5.6 : 4.2; deko(BILD.laterne, -a, -8.2, 0.22); deko(BILD.laterne, a, -8.2, 0.22); } deko(BILD.laterne, 10.5, 2.6, 0.22);
  deko(BILD.tonne, -13.4, -6.4, 0.4); deko(BILD.tonne, 13.6, -4.6, 0.4); deko(BILD.tonne, 7.4, 9.5, 0.4);
  deko(BILD.barrikade, -2.9, -7.4, 0.8); deko(BILD.barrikade, 2.9, -7.4, 0.8);
  // Lazi-Tafeln im Hof: Sie zeigen noch immer die Vorlesung von damals
  animDeko(deko(BILD.laziTafel[0], -7.2, -8.4, 0.5), BILD.laziTafel, 2.5);
  animDeko(deko(BILD.laziTafel[0], 7.6, -8.2, 0.5), BILD.laziTafel, 1.7);
  deko(BILD.laubbaum[0], -13.4, 11.4, 0.6); deko(BILD.laubbaum[1], 13.2, 11.8, 0.6); deko(BILD.laubbaum[2], 12.6, -2.6, 0.6);
  // Hecke entlang des Bogens, mit drei Lücken: Dort kommen sie herein
  const rr = zufall(31);
  for (let a = 0.12; a < Math.PI - 0.1; a += 0.12) {
    if (UNI_LUECKEN.some(l => Math.abs(a - l) < 0.16)) continue;
    const x = hx + Math.cos(a) * (hr + 0.6), z = hz + Math.sin(a) * (hr + 0.6);
    if (Math.abs(x) < FELD.x + 1.5) deko(BILD.busch[Math.floor(a * 10) % 6], x, z, 0, 0.5);
  }
  for (let i = 0; i < 110; i++) {
    const x = -30 + rr() * 60, z = -12 + rr() * 34;
    if (Math.hypot(x - hx, z - hz) < hr + 2.2 || (z < hz + 1 && Math.abs(x) < FELD.x + 1.6)) continue;
    if (Math.abs(x) < 2.4 && z > FELD.zMax) continue;
    deko(rr() < 0.55 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
}

// Der dunkle Wald: Lichtung mit Lagerfeuer, ein Bach mit Furt, Dornen und dichter Wald
const DORNEN = [];
function aufbauWald(hort) {
  const F = FELD;
  DORNEN.length = 0;
  szene.background = new THREE.Color('#06080a');
  const bach = z => 8.6 + Math.sin(z * 0.35) * 1.3;
  F.sperre = (x, z) => x > bach(z) - 1.4;   // Östlich des Bachs erscheint niemand: Von dort führt nur die Furt herüber
  const pfad = (x, z) => Math.abs(z - 4.2 - Math.sin(x * 0.3) * 1.1) < 0.85;
  // Die Lichtung hat keine Ecken: Der Wald greift an manchen Stellen weit hinein
  const rand = [];
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, k = 0.86 + 0.1 * Math.sin(a * 3 + (hort ? 2 : 0.5)) + 0.05 * Math.cos(a * 5); rand.push([Math.cos(a) * F.x * k, Math.sin(a) * F.zMax * k]); }
  F.flaechen = [{ form: rand }];
  const lichtung = (x, z, mal) => imVieleck(rand, x * mal, z * mal);
  const fein = neueGrafik() ? 2 : 1;
  const boden = malBoden(56, 16 * fein, (x, z) => {
    const wob = Math.sin(x * 1.1) * 0.5 + Math.cos(z * 1.4) * 0.5;
    if (!lichtung(x, z, 0.92 - wob * 0.02)) return 'wald';
    if (Math.abs(x - bach(z)) < 0.85) return pfad(x, z) ? 'pfad' : 'wasser';
    if (Math.hypot(x, z * 1.15) < 4 + wob * 0.4) return 'erde';
    if (pfad(x, z)) return 'pfad';
    return 'moos';
  }, {
    moos:   ['#2e4430', '#344c34', '#283c2a', '#3c563a'],
    wald:   ['#121c14', '#162218', '#0e1810', '#1c2a1e'],
    erde:   ['#4a3a2a', '#56442e', '#3e3024', '#604c34'],
    wasser: ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
    pfad:   ['#4a3e2e', '#54462f', '#403426', '#5e4e36'],
  }, hort ? 23 : 13);
  const istMoos = (px, py) => boden.artBei(px, py) === 'moos';
  streuGras(boden, istMoos, 2400 * fein * fein, [['#1e3420', '#4a6a3a'], ['#243c26', '#5a7a44']]);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'wasser', 2200 * fein * fein);
  // Furt aus Brettern über den Bach
  const { g, toPx } = boden;
  if (fein > 1) {
    // Steg: Schatten aufs Wasser, zwei Längsbalken, darauf dunkle Bohlen mit Fugen
    const x0 = toPx(bach(4.2) - 1.35), x1 = toPx(bach(4.2) + 1.35), y0 = toPx(3.4), y1 = toPx(5);
    g.fillStyle = '#0c1a28'; g.fillRect(x0 - 2, y1, x1 - x0 + 4, 8);
    g.fillStyle = '#20120a'; g.fillRect(x0 - 6, y0 - 2, x1 - x0 + 12, y1 - y0 + 6);
    for (let y = y0, n = 0; y < y1; y += 11, n++) {
      g.fillStyle = ['#4a2e18', '#3f2714', '#553620'][n % 3]; g.fillRect(x0 - 4, y, x1 - x0 + 8, 8);
      g.fillStyle = '#6b4728'; g.fillRect(x0 - 4, y, x1 - x0 + 8, 1);
      g.fillStyle = '#1c0f08'; for (let x = x0 + 4 + n * 7 % 19; x < x1; x += 37) g.fillRect(x, y + 2, 5, 1);
    }
    g.fillStyle = '#2c1a0e'; for (const x of [x0 + 2, x1 - 6]) g.fillRect(x, y0 - 2, 4, y1 - y0 + 4);
  } else for (let z = 3.4; z < 5; z += 0.25) { g.fillStyle = Math.round(z * 4) % 2 ? '#6a4628' : '#5a3a20'; g.fillRect(toPx(bach(4.2) - 1.3), toPx(z), toPx(bach(4.2) + 1.3) - toPx(bach(4.2) - 1.3), fein > 1 ? toPx(z + 0.25) - toPx(z) - 1 : 3); }
  if (hort) { g.fillStyle = '#08060a'; for (let i = 0; i < 400; i++) { const a = Math.random() * Math.PI, rr = Math.random() * 3; g.fillRect(toPx(Math.cos(a) * rr * 1.4), toPx(-F.zMax + 1 - Math.sin(a) * rr * 0.6), 2, 2); } }
  bodenMesh(boden, 56);
  // Der Bach versperrt den Weg, außer an der Furt
  for (let z = -F.zMax - 1; z <= F.zMax + 1; z += 0.9) if (!(z > 3.2 && z < 5.2)) HINDERNISSE.push({ x: bach(z), z, r: 0.75 });
  const r = zufall(hort ? 77 : 41);
  const deko = (b, x, z, rad, schatten) => { z = dekoPlatz(b, x, z, rad); const o = figur(b, schatten === undefined ? rad * 1.2 : schatten); stelle(o, x, z); if (rad) HINDERNISSE.push({ x, z, r: rad }); return o; };
  // Bäume auf dem Feld, nicht auf Lichtung, Pfad oder Bach
  for (let i = 0, n = 0; i < 200 && n < 16; i++) {
    const x = -F.x + 1 + r() * (F.x * 2 - 2), z = F.zMin + 1 + r() * (F.zMax - F.zMin - 2);
    if (Math.hypot(x, z) < 6 || pfad(x, z) || Math.abs(x - bach(z)) < 2 || !imFeld(x, z, 1)) continue;
    if (HINDERNISSE.some(h => Math.hypot(h.x - x, h.z - z) < 2.4)) continue;
    deko(r() < 0.6 ? BILD.tanne[n % 3] : BILD.laubbaum[n % 4], x, z, 0.55); n++;
  }
  // Dornenbüsche verlangsamen
  for (let i = 0, n = 0; i < 80 && n < 7; i++) {
    const a = r() * Math.PI * 2, d = 5.5 + r() * 4, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8;
    if (Math.abs(x - bach(z)) < 2 || pfad(x, z)) continue;
    const b = deko(BILD.busch[n % 6], x, z, 0, 0.5);
    b.sprite.material.color.set(0xb080c0);
    DORNEN.push({ x, z, r: 0.9 }); n++;
  }
  // Dichter Wald außen herum
  for (let i = 0; i < 150; i++) {
    const x = -28 + r() * 56, z = -24 + r() * 48;
    if (lichtung(x, z, 0.88)) continue;
    deko(r() < 0.65 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1);
  }
  if (hort) {
    for (let i = 0; i < 7; i++) deko(BILD.tanne[i % 3], -5 + i * 1.6, -F.zMax - 0.6 + (i % 2) * 0.4, 0.5, 1);
  }
}

// ---------------------------------------------------------------------
// Spielstart
// ---------------------------------------------------------------------
// Moderne Grafik: Der Boden einer Karte entsteht beim Start. Damit das nicht als schwarzer Bildschirm wirkt, steht vorher das Ladebild schon sichtbar da.
function mitLadebild(los) {
  const el = document.getElementById('ladebild');
  if (!neueGrafik() || !el) return los();
  el.querySelector('b').textContent = TX('Die Welt entsteht …');
  el.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try { los(); } finally { requestAnimationFrame(() => requestAnimationFrame(() => { el.hidden = true; })); }
  }));
}
function missionStarten(ortId) {
  // ortId ist ein Ort der Weltkarte oder direkt eine Mission (zum Beispiel der Überfall aufs Dorf)
  const ort = ORTE[ortId || 'universitaet'];
  const weiter = RUNDE_WEITER; RUNDE_WEITER = null;
  RUNDE_JETZT = weiter ? weiter.nr : 1;   // für Spielfelder, die sich je Runde ändern (Nullbunker)
  MIS = ort ? MISSIONEN[ortMission(ortId || 'universitaet')] : MISSIONEN[ortId];
  if (MIS.typ === 'verfolgung') { SPIEL.karte.fuchs = false; SPIEL.karte.fuchsTag = SPIEL.tag; }   // Gesehen ist gesehen: Gelingt die Jagd nicht, ist der Fuchs trotzdem weg
  FELD = MIS.feld;
  modusMission();
  missionAufbauen();
  navBauen();
  liedSpielen(MIS.musik);
  const boni = missionsBoni(), K = KLASSEN[SPIEL.klasse], siege = SPIEL.siege || 0;
  G = {
    zustand: 'spiel', zeit: 0, welle: -1, phase: 'leer', schlange: [], spawnT: 0, pauseT: 0, endeT: 0,
    gegner: [], tuerme: [], verbuendete: [], geschosse: [], pfeile: [], granaten: [], beute: [], truhen: [], effekte: [], partikel: [], zahlen: [],
    gold: 0, items: [], teile: SPIEL.klasse === 'schwert' ? boni.startTeile : 0, energie: BESCHWOERUNG.energieMax * 0.6, schrott: BAUEN.startVorrat + boni.startBonus, bauwahl: 'bolzen',
    punkte: 0, siege: 0, frieren: 0, wackeln: 0, truhenZahl: 0, gefunden: [],
    boni, extraMax: boni.extraMax,
    mult: { leben: schwierigkeit().leben * CFG.gegner.leben * (1 + CFG.proSieg.leben * siege + CFG.proEpoche.leben * SPIEL.epoche), schaden: schwierigkeit().schaden * CFG.gegner.schaden * (1 + CFG.proSieg.schaden * siege + CFG.proEpoche.schaden * SPIEL.epoche) },
    extra: Math.floor(siege / 2),
    holzGetragen: 0, holzGesammelt: 0, fleisch: 0, totholzT: 3,
    material: {}, wurf: [], fallen: [], oel: [], faesser: [], flecken: [], spaeter: [], klingen: null, fokus: null, puppe: null, ueberladung: 0, rauch: 0,
    ausItems: { waffe: aktuelleWaffe(), ruestung: ausgeruestet('ruestung'), modul: ausgeruestet('modul') },
  };
  const w = G.ausItems.waffe;
  G.erfahrung = 0;
  G.startOrt = ortId;
  // Runden: Die erste legt fest, ob und wie viele weitere kommen. Jede weitere ist stärker.
  G.runde = weiter ? weiter.nr : 1;
  G.runden = weiter ? weiter.runden : MIS.runden ? MIS.runden() : null;
  if (weiter) {
    Object.assign(G, { gold: weiter.gold, teile: weiter.teile, material: weiter.material, gefunden: weiter.gefunden, punkte: weiter.punkte, siege: weiter.siege, erfahrung: weiter.erfahrung });
    const mal = 1 + RUNDEN.staerker * (weiter.nr - 1);
    G.mult.leben *= mal; G.mult.schaden *= mal;
  }
  const startLeben = weiter ? weiter.leben : REISE && REISE.ort === MIS.ort ? REISE.leben : 1;
  if (neueGrafik()) neuHeldVorladen(bildKlasse(SPIEL.klasse));
  P = Object.assign(figur(neueGrafik() ? neuHeld(bildKlasse(SPIEL.klasse)).vorne.stand() : BILD.held[bildKlasse(SPIEL.klasse)][w.bild].stand, 0.5), {
    art: 'spieler', klasse: SPIEL.klasse, x: MIS.start[0], z: MIS.start[1], blick: 1, r: CFG.spieler.radius,
    phase: hatFaehigkeit('schattenreserve') ? SCHATTEN.phase.max / 2 : 0, sprungZeit: -9, sprungVon: { x: 0, z: 0 }, letztesPerfekt: -9, rollTreffer: null,
    rolleT: 0, rolleCd: 0, rdx: 0, rdz: 0, unverwundbar: 0, angriffCd: 0, combo: 0, comboT: 0, hiebT: 0,
    laedt: false, ladung: 0, laufT: 0, bewegt: false, blitz: 0, kx: 0, kz: 0,
    tcd: { q: 0, e: 0, r: 0 }, zielen: null, sturm: null, regenT: 0,
  });
  spielerWerteSetzen(true);
  P.hp = Math.round(P.maxHp * startLeben); P.mana = P.manaMax * 0.5;
  P.ladeRing = bodenFlaeche(ringGeo, 0x5ff0e0, 0); P.ladeRing.visible = false;

  // Das Ziel, das verteidigt wird: Kellertür, Lagerfeuer oder Karren. Manche Aufträge haben keins.
  const z = MIS.ziel;
  G.tuer = null;
  if (z) {
  const zl = z.leben(), zb = z.bilder ? z.bilder() : null;
  const t = Object.assign(figur(zb ? zb[0] : z.art === 'feuer' ? BILD.feuerGross[0][0] : z.art === 'wagen' ? BILD.wagen[0] : BILD.tuer[0], z.art === 'wagen' ? 1.2 : 0), { art: 'tuer', zielArt: z.art, x: z.x, z: z.art === 'wagen' ? (MIS.wegZ || eskorteZ)(z.x) : z.z, r: z.r, hp: zl, maxHp: zl, blitz: 0, bilder: zb, verlust: z.verlust });
  if (weiter && weiter.zielAnteil !== undefined) t.hp = Math.max(1, Math.round(zl * Math.min(1, weiter.zielAnteil + RUNDEN.heilung)));
  stelle(t, t.x, t.z);
  G.tuer = t;
  }
  if (z && z.art === 'feuer') {
    const t = G.tuer;
    t.sprite.material.color.setScalar(1);   // Das Feuer leuchtet selbst
    t.licht = bodenFlaeche(scheibeGeo, 0xffa040, 0.12); t.licht.position.set(z.x, 0.015, z.z); t.licht.scale.setScalar(5); weichesLicht(t.licht, 1.5);
    t.licht.visible = !szene.userData.licht;   // Bei echtem Licht braucht es den gemalten Schein nicht
    for (let i = 0; i < 4; i++) totholzErstellen();
  }

  if (MIS === MISSIONEN.universitaet) [[-7.5, 1.5], [8.2, -3.4], [3.6, 6.2]].forEach(([x, z]) => fassErstellen(x, z));
  if (!MIS.markt) begleiterAufstellen();
  if (!MIS.markt && !MIS.ueberfall) garageRoboterAufstellen(true);   // Roboter aus der Garage helfen auch auf Missionen
  if (MIS.nachStart) MIS.nachStart();
  // Kräuterbeutel und Ladestation
  G.kraeuterbeutel = (SPIEL.kraeuter || 0) >= KRAEUTER.beutel ? 1 : 0;
  G.emp = MIS.markt ? 0 : Math.min(SPIEL.roboterSchrott || 0, gebaeudeWert('emp') || 0); G.empT = 0;
  if (boni.ladung && !weiter) { G.energie = BESCHWOERUNG.energieMax; G.schrott += 3; }
  missionsUiEinrichten();
  if (MIS.typ) auftragStarten(); else welleStarten(0);
  if (G.runden && !MIS.eigeneRunden) meldung(TX`Runde ${G.runde} von ${G.runden.anzahl}`, G.runde > 1 ? TX('Die Gegner sind stärker geworden.') : G.runden.freiwillig ? TX('Nach dieser Runde kannst du weitermachen oder heimkehren.') : TX('Hier gibt es kein Zurück, bis alles geschafft ist.'), 2400);
  missionHudAktualisieren(true);
  // Die Mission wird im Spielstand vermerkt. Wer neu lädt oder das Spiel schließt, hat sie verloren
  // (siehe abgebrocheneMission). Der Markt ist kein Kampf und zählt nicht.
  if (!weiter && !MIS.markt) {
    SPIEL.laufend = { mission: Object.keys(MISSIONEN).find(k => MISSIONEN[k] === MIS), ort: MIS.ort, tag: SPIEL.tag };
    spielSpeichern();
  }
}

// Beim Laden: Steht noch eine Mission im Spielstand, wurde sie nicht zu Ende gespielt.
// War sie schon gewonnen (Siegbildschirm), zählt der Sieg; sonst zählt sie als verloren, und ein Tag vergeht.
// Ausnahmen: Die Grafik ist ausgefallen, oder der Browser hat den Tab im Hintergrund entladen, um Speicher zu sparen
// (document.wasDiscarded, nur Chrome). Dafür kann der Spieler nichts, die Mission fällt einfach aus.
function abgebrocheneMission() {
  const L = SPIEL && SPIEL.laufend;
  if (!L) return false;
  delete SPIEL.laufend;
  const mis = MISSIONEN[L.mission];
  if (!mis) { spielSpeichern(); return false; }
  if ((L.grafik || document.wasDiscarded) && !L.erg) {
    spielSpeichern();
    meldung(L.grafik ? TX('Mission nach Grafikausfall beendet') : TX('Der Browser hat die Mission beendet'), TX('Das zählt nicht als Niederlage.'), 4000);
    return false;
  }
  MIS = mis; REISE = null; G = null;
  const erg = L.erg || { sieg: false, ort: mis.ort, abgebrochen: true };
  (mis.nachher || rueckkehrInsDorf)(erg);
  return true;
}

// Beschriftungen in HUD und Touch-Knöpfen an die Klasse anpassen
function missionsUiEinrichten() {
  const K = KLASSEN[SPIEL.klasse];
  document.getElementById('klassenLabel').textContent = TX`${K.name} · Stufe ${SPIEL.held.stufe}`;
  document.getElementById('doorLabel').textContent = MIS.ziel ? MIS.ziel.name : '';
  document.querySelector('.bar.door').classList.toggle('feuer', zielArt() === 'feuer');
  document.getElementById('enBar').hidden = SPIEL.klasse !== 'beschwoerer' && SPIEL.klasse !== 'schatten';
  document.getElementById('enText').textContent = SPIEL.klasse === 'schatten' ? TX('Phase') : TX('Energie');
  document.getElementById('resLabel').textContent = { schwert: TX('Teile'), beschwoerer: TX('Energie'), architekt: TX('Schrott'), schatten: TX('Phase') }[SPIEL.klasse];
  const knopf = (act, text) => { const b = document.querySelector(`#tbtns [data-act="${act}"]`); b.textContent = text; b.hidden = !text; };
  knopf('laden', LADE_NAME[SPIEL.klasse]);
  knopf('angriff', { schwert: TX('Schwert'), beschwoerer: TX('Stoß'), architekt: TX('Hammer'), schatten: TX('Dolche') }[SPIEL.klasse]);
  knopf('rolle', SPIEL.klasse === 'schatten' ? TX('Sprung') : TX('Rolle'));
  knopf('turm', SPIEL.klasse === 'schwert' ? TX('Turm') : SPIEL.klasse === 'architekt' ? TX('Typ') : '');
  technikLeisteEinrichten();
  const hinweise = [['WASD', TX('laufen')], [TX('Klick/J'), K.angriff], [TX('Rechtsklick/K'), TX('halten: ') + K.laden], [TX('Leertaste'), SPIEL.klasse === 'schatten' ? TX('Phasensprung') : TX('Rolle')]];
  if (SPIEL.klasse === 'schwert') hinweise.push(['T', TX`Lazi-Turm (${CFG.turm.kosten} Teile)`]);
  if (SPIEL.klasse === 'architekt') hinweise.push(['T/1/2/3', TX('Bauwerk wählen')]);
  hinweise.push(['F', TX('aufheben')], ['P', TX('Pause')], ['M', TX('Musik')]);
  document.getElementById('hint').innerHTML = hinweise.map(([k, t]) => `<span>${k.split('/').map(x => '<kbd>' + esc(x) + '</kbd>').join('/')} ${esc(t)}</span>`).join('');
  klappenEinrichten();
}

// ---------------------------------------------------------------------
// Eingabe in der Mission
// ---------------------------------------------------------------------
const eingabe = { mx: 0, mz: 0, zielart: 'auto', maus: new THREE.Vector3(), mausNdc: new THREE.Vector2(), mausGedrueckt: false, stickX: 0, stickZ: 0, touchAngriff: false };
function imSpiel() { return modus === 'mission' && G && G.zustand === 'spiel'; }

addEventListener('keydown', e => {
  if (modus !== 'mission') return;
  if (e.repeat) return;
  if (e.code === 'KeyP' || e.code === 'Escape') pauseUmschalten();
  if (!imSpiel()) return;
  // Auf dem Markt wird nicht gekämpft: F, E oder Enter spricht mit Ständen und Brettern
  if (MIS.markt) { if (['KeyF', 'KeyE', 'Enter'].includes(e.code)) marktInteragieren(); return; }
  if (e.code === 'Space') rollen();
  if (e.code === 'KeyJ') angreifen();
  if (e.code === 'KeyK') ladenStarten();
  if (e.code === 'KeyQ') technikDrueck('q');
  if (e.code === 'KeyE') technikDrueck('e');
  if (e.code === 'KeyR') technikDrueck('r');
  if (e.code === 'KeyT') aktion();
  if (e.code === 'KeyF') gegenstandAufheben();
  if (SPIEL.klasse === 'architekt' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) bauwerkWaehlen(Object.keys(BAUWERKE)[Number(e.code.slice(5)) - 1]);
});
addEventListener('keyup', e => {
  if (modus !== 'mission') return;
  if (e.code === 'KeyK') ladenLoslassen();
  if (e.code === 'KeyQ') technikLos('q');
  if (e.code === 'KeyE') technikLos('e');
  if (e.code === 'KeyR') technikLos('r');
});
addEventListener('blur', () => {
  eingabe.mausGedrueckt = false;
  if (P && modus === 'mission') ladenLoslassen();
  if (imSpiel()) pauseUmschalten();   // Wer wegklickt, soll beim Zurückkommen da weiterspielen, wo er aufgehört hat
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || modus !== 'mission') return;
  eingabe.zielart = 'maus';
  eingabe.mausNdc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || !imSpiel() || MIS.markt) return;
  eingabe.zielart = 'maus';
  eingabe.mausNdc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (e.button === 0) { eingabe.mausGedrueckt = true; angreifen(); }
  if (e.button === 2) ladenStarten();
});
addEventListener('pointerup', e => {
  if (e.pointerType !== 'mouse') return;
  if (e.button === 0) eingabe.mausGedrueckt = false;
  if (e.button === 2 && modus === 'mission') ladenLoslassen();
});

(function touchSteuerung() {
  const stick = document.getElementById('stick'), knauf = document.getElementById('knob');
  let id = null, cx = 0, cy = 0;
  const bewegen = e => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), max = 46;
    if (d > max) { dx *= max / d; dy *= max / d; }
    knauf.style.transform = `translate(${dx}px, ${dy}px)`;
    eingabe.stickX = dx / max; eingabe.stickZ = dy / max;
  };
  stick.addEventListener('pointerdown', e => {
    id = e.pointerId; stick.setPointerCapture(id);
    const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    bewegen(e);
  });
  const ende = e => { if (e.pointerId !== id) return; id = null; knauf.style.transform = ''; eingabe.stickX = eingabe.stickZ = 0; };
  stick.addEventListener('pointermove', bewegen);
  stick.addEventListener('pointerup', ende); stick.addEventListener('pointercancel', ende);
  document.querySelectorAll('#tbtns .tb').forEach(b => {
    const a = b.dataset.act;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); b.classList.add('on'); eingabe.zielart = 'auto';
      if (!imSpiel()) return;
      if (a === 'angriff') { eingabe.touchAngriff = true; angreifen(); }
      if (a === 'rolle') rollen();
      if (a === 'laden') ladenStarten();
      if (a === 'turm') aktion();
      if (a === 'q' || a === 'e' || a === 'r') technikDrueck(a);
    });
    const los = () => { b.classList.remove('on'); if (a === 'angriff') eingabe.touchAngriff = false; if (a === 'laden') ladenLoslassen(); if (a === 'q' || a === 'e' || a === 'r') technikLos(a); };
    b.addEventListener('pointerup', los); b.addEventListener('pointercancel', los); b.addEventListener('pointerleave', los);
  });
})();

function zielWinkel() {
  if (eingabe.zielart === 'maus') {
    strahl.setFromCamera(eingabe.mausNdc, cam);
    if (strahl.ray.intersectPlane(bodenEbene, eingabe.maus)) return Math.atan2(eingabe.maus.z - P.z, eingabe.maus.x - P.x);
  }
  let best = null, bd = 6;
  for (const e of G.gegner) { const d = abstand(e, P) - e.r; if (d < bd) { bd = d; best = e; } }
  if (best) return Math.atan2(best.z - P.z, best.x - P.x);
  if (eingabe.mx || eingabe.mz) return Math.atan2(eingabe.mz, eingabe.mx);
  return P.blick > 0 ? 0 : Math.PI;
}
// Wohin wird etwas gebaut oder beschworen? Mit Maus: zum Zeiger, sonst vor den Spieler
function bauPunkt(standard) {
  const a = zielWinkel();
  let d = standard;
  if (eingabe.zielart === 'maus') d = Math.min(4, Math.max(1.3, Math.hypot(eingabe.maus.x - P.x, eingabe.maus.z - P.z)));
  return { x: P.x + Math.cos(a) * d, z: P.z + Math.sin(a) * d };
}

// ---------------------------------------------------------------------
// Hilfen: Kollision, Effekte, Zahlen
// ---------------------------------------------------------------------
function begrenzen(o) {
  o.x = Math.max(-FELD.x + o.r, Math.min(FELD.x - o.r, o.x));
  o.z = Math.max(FELD.zMin + o.r * 0.5, Math.min(FELD.zMax - o.r, o.z));
  // Karten aus mehreren Flächen (Rechtecke, Kreise, Halbkreise): in die nächste Fläche zurückschieben
  if (FELD.flaechen) [o.x, o.z] = feldKlemmen(o.x, o.z, o.r);
  // Verwinkelte Karten: alle bleiben auf der Straße
  if (FELD.korridor) {
    const [d, px, pz] = wegNaechster(o.x, o.z, FELD.korridor.weg), max = FELD.korridor.breite - o.r;
    if (d > max && d > 0.0001) { o.x = px + (o.x - px) / d * max; o.z = pz + (o.z - pz) / d * max; }
  }
  const hind = G.tuer ? HINDERNISSE.concat(G.tuerme, [G.tuer]) : HINDERNISSE.concat(G.tuerme);
  for (const h of hind) {
    if (h === o) continue;
    const dx = o.x - h.x, dz = o.z - h.z, d = Math.hypot(dx, dz), min = o.r + h.r;
    if (d < min && d > 0.0001) { o.x = h.x + dx / d * min; o.z = h.z + dz / d * min; }
  }
}
// Flächen eines Spielfelds: [x0, z0, x1, z1] ist ein Rechteck, { kreis: [x, z, r] } ein Kreis,
// { halbkreis: [x, z, r] } ein Halbkreis, der sich vom Mittelpunkt nach Süden (größeres z) öffnet,
// { form: [[x, z], ...] } eine beliebige Form (Vieleck), passend zur Gegend.
function imVieleck(pkte, x, z) {
  let drin = false;
  for (let i = 0, j = pkte.length - 1; i < pkte.length; j = i++) {
    const [xi, zi] = pkte[i], [xj, zj] = pkte[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) drin = !drin;
  }
  return drin;
}
function flaecheKlemmen(f, x, z, r) {
  if (Array.isArray(f)) { const [x0, z0, x1, z1] = f; return [Math.max(x0 + r, Math.min(x1 - r, x)), Math.max(z0 + r * 0.5, Math.min(z1 - r, z))]; }
  if (f.form) {
    // Drinnen und weit genug vom Rand weg: bleibt. Sonst auf den nächsten Randpunkt, um r nach innen versetzt.
    const pk = f.form;
    let best = null, bd = Infinity;
    for (let i = 0, j = pk.length - 1; i < pk.length; j = i++) {
      const [ax, az] = pk[j], [bx, bz] = pk[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(x - qx, z - qz);
      if (d < bd) { bd = d; best = [qx, qz]; }
    }
    if (imVieleck(pk, x, z) && bd >= r) return [x, z];
    // nach innen: vom Randpunkt Richtung Schwerpunkt
    const cx = pk.reduce((s, p) => s + p[0], 0) / pk.length, cz = pk.reduce((s, p) => s + p[1], 0) / pk.length;
    const ix = cx - best[0], iz = cz - best[1], il = Math.hypot(ix, iz) || 1;
    return [best[0] + ix / il * (r + 0.02), best[1] + iz / il * (r + 0.02)];
  }
  const [cx, cz, rad] = f.kreis || f.halbkreis, max = Math.max(0.1, rad - r);
  if (f.halbkreis) z = Math.max(cz + r * 0.5, z);
  const d = Math.hypot(x - cx, z - cz);
  if (d > max) { x = cx + (x - cx) / d * max; z = cz + (z - cz) / d * max; }
  return [x, z];
}
function feldKlemmen(x, z, r) {
  let best = [x, z], bd = Infinity;
  for (const f of FELD.flaechen) {
    const q = flaecheKlemmen(f, x, z, r), d = Math.hypot(q[0] - x, q[1] - z);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
// Liegt ein Punkt im Spielfeld? (ohne Flächen: immer)
function imFeld(x, z, rand) {
  if (!FELD.flaechen) return true;
  const q = feldKlemmen(x, z, rand || 0);
  return Math.hypot(q[0] - x, q[1] - z) < 0.01;
}
function platzFrei(p, r) {
  for (const h of HINDERNISSE.concat(G.tuerme, G.tuer ? [G.tuer] : [])) if (Math.hypot(p.x - h.x, p.z - h.z) < r + h.r + 0.1) return false;
  return true;
}
// ---------------------------------------------------------------------
// Wegfindung: Ein Raster über dem Spielfeld merkt sich, wo feste Hindernisse
// stehen (Bach, Mauer, Autos, Bus). Ist der direkte Weg versperrt, sucht A*
// einen Weg drumherum, zum Beispiel über die Furt im Wald.
// ---------------------------------------------------------------------
const NAV = { zelle: 0.5, w: 0, h: 0, x0: 0, z0: 0, frei: null };
function navBauen() {
  const Z = NAV.zelle;
  NAV.x0 = -FELD.x; NAV.z0 = FELD.zMin;
  NAV.w = Math.ceil(2 * FELD.x / Z); NAV.h = Math.ceil((FELD.zMax - FELD.zMin) / Z);
  const n = NAV.w * NAV.h;
  NAV.frei = new Uint8Array(n); NAV.g = new Float32Array(n); NAV.von = new Int32Array(n); NAV.zu = new Uint8Array(n);
  for (let j = 0; j < NAV.h; j++) for (let i = 0; i < NAV.w; i++) {
    const x = NAV.x0 + (i + 0.5) * Z, z = NAV.z0 + (j + 0.5) * Z;
    const raus = (FELD.korridor && wegNaechster(x, z, FELD.korridor.weg)[0] > FELD.korridor.breite - 0.3) || !imFeld(x, z, 0.25);
    NAV.frei[j * NAV.w + i] = raus || HINDERNISSE.some(h => Math.hypot(h.x - x, h.z - z) < h.r + 0.25) ? 0 : 1;
  }
}
function navZelle(x, z) {
  const i = Math.max(0, Math.min(NAV.w - 1, Math.floor((x - NAV.x0) / NAV.zelle)));
  const j = Math.max(0, Math.min(NAV.h - 1, Math.floor((z - NAV.z0) / NAV.zelle)));
  return j * NAV.w + i;
}
function navFrei(x, z) { return !NAV.frei || NAV.frei[navZelle(x, z)] === 1; }
// Ist die gerade Linie frei von festen Hindernissen?
function sichtFrei(ax, az, bx, bz) {
  if (!NAV.frei) return true;
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.3);
  for (let k = 1; k < n; k++) { const t = k / n; if (!navFrei(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
  return true;
}
// Die nächste freie Zelle (falls jemand gerade an einem Hindernis klebt)
function navFreieZelle(c) {
  if (NAV.frei[c]) return c;
  const ci = c % NAV.w, cj = (c / NAV.w) | 0;
  for (let r = 1; r <= 5; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = ci + di, j = cj + dj;
    if (i >= 0 && j >= 0 && i < NAV.w && j < NAV.h && NAV.frei[j * NAV.w + i]) return j * NAV.w + i;
  }
  return -1;
}
// A* auf dem Raster. Gibt eine Liste von Wegpunkten zurück (ohne Start).
function navPfad(ax, az, bx, bz) {
  const { w, frei, g, von, zu } = NAV;
  const s = navFreieZelle(navZelle(ax, az)), t = navFreieZelle(navZelle(bx, bz));
  if (s < 0 || t < 0) return null;
  g.fill(Infinity); zu.fill(0);
  const ti = t % w, tj = (t / w) | 0;
  const h = c => { const dx = Math.abs(c % w - ti), dz = Math.abs(((c / w) | 0) - tj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  const heap = [[h(s), s]];
  const push = e => { heap.push(e); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  g[s] = 0; von[s] = -1;
  let schritte = 0, gefunden = false;
  while (heap.length && schritte++ < 9000) {
    const [, c] = pop();
    if (zu[c]) continue;
    if (c === t) { gefunden = true; break; }
    zu[c] = 1;
    const ci = c % w, cj = (c / w) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= w || j >= NAV.h) continue;
      const n = j * w + i;
      if (!frei[n] || zu[n]) continue;
      // Keine Ecken abschneiden
      if (di && dj && (!frei[cj * w + i] || !frei[j * w + ci])) continue;
      const ng = g[c] + (di && dj ? 1.414 : 1);
      if (ng < g[n]) { g[n] = ng; von[n] = c; push([ng + h(n), n]); }
    }
  }
  if (!gefunden) return null;
  const pfad = [];
  for (let c = t; c !== s && c >= 0; c = von[c]) pfad.push({ x: NAV.x0 + (c % w + 0.5) * NAV.zelle, z: NAV.z0 + (((c / w) | 0) + 0.5) * NAV.zelle });
  return pfad.reverse();
}
// Wohin soll o als Nächstes laufen, um zu (zx, zz) zu kommen? Gibt die Richtung zurück.
function wegRichtung(o, zx, zz, dt) {
  if (!NAV.frei || sichtFrei(o.x, o.z, zx, zz)) { o.pfad = null; return [zx - o.x, zz - o.z]; }
  o.pfadT = (o.pfadT || 0) - dt;
  const ende = o.pfad && o.pfad[o.pfad.length - 1];
  if (!o.pfad || !o.pfad.length || o.pfadT <= 0 || (ende && Math.hypot(ende.x - zx, ende.z - zz) > 2)) {
    o.pfad = navPfad(o.x, o.z, zx, zz); o.pfadT = 0.8 + Math.random() * 0.4;
    if (!o.pfad) return [zx - o.x, zz - o.z];
  }
  // Erreichte Punkte abhaken und Abkürzungen nehmen, wenn die Sicht frei ist
  while (o.pfad.length > 1 && (Math.hypot(o.pfad[0].x - o.x, o.pfad[0].z - o.z) < 0.45 || sichtFrei(o.x, o.z, o.pfad[1].x, o.pfad[1].z))) o.pfad.shift();
  const p = o.pfad[0];
  if (!p) return [zx - o.x, zz - o.z];
  return [p.x - o.x, p.z - o.z];
}
function wackeln(s) { if (OPT.wackeln) G.wackeln = Math.max(G.wackeln, s); }
function zahl(x, y, z, text, klasse) {
  if (!OPT.zahlen && klasse !== 'perfekt') return;
  const el = document.createElement('div');
  el.className = 'dmg ' + (klasse || ''); el.textContent = text;
  document.getElementById('fx').append(el);
  G.zahlen.push({ el, x: x + zz(-0.2, 0.2), y, z, t: 0, life: 0.8 });
}
function partikel(x, y, z, farbe, n, tempo) {
  tempo = tempo || 4;
  if (G.partikel.length > 380) n = Math.min(n, 1);
  if (G.partikel.length > 460) return;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: farbe }));
    s.scale.set(PX * 2, PX * 2, 1); szene.add(s);
    const a = Math.random() * Math.PI * 2, v = zz(0.4, 1) * tempo;
    G.partikel.push({ sprite: s, x, y, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: zz(2, 5), t: 0, life: zz(0.3, 0.6) });
  }
}
// Schwebende Teilchen ohne Schwerkraft, die verblassen (Staub, Glitzern, Blätter)
function schwebeTeilchen(x, y, z, farbe, groesse, vx, vy, vz, life, deck) {
  if (G.partikel.length > 300) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: farbe, transparent: true, opacity: deck || 0.75, depthWrite: false }));
  s.scale.set(PX * groesse, PX * groesse, 1); szene.add(s);
  const p = { sprite: s, x, y, z, vx, vz, vy, t: 0, life, rauch: true, deck: deck || 0.75, gross: PX * groesse };
  G.partikel.push(p); return p;
}
// Mehr Leben in Missionen: Staub unter den Füßen, fallende Blätter an Bäumen in der Nähe
function missionLeben(dt) {
  G.staubT = (G.staubT || 0) - dt;
  if (P.bewegt && P.hp > 0 && G.staubT <= 0 && !(P.rolleT > 0)) {
    G.staubT = 0.2;
    const st = schwebeTeilchen(P.x + zz(-0.2, 0.2), 0.08, P.z + 0.05, 0x6e6450, zz(2, 3), -P.blick * zz(0.1, 0.4), zz(0.2, 0.5), zz(-0.1, 0.1), zz(0.3, 0.5), 0.5);
    if (st) st.schrumpf = true;
  }
  if (!G.baeume) { G.baeume = []; szene.traverse(o => { const m = o.material; if (o.visible && m && m.customProgramCacheKey && /wind/.test(m.customProgramCacheKey())) G.baeume.push(o); }); }
  G.blattT = (G.blattT || 0) - dt;
  if (G.baeume.length && G.blattT <= 0) {
    G.blattT = 0.25;
    const nah = G.baeume.filter(o => Math.abs(o.position.x - P.x) < 11 && Math.abs(o.position.z - P.z) < 8);
    if (nah.length) {
      const o = nah[Math.floor(Math.random() * nah.length)], h = o.scale.y;
      schwebeTeilchen(o.position.x + zz(-0.3, 0.3) * o.scale.x, h * zz(0.45, 0.85), o.position.z + 0.05, [0x6f8a3a, 0x9a8a3a, 0xa8642e][Math.floor(Math.random() * 3)], 3, zz(0.3, 0.8), -zz(0.5, 0.8), zz(-0.1, 0.1), zz(1.6, 2.6), 0.9);
    }
  }
}
// Zickzack-Blitz zwischen zwei Punkten
function blitzLinie(x0, y0, z0, x1, y1, z1, farbe) {
  const pts = [], n = 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n, j = i && i < n ? 0.25 : 0;
    pts.push(new THREE.Vector3(x0 + (x1 - x0) * t + zz(-j, j), y0 + (y1 - y0) * t + zz(-j, j), z0 + (z1 - z0) * t + zz(-j, j)));
  }
  const mat = new THREE.LineBasicMaterial({ color: farbe, transparent: true, depthWrite: false });
  const linie = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  szene.add(linie);
  G.effekte.push({ mesh: linie, mat, t: 0, life: 0.12 });
}
const ringGeo = new THREE.RingGeometry(0.86, 1, 40);
const scheibeGeo = new THREE.CircleGeometry(1, 40);
function bogenTextur(spanne, farbe) {
  const S = 48, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - S / 2, dy = y + 0.5 - S / 2, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (Math.abs(a) > spanne / 2 || r > S / 2 - 1 || r < S / 2 - 8) continue;
    g.fillStyle = r > S / 2 - 3 ? '#ffffff' : farbe; g.fillRect(x, y, 1, 1);
  }
  return textur(c);
}
const HIEB_TEX = [bogenTextur(Math.PI * 0.75, '#bfe8ff'), bogenTextur(Math.PI * 0.75, '#bfe8ff'), bogenTextur(Math.PI * 1.25, '#ffd060')];
const HAMMER_TEX = bogenTextur(Math.PI * 0.8, '#e0b080');
ringGeo.geteilt = scheibeGeo.geteilt = HAMMER_TEX.geteilt = true; HIEB_TEX.forEach(t => { t.geteilt = true; });

// ---------------------------------------------------------------------
// Schaden des Spielers
// ---------------------------------------------------------------------
function schadenMal() {
  const K = KLASSEN[P.klasse];
  const bonus = K.waffenBonus && K.waffenBonus.typen.includes(P.waffe.typ) ? K.waffenBonus.mal : 1;
  return P.schadenWerte * bonus;
}
function spielerSchaden(grund) { return Math.round((grund + P.waffe.schaden + G.boni.schaden) * schadenMal()); }
function helferMal() { return G.boni.turmSchaden * (hatEffekt('golemkraft') ? 1.3 : 1) * (hatFaehigkeit('elementarmeister') ? 1.4 : 1); }

// ---------------------------------------------------------------------
// Angriffe je Klasse
// ---------------------------------------------------------------------
function angreifen() {
  if (P.angriffCd > 0 || P.rolleT > 0 || P.laedt || P.hp <= 0 || P.sturm) return;
  if (P.klasse === 'beschwoerer') return stromstoss();
  if (P.klasse === 'architekt') return hammerschlag();
  if (P.klasse === 'schatten') return dolchwirbel();
  schwerthieb();
}
function schwerthieb() {
  const w = P.waffe;
  P.combo = P.comboT > 0 ? (P.combo + 1) % 3 : 0;
  P.comboT = CFG.schwert.comboFenster;
  P.angriffCd = CFG.schwert.abklingzeit * w.tempo * P.angriffMal * (P.combo === 2 ? 1.7 : 1);
  P.hiebT = 0.14;
  const a = zielWinkel();
  P.blick = Math.cos(a) >= 0 ? 1 : -1;
  P.x += Math.cos(a) * 0.22; P.z += Math.sin(a) * 0.22;
  const finale = P.combo === 2;
  const reichweite = CFG.schwert.reichweite * (finale ? 1.15 : 1) * (w.art === 'langschwert' ? 1.12 : w.art === 'dolch' ? 0.85 : 1);
  const spanne = (finale ? 220 : CFG.schwert.winkel) * Math.PI / 180;
  const schaden = spielerSchaden(CFG.schwert.schaden[P.combo]) * (finale && hatFaehigkeit('henkersschlag') ? 2 : 1);
  const treffer = bogenTreffer(a, reichweite, spanne, schaden, finale ? 7 : 3.5, finale);
  hiebEffekt(a, reichweite, HIEB_TEX[P.combo], P.combo === 1);
  geraeusch('hieb');
  if (treffer) G.frieren = finale ? 0.07 : 0.04;
}
function bogenTreffer(a, reichweite, spanne, schaden, rueck, stark) {
  let treffer = 0;
  for (const e of G.gegner.slice()) {
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 0.001;
    if (d > reichweite + e.r) continue;
    if (Math.abs(winkelDiff(Math.atan2(dz, dx), a)) > spanne / 2 && d > e.r + 0.35) continue;
    gegnerTreffen(e, schaden, dx / d, dz / d, rueck, stark, 'spieler');
    treffer++;
  }
  for (const f of G.faesser) if (f.hp > 0 && abstand(f, P) < reichweite + f.r) fassTreffen(f, hatEffekt('brennen'));
  return treffer;
}
function hiebEffekt(a, reichweite, tex, spiegel) {
  const gruppe = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const ebene = new THREE.Mesh(new THREE.PlaneGeometry(reichweite * 2.1, reichweite * 2.1), mat);
  ebene.rotation.x = -Math.PI / 2;
  if (spiegel) ebene.scale.y = -1;
  gruppe.add(ebene); gruppe.position.set(P.x, 0.05, P.z); gruppe.rotation.y = -a;
  szene.add(gruppe);
  G.effekte.push({ mesh: gruppe, mat, t: 0, life: 0.16, folgen: true });
}

// Golem-Beschwörer: Stromstoß trifft die nächsten Gegner vor ihm
function stromstoss() {
  const w = P.waffe;
  P.angriffCd = STROMSTOSS.abklingzeit * w.tempo * P.angriffMal; P.hiebT = 0.12;
  const a = zielWinkel();
  P.blick = Math.cos(a) >= 0 ? 1 : -1;
  const spanne = STROMSTOSS.winkel * Math.PI / 180;
  const ziele = G.gegner.filter(e => {
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
    return d <= STROMSTOSS.reichweite + e.r && (Math.abs(winkelDiff(Math.atan2(dz, dx), a)) <= spanne / 2 || d < e.r + 0.4);
  }).sort((u, v) => abstand(u, P) - abstand(v, P)).slice(0, STROMSTOSS.ziele + (hatEffekt('kette') ? 1 : 0) + (hatFaehigkeit('ueberladung') ? 2 : 0));
  const sx = P.x + Math.cos(a) * 0.7, sz = P.z + Math.sin(a) * 0.7;
  const schaden = spielerSchaden(STROMSTOSS.schaden);
  ziele.forEach(e => {
    blitzLinie(sx, 1.5, sz, e.x, 0.8, e.z, 0x9ff8ff);
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 1;
    gegnerTreffen(e, schaden, dx / d, dz / d, 1.6, false, 'spieler');
  });
  if (!ziele.length) blitzLinie(sx, 1.5, sz, P.x + Math.cos(a) * STROMSTOSS.reichweite, 0.6, P.z + Math.sin(a) * STROMSTOSS.reichweite, 0x5ff0e0);
  geraeusch('strom');
  if (ziele.length) G.frieren = 0.03;
}

// Architekt: Hammer trifft Gegner und repariert Tür und Bauwerke
function hammerschlag() {
  const w = P.waffe;
  P.angriffCd = HAMMER.abklingzeit * w.tempo * P.angriffMal; P.hiebT = 0.16;
  const schwer = hatFaehigkeit('schwererhammer') ? 1.5 : 1;
  const a = zielWinkel();
  P.blick = Math.cos(a) >= 0 ? 1 : -1;
  const spanne = HAMMER.winkel * Math.PI / 180;
  const treffer = bogenTreffer(a, HAMMER.reichweite, spanne, Math.round(spielerSchaden(HAMMER.schaden) * schwer), 4.5 * schwer, false);
  hiebEffekt(a, HAMMER.reichweite, HAMMER_TEX, false);
  for (const z of [G.tuer, ...G.tuerme].filter(Boolean)) {
    if (z.hp >= z.maxHp || abstand(z, P) > HAMMER.reichweite + z.r) continue;
    const vorher = z.hp; z.hp = Math.min(z.maxHp, z.hp + HAMMER.reparatur * (hatFaehigkeit('notreparatur') ? 3 : 1));
    zahl(z.x, 1.4, z.z, '+' + Math.round(z.hp - vorher), 'heal');
    partikel(z.x, 0.8, z.z, 0xeab03a, 4, 2);
    geraeusch('bauen');
  }
  geraeusch('hieb');
  if (treffer) G.frieren = 0.05;
}

function rollen() {
  if (P.klasse === 'schatten') return phasensprung();
  if (P.rolleCd > 0 || P.rolleT > 0 || P.hp <= 0) return;
  P.rollTreffer = hatFaehigkeit('ausfall') ? new Set() : null;
  P.laedt = false; P.ladung = 0;
  let dx = eingabe.mx, dz = eingabe.mz;
  if (!dx && !dz) { const a = zielWinkel(); dx = Math.cos(a); dz = Math.sin(a); }
  const l = Math.hypot(dx, dz) || 1;
  P.rdx = dx / l; P.rdz = dz / l;
  P.rolleT = CFG.rolle.dauer; P.rolleCd = CFG.rolle.abklingzeit;
  partikel(P.x, 0.1, P.z, 0x7a6a5a, 5, 2);
}

// ---------------------------------------------------------------------
// Aufladen: Wirbelschlag, Golem beschwören oder Bauwerk errichten
// ---------------------------------------------------------------------
function ladeZeit() {
  if (P.klasse === 'schwert') return CFG.wirbel.maxZeit * (hatFaehigkeit('klingensturm') ? 0.6 : 1);
  if (P.klasse === 'beschwoerer') return BESCHWOERUNG.ladezeit;
  if (P.klasse === 'schatten') return SCHATTEN.stoss.ladezeit;
  return BAUEN.ladezeit * (hatEffekt('baumeister') ? 0.6 : 1) * (hatFaehigkeit('schnellbau') ? 0.5 : 1);
}
function ladenStarten() { if (P.rolleT > 0 || P.hp <= 0 || P.laedt || P.sturm) return; P.laedt = true; P.ladung = 0; }
function ladenLoslassen() {
  if (!P || !P.laedt) return;
  P.laedt = false;
  const c = Math.min(1, P.ladung / ladeZeit());
  P.ladung = 0;
  if (!imSpiel()) return;
  if (P.klasse === 'schwert') return wirbelschlag(c);
  if (c < 1) { meldung(P.klasse === 'architekt' ? TX('Halte länger, bis das Bauwerk steht') : TX('Halte länger, bis der Ring voll ist'), null, 1000); return; }
  if (P.klasse === 'schatten') return schattenstoss();
  if (P.klasse === 'beschwoerer') golemBeschwoeren(); else bauwerkErrichten();
}
function wirbelschlag(c) {
  if (c < 0.2) return;
  const radius = CFG.wirbel.radius + CFG.wirbel.radiusBonus * c;
  const schaden = spielerSchaden(CFG.wirbel.schaden + CFG.wirbel.schadenBonus * c);
  let treffer = false;
  for (const e of G.gegner.slice()) {
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 0.001;
    if (d > radius + e.r) continue;
    gegnerTreffen(e, schaden, dx / d, dz / d, 6 + 6 * c, c > 0.9, 'spieler');
    treffer = true;
  }
  const ring = bodenFlaeche(ringGeo, c > 0.95 ? 0xffd060 : 0x5ff0e0, 0.9);
  ring.position.set(P.x, 0.03, P.z); ring.scale.setScalar(0.4);
  G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.25, wachsen: radius });
  wackeln(0.12 + 0.2 * c); geraeusch('hieb');
  if (treffer) G.frieren = 0.06 + 0.05 * c;
}

function aktion() {
  if (P.hp <= 0) return;
  if (P.klasse === 'schwert') return laziTurmBauen();
  if (P.klasse === 'architekt') { const liste = Object.keys(BAUWERKE); return bauwerkWaehlen(liste[(liste.indexOf(G.bauwahl) + 1) % liste.length]); }
  meldung(P.klasse === 'schatten' ? TX('Leertaste: Phasensprung, Rechtsklick halten: Schattenstoß') : TX('Halte Rechtsklick oder K, um einen Golem zu beschwören'), null, 1600);
}

// Schwertkämpfer: Lazi-Turm aus Lazi-Teilen
function laziTurmBauen() {
  const max = CFG.turm.max + G.extraMax + (hatFaehigkeit('turmmeister') ? 1 : 0);
  const kosten = CFG.turm.kosten - (hatFaehigkeit('turmmeister') ? 2 : 0);
  if (G.tuerme.filter(t => !t.dorf && !t.begleiterTurm).length >= max) { meldung(TX`Maximal ${max} Türme`, TX('Die Lazi-Werkstatt im Dorf erlaubt einen mehr'), 1500); return; }
  if (G.teile < kosten) { meldung(TX('Zu wenig Lazi-Teile'), TX`Ein Turm kostet ${kosten} Teile`, 1400); return; }
  const p = bauPunkt(1.6);
  const t = { art: 'turm', typ: 'lazi', x: p.x, z: p.z, r: 0.5 };
  begrenzen(t);
  if (!platzFrei(t, t.r)) { meldung(TX('Hier ist kein Platz'), null, 1000); return; }
  G.teile -= kosten;
  turmAufstellen(t, BILD.turm, CFG.turm.leben);
}
function turmAufstellen(t, bildT, leben) {
  leben = Math.round(leben * (1 + (G.boni.ladung || 0)));
  Object.assign(t, figur(bildT, 0.6), { hp: leben, maxHp: leben, cd: 0.3, blitz: 0 });
  stelle(t, t.x, t.z);
  G.tuerme.push(t);
  partikel(t.x, 0.5, t.z, 0x5ff0e0, 10, 3);
  geraeusch('bauen');
}

// Architekt
function bauwerkWaehlen(typ) {
  if (!typ || !BAUWERKE[typ]) return;
  G.bauwahl = typ; geraeusch('klick');
  meldung(BAUWERKE[typ].name, TX`${BAUWERKE[typ].kosten} Schrott · ${BAUWERKE[typ].text}`, 1300);
}
function bauwerkKosten(typ) { return Math.max(1, BAUWERKE[typ].kosten - (hatEffekt('baumeister') ? 1 : 0) - (hatFaehigkeit('sparsam') ? 1 : 0)); }
function bauwerkErrichten() {
  const typ = G.bauwahl, d = BAUWERKE[typ], max = BAUEN.max + G.extraMax + (hatFaehigkeit('grossbaustelle') ? 2 : 0);
  if (G.tuerme.filter(t => t.typ !== 'feuerballiste' && !t.dorf && !t.begleiterTurm).length >= max) { meldung(TX`Maximal ${max} Bauwerke`, null, 1300); return; }
  if (G.schrott < bauwerkKosten(typ)) { meldung(TX('Zu wenig Schrott'), TX`${d.name} kostet ${bauwerkKosten(typ)}`, 1300); return; }
  const p = bauPunkt(1.8);
  const t = { art: 'turm', typ, x: p.x, z: p.z, r: d.radius, spott: !!d.spott };
  begrenzen(t);
  if (!platzFrei(t, t.r)) { meldung(TX('Hier ist kein Platz'), null, 1000); return; }
  G.schrott -= bauwerkKosten(typ);
  turmAufstellen(t, BILD.bauwerk[typ], Math.round(d.leben * (hatFaehigkeit('verstaerkt') ? 1.6 : 1)));
}

// ---------------------------------------------------------------------
// Schattenläufer
// ---------------------------------------------------------------------
function phasenMal() {
  if (P.phase < SCHATTEN.phase.max) return 1;
  P.phase = 0;
  partikel(P.x, 1, P.z, 0xc890ff, 14, 4);
  return SCHATTEN.phase.mal;
}
function dolchwirbel() {
  const w = P.waffe, d = SCHATTEN.dolch;
  P.angriffCd = d.abklingzeit * w.tempo * P.angriffMal; P.hiebT = 0.1;
  P.combo = (P.combo + 1) % 2;
  const a = zielWinkel();
  P.blick = Math.cos(a) >= 0 ? 1 : -1;
  P.x += Math.cos(a) * 0.12; P.z += Math.sin(a) * 0.12;
  const imBogen = G.gegner.some(e => abstand(e, P) <= d.reichweite + e.r);
  const mal = imBogen ? phasenMal() : 1;
  const treffer = bogenTreffer(a, d.reichweite, d.winkel * Math.PI / 180, spielerSchaden(d.schaden) * mal, mal > 1 ? 6 : 1.5, mal > 1);
  hiebEffekt(a, d.reichweite, mal > 1 ? HIEB_TEX[2] : HIEB_TEX[P.combo], P.combo === 1);
  geraeusch('hieb');
  if (treffer) G.frieren = mal > 1 ? 0.1 : 0.025;
}
function phasensprung() {
  if (P.rolleCd > 0 || P.hp <= 0) return;
  P.laedt = false; P.ladung = 0;
  let dx = eingabe.mx, dz = eingabe.mz;
  if (!dx && !dz) { const a = zielWinkel(); dx = Math.cos(a); dz = Math.sin(a); }
  const l = Math.hypot(dx, dz) || 1, weite = SCHATTEN.sprung.weite * (hatFaehigkeit('langersprung') ? 1.4 : 1);
  P.sprungVon = { x: P.x, z: P.z }; P.sprungZeit = G.zeit;
  partikel(P.x, 1, P.z, 0x5a2a8a, 10, 3);
  if (hatFaehigkeit('nachbild')) {
    const n = Object.assign(figur(BILD.held.schatten.dolche.stand, 0), { art: 'nachbild', x: P.x, z: P.z, r: 0.4, hp: 40, maxHp: 40, blick: P.blick, rest: 2, spott: true, hiebT: 0, bewegt: false, blitz: 0 });
    n.sprite.material.transparent = true; n.sprite.material.opacity = 0.45; n.sprite.material.color.set(0xa080ff);
    zeige(n, BILD.held.schatten.dolche.stand, P.blick); stelle(n, n.x, n.z);
    G.verbuendete.push(n);
  }
  P.x += dx / l * weite; P.z += dz / l * weite;
  begrenzen(P);
  P.unverwundbar = SCHATTEN.sprung.unverwundbar; P.rolleCd = SCHATTEN.sprung.abklingzeit;
  P.blick = dx >= 0 ? 1 : -1;
  partikel(P.x, 1, P.z, 0xc890ff, 10, 3);
  geraeusch('strom');
}
// Prüft, ob ein Angriff gerade die Stelle getroffen hätte, von der der Schattenläufer weggesprungen ist
function perfektPruefen(x, z, reichweite) {
  if (P.klasse !== 'schatten' || G.zeit - P.sprungZeit > SCHATTEN.perfekt.fenster) return false;
  if (Math.hypot(x - P.sprungVon.x, z - P.sprungVon.z) > reichweite) return false;
  perfektesAusweichen();
  return true;
}
function perfektesAusweichen() {
  if (G.zeit - P.letztesPerfekt < 0.25) return;
  P.letztesPerfekt = G.zeit;
  P.phase = Math.min(SCHATTEN.phase.max, P.phase + SCHATTEN.perfekt.phase);
  zahl(P.x, 2.6, P.z, P.phase >= SCHATTEN.phase.max ? TX('Phase voll!') : TX('Perfekt!'), 'perfekt');
  partikel(P.x, 1, P.z, 0xc890ff, 12, 4);
  geraeusch('teil');
  G.frieren = 0.08;
  if (hatFaehigkeit('zeitriss')) for (const e of G.gegner) e.langsam = 2;
}
function schattenstoss() {
  const a = zielWinkel(), s = SCHATTEN.stoss;
  const x0 = P.x, z0 = P.z;
  P.x += Math.cos(a) * s.weite; P.z += Math.sin(a) * s.weite;
  begrenzen(P);
  P.unverwundbar = 0.3; P.blick = Math.cos(a) >= 0 ? 1 : -1;
  const mal = phasenMal();
  const lx = P.x - x0, lz = P.z - z0, ll = lx * lx + lz * lz || 1;
  for (const e of G.gegner.slice()) {
    const t = Math.max(0, Math.min(1, ((e.x - x0) * lx + (e.z - z0) * lz) / ll));
    if (Math.hypot(e.x - (x0 + lx * t), e.z - (z0 + lz * t)) < e.r + 0.8) gegnerTreffen(e, spielerSchaden(s.schaden) * mal, Math.cos(a), Math.sin(a), 5, true, 'spieler');
  }
  for (let i = 0; i <= 8; i++) partikel(x0 + lx * i / 8, 0.8, z0 + lz * i / 8, mal > 1 ? 0xffd060 : 0x8a4ac8, 2, 1.5);
  wackeln(0.15); geraeusch('hieb');
  G.frieren = 0.06;
}

// Erfahrung während der Mission: Stufenaufstieg sofort melden
function erfahrungSammeln(n) {
  G.erfahrung += n;
  const neu = erfahrungGeben(n);
  if (neu) {
    meldung(TX`Stufe ${SPIEL.held.stufe}!`, TX('Verteile deine Punkte im Dorf unter „Held“'), 2200);
    geraeusch('sieg');
    document.getElementById('klassenLabel').textContent = TX`${KLASSEN[P.klasse].name} · Stufe ${SPIEL.held.stufe}`;
  }
}

// Golem-Beschwörer
function golemBeschwoeren() {
  const max = golemMax();
  const belegt = G.verbuendete.filter(v => v.art === 'golem').reduce((n, g) => n + (g.plaetze || 1), 0);
  if (belegt >= max) { meldung(TX`Maximal ${max} Golems gleichzeitig`, TX('Ein Riesengolem belegt zwei Plätze'), 1300); return; }
  if (G.energie < BESCHWOERUNG.kosten) { meldung(TX('Zu wenig Energie'), TX('Sie lädt sich von selbst wieder auf'), 1300); return; }
  G.energie -= BESCHWOERUNG.kosten;
  const g = golemErstellen(bauPunkt(1.5), 1);
  partikel(g.x, 0.8, g.z, new THREE.Color(g.el.farbe).getHex(), 16, 4);
  geraeusch('beschwoeren');
}
// mal: wie viel stärker als ein normaler Golem (Riesengolem: 3)
function golemErstellen(p, mal) {
  const el = ELEMENTE[SPIEL.element] || ELEMENTE.metall, zaeh = hatFaehigkeit('zaehegolems') ? 1.5 : 1;
  const bilder = mal > 1 ? BILD.riesengolem[SPIEL.element] : BILD.kleingolem[SPIEL.element];
  const g = Object.assign(figur(bilder[0], mal > 1 ? 0.85 : 0.55), {
    art: 'golem', element: SPIEL.element, el, bilder, mal, x: p.x, z: p.z, r: 0.45, blick: P.blick,
    hp: Math.round(el.leben * zaeh * mal * (1 + (G.boni.ladung || 0))), maxHp: Math.round(el.leben * zaeh * mal * (1 + (G.boni.ladung || 0))),
    cd: 0.3, hiebT: 0, laufT: 0, bewegt: false, blitz: 0, rest: BESCHWOERUNG.lebensdauer * zaeh, spott: !!el.spott,
  });
  begrenzen(g);
  G.verbuendete.push(g);
  return g;
}

// ---------------------------------------------------------------------
// Schaden an Spieler, Turm, Tür und Verbündeten
// ---------------------------------------------------------------------
// von: der Gegner, der getroffen hat (für Blutsauger und Dornen)
function schadenAn(ziel, n, vonX, vonZ, von) {
  n = Math.round(n * G.mult.schaden * (ziel.art === 'tuer' ? CFG.kellertuer.schadenMal : 1));
  if (von && von.def && von.def.roboter && stoerWert()) n = Math.round(n * (1 - 0.1 * stoerWert()));   // Störsender: Maschinen verlieren den Takt
  if (von && von.elite === 'vampirisch' && von.hp > 0) { von.hp = Math.min(von.maxHp, von.hp + n * 0.5); partikel(von.x, 1, von.z, 0xd04060, 3, 2); }
  if (ziel.art === 'spieler') return spielerTreffen(n, vonX, vonZ, von);
  if (ziel.hp <= 0) return;
  if (ziel.ausweichen && Math.random() < ziel.ausweichen) { zahl(ziel.x, 1.8, ziel.z, TX('Ausgewichen'), 'block'); return; }
  if (ziel.schild > 0) n = Math.max(1, Math.round(n * BEGLEITER_FAEHIG.waechter[0].schutz));
  ziel.hp -= n; ziel.blitz = 0.1;
  zahl(ziel.x, ziel.art === 'tuer' ? 1.2 : 1.8, ziel.z, '-' + n, 'hurt');
  if (ziel.art === 'tuer') {
    wackeln(0.08);
    if (ziel.hp <= 0) { partikel(ziel.x, 0.6, ziel.z, 0x68728e, 20, 5); verloren(ziel.verlust || (ziel.zielArt === 'feuer' ? TX('Das Feuer ist erloschen') : ziel.zielArt === 'wagen' ? TX('Der Karren ist zerstört') : TX('Die Tür ist gefallen'))); }
    return;
  }
  if (ziel.hp > 0) return;
  if (ziel.art === 'turm') {
    G.tuerme.splice(G.tuerme.indexOf(ziel), 1); entfernen(ziel); infoWeg(ziel);
    partikel(ziel.x, 0.6, ziel.z, 0x77768e, 14, 4);
    if (ziel.begleiterTurm) { begleiterTurmWeg(ziel); meldung(TX`${ziel.name} ist zerstört`, null, 1200); return; }
    meldung(ziel.typ === 'lazi' ? TX('Ein Lazi-Turm ist eingestürzt') : ziel.typ === 'feuerballiste' ? TX('Die Feuerballiste ist zerstört') : ziel.typ === 'wachturm' ? TX('Ein Wachturm ist gefallen') : TX`${BAUWERKE[ziel.typ].name} zerstört`, null, 1400);
  } else verbuendeterWeg(ziel, true);
}
function verbuendeterWeg(v, gefallen) {
  const i = G.verbuendete.indexOf(v);
  if (i < 0) return;
  G.verbuendete.splice(i, 1); entfernen(v); infoWeg(v);
  partikel(v.x, 0.8, v.z, v.art === 'golem' ? new THREE.Color(v.el.farbe).getHex() : v.art === 'puppe' ? 0xdcaa3e : 0x2e4a88, 12, 4);
  if (gefallen && v.art === 'soldat') meldung(TX('Dein Wachsoldat ist gefallen'), null, 1400);
  if (gefallen && v.art === 'begleiter') meldung(TX`${v.name} ist verwundet`, TX('und schleppt sich aus dem Kampf'), 1600);
  if (gefallen && v.art === 'roboter') roboterVerloren(v);
  if (v === G.puppe) G.puppe = null;
}
function spielerTreffen(n, vonX, vonZ, von) {
  if (P.rolleT > 0 || P.unverwundbar > 0 || P.hp <= 0) {
    if (P.klasse === 'schatten' && G.zeit - P.sprungZeit < SCHATTEN.perfekt.fenster) perfektesAusweichen();
    return;
  }
  if (Math.random() * 100 < P.ausweichen) { zahl(P.x, 2.4, P.z, TX('Ausgewichen'), 'block'); P.unverwundbar = 0.25; return; }
  if (hatFaehigkeit('schildwall')) n = Math.max(1, Math.round(n * 0.8));
  n = Math.max(1, Math.round(n * (1 - P.ruestung / 100)));
  if (von && hatEffekt('dornen') && von.hp > 0) gegnerTreffen(von, Math.ceil(n * 0.3), 0, 0, 0, false, 'zustand');
  if (G.rauch > 0) { G.rauch = 0; P.ausDemRauch = false; }
  P.hp = Math.max(0, P.hp - n);
  P.unverwundbar = 0.6; P.blitz = 0.12;
  const dx = P.x - vonX, dz = P.z - vonZ, d = Math.hypot(dx, dz) || 1;
  P.kx += dx / d * 6; P.kz += dz / d * 6;
  zahl(P.x, 2.2, P.z, '-' + n, 'hurt');
  wackeln(0.25); geraeusch('schaden');
  partikelRichtung(P.x, 1, P.z, dx / d, dz / d, 0xa01828, 6, 3);
  if (Math.random() < 0.5) fleck(P.x, P.z, 'blut');
  P.laedt = false; P.ladung = 0; P.zielen = null;
  if (P.hp <= 0) verloren(TX('Du bist gefallen'));
  else kraeuterbeutelPruefen();
}
function heilen(n) {
  if (n <= 0 || P.hp <= 0) return;
  const vorher = P.hp; P.hp = Math.min(P.maxHp, P.hp + n);
  if (P.hp - vorher >= 1) zahl(P.x, 2.4, P.z, '+' + Math.round(P.hp - vorher), 'heal');
}

// ---------------------------------------------------------------------
// Gegner
// ---------------------------------------------------------------------
function spawnPunkt() {
  // Feste Zugänge (Straßenenden), sonst der Rand; auf Karten mit Flächen immer hinein in die Fläche
  if (FELD.zugaenge) { const [x, z] = FELD.zugaenge[Math.floor(Math.random() * FELD.zugaenge.length)], q = [x + zz(-1.2, 1.2), z + zz(-1.2, 1.2)]; return FELD.flaechen ? feldKlemmen(q[0], q[1], 0.6) : q; }
  if (FELD.flaechen) { const [x, z] = randPunkt(); return feldKlemmen(x, z, 0.6); }
  return randPunkt();
}
function randPunkt() {
  if (zielArt() === 'feuer') {
    // Im Wald kommen sie von überall aus der Dunkelheit
    const a = Math.random() * Math.PI * 2;
    const x = Math.cos(a) * (FELD.x - 0.8), z = Math.max(FELD.zMin + 0.6, Math.min(FELD.zMax - 0.6, Math.sin(a) * FELD.zMax));
    return FELD.sperre && FELD.sperre(x, z) ? [-Math.abs(x), z] : [x, z];
  }
  const seite = Math.random();
  if (seite < 0.5) return [zz(-FELD.x + 1, FELD.x - 1), FELD.zMax - 0.5];
  const x = seite < 0.75 ? -FELD.x + 0.6 : FELD.x - 0.6;
  return [x, zz(-2, FELD.zMax - 1)];
}
function gegnerErstellen(typ, x, z) {
  const def = GEGNER[typ];
  if (x === undefined) {
    let t = 0;
    do { [x, z] = spawnPunkt(); t++; } while (Math.hypot(x - P.x, z - P.z) < 6 && t < 20);
  }
  const bilder = BILD[def.bild];
  // Bosse wachsen nur halb so stark mit, sonst werden sie zu Schwämmen
  const maxHp = Math.round(def.leben * (def.boss ? 1 + (G.mult.leben - 1) * 0.5 : G.mult.leben));
  const e = Object.assign(figur(bilder[0], def.radius * 1.2), {
    typ, def, bilder, x, z, r: def.radius * (neueGrafik() && (def.boss || typ === 'herdenlaeufer' || typ === 'thronlaeufer') ? 1.3 : 1), hp: maxHp, maxHp,
    zustand: 'jagen', t: 0, blick: 1, kx: 0, kz: 0, blitz: 0, langsam: 0, laufT: Math.random(), ax: 0, az: 0, getroffen: false, gerufen: false, aggro: 0, ziel: null,
    zs: {}, schild: def.schild || 0, buff: 0,
  });
  if (!def.boss) {
    const hg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x1d1328 }));
    const vg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xd04040 }));
    hg.center.set(0, 0); vg.center.set(0, 0); hg.visible = vg.visible = false;
    szene.add(hg); szene.add(vg);
    e.balkenH = hg; e.balkenV = vg; e.extra = [hg, vg];
  }
  const warn = new THREE.Sprite(new THREE.SpriteMaterial({ map: BILD.ausruf.r, alphaTest: 0.5 }));
  warn.center.set(0.5, 0); warn.scale.set(BILD.ausruf.w * PX, BILD.ausruf.h * PX, 1); warn.visible = false;
  szene.add(warn); e.warn = warn; (e.extra = e.extra || []).push(warn);
  eliteWuerfeln(e);
  G.gegner.push(e);
  partikel(x, 0.4, z, 0x2a2420, 6, 2);
  return e;
}

function gegnerBesiegt(e) {
  const i = G.gegner.indexOf(e);
  if (i < 0) return;
  // Der Fuchs gibt nicht beim ersten Mal auf: Er rappelt sich auf und sprintet ein letztes Mal los
  if (e.def.flieht && !e.zweiteLuft) {
    e.zweiteLuft = true; e.hp = Math.round(e.maxHp * 0.3); e.letzteHp = e.hp; e.sprintT = 2.2; e.rauchT = 1.4; e.keuchT = 0;
    zahl(e.x, 2.6, e.z, TX('Noch nicht!'), 'big'); meldung(TX('Der Fuchs rappelt sich auf'), TX('Ein letzter Sprint. Jetzt oder nie!'), 2000);
    return;
  }
  G.gegner.splice(i, 1);
  entfernen(e);
  infoWeg(e);
  if (e.tele) { szene.remove(e.tele); szene.remove(e.teleRing); e.tele = null; }
  // Bomben: wer brennt, explodiert. Brandstifter lassen sonst ihr Öl fallen.
  if (e.nemesis) G.nemesisErgebnis = 'tot';
  if (e.def.bombe && e.zustand === 'zuenden') explosion(e.x, e.z, e.def.bombe, e.def.schaden * G.mult.schaden, { feindlich: true, brand: e.typ === 'brandstifter' || e.typ === 'eiferer', ausser: e });
  else if (e.typ === 'brandstifter' || e.typ === 'eiferer') oelPfuetze(e.x, e.z, 1.3, e.typ === 'eiferer');
  else if (e.typ === 'funkenkaefer') { partikel(e.x, 0.5, e.z, 0xffe060, 12, 5); geraeusch('strom'); }
  if (e.typ === 'brandstifter' && e.zustand === 'zuenden') oelPfuetze(e.x, e.z, 1.5, true);
  if (e.elite === 'explosiv') {
    const x = e.x, z = e.z, ring = bodenFlaeche(scheibeGeo, 0xff7a30, 0.3);
    ring.position.set(x, 0.025, z); ring.scale.setScalar(1.9);
    spaeter(0.7, () => { szene.remove(ring); explosion(x, z, 1.9, 16 * G.mult.schaden, { feindlich: true }); });
  }
  if (G.fokus && G.fokus.e === e) fokusEntfernen();
  if (e.def.objekt) objektZerstoert(e);
  if (e.def.objekt || e.def.stationaer) { partikel(e.x, 1, e.z, 0x8a4e30, 16, 4); }
  else if (!e.def.roboter) { for (let k = 0; k < 3; k++) fleck(e.x + zz(-0.6, 0.6), e.z + zz(-0.4, 0.4), 'blut'); }
  else fleck(e.x, e.z, 'oel');
  G.siege++; G.punkte += e.def.punkte;
  G.schrott += BAUEN.proSieg;
  if (hatFaehigkeit('zweiteratem')) heilen(3);
  erfahrungSammeln(Math.ceil(e.def.punkte / 2) * STUFEN.proSieg);
  partikel(e.x, 0.6, e.z, 0x1d1328, 8, 4);
  partikel(e.x, 0.6, e.z, e.def.boss ? 0x5ff0e0 : 0x8a2a30, e.def.boss ? 24 : 5, 5);
  const gold = zzGanz(e.def.gold[0], e.def.gold[1]);
  const muenzen = Math.min(gold, e.def.boss ? 12 : 4);
  for (let k = 0; k < muenzen; k++) beuteErstellen('gold', e.x, e.z, Math.round(gold / muenzen));
  if (Math.random() < e.def.teilChance) beuteErstellen('teil', e.x, e.z, e.def.boss ? 4 : 1);
  if (Math.random() < CFG.brotChance) beuteErstellen('brot', e.x, e.z, CFG.brotHeilung);
  if (e.def.fleisch && Math.random() < e.def.fleisch) beuteErstellen('fleisch', e.x, e.z, e.def.miniboss ? 4 : 1);
  if (zielArt() === 'feuer' && e.typ === 'pluenderer' && Math.random() < 0.5) beuteErstellen('holz', e.x, e.z, 1);
  materialFallen(e);
  if (e.def.boss || e.def.miniboss) gegenstandAblegen(beuteWuerfeln('boss'), e.x + 0.8, e.z);
  else if (e.elite && Math.random() < BEUTE.eliteItemChance) gegenstandAblegen(beuteWuerfeln('elite'), e.x + 0.6, e.z);
  anzeigeWeg(e);
  if (e.def.boss) { wackeln(0.6); G.frieren = 0.15; geraeusch('explosion'); }
}

function naechster(e, liste, r) {
  let b = null, bd = r;
  for (const x of liste) { const d = abstand(e, x); if (d < bd) { bd = d; b = x; } }
  return b;
}
function zielFuer(e) {
  // Die Köderpuppe zieht alle Gegner in der Nähe an
  if (G.puppe && G.puppe.hp > 0 && abstand(e, G.puppe) < G.puppe.T.radius) return G.puppe;
  // Schildwall, Elementturm und Barrikade der Begleiter
  const koeder = koederFuer(e);
  if (koeder) return koeder;
  if (P.hp <= 0 || G.rauch > 0) return naechster(e, G.verbuendete, 4) || G.tuer || P;
  if (e.typ === 'golem') return e.aggro > 0 || !G.tuer ? P : G.tuer;
  // Metallgolems und Pfahlwälle ziehen Gegner in der Nähe auf sich
  const spott = naechster(e, G.verbuendete.filter(v => v.spott).concat(G.tuerme.filter(t => t.spott)), 3);
  if (spott) return spott;
  // In der Wartungshalle wollen die Eiferer die kaputten Roboter salben
  if (MIS.typ === 'reparatur' && (e.typ === 'eiferer' || e.typ === 'schildtraeger') && abstand(e, P) > 3) {
    const bot = naechster(e, G.verbuendete.filter(v => v.art === 'roboter' && !v.laeuft), 99);
    if (bot) return bot;
  }
  if (e.typ === 'kaefer' || e.typ === 'schuetze' || e.typ === 'wolf' || e.typ === 'alpha' || e.typ === 'heuler' || e.typ === 'funkenkaefer' || e.typ === 'brandstifter') {
    // Auf der Birkenstraße wittern Wölfe und Brandstifter den Karren
    if (zielArt() === 'wagen' && e.typ !== 'schuetze' && G.tuer && abstand(e, G.tuer) < abstand(e, P) - 1) return G.tuer;
    const v = naechster(e, G.verbuendete, 3);
    return v && abstand(e, v) < abstand(e, P) ? v : P;
  }
  // Plünderer: wer nah ist, wird angegriffen, sonst die Tür
  if (abstand(e, P) < 4) return P;
  return naechster(e, G.verbuendete, 2.5) || naechster(e, G.tuerme, 2.5) || G.tuer || P;
}

function gegnerBewegen(e, dt) {
  const def = e.def;
  e.blitz -= dt; e.aggro -= dt; e.langsam -= dt;
  zustaendeTick(e, dt);
  if (e.hp <= 0) return;
  e.x += e.kx * dt; e.z += e.kz * dt;
  const daempf = Math.exp(-10 * dt); e.kx *= daempf; e.kz *= daempf;
  // Eingefroren oder betäubt: nichts geht
  if (gegnerSteht(e)) { e.bewegt = false; begrenzen(e); return; }
  if (def.objekt) { e.bewegt = false; return; }
  // Eigene Gegner-KI (Kesselwärter, Wartungsroboter). Gibt sie true zurück, ist der Schritt erledigt.
  if (def.eigen && EIGEN_KI[def.eigen] && EIGEN_KI[def.eigen](e, dt)) { begrenzen(e); return; }
  // Der Fuchs klettert über Hindernisse: nur am Feldrand begrenzen
  if (def.flieht) { diebBewegen(e, dt); e.x = Math.max(-FELD.x + e.r, Math.min(FELD.x - e.r, e.x)); e.z = Math.max(FELD.zMin, Math.min(FELD.zMax, e.z)); return; }

  let ziel = e.zustand === 'jagen' ? (e.ziel = zielFuer(e)) : (e.ziel || P);
  if (ziel.hp !== undefined && ziel.hp <= 0 && ziel !== G.tuer) { ziel = e.ziel = G.tuer || P; }
  let dx = ziel.x - e.x, dz = ziel.z - e.z;
  const d = Math.hypot(dx, dz) || 0.001;
  // Steckt der Gegner fest, läuft er eine Weile seitlich am Hindernis vorbei
  const vorX = e.x, vorZ = e.z;
  if (e.umweg > 0) { e.umweg -= dt; const s = e.umwegSeite; const ux = -dz * s, uz = dx * s; dx = dx * 0.3 + ux; dz = dz * 0.3 + uz; }
  const mal = gegnerTempoMal(e);
  const uhr = (e.buff > 0 ? 1.3 : 1) * (e.elite === 'flink' ? 1.35 : 1) * (e.langsam > 0 || e.zs.frost > 0 ? 0.7 : 1);
  e.t -= dt * uhr; e.bewegt = false;
  const tempo = def.tempo * mal;
  const reichweite = def.reichweite + (ziel.r || 0.4);
  const laufen = (rx, rz, f) => { if (def.stationaer) { e.blick = rx >= 0 ? 1 : -1; return; } const l = Math.hypot(rx, rz) || 1; e.x += rx / l * tempo * (f || 1) * dt; e.z += rz / l * tempo * (f || 1) * dt; e.bewegt = true; e.blick = rx >= 0 ? 1 : -1; };

  if (e.zustand === 'jagen') {
    // Trommler und Heuler (mit Rudel) bleiben hinten und treiben die anderen an
    const unterstuetzt = def.abstand && (e.typ === 'trommler' || G.gegner.some(o => o !== e && !o.def.aura && abstand(o, e) < def.aura));
    if (unterstuetzt && P.hp > 0 && d > reichweite) {
      const dp = abstand(e, P), px = P.x - e.x, pz = P.z - e.z;
      if (dp < def.abstand - 0.5) laufen(-px, -pz, 0.9);
      else if (dp > def.abstand + 2) laufen(px, pz);
      else { e.blick = px >= 0 ? 1 : -1; e.trommelT = (e.trommelT || 0) + dt; }
    } else if (def.fernkampf && !def.stationaer && d < 4 && ziel === P) {
      laufen(-dx, -dz);
    } else if (d < reichweite) {
      e.ax = dx / d; e.az = dz / d; e.getroffen = false;
      if (def.bombe) {
        // Brandstifter und Funkenkäfer zünden ihre Ladung
        e.zustand = 'zuenden'; e.t = def.ausholen;
        e.tele = bodenFlaeche(scheibeGeo, 0xff7a30, 0.22); e.tele.position.set(e.x, 0.02, e.z); e.tele.scale.setScalar(0.01);
        e.teleRing = bodenFlaeche(ringGeo, 0xff7a30, 0.8); e.teleRing.position.set(e.x, 0.025, e.z); e.teleRing.scale.setScalar(def.bombe);
        e.warn.visible = true; geraeusch('zuenden');
      } else {
        e.zustand = 'ausholen'; e.t = def.ausholen;
        angriffsAnzeige(e, d);
        e.warn.visible = true;
        if (def.boss) {
          e.tele = bodenFlaeche(scheibeGeo, 0xd04040, 0.18); e.tele.position.set(e.x, 0.02, e.z); e.tele.scale.setScalar(0.01);
          e.teleRing = bodenFlaeche(ringGeo, 0xd04040, 0.75); e.teleRing.position.set(e.x, 0.025, e.z); e.teleRing.scale.setScalar(def.reichweite);
        }
      }
    } else { const [wx, wz] = wegRichtung(e, ziel.x, ziel.z, dt); laufen(wx, wz); }
  } else if (e.zustand === 'zuenden') {
    e.blick = e.ax >= 0 ? 1 : -1;
    if (e.tele) e.tele.scale.setScalar(def.bombe * (1 - Math.max(0, e.t) / def.ausholen));
    if (Math.random() < dt * 20) partikel(e.x, 1.2, e.z, 0xffd060, 1, 2);
    if (e.t <= 0) { e.warn.visible = false; e.hp = 0; gegnerBesiegt(e); return; }
  } else if (e.zustand === 'ausholen') {
    e.blick = e.ax >= 0 ? 1 : -1;
    if (def.fernkampf) { e.ax = dx / d; e.az = dz / d; }
    if (def.boss && e.tele) e.tele.scale.setScalar(def.reichweite * (1 - e.t / def.ausholen));
    if (e.t <= 0) {
      e.warn.visible = false;
      anzeigeWeg(e);
      if (def.sprung) { e.zustand = 'sprung'; e.t = def.sprungZeit || 0.26; }
      else { zuschlagen(e, ziel); e.zustand = 'erholen'; e.t = def.erholung; }
    }
  } else if (e.zustand === 'sprung') {
    e.x += e.ax * (def.sprungTempo || 11) * dt; e.z += e.az * (def.sprungTempo || 11) * dt;
    if (!e.getroffen && P.klasse === 'schatten' && Math.hypot(e.x - P.sprungVon.x, e.z - P.sprungVon.z) < e.r + 0.6 && perfektPruefen(e.x, e.z, 1.5)) e.getroffen = true;
    if (!e.getroffen) {
      for (const z of [P, ...G.verbuendete, ...G.tuerme]) {
        if (z.hp > 0 && abstand(e, z) < e.r + z.r + 0.1 && !(z === P && G.rauch > 0)) { e.getroffen = true; schadenAn(z, def.schaden, e.x, e.z, e); break; }
      }
    }
    if (e.t <= 0) { e.zustand = 'erholen'; e.t = def.erholung; }
  } else if (e.zustand === 'erholen') {
    if (e.t <= 0) e.zustand = 'jagen';
  }

  for (const o of G.gegner) {
    if (o === e) continue;
    const ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz), min = e.r + o.r;
    if (od < min && od > 0.0001) { const s = (min - od) * 0.5; e.x += ox / od * s; e.z += oz / od * s; }
  }
  begrenzen(e);
  if (e.bewegt) {
    e.laufT += dt;
    const geschafft = Math.hypot(e.x - vorX, e.z - vorZ) / (tempo * dt || 1);
    e.fest = geschafft < 0.35 ? (e.fest || 0) + dt : 0;
    if (e.fest > 0.3 && !(e.umweg > 0)) { e.umweg = 0.8; e.umwegSeite = Math.random() < 0.5 ? 1 : -1; e.fest = 0; }
  }
  // Wachhund: Wer 7 Sekunden lang beim Jagen nicht vom Fleck kommt, steckt irgendwo fest und wird freigesetzt
  e.wachT = (e.wachT || 0) + dt;
  if (e.wachT > 7) {
    // Auch wer auf der Stelle hin und her läuft, steckt fest. Wer in Reichweite des Helden kämpft, ist gemeint nicht.
    if (e.zustand === 'jagen' && !def.abstand && e.wachX !== undefined && Math.hypot(e.x - e.wachX, e.z - e.wachZ) < 2.5 && Math.hypot(e.x - P.x, e.z - P.z) > 4) {
      partikel(e.x, 0.5, e.z, 0x2a2420, 6, 2);
      e.x = zz(-4, 4); e.z = zz(-1, Math.min(4, FELD.zMax - 2)); begrenzen(e);
    }
    e.wachT = 0; e.wachX = e.x; e.wachZ = e.z;
  }
}

function zuschlagen(e, ziel) {
  const def = e.def;
  if (def.boss) {
    if (e.tele) { szene.remove(e.tele); szene.remove(e.teleRing); e.tele = null; }
    const ring = bodenFlaeche(ringGeo, 0xc8c0b0, 0.9);
    ring.position.set(e.x, 0.03, e.z); ring.scale.setScalar(0.5);
    G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.3, wachsen: def.reichweite });
    partikel(e.x, 0.2, e.z, 0x5a5868, 18, 6);
    wackeln(0.45); geraeusch('explosion');
    for (const z of [P, G.tuer, ...G.verbuendete, ...G.tuerme].filter(Boolean)) if (z.hp > 0 && abstand(e, z) < def.reichweite + z.r) schadenAn(z, def.schaden, e.x, e.z, e);
    perfektPruefen(e.x, e.z, def.reichweite + 0.5);
    return;
  }
  if (def.fernkampf) {
    const pf = Object.assign(figur(BILD.pfeil, 0), { x: e.x + e.ax * 0.6, z: e.z + e.az * 0.6, dx: e.ax, dz: e.az, life: 1.2, schaden: def.schaden, von: e });
    pf.sprite.material.rotation = -Math.atan2(-e.az * Math.sin(NEIGUNG), e.ax);
    pf.sprite.center.set(0.5, 0.5);
    G.pfeile.push(pf);
    return;
  }
  if (abstand(e, ziel) < def.reichweite + (ziel.r || 0.4) + 0.45 && !(ziel === P && G.rauch > 0)) schadenAn(ziel, def.schaden, e.x, e.z, e);
  else if (ziel === P) perfektPruefen(e.x, e.z, def.reichweite + 0.9);
  partikel(e.x + e.ax * 0.8, 0.6, e.z + e.az * 0.8, 0xc8c0b0, 3, 2);
}

function pfeilFliegen(pf, dt) {
  pf.life -= dt;
  pf.x += pf.dx * 13 * dt; pf.z += pf.dz * 13 * dt;
  stelle(pf, pf.x, pf.z, 1.0);
  for (const z of [P, ...G.verbuendete, ...G.tuerme, G.tuer].filter(Boolean)) {
    if (z.hp > 0 && abstand(pf, z) < (z.r || 0.4) + 0.15) {
      if (z === P && (P.rolleT > 0 || G.rauch > 0)) continue;
      schadenAn(z, pf.schaden, pf.x - pf.dx, pf.z - pf.dz, pf.von);
      return false;
    }
  }
  if (!pf.ausgewichen && Math.hypot(pf.x - P.sprungVon.x, pf.z - P.sprungVon.z) < 0.6 && perfektPruefen(pf.x, pf.z, 0.6)) pf.ausgewichen = true;
  for (const h of HINDERNISSE) if (abstand(pf, h) < h.r) return false;
  return pf.life > 0;
}

// ---------------------------------------------------------------------
// Verbündete: Wachsoldaten aus der Kaserne und Golems
// ---------------------------------------------------------------------
function soldatErstellen(x, z) {
  G.verbuendete.push(Object.assign(figur(BILD.soldat.stand, 0.5), { art: 'soldat', x, z, r: 0.4, hp: 70, maxHp: 70, blick: 1, cd: 0, hiebT: 0, laufT: 0, bewegt: false, blitz: 0 }));
}
function verbuendeterBewegen(v, dt) {
  v.cd -= dt; v.hiebT -= dt; v.blitz -= dt; v.bewegt = false;
  if (v.art === 'roboter' && !v.laeuft) return;   // liegt kaputt da, bis du ihn reparierst
  const golem = v.art === 'golem';
  if (golem) {
    v.rest -= dt;
    if (v.rest <= 0) {
      if (hatFaehigkeit('kettenreaktion')) {
        for (const e of G.gegner.slice()) if (abstand(e, v) < 2.2 + e.r) gegnerTreffen(e, Math.round(25 * helferMal()), 0, 0, 3, false, 'golem');
        partikel(v.x, 0.6, v.z, 0xffb030, 16, 5); wackeln(0.15); geraeusch('explosion');
      }
      verbuendeterWeg(v, false); return;
    }
  }
  if (v.art === 'nachbild' || v.art === 'puppe') {
    v.rest -= dt;
    if (v.rest <= 0) verbuendeterWeg(v, false);
    return;
  }
  if (v.art === 'begleiter') {
    if (!begleiterBewegen(v, dt)) {
      const zx = P.x - 1.5 * P.blick, zz2 = P.z + 0.8, dx = zx - v.x, dz = zz2 - v.z, d = Math.hypot(dx, dz);
      if (d > 1.2) { v.x += dx / d * v.def.tempo * dt; v.z += dz / d * v.def.tempo * dt; v.bewegt = true; v.blick = dx >= 0 ? 1 : -1; }
    }
    if (v.bewegt) v.laufT += dt;
    begrenzen(v);
    return;
  }
  const tempo = golem ? v.el.tempo * (v.riese ? 0.85 : 1) : 4.4;
  const fokus = golem && G.fokus && G.fokus.e.hp > 0 ? G.fokus.e : null;
  const ziel = fokus || naechster(v, G.gegner, golem ? 10 : 9);
  if (!ziel) {
    const zx = P.x - 1.5 * P.blick, zz2 = P.z + 0.8, dx = zx - v.x, dz = zz2 - v.z, d = Math.hypot(dx, dz);
    if (d > 1.2) { v.x += dx / d * tempo * dt; v.z += dz / d * tempo * dt; v.bewegt = true; v.blick = dx >= 0 ? 1 : -1; }
  } else {
    const dx = ziel.x - v.x, dz = ziel.z - v.z, d = Math.hypot(dx, dz) || 0.001;
    v.blick = dx >= 0 ? 1 : -1;
    if (d > ziel.r + (v.riese ? 1.4 : 1.0)) { const [wx, wz] = wegRichtung(v, ziel.x, ziel.z, dt), wl = Math.hypot(wx, wz) || 1; v.x += wx / wl * tempo * dt; v.z += wz / wl * tempo * dt; v.bewegt = true; }
    else if (v.cd <= 0) {
      v.hiebT = golem && v.bilder.ruhe ? GOLEM_HIEB : 0.15;
      if (golem) {
        v.cd = v.el.angriffPause * (v.riese ? 1.15 : 1);
        const n = Math.round(v.el.schaden * helferMal() * KLASSEN[P.klasse].werte * (v.mal || 1) * (ziel === fokus ? 1 + G.fokus.bonus : 1));
        gegnerTreffen(ziel, n, dx / d, dz / d, v.riese ? 5 : 2, !!v.riese, 'golem', v);
        if (v.riese) { for (const o of G.gegner.slice()) if (o !== ziel && abstand(o, ziel) < 1.4 + o.r) gegnerTreffen(o, Math.ceil(n / 2), 0, 0, 3, false, 'golem', v); wackeln(0.08); }
        if (v.el.brand) for (const o of G.gegner.slice()) if (o !== ziel && abstand(o, ziel) < 1.3) gegnerTreffen(o, Math.ceil(n / 2), 0, 0, 0, false, 'golem', v);
        if (v.el.kette) {
          const zweiter = naechster(ziel, G.gegner.filter(o => o !== ziel), 3.5);
          if (zweiter) { blitzLinie(ziel.x, 0.8, ziel.z, zweiter.x, 0.8, zweiter.z, 0xffe060); gegnerTreffen(zweiter, Math.ceil(n * 0.7), 0, 0, 0, false, 'golem', v); }
        }
        if (v.el.langsam) partikel(ziel.x, 0.8, ziel.z, 0xa8e0ff, 3, 2);
      } else {
        v.cd = 0.8;
        gegnerTreffen(ziel, 8 + G.boni.schaden, dx / d, dz / d, 3, false, 'soldat');
      }
    }
  }
  if (v.bewegt) v.laufT += dt;
  begrenzen(v);
}

// ---------------------------------------------------------------------
// Türme und Bauwerke, Geschosse, Beute, Truhen
// ---------------------------------------------------------------------
function turmDaten(t) { return t.typ === 'lazi' ? CFG.turm : t.typ === 'feuerballiste' ? TECHNIKEN.architekt.r : t.typ === 'wachturm' ? WACHTURM : BAUWERKE[t.typ]; }
function turmBewegen(t, dt) {
  t.cd -= dt * (G.ueberladung > 0 ? 2 : 1); t.blitz -= dt;
  if (t.begleiterTurm) return begleiterTurmTick(t, dt);
  if (t.typ === 'feuerballiste') {
    t.rest -= dt;
    if (t.rest <= 0) { G.tuerme.splice(G.tuerme.indexOf(t), 1); entfernen(t); infoWeg(t); partikel(t.x, 0.6, t.z, 0x5a3a20, 14, 3); zahl(t.x, 1.6, t.z, TX('Zerfällt'), 'block'); return; }
  }
  if (t.typ === 'pfahlwall' || t.cd > 0) return;
  const d = turmDaten(t);
  const kandidaten = t.typ === 'moerser' ? G.gegner.filter(e => abstand(e, t) > 2) : G.gegner;
  const ziel = naechster(t, kandidaten, d.reichweite);
  if (!ziel) return;
  t.cd = d.feuerpause;
  const schaden = Math.round(d.schaden * (t.dorf ? t.mal || 1 : G.boni.turmSchaden));
  if (t.typ === 'feuerballiste') {
    const a = Math.atan2(ziel.z - t.z, ziel.x - t.x);
    wurfgeschoss(t.x, t.z, a, 16, d.reichweite + 2, Math.round(d.schaden * G.boni.turmSchaden * P.schadenWerte * technikMal()), { status: ['brennen'], bild: BILD.bolzen, feuer: true, durchbohrt: true, quelle: 'turm' })
      .sprite.material.color.set(0xff9a30);
    t.blick = Math.cos(a) >= 0 ? 1 : -1;
    geraeusch('turm');
    return;
  }
  if (t.typ === 'moerser') {
    const marke = bodenFlaeche(ringGeo, 0xd04040, 0.6); marke.position.set(ziel.x, 0.03, ziel.z); marke.scale.setScalar(BAUWERKE.moerser.flaeche);
    const kugel = Object.assign(figur(BILD.bolzen, 0), { x0: t.x, z0: t.z, zx: ziel.x, zz: ziel.z, t: 0, dauer: 0.9, schaden, marke });
    kugel.sprite.material.color.set(0x302830);
    G.granaten.push(kugel);
    geraeusch('turm');
    return;
  }
  const langBolzen = BILD.bolzenFlug && (t.typ === 'bolzen' || t.typ === 'wachturm');
  const g = Object.assign(figur(langBolzen ? BILD.bolzenFlug : BILD.bolzen, 0), { x: t.x, z: t.z, y: 2.0, ziel, tempo: t.typ === 'bolzen' ? 15 : 12, life: 1.5, schaden, dreht: langBolzen });
  if (langBolzen) g.sprite.center.set(0.5, 0.5);
  if (t.typ === 'bolzen' || t.typ === 'wachturm') g.sprite.material.color.set(0xd8b070);
  if (t.typ === 'wachturm') g.y = 3.0;
  G.geschosse.push(g);
  geraeusch('turm');
}
function geschossFliegen(b, dt) {
  b.life -= dt;
  const z = b.ziel;
  if (z && z.hp > 0) { b.zx = z.x; b.zz = z.z; }
  if (b.zx === undefined || b.life <= 0) return false;
  const dx = b.zx - b.x, dz = b.zz - b.z, d = Math.hypot(dx, dz);
  if (b.dreht) b.sprite.material.rotation = -Math.atan2(-dz * Math.sin(NEIGUNG), dx);
  if (d < 0.35) {
    if (z && z.hp > 0) { gegnerTreffen(z, b.schaden, dx / (d || 1), dz / (d || 1), b.rueckstoss || 1.2, false, 'turm'); if (b.status && z.hp > 0) zustandGeben(z, b.status); }
    partikel(b.x, 0.8, b.z, b.farbe || 0x5ff0e0, 3, 2);
    return false;
  }
  b.x += dx / d * b.tempo * dt; b.z += dz / d * b.tempo * dt;
  b.y += (0.8 - b.y) * Math.min(1, dt * 6);
  stelle(b, b.x, b.z, b.y);
  return true;
}
function granateFliegen(k, dt) {
  k.t += dt;
  const f = Math.min(1, k.t / k.dauer);
  stelle(k, k.x0 + (k.zx - k.x0) * f, k.z0 + (k.zz - k.z0) * f, 1.5 + Math.sin(f * Math.PI) * 4 - f * 1.5);
  if (f < 1) return true;
  szene.remove(k.marke);
  for (const e of G.gegner.slice()) if (Math.hypot(e.x - k.zx, e.z - k.zz) < BAUWERKE.moerser.flaeche + e.r) gegnerTreffen(e, k.schaden, 0, 0, 2, true, 'turm');
  for (const f of G.faesser) if (f.hp > 0 && Math.hypot(f.x - k.zx, f.z - k.zz) < BAUWERKE.moerser.flaeche + f.r) fassTreffen(f, true);
  partikel(k.zx, 0.4, k.zz, 0xe0521c, 14, 5); partikel(k.zx, 0.4, k.zz, 0x2a2420, 10, 3);
  wackeln(0.12); geraeusch('explosion');
  return false;
}
const SCHROTT_FUNDE = [['schuh', TX('Ein kaputter Schuh')], ['lumpen', TX('Ein alter Lumpen')], ['dose', TX('Eine leere Dose')], ['knochen', TX('Ein abgenagter Knochen')]];
function beuteErstellen(art, x, z, wert) {
  let b = { gold: BILD.muenze, teil: BILD.teil, brot: BILD.brot, holz: BILD.holz, fleisch: BILD.fleisch }[art], name = '';
  if (art === 'schrott') { const f = SCHROTT_FUNDE[Math.floor(Math.random() * SCHROTT_FUNDE.length)]; b = BILD.schrott[f[0]]; name = f[1]; }
  const a = Math.random() * Math.PI * 2, v = zz(1, 3.2);
  G.beute.push(Object.assign(figur(b, 0.2), { art, wert, name, x, z, y: 0.3, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: zz(3, 5), alter: 0 }));
}
function beuteBewegen(p, dt) {
  p.alter += dt;
  p.vy -= 18 * dt; p.y += p.vy * dt;
  if (p.y < 0) { p.y = 0; p.vy *= -0.4; p.vx *= 0.6; p.vz *= 0.6; }
  const d = abstand(p, P);
  const brotSatt = (p.art === 'brot' && P.hp >= P.maxHp) || (p.art === 'holz' && G.holzGetragen >= LAGERFEUER.holzMax);
  if (p.alter > 0.45 && d < 3 && P.hp > 0 && !brotSatt) {
    p.x += (P.x - p.x) / d * 11 * dt; p.z += (P.z - p.z) / d * 11 * dt;
  } else { p.x += p.vx * dt; p.z += p.vz * dt; }
  // Liegende Beute schwebt leicht auf und ab, Gold und Lazi-Teile glitzern ab und zu
  const liegt = p.alter > 0.8 && p.y === 0 && Math.abs(p.vy) < 0.5;
  stelle(p, p.x, p.z, p.y + (liegt ? 0.07 * (0.5 + 0.5 * Math.sin(p.alter * 3 + p.x * 2)) : 0));
  if (liegt && (p.art === 'gold' || p.art === 'teil') && Math.random() < dt * 1.5) schwebeTeilchen(p.x + zz(-0.15, 0.15), zz(0.2, 0.45), p.z + 0.06, 0xfff6c8, 2, 0, 0.4, 0, 0.3, 1);
  if (p.alter > 0.45 && d < 0.5 && !brotSatt) {
    if (p.art === 'gold') { G.gold += p.wert; G.punkte += p.wert; geraeusch('muenze'); }
    else if (p.art === 'teil') { G.teile += p.wert; zahl(P.x, 2.4, P.z, p.wert === 1 ? TX('+1 Lazi-Teil') : TX`+${p.wert} Lazi-Teile`, 'loot'); geraeusch('teil'); }
    else if (p.art === 'holz') { G.holzGetragen++; G.holzGesammelt++; zahl(P.x, 2.4, P.z, TX`Holz ${G.holzGetragen} / ${LAGERFEUER.holzMax}`, 'loot'); geraeusch('teil'); }
    else if (p.art === 'schrott') { G.gold += p.wert; zahl(P.x, 2.4, P.z, TX`${p.name} · wertlos`, 'block'); geraeusch('klick'); }
    else if (p.art === 'fleisch') { G.fleisch += p.wert; zahl(P.x, 2.4, P.z, TX`+${p.wert} Fleisch`, 'loot'); geraeusch('teil'); }
    else { heilen(p.wert); geraeusch('teil'); }
    return false;
  }
  return true;
}
// Totholz liegt im Wald verteilt und wächst nach
function totholzErstellen() {
  let x, z, t = 0;
  do { const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * (FELD.x - 5); x = Math.cos(a) * d; z = Math.sin(a) * d * 0.75; t++; }
  while (HINDERNISSE.some(h => Math.hypot(h.x - x, h.z - z) < h.r + 0.6) && t < 20);
  G.beute.push(Object.assign(figur(BILD.holz, 0.3), { art: 'holz', wert: 1, x, z, y: 0, vx: 0, vz: 0, vy: 0, alter: 1 }));
}
// Lagerfeuer: brennt herunter, getragenes Holz wird automatisch hineingeworfen
function feuerAktualisieren(dt) {
  const f = G.tuer;
  if (!f || f.zielArt !== 'feuer') return;
  f.hp -= LAGERFEUER.verfallProSek * dt;
  G.totholzT -= dt;
  if (G.totholzT <= 0) { G.totholzT = LAGERFEUER.totholzAlle; if (G.beute.filter(b => b.art === 'holz').length < 6) totholzErstellen(); }
  if (G.holzGetragen > 0 && abstand(P, f) < f.r + 1.4) {
    f.hp = Math.min(f.maxHp, f.hp + G.holzGetragen * LAGERFEUER.holzWert);
    zahl(f.x, 2, f.z, '+' + G.holzGetragen * LAGERFEUER.holzWert, 'heal');
    partikel(f.x, 1, f.z, 0xffb030, 10, 3);
    G.holzGetragen = 0; geraeusch('bauen');
  }
  if (Math.random() < dt * 10) partikel(f.x + zz(-0.3, 0.3), 1.2, f.z, 0xff8a30, 1, 0.6);
  if (f.hp <= 0) { f.hp = 0; verloren(TX('Das Feuer ist erloschen')); }
}

function truheErstellen() {
  const t = Object.assign(figur(BILD.truhe, 0.7), { x: zz(-4, 4), z: zz(-4, 2), r: 0.6, offen: false });
  begrenzen(t); stelle(t, t.x, t.z);
  G.truhen.push(t);
  partikel(t.x, 0.5, t.z, 0xeab03a, 12, 3);
}
// Nicht jede Truhe enthält einen Gegenstand. Die zweite Truhe einer Mission bringt meist etwas Besseres.
function truheOeffnen(t) {
  t.offen = true; zeige(t, BILD.truheOffen, 1);
  G.truhenZahl++;
  for (let i = 0; i < 5; i++) beuteErstellen('gold', t.x, t.z, 2);
  if (Math.random() < BEUTE.truheItemChance || G.truhenZahl >= 2 && !G.items.length) {
    const it = beuteWuerfeln('truhe', G.truhenZahl >= 2 ? [30, 45, 20, 5, 0] : BEUTE.seltenheit);
    gegenstandAblegen(it, t.x + 1.2, t.z + 0.3);
    partikel(t.x, 0.6, t.z, new THREE.Color(SELTENHEIT[it.selten].farbe).getHex(), 16, 4);
  } else {
    // Leere Truhe: nur wertloses Zeug, damit man sieht, dass nichts drin war
    beuteErstellen('schrott', t.x, t.z, 1);
    for (let i = 0; i < 2; i++) beuteErstellen('gold', t.x, t.z, 2);
  }
  geraeusch('muenze');
}
// Ein Gegenstand liegt auf dem Boden, mit Lichtstrahl in der Farbe seiner Seltenheit
function gegenstandAblegen(it, x, z) {
  const o = Object.assign(figur(gegenstandBild(it), 0.3), { it, x, z, r: 0.3, wippen: Math.random() * 6 });
  const strahlS = new THREE.Sprite(new THREE.SpriteMaterial({ color: SELTENHEIT[it.selten].farbe, transparent: true, opacity: 0.35, depthWrite: false }));
  strahlS.center.set(0.5, 0); strahlS.scale.set(PX * (it.selten >= 3 ? 6 : 4), it.selten >= 3 ? 4.5 : 3, 1);
  szene.add(strahlS); o.extra = [strahlS]; o.strahl = strahlS;
  begrenzen(o);
  G.items.push(o);
  if (it.selten >= 3) { meldung(SELTENHEIT[it.selten].name + '!', it.name, 1800); geraeusch('sieg'); }
}
let nahItem = null;
function gegenstandAufheben() {
  if (!nahItem) return;
  const o = nahItem, it = o.it;
  if (it.art === 'waffe' && it.klasse !== SPIEL.klasse) return;
  G.gefunden.push(it);
  G.ausItems[it.art] = it;
  spielerWerteSetzen(false);
  G.items.splice(G.items.indexOf(o), 1); entfernen(o);
  meldung(it.name, TX`${SELTENHEIT[it.selten].name} · ausgerüstet, das Alte bleibt im Beutel`, 1800);
  partikel(P.x, 0.8, P.z, new THREE.Color(SELTENHEIT[it.selten].farbe).getHex(), 12, 3);
  geraeusch('teil');
  nahItem = null; gegenstandKarte(null);
}
function gegenstandKarte(o) {
  const karte = document.getElementById('itemCard');
  if (!o) { karte.hidden = true; karte.dataset.id = ''; return; }
  const key = o.it.uid + ':' + (G.ausItems[o.it.art] ? G.ausItems[o.it.art].uid : '');
  if (karte.dataset.id === key && !karte.hidden) return;
  karte.dataset.id = key;
  karte.classList.toggle('touch', istTouch);
  const fremd = o.it.art === 'waffe' && o.it.klasse !== SPIEL.klasse;
  karte.innerHTML = gegenstandKarteHtml(o.it, G.ausItems[o.it.art]) + `<div class="note">${fremd ? TX('Kannst du nicht benutzen, aber verkaufen.') : TX('Liegen gelassen? Wird am Ende der Mission eingesammelt.')}</div>`;
  if (!fremd) {
    const btn = document.createElement('button'); btn.className = 'btn small'; btn.id = 'equipBtn'; btn.type = 'button';
    btn.textContent = istTouch ? TX('Ausrüsten') : TX('F · Ausrüsten');
    btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); gegenstandAufheben(); });
    karte.append(btn);
  }
  karte.hidden = false;
}

// ---------------------------------------------------------------------
// Angriffsanzeigen: Gegner zeigen auf dem Boden, wohin sie gleich angreifen
// ---------------------------------------------------------------------
const flaecheGeo = new THREE.PlaneGeometry(1, 1);
flaecheGeo.geteilt = true;
function angriffsAnzeige(e, d) {
  const def = e.def;
  if (def.boss) return;
  const gruppe = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xd04040, transparent: true, opacity: 0.1, depthWrite: false });
  let mesh;
  if (def.sprung) {
    const laenge = (def.sprungTempo || 11) * (def.sprungZeit || 0.26) + e.r;
    mesh = new THREE.Mesh(flaecheGeo, mat);
    mesh.scale.set(laenge, e.r * 1.6, 1); mesh.position.x = laenge / 2;
  } else if (def.fernkampf) {
    mesh = new THREE.Mesh(flaecheGeo, mat);
    mesh.scale.set(d, 0.12, 1); mesh.position.x = d / 2;
  } else {
    const reich = def.reichweite + 0.9;
    mesh = new THREE.Mesh(new THREE.CircleGeometry(reich, 14, -0.7, 1.4), mat);
  }
  mesh.rotation.x = -Math.PI / 2;
  gruppe.add(mesh);
  gruppe.position.set(e.x, 0.03, e.z);
  gruppe.rotation.y = -Math.atan2(e.az, e.ax);
  szene.add(gruppe);
  e.anzeige = { gruppe, mat, mesh };
}
function anzeigeWeg(e) {
  if (!e.anzeige) return;
  szene.remove(e.anzeige.gruppe); e.anzeige.mat.dispose();
  if (!e.anzeige.mesh.geometry.geteilt) e.anzeige.mesh.geometry.dispose();   // der Kreis für Nahkämpfer ist jedes Mal neu
  e.anzeige = null;
}
function anzeigenAktualisieren() {
  for (const e of G.gegner) {
    if (!e.anzeige) continue;
    const k = 1 - Math.max(0, e.t) / e.def.ausholen;
    e.anzeige.mat.opacity = 0.12 + 0.38 * k;
    e.anzeige.gruppe.position.set(e.x, 0.03, e.z);
    e.anzeige.gruppe.rotation.y = -Math.atan2(e.az, e.ax);
    if (e.def.fernkampf && e.ziel) {
      const d = Math.max(0.5, abstand(e, e.ziel));
      e.anzeige.mesh.scale.x = d; e.anzeige.mesh.position.x = d / 2;
    }
  }
}
// Nebel im Wald: je weiter vom Feuer, desto dichter
function nebelAktualisieren() {
  const n = document.getElementById('nebel');
  if (!MIS.nebel) { n.hidden = true; return; }
  n.hidden = false;
  const p = weltZuBildschirm(G.tuer.x, 0.5, G.tuer.z);
  const kraft = Math.max(0.25, G.tuer.hp / G.tuer.maxHp);
  const r = Math.round(Math.min(innerWidth, innerHeight) * (0.22 + 0.3 * kraft));
  n.style.background = `radial-gradient(circle at ${p.x}px ${p.y}px, rgba(160,175,200,0) ${r}px, rgba(150,165,190,0.38) ${r * 1.7}px, rgba(120,135,160,0.62) ${r * 2.6}px)`;
}

// ---------------------------------------------------------------------
// Wellen
// ---------------------------------------------------------------------
function welleStarten(i) {
  G.welle = i; G.phase = 'kampf';
  const q = [];
  MIS.wellen()[i].gegner.forEach(([typ, n]) => { const extra = typ === 'golem' ? 0 : Math.ceil(G.extra * n / 6); for (let k = 0; k < n + extra; k++) q.push(typ); });
  const istBoss = t => GEGNER[t].boss || GEGNER[t].miniboss;
  const boss = q.filter(istBoss);
  const rest = q.filter(t => !istBoss(t));
  for (let k = rest.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [rest[k], rest[j]] = [rest[j], rest[k]]; }   // gleichmäßig mischen
  G.schlange = boss.concat(rest);
  G.spawnT = 1.5;
  G.truhen.forEach(entfernen); G.truhen = [];
  // Der Erzfeind kommt mit der letzten Welle der Eiferer. Bis er da ist, gilt die Welle nicht als geschafft.
  if (MIS.wellen()[i].nemesis && SPIEL.bestehende.nemesis) {
    G.nemesisKommt = true;
    spaeter(4, () => { G.nemesisKommt = false; if (G && G.zustand === 'spiel') nemesisAufstellen(0, FELD.zMax - 1); });
  }
  meldung(TX`Welle ${i + 1} von ${MIS.wellen().length}`, MIS.wellen()[i].titel);
  geraeusch('welle');
}
function wellenAblauf(dt) {
  if (MIS.typ) return auftragAblauf(dt);
  if (G.phase === 'kampf') {
    G.spawnT -= dt;
    if (G.schlange.length && G.spawnT <= 0) {
      const typ = G.schlange.shift();
      const e = gegnerErstellen(typ);
      G.spawnT = GEGNER[typ].boss || GEGNER[typ].miniboss ? 3 : (G.welle === 0 ? 1.4 : 1.0);
      if (GEGNER[typ].boss) { e.x = 0; e.z = FELD.zMax - 1.5; meldung(TX('Der Wächter-Golem erwacht'), TX`Er will zur ${MIS.ziel ? MIS.ziel.name : TX('Tür')}. Greif ihn an, damit er sich um dich kümmert.`, 2800); }
      if (GEGNER[typ].miniboss) meldung(GEGNER[typ].name, TX('Ein Miniboss! Achte auf die rote Linie, dort springt er hin.'), 2600);
    }
    if (!G.schlange.length && !G.gegner.length && !G.nemesisKommt) {
      G.punkte += 50 * (G.welle + 1);
      if (G.welle === MIS.wellen().length - 1) { G.phase = 'fertig'; G.endeT = 1.6; meldung(MIS.siegTitel); }
      else {
        G.phase = 'pause'; G.pauseT = CFG.pauseZwischenWellen; truheErstellen();
        if (zielArt() === 'tuer' || zielArt() === 'tor') G.tuer.hp = Math.min(G.tuer.maxHp, G.tuer.hp + CFG.kellertuer.reparaturProWelle);
        heilen(Math.round(P.maxHp * 0.15));
        meldung(TX('Welle geschafft'), MIS.pauseText || (zielArt() === 'feuer' ? TX('Eine Truhe ist aufgetaucht. Vergiss das Feuer nicht.') : zielArt() === 'tor' ? TX('Eine Truhe ist aufgetaucht. Die Dorfleute flicken das Tor.') : TX('Eine Truhe ist aufgetaucht. Die Überlebenden flicken die Tür.')));
      }
    }
  } else if (G.phase === 'pause') {
    G.pauseT -= dt;
    if (G.pauseT <= 0) welleStarten(G.welle + 1);
  } else if (G.phase === 'fertig') {
    G.endeT -= dt;
    if (G.endeT <= 0) gewonnen();
  }
}

// ---------------------------------------------------------------------
// Spieler bewegen
// ---------------------------------------------------------------------
function spielerBewegen(dt) {
  let mx = (tasten.KeyD || tasten.ArrowRight ? 1 : 0) - (tasten.KeyA || tasten.ArrowLeft ? 1 : 0);
  let mz = (tasten.KeyS || tasten.ArrowDown ? 1 : 0) - (tasten.KeyW || tasten.ArrowUp ? 1 : 0);
  if (eingabe.stickX || eingabe.stickZ) { mx = eingabe.stickX; mz = eingabe.stickZ; }
  const ml = Math.hypot(mx, mz);
  if (ml > 1) { mx /= ml; mz /= ml; }
  if (neueGrafik() && (eingabe.stickX || eingabe.stickZ) && ml > 0.12) { const k = Math.min(1, ml / 0.55) / Math.min(1, ml); mx *= k; mz *= k; }
  eingabe.mx = mx; eingabe.mz = mz;

  P.angriffCd -= dt; P.comboT -= dt; P.rolleCd -= dt; P.unverwundbar -= dt; P.blitz -= dt; P.hiebT -= dt;
  if ((eingabe.mausGedrueckt || eingabe.touchAngriff) && P.angriffCd <= 0 && !P.zielen && !MIS.markt) angreifen();
  P.mana = Math.min(P.manaMax, P.mana + MANA.proSek * dt);
  if (hatEffekt('regeneration')) { P.regenT += dt; if (P.regenT >= 1) { P.regenT = 0; heilen(1); } }
  technikenAktualisieren(dt);
  empPruefen(dt);

  if (P.sturm) {
    // Sturmangriff bewegt den Spieler selbst (in technikenAktualisieren)
  } else if (P.rolleT > 0) {
    P.rolleT -= dt;
    P.x += P.rdx * CFG.rolle.tempo * dt; P.z += P.rdz * CFG.rolle.tempo * dt;
    P.blick = P.rdx >= 0 ? 1 : -1;
    if (P.rollTreffer) for (const e of G.gegner.slice()) if (!P.rollTreffer.has(e) && abstand(e, P) < e.r + P.r + 0.3) { P.rollTreffer.add(e); gegnerTreffen(e, spielerSchaden(8), P.rdx, P.rdz, 3, false, 'spieler'); }
  } else {
    let tempo = P.tempo * (hatEffekt('tempo') ? 1.15 : 1);
    if (zielArt() === 'feuer' && DORNEN.some(d => Math.hypot(d.x - P.x, d.z - P.z) < d.r)) tempo *= 0.5;
    if (P.laedt || P.zielen) tempo *= 0.5;
    if (P.gebremst > 0) { P.gebremst -= dt; tempo *= 0.45; }
    if (P.angriffCd > 0.1) tempo *= 0.65;
    // Nach oben und unten wirkt der gleiche Weg kürzer, die Kamera schaut schräg: Die neue Grafik gleicht das aus
    if (neueGrafik() && ml > 0) tempo *= Math.hypot(mx, mz) / Math.hypot(mx, mz * Math.sin(NEIGUNG));
    P.x += mx * tempo * dt; P.z += mz * tempo * dt;
    P.bewegt = ml > 0.1;
    if (P.bewegt) { P.laufT += dt; if (!P.laedt && P.angriffCd <= 0) P.blick = mx > 0.1 ? 1 : mx < -0.1 ? -1 : P.blick; }
  }
  if (P.laedt) P.ladung += dt;
  P.x += P.kx * dt; P.z += P.kz * dt;
  const daempf = Math.exp(-10 * dt); P.kx *= daempf; P.kz *= daempf;
  begrenzen(P);

  // Energie und Schrott wachsen nach
  G.energie = Math.min(BESCHWOERUNG.energieMax, G.energie + BESCHWOERUNG.energieProSek * (G.boni.werkstatt ? 1.2 : 1) * (hatFaehigkeit('schnellespulen') ? 1.4 : 1) * dt);
  if (P.klasse === 'schatten' && !hatFaehigkeit('schattenreserve')) P.phase = Math.max(0, P.phase - SCHATTEN.phase.verfall * dt);
  G.schrott += BAUEN.proSek * dt;

  for (const t of G.truhen) {
    if (!t.offen && abstand(t, P) < 1.3) truheOeffnen(t);
    const d = abstand(t, P), min = P.r + t.r;
    if (d < min) { const dx = P.x - t.x, dz = P.z - t.z, l = Math.hypot(dx, dz) || 1; P.x = t.x + dx / l * min; P.z = t.z + dz / l * min; }
  }
  nahItem = null; let bd = 1.4;
  for (const o of G.items) { const d = abstand(o, P); if (d < bd) { bd = d; nahItem = o; } }
  gegenstandKarte(nahItem);
}

function missionAktualisieren(dt) {
  G.zeit += dt;
  feuerAktualisieren(dt);
  if (MIS.tick) MIS.tick(dt);
  spielerBewegen(dt);
  wellenAblauf(dt);
  aurenAktualisieren(dt);
  oelAktualisieren(dt);
  for (const e of G.gegner.slice()) if (e.hp > 0) gegnerBewegen(e, dt);
  G.wurf = G.wurf.filter(g => { const ok = wurfFliegen(g, dt); if (!ok) entfernen(g); return ok; });
  for (const v of G.verbuendete.slice()) verbuendeterBewegen(v, dt);
  for (const t of G.tuerme.slice()) turmBewegen(t, dt);
  G.geschosse = G.geschosse.filter(b => { const ok = geschossFliegen(b, dt); if (!ok) entfernen(b); return ok; });
  G.granaten = G.granaten.filter(k => { const ok = granateFliegen(k, dt); if (!ok) entfernen(k); return ok; });
  G.pfeile = G.pfeile.filter(p => { const ok = pfeilFliegen(p, dt); if (!ok) entfernen(p); return ok; });
  G.beute = G.beute.filter(p => { const ok = beuteBewegen(p, dt); if (!ok) entfernen(p); return ok; });
}

// ---------------------------------------------------------------------
// Darstellung
// ---------------------------------------------------------------------
function heldenPose(o, istSpieler) {
  if (istSpieler && o.rolleT > 0) return 'rolle';
  if (istSpieler && o.laedt) return 'laden';
  if (o.hiebT > 0) return istSpieler && o.combo === 1 ? 'hiebOben' : 'hieb';
  if (o.bewegt) return ['lauf1', 'lauf2', 'lauf3', 'lauf2'][Math.floor(o.laufT * 10) % 4];
  return Math.floor(G.zeit * 1.5) % 2 ? 'stand2' : 'stand';
}
const LADEFARBE = { schwert: 0x5ff0e0, beschwoerer: 0x5ff0e0, architekt: 0xeab03a, schatten: 0xa060ff };
const GOLEM_HIEB = 0.34;   // So lange dauert der Schlag eines modernen Golems im Bild
function atmen(zeit, versatz) { return 1 + Math.sin(zeit * 2.6 + versatz * 3) * 0.018; }
// Bilder stehen schräg zur Kamera: Eine Höhe im Bild ist im Raum etwas größer. So sitzen Balken und Warnzeichen über dem Kopf statt auf der Brust.
const hochVektor = new THREE.Vector3();
function aufBild(h) { if (!neueGrafik()) return h; hochVektor.set(0, 1, 0).applyQuaternion(cam.quaternion); return h / Math.max(0.3, hochVektor.y); }
function missionDarstellen(dt) {
  const blinken = P.unverwundbar > 0 && Math.floor(G.zeit * 20) % 2 === 0 && P.rolleT <= 0;
  const voll = P.laedt && P.ladung >= ladeZeit();
  lichtFlackern(G.zeit);
  const heldBild = neueGrafik() ? neuHeldBild(P, bildKlasse(P.klasse)) : BILD.held[bildKlasse(P.klasse)][P.waffe.bild][P.sturm ? 'hieb' : heldenPose(P, true)];
  zeige(P, heldBild, neueGrafik() ? neuBlick(P, 1) : P.blick, P.blitz > 0 || (voll && Math.floor(G.zeit * 12) % 2 === 0));
  if (neueGrafik() && !P.bewegt && !(P.hiebT > 0) && !(P.rolleT > 0)) P.sprite.scale.y = heldBild.h * PX * atmen(G.zeit, P.x);   // Klassisch atmet schon mit zwei Standbildern
  P.sprite.visible = !blinken && P.hp > 0;
  P.sprite.material.transparent = G.rauch > 0; P.sprite.material.opacity = G.rauch > 0 ? 0.35 : 1;
  stelle(P, P.x, P.z);
  ziellinieAktualisieren();
  P.ladeRing.visible = P.laedt;
  if (P.laedt) {
    const c = Math.min(1, P.ladung / ladeZeit());
    P.ladeRing.position.set(P.x, 0.03, P.z);
    P.ladeRing.scale.setScalar(P.klasse === 'schwert' ? CFG.wirbel.radius + CFG.wirbel.radiusBonus * c : 0.6 + 0.8 * c);
    P.ladeRing.material.opacity = 0.25 + 0.5 * c;
    const farbe = P.klasse === 'beschwoerer' ? new THREE.Color(ELEMENTE[SPIEL.element].farbe).getHex() : LADEFARBE[P.klasse];
    P.ladeRing.material.color.set(c >= 1 ? 0xffd060 : farbe);
  }
  for (const v of G.verbuendete) {
    if (v.art === 'puppe') {
      zeige(v, BILD.puppe, 1, v.blitz > 0); v.blitz -= dt;
    } else if (v.art === 'golem') {
      const B = v.bilder, b = !B.ruhe ? B[v.bewegt ? Math.floor(v.laufT * 6) % 2 : 0]
        : v.hiebT > 0 ? B.hieb[Math.min(3, Math.floor((1 - v.hiebT / GOLEM_HIEB) * 4))]
        : v.bewegt ? B[Math.floor(v.laufT * (v.riese ? 9 : 12)) % 8]
        : B.ruhe[Math.floor(G.zeit * 6 + Math.abs(v.x) * 3) % 6];
      zeige(v, b, v.blick, v.blitz > 0);
      if (B.ruhe) {
        // Beschwören: Der Golem wächst aus dem Boden und federt. Treffer drücken ihn kurz zusammen, das Element sprüht.
        v.alter = (v.alter || 0) + dt;
        const t = Math.min(1, v.alter / 0.4), wachs = t * t * (3 - 2 * t), treffer = v.blitz > 0 ? 0.05 : 0;
        v.sprite.scale.set(b.w * PX * (0.7 + 0.3 * wachs + (1 - wachs) * 0.25 + treffer), b.h * PX * (wachs - treffer), 1);
        if (v.element !== 'metall' && Math.random() < dt * 3) partikel(v.x + (Math.random() - 0.5) * 0.7, 0.5 + Math.random() * v.sprite.scale.y * 0.5, v.z, new THREE.Color(v.el.farbe).getHex(), 1, 1);
      }
      v.sprite.material.opacity = 1;
      v.sprite.visible = v.rest > 3 || Math.floor(G.zeit * 8) % 2 === 0;
    } else if (v.art === 'nachbild') {
      v.sprite.material.opacity = 0.45 * Math.min(1, v.rest * 2);
    } else if (v.art === 'roboter' && !v.laeuft) {
      zeige(v, BILD.botKaputt[Math.floor(G.zeit * 3) % 2], 1, v.blitz > 0); v.blitz -= dt;
    } else {
      const vb = neuPosenBild(v, v.bilder || BILD.soldat, heldenPose(v, false));
      zeige(v, vb, neuBlick(v), v.blitz > 0);
      if (neueGrafik() && !v.bewegt && !(v.hiebT > 0)) v.sprite.scale.y = vb.h * PX * atmen(G.zeit, v.x);
    }
    stelle(v, v.x, v.z, v.hiebT > 0 && v.art === 'golem' && !v.bilder.ruhe ? 0.15 : 0);
    freundInfo(v, aufBild(v.sprite.scale.y));
  }

  for (const a of ANIM_DEKO) zeige(a.o, a.bilder[Math.floor(G.zeit * a.tempo) % a.bilder.length], 1);
  const t = G.tuer || { zielArt: 'keins', hp: 1, maxHp: 1 }, stufe = t.hp > t.maxHp * 0.6 ? 0 : t.hp > t.maxHp * 0.25 ? 1 : 2;
  if (t.zielArt === 'keins') { /* kein Schutzziel */ }
  else if (t.zielArt === 'wagen') { const wb = t.bilder || BILD.wagen; zeige(t, wb[t.faehrt ? Math.floor(G.zeit * 6) % 2 : 0], 1, t.blitz > 0); stelle(t, t.x, t.z); freundInfo(t, wb[0].h * PX); }
  else if (t.zielArt === 'feuer') {
    { const fb = BILD.feuerGross[stufe]; zeige(t, fb[Math.floor(G.zeit * (fb.length > 2 ? 12 : 7)) % fb.length], 1, t.blitz > 0); if (neueGrafik()) { t.sprite.frustumCulled = false; feuerLeben(t.x, t.z, dt, 1 - stufe * .3); } }   // Das Feuer steht wie jede Figur im Raum: Wer davor läuft, verdeckt es, wer dahinter läuft, wird verdeckt
    t.licht.scale.setScalar(2.5 + 3.5 * Math.max(0, t.hp / t.maxHp) + Math.sin(G.zeit * 9) * 0.15);
    nebelAktualisieren();
  } else if (t.bilder) zeige(t, t.bilder[stufe], 1, t.blitz > 0);
  else zeige(t, BILD.tuer[stufe], 1, t.blitz > 0);
  if (G.tuer) t.blitz -= dt;
  anzeigenAktualisieren();

  for (const e of G.gegner) {
    let b = e.bilder[0];
    if (e.bewegt && e.bilder.length > 1 && !gegnerSteht(e)) b = e.bilder[1 + Math.floor(e.laufT * 7) % (e.bilder.length - 1)];
    else if (e.typ === 'trommler' && e.trommelT) b = Math.floor(G.zeit * 6) % 2 ? BILD.trSchlag : e.bilder[0];
    if (e.typ === 'kesselwaerter') b = e.ueberhitzt > 0 ? BILD.kesselHeissBilder[Math.floor(G.zeit * 8) % 2] : e.aktion && e.aktion.art === 'glut' ? BILD.kesselHoch : e.bewegt ? b : BILD.kesselRuhe[Math.floor(G.zeit * 5) % 2];
    if (e.typ === 'waagmeister') b = e.wankt > 0 ? BILD.waagmeisterWankt[Math.floor(G.zeit * 3) % 2] : e.bilder[e.bewegt ? Math.floor(e.laufT * 4) % 2 : 0];
    if (e.typ === 'vorarbeiter') b = e.inventur > 0 ? BILD.vorarbeiterOffen[Math.floor(G.zeit * 4) % 2] : e.bilder[e.bewegt ? Math.floor(e.laufT * 4) % 2 : 0];
    if (e.typ === 'schaltkasten' && e.hp < e.maxHp * 0.35) b = BILD.schaltkastenKaputt;
    if (e.typ === 'schutzturm') b = e.bilder[e.zustand === 'ausholen' ? 1 : 0];
    b = neuGegnerBild(e, b);
    zeige(e, b, neuBlick(e), e.blitz > 0 || (e.zustand === 'zuenden' && Math.floor(G.zeit * 14) % 2 === 0));
    const holt = e.zustand === 'ausholen' || e.zustand === 'zuenden';
    e.sprite.scale.x = b.w * PX * (holt ? 1 + Math.sin(G.zeit * 40) * 0.04 : 1);
    if (neueGrafik()) {   // Stehende Gegner atmen, Treffer drücken sie kurz zusammen
      const stoss = e.blitz > 0 ? 0.06 : 0;
      e.sprite.scale.x *= 1 + stoss;
      e.sprite.scale.y = b.h * PX * (e.bewegt ? 1 : atmen(G.zeit, e.x)) * (1 - stoss);
    }
    const z = e.zs;
    e.sprite.material.color.set(z.gefroren > 0 ? 0x80c8ff : z.betaeubt > 0 ? 0xfff8a0 : z.brennen > 0 ? 0xffa070 : z.frost > 0 || e.langsam > 0 ? 0xa8d0ff : z.gift > 0 ? 0xb8f090 : z.oel > 0 ? 0x9a90a8 : e.buff > 0 && Math.floor(G.zeit * 6) % 2 ? 0xffc0a0 : holt ? 0xffd0c0 : 0xffffff);
    if (e.sprite.isMesh) { if (e.blitz > 0) e.sprite.material.color.setScalar(2.4); } else if (szene.userData.licht) e.sprite.material.color.multiplyScalar(0.55);
    stelle(e, e.x, e.z, e.zustand === 'sprung' ? 0.25 : 0);
    const oben = aufBild(e.bilder[0].h * PX);
    e.warn.position.set(e.x, oben + 0.15, e.z);
    if (e.eliteRing) { e.eliteRing.position.set(e.x, 0.028, e.z); e.eliteRing.material.opacity = 0.55 + Math.sin(G.zeit * 6) * 0.25; }
    gegnerInfo(e, oben);
    if (e.balkenH) {
      const sichtbar = e.hp < e.maxHp;
      e.balkenH.visible = e.balkenV.visible = sichtbar;
      if (sichtbar) {
        const w = 1.1, h = PX * 2;
        e.balkenH.scale.set(w + PX * 2, h + PX * 2, 1); e.balkenH.position.set(e.x - w / 2 - PX, oben + 0.1 - PX, e.z);
        e.balkenV.scale.set(w * Math.max(0, e.hp / e.maxHp), h, 1); e.balkenV.position.set(e.x - w / 2, oben + 0.1, e.z);
      }
    }
    if (e.tele) { e.tele.position.set(e.x, 0.02, e.z); e.teleRing.position.set(e.x, 0.025, e.z); }
  }
  for (const tu of G.tuerme) {
    const b = tu.bild || (tu.typ === 'lazi' ? BILD.turm : tu.typ === 'feuerballiste' ? BILD.feuerballiste[Math.floor(G.zeit * 7) % 2] : tu.typ === 'wachturm' ? BILD.gebaeude.wachturm[0] : BILD.bauwerk[tu.typ]);
    const feuert = !tu.begleiterTurm && tu.typ !== 'pfahlwall' && tu.cd > turmDaten(tu).feuerpause - 0.06;
    zeige(tu, b, tu.typ === 'feuerballiste' ? (tu.blick || 1) : 1, tu.blitz > 0 || feuert || (tu.typ === 'feuerballiste' && tu.rest < 3 && Math.floor(G.zeit * 8) % 2 === 0));
    freundInfo(tu, aufBild(b.h * PX));
  }
  for (const it of G.items) {
    it.wippen += dt * 3;
    stelle(it, it.x, it.z, 0.2 + Math.sin(it.wippen) * 0.08);
    it.strahl.position.set(it.x, 0, it.z); it.strahl.material.opacity = 0.25 + Math.sin(it.wippen * 1.3) * 0.1;
  }
  G.effekte = G.effekte.filter(fx => {
    fx.t += dt; const k = fx.t / fx.life;
    if (k >= 1) { szene.remove(fx.mesh); return false; }
    fx.mat.opacity = (fx.deckkraft || 1) * (1 - k);
    if (fx.wachsen) fx.mesh.scale.setScalar(0.4 + (fx.wachsen - 0.4) * Math.min(1, k * 1.6));
    if (fx.folgen) fx.mesh.position.set(P.x, 0.05, P.z);
    return true;
  });
  if (dt > 0) missionLeben(dt);
  G.partikel = G.partikel.filter(p => {
    p.t += dt;
    if (p.t >= p.life) { entfernen(p); return false; }
    if (p.rauch) { p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.sprite.material.opacity = (p.deck || 0.75) * (1 - p.t / p.life); if (p.schrumpf) { const g = p.gross * (1 - 0.6 * p.t / p.life); p.sprite.scale.set(g, g, 1); } }
    else { p.vy -= 16 * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y = Math.max(0.02, p.y + p.vy * dt); }
    p.sprite.position.set(p.x, p.y, p.z);
    return true;
  });
  G.wackeln = Math.max(0, G.wackeln - dt * 1.5);
  kameraAuf(P.x + (Math.random() - 0.5) * G.wackeln, Math.min(P.z, FELD.zMax - 4) + (Math.random() - 0.5) * G.wackeln);
  G.zahlen = G.zahlen.filter(n => {
    n.t += dt;
    if (n.t >= n.life) { n.el.remove(); return false; }
    const p = weltZuBildschirm(n.x, n.y + n.t * 1.2, n.z);
    n.el.style.left = p.x + 'px'; n.el.style.top = p.y + 'px';
    n.el.style.opacity = String(Math.min(1, (n.life - n.t) * 4));
    return true;
  });
}

const hudSpeicher = {};
function hudText(id, text) { if (hudSpeicher[id] !== text) { hudSpeicher[id] = text; document.getElementById(id).textContent = text; } }
function missionHudAktualisieren(neu) {
  if (neu) for (const k in hudSpeicher) delete hudSpeicher[k];
  technikHudAktualisieren();
  hudText('hpText', Math.ceil(P.hp) + ' / ' + P.maxHp);
  document.getElementById('hpFill').style.width = (P.hp / P.maxHp * 100) + '%';
  document.getElementById('chFill').style.width = (P.laedt ? Math.min(1, P.ladung / ladeZeit()) * 100 : 0) + '%';
  hudText('wName', P.waffe.name);
  document.getElementById('wName').style.color = SELTENHEIT[P.waffe.selten].farbe;
  let extra = '';
  if (P.klasse === 'beschwoerer') {
    document.getElementById('enFill').style.width = (G.energie / BESCHWOERUNG.energieMax * 100) + '%';
    extra = TX`${ELEMENTE[SPIEL.element].name}-Golems ${G.verbuendete.filter(v => v.art === 'golem').reduce((n, g) => n + (g.plaetze || 1), 0)} / ${golemMax()}`;
  }
  if (P.klasse === 'architekt') extra = BAUWERKE[G.bauwahl].name + ' (' + bauwerkKosten(G.bauwahl) + ') · ' + G.tuerme.filter(t => t.typ !== 'feuerballiste' && !t.dorf && !t.begleiterTurm).length + ' / ' + (BAUEN.max + G.extraMax + (hatFaehigkeit('grossbaustelle') ? 2 : 0));
  if (P.klasse === 'schwert') extra = TX`Türme ${G.tuerme.filter(t => !t.dorf && !t.begleiterTurm).length} / ${CFG.turm.max + G.extraMax + (hatFaehigkeit('turmmeister') ? 1 : 0)}`;
  if (P.klasse === 'schatten') {
    document.getElementById('enFill').style.width = (P.phase / SCHATTEN.phase.max * 100) + '%';
    extra = P.phase >= SCHATTEN.phase.max ? TX('Phase voll: nächster Angriff x3') : TX('Weiche im letzten Moment aus');
  }
  hudText('wExtra', extra);
  hudText('gold', String(G.gold));
  hudText('teile', String(P.klasse === 'schwert' ? G.teile : P.klasse === 'beschwoerer' ? Math.floor(G.energie) : P.klasse === 'schatten' ? Math.floor(P.phase) : Math.floor(G.schrott)));
  hudText('score', String(G.punkte));
  if (MIS.typ) auftragHud();
  else {
    hudText('waveLabel', TX`Welle ${Math.max(0, G.welle) + 1} / ${MIS.wellen().length}`);
    let unter = '';
    if (G.phase === 'kampf') unter = TX`${G.gegner.length + G.schlange.length} Gegner übrig`;
    else if (G.phase === 'pause') unter = (G.truhen.some(t => !t.offen) ? TX('Öffne die Truhe · ') : '') + TX`Nächste Welle in ${Math.ceil(G.pauseT)} s`;
    else if (G.phase === 'fertig') unter = TX('Geschafft');
    if (zielArt() === 'feuer' && G.phase !== 'fertig') unter += TX` · Holz ${G.holzGetragen} / ${LAGERFEUER.holzMax}`;
    hudText('waveSub', unter);
    document.getElementById('doorFill').style.width = Math.min(100, Math.max(0, G.tuer.hp / G.tuer.maxHp * 100)) + '%';
  }
  const boss = G.gegner.find(e => e.def.boss || e.def.miniboss);
  if (boss) hudText('bossName', boss.anzeigeName || boss.def.name);
  document.getElementById('bossBar').hidden = !boss;
  if (boss) document.getElementById('bossFill').style.width = (boss.hp / boss.maxHp * 100) + '%';
}

// ---------------------------------------------------------------------
// Ende der Mission
// ---------------------------------------------------------------------
function pauseUmschalten() {
  if (!G) return;
  if (G.zustand === 'spiel') {
    G.zustand = 'pause'; eingabe.mausGedrueckt = false; ladenLoslassen();
    pauseBildschirm();
  } else if (G.zustand === 'pause') {
    overlayWeg(); G.zustand = 'spiel';
  }
}

function pauseBildschirm() {
  overlayZeigen(TX`<div class="card panel" role="dialog"><div class="label">Pause</div><h1>Kurze Rast</h1>${steuerungHtml()}
    <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">Weiterspielen</button>
    <button class="btn ghost" data-a="opt" type="button">Optionen</button>
    <button class="btn ghost" data-a="aufgeben" type="button">${MIS.markt ? TX('Markt verlassen') : TX('Mission aufgeben')}</button></div></div>`);
  overlay.querySelector('[data-a="weiter"]').addEventListener('click', pauseUmschalten);
  overlay.querySelector('[data-a="opt"]').addEventListener('click', () => optionenZeigen(pauseBildschirm));
  const auf = overlay.querySelector('[data-a="aufgeben"]');
  auf.addEventListener('click', () => {
    if (MIS.markt) { overlayWeg(); G.zustand = 'spiel'; return marktVerlassen(); }
    if (!auf.dataset.sicher) { auf.dataset.sicher = '1'; auf.textContent = TX('Wirklich aufgeben?'); return; }
    overlayWeg(); G.zustand = 'spiel'; verloren(TX('Du hast die Mission aufgegeben'));
  });
}

function missionAufraeumen() {
  document.getElementById('nebel').hidden = true;
  if (G) G.gegner.forEach(anzeigeWeg);
  G.zahlen.forEach(n => n.el.remove());
  document.querySelectorAll('#fx .figur-info').forEach(el => el.remove());
  P.zielen = null;
  gegenstandKarte(null);
}

// Belohnung je Mission
function missionsBelohnung() {
  const erg = { sieg: true, ort: MIS.ort, gold: G.gold, teile: G.teile, holz: 0, stein: 0, nahrung: 0, ueberlebende: 0, items: G.gefunden.slice(), ausItems: Object.assign({}, G.ausItems), material: Object.assign({}, G.material), lore: [] };
  const siege = SPIEL.karte.erledigt[MIS.ort] || 0;
  for (let r = 0; r < (G.runde || 1); r++) rundenBelohnung(erg, siege);
  if (MIS.legendaer) {
    erg.items.push(gegenstandErzeugen('waffe', Math.random() < BEUTE.laziAusHort ? 4 : 3));
    erg.gold += 30;
  }
  return erg;
}
// Was eine geschaffte Runde einbringt (bei Missionen in Runden mehrmals)
function rundenBelohnung(erg, siege) {
  if (MIS.ort === 'universitaet' && !MIS.belohnungAllein) {
    // Überlebende kommen seit dem Mittelteil aus den Bunkern in der Stadt, die Universität bringt Wissen
    erg.teile += zzGanz(2, 4);
    erg.lore = [['aufschrift', 'vorlesung'], ['befehl'], ['status']][Math.min(siege, 2)];
    erg.material.buecher = (erg.material.buecher || 0) + zzGanz(3, 5);
    clusterAendern('wissen', 6);
  } else if (!MIS.typ && !MIS.ueberfall && !MIS.belohnungAllein) {
    erg.holz += 14 + G.holzGesammelt * 2; erg.stein += 8 + G.welle * 3; erg.nahrung += 10 + G.fleisch * 5;
    erg.ueberlebende += MIS.ort === 'wald' && siege > 0 ? zzGanz(0, 2) : 0;
    erg.lore = MIS.ort === 'wald' ? ['woelfe'] : ['hort'];
  }
  if (MIS.belohnung) MIS.belohnung(erg, siege);
}

function gewonnen() {
  if (G.runden && G.runde < G.runden.anzahl && !G.heimkehr) return rundeGeschafft();
  G.zustand = 'sieg';
  geraeusch('sieg');
  const stufeVorher = SPIEL.held.stufe;
  erfahrungGeben(STUFEN.missionSieg);
  G.items.forEach(o => G.gefunden.push(o.it));
  const g = MIS.geschichten[(SPIEL.karte.besucht[MIS.ort] || 0) % MIS.geschichten.length];
  const erg = missionsBelohnung();
  const wahl = MIS.wahl ? MIS.wahl(erg) : null;
  SPIEL.rekord = Math.max(SPIEL.rekord || 0, G.punkte);
  SPIEL.missionsPunkte = (SPIEL.missionsPunkte || 0) + G.punkte;
  // Der Sieg ist sicher: Lädt jemand jetzt neu, bekommt er ihn trotzdem (ohne die Wahl am Ende)
  if (SPIEL.laufend) { SPIEL.laufend.erg = erg; spielSpeichern(); }
  missionAufraeumen();
  const zeile = (c, k, n) => erg[k] ? `<div class="reward ${c}"><b>${k === 'ueberlebende' ? '' : '+'}${erg[k]}</b><span class="label">${n}</span></div>` : '';
  const besonders = erg.items.filter(it => it.selten >= 3);
  overlayZeigen(TX`
    <div class="card panel" role="dialog" aria-labelledby="wt">
      <div class="label">Tag ${SPIEL.tag} · Mission erfüllt${G.runden ? TX` · ${G.runde} von ${G.runden.anzahl} Runden` : ''}</div>
      <h1 id="wt">${esc(MIS.siegTitel)}</h1>
      <p class="story">${esc(g.outro)}</p>
      ${besonders.map(it => `<div class="legendaer" style="border-color:${SELTENHEIT[it.selten].farbe}">${gegenstandKarteHtml(it)}</div>`).join('')}
      <div class="rewards">
        ${Object.keys(erg.material).filter(m => erg.material[m]).map(m => `<div class="reward m"><b>${materialSymbol(m)}+${erg.material[m]}</b><span class="label">${esc(MATERIALIEN[m].name)}</span></div>`).join('')}
        ${zeile('g', 'gold', TX('Gold'))}${zeile('t', 'teile', TX('Lazi-Teile'))}${zeile('h', 'holz', TX('Holz'))}${zeile('h', 'stein', TX('Stein'))}${zeile('a', 'nahrung', TX('Nahrung'))}${zeile('a', 'ueberlebende', TX('Überlebende'))}
        <div class="reward s"><b>${G.punkte}</b><span class="label">Punkte</span></div>
      </div>
      <p class="note">+${G.erfahrung + STUFEN.missionSieg} Erfahrung${SPIEL.held.stufe > stufeVorher ? TX` · <b>Neue Stufe ${SPIEL.held.stufe}!</b> Verteile deine Punkte im Dorf unter „Held“.` : ''}</p>
      <p class="note">${G.siege} Gegner besiegt${erg.items.length ? TX(' · Gefunden: ') + erg.items.map(it => `<span style="color:${SELTENHEIT[it.selten].farbe}">${esc(it.name)}</span>`).join(', ') : ''}</p>
      ${wahl ? `<p class="story"><b>${esc(wahl.frage)}</b></p><div class="ereignis-optionen">${wahl.optionen.map((o, i) => `<button class="btn${i ? ' ghost' : ''}" data-a="dorf" data-w="${i}" type="button">${esc(o.text)}<small>${esc(o.info)}</small></button>`).join('')}</div>`
        : TX('<button class="btn" data-a="dorf">Zurück ins Dorf</button>')}
    </div>`);
  overlay.querySelectorAll('[data-a="dorf"]').forEach(k => k.addEventListener('click', () => {
    if (wahl) wahl.optionen[Number(k.dataset.w)].wirkung(erg);
    delete SPIEL.laufend;
    REISE = null; (MIS.nachher || rueckkehrInsDorf)(erg);
  }));
}

// Eine Runde ist geschafft, es kommt noch eine: weitermachen oder (wenn erlaubt) mit der Beute heimkehren
function rundeGeschafft() {
  G.zustand = 'sieg';
  geraeusch('welle');
  missionAufraeumen();
  const R = G.runden, leben = Math.max(0.05, P.hp / P.maxHp);
  const naechste = () => {
    RUNDE_WEITER = { nr: G.runde + 1, runden: R, leben: Math.min(1, leben + RUNDEN.heilung), gold: G.gold, teile: G.teile, material: G.material, gefunden: G.gefunden.concat(G.items.map(o => o.it)),
      punkte: G.punkte, siege: G.siege, erfahrung: G.erfahrung, zielAnteil: G.tuer ? G.tuer.hp / G.tuer.maxHp : undefined };
    { const ort = G.startOrt; mitLadebild(() => missionStarten(ort)); }
  };
  overlayZeigen(TX`
    <div class="card panel" role="dialog" aria-labelledby="rt">
      <div class="label">Tag ${SPIEL.tag} · Runde ${G.runde} von ${R.anzahl} geschafft</div>
      <h1 id="rt">${esc(MIS.rundenTitel || TX('Geschafft. Aber es geht weiter.'))}</h1>
      <p class="story">${esc(R.freiwillig ? MIS.rundenText || TX('Hier gibt es noch mehr zu holen. Die nächste Runde wird härter.') : MIS.weiterText || TX('Es ist noch nicht vorbei. Es geht sofort weiter.'))}</p>
      <div class="rewards">
        <div class="reward g"><b>${G.gold}</b><span class="label">Gold bisher</span></div>
        <div class="reward t"><b>${G.teile}</b><span class="label">Lazi-Teile bisher</span></div>
        <div class="reward s"><b>${Math.round(leben * 100)} %</b><span class="label">Leben</span></div>
      </div>
      <p class="note">${R.freiwillig ? TX('Jede Runde bringt die volle Belohnung noch einmal. Scheiterst du in der nächsten Runde, ist alles verloren.') : TX('Du bekommst ein wenig Leben zurück. Die Belohnung gibt es am Ende für jede geschaffte Runde.')}</p>
      <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">Weiter zu Runde ${G.runde + 1}</button>
      ${R.freiwillig ? TX('<button class="btn ghost" data-a="heim" type="button">Mit der Beute heimkehren</button>') : ''}</div>
    </div>`);
  overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => { overlayWeg(); naechste(); });
  const heim = overlay.querySelector('[data-a="heim"]');
  if (heim) heim.addEventListener('click', () => { G.heimkehr = true; gewonnen(); });
}

function verloren(grund) {
  if (G.zustand !== 'spiel') return;
  if (G.phase === 'fertig') return;   // Alle Wellen sind geschafft, der Sieg steht fest: Ein letzter Treffer ändert daran nichts mehr
  G.zustand = 'niederlage';
  erfahrungGeben(STUFEN.missionNiederlage);
  eingabe.mausGedrueckt = false; eingabe.touchAngriff = false;
  partikel(P.x, 0.8, P.z, 0xa83040, 20, 5);
  geraeusch('niederlage');
  setTimeout(() => {
    missionAufraeumen();
    overlayZeigen(TX`
      <div class="card panel" role="dialog" aria-labelledby="lt">
        <div class="label">Tag ${SPIEL.tag} · Mission gescheitert</div>
        <h1 id="lt">${esc(grund)}</h1>
        <p class="story">${esc(MIS.niederlage)}</p>
        <div class="rewards">
          <div class="reward s"><b>${G.punkte}</b><span class="label">Punkte</span></div>
          <div class="reward g"><b>${G.siege}</b><span class="label">Gegner besiegt</span></div>
        </div>
        <p class="note">+${G.erfahrung + STUFEN.missionNiederlage} Erfahrung, du lernst auch aus Niederlagen. Niederlagen machen die Gegner nicht stärker. Probier es noch einmal, vielleicht mit Wohnhäusern, Schmiede oder Kaserne im Rücken.</p>
        <button class="btn" data-a="dorf">Zurück ins Dorf</button>
      </div>`);
    overlay.querySelector('[data-a="dorf"]').addEventListener('click', () => { delete SPIEL.laufend; REISE = null; (MIS.nachher || rueckkehrInsDorf)({ sieg: false, ort: MIS.ort }); });
  }, 900);
}

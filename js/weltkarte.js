// =====================================================================
// WELTKARTE: das Tal von Altbrück (Endfassung F). Ort wählen, hinreisen,
// unterwegs Ereignisse erleben, Nachrichten lesen, dann die Mission spielen.
// Land und Bild stehen in weltkarte_land.js (WK) und weltkarte_maler.js (PL, TZ).
// Hier: Ziehen und Zoomen, Orte und Landstriche auf der Karte, Tageszeit,
// die Leiste mit der Spiellogik (kartenInfo), Handel und Reisen.
// =====================================================================

// Der Hort ist nach dem Sieg weg, außer eine Fährte des Fährtenwolfs zeigt noch hin (siehe waldSpurWuerfeln)
const hortOffen = () => !SPIEL.karte.erledigt.hort || !!SPIEL.karte.hortFaehrte;
let REISE = null;                      // aktuelle Reise: { ort, leben }
let kartenAuswahl = 'dorf';

// Zustand eines Orts auf der Karte: 'offen', 'gesperrt' (Epoche fehlt, grau mit Schloss),
// 'unbekannt' (liegt im Nebel), 'weg' (steht nicht auf der Karte: die Karawane zieht umher, der Hort nach dem Sieg)
function kartenZustand(id) {
  const o = ORTE[id];
  if (o.versteckt) return 'weg';
  if (!ortBekannt(id)) return 'unbekannt';
  if (id === 'hort' && !hortOffen()) return 'weg';
  if (o.abEpoche && !regel('alleOrteOffen') && SPIEL.epoche < o.abEpoche) return 'gesperrt';
  return 'offen';
}
WK.zustandVon = kartenZustand;

// Kurze Namen, wenn die Karte weit herausgezoomt ist
const KARTE_KURZ = { dorf: TX('Dorf'), markt: TX('Markt'), birkenstrasse: TX('Birkenstraße'), wald: TX('Wald'), birkenhain: TX('Birkenhain'), lager: TX('Lager'),
  universitaet: TX('Universität'), stadt: TX('Stadt'), hort: TX('Hort'), karawane: TX('Karawane'), planarchiv: TX('Planarchiv'), schleuse: TX('Schleuse'),
  ersatzteillager: TX('Ersatzteile'), umspannwerk: TX('Umspannwerk'), kraftwerk: TX('Kraftwerk'), eisenfurt: TX('Eisenfurt'), lazifabrik: TX('Fabrik'),
  erzwaesche: TX('Roter Fluss'), nullbunker: TX('Nullbunker') };
// Die acht Landstriche, vom Dorf nach außen
const LANDSTRICH_NAME = { felder: TX('Die Felder'), wald: TX('Der Dunkelwald'), anhoehe: TX('Die Anhöhe'), fluss: TX('Das Flusstal'), stadt: TX('Die tote Stadt'),
  werke: TX('Die Werke'), berge: TX('Die Eisenberge'), tiefe: TX('Die Tiefe') };
const LANDSTRICH_REIHE = ['felder', 'wald', 'anhoehe', 'fluss', 'stadt', 'werke', 'berge', 'tiefe'];
const TAGESZEIT_TITEL = { morgen: TX('Tageszeit: Morgen'), tag: TX('Tageszeit: Tag'), abend: TX('Tageszeit: Abend'), nacht: TX('Tageszeit: Nacht') };

const karteHandy = () => window.innerWidth <= 760;
const karteSichtbar = () => !document.getElementById('weltkarte').hidden;
let karteUi = null;   // wird beim ersten Öffnen eingerichtet: Ansicht, Ortsebene, Landnamen, Uhr

// Die Uhr der Karte beginnt bei der Uhr des Dorfs (Dorf.uhr 0 = Morgen, 0,5 = Abend, 0,6–0,9 = Nacht)
function dorfUhrAlsStunde() {
  const u = typeof Dorf !== 'undefined' && Dorf && typeof Dorf.uhr === 'number' ? Dorf.uhr : 0.2;
  return ((u * 24 + 6) % 24 + 24) % 24;
}

// Im Leerlauf vorbereiten: Landstriche, Relief und die drei Grundbilder (sonst stockt das erste Öffnen gut eine Sekunde)
setTimeout(() => TZ.vorbereitung.starten(), 1500);

// ---------------------------------------------------------------------
// Gesten: ziehen (Maus, ein Finger), zoomen (Rad, zwei Finger)
// ---------------------------------------------------------------------
function karteGesten(el, ebene, h) {
  const zeiger = new Map();
  let gezogen = false, start = null, pinch = null;
  const rel = (x, y) => { const r = el.getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const pinchWerte = () => {
    const [a, b] = [...zeiger.values()], [mx, my] = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
    return { mx, my, d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
  };
  const runter = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 1) { gezogen = false; start = { x: e.clientX, y: e.clientY }; }
    if (zeiger.size === 2) pinch = pinchWerte();
  };
  el.addEventListener('pointerdown', runter);
  ebene.addEventListener('pointerdown', runter);
  window.addEventListener('pointermove', e => {
    const p = zeiger.get(e.pointerId); if (!p) return;
    const ax = p.x, ay = p.y; p.x = e.clientX; p.y = e.clientY;
    if (zeiger.size === 1) {
      if (!gezogen && Math.hypot(p.x - start.x, p.y - start.y) > 6) { gezogen = true; el.classList.add('zieht'); }
      if (gezogen) h.pan(p.x - ax, p.y - ay);
    } else if (zeiger.size === 2 && pinch) {
      gezogen = true;
      const n = pinchWerte();
      h.pan(n.mx - pinch.mx, n.my - pinch.my);
      h.zoom(n.d / pinch.d, n.mx, n.my);
      pinch = n;
    }
  });
  const ende = e => {
    if (!zeiger.delete(e.pointerId)) return;
    if (zeiger.size === 1) { const [q] = zeiger.values(); start = { x: q.x, y: q.y }; }
    pinch = zeiger.size === 2 ? pinchWerte() : null;
    if (!zeiger.size) el.classList.remove('zieht');
  };
  window.addEventListener('pointerup', ende);
  window.addEventListener('pointercancel', ende);
  // Nach dem Ziehen löst das Loslassen keinen Klick auf einen Ort aus
  const schlucken = e => { if (gezogen) { e.stopPropagation(); e.preventDefault(); gezogen = false; } };
  el.addEventListener('click', schlucken, true);
  ebene.addEventListener('click', schlucken, true);
  // Das Rad zoomt nur die Karte, nicht das Dorf darunter (dorf.js hört am Fenster)
  const rad = e => { e.preventDefault(); e.stopPropagation(); const [x, y] = rel(e.clientX, e.clientY); h.zoom(Math.exp(-e.deltaY * 0.0015), x, y); };
  el.addEventListener('wheel', rad, { passive: false });
  ebene.addEventListener('wheel', rad, { passive: false });
}

// ---------------------------------------------------------------------
// Ansicht: Bildschirm = Kartenpixel · s + t. o: { w, h, render(v), rand() -> { r, b } (von der Leiste verdeckt) }
// ---------------------------------------------------------------------
function karteAnsicht(el, ebene, o) {
  const v = { s: 1, tx: 0, ty: 0 };
  let geplant = false, tween = null;
  // kleinster Abstand zweier Orte (Schachbrett), damit sich die Trefferflächen auch ganz weit weg nicht decken
  let dMin = 1e9;
  WK.IDS.forEach((a, i) => WK.IDS.slice(i + 1).forEach(b => { dMin = Math.min(dMin, Math.max(Math.abs(WK.ORTE[a].x - WK.ORTE[b].x), Math.abs(WK.ORTE[a].y - WK.ORTE[b].y))); }));
  const grenzen = () => {
    const W = el.clientWidth, H = el.clientHeight, rd = o.rand();
    const contain = Math.min((W - rd.r) / o.w, (H - rd.b) / o.h);
    return { W, H, rd, sMin: Math.max(contain, 46 / dMin), sMax: 6, contain };
  };
  const klemmen = () => {
    if (!el.clientWidth) return;   // Karte verborgen: nichts messen
    const g = grenzen();
    v.s = Math.max(g.sMin, Math.min(g.sMax, v.s));
    const mw = o.w * v.s, mh = o.h * v.s, nutzW = g.W - g.rd.r, nutzH = g.H - g.rd.b;
    v.tx = mw <= nutzW ? (nutzW - mw) / 2 : Math.min(0, Math.max(nutzW - mw, v.tx));
    v.ty = mh <= nutzH ? (nutzH - mh) / 2 : Math.min(0, Math.max(nutzH - mh, v.ty));
  };
  const zeichnen = () => { if (geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; o.render(v); }); };
  const api = {
    v, grenzen, dMin,
    pan(dx, dy) { tween = null; v.tx += dx; v.ty += dy; klemmen(); zeichnen(); },
    zoom(f, cx, cy) {
      tween = null;
      const g = grenzen(), s2 = Math.max(g.sMin, Math.min(g.sMax, v.s * f)), k = s2 / v.s;
      v.tx = cx - (cx - v.tx) * k; v.ty = cy - (cy - v.ty) * k; v.s = s2; klemmen(); zeichnen();
    },
    // Kartenpunkt (x, y) in die Mitte der freien Fläche, optional mit neuem Maßstab
    hin(x, y, s, weich) {
      const g = grenzen(), ziel = { s: Math.max(g.sMin, Math.min(g.sMax, s || v.s)) };
      ziel.tx = (g.W - g.rd.r) / 2 - x * ziel.s; ziel.ty = (g.H - g.rd.b) / 2 - y * ziel.s;
      if (!weich) { tween = null; Object.assign(v, ziel); klemmen(); zeichnen(); return; }
      const von = { ...v }, t0 = performance.now(), dauer = 320, mein = {};
      tween = mein;
      const schritt = t => {
        if (tween !== mein) return;
        const k = Math.min(1, Math.max(0, (t - t0) / dauer)), e = 1 - Math.pow(1 - k, 3);
        v.s = von.s + (ziel.s - von.s) * e; v.tx = von.tx + (ziel.tx - von.tx) * e; v.ty = von.ty + (ziel.ty - von.ty) * e;
        klemmen(); o.render(v);
        if (k < 1) requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    },
    ganz(weich) { api.hin(o.w / 2, o.h / 2, grenzen().sMin, weich); },
    bild(x, y) { return [x * v.s + v.tx, y * v.s + v.ty]; },
    neu() { klemmen(); zeichnen(); },
  };
  karteGesten(el, ebene, { pan: api.pan, zoom: api.zoom });
  return api;
}

// ---------------------------------------------------------------------
// Einrichten (einmal): Ansicht, Knöpfe, Leiste, Landnamen
// ---------------------------------------------------------------------
function karteEinrichten() {
  const $ = id => document.getElementById(id);
  const ui = { box: $('weltkarte'), karte: $('wkKarte'), welt: $('wkWelt'), leinwand: $('karteBild'), orte: $('wkOrte'), leiste: $('wkLeiste'), zeit: $('wkZeit'),
    punkte: {}, namen: {}, groesse: {}, kompakt: false, uhrLaeuft: false };
  karteUi = ui;
  ui.welt.style.width = WK.W + 'px'; ui.welt.style.height = WK.H + 'px';
  ui.leinwand.width = WK.W; ui.leinwand.height = WK.H;
  ui.verdeckt = () => (karteHandy() ? { r: 0, b: ui.leiste.offsetHeight } : { r: ui.leiste.classList.contains('zu') ? 0 : ui.leiste.offsetWidth, b: 0 });
  ui.ans = karteAnsicht(ui.karte, ui.orte, { w: WK.W, h: WK.H, rand: ui.verdeckt, render: karteRender });
  ui.landnamen = landnamenEinrichten($('wkLandnamen'));
  if (karteHandy()) ui.leiste.classList.add('zu');
  $('wkGriff').addEventListener('click', () => { geraeusch('klick'); ui.leiste.classList.toggle('zu'); leisteGeaendert(); });
  const mitte = () => { const g = ui.ans.grenzen(); return [(g.W - g.rd.r) / 2, (g.H - g.rd.b) / 2]; };
  $('wkPlus').addEventListener('click', () => { const [x, y] = mitte(); ui.ans.zoom(1.35, x, y); });
  $('wkMinus').addEventListener('click', () => { const [x, y] = mitte(); ui.ans.zoom(1 / 1.35, x, y); });
  $('wkDorf').addEventListener('click', () => ui.ans.hin(WK.ORTE.dorf.x, WK.ORTE.dorf.y, null, true));
  // Handy: das Tal ist breiter als hoch; Mitte so, dass Dorf und Birkenhain im Bild bleiben
  $('wkGanz').addEventListener('click', () => (karteHandy() ? ui.ans.hin(322, WK.H / 2, ui.ans.grenzen().sMin, true) : ui.ans.ganz(true)));
  // Kein Rad und kein Finger auf der Karte erreicht das Dorf darunter
  ui.box.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  window.addEventListener('resize', () => { if (karteSichtbar()) { ui.groesse = {}; leisteGeaendert(); } });
  return ui;
}
// Griff und verdeckter Rand nach dem Ein- oder Ausklappen der Leiste
function leisteGeaendert() {
  const ui = karteUi; if (!ui) return;
  const zu = ui.leiste.classList.contains('zu'), griff = document.getElementById('wkGriff');
  griff.textContent = karteHandy() ? (zu ? '▴' : '▾') : (zu ? '◂' : '▸');
  griff.setAttribute('aria-expanded', String(!zu));
  ui.box.style.setProperty('--blatt-h', (karteHandy() ? ui.leiste.offsetHeight : 0) + 'px');
  ui.box.style.setProperty('--steuer-r', (!karteHandy() && !zu ? ui.leiste.offsetWidth : 0) + 'px');
  ui.ans.neu();
}
// Startansicht: Desktop etwas größer als die Fläche um die Mitte des bekannten Tals, Handy füllt die freie Höhe, Dorf im Bild
function karteStartansicht() {
  const ans = karteUi.ans, g = ans.grenzen();
  const s = karteHandy() ? Math.max(1.22, (g.H - g.rd.b) / WK.H) : Math.max(2.3, Math.max(g.W / WK.W, g.H / WK.H) * 1.2);
  // Mitte wie im Entwurf, aber so, dass das Dorf mit seinem Namen immer im Bild ist (kleine Fenster)
  const d = WK.ORTE.dorf, cx = Math.min(karteHandy() ? 170 : 300, d.x + ((g.W - g.rd.r) / 2 - 90) / s), cy = Math.min(karteHandy() ? 262 : 245, d.y + ((g.H - g.rd.b) / 2 - 70) / s);
  ans.hin(cx, cy, s);
}

function karteRender(v) {
  const ui = karteUi;
  ui.welt.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
  orteSetzen(id => { const o = WK.ORTE[id]; return { x: o.x * v.s + v.tx, y: (o.y - 5) * v.s + v.ty }; });
  ui.landnamen((x, y) => ({ x: x * v.s + v.tx, y: y * v.s + v.ty }), v.s);
}

// Bild zur Uhrzeit, Farbe um die Karte, Sonne und Mond (weich, ohne Stufen)
function karteMalen() {
  const ui = karteUi, m = TZ.mischen(ui.leinwand, TZ.uhr.h), himmel = TZ.farbe(m, TZ.HIMMEL);
  ui.karte.style.background = himmel;
  const an = a => TZ.anteil(m, a), sonne = Math.min(1, an('tag') + an('morgen') + 0.55 * an('abend')), mond = Math.min(1, an('nacht') + 0.35 * an('abend'));
  ui.zeit.style.setProperty('--sonne', sonne.toFixed(3)); ui.zeit.style.setProperty('--mond', mond.toFixed(3)); ui.zeit.style.background = himmel;
  ui.zeit.title = TAGESZEIT_TITEL[TZ.artBei(TZ.uhr.h)];
  ui.box.dataset.licht = TZ.artBei(TZ.uhr.h);
}
// Die Uhr läuft nur bei offener Karte: ein Tag in 10 Minuten, neu gemalt höchstens alle 100 ms
function karteUhrStarten() {
  const ui = karteUi; if (ui.uhrLaeuft) return;
  ui.uhrLaeuft = true;
  let alt = 0, gemalt = 0;
  const tick = t => {
    if (!karteSichtbar()) { ui.uhrLaeuft = false; return; }
    if (alt) TZ.uhr.h = (TZ.uhr.h + Math.min(100, t - alt) / TZ.STUNDE_MS) % 24;
    alt = t;
    if (t - gemalt >= 100) { gemalt = t; karteMalen(); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
// Die übrigen Tageszeiten im Leerlauf malen, damit der Übergang später nicht stockt
function tageszeitenVorbereiten() {
  const reste = ['abend', 'nacht', 'morgen', 'tag'];
  const weiter = () => { if (!karteSichtbar()) return; const a = reste.shift(); if (!a) return; if (!TZ.bildFertig(a)) TZ.bild(a); setTimeout(weiter, 80); };
  setTimeout(weiter, 300);
}

// ---------------------------------------------------------------------
// Orte auf der Karte: Trefferfläche (44 px) und Name, Namen überlappen nie
// ---------------------------------------------------------------------
const pipsHtml = n => `<span class="pips" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'voll' : ''}"></i>`).join('')}</span>`;
function ortAriaText(id, z) {
  const o = ORTE[id];
  if (z === 'gesperrt') return o.gefahr ? TX`${o.name}, Gefahr ${o.gefahr} von 5, gesperrt` : TX`${o.name}, gesperrt`;
  return o.gefahr ? TX`${o.name}, Gefahr ${o.gefahr} von 5` : TX`${o.name}, sicher`;
}
function orteBauen() {
  const ui = karteUi, ebene = ui.orte;
  ebene.textContent = ''; ui.punkte = {}; ui.namen = {}; ui.groesse = {};
  WK.IDS.forEach(id => {
    const o = ORTE[id], z = kartenZustand(id);
    if (z !== 'offen' && z !== 'gesperrt') return;   // unbekannt: nur Nebel im Bild
    const anf = z === 'offen' && !!anfrageBei(id);
    const p = document.createElement('button'); p.type = 'button'; p.dataset.ort = id;
    p.className = 'ort-punkt ' + z + (o.gefahr ? '' : ' sicher') + (o.geheim ? ' geheim' : '') + (id === 'dorf' ? ' heim' : '') + (anf ? ' anfrage' : '');
    p.setAttribute('aria-label', ortAriaText(id, z));
    p.innerHTML = '<span class="ring"></span>' + (z === 'gesperrt' ? '<span class="schloss" aria-hidden="true"></span>' : '') + (anf ? '<span class="ruf" aria-hidden="true">!</span>' : '');
    p.addEventListener('click', () => ortWaehlen(id));
    const n = document.createElement('div'); n.className = 'ort-name ' + z + (o.geheim ? ' geheim' : ''); n.dataset.ort = id;
    let zeile2 = z === 'gesperrt' ? `<span class="wort-gesperrt">${esc(TX`ab Epoche ${o.abEpoche + 1}`)}</span>`
      : o.gefahr ? pipsHtml(o.gefahr) : `<span class="wort-sicher">${esc(o.handel ? TX('Handel · sicher') : TX('sicher'))}</span>`;
    if (anf) zeile2 = `<span class="wort-lazi">${esc(TX('! Anfrage'))}</span>` + zeile2;
    n.innerHTML = `<b class="lang-n">${esc(o.name)}</b><b class="kurz-n">${esc(KARTE_KURZ[id] || o.name)}</b><span class="zeile2">${zeile2}</span>`;
    n.addEventListener('click', () => ortWaehlen(id));
    ebene.append(p, n);
    ui.punkte[id] = p; ui.namen[id] = n;
  });
  karteMarkieren();
}
function karteMarkieren() {
  if (!karteUi) return;
  for (const id in karteUi.punkte) { karteUi.punkte[id].classList.toggle('gewaehlt', id === kartenAuswahl); karteUi.namen[id].classList.toggle('gewaehlt', id === kartenAuswahl); }
}
function ortWaehlen(id) {
  kartenAuswahl = id; geraeusch('klick'); kartenInfo();
  // Liegt der Ort am Rand oder unter der Leiste, fährt die Karte hin
  const ans = karteUi.ans, o = WK.ORTE[id], [x, y] = ans.bild(o.x, o.y), g = ans.grenzen();
  if (x < 60 || y < 60 || x > g.W - g.rd.r - 60 || y > g.H - g.rd.b - 60) ans.hin(o.x, o.y, null, true);
}
// bild(id) -> { x, y } in Bildschirmpixeln der Ebene. Danach die Namen ohne Überlappung setzen.
function orteSetzen(bild) {
  const ui = karteUi, ebene = ui.orte, W = ebene.clientWidth, H = ebene.clientHeight, ids = Object.keys(ui.punkte), lagen = {};
  // Liegen die Orte auf dem Bildschirm eng (weit herausgezoomt), zeigen die Namen nur die Kurzform
  const sicht = ids.map(bild);
  let eng = 1e9; sicht.forEach((a, i) => sicht.forEach((b, j) => { if (i < j) eng = Math.min(eng, Math.hypot(a.x - b.x, a.y - b.y)); }));
  const kompakt = eng < 120;
  if (kompakt !== ui.kompakt) { ui.kompakt = kompakt; ebene.classList.toggle('kompakt', kompakt); }
  ids.forEach(id => { const q = bild(id); lagen[id] = q; ui.punkte[id].style.transform = `translate(${Math.round(q.x)}px, ${Math.round(q.y)}px)`; });
  // Hindernisse: alle Punkte, Bedienknöpfe, Sonne/Mond und die Leiste
  const belegt = [], er = ebene.getBoundingClientRect();
  ids.forEach(id => { const q = lagen[id]; belegt.push({ x: q.x - 18, y: q.y - 18, w: 36, h: 36 }); });
  ui.box.querySelectorAll('.wk-steuer, .wk-leiste, .leiste-griff, .wk-zeit').forEach(el => { const b = el.getBoundingClientRect(); if (b.width) belegt.push({ x: b.left - er.left, y: b.top - er.top, w: b.width, h: b.height }); });
  const schneidet = r => belegt.some(s => r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y);
  // Liegt der Punkt im Bild, muss auch sein Name ganz im Bild stehen
  const RAND = 4, innen = r => r.x >= RAND && r.y >= RAND && r.x + r.w <= W - RAND && r.y + r.h <= H - RAND;
  const klemm = r => ({ ...r, x: Math.max(RAND, Math.min(W - RAND - r.w, r.x)), y: Math.max(RAND, Math.min(H - RAND - r.h, r.y)) });
  const rang = id => (id === kartenAuswahl ? 100 : 0) + (id === 'dorf' ? 50 : 0) + (kartenZustand(id) === 'offen' ? 20 : 10) + (ORTE[id].gefahr || 0);
  ids.sort((a, b) => rang(b) - rang(a)).forEach(id => {
    const n = ui.namen[id], q = lagen[id];
    n.classList.remove('versteckt');
    const gk = id + (kompakt ? '#k' : '');
    if (!ui.groesse[gk]) ui.groesse[gk] = { w: n.offsetWidth, h: n.offsetHeight };
    const { w, h } = ui.groesse[gk], abst = 20;
    const kand = [[-w / 2, abst], [-w / 2, -abst - h], [abst, -h / 2], [-abst - w, -h / 2], [abst - 6, abst - 8], [-w - abst + 6, abst - 8], [abst - 6, -abst - h + 8], [-w - abst + 6, -abst - h + 8]];
    const roh = kand.map(([dx, dy]) => ({ x: q.x + dx, y: q.y + dy, w, h }));
    const imBild = q.x >= 0 && q.y >= 0 && q.x <= W && q.y <= H;
    const versuche = imBild
      ? roh.filter(innen).concat(roh.map(klemm).filter(r => Math.abs(r.x + r.w / 2 - q.x) <= r.w / 2 + abst && Math.abs(r.y + r.h / 2 - q.y) <= r.h / 2 + abst + 4))
      : [];
    let gesetzt = null;
    for (const r of versuche) if (!schneidet(r)) { gesetzt = r; break; }
    if (!gesetzt && id === kartenAuswahl && imBild) gesetzt = klemm({ x: q.x - w / 2, y: q.y + abst, w, h });
    if (!gesetzt) { n.classList.add('versteckt'); return; }
    belegt.push({ x: gesetzt.x - 2, y: gesetzt.y - 2, w: gesetzt.w + 4, h: gesetzt.h + 4 });
    n.style.transform = `translate(${Math.round(gesetzt.x)}px, ${Math.round(gesetzt.y)}px)`;
  });
}

// ---------------------------------------------------------------------
// Namen der Landstriche als Schilder (Größe begrenzt, nie unter Ortsnamen, nie am Rand angeschnitten)
// ---------------------------------------------------------------------
function landnamenEinrichten(ebene) {
  const el = {}, mass = {};
  WK.RIDS.forEach(rid => {
    const d = document.createElement('div'), R = WK.REGIONEN[rid];
    d.className = 'landname'; d.classList.add('weg'); if (rid === 'felder') d.classList.add('prolog'); d.dataset.rid = rid;
    d.style.setProperty('--ls', `rgb(${R.farbe.map(c => Math.round(c * 0.5 + 120)).join(',')})`);
    d.innerHTML = `<b>${esc(LANDSTRICH_NAME[rid])}</b>` + (rid === 'felder' ? `<small><i></i>${esc(TX('Prolog · Übung'))}</small>` : '');
    ebene.append(d); el[rid] = d;
  });
  const reihe = ['felder', ...WK.RIDS.filter(r => r !== 'felder')];   // Felder zuerst (Prolog)
  return function setzen(proj, massstab) {
    const W = ebene.clientWidth, H = ebene.clientHeight, er = ebene.getBoundingClientRect(), rd = karteUi.verdeckt();
    const handy = karteHandy(), px = Math.max(handy ? 8 : 10, Math.min(handy ? 12 : 14, Math.round(8 * massstab)));
    const hin = [];
    karteUi.box.querySelectorAll('.ort-punkt, .ort-name, .wk-steuer, .wk-zeit, .wk-leiste, .leiste-griff').forEach(e => {
      if (e.classList.contains('versteckt')) return;
      const b = e.getBoundingClientRect(); if (b.width) hin.push({ x: b.left - er.left - 3, y: b.top - er.top - 3, w: b.width + 6, h: b.height + 6 });
    });
    const x0 = 4, y0 = 4, x1 = W - rd.r - 4, y1 = H - rd.b - 4;
    const frei = r => r.x >= x0 && r.y >= y0 && r.x + r.w <= x1 && r.y + r.h <= y1 && !hin.some(s => r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y);
    reihe.forEach(rid => {
      const d = el[rid], anker = [WK.NAMENSORT[rid], ...(WK.NAMENSORT_NOCH[rid] || [])];
      if (d.dataset.px !== String(px)) { d.style.fontSize = px + 'px'; d.dataset.px = px; delete mass[rid]; }
      let gesetzt = null;
      for (const a of anker) {
        const q = proj(...a);
        if (q.x < x0 || q.y < y0 || q.x > x1 || q.y > y1) continue;
        d.classList.remove('weg');
        if (!mass[rid]) mass[rid] = { w: d.offsetWidth, h: d.offsetHeight };
        const { w, h } = mass[rid], st = h + 6;
        for (const [dx, dy] of [[0, 0], [0, -st], [0, st], [-(w / 2 + 10), 0], [w / 2 + 10, 0], [-(w / 2 + 10), -st], [w / 2 + 10, -st], [-(w / 2 + 10), st], [w / 2 + 10, st], [0, -2 * st], [0, 2 * st]]) {
          const r = { x: q.x - w / 2 + dx, y: q.y - h / 2 + dy, w, h };
          r.x = Math.max(x0, Math.min(x1 - w, r.x)); r.y = Math.max(y0, Math.min(y1 - h, r.y));   // Anker im Bild: ganz hineinschieben
          if (Math.abs(r.x + w / 2 - q.x) > w / 2 + 40 || Math.abs(r.y + h / 2 - q.y) > 2 * st + 4) continue;
          if (frei(r)) { gesetzt = r; break; }
        }
        if (gesetzt) break;
      }
      if (!gesetzt) { d.classList.add('weg'); return; }
      hin.push({ x: gesetzt.x - 4, y: gesetzt.y - 4, w: gesetzt.w + 8, h: gesetzt.h + 8 });
      d.style.transform = `translate(${Math.round(gesetzt.x)}px, ${Math.round(gesetzt.y)}px)`;
    });
  };
}

// ---------------------------------------------------------------------
// Bildschirm der Weltkarte
// ---------------------------------------------------------------------
function weltkarteZeigen() {
  const box = document.getElementById('weltkarte');
  document.getElementById('kTag').textContent = TX`Tag ${SPIEL.tag}`;
  document.getElementById('kVorrat').innerHTML = vorratHtml(['gold', 'holz', 'stein', 'nahrung', 'teile']);
  if (!WK.bekannt(kartenAuswahl)) kartenAuswahl = 'dorf';
  const erst = !karteUi, warOffen = !box.hidden;
  box.hidden = false;
  document.getElementById('dorfUi').hidden = true;
  if (erst) karteEinrichten();
  if (!warOffen) TZ.uhr.h = dorfUhrAlsStunde();
  karteMalen();   // rechnet, was die Vorbereitung im Leerlauf noch nicht geschafft hat
  orteBauen();
  kartenInfo();
  if (erst) karteStartansicht();
  karteUhrStarten();
  tageszeitenVorbereiten();
}
function weltkarteSchliessen() {
  document.getElementById('weltkarte').hidden = true;
  if (modus === 'dorf') document.getElementById('dorfUi').hidden = false;
}

// Farben der Karte (gleiche Bedeutung überall)
const karteLegendeHtml = () => `<div class="legende" aria-label="${esc(TX('Farben der Karte'))}">
  <span><i class="lg-auswahl"></i>${esc(TX('Auswahl'))}</span><span><i class="lg-gefahr"></i>${esc(TX('Gefahr'))}</span>
  <span><i class="lg-sicher"></i>${esc(TX('Sicher'))}</span><span><i class="lg-lazi"></i>${esc(TX('Lazi, Verbund'))}</span>
  <span><i class="lg-geheim"></i>${esc(TX('Geheim'))}</span><span><i class="lg-gesperrt"></i>${esc(TX('Gesperrt'))}</span>
  <span><i class="lg-nebel"></i>${esc(TX('Unbekannt'))}</span></div>`;
// Zu welchem Landstrich der Ort gehört und was dort noch liegt
function landstrichHtml(id) {
  const rid = WK.ORT_REGION[id], R = WK.REGIONEN[rid];
  if (!R) return '';
  const andere = WK.IDS.filter(q => q !== id && WK.ORT_REGION[q] === rid && WK.bekannt(q)).map(q => KARTE_KURZ[q] || ORTE[q].name);
  return `<p class="landstrich" style="--ls-farbe: rgb(${R.farbe.join(',')})"><span>${esc(TX('Landstrich'))}</span><b>${esc(LANDSTRICH_NAME[rid])}</b>${andere.length ? `<small>${esc(TX`Hier auch: ${andere.join(', ')}`)}</small>` : ''}</p>`;
}
const landstrichListeHtml = hier => `<div class="landstriche" aria-label="${esc(TX('Landstriche'))}"><b>${esc(TX('Landstriche, vom Dorf nach außen'))}</b>${LANDSTRICH_REIHE.map(rid => `<span${rid === hier ? ' class="hier"' : ''}><i style="background:rgb(${WK.REGIONEN[rid].farbe.join(',')})"></i>${esc(LANDSTRICH_NAME[rid])}${rid === 'felder' ? ` <em class="prolog-tag">${esc(TX('Prolog'))}</em>` : ''}</span>`).join('')}</div>`;
// Die Felder sind der Ort von Prolog und Übung
const prologHinweisHtml = () => `<p class="prolog-hinweis"><i aria-hidden="true"></i><span><b>${esc(TX('Hier beginnt die Geschichte'))}</b>${esc(TX('Prolog und Übung'))}</span></p>`;

function kartenInfo() {
  const id = kartenAuswahl, o = ORTE[id], p = document.getElementById('karteInfo');
  karteMarkieren();
  const besuche = SPIEL.karte.besucht[id] || 0, siege = SPIEL.karte.erledigt[id] || 0;
  const zeilen = [];
  // Was es dort gibt, weiß man erst, wenn man einmal dort war
  const bekanntGenug = id === 'dorf' || besuche > 0;
  if (bekanntGenug && o.ressourcen) zeilen.push([TX('Ressourcen'), o.ressourcen]);
  if (bekanntGenug && o.plaene) zeilen.push([TX('Weitere Pläne'), o.plaene]);
  if (!bekanntGenug) zeilen.push([TX('Ressourcen'), TX('Unbekannt. Du warst noch nie dort.')]);
  if (o.mission || o.handel) zeilen.push([TX('Besuche'), besuche ? besuche + (o.mission ? ' ' + TX`(${siege} erfolgreich)` : '') : TX('noch nie')]);
  if (o.handel) zeilen.push([TX('Beziehung'), beziehungText(SPIEL.beziehungen[id] || 0)]);
  const spaeher = id !== 'dorf' && (o.mission || o.handel) ? spaeherZeile(id) : null;
  if (spaeher) zeilen.push(spaeher);
  if (id === 'stadt' && SPIEL.karte.fuchs) zeilen.push([TX('Gerücht'), TX('Der Fuchs wurde gesehen! Diesmal wartet kein Bunker, sondern die Jagd auf ihn.')]);
  const gesperrt = o.abEpoche && !regel('alleOrteOffen') && SPIEL.epoche < o.abEpoche;
  let aktionen = '';
  if (id === 'dorf') aktionen = TX('<button class="btn" data-a="heim" type="button">Zurück ins Dorf</button>');
  else if (gesperrt) aktionen = TX`<p class="note">Dafür ist dein Dorf noch nicht bereit. Ab Epoche ${o.abEpoche + 1}.</p>`;
  else if (o.status === 'offen' && o.mission) aktionen = '<button class="btn" data-a="reisen" type="button">' + (id === 'kraftwerk' && stromFrei() ? TX('Das Kraftwerk erneut säubern · 1 Tag') : id === 'lazifabrik' && fabrikFrei() ? TX('Die Werkhalle erneut säubern · 1 Tag') : TX('Hinreisen · 1 Tag')) + '</button>';
  if (id === 'kraftwerk') aktionen = stromKarteHtml() + aktionen;
  if (id === 'lazifabrik') aktionen = fabrikKarteHtml() + aktionen;
  else if (o.status === 'bald') aktionen = TX('<p class="note">Diesen Ort kannst du in einer späteren Version besuchen.</p>');
  // Anfrage eines Verbunds oder seltene Mission an diesem Ort
  const anf = anfrageBei(id);
  if (anf && !gesperrt) {
    const m = MISSIONEN[anf.mission], rest = anf.bis - SPIEL.tag;
    aktionen = TX`<div class="anfrage-box"><span class="label">${anf.art === 'verbund' ? TX`Anfrage · Verbund ${CLUSTER[anf.verbund].name}` : TX('Seltene Gelegenheit')}</span>
      <b>${esc(m.titel)}</b><p class="note">${esc(anfrageText(anf))} ${esc(rest === 1 ? TX('Nur noch heute.') : TX`Noch ${rest} Tage.`)}</p>
      <button class="btn" data-a="anfrage" type="button">Annehmen und hinreisen · 1 Tag</button></div>` + aktionen;
  }
  if (o.handel) {
    if ((SPIEL.beziehungen[id] || 0) < 0) aktionen += TX('<p class="note">Sie wollen nicht mit dir handeln. Vielleicht hilft eine Kirche, die euer Ansehen verbessert.</p>');
    else aktionen += TX('<button class="btn" data-a="handeln" type="button">Hinreisen und handeln · 1 Tag</button>');
  }
  if (id === 'wald' && siege > 0 && !SPIEL.aussenposten.wald) {
    const frei = dorfWerte().frei >= AUSSENPOSTEN.arbeiter;
    aktionen += TX`<div class="aussenposten"><b>Außenposten bauen</b><p class="note">+${AUSSENPOSTEN.proTag.holz} Holz, +${AUSSENPOSTEN.proTag.stein} Stein, +${AUSSENPOSTEN.proTag.nahrung} Nahrung pro Tag · ${kostenHtml(AUSSENPOSTEN.kosten)} · ${AUSSENPOSTEN.arbeiter} Arbeiter</p>
      <button class="btn small" data-a="posten" type="button" ${kannBezahlen(AUSSENPOSTEN.kosten) && frei ? '' : 'disabled'}>Bauen</button></div>`;
  }
  if (id === 'schleuse') aktionen += anlegerKarteHtml();
  if (id === 'wald') aktionen += erzWaldHtml();
  if (id === 'wald' && SPIEL.aussenposten.wald) aktionen += TX`<p class="note">Dein Außenposten liefert jeden Tag ${AUSSENPOSTEN.proTag.holz} Holz, ${AUSSENPOSTEN.proTag.stein} Stein und ${AUSSENPOSTEN.proTag.nahrung} Nahrung.</p>`;
  // Kopf: Gefahr (rot), sicher (grün), geheim (violett), gesperrt (grau)
  let status = o.geheim ? `<span class="wort-geheim">${esc(TX('Geheimmission'))}</span>${o.gefahr ? pipsHtml(o.gefahr) : ''}`
    : o.gefahr ? `<span>${esc(TX`Gefahr ${o.gefahr} von 5`)}</span>${pipsHtml(o.gefahr)}` : `<span class="wort-sicher">${esc(TX('Sicher'))}</span>`;
  if (gesperrt) status += `<span class="wort-gesperrt">· ${esc(TX('gesperrt'))}</span>`;
  p.innerHTML = `<div class="leiste-kopf"><div class="status">${status}</div><h2>${esc(o.name)}</h2></div>
    <div class="leiste-inhalt">
      <p class="story">${esc(o.text)}</p>
      ${zeilen.length ? '<dl class="facts">' + zeilen.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('') + '</dl>' : ''}
      ${landstrichHtml(id)}${WK.ORT_REGION[id] === 'felder' ? prologHinweisHtml() : ''}${karteLegendeHtml()}${landstrichListeHtml(WK.ORT_REGION[id])}
    </div>
    <div class="karte-aktionen">${aktionen}</div>`;
  const q = s => p.querySelector(s);
  if (q('[data-a="heim"]')) q('[data-a="heim"]').addEventListener('click', weltkarteSchliessen);
  if (q('[data-a="reisen"]')) q('[data-a="reisen"]').addEventListener('click', () => reiseBeginnen(id));
  if (q('[data-a="anfrage"]')) q('[data-a="anfrage"]').addEventListener('click', () => reiseBeginnen(id, anfrageAnnehmen(id)));
  if (q('[data-a="anleger"]')) q('[data-a="anleger"]').addEventListener('click', anlegerBauen);
  if (q('[data-a="umruesten"]')) q('[data-a="umruesten"]').addEventListener('click', erzUmruesten);
  if (q('[data-a="posten"]')) q('[data-a="posten"]').addEventListener('click', () => {
    bezahlen(AUSSENPOSTEN.kosten); SPIEL.aussenposten.wald = true; spielSpeichern(); geraeusch('bauen');
    meldung(TX('Außenposten im dunklen Wald'), TX('Er liefert ab morgen Rohstoffe'), 2000); weltkarteZeigen();
  });
  if (q('[data-a="handeln"]')) q('[data-a="handeln"]').addEventListener('click', () => handelsreise(id));
  p.querySelectorAll('[data-bestellung]').forEach(b => b.addEventListener('click', () => fabrikBestellen(Number(b.dataset.bestellung))));
  p.querySelectorAll('[data-strom]').forEach(b => b.addEventListener('click', () => stromLieferung(Number(b.dataset.strom))));
  if (karteSichtbar()) leisteGeaendert();   // Handy: Höhe des Blatts kann sich geändert haben
}

// ---------------------------------------------------------------------
// Handel in den Nachbardörfern: hinreisen (ein Tag vergeht), mehrere Händler
// ---------------------------------------------------------------------
function handelsPreis(gib, ort) {
  const depot = SPIEL.gebaeude.find(b => b.typ === 'lastlaeuferdepot');
  const rel = SPIEL.beziehungen[ort] || 0, mal = (rel >= 3 ? 0.8 : rel >= 1 ? 0.9 : 1) * verbundHandelMal() * (depot ? stufeVon(depot).handel : 1) * (MARKT_AKTIV ? marktRabatt() : 1) * (flussrouteOffen() && !['uns', 'hand'].includes(flussWahl()) ? FLUSSROUTE.handel : 1), deckel = Math.max(0.5, mal);   // Alle Rabatte zusammen höchstens auf die Hälfte des Preises (Inhaber, 07.11.2026)
  const k = {};
  for (const r in gib) k[r] = Math.max(1, Math.round(gib[r] * deckel));
  return k;
}
function handelsreise(ort) {
  document.getElementById('weltkarte').hidden = true;
  const erst = !(SPIEL.karte.besucht[ort] || 0);
  SPIEL.karte.besucht[ort] = (SPIEL.karte.besucht[ort] || 0) + 1;
  // Mit Lastläufer-Depot holen die Lastläufer die Ware: Es vergeht kein Tag
  const bericht = gebaeudeWert('depot') === true ? [TX('Die Lastläufer aus dem Depot holen die Ware. Dafür vergeht kein Tag.')] : tagVergeht();
  spielSpeichern(); dorfHudAktualisieren();
  const vorrat = {};   // jedes Angebot gibt es dreimal pro Besuch
  const markt = () => handelZeigen(ort, vorrat, bericht);
  if (erst && ERSTEINDRUCK[ort]) gespraechZeigen(TX`Erster Besuch in ${ORTE[ort].name}`, ERSTEINDRUCK[ort], markt);
  else markt();
}
// fertig: Auf dem Markt von Altbrück geht es danach zurück auf den Platz statt nach Hause
function handelZeigen(ort, vorrat, bericht, fertig) {
  const rel = SPIEL.beziehungen[ort] || 0;
  const text = k => Object.keys(k).map(r => `<span class="kost">${k[r]}${rsym(r, r === 'einwohner' ? TX('Einwohner') : null)}</span>`).join(' + ');
  const platz = dorfWerte().platz - SPIEL.einwohner;
  const haendler = (ort === 'karawane' ? karawaneAuftragHtml() : '') + HAENDLER[ort].map((h, hi) => {
    const zu = h.braucht && rel < h.braucht;
    return `<div class="haendler"><b>${esc(h.name)}</b><p class="note">${esc(zu ? h.zuText || TX('Mit Fremden machen wir solche Geschäfte nicht. Werdet erst mal freundlich mit uns.') : h.text)}</p>
      ${zu ? '' : h.angebote.map((a, ai) => {
        const key = hi + '-' + ai, rest = vorrat[key] === undefined ? 3 : vorrat[key], gib = handelsPreis(a.gib, ort);
        const voll = a.nimm.einwohner && platz < a.nimm.einwohner;
        return `<button class="btn small ghost" type="button" data-h="${key}" ${rest > 0 && kannBezahlen(gib) && !voll ? '' : 'disabled'}>${text(gib)} → ${text(a.nimm)}<small>${voll ? TX('kein Wohnraum') : TX`noch ${rest}×`}</small></button>`;
      }).join('')}</div>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="hd">
    <div class="label">Tag ${SPIEL.tag} · Beziehung: ${esc(beziehungText(rel))}${rel >= 1 ? TX(' · bessere Preise') : ''}</div>
    <h1 id="hd">${ort === 'karawane' ? TX('Die Karawane Rostrot') : fertig ? esc(TX`Stand aus ${ORTE[ort].name}`) : esc(TX`Markttag in ${ORTE[ort].name}`)}</h1>
    <p class="note">Du hast ${vorratHtml(['gold', 'holz', 'stein', 'nahrung', 'holzkohle', 'teile'])}. Jeder Handel verbessert eure Beziehung.</p>
    ${vorrat.bilanz && Object.keys(vorrat.bilanz).length ? TX`<p class="note">Heute gehandelt: ${bilanzHtml(vorrat.bilanz)}</p>` : ''}
    <div class="haendler-liste">${haendler}</div>
    ${bericht && bericht.length ? tagesberichtHtml(bericht, TX('Daheim ist ein Tag vergangen')) : ''}
    <button class="btn" data-a="heim" type="button">${fertig ? TX('Zurück auf den Platz') : ort === 'karawane' ? TX('Fertig') : TX('Heimreisen')}</button>
  </div>`);
  if (ort === 'karawane') karawaneAuftragKnoepfe(() => handelZeigen(ort, vorrat, bericht, fertig));
  overlay.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => {
    const [hi, ai] = b.dataset.h.split('-').map(Number), a = HAENDLER[ort][hi].angebote[ai], gib = handelsPreis(a.gib, ort);
    if (!kannBezahlen(gib)) return;
    bezahlen(gib);
    if (a.nimm.einwohner) SPIEL.einwohner += a.nimm.einwohner;
    gutschreiben(Object.fromEntries(Object.entries(a.nimm).filter(([r]) => r !== 'einwohner')));
    // Bilanz des Markttags: was rein- und rausging
    const bil = vorrat.bilanz = vorrat.bilanz || {};
    for (const r in gib) bil[r] = (bil[r] || 0) - gib[r];
    for (const r in a.nimm) bil[r] = (bil[r] || 0) + a.nimm[r];
    dorfHudAktualisieren();
    vorrat[b.dataset.h] = (vorrat[b.dataset.h] === undefined ? 3 : vorrat[b.dataset.h]) - 1;
    SPIEL.beziehungen[ort] = Math.min(5, rel + 0.3);
    // Auf dem Markt steigt dazu das Ansehen (nur die ersten Geschäfte am Tag zählen)
    if (fertig && G && G.auftrag && G.auftrag.handel < MARKT.ansehen.maxHandelProBesuch) { G.auftrag.handel++; marktAnsehen(MARKT.ansehen.handel); }
    spielSpeichern(); geraeusch('muenze');
    handelZeigen(ort, vorrat, bericht, fertig);
  }));
  // Heimreisen führt ins Dorf, nicht zurück auf die Karte
  overlay.querySelector('[data-a="heim"]').addEventListener('click', () => {
    if (fertig) return fertig();
    overlayWeg(); weltkarteSchliessen(); dorfHudAktualisieren();
    if (vorrat.bilanz && Object.keys(vorrat.bilanz).length) meldung(TX`Zurück aus ${ORTE[ort].name}`, Object.keys(vorrat.bilanz).filter(r => vorrat.bilanz[r]).map(r => (vorrat.bilanz[r] > 0 ? '+' : '') + vorrat.bilanz[r] + ' ' + (ROHSTOFF_NAME[r] || TX('Einwohner'))).join(' · '), 3200);
    nachRueckkehr();
  });
}
function beziehungText(w) {
  if (w <= -2) return TX('feindselig');
  if (w < 0) return TX('misstrauisch');
  if (w < 1) return TX('neutral');
  if (w < 3) return TX('freundlich');
  return TX('verbündet');
}

// ---------------------------------------------------------------------
// Reise: Ereignis, Nachrichten, Briefing, Mission
// ---------------------------------------------------------------------
function reiseBeginnen(ort, mission) {
  REISE = { ort, leben: 1, mission: mission || null };
  document.getElementById('weltkarte').hidden = true;
  // Ob unterwegs etwas passiert, wird einmal pro Tag und Ort ausgewürfelt (der Späher kann es vorher sehen)
  const e = reiseEreignisFuer(ort);
  if (e) ereignisZeigen(e);
  else nachrichtenZeigen();
}

function ereignisZeigen(e) {
  const optionen = e.optionen.map((o, i) => `<button class="btn${i ? ' ghost' : ''}" data-o="${i}" type="button" ${o.kosten && !kannBezahlen(o.kosten) ? 'disabled' : ''}>${esc(o.text)}</button>`).join('');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ev">
    <div class="label">Unterwegs nach ${esc(ORTE[REISE.ort].name)}</div>
    <h1 id="ev">${esc(e.titel)}</h1>
    <p class="story">${esc(e.text)}</p>
    <div class="ereignis-optionen">${optionen}</div>
  </div>`);
  overlay.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
    const o = e.optionen[Number(b.dataset.o)];
    if (o.kosten) bezahlen(o.kosten);
    let folge = o.folge;
    if (o.zufall) { let z = Math.random(); folge = o.zufall.find(f => (z -= f.chance) < 0).folge || o.zufall[0].folge; }
    const zeilen = folgeAnwenden(folge);
    spielSpeichern();
    overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ev2">
      <div class="label">${esc(e.titel)}</div>
      <h1 id="ev2">${esc(o.text.replace(/ \(.*\)$/, ''))}</h1>
      <p class="story">${esc(folge.text)}</p>
      ${zeilen.length ? '<ul class="folgen">' + zeilen.map(z => `<li>${esc(z)}</li>`).join('') + '</ul>' : ''}
      <button class="btn" data-a="weiter" type="button">Weiterreisen</button>
    </div>`);
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', nachrichtenZeigen);
  }));
}

function folgeAnwenden(f) {
  const z = [];
  ['gold', 'holz', 'stein', 'nahrung', 'teile'].forEach(r => { if (f[r]) { SPIEL[r] = Math.max(0, SPIEL[r] + f[r]); z.push((f[r] > 0 ? '+' : '') + f[r] + ' ' + ROHSTOFF_NAME[r]); } });
  if (f.leben) { REISE.leben = Math.min(REISE.leben, f.leben); z.push(TX`Du beginnst die Mission mit ${Math.round(f.leben * 100)} % Leben`); }
  if (f.beziehung) Object.keys(f.beziehung).forEach(o => {
    SPIEL.beziehungen[o] = (SPIEL.beziehungen[o] || 0) + f.beziehung[o];
    if (f.beziehung[o]) z.push((f.beziehung[o] > 0 ? TX`${ORTE[o].name}: Beziehung besser` : TX`${ORTE[o].name}: Beziehung schlechter`));
  });
  if (f.entdecken && !SPIEL.karte.bekannt.includes(f.entdecken)) { SPIEL.karte.bekannt.push(f.entdecken); z.push(TX('Neu auf der Karte: ') + ORTE[f.entdecken].name); }
  if (f.lore && chronikEintragen(f.lore)) z.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === f.lore).titel);
  return z;
}

// Nachrichten wie Funksprüche, eine nach der anderen
function nachrichtenZeigen() {
  const ort = REISE.ort, erst = !(SPIEL.karte.besucht[ort] || 0);
  if (!regel('nachrichten')) { missionsBriefing(ort); return; }
  if (erst && ERSTEINDRUCK[ort] && !REISE.eindruck) { REISE.eindruck = true; gespraechZeigen(TX('Erster Besuch: ') + ORTE[ort].name, ERSTEINDRUCK[ort], nachrichtenZeigen); return; }
  // Wählt der Ort selbst eine andere Mission (der Fuchs statt eines Bunkers), gelten deren eigene Sätze
  const gewaehlt = REISE.mission || (ORTE[ort].missionWahl && ortMission(ort) !== ORTE[ort].mission ? ortMission(ort) : null);
  let liste = gewaehlt && NACHRICHTEN[gewaehlt] ? NACHRICHTEN[gewaehlt] : REISE.mission ? null : NACHRICHTEN[ort + '_erst'] && erst ? NACHRICHTEN[ort + '_erst'] : NACHRICHTEN[ort];
  if (liste && Array.isArray(liste[0][0])) {
    const passend = liste.filter(g => g.every(([wer]) => figurDa(wer)));
    liste = passend.length ? passend[Math.floor(Math.random() * passend.length)] : null;
  }
  if (!liste || (!erst && Math.random() < 0.4)) { missionsBriefing(ort); return; }
  let i = 0;
  const zeige = () => {
    const [wer, text] = liste[i], p = PERSONEN[wer];
    overlayZeigen(TX`<div class="card panel nachricht" role="dialog" aria-labelledby="na">
      <div class="label">Nachricht ${i + 1} von ${liste.length}</div>
      <div class="nachricht-zeile">
        <canvas class="portrait" width="18" height="27" aria-hidden="true" style="border-color:${p.farbe}"></canvas>
        <div class="nachricht-text"><b id="na" style="color:${p.farbe}">${esc(p.name)}</b><span class="label">${esc(p.rolle)}</span><p class="${wer === 'funk' ? 'funk' : ''}">${esc(text)}</p></div>
      </div>
      <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">${i < liste.length - 1 ? TX('Weiter') : TX('Zur Mission')}</button>
      <button class="btn ghost" data-a="ueberspringen" type="button">Überspringen</button></div>
    </div>`);
    portraitMalen(overlay.querySelector('.portrait'), wer);
    geraeusch('klick');
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => { i++; if (i < liste.length) zeige(); else missionsBriefing(ort); });
    overlay.querySelector('[data-a="ueberspringen"]').addEventListener('click', () => missionsBriefing(ort));
  };
  zeige();
}
function portraitMalen(c, wer) {
  if (neueGrafik() && neuesPortrait(c, wer === 'erzaehler' && SPIEL && SPIEL.klasse ? '@held' : wer)) return;
  // Der Erzähler ist der Spieler selbst: dann zeigt das Bild die eigene Klasse
  if (wer === 'erzaehler' && SPIEL && SPIEL.klasse) {
    const w = aktuelleWaffe(), q = BILD.held[bildKlasse(SPIEL.klasse)][w.bild] || Object.values(BILD.held[bildKlasse(SPIEL.klasse)])[0];
    c.width = 24; c.height = 30;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0812'; g.fillRect(0, 0, 24, 30);
    g.drawImage(q.stand.quelle, 4, 0, 24, 30, 0, 1, 24, 30);
    return;
  }
  const g = c.getContext('2d');
  g.fillStyle = '#0a0812'; g.fillRect(0, 0, c.width, c.height);
  const n = PERSONEN[wer].bild, eigen = BILD.portrait && BILD.portrait[wer], quelle = eigen ? eigen[0] : n === null || n === undefined ? null : BILD.bewohner[n][0];
  if (quelle) g.drawImage(quelle.quelle, 0, 2);
  else { g.drawImage(BILD.teil.quelle, 4, 7, 9, 9); for (let y = 0; y < 27; y += 2) { g.fillStyle = 'rgba(95,240,224,0.12)'; g.fillRect(0, y, 18, 1); } }
}

// Chronik: alle gefundenen Lore-Fragmente
// Die Chronik: nach Kapiteln, jeder Eintrag in seiner Stimme, mit Randnotizen und Hinweisen auf das, was noch fehlt
const CHRONIK_STIMME = { ebert: TX('aufgeschrieben vom alten Ebert'), mara: TX('erzählt von Mara'), anselm: TX('erzählt von Bruder Anselm'), fund: TX('Fundstück'), funk: TX('Funkspruch'), fuchs: TX('Zettel des Fuchses'), kustos: TX('Antwort von KUSTOS') };
function chronikNeu() { return SPIEL.chronik.filter(id => !(SPIEL.chronikGelesen || []).includes(id)).length; }
function chronikZeigen(zurueck, kapitel) {
  const gelesen = SPIEL.chronikGelesen || [];
  const gefunden = id => SPIEL.chronik.includes(id);
  const wahl = kapitel || (KAPITEL.find(k => LORE.some(l => l.kapitel === k.id && gefunden(l.id) && !gelesen.includes(l.id))) || KAPITEL[0]).id;
  const reiter = KAPITEL.map(k => {
    const alle = loreAktiv().filter(l => l.kapitel === k.id), n = alle.filter(l => gefunden(l.id)).length, neu = alle.some(l => gefunden(l.id) && !gelesen.includes(l.id));
    return `<button type="button" class="chronik-reiter${k.id === wahl ? ' aktiv' : ''}${neu ? ' neu' : ''}" data-kapitel="${k.id}">${esc(k.titel)} <small>${n}/${alle.length}</small></button>`;
  }).join('');
  const K = KAPITEL.find(k => k.id === wahl);
  const eintrag = l => {
    if (!gefunden(l.id)) return `<div class="chronik-eintrag leer"><b>???</b><p>${esc(loreHinweis(l) || TX('Noch nicht gefunden.'))}</p></div>`;
    const p = PERSONEN[l.wer], stimme = CHRONIK_STIMME[l.wer] || '';
    const notizen = (l.nachtrag || []).filter(n => n.wenn()).map(n => `<p class="nachtrag"><span class="label">${esc(TX('Randnotiz von Ebert'))}</span>${esc(n.text)}</p>`).join('');
    return `<div class="chronik-eintrag stimme-${l.wer}">
      <div class="chronik-kopf"><b>${esc(l.titel)}</b>${gelesen.includes(l.id) ? '' : `<span class="chronik-neu">${esc(TX('Neu'))}</span>`}</div>
      <span class="label chronik-stimme"${p ? ` style="color:${p.farbe}"` : ''}>${esc(stimme)}</span>
      <p class="chronik-text">${esc(l.text)}</p>${notizen}</div>`;
  };
  overlayZeigen(TX`<div class="card panel chronik-karte" role="dialog" aria-labelledby="ch">
    <div class="label">${SPIEL.chronik.length} von ${loreAktiv().length} Einträgen${endenGefunden().length ? TX` · Enden gefunden: ${endenGefunden().length} von ${Object.keys(ENDEN).length}` : ''}</div>
    <h1 id="ch">Chronik</h1>
    <p class="note">Was der alte Ebert über die Welt zusammengetragen hat, und was andere dazugelegt haben. Manche Einträge bekommen später Randnotizen.</p>
    <div class="chronik-reiterleiste">${reiter}</div>
    <p class="note chronik-kapiteltext">${esc(K.text)}</p>
    <div class="chronik">${loreAktiv().filter(l => l.kapitel === wahl).map(eintrag).join('')}</div>
    <button class="btn" data-a="zu" type="button">Schließen</button>
  </div>`);
  // Was jetzt zu sehen war, gilt als gelesen
  SPIEL.chronikGelesen = gelesen.concat(loreAktiv().filter(l => l.kapitel === wahl && gefunden(l.id) && !gelesen.includes(l.id)).map(l => l.id));
  spielSpeichern();
  overlay.querySelectorAll('[data-kapitel]').forEach(b => b.addEventListener('click', () => { geraeusch('klick'); chronikZeigen(zurueck, b.dataset.kapitel); }));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { if (zurueck) zurueck(); else overlayWeg(); });
}

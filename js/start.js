// =====================================================================
// START: Hauptmenü, Spielstände, Wechsel zwischen Dorf und Mission
// und die Hauptschleife, die jedes Bild neu zeichnet.
// =====================================================================

let modus = 'titel';
const overlay = document.getElementById('overlay');
const hauptmenue = document.getElementById('hauptmenue');

function overlayZeigen(html) {
  overlay.innerHTML = html;
  overlay.hidden = false;
  const knopf = overlay.querySelector('.btn');
  if (knopf) knopf.focus({ preventScroll: true });
}
function overlayWeg() { overlay.hidden = true; overlay.innerHTML = ''; }

function alleOberflaechenAus() {
  ['hud', 'hint', 'touch', 'itemCard', 'technikLeiste', 'dorfUi', 'dorfLicht', 'infoPanel', 'weltkarte', 'nebel'].forEach(id => { document.getElementById(id).hidden = true; });
  hauptmenue.hidden = true;
}
// Die Bau-Leiste sitzt auf dem Handy direkt über den Knöpfen unten. Deren Höhe ändert sich mit Schrift und Text
// (z. B. „Held · Stufe 13“ in zwei Zeilen), deshalb wird sie gemessen statt geschätzt.
function knoepfeMessen() {
  const k = document.getElementById('dorfKnoepfe');
  if (k && k.offsetHeight) document.getElementById('dorfUi').style.setProperty('--knoepfe-h', k.offsetHeight + 'px');
}
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(knoepfeMessen).observe(document.getElementById('dorfKnoepfe'));

function modusDorf() {
  modus = 'dorf';
  zoomSetzen(Dorf.zoom);
  // Tasten aus der Mission nicht ins Dorf mitnehmen (sonst wandert die Kamera)
  for (const k in tasten) tasten[k] = false;
  szene = Dorf.szene;
  G = null;
  szeneEntsorgen(missionSzene); missionSzene = null;   // Die Mission ist vorbei, ihr Grafikspeicher wird frei
  alleOberflaechenAus();
  document.getElementById('dorfUi').hidden = false;
  document.getElementById('dorfLicht').hidden = false;
  leuteAnpassen();
  dorfHudAktualisieren();
  liedSpielen('dorf');
}
// Infoboxen einklappen: ein kleiner Knopf oben rechts, der Zustand bleibt gespeichert
const KLAPP = {
  held: '#hud .hud-l', ziel: '#hud .hud-c', beute: '#hud .hud-r', hint: '#hint', technik: '#technikLeiste',
  vorrat: '#dorfTop .ressourcen', epoche: '#dorfTop .epoche',
};
let klappZu = ablageJsonLesen(ABLAGE.klapp, {});
// Am Handy starten Ziele und Bau-Leiste eingeklappt, sonst bleibt vom Dorf kaum etwas zu sehen. Wer umstellt, behält seine Wahl.
if (window.matchMedia('(max-width: 560px)').matches) {
  if (klappZu.epoche === undefined) klappZu.epoche = true;
  const bau = document.getElementById('bauBereich'); if (bau) bau.classList.add('zu');
}
function klappenEinrichten() {
  for (const [key, sel] of Object.entries(KLAPP)) {
    const el = document.querySelector(sel);
    if (!el) continue;
    el.classList.add('klappbar');
    let k = el.querySelector(':scope > .klapp');
    if (!k) {
      k = document.createElement('button');
      k.type = 'button'; k.className = 'klapp';
      k.addEventListener('pointerdown', e => e.stopPropagation());
      k.addEventListener('click', e => {
        e.stopPropagation();
        klappZu[key] = !klappZu[key];
        ablageJsonSchreiben(ABLAGE.klapp, klappZu);
        klappenEinrichten();
      });
      el.prepend(k);
    }
    const zu = !!klappZu[key];
    el.classList.toggle('zu', zu);
    k.textContent = zu ? '+' : '–';
    k.setAttribute('aria-expanded', String(!zu));
    k.setAttribute('aria-label', zu ? TX('Box aufklappen') : TX('Box einklappen'));
  }
}
klappenEinrichten();

function modusMission() {
  modus = 'mission';
  zoomSetzen(neueGrafik() ? MISSION_ZOOM : 1);
  alleOberflaechenAus();
  document.getElementById('hud').hidden = false;
  document.getElementById('hint').hidden = istTouch;
  document.getElementById('touch').hidden = !istTouch;
}

// Tasten merken (für Laufen und Kamera)
addEventListener('keydown', e => {
  tasten[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && overlay.hidden) e.preventDefault();
});
addEventListener('keyup', e => { tasten[e.code] = false; });
addEventListener('blur', () => { for (const k in tasten) tasten[k] = false; });
// Im Hintergrund (anderer Tab, App minimiert) schweigt das Spiel, und eine laufende Mission pausiert
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (Ton.ctx && Ton.ctx.state === 'running') Ton.ctx.suspend();
    if (imSpiel()) pauseUmschalten();
  } else if (Ton.ctx && Ton.ctx.state === 'suspended') Ton.ctx.resume();
});

// ---------------------------------------------------------------------
// Titelbild: Lagerfeuer im Wald, die vier Klassen sitzen drumherum
// ---------------------------------------------------------------------
const Titel = { szene: null, zeit: 0, feuer: null };
function titelAufbauen() {
  szene = Titel.szene = new THREE.Scene();
  szene.background = new THREE.Color('#0a0c0c');
  const boden = malBoden(40, 16, (x, z) => Math.hypot(x, z * 1.2) < 3.2 ? 'erde' : Math.hypot(x, z) > 9 ? 'wald' : 'gras', {
    gras: ['#3e5a34', '#46643a', '#36502e', '#52703f'],
    wald: ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
    erde: ['#6a5038', '#76583e', '#5e4632', '#846446'],
  }, 11);
  streuGras(boden, (px, py) => boden.artBei(px, py) === 'gras', 900, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
  bodenMesh(boden, 40);
  const r = zufall(5);
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 7 + r() * 9;
    const t = figur(r() < 0.6 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], 1); stelle(t, Math.cos(a) * d * 1.4, Math.sin(a) * d);
  }
  Titel.feuer = figur(neueGrafik() ? BILD.feuerGross[0][0] : BILD.gebaeude.lagerfeuer[0], 0); stelle(Titel.feuer, 0, 0.3);
  [['ritter', 'schwert', -2.2, 0.6, 1], ['beschwoerer', 'stab', 2.2, 0.4, -1], ['architekt', 'hammer', -1.2, -1.3, 1], ['schatten', 'dolche', 1.4, -1.5, -1]].forEach(([k, w, x, z, blick]) => {
    const o = figur(BILD.held[k][w].stand, 0.45); zeige(o, BILD.held[k][w].stand, blick); stelle(o, x, z);
  });
}
function titelAktualisieren(dt) {
  Titel.zeit += dt;
  zeige(Titel.feuer, neueGrafik() ? BILD.feuerGross[0][Math.floor(Titel.zeit * 12) % 12] : BILD.gebaeude.lagerfeuer[Math.floor(Titel.zeit * 7) % 2], 1);
  kameraAuf(Math.sin(Titel.zeit * 0.08) * 2.5, -0.5 + Math.cos(Titel.zeit * 0.06) * 1);
}

// ---------------------------------------------------------------------
// Hauptmenü
// ---------------------------------------------------------------------
// Im Browser halten Spielstände als installierte App besser. Im Artifact (eingebettet) führt der Hinweis zur eigenen
// Adresse, dort am Handy zum Installieren. In PC- und Android-App und in der installierten Web-App erscheint nichts.
const WEB_ADRESSE = 'https://spicy019.github.io/lazi-spiel/';
function appHinweisZeigen() {
  const el = document.getElementById('hmApp');
  el.textContent = '';
  const installiert = navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  if (!/^https?:$/.test(location.protocol) || installiert) return;
  if (window.top !== window) {
    const a = document.createElement('a');
    a.href = WEB_ADRESSE; a.target = '_blank'; a.rel = 'noopener'; a.textContent = WEB_ADRESSE.replace('https://', '');
    el.append(TX('Als App behält das Spiel deine Stände zuverlässiger:') + ' ', a);
  } else if (istTouch) el.textContent = TX('Als App behält das Spiel deine Stände zuverlässiger. iPhone: Teilen → „Zum Home-Bildschirm“. Android: Browser-Menü → „Zum Startbildschirm“.');
  el.hidden = !el.textContent;
}
// Web-App: Eine neue Fassung ist da. Eine laufende Partie wird nicht unterbrochen.
let neueFassung = false;
function neueFassungBereit() {
  neueFassung = true;
  if (modus === 'titel') location.reload();
}
function hauptmenueZeigen() {
  document.getElementById('hmVersion').textContent = TX`Alpha ${SPIEL_VERSION} „Zwiespalt“ · Musik an und aus mit M`;
  appHinweisZeigen();
  if (SPIEL) spielSpeichern();
  if (neueFassung && !(SPIEL && SPIEL.laufend)) { location.reload(); return; }
  modus = 'titel';
  zoomSetzen(1);
  szene = Titel.szene;
  G = null;
  alleOberflaechenAus();
  overlayWeg();
  hauptmenue.hidden = false;
  const weiter = letzterStand();
  const knopfWeiter = document.getElementById('hmWeiter');
  knopfWeiter.hidden = !weiter;
  if (weiter) {
    const s = platzLesen(weiter.platz, weiter.modus);
    knopfWeiter.querySelector('small').textContent = TX`${MODI[weiter.modus].name} · ${platzKurz(s)}`;
  }
  liedSpielen('dorf');
}

function platzKurz(s) {
  if (!s) return TX('leer');
  if (dorfVerloren(s)) return TX`Zerstört · Tag ${s.tag} · ${EPOCHEN[s.epoche].name}`;
  const k = KLASSEN[s.klasse];
  return TX`${k ? TX`${k.name} · Stufe ${s.held.stufe}` : TX('Noch keine Klasse')} · Tag ${s.tag} · ${EPOCHEN[s.epoche].name}`;
}
function platzDatum(s) {
  if (!s || !s.gespeichert) return '';
  try { return new Date(s.gespeichert).toLocaleString(TX('de-DE'), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
}

// Erst der Modus, dann der Speicherplatz. art: 'neu' oder 'laden'.
// Modi, die noch nicht spielbar sind, stehen gesperrt mit „Bald verfügbar“ da.
function modusWahl(art) {
  const karten = Object.keys(MODI).map(m => {
    const M = MODI[m];
    let zusatz = '';
    if (!M.spielbar) zusatz = TX('Bald verfügbar');
    else if (art === 'neu' && M.bestenliste && bestenlisteLesen().length) zusatz = TX`Bester Lauf: Dorfwert ${bestenlisteLesen()[0].wert}, ${bestenlisteLesen()[0].tage} Tage`;
    else if (art === 'laden') {
      let n = 0;
      for (let p = 1; p <= SPIELSTAND.plaetze; p++) if (platzLesen(p, m)) n++;
      zusatz = n === 1 ? TX('1 Spielstand') : n ? TX`${n} Spielstände` : TX('Noch keine Spielstände');
    }
    return `<button class="modus-karte" type="button" data-modus="${m}" ${M.spielbar ? '' : 'disabled'}>
      <b>${esc(M.name)}</b><span>${esc(M.text)}</span>${zusatz ? `<small>${esc(zusatz)}</small>` : ''}</button>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="mw">
    <div class="label">${art === 'neu' ? TX('Neues Spiel') : TX('Spiel laden')}</div>
    <h1 id="mw">Welcher Modus?</h1>
    <div class="modus-karten">${karten}</div>
    ${art === 'laden' ? TX('<p class="note">Zum Umzug auf ein anderes Gerät: Alle Spielstände und gefundenen Enden in einem Text.</p>') : ''}
    <div class="knopfreihe">
      ${art === 'laden' ? TX('<button class="btn ghost" data-a="alle" type="button">Alle Spielstände sichern</button><button class="btn ghost" data-a="alleein" type="button">Alle einfügen</button>') : ''}
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', overlayWeg);
  if (art === 'laden') {
    overlay.querySelector('[data-a="alle"]').addEventListener('click', alleSicherungZeigen);
    overlay.querySelector('[data-a="alleein"]').addEventListener('click', alleSicherungEinfuegen);
  }
  overlay.querySelectorAll('[data-modus]:not([disabled])').forEach(b => b.addEventListener('click', () => { geraeusch('klick'); plaetzeZeigen(art, b.dataset.modus); }));
}

function plaetzeZeigen(art, spielmodus = 'story') {
  const zeilen = [];
  for (let n = 1; n <= SPIELSTAND.plaetze; n++) {
    const s = platzLesen(n, spielmodus), belegt = platzBelegt(n, spielmodus);
    // Belegt, aber nicht lesbar: aus einer neueren Version des Spiels oder beschädigt
    const fremd = belegt && !s;
    const knopf = art === 'neu'
      ? `<button class="btn small" data-platz="${n}" type="button">${belegt ? TX('Überschreiben') : TX('Hier starten')}</button>`
      : TX`<button class="btn small" data-platz="${n}" type="button" ${s ? '' : 'disabled'}>Laden</button>` +
        (s ? TX`<button class="btn small ghost" data-sichern="${n}" type="button">Sichern</button>` : '') +
        (belegt ? TX`<button class="btn small ghost" data-loeschen="${n}" type="button">Löschen</button>` : '');
    zeilen.push(TX`<div class="platz${s ? '' : ' leer'}">
      <div class="platz-text"><b>Speicherplatz ${n}</b><span>${esc(fremd ? TX('Unlesbar oder aus einer neueren Version') : platzKurz(s))}</span>${s ? TX`<small>Zuletzt gespeichert ${esc(platzDatum(s))}</small><small>Spielzeit ${esc(spielzeitZeile(s))}</small>` : ''}</div>
      <div class="platz-knoepfe">${knopf}</div></div>`);
  }
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="pt">
    <div class="label">${art === 'neu' ? TX`Neues Spiel · ${MODI[spielmodus].name}` : TX`Spiel laden · ${MODI[spielmodus].name}`}</div>
    <h1 id="pt">${art === 'neu' ? TX('Wo soll deine Geschichte stehen?') : TX('Spielstand wählen')}</h1>
    <div class="plaetze">${zeilen.join('')}</div>
    <p class="note">${art === 'laden' ? TX('Spielstände werden in diesem Browser gespeichert. Mit „Sichern“ bekommst du einen Text, den du aufheben und später wieder einfügen kannst, auch auf einem anderen Gerät.') : TX('Spielstände werden in diesem Browser gespeichert.')}${ablageUnsicher() ? ' ' + TX('Browser löschen Spielstände manchmal (vor allem Safari auf dem iPhone und private Fenster). Sichere deshalb regelmäßig, im Spiel unter Menü → „Spielstand sichern“.') : ''}</p>
    <div class="knopfreihe">
      ${art === 'laden' ? TX('<button class="btn ghost" data-a="einfuegen" type="button">Sicherung einfügen</button>') : ''}
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => modusWahl(art));
  const einfuegen = overlay.querySelector('[data-a="einfuegen"]');
  if (einfuegen) einfuegen.addEventListener('click', () => sicherungEinfuegen(spielmodus));
  overlay.querySelectorAll('[data-sichern]').forEach(b => b.addEventListener('click', () => sicherungZeigen(Number(b.dataset.sichern), spielmodus)));
  overlay.querySelectorAll('[data-platz]').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.platz);
    if (art === 'neu') {
      if (platzBelegt(n, spielmodus) && !b.dataset.sicher) { b.dataset.sicher = '1'; b.textContent = TX('Wirklich? Alles weg'); return; }
      neuesSpiel(n, spielmodus); spielSpeichern(); spielBetreten();
    } else if (spielLaden(n, spielmodus)) spielBetreten();
  }));
  overlay.querySelectorAll('[data-loeschen]').forEach(b => b.addEventListener('click', () => {
    if (!b.dataset.sicher) { b.dataset.sicher = '1'; b.textContent = TX('Wirklich löschen?'); return; }
    platzLoeschen(Number(b.dataset.loeschen), spielmodus); plaetzeZeigen('laden', spielmodus); hauptmenueAuffrischen();
  }));
}
function hauptmenueAuffrischen() {
  document.getElementById('hmWeiter').hidden = !letzterStand();
}

// Sicherung: der Spielstand als Text. Teilen öffnet auf dem Handy das Teilen-Menü (Notizen, Nachrichten, Mail),
// Kopieren klappt über die Zwischenablage oder von Hand. zurueck: wohin „Zurück“ führt.
function sicherungZeigen(n, spielmodus, zurueck = () => plaetzeZeigen('laden', spielmodus)) {
  const s = platzLesen(n, spielmodus);
  if (!s) return zurueck();
  const teilen = typeof navigator.share === 'function';
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="sz">
    <div class="label">${esc(MODI[spielmodus].name)} · Speicherplatz ${n} · ${esc(platzKurz(s))}</div>
    <h1 id="sz">Spielstand sichern</h1>
    <p class="note">${teilen ? TX('Schick dir den Text selbst, zum Beispiel in eine Notiz oder als Nachricht.') : TX('Kopiere diesen Text und heb ihn gut auf, zum Beispiel in einer Notiz.')} Unter „Spiel laden → Sicherung einfügen“ wird daraus wieder dein Spielstand, auch auf einem anderen Gerät.</p>
    <textarea class="sicherung" readonly aria-label="Sicherung als Text">${esc(sicherungText(s))}</textarea>
    <div class="knopfreihe">
      ${teilen ? TX('<button class="btn" data-a="teilen" type="button">Teilen</button>') : ''}
      <button class="btn${teilen ? ' ghost' : ''}" data-a="kopieren" type="button">Kopieren</button>
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  sicherungKnoepfe(TX`LAZI-Spielstand · ${platzKurz(s)}`, () => sicherungMerken(n, spielmodus));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', zurueck);
}
// Teilen und Kopieren im offenen Dialog. gesichert: läuft, wenn der Text wirklich weitergegeben wurde.
function sicherungKnoepfe(titel, gesichert, feld = overlay.querySelector('.sicherung'), kopiertText = TX('Die Sicherung liegt in der Zwischenablage.')) {
  const kopieren = () => {
    const geschafft = () => { gesichert(); meldung(TX('Kopiert'), kopiertText, 1800); };
    const vonHand = () => {
      feld.focus(); feld.select();
      try { if (document.execCommand('copy')) return geschafft(); } catch (e) { /* nicht erlaubt */ }
      meldung(TX('Text ist markiert'), TX('Kopiere ihn von Hand (Strg+C oder lange drücken).'), 2600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(feld.value).then(geschafft, vonHand);
    else vonHand();
  };
  overlay.querySelector('[data-a="kopieren"]').addEventListener('click', kopieren);
  // Teilen kann eingebettet (Artifact) verboten sein; dann wird stattdessen kopiert. Abbrechen im Menü ist kein Fehler.
  const teilen = overlay.querySelector('[data-a="teilen"]');
  if (teilen) teilen.addEventListener('click', () => {
    navigator.share({ title: titel, text: feld.value })
      .then(() => { gesichert(); meldung(TX('Geteilt'), TX('Heb den Text gut auf.'), 1800); },
        e => { if (!e || e.name !== 'AbortError') kopieren(); });
  });
}
// Alle Spielstände auf einmal, für den Umzug auf ein anderes Gerät oder eine andere Adresse
function alleSicherungZeigen() {
  const teilen = typeof navigator.share === 'function', anzahl = ablageSchluessel().filter(k => /-platz-\d+$/.test(k) && !/^lazi-platz/.test(k)).length;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="as">
    <div class="label">${anzahl === 1 ? TX('1 Spielstand') : TX`${anzahl} Spielstände`}</div>
    <h1 id="as">Alle Spielstände sichern</h1>
    <p class="note">Heb diesen Text gut auf. Auf dem neuen Gerät oder unter der neuen Adresse fügst du ihn unter „Spiel laden → Alle einfügen“ ein.</p>
    <textarea class="sicherung" readonly aria-label="Sicherung als Text">${esc(alleSicherungText())}</textarea>
    <div class="knopfreihe">
      ${teilen ? TX('<button class="btn" data-a="teilen" type="button">Teilen</button>') : ''}
      <button class="btn${teilen ? ' ghost' : ''}" data-a="kopieren" type="button">Kopieren</button>
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  sicherungKnoepfe(TX('LAZI: alle Spielstände'), () => {});
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => modusWahl('laden'));
}
function alleSicherungEinfuegen() {
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ae">
    <h1 id="ae">Alle einfügen</h1>
    <p class="note">Füge den Text ein. Plätze, die in der Sicherung stehen, werden ersetzt, alle anderen bleiben.</p>
    <textarea class="sicherung" aria-label="Sicherung als Text" placeholder="LAZIALLE1:…"></textarea>
    <div class="knopfreihe">
      <button class="btn" data-a="einfuegen" type="button">Einfügen</button>
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => modusWahl('laden'));
  overlay.querySelector('[data-a="einfuegen"]').addEventListener('click', e => {
    const b = e.currentTarget, a = alleSicherungLesen(overlay.querySelector('.sicherung').value);
    if (!a) { meldung(TX('Das ist keine gültige Sicherung'), TX('Der Text ist unvollständig oder stammt aus einer neueren Version.'), 2600); return; }
    if (Object.keys(a.plaetze).some(k => ablageLesen(k) !== null) && !b.dataset.sicher) { b.dataset.sicher = '1'; b.textContent = TX('Wirklich ersetzen?'); return; }
    if (!alleSicherungEinspielen(a)) { meldung(TX('Speichern fehlgeschlagen'), TX('Der Browser lässt keinen Spielstand mehr zu.'), 3000); return; }
    geraeusch('klick');
    const n = Object.keys(a.plaetze).length;
    meldung(n === 1 ? TX('1 Spielstand eingefügt') : TX`${n} Spielstände eingefügt`, a.unlesbar ? TX`${a.unlesbar} konnten nicht gelesen werden` : '', 2600);
    modusWahl('laden'); hauptmenueAuffrischen();
  });
}
function sicherungEinfuegen(spielmodus) {
  const knoepfe = [];
  for (let n = 1; n <= SPIELSTAND.plaetze; n++) knoepfe.push(TX`<button class="btn small" data-ziel="${n}" type="button">Auf Platz ${n}</button>`);
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="se">
    <div class="label">${esc(MODI[spielmodus].name)}</div>
    <h1 id="se">Sicherung einfügen</h1>
    <p class="note">Füge den Text einer Sicherung ein und wähle den Speicherplatz. Was dort liegt, wird ersetzt.</p>
    <textarea class="sicherung" aria-label="Sicherung als Text" placeholder="LAZI1:…"></textarea>
    <div class="knopfreihe">${knoepfe.join('')}<button class="btn ghost" data-a="zu" type="button">Zurück</button></div>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => plaetzeZeigen('laden', spielmodus));
  overlay.querySelectorAll('[data-ziel]').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.ziel), s = sicherungLesen(overlay.querySelector('.sicherung').value);
    if (!s) { meldung(TX('Das ist keine gültige Sicherung'), TX('Der Text ist unvollständig oder stammt aus einer neueren Version.'), 2600); return; }
    if (platzBelegt(n, spielmodus) && !b.dataset.sicher) { b.dataset.sicher = '1'; b.textContent = TX('Wirklich ersetzen?'); return; }
    s.modus = spielmodus;
    if (!ablageJsonSchreiben(ABLAGE.platz(spielmodus, n), s)) { meldung(TX('Speichern fehlgeschlagen'), TX('Der Browser lässt keinen Spielstand mehr zu.'), 3000); return; }
    geraeusch('klick');
    meldung(TX`Sicherung auf Platz ${n} eingefügt`, platzKurz(s), 2200);
    plaetzeZeigen('laden', spielmodus); hauptmenueAuffrischen();
  }));
}

function spielBetreten() {
  overlayWeg();
  dorfAufbauen();
  modusDorf();
  if (abgebrocheneMission()) return;   // Wer eine Mission durch Neuladen verlassen hat, kommt erst einmal von dort zurück
  if (!SPIEL.intro && regel('intro')) introZeigen();
  else if (!SPIEL.klasse) klassenWahl();
}

// Menü im Dorf
function menueZeigen() {
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="mm">
    <div class="label">${esc(TX`${MODI[SPIEL.modus].name} · Speicherplatz ${aktiverPlatz} · Tag ${SPIEL.tag} · Bester Punktestand ${SPIEL.rekord || 0}`)}</div>
    <h1 id="mm">Menü</h1>
    <dl class="facts">
      <dt>Ziel</dt><dd>${esc(regel('ziel'))}</dd>
      <dt>Dorfwert</dt><dd id="mmWert">${dorfPunkte()}</dd>
      <dt>Spielzeit</dt><dd id="mmZeit">${esc(spielzeitZeile(SPIEL))}</dd>
      <dt>Einwohner</dt><dd>Kommen als Überlebende aus Missionen. Sie brauchen Wohnraum und Nahrung.</dd>
      <dt>Held</dt><dd>Missionen bringen Erfahrung. Unter „Held“ verteilst du Punkte und wählst Fähigkeiten. Im Kampf nutzt du mit Q, E und R drei Fähigkeiten, die Mana kosten.</dd>
      <dt>Wirtschaft</dt><dd>Holzfäller, Steinmetze und Bauernhöfe brauchen Arbeiter. Ab Epoche 2 heizen die Leute mit Holzkohle aus der Köhlerei. Ein hoher Lebensstandard lockt Siedler an.</dd>
      <dt>Steuerung</dt><dd>${istTouch ? TX('Ziehen verschiebt die Ansicht. Tippe ein Gebäude an, um mehr zu erfahren.') : TX('WASD oder Ziehen mit der Maus verschiebt die Ansicht. Klicke ein Gebäude an, um mehr zu erfahren. M schaltet die Musik.')}</dd>
    </dl>
    <div class="knopfreihe">
      <button class="btn" data-a="zu" type="button">Weiterspielen</button>
      <button class="btn ghost" data-a="chronik" type="button">Chronik</button>
      <button class="btn ghost" data-a="opt" type="button">Optionen</button>
      <button class="btn ghost" data-a="bericht" type="button">Fehlerbericht</button>
      <button class="btn ghost" data-a="sichern" type="button">Spielstand sichern</button>
      <button class="btn ghost" data-a="haupt" type="button">Speichern und Hauptmenü</button>
    </div>
  </div>`);
  { const wert = document.getElementById('mmWert').previousElementSibling, dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = TX('Schwierigkeit'); dd.textContent = schwierigkeit().name; wert.before(dt, dd); }
  overlay.querySelector('[data-a="zu"]').addEventListener('click', overlayWeg);
  overlay.querySelector('[data-a="sichern"]').addEventListener('click', () => { spielSpeichern(); sicherungZeigen(aktiverPlatz, SPIEL.modus, menueZeigen); });
  overlay.querySelector('[data-a="opt"]').addEventListener('click', () => optionenZeigen(menueZeigen));
  overlay.querySelector('[data-a="bericht"]').addEventListener('click', () => fehlerberichtZeigen(menueZeigen));
  overlay.querySelector('[data-a="chronik"]').addEventListener('click', () => chronikZeigen(menueZeigen));
  overlay.querySelector('[data-a="haupt"]').addEventListener('click', hauptmenueZeigen);
}

function introZeigen() {
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="it">
    <div class="label">Epoche 1 · ${esc(EPOCHEN[0].name)}</div>
    <h1 id="it">Ein Feuer zwischen den Ruinen</h1>
    <p class="story">Vier Menschen, ein Lagerfeuer und ein paar Kisten voller seltsamer Fundstücke. Auf fast allen steht dieselbe Aufschrift: L.A.C.I. Niemand weiß, was sie bedeutet. Die Leute nennen das Zeug einfach Lazi.</p>
    <dl class="facts">
      <dt>Bauen</dt><dd>Wohnhäuser und Nahrungslager machen Platz für neue Einwohner.</dd>
      <dt>Missionen</dt><dd>Bringen Gold, Lazi-Teile, Waffen, Erfahrung und Überlebende.</dd>
      <dt>Epoche</dt><dd>Erreiche ${EPOCHEN[0].ziel.einwohner} Einwohner und baue Schmiede und Lazi-Werkstatt.</dd>
    </dl>
    <button class="btn" data-a="los">Los geht's</button>
  </div>`);
  overlay.querySelector('[data-a="los"]').addEventListener('click', () => { SPIEL.intro = true; spielSpeichern(); overlayWeg(); if (!SPIEL.klasse) klassenWahl(); });
}

// Klassenwahl: einmal pro Spielstand
function klassenWahl() {
  const karten = Object.keys(KLASSEN).map(k => {
    const K = KLASSEN[k], leben = Math.round((K.leben || CFG.spieler.leben) * K.werte);
    const tempo = Math.round(K.werte * (K.tempoMal || 1) * 100), schaden = Math.round(K.werte * 100);
    return TX`<div class="klasse-karte">
      <canvas data-k="${k}" width="32" height="39" aria-hidden="true"></canvas>
      <div class="kk-text">
        <b>${esc(K.name)}</b><span class="label">${esc(K.kurz)}</span>
        <p>${esc(K.text)}</p>
        <div class="note">Leben ${leben} · Tempo ${tempo} % · Schaden ${schaden} %${K.waffenBonus ? TX(' · +30 % mit Kurzschwert, Langschwert, Dolch') : ''}</div>
        <div class="note">${esc(K.angriff)} · halten: ${esc(K.laden)}${K.aktion ? ' · ' + esc(K.aktion) : ''}${K.rolle ? TX(' · Leertaste: ') + esc(K.rolle) : ''}</div>
        <div class="note">Fähigkeiten: ${['q', 'e', 'r'].map(t => '<kbd>' + t.toUpperCase() + '</kbd> ' + esc(TECHNIKEN[k][t].name)).join(' · ')}</div>
        <button class="btn small" data-k="${k}" type="button">Als ${esc(K.name)} spielen</button>
      </div></div>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="kw">
    <div class="label">Wer bist du?</div>
    <h1 id="kw">Wähle deine Klasse</h1>
    <p class="note">Die Klasse gilt für den ganzen Spielstand. Für eine andere Klasse startest du ein neues Spiel auf einem anderen Speicherplatz.</p>
    <div class="klassen">${karten}</div>
  </div>`);
  overlay.querySelectorAll('canvas[data-k]').forEach(c => {
    const k = c.dataset.k, b = BILD.held[k === 'schwert' ? 'ritter' : k][WAFFEN.find(v => v.id === KLASSEN[k].startWaffe).art].stand.quelle;
    c.getContext('2d').drawImage(b, 0, 0);
    // Darunter dieselbe Klasse in der modernen Grafik
    const n = neuHeld(bildKlasse(k)).vorne.stand().quelle, neu = document.createElement('canvas'), box = document.createElement('div'), name = t => { const s = document.createElement('small'); s.textContent = t; return s; };
    neu.width = n.width; neu.height = n.height; neu.className = 'modern'; neu.setAttribute('aria-hidden', 'true'); neu.getContext('2d').drawImage(n, 0, 0);
    box.className = 'kk-bilder'; c.before(box); box.append(c, name(TX('Klassisch')), neu, name(TX('Modern')));
  });
  // Schwierigkeit über den Klassen. Sie gilt für den ganzen Spielstand.
  let stufe = 'normal';
  const wahl = document.createElement('div'); wahl.className = 'schwer-wahl';
  wahl.innerHTML = `<div class="label">${esc(TX('Schwierigkeit'))}</div><div class="knopfreihe">${Object.keys(SCHWIERIGKEIT).map(s => `<button class="btn small" data-schwer="${s}" type="button">${esc(SCHWIERIGKEIT[s].name)}</button>`).join('')}</div><p class="note"></p>`;
  const stufeZeigen = () => { wahl.querySelectorAll('[data-schwer]').forEach(b => { const an = b.dataset.schwer === stufe; b.classList.toggle('ghost', !an); b.setAttribute('aria-pressed', String(an)); }); wahl.querySelector('.note').textContent = SCHWIERIGKEIT[stufe].text; };
  wahl.querySelectorAll('[data-schwer]').forEach(b => b.addEventListener('click', () => { stufe = b.dataset.schwer; geraeusch('klick'); stufeZeigen(); }));
  overlay.querySelector('.klassen').before(wahl); stufeZeigen();
  overlay.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => {
    SPIEL.schwierigkeit = stufe;
    klasseFestlegen(b.dataset.k); geraeusch('welle'); overlayWeg(); dorfHudAktualisieren();
    meldung(KLASSEN[b.dataset.k].name, TX('Viel Glück da draußen'), 1800);
  }));
}

// ---------------------------------------------------------------------
// Hauptschleife mit FPS-Begrenzung
// ---------------------------------------------------------------------
let zuletzt = performance.now(), fpsZaehler = 0, fpsZeit = 0;
// Gezählt wird nur, solange jemand wirklich spielt: Spiel offen, sichtbar, nicht pausiert, und eine Eingabe vor kurzem
let letzteEingabe = 0;
['pointerdown', 'keydown', 'pointermove'].forEach(e => addEventListener(e, () => { letzteEingabe = performance.now(); }, { passive: true, capture: true }));
function spielzeitZaehlen(sek) {
  if (!SPIEL || modus === 'titel' || document.hidden || (G && G.zustand === 'pause')) return;
  if (performance.now() - letzteEingabe > SPIELZEIT_LEERLAUF * 1000) return;
  SPIEL.spielzeit = (SPIEL.spielzeit || 0) + Math.min(sek, 1);
}
function spielzeitText(sek) {
  const min = Math.floor(sek / 60), h = Math.floor(min / 60);
  return h ? TX`${h} h ${min % 60} min` : TX`${min} min`;
}
function schleife(jetzt) {
  requestAnimationFrame(schleife);
  if (grafikFehlt((jetzt - zuletzt) / 1000)) { zuletzt = jetzt; return; }
  spielzeitZaehlen((jetzt - zuletzt) / 1000);
  if (modus === 'dorf' && overlay.hidden && dorfVerloren()) dorfZerstoertZeigen();
  if (OPT.fps > 0 && jetzt - zuletzt < 1000 / OPT.fps - 2) return;
  const roh = (jetzt - zuletzt) / 1000;
  const dt = Math.min(0.05, roh); zuletzt = jetzt; WIND_ZEIT.value = jetzt / 1000;
  fpsZaehler++; fpsZeit += roh;
  if (fpsZeit >= 0.5) {
    if (OPT.fpsAnzeige) document.getElementById('fpsAnzeige').textContent = Math.round(fpsZaehler / fpsZeit) + ' FPS';
    fpsZaehler = 0; fpsZeit = 0;
  }
  if (modus === 'titel') titelAktualisieren(dt);
  else if (modus === 'dorf') dorfAktualisieren(dt);
  else if (modus === 'mission' && G) {
    if (G.zustand === 'spiel') {
      if (G.frieren > 0) G.frieren -= dt; else missionAktualisieren(dt);
      missionHudAktualisieren();
    }
    if (G.zustand !== 'pause') missionDarstellen(imSpiel() && G.frieren > 0 ? 0 : dt);
  }
  if (szene) {
    // Fällt die Grafik mitten im Bild weg, wirft Three.js beim Übersetzen der Shader einen Fehler
    try { renderer.render(szene, cam); }
    catch (e) { if (!renderer.getContext().isContextLost()) throw e; grafikAusgefallen(); }
  }
}

// Zum Testen in der Browser-Konsole, z. B. spielDebug.stand().gold = 999
window.spielDebug = { spiel: () => G, spieler: () => P, stand: () => SPIEL, dorf: Dorf };

function starten() {
  bilderLaden(); neueBilderEinsetzen(); dorfbauBilder(); windMarkieren();
  spielstaendeUmziehen();
  titelAufbauen();
  optionenAnwenden();
  document.getElementById('hmWeiter').addEventListener('click', () => { const l = letzterStand(); if (l && spielLaden(l.platz, l.modus)) spielBetreten(); });
  document.getElementById('hmNeu').addEventListener('click', () => modusWahl('neu'));
  document.getElementById('hmLaden').addEventListener('click', () => modusWahl('laden'));
  document.getElementById('hmOptionen').addEventListener('click', () => optionenZeigen());
  document.getElementById('hmBericht').addEventListener('click', () => fehlerberichtZeigen(overlayWeg));
  document.getElementById('btnMenue').addEventListener('click', menueZeigen);
  document.getElementById('kZurueck').addEventListener('click', weltkarteSchliessen);
  document.getElementById('kChronik').addEventListener('click', () => chronikZeigen());
  document.querySelectorAll('.tonKnopf').forEach(b => { b.textContent = Ton.an ? TX('Ton an') : TX('Ton aus'); b.setAttribute('aria-pressed', String(Ton.an)); b.addEventListener('click', tonUmschalten); });
  hauptmenueZeigen();
  requestAnimationFrame(schleife);
}
window.claude?.hot?.ready ? window.claude.hot.ready(starten) : starten();

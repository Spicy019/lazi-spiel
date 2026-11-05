// =====================================================================
// MEISTER: Forschungslabor und Schmiedemeister.
// Das Labor erforscht Sonderwirkungen (dauert ein paar Tage).
// Der Schmiedemeister kommt, sobald die Schmiede ausgebaut ist, und
// fertigt aus seltenen Materialien Meisterstücke. Was das Labor
// erforscht hat, kann er gezielt einarbeiten.
// =====================================================================

function materialText(k) { return Object.keys(k).map(m => k[m] + ' ' + (ROHSTOFF_NAME[m] || m)).join(' + '); }
function materialSymbol(m) { return `<img class="msym" src="${symbolUrl(BILD.material[m])}" alt="">`; }
function materialListeHtml() {
  const da = Object.keys(MATERIALIEN).filter(m => SPIEL[m] > 0);
  if (!da.length) return TX('<p class="note">Noch keine seltenen Materialien. Wölfe, Alphas, Golems, Schildträger und Elite-Gegner lassen welche fallen. Bücher gibt es in der Universität.</p>');
  return '<div class="materialien">' + da.map(m => `<span class="mat" title="${esc(MATERIALIEN[m].text)}">${materialSymbol(m)}<b>${SPIEL[m]}</b> ${esc(MATERIALIEN[m].name)}</span>`).join('') + '</div>';
}

// Ein Gespräch mit mehreren Zeilen anzeigen, danach weiter()
function gespraechZeigen(titel, zeilen, weiter) {
  let i = 0;
  const zeige = () => {
    const [wer, text] = zeilen[i], p = PERSONEN[wer];
    overlayZeigen(`<div class="card panel nachricht" role="dialog" aria-labelledby="gs">
      <div class="label">${esc(titel)}</div>
      <div class="nachricht-zeile">
        <canvas class="portrait" width="18" height="27" aria-hidden="true" style="border-color:${p.farbe}"></canvas>
        <div class="nachricht-text"><b id="gs" style="color:${p.farbe}">${esc(p.name)}</b><span class="label">${esc(p.rolle)}</span><p>${esc(text)}</p></div>
      </div>
      <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">${i < zeilen.length - 1 ? TX('Weiter') : TX('Verstanden')}</button></div>
    </div>`);
    portraitMalen(overlay.querySelector('.portrait'), wer);
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => { i++; if (i < zeilen.length) zeige(); else { overlayWeg(); if (weiter) weiter(); } });
  };
  zeige();
}

// ---------- Ankunft ----------
function meisterAnkunft() {
  if (SPIEL.meister) return;
  SPIEL.meister = true; spielSpeichern();
  if (regel('figuren')) gespraechZeigen(TX('Ein Schmiedemeister kommt ins Dorf'), ANKUNFT.grimbart);
}
function laborAnkunft() {
  if (SPIEL.forscherin) return;
  SPIEL.forscherin = true; spielSpeichern();
  if (regel('figuren')) gespraechZeigen(TX('Das Forschungslabor ist bezogen'), ANKUNFT.wenzel);
}

// ---------- Forschung ----------
function forschungFertig(id) { return SPIEL.forschung.fertig.includes(id); }
// Wird jeden Tag aufgerufen (aus tagVergeht)
function forschungTag(bericht) {
  const l = SPIEL.forschung.laufend;
  if (!l) return;
  l.rest -= gebaeudeWert('forschungTempo') || 1;
  if (l.rest > 0) { const name = FORSCHUNG.find(f => f.id === l.id).name; bericht.push(l.rest === 1 ? TX`Labor: „${name}“ braucht noch 1 Tag.` : TX`Labor: „${name}“ braucht noch ${l.rest} Tage.`); return; }
  SPIEL.forschung.fertig.push(l.id);
  SPIEL.forschung.laufend = null;
  bericht.push(TX`Labor: „${FORSCHUNG.find(f => f.id === l.id).name}“ ist fertig erforscht. Grimbart kann ${EFFEKTE[l.id].split(':')[0]} jetzt in Meisterstücke einarbeiten.`);
}
// Mit Strom braucht das Labor ein Buch weniger (mindestens eins)
function forschungKosten(f) {
  const k = Object.assign({}, f.kosten);
  if (stromAn() && k.buecher) k.buecher = Math.max(1, k.buecher - 1);
  if (k.buecher && gebaeudeWert('archiv')) k.buecher = Math.max(1, k.buecher - gebaeudeWert('archiv'));
  return k;
}
function laborZeigen() {
  const l = SPIEL.forschung.laufend;
  const karten = FORSCHUNG.map(f => {
    const fertig = forschungFertig(f.id), laeuft = l && l.id === f.id;
    const kann = !fertig && !l && kannBezahlen(forschungKosten(f));
    return TX`<div class="forschung${fertig ? ' fertig' : ''}${laeuft ? ' laeuft' : ''}">
      <b>${esc(f.name)}</b><span class="label">${esc(ART_NAME[f.art])} · ${f.tage} Tage</span>
      <p>${esc(EFFEKTE[f.id])}</p>
      ${fertig ? TX('<span class="label ok">Erforscht</span>') : laeuft ? TX`<span class="label">Läuft · noch ${l.rest === 1 ? TX('1 Tag') : TX`${l.rest} Tage`}</span>`
        : TX`<span class="note">${kostenHtml(forschungKosten(f))}</span><button class="btn small" type="button" data-f="${f.id}" ${kann ? '' : 'disabled'}>Erforschen</button>`}
    </div>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="lb">
    <div class="label">Forschungslabor · Dr. Wenzel</div>
    <h1 id="lb">Forschung</h1>
    <p class="note">Ein Projekt nach dem anderen. Jeder Tag, der vergeht, bringt die Forschung voran. Erforschte Wirkungen kann der Schmiedemeister in Meisterstücke einarbeiten.</p>
    ${materialListeHtml()}
    <div class="forschungen">${karten}</div>
    <button class="btn" data-a="zu" type="button">Zurück ins Dorf</button>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', overlayWeg);
  overlay.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
    const f = FORSCHUNG.find(x => x.id === b.dataset.f);
    if (!kannBezahlen(forschungKosten(f)) || SPIEL.forschung.laufend) return;
    bezahlen(forschungKosten(f));
    SPIEL.forschung.laufend = { id: f.id, rest: Math.max(1, f.tage - (clusterUnser('wissen') ? 1 : 0) + (clusterFeind('wissen') ? 1 : 0)) };
    spielSpeichern(); dorfHudAktualisieren(); geraeusch('bauen');
    gespraechZeigen(TX('Forschung gestartet'), [['wenzel', FORSCHUNG_SPRUECHE[Math.floor(Math.random() * FORSCHUNG_SPRUECHE.length)].replace('{name}', f.name)]], laborZeigen);
  }));
}

// ---------- Meisterstücke ----------
let meisterWahl = { art: 'waffe', stufe: 0, rezept: 0, effekt: null };
function meisterZeigen() {
  const labor = hatGebaeude('labor');
  const w = meisterWahl, M2 = MEISTERSTUECKE[w.stufe];
  const effekte = FORSCHUNG.filter(f => f.art === w.art && forschungFertig(f.id)).map(f => f.id);
  if (w.effekt && !effekte.includes(w.effekt)) w.effekt = null;
  const rezept = M2.wahl[w.rezept] || M2.wahl[0];
  const kosten = Object.assign({ gold: M2.gold, teile: M2.teile }, rezept);
  const gesperrt = M2.labor && !labor ? TX('Nur mit Forschungslabor') : SPIEL.beutel.length >= BEUTEL_PLAETZE ? TX('Der Beutel ist voll') : !kannBezahlen(kosten) ? TX('Es fehlt etwas') : '';
  const knopf = (feld, wert, text, an, aus) => `<button type="button" class="wahl-knopf${an ? ' an' : ''}" data-feld="${feld}" data-wert="${wert}" aria-pressed="${an}" ${aus ? 'disabled' : ''}>${text}</button>`;
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="ms">
    <div class="label">Schmiede · Meister Grimbart</div>
    <h1 id="ms">Meisterstück in Auftrag geben</h1>
    ${materialListeHtml()}
    <div class="wahl"><span class="label">Was soll es werden?</span><div class="wahl-knoepfe">
      ${SLOTS.map(a => knopf('art', a, `<b>${esc(ART_NAME[a])}</b>`, w.art === a)).join('')}</div></div>
    <div class="wahl"><span class="label">Wie edel? Das Material bestimmt die Seltenheit</span><div class="wahl-knoepfe">
      ${MEISTERSTUECKE.map((m, i) => knopf('stufe', i, TX`<b style="color:${SELTENHEIT[m.selten].farbe}">${SELTENHEIT[m.selten].name}</b><small>${m.gold} Gold, ${m.teile} Teile${m.labor ? TX(' · braucht Labor') : ''}</small>`, w.stufe === i, m.labor && !labor)).join('')}</div></div>
    <div class="wahl"><span class="label">Welches Material?</span><div class="wahl-knoepfe">
      ${M2.wahl.map((r, i) => knopf('rezept', i, `<b>${Object.keys(r).map(m => materialSymbol(m)).join('')} ${esc(materialText(r))}</b><small>${Object.keys(r).every(m => SPIEL[m] >= r[m]) ? 'vorhanden' : TX('fehlt noch')}</small>`, w.rezept === i)).join('')}</div></div>
    <div class="wahl"><span class="label">Sonderwirkung ${labor ? TX('(aus dem Labor)') : ''}</span><div class="wahl-knoepfe">
      ${knopf('effekt', '', TX('<b>Grimbart entscheidet</b><small>eine zufällige Wirkung</small>'), !w.effekt)}
      ${effekte.map(e => knopf('effekt', e, `<b>${esc(EFFEKTE[e].split(':')[0])}</b><small>${esc(EFFEKTE[e].split(': ')[1] || '')}</small>`, w.effekt === e)).join('')}
    </div>${!effekte.length ? `<p class="note">${labor ? TX`Erforsche im Labor Wirkungen für ${esc(ART_NAME[w.art])}, dann kannst du sie hier gezielt wählen.` : TX('Mit einem Forschungslabor kannst du die Sonderwirkung selbst bestimmen.')}</p>` : ''}</div>
    <p class="note">Kosten: ${kostenHtml(kosten)}</p>
    <div class="knopfreihe">
      <button class="btn" data-a="los" type="button" ${gesperrt ? 'disabled' : ''}>${gesperrt ? esc(gesperrt) : TX('Schmieden lassen')}</button>
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  overlay.querySelectorAll('[data-feld]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.feld;
    if (f === 'art') w.art = b.dataset.wert;
    if (f === 'stufe') { w.stufe = Number(b.dataset.wert); w.rezept = 0; }
    if (f === 'rezept') w.rezept = Number(b.dataset.wert);
    if (f === 'effekt') w.effekt = b.dataset.wert || null;
    geraeusch('klick'); meisterZeigen();
  }));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', overlayWeg);
  overlay.querySelector('[data-a="los"]').addEventListener('click', () => {
    if (gesperrt) return;
    bezahlen(kosten);
    const it = gegenstandErzeugen(w.art, M2.selten);
    if (w.effekt) it.effekt = w.effekt;
    else if (!it.effekt) { const pool = ZUSATZ[w.art].effekte; it.effekt = pool[Math.floor(Math.random() * pool.length)]; }
    it.name = TX`Grimbarts ${it.name}`;
    it.meister = true;
    SPIEL.beutel.push(it);
    spielSpeichern(); dorfHudAktualisieren(); geraeusch('sieg');
    overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="mf">
      <div class="label">Meisterstück</div>
      <h1 id="mf">Frisch aus der Esse</h1>
      <p class="story">${esc(MEISTER_SPRUECHE[Math.floor(Math.random() * MEISTER_SPRUECHE.length)])}</p>
      <div class="legendaer" style="border-color:${SELTENHEIT[it.selten].farbe}">${gegenstandKarteHtml(it, ausgeruestet(it.art))}</div>
      <div class="knopfreihe"><button class="btn" data-a="an" type="button" ${it.art === 'waffe' && it.klasse !== SPIEL.klasse ? 'disabled' : ''}>Gleich ausrüsten</button>
      <button class="btn ghost" data-a="zu" type="button">In den Beutel</button></div>
    </div>`);
    overlay.querySelector('[data-a="an"]').addEventListener('click', () => { SPIEL.ausruestung[it.art] = it.uid; spielSpeichern(); overlayWeg(); });
    overlay.querySelector('[data-a="zu"]').addEventListener('click', overlayWeg);
  });
}

// ---------- In der Mission: Materialien fallen lassen ----------
function materialFallen(e) {
  const listen = (MATERIAL_BEUTE[e.typ] || []).concat(e.elite ? MATERIAL_BEUTE.elite : []);
  listen.forEach(([m, chance]) => {
    if (Math.random() >= chance) return;
    G.material[m] = (G.material[m] || 0) + 1;
    zahl(e.x, e.sprite.scale.y + 0.9, e.z, '+1 ' + MATERIALIEN[m].name, 'material');
    partikel(e.x, 1, e.z, new THREE.Color(MATERIALIEN[m].farbe).getHex(), 8, 3);
  });
}

// ---------- Neue Leute im Dorf ----------
// Sobald das Dorf groß genug ist, zieht jemand Neues ein und stellt sich vor
function figurenPruefen(weiter) {
  const neu = regel('figuren') && FIGUREN_ANKUNFT.find(f => !SPIEL.figuren.includes(f.wer) && SPIEL.einwohner >= f.einwohner && SPIEL.epoche >= (f.epoche || 0));
  if (!neu) { if (weiter) weiter(); return; }
  SPIEL.figuren.push(neu.wer); spielSpeichern();
  gespraechZeigen(TX('Neu im Dorf: ') + PERSONEN[neu.wer].name, ANKUNFT[neu.wer], () => figurenPruefen(weiter));
}

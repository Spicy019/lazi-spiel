// =====================================================================
// GEGENSTÄNDE: Waffen, Rüstungen und Lazi-Module.
// Jeder Gegenstand entsteht aus einer Vorlage (WAFFEN, RUESTUNGEN,
// MODULE) und bekommt je nach Seltenheit zusätzliche Werte und
// manchmal eine Sonderwirkung. Dazu der Beutel mit Symbol-Raster.
// =====================================================================

const BEUTEL_PLAETZE = 20;
const SLOTS = ['waffe', 'ruestung', 'modul'];

function neueUid() { return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function gewichtet(gewichte) {
  const summe = gewichte.reduce((a, b) => a + b, 0);
  let z = Math.random() * summe;
  for (let i = 0; i < gewichte.length; i++) { z -= gewichte[i]; if (z < 0) return i; }
  return 0;
}

// Welche Vorlagen kommen in Frage?
function vorlagen(art, klasse, selten) {
  if (art === 'waffe') {
    const k = WAFFEN.filter(w => w.klasse === klasse);
    let pool = k.filter(w => w.selten <= selten && (selten > 0 || w.id !== KLASSEN[klasse].startWaffe));
    // Legendäre und Lazi-Waffen sind immer die benannten Waffen der Alten
    const legendaer = k.filter(w => w.selten === 3);
    if (selten >= 3 && legendaer.length) return legendaer;
    pool = pool.filter(w => w.selten < 3);
    return pool.length ? pool : k;
  }
  const liste = art === 'ruestung' ? RUESTUNGEN : MODULE;
  return liste.filter(v => v.selten <= selten);
}

// Einen Gegenstand aus einer Vorlage bauen, ohne Zufall (für alte Spielstände und Startwaffen)
function gegenstandAusVorlage(art, v, selten) {
  const it = { uid: neueUid(), art, basis: v.id, name: v.name, selten: selten === undefined ? v.selten : selten, werte: {}, effekt: v.effekt || null };
  if (art === 'waffe') Object.assign(it, { klasse: v.klasse, typ: v.typ, bild: v.art, schaden: v.schaden, tempo: v.tempo });
  else { it.bild = v.art; Object.assign(it.werte, v.werte); }
  return it;
}

// Neuer Gegenstand mit Zufallswerten
function gegenstandErzeugen(art, selten, klasse) {
  klasse = klasse || SPIEL.klasse;
  const pool = vorlagen(art, klasse, selten);
  const v = pool[Math.floor(Math.random() * pool.length)];
  const it = gegenstandAusVorlage(art, v, Math.max(selten, art === 'waffe' && v.selten === 3 ? 3 : selten));
  const S = SELTENHEIT[it.selten];
  if (art === 'waffe') it.schaden = v.schaden + it.selten * 2;
  else for (const w in it.werte) it.werte[w] = Math.round(it.werte[w] * (1 + it.selten * 0.25));
  // Zusatzwerte
  const moeglich = ZUSATZ[art].werte.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < S.zusatz && i < moeglich.length; i++) {
    const w = moeglich[i], [a, b] = WERTE[w].pro;
    const n = Math.max(1, Math.round(zz(a, b) * S.mal));
    if (art === 'waffe' && w === 'schaden') it.schaden += n;
    else it.werte[w] = (it.werte[w] || 0) + n;
  }
  // Sonderwirkung
  if (!it.effekt && Math.random() < S.effektChance) {
    const extra = art === 'waffe' ? { schwert: ['tempo'], beschwoerer: ['kette', 'golemkraft'], architekt: ['baumeister'], schatten: ['tempo'] }[klasse] : [];
    const e = ZUSATZ[art].effekte.concat(extra);
    it.effekt = e[Math.floor(Math.random() * e.length)];
  }
  return it;
}

// Zufallsbeute: quelle 'truhe', 'elite', 'boss', 'geheim' oder 'schmiede'
function beuteWuerfeln(quelle, gewichte) {
  const art = ['waffe', 'ruestung', 'modul'][gewichtet([BEUTE.art.waffe, BEUTE.art.ruestung, BEUTE.art.modul])];
  const g = gewichte || (quelle === 'boss' ? BEUTE.bossSeltenheit : quelle === 'geheim' ? BEUTE.geheimSeltenheit : BEUTE.seltenheit);
  return gegenstandErzeugen(quelle === 'schmiede' ? 'waffe' : art, gewichtet(g));
}

// ---------- Werte ----------
// Angriffstempo einer Waffe in Prozent (Vorlage plus Zusatzwerte)
function waffenTempoProzent(it) { return Math.round((1 / it.tempo - 1) * 100) + (it.werte.tempo || 0); }
// Alle Werte eines Gegenstands so, wie sie angezeigt und verglichen werden
function gegenstandWerte(it) {
  const w = {};
  if (!it) return w;
  if (it.art === 'waffe') { w.schaden = it.schaden; w.tempo = waffenTempoProzent(it); }
  for (const k in it.werte) if (!(it.art === 'waffe' && k === 'tempo')) w[k] = (w[k] || 0) + it.werte[k];
  return w;
}
function ausgeruestet(slot) {
  const it = SPIEL.beutel.find(x => x.uid === SPIEL.ausruestung[slot]);
  if (slot === 'waffe' && (!it || it.klasse !== SPIEL.klasse)) return null;
  return it || null;
}
// Summe aller Zusatzwerte und Sonderwirkungen der ausgerüsteten Gegenstände (ohne Waffenschaden)
function ausruestungWerte(gegenstaende) {
  const s = { tempo: 0, mana: 0, leben: 0, ruestung: 0, ausweichen: 0, krit: 0, effekte: new Set() };
  gegenstaende.filter(Boolean).forEach(it => {
    for (const k in it.werte) if (k in s) s[k] += it.werte[k];
    if (it.effekt) s.effekte.add(it.effekt);
  });
  return s;
}

// ---------- Symbole als Bilder für HTML ----------
const symbolCache = new Map();
function symbolUrl(c) {
  if (!symbolCache.has(c)) symbolCache.set(c, c.toDataURL());
  return symbolCache.get(c);
}
function gegenstandBild(it) {
  if (it.art === 'waffe') return BILD.waffe[it.bild] || BILD.waffe.schwert;
  if (it.art === 'ruestung') return BILD.ruestung[it.bild] || BILD.ruestung.leder;
  return BILD.modul[it.bild] || BILD.modul.kern;
}
function wertSymbol(k) { return `<img class="wsym" src="${symbolUrl(BILD.wert[k])}" alt="">`; }
function gegenstandSymbol(it) { return `<img class="isym" src="${symbolUrl(gegenstandBild(it).quelle)}" alt="">`; }

// Karte mit allen Werten, Vergleich zum ausgerüsteten Gegenstand derselben Art
function gegenstandKarteHtml(it, vergleich) {
  const s = SELTENHEIT[it.selten], w = gegenstandWerte(it), alt = vergleich && vergleich.uid !== it.uid ? gegenstandWerte(vergleich) : null;
  const K = KLASSEN[SPIEL.klasse];
  const bonus = it.art === 'waffe' && K.waffenBonus && K.waffenBonus.typen.includes(it.typ) ? TX(' · +30 % Klassenbonus') : '';
  const fremd = it.art === 'waffe' && it.klasse !== SPIEL.klasse ? TX`<div class="ik-warn">Nur für ${esc(KLASSEN[it.klasse].name)}</div>` : '';
  const schluessel = Object.keys(WERTE).filter(k => w[k] || (alt && alt[k]));
  const zeilen = schluessel.map(k => {
    const v = w[k] || 0, d = alt ? v - (alt[k] || 0) : 0, e = WERTE[k].einheit;
    const pfeil = !alt || !d ? '' : `<b class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</b>`;
    return `<span class="ik-wert" title="${esc(WERTE[k].name)}">${wertSymbol(k)}<span>${v > 0 ? '+' : ''}${v}${e}</span>${pfeil}<small>${esc(WERTE[k].name)}</small></span>`;
  }).join('');
  return `<div class="ik-kopf">${gegenstandSymbol(it)}<div><div class="ik-name" style="color:${s.farbe}">${esc(it.name)}</div>
      <div class="label" style="color:${s.farbe}">${s.name} · ${esc(it.art === 'waffe' ? (WAFFENTYP[it.typ] || TX('Waffe')) : ART_NAME[it.art])}${bonus}</div></div></div>
    ${fremd}<div class="ik-werte">${zeilen || TX('<span class="note">Keine Werte</span>')}</div>
    ${it.effekt ? `<div class="ik-eff">${esc(EFFEKTE[it.effekt])}</div>` : ''}`;
}

// ---------- Alte Spielstände: Waffen-IDs in Gegenstände umwandeln ----------
function beutelUmwandeln(s) {
  if (s.ausruestung) return;
  const alt = s.beutel || [], aktiv = alt[s.waffe || 0];
  s.beutel = alt.map(id => gegenstandAusVorlage('waffe', WAFFEN.find(w => w.id === id) || WAFFEN[0]));
  const a = s.beutel[alt.indexOf(aktiv)];
  s.ausruestung = { waffe: a ? a.uid : null, ruestung: null, modul: null };
  delete s.waffe;
}

// ---------- Beutel ----------
let beutelWahl = null;
function beutelZeigen() {
  const schmiede = hatGebaeude('schmiede');
  if (beutelWahl && !SPIEL.beutel.some(x => x.uid === beutelWahl)) beutelWahl = null;
  const hw = heldWerte();
  const slots = SLOTS.map(slot => {
    const it = ausgeruestet(slot);
    return `<button type="button" class="slot${it ? '' : ' leer'}" data-uid="${it ? it.uid : ''}" style="${it ? 'border-color:' + SELTENHEIT[it.selten].farbe : ''}">
      <span class="label">${ART_NAME[slot]}</span>${it ? gegenstandSymbol(it) : '<span class="slot-leer">leer</span>'}
      <span class="slot-name" style="color:${it ? SELTENHEIT[it.selten].farbe : 'var(--dim)'}">${it ? esc(it.name) : '—'}</span></button>`;
  }).join('');
  const stat = (k, v, e) => `<span class="ik-wert" title="${esc(WERTE[k].name)}">${wertSymbol(k)}<span>${v}${e || ''}</span><small>${esc(WERTE[k].name)}</small></span>`;
  const werte = stat('leben', hw.leben) + stat('schaden', '+' + (aktuelleWaffe().schaden + (missionsBoni().schaden || 0))) +
    stat('tempo', Math.round(100 / hw.angriffTempo / aktuelleWaffe().tempo), ' %') + stat('mana', hw.mana) +
    stat('ruestung', hw.ruestung, ' %') + stat('ausweichen', hw.ausweichen, ' %') + stat('krit', hw.krit, ' %');
  const zellen = [];
  for (let i = 0; i < BEUTEL_PLAETZE; i++) {
    const it = SPIEL.beutel[i];
    if (!it) { zellen.push('<div class="zelle leer" aria-hidden="true"></div>'); continue; }
    const an = SLOTS.some(sl => SPIEL.ausruestung[sl] === it.uid);
    zellen.push(`<button type="button" class="zelle${beutelWahl === it.uid ? ' gewaehlt' : ''}" data-uid="${it.uid}" style="border-color:${SELTENHEIT[it.selten].farbe}" aria-label="${esc(it.name)}">
      ${gegenstandSymbol(it)}${an ? '<span class="an">E</span>' : ''}${it.effekt ? '<span class="eff-punkt"></span>' : ''}</button>`);
  }
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="bt">
    <div class="label">Beutel · ${SPIEL.beutel.length} / ${BEUTEL_PLAETZE} Gegenstände</div>
    <h1 id="bt">Ausrüstung</h1>
    <div class="beutel2">
      <div class="b-links"><div class="slots">${slots}</div><div class="held-stats">${werte}</div><span class="label">Seltene Materialien</span>${materialListeHtml()}</div>
      <div class="b-mitte"><div class="raster">${zellen.join('')}</div>
        <p class="note">${istTouch ? TX('Tippe einen Gegenstand an.') : TX('Fahre über einen Gegenstand oder klicke ihn an.')} <span class="eff-punkt inline"></span> = Sonderwirkung, E = ausgerüstet</p>
        ${verwertenHtml(schmiede)}</div>
      <div class="b-rechts panel" id="itemDetail"></div>
    </div>
    <div class="knopfreihe">
      <button class="btn" data-a="zu" type="button">Zurück ins Dorf</button>
      ${schmiede ? TX`<button class="btn ghost" data-a="schmieden" type="button">Waffe schmieden (${SCHMIEDEN.gold} Gold, ${SCHMIEDEN.teile} Teile)</button>` : TX('<span class="note">Mit einer Schmiede kannst du zerlegen und schmieden.</span>')}
    </div>
  </div>`);
  const detail = overlay.querySelector('#itemDetail');
  const zeigeDetail = (uid, mitKnoepfen) => {
    const it = SPIEL.beutel.find(x => x.uid === uid);
    if (!it) { detail.innerHTML = TX('<p class="note">Wähle einen Gegenstand, um seine Werte zu sehen.</p>'); return; }
    const an = SPIEL.ausruestung[it.art] === it.uid, fremd = it.art === 'waffe' && it.klasse !== SPIEL.klasse, s = SELTENHEIT[it.selten];
    detail.innerHTML = gegenstandKarteHtml(it, ausgeruestet(it.art)) + (mitKnoepfen ? `<div class="bz-knoepfe">
      ${an ? TX`<span class="label">Ausgerüstet</span>${it.art !== 'waffe' ? TX('<button class="btn small ghost" data-a="ab" type="button">Ablegen</button>') : ''}`
           : TX`<button class="btn small" data-a="an" type="button" ${fremd ? 'disabled' : ''}>Ausrüsten</button>
              <button class="btn small ghost" data-a="verkauf" type="button">Verkaufen +${s.wert} Gold</button>
              <button class="btn small ghost" data-a="zerleg" type="button" ${schmiede ? '' : TX('disabled title="Braucht eine Schmiede"')}>Zerlegen +${s.teile} Teile</button>`}
    </div>` : '');
    detail.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'an') SPIEL.ausruestung[it.art] = it.uid;
      if (a === 'ab') SPIEL.ausruestung[it.art] = null;
      if (a === 'verkauf' || a === 'zerleg') {
        if (a === 'verkauf') SPIEL.gold += s.wert; else SPIEL.teile += s.teile;
        SPIEL.beutel.splice(SPIEL.beutel.indexOf(it), 1);
        beutelWahl = null;
        geraeusch('muenze');
      } else geraeusch('klick');
      spielSpeichern(); dorfHudAktualisieren(); beutelZeigen();
    }));
  };
  zeigeDetail(beutelWahl, true);
  overlay.querySelectorAll('[data-uid]').forEach(z => {
    if (!z.dataset.uid) return;
    z.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !beutelWahl) zeigeDetail(z.dataset.uid, false); });
    z.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !beutelWahl) zeigeDetail(null); });
    z.addEventListener('click', () => {
      beutelWahl = beutelWahl === z.dataset.uid ? null : z.dataset.uid;
      overlay.querySelectorAll('.zelle').forEach(x => x.classList.toggle('gewaehlt', x.dataset.uid === beutelWahl));
      geraeusch('klick'); zeigeDetail(beutelWahl, true);
    });
  });
  overlay.querySelectorAll('[data-verwerten]').forEach(b => b.addEventListener('click', () => {
    if (!b.dataset.sicher) { b.dataset.sicher = '1'; b.textContent = TX('Sicher? Nochmal tippen'); return; }
    alleVerwerten(b.dataset.verwerten); beutelZeigen();
  }));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { beutelWahl = null; overlayWeg(); });
  const sm = overlay.querySelector('[data-a="schmieden"]');
  if (sm) sm.addEventListener('click', () => { waffeSchmieden(); beutelZeigen(); });
}

// Neue Gegenstände in den Beutel legen. Ist er voll, wird der Rest verkauft.
function inDenBeutel(liste) {
  const rein = [], verkauft = [];
  liste.forEach(it => {
    if (SPIEL.beutel.some(x => x.uid === it.uid)) return;
    if (SPIEL.beutel.length < BEUTEL_PLAETZE) { SPIEL.beutel.push(it); rein.push(it); }
    else { SPIEL.gold += SELTENHEIT[it.selten].wert; verkauft.push(it); }
  });
  return { rein, verkauft };
}

function waffeSchmieden() {
  if (SPIEL.gold < SCHMIEDEN.gold || SPIEL.teile < SCHMIEDEN.teile) { meldung(TX('Nicht genug Gold oder Lazi-Teile'), TX`Schmieden kostet ${SCHMIEDEN.gold} Gold und ${SCHMIEDEN.teile} Teile`); return; }
  if (SPIEL.beutel.length >= BEUTEL_PLAETZE) { meldung(TX('Der Beutel ist voll'), TX('Verkaufe oder zerlege zuerst etwas')); return; }
  SPIEL.gold -= SCHMIEDEN.gold; SPIEL.teile -= SCHMIEDEN.teile;
  const meister = gebaeudeWert('besseresSchmieden');
  const it = beuteWuerfeln('schmiede', meister ? SCHMIEDEN.meister : SCHMIEDEN.seltenheit);
  SPIEL.beutel.push(it);
  beutelWahl = it.uid;
  spielSpeichern(); dorfHudAktualisieren();
  meldung(it.name, TX`${SELTENHEIT[it.selten].name} · geschmiedet und in den Beutel gelegt`);
}

// ---------- Alles Unbenutzte auf einmal verwerten ----------
// Legendäre und Lazi-Gegenstände bleiben dabei immer liegen, damit nichts aus Versehen weg ist
function unbenutzte() {
  const an = new Set(SLOTS.map(sl => SPIEL.ausruestung[sl]));
  return SPIEL.beutel.filter(it => !an.has(it.uid) && it.selten < 3);
}
function verwertenWert(art) {
  let gold = 0, teile = 0;
  unbenutzte().forEach(it => {
    const s = SELTENHEIT[it.selten];
    if (art === 'gold') gold += s.wert;
    else if (art === 'teile') teile += s.teile;
    else { gold += Math.round(s.wert / 2); teile += Math.round(s.teile / 2); }
  });
  return { gold, teile };
}
function verwertenHtml(schmiede) {
  const n = unbenutzte().length;
  if (!n) return '';
  const g = verwertenWert('gold'), t = verwertenWert('teile'), h = verwertenWert('halb');
  return TX`<div class="verwerten"><span class="label">${n} unbenutzte Gegenstände verwerten (ohne Legendär und Lazi)</span>
    <div class="bz-knoepfe">
      <button class="btn small ghost" type="button" data-verwerten="gold">Alles zu Gold +${g.gold}</button>
      <button class="btn small ghost" type="button" data-verwerten="teile" ${schmiede ? '' : TX('disabled title="Braucht eine Schmiede"')}>Alles zu Teilen +${t.teile}</button>
      <button class="btn small ghost" type="button" data-verwerten="halb" ${schmiede ? '' : TX('disabled title="Braucht eine Schmiede"')}>Halb und halb +${h.gold} Gold, +${h.teile} Teile</button>
    </div></div>`;
}
function alleVerwerten(art) {
  const w = verwertenWert(art), weg = new Set(unbenutzte().map(it => it.uid));
  SPIEL.gold += w.gold; SPIEL.teile += w.teile;
  SPIEL.beutel = SPIEL.beutel.filter(it => !weg.has(it.uid));
  beutelWahl = null;
  spielSpeichern(); dorfHudAktualisieren(); geraeusch('muenze');
  meldung(TX`${weg.size} Gegenstände verwertet`, [w.gold ? TX`+${w.gold} Gold` : '', w.teile ? TX`+${w.teile} Lazi-Teile` : ''].filter(Boolean).join(' '), 1800);
}

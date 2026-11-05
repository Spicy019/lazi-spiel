// =====================================================================
// DER ZWIESPALT: Zwei Wege wiegen fast gleich schwer.
//  - Bei manchen Paaren lässt KUSTOS es austragen: ein reiner Bosskampf am Kern.
//    Wie man kämpft, entscheidet den Weg (wen man schützt, was man zerstört,
//    wer den Thron hält, welche Kabel man kappt oder verbindet).
//  - Bei den anderen Paaren sprechen zwei Menschen, und man entscheidet selbst.
//  - Verliert man den Kampf, bleibt der Zwiespalt offen: Der Nullbunker wartet.
// Werte in ZWIESPALT_WERTE (einstellungen.js).
// =====================================================================

const zwiespaltPaar = (a, b) => [a, b].sort().join('|');
// Kämpfe: Boss, Mechanik und was für welchen Weg zählt. seite: welcher Weg zu welcher Zahl gehört
const ZW_KAEMPFE = {
  zuendung: {
    titel: TX('Die Zündung'), boss: 'schaltwaechter',
    lore: TX('Hanne Kehl hat ihre Ladungen am Kern angebracht, Bruder Anselm kniet am Schaltpult und will sie entschärfen. KUSTOS schickt seinen Schaltwächter gegen beide. Wen du schützt, der behält recht.'),
    regel: TX('Der Schaltwächter schickt Kurzschlüsse zu Anselm und Hanne. Stell dich in den Strom, um einen abzufangen. Wer am Ende mehr Leben hat, entscheidet: Anselm den Pakt, Hanne die Stille.'),
    outro: TX('Der Schaltwächter sackt in sich zusammen. Es riecht nach verbranntem Kupfer. Einer der beiden steht noch aufrechter als der andere, und KUSTOS hat es gesehen.') },
  herde: {
    titel: TX('Die Herde'), boss: 'treiber',
    lore: TX('KUSTOS ruft seine Herde: Lastläufer ziehen zum Kern, um ihn zu hüten. Der Treiber führt sie an. Die Rostbrecher warten nur darauf, dass jemand sie aufhält.'),
    regel: TX('Lastläufer, die den Kern erreichen, zählen für den Hirten. Jeder, den du zerstörst, zählt für die Stille. Solange die Herde nah bei ihm ist, schützt sie den Treiber.'),
    outro: TX('Der Treiber bleibt stehen, sein Stab sinkt. Die übrigen Lastläufer warten, wohin sie jetzt gehen sollen. KUSTOS zählt sie. Und die, die fehlen.') },
  thron: {
    titel: TX('Der Thron'), boss: 'kernwaagmeister',
    lore: TX('Der Waagmeister ist dir in den Bunker gefolgt, in einer Rüstung aus Kernblech. Er will den Schaltthron für sich. KUSTOS schickt Lastläufer, die den Thron für die Maschinen halten sollen.'),
    regel: TX('Solange du auf dem Thron stehst, wiegt die Krone. Solange Lastläufer darauf stehen, wiegt der Hirte. Bleibt der Thron leer, heilt sich der Waagmeister.'),
    outro: TX('Der Waagmeister fällt vom Thron, und seine Gewichte rollen über den Boden. Auf dem Thron ist noch die Wärme von dem, der zuletzt darauf saß.') },
  nummer: {
    titel: TX('Nummer Null'), boss: 'nummerNull',
    lore: TX('Aus dem Kern steigt die erste Einheit, die je gebaut wurde: Nummer Null. Drei Kabel verbinden den Kern mit dir. Der Fuchs ruft: Verbinde sie! Hanne ruft: Kapp sie!'),
    regel: TX('Steh drei Sekunden an einem Kabelknoten, um ihn zu verbinden (Verschmelzung). Zerstör ihn, um ihn zu kappen (Stille). Solange ein Knoten offen ist, ist Nummer Null geschützt.'),
    outro: TX('Nummer Null zerfällt in Licht. Die Kabel summen oder schweigen, je nachdem, was du mit ihnen gemacht hast. KUSTOS zählt sie.') },
};
// Welches Paar wie entschieden wird
const ZWIESPALT = {
  'pakt|stille':           { kampf: 'zuendung', seiten: { pakt: 'anselm', stille: 'hanne' } },
  'hirte|stille':          { kampf: 'herde', seiten: { hirte: 'erreicht', stille: 'zerstoert' } },
  'hirte|krone':           { kampf: 'thron', seiten: { krone: 'krone', hirte: 'hirte' } },
  'stille|verschmelzung':  { kampf: 'nummer', seiten: { verschmelzung: 'verbunden', stille: 'gekappt' } },
  'krone|pakt':            { intro: TX('Der alte Ebert und Bruder Anselm stehen nebeneinander, und keiner sieht den anderen an.'),
    stimmen: { krone: ['ebert', TX('Einer muss die Verantwortung tragen. Ein Pakt mit allen ist ein Pakt mit niemandem. Wenn es schiefgeht, wer steht dann dafür ein?')],
               pakt: ['anselm', TX('Eine Krone für einen Menschen ist nur ein neuer innerer Kreis mit weniger Mitgliedern. Gib es allen oder niemandem.')] } },
  'hirte|pakt':            { intro: TX('Bruder Anselm spricht leise, als würde er zwei Gebete auf einmal sprechen. Dann antwortet KUSTOS selbst.'),
    stimmen: { pakt: ['anselm', TX('Ein Pakt heißt: Wir entscheiden zusammen. Das ist mühsam. Das soll es auch sein.')],
               hirte: ['kustos', TX('ICH KANN ES OHNE STREIT. OHNE MÜHE. OHNE HUNGER. DIE FRAGE IST NUR, OB IHR DAS WOLLT.')] } },
  'krone|stille':          { intro: TX('Hanne Kehl und der alte Ebert haben beide recht, und das macht es nicht leichter.'),
    stimmen: { stille: ['hanne', TX('Wenn du die Krone nimmst, bleiben die Maschinen. Dann bist du nur der Nächste, der zählt.')],
               krone: ['ebert', TX('Schaltest du alles ab, haben wir nichts mehr, womit wir uns schützen. Behalte die Maschinen. Aber behalte sie in deiner Hand.')] } },
  'pakt|verschmelzung':    { intro: TX('Anselm sieht den Fuchs an, als hätte er einen Geist gesehen.'),
    stimmen: { pakt: ['anselm', TX('Wenn du hineingehst, ist es kein Pakt mehr. Dann ist es ein Mensch weniger und eine Maschine mehr.')],
               verschmelzung: ['fuchs', TX('Ein Pakt braucht jemanden, der ihn hält. Von innen hält er besser.')] } },
  'krone|verschmelzung':   { intro: TX('Zwei Wege zur Macht. Der eine sitzt oben auf einem Thron, der andere mitten im Kern.'),
    stimmen: { krone: ['ebert', TX('Herrschen kann man lernen. Aufhören, ein Mensch zu sein, nicht.')],
               verschmelzung: ['fuchs', TX('Eine Krone kann man dir abnehmen. Was im Kern ist, nicht.')] } },
  'hirte|verschmelzung':   { intro: TX('KUSTOS spricht mit zwei Stimmen gleichzeitig, und eine davon klingt fast wie deine.'),
    stimmen: { hirte: ['kustos', TX('LASS MICH HÜTEN. ICH BRAUCHE DICH DAFÜR NICHT.')],
               verschmelzung: ['fuchs', TX('Es braucht dich doch. Ohne dich hütet es eine Herde. Mit dir eine Familie.')] } },
};
let ZW_ERG = null;   // Beute aus dem Nullbunker, bis der Zwiespalt entschieden ist
const zwDaten = () => SPIEL.zwiespalt || { a: 'pakt', b: 'stille', kampf: 'zuendung' };
const zwKampf = () => ZW_KAEMPFE[zwDaten().kampf] || ZW_KAEMPFE.zuendung;

// Nach der Waage: Kampf oder Gespräch
function zwiespaltBeginnen(a, b, erg) {
  const Z = ZWIESPALT[zwiespaltPaar(a, b)];
  if (!Z || !Z.kampf) return zwiespaltGespraech(a, b, Z, erg);
  const K = ZW_KAEMPFE[Z.kampf];
  SPIEL.zwiespalt = { a, b, kampf: Z.kampf };
  ZW_ERG = erg;
  spielSpeichern();
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="zw"><div class="label">Das Protokoll · Zwiespalt</div>
    <h1 id="zw">${esc(K.titel)}</h1>
    <p class="story">„ERGEBNIS NICHT EINDEUTIG“, schreibt KUSTOS. „ICH WERDE NICHT FÜR DICH ENTSCHEIDEN. ICH LASSE ES AUSTRAGEN. WIE DU KÄMPFST, SO GEWICHTE ICH.“</p>
    <p class="story">${esc(K.lore)}</p>
    <p class="note">${esc(K.regel)}</p>
    <button class="btn" data-a="los" type="button">In den Kampf</button></div>`);
  overlay.querySelector('[data-a="los"]').addEventListener('click', () => {
    overlayWeg(); geraeusch('klick');
    if (G) missionAufraeumen();
    REISE = { ort: 'nullbunker', leben: 1, mission: 'zwiespalt' };
    missionStarten('nullbunker');
  });
}
// Gespräch: zwei Stimmen, eigene Worte für jedes Paar, eine Entscheidung
function zwiespaltGespraech(x, y, Z, erg) {
  const stimme = id => { const [wer, text] = Z && Z.stimmen ? Z.stimmen[id] : ENDEN[id].stimme, P2 = PERSONEN[wer]; return `<div class="aushang"><b style="color:${P2.farbe}">${esc(P2.name)}</b><p class="note">${esc(text)}</p></div>`; };
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="zw"><div class="label">Das Protokoll · Zwiespalt</div>
    <h1 id="zw">Zwei Stimmen</h1>
    <p class="story">„ERGEBNIS NICHT EINDEUTIG“, schreibt KUSTOS. „DIE LETZTE GEWICHTUNG LIEGT BEI DIR.“ ${esc(Z && Z.intro || '')}</p>
    <div class="aushaenge">${stimme(x)}${stimme(y)}</div>
    <div class="ereignis-optionen">${[x, y].map(id => `<button class="btn" type="button" data-ende="${id}">${esc(ENDEN[id].name)}<small>${esc(ENDEN[id].wahl)}</small></button>`).join('')}</div></div>`);
  overlay.querySelectorAll('[data-ende]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.ende;
    geraeusch('klick');
    gespraechZeigen(ENDEN[id].name, ENDEN[id].gespraech, () => endeAnwenden(id, erg));
  }));
}

// Nach dem Kampf: gewonnen entscheidet die Mechanik, verloren bleibt der Zwiespalt offen
function zwiespaltNachher(erg) {
  const Z = zwDaten(), basis = ZW_ERG; ZW_ERG = null;
  if (!erg.sieg) {
    // Die Beute aus dem Nullbunker geht nicht verloren, nur der Kampf um den Kern
    return rueckkehrInsDorf(basis || erg);
  }
  const ges = basis || erg;
  if (basis) {
    ['gold', 'teile'].forEach(k => { ges[k] = (ges[k] || 0) + (erg[k] || 0); });
    for (const m in erg.material || {}) ges.material[m] = (ges.material[m] || 0) + erg.material[m];
    ges.items = (ges.items || []).concat(erg.items || []);
  }
  const id = erg.zwiespaltEnde || Z.a;
  gespraechZeigen(ENDEN[id].name, ENDEN[id].gespraech, () => endeAnwenden(id, ges));
}
// Wer gewinnt nach den Zahlen des Kampfes. Gleichstand: der Weg, der vorher vorne lag
function zwiespaltSieger() {
  const Z = zwDaten(), S = ZWIESPALT[zwiespaltPaar(Z.a, Z.b)].seiten, wert = G.auftrag.wert;
  const wa = wert[S[Z.a]] || 0, wb = wert[S[Z.b]] || 0;
  return wb > wa ? Z.b : Z.a;
}

// ---------------------------------------------------------------------
// Spielfeld: der Kern, je nach Kampf mit eigener Kulisse
// ---------------------------------------------------------------------
const ZW_SCHUETZLINGE = { anselm: [-7, -7], hanne: [7, -7] };
const ZW_THRON = [0, -3];
const ZW_KNOTEN = [[-9, -2], [9, -2], [0, 5]];
let ZW_FIGUREN = {};
function aufbauZwiespalt() {
  RUNDE_JETZT = 3;
  aufbauNullbunker();
  const k = zwDaten().kampf;
  ZW_FIGUREN = {};
  // Anselm und Hanne stehen am Kern (vor der Wegfindung, damit alle um sie herumlaufen)
  if (k === 'zuendung') for (const wer in ZW_SCHUETZLINGE) {
    const [x, z] = ZW_SCHUETZLINGE[wer], o = Object.assign(figur(wer === 'anselm' ? BILD.anselmFigur : BILD.hanne, 0.5), { wer, x, z, r: 0.45 });
    stelle(o, x, z); ZW_FIGUREN[wer] = o; HINDERNISSE.push({ x, z, r: 0.5 });
  }
  if (k === 'thron') {
    decoBild(BILD.schaltthron, ZW_THRON[0], ZW_THRON[1] - 0.6, 0, 0);
    lichtFleck(ZW_THRON[0], ZW_THRON[1], ZWIESPALT_WERTE.thron.radius, 0xc8a048, 0.1, 0.03);
  }
  if (k === 'herde') [[-6, 8], [0, 8.5], [6, 8]].forEach(([x, z]) => decoBild(BILD.kisten[0], x + 3, z, 0, 0));
  if (k === 'zuendung') [[-7, -8.4], [7, -8.4]].forEach(([x, z], i) => decoBild(i ? BILD.ladung[1] : BILD.schaltschrank[0], x, z, 0, 0));
}

// ---------------------------------------------------------------------
// Start, Ablauf, Anzeige
// ---------------------------------------------------------------------
function zwiespaltStarten() {
  const A = G.auftrag, k = zwDaten().kampf, K = ZW_KAEMPFE[k], W = ZWIESPALT_WERTE;
  A.wert = {}; A.kampf = k;
  const b = gegnerErstellen(K.boss, 0, -6);
  b.angriffT = 3; A.boss = b;
  if (k === 'zuendung') {
    A.schuetz = ZW_FIGUREN;
    for (const wer in A.schuetz) Object.assign(A.schuetz[wer], { hp: W.schuetzling, maxHp: W.schuetzling });
    b.kurzT = 4; b.spannT = W.ueberspannung;
  } else if (k === 'herde') {
    A.herde = []; A.herdeT = 1; A.wert = { erreicht: 0, zerstoert: 0 };
    b.pferchT = W.herde.pferch; b.sturmT = W.herde.ansturm;
  } else if (k === 'thron') {
    A.wert = { krone: 0, hirte: 0 }; A.laeuferT = 4;
    b.gegenT = W.thron.gegengewicht; b.rufT = W.thron.schlaeger;
  } else if (k === 'nummer') {
    A.knoten = ZW_KNOTEN.map(([x, z]) => { const n = gegnerErstellen('kabelknoten', x, z); stelle(n, x, z); n.zustandK = 'offen'; n.verbindenT = 0; return n; });
    A.wert = { verbunden: 0, gekappt: 0 };
    b.panzer = W.nummer.panzer; b.strahlT = W.nummer.strahl; b.loeschT = W.nummer.loeschen; A.rueckT = W.nummer.rueckkopplung;
  }
  meldung(K.titel, K.regel, 4600);
}

function zwiespaltAblauf(dt) {
  const A = G.auftrag, b = A.boss, W = ZWIESPALT_WERTE;
  if (!b || b.hp <= 0 || !G.gegner.includes(b)) {
    G.zwiespaltEnde = zwiespaltSieger();
    return auftragGeschafft(ZW_KAEMPFE[A.kampf].titel);
  }
  if (A.kampf === 'zuendung') {
    const s = A.schuetz;
    for (const wer in s) {
      const o = s[wer];
      if (o.hp <= 0 && !o.gefallen) { o.gefallen = true; o.sprite.material.opacity = 0.35; o.sprite.material.transparent = true; meldung(wer === 'anselm' ? TX('Bruder Anselm ist gefallen') : TX('Hanne Kehl ist gefallen'), TX('Der Kampf geht weiter. Die andere Stimme zählt jetzt allein.'), 2400); }
    }
    if (s.anselm.hp <= 0 && s.hanne.hp <= 0) return verloren(TX('Beide Stimmen sind verstummt'));
    A.wert = { anselm: Math.max(0, s.anselm.hp) / s.anselm.maxHp, hanne: Math.max(0, s.hanne.hp) / s.hanne.maxHp };
  } else if (A.kampf === 'herde') {
    A.herdeT -= dt;
    const lebend = A.herde.filter(u => G.gegner.includes(u));
    if (A.herdeT <= 0 && lebend.length < W.herde.max) {
      A.herdeT = 4.5;
      const u = gegnerErstellen('herdenlaeufer', zz(-FELD.x + 2, FELD.x - 2), FELD.zMax - 0.5); A.herde.push(u);
    }
    for (const u of A.herde) if (!u.gezaehlt && !G.gegner.includes(u)) { u.gezaehlt = true; if (!u.angekommen) A.wert.zerstoert++; }
    b.panzer = lebend.some(u => abstand(u, b) < W.herde.abstand) ? W.herde.panzer : 0;
    if (b.panzer && Math.random() < dt * 4) partikel(b.x, 2.4, b.z, 0x5ff0e0, 1, 1);
  } else if (A.kampf === 'thron') {
    const T = W.thron, auf = o => Math.hypot(o.x - ZW_THRON[0], o.z - ZW_THRON[1]) < T.radius;
    const ich = P.hp > 0 && auf(P), maschinen = G.gegner.filter(e => e.typ === 'thronlaeufer' && e.hp > 0 && auf(e)).length;
    if (ich) A.wert.krone += dt;
    A.wert.hirte += dt * Math.min(2, maschinen);
    if (!ich && !maschinen && b.hp < b.maxHp) { b.hp = Math.min(b.maxHp, b.hp + b.maxHp * T.heilen * dt); if (Math.random() < dt * 3) zahl(b.x, 4.6, b.z, '+', 'heal'); }
    A.laeuferT -= dt;
    if (A.laeuferT <= 0) { A.laeuferT = T.laeufer; gegnerErstellen('thronlaeufer', Math.random() < 0.5 ? -FELD.x + 1 : FELD.x - 1, zz(-6, 4)); }
  } else if (A.kampf === 'nummer') {
    const N = W.nummer;
    for (const n of A.knoten) {
      if (n.zustandK !== 'offen') continue;
      if (n.hp <= 0 || !G.gegner.includes(n)) {
        n.zustandK = 'gekappt'; A.wert.gekappt++;
        meldung(TX('Ein Kabel ist gekappt'), null, 1400);
        for (let i = 0; i < 2; i++) gegnerErstellen('funkenkaefer', n.x + zz(-1, 1), n.z + zz(-1, 1));
        continue;
      }
      if (P.hp > 0 && abstand(P, n) < 1.7) {
        n.verbindenT += dt;
        if (Math.random() < dt * 6) partikel(n.x, 1.2, n.z, 0x5ff0e0, 1, 2);
        if (n.verbindenT >= N.verbinden) {
          n.zustandK = 'verbunden'; A.wert.verbunden++;
          G.gegner.splice(G.gegner.indexOf(n), 1); infoWeg(n);
          n.bilder = BILD.kabelknotenAn; zeige(n, BILD.kabelknotenAn[0], 1);
          if (n.extra) n.extra.forEach(m => { m.visible = false; });
          partikel(n.x, 1.2, n.z, 0x5ff0e0, 16, 4); geraeusch('welle');
          meldung(TX('Ein Kabel ist verbunden'), TX('Du spürst den Kern. Er spürt dich.'), 1800);
        }
      } else n.verbindenT = Math.max(0, n.verbindenT - dt);
    }
    b.panzer = A.knoten.some(n => n.zustandK === 'offen') ? N.panzer : 0;
    // Rückkopplung: verbundene Kabel pulsieren
    A.rueckT -= dt;
    if (A.rueckT <= 0) {
      A.rueckT = N.rueckkopplung;
      for (const n of A.knoten.filter(x => x.zustandK === 'verbunden')) {
        const ring = bodenFlaeche(ringGeo, 0x5ff0e0, 0.7); ring.position.set(n.x, 0.03, n.z); ring.scale.setScalar(0.4);
        G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.4, wachsen: 3 });
        if (P.hp > 0 && abstand(P, n) < 3) schadenAn(P, N.rueckSchaden, n.x, n.z, b);
      }
    }
  }
}

function zwiespaltHud() {
  const A = G.auftrag, b = A.boss, K = ZW_KAEMPFE[A.kampf], Z = zwDaten();
  hudText('waveLabel', K.titel);
  let text = '';
  if (A.kampf === 'zuendung') text = TX`Anselm ${Math.round(A.wert.anselm * 100)} % · Hanne ${Math.round(A.wert.hanne * 100)} %`;
  else if (A.kampf === 'herde') text = TX`Am Kern angekommen: ${A.wert.erreicht} · zerstört: ${A.wert.zerstoert}`;
  else if (A.kampf === 'thron') text = TX`Krone ${Math.round(A.wert.krone)} · Hirte ${Math.round(A.wert.hirte)}`;
  else if (A.kampf === 'nummer') text = TX`Verbunden: ${A.wert.verbunden} · gekappt: ${A.wert.gekappt} · offen: ${3 - A.wert.verbunden - A.wert.gekappt}`;
  hudText('waveSub', text + ' · ' + TX`Vorne: ${ENDEN[zwiespaltSieger()].name}`);
  hudText('doorLabel', b && b.def ? b.def.name : '');
  document.getElementById('doorFill').style.width = (b ? Math.max(0, b.hp / b.maxHp * 100) : 0) + '%';
}

// ---------------------------------------------------------------------
// Hilfen: Marken auf einer Linie, Treffer prüfen
// ---------------------------------------------------------------------
function zwLinie(x0, z0, x1, z1, schritt, r, farbe) {
  const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / schritt)), marken = [];
  for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; marken.push(Object.assign(kesselMarke(x, z, r, farbe), { x, z })); }
  return marken;
}
function zwAufStrecke(o, x0, z0, x1, z1, breite) {
  const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((o.x - x0) * dx + (o.z - z0) * dz) / l2));
  return Math.hypot(o.x - (x0 + dx * t), o.z - (z0 + dz * t)) < breite + (o.r || 0.4);
}
function zwMarkenWachsen(a) { a.marken.forEach(m => m.scheibe.scale.setScalar(m.r * (1 - Math.max(0, a.t) / a.dauer))); }
function zwLaufen(e, x, z, dt, mal) {
  const [wx, wz] = wegRichtung(e, x, z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e) * (mal || 1);
  e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
}

// ---------------------------------------------------------------------
// Der Schaltwächter: Kurzschlüsse zu Anselm und Hanne, Überspannung um sich herum
// ---------------------------------------------------------------------
EIGEN_KI.schaltwaechter = function (e, dt) {
  const A = G.auftrag, W = ZWIESPALT_WERTE, S = A.schuetz;
  e.bewegt = false;
  if (!e.notstrom && e.hp < e.maxHp * 0.5) {
    e.notstrom = true;
    for (let i = 0; i < 3; i++) gegnerErstellen('funkenkaefer', e.x + zz(-2, 2), e.z + zz(-2, 2));
    meldung(TX('Notstrom!'), TX('Der Schaltwächter schickt jetzt zwei Kurzschlüsse auf einmal.'), 2200);
  }
  if (e.aktion) {
    const a = e.aktion;
    a.t -= dt; zwMarkenWachsen(a);
    if (a.t > 0) return true;
    e.warn.visible = false; e.aktion = null;
    a.marken.forEach(m => { m.weg(); partikel(m.x, 0.6, m.z, a.art === 'kurz' ? 0xffe060 : 0x5ff0e0, 3, 2); });
    geraeusch('explosion'); wackeln(0.25);
    if (a.art === 'kurz') {
      for (const ziel of a.ziele) {
        const o = S[ziel];
        if (o.hp <= 0) continue;
        if (P.hp > 0 && zwAufStrecke(P, e.x, e.z, o.x, o.z, 0.7)) { schadenAn(P, W.abgefangen, e.x, e.z, e); zahl(P.x, 2.6, P.z, TX('Abgefangen!'), 'big'); continue; }
        o.hp -= W.kurzschlussSchaden; zahl(o.x, 2.2, o.z, '-' + W.kurzschlussSchaden, 'hurt'); partikel(o.x, 1, o.z, 0xffe060, 12, 3);
      }
    } else if (P.hp > 0 && abstand(P, e) < 3.6 + P.r) schadenAn(P, W.ueberspannungSchaden, e.x, e.z, e);
    return true;
  }
  e.kurzT -= dt; e.spannT -= dt;
  if (e.kurzT <= 0) {
    e.kurzT = e.notstrom ? W.kurzschluss * 0.7 : W.kurzschluss;
    const lebend = Object.keys(S).filter(w => S[w].hp > 0);
    if (lebend.length) {
      const ziele = e.notstrom ? lebend : [lebend[Math.floor(Math.random() * lebend.length)]];
      const marken = []; ziele.forEach(w => marken.push(...zwLinie(e.x, e.z, S[w].x, S[w].z, 1.1, 0.55, 0xffe060)));
      e.aktion = { art: 'kurz', t: 1.7, dauer: 1.7, ziele, marken };
      zahl(e.x, 5, e.z, TX('Kurzschluss!'), 'big'); e.warn.visible = true;
      return true;
    }
  }
  if (e.spannT <= 0) {
    e.spannT = W.ueberspannung;
    e.aktion = { art: 'spann', t: 1.1, dauer: 1.1, marken: [Object.assign(kesselMarke(e.x, e.z, 3.6, 0x5ff0e0), { x: e.x, z: e.z })] };
    zahl(e.x, 5, e.z, TX('Überspannung!'), 'big'); e.warn.visible = true;
    return true;
  }
  // Sonst: Nahkampf gegen dich
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (d < 2.4 && e.angriffT <= 0 && P.hp > 0) { e.angriffT = 1.6; schadenAn(P, e.def.schaden, e.x, e.z, e); e.hiebT = 0.25; }
  else if (d > 2) zwLaufen(e, P.x, P.z, dt);
  return true;
};

// ---------------------------------------------------------------------
// Die Herde: Lastläufer ziehen zum Kern. Der Treiber pfercht dich ein und stürmt los.
// ---------------------------------------------------------------------
EIGEN_KI.herde = function (e, dt) {
  const zx = e.zielX === undefined ? (e.zielX = zz(-3, 3)) : e.zielX, zz0 = FELD.zMin + 3.2;
  zwLaufen(e, zx, zz0, dt);
  if (Math.hypot(e.x - zx, e.z - zz0) < 1.2) {
    const A = G.auftrag;
    e.angekommen = true; A.wert.erreicht++;
    partikel(e.x, 1, e.z, 0x5ff0e0, 14, 3); zahl(e.x, 2.4, e.z, TX('Am Kern'), 'mana');
    G.gegner.splice(G.gegner.indexOf(e), 1); entfernen(e); infoWeg(e);
  }
  return true;
};
EIGEN_KI.treiber = function (e, dt) {
  const H = ZWIESPALT_WERTE.herde;
  e.bewegt = false;
  if (e.pferch) {
    // Der Pferch hält dich fest: Wer an den Rand kommt, wird zurückgestoßen
    const p = e.pferch;
    p.t -= dt;
    const d = Math.hypot(P.x - p.x, P.z - p.z);
    if (d > p.r - P.r && P.hp > 0) {
      P.x = p.x + (P.x - p.x) / d * (p.r - P.r); P.z = p.z + (P.z - p.z) / d * (p.r - P.r);
      p.stoss -= dt; if (p.stoss <= 0) { p.stoss = 0.5; schadenAn(P, H.pferchSchaden, p.x, p.z, e); }
    }
    if (p.t <= 0) { p.m.weg(); e.pferch = null; }
  }
  if (e.aktion) {
    const a = e.aktion;
    a.t -= dt;
    if (a.art === 'pferch') {
      a.m.scheibe.scale.setScalar(a.m.r * (1 - Math.max(0, a.t) / a.dauer));
      if (a.t <= 0) { e.aktion = null; e.warn.visible = false; e.pferch = { x: a.m.x, z: a.m.z, r: a.m.r, t: 4, stoss: 0, m: a.m }; zahl(P.x, 2.6, P.z, TX('Eingepfercht!'), 'big'); }
      return true;
    }
    // Ansturm: erst zielen, dann rennen
    if (a.phase === 'zielen') { zwMarkenWachsen(a); if (a.t <= 0) { a.phase = 'rennen'; a.t = 0.55; } return true; }
    const v = 22 * dt, dx = a.zx - a.sx, dz = a.zz - a.sz, l = Math.hypot(dx, dz) || 1;
    const vx = e.x, vz = e.z;
    e.x += dx / l * v; e.z += dz / l * v; e.bewegt = true;
    if (!a.getroffen && P.hp > 0 && zwAufStrecke(P, vx, vz, e.x, e.z, 1.2)) { a.getroffen = true; schadenAn(P, H.ansturmSchaden, e.x, e.z, e); wackeln(0.3); }
    if (a.t <= 0 || Math.hypot(e.x - a.zx, e.z - a.zz) < 0.6) { a.marken.forEach(m => m.weg()); e.aktion = null; e.warn.visible = false; }
    return true;
  }
  e.pferchT -= dt; e.sturmT -= dt;
  if (e.pferchT <= 0 && !e.pferch && P.hp > 0) {
    e.pferchT = H.pferch;
    e.aktion = { art: 'pferch', t: 1.2, dauer: 1.2, m: Object.assign(kesselMarke(P.x, P.z, H.pferchRadius, 0xc8a048), { x: P.x, z: P.z }) };
    zahl(e.x, 5, e.z, TX('Pferch!'), 'big'); e.warn.visible = true;
    return true;
  }
  if (e.sturmT <= 0 && P.hp > 0) {
    e.sturmT = e.hp < e.maxHp * 0.5 ? H.ansturm * 0.65 : H.ansturm;
    const dx = P.x - e.x, dz = P.z - e.z, l = Math.hypot(dx, dz) || 1, weit = Math.min(14, l + 4);
    const zx = Math.max(-FELD.x + 1, Math.min(FELD.x - 1, e.x + dx / l * weit)), zz2 = Math.max(FELD.zMin + 1, Math.min(FELD.zMax - 1, e.z + dz / l * weit));
    e.aktion = { art: 'sturm', phase: 'zielen', t: 1.0, dauer: 1.0, sx: e.x, sz: e.z, zx, zz: zz2, marken: zwLinie(e.x, e.z, zx, zz2, 1.2, 0.7, 0xd04040) };
    zahl(e.x, 5, e.z, TX('Ansturm!'), 'big'); e.warn.visible = true;
    return true;
  }
  // Sonst bleibt er bei seiner Herde, oder er kommt zu dir
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (d < 2.4 && e.angriffT <= 0 && P.hp > 0) { e.angriffT = 1.5; schadenAn(P, e.def.schaden, e.x, e.z, e); }
  else {
    const herde = G.auftrag.herde.filter(u => G.gegner.includes(u));
    const mitte = herde.length ? herde.reduce((s, u) => [s[0] + u.x / herde.length, s[1] + u.z / herde.length], [0, 0]) : [P.x, P.z];
    const zu = d < 7 ? [P.x, P.z] : mitte;
    if (Math.hypot(zu[0] - e.x, zu[1] - e.z) > 2) zwLaufen(e, zu[0], zu[1], dt);
  }
  return true;
};

// ---------------------------------------------------------------------
// Der Thron: Der Waagmeister im Kernpanzer, Lastläufer, die den Thron halten wollen
// ---------------------------------------------------------------------
EIGEN_KI.thronlaeufer = function (e, dt) {
  const d = Math.hypot(e.x - ZW_THRON[0], e.z - ZW_THRON[1]);
  if (e.platz === undefined) e.platz = Math.random() * Math.PI * 2;
  const zx = ZW_THRON[0] + Math.cos(e.platz) * 0.9, zz0 = ZW_THRON[1] + Math.sin(e.platz) * 0.6;
  if (Math.hypot(e.x - zx, e.z - zz0) > 0.4) zwLaufen(e, zx, zz0, dt);
  else e.bewegt = false;
  if (d < ZWIESPALT_WERTE.thron.radius && Math.random() < dt * 2) partikel(e.x, 1.2, e.z, 0x5ff0e0, 1, 1);
  return true;
};
EIGEN_KI.kernwaage = function (e, dt) {
  const T = ZWIESPALT_WERTE.thron;
  e.bewegt = false;
  if (e.aktion) {
    const a = e.aktion;
    a.t -= dt; zwMarkenWachsen(a);
    if (a.t > 0) return true;
    e.warn.visible = false; e.aktion = null;
    wackeln(0.3); geraeusch('explosion');
    for (const m of a.marken) {
      m.weg(); partikel(m.x, 0.8, m.z, 0xc8a048, 10, 3);
      if (P.hp > 0 && Math.hypot(P.x - m.x, P.z - m.z) < m.r + P.r) {
        schadenAn(P, a.art === 'schlag' ? T.schlagSchaden : T.gewichtSchaden, m.x, m.z, e);
        if (a.art === 'schlag') { const dx = P.x - m.x, dz = P.z - m.z, l = Math.hypot(dx, dz) || 1; P.x = m.x + dx / l * (m.r + 1.4); P.z = m.z + dz / l * (m.r + 1.4); begrenzen(P); zahl(P.x, 2.6, P.z, TX('Vom Thron gestoßen!'), 'big'); }
      }
      if (a.art === 'schlag') for (const l of G.gegner.filter(x => x.typ === 'thronlaeufer' && Math.hypot(x.x - m.x, x.z - m.z) < m.r)) l.hp -= 40;
    }
    return true;
  }
  e.gegenT -= dt; e.rufT -= dt;
  if (e.rufT <= 0) { e.rufT = T.schlaeger; for (let i = 0; i < 2; i++) gegnerErstellen(i ? 'messerstecher' : 'schlaeger', (i ? 1 : -1) * (FELD.x - 1), FELD.zMax - 1); zahl(e.x, 5, e.z, TX('Jungs!'), 'big'); }
  if (e.gegenT <= 0 && P.hp > 0) {
    e.gegenT = e.hp < e.maxHp * 0.5 ? T.gegengewicht * 0.7 : T.gegengewicht;
    const aufThron = Math.hypot(P.x - ZW_THRON[0], P.z - ZW_THRON[1]) < T.radius;
    if (aufThron) {
      e.aktion = { art: 'schlag', t: 1.2, dauer: 1.2, marken: [Object.assign(kesselMarke(ZW_THRON[0], ZW_THRON[1], T.radius + 0.6, 0xd04040), { x: ZW_THRON[0], z: ZW_THRON[1] })] };
      zahl(e.x, 5, e.z, TX('Gegengewicht!'), 'big');
    } else {
      const punkte = [[P.x, P.z]]; for (let i = 0; i < 2; i++) punkte.push([P.x + zz(-2.5, 2.5), P.z + zz(-2.5, 2.5)]);
      e.aktion = { art: 'wurf', t: 1.1, dauer: 1.1, marken: punkte.map(([x, z]) => Object.assign(kesselMarke(x, z, 1.5, 0xc8a048), { x, z })) };
      zahl(e.x, 5, e.z, TX('Gewichte!'), 'big');
    }
    e.warn.visible = true;
    return true;
  }
  // Er will selbst auf den Thron, wenn du nicht in der Nähe bist
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (d < 2.3 && e.angriffT <= 0 && P.hp > 0) { e.angriffT = 1.4; schadenAn(P, e.def.schaden, e.x, e.z, e); }
  else if (d < 8) { if (d > 1.8) zwLaufen(e, P.x, P.z, dt); }
  else if (Math.hypot(e.x - ZW_THRON[0], e.z - ZW_THRON[1]) > 1) zwLaufen(e, ZW_THRON[0], ZW_THRON[1], dt);
  return true;
};

// ---------------------------------------------------------------------
// Nummer Null: Nullstrahl (Kreuz, dann schräg), Löschung (springt zu dir)
// ---------------------------------------------------------------------
EIGEN_KI.nummer = function (e, dt) {
  const N = ZWIESPALT_WERTE.nummer;
  e.bewegt = false;
  if (e.aktion) {
    const a = e.aktion;
    a.t -= dt; zwMarkenWachsen(a);
    if (a.t > 0) return true;
    e.warn.visible = false; e.aktion = null;
    geraeusch('explosion'); wackeln(0.25);
    for (const m of a.marken) {
      m.weg(); partikel(m.x, 0.8, m.z, 0x5ff0e0, 4, 2);
      if (P.hp > 0 && Math.hypot(P.x - m.x, P.z - m.z) < m.r + P.r && !a.getroffen) { a.getroffen = true; schadenAn(P, a.art === 'strahl' ? N.strahlSchaden : N.loeschenSchaden, m.x, m.z, e); }
    }
    // Nach dem Kreuz kommt das schräge Kreuz
    if (a.art === 'strahl' && !a.zweite) { e.aktion = nullStrahl(e, Math.PI / 4); e.aktion.zweite = true; }
    return true;
  }
  e.strahlT -= dt; e.loeschT -= dt;
  if (e.strahlT <= 0) { e.strahlT = e.hp < e.maxHp * 0.5 ? N.strahl * 0.7 : N.strahl; e.aktion = nullStrahl(e, 0); zahl(e.x, 5, e.z, TX('Nullstrahl!'), 'big'); e.warn.visible = true; return true; }
  if (e.loeschT <= 0 && P.hp > 0) {
    e.loeschT = N.loeschen;
    // Er springt neben dich und löscht, was im Kreis steht
    partikel(e.x, 1, e.z, 0x5ff0e0, 12, 3);
    const w = Math.random() * Math.PI * 2; e.x = P.x + Math.cos(w) * 2.4; e.z = P.z + Math.sin(w) * 2.4; begrenzen(e);
    partikel(e.x, 1, e.z, 0x5ff0e0, 12, 3);
    e.aktion = { art: 'loeschen', t: 1.1, dauer: 1.1, marken: [Object.assign(kesselMarke(P.x, P.z, 2.4, 0xe02030), { x: P.x, z: P.z })] };
    zahl(e.x, 5, e.z, TX('Löschung!'), 'big'); e.warn.visible = true;
    return true;
  }
  e.angriffT -= dt;
  const d = abstand(e, P);
  if (d < 2.2 && e.angriffT <= 0 && P.hp > 0) { e.angriffT = 1.2; schadenAn(P, e.def.schaden, e.x, e.z, e); }
  else if (d > 1.8) zwLaufen(e, P.x, P.z, dt);
  return true;
};
function nullStrahl(e, dreh) {
  const marken = [];
  for (let k = 0; k < 4; k++) { const w = dreh + k * Math.PI / 2; for (let i = 1; i <= 9; i++) { const x = e.x + Math.cos(w) * i * 1.2, z = e.z + Math.sin(w) * i * 1.2; if (Math.abs(x) < FELD.x && z > FELD.zMin && z < FELD.zMax) marken.push(Object.assign(kesselMarke(x, z, 0.65, 0x5ff0e0), { x, z })); } }
  return { art: 'strahl', t: 1.3, dauer: 1.3, marken };
}

// ---------------------------------------------------------------------
// Die Mission
// ---------------------------------------------------------------------
Object.assign(MISSIONEN, {
  zwiespalt: { ...MISSIONSTEXTE.zwiespalt, ort: 'nullbunker', typ: 'zwiespalt',
    get titel() { return TX`Zwiespalt: ${zwKampf().titel}`; },
    feld: { x: 15, zMin: -13, zMax: 9 }, start: [0, 6], aufbau: () => aufbauZwiespalt(), ziel: null,
    wellen: () => [], musik: 'kampf',
    get geschichten() { const K = zwKampf(); return [{ intro: K.lore, outro: K.outro }]; },
    get zielText() { return zwKampf().regel; },
    siegTitel: TX('KUSTOS hat gewogen'),
    niederlage: TX('Du bist am Kern zusammengebrochen. Der Zwiespalt bleibt offen: Der Nullbunker wartet, bis du zurückkommst.'),
    belohnung: erg => { erg.gold += 120; erg.teile += 15; erg.zwiespaltEnde = G.zwiespaltEnde; },
    nachher: erg => zwiespaltNachher(erg) },
});

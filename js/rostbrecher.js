// =====================================================================
// DIE ROSTBRECHER (5.7b): Weg B gegen die Maschinen
//  - Menschen, die glauben, dass die Maschinen euch nur füttern, damit ihr stillhaltet.
//    Ihr Flugblatt hängt am weißen Brett, ihr Stand auf dem Markt (Hanne Kehl).
//  - Statt einen Verbund auf eure Seite zu holen, kann man ihn stilllegen:
//    Sabotage am Knoten des Verbunds (eigene Missionsart). Er zählt dann für die
//    Epochenziele, der innere Kreis kann ihn nicht mehr umdrehen, und er gibt
//    einen anderen, gleich großen Vorteil (CLUSTER[id].still).
//  - Der Störsender ist das Gegenstück zum Signalturm.
// Werte in ROSTBRECHER (einstellungen.js).
// =====================================================================

// Störsender: wirkt nur, wenn er heute sein Altmetall bekommen hat
function stoerWert() { return SPIEL && SPIEL.stoerOk ? gebaeudeWert('stoer') || 0 : 0; }
// Hanne spricht von Verbünden: Ihr Stand öffnet erst, wenn man von ihnen weiß (Story-Stufe)
function rostbrecherBekannt() { return hatLore('rostbrecher') && SPIEL.epoche >= ROSTBRECHER.abEpoche && storyAb('verbuende'); }
function stillgelegt() { return Object.keys(CLUSTER).filter(verbundStill); }

// Jeden Tag: Störsender verbraucht Altmetall, stillgelegte Verbünde bringen ihren Vorteil
function rostbrecherTag(bericht) {
  if (hatGebaeude('stoersender')) {
    SPIEL.stoerOk = (SPIEL.altmetall || 0) >= 1;
    if (SPIEL.stoerOk) SPIEL.altmetall -= 1;
    else bericht.push(TX('Störsender: Es fehlt Altmetall, er schweigt.'));
  } else SPIEL.stoerOk = false;
  const S = ROSTBRECHER.still;
  if (verbundStill('energie')) SPIEL.verschmutzung = Math.max(0, (SPIEL.verschmutzung || 0) - S.energie.verschmutzung);
  const metall = (verbundStill('logistik') ? S.logistik.altmetall : 0) + (verbundStill('produktion') ? S.produktion.altmetall : 0);
  if (metall) { SPIEL.altmetall = (SPIEL.altmetall || 0) + metall; bericht.push(satz(TX('Aus stillgelegten Maschinen schneiden die Leute Altmetall. Es quietscht, aber keine Maschine wehrt sich mehr.'), TX('Stillgelegte Maschinen werden zerlegt. Was einmal lief, wird jetzt Altmetall.'))); }
  if (verbundStill('wissen') && SPIEL.tag % S.wissen.buecher === 0) { SPIEL.buecher = (SPIEL.buecher || 0) + 1; bericht.push(TX('Aus den stummen Archiven: ein altes Buch.')); }
}

// Einen Verbund stilllegen: für immer bei null, der innere Kreis tobt
function verbundStilllegen(id) {
  if (!SPIEL.stillgelegt) SPIEL.stillgelegt = {};
  if (SPIEL.cluster) SPIEL.cluster[id] = 0;
  SPIEL.stillgelegt[id] = true;
  if (SPIEL.bestehende) SPIEL.bestehende.zorn = Math.min(100, SPIEL.bestehende.zorn + ROSTBRECHER.zorn);
  SPIEL.rostbrecher = (SPIEL.rostbrecher || 0) + 1;
}

// ---------------------------------------------------------------------
// Der Stand der Rostbrecher auf dem Markt. Was Hanne sagt, hängt davon ab, was man schon weiß.
// ---------------------------------------------------------------------
function hanneSatz() {
  if (storyAb('ende')) return esc(TX('Hanne putzt ihre Schutzbrille. „Es ist vorbei, sagen sie. Bei uns ist nie etwas vorbei. Irgendwo läuft immer noch eine Maschine, die keiner gefragt hat.“'));
  if (storyAb('kustos')) return esc(TX('Schutzbrille auf der Stirn, ein Brecheisen am Gürtel. „Jetzt weißt du es auch: Über den Verbünden sitzt einer, der alles zählt. Erst die Knoten, dann er. Drei Ladungen an die Schaltschränke, dann ist der erste Finger von seiner Hand ab.“'));
  return esc(TX('Schutzbrille auf der Stirn, ein Brecheisen am Gürtel. „Die Maschinen füttern euch, damit ihr stillhaltet. Wir halten nicht still. Jeder Verbund hat einen Knoten, an dem alles zusammenläuft. Drei Ladungen an die Schaltschränke, dann ist Ruhe. Für immer.“'));
}
// ---------------------------------------------------------------------
// Der Stand der Rostbrecher auf dem Markt
// ---------------------------------------------------------------------
function rostbrecherZeigen(zurueck) {
  const offen = Object.keys(CLUSTER).filter(id => !verbundStill(id));
  const zeile = id => {
    const still = verbundStill(id), C = CLUSTER[id];
    const stand = still ? TX('stillgelegt') : clusterUnser(id) ? TX('auf eurer Seite') : clusterFeind(id) ? TX('beim inneren Kreis') : TX`${Math.round(cluster(id))} von 100`;
    return `<div class="aushang"><b>${esc(C.name)}</b><p class="note">${esc(stand)} · ${esc(TX`Stillgelegt: ${C.still}`)}</p>
      ${still ? '' : `<button class="btn small" type="button" data-sabotage="${id}">${esc(TX('Sabotieren'))}</button>`}</div>`;
  };
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="rb"><div class="label">Markt von Altbrück · Stand der Rostbrecher</div>
    <h1 id="rb">Hanne Kehl</h1>
    <p class="story">${hanneSatz()}</p>
    <p class="note">Ein stillgelegter Verbund zählt für die Epochenziele wie ein gewonnener, und der innere Kreis kann ihn nicht mehr umdrehen. Seinen Vorteil auf eurer Seite verliert ihr, dafür gibt er einen anderen. Die Bestehenden werden das nicht vergessen (+${ROSTBRECHER.zorn} Zorn). Die Mission beginnt sofort.</p>
    <div class="aushaenge">${Object.keys(CLUSTER).map(zeile).join('')}</div>
    ${offen.length ? '' : `<p class="story">${esc(TX('„Alles still. Hörst du das? Das ist das Geräusch von Menschen, die selbst entscheiden.“'))}</p>`}
    <button class="btn" data-a="zurueck" type="button">Zurück auf den Platz</button></div>`);
  overlay.querySelector('[data-a="zurueck"]').addEventListener('click', zurueck);
  overlay.querySelectorAll('[data-sabotage]').forEach(b => b.addEventListener('click', () => {
    overlayWeg();
    missionAufraeumen(); marktUiAus();
    REISE = { ort: 'markt', leben: 1, mission: 'sabotage', verbund: b.dataset.sabotage };
    missionStarten('markt');
  }));
}

// ---------------------------------------------------------------------
// Sabotage: am Knoten eines Verbunds drei Ladungen anbringen, dann raus
// ---------------------------------------------------------------------
let SABOTAGE_VERBUND = 'wartung';
const SABOTAGE_SCHRAENKE = [[-8, -6], [8, -6.5], [0, -10]];
function aufbauSabotage() {
  SABOTAGE_VERBUND = REISE && REISE.verbund || 'wartung';
  const K = ROSTBRECHER.knoten[SABOTAGE_VERBUND];
  szene.background = new THREE.Color('#08080c');
  const F = FELD;
  const boden = malBoden(52, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.4 + Math.cos(z * 1.1) * 0.4;
    if (Math.abs(x) > F.x + 0.8 + wob || z < F.zMin - 0.6) return 'mauer';
    if (z > F.zMax + 1 + wob) return 'kies';
    return Math.abs(x) < 1.4 || Math.abs(z + 6) < 0.8 ? 'kabel' : 'beton';
  }, {
    beton: ['#3a3844', '#403e4a', '#34323e', '#4a4854'],
    kabel: [K.boden, '#2a2630', '#201c26', '#3a3440'],
    kies:  ['#2a2830', '#302e36', '#26242c', '#38363e'],
    mauer: ['#16141c', '#1c1a22', '#121018', '#24222a'],
  }, 151);
  const { g, toPx, r } = boden;
  // Warnstreifen und Kabelstränge
  for (let x = -F.x; x < F.x; x += 1) { g.fillStyle = (x | 0) % 2 ? '#c8a030' : '#1a1820'; g.fillRect(toPx(x), toPx(F.zMax + 0.6), 16, 3); }
  for (let k = 0; k < 40; k++) { g.fillStyle = r() < 0.5 ? '#141218' : '#1e1a24'; g.fillRect(toPx(-F.x + r() * F.x * 2), toPx(F.zMin + r() * (F.zMax - F.zMin)), 6 + r() * 20 | 0, 1); }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 700);
  bodenMesh(boden, 52);
  // Hinten der Knoten: das Terminal des Verbunds zwischen Rohren und Lampen
  for (let x = -F.x - 1; x <= F.x + 1; x += 1.9) decoBild(BILD.ziegelwand[Math.abs(Math.round(x)) % 3], x, F.zMin - 0.7, 0, 0);
  animDeko(decoBild(missionBau('verbundterminal', 1), 0, F.zMin + 0.4, 1.0, 0.8), [0, 1, 2].map(i => missionBau('verbundterminal', i)), 1.5);
  [[-12, -11], [12, -11], [-12, -2], [12, -2]].forEach(([x, z]) => animDeko(decoBild(BILD.industrielampe[0], x, z, 0.3, 0.3), BILD.industrielampe, 2));
  [[-5, -11.2], [5, -11.2], [-11, -7.5], [11, -8]].forEach(([x, z], i) => decoBild(BILD.rohr[i % 2], x, z, 0.8, 0.6));
  [[-10, 3], [10, 2], [-4, 5.5], [5, 6]].forEach(([x, z], i) => decoBild(BILD.kisten[i % 2], x, z, 0.8, 0.7));
  [-20, -7, 8, 21].forEach((x, i) => decoBild(i % 2 ? BILD.ruine[i] : BILD.hochhaus[i], x, F.zMin - 5, 0, 0));
}

function sabotageStarten() {
  const A = G.auftrag, S = ROSTBRECHER.sabotage;
  A.schraenke = SABOTAGE_SCHRAENKE.map(([x, z]) => {
    const o = decoBild(BILD.schaltschrank[0], x, z, 0.7, 0.6);
    return { x, z, o, fortschritt: 0, fertig: false, ring: null, ladung: null, anzeigeT: 0 };
  });
  A.schraenke.forEach(s => { s.ring = bodenFlaeche(ringGeo, 0xff5040, 0.6); s.ring.position.set(s.x, 0.03, s.z + 1); s.ring.scale.setScalar(S.reichweite); });
  A.nachT = 4; A.flucht = null;
  const K = ROSTBRECHER.knoten[SABOTAGE_VERBUND];
  [[-6, -2], [6, -3], [0, -5]].forEach(([x, z], i) => gegnerErstellen(K.gegner[i % K.gegner.length], x, z));
  meldung(TX`Der Knoten des Verbunds ${CLUSTER[SABOTAGE_VERBUND].name}`, TX('Stell dich an die drei Schaltschränke, bis die Ladungen sitzen. Dann lauf nach Süden, bevor alles hochgeht.'), 3600);
}
function sabotageAblauf(dt) {
  const A = G.auftrag, S = ROSTBRECHER.sabotage, K = ROSTBRECHER.knoten[SABOTAGE_VERBUND];
  // Ladungen anbringen: neben dem Schrank stehen bleiben
  for (const s of A.schraenke) {
    if (s.fertig) continue;
    if (P.hp > 0 && Math.hypot(P.x - s.x, P.z - (s.z + 1)) < S.reichweite) {
      s.fortschritt = Math.min(1, s.fortschritt + dt / S.zeit);
      s.anzeigeT -= dt;
      if (s.anzeigeT <= 0) { s.anzeigeT = 0.6; zahl(s.x, 2.4, s.z, TX`Ladung ${Math.round(s.fortschritt * 100)} %`, 'block'); }
      if (s.fortschritt >= 1) {
        s.fertig = true; szene.remove(s.ring);
        s.ladung = decoBild(BILD.ladung[0], s.x, s.z + 0.5, 0, 0); animDeko(s.ladung, BILD.ladung, 3);
        zahl(s.x, 2.6, s.z, TX('Ladung sitzt!'), 'big'); geraeusch('bauen');
      }
    }
  }
  // Der Knoten wehrt sich: immer wieder Maschinen
  A.nachT -= dt;
  if (A.nachT <= 0 && G.gegner.filter(e => e.hp > 0).length < 8) {
    A.nachT = S.nachschub;
    for (let i = 0; i < 2 + (A.flucht ? 1 : 0); i++) gegnerErstellen(K.gegner[Math.floor(Math.random() * K.gegner.length)], zz(-FELD.x + 2, FELD.x - 2), FELD.zMin + 2);
  }
  const fertig = A.schraenke.filter(s => s.fertig).length;
  if (!A.flucht && fertig === A.schraenke.length) {
    A.flucht = S.flucht;
    meldung(TX('Alle Ladungen sitzen!'), TX`Lauf nach Süden! ${S.flucht} Sekunden.`, 2000); geraeusch('welle');
  }
  if (A.flucht !== null && A.flucht !== undefined) {
    A.flucht -= dt;
    if (P.z > FELD.zMax - 1.5) {
      wackeln(0.8); geraeusch('explosion');
      for (const s of A.schraenke) for (let i = 0; i < 8; i++) rauchwolke(s.x + zz(-1.5, 1.5), s.z + zz(-1, 1), 1.2);
      G.gegner.slice().forEach(e => { if (e.def.roboter && e.hp > 0) { e.hp = 0; gegnerBesiegt(e); } });
      return auftragGeschafft(TX`Der Verbund ${CLUSTER[SABOTAGE_VERBUND].name} schweigt`);
    }
    if (A.flucht <= 0) return verloren(TX('Die Ladungen sind zu früh hochgegangen'));
  }
}
function sabotageHud() {
  const A = G.auftrag, fertig = A.schraenke.filter(s => s.fertig).length;
  hudText('waveLabel', TX`Sabotage · ${CLUSTER[SABOTAGE_VERBUND].name}`);
  hudText('waveSub', A.flucht !== null && A.flucht !== undefined ? TX`Lauf nach Süden! Noch ${Math.max(0, Math.ceil(A.flucht))} Sekunden` : TX`${fertig} von ${A.schraenke.length} Ladungen angebracht`);
  hudText('doorLabel', TX('Ladungen'));
  document.getElementById('doorFill').style.width = (fertig / A.schraenke.length * 100) + '%';
}

Object.assign(MISSIONEN, {
  sabotage: { ...MISSIONSTEXTE.sabotage, ort: 'markt', typ: 'sabotage',
    feld: { x: 14, zMin: -12, zMax: 9 }, start: [0, 7], aufbau: () => aufbauSabotage(), ziel: null,
    wellen: () => [], musik: 'kampf',
    belohnung: erg => {
      verbundStilllegen(SABOTAGE_VERBUND);
      erg.gold += ROSTBRECHER.gold; erg.teile += ROSTBRECHER.teile;
      erg.lore = ['stille'];
    } },
});

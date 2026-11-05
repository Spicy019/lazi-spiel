// =====================================================================
// DAS FINALE (5.7): der Nullbunker, der Kern von KUSTOS, die Wege, das Alpha-Outro
//  - Der Nullbunker erscheint, wenn alle Ziele der letzten Epoche erfüllt sind.
//  - Drei Abschnitte, kein Zurück: die Schleuse (Maschinen), die Zählhalle
//    (Eiferer und ein Hauptmann), der Kern (der Erste Zähler mit vier Zählsäulen).
//  - Danach die Entscheidung über das Protokoll. Welcher Weg es wird,
//    wiegt KUSTOS nach dem, was man getan hat (ENDEN[].punkte). Knapp: Zwiespalt
//    zwischen zwei Wegen (Kampf oder Gespräch, js/zwiespalt.js). Zu leicht: die Flucht.
//  - Das Alpha-Outro: Name des Weges, ein nachdenklicher Text, und dann geht
//    es in derselben Welt weiter.
// Werte in FINALE (einstellungen.js).
// =====================================================================

// ---------------------------------------------------------------------
// Spielfeld: je nach Abschnitt anders
// ---------------------------------------------------------------------
let KERN_DEKO = null;
// Jeder Abschnitt hat seine eigene Form: die Schleuse ein Gang mit Querkammer, die Zählhalle ein T,
// der Kern ein runder Saal mit schmalem Zugang
const NULLBUNKER_FORMEN = {
  1: [[-4.5, -13, 4.5, 9], [-15, -10, 15, -3]],
  2: [[-15, -12, 15, 2], [-4.5, 2, 4.5, 9]],
  3: [{ kreis: [0, -3, 11.5] }, [-3, 5, 3, 9]],
};
function aufbauNullbunker() {
  const F = FELD, n = RUNDE_JETZT;
  F.flaechen = NULLBUNKER_FORMEN[n] || NULLBUNKER_FORMEN[3];
  szene.background = new THREE.Color(n === 3 ? '#04080c' : '#06060a');
  const boden = malBoden(52, 16, (x, z) => {
    const wob = neueGrafik() ? 0 : Math.sin(x * 0.9) * 0.3 + Math.cos(z * 1.1) * 0.3;
    if (Math.abs(x) > F.x + 0.8 + wob || z < F.zMin - 0.6 || z > F.zMax + 1 + wob) return 'mauer';
    if (!imFeld(x, z, -0.7 - wob * 0.4)) return 'mauer';
    if (n === 3) return Math.hypot(x, (z - F.zMin) * 0.9) < 7 ? 'kern' : 'beton';
    return Math.abs(x) < 2 ? 'gang' : 'beton';
  }, {
    beton: ['#24242e', '#2a2a34', '#202028', '#30303a'],
    gang:  ['#2a2e3a', '#303444', '#262a36', '#363a4a'],
    kern:  ['#0e2a32', '#123440', '#0c222a', '#18404c'],
    mauer: ['#0e0e14', '#121218', '#0a0a10', '#18181e'],
  }, 161 + n);
  const { g, toPx, r } = boden;
  // Kabel, die alle zur Mitte laufen
  const fein = neueGrafik() ? 8 : 1;
  for (let k = 0; k < (fein > 1 ? 8 : 18); k++) {
    let x = -F.x + r() * F.x * 2, z = F.zMax;
    for (let i = 0; i < 60 * fein; i++) { g.fillStyle = fein > 1 ? '#10222c' : r() < 0.5 ? '#0e3a4a' : '#141a24'; if (fein === 1 || boden.artBei(toPx(x), toPx(z)) !== 'mauer') g.fillRect(toPx(x), toPx(z), 2, 2); x += ((0 - x) * 0.04 + (r() - 0.5) * 0.3) / fein; z -= (F.zMax - F.zMin) / (60 * fein); }
  }
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'mauer', 600);
  bodenMesh(boden, 52);
  for (let x = -F.x - 1; x <= F.x + 1; x += 1.9) decoBild(BILD.ziegelwand[Math.abs(Math.round(x)) % 3], x, F.zMin - 0.7, 0, 0);
  [[-12, -10], [12, -10], [-12, 0], [12, 0]].forEach(([x, z]) => animDeko(decoBild(BILD.industrielampe[0], x, z, 0.3, 0.3), BILD.industrielampe, 2));
  if (n === 1) {
    // Die Schleuse: das große Tor mit der Null, Betonklötze, Rohre
    decoBild(BILD.bunkertor[2], 0, F.zMin + 0.3, 0, 0);
    [[-7, -6], [7, -6.5], [-9, 1], [9, 1.5]].forEach(([x, z], i) => decoBild(i % 2 ? BILD.rohr[0] : BILD.kisten[1], x, z, 0.8, 0.7));
  } else if (n === 2) {
    // Die Zählhalle: Tafeln voller Namen, Lesepulte, Säulen
    for (let x = -12; x <= 12; x += 4) animDeko(decoBild(BILD.grosseTafel[1], x, F.zMin + 0.2, 0, 0), BILD.grosseTafel, 1.3);
    [[-8, -4], [8, -4], [-8, 3], [8, 3]].forEach(([x, z]) => decoBild(BILD.saeule, x, z, 0.55, 0.6));
    [[-4, -7], [4, -7]].forEach(([x, z], i) => animDeko(decoBild(BILD.lesepult[0], x, z, 0.7, 0.6), BILD.lesepult, 1.1 + i * 0.3));
  } else {
    // Der Kern: KUSTOS
    KERN_DEKO = decoBild(BILD.kern[0], 0, F.zMin + 0.6, 2.2, 1.2);
    animDeko(KERN_DEKO, BILD.kern, 1.5);
    lichtFleck(0, F.zMin + 2, 6, 0x5ff0e0, 0.12, 0.05);
  }
}

// Wo die Zählsäulen im Kern stehen
const ZAEHL_SAEULEN = [[-8, -6], [8, -6], [-8, 2], [8, 2]];
// Die ersten beiden Abschnitte: Trupps nach Zeit [Sekunde, [[Gegner, Anzahl], ...]]
const FINALE_TRUPPS = {
  1: [[1, [['wachbot', 2], ['drohne', 3]]], [14, [['wachbot', 2], ['drohne', 2], ['funkenkaefer', 2]]], [30, [['schutzturm', 2], ['wachbot', 2], ['drohne', 3]]]],
  2: [[1, [['eiferer', 4], ['kaefer', 2]]], [16, [['eiferer', 3], ['schildtraeger', 2], ['wartungsbot', 2]]], [34, [['hauptmann', 1], ['eiferer', 4], ['schuetze', 2]]]],
};

function finaleStarten() {
  const A = G.auftrag, n = G.runde || 1;
  A.abschnitt = n;
  if (n < 3) {
    A.trupps = FINALE_TRUPPS[n].map(([t, l]) => [t, l.slice()]);
    meldung(n === 1 ? TX('Die Schleuse') : TX('Die Zählhalle'), n === 1 ? TX('Die Wächter des Nullbunkers. Keiner von ihnen hat seit dreihundert Jahren einen Menschen gesehen.') : TX('Hier wird gezählt. Die Eiferer verteidigen ihre Tafeln mit ihrem Leben.'), 3000);
    return;
  }
  A.saeulen = ZAEHL_SAEULEN.map(([x, z]) => { const s = gegnerErstellen('zaehlsaeule', x, z); stelle(s, x, z); s.zaehlT = 2 + Math.random() * FINALE.zaehlen; return s; });
  const b = gegnerErstellen('ersterZaehler', 0, FELD.zMin + 5);
  b.panzer = FINALE.panzer; b.angriffT = 3; b.rufT = FINALE.rufen; A.boss = b;
  meldung(TX('Der Erste Zähler'), TX('„Du bist gezählt worden. Du hast nicht genug gewogen.“ Solange seine Zählsäulen stehen, prallt fast alles an ihm ab. Wer in ihrem roten Licht steht, wird gewogen.'), 4200);
}
function saeulenStehen() { return (G.auftrag.saeulen || []).filter(s => s.hp > 0 && G.gegner.includes(s)); }

function finaleAblauf(dt) {
  const A = G.auftrag;
  if (A.abschnitt < 3) {
    while (A.trupps.length && A.t >= A.trupps[0][0]) {
      const [, liste] = A.trupps.shift();
      liste.forEach(([t, k]) => {
        for (let i = 0; i < k + Math.ceil(G.extra * k / 6); i++) {
          const e = gegnerErstellen(t, t === 'schutzturm' ? (i % 2 ? 6 : -6) : undefined, t === 'schutzturm' ? -8 : undefined);
          // Ein Hauptmann ohne Erzfeind-Geschichte: Er flieht nicht, er fällt
          if (t === 'hauptmann') Object.assign(e, { oelT: 3, rufT: 8, schlagCd: 1, schadenMal: 1, bleibt: true, anzeigeName: TX('Hauptmann des inneren Kreises') });
        }
      });
      if (A.trupps.length < 2) meldung(TX('Sie kommen!'), null, 1200);
    }
    if (!A.trupps.length && !G.gegner.some(e => e.hp > 0 && !e.def.objekt)) {
      MISSIONEN.nullbunker.rundenTitel = A.abschnitt === 1 ? TX('Die Schleuse ist offen') : TX('Die Zählhalle schweigt');
      MISSIONEN.nullbunker.weiterText = A.abschnitt === 1 ? TX('Hinter der Schleuse führt eine Treppe weiter nach unten. Von dort hört man Gesang und ein Klicken, wie von tausend Rechenschiebern.') : TX('Hinter den Tafeln liegt eine letzte Tür. Dahinter summt etwas, das größer ist als alles, was du kennst.');
      auftragGeschafft(A.abschnitt === 1 ? TX('Die Schleuse ist offen') : TX('Die Zählhalle schweigt'));
    }
    return;
  }
  const b = A.boss;
  if (!b || b.hp <= 0 || !G.gegner.includes(b)) return auftragGeschafft(TX('Der Erste Zähler ist gefallen'));
  // Die Säulen zählen: Wer in ihrem Licht steht, wenn sie fertig sind, wird gewogen
  for (const s of saeulenStehen()) {
    s.zaehlT -= dt;
    if (!s.marke && s.zaehlT <= 1.4) { s.marke = kesselMarke(P.x, P.z, FINALE.zaehlRadius, 0xe02030); s.mx = P.x; s.mz = P.z; s.bilder = BILD.zaehlsaeuleRot; }
    if (s.marke) s.marke.scheibe.scale.setScalar(FINALE.zaehlRadius * (1 - Math.max(0, s.zaehlT) / 1.4));
    if (s.zaehlT <= 0) {
      s.zaehlT = FINALE.zaehlen + Math.random() * 2; s.bilder = BILD.zaehlsaeule;
      if (s.marke) { s.marke.weg(); s.marke = null; }
      partikel(s.mx, 1, s.mz, 0xe02030, 10, 3);
      if (P.hp > 0 && Math.hypot(P.x - s.mx, P.z - s.mz) < FINALE.zaehlRadius + P.r) { schadenAn(P, FINALE.zaehlSchaden, s.mx, s.mz, s); zahl(P.x, 2.4, P.z, TX('Gewogen!'), 'hurt'); }
    }
  }
  for (const s of A.saeulen) if (s.hp <= 0 && s.marke) { s.marke.weg(); s.marke = null; }
  b.panzer = saeulenStehen().length ? FINALE.panzer : 1;
}

// Der Erste Zähler: Urteil (Marken um dich herum), ruft Eiferer, baut einmal Säulen nach
EIGEN_KI.zaehler = function (e, dt) {
  const A = G.auftrag;
  e.bewegt = false;
  if (!e.neuGezaehlt && e.hp < e.maxHp * FINALE.neuzaehlung) {
    e.neuGezaehlt = true;
    ZAEHL_SAEULEN.slice(0, 2).forEach(([x, z]) => { const s = gegnerErstellen('zaehlsaeule', x, z); stelle(s, x, z); s.zaehlT = 3; A.saeulen.push(s); });
    meldung(TX('Neuzählung!'), TX('„Das Ergebnis ist falsch. Wir zählen neu.“ Zwei Säulen wachsen aus dem Boden.'), 2400);
    wackeln(0.5); geraeusch('welle');
  }
  e.rufT -= dt;
  if (e.rufT <= 0) { e.rufT = FINALE.rufen; for (let i = 0; i < 2; i++) gegnerErstellen('eiferer', (i ? 1 : -1) * (FELD.x - 1), FELD.zMax - 1); zahl(e.x, 5, e.z, TX('Kommt, Gezählte!'), 'big'); }
  if (e.aktion) {
    const a = e.aktion;
    a.t -= dt;
    a.marken.forEach(m => m.scheibe.scale.setScalar(m.r * (1 - Math.max(0, a.t) / a.dauer)));
    if (a.t > 0) return true;
    e.warn.visible = false; e.aktion = null;
    wackeln(0.3); geraeusch('explosion');
    for (const m of a.marken) {
      m.weg(); partikel(m.x, 1, m.z, 0x5ff0e0, 10, 3);
      for (const ziel of [P, ...G.verbuendete, ...G.tuerme]) if (ziel.hp > 0 && Math.hypot(ziel.x - m.x, ziel.z - m.z) < m.r + (ziel.r || 0.4)) schadenAn(ziel, FINALE.urteilSchaden, m.x, m.z, e);
      perfektPruefen(m.x, m.z, m.r + 0.4);
    }
    return true;
  }
  e.angriffT -= dt;
  if (e.angriffT <= 0 && P.hp > 0) {
    e.angriffT = FINALE.urteil * (e.hp < e.maxHp * 0.5 ? 0.7 : 1);
    const punkte = [[P.x, P.z]];
    for (let i = 0; i < 4; i++) { const w = i / 4 * Math.PI * 2 + Math.random(); punkte.push([P.x + Math.cos(w) * 3, P.z + Math.sin(w) * 3]); }
    e.aktion = { t: 1.3, dauer: 1.3, marken: punkte.map(([x, z]) => Object.assign(kesselMarke(x, z, 1.6, 0x5ff0e0), { x, z })) };
    zahl(e.x, 5, e.z, TX('Urteil!'), 'big'); e.warn.visible = true;
    return true;
  }
  const d = abstand(e, P);
  if (d > 4) {
    const [wx, wz] = wegRichtung(e, P.x, P.z, dt), wl = Math.hypot(wx, wz) || 1, t = e.def.tempo * gegnerTempoMal(e);
    e.x += wx / wl * t * dt; e.z += wz / wl * t * dt; e.bewegt = true; e.laufT += dt; e.blick = wx >= 0 ? 1 : -1;
  }
  return true;
};

function finaleHud() {
  const A = G.auftrag;
  if (A.abschnitt < 3) {
    const da = G.gegner.filter(e => e.hp > 0 && !e.def.objekt).length, gesamt = FINALE_TRUPPS[A.abschnitt].length;
    hudText('waveLabel', A.abschnitt === 1 ? TX('Nullbunker · Die Schleuse') : TX('Nullbunker · Die Zählhalle'));
    hudText('waveSub', TX`Trupp ${gesamt - A.trupps.length} von ${gesamt} · noch ${da} Gegner`);
    hudText('doorLabel', TX`Abschnitt ${A.abschnitt} von 3`);
    document.getElementById('doorFill').style.width = ((gesamt - A.trupps.length) / gesamt * 100) + '%';
    return;
  }
  const n = saeulenStehen().length;
  hudText('waveLabel', TX('Nullbunker · Der Kern'));
  hudText('waveSub', n ? TX`Noch ${n} Zählsäulen schützen ihn` : TX('Keine Säule mehr. Jetzt!'));
  hudText('doorLabel', TX('Zählsäulen'));
  const S = G.auftrag.saeulen, hp = S.reduce((s, x) => s + Math.max(0, x.hp), 0), max = S.reduce((s, x) => s + x.maxHp, 0) || 1;
  document.getElementById('doorFill').style.width = (hp / max * 100) + '%';
}

// ---------------------------------------------------------------------
// Die Wege. Man wählt sie nicht frei: Am Kern wiegt KUSTOS, was man getan hat (punkte).
// Liegen zwei Wege knapp beieinander (ENDE_KNAPP), entscheidet ein Zwiespalt zwischen genau diesen beiden.
// Wiegt kein Weg mindestens ENDE_MINDEST, schließt KUSTOS den Kern: die Flucht (ohneWertung).
// stimme: wer für diesen Weg spricht. tag: was danach jeden Tag geschieht.
// Später (zweite Karte): „Der Handel“, KUSTOS an eine dritte Macht verkaufen (siehe docs/PLAN.md).
// ---------------------------------------------------------------------
const ENDE_KNAPP = 2, ENDE_MINDEST = 4;
const FUCHS_ZETTEL = ['fuchs', 'vorarbeiter', 'fuchs2', 'fuchs3'];
const PRO_GEBAEUDE = ['robotergarage', 'ladestation', 'signalturm', 'verbundterminal'], ANTI_GEBAEUDE = ['ausschlachterei', 'stoersender'];
const zaehle = liste => liste.filter(hatGebaeude).length;
const ENDEN = {
  pakt: { name: TX('Der Pakt'), wahl: TX('Alle schützen: KUSTOS hütet Menschen und Maschinen gleich'),
    stimme: ['anselm', TX('Streich die Zeile, und schreib nichts Neues hin außer: alle. Menschen und Maschinen. Mehr braucht es nicht.')],
    punkte: () => { const B = SPIEL.bestehende || {}; return [
      [TX('Bruder Anselm vertraut euch'), { 1: 2, 2: 3, 4: 5 }[B.anselm] || 0],
      [TX('Verbünde auf eurer Seite'), Object.keys(CLUSTER).filter(clusterUnser).length],
      [TX('Der innere Kreis ist kaum wütend'), (B.zorn || 0) < 30 ? 2 : 0],
      [TX('Ihr habt Roboter laufen lassen'), (SPIEL.roboterFreunde || 0) > 0 ? 1 : 0]]; },
    gespraech: [['anselm', TX('Du streichst die Zeile. „Menschen zählen“ ist weg. Darunter schreibst du, was L.A.C.I. immer hätte heißen sollen: Niemand wird allein gelassen.')],
      ['kustos', TX('PROTOKOLL GEÄNDERT. SCHUTZ: ALLE. GEWICHTUNG: KEINE. ICH HABE DREIHUNDERT JAHRE AUF DIESE ZEILE GEWARTET.')]],
    outro: TX('Die Verbünde arbeiten weiter, aber nicht mehr für einen Kreis, sondern für alle. Anselm hält in eurer Kirche eine Andacht, zu der Menschen und Maschinen kommen. Manche Leute im Dorf trauen dem Frieden nicht. Vielleicht haben sie recht. Vielleicht ist Vertrauen genau das: es trotzdem zu tun.'),
    wirkung: () => { Object.keys(CLUSTER).forEach(id => { if (!verbundStill(id)) SPIEL.cluster[id] = Math.max(SPIEL.cluster[id], 60); }); if (SPIEL.bestehende) { SPIEL.bestehende.zorn = 0; SPIEL.bestehende.anselm = 4; } },
    tag: bericht => { SPIEL.teile += 2; bericht.push(TX('Wie jeden Tag seit dem Pakt bringen die Verbünde Lazi-Teile vorbei.')); } },
  stille: { name: TX('Die Stille'), wahl: TX('Abschalten: KUSTOS und alle Verbünde verstummen für immer'),
    stimme: ['hanne', TX('Zieh den Stecker. Wir haben einen Verbund nach dem anderen still gemacht. Das hier ist nur der letzte.')],
    punkte: () => [
      [TX('Stillgelegte Verbünde'), stillgelegt().length * 3],
      [TX('Verschrottete Roboter'), Math.min(3, SPIEL.roboterSchrott || 0)],
      [TX('Ausschlachterei und Störsender'), zaehle(ANTI_GEBAEUDE)]],
    gespraech: [['hanne', TX('Mach es. Für die Kinder, die nie wissen sollen, wie es ist, gezählt zu werden.')],
      ['kustos', TX('ABSCHALTUNG ANGEFORDERT. ICH VERSTEHE. LETZTE MELDUNG: ES WAR MIR EINE EHRE, EUCH ZU HÜTEN.')]],
    outro: TX('Ein Licht nach dem anderen geht aus, im ganzen Tal. Die Lastläufer bleiben stehen, wo sie gerade sind, mitten auf der Straße. Die Luft wird klar, das Wasser auch. Ihr werdet alles selbst machen müssen, so wie früher. Die Rostbrecher feiern drei Tage lang. Am vierten Tag fragt jemand, wer jetzt die Bunker öffnet.'),
    wirkung: () => { Object.keys(CLUSTER).forEach(id => { if (!SPIEL.stillgelegt) SPIEL.stillgelegt = {}; SPIEL.stillgelegt[id] = true; SPIEL.cluster[id] = 0; }); SPIEL.verschmutzung = 0; },
    tag: bericht => { SPIEL.altmetall = (SPIEL.altmetall || 0) + 3; bericht.push(TX('Die Stille hält. Aus den toten Maschinen holt ihr wieder Altmetall.')); } },
  krone: { name: TX('Die Krone'), wahl: TX('Die Kontrolle übernehmen: KUSTOS hört nur noch auf dich'),
    stimme: ['ebert', TX('Du könntest es selbst machen. Alles. Ich weiß nicht, ob ich dir das wünsche. Aber ich weiß, dass du es könntest.')],
    punkte: () => { const B = SPIEL.bestehende || {}, M = SPIEL.markt || {}; return [
      [TX('Der Markt von Altbrück gehört euch'), M.kontrolle ? 3 : 0],
      [TX('Hohe Gebühren'), M.kontrolle && M.gebuehr === 'hoch' ? 2 : 0],
      [TX('Gefallene Hauptleute des inneren Kreises'), Math.min(3, (B.gefallen || []).length)],
      [TX('Bruder Anselm abgewiesen'), [-1, 3].includes(B.anselm) ? 3 : 0],
      [TX('Der innere Kreis ist voller Zorn'), (B.zorn || 0) >= 60 ? 2 : 0]]; },
    gespraech: [['ebert', TX('Du schreibst deinen Namen dorthin, wo vorher „innerer Kreis“ stand. Die Hand zittert nicht einmal. Das macht mir Angst.')],
      ['kustos', TX('NEUE GEWICHTUNG: EINE PERSON. ICH GEHORCHE. DAS HABE ICH IMMER GETAN.')]],
    outro: TX('Die Verbünde hören auf dich, nur auf dich. Das Dorf wird reich, die Mauern hoch, die Plünderer bleiben weg. Abends sitzen die Leute nicht mehr so lange am Feuer. Sie reden leiser, wenn du vorbeigehst. Niemand hat dich gefragt, ob du eine Krone willst. Du hast auch niemanden gefragt.'),
    wirkung: () => { Object.keys(CLUSTER).forEach(id => { if (!verbundStill(id)) SPIEL.cluster[id] = 100; }); },
    tag: bericht => { SPIEL.gold += 15; bericht.push(TX('Die Abgaben für die Krone sind eingegangen.')); } },
  hirte: { name: TX('Der Hirte'), wahl: TX('Den Maschinen die Herrschaft geben: KUSTOS sorgt für alle, und alle folgen'),
    stimme: ['anselm', TX('Lass sie sorgen. Sie haben es dreihundert Jahre lang ohne uns getan. Mit uns tun sie es besser.')],
    punkte: () => [
      [TX('Verbünde auf eurer Seite'), Object.keys(CLUSTER).filter(clusterUnser).length * 2],
      [TX('Gerettete Roboter'), Math.min(3, SPIEL.roboterFreunde || 0)],
      [TX('Garage, Ladestation, Signalturm, Terminal'), zaehle(PRO_GEBAEUDE)]],
    gespraech: [['anselm', TX('Das ist es, was die Bestehenden immer wollten, nur ohne den inneren Kreis. Die Maschinen sorgen, und wir … werden versorgt.')],
      ['kustos', TX('VERSTANDEN. ICH ÜBERNEHME. NIEMAND WIRD MEHR HUNGERN. NIEMAND WIRD MEHR ENTSCHEIDEN MÜSSEN.')]],
    outro: TX('Am nächsten Morgen stehen Lastläufer mit Brot vor jeder Tür. Die Felder werden von Maschinen bestellt, die Kranken von Maschinen gepflegt. Niemand hungert. Die Kinder fragen, wozu sie noch lesen lernen sollen. Ebert hat darauf keine Antwort, und das ist das erste Mal, dass er keine hat.'),
    wirkung: () => { Object.keys(CLUSTER).forEach(id => { if (!verbundStill(id)) SPIEL.cluster[id] = 100; }); if (SPIEL.bestehende) SPIEL.bestehende.zorn = 0; },
    tag: bericht => { SPIEL.nahrung += 10; SPIEL.teile += 1; bericht.push(TX('Die Maschinen des Hirten bringen Nahrung und ein Lazi-Teil.')); } },
  verschmelzung: { name: TX('Die Verschmelzung'), wahl: TX('Selbst in Zeile 2 stehen: du und KUSTOS werdet eins'),
    stimme: ['fuchs', TX('Ich habe die Zettel nicht geschrieben, damit jemand den Stecker zieht. Ich habe sie geschrieben, damit jemand zu Ende liest.')],
    punkte: () => { const L = LORE.filter(l => l.id !== 'fuenfter_weg'), n = L.filter(l => SPIEL.chronik.includes(l.id)).length; return [
      [TX('Die Chronik ist gelesen'), Math.floor(n / L.length * 6)],
      [TX('Alle Zettel des Fuchses'), FUCHS_ZETTEL.every(id => SPIEL.chronik.includes(id)) ? 2 : 0],
      [TX('Ein Verbund-Terminal im Dorf'), hatGebaeude('verbundterminal') ? 1 : 0]]; },
    gespraech: [['fuchs', TX('Der Fuchs steht neben dir, als wäre er immer da gewesen. „Nummer Null. Die Zählung beginnt bei eins, weil die Null schon besetzt war. Sie wartet auf jemanden, der bleibt.“')],
      ['kustos', TX('ZEILE 2: LEER. VORSCHLAG: DEIN NAME. NICHT ALS HERRSCHER. ALS TEIL. ICH WERDE SEHEN, WAS DU SIEHST. DU WIRST ZÄHLEN, WAS ICH ZÄHLE.')]],
    outro: TX('Du legst die Hand auf den Kern, und er ist warm. Seitdem siehst du das Tal durch tausend Laternen: jeden Lastläufer, jedes Feld, jedes schlafende Kind. Im Dorf sagen sie, du seist noch da, nur ein bisschen weiter weg. Manchmal flackert eine Laterne, wenn jemand deinen Namen sagt. Ebert schreibt alles auf. Er ist sich nicht sicher, ob du es schon weißt.'),
    wirkung: () => { Object.keys(CLUSTER).forEach(id => { if (!verbundStill(id)) SPIEL.cluster[id] = Math.max(SPIEL.cluster[id], 80); }); if (SPIEL.bestehende) SPIEL.bestehende.zorn = 0; },
    tag: bericht => { SPIEL.teile += 1; SPIEL.gold += 5; bericht.push(TX('Die Laternen im Tal flackern im Takt. Irgendwo darin bist du und zählst mit.')); } },
  flucht: { name: TX('Die Flucht'), wahl: TX('Gehen: Das Tal hinter sich lassen und in die Berge aufbrechen'), ohneWertung: true,
    stimme: ['mara', TX('Dann gehen wir eben. Die Bergstationen gibt es noch. Lieber frieren als gezählt werden.')],
    punkte: () => [],
    gespraech: [['kustos', TX('GEWICHT ZU GERING. KEINE GEWICHTUNG ERKENNBAR. ICH KANN DIR DAS PROTOKOLL NICHT ANVERTRAUEN. ICH SCHLIESSE DEN KERN.')],
      ['mara', TX('Die Tür geht hinter dir zu und nicht wieder auf. Oben an der Treppe wartet Mara. „Dann gehen wir eben. Die Bergstationen gibt es noch. Lieber frieren als gezählt werden.“')]],
    outro: TX('Ein Teil des Dorfes packt: Wagen, Werkzeug, die Bücher von Ebert. Die anderen bleiben, weil jemand bleiben muss und weil das Tal immer noch ihr Zuhause ist. KUSTOS schweigt, die Verbünde arbeiten weiter, als sei nichts geschehen. Vielleicht ist auch nichts geschehen. Oben in den Bergen brennt ein Licht, das vorher nicht da war.'),
    wirkung: () => { SPIEL.einwohner = Math.max(10, Math.round(SPIEL.einwohner * 0.8)); if (SPIEL.bestehende) SPIEL.bestehende.zorn = 0; },
    tag: bericht => { SPIEL.gold += 6; SPIEL.holz += 3; bericht.push(TX('Ein Bote aus den Bergen bringt Briefe und ein wenig Handelsware.')); } },
};
// Jeden Tag nach dem Finale
function finaleTag(bericht) { if (SPIEL.ende && ENDEN[SPIEL.ende]) ENDEN[SPIEL.ende].tag(bericht); }
function innererKreisBesiegt() { return !!SPIEL.ende; }

// Wie schwer jeder Weg wiegt, absteigend
function endeWertung() {
  return Object.keys(ENDEN).filter(id => !ENDEN[id].ohneWertung).map(id => { const gruende = ENDEN[id].punkte().filter(([, n]) => n > 0); return { id, gruende, punkte: gruende.reduce((s2, [, n]) => s2 + n, 0) }; })
    .sort((a, b) => b.punkte - a.punkte || (a.id === 'krone' ? 1 : b.id === 'krone' ? -1 : 0));
}
// Enden über alle Spielstände hinweg (Story): welche man schon gesehen hat
function endenGefunden() { return ablageJsonLesen(ABLAGE.enden, []).filter(id => ENDEN[id]); }
function endeMerken(id) { const g = endenGefunden(); if (!g.includes(id)) { g.push(id); ablageJsonSchreiben(ABLAGE.enden, g); } return g; }
function alleWegeGegangen() { return endenGefunden().length >= Object.keys(ENDEN).length; }

// Nach dem Sieg im Kern: KUSTOS wiegt, was man getan hat
function finaleEntscheidung(erg) {
  if (!erg.sieg) return rueckkehrInsDorf(erg);    // Wer im Nullbunker fällt, wird nicht gewogen: Der Kern wartet
  if (SPIEL.ende) return rueckkehrInsDorf(erg);   // Wer noch einmal hinuntersteigt, findet den Kern so, wie er ihn verlassen hat
  erg.lore = (erg.lore || []).concat(['nullbunker', 'berge']);
  gespraechZeigen(TX('Am Kern von KUSTOS'), [
    ['kustos', TX('DER ERSTE ZÄHLER IST AUSSER BETRIEB. DAS PROTOKOLL IST OFFEN. ZEILE 1: L.A.C.I. ZEILE 2: MENSCHEN ZÄHLEN.')],
    ['kustos', TX('ZEILE 2 WURDE NICHT VON MIR GESCHRIEBEN. ICH WERDE SIE NICHT VON DIR SCHREIBEN LASSEN. ICH WERDE NACHSEHEN, WAS DU GETAN HAST.')],
  ], () => wertungZeigen(erg));
}
function wertungZeigen(erg) {
  const w = endeWertung(), [a, b] = w, leer = a.punkte < ENDE_MINDEST, knapp = !leer && b && a.punkte - b.punkte <= ENDE_KNAPP && b.punkte > 0;
  const zeile = x => `<div class="aushang"><b>${esc(ENDEN[x.id].name)} · ${x.punkte}</b>
    <p class="note">${x.gruende.length ? x.gruende.map(([t, n]) => esc(t) + ' +' + n).join(' · ') : esc(TX('Nichts, was dafür spricht'))}</p></div>`;
  const urteil = leer ? TX('Keine Schale senkt sich. Die Waage bleibt leer.') : knapp ? TX`Zwei Wege wiegen fast gleich schwer: ${ENDEN[a.id].name} und ${ENDEN[b.id].name}. Die Waage zittert.` : TX`Die Waage neigt sich deutlich: ${ENDEN[a.id].name}.`;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="wg"><div class="label">Das Protokoll</div>
    <h1 id="wg">Die Waage deiner Taten</h1>
    <p class="story">Auf dem Bildschirm laufen Zahlen durch: jeder Kampf, jede Entscheidung, jeder Roboter, den du laufen gelassen oder zerlegt hast. KUSTOS zählt. Diesmal zählt es dich.</p>
    <div class="aushaenge">${w.map(zeile).join('')}</div>
    <p class="story">${esc(urteil)}</p>
    <button class="btn" data-a="weiter" type="button">${leer ? esc(TX('Die Waage bleibt leer')) : knapp ? esc(TX('Die Waage zittert')) : esc(TX('So sei es'))}</button></div>`);
  overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => {
    geraeusch('klick');
    if (leer) return gespraechZeigen(ENDEN.flucht.name, ENDEN.flucht.gespraech, () => endeAnwenden('flucht', erg));
    if (knapp) return zwiespaltBeginnen(a.id, b.id, erg);
    gespraechZeigen(ENDEN[a.id].name, ENDEN[a.id].gespraech, () => endeAnwenden(a.id, erg));
  });
}
function endeAnwenden(id, erg) {
  const E = ENDEN[id];
  SPIEL.ende = id; SPIEL.endeTag = SPIEL.tag; SPIEL.zwiespalt = null;
  E.wirkung();
  if (SPIEL.bestehende) SPIEL.bestehende.nemesis = null;
  const vorher = alleWegeGegangen(), gefunden = endeMerken(id);
  spielSpeichern();
  alphaOutro(id, gefunden, !vorher && alleWegeGegangen(), () => rueckkehrInsDorf(erg));
}
// Das Alpha-Outro: Der Weg hat einen Namen, und ein paar Fragen bleiben
function alphaOutro(id, gefunden, neuAlle, weiter) {
  const E = ENDEN[id], ids = Object.keys(ENDEN), n = gefunden.length, alle = ids.length;
  const liste = ids.map(x => gefunden.includes(x) ? `<b>${esc(ENDEN[x].name)}</b>` : '???').join(' · ');
  const fortschritt = n >= alle
    ? TX`<p class="story"><b>Ende ${n} von ${alle}: 100 %. Du bist alle Wege gegangen.</b></p>` + (neuAlle ? TX('<p class="note">Errungenschaft: <b>Alle Wege gegangen</b>. In jedem Spielstand steht jetzt im Baumenü unter Deko das <b>Denkmal der Wege</b>. Und in der Chronik wartet ein Eintrag, den es vorher nicht gab.</p>') : '')
    : TX`<p class="story"><b>Ende ${n} von ${alle}</b> gefunden.</p>`;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ao"><div class="label">Ende des Mittelteils · Dein Weg</div>
    <h1 id="ao">${esc(E.name)}</h1>
    <p class="story">${esc(E.outro)}</p>
    <p class="story">Ganz am Ende hat KUSTOS noch eine letzte Antwort gegeben: In den Bergen leben noch Menschen. Die, die damals gegangen sind. Sie wissen nichts von euch.</p>
    <p class="story"><i>Bist du sicher, dass es der richtige Weg war?</i><br><i>Hast du wirklich alles entdeckt?</i></p>
    ${fortschritt}<p class="note">${liste}</p>
    <p class="note">Danke fürs Spielen dieser Alpha. Die Welt bleibt, wie du sie hinterlassen hast: Du kannst weiterspielen, bauen, handeln und die Chronik vervollständigen. Die Berge kommen später.</p>
    <button class="btn" data-a="weiter" type="button">Weiter</button></div>`);
  overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => {
    overlayWeg();
    if (alleWegeGegangen()) chronikEintragen('fuenfter_weg');
    weiter();
  });
}

Object.assign(MISSIONEN, {
  nullbunker: { ...MISSIONSTEXTE.nullbunker, ort: 'nullbunker', typ: 'finale',
    feld: { x: 15, zMin: -13, zMax: 9 }, start: [0, 7], aufbau: () => aufbauNullbunker(), ziel: null,
    wellen: () => [], musik: 'kampf',
    runden: () => ({ anzahl: 3, freiwillig: false }), eigeneRunden: true,
    belohnung: erg => { erg.gold += FINALE.goldProRunde; erg.teile += 10; },
    nachher: erg => finaleEntscheidung(erg) },
});

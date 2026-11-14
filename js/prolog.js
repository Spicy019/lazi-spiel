// =====================================================================
// PROLOG: Die Vorgeschichte in fünf kurzen Szenen (Pixelart im Stil des Spiels, Kamerafahrten,
// bewegte Figuren, Untertitel) und danach die Übung auf den Feldern vor dem Lager.
// Ein neues Spiel im Modus Geschichte sieht den Prolog genau einmal (SPIEL.prolog: 'film', dann 'uebung').
// Alte Spielstände haben das Feld nicht und sehen ihn nie. Im Menü lässt er sich noch einmal ansehen.
// Überspringen: der erste Knopf, Esc oder (nur eine Szene) Tippen bzw. Klicken ins Bild.
// =====================================================================

const PROLOG = { dauer: 8, blende: 0.4 };
const Prolog = { an: false, i: 0, t: 0, szene: null, D: null, fertig: null, wechsel: null };
// Die vier, wie auf dem Titelbild: Klasse und Waffe der klassischen Bilder
const PROLOG_VIER = [['ritter', 'schwert'], ['beschwoerer', 'stab'], ['architekt', 'hammer'], ['schatten', 'dolche']];

const PROLOG_SZENEN = [
  { titel: TX('Vor dreihundert Jahren'), text: TX('Die Alten haben ihre Städte verlassen. Niemand weiß, warum. Die Türme stehen noch, grün vor Moos.'), bau: () => prologStadt(false) },
  { titel: TX('Die Maschinen'), text: TX('Ihre Maschinen arbeiten weiter, als käme gleich jemand zurück. Jede Nacht funken sie dieselbe Meldung:'), funk: TX('STATUS: BETRIEB NORMAL. MENSCHEN ERFASST: 0.'), bau: () => prologStadt(true) },
  { titel: TX('Heute'), text: TX('Vier Menschen, ein Lagerfeuer und ein paar Kisten voller seltsamer Fundstücke. Auf fast allen steht dieselbe Aufschrift: L.A.C.I. Niemand weiß, was sie bedeutet. Die Leute nennen das Zeug einfach Lazi.'), bau: () => prologFeuer() },
  { titel: TX('Die Felder'), text: TX('Euer Lager zwischen den Feldern. Hier ist es sicher. Noch.') + ' ' + TX('Im dunklen Wald jagen Wölfe, am Fluss lauern Plünderer.'), bau: () => prologFelder(false) },
  { titel: TX('Was jetzt?'), text: TX('Aus dem Lager soll ein Dorf werden. In den Ruinen liegt, was ihr dafür braucht. Und irgendwo steht, was L.A.C.I. bedeutet.'), funk: TX('Zuerst: eine Übung auf den Feldern.'), bau: () => prologFelder(true) },
];

// ---------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------
function prologZeigen(fertig) {
  Prolog.an = true; Prolog.fertig = fertig; Prolog.wechsel = null;
  modus = 'prolog';
  alleOberflaechenAus();
  for (const k in tasten) tasten[k] = false;
  overlayZeigen(`<div class="prolog" role="dialog" aria-label="${esc(TX('Prolog'))}">
    <div class="prolog-blende"></div>
    <button class="btn small ghost prolog-weg" data-a="prologWeg" type="button">${esc(TX('Überspringen'))}</button>
    <div class="prolog-text panel" aria-live="polite">
      <div class="label"></div><p class="story"></p><p class="prolog-funk" hidden></p>
      <div class="prolog-fuss"><span class="prolog-punkte">${PROLOG_SZENEN.map(() => '<i></i>').join('')}</span><small>${esc(istTouch ? TX('Tippen: nächste Szene') : TX('Klick: nächste Szene · Esc: überspringen'))}</small></div>
    </div>
  </div>`);
  overlay.classList.add('prolog-an');
  overlay.querySelector('[data-a="prologWeg"]').addEventListener('click', e => { e.stopPropagation(); prologEnde(); });
  overlay.querySelector('.prolog').addEventListener('click', e => { if (!e.target.closest('button')) prologWeiter(); });
  liedSpielen('dorf');
  mitLadebild(() => { if (Prolog.an) prologSzeneBauen(0); });
}
function prologWeiter() {
  if (!Prolog.an || Prolog.wechsel) return;
  if (Prolog.i >= PROLOG_SZENEN.length - 1) { prologEnde(); return; }
  Prolog.wechsel = { t: 0, ziel: Prolog.i + 1, gebaut: false };
  const b = overlay.querySelector('.prolog-blende'); if (b) b.classList.add('zu');
}
function prologEnde() {
  if (!Prolog.an) return;
  Prolog.an = false;
  const alt = Prolog.szene, f = Prolog.fertig;
  Prolog.szene = null; Prolog.D = null; Prolog.fertig = null; Prolog.wechsel = null;
  overlay.classList.remove('prolog-an');
  overlayWeg();
  if (f) f();
  szeneEntsorgen(alt);
}
addEventListener('keydown', e => { if (Prolog.an && e.code === 'Escape') { e.preventDefault(); prologEnde(); } });

function prologSzeneBauen(i) {
  const alt = Prolog.szene;
  szene = Prolog.szene = new THREE.Scene();
  szene.background = new THREE.Color('#0c100e');
  szeneEntsorgen(alt);
  Prolog.i = i; Prolog.t = 0;
  Prolog.D = PROLOG_SZENEN[i].bau();
  if (neueGrafik()) randHintergrund('dorf');
  const S = PROLOG_SZENEN[i], el = overlay.querySelector('.prolog-text');
  if (!el) return;
  el.querySelector('.label').textContent = TX`${i + 1} von ${PROLOG_SZENEN.length} · ${S.titel}`;
  el.querySelector('.story').textContent = S.text;
  const funk = el.querySelector('.prolog-funk'); funk.textContent = S.funk || ''; funk.hidden = !S.funk;
  el.querySelectorAll('.prolog-punkte i').forEach((p, k) => p.classList.toggle('an', k <= i));
  el.classList.remove('neu'); void el.offsetWidth; el.classList.add('neu');
  prologKamera();
}
// Auf dem Handy (hochkant) etwas weiter weg, und das Bild rückt über die Untertitel
const prologZoom = () => Math.min(1, ansicht.w * PX / 16);
const prologVersatz = () => ansicht.h > ansicht.w * 1.2 ? 2.6 : 0.8;
const sanft = u => u * u * (3 - 2 * u);
function prologKamera() {
  const D = Prolog.D; if (!D) return;
  const [x, z, zm] = D.kamera(sanft(Math.min(1, Prolog.t / PROLOG.dauer)));
  zoomSetzen(zm * prologZoom());
  kameraAuf(x, z + prologVersatz() / zm);
}
function prologAktualisieren(dt) {
  if (!Prolog.an) return;
  const W = Prolog.wechsel;
  if (W) {
    W.t += dt;
    if (W.t >= PROLOG.blende && !W.gebaut) {
      W.gebaut = true; prologSzeneBauen(W.ziel);
      const b = overlay.querySelector('.prolog-blende'); if (b) b.classList.remove('zu');
    }
    if (W.t >= PROLOG.blende * 2) Prolog.wechsel = null;
  } else if (Prolog.D) {
    Prolog.t += dt;
    if (Prolog.t >= PROLOG.dauer) prologWeiter();
  }
  if (Prolog.D) { Prolog.D.takt(Prolog.t, dt); prologKamera(); }
}

// ---------------------------------------------------------------------
// Bausteine der Szenen
// ---------------------------------------------------------------------
const P_GRAS = ['#3e5a34', '#46643a', '#36502e', '#52703f'], P_WALD = ['#1e3022', '#233826', '#1a2a1e', '#2a4028'];
const P_GRAS_HALME = [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']];
function prologBoden(art, arten, seed, gras) {
  const fein = neueGrafik() ? 2 : 1, boden = malBoden(64, 16 * fein, art, arten, seed);
  const istGras = (px, py) => boden.artBei(px, py) === 'gras';
  if (gras !== false) { streuGras(boden, istGras, 3000 * fein * fein, P_GRAS_HALME); streuBlumen(boden, istGras, 90 * fein); }
  streuDetails(boden, (px, py) => { const a = boden.artBei(px, py); return a !== 'wasser' && a !== 'asphalt'; }, 1800 * fein * fein);
  boden.fein = fein;
  return boden;
}
function prologDeko(b, x, z, schatten) { const o = figur(b, schatten || 0); stelle(o, x, z); return o; }
// Ein Gebäude des Lagers: in der neuen Grafik das Bild aus dem Dorf
const prologBau = typ => (neueGrafik() && neuerBau(typ, 0)) || BILD.gebaeude[typ][0];
const prologFeuerBilder = () => neueGrafik() ? BILD.feuerGross[0] : BILD.gebaeude.lagerfeuer;
function prologHeldBild(k, w, lauf, i) {
  if (neueGrafik()) { const v = neuHeld(k); return lauf ? v.seite[i % 4] : v.vorne.stand(); }
  const h = BILD.held[k][w];
  return lauf ? h['lauf' + (1 + i % 3)] : (i % 2 ? h.stand2 : h.stand);
}
// Ein bewegtes Feuer mit warmem Schein und Funken
function prologFeuer0(x, z) {
  const bilder = prologFeuerBilder(), o = prologDeko(bilder[0], x, z, 0);
  o.sprite.material.color.setScalar(1);
  const schein = bodenFlaeche(scheibeGeo, 0xffa040, 0.14); schein.position.set(x, 0.015, z); schein.scale.setScalar(5); weichesLicht(schein, 1.5); schein.visible = neueGrafik();
  const funken = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: i % 3 ? 0xffb040 : 0xffe080 }));
    s.center.set(0.5, 0); s.scale.set(PX, PX, 1); szene.add(s); funken.push({ s, t: i * 0.17 });
  }
  return (zeit, dt) => {
    zeige(o, bilder[Math.floor(zeit * (neueGrafik() ? 12 : 7)) % bilder.length], 1);
    schein.material.opacity = 0.12 + Math.sin(zeit * 9) * 0.02 + Math.sin(zeit * 23) * 0.01;
    for (const f of funken) {
      f.t += dt; const u = (f.t % 1.7) / 1.7;
      f.s.position.set(x + Math.sin(f.t * 3 + f.s.id) * 0.25, 0.5 + u * 2.4, z + 0.05);
      f.s.material.opacity = 1 - u; f.s.material.transparent = true;
    }
  };
}
// Blätter und Staub im Wind: Bewegung auch dort, wo nichts läuft
function prologBlaetter(x0, x1, z0, z1, farben, n) {
  const r = zufall(77), l = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: farben[i % farben.length] }));
    s.center.set(0.5, 0); s.scale.set(PX * 2, PX * 2, 1); szene.add(s);
    l.push({ s, x: x0 + r() * (x1 - x0), z: z0 + r() * (z1 - z0), y: 0.3 + r() * 2.5, v: 0.6 + r() * 0.9, p: r() * 6 });
  }
  return dt => {
    for (const b of l) {
      b.x += b.v * dt; b.y -= dt * 0.18; b.p += dt * 2;
      if (b.x > x1 || b.y < 0.05) { b.x = x0; b.y = 0.6 + (b.p % 2.2); }
      b.s.position.set(b.x, b.y + Math.sin(b.p) * 0.2, b.z);
    }
  };
}
// Eine Figur, die zwischen zwei Punkten hin und her geht (oder einmal hindurch und von vorn)
function prologGaenger(bilder, x0, x1, z, tempo, schatten, einmal) {
  const o = prologDeko(bilder[0], x0, z, schatten), g = { o, x: x0 };
  let richtung = x1 > x0 ? 1 : -1, weg = 0, wartet = 0;
  g.takt = dt => {
    if (wartet > 0) { wartet -= dt; zeige(o, bilder[0], richtung); return; }
    g.x += richtung * tempo * dt; weg += tempo * dt;
    const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    if (g.x > hi || g.x < lo) {
      if (einmal) g.x = richtung > 0 ? lo : hi;
      else { richtung = -richtung; g.x = Math.max(lo, Math.min(hi, g.x)); wartet = 0.6; }
    }
    const n = bilder.length, b = n > 1 ? bilder[1 + Math.floor(weg * 3.2) % (n - 1)] : bilder[0];
    zeige(o, b, richtung); stelle(o, g.x, z);
  };
  return g;
}

// ---------------------------------------------------------------------
// Szene 1 und 2: die tote Stadt der Alten
// ---------------------------------------------------------------------
function prologStadt(maschinen) {
  const r = zufall(maschinen ? 32 : 31), welle = (x, z) => Math.sin(x * 0.9) * 0.2 + Math.cos(z * 1.3) * 0.2;
  const boden = prologBoden((x, z) => {
    const w = welle(x, z);
    if (Math.abs(x) > 30) return 'wald';
    if (maschinen && z < -1.6 && z > -4.6 && Math.abs(x) < 9) return 'gehweg';   // der Platz vor der Lazi-Tafel
    if (z > -1.6 && z < 2.6) return 'asphalt';
    if ((z >= -2.8 && z <= -1.6) || (z >= 2.6 && z <= 3.6)) return 'gehweg';
    if (z < -2.8) return Math.sin(x * 0.7) + Math.cos(z * 1.1) + w > 0.6 ? 'schutt' : 'moos';
    return z > 3.6 + w + 0.4 ? 'gras' : 'moos';
  }, {
    asphalt: ['#34323e', '#3a3846', '#2e2c38', '#44424e'], gehweg: ['#5a5868', '#62607a', '#4e4c5e', '#6e6c86'],
    schutt: ['#2a2832', '#322f3a', '#24222c', '#3a3742'], moos: ['#22342a', '#283c2c', '#1e2e22', '#2e4430'],
    gras: P_GRAS, wald: P_WALD,
  }, maschinen ? 32 : 31);
  const { g, toPx: P2 } = boden, f = boden.fein;
  // Mittellinie, verblasst und lückenhaft, dazu Risse mit Gras
  for (let x = -32; x < 32; x += 1.3) { if (r() < 0.3) continue; g.fillStyle = r() < 0.5 ? '#7a7458' : '#66624c'; g.fillRect(P2(x), P2(0.48), P2(x + 0.6) - P2(x), Math.max(1, f * 1.5)); }
  for (let k = 0; k < 46; k++) {
    let x = P2(-30 + r() * 60), y = P2(-1.5 + r() * 4), dx = r() < 0.5 ? 1 : -1;
    for (let s = 0; s < (24 + r() * 40) * f; s++) { g.fillStyle = '#24222c'; g.fillRect(x, y, 1, 1); if (r() < 0.25) { g.fillStyle = r() < 0.5 ? '#3e5a34' : '#5a7a40'; g.fillRect(x + 1, y - 1, 1, 2); } if (r() < 0.6) x += dx; else y += 1; if (r() < 0.1) dx = -dx; }
  }
  // Bordsteinkanten
  for (const z of [-1.6, 2.6]) { g.fillStyle = '#7a788a'; g.fillRect(P2(-32), P2(z), P2(32) - P2(-32), Math.max(1, f)); }
  bodenMesh(boden, 64);
  // Türme der Alten in zwei Reihen, dazwischen Ruinen und Schutt
  for (let x = -27, i = 0; x < 28; x += 5.4 + r() * 1.2, i++) {
    if (maschinen && Math.abs(x) < 4) continue;   // dort steht die Tafel
    prologDeko(BILD.hochhaus[(i * 3 + (maschinen ? 1 : 0)) % 4], x, -5.4 - r() * 0.8, 0);
    if (r() < 0.6) prologDeko(BILD.ruine[i % 4], x + 2.6, -3.6 - r() * 0.4, 0.6);
    if (r() < 0.5) prologDeko(BILD.schutt[i % 3], x + 1.2, -2.2, 0.4);
  }
  for (let x = -18; x <= 18; x += 9) prologDeko(BILD.laterne, x + (maschinen ? 4.5 : 0), 3.3, 0.3);
  // Vorn wächst die Stadt zu
  for (let i = 0; i < 26; i++) {
    const x = -28 + r() * 56, z = 4.6 + r() * 6;
    prologDeko(r() < 0.45 ? BILD.laubbaum[i % 4] : BILD.busch[i % 6], x, z, 0.6);
  }
  let takt;
  if (!maschinen) {
    // Wracks auf der Straße, ein Bus, aus dem ein Baum wächst
    [[-9, 0.2, 0], [4.4, 1.6, 1], [11.5, -0.3, 2], [-15, 1.5, 3]].forEach(([x, z, k]) => prologDeko(BILD.autowrack[k], x, z, 0.8));
    if (neueGrafik()) { prologDeko(BILD.laubbaum[1], -1.4, 0.45, 0.9); prologDeko(BILD.bus, -2, 0.6, 1.2); } else prologDeko(BILD.busBaum, -2, 0.6, 1.2);
    takt = prologBlaetter(-22, 22, -2, 3.4, ['#6a8a40', '#8a6a30', '#5a7a3a', '#a08040'], 26);
    return { takt: (t, dt) => takt(dt), kamera: u => [-8 + u * 16, -4, 1] };
  }
  // Die Maschinen: Die Lazi-Tafel flackert, Wartungsroboter fahren ihre Runden, ein Lastläufer trägt Kisten, die niemand braucht
  const tafel = prologDeko(BILD.laziTafel[0], 0, -2.9, 0.6);
  const glanz = bodenFlaeche(scheibeGeo, 0x5ff0e0, 0.1); glanz.position.set(0, 0.02, -2.4); glanz.scale.set(4, 2.6, 1); weichesLicht(glanz, 1.5);
  prologDeko(BILD.kisten[0], 6.4, -2.8, 0.6); prologDeko(BILD.autowrack[2], -10, 1.8, 0.8);
  const leute = [
    prologGaenger(BILD.wartungsbot, -14, 14, 1.0, 1.6, 0.5, true),
    prologGaenger(BILD.wartungsbot, 13, -13, 2.1, 1.1, 0.5, true),
    prologGaenger(BILD.konvoi, 9, -9, -1.0, 0.9, 1.2, true),
  ];
  leute[1].x = 4; leute[2].x = 6;
  let flacker = 0;
  return {
    takt: (t, dt) => {
      leute.forEach(l => l.takt(dt));
      flacker -= dt;
      if (flacker <= 0) { flacker = 0.08 + Math.random() * 0.5; const an = Math.random() < 0.8; zeige(tafel, BILD.laziTafel[an ? 0 : 1], 1); glanz.material.opacity = an ? 0.1 : 0.03; }
    },
    kamera: u => [0, -3.6, 0.92 + u * 0.22],
  };
}

// ---------------------------------------------------------------------
// Szene 3: Heute. Das Feuer zwischen den Ruinen
// ---------------------------------------------------------------------
function prologFeuer() {
  const r = zufall(33);
  const boden = prologBoden((x, z) => Math.hypot(x, z * 1.2) < 3.2 ? 'erde' : Math.hypot(x, z) > 10 ? 'wald' : 'gras', { gras: P_GRAS, wald: P_WALD, erde: ['#6a5038', '#76583e', '#5e4632', '#846446'] }, 33);
  bodenMesh(boden, 64);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 9 + r() * 12;
    prologDeko(r() < 0.6 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], Math.cos(a) * d * 1.4, Math.sin(a) * d, 1);
  }
  // Mauerreste der Alten ringsum
  [[-7.2, -4.6, 0], [6.8, -4.8, 1], [-9.4, 2.8, 2], [9.2, 2.4, 3]].forEach(([x, z, k]) => prologDeko(BILD.ruine[k], x, z, 0.6));
  prologDeko(BILD.kisten[0], 4.1, 1.5, 0.6); prologDeko(BILD.kisten[1], -4.3, -0.4, 0.6);
  const feuer = prologFeuer0(0, 0.3);
  const vier = PROLOG_VIER.map(([k, w], i) => {
    const [x, z, blick] = [[-2.2, 0.6, 1], [2.2, 0.4, -1], [-1.2, -1.3, 1], [1.4, -1.5, -1]][i];
    const o = prologDeko(prologHeldBild(k, w, false, 0), x, z, 0.45); zeige(o, prologHeldBild(k, w, false, 0), blick);
    return { o, k, w, blick, p: i * 0.37 };
  });
  return {
    takt: (t, dt) => {
      feuer(t, dt);
      // Atmen (zwei Standbilder im Wechsel), ab und zu blickt einer in die Nacht
      for (const v of vier) zeige(v.o, prologHeldBild(v.k, v.w, false, Math.floor(t * 1.6 + v.p * 3)), Math.sin(t * 0.5 + v.p * 5) > 0.92 ? -v.blick : v.blick);
    },
    kamera: u => [0, -0.2, 0.8 + u * 0.55],
  };
}

// ---------------------------------------------------------------------
// Szene 4 und 5: das Lager zwischen den Feldern, der Wald, der Fluss
// ---------------------------------------------------------------------
const P_ACKER = ['#5a4228', '#644a2e', '#4e3a24', '#6e5234'];
const FELD_ACKER = [-2.5, -4.4, 8.5, 4.4];
function prologFelder(aufbruch) {
  const r = zufall(34), flussZ = x => -6.6 + Math.sin(x * 0.3) * 0.4, waldX = z => 13 + Math.sin(z * 0.8) * 0.8;
  const [a0, b0, a1, b1] = FELD_ACKER;
  const boden = prologBoden((x, z) => {
    if (z < flussZ(x) - 2.6) return 'wald';
    if (z < flussZ(x) - 2) return 'ufer';
    if (z < flussZ(x)) return 'wasser';
    if (z < flussZ(x) + 0.6) return 'ufer';
    if (x > waldX(z)) return 'wald';
    if (Math.abs(z - 1.2 - Math.sin(x * 0.5) * 0.15) < 0.55 && x > -4.5 && x < 12) return 'pfad';
    if (Math.hypot(x + 7, (z + 0.5) * 1.15) < 3.6) return 'erde';
    if (x > a0 && x < a1 && z > b0 && z < b1) return 'acker';
    return 'gras';
  }, {
    gras: P_GRAS, wald: P_WALD, acker: P_ACKER, erde: ['#6a5038', '#76583e', '#5e4632', '#846446'],
    pfad: ['#5a4630', '#664e36', '#4e3c2a', '#725a3e'], ufer: ['#5a5040', '#665a48', '#4e4638', '#706450'], wasser: ['#1e3a5a', '#24466a', '#1a3250', '#2e5480'],
  }, 34);
  prologAckerMalen(boden, a0, b0, a1, b1, r);
  // Strömung im Fluss
  { const { g, toPx: P2 } = boden; for (let i = 0; i < 220; i++) { const x = -32 + r() * 64, z = flussZ(x) - 0.3 - r() * 1.4; g.fillStyle = r() < 0.5 ? 'rgba(150,190,230,0.2)' : 'rgba(120,240,220,0.14)'; g.fillRect(P2(x), P2(z), (2 + r() * 6) * boden.fein, Math.max(1, boden.fein)); } }
  bodenMesh(boden, 64);
  // Das Lager: Feuer, Wohnhaus, Lager, Fahne
  const feuer = prologFeuer0(-7, -0.3);
  prologDeko(prologBau('wohnhaus'), -10.6, -2.8, 1.4); prologDeko(prologBau('lager'), -4.4, -3.4, 1.2);
  prologDeko(prologBau('fahne'), -9.8, 1.4, 0.4); prologDeko(BILD.kisten[1], -5.2, 0.6, 0.6);
  // Zaun am Acker
  for (let x = a0; x <= a1 + 0.01; x += 1.0) prologDeko(BILD.zaun, x, b0 - 0.3, 0);
  // Wald im Osten, Bäume am anderen Ufer und im Westen
  for (let i = 0; i < 70; i++) { const z = -9 + r() * 22, x = waldX(z) + 0.6 + r() * 14; prologDeko(BILD.tanne[i % 3], x, z, 1); }
  for (let i = 0; i < 40; i++) { const x = -30 + r() * 60, z = flussZ(x) - 3.2 - r() * 6; prologDeko(r() < 0.5 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 1); }
  for (let i = 0; i < 24; i++) { const x = -28 + r() * 14, z = -4 + r() * 14; if (Math.hypot(x + 7, z + 0.5) > 6) prologDeko(r() < 0.5 ? BILD.laubbaum[i % 4] : BILD.busch[i % 6], x, z, 0.7); }
  const blaetter = prologBlaetter(-14, 16, -4, 5, ['#6a8a40', '#8a6a30', '#a08040'], 14);
  if (!aufbruch) {
    // Wölfe am Waldrand, ein Plünderer am Fluss
    const leute = [prologGaenger(BILD.wf, 11.6, 14.4, 0.4, 1.4, 0.45), prologGaenger(BILD.wf, 14.8, 12.2, 2.4, 1.1, 0.45), prologGaenger(BILD.pl, 3.5, 8.5, flussZ(6) + 0.75, 0.9, 0.45)];
    return { takt: (t, dt) => { feuer(t, dt); blaetter(dt); leute.forEach(l => l.takt(dt)); }, kamera: u => [-7 + u * 17, -2, 1] };
  }
  // Der Aufbruch: Die vier gehen vom Feuer aufs Feld
  // Hintereinander mit Abstand, leicht versetzt: So bleibt jede Figur einzeln zu sehen
  const vier = PROLOG_VIER.map(([k, w], i) => {
    const x = -10.5 + i * 1.4, z = 1.0 + (i % 2) * 0.5;
    return { o: prologDeko(prologHeldBild(k, w, false, 0), x, z, 0.45), k, w, x, z, x1: x + 10, start: 0.4 + (3 - i) * 0.1 };
  });
  return {
    takt: (t, dt) => {
      feuer(t, dt); blaetter(dt);
      for (const v of vier) {
        const geht = t > v.start && v.x < v.x1;
        if (geht) v.x = Math.min(v.x1, v.x + 1.5 * dt);
        zeige(v.o, prologHeldBild(v.k, v.w, geht, Math.floor(t * 8)), 1);
        stelle(v.o, v.x, v.z);
      }
    },
    kamera: u => [-7 + u * 10.5, -0.9, 1 + u * 0.15],
  };
}
// Ackerfurchen und junge Pflanzen
function prologAckerMalen(boden, a0, b0, a1, b1, r) {
  const { g, toPx: P2 } = boden, f = boden.fein;
  for (let z = b0 + 0.2, n = 0; z < b1; z += 0.5, n++) {
    g.fillStyle = '#3e2c1a'; g.fillRect(P2(a0), P2(z), P2(a1) - P2(a0), Math.max(1, f));
    g.fillStyle = '#7a5c3a'; g.fillRect(P2(a0), P2(z) - Math.max(1, f), P2(a1) - P2(a0), Math.max(1, f));
    if (n % 2) for (let x = a0 + 0.2; x < a1 - 0.1; x += 0.35 + r() * 0.2) { g.fillStyle = r() < 0.5 ? '#5a7a40' : '#6e9048'; g.fillRect(P2(x), P2(z) - 2 * f, f, 2 * f); g.fillRect(P2(x) - f, P2(z) - f, f, f); }
  }
}

// ---------------------------------------------------------------------
// Nach dem Prolog: die Übung anbieten, am Ende das Lager übergeben
// ---------------------------------------------------------------------
function prologFertig() {
  SPIEL.prolog = 'uebung'; SPIEL.intro = true;
  spielSpeichern();
  modusDorf();
  if (!SPIEL.klasse) klassenWahl(); else uebungAnbieten();
}
function uebungAnbieten() {
  overlayZeigen(`<div class="card panel" role="dialog" aria-labelledby="ub">
    <div class="label">${esc(TX('Prolog · Übung'))}</div>
    <h1 id="ub">${esc(TX('Übung auf den Feldern'))}</h1>
    <p class="story">${esc(TX('Bevor es in die Ruinen geht: eine kurze Übung vor dem Lager. Laufen, zuschlagen, ausweichen, eine Fähigkeit, etwas aufheben und zum Schluss ein echter Wolf.'))}</p>
    <p class="note">${esc(TX('Dauert zwei, drei Minuten. Du kannst sie jederzeit abbrechen.'))}</p>
    <div class="knopfreihe"><button class="btn" data-a="uebung" type="button">${esc(TX('Zur Übung'))}</button><button class="btn ghost" data-a="zu" type="button">${esc(TX('Überspringen'))}</button></div>
  </div>`);
  overlay.querySelector('[data-a="uebung"]').addEventListener('click', () => { overlayWeg(); REISE = { ort: 'dorf', leben: 1, mission: 'uebung' }; mitLadebild(() => missionStarten('dorf')); });
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => uebungEnde(null));
}
// Ende der Übung (geschafft, abgebrochen oder übersprungen): Fund in den Beutel, kein Tag vergeht, keine Mission zählt
function uebungEnde(erg) {
  document.getElementById('uebungTafel').hidden = true;
  if (erg && erg.sieg) {
    inDenBeutel(erg.items || []);
    SLOTS.forEach(sl => { const it = erg.ausItems && erg.ausItems[sl]; if (it && SPIEL.beutel.some(x => x.uid === it.uid)) SPIEL.ausruestung[sl] = it.uid; });
    gutschreiben({ gold: erg.gold || 0, teile: erg.teile || 0 });
  }
  delete SPIEL.prolog;
  spielSpeichern();
  modusDorf();
  overlayZeigen(`<div class="card panel" role="dialog" aria-labelledby="ue">
    <div class="label">${esc(TX`Epoche 1 · ${EPOCHEN[0].name}`)}</div>
    <h1 id="ue">${esc(erg && erg.sieg ? TX('Gut gemacht. Jetzt das Lager.') : TX('Das Lager wartet'))}</h1>
    <dl class="facts">
      <dt>${esc(TX('Bauen'))}</dt><dd>${esc(TX('Wohnhäuser und Nahrungslager machen Platz für neue Einwohner.'))}</dd>
      <dt>${esc(TX('Missionen'))}</dt><dd>${esc(TX('Über die Weltkarte ziehst du los. Missionen bringen Gold, Lazi-Teile, Waffen, Erfahrung und Überlebende.'))}</dd>
      <dt>${esc(TX('Epoche'))}</dt><dd>${esc(TX`Erreiche ${EPOCHEN[0].ziel.einwohner} Einwohner und baue Schmiede und Lazi-Werkstatt.`)}</dd>
    </dl>
    <button class="btn" data-a="los" type="button">${esc(TX('Los geht\'s'))}</button>
  </div>`);
  overlay.querySelector('[data-a="los"]').addEventListener('click', () => { overlayWeg(); dorfHudAktualisieren(); meldung(KLASSEN[SPIEL.klasse].name, TX('Viel Glück da draußen'), 1800); });
}

// ---------------------------------------------------------------------
// Die Übung als Mission: sechs Schritte auf dem Feld vor dem Lager
// ---------------------------------------------------------------------
GEGNER.uebungspuppe = { name: TX('Strohpuppe'), leben: 34, tempo: 0, radius: 0.5, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0, punkte: 5, gold: [1, 2], teilChance: 0, bild: 'uebungspuppe', objekt: true };
GEGNER.uebungswolf = Object.assign({}, GEGNER.wolf, { name: TX('Junger Wolf'), leben: 18, schaden: 3, tempo: 3.4, punkte: 10, gold: [3, 5], teilChance: 0 });
// Das Bild der Puppe als Liste (so will es die Gegnertabelle). Erst beim ersten Zugriff, dann steht es fest (auch für den Missionsstand).
Object.defineProperty(BILD, 'uebungspuppe', { configurable: true, enumerable: true, get() { const v = [BILD.puppe]; Object.defineProperty(BILD, 'uebungspuppe', { value: v, writable: true, configurable: true, enumerable: true }); return v; } });

const UEBUNG = { fahne: [5.5, 0.2], puppe: [-4, -1.2], puppe2: [2.2, -3], wolf: 11.5, rollen: 2, heilenUnter: 0.35, pause: 0.9 };
const knopfName = act => { const b = document.querySelector(`#tbtns [data-act="${act}"]`); return b ? b.textContent : ''; };
const UEBUNG_SCHRITTE = [
  { titel: () => TX('Lauf zur Fahne'), pc: () => TX('Laufen mit WASD oder den Pfeiltasten'), touch: () => TX('Laufen: den Stick links unten ziehen'),
    fertig: () => Math.hypot(P.x - UEBUNG.fahne[0], P.z - UEBUNG.fahne[1]) < 1.5 },
  { titel: () => TX('Schlag die Strohpuppe um'), pc: () => TX('Zuschlagen mit Linksklick oder J'), touch: () => TX`Zuschlagen: Knopf „${knopfName('angriff')}“`,
    start: A => { A.puppe = gegnerErstellen('uebungspuppe', UEBUNG.puppe[0], UEBUNG.puppe[1]); }, fertig: A => !G.gegner.includes(A.puppe) },
  { titel: () => P.klasse === 'schatten' ? TX('Spring zweimal') : TX('Weich zweimal aus'), pc: () => P.klasse === 'schatten' ? TX('Phasensprung mit der Leertaste') : TX('Ausweichrolle mit der Leertaste'), touch: () => TX`Ausweichen: Knopf „${knopfName('rolle')}“`,
    start: A => { A.rollen = 0; A.cd = P.rolleCd; }, fertig: A => A.rollen >= UEBUNG.rollen },
  { titel: () => TX('Setz eine Fähigkeit ein'), pc: () => TX('Fähigkeiten mit Q, E oder R. Sie kosten Mana (der blaue Balken).'), touch: () => TX('Fähigkeiten: Knöpfe Q, E und R. Sie kosten Mana (der blaue Balken).'),
    start: A => { A.puppe = gegnerErstellen('uebungspuppe', UEBUNG.puppe2[0], UEBUNG.puppe2[1]); P.tcd.q = P.tcd.e = P.tcd.r = 0; }, fertig: () => P.tcd.q > 0 || P.tcd.e > 0 || P.tcd.r > 0 },
  { titel: () => TX('Heb die Rüstung auf'), pc: () => TX('Hingehen und F drücken'), touch: () => TX('Hingehen und „Ausrüsten“ tippen'),
    start: A => { const it = gegenstandErzeugen('ruestung', 1); A.fund = it.uid; gegenstandAblegen(it, P.x + (P.x > 6 ? -1.8 : 1.8), P.z + 0.4); }, fertig: A => G.gefunden.some(it => it.uid === A.fund) },
  { titel: () => TX('Besiege den Wolf'), pc: () => TX('Er springt dich an. Weich aus und schlag zurück.'), touch: () => TX('Er springt dich an. Weich aus und schlag zurück.'),
    start: A => { A.wolf = gegnerErstellen('uebungswolf', P.x > 0 ? -UEBUNG.wolf : UEBUNG.wolf, -3); }, fertig: A => !G.gegner.includes(A.wolf) },
];
auftragstypAnmelden('uebung', { starten: uebungStarten, ablauf: uebungAblauf, hud: uebungHud, stand: A => uebungTafel(A, true) });
function uebungStarten(A) {
  A.schritt = 0; A.pauseT = 0;
  A.ring = bodenFlaeche(ringGeo, 0xeab03a, 0.85); A.ring.position.set(UEBUNG.fahne[0], 0.02, UEBUNG.fahne[1]); A.ring.scale.setScalar(1.3);
  uebungTafel(A, true);
}
function uebungAblauf(dt, A) {
  if (A.schritt >= UEBUNG_SCHRITTE.length) return;
  // Niemand verliert die Übung: Unter einem Drittel Leben heilt der Held
  if (P.hp > 0 && P.hp < P.maxHp * UEBUNG.heilenUnter) { P.hp = Math.round(P.maxHp * 0.7); zahl(P.x, 2.4, P.z, TX('Durchatmen'), 'heal'); }
  if (A.pauseT > 0) {
    A.pauseT -= dt;
    if (A.pauseT <= 0) { const S = UEBUNG_SCHRITTE[A.schritt]; if (S.start) S.start(A); uebungRing(A); uebungTafel(A, true); }
    return;
  }
  const S = UEBUNG_SCHRITTE[A.schritt];
  if (S === UEBUNG_SCHRITTE[2]) { if (P.rolleCd > A.cd + 0.05) A.rollen++; A.cd = P.rolleCd; }
  if (S === UEBUNG_SCHRITTE[3]) P.mana = P.manaMax;
  if (!S.fertig(A)) return;
  A.schritt++;
  geraeusch('teil'); zahl(P.x, 2.6, P.z, TX('Geschafft!'), 'big');
  if (A.schritt >= UEBUNG_SCHRITTE.length) { A.ring.visible = false; uebungTafel(A, true); auftragGeschafft(TX('Übung geschafft')); return; }
  A.pauseT = UEBUNG.pause; A.ring.visible = false;
  uebungTafel(A, true);
}
// Der Ring zeigt, wohin es geht: zur Fahne, zur Puppe, zum Fund, zum Wolf (der bewegt sich, also kein Ring)
function uebungRing(A) {
  const S = A.schritt, wo = S === 0 ? UEBUNG.fahne : S === 1 || S === 3 ? (S === 1 ? UEBUNG.puppe : UEBUNG.puppe2) : S === 4 && G.items.length ? [G.items[0].x, G.items[0].z] : null;
  A.ring.visible = !!wo;
  if (wo) A.ring.position.set(wo[0], 0.02, wo[1]);
}
function uebungHud(A) {
  const n = Math.min(A.schritt, UEBUNG_SCHRITTE.length);
  hudText('waveLabel', TX('Übung'));
  hudText('waveSub', TX`Schritt ${Math.min(n + 1, UEBUNG_SCHRITTE.length)} von ${UEBUNG_SCHRITTE.length}`);
  hudText('doorLabel', TX`${n} von ${UEBUNG_SCHRITTE.length} geschafft`);
  document.getElementById('doorFill').style.width = (n / UEBUNG_SCHRITTE.length * 100) + '%';
  uebungTafel(A, false);
}
// Die Tafel oben in der Mitte: Schritt, was zu tun ist (für Tastatur oder Touch) und „Übung abbrechen“
function uebungTafel(A, neu) {
  const el = document.getElementById('uebungTafel');
  if (!el) return;
  const hud = document.getElementById('hud');
  if (hud && !hud.hidden) el.style.top = Math.round(hud.getBoundingClientRect().bottom + 6) + 'px';
  el.hidden = !(G && MIS === MISSIONEN.uebung);
  if (!neu && el.dataset.schritt === String(A.schritt) + (A.pauseT > 0 ? 'p' : '')) return;
  el.dataset.schritt = String(A.schritt) + (A.pauseT > 0 ? 'p' : '');
  const fertig = A.schritt >= UEBUNG_SCHRITTE.length, S = UEBUNG_SCHRITTE[Math.min(A.schritt, UEBUNG_SCHRITTE.length - 1)];
  el.innerHTML = `<div class="label">${esc(TX`Übung · Schritt ${Math.min(A.schritt + 1, UEBUNG_SCHRITTE.length)} von ${UEBUNG_SCHRITTE.length}`)}</div>
    <b>${esc(fertig ? TX('Geschafft!') : A.pauseT > 0 ? TX('Gut so!') : S.titel())}</b>
    <small>${esc(fertig ? TX('Die Übung ist vorbei.') : A.pauseT > 0 ? TX('Gleich kommt der nächste Schritt.') : istTouch ? S.touch() : S.pc())}</small>
    <span class="uebung-punkte">${UEBUNG_SCHRITTE.map((_, i) => `<i class="${i < A.schritt ? 'an' : i === A.schritt ? 'jetzt' : ''}"></i>`).join('')}</span>
    <button class="btn small ghost" data-a="uebungAus" type="button">${esc(TX('Übung abbrechen'))}</button>`;
  el.querySelector('[data-a="uebungAus"]').addEventListener('click', uebungAbbrechen);
}
function uebungAbbrechen() {
  if (!G || MIS !== MISSIONEN.uebung || G.zustand !== 'spiel') return;
  G.zustand = 'ende';
  delete SPIEL.laufend; REISE = null;
  missionAufraeumen();
  uebungEnde(null);
}
// Das Feld vor dem Lager: Wiese, Äcker hinter dem Zaun, oben das Lager, links und rechts Wald
function aufbauUebung() {
  szene.background = new THREE.Color('#0c100e');
  const r = zufall(36), fein = neueGrafik() ? 2 : 1, waldX = z => 15 + Math.sin(z * 0.7) * 0.8;
  const boden = malBoden(64, 16 * fein, (x, z) => {
    if (Math.abs(x) > waldX(z) || z < -16) return 'wald';
    if (z < -6.6 && z > -9.6 && Math.abs(x) > 2.2 && Math.abs(x) < 13) return 'acker';
    if (Math.abs(x - Math.sin(z * 0.4) * 0.3) < 0.8 && z < 9) return 'pfad';
    if (Math.hypot(x, (z + 12) * 1.2) < 3.6) return 'erde';
    return 'gras';
  }, { gras: P_GRAS, wald: P_WALD, acker: P_ACKER, erde: ['#6a5038', '#76583e', '#5e4632', '#846446'], pfad: ['#5a4630', '#664e36', '#4e3c2a', '#725a3e'] }, 36);
  boden.fein = fein;
  prologAckerMalen(boden, -13, -9.6, -2.2, -6.6, r); prologAckerMalen(boden, 2.2, -9.6, 13, -6.6, r);
  const istGras = (px, py) => boden.artBei(px, py) === 'gras';
  streuGras(boden, istGras, 3200 * fein * fein, P_GRAS_HALME); streuBlumen(boden, istGras, 90 * fein);
  streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'acker', 2000 * fein * fein);
  bodenMesh(boden, 64);
  // Zaun vor den Äckern (mit Lücke für den Weg), dahinter das Lager
  for (let x = -13; x <= 13.01; x += 1.0) if (Math.abs(x) > 1.6) decoBild(BILD.zaun, x, -6.4, 0, 0);
  const feuerBilder = prologFeuerBilder(), feuer = decoBild(feuerBilder[0], 0, -12, 0.8);
  feuer.sprite.material.color.setScalar(1); animDeko(feuer, feuerBilder, neueGrafik() ? 12 : 7);
  if (neueGrafik()) lichtFleck(0, -12, 5, 0xffa040, 0.14, 0.05);   // in Klassisch wäre der Schein eine harte Scheibe
  decoBild(prologBau('wohnhaus'), -5.6, -12.6, 0, 1.4); decoBild(prologBau('lager'), 5.4, -13, 0, 1.2);
  decoBild(prologBau('fahne'), UEBUNG.fahne[0], UEBUNG.fahne[1] - 0.2, 0.3, 0.4);
  decoBild(BILD.kisten[0], -10.6, 2.6, 0.7); decoBild(BILD.kisten[1], 10.4, 5.4, 0.7);
  for (let i = 0; i < 90; i++) { const z = -16 + r() * 30, s = r() < 0.5 ? -1 : 1, x = s * (waldX(z) + 0.6 + r() * 12); decoBild(r() < 0.6 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4], x, z, 0, 1); }
  for (let i = 0; i < 18; i++) { const x = -14 + r() * 28, z = 8.6 + r() * 6; decoBild(BILD.busch[i % 6], x, z, 0, 0.5); }
}

Object.assign(MISSIONEN, {
  uebung: { titel: TX('Übung auf den Feldern'), art: TX('Übung'), ort: 'dorf', typ: 'uebung', gefahr: 1,
    geschichten: [{ intro: TX('Vor dem Lager, zwischen den Äckern: Hier lernst du laufen, zuschlagen und ausweichen, bevor es in die Ruinen geht.'),
      outro: TX('Die Puppen liegen im Gras, der Wolf ist verjagt. Am Feuer nicken sie dir zu. Jetzt geht es um das Lager.') }],
    zielText: TX('Sechs Schritte auf dem Feld vor dem Lager.'),
    siegTitel: TX('Übung geschafft'),
    niederlage: TX('Du rappelst dich auf. Übung ist Übung.'),
    feld: { x: 13.5, zMin: -5.8, zMax: 8 }, start: [0, 3.5], aufbau: () => aufbauUebung(), ziel: null, wellen: () => [], musik: 'kampf',
    belohnung: erg => { erg.gold += 10; },
    nachher: erg => uebungEnde(erg) },
});

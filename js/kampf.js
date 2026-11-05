// =====================================================================
// KAMPF: Mana und Fähigkeiten (Q, E, R), Zustände und Kombos,
// Elite-Gegner, Explosionen, Öl, Blut und Funken.
// Ergänzt mission.js. Die Zahlen stehen in einstellungen.js.
// =====================================================================

function hatEffekt(id) { return !!(P && P.effekte && P.effekte.has(id)); }
function technikMal() { return hatEffekt('ueberladen') ? 1.25 : 1; }

// ---------------------------------------------------------------------
// Ausrüstung in der Mission: Werte des Spielers neu berechnen
// ---------------------------------------------------------------------
function spielerWerteSetzen(erstesMal) {
  const items = SLOTS.map(sl => G.ausItems[sl]);
  const hw = heldWerte(items);
  const anteil = erstesMal ? 1 : P.hp / P.maxHp;
  Object.assign(P, {
    waffe: G.ausItems.waffe, maxHp: hw.leben, tempo: hw.tempo, schadenWerte: hw.schaden, angriffMal: hw.angriffTempo,
    manaMax: hw.mana, ruestung: hw.ruestung, ausweichen: hw.ausweichen, krit: hw.krit, effekte: hw.effekte,
  });
  if (!erstesMal) P.hp = Math.max(1, Math.round(P.maxHp * anteil));
  P.mana = Math.min(P.mana === undefined ? P.manaMax : P.mana, P.manaMax);
}

// ---------------------------------------------------------------------
// Fähigkeiten auslösen
// ---------------------------------------------------------------------
function technikDrueck(taste) {
  if (!imSpiel() || P.hp <= 0) return;
  const T = TECHNIKEN[P.klasse][taste];
  if (P.tcd[taste] > 0) { zahl(P.x, 2.6, P.z, TX`Noch ${Math.ceil(P.tcd[taste])} s`, 'mana'); return; }
  if (P.mana < T.mana) { zahl(P.x, 2.6, P.z, TX('Zu wenig Mana'), 'mana'); return; }
  if (T.zielen) { P.zielen = taste; return; }
  technikAusfuehren(taste);
}
function technikLos(taste) {
  if (!P || P.zielen !== taste) return;
  P.zielen = null;
  if (imSpiel()) technikAusfuehren(taste);
}
function technikAusfuehren(taste) {
  const T = TECHNIKEN[P.klasse][taste];
  if (P.mana < T.mana || P.tcd[taste] > 0) return;
  if (TECHNIK_AKTION[T.id](T) === false) return;
  P.mana -= T.mana; P.tcd[taste] = T.abklingzeit;
  P.laedt = false; P.ladung = 0;
}

const TECHNIK_AKTION = {
  // ---------- Schwertkämpfer ----------
  sturmangriff(T) {
    const a = zielWinkel();
    P.sturm = { t: T.dauer, dx: Math.cos(a), dz: Math.sin(a), tempo: T.weite / T.dauer, getroffen: new Set(), schaden: spielerSchaden(T.schaden) * technikMal() };
    P.unverwundbar = T.dauer + 0.15; P.blick = Math.cos(a) >= 0 ? 1 : -1; P.hiebT = T.dauer;
    wackeln(0.15); geraeusch('hieb');
  },
  dolchwurf(T) {
    const a = zielWinkel();
    wurfgeschoss(P.x, P.z, a, T.tempo, T.reichweite, spielerSchaden(T.schaden) * technikMal(), { status: ['blutung'], bild: BILD.wurfdolch });
    P.hiebT = 0.12; P.blick = Math.cos(a) >= 0 ? 1 : -1;
    geraeusch('wurf');
  },
  klingensturm(T) {
    if (G.klingen) G.klingen.sprites.forEach(s => szene.remove(s));
    const sprites = [];
    for (let i = 0; i < T.klingen; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: BILD.klinge.r, alphaTest: 0.5 }));
      s.center.set(0.5, 0.5); s.scale.set(BILD.klinge.w * PX * 1.3, BILD.klinge.h * PX * 1.3, 1);
      szene.add(s); sprites.push(s);
    }
    G.klingen = { t: T.dauer, winkel: 0, sprites, T, treffer: new Map(), schaden: spielerSchaden(T.schaden) * technikMal() };
    partikel(P.x, 1, P.z, 0x5ff0e0, 16, 4);
    geraeusch('beschwoeren');
  },
  // ---------- Golem-Beschwörer ----------
  schockkette(T) {
    const a = zielWinkel();
    const kandidaten = G.gegner.filter(e => abstand(e, P) < T.reichweite + e.r);
    if (!kandidaten.length) { zahl(P.x, 2.6, P.z, TX('Kein Ziel in Reichweite'), 'mana'); return false; }
    kandidaten.sort((u, v) => (abstand(u, P) + Math.abs(winkelDiff(Math.atan2(u.z - P.z, u.x - P.x), a)) * 3) - (abstand(v, P) + Math.abs(winkelDiff(Math.atan2(v.z - P.z, v.x - P.x), a)) * 3));
    let von = { x: P.x + Math.cos(a) * 0.7, z: P.z + Math.sin(a) * 0.7, y: 1.5 }, ziel = kandidaten[0], schaden = spielerSchaden(T.schaden) * technikMal();
    const getroffen = new Set();
    for (let i = 0; i < T.ziele + (hatEffekt('kette') ? 1 : 0) && ziel; i++) {
      blitzLinie(von.x, von.y, von.z, ziel.x, 0.8, ziel.z, 0x9ff8ff);
      blitzLinie(von.x, von.y, von.z, ziel.x, 0.8, ziel.z, 0xffffff);
      getroffen.add(ziel);
      const z = ziel;
      gegnerTreffen(z, schaden, 0, 0, 0, false, 'spieler', null, { status: ['schock'], technik: true });
      partikel(z.x, 0.9, z.z, 0x9ff8ff, 5, 3);
      von = { x: z.x, z: z.z, y: 0.8 }; schaden *= 0.85;
      ziel = naechster(z, G.gegner.filter(o => !getroffen.has(o)), T.sprung);
    }
    geraeusch('strom'); wackeln(0.08);
  },
  fokus(T) {
    let ziel = null;
    if (eingabe.zielart === 'maus') { let bd = 3; for (const e of G.gegner) { const d = Math.hypot(e.x - eingabe.maus.x, e.z - eingabe.maus.z); if (d < bd) { bd = d; ziel = e; } } }
    if (!ziel) ziel = naechster(P, G.gegner, 12);
    if (!ziel) { zahl(P.x, 2.6, P.z, TX('Kein Ziel'), 'mana'); return false; }
    fokusEntfernen();
    const ring = bodenFlaeche(ringGeo, 0x5ff0e0, 0.85);
    G.fokus = { e: ziel, t: T.dauer, ring, bonus: T.bonus };
    zahl(ziel.x, ziel.sprite.scale.y + 0.6, ziel.z, TX('Fokus'), 'perfekt');
    geraeusch('teil');
  },
  riesengolem(T) {
    const max = golemMax();
    let golems = G.verbuendete.filter(v => v.art === 'golem');
    // Kein Platz? Die ältesten kleinen Golems verschmelzen zum Riesen.
    while (golems.reduce((n, g) => n + (g.plaetze || 1), 0) + T.plaetze > max && golems.length) {
      const alt = golems.find(g => !g.riese) || golems[0];
      partikel(alt.x, 0.8, alt.z, 0x5ff0e0, 10, 3);
      verbuendeterWeg(alt, false);
      golems = G.verbuendete.filter(v => v.art === 'golem');
    }
    const g = golemErstellen(bauPunkt(1.8), T.mal);
    g.riese = true; g.plaetze = T.plaetze; g.r = 0.75;
    partikel(g.x, 1.2, g.z, new THREE.Color(g.el.farbe).getHex(), 30, 5);
    wackeln(0.3); geraeusch('explosion');
    meldung(TX('Riesengolem'), TX`${ELEMENTE[g.element].name} · dreimal so stark`, 1400);
  },
  // ---------- Architekt ----------
  sprengfalle(T) {
    const p = bauPunkt(1.6);
    if (G.fallen.length >= T.max) entfernen(G.fallen.shift());
    const f = Object.assign(figur(BILD.sprengfalle, 0), { x: p.x, z: p.z, scharf: 0.5, T });
    stelle(f, f.x, f.z);
    G.fallen.push(f);
    geraeusch('bauen');
  },
  ueberladung(T) {
    if (!G.tuerme.length) { zahl(P.x, 2.6, P.z, TX('Keine Bauwerke'), 'mana'); return false; }
    G.ueberladung = T.dauer;
    G.tuerme.forEach(t => partikel(t.x, 1.4, t.z, 0x5ff0e0, 10, 3));
    geraeusch('strom');
  },
  feuerballiste(T) {
    const p = bauPunkt(1.9);
    const t = { art: 'turm', typ: 'feuerballiste', x: p.x, z: p.z, r: 0.7, rest: T.dauer };
    begrenzen(t);
    if (!platzFrei(t, t.r)) { zahl(P.x, 2.6, P.z, TX('Hier ist kein Platz'), 'mana'); return false; }
    turmAufstellen(t, BILD.feuerballiste[0], 160);
    partikel(t.x, 0.8, t.z, 0xff8a30, 20, 4);
  },
  // ---------- Schattenläufer ----------
  wurfdolche(T) {
    const a = zielWinkel(), f = T.faecher * Math.PI / 180;
    for (let i = 0; i < T.anzahl; i++) {
      const w = a - f / 2 + f * i / (T.anzahl - 1);
      wurfgeschoss(P.x, P.z, w, T.tempo, T.reichweite, spielerSchaden(T.schaden) * technikMal(), { status: ['gift'], bild: BILD.wurfdolch });
    }
    P.hiebT = 0.12; P.blick = Math.cos(a) >= 0 ? 1 : -1;
    geraeusch('wurf');
  },
  rauchbombe(T) {
    G.rauch = T.dauer; P.ausDemRauch = true;
    for (let i = 0; i < 26; i++) rauchwolke(P.x + zz(-1.4, 1.4), P.z + zz(-1, 1), 1.2);
    for (const e of G.gegner) if (e.ziel === P && e.zustand === 'jagen') e.ziel = null;
    geraeusch('explosion');
  },
  koederpuppe(T) {
    if (G.puppe) verbuendeterWeg(G.puppe, false);
    const p = bauPunkt(1.6);
    const pu = Object.assign(figur(BILD.puppe, 0.45), { art: 'puppe', x: p.x, z: p.z, r: 0.45, hp: T.leben, maxHp: T.leben, rest: T.dauer, blick: 1, blitz: 0, hiebT: 0, bewegt: false, spott: true, T });
    begrenzen(pu); stelle(pu, pu.x, pu.z);
    G.verbuendete.push(pu); G.puppe = pu;
    partikel(pu.x, 1, pu.z, 0xc890ff, 16, 3);
    geraeusch('bauen');
  },
};

function golemMax() { return BESCHWOERUNG.max + G.extraMax + (hatFaehigkeit('grosserkreis') ? 1 : 0); }
function fokusEntfernen() { if (G.fokus) { szene.remove(G.fokus.ring); G.fokus = null; } }

// ---------------------------------------------------------------------
// Geschosse des Spielers: Dolche, Feuerbolzen
// ---------------------------------------------------------------------
function wurfgeschoss(x, z, a, tempo, reichweite, schaden, opt) {
  const g = Object.assign(figur(opt.bild, 0), { x: x + Math.cos(a) * 0.5, z: z + Math.sin(a) * 0.5, dx: Math.cos(a), dz: Math.sin(a), tempo, rest: reichweite, schaden, opt, getroffen: new Set() });
  g.sprite.center.set(0.5, 0.5);
  g.sprite.material.rotation = -Math.atan2(-g.dz * Math.sin(NEIGUNG), g.dx);
  stelle(g, g.x, g.z, 0.9);
  G.wurf.push(g);
  return g;
}
function wurfFliegen(g, dt) {
  const s = g.tempo * dt;
  g.x += g.dx * s; g.z += g.dz * s; g.rest -= s;
  stelle(g, g.x, g.z, 0.9);
  if (g.opt.feuer && Math.random() < dt * 30) partikel(g.x, 0.9, g.z, 0xff8a30, 1, 0.5);
  for (const e of G.gegner) {
    if (g.getroffen.has(e) || e.hp <= 0 || abstand(g, e) > e.r + 0.25) continue;
    g.getroffen.add(e);
    gegnerTreffen(e, g.schaden, g.dx, g.dz, g.opt.feuer ? 2 : 1.5, !!g.opt.feuer, g.opt.quelle || 'spieler', null, { status: g.opt.status, technik: !g.opt.quelle, durch: g.opt.feuer });
    if (!g.opt.durchbohrt) return false;
  }
  for (const f of G.faesser) if (f.hp > 0 && abstand(g, f) < f.r + 0.2) { fassTreffen(f, g.opt.feuer); return false; }
  for (const o of G.oel) if (g.opt.feuer && !o.brennt && Math.hypot(o.x - g.x, o.z - g.z) < o.r) oelEntzuenden(o);
  for (const h of HINDERNISSE) if (abstand(g, h) < h.r) return false;
  if (Math.abs(g.x) > FELD.x + 2 || g.z < FELD.zMin - 2 || g.z > FELD.zMax + 2) return false;
  return g.rest > 0;
}

// ---------------------------------------------------------------------
// Zustände an Gegnern
// ---------------------------------------------------------------------
function zustandGeben(e, art) {
  if (e.hp <= 0) return;
  if (e.feuerfest && art === 'brennen') return;
  const Z = ZUSTAENDE, z = e.zs;
  if (art === 'brennen') {
    z.brennen = Z.brennen.dauer;
    const pf = G.oel.find(o => !o.brennt && Math.hypot(o.x - e.x, o.z - e.z) < o.r + e.r);
    if (pf) oelEntzuenden(pf);
    else if (z.oel > 0) { z.oel = 0; oelPfuetze(e.x, e.z, Z.oel.radius, true); }
  } else if (art === 'gift') {
    z.gift = Z.gift.dauer; z.giftStapel = Math.min(Z.gift.stapel, (z.giftStapel || 0) + 1);
  } else if (art === 'blutung') {
    z.blutung = Z.blutung.dauer;
  } else if (art === 'frost') {
    if (z.gefroren > 0) return;
    z.frost = Z.frost.dauer; z.frostStapel = (z.frostStapel || 0) + 1;
    if (z.frostStapel >= Z.frost.stapel) {
      z.frostStapel = 0;
      if (!e.def.boss) { z.gefroren = e.def.miniboss ? Z.frost.eingefroren * 0.5 : Z.frost.eingefroren; zahl(e.x, e.sprite.scale.y + 0.5, e.z, TX('Eingefroren'), 'frost'); partikel(e.x, 0.8, e.z, 0xc8f0ff, 10, 3); geraeusch('eis'); }
    }
  } else if (art === 'schock') {
    z.betaeubt = e.def.boss ? 0.1 : ZUSTAENDE.schock.betaeubt; z.schock = Z.schock.dauer;
  } else if (art === 'oel') {
    z.oel = Z.oel.dauer;
  }
}
function zustaendeTick(e, dt) {
  const z = e.zs, Z = ZUSTAENDE;
  for (const k of ['brennen', 'gift', 'blutung', 'frost', 'schock', 'gefroren', 'betaeubt', 'oel']) if (z[k] > 0) z[k] -= dt;
  if (z.gift <= 0) z.giftStapel = 0;
  if (z.frost <= 0) z.frostStapel = 0;
  e.tickT = (e.tickT || 0) + dt;
  if (e.tickT < 0.5) return;
  e.tickT -= 0.5;
  const septisch = z.gift > 0 && z.blutung > 0 ? Z.septisch.mal : 1;
  const mal = P.schadenWerte;
  const n = (z.brennen > 0 ? Z.brennen.proSek : 0) + (z.gift > 0 ? Z.gift.proSek * z.giftStapel * septisch : 0) + (z.blutung > 0 ? Z.blutung.proSek * septisch * (e.bewegt ? 1.5 : 1) : 0);
  if (z.brennen > 0) partikel(e.x, 0.9, e.z, 0xff8a30, 2, 1);
  if (z.gift > 0) partikel(e.x, 0.9, e.z, 0x8ad860, 1, 1);
  if (z.blutung > 0) { partikel(e.x, 0.7, e.z, 0xa01828, 2, 1); if (Math.random() < 0.5) fleck(e.x, e.z, 'blut'); }
  if (septisch > 1 && !e.septischGezeigt) { e.septischGezeigt = true; zahl(e.x, e.sprite.scale.y + 0.6, e.z, TX('Septisch!'), 'gift'); }
  if (n > 0) gegnerTreffen(e, Math.max(1, Math.round(n * 0.5 * mal)), 0, 0, 0, false, 'zustand');
}
// Wie schnell ein Gegner gerade ist (Frost, Öl, Trommel, Elite)
function gegnerTempoMal(e) {
  const z = e.zs;
  let m = 1;
  if (e.langsam > 0) m *= 0.6;
  if (z.frost > 0) m *= 1 - ZUSTAENDE.frost.langsam * Math.max(1, z.frostStapel);
  if (z.oel > 0) m *= 1 - ZUSTAENDE.oel.langsam;
  if (e.buff > 0) m *= 1.3;
  if (e.elite === 'flink') m *= 1.4;
  return m;
}
function gegnerSteht(e) { return e.zs.gefroren > 0 || e.zs.betaeubt > 0; }

// ---------------------------------------------------------------------
// Treffer an Gegnern: Schilde, Panzer, Kritisch, Kombos, Zustände
// quelle: 'spieler', 'golem', 'turm', 'soldat', 'zustand', 'explosion'
// opt: { status: [...], durch: ignoriert Schild und Panzer, technik: Fähigkeit }
// ---------------------------------------------------------------------
function gegnerTreffen(e, n, nx, nz, rueck, stark, quelle, golem, opt) {
  if (e.hp <= 0) return;
  opt = opt || {};
  const spieler = quelle === 'spieler';
  const durch = opt.durch || (spieler && hatEffekt('durchschlag'));
  let klasse = stark ? 'big' : quelle === 'golem' ? 'golem' : quelle === 'zustand' ? zustandFarbe(e) : '';
  // Schildträger blocken von vorne. Harte Schläge zerbrechen den Schild.
  if (e.schild > 0 && !durch && (nx || nz) && quelle !== 'zustand') {
    const ziel = e.ziel || P, fx = ziel.x - e.x, fz = ziel.z - e.z, fl = Math.hypot(fx, fz) || 1;
    if ((-nx * fx - nz * fz) / fl > 0.25) {
      partikel(e.x + fx / fl * 0.6, 0.9, e.z + fz / fl * 0.6, 0xfff0a0, 5, 4);
      if (stark) {
        e.schild -= n * 2;
        if (e.schild <= 0) {
          e.schild = 0; e.bilder = BILD.pl;
          zahl(e.x, e.sprite.scale.y + 0.6, e.z, TX('Schild zerbrochen!'), 'big');
          partikel(e.x, 0.8, e.z, 0x9aa6c0, 14, 5); geraeusch('explosion'); wackeln(0.12);
        } else { zahl(e.x, e.sprite.scale.y + 0.3, e.z, TX('Schild wankt'), 'block'); geraeusch('turm'); }
        n *= 0.5;
      } else {
        e.kx += nx * 2; e.kz += nz * 2;
        zahl(e.x, e.sprite.scale.y + 0.3, e.z, TX('Geblockt'), 'block');
        geraeusch('turm');
        if (spieler) P.mana = Math.min(P.manaMax, P.mana + 1);
        return;
      }
    }
  }
  // Zelte brennen am besten: normale Treffer kratzen kaum, Feuer frisst sie auf
  if (e.ueberhitzt > 0) n *= 1.7;
  if (e.panzer) n *= e.panzer;
  if (e.typ === 'zelt') n *= quelle === 'zustand' && e.zs.brennen > 0 ? 3 : (opt.status || []).includes('brennen') || quelle === 'explosion' ? 1.5 : 0.4;
  if (e.elite === 'gepanzert' && !durch) n *= 0.65;
  if (e.zs.schock > 0) n *= 1 + ZUSTAENDE.schock.mehrSchaden;
  // Zersplittern: harter Schlag auf einen eingefrorenen Gegner
  if (e.zs.gefroren > 0 && (stark || n >= 20) && quelle !== 'zustand') {
    n *= ZUSTAENDE.zersplittern.mal; e.zs.gefroren = 0;
    zahl(e.x, e.sprite.scale.y + 0.7, e.z, TX('Zersplittert!'), 'frost');
    partikel(e.x, 0.8, e.z, 0xe0f8ff, 22, 6); geraeusch('eis'); wackeln(0.15);
    for (const o of G.gegner.slice()) if (o !== e && abstand(o, e) < ZUSTAENDE.zersplittern.flaeche + o.r) gegnerTreffen(o, Math.round(n * 0.4), 0, 0, 2, false, 'explosion', null, { status: ['frost'] });
  }
  if (spieler) {
    if (opt.technik) n *= technikMal();
    if (P.ausDemRauch && !opt.technik) { n *= 2; P.ausDemRauch = false; G.rauch = 0; zahl(e.x, e.sprite.scale.y + 0.7, e.z, TX('Aus dem Schatten!'), 'perfekt'); }
    if (G.puppe && e.ziel === G.puppe && P.klasse === 'schatten') n *= 1 + G.puppe.T.rueckenBonus;
    if (Math.random() * 100 < P.krit) { n *= KRIT_MAL; klasse = 'krit'; G.frieren = Math.max(G.frieren, 0.05); }
  }
  n = Math.max(1, Math.round(n));
  e.hp -= n; if (quelle !== 'zustand') e.blitz = 0.09;
  if (!(e.zs.gefroren > 0)) { e.kx += nx * rueck * e.def.rueckstoss; e.kz += nz * rueck * e.def.rueckstoss; }
  if (spieler) e.aggro = 4;
  if (stark && !e.def.boss && !e.def.miniboss && e.zustand === 'ausholen') { e.zustand = 'erholen'; e.t = 0.5; e.warn.visible = false; anzeigeWeg(e); }
  zahl(e.x, e.sprite.scale.y + 0.2, e.z, (klasse === 'krit' ? '✶' : '') + n, klasse);
  if (quelle !== 'zustand') {
    trefferSpritzer(e, nx, nz, stark || klasse === 'krit');
    geraeusch('treffer');
  }
  // Zustände von Waffe, Fähigkeit und Golem
  const status = new Set(opt.status || []);
  if (spieler) {
    ['brennen', 'gift', 'blutung', 'frost'].forEach(k => { if (hatEffekt(k)) status.add(k); });
    if (hatFaehigkeit('giftklingen')) status.add('gift');
    P.mana = Math.min(P.manaMax, P.mana + MANA.proTreffer + (hatEffekt('manaraub') ? 2 : 0));
    if (hatEffekt('lebensraub')) heilen(n * 0.08);
  }
  if (golem && golem.el.langsam) status.add('frost');
  if (golem && golem.el.brand) status.add('brennen');
  status.forEach(s => zustandGeben(e, s));
  if (spieler && hatFaehigkeit('hinrichtung') && !e.def.boss && e.hp > 0 && e.hp < e.maxHp * 0.25) { zahl(e.x, e.sprite.scale.y + 0.6, e.z, TX('Hinrichtung'), 'perfekt'); e.hp = 0; }
  if (e.typ === 'golem' && !e.gerufen && e.hp < e.maxHp * 0.5) {
    e.gerufen = true;
    meldung(TX('Der Golem ruft Verstärkung'), null, 1600);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; gegnerErstellen('kaefer', e.x + Math.cos(a) * 2.2, e.z + Math.sin(a) * 2.2); }
  }
  if (e.hp <= 0) gegnerBesiegt(e);
}
function zustandFarbe(e) {
  if (e.zs.brennen > 0) return 'feuer';
  if (e.zs.gift > 0) return 'gift';
  return 'blut';
}

// Blut bei Lebewesen, Funken und Öl bei Maschinen
function trefferSpritzer(e, nx, nz, stark) {
  const n = stark ? 9 : 5;
  if (e.def.roboter) {
    partikel(e.x, 0.8, e.z, 0xfff0a0, n, 5); partikel(e.x, 0.8, e.z, 0xffffff, 2, 6);
    if (Math.random() < 0.3) fleck(e.x + nx * 0.6, e.z + nz * 0.6, 'oel');
  } else {
    partikelRichtung(e.x, 0.8, e.z, nx, nz, 0xa01828, n, 4);
    partikelRichtung(e.x, 0.8, e.z, nx, nz, 0x6a0a18, 3, 3);
    if (Math.random() < 0.6) fleck(e.x + nx * zz(0.4, 1.2), e.z + nz * zz(0.4, 1.2), 'blut');
  }
}
function partikelRichtung(x, y, z, nx, nz, farbe, n, tempo) {
  if (G.partikel.length > 380) return;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: farbe }));
    s.scale.set(PX * 2, PX * 2, 1); szene.add(s);
    const a = Math.atan2(nz, nx) + zz(-0.8, 0.8) + (nx || nz ? 0 : Math.random() * 6.3), v = zz(0.5, 1.2) * tempo;
    G.partikel.push({ sprite: s, x, y, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: zz(1.5, 4), t: 0, life: zz(0.3, 0.55), blut: farbe === 0xa01828 });
  }
}
// Flecken auf dem Boden: Blutpixel und Ölspritzer. Verschwinden nach einer Weile.
const FLECK_MAT = { blut: new THREE.MeshBasicMaterial({ color: 0x5a0e18, transparent: true, opacity: 0.85, depthWrite: false }), oel: new THREE.MeshBasicMaterial({ color: 0x14101a, transparent: true, opacity: 0.8, depthWrite: false }) };
const fleckGeo = [1, 2, 3].map(g => new THREE.PlaneGeometry(PX * g, PX * (g === 3 ? 2 : g)));
function fleck(x, z, art) {
  if (!G) return;
  const gruppe = new THREE.Group();
  for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
    const m = new THREE.Mesh(fleckGeo[Math.floor(Math.random() * 3)], FLECK_MAT[art]);
    m.rotation.x = -Math.PI / 2;
    m.position.set(Math.round(zz(-4, 4)) * PX, 0, Math.round(zz(-3, 3)) * PX);
    gruppe.add(m);
  }
  gruppe.position.set(Math.round(x / PX) * PX, 0.012, Math.round(z / PX) * PX);
  szene.add(gruppe);
  G.flecken.push({ mesh: gruppe, t: 0 });
  if (G.flecken.length > 140) szene.remove(G.flecken.shift().mesh);
}

// ---------------------------------------------------------------------
// Explosionen, Öl und Feuer
// feindlich: trifft auch Spieler, Verbündete und das Ziel (Tür, Feuer)
// ---------------------------------------------------------------------
function explosion(x, z, radius, schaden, opt) {
  opt = opt || {};
  const ring = bodenFlaeche(ringGeo, 0xffb030, 0.9);
  ring.position.set(x, 0.03, z); ring.scale.setScalar(0.3);
  G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.3, wachsen: radius });
  partikel(x, 0.4, z, 0xe0521c, 18, 6); partikel(x, 0.6, z, 0xffd060, 10, 5); partikel(x, 0.3, z, 0x2a2420, 12, 3);
  for (let i = 0; i < 4; i++) rauchwolke(x + zz(-0.6, 0.6), z + zz(-0.6, 0.6), 0.8);
  wackeln(0.2 + radius * 0.06); geraeusch('explosion');
  for (const e of G.gegner.slice()) {
    if (e === opt.ausser || e.hp <= 0) continue;
    const d = abstand(e, { x, z });
    if (d < radius + e.r) gegnerTreffen(e, Math.round(schaden * (opt.feindlich ? 0.5 : 1)), (e.x - x) / (d || 1), (e.z - z) / (d || 1), 6, true, opt.quelle || 'explosion', null, { status: opt.brand ? ['brennen'] : [], durch: true });
  }
  if (opt.feindlich) {
    for (const ziel of [P, G.tuer, ...G.verbuendete, ...G.tuerme].filter(Boolean)) if (ziel.hp > 0 && abstand(ziel, { x, z }) < radius + (ziel.r || 0.4)) schadenAn(ziel, schaden, x, z);
    perfektPruefen(x, z, radius + 0.4);
  }
  for (const f of G.faesser) if (f.hp > 0 && abstand(f, { x, z }) < radius + f.r) fassTreffen(f, true);
  for (const o of G.oel) if (!o.brennt && Math.hypot(o.x - x, o.z - z) < radius + o.r) oelEntzuenden(o);
}
function rauchwolke(x, z, groesse) {
  if (G.partikel.length > 380) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: Math.random() < 0.5 ? 0x5a5868 : 0x77768e, transparent: true, opacity: 0.75, depthWrite: false }));
  const g = PX * zz(6, 12) * groesse;
  s.scale.set(g, g, 1); szene.add(s);
  G.partikel.push({ sprite: s, x, y: zz(0.3, 1.2), z, vx: zz(-0.4, 0.4), vz: zz(-0.3, 0.3), vy: zz(0.2, 0.6), t: 0, life: zz(0.8, 1.6), rauch: true });
}
const oelGeo = new THREE.CircleGeometry(1, 18);
oelGeo.geteilt = true;
function oelPfuetze(x, z, r, brennt) {
  const mesh = new THREE.Mesh(oelGeo, new THREE.MeshBasicMaterial({ color: 0x1a1420, transparent: true, opacity: 0.85, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.014, z); mesh.scale.set(r, r * 0.8, 1);
  szene.add(mesh);
  const o = { x, z, r, mesh, rest: 30, brennt: 0, tickT: 0 };
  G.oel.push(o);
  if (brennt) oelEntzuenden(o);
  return o;
}
function oelEntzuenden(o) {
  if (o.brennt > 0) return;
  o.brennt = ZUSTAENDE.oel.brandDauer;
  o.mesh.material.color.set(0xe0521c); o.mesh.material.opacity = 0.55;
  zahl(o.x, 1.2, o.z, TX('Flächenbrand!'), 'feuer');
  partikel(o.x, 0.5, o.z, 0xffb030, 14, 4); geraeusch('explosion');
}
function oelAktualisieren(dt) {
  G.oel = G.oel.filter(o => {
    o.rest -= dt;
    for (const e of G.gegner) if (Math.hypot(e.x - o.x, e.z - o.z) < o.r + e.r * 0.5) { if (o.brennt > 0) { if (!(e.zs.brennen > 0)) zustandGeben(e, 'brennen'); } else e.zs.oel = ZUSTAENDE.oel.dauer; }
    if (o.brennt > 0) {
      o.brennt -= dt; o.tickT += dt;
      if (Math.random() < dt * 30) partikel(o.x + zz(-o.r, o.r) * 0.8, 0.3, o.z + zz(-o.r, o.r) * 0.6, Math.random() < 0.5 ? 0xff8a30 : 0xffd060, 1, 1.2);
      o.mesh.material.opacity = 0.4 + Math.sin(G.zeit * 20) * 0.1;
      if (o.tickT > 0.5) {
        o.tickT = 0;
        if (P.hp > 0 && Math.hypot(P.x - o.x, P.z - o.z) < o.r) schadenAn(P, 3, o.x, o.z);
        for (const f of G.faesser) if (f.hp > 0 && Math.hypot(f.x - o.x, f.z - o.z) < o.r + f.r) fassTreffen(f, true);
      }
      if (o.brennt <= 0) { szene.remove(o.mesh); return false; }
    }
    if (o.rest <= 0) { szene.remove(o.mesh); return false; }
    return true;
  });
}
// Ölfässer in der Universität: ein Treffer, und sie laufen aus. Feuer, und sie fliegen in die Luft.
function fassErstellen(x, z) {
  const f = Object.assign(figur(BILD.oelfass, 0.4), { x, z, r: 0.42, hp: 1 });
  stelle(f, x, z);
  G.faesser.push(f);
}
function fassTreffen(f, feuer) {
  if (f.hp <= 0) return;
  f.hp = 0;
  entfernen(f);
  if (feuer) { explosion(f.x, f.z, 1.8, 26, { brand: true, quelle: 'spieler' }); oelPfuetze(f.x, f.z, 1.6, true); }
  else { oelPfuetze(f.x, f.z, 1.7, false); partikel(f.x, 0.5, f.z, 0x1a1420, 10, 3); zahl(f.x, 1.2, f.z, TX('Öl läuft aus'), 'block'); geraeusch('treffer'); }
}

// ---------------------------------------------------------------------
// Elite-Gegner
// ---------------------------------------------------------------------
function eliteWuerfeln(e) {
  if (e.def.boss || e.def.miniboss) return;
  const C = ELITE_CHANCE;
  const chance = Math.min(C.max, C.grund + C.proSieg * (SPIEL.siege || 0) + C.proWelle * Math.max(0, G.welle));
  if (Math.random() > chance) return;
  const moeglich = Object.keys(ELITE).filter(k => ELITE[k].erlaubt.includes(e.typ));
  if (!moeglich.length) return;
  e.elite = moeglich[Math.floor(Math.random() * moeglich.length)];
  e.maxHp = e.hp = Math.round(e.maxHp * C.leben);
  e.eliteRing = bodenFlaeche(ringGeo, new THREE.Color(ELITE[e.elite].farbe).getHex(), 0.8);
  e.eliteRing.scale.setScalar(e.r + 0.3);
  e.extra.push(e.eliteRing);
}

// Verzögerte Ereignisse (z. B. explodierende Elite-Gegner)
function spaeter(t, fn) { G.spaeter.push({ t, fn }); }

// Die Aura von Trommlern und Heulern macht Gegner in der Nähe schneller
function aurenAktualisieren(dt) {
  for (const e of G.gegner) e.buff = Math.max(0, (e.buff || 0) - dt);
  for (const a of G.gegner) {
    if (!a.def.aura || gegnerSteht(a)) continue;
    for (const e of G.gegner) if (e !== a && abstand(a, e) < a.def.aura) e.buff = 0.3;
    a.auraT = (a.auraT || 0) + dt;
    if (a.auraT > 0.9) {
      a.auraT = 0;
      const ring = bodenFlaeche(ringGeo, a.typ === 'heuler' ? 0x9ac0ff : 0xd04040, 0.28);
      ring.position.set(a.x, 0.03, a.z); ring.scale.setScalar(0.5);
      G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.6, wachsen: a.def.aura, deckkraft: 0.28 });
      if (a.typ === 'trommler') geraeusch('trommel');
    }
  }
}

// ---------------------------------------------------------------------
// Laufende Fähigkeiten: Klingensturm, Fallen, Überladung, Rauch, Fokus
// ---------------------------------------------------------------------
function technikenAktualisieren(dt) {
  for (const k of ['q', 'e', 'r']) P.tcd[k] = Math.max(0, P.tcd[k] - dt);
  // Sturmangriff
  if (P.sturm) {
    const s = P.sturm;
    s.t -= dt;
    P.x += s.dx * s.tempo * dt; P.z += s.dz * s.tempo * dt;
    if (Math.random() < 0.8) partikel(P.x, 0.4, P.z, 0xbfe8ff, 2, 1.5);
    for (const e of G.gegner.slice()) if (!s.getroffen.has(e) && abstand(e, P) < e.r + P.r + 0.6) {
      s.getroffen.add(e);
      gegnerTreffen(e, s.schaden, s.dx, s.dz, 9, true, 'spieler', null, { technik: true });
    }
    for (const f of G.faesser) if (f.hp > 0 && abstand(f, P) < f.r + P.r + 0.4) fassTreffen(f, false);
    if (s.t <= 0) P.sturm = null;
  }
  // Klingensturm
  const K = G.klingen;
  if (K) {
    K.t -= dt; K.winkel += dt * 7;
    for (const [e, t] of K.treffer) K.treffer.set(e, t - dt);
    K.sprites.forEach((s, i) => {
      const a = K.winkel + i * Math.PI * 2 / K.sprites.length;
      const x = P.x + Math.cos(a) * K.T.radius, z = P.z + Math.sin(a) * K.T.radius * 0.85;
      s.position.set(x, 0.9, z);
      const tx = -Math.sin(a), tz = Math.cos(a);
      s.material.rotation = -Math.atan2(-tz * Math.sin(NEIGUNG), tx);
      for (const e of G.gegner.slice()) {
        if ((K.treffer.get(e) || 0) > 0 || Math.hypot(e.x - x, e.z - z) > e.r + 0.45) continue;
        K.treffer.set(e, 0.45);
        gegnerTreffen(e, K.schaden, Math.cos(a), Math.sin(a), 2.5, false, 'spieler', null, { status: ['blutung'], technik: true });
      }
      if (Math.random() < dt * 12) partikel(x, 0.9, z, 0x5ff0e0, 1, 0.5);
    });
    if (K.t <= 0) { K.sprites.forEach(s => szene.remove(s)); G.klingen = null; }
  }
  // Sprengfallen
  G.fallen = G.fallen.filter(f => {
    f.scharf -= dt;
    if (f.scharf > 0) return true;
    if (Math.floor(G.zeit * 4) % 2) f.sprite.material.color.set(0xffffff); else f.sprite.material.color.set(0xffa0a0);
    if (!G.gegner.some(e => abstand(e, f) < e.r + 0.5)) return true;
    entfernen(f);
    explosion(f.x, f.z, f.T.radius, spielerSchaden(f.T.schaden) * technikMal(), { quelle: 'spieler' });
    return false;
  });
  if (G.ueberladung > 0) { G.ueberladung -= dt; G.tuerme.forEach(t => { if (Math.random() < dt * 6) partikel(t.x, 1.6, t.z, 0x5ff0e0, 1, 1); }); }
  if (G.rauch > 0) { G.rauch -= dt; if (Math.random() < dt * 8) rauchwolke(P.x + zz(-0.5, 0.5), P.z, 0.6); if (G.rauch <= 0) P.ausDemRauch = false; }
  if (G.fokus) {
    G.fokus.t -= dt;
    if (G.fokus.t <= 0 || G.fokus.e.hp <= 0) fokusEntfernen();
    else { G.fokus.ring.position.set(G.fokus.e.x, 0.03, G.fokus.e.z); G.fokus.ring.scale.setScalar(G.fokus.e.r + 0.35 + Math.sin(G.zeit * 8) * 0.05); }
  }
  G.spaeter = G.spaeter.filter(s => { s.t -= dt; if (s.t <= 0) { s.fn(); return false; } return true; });
}

// Weiße Ziellinie für den Dolchwurf
function ziellinieAktualisieren() {
  if (!G.ziellinie) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false });
    const mesh = new THREE.Mesh(flaecheGeo, mat); mesh.rotation.x = -Math.PI / 2;
    const gruppe = new THREE.Group(); gruppe.add(mesh); szene.add(gruppe);
    G.ziellinie = { gruppe, mesh, mat };
  }
  const L = G.ziellinie;
  L.gruppe.visible = !!P.zielen && P.hp > 0;
  if (!P.zielen) return;
  const T = TECHNIKEN[P.klasse][P.zielen], a = zielWinkel();
  L.mesh.scale.set(T.reichweite, PX * 2, 1); L.mesh.position.x = T.reichweite / 2;
  L.gruppe.position.set(P.x, 0.04, P.z); L.gruppe.rotation.y = -a;
  L.mat.opacity = 0.45 + Math.sin(G.zeit * 16) * 0.2;
  P.blick = Math.cos(a) >= 0 ? 1 : -1;
}

// Fähigkeiten-Leiste und Mana im HUD
function technikHudAktualisieren() {
  document.getElementById('manaFill').style.width = (P.mana / P.manaMax * 100) + '%';
  hudText('manaText', TX`${Math.floor(P.mana)} / ${P.manaMax} Mana`);
  for (const k of ['q', 'e', 'r']) {
    const T = TECHNIKEN[P.klasse][k], anteil = P.tcd[k] / T.abklingzeit;
    document.querySelectorAll(`[data-technik="${k}"]`).forEach(el => {
      el.style.setProperty('--cd', anteil.toFixed(3));
      el.classList.toggle('leer', P.mana < T.mana);
      el.classList.toggle('bereit', anteil <= 0 && P.mana >= T.mana);
      const z = el.querySelector('.tk-cd'); if (z) z.textContent = P.tcd[k] > 0 ? Math.ceil(P.tcd[k]) : '';
    });
  }
}
function technikLeisteEinrichten() {
  const leiste = document.getElementById('technikLeiste');
  leiste.innerHTML = ['q', 'e', 'r'].map(k => {
    const T = TECHNIKEN[SPIEL.klasse][k];
    return TX`<div class="tk" data-technik="${k}" title="${esc(T.name + ': ' + T.text)}"><kbd>${k.toUpperCase()}</kbd><b>${esc(T.name)}</b><small>${T.mana} Mana</small><span class="tk-cd"></span></div>`;
  }).join('');
  leiste.hidden = istTouch;
  klappenEinrichten();
  ['q', 'e', 'r'].forEach(k => {
    const b = document.querySelector(`#tbtns [data-act="${k}"]`);
    // Lange Namen trennen wir an der Wortfuge, nicht mitten im Wort („Riesen-golem“ statt „Riesengole-m“)
    const kurz = esc(TECHNIKEN[SPIEL.klasse][k].name).replace(/^(Sturm|Dolch|Klingen|Schock|Riesen|Spreng|Über|Feuer|Wurf|Rauch|Köder)(?=\p{Ll}{3})/u, '$1&shy;');
    b.innerHTML = `<span>${kurz}</span><span class="tk-cd"></span>`;
    b.dataset.technik = k;
  });
}

// ---------------------------------------------------------------------
// Kleine Anzeigen über Figuren: Elite-Name, Zustände, Lebensbalken, Restzeit
// ---------------------------------------------------------------------
const ZUSTAND_SYMBOLE = ['brennen', 'gift', 'blutung', 'frost', 'schock', 'oel'];
function infoEl(o) {
  if (!o.info) { o.info = document.createElement('div'); o.info.className = 'figur-info'; document.getElementById('fx').append(o.info); }
  return o.info;
}
function infoWeg(o) { if (o && o.info) { o.info.remove(); o.info = null; } }
function infoStellen(el, x, y, z) { const p = weltZuBildschirm(x, y, z); el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; }

function gegnerInfo(e, oben) {
  const z = e.zs;
  const st = ZUSTAND_SYMBOLE.filter(k => k === 'frost' ? z.frost > 0 || z.gefroren > 0 : k === 'schock' ? z.schock > 0 || z.betaeubt > 0 : z[k] > 0);
  if (!e.elite && !st.length) { if (e.info) e.info.hidden = true; return; }
  const el = infoEl(e), key = (e.elite || '') + st.join() + (z.giftStapel || '');
  el.hidden = false;
  if (el.dataset.k !== key) {
    el.dataset.k = key;
    el.innerHTML = (e.elite ? `<span class="elite-name" style="color:${ELITE[e.elite].farbe}">${esc(ELITE[e.elite].name)}</span>` : '') +
      (st.length ? `<span class="zst">${st.map(k => `<img src="${symbolUrl(BILD.zustand[k])}" alt="${k}">${k === 'gift' && z.giftStapel > 1 ? '<b>' + z.giftStapel + '</b>' : ''}`).join('')}</span>` : '');
  }
  infoStellen(el, e.x, oben + 0.5, e.z);
}
// Verbündete und Bauwerke: Lebensbalken, bei Golems, Puppe und Feuerballiste die Restzeit in Sekunden
function freundInfo(o, oben) {
  if (o.art === 'nachbild') return;
  const el = infoEl(o);
  const rest = o.hinweis !== undefined ? o.hinweis : o.art === 'begleiter' ? o.name : o.rest !== undefined && o.art !== 'soldat' ? Math.ceil(o.rest) + 's' : '';
  const anteil = Math.max(0, Math.min(1, o.hp / o.maxHp));
  if (!el.firstChild) el.innerHTML = '<div class="mini-bar"><i></i></div><small></small>';
  el.firstChild.firstChild.style.width = (anteil * 100) + '%';
  el.firstChild.classList.toggle('niedrig', anteil < 0.35);
  if (el.lastChild.textContent !== rest) el.lastChild.textContent = rest;
  infoStellen(el, o.x, oben + 0.25, o.z);
}

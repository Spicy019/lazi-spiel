// =====================================================================
// DORF: Gebäude bauen, Beutel verwalten, zur Mission aufbrechen.
// =====================================================================

const DORF_RASTER = { x0: -34, z0: -22, breite: 68, tiefe: 44 }; // bebaubare Fläche in Feldern
// Die Dorfstraße: schlängelt sich von Norden nach Süden, dazu ein Abzweig nach Osten und Westen
const strasseX = z => Math.sin(z * 0.15) * 4.8 - 0.8;
const strasseZ = x => 9 + Math.sin(x * 0.165) * 2.6;
function aufStrasse(x, z) { return Math.abs(x - strasseX(z)) < 1.9 || (Math.abs(z - strasseZ(x)) < 1.7); }
// Bodenart im Dorf: Wiese, Waldrand außen, Dorfplatz und Straße aus Erde
function dorfBodenArt(x, z) {
  const R = DORF_RASTER;
  const wob = Math.sin(x * 0.4) * 1.2 + Math.cos(z * 0.45) * 1.2;
  const strasse = Math.abs(x - strasseX(z)) < 1.9 + wob * 0.1 || (Math.abs(z - strasseZ(x)) < 1.7);
  if (x < R.x0 - 1.5 + wob || x > R.x0 + R.breite + 1.5 + wob || z < R.z0 - 1.5 + wob || z > R.z0 + R.tiefe + 1.5 + wob) {
    if (Math.abs(x - strasseX(z)) < 2.2 && z > 0) return 'erde';
    return 'wald';
  }
  if (Math.hypot(x, z * 1.2) < 6 + wob * 0.3) return 'erde';
  if (strasse) return 'erde';
  return 'gras';
}
const Dorf = {
  szene: null, kx: 0, kz: 0.5, bau: null, auswahl: null, zoom: DORF_ZOOM.start,
  bauten: [], leute: [], rauch: [], zeit: 0,
};

function dorfAufbauen() {
  // Beim Laden eines anderen Spielstands wird das Dorf neu aufgebaut
  Dorf.bauten = []; Dorf.leute = []; Dorf.rauch = []; Dorf.bau = null; Dorf.hund = null;
  const alt = Dorf.szene;
  szene = Dorf.szene = new THREE.Scene();
  szeneEntsorgen(alt);     // Abbauen und Rückgängig bauen das Dorf jedes Mal neu auf
  szene.background = new THREE.Color('#0c100e');

  // Boden: Wiese, Waldrand außen, ein Dorfplatz aus Erde und ein Weg nach Süden
  const R = DORF_RASTER;
  // Die leere Fläche wird nur einmal gemalt: Rückgängig baut das Dorf jedes Mal neu auf. Wege kommen danach obendrauf.
  if (!Dorf.boden) {
    const boden = malBoden(168, 16, dorfBodenArt, {
      gras: ['#3e5a34', '#46643a', '#36502e', '#52703f'],
      wald: ['#1e3022', '#233826', '#1a2a1e', '#2a4028'],
      erde: ['#6a5038', '#76583e', '#5e4632', '#846446'],
    }, 3);
    const istGras = (px, py) => boden.artBei(px, py) === 'gras';
    streuGras(boden, istGras, 8800, [['#2e4a2a', '#5a7a40'], ['#36522e', '#66864a']]);
    streuBlumen(boden, istGras, 560);
    streuDetails(boden, (px, py) => boden.artBei(px, py) !== 'wald', 7200);
    boden.textur = textur(boden.c); boden.textur.geteilt = true;
    Dorf.boden = boden;
    Dorf.bodenLeer = document.createElement('canvas');
    Dorf.bodenLeer.width = boden.c.width; Dorf.bodenLeer.height = boden.c.height;
    Dorf.bodenLeer.getContext('2d').drawImage(boden.c, 0, 0);
  } else { Dorf.boden.g.drawImage(Dorf.bodenLeer, 0, 0); Dorf.boden.textur.needsUpdate = true; }
  Dorf.bodenMesh = bodenMesh(Dorf.boden, 168);
  randHintergrund('dorf');

  // Baum-Gitter (nur im Baumodus sichtbar)
  const gc = document.createElement('canvas'); gc.width = R.breite * 16; gc.height = R.tiefe * 16;
  const gg = gc.getContext('2d');
  gg.fillStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i <= R.breite; i++) gg.fillRect(Math.min(i * 16, gc.width - 1), 0, 1, gc.height);
  for (let j = 0; j <= R.tiefe; j++) gg.fillRect(0, Math.min(j * 16, gc.height - 1), gc.width, 1);
  Dorf.gitter = new THREE.Mesh(new THREE.PlaneGeometry(R.breite, R.tiefe), new THREE.MeshBasicMaterial({ map: textur(gc), transparent: true, depthWrite: false }));
  Dorf.gitter.rotation.x = -Math.PI / 2; Dorf.gitter.position.set(R.x0 + R.breite / 2, 0.015, R.z0 + R.tiefe / 2);
  Dorf.gitter.visible = false;
  szene.add(Dorf.gitter);

  // Wald rund um das Dorf
  const r = zufall(21);
  for (let i = 0; i < 460; i++) {
    const x = -72 + r() * 144, z = -48 + r() * 92;
    const innen = x > R.x0 - 2 && x < R.x0 + R.breite + 2 && z > R.z0 - 2 && z < R.z0 + R.tiefe + 2;
    if (innen) continue;
    if (Math.abs(x - strasseX(z)) < 4 && z > 0) continue; // Straße nach Süden frei lassen
    const b = r() < 0.5 ? BILD.tanne[i % 3] : BILD.laubbaum[i % 4];
    const t = figur(b, 1); stelle(t, x, z);
  }
  for (let i = 0; i < 28; i++) {
    const seite = i % 4, t = r();
    const x = seite < 2 ? R.x0 + t * R.breite : (seite === 2 ? R.x0 - 0.8 : R.x0 + R.breite + 0.8);
    const z = seite === 0 ? R.z0 - 0.8 : seite === 1 ? R.z0 + R.tiefe + 0.6 : R.z0 + t * R.tiefe;
    if (aufStrasse(x, z)) continue;
    const bu = figur(BILD.busch[i % 6], 0.6); stelle(bu, x, z);
  }

  // Auswahl- und Bauflächen
  Dorf.fussMat = new THREE.MeshBasicMaterial({ color: 0x7ad37a, transparent: true, opacity: 0.35, depthWrite: false });
  Dorf.fuss = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), Dorf.fussMat);
  Dorf.fuss.rotation.x = -Math.PI / 2; Dorf.fuss.position.y = 0.02; Dorf.fuss.visible = false;
  szene.add(Dorf.fuss);
  Dorf.markierung = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0.25, depthWrite: false }));
  Dorf.markierung.rotation.x = -Math.PI / 2; Dorf.markierung.position.y = 0.018; Dorf.markierung.visible = false;
  szene.add(Dorf.markierung);

  statueAktualisieren();
  Dorf.aufgebaut = false;
  SPIEL.gebaeude.forEach(gebaeudeAufstellen);
  Dorf.aufgebaut = true;
  Dorf.mauerTeile = []; dorfMauerAufstellen();
  symboleEinsetzen();
  leuteAnpassen();
  bauLeisteBauen();
  dorflebenAufbauen();
  if (!Dorf.eingabeBereit) { dorfEingabe(); Dorf.eingabeBereit = true; }
}

function dorfBild(typ, i) { return neuerBau(typ, i) || BILD.dorfbau[typ][i]; }
function gebaeudeBild(b) {
  const bilder = b.typ === 'wohnhaus' && b.stufe > 1 ? BILD.dorfbau.steinhaus : BILD.dorfbau[b.typ], art = GEBAEUDE[b.typ].bild;
  const i = art === 'stufe' ? Math.min(bilder.length, b.stufe || 1) - 1 : art === 'strom' ? (stromAn() ? 1 : 0) : b.typ === 'wohnhaus' || b.typ === 'blumenbeet' ? b.id % bilder.length : 0;
  return b.typ === 'wohnhaus' ? (b.stufe > 1 && neuerBau('steinhaus', 0)) || bilder[i] : dorfBild(b.typ, i);
}
// Die Statue zeigt immer die Klasse, die du spielst
function statueAktualisieren() {
  if (!SPIEL.klasse || statueAktualisieren.klasse === SPIEL.klasse) return;
  statueAktualisieren.klasse = SPIEL.klasse;
  const held = BILD.held[bildKlasse(SPIEL.klasse)], waffe = Object.keys(held)[0];
  if (neueGrafik()) { const k = bildKlasse(SPIEL.klasse), q = NEUE_GRAFIK.FIGUREN[k === 'ritter' ? 'held' : k].vorne(1).bild('tag'), c = document.createElement('canvas'); c.width = 140; c.height = 210; const g = c.getContext('2d'); g.filter = 'grayscale(1) brightness(1.15) contrast(.9)'; g.drawImage(q, 28, 12); g.filter = 'none'; g.fillStyle = '#54545e'; g.fillRect(24, 170, 92, 18); g.fillStyle = '#3c3c46'; g.fillRect(16, 188, 108, 20); g.fillStyle = '#6c6c76'; g.fillRect(24, 170, 92, 3); const b = bild(c); b.w *= NEU_BAU_MASS; b.h *= NEU_BAU_MASS; BILD.dorfbau.statue = [b]; return; }
  BILD.dorfbau.statue = [bild(malStatue(held[waffe].stand.quelle))];
}
// Wege werden direkt in den Boden gemalt: Pflastersteine auf festgetretener Erde
function istWeg(gx, gz) { return SPIEL.gebaeude.some(b => b.typ === 'weg' && b.gx === gx && b.gz === gz); }
// Grenzt in Richtung (dx, dz) Erdboden an, also die Dorfstraße oder der Dorfplatz?
// Geprüft wird ein schmaler Streifen gleich hinter der Feldkante, damit auch die geschwungenen Ränder zählen.
function erdeDaneben(gx, gz, dx, dz) {
  const proben = dx && dz ? [[0.5 + dx * 0.65, 0.5 + dz * 0.65]]
    : dx ? [[0.5 + dx * 0.65, 0.2], [0.5 + dx * 0.65, 0.5], [0.5 + dx * 0.65, 0.8]]
    : [[0.2, 0.5 + dz * 0.65], [0.5, 0.5 + dz * 0.65], [0.8, 0.5 + dz * 0.65]];
  return proben.filter(([x, z]) => dorfBodenArt(gx + x, gz + z) === 'erde').length >= Math.ceil(proben.length / 2);
}
// Ein Wegfeld: Ränder bleiben Gras, außer dort, wo ein Nachbarweg, die Dorfstraße oder der Dorfplatz anschließt.
// So laufen gerade Stücke, Kurven und Kreuzungen sauber ineinander.
function wegMalen(gx, gz, nachbarnAuch) {
  const { g, toPx } = Dorf.boden, x0 = toPx(gx), y0 = toPx(gz), r = zufall(gx * 31 + gz * 17 + 400);
  const an = (dx, dz) => istWeg(gx + dx, gz + dz) || erdeDaneben(gx, gz, dx, dz);
  const N = an(0, -1), S = an(0, 1), W = an(-1, 0), O = an(1, 0), R = 3;
  const l = W ? 0 : R, rr = O ? 16 : 16 - R, o = N ? 0 : R, u = S ? 16 : 16 - R;
  g.fillStyle = '#5e4632'; g.fillRect(x0 + l, y0 + o, rr - l, u - o);
  // Diagonale Anschlüsse: die Ecke zum schrägen Nachbarn auffüllen
  [[-1, -1, 0, 0], [1, -1, 16 - R - 2, 0], [-1, 1, 0, 16 - R - 2], [1, 1, 16 - R - 2, 16 - R - 2]].forEach(([dx, dz, ex, ez]) => {
    if (an(dx, dz)) { g.fillRect(x0 + ex, y0 + ez, R + 2, R + 2); }
  });
  // Weiche Kante zum Gras
  g.fillStyle = '#4e3a28';
  if (!N) g.fillRect(x0 + l, y0 + o, rr - l, 1);
  if (!S) g.fillRect(x0 + l, y0 + u - 1, rr - l, 1);
  if (!W) g.fillRect(x0 + l, y0 + o, 1, u - o);
  if (!O) g.fillRect(x0 + rr - 1, y0 + o, 1, u - o);
  for (let i = 0; i < 12; i++) {
    const w = 2 + Math.floor(r() * 3);
    const x = x0 + l + 1 + Math.floor(r() * Math.max(1, rr - l - w - 2)), y = y0 + o + 1 + Math.floor(r() * Math.max(1, u - o - 4));
    g.fillStyle = '#1d1328'; g.fillRect(x, y + 1, w, 2);
    g.fillStyle = r() < 0.5 ? '#8a8898' : '#77768e'; g.fillRect(x, y, w, 2);
    g.fillStyle = '#a9a8bc'; g.fillRect(x, y, 1, 1);
  }
  if (nachbarnAuch) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && istWeg(gx + dx, gz + dz)) wegMalen(gx + dx, gz + dz, false);
  Dorf.bodenMesh.material.map.needsUpdate = true;
}
function gebaeudeAufstellen(b) {
  const d = GEBAEUDE[b.typ];
  if (b.typ === 'weg') { wegMalen(b.gx, b.gz, Dorf.aufgebaut); return; }
  const o = figur(gebaeudeBild(b), 0);
  const cx = b.gx + d.groesse[0] / 2, vorne = b.gz + d.groesse[1];
  stelle(o, cx, vorne - 0.35);
  o.sprite.userData.bau = b;
  Dorf.bauten.push({ b, o, cx, cz: b.gz + d.groesse[1] / 2 });
}

// Warum hier nicht gebaut werden kann, oder '' wenn der Platz frei ist
function belegtGrund(gx, gz, w, d, typ) {
  const R = DORF_RASTER;
  if (gx < R.x0 || gz < R.z0 || gx + w > R.x0 + R.breite || gz + d > R.z0 + R.tiefe) return TX('Das liegt außerhalb des Dorfes.');
  // Auf die Dorfstraße darf nichts gebaut werden. Nur Wege dürfen sie pflastern.
  if (typ !== 'weg') for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (aufStrasse(gx + i + 0.5, gz + j + 0.5)) return TX('Auf der Dorfstraße kann nicht gebaut werden. Nur Wege dürfen darauf liegen.');
  const da = SPIEL.gebaeude.find(b => {
    const g = GEBAEUDE[b.typ].groesse;
    return gx < b.gx + g[0] && gx + w > b.gx && gz < b.gz + g[1] && gz + d > b.gz;
  });
  return da ? TX`Hier steht schon: ${gebaeudeName(da)}` : '';
}
function belegt(gx, gz, w, d, typ) { return !!belegtGrund(gx, gz, w, d, typ); }

// ---------- Dorfbewohner, die herumlaufen ----------
// Neue Grafik: Wer aus der Geschichte schon da ist, läuft durchs Dorf, die übrigen Plätze füllen Bewohner ohne Namen.
// Wer im Wirtshaus redet, ist erst zu sehen, wenn es eins gibt. Der Fuchs lässt sich nie blicken, Hanne bleibt bei den Rostbrechern.
const LEUTE_REIHE = ['mara', 'ebert', 'rudi', 'lotte', 'kalle', 'gernot', 'harnstedt', 'ilse', 'junge', 'grimbart', 'wenzel', 'jupp', 'bodo', 'hilde', 'piet', 'anselm'];
const LEUTE_WIRTSHAUS = ['rudi', 'lotte', 'kalle', 'gernot', 'harnstedt', 'ilse'], LEUTE_OHNE_NAMEN = ['bauer', 'magd', 'bergmann', 'flickerin'];
function leuteMitNamen() {
  if (!regel('figuren')) return [];
  const wirtshaus = SPIEL.gebaeude.some(b => b.typ === 'wirtshaus');
  return LEUTE_REIHE.filter(w => {
    if (LEUTE_WIRTSHAUS.includes(w)) return wirtshaus;
    if (w === 'junge') return (SPIEL.beziehungen.birkenhain || 0) > 0;   // Erst wenn man ihm geholfen hat, nicht schon wenn man vom Ort gehört hat
    if (w === 'anselm') return SPIEL.figuren.includes('anselm') && figurDa('anselm');
    return figurDa(w);
  });
}
// Je Bild höchstens eine neue Figur: Sie zu malen dauert einen Moment, und das Dorf soll dabei nicht stocken
function leuteNachziehen() {
  const soll = Math.min(SPIEL.einwohner, 24), neu = (wer, p) => { const v = neuePersonWeiter(wer); if (!v) return;
    if (p) { p.wer = wer; p.v = v; return; }
    const o = figur(v.vorne[4], 0.45 * NEUE_GRAFIK.LEUTE_FIGUREN[wer].mass);
    o.sprite.center.y = 12 / 128;   // Das Bild hat unten Platz für den vorderen Fuß
    Object.assign(o, { v, wer, x: zz(-3, 3), z: zz(1.6, 4), zx: 0, zz: 0, warte: zz(0, 2), blick: 1, schritt: 0 });
    stelle(o, o.x, o.z); Dorf.leute.push(o); };
  for (const w of leuteMitNamen().slice(0, soll)) {
    if (Dorf.leute.some(p => p.wer === w)) continue;
    const frei = Dorf.leute.find(p => LEUTE_OHNE_NAMEN.includes(p.wer));
    if (frei || Dorf.leute.length < soll) { neu(w, frei); return; }
  }
  if (Dorf.leute.length < soll) neu(LEUTE_OHNE_NAMEN[Dorf.leute.length % LEUTE_OHNE_NAMEN.length]);
}
function leuteZeigen(p, geht) {
  let b;
  if (!p.v) { b = p.bilder[geht ? Math.floor(p.schritt * 6) % 2 : 0]; zeige(p, b, p.blick); }
  else {
    p.bewegt = geht;
    const a = neuAnsicht(p);
    b = p.v[a][geht ? Math.floor(p.schritt * 5.4 / NEUE_GRAFIK.LEUTE_FIGUREN[p.wer].mass) % 4 : 4];   // Kleine Leute machen mehr Schritte
    zeige(p, b, neuBlick(p));
  }
  leuteAtmen(p, b, !geht);
}
// Wer steht, atmet: Die Figur wird im eigenen Takt um höchstens einen Bildpunkt größer. Wer geht, hat die volle Größe.
function leuteAtmen(o, b, steht) {
  if (o.atemPhase === undefined) o.atemPhase = Math.random() * 6.28;
  const plus = steht ? 0.5 + 0.5 * Math.sin(performance.now() / 1000 * 2.4 + o.atemPhase) : 0;
  o.sprite.scale.y = (b.h + plus * Math.max(1, b.h / 40)) * PX;
}
function leuteAnpassen() {
  if (neueGrafik()) return;
  const soll = Math.min(SPIEL.einwohner, 18);
  while (Dorf.leute.length < soll) {
    const i = Dorf.leute.length;
    const bilder = BILD.bewohner[i % BILD.bewohner.length];
    const o = figur(bilder[0], 0.3);
    Object.assign(o, { bilder, x: zz(-3, 3), z: zz(1.6, 4), zx: 0, zz: 0, warte: zz(0, 2), blick: 1, schritt: 0 });
    stelle(o, o.x, o.z);
    Dorf.leute.push(o);
  }
}
function leuteBewegen(dt) {
  if (neueGrafik()) leuteNachziehen();
  const nacht = istNacht();
  for (const p of Dorf.leute) {
    if (p.warte > 0) {
      p.warte -= dt;
      // Im Stehen schaut man sich ab und zu um
      p.schau = (p.schau === undefined ? zz(1.5, 4) : p.schau) - dt;
      if (p.schau <= 0) { p.schau = zz(1.5, 4); if (Math.random() < 0.6) p.blick = -p.blick; }
      // Wer nachts zu Hause ist, bleibt drinnen bis zum Morgen
      if (p.drinnen) { if (!nacht) { p.drinnen = false; p.sprite.visible = true; if (p.shadow) p.shadow.visible = true; p.warte = 0; } else continue; }
      if (p.warte <= 0) {
        const ziel = leuteZiel(p);
        p.zielBau = ziel;
        const insHaus = nacht && ziel.b.typ === 'wohnhaus', breit = insHaus ? 0.3 : 2.4;   // Wer heimgeht, verschwindet an der Tür, nicht daneben
        p.zx = ziel.cx + zz(-breit, breit); p.zz = ziel.b.gz + GEBAEUDE[ziel.b.typ].groesse[1] + zz(0.3, insHaus ? 0.5 : p.v ? 2.2 : 1);
        // Steht ein Haus auf dem geraden Weg, erst zur Seite gehen, statt hindurch
        p.gerade = !Dorf.bauten.some(q => { const g = GEBAEUDE[q.b.typ].groesse; for (let t = 0; t <= 1; t += 0.08) { const x = p.x + (p.zx - p.x) * t, z = p.z + (p.zz - p.z) * t; if (x > q.b.gx && x < q.b.gx + g[0] && z > q.b.gz && z < q.b.gz + g[1]) return true; } return false; });
        p.erstX = Dorf.bauten.some(q => { const g = GEBAEUDE[q.b.typ].groesse, z0 = Math.min(p.z, p.zz), z1 = Math.max(p.z, p.zz); return p.x > q.b.gx && p.x < q.b.gx + g[0] && z1 > q.b.gz && z0 < q.b.gz + g[1]; });
      }
      leuteZeigen(p, false);
      continue;
    }
    const dx = p.zx - p.x, dz = p.zz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.1) {
      p.warte = zz(1, 4) * (nacht ? 2 : 1);
      if (nacht && p.zielBau && p.zielBau.b.typ === 'wohnhaus') { p.drinnen = true; p.sprite.visible = false; if (p.shadow) p.shadow.visible = false; p.warte = 3; }
      continue;
    }
    if (p.v) {
      // Frei: direkt schräg. Steht ein Haus im Weg: erst vor oder zurück, dann zur Seite
      const s = 1.7 * dt;
      if (p.gerade) { const ez = dz / 0.61, l = Math.hypot(dx, ez) || 1; p.x += dx / l * Math.min(s, l); p.z += ez / l * Math.min(s, l) * 0.61; if (Math.abs(dx) > 0.05) p.blick = dx >= 0 ? 1 : -1; }
      else if (Math.abs(dz) > 0.1 && !(p.erstX && Math.abs(dx) > 0.1)) p.z += Math.sign(dz) * Math.min(s * 0.61, Math.abs(dz));
      else { p.x += Math.sign(dx) * Math.min(s, Math.abs(dx)); p.blick = dx >= 0 ? 1 : -1; }
    } else { p.x += dx / d * 2 * dt; p.z += dz / d * 2 * dt; p.blick = dx >= 0 ? 1 : -1; }
    p.schritt += dt;
    leuteZeigen(p, true);
    stelle(p, p.x, p.z);
  }
}

// ---------- Rauch aus Schornsteinen ----------
function rauchAufsteigen(dt) {
  Dorf.zeit += dt;
  if (Math.random() < dt * 3) {
    const kohle = dorfWerte().kohleBedarf > 0 && SPIEL.kohleOk;
    const kandidaten = Dorf.bauten.filter(x => x.b.typ !== 'wohnhaus' || kohle).filter(x => (neueGrafik() ? ['baeckerei', 'holzfaeller', 'kaserne', 'archiv', 'labor', 'rathaus'] : []).concat('schmiede', 'wohnhaus', 'koehlerei', 'koehlerei', 'koehlerei', 'wirtshaus').includes(x.b.typ));
    if (kandidaten.length) {
      const k = kandidaten[Math.floor(Math.random() * kandidaten.length)];
      const schmiede = k.b.typ === 'schmiede' || k.b.typ === 'koehlerei';
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: schmiede ? 0x6a6478 : 0xb0a8b8, transparent: true, opacity: 0.8, depthWrite: false }));
      const groesse = PX * (schmiede ? 7 : 5);
      s.scale.set(groesse, groesse, 1);
      const x = k.cx + (k.b.typ === 'koehlerei' ? zz(-1.2, 0.4) : k.b.typ === 'wirtshaus' ? 2.0 : schmiede ? 2.0 : 0.6), y = k.b.typ === 'koehlerei' ? 2.8 : k.b.typ === 'wirtshaus' ? 5.6 : schmiede ? 5.2 : 4.4;
      s.position.set(x, y, k.b.gz + GEBAEUDE[k.b.typ].groesse[1] - 0.3);
      if (neueGrafik()) { const r = NEU_RAUCH[k.b.typ === 'wohnhaus' && (k.b.stufe || 1) > 1 ? 'steinhaus' : k.b.typ]; if (r) { s.position.x = k.cx + r[0]; s.position.y = 1.742 * r[1] + 0.07; } }
      szene.add(s);
      Dorf.rauch.push({ s, t: 0, life: 2.2 });
    }
  }
  Dorf.rauch = Dorf.rauch.filter(r => {
    r.t += dt;
    if (r.t > r.life) { szene.remove(r.s); r.s.material.dispose(); return false; }
    r.s.position.y += dt * 0.6; r.s.position.x += dt * 0.25;
    r.s.material.opacity = 0.8 * (1 - r.t / r.life);
    return true;
  });
  // Feuer flackern lassen
  const f = Math.floor(Dorf.zeit * 7) % 2;
  for (const x of Dorf.bauten) {
    if (x.b.typ === 'lagerfeuer') { zeige(x.o, neueGrafik() ? neuerBau('lagerfeuer', Math.floor(Dorf.zeit * 12) % 12) : BILD.dorfbau.lagerfeuer[f], 1); if (neueGrafik()) feuerLeben(x.cx, x.b.gz + GEBAEUDE.lagerfeuer.groesse[1] - 0.35, dt, 1); }
    if (x.b.typ === 'schmiede') zeige(x.o, dorfBild('schmiede', Math.floor(Dorf.zeit * 3) % 2), 1);
    if (x.b.typ === 'werkstatt') zeige(x.o, dorfBild('werkstatt', Math.floor(Dorf.zeit * 1.5) % 2), 1);
    if (x.b.typ === 'koehlerei') zeige(x.o, dorfBild('koehlerei', Math.floor(Dorf.zeit * 2) % 2), 1);
    if (x.b.typ === 'wirtshaus') zeige(x.o, dorfBild('wirtshaus', Math.floor(Dorf.zeit * 1.3) % 2), 1);
    if (x.b.typ === 'labor') zeige(x.o, dorfBild('labor', Math.floor(Dorf.zeit * 1.1) % 2), 1);
    if (x.b.typ === 'funkturm') zeige(x.o, dorfBild('funkturm', stromAn() ? Math.floor(Dorf.zeit * 1.5) % 2 : 0), 1);
    if (x.b.typ === 'verbundterminal') zeige(x.o, dorfBild('verbundterminal', stromAn() ? 1 + Math.floor(Dorf.zeit * 1.2) % 2 : 0), 1);
    // Neue Gebäude: Stromgebäude flackern mit Strom, die Bäckerei raucht (nur wenn der Ofen brennt)
    const art = GEBAEUDE[x.b.typ].bild, bl = BILD.dorfbau[x.b.typ];
    if (art === 'strom') zeige(x.o, dorfBild(x.b.typ, stromAn() ? 1 + (bl.length > 2 ? Math.floor(Dorf.zeit * 1.4) % (bl.length - 1) : 0) : 0), 1);
    if (art === 'anim') zeige(x.o, dorfBild(x.b.typ, baeckereiAktiv() ? Math.floor(Dorf.zeit * 1.5) % bl.length : 0), 1);
  }
}

// ---------- Oberfläche ----------
// Für die Meldung beim Antippen: alles, was fehlt, mit Mengen
function bauGrundLang(typ) {
  const d = GEBAEUDE[typ], fehlt = Object.keys(d.kosten).filter(r => (SPIEL[r] || 0) < d.kosten[r]);
  if (d.epoche > SPIEL.epoche || (d.max && anzahlGebaeude(typ) >= d.max) || !fehlt.length) return bauGrund(typ);
  return TX`Es fehlen: ${fehlt.map(r => `${d.kosten[r] - (SPIEL[r] || 0)} ${ROHSTOFF_NAME[r]}`).join(', ')}`;
}
function bauGrund(typ) {
  const d = GEBAEUDE[typ], w = dorfWerte();
  if (d.epoche > SPIEL.epoche) return TX`Wird erst in Epoche ${d.epoche + 1} freigeschaltet`;
  if (d.max && anzahlGebaeude(typ) >= d.max) return TX('Schon gebaut');
  const fehlt = Object.keys(d.kosten).find(r => (SPIEL[r] || 0) < d.kosten[r]);
  if (fehlt) return TX`Zu wenig ${ROHSTOFF_NAME[fehlt]}`;
  if (d.arbeiter > w.frei) return TX`Braucht ${d.arbeiter} freie Arbeiter`;
  return '';
}
// Kann ein Gebäude ausgebaut werden? Gibt die nächste Stufe und einen Grund zurück, falls nicht.
function ausbauInfo(b) {
  const st = GEBAEUDE[b.typ].stufen;
  let naechste = st[b.stufe || 1];
  if (!naechste) return null;
  const k = ausbauKosten(naechste.kosten);
  naechste = Object.assign({}, naechste, { kosten: k });
  let grund = '';
  if (naechste.epoche > SPIEL.epoche) grund = TX`Ab Epoche ${naechste.epoche + 1}`;
  else { const fehlt = Object.keys(naechste.kosten).find(r => (SPIEL[r] || 0) < naechste.kosten[r]); if (fehlt) grund = TX`Zu wenig ${ROHSTOFF_NAME[fehlt]}`; }
  return { stufe: naechste, grund };
}

let bauReiter = 'stadt';
function bauLeisteBauen() {
  const leiste = document.getElementById('bauLeiste');
  leiste.textContent = '';
  const reiter = document.getElementById('bauReiter');
  reiter.innerHTML = Object.keys(KATEGORIEN).map(k => `<button type="button" class="reiter${k === bauReiter ? ' an' : ''}" data-k="${k}" aria-pressed="${k === bauReiter}">${esc(KATEGORIEN[k].name)}</button>`).join('');
  const zu = document.getElementById('bauBereich').classList.contains('zu');
  reiter.insertAdjacentHTML('afterbegin', `<button type="button" class="reiter klappe" data-klappe="1" aria-expanded="${!zu}" aria-label="${zu ? TX('Bauleiste öffnen') : TX('Bauleiste einklappen')}">${zu ? TX('▲ Bauen') : '▼'}</button>`);
  reiter.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { bauReiter = b.dataset.k; document.getElementById('bauBereich').classList.remove('zu'); geraeusch('klick'); bauLeisteBauen(); }));
  reiter.querySelector('[data-klappe]').addEventListener('click', () => { document.getElementById('bauBereich').classList.toggle('zu'); geraeusch('klick'); bauLeisteBauen(); });
  if (!zu) {
    reiter.insertAdjacentHTML('beforeend', `<button type="button" class="reiter werkzeug" data-rueck="1" title="${TX('Letzten Bau zurücknehmen')}">${TX('↶ Zurück')}</button><button type="button" class="reiter werkzeug" data-abriss="1" title="${TX('Gebäude oder Wege abbauen')}">${TX('⛏ Abbau')}</button>`);
    reiter.querySelector('[data-rueck]').addEventListener('click', rueckgaengig);
    reiter.querySelector('[data-abriss]').addEventListener('click', abrissStarten);
    rueckKnopfAktualisieren();
  }
  if (bauReiter === 'politik') { politikZeigen(leiste); dorfHudAktualisieren(); return; }
  if (bauReiter === 'verteidigung') mauerKarte(leiste);
  // Nach Epoche sortiert: was man schon bauen darf links, Gesperrtes ganz rechts
  const typen = Object.keys(GEBAEUDE).filter(t => !GEBAEUDE[t].fest && GEBAEUDE[t].kategorie === bauReiter && (!GEBAEUDE[t].belohnung || alleWegeGegangen()))
    .map((t, i) => [t, i]).sort((a, b) => (GEBAEUDE[a[0]].epoche || 0) - (GEBAEUDE[b[0]].epoche || 0) || a[1] - b[1]).map(([t]) => t);
  if (!typen.length) {
    const n = document.createElement('p'); n.className = 'note leiste-note';
    n.textContent = TX('Hier gibt es noch nichts zu bauen.');
    leiste.append(n);
  }
  typen.forEach(typ => {
    const d = GEBAEUDE[typ];
    const k = document.createElement('button');
    k.className = 'baukarte'; k.dataset.typ = typ; k.type = 'button';
    const vorschau = document.createElement('canvas');
    const q = BILD.dorfbau[typ][0].quelle;
    vorschau.width = q.width; vorschau.height = q.height;
    vorschau.getContext('2d').drawImage(q, 0, 0);
    if (neueGrafik() && NEUE_GRAFIK.BAUTEN[typ]) setTimeout(() => { if (!vorschau.isConnected) return; const n = neuerBau(typ, 0).quelle; vorschau.width = n.width; vorschau.height = n.height; vorschau.getContext('2d').drawImage(n, 0, 0); }, 40 + typen.indexOf(typ) * 60);
    const name = document.createElement('b'); name.textContent = d.name;
    const wirkung = document.createElement('span'); wirkung.className = 'wirkung'; wirkung.textContent = d.epoche > SPIEL.epoche ? '' : d.stufen[0].wirkung || '';
    const preis = document.createElement('span'); preis.className = 'preis'; preis.innerHTML = kostenHtml(d.kosten) + (d.arbeiter ? ' · ' + d.arbeiter + rsym('einwohner', TX('Arbeiter')) : '');
    const grund = document.createElement('span'); grund.className = 'grund';
    const schloss = document.createElement('canvas'); schloss.className = 'schloss'; schloss.setAttribute('aria-hidden', 'true');
    schloss.width = BILD.schloss.width; schloss.height = BILD.schloss.height; schloss.getContext('2d').drawImage(BILD.schloss, 0, 0);
    k.append(vorschau, schloss, name, wirkung, preis, grund);
    k.addEventListener('click', () => { if (!bauGrund(typ)) bauStarten(typ); else { zeigeInfoTyp(typ); meldung(TX`${d.name} geht gerade nicht`, bauGrundLang(typ), 2800); } });
    leiste.append(k);
  });
  dorfHudAktualisieren();
}

// Politik: Beziehungen, Lebensstandard und Chronik
function politikZeigen(leiste) {
  const ls = lebensstandard();
  const dorfer = ['birkenhain', 'eisenfurt'].filter(ortBekannt);
  leiste.insertAdjacentHTML('beforeend', TX`
    <div class="politik-karte"><span class="label">Lebensstandard</span><b class="ls-wert">${ls.wert} · ${esc(standardText(ls.wert))}</b>
      <ul class="gruende">${ls.gruende.map(([t, v]) => `<li><span>${esc(t)}</span><b class="${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '+' : ''}${v}</b></li>`).join('')}</ul>
      <p class="note">Ab ${LEBENSSTANDARD.hoch} ziehen Siedler zu, unter ${LEBENSSTANDARD.niedrig} gehen Leute weg.</p></div>
    <div class="politik-karte"><span class="label">Nachbarn</span>
      ${dorfer.length ? dorfer.map(o => `<div class="nachbar"><b>${esc(ORTE[o].name)}</b><span>${esc(beziehungText(SPIEL.beziehungen[o] || 0))}</span></div>`).join('') : TX('<p class="note">Noch keine Nachbarn bekannt. Hör dich im Wirtshaus um.</p>')}
      ${hatGebaeude('kirche') ? TX('<p class="note">Die Kirche verbessert jeden Tag euer Ansehen.</p>') : ''}</div>
    <div class="politik-karte"><span class="label">Chronik</span><p class="note">${SPIEL.chronik.length} von ${LORE.length} Einträgen gefunden.${chronikNeu() ? TX` <b>${chronikNeu()} neu.</b>` : ''}</p>
      <button class="btn small ghost" type="button" data-a="chronik">Chronik lesen</button></div>`);
  leiste.querySelector('[data-a="chronik"]').addEventListener('click', () => chronikZeigen());
  leiste.insertAdjacentHTML('beforeend', festHtml() + bestehendePolitikHtml());
  bestehendePolitikEinrichten(leiste);
  const fk = leiste.querySelector('[data-a="fest"]'); if (fk) fk.addEventListener('click', festFeiern);
}

function dorfHudAktualisieren() {
  if (SPIEL.held) {
    const offen = SPIEL.held.punkte > 0 || offeneMeilensteine().length > 0;
    const b = document.getElementById('btnHeld');
    b.textContent = TX`Held · Stufe ${SPIEL.held.stufe}`;
    b.classList.toggle('hinweis', offen);
  }
  const w = dorfWerte(), ls = lebensstandard(w);
  const setze = (id, t) => { document.getElementById(id).textContent = t; };
  setze('dTag', SPIEL.tag); setze('dGold', SPIEL.gold); setze('dTeile', SPIEL.teile);
  setze('dHolz', SPIEL.holz); setze('dStein', SPIEL.stein);
  setze('dHolzHilfe', w.holzProTag ? TX`+${w.holzProTag - (w.kohleProTag ? w.holzVerbrauch : 0)} pro Tag` : '');
  setze('dSteinHilfe', w.steinProTag ? TX`+${w.steinProTag} pro Tag` : '');
  setze('dNahrung', SPIEL.nahrung + ' / ' + w.vorrat);
  const bil = document.getElementById('dNahrungHilfe');
  bil.textContent = TX`${(w.bilanz >= 0 ? '+' : '') + w.bilanz} pro Tag`;
  bil.classList.toggle('schlecht', w.bilanz < 0);
  setze('dEinw', SPIEL.einwohner + ' / ' + w.platz);
  setze('dEinwHilfe', w.frei < 0 ? TX('Arbeiter fehlen') : '');
  setze('dFrei', w.frei);
  document.getElementById('dFrei').classList.toggle('schlecht', w.frei < 0);
  const kohleSichtbar = SPIEL.epoche >= 1 || SPIEL.holzkohle > 0 || SPIEL.beschlaege > 0;
  document.querySelectorAll('.res.kohle').forEach(el => { el.hidden = !kohleSichtbar; });
  setze('dKohle', SPIEL.holzkohle); setze('dBeschlaege', SPIEL.beschlaege);
  document.querySelectorAll('.res.strom').forEach(el => { el.hidden = !stromFrei(); });
  const kraeuterSichtbar = (SPIEL.kraeuter || 0) > 0 || hatGebaeude('kraeutergarten') || hatGebaeude('gewaechshaus');
  document.querySelectorAll('.res.kraeuter').forEach(el => { el.hidden = !kraeuterSichtbar; });
  if (kraeuterSichtbar) setze('dKraeuter', SPIEL.kraeuter || 0);
  const altSichtbar = SPIEL.epoche >= 3 || (SPIEL.altmetall || 0) > 0;
  document.querySelectorAll('.res.altmetall').forEach(el => { el.hidden = !altSichtbar; });
  if (altSichtbar) {
    setze('dAltmetall', SPIEL.altmetall || 0);
    const pro = Math.floor(gebaeudeWert('altmetallProTag') * w.besetzt);
    setze('dAltmetallHilfe', fabrikFrei() ? TX`Fabrik −${FABRIK.produktion.altmetall}/T` : pro ? TX`+${pro} pro Tag` : '');
  }
  if (stromFrei()) {
    setze('dStrom', TX`${SPIEL.strom.tage} T`);
    const sh = document.getElementById('dStromHilfe');
    sh.textContent = SPIEL.strom.tage ? TX`−${stromKosten()} Kohle/T` : TX('Stromausfall!');
    sh.classList.toggle('schlecht', SPIEL.strom.tage <= 2);
  }
  setze('dKohleHilfe', w.kohleBedarf ? TX`Heizen ${w.kohleBedarf}/Tag` : '');
  setze('dStandard', ls.wert);
  setze('dHerz', `${SPIEL.dorfherz} / ${DORFHERZ.leben}`);
  document.getElementById('dHerz').classList.toggle('a', SPIEL.dorfherz > DORFHERZ.schadenProNiederlage);
  document.getElementById('dHerz').classList.toggle('down', SPIEL.dorfherz <= DORFHERZ.schadenProNiederlage);
  // Kurzliste für den eingeklappten Vorrat: Holz, Stein, Lazi-Teile und, sobald es sie gibt, Holzkohle und Beschläge
  const mini = [['holz', SPIEL.holz], ['stein', SPIEL.stein], ['teile', SPIEL.teile]];
  if (kohleSichtbar) mini.push(['holzkohle', SPIEL.holzkohle], ['beschlaege', SPIEL.beschlaege]);
  if (stromFrei()) mini.push(['strom', TX`${SPIEL.strom.tage} T`]);
  if (altSichtbar) mini.push(['altmetall', SPIEL.altmetall || 0]);
  if (kraeuterSichtbar) mini.push(['kraeuter', SPIEL.kraeuter || 0]);
  document.getElementById('dMini').innerHTML = mini.map(([r, n]) => `<span>${rsym(r)}<b>${n}</b></span>`).join('');
  const sh = document.getElementById('dStandardHilfe');
  sh.textContent = standardText(ls.wert);
  sh.classList.toggle('schlecht', ls.wert < LEBENSSTANDARD.niedrig);
  const warn = document.getElementById('dWarnung'), wt = ueberfallHinweis();
  warn.hidden = !wt; warn.textContent = wt ? '⚠ ' + wt : '';
  const e = EPOCHEN[SPIEL.epoche];
  setze('dEpoche', TX`Epoche ${SPIEL.epoche + 1} von ${EPOCHEN.length} · ${e.name}`);
  const liste = document.getElementById('dZiel');
  liste.textContent = '';
  const ziel = epochenZiel();
  if (ziel) {
    ziel.punkte.forEach(p => {
      const li = document.createElement('li'); li.className = p.ok ? 'ok' : '';
      li.textContent = (p.ok ? '✓ ' : '○ ') + p.text + (p.stand && !p.ok ? ' (' + p.stand + ')' : '');
      liste.append(li);
    });
  } else {
    const li = document.createElement('li'); li.textContent = TX('Die nächste Epoche kommt in einer späteren Version.');
    liste.append(li);
  }
  document.querySelectorAll('.baukarte').forEach(k => {
    const g = bauGrund(k.dataset.typ);
    k.classList.toggle('gesperrt', !!g);
    k.classList.toggle('epochezu', GEBAEUDE[k.dataset.typ].epoche > SPIEL.epoche);
    k.querySelector('.grund').textContent = g;
  });
}

function zeigeInfoTyp(typ, bau) {
  const d = GEBAEUDE[typ], p = document.getElementById('infoPanel');
  const st = bau ? stufeVon(bau) : d.stufen[0];
  p.textContent = '';
  const titel = document.createElement('div'); titel.className = 'info-titel';
  titel.textContent = (bau ? gebaeudeName(bau) : d.name) + (bau && d.stufen.length > 1 ? TX` · Stufe ${bau.stufe || 1} von ${d.stufen.length}` : '');
  // Gebäude späterer Epochen zeigen nur Namen und Grund: Ihre Texte erzählen sonst die Geschichte vorweg
  const zukunft = !bau && d.epoche > SPIEL.epoche;
  const text = document.createElement('p'); text.textContent = zukunft ? TX('Was es kann, erfahrt ihr, wenn es so weit ist.') : d.text;
  p.append(titel, text);
  if (st.wirkung && !zukunft) { const wk = document.createElement('div'); wk.className = 'info-wirkung'; wk.textContent = st.wirkung; p.append(wk); }
  const fakten = document.createElement('div'); fakten.className = 'note';
  const f = [];
  if (!bau) f.push(TX('Kosten: ') + kostenHtml(d.kosten));
  if (d.arbeiter) f.push(TX`${d.arbeiter} Arbeiter`);
  if (!bau && bauGrund(typ)) f.push(esc(bauGrund(typ)));
  fakten.innerHTML = f.join(' · ');
  p.append(fakten);
  const knopf = (text, fn, aus) => { const b = document.createElement('button'); b.className = 'btn small'; b.type = 'button'; b.textContent = text; b.disabled = !!aus; b.addEventListener('click', fn); p.append(b); return b; };
  if (bau) {
    const aus = ausbauInfo(bau);
    if (aus) {
      const box = document.createElement('div'); box.className = 'ausbau';
      box.innerHTML = TX`<span class="label">Ausbauen zu ${esc(aus.stufe.name || d.name)}</span><span class="info-wirkung">${esc(aus.stufe.wirkung)}</span><span class="note">${kostenHtml(aus.stufe.kosten)}${aus.grund ? ' · ' + esc(aus.grund) : ''}</span>`;
      p.append(box);
      knopf(TX('Ausbauen'), () => gebaeudeAusbauen(bau), aus.grund);
    }
    if (typ === 'schmiede') knopf(TX`Waffe schmieden (${SCHMIEDEN.gold} Gold, ${SCHMIEDEN.teile} Teile)`, () => { waffeSchmieden(); zeigeInfoTyp(typ, bau); });
    if (typ === 'schmiede' && SPIEL.meister) knopf(TX('Meisterstück bei Grimbart'), meisterZeigen);
    if (typ === 'schmiede' && !SPIEL.meister) { const n = document.createElement('p'); n.className = 'note'; n.textContent = TX('Baue die Schmiede aus: Dann kommt ein Schmiedemeister ins Dorf, der Meisterstücke aus seltenen Materialien fertigt.'); p.append(n); }
    if (typ === 'kaserne') kaserneInfo(bau, p, knopf);
    if (typ === 'verbundterminal') terminalInfo(bau, p);
    if (typ === 'funkturm') knopf(!stromAn() ? TX('Kein Strom: Funk stumm') : SPIEL.funk.tag === SPIEL.tag ? TX('Heute schon gehört') : TX('Funk abhören'), funkZeigen, !stromAn() || SPIEL.funk.tag === SPIEL.tag);
    if (typ === 'labor') knopf(SPIEL.forschung.laufend ? TX('Forschung ansehen (läuft)') : TX('Forschung starten'), laborZeigen);
    if (typ === 'wirtshaus') {
      knopf(TX('Quatschen'), () => wirtshaus('quatschen'));
      knopf(TX`Einen trinken (${WIRTSHAUS.trinken} Gold)`, () => wirtshaus('trinken'), SPIEL.gold < WIRTSHAUS.trinken);
      const runde = WIRTSHAUS.rundeProEinwohner * SPIEL.einwohner;
      knopf(TX`Eine Runde ausgeben (${runde} Gold)`, () => wirtshaus('runde'), SPIEL.gold < runde || SPIEL.feier > 0).title = SPIEL.feier > 0 ? TX('Die letzte Runde wirkt noch') : '';
    }
  }
  if (bau && !d.fest) {
    const rueck = abbauErtrag(bau);
    const n = document.createElement('p'); n.className = 'note abbau-note';
    n.innerHTML = TX('Abbauen gibt die Hälfte zurück: ') + kostenHtml(rueck);
    p.append(n);
    const ab = knopf(TX('Abbauen'), () => {
      if (!ab.dataset.sicher) { ab.dataset.sicher = '1'; ab.textContent = TX('Sicher? Nochmal klicken'); return; }
      gebaeudeAbbauen(bau);
    });
    ab.classList.add('ghost', 'abbau');
  }
  const zu = document.createElement('button'); zu.className = 'schliessen'; zu.type = 'button'; zu.setAttribute('aria-label', TX('Schließen')); zu.textContent = '×';
  zu.addEventListener('click', () => { p.hidden = true; Dorf.markierung.visible = false; });
  p.append(zu);
  p.hidden = false;
}

function gebaeudeAusbauen(b) {
  const aus = ausbauInfo(b);
  if (!aus || aus.grund) return;
  bezahlen(aus.stufe.kosten);
  rueckMerken({ art: 'ausbau', b, stufe: b.stufe || 1, kosten: Object.assign({}, aus.stufe.kosten) });
  b.stufe = (b.stufe || 1) + 1;
  const x = Dorf.bauten.find(e => e.b === b);
  if (x) zeige(x.o, gebaeudeBild(b), 1);
  spielSpeichern(); geraeusch('bauen');
  meldung(gebaeudeName(b), TX`Ausgebaut auf Stufe ${b.stufe}`, 1600);
  if (b.typ === 'schmiede' && b.stufe >= 2) meisterAnkunft();
  dorfHudAktualisieren(); zeigeInfoTyp(b.typ, b);
}

// ---------- Wirtshaus: quatschen, trinken, eine Runde ausgeben ----------
function wirtshaus(art) {
  let zeilen, folgen = [];
  if (art === 'quatschen') {
    const da = GESPRAECHE.filter(([wer, , o]) => figurDa(wer) && gespraechPasst(o));
    zeilen = [da[Math.floor(Math.random() * da.length)]];
  } else if (art === 'trinken') {
    SPIEL.gold -= WIRTSHAUS.trinken;
    const heute = SPIEL.gespraeche.tag === SPIEL.tag;
    const neu = GERUECHTE.filter(g => g.folge && figurDa(g.wer) && (!g.wenn || g.wenn()) && !(g.folge.entdecken && ortBekannt(g.folge.entdecken)) && !(g.folge.lore && hatLore(g.folge.lore) && !g.folge.entdecken));
    const tipps = GERUECHTE.filter(g => !g.folge);
    let g;
    if (!heute && neu.length && Math.random() < (gebaeudeWert('stimmung') >= 14 ? 0.8 : 0.6)) { g = neu[0]; SPIEL.gespraeche.tag = SPIEL.tag; }
    else g = tipps[Math.floor(Math.random() * tipps.length)];
    zeilen = [[g.wer, g.text]];
    if (g.folge) {
      if (g.folge.entdecken && !SPIEL.karte.bekannt.includes(g.folge.entdecken)) { SPIEL.karte.bekannt.push(g.folge.entdecken); folgen.push(TX('Neu auf der Weltkarte: ') + ORTE[g.folge.entdecken].name); }
      if (g.folge.lore && chronikEintragen(g.folge.lore)) folgen.push(TX('Neu in der Chronik: ') + LORE.find(l => l.id === g.folge.lore).titel);
    }
    if (heute && !g.folge) folgen.push(TX('Für heute hast du alles Neue gehört. Morgen erzählen sie vielleicht mehr.'));
  } else {
    const preis = WIRTSHAUS.rundeProEinwohner * SPIEL.einwohner;
    SPIEL.gold -= preis; SPIEL.feier = LEBENSSTANDARD.feierTage;
    zeilen = RUNDE[Math.floor(Math.random() * RUNDE.length)];
    folgen.push(TX`+${LEBENSSTANDARD.feier} Lebensstandard für ${LEBENSSTANDARD.feierTage} Tage`);
  }
  spielSpeichern(); dorfHudAktualisieren(); geraeusch(art === 'runde' ? 'sieg' : 'muenze');
  let i = 0;
  const zeige = () => {
    const [wer, text] = zeilen[i], p = PERSONEN[wer];
    overlayZeigen(`<div class="card panel nachricht" role="dialog" aria-labelledby="wh">
      <div class="label">${esc(art === 'runde' ? TX('Eine Runde für alle') : art === 'trinken' ? TX('Am Tresen') : TX('Im Wirtshaus'))}</div>
      <div class="nachricht-zeile">
        <canvas class="portrait" width="18" height="27" aria-hidden="true" style="border-color:${p.farbe}"></canvas>
        <div class="nachricht-text"><b id="wh" style="color:${p.farbe}">${esc(p.name)}</b><span class="label">${esc(p.rolle)}</span><p>${esc(text)}</p></div>
      </div>
      ${i === zeilen.length - 1 && folgen.length ? '<ul class="folgen">' + folgen.map(z => `<li>${esc(z)}</li>`).join('') + '</ul>' : ''}
      <div class="knopfreihe"><button class="btn" data-a="weiter" type="button">${i < zeilen.length - 1 ? TX('Weiter') : TX('Zurück ins Dorf')}</button></div>
    </div>`);
    portraitMalen(overlay.querySelector('.portrait'), wer);
    overlay.querySelector('[data-a="weiter"]').addEventListener('click', () => { i++; if (i < zeilen.length) zeige(); else { overlayWeg(); const b = SPIEL.gebaeude.find(x => x.typ === 'wirtshaus'); if (b) zeigeInfoTyp('wirtshaus', b); } });
  };
  zeige();
}

// ---------- Bauen ----------
function bauStarten(typ) {
  const d = GEBAEUDE[typ];
  bauAbbrechen();
  document.getElementById('infoPanel').hidden = true;
  Dorf.markierung.visible = false;
  const vorschau = figur(dorfBild(typ, 0), 0);
  vorschau.sprite.material.transparent = true; vorschau.sprite.material.opacity = 0.7; vorschau.sprite.material.alphaTest = 0.5;
  Dorf.bau = { typ, d, vorschau, gx: Math.round(Dorf.kx - d.groesse[0] / 2), gz: Math.round(Dorf.kz - d.groesse[1] / 2) };
  Dorf.gitter.visible = true; Dorf.fuss.visible = true;
  abrissBeenden();
  document.getElementById('bauModusText').textContent = typ === 'weg'
    ? (istTouch ? TX('Wege ziehen: Tippe ein Feld an, dann vom leuchtenden Feld aus über die Felder ziehen.') : TX('Wege ziehen: Maustaste gedrückt halten und über die Felder ziehen.'))
    : TX`${d.name} platzieren`;
  document.getElementById('bauOk').hidden = false;
  document.getElementById('bauNein').textContent = TX('Abbrechen');
  rueckKnopfAktualisieren();
  document.getElementById('bauModus').hidden = false;
  document.getElementById('bauBereich').hidden = true;
  bauVorschau();
}
function bauVorschau() {
  const z = Dorf.bau; if (!z) return;
  const [w, d] = z.d.groesse;
  const grund = belegtGrund(z.gx, z.gz, w, d, z.typ), frei = !grund;
  // Der Grund steht schon beim Verschieben da, nicht erst beim Versuch
  const hinweis = document.getElementById('bauGrundText');
  hinweis.textContent = grund; hinweis.hidden = !grund;
  Dorf.fuss.scale.set(w, d, 1); Dorf.fuss.position.set(z.gx + w / 2, 0.02, z.gz + d / 2);
  Dorf.fussMat.color.set(frei ? 0x7ad37a : 0xff5a4a);
  stelle(z.vorschau, z.gx + w / 2, z.gz + d - 0.35, 0.02);
  // Bleibt anklickbar, damit ein Versuch die Meldung bringt
  document.getElementById('bauOk').classList.toggle('aus', !frei);
  document.getElementById('bauOk').setAttribute('aria-disabled', String(!frei));
}
function bauAbbrechen() {
  if (!Dorf.bau) return;
  entfernen(Dorf.bau.vorschau);
  Dorf.bau = null;
  Dorf.gitter.visible = false; Dorf.fuss.visible = false;
  document.getElementById('bauModus').hidden = true;
  document.getElementById('bauBereich').hidden = false;
}
function bauBestaetigen() {
  const z = Dorf.bau; if (!z) return;
  const [w, d] = z.d.groesse;
  const grund = belegtGrund(z.gx, z.gz, w, d, z.typ) || bauGrund(z.typ) && bauGrundLang(z.typ);
  if (grund) { meldung(TX`${z.d.name} geht hier nicht`, grund, 2800); return; }
  bezahlen(z.d.kosten);
  const b = { id: SPIEL.naechsteId++, typ: z.typ, gx: z.gx, gz: z.gz, stufe: 1 };
  SPIEL.gebaeude.push(b);
  rueckMerken({ art: 'bau', b, kosten: Object.assign({}, z.d.kosten) });
  bauAbbrechen();
  gebaeudeAufstellen(b);
  spielSpeichern();
  if (z.typ === 'weg') {
    // Wege baut man am Stück: der Baumodus bleibt offen
    geraeusch('bauen'); dorfHudAktualisieren();
    if (!bauGrund('weg')) { bauStarten('weg'); Dorf.bau.gx = z.gx; Dorf.bau.gz = z.gz; bauVorschau(); }
    return;
  }
  meldung(TX`${z.d.name} gebaut`, null, 1400);
  dorfHudAktualisieren();
  if (z.typ === 'labor') laborAnkunft();
  if (z.typ === 'kaserne') { begleiterWahl(b, epochePruefenUndZeigen); return; }
  epochePruefenUndZeigen();
}

// ---------- Wege ziehen (wie Mauern in Clash of Clans) ----------
// Gedrückt halten und über die Felder ziehen: Jedes Feld bekommt einen Weg.
// Ein ganzer Zug lässt sich mit einem Klick auf „Zurück“ zurücknehmen.
function zelleUnterZeiger(e) {
  const p = zeigerAufBoden(e.clientX, e.clientY);
  return p ? [Math.round(p.x - 0.5), Math.round(p.z - 0.5)] : null;
}
function wegSetzen(gx, gz) {
  if (belegt(gx, gz, 1, 1, 'weg') || bauGrund('weg')) return null;
  const k = GEBAEUDE.weg.kosten;
  bezahlen(k);
  const b = { id: SPIEL.naechsteId++, typ: 'weg', gx, gz, stufe: 1 };
  SPIEL.gebaeude.push(b);
  gebaeudeAufstellen(b);
  geraeusch('klick');
  return { art: 'bau', b, kosten: Object.assign({}, k) };
}
function wegZugStarten(e) {
  const c = zelleUnterZeiger(e);
  if (!c) return false;
  // Am Handy beginnt der Zug am leuchtenden Feld, sonst verschiebt Ziehen die Ansicht
  if (e.pointerType !== 'mouse' && (Math.abs(c[0] - Dorf.bau.gx) > 1 || Math.abs(c[1] - Dorf.bau.gz) > 1)) return false;
  Dorf.wegZug = { id: e.pointerId, liste: [], gx: c[0], gz: c[1] };
  const s = wegSetzen(c[0], c[1]);
  if (s) Dorf.wegZug.liste.push(s);
  else { const grund = belegtGrund(c[0], c[1], 1, 1, 'weg'); if (grund) meldung(TX('Hier geht kein Weg'), grund, 2200); }
  Dorf.bau.gx = c[0]; Dorf.bau.gz = c[1]; bauVorschau();
  return true;
}
function wegZugWeiter(e) {
  const z = Dorf.wegZug, c = zelleUnterZeiger(e);
  if (!z || !c || (c[0] === z.gx && c[1] === z.gz)) return;
  // Alle Felder auf der Linie vom letzten bis zum aktuellen Feld, damit schnelle Züge keine Lücken haben
  const dx = c[0] - z.gx, dz = c[1] - z.gz, n = Math.max(Math.abs(dx), Math.abs(dz));
  let x = z.gx, y = z.gz;
  for (let i = 1; i <= n; i++) {
    const nx = Math.round(z.gx + dx * i / n), ny = Math.round(z.gz + dz * i / n);
    // diagonale Schritte über eine Ecke verbinden, damit der Weg zusammenhängt
    if (nx !== x && ny !== y) { const s = wegSetzen(nx, y); if (s) z.liste.push(s); }
    const s = wegSetzen(nx, ny); if (s) z.liste.push(s);
    x = nx; y = ny;
  }
  z.gx = c[0]; z.gz = c[1];
  Dorf.bau.gx = c[0]; Dorf.bau.gz = c[1]; bauVorschau();
  dorfHudAktualisieren();
}
function wegZugEnde() {
  const z = Dorf.wegZug;
  Dorf.wegZug = null;
  if (!z) return;
  if (z.liste.length) {
    rueckMerken(z.liste.length === 1 ? z.liste[0] : { art: 'gruppe', liste: z.liste });
    spielSpeichern(); geraeusch('bauen');
  }
  dorfHudAktualisieren();
  if (bauGrund('weg')) { meldung(TX('Keine Steine mehr'), TX('Ein Weg kostet 1 Stein'), 1400); bauAbbrechen(); }
  else bauVorschau();
}

// ---------- Rückgängig und Abbau ----------
// Rückgängig nimmt die letzten Bauten, Ausbauten und Abbauten des Tages zurück (volle Erstattung).
// Abbauen gibt die Hälfte von Bau- und Ausbaukosten zurück.
const RUECK_MAX = 30;
function rueckMerken(e) {
  if (!Dorf.rueck) Dorf.rueck = [];
  Dorf.rueck.push(e);
  if (Dorf.rueck.length > RUECK_MAX) Dorf.rueck.shift();
  rueckKnopfAktualisieren();
}
function rueckKnopfAktualisieren() {
  const leer = !(Dorf.rueck && Dorf.rueck.length);
  document.querySelectorAll('[data-rueck], #bauZurueck').forEach(b => { b.disabled = leer; });
  const bz = document.getElementById('bauZurueck');
  if (bz) bz.hidden = !(Dorf.abriss || (Dorf.bau && Dorf.bau.typ === 'weg'));
}
function rueckgaengig() {
  if (modus !== 'dorf' || !Dorf.rueck || !Dorf.rueck.length) return;
  const e = Dorf.rueck[Dorf.rueck.length - 1], b = e.b;
  if (e.art === 'bau') {
    if (!SPIEL.gebaeude.includes(b)) { Dorf.rueck.pop(); return rueckgaengig(); }
    gutschreiben(e.kosten);
    gebaeudeEntfernen(b);
    meldung(TX`${gebaeudeName(b)} zurückgenommen`, TX('Alle Rohstoffe sind zurück'), 1400);
  } else if (e.art === 'ausbau') {
    if (!SPIEL.gebaeude.includes(b)) { Dorf.rueck.pop(); return rueckgaengig(); }
    gutschreiben(e.kosten);
    b.stufe = e.stufe;
    const x = Dorf.bauten.find(y => y.b === b);
    if (x) zeige(x.o, gebaeudeBild(b), 1);
    meldung(TX`${gebaeudeName(b)} zurückgenommen`, TX`Wieder Stufe ${b.stufe}`, 1400);
  } else if (e.art === 'gruppe') {
    const da = e.liste.filter(x => SPIEL.gebaeude.includes(x.b));
    da.forEach(x => { gutschreiben(x.kosten); SPIEL.gebaeude.splice(SPIEL.gebaeude.indexOf(x.b), 1); });
    document.getElementById('infoPanel').hidden = true;
    dorfNeuAufbauen();
    meldung(TX`${da.length} Wege zurückgenommen`, TX('Alle Rohstoffe sind zurück'), 1400);
  } else if (e.art === 'abbau') {
    if (!kannBezahlen(e.kosten)) { meldung(TX('Zu wenig Rohstoffe'), TX('Die Erstattung ist schon ausgegeben'), 1600); return; }
    if (belegt(b.gx, b.gz, GEBAEUDE[b.typ].groesse[0], GEBAEUDE[b.typ].groesse[1], b.typ)) { meldung(TX('Hier ist kein Platz'), null, 1400); return; }
    bezahlen(e.kosten);
    SPIEL.gebaeude.push(b);
    dorfNeuAufbauen();
    meldung(TX`${gebaeudeName(b)} steht wieder`, null, 1400);
  }
  Dorf.rueck.pop();
  geraeusch('klick'); spielSpeichern(); dorfHudAktualisieren(); rueckKnopfAktualisieren();
  if (bauReiter) bauLeisteBauen();
}
// Was ein Abbau zurückgibt: die Hälfte aller Bau- und Ausbaukosten
function abbauErtrag(b) {
  const d = GEBAEUDE[b.typ], summe = {};
  const dazu = k => Object.keys(k || {}).forEach(r => { summe[r] = (summe[r] || 0) + k[r]; });
  dazu(d.kosten);
  for (let i = 1; i < (b.stufe || 1); i++) dazu(d.stufen[i] && d.stufen[i].kosten);
  const halb = {};
  Object.keys(summe).forEach(r => { const n = Math.floor(summe[r] / 2); if (n > 0) halb[r] = n; });
  return halb;
}
function gebaeudeAbbauen(b) {
  if (!b || GEBAEUDE[b.typ].fest || !SPIEL.gebaeude.includes(b)) return;
  const k = abbauErtrag(b);
  gutschreiben(k);
  gebaeudeEntfernen(b);
  rueckMerken({ art: 'abbau', b, kosten: k });
  geraeusch('bauen'); spielSpeichern(); dorfHudAktualisieren();
  meldung(TX`${gebaeudeName(b)} abgebaut`, kostenText(k), 1400);
}
function gebaeudeEntfernen(b) {
  SPIEL.gebaeude.splice(SPIEL.gebaeude.indexOf(b), 1);
  if (b.typ === 'labor' && !SPIEL.gebaeude.some(x => x.typ === 'labor')) SPIEL.forschung.laufend = null;
  document.getElementById('infoPanel').hidden = true;
  Dorf.markierung.visible = false;
  dorfNeuAufbauen();
}
// Das Dorf neu zeichnen, ohne dass die Kamera springt
function dorfNeuAufbauen() {
  const kx = Dorf.kx, kz = Dorf.kz, rueck = Dorf.rueck, abriss = Dorf.abriss;
  const bau = Dorf.bau ? { typ: Dorf.bau.typ, gx: Dorf.bau.gx, gz: Dorf.bau.gz } : null;
  dorfAufbauen();
  Dorf.kx = kx; Dorf.kz = kz; Dorf.rueck = rueck; Dorf.abriss = abriss;
  leuteAnpassen();
  // Ein offener Baumodus (z. B. beim Wegeziehen) bleibt offen
  if (bau && !bauGrund(bau.typ)) { bauStarten(bau.typ); Dorf.bau.gx = bau.gx; Dorf.bau.gz = bau.gz; bauVorschau(); }
  else if (bau) { document.getElementById('bauModus').hidden = true; document.getElementById('bauBereich').hidden = false; }
}
function abrissStarten() {
  if (Dorf.abriss) { abrissBeenden(); return; }
  bauAbbrechen();
  document.getElementById('infoPanel').hidden = true;
  Dorf.abriss = true;
  document.getElementById('bauModusText').textContent = TX('Abbau: Tippe ein Gebäude oder einen Weg an. Du bekommst die Hälfte zurück.');
  document.getElementById('bauOk').hidden = true;
  document.getElementById('bauNein').textContent = TX('Fertig');
  document.getElementById('bauModus').hidden = false;
  document.getElementById('bauBereich').hidden = true;
  rueckKnopfAktualisieren();
  geraeusch('klick');
}
function abrissBeenden() {
  if (!Dorf.abriss) return;
  Dorf.abriss = false;
  document.getElementById('bauModus').hidden = true;
  document.getElementById('bauOk').hidden = false;
  document.getElementById('bauNein').textContent = TX('Abbrechen');
  document.getElementById('bauBereich').hidden = false;
  rueckKnopfAktualisieren();
}
function abrissKlick(e) {
  // Erst ein Gebäude unter dem Zeiger, sonst ein Weg auf dem Feld
  const ndc = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  strahl.setFromCamera(ndc, cam);
  const treffer = strahl.intersectObjects(Dorf.bauten.map(x => x.o.sprite));
  let b = treffer.length ? treffer[0].object.userData.bau : null;
  if (!b) {
    const p = zeigerAufBoden(e.clientX, e.clientY);
    if (p) b = SPIEL.gebaeude.find(x => x.typ === 'weg' && x.gx === Math.floor(p.x) && x.gz === Math.floor(p.z));
  }
  if (!b) return;
  if (GEBAEUDE[b.typ].fest) { meldung(TX('Das Lagerfeuer bleibt'), TX('Es ist das Herz des Dorfes'), 1400); return; }
  gebaeudeAbbauen(b);
}

// ---------- Epochen ----------
function epochePruefenUndZeigen() {
  const ziel = epochenZiel();
  if (!ziel || !ziel.fertig) return false;
  // Die letzte Epoche: Alle Ziele erfüllt. Jetzt öffnet sich der Weg zum Nullbunker (finale.js).
  if (!EPOCHEN[SPIEL.epoche + 1]) {
    if (SPIEL.alleZiele || !regel('finale')) return false;
    SPIEL.alleZiele = SPIEL.tag;
    chronikEintragen('kustos');   // Wer Anselm nie vertraut hat, hört hier zum ersten Mal von KUSTOS
    spielSpeichern();
    overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="et">
      <div class="label">Alle Ziele erreicht</div>
      <h1 id="et">Das Tal gehört euch. Fast.</h1>
      <p class="story">Die Fabrik läuft, die Verbünde hören auf euch, die Mauer leuchtet. Aber jede Nacht kommt derselbe Funkspruch, aus einer Tiefe, die auf keiner Karte steht: „ZÄHLUNG ABGESCHLOSSEN. ERGEBNIS WIRD GEPRÜFT.“ Irgendwo unter der Stadt wartet KUSTOS.</p>
      <p class="note">Auf der Weltkarte ist ein neuer Ort erschienen: der Nullbunker. Wer hinuntergeht, entscheidet über das Protokoll von KUSTOS. Nimm dir Zeit, bereite dich vor. Der Bunker wartet.</p>
      <button class="btn" data-a="zu">Weiter</button></div>`);
    document.querySelector('#overlay [data-a="zu"]').addEventListener('click', overlayWeg);
    return true;
  }
  SPIEL.epoche++;
  (SPIEL.epochenZeit = SPIEL.epochenZeit || {})[SPIEL.epoche] = Math.round(SPIEL.spielzeit || 0);
  spielSpeichern();
  const e = EPOCHEN[SPIEL.epoche];
  const neu = Object.keys(GEBAEUDE).filter(t => GEBAEUDE[t].epoche === SPIEL.epoche).map(t => GEBAEUDE[t].name);
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="et">
    <div class="label">Neue Epoche · ${SPIEL.epoche + 1} von ${EPOCHEN.length}</div>
    <h1 id="et">${esc(e.name)}</h1>
    <p class="story">${esc(e.text)}</p>
    ${neu.length ? TX`<p>Neu freigeschaltet: <b>${esc(neu.join(', '))}</b></p>` : ''}
    <button class="btn" data-a="zu">Weiter</button></div>`);
  document.querySelector('#overlay [data-a="zu"]').addEventListener('click', overlayWeg);
  dorfHudAktualisieren();
  return true;
}

// ---------- Rückkehr aus der Mission ----------
function rueckkehrInsDorf(erg) {
  SPIEL.missionen++;
  const bekanntVorher = Object.keys(ORTE).filter(ortBekannt);
  if (erg.ort) SPIEL.karte.besucht[erg.ort] = (SPIEL.karte.besucht[erg.ort] || 0) + 1;
  let text = '';
  const neuLore = [];
  if (erg.sieg) {
    SPIEL.siege = (SPIEL.siege || 0) + 1;
    if (erg.ort) SPIEL.karte.erledigt[erg.ort] = (SPIEL.karte.erledigt[erg.ort] || 0) + 1;
    // Nach dem Sturm aufs Lager braucht die nächste Bande länger
    if (erg.ort === 'lager' && SPIEL.ueberfall) { SPIEL.ueberfall.tag += UEBERFALL.lagerAufschub; SPIEL.ueberfall.gemeldet = false; }
    gutschreiben({ gold: erg.gold || 0, teile: erg.teile || 0, holz: erg.holz || 0, stein: erg.stein || 0, nahrung: erg.nahrung || 0 });
    gutschreiben(erg.material || {});
    if (erg.beziehung) for (const o in erg.beziehung) SPIEL.beziehungen[o] = Math.min(5, (SPIEL.beziehungen[o] || 0) + erg.beziehung[o]);
    const w = dorfWerte();
    const platz = Math.max(0, w.platz - SPIEL.einwohner);
    const neu = Math.min(platz, erg.ueberlebende || 0);
    const weg = (erg.ueberlebende || 0) - neu;
    SPIEL.einwohner += neu;
    const { rein, verkauft } = inDenBeutel(erg.items || []);
    SLOTS.forEach(sl => { const it = erg.ausItems && erg.ausItems[sl]; if (it && SPIEL.beutel.some(x => x.uid === it.uid)) SPIEL.ausruestung[sl] = it.uid; });
    (erg.lore || []).forEach(id => { if (chronikEintragen(id)) neuLore.push(LORE.find(l => l.id === id).titel); });
    const belohnung = [['g', 'gold', TX('Gold')], ['t', 'teile', TX('Lazi-Teile')], ['h', 'holz', TX('Holz')], ['h', 'stein', TX('Stein')], ['a', 'nahrung', TX('Nahrung')]]
      .filter(([, k]) => erg[k]).map(([c, k, n]) => `<div class="reward ${c}"><b>+${erg[k]}${rsym(k)}</b><span class="label">${n}</span></div>`).join('');
    text = `${erg.ueberlebende ? TX`<p class="story">${erg.ueberlebende} Überlebende kommen mit ins Dorf. ${neu} finden einen Platz${weg ? TX`, <b>${weg} müssen weiterziehen</b>, weil der Wohnraum fehlt` : ''}.</p>` : ''}
      <div class="rewards">${belohnung}${neu ? TX`<div class="reward a"><b>+${neu}${rsym('einwohner')}</b><span class="label">Einwohner</span></div>` : ''}</div>
      ${rein.length ? TX`<p class="note">Neu im Beutel: ${rein.map(it => `<span style="color:${SELTENHEIT[it.selten].farbe}">${esc(it.name)}</span>`).join(', ')}</p>` : ''}
      ${verkauft.length ? TX`<p class="note">Der Beutel war voll. Verkauft: ${esc(verkauft.map(it => it.name).join(', '))}</p>` : ''}
      ${weg ? TX('<p class="note">Tipp: Baue Wohnhäuser, damit beim nächsten Mal alle bleiben können.</p>') : ''}`;
  } else if (erg.abgebrochen) {
    text = TX('<p class="story">Die Mission wurde abgebrochen und zählt als verloren. Ein Tag ist vergangen, die Beute ist weg, deine Ausrüstung hast du noch.</p>');
  } else {
    text = TX('<p class="story">Du schleppst dich verwundet zurück ins Dorf. Die Beute dieser Mission ist verloren, aber deine Ausrüstung hast du noch.</p>');
  }
  const tag = tagVergeht();
  const neueOrte = Object.keys(ORTE).filter(o => ortBekannt(o) && !bekanntVorher.includes(o));
  spielSpeichern();
  modusDorf();
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="rt">
    <div class="label">Tag ${SPIEL.tag} · Zurück im Dorf</div>
    <h1 id="rt">${erg.sieg ? TX('Willkommen zurück') : TX('Eine bittere Rückkehr')}</h1>
    ${text}
    ${tagesberichtHtml(tag)}
    ${neuLore.length ? TX`<p class="note">Neu in der Chronik: <b>${esc(neuLore.join(', '))}</b></p>` : ''}
    ${neueOrte.length ? TX`<p class="note">Neu auf der Weltkarte: <b>${esc(neueOrte.map(o => ORTE[o].name).join(', '))}</b></p>` : ''}
    ${ueberfallFaellig() ? TX('<p class="note schlecht"><b>Am Dorfrand brennen Fackeln. Die Plünderer sind da.</b></p>') : ''}
    <button class="btn" data-a="zu">Ins Dorf</button></div>`);
  document.querySelector('#overlay [data-a="zu"]').addEventListener('click', () => { overlayWeg(); nachRueckkehr(); });
}

// ---------- Eingabe im Dorf ----------
function dorfEingabe() {
  let ziehen = null;
  canvas.addEventListener('pointerdown', e => {
    if (modus !== 'dorf' || !overlay.hidden) return;
    if (Dorf.bau && Dorf.bau.typ === 'weg' && !Dorf.wegZug && wegZugStarten(e)) { ziehen = null; return; }
    ziehen = { x: e.clientX, y: e.clientY, kx: Dorf.kx, kz: Dorf.kz, bewegt: false, id: e.pointerId };
  });
  canvas.addEventListener('pointermove', e => {
    if (modus !== 'dorf') return;
    if (Dorf.wegZug) { if (Dorf.wegZug.id === e.pointerId) wegZugWeiter(e); return; }
    if (zweiFinger(e)) { ziehen = null; return; }
    if (Dorf.bau && (e.pointerType === 'mouse' || (ziehen && !ziehen.bewegt))) bauFolgen(e);
    if (!ziehen || ziehen.id !== e.pointerId) return;
    const dx = e.clientX - ziehen.x, dy = e.clientY - ziehen.y;
    if (Math.hypot(dx, dy) > 8) ziehen.bewegt = true;
    if (ziehen.bewegt) {
      const f = PX / ansicht.s / cam.zoom;
      Dorf.kx = ziehen.kx - dx * f; Dorf.kz = ziehen.kz - dy * f / Math.sin(NEIGUNG);
      kameraBegrenzen();
    }
  });
  addEventListener('wheel', e => { if (modus === 'dorf' && overlay.hidden) dorfZoomen(Dorf.zoom * (e.deltaY < 0 ? 1.1 : 0.9)); }, { passive: true });
  addEventListener('pointerdown', e => finger.set(e.pointerId, [e.clientX, e.clientY]), true);
  addEventListener('pointerup', e => { finger.delete(e.pointerId); fingerAbstand = 0; }, true);
  addEventListener('pointercancel', e => { finger.delete(e.pointerId); fingerAbstand = 0; }, true);
  const zugEnde = e => { if (Dorf.wegZug && Dorf.wegZug.id === e.pointerId) wegZugEnde(); };
  addEventListener('pointercancel', zugEnde);
  addEventListener('pointerup', e => {
    if (modus === 'dorf' && Dorf.wegZug) { zugEnde(e); return; }
    if (modus !== 'dorf' || !ziehen || ziehen.id !== e.pointerId) return;
    const klick = !ziehen.bewegt;
    ziehen = null;
    if (!klick || !overlay.hidden) return;
    if (Dorf.bau) {
      bauFolgen(e);
      if (e.pointerType === 'mouse') bauBestaetigen();
      return;
    }
    if (Dorf.abriss) { abrissKlick(e); return; }
    gebaeudeAntippen(e);
  });
  addEventListener('keydown', e => {
    if (modus !== 'dorf') return;
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); rueckgaengig(); return; }
    if (e.code === 'Escape') { bauAbbrechen(); abrissBeenden(); document.getElementById('infoPanel').hidden = true; Dorf.markierung.visible = false; }
  });
  document.getElementById('bauOk').addEventListener('click', bauBestaetigen);
  document.getElementById('bauNein').addEventListener('click', () => { bauAbbrechen(); abrissBeenden(); });
  document.getElementById('bauZurueck').addEventListener('click', rueckgaengig);
  document.getElementById('btnBeutel').addEventListener('click', beutelZeigen);
  document.getElementById('btnHeld').addEventListener('click', heldZeigen);
  document.getElementById('btnMission').addEventListener('click', () => { bauAbbrechen(); if (!SPIEL.klasse) klassenWahl(); else if (ueberfallFaellig()) ueberfallZeigen(); else weltkarteZeigen(); });
}
function bauFolgen(e) {
  const p = zeigerAufBoden(e.clientX, e.clientY);
  if (!p || !Dorf.bau) return;
  const [w, d] = Dorf.bau.d.groesse;
  Dorf.bau.gx = Math.round(p.x - w / 2); Dorf.bau.gz = Math.round(p.z - d / 2);
  bauVorschau();
}
function gebaeudeAntippen(e) {
  const ndc = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  strahl.setFromCamera(ndc, cam);
  const treffer = strahl.intersectObjects(Dorf.bauten.map(x => x.o.sprite));
  if (!treffer.length) { document.getElementById('infoPanel').hidden = true; Dorf.markierung.visible = false; return; }
  const b = treffer[0].object.userData.bau, g = GEBAEUDE[b.typ].groesse;
  Dorf.markierung.scale.set(g[0], g[1], 1); Dorf.markierung.position.set(b.gx + g[0] / 2, 0.018, b.gz + g[1] / 2);
  Dorf.markierung.visible = true;
  zeigeInfoTyp(b.typ, b);
}
const finger = new Map();
let fingerAbstand = 0;
function dorfZoomen(z) { Dorf.zoom = Math.max(DORF_ZOOM.min, Math.min(DORF_ZOOM.max, z)); if (modus === 'dorf') zoomSetzen(Dorf.zoom); }
// Zwei Finger auf dem Bildschirm zoomen und verschieben nicht. true, solange das so ist.
function zweiFinger(e) {
  if (!finger.has(e.pointerId)) return false;
  finger.set(e.pointerId, [e.clientX, e.clientY]);
  if (finger.size < 2) return false;
  const [a, b] = [...finger.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (fingerAbstand) dorfZoomen(Dorf.zoom * d / fingerAbstand);
  fingerAbstand = d;
  return true;
}
function kameraBegrenzen() {
  Dorf.kx = Math.max(-32, Math.min(32, Dorf.kx));
  Dorf.kz = Math.max(-22, Math.min(22, Dorf.kz));
}

function dorfAktualisieren(dt) {
  // Sicherheitsnetz: Ist weder Karte noch Fenster offen, muss die Dorf-Oberfläche zu sehen sein
  const ui = document.getElementById('dorfUi');
  if (ui.hidden && overlay.hidden && document.getElementById('weltkarte').hidden) ui.hidden = false;
  let mx = (tasten.KeyD || tasten.ArrowRight ? 1 : 0) - (tasten.KeyA || tasten.ArrowLeft ? 1 : 0);
  let mz = (tasten.KeyS || tasten.ArrowDown ? 1 : 0) - (tasten.KeyW || tasten.ArrowUp ? 1 : 0);
  if (mx || mz) { Dorf.kx += mx * 16 * dt; Dorf.kz += mz * 16 * dt; kameraBegrenzen(); }
  leuteBewegen(dt);
  rauchAufsteigen(dt);
  dorflebenTick(dt);
  kameraAuf(Dorf.kx, Dorf.kz);
}

// ---------- Held: Stufen, Werte und Fähigkeiten ----------
function heldZeigen() {
  if (!SPIEL.klasse) { klassenWahl(); return; }
  const h = SPIEL.held, K = KLASSEN[SPIEL.klasse], hw = heldWerte();
  const noetig = STUFEN.erfahrung(h.stufe);
  const werte = Object.keys(STUFEN.werte).map(k => {
    const d = STUFEN.werte[k];
    return `<div class="wert-zeile"><div><b>${esc(d.name)}</b> <span class="note">${h.werte[k] === 1 ? TX('1 Punkt') : TX`${h.werte[k]} Punkte`} · je ${esc(d.text)}</span></div>
      <button class="btn small" data-wert="${k}" type="button" ${h.punkte > 0 ? '' : 'disabled'}>+1</button></div>`;
  }).join('');
  const baum = STUFEN.meilensteine.map(m => {
    const wahl = h.faehigkeiten[m], offen = h.stufe >= m && !wahl;
    const karten = FAEHIGKEITEN[SPIEL.klasse][m].map(f => {
      const gewaehlt = wahl === f.id, verpasst = wahl && !gewaehlt;
      return `<div class="faehigkeit${gewaehlt ? ' gewaehlt' : ''}${verpasst ? ' verpasst' : ''}${h.stufe < m ? ' gesperrt' : ''}">
        <b>${esc(f.name)}</b><p>${esc(f.text)}</p>
        ${offen ? TX`<button class="btn small" data-faehigkeit="${f.id}" data-m="${m}" type="button">Wählen</button>` : gewaehlt ? TX('<span class="label">Gewählt</span>') : ''}
      </div>`;
    }).join('<span class="oder" aria-hidden="true">oder</span>');
    return TX`<div class="meilenstein"><div class="ms-kopf"><span class="ms-stufe${h.stufe >= m ? ' erreicht' : ''}">Stufe ${m}</span>${offen ? TX('<span class="label" style="color:var(--bronze)">Wähle eine Fähigkeit</span>') : h.stufe < m ? TX('<span class="label">Noch gesperrt</span>') : ''}</div>
      <div class="ms-wahl">${karten}</div></div>`;
  }).join('');
  overlayZeigen(TX`<div class="card panel breit" role="dialog" aria-labelledby="ht">
    <div class="label">${esc(K.name)} · ${esc(K.kurz)}</div>
    <h1 id="ht">Stufe ${h.stufe}</h1>
    <div class="bar xp"><i style="width:${Math.min(100, h.erfahrung / noetig * 100)}%"></i><b>${h.erfahrung} / ${noetig} Erfahrung</b></div>
    <div class="held-grid">
      <div class="held-werte">
        <span class="label">${h.punkte > 0 ? (h.punkte > 1 ? TX`${h.punkte} Punkte zu verteilen` : TX('1 Punkt zu verteilen')) : TX('Keine Punkte offen')}</span>
        ${werte}
        <dl class="facts">
          <dt>Leben</dt><dd>${hw.leben}</dd>
          <dt>Schaden</dt><dd>${Math.round(hw.schaden * 100)} %</dd>
          <dt>Angriffe</dt><dd>${Math.round(100 / hw.angriffTempo)} % Tempo</dd>
        </dl>
      </div>
      <div class="held-baum"><span class="label">Fähigkeiten · eine pro Meilenstein, die Wahl ist endgültig</span>${baum}</div>
    </div>
    <button class="btn" data-a="zu" type="button">Zurück ins Dorf</button>
  </div>`);
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { overlayWeg(); dorfHudAktualisieren(); });
  overlay.querySelectorAll('[data-wert]').forEach(b => b.addEventListener('click', () => {
    if (h.punkte <= 0) return;
    h.punkte--; h.werte[b.dataset.wert]++; geraeusch('klick'); spielSpeichern(); heldZeigen();
  }));
  overlay.querySelectorAll('[data-faehigkeit]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.sicher) {
      h.faehigkeiten[b.dataset.m] = b.dataset.faehigkeit; geraeusch('welle'); spielSpeichern(); heldZeigen();
      return;
    }
    overlay.querySelectorAll('[data-faehigkeit]').forEach(x => { delete x.dataset.sicher; x.textContent = TX('Wählen'); });
    b.dataset.sicher = '1'; b.textContent = TX('Sicher? Nochmal klicken');
  }));
}

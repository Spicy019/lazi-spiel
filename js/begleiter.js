// =====================================================================
// BEGLEITER-FÄHIGKEITEN: zwei je Begleiter (Werte in einstellungen.js).
// Beide nutzt der Begleiter selbst, sobald die Lage passt. Der Lehrling
// stellt einen Elementturm auf; sein Element wählt man vor der Mission.
// =====================================================================

function begleiterListe() { return G ? G.verbuendete.filter(v => v.art === 'begleiter' && v.hp > 0) : []; }
function faehigAbkling(v, F) { return F.abkling * ((v.rang || 1) >= 3 ? 0.75 : 1); }
function gegnerUm(x, z, r) { return G.gegner.filter(e => e.hp > 0 && Math.hypot(e.x - x, e.z - z) < r + e.r); }

// Gegner, die gerade von einem Köder (Schildwall, Elementturm, Barrikade) angezogen werden
function koederFuer(e) {
  if (e.def.boss) return null;
  let best = null, bd = 1e9;
  for (const v of G.verbuendete) if (v.koeder > 0 && v.hp > 0) { const d = abstand(e, v); if (d < v.koederR && d < bd) { best = v; bd = d; } }
  for (const t of G.tuerme) if (t.begleiterTurm && t.hp > 0) { const d = abstand(e, t); if (d < t.koederR && d < bd) { best = t; bd = d; } }
  return best;
}

// Aus begleiterBewegen: Abklingzeiten zählen und Fähigkeiten auslösen
function begleiterFaehigkeiten(v, dt) {
  const FF = BEGLEITER_FAEHIG[v.typB];
  v.fcd[0] -= dt; v.fcd[1] -= dt;
  if (v.schild > 0) { v.schild -= dt; if (Math.random() < dt * 8) partikel(v.x, 1.2, v.z, 0xd8c070, 1, 1); }
  if (v.koeder > 0) v.koeder -= dt;
  for (let i = 0; i < 2; i++) {
    const F = FF[i], A = BEGLEITER_AKTION[F.id];
    if (F.passiv || v.fcd[i] > 0 || !A) continue;
    if (!A.wann(v, F)) continue;
    if (A.los(v, F) === false) continue;
    v.fcd[i] = faehigAbkling(v, F);
    zahl(v.x, 2.3, v.z, F.name, 'mana');
  }
  return false;
}

const BEGLEITER_AKTION = {
  // ---------- Wächter ----------
  schildwall: {
    wann: v => gegnerUm(v.x, v.z, 4).length >= 3 || (P.hp < P.maxHp * 0.4 && gegnerUm(P.x, P.z, 3).length > 0),
    los(v, F) {
      v.schild = F.dauer; v.koeder = F.dauer; v.koederR = F.radius;
      const ring = bodenFlaeche(ringGeo, 0xd8c070, 0.7); ring.position.set(v.x, 0.03, v.z); ring.scale.setScalar(0.4);
      G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.35, wachsen: F.radius });
      geraeusch('trommel');
    },
  },
  schildstoss: {
    wann: v => gegnerUm(v.x, v.z, 2.6).length >= 1 || gegnerUm(P.x, P.z, 3).length >= 2,
    los(v, F) {
      if (!gegnerUm(v.x, v.z, 2.6).length) {
        // Niemand in Reichweite: zum Gegner stürmen, der dir am nächsten ist
        const ziel = naechster(P, G.gegner, 9);
        if (!ziel) return false;
        const dx = ziel.x - v.x, dz = ziel.z - v.z, d = Math.hypot(dx, dz) || 1, weg = Math.max(0, d - ziel.r - 0.7);
        for (let k = 0; k < 6; k++) partikel(v.x + dx / d * weg * k / 6, 0.6, v.z + dz / d * weg * k / 6, 0xd8c070, 1, 1);
        v.x += dx / d * weg; v.z += dz / d * weg; begrenzen(v); v.blick = dx >= 0 ? 1 : -1;
      }
      const ziele = gegnerUm(v.x, v.z, F.radius);
      if (!ziele.length) return false;
      for (const e of ziele) {
        const dx = e.x - v.x, dz = e.z - v.z, d = Math.hypot(dx, dz) || 1;
        gegnerTreffen(e, Math.round(v.schaden * F.mal), dx / d, dz / d, 8, false, 'soldat');
        e.zs.betaeubt = Math.max(e.zs.betaeubt || 0, e.def.boss ? 0.2 : e.def.miniboss ? F.betaeubt * 0.5 : F.betaeubt);
      }
      v.hiebT = 0.25; wackeln(0.14); geraeusch('hieb');
      partikel(v.x, 0.5, v.z, 0xd8c070, 12, 4);
    },
  },
  // ---------- Schattenklinge ----------
  schattensprung: {
    wann: v => !!naechster(v, G.gegner, BEGLEITER_FAEHIG.klinge[0].reichweite),
    los(v, F) {
      const nah = gegnerUm(v.x, v.z, F.reichweite);
      if (!nah.length) return false;
      const ziel = nah.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
      const dx = ziel.x - v.x, dz = ziel.z - v.z, d = Math.hypot(dx, dz) || 1;
      partikel(v.x, 0.9, v.z, 0x8a5ad0, 10, 3);
      v.x = ziel.x + dx / d * (ziel.r + 0.6); v.z = ziel.z + dz / d * (ziel.r + 0.6); begrenzen(v);
      v.blick = dx >= 0 ? -1 : 1; v.hiebT = 0.2; v.cd = Math.max(v.cd, 0.3);
      partikel(v.x, 0.9, v.z, 0x8a5ad0, 10, 3);
      gegnerTreffen(ziel, Math.round(v.schaden * F.mal), -dx / d, -dz / d, 2, true, 'soldat');
      zustandGeben(ziel, 'blutung');
      geraeusch('hieb');
    },
  },
  rauchbombe: {
    wann: v => gegnerUm(P.x, P.z, 3.5).length >= 3 || (P.hp < P.maxHp * 0.5 && gegnerUm(P.x, P.z, 3.5).length >= 1) || (v.hp < v.maxHp * 0.45 && gegnerUm(v.x, v.z, 3.5).length >= 2),
    los(v, F) {
      // Wirft den Rauch dorthin, wo es enger ist: zu dir oder zu sich selbst
      const um = gegnerUm(P.x, P.z, F.radius).length >= gegnerUm(v.x, v.z, F.radius).length ? P : v;
      if (!gegnerUm(um.x, um.z, F.radius).length) return false;
      for (const e of gegnerUm(um.x, um.z, F.radius)) e.zs.betaeubt = Math.max(e.zs.betaeubt || 0, e.def.boss ? 0.3 : e.def.miniboss ? 1 : F.betaeubt);
      for (let k = 0; k < 4; k++) partikel(um.x + (Math.random() - 0.5) * 3, 0.6, um.z + (Math.random() - 0.5) * 3, 0x6a6478, 8, 2);
      const ring = bodenFlaeche(ringGeo, 0x8a84a0, 0.6); ring.position.set(um.x, 0.03, um.z); ring.scale.setScalar(0.5);
      G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.5, wachsen: F.radius });
      geraeusch('wurf');
    },
  },
  // ---------- Lehrling ----------
  elementturm: {
    wann: v => !(v.turm && v.turm.hp > 0) && (gegnerUm(P.x, P.z, 7).length >= 2 || gegnerUm(P.x, P.z, 8).some(e => e.def.boss || e.def.miniboss)),
    los(v, F) {
      if (v.turm && v.turm.hp > 0) return false;
      const ziel = naechster(P, G.gegner, 10), el = BEGLEITER_ELEMENTE[v.element];
      let x = v.x, z = v.z;
      if (ziel) { const dx = ziel.x - P.x, dz = ziel.z - P.z, d = Math.hypot(dx, dz) || 1, w = Math.min(2.4, d * 0.5); x = P.x + dx / d * w; z = P.z + dz / d * w; }
      const t = { art: 'turm', typ: 'elementturm', begleiterTurm: true, name: TX('Der Elementturm'), x, z, r: 0.45, element: v.element, rest: F.dauer + (v.rang || 1), puls: 0.5, schaden: v.schaden, quelle: v, F };
      begrenzen(t);
      if (!platzFrei(t, t.r)) { t.x = v.x; t.z = v.z; }
      turmAufstellen(t, BILD.elementturm[v.element][0], Math.round(F.leben * v.mal * (el.lebenMal || 1)));
      t.koederR = F.koeder * (el.koederMal || 1);
      v.turm = t;
      partikel(t.x, 1.2, t.z, new THREE.Color(el.farbe).getHex(), 16, 4);
    },
  },
  // ---------- Geselle ----------
  barrikade: {
    wann: v => !(v.barrikade && v.barrikade.hp > 0) && (gegnerUm(P.x, P.z, 5).length >= 2 || gegnerUm(P.x, P.z, 6).some(e => e.def.boss || e.def.miniboss)),
    los(v, F) {
      if (v.barrikade && v.barrikade.hp > 0) return false;
      const ziel = naechster(P, G.gegner, 10);
      let x = v.x + 1, z = v.z;
      if (ziel) { const dx = ziel.x - P.x, dz = ziel.z - P.z, d = Math.hypot(dx, dz) || 1, w = Math.min(1.9, d * 0.5); x = P.x + dx / d * w; z = P.z + dz / d * w; }
      const t = { art: 'turm', typ: 'barrikade', begleiterTurm: true, name: TX('Die Barrikade'), x, z, r: 0.7, rest: F.dauer, koederR: F.koeder, quelle: v, bild: BILD.bauwerk.pfahlwall };
      begrenzen(t);
      if (!platzFrei(t, t.r)) { t.x = v.x; t.z = v.z + 1; begrenzen(t); }
      turmAufstellen(t, BILD.bauwerk.pfahlwall, Math.round(F.leben * v.mal));
      v.barrikade = t; v.hiebT = 0.3;
    },
  },
};

// Aus turmBewegen: Türme der Begleiter
function begleiterTurmTick(t, dt) {
  t.rest -= dt;
  if (t.rest <= 0 || t.hp <= 0) {
    if (t.hp > 0) { G.tuerme.splice(G.tuerme.indexOf(t), 1); entfernen(t); infoWeg(t); partikel(t.x, 0.8, t.z, t.typ === 'barrikade' ? 0x5a3a20 : 0x5ff0e0, 14, 3); zahl(t.x, 1.6, t.z, TX('Zerfällt'), 'block'); }
    begleiterTurmWeg(t);
    return;
  }
  if (t.typ !== 'elementturm') return;
  const el = BEGLEITER_ELEMENTE[t.element];
  t.bild = BILD.elementturm[t.element][Math.floor(G.zeit * 4) % 2];
  t.puls -= dt;
  if (t.puls > 0) return;
  t.puls = t.F.puls;
  const radius = t.F.radius * (t.element === 'blitz' ? 1.35 : 1), farbe = new THREE.Color(el.farbe).getHex();
  for (const e of gegnerUm(t.x, t.z, radius)) {
    const dx = e.x - t.x, dz = e.z - t.z, d = Math.hypot(dx, dz) || 1;
    gegnerTreffen(e, Math.max(1, Math.round(t.schaden * 0.8)), dx / d, dz / d, el.rueckstoss || 1, false, 'turm');
    if (el.status) zustandGeben(e, el.status);
  }
  const ring = bodenFlaeche(ringGeo, farbe, 0.65); ring.position.set(t.x, 0.03, t.z); ring.scale.setScalar(0.3);
  G.effekte.push({ mesh: ring, mat: ring.material, t: 0, life: 0.3, wachsen: radius });
  partikel(t.x, 1.8, t.z, farbe, 4, 2);
}

// Turm weg (zerfallen oder zerstört)
function begleiterTurmWeg(t) { if (t.quelle && t.quelle.turm === t) t.quelle.turm = null; }

// Text für Kaserne und Auswahl
function begleiterFaehigHtml(art) {
  return BEGLEITER_FAEHIG[art].map(F => `<span class="bf"><b>${esc(F.name)}</b>${F.passiv ? TX(' · immer aktiv') : ''}<br>${esc(F.text)}</span>`).join('');
}

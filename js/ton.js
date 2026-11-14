// =====================================================================
// MUSIK UND GERÄUSCHE im 8-Bit-Stil, live im Browser erzeugt.
// Die Lieder sind wie in einem Tracker aufgeschrieben:
//   "D4:2" = Note D in Oktave 4, 2 Schritte lang (ein Schritt = 1/16 Takt)
//   "-:4"  = 4 Schritte Pause
//   Schlagzeug: k = Bassdrum, s = Snare, h = Hi-Hat
// =====================================================================

const LIEDER = {
  // "Asche und Stille": düster und ruhig, für das Dorf
  dorf: {
    bpm: 76,
    spuren: [
      { klang: 'puls12', laut: 0.06, noten:
        'D4:2 F4:2 A4:2 F4:2 D4:2 F4:2 A4:2 F4:2 D4:2 F4:2 A4:2 C5:2 A4:2 F4:2 A4:2 F4:2 ' +
        'Bb3:2 D4:2 F4:2 D4:2 Bb3:2 D4:2 F4:2 D4:2 Bb3:2 D4:2 F4:2 A4:2 F4:2 D4:2 F4:2 D4:2 ' +
        'G3:2 Bb3:2 D4:2 Bb3:2 G3:2 Bb3:2 D4:2 Bb3:2 G3:2 Bb3:2 D4:2 F4:2 D4:2 Bb3:2 D4:2 Bb3:2 ' +
        'A3:2 C#4:2 E4:2 C#4:2 A3:2 C#4:2 E4:2 C#4:2 A3:2 C#4:2 E4:2 G4:2 E4:2 C#4:2 E4:2 C#4:2' },
      { klang: 'dreieck', laut: 0.2, noten:
        'D2:8 A2:4 D2:4 D2:8 A2:4 D2:4 Bb1:8 F2:4 Bb1:4 Bb1:8 F2:4 Bb1:4 ' +
        'G1:8 D2:4 G1:4 G1:8 D2:4 G1:4 A1:8 E2:4 A1:4 A1:8 E2:4 A1:4' },
      { klang: 'puls25', laut: 0.07, noten:
        '-:8 A4:4 G4:4 F4:8 E4:4 D4:4 -:4 F4:4 Bb4:6 A4:2 G4:12 -:4 ' +
        '-:8 D5:4 C5:4 Bb4:6 A4:2 G4:8 E4:4 G4:4 C#5:8 D5:12 -:4' },
      { klang: 'trommel', laut: 0.35, noten: 'k:3 k:13 k:3 k:13 k:3 k:13 k:3 k:13 k:3 k:13 k:3 k:13 k:3 k:13 k:3 k:13' },
    ],
  },
  // "Schrott und Stahl": treibend und bluesig, für den Kampf
  kampf: {
    bpm: 140,
    spuren: [
      { klang: 'eckig', laut: 0.055, noten:
        'E2:2 E2:2 G2:2 E2:2 A2:2 E2:2 Bb2:2 A2:2 E2:2 E2:2 G2:2 E2:2 D2:2 D2:2 B1:2 D2:2 ' +
        'E2:2 E2:2 G2:2 E2:2 A2:2 E2:2 Bb2:2 A2:2 E2:2 E2:2 G2:2 E2:2 D2:2 D2:2 B1:2 D2:2 ' +
        'A2:2 A2:2 C3:2 A2:2 D3:2 A2:2 Eb3:2 D3:2 A2:2 A2:2 C3:2 A2:2 D3:2 A2:2 Eb3:2 D3:2 ' +
        'E2:2 E2:2 G2:2 A2:2 B2:2 A2:2 G2:2 E2:2 E2:2 E2:2 G2:2 E2:2 D2:2 D2:2 B1:2 D2:2' },
      { klang: 'dreieck', laut: 0.16, noten:
        'E2:8 E2:8 E2:8 D2:8 E2:8 E2:8 E2:8 D2:8 A1:8 A1:8 A1:8 A1:8 E2:8 E2:8 E2:8 D2:8' },
      { klang: 'puls25', laut: 0.06, noten:
        'E4:1 -:5 E4:1 -:1 G4:2 -:2 A4:2 -:2 B4:4 A4:2 G4:2 E4:8 ' +
        'E4:1 -:5 E4:1 -:1 G4:2 -:2 A4:2 -:2 D5:4 B4:2 A4:2 B4:8 ' +
        'A4:2 C5:2 D5:4 Eb5:2 D5:2 C5:2 A4:2 C5:4 A4:4 G4:4 A4:4 ' +
        'B4:2 D5:2 E5:4 D5:2 B4:2 A4:2 G4:2 E4:12 -:4' },
      { klang: 'trommel', laut: 0.4, noten:
        'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 ' +
        'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 k:2 s:1 s:1 s:2 ' +
        'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 ' +
        'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 s:1 s:1 s:1 s:1 s:2' },
    ],
  },
};

const Ton = { ctx: null, an: true, lied: null, wunsch: null, schritt: 0, zeit: 0, letzte: {} };
Ton.an = ablageLesen(ABLAGE.ton) !== 'aus';

const NOTEN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function frequenz(name) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  if (!m) return 0;
  const n = NOTEN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}
// "D4:2 F4:2" -> Ereignisse pro Schritt
function liedVorbereiten(lied) {
  lied.laenge = 0;
  lied.spuren.forEach(sp => {
    sp.proSchritt = {};
    let t = 0;
    sp.noten.trim().split(/\s+/).forEach(tok => {
      const [n, l] = tok.split(':'); const len = Number(l) || 1;
      if (n !== '-') (sp.proSchritt[t] = sp.proSchritt[t] || []).push({ n, len });
      t += len;
    });
    sp.laenge = t;
    lied.laenge = Math.max(lied.laenge, t);
  });
}
Object.values(LIEDER).forEach(liedVorbereiten);

function tonStarten() {
  if (Ton.ctx) { if (Ton.ctx.state === 'suspended') Ton.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = Ton.ctx = new AC();
  Ton.master = ctx.createGain(); Ton.master.gain.value = Ton.an ? 0.8 : 0; Ton.master.connect(ctx.destination);
  Ton.musik = ctx.createGain(); Ton.musik.gain.value = OPT.musik / 100; Ton.musik.connect(Ton.master);
  Ton.effekte = ctx.createGain(); Ton.effekte.gain.value = OPT.effekte / 100 * 0.6; Ton.effekte.connect(Ton.master);
  // Pulswellen mit schmalem Tastverhältnis, typisch für 8-Bit-Konsolen
  const puls = anteil => {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * anteil);
    return ctx.createPeriodicWave(re, im);
  };
  Ton.wellen = { puls12: puls(0.125), puls25: puls(0.25) };
  const len = ctx.sampleRate;
  Ton.rauschen = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = Ton.rauschen.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  setInterval(tonPlanen, 25);
  if (Ton.wunsch) liedSpielen(Ton.wunsch);
}
// Der Browser erlaubt Ton erst nach einer Eingabe
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, tonStarten, { capture: true }));

function liedSpielen(name) {
  Ton.wunsch = name;
  if (!Ton.ctx || Ton.lied === LIEDER[name]) return;
  const t = Ton.ctx.currentTime;
  Ton.musik.gain.cancelScheduledValues(t);
  Ton.musik.gain.setValueAtTime(Ton.musik.gain.value, t);
  Ton.musik.gain.linearRampToValueAtTime(0, t + 0.4);
  Ton.musik.gain.linearRampToValueAtTime(OPT.musik / 100, t + 0.9);
  Ton.lied = LIEDER[name]; Ton.schritt = 0; Ton.zeit = t + 0.45;
}

function tonPlanen() {
  const lied = Ton.lied, ctx = Ton.ctx;
  if (!lied || !ctx) return;
  // Ist der Ton aus, werden keine Noten erzeugt (spart am Handy Rechenzeit und Akku)
  if (!Ton.an || !OPT.musik) { Ton.zeit = ctx.currentTime + 0.05; return; }
  const dauer = 60 / lied.bpm / 4;
  if (Ton.zeit < ctx.currentTime - 0.2) Ton.zeit = ctx.currentTime + 0.05;
  while (Ton.zeit < ctx.currentTime + 0.15) {
    lied.spuren.forEach(sp => {
      const ev = sp.proSchritt[Ton.schritt % sp.laenge];
      if (ev) ev.forEach(e => note(sp.klang, e.n, Ton.zeit, e.len * dauer, sp.laut, Ton.musik));
    });
    Ton.schritt = (Ton.schritt + 1) % lied.laenge;
    Ton.zeit += dauer;
  }
}

function note(klang, n, t, dauer, laut, ziel) {
  const ctx = Ton.ctx;
  if (klang === 'trommel') return trommel(n, t, laut, ziel);
  const o = ctx.createOscillator(), g = ctx.createGain();
  if (Ton.wellen[klang]) o.setPeriodicWave(Ton.wellen[klang]);
  else o.type = klang === 'dreieck' ? 'triangle' : 'square';
  o.frequency.value = typeof n === 'number' ? n : frequenz(n);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(laut, t + 0.005);
  g.gain.linearRampToValueAtTime(laut * 0.6, t + Math.min(0.08, dauer * 0.5));
  g.gain.setValueAtTime(laut * 0.6, t + dauer * 0.85);
  g.gain.linearRampToValueAtTime(0, t + dauer);
  o.connect(g); g.connect(ziel);
  o.start(t); o.stop(t + dauer + 0.02);
}
function trommel(art, t, laut, ziel) {
  const ctx = Ton.ctx, g = ctx.createGain();
  g.connect(ziel);
  if (art === 'k') {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(laut * 1.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); o.start(t); o.stop(t + 0.17);
    return;
  }
  const r = ctx.createBufferSource(), f = ctx.createBiquadFilter();
  r.buffer = Ton.rauschen;
  f.type = 'highpass'; f.frequency.value = art === 'h' ? 7000 : 1500;
  const len = art === 'h' ? 0.04 : 0.12;
  g.gain.setValueAtTime(art === 'h' ? laut * 0.35 : laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  r.connect(f); f.connect(g); r.start(t); r.stop(t + len + 0.01);
}

// Kurze Geräusche für das Spiel
function geraeusch(name) {
  const ctx = Ton.ctx;
  if (!ctx || !Ton.an) return;
  const jetzt = ctx.currentTime;
  if (Ton.letzte[name] && jetzt - Ton.letzte[name] < 0.04) return;
  Ton.letzte[name] = jetzt;
  const z = Ton.effekte, t = jetzt + 0.005;
  const gleit = (klang, von, bis, d, laut) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (Ton.wellen[klang]) o.setPeriodicWave(Ton.wellen[klang]); else o.type = klang;
    o.frequency.setValueAtTime(von, t); o.frequency.exponentialRampToValueAtTime(bis, t + d);
    g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(z); o.start(t); o.stop(t + d + 0.02);
  };
  const folge = (noten, d, klang) => noten.forEach((n, i) => note(klang || 'puls25', n, t + i * d, d * 0.95, 0.12, z));
  switch (name) {
    case 'hieb': trommel('s', t, 0.18, z); break;
    case 'treffer': gleit('square', 260, 90, 0.08, 0.12); break;
    case 'muenze': folge(['E6', 'B6'], 0.05); break;
    case 'teil': folge(['C6', 'G6'], 0.05, 'puls12'); break;
    case 'schaden': gleit('triangle', 180, 50, 0.2, 0.5); trommel('k', t, 0.3, z); break;
    case 'strom': for (let i = 0; i < 4; i++) note('square', 700 + Math.random() * 900, t + i * 0.02, 0.02, 0.05, z); break;
    case 'beschwoeren': gleit('triangle', 90, 360, 0.3, 0.4); folge(['C5', 'G5'], 0.08, 'puls12'); break;
    case 'bauen': folge(['G3', 'C4', 'G3'], 0.05, 'square'); break;
    case 'turm': gleit('square', 900, 1400, 0.05, 0.04); break;
    case 'explosion': trommel('k', t, 0.6, z); trommel('s', t, 0.4, z); break;
    case 'welle': folge(['E4', 'B4', 'E5'], 0.1); break;
    case 'sieg': folge(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 0.1); break;
    case 'niederlage': folge(['G4', 'Eb4', 'C4', 'G3'], 0.18, 'dreieck'); break;
    case 'klick': folge(['A5'], 0.03, 'puls12'); break;
    case 'wurf': gleit('square', 1200, 500, 0.06, 0.05); break;
    case 'eis': folge(['E7', 'B6', 'G7'], 0.03, 'puls12'); break;
    case 'zuenden': gleit('square', 300, 900, 0.4, 0.05); break;
    case 'trommel': trommel('k', t, 0.25, z); trommel('k', t + 0.12, 0.2, z); break;
  }
}

function tonUmschalten() {
  Ton.an = !Ton.an;
  ablageSchreiben(ABLAGE.ton, Ton.an ? 'an' : 'aus');
  if (Ton.master) Ton.master.gain.setTargetAtTime(Ton.an ? 0.8 : 0, Ton.ctx.currentTime, 0.05);
  document.querySelectorAll('.tonKnopf').forEach(b => { b.textContent = Ton.an ? TX('Ton an') : TX('Ton aus'); b.setAttribute('aria-pressed', String(Ton.an)); });
}
addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) tonUmschalten(); });

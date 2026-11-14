// =====================================================================
// SPRACHE: Deutsch (Original), Englisch und Chinesisch.
// Alle Texte im Code laufen durch TX(). Der deutsche Text ist der Schlüssel,
// die Übersetzungen stehen in sprache_en.js und sprache_zh.js.
// Vorlagen (`... ${x} ...`) werden zu TX`... ${x} ...`; ihr Schlüssel
// enthält {0}, {1} … an den Stellen der Werte.
// =====================================================================

const SPRACHEN = { de: 'Deutsch', en: 'English', zh: '中文' };
let SPRACHE = 'de';
// Hauptsprache ist Deutsch. Englisch und Chinesisch wählt man im Hauptmenü über die Flaggen.
{
  const gespeichert = ablageLesen(ABLAGE.sprache);
  SPRACHE = SPRACHEN[gespeichert] ? gespeichert : 'de';
}
const WOERTER = (typeof UEBERSETZUNG !== 'undefined' && UEBERSETZUNG[SPRACHE]) || {};

function TX(s, ...werte) {
  if (Array.isArray(s) && s.raw) {
    let schluessel = s[0];
    for (let i = 1; i < s.length; i++) schluessel += '{' + (i - 1) + '}' + s[i];
    const text = SPRACHE !== 'de' && WOERTER[schluessel] !== undefined ? WOERTER[schluessel] : schluessel;
    return text.replace(/\{(\d+)\}/g, (_, i) => String(werte[i]));
  }
  if (SPRACHE === 'de' || typeof s !== 'string') return s;
  const t = WOERTER[s];
  return t === undefined ? s : t;
}
// Einzahl oder Mehrzahl, immer mit Zahl und Wort zusammen, z. B. mehrzahl(n, TX('1 Tag'), TX`${n} Tage`).
// Nicht mehrzahl(n, TX('Tag'), TX('Tage')): einzelne Wörter sind mehrdeutig („Tag“ ist auch die HUD-Überschrift).
function mehrzahl(n, ein, viele) { return n === 1 ? ein : viele; }

function spracheSetzen(neu) {
  if (!SPRACHEN[neu] || neu === SPRACHE) return;
  ablageSchreiben(ABLAGE.sprache, neu);
  try { if (typeof SPIEL !== 'undefined' && SPIEL && modus !== 'mission') spielSpeichern(); } catch (e) { /* egal */ }
  location.reload();
}

// Feste Texte aus index.html übersetzen (Textknoten und einige Attribute)
function htmlUebersetzen(wurzel) {
  if (SPRACHE === 'de') return;
  const gang = document.createTreeWalker(wurzel || document.body, NodeFilter.SHOW_TEXT);
  const knoten = [];
  while (gang.nextNode()) knoten.push(gang.currentNode);
  for (const k of knoten) {
    const roh = k.nodeValue, kern = roh.trim();
    if (!kern || WOERTER[kern] === undefined) continue;
    k.nodeValue = roh.replace(kern, WOERTER[kern]);
  }
  (wurzel || document.body).querySelectorAll('[aria-label], [title], [placeholder]').forEach(el => {
    for (const a of ['aria-label', 'title', 'placeholder']) {
      const v = el.getAttribute(a);
      if (v && WOERTER[v] !== undefined) el.setAttribute(a, WOERTER[v]);
    }
  });
}
// Chinesische Zeichen kommen aus der Schrift des Geräts (siehe CSS zu html[lang="zh-Hans"])
document.documentElement.lang = SPRACHE === 'zh' ? 'zh-Hans' : SPRACHE;
htmlUebersetzen();

// Pixel-Flaggen fürs Hauptmenü (20 x 13 Pixel, leicht gewellt)
function flaggeMalen(code) {
  const w = 20, h = 13, c = document.createElement('canvas');
  c.width = w + 2; c.height = h + 2;
  const g = c.getContext('2d');
  const px = (x, y, f) => { g.fillStyle = f; g.fillRect(x + 1, y + 1, 1, 1); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let f;
    if (code === 'de') f = y < 4.34 ? '#1a1418' : y < 8.67 ? '#d2373f' : '#f2c230';
    else if (code === 'zh') {
      f = '#d2242c';
      const stern = (cx, cy, r) => Math.abs(x - cx) + Math.abs(y - cy) <= r;
      if (stern(4, 3, 2) || stern(8, 1, 0) || stern(9, 3, 0) || stern(9, 5, 0) || stern(8, 6, 0)) f = '#ffd83a';
    } else {
      // Union Jack in klein
      f = '#1e3a8a';
      const d1 = Math.abs(y - x * h / w) < 1.4, d2 = Math.abs(y - (w - 1 - x) * h / w) < 1.4;
      if (d1 || d2) f = '#f4f0e8';
      if (Math.abs(y - x * h / w) < 0.6 || Math.abs(y - (w - 1 - x) * h / w) < 0.6) f = '#d2242c';
      if (Math.abs(x - 9.5) < 3 || Math.abs(y - 6) < 2.5) f = '#f4f0e8';
      if (Math.abs(x - 9.5) < 1.5 || Math.abs(y - 6) < 1.5) f = '#d2242c';
    }
    // Welle: helle und dunkle Streifen
    const welle = Math.sin(x * 0.55);
    px(x, y, f);
    if (welle > 0.75) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 1, y + 1, 1, 1); }
    if (welle < -0.75) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 1, y + 1, 1, 1); }
  }
  g.strokeStyle = '#0a0812'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, w + 1, h + 1);
  return c;
}
function sprachFlaggenEinrichten() {
  const box = document.getElementById('hmSprachen');
  if (!box) return;
  box.textContent = '';
  for (const code of Object.keys(SPRACHEN)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'flagge' + (code === SPRACHE ? ' an' : '');
    b.setAttribute('aria-label', SPRACHEN[code]); b.title = SPRACHEN[code];
    b.setAttribute('aria-pressed', String(code === SPRACHE));
    b.append(flaggeMalen(code));
    b.addEventListener('click', () => spracheSetzen(code));
    box.append(b);
  }
}
sprachFlaggenEinrichten();

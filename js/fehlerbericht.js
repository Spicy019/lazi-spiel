// =====================================================================
// FEHLERBERICHT: Das Spiel merkt sich Fehler auf dem Gerät. Im Menü entsteht
// daraus ein Text, den Spieler selbst weitergeben. Von allein wird nichts gesendet.
// Lädt direkt nach ablage.js, damit auch Fehler beim Start auffallen.
// =====================================================================
const FEHLER_MAX = 30;
function fehlerLesen() {
  const l = ablageJsonLesen(ABLAGE.fehler, []);
  return Array.isArray(l) ? l : [];
}
// Gleiche Fehler werden gezählt statt wiederholt. Wege werden gekürzt, weil sie Ordnernamen enthalten können.
function fehlerMerken(text, ort) {
  try {
    const l = fehlerLesen(), kurz = String(ort || '').split(/[\\/]/).pop();
    const da = l.find(e => e.text === text && e.ort === kurz);
    if (da) { da.anzahl++; da.zeit = Date.now(); } else l.push({ text: String(text).slice(0, 300), ort: kurz, anzahl: 1, zeit: Date.now(), version: typeof SPIEL_VERSION === 'undefined' ? '' : SPIEL_VERSION });
    ablageJsonSchreiben(ABLAGE.fehler, l.slice(-FEHLER_MAX));
  } catch (e) { /* Ein Fehler beim Merken darf nichts weiter auslösen */ }
}
addEventListener('error', e => { if (e.message) fehlerMerken(e.message, e.filename ? `${e.filename}:${e.lineno}` : ''); });
addEventListener('unhandledrejection', e => fehlerMerken('Promise: ' + (e.reason && e.reason.message || e.reason)));

function grafikkarteName() {
  try {
    const gl = renderer.getContext(), x = gl.getExtension('WEBGL_debug_renderer_info');
    return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown';
  } catch (e) { return 'unknown'; }
}
function fehlerberichtFassung() {
  if (location.protocol === 'file:') return 'Android';
  if (location.protocol === 'lazi:') return 'PC';
  if (window.top !== window) return 'Artifact';
  return navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ? 'Web app (installed)' : 'Web browser';
}
// Die Angaben sind fest auf Englisch: Der Bericht soll immer gleich aussehen, egal in welcher Sprache gespielt wird.
function fehlerberichtText(beschreibung) {
  const zeilen = ['LAZI bug report', `Version: ${SPIEL_VERSION} · ${fehlerberichtFassung()}`, `Language: ${SPRACHE}`, `Device: ${navigator.userAgent}`, `Screen: ${innerWidth} x ${innerHeight} @${devicePixelRatio || 1}`, `Graphics: ${grafikkarteName()}, setting ${OPT.grafik}${neuLadezeit ? ', drawn in ' + neuLadezeit + ' ms' : ''}, ${Math.round(renderer.info.render.frame ? 1000 / Math.max(1, performance.now() / renderer.info.render.frame) : 0)} fps average`];
  if (SPIEL) {
    zeilen.push(`Save: ${sicherungKopf(SPIEL, MODI[SPIEL.modus].name)}`, `State: mode ${modus}, epoch ${SPIEL.epoche + 1}, class ${SPIEL.klasse || '-'}, level ${SPIEL.held ? SPIEL.held.stufe : '-'}, wins ${SPIEL.siege || 0}, missions ${SPIEL.missionen || 0}, residents ${SPIEL.einwohner}, heart ${SPIEL.dorfherz}, raids ${SPIEL.ueberfaelle || 0}, village value ${dorfPunkte()}`);
    if (modus === 'mission' && MIS) zeilen.push(`Mission: ${Object.keys(MISSIONEN).find(k => MISSIONEN[k] === MIS) || '-'}`);
  }
  const fehler = fehlerLesen();
  zeilen.push('', `Errors: ${fehler.length}`);
  fehler.forEach(e => zeilen.push(`- ${new Date(e.zeit).toISOString()} v${e.version} x${e.anzahl} ${e.ort} ${e.text}`));
  zeilen.push('', 'What happened:', beschreibung || '-');
  return zeilen.join('\n');
}
function fehlerberichtZeigen(zurueck) {
  const teilen = typeof navigator.share === 'function', n = fehlerLesen().length;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="fb">
    <div class="label">${n === 1 ? TX('1 Fehler gemerkt') : TX`${n} Fehler gemerkt`}</div>
    <h1 id="fb">Fehlerbericht</h1>
    <p class="note">Schreib kurz, was passiert ist. Darunter steht der fertige Text mit Version, Gerät, Spielzeit und den gemerkten Fehlern. Du siehst alles, was darin steht, und nur du gibst ihn weiter. Von allein wird nichts gesendet.</p>
    <textarea id="fbText" class="sicherung" aria-label="Was ist passiert?" placeholder="Was ist passiert?"></textarea>
    <textarea id="fbBericht" class="sicherung" readonly aria-label="Fertiger Bericht"></textarea>
    <div class="knopfreihe">
      ${teilen ? TX('<button class="btn" data-a="teilen" type="button">Teilen</button>') : ''}
      <button class="btn${teilen ? ' ghost' : ''}" data-a="kopieren" type="button">Kopieren</button>
      <button class="btn ghost" data-a="zu" type="button">Zurück</button>
    </div>
  </div>`);
  const eingabe = overlay.querySelector('#fbText'), bericht = overlay.querySelector('#fbBericht');
  const auffrischen = () => { bericht.value = fehlerberichtText(eingabe.value); };
  eingabe.addEventListener('input', auffrischen);
  auffrischen();
  sicherungKnoepfe(TX('LAZI-Fehlerbericht'), () => {}, bericht, TX('Der Bericht liegt in der Zwischenablage.'));
  overlay.querySelector('[data-a="zu"]').addEventListener('click', zurueck);
}

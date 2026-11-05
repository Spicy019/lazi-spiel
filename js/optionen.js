// =====================================================================
// OPTIONEN: Bild, Ton und Anzeige. Werden über die Ablage gespeichert.
// =====================================================================

const OPT_STANDARD = {
  fps: 60,                // Bilder pro Sekunde: 30, 60, 120 oder 0 (unbegrenzt)
  aufloesung: 'auto',     // Spielpixel in der Höhe: 'auto', '180', '240', '320', '420'
  musik: 70,              // Lautstärke Musik in Prozent
  effekte: 80,            // Lautstärke Geräusche in Prozent
  wackeln: true,          // Bildschirmwackeln bei Treffern
  zahlen: true,           // Schadenszahlen anzeigen
  fpsAnzeige: false,      // Bilder pro Sekunde oben links anzeigen
  stimmung: true,         // dunkle Bildränder
  grafik: 'klassisch',    // 'klassisch', 'niedrig' oder 'hoch'. Wer schon eine Stufe gespeichert hat, behält sie
  bericht: 'beides',      // Tagesbericht: 'beides', 'zahlen' oder 'erzaehlung'
};
const OPT = Object.assign({}, OPT_STANDARD);
Object.assign(OPT, ablageJsonLesen(ABLAGE.optionen, {}));

// Probelauf: Die Bilder werden beim Start gemalt. Die Stufe gilt deshalb für die ganze Sitzung, eine Änderung startet das Spiel neu.
const GRAFIK_STUFE = OPT.grafik;
function neueGrafik() { return GRAFIK_STUFE === 'niedrig' || GRAFIK_STUFE === 'hoch'; }
function optionenSpeichern() {
  ablageJsonSchreiben(ABLAGE.optionen, OPT);
}

// Auflösung: wie viele Spielpixel hoch das Bild ist
function spielpixelHoehe() {
  if (OPT.aufloesung !== 'auto') return Number(OPT.aufloesung);
  return null;
}

function optionenAnwenden() {
  if (typeof groesseAnpassen === 'function') groesseAnpassen();
  document.getElementById('stimmung').hidden = !OPT.stimmung;
  document.getElementById('fpsAnzeige').hidden = !OPT.fpsAnzeige;
  if (Ton.musik) Ton.musik.gain.setTargetAtTime(OPT.musik / 100, Ton.ctx.currentTime, 0.05);
  if (Ton.effekte) Ton.effekte.gain.setTargetAtTime(OPT.effekte / 100 * 0.6, Ton.ctx.currentTime, 0.05);
}

function optionenZeigen(zurueck) {
  const wahl = (id, werte, aktuell) => `<select id="${id}">${werte.map(([v, t]) => `<option value="${v}"${String(v) === String(aktuell) ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const schalter = (id, an) => `<input type="checkbox" id="${id}"${an ? ' checked' : ''}>`;
  overlayZeigen(TX`<div class="card panel" role="dialog" aria-labelledby="ot">
    <div class="label">Einstellungen</div>
    <h1 id="ot">Optionen</h1>
    <div class="optionen">
      <div class="opt-gruppe"><span class="label">Bild</span>
        <label for="oFps">Bilder pro Sekunde</label>${wahl('oFps', [[30, '30'], [60, '60'], [120, '120'], [0, TX('Unbegrenzt')]], OPT.fps)}
        <label for="oAufl">Auflösung</label>${wahl('oAufl', [['auto', TX('Automatisch')], ['180', TX('Grob (180 Pixel hoch)')], ['240', TX('Normal (240)')], ['320', TX('Fein (320)')], ['420', TX('Sehr fein (420)')]], OPT.aufloesung)}
        <label for="oGrafik">Grafik</label>${wahl('oGrafik', [['klassisch', TX('Klassisch')], ['niedrig', TX('Modern: Niedrig')], ['hoch', TX('Modern: Hoch')]], OPT.grafik)}
        <label for="oStim">Dunkle Bildränder</label>${schalter('oStim', OPT.stimmung)}
        <label for="oVoll">Vollbild</label><button class="btn small ghost" id="oVoll" type="button">Vollbild umschalten</button>
      </div>
      <div class="opt-gruppe"><span class="label">Ton</span>
        <label for="oMusik">Musik</label><input type="range" id="oMusik" min="0" max="100" step="5" value="${OPT.musik}">
        <label for="oEff">Geräusche</label><input type="range" id="oEff" min="0" max="100" step="5" value="${OPT.effekte}">
      </div>
      <div class="opt-gruppe"><span class="label">Anzeige</span>
        <label for="oWack">Bildschirmwackeln</label>${schalter('oWack', OPT.wackeln)}
        <label for="oZahl">Schadenszahlen</label>${schalter('oZahl', OPT.zahlen)}
        <label for="oFpsA">Bilder pro Sekunde anzeigen</label>${schalter('oFpsA', OPT.fpsAnzeige)}
        <label for="oBer">Tagesbericht</label>${wahl('oBer', [['beides', TX('Zahlen und Erzählung')], ['zahlen', TX('Nur Zahlen')], ['erzaehlung', TX('Nur Erzählung')]], OPT.bericht)}
      </div>
    </div>
    <p class="note">Gröbere Auflösung zeigt größere Pixel und läuft schneller, feinere zeigt mehr von der Welt.</p>
    <div class="knopfreihe">
      <button class="btn" data-a="zu" type="button">Fertig</button>
      <button class="btn ghost" data-a="standard" type="button">Standard</button>
    </div>
  </div>`);
  const lesen = () => {
    OPT.fps = Number(overlay.querySelector('#oFps').value);
    OPT.aufloesung = overlay.querySelector('#oAufl').value;
    OPT.stimmung = overlay.querySelector('#oStim').checked;
    const grafikNeu = overlay.querySelector('#oGrafik').value !== OPT.grafik;
    OPT.grafik = overlay.querySelector('#oGrafik').value;
    OPT.musik = Number(overlay.querySelector('#oMusik').value);
    OPT.effekte = Number(overlay.querySelector('#oEff').value);
    OPT.wackeln = overlay.querySelector('#oWack').checked;
    OPT.zahlen = overlay.querySelector('#oZahl').checked;
    OPT.fpsAnzeige = overlay.querySelector('#oFpsA').checked;
    OPT.bericht = overlay.querySelector('#oBer').value;
    optionenSpeichern(); optionenAnwenden();
    if (grafikNeu) {
      // Mitten in einer Mission würde der Neustart als Niederlage zählen
      if (typeof SPIEL !== 'undefined' && SPIEL && SPIEL.laufend) meldung(TX('Grafik'), TX('Gilt, sobald du das Spiel neu startest.'), 2600);
      else { if (typeof SPIEL !== 'undefined' && SPIEL) spielSpeichern(); location.reload(); }
    }
  };
  overlay.querySelectorAll('select, input').forEach(el => el.addEventListener('input', lesen));
  overlay.querySelector('#oVoll').addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => meldung(TX('Vollbild ist hier nicht möglich'), null, 1400));
    } catch (e) { meldung(TX('Vollbild ist hier nicht möglich'), null, 1400); }
  });
  overlay.querySelector('[data-a="standard"]').addEventListener('click', () => { Object.assign(OPT, OPT_STANDARD); optionenSpeichern(); optionenAnwenden(); optionenZeigen(zurueck); });
  overlay.querySelector('[data-a="zu"]').addEventListener('click', () => { if (zurueck) zurueck(); else overlayWeg(); });
}

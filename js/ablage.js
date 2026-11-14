// =====================================================================
// ABLAGE: die einzige Stelle, an der das Spiel etwas dauerhaft speichert.
// Heute ist das localStorage im Browser. Für die App kann diese Datei später
// gegen App-Speicher getauscht werden, ohne dass sich das übrige Spiel ändert.
// In einem privaten Fenster oder ohne Speicher laufen alle Aufrufe ins Leere,
// das Spiel läuft trotzdem.
// =====================================================================

// Alle Schlüssel, die das Spiel benutzt
const ABLAGE = {
  platz: (modus, n) => `lazi-${modus}-platz-${n}`,   // Spielstände, getrennt nach Modus
  letzter: 'lazi-letzter',                          // zuletzt gespielter Stand, z. B. "story:2"
  umzug: 'lazi-umzug',                              // Version, bis zu der alte Stände schon übernommen sind
  optionen: 'lazi-optionen',
  ton: 'lazi-ton',
  sprache: 'lazi-sprache',
  klapp: 'lazi_klapp',                              // eingeklappte Infoboxen
  bestenliste: 'lazi-endless-bestenliste',           // die besten Endless-Läufe, über alle Spielstände
  fehler: 'lazi-fehler',                            // gemerkte Fehler für den Fehlerbericht
  enden: 'lazi-enden',                              // gesehene Enden, über alle Spielstände (Story)
  // Alte Schlüssel, die nur noch gelesen werden
  altPlatz: n => 'lazi-platz-' + n,                 // Version 4 bis 12 (Story)
  altLetzter: 'lazi-letzter-platz',
  altSpielstand: 'lazi-spielstand-v2',              // Version 2 und 3
};

function ablageLesen(schluessel) {
  try { return localStorage.getItem(schluessel); } catch (e) { return null; }
}
function ablageSchreiben(schluessel, wert) {
  try { localStorage.setItem(schluessel, String(wert)); return true; } catch (e) { return false; }
}
function ablageLoeschen(schluessel) {
  try { localStorage.removeItem(schluessel); } catch (e) { /* egal */ }
}
function ablageJsonLesen(schluessel, standard) {
  const text = ablageLesen(schluessel);
  if (text === null) return standard;
  try { const wert = JSON.parse(text); return wert === null || wert === undefined ? standard : wert; } catch (e) { return standard; }
}
function ablageJsonSchreiben(schluessel, wert) { return ablageSchreiben(schluessel, JSON.stringify(wert)); }
// Im Browser kann der Speicher verschwinden: Safari auf dem iPhone räumt ihn auf, eingebettete Seiten (Artifact)
// bekommen nur einen eingeschränkten, private Fenster verlieren ihn beim Schließen. In der PC-App (lazi:) und
// der Android-App (file:) bleibt er.
function ablageUnsicher() { return !/^(file|lazi):$/.test(location.protocol); }
// Den Browser bitten, die Spielstände nicht von sich aus zu löschen (wo er das erlaubt)
if (ablageUnsicher()) try { navigator.storage.persist().catch(() => {}); } catch (e) { /* nicht verfügbar */ }
// Alle Schlüssel des Spiels, z. B. für Export und Tests
function ablageSchluessel() {
  const liste = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^lazi/.test(k)) liste.push(k); } } catch (e) { /* kein Speicher */ }
  return liste;
}

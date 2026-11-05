// =====================================================================
// EINSTELLUNGEN
// Hier kannst du gefahrlos Zahlen ändern und ausprobieren:
// mehr Leben, stärkere Waffen, billigere Gebäude, schnellere Gegner ...
// Nach dem Speichern die Seite neu laden.
// =====================================================================

// Steht im Hauptmenü. Nur mit `node werkzeuge/version.js <version>` ändern, das setzt auch Android und PC.
// Spielzeit: So viele Sekunden ohne Eingabe zählen noch mit. Wer länger weg ist, spielt nicht.
const SPIELZEIT_LEERLAUF = 120;
const SPIEL_VERSION = '0.3.14';

// Endless: Die besten Läufe stehen in einer Bestenliste
const BESTENLISTE = { plaetze: 10 };

// Dorfherz: Das Lagerfeuer hat Lebenspunkte. Fällt es auf 0 oder gibt es keine Einwohner mehr, ist das Dorf verloren.
// Überfälle kommen alle 7 bis 11 Tage. Die Heilung muss deutlich darunter bleiben, sonst folgt aus Niederlagen nie etwas.
//  fliehen: Anteil der Einwohner, der nach einem verlorenen Überfall geht
const DORFHERZ = { leben: 100, heilungProTag: 1, schadenProNiederlage: 34, fliehen: 0.1 };

// Blick aufs Dorf: Standard, kleinster und größter Zoom
const DORF_ZOOM = { start: 0.6, min: 0.4, max: 1.2 };

// Dorfwert: Punkte je Einwohner, Gebäudestufe (ohne Deko), Mauerstufe, Epoche, abgewehrtem Überfall, Punkt Lebensstandard und Missionspunkt
const DORFWERT = { einwohner: 10, gebaeudeStufe: 15, mauer: 50, epoche: 200, ueberfall: 40, lebensstandard: 2, missionspunkte: 0.1 };

// Schwierigkeit: wird beim Anlegen eines Spiels gewählt. Sie ändert nur Gegner und Überfälle, nicht die Wirtschaft. Alte Spielstände gelten als „normal“.
const SCHWIERIGKEIT = {
  normal: { name: TX('Normal'), text: TX('Das Spiel, wie es gedacht ist.'), leben: 1, schaden: 1 },
  schwer: { name: TX('Schwer'), text: TX('Gegner halten 30 % mehr aus und treffen 25 % härter, Überfälle ebenso.'), leben: 1.3, schaden: 1.25 },
};
function schwierigkeit() { return SCHWIERIGKEIT[SPIEL.schwierigkeit] || SCHWIERIGKEIT.normal; }

const CFG = {
  spieler: { leben: 100, tempo: 5.6, radius: 0.4 },   // Grundwerte, die Klasse verändert sie
  rolle:   { tempo: 14, dauer: 0.26, abklingzeit: 0.65 },
  schwert: { schaden: [9, 9, 16], reichweite: 2.0, winkel: 130, abklingzeit: 0.24, comboFenster: 0.6 },
  wirbel:  { maxZeit: 0.9, radius: 2.0, radiusBonus: 1.6, schaden: 10, schadenBonus: 34 },
  turm:    { kosten: 4, max: 2, reichweite: 7, feuerpause: 0.65, schaden: 7, leben: 70 },
  kellertuer: { leben: 450, reparaturProWelle: 80, schadenMal: 0.5 },  // die Tür nimmt nur halben Schaden
  start:   { teile: 5 },
  pauseZwischenWellen: 10,
  seltenChance: 0.35,
  brotChance: 0.14, brotHeilung: 20,
  // Jeder Sieg macht die Gegner etwas stärker (Niederlagen nicht)
  proSieg: { leben: 0.08, schaden: 0.04 },
  // Grundstärke aller Gegner und was jede Epoche draufpackt
  gegner: { leben: 1.3, schaden: 1.25 },   // nach dem Spieltest Okt. 2026: etwas härter
  proEpoche: { leben: 0.25, schaden: 0.14 },
};

// =====================================================================
// KLASSEN
// Jede Klasse hat eigene Werte, eine eigene Hauptwaffe, einen
// aufladbaren Angriff (Rechtsklick/K halten) und eine Aktion (E).
// =====================================================================
const KLASSEN = {
  schwert: {
    name: TX('Schwertkämpfer'), kurz: TX('Ritter ohne Orden'),
    text: TX('Ein Kämpfer in leichter Ritterrüstung. Stark im Nahkampf, robust und schnell.'),
    werte: 1.2,                                    // +20 % auf Leben, Schaden und Tempo
    waffenBonus: { typen: ['kurzschwert', 'langschwert', 'dolch'], mal: 1.3 },
    startWaffe: 'kurzschwert',
    angriff: TX('Schwert-Combo'), laden: TX('Wirbelschlag'), aktion: TX('Lazi-Turm bauen (T)'),
  },
  beschwoerer: {
    name: TX('Golem-Beschwörer'), kurz: TX('Hüter der Lazi-Golems'),
    text: TX('Verteilt mit seinem Techno-Stab Stromstöße auf kurze Distanz und beschwört mechanische Elementargolems, die für ihn kämpfen.'),
    werte: 1.0, leben: 90,
    startWaffe: 'rute',
    angriff: TX('Stromstoß'), laden: TX('Golem beschwören'), aktion: '',
  },
  architekt: {
    name: TX('Architekt'), kurz: TX('Baut, was er braucht'),
    text: TX('Kämpft mit einem einfachen Hammer, repariert damit die Tür und baut Bolzenwerfer, Mörser und Pfahlwälle aus Schrott.'),
    werte: 1.0, leben: 105,
    startWaffe: 'hammer',
    angriff: TX('Hammerschlag'), laden: TX('Bauwerk errichten'), aktion: TX('Bauwerk wechseln (T)'),
  },
  schatten: {
    name: TX('Schattenläufer'), kurz: TX('Zwischen zwei Herzschlägen'),
    text: TX('Springt mit einem alten Lazi-Gerät durch den Raum. Weicht er im letzten Moment aus, lädt sich seine Phase auf und der nächste Angriff trifft dreifach.'),
    werte: 1.0, leben: 82, tempoMal: 1.1,
    startWaffe: 'zwillingsdolche',
    angriff: TX('Dolchwirbel'), laden: TX('Schattenstoß'), aktion: '', rolle: TX('Phasensprung'),
  },
};

// Schattenläufer: Phasensprung statt Rolle, perfektes Ausweichen lädt die Phase auf
const SCHATTEN = {
  dolch: { schaden: 6, reichweite: 1.6, winkel: 110, abklingzeit: 0.15 },
  sprung: { weite: 4, abklingzeit: 0.85, unverwundbar: 0.25 },
  perfekt: { fenster: 0.45, phase: 38 },        // so lange nach dem Sprung zählt ein Ausweichen als perfekt
  phase: { max: 100, verfall: 2.5, mal: 3 },     // volle Phase: nächster Angriff x3
  stoss: { ladezeit: 0.55, weite: 3.4, schaden: 16 },
};

const STROMSTOSS = { schaden: 8, reichweite: 2.3, winkel: 110, abklingzeit: 0.3, ziele: 3 };
const HAMMER = { schaden: 11, reichweite: 1.8, winkel: 130, abklingzeit: 0.45, reparatur: 10 };

// Golem-Beschwörer: Energie lädt sich von selbst auf
const BESCHWOERUNG = { energieMax: 100, energieProSek: 10, kosten: 35, ladezeit: 0.6, max: 3, lebensdauer: 24 };
// Golems machen pro Treffer etwa 70 % des Stromstoß-Schadens
const ELEMENTE = {
  metall: { name: TX('Metall'), farbe: '#a7b6cf', leben: 130, schaden: 6, tempo: 3.6, angriffPause: 1.0,
            text: TX('Robust. Gegner in der Nähe greifen ihn statt dich an.'), spott: true },
  eis:    { name: TX('Eis'),    farbe: '#a8e0ff', leben: 75,  schaden: 6, tempo: 4.2, angriffPause: 0.9,
            text: TX('Treffer verlangsamen Gegner 2 s lang um 40 %.'), langsam: true },
  feuer:  { name: TX('Feuer'),  farbe: '#ff9a40', leben: 75,  schaden: 6, tempo: 4.2, angriffPause: 0.9,
            text: TX('Treffer setzen Gegner in Brand und versengen alles drumherum.'), brand: true },
  blitz:  { name: TX('Blitz'),  farbe: '#ffe060', leben: 55,  schaden: 5, tempo: 5.0, angriffPause: 0.55,
            text: TX('Schnell und zerbrechlich. Jeder Treffer springt auf einen zweiten Gegner über.'), kette: true },
};

// Architekt: Bauvorrat (Schrott) wächst mit der Zeit und durch besiegte Gegner
const BAUEN = { startVorrat: 8, proSek: 0.45, proSieg: 0.5, ladezeit: 0.9, max: 5 };
const BAUWERKE = {
  bolzen:    { name: TX('Bolzenwerfer'), kosten: 4, leben: 70,  radius: 0.5, reichweite: 8, feuerpause: 0.55, schaden: 7,
               text: TX('Schießt schnell auf einzelne Gegner.') },
  moerser:   { name: TX('Mörser'),       kosten: 6, leben: 80,  radius: 0.55, reichweite: 9, feuerpause: 2.2, schaden: 15, flaeche: 1.7,
               text: TX('Langsam, trifft aber alle Gegner in einem Bereich.') },
  pfahlwall: { name: TX('Pfahlwall'),    kosten: 3, leben: 170, radius: 0.75, spott: true,
               text: TX('Versperrt den Weg. Gegner in der Nähe müssen sich erst durchhauen.') },
};

// =====================================================================
// MANA UND FÄHIGKEITEN (Q, E, R)
// Jede Klasse hat drei Fähigkeiten, die Mana kosten und danach
// eine Weile abklingen müssen. Mana lädt sich von selbst auf und
// schneller, wenn du triffst.
// =====================================================================
const MANA = { max: 100, proSek: 6, proTreffer: 2 };

// zielen: Taste gedrückt halten zeigt eine weiße Linie, Loslassen wirft
const TECHNIKEN = {
  schwert: {
    q: { id: 'sturmangriff', name: TX('Sturmangriff'), mana: 25, abklingzeit: 5, weite: 6, dauer: 0.24, schaden: 16,
         text: TX('Du stürmst nach vorne und reißt alle Gegner auf dem Weg mit. Bricht Schilde.') },
    e: { id: 'dolchwurf', name: TX('Dolchwurf'), mana: 15, abklingzeit: 2.5, zielen: true, reichweite: 12, tempo: 22, schaden: 22,
         text: TX('Halten zum Zielen, loslassen zum Werfen. Trifft auch Schützen auf Abstand und lässt sie bluten.') },
    r: { id: 'klingensturm', name: TX('Klingensturm'), mana: 60, abklingzeit: 20, dauer: 6, klingen: 6, radius: 1.9, schaden: 9,
         text: TX('Sechs Lazi-Klingen kreisen 6 Sekunden um dich und zerschneiden alles, was sie berühren.') },
  },
  beschwoerer: {
    q: { id: 'schockkette', name: TX('Schockkette'), mana: 25, abklingzeit: 4, reichweite: 7, sprung: 4, ziele: 5, schaden: 14,
         text: TX('Ein Blitz springt von Gegner zu Gegner und schockt sie kurz.') },
    e: { id: 'fokus', name: TX('Fokus'), mana: 15, abklingzeit: 6, dauer: 6, bonus: 0.3,
         text: TX('Markiert einen Gegner. Alle Golems greifen ihn an und machen 30 % mehr Schaden.') },
    r: { id: 'riesengolem', name: TX('Riesengolem'), mana: 60, abklingzeit: 25, mal: 3, plaetze: 2,
         text: TX('Beschwört einen Riesengolem deines Elements: dreimal so stark, belegt zwei Golemplätze.') },
  },
  architekt: {
    q: { id: 'sprengfalle', name: TX('Sprengfalle'), mana: 20, abklingzeit: 3, max: 3, radius: 1.7, schaden: 30,
         text: TX('Legt eine Sprengfalle. Tritt ein Gegner darauf, fliegt alles in der Nähe in die Luft.') },
    e: { id: 'ueberladung', name: TX('Überladung'), mana: 30, abklingzeit: 14, dauer: 6,
         text: TX('Alle Bauwerke feuern 6 Sekunden lang doppelt so schnell.') },
    r: { id: 'feuerballiste', name: TX('Feuerballiste'), mana: 60, abklingzeit: 22, dauer: 18, schaden: 24, feuerpause: 0.9, reichweite: 10,
         text: TX('Baut eine Feuerballiste, die durch Gegner hindurchschießt und sie in Brand setzt. Zerfällt kurz bevor die Fähigkeit wieder bereit ist.') },
  },
  schatten: {
    q: { id: 'wurfdolche', name: TX('Wurfdolche'), mana: 20, abklingzeit: 3, anzahl: 5, faecher: 50, reichweite: 9, tempo: 20, schaden: 9,
         text: TX('Ein Fächer aus fünf vergifteten Wurfdolchen.') },
    e: { id: 'rauchbombe', name: TX('Rauchbombe'), mana: 30, abklingzeit: 12, dauer: 4,
         text: TX('Du verschwindest im Rauch. Gegner verlieren dich, dein erster Angriff aus dem Rauch trifft doppelt.') },
    r: { id: 'koederpuppe', name: TX('Köderpuppe'), mana: 55, abklingzeit: 22, dauer: 8, leben: 260, radius: 9, rueckenBonus: 0.6,
         text: TX('Stellt eine Puppe auf, auf die alle Gegner in der Nähe losgehen. Von hinten machst du 60 % mehr Schaden.') },
  },
};

// =====================================================================
// ZUSTÄNDE: was Treffer bei Gegnern auslösen können
// =====================================================================
const ZUSTAENDE = {
  brennen: { dauer: 3, proSek: 5 },
  gift:    { dauer: 4, proSek: 3, stapel: 3 },
  blutung: { dauer: 4, proSek: 3 },
  frost:   { dauer: 3, langsam: 0.2, stapel: 3, eingefroren: 1.6 },   // drei Frost-Stapel: eingefroren
  schock:  { betaeubt: 0.4, dauer: 3, mehrSchaden: 0.2 },
  // Kombos
  zersplittern: { mal: 2, flaeche: 1.6 },      // harter Schlag auf Eingefrorene
  septisch: { mal: 2 },                         // Gift und Blutung gleichzeitig wirken doppelt
  oel: { dauer: 7, radius: 1.4, brandDauer: 4, langsam: 0.25 },   // Öl plus Feuer: Flächenbrand
};

// Elite-Gegner: zufälliger Zusatz, nur wo er zum Gegner passt
const ELITE = {
  gepanzert:  { name: TX('Gepanzert'),  farbe: '#a7b6cf', text: TX('nimmt 35 % weniger Schaden'), erlaubt: ['pluenderer', 'schildtraeger', 'kaefer', 'funkenkaefer', 'trommler'] },
  flink:      { name: TX('Flink'),      farbe: '#8ad860', text: TX('läuft und schlägt viel schneller'), erlaubt: ['pluenderer', 'schuetze', 'wolf', 'heuler', 'brandstifter', 'kaefer'] },
  explosiv:   { name: TX('Explosiv'),   farbe: '#ff7a30', text: TX('explodiert, wenn er fällt'), erlaubt: ['pluenderer', 'kaefer', 'schildtraeger', 'trommler'] },
  vampirisch: { name: TX('Blutsauger'), farbe: '#d04060', text: TX('heilt sich mit jedem Treffer'), erlaubt: ['wolf', 'heuler', 'pluenderer', 'schuetze'] },
};
const ELITE_CHANCE = { grund: 0.05, proSieg: 0.035, proWelle: 0.04, max: 0.32, leben: 1.6 };

const GEGNER = {
  pluenderer: { name: TX('Plünderer'),       leben: 34,  tempo: 2.6, radius: 0.45, schaden: 9,  reichweite: 1.2, ausholen: 0.55, erholung: 0.7, rueckstoss: 1,    punkte: 10,  gold: [2, 4],   teilChance: 0.3,  bild: 'pl' },
  schuetze:   { name: TX('Armbrustschütze'), leben: 24,  tempo: 2.4, radius: 0.42, schaden: 7,  reichweite: 7.0, ausholen: 0.85, erholung: 1.8, rueckstoss: 1.2, punkte: 14,  gold: [3, 5],   teilChance: 0.35, bild: 'sch', fernkampf: true },
  kaefer:     { name: TX('Rostkäfer'),       leben: 15,  tempo: 4.1, radius: 0.4,  schaden: 7,  reichweite: 2.6, ausholen: 0.45, erholung: 0.8, rueckstoss: 1.4,  punkte: 6,   gold: [1, 2],   teilChance: 0.45, bild: 'kf', sprung: true, roboter: true },
  wolf:       { name: TX('Mutierter Wolf'),  leben: 24,  tempo: 4.3, radius: 0.45, schaden: 8,  reichweite: 2.8, ausholen: 0.5, erholung: 0.8, rueckstoss: 1.2,  punkte: 8,   gold: [0, 2],   teilChance: 0.05, bild: 'wf', sprung: true, fleisch: 0.5 },
  alpha:      { name: TX('Alphawolf'),       leben: 260, tempo: 3.4, radius: 0.9,  schaden: 16, reichweite: 5.0, ausholen: 0.9, erholung: 1.5, rueckstoss: 0.15, punkte: 90,  gold: [12, 18], teilChance: 0.6,  bild: 'aw', sprung: true, sprungTempo: 15, sprungZeit: 0.4, miniboss: true, fleisch: 1 },
  schildtraeger: { name: TX('Schildträger'), leben: 52, tempo: 2.1, radius: 0.5, schaden: 11, reichweite: 1.2, ausholen: 0.75, erholung: 0.9, rueckstoss: 0.45, punkte: 16, gold: [3, 5], teilChance: 0.35, bild: 'st', schild: 70 },
  brandstifter:  { name: TX('Brandstifter'), leben: 22, tempo: 3.5, radius: 0.42, schaden: 20, reichweite: 1.2, ausholen: 1.0, erholung: 0.5, rueckstoss: 1.2, punkte: 12, gold: [2, 4], teilChance: 0.2, bild: 'bs', bombe: 2.2 },
  trommler:      { name: TX('Trommler'), leben: 42, tempo: 2.2, radius: 0.48, schaden: 6, reichweite: 1.1, ausholen: 0.8, erholung: 1.2, rueckstoss: 1, punkte: 18, gold: [4, 6], teilChance: 0.3, bild: 'tr', aura: 5.5, abstand: 6 },
  heuler:        { name: TX('Heuler'), leben: 30, tempo: 3.9, radius: 0.45, schaden: 7, reichweite: 2.4, ausholen: 0.55, erholung: 0.9, rueckstoss: 1.1, punkte: 14, gold: [1, 3], teilChance: 0.05, bild: 'hw', sprung: true, aura: 6, abstand: 5, fleisch: 0.6 },
  funkenkaefer:  { name: TX('Funkenkäfer'), leben: 14, tempo: 4.4, radius: 0.4, schaden: 16, reichweite: 1.0, ausholen: 0.7, erholung: 0.5, rueckstoss: 1.4, punkte: 9, gold: [1, 2], teilChance: 0.6, bild: 'fk', bombe: 1.8, roboter: true },
  // Aufträge: der fliehende Dieb, Zelte und Ausgucke im Plündererlager
  dieb:          { name: TX('Der Fuchs'), leben: 300, tempo: 6.0, radius: 0.42, schaden: 0, reichweite: -1, ausholen: 9, erholung: 1, rueckstoss: 0.5, punkte: 120, gold: [20, 30], teilChance: 1, bild: 'dieb', flieht: true, miniboss: true },
  zelt:          { name: TX('Vorratszelt'), leben: 520, tempo: 0, radius: 1.3, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0, punkte: 60, gold: [12, 20], teilChance: 1, bild: 'zelt', objekt: true },
  ausguck:       { name: TX('Ausguck'), leben: 150, tempo: 0, radius: 0.9, schaden: 6, reichweite: 8.5, ausholen: 1.1, erholung: 1.7, rueckstoss: 0, punkte: 40, gold: [6, 10], teilChance: 0.6, bild: 'ausguck', fernkampf: true, stationaer: true, objekt2: true },
  // Das Kohlekraftwerk: Schutztürme, Wartungsroboter und der Kesselwärter
  schutzturm:    { name: TX('Schutzturm'), leben: 400, tempo: 0, radius: 0.9, schaden: 7, reichweite: 9, ausholen: 1.1, erholung: 1.7, rueckstoss: 0, punkte: 60, gold: [10, 16], teilChance: 1, bild: 'schutzturm', fernkampf: true, stationaer: true, objekt2: true, roboter: true },
  wartungsbot:   { name: TX('Wartungsroboter'), leben: 34, tempo: 3.4, radius: 0.4, schaden: 7, reichweite: 1.1, ausholen: 0.5, erholung: 0.8, rueckstoss: 1.3, punkte: 9, gold: [1, 3], teilChance: 0.6, bild: 'wartungsbot', roboter: true, eigen: 'wartung', flickt: 14 },
  kesselwaerter: { name: TX('Der Kesselwärter'), leben: 1500, tempo: 1.5, radius: 1.5, schaden: 22, reichweite: 2.8, ausholen: 1.0, erholung: 1.2, rueckstoss: 0.04, punkte: 400, gold: [60, 80], teilChance: 1, bild: 'kesselwaerter', boss: true, roboter: true, eigen: 'kessel' },
  // Die Lazi-Fabrik: Drohnen des Vorarbeiters, Wachroboter, die Torsteuerung und der Vorarbeiter selbst
  drohne:        { name: TX('Drohne'), leben: 16, tempo: 4.8, radius: 0.36, schaden: 6, reichweite: 1.0, ausholen: 0.4, erholung: 0.7, rueckstoss: 1.6, punkte: 6, gold: [0, 2], teilChance: 0.3, bild: 'drohne', roboter: true },
  wachbot:       { name: TX('Wachroboter'), leben: 70, tempo: 2.3, radius: 0.5, schaden: 9, reichweite: 6.5, ausholen: 0.9, erholung: 1.6, rueckstoss: 0.6, punkte: 20, gold: [3, 6], teilChance: 0.7, bild: 'wachbot', roboter: true, fernkampf: true },
  schaltkasten:  { name: TX('Torsteuerung'), leben: 420, tempo: 0, radius: 0.9, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0, punkte: 60, gold: [10, 16], teilChance: 1, bild: 'schaltkasten', objekt: true, roboter: true },
  vorarbeiter:   { name: TX('Der Vorarbeiter'), leben: 1900, tempo: 1.3, radius: 1.7, schaden: 22, reichweite: 2.2, ausholen: 1.0, erholung: 1.2, rueckstoss: 0.02, punkte: 500, gold: [80, 110], teilChance: 1, bild: 'vorarbeiter', boss: true, roboter: true, eigen: 'vorarbeiter' },
  // Die Bestehenden: Eiferer mit Ölkanistern und ihre Hauptleute (Nemesis)
  eiferer:       { name: TX('Eiferer'), leben: 30, tempo: 3.3, radius: 0.42, schaden: 18, reichweite: 1.2, ausholen: 0.9, erholung: 0.5, rueckstoss: 1.2, punkte: 14, gold: [2, 5], teilChance: 0.3, bild: 'eiferer', bombe: 2.0 },
  schlaeger:     { name: TX('Schläger'), leben: 40, tempo: 2.7, radius: 0.45, schaden: 11, reichweite: 1.2, ausholen: 0.6, erholung: 0.8, rueckstoss: 0.9, punkte: 12, gold: [3, 6], teilChance: 0.2, bild: 'schlaeger' },
  messerstecher: { name: TX('Messerstecher'), leben: 26, tempo: 3.8, radius: 0.4, schaden: 9, reichweite: 1.1, ausholen: 0.35, erholung: 0.5, rueckstoss: 1.2, punkte: 12, gold: [3, 6], teilChance: 0.2, bild: 'messerstecher' },
  armbruster:    { name: TX('Armbruster'), leben: 26, tempo: 2.4, radius: 0.42, schaden: 8, reichweite: 7.0, ausholen: 0.85, erholung: 1.7, rueckstoss: 1.2, punkte: 14, gold: [3, 6], teilChance: 0.2, bild: 'armbruster', fernkampf: true },
  leibwache:     { name: TX('Leibwache'), leben: 130, tempo: 1.9, radius: 0.6, schaden: 15, reichweite: 1.4, ausholen: 0.8, erholung: 1.1, rueckstoss: 0.3, punkte: 30, gold: [5, 9], teilChance: 0.3, bild: 'leibwache', schild: 60 },
  waagmeister:   { name: TX('Der Waagmeister'), leben: 1400, tempo: 1.6, radius: 1.0, schaden: 18, reichweite: 2.0, ausholen: 0.9, erholung: 1.2, rueckstoss: 0.05, punkte: 450, gold: [70, 100], teilChance: 1, bild: 'waagmeister', boss: true, eigen: 'waage' },
  zaehlsaeule:   { name: TX('Zählsäule'), leben: 320, tempo: 0, radius: 0.7, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0, punkte: 60, gold: [8, 12], teilChance: 1, bild: 'zaehlsaeule', objekt: true, roboter: true },
  ersterZaehler: { name: TX('Der Erste Zähler'), leben: 1800, tempo: 1.5, radius: 1.0, schaden: 20, reichweite: 2.0, ausholen: 0.9, erholung: 1.2, rueckstoss: 0.05, punkte: 600, gold: [90, 120], teilChance: 1, bild: 'ersterZaehler', boss: true, eigen: 'zaehler' },
  // Der Zwiespalt: Bosse, wenn zwei Wege fast gleich schwer wiegen (js/zwiespalt.js)
  schaltwaechter: { name: TX('Der Schaltwächter'), leben: 2400, tempo: 1.5, radius: 1.1, schaden: 20, reichweite: 2.2, ausholen: 0.9, erholung: 1.2, rueckstoss: 0.05, punkte: 650, gold: [90, 120], teilChance: 1, bild: 'schaltwaechter', boss: true, roboter: true, eigen: 'schaltwaechter' },
  treiber:       { name: TX('Der Treiber'), leben: 2300, tempo: 1.9, radius: 1.1, schaden: 22, reichweite: 2.2, ausholen: 0.9, erholung: 1.2, rueckstoss: 0.05, punkte: 650, gold: [90, 120], teilChance: 1, bild: 'treiber', boss: true, roboter: true, eigen: 'treiber' },
  herdenlaeufer: { name: TX('Lastläufer'), leben: 90, tempo: 1.25, radius: 0.6, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0.3, punkte: 5, gold: [0, 1], teilChance: 0.5, bild: 'herdenlaeufer', roboter: true, eigen: 'herde' },
  thronlaeufer:  { name: TX('Lastläufer'), leben: 110, tempo: 1.4, radius: 0.6, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0.3, punkte: 5, gold: [0, 1], teilChance: 0.5, bild: 'herdenlaeufer', roboter: true, eigen: 'thronlaeufer' },
  kernwaagmeister: { name: TX('Der Waagmeister im Kernpanzer'), leben: 2500, tempo: 1.6, radius: 1.0, schaden: 22, reichweite: 2.0, ausholen: 0.9, erholung: 1.2, rueckstoss: 0.05, punkte: 650, gold: [90, 120], teilChance: 1, bild: 'kernwaagmeister', boss: true, eigen: 'kernwaage' },
  nummerNull:    { name: TX('Nummer Null'), leben: 2600, tempo: 2.4, radius: 0.9, schaden: 24, reichweite: 2.0, ausholen: 0.8, erholung: 1.1, rueckstoss: 0.05, punkte: 700, gold: [100, 130], teilChance: 1, bild: 'nummerNull', boss: true, roboter: true, eigen: 'nummer' },
  kabelknoten:   { name: TX('Kabelknoten'), leben: 300, tempo: 0, radius: 0.7, schaden: 0, reichweite: -1, ausholen: 99, erholung: 1, rueckstoss: 0, punkte: 40, gold: [5, 9], teilChance: 1, bild: 'kabelknoten', objekt: true, roboter: true },
  hauptmann:     { name: TX('Eiferer-Hauptmann'), leben: 420, tempo: 2.6, radius: 0.6, schaden: 16, reichweite: 2.2, ausholen: 0.8, erholung: 1, rueckstoss: 0.2, punkte: 150, gold: [30, 45], teilChance: 1, bild: 'hauptmann', miniboss: true, eigen: 'hauptmann' },
  golem:      { name: TX('Wächter-Golem'),   leben: 400, tempo: 1.5, radius: 1.3,  schaden: 24, reichweite: 3.0, ausholen: 1.2, erholung: 1.4, rueckstoss: 0.06, punkte: 150, gold: [30, 40], teilChance: 1,    bild: 'gl', boss: true, roboter: true },
};

// Der dunkle Wald: Nachtwache am Lagerfeuer
const WELLEN_WALD = [
  { titel: TX('Augen im Nebel'),               gegner: [['wolf', 5]] },
  { titel: TX('Fackeln zwischen den Bäumen'),  gegner: [['wolf', 3], ['heuler', 1], ['pluenderer', 2]] },
  { titel: TX('Der Alpha'),                    gegner: [['alpha', 1], ['wolf', 4]] },
];
// Geheimmission: Der Hort des Alphas
const WELLEN_HORT = [
  { titel: TX('Das Rudel wittert dich'),       gegner: [['wolf', 7], ['heuler', 1]] },
  { titel: TX('Zwei Alphas'),                  gegner: [['alpha', 2], ['wolf', 4]] },
];
// Lagerfeuer im Wald: brennt langsam herunter, Holz lässt es wieder auflodern
const LAGERFEUER = { leben: 300, verfallProSek: 2.2, holzWert: 40, holzMax: 3, totholzAlle: 11 };

// Bunker in der Stadt: Plünderer wollen die Menschen abfangen, später kommen Maschinen dazu
const WELLEN_BUNKER = [
  { titel: TX('Das Licht wird grün'),        gegner: [['pluenderer', 4], ['schuetze', 1]] },
  { titel: TX('Die Plünderer wittern Beute'), gegner: [['pluenderer', 4], ['kaefer', 3], ['brandstifter', 1], ['schuetze', 1]] },
  { titel: TX('Die letzten kommen heraus'),   gegner: [['pluenderer', 3], ['schildtraeger', 2], ['trommler', 1], ['schuetze', 2], ['kaefer', 2]] },
];
// Der Lesesaal unter der Universität: Eiferer wollen die große Lazi-Tafel zerschlagen, Käfer fressen das Kupfer
const WELLEN_LESESAAL = [
  { titel: TX('Die Tafel erwacht'),        gegner: [['kaefer', 4], ['eiferer', 2], ['pluenderer', 1]] },
  { titel: TX('Öl auf den Regalen'),        gegner: [['eiferer', 3], ['funkenkaefer', 3], ['schildtraeger', 1], ['kaefer', 2]] },
  { titel: TX('Die Salbung des Wissens'),   gegner: [['eiferer', 4], ['wartungsbot', 2], ['schuetze', 2], ['funkenkaefer', 2]], nemesis: true },
];
// Der Fuchs wird ab und zu in der Stadt gesehen (Chance pro Tag), das erste Mal sicher
const FUCHS = { chance: 0.12, abEpoche: 1, abUniSiegen: 2, pause: 4 };   // pause: so viele Tage nach einer Jagd bleibt er weg

const WELLEN = [
  { titel: TX('Plünderer vom Fluss'),      gegner: [['pluenderer', 5], ['schildtraeger', 1], ['schuetze', 1]] },
  { titel: TX('Rostkäfer aus den Ruinen'), gegner: [['pluenderer', 3], ['kaefer', 5], ['schuetze', 2], ['brandstifter', 2], ['trommler', 1]] },
  { titel: TX('Der Wächter erwacht'),      gegner: [['golem', 1], ['pluenderer', 4], ['schildtraeger', 2], ['kaefer', 3], ['funkenkaefer', 2], ['schuetze', 2], ['trommler', 1]] },
];

// Seltenheit: Farbe, Verkaufswert, Lazi-Teile beim Zerlegen, Anzahl Zusatzwerte,
// wie stark die Werte sind (mal) und wie wahrscheinlich eine Sonderwirkung ist
const SELTENHEIT = [
  { name: TX('Gewöhnlich'), farbe: '#d8d0b8', wert: 15,  teile: 1,  zusatz: 0, mal: 1,   effektChance: 0 },
  { name: TX('Selten'),     farbe: '#5b9cff', wert: 40,  teile: 3,  zusatz: 1, mal: 1.3, effektChance: 0.08 },
  { name: TX('Episch'),     farbe: '#b46aff', wert: 90,  teile: 6,  zusatz: 2, mal: 1.7, effektChance: 0.2 },
  { name: TX('Legendär'),   farbe: '#ff9a3a', wert: 200, teile: 12, zusatz: 3, mal: 2.2, effektChance: 1 },
  { name: TX('Lazi'),       farbe: '#3ff0d8', wert: 420, teile: 25, zusatz: 4, mal: 3,   effektChance: 1 },
];
// Wie oft welche Seltenheit fällt (Lazi gibt es nur aus Geheimmissionen und von Bossen)
const BEUTE = {
  seltenheit: [60, 28, 10, 2, 0],          // Gewichte für Truhen und Gegner
  truheItemChance: 0.6,                    // nicht jede Truhe enthält einen Gegenstand
  eliteItemChance: 0.15, bossSeltenheit: [0, 50, 35, 13, 2],
  geheimSeltenheit: [0, 0, 0, 80, 20],
  art: { waffe: 40, ruestung: 35, modul: 25 },
  laziAusHort: 0.2,
};
// Werte auf Ausrüstung, mit Pixel-Symbol in Beutel und Karten
// pro: Spanne je Zusatzwurf (wird mit der Seltenheit multipliziert)
const WERTE = {
  schaden:    { name: TX('Schaden'),       einheit: '',   pro: [2, 4] },
  tempo:      { name: TX('Angriffstempo'), einheit: ' %', pro: [4, 8] },
  mana:       { name: TX('Mana'),          einheit: '',   pro: [6, 12] },
  leben:      { name: TX('Leben'),         einheit: '',   pro: [6, 14] },
  ruestung:   { name: TX('Rüstung'),       einheit: ' %', pro: [3, 6] },
  ausweichen: { name: TX('Ausweichen'),    einheit: ' %', pro: [2, 4] },
  krit:       { name: TX('Kritisch'),      einheit: ' %', pro: [3, 6] },
};
// Welche Zusatzwerte und Sonderwirkungen auf welcher Art Ausrüstung vorkommen
const ZUSATZ = {
  waffe:    { werte: ['schaden', 'tempo', 'krit', 'mana'], effekte: ['brennen', 'gift', 'blutung', 'frost', 'lebensraub', 'durchschlag'] },
  ruestung: { werte: ['leben', 'ruestung', 'ausweichen'], effekte: ['dornen', 'regeneration', 'tempo'] },
  modul:    { werte: ['mana', 'krit', 'tempo', 'leben', 'ausweichen'], effekte: ['manaraub', 'ueberladen', 'lebensraub'] },
};
const GRENZEN = { ruestung: 60, ausweichen: 40, krit: 60 };   // höchstens so viel Prozent
const GRUND_KRIT = 5, KRIT_MAL = 1.75;

const EFFEKTE = {
  brennen:     TX('Brennen: Treffer setzen Gegner 3 s in Brand'),
  gift:        TX('Gift: Treffer vergiften 4 s lang, bis zu dreifach'),
  blutung:     TX('Blutung: Treffer lassen Gegner 4 s bluten'),
  frost:       TX('Frost: Treffer kühlen ab, beim dritten Mal friert der Gegner ein'),
  tempo:       TX('Leichtfuß: +15 % Lauftempo'),
  lebensraub:  TX('Lebensraub: heilt 8 % des verursachten Schadens'),
  durchschlag: TX('Durchschlag: ignoriert Schilde und Panzerung'),
  kette:       TX('Kettenblitz: jeder Stromstoß trifft einen Gegner mehr'),
  golemkraft:  TX('Golemkern: deine Golems machen 30 % mehr Schaden'),
  baumeister:  TX('Baumeister: Bauwerke kosten 1 Schrott weniger und stehen schneller'),
  dornen:      TX('Dornen: Angreifer erleiden 30 % ihres Schadens selbst'),
  regeneration:TX('Regeneration: heilt 1 Leben pro Sekunde'),
  manaraub:    TX('Manaraub: jeder Treffer gibt 2 Mana mehr'),
  ueberladen:  TX('Überladen: Fähigkeiten (Q, E, R) machen 25 % mehr Schaden'),
};
// Rüstungen: für alle Klassen. selten = ab welcher Seltenheit sie vorkommen
const RUESTUNGEN = [
  { id: 'lumpen',      name: TX('Geflickte Lumpen'),      art: 'lumpen', selten: 0, werte: { leben: 5, ruestung: 2 } },
  { id: 'lederwams',   name: TX('Lederwams'),             art: 'leder',  selten: 0, werte: { leben: 10, ruestung: 5 } },
  { id: 'kapuzenmantel', name: TX('Kapuzenmantel'),       art: 'mantel', selten: 0, werte: { leben: 6, ruestung: 3, ausweichen: 5 } },
  { id: 'kettenhemd',  name: TX('Rostiges Kettenhemd'),   art: 'kette',  selten: 0, werte: { leben: 14, ruestung: 9 } },
  { id: 'ruinenpanzer', name: TX('Ruinenstahl-Panzer'),   art: 'platte', selten: 1, werte: { leben: 22, ruestung: 13 } },
  { id: 'laziweste',   name: TX('Lazi-Weste'),            art: 'weste',  selten: 2, werte: { leben: 12, ruestung: 8, mana: 15 } },
];
// Lazi-Module: Amulette aus alter Technik
const MODULE = [
  { id: 'spule',   name: TX('Kupferspule'),       art: 'spule',   selten: 0, werte: { mana: 15 } },
  { id: 'zahnrad', name: TX('Zahnrad-Amulett'),   art: 'zahnrad', selten: 0, werte: { tempo: 6 } },
  { id: 'linse',   name: TX('Gesprungene Linse'), art: 'linse',   selten: 0, werte: { krit: 6 } },
  { id: 'chip',    name: TX('Alter Rechenchip'),  art: 'chip',    selten: 1, werte: { mana: 10, tempo: 4 } },
  { id: 'kern',    name: TX('Lazi-Kern'),         art: 'kern',    selten: 2, werte: { mana: 25, krit: 4 } },
];
const ART_NAME = { waffe: TX('Waffe'), ruestung: TX('Rüstung'), modul: TX('Lazi-Modul') };
const WAFFENTYP = { dolche: TX('Dolche'), kurzschwert: TX('Kurzschwert'), langschwert: TX('Langschwert'), dolch: TX('Dolch'), axt: TX('Axt'), beil: TX('Beil'), stab: TX('Techno-Stab'), hammer: TX('Hammer') };
// klasse: wer die Waffe benutzt. typ: Waffenart (Schwertkämpfer +30 % mit Kurzschwert, Langschwert, Dolch).
// art: wie sie in der Hand aussieht.
const WAFFEN = [
  // Schwertkämpfer
  { id: 'kurzschwert', klasse: 'schwert', typ: 'kurzschwert', name: TX('Rostiges Kurzschwert'),  selten: 0, schaden: 0, tempo: 1.0,  art: 'schwert' },
  { id: 'soeldner',    klasse: 'schwert', typ: 'langschwert', name: TX('Söldner-Langschwert'),   selten: 0, schaden: 3, tempo: 1.05, art: 'langschwert' },
  { id: 'rostdolch',   klasse: 'schwert', typ: 'dolch',       name: TX('Rostdolch'),             selten: 0, schaden: 0, tempo: 0.75, art: 'dolch' },
  { id: 'hackbeil',    klasse: 'schwert', typ: 'beil',        name: TX('Plünderer-Hackbeil'),    selten: 0, schaden: 4, tempo: 1.1,  art: 'beil' },
  { id: 'axt',         klasse: 'schwert', typ: 'axt',         name: TX('Schwere Holzfälleraxt'), selten: 0, schaden: 7, tempo: 1.3,  art: 'axt' },
  { id: 'ruinenstahl', klasse: 'schwert', typ: 'langschwert', name: TX('Ruinenstahl-Klinge'),    selten: 1, schaden: 5, tempo: 1.0,  art: 'langschwert', effekt: 'brennen' },
  { id: 'puls',        klasse: 'schwert', typ: 'kurzschwert', name: TX('Lazi-Pulsklinge'),       selten: 1, schaden: 4, tempo: 0.85, art: 'schwert', effekt: 'tempo' },
  { id: 'aderlass',    klasse: 'schwert', typ: 'dolch',       name: TX('Aderlass-Dolch'),        selten: 1, schaden: 3, tempo: 0.7,  art: 'dolch', effekt: 'lebensraub' },
  { id: 'spalter',     klasse: 'schwert', typ: 'axt',         name: TX('Ahnen-Spalter'),         selten: 1, schaden: 9, tempo: 1.25, art: 'axt', effekt: 'brennen' },
  // Golem-Beschwörer
  { id: 'rute',        klasse: 'beschwoerer', typ: 'stab', name: TX('Lazi-Rute'),           selten: 0, schaden: 0, tempo: 1.0,  art: 'stab' },
  { id: 'kupferspule', klasse: 'beschwoerer', typ: 'stab', name: TX('Kupferspulen-Stab'),   selten: 0, schaden: 2, tempo: 0.9,  art: 'stab' },
  { id: 'erdstab',     klasse: 'beschwoerer', typ: 'stab', name: TX('Geerdeter Stab'),      selten: 0, schaden: 4, tempo: 1.15, art: 'stab' },
  { id: 'sturmstab',   klasse: 'beschwoerer', typ: 'stab', name: TX('Sturmstab der Alten'), selten: 1, schaden: 3, tempo: 0.95, art: 'stab', effekt: 'kette' },
  { id: 'kernstab',    klasse: 'beschwoerer', typ: 'stab', name: TX('Golemkern-Stab'),      selten: 1, schaden: 2, tempo: 1.0,  art: 'stab', effekt: 'golemkraft' },
  { id: 'saugstab',    klasse: 'beschwoerer', typ: 'stab', name: TX('Saugspulen-Stab'),     selten: 1, schaden: 3, tempo: 1.0,  art: 'stab', effekt: 'lebensraub' },
  // Architekt
  { id: 'hammer',      klasse: 'architekt', typ: 'hammer', name: TX('Schmiedehammer'),      selten: 0, schaden: 0, tempo: 1.0,  art: 'hammer' },
  { id: 'vorschlag',   klasse: 'architekt', typ: 'hammer', name: TX('Vorschlaghammer'),     selten: 0, schaden: 6, tempo: 1.3,  art: 'hammer' },
  { id: 'nagelhammer', klasse: 'architekt', typ: 'hammer', name: TX('Nagelhammer'),         selten: 0, schaden: 2, tempo: 0.85, art: 'hammer' },
  { id: 'nieter',      klasse: 'architekt', typ: 'hammer', name: TX('Lazi-Nieter'),         selten: 1, schaden: 3, tempo: 0.9,  art: 'hammer', effekt: 'baumeister' },
  { id: 'funkenhammer',klasse: 'architekt', typ: 'hammer', name: TX('Funkenhammer'),        selten: 1, schaden: 5, tempo: 1.0,  art: 'hammer', effekt: 'brennen' },
  { id: 'flinkhammer', klasse: 'architekt', typ: 'hammer', name: TX('Flinker Hammer'),      selten: 1, schaden: 3, tempo: 0.9,  art: 'hammer', effekt: 'tempo' },
  // Legendär: nur aus Geheimmissionen
  { id: 'morgenroete', klasse: 'schwert',     typ: 'langschwert', name: TX('Morgenröte der Alten'),      selten: 3, schaden: 11, tempo: 0.9,  art: 'langschwert', effekt: 'brennen' },
  { id: 'herzspule',   klasse: 'beschwoerer', typ: 'stab',        name: TX('Herzspule von L.A.C.I.'),    selten: 3, schaden: 7,  tempo: 0.85, art: 'stab',        effekt: 'golemkraft' },
  { id: 'urhammer',    klasse: 'architekt',   typ: 'hammer',      name: TX('Hammer des ersten Baumeisters'), selten: 3, schaden: 10, tempo: 0.9, art: 'hammer',   effekt: 'baumeister' },
  { id: 'zwielicht',   klasse: 'schatten',    typ: 'dolch',       name: TX('Zwielicht-Dolche'),          selten: 3, schaden: 8,  tempo: 0.8,  art: 'dolche',      effekt: 'lebensraub' },
  // Schattenläufer
  { id: 'zwillingsdolche', klasse: 'schatten', typ: 'dolch', name: TX('Zwillingsdolche'),     selten: 0, schaden: 0, tempo: 1.0,  art: 'dolche' },
  { id: 'kurzklingen',     klasse: 'schatten', typ: 'dolch', name: TX('Rostige Kurzklingen'), selten: 0, schaden: 2, tempo: 0.9,  art: 'dolche' },
  { id: 'krummdolche',     klasse: 'schatten', typ: 'dolch', name: TX('Krummdolche'),         selten: 0, schaden: 4, tempo: 1.1,  art: 'dolche' },
  { id: 'nachtklingen',    klasse: 'schatten', typ: 'dolch', name: TX('Nachtklingen'),        selten: 1, schaden: 3, tempo: 0.85, art: 'dolche', effekt: 'tempo' },
  { id: 'giftzaehne',      klasse: 'schatten', typ: 'dolch', name: TX('Giftzähne'),           selten: 1, schaden: 3, tempo: 1.0,  art: 'dolche', effekt: 'brennen' },
  { id: 'blutdolche',      klasse: 'schatten', typ: 'dolch', name: TX('Blutdolche'),          selten: 1, schaden: 4, tempo: 1.0,  art: 'dolche', effekt: 'lebensraub' },
];

// =====================================================================
// STUFEN UND FÄHIGKEITEN
// Gegner und Missionen bringen Erfahrung. Jede Stufe gibt einen Punkt
// für Leben, Angriffstempo oder Schaden. Auf den Meilenstein-Stufen
// wählst du eine von zwei Fähigkeiten, wie bei einer Weggabelung.
// =====================================================================
const STUFEN = {
  erfahrung: stufe => 100 + (stufe - 1) * 75 + (stufe - 1) * (stufe - 1) * 8,   // so viel Erfahrung braucht es bis zur nächsten Stufe
  proSieg: 1, missionSieg: 100, missionNiederlage: 40,
  werte: {
    leben:   { name: TX('Leben'),         pro: 8,    text: TX('+8 Leben') },
    tempo:   { name: TX('Angriffstempo'), pro: 0.04, text: TX('4 % schnellere Angriffe') },
    schaden: { name: TX('Schaden'),       pro: 0.05, text: TX('+5 % Schaden') },
  },
  meilensteine: [3, 6, 9],
};
const FAEHIGKEITEN = {
  schwert: {
    3: [{ id: 'klingensturm', name: TX('Schneller Wirbel'), text: TX('Der Wirbelschlag lädt 40 % schneller.') },
        { id: 'schildwall', name: TX('Schildwall'), text: TX('Du nimmst 20 % weniger Schaden.') }],
    6: [{ id: 'ausfall', name: TX('Ausfall'), text: TX('Deine Rolle verletzt jeden Gegner, durch den du rollst.') },
        { id: 'zweiteratem', name: TX('Zweiter Atem'), text: TX('Jeder besiegte Gegner heilt dich um 3.') }],
    9: [{ id: 'henkersschlag', name: TX('Henkersschlag'), text: TX('Der dritte Schlag der Combo macht doppelten Schaden.') },
        { id: 'turmmeister', name: TX('Turmmeister'), text: TX('Lazi-Türme kosten 2 Teile weniger, du darfst einen mehr bauen.') }],
  },
  beschwoerer: {
    3: [{ id: 'grosserkreis', name: TX('Großer Kreis'), text: TX('Ein Golem mehr gleichzeitig.') },
        { id: 'schnellespulen', name: TX('Schnelle Spulen'), text: TX('Energie lädt 40 % schneller.') }],
    6: [{ id: 'ueberladung', name: TX('Überladung'), text: TX('Der Stromstoß trifft zwei Gegner mehr.') },
        { id: 'zaehegolems', name: TX('Zähe Golems'), text: TX('Golems haben 50 % mehr Leben und halten 50 % länger.') }],
    9: [{ id: 'kettenreaktion', name: TX('Kettenreaktion'), text: TX('Golems explodieren am Ende und treffen alles in der Nähe.') },
        { id: 'elementarmeister', name: TX('Elementarmeister'), text: TX('Golems machen 40 % mehr Schaden.') }],
  },
  architekt: {
    3: [{ id: 'schnellbau', name: TX('Schnellbau'), text: TX('Bauwerke stehen doppelt so schnell.') },
        { id: 'sparsam', name: TX('Sparsamkeit'), text: TX('Bauwerke kosten 1 Schrott weniger.') }],
    6: [{ id: 'verstaerkt', name: TX('Verstärkte Bauweise'), text: TX('Bauwerke haben 60 % mehr Leben.') },
        { id: 'schwererhammer', name: TX('Schwerer Hammer'), text: TX('Der Hammer macht 50 % mehr Schaden und stößt weiter zurück.') }],
    9: [{ id: 'grossbaustelle', name: TX('Großbaustelle'), text: TX('Zwei Bauwerke mehr gleichzeitig.') },
        { id: 'notreparatur', name: TX('Notreparatur'), text: TX('Der Hammer repariert dreimal so viel.') }],
  },
  schatten: {
    3: [{ id: 'langersprung', name: TX('Langer Sprung'), text: TX('Der Phasensprung reicht 40 % weiter.') },
        { id: 'schattenreserve', name: TX('Schattenreserve'), text: TX('Die Phase startet halb voll und verfällt nicht.') }],
    6: [{ id: 'giftklingen', name: TX('Giftklingen'), text: TX('Jeder Treffer vergiftet: 3 Schaden pro Sekunde für 3 s.') },
        { id: 'nachbild', name: TX('Nachbild'), text: TX('Nach einem Sprung bleibt 2 s ein Schattenbild stehen, das Gegner angreifen.') }],
    9: [{ id: 'hinrichtung', name: TX('Hinrichtung'), text: TX('Gegner unter 25 % Leben fallen durch deinen nächsten Treffer sofort (nicht der Boss).') },
        { id: 'zeitriss', name: TX('Zeitriss'), text: TX('Ein perfektes Ausweichen verlangsamt alle Gegner 2 s lang.') }],
  },
};

// =====================================================================
// DORF
// =====================================================================

// groesse: Breite x Tiefe in Feldern. arbeiter: so viele Einwohner arbeiten dort.
// kategorie: in welchem Reiter der Bauleiste das Gebäude steht.
// stufen: was das Gebäude auf jeder Ausbaustufe bewirkt. Stufe 1 ist der Neubau,
//   ab Stufe 2 kann man es ausbauen, sobald die Epoche erreicht ist.
//   Werte: wohnraum, nahrungProTag, vorrat, holzProTag, steinProTag,
//   kohleProTag (verbraucht holzVerbrauch), beschlaegeProTag (verbraucht kohleVerbrauch),
//   stimmung (Lebensstandard), schaden (Missionsbonus), siedler (alle n Tage ein Siedler)
const KATEGORIEN = {
  stadt:        { name: TX('Stadt') },
  deko:         { name: TX('Deko') },
  produktion:   { name: TX('Produktion') },
  militaer:     { name: TX('Militär') },
  verteidigung: { name: TX('Verteidigung') },
  politik:      { name: TX('Politik') },
};
const GEBAEUDE = {
  lagerfeuer: { name: TX('Lagerfeuer'), kategorie: 'stadt', groesse: [4, 4], kosten: {}, arbeiter: 0, epoche: 0, fest: true,
                text: TX('Das Herz des Dorfes. Hier kommen die Neuankömmlinge zuerst an. Jeder verlorene Überfall verletzt es, und es heilt nur langsam. Erlischt es, ist das Dorf verloren.'), stufen: [{}] },
  // ---------- Stadt ----------
  wohnhaus:   { name: TX('Wohnhaus'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 40, holz: 18 }, arbeiter: 0, epoche: 0,
                text: TX('Platz für Einwohner. Ohne Wohnraum ziehen Überlebende weiter.'),
                stufen: [{ wohnraum: 5, wirkung: TX('+5 Wohnraum') },
                         { name: TX('Steinhaus'), epoche: 1, kosten: { gold: 30, stein: 30, holz: 15, beschlaege: 4 }, wohnraum: 9, stimmung: 2, wirkung: TX('+9 Wohnraum · +2 Lebensstandard') },
                         { name: TX('Bürgerhaus'), epoche: 2, kosten: { gold: 70, stein: 50, beschlaege: 10 }, wohnraum: 13, stimmung: 4, wirkung: TX('+13 Wohnraum · +4 Lebensstandard') }] },
  lager:      { name: TX('Nahrungslager'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 40, holz: 14 }, arbeiter: 1, epoche: 0,
                text: TX('Sammler bringen etwas Nahrung, vor allem aber lagert es Vorräte. Jeder Einwohner isst 1 Nahrung pro Tag.'),
                stufen: [{ nahrungProTag: 6, vorrat: 60, wirkung: TX('+6 Nahrung pro Tag · +60 Vorrat') },
                         { name: TX('Kornspeicher'), epoche: 1, kosten: { gold: 30, holz: 30, stein: 25, beschlaege: 4 }, nahrungProTag: 8, vorrat: 140, wirkung: TX('+8 Nahrung pro Tag · +140 Vorrat') },
                         { name: TX('Vorratshalle'), epoche: 2, kosten: { gold: 80, stein: 60, beschlaege: 10 }, nahrungProTag: 10, vorrat: 260, wirkung: TX('+10 Nahrung pro Tag · +260 Vorrat') }] },
  wirtshaus:  { name: TX('Wirtshaus'), kategorie: 'stadt', groesse: [6, 4], kosten: { gold: 70, holz: 35, stein: 10 }, arbeiter: 1, epoche: 0, max: 1,
                text: TX('Hier trinkt man, hier redet man. Wer zuhört, erfährt Gerüchte über Orte und Leute.'),
                stufen: [{ stimmung: 7, wirkung: TX('+7 Lebensstandard · Gespräche und Gerüchte') },
                         { name: TX('Gasthof'), epoche: 1, kosten: { gold: 90, stein: 30, beschlaege: 6 }, stimmung: 12, wirkung: TX('+12 Lebensstandard · mehr Gerüchte') },
                         { name: TX('Brauhaus'), epoche: 2, kosten: { gold: 160, stein: 50, holz: 60, beschlaege: 12 }, stimmung: 18, wirkung: TX('+18 Lebensstandard · eigenes Bier, die Leute sind zufriedener') }] },
  kirche:     { name: TX('Kirche'), kategorie: 'stadt', groesse: [6, 4], kosten: { gold: 120, holz: 30, stein: 45 }, arbeiter: 1, epoche: 1, max: 1,
                text: TX('Ein Ort für die, die noch an etwas glauben wollen. Die Nachbardörfer sehen das gern, und Fremde fühlen sich willkommen.'),
                stufen: [{ stimmung: 5, ansehen: 0.2, siedler: 4, wirkung: TX('+5 Lebensstandard · besseres Ansehen · ab und zu ein Pilger') },
                         { name: TX('Kirche mit Glockenturm'), epoche: 1, kosten: { gold: 160, stein: 70, beschlaege: 10 }, stimmung: 8, ansehen: 0.3, siedler: 3, vorwarnung: 1,
                           wirkung: TX('+8 Lebensstandard · mehr Pilger · die Glocke warnt 1 Tag früher vor Überfällen') },
                         { name: TX('Dom'), epoche: 2, kosten: { gold: 300, stein: 140, beschlaege: 20 }, stimmung: 12, ansehen: 0.4, siedler: 2, vorwarnung: 1,
                           wirkung: TX('+12 Lebensstandard · viele Pilger · Nachbarn vertrauen euch') }] },
  klaeranlage:{ name: TX('Kläranlage'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 140, stein: 60, beschlaege: 10 }, arbeiter: 2, epoche: 2, max: 2,
                text: TX('Becken, Filter und eine Pumpe. Sie holt das Rostwasser aus dem Bach, das Kraftwerk und Maschinen seit Jahrhunderten hineinleiten.'),
                stufen: [{ klaeren: 2, wirkung: TX('−2 Verschmutzung pro Tag') },
                         { name: TX('Großes Klärwerk'), epoche: 2, kosten: { gold: 160, stein: 60, beschlaege: 16, teile: 10 }, klaeren: 4, wirkung: TX('−4 Verschmutzung pro Tag') }] },
  altmetall:  { name: TX('Altmetall-Sammelstelle'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 140, holz: 40, stein: 30, beschlaege: 10 }, arbeiter: 2, epoche: 3, max: 2, bild: 'stufe',
                text: TX('Sammler holen Altmetall aus den Ruinen: Träger, Bleche, Kabel. Die Lazi-Fabrik macht daraus Lazi-Teile. Steht der Verbund Logistik auf eurer Seite, helfen Lastläufer beim Tragen.'),
                stufen: [{ altmetallProTag: 3, wirkung: TX('+3 Altmetall pro Tag') },
                         { name: TX('Schrottplatz mit Kran'), epoche: 3, kosten: { gold: 120, beschlaege: 14, teile: 10 }, altmetallProTag: 5, wirkung: TX('+5 Altmetall pro Tag') },
                         { name: TX('Sortieranlage'), epoche: 3, kosten: { gold: 180, beschlaege: 20, teile: 20 }, altmetallProTag: 8, wirkung: TX('+8 Altmetall pro Tag') }] },
  // ---- Neue Gebäude (nach 5.5). bild: 'stufe' = ein Bild je Ausbaustufe, 'strom' = aus/an, 'anim' = Bilder im Wechsel.
  // strom: true = wirkt nur, solange Strom fließt (gebaeudeWert zählt es sonst nicht mit)
  fischerhuette: { name: TX('Fischerhütte'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 30, holz: 20 }, arbeiter: 1, epoche: 0, bild: 'stufe',
                text: TX('Am Bach wird geangelt und mit Reusen gefischt. Wenig Arbeit, ordentlich Nahrung. Rostwasser im Bach mögen die Fische allerdings nicht.'),
                stufen: [{ nahrungProTag: 6, wirkung: TX('+6 Nahrung pro Tag') },
                         { name: TX('Fischerei mit Steg'), epoche: 1, kosten: { gold: 40, holz: 25, beschlaege: 3 }, nahrungProTag: 9, wirkung: TX('+9 Nahrung pro Tag') },
                         { name: TX('Räucherei'), epoche: 2, kosten: { gold: 70, stein: 30, holzkohle: 10 }, nahrungProTag: 13, vorrat: 60, wirkung: TX('+13 Nahrung pro Tag · +60 Vorrat, Räucherfisch hält lange') }] },
  kraeutergarten: { name: TX('Kräutergarten'), kategorie: 'produktion', groesse: [4, 2], kosten: { gold: 20, holz: 10 }, arbeiter: 1, epoche: 0, max: 2, bild: 'stufe',
                text: TX('Kamille, Salbei, Ringelblume. Mit Kräutern im Vorrat nimmst du einen Kräuterbeutel mit in jede Mission: Geht es dir schlecht, heilt er dich einmal. Auch Kranke im Dorf brauchen Kräuter.'),
                stufen: [{ kraeuterProTag: 1, stimmung: 1, wirkung: TX('+1 Kräuter pro Tag · +1 Lebensstandard') },
                         { name: TX('Großer Kräutergarten'), epoche: 1, kosten: { gold: 30, holz: 15, stein: 10 }, kraeuterProTag: 2, stimmung: 2, wirkung: TX('+2 Kräuter pro Tag · +2 Lebensstandard') }] },
  spaeherposten: { name: TX('Späherposten'), kategorie: 'verteidigung', groesse: [4, 4], kosten: { gold: 35, holz: 25 }, arbeiter: 1, epoche: 0, max: 1, bild: 'stufe',
                text: TX('Ein Hochsitz am Waldrand mit einem Späher, der kaum schläft. Er sieht Überfälle einen Tag früher und weiß, wie stark sie sind. Auf der Weltkarte sagt er, ob unterwegs etwas wartet.'),
                stufen: [{ vorwarnung: 1, spaeher: true, wirkung: TX('Überfälle 1 Tag früher erkennen, mit Stärke · Weltkarte: ob unterwegs etwas wartet') },
                         { name: TX('Späherturm'), epoche: 1, kosten: { gold: 40, stein: 20, beschlaege: 4 }, vorwarnung: 1, spaeher: true, anfrageDauer: 1, wirkung: TX('Dazu: Anfragen und Gerüchte bleiben einen Tag länger') }] },
  rathaus:    { name: TX('Rathaus'), kategorie: 'stadt', groesse: [6, 4], kosten: { gold: 120, stein: 40, holz: 30 }, arbeiter: 2, epoche: 1, max: 1, bild: 'stufe',
                text: TX('Hier wird gestritten, abgestimmt und Steuern eingetrieben. Einmal in der Woche ruft der Rat das Dorf zusammen und lässt dich entscheiden.'),
                stufen: [{ steuer: 0.5, ansehen: 0.2, versammlung: true, wirkung: TX('Steuern: 1 Gold pro 2 Einwohner am Tag · Dorfversammlung jede Woche · besseres Ansehen') },
                         { name: TX('Rathaus mit Uhrturm'), epoche: 2, kosten: { gold: 150, stein: 60, beschlaege: 12 }, steuer: 0.75, ansehen: 0.3, versammlung: true, stimmung: 3, wirkung: TX('Steuern: 3 Gold pro 4 Einwohner · +3 Lebensstandard') },
                         { name: TX('Stadthalle'), epoche: 3, kosten: { gold: 220, stein: 80, beschlaege: 18, teile: 15 }, steuer: 1, ansehen: 0.4, versammlung: true, stimmung: 5, wirkung: TX('Steuern: 1 Gold pro Einwohner · +5 Lebensstandard') }] },
  baeckerei:  { name: TX('Bäckerei'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 50, holz: 20, stein: 20 }, arbeiter: 2, epoche: 1, max: 2, bild: 'anim',
                text: TX('Aus Korn und Holzkohle wird Brot. Brot macht satter als rohes Korn und riecht nach Zuhause. Ohne Holzkohle bleibt der Ofen kalt.'),
                stufen: [{ backen: 0.15, backKohle: 1, stimmung: 3, wirkung: TX('Nahrung +15 % · braucht 1 Holzkohle pro Tag · +3 Lebensstandard') },
                         { name: TX('Große Backstube'), epoche: 2, kosten: { gold: 70, stein: 30, beschlaege: 6 }, backen: 0.25, backKohle: 2, stimmung: 4, wirkung: TX('Nahrung +25 % · braucht 2 Holzkohle pro Tag · +4 Lebensstandard') }] },
  archiv:     { name: TX('Archiv'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 80, stein: 40, holz: 20 }, arbeiter: 1, epoche: 1, max: 1, bild: 'stufe',
                text: TX('Ebert ordnet hier alles, was ihr findet. Forschung braucht weniger Bücher, und manchmal stößt er in seinen Notizen auf einen Hinweis, wo noch etwas für die Chronik zu finden ist.'),
                stufen: [{ archiv: 1, hinweisAlle: 5, wirkung: TX('Forschung braucht 1 Buch weniger · alle 5 Tage ein Hinweis von Ebert') },
                         { name: TX('Großes Archiv'), epoche: 2, kosten: { gold: 90, stein: 40, beschlaege: 8 }, archiv: 2, hinweisAlle: 3, wirkung: TX('Forschung braucht 2 Bücher weniger · alle 3 Tage ein Hinweis') }] },
  lastlaeuferdepot: { name: TX('Lastläufer-Depot'), kategorie: 'stadt', groesse: [6, 4], kosten: { gold: 150, holz: 40, stein: 40, beschlaege: 12 }, arbeiter: 1, epoche: 2, max: 1, bild: 'stufe',
                text: TX('Ein Stellplatz für Lastläufer. Sie holen die Handelsware aus den Nachbardörfern, dafür vergeht kein Tag mehr. Der Verbund Logistik fragt öfter nach Geleitschutz, und ab Epoche 4 bringen sie Altmetall mit.'),
                stufen: [{ depot: true, handel: 0.9, altmetallPlus: 1, wirkung: TX('Handeln kostet keinen Tag · Preise −10 % · mehr Konvoi-Anfragen · +1 Altmetall pro Tag ab Epoche 4') },
                         { name: TX('Großes Depot'), epoche: 3, kosten: { gold: 120, beschlaege: 14, teile: 10 }, depot: true, handel: 0.85, altmetallPlus: 2, wirkung: TX('Preise −15 % · +2 Altmetall pro Tag') }] },
  ladestation: { name: TX('Ladestation'), kategorie: 'militaer', groesse: [4, 4], kosten: { gold: 140, stein: 30, beschlaege: 12, teile: 15 }, arbeiter: 1, epoche: 2, max: 1, strom: true, bild: 'strom',
                text: TX('Geladene Lazi-Zellen für unterwegs. Türme, Golems und Bauwerke halten in Missionen mehr aus, und du startest mit voller Energie und mehr Schrott. Ohne Strom bleibt sie dunkel.'),
                stufen: [{ ladung: 0.2, wirkung: TX('Türme, Golems, Bauwerke +20 % Leben · volle Energie, +3 Schrott zu Beginn (nur mit Strom)') },
                         { name: TX('Schnellladestation'), epoche: 3, kosten: { gold: 150, beschlaege: 16, teile: 20 }, ladung: 0.35, wirkung: TX('+35 % Leben · volle Energie, +3 Schrott (nur mit Strom)') }] },
  gewaechshaus: { name: TX('Gewächshaus'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 120, stein: 30, beschlaege: 10, teile: 6 }, arbeiter: 2, epoche: 2, strom: true, bild: 'strom',
                text: TX('Unter Glas und Lazi-Lampen wachsen Kräuter und Gemüse, egal wie das Wetter ist und wie schlecht der Bach schmeckt. Braucht Strom.'),
                stufen: [{ kraeuterProTag: 3, gemuese: 8, wirkung: TX('+3 Kräuter und +8 Nahrung pro Tag, unabhängig von der Verschmutzung (nur mit Strom)') },
                         { name: TX('Glashaus'), epoche: 3, kosten: { gold: 110, beschlaege: 12, teile: 10 }, kraeuterProTag: 5, gemuese: 12, wirkung: TX('+5 Kräuter und +12 Nahrung pro Tag (nur mit Strom)') }] },
  krankenstation: { name: TX('Krankenstation'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 100, stein: 40, holz: 20, beschlaege: 6 }, arbeiter: 2, epoche: 2, max: 1, bild: 'stufe',
                text: TX('Betten, Verbandszeug und Hilde, die keine Widerrede duldet. Sie braucht jeden Tag Kräuter. Solange welche da sind, wird niemand krank, und bei Hunger oder Kälte gehen nur halb so viele Leute weg.'),
                stufen: [{ pflege: 5, wirkung: TX('Braucht 1 Kräuter pro Tag · +5 Lebensstandard · keine Krankheiten · bei Hunger gehen halb so viele') },
                         { name: TX('Hospital'), epoche: 3, kosten: { gold: 120, stein: 40, beschlaege: 12, teile: 8 }, pflege: 8, wirkung: TX('Braucht 1 Kräuter pro Tag · +8 Lebensstandard') }] },
  bunkerfunk: { name: TX('Bunker-Funkstelle'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 120, stein: 30, beschlaege: 10, teile: 12 }, arbeiter: 1, epoche: 2, max: 1, strom: true, bild: 'strom',
                text: TX('Eine Antenne, die auf die Frequenz der Bunker hört. Ihr erfahrt früher, welche Tür aufgeht: Die Bunkertür hat öfter eine zweite Runde, und es kommen mehr Menschen heraus.'),
                stufen: [{ bunkerfunk: 0.3, bunkerLeute: 2, wirkung: TX('Bunker: +30 % Chance auf eine zweite Tür, +2 Überlebende (nur mit Strom)') },
                         { name: TX('Bunker-Relais'), epoche: 3, kosten: { gold: 120, beschlaege: 14, teile: 16 }, bunkerfunk: 0.5, bunkerLeute: 4, wirkung: TX('Bunker: +50 % Chance auf eine zweite Tür, +4 Überlebende (nur mit Strom)') }] },
  wohnblock:  { name: TX('Wohnblock'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 160, stein: 80, beschlaege: 16, teile: 10 }, arbeiter: 0, epoche: 3, bild: 'strom',
                text: TX('Fünf Stockwerke aus Ruinenstein und Stahl: viel Wohnraum auf wenig Platz. Ohne Strom sind die Treppenhäuser kalt und dunkel, und das merken die Leute.'),
                stufen: [{ wohnraum: 20, wirkung: TX('+20 Wohnraum · ohne Strom −3 Lebensstandard') },
                         { name: TX('Wohnblock mit Aufzug'), epoche: 3, kosten: { gold: 140, beschlaege: 16, teile: 14 }, wohnraum: 28, wirkung: TX('+28 Wohnraum · ohne Strom −3 Lebensstandard') }] },
  montagehalle: { name: TX('Montagehalle'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 180, stein: 50, beschlaege: 20, teile: 20 }, arbeiter: 3, epoche: 3, max: 1, strom: true, bild: 'strom',
                text: TX('Aus Lazi-Teilen und Beschlägen werden fertige Bauteile. Türme in Missionen werden stärker, und Grimbart kann Bauteile statt Lazi-Splittern für Lazi-Ausrüstung nehmen.'),
                stufen: [{ bauteileProTag: 1, bauTeile: 3, bauBeschlaege: 2, turmPlus: 0.15, wirkung: TX('3 Lazi-Teile + 2 Beschläge → 1 Bauteil pro Tag · Türme und Bauwerke +15 % Schaden (nur mit Strom)') },
                         { name: TX('Montagestraße'), epoche: 3, kosten: { gold: 160, beschlaege: 18, teile: 25 }, bauteileProTag: 2, bauTeile: 5, bauBeschlaege: 3, turmPlus: 0.25, wirkung: TX('5 Lazi-Teile + 3 Beschläge → 2 Bauteile pro Tag · Türme +25 % Schaden') }] },
  robotergarage: { name: TX('Roboter-Garage'), kategorie: 'militaer', groesse: [4, 4], kosten: { gold: 120, stein: 30, beschlaege: 12, teile: 10 }, arbeiter: 0, epoche: 2, max: 1, bild: 'stufe',
                text: TX('Hier wohnen die Wartungsroboter, die ihr in der Wartungshalle habt laufen lassen. Sie kämpfen mit, bei Überfällen und auf Missionen, und tagsüber flicken sie Mauer und Tor.'),
                stufen: [{ garage: 2, garageMission: 1, torPlus: 0.15, wirkung: TX('Je gerettetem Roboter ein Helfer: bis zu 2 bei Überfällen, 1 auf Missionen · Tor +15 % Leben') },
                         { name: TX('Große Garage'), epoche: 3, kosten: { gold: 120, beschlaege: 14, teile: 14 }, garage: 4, garageMission: 2, torPlus: 0.25, wirkung: TX('Bis zu 4 Roboter bei Überfällen, 2 auf Missionen · Tor +25 % Leben') }] },
  ausschlachterei: { name: TX('Ausschlachterei'), kategorie: 'militaer', groesse: [4, 4], kosten: { gold: 120, stein: 30, beschlaege: 12, teile: 10 }, arbeiter: 0, epoche: 2, max: 1, bild: 'stufe',
                text: TX('Das Gegenstück zur Roboter-Garage: Hier werden die Roboter zerlegt, die ihr verschrottet habt. Aus ihren Zellen werden EMP-Ladungen, die feindliche Maschinen lahmlegen, aus ihrem Blech Platten für das Tor.'),
                stufen: [{ emp: 2, torPlus: 0.15, wirkung: TX('Je verschrottetem Roboter eine EMP-Ladung: bis zu 2 pro Mission oder Überfall. Maschinen stehen 3 Sekunden still und nehmen Schaden, Menschen sind kurz geblendet · Tor +15 % Leben') },
                         { name: TX('Große Ausschlachterei'), epoche: 3, kosten: { gold: 120, beschlaege: 14, teile: 14 }, emp: 3, torPlus: 0.25, wirkung: TX('Bis zu 3 EMP-Ladungen · Tor +25 % Leben') }] },
  signalturm: { name: TX('Signalturm'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 160, stein: 40, beschlaege: 16, teile: 20 }, arbeiter: 1, epoche: 3, max: 1, strom: true, bild: 'strom',
                text: TX('Er sendet auf der Frequenz der Verbünde. Sie melden sich öfter mit Anfragen, und der innere Kreis kann ihnen nachts weniger einflüstern. Eines Tages antwortet vielleicht auch jemand, mit dem hier niemand rechnet.'),
                stufen: [{ signal: 1, wirkung: TX('Mehr Anfragen der Verbünde · der innere Kreis dreht Verbünde halb so oft um (nur mit Strom)') },
                         { name: TX('Großer Signalturm'), epoche: 3, kosten: { gold: 140, beschlaege: 16, teile: 20 }, signal: 2, wirkung: TX('Noch mehr Anfragen · der innere Kreis dreht Verbünde nur ein Drittel so oft um') }] },
  stoersender: { name: TX('Störsender'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 160, stein: 40, altmetall: 20, teile: 20 }, arbeiter: 1, epoche: 3, max: 1, bild: 'stufe',
                text: TX('Das Gegenstück zum Signalturm, gebaut nach einem Plan der Rostbrecher: Er sendet nicht, er stört. Der innere Kreis kann den Verbünden nachts weniger einflüstern, und feindliche Maschinen verlieren den Takt. Er braucht keinen Strom, aber jeden Tag ein Altmetall.'),
                stufen: [{ stoer: 1, wirkung: TX('Der innere Kreis dreht Verbünde halb so oft um · feindliche Maschinen machen 10 % weniger Schaden (braucht 1 Altmetall am Tag)') },
                         { name: TX('Großer Störsender'), epoche: 3, kosten: { gold: 140, altmetall: 20, teile: 20 }, stoer: 2, wirkung: TX('Ein Drittel so oft · feindliche Maschinen machen 20 % weniger Schaden') }] },
  funkturm:   { name: TX('Funkturm'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 160, stein: 40, beschlaege: 12, teile: 15 }, arbeiter: 1, epoche: 2, max: 1,
                text: TX('Ein Gittermast mit Antennen und eine Hütte voller Röhrenradios. Mit Strom hört ihr, was im Tal gefunkt wird: Maschinen, Händler, Plünderer, Hilferufe.'),
                stufen: [{ funk: true, wirkung: TX('Jeden Tag einen Funkspruch abhören (braucht Strom)') }] },
  verbundterminal: { name: TX('Verbund-Terminal'), kategorie: 'stadt', groesse: [4, 4], kosten: { gold: 180, stein: 40, beschlaege: 14, teile: 20 }, arbeiter: 1, epoche: 2, max: 1,
                text: TX('Ein Schaltschrank der Alten mit Bildschirm, aus der Stadt herübergeschleppt. Wenn Strom fließt, zeigt er, wem die Verbünde der Maschinen gehorchen, und ihr könnt mit ihnen sprechen.'),
                stufen: [{ terminal: true, terminalPause: 3, wirkung: TX('Zeigt die Verbünde. Alle 3 Tage eine Verbindung anbieten (braucht Strom)') },
                         { name: TX('Schaltzentrale'), epoche: 2, kosten: { gold: 160, teile: 25, beschlaege: 16 }, terminal: true, terminalPause: 2, terminalPlus: 3, wirkung: TX('Alle 2 Tage eine Verbindung, jede wirkt stärker') }] },
  weg:        { name: TX('Weg'), kategorie: 'stadt', groesse: [1, 1], kosten: { stein: 1 }, arbeiter: 0, epoche: 0,
                text: TX('Ein Pflasterweg. Wege baust du am Stück: Der Baumodus bleibt offen, bis du abbrichst. Ab 10 Wegen fühlen sich die Leute etwas wohler.'),
                stufen: [{ wirkung: TX('Je 20 Wege +1 Lebensstandard (höchstens +5)') }] },
  // ---------- Deko: schöner wohnen. Zusammen höchstens +12 Lebensstandard ----------
  brunnen:    { name: TX('Brunnen'), kategorie: 'deko', groesse: [4, 4], kosten: { gold: 60, stein: 40 }, arbeiter: 0, epoche: 0, max: 2,
                text: TX('Ein Ziehbrunnen mit Holzdach. Wasser holen ist leichter, und am Brunnen erzählt man sich, was so los ist.'),
                stufen: [{ schmuck: 3, wirkung: TX('+3 Lebensstandard (Schmuck)') }] },
  blumenbeet: { name: TX('Blumenbeet'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 8, holz: 4 }, arbeiter: 0, epoche: 0,
                text: TX('Ein paar Blumen zwischen den Häusern. Wer hätte gedacht, dass das nach dem Ende der Welt noch jemandem wichtig ist.'),
                stufen: [{ schmuck: 0.5, wirkung: TX('+0,5 Lebensstandard (Schmuck)') }] },
  bank:       { name: TX('Bank'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 10, holz: 8 }, arbeiter: 0, epoche: 0,
                text: TX('Eine Bank aus Brettern. Die Alten sitzen hier und erklären den Jungen, wie früher alles besser war. Früher war gar nichts besser.'),
                stufen: [{ schmuck: 0.5, wirkung: TX('+0,5 Lebensstandard (Schmuck)') }] },
  fahne:      { name: TX('Dorffahne'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 25, holz: 10 }, arbeiter: 0, epoche: 0, max: 3,
                text: TX('Ein Mast mit dem Zeichen eures Dorfes. Wer von weitem kommt, weiß: Hier wohnt jemand, der bleiben will.'),
                stufen: [{ schmuck: 1, wirkung: TX('+1 Lebensstandard (Schmuck)') }] },
  statue:     { name: TX('Heldenstatue'), kategorie: 'deko', groesse: [4, 4], kosten: { gold: 150, stein: 70 }, arbeiter: 0, epoche: 1, max: 1,
                text: TX('Eine Statue von dir, aus Ruinenstein gehauen. Die Kinder klettern drauf. Du tust so, als würde es dich nicht freuen.'),
                stufen: [{ schmuck: 4, wirkung: TX('+4 Lebensstandard (Schmuck)') }] },
  // Belohnung: erst sichtbar, wenn man alle Enden gesehen hat (in jedem Spielstand)
  denkmal:    { name: TX('Denkmal der Wege'), kategorie: 'deko', groesse: [4, 4], kosten: { gold: 60, stein: 30 }, arbeiter: 0, epoche: 0, max: 1, belohnung: true,
                text: TX('Ein Obelisk mit sechs Zeichen: eine offene Hand, ein Schalter, eine Krone, ein Hirtenstab, ein Auge und ein Berg. Wer ihn gebaut hat, war jeden Weg einmal. Die Kinder fragen, welcher der richtige war.'),
                stufen: [{ schmuck: 6, wirkung: TX('+6 Lebensstandard (Schmuck)') }] },
  wimpel:     { name: TX('Wimpelkette'), kategorie: 'deko', groesse: [4, 2], kosten: { gold: 15, holz: 6 }, arbeiter: 0, epoche: 0, max: 4,
                text: TX('Bunte Wimpel aus alten Hemden, zwischen zwei Masten gespannt. Sieht nach Fest aus, auch wenn keins ist.'),
                stufen: [{ schmuck: 1, wirkung: TX('+1 Lebensstandard (Schmuck)') }] },
  faesser:    { name: TX('Fässer und Kisten'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 8, holz: 8 }, arbeiter: 0, epoche: 0,
                text: TX('Ein paar Fässer, eine Kiste und ein Mehlsack. Ein Dorf, in dem etwas herumsteht, ist ein Dorf, in dem jemand arbeitet.'),
                stufen: [{ schmuck: 0.5, wirkung: TX('+0,5 Lebensstandard (Schmuck)') }] },
  zypresse:   { name: TX('Zypresse'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 6, holz: 2 }, arbeiter: 0, epoche: 0,
                text: TX('Ein schlanker Baum aus dem Süden. Wie der Samen ins Tal kam, weiß niemand. Er wächst trotzdem.'),
                stufen: [{ schmuck: 0.5, wirkung: TX('+0,5 Lebensstandard (Schmuck)') }] },
  rosenbogen: { name: TX('Rosenbogen'), kategorie: 'deko', groesse: [4, 2], kosten: { gold: 30, holz: 12 }, arbeiter: 0, epoche: 1, max: 3,
                text: TX('Ein Holzbogen, über den die Rosen klettern. Wer darunter durchgeht, wird automatisch ein bisschen langsamer.'),
                stufen: [{ schmuck: 1.5, wirkung: TX('+1,5 Lebensstandard (Schmuck)') }] },
  blumenkarren:{ name: TX('Blumenkarren'), kategorie: 'deko', groesse: [4, 2], kosten: { gold: 25, holz: 15 }, arbeiter: 0, epoche: 1, max: 2,
                text: TX('Ein alter Handkarren, randvoll mit Blumentöpfen. Fahren wird er nie wieder. Muss er auch nicht.'),
                stufen: [{ schmuck: 1.5, wirkung: TX('+1,5 Lebensstandard (Schmuck)') }] },
  marktstand: { name: TX('Marktstand'), kategorie: 'deko', groesse: [4, 2], kosten: { gold: 45, holz: 20 }, arbeiter: 0, epoche: 1, max: 2,
                text: TX('Ein Stand mit gestreiftem Dach. Bauern aus der Gegend verkaufen hier Äpfel, Birnen und Kohl. Der Duft zieht Leute an.'),
                stufen: [{ schmuck: 2, goldProTag: 2, wirkung: TX('+2 Lebensstandard (Schmuck), +2 Gold pro Tag') }] },
  laterne:    { name: TX('Straßenlaterne'), kategorie: 'deko', groesse: [2, 2], kosten: { gold: 20, beschlaege: 2 }, arbeiter: 0, epoche: 2, strom: true,
                text: TX('Elektrisches Licht an den Wegen. Leuchtet nur, wenn das Dorf Strom hat.'),
                stufen: [{ schmuck: 1, wirkung: TX('+1 Lebensstandard, wenn Strom fließt') }] },
  // ---------- Produktion ----------
  holzfaeller:{ name: TX('Holzfällerhaus'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 30, holz: 8 }, arbeiter: 2, epoche: 0,
                text: TX('Zwei Leute mit Äxten und viel Geduld. Holz brauchst du für fast alles, auch für Holzkohle.'),
                stufen: [{ holzProTag: 7, wirkung: TX('+7 Holz pro Tag') },
                         { name: TX('Sägewerk'), epoche: 1, kosten: { gold: 50, stein: 20, beschlaege: 4 }, holzProTag: 12, wirkung: TX('+12 Holz pro Tag') },
                         { name: TX('Großes Sägewerk'), epoche: 2, kosten: { gold: 90, stein: 40, beschlaege: 10 }, holzProTag: 18, wirkung: TX('+18 Holz pro Tag') }] },
  steinmetz:  { name: TX('Steinmetzerei'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 45, holz: 22 }, arbeiter: 2, epoche: 0,
                text: TX('Bricht Steine aus den Ruinen und behaut sie.'),
                stufen: [{ steinProTag: 4, wirkung: TX('+4 Stein pro Tag') },
                         { name: TX('Steinbruch'), epoche: 1, kosten: { gold: 60, holz: 30, beschlaege: 4 }, steinProTag: 8, wirkung: TX('+8 Stein pro Tag') },
                         { name: TX('Steinbruch mit Kran'), epoche: 2, kosten: { gold: 100, holz: 40, beschlaege: 10 }, steinProTag: 13, wirkung: TX('+13 Stein pro Tag') }] },
  bauernhof:  { name: TX('Bauernhof'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 50, holz: 30 }, arbeiter: 3, epoche: 0,
                text: TX('Ein Hof mit Feld. Auf der Weltkarte wachsen die Felder um dein Dorf mit jedem Hof.'),
                stufen: [{ nahrungProTag: 10, wirkung: TX('+10 Nahrung pro Tag') },
                         { name: TX('Großer Hof'), epoche: 1, kosten: { gold: 60, holz: 30, beschlaege: 4 }, nahrungProTag: 16, wirkung: TX('+16 Nahrung pro Tag') },
                         { name: TX('Gutshof'), epoche: 2, kosten: { gold: 110, stein: 40, beschlaege: 10 }, nahrungProTag: 24, wirkung: TX('+24 Nahrung pro Tag') }] },
  koehlerei:  { name: TX('Köhlerei'), kategorie: 'produktion', groesse: [4, 4], kosten: { gold: 60, holz: 30, stein: 20 }, arbeiter: 2, epoche: 1,
                text: TX('Im Meiler wird Holz langsam zu Holzkohle. Die Leute heizen damit, die Schmiede braucht sie, und später das Kraftwerk.'),
                stufen: [{ kohleProTag: 3, holzVerbrauch: 6, wirkung: TX('6 Holz → 3 Holzkohle pro Tag') },
                         { name: TX('Großer Meiler'), epoche: 1, kosten: { gold: 80, stein: 30, beschlaege: 6 }, kohleProTag: 6, holzVerbrauch: 10, wirkung: TX('10 Holz → 6 Holzkohle pro Tag') },
                         { name: TX('Köhlerplatz'), epoche: 2, kosten: { gold: 120, stein: 50, beschlaege: 12 }, kohleProTag: 10, holzVerbrauch: 15, wirkung: TX('15 Holz → 10 Holzkohle pro Tag') }] },
  schmiede:   { name: TX('Schmiede'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 80, stein: 20, teile: 4 }, arbeiter: 2, epoche: 0, max: 1,
                text: TX('Geschärfte Waffen für Missionen. Hier schmiedest und zerlegst du Waffen.'),
                stufen: [{ schaden: 2, wirkung: TX('+2 Schaden · Waffen schmieden') },
                         { name: TX('Eisenschmiede'), epoche: 1, kosten: { gold: 90, stein: 30, holzkohle: 8 }, schaden: 3, beschlaegeProTag: 3, kohleVerbrauch: 2,
                           wirkung: TX('+3 Schaden · 2 Holzkohle → 3 Beschläge pro Tag (Schrauben, Winkeleisen für bessere Häuser)') },
                         { name: TX('Meisterschmiede'), epoche: 1, kosten: { gold: 180, stein: 50, beschlaege: 14, teile: 10 }, schaden: 4, beschlaegeProTag: 5, kohleVerbrauch: 3, besseresSchmieden: true,
                           wirkung: TX('+4 Schaden · edlere Waffen beim Schmieden · 3 Holzkohle → 5 Beschläge pro Tag') }] },
  werkstatt:  { name: TX('Lazi-Werkstatt'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 110, holz: 20, stein: 15, teile: 8 }, arbeiter: 2, epoche: 0, max: 1,
                text: TX('Türme, Golems und Bauwerke werden stärker, du darfst eines mehr haben und startest mit mehr Teilen, Energie oder Schrott.'),
                stufen: [{ werkstatt: true, werkstattBonus: 0.35, extraMax: 1, startBonus: 2, wirkung: TX('Türme, Golems, Bauwerke +35 % · eines mehr') },
                         { name: TX('Werkstatt mit Drehbank'), epoche: 1, kosten: { gold: 120, teile: 20, beschlaege: 10 }, werkstatt: true, werkstattBonus: 0.5, extraMax: 1, startBonus: 3, wirkung: TX('Türme, Golems, Bauwerke +50 % · eines mehr') },
                         { name: TX('Lazi-Montagehalle'), epoche: 2, kosten: { gold: 220, teile: 45, beschlaege: 20 }, werkstatt: true, werkstattBonus: 0.7, extraMax: 2, startBonus: 4, wirkung: TX('Türme, Golems, Bauwerke +70 % · zwei mehr') }] },
  labor:      { name: TX('Forschungslabor'), kategorie: 'produktion', groesse: [6, 4], kosten: { gold: 160, stein: 40, teile: 14, beschlaege: 6 }, arbeiter: 2, epoche: 1, max: 1,
                text: TX('Glaskolben, alte Lazi-Rechner und eine Wissenschaftlerin, die sich für niemanden interessiert außer für ihre Versuche. Erforscht Sonderwirkungen, die der Schmiedemeister in seine Meisterstücke einarbeiten kann.'),
                stufen: [{ forschung: true, forschungTempo: 1, wirkung: TX('Erforscht Sonderwirkungen für Meisterstücke (braucht alte Bücher)') },
                         { name: TX('Großes Labor'), epoche: 2, kosten: { gold: 200, stein: 60, teile: 25, beschlaege: 14 }, forschung: true, forschungTempo: 2, wirkung: TX('Forscht doppelt so schnell') }] },
  // ---------- Militär ----------
  kaserne:    { name: TX('Kaserne'), kategorie: 'militaer', groesse: [6, 4], kosten: { gold: 140, holz: 30, stein: 20, teile: 6 }, arbeiter: 3, epoche: 1, max: 2,
                text: TX('Hier wohnt dein Begleiter. Du wählst beim Bau, wen du ausbildest, und machst ihn hier stärker. Zwei Kasernen, zwei Begleiter.'),
                stufen: [{ soldat: true, begleiterMal: 1, wirkung: TX('+1 Begleiter in Missionen und bei Überfällen') },
                         { name: TX('Kaserne mit Rüstkammer'), epoche: 1, kosten: { gold: 120, stein: 40, beschlaege: 10 }, soldat: true, begleiterMal: 1.2, wirkung: TX('Begleiter +20 % Leben und Schaden') },
                         { name: TX('Garnison'), epoche: 2, kosten: { gold: 220, stein: 70, beschlaege: 18 }, soldat: true, begleiterMal: 1.4, wirkung: TX('Begleiter +40 % Leben und Schaden') }] },
  // ---------- Verteidigung ----------
  wachturm:   { name: TX('Wachturm'), kategorie: 'verteidigung', groesse: [4, 4], kosten: { gold: 45, holz: 35, stein: 10 }, arbeiter: 1, epoche: 0, max: 4,
                text: TX('Ein Turm aus Stämmen mit einem Wächter und einer Armbrust. Bei Überfällen schießt er von hinter der Mauer, und er sieht Banden früher kommen.'),
                stufen: [{ wache: 1, turmMal: 1, wirkung: TX('Schießt bei Überfällen · +1 Tag Vorwarnung') },
                         { name: TX('Steinturm'), epoche: 1, kosten: { gold: 60, stein: 45, beschlaege: 6 }, wache: 1, turmMal: 1.5, wirkung: TX('Hält und trifft 50 % mehr bei Überfällen') },
                         { name: TX('Geschützturm'), epoche: 2, kosten: { gold: 110, stein: 60, beschlaege: 14, teile: 10 }, wache: 1, turmMal: 2.1, wirkung: TX('Doppelt so stark bei Überfällen') }] },
};

// Die Dorfmauer wird nicht platziert, sondern Stufe für Stufe rund ums Dorf gebaut.
// schutz: zählt, wenn du einen Überfall nicht selbst abwehrst. tor: Leben des Tors im Kampf.
// stacheln: Schaden pro Sekunde an Gegnern, die an der Mauer stehen.
const MAUERN = [
  { name: TX('Keine Mauer'), schutz: 0, tor: 0, text: TX('Das Dorf ist offen. Bei einem Überfall verteidigst du das Vorratslager.') },
  { name: TX('Stachelbarrikaden'), epoche: 0, kosten: { gold: 15, holz: 30 }, schutz: 14, tor: 520, stacheln: 5, torName: TX('Barrikade an der Straße'),
    text: TX('Spanische Reiter aus angespitzten Pfählen rund ums Dorf. Wer dagegen läuft, blutet. Mitten auf der Straße steht eine Barrikade aus Karren und Säcken.') },
  { name: TX('Holzpalisade'), epoche: 1, kosten: { gold: 40, holz: 90, stein: 15, beschlaege: 6 }, schutz: 32, tor: 760, stacheln: 2, torName: TX('Palisadentor'),
    text: TX('Ein Wall aus angespitzten Stämmen, fast ganz ums Dorf. An den Straßen gibt es Tore mit Eisenbändern.') },
  { name: TX('Steinmauer'), epoche: 2, kosten: { gold: 80, stein: 120, beschlaege: 12 }, schutz: 55, tor: 1000, torName: TX('Steintor'),
    text: TX('Kommt mit Epoche 3: Mauern aus Ruinensteinen, gegen die auch Brandstifter nichts ausrichten.') },
  { name: TX('Leuchtende Stahlmauer'), epoche: 3, kosten: { gold: 150, teile: 40, beschlaege: 20 }, schutz: 85, tor: 1400, torName: TX('Stahltor'),
    text: TX('Kommt mit Epoche 4: Stahl aus der Lazi-Fabrik, durchzogen von blau leuchtenden Adern.') },
];

// Überfälle aufs Dorf. Banden sammeln sich, Späher (und Wachtürme) melden sie vorher.
const UEBERFALL = {
  ersterTag: 7, abstand: [7, 11], vorwarnung: 2,
  // Wie stark die Bande ist: wächst mit den Tagen und der Epoche
  staerke: () => 1 + Math.floor(Math.max(0, SPIEL.tag - 7) / 12) + SPIEL.epoche,
  angriff: s => 22 + s * 14,          // gegen MAUERN.schutz + Türme + Begleiter, wenn du nicht kämpfst
  turmSchutz: 7, begleiterSchutz: 5,
  verlustMax: 0.35,                     // so viel Gold, Nahrung, Holz und Stein nehmen sie höchstens mit
  angstTage: 3, angst: -8, stolzTage: 3, stolz: 6,
  lagerAufschub: 5,                    // nach dem Sturm aufs Plündererlager kommen sie später
};
// Der Wachturm in der Überfall-Mission
const WACHTURM = { leben: 260, reichweite: 8.5, feuerpause: 0.9, schaden: 8 };

// Begleiter aus der Kaserne. Beim Bau wählst du einen, danach bildest du ihn aus.
const BEGLEITER = {
  waechter: { name: TX('Wächter'), klasse: 'schwert', bild: ['soldat', 'schwert'], leben: 120, schaden: 9, pause: 0.85, tempo: 4.2, spott: true,
              text: TX('Steht vorne, zieht Gegner in der Nähe auf sich und hält viel aus.') },
  klinge:   { name: TX('Schattenklinge'), klasse: 'schatten', bild: ['schatten', 'dolche'], leben: 72, schaden: 6, pause: 0.42, tempo: 5.6, ausweichen: 0.3,
              text: TX('Schnell und flink. Sticht oft zu und weicht fast jedem dritten Schlag aus.') },
  lehrling: { name: TX('Lehrling'), klasse: 'beschwoerer', bild: ['beschwoerer', 'stab'], leben: 64, schaden: 10, pause: 1.15, tempo: 4.0, fern: 6.5,
              text: TX('Schießt Lazi-Blitze aus sicherer Entfernung. Hält wenig aus.') },
  geselle:  { name: TX('Geselle'), klasse: 'architekt', bild: ['architekt', 'hammer'], leben: 92, schaden: 7, pause: 0.9, tempo: 4.2, flickt: 7,
              text: TX('Kämpft mit dem Hammer und flickt Tür, Tor und Türme, wenn gerade niemand angreift.') },
};
// Zwei Fähigkeiten je Begleiter. Beide nutzt er selbst, sobald die Lage passt. Ab Rang 3 laden beide schneller.
const BEGLEITER_FAEHIG = {
  waechter: [
    { id: 'schildwall', name: TX('Schildwall'), abkling: 14, dauer: 3.5, schutz: 0.3, radius: 5, text: TX('Hebt den Schild, wenn es eng wird: nimmt kaum Schaden und zieht alle Gegner im Umkreis auf sich.') },
    { id: 'schildstoss', name: TX('Schildstoß'), abkling: 10, radius: 2.8, mal: 2, betaeubt: 1.3, text: TX('Stürmt zum Gegner, der dir am nächsten ist, und stößt alle drumherum betäubt zurück.') },
  ],
  klinge: [
    { id: 'schattensprung', name: TX('Schattensprung'), abkling: 7, reichweite: 9, mal: 3, text: TX('Springt hinter den schwächsten Gegner und sticht hinterrücks dreifach zu (Blutung).') },
    { id: 'rauchbombe', name: TX('Rauchbombe'), abkling: 16, radius: 3.6, betaeubt: 2.2, text: TX('Wirft Rauch auf dich: Gegner drumherum sind 2 Sekunden lang orientierungslos.') },
  ],
  lehrling: [
    { id: 'elementblitz', name: TX('Elementblitz'), passiv: true, text: TX('Seine Blitze tragen das gewählte Element: Feuer brennt, Eis friert ein, Blitz betäubt, Metall stößt zurück.') },
    { id: 'elementturm', name: TX('Elementturm'), abkling: 22, dauer: 8, leben: 70, koeder: 7, puls: 1, radius: 3, text: TX('Stellt einen Turm auf, der alle Gegner in der Nähe auf sich zieht und sie mit seinem Element trifft. Das Element wählst du vor der Mission.') },
  ],
  geselle: [
    { id: 'flicken', name: TX('Flicken'), passiv: true, text: TX('Flickt Tür, Tor und Türme, wenn gerade niemand angreift.') },
    { id: 'barrikade', name: TX('Barrikade'), abkling: 18, dauer: 14, leben: 130, koeder: 4.5, text: TX('Zimmert eine Barrikade aus Schrott zwischen dich und die Gegner. Sie lenkt alle in der Nähe ab.') },
  ],
};
const BEGLEITER_ELEMENTE = {
  feuer:  { name: TX('Feuer'),  farbe: '#ff9a40', status: 'brennen', text: TX('Setzt Gegner in Brand.') },
  eis:    { name: TX('Eis'),    farbe: '#a8e0ff', status: 'frost', text: TX('Verlangsamt Gegner und friert sie ein.') },
  blitz:  { name: TX('Blitz'),  farbe: '#ffe060', status: 'schock', text: TX('Betäubt kurz und trifft weiter um sich.') },
  metall: { name: TX('Metall'), farbe: '#a7b6cf', status: null, rueckstoss: 5, lebenMal: 2, koederMal: 1.3, text: TX('Stößt zurück. Der Turm hält doppelt so viel aus.') },
};
const BEGLEITER_NAMEN = [TX('Hanne'), TX('Kurt'), TX('Ilse'), TX('Theo'), TX('Greta'), TX('Arno'), TX('Wilma'), TX('Ede'), TX('Frieda'), TX('Paule'), TX('Lotte'), TX('Bruno')];
const BEGLEITER_RANG = { max: 5, mal: 0.22, kosten: rang => ({ gold: 35 * rang, beschlaege: 2 * rang }) };
// Lebensstandard: 0 bis 100. Hoch lockt Siedler an, niedrig vertreibt Einwohner.
const LEBENSSTANDARD = {
  grund: 45, wohnraumPuffer: 8, satt: 10, hunger: -25, feier: 15, feierTage: 3,
  kohleAbEpoche: 1, kohleProEinwohner: 0.12, kohleOk: 10, kohleFehlt: -20, schmuckMax: 12,
  hoch: 70, niedrig: 30,
};
const WIRTSHAUS = { trinken: 2, rundeProEinwohner: 2 };

const SCHMIEDEN = { gold: 60, teile: 3, seltenheit: [55, 33, 12, 0, 0], meister: [25, 40, 28, 7, 0] };

const EPOCHEN = [
  { name: TX('Die Ankunft'),
    text: TX('Die ersten Menschen kommen im Dorf an. Sie müssen erst herausfinden, was sie mit den gefundenen Dingen anfangen.'),
    ziel: { einwohner: 20, gebaeude: ['schmiede', 'werkstatt', 'wachturm'], mauer: 1, siege: 6 } },
  { name: TX('Die Siedlung'),
    text: TX('Aus dem Lager wird eine Siedlung. Die Leute wollen nicht mehr nur überleben: Sie wollen es warm haben, eine Kirche und ein Dach aus Stein. Die Schmiede lernt, Beschläge zu machen, und im Meiler glimmt Holzkohle.'),
    ziel: { einwohner: 35, gebaeude: ['koehlerei', 'kirche', 'kaserne'], stufen: { schmiede: 2 }, mauer: 2, erledigt: { lager: 1 }, siege: 14, lebensstandard: 65 } },
  { name: TX('Die Stadt'), text: TX('Aus Holzkohle wird Strom. Die ersten Lazi-Maschinen laufen wieder, und mit ihnen kommen neue Probleme.'),
    ziel: { einwohner: 55, gebaeude: [], erledigt: { kraftwerk: 1 }, stromGesamt: 6, verschmutzungUnter: 30, verbuende: 2, mauer: 3, lebensstandard: 70, siege: 26 } },
  { name: TX('Die Lazi-Metropole'), text: TX('Die Fabrik ruft. Wer die Lazi-Teile selbst herstellt, braucht die Ruinen nicht mehr, nur noch Altmetall und Strom. Aber je mächtiger das Dorf wird, desto genauer schaut jemand hin.'),
    ziel: { einwohner: 100, erledigt: { lazifabrik: 1 }, verbuende: 4, mauer: 4, lebensstandard: 80, nemesisBesiegt: 1, siege: 50 } },
];

const START = { gold: 60, teile: 2, einwohner: 4, holz: 25, stein: 10, nahrung: 30, holzkohle: 0, beschlaege: 0, altmetall: 0, kraeuter: 0 };
// Was eine Ware wert ist (in Gold je Stück). Danach richten sich die Händlerpreise (siehe Test „markt“),
// der eigene Marktstand und die Aushänge am schwarzen Brett.
const WARENWERT = { gold: 1, holz: 1, stein: 1.5, nahrung: 0.8, holzkohle: 2.5, beschlaege: 6, teile: 8, altmetall: 3, kraeuter: 4, buecher: 12, bauteile: 25, einwohner: 30 };
// Markt von Altbrück
//  ansehen: Start, Gewinn je Handel und je Aushang; rabatt: ab welchem Ansehen die Preise sinken
//  stand: Kosten und nötiges Ansehen für den eigenen Stand, Preisstufen (Anteil vom Warenwert)
//  nachfrage: wie viel die Leute am Tag höchstens kaufen; aushang: alle wie viele Tage neue Aushänge, Aufschlag auf den Warenwert
const MARKT = {
  ansehen: { start: 10, handel: 1, aushang: 5, maxHandelProBesuch: 6 },
  rabatt: [[60, 0.9], [30, 0.95]],
  stand: { gold: 100, ansehen: 20, menge: 10, preisstufen: [0.6, 0.8, 1, 1.25, 1.6] },
  waren: ['holz', 'stein', 'nahrung', 'holzkohle', 'beschlaege', 'teile', 'altmetall', 'kraeuter'],
  nachfrage: { holz: 20, stein: 12, nahrung: 25, holzkohle: 8, beschlaege: 4, teile: 3, altmetall: 5, kraeuter: 4 },
  // Verkaufte Menge je Preisstufe (billig verkauft mehr): Faktor auf die Nachfrage
  absatz: [1.6, 1.25, 1, 0.55, 0.2],
  aushang: { tage: 3, anzahl: 3, aufschlag: 1.35 },
  // 5.6b: die Gasse
  dorfStand: { besuche: 2, beziehung: 1 },   // Nachbardörfer kommen erst auf den Markt, wenn man sie zweimal besucht hat und befreundet ist
  hehler: { ankauf: 1.5, ankaufKontrolle: 1.75, ansehen: -2, angebote: 3 },
  elster: { ueberfall: 15, kreis: 25, geheimnis: 40 },
  boss: { ansehen: 50, belohnungGold: 150, ansehenSieg: 15 },
  // Kontrolle über den Markt: Gebühren am Tag je nach Höhe, dafür ändert sich das Ansehen
  gebuehren: [
    { id: 'niedrig', gold: 10, ansehen: 0.5 },
    { id: 'mittel', gold: 18, ansehen: 0 },
    { id: 'hoch', gold: 28, ansehen: -1 },
  ],
};
// Heiße Ware beim Hehler: billig, aber wer dort kauft, verliert Ansehen
const HEHLERWARE = [
  { nimm: { lazisplitter: 1 }, gold: 55 },
  { nimm: { beschlaege: 10 }, gold: 45 },
  { nimm: { teile: 8 }, gold: 50 },
  { nimm: { altmetall: 15 }, gold: 32 },
  { nimm: { bauteile: 1 }, gold: 19 },
  { nimm: { kraeuter: 6 }, gold: 18 },
  { nimm: { holzkohle: 12 }, gold: 22 },
  { nimm: { buecher: 2 }, gold: 18 },
];
// Die Rostbrecher: Verbünde stilllegen statt gewinnen (Weg B gegen die Maschinen)
// Ein stillgelegter Verbund zählt für die Epochenziele wie ein gewonnener und kann nicht mehr umgedreht werden.
// Sein Vorteil ist ein anderer, gleich viel wert wie der, den er auf eurer Seite gäbe.
const ROSTBRECHER = {
  abEpoche: 2, zorn: 12, gold: 60, teile: 6,
  sabotage: { ladungen: 3, zeit: 3.5, reichweite: 1.9, flucht: 12, nachschub: 7 },
  still: { energie: { verschmutzung: 2 }, wartung: { torPlus: 0.15 }, logistik: { altmetall: 3 }, wissen: { buecher: 2 }, produktion: { altmetall: 4 } },
  // Wo der Knoten jedes Verbunds steht und welche Maschinen ihn bewachen
  knoten: {
    energie:    { gegner: ['funkenkaefer', 'kaefer', 'drohne'], boden: '#3a2a20' },
    wartung:    { gegner: ['wartungsbot', 'kaefer', 'wartungsbot'], boden: '#2e3038' },
    logistik:   { gegner: ['drohne', 'wachbot', 'kaefer'], boden: '#36322a' },
    wissen:     { gegner: ['drohne', 'wachbot', 'eiferer'], boden: '#2a2a3a' },
    produktion: { gegner: ['drohne', 'wachbot', 'wachbot'], boden: '#382a24' },
  },
};
// Das Finale im Nullbunker: drei Abschnitte. Im Kern schützen Zählsäulen den Ersten Zähler.
// Der Zwiespalt (js/zwiespalt.js): Liegen zwei Wege knapp beieinander, entscheidet bei manchen Paaren ein Kampf.
// schuetzling: Leben von Anselm und Hanne im Schaltwächter-Kampf; strom: Kurzschluss (abgefangen/nicht abgefangen) usw.
const ZWIESPALT_WERTE = {
  schuetzling: 600, kurzschluss: 7, kurzschlussSchaden: 150, abgefangen: 30, ueberspannung: 9, ueberspannungSchaden: 24,
  herde: { abstand: 4.5, max: 8, panzer: 0.3, pferch: 13, pferchRadius: 3.2, pferchSchaden: 10, ansturm: 9, ansturmSchaden: 30 },
  thron: { radius: 2.2, laeufer: 6, gegengewicht: 8, schlagSchaden: 30, gewichtSchaden: 20, heilen: 0.015, schlaeger: 18 },
  nummer: { panzer: 0.12, verbinden: 3, strahl: 9, strahlSchaden: 28, loeschen: 7, loeschenSchaden: 34, rueckkopplung: 6, rueckSchaden: 14 },
};
const FINALE = { panzer: 0.1, zaehlen: 6.5, zaehlSchaden: 26, zaehlRadius: 1.9, urteil: 8, urteilSchaden: 22, rufen: 16, neuzaehlung: 0.5, goldProRunde: 80 };
// Der Waagmeister: Solange beide Leibwachen stehen, ist er im Gleichgewicht und kaum verwundbar
const WAAGE = { panzer: 0.12, wanken: 6, wankenBeide: 9, gewichtSchaden: 30, gewichtRadius: 2.1, rufAlle: 13, schlaegerMax: 5, hofWellen: 3 };
// Ausschlachterei: EMP-Ladungen aus verschrotteten Robotern (Weg gegen die Maschinen)
const EMP = { radius: 7, betaeubt: 3, betaeubtMensch: 1.2, schaden: 15, ab: 3, pause: 8 };
// Kräuterbeutel: Mit genug Kräutern im Vorrat nimmst du einen mit. Sinkt dein Leben unter die Schwelle, heilt er dich einmal.
const KRAEUTER = { beutel: 2, heilung: 0.35, schwelle: 0.3, krankheit: 3 };
// Dorfversammlung im Rathaus: alle so viele Tage. Sparen: so viele Tage, so viel weniger Verbrauch, so viel Lebensstandard
const VERSAMMLUNG = { abstand: 7, festGold: 40, sparTage: 3, sparMal: 0.75, sparStandard: -4 };

// Spielmodi: Regeln als Daten. Abgefragt wird über regel('name'), nie über if (modus === …).
// Story ist das bisherige Spiel. Endless und Multiplayer sind noch nicht spielbar (siehe docs/PLAN.md).
const MODI = {
  story: {
    name: TX('Story'), spielbar: true,
    text: TX('Die Geschichte von LAZI: vom Lagerfeuer zur Lazi-Metropole. Mit Figuren, Lore und Zielen für jede Epoche.'),
    ziel: TX('Mach aus dem Lager eine Lazi-Metropole. Erfülle die Ziele jeder Epoche.'),
    intro: true, nachrichten: true, figuren: true, anselm: true, bestehende: true, dorfereignisse: true, finale: true,
    klassenwahl: true, begleiter: true, verlieren: true,
    minEinwohnerHunger: 0, minEinwohnerStandard: 0,   // so weit sinken die Einwohner höchstens
  },
  endless: {
    name: TX('Endless'), spielbar: true,
    text: TX('Ohne Geschichte, so lange du durchhältst. Die Überfälle kommen immer schneller, am Ende zählt der Dorfwert.'),
    ziel: TX('Überlebe so lange wie möglich und sammle einen hohen Dorfwert.'),
    intro: false, nachrichten: false, figuren: false, anselm: false, bestehende: true, dorfereignisse: true,
    klassenwahl: true, begleiter: true, verlieren: true, alleOrteOffen: true, bestenliste: true,
    zornProTag: 0.6,                                                      // Die Bestehenden werden auch ohne Strom immer wütender
    ueberfallAbstand: { start: [7, 10], ende: [3, 4], kuerzerProTag: 0.05 },   // Tage zwischen zwei Überfällen
    minEinwohnerHunger: 0, minEinwohnerStandard: 0,
  },
  multiplayer: {
    name: TX('Multiplayer'), spielbar: false,
    text: TX('Mehrere Dörfer im selben Tal: handeln, zusammenarbeiten oder angreifen.'),
    ziel: TX('Hab am Ende den höchsten Dorfwert oder bleib als Letzter übrig.'),
    intro: false, nachrichten: false, figuren: false, anselm: false, bestehende: true, dorfereignisse: true,
    klassenwahl: true, begleiter: true, verlieren: true, pvp: true,
    minEinwohnerHunger: 0, minEinwohnerStandard: 0,
  },
};
// Lazi-Fabrik. Inventur: Fehlen dem Vorarbeiter so viele Drohnen, zählt er neu. Dann steht er still,
// die Klappe zum Kern ist offen und er nimmt vollen Schaden; sonst hält seine Panzerung fast alles ab.
// Produktion: Mit Strom wird jeden Tag Altmetall zu Lazi-Teilen.
const FABRIK = {
  inventur: { drohnen: 6, abweichung: 3, dauer: 6, panzer: 0.15, kern: 1.25 },
  produktion: { altmetall: 4, teile: 3, verbundBonus: 2 },
  zorn: 15, produktionVerbund: 40,
};
// Verbund-Terminal: eine Verbindung anbieten kostet Teile und Beschläge, macht den inneren Kreis wütend
const TERMINAL = { kosten: { teile: 6, beschlaege: 2 }, plus: 8, zorn: 3 };
// Wartungsroboter: Hat man sie hereingelassen und der Verbund kippt, stehlen sie mehr als von draußen
const ROBOTER = { drinRabatt: 0.85, draussenRabatt: 0.9, diebDrin: { chance: 0.35, min: 4, extra: 5 }, diebDraussen: { chance: 0.15, min: 1, extra: 3 } };
// Anfragen der Verbünde (ab Epoche 3, wenn Strom fließt): Ein Verbund bittet um Hilfe an einem Ort, für ein paar Tage.
// Am Verbund-Terminal kann man selbst um eine Aufgabe bitten (statt einer Verbindung).
const ANFRAGEN = {
  chance: 0.3, dauer: 4, abEpoche: 2,
  verbuende: {
    wartung:  { mission: 'wartungshalle', ort: 'kraftwerk' },
    logistik: { mission: 'konvoi', ort: 'stadt' },
    wissen:   { mission: 'lesesaal', ort: 'universitaet' },
  },
};
// Seltene Missionen an bekannten Orten (Chance pro Tag, nur eine zur Zeit)
const SELTEN = { chance: 0.08, dauer: 3, abEpoche: 2 };
// Wartungshalle: Roboter reparieren, bevor die Eiferer sie salben
const REPARATUR = { zeit: 4, reichweite: 1.9, leben: 90, architekt: 1.5,
  laufen: { wartung: 5 }, schrott: { teile: 4, produktion: 3, wartung: -3 }, gesalbt: { wartung: -2 } };
// Missionen in Runden: Wie viel stärker jede weitere Runde ist, und wie oft der Bunker eine zweite Tür hat
const RUNDEN = { staerker: 0.15, heilung: 0.2, bunkerChance: 0.3, lesesaalChance: 0.5 };

// Spielstände: aktuelle Version des Formats und Plätze pro Modus
const SPIELSTAND = { version: 5, plaetze: 3 };
// Grundvorrat an Nahrung, den das Lagerfeuer-Lager ohne Nahrungslager fasst
const NAHRUNG = { grundVorrat: 40, proEinwohner: 1 };
// Außenposten im dunklen Wald: liefert jeden Tag Rohstoffe
const AUSSENPOSTEN = { kosten: { gold: 40, holz: 15 }, arbeiter: 2, proTag: { holz: 6, stein: 4, nahrung: 6 } };

// =====================================================================
// SELTENE MATERIALIEN, FORSCHUNG UND MEISTERSTÜCKE
// =====================================================================
// Seltene Funde aus Missionen. chance: wie oft ein Gegner sie fallen lässt
const MATERIALIEN = {
  wolfsfell:    { name: TX('Wolfsfell'),    farbe: '#b0a8c0', text: TX('Dichtes Fell mit blau schimmernden Adern.') },
  schildblech:  { name: TX('Schildblech'),  farbe: '#a7b6cf', text: TX('Ein Stück Autotür, das schon viele Schläge ausgehalten hat.') },
  lazisplitter: { name: TX('Lazi-Splitter'), farbe: '#5ff0e0', text: TX('Ein Splitter, der leise summt. Elite-Gegner tragen so etwas mit sich.') },
  alphafell:    { name: TX('Alphafell'),    farbe: '#c890ff', text: TX('Das Fell eines Alphawolfs. Schwer, warm und unheimlich.') },
  golemkern:    { name: TX('Golemkern'),    farbe: '#ffd060', text: TX('Das leuchtende Herz eines Wächter-Golems.') },
  herzkristall: { name: TX('Herzkristall'), farbe: '#ff4a8a', text: TX('Warm wie etwas Lebendiges und viel zu schwer für seine Größe. Nur der Fuchs weiß, woher er sie hat. Ohne einen wird kein Schmied je Lazi-Ausrüstung fertigen.') },
  bauteile:     { name: TX('Bauteile'),     farbe: '#9ab0d0', text: TX('Fertig montiert in der Montagehalle. Für Türme und, statt Lazi-Splittern, für Lazi-Ausrüstung.') },
  buecher:      { name: TX('Alte Bücher'),  farbe: '#e0cdb0', text: TX('Aus der Universität. Das Labor braucht sie für seine Forschung.') },
};
// Wer was fallen lässt
const MATERIAL_BEUTE = {
  wolf: [['wolfsfell', 0.12]], heuler: [['wolfsfell', 0.3]], alpha: [['alphafell', 1]], golem: [['golemkern', 1]],
  schildtraeger: [['schildblech', 0.4]], funkenkaefer: [['lazisplitter', 0.1]],
  elite: [['lazisplitter', 0.35]],
};
// Forschungsprojekte im Labor: kosten Bücher und Teile und dauern einige Tage
const FORSCHUNG = [
  { id: 'brennen',      art: 'waffe',    name: TX('Brandsätze'),          tage: 2, kosten: { buecher: 2, teile: 4 } },
  { id: 'blutung',      art: 'waffe',    name: TX('Klingenschliff'),      tage: 2, kosten: { buecher: 2, teile: 4 } },
  { id: 'gift',         art: 'waffe',    name: TX('Giftkunde'),           tage: 2, kosten: { buecher: 2, teile: 5 } },
  { id: 'frost',        art: 'waffe',    name: TX('Kältetechnik'),        tage: 3, kosten: { buecher: 3, teile: 6 } },
  { id: 'lebensraub',   art: 'waffe',    name: TX('Aderlass'),            tage: 3, kosten: { buecher: 3, teile: 6 } },
  { id: 'durchschlag',  art: 'waffe',    name: TX('Panzerbrechen'),       tage: 3, kosten: { buecher: 3, teile: 8, schildblech: 1 } },
  { id: 'dornen',       art: 'ruestung', name: TX('Stachelbeschläge'),    tage: 2, kosten: { buecher: 3, teile: 5, beschlaege: 3 } },
  { id: 'regeneration', art: 'ruestung', name: TX('Feldmedizin'),         tage: 3, kosten: { buecher: 4, teile: 6 } },
  { id: 'manaraub',     art: 'modul',    name: TX('Lazi-Kopplung'),       tage: 3, kosten: { buecher: 4, teile: 10, lazisplitter: 1 } },
  { id: 'ueberladen',   art: 'modul',    name: TX('Überladungsspulen'),   tage: 4, kosten: { buecher: 5, teile: 12, lazisplitter: 2 } },
];
// Meisterstücke beim Schmiedemeister: das Material bestimmt die Seltenheit
const MEISTERSTUECKE = [
  { selten: 2, gold: 80,  teile: 6,  wahl: [{ wolfsfell: 2 }, { schildblech: 2 }, { lazisplitter: 1 }] },
  { selten: 3, gold: 150, teile: 10, wahl: [{ alphafell: 1 }, { golemkern: 1 }] },
  { selten: 4, gold: 300, teile: 20, wahl: [{ herzkristall: 1, lazisplitter: 3 }, { herzkristall: 1, bauteile: 3 }], labor: true },
];

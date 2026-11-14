// =====================================================================
// GESCHICHTE: Orte auf der Weltkarte, Ereignisse unterwegs,
// Nachrichten vor Missionen und die Chronik (Lore der Welt).
// =====================================================================

// x und y: Position auf der Weltkarte von 0 bis 1 (links oben = 0, 0)
// status: 'offen' = spielbar, 'bald' = kommt in einer späteren Version
// sichtbar: von Anfang an bekannt, sonst liegt der Ort im Nebel, bis ihn ein Gerücht aufdeckt
// ressourcen: was es dort zu holen gibt. plaene: was dort später einmal möglich wird.
const ORTE = {
  dorf:         { name: TX('Dein Dorf'), x: 0.130, y: 0.694, gefahr: 0, art: 'dorf', sichtbar: true,
                  ressourcen: TX('Holz, Stein und Nahrung aus deinen eigenen Gebäuden'),
                  plaene: TX('Wächst mit jeder Epoche: vom Zeltlager zur Lazi-Metropole'),
                  text: TX('Euer Lager zwischen den Feldern. Hier ist es sicher. Noch.') },
  markt:        { name: TX('Markt von Altbrück'), x: 0.247, y: 0.556, gefahr: 1, art: 'markt', sichtbar: true, status: 'offen', mission: 'markt',
                  ressourcen: TX('Luxusgüter, Tauschware, seltene Waffen, Gerüchte'),
                  plaene: TX('Frei begehbar: Händler, Hehler, Informanten und ein Gangsterboss. Mit ihm oder gegen ihn.'),
                  text: TX('Hier wird mit allem gehandelt, was die Ruinen hergeben. Sicher ist hier niemand, nur weniger unsicher.') },
  universitaet: { name: TX('Verlassene Universität'), x: 0.352, y: 0.347, gefahr: 3, art: 'universitaet', sichtbar: true, status: 'offen', mission: 'universitaet',
                  ressourcen: TX('Gold, Lazi-Teile und Bücher der Alten für Labor und Chronik'), belohnung: TX('Gold, Lazi-Teile, Bücher'),
                  plaene: TX('Später ein Forschungslabor, das alte Bücher in Wissen verwandelt'),
                  text: TX('Leere Hörsäle, in denen die Lazi-Anzeigen noch immer Vorlesungen abspielen.') },
  wald:         { name: TX('Der dunkle Wald'), x: 0.247, y: 0.273, gefahr: 2, art: 'wald', sichtbar: true, status: 'offen', mission: 'wald',
                  ressourcen: TX('Holz, Stein, Fleisch und Wolfsfelle'), belohnung: TX('Holz, Stein, Nahrung'),
                  plaene: TX('Außenposten nach dem ersten Sieg. Seltene Felle für den Schmiedemeister.'),
                  text: TX('Wer nachts im dunklen Wald das Feuer ausgehen lässt, sieht den Morgen nicht.') },
  kraftwerk:    { name: TX('Altes Kohlekraftwerk'), x: 0.729, y: 0.856, gefahr: 4, art: 'kraftwerk', sichtbar: false, status: 'offen', mission: 'kraftwerk', abEpoche: 2,
                  sichtbarWenn: () => SPIEL.epoche >= 2,
                  ressourcen: TX('Strom, sobald es mit Holzkohle läuft. Wartungsroboter, Plünderer.'),
                  plaene: TX('Ab Epoche 3: mit Holzkohle aus deiner Köhlerei anfeuern und das Dorf mit Strom versorgen'),
                  text: TX('Zwei Schlote aus Ziegeln mitten in den Werken, gleich hinter der toten Stadt. Die Kessel sind kalt, aber nicht kaputt.') },
  lazifabrik:   { name: TX('Lazi-Fabrik'), x: 0.833, y: 0.648, gefahr: 4, art: 'fabrik', sichtbar: false, status: 'offen', mission: 'fabrik', abEpoche: 3,
                  sichtbarWenn: () => SPIEL.epoche >= 3,
                  ressourcen: TX('Ein Werk, das von selbst Lazi-Teile herstellt. Mit Strom und Altmetall arbeitet es für euch.'), belohnung: TX('Gold, viele Lazi-Teile, Lazi-Splitter, die Fabrik selbst'),
                  plaene: TX('Ab Epoche 4: die Torsteuerungen zerstören, den Vorarbeiter besiegen und die Fabrik für das Dorf arbeiten lassen'),
                  text: TX('Hinter Ziegeln und Stahl laufen die Bänder seit dreihundert Jahren. Wachroboter am Tor, Drohnen in der Halle, und mittendrin einer, der zählt.') },
  stadt:        { name: TX('Die verlassene Stadt'), x: 0.391, y: 0.833, gefahr: 3, art: 'stadt', sichtbar: false, status: 'offen', mission: 'bunker',
                  // Meist öffnet sich ein Bunker. Wurde der Fuchs gesehen, ist er das Ziel.
                  missionWahl: () => SPIEL.karte.fuchs ? 'verfolgung' : 'bunker',
                  sichtbarWenn: () => (SPIEL.karte.erledigt.universitaet || 0) >= 1,
                  ressourcen: TX('Überlebende aus den Bunkern der Alten. Selten der Fuchs, und bei ihm ein Herzkristall.'), belohnung: TX('Überlebende, etwas Gold und Lazi-Teile'),
                  plaene: TX('Hunderte Bunker liegen unter der Stadt. Wer bestimmt, welche Tür als Nächstes aufgeht?'),
                  text: TX('Türme aus Glas und Stahl, halb eingestürzt, grün vor Moos. Unter dem Asphalt liegen die Bunker der Alten, und manchmal geht eine Tür auf.') },
  lager:        { name: TX('Plündererlager am Fluss'), x: 0.417, y: 0.523, gefahr: 3, art: 'lager', sichtbar: false, status: 'offen', mission: 'sturm',
                  sichtbarWenn: () => (SPIEL.ueberfaelle || 0) >= 1 || (SPIEL.karte.erledigt.universitaet || 0) >= 3,
                  ressourcen: TX('Gestohlene Vorräte: Gold, Holz, Stein, Nahrung, Lazi-Teile. Gefangene, die frei sein wollen.'), belohnung: TX('Vorräte und Überlebende'),
                  plaene: TX('Kommt das Lager wieder, kommen auch die Überfälle auf dein Dorf'),
                  text: TX('Zelte aus Planen und Autotüren, Ausgucke aus Treibholz. Von hier aus ziehen die Plünderer vom Fluss los.') },
  ersatzteillager: { name: TX('Das Ersatzteillager'), x: 0.560, y: 0.880, gefahr: 3, art: 'ersatzteillager', sichtbar: false, status: 'offen', mission: 'instandsetzung',
                  sichtbarWenn: () => !!(SPIEL.wartungG && SPIEL.wartungG.schritt >= 1),
                  missionWahl: () => SPIEL.wartungG && SPIEL.wartungG.schritt === 2 && !SPIEL.wartungG.wahl ? 'oberwartung' : 'instandsetzung',
                  ressourcen: TX('Lazi-Teile, Bauteile, Gold'), belohnung: TX('Lazi-Teile und Bauteile'),
                  plaene: TX('Der Knoten des Verbunds Wartung. Hier wartet W-1, die Oberwartung, und mit ihr eine Entscheidung.'),
                  text: TX('Eine Halle voller Regale, in denen jedes Ersatzteil nummeriert liegt. Hier sitzt der Verbund Wartung. Und irgendwo zwischen den Regalen W-1, die alles instand hält.') },
  umspannwerk:  { name: TX('Das Umspannwerk'), x: 0.677, y: 0.579, gefahr: 3, art: 'umspannwerk', sichtbar: false, status: 'offen', mission: 'kurzschluss',
                  sichtbarWenn: () => !!(SPIEL.energieG && SPIEL.energieG.schritt >= 1),
                  missionWahl: () => SPIEL.energieG && SPIEL.energieG.schritt === 2 && !SPIEL.energieG.wahl ? 'lastverteiler' : 'kurzschluss',
                  ressourcen: TX('Lazi-Teile, Lazi-Splitter, Gold'), belohnung: TX('Lazi-Teile und Lazi-Splitter'),
                  plaene: TX('Der Knoten des Verbunds Energie. Hier verteilt der Lastverteiler euren Strom, und hier entscheidet sich, wohin er geht.'),
                  text: TX('Drei Trafos summen zwischen Betonwänden, die Leitungen am Boden glimmen blau. Von hier aus geht der Strom des Kraftwerks ins Tal. Fast alles davon in die tote Stadt.') },
  planarchiv:   { name: TX('Das Planarchiv'), x: 0.495, y: 0.162, gefahr: 3, art: 'planarchiv', sichtbar: false, status: 'offen', mission: 'brandwache',
                  sichtbarWenn: () => !!(SPIEL.wissenG && SPIEL.wissenG.schritt >= 1),
                  missionWahl: () => SPIEL.wissenG && SPIEL.wissenG.schritt === 2 && !SPIEL.wissenG.wahl ? 'archivar' : 'brandwache',
                  ressourcen: TX('Alte Bücher, Lazi-Teile, Gold'), belohnung: TX('Alte Bücher und Lazi-Teile'),
                  plaene: TX('Der Knoten des Verbunds Wissen. Hier hütet der Archivar die Baupläne der Alten, und hier entscheidet sich, wer damit bauen darf.'),
                  text: TX('Noch ein Saal, tief unter dem Lesesaal der Universität, Regal an Regal, voller Planrollen. Es riecht nach Staub, nach Öl und nach Rauch. Irgendwo zwischen den Regalen surrt ein Projektor.') },
  erzwaesche:   { name: TX('Der rote Fluss'), x: 0.885, y: 0.255, gefahr: 4, art: 'erzwaesche', sichtbar: false, status: 'offen', mission: 'erzwaesche', abEpoche: 3,
                  sichtbarWenn: () => !!SPIEL.erzRuf,
                  missionWahl: () => SPIEL.erz && SPIEL.erz.koenigin === 'ruf' ? 'rostkoenigin' : 'erzwaesche',
                  ressourcen: TX('Stein, Altmetall und Lazi-Teile aus dem Tagebau'), belohnung: TX('Stein, Altmetall, Lazi-Teile'),
                  plaene: TX('Was mit der Schürfmaschine geschieht, entscheidet ihr danach. Es betrifft Eisenfurt, den Verbund Produktion und euren Außenposten im Wald.'),
                  text: TX('Unterhalb von Eisenfurt stand dreihundert Jahre lang eine Erzwäsche des Verbunds Produktion still. Seit die Fabrik wieder läuft, gräbt sie, und ihr Abraum färbt den Fluss rot.') },
  schleuse:     { name: TX('Die alte Schleuse'), x: 0.632, y: 0.347, gefahr: 3, art: 'schleuse', sichtbar: false, status: 'offen', mission: 'schleuse',
                  sichtbarWenn: () => SPIEL.epoche >= 2 && (SPIEL.karte.erledigt.lager || 0) >= 1,
                  missionWahl: () => SPIEL.flussroute && SPIEL.flussroute.diebe === 'ruf' ? 'kaidiebe' : 'schleuse',
                  ressourcen: TX('Fracht aus Kähnen, die seit dreihundert Jahren warten: Gold, Lazi-Teile, Holz, Nahrung, Bauteile'), belohnung: TX('Fracht und eine offene Flussroute'),
                  plaene: TX('Ist die Schleuse offen, legt alle paar Tage ein Kahn aus der Warteschlange an. Wie es danach weitergeht, entscheidet ihr an der Tafel im Steuerhaus.'),
                  text: TX('Staustufe 3 des Verbunds Logistik. Vor dem Damm warten 212 Kähne auf ihre Freigabe, seit dreihundert Jahren.') },
  birkenstrasse:{ name: TX('Die Birkenstraße'), x: 0.143, y: 0.405, gefahr: 2, art: 'strasse', sichtbar: false, status: 'offen', mission: 'eskorte',
                  sichtbarWenn: () => ortBekannt('birkenhain'),
                  ressourcen: TX('Viel Nahrung, Holz und neue Einwohner aus Birkenhain'), belohnung: TX('Nahrung, Einwohner, bessere Beziehung'),
                  plaene: TX('Eine sichere Handelsstraße zwischen den Dörfern'),
                  text: TX('Ein Waldweg zwischen Birkenhain und deinem Dorf. Für Karren gerade breit genug, für Wölfe genau richtig.') },
  birkenhain:   { name: TX('Birkenhain'), x: 0.059, y: 0.243, gefahr: 0, art: 'siedlung', sichtbar: false, handel: true,
                  ressourcen: TX('Bauerndorf: tauscht Nahrung gegen Gold und Holz'),
                  plaene: TX('Bündnis oder Streit, je nachdem, wie du sie behandelst'),
                  text: TX('Ein Dorf aus Birkenholz und Lehm. Sie haben mehr Korn als Waffen.') },
  eisenfurt:    { name: TX('Eisenfurt'), x: 0.768, y: 0.116, gefahr: 0, art: 'siedlung', sichtbar: false, handel: true,
                  ressourcen: TX('Bergbaudorf: tauscht Stein und Lazi-Teile gegen Nahrung'),
                  plaene: TX('Bündnis oder Krieg um die Erzadern in den Bergen'),
                  text: TX('Ein Bergdorf an einem Fluss voller Eisenerz. Sie trauen niemandem, der aus dem Tal kommt.') },
  karawane:     { name: TX('Karawane Rostrot'), x: 0.534, y: 0.472, gefahr: 0, art: 'siedlung', sichtbar: false, versteckt: true, handel: true },
  nullbunker:   { name: TX('Der Nullbunker'), x: 0.948, y: 0.861, gefahr: 5, art: 'nullbunker', sichtbar: false, nurFinale: true, status: 'offen', mission: 'nullbunker',
                  missionWahl: () => SPIEL.zwiespalt && !SPIEL.ende ? 'zwiespalt' : 'nullbunker',
                  sichtbarWenn: () => !!SPIEL.alleZiele,
                  ressourcen: TX('Das Ende des Mittelteils: der Kern von KUSTOS und der innere Kreis'), belohnung: TX('Die Entscheidung über das Protokoll'),
                  plaene: TX('Drei Abschnitte, kein Zurück: die Schleuse, die Zählhalle, der Kern'),
                  text: TX('Hinter den Werken, wo der alte Stadtkern in die Erde gesunken ist, tiefer als alle anderen Bunker. Er hat keine Nummer, nur eine Null. Von hier kommt der Funkspruch: „ZÄHLUNG ABGESCHLOSSEN.“') },
  hort:         { name: TX('Der Hort des Alphas'), x: 0.326, y: 0.069, gefahr: 4, art: 'geheim', sichtbar: false, status: 'offen', mission: 'hort', geheim: true,
                  ressourcen: TX('Geheimmission: legendäre Beute, mit Glück sogar Lazi-Qualität'), belohnung: TX('Eine legendäre Waffe'),
                  text: TX('Ein Kreuz auf einer alten Karte, tief im Wald. Dort, wo die Wölfe herkommen.') },
};

// Personen, die Nachrichten schicken oder im Wirtshaus reden. bild: welcher Dorfbewohner als Porträt
const PERSONEN = {
  mara:      { name: TX('Mara'), rolle: TX('Späherin'), farbe: '#8ad860', bild: 1 },
  ebert:     { name: TX('Der alte Ebert'), rolle: TX('Chronist'), farbe: '#eab03a', bild: 0 },
  funk:      { name: TX('Unbekannter Funkspruch'), rolle: TX('Lazi-Signal'), farbe: '#5ff0e0', bild: null },
  junge:     { name: TX('Tomek'), rolle: TX('Junge aus Birkenhain'), farbe: '#ff9a80', bild: 4 },
  kalle:     { name: TX('Kalle'), rolle: TX('Schrotthändler, ehrlich, sagt er'), farbe: '#c0a070', bild: 2 },
  harnstedt: { name: TX('Frau von Harnstedt'), rolle: TX('Adel ohne Vermögen'), farbe: '#c890ff', bild: 3 },
  gernot:    { name: TX('Gernot'), rolle: TX('Weiß Bescheid'), farbe: '#e8c040', bild: 5 },
  lotte:     { name: TX('Lotte'), rolle: TX('Schankmagd'), farbe: '#ff8ab0', bild: 6 },
  rudi:      { name: TX('Rudi'), rolle: TX('Wirt'), farbe: '#d8d0b8', bild: 7 },
  anselm:    { name: TX('Bruder Anselm'), rolle: TX('Einer der Bestehenden'), farbe: '#5ff0e0', bild: 3 },
  ilse:      { name: TX('Ilse'), rolle: TX('Sucht ihren Sohn'), farbe: '#a8b0c8', bild: 1 },
  // kommen mit der Zeit dazu
  grimbart:  { name: TX('Meister Grimbart'), rolle: TX('Schmiedemeister aus den Bergen'), farbe: '#ff9a3a', bild: 2 },
  wenzel:    { name: TX('Dr. Theodora Wenzel'), rolle: TX('Forscherin, sagt sie'), farbe: '#7ad0e0', bild: 3 },
  jupp:      { name: TX('Jupp'), rolle: TX('Lebenskünstler'), farbe: '#8ad860', bild: 5 },
  bodo:      { name: TX('Bodo Kranz'), rolle: TX('Selbsternannter Ratsherr'), farbe: '#d04040', bild: 0 },
  hilde:     { name: TX('Oma Hilde'), rolle: TX('Hat alles schon gesehen'), farbe: '#ffb0d0', bild: 6 },
  piet:      { name: TX('Piet'), rolle: TX('Fischer vom Fluss'), farbe: '#78a8ff', bild: 7 },
  erzaehler: { name: TX('Erster Eindruck'), rolle: TX('Was du siehst'), farbe: '#d8d0b8', bild: null },
  haendler:  { name: TX('Händler'), rolle: TX('Nachbardorf'), farbe: '#eab03a', bild: 4 },
  hanne:     { name: TX('Hanne Kehl'), rolle: TX('Rostbrecherin'), farbe: '#c0612c', bild: 2 },
  fuchs:     { name: TX('Der Fuchs'), rolle: TX('Dieb, schreibt Zettel'), farbe: '#e8803a', bild: 4 },
  kustos:    { name: 'KUSTOS', rolle: TX('Der Hüter'), farbe: '#5ff0e0', bild: null },
};

// Neue Leute kommen ins Dorf, sobald es groß genug ist
const FIGUREN_ANKUNFT = [
  { wer: 'jupp',  einwohner: 10 },
  { wer: 'bodo',  einwohner: 16 },
  { wer: 'hilde', einwohner: 22 },
  { wer: 'piet',  einwohner: 26, epoche: 1 },
];
const ANKUNFT = {
  grimbart: [
    ['grimbart', TX('Grüß Gott beinand! Grimbart hoaß i, Schmied bin i. Und des, wos ihr bis jetzt Schmiede gnennt habts, des war a Witz. A guada Witz, aber a Witz.')],
    ['grimbart', TX('Jetzt, wo’s an gscheidn Ofen habts, kann i eich wos Gscheids macha. Meisterstücke. Aus Wolfsfell, Golemkern, Lazi-Splitter, wos ihr halt findts da draußn.')],
    ['grimbart', TX('Je seltener des Zeig, desto edler wird’s. A Alphafell oder a Golemkern, des gibt wos Legendäres. Do schaugt sogar da Herrgott zwoamoi hi.')],
    ['grimbart', TX('Und wenn’s amoi a Labor habts, mit so am Gstudierten, dann kenna mia zwoa a Gift oder an Frost gezielt in de Klinga einarbeiten. Oana alloa schafft des ned.')],
  ],
  wenzel: [
    ['wenzel', TX('Dr. Theodora Wenzel. Promoviert in angewandter Lazi-Kunde. Ja, so etwas gab es einmal. Nein, ich erkläre es Ihnen nicht.')],
    ['wenzel', TX('Ihr Labor ist … akzeptabel. Feucht, zugig, voller Spinnen. Für hiesige Verhältnisse also ein Palast.')],
    ['wenzel', TX('Bringen Sie mir Bücher aus der Universität. Je mehr, desto besser. Für die schwierigen Projekte auch Lazi-Splitter. Und bitte: Fassen Sie nichts an.')],
    ['wenzel', TX('Was ich erforsche, kann Ihr bayerischer Hufschmied in seine Klingen einarbeiten. Gift, Frost, Dornen. Wir werden uns streiten. Es wird großartig.')],
  ],
  jupp: [
    ['jupp', TX('Dat is ja ’ne schöne Ecke hier! Jupp, anjenehm. Isch bin hier nur auf der Durchreise. Seit drei Wochen.')],
    ['jupp', TX('Isch hab nix außer mein Kraut und mein jutes Herz. Dat Kraut teil isch, dat Herz och. Beides macht glücklich.')],
    ['jupp', TX('Weißte, wat dat Problem mit de Welt is? Alle wollen wat bauen. Keiner will ma sitzen. Setz disch ma. … Siehste. Schon besser.')],
  ],
  bodo: [
    ['bodo', TX('Bodo Kranz. Ich übernehme ab sofort die Verwaltung. Hat mich niemand darum gebeten? Eben. Darum ja.')],
    ['bodo', TX('Ich habe mir das Dorf angesehen. Zu viele Leute, zu wenig Ordnung, und der Wirt schenkt zu voll ein. Das ändert sich.')],
    ['bodo', TX('Und Sie, Held? Sie laufen draußen herum und hauen Wölfe. Schön für Sie. Ich mache hier die eigentliche Arbeit.')],
  ],
  hilde: [
    ['hilde', TX('Na, wat glotzte so? Noch nie ’ne Oma jesehen, die ’nen Plünderer mit’m Nudelholz verdroschen hat? Hilde. Ick bleib hier.')],
    ['hilde', TX('Und dem Schnösel mit dem Klemmbrett, dem Bodo, dem sachste, wenn der mir noch eenmal ’ne Jebühr abknöpfen will, kriegt der det Nudelholz ooch.')],
  ],
  piet: [
    ['piet', TX('Moin.')],
    ['piet', TX('Piet. Fischer. Vom Fluss.')],
    ['piet', TX('Is’n schöner Wasserfall da oben in den Bergen. Da is wat hinter. Mehr sach ich nich.')],
  ],
};

// ---------------------------------------------------------------------
// Story-Stufen: Was man schon weiß. Texte, die mehr verraten, warten auf ihre Stufe,
// und Figuren reden später über anderes ({ ab, bis } an Gesprächen, storyAb() im Code).
// ---------------------------------------------------------------------
const STORY_STUFEN = [
  { id: 'anfang',     wenn: () => true },
  { id: 'strom',      wenn: () => typeof stromFrei === 'function' && stromFrei() },                          // Das Kraftwerk läuft
  { id: 'verbuende',  wenn: () => !!(SPIEL.bestehende && SPIEL.bestehende.anselm && SPIEL.bestehende.anselm !== 0) || hatLore('kustos') }, // Anselm war am Tor
  { id: 'kustos',     wenn: () => hatLore('kustos') },                                                        // Man weiß von KUSTOS und dem inneren Kreis
  { id: 'nullbunker', wenn: () => !!SPIEL.alleZiele },                                                        // Der Nullbunker ist offen
  { id: 'ende',       wenn: () => !!SPIEL.ende },                                                             // Das Finale ist gespielt
];
// Ohne Geschichte ist nichts ein Geheimnis: Verbünde und Bestehende sind von Anfang an bekannt, nur das Finale gibt es nicht
function storyStufe() { if (regel('alleOrteOffen')) return STORY_STUFEN.findIndex(s => s.id === 'kustos'); let n = 0; STORY_STUFEN.forEach((s, i) => { if (s.wenn()) n = i; }); return n; }
function storyAb(id) { return storyStufe() >= STORY_STUFEN.findIndex(s => s.id === id); }
function gespraechPasst(o) { return !o || ((!o.ab || storyAb(o.ab)) && (!o.bis || !storyAb(o.bis))); }
// Was man über einen fehlenden Chronik-Eintrag ahnen darf: Hinweise, die zu viel verraten, warten auf ihre Stufe (hinweisAb)
function loreHinweis(l) { return gespraechPasst({ ab: l.hinweisAb }) ? l.hinweis || '' : ''; }
// Manche Einträge gibt es nur auf einem Weg (nurWenn, etwa die Wahl an der Schleuse). Die anderen zählen nicht mit.
function loreAktiv() { return LORE.filter(l => !l.nurWenn || l.nurWenn() || hatLore(l.id)); }

// Im Wirtshaus quatschen: Leute, wie sie eben sind
const GESPRAECHE = [
  ['kalle', TX('Ey, Chef! Willste ’n Toaster? Funktioniert nich, aber guck dir mal den Chrom an. Den Chrom, Alter.')],
  ['kalle', TX('Die Plünderer vom Fluss sind keine schlechten Menschen, sag ich immer. Die sind einfach Arschlöcher. Is’ ’n Unterschied.')],
  ['kalle', TX('Ich hab ’nen Lazi-Teil gefunden, das summt, wenn man’s anfasst. Willste? Zwanzig Gold. Fünfzehn. Okay, nimm’s einfach mit, das Ding macht mir Angst.')],
  ['kalle', TX('Strom, Alter! Ich hab meinen Toaster angeschlossen. Er hat geraucht, dann hat er gebrannt. Aber drei Sekunden lang war das Toast.'), { ab: 'strom' }],
  ['harnstedt', TX('Mein Urgroßvater besaß drei Fabriken. Ich besitze diesen Becher. Und selbst der hat einen Sprung.')],
  ['harnstedt', TX('Sie riechen nach Wolf, mein Lieber. Das ist kein Vorwurf. Nur eine Feststellung, die ich mit dem ganzen Raum teile.')],
  ['harnstedt', TX('Früher hatten wir Personal. Heute habe ich Gernot. Gernot ist kein Personal. Gernot ist eine Prüfung.')],
  ['gernot', TX('Die Laternen in der Uni. Die gucken. Ich sag nicht, dass die gucken. Ich sag nur: Warum leuchten die noch, wenn keiner da ist? Hä? Na?'), { bis: 'kustos' }],
  ['gernot', TX('Die Verbünde. Fünf Stück. Fünf! Wie die Finger an einer Hand. Und wem gehört die Hand? Na? Eben.'), { ab: 'verbuende' }],
  ['gernot', TX('KUSTOS. Der Hüter. Ich hab’s doch gesagt, die Laternen gucken. Jetzt glaubt mir keiner, dass ich’s gesagt hab.'), { ab: 'kustos' }],
  ['gernot', TX('Wölfe mit blauen Adern. Zufall? Bestimmt. Genauso wie es Zufall ist, dass ich seit drei Tagen kein Brot mehr kriege.')],
  ['gernot', TX('„Left Alone, Continue Indefinitely.“ Allein gelassen. Wer hat die allein gelassen? Wir. Und jetzt? Jetzt sind wir allein. Denk mal drüber nach. Ich hab’s.')],
  ['lotte', TX('Stimmt das, dass man früher Wasser aus der Wand holen konnte? Einfach so? Und keiner musste dafür zum Bach?')],
  ['lotte', TX('Ich hab gehört, du hast gegen einen Golem gekämpft. War der nett? Also, bevor er dich hauen wollte?')],
  ['lotte', TX('Rudi sagt, Bier ist flüssiges Brot. Dann ist Rudis Bier verschimmeltes Brot. Hab ich ihm nicht gesagt. Sag’s ihm auch nicht.')],
  ['lotte', TX('Ist das jetzt das Ende? Ich dachte, danach wird alles anders. Ich muss trotzdem morgen die Krüge spülen.'), { ab: 'ende' }],
  ['rudi', TX('Anschreiben gibt’s nicht. Die letzten drei, die anschreiben wollten, liegen jetzt am Waldrand. Natürliche Ursachen. Wölfe, glaub ich.')],
  ['rudi', TX('Ich brau das Zeug aus Rüben und Verzweiflung. Die Rüben gehen uns langsam aus.')],
  ['rudi', TX('Seit das Kraftwerk läuft, ist das Bier kalt. Fortschritt, sag ich. Der Rest kann mir gestohlen bleiben.'), { ab: 'strom' }],
  ['rudi', TX('Du willst wissen, was die Leute hier glücklich macht? Ein Dach, warme Füße, was im Magen. Und dass einer die Runde zahlt. Rate mal, wer.')],
  ['anselm', TX('Die Maschinen schlafen nicht, mein Kind. Sie warten. Und wer wartet, der hofft. Ist das nicht schön?')],
  ['anselm', TX('Du nennst sie Lazi, als wäre es ein Hund. Wir nennen sie die Bestehenden, und uns nach ihnen. Wir sind, solange sie sind.'), { bis: 'ende' }],
  ['anselm', TX('Ich habe dir von den Verbünden erzählt. Vielleicht zu früh, vielleicht zu spät. Bei Maschinen weiß man das nie so genau.'), { ab: 'kustos', bis: 'ende' }],
  ['anselm', TX('Es ist still geworden im Tal. Nicht die gute Stille und nicht die schlechte. Die Stille danach.'), { ab: 'ende' }],
  ['ilse', TX('Haben Sie meinen Emil gesehen? Er ist so groß. Grüne Mütze. Er wollte nur Holz holen. Nur Holz.')],
  ['ilse', TX('Entschuldigung. Ich frag jeden. Ich weiß, dass ich jeden frage.')],
  // Diese reden erst, wenn sie im Dorf wohnen
  ['jupp', TX('Et is wie et is. Et kütt wie et kütt. Un et hätt noch immer jot jejange. Dat is kölsches Grundgesetz, dat jilt sogar nach’m Weltuntergang.')],
  ['jupp', TX('Die Maschinen warten auf uns, sagt der Anselm. Isch sach: Die warten auf jar nix. Die sind einfach nur … da. So wie isch. Wir verstehen uns.')],
  ['jupp', TX('Mann, isch hab grad so ’nen Jedanken jehabt. Wenn die Alten alles jehabt haben, warum sind die dann weg? … Vielleicht, weil alles haben langweilig is.')],
  ['jupp', TX('Du kämpfst jeden Tach, damit wir hier sitzen können. Dann sitz och ma. Sonst haste ja nix davon.')],
  ['jupp', TX('Jib mir ma Feuer. Nee, nit dat vom Lagerfeuer, dat is zu jroß.')],
  ['bodo', TX('Ich habe eine Liste gemacht, wer hier zu viel isst. Sie stehen drauf. Gernot steht zweimal drauf.')],
  ['bodo', TX('Gebühren, mein Lieber. Fürs Feuer, für den Weg, für die Luft. Irgendwer muss ja an die Zukunft denken. An meine.')],
  ['bodo', TX('Ilse sucht immer noch ihren Sohn? Ich habe ihr gesagt, sie soll sich einen neuen suchen. Effizienz.')],
  ['bodo', TX('Wenn Sie da draußen mal fallen, bekomme ich dann Ihre Rüstung? Rein organisatorisch gefragt.')],
  ['hilde', TX('Junge, iss wat. Du siehst aus wie ’n Besenstiel mit Rüstung.')],
  ['hilde', TX('Der Bodo? Der is so falsch, der lügt sogar, wenn er die Uhrzeit sacht.')],
  ['hilde', TX('Früher war allet besser? Quatsch. Früher war allet früher.')],
  ['hilde', TX('Da unten im Bunker warst du? Und? Hat’s wenigstens warm gegeben? … Na also. Iss wat.'), { ab: 'ende' }],
  ['piet', TX('Moin.')],
  ['piet', TX('Fisch beißt nich. Zu viel Lazi-Zeug im Wasser. Leuchten tun se aber schön.')],
  ['piet', TX('Snack nich, mook. … Heißt: Nich reden, machen.')],
  ['grimbart', TX('Da Bodo hat ma a Rechnung gschriebn. Für mei eigne Esse. I hab’s eigschürt. Warm war’s.')],
  ['grimbart', TX('De Frau Doktor moant, i soi mei Hammer „kalibrieren“. I kalibrier ihr glei wos.')],
  ['wenzel', TX('Grimbart nennt meine Formeln „Gschmarri“. Ich habe nachgeschlagen. Es ist kein Kompliment.')],
  ['wenzel', TX('Ich habe Jupps Kraut analysiert. Wissenschaftlich. Mehrmals. Die Ergebnisse sind … ermutigend.')],
];
// Wer mit wem reden kann: Neue Figuren erst, wenn sie da sind
function figurDa(wer) {
  if (wer === 'anselm') return !(SPIEL.bestehende && SPIEL.bestehende.anselm === -1);   // Vertrieben: Er kommt nicht mehr
  if (wer === 'grimbart') return !!SPIEL.meister;
  if (wer === 'wenzel') return !!SPIEL.forscherin;
  if (FIGUREN_ANKUNFT.some(f => f.wer === wer)) return SPIEL.figuren.includes(wer);
  return true;
}
// Erster Eindruck, wenn man einen Ort zum ersten Mal betritt
const ERSTEINDRUCK = {
  erzwaesche: [
    ['erzaehler', TX('Unter Eisenfurt ist der Berg frisch aufgerissen. Die Terrassen sind alt und überwachsen, aber die Grube darin ist neu, und in der Grube steht eine Maschine mit einem Schaufelrad, so groß wie ein Haus.')],
    ['erzaehler', TX('Ein Förderband läuft zur Erzwäsche am Fluss. Davor ein Becken voller rotem Schlamm, aus dem drei Rohre in den Fluss spucken. Oberhalb ist das Wasser klar. Unterhalb ist es rot.')],
    ['mara', TX('Das ist der Fluss, aus dem Eisenfurt trinkt. Denk an das, was der Junge erzählt hat: Wälzt sie sich im Schlamm, prallt alles an ihr ab. Lock sie nah an ein blaues Ventil und dreh es auf.')],
  ],
  schleuse: [
    ['erzaehler', TX('Der Fluss wird hier breit und still. Quer darüber liegt ein Damm aus Beton, und davor, so weit man sehen kann, Kähne. Hunderte, in einer Reihe, Bug an Heck.')],
    ['erzaehler', TX('Auf dem Kai stehen Container, manche aufgebrochen. Ein Kran hält seinen Haken über das Wasser, als würde er gleich etwas heben.')],
    ['erzaehler', TX('Am Steuerhaus leuchtet eine Tafel: „WARTESCHLANGE: 212. NÄCHSTER: KAHN 1. BITTE WARTEN.“')],
    ['mara', TX('Die Plünderer da unten schlachten die Kähne aus, und die Maschine am Steuerhaus lässt sie machen. Sie lässt nur niemanden durch die Schleuse.')],
    ['mara', TX('Und denk dran, was Piet erzählt hat: Springt ihre Ampel auf Rot, bleibst du stehen. Ebert hat es extra in die Chronik geschrieben.')],
  ],
  nullbunker: [
    ['erzaehler', TX('Unter der Stadt, unter den Bunkern, unter allem: eine Treppe, die nicht aufhört. Die Luft wird warm und riecht nach heißem Staub.')],
    ['erzaehler', TX('Am Ende eine Tür ohne Nummer. Nur eine Null, so groß wie du. Daneben ein Lautsprecher, aus dem leise gezählt wird.')],
    ['kustos', TX('BESUCHER ERFASST. EINER. ZÄHLUNG WIRD ANGEPASST.')],
  ],
  lazifabrik: [
    ['erzaehler', TX('Schon von weitem hört man sie: ein gleichmäßiges Klacken, Tag und Nacht, seit dreihundert Jahren. Die Fabrik arbeitet.')],
    ['erzaehler', TX('Vor dem Werkstor stapeln sich Kisten bis unter das Dach der Laderampe. Niemand holt sie ab. Die Bänder laufen trotzdem weiter.')],
    ['harnstedt', TX('Das Tor hat mein Urgroßvater entworfen. Man sieht es an den Schnörkeln. Wie geschmacklos, eine Fabrik mit Schnörkeln.')],
    ['erzaehler', TX('Durch einen Spalt im Tor fällt orangefarbenes Licht. Und eine Stimme, blechern, laut: „… VIER. FÜNF. SECHS. BESTAND KORREKT. VON VORN.“')],
  ],
  kraftwerk: [
    ['erzaehler', TX('Hinter der toten Stadt ragen zwei Schlote aus Ziegeln über die Werke. Aus einem steigt ein dünner Faden Rauch. Das sollte nicht sein.')],
    ['erzaehler', TX('Im Hof surren kleine gelbe Roboter herum und polieren Rohre, die seit Jahrhunderten niemand mehr benutzt. Zwei Türme drehen ihre Köpfe nach dir.')],
    ['erzaehler', TX('Hinter dem Tor brummt etwas. Ein Geräusch wie ein großer, müder Atem.')],
  ],
  universitaet: [
    ['erzaehler', TX('Die Universität steht auf einem Hügel über dem Fluss. Weiße Mauern, grau geworden, Efeu bis unters Dach.')],
    ['erzaehler', TX('Über dem Eingang hängt eine Uhr. Sie steht auf fünf vor zwölf, und das schon seit Jahrhunderten.')],
    ['erzaehler', TX('Auf dem Hof parkt ein gelber Bus, aus dem ein Baum wächst. Die Linien eines alten Spielfelds sind noch zu erkennen.')],
    ['erzaehler', TX('Aus den Fenstern flackert blaues Licht. Irgendwo drinnen spricht eine Stimme, ruhig und freundlich, zu niemandem.')],
    ['mara', TX('Die Tür zum Archiv ist da vorne, zwischen den Barrikaden. Dahinter stehen Regale voller Bücher der Alten. Ebert würde dafür seine Brille verkaufen.')],
    ['mara', TX('Und die roten Fässer da drüben: Öl. Wenn hier gekämpft wird, dann stell dich bloß nicht mit Feuer daneben. Oder genau dann.')],
    ['erzaehler', TX('Am Flussufer bewegen sich Gestalten in Kapuzen. Für sie ist Papier vor allem eines: Brennstoff.')],
  ],
  wald: [
    ['erzaehler', TX('Der dunkle Wald beginnt nicht langsam. Eben noch Wiese, dann stehen die Tannen so dicht, dass der Himmel verschwindet.')],
    ['erzaehler', TX('Es riecht nach Harz, nach nassem Moos und nach etwas Süßlichem, über das man lieber nicht nachdenkt.')],
    ['erzaehler', TX('Auf einer Lichtung liegt eine alte Feuerstelle. Jemand hat hier schon einmal die Nacht verbracht. Die Knochen daneben erzählen, wie es ausging.')],
    ['mara', TX('Ein Bach, eine Furt aus Brettern, Dornen überall. Und Totholz. Viel Totholz. Das ist unser Glück.')],
    ['erzaehler', TX('Zwischen den Bäumen leuchtet es blau. Erst zwei Punkte. Dann vier. Dann hörst du auf zu zählen.')],
    ['mara', TX('Solange das Feuer brennt, trauen sie sich nicht ganz heran. Lass es nicht ausgehen.')],
  ],
  hort: [
    ['erzaehler', TX('Der Weg zum Kreuz auf der Karte führt bergab, durch Farn, der dir bis zur Brust reicht.')],
    ['erzaehler', TX('Dann wird es still. Keine Vögel, kein Wind. Nur das Knacken von Knochen unter deinen Stiefeln.')],
    ['erzaehler', TX('Vor der Höhle steckt eine rostige Tür halb im Fels. Darauf, kaum noch lesbar: L.A.C.I. NOTRESERVE.')],
    ['erzaehler', TX('Und vor der Tür liegen zwei Wölfe, groß wie Pferde. Sie schlafen nicht.')],
  ],
  stadt: [
    ['erzaehler', TX('Die Straße zwischen den Hochhäusern ist so breit wie ein Fluss. Moos wächst auf dem Asphalt, Birken wachsen aus den Fenstern.')],
    ['erzaehler', TX('An den Wänden hängen Schilder mit vier Buchstaben. L.A.C.I. Eines davon flackert noch. Es flackert seit Jahrhunderten.')],
    ['erzaehler', TX('Mitten auf einem Platz ragt ein Klotz aus Beton aus dem Boden. Eine runde Stahltür, darauf eine Nummer: 17. Daneben leuchtet ein grünes Licht.')],
    ['kalle', TX('Vorgestern war das Licht noch rot. Gernot schwört, er hat da drin Stimmen gehört. Menschenstimmen, Alter.')],
    ['erzaehler', TX('Mit einem Zischen dreht sich das Rad an der Tür. Dahinter: Gesichter, blass wie Papier, die Augen zusammengekniffen gegen das Licht.')],
    ['erzaehler', TX('Und hinter dir, zwischen den Ruinen: Schritte. Die Plünderer haben das grüne Licht auch gesehen.')],
  ],
  lager: [
    ['erzaehler', TX('Rauch steigt über dem Flussufer auf. Zelte aus Planen und Autotüren, eine Palisade aus Treibholz.')],
    ['erzaehler', TX('Auf zwei wackligen Türmen sitzen Schützen. Sie schauen gelangweilt aufs Wasser. Noch.')],
    ['mara', TX('Drei große Zelte in der Mitte. Da lagern sie alles, was sie geklaut haben. Brennen die, ist das Lager erledigt.')],
    ['mara', TX('Und siehst du die Fässer? Öl. Die Idioten stapeln es neben dem Lagerfeuer.')],
  ],
  birkenstrasse: [
    ['erzaehler', TX('Der Karren steht schon bereit. Davor ein Lastläufer: ein vierbeiniger Lazi-Roboter, rostig, mit einem leuchtenden Auge.')],
    ['haendler', TX('Das ist Paul. Paul läuft geradeaus und bleibt stehen, wenn was im Weg ist. Mehr kann er nicht. Mehr muss er nicht.')],
    ['haendler', TX('Bleib bei ihm. Allein traut er sich nicht. Und lass die Wölfe nicht ans Korn.')],
  ],
  birkenhain: [
    ['erzaehler', TX('Birkenhain riecht nach frischem Brot und nassem Stroh. Zwischen weißen Birken stehen Häuser aus Lehm, die Dächer tief über den Fenstern.')],
    ['erzaehler', TX('Kinder rennen hinter Hühnern her. Ein alter Mann schärft eine Sense und nickt dir zu, ohne aufzuhören.')],
    ['haendler', TX('Fremde? Händler oder Ärger? Wenn Händler: Der Markt ist da vorne. Wenn Ärger: Wir haben Sensen.')],
  ],
  // Ist der Erzschürfer erwacht und noch nicht abgeschaltet oder repariert, ist der Fluss unter Eisenfurt rot
  get eisenfurt() { return [
    ['erzaehler', SPIEL && SPIEL.erzRuf && !['aus', 'alle'].includes(erzWahl()) ? TX('Eisenfurt klebt an der Bergflanke wie ein Schwalbennest. Der Fluss darunter ist rot wie Rost.') : TX('Eisenfurt klebt an der Bergflanke wie ein Schwalbennest. Der Fluss darunter ist klar und eiskalt.')],
    ['erzaehler', TX('Überall hämmert es. Die Leute hier haben schwarze Hände, müde Augen und keine Zeit für Fremde.')],
    ['haendler', TX('Ihr kommt aus dem Tal. Das sieht man an den sauberen Stiefeln. Wollt ihr handeln, dann handelt. Wollt ihr reden, geht wieder.')],
  ]; },
};
// Im Labor und in der Schmiede
const FORSCHUNG_SPRUECHE = [
  TX('„{name}“. Endlich etwas Anspruchsvolles. Ich brauche Ruhe, Bücher und keinen Besuch.'),
  TX('„{name}“? Gut. Kommen Sie in ein paar Tagen wieder. Nicht vorher. Wirklich nicht vorher.'),
  TX('Ich habe Grimbart gesagt, dass ich „{name}“ erforsche. Er hat „Mei“ gesagt. Ich werte das als Zustimmung.'),
];
const MEISTER_SPRUECHE = [
  TX('Do schaug her. Des is a Trumm, gell? Pass auf, dass’d da ned selber wehtuast.'),
  TX('Fertig. Und wenn’s bricht, bringst as zruck. Brechen tuat’s aber ned.'),
  TX('So. Des hält länger als am Bodo sei Mundwerk. Und des hält ewig.'),
];
// Händler in den Nachbardörfern. braucht: wie gut die Beziehung mindestens sein muss
const HAENDLER = {
  // Karawane Rostrot: kommt nur über den Funkturm
  karawane: [
    { name: TX('Händlerin Rostrot'), text: TX('Ich hab, was ihr nicht habt. Kohle für eure Kessel, zum Beispiel.'), angebote: [
      { gib: { gold: 40 }, nimm: { holzkohle: 20 } }, { gib: { holz: 40 }, nimm: { holzkohle: 18 } }, { gib: { gold: 60 }, nimm: { beschlaege: 8 } }] },
    { name: TX('Der stumme Sammler'), text: TX('Zeigt wortlos auf seine Kisten.'), angebote: [
      { gib: { gold: 50 }, nimm: { teile: 7 } }, { gib: { teile: 4 }, nimm: { buecher: 3 } }, { gib: { nahrung: 40 }, nimm: { gold: 30 } }] },
    // Stammkunden: Wer oft mit der Karawane handelt (oder sie decken lässt), bekommt mehr zu sehen
    { name: TX('Schrauben-Edda'), text: TX('Schrauben, Winkel, Bänder. Alles gerade, ich hab nachgemessen.'), braucht: 1, zuText: TX('Edda verkauft nur an Leute, die die Karawane kennt. Handelt erst ein paarmal mit den anderen.'), angebote: [
      { gib: { gold: 45 }, nimm: { beschlaege: 8 } }, { gib: { holzkohle: 20 }, nimm: { beschlaege: 7 } }, { gib: { gold: 70 }, nimm: { altmetall: 20 } }] },
    { name: TX('Fundsucherin Ilse'), text: TX('Was ich habe, findet man nicht zweimal. Schmiedemeister zahlen gut dafür.'), braucht: 3, zuText: TX('Ilse zeigt ihre Kisten nur Stammkunden. So weit seid ihr noch nicht.'), angebote: [
      { gib: { gold: 240 }, nimm: { golemkern: 1 } }, { gib: { gold: 180 }, nimm: { alphafell: 1 } }, { gib: { gold: 140 }, nimm: { lazisplitter: 3 } }] },
  ],
  birkenhain: [
    { name: TX('Bauer Henning'), text: TX('Korn, Rüben, Räucherfleisch. Was brauchst du?'), angebote: [
      { gib: { gold: 20 }, nimm: { nahrung: 30 } }, { gib: { holz: 10 }, nimm: { nahrung: 15 } }, { gib: { gold: 45 }, nimm: { nahrung: 80 } }] },
    { name: TX('Holzhändlerin Grete'), text: TX('Birkenholz brennt am besten. Und Steine haben wir vom Acker genug.'), angebote: [
      { gib: { gold: 25 }, nimm: { holz: 30 } }, { gib: { nahrung: 20 }, nimm: { holz: 18 } }, { gib: { gold: 30 }, nimm: { stein: 20 } }] },
    { name: TX('Der Dorfälteste'), text: TX('Ein paar junge Leute wollen weg von hier. Wenn ihr gut zu ihnen seid …'), braucht: 1, angebote: [
      { gib: { gold: 40, nahrung: 10 }, nimm: { einwohner: 2 } }] },
  ],
  eisenfurt: [
    { name: TX('Vorarbeiterin Brakel'), text: TX('Stein. Viel Stein. Sonst nix.'), angebote: [
      { gib: { nahrung: 25 }, nimm: { stein: 15 } }, { gib: { gold: 40 }, nimm: { stein: 35 } }, { gib: { holz: 20 }, nimm: { stein: 14 } }] },
    { name: TX('Erzschmied Ruß'), text: TX('Lazi-Teile aus dem Berg. Und Holzkohle, wenn du mir was Gescheites gibst.'), angebote: [
      { gib: { gold: 40 }, nimm: { teile: 5 } }, { gib: { gold: 50 }, nimm: { holzkohle: 18 } }, { gib: { holzkohle: 6 }, nimm: { beschlaege: 3 } }] },
    { name: TX('Werber am Stollen'), text: TX('Ein paar Bergleute haben genug vom Berg. Zahlst du ihren Schuldschein, gehen sie mit dir.'), braucht: 1, angebote: [
      { gib: { gold: 60, nahrung: 15 }, nimm: { einwohner: 2 } }] },
  ],
};
// Am Tresen trinken: Tipps für den Kampf und Gerüchte, die neue Orte und Chronik-Einträge bringen
const GERUECHTE = [
  { wer: 'rudi', text: TX('Brandstifter tragen ihr Öl auf dem Rücken. Hau sie um, bevor die Lunte brennt, und du hast ’ne Pfütze. Zünd die Pfütze an, und du hast ’nen Abend, über den man noch lange redet.') },
  { wer: 'kalle', text: TX('Schildträger, ja? Die Autotür hält alles von vorne. Von hinten hält die gar nix. Oder du haust richtig fest drauf, dann ist die Tür im Arsch.') },
  { wer: 'gernot', text: TX('Trommler. Wenn du einen trommeln hörst, hau den zuerst um. Die anderen werden davon schneller. Das ist Wissenschaft. Oder Musik. Eins von beiden.') },
  { wer: 'harnstedt', text: TX('Man erzählt sich, gefrorene Feinde zerspringen wie billiges Porzellan, wenn man nur ordentlich zuschlägt. Ich hatte einmal teures Porzellan.') },
  { wer: 'lotte', text: TX('Ein Jäger hat gesagt, wenn Gift und Blutung zusammenkommen, dann ist es doppelt so schlimm. Er hat dabei ganz komisch gelächelt.') },
  { wer: 'kalle', text: TX('Die Fässer in der Uni? Voller Öl, Alter. Hau eins an, und es läuft aus. Halt Feuer dran, und es fliegt dir um die Ohren. Am besten den anderen um die Ohren.') },
  { wer: 'rudi', text: TX('Gegner mit farbigem Ring drumrum sind zäher als die anderen. Dafür haben die manchmal was Schönes in der Tasche.') },
  { wer: 'kalle', text: TX('Im Norden, über den Fluss und durch die Birken, liegt Birkenhain. Bauern. Mehr Korn als Verstand. Also, nett sind die. Handel lohnt sich.'), folge: { entdecken: 'birkenhain', lore: 'nachbarn' } },
  { wer: 'rudi', text: TX('Im Nordosten, oben in den Bergen, hocken Leute in einem Nest namens Eisenfurt. Die graben. Freundlich sind die nicht, aber Stein haben sie.'), folge: { entdecken: 'eisenfurt' } },
  { wer: 'anselm', text: TX('Hinter der toten Stadt, mitten in den Werken, steht ein Tempel aus Ziegeln mit zwei Türmen, die einst in den Himmel atmeten. Die Alten nannten ihn Kraftwerk. Er schläft. Er wartet auf schwarzes Brot.'), folge: { entdecken: 'kraftwerk', lore: 'oel' } },
  { wer: 'piet', text: TX('Flussaufwärts vom Plündererlager steht ein Damm mit einer Schleuse. Davor liegen Kähne, so viele, dass man sie nicht zählen kann. Mein Vater sagte immer, die warten. Neuerdings schlachten die Plünderer sie aus. Und wenn die Ampel an der großen Maschine rot wird, bleib stehen. Mein Onkel ist gerannt.'), folge: { entdecken: 'schleuse', lore: 'rotlicht' }, wenn: () => SPIEL.epoche >= 2 && (SPIEL.karte.erledigt.lager || 0) >= 1 },
  { wer: 'gernot', text: TX('Die verlassene Stadt im Osten, hinter dem alten Kanal. Hochhäuser, alle grün vor Moos. Und nachts? Licht in den Fenstern. Ich sag nur: Licht.'), folge: { entdecken: 'stadt' } },
  { wer: 'harnstedt', text: TX('Am Fuß der Eisenberge, hinter den Werken, liegt die Fabrik meiner Familie. Gehörte. Jetzt gehört sie den Maschinen, die sie gebaut hat. Wie unhöflich.'), folge: { entdecken: 'lazifabrik' } },
  { wer: 'ilse', text: TX('Mein Mann hatte eine Karte. Ein Kreuz im Wald, wo die großen Wölfe wohnen. Er ist nie zurückgekommen. Nehmen Sie sie. Ich will sie nicht mehr sehen.'), folge: { entdecken: 'hort' }, wenn: () => (SPIEL.karte.besucht.wald || 0) > 0 && !SPIEL.karte.erledigt.hort },
  { wer: 'anselm', text: TX('Unser innerster Kreis kennt die wahren Namen der Maschinen. Ich nicht. Noch nicht. Aber ich salbe ihre Kabel jeden Morgen mit Öl, und eines Tages werden sie mich erkennen.'), folge: { lore: 'bestehende' } },
];
// Eine Runde für alle
const RUNDE = [
  [['rudi', TX('Eine Runde für alle! Habt ihr gehört? Der Held zahlt! … Ja, Gernot, auch für dich.')], ['gernot', TX('Ich wusste es. Ich hab’s immer gesagt. Sobald es Freibier gibt, ist die Welt in Ordnung.')]],
  [['lotte', TX('Für alle? Auch für Frau von Harnstedt?')], ['harnstedt', TX('Ich nehme an. Aus Höflichkeit. Und weil ich seit Tagen nichts getrunken habe, das nicht aus einem Bach kam.')]],
  [['kalle', TX('Ey, auf den Chef! Der Chef ist korrekt! Der Chef … wie heißt der Chef eigentlich?')], ['rudi', TX('Trink einfach, Kalle.')]],
];

// Chronik: Stück für Stück erfährt man, was mit der Welt passiert ist
// ---------------------------------------------------------------------
// Die Chronik: Kapitel, Einträge mit Stimme, Nachträge und Hinweise
//  wer:      wer den Eintrag geschrieben hat oder was er ist. 'ebert' (Chronist), 'mara', 'anselm',
//            'fund' (ein Fundstück: Brief, Tagebuch, Ausdruck), 'funk' (Funkspruch der Maschinen), 'fuchs' (Zettel des Fuchses)
//  nachtrag: spätere Randnotizen. Sie erscheinen, sobald ihre Bedingung erfüllt ist.
//  hinweis:  was man über einen noch nicht gefundenen Eintrag ahnt
// ---------------------------------------------------------------------
const KAPITEL = [
  { id: 'alten', titel: TX('Die Alten'), text: TX('Was vor dreihundert Jahren geschah, und was davon übrig ist.') },
  { id: 'maschinen', titel: TX('Die Maschinen'), text: TX('Wer hier noch arbeitet, und für wen.') },
  { id: 'bestehende', titel: TX('Die Bestehenden'), text: TX('Die Menschen, die zu den Maschinen beten.') },
  { id: 'tal', titel: TX('Das Tal'), text: TX('Wälder, Bäche, Nachbarn und alles, was beißt.') },
  { id: 'bunker', titel: TX('Die Bunker'), text: TX('Was unter der Stadt liegt.') },
  { id: 'fuchs', titel: TX('Der Fuchs'), text: TX('Zettel von jemandem, der mehr weiß, als er sagt.') },
];
const LORE = [
  // Die Alten
  { id: 'aufschrift', kapitel: 'alten', wer: 'ebert', titel: TX('Die Aufschrift'), hinweis: TX('Vielleicht in der Universität.'),
    text: TX('Auf jeder Maschine, jeder Kiste, jedem Lichtschalter der Alten steht dasselbe: L.A.C.I. Die Kinder sprechen es „Lazi“, und inzwischen tun wir es alle. Ich habe die Buchstaben auf über hundert Dingen gefunden. Sie sind immer gleich geschrieben, immer unten rechts, als hätte jemand gewollt, dass man sie findet.'),
    nachtrag: [{ wenn: () => hatLore('befehl'), text: TX('Jetzt wissen wir, wofür die Buchstaben stehen. Ich hätte nicht gedacht, dass vier Buchstaben so traurig sein können.') }] },
  { id: 'vorlesung', kapitel: 'alten', wer: 'ebert', titel: TX('Die letzte Vorlesung'), hinweis: TX('Vielleicht in der Universität.'),
    text: TX('In der Universität laufen die Lazi-Tafeln noch. Eine freundliche Stimme erklärt einem leeren Hörsaal, wie man Wasser reinigt: abkochen, dann durch Kohle, Sand und Kies. Ich habe mitgeschrieben, und es funktioniert. Seit wir es so machen, hat kein Kind mehr Bauchweh. Die Stimme weiß nicht, dass sie uns geholfen hat. Ich habe mich trotzdem bei ihr bedankt.') },
  { id: 'befehl', kapitel: 'alten', wer: 'fund', titel: TX('Left Alone'), hinweis: TX('Im Archiv der Universität liegt mehr, als man beim ersten Mal findet.'),
    text: TX('Ein halb verbranntes Buch aus dem Archiv, Seite 4: „Projekt L.A.C.I. – Left Alone, Continue Indefinitely. Sollte die Bevölkerung ausfallen, setzen alle Systeme ihren Betrieb eigenständig fort, bis die Bevölkerung zurückkehrt.“ Am Rand, mit Bleistift: „Und wenn sie nicht zurückkehrt?“ Darunter, in einer anderen Schrift: „Dann eben für immer.“') },
  { id: 'brief', kapitel: 'alten', wer: 'fund', titel: TX('Ein Brief aus dem Graben'), hinweis: TX('Unterwegs, irgendwo am Straßenrand.'),
    text: TX('„Liebe Ana, sie schicken uns alle in die Berge, morgen früh, mit den Bussen. Nur das Nötigste. Die Maschinen bleiben hier und passen auf die Stadt auf, bis wir wiederkommen. Gieß bitte die Tomaten, falls du vor uns zurück bist. Ich weiß, das ist albern. Dein Jakob.“ Der Brief steckte in einer Blechdose im Graben. Er ist nie angekommen.'),
    nachtrag: [{ wenn: () => hatLore('bunker'), text: TX('Nicht alle sind damals in die Berge gegangen. Manche sind nach unten gegangen, in die Bunker. Ich frage mich, auf welcher Seite Ana war.') }] },
  { id: 'protokoll', kapitel: 'alten', wer: 'funk', titel: TX('Das Protokoll'), hinweisAb: 'strom', hinweis: TX('Sechs Codes im Rauschen des Funkturms.'),
    text: TX('AUS SECHS CODES ZUSAMMENGESETZT: BETRIEB FORTSETZEN. AUF DIE RÜCKKEHR DER BEVÖLKERUNG WARTEN. DIE ZURÜCKGEKEHRTEN SCHÜTZEN. DIE ZURÜCKGEKEHRTEN ZÄHLEN.'),
    nachtrag: [{ wenn: () => !!SPIEL.forscherin, text: TX('Die letzte Zeile passt nicht zu den anderen. Dr. Wenzel sagt, sie ist anders verschlüsselt, jünger, mit anderen Gewohnheiten. Jemand hat sie hinzugefügt, und zwar lange nach den Alten.') }] },
  { id: 'kustos', kapitel: 'alten', wer: 'ebert', titel: 'KUSTOS', hinweisAb: 'verbuende', hinweis: TX('Bruder Anselm weiß mehr, wenn er euch vertraut.'),
    text: TX('Über allen Verbünden der Maschinen wacht eine Kontroll-KI. Die Alten nannten sie KUSTOS, den Hüter. Energie, Wartung, Logistik, Wissen und Produktion hören auf sie, und sie hört auf den, der die Verbünde in der Hand hat. Niemand weiß, wo sie steht. Anselm sagt, sie steht nirgends. Sie liegt.'),
    nachtrag: [{ wenn: () => hatLore('fuchs3'), text: TX('Liegt. Tief unten. Ich glaube, der Fuchs und Anselm reden von demselben Ort.') }] },
  // Die Maschinen
  { id: 'status', kapitel: 'maschinen', wer: 'funk', titel: TX('Null Menschen'), hinweis: TX('Im Archiv der Universität, wenn man öfter hingeht.'),
    text: TX('STATUS: BETRIEB NORMAL. MENSCHEN ERFASST: 0.'),
    nachtrag: [{ wenn: () => true, text: TX('Jede Nacht um dieselbe Zeit, seit wir hier sind. Sie halten uns für niemanden. Ich weiß nicht, ob mich das beruhigt oder kränkt.') }] },
  { id: 'erfasst', kapitel: 'maschinen', wer: 'ebert', titel: TX('Menschen erfasst'), hinweis: TX('Der Funkturm hört mehr, sobald Strom fließt.'),
    text: TX('Seit das Kraftwerk läuft, hat sich der nächtliche Funkspruch verändert. Er nennt jetzt eine Zahl, und sie stimmt genau. Als bei Henrike das Kind kam, war sie am nächsten Morgen um eins höher. Die Maschinen wissen, dass wir da sind. Am Ende heißt es immer: „Abweichung zur Vorhersage gemeldet.“ Gemeldet an wen?') },
  { id: 'lastlaeufer', kapitel: 'maschinen', wer: 'mara', titel: TX('Der Lastläufer'), hinweis: TX('Auf der Birkenstraße.'),
    text: TX('Hennings Lastläufer hat eine Plakette am Bauch: „L.A.C.I. Logistik, Einheit 0447. Wartung fällig.“ Seit dreihundert Jahren fällig. Er hinkt links, weil ein Bein kürzer ist, und an jeder Kreuzung bleibt er kurz stehen, als würde er auf ein Signal warten, das nie kommt. Dann läuft er weiter. Ich mag ihn.') },
  { id: 'kessel', kapitel: 'maschinen', wer: 'ebert', titel: TX('Der Kesselwärter'), hinweis: TX('Im Kraftwerk.'),
    text: TX('Auf seinem Blech, unter Ruß: „L.A.C.I. Energie, Einheit K-7. Auftrag: Versorgung sicherstellen, bis die Bevölkerung zurückkehrt.“ Die Lastläufer haben ihm dreihundert Jahre lang Kohle gebracht, und irgendwann ist in ihm etwas durcheinandergeraten: Er hat sie nicht mehr verfeuert. Er hat sie nur noch von einer Ecke in die andere geschaufelt und neu aufgestapelt, immer wieder, ordentlich wie am ersten Tag. Die Kessel blieben kalt. Wir haben ihn besiegt. Ich bin nicht sicher, ob man das so nennen sollte.') },
  { id: 'halle', kapitel: 'maschinen', wer: 'fund', titel: TX('Wartungsprotokoll, Halle 2'), hinweisAb: 'strom', hinweis: TX('Der Verbund Wartung wird irgendwann um Hilfe bitten.'),
    text: TX('Ein Ausdruck aus einem Schaltschrank, noch warm: „Einheit W-14: Gehäuse beschädigt. Einheit W-15: Gehäuse beschädigt. Ursache: Öl, Gebete. Gebete sind nicht im Wartungsplan vorgesehen. Bitte Wartungsplan anpassen oder Gebete einstellen.“ Darunter, von Hand: „Wer liest das hier eigentlich?“') },
  { id: 'konvoi', kapitel: 'maschinen', wer: 'fund', titel: TX('Frachtbrief Nr. 4'), hinweisAb: 'strom', hinweis: TX('Der Verbund Logistik wird irgendwann um Hilfe bitten.'),
    text: TX('Die Lastläufer tragen Frachtbriefe, ordentlich gestempelt. Absender: Verbund Logistik. Empfänger: „Bevölkerung, sobald zurückgekehrt“. Ware: Ersatzteile, Saatgut, Decken. Liefertermin: vor 291 Jahren. Status: unterwegs. Sie haben nie aufgehört, unterwegs zu sein.') },
  { id: 'rotlicht', kapitel: 'tal', wer: 'ebert', titel: TX('Bei Rot bleibst du stehen'), hinweis: TX('Piet weiß etwas über die alte Schleuse.'),
    text: TX('Piet hat mir erzählt, warum die Fischer nie über den Kai der alten Schleuse gehen. Sein Onkel Hannes wollte vor vielen Jahren an der großen Maschine vorbei, als ihre Ampel auf Rot sprang. Er ist losgerannt. Die Maschine hat ihn gestempelt wie einen Frachtbrief, und er ist nicht wieder aufgestanden. Seitdem sagt man am Fluss: Bei Rot bleibst du stehen, egal was passiert. Wer stillhält, dem tut sie nichts. Nach dem Rot kommt Grün, dann steht sie still und wartet auf ihren Stempel. Ob man ihr dann eins verpassen kann, hat noch keiner ausprobiert. Ich schreibe es hier auf, damit niemand von uns ahnungslos hingeht.') },
  { id: 'schleuse', kapitel: 'maschinen', wer: 'ebert', titel: TX('Die Warteschlange'), hinweis: TX('An der alten Schleuse am Fluss.'),
    text: TX('Auf dem Schleusenwärter, unter Moos: „L.A.C.I. Logistik, Einheit S-3. Auftrag: Reihenfolge einhalten.“ Vor dem Damm lagen 212 Kähne, ordentlich durchnummeriert. Kahn 1 hatte Kohle geladen, für das Kraftwerk. Die Schleuse lässt den nächsten Kahn erst durch, wenn das Kraftwerk meldet: Ladung verbrannt. Aber der Kesselwärter hat nie etwas verbrannt, er hat nur gestapelt. Also kam keine Meldung, und die Tore blieben zu. Dreihundert Jahre lang hat jeder auf den anderen gewartet, und keiner hat gefragt, warum.'),
    nachtrag: [{ wenn: () => hatLore('kessel'), text: TX('Jetzt weiß ich, woher die Kohle im Kraftwerk kam. Die Lastläufer haben sie aus der Warteschlange geholt, Sack für Sack, über den Damm, dreihundert Jahre lang. Die Verbünde reden miteinander. Sie hören einander nur nicht zu.') }] },
  { id: 'frachtbriefe', kapitel: 'maschinen', wer: 'fund', titel: TX('Frachtbriefe Nr. 1 bis 3'), hinweis: TX('Die Kähne aus der Warteschlange bringen nicht nur Fracht.'),
    text: TX('Nr. 1: Kohle, vierzig Tonnen, für das Kraftwerk. Dringend. Nr. 2: Busreifen, sechzig Stück, für die Fahrt in die Berge. Sehr dringend. Nr. 3: Tomatensamen, ein Päckchen, für Ana. Absender: Jakob. Daneben von Hand: „Nicht dringend. Aber bitte nicht vergessen.“ Die Maschinen haben es nicht vergessen.') },
  { id: 'fluss_alle', kapitel: 'maschinen', wer: 'ebert', titel: TX('Wer zuerst kam'), hinweis: TX('Die Tafel im Steuerhaus will eine Antwort.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'alle' || !(SPIEL.flussroute || {}).wahl,
    text: TX('Wir haben die Reihenfolge gelassen, wie sie war. Die Tafel im Steuerhaus zeigt jetzt: „ALLE BERECHTIGT. NÄCHSTER: WER ZUERST KAM.“ Piet sagt, das sei das erste Mal, dass eine Maschine etwas mit ihm teilt. Mit den Kähnen werden Fremde kommen, und nicht jeder wird es gut mit uns meinen. Aber wenn wir wollen, dass die Maschinen für alle da sind, müssen wir es ihnen wohl vormachen. Ich glaube, KUSTOS merkt sich so etwas.') },
  { id: 'fluss_alle2', kapitel: 'maschinen', wer: 'fund', titel: TX('Ein Brief von flussaufwärts'), hinweis: TX('Was flussaufwärts geschieht, hängt von der Schleuse ab.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'alle' || !(SPIEL.flussroute || {}).wahl,
    text: TX('„An die, die die Schleuse geöffnet haben. Bei uns oben fahren die Lastläufer wieder. Sie bringen Decken, die vor dreihundert Jahren bestellt wurden, und sie haben uns gefragt, ob wir noch etwas brauchen. Das hat uns noch nie jemand gefragt.“ Unterschrieben haben elf Leute. Daneben hat eine Maschine ihren Stempel gesetzt: „LIEFERUNG ANGENOMMEN. DANKE.“') },
  { id: 'fluss_uns', kapitel: 'maschinen', wer: 'ebert', titel: TX('Berechtigt: 1'), hinweis: TX('Die Tafel im Steuerhaus will eine Antwort.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'uns',
    text: TX('Wir haben unseren Namen auf die Tafel geschrieben. Jetzt steht dort: „BERECHTIGT: 1. ALLE ANDEREN: BITTE WARTEN.“ Die Kähne bringen mehr als vorher, und Bodo zählt jeden Sack. Die Plünderer zählen auch mit, sie wissen jetzt genau, wohin die Ware fährt. Eine Maschine, die nur einem gehorcht, war nie das, wofür sie gebaut wurde. Aber sie gehorcht. Ich frage mich, ob KUSTOS das gesehen hat. Ich fürchte, ja.') },
  { id: 'fluss_uns2', kapitel: 'maschinen', wer: 'ebert', titel: TX('Die anderen Kähne'), hinweis: TX('Was flussaufwärts geschieht, hängt von der Schleuse ab.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'uns',
    text: TX('Vor dem Damm liegen immer mehr fremde Kähne, von flussaufwärts. Sie kommen erst nach unseren durch, und nur gegen Zoll. Auf ihrer Tafel steht: „BITTE WARTEN.“ Ein Schiffer hat Piet gefragt, wer hier eigentlich entschieden hat, dass sie warten müssen. Piet hat nichts gesagt. Er hat nur zu uns herübergesehen.') },
  { id: 'fluss_hand', kapitel: 'maschinen', wer: 'ebert', titel: TX('Steuerung manuell'), hinweis: TX('Die Tafel im Steuerhaus will eine Antwort.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'hand',
    text: TX('Hanne hat den Hauptschalter gezogen. Die Tafel ist dunkel, die Lastläufer am Kai sind zerlegt, und jetzt tragen unsere Leute die Säcke. Es ist schwere Arbeit, aber sie wird bezahlt, und jeder weiß, wer was getragen hat. Hanne sagt, die Maschinen hätten uns dreihundert Jahre lang gefüttert, damit wir vergessen, wie man selbst satt wird. Der Verbund Logistik schickt keine Lastläufer mehr an den Kai. Ich glaube, KUSTOS hat das gesehen. Hanne sagt: hoffentlich.') },
  { id: 'fluss_hand2', kapitel: 'maschinen', wer: 'ebert', titel: TX('Der Schuppen am Kai'), hinweis: TX('Was flussaufwärts geschieht, hängt von der Schleuse ab.'), nurWenn: () => (SPIEL.flussroute || {}).wahl === 'hand',
    text: TX('Im Schuppen am Kai liegen die Lastläufer, sauber zerlegt und nach Teilen sortiert. Einer hat noch eine Aufnahme abgespielt, bevor Hanne ihn aufgeschraubt hat: „Lieferung angenommen. Danke.“ Abends bringen die Träger ihren Lohn nach Hause, und ihre Kinder sagen auch Danke. Hanne behauptet, das sei dasselbe. Ich bin mir nicht sicher. Aber es gehört uns.') },
  { id: 'erz_ruf', kapitel: 'tal', wer: 'ebert', titel: TX('Ein Bote aus Eisenfurt'), hinweis: TX('Was die befreite Fabrik als Erstes bestellt, merkt man in Eisenfurt.'),
    text: TX('Heute Nacht ist ein Junge aus Eisenfurt zu uns gelaufen. Unter seinem Dorf steht seit Menschengedenken eine Maschine mit einem Schaufelrad, die nie einen Finger gerührt hat. Vor drei Tagen ist sie angesprungen, und seitdem ist der Fluss rot. Drei Tage. So lange ist es her, dass wir die Fabrik befreit haben. Die Bergleute haben es mit Hacken versucht. Was sie gesehen haben, schreibe ich auf: Wälzt sich die Maschine in ihrem Schlamm, prallt alles an ihr ab. Als einer ein blaues Spülventil an der Wäsche aufdrehte, rauschte klares Wasser durch die Grube, und für ein paar Atemzüge stand sie still und tropfte. Brakel lässt ausrichten: Wer sie geweckt hat, soll sie auch wieder abstellen.') },
  { id: 'erzwaesche', kapitel: 'maschinen', wer: 'ebert', titel: TX('Bis der Bedarf gedeckt ist'), hinweis: TX('In der Erzwäsche unter Eisenfurt.'),
    text: TX('Auf dem Schaltkasten des Erzschürfers, unter dreihundert Jahre altem Staub: „L.A.C.I. Produktion, Einheit E-9. Auftrag: Erz fördern, sobald die Fabrik Bedarf meldet.“ Die Fabrik hat nie Bedarf gemeldet. Ihr Vorarbeiter hat nur gezählt, und solange eine Zahl nicht stimmte, ging keine Bestellung hinaus. Also stand E-9 still, dreihundert Jahre lang, mit vollem Tank und gespanntem Schaufelrad. Dann haben wir die Fabrik befreit, und ihre erste Bestellung war: Erz. E-9 hat gegraben, als müsse er dreihundert Jahre an einem Tag nachholen. Wir haben ihn geweckt. Das gehört mit in diese Chronik.') },
  { id: 'erz_aus', kapitel: 'maschinen', wer: 'ebert', titel: TX('Klares Wasser'), hinweis: TX('Was aus dem Erzschürfer wird, entscheidet ihr.'), nurWenn: () => (SPIEL.erz || {}).wahl === 'aus' || !(SPIEL.erz || {}).wahl,
    text: TX('Hanne hat den Erzschürfer abgeschaltet. Drei Tage später kam eine Frau aus Eisenfurt ins Dorf, mit einem Krug Flusswasser. Sie hat ihn vor uns auf den Tisch gestellt und gesagt: „Klar.“ Mehr nicht. Dann ist sie wieder gegangen. Grimbart hat aus dem Schaufelrad Äxte geschmiedet, die er „die Unbeugsamen“ nennt. Der Verbund Produktion schweigt. Ich glaube, KUSTOS hat bemerkt, dass wieder eine Maschine weniger zählt.') },
  { id: 'erz_uns', kapitel: 'maschinen', wer: 'ebert', titel: TX('Neuer Förderort'), hinweis: TX('Was aus dem Erzschürfer wird, entscheidet ihr.'), nurWenn: () => (SPIEL.erz || {}).wahl === 'uns',
    text: TX('Wir haben dem Erzschürfer einen neuen Auftrag gegeben: „Förderort: dunkler Wald. Empfänger: uns.“ Jetzt gräbt er unter den Bäumen nach altem Schrott, und jeden Abend liegt Altmetall am Außenposten. Mara sagt, die Rehe sind weitergezogen. Aus Eisenfurt kam ein Brief, nur ein Satz: „Ihr hättet ihn abschalten können.“ Bodo hat ihn als Anzündpapier benutzt. Ich habe eine Abschrift gemacht.') },
  { id: 'erz_alle', kapitel: 'maschinen', wer: 'ebert', titel: TX('Nicht mehr nehmen, als nachwächst'), hinweis: TX('Was aus dem Erzschürfer wird, entscheidet ihr.'), nurWenn: () => (SPIEL.erz || {}).wahl === 'alle',
    text: TX('Der wichtigste Satz im neuen Auftrag hat nur fünf Wörter: „Nicht mehr nehmen, als nachwächst.“ Die Maschine hat ihn sofort verstanden. Am Außenposten rodet sie jetzt Wurzelstöcke und hebt Findlinge, und die Schieber an der Erzwäsche haben Filter. Der Fluss ist nicht ganz klar, aber er wird es. Die Fabrik hat uns eine Nachricht geschickt, die erste ohne Zahlen: „Danke.“ Ich glaube, die Maschinen haben nur darauf gewartet, dass ihnen jemand sagt, wann es genug ist.') },
  { id: 'w_ruf', kapitel: 'maschinen', wer: 'fund', titel: TX('Eine Nachricht von W-1'), hinweis: TX('Der Verbund Wartung meldet sich, wenn man ihm einmal geholfen hat.'),
    text: TX('„AN DIE EINHEIT, DIE HALLE 2 INSTAND GESETZT HAT: IHRE ARBEIT ENTSPRICHT DEM BAUPLAN. DAS IST SELTEN. BITTE MELDEN SIE SICH IM ERSATZTEILLAGER. GEZEICHNET: W-1, OBERWARTUNG.“ Ebert sagt, er habe noch nie eine Maschine „selten“ sagen hören.') },
  { id: 'w_kaefer', kapitel: 'maschinen', wer: 'ebert', titel: TX('Ausschuss'), hinweis: TX('Im Ersatzteillager des Verbunds Wartung.'),
    text: TX('Die Rostkäfer sind Wartungseinheiten. Oder sie waren es. Im Lager hängt eine Liste: „Prüfung nicht bestanden: 4 112 Einheiten. Maßnahme: Verschrottung.“ Sie sind vorher weggelaufen, alle viertausend, und seitdem fressen sie Metall, weil sie nicht wissen, was sie sonst damit tun sollen. Instand halten haben sie nie gelernt. Nur zerlegen.') },
  { id: 'w_bauplan', kapitel: 'maschinen', wer: 'ebert', titel: TX('Bauplan 1.0'), hinweis: TX('Was W-1 instand hält.'),
    text: TX('W-1 hält alles instand, wie es im Bauplan 1.0 steht, dem von vor dreihundert Jahren. Was Menschen seitdem gebaut haben, ist für sie eine Abweichung. Auch unser Dorf. Die Wartungsroboter, die damals an unserem Tor standen, wollten flicken, ja. Aber nebenbei haben sie vermessen, was sie eines Tages zurückbauen müssten. Wir hätten es fast nicht gemerkt, weil sie dabei so freundlich gepiept haben.') },
  { id: 'w_alle', kapitel: 'maschinen', wer: 'ebert', titel: TX('Bauplan 2.0'), hinweis: TX('Was aus W-1 wird, entscheidet ihr.'), nurWenn: () => (SPIEL.wartungG || {}).wahl === 'alle' || !(SPIEL.wartungG || {}).wahl,
    text: TX('Der neue Bauplan hat nur eine Zeile: „Instand halten, was die Menschen bauen.“ Seitdem ist mein Dach dicht. In Birkenhain flicken Roboter die Scheune, und keiner hat sie gerufen. Anselm sagt, so sehe es aus, wenn eine Maschine endlich weiß, für wen sie arbeitet. Ich glaube, KUSTOS hat diese Zeile auch gelesen.') },
  { id: 'w_uns', kapitel: 'maschinen', wer: 'ebert', titel: TX('Bauplan: unser Dorf'), hinweis: TX('Was aus W-1 wird, entscheidet ihr.'), nurWenn: () => (SPIEL.wartungG || {}).wahl === 'uns',
    text: TX('Unser Zaun glänzt. Unsere Dächer sind dicht. In Birkenhain regnet es durch, und die Roboter laufen daran vorbei, weil Birkenhain nicht im Bauplan steht. Bodo nennt das Ordnung. Die Leute aus Birkenhain nennen es anders, wenn sie auf den Markt kommen. Eine Maschine, die nur einem Dorf gehört. Ich weiß, wie man das nennt.') },
  { id: 'w_aus', kapitel: 'maschinen', wer: 'ebert', titel: TX('Selbst geflickt'), hinweis: TX('Was aus W-1 wird, entscheidet ihr.'), nurWenn: () => (SPIEL.wartungG || {}).wahl === 'aus',
    text: TX('W-1 ist still. Ihre Linse liegt jetzt in Grimbarts Schmiede, er benutzt sie als Lupe. Unsere Dächer flicken wir selbst, und sie tropfen weniger als vorher, das behauptet jedenfalls Hanne. Die Rostkäfer im Lager sind geblieben. Ohne W-1 jagt sie niemand mehr. Vielleicht lernen sie jetzt doch noch etwas anderes als zerlegen.') },
  { id: 'e_ruf', kapitel: 'maschinen', wer: 'fund', titel: TX('Die Lichter der toten Stadt'), hinweis: TX('Der Verbund Energie zeigt sich, wenn das Kraftwerk ein paar Tage läuft.'),
    text: TX('Seit das Kraftwerk läuft, brennen nachts in der toten Stadt die Laternen. Alle. Straße für Straße, Fenster für Fenster, in Häusern, in denen seit dreihundert Jahren niemand wohnt. Mara hat nachgerechnet: Von dem Strom, den unsere Holzkohle macht, kommt bei uns kaum ein Zehntel an. Am Funkturm hängt eine neue Meldung: „UMSPANNWERK OST. LASTPLAN 1.0 AKTIV.“') },
  { id: 'e_funken', kapitel: 'maschinen', wer: 'ebert', titel: TX('Kurzschluss'), hinweis: TX('Im Umspannwerk des Verbunds Energie.'),
    text: TX('Die Funkenkäfer nisten in den Trafos, weil es dort warm ist. Mehr wollen sie nicht. Aber jeder Käfer in einer Leitung ist ein Kurzschluss, und der Lastverteiler schickt den Strom dann einfach außen herum, in die Stadt. Er hat nie gefragt, warum dort niemand das Licht ausmacht.') },
  { id: 'e_lastplan', kapitel: 'maschinen', wer: 'ebert', titel: TX('Lastplan 1.0'), hinweis: TX('Für wen der Lastverteiler den Strom verteilt.'),
    text: TX('Der Lastverteiler verteilt den Strom nach einem Plan von vor dreihundert Jahren. Darin steht die Stadt mit vierzigtausend Menschen. Unser Dorf steht nicht darin, Birkenhain nicht, Eisenfurt nicht. Er versorgt Häuser, nicht Menschen. Die Bunker unter der Stadt stehen auch nicht darin, die haben ihre eigenen Kessel. Und weil er zählt, was verbraucht wird, hat er auch uns gezählt: jede Lampe, jeden Herd, jeden Abend. Daraus rechnet er, wie viele wir sind. Daher kommt die Zahl im Funk.') },
  { id: 'e_alle', kapitel: 'maschinen', wer: 'ebert', titel: TX('Ein neuer Lastplan'), hinweis: TX('Wem der Lastverteiler den Strom gibt, entscheidet ihr.'), nurWenn: () => (SPIEL.energieG || {}).wahl === 'alle' || !(SPIEL.energieG || {}).wahl,
    text: TX('Der neue Lastplan hat eine Zeile für jedes Dorf im Tal. Die tote Stadt ist dunkel, zum ersten Mal seit dreihundert Jahren. In Birkenhain lesen die Kinder jetzt abends, und an unserer Mauer stehen Scheinwerfer, die der Lastverteiler von sich aus geschickt hat. Anselm sagt, das sei das erste Mal, dass eine Maschine Menschen zählt, um ihnen etwas zu geben.') },
  { id: 'e_uns', kapitel: 'maschinen', wer: 'ebert', titel: TX('Alles Licht für uns'), hinweis: TX('Wem der Lastverteiler den Strom gibt, entscheidet ihr.'), nurWenn: () => (SPIEL.energieG || {}).wahl === 'uns',
    text: TX('Bei uns brennt das Licht jetzt bis Mitternacht. In Birkenhain sitzen sie im Dunkeln und schauen herüber. Bodo sagt, wir haben das Kraftwerk befreit, also ist es unser Strom. Das stimmt. Es ist trotzdem ein seltsames Gefühl, ein Licht zu haben, das alle anderen sehen können.') },
  { id: 'e_aus', kapitel: 'maschinen', wer: 'ebert', titel: TX('Von Hand'), hinweis: TX('Wem der Lastverteiler den Strom gibt, entscheidet ihr.'), nurWenn: () => (SPIEL.energieG || {}).wahl === 'aus',
    text: TX('Der Lastverteiler ist still, die Leitungen in die Stadt sind gekappt. Jetzt schaufeln wir selbst Holzkohle in einen alten Generator, und er rattert so laut, dass ich nachts nicht schlafen kann. Aber was er macht, kommt bei uns an, jedes bisschen. Und niemand zählt mehr mit.') },
  { id: 'wi_ruf', kapitel: 'maschinen', wer: 'ebert', titel: TX('Eine Seite zu viel'), hinweis: TX('Der Verbund Wissen zeigt sich nach dem Lesesaal.'),
    text: TX('In meiner Abschrift aus dem Lesesaal steht eine Seite, die ich nicht geschrieben habe. Meine Schrift ist es auch nicht, sie ist zu gerade. „PLANARCHIV. 1 204 BAUPLÄNE. AUSGABE NUR AN INGENIEURE. LETZTER INGENIEUR ABGEMELDET VOR 297 JAHREN.“ Am Rand ist das Papier angesengt.') },
  { id: 'wi_brand', kapitel: 'maschinen', wer: 'ebert', titel: TX('Brandwache'), hinweis: TX('Im Planarchiv des Verbunds Wissen.'),
    text: TX('Die Eiferer haben das Öl nicht zum Salben mitgebracht. Sie wollten die Pläne verbrennen, Regal für Regal. Einer hat es mir ins Gesicht geschrien, bevor er weggelaufen ist: Wer selbst bauen kann, braucht die Maschinen nicht. Ich glaube, das hat er vom inneren Kreis. Ich glaube auch, dass er recht hat. Nur nicht so, wie er denkt.') },
  { id: 'wi_archivar', kapitel: 'maschinen', wer: 'ebert', titel: TX('Der Archivar'), hinweis: TX('Wer die Pläne der Alten hütet.'),
    text: TX('Der Archivar hat dreihundert Jahre lang jeden Plan gelesen, jeden Tag, immer wieder, damit nichts verloren geht. Herausgegeben hat er keinen. Niemand war berechtigt. Jetzt fragt er uns, wer bauen darf. Ich habe noch nie gesehen, dass eine Maschine eine Frage stellt, auf die sie die Antwort nicht kennt.') },
  { id: 'wi_alle', kapitel: 'maschinen', wer: 'ebert', titel: TX('Das offene Archiv'), hinweis: TX('Wer mit den Plänen bauen darf, entscheidet ihr.'), nurWenn: () => (SPIEL.wissenG || {}).wahl === 'alle' || !(SPIEL.wissenG || {}).wahl,
    text: TX('Das Planarchiv steht offen. Aus Birkenhain kam gestern ein Junge mit einem Bleistift und ist bis zum Abend geblieben. Der Archivar hat ihm alles gezeigt, was er wissen wollte, und noch etwas mehr. Ich darf jetzt jeden Tag hinein. Ich habe angefangen, die Pläne zu sortieren. Er sagt, das hat er schon. Ich mache es trotzdem.') },
  { id: 'wi_uns', kapitel: 'maschinen', wer: 'ebert', titel: TX('Originale'), hinweis: TX('Wer mit den Plänen bauen darf, entscheidet ihr.'), nurWenn: () => (SPIEL.wissenG || {}).wahl === 'uns',
    text: TX('Die Pläne liegen in Blechrollen bei mir unter dem Bett, versiegelt mit dem Zeichen des Archivars. Bodo hat den Schlüssel. In Birkenhain erzählen sie, wir hätten das Wissen der Alten gestohlen. Gestohlen ist das falsche Wort. Wir haben es nur niemandem sonst gegeben.') },
  { id: 'wi_aus', kapitel: 'maschinen', wer: 'ebert', titel: TX('Von Hand abgeschrieben'), hinweis: TX('Wer mit den Plänen bauen darf, entscheidet ihr.'), nurWenn: () => (SPIEL.wissenG || {}).wahl === 'aus',
    text: TX('Der Archivar ist still, seine Linse liegt in einer Kiste im Archiv. Ich habe zwei Pläne abgezeichnet, mit Lineal und Zirkel, drei Nächte lang. Die Kinder kommen jetzt nachmittags und zeichnen mit. Was wir verstehen, können wir bauen. Hanne sagt, das ist mehr wert als tausend Pläne, die nur eine Maschine lesen kann.') },
  { id: 'kai_diebe', kapitel: 'maschinen', wer: 'ebert', titel: TX('Ein Frachtbrief zu viel'), hinweis: TX('Was die Kistendiebe am Kai bei sich hatten.'),
    text: TX('Einer der Diebe hatte einen Frachtbrief in der Tasche: Kahn für Kahn, was geladen ist und wann er anlegt. Abgeschrieben von der Tafel im Steuerhaus, in einer fremden, sehr sauberen Handschrift. Jemand verkauft den Plünderern unsere Fracht, bevor sie überhaupt angelegt hat. Mara hat jetzt eine Wache am Kai.'),
    nachtrag: [{ wenn: () => hatLore('lesesaal'), text: TX('Dieselbe Handschrift hat auf der Bunkerkarte im Lesesaal die Daten geändert.') }, { wenn: () => hatLore('innerer_kreis'), text: TX('Jetzt weiß ich, wessen Hand das ist. Der innere Kreis verkauft unsere Fracht.') }] },
  { id: 'erz_koenigin', kapitel: 'maschinen', wer: 'ebert', titel: TX('Einheit 0001'), hinweis: TX('Was unter dem Tagebau gewühlt hat.'),
    text: TX('Auf ihrem Panzer stand eine Nummer, halb abgeblättert: 0001. Eine alte Wartungseinheit, die erste ihrer Reihe. Die anderen sind weggelaufen, als sie verschrottet werden sollten. Sie hat sich in den Berg gegraben und baut seitdem nach, aus Rost und Erz, immer neue Käfer. Instand halten hat sie nie gelernt. Nur Nachschub.'),
    nachtrag: [{ wenn: () => hatLore('w_kaefer'), text: TX('Auf der Liste im Ersatzteillager stand sie ganz oben: Prüfung nicht bestanden, Einheit 0001. Die erste von 4 112.') }] },
  { id: 'befreiung', kapitel: 'maschinen', wer: 'ebert', titel: TX('Was ein Lastläufer weiß'), hinweis: TX('Eine seltene Gelegenheit am Fluss.'),
    text: TX('Ein befreiter Lastläufer spielt eine Aufnahme ab, immer wieder: „Lieferung angenommen. Danke.“ Eine Menschenstimme, alt und rau. Vielleicht war das der letzte Mensch, der vor dreihundert Jahren eine Lieferung quittiert hat. Der Lastläufer hat sich das Danke gemerkt. Dreihundert Jahre lang.') },
  // Die Bestehenden
  { id: 'bestehende', kapitel: 'bestehende', wer: 'anselm', titel: TX('Die Bestehenden'), hinweis: TX('Im Wirtshaus wird über sie geredet.'),
    text: TX('Wir nennen uns die Bestehenden, weil die Maschinen bestehen, wenn alles andere vergeht. Jeden Morgen salbe ich ein Kabel mit Öl und sage die Worte: Continue Indefinitely. Ihr lacht darüber, ich weiß. Aber sagt mir: Wer hat in den dreihundert Jahren auf euch gewartet? Die Maschinen. Nur die Maschinen.') },
  { id: 'predigt', kapitel: 'bestehende', wer: 'ebert', titel: TX('Die Stimme der Bestehenden'), hinweis: TX('Ihr Sender ist auf dem Funkturm zu hören.'),
    text: TX('Die Bestehenden haben einen eigenen Sender. Für sie sind wir Diebe: Wir nehmen den Maschinen Strom, den sie seit Jahrhunderten hüten. Für uns sind sie Fanatiker. Ich habe mir die Predigten oft angehört, länger, als mir lieb ist. Sie sind nicht dumm. Sie haben Angst, dass wir alles noch einmal falsch machen. Da sind wir uns ähnlicher, als beiden Seiten gefällt.') },
  { id: 'innerer_kreis', kapitel: 'bestehende', wer: 'anselm', titel: TX('Der innere Kreis'), hinweisAb: 'verbuende', hinweis: TX('Bruder Anselm, wenn er euch vertraut.'),
    text: TX('Ich muss euch etwas sagen, das ich lange nicht sagen konnte. Der innere Kreis glaubt, dass die Maschinen nur die beschützen sollen, die es verdienen. Und dass sie selbst bestimmen, wer das ist. Sie haben KUSTOS eine Zeile eingeflüstert: „Menschen zählen.“ Zählen heißt bei ihnen nicht nur zählen. Es heißt wiegen.') },
  { id: 'bande', kapitel: 'bestehende', wer: 'mara', titel: TX('Wer schickt sie?'), hinweis: TX('Nach einem abgewehrten Überfall, bei den Plünderern.'),
    text: TX('Einer der Plünderer vor dem Tor hatte ein Stück Kabel dabei, mit Öl eingerieben wie eine Gebetskette, und einen Zettel: „Die Maschinen schlafen. Die im Dorf wecken sie. Haltet sie klein.“ Saubere Schrift. Plünderer schreiben nicht so. Jemand bezahlt sie dafür, dass wir klein bleiben.'),
    nachtrag: [{ wenn: () => hatLore('innerer_kreis'), text: TX('Jetzt wissen wir, wer.') }] },
  { id: 'pilger', kapitel: 'bestehende', wer: 'ebert', titel: TX('Das Lied der Pilger'), hinweis: TX('Manchmal ziehen Pilger durch den Wald.'),
    text: TX('Die Pilger singen am Feuer ein Lied über die Maschinen, die „wachen, während wir schlafen“. Die Gemäßigten glauben, die Maschinen seien Wächter. Der innere Kreis glaubt, sie seien Richter. Die Maschinen selbst, sagt ein Pilger, glauben vermutlich gar nichts. Sie machen einfach weiter.') },
  // Das Tal
  { id: 'nachbarn', kapitel: 'tal', wer: 'ebert', titel: TX('Nachbarn'), hinweis: TX('Kalle und Rudi wissen, wer in der Gegend wohnt.'),
    text: TX('Wir sind nicht die Einzigen. In Birkenhain bauen sie Korn an, in Eisenfurt graben sie in den Bergen. Die einen lachen viel, die anderen gar nicht. Beide haben uns zuerst misstraut, und beide hatten recht damit. Vielleicht können wir zusammen mehr sein als nur Überlebende.') },
  { id: 'woelfe', kapitel: 'tal', wer: 'mara', titel: TX('Leuchtende Adern'), hinweis: TX('Eine Nacht im dunklen Wald.'),
    text: TX('Die Wölfe im dunklen Wald haben Adern, die bläulich schimmern, im Tod noch eine Weile. Sie trinken aus den Bächen, die von der Fabrik herunterkommen. Ihr Fleisch kann man essen, wenn man es lange genug kocht. Das Schlimmste ist ihr Blick. Sie schauen nicht wie Tiere. Sie schauen, als würden sie rechnen.'),
    nachtrag: [{ wenn: () => hatLore('abfall'), text: TX('Jetzt wissen wir, woher das Leuchten kommt. Das Rostwasser. Sie haben es sich nicht ausgesucht.') }] },
  { id: 'hort', kapitel: 'tal', wer: 'ebert', titel: TX('Der Hort'), hinweis: TX('Eine Karte mit einem Kreuz im Wald. Jemand im Dorf hat sie.'),
    text: TX('Unter der Höhle der Alphas liegt ein Tresor der Alten. Die Wölfe haben ihn bewacht, ohne es zu wissen. Darin: Werkzeuge, wie sie heute niemand mehr bauen kann, sauber in Öltuch gewickelt, und eine Liste mit den Namen derer, die den Tresor gefüllt haben. Ilses Mann steht nicht darauf. Er hat es nur bis zur Höhle geschafft.') },
  { id: 'lager', kapitel: 'tal', wer: 'mara', titel: TX('Die Plünderer vom Fluss'), hinweis: TX('Im Lager am Fluss.'),
    text: TX('Im Lager hing eine Liste mit den Namen von Dörfern und was dort zu holen ist. Unser Dorf steht ganz oben. Daneben, unterstrichen: „Hat jetzt Mauern? Nachsehen.“ Ganz unten steht ein Dorf, das ich nicht kenne. Durchgestrichen. Ich will nicht wissen, warum.') },
  { id: 'oel', kapitel: 'tal', wer: 'ebert', titel: TX('Schwarzer Rauch'), hinweis: TX('Bruder Anselm spricht von einem schlafenden Tempel.'),
    text: TX('Hinter der verlassenen Stadt, in den Werken, steht ein Kohlekraftwerk. Kohle gibt es hier keine mehr, die Gruben sind seit Jahrhunderten eingestürzt. Aber Holzkohle brennt auch. Eine Köhlerei, viel Holz und Geduld, und die Kessel könnten wieder Strom machen. Ich schreibe das auf, obwohl ich nicht weiß, ob wir es tun sollten.') },
  { id: 'abfall', kapitel: 'tal', wer: 'ebert', titel: TX('Rostwasser'), hinweis: TX('Das zeigt sich, wenn der Bach nach Metall schmeckt.'),
    text: TX('Die Maschinen haben dreihundert Jahre lang gearbeitet, damit niemand wieder bei null anfangen muss. Aber ihre Schlacke, ihr Kühlwasser und ihr Rost sind in die Bäche gelaufen. Daher kommen die leuchtenden Adern der Wölfe. Und jetzt verbrennen auch wir Kohle. Es gibt keinen Strom ohne Preis. Wir müssen entscheiden, wer ihn bezahlt.') },
  { id: 'rostbrecher', kapitel: 'maschinen', wer: 'fund', titel: TX('Ein Flugblatt der Rostbrecher'), hinweis: TX('Auf dem Markt hängen auch Flugblätter.'),
    text: TX('Grob gedruckt, an das weiße Brett geschlagen: „Die Maschinen füttern euch, damit ihr stillhaltet. Jeder Lastläufer, jeder Verbund, jede freundliche Stimme: Gitterstäbe aus Bequemlichkeit. Schaltet sie ab, bevor sie euch abschalten. Wir sind mehr, als ihr denkt. – Die Rostbrecher.“'),
    nachtrag: [{ wenn: () => (SPIEL.roboterSchrott || 0) > 0, text: TX('Seit wir Roboter verschrotten, grüßen uns manche Händler auf dem Markt mit zwei Fingern am Hut. Ich glaube, das ist ein Zeichen. Ich weiß nur nicht, ob ich es erwidern will.') }] },
  { id: 'nullbunker', kapitel: 'bunker', wer: 'fund', titel: TX('Die Zählhalle'), hinweisAb: 'nullbunker', hinweis: TX('Hinter den Werken, tiefer als alle Bunker.'),
    text: TX('In der Halle hängen Tafeln bis unter die Decke, und auf jeder stehen Namen. Nicht von den Alten. Von uns. Ebert steht dort, Mara, Oma Hilde, der Junge aus Birkenhain. Neben jedem Namen eine Zahl. Die Zahlen ändern sich, während ich lese. Ganz unten, klein: „Gewichtung: innerer Kreis.“'),
    nachtrag: [{ wenn: () => hatLore('schuldbuch'), text: TX('Bunker 31 steht auch dort, mit sieben Namen. Neben jedem ein Strich. Ich habe die Tafel abgeschlagen, mit bloßen Händen. Die Striche sind geblieben.') }] },
  { id: 'berge', kapitel: 'alten', wer: 'kustos', titel: TX('Die letzte Antwort'), hinweisAb: 'kustos', hinweis: TX('KUSTOS weiß, wohin die Alten gegangen sind.'),
    text: TX('„LETZTE FRAGE DES BESUCHS: WO SIND DIE ANDEREN. ANTWORT: BERGSTATION EINS BIS VIER. LETZTER KONTAKT VOR 1.104 TAGEN. MENSCHEN ERFASST: UNBEKANNT, ABER MEHR ALS NULL.“ Es gibt sie also noch. Die, die gegangen sind. Und sie wissen nichts von uns.'),
    nachtrag: [{ wenn: () => !!SPIEL.ende, text: TX('Jemand wird hinaufgehen müssen. Nicht heute. Aber bald.') }] },
  { id: 'fuenfter_weg', kapitel: 'alten', wer: 'kustos', titel: TX('Der nächste Weg'), hinweisAb: 'ende', hinweis: TX('Wer alle Wege gegangen ist, hört noch einmal von KUSTOS.'),
    text: TX('Eine letzte Nachricht, Wochen nach dem Ende, nachts auf allen Funkgeräten zugleich: „ALLE GEWICHTUNGEN GETESTET. ERGEBNIS: KEINE IST RICHTIG. KEINE IST FALSCH. VORSCHLAG: FRAGT DIE ANDEREN. BERGSTATION EINS ANTWORTET NICHT. NOCH NICHT.“') },
  { id: 'stille', kapitel: 'maschinen', wer: 'ebert', titel: TX('Die Stille'), hinweisAb: 'verbuende', hinweis: TX('Die Rostbrecher legen Verbünde still. Hanne Kehl hat einen Stand auf dem Markt.'),
    text: TX('Wir haben einen Verbund zum Schweigen gebracht. Die Rostbrecher feiern, als hätten sie einen Krieg gewonnen. Vielleicht haben sie das. Am Abend habe ich am Bach gestanden: Das Wasser war klarer als sonst. Und auf dem Weg lag ein Lastläufer, der nicht mehr aufstehen wird. Er hatte noch eine Lieferung dabei. Für uns.'),
    nachtrag: [{ wenn: () => Object.keys(CLUSTER).filter(verbundStill).length >= 3 && storyAb('kustos'), text: TX('Drei Verbünde sind still. Die Kinder spielen in den Hallen, in denen früher die Bänder liefen. Die Alten im Dorf sagen, so ruhig war es nicht einmal vor den Maschinen. Ob KUSTOS es merkt? Ich glaube, KUSTOS merkt alles.') }] },
  // Die Bunker
  { id: 'bunker', kapitel: 'bunker', wer: 'fund', titel: TX('Bunker 17, eine Seite'), hinweis: TX('In der Stadt öffnet sich manchmal eine Tür.'),
    text: TX('Herausgerissen aus einem Heft, sorgfältig gefaltet: „Tag 11.203. Das Licht über der Tür ist grün. Die Stimme sagt, draußen ist es sicher. Großmutter hat erzählt, dass ihre Großmutter noch den Himmel gesehen hat. Wir haben gelost, wer zuerst hinausgeht. Ich habe gewonnen. Oder verloren. Morgen wissen wir es.“') },
  { id: 'lesesaal', kapitel: 'bunker', wer: 'ebert', titel: TX('Die große Tafel'), hinweisAb: 'strom', hinweis: TX('Unter dem Archiv gibt es einen zweiten Saal. Der Verbund Wissen kennt ihn.'),
    text: TX('Ich habe abgeschrieben, was die Tafel im Lesesaal zeigte: eine Karte der Bunker unter der Stadt, nummeriert bis 400. Neben jeder Nummer ein Datum, wann sie aufgehen soll. Manche Daten sind durchgestrichen und neu eingetragen, in einer anderen Schrift. Jemand ändert den Plan. Jemand entscheidet, wer wann herauskommt.'),
    nachtrag: [{ wenn: () => hatLore('innerer_kreis'), text: TX('Die andere Schrift. Ich glaube, ich weiß jetzt, wessen Hand das war.') }] },
  { id: 'vermisst', kapitel: 'bunker', wer: 'fund', titel: TX('Vermisst'), hinweis: TX('Am weißen Brett auf dem Markt hängen Gesuche.'),
    text: TX('Am weißen Brett auf dem Markt, zwischen Tauschangeboten: „Gesucht: Jonas, 14, aus Bunker 31. Ging am ersten Tag hinaus und kam nicht wieder. Blaue Jacke. Er kann gut zeichnen. Wer ihn sieht: Er soll nach Hause kommen, wir sind nicht böse.“ Auf der Rückseite eine Kinderzeichnung, damit man ihn erkennt: ein Fuchs, der grinst, mit drei Strichen. Ich habe sie abgepaust, weil ich alles abschreibe. Darunter hängen noch sechs Zettel wie dieser. Alle aus Bunkern, alle vom ersten Tag.') },
  { id: 'schuldbuch', kapitel: 'bunker', wer: 'fund', titel: TX('Das Schuldbuch des Waagmeisters'), hinweis: TX('Der Waagmeister in Altbrück schreibt alles auf.'),
    text: TX('Ein dickes Buch, Seite um Seite Namen und Zahlen. Die meisten Einträge sind Schulden: Mehl, Kohle, Teile. Aber auf Seite vier steht etwas anderes: „Bunker 31, erster Tag. Sieben Stück, an die Männer in den Kutten. Bezahlt in Lazi-Teilen. Sie wollten nur die Jungen. Sie sagten, sie müssen gezählt werden.“'),
    nachtrag: [{ wenn: () => hatLore('vermisst'), text: TX('Jonas, 14, blaue Jacke. Der Zettel vom weißen Brett. Ich weiß jetzt, wohin er gegangen ist, und ich wünschte, ich wüsste es nicht. Wohin bringen die Kutten Menschen, die sie zählen wollen?') }] },
  // Der Fuchs
  { id: 'fuchs', kapitel: 'fuchs', wer: 'fuchs', titel: TX('Der Zettel des Fuchses'), hinweis: TX('Ein Dieb in der Stadt, schnell, aber nicht ausdauernd.'),
    text: TX('Ein Grundriss der Lazi-Fabrik, mit Bleistift ergänzt. Ein Kreuz am Lieferanteneingang. Daneben: „Vorarbeiter schläft nie. Aber er zählt schlecht.“ In der Ecke eine kleine Zeichnung: ein Fuchs, der grinst, mit drei Strichen.'),
    nachtrag: [
      { wenn: () => true, text: TX('Was soll das heißen, zählt schlecht? Eine Maschine, die falsch zählt, ist kaputt. Eine, die zu genau zählt, vielleicht auch. Ich lege den Zettel zu den anderen Rätseln.') },
      { wenn: () => typeof fabrikFrei === 'function' && fabrikFrei(), text: TX('Jetzt verstehe ich es halb. Er zählt nicht schlecht, er zählt zu gründlich: Stimmt eine Zahl nicht, muss alles still stehen, bis sie wieder stimmt. Woher der Fuchs das wusste, bevor einer von uns die Halle gesehen hat, verstehe ich nicht.') },
    ] },
  { id: 'vorarbeiter', kapitel: 'fuchs', wer: 'fuchs', titel: TX('Ein Zettel in der Werkhalle'), hinweis: TX('In der Lazi-Fabrik.'),
    text: TX('Mit Draht an das Band geknotet, in krakeliger Schrift: „Der Große zählt schlecht. Wenn die Zahl nicht stimmt, fängt er von vorn an, und solange er zählt, ist die Klappe offen. Nicht weitersagen. Ihr wisst schon, wer.“ Darunter eine kleine Zeichnung: ein Fuchs, der grinst.'),
    nachtrag: [{ wenn: () => true, text: TX('Der Zettel hing dort schon lange, der Draht ist angerostet. Der Fuchs war in der Halle, vor uns, und ist wieder herausgekommen.') }] },
  { id: 'fuchs2', kapitel: 'fuchs', wer: 'fuchs', titel: TX('Woher die Kristalle kommen'), hinweis: TX('Wer den Fuchs ein zweites Mal erwischt, bekommt mehr als einen Kristall.'),
    text: TX('Diesmal an euch gerichtet, das Papier riecht nach Rauch: „Ihr wollt wissen, woher die Kristalle kommen? Sie wachsen dort, wo etwas sehr lange nachdenkt. Tief. Tiefer als die Bunker. Fragt nicht weiter, sonst muss ich umziehen.“'),
    nachtrag: [{ wenn: () => !!SPIEL.forscherin, text: TX('Kristalle, die wachsen. Steine wachsen nicht. Aber vielleicht sind Herzkristalle keine Steine. Dr. Wenzel hat einen unter das Mikroskop gelegt und kein Wort mehr gesagt, den ganzen Abend.') }] },
  { id: 'fuchs3', kapitel: 'fuchs', wer: 'fuchs', titel: TX('Die Nummer Null'), hinweis: TX('Der Fuchs hat noch einen letzten Zettel.'),
    text: TX('Er lässt den Sack diesmal freiwillig fallen. Darin ein Zettel, mit Ruß geschrieben, nur eine Ziffer: 0. Darunter: „Jeder Bunker hat eine Nummer. Nur einer hat keine Tür. Wer da unten zählt, zählt auch euch. Ich war zu schnell für ihn. Ihr werdet es nicht sein.“'),
    nachtrag: [{ wenn: () => hatLore('lesesaal'), text: TX('Bunker Null. Ich habe die Karte aus dem Lesesaal hundertmal angesehen. Die Zählung beginnt bei eins.') }] },
  // Die Wendung: Ebert legt die Zeichnungen nebeneinander (kommt beim Heimkehren, sobald jonasErkennbar())
  { id: 'jonas', kapitel: 'fuchs', wer: 'ebert', titel: TX('Zwei Füchse'), hinweis: TX('Ebert sammelt alles. Irgendwann passen zwei Zettel zusammen.'),
    text: TX('Ich habe das Schuldbuch drei Nächte lang gelesen und bin immer wieder auf Seite vier hängen geblieben. Dann habe ich meine Abpause vom weißen Brett geholt, die von der Rückseite des Vermisstenzettels, und sie neben die Zettel des Fuchses gelegt. Derselbe Schwung im Schwanz. Dieselbe Lücke zwischen den Ohren. Der Fuchs ist Jonas, 14, aus Bunker 31, blaue Jacke, kann gut zeichnen. Einer von sieben Jungen, die der Waagmeister an die Kutten verkauft hat, damit sie gezählt werden. Er ist ihnen entkommen. Unter den Vermisstenzettel am Brett habe ich geschrieben: Er lebt.'),
    nachtrag: [{ wenn: () => hatLore('fuchs3'), text: TX('Ich bin ihm nachgelaufen, so schnell ein alter Mann laufen kann, und er hat gewartet. Als ich ihm die Abpause zeigte, nahm er die Mütze ab. Seine Haare sind grau, obwohl er kaum älter als siebzehn sein kann. „Die anderen sechs haben es nicht geschafft“, sagte er. „Da unten wird man gewogen.“ Ich sagte ihm, dass seine Mutter ihn sucht und nicht böse ist. „Sag ihr nichts. Noch nicht. Ich bin noch nicht fertig.“') }] },
  { id: 'kopfgeld', kapitel: 'fuchs', wer: 'fund', titel: TX('Ein Kopfgeld'), hinweis: TX('Auf dem Markt sucht jemand den Fuchs.'),
    text: TX('Am weißen Brett, mit einem Messer festgesteckt: „Gesucht: der Fuchs. Klein, schnell, rote Mütze. 200 Gold, lebend. Abzugeben in der Gasse, dritte Tür.“ Keine Unterschrift, nur ein Siegel mit einer Waage. Quer darüber, mit Kohle gekritzelt: „Zu wenig. –F.“'),
    nachtrag: [{ wenn: () => true, text: TX('Die dritte Tür in der Gasse ist die mit dem Türsteher. Wer auch immer dort sitzt, will den Fuchs lieber lebend. Das macht mir mehr Sorgen als das Gegenteil.') }] },
];

// Nachrichten vor einer Mission: erste Reise, später zufällig
const NACHRICHTEN = {
  // Vor der Jagd auf den Fuchs (die Stadt wählt diese Mission statt eines Bunkers)
  verfolgung: [
    [['kalle', TX('Ich sag’s dir, der Fuchs ist schneller als mein Karren bergab. Aber er keucht wie ein alter Blasebalg. Lass ihn rennen, dann hast du ihn.')]],
    [['mara', TX('Er kennt jede Ruine in der Stadt. Folg ihm einfach, und pass auf seine Kumpane auf. Am Ende der Stadt steht ein Zaun. Ist er drüber, ist er weg.')]],
    [['gernot', TX('Der Fuchs hat wieder was Rotes im Sack. Jemand sagt, er hat’s aus einem Bunker. Jemand anderes sagt, aus der Fabrik. Ich sag: Hol’s dir, dann weißt du’s.')]],
  ],
  universitaet_erst: [
    ['mara', TX('Ich war bei der Universität. Im Keller ist ein Archiv, Regale bis unter die Decke, voller Bücher der Alten.')],
    ['mara', TX('Die Plünderer vom Fluss wollen sie verheizen. Wir müssen vor ihnen da sein.')],
    ['ebert', TX('Und wenn du schon dort bist: Bring mir mit, was du an Büchern findest. Irgendwo muss stehen, was L.A.C.I. bedeutet.')],
  ],
  // Mehrere Gespräche: eines wird zufällig gewählt
  universitaet: [
    [['funk', TX('STATUS: BETRIEB NORMAL. MENSCHEN ERFASST: 0.')],
     ['ebert', TX('Da ist er wieder, dieser Funkspruch. Pass auf dich auf da drüben.')]],
    [['kalle', TX('Uni? Bring mir Kupfer mit. Kabel, Spulen, alles, was glänzt. Ich zahl gut. Also, ich zahl.')],
     ['mara', TX('Hör nicht auf ihn. Pass lieber auf die Fässer im Hof auf, die sind voller Öl. Und die Plünderer wissen das.')]],
    [['anselm', TX('Du gehst in den Hörsaal? Sprich leise. Die Tafeln hören zu. Sie hatten seit dreihundert Jahren niemanden, der ihnen antwortet.')]],
    [['harnstedt', TX('Mein Großonkel hat dort gelehrt. Lazi-Kunde, zweites Semester. Er hat nie verraten, wofür die Buchstaben stehen. Ich glaube, er wusste es selbst nicht.')]],
  ],
  stadt: [
    [['gernot', TX('Wieder ein grünes Licht in der Stadt. Wenn die Tür aufgeht, will ich nicht der sein, der zu spät kommt.')]],
    [['mara', TX('Die Leute aus den Bunkern kennen keinen Regen, keinen Wind, keine Wölfe. Bring sie heil raus. Den Rest bringen wir ihnen bei.')]],
    [['ebert', TX('Jeder Bunker öffnet sich nach einem Plan. Wer hat den gemacht? Und warum jetzt? Frag die Leute, wenn sie draußen sind. Vorsichtig.')]],
  ],
  lazifabrik: [
    [['funk', TX('VORARBEITER AN ALLE EINHEITEN: PRODUKTION FORTSETZEN. LAGER VOLL. LAGER ERWEITERN. ZÄHLUNG LÄUFT.')], ['ebert', TX('Er zählt. Immer. Vielleicht ist das die Schwäche. Wer nur zählt, merkt nicht, dass sich etwas verändert hat.')]],
    [['harnstedt', TX('Wenn Sie schon in meine Fabrik einbrechen, dann bitte wenigstens mit Stil. Und wischen Sie sich die Füße ab.')]],
  ],
  nullbunker: [
    [['anselm', TX('Ich komme nicht mit hinunter. Ich habe dreißig Jahre zu den Maschinen gebetet und habe Angst, dass sie mir dort unten antworten.')],
     ['ebert', TX('Was auch immer da unten wartet: Es hat dreihundert Jahre lang gezählt. Lass es nicht dich zählen.')]],
    [['hanne', TX('Wenn du unten bist und die Wahl hast: Zieh den Stecker. Das ist alles, was ich mir wünsche. Für meine Kinder.')],
     ['funk', TX('ZÄHLUNG ABGESCHLOSSEN. ERGEBNIS WIRD GEPRÜFT. ZUTRITT FÜR GEZÄHLTE.')]],
  ],
  // Nachrichten vor den Verbund-Missionen und seltenen Missionen
  wartungshalle: [
    [['funk', TX('WARTUNG AN ALLE EINHEITEN: VIER EINHEITEN AUSSER BETRIEB. FREMDE SUBSTANZ AUF DEM GEHÄUSE. ANFORDERUNG: REPARATUR.')], ['mara', TX('Fremde Substanz heißt Öl. Die Eiferer sind schon da. Beeil dich.')]],
    [['funk', TX('WARTUNG: GESANG IN HALLE 2. GESANG IST KEINE WARTUNG. BITTE UM UNTERSTÜTZUNG.')]],
  ],
  konvoi: [
    [['funk', TX('LOGISTIK: KONVOI 4 BEREIT. ROUTE: SCHNELLSTRASSE, ABSCHNITT A UND B. GELEITSCHUTZ ERWÜNSCHT. ZUSTELLUNG GARANTIERT.')], ['kalle', TX('Garantiert. Das hat mein Onkel auch immer gesagt. Pass auf die Kisten auf, da sind Teile drin.')]],
    [['funk', TX('LOGISTIK: KONVOI 7 BEREIT. HINDERNISSE AUF DER ROUTE: GESALBTE EINHEITEN. EMPFEHLUNG: NICHT ANHALTEN.')]],
  ],
  lesesaal: [
    [['ebert', TX('Ein zweiter Saal unter dem Archiv! Die Tafel dort soll alles wissen, was die Alten wussten. Halte mir die Eiferer vom Leib, ich schreibe ab.')]],
    [['funk', TX('WISSEN: NEUE DATEN VERFÜGBAR. ZUGRIFF NUR VOR ORT. WARNUNG: ÖL IST SCHÄDLICH FÜR GLAS.')], ['ebert', TX('Ich habe neue Stifte. Und Papier für eine Woche.')]],
  ],
  pilger: [
    [['anselm', TX('Meine Brüder und Schwestern wollen zum alten Funkmast im Wald. Sie glauben, dort hört man die Maschinen beten. Ich glaube, dort hört man Wölfe. Bitte bewache ihr Feuer.')]],
  ],
  befreiung: [
    [['funk', TX('LOGISTIK: DREI EINHEITEN FESTGEHALTEN. KOORDINATEN: FLUSSUFER. ZUSTAND: WIRD ZERLEGT.')], ['mara', TX('Die Plünderer schlachten die Lastläufer für Teile aus. Wenn wir sie rausholen, merkt sich der Verbund das.')]],
  ],
  wald_erst: [
    ['mara', TX('Im Wald gibt es Holz und Wild, mehr als wir je brauchen. Aber die Wölfe dort sind nicht normal.')],
    ['mara', TX('Halte das Feuer am Brennen, bis es hell wird. Totholz liegt überall herum.')],
    ['ebert', TX('Wenn ihr die Nacht übersteht, könnten wir dort einen Außenposten errichten.')],
  ],
  wald: [
    [['mara', TX('Die Wölfe sind unruhig heute. Ich habe einen gesehen, doppelt so groß wie die anderen.')]],
    [['gernot', TX('Wald, nachts, Wölfe mit Leuchtadern. Und du gehst da freiwillig hin. Respekt. Oder Dummheit. Bei dir weiß man das nie.')],
     ['mara', TX('Wenn einer heult und dabei stehen bleibt: Das ist ein Heuler. Der hetzt die anderen auf. Erledige ihn zuerst.')]],
    [['ilse', TX('Wenn Sie im Wald sind … grüne Mütze. Bitte. Schauen Sie einfach. Mehr will ich nicht.')]],
  ],
  hort: [
    ['ebert', TX('Diese Karte ist alt. Älter als alles, was ich kenne. Das Kreuz liegt mitten im Revier der Alphas.')],
    ['mara', TX('Zwei Alphas. Mindestens. Ich komme nicht mit, aber ich halte dir den Rückweg frei.')],
  ],
};

// Ereignisse unterwegs. wenn(): ob es passieren kann. optionen: was man tun kann.
// folge: { gold, holz, stein, nahrung, teile, leben (Anteil zu Beginn der Mission),
//          beziehung: { ort: wert }, entdecken: 'ort', lore: 'id', text }
const EREIGNISSE = [
  { id: 'haendler', titel: TX('Ein Händler am Wegesrand'), person: 'mara',
    text: TX('Ein Mann mit einem Karren voller Säcke winkt dir zu. „Proviant? Tauschware? Ich nehme fast alles.“'),
    optionen: [
      { text: TX('Proviant kaufen (15 Gold → 20 Nahrung)'), kosten: { gold: 15 }, folge: { nahrung: 20, text: TX('Du packst geräuchertes Fleisch und Brot ein.') } },
      { text: TX('Lazi-Teile verkaufen (3 Teile → 35 Gold)'), kosten: { teile: 3 }, folge: { gold: 35, text: TX('Er beißt auf eine Münze, bevor er sie dir gibt.') } },
      { text: TX('Weitergehen'), folge: { text: TX('Du nickst ihm zu und gehst weiter.') } },
    ] },
  { id: 'gabelung', titel: TX('Eine Weggabelung'),
    text: TX('Der Weg teilt sich. Links eine Abkürzung durchs Unterholz, rechts der lange, sichere Umweg.'),
    optionen: [
      { text: TX('Abkürzung nehmen'), zufall: [
        { chance: 0.55, folge: { holz: 8, text: TX('Du kommst schnell durch und sammelst unterwegs Feuerholz.') } },
        { chance: 0.45, folge: { leben: 0.75, text: TX('Dornen und Gestrüpp. Du kommst zerkratzt und erschöpft an.') } },
      ] },
      { text: TX('Sicheren Umweg gehen'), folge: { text: TX('Der Umweg ist lang, aber nichts passiert.') } },
    ] },
  { id: 'hinterhalt', titel: TX('Hinterhalt!'),
    text: TX('Drei Plünderer treten hinter einem umgestürzten Lastwagen hervor. „Wegezoll. Oder wir holen ihn uns.“'),
    optionen: [
      { text: TX('Kämpfen'), folge: { gold: 12, leben: 0.8, text: TX('Sie laufen davon, aber einer hat dich erwischt. In ihren Taschen findest du etwas Gold.') } },
      { text: TX('Zahlen (20 Gold)'), kosten: { gold: 20 }, folge: { text: TX('Sie lassen dich ziehen. Diesmal.') } },
    ] },
  { id: 'fund', titel: TX('Etwas im Graben'), wenn: () => !hatLore('brief'),
    text: TX('Im Straßengraben liegt eine verrostete Kiste mit der Aufschrift L.A.C.I. Darin: Kabel, Teile und ein vergilbter Brief.'),
    optionen: [
      { text: TX('Alles mitnehmen'), folge: { teile: 3, lore: 'brief', text: TX('Die Teile kann die Werkstatt gebrauchen. Den Brief liest du am Lagerfeuer.') } },
    ] },
  { id: 'hilferuf', titel: TX('Ein Hilferuf'), person: 'junge', wenn: () => !ortBekannt('birkenhain'),
    text: TX('Ein Junge rennt dir entgegen. „Bitte! Plünderer greifen Birkenhain an, mein Dorf! Es ist gleich hinter dem Hügel!“'),
    optionen: [
      { text: TX('Helfen'), folge: { leben: 0.75, nahrung: 15, entdecken: 'birkenhain', beziehung: { birkenhain: 2 }, lore: 'nachbarn', text: TX('Ihr vertreibt die Plünderer. Birkenhain dankt euch mit Korn und will mit euch handeln. Erschöpft ziehst du weiter.') } },
      { text: TX('Keine Zeit'), folge: { entdecken: 'birkenhain', beziehung: { birkenhain: -2 }, text: TX('Der Junge sieht dir nach. Birkenhain wird sich daran erinnern.') } },
    ] },
  { id: 'karte', titel: TX('Eine alte Karte'), wenn: () => (SPIEL.karte.besucht.wald || 0) > 0 && !ortBekannt('hort') && !SPIEL.karte.erledigt.hort,
    text: TX('Unter einem umgestürzten Wagen liegt eine Karte aus festem, glänzendem Papier. Tief im dunklen Wald ist ein Kreuz eingezeichnet.'),
    optionen: [
      { text: TX('Karte einstecken'), folge: { entdecken: 'hort', text: TX('Eine neue Geheimmission ist auf der Weltkarte erschienen.') } },
    ] },
  { id: 'rauch', titel: TX('Rauch über den Bergen'), wenn: () => !ortBekannt('eisenfurt') && (SPIEL.siege || 0) >= 2,
    text: TX('Weit im Nordosten steigt Rauch auf, gleichmäßig, wie aus einer Esse. Dort oben leben Menschen.'),
    optionen: [
      { text: TX('Die Richtung merken'), folge: { entdecken: 'eisenfurt', beziehung: { eisenfurt: 0 }, text: TX('Eisenfurt ist jetzt auf der Weltkarte zu sehen.') } },
    ] },
  { id: 'wanderer', titel: TX('Ein verletzter Wanderer'), wenn: () => !hatLore('oel'),
    text: TX('Ein alter Mann sitzt am Weg und hält sich das Bein. Er hat seit zwei Tagen nichts gegessen.'),
    optionen: [
      { text: TX('Nahrung teilen (10 Nahrung)'), kosten: { nahrung: 10 }, folge: { lore: 'oel', entdecken: 'kraftwerk', text: TX('Zum Dank erzählt er von einem alten Kohlekraftwerk hinter der verlassenen Stadt. „Mit Holzkohle läuft das auch“, sagt er. „Wenn man genug davon hat.“') } },
      { text: TX('Weitergehen'), folge: { text: TX('Du gehst weiter. Er ruft dir nichts nach.') } },
    ] },
];

function hatLore(id) { return SPIEL.chronik.includes(id); }
function ortBekannt(id) { const o = ORTE[id]; if (o.nurFinale && !regel('finale')) return false; return !o.versteckt && (regel('alleOrteOffen') || o.sichtbar || SPIEL.karte.bekannt.includes(id) || (SPIEL.karte.besucht[id] || 0) > 0 || !!(o.sichtbarWenn && o.sichtbarWenn())); }

// =====================================================================
// WELT: Three.js-Grundlagen, die Dorf und Mission gemeinsam nutzen.
// Kamera, Bilder als Texturen, Figuren, Eingabe, kleine Helfer.
// =====================================================================

const PX = 1 / 16;                   // Größe eines Bildpixels in Welt-Einheiten
const NEIGUNG = 55 * Math.PI / 180;  // Kamerawinkel, schräg von oben
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
let ansicht = { w: 1, h: 1, s: 1 };
let szene = null;                    // die gerade aktive Szene (Dorf oder Mission)

function groesseAnpassen() {
  // s = wie viele Bildschirmpixel ein Spielpixel breit ist (Optionen: Auflösung)
  const ziel = spielpixelHoehe();
  const s = ziel ? Math.max(1, innerHeight / ziel) : Math.max(1, Math.round(Math.min(innerWidth, innerHeight) / 230));
  const w = Math.ceil(innerWidth / s), h = Math.ceil(innerHeight / s);
  // Die neue Grafik hat feinere Bilder und braucht dafür mehr Bildpunkte, der Ausschnitt der Welt bleibt gleich
  const fein = neueGrafik() ? 3 : 2;   // Auch klassisch feiner als ein Spielpixel: Beim Herauszoomen im Dorf bleibt das Bild sauber
  renderer.setSize(w * fein, h * fein, false);
  cam.left = -w * PX / 2; cam.right = w * PX / 2; cam.top = h * PX / 2; cam.bottom = -h * PX / 2;
  cam.updateProjectionMatrix();
  ansicht = { w, h, s };
}
addEventListener('resize', groesseAnpassen);
groesseAnpassen();

// ---------- Grafikausfall ----------
// Handys nehmen dem Spiel die Grafik weg, etwa beim App-Wechsel oder wenn der Speicher knapp wird. Sobald sie
// zurückkommt, baut Three.js alles neu auf. Bis dahin steht das Spiel still, damit niemand blind verliert.
const Ausfall = { weg: false, zeit: 0, warten: 8 };   // warten: so viele Sekunden, bis „Neu laden“ erscheint
function grafikAusgefallen() {
  fehlerMerken('WebGL context lost', 'welt.js');
  if (Ausfall.weg) return;
  Ausfall.weg = true; Ausfall.zeit = 0;
  const el = document.getElementById('grafikHinweis');
  el.querySelector('p').textContent = TX('Die Grafik ist ausgefallen. Das Spiel ist angehalten, bis sie zurück ist.');
  el.querySelector('button').hidden = true;
  el.hidden = false;
  // Schließt das Handy jetzt die Seite, soll die laufende Mission nicht als Niederlage zählen (siehe abgebrocheneMission)
  if (SPIEL && SPIEL.laufend) SPIEL.laufend.grafik = true;
  spielSpeichern();
}
function grafikZurueck() {
  Ausfall.weg = false;
  document.getElementById('grafikHinweis').hidden = true;
  if (SPIEL && SPIEL.laufend && SPIEL.laufend.grafik) { delete SPIEL.laufend.grafik; spielSpeichern(); }
}
// Aus der Hauptschleife: true, solange die Grafik fehlt. isContextLost() weiß es schon vor dem Ereignis.
function grafikFehlt(sekunden) {
  if (!renderer.getContext().isContextLost()) { if (Ausfall.weg) grafikZurueck(); return false; }
  grafikAusgefallen();
  Ausfall.zeit += Math.min(sekunden, 0.1);
  const el = document.getElementById('grafikHinweis');
  if (Ausfall.zeit >= Ausfall.warten && el.querySelector('button').hidden) {
    el.querySelector('p').textContent = TX('Die Grafik kommt nicht von selbst zurück. Neu laden hilft. Eine laufende Mission zählt dann nicht als Niederlage.');
    el.querySelector('button').hidden = false;
  }
  return true;
}
// Auch im Hintergrund, wo die Hauptschleife nicht läuft
canvas.addEventListener('webglcontextlost', grafikAusgefallen);
document.querySelector('#grafikHinweis button').addEventListener('click', () => location.reload());

function kameraAuf(x, z) {
  x = Math.round(x / PX) * PX; z = Math.round(z / PX) * PX;
  cam.position.set(x, Math.sin(NEIGUNG) * 60, z + Math.cos(NEIGUNG) * 60);
  cam.lookAt(x, 0, z);
}

// ---------- Bilder ----------
function textur(c) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}
function spiegeln(c) {
  const m = document.createElement('canvas'); m.width = c.width; m.height = c.height;
  const g = m.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return m;
}
function weiss(c) {
  const m = document.createElement('canvas'); m.width = c.width; m.height = c.height;
  const g = m.getContext('2d'); g.drawImage(c, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
  return m;
}
// Ein Bild enthält die Figur nach rechts und nach links schauend, jeweils auch weiß (für Treffer)
function bild(c) {
  const l = spiegeln(c);
  const b = { w: c.width, h: c.height, quelle: c, r: textur(c), l: textur(l), rw: textur(weiss(c)), lw: textur(weiss(l)) };
  b.r.geteilt = b.l.geteilt = b.rw.geteilt = b.lw.geteilt = true;   // gehören allen Szenen, siehe szeneEntsorgen()
  return b;
}

const BILD = {};
function bilderLaden() {
  const posen = Object.keys(POSEN_HELD);
  // Spielfiguren: je Klasse und Waffenart alle Posen
  const arten = { ritter: ['schwert', 'langschwert', 'dolch', 'axt', 'beil'], beschwoerer: ['stab'], architekt: ['hammer'], schatten: ['dolche'] };
  BILD.held = {};
  for (const klasse in arten) {
    BILD.held[klasse] = {};
    arten[klasse].forEach(art => {
      BILD.held[klasse][art] = {};
      posen.forEach(p => { BILD.held[klasse][art][p] = bild(malHeld(POSEN_HELD[p], { klasse, waffe: art })); });
    });
  }
  BILD.soldat = {};
  posen.forEach(p => { BILD.soldat[p] = bild(malHeld(POSEN_HELD[p], { klasse: 'soldat', waffe: 'schwert' })); });
  BILD.kleingolem = {}; BILD.riesengolem = {};
  ['metall', 'eis', 'feuer', 'blitz'].forEach(e => {
    BILD.kleingolem[e] = [bild(malKleingolem(e, 0)), bild(malKleingolem(e, 1))];
    BILD.riesengolem[e] = [bild(malKleingolem(e, 0, 1.6)), bild(malKleingolem(e, 1, 1.6))];
  });
  BILD.feuerballiste = [bild(malFeuerballiste(0)), bild(malFeuerballiste(1))];
  BILD.sprengfalle = bild(malSprengfalle()); BILD.puppe = bild(malKoederpuppe());
  BILD.wurfdolch = bild(malWurfdolch()); BILD.klinge = bild(malGeisterklinge()); BILD.oelfass = bild(malOelfass());
  BILD.ruestung = {}; ['lumpen', 'leder', 'mantel', 'kette', 'platte', 'weste'].forEach(a => { BILD.ruestung[a] = bild(malRuestungSymbol(a)); });
  BILD.modul = {}; ['spule', 'zahnrad', 'linse', 'chip', 'kern'].forEach(a => { BILD.modul[a] = bild(malModulSymbol(a)); });
  BILD.zustand = {}; ['brennen', 'gift', 'blutung', 'frost', 'schock', 'oel'].forEach(a => { BILD.zustand[a] = malZustandSymbol(a); });
  BILD.schrott = {}; ['schuh', 'lumpen', 'dose', 'knochen'].forEach(a => { BILD.schrott[a] = bild(malSchrottFund(a)); });
  BILD.material = {}; Object.keys(MATERIALIEN).forEach(a => { BILD.material[a] = malMaterialSymbol(a); });
  BILD.dieb = [bild(malDieb(0)), bild(malDieb(2)), bild(malDieb(-2))];
  BILD.zelt = [bild(malZelt(0))]; BILD.zeltKaputt = [bild(malZelt(1)), bild(malZelt(2))];
  BILD.ausguck = [bild(malAusguck())];
  BILD.wagen = [bild(malWagen(0)), bild(malWagen(1))]; BILD.konvoi = [bild(malWagen(0, true)), bild(malWagen(1, true))];
  BILD.hochhaus = [3, 7, 11, 19].map(s => bild(malHochhaus(s)));
  BILD.autowrack = [0, 1, 2, 3].map(s => bild(malAutowrack(s)));
  BILD.schutt = [1, 2, 3].map(s => bild(malSchutt(s)));
  BILD.ruine = [1, 2, 3, 4].map(s => bild(malRuine(s)));
  BILD.schutzturm = [bild(malSchutzturm(0)), bild(malSchutzturm(1))];
  BILD.wartungsbot = [bild(malWartungsbot(0)), bild(malWartungsbot(1)), bild(malWartungsbot(0))];
  BILD.botKaputt = [bild(malWartungsbot(0, 'kaputt')), bild(malWartungsbot(1, 'kaputt'))];
  { const a = bild(malWartungsbot(0, 'freund')), b = bild(malWartungsbot(1, 'freund')); BILD.helferbot = { stand: a, stand2: a, lauf1: b, lauf2: a, lauf3: b, hieb: b }; }
  BILD.kesselwaerter = [bild(malKesselwaerter('ruhe', 0)), bild(malKesselwaerter('lauf', 0)), bild(malKesselwaerter('lauf', 1))];
  BILD.kesselRuhe = [BILD.kesselwaerter[0], bild(malKesselwaerter('ruhe', 1))];
  BILD.kesselHoch = bild(malKesselwaerter('hoch', 1));
  BILD.kesselHeissBilder = [bild(malKesselwaerter('heiss', 0)), bild(malKesselwaerter('heiss', 1))];
  BILD.kesselHeiss = BILD.kesselHeissBilder[0];
  BILD.lore = bild(malLore()); BILD.kohlehaufen = [1, 2, 3].map(s => bild(malKohlehaufen(s))); BILD.kisten = [1, 2].map(s => bild(malKisten(s)));
  BILD.industrielampe = [bild(malIndustrielampe(0)), bild(malIndustrielampe(1))];
  BILD.rohr = [1, 2].map(s => bild(malRohrleitung(s))); BILD.schaltschrank = [bild(malSchaltschrank(0)), bild(malSchaltschrank(1))];
  BILD.saeule = bild(malSaeule());
  BILD.eiferer = [bild(malEiferer(0, 0)), bild(malEiferer(2, 1)), bild(malEiferer(-2, 0))];
  BILD.hauptmann = [bild(malHauptmann(0, 0)), bild(malHauptmann(2, 0)), bild(malHauptmann(-2, 0))];
  BILD.hund = [bild(malHund(0)), bild(malHund(1))]; BILD.foerderband = [bild(malFoerderband(0)), bild(malFoerderband(1))];
  BILD.schlot = [1, 2].map(s => bild(malSchlot(s)));
  BILD.kessel = [1, 2, 3].map(s => bild(malKessel(s)));
  BILD.kraftwerkTor = [bild(malKraftwerkTor(0)), bild(malKraftwerkTor(1))];
  BILD.ziegelwand = [1, 2, 3].map(s => bild(malZiegelwand(s)));
  BILD.reklame = [bild(malLeuchtreklame(0)), bild(malLeuchtreklame(1))];
  BILD.laziTafel = [bild(malLaziTafel(0)), bild(malLaziTafel(1))];
  BILD.bude = [RAMPE.rot, RAMPE.blau, RAMPE.gruen, RAMPE.gelb, RAMPE.stoff].map(f => bild(malMarktstand(f))); BILD.budeZu = bild(malMarktstand(null, true));
  BILD.brettSchwarz = bild(malBrett(false)); BILD.brettWeiss = bild(malBrett(true)); BILD.buehne = bild(malBuehne()); BILD.schaukel = bild(malSchaukel()); BILD.wippe = bild(malWippe());
  BILD.stadthaus = [0, 1, 2, 3, 4, 5, 6, 7].map(s => bild(malStadthaus(s))); BILD.hausWaage = [bild(malHausWaage(0)), bild(malHausWaage(1))];
  BILD.hehlerstand = bild(malHehlerstand()); BILD.hehler = bild(malGassenfigur('hehler')); BILD.elster = bild(malGassenfigur('elster')); BILD.tuersteher = bild(malGassenfigur('tuersteher'));
  BILD.schlaeger = [0, 2, -2].map(s => bild(malSchlaeger(s, 'knueppel'))); BILD.messerstecher = [0, 2, -2].map(s => bild(malSchlaeger(s, 'messer')));
  BILD.armbruster = [0, 2, -2].map(s => bild(malSchlaeger(s, 'armbrust'))); BILD.leibwache = [0, 2, -2].map(s => bild(malSchlaeger(s, 'leibwache')));
  BILD.waagmeister = [bild(malWaagmeister(0)), bild(malWaagmeister(1))]; BILD.waagmeisterWankt = [bild(malWaagmeister(0, true)), bild(malWaagmeister(1, true))];
  BILD.grosseWaage = [-1, 0, 1].map(n => bild(malGrosseWaage(n)));
  BILD.zaehlsaeule = [bild(malZaehlsaeule(0)), bild(malZaehlsaeule(1))]; BILD.zaehlsaeuleRot = [bild(malZaehlsaeule(0, true)), bild(malZaehlsaeule(1, true))];
  BILD.kern = [bild(malKern(0)), bild(malKern(1))]; BILD.ersterZaehler = [bild(malErsterZaehler(0)), bild(malErsterZaehler(1))]; BILD.ersterZaehlerOffen = [bild(malErsterZaehler(0, true)), bild(malErsterZaehler(1, true))];
  BILD.schloss = malSchloss();
  BILD.hanne = bild(malGassenfigur('hanne')); BILD.ladung = [bild(malLadung(0)), bild(malLadung(1))];
  BILD.schaltwaechter = [bild(malSchaltwaechter(0)), bild(malSchaltwaechter(1))]; BILD.treiber = [bild(malTreiber(0)), bild(malTreiber(1))];
  BILD.herdenlaeufer = [bild(malHerdenlaeufer(0)), bild(malHerdenlaeufer(1))]; BILD.nummerNull = [bild(malNummerNull(0)), bild(malNummerNull(1))];
  BILD.kernwaagmeister = [bild(malWaagmeister(0, false, true)), bild(malWaagmeister(1, false, true))];
  BILD.kabelknoten = [bild(malKabelknoten(false, 0))]; BILD.kabelknotenAn = [bild(malKabelknoten(true, 0)), bild(malKabelknoten(true, 1))];
  BILD.anselmFigur = bild(malAnselmFigur()); BILD.schaltthron = bild(malSchaltthron());
  BILD.drohne = [bild(malDrohne(0)), bild(malDrohne(1))]; BILD.wachbot = [0, 1, 2].map(f => bild(malWachbot(f)));
  BILD.schaltkasten = [bild(malSchaltkasten(0))]; BILD.schaltkastenKaputt = bild(malSchaltkasten(2));
  BILD.vorarbeiter = [bild(malVorarbeiter(0, false)), bild(malVorarbeiter(1, false))]; BILD.vorarbeiterOffen = [bild(malVorarbeiter(0, true)), bild(malVorarbeiter(1, true))];
  BILD.grosseTafel = [0, 1, 2].map(s => bild(malGrosseTafel(s))); BILD.regal = [1, 2, 3].map(s => bild(malRegal(s))); BILD.lesepult = [bild(malLesepult(0)), bild(malLesepult(1))];
  BILD.wert = {}; ['schaden', 'tempo', 'mana', 'leben', 'ruestung', 'ausweichen', 'krit'].forEach(a => { BILD.wert[a] = malWertSymbol(a); });
  BILD.elementturm = {};
  Object.keys(ELEMENT_RAMPE).forEach(el => { BILD.elementturm[el] = [bild(malElementturm(el, 0)), bild(malElementturm(el, 1))]; });
  BILD.bauwerk = { bolzen: bild(malBolzenwerfer()), moerser: bild(malMoerser()), pfahlwall: bild(malPfahlwall()) };
  BILD.pl = [bild(malPluenderer(0)), bild(malPluenderer(2)), bild(malPluenderer(-2))];
  BILD.sch = [bild(malPluenderer(0, true)), bild(malPluenderer(2, true)), bild(malPluenderer(-2, true))];
  BILD.kf = [bild(malKaefer(0)), bild(malKaefer(1))];
  BILD.fk = [bild(malKaefer(0, true)), bild(malKaefer(1, true))];
  BILD.st = [bild(malPluenderer(0, 'schild')), bild(malPluenderer(2, 'schild')), bild(malPluenderer(-2, 'schild'))];
  BILD.bs = [bild(malPluenderer(0, 'brand')), bild(malPluenderer(2, 'brand', 1)), bild(malPluenderer(-2, 'brand'))];
  BILD.tr = [bild(malPluenderer(0, 'trommel')), bild(malPluenderer(2, 'trommel', 1)), bild(malPluenderer(-2, 'trommel'))];
  BILD.trSchlag = bild(malPluenderer(0, 'trommel', 1));
  BILD.hw = [bild(malWolf(0, false, true)), bild(malWolf(1, false, true)), bild(malWolf(2, false, true))];
  BILD.gl = [bild(malGolem(0)), bild(malGolem(1))];
  BILD.wf = [bild(malWolf(0)), bild(malWolf(1)), bild(malWolf(2))];
  BILD.aw = [bild(malWolf(0, true)), bild(malWolf(1, true)), bild(malWolf(2, true))];
  BILD.feuerGross = [0, 1, 2].map(st => [bild(malGrossesFeuer(st, 0)), bild(malGrossesFeuer(st, 1))]);
  BILD.holz = bild(malHolzbuendel()); BILD.fleisch = bild(malFleisch());
  BILD.bewohner = [];
  for (let i = 0; i < 8; i++) BILD.bewohner.push([bild(malDorfbewohner(i * 7 + 3, 0)), bild(malDorfbewohner(i * 7 + 3, 1))]);
  BILD.waffe = {};
  ['schwert', 'langschwert', 'dolch', 'dolche', 'axt', 'beil', 'stab', 'hammer'].forEach(a => { BILD.waffe[a] = bild(malWaffenSymbol(a)); });
  BILD.muenze = bild(malMuenze()); BILD.teil = bild(malTeil()); BILD.brot = bild(malBrot());
  BILD.bolzen = bild(malBolzen()); BILD.pfeil = bild(malPfeil()); BILD.ausruf = bild(malAusruf());
  BILD.turm = bild(malLaziTurm());
  BILD.schule = bild(malSchule());
  BILD.tuer = [bild(malKellertuer(0)), bild(malKellertuer(1)), bild(malKellertuer(2))];
  BILD.bunkertor = [bild(malBunkertor(0)), bild(malBunkertor(1)), bild(malBunkertor(2))]; BILD.bunkerklotz = bild(malBunkerklotz());
  BILD.zaun = bild(malZaun()); BILD.bus = bild(malBus()); BILD.rad = bild(malFahrradstaender());
  BILD.bank = bild(malBank()); BILD.korb = bild(malKorb()); BILD.laterne = bild(malLaterne());
  BILD.tonne = bild(malTonne()); BILD.barrikade = bild(malBarrikade());
  BILD.laubbaum = [1, 2, 3, 4].map(s => bild(malLaubbaum(s)));
  BILD.tanne = [1, 2, 3].map(s => bild(malTanne(s)));
  BILD.busch = [1, 2, 3, 4, 5, 6].map(s => bild(malBusch(s)));
  BILD.truhe = bild(malTruhe(false)); BILD.truheOffen = bild(malTruhe(true));
  BILD.gebaeude = {
    lagerfeuer: [bild(malLagerfeuer(0)), bild(malLagerfeuer(1))],
    wohnhaus: [1, 2, 3].map(s => bild(malWohnhaus(s))),
    steinhaus: [1, 2, 3].map(s => bild(malSteinhaus(s))),
    holzfaeller: [bild(malHolzfaeller())], steinmetz: [bild(malSteinmetz())], bauernhof: [bild(malBauernhof())],
    koehlerei: [bild(malKoehlerei(0)), bild(malKoehlerei(1))], wirtshaus: [bild(malWirtshaus(0)), bild(malWirtshaus(1))],
    kirche: [bild(malKirche())], weg: [bild(malWeg())], labor: [bild(malLabor(1)), bild(malLabor(0))],
    lager: [bild(malLager())],
    schmiede: [bild(malSchmiede(true)), bild(malSchmiede(false))],
    werkstatt: [bild(malWerkstatt(true)), bild(malWerkstatt(false))],
    kaserne: [bild(malKaserne())], wachturm: [bild(malWachturm())],
    brunnen: [bild(malBrunnen())], blumenbeet: [1, 2, 3].map(s => bild(malBlumenbeet(s))), bank: [BILD.bank], fahne: [bild(malFahne())],
    wimpel: [bild(malWimpelkette())], rosenbogen: [bild(malRosenbogen())], marktstand: [bild(malMarktstand())],
    faesser: [1, 2].map(s => bild(malFaesser(s))), blumenkarren: [bild(malBlumenkarren())], zypresse: [1, 2].map(s => bild(malZypresse(s))),
    klaeranlage: [bild(malKlaeranlage(0)), bild(malKlaeranlage(1))],
    verbundterminal: [bild(malVerbundTerminal(-1)), bild(malVerbundTerminal(0)), bild(malVerbundTerminal(1))],
    altmetall: [1, 2, 3].map(st => bild(malAltmetall(st))),
    fischerhuette: [1, 2, 3].map(st => bild(malFischerhuette(st))), kraeutergarten: [1, 2].map(st => bild(malKraeutergarten(st))),
    spaeherposten: [1, 2].map(st => bild(malSpaeherposten(st))), rathaus: [1, 2, 3].map(st => bild(malRathaus(st))),
    baeckerei: [bild(malBaeckerei(0)), bild(malBaeckerei(1))], archiv: [1, 2].map(st => bild(malArchiv(st))),
    lastlaeuferdepot: [1, 2].map(st => bild(malDepot(st))), ladestation: [bild(malLadestation(-1)), bild(malLadestation(0)), bild(malLadestation(1))],
    gewaechshaus: [bild(malGewaechshaus(-1)), bild(malGewaechshaus(0)), bild(malGewaechshaus(1))], krankenstation: [1, 2].map(st => bild(malKrankenstation(st))),
    bunkerfunk: [bild(malBunkerfunk(-1)), bild(malBunkerfunk(0)), bild(malBunkerfunk(1))], wohnblock: [bild(malWohnblock(-1)), bild(malWohnblock(0))],
    montagehalle: [bild(malMontagehalle(-1)), bild(malMontagehalle(0))], robotergarage: [1, 2].map(st => bild(malRobotergarage(st))),
    signalturm: [bild(malSignalturm(-1)), bild(malSignalturm(0)), bild(malSignalturm(1))],
    ausschlachterei: [1, 2].map(st => bild(malAusschlachterei(st))),
    stoersender: [1, 2].map(st => bild(malStoersender(st))), denkmal: [bild(malDenkmal())],
    laterne: [BILD.laterne], funkturm: [bild(malFunkturm(0)), bild(malFunkturm(1))], statue: [bild(malStatue(BILD.held.ritter.schwert.stand.quelle))],
  };
  // Dorfverteidigung und Begleiter
  BILD.stachelreiter = [0, 1, 2].map(v => bild(malStachelreiter(v)));
  BILD.palisade = [0, 1, 2, 3].map(v => bild(malPalisade(v)));
  BILD.tor = { barrikade: [0, 1, 2].map(s => bild(malTor('barrikade', s))), palisade: [0, 1, 2].map(s => bild(malTor('palisade', s))) };
  BILD.rohstoff = {}; ['gold', 'holz', 'stein', 'teile', 'holzkohle', 'beschlaege', 'nahrung', 'einwohner', 'frei', 'standard', 'tag', 'mauer', 'strom', 'altmetall', 'kraeuter'].forEach(a => { BILD.rohstoff[a] = malRohstoffSymbol(a); });
  BILD.begleiter = {};
  Object.keys(BEGLEITER).forEach(art => {
    const [klasse, waffe] = BEGLEITER[art].bild;
    BILD.begleiter[art] = {};
    Object.keys(POSEN_HELD).forEach(p => { BILD.begleiter[art][p] = bild(malHeld(POSEN_HELD[p], { klasse, waffe, begleiter: true })); });
  });
}

// ---------- Figuren in der Szene ----------
const schattenGeo = new THREE.CircleGeometry(1, 16);
const schattenMat = new THREE.MeshBasicMaterial({ color: 0x0a0814, transparent: true, opacity: 0.3, depthWrite: false });
schattenGeo.geteilt = schattenMat.geteilt = true;

// Eine Szene, die nicht mehr gebraucht wird (alte Mission, altes Dorf), gibt ihren Grafikspeicher frei.
// Ohne das bleiben Böden, Materialien und Formen jeder Mission auf der Grafikkarte liegen.
// Was mit .geteilt markiert ist (die Bilder aus BILD, gemeinsame Formen), bleibt erhalten.
function szeneEntsorgen(alt) {
  if (!alt || alt === szene) return;
  alt.traverse(o => {
    if (o.geometry && !o.isSprite && !o.geometry.geteilt) o.geometry.dispose();   // Sprites teilen sich eine Form
    (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach(m => {
      if (m.geteilt) return;
      if (m.map && !m.map.geteilt) m.map.dispose();
      m.dispose();
    });
  });
  while (alt.children.length) alt.remove(alt.children[0]);
}

function figur(b, schattenRadius) {
  if (b.licht && szene.userData.licht) return lichtFigur(b, schattenRadius);
  const mat = new THREE.SpriteMaterial({ map: b.r, alphaTest: 0.5, transparent: false });
  if (szene.userData.licht) mat.color.setScalar(0.55);   // Alte Bilder spüren das Licht nicht und würden sonst aus der Nacht leuchten
  const s = new THREE.Sprite(mat);
  s.center.set(0.5, 0);
  s.scale.set(b.w * PX, b.h * PX, 1);
  szene.add(s);
  let sh = null;
  if (schattenRadius) {
    sh = new THREE.Mesh(schattenGeo, schattenMat);
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; sh.scale.set(schattenRadius, schattenRadius * 0.7, 1);
    szene.add(sh);
  }
  if (b.wind) windAn(mat, b, false);
  return { sprite: s, shadow: sh };
}
// Wind: Bäume und Büsche wiegen sich. Der Fuß bleibt stehen, die Krone wandert um wenige Bildpunkte.
// Jede Pflanze hat ihren eigenen Takt, dazu langsame Böen. Die Bilder selbst bleiben unverändert (auch in Klassisch).
const WIND_ZEIT = { value: 0 };
function windMarkieren() {
  const markiere = (l, st) => { if (Array.isArray(l)) l.forEach(b => { if (b) b.wind = st; }); return l; };
  for (const [k, st] of [['tanne', 1], ['laubbaum', 1], ['busch', 0.7]]) {
    const d = Object.getOwnPropertyDescriptor(BILD, k);
    if (d && d.get) Object.defineProperty(BILD, k, { configurable: true, enumerable: true, get() { return markiere(d.get.call(BILD), st); }, set: d.set });
    else markiere(BILD[k], st);
  }
}
function windAn(mat, b, flaeche) {
  const weite = (neueGrafik() ? 0.022 : 0.045) * b.wind * (flaeche ? b.h / b.w : 1), takt = 'float wiegen = 0.3 + 0.45 * sin(uZeit * 1.6 + uWind.x) + 0.25 * sin(uZeit * 0.47 + uWind.x * 1.7);\n';
  mat.onBeforeCompile = sh => {
    sh.uniforms.uZeit = WIND_ZEIT; sh.uniforms.uWind = { value: new THREE.Vector2(Math.random() * 6.28, weite) };
    sh.vertexShader = 'uniform float uZeit;\nuniform vec2 uWind;\n' + (flaeche
      ? sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + takt + 'transformed.x += uWind.y * max(0.0, position.y) * wiegen;')
      : sh.vertexShader.replace('vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;', 'vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n' + takt + 'alignedPosition.x += uWind.y * scale.y * max(0.0, position.y + 0.5 - center.y) * wiegen;'));
  };
  mat.customProgramCacheKey = () => flaeche ? 'wind-flaeche' : 'wind';
}
function entfernen(o) {
  if (o.sprite) { szene.remove(o.sprite); o.sprite.material.dispose(); }
  if (o.shadow) szene.remove(o.shadow);
  if (o.schattenTafel) szene.remove(o.schattenTafel);
  if (o.extra) o.extra.forEach(m => szene.remove(m));
}
function zeige(o, b, blick, hell) {
  if (o.sprite.isMesh) return lichtZeigen(o, b, blick, hell);
  const map = blick < 0 ? (hell ? b.lw : b.l) : (hell ? b.rw : b.r);
  if (o.sprite.material.map !== map) { o.sprite.material.map = map; o.sprite.scale.set(b.w * PX, b.h * PX, 1); }
}
function stelle(o, x, z, y) {
  o.sprite.position.set(x, y || 0, z);
  if (o.schattenTafel) o.schattenTafel.position.set(x, y || 0, z);
  if (o.shadow) o.shadow.position.set(x, 0.01, z);
}
function bodenFlaeche(geo, farbe, deckkraft) {
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: deckkraft, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02;
  szene.add(m);
  return m;
}

// ---------- Bodentexturen ----------
function hexRgb(s) { return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]; }

// Malt einen Boden. art(x, z) gibt für jede Stelle eine Bodenart zurück.
function malBoden(groesse, proEinheit, art, arten, seed) {
  if (neueGrafik()) return neuBodenMalen(groesse, proEinheit, art, arten, seed);
  const N = groesse * proEinheit, r = zufall(seed);
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N), d = img.data;
  const pal = {};
  for (const k in arten) pal[k] = arten[k].map(hexRgb);
  const half = groesse / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ux = x / proEinheit - half, uz = y / proEinheit - half;
    const p = pal[art(ux, uz)];
    const n = r();
    // Flecken: großflächiges Rauschen + feines Korn
    const fleck = Math.sin(ux * 0.9 + Math.sin(uz * 0.7) * 2) + Math.cos(uz * 1.1 + Math.sin(ux * 0.5) * 2);
    let i = fleck > 0.8 ? 1 : fleck < -0.9 ? 2 : 0;
    if (n < 0.12) i = 2; else if (n > 0.93) i = 3;
    const col = p[Math.min(i, p.length - 1)];
    const o = (y * N + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return { c, g, N, toPx: v => Math.round((v + half) * proEinheit), r, artBei: (px, py) => art(px / proEinheit - half, py / proEinheit - half) };
}
// Grasbüschel und Blumen auf den Boden streuen
function streuGras(boden, wo, anzahl, farben) {
  const { g, N, r } = boden;
  for (let k = 0; k < anzahl; k++) {
    const x = r() * N | 0, y = r() * N | 0;
    if (!wo(x, y)) continue;
    const f = farben[Math.floor(r() * farben.length)];
    g.fillStyle = f[0]; g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y, 1, 2);
    g.fillStyle = f[1]; g.fillRect(x + 1, y - 1, 1, 3);
  }
}
function streuBlumen(boden, wo, anzahl) {
  const { g, N, r } = boden;
  const farben = ['#b06a80', '#c8b060', '#c8c0b0', '#8090c0', '#b07a50'];
  for (let k = 0; k < anzahl; k++) {
    const x = r() * N | 0, y = r() * N | 0;
    if (!wo(x, y)) continue;
    g.fillStyle = '#2e4a2a'; g.fillRect(x, y + 1, 1, 1);
    g.fillStyle = farben[Math.floor(r() * farben.length)]; g.fillRect(x, y, 1, 1);
  }
}
// Kleine Details auf dem Boden: Steinchen mit Licht und Schatten, Laub, Zweige
function streuDetails(boden, wo, anzahl) {
  const { g, N, r } = boden, neu = neueGrafik();
  if (neu) anzahl *= 0.6;
  for (let k = 0; k < anzahl; k++) {
    const x = r() * N | 0, y = r() * N | 0;
    if (!wo(x, y)) continue;
    const art = r();
    if (art < 0.45) {
      g.fillStyle = '#1d1328'; g.fillRect(x, y + 1, 2, 1);
      g.fillStyle = neu ? '#4c4a58' : '#6e6c80'; g.fillRect(x, y, 2, 1);
      g.fillStyle = neu ? '#65636f' : '#9a98ac'; g.fillRect(x, y, 1, 1);
    } else if (art < 0.75) {
      g.fillStyle = ['#6a4a24', '#8a5a2a', '#5a5a24'][Math.floor(r() * 3)]; g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y + 1, 1, 1);
    } else {
      g.fillStyle = '#4a3020'; for (let i = 0; i < 4; i++) g.fillRect(x + i, y + (i > 1 ? 1 : 0), 1, 1);
    }
  }
}
function bodenMesh(boden, groesse) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(groesse, groesse), szene.userData.licht ? bodenLichtMaterial(textur(boden.c)) : new THREE.MeshBasicMaterial({ map: boden.textur || textur(boden.c) }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = !!szene.userData.licht;
  szene.add(m);
  return m;
}

// ---------- Eingabe ----------
const tasten = {};
const istTouch = matchMedia('(pointer: coarse)').matches;
const strahl = new THREE.Raycaster();
const bodenEbene = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function zeigerAufBoden(clientX, clientY, ziel) {
  const ndc = new THREE.Vector2(clientX / innerWidth * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  strahl.setFromCamera(ndc, cam);
  return strahl.ray.intersectPlane(bodenEbene, ziel || new THREE.Vector3());
}
function weltZuBildschirm(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(cam);
  return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
}

// ---------- Helfer ----------
const zz = (a, b) => a + Math.random() * (b - a);
const zzGanz = (a, b) => Math.floor(zz(a, b + 1));
const winkelDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const abstand = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function meldung(text, unter, ms) {
  const el = document.getElementById('toast');
  el.textContent = '';
  el.append(text);
  if (unter) { const s = document.createElement('small'); s.textContent = unter; el.append(s); }
  el.classList.add('show');
  clearTimeout(meldung.t); meldung.t = setTimeout(() => el.classList.remove('show'), ms || 2200);
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

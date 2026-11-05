// =====================================================================
// NEUE GRAFIK (Probelauf, Schritt G1): feinere Figuren, Bäume und Häuser, die das Licht des Feuers wirklich spüren.
// Ein Blatt merkt sich je Pixel Farbe, Oberflächenrichtung und was von selbst leuchtet.
// Daraus entstehen drei Bilder: Tagesbild (Stufe niedrig), Farb- und Richtungskarte (Stufe hoch), Leuchtkarte.
// Klassisch (Option „grafik“) läuft das Spiel wie bisher, dann wird hier nichts gemalt.
// =====================================================================
const NEUE_GRAFIK = (() => {
const FARBEN = { haut:['#5c2b2e','#b4614a','#e89a6c','#ffcf9e'], rot:['#3a1028','#8a1f3a','#d2373f','#ff7a5e'], leder:['#2b1622','#5e3326','#8f5536','#c48550'], lederDkl:['#1f1018','#3e2220','#5c3428','#7e4a32'], stahl:['#262a44','#5a6688','#a7b6cf','#f2f7ff'], gold:['#4a2410','#b06a18','#eab03a','#fff07a'], kapuze:['#2a0e1e','#5e1830','#8c2a3a','#b8484a'], rost:['#34141a','#7a3220','#c0612c','#f0a04c'], metall:['#1e2236','#3e4660','#68728e','#9aa6c0'], lazi:['#0e3a4a','#1aa0a8','#5ff0e0','#e0fff8'], stein:['#1f1e30','#4a4862','#77768e','#a9a8bc'], moos:['#16301e','#2e5a2a','#4e8a36','#86c04e'], holz:['#2a1418','#5a2e22','#8a4e30','#bc7a44'], stroh:['#4a2a14','#a0681e','#dcaa3e','#ffe282'], putz:['#4a3a3a','#a89080','#e0cdb0','#fff4dc'], blattH:['#18261a','#2e4a2a','#4a6c34','#76924a'], nadel:['#0c1a1a','#16322e','#22483c','#3a6648'], rotDkl:['#24101c','#5a1a2a','#86283a','#a8443e'], hose:['#141826','#283048','#3c4664','#56627e'], lumpen:['#1e1a1a','#3e3634','#5a504a','#776a60'], fell:['#141018','#2e2a36','#4a4656','#6e6a7a'], fellDkl:['#0c080e','#1e1820','#302832','#4a3e48'], glas:['#1a2a4a','#5a8ac8','#a8d8f8','#f0ffff'], blauDkl:['#101830','#1e3060','#2e4a88','#5a78b8'], feuer:['#6a1a10','#e0521c','#ffb030','#fff4a0'], gelb:['#4a3010','#b08018','#e8c040','#fff090'], erde:['#2c2018','#4a3424','#6d4c30','#8d6a44'], gras:['#16261c','#24402a','#3a5f35','#5a8040'] };
const hex = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const STUFEN = 9, RAMPEN = {};
const rampe = n => RAMPEN[n] || (RAMPEN[n] = Array.from({length:STUFEN},(_, i)=>{ const q=FARBEN[n].map(hex), t=i/(STUFEN-1)*3, a=Math.min(2,Math.floor(t)), f=t-a; return q[a].map((c,k)=>c+(q[a+1][k]-c)*f); }));
const NAMEN = Object.keys(FARBEN);
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
const hash = (x,y)=>{ const s=Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); };
function rauschen(x,y){ const i=Math.floor(x),j=Math.floor(y),f=x-i,g=y-j,u=f*f*(3-2*f),v=g*g*(3-2*g); return (hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v; }
const fbm=(x,y)=>(rauschen(x,y)+rauschen(x*2.1,y*2.1)*.5+rauschen(x*4.3,y*4.3)*.25)/1.75;
const mitMass = (f, x0, y0, x1, y1) => { f.mass = [x0, y0, x1, y1]; return f; };
const M = { ell:(cx,cy,rx,ry)=>mitMass((x,y)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1,cx-rx,cy-ry,cx+rx,cy+ry), box:(x0,y0,w,h)=>mitMass((x,y)=>x>=x0&&x<x0+w&&y>=y0&&y<y0+h,x0,y0,x0+w,y0+h),
  kap:(x0,y0,x1,y1,r)=>mitMass((x,y)=>{const dx=x1-x0,dy=y1-y0,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/l));return (x-x0-t*dx)**2+(y-y0-t*dy)**2<=r*r;},Math.min(x0,x1)-r,Math.min(y0,y1)-r,Math.max(x0,x1)+r,Math.max(y0,y1)+r),
  poly:p=>mitMass((x,y)=>{let a=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[xi,yi]=p[i],[xj,yj]=p[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)a=!a;}return a;},Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))),
  oder:(...m)=>{const f=(x,y)=>m.some(g=>g(x,y)); return m.every(g=>g.mass)?mitMass(f,Math.min(...m.map(g=>g.mass[0])),Math.min(...m.map(g=>g.mass[1])),Math.max(...m.map(g=>g.mass[2])),Math.max(...m.map(g=>g.mass[3]))):f;},
  ohne:(a,b)=>{const f=(x,y)=>a(x,y)&&!b(x,y); return a.mass?mitMass(f,...a.mass):f;} };
// Arbeitsspeicher für form(): wird wiederverwendet, statt je Form ein ganzes Blatt anzulegen
let formDrin = new Uint8Array(0), formDist = new Float32Array(0);
const LICHT = (()=>{ const v=[-.55,.62,.56], l=Math.hypot(...v); return v.map(c=>c/l); })();
const UMRISS = hex('#1d1328');
// Eine Leinwand merkt sich je Pixel Farbrampe, Helligkeit und Oberflächenrichtung. Daraus entstehen Tagesbild, Farbkarte und Lichtkarte.
class Blatt {
  constructor(w,h){ this.w=w; this.h=h; const n=w*h; this.r=new Int16Array(n).fill(-1); this.v=new Float32Array(n); this.nx=new Float32Array(n); this.ny=new Float32Array(n); this.nz=new Float32Array(n).fill(1); this.em=new Uint8Array(n); }
  form(maske,farbe,o={}){
    const {w,h}=this, R=o.rund===undefined?6:o.rund, rid=NAMEN.indexOf(farbe);
    if(formDrin.length<w*h){ formDrin=new Uint8Array(w*h); formDist=new Float32Array(w*h); }
    const drin=formDrin, dist=formDist, mass=maske.mass, sx0=mass?Math.max(0,Math.floor(mass[0])-1):0, sy0=mass?Math.max(0,Math.floor(mass[1])-1):0, sx1=mass?Math.min(w-1,Math.ceil(mass[2])+1):w-1, sy1=mass?Math.min(h-1,Math.ceil(mass[3])+1):h-1;
    let x0=w,y0=h,x1=-1,y1=-1;
    for(let y=sy0;y<=sy1;y++)for(let x=sx0;x<=sx1;x++) if(maske(x+.5,y+.5)){ drin[y*w+x]=1; dist[y*w+x]=1e4; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    if(x1<0) return this;
    const at=(x,y)=>x<0||y<0||x>=w||y>=h?0:dist[y*w+x];
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) if(drin[y*w+x]) dist[y*w+x]=Math.min(dist[y*w+x],at(x-1,y)+1,at(x,y-1)+1,at(x-1,y-1)+1.41,at(x+1,y-1)+1.41);
    for(let y=y1;y>=y0;y--)for(let x=x1;x>=x0;x--) if(drin[y*w+x]) dist[y*w+x]=Math.min(dist[y*w+x],at(x+1,y)+1,at(x,y+1)+1,at(x+1,y+1)+1.41,at(x-1,y+1)+1.41);
    const korn=o.korn||4, rau=o.rau||0, hoehe=(x,y)=>{ const d=Math.min(at(x,y),R), t=R?d/R:1; return (R?R*Math.sqrt(Math.max(0,1-(1-t)*(1-t))):0)+(rau?rau*(fbm(x/korn,y/korn)-.5)*3:0); };
    const neu=[];
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){ const i=y*w+x; if(!drin[i])continue;
      const gx=(hoehe(x+1,y)-hoehe(x-1,y))/2, gy=(hoehe(x,y+1)-hoehe(x,y-1))/2, l=Math.hypot(gx,gy,1);
      let v=(o.hell||0)+(o.muster?o.muster(x,y):0)+(hash(x,y)-.5)*(o.funkeln===undefined?.05:o.funkeln);
      const aussen=(nx,ny)=>nx>=0&&ny>=0&&nx<w&&ny<h&&!drin[ny*w+nx]&&this.r[ny*w+nx]>=0, rand=o.kante!==false&&(aussen(x+1,y)||aussen(x-1,y)||aussen(x,y+1)||aussen(x,y-1));
      if(rand&&o.kante!==false) v-=.42;
      neu.push([i,v,-gx/l,gy/l,1/l]); }
    for(const [i,v,nx,ny,nz] of neu){ this.r[i]=rid; this.v[i]=v; this.nx[i]=nx; this.ny[i]=ny; this.nz[i]=nz; this.em[i]=o.leuchtet?1:0; }
    for(let y=y0;y<=y1;y++){ drin.fill(0,y*w+x0,y*w+x1+1); dist.fill(0,y*w+x0,y*w+x1+1); }
    return this;
  }
  punkt(x,y,farbe,o={}){ x=Math.round(x); y=Math.round(y); if(x<0||y<0||x>=this.w||y>=this.h)return this; const i=y*this.w+x; this.r[i]=NAMEN.indexOf(farbe); this.v[i]=o.hell||0; this.nx[i]=0; this.ny[i]=0; this.nz[i]=1; this.em[i]=o.leuchtet?1:0; return this; }
  linie(p,farbe,o={}){ for(let k=0;k<p.length-1;k++){ const [a,b]=p[k],[c,d]=p[k+1],n=Math.ceil(Math.hypot(c-a,d-b)); for(let i=0;i<=n;i++) this.punkt(a+(c-a)*i/n,b+(d-b)*i/n,farbe,o); } return this; }
  bild(art){ // 'tag': fertig beleuchtet. 'farbe': nur Farbe für das echte Licht. 'richtung': Lichtkarte. 'leuchten': was von selbst leuchtet.
    const {w,h}=this, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'), d=g.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const i=y*w+x,o=i*4,rid=this.r[i];
      if(rid<0){ const rand=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const X=x+a,Y=y+b;return X>=0&&Y>=0&&X<w&&Y<h&&this.r[Y*w+X]>=0;});
        if(rand&&(art==='tag'||art==='farbe')){ d.data[o]=UMRISS[0]; d.data[o+1]=UMRISS[1]; d.data[o+2]=UMRISS[2]; d.data[o+3]=255; }
        else if(rand&&art==='richtung'){ d.data[o]=128; d.data[o+1]=128; d.data[o+2]=255; d.data[o+3]=255; }
        else if(rand&&art==='leuchten'){ d.data[o+3]=255; }
        continue; }
      const nx=this.nx[i],ny=this.ny[i],nz=this.nz[i],dot=Math.max(0,nx*LICHT[0]+ny*LICHT[1]+nz*LICHT[2]), R=rampe(NAMEN[rid]);
      if(art==='richtung'){ d.data[o]=nx*127+128; d.data[o+1]=ny*127+128; d.data[o+2]=nz*127+128; d.data[o+3]=255; continue; }
      if(art==='leuchten'){ const c=this.em[i]?R[STUFEN-2]:[0,0,0]; d.data[o]=c[0]; d.data[o+1]=c[1]; d.data[o+2]=c[2]; d.data[o+3]=255; continue; }
      let v = this.em[i] ? .85+this.v[i] : art==='tag' ? .1+dot*.86+this.v[i] : .4+(dot-.5)*.3+this.v[i];
      let t=Math.max(0,Math.min(1,v))*(STUFEN-1)+(BAYER[(y%4)*4+x%4]-.5)*.6;
      const f=R[Math.max(0,Math.min(STUFEN-1,Math.round(t)))];
      d.data[o]=f[0]; d.data[o+1]=f[1]; d.data[o+2]=f[2]; d.data[o+3]=255; }
    g.putImageData(d,0,0); return c;
  }
}
const steine=(x,y)=>((y%8<1)||((x+(Math.floor(y/8)%2?7:0))%14<1))?-.32:(hash(Math.floor((x+(Math.floor(y/8)%2?7:0))/14),Math.floor(y/8))-.5)*.25;
const maserung=(x,y)=>Math.sin(x*1.1+Math.sin(y*.18)*2)*.1+(hash(x,Math.floor(y/9))>.93?-.25:0);
const felle=(x,y)=>Math.sin(x*.8+y*1.7)*.1+(hash(x,y)>.9?.14:hash(x,y)<.1?-.14:0);

function zeichneEiche(){ const m=new Blatt(150,172);
  m.form(M.oder(M.poly([[62,172],[92,172],[85,150],[83,100],[68,100],[66,150]]),M.kap(76,110,44,72,5),M.kap(76,104,108,68,5),M.kap(78,92,80,52,5)),'holz',{rund:8,rau:.6,korn:2.5,muster:(x,y)=>Math.sin(x*1.3+Math.sin(y*.2)*2.5)*.14});
  m.form(M.poly([[60,172],[70,160],[73,172]]),'moos',{rund:2,rau:.6,korn:2});
  const R=(()=>{let a=7;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})(), H=[];
  for(let i=0;i<34;i++){ const w=R()*6.28, r=Math.sqrt(R()); H.push([74+Math.cos(w)*r*60, 58+Math.sin(w)*r*46, 12+R()*10]); }
  H.sort((a,b)=>a[1]-b[1]+(a[0]-b[0])*.2);
  H.forEach(([x,y,g],i)=>m.form((a,b)=>((a-x)/g)**2+((b-y)/(g*.82))**2<=1+(hash(Math.floor(a),Math.floor(b))-.5)*.7,'blattH',{rund:8,rau:.8,korn:2.5,hell:-.1+i/H.length*.16+(y<50?.08:-.04),muster:(a,b)=>{const q=hash(a,b);return q>.82?.2:q<.16?-.22:0;}}));
  return m; }

// Runde 3 nach der Prüfung: fester Maßstab, Rüstung aus Platten statt aufgeblasener Formen, echte Ansichten und ein Gang mit Durchgangsbildern
Object.assign(FARBEN, {
  stahlAlt: ['#10121a', '#30343f', '#596170', '#a6afb9'], mantel: ['#0b1016', '#18232d', '#283946', '#435a66'], wein: ['#1c0a12', '#43131f', '#6e1f2c', '#94383a'],
  leinen: ['#2a2622', '#544c43', '#7c7062', '#a99b88'], rindsleder: ['#1a100c', '#3c2618', '#5e3f28', '#84603f'], russ: ['#0c0b0f', '#201d24', '#38333c', '#544d58'],
  reet: ['#241b10', '#54401f', '#826a36', '#ad9659'], lack: ['#121a2a', '#26354f', '#3f526c', '#6c7f94'], gurt: ['#15161a', '#2c2e34', '#474a52', '#6c6f78'], wellblech: ['#1e2024', '#464a50', '#737880', '#a4a9ad'],
});
NAMEN.length = 0; NAMEN.push(...Object.keys(FARBEN));
// Blatt: spiegeln dreht auch die Lichtrichtung um. skaliert malt mit logischen Maßen auf ein feineres Raster.
Blatt.prototype.spiegeln = function () { const { w, h } = this, q = new Blatt(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = y * w + x, b = y * w + (w - 1 - x); q.r[b] = this.r[a]; q.v[b] = this.v[a]; q.nx[b] = -this.nx[a]; q.ny[b] = this.ny[a]; q.nz[b] = this.nz[a]; q.em[b] = this.em[a]; } return q; };
Blatt.prototype.skaliert = function (k) { const m = this; return {
  form(mk, f, o = {}) { const q = { ...o }; if (o.rund !== undefined) q.rund = o.rund * k; if (o.korn) q.korn = o.korn; if (o.muster) q.muster = (x, y) => o.muster(x / k, y / k); const skal = (x, y) => mk(x / k, y / k); if (mk.mass) skal.mass = mk.mass.map(a => a * k); m.form(skal, f, q); return this; },
  punkt(x, y, f, o) { m.punkt(x * k, y * k, f, o); return this; }, linie(p, f, o) { m.linie(p.map(([a, b]) => [a * k, b * k]), f, o); return this; } }; };
const falten = (x, y) => Math.sin(x * .8 + y * .06) * .13 + (hash(x, 3) > .85 ? -.08 : 0);
const GANG = { fussHinten: [2, -3, -4, -1, 0], fuss: [2, 0, -4, -3, 0], hand: [-3, 0, 3, 0, 0], hub: [1, 0, 1, 0, 0], kipp: [1, 0, -1, 0, 0] };
const gegenPhase = p => p === 4 ? 4 : (p + 2) % 4;
// Seitlicher Gang je Bein: Fuß vor, Durchgang, Fuß zurück, Durchgang mit gebeugtem Knie
const BEIN = [{ x: 11, y: 0, knie: 2 }, { x: 1, y: 0, knie: 1 }, { x: -11, y: -1, knie: 2 }, { x: -2, y: -6, knie: 7 }, { x: 5, y: 0, knie: 1 }, { x: -5, y: 0, knie: 1 }];
const schrammen = (m, liste) => liste.forEach(([x, y, d, h]) => m.linie([[x, y], [x + d, y + (h === undefined ? 2 : h)]], 'stahlAlt', { hell: .3 }));
const glatt = { funkeln: .012 };
function platte(m, x, y, s, hell = 0) {
  m.form(M.poly([[x - s, y + 2], [x + s * 10, y + 4], [x + s * 11, y + 11], [x - s, y + 10]]), 'stahlAlt', { rund: 3, hell: hell - .03, ...glatt });
  m.form(M.poly([[x - s * 3, y - 3], [x + s * 7, y - 2], [x + s * 11, y + 4], [x - s * 2, y + 6]]), 'stahlAlt', { rund: 3, hell: hell + .04, ...glatt });
  m.linie([[x - s * 2, y - 2], [x + s * 7, y - 1]], 'stahlAlt', { hell: .55 }); m.punkt(x + s * 3, y + 2, 'metall', { hell: .4 });
}
function beinVorne(m, hx, hy, fx, fy, hose, schiene) {
  const kx = (hx + fx) / 2, ky = (hy + fy) / 2;
  m.form(M.kap(hx, hy, kx, ky, 6.6), hose, { rund: 4 });
  m.form(M.kap(kx, ky + 1, fx, fy - 5, 4.8), schiene, { rund: 3, ...glatt }); m.linie([[kx - 1, ky + 4], [fx - 1, fy - 7]], schiene, { hell: .24 });
  m.form(M.ell(kx, ky, 5.4, 4.6), schiene, { rund: 3, hell: .05, ...glatt }); m.linie([[kx - 3, ky - 3], [kx + 3, ky - 3]], schiene, { hell: .5 });
}
// ---------- Held: gerades Mittelmaß an Größe, breite Brust, Blechkragen und Sicherheitsgurt aus der alten Welt ----------
function heldVorne(p) {
  const m = new Blatt(84, 116), b = GANG.hub[p], k = GANG.kipp[p], c = 42, fL = GANG.fuss[p], fR = GANG.fuss[gegenPhase(p)], hL = GANG.hand[gegenPhase(p)], hR = GANG.hand[p];
  m.form(M.poly([[27, 28 + b], [57, 28 + b], [63, 62], [62, 96], [55, 100], [47, 97], [38, 101], [28, 98], [21, 100], [21, 62]]), 'mantel', { rund: 3, muster: falten, hell: -.06 });
  beinVorne(m, 36, 60 + b, 33, 110 + fL, 'hose', 'stahlAlt'); m.form(M.ell(33, 109 + fL, 6, 4), 'stahlAlt', { rund: 2.4, hell: .02, ...glatt }); m.linie([[30, 107 + fL], [35, 107 + fL]], 'stahlAlt', { hell: .5 });
  beinVorne(m, 48, 60 + b, 51, 110 + fR, 'hose', 'stahlAlt'); m.form(M.ell(51, 109 + fR, 6, 4), 'stahlAlt', { rund: 2.4, hell: .02, ...glatt }); m.linie([[48, 107 + fR], [53, 107 + fR]], 'stahlAlt', { hell: .5 });
  // Zwei Waffenrockbahnen mit Schlitz
  m.form(M.poly([[32, 56 + b], [52, 56 + b], [53, 82 + b], [48, 79 + b], [44, 84 + b], [40, 80 + b], [36, 84 + b], [31, 81 + b]]), 'wein', { rund: 2, muster: falten, rau: .15 }); m.linie([[42, 72 + b], [42, 82 + b]], 'wein', { hell: -.4 });
  // Arm mit freier Hand (rechts im Bild)
  m.form(M.kap(58, 37 + b - k, 60, 48 + b - k, 4.2), 'hose', { rund: 3, hell: -.05 }); m.form(M.kap(60, 48 + b - k, 60, 60 + b + hR, 4.8), 'stahlAlt', { rund: 2.6, ...glatt }); m.form(M.ell(60, 49 + b - k, 4.6, 3.8), 'stahlAlt', { rund: 2, hell: .08 }); m.form(M.ell(60, 64 + b + hR, 4.4, 5), 'stahlAlt', { rund: 2.4, hell: -.03 }); m.linie([[58, 67 + b + hR], [62, 67 + b + hR]], 'stahlAlt', { hell: -.4 });
  // Rumpf aus Brustplatte und Bauchreifen
  m.form(M.poly([[29, 32 + b], [55, 32 + b - k], [54, 46 + b], [50, 56 + b], [34, 56 + b], [30, 46 + b]]), 'hose', { rund: 2, hell: -.1 });
  m.form(M.poly([[28, 30 + b + k], [56, 30 + b - k], [54, 44 + b], [48, 49 + b], [36, 49 + b], [30, 44 + b]]), 'stahlAlt', { rund: 4, ...glatt });
  m.form(M.poly([[33, 48 + b], [51, 48 + b], [50, 53 + b], [34, 53 + b]]), 'stahlAlt', { rund: 2, hell: -.03, ...glatt }); m.linie([[33, 48 + b], [51, 48 + b]], 'stahlAlt', { hell: .4 }); m.form(M.poly([[34, 53 + b], [50, 53 + b], [49, 58 + b], [35, 58 + b]]), 'stahlAlt', { rund: 2, hell: -.07, ...glatt }); m.linie([[34, 53 + b], [50, 53 + b]], 'stahlAlt', { hell: .3 });
  m.linie([[42, 33 + b], [42, 47 + b]], 'stahlAlt', { hell: .36 }); schrammen(m, [[33, 37 + b, 4, 3], [47, 35 + b, 3, 4], [46, 43 + b, -4, 2]]);
  // Gurt schräg über die Brust, aus einem alten Sicherheitsgurt
  m.form(M.kap(31, 33 + b, 52, 56 + b, 1.6), 'gurt', { rund: 1 }); m.form(M.box(38, 42 + b, 6, 4), 'metall', { rund: 1, hell: .14 }); m.form(M.box(32, 57 + b, 20, 4), 'gurt', { rund: 1 }); m.form(M.box(39, 56 + b, 6, 6), 'metall', { rund: 1, hell: .1 });
  // Schwertarm (links im Bild): gebeugt, die Hand umschließt den Griff, die Klinge steht schräg nach oben
  const gx = 25, gy = 56 + b + hL * .4;
  m.form(M.kap(26, 37 + b + k, 20, 49 + b + k, 4.2), 'hose', { rund: 3, hell: -.03 });
  m.form(M.kap(20, 50 + b + k, gx, gy, 4.6), 'stahlAlt', { rund: 2.6, ...glatt }); m.form(M.ell(20, 50 + b + k, 4.6, 3.8), 'stahlAlt', { rund: 2, hell: .08 });
  platte(m, 26, 29 + b + k + 1, -1, 0); platte(m, 58, 29 + b - k, 1, -.03);
  m.form(M.kap(gx - 1, gy - 5, gx - 13, gy - 48, 1.9), 'stahlAlt', { rund: 1, hell: .14, kante: false }); m.linie([[gx - 2, gy - 8], [gx - 12.4, gy - 45]], 'stahlAlt', { hell: .55 });
  m.form(M.kap(gx - 7, gy - 6.6, gx + 5, gy - 3.4, 1.6), 'metall', { rund: 1, hell: .08 }); m.form(M.kap(gx - .5, gy - 4, gx + 1.2, gy + 6, 1.5), 'rindsleder', { rund: 1 }); m.form(M.ell(gx + 1.6, gy + 8, 2, 2), 'metall', { rund: 1.4, hell: .08 });
  m.form(M.ell(gx, gy, 4.6, 4.4), 'stahlAlt', { rund: 2.4, hell: -.02 }); m.linie([[gx - 3, gy + 1], [gx + 3, gy + 1]], 'stahlAlt', { hell: -.42 });
  // Blechkragen und Helm, leicht gesenkt
  m.form(M.poly([[35, 25 + b], [49, 25 + b], [52, 30 + b], [32, 30 + b]]), 'metall', { rund: 2, hell: .03 }); for (const x of [36, 42, 48]) m.punkt(x, 28 + b, 'stahlAlt', { hell: .5 });
  m.form(M.ell(42, 16 + b, 6.6, 8), 'stahlAlt', { rund: 5, ...glatt });
  m.form(M.poly([[36, 13 + b], [48, 13 + b], [47.5, 21 + b], [42, 25 + b], [36.5, 21 + b]]), 'stahlAlt', { rund: 2.4, hell: -.03, ...glatt });
  m.form(M.box(37, 15 + b, 10, 1.6), 'russ', { rund: 0, hell: -.6, kante: false }); m.linie([[42, 8 + b], [42, 14 + b]], 'stahlAlt', { hell: .45 }); m.linie([[42, 17 + b], [42, 24 + b]], 'stahlAlt', { hell: .25 });
  for (let i = 0; i < 3; i++) { m.punkt(38.5, 18.6 + i * 1.8 + b, 'russ', { hell: -.5 }); m.punkt(45.5, 18.6 + i * 1.8 + b, 'russ', { hell: -.5 }); }
  return m;
}
function heldHinten(p) {
  const m = new Blatt(84, 116), b = GANG.hub[p], k = GANG.kipp[p], fL = GANG.fussHinten[p], fR = GANG.fussHinten[gegenPhase(p)], hL = GANG.hand[p], hR = GANG.hand[gegenPhase(p)], sw = [2, 0, -2, 0, 0][p];
  beinVorne(m, 36, 60 + b, 33, 110 + fL, 'hose', 'stahlAlt'); m.form(M.ell(33, 109 + fL, 5, 4), 'stahlAlt', { rund: 2.4, hell: -.03, ...glatt });
  beinVorne(m, 48, 60 + b, 51, 110 + fR, 'hose', 'stahlAlt'); m.form(M.ell(51, 109 + fR, 5, 4), 'stahlAlt', { rund: 2.4, hell: -.03, ...glatt });
  // Von hinten liegt die Schwertseite rechts im Bild: Hand und Griff sind vor dem Körper, zu sehen sind Ellbogen und Klinge
  const gx = 59, gy = 56 + b + hR * .4;
  m.form(M.kap(gx + 1, gy - 5, gx + 13, gy - 48, 1.9), 'stahlAlt', { rund: 1, hell: .1, kante: false }); m.form(M.kap(gx - 5, gy - 3.4, gx + 7, gy - 6.6, 1.6), 'metall', { rund: 1 });
  m.form(M.kap(58, 37 + b - k, 64, 49 + b - k, 4.2), 'hose', { rund: 3 }); m.form(M.ell(64, 50 + b - k, 4.6, 3.8), 'stahlAlt', { rund: 2, hell: .06 }); m.form(M.kap(64, 50 + b - k, gx, gy, 4.6), 'stahlAlt', { rund: 2.6, ...glatt });
  m.form(M.kap(26, 37 + b + k, 24, 48 + b + k, 4.2), 'hose', { rund: 3 }); m.form(M.kap(24, 48 + b + k, 24, 60 + b + hL, 4.8), 'stahlAlt', { rund: 2.6, ...glatt }); m.form(M.ell(24, 64 + b + hL, 4.4, 5), 'stahlAlt', { rund: 2.4 });
  // Umhang mit gerissenem Saum, Flicken und unregelmäßigen Falten
  const saum = [[62 + sw, 96], [57 + sw, 99], [52 + sw, 94], [47 + sw, 102], [40 + sw, 97], [33 + sw, 103], [28 + sw, 95], [22 + sw, 100]];
  m.form(M.poly([[30, 27 + b], [54, 27 + b], [60, 64], ...saum, [22, 64]]), 'mantel', { rund: 2, muster: (x, y) => Math.sin(x * .55 + Math.sin(y * .05) * 2) * .13 + Math.sin(x * 1.4 + 2) * .05 });
  for (const q of [[[35, 36], [31 + sw, 94]], [[47, 36], [52 + sw, 92]], [[41, 40], [42 + sw, 96]]]) m.linie([[q[0][0], q[0][1] + b], q[1]], 'mantel', { hell: -.24 });
  m.form(M.poly([[46, 62], [55, 61], [56, 72], [47, 73]]), 'leinen', { rund: 1, hell: -.32, rau: .2, korn: 2 }); for (const [x, y] of [[46, 64], [46, 70], [56, 63], [56, 70]]) m.punkt(x, y, 'mantel', { hell: .4 });
  m.linie([[33, 74], [36, 90]], 'russ', { hell: -.5 });
  platte(m, 26, 30 + b + k, -1, 0); platte(m, 58, 30 + b - k, 1, -.03);
  m.form(M.ell(42, 28 + b, 10.4, 4), 'mantel', { rund: 3, hell: .08, rau: .15 });
  m.form(M.ell(42, 16 + b, 6.6, 8), 'stahlAlt', { rund: 5, ...glatt }); m.linie([[42, 8 + b], [42, 23 + b]], 'stahlAlt', { hell: .32 }); m.linie([[36, 19.5 + b], [48, 19.5 + b]], 'stahlAlt', { hell: -.34 });
  return m;
}
function heldSeite(p) {
  const m = new Blatt(84, 116), b = GANG.hub[p], hx = 36, sw = [2, 0, -2, 0, 0][p], N = BEIN[p], F = BEIN[p === 4 ? 5 : (p + 2) % 4], arm = [-4, 0, 4, 0, 0][p];
  m.form(M.kap(hx, 37 + b, hx - arm * .5, 48 + b, 3.8), 'hose', { rund: 3, hell: -.18 }); m.form(M.kap(hx - arm * .5, 48 + b, hx - arm, 60 + b, 4), 'stahlAlt', { rund: 2.4, hell: -.16 }); m.form(M.ell(hx - arm, 63 + b, 3.8, 4.4), 'stahlAlt', { rund: 2, hell: -.16 });
  const bs = (B, hell) => { const fx = hx + B.x, fy = 110 + B.y; m.form(M.kap(hx, 60 + b, (hx + fx) / 2 + B.knie, 84 + b + B.y * .5, 6.2), 'hose', { rund: 4, hell }); m.form(M.kap((hx + fx) / 2 + B.knie, 84 + b + B.y * .5, fx, fy - 5, 4.6), 'stahlAlt', { rund: 2.6, hell, ...glatt }); m.form(M.ell((hx + fx) / 2 + B.knie + 1, 84 + b + B.y * .5, 4.6, 4.2), 'stahlAlt', { rund: 2.4, hell: hell + .05 }); m.form(M.oder(M.ell(fx + 2.2, fy - 1.6, 6.4, 2.8), M.box(fx - 3, fy - 6, 7, 5)), 'stahlAlt', { rund: 2, hell, ...glatt }); };
  bs(F, -.2);
  m.form(M.poly([[32, 28 + b], [24, 46], [14 - sw, 94], [20 - sw, 100], [27 - sw, 95], [33, 99], [42, 72], [42, 28 + b]]), 'mantel', { rund: 3, muster: falten });
  bs(N, 0);
  m.form(M.poly([[33, 56 + b], [45, 56 + b], [48, 80 + b], [44, 83 + b], [40, 79 + b], [35, 84 + b]]), 'wein', { rund: 2, muster: falten, rau: .15 });
  m.form(M.poly([[31, 31 + b], [45, 30 + b], [48, 44 + b], [45, 58 + b], [33, 58 + b], [30, 44 + b]]), 'stahlAlt', { rund: 4, ...glatt }); m.linie([[31, 47 + b], [47, 47 + b]], 'stahlAlt', { hell: .32 }); m.linie([[31, 52 + b], [46, 52 + b]], 'stahlAlt', { hell: .22 }); schrammen(m, [[36, 36 + b, 4, 3], [41, 41 + b, 3, 3]]);
  m.form(M.box(31, 57 + b, 15, 4), 'gurt', { rund: 1 }); m.form(M.kap(44, 32 + b, 33, 56 + b, 1.5), 'gurt', { rund: 1 });
  // Schwert in der nahen, rechten Hand: gebeugter Arm, Klinge schräg nach vorn oben
  const hd = hx + 10 + arm * .3, hy = 57 + b;
  m.form(M.kap(hd + 2, hy - 5, hd + 20, hy - 46, 1.9), 'stahlAlt', { rund: 1, hell: .14, kante: false }); m.linie([[hd + 3, hy - 8], [hd + 19, hy - 43]], 'stahlAlt', { hell: .55 });
  m.form(M.kap(hd - 4, hy - 7, hd + 8, hy - 2, 1.6), 'metall', { rund: 1, hell: .08 }); m.form(M.kap(hd + 1, hy - 3, hd - 1.4, hy + 6, 1.5), 'rindsleder', { rund: 1 }); m.form(M.ell(hd - 2, hy + 8, 2, 2), 'metall', { rund: 1.4, hell: .08 });
  m.form(M.kap(hx + 1, 37 + b, hx + 2 + arm * .3, 50 + b, 4.2), 'hose', { rund: 3 }); m.form(M.ell(hx + 2 + arm * .3, 50 + b, 4.6, 3.8), 'stahlAlt', { rund: 2, hell: .08 }); m.form(M.kap(hx + 2 + arm * .3, 50 + b, hd, hy, 4.6), 'stahlAlt', { rund: 2.6, ...glatt }); m.form(M.ell(hd, hy, 4.6, 4.4), 'stahlAlt', { rund: 2.4 });
  platte(m, hx - 2, 30 + b, 1, .02);
  m.form(M.poly([[32, 25 + b], [45, 25 + b], [47, 30 + b], [31, 30 + b]]), 'metall', { rund: 2, hell: .03 });
  m.form(M.ell(38, 16 + b, 6.4, 8), 'stahlAlt', { rund: 5, ...glatt });
  m.form(M.poly([[38, 12 + b], [46, 15 + b], [45.5, 21 + b], [39, 25 + b]]), 'stahlAlt', { rund: 2.4, hell: -.02, ...glatt });
  m.linie([[39, 15.6 + b], [45.5, 16.6 + b]], 'russ', { hell: -.6 }); m.linie([[32.5, 19 + b], [39, 21 + b]], 'stahlAlt', { hell: -.34 }); m.punkt(43, 19.5 + b, 'russ', { hell: -.5 }); m.punkt(43, 21.5 + b, 'russ', { hell: -.5 });
  return m;
}
// ---------- Schildträger: schwer und breit, die Tür deckt die Körperhälfte ----------
function autotuer(m, x, y, w, h, o = {}) {
  const f = M.poly([[x, y + 4], [x + w * .9, y], [x + w, y + 7], [x + w, y + h - 6], [x + w - 5, y + h], [x + 4, y + h], [x, y + h - 6]]);
  const randNah = (a, b) => Math.min(a - x, x + w - a, b - y, y + h - b);
  if (o.innen) {
    m.form(f, 'metall', { rund: 2, hell: -.12, rau: .15, korn: 4 }); m.form(M.poly([[x + 4, y + h * .4], [x + w - 4, y + h * .4], [x + w - 4, y + h - 6], [x + 4, y + h - 6]]), 'lumpen', { rund: 2, rau: .3, korn: 3, hell: -.1 });
    m.form(M.ell(x + w * .3, y + h * .55, 3, 3), 'metall', { rund: 2, hell: .1 }); m.form(M.box(x + w * .6, y + h * .5, 8, 3), 'metall', { rund: 1 });
    m.form(M.box(x - 1, y + h * .34, w + 2, 3), 'rindsleder', { rund: 1 }); m.form(M.box(x - 1, y + h * .72, w + 2, 3), 'rindsleder', { rund: 1 });
    return;
  }
  m.form(f, 'lack', { rund: 3, rau: .06, korn: 6, hell: -.02, funkeln: .02 });
  m.form((a, b) => f(a, b) && y + h - b < 3 + fbm(a / 5, 2) * 7 && fbm(a / 5 + 3, b / 4) > .4, 'rost', { rund: 1, rau: .4, korn: 2, kante: false, hell: -.14 });
  m.form(M.poly([[x + 4, y + 7], [x + w - 4, y + 4], [x + w - 3, y + h * .36], [x + 4, y + h * .38]]), 'glas', { rund: 1, hell: -.42, funkeln: .01 });
  m.linie([[x + 8, y + 7], [x + w * .5, y + h * .36]], 'glas', { hell: .25 }); m.linie([[x + w * .5, y + h * .2], [x + w - 5, y + 7]], 'glas', { hell: .25 });
  m.linie([[x, y + h * .46], [x + w, y + h * .45]], 'lack', { hell: -.4 }); m.form(M.box(x + w - 12, y + h * .5, 9, 3), 'metall', { rund: 1 });
  for (const [a, c] of [[.15, .68], [.8, .72]]) m.punkt(x + w * a, y + h * c, 'stein', { hell: .15 });
}
function radkappe(m, x, y) { m.form(M.ell(x, y, 8.6, 6.8), 'wellblech', { rund: 2.4, hell: -.06, rau: .2, korn: 3 }); m.form(M.ell(x, y, 3.4, 2.6), 'wellblech', { rund: 1.4, hell: .06 }); for (const [a, c] of [[-6, -2], [6, -2], [0, 4.5]]) m.punkt(x + a, y + c, 'stahlAlt', { hell: .4 }); }
function keule(m, x, y, xE, yE, hell = 0) {
  const dx = xE - x, dy = yE - y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  m.form(M.kap(x - ux * 7, y - uy * 7, xE, yE, 2.8), 'holz', { rund: 2, muster: maserung, hell: hell - .2 });
  m.form(M.kap(xE, yE, xE + ux * 8, yE + uy * 8, 5.4), 'holz', { rund: 4, muster: maserung, rau: .3, hell: hell - .14 });
  for (const [t, s] of [[0, -1], [0, 1], [4, -1], [4, 1], [8, -1], [8, 1]]) { const px = xE + ux * t, py = yE + uy * t; m.linie([[px - uy * s * 4.6, py + ux * s * 4.6], [px - uy * s * 7, py + ux * s * 7]], 'metall', { hell: hell + .1 }); }
}
function schildBein(m, x, fy, b) { m.form(M.kap(x, 66 + b, x, 88, 7.2), 'leinen', { rund: 4, rau: .2, korn: 3, hell: -.05 }); m.form(M.kap(x, 88, x, fy - 7, 6), 'leinen', { rund: 3, rau: .2, korn: 3, hell: -.1 }); m.form(M.oder(M.ell(x, fy - 1, 7.6, 4.4), M.box(x - 6, fy - 12, 12, 11)), 'rindsleder', { rund: 2.4 }); m.linie([[x - 6, fy - 12], [x + 6, fy - 12]], 'rindsleder', { hell: .3 }); }
function schildVorne(p) {
  const m = new Blatt(96, 116), b = GANG.hub[p], fL = GANG.fuss[p], fR = GANG.fuss[(p + 2) % 4], h = GANG.hand[(p + 2) % 4];
  m.form(M.poly([[32, 34 + b], [64, 34 + b], [68, 62], [66, 82], [60, 84], [54, 80], [46, 85], [38, 80], [30, 84], [28, 62]]), 'rindsleder', { rund: 3, muster: falten, hell: -.14 });
  schildBein(m, 37, 110 + fL, b); schildBein(m, 60, 110 + fR, b);
  // Rumpf: breite Brust, zur Hüfte schmaler
  m.form(M.poly([[26, 32 + b], [70, 32 + b], [66, 50 + b], [61, 70 + b], [64, 84 + b], [58, 80 + b], [50, 86 + b], [42, 80 + b], [33, 85 + b], [35, 70 + b], [30, 50 + b]]), 'rindsleder', { rund: 5, rau: .28, korn: 3, muster: falten });
  m.form(M.box(34, 62 + b, 28, 5), 'gurt', { rund: 1.5 }); m.form(M.box(45, 61 + b, 6, 7), 'metall', { rund: 1, hell: .08 });
  m.linie([[34, 36 + b], [62, 62 + b]], 'gurt', { hell: .2 }); for (let i = 0; i < 6; i++) m.punkt(39 + i * 4.2, 40 + i * 3.8 + b, 'metall', { hell: .2 });
  // Keule tief in der freien Hand
  const kh = 46 + b - h * .4;
  keule(m, 78, kh + 2, 85, kh - 26);
  m.form(M.kap(72, 40 + b, 82, 56 + b, 6), 'rindsleder', { rund: 3, rau: .2 }); m.form(M.kap(82, 56 + b, 78, kh + 2, 5), 'leinen', { rund: 3, hell: -.05 }); m.form(M.ell(78, kh, 5.4, 5), 'rindsleder', { rund: 3 });
  radkappe(m, 72, 36 + b); radkappe(m, 25, 38 + b);
  // Kopf: Kapuze, Brille, Tuch dicht unter dem Brillenband
  m.form(M.oder(M.ell(48, 18 + b, 10, 11), M.poly([[38, 24 + b], [58, 24 + b], [62, 34 + b], [34, 34 + b]])), 'lumpen', { rund: 5, rau: .4, korn: 3 });
  m.form(M.ell(48, 19 + b, 6.6, 8), 'russ', { rund: 2, hell: -.2, kante: false });
  m.form(M.poly([[41.6, 19.8 + b], [54.4, 19.8 + b], [55, 30 + b], [48, 33 + b], [41, 30 + b]]), 'lumpen', { rund: 2, rau: .3, korn: 2, hell: -.26 }); m.linie([[48, 21 + b], [48, 25 + b]], 'lumpen', { hell: -.04 });
  m.form(M.box(40.6, 14.8 + b, 14.8, 4), 'rindsleder', { rund: 1, kante: false, hell: -.1 }); m.form(M.ell(44.6, 16.8 + b, 2.3, 2), 'glas', { rund: 1, hell: -.34 }); m.form(M.ell(51.4, 16.8 + b, 2.3, 2), 'glas', { rund: 1, hell: -.34 }); m.punkt(44, 16 + b, 'glas', { hell: .4 }); m.punkt(50.8, 16 + b, 'glas', { hell: .4 });
  // Die Tür sitzt hoch am Unterarm, ihre Oberkante reicht bis zur Schulter. Die Hand greift von hinten um die Kante.
  const ty = 28 + b + h * .2;
  autotuer(m, 10, ty, 34, 58);
  m.form(M.ell(44, ty + 26, 3.2, 4.4), 'rindsleder', { rund: 2 }); for (let i = 0; i < 3; i++) m.punkt(43.6, ty + 23.4 + i * 2.2, 'leinen', { hell: .2 });
  return m;
}
function schildHinten(p) {
  const m = new Blatt(96, 116), b = GANG.hub[p], fL = GANG.fussHinten[p], fR = GANG.fussHinten[(p + 2) % 4], h = GANG.hand[(p + 2) % 4];
  autotuer(m, 52, 28 + b + h * .2, 34, 58, { innen: true });
  schildBein(m, 37, 110 + fL, b); schildBein(m, 60, 110 + fR, b);
  // Von hinten: Keule links im Bild, Tür rechts, man sieht ihre Innenseite
  const kh = 46 + b - h * .4;
  keule(m, 18, kh + 2, 11, kh - 26);
  m.form(M.kap(24, 40 + b, 14, 56 + b, 6), 'rindsleder', { rund: 3, rau: .2 }); m.form(M.kap(14, 56 + b, 18, kh + 2, 5), 'leinen', { rund: 3, hell: -.05 }); m.form(M.ell(18, kh, 5.4, 5), 'rindsleder', { rund: 3 });
  m.form(M.poly([[26, 32 + b], [70, 32 + b], [68, 62 + b], [66, 84 + b], [58, 81 + b], [50, 87 + b], [42, 81 + b], [33, 86 + b], [30, 62 + b]]), 'rindsleder', { rund: 5, rau: .28, korn: 3, muster: falten });
  m.form(M.box(32, 62 + b, 34, 5), 'gurt', { rund: 1.5 }); m.form(M.poly([[42, 40 + b], [58, 40 + b], [59, 56 + b], [41, 57 + b]]), 'leinen', { rund: 2, rau: .3, korn: 2, hell: -.14 }); for (const y of [43, 53]) { m.punkt(44, y + b, 'russ'); m.punkt(56, y + b, 'russ'); }
  m.form(M.kap(64, 36 + b, 36, 62 + b, 1.5), 'gurt', { rund: 1, hell: .06 });
  // Der Arm geht nach vorn, von hinten sieht man nur den Oberarm bis zum Ellbogen
  m.form(M.kap(70, 40 + b, 70, 53 + b, 5.6), 'rindsleder', { rund: 3 });
  radkappe(m, 25, 36 + b); radkappe(m, 71, 38 + b);
  m.form(M.oder(M.ell(48, 18 + b, 10, 11), M.poly([[38, 24 + b], [58, 24 + b], [62, 34 + b], [34, 34 + b]])), 'lumpen', { rund: 5, rau: .4, korn: 3 }); m.linie([[48, 8 + b], [48, 33 + b]], 'lumpen', { hell: -.22 }); m.form(M.box(38.4, 15 + b, 19.2, 3), 'rindsleder', { rund: 1, hell: -.1 });
  return m;
}
function schildSeite(p) {
  const m = new Blatt(96, 116), b = GANG.hub[p], hx = 42, N = BEIN[p], F = BEIN[(p + 2) % 4], arm = [-3, 0, 3, 0][p];
  // Ferner Arm: Keule erhoben hinter dem Kopf
  const kx = hx - 11 - arm * .4, kh = 46 + b;
  keule(m, kx, kh + 2, kx - 8, kh - 25, -.14);
  m.form(M.kap(hx - 4, 40 + b, hx - 14, 56 + b, 5.4), 'rindsleder', { rund: 3, hell: -.18 }); m.form(M.kap(hx - 14, 56 + b, kx, kh + 2, 4.4), 'leinen', { rund: 3, hell: -.2 }); m.form(M.ell(kx, kh, 5, 5), 'rindsleder', { rund: 3, hell: -.18 });
  const bs = (B, hell) => { const fx = hx + B.x, fy = 110 + B.y; m.form(M.kap(hx, 66 + b, (hx + fx) / 2 + B.knie, 88 + B.y * .5, 7), 'leinen', { rund: 4, rau: .2, korn: 3, hell }); m.form(M.kap((hx + fx) / 2 + B.knie, 88 + B.y * .5, fx, fy - 7, 5.6), 'leinen', { rund: 3, rau: .2, korn: 3, hell: hell - .04 }); m.form(M.oder(M.ell(fx + 2.5, fy - 2, 7.6, 3.4), M.box(fx - 5, fy - 11, 10, 9)), 'rindsleder', { rund: 2.4, hell }); };
  bs(F, -.2); bs(N, 0);
  m.form(M.poly([[32, 32 + b], [54, 32 + b], [58, 50 + b], [55, 72 + b], [54, 84 + b], [46, 80 + b], [38, 88 + b], [31, 82 + b], [26, 90 + b], [28, 50 + b]]), 'rindsleder', { rund: 5, rau: .28, korn: 3, muster: falten });
  m.form(M.box(30, 62 + b, 26, 5), 'gurt', { rund: 1.5 }); m.form(M.poly([[28, 40 + b], [37, 40 + b], [38, 58 + b], [27, 58 + b]]), 'leinen', { rund: 2, rau: .3, korn: 2, hell: -.14 });
  // Kopf im Profil: Nase unter dem Tuch, Band führt nach hinten
  m.form(M.oder(M.ell(43, 18 + b, 9.4, 11), M.poly([[35, 24 + b], [53, 24 + b], [55, 34 + b], [32, 34 + b]])), 'lumpen', { rund: 5, rau: .4, korn: 3 });
  m.form(M.ell(48, 19 + b, 4.8, 7.4), 'russ', { rund: 2, hell: -.2, kante: false });
  m.form(M.poly([[46, 19.8 + b], [51, 19.8 + b], [53.6, 23 + b], [52.4, 29 + b], [48, 33 + b], [44, 32 + b]]), 'lumpen', { rund: 2, rau: .3, korn: 2, hell: -.26 });
  m.linie([[35, 15 + b], [50, 16 + b]], 'rindsleder', { hell: -.1 }); m.linie([[35, 16 + b], [50, 17 + b]], 'rindsleder', { hell: -.24 }); m.form(M.ell(50, 16.6 + b, 2.5, 2.1), 'glas', { rund: 1, hell: -.34 }); m.punkt(49.6, 16 + b, 'glas', { hell: .4 });
  // Tür von der Seite: leicht gedreht, oben ein Streifen Scheibe
  const tx = 58 + arm * .3, ty = 28 + b;
  m.form(M.kap(46, 42 + b, 50, 56 + b, 5.6), 'rindsleder', { rund: 3 }); m.form(M.kap(50, 56 + b, tx + 2, 49 + b, 4.6), 'leinen', { rund: 3, hell: -.05 });
  const t = M.poly([[tx, ty + 3], [tx + 14, ty], [tx + 16, ty + 54], [tx + 12, ty + 58], [tx + 2, ty + 58]]);
  m.form(t, 'lack', { rund: 2, rau: .15, korn: 3 }); m.form((a, c) => t(a, c) && ty + 58 - c < 3 + fbm(a / 3, 2) * 7 && fbm(a / 3, c / 4) > .4, 'rost', { rund: 0, rau: .4, korn: 2, kante: false, hell: -.14 });
  m.form(M.poly([[tx + 2, ty + 6], [tx + 13, ty + 3], [tx + 13.6, ty + 20], [tx + 2, ty + 22]]), 'glas', { rund: 1, hell: -.42, funkeln: .01 }); m.linie([[tx + 3, ty + 8], [tx + 10, ty + 20]], 'glas', { hell: .25 });
  radkappe(m, 42, 36 + b);
  m.form(M.ell(tx + 1, 48 + b, 4.8, 4.6), 'rindsleder', { rund: 3 });
  return m;
}
// ---------- Wolf: Beide Augen sind zu sehen, vier Beine in jeder Ansicht ----------
const adernFarbe = { leuchtet: true, hell: -.22 };
function wolfSeite(p) {
  const m = new Blatt(120, 78), Y = 75, nick = [1, 0, 1, 0][p], hub = [1, 0, 1, 0][p], rute = [2, 0, -2, 0][p];
  const SP = [{ x: 7, y: 0 }, { x: 1, y: -4 }, { x: -7, y: 0 }, { x: -1, y: 0 }];
  m.form(M.oder(M.kap(101, 30 + hub, 111, 35 + rute, 3.4), M.kap(111, 35 + rute, 116, 47 + rute, 2.2)), 'fell', { rund: 2.4, rau: .5, korn: 2.5, muster: felle, hell: -.05 });
  const vorne = (x, q, f, hell) => { const c = SP[q]; const fx = x + c.x, fy = Y + c.y; m.form(M.kap(x, 42 + hub, x + c.x * .5, 58 + hub * .5, 5.4), f, { rund: 4, muster: felle, hell }); m.form(M.kap(x + c.x * .5, 58 + hub * .5, fx, fy - 3, 3.7), f, { rund: 2.6, muster: felle, hell }); m.form(M.ell(fx - 2, fy - 1.8, 5, 2.4), f, { rund: 1.6, hell }); };
  const hinten = (x, q, f, hell) => { const c = SP[q], fx = x + c.x, fy = Y + c.y, sx = x + 2 + c.x * .6, sy = 59 + hub * .5; m.form(M.kap(x, 38 + hub, x + 3 + c.x * .3, 50 + hub, 7), f, { rund: 5, muster: felle, hell }); m.form(M.kap(x + 3 + c.x * .3, 50 + hub, sx, sy, 4.6), f, { rund: 3, muster: felle, hell }); m.form(M.kap(sx, sy, fx, fy - 3, 3.6), f, { rund: 2.4, muster: felle, hell }); m.form(M.ell(fx - 2, fy - 1.8, 5, 2.4), f, { rund: 1.6, hell }); };
  vorne(44, (p + 2) % 4, 'fellDkl', 0); hinten(88, p, 'fellDkl', 0);
  m.form(M.oder(M.ell(68, 36 + hub, 31, 13), M.ell(46, 34 + hub, 16, 15), M.ell(90, 35 + hub, 13, 13)), 'fell', { rund: 8, rau: .55, korn: 2.5, muster: felle });
  for (const [x, y, g] of [[34, 21, 3], [40, 19, 4], [46, 20, 3], [52, 22, 2]]) m.form(M.poly([[x - 3, y + 5 + hub], [x + 1, y - g + hub], [x + 3, y + 5 + hub]]), 'fell', { rund: 1, hell: .06, kante: false });
  vorne(50, p, 'fell', .04); hinten(82, (p + 2) % 4, 'fell', .03);
  // Mähne geht in den Rumpf über, der Kopf ist zum Betrachter gedreht
  const kY = nick + hub;
  m.form(M.oder(M.ell(33, 33 + kY, 11, 11), M.poly([[24, 40 + kY], [22, 48 + kY], [29, 45 + kY], [34, 50 + kY], [38, 44 + kY], [44, 42 + kY]])), 'fell', { rund: 6, rau: .55, korn: 2.5, hell: .02, muster: felle });
  m.form(M.poly([[17, 26 + kY], [15, 13 + kY], [24, 22 + kY]]), 'fell', { rund: 1.6, hell: .04 }); m.form(M.poly([[27, 24 + kY], [29, 11 + kY], [34, 25 + kY]]), 'fellDkl', { rund: 1.6, hell: .1 }); m.form(M.poly([[18, 23 + kY], [17, 17 + kY], [22, 22 + kY]]), 'rotDkl', { rund: 1, hell: -.24, kante: false });
  m.form(M.ell(20, 33 + kY, 10.4, 8.8), 'fell', { rund: 6, muster: felle, hell: .07 });
  m.form(M.poly([[16, 33 + kY], [6, 40 + kY], [7, 45 + kY], [21, 45 + kY], [24, 40 + kY]]), 'fell', { rund: 2.6, muster: felle, hell: .1 });
  m.linie([[17, 29 + kY], [9, 40 + kY]], 'fell', { hell: .34 });
  m.form(M.poly([[8, 45 + kY], [21, 45 + kY], [18, 50 + kY], [10, 49 + kY]]), 'fellDkl', { rund: 2 }); m.form(M.poly([[9, 44.6 + kY], [20, 44.6 + kY], [18, 47.6 + kY], [10, 47.6 + kY]]), 'rotDkl', { rund: 1, hell: -.24, kante: false });
  for (const [x, y] of [[10, 45], [13, 45], [16, 45], [19, 45], [12, 48], [16, 48]]) m.punkt(x, y + kY, 'putz', { hell: .7 }); m.form(M.ell(7, 40.6 + kY, 2, 1.6), 'russ', { rund: 1, hell: -.4 });
  // Zwei getrennte Augen beiderseits des Nasenrückens, das nahe etwas größer
  m.form(M.ell(21.5, 31 + kY, 2.2, 1.6), 'lazi', { rund: 1, leuchtet: true, kante: false }); m.form(M.ell(13.6, 32.6 + kY, 1.5, 1.2), 'lazi', { rund: 1, leuchtet: true, kante: false });
  m.linie([[18.5, 28 + kY], [24.5, 29.8 + kY]], 'russ', { hell: -.5 }); m.linie([[11.5, 30.8 + kY], [16.5, 31 + kY]], 'russ', { hell: -.5 });
  for (const q of [[[96, 28], [86, 33], [76, 30], [66, 36], [54, 31], [44, 37], [36, 34]], [[50, 46], [49, 59]], [[85, 46], [84, 56]]]) m.linie(q.map(([a, c]) => [a, c + hub]), 'lazi', adernFarbe);
  return m.spiegeln();
}
function wolfVorne(p) {
  const m = new Blatt(84, 78), Y = 75, c = 42, hub = GANG.hub[p], fL = GANG.fuss[p], fR = GANG.fuss[(p + 2) % 4], bl = fL > 0 ? 0 : fL, br = fR > 0 ? 0 : fR;
  // Hinterbeine hinter dem Rumpf, gegenläufig
  m.form(M.oder(M.kap(28, 42, 28, Y - 7 + br, 3.4), M.ell(28, Y - 5 + br, 4, 1.9)), 'fellDkl', { rund: 2 }); m.form(M.oder(M.kap(56, 42, 56, Y - 7 + bl, 3.4), M.ell(56, Y - 5 + bl, 4, 1.9)), 'fellDkl', { rund: 2 });
  m.form(M.ell(c, 32 + hub, 17, 13), 'fell', { rund: 7, rau: .5, korn: 2.5, muster: felle, hell: -.1 });
  const bv = (x, f) => { m.form(M.kap(x, 42 + hub, x, 58, 5.4), 'fell', { rund: 4, muster: felle }); m.form(M.kap(x, 58, x, Y - 3 + f, 4), 'fell', { rund: 2.6, muster: felle }); m.form(M.ell(x, Y - 1.6 + f, 5, 2.4), 'fell', { rund: 1.6 }); for (const a of [-3, 0, 3]) m.punkt(x + a, Y - .6 + f, 'stein', { hell: .4 }); };
  bv(34, bl); bv(50, br);
  // Gesenkter Kopf vor der Brust, schmale Schnauze
  m.form(M.poly([[32, 34 + hub], [52, 34 + hub], [50, 56 + hub], [42, 60 + hub], [34, 56 + hub]]), 'fell', { rund: 5, rau: .55, korn: 2.5, muster: felle, hell: .03 });
  m.form(M.poly([[33, 28 + hub], [30, 15 + hub], [38, 24 + hub]]), 'fell', { rund: 1.6 }); m.form(M.poly([[51, 28 + hub], [54, 15 + hub], [46, 24 + hub]]), 'fell', { rund: 1.6 }); m.form(M.poly([[34, 25 + hub], [32, 19 + hub], [37, 24 + hub]]), 'rotDkl', { rund: 1, hell: -.24, kante: false }); m.form(M.poly([[50, 25 + hub], [52, 19 + hub], [47, 24 + hub]]), 'rotDkl', { rund: 1, hell: -.24, kante: false });
  m.form(M.ell(c, 34 + hub, 10.5, 9), 'fell', { rund: 6, muster: felle, hell: .07 });
  m.form(M.poly([[37.6, 36 + hub], [46.4, 36 + hub], [45.4, 47 + hub], [38.6, 47 + hub]]), 'fell', { rund: 2.4, hell: .14, muster: felle }); m.linie([[42, 30 + hub], [42, 42 + hub]], 'fell', { hell: .34 }); m.form(M.ell(c, 42 + hub, 2.4, 1.8), 'russ', { rund: 1.2, hell: -.4 });
  m.form(M.poly([[38, 47 + hub], [46, 47 + hub], [45, 51 + hub], [39, 51 + hub]]), 'rotDkl', { rund: 1, hell: -.24 }); for (const x of [39, 41, 43, 45]) m.punkt(x, 47.6 + hub, 'putz', { hell: .7 }); for (const x of [40.6, 43.6]) m.punkt(x, 50.4 + hub, 'putz', { hell: .7 });
  m.form(M.ell(36.6, 32.6 + hub, 2, 1.5), 'lazi', { rund: 1, leuchtet: true, kante: false }); m.form(M.ell(47.4, 32.6 + hub, 2, 1.5), 'lazi', { rund: 1, leuchtet: true, kante: false });
  m.linie([[33.8, 29.6 + hub], [39.6, 32 + hub]], 'russ', { hell: -.5 }); m.linie([[50.2, 29.6 + hub], [44.4, 32 + hub]], 'russ', { hell: -.5 });
  m.linie([[37, 44 + hub], [38, 54 + hub], [35, 60 + hub], [35, 68]], 'lazi', adernFarbe);
  return m;
}
function wolfHinten(p) {
  const m = new Blatt(84, 78), Y = 75, c = 42, hub = GANG.hub[p], fL = GANG.fuss[p], fR = GANG.fuss[(p + 2) % 4], bl = fL > 0 ? 0 : fL, br = fR > 0 ? 0 : fR, rute = [2, 0, -2, 0][p];
  m.form(M.poly([[35, 19], [33, 7], [40, 16]]), 'fell', { rund: 1.6 }); m.form(M.poly([[49, 19], [51, 7], [44, 16]]), 'fell', { rund: 1.6 }); m.form(M.ell(c, 20 + hub, 9.6, 8), 'fellDkl', { rund: 5, rau: .4, korn: 2.5, hell: .1 });
  // Vorderbeine kurz und dunkel zwischen den Keulen
  m.form(M.oder(M.kap(38, 50, 38, Y - 7 + br, 3.2), M.ell(38, Y - 5 + br, 3.8, 1.7)), 'fellDkl', { rund: 2 }); m.form(M.oder(M.kap(46, 50, 46, Y - 7 + bl, 3.2), M.ell(46, Y - 5 + bl, 3.8, 1.7)), 'fellDkl', { rund: 2 });
  m.form(M.ell(c, 29 + hub, 16, 13), 'fell', { rund: 8, rau: .55, korn: 2.5, muster: felle, hell: -.06 });
  const keulenBein = (x, s, f) => { m.form(M.ell(x, 40 + hub, 8, 12), 'fell', { rund: 7, rau: .55, korn: 2.5, muster: felle }); m.form(M.kap(x + s, 50 + hub, x, 62, 5), 'fell', { rund: 3, muster: felle }); m.form(M.kap(x, 62, x, Y - 3 + f, 3.8), 'fell', { rund: 2.4, muster: felle }); m.form(M.ell(x, Y - 1.6 + f, 5, 2.4), 'fell', { rund: 1.6 }); };
  keulenBein(33, 1, bl); keulenBein(51, -1, br);
  // Rute seitlich versetzt, schmal an der Wurzel
  m.form(M.oder(M.kap(c, 28 + hub, c + 1 + rute, 44 + hub, 3.4), M.kap(c + 1 + rute, 44 + hub, c + 2 + rute * 1.6, 58, 4.8), M.kap(c + 2 + rute * 1.6, 58, c + 1 + rute * 2, 65, 2.2)), 'fell', { rund: 3, rau: .5, korn: 2.5, hell: -.12, muster: felle });
  m.linie([[29, 28 + hub], [30, 38 + hub], [27, 47 + hub], [30, 58]], 'lazi', adernFarbe);
  return m;
}
// ---------- Tanne: unten freier Stamm, oben decken ihn die Zweige ----------
function zeichneTanne(seed = 1) {
  const B = 220, H = 450, m = new Blatt(B, H), k = 1.667, s = m.skaliert(k), cx = 66, R = (i, n) => hash(i * 3.1 + seed, n * 7.7) * 2 - 1;
  const zweig = (y, b, v, hell, ziehen) => { const f = [[cx - v * ziehen, y], [cx + v * b, y + 20], [cx + v * (b - 6), y + 17], [cx + v * (b - 11), y + 24], [cx + v * (b * .55), y + 19], [cx + v * (b * .3), y + 24], [cx - v * ziehen, y + 23]];
    s.form(M.poly(f), 'nadel', { rund: 3.6, hell, rau: .6, korn: 2.2, muster: (x, y2) => { const a = hash(x + seed, y2); return a > .8 ? .2 : a < .2 ? -.2 : 0; } }); };
  for (let i = 10; i >= 1; i--) for (const v of [-1, 1]) zweig(6 + i * 15 + R(i, v) * 2, 7 + i * 4.6 + R(i, v + 3) * 3, v, -.16, 2);
  s.form(M.poly([[cx - 8, 268], [cx + 8, 268], [cx + 5, 170], [cx + 2, 14], [cx - 2, 14], [cx - 5, 170]]), 'holz', { rund: 3, rau: .55, korn: 2.2, hell: -.1, muster: (x, y) => Math.sin(x * 1.5 + Math.sin(y * .22) * 2.2) * .15 - (y < 170 ? .2 : 0) });
  s.form(M.poly([[cx - 16, 269], [cx + 17, 269], [cx + 8, 254], [cx - 8, 254]]), 'holz', { rund: 3, rau: .5, korn: 2.2, hell: -.12 });
  s.form((x, y) => M.poly([[cx - 9, 268], [cx + 2, 268], [cx + 1, 232], [cx - 7, 236]])(x, y) && fbm(x / 3, y / 4) > .5, 'moos', { rund: 1, rau: .5, korn: 2, kante: false, hell: -.06 });
  // Die vorderen Zweige überlappen sich vor dem Stamm. Unter etwa 70 Prozent bleibt er frei.
  for (let i = 10; i >= 0; i--) for (const v of [-1, 1]) if (i >= 1 || v === 1) zweig(8 + i * 15 + R(i, v + 5) * 3, 5 + i * 4.8 + R(i, v + 7) * 4, v, (v < 0 ? .07 : -.02) + (10 - i) * .008, 4);
  s.form(M.poly([[cx, 2], [cx + 7, 26], [cx - 7, 26]]), 'nadel', { rund: 3, rau: .5, korn: 2.2, hell: .1 });
  for (const [y, v, b] of [[196, -1, 26], [206, 1, 22], [222, -1, 16]]) { s.linie([[cx + v * 4, y], [cx + v * b, y - 4]], 'holz', { hell: -.26 }); s.linie([[cx + v * 4, y + 1], [cx + v * b, y - 3]], 'holz', { hell: -.42 }); }
  return m;
}
// ---------- Wohnhaus: Maßstab passt zu den Figuren, Tür 58 x 114 Pixel, Traufe über dem Helm ----------
function zeichneHaus() {
  const k = 1.7, m = new Blatt(310, 322), s = m.skaliert(k), L = 26, R = 154, cx = 90, boden = 188, sockel = 164, trauf = 86;
  s.form(M.box(L - 3, sockel - 4, R - L + 6, boden - sockel + 4), 'stein', { rund: 2, muster: steine, hell: -.1 });
  const wand = (x, y) => fbm(x / 9, y / 9) > .62 ? -.12 : (hash(Math.floor(x / 5), Math.floor(y / 5)) > .96 ? -.2 : 0);
  s.form(M.box(L, trauf, R - L, sockel - trauf), 'putz', { rund: 2, rau: .22, korn: 6, hell: -.13, muster: wand }); s.form(M.poly([[L, trauf + 2], [R, trauf + 2], [cx, 40]]), 'putz', { rund: 2, rau: .22, korn: 6, hell: -.13, muster: wand });
  // Abgefallener Putz zeigt das Mauerwerk
  for (const [a, b, c] of [[36, 150, 6], [146, 104, 5], [118, 150, 5]]) s.form((x, y) => M.ell(a, b, c, c * .7)(x, y) && hash(Math.floor(x * 2), Math.floor(y * 2)) > .18, 'stein', { rund: 1, muster: steine, hell: -.12, kante: false });
  for (const p of [[L, trauf, L, sockel], [R, trauf, R, sockel], [L, trauf, R, trauf], [L, sockel - 1, R, sockel - 1], [L + 32, trauf, L + 32, sockel], [R - 32, trauf, R - 32, sockel], [L, 120, L + 32, trauf], [R, 120, R - 32, trauf], [cx, 40, cx, trauf], [cx - 26, trauf, cx, 62], [cx + 26, trauf, cx, 62]]) s.form(M.kap(p[0], p[1], p[2], p[3], 2.1), 'holz', { rund: 2, muster: maserung, hell: -.06 });
  for (const x of [L + 7, R - 25]) { s.form(M.box(x - 3, 98, 24, 28), 'holz', { rund: 2, muster: maserung }); s.form(M.box(x, 101, 18, 22), 'gelb', { rund: 0, leuchtet: true, muster: (a, b) => fbm(a / 4, b / 4) * .2 - .2 }); s.form(M.box(x + 8, 101, 2, 22), 'holz', { rund: 0, kante: false }); s.form(M.box(x, 110, 18, 2), 'holz', { rund: 0, kante: false }); s.form(M.box(x - 4, 126, 26, 4), 'holz', { rund: 2 }); }
  s.form(M.oder(...[0, 6].map(k2 => M.ell(L + 7 + k2 + 4, 124, 3, 2.4))), 'moos', { rund: 2, rau: .5, korn: 2, hell: -.1 }); s.punkt(L + 11, 122.4, 'rot', { hell: -.1 });
  // Tür mit Sturz: breit und hoch genug für den Helden
  s.form(M.oder(M.box(cx - 21, 104, 42, 60), M.ell(cx, 104, 21, 15)), 'stein', { rund: 2, muster: steine, hell: .02 });
  s.form(M.oder(M.box(cx - 17, 104, 34, 60), M.ell(cx, 104, 17, 12)), 'holz', { rund: 2, hell: .05, muster: (x, y) => Math.round(x) % 7 === 0 ? -.34 : maserung(x, y) });
  for (const y of [111, 152]) s.form(M.box(cx - 17, y, 26, 3), 'metall', { rund: 1, hell: -.04 }); s.form(M.ell(cx + 11, 134, 2.3, 2.3), 'metall', { rund: 1.4, hell: .2 });
  // Treppe von der Schwelle zum Boden
  for (let i = 0; i < 4; i++) { const b = 46 + i * 11, y = sockel + i * 6; s.form(M.box(cx - b / 2, y, b, 7), 'stein', { rund: 1.4, hell: .1 - i * .03, muster: (x, c) => (Math.round(x) + i * 5) % 17 === 0 ? -.3 : 0 }); s.linie([[cx - b / 2 + 1, y + .6], [cx + b / 2 - 2, y + .6]], 'stein', { hell: .36 }); }
  s.form(M.box(cx + 25, 112, 6, 8), 'metall', { rund: 1 }); s.form(M.box(cx + 26, 114, 4, 5), 'feuer', { rund: 0, leuchtet: true, kante: false });
  // Reetdach, gedeckter Ton, ein Flicken aus Blech
  const dach = (x, y) => Math.sin(x * 1.5 + y * .5) * .15 + (Math.round(y) % 9 < 1 ? -.26 : 0) + (hash(x, Math.floor(y / 9)) > .86 ? .14 : 0);
  s.form(M.poly([[cx, 22], [cx, 42], [L - 8, trauf + 16], [L - 24, trauf + 8]]), 'reet', { rund: 6, rau: .5, korn: 2.5, muster: dach }); s.form(M.poly([[cx, 22], [cx, 42], [R + 8, trauf + 16], [R + 24, trauf + 8]]), 'reet', { rund: 6, rau: .5, korn: 2.5, muster: dach, hell: -.09 });
  s.form(M.kap(cx - 5, 23, cx + 5, 23, 4), 'reet', { rund: 3, hell: -.18 }); for (const v of [-1, 1]) s.form(M.kap(cx, 43, cx + v * 62, trauf + 13, 1.8), 'holz', { rund: 1.4, muster: maserung, hell: -.14 });
  s.form(M.poly([[50, 62], [68, 48], [76, 58], [58, 74]]), 'wellblech', { rund: 1, hell: -.12, muster: (x, y) => Math.round(x + y) % 5 < 2 ? -.2 : .04 }); for (const [a, b] of [[53, 62], [66, 51], [73, 58], [59, 70]]) s.punkt(a, b, 'stahlAlt', { hell: .4 });
  // Kamin steht auf dem rechten Dachhang
  s.form(M.poly([[124, 10], [140, 10], [140, 84], [124, 70]]), 'stein', { rund: 2, muster: steine }); s.form(M.box(121, 6, 22, 6), 'stein', { rund: 2, hell: .08 }); s.form(M.box(126, 3, 12, 4), 'russ', { rund: 1 });
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4 - r; q++) { const x = R - 2 + q * 7 + r * 3.5, y = boden - 3 - r * 7; s.form(M.ell(x, y, 3.8, 3.8), 'holz', { rund: 2, hell: .08, muster: (a, b) => Math.sin(Math.hypot(a - x, b - y) * 2.4) * .16 }); }
  return m;
}
// ---------- Gebäude: Der Rumpf steht auf seiner Grundfläche, das Dach darf überstehen. 31 Maßeinheiten sind ein Feld, eine Tür ist so hoch wie ein Mensch. ----------
function bauBlatt(felder, hoch) { const rand = 28, B = felder * 31, m = new Blatt(Math.ceil((B + rand * 2) * 1.7), Math.ceil(hoch * 1.7)); return { m, s: m.skaliert(1.7), L: rand, R: rand + B, cx: rand + B / 2, boden: hoch - 4 }; }
const bohlenMuster = (x, y) => (Math.round(y) % 9 < 1 ? -.32 : maserung(x, y) + (hash(Math.floor(x / 24), Math.floor(y / 9)) - .5) * .16);
const dachMuster = (x, y) => Math.sin(x * 1.5 + y * .5) * .13 + (Math.round(y) % 8 < 1 ? -.26 : 0) + (hash(x, Math.floor(y / 8)) > .88 ? .13 : 0);
const schindelMuster = (x, y) => (Math.round(y) % 7 < 1 ? -.32 : ((Math.round(x) + (Math.floor(y / 7) % 2 ? 6 : 0)) % 12 < 1 ? -.24 : (hash(Math.floor(x / 12), Math.floor(y / 7)) - .5) * .22));
const bohlen = (s, x0, y0, x1, y1, stoff = 'holz', hell = 0) => s.form(M.box(x0, y0, x1 - x0, y1 - y0), stoff, { rund: 2, muster: bohlenMuster, hell });
const mauer = (s, x0, y0, x1, y1, hell = 0) => s.form(M.box(x0, y0, x1 - x0, y1 - y0), 'stein', { rund: 2, muster: steine, hell });
const wandPutz = (x, y) => fbm(x / 9, y / 9) > .62 ? -.12 : (hash(Math.floor(x / 5), Math.floor(y / 5)) > .96 ? -.2 : 0);
const balken = (s, a, b, c, d, r = 2.2) => s.form(M.kap(a, b, c, d, r), 'holz', { rund: 1.4, muster: maserung, hell: -.08 });
function fachwerk(s, x0, y0, x1, y1, teile = 3) {
  s.form(M.box(x0, y0, x1 - x0, y1 - y0), 'putz', { rund: 2, rau: .22, korn: 6, hell: -.13, muster: wandPutz });
  for (const p of [[x0, y0, x0, y1], [x1, y0, x1, y1], [x0, y0, x1, y0], [x0, y1, x1, y1]]) balken(s, ...p);
  const w = (x1 - x0) / teile;
  for (let i = 1; i < teile; i++) balken(s, x0 + w * i, y0, x0 + w * i, y1, 1.8);
}
function dachGiebel(s, L, R, trauf, first, stoff = 'reet', muster = dachMuster) {
  const cx = (L + R) / 2, o = { rund: 6, rau: .4, korn: 2.5, muster };
  s.form(M.poly([[cx, first], [cx, first + 18], [L - 6, trauf + 12], [L - 22, trauf + 4]]), stoff, o);
  s.form(M.poly([[cx, first], [cx, first + 18], [R + 6, trauf + 12], [R + 22, trauf + 4]]), stoff, { ...o, hell: -.05 });
  s.form(M.kap(cx - 5, first + 1, cx + 5, first + 1, 3.6), stoff, { rund: 3, hell: -.18 });
  for (const v of [-1, 1]) s.form(M.kap(cx, first + 20, cx + v * ((R - L) / 2 + 3), trauf + 10, 1.8), 'holz', { rund: 1.4, muster: maserung, hell: -.14 });
}
function dachLang(s, L, R, trauf, first, stoff = 'reet', muster = dachMuster) {
  s.form(M.poly([[L + 16, first], [R - 16, first], [R + 18, trauf + 6], [L - 18, trauf + 6]]), stoff, { rund: 5, rau: .4, korn: 2.5, muster });
  s.form(M.kap(L + 18, first, R - 18, first, 3), stoff, { rund: 2.4, hell: -.2 });
  s.form(M.box(L - 18, trauf + 6, R - L + 36, 2.6), 'holz', { rund: 1, hell: -.22 });
}
// Reste der alten Welt, jedes Gebäude hat sein eigenes Stück, kein aufgeklebter Flicken wie überall
function oelfass(s, x, boden, f = 'blauDkl') { s.form(M.box(x - 9, boden - 26, 18, 26), f, { rund: 3, muster: (a, c) => (Math.round(c) % 9 < 1 ? -.3 : 0) + (fbm(a / 6, c / 6) > .6 ? -.24 : 0) }); s.form(M.ell(x, boden - 26, 9, 2.6), 'metall', { rund: 1 }); }
function reifen(s, x, y, r = 10) { s.form((a, c) => { const d = Math.hypot(a - x, c - y); return d <= r && d >= r * .46; }, 'russ', { rund: 2.4, hell: .08, muster: (a, c) => Math.sin(Math.atan2(c - y, a - x) * 18) * .14 }); }
function strassenschild(s, x, y, boden) { s.form(M.box(x - 1.2, y + 6, 2.4, boden - y - 6), 'metall', { rund: .6 }); s.form(M.ell(x, y, 9, 9), 'rotDkl', { rund: 1, muster: (a, c) => fbm(a / 3, c / 3) > .55 ? -.3 : .1 }); s.form(M.box(x - 6, y - 1.2, 12, 2.6), 'putz', { rund: .2, hell: -.2, kante: false }); }
function kuehlerGrill(s, x, y, b = 24, h = 14) { s.form(M.box(x, y, b, h), 'stahlAlt', { rund: 1, hell: -.08 }); for (let i = 2; i < b; i += 4) s.form(M.box(x + i, y + 2, 2, h - 4), 'russ', { rund: 0, kante: false }); }
function tuer(s, cx, boden, b = 30, h = 76) {
  s.form(M.oder(M.box(cx - b / 2 - 3, boden - h + 8, b + 6, h - 8), M.ell(cx, boden - h + 8, b / 2 + 3, 9)), 'holz', { rund: 2, hell: -.2, muster: maserung });
  s.form(M.oder(M.box(cx - b / 2, boden - h + 8, b, h - 8), M.ell(cx, boden - h + 8, b / 2, 7)), 'holz', { rund: 2, hell: .05, muster: (x, y) => Math.round(x) % 7 === 0 ? -.34 : maserung(x, y) });
  for (const y of [boden - h + 14, boden - 14]) s.form(M.box(cx - b / 2, y, b * .76, 2.6), 'metall', { rund: 1, hell: -.04 });
  s.form(M.ell(cx + b / 2 - 5, boden - h * .46, 2, 2), 'metall', { rund: 1.2, hell: .2 });
}
function fenster(s, x, y, b = 18, h = 20, licht = true) {
  s.form(M.box(x - 3, y - 3, b + 6, h + 6), 'holz', { rund: 2, muster: maserung });
  s.form(M.box(x, y, b, h), licht ? 'gelb' : 'russ', licht ? { rund: 0, leuchtet: true, muster: (a, c) => fbm(a / 4, c / 4) * .2 - .2 } : { rund: 0 });
  s.form(M.box(x + b / 2 - 1, y, 2, h), 'holz', { rund: 0, hell: -.1 }); s.form(M.box(x, y + h / 2 - 1, b, 2), 'holz', { rund: 0, hell: -.1 });
}
function kamin(s, x, oben, unten) { s.form(M.box(x, oben, 15, unten - oben), 'stein', { rund: 2, muster: steine }); s.form(M.box(x - 2, oben - 3, 19, 5), 'stein', { rund: 2, hell: .08 }); s.form(M.box(x + 2, oben - 6, 11, 4), 'russ', { rund: 1 }); }
function fass(s, x, boden, h = 20, b = 9) { s.form(M.ell(x, boden - h / 2, b, h / 2), 'holz', { rund: 4, muster: (a, c) => Math.round(a) % 4 === 0 ? -.28 : 0 }); for (const q of [.25, .75]) s.linie([[x - b + 1, boden - h * q], [x + b - 1, boden - h * q]], 'metall', { hell: .1 }); }
function sack(s, x, boden, b = 9, h = 13) { s.form(M.oder(M.poly([[x - b, boden], [x + b, boden], [x + b * .8, boden - h * .7], [x + 2, boden - h], [x - 2, boden - h], [x - b * .8, boden - h * .7]])), 'leinen', { rund: 3, rau: .2, korn: 3, muster: falten }); s.linie([[x - 3, boden - h + 2], [x + 3, boden - h + 2]], 'gurt', {}); }
function holzstoss(s, x, boden, n = 4) { for (let r = 0; r < 3; r++) for (let q = 0; q < n - r; q++) { const a = x + q * 7 + r * 3.5, c = boden - 3.6 - r * 7; s.form(M.ell(a, c, 3.8, 3.8), 'holz', { rund: 2, hell: .08, muster: (u, v) => Math.sin(Math.hypot(u - a, v - c) * 2.4) * .16 }); } }
function blechFlicken(s, x, y, b = 24, h = 16) { s.form(M.poly([[x, y + 4], [x + b, y], [x + b + 2, y + h], [x + 2, y + h + 3]]), 'wellblech', { rund: 1, hell: -.12, muster: (a, c) => Math.round(a) % 5 < 2 ? -.2 : .04 }); for (const [a, c] of [[x + 2, y + 5], [x + b - 1, y + 2], [x + b, y + h - 1], [x + 3, y + h + 1]]) s.punkt(a, c, 'stahlAlt', { hell: .4 }); }
function zeichneLager() {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 208), stelzen = boden - 24, T = stelzen - 88;
  for (const x of [L + 7, cx - 7, R - 21]) { mauer(s, x, stelzen, x + 14, boden); s.form(M.box(x - 4, stelzen - 3, 22, 4), 'stein', { rund: 1.4, hell: .12 }); }
  bohlen(s, L, T, R, stelzen - 2, 'fischHolz'); s.form(M.poly([[L, T + 2], [R, T + 2], [cx, T - 42]]), 'fischHolz', { rund: 2, muster: (x, y) => Math.round(x) % 9 < 1 ? -.3 : maserung(x, y) });
  fenster(s, cx - 9, T - 24, 18, 16, false);
  // Rampe hinauf zur Tür: Säcke schleppt man nicht über eine Leiter
  tuer(s, cx, stelzen - 2, 32, 76);
  s.form(M.poly([[cx - 18, stelzen - 2], [cx + 18, stelzen - 2], [cx + 30, boden], [cx - 30, boden]]), 'holz', { rund: 1, muster: (x, y) => Math.round(y) % 5 < 1 ? -.32 : maserung(x, y), hell: .05 });
  dachGiebel(s, L, R, T - 2, T - 58, 'rotDkl', schindelMuster);
  // Ein altes Straßenschild dichtet die Wand ab
  s.form(M.poly([[R - 36, T + 30], [R - 16, T + 26], [R - 12, T + 44], [R - 32, T + 50]]), 'rotDkl', { rund: 1, muster: (x, y) => fbm(x / 4, y / 4) > .55 ? -.34 : .06 }); for (const [a, c] of [[R - 34, T + 32], [R - 18, T + 28], [R - 15, T + 43], [R - 31, T + 48]]) s.punkt(a, c, 'stahlAlt', { hell: .4 });
  sack(s, L + 2, boden); sack(s, L + 16, boden, 8, 11); fass(s, R + 6, boden); sack(s, R + 22, boden, 7, 11);
  return m;
}
function zeichneWirtshaus() {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 258), sockel = boden - 12, mitte = sockel - 78, oben = mitte - 68, tx = L + 70;
  kamin(s, cx + 68, boden - 228, oben + 14);
  mauer(s, L - 2, sockel, R + 2, boden, -.08);
  // Fenster und Tür sitzen zwischen den Balken, das Fachwerk trägt
  fachwerk(s, L, mitte, R, sockel, 4);
  fachwerk(s, L - 6, oben, R + 6, mitte - 2, 6);
  for (const x of [L + 2, L + 35, L + 101, L + 134, L + 167]) fenster(s, x + .5, oben + 20, 16, 22);
  fenster(s, L + 12, mitte + 22, 22, 26); fenster(s, L + 105, mitte + 22, 22, 26); fenster(s, L + 152, mitte + 22, 22, 26);
  tuer(s, tx, sockel + 2, 34, 76);
  s.form(M.box(tx - 24, sockel, 48, 6), 'stein', { rund: 1.4, hell: .1 }); s.form(M.box(tx - 30, sockel + 6, 60, 6), 'stein', { rund: 1.4, hell: .04 });
  // Das Schild hängt an einem Autoblech, der Krug ist aufgemalt
  balken(s, R + 2, mitte + 4, R + 24, mitte + 4, 1.6); s.linie([[R + 22, mitte + 5], [R + 22, mitte + 12]], 'metall', {});
  s.form(M.box(R + 8, mitte + 12, 22, 22), 'wellblech', { rund: 1.4, hell: -.12 }); s.form(M.box(R + 13, mitte + 16, 11, 14), 'gold', { rund: 1, hell: -.2 }); s.form(M.ell(R + 18.5, mitte + 16, 6, 2.4), 'putz', { rund: 1 }); s.linie([[R + 24, mitte + 19], [R + 27, mitte + 21], [R + 27, mitte + 25], [R + 24, mitte + 27]], 'gold', { hell: -.2 });
  s.form(M.box(cx + 8, sockel - 8, 36, 4), 'holz', { rund: 1, muster: maserung, hell: .06 }); for (const x of [cx + 11, cx + 39]) s.form(M.box(x, sockel - 4, 3, 16), 'holz', { rund: .8, hell: -.12 });
  oelfass(s, L - 8, boden, 'rostDkl'); fass(s, L + 6, boden, 16, 8);
  dachLang(s, L - 6, R + 6, oben, oben - 52);
  return m;
}
function zeichneHolzfaeller() {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 204), T = boden - 84;
  kamin(s, cx + 26, boden - 164, T - 26);
  mauer(s, L - 1, boden - 7, R + 1, boden, -.1);
  bohlen(s, L, T, R, boden - 7); s.form(M.poly([[L, T + 2], [R, T + 2], [cx, T - 42]]), 'holz', { rund: 2, muster: bohlenMuster });
  for (let y = T + 4; y < boden - 8; y += 9) for (const x of [L, R]) s.form(M.ell(x, y, 4.4, 4.4), 'holz', { rund: 2, hell: .1, muster: (u, v) => Math.sin(Math.hypot(u - x, v - y) * 2.2) * .16 });
  tuer(s, cx - 18, boden - 5, 30, 76); fenster(s, cx + 18, T + 16, 22, 22);
  dachGiebel(s, L, R, T - 2, T - 58, 'reet');
  // Die alte Säge läuft nicht mehr, ihr Blatt hängt an der Wand. Der Reifen liegt, weil er noch nie jemanden gestört hat.
  s.form(M.poly([[cx + 12, T + 46], [R - 8, T + 46], [R - 8, T + 54], [cx + 16, T + 54]]), 'stahlAlt', { rund: .8, ...glatt, muster: (x) => Math.round(x) % 4 < 1 ? -.3 : 0 });
  holzstoss(s, L - 24, boden, 4); reifen(s, L + 6, boden - 8, 8);
  s.form(M.oder(M.box(R - 8, boden - 16, 22, 16), M.ell(R + 3, boden - 16, 11, 4)), 'holz', { rund: 2, muster: (u, v) => v < boden - 15 ? Math.sin(Math.hypot(u - R - 3, (v - boden + 16) * 2.6) * 2) * .18 : maserung(u, v) });
  s.form(M.kap(R + 3, boden - 18, R + 20, boden - 40, 1.6), 'holz', { rund: 1, hell: .1 }); s.form(M.poly([[R - 2, boden - 23], [R + 7, boden - 16], [R + 9, boden - 22], [R + 4, boden - 28]]), 'stahlAlt', { rund: 1, ...glatt });
  return m;
}
function zeichneSteinmetz() {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 176), T = boden - 88;
  mauer(s, L + 3, T + 8, R - 3, boden - 2, -.06);
  // Offenes Dach auf Pfosten, darunter der Werkplatz
  for (const x of [L + 2, R - 8]) s.form(M.box(x, T + 4, 6, boden - T - 4), 'holz', { rund: 1.4, muster: maserung });
  s.form(M.poly([[L - 18, T + 12], [R + 18, T + 12], [R - 4, T - 24], [L + 4, T - 24]]), 'wellblech', { rund: 2, hell: -.1, muster: (x, y) => (Math.round(x) % 7 < 2 ? -.2 : .04) + (fbm(x / 14, y / 10) > .58 ? -.22 : 0) });
  s.form(M.box(L - 18, T + 11, R - L + 36, 3), 'holz', { rund: 1, hell: -.2 });
  // Ein roher Block auf einem Sockel, oben schon behauen. Der Rest liegt daneben, dazu ein Stück Betonrohr aus der alten Welt.
  s.form(M.box(cx - 22, boden - 16, 44, 16), 'stein', { rund: 2, muster: steine, hell: .02 });
  s.form(M.poly([[cx - 18, boden - 16], [cx + 18, boden - 16], [cx + 15, boden - 46], [cx + 6, boden - 56], [cx - 12, boden - 52], [cx - 16, boden - 42]]), 'stein', { rund: 3, hell: .18, muster: (x, y) => y < boden - 34 ? (hash(Math.floor(x / 4), Math.floor(y / 4)) - .5) * .4 : (fbm(x / 7, y / 7) > .6 ? -.14 : 0) });
  s.form(M.kap(cx + 24, boden - 20, cx + 40, boden - 22, 1.2), 'stahlAlt', { rund: .8, ...glatt });
  for (const [x, b, h] of [[L - 16, 26, 20], [R - 6, 24, 18]]) s.form(M.box(x, boden - h, b, h), 'stein', { rund: 2.4, hell: .1, muster: (u, v) => fbm(u / 7, v / 7) > .62 ? -.16 : 0 });
  s.form(M.oder(M.ell(L + 24, boden - 14, 14, 14)), 'betonGrau', { rund: 3, muster: (x, y) => fbm(x / 6, y / 6) > .62 ? -.14 : 0 }); s.form(M.ell(L + 24, boden - 14, 8, 8), 'russ', { rund: 1 });
  return m;
}
function zeichneBauernhof() {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 222), T = boden - 92, bretter = (x, y) => (Math.round(x) % 9 < 1 ? -.3 : maserung(x, y)) + (fbm(x / 16, y / 18) > .56 ? -.16 : 0) + (hash(Math.floor(x / 9), 2) > .8 ? .1 : 0);
  mauer(s, L - 1, boden - 6, R + 1, boden, -.12);
  s.form(M.box(L, T, R - L, boden - 6 - T), 'scheune', { rund: 2, muster: bretter });
  s.form(M.poly([[L, T + 2], [R, T + 2], [cx, T - 62]]), 'scheune', { rund: 2, muster: bretter });
  // Großes Tor mit Kreuzstreben, darüber die Heuluke, aus der das Heu hängt
  const tb = 74, th = 84; s.form(M.box(cx - tb / 2 - 3, boden - th - 3, tb + 6, th + 3), 'holz', { rund: 2, hell: -.22 });
  for (const v of [-1, 1]) { const x0 = v < 0 ? cx - tb / 2 : cx + 1; s.form(M.box(x0, boden - th, tb / 2 - 1, th), 'holz', { rund: 2, muster: (x, y) => Math.round(x) % 7 === 0 ? -.3 : maserung(x, y) }); balken(s, x0 + 2, boden - th + 3, x0 + tb / 2 - 3, boden - 3, 1.6); balken(s, x0 + tb / 2 - 3, boden - th + 3, x0 + 2, boden - 3, 1.6); }
  s.form(M.box(cx - 15, T - 36, 30, 26), 'russ', { rund: 1 }); s.form(M.poly([[cx - 14, T - 22], [cx + 14, T - 22], [cx + 13, T - 9], [cx + 8, T - 3], [cx + 3, T - 8], [cx - 2, T - 1], [cx - 7, T - 8], [cx - 13, T - 5]]), 'stroh', { rund: 2, rau: .6, korn: 2, hell: -.2 }); s.form(M.box(cx - 18, T - 39, 36, 3), 'holz', { rund: 1 });
  fenster(s, L + 12, T + 18, 20, 20, false); fenster(s, R - 32, T + 18, 20, 20, false);
  dachGiebel(s, L, R, T - 2, T - 84, 'reet');
  s.form(M.poly([[L - 30, boden], [L - 28, boden - 22], [L - 16, boden - 36], [L - 2, boden - 38], [L + 10, boden - 24], [L + 13, boden]]), 'stroh', { rund: 5, rau: .7, korn: 2, hell: -.16, muster: (x, y) => Math.sin(x * 1.3 + y * .6) * .14 });
  for (const x of [R + 2, R + 15, R + 27]) s.form(M.box(x, boden - 22, 4, 22), 'holz', { rund: .8, hell: -.06 }); for (const y of [boden - 18, boden - 9]) s.form(M.box(R, y, 31, 3), 'holz', { rund: .8 });
  oelfass(s, cx + 52, boden); sack(s, cx + 68, boden, 7, 11);
  return m;
}
function zeichneSchmiede(glut) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 224), T = boden - 92, fx = L + 54;
  mauer(s, L, T, R, boden);
  // Links die offene Esse mit Rauchfang, der Kamin steht genau darüber
  s.form(M.oder(M.box(fx - 36, T + 26, 72, boden - T - 28), M.ell(fx, T + 26, 36, 12)), 'russ', { rund: 3, hell: -.2 });
  s.form(M.box(fx - 26, boden - 42, 52, 40), 'stein', { rund: 2, muster: steine, hell: -.14 });
  s.form(M.poly([[fx - 24, boden - 41], [fx - 16, boden - 46], [fx - 6, boden - 44], [fx + 3, boden - 49], [fx + 12, boden - 45], [fx + 24, boden - 41]]), 'russ', { rund: 1, hell: -.1 }); s.form(M.poly([[fx - 16, boden - 42], [fx - 9, boden - 45], [fx, boden - 43], [fx + 5, boden - 47], [fx + 12, boden - 43], [fx + 16, boden - 42]]), 'glut', { rund: 1, leuchtet: true, hell: glut ? .04 : -.14, muster: (x, y) => fbm(x / 3, y / 2) * .5 - .22 });
  s.form(M.poly([[fx - 32, T + 26], [fx + 32, T + 26], [fx + 12, T - 4], [fx - 12, T - 4]]), 'stein', { rund: 2, muster: steine, hell: .06 });
  for (const x of [fx - 22, fx + 18]) { s.form(M.kap(x, T + 30, x, T + 48, 1.1), 'stahlAlt', { rund: .8, ...glatt, hell: -.1 }); s.form(M.box(x - 3, T + 48, 6, 4), 'metall', { rund: .8 }); }
  // Amboss auf dem Klotz, Tür, Wassertrog aus einer Badewanne der alten Welt
  s.form(M.box(cx + 2, boden - 18, 18, 18), 'holz', { rund: 2, muster: maserung }); s.form(M.oder(M.box(cx - 2, boden - 28, 28, 6), M.box(cx + 5, boden - 22, 12, 5), M.poly([[cx - 2, boden - 28], [cx - 12, boden - 27], [cx - 2, boden - 23]])), 'metall', { rund: 1.4, ...glatt, hell: .08 });
  tuer(s, R - 28, boden, 32, 80); fenster(s, cx + 14, T + 22, 18, 18);
  oelfass(s, L - 6, boden, 'rostDkl');
  s.form(M.poly([[R + 4, boden - 13], [R + 28, boden - 13], [R + 25, boden], [R + 7, boden]]), 'putz', { rund: 3, hell: -.1, muster: (x, y) => fbm(x / 5, y / 5) > .6 ? -.3 : 0 }); s.form(M.box(R + 7, boden - 13, 18, 2.4), 'glas', { rund: .4, hell: -.3 });
  dachLang(s, L, R, T, T - 46, 'holz', schindelMuster);
  kamin(s, fx - 7.5, boden - 176, T - 26);
  return m;
}
function zeichneBrunnen() {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 158), T = boden - 112, b = 42;
  // Pfosten hinter dem Ring, davor die Mauer aus Feldsteinen
  for (const v of [-1, 1]) s.form(M.box(cx + v * b - 3, T + 8, 6, boden - T - 16), 'holz', { rund: 1.4, muster: maserung });
  s.form(M.ell(cx, boden - 28, 36, 10), 'russ', { rund: 2, hell: -.2 }); s.form(M.ell(cx, boden - 27, 30, 7), 'glasDkl', { rund: 2, hell: -.12 });
  s.form(M.kap(cx - b, T + 34, cx + b, T + 34, 3), 'holz', { rund: 2, muster: maserung }); s.linie([[cx, T + 36], [cx, boden - 34]], 'lumpen', { hell: .2 });
  // Der Eimer war einmal ein Kanister
  s.form(M.box(cx - 6, boden - 46, 12, 13), 'rost', { rund: 1.4, muster: (x, y) => fbm(x / 4, y / 4) > .6 ? -.2 : 0 }); s.linie([[cx - 7, boden - 40], [cx + 6, boden - 40]], 'metall', {});
  s.form(M.kap(cx + b, T + 34, cx + b + 12, T + 42, 1.3), 'metall', { rund: .8, hell: .1 });
  s.form((x, y) => { const o = M.ell(cx, boden - 26, 40, 13)(x, y), u = M.box(cx - 40, boden - 26, 80, 22)(x, y), e = M.ell(cx, boden - 4, 40, 8)(x, y), i = M.ell(cx, boden - 28, 32, 8)(x, y); return (o || u || e) && !i; }, 'stein', { rund: 3, muster: steine, hell: .03 });
  s.form(M.poly([[cx, T - 8], [cx + b + 16, T + 22], [cx - b - 16, T + 22]]), 'holz', { rund: 4, rau: .3, korn: 2, muster: schindelMuster });
  s.form(M.kap(cx - b - 14, T + 22, cx + b + 14, T + 22, 1.6), 'holz', { rund: 1, hell: -.2 });
  return m;
}
function zeichneWachturm() {
  const { m, s, cx, boden } = bauBlatt(4, 322), b = 38, platte = boden - 186, o = 34;
  // Vier Stämme, nach oben enger: die zwei hinteren dunkler. Kreuzstreben dazwischen.
  for (const v of [-1, 1]) s.form(M.kap(cx + v * (b - 12), boden - 4, cx + v * (o - 10), platte, 2.6), 'holz', { rund: 1.6, muster: maserung, hell: -.3 });
  for (const v of [-1, 1]) s.form(M.kap(cx + v * b, boden - 6, cx + v * o, platte, 3.6), 'holz', { rund: 2, muster: maserung, hell: -.14 });
  for (let i = 0; i < 3; i++) { const y0 = boden - 8 - i * 60, y1 = y0 - 56, w0 = b - i * 1.4, w1 = b - (i + 1) * 1.4; balken(s, cx - w0, y0, cx + w1, y1, 1.6); balken(s, cx + w0, y0, cx - w1, y1, 1.6); }
  // Leiter vor der Mitte, sie führt durch die Luke
  for (const v of [-1, 1]) s.form(M.kap(cx + v * 8, boden, cx + v * 8, platte, 1.5), 'holz', { rund: 1, hell: .12 }); for (let y = boden - 8; y > platte; y -= 12) s.form(M.box(cx - 8, y, 16, 2.2), 'holz', { rund: .6, hell: .16 });
  mauer(s, cx - b - 7, boden - 8, cx - b + 7, boden, -.04); mauer(s, cx + b - 7, boden - 8, cx + b + 7, boden, -.04);
  // Plattform mit brusthoher Brüstung, Dach auf vier Pfosten
  s.form(M.box(cx - o - 16, platte - 6, (o + 16) * 2, 9), 'holz', { rund: 2, muster: maserung, hell: .04 });
  for (const v of [-1, 1]) s.form(M.box(cx + v * (o + 10) - 3, platte - 90, 6, 86), 'holz', { rund: 1.4, muster: maserung, hell: -.08 });
  bohlen(s, cx - o - 14, platte - 44, cx + o + 14, platte - 6, 'holz', .02);
  s.form(M.box(cx - o + 2, platte - 38, 34, 26), 'stahlAlt', { rund: 1.4, muster: (x, y) => fbm(x / 7, y / 7) > .6 ? -.2 : 0 }); s.form(M.box(cx - o + 6, platte - 34, 26, 12), 'russ', { rund: .6 });
  s.form(M.poly([[cx, platte - 128], [cx + o + 26, platte - 86], [cx - o - 26, platte - 86]]), 'reet', { rund: 5, rau: .4, korn: 2.5, muster: dachMuster });
  s.form(M.kap(cx - o - 24, platte - 86, cx + o + 24, platte - 86, 1.8), 'holz', { rund: 1, hell: -.2 });
  s.form(M.box(cx + o + 2, platte - 30, 7, 10), 'metall', { rund: 1 }); s.form(M.box(cx + o + 3.4, platte - 28.4, 4, 6), 'glut', { rund: 0, leuchtet: true, kante: false });
  return m;
}
function zeichneKoehlerei(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 196), mx = L + 58, grund = boden - 34;
  // Die Hütte steht hinten, höher im Bild. Davor der Meiler, Glut nur in den kleinen Löchern.
  bohlen(s, R - 58, grund - 76, R + 6, grund); s.form(M.box(R - 62, grund - 6, 72, 6), 'stein', { rund: 1, hell: -.1 }); tuer(s, R - 26, grund, 32, 74);
  s.form(M.poly([[R - 72, grund - 72], [R + 18, grund - 72], [R, grund - 104], [R - 54, grund - 104]]), 'holz', { rund: 3, rau: .3, korn: 2, muster: schindelMuster, hell: -.08 });
  s.form((x, y) => M.ell(mx, boden, 54, 60)(x, y) && y < boden, 'erde', { rund: 8, rau: .5, korn: 3, muster: (x, y) => fbm(x / 8, y / 8) * .26 - .1 });
  s.form((x, y) => M.ell(mx, boden, 56, 16)(x, y) && y < boden, 'russ', { rund: 3, rau: .4, korn: 3 });
  for (const [x, y] of [[mx - 20, boden - 30], [mx + 14, boden - 42], [mx + 30, boden - 22], [mx - 4, boden - 50]]) { s.form(M.ell(x, y, 2.6, 2), 'russ', { rund: 1, hell: -.3 }); s.form(M.ell(x, y, 1.6, 1.2), 'glut', { rund: .6, leuchtet: true, hell: f ? .1 : -.14 }); }
  holzstoss(s, L - 24, boden, 4);
  // Als Abdeckung dient ein Kühlergrill aus der alten Welt
  kuehlerGrill(s, R - 8, boden - 16, 28, 16);
  return m;
}
// ---------- Dorf der ersten Epochen ----------
const ziegelDach = { stoff: 'rotDkl', muster: schindelMuster };
function fensterRund(s, x, y, b, h, licht = true) { const o = M.oder(M.box(x, y + b / 2, b, h - b / 2), M.ell(x + b / 2, y + b / 2, b / 2, b / 2)); s.form(M.oder(M.box(x - 3, y + b / 2, b + 6, h - b / 2 + 3), M.ell(x + b / 2, y + b / 2, b / 2 + 3, b / 2 + 3)), 'stein', { rund: 2, hell: .12 }); s.form(o, licht ? 'gelb' : 'russ', licht ? { rund: 0, leuchtet: true, muster: (a, c) => fbm(a / 4, c / 4) * .2 - .2 } : { rund: 0 }); s.form(M.box(x + b / 2 - 1, y, 2, h), 'stein', { rund: 0, hell: -.1 }); }
function zeichneKirche() {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 330), tx = L + 34, T = boden - 104;
  // Das Schiff steht rechts, der Turm vorn links
  mauer(s, tx + 20, T, R, boden);
  for (const x of [cx + 2, cx + 40]) fensterRund(s, x, T + 22, 20, 48);
  kabel(s, tx + 20, T + 8, R, T + 12, 7);   // Bruder Anselm salbt hier die Kabel
  s.form(M.poly([[tx + 12, T + 8], [R + 16, T + 8], [R - 10, T - 44], [tx + 26, T - 44]]), 'rotDkl', { rund: 4, rau: .3, korn: 2.5, muster: schindelMuster });
  s.form(M.kap(tx + 26, T - 44, R - 10, T - 44, 2.4), 'rotDkl', { rund: 2, hell: -.2 }); mauer(s, L + 2, boden - 214, tx + 34, boden, .05);
  fensterRund(s, tx - 8, boden - 196, 18, 34, false); s.form(M.box(tx - 6, boden - 176, 14, 3), 'stein', { rund: 1, hell: -.3 });
  s.form(M.ell(tx + 1, boden - 186, 4.4, 5), 'gold', { rund: 2, hell: -.1 });
  s.form(M.oder(M.box(tx - 18, boden - 88, 38, 88), M.ell(tx + 1, boden - 88, 19, 15)), 'stein', { rund: 2, muster: steine, hell: .16 });
  tuer(s, tx + 1, boden, 30, 84);
  s.form(M.poly([[tx + 1, boden - 288], [L - 8, boden - 214], [tx + 44, boden - 214]]), 'schiefer', { rund: 4, muster: schindelMuster });
  s.form(M.oder(M.box(tx - .4, boden - 310, 3, 24), M.box(tx - 6, boden - 303, 14, 3)), 'metall', { rund: 1, ...glatt, hell: .12 });
  for (const x of [R - 4, R + 12]) { s.form(M.oder(M.box(x, boden - 22, 11, 22), M.ell(x + 5.5, boden - 22, 5.5, 5)), 'stein', { rund: 2, hell: .02, muster: (a, c) => fbm(a / 5, c / 5) > .6 ? -.18 : 0 }); }
  return m;
}
function zeichneRathaus(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, st >= 3 ? 302 : 262), sockel = boden - 14, mitte = sockel - 72, oben = mitte - 56;
  kamin(s, R - 40, oben - 62, oben - 18);
  mauer(s, L, mitte, R, boden);
  if (st >= 2) fachwerk(s, L, oben, R, mitte, 6); else bohlen(s, L, oben, R, mitte, 'holz', .02);
  for (const x of [L + 10, L + 42, cx + 20, cx + 54]) fenster(s, x, oben + 16, 18, 24);
  fensterRund(s, L + 14, mitte + 20, 22, 40); fensterRund(s, R - 36, mitte + 20, 22, 40);
  s.form(M.box(cx - 22, mitte - 2, 44, 6), 'stein', { rund: 1, hell: .14 }); for (const v of [-1, 1]) s.form(M.box(cx + v * 21 - 3, mitte + 4, 6, sockel - mitte - 4), 'stein', { rund: 2, hell: .18 });
  tuer(s, cx, sockel + 2, 34, 74);
  for (let i = 0; i < 2; i++) s.form(M.box(cx - 26 - i * 8, sockel + i * 7, 52 + i * 16, 7), 'stein', { rund: 1.4, hell: .12 - i * .05 });
  dachLang(s, L - 2, R + 2, oben, oben - 50, st >= 2 ? 'rotDkl' : 'holz', schindelMuster);
  if (st < 2) reifen(s, L + 52, oben - 18, 9);
  if (st >= 2) { s.form(M.box(cx - 56, mitte + 2, 15, 22), 'stoffRot', { rund: 1, muster: falten }); s.form(M.poly([[cx - 56, mitte + 24], [cx - 41, mitte + 24], [cx - 48.5, mitte + 31]]), 'stoffRot', { rund: 1, muster: falten }); kuehlerGrill(s, R + 2, boden - 14, 20, 14); }
  if (st >= 3) {
    // Der Uhrturm: Die Zeiger stehen still, seit es keine Ersatzteile gibt
    mauer(s, cx - 20, oben - 84, cx + 20, oben - 20, .06); s.form(M.ell(cx, oben - 58, 13, 13), 'putz', { rund: 2, hell: .08 }); s.form(M.ell(cx, oben - 58, 1.5, 1.5), 'metall', { rund: 1 }); s.linie([[cx, oben - 58], [cx + 7, oben - 62]], 'russ', {}); s.linie([[cx, oben - 58], [cx - 2, oben - 67]], 'russ', {});
    s.form(M.poly([[cx, oben - 118], [cx + 28, oben - 82], [cx - 28, oben - 82]]), 'rotDkl', { rund: 3, muster: schindelMuster });
  }
  return m;
}
function zeichneBaeckerei(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 214), T = boden - 82;
  kamin(s, L + 22, boden - 170, T - 12);
  mauer(s, L - 1, boden - 8, R + 1, boden, -.08); fachwerk(s, L, T, R, boden - 8, 3);
  s.form(M.oder(M.box(L + 8, T + 32, 44, 34), M.ell(L + 30, T + 32, 22, 12)), 'stein', { rund: 2, muster: steine, hell: .05 }); s.form(M.oder(M.box(L + 16, T + 38, 28, 28), M.ell(L + 30, T + 38, 14, 8)), 'russ', { rund: 1 });
  s.form(M.ell(L + 30, T + 60, 12, 5), 'glut', { rund: 2, leuchtet: true, hell: f ? .1 : -.1, muster: (x, y) => fbm(x / 4, y / 3) * .4 - .2 });
  tuer(s, R - 22, boden - 6, 30, 72);
  s.form(M.box(L + 2, boden - 28, 26, 3), 'holz', { rund: 1 }); for (const x of [L + 8, L + 20]) s.form(M.ell(x, boden - 31, 6, 3.4), 'stroh', { rund: 2, hell: -.1 });
  dachGiebel(s, L, R, T - 2, T - 58, 'rotDkl', schindelMuster);
  s.form(M.box(cx - 3, T - 14, 6, 18), 'holz', { rund: 1 }); s.form(M.ell(cx, T - 22, 8, 5), 'stroh', { rund: 2, hell: -.1 });
  sack(s, R + 10, boden, 8, 13); sack(s, R + 22, boden, 7, 11);
  return m;
}
function zeichneArchiv(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, st >= 2 ? 240 : 208), T = boden - 92;
  kamin(s, R - 22, T - 54, T - 24);
  mauer(s, L, T, R, boden, .03);
  for (const x of [L + 12, R - 32]) fensterRund(s, x, T + 18, 20, 42);
  tuer(s, cx, boden, 30, 76); s.form(M.oder(M.box(cx - 8, T + 10, 16, 2.6), M.box(cx - 8, T + 18, 16, 2.6)), 'stein', { rund: .6, hell: .3 });
  dachGiebel(s, L, R, T - 2, T - 56, 'schiefer', schindelMuster);
  // Bücher kommen nicht in den Regen: Das Dach ist das Einzige hier, das nie geflickt wurde
  s.form(M.box(R + 2, boden - 30, 16, 30), 'holz', { rund: 2, muster: maserung }); for (const y of [boden - 26, boden - 16, boden - 6]) { s.form(M.box(R + 4, y, 12, 8), 'rotDkl', { rund: .8 }); s.form(M.box(R + 8, y, 3, 8), 'blauDkl', { rund: .4 }); }
  if (st >= 2) { mauer(s, cx - 20, T - 92, cx + 20, T - 34, .08); fensterRund(s, cx - 9, T - 84, 18, 34); s.form(M.poly([[cx, T - 122], [cx + 28, T - 90], [cx - 28, T - 90]]), 'schiefer', { rund: 3, muster: schindelMuster }); }
  return m;
}
function zeichneFischerhuette(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 208), stelzen = boden - 18, T = stelzen - 84;
  for (const x of [L + 4, cx - 5, R - 14]) s.form(M.box(x, stelzen, 10, 18), 'holz', { rund: 2, muster: maserung, hell: -.16 });
  bohlen(s, L, T, R, stelzen, st >= 2 ? 'holz' : 'fischHolz'); s.form(M.poly([[L, T + 2], [R, T + 2], [cx, T - 38]]), st >= 2 ? 'holz' : 'fischHolz', { rund: 2, muster: bohlenMuster });
  tuer(s, cx - 16, stelzen, 30, 74); s.form(M.box(cx - 36, stelzen, 40, 9), 'holz', { rund: 1, muster: maserung, hell: .06 }); s.form(M.box(cx - 42, stelzen + 9, 52, 9), 'holz', { rund: 1, muster: maserung, hell: .02 }); fenster(s, cx + 16, T + 16, 20, 20);
  s.form(M.box(L - 18, stelzen - 2, R - L + 38, 5), 'holz', { rund: 1, muster: maserung, hell: .06 });
  dachGiebel(s, L, R, T - 2, T - 54, st >= 3 ? 'holz' : 'reet', st >= 3 ? schindelMuster : dachMuster);
  // Netz zum Trocknen, Fische an der Leine, Boot an der Seite
  for (const x of [L - 14, L + 8]) s.form(M.box(x, T + 2, 3, stelzen - T), 'holz', { rund: .8 });
  s.form((x, y) => x > L - 13 && x < L + 8 && y > T + 6 && y < stelzen - 14 && ((Math.round(x + y) % 5 === 0) || (Math.round(x - y) % 5 === 0)), 'leinen', { rund: 0, kante: false, hell: .2 });
  s.linie([[R + 2, T + 10], [R + 22, T + 14]], 'leinen', {}); if (st >= 2) for (const x of [R + 6, R + 13, R + 19]) s.form(M.ell(x, T + 21, 2.4, 6.5), 'stahl', { rund: 1, hell: -.12 });
  s.form(M.poly([[R - 12, boden - 11], [R + 26, boden - 11], [R + 18, boden], [R - 6, boden]]), 'holz', { rund: 2, muster: bohlenMuster });
  fass(s, L - 4, boden, 16, 8);
  return m;
}
function zeichneKraeutergarten(st) {
  const m0 = new Blatt(Math.ceil(180 * 1.7), Math.ceil(84 * 1.7)), s = m0.skaliert(1.7), L = 28, R = 152, boden = 80;
  for (const x of [L, R - 2]) s.form(M.box(x, boden - 34, 3, 34), 'holz', { rund: .8 });
  for (const y of [boden - 28, boden - 14]) s.form(M.box(L, y, R - L, 2.4), 'holz', { rund: .6, hell: -.04 });
  for (let r = 0; r < 3; r++) { const y = boden - 26 + r * 9; s.form(M.box(L + 6, y, R - L - 10, 7), 'erde', { rund: 2, rau: .4, korn: 2 }); for (let i = 0; i < 12; i++) { const x = L + 10 + i * 9.4 + (r % 2) * 3, h = 6 + hash(i, r) * 7, g = ['moos', 'blattH', 'gras'][(i + r) % 3]; s.form(M.ell(x, y + 1 - h / 2, 3.4, h / 2), g, { rund: 1.6, rau: .6, korn: 2 }); if (st >= 2 && i % 3 === 0) s.punkt(x, y - h + 2, 'lazi', { leuchtet: true, hell: -.2 }); } }
  s.form(M.kap(R - 18, boden - 2, R - 4, boden - 40, 1.1), 'holz', { rund: .6 }); s.form(M.ell(R - 22, boden - 6, 7, 4.4), 'metall', { rund: 2, hell: -.1 });
  return m0;
}
function zeichneSpaeherposten(st) {
  const { m, s, cx, boden } = bauBlatt(4, st >= 2 ? 236 : 186), h = st >= 2 ? 112 : 66, platte = boden - h, b = 36;
  for (const v of [-1, 1]) s.form(M.kap(cx + v * b, boden, cx + v * (b - 6), platte, 3), 'holz', { rund: 2, muster: maserung, hell: -.12 });
  balken(s, cx - b, boden - 6, cx + b - 6, platte + 4, 1.6); balken(s, cx + b, boden - 6, cx - b + 6, platte + 4, 1.6);
  for (const v of [-1, 1]) s.form(M.kap(cx + v * 7, boden, cx + v * 7, platte, 1.4), 'holz', { rund: 1, hell: .12 }); for (let y = boden - 8; y > platte; y -= 11) s.form(M.box(cx - 7, y, 14, 2), 'holz', { rund: .6, hell: .16 });
  s.form(M.box(cx - b - 8, platte - 4, (b + 8) * 2, 7), 'holz', { rund: 1.6, muster: maserung });
  bohlen(s, cx - b - 6, platte - 28, cx + b + 6, platte - 4, 'fischHolz');
  // Tarnung: Umhänge und Zweige über dem Sitz, ein Fernglas für den, der hochsteigt
  for (const v of [-1, 1]) s.form(M.box(cx + v * (b + 2) - 2, platte - 58, 4, 54), 'holz', { rund: 1 });
  s.form(M.poly([[cx - b - 18, platte - 54], [cx + b + 18, platte - 54], [cx + b - 2, platte - 80], [cx - b + 2, platte - 80]]), 'stoffGruen', { rund: 3, muster: falten, hell: -.06 });
  for (let i = 0; i < 9; i++) s.form(M.ell(cx - b - 8 + i * 12, platte - 56 - hash(i, 3) * 8, 7, 4.6), 'blattH', { rund: 2, rau: .7, korn: 2 });
  s.form(M.box(cx - 8, platte - 38, 16, 8), 'metall', { rund: 1.4, ...glatt }); for (const v of [-1, 1]) s.form(M.ell(cx + v * 5, platte - 34, 2.6, 2.6), 'glas', { rund: 1, hell: -.2 });
  return m;
}
function zeichneWerkstatt(an) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 230), T = boden - 88;
  kamin(s, L + 18, boden - 172, T - 8);
  bohlen(s, L, T, R, boden - 8, 'holz', -.04); mauer(s, L - 1, boden - 8, R + 1, boden, -.08);
  for (const [x, y, b, h] of [[L + 8, T + 8, 34, 24], [R - 46, T + 38, 36, 28]]) blechFlicken(s, x, y, b, h);
  // Großes Tor, dahinter leuchtet die Werkbank in Lazi-Türkis
  s.form(M.box(cx - 36, boden - 74, 72, 74), 'russ', { rund: 1, hell: -.1 }); s.form(M.box(cx - 30, boden - 34, 60, 5), 'metall', { rund: 1, hell: .1 });
  for (const x of [cx - 26, cx + 22]) s.form(M.box(x, boden - 29, 4, 29), 'metall', { rund: .8, hell: -.08 });
  s.form(M.ell(cx - 4, boden - 40, 9, 5), 'lazi', { rund: 2.4, leuchtet: true, hell: an ? .1 : -.14 }); s.form(M.box(cx - 13, boden - 37, 18, 3), 'stahlAlt', { rund: .6 });
  for (const q of [-20, 14]) s.linie([[cx + q, boden - 74], [cx + q + 3, boden - 50]], 'gurt', {}); s.form(M.ell(cx + 17, boden - 49, 4, 3), 'metall', { rund: 1.4 });
  for (const v of [-1, 1]) s.form(M.box(cx + v * 38 - 4, boden - 78, 8, 78), 'holz', { rund: 1.6, muster: maserung, hell: -.1 });
  dachLang(s, L, R, T, T - 44, 'wellblech', (x, y) => (Math.round(x) % 7 < 2 ? -.2 : .04) + (fbm(x / 14, y / 10) > .66 ? -.14 : 0));
  s.form(M.kap(R - 18, T - 22, R - 18, T - 60, 1.2), 'metall', { rund: .8, hell: .1 }); s.punkt(R - 18, T - 62, 'lazi', { leuchtet: true });
  fass(s, R + 6, boden); for (const [x, y] of [[L - 12, boden - 8], [L - 2, boden - 6]]) s.form(M.box(x, y, 12, 8), 'metall', { rund: 1.4, hell: -.14 });
  return m;
}
function zeichneLabor(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 232), T = boden - 90;
  mauer(s, L, T, R, boden, -.04);
  for (const x of [L + 10, R - 36]) { s.form(M.box(x - 3, T + 16, 32, 36), 'metall', { rund: 1.4, hell: -.08 }); s.form(M.box(x, T + 19, 26, 30), 'lazi', { rund: 0, leuchtet: true, hell: f ? -.05 : -.3, muster: (a, c) => fbm(a / 5, c / 5) * .24 - .14 }); s.form(M.box(x + 12, T + 19, 2, 30), 'metall', { rund: 0 }); }
  tuer(s, cx, boden, 30, 76); s.form(M.box(cx - 19, T + 2, 38, 8), 'metall', { rund: 1, ...glatt });
  dachLang(s, L, R, T, T - 44, 'schiefer', schindelMuster);
  // Rohre, Glaskolben und ein Abzug, der nicht ganz dicht ist
  s.form(M.kap(L + 4, T + 6, L + 4, T - 30, 3.4), 'metall', { rund: 1.6, ...glatt }); s.form(M.box(L - 2, T - 38, 12, 6), 'metall', { rund: 1 }); s.form(M.kap(L + 4, T + 10, R - 6, T + 10, 1.6), 'rost', { rund: 1, rau: .3, korn: 2 });
  s.form(M.box(R + 2, boden - 22, 26, 22), 'holz', { rund: 1.4, muster: maserung }); for (const [x, g] of [[R + 9, 'lazi'], [R + 20, 'gift']]) { s.form(M.oder(M.ell(x, boden - 30, 5, 6), M.box(x - 1.5, boden - 40, 3, 6)), g, { rund: 2, leuchtet: g === 'lazi' }); }
  return m;
}
function zeichneKaserne() {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 224), T = boden - 86;
  kamin(s, L + 30, T - 58, T - 18);
  bohlen(s, L, T, R, boden - 10, 'holz', -.03); mauer(s, L - 1, boden - 10, R + 1, boden, -.04);
  for (const x of [L + 10, L + 34, R - 46, R - 22]) { s.form(M.box(x - 2, T + 18, 16, 8), 'russ', { rund: .6 }); s.form(M.box(x - 3, T + 16, 18, 2.4), 'metall', { rund: .6 }); }
  tuer(s, cx, boden, 34, 76); s.form(M.box(cx - 24, T - 4, 48, 8), 'holz', { rund: 1 });
  dachLang(s, L, R, T, T - 44, 'holz', schindelMuster);
  // Fahnenmast, Waffenständer, Übungspuppe
  s.form(M.box(R + 8, boden - 136, 3, 136), 'holz', { rund: 1 }); s.form(M.poly([[R + 11, boden - 134], [R + 28, boden - 128], [R + 11, boden - 118]]), 'stoffRot', { rund: 1, muster: falten });
  s.form(M.box(L - 18, boden - 36, 16, 3), 'holz', { rund: .8 }); for (const x of [L - 16, L - 10, L - 4]) { s.form(M.kap(x, boden - 2, x + 1, boden - 52, 1), 'holz', { rund: .6 }); s.form(M.poly([[x + 1, boden - 60], [x + 3, boden - 52], [x - 1, boden - 52]]), 'stahlAlt', { rund: .5, ...glatt }); }
  s.form(M.box(R - 2, boden - 40, 3, 40), 'holz', { rund: .8 }); s.form(M.kap(R - 11, boden - 32, R + 9, boden - 32, 1.2), 'holz', { rund: .6 }); s.form(M.ell(R - 1, boden - 28, 7, 10), 'stroh', { rund: 3, rau: .6, korn: 2, hell: -.1 }); s.form(M.ell(R - 1, boden - 44, 5, 5), 'leinen', { rund: 2 });
  oelfass(s, R + 24, boden, 'rostDkl');
  return m;
}
function zeichneSteinhaus() {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 214), T = boden - 84;
  kamin(s, R - 24, boden - 174, T - 14);
  mauer(s, L, T, R, boden, .02); s.form(M.poly([[L, T + 2], [R, T + 2], [cx, T - 40]]), 'stein', { rund: 2, muster: steine, hell: .05 });
  tuer(s, cx, boden - 6, 30, 72); for (let i = 0; i < 2; i++) s.form(M.box(cx - 22 - i * 7, boden - 6 + i * 3, 44 + i * 14, 3.4), 'stein', { rund: 1, hell: .1 });
  for (const x of [L + 10, R - 30]) fenster(s, x, T + 18, 20, 24); fenster(s, cx - 9, T - 24, 18, 16);
  dachGiebel(s, L, R, T - 2, T - 58, 'schiefer', schindelMuster);
  holzstoss(s, R + 2, boden, 3);
  return m;
}
// ---------- Deko ----------
function kleinBlatt(felder, hoch) { const B = felder * 31, rand = 8, m = new Blatt(Math.ceil((B + rand * 2) * 1.7), Math.ceil(hoch * 1.7)); return { m, s: m.skaliert(1.7), L: rand, R: rand + B, cx: rand + B / 2, boden: hoch - 3 }; }
function zeichneBlumenbeet(sd) {
  const { m, s, L, R, cx, boden } = kleinBlatt(2, 48);
  s.form(M.ell(cx, boden - 12, 29, 12), 'erde', { rund: 3, rau: .5, korn: 2 });
  for (let i = 0; i < 22; i++) { const a = hash(i, sd) * 6.28, r = Math.sqrt(hash(i * 3, sd)) * .92, x = cx + Math.cos(a) * 27 * r, y = boden - 12 + Math.sin(a) * 10 * r, h = 5 + hash(i, sd * 2) * 6; s.form(M.kap(x, y, x, y - h, .9), 'gras', { rund: .6, kante: false }); s.form(M.ell(x, y - h, 2.2, 2), ['rot', 'gelb', 'stoffViolett', 'putz'][(i + sd) % 4], { rund: 1 }); }
  return m;
}
function zeichneBank() { const { m, s, L, R, boden } = kleinBlatt(2, 44), a = L + 3, b = R - 3; for (const x of [a + 3, b - 7]) s.form(M.box(x, boden - 14, 4, 14), 'holz', { rund: 1, hell: -.12 }); s.form(M.box(a, boden - 17, b - a, 5), 'holz', { rund: 1.2, muster: maserung, hell: .08 }); for (const y of [boden - 34, boden - 27]) s.form(M.box(a, y, b - a, 4), 'holz', { rund: 1, muster: maserung }); for (const x of [a + 3, b - 7]) s.form(M.box(x, boden - 36, 4, 20), 'holz', { rund: 1, hell: -.1 }); return m; }
function zeichneFahne() { const { m, s, cx, boden } = kleinBlatt(2, 148), x = cx - 16; s.form(M.ell(x, boden - 4, 11, 4), 'stein', { rund: 2 }); s.form(M.box(x - 1.6, boden - 136, 3.2, 134), 'holz', { rund: 1 }); s.form(M.ell(x, boden - 138, 2.6, 2.6), 'gold', { rund: 1 }); s.form(M.poly([[x + 2, boden - 132], [x + 44, boden - 128], [x + 36, boden - 116], [x + 44, boden - 102], [x + 2, boden - 100]]), 'stoffRot', { rund: 2, muster: falten }); s.form(M.ell(x + 18, boden - 116, 6, 7), 'lazi', { rund: 1.6, hell: -.1 }); return m; }
function zeichneWimpel() { const { m, s, L, R, boden } = kleinBlatt(4, 104), a = L + 2, b = R - 4, t = boden - 90; for (const x of [a, b]) { s.form(M.box(x, t, 4, boden - t), 'holz', { rund: 1 }); } const y = u => t + 6 + 26 * (1 - (2 * u - 1) ** 2); for (let u = 0; u < 1; u += .02) s.punkt(a + 2 + (b - a) * u, y(u), 'leinen', {}); ['stoffRot', 'gelb', 'stoffBlau', 'stoffGruen', 'stoffRot', 'gelb', 'stoffBlau'].forEach((f, i) => { const u = (i + .6) / 7.4, x = a + 2 + (b - a) * u, q = y(u); s.form(M.poly([[x - 7, q], [x + 7, q], [x, q + 15]]), f, { rund: 1, muster: falten }); }); return m; }
function zeichneFaesser(sd) { const { m, s, L, R, boden } = kleinBlatt(2, 66); if (sd === 1) { fass(s, L + 14, boden, 26, 12); fass(s, L + 36, boden, 22, 11); s.form(M.box(L + 22, boden - 44, 22, 20), 'holz', { rund: 1.6, muster: (x, y) => Math.round(x) % 7 === 0 ? -.3 : maserung(x, y) }); } else { s.form(M.box(L + 4, boden - 24, 30, 24), 'holz', { rund: 1.6, muster: (x, y) => Math.round(x) % 7 === 0 ? -.3 : maserung(x, y) }); s.form(M.box(L + 8, boden - 42, 22, 18), 'holz', { rund: 1.6, muster: (x, y) => Math.round(x) % 7 === 0 ? -.3 : maserung(x, y), hell: .06 }); fass(s, L + 46, boden, 24, 11); sack(s, L + 58, boden, 6, 10); } return m; }
function zeichneZypresse(sd) { const { m, s, cx, boden } = kleinBlatt(2, 150), h = sd === 1 ? 134 : 116; s.form(M.box(cx - 2.5, boden - 22, 5, 22), 'holz', { rund: 1.4, muster: maserung }); s.form(M.oder(M.ell(cx, boden - h * .42, 15, h * .36), M.poly([[cx - 9, boden - h * .68], [cx + 9, boden - h * .68], [cx, boden - h]])), 'nadel', { rund: 7, rau: .8, korn: 2.2, muster: (x, y) => Math.sin(x * .9 + y * .3) * .12 + .04 }); return m; }
function zeichneRosenbogen() { const { m, s, cx, boden } = kleinBlatt(4, 118), b = 36; for (const v of [-1, 1]) s.form(M.box(cx + v * b - 2, boden - 70, 4, 70), 'holz', { rund: 1 }); s.form((x, y) => { const e = ((x - cx) / (b + 2)) ** 2 + ((y - (boden - 70)) / 30) ** 2; return e <= 1 && e >= .78 && y < boden - 70; }, 'holz', { rund: 1 }); for (let i = 0; i < 34; i++) { const w = hash(i, 1) * 3.14, x = i < 22 ? cx - Math.cos(w) * (b + 1) : cx + (i % 2 ? b : -b), y = i < 22 ? boden - 70 - Math.sin(w) * 29 : boden - 70 + hash(i, 2) * 64; s.form(M.ell(x + hash(i, 3) * 6 - 3, y, 4.4, 3.8), 'blattH', { rund: 1.8, rau: .6, korn: 2 }); if (i % 3 === 0) s.form(M.ell(x + hash(i, 4) * 5 - 2, y, 2.2, 2.2), 'rot', { rund: 1 }); } return m; }
function zeichneBlumenkarren() { const { m, s, L, R, boden } = kleinBlatt(4, 76), a = L + 16, b = R - 18; s.form(M.ell(a + 14, boden - 12, 12, 12), 'holz', { rund: 2, muster: (x, y) => Math.sin(Math.atan2(y - boden + 12, x - a - 14) * 8) * .2 }); s.form(M.ell(a + 14, boden - 12, 3, 3), 'metall', { rund: 1 }); s.form(M.box(a - 2, boden - 36, b - a + 4, 18), 'holz', { rund: 1.6, muster: bohlenMuster }); s.form(M.kap(b, boden - 28, R + 2, boden - 42, 1.6), 'holz', { rund: 1 }); s.form(M.box(b - 2, boden - 18, 3, 18), 'holz', { rund: .8 }); for (let i = 0; i < 26; i++) { const x = a + hash(i, 5) * (b - a), h = 8 + hash(i, 6) * 18; s.form(M.kap(x, boden - 36, x, boden - 36 - h, .9), 'gras', { rund: .6, kante: false }); s.form(M.ell(x, boden - 36 - h, 3, 2.6), ['rot', 'gelb', 'stoffViolett', 'putz'][i % 4], { rund: 1 }); } return m; }
function zeichneMarktstand() { const { m, s, L, R, cx, boden } = kleinBlatt(4, 110), a = L + 4, b = R - 4; for (const x of [a + 2, b - 6]) s.form(M.box(x, boden - 80, 4, 80), 'holz', { rund: 1 }); s.form(M.box(a, boden - 32, b - a, 32), 'holz', { rund: 1.6, muster: bohlenMuster }); s.form(M.box(a - 2, boden - 35, b - a + 4, 4), 'holz', { rund: 1, hell: .1 }); s.form(M.poly([[a - 8, boden - 72], [b + 8, boden - 72], [b, boden - 98], [a, boden - 98]]), 'leinen', { rund: 2, muster: (x, y) => (Math.floor((x - a) / 15) % 2 ? -.18 : .1) + falten(x, y) * .4 }); for (const [x, f] of [[a + 14, 'rotDkl'], [a + 28, 'stroh'], [a + 42, 'blattH'], [a + 58, 'rotDkl'], [a + 72, 'stroh'], [a + 88, 'blattH']]) s.form(M.ell(x, boden - 39, 6, 4.4), f, { rund: 2 }); return m; }
function zeichneLaterne() { const { m, s, cx, boden } = kleinBlatt(2, 118), x = cx; s.form(M.ell(x, boden - 3, 8, 3), 'stein', { rund: 1 }); s.form(M.box(x - 1.6, boden - 84, 3.2, 82), 'metall', { rund: 1, ...glatt }); s.form(M.kap(x, boden - 84, x + 15, boden - 90, 1.3), 'metall', { rund: .8 }); s.form(M.poly([[x + 8, boden - 88], [x + 22, boden - 88], [x + 15, boden - 96]]), 'metall', { rund: 1 }); s.form(M.box(x + 10, boden - 88, 10, 14), 'gelb', { rund: 0, leuchtet: true }); for (const q of [10, 19]) s.form(M.box(x + q, boden - 88, 1.4, 14), 'metall', { rund: 0 }); s.form(M.box(x + 9, boden - 74, 12, 2), 'metall', { rund: .5 }); return m; }
function zeichneDenkmal() { const { m, s, L, R, cx, boden } = bauBlatt(4, 158); for (let i = 0; i < 3; i++) { const b = 72 - i * 18; s.form(M.box(cx - b / 2, boden - 10 - i * 10, b, 10), 'stein', { rund: 1.4, hell: .08 - i * .02, muster: steine }); } s.form(M.poly([[cx - 12, boden - 30], [cx + 12, boden - 30], [cx + 8, boden - 122], [cx, boden - 134], [cx - 8, boden - 122]]), 'stein', { rund: 2.4, hell: .1, muster: (x, y) => fbm(x / 8, y / 12) > .64 ? -.16 : 0 }); for (const y of [-58, -68, -78]) s.linie([[cx - 6, boden + y], [cx + 6, boden + y]], 'stein', { hell: -.34 }); for (const v of [-1, 1]) { s.form(M.ell(cx + v * 42, boden - 8, 12, 7), 'stein', { rund: 3, hell: -.04 }); } s.form(M.ell(cx + 6, boden - 34, 8, 4), 'moos', { rund: 2, rau: .6, korn: 2 }); return m; }
// ---------- Technik aus der alten Welt: Blech, Beton und was noch läuft. Bild „aus“ (f < 0) leuchtet nicht. ----------
const blechMuster = (x, y) => (Math.round(x) % 7 < 2 ? -.2 : .04) + (fbm(x / 14, y / 10) > .66 ? -.14 : 0);
const betonMuster = (x, y) => (fbm(x / 10, y / 10) > .63 ? -.14 : 0) + (Math.round(y) % 26 < 1 ? -.24 : 0) + (hash(Math.floor(x / 3), Math.floor(y / 3)) > .97 ? -.2 : 0);
const beton = (s, x0, y0, x1, y1, hell = 0) => s.form(M.box(x0, y0, x1 - x0, y1 - y0), 'betonGrau', { rund: 2, muster: betonMuster, hell });
const blech = (s, x0, y0, x1, y1, hell = -.06) => s.form(M.box(x0, y0, x1 - x0, y1 - y0), 'wellblech', { rund: 2, muster: blechMuster, hell });
const flachdach = (s, L, R, T) => { s.form(M.box(L - 7, T - 7, R - L + 14, 8), 'metall', { rund: 1.4, hell: -.08 }); s.linie([[L - 6, T - 7], [R + 6, T - 7]], 'metall', { hell: .3 }); };
function lampe(s, x, y, an, farbe = 'lazi', r = 2.4) { s.form(M.ell(x, y, r, r), an ? farbe : 'russ', an ? { rund: 1, leuchtet: true } : { rund: 1 }); }
function stahlTuer(s, cx, boden, b = 32, h = 76) { s.form(M.box(cx - b / 2 - 3, boden - h - 3, b + 6, h + 3), 'metall', { rund: 1.4, hell: -.14 }); s.form(M.box(cx - b / 2, boden - h, b, h), 'stahlAlt', { rund: 1.4, muster: (x, y) => (Math.round(y) % 16 < 1 ? -.3 : 0) + (fbm(x / 8, y / 8) > .68 ? -.14 : 0) }); s.form(M.box(cx + b / 2 - 7, boden - h * .52, 3, 8), 'metall', { rund: .8, hell: .24 }); }
function antenne(s, x, unten, oben, an) { s.form(M.kap(x, unten, x, oben, 1.3), 'metall', { rund: .8, hell: .1 }); for (let i = 1; i < 4; i++) s.linie([[x - 7 + i, oben + i * 8], [x + 7 - i, oben + i * 8]], 'metall', { hell: .14 }); lampe(s, x, oben - 2, an, 'rot', 2); }
function solarPlatte(s, x, y, b = 34) { s.form(M.poly([[x + 6, y], [x + b + 6, y], [x + b, y + 14], [x, y + 14]]), 'blauDkl', { rund: .8, muster: (a, c) => Math.round(a) % 8 < 1 || Math.round(c) % 5 < 1 ? -.3 : .1 }); s.linie([[x + 1, y + 14], [x + b, y + 14]], 'metall', { hell: .3 }); }
function kabel(s, a, b, c, d, durch = 6) { const n = 12, p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([a + (c - a) * t, b + (d - b) * t + Math.sin(t * Math.PI) * durch]); } s.linie(p, 'russ', { hell: .1 }); }
function zeichneKlaeranlage(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 192), T = boden - 82;
  beton(s, cx + 10, T, R, boden); flachdach(s, cx + 10, R, T); stahlTuer(s, cx + 52, boden, 32, 72);
  // Zwei Becken, eins noch trüb, eins schon klarer. Das Rührwerk dreht sich.
  for (const [x, w, c, h] of [[L - 6, 62, 'gift', -.22], [L + 58, 44, 'glas', -.2]]) { s.form(M.ell(x + w / 2, boden - 16, w / 2, 16), 'betonGrau', { rund: 2.4, muster: betonMuster }); s.form(M.ell(x + w / 2, boden - 19, w / 2 - 6, 10), c, { rund: 1, hell: h, muster: (a, q) => Math.sin(a * .7 + q * 1.5 + f * 2) * .12 }); }
  s.form(M.box(L + 21, boden - 66, 4, 48), 'metall', { rund: 1 }); s.form(M.kap(L + 3 + f * 8, boden - 62 + f * 2, L + 43 - f * 8, boden - 62 - f * 2, 1.4), 'metall', { rund: 1, ...glatt });
  s.form(M.kap(L + 44, boden - 20, cx + 10, boden - 30, 2), 'rost', { rund: 1.2 }); s.form(M.kap(cx + 12, T + 18, R - 8, T + 18, 2.4), 'rost', { rund: 1.2, rau: .3, korn: 2 });
  return m;
}
function zeichneAltmetall(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 196), T = boden - 76;
  // Unterstand aus Wellblech, davor der Berg. Mit jeder Stufe wächst er und ordentlicher wird es.
  for (const x of [L + 2, cx + 4]) s.form(M.box(x, T, 6, boden - T), 'metall', { rund: 1.4, hell: -.1 });
  s.form(M.poly([[L - 14, T + 10], [cx + 24, T + 10], [cx + 12, T - 18], [L + 2, T - 18]]), 'wellblech', { rund: 2, muster: blechMuster, hell: -.1 });
  s.form((x, y) => M.ell(cx + 44, boden, 46 + st * 7, 44 + st * 10)(x, y) && y < boden, 'rostDkl', { rund: 6, rau: .9, korn: 2, muster: (x, y) => (hash(Math.floor(x / 6), Math.floor(y / 6)) - .5) * .5 });
  for (let i = 0; i < 8 + st * 3; i++) { const x = cx + 8 + hash(i, 1) * 74, y = boden - 6 - hash(i, 2) * (24 + st * 7), a = hash(i, 3) * 3.14, l = 8 + hash(i, 4) * 10; if (i % 3 === 0) s.form(M.ell(x, y, 6, 6), 'gurt', { rund: 2 }); else s.form(M.kap(x, y, x + Math.cos(a) * l, y - Math.sin(a) * l, 1.6), i % 2 ? 'metall' : 'stahlAlt', { rund: 1, hell: .08 }); }
  s.form(M.box(L + 14, boden - 26, 38, 26), 'rost', { rund: 1.6, muster: blechMuster }); s.form(M.box(L + 11, boden - 29, 44, 4), 'metall', { rund: 1 });
  if (st >= 2) { s.form(M.kap(L + 44, boden, L + 62, T - 26, 2.2), 'gelb', { rund: 1.4, hell: -.2 }); s.form(M.kap(L + 62, T - 26, L + 92, T - 8, 1.6), 'gelb', { rund: 1, hell: -.2 }); s.linie([[L + 92, T - 8], [L + 92, T + 18]], 'russ', {}); s.form(M.ell(L + 92, T + 22, 5, 5), 'metall', { rund: 1.6 }); }
  if (st >= 3) { s.form(M.box(L - 16, boden - 48, 24, 48), 'betonGrau', { rund: 2, muster: betonMuster }); fenster(s, L - 10, boden - 42, 12, 12); }
  return m;
}
function zeichneDepot(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 198), T = boden - 84;
  blech(s, L, T, R, boden); flachdach(s, L, R, T);
  s.form(M.box(cx - 40, boden - 72, 80, 72), 'russ', { rund: 1, hell: -.06 }); for (const y of [boden - 72, boden - 62]) s.form(M.box(cx - 40, y, 80, 8), 'stahlAlt', { rund: 1, hell: .02, muster: (x) => Math.round(x) % 10 < 1 ? -.24 : 0 });
  s.form(M.box(cx - 28, T + 2, 56, 10), 'gelb', { rund: .8, hell: -.1, muster: (x) => Math.round(x / 8) % 2 ? -.5 : 0 });
  // Ein Lastläufer steht im Tor: Laderaum auf Beinen
  s.form(M.box(cx - 24, boden - 44, 40, 24), 'metall', { rund: 2.4, hell: .02 }); s.form(M.ell(cx + 18, boden - 34, 7, 6), 'glas', { rund: 1.6, hell: -.2 }); for (const x of [cx - 20, cx + 8]) { s.form(M.kap(x, boden - 20, x - 2, boden - 4, 2), 'stahlAlt', { rund: 1 }); s.form(M.box(x - 6, boden - 4, 8, 4), 'metall', { rund: 1 }); }
  for (let i = 0; i < 2 + st; i++) s.form(M.box(R + 2, boden - 16 - i * 15, 22, 15), i % 2 ? 'holz' : 'rost', { rund: 1.4, muster: (x, y) => Math.round(x) % 7 === 0 ? -.3 : 0 });
  if (st >= 2) { solarPlatte(s, L + 10, T - 22); solarPlatte(s, R - 50, T - 22); }
  return m;
}
function zeichneLadestation(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 196), an = f >= 0, T = boden - 70;
  beton(s, L - 2, boden - 8, R + 2, boden);
  // Vier Säulen, auf denen eine Platte Strom fängt, ein Stecker für alles, was läuft
  for (const x of [L + 20, R - 38]) { s.form(M.box(x, T, 18, boden - T - 8), 'stahlAlt', { rund: 2, ...glatt }); s.form(M.box(x + 3, T + 6, 12, 18), an ? 'lazi' : 'russ', { rund: .6, leuchtet: an, hell: f > 0 ? .1 : -.1 }); lampe(s, x + 9, T + 32, an); s.form(M.kap(x + 9, T + 44, x + 16, T + 56, 1.4), 'gurt', { rund: 1 }); }
  s.form(M.poly([[L - 12, T - 2], [R + 12, T - 2], [R - 2, T - 26], [L + 2, T - 26]]), 'blauDkl', { rund: 1.2, muster: (a, c) => Math.round(a) % 11 < 1 || Math.round(c) % 8 < 1 ? -.34 : .12 });
  s.form(M.box(L - 12, T - 3, R - L + 24, 3.4), 'metall', { rund: 1, hell: .1 });
  for (const v of [-1, 1]) s.form(M.box(cx + v * 44 - 2, T, 4, boden - T - 8), 'metall', { rund: 1 });
  if (an) for (const x of [cx - 14, cx + 2, cx + 14]) s.punkt(x, boden - 4, 'gelb', { leuchtet: true });
  return m;
}
function zeichneGewaechshaus(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 204), T = boden - 76, an = f >= 0;
  mauer(s, L, boden - 16, R, boden, -.04);
  s.form(M.poly([[L, boden - 16], [L, T], [cx, T - 44], [R, T], [R, boden - 16]]), 'glasDkl', { rund: 1, muster: (x, y) => (fbm(x / 12, y / 12) > .62 ? -.14 : .04) });
  // Grün dahinter, dann die Sprossen. Ein Teil der Scheiben ist durch Blech ersetzt.
  for (let i = 0; i < 16; i++) { const x = L + 8 + i * 11, h = 16 + hash(i, 8) * 34; s.form(M.ell(x, boden - 16 - h / 2, 7, h / 2), i % 3 ? 'moos' : 'blattH', { rund: 3, rau: .7, korn: 2, hell: an ? .03 : -.1 }); if (i % 4 === 1) s.punkt(x, boden - 16 - h + 3, 'rot', {}); }
  s.form((x, y) => M.poly([[L, boden - 16], [L, T], [cx, T - 44], [R, T], [R, boden - 16]])(x, y) && ((Math.round(x - L) % 31 < 2) || (Math.round(boden - y) % 30 < 2)), 'metall', { rund: 0, hell: .05, kante: false });
  s.linie([[L, T], [cx, T - 44], [R, T]], 'metall', { hell: .2 }); s.form(M.box(L, T, R - L, 2.4), 'metall', { rund: .6 });
  blechFlicken(s, R - 62, T + 8, 28, 22); stahlTuer(s, cx, boden, 32, 72);
  if (an) { lampe(s, L + 22, T - 8, 1, 'gelb', 2); lampe(s, R - 22, T - 8, f > 0 ? 1 : 0, 'gelb', 2); }
  return m;
}
function zeichneKrankenstation(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 196), T = boden - 86;
  (st >= 2 ? beton : (q, a, b, c, d) => bohlen(q, a, b, c, d, 'fischHolz'))(s, L, T, R, boden);
  stahlTuer(s, cx, boden, 32, 74); for (const x of [L + 8, R - 26]) fenster(s, x, T + 22, 18, 22);
  s.form(M.box(cx - 15, T + 2, 30, 18), 'putz', { rund: 1, hell: .1 }); s.form(M.oder(M.box(cx - 3, T + 4, 6, 14), M.box(cx - 9, T + 8, 18, 6)), 'rot', { rund: .6 });
  if (st >= 2) { flachdach(s, L, R, T); antenne(s, R - 10, T - 6, T - 36, 1); s.form(M.box(R + 2, boden - 28, 18, 28), 'metall', { rund: 1.6 }); lampe(s, R + 11, boden - 20, 1, 'gelb'); } else s.form(M.poly([[L - 14, T + 6], [R + 14, T + 6], [R, T - 26], [L, T - 26]]), 'wellblech', { rund: 2, muster: blechMuster, hell: -.1 });
  s.form(M.box(L - 18, boden - 14, 20, 4), 'stoffHell', { rund: 1 }); for (const x of [L - 16, L - 2]) s.form(M.box(x, boden - 10, 2, 10), 'metall', { rund: .4 });
  return m;
}
function zeichneBunkerfunk(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 236), an = f >= 0, T = boden - 74;
  // Betonkuppe im Boden, die Stahltür führt nach unten. Oben ragt, was vom Funk übrig ist.
  s.form(M.oder(M.box(L, T + 14, R - L, boden - T - 14), M.poly([[L, T + 15], [L + 20, T - 4], [R - 20, T - 4], [R, T + 15]])), 'betonGrau', { rund: 3, muster: betonMuster });
  stahlTuer(s, cx, boden, 32, 72); s.form(M.box(cx - 22, T - 2, 44, 6), 'gelb', { rund: .6, hell: -.2, muster: (x) => Math.round(x / 7) % 2 ? -.5 : 0 });
  antenne(s, R - 20, T - 2, boden - 182, an); antenne(s, L + 16, T - 2, boden - 118, an);
  s.form(M.ell(cx - 12, T - 18, 16, 8), 'metall', { rund: 2, hell: .06, ...glatt }); s.form(M.box(cx - 13, T - 12, 3, 10), 'metall', { rund: .6 });
  lampe(s, cx + 22, T + 22, an, 'lazi'); lampe(s, cx - 22, T + 22, f > 0, 'gelb');
  return m;
}
function zeichneWohnblock(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 322), an = f >= 0, T = boden - 262;
  // Vier Geschosse Beton, alt und voller Risse. Wer dort lebt, hat seine Fenster selbst geflickt.
  beton(s, L, T, R, boden); flachdach(s, L, R, T);
  for (let g = 0; g < 4; g++) for (const [i, x] of [L + 8, L + 49, L + 90].entries()) { const y = T + 12 + g * 60, kaputt = (g + i) % 5 === 4, licht = an && (g * 2 + i) % 3 !== 1; if (g === 3 && i === 1) continue; if (kaputt) { s.form(M.box(x, y, 26, 30), 'holz', { rund: 1, muster: bohlenMuster }); } else { s.form(M.box(x, y, 26, 30), licht ? 'gelb' : 'russ', licht ? { rund: 0, leuchtet: true, muster: (a, c) => fbm(a / 4, c / 4) * .2 - .2 } : { rund: 0 }); s.form(M.box(x + 12, y, 2, 30), 'metall', { rund: 0 }); s.form(M.box(x - 2, y + 30, 30, 3), 'betonGrau', { rund: 1, hell: .14 }); } }
  stahlTuer(s, cx, boden, 32, 74); s.form(M.box(cx - 24, boden - 86, 48, 5), 'betonGrau', { rund: 1, hell: .12 });
  s.linie([[L + 12, T + 2], [L + 26, T + 44], [L + 18, T + 80], [L + 34, T + 120]], 'russ', { hell: .08 });
  s.form(M.kap(R - 6, T + 8, R - 6, boden - 6, 2), 'rost', { rund: 1, rau: .3, korn: 2 }); s.linie([[L + 2, T + 48], [R - 2, T + 54]], 'leinen', {}); for (const x of [L + 16, L + 28, L + 56]) s.form(M.box(x, T + 50, 8, 11), ['stoffRot', 'putz', 'stoffBlau'][x % 3], { rund: .6, muster: falten });
  solarPlatte(s, L + 8, T - 22, 30); if (an) lampe(s, R - 16, T - 14, 1, 'rot', 2);
  return m;
}
function zeichneMontagehalle(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(6, 222), an = f >= 0, T = boden - 96;
  blech(s, L, T, R, boden); s.form(M.poly([[L - 6, T + 2], [R + 6, T + 2], [R - 16, T - 34], [L + 16, T - 34]]), 'wellblech', { rund: 2, muster: blechMuster, hell: -.14 });
  for (let i = 0; i < 4; i++) s.form(M.box(L + 26 + i * 36, T - 28, 22, 14), an ? 'lazi' : 'russ', { rund: .6, leuchtet: an, hell: -.2 });
  s.form(M.box(cx - 54, boden - 78, 108, 78), 'russ', { rund: 1, hell: -.04 });
  // Kran, Fließband, ein halber Roboter auf dem Band
  s.form(M.box(cx - 54, boden - 78, 108, 4), 'gelb', { rund: .6, hell: -.2 }); s.form(M.box(cx + 18, boden - 74, 7, 8), 'metall', { rund: 1 }); s.linie([[cx + 21, boden - 66], [cx + 21, boden - 48]], 'gurt', {}); s.form(M.poly([[cx + 16, boden - 48], [cx + 26, boden - 48], [cx + 28, boden - 40], [cx + 14, boden - 40]]), 'metall', { rund: .8 });
  s.form(M.box(cx - 50, boden - 18, 100, 7), 'stahlAlt', { rund: 1.2, muster: (x) => Math.round(x) % 6 < 2 ? -.3 : 0 }); for (const x of [cx - 44, cx + 40]) s.form(M.box(x, boden - 11, 5, 11), 'metall', { rund: .8 });
  s.form(M.oder(M.box(cx - 8, boden - 42, 22, 24), M.ell(cx + 3, boden - 42, 9, 7)), 'gelb', { rund: 2, hell: -.16 }); lampe(s, cx + 6, boden - 44, an);
  s.form(M.box(R + 2, boden - 20, 24, 20), 'metall', { rund: 1.4, hell: -.06 }); kabel(s, R, T + 40, R + 16, boden - 20, 8);
  return m;
}
function zeichneRobotergarage(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 176), T = boden - 76;
  (st >= 2 ? beton : blech)(s, L, T, R, boden); flachdach(s, L, R, T);
  s.form(M.box(cx - 42, boden - 64, 84, 64), 'russ', { rund: 1, hell: -.04 }); s.form(M.box(cx - 42, T + 2, 84, 7), 'gelb', { rund: .6, hell: -.1, muster: (x) => Math.round(x / 8) % 2 ? -.5 : 0 });
  // Ein gelber Wartungsroboter, klein und piepend
  s.form(M.oder(M.box(cx - 13, boden - 34, 26, 24), M.ell(cx, boden - 34, 13, 9)), 'metall', { rund: 3, hell: -.12 }); for (const v of [-1, 1]) { lampe(s, cx + v * 6, boden - 32, 1); s.form(M.box(cx + v * 11 - 3, boden - 10, 6, 10), 'metall', { rund: 1 }); s.form(M.kap(cx + v * 13, boden - 26, cx + v * 18, boden - 14, 1.6), 'metall', { rund: 1 }); }
  if (st >= 2) { s.form(M.box(R + 2, boden - 40, 18, 40), 'metall', { rund: 1.6 }); lampe(s, R + 11, boden - 30, 1, 'gelb'); kabel(s, R, T + 14, R + 11, boden - 40, 4); }
  return m;
}
function zeichneAusschlachterei(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 178), T = boden - 70;
  blech(s, L + 2, T, R - 2, boden, -.14);
  s.form(M.poly([[L - 12, T + 8], [R + 12, T + 8], [R - 4, T - 18], [L + 4, T - 18]]), 'rost', { rund: 2, rau: .3, korn: 2, muster: blechMuster });
  // Am Haken hängt, was einmal gelaufen ist: Beine und ein Gehäuse. Darunter Kisten voller Teile.
  s.form(M.box(cx - 34, boden - 62, 68, 62), 'russ', { rund: 1, hell: -.04 }); s.linie([[cx, T + 8], [cx, boden - 50]], 'gurt', {});
  s.form(M.box(cx - 13, boden - 50, 26, 20), 'metall', { rund: 2, hell: .03 }); s.form(M.ell(cx - 4, boden - 40, 3, 3), 'russ', { rund: 1 }); for (const v of [-1, 1]) s.form(M.kap(cx + v * 9, boden - 30, cx + v * 12, boden - 12, 1.8), 'stahlAlt', { rund: 1 });
  for (const [x, f] of [[L - 12, 'holz'], [R - 4, 'rost']]) { s.form(M.box(x, boden - 18, 22, 18), f, { rund: 1.4, muster: (a) => Math.round(a) % 7 === 0 ? -.3 : 0 }); s.form(M.ell(x + 11, boden - 21, 9, 4), 'metall', { rund: 2, rau: .8, korn: 2 }); }
  if (st >= 2) { s.form(M.box(R + 8, boden - 44, 16, 26), 'stahlAlt', { rund: 1.6 }); lampe(s, R + 16, boden - 36, 1, 'feuer'); s.form(M.kap(R + 16, boden - 44, R + 22, boden - 62, 1.1), 'metall', { rund: .6 }); }
  return m;
}
function gitterTurm(s, cx, boden, oben, b0, b1) {
  for (const v of [-1, 1]) s.form(M.kap(cx + v * b0, boden, cx + v * b1, oben, 2), 'stahlAlt', { rund: 1.2, ...glatt });
  let y = boden - 6, i = 0; while (y > oben + 10) { const t0 = (boden - y) / (boden - oben), w0 = b0 + (b1 - b0) * t0, y1 = y - 26, t1 = (boden - y1) / (boden - oben), w1 = b0 + (b1 - b0) * t1; s.linie([[cx - w0, y], [cx + w1, y1]], 'metall', { hell: .1 }); s.linie([[cx + w0, y], [cx - w1, y1]], 'metall', { hell: .1 }); s.linie([[cx - w1, y1], [cx + w1, y1]], 'metall', { hell: .1 }); y = y1; i++; }
}
function zeichneSignalturm(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 366), an = f >= 0, oben = boden - 310;
  beton(s, cx - 30, boden - 12, cx + 30, boden); gitterTurm(s, cx, boden - 10, oben, 26, 6);
  for (const y of [oben + 26, oben + 74]) { s.form(M.box(cx - 13, y, 26, 5), 'stahlAlt', { rund: 1, ...glatt }); }
  s.form(M.ell(cx + 12, oben + 44, 11, 15), 'metall', { rund: 2.4, ...glatt, hell: .08 }); s.form(M.ell(cx + 10, oben + 44, 7, 11), 'stahlAlt', { rund: 2, hell: -.2 });
  s.form(M.kap(cx, oben, cx, oben - 30, 1.2), 'metall', { rund: .8, hell: .1 }); lampe(s, cx, oben - 33, an, 'rot', 3);
  s.form(M.box(cx - 44, boden - 30, 24, 22), 'metall', { rund: 1.6, hell: -.04 }); lampe(s, cx - 32, boden - 22, an);
  return m;
}
function zeichneStoersender(st) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 244), oben = boden - 184;
  blech(s, L + 8, boden - 40, R - 8, boden, -.12); gitterTurm(s, cx, boden - 38, oben, 16, 4);
  // Ein Gerät, das nichts sendet außer Lärm: Drahtschlaufen, Blechteller, ein Stück Herd
  for (let i = 0; i < 3; i++) s.form(M.ell(cx + (i % 2 ? 14 : -14), oben + 26 + i * 26, 11, 4), 'wellblech', { rund: 1.6, hell: .02 });
  lampe(s, cx, oben - 4, 1, 'rot', 2.4);
  if (st >= 2) { s.form(M.box(R - 6, boden - 62, 28, 62), 'metall', { rund: 1.6, hell: -.08 }); for (const y of [50, 36, 22]) lampe(s, R + 8, boden - y, 1, y === 36 ? 'lazi' : 'rot', 1.8); kabel(s, R - 6, boden - 48, cx + 10, oben + 60, 12); } else { kabel(s, R - 8, boden - 30, R + 18, boden - 2, 6); fass(s, R + 18, boden, 20, 9); }
  stahlTuer(s, cx, boden, 26, 36);
  return m;
}
function zeichneFunkturm(f) {
  const { m, s, cx, boden } = bauBlatt(4, 320), oben = boden - 270;
  mauer(s, cx - 34, boden - 10, cx + 34, boden); gitterTurm(s, cx, boden - 8, oben, 28, 5);
  for (const v of [-1, 1]) s.linie([[cx, oben + 40], [cx + v * 62, boden]], 'stein', { hell: .1 });
  s.form(M.box(cx - 24, boden - 84, 48, 76), 'holz', { rund: 2, muster: bohlenMuster }); tuer(s, cx, boden - 8, 30, 72); lampe(s, cx + 18, boden - 58, 1, f ? 'gelb' : 'glut', 2);
  for (const y of [oben + 12, oben + 30]) s.linie([[cx - 16, y], [cx + 16, y]], 'metall', { hell: .3 }); s.form(M.kap(cx, oben, cx, oben - 24, 1.1), 'metall', { rund: .6, hell: .2 }); lampe(s, cx, oben - 26, 1, 'rot', 2.6 + (f ? .5 : 0));
  return m;
}
function zeichneVerbundterminal(f) {
  const { m, s, L, R, cx, boden } = bauBlatt(4, 188), an = f >= 0, T = boden - 80;
  beton(s, L - 2, boden - 10, R + 2, boden);
  s.form(M.poly([[cx - 26, boden - 10], [cx + 26, boden - 10], [cx + 20, T], [cx - 20, T]]), 'stahlAlt', { rund: 2.4, ...glatt });
  s.form(M.box(cx - 32, T - 40, 64, 42), 'metall', { rund: 2.4, ...glatt }); s.form(M.box(cx - 26, T - 34, 52, 30), an ? 'lazi' : 'russ', { rund: .8, leuchtet: an, hell: -.14, muster: (x, y) => Math.round(y) % 4 < 1 ? -.24 : 0 });
  if (an) for (const [y, w] of [[-30, 28 + f * 8], [-24, 18], [-18, 34 - f * 8], [-12, 12]]) s.form(M.box(cx - 22, T + y, w, 2), 'lazi', { rund: 0, leuchtet: true, hell: .4, kante: false });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) s.form(M.box(cx - 15 + i * 6.4, T + 8 + j * 7, 4.6, 4.6), 'gurt', { rund: 1, hell: .1 });
  for (const v of [-1, 1]) { s.form(M.box(cx + v * 46 - 9, boden - 56, 18, 46), 'metall', { rund: 1.6, hell: -.06 }); lampe(s, cx + v * 46, boden - 46, an, 'lazi'); kabel(s, cx + v * 37, boden - 34, cx + v * 24, boden - 22, 4); }
  antenne(s, R - 6, T - 40, T - 90, an);
  return m;
}
const BAUTEN = { lagerfeuer: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => () => ({ bild: () => zeichneFeuer(i / 12 * Math.PI * 2, .85) })), klaeranlage: [0, 1].map(q => () => zeichneKlaeranlage(q)), altmetall: [1, 2, 3].map(q => () => zeichneAltmetall(q)), lastlaeuferdepot: [1, 2].map(q => () => zeichneDepot(q)), ladestation: [-1, 0, 1].map(q => () => zeichneLadestation(q)), gewaechshaus: [-1, 0, 1].map(q => () => zeichneGewaechshaus(q)), krankenstation: [1, 2].map(q => () => zeichneKrankenstation(q)), bunkerfunk: [-1, 0, 1].map(q => () => zeichneBunkerfunk(q)), wohnblock: [-1, 0].map(q => () => zeichneWohnblock(q)), montagehalle: [-1, 0].map(q => () => zeichneMontagehalle(q)), robotergarage: [1, 2].map(q => () => zeichneRobotergarage(q)), ausschlachterei: [1, 2].map(q => () => zeichneAusschlachterei(q)), signalturm: [-1, 0, 1].map(q => () => zeichneSignalturm(q)), stoersender: [1, 2].map(q => () => zeichneStoersender(q)), funkturm: [0, 1].map(q => () => zeichneFunkturm(q)), verbundterminal: [-1, 0, 1].map(q => () => zeichneVerbundterminal(q)), kirche: [zeichneKirche], rathaus: [1, 2, 3].map(q => () => zeichneRathaus(q)), baeckerei: [0, 1].map(q => () => zeichneBaeckerei(q)), archiv: [1, 2].map(q => () => zeichneArchiv(q)), fischerhuette: [1, 2, 3].map(q => () => zeichneFischerhuette(q)), kraeutergarten: [1, 2].map(q => () => zeichneKraeutergarten(q)), spaeherposten: [1, 2].map(q => () => zeichneSpaeherposten(q)), werkstatt: [1, 0].map(q => () => zeichneWerkstatt(q)), labor: [1, 0].map(q => () => zeichneLabor(q)), kaserne: [zeichneKaserne], steinhaus: [zeichneSteinhaus], blumenbeet: [1, 2, 3].map(q => () => zeichneBlumenbeet(q)), bank: [zeichneBank], fahne: [zeichneFahne], wimpel: [zeichneWimpel], faesser: [1, 2].map(q => () => zeichneFaesser(q)), zypresse: [1, 2].map(q => () => zeichneZypresse(q)), rosenbogen: [zeichneRosenbogen], blumenkarren: [zeichneBlumenkarren], marktstand: [zeichneMarktstand], laterne: [zeichneLaterne], denkmal: [zeichneDenkmal], lager: [zeichneLager], wirtshaus: [zeichneWirtshaus], holzfaeller: [zeichneHolzfaeller], steinmetz: [zeichneSteinmetz], bauernhof: [zeichneBauernhof], schmiede: [() => zeichneSchmiede(true), () => zeichneSchmiede(false)], brunnen: [zeichneBrunnen], wachturm: [zeichneWachturm], koehlerei: [() => zeichneKoehlerei(0), () => zeichneKoehlerei(1)] };
const FIGUREN = {
  held: { ruhe: true, vorne: heldVorne, hinten: heldHinten, seite: heldSeite },
  schild: { vorne: schildVorne, hinten: schildHinten, seite: schildSeite },
  wolf: { vorne: wolfVorne, hinten: wolfHinten, seite: wolfSeite },
};
const zeichneHeld = () => heldVorne(1), zeichneSchild = () => schildVorne(1), zeichneWolf = () => wolfSeite(1);

Object.assign(FARBEN, { hautAlt: ['#2a1712', '#5b3527', '#8a5a42', '#b3866a'], schal: ['#160d20', '#2c1a3e', '#48285f', '#6a3f85'] });
NAMEN.length = 0; NAMEN.push(...Object.keys(FARBEN));
// Die übrigen Klassen: gleicher Körperbau und Gang wie der Schwertkämpfer, eigene Kleidung und Waffen
// Schritt je Bild 16 Pixel bei 5,4 Bildern je Sekunde: Das sind genau die 2 Einheiten je Sekunde, mit denen die Leute gehen
const GANG_LEUTE = { fuss: [8, 0, -8, -4, 0], fussHinten: [8, -4, -8, 0, 0], hand: [-6, 0, 6, 0, 0], hub: [1, 0, 1, 0, 0] };
const BEIN_LEUTE = [{ x: 16, y: 0, knie: 2 }, { x: 1, y: 0, knie: 1 }, { x: -16, y: -1, knie: 2 }, { x: -2, y: -8, knie: 9 }, { x: 3, y: 0, knie: 1 }, { x: -3, y: 0, knie: 1 }];
function klasseFigur(ansicht, p, K) {
  const frei = K.frei && !K.griff, GA = K.frei ? GANG_LEUTE : GANG, BE = K.frei ? BEIN_LEUTE : BEIN;
  // Die Leute bekommen unten mehr Platz: Der vordere Fuß reicht beim Gehen tiefer als bei den Helden
  const m = new Blatt(84, K.frei ? 128 : 116), b = GA.hub[p] || 0, hA = GA.hand[p] || 0, hB = p === 4 ? 0 : GA.hand[(p + 2) % 4], sw = [2, 0, -2, 0][p] || 0, d = K.dick || 1, ax = K.frei ? K.schmal || 2 : 0;
  K.phase = p;
  const ua = (x0, y0, x1, y1, r, hell = 0) => { m.form(M.kap(x0, y0, x1, y1, r * d * (K.frei && K.unterarm ? .78 : 1)), K.unterarm || K.arm, K.frei && !K.unterarm ? { rund: 2.6, hell, kante: false } : { rund: 2.6, hell }); if (K.band) for (const t of [.4, .75]) m.form(M.ell(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r * d + .4, 1.3), K.band, { rund: 1, hell }); };
  const stiefel = (x, y, h = 0) => { m.form(M.oder(M.ell(x, y - 1, 5.4 * d, 3.8), M.box(x - 4.4 * d, y - 11, 8.8 * d, 10)), K.stiefel, { rund: 2.2, hell: h }); m.linie([[x - 4.4 * d, y - 11], [x + 4.4 * d, y - 11]], K.stiefel, { hell: h + .3 }); };
  if (ansicht === 'seite') {
    const hx = 38, N = BE[p], F = p === 4 ? BE[5] : BE[(p + 2) % 4], arm = (K.frei ? [-10, 0, 10, 0] : [-4, 0, 4, 0])[p] || 0;
    if (K.zweite) K.zweite(m, 'seite', hx - arm, 64 + b, -.18);
    m.form(M.kap(hx, 37 + b, hx - arm * .5, 49 + b, 3.6 * d), K.arm, { rund: 3, hell: -.18 }); ua(hx - arm * .5, 49 + b, hx - arm, 60 + b, 3.4, -.18); m.form(M.ell(hx - arm, 63 + b, 3.6, 4), K.hand, { rund: 2, hell: -.16 });
    const bs = (B, hell) => { const fx = hx + B.x, fy = 110 + B.y; m.form(M.kap(hx, 60 + b, (hx + fx) / 2 + B.knie, 84 + b + B.y * .5, 5.8 * d), K.hose, { rund: 4, hell, rau: .12 }); m.form(M.kap((hx + fx) / 2 + B.knie, 84 + b + B.y * .5, fx, fy - 8, 4.6 * d), K.hose, { rund: 3, hell, rau: .12 }); m.form(M.oder(M.ell(fx + 2.2, fy - 1.6, 6.4 * d, 2.8), M.box(fx - 3.6, fy - 11, 7.6 * d, 10)), K.stiefel, { rund: 2, hell }); };
    bs(F, -.2);
    if (K.hinten) K.hinten(m, 'seite', b, sw, hx);
    bs(N, 0);
    K.rumpf(m, 'seite', b, sw, hx);
    const hd = K.pose ? hx + K.pose.x : frei ? hx + 2 + arm : hx + 10 + arm * .3, hy = K.pose ? K.pose.y : frei ? 63 + b : 57 + b;
    K.waffe(K.pose ? gedreht(m, hd, hy, K.pose.w) : m, 'seite', hd, hy, b);
    { const ex = K.pose ? hx + 1 + K.pose.ex : frei ? hx + 1 + arm * .5 : hx + 2 + arm * .3, ey = K.pose ? K.pose.ey : 50 + b; m.form(M.kap(hx + 1, 37 + b, ex, ey, 3.9 * d), K.arm, { rund: 3 }); ua(ex, ey, hd, hy, 3.8); } m.form(M.ell(hd, hy, 4.2, 4.2), K.hand, { rund: 2.2 });
    if (K.vorn) K.vorn(m, 'seite', hd, hy, b);
    K.schulter(m, 'seite', hx - 2, 31 + b); K.kopf(m, 'seite', b, 38);
    return m;
  }
  const hinten = ansicht === 'hinten', fL = (hinten ? GA.fussHinten : GA.fuss)[p], fR = (hinten ? GA.fussHinten : GA.fuss)[p === 4 ? 4 : (p + 2) % 4];
  // Von vorne schwingt die Hand gegen den Fuß derselben Seite
  const hL = hA, hR = hB;
  if (!hinten && K.hinten) K.hinten(m, 'vorne', b, sw, 42);
  if (hinten) K.waffe(m, 'hinten', 59 - ax, frei ? 63 + b + hB : 56 + b + hB * .4, b);
  const bein = (hx, fx, f) => { m.form(M.kap(hx, 60 + b, (hx + fx) / 2, 84 + b, 6 * d), K.hose, { rund: 4, rau: .12 }); m.form(M.kap((hx + fx) / 2, 84 + b, fx, 100 + f, 4.8 * d), K.hose, { rund: 3, rau: .12 }); stiefel(fx, 110 + f); };
  bein(36, 33, fL); bein(48, 51, fR);
  if (hinten) {
    // Die Waffenhand liegt rechts im Bild und vor dem Körper. Zu sehen sind Ellbogen und was über den Körper ragt.
    const gx = 59 - ax, gy = frei ? 63 + b + hB : 56 + b + hB * .4, ex = frei ? 59 - ax : K.griff ? 60 - ax : 63 - ax;
    m.form(M.kap(57 - ax, 37 + b, ex, 49 + b, 3.9 * d), K.arm, { rund: 3 }); ua(ex, 50 + b, gx, gy, 3.8); m.form(M.ell(gx, gy, 4, 4.2), K.hand, { rund: 2.2 });
    m.form(M.kap(27 + ax, 37 + b, 25 + ax, 49 + b, 3.9 * d), K.arm, { rund: 3 }); ua(25 + ax, 49 + b, 25 + ax, 60 + b + hA, 3.8); if (K.zweite) K.zweite(m, 'hinten', 25, 65 + b + hA, 0);
    m.form(M.ell(25 + ax, 63 + b + hA, 4, 4.4), K.hand, { rund: 2.2 });
    K.rumpf(m, 'hinten', b, sw, 42);
    // Umhang und Sack liegen über den Schultern der Leute
    if (K.frei) { K.schulter(m, 'vorne', 28 + ax, 31 + b); K.schulter(m, 'vorne', 56 - ax, 31 + b); if (K.hinten) K.hinten(m, 'hinten', b, sw, 42); } else { if (K.hinten) K.hinten(m, 'hinten', b, sw, 42); K.schulter(m, 'vorne', 28 + ax, 31 + b); K.schulter(m, 'vorne', 56 - ax, 31 + b); }
    K.kopf(m, 'hinten', b, 42);
    return m;
  }
  K.rumpf(m, 'vorne', b, sw, 42);
  // Freier Arm rechts im Bild, Waffenarm links im Bild und gebeugt
  m.form(M.kap(57 - ax, 37 + b, 59 - ax, 49 + b, 3.9 * d), K.arm, { rund: 3 }); ua(59 - ax, 49 + b, 59 - ax, 60 + b + hR, 3.8); if (K.zweite) K.zweite(m, 'vorne', 59, 65 + b + hR, 0);
  m.form(M.ell(59 - ax, 63 + b + hR, 4, 4.4), K.hand, { rund: 2.2 });
  const gx = 25 + ax, gy = frei ? 63 + b + hL : 56 + b + hL * .4, ex = frei ? 25 + ax : K.griff ? 24 + ax : 21 + ax;
  m.form(M.kap(27 + ax, 37 + b, ex, 49 + b, 3.9 * d), K.arm, { rund: 3 }); ua(ex, 50 + b, gx, gy, 3.8);
  K.schulter(m, 'vorne', 28 + ax, 31 + b); K.schulter(m, 'vorne', 56 - ax, 31 + b);
  K.waffe(m, 'vorne', gx, gy, b); m.form(M.ell(gx, gy, 4.2, 4.2), K.hand, { rund: 2.2 });
  if (K.vorn) K.vorn(m, 'vorne', gx, gy, b);
  K.kopf(m, 'vorne', b, 42);
  return m;
}
// ---------- Golem-Beschwörer: langer Mantel, Techno-Stab, Energiezellen auf dem Rücken ----------
const BESCHWOERER = { hose: 'hose', stiefel: 'rindsleder', arm: 'mantel', hand: 'gurt',
  hinten(m, a, b, sw, c) {
    if (a === 'vorne') { m.form(M.box(c - 11, 21 + b, 22, 9), 'metall', { rund: 2, hell: -.08 }); m.form(M.kap(c + 11, 22 + b, c + 16, 10 + b, .9), 'metall', { rund: .6 }); m.punkt(c + 16, 9 + b, 'lazi', { leuchtet: true }); return; }
    if (a === 'seite') { m.form(M.box(c - 15, 28 + b, 12, 24), 'metall', { rund: 2, hell: -.06 }); for (const y of [34, 44]) m.form(M.ell(c - 9, y + b, 2.8, 2.8), 'lazi', { rund: 1.4, leuchtet: true }); m.form(M.kap(c - 10, 28 + b, c - 14, 13 + b, .9), 'metall', { rund: .6 }); m.punkt(c - 14, 12 + b, 'lazi', { leuchtet: true }); return; }
    m.form(M.box(c - 12, 30 + b, 24, 27), 'metall', { rund: 2.4, hell: -.03 }); m.form(M.box(c - 9, 33 + b, 18, 21), 'stahlAlt', { rund: 1.4, hell: -.14 });
    for (const y of [38, 48]) { m.form(M.ell(c - 4, y + b, 2.9, 2.9), 'lazi', { rund: 1.4, leuchtet: true }); m.form(M.ell(c + 4, y + b, 2.9, 2.9), 'lazi', { rund: 1.4, leuchtet: true }); }
    m.linie([[c - 11, 30 + b], [c - 16, 14 + b]], 'metall', {}); m.punkt(c - 16, 13 + b, 'lazi', { leuchtet: true }); m.form(M.box(c - 15, 30 + b, 3, 22), 'gurt', { rund: 1 }); m.form(M.box(c + 12, 30 + b, 3, 22), 'gurt', { rund: 1 });
  },
  rumpf(m, a, b, sw, c) {
    if (a === 'seite') { m.form(M.poly([[c - 7, 30 + b], [c + 7, 30 + b], [c + 10, 50 + b], [c + 13 + sw, 90 + b], [c + 5 + sw, 94 + b], [c - 2 + sw, 90 + b], [c - 13 + sw, 95 + b], [c - 9, 50 + b]]), 'mantel', { rund: 4, muster: falten, hell: .05 }); m.form(M.box(c - 8, 58 + b, 17, 4), 'rindsleder', { rund: 1 }); m.form(M.box(c + 2, 57 + b, 5, 6), 'metall', { rund: 1, hell: .1 }); m.punkt(c + 4, 60 + b, 'lazi', { leuchtet: true }); return; }
    const hem = [[c + 15 + sw, 90 + b], [c + 7 + sw, 94 + b], [c - 1 + sw, 90 + b], [c - 8 + sw, 95 + b], [c - 15 + sw, 90 + b]];
    m.form(M.poly([[c - 13, 30 + b], [c + 13, 30 + b], [c + 11, 52 + b], ...hem, [c - 11, 52 + b]]), 'mantel', { rund: 4, muster: falten, hell: .05 });
    if (a === 'vorne') { m.linie([[c, 32 + b], [c, 92 + b]], 'mantel', { hell: -.36 }); for (let y = 36; y < 56; y += 6) m.punkt(c + 2, y + b, 'metall', { hell: .3 }); m.form(M.poly([[c - 10, 31 + b], [c, 31 + b], [c - 1, 46 + b], [c - 7, 44 + b]]), 'mantel', { rund: 2, hell: .13 }); m.form(M.poly([[c + 10, 31 + b], [c, 31 + b], [c + 1, 46 + b], [c + 7, 44 + b]]), 'mantel', { rund: 2, hell: .1 }); }
    m.form(M.box(c - 11, 58 + b, 22, 4), 'rindsleder', { rund: 1 }); if (a === 'vorne') { m.form(M.box(c - 3, 57 + b, 6, 6), 'metall', { rund: 1, hell: .1 }); m.punkt(c, 60 + b, 'lazi', { leuchtet: true }); m.form(M.ell(c + 8, 66 + b, 3.4, 4.4), 'rindsleder', { rund: 2 }); }
  },
  schulter(m, a, x, y) { m.form(M.ell(x, y + 1, 7, 5.2), 'mantel', { rund: 3, hell: .1, rau: .12 }); m.linie([[x - 5, y + 3], [x + 5, y + 3]], 'mantel', { hell: -.26 }); },
  waffe(m, a, x, y, b) {
    const s = a === 'hinten' ? 1 : a === 'seite' ? 1 : -1, oben = [x + s * 3, y - 47], unten = [x - s * 2, 110];
    m.form(M.kap(unten[0], unten[1], oben[0], oben[1], 1.5), 'metall', { rund: 1, hell: .04 });
    for (const q of [-1, 1]) m.linie([[oben[0], oben[1] + 5], [oben[0] + q * 4, oben[1] + 1], [oben[0] + q * 4, oben[1] - 4]], 'metall', { hell: .22 });
    m.form(M.poly([[oben[0], oben[1] - 7], [oben[0] + 2.6, oben[1] - 2], [oben[0], oben[1] + 3], [oben[0] - 2.6, oben[1] - 2]]), 'lazi', { rund: 1, leuchtet: true, kante: false });
    if (a !== 'hinten') for (const t of [.22, .3]) { const px = x + s * 3 * (1 - t * 2), py = y - 52 * t * 2; m.punkt(px, py, 'lazi', { leuchtet: true }); }
  },
  kopf(m, a, b, c) {
    m.form(M.poly([[c - 9, 25 + b], [c + 9, 25 + b], [c + 11, 32 + b], [c - 11, 32 + b]]), 'mantel', { rund: 2, hell: .06, rau: .15 });
    m.form(M.ell(c, 16 + b, 8, 9.4), 'mantel', { rund: 5, hell: .1, rau: .2, korn: 3 });
    if (a === 'hinten') { m.linie([[c, 8 + b], [c, 26 + b]], 'mantel', { hell: -.24 }); return; }
    if (a === 'seite') { m.form(M.ell(c + 3, 17 + b, 4.6, 6.4), 'russ', { rund: 2, hell: -.25, kante: false }); m.form(M.ell(c + 5.4, 16 + b, 1.5, 1.2), 'lazi', { rund: 1, leuchtet: true, kante: false }); return; }
    m.form(M.ell(c, 17 + b, 5.4, 6.8), 'russ', { rund: 2, hell: -.25, kante: false }); for (const q of [-2.4, 2.4]) m.form(M.ell(c + q, 16 + b, 1.5, 1.2), 'lazi', { rund: 1, leuchtet: true, kante: false }); m.linie([[c - 4, 20.6 + b], [c + 4, 20.6 + b]], 'mantel', { hell: -.1 });
  } };
// ---------- Architekt: Arbeitskleidung, Lederschürze, Werkzeuggürtel, schwerer Hammer ----------
const ARCHITEKT = { hose: 'hose', stiefel: 'rindsleder', arm: 'leinen', unterarm: 'hautAlt', band: 'rindsleder', hand: 'rindsleder', dick: 1.05,
  hinten(m, a, b, sw, c) {
    if (a === 'hinten') { m.form(M.kap(c + 11, 30 + b, c - 12, 60 + b, 3.4), 'leinen', { rund: 2, hell: .12 }); for (const t of [.2, .8]) m.form(M.kap(c + 11 - 23 * t - 2, 30 + b + 30 * t - 2, c + 11 - 23 * t + 2.4, 30 + b + 30 * t + 2.4, 1), 'rindsleder', { rund: .6 }); m.form(M.ell(c - 12, 60 + b, 3.4, 3.4), 'leinen', { rund: 2, hell: -.06 }); return; }
    if (a === 'seite') { m.form(M.kap(c - 8, 26 + b, c - 11, 56 + b, 3.2), 'leinen', { rund: 2, hell: .08 }); }
  },
  rumpf(m, a, b, sw, c) {
    if (a === 'seite') { m.form(M.poly([[c - 7, 30 + b], [c + 7, 30 + b], [c + 9, 50 + b], [c + 7, 60 + b], [c - 7, 60 + b], [c - 9, 50 + b]]), 'leinen', { rund: 4, muster: falten, hell: -.04 }); m.form(M.poly([[c + 1, 36 + b], [c + 8, 40 + b], [c + 11 + sw, 82 + b], [c + 2 + sw, 84 + b]]), 'rindsleder', { rund: 2, rau: .2, korn: 3 }); m.form(M.box(c - 8, 58 + b, 17, 4.4), 'lederDkl', { rund: 1 }); m.form(M.oder(M.box(c - 8, 62 + b, 7, 9)), 'rindsleder', { rund: 1.6, hell: .05 }); return; }
    m.form(M.poly([[c - 13, 30 + b], [c + 13, 30 + b], [c + 11, 48 + b], [c + 9, 60 + b], [c - 9, 60 + b], [c - 11, 48 + b]]), 'leinen', { rund: 4, muster: falten, hell: -.04 });
    if (a === 'vorne') { m.form(M.poly([[c - 7, 36 + b], [c + 7, 36 + b], [c + 11, 62 + b], [c + 11 + sw, 84 + b], [c - 11 + sw, 84 + b], [c - 11, 62 + b]]), 'rindsleder', { rund: 2, rau: .2, korn: 3, muster: kratzer2 }); m.linie([[c - 6, 37 + b], [c - 10, 30 + b]], 'rindsleder', {}); m.linie([[c + 6, 37 + b], [c + 10, 30 + b]], 'rindsleder', {}); }
    else { m.form(M.poly([[c - 12, 44 + b], [c + 12, 44 + b], [c + 11, 60 + b], [c - 11, 60 + b]]), 'leinen', { rund: 2, hell: -.1, muster: falten }); m.linie([[c - 9, 31 + b], [c + 8, 56 + b]], 'rindsleder', {}); m.linie([[c + 9, 31 + b], [c - 8, 56 + b]], 'rindsleder', {}); }
    m.form(M.box(c - 12, 58 + b, 24, 5), 'lederDkl', { rund: 1 }); for (const x of [-12, 7]) m.form(M.box(c + x, 62 + b, 6, 10), 'rindsleder', { rund: 1.6, hell: .05 }); { const w = a === 'hinten' ? -1 : 1; m.form(M.kap(c + w * 9, 62 + b, c + w * 11, 75 + b, 1), 'metall', { rund: .8, hell: .1 }); } m.form(M.box(c - 2, 57 + b, 4, 6), 'metall', { rund: 1, hell: .05 });
  },
  schulter(m, a, x, y) { m.form(M.ell(x, y + 1, 6.4, 4.8), 'leinen', { rund: 3, hell: .02 }); },
  waffe(m, a, x, y, b) {
    const s = a === 'vorne' ? -1 : 1, ox = x + s * 9, oy = y - 34;
    m.form(M.kap(x - s, y + 7, ox, oy, 1.8), 'holz', { rund: 1.4, muster: maserung }); m.form(M.kap(x - s * .4, y + 3, x + s * .6, y - 5, 2.1), 'rindsleder', { rund: 1 });
    const K1 = M.poly([[ox - s * 7, oy - 4.2], [ox + s * 7, oy - 6.8], [ox + s * 8, oy + 1.2], [ox - s * 6, oy + 3.8]]);
    m.form(K1, 'stahlAlt', { rund: 2, ...glatt, hell: .04 }); m.linie([[ox - s * 6, oy - 3.4], [ox + s * 7, oy - 5.8]], 'stahlAlt', { hell: .5 }); for (const q of [-4, 4]) m.punkt(ox + s * q, oy - 1.4 - q * .1, 'stahlAlt', { hell: -.34 });
  },
  kopf(m, a, b, c) {
    m.form(M.poly([[c - 6, 24 + b], [c + 6, 24 + b], [c + 8, 30 + b], [c - 8, 30 + b]]), 'leinen', { rund: 2, hell: -.1, rau: .2, korn: 2 });
    m.form(M.ell(c, 16 + b, 6.6, 8), 'hautAlt', { rund: 5 });
    if (a === 'hinten') { m.form(M.oder(M.ell(c, 12 + b, 7.2, 5.6), M.box(c - 7, 13 + b, 14, 7)), 'lederDkl', { rund: 3, rau: .2, korn: 3 }); m.form(M.box(c - 6.4, 13 + b, 12.8, 2), 'gurt', { rund: .6 }); return; }
    const f = a === 'seite' ? 2.4 : 0;
    m.form(M.oder(M.ell(c - f * .5, 11 + b, 7.2, 4.8), M.box(c - 7, 11 + b, f ? 8 : 14, 3)), 'lederDkl', { rund: 3, rau: .2, korn: 3 });
    if (a === 'seite') { m.form(M.poly([[c + 1, 19 + b], [c + 7.4, 18 + b], [c + 7, 24 + b], [c - 1, 25 + b]]), 'leinen', { rund: 1.4, rau: .2, korn: 2, hell: -.1 }); m.form(M.box(c - 6, 13.4 + b, 13, 2), 'gurt', { rund: .6 }); m.form(M.ell(c + 5, 15 + b, 2.2, 2), 'feuer', { rund: 1, hell: -.14 }); m.punkt(c + 4.4, 14.4 + b, 'feuer', { hell: .5 }); return; }
    m.form(M.poly([[c - 6.4, 19 + b], [c + 6.4, 19 + b], [c + 5.4, 24 + b], [c, 25.6 + b], [c - 5.4, 24 + b]]), 'leinen', { rund: 1.4, rau: .2, korn: 2, hell: -.1 });
    m.form(M.box(c - 7, 13.6 + b, 14, 2), 'gurt', { rund: .6 }); for (const q of [-3, 3]) { m.form(M.ell(c + q, 15 + b, 2.3, 2), 'feuer', { rund: 1, hell: -.14 }); m.punkt(c + q - .6, 14.4 + b, 'feuer', { hell: .5 }); }
  } };
const kratzer2 = (x, y) => { const a = hash(Math.floor(x / 4), Math.floor(y / 3)); return a > .93 ? .16 : a < .07 ? -.16 : 0; };
// ---------- Schattenläufer: schlank, dunkle Wickel, Kapuzenschal, zwei Dolche im Rückhandgriff, das Lazi-Gerät leuchtet ----------
function dolch(m, x, y, dx, dy, hell = 0) {
  const l = 23, nx = -dy, ny = dx, p = (t, q) => [x + dx * t + nx * q, y + dy * t + ny * q];
  m.form(M.kap(...p(-6, 0), ...p(5, 0), 1.3), 'rindsleder', { rund: .8, hell });
  m.form(M.poly([p(5.5, -1.7), p(l - 5, -1.5), p(l, 0), p(l - 5, 1.5), p(5.5, 1.7)]), 'stahlAlt', { rund: 1, hell: hell + .16, kante: false }); m.linie([p(6.5, -.3), p(l - 2, -.2)], 'stahlAlt', { hell: hell + .55 });
  m.form(M.kap(...p(5, -4), ...p(5, 4), 1.2), 'metall', { rund: .8, hell });
}
const SCHATTEN = { hose: 'russ', stiefel: 'lederDkl', arm: 'russ', unterarm: 'gurt', hand: 'gurt', dick: .9,
  hinten(m, a, b, sw, c) {
    if (a === 'hinten') { m.form(M.poly([[c - 9, 29 + b], [c + 9, 29 + b], [c + 11 + sw, 62 + b], [c + 5 + sw, 58 + b], [c + sw, 68 + b], [c - 5 + sw, 58 + b], [c - 11 + sw, 62 + b]]), 'schal', { rund: 3, muster: falten, hell: -.03 }); return; }
    if (a === 'seite') m.form(M.poly([[c - 3, 29 + b], [c - 9, 40 + b], [c - 18 - sw, 58 + b], [c - 11 - sw, 60 + b], [c - 12 - sw, 68 + b], [c - 2, 52 + b]]), 'schal', { rund: 2.6, muster: falten });
  },
  rumpf(m, a, b, sw, c) {
    if (a === 'seite') { m.form(M.poly([[c - 6, 30 + b], [c + 6, 30 + b], [c + 8, 46 + b], [c + 6, 60 + b], [c - 6, 60 + b], [c - 7, 46 + b]]), 'russ', { rund: 3, muster: (x, y) => (y + x * .5) % 5 < 1 ? .1 : 0, hell: .08 }); m.form(M.box(c - 7, 58 + b, 15, 3.4), 'lederDkl', { rund: 1 }); m.form(M.kap(c + 6, 34 + b, c - 5, 57 + b, 1.2), 'lederDkl', { rund: .8 }); m.form(M.ell(c + 3, 44 + b, 2.6, 2.6), 'lazi', { rund: 1.4, leuchtet: true }); return; }
    m.form(M.poly([[c - 12, 30 + b], [c + 12, 30 + b], [c + 9, 46 + b], [c + 8, 60 + b], [c - 8, 60 + b], [c - 9, 46 + b]]), 'russ', { rund: 3, hell: .08, muster: (x, y) => (y + x * .5) % 5 < 1 ? .1 : 0 });
    m.form(M.box(c - 9, 58 + b, 18, 3.4), 'lederDkl', { rund: 1 }); { const w = a === 'hinten' ? -1 : 1; m.form(M.kap(c - w * 10, 33 + b, c + w * 8, 57 + b, 1.2), 'lederDkl', { rund: .8 }); }
    if (a === 'vorne') { m.form(M.box(c - 5, 40 + b, 10, 9), 'metall', { rund: 2, hell: -.1 }); m.form(M.ell(c, 44.6 + b, 3, 3), 'lazi', { rund: 1.4, leuchtet: true }); for (const q of [-4, 4]) m.punkt(c + q, 44.6 + b, 'lazi', { leuchtet: true, hell: -.2 }); for (const q of [-6, 6]) m.form(M.ell(c + q, 67 + b, 2.2, 3.4), 'lederDkl', { rund: 1.2 }); }
  },
  schulter(m, a, x, y) { m.form(M.ell(x, y + 1, 6, 4.2), 'russ', { rund: 2.6, hell: .12 }); m.linie([[x - 4, y + 3], [x + 4, y + 3]], 'russ', { hell: -.3 }); },
  waffe(m, a, x, y) { dolch(m, x, y + 1, a === 'vorne' ? -.97 : .97, .24); },
  zweite(m, a, x, y, hell) { dolch(m, x, y - 1, a === 'vorne' ? .71 : -.71, .71, hell); },
  kopf(m, a, b, c) {
    // Kapuzenkragen fällt breit über die Schultern
    m.form(M.poly([[c - 9, 23 + b], [c + 9, 23 + b], [c + 15, 34 + b], [c + 10, 39 + b], [c, 42 + b], [c - 10, 39 + b], [c - 15, 34 + b]]), 'schal', { rund: 3, rau: .15, muster: falten });
    m.linie([[c - 6, 28 + b], [c - 9, 38 + b]], 'schal', { hell: -.26 }); m.linie([[c + 6, 28 + b], [c + 9, 38 + b]], 'schal', { hell: -.26 });
    if (a === 'hinten') {
      m.form(M.oder(M.ell(c, 14 + b, 9.6, 10.6), M.poly([[c - 3, 7 + b], [c, 2.4 + b], [c + 3, 7 + b]]), M.poly([[c - 10, 17 + b], [c + 10, 17 + b], [c + 7, 32 + b], [c, 39 + b], [c - 7, 32 + b]])), 'schal', { rund: 6, rau: .15, korn: 3 });
      m.linie([[c, 4 + b], [c, 37 + b]], 'schal', { hell: -.28 }); m.linie([[c - 7, 14 + b], [c - 4, 30 + b]], 'schal', { hell: -.16 }); m.linie([[c + 7, 14 + b], [c + 4, 30 + b]], 'schal', { hell: -.16 });
      return;
    }
    if (a === 'seite') {
      m.form(M.oder(M.ell(c - 1, 14 + b, 9.2, 10.6), M.poly([[c - 6, 8 + b], [c + 3, 6 + b], [c + 11, 12 + b], [c + 9, 19 + b], [c + 8, 28 + b], [c - 9, 30 + b]])), 'schal', { rund: 6, rau: .15, korn: 3 });
      m.form(M.poly([[c + 3, 11 + b], [c + 9, 13.6 + b], [c + 8, 20 + b], [c + 7, 27 + b], [c + 2, 28 + b], [c + 1, 19 + b]]), 'russ', { rund: 1, hell: -.6, kante: false });
      m.linie([[c + 3, 10 + b], [c + 10, 13 + b]], 'schal', { hell: .32 }); m.linie([[c, 8 + b], [c - 7, 26 + b]], 'schal', { hell: -.24 });
      m.linie([[c + 4.6, 17 + b], [c + 7.2, 18.8 + b]], 'lazi', { leuchtet: true, hell: -.24 });
      return;
    }
    m.form(M.oder(M.ell(c, 14 + b, 9.8, 10.6), M.poly([[c - 3, 7 + b], [c, 2.4 + b], [c + 3, 7 + b]]), M.poly([[c - 10, 17 + b], [c + 10, 17 + b], [c + 9, 28 + b], [c, 34 + b], [c - 9, 28 + b]])), 'schal', { rund: 6, rau: .15, korn: 3 });
    // Öffnung läuft oben spitz zu und liegt tief im Schatten
    m.form(M.poly([[c, 9 + b], [c + 5.6, 15.6 + b], [c + 5, 24 + b], [c, 29 + b], [c - 5, 24 + b], [c - 5.6, 15.6 + b]]), 'russ', { rund: 1, hell: -.6, kante: false });
    m.linie([[c, 8 + b], [c - 6.4, 15.6 + b], [c - 5.8, 24.6 + b], [c, 30 + b]], 'schal', { hell: .32 }); m.linie([[c, 8 + b], [c + 6.4, 15.6 + b], [c + 5.8, 24.6 + b], [c, 30 + b]], 'schal', { hell: .2 });
    for (const v of [-1, 1]) { m.linie([[c + v * 4.2, 17 + b], [c + v * 1.2, 18.6 + b]], 'lazi', { leuchtet: true, hell: -.24 }); m.punkt(c + v * 1.6, 19.4 + b, 'lazi', { leuchtet: true, hell: -.5 }); }
  } };
// ---------- Die Leute im Dorf: gleicher Körperbau wie die Helden, jede Figur der Geschichte erkennbar an Kleidung, Haar und dem, was sie trägt ----------
Object.assign(FARBEN, { hautHell: ['#3a2420', '#7a5444', '#b08a6e', '#d8b494'], hautDkl: ['#24140e', '#4e2e1e', '#7e5238', '#a87a58'],
  haarSchwarz: ['#0c0a10', '#1c1820', '#2e2830', '#463c44'], haarBraun: ['#1c100c', '#3c2416', '#5c3a22', '#7c5634'], haarRot: ['#2a100c', '#642a14', '#98481e', '#c47030'], haarBlond: ['#3a2a14', '#7c6230', '#b09650', '#d8c078'], haarGrau: ['#26262c', '#54545c', '#84848c', '#b0b0b4'], haarWeiss: ['#46464e', '#84848c', '#b8b8bc', '#e4e4e4'],
  stoffGruen: ['#101c14', '#223a26', '#38563a', '#567850'], stoffBlau: ['#10182a', '#22344e', '#385272', '#587498'], stoffRot: ['#200e14', '#481c24', '#6e2c30', '#924a44'], stoffOcker: ['#2a2010', '#54421e', '#7e6632', '#a68c50'], stoffGrau: ['#1a1a20', '#36363e', '#54545c', '#74747a'], stoffViolett: ['#180f24', '#322044', '#4e3468', '#70528c'], stoffHell: ['#3e3a34', '#7c766a', '#b0a898', '#d8d0c0'], rostDkl: ['#20100c', '#4a2416', '#74401e', '#9c6030'], schiefer: ['#14161e', '#2a2e3a', '#444a5a', '#646c7e'], fischHolz: ['#1c1a1a', '#3c3834', '#5c5448', '#7e7462'], kessel: ['#1a1412', '#3e2c22', '#684c34', '#937050'], glut: ['#2a0e08', '#6a1a10', '#b8421a', '#e8842a'], ziegelRot: ['#20100e', '#4c2219', '#783c29', '#9c5f43'], robeDkl: ['#0c090e', '#1c141c', '#322026', '#4e3036'], eisenDkl: ['#0a0a0e', '#1a1a20', '#2e2e36', '#4c4c56'], scheune: ['#241614', '#4c2a26', '#70443a', '#907058'], gift: ['#1a2a10', '#3a6a1e', '#6ea82e', '#a8e04e'], betonGrau: ['#26262a', '#4c4c50', '#74746f', '#9c9a90'], glasDkl: ['#121e22', '#26404a', '#44686e', '#7a9c9a'] });
NAMEN.length = 0; NAMEN.push(...Object.keys(FARBEN));
const s0 = a => a === 'vorne' ? -1 : 1;
const blechStreifen = (x, y) => (Math.round(y) % 6 < 1 ? -.24 : 0) + (fbm(x / 7, y / 7) > .64 ? -.14 : 0);
const LEUTE_DINGE = {
  // Der Stab steht fest am Boden, nur die Hand wandert
  stab(m, a, x, y, b, p) {
    const f = a === 'seite' ? 110 + BEIN_LEUTE[p].y : 110 + (a === 'hinten' ? GANG_LEUTE.fussHinten[p === 4 ? 4 : (p + 2) % 4] : GANG_LEUTE.fuss[p]), fx = a === 'seite' ? 45 + BEIN_LEUTE[p].x : x;
    m.form(M.kap(x + (fx - x) * -.4, y - 22, fx, f, 1.5), 'holz', { rund: 1, muster: maserung, hell: .14 });
  },
  nudelholz(m, a, x, y) { m.form(M.kap(x, y + 2, x, y + 19, 3), 'stoffHell', { rund: 1.6, hell: -.1, muster: maserung }); for (const q of [-3, 22]) m.form(M.kap(x, y + q, x, y + q + 3, 1.1), 'holz', { rund: .6, hell: -.2 }); },
  becher(m, a, x, y) { const k = x + (a === 'vorne' ? -5 : 5); m.form(M.oder(M.box(k - 4, y, 8, 9), M.ell(k, y, 4, 1.6)), 'putz', { rund: 1.2, hell: -.06 }); m.linie([[k - s0(a) * 4, y + 2], [k - s0(a) * 6, y + 3], [k - s0(a) * 6, y + 6], [k - s0(a) * 4, y + 7]], 'putz', { hell: -.1 }); m.linie([[k, y], [k + 1, y + 3], [k - 1, y + 5]], 'russ', {}); },
  stock(m, a, x, y) { m.form(M.kap(x, y - 2, x + (a === 'vorne' ? -3 : 3), y + 24, 1.1), 'holz', { rund: .8, muster: maserung }); },
  buch(m, a, x, y) { m.form(M.box(x - 5, y - 3, 11, 14), 'rotDkl', { rund: 1.4, rau: .2, korn: 3 }); m.form(M.box(x - 4, y + 9, 9, 2), 'putz', { rund: .5 }); m.form(M.box(x - 5, y - 3, 2, 14), 'lederDkl', { rund: .5 }); },
  krug(m, a, x, y) { const s = a === 'vorne' ? -1 : 1, k = x + s * 6; m.form(M.box(k - 4, y + 1, 8, 11), 'holz', { rund: 1.6, muster: maserung, hell: .08 }); for (const q of [3, 9]) m.linie([[k - 4, y + q], [k + 3, y + q]], 'metall', { hell: .2 }); m.form(M.ell(k, y + 1, 4, 2), 'putz', { rund: 1, hell: .2 }); m.linie([[k - s * 4, y + 3], [k - s * 6, y + 4], [k - s * 6, y + 8], [k - s * 4, y + 9]], 'metall', { hell: .1 }); },
  hammer(m, a, x, y) { const w = a === 'seite' ? 7 : 3.5; m.form(M.kap(x, y - 3, x, y + 25, 1.7), 'holz', { rund: 1.2, muster: maserung }); m.form(M.box(x - w, y + 23, w * 2, 8), 'stahlAlt', { rund: 1.6, ...glatt }); m.linie([[x - w + 1, y + 24], [x + w - 1, y + 24]], 'stahlAlt', { hell: .45 }); },
  schluessel(m, a, x, y) { m.form(M.kap(x, y - 2, x, y + 15, 1.5), 'stahlAlt', { rund: 1, ...glatt }); m.form(M.ell(x, y + 18, 4.4, 3.6), 'stahlAlt', { rund: 1.4, ...glatt }); m.form(M.ell(x, y + 18, 1.8, 1.6), 'stahlAlt', { rund: .8, hell: -.5, kante: false }); },
  brett(m, a, x, y) { if (a === 'seite') { m.form(M.poly([[x - 3, y - 4], [x + 4, y - 7], [x + 4, y + 8], [x - 3, y + 11]]), 'holz', { rund: .8, muster: maserung }); m.form(M.poly([[x - 2, y - 2], [x + 3, y - 4], [x + 3, y + 6], [x - 2, y + 8]]), 'putz', { rund: .4, hell: -.03 }); return; } m.form(M.box(x - 5, y - 4, 11, 15), 'holz', { rund: 1, muster: maserung }); if (a === 'hinten') return; m.form(M.box(x - 4, y - 2, 9, 12), 'putz', { rund: .4, hell: -.03 }); for (const q of [1, 4, 7]) m.linie([[x - 3, y + q], [x + 3, y + q]], 'hose', {}); },
  angel(m, a, x, y) { const s = a === 'vorne' ? -1 : 1, ox = x + s * (a === 'seite' ? 18 : 8), oy = y - 58; m.form(M.kap(x, y + 6, ox, oy, .9), 'holz', { rund: .6 }); m.linie([[ox, oy], [ox, oy + 10]], 'stein', { hell: .3 }); m.punkt(ox, oy + 11, 'rot', { hell: .2 }); },
  schaufel(m, a, x, y) { m.form(M.kap(x, y - 2, x, y + 22, 1.5), 'holz', { rund: 1, muster: maserung }); m.form(M.poly([[x - 5, y + 20], [x + 5, y + 20], [x + 4, y + 31], [x, y + 34], [x - 4, y + 31]]), 'stahlAlt', { rund: 1.2, ...glatt, hell: -.08 }); },
  keule(m, a, x, y) { const s = a === 'vorne' ? -1 : 1, ox = x + s * 8, oy = y - 30; m.form(M.kap(x - s, y + 6, ox, oy, 1.9), 'holz', { rund: 1.4, muster: maserung }); m.form(M.kap(x + (ox - x) * .7, y + (oy - y) * .7, ox + s, oy - 3, 3.8), 'holz', { rund: 2, muster: maserung, hell: -.06 }); for (const t of [-2, 3, 8]) s && m.punkt(ox + t * .3 + 3 * s, oy + t, 'stahlAlt', { hell: .4 }); },
  messer(m, a, x, y) { const s = a === 'vorne' ? -1 : 1; m.form(M.kap(x, y + 4, x + s, y - 3, 1.4), 'rindsleder', { rund: .8 }); m.form(M.poly([[x + s * 2 - 2, y - 3], [x + s * 2 + 2, y - 3], [x + s * 12, y - 25], [x + s * 4, y - 19]]), 'stahlAlt', { rund: 1, ...glatt, hell: .3 }); },
  schwertZ(m, a, x, y) { const s = a === 'vorne' ? -1 : 1, ox = x + s * 10, oy = y - 42; m.form(M.kap(x - s * .3, y + 6, x + s, y - 3, 1.5), 'rindsleder', { rund: .8 }); m.form(M.kap(x + s * 1 - 5, y - 2, x + s + 5, y - 5, 1.4), 'metall', { rund: .8 }); m.form(M.poly([[x + s - 1.8, y - 4], [x + s + 1.8, y - 4], [ox + 1.2, oy], [ox - 1.2, oy]]), 'stahlAlt', { rund: 1, ...glatt, hell: .14 }); },
  armbrust(m, a, x, y) {
    // Von vorn und hinten zeigt sie zum Ziel: Bogen quer, der Schaft ist verkürzt
    if (a !== 'seite') { const mx = 42, by = y - 2, bieg = a === 'vorne' ? 5 : -2; if (a === 'hinten') { for (const v of [-1, 1]) m.form(M.kap(mx + v * 18, by + 2, mx + v * 25, by - 2, 1.2), 'metall', { rund: .7, hell: .12 }); return; } m.form(M.kap(x, y + 3, mx, by + 8, 1.7), 'holz', { rund: 1, muster: maserung }); m.form(M.kap(mx, by + 2, mx, by + 8, 2), 'holz', { rund: 1 }); m.form(M.oder(M.kap(mx - 22, by + bieg, mx, by, 1.2), M.kap(mx, by, mx + 22, by + bieg, 1.2)), 'metall', { rund: .7, hell: .12 }); m.linie([[mx - 22, by + bieg], [mx, by + 5], [mx + 22, by + bieg]], 'putz', { hell: -.1 }); return; }
    const s = 1, ox = x + s * 20, oy = y - 12; m.form(M.kap(x - s * 3, y + 2, ox, oy, 1.7), 'holz', { rund: 1, muster: maserung }); m.form(M.oder(M.kap(ox - s * 2, oy - 12, ox + s, oy, 1.1), M.kap(ox + s, oy, ox - s * 2, oy + 12, 1.1)), 'metall', { rund: .7, hell: .12 }); m.linie([[ox - s * 2, oy - 12], [x + s * 6, y - 3], [ox - s * 2, oy + 12]], 'putz', { hell: -.1 }); m.form(M.kap(x + s * 6, y - 3, ox + s * 3, oy - 2, .7), 'stahlAlt', { rund: .4 }); },
  fackel(m, a, x, y) { const s = a === 'vorne' ? -1 : 1, ox = x + s * 5, oy = y - 26; m.form(M.kap(x, y + 6, ox, oy, 1.6), 'holz', { rund: 1, muster: maserung }); m.form(M.oder(M.ell(ox, oy - 4, 4.4, 6), M.poly([[ox - 3, oy - 6], [ox + 3, oy - 6], [ox + s, oy - 16]])), 'feuer', { rund: 2, leuchtet: true, muster: (u, v) => fbm(u / 3, v / 3) * .4 - .1 }); },
  trommel(m, a, x, y) { const s = a === 'vorne' ? 1 : -1, tx = x + s * 12; if (a === 'hinten') return; m.form(M.oder(M.box(tx - 11, y - 8, 22, 18), M.ell(tx, y - 8, 11, 3.4), M.ell(tx, y + 10, 11, 3.4)), 'rostDkl', { rund: 3, muster: blechStreifen }); m.linie([[tx - 10, y - 6], [tx - 5, y + 8], [tx, y - 6], [tx + 5, y + 8], [tx + 10, y - 6]], 'leinen', {}); m.form(M.ell(tx, y - 8, 9.4, 2.6), 'leinen', { rund: 1, hell: .1 }); m.form(M.kap(x, y, tx + s * 2, y - 12, 1), 'holz', { rund: .6, hell: .1 }); },
  peitsche(m, a, x, y) { const s = a === 'vorne' ? -1 : 1; m.form(M.kap(x, y + 4, x + s * 4, y - 6, 1.6), 'rindsleder', { rund: 1 }); const p = []; for (let i = 0; i <= 30; i++) { const t = i / 30; p.push([x + s * (4 + t * 24), y - 6 + t * (112 - y) + Math.sin(t * 7) * 6 * (1 - t)]); } m.linie(p, 'rindsleder', { hell: .1 }); m.linie(p.map(([a, c]) => [a + 1, c]), 'lederDkl', {}); },
  korb(m, a, x, y) { m.form(M.ell(x, y + 10, 8, 6.6), 'stroh', { rund: 3, hell: -.1, muster: (q, w) => (q + w) % 3 < 1 ? -.2 : 0 }); m.linie([[x - 7, y + 7], [x, y], [x + 7, y + 7]], 'holz', {}); },
};
function bogen(m, x0, y0, x1, y1) { const mx = (x0 + x1) / 2 + (y1 - y0) * .09, my = (y0 + y1) / 2 - (x1 - x0) * .09; m.form(M.oder(M.kap(x0, y0, mx, my, 1.2), M.kap(mx, my, x1, y1, 1.2)), 'holz', { rund: .8 }); m.linie([[x0, y0], [x1, y1]], 'putz', { hell: -.1 }); }
function leuteFigur(o) {
  const haut = o.haut || 'hautHell', oben = o.oben, haar = o.haar || 'haarBraun';
  // Seitlich liegt die Angel vor Arm und Kopf, alles andere hängt am Griff hinter der Hand
  const vorKoerper = a => o.ding === 'angel' && a === 'seite';
  const dinge = function (m, a, x, y, b) { if (o.ding && !vorKoerper(a)) LEUTE_DINGE[o.ding](m, a, x, y, b, this.phase); };
  return { frei: !o.kampf, griff: o.ding === 'stab', schmal: o.schmal, hose: o.hose || o.rock || 'hose', stiefel: o.stiefel || 'rindsleder', arm: oben, unterarm: o.nackteArme ? haut : undefined, hand: haut, dick: o.dick || 1,
    hinten(m, a, b, sw, c) {
      if (o.umhang) {
        if (a === 'hinten') m.form(M.poly([[c - 13, 29 + b], [c + 13, 29 + b], [c + 16 + sw, 88 + b], [c + 8 + sw, 84 + b], [c + 1 + sw, 89 + b], [c - 7 + sw, 85 + b], [c - 16 + sw, 88 + b]]), o.umhang, { rund: 3, muster: falten });
        if (a === 'seite') m.form(M.poly([[c - 3, 29 + b], [c - 9, 40 + b], [c - 17 - sw, 86 + b], [c - 6 - sw, 88 + b], [c, 50 + b]]), o.umhang, { rund: 3, muster: falten });
      }
      if (o.sack) {
        if (a === 'hinten') { m.form(M.box(c + 3, 22 + b, 7, 10), 'metall', { rund: 1, hell: -.1 }); m.form(M.kap(c - 6, 30 + b, c - 8, 21 + b, 2), 'rost', { rund: 1 }); m.form(M.oder(M.ell(c, 58 + b, 13, 13), M.poly([[c - 5, 33 + b], [c + 5, 33 + b], [c + 12, 54 + b], [c - 12, 54 + b]])), 'lumpen', { rund: 7, rau: .25, korn: 3, muster: falten }); m.form(M.oder(M.box(c - 3, 29 + b, 6, 4), M.ell(c, 28 + b, 3.4, 2)), 'gurt', { rund: .8 }); m.form(M.box(c - 7, 56 + b, 7, 7), 'stoffOcker', { rund: 1, rau: .2, korn: 2 }); for (const v of [-1, 1]) m.form(M.kap(c + v * 10, 30 + b, c + v * 9, 44 + b, 1.3), 'gurt', { rund: .8 }); }
        if (a === 'seite') { m.form(M.oder(M.ell(c - 13, 56 + b, 10, 12), M.poly([[c - 16, 32 + b], [c - 10, 32 + b], [c - 5, 52 + b], [c - 22, 52 + b]])), 'lumpen', { rund: 7, rau: .25, korn: 3, muster: falten }); m.form(M.box(c - 18, 28 + b, 6, 8), 'metall', { rund: 1, hell: -.1 }); }
        if (a === 'vorne') m.form(M.box(c - 11, 24 + b, 7, 8), 'metall', { rund: 1, hell: -.1 });
      }
      if (o.bogen) {
        if (a === 'vorne') bogen(m, c - 13, 20 + b, c + 15, 78 + b);
        if (a === 'hinten') { bogen(m, c + 11, 24 + b, c - 12, 74 + b); m.form(M.box(c + 3, 30 + b, 7, 22), 'lederDkl', { rund: 1.4 }); for (const q of [4, 6, 8]) m.linie([[c + q, 25 + b], [c + q, 31 + b]], 'stroh', {}); }
        if (a === 'seite') { bogen(m, c - 2, 22 + b, c - 11, 74 + b); m.form(M.box(c - 11, 30 + b, 6, 20), 'lederDkl', { rund: 1.2 }); }
      }
    },
    rumpf(m, a, b, sw, c) {
      const dick = o.bauch || 0, muster = o.muster === false ? undefined : falten;
      if (a === 'seite') {
        m.form(M.poly([[c - 7, 30 + b], [c + 7, 30 + b], [c + 9 + dick, 48 + b], [c + 7 + dick * .6, 60 + b], [c - 7, 60 + b], [c - 9, 48 + b]]), oben, { rund: 4, muster });
        if (o.rock) m.form(M.poly([[c - 8, 56 + b], [c + 8 + dick * .6, 56 + b], [c + 15 + sw, 98 + b], [c - 15 + sw, 98 + b]]), o.rock, { rund: 4, muster: falten });
        if (o.kittel) m.form(M.poly([[c - 8, 30 + b], [c + 8, 30 + b], [c + 10, 50 + b], [c + 11 + sw, 88 + b], [c - 11 + sw, 88 + b], [c - 10, 50 + b]]), o.kittel, { rund: 3, muster: falten });
        if (o.schuerze) m.form(M.poly([[c + 1, 38 + b], [c + 8 + dick, 42 + b], [c + 11 + dick * .5 + sw, 84 + b], [c + 2 + sw, 86 + b]]), o.schuerze, { rund: 2, rau: .15, korn: 3 });
        if (o.weste) m.form(M.poly([[c - 7, 31 + b], [c + 4, 31 + b], [c + 5 + dick * .6, 58 + b], [c - 7, 58 + b]]), o.weste, { rund: 2 });
        if (o.schaerpe) m.form(M.kap(c - 6, 37 + b, c + 7 + dick * .6, 52 + b, 2.2), o.schaerpe, { rund: 1 });
        if (o.sack || o.bogen) m.form(M.kap(c + 5, 32 + b, c - 6, 57 + b, 1.3), 'gurt', { rund: .8 });
        if (o.anhaenger) m.form(M.ell(c + 5, 41 + b, 2.2, 2.2), 'lazi', { rund: 1, leuchtet: true });
        if (o.platte) m.form(M.poly([[c - 6, 33 + b], [c + 6, 33 + b], [c + 7 + dick * .6, 56 + b], [c - 6, 56 + b]]), o.platte, { rund: 2.4, ...glatt, muster: kratzer2 });
        if (o.kanister) { m.form(M.box(c - 18, 36 + b, 11, 22), 'rot', { rund: 2, hell: -.2 }); m.form(M.box(c - 14, 32 + b, 5, 4), 'metall', { rund: 1 }); }
        if (o.guertel) m.form(M.box(c - 8, 57 + b, 16 + dick * .6, 4), o.guertel, { rund: 1 });
        return;
      }
      m.form(M.poly([[c - 5, 25 + b], [c + 5, 25 + b], [c + 13, 31 + b], [c + 11 + dick, 48 + b], [c + 9 + dick * .7, 60 + b], [c - 9 - dick * .7, 60 + b], [c - 11 - dick, 48 + b], [c - 13, 31 + b]]), oben, { rund: 4, muster });
      if (o.rock) m.form(M.poly([[c - 10, 56 + b], [c + 10, 56 + b], [c + 17 + sw, 104 + b], [c - 17 + sw, 104 + b]]), o.rock, { rund: 4, muster: falten });
      if (o.kittel && a === 'hinten') m.form(M.poly([[c - 13, 30 + b], [c + 13, 30 + b], [c + 13 + sw, 88 + b], [c - 13 + sw, 88 + b]]), o.kittel, { rund: 3, muster: falten });
      if (o.kittel && a === 'vorne') for (const v of [-1, 1]) m.form(M.poly([[c + v * 13, 31 + b], [c + v * 6, 31 + b], [c + v * 7 + sw, 88 + b], [c + v * 14 + sw, 88 + b]]), o.kittel, { rund: 3, muster: falten });
      if (a === 'vorne') {
        if (o.anhaenger) m.form(M.ell(c, 42 + b, 2.4, 2.4), 'lazi', { rund: 1, leuchtet: true });
        if (o.platte) m.form(M.poly([[c - 11, 32 + b], [c + 11, 32 + b], [c + 9 + dick * .7, 57 + b], [c - 9 - dick * .7, 57 + b]]), o.platte, { rund: 3, ...glatt, muster: kratzer2 });
        if (o.schuerze) { m.form(M.poly([[c - 7, 38 + b], [c + 7, 38 + b], [c + 10 + dick * .5, 62 + b], [c + 11 + sw, 86 + b], [c - 11 + sw, 86 + b], [c - 10 - dick * .5, 62 + b]]), o.schuerze, { rund: 2, rau: .15, korn: 3 }); m.linie([[c - 6, 39 + b], [c - 10, 31 + b]], o.schuerze, {}); m.linie([[c + 6, 39 + b], [c + 10, 31 + b]], o.schuerze, {}); }
        if (o.weste) { m.form(M.poly([[c - 12, 31 + b], [c - 3, 31 + b], [c - 4, 58 + b], [c - 10 - dick * .7, 58 + b]]), o.weste, { rund: 2 }); m.form(M.poly([[c + 12, 31 + b], [c + 3, 31 + b], [c + 4, 58 + b], [c + 10 + dick * .7, 58 + b]]), o.weste, { rund: 2 }); }
        if (o.schaerpe) m.form(M.kap(c - 10, 33 + b, c + 9, 58 + b, 2.2), o.schaerpe, { rund: 1 });
        if (o.umhang) { m.form(M.poly([[c - 13, 29 + b], [c - 4, 29 + b], [c - 11, 46 + b], [c - 14, 44 + b]]), o.umhang, { rund: 2 }); m.form(M.poly([[c + 13, 29 + b], [c + 4, 29 + b], [c + 11, 46 + b], [c + 14, 44 + b]]), o.umhang, { rund: 2 }); m.form(M.ell(c, 31 + b, 2.4, 2.4), 'metall', { rund: 1, hell: .2 }); }
        if (o.sack || o.bogen) m.form(M.kap(c - 11, 32 + b, c + 9, 58 + b, 1.3), 'gurt', { rund: .8 });
      } else {
        if (o.schuerze) { m.linie([[c - 9, 31 + b], [c + 8, 56 + b]], o.schuerze, {}); m.linie([[c + 9, 31 + b], [c - 8, 56 + b]], o.schuerze, {}); }
        if (o.weste) m.form(M.poly([[c - 12, 31 + b], [c + 12, 31 + b], [c + 10 + dick * .7, 58 + b], [c - 10 - dick * .7, 58 + b]]), o.weste, { rund: 2 });
        if (o.platte) m.form(M.poly([[c - 11, 32 + b], [c + 11, 32 + b], [c + 9, 57 + b], [c - 9, 57 + b]]), o.platte, { rund: 3, ...glatt, muster: kratzer2 });
        if (o.schaerpe) m.form(M.kap(c + 10, 33 + b, c - 9, 58 + b, 2.2), o.schaerpe, { rund: 1 });
      }
      if (o.guertel) m.form(M.box(c - 10 - dick * .7, 57 + b, 20 + dick * 1.4, 4), o.guertel, { rund: 1 });
      if (o.kanister && a === 'hinten') { m.form(M.box(c - 9, 36 + b, 18, 22), 'rot', { rund: 2, hell: -.2, muster: (x, y) => fbm(x / 6, y / 6) > .6 ? -.2 : 0 }); m.form(M.box(c - 3, 32 + b, 6, 4), 'metall', { rund: 1 }); }
    },
    schulter(m, a, x, y) { if (o.schulter) { m.form(M.ell(x, y + 1, 7, 5.2), o.schulter, { rund: 2.6, ...glatt, hell: .06 }); return; } m.form(M.ell(x, y + 3, 5.2, 5), oben, { rund: 1.4, kante: false }); },
    waffe: dinge,
    vorn(m, a, x, y, b) { if (vorKoerper(a)) LEUTE_DINGE[o.ding](m, a, x, y, b); },
    kopf(blatt, a, b, c) {
      const k = o.kopfGross || 1, hx = c, hy = 25 + b, q = (x, y) => [hx + (x - hx) * k, hy + (y - hy) * k];
      const m = k === 1 ? blatt : { form: (mk, fa, op) => blatt.form((x, y) => mk(hx + (x - hx) / k, hy + (y - hy) / k), fa, op), punkt: (x, y, fa, op) => blatt.punkt(...q(x, y), fa, op), linie: (p, fa, op) => blatt.linie(p.map(s => q(s[0], s[1])), fa, op) };
      const f = o.frisur, tuch = o.tuch || 'leinen', seite = a === 'seite', hinten = a === 'hinten';
      if (f === 'lang') { if (seite) m.form(M.poly([[c - 8, 11 + b], [c - 1, 11 + b], [c - 3, 36 + b], [c - 10, 36 + b]]), haar, { rund: 3, muster: falten }); else if (!hinten) { m.form(M.box(c - 9, 12 + b, 4, 22), haar, { rund: 2, muster: falten }); m.form(M.box(c + 5, 12 + b, 4, 22), haar, { rund: 2, muster: falten }); } }
            if (f === 'zopf' && seite) m.form(M.kap(c - 6, 18 + b, c - 9, 42 + b, 2.3), haar, { rund: 1.4 });
      if (o.kragen) m.form(M.poly([[c - 8, 24 + b], [c + 8, 24 + b], [c + 10, 31 + b], [c - 10, 31 + b]]), o.kragen, { rund: 2, rau: .15, korn: 2 });
      blatt.form(M.kap(c, 21 + b, c, 28 + b, 4), haut, { rund: 2, hell: -.1 });
      m.form(M.ell(c, 16 + b, 6.6, 8), haut, { rund: 5 });
      if (seite) m.form(M.kap(c + 2, 22 + b, c + 4, 23.4 + b, 1.8), haut, { rund: 1.4, kante: false, hell: -.12 });
      if (hinten) {
        if (f === 'kopftuch') { m.form(M.oder(M.ell(c, 14 + b, 7.6, 9), M.ell(c, 24 + b, 3.2, 2.6)), tuch, { rund: 3, muster: falten }); return; }
        if (f === 'halbglatze') { const ganz = M.ell(c, 16 + b, 6.8, 8), kahl = M.ell(c, 11 + b, 6.2, 7); m.form((x, y) => ganz(x, y) && !kahl(x, y), haar, { rund: 2, rau: .2, korn: 2 }); return; }
        m.form(M.ell(c, 13.5 + b, 7.2, 8.4), haar, { rund: 4, rau: .2, korn: 2 });
        if (f === 'zopf') m.form(M.kap(c, 20 + b, c, 44 + b, 2.6), haar, { rund: 1.6 });
        if (f === 'lang') m.form(M.poly([[c - 8, 12 + b], [c + 8, 12 + b], [c + 9, 30 + b], [c + 5, 37 + b], [c, 38 + b], [c - 5, 37 + b], [c - 9, 30 + b]]), haar, { rund: 3, muster: falten });
      } else if (seite) {
        if (f === 'halbglatze') m.form(M.poly([[c - 7, 13 + b], [c - 3.4, 14 + b], [c - 3.4, 21 + b], [c - 6, 22 + b]]), haar, { rund: 2, rau: .2, korn: 2 });
        else if (f === 'kopftuch') m.form(M.oder(M.ell(c - 1, 11 + b, 7.8, 5), M.poly([[c - 8, 13 + b], [c + 1, 13 + b], [c + 1, 25 + b], [c - 7, 26 + b]])), tuch, { rund: 3, muster: falten });
        else m.form(M.oder(M.ell(c - 2, 10.6 + b, 6.8, 3.6), M.box(c - 7.4, 11 + b, 5, 8)), haar, { rund: 3, rau: .2, korn: 2 });
        // Das Gesicht schaut nach rechts: Nase, ein Auge, Braue, Mund
        m.form(M.ell(c + 6.8, 17.2 + b, 1, 1.4), haut, { rund: .8, hell: -.04 });
        m.linie([[c + 2.4, 14.2 + b], [c + 5.4, 14.2 + b]], haar, { hell: -.1 }); m.linie([[c + 2.5, 21 + b], [c + 4.5, 21 + b]], haut, { hell: -.42 });
        if (o.brille) { m.form(M.ell(c + 3.8, 16 + b, 2.6, 2.2), 'metall', { rund: .6, hell: .2 }); m.form(M.ell(c + 3.8, 16 + b, 1.5, 1.2), 'glas', { rund: .4, hell: -.2, kante: false }); m.linie([[c + 1, 15 + b], [c - 5, 14 + b]], 'metall', { hell: .1 }); }
        m.form(M.box(c + 3.2, 15.4 + b, 1.4, 1.8), 'haarSchwarz', { rund: 0, kante: false, hell: -.5 });
        if (o.bart === 'voll') m.form(M.poly([[c - 2, 19 + b], [c + 2, 20 + b], [c + 7.2, 20 + b], [c + 7.2, 24 + b], [c + 4.6, 28 + b], [c + 1, 29 + b], [c - 2, 26 + b]]), o.bartFarbe || haar, { rund: 2, rau: .3, korn: 2, kante: false });
        if (o.bart === 'schnauz') m.form(M.box(c + 3, 18.6 + b, 5, 2), o.bartFarbe || haar, { rund: 1 });
      } else {
        if (f === 'halbglatze') for (const v of [-1, 1]) m.form(M.box(c + (v < 0 ? -7 : 5.2), 14 + b, 1.8, 5), haar, { rund: 1, rau: .2, korn: 2 });
        else if (f === 'kopftuch') m.form(M.oder(M.ell(c, 9.8 + b, 7.8, 4.4), M.box(c - 7.8, 11 + b, 2.6, 15), M.box(c + 5.2, 11 + b, 2.6, 15), M.box(c - 6.4, 24.6 + b, 3.4, 1.6), M.box(c + 3, 24.6 + b, 3.4, 1.6)), tuch, { rund: 3, muster: falten });
        else m.form(M.oder(M.ell(c, 9.8 + b, 7, 3.8), M.box(c - 7, 11 + b, 2, 5), M.box(c + 5, 11 + b, 2, 5)), haar, { rund: 3, rau: .2, korn: 2 });
        const hellHaar = haar === 'haarGrau' || haar === 'haarWeiss', braue = hellHaar ? haut : haar, braueHell = hellHaar ? -.3 : .06;
        for (const v of [-1, 1]) { m.form(M.box(c + v * 3.4 - 2, 16.6 + b, 4, 1.2), 'putz', { rund: 0, kante: false, hell: -.14 }); m.form(M.box(c + v * 3.4 - .9, 15.6 + b, 1.8, 2.4), 'haarSchwarz', { rund: 0, kante: false, hell: -.5 }); m.linie([[c + v * 2, 14 + b], [c + v * 4.6, 14 + b]], braue, { hell: braueHell }); }
        m.linie([[c, 16.6 + b], [c, 19 + b]], haut, { hell: -.22 }); m.linie([[c - 2, 21.4 + b], [c + 2, 21.4 + b]], haut, { hell: -.42 });
        if (o.brille) for (const v of [-1, 1]) { m.form(M.ell(c + v * 3, 16.2 + b, 2.6, 2.2), 'metall', { rund: .6, hell: .2 }); { m.form(M.ell(c + v * 3, 16.2 + b, 1.5, 1.2), 'glas', { rund: .4, hell: -.2, kante: false }); m.form(M.box(c + v * 3 - .9, 15.6 + b, 1.8, 2), 'haarSchwarz', { rund: 0, kante: false, hell: -.5 }); } }
        if (o.bart === 'voll') { m.form(M.poly([[c - 6.8, 18.5 + b], [c - 4.6, 20 + b], [c - 2.4, 20 + b], [c + 2.4, 20 + b], [c + 4.6, 20 + b], [c + 6.8, 18.5 + b], [c + 6.4, 24 + b], [c + 3, 29 + b], [c, 30 + b], [c - 3, 29 + b], [c - 6.4, 24 + b]]), o.bartFarbe || haar, { rund: 2, rau: .3, korn: 2, kante: false }); m.linie([[c - 2, 21.4 + b], [c + 2, 21.4 + b]], haut, { hell: -.42 }); }
        if (o.bart === 'schnauz') { m.form(M.box(c - 4, 18.8 + b, 8, 1.8), o.bartFarbe || haar, { rund: .8 }); }
      }
      if (o.maske && !hinten) { if (seite) m.form(M.poly([[c - 1, 18 + b], [c + 7.4, 17.6 + b], [c + 7, 24 + b], [c, 25.6 + b]]), o.maske, { rund: 1.4, rau: .2, korn: 2 }); else m.form(M.poly([[c - 6.6, 18 + b], [c + 6.6, 18 + b], [c + 5.4, 24 + b], [c, 25.6 + b], [c - 5.4, 24 + b]]), o.maske, { rund: 1.4, rau: .2, korn: 2 }); }
      if (o.kappe) { m.form(M.ell(c - (seite ? 1 : 0), 9.6 + b, 7.6, 4.4), o.kappe, { rund: 3, rau: .2, korn: 3 }); if (!hinten) { if (seite) m.form(M.box(c + 3, 11 + b, 7, 1.8), o.kappe, { rund: .6, hell: -.2 }); else m.form(M.box(c - 7, 11.6 + b, 14, 1.8), o.kappe, { rund: .6, hell: -.2 }); } }
      if (o.hut) { m.form(M.ell(c, 11 + b, 11, 2.6), o.hut, { rund: 1.4, hell: -.08 }); m.form(M.ell(c, 7.6 + b, 6.4, 4.6), o.hut, { rund: 3, rau: .15, korn: 3 }); m.linie([[c - 6, 10 + b], [c + 6, 10 + b]], o.hutBand || 'lederDkl', {}); }
      if (o.feder) m.linie([[c + 4, 8 + b], [c + 8, 1 + b]], o.feder, { hell: .2 });
      if (o.brilleOben) { m.form(M.box(c - 6.4, 9.4 + b, 12.8, 2), 'gurt', { rund: .6 }); if (!hinten) for (const v of seite ? [1] : [-1, 1]) { m.form(M.ell(c + (seite ? 3.4 : v * 3), 10.6 + b, 2.2, 1.9), 'feuer', { rund: 1, hell: -.14 }); } }
    } };
}
// mass: Größe gegenüber einem Erwachsenen. Kinder und sehr alte Leute sind kleiner.
const LEUTE = {
  ebert: { name: 'Der alte Ebert', mass: .95, oben: 'stoffGrau', rock: 'stoffGrau', haar: 'haarWeiss', frisur: 'halbglatze', bart: 'voll', brille: true, guertel: 'gurt', ding: 'buch', dick: .92 },
  mara: { name: 'Mara', oben: 'stoffGruen', hose: 'lederDkl', haar: 'haarRot', frisur: 'zopf', umhang: 'stoffGrau', bogen: true, guertel: 'lederDkl', dick: .92 },
  junge: { name: 'Tomek', mass: .76, kopfGross: 1.18, schmal: 4, oben: 'stoffOcker', hose: 'lumpen', haar: 'haarBlond', ding: 'stock', dick: .9 },
  kalle: { name: 'Kalle', oben: 'lumpen', hose: 'stoffOcker', haar: 'haarBraun', bart: 'schnauz', kappe: 'stoffGrau', sack: true, guertel: 'gurt', weste: 'rost', haut: 'hautDkl' },
  harnstedt: { name: 'Frau von Harnstedt', oben: 'stoffViolett', rock: 'stoffViolett', haar: 'haarGrau', ding: 'becher', hut: 'stoffViolett', hutBand: 'gold', feder: 'putz', umhang: 'stoffGrau', dick: .9 },
  gernot: { name: 'Gernot', oben: 'stoffOcker', hose: 'hose', haar: 'haarGrau', bart: 'schnauz', weste: 'lederDkl', ding: 'stock', guertel: 'gurt' },
  lotte: { name: 'Lotte', oben: 'stoffHell', rock: 'stoffRot', schuerze: 'putz', haar: 'haarBlond', frisur: 'zopf', ding: 'krug', dick: .9, nackteArme: true },
  rudi: { name: 'Rudi', oben: 'stoffHell', hose: 'hose', schuerze: 'putz', weste: 'lederDkl', haar: 'haarBraun', frisur: 'halbglatze', bart: 'schnauz', bauch: 5, ding: 'krug', nackteArme: true, dick: 1.06 },
  ilse: { name: 'Ilse', oben: 'stoffBlau', rock: 'stoffGrau', haar: 'haarBraun', frisur: 'kopftuch', tuch: 'stoffHell', dick: .9 },
  anselm: { name: 'Bruder Anselm', oben: 'lumpen', rock: 'lumpen', haar: 'haarGrau', frisur: 'kopftuch', tuch: 'lumpen', anhaenger: true, guertel: 'gurt', ding: 'stab', dick: .92 },
  grimbart: { name: 'Meister Grimbart', oben: 'lumpen', hose: 'lederDkl', schuerze: 'rindsleder', haar: 'haarRot', frisur: 'halbglatze', bart: 'voll', bauch: 2, ding: 'hammer', nackteArme: true, dick: 1.12, haut: 'hautHell' },
  wenzel: { name: 'Dr. Theodora Wenzel', oben: 'stoffHell', hose: 'stoffGrau', kittel: 'stoffHell', haar: 'haarSchwarz', brille: true, ding: 'brett', dick: .9, haut: 'hautDkl' },
  jupp: { name: 'Jupp', oben: 'stoffGruen', hose: 'stoffOcker', umhang: 'stoffOcker', haar: 'haarBraun', frisur: 'lang', bart: 'voll', hut: 'lumpen', dick: .94 },
  bodo: { name: 'Bodo Kranz', oben: 'stoffRot', hose: 'hose', ding: 'brett', schaerpe: 'gold', weste: 'stoffGrau', haar: 'haarBraun', bart: 'schnauz', bauch: 4, guertel: 'lederDkl', stiefel: 'lederDkl' },
  hilde: { name: 'Oma Hilde', mass: .88, oben: 'stoffOcker', rock: 'stoffGrau', frisur: 'kopftuch', tuch: 'stoffHell', haar: 'haarWeiss', umhang: 'stoffRot', ding: 'nudelholz', dick: .9 },
  piet: { name: 'Piet', oben: 'stoffBlau', hose: 'lumpen', haar: 'haarGrau', bart: 'voll', hut: 'blauDkl', hutBand: 'stoffGrau', ding: 'angel', stiefel: 'lederDkl', haut: 'hautDkl' },
  hanne: { name: 'Hanne Kehl', oben: 'rostDkl', hose: 'lederDkl', haar: 'haarSchwarz', frisur: 'zopf', brilleOben: true, guertel: 'gurt', ding: 'schluessel', nackteArme: true, dick: 1 },
  bauer: { name: 'Bauer', oben: 'stoffGruen', hose: 'stoffOcker', haar: 'haarBlond', hut: 'stoffOcker', ding: 'schaufel', nackteArme: true },
  magd: { name: 'Bäuerin', oben: 'stoffBlau', rock: 'stoffOcker', schuerze: 'leinen', frisur: 'kopftuch', tuch: 'stoffRot', ding: 'korb', dick: .9, nackteArme: true },
  bergmann: { name: 'Bergmann', oben: 'stoffGrau', hose: 'lumpen', haar: 'haarBraun', bart: 'voll', kappe: 'lumpen', ding: 'schaufel', guertel: 'gurt', haut: 'hautDkl', dick: 1.04 },
  haendler: { name: 'Händler', oben: 'stoffGrau', hose: 'stoffOcker', haar: 'haarBraun', hut: 'lumpen', umhang: 'stoffBlau', bart: 'schnauz', guertel: 'gurt', ding: 'korb' },
  flickerin: { name: 'Flickerin', oben: 'leinen', hose: 'stoffBlau', haar: 'haarBraun', frisur: 'lang', schuerze: 'lederDkl', dick: .9 },
};
// ---------- Maschinen, Tiere und Bosse. Sie schauen nach rechts und werden für links gespiegelt. ----------
const panzer = (m, f, st = 'metall', o = {}) => m.form(f, st, { rund: 3, ...glatt, muster: kratzer2, ...o });
const auge = (m, x, y, an = true, farbe = 'rot', r = 2.4) => m.form(M.ell(x, y, r, r), an ? farbe : 'russ', { rund: 1, leuchtet: an, kante: false });
function maschBein(m, x0, y0, x1, y1, x2, y2, st = 'stahlAlt', r = 2.6) { m.form(M.kap(x0, y0, x1, y1, r), st, { rund: 1.6, ...glatt }); m.form(M.kap(x1, y1, x2, y2, r * .85), st, { rund: 1.6, ...glatt }); m.form(M.ell(x1, y1, r + .8, r + .8), 'metall', { rund: 1.2 }); }
function zeichneKaefer(f, funken) {
  const m = new Blatt(92, 62), q = f ? 3 : -3;
  for (const [x, s] of [[24, 1], [42, -1], [60, 1]]) { const d = s * q; m.form(M.kap(x, 40, x - 6 + d, 58, 2), 'rostDkl', { rund: 1 }); }
  m.form(M.ell(44, 32, 30, 20), 'rost', { rund: 9, rau: .5, korn: 3, muster: (x, y) => (fbm(x / 7, y / 7) > .6 ? -.2 : .02) }); m.linie([[16, 26], [34, 18], [58, 18], [72, 28]], 'rostDkl', { hell: .1 }); for (const [x, y] of [[32, 24], [48, 22], [62, 28]]) m.punkt(x, y, 'stahlAlt', { hell: .4 });
  m.form(M.ell(74, 38, 11, 10), 'rostDkl', { rund: 5 }); auge(m, 79, 36, true, funken ? 'lazi' : 'gelb', 2.4); for (const v of [-1, 1]) m.linie([[80, 32], [88, 28 + v * 3]], 'stahlAlt', { hell: .2 });
  m.form(M.kap(78, 45, 86, 49 - q * .5, 1.6), 'stahlAlt', { rund: 1 });
  if (funken) for (const [x, y] of [[30, 12], [50, 10 + q], [66, 14], [40, 44 - q]]) m.linie([[x, y], [x + 3, y - 4], [x + 1, y - 7]], 'lazi', { leuchtet: true });
  return m;
}
function zeichneGolem(f) {
  const m = new Blatt(150, 172), s = f ? 4 : -4, b = f ? 1 : 0;
  m.form(M.oder(M.box(46 + s, 118, 24, 48), M.box(44 + s, 156, 30, 12)), 'stein', { rund: 5, muster: steine, hell: -.1 });
  m.form(M.oder(M.box(84 - s, 118, 24, 48), M.box(82 - s, 156, 30, 12)), 'stein', { rund: 5, muster: steine });
  m.form(M.kap(36, 48 + b, 24, 78 - s, 12), 'stein', { rund: 7, muster: steine, hell: -.08 }); m.form(M.ell(22, 92 - s, 13, 15), 'stein', { rund: 6, rau: .4, korn: 3, hell: -.06 });
  m.form(M.poly([[42, 34 + b], [112, 34 + b], [120, 76 + b], [106, 124 + b], [50, 124 + b], [36, 76 + b]]), 'stein', { rund: 10, muster: steine, hell: .06 });
  m.form(M.ell(78, 80 + b, 13, 13), 'lazi', { rund: 5, leuchtet: true }); for (const [a, c] of [[66, 74], [92, 90], [72, 96], [90, 66]]) m.linie([[78, 80 + b], [a, c + b]], 'lazi', { leuchtet: true, hell: -.2 });
  m.form(M.kap(118, 48 + b, 130, 78 + s, 12), 'stein', { rund: 7, muster: steine }); m.form(M.ell(132, 92 + s, 14, 16), 'stein', { rund: 6, rau: .4, korn: 3 });
  m.form(M.oder(M.box(60, 8 + b, 40, 30), M.ell(80, 10 + b, 20, 8)), 'stein', { rund: 7, muster: steine, hell: .1 }); m.form(M.box(68, 22 + b, 28, 5), 'russ', { rund: 1 }); auge(m, 76, 24.4 + b, true, 'lazi', 2.2); auge(m, 90, 24.4 + b, true, 'lazi', 2.2);
  m.form(M.ell(44, 44 + b, 11, 7), 'moos', { rund: 3, rau: .7, korn: 2 }); m.form(M.ell(108, 118 + b, 8, 5), 'moos', { rund: 2, rau: .7, korn: 2 });
  return m;
}
function zeichneWartungsbot(f) {
  const m = new Blatt(72, 84), s = f ? 3 : -3, b = f ? 1 : 0;
  for (const [x, v] of [[24, s], [46, -s]]) { m.form(M.kap(x, 58, x + v, 76, 3), 'stahlAlt', { rund: 1.6 }); m.form(M.box(x + v - 6, 74, 12, 6), 'metall', { rund: 1.4 }); }
  m.form(M.kap(16, 38 + b, 10, 56 - s, 2.2), 'stahlAlt', { rund: 1.2 });
  panzer(m, M.oder(M.box(16, 28 + b, 42, 34), M.ell(37, 28 + b, 21, 12)), 'metall', { muster: (x, y) => (fbm(x / 7, y / 7) > .6 ? -.18 : 0) });
  // Gelb ist nur noch in Resten da: die Warnstreifen von damals
  m.form(M.box(16, 50 + b, 42, 5), 'gelb', { rund: .6, hell: -.3, muster: (x, y) => (Math.round((x + y) / 5) % 2 ? -.5 : 0) + (fbm(x / 3, y / 3) > .6 ? -.3 : 0) });
  m.form(M.box(30, 26 + b, 26, 6), 'russ', { rund: 1 }); m.form(M.box(42, 27.6 + b, 10, 2.8), 'gelb', { rund: 0, leuchtet: true, hell: -.1, kante: false });
  // Werkzeugarm: ein Greifer, der gerade etwas sucht
  m.form(M.kap(56, 38 + b, 64, 50 + s, 2.4), 'stahlAlt', { rund: 1.2 }); m.form(M.oder(M.kap(64, 50 + s, 70, 46 + s, 1.3), M.kap(64, 50 + s, 70, 56 + s, 1.3)), 'metall', { rund: .7, hell: .1 });
  return m;
}
function zeichneDrohne(f) {
  const m = new Blatt(88, 62), b = f ? 1 : 0;
  for (const x of [14, 74]) { m.form(M.kap(x, 22 + b, 44, 30 + b, 2), 'metall', { rund: 1 }); m.form(M.box(x - 3, 16 + b, 6, 7), 'stahlAlt', { rund: 1 }); m.form(M.ell(x, 13 + b, f ? 15 : 5, 2), 'stahl', { rund: 1, hell: -.2, kante: false }); }
  m.form(M.ell(44, 32 + b, 19, 13), 'stahlAlt', { rund: 6, ...glatt }); m.form(M.ell(50, 36 + b, 7, 7), 'russ', { rund: 2 }); auge(m, 52, 36 + b, true, 'rot', 3.4);
  m.form(M.kap(38, 44 + b, 34, 54 + b, 1.6), 'metall', { rund: 1 }); m.form(M.kap(50, 44 + b, 54, 54 + b, 1.6), 'metall', { rund: 1 });
  return m;
}
function zeichneWachbot(f) {
  const m = new Blatt(92, 124), s = [0, 8, -8][f], b = f ? 0 : 1;
  m.form(M.kap(36, 72, 36 - s, 112, 4.4), 'stahlAlt', { rund: 2, ...glatt, hell: -.08 }); m.form(M.box(28 - s, 110, 18, 8), 'metall', { rund: 1.4 });
  m.form(M.kap(26, 40 + b, 20, 72 + s * .4, 4), 'stahlAlt', { rund: 2, ...glatt, hell: -.08 });
  panzer(m, M.poly([[22, 28 + b], [62, 28 + b], [66, 50 + b], [58, 76 + b], [26, 76 + b], [18, 50 + b]]));
  m.form(M.box(26, 62 + b, 32, 5), 'gelb', { rund: .6, hell: -.1, muster: (x) => Math.round(x / 7) % 2 ? -.5 : 0 }); auge(m, 42, 48 + b, true, 'lazi', 4);
  m.form(M.kap(48, 72, 48 + s, 112, 4.4), 'stahlAlt', { rund: 2, ...glatt }); m.form(M.box(40 + s, 110, 18, 8), 'metall', { rund: 1.4 });
  m.form(M.kap(60, 40 + b, 70, 62 + b, 4), 'stahlAlt', { rund: 2, ...glatt }); m.form(M.box(66, 58 + b, 22, 7), 'metall', { rund: 1 }); auge(m, 87, 61.5 + b, true, 'gelb', 1.6);
  panzer(m, M.oder(M.box(28, 10 + b, 28, 20), M.ell(42, 10 + b, 14, 7))); m.form(M.box(32, 15 + b, 22, 6), 'russ', { rund: 1 }); auge(m, 50, 18 + b, true, 'rot', 2.6);
  return m;
}
function zeichneZelt(k) {
  const m = new Blatt(210, 170), B = 164, c = 105;
  if (k === 2) { for (const [a, e] of [[60, 130], [146, 138]]) m.form(M.kap(a, 164, c + (a - c) * .4, e, 3), 'holz', { rund: 2, hell: -.4 }); m.form(M.ell(c, 154, 72, 14), 'russ', { rund: 3, rau: .7, korn: 3 }); for (const x of [78, 124]) m.form(M.ell(x, 148, 8, 4), 'feuer', { rund: 1, leuchtet: true, hell: -.3 }); return m; }
  const risse = k === 1 ? (x, y) => fbm(x / 9, y / 9) < .36 : () => false;
  m.form((x, y) => M.poly([[c, 26], [c + 92, 164], [c - 92, 164]])(x, y) && !risse(x, y), 'leinen', { rund: 5, muster: falten, hell: -.04 });
  m.form(M.poly([[c, 56], [c + 22, 164], [c - 22, 164]]), 'russ', { rund: 1 }); m.form(M.poly([[c, 56], [c + 22, 164], [c + 40, 164]]), 'leinen', { rund: 2, hell: .08, muster: falten });
  m.form(M.kap(c, 8, c, 40, 2), 'holz', { rund: 1 }); m.form(M.poly([[c + 1, 8], [c + 26, 14], [c + 1, 24]]), 'stoffRot', { rund: 1, muster: falten });
  for (const v of [-1, 1]) m.linie([[c + v * 50, 90], [c + v * 100, 166]], 'lumpen', { hell: .2 });
  for (const [x, y] of [[36, 150], [172, 152]]) m.form(M.box(x - 12, y, 24, 16), 'holz', { rund: 1.4, muster: maserung });
  return m;
}
function zeichneAusguck() {
  const m = new Blatt(150, 262), c = 75, p = 90;
  for (const v of [-1, 1]) m.form(M.kap(c + v * 42, 258, c + v * 28, p, 4), 'holz', { rund: 2, muster: maserung, hell: -.16 });
  for (let i = 0; i < 3; i++) { const y0 = 254 - i * 54, y1 = y0 - 50; m.form(M.kap(c - 40 + i * 4, y0, c + 36 - i * 4, y1, 1.8), 'holz', { rund: 1, hell: -.1 }); m.form(M.kap(c + 40 - i * 4, y0, c - 36 + i * 4, y1, 1.8), 'holz', { rund: 1, hell: -.1 }); }
  m.form(M.box(c - 46, p - 6, 92, 8), 'holz', { rund: 2, muster: maserung }); m.form(M.box(c - 42, p - 34, 84, 28), 'holz', { rund: 2, muster: bohlenMuster }); blechFlickenM(m, c - 30, p - 30, 26, 16);
  m.form(M.ell(c + 6, p - 42, 7, 8), 'hautAlt', { rund: 3 }); m.form(M.ell(c + 6, p - 46, 8, 5), 'rostDkl', { rund: 2 }); m.form(M.box(c, p - 41, 12, 5), 'stoffRot', { rund: 1 }); m.form(M.kap(c + 14, p - 34, c + 42, p - 44, 1.4), 'holz', { rund: .8 });
  for (const v of [-1, 1]) m.form(M.box(c + v * 38 - 2, p - 72, 4, 40), 'holz', { rund: 1 }); m.form(M.poly([[c - 54, p - 62], [c + 54, p - 62], [c + 32, p - 84], [c - 32, p - 84]]), 'lumpen', { rund: 2, muster: falten });
  return m;
}
function blechFlickenM(m, x, y, b, h) { m.form(M.poly([[x, y + 3], [x + b, y], [x + b + 1, y + h], [x + 1, y + h + 2]]), 'wellblech', { rund: 1, hell: -.12, muster: (a) => Math.round(a) % 7 < 2 ? -.2 : .04 }); }
const nahten = (x, y) => (Math.round(y) % 25 < 2 ? -.22 : 0) + (Math.round(x) % 37 < 1 ? -.14 : 0) + (fbm(x / 13, y / 13) > .66 ? .1 : 0);
function zeichneSchutzturm(f) {
  // Geschützkopf auf einem massiven Sockel aus Beton und Stahl: kein Dreibein, keine Schürze.
  const m = new Blatt(190, 200), c = 74, z = f ? -6 : 0;
  m.form(M.poly([[c - 54, 196], [c + 54, 196], [c + 46, 172], [c - 46, 172]]), 'betonGrau', { rund: 3, muster: flecken });
  m.form(M.poly([[c - 36, 174], [c + 36, 174], [c + 28, 92], [c - 28, 92]]), 'stahlAlt', { rund: 5, ...glatt, muster: kratzer2 });
  for (const v of [-1, 1]) m.form(M.poly([[c + v * 36, 174], [c + v * 54, 174], [c + v * 30, 118]]), 'eisenDkl', { rund: 2, ...glatt });
  m.form(M.box(c - 32, 150, 64, 7), 'gelb', { rund: 0, hell: -.36, muster: (x) => Math.round(x / 7) % 2 ? -.5 : 0 }); m.form(M.box(c - 14, 110, 28, 30), 'russ', { rund: 1 }); m.linie([[c - 10, 118], [c + 10, 118]], 'stahlAlt', {}); m.linie([[c - 10, 130], [c + 10, 130]], 'stahlAlt', {});
  m.form(M.oder(M.box(c - 26, 74, 52, 22)), 'metall', { rund: 3, ...glatt, muster: kratzer2 });
  m.form(M.kap(c + 18, 74, c + 30, 112, 3), 'gurt', { rund: 1.4, muster: (x, y) => Math.round(y) % 5 < 2 ? .3 : -.2 });
  // Drehkopf, flach und schwer, mit Sehschlitz
  m.form(M.poly([[c - 40, 66], [c - 30, 28], [c + 26, 22], [c + 46, 40], [c + 46, 70]]), 'stahlAlt', { rund: 5, ...glatt, muster: kratzer2 });
  m.form(M.poly([[c - 32, 62], [c - 26, 36], [c - 8, 34], [c - 10, 62]]), 'metall', { rund: 2, hell: -.1 }); for (const [a, b2] of [[c - 26, 42], [c - 16, 40], [c - 26, 56], [c - 16, 56]]) m.punkt(a, b2, 'stein', { hell: .5 });
  m.form(M.box(c + 4, 36, 34, 7), 'russ', { rund: 1 }); m.form(M.box(c + 22, 37.6, 14, 3.6), f ? 'lazi' : 'rot', { rund: 0, leuchtet: true, kante: false });
  for (const y of [48, 60]) { m.form(M.box(c + 44 + z, y, 62, 7), 'metall', { rund: 2, ...glatt }); m.form(M.box(c + 100 + z, y - 2, 10, 11), 'stahlAlt', { rund: 1.4, ...glatt }); if (f) m.form(M.ell(c + 112 + z, y + 3.5, 4.4, 4.4), 'lazi', { rund: 2, leuchtet: true }); }
  m.form(M.kap(c - 34, 30, c - 40, 8, 1.4), 'metall', { rund: .8, hell: .1 }); m.punkt(c - 40, 6, 'rot', { leuchtet: true });
  return m;
}
function zeichneSchaltkasten(k) {
  const m = new Blatt(96, 130), c = 48;
  m.form(M.box(c - 36, 16, 72, 104), 'stahlAlt', { rund: 3, muster: (x, y) => (fbm(x / 9, y / 9) > .64 ? -.18 : 0) }); m.form(M.box(c - 40, 118, 80, 8), 'betonGrau', { rund: 1.4 });
  m.form(M.box(c - 28, 26, 56, 50), 'russ', { rund: 1 }); for (let i = 0; i < 6; i++) auge(m, c - 20 + (i % 3) * 20, 38 + (i > 2 ? 20 : 0), k !== 2 && (i + k) % 2 === 0, i % 2 ? 'lazi' : 'gelb', 3);
  m.form(M.box(c - 28, 86, 56, 22), 'metall', { rund: 2 }); for (const x of [-16, 0, 16]) m.form(M.kap(c + x, 92, c + x, 104, 2), k === 2 ? 'rost' : 'gurt', { rund: 1 });
  if (k === 2) { m.form(M.poly([[c - 28, 26], [c, 40], [c + 14, 26]]), 'stahlAlt', { rund: 1, hell: -.2 }); m.linie([[c - 10, 80], [c + 8, 70], [c + 2, 50]], 'feuer', { leuchtet: true }); for (const [x, y] of [[c + 26, 8], [c - 20, 6]]) m.form(M.ell(x, y, 6, 5), 'russ', { rund: 2, kante: false }); }
  return m;
}
function zeichneKabelknoten(an, f) {
  // Der Kasten mit den Isolatoren steht auf einem Betonfuß. Nur zwei armdicke Leitungen laufen seitlich in die Erde.
  const m = new Blatt(150, 136), c = 75, farbe = an ? (f ? 'gelb' : 'lazi') : 'russ';
  for (const v of [-1, 1]) { m.form(M.oder(M.kap(c + v * 30, 104, c + v * 50, 110, 6), M.kap(c + v * 50, 110, c + v * 66, 128, 6)), 'eisenDkl', { rund: 2.6, hell: .05, muster: (x, y) => Math.sin(x * .5 + y * .9) * .14 }); m.form(M.ell(c + v * 66, 130, 13, 4), 'erde', { rund: 1, rau: .7, korn: 2 }); if (an) { const t = f ? .3 : .75; m.form(M.ell(c + v * (30 + 36 * t), 104 + 24 * t, 2.8, 2.8), farbe, { rund: 1, leuchtet: true, kante: false }); } }
  m.form(M.poly([[c - 40, 132], [c + 40, 132], [c + 34, 100], [c - 34, 100]]), 'betonGrau', { rund: 3, muster: flecken }); m.form(M.box(c - 34, 112, 68, 5), 'gelb', { rund: 0, hell: -.36, muster: (x) => Math.round(x / 7) % 2 ? -.5 : 0 });
  m.form(M.poly([[c - 28, 102], [c + 28, 102], [c + 24, 40], [c - 24, 40]]), 'eisenDkl', { rund: 4, muster: nahten });
  m.form(M.box(c - 17, 54, 34, 24), 'russ', { rund: 1 }); for (let i = 0; i < 3; i++) m.form(M.box(c - 13 + i * 10, 58, 7, 16), farbe, { rund: .6, leuchtet: !!an, hell: an && (i + f) % 2 ? .05 : -.26 });
  for (const v of [-1, 0, 1]) { const x = c + v * 17; m.form(M.box(x - 2.2, 22, 4.4, 20), 'metall', { rund: 1 }); for (const y of [24, 29, 34]) m.form(M.ell(x, y, 5, 1.8), 'stein', { rund: 1, hell: .16 }); }
  if (an) { m.linie([[c - 17, 20], [c - 8, 13 + f * 4], [c, 20]], 'lazi', { leuchtet: true }); m.linie([[c, 20], [c + 8, 13 + (1 - f) * 4], [c + 17, 20]], 'lazi', { leuchtet: true }); }
  return m;
}
function zeichneZaehlsaeule(f, rot) {
  const m = new Blatt(84, 170), c = 42, far = rot ? 'rot' : 'lazi';
  m.form(M.box(c - 28, 150, 56, 16), 'betonGrau', { rund: 2 }); panzer(m, M.poly([[c - 22, 152], [c + 22, 152], [c + 15, 18], [c - 15, 18]]), 'stahlAlt');
  m.form(M.box(c - 11, 34, 22, 46), far, { rund: .8, leuchtet: true, hell: -.26, muster: (x, y) => Math.round(y) % 4 < 1 ? -.3 : 0 }); for (let i = 0; i < 4; i++) m.form(M.box(c - 8, 40 + i * 10, (f + i) % 2 ? 16 : 9, 3), far, { rund: 0, leuchtet: true, hell: .3, kante: false });
  m.form(M.ell(c, 16, 15, 8), 'metall', { rund: 3, ...glatt }); auge(m, c, 14, true, far, 4); for (const y of [100, 118, 136]) m.linie([[c - 17, y], [c + 17, y]], 'metall', { hell: .3 });
  return m;
}
function zeichneKesselwaerter(modus, f) {
  // Breite Heizmaschine: Schultern mit Abzügen, im Brustkorb das Feuermaul. Statt Hände hat sie zwei riesige Schaufeln: Dreihundert Jahre Kohle.
  const m = new Blatt(340, 292), s = modus === 'lauf' ? (f ? 12 : -12) : 0, b = modus === 'ruhe' && f ? 2 : 0, heiss = modus === 'heiss', hoch = modus === 'hoch', c = 170, leib = heiss ? 'rostDkl' : 'kessel';
  for (const [x, v, h] of [[c - 46, s, -.14], [c + 46, -s, 0]]) { m.form(M.kap(x, 196 + b, x + v, 256, 20), 'stahlAlt', { rund: 6, ...glatt, hell: h, muster: kratzer2 }); m.form(M.kap(x + 18, 206 + b, x + v + 16, 248, 4), 'metall', { rund: 2, ...glatt, hell: h + .1 }); m.form(M.poly([[x + v - 36, 286], [x + v + 38, 286], [x + v + 28, 250], [x + v - 28, 250]]), 'metall', { rund: 3, hell: h, muster: flecken }); }
  const schaufel = (hx, hy, v, kohle) => { const p = [[hx - 30, hy], [hx + 30, hy], [hx + 46, hy + 92], [hx - 46, hy + 92]]; m.form(M.poly(p), 'stahlAlt', { rund: 5, muster: (x, y) => (fbm(x / 7, y / 7) > .56 ? -.28 : -.04) + (Math.round(x) % 19 < 2 ? -.16 : 0) }); m.form(M.poly([[hx - 40, hy + 78], [hx + 40, hy + 78], [hx + 46, hy + 92], [hx - 46, hy + 92]]), 'metall', { rund: 1, ...glatt, hell: .2 }); if (kohle) m.form(M.poly([[hx - 30, hy + 44], [hx + 30, hy + 44], [hx + 38, hy + 78], [hx - 38, hy + 78]]), 'glut', { rund: 3, leuchtet: true, hell: heiss ? .14 : -.1, muster: (x, y) => fbm(x / 6, y / 6 + f) * .5 - .24 }); for (const q of [-18, 18]) m.form(M.kap(hx + q, hy - 18, hx + q, hy + 6, 5), 'metall', { rund: 2, ...glatt }); };
  // Linker Arm und Schaufel hinter dem Rumpf
  m.form(M.kap(c - 96, 76 + b, c - 118, 142 + b, 18), 'stahlAlt', { rund: 7, ...glatt, hell: -.12 }); schaufel(c - 118, 150 + b + s * .4, -1, false);
  // Rumpf, oben breiter, unten eingezogen
  m.form(M.poly([[c - 78, 50 + b], [c + 78, 50 + b], [c + 92, 100 + b], [c + 70, 210 + b], [c - 70, 210 + b], [c - 92, 100 + b]]), leib, { rund: 12, ...glatt, muster: (x, y) => (Math.round(y) % 32 < 2 ? -.3 : 0) + (fbm(x / 13, y / 13) > .62 ? -.14 : 0) });
  for (let y = 64; y < 206; y += 32) for (let x = c - 74; x < c + 78; x += 16) m.punkt(x, y + b, 'stahlAlt', { hell: .5 });
  // Feuermaul: Mitte fast weiß, nach außen Gelb, Orange, Dunkelrot, davor Roststäbe
  const oy = 140 + b; m.form(M.poly([[c - 58, oy - 44], [c + 58, oy - 44], [c + 48, oy + 44], [c - 48, oy + 44]]), 'russ', { rund: 3, hell: -.3 });
  const glutF = (x, y) => Math.hypot((x - c) / 50, (y - oy) / 36); for (const [r, far, h] of [[1, 'rotDkl', .08], [.8, 'glut', .02], [.58, 'feuer', heiss ? .2 : 0], [.34, 'putz', .22]]) m.form((x, y) => glutF(x, y) <= r + (fbm(x / 8, y / 7 + f) - .5) * .34, far, { rund: 1, leuchtet: true, hell: h, kante: false });
  for (const v of [-30, -15, 0, 15, 30]) m.form(M.box(c + v - 2, oy - 44, 4, 88), 'rostDkl', { rund: 1 });
  // Schultern mit Abzügen, der Kopf sitzt tief dazwischen
  for (const [x, v] of [[c - 76, -1], [c + 76, 1]]) { m.form(M.ell(x, 64 + b, 36, 27), 'stahlAlt', { rund: 8, ...glatt, muster: kratzer2 }); m.form(M.box(x - 10 + v * 14, 8 + b, 20, 36), 'metall', { rund: 2, muster: flecken }); m.form(M.box(x - 13 + v * 14, 4 + b, 26, 7), 'stahlAlt', { rund: 1.4 }); }
  m.form(M.poly([[c - 28, 64 + b], [c - 24, 28 + b], [c + 24, 28 + b], [c + 28, 64 + b]]), 'metall', { rund: 4, ...glatt, muster: kratzer2 }); m.form(M.box(c - 19, 40 + b, 38, 7), 'russ', { rund: 1 }); m.form(M.box(c - 13, 41.6 + b, 26, 3.6), heiss ? 'rot' : 'gelb', { rund: 0, leuchtet: true, kante: false });
  // Rechter Arm: im Angriff hebt er die große Schaufel über den Kopf
  const hy = hoch ? 8 : 150 - s * .4, hx = hoch ? c + 118 : c + 122; m.form(M.kap(c + 96, 76 + b, hx, (hoch ? 50 : 140) + b, 18), 'stahlAlt', { rund: 7, ...glatt }); m.form(M.ell(c + 96, 70 + b, 22, 22), 'stahlAlt', { rund: 7, ...glatt, hell: .06 }); schaufel(hx, hy + b, 1, true);
  return m;
}
function zeichneVorarbeiter(f, offen) {
  // Eine Raupe, flach und breit, mit einer eingesunkenen Kabine. Ein einziger langer Greifarm hängt über dem Helden.
  const m = new Blatt(360, 286), kx = f ? 6 : 0, c = 150, bo = 278;
  m.form(M.oder(M.box(c - 112, bo - 60, 224, 60), M.ell(c - 112, bo - 30, 30, 30), M.ell(c + 112, bo - 30, 30, 30)), 'eisenDkl', { rund: 6, muster: (x, y) => (y < bo - 52 || y > bo - 10 ? (Math.round(x + kx) % 14 < 5 ? .22 : -.1) : 0) }); for (let i = 0; i < 9; i++) m.form(M.ell(c - 112 + i * 28, bo - 30, 11, 11), 'stahlAlt', { rund: 3, hell: -.06 }); for (let i = 0; i < 9; i++) m.form(M.ell(c - 112 + i * 28, bo - 30, 3, 3), 'russ', { rund: 1 });
  // Flacher Rumpf, Gelb nur als abgeschabte Warnstreifen
  m.form(M.poly([[c - 120, bo - 62], [c + 112, bo - 62], [c + 126, bo - 118], [c + 76, bo - 138], [c - 96, bo - 136]]), 'eisenDkl', { rund: 8, ...glatt, muster: nahten });
  m.form(M.poly([[c - 116, bo - 72], [c + 118, bo - 72], [c + 120, bo - 82], [c - 118, bo - 82]]), 'gelb', { rund: 0, hell: -.42, muster: (x, y) => (Math.round((x + y) / 9) % 2 ? -.5 : 0) + (fbm(x / 5, y / 3) > .55 ? -.5 : 0) });
  // Luke zum Kern: geschlossen ein Schlitz, offen das einzige Licht
  if (offen) { m.form(M.poly([[c - 64, bo - 126], [c - 4, bo - 128], [c - 2, bo - 84], [c - 66, bo - 84]]), 'russ', { rund: 2, hell: -.3 }); m.form(M.ell(c - 34, bo - 106, 20, 19), 'lazi', { rund: 7, leuchtet: true, hell: .12 }); m.form(M.poly([[c - 64, bo - 126], [c - 92, bo - 150], [c - 40, bo - 158], [c - 4, bo - 128]]), 'eisenDkl', { rund: 2, ...glatt, hell: .08 }); } else { m.form(M.poly([[c - 64, bo - 126], [c - 4, bo - 128], [c - 2, bo - 84], [c - 66, bo - 84]]), 'stahlAlt', { rund: 2, ...glatt, hell: -.24 }); for (const y of [108, 96]) m.linie([[c - 58, bo - y], [c - 8, bo - y]], 'russ', {}); }
  // Eingesunkene Kabine, 50 breit, ein schmaler Schlitz
  m.form(M.poly([[c + 22, bo - 128], [c + 76, bo - 126], [c + 72, bo - 172], [c + 30, bo - 174]]), 'stahlAlt', { rund: 4, ...glatt, hell: -.24 }); m.form(M.box(c + 36, bo - 160, 30, 6), offen ? 'lazi' : 'rot', { rund: 0, leuchtet: true, kante: false, hell: -.1 });
  m.form(M.box(c - 110, bo - 158, 14, 26), 'eisenDkl', { rund: 2 }); m.form(M.box(c - 113, bo - 162, 20, 5), 'stahlAlt', { rund: 1, hell: -.1 });
  // Der Greifarm: oben hoch, weit nach vorn, die Zange hängt über dem Boden
  const sx = c + 50, sy = bo - 120, ex2 = c + 118, ey2 = 22 + (f ? 2 : 0), hx = c + 186, hy = 88 + (f ? 4 : 0);
  m.form(M.ell(sx, sy, 22, 22), 'eisenDkl', { rund: 6, ...glatt, hell: .08 }); m.form(M.kap(sx, sy, ex2, ey2, 14), 'eisenDkl', { rund: 5, ...glatt, muster: nahten }); m.form(M.ell(ex2, ey2, 15, 15), 'stahlAlt', { rund: 5, ...glatt, hell: -.1 }); m.form(M.kap(ex2, ey2, hx, hy, 10), 'eisenDkl', { rund: 4, ...glatt, muster: nahten }); m.form(M.kap(sx + 22, sy - 36, ex2 + 6, ey2 + 36, 3.6), 'metall', { rund: 1.6, ...glatt });
  for (const v of [-1, 1]) m.form(M.oder(M.kap(hx, hy, hx + v * 24, hy + 38, 6), M.kap(hx + v * 24, hy + 38, hx + v * 8, hy + 78, 4)), 'stahlAlt', { rund: 2, ...glatt, hell: -.12 });
  return m;
}
function zeichneWaagmeister(f, wankt, kern) {
  // Kein Mönch mit Joch, sondern ein Beamter der alten Welt: langer Mantel, Maske aus Messing, das Hauptbuch im Arm. Die Waage ragt aus dem Gestell auf seinem Rücken wie ein Galgen über ihm.
  const m = new Blatt(270, 306), c = 135, k = wankt ? (f ? 8 : -8) : 0, s = f ? 4 : -4, mantel = kern ? 'eisenDkl' : 'stoffGrau', fein = kern ? { ...glatt, muster: nahten } : { muster: falten };
  // Gestell und Waagebalken hinter dem Körper
  m.form(M.kap(c, 120, c, 34, 5), 'gold', { rund: 2, hell: -.3 }); const ly = wankt ? 44 + k : 34, ry = wankt ? 24 + k : 34;
  m.form(M.kap(c - 112, ly, c + 112, ry, 4), 'gold', { rund: 2, hell: -.24 }); m.form(M.ell(c, 30, 12, 12), 'gold', { rund: 4, hell: -.14 }); m.form(M.ell(c, 30, 4, 4), 'russ', { rund: 1 });
  for (const [x, y] of [[c - 112, ly], [c + 112, ry]]) { m.linie([[x, y], [x - 26, y + 96], [x + 26, y + 96], [x, y]], 'stahlAlt', {}); m.form(M.oder(M.ell(x, y + 98, 29, 7), M.box(x - 28, y + 92, 56, 6)), 'gold', { rund: 2, hell: -.26 }); for (const q of [-12, 2, 14]) m.form(M.box(x + q - 4, y + 82, 8, 10), 'metall', { rund: 1.4 }); }
  for (const [x, v] of [[c - 24, s], [c + 24, -s]]) { m.form(M.kap(x, 196, x + v, 276, 11), 'hose', { rund: 3, hell: -.2 }); m.form(M.poly([[x + v - 16, 298], [x + v + 22, 298], [x + v + 14, 278], [x + v - 11, 278]]), 'lederDkl', { rund: 2 }); }
  // Mantel bis zum Knie, zwei Gurte, Knopfleiste
  m.form(M.poly([[c - 44, 86], [c + 44, 86], [c + 54, 150], [c + 62 + s, 256], [c - 62 + s, 256], [c - 54, 150]]), mantel, { rund: 7, ...fein, hell: -.12 });
  m.form(M.poly([[c - 8, 88], [c + 8, 88], [c + 10, 254], [c - 10, 254]]), kern ? 'metall' : 'hose', { rund: 2 }); for (let y = 100; y < 240; y += 24) m.form(M.ell(c, y, 2.8, 2.8), 'gold', { rund: 1, hell: -.1 });
  for (const y of [140, 176]) m.form(M.box(c - 54, y, 108, 7), 'lederDkl', { rund: 1 }); m.form(M.box(c - 8, 136, 16, 15), 'gold', { rund: 1, hell: -.14 });
  if (kern) { m.form(M.ell(c, 112, 15, 15), 'russ', { rund: 1 }); auge(m, c, 112, true, 'lazi', 11); }
  // Linker Arm hält das Hauptbuch vor der Brust, rechter das Gewicht
  m.form(M.kap(c - 50, 96, c - 62, 150, 10), mantel, { rund: 4, ...fein }); m.form(M.kap(c - 62, 150, c - 22, 166, 9), mantel, { rund: 4, ...fein }); m.form(M.poly([[c - 54, 124], [c - 2, 118], [c, 170], [c - 52, 176]]), 'lederDkl', { rund: 2 }); m.form(M.poly([[c - 50, 128], [c - 6, 123], [c - 5, 136], [c - 49, 141]]), 'putz', { rund: .6, hell: -.08 }); m.form(M.ell(c - 18, 168, 7, 7), 'hautAlt', { rund: 2, hell: -.1 });
  m.form(M.kap(c + 50, 96, c + 64, 160, 10), mantel, { rund: 4, ...fein }); m.form(M.ell(c + 64, 168, 7, 7), 'hautAlt', { rund: 2, hell: -.1 }); m.linie([[c + 64, 172], [c + 64, 196]], 'stahlAlt', {}); m.form(M.poly([[c + 52, 196], [c + 76, 196], [c + 82, 224], [c + 46, 224]]), 'metall', { rund: 2, ...glatt });
  for (const v of [-1, 1]) m.form(M.ell(c + v * 44, 92, 18, 13), mantel, { rund: 5, ...fein, hell: .04 });
  // Hoher Kragen, Maske aus Messing mit einem senkrechten Schlitz
  m.form(M.poly([[c - 26, 96], [c + 26, 96], [c + 22, 72], [c - 22, 72]]), mantel, { rund: 3, ...fein, hell: -.16 });
  m.form(M.oder(M.ell(c, 58, 18, 24)), 'gold', { rund: 7, ...glatt, hell: -.2, muster: kratzer2 }); m.form(M.box(c - 2, 42, 4, 34), 'russ', { rund: .5 }); m.form(M.box(c - 2, 52, 4, 5), kern ? 'lazi' : 'gelb', { rund: 0, leuchtet: true, kante: false }); m.linie([[c - 12, 50], [c + 12, 50]], 'gold', { hell: -.44 });
  m.form(M.poly([[c - 24, 46], [c + 24, 46], [c + 17, 22], [c - 17, 22]]), 'eisenDkl', { rund: 3, ...glatt });
  return m;
}
function zeichneTreiberEntfaellt() { return null; }
function zeichneHerdenlaeufer(f) {
  // Lastläufer: ein gepanzerter Packläufer. Dicke Gelenke, ein Rammschild vorn, die Fracht ist verzurrt.
  const m = new Blatt(290, 206), s = f ? 14 : -14, bein = (x, v, h) => { m.form(M.kap(x, 108, x + v + 14, 136, 13), 'stahlAlt', { rund: 4, ...glatt, hell: h }); m.form(M.kap(x + v + 14, 136, x + v, 188, 10), 'metall', { rund: 3, ...glatt, hell: h }); m.form(M.ell(x + v + 14, 136, 14, 14), 'gurt', { rund: 4, hell: h }); m.form(M.poly([[x + v - 19, 202], [x + v + 21, 202], [x + v + 13, 184], [x + v - 11, 184]]), 'stahlAlt', { rund: 2, hell: h, muster: flecken }); };
  bein(62, s, -.2); bein(196, -s, -.2);
  m.form(M.poly([[22, 50], [214, 44], [250, 66], [246, 112], [34, 122], [14, 92]]), 'metall', { rund: 7, ...glatt, muster: (x, y) => (Math.round(x) % 42 < 2 ? -.26 : 0) + (Math.round(y) % 25 < 2 ? -.18 : 0) }); m.form(M.box(22, 88, 226, 8), 'gelb', { rund: 0, hell: -.44, muster: (x, y) => (Math.round(x / 9) % 2 ? -.5 : 0) + (fbm(x / 5, y / 3) > .5 ? -.5 : 0) });
  for (const x of [40, 82, 124, 166, 208]) for (const y of [62, 104]) m.punkt(x, y, 'stahlAlt', { hell: .4 }); m.form(M.box(24, 108, 216, 6), 'russ', { rund: 1, muster: (x) => Math.round(x / 10) % 2 ? .3 : -.3 });
  for (const [x, b2, h, c] of [[40, 46, 40, 'holz'], [90, 40, 32, 'rostDkl'], [134, 46, 40, 'holz'], [184, 34, 28, 'metall']]) m.form(M.box(x, 48 - h, b2, h), c, { rund: 2, muster: (a) => Math.round(a) % 9 === 0 ? -.3 : 0 }); for (const x of [66, 112, 160]) m.form(M.box(x, 6, 4, 44), 'gurt', { rund: .8 });
  // Kopf mit Rammschild und Sensorleiste, gesenkt wie ein Stier
  m.form(M.poly([[236, 60], [278, 72], [286, 112], [262, 134], [236, 118]]), 'stahlAlt', { rund: 5, ...glatt, muster: kratzer2 }); m.form(M.box(250, 82, 28, 7), 'russ', { rund: 1 }); m.form(M.box(256, 83.6, 20, 3.6), 'gelb', { rund: 0, leuchtet: true, kante: false }); for (const y of [100, 112, 124]) m.form(M.poly([[258 + (y - 100) * .1, y], [282 - (y - 100) * .3, y - 2], [280 - (y - 100) * .3, y + 5], [258, y + 7]]), 'metall', { rund: 1, hell: .08 });
  bein(112, -s, 0); bein(166, s, 0);
  return m;
}
function zeichneSchaltwaechter(f) {
  const m = new Blatt(230, 256), s = f ? 8 : -8, b = f ? 1 : 0, c = 112;
  for (const [x, v, h] of [[c - 30, s, -.1], [c + 30, -s, 0]]) { m.form(M.kap(x, 150, x + v, 232, 15), 'stahlAlt', { rund: 5, ...glatt, hell: h, muster: kratzer2 }); m.form(M.poly([[x + v - 24, 252], [x + v + 28, 252], [x + v + 18, 228], [x + v - 16, 228]]), 'metall', { rund: 2, hell: h }); }
  m.form(M.kap(c - 66, 76 + b, c - 88, 146 - s, 13), 'metall', { rund: 4, ...glatt }); m.form(M.box(c - 110, 142 - s, 46, 54), 'stahlAlt', { rund: 3, muster: flecken });
  panzer(m, M.poly([[c - 58, 58], [c + 58, 58], [c + 72, 118], [c + 46, 166], [c - 46, 166], [c - 72, 118]]), 'stahlAlt');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) m.form(M.box(c - 44 + j * 18, 74 + i * 26, 14, 18), (i + j + f) % 2 ? 'lazi' : 'gurt', { rund: 1, leuchtet: (i + j + f) % 2 === 1, hell: -.1 });
  m.form(M.kap(c + 66, 76 + b, c + 90, 140 + s, 13), 'metall', { rund: 4, ...glatt }); m.form(M.kap(c + 90, 140 + s, c + 96, 222 + s, 4), 'stahlAlt', { rund: 1.6, ...glatt }); for (const [a, q] of [[c + 112, 214], [c + 110, 234], [c + 84, 238]]) m.linie([[c + 96, 222 + s], [a, q + s]], 'lazi', { leuchtet: true });
  for (const [x, v] of [[c - 66, -1], [c + 66, 1]]) { m.form(M.ell(x, 66, 28, 21), 'metall', { rund: 7, ...glatt }); m.form(M.poly([[x - 6, 50], [x + 6, 50], [x + v * 6, 22]]), 'stahlAlt', { rund: 1, hell: .1 }); }
  panzer(m, M.poly([[c - 28, 60], [c - 26, 20 + b], [c + 26, 20 + b], [c + 28, 60]])); m.form(M.box(c - 22, 34 + b, 44, 9), 'lazi', { rund: 1, leuchtet: true });
  return m;
}
function zeichneNummerNull(f) {
  // Ein Ring schwebt an sechs Kabeln, die aus dem Boden kommen. In der Mitte der weiße Kern.
  const m = new Blatt(270, 276), c = 135, k = f ? 3 : -3, cy = 96 + k;
  for (const [x, ex, ey, h] of [[8, c - 76, cy + 34, -.18], [262, c + 76, cy + 34, -.18], [48, c - 54, cy + 66, -.06], [222, c + 54, cy + 66, -.06], [96, c - 20, cy + 82, 0], [176, c + 20, cy + 82, 0]]) { const mx = (x + ex) / 2 + (x < c ? -14 : 14), my = (272 + ey) / 2 + 16; m.form(M.oder(M.kap(x, 268, mx, my, 6), M.kap(mx, my, ex, ey, 6)), 'gurt', { rund: 2.6, hell: h, muster: (a, q) => Math.sin(a * .5 + q * .9) * .16 }); m.form(M.oder(M.ell(x, 268, 13, 5)), 'eisenDkl', { rund: 2 }); }
  m.form((x, y) => { const d = Math.hypot(x - c, y - cy); return d <= 85 && d >= 54; }, 'eisenDkl', { rund: 12, ...glatt, muster: nahten }); for (let i = 0; i < 12; i++) { const w = i / 12 * Math.PI * 2; m.form(M.box(c + Math.cos(w) * 70 - 3, cy + Math.sin(w) * 70 - 3, 6, 6), 'stahlAlt', { rund: 1, hell: .1 }); }
  m.form(M.ell(c, cy, 54, 54), 'russ', { rund: 2, hell: -.4 }); m.form(M.ell(c, cy, 44 + k * .5, 44 + k * .5), 'blauDkl', { rund: 6, leuchtet: true, hell: .1 }); m.form(M.ell(c, cy, 32 + k * .5, 32 + k * .5), 'lazi', { rund: 8, leuchtet: true, hell: .14 }); m.form(M.ell(c, cy, 18 + k * .3, 18 + k * .3), 'putz', { rund: 6, leuchtet: true, hell: .24 });
  return m;
}
// ---------- Was auf den Karten herumsteht ----------
function zeichneBusch(sd) {
  const m = new Blatt(130, 92); m.form(M.ell(65, 78, 50, 14), 'blattH', { rund: 4, rau: .9, korn: 2, hell: -.16 }); const rand = (cx, cy, r) => (x, y) => { const w = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, (y - cy) * 1.25); return d <= r * (.82 + hash(Math.floor((w + 3.2) * 4), sd) * .34); };
  for (let i = 0; i < 9; i++) { const x = 18 + hash(i, sd) * 94, y = 40 + hash(i, sd + 3) * 36, r = 14 + hash(i, sd + 5) * 14, q = rand(x, y, r); q.mass = [x - r * 1.3, y - r * 1.3, x + r * 1.3, y + r * 1.3]; m.form(q, i % 3 ? 'moos' : 'blattH', { rund: 5, rau: .9, korn: 2, hell: -.02 + hash(i, sd + 7) * .1 }); }
  return m;
}
function zeichneTruhe(offen) {
  const m = new Blatt(92, 80), b = { rund: 2, muster: (x, y) => (Math.round(y) % 8 < 1 ? -.3 : maserung(x, y)) };
  m.form(M.box(10, 40, 72, 36), 'holz', b);
  if (offen) { m.form(M.poly([[12, 40], [80, 40], [74, 10], [18, 10]]), 'holz', { ...b, hell: -.26 }); m.form(M.box(14, 34, 64, 8), 'gold', { rund: 3, rau: .6, korn: 2, hell: .04 }); for (const x of [24, 42, 58]) m.punkt(x, 34, 'gold', { hell: .5 }); }
  else m.form(M.oder(M.box(8, 26, 76, 16), M.ell(46, 26, 38, 11)), 'holz', { ...b, hell: .05 });
  for (const x of [18, 66]) m.form(M.box(x, offen ? 40 : 18, 8, offen ? 36 : 58), 'metall', { rund: 1.4, ...glatt, hell: -.04 });
  m.form(M.box(38, 36, 16, 14), 'stahlAlt', { rund: 1.4, ...glatt, hell: .1 });
  return m;
}
function zeichneWagen(f, konvoi) {
  const m = new Blatt(196, 126);
  for (const [x, d] of [[44, -.18], [150, -.18]]) { m.form((u, v) => { const r = Math.hypot(u - x, v - 100); return r <= 22 && r >= 16; }, konvoi ? 'russ' : 'holz', { rund: 2, hell: d + .1 }); for (let i = 0; i < 4; i++) { const w = (i + f * .5) * Math.PI / 4; m.form(M.kap(x - Math.cos(w) * 17, 100 - Math.sin(w) * 17, x + Math.cos(w) * 17, 100 + Math.sin(w) * 17, 1.4), konvoi ? 'metall' : 'holz', { rund: .8 }); } m.form(M.ell(x, 100, 4, 4), 'metall', { rund: 1 }); }
  m.form(M.box(14, 64, 168, 26), konvoi ? 'rostDkl' : 'holz', { rund: 2, muster: bohlenMuster });
  if (konvoi) { m.form(M.box(18, 22, 110, 44), 'wellblech', { rund: 2, muster: (x, y) => (Math.round(x) % 7 < 2 ? -.2 : .04) + (fbm(x / 12, y / 10) > .6 ? -.2 : 0), hell: -.12 }); m.form(M.oder(M.box(128, 18, 56, 48), M.poly([[128, 18], [168, 18], [184, 42], [128, 42]])), 'stahlAlt', { rund: 3, ...glatt }); m.form(M.poly([[142, 24], [166, 24], [178, 42], [142, 42]]), 'glasDkl', { rund: 1 }); m.form(M.box(174, 66, 10, 18), 'metall', { rund: 1 }); }
  else { m.form(M.poly([[20, 66], [176, 66], [170, 36], [146, 20], [50, 20], [26, 36]]), 'leinen', { rund: 5, muster: falten }); for (const x of [52, 98, 144]) m.linie([[x, 22], [x + (x - 98) * .06, 66]], 'gurt', {}); }
  return m;
}
function zeichneAutowrack(sd) {
  const m = new Blatt(196, 96), lack = ['rotDkl', 'blauDkl', 'stoffGrau', 'rostDkl'][sd % 4], fleck = (x, y) => fbm(x / 9 + sd, y / 9) > .6 ? -.12 : -.18;
  for (const x of [44, 150]) { if (sd === 2 && x === 150) { m.form(M.ell(x, 88, 22, 6), 'russ', { rund: 2 }); continue; } m.form(M.ell(x, 74, 20, 20), 'russ', { rund: 5, hell: .06 }); m.form(M.ell(x, 74, 8, 8), 'metall', { rund: 2, hell: -.1 }); }
  m.form(M.poly([[8, 72], [10, 50], [40, 46], [62, 20], [132, 20], [158, 46], [190, 52], [190, 72]]), lack, { rund: 5, ...glatt, muster: fleck });
  m.form(M.poly([[68, 26], [98, 26], [98, 46], [52, 46]]), 'russ', { rund: 1, hell: sd % 2 ? 0 : -.1 }); m.form(M.poly([[104, 26], [128, 26], [146, 46], [104, 46]]), sd === 1 ? 'russ' : 'glasDkl', { rund: 1 }); if (sd !== 1) m.linie([[108, 30], [120, 38], [114, 44]], 'stein', { hell: .3 });
  if (sd === 3) m.form(M.box(60, 48, 40, 24), 'russ', { rund: 1 }); else m.linie([[60, 48], [60, 72]], 'russ', {});
  m.form((x, y) => M.poly([[8, 72], [10, 50], [40, 46], [62, 20], [132, 20], [158, 46], [190, 52], [190, 72]])(x, y) && fbm(x / 8 - sd, y / 8) > .62, 'rostDkl', { rund: 1, rau: .5, korn: 2, kante: false }); m.form(M.box(180, 56, 10, 8), 'gelb', { rund: 1, hell: -.4 }); m.form(M.box(6, 64, 14, 6), 'metall', { rund: 1, hell: -.2 });
  if (sd === 0) m.form(M.ell(100, 14, 16, 6), 'moos', { rund: 2, rau: .7, korn: 2 });
  return m;
}
function zeichneSchutt(sd) { const m = new Blatt(126, 66); for (let i = 0; i < 14; i++) { const x = 14 + hash(i, sd) * 98, h = 6 + hash(i, sd + 1) * 16, y = 62 - hash(i, sd + 2) * (28 - Math.abs(x - 63) * .4); m.form(M.box(x - h * .7, y - h, h * 1.4, h), i % 3 ? 'betonGrau' : 'stein', { rund: 2, muster: (a, c) => fbm(a / 5, c / 5) > .62 ? -.2 : 0, hell: -.06 + hash(i, sd) * .12 }); } for (const [a, b, c, d] of [[40, 40, 26, 10], [78, 36, 96, 14]]) m.linie([[a, b], [c, d]], 'rost', {}); return m; }
function zeichneRuine(sd) {
  // Gebrochener Beton läuft in Stufen: Die Oberkante springt alle 14 Pixel
  const m = new Blatt(214, 236), kante = x => { const q = Math.floor(x / 14); return 96 + Math.abs(Math.sin(q * .7 + sd)) * 84 + hash(q, sd) * 34; };
  m.form((x, y) => x > 16 && x < 198 && y < 232 && y > 232 - kante(x), 'betonGrau', { rund: 3, muster: (x, y) => (Math.round(y) % 120 < 2 ? -.24 : 0) + (fbm(x / 13, y / 13) > .6 ? -.14 : 0) });
  for (const y of [150, 30]) for (const x of [36, 88, 140]) { const oben = 232 - Math.min(kante(x), kante(x + 20), kante(x + 40)); if (y >= oben + 8) m.form(M.box(x, y, 40, 66), 'russ', { rund: 1, hell: -.06 }); }
  for (let i = 0; i < 5; i++) { const x = 30 + i * 38; m.linie([[x, 232 - kante(x) + 3], [x + 3, 232 - kante(x) - 16]], 'rost', {}); }
  m.form(M.ell(50, 224, 40, 12), 'moos', { rund: 3, rau: .7, korn: 2, hell: -.1 }); for (const [x, b] of [[150, 26], [176, 18]]) m.form(M.box(x, 232 - b * .7, b, b * .7), 'betonGrau', { rund: 2, hell: .05 });
  return m;
}
function zeichneHochhaus(sd) {
  const m = new Blatt(248, 560), obenK = x => { const q = Math.floor(x / 18); return 18 + hash(q, sd) * 70; };
  m.form((x, y) => x > 12 && x < 236 && y < 556 && y > obenK(x), 'betonGrau', { rund: 3, muster: (x, y) => (Math.round(y) % 125 < 2 ? -.26 : 0) + (fbm(x / 18, y / 22) > .6 ? -.16 : 0), hell: -.12 });
  for (let g = 0; g < 4; g++) for (const x of [30, 100, 170]) { const y = 90 + g * 125; if (g === 3 && x === 100) continue; if (y < Math.max(obenK(x), obenK(x + 44)) + 8) continue; const an = hash(x, g + sd) > .85; m.form(M.box(x, y, 44, 72), an ? 'gelb' : 'russ', an ? { rund: 0, leuchtet: true, hell: -.34 } : { rund: 0, hell: -.1 + hash(x * 3, g) * .1 }); }
  m.form(M.box(94, 456, 60, 100), 'russ', { rund: 1 });
  return m;
}
function zeichneTonne() { const m = new Blatt(60, 78); m.form(M.box(10, 22, 40, 52), 'rostDkl', { rund: 4, muster: (x, y) => (Math.round(y) % 16 < 1 ? -.3 : 0) + (fbm(x / 6, y / 6) > .6 ? -.2 : 0) }); m.form(M.ell(30, 22, 20, 5), 'russ', { rund: 1 }); return m; }
function zeichneBarrikade() { const m = new Blatt(156, 96); for (const [a, b, c, d] of [[6, 88, 150, 30], [6, 40, 150, 84], [16, 62, 142, 62]]) m.form(M.kap(a, b, c, d, 6), 'holz', { rund: 3, muster: maserung }); for (const x of [38, 118]) { m.form(M.ell(x, 78, 16, 15), 'russ', { rund: 4, hell: .08 }); m.form(M.ell(x, 78, 7, 7), 'metall', { rund: 1, hell: -.2 }); } m.form(M.box(58, 40, 40, 30), 'wellblech', { rund: 1, hell: -.16, muster: (x) => Math.round(x) % 7 < 2 ? -.2 : .04 }); return m; }
function zeichneLaziTurm(farbe, f) {
  const m = new Blatt(84, 164), c = 42, far = farbe || 'lazi';
  m.form(M.oder(M.ell(c, 154, 30, 8), M.box(c - 26, 142, 52, 12)), 'stahlAlt', { rund: 3, ...glatt });
  m.form(M.poly([[c - 12, 144], [c + 12, 144], [c + 7, 46], [c - 7, 46]]), 'metall', { rund: 3, ...glatt, muster: (x, y) => Math.round(y) % 18 < 2 ? -.3 : 0 });
  for (const v of [-1, 1]) m.linie([[c + v * 26, 148], [c + v * 7, 90]], 'stahlAlt', { hell: .2 });
  for (const v of [-1, 1]) m.form(M.kap(c, 50, c + v * 20, 34, 2), 'stahlAlt', { rund: 1 });
  m.form(M.poly([[c, 8 + f], [c + 12, 30], [c, 56 - f], [c - 12, 30]]), far, { rund: 3, leuchtet: true, hell: f ? .08 : -.08 });
  return m;
}
function zeichneFeuerballiste(f) { const m = new Blatt(132, 112), c = 62, a = f ? -8 : 0; for (const v of [-1, 1]) m.form(M.kap(c, 66, c + v * 36, 106, 4), 'holz', { rund: 2, muster: maserung }); m.form(M.kap(10 + a, 58, 122 + a, 42, 5), 'holz', { rund: 3, muster: maserung }); m.form(M.oder(M.kap(92 + a, 20, 98 + a, 46, 2.4), M.kap(98 + a, 46, 92 + a, 72, 2.4)), 'metall', { rund: 1, ...glatt }); m.linie([[92 + a, 20], [52 + a, 52], [92 + a, 72]], 'leinen', {}); m.form(M.ell(124 + a, 40, 7, 7), 'glut', { rund: 2, leuchtet: true, hell: f ? .1 : -.1 }); return m; }
function zeichnePuppe() { const m = new Blatt(74, 120), c = 37; m.form(M.box(c - 2, 40, 4, 76), 'holz', { rund: 1 }); m.form(M.kap(c - 28, 52, c + 28, 52, 2), 'holz', { rund: 1 }); m.form(M.ell(c, 62, 16, 24), 'stroh', { rund: 5, rau: .7, korn: 2, hell: -.16 }); m.form(M.poly([[c - 22, 44], [c + 22, 44], [c + 18, 78], [c - 18, 78]]), 'lumpen', { rund: 2, muster: falten }); m.form(M.ell(c, 28, 13, 15), 'leinen', { rund: 5, muster: falten }); for (const v of [-1, 1]) m.linie([[c + v * 6, 25], [c + v * 3, 29]], 'russ', {}); m.linie([[c - 12, 20], [c + 12, 20]], 'rost', {}); return m; }
// p: Pose. b Beine schwingen, hl/hr Bein gehoben, dy Körper hoch und runter, a Arme schwingen, ah Arme heben (1 = über den Kopf, negativ = nach dem Schlag unten), kern Größe des leuchtenden Kerns
// Jedes Element hat seinen eigenen Körper: Metall breit und genietet, Eis aus Kristallen, Feuer verkohlt mit glühenden Rissen, Blitz schlank mit Spulen und Antenne.
const golemPlatten = (x, y) => (Math.round(y) % 13 < 1 || Math.round(x) % 19 < 1 ? -.26 : .03) + (fbm(x / 9, y / 9) > .64 ? -.1 : 0);
const golemKruste = (x, y) => fbm(x / 6, y / 6) > .56 ? -.2 : .06;
const golemKristall = (x, y) => (Math.abs(x * .7 + y) % 17 < 1.6 ? .22 : 0) + (Math.abs(x * .7 - y) % 23 < 1.6 ? -.14 : 0);
function zeichneKleingolem(el, p, k) {
  const { b = 0, hl = 0, hr = 0, dy = 0, a = 0, ah = 0, kern = 8 } = p, O = 22, W = Math.round(80 * k), H = Math.round((92 + O) * k), m = new Blatt(W, H), q = m.skaliert(k), far = { metall: 'stahl', eis: 'lazi', feuer: 'glut', blitz: 'gelb' }[el], y = v => v + O + dy;
  const S = { metall: { mat: 'stahlAlt', muster: golemPlatten, bein: 15, fuss: 21, arm: 7, rund: 2 }, eis: { mat: 'glas', muster: golemKristall, bein: 11, fuss: 15, arm: 5, rund: 1.2 }, feuer: { mat: 'russ', muster: golemKruste, bein: 15, fuss: 19, arm: 7.5, rund: 4 }, blitz: { mat: 'metall', muster: golemPlatten, bein: 8, fuss: 13, arm: 3.6, rund: 2 } }[el], stoff = (hell = 0) => ({ rund: S.rund, muster: S.muster, hell }), glueht = { rund: 1, leuchtet: true, kante: false };
  const bein = (x, heb, hell) => { const c = x + 6.5; q.form(M.oder(M.box(c - S.bein / 2, 62 + O - heb, S.bein, 26), M.box(c - S.fuss / 2, 82 + O - heb, S.fuss, 7)), S.mat, stoff(hell)); if (el === 'feuer') q.form(M.kap(c - 2, 68 + O - heb, c + 2, 80 + O - heb, 1.1), 'glut', glueht); if (el === 'blitz') for (const v of [70, 78]) q.form(M.box(c - S.bein / 2 - 1, v + O - heb, S.bein + 2, 2.4), 'gelb', glueht); };
  const arm = (x0, x1, y1, hell) => { q.form(M.kap(x0, y(30), x1, y1, S.arm), S.mat, stoff(hell)); const mx = (x0 + x1) / 2, my = (y(30) + y1) / 2; if (el === 'feuer') q.form(M.ell(x1, y1, 4.6, 4.6), 'glut', glueht); if (el === 'blitz') for (const t of [-.5, 0, .5]) q.form(M.box(mx + (x1 - x0) * t / 2 - 4.5, my + (y1 - y(30)) * t / 2 - 1.2, 9, 2.4), 'gelb', glueht); if (el === 'eis') q.form(M.poly([[x1 - 5, y1 + 2], [x1, y1 + 11], [x1 + 5, y1 + 2]]), 'glas', stoff(.18)); };
  const lx = 10 + ah * 8, ly = y(54 - a - ah * 52), rx = 70 - ah * 8, ry = y(54 + a - ah * 52);
  bein(22 + b, hl, -.1); bein(46 - b, hr, 0);
  arm(18, lx, ly, -.08);
  if (el === 'metall') q.form(M.poly([[13, y(20)], [67, y(20)], [70, y(46)], [57, y(66)], [23, y(66)], [10, y(46)]]), S.mat, stoff(.05));
  if (el === 'eis') q.form(M.poly([[23, y(18)], [40, y(11)], [57, y(18)], [68, y(38)], [55, y(68)], [40, y(60)], [25, y(68)], [12, y(38)]]), S.mat, stoff(.08));
  if (el === 'feuer') { q.form(M.ell(40, y(43), 28, 25), S.mat, stoff(0)); for (const [x0, y0, x1, y1] of [[22, 30, 30, 44], [30, 44, 24, 58], [58, 30, 50, 46], [50, 46, 57, 58], [34, 26, 37, 31], [43, 60, 46, 66]]) q.form(M.kap(x0, y(y0), x1, y(y1), 1.3), 'glut', glueht); }
  if (el === 'blitz') { q.form(M.poly([[26, y(22)], [54, y(22)], [58, y(40)], [50, y(65)], [30, y(65)], [22, y(40)]]), S.mat, stoff(0)); for (const v of [28, 56]) q.form(M.box(25, y(v), 30, 2.4), 'gelb', glueht); }
  q.form(M.ell(40, y(42), kern, kern), far, { rund: 3, leuchtet: true });
  arm(62, rx, ry, 0);
  if (el === 'metall') { for (const x of [4, 58]) { q.form(M.box(x, y(21), 18, 14), S.mat, { rund: 3, hell: .12 }); for (const u of [x + 4, x + 14]) q.form(M.ell(u, y(25), 1.5, 1.5), 'metall', { rund: .7, hell: .3 }); } for (const [u, v] of [[20, 26], [60, 26], [22, 58], [58, 58]]) q.form(M.ell(u, y(v), 1.6, 1.6), 'metall', { rund: .7, hell: .3 }); }
  if (el === 'eis') for (const [x0, h0] of [[14, 15], [60, 13]]) q.form(M.poly([[x0, y(26)], [x0 + 3, y(26 - h0)], [x0 + 8, y(26)]]), 'glas', stoff(.2));
  if (el === 'metall') { q.form(M.box(27, y(1), 26, 20), S.mat, { rund: 2.4, muster: S.muster, hell: .08 }); q.form(M.box(30, y(9), 20, 5), 'russ', { rund: .6 }); q.form(M.box(32, y(10.4), 16, 2), far, { rund: 0, leuchtet: true, kante: false }); }
  if (el === 'eis') { q.form(M.poly([[29, y(20)], [31, y(5)], [40, y(-9)], [49, y(5)], [51, y(20)]]), S.mat, stoff(.12)); for (const x of [36, 45]) q.form(M.ell(x, y(11), 1.7, 1.7), far, glueht); }
  if (el === 'feuer') { const z = kern * .9; q.form(M.poly([[29, y(4)], [33, y(-z)], [38, y(0)], [42, y(-z - 5)], [47, y(0)], [51, y(-z + 2)], [53, y(4)]]), 'glut', { rund: 1.4, leuchtet: true }); q.form(M.box(28, y(2), 26, 19), S.mat, stoff(.04)); for (const x of [36, 46]) q.form(M.ell(x, y(11), 2, 2), 'glut', glueht); }
  if (el === 'blitz') { q.form(M.kap(40, y(4), 40, y(-11), 1.3), 'stahlAlt', { rund: .6 }); q.form(M.ell(40, y(-12), kern * .34, kern * .34), 'gelb', glueht); q.form(M.ell(40, y(11), 11, 10), S.mat, stoff(.1)); q.form(M.box(32, y(9), 16, 3.6), 'russ', { rund: .6 }); for (const x of [36, 44]) q.form(M.ell(x, y(11), 1.5, 1.5), 'gelb', glueht); }
  return m;
}
// ---------- Kraftwerk, Gasse, Stadt und was sonst noch auf den Karten steht ----------
const flecken = (x, y) => fbm(x / 8, y / 8) > .6 ? -.2 : 0;
const betonM = (x, y) => (fbm(x / 10, y / 10) > .63 ? -.14 : 0) + (Math.round(y) % 40 < 1 ? -.24 : 0);
const ziegelM = (x, y) => ((Math.round(y) % 9 < 1) || ((Math.round(x) + (Math.floor(y / 9) % 2 ? 9 : 0)) % 18 < 1)) ? -.34 : (hash(Math.floor((x + (Math.floor(y / 9) % 2 ? 9 : 0)) / 18), Math.floor(y / 9)) - .5) * .26;
function zeichneLore() { const m = new Blatt(116, 86); for (const x of [30, 86]) { m.form(M.ell(x, 72, 11, 11), 'stahlAlt', { rund: 3, ...glatt }); m.form(M.ell(x, 72, 3, 3), 'russ', { rund: 1 }); } m.form(M.poly([[8, 24], [108, 24], [98, 66], [18, 66]]), 'rostDkl', { rund: 3, muster: flecken }); for (const x of [24, 58, 92]) m.linie([[x, 26], [x + (58 - x) * .1, 64]], 'stahlAlt', { hell: .1 }); m.form(M.ell(58, 26, 44, 10), 'russ', { rund: 3, rau: .9, korn: 2 }); return m; }
function zeichneKohlehaufen(sd) { const m = new Blatt(150, 80); m.form((x, y) => M.ell(75, 78, 70, 42 + sd * 8)(x, y) && y < 78, 'russ', { rund: 6, rau: 1, korn: 2, muster: (x, y) => (hash(Math.floor(x / 5), Math.floor(y / 5)) - .5) * .5 }); for (let i = 0; i < 16; i++) { const x = 15 + hash(i, sd) * 120, y = 74 - hash(i, sd + 1) * 28; m.form(M.ell(x, y, 5, 4), 'russ', { rund: 1.6, hell: .14 }); } return m; }
function zeichneIndustrielampe(f) { const m = new Blatt(66, 180), c = 22; m.form(M.box(c - 8, 168, 16, 10), 'betonGrau', { rund: 1 }); m.form(M.box(c - 3, 26, 6, 144), 'stahlAlt', { rund: 2, ...glatt, muster: flecken }); m.form(M.kap(c, 28, 50, 20, 2.4), 'stahlAlt', { rund: 1 }); m.form(M.poly([[38, 16], [62, 16], [56, 28], [44, 28]]), 'metall', { rund: 1.4 }); m.form(M.box(44, 28, 12, 5), f ? 'gelb' : 'russ', f ? { rund: 0, leuchtet: true, hell: -.1 } : { rund: 0 }); return m; }
function zeichneRohr(sd) { const m = new Blatt(120, 76); for (const x of [20, 96]) { m.form(M.box(x - 5, 42, 10, 30), 'stahlAlt', { rund: 1.4 }); m.form(M.box(x - 12, 68, 24, 6), 'betonGrau', { rund: 1 }); } m.form(M.kap(4, 34, 116, 34, 15), sd === 1 ? 'rostDkl' : 'metall', { rund: 7, muster: flecken }); for (const x of [38, 80]) { m.form(M.box(x - 4, 16, 8, 36), 'stahlAlt', { rund: 2, ...glatt }); } if (sd === 2) { m.form(M.ell(60, 26, 8, 4), 'russ', { rund: 1 }); m.form(M.kap(60, 28, 60, 42, 2), 'glasDkl', { rund: 1 }); } return m; }
function zeichneSchaltschrank(f) { const m = new Blatt(88, 136); m.form(M.box(10, 12, 68, 118), 'stahlAlt', { rund: 2.4, muster: flecken }); m.linie([[44, 14], [44, 128]], 'russ', {}); for (const y of [34, 66, 98]) for (const x of [24, 60]) { const an = (x + y + f * 3) % 2 === 0 || f; m.form(M.ell(x, y, 3, 3), an ? 'lazi' : 'russ', { rund: 1, leuchtet: !!an, hell: -.14 }); } m.form(M.box(26, 112, 36, 10), 'gelb', { rund: .6, hell: -.3, muster: (x) => Math.round(x / 6) % 2 ? -.5 : 0 }); return m; }
function zeichneSaeule() { const m = new Blatt(56, 196); m.form(M.box(8, 178, 40, 16), 'betonGrau', { rund: 1.6 }); m.form(M.box(14, 12, 28, 170), 'betonGrau', { rund: 4, muster: betonM }); m.form(M.box(8, 6, 40, 10), 'betonGrau', { rund: 1.4, hell: .08 }); m.linie([[20, 40], [30, 70], [24, 110]], 'russ', {}); return m; }
function zeichneSchlot(sd) { const m = new Blatt(120, 360), c = 60; m.form(M.poly([[c - 40, 356], [c + 40, 356], [c + 22, 12], [c - 22, 12]]), 'ziegelRot', { rund: 5, muster: ziegelM, hell: -.08 }); for (const y of [60, 190]) m.form(M.poly([[c - 25, y], [c + 25, y], [c + 26, y + 8], [c - 26, y + 8]]), 'metall', { rund: 1 }); m.form(M.box(c - 26, 6, 52, 10), 'russ', { rund: 2, muster: flecken }); if (sd === 2) m.form(M.poly([[c - 12, 40], [c + 2, 22], [c + 6, 90], [c - 8, 110]]), 'russ', { rund: 2, hell: -.1 }); return m; }
function zeichneKessel(sd) { const m = new Blatt(130, 118); m.form(M.oder(M.box(8, 30, 114, 70), M.ell(65, 30, 57, 22), M.ell(65, 100, 57, 14)), 'kessel', { rund: 10, ...glatt, muster: (x, y) => (Math.round(y) % 22 < 1 ? -.3 : 0) + flecken(x, y) }); for (let x = 16; x < 118; x += 14) m.punkt(x, 52, 'stahlAlt', { hell: .5 }); m.form(M.box(48, 60, 34, 26), 'russ', { rund: 2 }); if (sd > 1) m.form(M.box(52, 66, 26, 20), 'glut', { rund: 1, leuchtet: true, hell: sd === 3 ? 0 : -.2 }); m.form(M.ell(95, 22, 9, 5), 'metall', { rund: 2 }); m.form(M.kap(95, 20, 95, 6, 3), 'stahlAlt', { rund: 1 }); return m; }
function zeichneKraftwerkTor(offen) { const m = new Blatt(186, 130); for (const x of [8, 160]) m.form(M.box(x, 8, 18, 120), 'betonGrau', { rund: 2.4, muster: betonM }); m.form(M.box(8, 6, 170, 16), 'betonGrau', { rund: 2, hell: .06 }); m.form(M.box(26, 22, 134, 106), 'russ', { rund: 1 }); if (offen) m.form(M.box(26, 22, 134, 18), 'stahlAlt', { rund: 1, muster: (x, y) => Math.round(y) % 6 < 1 ? -.3 : 0 }); else m.form(M.box(26, 22, 134, 106), 'stahlAlt', { rund: 1, muster: (x, y) => (Math.round(y) % 14 < 1 ? -.3 : 0) + flecken(x, y) }); m.form(M.box(26, 22, 134, 6), 'gelb', { rund: 0, hell: -.26, muster: (x) => Math.round(x / 8) % 2 ? -.5 : 0 }); return m; }
function zeichneZiegelwand(sd) { const m = new Blatt(94, 130), o = x => 14 + (sd === 3 ? hash(Math.floor(x / 14), 3) * 40 : sd * 2); m.form((x, y) => x > 2 && x < 92 && y > o(x) && y < 128, 'ziegelRot', { rund: 2, muster: ziegelM, hell: -.12 + sd * .02 }); if (sd === 2) m.form(M.ell(44, 72, 16, 22), 'betonGrau', { rund: 2, muster: flecken }); return m; }
function zeichneReklame(f) { const m = new Blatt(118, 136); for (const x of [18, 94]) m.form(M.box(x, 60, 6, 72), 'metall', { rund: 1.4, muster: flecken }); m.form(M.box(6, 8, 106, 60), 'stahlAlt', { rund: 2 }); m.form(M.box(12, 14, 94, 48), f ? 'stoffRot' : 'russ', { rund: 1, muster: flecken }); for (let i = 0; i < 4; i++) m.form(M.box(20 + i * 22, 24, 14, 28), i === 2 && !f ? 'russ' : 'gelb', { rund: .6, leuchtet: i !== 2 || !!f, hell: -.22 }); return m; }
function zeichneTafel(leuchtend, f, schwarz) { const m = new Blatt(88, 100), c = 44; for (const x of [18, 66]) m.form(M.box(x, 60, 5, 38), 'metall', { rund: 1 }); m.form(M.box(6, 6, 76, 60), 'stahlAlt', { rund: 2 }); m.form(M.box(12, 12, 64, 48), leuchtend ? 'lazi' : schwarz ? 'russ' : 'stoffHell', { rund: .8, leuchtet: !!leuchtend, hell: leuchtend ? (f ? -.14 : -.28) : 0, muster: (x, y) => Math.round(y) % 4 < 1 ? -.18 : 0 }); if (!leuchtend) for (const y of [20, 30, 40, 50]) m.linie([[18, y], [64 - y % 7, y]], schwarz ? 'putz' : 'russ', { hell: -.1 }); return m; }
function zeichneStadthaus(sd) {
  const B = 150, H = 270, m = new Blatt(B, H), wand = ['betonGrau', 'stein', 'ziegelRot', 'putz'][sd % 4], mu = wand === 'ziegelRot' ? ziegelM : betonM;
  m.form(M.box(10, 22, B - 20, H - 26), wand, { rund: 3, muster: mu, hell: wand === 'putz' ? -.2 : -.06 }); m.form(M.box(6, 16, B - 12, 8), 'metall', { rund: 1, hell: -.1 });
  for (const g of [0, 1]) for (const x of [24, 86]) { const y = 34 + g * 110, kaputt = hash(x + g, sd) > .6; m.form(M.box(x, y, 38, 64), kaputt ? 'russ' : 'glasDkl', { rund: 1, hell: kaputt ? 0 : -.1 }); m.form(M.box(x + 18, y, 2, 64), 'metall', { rund: 0 }); if (sd % 3 === 0 && kaputt) m.form(M.box(x, y + 18, 38, 8), 'holz', { rund: 1, muster: maserung }); }
  m.form(M.box(55, H - 116, 40, 112), sd % 2 ? 'stahlAlt' : 'russ', { rund: 1, muster: flecken });
  return m;
}
function zeichneHausWaage(f) { const m = zeichneStadthaus(4), c = 75; m.form(M.box(c - 26, 8, 52, 30), 'kapuze', { rund: 1.4, muster: falten }); m.form(M.kap(c - 18, 20 + f * 2, c + 18, 20 - f * 2, 1.4), 'gold', { rund: .6, hell: -.1 }); return m; }
function zeichneHehlerstand() { const m = new Blatt(150, 130); for (const x of [10, 130]) m.form(M.box(x, 32, 5, 94), 'metall', { rund: 1 }); m.form(M.poly([[2, 40], [148, 40], [136, 12], [14, 12]]), 'lumpen', { rund: 2, muster: falten }); m.form(M.box(6, 84, 138, 42), 'rostDkl', { rund: 2, muster: flecken }); for (let i = 0; i < 7; i++) m.form(M.box(14 + i * 18, 72 + (i % 2) * 3, 13, 12), ['metall', 'gurt', 'stahlAlt', 'rost'][i % 4], { rund: 1.4 }); return m; }
function zeichneGrosseWaage(n) { const m = new Blatt(210, 170), c = 105, q = n * 18; m.form(M.box(c - 30, 150, 60, 16), 'betonGrau', { rund: 2 }); m.form(M.box(c - 7, 30, 14, 122), 'gold', { rund: 3, hell: -.24 }); m.form(M.kap(c - 80, 30 - q, c + 80, 30 + q, 5), 'gold', { rund: 2, hell: -.16 }); m.form(M.ell(c, 28, 11, 11), 'gold', { rund: 3, hell: -.1 }); for (const [x, y] of [[c - 80, 30 - q], [c + 80, 30 + q]]) { m.linie([[x, y], [x - 24, y + 62], [x + 24, y + 62], [x, y]], 'gold', { hell: -.2 }); m.form(M.ell(x, y + 64, 27, 7), 'gold', { rund: 2, hell: -.22 }); } return m; }
function zeichneKern(f) { const m = new Blatt(186, 204), c = 93; m.form(M.oder(M.ell(c, 188, 80, 14), M.box(c - 72, 150, 144, 40)), 'stahlAlt', { rund: 6, ...glatt, muster: flecken }); for (const v of [-1, 1]) { m.form(M.kap(c + v * 66, 158, c + v * 44, 50, 6), 'metall', { rund: 3, ...glatt }); } m.form(M.ell(c, 90, 50, 56), 'russ', { rund: 3 }); m.form(M.ell(c, 90, 36 + f * 3, 42 + f * 3), 'lazi', { rund: 14, leuchtet: true, hell: f ? -.02 : -.14, muster: (x, y) => fbm(x / 10, y / 10 + f) * .3 - .14 }); for (const y of [50, 90, 130]) m.form(M.kap(c - 54, y, c + 54, y, 2), 'stahlAlt', { rund: 1 }); return m; }
function zeichneErsterZaehler(f, offen) { const m = new Blatt(128, 160), c = 64; m.form(M.box(c - 44, 140, 88, 16), 'betonGrau', { rund: 2 }); panzer(m, M.poly([[c - 38, 142], [c + 38, 142], [c + 28, 18], [c - 28, 18]]), 'stahlAlt'); m.form(M.box(c - 20, 36, 40, 52), offen ? 'russ' : 'lazi', { rund: 1, leuchtet: !offen, hell: f ? -.18 : -.3, muster: (x, y) => Math.round(y) % 4 < 1 ? -.24 : 0 }); if (offen) m.form(M.ell(c, 62, 11, 13), 'gelb', { rund: 4, leuchtet: true, hell: f ? 0 : -.2 }); for (const y of [100, 114, 128]) m.linie([[c - 30, y], [c + 30, y]], 'metall', { hell: .3 }); m.form(M.ell(c, 16, 26, 9), 'metall', { rund: 3, ...glatt }); return m; }
function zeichneLadung(f) { const m = new Blatt(36, 30); m.form(M.ell(18, 15, 9 + f, 9 + f), 'lazi', { rund: 3, leuchtet: true, hell: f ? .1 : -.12 }); return m; }
function zeichneGrosseTafel(st) { const m = new Blatt(170, 148), c = 85; for (const x of [18, 146]) m.form(M.box(x, 96, 8, 50), 'metall', { rund: 1 }); m.form(M.box(6, 6, 158, 100), 'stahlAlt', { rund: 2.4 }); m.form(M.box(14, 14, 142, 84), st === 2 ? 'russ' : 'lazi', { rund: 1, leuchtet: st !== 2, hell: -.26, muster: (x, y) => Math.round(y) % 5 < 1 ? -.2 : 0 }); if (st !== 2) for (let i = 0; i < 6; i++) m.form(M.box(24, 22 + i * 12, 60 + hash(i, st) * 60, 3), 'lazi', { rund: 0, leuchtet: true, hell: .3, kante: false }); if (st > 0) m.linie([[34, 8], [70, 60], [50, 100]], 'russ', { hell: .1 }); return m; }
function zeichneRegal(sd) { const m = new Blatt(92, 124); for (const x of [6, 80]) m.form(M.box(x, 4, 6, 118), 'metall', { rund: 1, muster: flecken }); for (const y of [30, 66, 102]) { m.form(M.box(6, y, 80, 5), 'metall', { rund: .6 }); for (let i = 0; i < 6; i++) { if (hash(i, y + sd) > .7) continue; const h = 12 + hash(i, sd) * 12; m.form(M.box(12 + i * 11, y - h, 9, h), ['rotDkl', 'blauDkl', 'lederDkl', 'stoffGruen'][(i + sd) % 4], { rund: .8 }); } } return m; }
function zeichneSchule() { const m = new Blatt(420, 240); m.form(M.box(14, 40, 392, 196), 'betonGrau', { rund: 3, muster: betonM, hell: -.08 }); m.form(M.box(8, 32, 404, 10), 'metall', { rund: 1, hell: -.1 }); for (const g of [0, 1]) for (let i = 0; i < 6; i++) { if (g === 1 && (i === 2 || i === 3)) continue; const x = 30 + i * 62, y = 54 + g * 88; m.form(M.box(x, y, 44, 58), hash(i, g) > .5 ? 'russ' : 'glasDkl', { rund: 1, hell: -.06 }); m.form(M.box(x + 21, y, 2, 58), 'metall', { rund: 0 }); } m.form(M.box(172, 142, 76, 92), 'russ', { rund: 1 }); m.form(M.box(170, 44, 80, 22), 'stoffHell', { rund: 1, muster: flecken, hell: -.1 }); m.linie([[186, 54], [234, 54]], 'russ', {}); return m; }
function zeichneKellertuer(st) { const m = new Blatt(126, 84); m.form(M.box(6, 14, 114, 68), 'betonGrau', { rund: 3, muster: betonM }); m.form((x, y) => M.poly([[24, 76], [102, 76], [92, 22], [34, 22]])(x, y) && !(st && fbm(x / 12, y / 12) < .26 + st * .14), 'rostDkl', { rund: 2, muster: flecken }); m.linie([[63, 22], [63, 76]], 'russ', {}); return m; }
function zeichneBunkertor(st) { const m = new Blatt(136, 92); m.form(M.oder(M.box(6, 26, 124, 64), M.poly([[6, 28], [26, 6], [110, 6], [130, 28]])), 'betonGrau', { rund: 4, muster: betonM }); m.form((x, y) => M.box(26, 26, 84, 64)(x, y) && !(st && fbm(x / 12, y / 12) < .26 + st * .14), 'stahlAlt', { rund: 2, muster: flecken }); m.form(M.box(26, 26, 84, 6), 'gelb', { rund: 0, hell: -.26, muster: (x) => Math.round(x / 8) % 2 ? -.5 : 0 }); return m; }
function zeichneZaun() { const m = new Blatt(64, 60); for (const x of [6, 54]) m.form(M.box(x, 6, 4, 52), 'metall', { rund: 1 }); m.form((x, y) => x > 8 && x < 56 && y > 8 && y < 52 && (Math.round(x + y) % 7 === 0 || Math.round(x - y) % 7 === 0), 'metall', { rund: 0, kante: false, hell: .1 }); m.linie([[6, 8], [58, 8]], 'stahlAlt', {}); return m; }
function zeichneBus() { const m = new Blatt(296, 136); for (const x of [58, 234]) { m.form(M.ell(x, 112, 20, 20), 'russ', { rund: 5, hell: .06 }); m.form(M.ell(x, 112, 8, 8), 'metall', { rund: 2, hell: -.1 }); } m.form(M.oder(M.box(6, 22, 284, 88), M.ell(30, 26, 24, 12), M.ell(266, 26, 24, 12)), 'gelb', { rund: 7, hell: -.32, muster: (x, y) => flecken(x, y) * 1.4 }); for (let i = 0; i < 6; i++) { m.form(M.box(20 + i * 44, 34, 34, 32), i === 2 ? 'russ' : 'glasDkl', { rund: 1 }); } m.form(M.box(144, 66, 30, 40), 'russ', { rund: 1 }); m.form((x, y) => y > 22 && y < 110 && x > 6 && x < 290 && fbm(x / 13, y / 13) > .62, 'rostDkl', { rund: 1, rau: .5, korn: 2, kante: false }); return m; }
function zeichneRad() { const m = new Blatt(104, 62); m.form(M.box(6, 40, 92, 4), 'metall', { rund: 1 }); for (const x of [12, 92]) m.form(M.box(x, 42, 4, 18), 'metall', { rund: .6 }); for (const x of [30, 72]) { m.form((u, v) => { const r = Math.hypot(u - x, v - 36); return r < 18 && r > 15.6; }, 'russ', { rund: 0, kante: false }); m.linie([[x - 14, 26], [x + 14, 26]], 'rost', {}); } return m; }
function zeichneKorb() { const m = new Blatt(66, 142); m.form(M.box(10, 134, 46, 6), 'betonGrau', { rund: 1 }); m.form(M.box(30, 26, 6, 110), 'metall', { rund: 1, muster: flecken }); m.form(M.box(10, 8, 46, 26), 'stoffHell', { rund: 1, hell: -.1, muster: flecken }); m.form((x, y) => { const r = Math.hypot((x - 33) / 1.4, y - 40); return r < 11 && r > 8.4; }, 'rost', { rund: 0, kante: false }); return m; }
function zeichneOelfass() { const m = new Blatt(46, 58); m.form(M.box(6, 8, 34, 48), 'rot', { rund: 4, hell: -.22, muster: (x, y) => (Math.round(y) % 15 < 1 ? -.3 : 0) + flecken(x, y) }); m.form(M.ell(23, 8, 17, 4), 'metall', { rund: 1 }); m.form(M.poly([[16, 26], [30, 26], [23, 40]]), 'gelb', { rund: .6, hell: -.1 }); return m; }
function zeichneSprengfalle() { const m = new Blatt(48, 28); m.form(M.ell(24, 18, 20, 8), 'stahlAlt', { rund: 3, ...glatt }); m.form(M.ell(24, 14, 9, 5), 'russ', { rund: 1 }); m.form(M.ell(24, 13, 3, 3), 'rot', { rund: 1, leuchtet: true }); return m; }
function zeichneSchaukel() { const m = new Blatt(150, 150); for (const [a, b, c, d] of [[14, 146, 40, 16], [66, 146, 40, 16], [84, 146, 110, 16], [136, 146, 110, 16]]) m.form(M.kap(a, b, c, d, 3), 'metall', { rund: 1.4, muster: flecken }); m.form(M.kap(38, 14, 112, 14, 3), 'metall', { rund: 1.4, muster: flecken }); for (const x of [58, 92]) m.linie([[x, 16], [x, 104]], 'gurt', {}); m.form(M.box(52, 104, 46, 6), 'holz', { rund: 1, muster: maserung }); return m; }
function zeichneWippe() { const m = new Blatt(170, 70); m.form(M.poly([[72, 66], [98, 66], [85, 36]]), 'metall', { rund: 1.6, muster: flecken }); m.form(M.kap(10, 58, 160, 26, 4), 'holz', { rund: 2, muster: maserung }); for (const [x, y] of [[26, 44], [144, 18]]) m.form(M.box(x - 7, y, 14, 4), 'metall', { rund: 1 }); return m; }
function zeichneBuehne() { const m = new Blatt(310, 136); m.form(M.box(10, 74, 290, 58), 'holz', { rund: 2, muster: bohlenMuster }); m.form(M.box(4, 66, 302, 10), 'holz', { rund: 1.6, muster: maserung, hell: .08 }); for (const x of [30, 150, 276]) m.form(M.box(x, 76, 8, 54), 'holz', { rund: 1, hell: -.22 }); for (let i = 0; i < 3; i++) m.form(M.box(120 - i * 10, 118 - i * 0, 70 + i * 20, 5), 'holz', { rund: .6, hell: .04 }); for (const x of [8, 296]) m.form(M.box(x, 8, 6, 60), 'metall', { rund: 1 }); m.form(M.kap(10, 12, 300, 12, 2), 'metall', { rund: 1 }); m.form(M.poly([[30, 14], [282, 14], [272, 34], [40, 34]]), 'stoffRot', { rund: 2, muster: falten, hell: -.14 }); return m; }
function zeichneFoerderband(f) { const m = new Blatt(180, 66); for (const x of [18, 150]) m.form(M.box(x, 34, 10, 30), 'stahlAlt', { rund: 1 }); m.form(M.box(6, 14, 168, 22), 'gurt', { rund: 2, muster: (x) => (Math.round(x + f * 6) % 12 < 2 ? .22 : -.1) }); for (let x = 14; x < 170; x += 18) m.form(M.ell(x, 25, 5, 5), 'metall', { rund: 1.6 }); return m; }
function zeichneLesepult(f) { const m = new Blatt(66, 118); m.form(M.box(26, 44, 14, 68), 'holz', { rund: 2, muster: maserung }); m.form(M.box(12, 110, 42, 6), 'holz', { rund: 1 }); m.form(M.poly([[6, 40], [60, 40], [54, 18], [12, 18]]), 'holz', { rund: 2, muster: maserung }); m.form(M.poly([[14, 36], [52, 36], [48, 22], [18, 22]]), f ? 'lazi' : 'putz', { rund: .6, leuchtet: !!f, hell: f ? -.2 : -.1 }); return m; }
function zeichneBunkerklotz() { const m = new Blatt(150, 100); m.form(M.oder(M.box(10, 30, 130, 66), M.poly([[10, 32], [36, 8], [114, 8], [140, 32]])), 'betonGrau', { rund: 4, muster: betonM }); for (const x of [24, 102]) m.form(M.box(x, 44, 24, 8), 'russ', { rund: .6 }); m.form(M.box(10, 84, 130, 6), 'gelb', { rund: 0, hell: -.3, muster: (x) => Math.round(x / 8) % 2 ? -.5 : 0 }); return m; }
function zeichneKisten(sd) { const m = new Blatt(96, 88), b = (x, y, w, h, q) => { m.form(M.box(x, y, w, h), 'holz', { rund: 1.6, hell: q, muster: (a, c) => (Math.round(a) % 9 === 0 ? -.3 : maserung(a, c)) }); m.linie([[x + 1, y + 1], [x + w - 1, y + h - 1]], 'holz', { hell: q - .28 }); }; b(4, 44, 42, 42, 0); b(48, 50, 42, 36, .06); if (sd === 1) b(24, 8, 38, 36, -.04); return m; }
function zeichneHund(f) { const m = new Blatt(88, 60), s = f ? 4 : -4; for (const [x, v, h] of [[26, s, -.14], [38, -s, 0], [60, s, -.14], [70, -s, 0]]) m.form(M.kap(x, 34, x + v, 54, 2.6), 'lumpen', { rund: 1.4, hell: h }); m.form(M.kap(24, 28, 66, 26, 9), 'lumpen', { rund: 5, rau: .4, korn: 2.5 }); m.form(M.kap(16, 24, 8, 12 - s * .4, 2), 'lumpen', { rund: 1 }); m.form(M.kap(68, 22, 76, 12, 6.4), 'lumpen', { rund: 3, rau: .4, korn: 2.5 }); m.form(M.kap(78, 13, 84, 15, 3), 'lumpen', { rund: 1.6, hell: -.1 }); m.punkt(85, 14, 'russ', {}); m.form(M.poly([[72, 8], [78, 8], [72, 1]]), 'lumpen', { rund: 1, hell: -.1 }); m.punkt(78, 11, 'russ', { hell: -.4 }); return m; }
// ---------- Beute am Boden und Geschosse ----------
function zeichneMuenze() { const m = new Blatt(26, 26); m.form(M.ell(13, 13, 10.5, 10.5), 'gold', { rund: 3, ...glatt, hell: -.04 }); m.form((x, y) => { const d = Math.hypot(x - 13, y - 13); return d < 7.4 && d > 5.8; }, 'gold', { rund: 0, hell: -.34, kante: false }); m.linie([[9, 8], [13, 6]], 'gold', { hell: .4 }); return m; }
function zeichneTeil() {
  const m = new Blatt(30, 26), cx = 16, cy = 19;
  for (let i = 0; i < 5; i++) { const w = Math.PI * (.98 + i * .26); m.form(M.poly([[cx + Math.cos(w - .17) * 11, cy + Math.sin(w - .17) * 11], [cx + Math.cos(w - .11) * 15.5, cy + Math.sin(w - .11) * 15.5], [cx + Math.cos(w + .11) * 15.5, cy + Math.sin(w + .11) * 15.5], [cx + Math.cos(w + .17) * 11, cy + Math.sin(w + .17) * 11]]), 'metall', { rund: .6, ...glatt }); }
  m.form((x, y) => { const d = Math.hypot(x - cx, y - cy); return d < 12 && d > 4.6 && y < cy + 3; }, 'stahlAlt', { rund: 1.4, ...glatt });
  m.form(M.ell(cx, cy, 3.6, 3.6), 'metall', { rund: 1.2, ...glatt, hell: .14 }); m.form(M.ell(cx, cy, 1.5, 1.5), 'lazi', { rund: .5, leuchtet: true });
  return m;
}
function zeichneBrot() { const m = new Blatt(38, 26); m.form(M.oder(M.ell(19, 15, 16, 9.6)), 'stroh', { rund: 6, hell: -.12, rau: .3, korn: 3 }); for (const x of [11, 18, 25]) m.linie([[x, 8], [x + 3, 15]], 'holz', { hell: .1 }); return m; }
function zeichneHolzbeute() { const m = new Blatt(48, 30); for (const [y, x] of [[20, 6], [11, 10], [20, 18]]) { m.form(M.kap(x, y, x + 24, y - 3, 4.6), 'holz', { rund: 2.4, muster: maserung }); m.form(M.ell(x + 24, y - 3, 4.6, 4.6), 'stroh', { rund: 2, hell: -.2, muster: (u, v) => Math.sin(Math.hypot(u - x - 24, v - y + 3) * 2.2) * .18 }); } m.form(M.kap(16, 9, 18, 26, 1.2), 'gurt', { rund: .6 }); return m; }
function zeichneFleischBeute() { const m = new Blatt(42, 30); m.form(M.poly([[6, 15], [11, 6], [22, 5], [30, 12], [29, 21], [19, 26], [9, 24]]), 'rotDkl', { rund: 4, hell: -.08, muster: (x, y) => Math.sin(x * 1.1 + y * .5) * .16 }); m.linie([[10, 16], [18, 9], [26, 12]], 'stoffOcker', { hell: -.2 }); m.linie([[7, 15], [12, 7], [22, 6], [29, 12]], 'putz', { hell: -.1 }); m.form(M.kap(28, 17, 36, 20, 1.8), 'putz', { rund: .8, hell: -.14 }); return m; }
function zeichneSchrott(a) { const m = new Blatt(40, 30); if (a === 'schuh') { m.form(M.oder(M.box(6, 8, 13, 15), M.poly([[17, 14], [34, 18], [34, 25], [6, 25]])), 'lederDkl', { rund: 3, rau: .3, korn: 2, hell: .08 }); m.form(M.box(5, 24, 30, 3), 'russ', { rund: 1 }); } else if (a === 'lumpen') { m.form(M.ohne(M.poly([[3, 24], [6, 9], [20, 5], [35, 9], [37, 26], [30, 22], [26, 27], [20, 22], [14, 27], [9, 23]]), M.poly([[20, 11], [25, 13], [22, 19], [18, 16]])), 'stoffOcker', { rund: 1.2, muster: falten, hell: -.14 }); m.linie([[6, 9], [20, 5], [35, 9]], 'stoffOcker', { hell: .22 }); for (const x of [13, 29]) m.linie([[x, 8], [x + 1, 21]], 'stoffOcker', { hell: -.42 }); } else if (a === 'dose') { m.form(M.oder(M.box(12, 6, 16, 20), M.ell(20, 6, 8, 2.8), M.ell(20, 26, 8, 2.8)), 'stahlAlt', { rund: 3, muster: flecken }); m.form(M.box(12, 11, 16, 9), 'rotDkl', { rund: 0, kante: false, hell: -.04 }); } else { m.form(M.oder(M.poly([[9, 19], [23, 12], [27, 9], [29, 13], [27, 12], [25, 16], [11, 24]]), M.ell(7, 18, 3.4, 2.6), M.ell(9, 25, 2.8, 2.4)), 'putz', { rund: .8, hell: -.16 }); } return m; }
function zeichneBolzenGeschoss() { const m = new Blatt(18, 18); m.form(M.ell(9, 9, 5.4, 5.4), 'stahlAlt', { rund: 2, ...glatt, hell: .14 }); m.form(M.ell(7.4, 7.4, 1.6, 1.6), 'stahl', { rund: .6, hell: .4, kante: false }); return m; }
function zeichneBolzenFlug() { const m = new Blatt(26, 10); m.form(M.kap(5, 5, 19, 5, 1.3), 'holz', { rund: .6, hell: .08 }); m.form(M.poly([[18, 1.8], [25, 5], [18, 8.2]]), 'stahlAlt', { rund: .5, ...glatt, hell: .24 }); m.form(M.poly([[1, 1.8], [7, 4], [7, 6], [1, 8.2]]), 'gurt', { rund: .4 }); return m; }
function zeichnePfeilGeschoss() { const m = new Blatt(38, 12); m.form(M.kap(3, 6, 28, 6, 1), 'holz', { rund: .6, hell: .1 }); m.form(M.poly([[26, 2.6], [36, 6], [26, 9.4]]), 'stahlAlt', { rund: .6, ...glatt, hell: .2 }); for (const v of [-1, 1]) m.linie([[3, 6], [8, 6 + v * 3.6]], 'putz', {}); return m; }
function zeichneWurfdolchBild() { const m = new Blatt(38, 14); m.form(M.poly([[12, 3.6], [36, 7], [12, 10.4]]), 'stahlAlt', { rund: .8, ...glatt, hell: .2 }); m.linie([[13, 7], [33, 7]], 'stahlAlt', { hell: .55 }); m.form(M.box(9, 2, 3, 10), 'metall', { rund: .6 }); m.form(M.kap(2, 7, 9, 7, 1.8), 'rindsleder', { rund: 1 }); return m; }
function zeichneGeisterklinge() { const m = new Blatt(60, 24); m.form(M.poly([[12, 7], [58, 12], [12, 17]]), 'lazi', { rund: 1.4, leuchtet: true, hell: -.1 }); m.linie([[14, 12], [54, 12]], 'putz', { leuchtet: true, hell: .2 }); m.form(M.box(8, 4, 4, 16), 'stahlAlt', { rund: .8 }); m.form(M.kap(1, 12, 8, 12, 2.2), 'gurt', { rund: 1 }); return m; }
function zeichneAusruf() { const m = new Blatt(18, 40); m.form(M.poly([[4, 3], [14, 3], [11.4, 26], [6.6, 26]]), 'rot', { rund: 2, leuchtet: true, hell: .1 }); m.form(M.ell(9, 33, 4.6, 4.6), 'rot', { rund: 2, leuchtet: true, hell: .1 }); return m; }
// ---------- Symbole für Waffen, Rüstungen und Module: schräg gelegt, gleich groß ----------
function zeichneWaffenSymbol(a) {
  const m = new Blatt(56, 56), k = (x0, y0, x1, y1, r, f, o = {}) => m.form(M.kap(x0, y0, x1, y1, r), f, { rund: Math.max(.6, r * .6), ...o });
  const klingeS = (x0, y0, x1, y1, b, spitze = 8) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy * b, ny = ux * b, sx = x1 - ux * spitze, sy = y1 - uy * spitze; m.form(M.poly([[x0 + nx, y0 + ny], [sx + nx, sy + ny], [x1, y1], [sx - nx, sy - ny], [x0 - nx, y0 - ny]]), 'stahlAlt', { rund: .8, ...glatt, hell: .18 }); m.linie([[x0 + ux * 2, y0 + uy * 2], [sx, sy]], 'stahlAlt', { hell: .55 }); };
  const parier = (x, y, l) => k(x - l, y - l, x + l, y + l, 3, 'metall', glatt);
  if (a === 'schwert') { klingeS(22, 34, 44, 12, 6.5, 9); parier(21, 35, 11); k(19, 37, 10, 46, 3, 'rindsleder'); m.form(M.ell(8, 48, 3.8, 3.8), 'gold', { rund: 1.2, hell: -.1 }); }
  else if (a === 'langschwert') { klingeS(25, 31, 52, 4, 5, 8); parier(23, 33, 9); k(21, 35, 8, 48, 3, 'rindsleder'); m.form(M.ell(6, 50, 3.6, 3.6), 'gold', { rund: 1.2, hell: -.1 }); }
  else if (a === 'dolch') { klingeS(25, 31, 46, 10, 5, 13); parier(23, 33, 7); k(21, 35, 11, 45, 3.2, 'rindsleder'); }
  else if (a === 'dolche') { for (const v of [0, 1]) { const f = x => v ? 56 - x : x; klingeS(f(24), 32, f(49), 7, 4.4, 11); k(f(15), 25, f(30), 39, 2.6, 'metall', glatt); k(f(22), 34, f(11), 45, 2.8, v ? 'rindsleder' : 'gurt'); } }
  else if (a === 'axt') { k(36, 8, 14, 52, 3, 'holz', { muster: maserung }); m.form(M.poly([[36, 6], [46, 2], [54, 12], [50, 28], [42, 24], [35, 15]]), 'stahlAlt', { rund: 2, ...glatt, hell: .12 }); m.form(M.poly([[32, 13], [24, 6], [16, 8], [14, 22], [24, 22], [30, 19]]), 'stahlAlt', { rund: 2, ...glatt, hell: 0 }); m.form(M.ell(33, 13, 4, 4), 'metall', { rund: 1, ...glatt }); }
  else if (a === 'beil') { k(30, 18, 12, 52, 3.2, 'holz', { muster: maserung }); m.form(M.poly([[28, 12], [40, 6], [50, 14], [48, 30], [36, 26], [28, 20]]), 'stahlAlt', { rund: 2.4, ...glatt, hell: .12 }); m.linie([[41, 7], [49, 14], [47, 29]], 'stahlAlt', { hell: .5 }); }
  else if (a === 'stab') { k(40, 16, 10, 52, 2.8, 'holz', { muster: maserung }); k(41, 21, 33, 13, 2, 'metall', glatt); k(35, 23, 45, 11, 2, 'metall', glatt); m.form(M.poly([[45, 3], [52, 11], [45, 21], [38, 11]]), 'lazi', { rund: 1.2, leuchtet: true }); }
  else { k(33, 20, 12, 52, 3.4, 'holz', { muster: maserung }); m.form(M.poly([[18, 12], [36, 2], [52, 20], [36, 32]]), 'stahlAlt', { rund: 2.4, ...glatt, hell: .08 }); m.form(M.poly([[29, 10], [32, 8], [44, 24], [41, 26]]), 'gurt', { rund: .6, hell: -.1 }); }
  return m;
}
function zeichneRuestungSymbol(a) {
  const m = new Blatt(56, 56), far = { lumpen: 'lumpen', leder: 'rindsleder', mantel: 'mantel', kette: 'stahlAlt', platte: 'stahlAlt', weste: 'lederDkl' }[a], c = 28;
  const fein = a === 'platte' ? { ...glatt } : a === 'kette' ? { muster: (x, y) => (Math.round(x + y) % 3 < 1 ? -.32 : .12) } : { muster: falten };
  m.form(M.poly([[c - 12, 8], [c - 5, 12], [c + 5, 12], [c + 12, 8], [c + 22, 16], [c + 15, 26], [c + 11, 22], [c + 11, a === 'mantel' ? 52 : 44], [c - 11, a === 'mantel' ? 52 : 44], [c - 11, 22], [c - 15, 26], [c - 22, 16]]), far, { rund: 4, ...fein });
  if (a === 'platte') { m.linie([[c - 10, 28], [c + 10, 28]], 'stahlAlt', { hell: .4 }); m.linie([[c, 14], [c, 44]], 'stahlAlt', { hell: -.3 }); }
  if (a === 'weste') { m.form(M.box(c - 2, 12, 4, 32), 'russ', { rund: 1 }); for (const y of [22, 32]) m.form(M.box(c - 9, y, 18, 3), 'gurt', { rund: .6 }); }
  if (a === 'leder') { m.form(M.box(c - 11, 34, 22, 4), 'lederDkl', { rund: 1 }); m.form(M.box(c - 3, 33, 6, 6), 'metall', { rund: 1 }); }
  if (a === 'lumpen') m.form(M.poly([[c - 6, 22], [c + 6, 20], [c + 7, 32], [c - 5, 33]]), 'stoffOcker', { rund: 1, hell: -.1 });
  return m;
}
function zeichneModulSymbol(a) {
  const m = new Blatt(56, 56), c = 28;
  if (a === 'spule') { m.form(M.box(c - 14, 12, 28, 32), 'rost', { rund: 3, muster: (x, y) => Math.round(y) % 3 < 1 ? -.3 : .08 }); for (const y of [9, 42]) m.form(M.box(c - 18, y, 36, 5), 'metall', { rund: 1, ...glatt }); }
  else if (a === 'zahnrad') { for (let i = 0; i < 12; i++) { const w = i / 12 * 6.283, s = .13, t = .08; m.form(M.poly([[c + Math.cos(w - s) * 17, c + Math.sin(w - s) * 17], [c + Math.cos(w - t) * 23, c + Math.sin(w - t) * 23], [c + Math.cos(w + t) * 23, c + Math.sin(w + t) * 23], [c + Math.cos(w + s) * 17, c + Math.sin(w + s) * 17]]), 'metall', { rund: .6, ...glatt }); } m.form((x, y) => { const d = Math.hypot(x - c, y - c); return d < 19 && d > 7; }, 'stahlAlt', { rund: 2.4, ...glatt }); }
  else if (a === 'linse') { m.form(M.ell(c, c, 20, 20), 'metall', { rund: 4, ...glatt }); m.form(M.ell(c, c, 14, 14), 'glas', { rund: 5, hell: -.1 }); m.linie([[c - 7, c - 7], [c - 1, c - 10]], 'putz', { hell: .3 }); }
  else if (a === 'chip') { for (let i = 0; i < 4; i++) for (const v of [-1, 1]) { m.form(M.box(c + v * 18 - 3, 16 + i * 8, 6, 3), 'gold', { rund: .4, hell: -.1 }); m.form(M.box(16 + i * 8, c + v * 18 - 3, 3, 6), 'gold', { rund: .4, hell: -.1 }); } m.form(M.box(c - 15, c - 15, 30, 30), 'russ', { rund: 2, hell: .1 }); m.form(M.box(c - 6, c - 6, 12, 12), 'lazi', { rund: 1, leuchtet: true, hell: -.14 }); }
  else { m.form(M.poly([[c, 6], [c + 18, c], [c, 50], [c - 18, c]]), 'lazi', { rund: 3, leuchtet: true, hell: -.06 }); m.linie([[c, 6], [c, 50]], 'putz', { leuchtet: true, hell: .2 }); m.linie([[c - 18, c], [c + 18, c]], 'lazi', { leuchtet: true, hell: .3 }); }
  return m;
}
function zeichneBude(f, zu) { const m = new Blatt(140, 118), a = 8, b = 132, far = ['stoffRot', 'stoffBlau', 'stoffGruen', 'stoffOcker', 'leinen'][f] || 'leinen'; for (const x of [a + 2, b - 6]) m.form(M.box(x, 26, 5, 90), 'holz', { rund: 1 }); m.form(M.box(a, 76, b - a, 40), 'holz', { rund: 1.6, muster: bohlenMuster }); m.form(M.box(a - 2, 72, b - a + 4, 5), 'holz', { rund: 1, hell: .08 }); m.form(M.poly([[a - 8, 34], [b + 8, 34], [b, 8], [a, 8]]), zu ? 'lumpen' : far, { rund: 2, muster: (x, y) => (Math.floor((x - a) / 17) % 2 ? -.2 : .06) + falten(x, y) * .4 }); if (zu) { for (const y of [42, 56]) m.form(M.kap(a + 4, y + 4, b - 4, y - 2, 4), 'holz', { rund: 2, muster: maserung }); } else { for (let i = 0; i < 6; i++) m.form(M.ell(a + 16 + i * 20, 66, 8, 6), ['rotDkl', 'stroh', 'blattH', 'rost', 'stoffGrau', 'rotDkl'][(i + f) % 6], { rund: 3 }); } return m; }
function zeichneBotKaputt(f) { const m = new Blatt(94, 60); m.form(M.poly([[8, 54], [14, 22], [52, 14], [78, 26], [80, 54]]), 'metall', { rund: 4, muster: flecken }); m.form(M.box(32, 26, 26, 5), 'russ', { rund: 1 }); m.form(M.box(38, 27.4, 14, 2.6), f ? 'rot' : 'russ', { rund: 0, leuchtet: !!f, kante: false }); m.form(M.kap(78, 50, 90, 56, 3), 'stahlAlt', { rund: 1 }); m.form(M.kap(14, 52, 4, 58, 3), 'stahlAlt', { rund: 1 }); if (f) m.linie([[60, 14], [64, 6], [68, 12]], 'gelb', { leuchtet: true }); return m; }
function zeichneThron() { const m = new Blatt(160, 210), c = 80; m.form(M.box(c - 60, 180, 120, 26), 'betonGrau', { rund: 3, muster: flecken }); m.form(M.poly([[c - 44, 180], [c - 44, 34], [c - 24, 12], [c + 24, 12], [c + 44, 34], [c + 44, 180]]), 'eisenDkl', { rund: 5, ...glatt, muster: nahten }); m.form(M.box(c - 30, 96, 60, 20), 'stahlAlt', { rund: 2, ...glatt }); m.form(M.box(c - 30, 116, 60, 64), 'russ', { rund: 1 }); for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) m.form(M.box(c - 26 + i * 11, 40 + j * 16, 8, 10), (i + j) % 2 ? 'lazi' : 'gurt', { rund: .8, leuchtet: (i + j) % 2 === 1, hell: -.2 }); for (const v of [-1, 1]) m.form(M.box(c + v * 50 - 8, 106, 16, 12), 'stahlAlt', { rund: 2 }); return m; }
function zeichneBolzenwerfer() { const m = new Blatt(120, 120), c = 60; for (const v of [-1, 1]) m.form(M.kap(c, 66, c + v * 34, 114, 5), 'holz', { rund: 2, muster: maserung }); m.form(M.box(c - 8, 52, 16, 24), 'metall', { rund: 2 }); m.form(M.kap(c - 34, 52, c + 40, 42, 4), 'holz', { rund: 2, muster: maserung }); m.form(M.oder(M.kap(c + 24, 18, c + 30, 44, 2.4), M.kap(c + 30, 44, c + 24, 70, 2.4)), 'metall', { rund: 1, ...glatt }); m.linie([[c + 24, 18], [c - 16, 48], [c + 24, 70]], 'leinen', {}); m.form(M.kap(c - 16, 48, c + 46, 42, 1.3), 'stahlAlt', { rund: .8, ...glatt }); return m; }
function zeichneMoerser() { const m = new Blatt(116, 104), c = 58; m.form(M.oder(M.ell(c, 96, 44, 8), M.box(c - 38, 74, 76, 22)), 'betonGrau', { rund: 3, muster: flecken }); m.form(M.poly([[c - 18, 78], [c + 8, 84], [c + 40, 24], [c + 18, 12]]), 'eisenDkl', { rund: 5, ...glatt, muster: nahten }); m.form(M.ell(c + 29, 18, 13, 7), 'russ', { rund: 2 }); for (const v of [-1, 1]) m.form(M.ell(c + v * 34, 80, 12, 12), 'metall', { rund: 3, ...glatt }); return m; }
function zeichnePfahlwall() { const m = new Blatt(150, 100); for (let i = 0; i < 7; i++) { const x = 14 + i * 20, h = 60 + hash(i, 7) * 24; m.form(M.oder(M.kap(x, 96, x + 6, 100 - h, 7), M.poly([[x, 100 - h], [x + 12, 100 - h], [x + 8, 88 - h]])), 'holz', { rund: 4, muster: maserung }); } m.form(M.box(4, 60, 142, 6), 'gurt', { rund: 1 }); m.form(M.poly([[40, 66], [84, 62], [86, 90], [42, 94]]), 'wellblech', { rund: 1, hell: -.14, muster: (x) => Math.round(x) % 6 < 2 ? -.2 : .04 }); return m; }
const SYMBOLE = { waffe: zeichneWaffenSymbol, ruestung: zeichneRuestungSymbol, modul: zeichneModulSymbol };
const MASCHINEN = {
  muenze: zeichneMuenze, teil: zeichneTeil, brot: zeichneBrot, holz: zeichneHolzbeute, fleisch: zeichneFleischBeute, bolzen: zeichneBolzenGeschoss, bolzenFlug: zeichneBolzenFlug, pfeil: zeichnePfeilGeschoss, wurfdolch: zeichneWurfdolchBild, klinge: zeichneGeisterklinge, ausruf: zeichneAusruf,
  bude: [0, 1, 2, 3, 4].map(q => () => zeichneBude(q)), budeZu: () => zeichneBude(4, true), botKaputt: [0, 1].map(q => () => zeichneBotKaputt(q)), schaltthron: zeichneThron, ersterZaehler: [0, 1].map(q => () => zeichneErsterZaehler(q, false)), ersterZaehlerOffen: [0, 1].map(q => () => zeichneErsterZaehler(q, true)),
  lore: zeichneLore, kohlehaufen: [1, 2, 3].map(q => () => zeichneKohlehaufen(q)), industrielampe: [0, 1].map(q => () => zeichneIndustrielampe(q)), rohr: [1, 2].map(q => () => zeichneRohr(q)), schaltschrank: [0, 1].map(q => () => zeichneSchaltschrank(q)), saeule: zeichneSaeule, schlot: [1, 2].map(q => () => zeichneSchlot(q)), kessel: [1, 2, 3].map(q => () => zeichneKessel(q)), kraftwerkTor: [0, 1].map(q => () => zeichneKraftwerkTor(q)), ziegelwand: [1, 2, 3].map(q => () => zeichneZiegelwand(q)), reklame: [0, 1].map(q => () => zeichneReklame(q)), laziTafel: [0, 1].map(q => () => zeichneTafel(true, q)), brettSchwarz: () => zeichneTafel(false, 0, true), brettWeiss: () => zeichneTafel(false, 0, false), stadthaus: [0, 1, 2, 3, 4, 5, 6, 7].map(q => () => zeichneStadthaus(q)), hausWaage: [0, 1].map(q => () => zeichneHausWaage(q)), hehlerstand: zeichneHehlerstand, grosseWaage: [-1, 0, 1].map(q => () => zeichneGrosseWaage(q)), kern: [0, 1].map(q => () => zeichneKern(q)), ladung: [0, 1].map(q => () => zeichneLadung(q)), grosseTafel: [0, 1, 2].map(q => () => zeichneGrosseTafel(q)), regal: [1, 2, 3].map(q => () => zeichneRegal(q)), schule: zeichneSchule, tuer: [0, 1, 2].map(q => () => zeichneKellertuer(q)), bunkertor: [0, 1, 2].map(q => () => zeichneBunkertor(q)), zaun: zeichneZaun, bus: zeichneBus, rad: zeichneRad, korb: zeichneKorb, oelfass: zeichneOelfass, sprengfalle: zeichneSprengfalle, schaukel: zeichneSchaukel, wippe: zeichneWippe, buehne: zeichneBuehne, foerderband: [0, 1].map(q => () => zeichneFoerderband(q)), lesepult: [0, 1].map(q => () => zeichneLesepult(q)), bunkerklotz: zeichneBunkerklotz, kisten: [1, 2].map(q => () => zeichneKisten(q)), hund: [0, 1].map(q => () => zeichneHund(q)),
  busch: [1, 2, 3, 4, 5, 6].map(q => () => zeichneBusch(q)), truhe: () => zeichneTruhe(false), truheOffen: () => zeichneTruhe(true), wagen: [() => zeichneWagen(0), () => zeichneWagen(1)], konvoi: [() => zeichneWagen(0, true), () => zeichneWagen(1, true)],
  autowrack: [0, 1, 2, 3].map(q => () => zeichneAutowrack(q)), schutt: [1, 2, 3].map(q => () => zeichneSchutt(q)), ruine: [1, 2, 3, 4].map(q => () => zeichneRuine(q)), hochhaus: [3, 7, 11, 19].map(q => () => zeichneHochhaus(q)), tonne: zeichneTonne, barrikade: zeichneBarrikade,
  turm: () => zeichneLaziTurm('lazi', 0), feuerballiste: [() => zeichneFeuerballiste(0), () => zeichneFeuerballiste(1)], puppe: zeichnePuppe,
  kf: [() => zeichneKaefer(0), () => zeichneKaefer(1)], fk: [() => zeichneKaefer(0, true), () => zeichneKaefer(1, true)], gl: [() => zeichneGolem(0), () => zeichneGolem(1)],
  wartungsbot: [() => zeichneWartungsbot(0), () => zeichneWartungsbot(1), () => zeichneWartungsbot(0)], drohne: [() => zeichneDrohne(0), () => zeichneDrohne(1)], wachbot: [0, 1, 2].map(q => () => zeichneWachbot(q)),
  zelt: [() => zeichneZelt(0)], zeltKaputt: [() => zeichneZelt(1), () => zeichneZelt(2)], ausguck: [zeichneAusguck], schutzturm: [() => zeichneSchutzturm(0), () => zeichneSchutzturm(1)],
  schaltkasten: [() => zeichneSchaltkasten(0)], kabelknoten: [() => zeichneKabelknoten(false, 0)], kabelknotenAn: [() => zeichneKabelknoten(true, 0), () => zeichneKabelknoten(true, 1)],
  zaehlsaeule: [() => zeichneZaehlsaeule(0), () => zeichneZaehlsaeule(1)], zaehlsaeuleRot: [() => zeichneZaehlsaeule(0, true), () => zeichneZaehlsaeule(1, true)],
  kesselwaerter: [() => zeichneKesselwaerter('ruhe', 0), () => zeichneKesselwaerter('lauf', 0), () => zeichneKesselwaerter('lauf', 1)], kesselRuhe: [() => zeichneKesselwaerter('ruhe', 0), () => zeichneKesselwaerter('ruhe', 1)], kesselHeissBilder: [() => zeichneKesselwaerter('heiss', 0), () => zeichneKesselwaerter('heiss', 1)],
  vorarbeiter: [() => zeichneVorarbeiter(0), () => zeichneVorarbeiter(1)], vorarbeiterOffen: [() => zeichneVorarbeiter(0, true), () => zeichneVorarbeiter(1, true)],
  waagmeister: [() => zeichneWaagmeister(0), () => zeichneWaagmeister(1)], waagmeisterWankt: [() => zeichneWaagmeister(0, true), () => zeichneWaagmeister(1, true)], kernwaagmeister: [() => zeichneWaagmeister(0, false, true), () => zeichneWaagmeister(1, false, true)],
  herdenlaeufer: [() => zeichneHerdenlaeufer(0), () => zeichneHerdenlaeufer(1)], schaltwaechter: [() => zeichneSchaltwaechter(0), () => zeichneSchaltwaechter(1)], nummerNull: [() => zeichneNummerNull(0), () => zeichneNummerNull(1)],
  // Einzelne Bilder statt Listen
  schaltkastenKaputt: () => zeichneSchaltkasten(2), kesselHoch: () => zeichneKesselwaerter('hoch', 0),
};
// ---------- Mauer und Tore: Stücke von 1,9 Einheiten Breite greifen nahtlos ineinander ----------
function zeichnePalisade(v) {
  const m = new Blatt(106, 136);
  for (let i = 0; i < 5; i++) { const x = 11 + i * 21, h = 104 + hash(i, v + 2) * 22, k = (hash(i, v) - .5) * 3; m.form(M.oder(M.kap(x + k, 132, x, 136 - h + 12, 9.6), M.poly([[x - 9, 136 - h + 13], [x + 9, 136 - h + 13], [x + k * .5, 136 - h]])), 'holz', { rund: 5, muster: (a, c) => maserung(a, c) + (fbm(a / 7, c / 14) > .64 ? -.14 : 0), hell: -.04 }); }
  for (const y of [54, 104]) m.form(M.box(0, y, 106, 6), 'gurt', { rund: 1.4, hell: .02 });
  if (v === 1) m.form(M.poly([[24, 70], [62, 66], [64, 94], [26, 98]]), 'wellblech', { rund: 1, hell: -.14, muster: (a) => Math.round(a) % 6 < 2 ? -.2 : .04 });
  if (v === 2) m.form(M.ell(52, 84, 12, 12), 'stahlAlt', { rund: 3, ...glatt, hell: -.1 });
  if (v === 3) m.form(M.box(42, 72, 30, 18), 'rotDkl', { rund: 1, muster: (a, c) => fbm(a / 4, c / 4) > .56 ? -.3 : 0 });
  return m;
}
function zeichneStachel(v) {
  const m = new Blatt(90, 76), q = v * 3;
  for (const [a, c, d, e] of [[8, 70, 44 + q, 12], [82, 70, 44 - q, 12], [10, 28, 80, 62], [80, 28, 10, 62]]) { m.form(M.kap(a, c, d, e, 3.4), 'holz', { rund: 2, muster: maserung, hell: -.06 }); }
  for (const [x, y] of [[44 + q, 8], [10, 24], [80, 24]]) m.form(M.poly([[x - 3, y + 8], [x + 3, y + 8], [x, y - 4]]), 'stahlAlt', { rund: .6, ...glatt });
  m.form(M.kap(14, 44, 76, 44, 2.2), 'metall', { rund: 1 }); for (let i = 1; i < 6; i++) m.linie([[6 + i * 13, 40], [10 + i * 13, 50]], 'stahlAlt', { hell: .2 });
  return m;
}
function zeichneTor(art, schaden) {
  const m = new Blatt(222, 176), hart = art === 'palisade', b = 6;
  for (const x of [6, 192]) m.form(M.box(x, 24, 24, 150), hart ? 'holz' : 'metall', { rund: 4, muster: hart ? maserung : undefined, hell: -.1 });
  m.form(M.box(30, 18, 162, 18), hart ? 'holz' : 'stahlAlt', { rund: 3, muster: hart ? maserung : undefined });
  // Torflügel, mit jeder Schadensstufe fehlt mehr
  const fehlt = schaden === 1 ? [2, 5] : schaden === 2 ? [1, 2, 4, 5, 7] : [], loch = (x, y) => { const i = Math.floor((x - 30) / 20); return fehlt.includes(i) && y > 50 + hash(i, 3) * 40; };
  m.form((x, y) => M.box(30, 36, 162, 138)(x, y) && !loch(x, y), hart ? 'holz' : 'rostDkl', { rund: 2, hell: hart ? -.02 : 0, muster: (x, y) => (Math.round(x) % 20 < 2 ? -.3 : maserung(x, y)) });
  m.form((x, y) => M.box(30, 72, 162, 7)(x, y) && !loch(x, y), 'stahlAlt', { rund: 1 }); m.form((x, y) => M.box(30, 136, 162, 7)(x, y) && !loch(x, y), 'stahlAlt', { rund: 1 });
  if (!schaden) { m.form(M.poly([[112, 86], [176, 82], [178, 128], [114, 132]]), 'wellblech', { rund: 1, hell: -.14, muster: (x) => Math.round(x) % 7 < 2 ? -.2 : .04 }); m.form(M.box(108, 92, 8, 20), 'metall', { rund: 1, hell: .1 }); }
  if (schaden === 2) for (const [x, y] of [[60, 170], [150, 172], [110, 168]]) m.form(M.ell(x, y, 16, 5), 'holz', { rund: 2, hell: -.3 });
  return m;
}
const WEHR = { palisade: [0, 1, 2, 3].map(v => () => zeichnePalisade(v)), stachelreiter: [0, 1, 2].map(v => () => zeichneStachel(v)), tor: { barrikade: [0, 1, 2].map(q => () => zeichneTor('barrikade', q)), palisade: [0, 1, 2].map(q => () => zeichneTor('palisade', q)) } };
// Gegner: je Typ ein eigener Name, wie ihn das alte Bild trug. Sie werden erst gemalt, wenn sie zum ersten Mal auftauchen.
const GEGNER = {
  pl: { oben: 'lumpen', hose: 'stoffOcker', kappe: 'rostDkl', maske: 'stoffRot', weste: 'rindsleder', guertel: 'gurt', ding: 'keule', haut: 'hautAlt' },
  sch: { oben: 'stoffGrau', hose: 'lumpen', hut: 'lederDkl', maske: 'lumpen', weste: 'lederDkl', guertel: 'gurt', ding: 'armbrust', haut: 'hautAlt' },
  bs: { oben: 'rostDkl', hose: 'lumpen', kappe: 'russ', maske: 'russ', guertel: 'gurt', ding: 'fackel', kanister: true, haut: 'hautAlt', dick: .94 },
  tr: { oben: 'stoffRot', hose: 'lumpen', haar: 'haarSchwarz', frisur: 'halbglatze', bart: 'voll', guertel: 'gurt', ding: 'trommel', nackteArme: true, dick: 1.06, haut: 'hautAlt' },
  dieb: { mass: .85, oben: 'lumpen', hose: 'russ', frisur: 'kopftuch', tuch: 'stoffRot', maske: 'russ', umhang: 'russ', ding: 'messer', dick: .88, stiefel: 'lederDkl' },
  eiferer: { oben: 'kapuze', rock: 'kapuze', frisur: 'kopftuch', tuch: 'kapuze', maske: 'russ', guertel: 'gurt', ding: 'fackel', kanister: true, dick: .96, haut: 'hautHell' },
  hauptmann: { oben: 'kapuze', rock: 'kapuze', frisur: 'kopftuch', tuch: 'stahlAlt', platte: 'stahlAlt', schulter: 'stahlAlt', guertel: 'gurt', ding: 'schwertZ', umhang: 'rotDkl', dick: 1.1, haut: 'hautHell' },
  schlaeger: { oben: 'lumpen', hose: 'lederDkl', haar: 'haarSchwarz', weste: 'rost', ding: 'keule', nackteArme: true, dick: 1.14, haut: 'hautDkl', guertel: 'gurt' },
  messerstecher: { oben: 'stoffGrau', hose: 'russ', haar: 'haarRot', frisur: 'kopftuch', tuch: 'stoffGrau', maske: 'lumpen', ding: 'messer', dick: .9, guertel: 'gurt' },
  armbruster: { oben: 'lederDkl', hose: 'hose', kappe: 'metall', weste: 'stahlAlt', guertel: 'gurt', ding: 'armbrust', haut: 'hautDkl' },
  treiber: { mass: 2, oben: 'russ', hose: 'eisenDkl', schuerze: 'russ', kappe: 'stahlAlt', schulter: 'stahlAlt', maske: 'stahlAlt', guertel: 'gurt', ding: 'peitsche', nackteArme: true, dick: 1.12, haut: 'hautAlt' },
  soldat: { oben: 'stoffBlau', hose: 'hose', kappe: 'metall', platte: 'stahlAlt', schulter: 'stahlAlt', guertel: 'gurt', ding: 'schwertZ', dick: 1.04, stiefel: 'rindsleder' },
  leibwache: { oben: 'hose', hose: 'hose', kappe: 'stahlAlt', platte: 'stahlAlt', schulter: 'stahlAlt', maske: 'stahlAlt', guertel: 'gurt', ding: 'schwertZ', dick: 1.12, stiefel: 'gurt' },
};
// Ein Gelenkgerüst für Bewegungen von der Seite: Hüfte, Neigung des Rumpfs, Arme und Beine als Punkte. Der Held schaut nach rechts.
function rigFigur(T, o) {
  const m = new Blatt(180, 176), hx = o.hx === undefined ? 84 : o.hx, hy = o.hy === undefined ? 122 : o.hy, l = o.lean || 0, kd = o.kopf || 47, sx = hx + Math.sin(l) * 30, sy = hy - Math.cos(l) * 30, kx = hx + Math.sin(l) * kd, ky = hy - Math.cos(l) * kd, d = T.dick || 1;
  const bein = (B, h) => { m.form(M.kap(hx, hy, hx + B[0], hy + B[1], 6.2 * d), T.hose, { rund: 4, hell: h, rau: .12 }); m.form(M.kap(hx + B[0], hy + B[1], hx + B[2], hy + B[3] - 6, 4.8 * d), T.hose, { rund: 3, hell: h, rau: .12 }); m.form(M.oder(M.ell(hx + B[2] + 2, hy + B[3] - 2, 6.2 * d, 3), M.box(hx + B[2] - 4, hy + B[3] - 10, 8 * d, 9)), T.stiefel, { rund: 2, hell: h, ...(T.stahlBein ? glatt : {}) }); };
  const arm = (A, h) => { m.form(M.kap(sx, sy, sx + A[0], sy + A[1], 4 * d), T.arm, { rund: 3, hell: h }); m.form(M.kap(sx + A[0], sy + A[1], sx + A[2], sy + A[3], 3.7 * d), T.unterarm || T.arm, { rund: 2.6, hell: h }); m.form(M.ell(sx + A[2], sy + A[3], 4.2, 4.2), T.hand, { rund: 2.2, hell: h }); };
  if (T.umhang) T.umhang(m, sx, sy, hx, hy, l, o.wehen || 0);
  if (o.fern) arm(o.fern, -.2); if (T.waffe2 && o.fern) T.waffe2(m, sx + o.fern[2], sy + o.fern[3], o.w2 === undefined ? 0 : o.w2, -.14, o);
  bein(o.bf, -.2); bein(o.bn, 0);
  if (T.vorBeine) T.vorBeine(m, hx, hy, o.wehen || 0);
  T.rumpf(m, sx, sy, hx, hy, l);
  T.kopf(m, kx, ky, l);
  T.waffe(m, sx + o.nah[2], sy + o.nah[3], o.w, 0, o);
  arm(o.nah, 0);
  if (T.schulter) T.schulter(m, sx, sy);
  if (o.nach) o.nach(m, hx, hy);
  return m;
}
const rumpfQuad = (m, sx, sy, hx, hy, l, b0, b1, f, o) => { const nx = Math.cos(l), ny = Math.sin(l); m.form(M.poly([[sx - nx * b0, sy - ny * b0], [sx + nx * b0, sy + ny * b0], [hx + nx * b1, hy + ny * b1], [hx - nx * b1, hy - ny * b1]]), f, o); };
const klinge = (m, x, y, a, len, br, griff, hell = 0) => { const c = Math.cos(a), s = Math.sin(a), q = t => [x + c * t, y + s * t], nx = -s, ny = c; m.form(M.kap(...q(-7), ...q(4), 1.7), 'rindsleder', { rund: 1, hell }); m.form(M.kap(x + c * 4 + nx * 8, y + s * 4 + ny * 8, x + c * 4 - nx * 8, y + s * 4 - ny * 8, griff), 'metall', { rund: .8, hell }); const e = q(len), f = q(5); m.form(M.poly([[f[0] + nx * br, f[1] + ny * br], [f[0] - nx * br, f[1] - ny * br], [e[0] - nx * .5, e[1] - ny * .5], [e[0] + nx * .5, e[1] + ny * .5]]), 'stahlAlt', { rund: 1, ...glatt, hell: hell + .16 }); m.linie([f, e], 'stahlAlt', { hell: hell + .55 }); };
const schwung = (m, x, y, r, a0, a1, f) => { for (let i = 0; i < 26; i++) { const t = i / 25, w = a0 + (a1 - a0) * t; m.form(M.kap(x + Math.cos(w) * r, y + Math.sin(w) * r, x + Math.cos(w) * r + 1, y + Math.sin(w) * r, .6 + t * 2.2), f, { rund: 1, leuchtet: true, kante: false, hell: -.3 + t * .3 }); } };
const HELD_RIG = {
  held: { hose: 'stahlAlt', stiefel: 'stahlAlt', stahlBein: true, arm: 'hose', unterarm: 'stahlAlt', hand: 'stahlAlt',
    umhang(m, sx, sy, hx, hy, l, w) { m.form(M.poly([[sx - 6, sy - 2], [sx - 14 - w * 40, sy + 18 - w * 8], [hx - 24 - w * 50, hy + 34 - w * 22], [hx - 12 - w * 40, hy + 40 - w * 20], [hx + 4, hy + 16], [sx + 6, sy + 4]]), 'mantel', { rund: 3, muster: falten }); },
    rumpf(m, sx, sy, hx, hy, l) { rumpfQuad(m, sx, sy, hx, hy, l, 12, 9, 'stahlAlt', { rund: 4, ...glatt }); m.form(M.box(hx - 8, hy - 3, 16, 5), 'gurt', { rund: 1 }); rumpfQuad(m, hx, hy + 1, hx - Math.sin(l) * -10, hy + 18, 0, 5, 6, 'wein', { rund: 2, muster: falten }); },
    kopf(m, x, y) { m.form(M.ell(x, y, 7, 8.4), 'stahlAlt', { rund: 5, ...glatt }); m.form(M.poly([[x, y - 4], [x + 8, y - 1], [x + 7.6, y + 5], [x + 1, y + 8]]), 'stahlAlt', { rund: 2.4, ...glatt, hell: -.02 }); m.linie([[x + 1, y - .4], [x + 7.6, y + .6]], 'russ', { hell: -.6 }); },
    waffe: (m, x, y, a, h) => klinge(m, x, y, a, 48, 2.6, 1.6, h), schulter(m, x, y) { m.form(M.ell(x, y, 8, 6), 'stahlAlt', { rund: 3, ...glatt, hell: .06 }); } },
  beschwoerer: { hose: 'hose', stiefel: 'rindsleder', arm: 'mantel', hand: 'gurt',
    vorBeine(m, hx, hy, w) { m.form(M.poly([[hx - 10, hy - 2], [hx + 11, hy - 2], [hx + 16 - w * 6, hy + 34], [hx - 15 - w * 24, hy + 36]]), 'mantel', { rund: 4, muster: falten, hell: .02 }); },
    umhang(m, sx, sy, hx, hy, l, w) { m.form(M.poly([[sx - 9, sy - 2], [sx - 14, sy + 30], [hx - 18 - w * 44, hy + 40 - w * 18], [hx - 2, hy + 44 - w * 6], [hx + 14 + w * 6, hy + 40], [sx + 9, sy + 6]]), 'mantel', { rund: 4, muster: falten, hell: .03 }); m.form(M.box(sx - 18, sy + 2, 11, 22), 'metall', { rund: 2, hell: -.06 }); m.form(M.ell(sx - 12.5, sy + 12, 2.6, 2.6), 'lazi', { rund: 1.2, leuchtet: true }); },
    rumpf(m, sx, sy, hx, hy, l) { rumpfQuad(m, sx, sy, hx, hy, l, 11, 11, 'mantel', { rund: 4, muster: falten, hell: .05 }); m.form(M.box(hx - 9, hy - 3, 18, 4), 'rindsleder', { rund: 1 }); },
    kopf(m, x, y) { m.form(M.ell(x, y, 8, 9.4), 'mantel', { rund: 5, hell: .1, rau: .2, korn: 3 }); m.form(M.ell(x + 3, y + 1, 4.6, 6.4), 'russ', { rund: 2, hell: -.25, kante: false }); m.form(M.ell(x + 5.4, y, 1.5, 1.2), 'lazi', { rund: 1, leuchtet: true, kante: false }); },
    waffe(m, x, y, a, h, o) { const c = Math.cos(a), s = Math.sin(a); m.form(M.kap(x - c * 28, y - s * 28, x + c * 48, y + s * 48, 1.6), 'metall', { rund: 1, hell: h + .04 }); const ex = x + c * 50, ey = y + s * 50; m.form(M.poly([[ex + c * 8, ey + s * 8], [ex - s * 4, ey + c * 4], [ex - c * 4, ey - s * 4], [ex + s * 4, ey - c * 4]]), 'lazi', { rund: 1, leuchtet: true, kante: false }); if (o.licht) m.form(M.ell(ex + c * 4, ey + s * 4, o.licht, o.licht), 'lazi', { rund: o.licht * .5, leuchtet: true, hell: -.18, kante: false }); } },
  architekt: { hose: 'hose', stiefel: 'rindsleder', arm: 'leinen', hand: 'rindsleder', dick: 1.08,
    rumpf(m, sx, sy, hx, hy, l) { rumpfQuad(m, sx, sy, hx, hy, l, 12, 10, 'leinen', { rund: 4, muster: falten, hell: -.04 }); rumpfQuad(m, sx + 3, sy + 12, hx + 3, hy + 12, l, 6, 7, 'rindsleder', { rund: 2, rau: .2, korn: 3 }); m.form(M.box(hx - 10, hy - 3, 20, 5), 'lederDkl', { rund: 1 }); },
    kopf(m, x, y) { m.form(M.ell(x, y, 6.8, 8), 'hautAlt', { rund: 5 }); m.form(M.oder(M.ell(x - 1, y - 5, 7.4, 4.8)), 'lederDkl', { rund: 3, rau: .2, korn: 3 }); m.form(M.poly([[x + 1, y + 3], [x + 7.4, y + 2], [x + 7, y + 8], [x - 1, y + 9]]), 'leinen', { rund: 1.4, hell: -.1 }); m.form(M.box(x - 6, y - 2.6, 13, 2), 'gurt', { rund: .6 }); m.form(M.ell(x + 5, y - 1, 2.2, 2), 'feuer', { rund: 1, hell: -.14 }); },
    waffe(m, x, y, a, h) { const c = Math.cos(a), s = Math.sin(a), ex = x + c * 40, ey = y + s * 40; m.form(M.kap(x - c * 8, y - s * 8, ex, ey, 2), 'holz', { rund: 1.4, muster: maserung, hell: h }); const nx = -s, ny = c; m.form(M.poly([[ex + nx * 13 - c * 7, ey + ny * 13 - s * 7], [ex + nx * 13 + c * 7, ey + ny * 13 + s * 7], [ex - nx * 13 + c * 7, ey - ny * 13 + s * 7], [ex - nx * 13 - c * 7, ey - ny * 13 - s * 7]]), 'stahlAlt', { rund: 2, ...glatt, hell: h + .04 }); } },
  schatten: { hose: 'russ', stiefel: 'lederDkl', arm: 'russ', unterarm: 'gurt', hand: 'gurt', dick: .9,
    umhang(m, sx, sy, hx, hy, l, w) { m.form(M.poly([[sx - 3, sy - 2], [sx - 10 - w * 30, sy + 10], [sx - 26 - w * 56, sy + 26 - w * 14], [sx - 14 - w * 44, sy + 32 - w * 12], [sx, sy + 20]]), 'schal', { rund: 2.6, muster: falten }); },
    rumpf(m, sx, sy, hx, hy, l) { rumpfQuad(m, sx, sy, hx, hy, l, 10, 8, 'russ', { rund: 3, hell: .08 }); m.form(M.ell((sx + hx) / 2 + 3, (sy + hy) / 2, 2.6, 2.6), 'lazi', { rund: 1.4, leuchtet: true }); },
    kopf(m, x, y) { m.form(M.oder(M.ell(x - 1, y, 9.2, 10.6), M.poly([[x - 6, y - 7], [x + 3, y - 9], [x + 11, y - 3], [x + 8, y + 12], [x - 9, y + 15]])), 'schal', { rund: 6, rau: .15, korn: 3 }); m.form(M.poly([[x + 3, y - 4], [x + 9, y - 1.4], [x + 8, y + 5], [x + 7, y + 12], [x + 2, y + 13]]), 'russ', { rund: 1, hell: -.6, kante: false }); m.linie([[x + 4.6, y + 2], [x + 7.2, y + 3.8]], 'lazi', { leuchtet: true, hell: -.24 }); },
    waffe: (m, x, y, a, h) => klinge(m, x, y, a, 25, 1.8, 1.2, h), waffe2: (m, x, y, a, h) => klinge(m, x, y, a, 25, 1.8, 1.2, h) },
};
const ST = { bf: [-10, 24, -18, 48], bn: [12, 22, 18, 48] }, LUNGE = { bf: [-16, 20, -32, 48], bn: [20, 18, 26, 48] };
const auflosen = (m, n) => { for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.r[y * m.w + x] >= 0 && BAYER[(y % 4) * 4 + x % 4] < n) m.r[y * m.w + x] = -1; return m; };
const BW = { bf: [-6, 24, -8, 48], bn: [8, 24, 10, 48] }, BW2 = { bf: [-8, 24, -14, 48], bn: [10, 22, 16, 48] }, AR = { bf: [-22, 18, -38, 42], bn: [22, 18, 34, 42], hy: 128 };
const HELD_POSEN = {
  // Schwertkämpfer: breite, schwere Hiebe, im Rollen schützt er sich mit dem Umhang
  held: { hieb: [{ lean: -.16, ...ST, nah: [-10, 8, -14, -8], fern: [8, 12, 12, 20], w: -2.3 }, { lean: .24, ...LUNGE, wehen: .5, nah: [14, 6, 30, 2], fern: [-8, 12, -14, 20], w: -.12, nach: (m, x, y) => schwung(m, x + 14, y - 34, 54, -1.7, .2, 'stahl') }, { lean: .32, ...LUNGE, wehen: .3, nah: [14, 10, 26, 20], fern: [-8, 14, -14, 22], w: .6 }],
    hiebOben: [{ lean: -.12, ...ST, nah: [4, -14, 8, -30], fern: [6, 12, 10, 20], w: -1.9 }, { lean: .22, ...LUNGE, wehen: .4, nah: [14, -8, 26, -16], fern: [-6, 12, -12, 20], w: -.7, nach: (m, x, y) => schwung(m, x + 10, y - 34, 56, -2.2, -.2, 'stahl') }, { lean: .46, ...LUNGE, wehen: .2, nah: [14, 12, 26, 20], fern: [-8, 14, -14, 22], w: .95 }],
    rolle: [.7, 2.2, 3.8, 5.4].map((t, i) => ({ hx: 84 - Math.sin(t) * 22, hy: 140 + Math.cos(t) * 22, lean: t, kopf: 38, bf: [10 * Math.cos(t), 10 * Math.sin(t) + 8, 2, 16], bn: [12 * Math.cos(t + .6), 12 * Math.sin(t + .6) + 8, 8, 12], nah: [8, 10, 14, 4], fern: [-4, 12, 6, 16], w: t - .8, wehen: .4 })) },
  // Beschwörer: Er sticht nicht, er bündelt: Stab nach vorn, oben entlädt er sich. Statt zu rollen gleitet er tief im wehenden Mantel.
  beschwoerer: { hieb: [{ lean: -.08, ...BW, nah: [6, 6, 10, -8], fern: [6, 12, 12, 8], w: -1.45, licht: 4 }, { lean: .22, ...BW2, wehen: .4, nah: [14, 0, 30, -4], fern: [8, 10, 22, 2], w: -.05, licht: 7 }, { lean: .24, ...BW2, wehen: .2, nah: [12, 2, 26, 0], fern: [8, 10, 20, 4], w: -.1, licht: 5 }],
    hiebOben: [{ lean: -.04, ...BW, nah: [6, -12, 6, -28], fern: [8, -8, 10, -22], w: -1.57, licht: 5 }, { lean: -.1, ...BW, wehen: .3, nah: [6, -14, 6, -32], fern: [8, -10, 10, -26], w: -1.57, licht: 7 }, { lean: .18, ...BW2, wehen: .3, nah: [12, -8, 22, -18], fern: [6, 8, 14, 4], w: -.8, licht: 6 }],
    rolle: [.5, .8, .9, .6].map((t, i) => ({ hx: 84, hy: 128 + [4, 10, 10, 4][i], lean: t, kopf: 38, bf: [-16, 16, -34, 40 - [4, 10, 10, 4][i]], bn: [18, 8, 24, 40 - [4, 10, 10, 4][i]], nah: [-8, 8, -16, 0], fern: [-6, 10, -14, 6], w: 2.8, wehen: .8 + i * .1, nach: (m, x, y) => { for (let q = 0; q < 6; q++) m.punkt(x - 26 - q * 9, y + 16 + (q * 7 + i * 5) % 18, 'lazi', { leuchtet: true }); } })) },
  // Architekt: langsamer, schwerer Hammer von oben, im Ausweichen eine Schulterrolle mit dem Hammer vor der Brust
  architekt: { hieb: [{ lean: -.22, ...AR, nah: [0, -14, 2, -30], fern: [4, -12, 4, -26], w: -2.1 }, { lean: .24, ...AR, nah: [14, -8, 26, -16], fern: [12, -6, 22, -10], w: -.6, nach: (m, x, y) => schwung(m, x + 6, y - 34, 56, -2.4, -.3, 'stroh') }, { lean: .52, ...AR, nah: [14, 12, 26, 24], fern: [12, 14, 22, 26], w: .72, nach: (m, x, y) => { for (const [a, b] of [[62, 42], [74, 36], [86, 42], [54, 46], [94, 46]]) m.form(M.ell(x + a, y + b, 3, 2), 'stein', { rund: 1, hell: .1 }); } }],
    hiebOben: [{ lean: -.1, ...AR, nah: [-10, 4, -20, 2], fern: [-8, 8, -16, 6], w: 3 }, { lean: .1, ...AR, nah: [10, 4, 12, 8], fern: [8, 8, 8, 10], w: .05, nach: (m, x, y) => schwung(m, x, y - 26, 50, 3, 6.4, 'stroh') }, { lean: .24, ...AR, nah: [14, 6, 28, 10], fern: [10, 8, 20, 12], w: .3 }],
    rolle: [.9, 2.3, 3.7, 5.3].map((t) => ({ hx: 84 - Math.sin(t) * 22, hy: 140 + Math.cos(t) * 22, lean: t, kopf: 38, bf: [10 * Math.cos(t), 10 * Math.sin(t) + 8, 3, 14], bn: [12 * Math.cos(t + .5), 12 * Math.sin(t + .5) + 8, 8, 12], nah: [8, 8, 12, 10], fern: [8, 10, 12, 12], w: t + .6 })) },
  // Schattenläufer: tief und schnell, zwei Klingen über Kreuz, statt zu rollen löst er sich auf
  schatten: { hieb: [{ lean: .34, bf: [-14, 18, -26, 44], bn: [16, 12, 22, 44], nah: [-6, 10, -8, 18], fern: [10, 8, 18, 6], w: 2.6, w2: -.3, wehen: .3, hy: 126 }, { lean: .58, bf: [-20, 12, -40, 44], bn: [22, 10, 30, 44], nah: [14, 6, 30, 6], fern: [-10, 10, -18, 20], w: .02, w2: 2.6, wehen: .8, hy: 126, nach: (m, x, y) => schwung(m, x + 10, y - 16, 46, -.9, .7, 'lazi') }, { lean: .5, bf: [-18, 14, -34, 44], bn: [20, 12, 26, 44], nah: [12, 10, 24, 16], fern: [14, 4, 26, 0], w: .5, w2: -.3, wehen: .5, hy: 126 }],
    hiebOben: [{ lean: -.1, ...ST, nah: [-12, 0, -22, -4], fern: [-8, 8, -16, 12], w: 3.6, w2: 3, wehen: .2 }, { lean: .1, ...LUNGE, nah: [4, -12, 12, -22], fern: [-8, 6, -16, 4], w: -1.1, w2: 3.1, wehen: .7 }, { lean: .46, ...LUNGE, nah: [14, 10, 28, 14], fern: [12, 4, 26, -4], w: .6, w2: -.5, wehen: .5, nach: (m, x, y) => schwung(m, x + 6, y - 22, 48, -1.4, .6, 'lazi') }],
    rolle: [0, .35, .7, .35].map((n, i) => ({ fade: n, hx: 84, hy: 128, lean: .7, bf: [-20, 12, -40, 42], bn: [22, 10, 30, 42], nah: [-6, 10, -14, 12], fern: [-4, 10, -12, 14], w: 3.2, w2: 3, wehen: 1 })) },
};
function heldBewegung(k) { const T = HELD_RIG[k], P2 = HELD_POSEN[k], mal = o => () => { const m = rigFigur(T, o); return o.fade ? auflosen(m, o.fade) : m; }; return { hieb: P2.hieb.map(mal), hiebOben: P2.hiebOben.map(mal), rolle: P2.rolle.map(mal) }; }
function schraegBlatt(F, blick, p, schnitt) {
  const ob = F[blick](p), un = F.seite(p), arm = (F.armFarben || []).map(n => NAMEN.indexOf(n));
  const setzen = (o, u, dir, q) => { const W = o.width, H = o.height, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const mitte = W / 2, sx = dir > 0 ? 38 : W - 38;
    for (let y = schnitt - 5; y < H; y++) g.drawImage(u, 0, y, W, 1, mitte + dir - sx * .74, y, W * .74, 1);
    const hals = schnitt < 80, breite = y => hals && y > 50 ? .88 - .14 * Math.min(1, (y - 50) / 16) : .88, lehne = y => (1 + Math.max(0, schnitt - y) / schnitt * 3) * dir;
    for (let y = 0; y < schnitt; y++) { const k = breite(y); g.drawImage(o, 0, y, W, 1, Math.round(mitte * (1 - k) + lehne(y)), y, W * k, 1); }
    // Unterhalb des Schnitts nur noch die Spalten außerhalb des Körpers: dort hängen Hände und Ärmel
    if (hals && arm.length) { const d = o.getContext('2d').getImageData(0, schnitt, W, Math.min(14, H - schnitt)).data; const spalte = new Set(), tief = {}; if (F.aermelWieMantel) for (let y = schnitt; y < schnitt + 14 && y < H; y++) for (let x = 0; x < W; x++) if (Math.abs(x - mitte) >= 12 && arm.includes(q.r[y * W + x])) { spalte.add(x); tief[x] = y; } const nahe = (x, y) => { for (let v = -3; v <= 3; v++) if (spalte.has(x + v) && y <= tief[x + v]) return true; return false; }; for (let y = schnitt; y < schnitt + 14 && y < H; y++) for (let x = 0; x < W; x++) { if (Math.abs(x - mitte) < 12 || !(arm.includes(q.r[y * W + x]) || nahe(x, y))) continue; const i = ((y - schnitt) * W + x) * 4; if (!d[i + 3]) continue; g.fillStyle = 'rgba(' + d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ',' + d[i + 3] / 255 + ')'; g.fillRect(Math.round(mitte * .12 + lehne(y) + x * .88), y, 1, 1); } }
    return c; };
  return { bild: art => setzen(ob.bild(art), un.bild(art), 1, ob), spiegeln: () => { const o2 = ob.spiegeln(), u2 = un.spiegeln(); return { bild: art => setzen(o2.bild(art), u2.bild(art), -1, o2) }; } };
}
const schraeg = (F, sv = 62, sh = 62) => Object.assign(F, { schraegV: p => schraegBlatt(F, 'vorne', p, sv), schraegH: p => schraegBlatt(F, 'hinten', p, sh) });
// Malt, was innerhalb geschieht, um einen Punkt gedreht: So dreht sich jede Waffe um die Hand, ohne dass jede einzeln neu gezeichnet wird
function gedreht(m, cx, cy, w) {
  const c = Math.cos(w), s = Math.sin(w), hin = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c], her = (x, y) => [cx + (x - cx) * c + (y - cy) * s, cy - (x - cx) * s + (y - cy) * c];
  return { form(mk, f, o = {}) { const q = { ...o }; if (o.muster) q.muster = (x, y) => o.muster(...her(x, y)); const d = (x, y) => mk(...her(x, y)); if (mk.mass) { const [a, b, e, g] = mk.mass, p = [hin(a, b), hin(e, b), hin(a, g), hin(e, g)]; d.mass = [Math.min(...p.map(i => i[0])) - 1, Math.min(...p.map(i => i[1])) - 1, Math.max(...p.map(i => i[0])) + 1, Math.max(...p.map(i => i[1])) + 1]; } m.form(d, f, q); return this; }, punkt(x, y, f, o) { m.punkt(...hin(x, y), f, o); return this; }, linie(p, f, o) { m.linie(p.map(([x, y]) => hin(x, y)), f, o); return this; } };
}
const klasse = K => schraeg({ ruhe: true, armFarben: [K.hand, K.unterarm].filter(Boolean), aermelWieMantel: K.arm === 'mantel', seitePose: (p, pose) => { K.pose = pose; const m = klasseFigur('seite', p, K); K.pose = null; return m; }, vorne: p => klasseFigur('vorne', p, K), hinten: p => klasseFigur('hinten', p, K), seite: p => klasseFigur('seite', p, K) }, K.frei ? 62 : 62, K.langHinten || 62);
{ const alt = { ...FIGUREN }; for (const k of Object.keys(FIGUREN)) delete FIGUREN[k];
  Object.assign(FIGUREN, { held: schraeg({ ...alt.held, name: 'Schwertkämpfer' }, 62, 98), beschwoerer: { ...klasse(BESCHWOERER) }, architekt: { ...klasse(ARCHITEKT) }, schatten: { ...klasse(SCHATTEN) }, schild: alt.schild, wolf: alt.wolf }); }

  // Das Lagerfeuer: Steinkreis und Scheite, dahinter Flammen, deren Zungen in Spitzen auslaufen
  function zeichneFeuer(t, grad) {
    const b = 96, h = 160, c = document.createElement('canvas'); c.width = b; c.height = h; const g = c.getContext('2d'), F = ['#8a2a14', '#d04c18', '#f07c1c', '#f9ae2c', '#ffd65a', '#fff0b0', '#fffde8'], fh = 106 * grad, fuss = h - 20, cx = b / 2;
    // Reihenfolge wie im echten Feuer: hintere Steine und Scheite, dann die Flamme, davor die vorderen Scheite und Steine. So sitzt die Flamme im Holz.
    const SH = 62, boden = 44, hinten = new Blatt(96, SH), vorn = new Blatt(96, SH);
    for (let k = 0; k < 5; k++) { const w = Math.PI + k / 4 * Math.PI; hinten.form(M.ell(48 + Math.cos(w) * 34, boden + Math.sin(w) * 9, 6, 4.6), 'stein', { rund: 2.4 }); }
    hinten.form(M.ell(48, boden + 1, 29, 8), 'russ', { rund: 3 });
    hinten.form(M.kap(18, boden + 1, 56, boden - 26, 3.2), 'holz', { rund: 2, muster: maserung, hell: -.22 }); hinten.form(M.kap(78, boden + 1, 40, boden - 26, 3.2), 'holz', { rund: 2, muster: maserung, hell: -.16 });
    g.drawImage(hinten.bild('tag'), 0, h - SH);
    // t läuft einmal im Kreis, jede Zunge schwingt ganzzahlig oft: So schließt die Bewegung nahtlos
    const ZUNGEN = [[-22, .5, 2, .3, 9], [-12, .8, 3, 1.7, 10], [-4, 1, 2, 3.1, 12], [5, .88, 3, .9, 11], [13, .7, 2, 4.4, 10], [22, .48, 3, 2.6, 8], [-1, .96, 4, 5.2, 6]];
    const wert = new Float32Array(b * h);
    for (const [ab, gr, f, ph, w0] of ZUNGEN) {
      const hk = fh * gr * (.74 + .26 * Math.sin(t * f + ph)), kipp = Math.sin(t + ph) * .025;
      for (let d = 0; d < hk; d++) {
        const u = d / hk, mitte = cx + ab * grad * (1 - u * .55) + Math.sin(d * .075 + t * f + ph) * d * .075 + d * kipp, w = w0 * Math.max(grad, .55) * Math.pow(1 - u, .8) * (1 + .22 * Math.sin(d * .26 + t * 2 * f));
        for (let x = Math.max(0, Math.floor(mitte - w)); x <= Math.min(b - 1, mitte + w); x++) { const i = (1 - Math.abs(x + .5 - mitte) / w) * (1 - u * .45), o = (fuss - d | 0) * b + x; if (o >= 0 && i > wert[o]) wert[o] = i; }
      }
      // Oben reißen Spitzen ab und steigen allein weiter
      const stufe = (Math.sin(t * f + ph * 2) + 1) / 2;
      if (stufe > .85) { const y = fuss - hk - 4 - stufe * 10 * grad, x = cx + ab * .6 + Math.sin(t * f + ph) * 7, hh = (4 + 12 * hash(f, ph)) * grad * stufe + 2; for (let q = 0; q < hh * 2; q++) { const wq = 2.8 * (1 - Math.abs(q - hh) / hh), m2 = x + Math.sin(q * .4 + t) * 1.5; for (let a = Math.floor(m2 - wq); a <= m2 + wq; a++) { const o = (y + hh - q | 0) * b + a; if (o >= 0 && o < wert.length && a >= 0 && a < b && wert[o] < .5) wert[o] = .5; } } }
    }
    // Die Glutmasse unten: eine breite Tropfenform, fast weiß, so breit wie das Holz. Sie atmet mit.
    { const tr = .55 * fh * (.9 + .1 * Math.sin(t * 2 + 1)), br = 30 * Math.max(grad, .6); for (let d = 0; d < tr; d++) { const u = d / tr, w = br * Math.pow(1 - u, .55) * (1 + .1 * Math.sin(d * .3 + t * 3)); for (let x = Math.max(0, Math.floor(cx - w)); x <= Math.min(b - 1, cx + w); x++) { const o = (fuss - d | 0) * b + x, ii = .8 - Math.abs(x - cx) / w * .5 + (rauschen(x / 5, d / 7 - t * 1.5) - .5) * .34 - u * .14; if (o >= 0 && ii > wert[o]) wert[o] = ii; } } }
    for (let y = 0; y < h; y++) for (let x = 0; x < b; x++) { const i = wert[y * b + x]; if (!i) continue; const nah = 1 - Math.min(1, (fuss - y) / Math.max(1, fh)), s = i * 5.6 + nah * 1.6 + (rauschen(x / 6, y / 6 + t * 3) - .5) * 1.1 - .2; g.fillStyle = F[Math.max(0, Math.min(6, Math.round(s)))]; g.fillRect(x, y, 1, 1); }
    vorn.form(M.kap(26, boden + 5, 54, boden - 18, 3.4), 'holz', { rund: 2, muster: maserung, hell: -.1 }); vorn.form(M.kap(70, boden + 5, 42, boden - 18, 3.4), 'holz', { rund: 2, muster: maserung, hell: -.05 });
    for (let k = 0; k < 6; k++) { const w = k / 5 * Math.PI; vorn.form(M.ell(48 + Math.cos(w) * 36, boden + 2 + Math.sin(w) * 10, 6.4, 4.8), 'stein', { rund: 2.4, hell: .05 }); }
    g.drawImage(vorn.bild('tag'), 0, h - SH);
    return c;
  }
  // Schlagbilder für Gegner und Begleiter: Stufe 0 holt weit aus, Hand auf Kopfhöhe. Stufe 1 trifft: Hand vorn auf Hüfthöhe, Waffe nach unten, Bogen von Spitze zu Spitze.
  // Der Fernkämpfer steht fest und federt nur zurück. Das Bild ist breiter, damit der Bogen Platz hat; die Mitte bleibt dieselbe.
  const SCHWUNG_FARBE = { keule: '#e4dccc', schwertZ: '#eef2f4', messer: '#dfe7ec', fackel: '#ffb648', peitsche: '#d2a874' };
  const POSE = [{ x: -3, y: 31, ex: -9, ey: 42, w: -.9 }, { x: 10, y: 60, ex: 9, ey: 48, w: 2.27 }];
  function schlagBlatt(F, stufe, ding) {
    const fest = !SCHWUNG_FARBE[ding], PAD = 24, q = !F.seitePose ? F.seite(stufe ? 0 : 1) : fest ? F.seite(4) : F.seitePose(stufe ? 0 : 4, { ...POSE[stufe], w: ding === 'peitsche' ? 0 : POSE[stufe].w }), lean = fest ? (stufe ? -3 : 0) : stufe ? 11 : -7;
    const setzen = (o, dir, art) => { const W = o.width, H = o.height, c = document.createElement('canvas'); c.width = W + PAD * 2; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      for (let y = 0; y < H; y++) { const v = fest ? 1 : y < 62 ? (62 - y) / 62 : 0; g.drawImage(o, 0, y, W, 1, PAD + Math.round(lean * (fest ? 1 : Math.sqrt(v)) * dir), y, W, 1); }
      if (stufe && !fest && (art === 'tag' || art === 'farbe')) { g.fillStyle = SCHWUNG_FARBE[ding]; const Bx = 46, By = 40, R = 48; for (let w = -1.15; w < .92; w += .018) { const t = (w + 1.15) / 2.07, dick = 1 + 3.2 * Math.sin(t * 3.14); g.globalAlpha = .6 + .35 * t; for (let r = 0; r < dick; r += .7) { const x = Bx + Math.cos(w) * (R - r), y = By + Math.sin(w) * (R - r); g.fillRect(PAD + Math.round(dir > 0 ? x : W - x), Math.round(y), 1, 1); } } g.globalAlpha = 1; }
      return c; };
    return { bild: art => setzen(q.bild(art), 1, art), spiegeln: () => { const q2 = q.spiegeln(); return { bild: art => setzen(q2.bild(art), -1, art) }; } };
  }
  FIGUREN.schild.schlag = i => schlagBlatt(FIGUREN.schild, i, 'keule');
  const GEGNER_FIGUREN = {}; for (const k in GEGNER) { const F = GEGNER_FIGUREN[k] = { mass: GEGNER[k].mass || 1, ...klasse(leuteFigur({ ...GEGNER[k], kampf: true })) }; F.schlag = i => schlagBlatt(F, i, GEGNER[k].ding); }
  const LEUTE_FIGUREN = {}; for (const k in LEUTE) { const K = leuteFigur(LEUTE[k]); LEUTE_FIGUREN[k] = { name: LEUTE[k].name, mass: LEUTE[k].mass || 1, ...klasse(K) }; }
  return { FIGUREN, SCHRAEG_ANSICHTEN: ['schraegV', 'schraegH'], SYMBOLE, zeichneSchrott, zeichneBolzenwerfer, zeichneMoerser, zeichnePfahlwall, zeichneWartungsbot, heldBewegung, GEGNER_FIGUREN, WEHR, MASCHINEN, zeichneKleingolem, zeichneLaziTurm, LEUTE_FIGUREN, BAUTEN, zeichneTanne, zeichneEiche, zeichneHaus, zeichneFeuer };
})();

// In Missionen geht die Kamera näher heran: Figuren wirken größer, die Karte weiter
const MISSION_ZOOM = 1.5;
function zoomSetzen(z) { cam.zoom = z; cam.updateProjectionMatrix(); }
// Maßstab: Bildpixel der neuen Motive in Spielpixeln. Der Held bleibt so hoch wie bisher.
const NEU_MASS = { feuer: 0.024 / PX, figur: 0.023 / PX, wolf: 0.018 / PX, tanne: 0.0115 / PX, baum: 0.021 / PX, haus: 0.011 / PX, alpha: 1.75, heuler: 1.1 };
function neuBild(blatt, mass) {
  const b = bild(blatt.bild('tag'));
  b.w *= mass; b.h *= mass;
  if (GRAFIK_STUFE === 'hoch') {
    const karten = q => { const t = c => { const x = textur(c); x.geteilt = true; return x; }; return { map: t(q.bild('farbe')), normal: t(q.bild('richtung')), leuchten: t(q.bild('leuchten')) }; };
    let k = null; Object.defineProperty(b, 'licht', { configurable: true, get: () => k || (k = { r: karten(blatt), l: karten(blatt.spiegeln()) }) });
  }
  return b;
}
// Golem: acht Schritte, sechs Bilder Ruhe (er atmet, der Kern pulsiert), vier Bilder Schlag. Jedes Bild entsteht erst, wenn es gebraucht wird.
function faulReihe(n, f) { const m = {}, l = []; for (let i = 0; i < n; i++) Object.defineProperty(l, i, { get: () => m[i] || (m[i] = f(i)), enumerable: true }); return l; }
function golemSatz(e, k) {
  const malen = p => neuBild(NEUE_GRAFIK.zeichneKleingolem(e, p, k), NEU_MASS.figur), T = Math.PI * 2;
  const s = faulReihe(8, i => { const w = i / 8 * T, sn = Math.sin(w), cs = Math.cos(w); return malen({ b: sn * 6, hl: Math.max(0, cs) * 5, hr: Math.max(0, -cs) * 5, dy: Math.abs(cs) * 2 - 2, a: sn * 8, kern: 8 }); });
  s.ruhe = faulReihe(6, i => { const w = i / 6 * T; return malen({ dy: Math.sin(w) * 1.6, a: Math.sin(w) * 2.5, kern: 7.5 + Math.sin(w) * 2 }); });
  s.hieb = faulReihe(4, i => malen([{ ah: .55, dy: -1, kern: 9 }, { ah: 1, dy: -3, kern: 10 }, { ah: .15, dy: 2, kern: 10 }, { ah: -.12, dy: 4, kern: 8 }][i]));
  return s;
}
// Eine Liste, deren Bilder erst beim ersten Zugriff entstehen
function faulListe(f) { const m = {}, l = [], hol = i => m[i] || (m[i] = f(i)); for (let i = 0; i < 4; i++) Object.defineProperty(l, i, { get: () => hol(i), enumerable: true }); l.stand = () => hol(4); l.hat = i => !!m[i]; l.hol = hol; return l; }
const NEU_WARTE = []; let neuWarteZeit = 0;
function neuNachmalen() {
  const j = performance.now(); if (!NEU_WARTE.length || j - neuWarteZeit < 40) return; neuWarteZeit = j;
  const [l, i] = NEU_WARTE.shift(), b = l.hol(i); if (szene.userData.licht) void b.licht;
}
// Das Bild, wenn es schon da ist. Sonst das Ersatzbild, damit im Kampf nichts stockt: Gemalt wird nebenher.
function neuBildOder(l, i, ersatz) {
  if (l.hat(i)) return l.hol(i);
  if (!NEU_WARTE.some(q => q[0] === l && q[1] === i)) NEU_WARTE.push([l, i]);
  return ersatz;
}
function neuAnsichten(F, mass) { const v = {}; for (const a of ['vorne', 'hinten', 'seite']) { const l = v[a] = [0, 1, 2, 3].map(p => neuBild(F[a](p), mass)); if (F.ruhe) { let s = null; l.stand = () => s || (s = neuBild(F[a](4), mass)); } else l.stand = () => l[1]; } for (const a of NEUE_GRAFIK.SCHRAEG_ANSICHTEN) if (F[a]) v[a] = faulListe(p => neuBild(F[a](p), mass)); if (F.schlag) v.schlag = faulListe(i => neuBild(F.schlag(i), mass)); return v; }
// Wölfe: dieselben Bilder wie das Spiel sie erwartet (Stand, dann Gang), dazu die Ansichten von vorn und hinten
function wolfBilder(v, mal) {
  const g = b => { const c = Object.assign({}, b, { w: b.w * mal, h: b.h * mal }); if (GRAFIK_STUFE === 'hoch') Object.defineProperty(c, 'licht', { configurable: true, get: () => b.licht }); return c; };
  const a = { vorne: v.vorne.map(g), hinten: v.hinten.map(g) };
  for (const k of ['vorne', 'hinten']) { let s = null; a[k].stand = () => s || (s = g(v[k].stand())); }
  for (const k of NEUE_GRAFIK.SCHRAEG_ANSICHTEN) if (v[k]) a[k] = faulListe(p => g(p < 4 ? v[k][p] : v[k].stand()));
  if (v.schlag) a.schlag = faulListe(i => g(v.schlag[i]));
  return [g(v.seite.stand()), ...v.seite.map(g)].map(b => Object.assign(b, { neu: a }));
}
let neuLadezeit = 0;
function neueBilderEinsetzen() {
  if (!neueGrafik()) return;
  const beginn = performance.now();
  const F = NEUE_GRAFIK.FIGUREN, w = neuAnsichten(F.wolf, NEU_MASS.wolf);
  BILD.wf = wolfBilder(w, 1); BILD.hw = wolfBilder(w, NEU_MASS.heuler); BILD.aw = wolfBilder(w, NEU_MASS.alpha);
  const t1 = neuBild(NEUE_GRAFIK.zeichneTanne(1), NEU_MASS.tanne);
  BILD.tanne = [t1, t1, t1];
  // Feuer in drei Größen, je sechs Bilder. Es leuchtet selbst und bleibt deshalb ein einfaches Bild.
  BILD.feuerGross = [1, .72, .45].map(grad => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => { const b = bild(NEUE_GRAFIK.zeichneFeuer(i / 12 * Math.PI * 2, grad)); b.w *= NEU_MASS.feuer; b.h *= NEU_MASS.feuer; return b; }));
  const l = neuBild(NEUE_GRAFIK.zeichneEiche(), NEU_MASS.baum); BILD.laubbaum = [l, l, l, l];
  const h = neuBild(NEUE_GRAFIK.zeichneHaus(), NEU_MASS.haus); BILD.gebaeude.wohnhaus = [h, h, h];
  // Gegner erscheinen erst beim ersten Zugriff: Alle beim Start zu malen, verzögerte den Start auf dem Handy zu sehr
  for (const k in NEUE_GRAFIK.GEGNER_FIGUREN) Object.defineProperty(BILD, k, { configurable: true, enumerable: true, get() { const v = wolfBilder(neuAnsichten(NEUE_GRAFIK.GEGNER_FIGUREN[k], NEU_MASS.figur * NEUE_GRAFIK.GEGNER_FIGUREN[k].mass), 1); Object.defineProperty(BILD, k, { value: v, writable: true, configurable: true, enumerable: true }); if (k === 'tr') BILD.trSchlag = v[2]; return v; }, set(v) { Object.defineProperty(BILD, k, { value: v, writable: true, configurable: true, enumerable: true }); } });
  { const st = neuAnsichten(NEUE_GRAFIK.FIGUREN.schild, NEU_MASS.figur); BILD.st = wolfBilder(st, 1); }
  for (const k in NEUE_GRAFIK.MASCHINEN) Object.defineProperty(BILD, k, { configurable: true, enumerable: true, get() { const q = NEUE_GRAFIK.MASCHINEN[k], mass = NEU_MASS.figur * ({ herdenlaeufer: .62, truhe: .7, truheOffen: .7, hund: .55, holz: .7, brot: .7, fleisch: .7, muenze: .8, teil: .8 }[k] || 1), v = Array.isArray(q) ? q.map(f => neuBild(f(), mass)) : neuBild(q(), mass); Object.defineProperty(BILD, k, { value: v, writable: true, configurable: true, enumerable: true }); return v; }, set(v) { Object.defineProperty(BILD, k, { value: v, writable: true, configurable: true, enumerable: true }); } });
  const faul = (ziel, k, f) => Object.defineProperty(ziel, k, { configurable: true, enumerable: true, get() { const v = f(); Object.defineProperty(ziel, k, { value: v, writable: true, configurable: true, enumerable: true }); return v; }, set(v) { Object.defineProperty(ziel, k, { value: v, writable: true, configurable: true, enumerable: true }); } });
  const W = NEUE_GRAFIK.WEHR, mal = l => l.map(f => neuBild(f(), NEU_BAU_MASS));
  const stehend = k => { const P2 = NEUE_GRAFIK.LEUTE_FIGUREN[k], q = P2.vorne(4).bild('tag'), c = document.createElement('canvas'); c.width = 84; c.height = 116; c.getContext('2d').drawImage(q, 0, 0); const b2 = bild(c); b2.w *= NEU_MASS.figur * P2.mass; b2.h *= NEU_MASS.figur * P2.mass; return b2; };
  for (const [k, wer] of [['hehler', 'kalle'], ['elster', 'flickerin'], ['tuersteher', 'bergmann'], ['hanne', 'hanne']]) faul(BILD, k, () => stehend(wer));
  ['gernot', 'junge', 'kalle', 'harnstedt', 'junge', 'haendler', 'lotte', 'bauer'].forEach((wer, i) => faul(BILD.bewohner, i, () => [stehend(wer)]));
  faul(BILD, 'bank', () => neuBild(NEUE_GRAFIK.BAUTEN.bank[0](), NEU_BAU_MASS)); faul(BILD, 'laterne', () => neuBild(NEUE_GRAFIK.BAUTEN.laterne[0](), NEU_BAU_MASS));
  faul(BILD, 'palisade', () => mal(W.palisade)); faul(BILD, 'stachelreiter', () => mal(W.stachelreiter));
  BILD.tor = {}; faul(BILD.tor, 'barrikade', () => mal(W.tor.barrikade)); faul(BILD.tor, 'palisade', () => mal(W.tor.palisade));
  for (const k of ['schuh', 'lumpen', 'dose', 'knochen']) faul(BILD.schrott, k, () => neuBild(NEUE_GRAFIK.zeichneSchrott(k), NEU_MASS.figur * .7));
  // Symbole: Sie bleiben im Menü gleich groß, darum behalten sie das Maß der alten Bilder
  for (const art in NEUE_GRAFIK.SYMBOLE) for (const k of Object.keys(BILD[art])) { const alt = BILD[art][k]; faul(BILD[art], k, () => { const b = bild(NEUE_GRAFIK.SYMBOLE[art](k).bild('tag')); b.w = alt.w; b.h = alt.h; return b; }); }
  BILD.bauwerk = {}; for (const [k, f] of [['bolzen', 'zeichneBolzenwerfer'], ['moerser', 'zeichneMoerser'], ['pfahlwall', 'zeichnePfahlwall']]) faul(BILD.bauwerk, k, () => neuBild(NEUE_GRAFIK[f](), NEU_MASS.figur));
  faul(BILD, 'helferbot', () => { const a = neuBild(NEUE_GRAFIK.zeichneWartungsbot(0), NEU_MASS.figur), b = neuBild(NEUE_GRAFIK.zeichneWartungsbot(1), NEU_MASS.figur); return { stand: a, stand2: a, lauf1: b, lauf2: a, lauf3: b, hieb: b }; });
  faul(BILD, 'anselmFigur', () => stehend('anselm'));
  for (const e of ['metall', 'eis', 'feuer', 'blitz']) { faul(BILD.kleingolem, e, () => golemSatz(e, 1)); faul(BILD.riesengolem, e, () => golemSatz(e, 1.6)); }
  { const farbe = { feuer: 'glut', eis: 'glas', blitz: 'gelb', metall: 'stahl' }; for (const el in BILD.elementturm) faul(BILD.elementturm, el, () => [0, 1].map(f => neuBild(NEUE_GRAFIK.zeichneLaziTurm(farbe[el] || 'lazi', f), NEU_MASS.figur))); }
  // Was noch nicht neu gezeichnet ist, steht wenigstens im richtigen Größenverhältnis zu den neuen Figuren
  const groesser = b => { if (!b) return; if (Array.isArray(b)) b.forEach(groesser); else if (b.w) { b.w *= 2; b.h *= 2; } else if (typeof b === 'object') Object.values(b).forEach(groesser); };
  [].forEach(k => groesser(BILD[k]));
  // Begleiter: dieselben Posen wie früher, dazu die Ansichten von vorn und hinten
  const posen = F => { const v = neuAnsichten(F, NEU_MASS.figur * .95), s = v.seite; const st = s.stand(); return { stand: st, stand2: st, lauf1: s[0], lauf2: s[1], lauf3: s[2], get hieb() { return v.schlag ? v.schlag[1] : s[0]; }, get hiebOben() { return v.schlag ? v.schlag[1] : s[2]; }, get laden() { return v.schlag ? v.schlag[0] : st; }, rolle: s[1], neu: v }; };
  const FF = { soldat: NEUE_GRAFIK.GEGNER_FIGUREN.soldat, schatten: F.schatten, beschwoerer: F.beschwoerer, architekt: F.architekt };
  faul(BILD, 'soldat', () => posen(FF.soldat));
  for (const art in BEGLEITER) { const k = BEGLEITER[art].bild[0]; if (FF[k]) faul(BILD.begleiter, art, () => posen(FF[k])); }
  neuLadezeit = Math.round(performance.now() - beginn);
}
// Im Dorf sind Gebäude doppelt so groß wie in Missionen. Wege bleiben ein Block.
function dorfbauBilder() {
  BILD.dorfbau = {};
  for (const t in BILD.gebaeude) BILD.dorfbau[t] = t === 'weg' ? BILD.gebaeude[t] : BILD.gebaeude[t].map(b => Object.assign({}, b, { w: b.w * 2, h: b.h * 2 }));
  if (neueGrafik()) { const h = BILD.gebaeude.wohnhaus[0], d = Object.assign({}, h, { w: h.w / NEU_MASS.haus * NEU_BAU_MASS, h: h.h / NEU_MASS.haus * NEU_BAU_MASS }); BILD.dorfbau.wohnhaus = [d, d, d]; }
}
const NEU_HELD = {}, NEU_HELD_BEWEGUNG = {};
// Jeder Held hat eigene Schlag- und Rollbilder. Sie entstehen mit der ersten Bewegung und bleiben.
function neuHeldBewegung(k) {
  const n = k === 'ritter' ? 'held' : k;
  if (NEU_HELD_BEWEGUNG[n]) return NEU_HELD_BEWEGUNG[n];
  const q = NEUE_GRAFIK.heldBewegung(n), r = {}; for (const a in q) r[a] = q[a].map(f => neuBild(f(), NEU_MASS.figur));
  return NEU_HELD_BEWEGUNG[n] = r;
}
// Der Held wird vor dem Start fertig gemalt: Er ist immer zu sehen, ein Ruck beim ersten Drehen fiele sofort auf
function neuHeldVorladen(k) { const v = neuHeld(k); for (const a of ['vorne', 'hinten', 'seite']) void v[a].stand(); for (const a of NEUE_GRAFIK.SCHRAEG_ANSICHTEN) for (let i = 0; i < 5; i++) { const b = v[a].hol(i); if (szene.userData.licht) void b.licht; } neuHeldBewegung(k); }
function neuHeld(k) { return NEU_HELD[k] || (NEU_HELD[k] = neuAnsichten(NEUE_GRAFIK.FIGUREN[k === 'ritter' ? 'held' : k], NEU_MASS.figur)); }
// Die Leute im Dorf: Ihre Bilder entstehen erst, wenn jemand sie braucht. Im Dorf gibt es kein echtes Licht, also reichen einfache Bilder.
// Eine Figur sind fünfzehn Bilder: je Ansicht vier Schritte und die Standpose. Je Aufruf entsteht nur eins, sonst stockt das Dorf auf dem Handy. Fertig: die Bilder, sonst null.
// Gebäude im Dorf entstehen erst, wenn sie gebaut sind: Alle beim Start zu malen, dauerte auf dem Handy zu lange
const NEU_BAU = {}, NEU_BAU_MASS = .019 / PX, NEU_LEUTE_MASS = .0195 / PX;
function neuerBau(typ, i) {
  const liste = neueGrafik() && NEUE_GRAFIK.BAUTEN[typ];
  if (!liste) return null;
  const k = typ + ':' + Math.min(i, liste.length - 1);
  if (!NEU_BAU[k]) { const b = bild(liste[Math.min(i, liste.length - 1)]().bild('tag')); b.w *= NEU_BAU_MASS; b.h *= NEU_BAU_MASS; NEU_BAU[k] = b; }
  return NEU_BAU[k];
}
// Wo der Kamin im Bild steht: Abstand zur Mitte und Höhe in Einheiten
const NEU_RAUCH = { wohnhaus: [1.3, 6.02], steinhaus: [1.47, 5.81], schmiede: [-1.27, 5.75], wirtshaus: [2.44, 7.55], koehlerei: [-.6, 1.8], holzfaeller: [1.08, 5.49], baeckerei: [-1.05, 5.68], kaserne: [-1.79, 4.85], archiv: [1.53, 4.91], labor: [-2.87, 4.33], rathaus: [2.0, 6.4] };
// Figuren im Kampf neben dem Helden: Von vorn und hinten nach der Laufrichtung, beim Schlagen von der Seite
function neuPosenBild(v, q, pose) {
  if (!q.neu) return q[pose];
  const a = neuAnsicht(v);
  if (v.hiebT > 0) return q[pose];
  const l = q.neu[a] || q.neu.seite, i = Math.floor((v.weg || 0) / .45) % 4;
  neuNachmalen();
  if (l.hat) return neuBildOder(l, v.bewegt ? i : 4, q.stand);
  return v.bewegt ? l[i] : l.stand();
}
function neuBlick(v, ohne = v.blick) { if (!v.ansicht) return ohne; if (v.hiebT > 0) return v.blick; if (v.ansicht === 'seite') return v.bewegt && v.drehBlick && !v.laedt && !v.zielen && !(v.angriffCd > 0) ? v.drehBlick : v.blick; return v.ansicht === 'vorne' || v.ansicht === 'hinten' ? 1 : v.schraegBlick || v.blick; }
// Porträt aus derselben Zeichnung wie die Figur: Kopf und Schultern
const NEU_PORTRAIT = {};
function neuesPortrait(c, wer) {
  const F = wer === 'fuchs' ? NEUE_GRAFIK.GEGNER_FIGUREN.dieb : wer === '@held' ? NEUE_GRAFIK.FIGUREN[bildKlasse(SPIEL.klasse) === 'ritter' ? 'held' : bildKlasse(SPIEL.klasse)] : NEUE_GRAFIK.LEUTE_FIGUREN[wer];
  if (!F) return false;
  const k = wer === '@held' ? wer + SPIEL.klasse : wer, b = NEU_PORTRAIT[k] || (NEU_PORTRAIT[k] = F.vorne(F === NEUE_GRAFIK.LEUTE_FIGUREN[wer] ? 4 : 1).bild('tag'));
  c.width = 40; c.height = 60; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0a0812'; g.fillRect(0, 0, 40, 60);
  const art = wer === '@held' ? SPIEL.klasse : wer === 'hanne' ? 'rostbrecher' : wer === 'anselm' ? 'bestehende' : wer === 'fuchs' ? 'pluenderer' : 'dorf';
  const farbe = { dorf: '150,112,50', bestehende: '40,150,150', rostbrecher: '170,84,40', pluenderer: '120,36,40', schwert: '110,120,140', beschwoerer: '40,150,150', architekt: '170,120,50', schatten: '90,60,130' }[art]; g.fillStyle = 'rgba(' + farbe + ',.35)'; g.fillRect(0, 0, 40, 60); g.strokeStyle = 'rgba(' + farbe + ',.7)'; wappenMalen(g, art, 20, 18, 26); g.imageSmoothingEnabled = false;
  g.drawImage(b, 22, 0, 40, 60, 0, 2, 40, 60);
  return true;
}
// Ein Bild in eine feste Fläche einpassen, ohne zu verzerren
function bildEinpassen(c, q) { const g = c.getContext('2d'), k = Math.min(c.width / q.width, c.height / q.height); g.imageSmoothingEnabled = false; g.drawImage(q, (c.width - q.width * k) / 2, c.height - q.height * k, q.width * k, q.height * k); }
// Die neuen Bilder sind größer als die alten. Was sich hier ändert: Hohes südlich vom Spielfeld rückt so weit weg, dass es niemanden verdeckt,
// und breite Hindernisse bekommen zusätzliche Kreise, damit man nicht durch sie hindurchläuft.
function dekoPlatz(b, x, z, r) {
  if (!neueGrafik()) return z;
  if (r && (b === BILD.barrikade || BILD.autowrack.includes(b))) { const d = b === BILD.barrikade ? 1.2 : 1.4, q = b === BILD.barrikade ? 0.6 : 0.8; HINDERNISSE.push({ x: x - d, z, r: q }, { x: x + d, z, r: q }); }
  const h = b.h * PX / 0.819;
  if (!r && b.h * PX > 3.5 && z > 0 && FELD && !FELD.korridor && (typeof MIS === 'undefined' || !MIS || MIS.ort !== 'markt') && Math.abs(x) < FELD.x + 3 && z - h < FELD.zMax) return FELD.zMax + h + 0.2;
  return z;
}
// Gebäude in Missionen: dieselbe Zeichnung wie im Dorf
function missionBau(t, i = 0) { return neuerBau(t, i) || BILD.gebaeude[t][i]; }
const NEU_LEUTE = {};
function neuePersonWeiter(k) {
  const v = NEU_LEUTE[k] || (NEU_LEUTE[k] = { vorne: [], hinten: [], seite: [], schraegV: [], schraegH: [] });
  const a = ['vorne', 'hinten', 'seite', 'schraegV', 'schraegH'].find(n => v[n].length < 5);
  if (!a) return v;
  const F = NEUE_GRAFIK.LEUTE_FIGUREN[k], b = bild(F[a](v[a].length).bild('tag')), mass = NEU_LEUTE_MASS * F.mass;
  b.w *= mass; b.h *= mass; v[a].push(b);
  return null;
}
// Wohin bewegt sich etwas? Danach richtet sich die Ansicht. Wer steht, behält die letzte.
const DREH_RING = [['seite', 1], ['schraegV', 1], ['vorne', 1], ['schraegV', -1], ['seite', -1], ['schraegH', -1], ['hinten', 1], ['schraegH', 1]], DREH_TAKT = 45, BILD_FLACH = Math.sin(NEIGUNG);
function ringStelle(o) { const a = o.ansicht || 'vorne', s = (a === 'seite' ? o.stillBlick || o.blick : o.schraegBlick || o.blick || 1) < 0 ? -1 : 1; return a === 'vorne' ? 2 : a === 'hinten' ? 6 : a === 'seite' ? (s > 0 ? 0 : 4) : a === 'schraegV' ? (s > 0 ? 1 : 3) : (s > 0 ? 7 : 5); }
function neuAnsicht(o, sofort) {
  const dx = o.x - (o.altX === undefined ? o.x : o.altX), dz = o.z - (o.altZ === undefined ? o.z : o.altZ), jetzt = performance.now();
  o.altX = o.x; o.altZ = o.z;
  if (o.bewegt) o.weg = (o.weg || 0) + Math.hypot(dx, dz * BILD_FLACH);   // Die Schritte richten sich nach dem Weg auf dem Bild: Gleiches Tempo, gleicher Takt, kein Rutschen
  if ((o.bewegt || sofort) && (Math.abs(dx) > 0.002 || Math.abs(dz) > 0.002)) {
    if (o.ringI === undefined || DREH_RING[o.ringI][0] !== o.ansicht) o.ringI = ringStelle(o);
    o.stillBlick = null;
    const w = Math.atan2(dz, dx), soll = ((Math.round(w / (Math.PI / 4)) % 8) + 8) % 8, ab = ((soll - o.ringI + 12) % 8) - 4;
    // Etwas Spielraum um die aktuelle Richtung, sonst flackert das Bild auf dem Stick. Gedreht wird Schritt für Schritt über die Zwischenrichtungen.
    let rest = w - o.ringI * Math.PI / 4; rest = Math.atan2(Math.sin(rest), Math.cos(rest));
    if (sofort || !o.ansicht) o.ringI = soll;
    else if (Math.abs(rest) > Math.PI / 8 + 0.12 && jetzt - (o.ringSeit || 0) >= DREH_TAKT) { const dreh = Math.abs(ab) === 4 ? (((2 - o.ringI + 8) % 8) <= 4 ? 1 : -1) : ab < 0 ? -1 : 1; o.ringI = (o.ringI + dreh + 8) % 8; o.ringSeit = jetzt; }
    const [a, s] = DREH_RING[o.ringI]; o.ansicht = a; o.drehBlick = s; if (a === 'schraegV' || a === 'schraegH') o.schraegBlick = s;
  } else if (!o.bewegt) { o.ringI = undefined; o.stillBlick = o.blick; }
  return o.ansicht || 'vorne';
}
// Beim Schlagen zeigt der Held sich von der Seite, in Schlagrichtung. Eigene Schlagbilder kommen später.
function neuHeldBild(p, k) {
  const v = neuHeld(k), q = neuHeldBewegung(k);
  neuAnsicht(p);
  if (p.rolleT > 0) { p.ansicht = 'seite'; return q.rolle[Math.min(3, Math.floor((1 - p.rolleT / CFG.rolle.dauer) * 4))]; }
  if (p.hiebT > 0) { p.ansicht = 'seite'; if (p.hiebT > (p.hiebAlt || 0)) p.hiebMax = p.hiebT; p.hiebAlt = p.hiebT; return (p.combo === 1 ? q.hiebOben : q.hieb)[Math.min(2, Math.floor((1 - p.hiebT / p.hiebMax) * 3))]; }
  p.hiebAlt = 0;
  const l = v[p.ansicht || 'vorne'] || v.seite;
  return p.bewegt ? l[Math.floor((p.weg || 0) / .55) % 4] : l.stand();
}
function neuGegnerBild(e, b) {
  if (!b.neu) return b;
  neuNachmalen();
  // Ausholen, dann kurz der Schlag selbst: Der Gegner dreht sich dafür zur Seite
  if (b.neu.schlag) {
    const holt = e.zustand === 'ausholen' || e.zustand === 'zuenden', jetzt = performance.now();
    if (holt) e.holte = true; else if (e.holte) { e.holte = false; e.schlagBis = jetzt + 200; }
    if (holt || jetzt < (e.schlagBis || 0)) { e.ansicht = 'seite'; e.altX = e.x; e.altZ = e.z; return neuBildOder(b.neu.schlag, holt ? 0 : 1, b); }
  }
  const a = neuAnsicht(e);
  if (a === 'seite') return b;
  if (!b.neu[a]) { e.ansicht = 'seite'; return b; }   // Wölfe und Maschinen haben keine schräge Ansicht
  const l = b.neu[a], i = Math.floor((e.weg || 0) / .45) % 4;
  if (l.hat) return neuBildOder(l, e.bewegt ? i : 4, b);
  return e.bewegt ? l[i] : l.stand();
}
// ---------- Stufe hoch: echtes Licht in Szenen, die dafür gebaut sind ----------
const NEU_FLAECHE = new THREE.PlaneGeometry(1, 1); NEU_FLAECHE.translate(0, 0.5, 0); NEU_FLAECHE.geteilt = true;
function lichtFigur(b, schattenRadius) {
  const k = b.licht.r;
  const mat = new THREE.MeshStandardMaterial({ map: k.map, normalMap: k.normal, normalScale: new THREE.Vector2(1.4, 1.4), emissiveMap: k.leuchten, emissive: 0xffffff, emissiveIntensity: 0.85, alphaTest: 0.5, roughness: 0.74, side: THREE.DoubleSide });
  const s = new THREE.Mesh(NEU_FLAECHE, mat);
  s.rotation.x = -NEIGUNG;
  if (b.wind) windAn(mat, b, true);
  s.center = { set() {} };   // Sprites haben einen Ankerpunkt, diese Fläche steht schon auf ihrem Fuß
  s.scale.set(b.w * PX, b.h * PX, 1);
  szene.add(s);
  let sh = null;
  if (schattenRadius) { sh = new THREE.Mesh(schattenGeo, schattenMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; sh.scale.set(schattenRadius, schattenRadius * 0.7, 1); szene.add(sh); }
  const o = { sprite: s, shadow: sh };
  if (b.h * PX < 3.2) o.schattenTafel = schattenTafel(b, s.position); else (szene.userData.baeume = szene.userData.baeume || []).push({ b, s });
  return o;
}
// Die sichtbare Tafel ist zur Kamera gekippt und würde falsche Schatten werfen. Den Schatten wirft eine unsichtbare aufrechte Fläche.
function schattenTafel(b, wo) {
  const q = new THREE.Mesh(NEU_FLAECHE, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  q.scale.set(b.w * PX, b.h * PX * Math.cos(NEIGUNG), 1); q.position.copy(wo); q.castShadow = true;
  q.material.side = THREE.DoubleSide;   // Sonst fällt nördlich vom Feuer kein Schatten: Einseitige Flächen werfen ihn nur in eine Richtung
  q.customDistanceMaterial = new THREE.MeshDistanceMaterial({ map: b.licht.r.map, alphaTest: 0.5, side: THREE.DoubleSide });
  szene.add(q);
  return q;
}
// Figuren: Je weiter vom Feuer, desto kürzer der Schatten, bis er ganz weg ist. So verschwindet und kommt er weich statt plötzlich.
function schattenWeich(o, b) {
  const t = o.schattenTafel; if (!t) return;
  const k = Math.max(0, Math.min(1, (10 - Math.hypot(t.position.x, t.position.z)) / 4));
  t.visible = k > 0.03; t.scale.x = b.w * PX; t.scale.y = b.h * PX * Math.cos(NEIGUNG) * k;
}
function lichtZeigen(o, b, blick, hell) {
  schattenWeich(o, b);
  const k = b.licht ? (blick < 0 ? b.licht.l : b.licht.r) : null, m = o.sprite.material;
  if (k && m.map !== k.map) { m.map = k.map; m.normalMap = k.normal; m.emissiveMap = k.leuchten; if (o.schattenTafel) o.schattenTafel.customDistanceMaterial.map = k.map; }
  else if (!k) m.map = blick < 0 ? b.l : b.r;
  o.sprite.scale.set(b.w * PX, b.h * PX, 1);
  m.color.setScalar(hell ? 2.4 : 1);
  if (o.schattenTafel) { o.schattenTafel.scale.set(b.w * PX, b.h * PX * Math.cos(NEIGUNG), 1); o.schattenTafel.visible = o.sprite.visible; }
}
// Boden der neuen Grafik: weiche Flecken statt harter Stufen, ausgefranste Übergänge bei Naturböden, Fugen bei gebauten Böden
const BODEN_WEICH = new Set(['gras', 'wald', 'erde', 'moos', 'pfad', 'weg', 'schutt', 'kies', 'kohle', 'altmetall', 'oel', 'hof']);
const BODEN_GLATT = new Set(['beton', 'asphalt', 'gehweg', 'halle', 'teppich', 'mauer', 'kern', 'kabel', 'gang']);
const BODEN_FLECK = new Set(['altmetall', 'kohle', 'oel']);
const BODEN_KANTE = new Set(['asphalt', 'gehweg', 'beton', 'gang', 'halle', 'pflaster', 'gasse', 'wasser']);
function fuge(a, b) { const d = Math.min(a - Math.floor(a), Math.ceil(a) - a) / b; return d < 1 ? 1 - d : 0; }
const BODEN_MUSTER = {
  dielen: (x, z, w) => { const reihe = Math.floor(z * 2), v = x + reihe * 1.7; return -1.7 * fuge(z * 2, .09) - 1.5 * fuge(v / 3, .02) + (w(reihe * 7.3, 3) - .5) * 1.2 + Math.sin(z * 37 + w(x * .9, reihe) * 9) * .22; },
  parkett: (x, z, w) => { const fx = Math.floor(x), fz = Math.floor(z), quer = (fx + fz) % 2 === 0, u = quer ? z : x, v = quer ? x : z; return -1.6 * Math.max(fuge(x, .03), fuge(z, .03)) - 1 * fuge(u * 3, .1) + (w(fx * 3.1 + Math.floor(u * 3) * 5, fz) - .5) * .9 + Math.sin(u * 30 + v * 2) * .1; },
  pflaster: (x, z, w) => { const r = Math.floor(z * 2.2), v = x * 2.2 + (r % 2) * .5; return -1.9 * Math.max(fuge(z * 2.2, .13), fuge(v, .12)) + (w(Math.floor(v) * 3.7, r * 2.1) - .5) * 1.5; },
  gasse: (x, z, w) => BODEN_MUSTER.pflaster(x, z, w),
  mauer: (x, z, w) => { const r = Math.floor(z * 2), v = x + (r % 2) * .5; return -1.7 * Math.max(fuge(z * 2, .1), fuge(v, .05)) + (w(Math.floor(v) * 2.3, r * 1.9) - .5) * 1.2; },
  beton: (x, z, w) => -1.1 * Math.max(fuge(x / 3, .012), fuge(z / 3, .012)) + (w(Math.floor(x / 3) * 4.1, Math.floor(z / 3) * 3.3) - .5) * .6,
  halle: (x, z, w) => { const fx = Math.floor(x / 2), fz = Math.floor(z / 2), rx = x / 2 - fx, rz = z / 2 - fz, ni = Math.hypot(Math.min(rx, 1 - rx), Math.min(rz, 1 - rz)) < .05; return -1.3 * Math.max(fuge(x / 2, .012), fuge(z / 2, .012)) + (ni ? 1.6 : 0) + (w(fx * 5.1, fz * 2.7) - .5) * .7; },
  asphalt: (x, z, w) => { const r = w(x * .8 + 20, z * .8); return Math.abs(r - .5) < .006 ? -1.8 : 0; },
  gehweg: (x, z, w) => -1.3 * Math.max(fuge(x, .03), fuge(z, .03)) + (w(Math.floor(x) * 3.1, Math.floor(z) * 4.3) - .5) * .7,
  teppich: (x, z) => (Math.floor(x * 16) + Math.floor(z * 16)) % 2 * .3,
  acker: x => Math.sin(x * 6.283) * .9,
  wasser: (x, z, w) => Math.sin(x * .8 + z * 5 + w(x * .5, z * .5) * 7) > .93 ? 2.2 : 0,
};
const BODEN_SPEICHER = new Map();
function neuBodenMalen(groesse, proEinheit, art, arten, seed) {
  const N = groesse * proEinheit, r = zufall(seed), half = groesse / 2;
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data;
  const pal = {}; for (const k in arten) pal[k] = arten[k].map(hexRgb);
  const tab = new Float32Array(65536); for (let i = 0; i < 65536; i++) tab[i] = r();
  const w = (x, y) => { const fx = Math.floor(x), fy = Math.floor(y); let u = x - fx, v = y - fy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); const a = fx & 255, b = (a + 1) & 255, e = (fy & 255) << 8, f = ((fy + 1) & 255) << 8; return tab[e | a] * (1 - u) * (1 - v) + tab[e | b] * u * (1 - v) + tab[f | a] * (1 - u) * v + tab[f | b] * u * v; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const S = proEinheit >> 1, B = Math.ceil(N / S) + 1, grob = new Array(B * B), gleich = new Uint8Array(B * B);
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) grob[y * B + x] = art(x * S / proEinheit - half, y * S / proEinheit - half);
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) { let ja = 1; for (let v = Math.max(0, y - 4); v <= Math.min(B - 1, y + 5) && ja; v++) for (let u = Math.max(0, x - 4); u <= Math.min(B - 1, x + 5); u++) if (grob[v * B + u] !== grob[y * B + x]) { ja = 0; break; } gleich[y * B + x] = ja; }
  const ergebnis = () => ({ c, g, N, toPx: v => Math.round((v + half) * proEinheit), r, artBei: (px, py) => art(px / proEinheit - half, py / proEinheit - half) });
  // Dieselbe Karte noch einmal: Der fertige Boden liegt im Speicher, der Start geht dann fast sofort. Höchstens drei Karten, damit das Handy nicht volläuft.
  let spur = 2166136261; for (let i = 0; i < grob.length; i++) { const s = grob[i]; spur = Math.imul(spur ^ s.charCodeAt(0) ^ (s.length << 8), 16777619); }
  const schluessel = seed + '|' + N + '|' + spur + '|' + JSON.stringify(arten), fertig = BODEN_SPEICHER.get(schluessel);
  if (fertig) { BODEN_SPEICHER.delete(schluessel); BODEN_SPEICHER.set(schluessel, fertig); g.putImageData(fertig, 0, 0); return ergebnis(); }
  // Die großen, weichen Flecken ändern sich über viele Pixel kaum: Sie werden nur auf jedem vierten Pixel berechnet und dazwischen gemittelt. Das spart beim Start einer Mission den größten Teil der Wartezeit.
  const R = 4, RB = Math.ceil(N / R) + 2, fleck = new Float32Array(RB * RB);
  for (let y = 0; y < RB; y++) for (let x = 0; x < RB; x++) { const ux = x * R / proEinheit - half, uz = y * R / proEinheit - half; fleck[y * RB + x] = (w(ux * .28, uz * .28) * .55 + w(ux * .9 + 9, uz * .9) * .3 + w(ux * 2.7, uz * 2.7 + 5) * .15 - .5) * 5; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ux = x / proEinheit - half, uz = y / proEinheit - half;
    const zelle = (y / S | 0) * B + (x / S | 0), nahe = !gleich[zelle];
    let k = nahe ? art(ux, uz) : grob[zelle];   // Mitten in einer gleichen Fläche steht die Bodenart schon fest
    // Naturböden: Der Übergang streut Pixel für Pixel über gut eine Einheit, statt als Kante abzubrechen
    if (nahe) { const dx = (w(ux * 1.5 + 40, uz * 1.5) - .5) * 1.1 + (w(ux * 5, uz * 5 + 70) - .5) * .5 + (r() - .5) * 1.5, dz = (w(ux * 1.5, uz * 1.5 + 90) - .5) * 1.1 + (w(ux * 5 + 30, uz * 5) - .5) * .5 + (r() - .5) * 1.5, k2 = art(ux + dx, uz + dz); if (BODEN_FLECK.has(k) || BODEN_FLECK.has(k2) || (BODEN_WEICH.has(k) && BODEN_WEICH.has(k2))) k = k2; }
    const p = pal[k], flach = BODEN_GLATT.has(k) ? .45 : 1, muster = BODEN_MUSTER[k];
    // Gebaute Böden enden an einer geraden Kante mit zwei Pixel Bordstein
    let bord = false;
    if (nahe && BODEN_KANTE.has(k)) { const e = 2 / proEinheit; for (const [ax, az] of [[e, 0], [-e, 0], [0, e], [0, -e]]) { const n2 = art(ux + ax, uz + az); if (n2 !== k && !(BODEN_KANTE.has(n2) && (k === 'beton' || n2 === 'beton'))) { bord = true; break; } } }
    const fx = x / R | 0, fy = y / R | 0, fu = (x & 3) / R, fv = (y & 3) / R, fo = fy * RB + fx;
    let t = (fleck[fo] * (1 - fu) * (1 - fv) + fleck[fo + 1] * fu * (1 - fv) + fleck[fo + RB] * (1 - fu) * fv + fleck[fo + RB + 1] * fu * fv) * flach;
    if (muster) t += muster(ux, uz, w);
    if (bord) t = -2.2;
    t += (BAYER[(y & 3) << 2 | (x & 3)] / 16 - .47) * .55 + (r() - .5) * .5 * flach;
    const n = r();
    let a = p[0], b = t < 0 ? p[2] : p[1], s = Math.abs(Math.round(t * 2.5) / 2.5);
    if (n > .985 && BODEN_WEICH.has(k)) { b = p[3]; s = 1; }
    const o = (y * N + x) * 4; d[o] = a[0] + (b[0] - a[0]) * s; d[o + 1] = a[1] + (b[1] - a[1]) * s; d[o + 2] = a[2] + (b[2] - a[2]) * s; d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  BODEN_SPEICHER.set(schluessel, img); if (BODEN_SPEICHER.size > 3) BODEN_SPEICHER.delete(BODEN_SPEICHER.keys().next().value);
  return ergebnis();
}
function bodenLichtMaterial(map) { return new THREE.MeshStandardMaterial({ map, roughness: 1 }); }
let neuFeuer = null;
function lichtAnschalten() {
  szene.add(new THREE.HemisphereLight(0x8fa6f0, 0x161c26, 0.62));
  neuFeuer = new THREE.PointLight(0xffd9a8, 3.4, 20, 1.5);
  neuFeuer.position.set(0, 6, 0.5); neuFeuer.castShadow = true; neuFeuer.shadow.mapSize.set(1024, 1024); neuFeuer.shadow.bias = -0.003; neuFeuer.shadow.camera.near = 0.15; neuFeuer.shadow.radius = 5;
  szene.add(neuFeuer);
  const auffuell = new THREE.DirectionalLight(0xdfe4ff, 0.2); auffuell.position.set(0, 40, 50); szene.add(auffuell);
  // Nahe Bäume werfen Schatten, ferne nicht: Das hält die Rechenlast klein
  (szene.userData.baeume || []).forEach(({ b, s }) => { const d = Math.hypot(s.position.x, s.position.z); if (d < 12) { const q = schattenTafel(b, s.position); q.scale.y *= Math.min(1, (12 - d) / 4); } });
}
// Wappen: Jede Gruppe im Spiel hat ihr Zeichen. Sie stehen hinter den Porträts und ganz schwach im Rand der Karten.
function wappenMalen(g, art, cx, cy, r) {
  g.save(); g.translate(cx, cy); g.scale(r / 50, r / 50); g.lineWidth = 10; g.lineJoin = 'round'; g.lineCap = 'round';
  const kreis = (a, q) => { g.beginPath(); g.arc(a, q, 44, 0, 7); g.stroke(); }, pfad = p => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  if (art === 'dorf') { pfad([[0, -44], [20, -12], [28, 14], [16, 34], [-16, 34], [-28, 14], [-20, -12]]); g.closePath(); g.stroke(); pfad([[0, -8], [11, 12], [0, 26], [-11, 12]]); g.closePath(); g.stroke(); pfad([[-38, 40], [38, 40]]); g.stroke(); }
  else if (art === 'bestehende') { kreis(0, 0); pfad([[-32, -12], [32, -12]]); g.stroke(); pfad([[0, -30], [0, 26]]); g.stroke(); pfad([[-14, 28], [14, 28]]); g.stroke(); for (const v of [-24, 24]) { pfad([[v, -12], [v - 11, 8], [v + 11, 8], [v, -12]]); g.stroke(); } }
  else if (art === 'rostbrecher') { for (let i = 0; i < 8; i++) { const w = i / 8 * 6.283; pfad([[Math.cos(w) * 30, Math.sin(w) * 30], [Math.cos(w) * 44, Math.sin(w) * 44]]); g.stroke(); } g.beginPath(); g.arc(0, 0, 28, 0, 7); g.stroke(); pfad([[-8, -28], [6, -6], [-6, 6], [8, 28]]); g.stroke(); }
  else if (art === 'pluenderer') { pfad([[-34, -36], [34, 36]]); g.stroke(); pfad([[34, -36], [-34, 36]]); g.stroke(); g.beginPath(); g.arc(0, -6, 18, 0, 7); g.stroke(); }
  else if (art === 'schwert') { pfad([[0, -44], [0, 24]]); g.stroke(); pfad([[-18, 18], [18, 18]]); g.stroke(); pfad([[0, 24], [0, 42]]); g.stroke(); }
  else if (art === 'beschwoerer') { kreis(0, 0); pfad([[0, -26], [18, 0], [0, 26], [-18, 0]]); g.closePath(); g.stroke(); }
  else if (art === 'architekt') { pfad([[-16, 42], [16, -16]]); g.stroke(); pfad([[-6, -36], [36, -12]]); g.lineWidth = 15; g.stroke(); }
  else if (art === 'schatten') { pfad([[-30, 40], [22, -36]]); g.stroke(); pfad([[30, 40], [-22, -36]]); g.stroke(); }
  g.restore();
}
function randGruppe(ort) { return { kraftwerk: 'bestehende', lazifabrik: 'bestehende', nullbunker: 'bestehende', finale: 'bestehende', stadt: 'rostbrecher', karawane: 'rostbrecher', lager: 'pluenderer', birkenstrasse: 'pluenderer' }[ort] || 'dorf'; }
const RAND_TEXTUR = {};
// Der Rand ist kein reines Schwarz mehr: fleckiges Grau, darin alle paar Meter ganz schwach das Wappen der Gegend
function randHintergrund(ort) {
  if (!neueGrafik()) return;
  const art = randGruppe(ort);
  if (!RAND_TEXTUR[art]) { const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.fillStyle = '#3a3c40'; g.fillRect(0, 0, n, n); const r = zufall(art.length * 31 + 5); for (let i = 0; i < 90; i++) { const x = r() * n, y = r() * n, q = 8 + r() * 26, t = r(), f = t < .5 ? '64,64,66' : t < .8 ? '46,46,48' : '84,84,86'; for (const [ax, ay] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { const v = g.createRadialGradient(x + ax, y + ay, 0, x + ax, y + ay, q); v.addColorStop(0, 'rgba(' + f + ',.55)'); v.addColorStop(1, 'rgba(' + f + ',0)'); g.fillStyle = v; g.fillRect(x + ax - q, y + ay - q, q * 2, q * 2); } } for (let i = 0; i < 500; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.14)' : 'rgba(110,110,120,.07)'; g.fillRect(Math.floor(r() * n / 2) * 2, Math.floor(r() * n / 2) * 2, 2, 2); } const x = textur(c); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(24, 24); x.geteilt = true; RAND_TEXTUR[art] = x; }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: RAND_TEXTUR[art] })); p.rotation.x = -Math.PI / 2; p.position.y = -0.05; szene.add(p); szene.background = new THREE.Color('#3a3c40');
}
// Rauch, Funken und Schein am Feuer: Weicher Rauch steigt auf, ein warmer Schein atmet mit den Flammen
const FEUER_RAUCH = []; let feuerRauchTakt = 0, feuerScheinBild = null, feuerRauchBild = null;
function feuerKreisBild(innen, aussen, n) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), v = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); v.addColorStop(0, innen); v.addColorStop(1, aussen); g.fillStyle = v; g.fillRect(0, 0, n, n); return new THREE.CanvasTexture(c); }
let weichesLichtBild = null;
function weichesLicht(m, mal = 1) {
  if (!neueGrafik()) return m;
  if (!weichesLichtBild) { const n = 128, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), v = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(.45, 'rgba(255,255,255,.55)'); v.addColorStop(.8, 'rgba(255,255,255,.1)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, n, n); weichesLichtBild = new THREE.CanvasTexture(c); }
  m.material.map = weichesLichtBild; m.material.transparent = true; m.material.needsUpdate = true; m.scale.multiplyScalar(mal);
  return m;
}
function feuerLeben(x, z, dt, stark) {
  if (!feuerRauchBild) { feuerRauchBild = [1, 2, 3].map(sd => { const n = 48, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); for (let i = 0; i < 9; i++) { const w = Math.sin(i * 12.9 + sd * 7) * 3.14, r = 5 + Math.abs(Math.sin(i * 3.3 + sd)) * 11, x = n / 2 + Math.cos(w) * (i ? 11 : 0), y = n / 2 + Math.sin(w) * (i ? 11 : 0), v = g.createRadialGradient(x, y, 0, x, y, r); v.addColorStop(0, 'rgba(226,210,180,.3)'); v.addColorStop(1, 'rgba(210,200,180,0)'); g.fillStyle = v; g.fillRect(0, 0, n, n); } return new THREE.CanvasTexture(c); }); } feuerScheinBild = feuerScheinBild || feuerKreisBild('rgba(255,170,70,.5)', 'rgba(255,120,40,0)', 64);
  for (let i = FEUER_RAUCH.length - 1; i >= 0; i--) { const r = FEUER_RAUCH[i]; if (r.s.parent !== szene) { r.s.material.dispose(); FEUER_RAUCH.splice(i, 1); continue; } r.t += dt; if (r.schein) { const q = 1 + Math.sin(performance.now() * .009) * .08 + Math.sin(performance.now() * .023) * .05; r.s.scale.set(r.g * q, r.g * q, 1); r.s.material.opacity = .42 * stark; r.t = 0; continue; } if (r.t > r.leben) { szene.remove(r.s); r.s.material.dispose(); FEUER_RAUCH.splice(i, 1); continue; } const a = r.t / r.leben; r.s.position.y += (r.funke ? 3.6 : 1.7) * dt; r.s.position.x += Math.sin(r.t * 2.4 + r.p) * dt * (r.funke ? 1.2 : .35) + (r.funke ? 0 : dt * .34); const gr = r.funke ? r.g : r.g * (1 + a * 3); r.s.scale.set(gr, gr, 1); r.s.material.opacity = r.funke ? 1 - a : (a < .15 ? a / .15 : 1 - (a - .15) / .85) * .42 * stark; }
  if (!FEUER_RAUCH.some(r => r.schein && r.x === x && r.z === z && r.s.parent === szene)) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: feuerScheinBild, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); s.renderOrder = 7; s.position.set(x, 1.1, z + .1); szene.add(s); FEUER_RAUCH.push({ s, t: 0, schein: true, x, z, g: 7.5 }); }
  feuerRauchTakt -= dt; if (feuerRauchTakt > 0) return; feuerRauchTakt = .16;
  const r = new THREE.Sprite(new THREE.SpriteMaterial({ map: feuerRauchBild[Math.floor(Math.random() * 3)], transparent: true, opacity: 0, depthWrite: false, depthTest: false })); r.renderOrder = 8; r.position.set(x + (Math.random() - .5) * .35, 3.4, z); szene.add(r); r.scale.set(.8, .8, 1); FEUER_RAUCH.push({ s: r, t: 0, leben: 4 + Math.random() * 2, g: .55 + Math.random() * .3, p: Math.random() * 6 });
  if (Math.random() < .55) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffe098, transparent: true, depthWrite: false, depthTest: false })); f.renderOrder = 11; f.position.set(x + (Math.random() - .5) * 1.2, 2.8, z); szene.add(f); f.scale.set(.04, .04, 1); FEUER_RAUCH.push({ s: f, t: 0, leben: 1.5 + Math.random() * 1.5, g: .04, p: Math.random() * 6, funke: true }); }
}
function lichtFlackern(t) { if (neuFeuer && szene.userData.licht) { neuFeuer.intensity = 3.4 + Math.sin(t * 9) * 0.28 + Math.sin(t * 23) * 0.12; neuFeuer.position.x = Math.sin(t * 7) * 0.1; } }

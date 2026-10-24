/**
 * verify-icons.cjs — Verifikator ikon NSI Level 2.
 *
 * Membandingkan ikon LAMA (acuan warna, `scripts/icons/reference/`) dengan
 * ikon BARU (`public/blocks/icon/`) secara BERDAMPINGAN di atas papan catur
 * magenta/hijau — bukan latar putih, supaya kotak/fringe putih langsung terlihat.
 *
 * Sekaligus mencetak:
 *   - alpha piksel sudut (harus 0,0,0,0 = transparan)
 *   - luminance & saturasi tiap ikon (harus dekat acuan)
 *
 * Prasyarat: dev server jalan di localhost:5173, Chrome automation port 9333,
 * dan SUDAH ADA 1 tab localhost:5173 (skrip memakai tab itu, tidak buka baru).
 *
 * Output: `_banding.png` di root (periksa manual, lalu hapus).
 */
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const REF_DIR = 'scripts/icons/reference';
const NAMES = [
  'helm', 'legendary_chest', 'epic_chest', 'rare_chest', 'uncommon_chest',
  'common_chest', 'small_treasure', 'medium_treasure', 'big_treasure',
  'pine_tree', 'trophy_1st', 'trophy_2nd', 'trophy_3rd',
];

const T = ms => new Promise(r => setTimeout(r, ms));

const pickTab = () => new Promise((res, rej) => {
  http.get('http://127.0.0.1:9333/json/list', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => {
      const ts = JSON.parse(d).filter(x => x.type === 'page' && /localhost:5173/.test(x.url));
      if (!ts.length) return rej(new Error('tidak ada tab localhost:5173 — buka dulu (1 tab saja)'));
      res(ts[0]);
    });
  }).on('error', rej);
});

// acuan dibaca dari disk → data URL (tidak perlu ikut ter-serve di public/)
const refDataUrl = (name) => {
  const p = path.join(REF_DIR, name + '.png');
  if (!fs.existsSync(p)) return null;
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
};

(async () => {
  const t = await pickTab();
  console.log('PAKAI TAB:', t.title, '|', t.url);

  const ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let id = 0; const pend = new Map();
  ws.on('message', m => { const o = JSON.parse(m); if (o.id && pend.has(o.id)) { pend.get(o.id)(o); pend.delete(o.id); } });
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await new Promise(r => ws.on('open', r));

  const ev = async (e, tmo = 90000) => {
    const r = await Promise.race([send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }), T(tmo).then(() => null)]);
    if (!r) throw new Error('EVAL_TIMEOUT');
    if (r.result && r.result.exceptionDetails) throw new Error('EVAL: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result.result.value;
  };

  const payload = NAMES.map(n => ({ name: n, ref: refDataUrl(n) }));

  // ── lembar kontak LAMA vs BARU + statistik ──
  const out = await ev(`(async () => {
    const items = ${JSON.stringify(payload)};
    const CELL = 150, PAD = 8, LBL = 16, LEFT = 92;
    const c = document.createElement('canvas');
    c.width = LEFT + 2*(CELL+PAD) + PAD;
    c.height = items.length*(CELL+PAD+LBL) + PAD + 20;
    const g = c.getContext('2d');
    g.fillStyle = '#1b1f27'; g.fillRect(0,0,c.width,c.height);

    const load = (src) => new Promise((ok,bad)=>{const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>bad(new Error('load')); i.src=src;});
    const stat = (img) => {
      const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height;
      const gg=cv.getContext('2d'); gg.clearRect(0,0,cv.width,cv.height); gg.drawImage(img,0,0);
      const d=gg.getImageData(0,0,cv.width,cv.height).data;
      let L=0,S=0,N=0;
      for(let i=0;i<d.length;i+=4){
        if(d[i+3]<200) continue;
        const r=d[i]/255,gr=d[i+1]/255,b=d[i+2]/255;
        const mx=Math.max(r,gr,b), mn=Math.min(r,gr,b);
        L+=0.2126*r+0.7152*gr+0.0722*b; S+=(mx===0?0:(mx-mn)/mx); N++;
      }
      return {L:L/N,S:S/N,N,corner:[d[0],d[1],d[2],d[3]]};
    };

    g.font='bold 12px monospace'; g.fillStyle='#fff'; g.textAlign='center';
    g.fillText('LAMA (acuan)', LEFT+CELL/2, 13);
    g.fillText('BARU', LEFT+CELL+PAD+CELL/2, 13);

    const rows=[];
    for (let i=0;i<items.length;i++){
      const it=items[i];
      const y = 20 + PAD + i*(CELL+PAD+LBL);
      g.font='11px monospace'; g.textAlign='left'; g.fillStyle='#8ef';
      g.fillText(it.name, 4, y+CELL/2);

      let refImg=null, newImg=null;
      if (it.ref) { try { refImg = await load(it.ref); } catch(e){} }
      try { newImg = await load('/blocks/icon/'+it.name+'.png'); } catch(e){}

      const cells=[[refImg,LEFT],[newImg,LEFT+CELL+PAD]];
      for (const [img,x] of cells){
        const sq=15;
        for(let yy=0;yy<CELL;yy+=sq) for(let xx=0;xx<CELL;xx+=sq){
          g.fillStyle=((xx/sq+yy/sq)%2===0)?'#c02060':'#20a060';
          g.fillRect(x+xx,y+yy,Math.min(sq,CELL-xx),Math.min(sq,CELL-yy));
        }
        if(img) g.drawImage(img,x,y,CELL,CELL);
        g.strokeStyle='#4ad'; g.lineWidth=1; g.strokeRect(x+0.5,y+0.5,CELL,CELL);
      }

      const a = refImg?stat(refImg):null, b = newImg?stat(newImg):null;
      rows.push({
        name: it.name,
        dL: (a&&b)?+(b.L-a.L).toFixed(3):null,
        dS: (a&&b)?+(b.S-a.S).toFixed(3):null,
        corner: b?b.corner:null,
        lum: b?+b.L.toFixed(3):null,
        sat: b?+b.S.toFixed(3):null,
      });
    }
    return { png: c.toDataURL('image/png'), rows };
  })()`);

  fs.writeFileSync('_banding.png', Buffer.from(String(out.png).split(',')[1], 'base64'));
  console.log('lembar kontak: _banding.png');

  console.log('\n' + 'ikon'.padEnd(17) + 'lum'.padEnd(8) + 'sat'.padEnd(8) + 'dL'.padEnd(9) + 'dS'.padEnd(9) + 'sudut (RGBA)');
  let bad = 0;
  for (const r of out.rows) {
    const alphaOk = r.corner && r.corner[3] === 0;
    const dOk = r.dL !== null && Math.abs(r.dL) <= 0.02 && Math.abs(r.dS) <= 0.03;
    if (!alphaOk || !dOk) bad++;
    console.log(
      r.name.padEnd(17) +
      String(r.lum).padEnd(8) + String(r.sat).padEnd(8) +
      String(r.dL).padEnd(9) + String(r.dS).padEnd(9) +
      JSON.stringify(r.corner) + (alphaOk ? '' : '  <-- TIDAK TRANSPARAN') + (dOk ? '' : '  <-- BEDA DARI ACUAN')
    );
  }
  console.log(`\n${out.rows.length - bad}/${out.rows.length} ikon LULUS (alpha transparan + warna dekat acuan)`);

  ws.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

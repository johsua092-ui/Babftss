/**
 * _genikon.cjs — Generator ikon NSI Level 2 (bab 205 — COCOK WARNA PER ITEM).
 *
 * ══ RIWAYAT KEGAGALAN (terukur, jangan diulang) ══
 * v1: metalness tanpa envMap → HITAM + terpotong (kamera r*3.05, FOV 30).
 * v2: latar PUTIH opaque → user tolak (ikon lain transparan).
 * v3: latar transparan, tapi ACES + RoomEnvironment + lampu 3x app
 *     → "putih pudar": lum 0.705 vs 0.556, sat 0.344 vs 0.497.
 *
 * ══ AKAR MASALAH (terukur) ══
 * ACES tone mapping + scene.environment (RoomEnvironment) MENCUCI saturasi:
 *   dengan env + ACES : sat 0.496
 *   tanpa env + ACES  : sat 0.668
 *   tanpa env, NoToneMapping, lampu naik : sat 0.767  ← dipakai
 *
 * ══ KENAPA MASIH DI-COCOKKAN PER ITEM ══
 * Satu setelan global tidak cukup: tiap material (gold envMap metalness 0.7,
 * kayu, dedaunan) bereaksi beda. Terukur dengan setelan global:
 *   helm       dL=+0.017 dS=-0.048  ✓
 *   trophy_3rd dL=+0.022 dS=+0.013  ✓
 *   pine_tree  dL=+0.187 dS=-0.150  ✗
 *   trophy_1st dL=+0.284 dS=+0.024  ✗
 * → tiap ikon di-grade (gain luminance + skala saturasi di HSV) supaya
 *   statistiknya sama dengan ikon LAMA item itu (_ikon_backup/), yang
 *   warnanya sudah disetujui user. Geometri tetap BARU.
 *
 * Output: public/blocks/icon/<slug>.png (RGBA transparan, ukuran asli)
 */
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const OUT_DIR = 'public/blocks/icon';
const BACKUP = 'scripts/icons/reference';   // acuan warna (13 ikon lama, di dalam repo)

const ITEMS = [
  ['helm', 256], ['legendary_chest', 256], ['epic_chest', 256],
  ['rare_chest', 256], ['uncommon_chest', 256], ['common_chest', 256],
  ['small_treasure', 256], ['medium_treasure', 256], ['big_treasure', 256],
  ['pine_tree', 256],
  ['trophy_1st', 128], ['trophy_2nd', 128], ['trophy_3rd', 128],
];

const pickTab = () => new Promise((res, rej) => {
  http.get('http://127.0.0.1:9333/json/list', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => {
      const ts = JSON.parse(d).filter(x => x.type === 'page' && /localhost:5173/.test(x.url));
      if (!ts.length) return rej(new Error('tidak ada tab localhost:5173'));
      res(ts[0]);
    });
  }).on('error', rej);
});

(async () => {
  const t = await pickTab();
  console.log('PAKAI TAB:', t.title);
  const ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let id = 0; const pend = new Map();
  ws.on('message', m => { const o = JSON.parse(m); if (o.id && pend.has(o.id)) { pend.get(o.id)(o); pend.delete(o.id); } });
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await new Promise(r => ws.on('open', r));
  const ev = async (e, tmo = 150000) => {
    const r = await Promise.race([send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }), new Promise(r2 => setTimeout(() => r2(null), tmo))]);
    if (!r) throw new Error('EVAL_TIMEOUT');
    if (r.result && r.result.exceptionDetails) throw new Error('EVAL: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return r.result.result.value;
  };

  // ── setup renderer + scene (setelan terkalibrasi) ──
  await ev(`(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const shapes = await import('/src/utils/blockShapes.js');
    const mats = await import('/src/utils/blockMaterials.js');
    const SZ = 640;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.setSize(SZ, SZ); renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);                 // LATAR TRANSPARAN
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;          // ACES mencuci warna
    try { mats.setGoldEnvRenderer(renderer); } catch(e) {}
    const scene = new THREE.Scene();
    scene.background = null;
    scene.environment = null;                            // RoomEnvironment mencuci warna
    const K = 2.7;                                       // intensitas terkalibrasi
    scene.add(new THREE.AmbientLight(0xffffff, K*0.55));
    const dl = new THREE.DirectionalLight(0xffffff, K); dl.position.set(5,10,7.5); scene.add(dl);
    scene.add(new THREE.HemisphereLight(0x4a6fa5, 0x1a1a2e, K*0.25));
    window.__GEN = { THREE, shapes, mats, renderer, scene };
    return 'ok';
  })()`);

  for (const [slug, size] of ITEMS) {
    // 1) render
    const res = await ev(`(async () => {
      const { THREE, shapes, mats, renderer, scene } = window.__GEN;
      const slug = ${JSON.stringify(slug)};
      for (let i=scene.children.length-1;i>=0;i--){const c=scene.children[i]; if(c.isMesh){scene.remove(c); if(c.geometry)c.geometry.dispose();}}
      let geo=null; try{geo=shapes.makeNsiGeometry(THREE,slug);}catch(e){geo=null;}
      if(!geo||!geo.attributes||!geo.attributes.position) return 'NO_GEO';
      geo.computeBoundingBox();
      const ctr=new THREE.Vector3(); geo.boundingBox.getCenter(ctr);
      geo.translate(-ctr.x,-ctr.y,-ctr.z);
      geo.computeBoundingBox(); const bb=geo.boundingBox;
      let mat=null; try{mat=mats.makeBlockMaterial(THREE,slug);}catch(e){mat=null;}
      if(!mat) mat=new THREE.MeshStandardMaterial({color:0xcccccc});
      if(geo.attributes&&geo.attributes.color) mat.vertexColors=true;
      mat.side=THREE.DoubleSide;
      scene.add(new THREE.Mesh(geo,mat));
      const t0=performance.now();
      while(performance.now()-t0<6000){const im=mat.map&&mat.map.image; if(im&&im.width>0)break; await new Promise(r=>setTimeout(r,60));}
      await new Promise(r=>setTimeout(r,120));
      const elev=THREE.MathUtils.degToRad(30), yaw=THREE.MathUtils.degToRad(25);
      const dir=new THREE.Vector3(Math.cos(elev)*Math.sin(yaw),Math.sin(elev),Math.cos(elev)*Math.cos(yaw)).normalize();
      const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.01,1000);
      cam.position.copy(dir.clone().multiplyScalar(50)); cam.lookAt(0,0,0); cam.updateMatrixWorld(true);
      const inv=cam.matrixWorldInverse;
      let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
      for(const sx of [bb.min.x,bb.max.x]) for(const sy of [bb.min.y,bb.max.y]) for(const sz of [bb.min.z,bb.max.z]){
        const v=new THREE.Vector3(sx,sy,sz).applyMatrix4(inv);
        mnX=Math.min(mnX,v.x);mxX=Math.max(mxX,v.x);mnY=Math.min(mnY,v.y);mxY=Math.max(mxY,v.y);
      }
      const cx=(mnX+mxX)/2, cy=(mnY+mxY)/2, half=Math.max(mxX-mnX,mxY-mnY)/2*1.16;
      cam.left=cx-half;cam.right=cx+half;cam.bottom=cy-half;cam.top=cy+half;
      cam.updateProjectionMatrix();
      renderer.clear(); renderer.render(scene,cam);
      return renderer.domElement.toDataURL('image/png');
    })()`);

    if (typeof res !== 'string' || !res.startsWith('data:image/png')) {
      console.log(`✗ ${slug}: ${String(res).slice(0,120)}`);
      continue;
    }

    // 2) resize + COCOKKAN warna ke ikon lama item yang sama
    const graded = await ev(`(async () => {
      const load = (src) => new Promise((ok,bad)=>{const i=new Image(); i.onload=()=>ok(i); i.onerror=bad; i.src=src;});
      const S = ${size};

      const statOf = (data, n) => {
        let L=0,Sat=0,N=0;
        for(let i=0;i<data.length;i+=4){
          if(data[i+3]<200) continue;
          const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
          const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
          L+=0.2126*r+0.7152*g+0.0722*b; Sat+=(mx===0?0:(mx-mn)/mx); N++;
        }
        return N? {L:L/N,S:Sat/N,N} : {L:0,S:0,N:0};
      };

      const raw = await load(${JSON.stringify(res)});
      const cv = document.createElement('canvas'); cv.width=S; cv.height=S;
      const g2 = cv.getContext('2d');
      g2.clearRect(0,0,S,S);
      g2.imageSmoothingQuality='high';
      g2.drawImage(raw,0,0,S,S);

      // target = ikon LAMA item ini (warna sudah disetujui user)
      let target = null;
      try {
        const old = await load('/${BACKUP}/${slug}.png');
        const oc = document.createElement('canvas'); oc.width=old.width; oc.height=old.height;
        const og = oc.getContext('2d'); og.clearRect(0,0,old.width,old.height); og.drawImage(old,0,0);
        target = statOf(og.getImageData(0,0,old.width,old.height).data, old.width*old.height);
      } catch(e) { target = null; }

      const cur = statOf(g2.getImageData(0,0,S,S).data, S*S);
      if (!target || !target.N || !cur.N) return { url: cv.toDataURL('image/png'), note:'TANPA_TARGET', cur };

      // ── TAHAP 1: samakan LUMINANCE (gain multiplikatif, 18 iterasi) ──
      // Diterapkan lebih dulu karena mengubah saturasi juga mengubah luminance.
      const applyGain = (gain) => {
        const img = g2.getImageData(0,0,S,S);
        const d = img.data;
        for (let i=0;i<d.length;i+=4){
          if (d[i+3]<10) continue;
          d[i]  = Math.max(0,Math.min(255, Math.round(d[i]*gain)));
          d[i+1]= Math.max(0,Math.min(255, Math.round(d[i+1]*gain)));
          d[i+2]= Math.max(0,Math.min(255, Math.round(d[i+2]*gain)));
        }
        g2.putImageData(img,0,0);
      };
      let L = cur.L;
      for (let it=0; it<18; it++){
        const err = target.L - L;
        if (Math.abs(err) < 0.006) break;
        // gain bertahap (damping 0.75) supaya tidak berosilasi
        const gain = Math.pow(target.L/Math.max(L,1e-4), 0.75);
        applyGain(gain);
        L = statOf(g2.getImageData(0,0,S,S).data, S*S).L;
      }

      // ── TAHAP 2: samakan SATURASI (HSV, hue tetap, 18 iterasi) ──
      const applySat = (satK) => {
        const img = g2.getImageData(0,0,S,S);
        const d = img.data;
        for (let i=0;i<d.length;i+=4){
          if (d[i+3]<10) continue;
          const r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255;
          const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
          const v=mx, delta=mx-mn;
          if (delta < 1e-6) continue;               // abu-abu: tidak ada hue
          const sOld = delta/mx;
          const sNew = Math.min(1, sOld*satK);
          const cNew = v*sNew;
          const ratio = cNew/delta;
          const base = v - cNew;
          d[i]   = Math.max(0,Math.min(255, Math.round((base + (r-mn)*ratio)*255)));
          d[i+1] = Math.max(0,Math.min(255, Math.round((base + (g-mn)*ratio)*255)));
          d[i+2] = Math.max(0,Math.min(255, Math.round((base + (b-mn)*ratio)*255)));
        }
        g2.putImageData(img,0,0);
      };
      let S2 = statOf(g2.getImageData(0,0,S,S).data, S*S).S;
      for (let it=0; it<18; it++){
        if (Math.abs(target.S - S2) < 0.008) break;
        const satK = Math.pow(target.S/Math.max(S2,1e-4), 0.75);
        applySat(satK);
        S2 = statOf(g2.getImageData(0,0,S,S).data, S*S).S;
      }

      // ── TAHAP 3: koreksi luminance sisa (sat tahap 2 sempat mengubahnya) ──
      for (let it=0; it<10; it++){
        const st = statOf(g2.getImageData(0,0,S,S).data, S*S);
        if (Math.abs(target.L - st.L) < 0.006) break;
        applyGain(Math.pow(target.L/Math.max(st.L,1e-4), 0.75));
      }

      const fin = statOf(g2.getImageData(0,0,S,S).data, S*S);
      return { url: cv.toDataURL('image/png'), target, fin, note:'OK' };
    })()`);

    if (!graded || !graded.url) { console.log(`✗ ${slug}: grade gagal`); continue; }
    fs.writeFileSync(`${OUT_DIR}/${slug}.png`, Buffer.from(String(graded.url).split(',')[1], 'base64'));
    const f = graded.fin || {}, tg = graded.target || {};
    console.log(`✓ ${slug.padEnd(16)} lum ${(f.L??0).toFixed(3)} (target ${(tg.L??0).toFixed(3)})  sat ${(f.S??0).toFixed(3)} (target ${(tg.S??0).toFixed(3)})`);
  }

  ws.close(); process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

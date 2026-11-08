// signText.js — bab 222: util teks NSI "Sign" (papan tanda interaktif).
// Teknik (Claude bab 222): CanvasTexture pada plane di depan papan; font
// bulat komik + fallback emoji; auto-fit mengecil; pecah per GRAPHEME
// (Intl.Segmenter) supaya emoji ZWJ/bendera tidak terpotong; batas 60.
// Material MeshBasicMaterial toneMapped:false (warna emoji tak pucat ACES).

export const SIGN_MAX_GRAPHEMES = 60;
export const SIGN_FONT_STACK =
  '"Comic Neue","Comic Sans MS","Chalkboard SE","Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",cursive';
// Area aman teks di kanvas: kubus sudut menutup tepi → teks di zona tengah
// (kubus mencapai ±1.5 studs dari pusat; plane 4 studs lebar → inset 12.5%).
const INSET_X = 0.14, INSET_Y = 0.12;
const CW = 1024, CH = 768;

function graphemes(str) {
  try {
    const seg = new Intl.Segmenter('id', { granularity: 'grapheme' });
    return [...seg.segment(str)].map((s) => s.segment);
  } catch (e) {
    return [...str];   // fallback browser lama
  }
}

export function signGraphemeCount(str) { return graphemes(String(str == null ? '' : str)).length; }

export function cleanSignText(raw) {
  const noCtrl = String(raw == null ? '' : raw)
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, '');
  const g = graphemes(noCtrl.trim()).slice(0, SIGN_MAX_GRAPHEMES).join('');
  return g.trim();
}

/**
 * makeSignTextPlane(THREE) — plane 2.0×1.5 block + canvas texture.
 * Kembalikan { plane, setSignText, dispose }.
 * Plane: transparent, depthWrite:false, toneMapped:false, polygonOffset
 * (anti z-fighting dengan papan), renderOrder 1, raycast OFF (klik lewat
 * ke proxy papan — bab 222 tabel jebakan Claude).
 */
// bab 222 (Claude P1-4): plane HIDUP JANGAN disimpan di userData —
// Object3D.clone()/JSON.stringify(userData) meledak (objek Three melingkar).
// Simpan di WeakMap (ter-hapus otomatis saat mesh dibuang GC).
const signPlanes = new WeakMap();
export function getSignPlaneOf(mesh) { return signPlanes.get(mesh) || null; }
export function setSignPlaneOf(mesh, sp) { if (sp) signPlanes.set(mesh, sp); else signPlanes.delete(mesh); }

export function makeSignTextPlane(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;

  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    toneMapped: false, fog: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    side: THREE.FrontSide,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), mat);
  plane.renderOrder = 1;
  plane.raycast = () => {};                // klik ditangani proxy papan
  plane.userData.isSignTextPlane = true;
  plane.visible = false;                   // sembunyi bila teks kosong

  function draw(text) {
    ctx.clearRect(0, 0, CW, CH);
    const g = graphemes(text);
    if (!g.length) { plane.visible = false; tex.needsUpdate = true; return; }
    plane.visible = true;
    // ── bab 222 ronde 3 (resep Claude): WORD-BOUNDARY wrap — jangan potong
    // kata di tengah; rata TENGAH.
    // ── bab 222 ronde 3 (FEEDBACK USER): teks WAJIB di zona TENGAH — TIDAK
    // boleh menabrak 4 kotak cokelat di pojok (kotak inner edge: x ±1.5 studs
    // dari 4.4 → 75% lebar kanvas; y ±1.0 dari 3.4 → 66.7% tinggi). Teks
    // panjang = font OTOMATIS MENYUSUT sampai muat di zona tengah ini.
    const maxW = CW * 0.75, maxH = CH * 0.667;
    const seg = new Intl.Segmenter('id', { granularity: 'grapheme' });
    const layout = (size) => {
      ctx.font = `bold ${size}px ${SIGN_FONT_STACK}`;
      const tokens = text.split(/(\s+)/).filter(Boolean);
      const lines = []; let cur = '';
      const fits = (s2) => ctx.measureText(s2).width <= maxW;
      for (const t of tokens) {
        if (/^\s+$/.test(t)) { cur += ' '; continue; }
        if (fits((cur + t).trimEnd())) { cur += t; continue; }
        if (cur.trim()) { lines.push(cur.trimEnd()); cur = ''; }
        if (fits(t)) { cur = t; continue; }
        let piece = '';
        for (const { segment } of seg.segment(t)) {
          if (!fits(piece + segment) && piece) { lines.push(piece); piece = ''; }
          piece += segment;
        }
        cur = piece;
      }
      if (cur.trim()) lines.push(cur.trimEnd());
      return lines;
    };
    // autofit: font terbesar yang muat tinggi TANPA memotong kata
    // + ATURAN ANTI-YATIM (bab 222 ronde 4, Claude): baris terakhir jangan
    //   yatim (emoji/1-2 karakter sendirian) — kecilkan font sekali lagi.
    let size = 190, lines = null;
    for (; size >= 40; size = Math.floor(size * 0.92)) {
      const ls = layout(size);
      const needsSplit = ls.some((l) => l.split(' ').some((w) => ctx.measureText(w).width > maxW));
      let orphan = false;
      if (ls.length > 1) {
        const last = ls[ls.length - 1].trim();
        orphan = [...seg.segment(last)].length <= 2;
      }
      if (ls.length * size * 1.15 <= maxH && !needsSplit && !orphan) { lines = ls; break; }
    }
    if (!lines) { lines = layout(40); }
    ctx.font = `bold ${size}px ${SIGN_FONT_STACK}`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';                 // rata TENGAH (koreksi Claude)
    ctx.textBaseline = 'middle';
    const lh = size * 1.15;
    const y0 = CH / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, CW / 2, y0 + i * lh));
    tex.needsUpdate = true;
  }

  function dispose() {
    tex.dispose();
    plane.geometry.dispose();
    mat.dispose();
  }

  return { plane, setSignText: draw, dispose };
}

/** Muat font sebelum menggambar (anti font-fallback pada gambar pertama). */
export function preloadSignFont() {
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`bold 100px ${SIGN_FONT_STACK}`).catch(() => {});
    }
  } catch (e) {}
}

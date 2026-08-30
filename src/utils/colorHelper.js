export function hexToRgbStr(hex) {
    const a = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return a ? `${parseInt(a[1],16)},${parseInt(a[2],16)},${parseInt(a[3],16)}` : "255,255,255";
}

// Ekstrak HUE dari warna hex (rumus standar RGB->HSL, cuma ambil komponen H).
// Dipakai supaya tiap item data yang sudah punya warna sendiri (gearData/linkageData)
// otomatis dapat palet top/bottom/lip standar MenuButton3D TANPA perlu didaftar manual satu-satu.
export function hexToHue(hex) {
    const a = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!a) return 210; // fallback biru kalau parsing gagal
    const r = parseInt(a[1], 16) / 255, g = parseInt(a[2], 16) / 255, b = parseInt(a[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const d = max - min;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return Math.round(h);
}

// Konversi 1 warna hex jadi 3-tone palet standar MenuButton3D (top/bottom/lip).
// Saturation & lightness FIXED ke nilai yang sudah divalidasi di standar desain (design.md
// Bagian "Standar Desain Menu Button") — cuma HUE yang ikut warna asli tiap item data.
//
// Match dengan props MenuButton3D.jsx versi terbaru: top (face bright), bottom (face dark),
// lip (border gelap). Bisa langsung di-spread: <MenuButton3D {...colors} />.
export function hexToMenuButtonColors(hex) {
    const h = hexToHue(hex);
    return {
        top: `hsl(${h}, 85%, 64%)`,
        bottom: `hsl(${h}, 85%, 42%)`,
        lip: `hsl(${h}, 85%, 28%)`,
    };
}

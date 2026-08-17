import { useRef, useEffect, useState, useCallback } from 'react';

/* ================================================================
   ColorWheelPicker — HSV color wheel + brightness slider
   Replicates the classic Windows color picker style but with
   modern dark theme styling matching the BABFTSS app.

   Props:
     hex: string         — current color in #rrggbb
     onChange: (hex) => void — called when color changes (preview only, no confirm)
     size?: number       — wheel diameter (default 180)
   ================================================================ */

// ── HSV ↔ Hex conversions ──
function hsvToRgb(h, s, v) {
  // h: 0-360, s: 0-1, v: 0-1
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * (((b - r) / d) + 2);
    else                h = 60 * (((r - g) / d) + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max]; // h: 0-360, s: 0-1, v: 0-1
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

function hsvToHex(h, s, v) {
  const [r, g, b] = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export default function ColorWheelPicker({ hex, onChange, size = 180 }) {
  const canvasRef = useRef(null);
  const brightnessRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'wheel' | 'brightness' | null

  // Derive HSV from hex prop
  const [r0, g0, b0] = hexToRgb(hex);
  const [hue, sat, val] = rgbToHsv(r0, g0, b0);

  const radius = size / 2;
  const innerRadius = radius * 0.05; // tiny hole in center

  // ── Draw the color wheel ──
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    // Draw HSV wheel pixel by pixel for accuracy
    const imageData = ctx.createImageData(size * dpr, size * dpr);
    const data = imageData.data;
    const cx = radius, cy = radius;

    for (let y = 0; y < size * dpr; y++) {
      for (let x = 0; x < size * dpr; x++) {
        const px = x / dpr;
        const py = y / dpr;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius && dist >= innerRadius) {
          // Calculate hue and saturation from position
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          // Rotate so red (0°) is at top
          angle = (angle + 90) % 360;

          const s = Math.min(1, dist / radius);
          const [r, g, b] = hsvToRgb(angle, s, val);

          const idx = (y * size * dpr + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        } else if (dist < innerRadius) {
          // White center
          const idx = (y * size * dpr + x) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Draw selection indicator
    const selAngle = ((hue - 90) % 360) * (Math.PI / 180);
    const selDist = sat * radius;
    const selX = cx + selDist * Math.cos(selAngle);
    const selY = cy + selDist * Math.sin(selAngle);

    ctx.beginPath();
    ctx.arc(selX, selY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(selX, selY, 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Outer ring border
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hue, sat, val, size, radius, innerRadius]);

  // ── Draw brightness slider ──
  const drawBrightness = useCallback(() => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = size, h = 16;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    // Gradient from black to full color
    const [fullR, fullG, fullB] = hsvToRgb(hue, sat, 1);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(1, rgbToHex(fullR, fullG, fullB));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.fill();

    // Value indicator
    const vx = val * w;
    ctx.beginPath();
    ctx.roundRect(vx - 3, 0, 6, h, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Border
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hue, sat, val, size]);

  useEffect(() => { drawWheel(); drawBrightness(); }, [drawWheel, drawBrightness]);

  // ── Wheel interaction ──
  const handleWheelPos = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const dx = px - radius;
    const dy = py - radius;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    angle = (angle + 90) % 360;
    const newSat = Math.min(1, dist / radius);
    const newHex = hsvToHex(angle, newSat, val);
    onChange(newHex);
  }, [radius, val, onChange]);

  const handleBrightnessPos = useCallback((clientX) => {
    const canvas = brightnessRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const newVal = Math.max(0, Math.min(1, px / rect.width));
    const newHex = hsvToHex(hue, sat, newVal);
    onChange(newHex);
  }, [hue, sat, onChange]);

  // ── Mouse handlers ──
  const onWheelMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging('wheel');
    handleWheelPos(e.clientX, e.clientY);
  }, [handleWheelPos]);

  const onBrightnessMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging('brightness');
    handleBrightnessPos(e.clientX);
  }, [handleBrightnessPos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (dragging === 'wheel') handleWheelPos(e.clientX, e.clientY);
      else if (dragging === 'brightness') handleBrightnessPos(e.clientX);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleWheelPos, handleBrightnessPos]);

  // ── Touch handlers (mobile) ──
  const onWheelTouchStart = useCallback((e) => {
    e.preventDefault();
    setDragging('wheel');
    const t = e.touches[0];
    handleWheelPos(t.clientX, t.clientY);
  }, [handleWheelPos]);

  const onBrightnessTouchStart = useCallback((e) => {
    e.preventDefault();
    setDragging('brightness');
    const t = e.touches[0];
    handleBrightnessPos(t.clientX);
  }, [handleBrightnessPos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const t = e.touches[0];
      if (!t) return;
      if (dragging === 'wheel') handleWheelPos(t.clientX, t.clientY);
      else if (dragging === 'brightness') handleBrightnessPos(t.clientX);
    };
    const onEnd = () => setDragging(null);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, handleWheelPos, handleBrightnessPos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Color wheel */}
      <canvas
        ref={canvasRef}
        onMouseDown={onWheelMouseDown}
        onTouchStart={onWheelTouchStart}
        style={{ cursor: 'crosshair', borderRadius: '50%' }}
      />
      {/* Brightness / Value slider */}
      <canvas
        ref={brightnessRef}
        onMouseDown={onBrightnessMouseDown}
        onTouchStart={onBrightnessTouchStart}
        style={{ cursor: 'pointer', borderRadius: 4, marginTop: 2 }}
      />
    </div>
  );
}

// Export helpers for use in parent components
export { hsvToHex, hexToRgb, rgbToHex, hsvToRgb, rgbToHsv };

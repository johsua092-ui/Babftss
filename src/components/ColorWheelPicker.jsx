import { useRef, useEffect, useState, useCallback } from 'react';

/* ================================================================
   ColorWheelPicker — Classic Windows-style color picker
   Color wheel (HSV) + 3 vertical HSV sliders + 3 horizontal RGB sliders
   + input fields + eyedropper + preview swatch

   Props:
     hex: string            — current color in #rrggbb
     onChange: (hex) => void — called on color change (preview only)
   ================================================================ */

// ── Color math ──
function hsvToRgb(h, s, v) {
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
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g-b)/d) % 6);
    else if (max === g) h = 60 * (((b-r)/d) + 2);
    else h = 60 * (((r-g)/d) + 4);
  }
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : d / max, max];
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [255,255,255];
}

function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(x => Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')).join('');
}

function hsvToHex(h, s, v) { return rgbToHex(...hsvToRgb(h, s, v)); }

// ── Styles ──
const BG = '#7b9cc2';
const LABEL = { fontSize: 14, fontWeight: 700, color: '#000', fontFamily: 'Arial,sans-serif' };
const INPUT = {
  width: 52, height: 26, fontSize: 14, fontWeight: 700, color: '#fff',
  background: '#555', border: '1px solid #000', borderRadius: 3, textAlign: 'center',
  fontFamily: 'Arial,sans-serif', padding: 0,
};
const SLIDER_H = 200;

// ── Vertical slider component (Hue, Sat, Val) ──
function VSlider({ gradient, value, maxVal, onChange, label, inputVal, onInputChange }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localVal, setLocalVal] = useState(String(inputVal));
  const [focused, setFocused] = useState(false);

  // Sync local value when parent changes and input is not focused
  useEffect(() => {
    if (!focused) setLocalVal(String(inputVal));
  }, [inputVal, focused]);

  const commitValue = useCallback(() => {
    const n = parseInt(localVal);
    if (!isNaN(n)) onInputChange(String(n));
    else setLocalVal(String(inputVal)); // revert if invalid
  }, [localVal, inputVal, onInputChange]);

  const draw = useCallback(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const trackW = 42, trackH = SLIDER_H;
    const totalW = trackW + 16; // extra space for triangle on right
    const totalH = trackH;
    c.width = totalW * dpr; c.height = totalH * dpr;
    c.style.width = totalW + 'px'; c.style.height = totalH + 'px';
    ctx.scale(dpr, dpr);

    // Track gradient
    const grad = ctx.createLinearGradient(0, 0, 0, trackH);
    gradient.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, trackW, trackH);

    // Border
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, trackW, trackH);

    // Triangle thumb (right side, tip pointing LEFT toward track)
    const norm = 1 - (value / maxVal);
    const ty = norm * trackH;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(trackW + 1, ty);          // tip: near track edge, pointing left
    ctx.lineTo(trackW + 14, ty - 7);     // base top (far from track)
    ctx.lineTo(trackW + 14, ty + 7);     // base bottom (far from track)
    ctx.closePath();
    ctx.fill();
  }, [gradient, value, maxVal]);

  useEffect(() => { draw(); }, [draw]);

  const handlePos = useCallback((clientY) => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const py = clientY - rect.top;
    const norm = 1 - Math.max(0, Math.min(1, py / rect.height));
    onChange(Math.round(norm * maxVal));
  }, [maxVal, onChange]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => handlePos(e.clientY);
    const onUp = () => setDrag(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [drag, handlePos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={LABEL}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <input
          type="text"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); commitValue(); }}
          onKeyDown={e => { if (e.key === 'Enter') { commitValue(); e.target.blur(); } }}
          style={INPUT}
        />
        <canvas
          ref={ref}
          onMouseDown={e => { e.preventDefault(); setDrag(true); handlePos(e.clientY); }}
          onTouchStart={e => { e.preventDefault(); setDrag(true); handlePos(e.touches[0].clientY); }}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}

// ── Horizontal slider component (Red, Green, Blue) ──
function HSlider({ color, value, onChange, label }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localVal, setLocalVal] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sync local value when parent changes and input is not focused
  useEffect(() => {
    if (!focused) setLocalVal(String(value));
  }, [value, focused]);

  const commitValue = useCallback(() => {
    const n = parseInt(localVal);
    if (!isNaN(n)) onChange(Math.max(0, Math.min(255, n)));
    else setLocalVal(String(value)); // revert if invalid
  }, [localVal, value, onChange]);

  const draw = useCallback(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const trackW = 180, trackH = 24;
    const totalW = trackW;
    const totalH = trackH + 14; // extra space for triangle below
    c.width = totalW * dpr; c.height = totalH * dpr;
    c.style.width = totalW + 'px'; c.style.height = totalH + 'px';
    ctx.scale(dpr, dpr);

    // Gradient from black to color
    const grad = ctx.createLinearGradient(0, 0, trackW, 0);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, trackW, trackH);

    // Border
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, trackW, trackH);

    // Triangle thumb (bottom, tip pointing UP toward track)
    const tx = (value / 255) * trackW;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(tx, trackH + 1);           // tip: near track bottom edge, pointing up
    ctx.lineTo(tx - 7, trackH + 12);      // base left (far below track)
    ctx.lineTo(tx + 7, trackH + 12);      // base right (far below track)
    ctx.closePath();
    ctx.fill();
  }, [color, value]);

  useEffect(() => { draw(); }, [draw]);

  const handlePos = useCallback((clientX) => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const px = clientX - rect.left;
    onChange(Math.round(Math.max(0, Math.min(1, px / rect.width)) * 255));
  }, [onChange]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => handlePos(e.clientX);
    const onUp = () => setDrag(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [drag, handlePos]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ ...LABEL, width: 52, textAlign: 'right' }}>{label}</span>
      <input
        type="text"
        value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commitValue(); }}
        onKeyDown={e => { if (e.key === 'Enter') { commitValue(); e.target.blur(); } }}
        style={INPUT}
      />
      <canvas
        ref={ref}
        onMouseDown={e => { e.preventDefault(); setDrag(true); handlePos(e.clientX); }}
        onTouchStart={e => { e.preventDefault(); setDrag(true); handlePos(e.touches[0].clientX); }}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}

// ── Main component ──
export default function ColorWheelPicker({ hex, onChange, onPickColor }) {
  const wheelRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hexInput, setHexInput] = useState(hex.toUpperCase());
  const [hexFocused, setHexFocused] = useState(false);

  // Sync hexInput when parent hex changes and input is not focused
  useEffect(() => {
    if (!hexFocused) setHexInput(hex.toUpperCase());
  }, [hex, hexFocused]);

  const [r0, g0, b0] = hexToRgb(hex);
  const [hue, sat, val] = rgbToHsv(r0, g0, b0);
  const WHEEL_SIZE = 280;
  const wheelR = WHEEL_SIZE / 2;

  // ── Draw color wheel ──
  const drawWheel = useCallback(() => {
    const canvas = wheelRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const s = WHEEL_SIZE;
    canvas.width = s * dpr; canvas.height = s * dpr;
    canvas.style.width = s + 'px'; canvas.style.height = s + 'px';
    ctx.scale(dpr, dpr);

    const imgData = ctx.createImageData(s * dpr, s * dpr);
    const data = imgData.data;
    const cx = wheelR, cy = wheelR;

    for (let y = 0; y < s * dpr; y++) {
      for (let x = 0; x < s * dpr; x++) {
        const px = x / dpr, py = y / dpr;
        const dx = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= wheelR) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          angle = (angle + 90) % 360; // Red at top
          const satAt = Math.min(1, dist / wheelR);
          // Wheel shows full brightness (V=1), saturation varies by distance
          const [r, g, b] = hsvToRgb(angle, satAt, 1);
          // Multiply by current value (brightness)
          const idx = (y * s * dpr + x) * 4;
          data[idx]   = Math.round(r * val);
          data[idx+1] = Math.round(g * val);
          data[idx+2] = Math.round(b * val);
          data[idx+3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Selection indicator
    const selAngle = ((hue - 90) % 360) * (Math.PI / 180);
    const selDist = sat * wheelR;
    const selX = cx + selDist * Math.cos(selAngle);
    const selY = cy + selDist * Math.sin(selAngle);

    // Hollow circle indicator
    ctx.beginPath();
    ctx.arc(selX, selY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(selX, selY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    // Outer border
    ctx.beginPath();
    ctx.arc(cx, cy, wheelR, 0, Math.PI * 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
  }, [hue, sat, val, wheelR]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  // ── Wheel interaction ──
  const handleWheelPos = useCallback((clientX, clientY) => {
    const c = wheelRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    const dx = px - wheelR, dy = py - wheelR;
    const dist = Math.min(Math.sqrt(dx*dx + dy*dy), wheelR);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    angle = (angle + 90) % 360;
    const newSat = Math.min(1, dist / wheelR);
    onChange(hsvToHex(angle, newSat, val));
  }, [wheelR, val, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => handleWheelPos(e.clientX, e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, handleWheelPos]);

  // ── HSV slider handlers ──
  const onHueChange = useCallback(v => onChange(hsvToHex(v, sat, val)), [sat, val, onChange]);
  const onSatChange = useCallback(v => onChange(hsvToHex(hue, v / 100, val)), [hue, val, onChange]);
  const onValChange = useCallback(v => onChange(hsvToHex(hue, sat, v / 100)), [hue, sat, onChange]);

  // ── RGB slider handlers ──
  const onRChange = useCallback(v => { const [_, g, b] = hexToRgb(hex); onChange(rgbToHex(v, g, b)); }, [hex, onChange]);
  const onGChange = useCallback(v => { const [r, _, b] = hexToRgb(hex); onChange(rgbToHex(r, v, b)); }, [hex, onChange]);
  const onBChange = useCallback(v => { const [r, g, _] = hexToRgb(hex); onChange(rgbToHex(r, g, v)); }, [hex, onChange]);

  // HSV input change handlers (accept typed values)
  const onHueInput = useCallback(v => { const n = parseInt(v); if (!isNaN(n)) onHueChange(Math.max(0, Math.min(360, n))); }, [onHueChange]);
  const onSatInput = useCallback(v => { const n = parseInt(v); if (!isNaN(n)) onSatChange(Math.max(0, Math.min(100, n))); }, [onSatChange]);
  const onValInput = useCallback(v => { const n = parseInt(v); if (!isNaN(n)) onValChange(Math.max(0, Math.min(100, n))); }, [onValChange]);

  // Hue slider gradient (rainbow top to bottom)
  const hueGrad = [
    [0, '#ff0000'], [0.17, '#ffff00'], [0.33, '#00ff00'],
    [0.5, '#00ffff'], [0.67, '#0000ff'], [0.83, '#ff00ff'], [1, '#ff0000'],
  ];
  // Sat slider gradient (white to full hue color)
  const [fullR, fullG, fullB] = hsvToRgb(hue, 1, val);
  const satGrad = [[0, rgbToHex(fullR, fullG, fullB)], [1, '#ffffff']];
  // Val slider gradient (black to full color)
  const [fullR2, fullG2, fullB2] = hsvToRgb(hue, sat, 1);
  const valGrad = [[0, rgbToHex(fullR2, fullG2, fullB2)], [1, '#000000']];

  return (
    <div style={{
      background: BG, border: '2px solid #fff', borderRadius: 0,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: 'inset 1px 1px 0 #4a5d75, inset -1px -1px 0 #4a5d75',
      fontFamily: 'Arial,sans-serif',
    }}>
      {/* Top row: Wheel + HSV sliders */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Color wheel */}
        <canvas
          ref={wheelRef}
          onMouseDown={e => { e.preventDefault(); setDragging(true); handleWheelPos(e.clientX, e.clientY); }}
          onTouchStart={e => { e.preventDefault(); setDragging(true); handleWheelPos(e.touches[0].clientX, e.touches[0].clientY); }}
          style={{ cursor: 'crosshair', borderRadius: '50%', flexShrink: 0 }}
        />
        {/* HSV vertical sliders */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <VSlider gradient={hueGrad} value={Math.round(hue)} maxVal={360} onChange={onHueChange}
            label="Color" inputVal={Math.round(hue)} onInputChange={onHueInput} />
          <VSlider gradient={satGrad} value={Math.round(sat * 100)} maxVal={100} onChange={onSatChange}
            label="Saturation" inputVal={Math.round(sat * 100)} onInputChange={onSatInput} />
          <VSlider gradient={valGrad} value={Math.round(val * 100)} maxVal={100} onChange={onValChange}
            label="Value" inputVal={Math.round(val * 100)} onInputChange={onValInput} />
        </div>
      </div>

      {/* Bottom row: RGB sliders + eyedropper area */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <HSlider color="#ff0000" value={r0} onChange={onRChange} label="Red:" />
          <HSlider color="#00ff00" value={g0} onChange={onGChange} label="Green:" />
          <HSlider color="#0000ff" value={b0} onChange={onBChange} label="Blue:" />
        </div>
        {/* Right side: [Color Picker] [Reset Color] [preview swatch + hex input] */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
          {/* Color Picker button with icon — triggers eyedropper via parent */}
          <button
            onClick={() => onPickColor && onPickColor()}
            onMouseEnter={e => e.currentTarget.style.background = '#5a7a99'}
            onMouseLeave={e => e.currentTarget.style.background = '#4a5d75'}
            style={{
              padding: '6px 8px', fontSize: 10, fontWeight: 700,
              color: '#fff', background: '#4a5d75', border: '1px solid #000',
              borderRadius: 4, cursor: 'pointer', fontFamily: 'Arial,sans-serif',
              textTransform: 'uppercase', letterSpacing: 0.5,
              lineHeight: 1.4, transition: 'background 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 3,
            }}
            title="Pick a color from the screen"
          >
            <img
              src="/color-picker-icon.png"
              alt="picker"
              style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
            Color<br/>Picker
          </button>
          {/* Reset Color button, stretches full height of right column */}
          <button
            onClick={() => onChange('#ffffff')}
            onMouseEnter={e => e.currentTarget.style.background = '#5a7a99'}
            onMouseLeave={e => e.currentTarget.style.background = '#4a5d75'}
            style={{
              padding: '6px 10px', fontSize: 10, fontWeight: 700,
              color: '#fff', background: '#4a5d75', border: '1px solid #000',
              borderRadius: 4, cursor: 'pointer', fontFamily: 'Arial,sans-serif',
              textTransform: 'uppercase', letterSpacing: 0.5,
              lineHeight: 1.4, transition: 'background 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 3,
            }}
            title="Reset color to white (center of wheel)"
          >
            {/* Eraser icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0l5 5c.8.8.8 2 0 2.8L11 20"/>
              <path d="M6 12l5 5"/>
            </svg>
            Reset<br/>Color
          </button>
          {/* Right column: preview swatch on top, hex input below */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              width: 80, height: 40, borderRadius: 6,
              background: hex, border: '2px solid #000',
              boxShadow: `0 0 12px ${hex}66`,
            }} />
            <input
              type="text"
              value={hexInput}
              onChange={e => setHexInput(e.target.value)}
              onFocus={() => setHexFocused(true)}
              onBlur={() => {
                setHexFocused(false);
                const v = hexInput.trim();
                if (/^#[0-9a-fA-F]{6}$/i.test(v)) onChange(v.toLowerCase());
                else setHexInput(hex.toUpperCase()); // revert if invalid
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = hexInput.trim();
                  if (/^#[0-9a-fA-F]{6}$/i.test(v)) onChange(v.toLowerCase());
                  else setHexInput(hex.toUpperCase());
                  e.target.blur();
                }
              }}
              style={{
                width: 80, height: 26, fontSize: 14, fontWeight: 700, color: '#fff',
                background: '#3a3a3a', border: hexFocused ? '1px solid #8cf' : '1px solid #888',
                borderRadius: 4,
                textAlign: 'center', fontFamily: 'monospace', padding: 0,
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { hsvToHex, hexToRgb, rgbToHex, hsvToRgb, rgbToHsv };

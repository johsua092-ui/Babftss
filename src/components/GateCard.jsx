import { useState } from 'react';
import GateDiagram from './GateDiagram';
import { computeGateOutput } from '../data/gateLogic';
import { hexToRgbStr } from '../utils/colorHelper';
import { Fragment } from 'react';

const getConfig = (gate, inputs) => {
  switch (gate.id) {
    case 'wire': return { title: '01  Basic Wire', desc: 'Meneruskan sinyal input tanpa perubahan. Ini adalah dasar dari penghubungan antar komponen dalam sirkuit digital.', inputs: ['A'], color: '#60a5fa' };
    case 'not': return { title: '02  NOT Gate', desc: 'Pembalik logika. Jika input TRUE maka output FALSE, dan sebaliknya. Simbolnya punya bubble kecil di output yang menandakan inversi.', inputs: ['A'], color: '#f87171' };
    case 'and': return { title: '03  AND Gate', desc: 'TRUE hanya kalau SEMUA input TRUE. Mirip gerbang "dan" dalam logika sehari-hari: harus kedua syarat terpenuhi.', inputs: ['A', 'B'], color: '#4ade80' };
    case 'nand': return { title: '04  NAND Gate', desc: 'Kebalikan dari AND. Output FALSE hanya kalau semua input TRUE. Disebut gerbang universal karena semua gerbang lain bisa dibangun dari NAND.', inputs: ['A', 'B'], color: '#fb923c' };
    case 'or': return { title: '05  OR Gate', desc: 'TRUE kalau minimal SATU input TRUE. Seperti pilihan: "mau kopi ATAU teh?" — cukup salah satu iya.', inputs: ['A', 'B'], color: '#3b82f6' };
    case 'nor': return { title: '06  NOR Gate', desc: 'Kebalikan dari OR. TRUE hanya kalau SEMUA input FALSE. Juga tergolong gerbang universal seperti NAND.', inputs: ['A', 'B'], color: '#a78bfa' };
    case 'xor': return { title: '07  XOR Gate', desc: 'TRUE kalau jumlah input TRUE-nya GANJIL. Untuk 2 input: TRUE hanya jika KEDUANYA BERBEDA.', inputs: ['A', 'B'], color: '#facc15' };
    case 'xnor': return { title: '08  XNOR Gate', desc: 'Kebalikan XOR. TRUE kalau jumlah input TRUE-nya GENAP. Untuk 2 input: TRUE hanya jika KEDUANYA SAMA.', inputs: ['A', 'B'], color: '#f472b6' };
    default: return { title: gate.displayName, desc: '', inputs: gate.truthTableHeaders?.filter(h => h !== 'OUT') || [], color: '#60a5fa' };
  }
};

const GateCard = ({ gate, colors }) => {
  const cfg = getConfig(gate, { A: 0, B: 0 });
  const [inputValues, setInputValues] = useState(() => {
    const initial = {};
    cfg.inputs.forEach(k => { initial[k] = 0; });
    return initial;
  });

  const toggle = (key) => {
    setInputValues(prev => ({ ...prev, [key]: prev[key] ? 0 : 1 }));
  };

  const out = computeGateOutput(gate.id, inputValues);
  const truthTable = gate.truthTable || [];
  const color = cfg.color;

  return (
    <div className="bg-[#0e1420] rounded-xl p-4 sm:p-5 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white/40 text-[10px] font-mono">{cfg.title}</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>

      {/* Diagram */}
      <div className="mb-3">
        <GateDiagram
          gateId={gate.id}
          inputs={inputValues}
          output={out}
          gateColor={color}
          inputLabels={cfg.inputs}
        />
      </div>

      {/* Input Toggles */}
      <div className="flex flex-wrap gap-2 mb-2">
        {cfg.inputs.map(k => (
          <button
            key={k}
            onClick={() => toggle(k)}
            className="px-3 py-1 rounded text-xs font-bold font-mono transition border"
            style={{
              color: inputValues[k] ? '#fff' : color,
              backgroundColor: inputValues[k] ? color : 'transparent',
              borderColor: color,
            }}
          >
            {k} = {inputValues[k]}
          </button>
        ))}
      </div>

      {/* Status Line */}
      <div className="text-xs font-mono mb-3" style={{ color }}>
        {cfg.inputs.map(k => `${k}=${inputValues[k]}`).join(', ')} → OUT={out}
      </div>

      {/* Description */}
      <p className="text-white/50 text-xs mb-3">{cfg.desc}</p>

      {/* Truth Table */}
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-white/30">
            {gate.truthTableHeaders?.map((h, i) => (
              <td key={i} className="px-1 py-0.5">{h}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {truthTable.map((row, ri) => {
            const match = cfg.inputs.every(k => row[k] === inputValues[k]);
            const highlightStyle = match
              ? { backgroundColor: color + '20', color }
              : { color: 'rgba(255,255,255,0.6)' };
            return (
              <tr key={ri}>
                {gate.truthTableHeaders?.map((h, ci) => (
                  <td key={ci} className="px-1 py-0.5" style={highlightStyle}>
                    {row[h]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GateCard;
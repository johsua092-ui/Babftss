import React from 'react'

function CircuitDiagram01({ color = "#3b82f6", size = 400 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 400 240" style={{ display: "block", margin: "0 auto" }}>
      {/* Input A label */}
      <text x="10" y="60" fill="#94a3b8" fontSize="14" fontWeight="600" fontFamily="system-ui, sans-serif">A</text>
      {/* Input B label */}
      <text x="10" y="180" fill="#94a3b8" fontSize="14" fontWeight="600" fontFamily="system-ui, sans-serif">B</text>

      {/* Input A line */}
      <line x1="28" y1="56" x2="80" y2="56" stroke="#94a3b8" strokeWidth="2" />

      {/* Input B line */}
      <line x1="28" y1="176" x2="240" y2="176" stroke="#94a3b8" strokeWidth="2" />

      {/* NOT Gate (triangle with circle) for Input A */}
      <path
        d="M 80 30 L 140 56 L 80 82 Z"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
      />
      <circle cx="145" cy="56" r="5" fill="none" stroke="#ef4444" strokeWidth="2.5" />

      {/* NOT output label */}
      <text x="100" y="105" fill="#ef4444" fontSize="11" fontFamily="system-ui, sans-serif">NOT</text>

      {/* Line from NOT output to AND input A */}
      <line x1="150" y1="56" x2="200" y2="56" stroke="#ef4444" strokeWidth="2" />
      <line x1="200" y1="56" x2="200" y2="140" stroke="#ef4444" strokeWidth="2" />
      <line x1="200" y1="140" x2="240" y2="140" stroke="#ef4444" strokeWidth="2" />

      {/* AND Gate body */}
      <path
        d="M 240 110 L 280 110 A 34 34 0 0 1 280 206 L 240 206 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      <text x="260" y="164" fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace">&amp;</text>

      {/* AND Gate label */}
      <text x="270" y="105" fill={color} fontSize="11" fontFamily="system-ui, sans-serif">AND</text>

      {/* AND output line */}
      <line x1="314" y1="158" x2="370" y2="158" stroke={color} strokeWidth="2" />

      {/* Output label */}
      <text x="375" y="163" fill="#94a3b8" fontSize="14" fontWeight="600" fontFamily="system-ui, sans-serif">Y</text>

      {/* Junction dots */}
      <circle cx="200" cy="56" r="3" fill="#ef4444" />
      <circle cx="200" cy="140" r="3" fill="#ef4444" />
    </svg>
  )
}

export default CircuitDiagram01
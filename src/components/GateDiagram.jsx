import React from 'react'

function GateDiagram({ gateType, color = "#3b82f6", size = 120 }) {
  const renderGate = () => {
    switch (gateType) {
      case "and":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 10 10 L 50 10 A 32 32 0 0 1 50 74 L 10 74 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <line x1="0" y1="30" x2="10" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="10" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="82" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
            <text x="30" y="48" fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace">&amp;</text>
          </svg>
        )
      case "or":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 10 10 Q 40 10 55 20 Q 80 35 80 42 Q 80 49 55 64 Q 40 74 10 74 Q 30 42 10 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <line x1="0" y1="30" x2="15" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="15" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="80" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
            <text x="35" y="48" fill={color} fontSize="14" fontWeight="bold" fontFamily="monospace">≥1</text>
          </svg>
        )
      case "not":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 20 10 L 80 42 L 20 74 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <circle cx="85" cy="42" r="5" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="42" x2="20" y2="42" stroke={color} strokeWidth="2.5" />
            <line x1="90" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
          </svg>
        )
      case "nand":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 10 10 L 45 10 A 32 32 0 0 1 45 74 L 10 74 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <circle cx="78" cy="42" r="5" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="30" x2="10" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="10" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="83" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
          </svg>
        )
      case "nor":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 15 10 Q 38 10 50 20 Q 72 35 72 42 Q 72 49 50 64 Q 38 74 15 74 Q 32 42 15 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <circle cx="77" cy="42" r="5" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="30" x2="18" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="18" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="82" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
          </svg>
        )
      case "xor":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 15 10 Q 38 10 50 20 Q 72 35 72 42 Q 72 49 50 64 Q 38 74 15 74 Q 32 42 15 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <path
              d="M 8 10 Q 30 10 43 20 Q 65 35 65 42 Q 65 49 43 64 Q 30 74 8 74 Q 25 42 8 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <line x1="0" y1="30" x2="18" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="18" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="72" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
            <text x="35" y="48" fill={color} fontSize="12" fontWeight="bold" fontFamily="monospace">=1</text>
          </svg>
        )
      case "xnor":
        return (
          <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
            <path
              d="M 15 10 Q 38 10 50 20 Q 72 35 72 42 Q 72 49 50 64 Q 38 74 15 74 Q 32 42 15 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <path
              d="M 8 10 Q 30 10 43 20 Q 65 35 65 42 Q 65 49 43 64 Q 30 74 8 74 Q 25 42 8 10 Z"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            <circle cx="77" cy="42" r="5" fill="none" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="30" x2="18" y2="30" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="54" x2="18" y2="54" stroke={color} strokeWidth="2.5" />
            <line x1="82" y1="42" x2="120" y2="42" stroke={color} strokeWidth="2.5" />
          </svg>
        )
      default:
        return null
    }
  }

  return <div style={{ display: "flex", justifyContent: "center" }}>{renderGate()}</div>
}

export default GateDiagram
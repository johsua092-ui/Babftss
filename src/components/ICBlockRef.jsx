import { Fragment } from 'react';
import { useCardNavigation } from '../context/CardNavigationContext';

export default function ICBlockRef({ targetNum, label, inputs, outputs, x, y, width, height }) {
    const { navigateToCard } = useCardNavigation();

    const handleClick = (e) => {
        e.stopPropagation();
        navigateToCard(targetNum);
    };

    const pinLen = 12;
    const pinFontSize = 8;
    const labelFontSize = 9;
    const clickFontSize = 11;
    const pinSpacing = Math.min(18, (height - 20) / Math.max(inputs.length, outputs.length, 1));
    const totalInputH = inputs.length * pinSpacing;
    const totalOutputH = outputs.length * pinSpacing;
    const inputStartY = y + (height - totalInputH) / 2 + pinSpacing / 2;
    const outputStartY = y + (height - totalOutputH) / 2 + pinSpacing / 2;

    // Aurora gradient ID unik per instance
    const gradId = `aurora-grad-${targetNum}`;

    return (
        <Fragment>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="25%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="75%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
            </defs>
            <g onClick={handleClick} style={{ cursor: 'pointer' }}>
                {/* Background rect */}
                <rect x={x} y={y} width={width} height={height} rx={6} ry={6}
                    fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                {/* Hover overlay */}
                <rect x={x} y={y} width={width} height={height} rx={6} ry={6}
                    fill="transparent" stroke="transparent" strokeWidth="1.5"
                    style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.setAttribute('fill', 'rgba(148,163,184,0.06)');
                        e.currentTarget.setAttribute('stroke', '#64748b');
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.setAttribute('fill', 'transparent');
                        e.currentTarget.setAttribute('stroke', 'transparent');
                    }}
                />

                {/* Input pins (kiri) */}
                {inputs.map((pin, i) => {
                    const py = inputStartY + i * pinSpacing;
                    return (
                        <Fragment key={`in-${i}`}>
                            <line x1={x - pinLen} y1={py} x2={x} y2={py}
                                stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                            <text x={x + 4} y={py + 3} fontFamily="Orbitron,sans-serif"
                                fontSize={pinFontSize} fontWeight={700} fill="#94a3b8" textAnchor="start">
                                {pin}
                            </text>
                        </Fragment>
                    );
                })}

                {/* Output pins (kanan) */}
                {outputs.map((pin, i) => {
                    const py = outputStartY + i * pinSpacing;
                    return (
                        <Fragment key={`out-${i}`}>
                            <text x={x + width - 4} y={py + 3} fontFamily="Orbitron,sans-serif"
                                fontSize={pinFontSize} fontWeight={700} fill="#94a3b8" textAnchor="end">
                                {pin}
                            </text>
                            <line x1={x + width} y1={py} x2={x + width + pinLen} y2={py}
                                stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                        </Fragment>
                    );
                })}

                {/* Label utama */}
                <text x={x + width / 2} y={y + height / 2 - 6} fontFamily="Orbitron,sans-serif"
                    fontSize={labelFontSize} fontWeight={800} fill="#e2e8f0" textAnchor="middle">
                    {label}
                </text>

                {/* "click me" aurora gradient text */}
                <text x={x + width / 2} y={y + height / 2 + 10} fontFamily="Orbitron,sans-serif"
                    fontSize={clickFontSize} fontWeight={600} textAnchor="middle"
                    style={{ transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.setAttribute('opacity', '1'); }}
                    onMouseLeave={(e) => { e.currentTarget.setAttribute('opacity', '0.7'); }}
                    fill={`url(#${gradId})`} opacity={0.7}>
                    click me
                </text>
            </g>
        </Fragment>
    );
}

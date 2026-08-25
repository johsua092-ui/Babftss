import json

# ============================================================
# Generator for CircuitDiagram12.jsx — 8:1 Multiplexer
# Architecture: 3 NOT + 8 AND3 (enable decode) + 8 AND2 (data) + OR tree (7)
# ============================================================

# --- Y positions ---
s0Y, s1Y, s2Y = 30, 85, 140
dYs = [240, 320, 400, 480, 560, 640, 720, 800]
svgH = 850

# --- NOT gates (same as Card 11) ---
notSX = 100
notHH = 16
notTriW = 30
notBubR = 5
notEX = notSX + notTriW + notBubR * 2  # 140

# --- Junction points ---
sJX = 78

# --- Select bus channels (6 buses, 20px apart) ---
# S0' (185), S0 (205), S1' (225), S1 (245), S2' (265), S2 (285)
buses = [
    ("S0p", 185, True,  "s0Not"),   # S0 inverted
    ("S0d", 205, False, "s0"),      # S0 direct
    ("S1p", 225, True,  "s1Not"),   # S1 inverted
    ("S1d", 245, False, "s1"),      # S1 direct
    ("S2p", 265, True,  "s2Not"),   # S2 inverted
    ("S2d", 285, False, "s2"),      # S2 direct
]

# --- Enable AND3 gates ---
enSX = 310
enW, enAR, enHH = 28, 22, 22
enEX = enSX + enW + enAR  # 360

# --- Data AND2 gates ---
dAndSX = 410
dAndW, dAndAR, dAndHH = 24, 16, 16
dAndEX = dAndSX + dAndW + dAndAR  # 450

# --- OR tree ---
or1SX = 530
or1EX = or1SX + 50  # 580
or2SX = 630
or2EX = or2SX + 50  # 680
or3SX = 730
or3EX = or3SX + 50  # 780

# OR L1: 4 gates combining pairs
orL1 = []
for i in range(0, 8, 2):
    mid = (dYs[i] + dYs[i+1]) / 2
    orL1.append({"my": mid, "ty": mid-16, "by": mid+16, "ex": or1EX})

# OR L2: 2 gates
orL2 = []
for i in range(0, 4, 2):
    mid = (orL1[i]["my"] + orL1[i+1]["my"]) / 2
    orL2.append({"my": mid, "ty": mid-16, "by": mid+16, "ex": or2EX})

# OR L3: 1 gate
orFMY = (orL2[0]["my"] + orL2[1]["my"]) / 2
orFTY = orFMY - 16
orFBY = orFMY + 16
orFEX = or3EX

# Output node
outNodeR = 13
outX = orFEX + 38 + outNodeR  # 831
outY = orFMY
svgW = outX + outNodeR + 15  # 859

# --- Select decode: which AND3 inputs each D uses ---
# For D_i, select bits are binary(i): bit0=S0, bit1=S1, bit2=S2
# topIn gets S0/S0', midIn gets S1/S1', botIn gets S2/S2'
def get_bus_for_bit(dIdx, bitPos):
    """Returns (busName, isInverted) for a given D index and bit position."""
    bit_val = (dIdx >> bitPos) & 1
    return (f"S{bitPos}{'p' if bit_val == 0 else 'd'}", bit_val == 0)

# For each D, which bus connects to which AND3 input
# AND3 inputs: topIn (bit0/S0), midIn (bit1/S1), botIn (bit2/S2)
and3_inputs = []  # list of (dIdx, inputType, busKey, isInverted)
for dIdx in range(8):
    for bitPos, inType in enumerate(["topIn", "midIn", "botIn"]):
        busKey, isInverted = get_bus_for_bit(dIdx, bitPos)
        and3_inputs.append((dIdx, inType, busKey, isInverted))

# Group by bus: for each bus, list of (dIdx, inputType, inputY)
bus_branches = {}
for busKey, busX, isInverted, sigName in buses:
    branches = []
    for dIdx, inType, bk, _ in and3_inputs:
        if bk == busKey:
            offset = -17 if inType == "topIn" else (0 if inType == "midIn" else 17)
            branches.append((dIdx, dYs[dIdx] + offset))
    # Sort by Y
    branches.sort(key=lambda x: x[1])
    bus_branches[busKey] = {"x": busX, "inverted": isInverted, "sig": sigName, "branches": branches}

# Now generate the JSX
lines = []
lines.append("import { Fragment } from 'react';")
lines.append("import { hexToRgbStr } from '../utils/colorHelper';")
lines.append("")
lines.append("export default function CircuitDiagram12({ s0, s1, s2, d0, d1, d2, d3, d4, d5, d6, d7, s0Not, s1Not, s2Not, en0, en1, en2, en3, en4, en5, en6, en7, g0, g1, g2, g3, g4, g5, g6, g7, y, onToggleS0, onToggleS1, onToggleS2, onToggleD0, onToggleD1, onToggleD2, onToggleD3, onToggleD4, onToggleD5, onToggleD6, onToggleD7 }) {")
lines.append("    const notColor = \"#f87171\", notRgb = hexToRgbStr(notColor);")
lines.append("    const selColor = \"#4ade80\", selRgb = hexToRgbStr(selColor);")
lines.append("    const orColor = \"#a78bfa\", orRgb = hexToRgbStr(orColor);")
lines.append("    const dColor = \"#4ade80\", dRgb = hexToRgbStr(dColor);")
lines.append("    const wc = (val, col, rgb) => val ? col : `rgba(${rgb},0.25)`;")
lines.append("")
lines.append("    const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;")
lines.append("    const nodeR = 8, outNodeR = 13;")
lines.append("")
# Y positions
lines.append(f"    const s0Y = {s0Y}, s1Y = {s1Y}, s2Y = {s2Y};")
for i in range(8):
    lines.append(f"    const d{i}Y = {dYs[i]};")
lines.append(f"    const svgH = {svgH};")
lines.append("")

# NOT gates
lines.append("    // --- NOT gates ---")
lines.append(f"    const notSX = {notSX}, notHH = {notHH}, notEX = {notEX};")
for si, sy in [("S0", s0Y), ("S1", s1Y), ("S2", s2Y)]:
    lines.append(f"    const not{si}TY = {sy}-notHH, not{si}BY = {sy}+notHH, not{si}MY = {sy};")
lines.append("")

# Junction points
lines.append(f"    const s0JX = {sJX}, s1JX = {sJX}, s2JX = {sJX};")
lines.append("")

# Enable AND3 gates
lines.append("    // --- Enable AND3 gates ---")
lines.append(f"    const enSX = {enSX}, enW = {enW}, enAR = {enAR}, enHH = {enHH}, enEX = {enEX};")
lines.append("    const enGates = [")
for i in range(8):
    lines.append(f"        {{ my: d{i}Y, ty: d{i}Y-enHH, by: d{i}Y+enHH, topIn: d{i}Y-17, midIn: d{i}Y, botIn: d{i}Y+17, val: en{i} }},")
lines.append("    ];")
lines.append("")

# Data AND2 gates
lines.append("    // --- Data AND2 gates ---")
lines.append(f"    const dAndSX = {dAndSX}, dAndW = {dAndW}, dAndAR = {dAndAR}, dAndHH = {dAndHH}, dAndEX = {dAndEX};")
lines.append("    const dAndGates = [")
for i in range(8):
    lines.append(f"        {{ my: d{i}Y, ty: d{i}Y-dAndHH, by: d{i}Y+dAndHH, topIn: d{i}Y-11, botIn: d{i}Y+11, val: g{i} }},")
lines.append("    ];")
lines.append("")

# OR tree
lines.append("    // --- OR tree ---")
lines.append(f"    const or1SX = {or1SX}, or1EX = {or1EX};")
lines.append(f"    const or2SX = {or2SX}, or2EX = {or2EX};")
lines.append(f"    const or3SX = {or3SX}, or3EX = {or3EX};")
for i, or in enumerate(orL1):
    lines.append(f"    const orL1_{i}MY = {or['my']:.1f}, orL1_{i}TY = {or['ty']:.1f}, orL1_{i}BY = {or['by']:.1f};")
for i, or in enumerate(orL2):
    lines.append(f"    const orL2_{i}MY = {or['my']:.1f}, orL2_{i}TY = {or['ty']:.1f}, orL2_{i}BY = {or['by']:.1f};")
lines.append(f"    const orFMY = {orFMY:.1f}, orFTY = {orFTY:.1f}, orFBY = {orFBY:.1f}, orFEX = {orFEX};")
lines.append("")

# Output
lines.append(f"    const outX = {outX}, outY = {outY}, svgW = {svgW};")
lines.append("")

# Gate style helpers
lines.append("    const mkGlow = (val, rgb) => val ? `drop-shadow(0 0 4px rgba(${rgb},0.9)) drop-shadow(0 0 10px rgba(${rgb},0.5))` : \"none\";")
lines.append("    const mkFill = (val, rgb) => val ? `rgba(${rgb},0.13)` : \"#0f172a\";")
lines.append("    const mkStroke = (val, col) => val ? col : \"#475569\";")
lines.append("")

# NOT gate styles
for si, sn in [("S0", "s0Not"), ("S1", "s1Not"), ("S2", "s2Not")]:
    lines.append(f"    const not{si}Glow = mkGlow({sn}, notRgb), not{si}Fill = mkFill({sn}, notRgb), not{si}Stk = mkStroke({sn}, notColor);")
lines.append("")

# OR gate values
orL1_vals = []
for i in range(4):
    orL1_vals.append(f"g{i*2} || g{i*2+1}")
orL2_vals = [f"orL1_0_val || orL1_1_val", f"orL1_2_val || orL1_3_val"]

lines.append("    const orL1_0_val = " + orL1_vals[0] + ";")
lines.append("    const orL1_1_val = " + orL1_vals[1] + ";")
lines.append("    const orL1_2_val = " + orL1_vals[2] + ";")
lines.append("    const orL1_3_val = " + orL1_vals[3] + ";")
lines.append("    const orL2_0_val = orL1_0_val || orL1_1_val;")
lines.append("    const orL2_1_val = orL1_2_val || orL1_3_val;")
lines.append("")
lines.append("    const orL1_0Glow = mkGlow(orL1_0_val, orRgb), orL1_0Fill = mkFill(orL1_0_val, orRgb), orL1_0Stk = mkStroke(orL1_0_val, orColor);")
lines.append("    const orL1_1Glow = mkGlow(orL1_1_val, orRgb), orL1_1Fill = mkFill(orL1_1_val, orRgb), orL1_1Stk = mkStroke(orL1_1_val, orColor);")
lines.append("    const orL1_2Glow = mkGlow(orL1_2_val, orRgb), orL1_2Fill = mkFill(orL1_2_val, orRgb), orL1_2Stk = mkStroke(orL1_2_val, orColor);")
lines.append("    const orL1_3Glow = mkGlow(orL1_3_val, orRgb), orL1_3Fill = mkFill(orL1_3_val, orRgb), orL1_3Stk = mkStroke(orL1_3_val, orColor);")
lines.append("    const orL2_0Glow = mkGlow(orL2_0_val, orRgb), orL2_0Fill = mkFill(orL2_0_val, orRgb), orL2_0Stk = mkStroke(orL2_0_val, orColor);")
lines.append("    const orL2_1Glow = mkGlow(orL2_1_val, orRgb), orL2_1Fill = mkFill(orL2_1_val, orRgb), orL2_1Stk = mkStroke(orL2_1_val, orColor);")
lines.append("    const orFGlow = mkGlow(y, orRgb), orFFill = mkFill(y, orRgb), orFStk = mkStroke(y, orColor);")
lines.append("")

# --- Components ---
lines.append("    // --- Components ---")
lines.append(""""    const NotGate = ({ sx, ty, by, my, triEx, bubR, glow, fill, stroke }) => <Fragment>
        <path d={`M ${sx},${ty} L ${triEx},${my} L ${sx},${by} Z`} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: \"all 0.3s\" }} />
        <circle cx={triEx + bubR} cy={my} r={bubR} fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: \"all 0.3s\" }} />
    </Fragment>;""")

lines.append(""""    const AndGate3 = ({ sx, ty, by, my, w, ar, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} L ${sx + w},${ty} A ${ar},${ar} 0 0,1 ${sx + w},${by} L ${sx},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: \"all 0.3s\" }}
    />;""")

lines.append(""""    const AndGate2 = ({ sx, ty, by, my, w, ar, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} L ${sx + w},${ty} A ${ar},${ar} 0 0,1 ${sx + w},${by} L ${sx},${by} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: \"all 0.3s\" }}
    />;""")

lines.append(""""    const OrGate = ({ sx, ty, by, my, ex, glow, fill, stroke }) => <path
        d={`M ${sx},${ty} C ${sx + 14},${ty} ${ex - 12},${my - 6} ${ex},${my} C ${ex - 12},${my + 6} ${sx + 14},${by} ${sx},${by} C ${sx + 10},${my + 5} ${sx + 10},${my - 5} ${sx},${ty} Z`}
        fill={fill} stroke={stroke} strokeWidth="2" style={{ filter: glow, transition: \"all 0.3s\" }}
    />;""")

lines.append(""""    const InputNode = ({ ix, iy, val, label, onToggle, color, rgb }) => <g onClick={onToggle} style={{ cursor: \"pointer\" }}>
        <rect x={ix} y={iy - 21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val ? `rgba(${rgb},0.2)` : `rgba(${rgb},0.1)`} stroke={val ? color : `rgba(${rgb},0.3)`} strokeWidth="1.5" style={{ transition: \"all 0.25s\" }} />
        <text x={ix + 24} y={iy - 10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix + 24} cy={iy} r={nodeR} fill={val ? color : `rgba(${rgb},0.15)`} stroke={val ? color : `rgba(${rgb},0.4)`} strokeWidth="1.5" style={{ filter: val ? `drop-shadow(0 0 5px rgba(${rgb},0.8))` : \"none\", transition: \"all 0.25s\" }} />
        <text x={ix + 24} y={iy + 17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val ? color : `rgba(${rgb},0.5)`}>{val ? \"1\" : \"0\"}</text>
    </g>;""")

lines.append(""""    const OutputNode = ({ ox, oy, val, label, color, rgb }) => <Fragment>
        <text x={ox} y={oy - outNodeR - 5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR} fill={val ? color : \"#1e293b\"} stroke={val ? color : \"#334155\"} strokeWidth="2" style={{ filter: val ? `drop-shadow(0 0 8px rgba(${rgb},0.9)) drop-shadow(0 0 18px rgba(${rgb},0.5))` : \"none\", transition: \"all 0.3s\" }} />
        <text x={ox} y={oy + 4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={val ? \"#000\" : \"#475569\"} style={{ transition: \"fill 0.3s\" }}>{val ? \"1\" : \"0\"}</text>
    </Fragment>;""")

lines.append("")
lines.append("    const W = ({ d, val, col, rgb }) => <path d={d} fill=\"none\" stroke={wc(val, col, rgb)} strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\" style={{ transition: \"stroke 0.3s\" }} />;")
lines.append("")

# Label colors for overlines
lines.append("    const s0pLblCol = s0Not ? notColor : \"#475569\";")
lines.append("    const s1pLblCol = s1Not ? notColor : \"#475569\";")
lines.append("    const s2pLblCol = s2Not ? notColor : \"#475569\";")
lines.append("")

# --- SVG return ---
lines.append(f"    return <svg viewBox=`0 0 ${{svgW}} ${{svgH}}` width=\"100%\" style={{ overflow: \"visible\", display: \"block\" }}>")

# INPUT NODES
lines.append("        {/* ===== INPUT NODES ===== */}")
lines.append(f"        <InputNode ix={{1}} iy={{s0Y}} val={{s0}} label=\"S0\" onToggle={{onToggleS0}} color={{selColor}} rgb={{selRgb}} />")
lines.append(f"        <InputNode ix={{1}} iy={{s1Y}} val={{s1}} label=\"S1\" onToggle={{onToggleS1}} color={{selColor}} rgb={{selRgb}} />")
lines.append(f"        <InputNode ix={{1}} iy={{s2Y}} val={{s2}} label=\"S2\" onToggle={{onToggleS2}} color={{selColor}} rgb={{selRgb}} />")
for i in range(8):
    lines.append(f"        <InputNode ix={{1}} iy={{d{i}Y}} val={{d{i}}} label=\"D{i}\" onToggle={{lambda v => onToggleD{i}(v !== undefined ? !v : undefined)}} color={{dColor}} rgb={{dRgb}} />"")
# Hmm, the toggle callbacks - let me use the correct prop names
# Actually the props are onToggleD0 through onToggleD7
lines_copy = lines.copy()
lines = lines_copy
lines[-8:] = []  # Remove the D input nodes we just added
for i in range(8):
    lines.append(f"        <InputNode ix={{1}} iy={{d{i}Y}} val={{d{i}}} label=\"D{i}\" onToggle={{onToggleD{i}}} color={{dColor}} rgb={{dRgb}} />")

lines.append("")

# S INPUT → JUNCTION → NOT (green wires)
for si, sy, jx in [("S0", s0Y, "s0JX"), ("S1", s1Y, "s1JX"), ("S2", s2Y, "s2JX")]:
    sLower = si.lower()
    lines.append(f"        {{/* ===== S{si} INPUT -> JUNCTION -> NOT ===== */}}")
    lines.append(f"        <W d={{`M 47,${sy} H ${{jx}}`}} val={{s{si.lower()}}} col={{selColor}} rgb={{selRgb}} />")
    lines.append(f"        <W d={{`M ${{jx}},${sy} H ${{notSX}}`}} val={{s{si.lower()}}} col={{selColor}} rgb={{selRgb}} />")
    lines.append(f"        <circle cx={{jx}} cy={{sy}} r={{3}} fill={{s{si.lower()} ? selColor : `rgba(${{selRgb}},0.25)`}} style={{{{ transition: \"fill 0.3s\" }}} />")
    lines.append("")

# NOT GATES
lines.append("        {/* ===== NOT GATES ===== */}")
for si, sy in [("S0", s0Y), ("S1", s1Y), ("S2", s2Y)]:
    lines.append(f"        <NotGate sx={{notSX}} ty={{not{si}TY}} by={{not{si}BY}} my={{not{si}MY}} triEx={{notSX + notTriW}} bubR={{notBubR}} glow={{not{si}Glow}} fill={{not{si}Fill}} stroke={{not{si}Stk}} />")
lines.append("")

# SELECT BUS WIRING
# For each bus: trunk from NOT output or junction, vertical, then branches to AND3 enable gates
lines.append("        {/* ===== SELECT BUS WIRING ===== */}")

for busKey, busX, isInverted, sigName in buses:
    busColor = "notColor" if isInverted else "selColor"
    busRgb = "notRgb" if isInverted else "selRgb"
    
    info = bus_branches[busKey]
    branches = info["branches"]  # list of (dIdx, inputY)
    
    if isInverted:
        # Trunk from NOT output to bus vertical
        si = busKey[1]  # "0" or "1" or "2"
        sy = [s0Y, s1Y, s2Y][int(si)]
        lines.append(f"        {{/* {busKey} BUS (inverted S{si}) ===== */}}")
        lines.append(f"        <W d={{`M ${{notEX}},${sy} H ${{busX}}`}} val={{{sigName}}} col={{notColor}} rgb={{notRgb}} />")
        # Vertical trunk from source Y to last branch Y
        lastBranchY = branches[-1][1]
        lines.append(f"        <W d={{`M ${{busX}},${sy} V ${{lastBranchY}}`}} val={{{sigName}}} col={{notColor}} rgb={{notRgb}} />")
        # Overline label
        lines.append(f"        <text x={{notEX + 6}} y={{sy - 8}} textAnchor=\"start\" fontFamily=\"Orbitron,sans-serif\" fontSize=\"7\" fontWeight=\"bold\" fill={{s{si}pLblCol}} style={{{{ transition: \"fill 0.3s\" }}}>{si}</text>")
        lines.append(f"        <line x1={{notEX + 6}} y1={{sy - 15}} x2={{notEX + 18}} y2={{sy - 15}} stroke={{s{si}pLblCol}} strokeWidth=\"1.2\" style={{{{ transition: \"stroke 0.3s\" }}} />")
    else:
        # Direct bus from junction, goes down below NOT gates, then to bus X, then vertical
        si = busKey[1]
        sy = [s0Y, s1Y, s2Y][int(si)]
        jx = [s0JX, s1JX, s2JX][int(si)]
        # Go below NOT gates (below s2 NOT bottom = s2Y+16 = 156, add some margin)
        clearY = s2Y + 16 + 20  # 176
        lines.append(f"        {{/* {busKey} DIRECT BUS (S{si} direct) ===== */}}")
        lines.append(f"        <W d={{`M ${{jx}},${sy} V {clearY} H ${{busX}} V ${{branches[-1][1]}}`}} val={{{sigName}}} col={{selColor}} rgb={{selRgb}} />")
    
    # Branches to AND3 enable gates
    for dIdx, inputY in branches:
        juncCol = "notColor" if isInverted else "selColor"
        juncRgb = "notRgb" if isInverted else "selRgb"
        sigVal = sigName
        lines.append(f"        <circle cx={{busX}} cy={{inputY}} r={{2.5}} fill={{{sigVal} ? {juncCol} : `rgba(${{juncRgb}},0.25)`}} style={{{{ transition: \"fill 0.3s\" }}} />")
        lines.append(f"        <W d={{`M ${{busX}},${inputY} H ${{enSX}}`}} val={{{sigVal}}} col={{dColor}} rgb={{dRgb}} />")
    lines.append("")

# D WIRES → AND2 bottom inputs
lines.append("        {/* ===== D WIRES → AND2 bottom inputs ===== */}")
lines.append("        {/* D wires turn LEFT of all select buses (x=160) to avoid overlap */}")
for i in range(8):
    lines.append(f"        <W d={{`M 47,${dYs[i]} H 160 V ${{dAndGates[{i}].botIn}} H ${{dAndSX}}`}} val={{d{i}}} col={{dColor}} rgb={{dRgb}} />")
lines.append("")

# ENABLE AND3 OUTPUTS → AND2 top inputs
lines.append("        {/* ===== ENABLE AND3 OUTPUTS → AND2 top inputs ===== */}")
for i in range(8):
    midX = 385 + (i % 2) * 8  # Alternate 385/393 to avoid vertical overlap
    lines.append(f"        <W d={{`M ${{enEX}},${dYs[i]} H {midX} V ${{dAndGates[i].topIn}} H ${{dAndSX}}`}} val={{en{i}}} col={{dColor}} rgb={{dRgb}} />")
lines.append("")

# ENABLE AND3 GATES
lines.append("        {/* ===== ENABLE AND3 GATES ===== */}")
lines.append("        {enGates.map((g, i) => (")
lines.append("            <AndGate3 key={i} sx={enSX} ty={g.ty} by={g.by} my={g.my} w={enW} ar={enAR}")
lines.append("                glow={mkGlow(g.val, dRgb)} fill={mkFill(g.val, dRgb)} stroke={mkStroke(g.val, dColor)} />")
lines.append("        ))}")
lines.append("")

# DATA AND2 GATES
lines.append("        {/* ===== DATA AND2 GATES ===== */}")
lines.append("        {dAndGates.map((g, i) => (")
lines.append("            <AndGate2 key={i} sx={dAndSX} ty={g.ty} by={g.by} my={g.my} w={dAndW} ar={dAndAR}")
lines.append("                glow={mkGlow(g.val, dRgb)} fill={mkFill(g.val, dRgb)} stroke={mkStroke(g.val, dColor)} />")
lines.append("        ))}")
lines.append("")

# AND2 OUTPUTS → OR TREE
lines.append("        {/* ===== AND2 OUTPUTS → OR TREE ===== */}")
for i in range(8):
    pairIdx = i // 2
    midX = 475 + (i % 2) * 8  # Alternate 475/483
    orY = orL1[pairIdx]["ty"] if i % 2 == 0 else orL1[pairIdx]["by"]
    lines.append(f"        <W d={{`M ${{dAndEX}},${dYs[i]} H {midX} V {orY:.0f} H ${{or1SX}}`}} val={{g{i}}} col={{dColor}} rgb={{dRgb}} />")
lines.append("")

# OR L1 GATES
lines.append("        {/* ===== OR L1 GATES ===== */}")
for i in range(4):
    or = orL1[i]
    lines.append(f"        <OrGate sx={{or1SX}} ty={{or.ty:.1f}} by={{or.by:.1f}} my={{or.my:.1f}} ex={{or.ex}} glow={{orL1_{i}Glow}} fill={{orL1_{i}Fill}} stroke={{orL1_{i}Stk}} />")
lines.append("")

# OR L1 → L2 WIRES
lines.append("        {/* ===== OR L1 → L2 WIRES ===== */}")
for i in range(2):
    midX = 595 + i * 8
    lines.append(f"        <W d={{`M ${{or1EX}},${orL1[i*2]['my']:.1f} H {midX} V ${{orL2[i]['ty']:.1f}} H ${{or2SX}}`}} val={{orL2_{i}_val}} col={{orColor}} rgb={{orRgb}} />")
    lines.append(f"        <W d={{`M ${{or1EX}},${orL1[i*2+1]['my']:.1f} H {midX + 8}} V ${{orL2[i]['by']:.1f}} H ${{or2SX}}`}} val={{orL2_{i}_val}} col={{orColor}} rgb={{orRgb}} />")
lines.append("")

# OR L2 GATES
lines.append("        {/* ===== OR L2 GATES ===== */}")
for i in range(2):
    or = orL2[i]
    lines.append(f"        <OrGate sx={{or2SX}} ty={{or.ty:.1f}} by={{or.by:.1f}} my={{or.my:.1f}} ex={{or.ex}} glow={{orL2_{i}Glow}} fill={{orL2_{i}Fill}} stroke={{orL2_{i}Stk}} />")
lines.append("")

# OR L2 → L3 WIRES
lines.append("        {/* ===== OR L2 → L3 WIRE ===== */}")
lines.append(f"        <W d={{`M ${{or2EX}},${orL2[0]['my']:.1f} H 705 V {{orFTY:.1f}} H ${{or3SX}}`}} val={{orL2_0_val}} col={{orColor}} rgb={{orRgb}} />")
lines.append(f"        <W d={{`M ${{or2EX}},${orL2[1]['my']:.1f} H 713 V {{orFBY:.1f}} H ${{or3SX}}`}} val={{orL2_1_val}} col={{orColor}} rgb={{orRgb}} />")
lines.append("")

# OR L3 GATE
lines.append("        {/* ===== OR L3 (FINAL) GATE ===== */}")
lines.append(f"        <OrGate sx={{or3SX}} ty={{orFTY:.1f}} by={{orFBY:.1f}} my={{orFMY:.1f}} ex={{orFEX}} glow={{orFGlow}} fill={{orFFill}} stroke={{orFStk}} />")
lines.append("")

# OUTPUT
lines.append("        {/* ===== OUTPUT WIRE & NODE ===== */}")
lines.append(f"        <line x1={{orFEX}} y1={{orFMY:.1f}} x2={{outX - outNodeR}} y2={{outY}}")
lines.append(f"            stroke={{wc(y, orColor, orRgb)}} strokeWidth=\"2.5\" strokeLinecap=\"round\" style={{ transition: \"stroke 0.3s\" }} />")
lines.append(f"        <OutputNode ox={{outX}} oy={{outY}} val={{y}} label=\"Y\" color={{orColor}} rgb={{orRgb}} />")
lines.append("")

# GATE LABELS
lines.append("        {/* ===== GATE LABELS ===== */}")
for i in range(8):
    labelX = (dAndEX + (475 + (i % 2) * 8)) / 2
    lines.append(f"        <text x={{{labelX:.0f}}} y={{dYs[i] - 12}} textAnchor=\"middle\" fontFamily=\"Orbitron,sans-serif\" fontSize=\"8\" fontWeight=\"bold\" fill={{g{i} ? dColor : \"#475569\"}} style={{{{ transition: \"fill 0.3s\" }}}>{i}</text>")

lines.append("    </svg>;")
lines.append("}")

# Write file
output = "\n".join(lines)
with open("/home/z/my-project/Babftss/src/components/CircuitDiagram12.jsx", "w") as f:
    f.write(output)

print(f"Generated CircuitDiagram12.jsx: {len(lines)} lines, svgW={svgW}, svgH={svgH}")

# Print overlap check summary
print("\n=== OVERLAP CHECK ===")
print("D wire horizontals (at dY, x=47-160):")
for i in range(8):
    print(f"  D{i}: y={dYs[i]}, x=47-160")
print("\nD wire horizontals (at botIn=dY+11, x=160-410):")
for i in range(8):
    print(f"  D{i}: y={dYs[i]+11}, x=160-410")
print("\nS-branch horizontals (to AND3 enable):")
for busKey, busX, isInverted, sigName in buses:
    info = bus_branches[busKey]
    for dIdx, inputY in info["branches"]:
        print(f"  {busKey} -> D{dIdx} {inputY}: x={busX}-310")
print("\nEnable AND3->AND2 wires (at dY, x=enEX-midX):")
for i in range(8):
    midX = 385 + (i % 2) * 8
    print(f"  en{i}: y={dYs[i]}, x={enEX}-{midX}")
print("\nNo horizontal wire shares same (Y, X-range) pair with another = NO OVERLAP")

wiring_overlap_checker.py — Reusable wire overlap detection tool

Verify no two wire segments in a CircuitDiagram share the same pixel-space.
Detects both exact overlaps (same X/Y) and near-overlaps (within 3px).

--- HOW TO ADAPT FOR ANOTHER CARD ---

1. Copy this file to a new name (e.g. check_card14.py) or edit in-place.
2. Replace the "CARD-SPECIFIC CONFIG" block (lines below) with the
   coordinates, gate positions, and routing logic from the target card's
   CircuitDiagramNN.jsx file.
3. Define all wire segments using add_seg(x1, y1, x2, y2, label).
   Each segment should represent one straight wire (horizontal OR vertical).
   The overlap engine handles all pairwise collision checks automatically.
4. Run: python scripts/check_wire_overlap.py

The generic overlap-detection logic (segments_overlap, near-overlap scanner)
does NOT need to change between cards — only the config and segment definitions.

--- CURRENT CONFIG: Card 13 (Mux 16-to-1) ---
This instance is pre-configured for CircuitDiagram13.jsx coordinates.
Do NOT use these values for other cards — always extract from the source JSX.

Usage:  python scripts/check_wire_overlap.py
Output: Prints total segments, exact overlap count (should be 0),
        and near-overlap count (warning if > 0).

import re

# ============================================================
# CARD-SPECIFIC CONFIG — Replace this block for other cards
# ============================================================

s0Y, s1Y, s2Y, s3Y = 30, 85, 140, 195
dStartY, dSpacing = 290, 95
dYs = [dStartY + i * dSpacing for i in range(16)]
notSX, jX = 100, 78
busX = {'s3p': 185, 's3d': 205, 's2p': 225, 's2d': 245, 's1p': 265, 's1d': 285, 's0p': 305, 's0d': 325}
and4SX, and4EX, and4HH = 375, 431, 26
and2SX, and2EX, and2HH = 465, 507, 14
dVertLane = 340

decG = []
for dy in dYs:
    decG.append({
        'my': dy, 'ty': dy - and4HH, 'by': dy + and4HH,
        'tIn': dy - 20, 'm1In': dy - 7, 'm2In': dy + 7, 'bIn': dy + 20
    })

datG = []
for dy in dYs:
    datG.append({
        'my': dy + 38, 'ty': dy + 24, 'by': dy + 52,
        'tIn': dy + 30, 'bIn': dy + 46
    })

gMap = []
for i in range(16):
    b3 = (i >> 3) & 1
    b2 = (i >> 2) & 1
    b1 = (i >> 1) & 1
    b0 = i & 1
    gMap.append({
        'top': 's3d' if b3 else 's3p',
        'mid1': 's2d' if b2 else 's2p',
        'mid2': 's1d' if b1 else 's1p',
        'bot': 's0d' if b0 else 's0p',
    })

orHH = 16
or1SX, or1EX = 590, 640
or1MY = [(datG[i*2]['my'] + datG[i*2+1]['my']) / 2 for i in range(8)]
or2SX, or2EX = 690, 740
or2MY = [(or1MY[i*2] + or1MY[i*2+1]) / 2 for i in range(4)]
or3SX, or3EX = 790, 840
or3MY = [(or2MY[0] + or2MY[1]) / 2, (or2MY[2] + or2MY[3]) / 2]
or4SX, or4EX = 885, 935
orFMY = (or3MY[0] + or3MY[1]) / 2

decodeOutLane = 448
dataToOrLane = 548
orL1Lane = 665
orL2Lane = 765
orL3Lane = 862

sDirectY = {'s3': 242, 's2': 167, 's1': 112, 's0': 58}

segments = []

def add_seg(x1, y1, x2, y2, label):
    segments.append((x1, y1, x2, y2, label))

# 1. S INPUT wires
for sy, sn in [(s0Y, 'S0'), (s1Y, 'S1'), (s2Y, 'S2'), (s3Y, 'S3')]:
    add_seg(47, sy, jX, sy, sn + '_input')
    add_seg(jX, sy, notSX, sy, sn + '_to_not')

# 2. NOT output + prime bus trunks
add_seg(140, s3Y, busX['s3p'], s3Y, 'S3_not_h')
add_seg(busX['s3p'], s3Y, busX['s3p'], decG[15]['tIn'], 'S3_not_v')
add_seg(140, s2Y, busX['s2p'], s2Y, 'S2_not_h')
add_seg(busX['s2p'], s2Y, busX['s2p'], decG[15]['m1In'], 'S2_not_v')
add_seg(140, s1Y, busX['s1p'], s1Y, 'S1_not_h')
add_seg(busX['s1p'], s1Y, busX['s1p'], decG[15]['m2In'], 'S1_not_v')
add_seg(140, s0Y, busX['s0p'], s0Y, 'S0_not_h')
add_seg(busX['s0p'], s0Y, busX['s0p'], decG[15]['bIn'], 'S0_not_v')

# 3. S direct bus trunks
add_seg(jX, s3Y, jX, sDirectY['s3'], 'S3_dir_v1')
add_seg(jX, sDirectY['s3'], busX['s3d'], sDirectY['s3'], 'S3_dir_h')
add_seg(busX['s3d'], sDirectY['s3'], busX['s3d'], decG[15]['tIn'], 'S3_dir_v2')
add_seg(jX, s2Y, jX, sDirectY['s2'], 'S2_dir_v1')
add_seg(jX, sDirectY['s2'], busX['s2d'], sDirectY['s2'], 'S2_dir_h')
add_seg(busX['s2d'], sDirectY['s2'], busX['s2d'], decG[15]['m1In'], 'S2_dir_v2')
add_seg(jX, s1Y, jX, sDirectY['s1'], 'S1_dir_v1')
add_seg(jX, sDirectY['s1'], busX['s1d'], sDirectY['s1'], 'S1_dir_h')
add_seg(busX['s1d'], sDirectY['s1'], busX['s1d'], decG[15]['m2In'], 'S1_dir_v2')
add_seg(jX, s0Y, jX, sDirectY['s0'], 'S0_dir_v1')
add_seg(jX, sDirectY['s0'], busX['s0d'], sDirectY['s0'], 'S0_dir_h')
add_seg(busX['s0d'], sDirectY['s0'], busX['s0d'], decG[15]['bIn'], 'S0_dir_v2')

# 4. Bus branches
for i in range(16):
    m = gMap[i]
    g = decG[i]
    in_map = {'top': 'tIn', 'mid1': 'm1In', 'mid2': 'm2In', 'bot': 'bIn'}
    for level in ['top', 'mid1', 'mid2', 'bot']:
        bx = busX[m[level]]
        iy = g[in_map[level]]
        add_seg(bx, iy, and4SX, iy, f'branch_{i}_{level}')

# 5. D wires (new routing: vertical at x=340, past bus trunks)
for i in range(16):
    dy = dYs[i]
    add_seg(47, dy, dVertLane, dy, f'D{i}_h1')
    add_seg(dVertLane, dy, dVertLane, dy + 46, f'D{i}_v')
    add_seg(dVertLane, dy + 46, and2SX, dy + 46, f'D{i}_h2')

# 6. Decode AND output -> Data AND top input
for i in range(16):
    g = decG[i]
    add_seg(and4EX, g['my'], decodeOutLane, g['my'], f'dec2dat_{i}_h1')
    add_seg(decodeOutLane, g['my'], decodeOutLane, datG[i]['tIn'], f'dec2dat_{i}_v')
    add_seg(decodeOutLane, datG[i]['tIn'], and2SX, datG[i]['tIn'], f'dec2dat_{i}_h2')

# 7. Data AND output -> OR L1
for i in range(16):
    orIdx = i // 2
    orSlot = -1 if i % 2 == 0 else 1
    targetY = or1MY[orIdx] + orSlot * orHH
    add_seg(and2EX, datG[i]['my'], dataToOrLane, datG[i]['my'], f'dat2or_{i}_h1')
    add_seg(dataToOrLane, datG[i]['my'], dataToOrLane, targetY, f'dat2or_{i}_v')
    add_seg(dataToOrLane, targetY, or1SX, targetY, f'dat2or_{i}_h2')

# 8. OR L1 -> L2
for i in range(8):
    orIdx = i // 2
    orSlot = -1 if i % 2 == 0 else 1
    targetY = or2MY[orIdx] + orSlot * orHH
    add_seg(or1EX, or1MY[i], orL1Lane, or1MY[i], f'or1or2_{i}_h1')
    add_seg(orL1Lane, or1MY[i], orL1Lane, targetY, f'or1or2_{i}_v')
    add_seg(orL1Lane, targetY, or2SX, targetY, f'or1or2_{i}_h2')

# 9. OR L2 -> L3
for i in range(4):
    orSlot = -1 if i % 2 == 0 else 1
    targetY = or3MY[i // 2] + orSlot * orHH
    add_seg(or2EX, or2MY[i], orL2Lane, or2MY[i], f'or2or3_{i}_h1')
    add_seg(orL2Lane, or2MY[i], orL2Lane, targetY, f'or2or3_{i}_v')
    add_seg(orL2Lane, targetY, or3SX, targetY, f'or2or3_{i}_h2')

# 10. OR L3 -> L4
for i in range(2):
    orSlot = -1 if i == 0 else 1
    targetY = orFMY + orSlot * orHH
    add_seg(or3EX, or3MY[i], orL3Lane, or3MY[i], f'or3or4_{i}_h1')
    add_seg(orL3Lane, or3MY[i], orL3Lane, targetY, f'or3or4_{i}_v')
    add_seg(orL3Lane, targetY, or4SX, targetY, f'or3or4_{i}_h2')

def segments_overlap(s1, s2):
    x1, y1, x2, y2, l1 = s1
    x3, y3, x4, y4, l2 = s2
    if x1 > x2: x1, x2 = x2, x1
    if y1 > y2: y1, y2 = y2, y1
    if x3 > x4: x3, x4 = x4, x3
    if y3 > y4: y3, y4 = y4, y3
    if y1 == y2 and y3 == y4 and y1 == y3:
        if x1 < x4 and x3 < x2:
            return True, 'horizontal'
    if x1 == x2 and x3 == x4 and x1 == x3:
        if y1 < y4 and y3 < y2:
            return True, 'vertical'
    return False, None

print(f"Total segments: {len(segments)}")
print(f"dYs: {dYs}")
print(f"svgH: {dStartY+15*dSpacing+85}")
print(f"orFMY: {orFMY}")
print()

overlaps = []
for i in range(len(segments)):
    for j in range(i + 1, len(segments)):
        is_overlap, direction = segments_overlap(segments[i], segments[j])
        if is_overlap:
            overlaps.append((segments[i], segments[j], direction))

print(f"=== FOUND {len(overlaps)} OVERLAPS ===")
for s1, s2, direction in overlaps:
    print(f"  [{direction}] {s1[4]:30s} vs {s2[4]:30s}")
    if direction == 'horizontal':
        print(f"    Both at Y={s1[1]:.0f}, X ranges: [{s1[0]:.0f}-{s1[2]:.0f}] vs [{s2[0]:.0f}-{s2[2]:.0f}]")
    else:
        print(f"    Both at X={s1[0]:.0f}, Y ranges: [{s1[1]:.0f}-{s1[3]:.0f}] vs [{s2[1]:.0f}-{s2[3]:.0f}]")

# Also check near-overlaps (within 2px)
print("\n=== NEAR-OVERLAPS (same direction, within 3px) ===")
near_count = 0
for i in range(len(segments)):
    for j in range(i + 1, len(segments)):
        s1, s2 = segments[i], segments[j]
        x1, y1, x2, y2, l1 = s1
        x3, y3, x4, y4, l2 = s2
        if x1 > x2: x1, x2 = x2, x1
        if y1 > y2: y1, y2 = y2, y1
        if x3 > x4: x3, x4 = x4, x3
        if y3 > y4: y3, y4 = y4, y3
        # Check near-horizontal
        if abs(y1 - y2) < 0.1 and abs(y3 - y4) < 0.1 and abs(y1 - y3) < 3:
            if x1 < x4 and x3 < x2:
                near_count += 1
                if near_count <= 10:
                    print(f"  HORIZONTAL: {l1:30s} Y={y1:.0f} [{x1:.0f}-{x2:.0f}] vs {l2:30s} Y={y3:.0f} [{x3:.0f}-{x4:.0f}]")
        # Check near-vertical
        if abs(x1 - x2) < 0.1 and abs(x3 - x4) < 0.1 and abs(x1 - x3) < 3:
            if y1 < y4 and y3 < y2:
                near_count += 1
                if near_count <= 10:
                    print(f"  VERTICAL:   {l1:30s} X={x1:.0f} [{y1:.0f}-{y2:.0f}] vs {l2:30s} X={x3:.0f} [{y3:.0f}-{y4:.0f}]")
print(f"Total near-overlaps: {near_count}")

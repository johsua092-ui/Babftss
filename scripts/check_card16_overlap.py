'''Wire overlap checker for Card 16 (8:1 Demux) — CircuitDiagram16.jsx (FIXED version)'''

import math

# === LAYOUT CONSTANTS (from CircuitDiagram16.jsx) ===
gateSpacing = 85
startMY = 90
and3SX = 270
and3W = 28
and3AR = 22
and3HH = 22
and3EX = and3SX + and3W + and3AR  # 320

and2SX = 385
and2W = 24
and2AR = 18
and2HH = 14
_and2h = math.sqrt(and2AR**2 - and2HH**2)
and2RightX = round(and2SX + and2W + _and2h)  # ~415
and2OffsetY = 32

notSX = 82
notHH_g = 16
notTriW = 30
notBubR = 5
notEX = notSX + notTriW + notBubR * 2  # 122

sJX = 65

busX = {'s2p': 148, 's2d': 163, 's1p': 178, 's1d': 193, 's0p': 208, 's0d': 223}

decodeOutLane = 335
dTrunkX = 350

# === GATE POSITIONS ===
gates = []
for i in range(8):
    my = startMY + i * gateSpacing
    gates.append({
        'my': my,
        'a3': {
            'ty': my - and3HH, 'by': my + and3HH,
            'topIn': my - 17, 'midIn': my, 'botIn': my + 17,
        },
        'a2': {
            'my': my + and2OffsetY,
            'ty': my + and2OffsetY - and2HH,
            'by': my + and2OffsetY + and2HH,
            'topIn': my + and2OffsetY - 7,
            'botIn': my + and2OffsetY + 7,
        },
    })

dY = gates[0]['my']   # 90
s0Y = gates[2]['my']  # 260
s1Y = gates[4]['my']  # 430
s2Y = gates[6]['my']  # 600

# === DECODE MAP ===
gMap = []
for i in range(8):
    b2 = (i >> 2) & 1
    b1 = (i >> 1) & 1
    b0 = i & 1
    gMap.append({
        'top': b2 and 's2d' or 's2p',
        'mid': b1 and 's1d' or 's1p',
        'bot': b0 and 's0d' or 's0p',
    })

segments = []

def add_seg(x1, y1, x2, y2, label):
    segments.append((x1, y1, x2, y2, label))

# === D ROUTING (FIXED: detour above bus) ===
add_seg(47, dY, 140, dY, 'D_h1')
add_seg(140, 55, 140, dY, 'D_v_up')
add_seg(140, 55, dTrunkX, 55, 'D_h2_above_bus')
add_seg(dTrunkX, 55, dTrunkX, gates[7]['a2']['botIn'], 'D_trunk_v')
for i, g in enumerate(gates):
    add_seg(dTrunkX, g['a2']['botIn'], and2SX, g['a2']['botIn'], f'D_branch_{i}')

# === S INPUTS ===
add_seg(47, s0Y, sJX, s0Y, 'S0_input')
add_seg(sJX, s0Y, notSX, s0Y, 'S0_to_not')
add_seg(47, s1Y, sJX, s1Y, 'S1_input')
add_seg(sJX, s1Y, notSX, s1Y, 'S1_to_not')
add_seg(47, s2Y, sJX, s2Y, 'S2_input')
add_seg(sJX, s2Y, notSX, s2Y, 'S2_to_not')

# === S0 DIRECT BUS ===
add_seg(sJX, s0Y, sJX, gates[1]['a3']['botIn'], 'S0_dir_v1')
add_seg(sJX, gates[1]['a3']['botIn'], busX['s0d'], gates[1]['a3']['botIn'], 'S0_dir_h1')
add_seg(busX['s0d'], gates[1]['a3']['botIn'], busX['s0d'], gates[7]['a3']['botIn'], 'S0_dir_trunk')

# === S1 DIRECT BUS (detour) ===
add_seg(sJX, s1Y, sJX, s1Y + notHH_g + 2, 'S1_dir_v1')
add_seg(sJX, s1Y + notHH_g + 2, 133, s1Y + notHH_g + 2, 'S1_dir_h1')
add_seg(133, s1Y + notHH_g + 2, 133, gates[7]['a3']['midIn'], 'S1_dir_v2')
add_seg(133, gates[7]['a3']['midIn'], busX['s1d'], gates[7]['a3']['midIn'], 'S1_dir_h2')
add_seg(busX['s1d'], gates[7]['a3']['midIn'], busX['s1d'], gates[2]['a3']['midIn'], 'S1_dir_trunk')

# === S2 DIRECT BUS (detour) ===
add_seg(sJX, s2Y, sJX, s2Y + notHH_g + 2, 'S2_dir_v1')
add_seg(sJX, s2Y + notHH_g + 2, 140, s2Y + notHH_g + 2, 'S2_dir_h1')
add_seg(140, s2Y + notHH_g + 2, 140, gates[7]['a3']['topIn'], 'S2_dir_v2')
add_seg(140, gates[7]['a3']['topIn'], busX['s2d'], gates[7]['a3']['topIn'], 'S2_dir_h2')
add_seg(busX['s2d'], gates[7]['a3']['topIn'], busX['s2d'], gates[4]['a3']['topIn'], 'S2_dir_trunk')

# === NOT OUTPUT TRUNKS (FIXED) ===
# S2': M 122,600 H 148 V 73 (all gates above, single path OK)
add_seg(notEX, s2Y, busX['s2p'], s2Y, 'S2p_not_h')
add_seg(busX['s2p'], gates[0]['a3']['topIn'], busX['s2p'], s2Y, 'S2p_trunk')

# S1': M 122,430 H 178 (horizontal) + trunk UP (430->90) + trunk DOWN (430->515)
add_seg(notEX, s1Y, busX['s1p'], s1Y, 'S1p_not_h')
add_seg(busX['s1p'], gates[0]['a3']['midIn'], busX['s1p'], s1Y, 'S1p_trunk_up')
add_seg(busX['s1p'], s1Y, busX['s1p'], gates[5]['a3']['midIn'], 'S1p_trunk_down')

# S0': M 122,260 H 135 V 248 H 208 (detour) + trunk UP (248->107) + trunk DOWN (248->617)
add_seg(notEX, s0Y, 135, s0Y, 'S0p_not_h1')  # H 122-135 at y=260
add_seg(135, 248, 135, s0Y, 'S0p_not_v1')  # V 248-260 at x=135
add_seg(135, 248, busX['s0p'], 248, 'S0p_not_h2')  # H 135-208 at y=248
add_seg(busX['s0p'], 248, busX['s0p'], gates[0]['a3']['botIn'], 'S0p_trunk_up')  # V 248-107
add_seg(busX['s0p'], 248, busX['s0p'], gates[6]['a3']['botIn'], 'S0p_trunk_down')  # V 248-617

# === BUS BRANCHES (junction dot + horizontal to AND3) ===
inputMap = {'top': 'topIn', 'mid': 'midIn', 'bot': 'botIn'}
for i in range(8):
    m = gMap[i]
    g = gates[i]['a3']
    for level in ['top', 'mid', 'bot']:
        bk = m[level]
        bx = busX[bk]
        iy = g[inputMap[level]]
        add_seg(bx, iy, and3SX, iy, f'branch_{i}_{level}_{bk}')

# === DECODE OUTPUT: AND3 -> AND2 top ===
for i, g in enumerate(gates):
    add_seg(and3EX, gates[i]['my'], decodeOutLane, gates[i]['my'], f'dec_out_h_{i}')
    add_seg(decodeOutLane, gates[i]['my'], decodeOutLane, g['a2']['topIn'], f'dec_out_v_{i}')
    add_seg(decodeOutLane, g['a2']['topIn'], and2SX, g['a2']['topIn'], f'dec_out_h2_{i}')

# === OVERLAP CHECK ===
def segs_overlap(s1, s2):
    x1, y1, x2, y2, l1 = s1
    x3, y3, x4, y4, l2 = s2
    if x1 > x2: x1, x2 = x2, x1
    if y1 > y2: y1, y2 = y2, y1
    if x3 > x4: x3, x4 = x4, x3
    if y3 > y4: y3, y4 = y4, y3
    
    # Horizontal overlap (same Y, overlapping X)
    if abs(y1 - y2) < 0.1 and abs(y3 - y4) < 0.1 and abs(y1 - y3) < 0.1:
        ox_min = max(x1, x3)
        ox_max = min(x2, x4)
        if ox_max - ox_min > 1.0:
            return True, 'horizontal'
    # Vertical overlap (same X, overlapping Y)
    if abs(x1 - x2) < 0.1 and abs(x3 - x4) < 0.1 and abs(x1 - x3) < 0.1:
        oy_min = max(y1, y3)
        oy_max = min(y2, y4)
        if oy_max - oy_min > 1.0:
            return True, 'vertical'
    return False, None

print(f"Total segments: {len(segments)}")
print()

overlaps = []
for i in range(len(segments)):
    for j in range(i + 1, len(segments)):
        is_ov, direction = segs_overlap(segments[i], segments[j])
        if is_ov:
            overlaps.append((segments[i], segments[j], direction))

if overlaps:
    print(f"=== FOUND {len(overlaps)} OVERLAPS ===")
    for s1, s2, direction in overlaps:
        print(f"  [{direction}] {s1[4]:35s} vs {s2[4]:35s}")
        if direction == 'horizontal':
            print(f"    Both at Y~{s1[1]:.0f}, X: [{s1[0]:.0f}-{s1[2]:.0f}] vs [{s2[0]:.0f}-{s2[2]:.0f}]")
        else:
            print(f"    Both at X~{s1[0]:.0f}, Y: [{s1[1]:.0f}-{s1[3]:.0f}] vs [{s2[1]:.0f}-{s2[3]:.0f}]")
    import sys; sys.exit(1)
else:
    print("=== 0 OVERLAPS — PASS ===")

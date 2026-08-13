'''Wire overlap checker for Card 15 (4:1 Demux) — CircuitDiagram15.jsx'''

# Card 15 coordinates (from updated CircuitDiagram15.jsx)
andSX = 225
andW = 28
andAR = 22
andHH = 22
andEX = andSX + andW + andAR  # 275
gateSpacing = 85
startMY = 90

andGates = []
for i in range(4):
    my = startMY + i * gateSpacing
    andGates.append({
        'my': my, 'ty': my - andHH, 'by': my + andHH,
        'topIn': my - 17, 'midIn': my, 'botIn': my + 17,
    })

dY = andGates[0]['my']   # 90
s0Y = andGates[1]['my']  # 175
s1Y = andGates[2]['my']  # 260

dJX = 65  # no longer used for D, but S junction
sJX = 65
notSX = 82
notEX = 122  # notSX + 30 + 10

dTrunkX = 148
s0pX = 163
s0dX = 178
s1pX = 193
s1dX = 208

segments = []

def add_seg(x1, y1, x2, y2, label):
    segments.append((x1, y1, x2, y2, label))

# D: input -> junction -> trunk
def add_D():
    add_seg(47, dY, dTrunkX, dY, 'D_input_to_trunk')
    add_seg(dTrunkX, dY, dTrunkX, andGates[3]['botIn'], 'D_trunk_v')
    for i, g in enumerate(andGates):
        add_seg(dTrunkX, g['botIn'], andSX, g['botIn'], f'D_branch_{i}')

# S0: input -> junction -> NOT + direct bus
def add_S0():
    add_seg(47, s0Y, sJX, s0Y, 'S0_input')
    add_seg(sJX, s0Y, notSX, s0Y, 'S0_to_not')
    add_seg(sJX, s0Y, sJX, andGates[1]['topIn'], 'S0_dir_v')
    add_seg(sJX, andGates[1]['topIn'], s0dX, andGates[1]['topIn'], 'S0_dir_h')

# S1: input -> junction -> NOT + direct bus
def add_S1():
    add_seg(47, s1Y, sJX, s1Y, 'S1_input')
    add_seg(sJX, s1Y, notSX, s1Y, 'S1_to_not')
    add_seg(sJX, s1Y, sJX, andGates[3]['midIn'], 'S1_dir_v')
    add_seg(sJX, andGates[3]['midIn'], s1dX, andGates[3]['midIn'], 'S1_dir_h')

# S0' bus: NOT output -> AND0 top, AND2 top
def add_S0p():
    add_seg(notEX, s0Y, s0pX, s0Y, 'S0p_not_to_bus')
    add_seg(s0pX, s0Y, s0pX, andGates[0]['topIn'], 'S0p_trunk_up')
    add_seg(s0pX, s0Y, s0pX, andGates[2]['topIn'], 'S0p_trunk_down')
    add_seg(s0pX, andGates[0]['topIn'], andSX, andGates[0]['topIn'], 'S0p_branch_and0')
    add_seg(s0pX, andGates[2]['topIn'], andSX, andGates[2]['topIn'], 'S0p_branch_and2')

# S0 direct bus: AND1 top, AND3 top
def add_S0d():
    add_seg(s0dX, andGates[1]['topIn'], s0dX, andGates[3]['topIn'], 'S0d_trunk')
    add_seg(s0dX, andGates[1]['topIn'], andSX, andGates[1]['topIn'], 'S0d_branch_and1')
    add_seg(s0dX, andGates[3]['topIn'], andSX, andGates[3]['topIn'], 'S0d_branch_and3')

# S1' bus: NOT output -> AND0 mid, AND1 mid
def add_S1p():
    add_seg(notEX, s1Y, s1pX, s1Y, 'S1p_not_to_bus')
    add_seg(s1pX, s1Y, s1pX, andGates[0]['midIn'], 'S1p_trunk_up')
    add_seg(s1pX, andGates[0]['midIn'], andSX, andGates[0]['midIn'], 'S1p_branch_and0')
    add_seg(s1pX, andGates[1]['midIn'], andSX, andGates[1]['midIn'], 'S1p_branch_and1')

# S1 direct bus: AND2 mid, AND3 mid
def add_S1d():
    add_seg(s1dX, andGates[3]['midIn'], s1dX, andGates[2]['midIn'], 'S1d_trunk')
    add_seg(s1dX, andGates[3]['midIn'], andSX, andGates[3]['midIn'], 'S1d_branch_and3')
    add_seg(s1dX, andGates[2]['midIn'], andSX, andGates[2]['midIn'], 'S1d_branch_and2')

add_D()
add_S0()
add_S1()
add_S0p()
add_S0d()
add_S1p()
add_S1d()

def segments_overlap(s1, s2):
    x1, y1, x2, y2, l1 = s1
    x3, y3, x4, y4, l2 = s2
    if x1 > x2: x1, x2 = x2, x1
    if y1 > y2: y1, y2 = y2, y1
    if x3 > x4: x3, x4 = x4, x3
    if y3 > y4: y3, y4 = y4, y3
    # Horizontal overlap
    if abs(y1 - y2) < 0.1 and abs(y3 - y4) < 0.1 and abs(y1 - y3) < 0.1:
        if x1 < x4 and x3 < x2:
            return True, 'horizontal'
    # Vertical overlap
    if abs(x1 - x2) < 0.1 and abs(x3 - x4) < 0.1 and abs(x1 - x3) < 0.1:
        if y1 < y4 and y3 < y2:
            return True, 'vertical'
    return False, None

print(f"Total segments: {len(segments)}")
print()

overlaps = []
for i in range(len(segments)):
    for j in range(i + 1, len(segments)):
        is_overlap, direction = segments_overlap(segments[i], segments[j])
        if is_overlap:
            overlaps.append((segments[i], segments[j], direction))

if overlaps:
    print(f"=== FOUND {len(overlaps)} OVERLAPS ===")
    for s1, s2, direction in overlaps:
        print(f"  [{direction}] {s1[4]:30s} vs {s2[4]:30s}")
        if direction == 'horizontal':
            print(f"    Both at Y={s1[1]:.0f}, X ranges: [{s1[0]:.0f}-{s1[2]:.0f}] vs [{s2[0]:.0f}-{s2[2]:.0f}]")
        else:
            print(f"    Both at X={s1[0]:.0f}, Y ranges: [{s1[1]:.0f}-{s1[3]:.0f}] vs [{s2[1]:.0f}-{s2[3]:.0f}]")
else:
    print("=== 0 OVERLAPS — PASS ===")

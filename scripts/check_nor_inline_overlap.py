#!/usr/bin/env python3
"""Quick wire-overlap sanity check for new Card 16/17 (NOR inline version).

Verifies that key vertical wire lanes don't overlap each other, and that
labels sit clear of wires. Mirrors the manual layout reasoning done in
Bagian 25 memory.md.
"""

# Common layout (shared Card 16/17 — only AND2 my differs)
NOR_SX = 350
NOR1_MY = 130
NOR2_MY = 230
NOR1_TY, NOR1_BY = NOR1_MY - 18, NOR1_MY + 18  # 112, 148
NOR2_TY, NOR2_BY = NOR2_MY - 18, NOR2_MY + 18  # 212, 248
NOR_EX = NOR_SX + 55  # 405

S_LANE_X = 290
R_LANE_X = 310
FB_LEFT_X = 325
FB_TOP_Y = 90
FB_BOT_Y = 275
FB_RIGHT_Q = 425
FB_RIGHT_QBAR = 440

Q_OUT_X, Q_OUT_Y = 550, 130
QBAR_OUT_X, QBAR_OUT_Y = 550, 230

AND1_EXIT_X = 255  # andSx(210) + andW(45)
AND1_MY = 105
AND2_MY_16 = 245  # Card 16
AND2_MY_17 = 255  # Card 17


def seg_overlap(a_start, a_end, b_start, b_end):
    """Return True if [a_start,a_end] and [b_start,b_end] overlap (both inclusive)."""
    lo = max(min(a_start, a_end), min(b_start, b_end))
    hi = min(max(a_start, a_end), max(b_start, b_end))
    return lo <= hi


def check_common_layout(label, and2_my):
    print(f"\n=== {label} (AND2 my={and2_my}) ===")

    # Vertical wire segments at each X lane:
    # - S wire at S_LANE_X: from AND1 my (105) to NOR2_BY (248)
    # - R wire at R_LANE_X: from AND2 my to NOR1_TY (112)
    # - Q fb at FB_RIGHT_Q (425): from NOR1_MY (130) to FB_BOT_Y (275)
    # - Q̄ fb at FB_RIGHT_QBAR (440): from NOR2_MY (230) to FB_TOP_Y (90)
    # - Q fb at FB_LEFT_X (325): from FB_BOT_Y (275) to NOR2_TY (212)
    # - Q̄ fb at FB_LEFT_X (325): from FB_TOP_Y (90) to NOR1_BY (148)

    verticals = {
        'S wire (x=290)': (S_LANE_X, AND1_MY, NOR2_BY),
        'R wire (x=310)': (R_LANE_X, and2_my, NOR1_TY),
        'Q fb outer (x=425)': (FB_RIGHT_Q, NOR1_MY, FB_BOT_Y),
        'Q̄ fb outer (x=440)': (FB_RIGHT_QBAR, NOR2_MY, FB_TOP_Y),
        'Q fb inner (x=325)': (FB_LEFT_X, FB_BOT_Y, NOR2_TY),
        'Q̄ fb inner (x=325)': (FB_LEFT_X, FB_TOP_Y, NOR1_BY),
    }

    # Check pairs at SAME X — those would actually overlap
    print("\n-- Same-X vertical pairs (true overlaps if Y ranges intersect) --")
    same_x_pairs = [
        ('Q fb inner (x=325)', 'Q̄ fb inner (x=325)'),
    ]
    found_overlap = False
    for a, b in same_x_pairs:
        ax, ay1, ay2 = verticals[a]
        bx, by1, by2 = verticals[b]
        if seg_overlap(ay1, ay2, by1, by2):
            print(f"  OVERLAP: {a} Y=[{ay1},{ay2}] vs {b} Y=[{by1},{by2}]")
            found_overlap = True
        else:
            print(f"  OK: {a} Y=[{ay1},{ay2}] vs {b} Y=[{by1},{by2}] — no Y overlap")
    if not found_overlap:
        print("  -> No same-X overlaps.")

    # Cross-X intersections (where a vertical crosses a horizontal at a point that
    # is NOT a junction). These are "wire crossings" without connection — acceptable
    # as long as we don't accidentally place a junction dot there.
    print("\n-- Cross-X intersections (acceptable wire crossings, no junction) --")
    # Q fb outer vertical at x=425, Y=[130, 275] crosses Q̄ output wire (Y=230, X=[411,535])
    # Q̄ fb outer vertical at x=440, Y=[230, 90] crosses Q output wire (Y=130, X=[411,535])
    crossings = [
        ('Q fb outer vertical x=425', 'Q̄ output wire y=230 x=[411,535]', 425, 230),
        ('Q̄ fb outer vertical x=440', 'Q output wire y=130 x=[411,535]', 440, 130),
    ]
    for a, b, cx, cy in crossings:
        print(f"  {a} x {b} at point ({cx},{cy}) — crossing, no junction (different colors)")

    # Label clearance checks
    print("\n-- Label clearances --")
    # S label at (267, 97) text-anchor=start, ~7px wide -> x=[267,274]
    # R label at (267, and2_my - 8) -> y = and2_my - 8
    # NOR1 label at (340, 133) text-anchor=end, ~24px wide -> x=[316,340]
    # NOR2 label at (340, 233) text-anchor=end, ~24px wide -> x=[316,340]
    # Q fb label at (375, 269) text-anchor=middle, ~9px wide -> x=[371,379]
    # Q̄ fb label at (382, 84) text-anchor=middle, ~9px wide -> x=[378,386]

    s_label = (267, 274, 97)
    r_label = (267, 274, and2_my - 8)
    nor1_label = (316, 340, 133)
    nor2_label = (316, 340, 233)
    qfb_label = (371, 379, 269)
    qbfb_label = (378, 386, 84)

    # S wire horizontal at y=105, x=[255, 290]
    # R wire horizontal at y=and2_my, x=[255, 310]
    if s_label[2] == 105:
        print(f"  WARN: S label y={s_label[2]} same as S wire y=105")
    else:
        print(f"  OK: S label y={s_label[2]} (S wire y=105, Δ={105 - s_label[2]})")

    if r_label[2] == and2_my:
        print(f"  WARN: R label y={r_label[2]} same as R wire y={and2_my}")
    else:
        print(f"  OK: R label y={r_label[2]} (R wire y={and2_my}, Δ={and2_my - r_label[2]})")

    # NOR1 label vs R wire vertical at x=310
    # R wire vertical at x=310, Y=[112, 245_or_255]
    if seg_overlap(nor1_label[0], nor1_label[1], 310, 310):
        print(f"  WARN: NOR1 label x=[{nor1_label[0]},{nor1_label[1]}] overlaps R wire x=310")
    else:
        print(f"  OK: NOR1 label x=[{nor1_label[0]},{nor1_label[1]}] clear of R wire x=310")

    # NOR2 label vs S wire vertical at x=290
    if seg_overlap(nor2_label[0], nor2_label[1], 290, 290):
        print(f"  WARN: NOR2 label x=[{nor2_label[0]},{nor2_label[1]}] overlaps S wire x=290")
    else:
        print(f"  OK: NOR2 label x=[{nor2_label[0]},{nor2_label[1]}] clear of S wire x=290")

    # Q fb label vs Q fb horizontal segment at y=275, x=[325, 425]
    if qfb_label[2] == 275:
        print(f"  WARN: Q fb label y={qfb_label[2]} same as Q fb horizontal y=275")
    else:
        print(f"  OK: Q fb label y={qfb_label[2]} (Q fb horizontal y=275, Δ={275 - qfb_label[2]})")

    # Q̄ fb label vs Q̄ fb horizontal segment at y=90, x=[325, 440]
    if qbfb_label[2] == 90:
        print(f"  WARN: Q̄ fb label y={qbfb_label[2]} same as Q̄ fb horizontal y=90")
    else:
        print(f"  OK: Q̄ fb label y={qbfb_label[2]} (Q̄ fb horizontal y=90, Δ={90 - qbfb_label[2]})")

    # NOR1/NOR2 label vs NOR1/NOR2 gate body (NOR1 spans x=[350, 405], y=[112, 148])
    if seg_overlap(nor1_label[0], nor1_label[1], 350, 405):
        print(f"  WARN: NOR1 label x=[{nor1_label[0]},{nor1_label[1]}] overlaps NOR1 gate body x=[350,405]")
    else:
        print(f"  OK: NOR1 label x=[{nor1_label[0]},{nor1_label[1]}] clear of NOR1 gate body x=[350,405]")


check_common_layout("Card 16 (Gated D Latch)", AND2_MY_16)
check_common_layout("Card 17 (SR Flip-Flop)", AND2_MY_17)

print("\n=== Done ===")

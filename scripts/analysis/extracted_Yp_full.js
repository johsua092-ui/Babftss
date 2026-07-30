function Yp({
    icon: i,
    color: a,
    size: o = 36
}) {
    const m = `drop-shadow(0 0 4px rgba(${fa(a)},0.75))`,
        l = o,
        c = l / 2,
        d = l / 2,
        r = p => p.toFixed(1);
    switch (i) {
        case "spur":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 8),
                    fill: a,
                    opacity: "0.92",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: c,
                    cy: d,
                    r: l * .12,
                    fill: "#0f172a"
                })]
            });
        case "helical":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 10),
                    fill: a,
                    opacity: "0.88",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: c,
                    cy: d,
                    r: l * .12,
                    fill: "#0f172a"
                }), [-l * .08, 0, l * .08].map((p, x) => y.jsx("line", {
                    x1: c - l * .1 + p,
                    y1: d - l * .18,
                    x2: c + l * .1 + p,
                    y2: d + l * .18,
                    stroke: "#0f172a",
                    strokeWidth: "1.8",
                    opacity: "0.7"
                }, x))]
            });
        case "herring":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 10),
                    fill: a,
                    opacity: "0.88",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: c,
                    cy: d,
                    r: l * .12,
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: `M ${c-l*.1} ${d-l*.14} L ${c} ${d} L ${c+l*.1} ${d-l*.14}`,
                    fill: "none",
                    stroke: "#0f172a",
                    strokeWidth: "1.8"
                }), y.jsx("path", {
                    d: `M ${c-l*.1} ${d+l*.14} L ${c} ${d} L ${c+l*.1} ${d+l*.14}`,
                    fill: "none",
                    stroke: "#0f172a",
                    strokeWidth: "1.8"
                })]
            });
        case "worm":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("rect", {
                    x: l * .04,
                    y: d - l * .12,
                    width: l * .6,
                    height: l * .24,
                    rx: l * .06,
                    fill: a,
                    opacity: "0.45"
                }), [.1, .22, .34, .46, .58].map((p, x) => y.jsx("path", {
                    d: `M ${r(l*p)} ${r(d-l*.12)} Q ${r(l*(p+.05))} ${r(d)} ${r(l*p)} ${r(d+l*.12)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2.2",
                    style: {
                        filter: m
                    }
                }, x)), y.jsx("circle", {
                    cx: l * .82,
                    cy: d,
                    r: l * .15,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2",
                    style: {
                        filter: m
                    }
                }), [0, 60, 120, 180, 240, 300].map(p => {
                    const x = p * Math.PI / 180,
                        g = l * .82 + l * .15 * Math.cos(x),
                        S = d + l * .15 * Math.sin(x);
                    return y.jsx("rect", {
                        x: g - 1.8,
                        y: S - 3.5,
                        width: "3.6",
                        height: "7",
                        rx: "0.8",
                        fill: a,
                        style: {
                            filter: m
                        },
                        transform: `rotate(${p},${r(g)},${r(S)})`
                    }, p)
                })]
            });
        case "rack":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("rect", {
                    x: l * .02,
                    y: d + l * .05,
                    width: l * .68,
                    height: l * .2,
                    rx: "2",
                    fill: a,
                    opacity: "0.7",
                    style: {
                        filter: m
                    }
                }), [.06, .14, .22, .3, .38, .46, .54, .62].map((p, x) => y.jsx("rect", {
                    x: l * p,
                    y: d - l * .12,
                    width: l * .06,
                    height: l * .17,
                    rx: "1",
                    fill: a,
                    style: {
                        filter: m
                    }
                }, x)), y.jsx("circle", {
                    cx: l * .83,
                    cy: d - l * .04,
                    r: l * .13,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2",
                    style: {
                        filter: m
                    }
                }), [0, 45, 90, 135, 180, 225, 270, 315].map(p => {
                    const x = p * Math.PI / 180,
                        g = l * .83 + l * .13 * Math.cos(x),
                        S = d - l * .04 + l * .13 * Math.sin(x);
                    return y.jsx("rect", {
                        x: g - 2,
                        y: S - 2,
                        width: "4",
                        height: "4",
                        fill: a,
                        transform: `rotate(${p},${r(g)},${r(S)})`
                    }, p)
                })]
            });
        case "bevel":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.06)} ${r(d+l*.2)} L ${r(l*.5)} ${r(d+l*.02)} L ${r(l*.5)} ${r(d-l*.2)} L ${r(l*.06)} ${r(d-l*.02)} Z`,
                    fill: a,
                    opacity: "0.7",
                    style: {
                        filter: m
                    }
                }), [0, 1, 2, 3].map(p => {
                    const x = p / 3,
                        g = l * .06 + x * l * .44,
                        S = d + l * .2 - x * l * .22;
                    return y.jsx("rect", {
                        x: g,
                        y: S,
                        width: "4",
                        height: "6",
                        fill: a,
                        opacity: "0.9"
                    }, p)
                }), y.jsx("path", {
                    d: `M ${r(l*.5)} ${r(l*.06)} L ${r(l*.5+l*.18)} ${r(d+l*.04)} L ${r(l*.5+l*.01)} ${r(d+l*.04)} L ${r(l*.5-l*.01)} ${r(l*.06)} Z`,
                    fill: a,
                    opacity: "0.5"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d + l * .02),
                    r: l * .04,
                    fill: a,
                    style: {
                        filter: m
                    }
                })]
            });
        case "miter":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.06)} ${r(d+l*.18)} L ${r(l*.5)} ${r(d)} L ${r(l*.5)} ${r(d-l*.18)} L ${r(l*.06)} ${r(d-l*0)} Z`,
                    fill: a,
                    opacity: "0.75",
                    style: {
                        filter: m
                    }
                }), y.jsx("path", {
                    d: `M ${r(l*.5-l*.18)} ${r(l*.06)} L ${r(l*.5)} ${r(d)} L ${r(l*.5+l*.18)} ${r(d)} L ${r(l*.5+l*0)} ${r(l*.06)} Z`,
                    fill: a,
                    opacity: "0.55"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d),
                    r: l * .05,
                    fill: a,
                    style: {
                        filter: m
                    }
                })]
            });
        case "spiralbev":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.08)} ${r(d+l*.18)} L ${r(l*.5)} ${r(d+l*.02)} L ${r(l*.5)} ${r(d-l*.18)} L ${r(l*.08)} ${r(d-l*.02)} Z`,
                    fill: a,
                    opacity: "0.5"
                }), [0, 1, 2].map(p => y.jsx("path", {
                    d: `M ${r(l*(.13+p*.1))} ${r(d+l*.13)} Q ${r(l*(.21+p*.1))} ${r(d)} ${r(l*(.13+p*.1))} ${r(d-l*.13)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2",
                    style: {
                        filter: m
                    }
                }, p)), y.jsx("path", {
                    d: `M ${r(l*.5)} ${r(l*.07)} L ${r(l*.5+l*.18)} ${r(l*.5+l*.04)} L ${r(l*.5+l*.02)} ${r(l*.5+l*.04)} L ${r(l*.5-l*.02)} ${r(l*.07)} Z`,
                    fill: a,
                    opacity: "0.4"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d + l * .02),
                    r: l * .04,
                    fill: a
                })]
            });
        case "hypoid":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("ellipse", {
                    cx: r(l * .35),
                    cy: r(d),
                    rx: r(l * .3),
                    ry: r(l * .18),
                    fill: a,
                    opacity: "0.5",
                    style: {
                        filter: m
                    }
                }), [0, 60, 120, 180, 240, 300].map(p => {
                    const x = p * Math.PI / 180,
                        g = l * .35 + l * .3 * Math.cos(x),
                        S = d + l * .18 * Math.sin(x);
                    return y.jsx("rect", {
                        x: g - 2,
                        y: S - 3,
                        width: "4",
                        height: "6",
                        rx: "0.8",
                        fill: a,
                        opacity: "0.9",
                        transform: `rotate(${p},${r(g)},${r(S)})`
                    }, p)
                }), y.jsx("circle", {
                    cx: r(l * .78),
                    cy: r(d - l * .12),
                    r: r(l * .13),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(l * .78),
                    cy: r(d - l * .12),
                    r: r(l * .05),
                    fill: a
                })]
            });
        case "crown":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d + l * .12),
                    rx: r(l * .38),
                    ry: r(l * .12),
                    fill: a,
                    opacity: "0.55",
                    style: {
                        filter: m
                    }
                }), [0, 45, 90, 135, 180, 225, 270, 315].map(p => {
                    const x = p * Math.PI / 180,
                        g = c + l * .3 * Math.cos(x);
                    return y.jsx("rect", {
                        x: r(g - 2),
                        y: r(d),
                        width: "4",
                        height: r(l * .14),
                        rx: "1",
                        fill: a,
                        style: {
                            filter: m
                        }
                    }, p)
                }), y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d + l * .12),
                    rx: r(l * .18),
                    ry: r(l * .06),
                    fill: "#0f172a"
                })]
            });
        case "planet":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .44),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "3",
                    opacity: "0.4"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .12),
                    fill: a,
                    opacity: "0.9",
                    style: {
                        filter: m
                    }
                }), [0, 120, 240].map(p => {
                    const x = p * Math.PI / 180,
                        g = c + l * .27 * Math.cos(x),
                        S = d + l * .27 * Math.sin(x);
                    return y.jsx("circle", {
                        cx: r(g),
                        cy: r(S),
                        r: r(l * .11),
                        fill: a,
                        opacity: "0.75",
                        style: {
                            filter: m
                        }
                    }, p)
                })]
            });
        case "ring":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .46),
                    fill: a,
                    opacity: "0.2"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .46),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "4",
                    opacity: "0.6",
                    style: {
                        filter: m
                    }
                }), [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(p => {
                    const x = p * Math.PI / 180;
                    return y.jsx("line", {
                        x1: r(c + l * .34 * Math.cos(x)),
                        y1: r(d + l * .34 * Math.sin(x)),
                        x2: r(c + l * .46 * Math.cos(x)),
                        y2: r(d + l * .46 * Math.sin(x)),
                        stroke: "#0f172a",
                        strokeWidth: "2.2"
                    }, p)
                }), y.jsx("circle", {
                    cx: r(c + l * .2),
                    cy: r(d),
                    r: r(l * .11),
                    fill: a,
                    opacity: "0.85",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c + l * .2),
                    cy: r(d),
                    r: r(l * .04),
                    fill: "#0f172a"
                })]
            });
        case "harmonic":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .44),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.35"
                }), y.jsx("path", {
                    d: `M ${r(c+l*.36)} ${r(d)} Q ${r(c+l*.4)} ${r(d-l*.13)} ${r(c)} ${r(d-l*.23)} Q ${r(c-l*.4)} ${r(d-l*.13)} ${r(c-l*.36)} ${r(d)} Q ${r(c-l*.4)} ${r(d+l*.13)} ${r(c)} ${r(d+l*.23)} Q ${r(c+l*.4)} ${r(d+l*.13)} ${r(c+l*.36)} ${r(d)} Z`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2.8",
                    style: {
                        filter: m
                    }
                }), y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d),
                    rx: r(l * .28),
                    ry: r(l * .16),
                    fill: a,
                    opacity: "0.45"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .07),
                    fill: "#0f172a"
                })]
            });
        case "cycloid": {
            const p = [];
            for (let x = 0; x <= 48; x++) {
                const g = x / 48 * 2 * Math.PI,
                    S = l * .24,
                    j = l * .1,
                    M = c + (S + j) * Math.cos(g) - j * 1.5 * Math.cos((S + j) / j * g),
                    T = d + (S + j) * Math.sin(g) - j * 1.5 * Math.sin((S + j) / j * g);
                p.push(`${x===0?"M":"L"} ${r(M)} ${r(T)}`)
            }
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: p.join(" ") + " Z",
                    fill: a,
                    opacity: "0.78",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .1),
                    fill: "#0f172a"
                })]
            })
        }
        case "geneva": {
            const x = l * .43,
                g = l * .19,
                S = [];
            for (let j = 0; j < 4; j++) {
                const M = j * 90 * Math.PI / 180,
                    T = M - .52,
                    k = M + .52;
                j === 0 ? S.push(`M ${r(c+x*Math.cos(T))} ${r(d+x*Math.sin(T))}`) : S.push(`L ${r(c+x*Math.cos(T))} ${r(d+x*Math.sin(T))}`), S.push(`L ${r(c+g*Math.cos(M-.28))} ${r(d+g*Math.sin(M-.28))}`), S.push(`L ${r(c+g*Math.cos(M+.28))} ${r(d+g*Math.sin(M+.28))}`), S.push(`L ${r(c+x*Math.cos(k))} ${r(d+x*Math.sin(k))}`)
            }
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: S.join(" ") + " Z",
                    fill: a,
                    opacity: "0.82",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .1),
                    fill: "#0f172a"
                })]
            })
        }
        case "sector":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(c)} ${r(d)} L ${r(c+l*.42*Math.cos(-.52))} ${r(d+l*.42*Math.sin(-.52))} A ${r(l*.42)} ${r(l*.42)} 0 0,1 ${r(c+l*.42*Math.cos(2.44))} ${r(d+l*.42*Math.sin(2.44))} Z`,
                    fill: a,
                    opacity: "0.5",
                    style: {
                        filter: m
                    }
                }), [0, 1, 2, 3, 4, 5].map(p => {
                    const x = -.52 + p * .592;
                    return y.jsx("line", {
                        x1: r(c + l * .37 * Math.cos(x)),
                        y1: r(d + l * .37 * Math.sin(x)),
                        x2: r(c + l * .48 * Math.cos(x)),
                        y2: r(d + l * .48 * Math.sin(x)),
                        stroke: a,
                        strokeWidth: "4",
                        strokeLinecap: "square",
                        style: {
                            filter: m
                        }
                    }, p)
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .07),
                    fill: a,
                    style: {
                        filter: m
                    }
                })]
            });
        case "face":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d + l * .14),
                    rx: r(l * .36),
                    ry: r(l * .13),
                    fill: a,
                    opacity: "0.5",
                    style: {
                        filter: m
                    }
                }), [0, 45, 90, 135, 180, 225, 270, 315].map(p => {
                    const x = p * Math.PI / 180,
                        g = c + l * .3 * Math.cos(x);
                    return y.jsx("rect", {
                        x: r(g - 2),
                        y: r(d + l * .04),
                        width: "4",
                        height: r(l * .13),
                        rx: "1",
                        fill: a,
                        opacity: "0.9"
                    }, p)
                }), y.jsx("rect", {
                    x: r(c - l * .065),
                    y: r(d - l * .36),
                    width: r(l * .13),
                    height: r(l * .44),
                    rx: r(l * .03),
                    fill: a,
                    opacity: "0.75",
                    style: {
                        filter: m
                    }
                }), [0, 1, 2].map(p => y.jsx("rect", {
                    x: r(c - l * .12),
                    y: r(d - l * .29 + p * l * .1),
                    width: r(l * .24),
                    height: r(l * .05),
                    fill: a,
                    opacity: "0.85"
                }, p))]
            });
        case "lantern":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d - l * .18),
                    rx: r(l * .3),
                    ry: r(l * .09),
                    fill: a,
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d + l * .18),
                    rx: r(l * .3),
                    ry: r(l * .09),
                    fill: a,
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), [0, 60, 120, 180, 240, 300].map(p => {
                    const x = p * Math.PI / 180,
                        g = c + l * .22 * Math.cos(x);
                    return y.jsx("rect", {
                        x: r(g - 1.8),
                        y: r(d - l * .18),
                        width: "3.6",
                        height: r(l * .36),
                        rx: "1.8",
                        fill: a,
                        opacity: "0.88",
                        style: {
                            filter: m
                        }
                    }, p)
                })]
            });
        case "crossed":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsxs("g", {
                    opacity: "0.7",
                    style: {
                        filter: m
                    },
                    children: [y.jsx("path", {
                        d: Pt(c - l * .1, d - l * .08, l * .35, l * .24, 8),
                        fill: a
                    }), y.jsx("circle", {
                        cx: r(c - l * .1),
                        cy: r(d - l * .08),
                        r: r(l * .09),
                        fill: "#0f172a"
                    })]
                }), y.jsxs("g", {
                    opacity: "0.55",
                    children: [y.jsx("path", {
                        d: Pt(c + l * .1, d + l * .08, l * .28, l * .19, 8),
                        fill: a
                    }), y.jsx("circle", {
                        cx: r(c + l * .1),
                        cy: r(d + l * .08),
                        r: r(l * .07),
                        fill: "#0f172a"
                    })]
                }), y.jsx("line", {
                    x1: r(l * .1),
                    y1: r(l * .82),
                    x2: r(l * .9),
                    y2: r(l * .18),
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: "0.35",
                    strokeDasharray: "3,2"
                })]
            });
        case "zerol":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.06)} ${r(d+l*.2)} L ${r(l*.5)} ${r(d+l*.02)} L ${r(l*.5)} ${r(d-l*.2)} L ${r(l*.06)} ${r(d-l*.02)} Z`,
                    fill: a,
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), y.jsx("path", {
                    d: `M ${r(l*.12)} ${r(d+l*.12)} Q ${r(l*.31)} ${r(d)} ${r(l*.12)} ${r(d-l*.12)}`,
                    fill: "none",
                    stroke: "#0f172a",
                    strokeWidth: "2",
                    opacity: "0.9"
                }), y.jsx("path", {
                    d: `M ${r(l*.5)} ${r(l*.07)} L ${r(l*.5+l*.18)} ${r(d+l*.04)} L ${r(l*.5+l*.02)} ${r(d+l*.04)} L ${r(l*.5-l*.02)} ${r(l*.07)} Z`,
                    fill: a,
                    opacity: "0.45"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d + l * .02),
                    r: l * .04,
                    fill: a
                })]
            });
        case "globoid":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.04)} ${r(d-l*.14)} Q ${r(l*.18)} ${r(d-l*.08)} ${r(l*.04)} ${r(d+l*.14)} Q ${r(l*.18)} ${r(d+l*.08)} ${r(l*.36)} ${r(d+l*.14)} Q ${r(l*.22)} ${r(d+l*.08)} ${r(l*.36)} ${r(d-l*.14)} Q ${r(l*.22)} ${r(d-l*.08)} ${r(l*.04)} ${r(d-l*.14)} Z`,
                    fill: a,
                    opacity: "0.45"
                }), [.1, .2, .3].map((p, x) => y.jsx("path", {
                    d: `M ${r(l*p)} ${r(d-l*.14+l*.02*x)} Q ${r(l*(p+.04))} ${r(d)} ${r(l*p)} ${r(d+l*.14-l*.02*x)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.8",
                    style: {
                        filter: m
                    }
                }, x)), y.jsx("circle", {
                    cx: r(l * .76),
                    cy: r(d),
                    r: r(l * .2),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2.5",
                    opacity: "0.6",
                    style: {
                        filter: m
                    }
                }), [0, 45, 90, 135, 180, 225, 270, 315].map(p => {
                    const x = p * Math.PI / 180;
                    return y.jsx("line", {
                        x1: r(l * .76 + l * .15 * Math.cos(x)),
                        y1: r(d + l * .15 * Math.sin(x)),
                        x2: r(l * .76 + l * .22 * Math.cos(x)),
                        y2: r(d + l * .22 * Math.sin(x)),
                        stroke: a,
                        strokeWidth: "2",
                        style: {
                            filter: m
                        }
                    }, p)
                })]
            });
        case "ratchet":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c - l * .04, d, l * .38, l * .28, 10),
                    fill: a,
                    opacity: "0.7",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c - l * .04),
                    cy: r(d),
                    r: r(l * .1),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: `M ${r(c+l*.24)} ${r(d-l*.28)} L ${r(c+l*.38)} ${r(d-l*.1)} L ${r(c+l*.3)} ${r(d-l*.08)} Z`,
                    fill: a,
                    opacity: "0.9",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c + l * .36),
                    cy: r(d - l * .25),
                    r: l * .04,
                    fill: a,
                    style: {
                        filter: m
                    }
                }), y.jsx("line", {
                    x1: r(c + l * .36),
                    y1: r(d - l * .25),
                    x2: r(c + l * .38),
                    y2: r(d - l * .1),
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.6"
                })]
            });
        case "sprocket":
            return y.jsx("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: (() => {
                    const x = l * .43,
                        g = l * .32,
                        S = l * .12,
                        j = 2 * Math.PI / 9;
                    let M = "";
                    for (let T = 0; T < 9; T++) {
                        const k = T * j - Math.PI / 2,
                            R = k - j * .22,
                            L = k + j * .22,
                            [C, N] = [c + g * Math.cos(R), d + g * Math.sin(R)],
                            [q, I] = [c + x * Math.cos(k), d + x * Math.sin(k)],
                            [P, Q] = [c + g * Math.cos(L), d + g * Math.sin(L)];
                        T === 0 && (M += `M ${r(C)} ${r(N)} `), M += `L ${r(q)} ${r(I)} L ${r(P)} ${r(Q)} A ${r(g)} ${r(g)} 0 0,1 ${r(c+g*Math.cos(L+j*.56))} ${r(d+g*Math.sin(L+j*.56))} `
                    }
                    return M += "Z", y.jsxs(y.Fragment, {
                        children: [y.jsx("path", {
                            d: M,
                            fill: a,
                            opacity: "0.82",
                            style: {
                                filter: m
                            }
                        }), y.jsx("circle", {
                            cx: r(c),
                            cy: r(d),
                            r: r(S),
                            fill: "#0f172a"
                        }), [0, 40, 80, 120, 160, 200, 240, 280, 320].map(T => {
                            const k = T * Math.PI / 180;
                            return y.jsx("circle", {
                                cx: r(c + (g + l * .06) * Math.cos(k)),
                                cy: r(d + (g + l * .06) * Math.sin(k)),
                                r: "2.2",
                                fill: "#0f172a",
                                opacity: "0.6"
                            }, T)
                        })]
                    })
                })()
            });
        case "elliptical":
            return y.jsx("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: (() => {
                    const p = [];
                    for (let g = 0; g <= 48; g++) {
                        const S = g / 48 * 2 * Math.PI,
                            j = l * .42,
                            M = l * .26,
                            T = l * .055 * Math.sin(10 * S),
                            k = c + (j + T) * Math.cos(S),
                            R = d + (M + T) * Math.sin(S);
                        p.push(`${g===0?"M":"L"} ${r(k)} ${r(R)}`)
                    }
                    return y.jsxs(y.Fragment, {
                        children: [y.jsx("path", {
                            d: p.join(" ") + " Z",
                            fill: a,
                            opacity: "0.75",
                            style: {
                                filter: m
                            }
                        }), y.jsx("ellipse", {
                            cx: r(c),
                            cy: r(d),
                            rx: r(l * .15),
                            ry: r(l * .09),
                            fill: "#0f172a"
                        })]
                    })
                })()
            });
        case "magnetic":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 8),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "2",
                    opacity: "0.7",
                    style: {
                        filter: m
                    }
                }), y.jsx("path", {
                    d: `M ${r(c-l*.19)} ${r(d)} A ${r(l*.19)} ${r(l*.19)} 0 0,1 ${r(c+l*.19)} ${r(d)} Z`,
                    fill: a,
                    opacity: "0.55"
                }), y.jsx("path", {
                    d: `M ${r(c-l*.19)} ${r(d)} A ${r(l*.19)} ${r(l*.19)} 0 0,0 ${r(c+l*.19)} ${r(d)} Z`,
                    fill: "#0f172a",
                    opacity: "0.6"
                }), [l * .27, l * .35].map((p, x) => y.jsx("path", {
                    d: `M ${r(c-p)} ${r(d)} A ${r(p)} ${r(p)} 0 0,1 ${r(c+p)} ${r(d)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: .5 - x * .15,
                    strokeDasharray: "3,2"
                }, x)), y.jsx("line", {
                    x1: r(c),
                    y1: r(d - l * .19),
                    x2: r(c),
                    y2: r(d + l * .19),
                    stroke: "#0f172a",
                    strokeWidth: "1.5"
                })]
            });
        case "nutating":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("line", {
                    x1: r(c),
                    y1: r(l * .06),
                    x2: r(c),
                    y2: r(l * .94),
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: "0.3",
                    strokeDasharray: "3,2"
                }), y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d),
                    rx: r(l * .36),
                    ry: r(l * .13),
                    fill: a,
                    opacity: "0.55",
                    style: {
                        filter: m
                    },
                    transform: `rotate(-28,${r(c)},${r(d)})`
                }), [0, 40, 80, 120, 160, 200, 240, 280, 320].map(p => {
                    const x = (p - 28) * Math.PI / 180,
                        g = c + l * .36 * Math.cos(x),
                        S = d + l * .13 * Math.sin(x);
                    return y.jsx("rect", {
                        x: r(g - 2),
                        y: r(S - 3),
                        width: "4",
                        height: "6",
                        rx: "1",
                        fill: a,
                        opacity: "0.85",
                        style: {
                            filter: m
                        },
                        transform: `rotate(${p-28},${r(g)},${r(S)})`
                    }, p)
                }), y.jsx("ellipse", {
                    cx: r(c),
                    cy: r(d + l * .3),
                    rx: r(l * .07),
                    ry: r(l * .04),
                    fill: a,
                    opacity: "0.6",
                    style: {
                        filter: m
                    }
                }), y.jsx("line", {
                    x1: r(c),
                    y1: r(d),
                    x2: r(c),
                    y2: r(d + l * .3),
                    stroke: a,
                    strokeWidth: "2.5",
                    opacity: "0.5"
                })]
            });
        case "antibl":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .42, l * .3, 10),
                    fill: a,
                    opacity: "0.38"
                }), y.jsx("path", {
                    d: Pt(c, d, l * .42, l * .3, 10),
                    fill: a,
                    opacity: "0.75",
                    style: {
                        filter: m
                    },
                    transform: `rotate(18,${r(c)},${r(d)})`
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .12),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: `M ${r(c+l*.14)} ${r(d)} Q ${r(c+l*.2)} ${r(d-l*.08)} ${r(c+l*.26)} ${r(d)} Q ${r(c+l*.32)} ${r(d+l*.08)} ${r(c+l*.38)} ${r(d)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.6"
                })]
            });
        case "compound":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(l * .19, d, l * .18, l * .12, 8),
                    fill: a,
                    opacity: "0.8",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(l * .19),
                    cy: r(d),
                    r: r(l * .05),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: Pt(l * .5, d, l * .11, l * .075, 6),
                    fill: a,
                    opacity: "0.65"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d),
                    r: r(l * .04),
                    fill: "#0f172a"
                }), y.jsx("line", {
                    x1: r(l * .19),
                    y1: r(d),
                    x2: r(l * .5),
                    y2: r(d),
                    stroke: a,
                    strokeWidth: "2",
                    opacity: "0.4"
                }), y.jsx("path", {
                    d: Pt(l * .78, d, l * .2, l * .14, 10),
                    fill: a,
                    opacity: "0.55"
                }), y.jsx("circle", {
                    cx: r(l * .78),
                    cy: r(d),
                    r: r(l * .06),
                    fill: "#0f172a"
                })]
            });
        case "idler":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(l * .17, d, l * .16, l * .11, 8),
                    fill: a,
                    opacity: "0.8",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(l * .17),
                    cy: r(d),
                    r: r(l * .05),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: Pt(l * .5, d, l * .16, l * .11, 8),
                    fill: a,
                    opacity: "0.6"
                }), y.jsx("circle", {
                    cx: r(l * .5),
                    cy: r(d),
                    r: r(l * .05),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: Pt(l * .83, d, l * .16, l * .11, 8),
                    fill: a,
                    opacity: "0.45"
                }), y.jsx("circle", {
                    cx: r(l * .83),
                    cy: r(d),
                    r: r(l * .05),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: `M ${r(l*.17)} ${r(d-l*.18)} A ${r(l*.18)} ${r(l*.18)} 0 0,1 ${r(l*.3)} ${r(d-l*.04)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: "0.5",
                    markerEnd: "url(#arr)"
                })]
            });
        case "timing":
            return y.jsx("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: (() => {
                    const x = l * .43,
                        g = l * .33,
                        S = l * .1,
                        j = 2 * Math.PI / 10,
                        M = j * .3;
                    let T = `M ${r(c+g*Math.cos(-Math.PI/2-M))} ${r(d+g*Math.sin(-Math.PI/2-M))}`;
                    for (let k = 0; k < 10; k++) {
                        const R = k * j - Math.PI / 2;
                        T += ` L ${r(c+g*Math.cos(R-M))} ${r(d+g*Math.sin(R-M))}`, T += ` L ${r(c+x*Math.cos(R-M))} ${r(d+x*Math.sin(R-M))}`, T += ` L ${r(c+x*Math.cos(R+M))} ${r(d+x*Math.sin(R+M))}`, T += ` L ${r(c+g*Math.cos(R+M))} ${r(d+g*Math.sin(R+M))}`
                    }
                    return T += " Z", y.jsxs(y.Fragment, {
                        children: [y.jsx("path", {
                            d: T,
                            fill: a,
                            opacity: "0.82",
                            style: {
                                filter: m
                            }
                        }), y.jsx("circle", {
                            cx: r(c),
                            cy: r(d),
                            r: r(S),
                            fill: "#0f172a"
                        })]
                    })
                })()
            });
        case "spiroid":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("ellipse", {
                    cx: r(l * .38),
                    cy: r(d + l * .1),
                    rx: r(l * .33),
                    ry: r(l * .12),
                    fill: a,
                    opacity: "0.45",
                    style: {
                        filter: m
                    }
                }), [0, 40, 80, 120, 160, 200, 240, 280, 320].map(p => {
                    const x = p * Math.PI / 180;
                    return y.jsx("rect", {
                        x: r(l * .38 + l * .28 * Math.cos(x) - 2),
                        y: r(d + l * .04),
                        width: "4",
                        height: l * .12,
                        rx: "1",
                        fill: a,
                        opacity: "0.85"
                    }, p)
                }), y.jsx("rect", {
                    x: r(l * .68),
                    y: r(d - l * .28),
                    width: r(l * .14),
                    height: r(l * .42),
                    rx: r(l * .04),
                    fill: a,
                    opacity: "0.45",
                    transform: `rotate(15,${r(l*.75)},${r(d)})`
                }), [0, 1, 2, 3].map(p => y.jsx("path", {
                    d: `M ${r(l*.66)} ${r(d-l*.18+p*l*.1)} Q ${r(l*.72)} ${r(d-l*.13+p*l*.1)} ${r(l*.66)} ${r(d-l*.08+p*l*.1)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.8",
                    opacity: "0.9",
                    transform: `rotate(15,${r(l*.75)},${r(d)})`,
                    style: {
                        filter: m
                    }
                }, p))]
            });
        case "skewbev":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: `M ${r(l*.06)} ${r(d+l*.17)} L ${r(l*.52)} ${r(d+l*.03)} L ${r(l*.52)} ${r(d-l*.17)} L ${r(l*.06)} ${r(d-l*.03)} Z`,
                    fill: a,
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), [0, 1, 2].map(p => {
                    const x = p / 2;
                    return y.jsx("line", {
                        x1: r(l * .12 + x * l * .36),
                        y1: r(d + l * .16 - x * l * .14),
                        x2: r(l * .12 + x * l * .36),
                        y2: r(d - l * .16 + x * l * .14),
                        stroke: "#0f172a",
                        strokeWidth: "1.5",
                        opacity: "0.5"
                    }, p)
                }), y.jsx("path", {
                    d: `M ${r(l*.55+l*.14)} ${r(l*.08)} L ${r(l*.55+l*.01)} ${r(d+l*.18)} L ${r(l*.55-l*.14)} ${r(d+l*.18)} L ${r(l*.55-l*.01)} ${r(l*.08)} Z`,
                    fill: a,
                    opacity: "0.42"
                }), y.jsx("line", {
                    x1: r(l * .52),
                    y1: r(d),
                    x2: r(l * .55),
                    y2: r(d),
                    stroke: a,
                    strokeWidth: "2",
                    strokeDasharray: "2,2",
                    opacity: "0.7"
                })]
            });
        case "cluster":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("line", {
                    x1: r(c),
                    y1: r(l * .04),
                    x2: r(c),
                    y2: r(l * .96),
                    stroke: a,
                    strokeWidth: "3",
                    opacity: "0.4"
                }), y.jsx("path", {
                    d: Pt(c, l * .22, l * .2, l * .14, 9),
                    fill: a,
                    opacity: "0.8",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(l * .22),
                    r: r(l * .05),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: Pt(c, l * .5, l * .15, l * .1, 7),
                    fill: a,
                    opacity: "0.65"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(l * .5),
                    r: r(l * .04),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: Pt(c, l * .76, l * .1, l * .07, 6),
                    fill: a,
                    opacity: "0.5"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(l * .76),
                    r: r(l * .03),
                    fill: "#0f172a"
                })]
            });
        case "trochoid":
            return y.jsx("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: (() => {
                    const p = [],
                        x = l * .18,
                        g = l * .13,
                        S = l * .22;
                    for (let M = 0; M <= 60; M++) {
                        const T = M / 60 * 2 * Math.PI,
                            k = c + (x + g) * Math.cos(T) - S * Math.cos((x + g) / g * T),
                            R = d + (x + g) * Math.sin(T) - S * Math.sin((x + g) / g * T);
                        p.push(`${M===0?"M":"L"} ${r(k)} ${r(R)}`)
                    }
                    const j = [];
                    for (let M = 0; M <= 60; M++) {
                        const T = M / 60 * 2 * Math.PI,
                            k = l * .42 + l * .04 * Math.cos(3 * T);
                        j.push(`${M===0?"M":"L"} ${r(c+k*Math.cos(T))} ${r(d+k*Math.sin(T))}`)
                    }
                    return y.jsxs(y.Fragment, {
                        children: [y.jsx("path", {
                            d: j.join(" ") + " Z",
                            fill: "none",
                            stroke: a,
                            strokeWidth: "1.5",
                            opacity: "0.35"
                        }), y.jsx("path", {
                            d: p.join(" ") + " Z",
                            fill: a,
                            opacity: "0.72",
                            style: {
                                filter: m
                            }
                        }), y.jsx("circle", {
                            cx: r(c),
                            cy: r(d),
                            r: r(l * .07),
                            fill: "#0f172a"
                        })]
                    })
                })()
            });
        case "circulararc":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 10),
                    fill: a,
                    opacity: "0.62",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .12),
                    fill: "#0f172a"
                }), y.jsx("path", {
                    d: `M ${r(c-l*.08)} ${r(d-l*.06)} Q ${r(c)} ${r(d-l*.18)} ${r(c+l*.08)} ${r(d-l*.06)}`,
                    fill: "none",
                    stroke: "#0f172a",
                    strokeWidth: "2.2",
                    opacity: "0.8"
                }), y.jsx("path", {
                    d: `M ${r(c-l*.08)} ${r(d+l*.06)} Q ${r(c)} ${r(d+l*.02)} ${r(c+l*.08)} ${r(d+l*.06)}`,
                    fill: "none",
                    stroke: "#0f172a",
                    strokeWidth: "2.2",
                    opacity: "0.8"
                })]
            });
        case "differential":
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .44),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "3.5",
                    opacity: "0.5",
                    style: {
                        filter: m
                    }
                }), [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(p => {
                    const x = p * Math.PI / 180;
                    return y.jsx("line", {
                        x1: r(c + l * .36 * Math.cos(x)),
                        y1: r(d + l * .36 * Math.sin(x)),
                        x2: r(c + l * .44 * Math.cos(x)),
                        y2: r(d + l * .44 * Math.sin(x)),
                        stroke: "#0f172a",
                        strokeWidth: "2.2"
                    }, p)
                }), y.jsx("path", {
                    d: `M ${r(l*.08)} ${r(d+l*.1)} L ${r(c-l*.06)} ${r(d+l*.01)} L ${r(c-l*.06)} ${r(d-l*.01)} L ${r(l*.08)} ${r(d-l*.1)} Z`,
                    fill: a,
                    opacity: "0.75"
                }), y.jsx("path", {
                    d: `M ${r(l*.92)} ${r(d+l*.1)} L ${r(c+l*.06)} ${r(d+l*.01)} L ${r(c+l*.06)} ${r(d-l*.01)} L ${r(l*.92)} ${r(d-l*.1)} Z`,
                    fill: a,
                    opacity: "0.75"
                }), y.jsx("path", {
                    d: `M ${r(c-l*.05)} ${r(l*.1)} L ${r(c+l*.01)} ${r(d-l*.06)} L ${r(c-l*.01)} ${r(d-l*.06)} L ${r(c+l*.05)} ${r(l*.1)} Z`,
                    fill: a,
                    opacity: "0.6"
                }), y.jsx("path", {
                    d: `M ${r(c-l*.05)} ${r(l*.9)} L ${r(c+l*.01)} ${r(d+l*.06)} L ${r(c-l*.01)} ${r(d+l*.06)} L ${r(c+l*.05)} ${r(l*.9)} Z`,
                    fill: a,
                    opacity: "0.6"
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .08),
                    fill: a,
                    opacity: "0.9",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: r(l * .04),
                    fill: "#0f172a"
                })]
            });
        default:
            return y.jsxs("svg", {
                width: l,
                height: l,
                viewBox: `0 0 ${l} ${l}`,
                children: [y.jsx("path", {
                    d: Pt(c, d, l * .43, l * .31, 8),
                    fill: a,
                    opacity: "0.9",
                    style: {
                        filter: m
                    }
                }), y.jsx("circle", {
                    cx: r(c),
                    cy: r(d),
                    r: l * .12,
                    fill: "#0f172a"
                })]
            })
    }
}
const qp = [{
    id: 1,
    name: "Jansen's Linkage",
    icon: "jansen",
    color: "#4ade80",
    desc: "Kaki berjalan Strandbeest oleh Theo Jansen"
}, {
    id: 2,
    name: "Klann Linkage",
    icon: "klann",
    color: "#22d3ee",
    desc: "Kaki berjalan 6-bar — paten RJ Klann"
}, {
    id: 3,
    name: "Chebyshev's Lambda",
    icon: "chebyshev",
    color: "#60a5fa",
    desc: "Garis lurus hampiran berbentuk Λ"
}, {
    id: 4,
    name: "Peaucellier-Lipkin",
    icon: "peaucellier",
    color: "#a78bfa",
    desc: "Garis lurus sempurna pertama — rhombus + dua lengan"
}, {
    id: 5,
    name: "Watt's Linkage",
    icon: "watts",
    color: "#f472b6",
    desc: "Garis lurus hampiran — suspensi mobil modern"
}, {
    id: 6,
    name: "Hoekens Linkage",
    icon: "hoekens",
    color: "#fb923c",
    desc: "Tracer garis lurus hampiran dengan floating point"
}, {
    id: 7,
    name: "Roberts Linkage",
    icon: "roberts",
    color: "#facc15",
    desc: "Garis lurus hampiran simetris oleh Roberts"
}, {
    id: 8,
    name: "Crank-Rocker",
    icon: "crankrocker",
    color: "#34d399",
    desc: "Input berputar penuh, output berayun — 4-bar paling umum"
}, {
    id: 9,
    name: "Double-Rocker",
    icon: "doublerocker",
    color: "#38bdf8",
    desc: "Kedua link berayun, tidak ada yang berputar penuh"
}, {
    id: 10,
    name: "Drag-Link (Double Crank)",
    icon: "draglink",
    color: "#818cf8",
    desc: "Kedua link berputar penuh — Grashof crank-crank"
}, {
    id: 11,
    name: "Pantograph",
    icon: "pantograph",
    color: "#f43f5e",
    desc: "Memperbesar/mengecil gambar secara mekanik"
}, {
    id: 12,
    name: "Sarrus Linkage",
    icon: "sarrus",
    color: "#0ea5e9",
    desc: "Mekanisme 3D garis lurus dari plat-plat berengsel"
}, {
    id: 13,
    name: "Bennett's Linkage",
    icon: "bennett",
    color: "#d97706",
    desc: "Satu-satunya rantai 4R spatial overconstrained yang mobile"
}, {
    id: 14,
    name: "Ornithopter Linkage",
    icon: "ornithopter",
    color: "#7c3aed",
    desc: "Kepakan sayap seperti burung — flapping wing mechanism"
}, {
    id: 15,
    name: "Dwell Linkage (Six-bar)",
    icon: "dwell",
    color: "#16a34a",
    desc: "Output berhenti sesaat saat input terus berputar"
}, {
    id: 16,
    name: "Four-Bar Linkage",
    icon: "fourbar",
    color: "#06b6d4",
    desc: "Mekanisme 4 batang — paling fundamental dalam kinematika"
}, {
    id: 17,
    name: "Slider-Crank Mechanism",
    icon: "slidercrank",
    color: "#ef4444",
    desc: "Rotasi → translasi — dasar mesin piston & kompresor"
}, {
    id: 18,
    name: "Scotch Yoke",
    icon: "scotch",
    color: "#8b5cf6",
    desc: "Menghasilkan gerak sinusoidal murni dari rotasi"
}, {
    id: 19,
    name: "Oldham Coupling",
    icon: "oldham",
    color: "#f97316",
    desc: "Dua poros paralel offset — mid-disc bergeser tegak lurus"
}, {
    id: 20,
    name: "Universal Joint (Cardan)",
    icon: "cardan",
    color: "#10b981",
    desc: "Transmisi torsi antara dua poros bersudut — poros propeller"
}, {
    id: 21,
    name: "Scott-Russell Linkage",
    icon: "scottrussell",
    color: "#ec4899",
    desc: "Garis lurus sempurna — konfigurasi layang-layang + slider"
}, {
    id: 22,
    name: "Hart's Inversor",
    icon: "hart",
    color: "#6366f1",
    desc: "Garis lurus sempurna tanpa pivot di jalur lurus"
}, {
    id: 23,
    name: "Toggle (Over-Center)",
    icon: "toggle",
    color: "#14b8a6",
    desc: "Gaya amplifikasi tinggi mendekati titik mati — press & klem"
}, {
    id: 24,
    name: "Lazy-Tong (Scissor)",
    icon: "scissor",
    color: "#84cc16",
    desc: "Struktur gunting lipat memanjang/memendek — meja lift"
}, {
    id: 25,
    name: "Whitworth Quick-Return",
    icon: "whitworth",
    color: "#fb7185",
    desc: "Maju lambat, balik cepat — mesin shaper perkakas"
}, {
    id: 26,
    name: "Grasshopper Linkage",
    icon: "grasshopper",
    color: "#0891b2",
    desc: "Beam engine Watt — piston lokomotif & pompa uap"
}, {
    id: 27,
    name: "Trammel of Archimedes",
    icon: "trammel",
    color: "#9333ea",
    desc: "Menggambar elips sempurna — dua pin di slot silang"
}, {
    id: 28,
    name: "Stephenson Linkage",
    icon: "stephenson",
    color: "#db2777",
    desc: "6-bar Stephenson tipe I/II/III — valve gear lokomotif"
}, {
    id: 29,
    name: "Watt Six-Bar Linkage",
    icon: "wattsixbar",
    color: "#38bdf8",
    desc: "Perluasan Watt menjadi 6 batang — lebih banyak titik output"
}, {
    id: 30,
    name: "Crossed Four-Bar Linkage",
    icon: "crossedfb",
    color: "#a3e635",
    desc: "Batang bersilang — antiparallelogram, gerakan berlawanan"
}, {
    id: 31,
    name: "Swinging Block Quick-Return",
    icon: "swingblock",
    color: "#fb923c",
    desc: "Balik cepat dengan blok berayun — kecepatan variabel"
}, {
    id: 32,
    name: "Bricard Linkage",
    icon: "bricard",
    color: "#c084fc",
    desc: "Rantai 6R spatial overconstrained — ada 6 tipe berbeda"
}, {
    id: 33,
    name: "Goldberg Linkage",
    icon: "goldberg",
    color: "#fbbf24",
    desc: "5R/6R spatial overconstrained — dipakai dalam origami mekanik"
}, {
    id: 34,
    name: "Myard Linkage",
    icon: "myard",
    color: "#2dd4bf",
    desc: "5R overconstrained spatial — dapat dilipat, deployable structure"
}, {
    id: 35,
    name: "Deployable Scissor Mast",
    icon: "deployable",
    color: "#e879f9",
    desc: "Struktur lipat untuk antena & panel surya luar angkasa"
}, {
    id: 36,
    name: "Evans Linkage",
    icon: "evans",
    color: "#f59e0b",
    desc: "Garis lurus hampiran oleh Oliver Evans (1805)"
}, {
    id: 37,
    name: "Lemniscate (Watt Curve)",
    icon: "lemniscate",
    color: "#67e8f9",
    desc: "Coupler melacak kurva lemniskat (∞) — ditemukan Watt"
}, {
    id: 38,
    name: "Spherical Four-Bar Linkage",
    icon: "spherical",
    color: "#818cf8",
    desc: "Mekanisme 4-bar di permukaan bola — robot orientasi 3D"
}, {
    id: 39,
    name: "Roberts-Chebyshev Cognate",
    icon: "cognate",
    color: "#4ade80",
    desc: "Tiga 4-bar berbeda menghasilkan coupler curve sama"
}, {
    id: 40,
    name: "Kempe Universality",
    icon: "kempe",
    color: "#f472b6",
    desc: "Setiap kurva aljabar bisa dilacak linkage — Kempe 1876"
}, {
    id: 41,
    name: "Elliptic Slider Mechanism",
    icon: "ellipticslider",
    color: "#60a5fa",
    desc: "Menghasilkan gerak eliptik dari rotasi — mesin jahit lama"
}, {
    id: 42,
    name: "Double-Wishbone Suspension",
    icon: "wishbone",
    color: "#34d399",
    desc: "Suspensi double wishbone — kontrol camber superior mobil sport"
}, {
    id: 43,
    name: "Five-Bar Linkage",
    icon: "fivebar",
    color: "#fb923c",
    desc: "Lima batang 2 DOF — lebih banyak variasi lintasan coupler"
}, {
    id: 44,
    name: "Isogonal Mechanism",
    icon: "isogonal",
    color: "#a78bfa",
    desc: "Mempertahankan hubungan sudut — kaca spion lipat kendaraan"
}, {
    id: 45,
    name: "Walschaerts Valve Gear",
    icon: "walschaerts",
    color: "#ef4444",
    desc: "Pengatur katup uap lokomotif — mekanisme 6-bar planar klasik"
}];


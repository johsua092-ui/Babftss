import React from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

const ce = React.createElement;
const Fragment = React.Fragment;

export default function LinkageIcon({
    icon: i,
    color: a,
    size: o = 40
}) {
    const m = `drop-shadow(0 0 2.5px rgba(${hexToRgbStr(a)},0.9))`,
        l = o,
        c = k => k.toFixed(1),
        d = (k, R, L, C, N = .88) => ce("line", {x1: c(k * l),
            y1: c(R * l),
            x2: c(L * l),
            y2: c(C * l),
            stroke: a,
            strokeWidth: c(l * .068),
            strokeLinecap: "round",
            opacity: N,
            style: {
                filter: m
            }}),
        r = (k, R, L = .08) => ce("circle", {cx: c(k * l),
            cy: c(R * l),
            r: c(L * l),
            fill: a,
            opacity: "0.95",
            style: {
                filter: m
            }}),
        p = (k, R) => ce("g", {children: [ce("polygon", {
                points: `${c(k*l)},${c(R*l)} ${c((k-.12)*l)},${c((R+.17)*l)} ${c((k+.12)*l)},${c((R+.17)*l)}`,
                fill: a,
                opacity: "0.38"
            }), ce("line", {
                x1: c((k - .2) * l),
                y1: c((R + .17) * l),
                x2: c((k + .2) * l),
                y2: c((R + .17) * l),
                stroke: a,
                strokeWidth: "1.5",
                opacity: "0.3"
            })]}),
        x = k => ce("line", {x1: c(.05 * l),
            y1: c(k * l),
            x2: c(.95 * l),
            y2: c(k * l),
            stroke: a,
            strokeWidth: "1",
            opacity: "0.22",
            strokeDasharray: "3,2"}),
        g = (k, R) => ce("rect", {x: c((k - .1) * l),
            y: c((R - .08) * l),
            width: c(.2 * l),
            height: c(.16 * l),
            rx: c(.03 * l),
            fill: a,
            opacity: "0.6",
            style: {
                filter: m
            }}),
        S = k => ce("svg", {width: l,
            height: l,
            viewBox: `0 0 ${l} ${l}`}, k),
        j = .24,
        M = .76,
        T = .83;
    switch (i) {
        case "fourbar":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .34, .42), d(.34, .42, .7, .38), d(.7, .38, M, T), d(j, T, M, T, .15), r(j, T), r(M, T), r(.34, .42), r(.7, .38)]}));
        case "crankrocker":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .3, .5), d(.3, .5, .68, .3), d(.68, .3, M, T), ce("path", {
                    d: `M ${c(.16*l)},${c(.72*l)} A ${c(.12*l)},${c(.12*l)} 0 0,1 ${c(.32*l)},${c(.68*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.8",
                    opacity: "0.3",
                    strokeDasharray: "2,2"
                }), r(j, T), r(M, T), r(.3, .5), r(.68, .3)]}));
        case "doublerocker":
            return S(ce(Fragment, {children: [p(.18, T), p(.82, T), d(.18, T, .28, .28), d(.28, .28, .72, .28), d(.72, .28, .82, T), d(.18, T, .82, T, .15), r(.18, T), r(.82, T), r(.28, .28), r(.72, .28)]}));
        case "draglink":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .38, .58), d(.38, .58, .62, .58), d(.62, .58, M, T), d(j, T, M, T, .15), ce("path", {
                    d: `M ${c(.12*l)},${c(.62*l)} A ${c(.16*l)},${c(.16*l)} 0 1,1 ${c(.38*l)},${c(.74*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.8",
                    opacity: "0.25",
                    strokeDasharray: "2,2"
                }), r(j, T), r(M, T), r(.38, .58), r(.62, .58)]}));
        case "watts":
            return S(ce(Fragment, {children: [p(.18, T), p(.82, T), d(.18, T, .36, .5), d(.36, .5, .64, .5), d(.64, .5, .82, T), ce("path", {
                    d: `M ${c(.1*l)},${c(.35*l)} Q ${c(.25*l)},${c(.62*l)} ${c(.5*l)},${c(.35*l)} Q ${c(.75*l)},${c(.62*l)} ${c(.9*l)},${c(.35*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.9",
                    opacity: "0.38",
                    strokeDasharray: "2,2"
                }), r(.18, T), r(.82, T), r(.36, .5), r(.64, .5), r(.5, .5, .06)]}));
        case "chebyshev":
            return S(ce(Fragment, {children: [p(.18, T), p(.82, T), d(.18, T, .38, .3), d(.38, .3, .62, .3), d(.62, .3, .82, T), d(.18, T, .82, T, .15), d(.38, .3, .5, .12, .5), d(.62, .3, .5, .12, .5), r(.18, T), r(.82, T), r(.38, .3), r(.62, .3), r(.5, .12)]}));
        case "hoekens":
            return S(ce(Fragment, {children: [p(.18, T), p(.76, T), d(.18, T, .3, .45), d(.3, .45, .65, .38), d(.65, .38, .76, T), d(.3, .45, .5, .74, .6), d(.65, .38, .5, .74, .6), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.74 * l),
                    r: c(.06 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: "0.7"
                }), r(.18, T), r(.76, T), r(.3, .45), r(.65, .38)]}));
        case "roberts":
            return S(ce(Fragment, {children: [p(.18, T), p(.82, T), d(.18, T, .3, .4), d(.3, .4, .7, .4), d(.7, .4, .82, T), d(.18, T, .82, T, .15), d(.3, .4, .5, .62, .55), d(.7, .4, .5, .62, .55), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.62 * l),
                    r: c(.06 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.2",
                    opacity: "0.7"
                }), r(.18, T), r(.82, T), r(.3, .4), r(.7, .4)]}));
        case "peaucellier":
            return S(ce(Fragment, {children: [p(.5, .9), p(.08, .5), d(.5, .9, .72, .5), d(.5, .9, .28, .5), d(.08, .5, .72, .5), d(.08, .5, .28, .5), d(.28, .5, .5, .2), d(.72, .5, .5, .2), d(.28, .5, .5, .78), d(.72, .5, .5, .78), ce("line", {
                    x1: c(.5 * l),
                    y1: c(.1 * l),
                    x2: c(.5 * l),
                    y2: c(.85 * l),
                    stroke: a,
                    strokeWidth: "0.7",
                    opacity: "0.2",
                    strokeDasharray: "2,2"
                }), r(.5, .9, .06), r(.08, .5, .06), r(.28, .5), r(.72, .5), r(.5, .2), r(.5, .78)]}));
        case "scottrussell":
            return S(ce(Fragment, {children: [p(.5, .14), x(.84), d(.5, .14, .75, .84), d(.5, .14, .25, .84), d(.5, .14, .5, .84, .3), g(.75, .84), g(.25, .84), r(.5, .14), r(.5, .5, .06)]}));
        case "hart":
            return S(ce(Fragment, {children: [p(.24, .55), p(.76, .55), d(.24, .55, .5, .16), d(.24, .55, .5, .88), d(.76, .55, .5, .16), d(.76, .55, .5, .88), d(.5, .16, .5, .88, .3), r(.24, .55), r(.76, .55), r(.5, .16), r(.5, .88)]}));
        case "toggle":
            return S(ce(Fragment, {children: [p(.12, .84), p(.88, .62), d(.12, .84, .5, .4), d(.5, .4, .88, .62), ce("polygon", {
                    points: `${c(.5*l)},${c(.08*l)} ${c(.43*l)},${c(.22*l)} ${c(.57*l)},${c(.22*l)}`,
                    fill: a,
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), d(.5, .22, .5, .38), r(.12, .84), r(.88, .62), r(.5, .4)]}));
        case "scissor":
            return S(ce(Fragment, {children: [d(.14, .14, .86, .86), d(.86, .14, .14, .86), r(.5, .5), r(.14, .14), r(.86, .14), r(.14, .86), r(.86, .86), r(.5, .14, .065), r(.5, .86, .065), r(.14, .5, .065), r(.86, .5, .065)]}));
        case "pantograph":
            return S(ce(Fragment, {children: [p(.15, .5), d(.15, .5, .4, .28), d(.4, .28, .72, .28), d(.4, .28, .4, .5, .45), d(.4, .5, .72, .5, .45), d(.72, .28, .72, .5, .45), d(.15, .5, .15, .72, .4), d(.15, .72, .85, .72, .4), d(.85, .72, .85, .5, .4), ce("circle", {
                    cx: c(.85 * l),
                    cy: c(.72 * l),
                    r: c(.07 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.7",
                    style: {
                        filter: m
                    }
                }), r(.15, .5), r(.4, .28), r(.72, .28), r(.4, .5), r(.72, .5)]}));
        case "sarrus":
            return S(ce(Fragment, {children: [ce("rect", {
                    x: c(.08 * l),
                    y: c(.1 * l),
                    width: c(.84 * l),
                    height: c(.13 * l),
                    rx: "3",
                    fill: a,
                    opacity: "0.35"
                }), ce("rect", {
                    x: c(.08 * l),
                    y: c(.77 * l),
                    width: c(.84 * l),
                    height: c(.13 * l),
                    rx: "3",
                    fill: a,
                    opacity: "0.35"
                }), d(.22, .23, .34, .77), d(.66, .23, .78, .77), d(.34, .23, .22, .77, .5), d(.78, .23, .66, .77, .5), r(.22, .23), r(.34, .23), r(.66, .23), r(.78, .23), r(.22, .77), r(.34, .77), r(.66, .77), r(.78, .77)]}));
        case "bennett":
            return S(ce(Fragment, {children: [d(.1, .65, .5, .12), d(.5, .12, .9, .65), d(.1, .65, .38, .9), d(.38, .9, .62, .42, .6), d(.62, .42, .9, .65, .6), ce("path", {
                    d: `M ${c(.48*l)},${c(.5*l)} Q ${c(.52*l)},${c(.35*l)} ${c(.6*l)},${c(.42*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1",
                    opacity: "0.4",
                    strokeDasharray: "2,2"
                }), r(.1, .65), r(.9, .65), r(.5, .12), r(.38, .9), r(.62, .42)]}));
        case "ornithopter":
            return S(ce(Fragment, {children: [p(.5, .58), d(.5, .58, .14, .28), d(.14, .28, .08, .55), d(.5, .58, .86, .28), d(.86, .28, .92, .55), ce("path", {
                    d: `M ${c(.5*l)},${c(.58*l)} L ${c(.08*l)},${c(.55*l)} L ${c(.14*l)},${c(.28*l)} Z`,
                    fill: a,
                    opacity: "0.17"
                }), ce("path", {
                    d: `M ${c(.5*l)},${c(.58*l)} L ${c(.92*l)},${c(.55*l)} L ${c(.86*l)},${c(.28*l)} Z`,
                    fill: a,
                    opacity: "0.17"
                }), r(.5, .58), r(.14, .28), r(.86, .28), r(.08, .55), r(.92, .55)]}));
        case "dwell":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .3, .52), d(.3, .52, .55, .38), d(.55, .38, M, T), d(.55, .38, .68, .22), d(.68, .22, .82, .38), ce("line", {
                    x1: c(.6 * l),
                    y1: c(.22 * l),
                    x2: c(.92 * l),
                    y2: c(.22 * l),
                    stroke: a,
                    strokeWidth: c(l * .05),
                    opacity: "0.4",
                    strokeDasharray: "3,2"
                }), r(j, T), r(M, T), r(.3, .52), r(.55, .38), r(.68, .22), r(.82, .38)]}));
        case "slidercrank":
            return S(ce(Fragment, {children: [p(.22, .74), x(.4), d(.22, .74, .38, .4), d(.38, .4, .78, .4), g(.78, .4), ce("path", {
                    d: `M ${c(.08*l)},${c(.74*l)} A ${c(.2*l)},${c(.2*l)} 0 0,1 ${c(.38*l)},${c(.54*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.8",
                    opacity: "0.25",
                    strokeDasharray: "2,2"
                }), r(.22, .74), r(.38, .4), r(.78, .4, .065)]}));
        case "scotch":
            return S(ce(Fragment, {children: [p(.5, .5), ce("line", {
                    x1: c(.1 * l),
                    y1: c(.5 * l),
                    x2: c(.9 * l),
                    y2: c(.5 * l),
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.22",
                    strokeDasharray: "3,2"
                }), ce("line", {
                    x1: c(.5 * l),
                    y1: c(.1 * l),
                    x2: c(.5 * l),
                    y2: c(.9 * l),
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.22",
                    strokeDasharray: "3,2"
                }), d(.5, .5, .5, .28), r(.5, .5), r(.5, .28), ce("rect", {
                    x: c(.38 * l),
                    y: c(.18 * l),
                    width: c(.24 * l),
                    height: c(.18 * l),
                    rx: c(.03 * l),
                    fill: a,
                    opacity: "0.5",
                    style: {
                        filter: m
                    }
                })]}));
        case "oldham":
            return S(ce(Fragment, {children: [ce("circle", {
                    cx: c(.35 * l),
                    cy: c(.3 * l),
                    r: c(.2 * l),
                    fill: a,
                    opacity: "0.22"
                }), ce("circle", {
                    cx: c(.35 * l),
                    cy: c(.3 * l),
                    r: c(.2 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.8",
                    opacity: "0.6",
                    style: {
                        filter: m
                    }
                }), ce("line", {
                    x1: c(.16 * l),
                    y1: c(.3 * l),
                    x2: c(.54 * l),
                    y2: c(.3 * l),
                    stroke: "#0f172a",
                    strokeWidth: "2.5",
                    opacity: "0.7"
                }), ce("rect", {
                    x: c(.28 * l),
                    y: c(.44 * l),
                    width: c(.44 * l),
                    height: c(.13 * l),
                    rx: c(.03 * l),
                    fill: a,
                    opacity: "0.55",
                    style: {
                        filter: m
                    }
                }), ce("circle", {
                    cx: c(.65 * l),
                    cy: c(.72 * l),
                    r: c(.2 * l),
                    fill: a,
                    opacity: "0.2"
                }), ce("circle", {
                    cx: c(.65 * l),
                    cy: c(.72 * l),
                    r: c(.2 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.8",
                    opacity: "0.55"
                }), ce("line", {
                    x1: c(.65 * l),
                    y1: c(.52 * l),
                    x2: c(.65 * l),
                    y2: c(.9 * l),
                    stroke: "#0f172a",
                    strokeWidth: "2.5",
                    opacity: "0.7"
                })]}));
        case "cardan":
            return S(ce(Fragment, {children: [d(.5, .08, .5, .42), d(.5, .58, .5, .92), d(.08, .5, .42, .5), d(.58, .5, .92, .5), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    r: c(.16 * l),
                    fill: a,
                    opacity: "0.28",
                    style: {
                        filter: m
                    }
                }), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    r: c(.08 * l),
                    fill: a,
                    opacity: "0.9",
                    style: {
                        filter: m
                    }
                }), r(.5, .08, .065), r(.5, .92, .065), r(.08, .5, .065), r(.92, .5, .065)]}));
        case "trammel":
            return S(ce(Fragment, {children: [ce("line", {
                    x1: c(.5 * l),
                    y1: c(.08 * l),
                    x2: c(.5 * l),
                    y2: c(.92 * l),
                    stroke: a,
                    strokeWidth: "2",
                    opacity: "0.2"
                }), ce("line", {
                    x1: c(.08 * l),
                    y1: c(.5 * l),
                    x2: c(.92 * l),
                    y2: c(.5 * l),
                    stroke: a,
                    strokeWidth: "2",
                    opacity: "0.2"
                }), ce("ellipse", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    rx: c(.36 * l),
                    ry: c(.23 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: c(l * .062),
                    opacity: "0.65",
                    style: {
                        filter: m
                    }
                }), r(.5, .27, .07), r(.72, .5, .07), d(.5, .27, .72, .5, .7), d(.72, .5, .86, .5, .45)]}));
        case "stephenson":
            return S(ce(Fragment, {children: [p(.18, T), p(.82, T), d(.18, T, .3, .52), d(.3, .52, .65, .45), d(.65, .45, .82, T), d(.3, .52, .45, .28), d(.45, .28, .65, .45), d(.45, .28, .62, .2), d(.62, .2, .75, .32), r(.18, T), r(.82, T), r(.3, .52), r(.65, .45), r(.45, .28), r(.62, .2), r(.75, .32)]}));
        case "wattsixbar":
            return S(ce(Fragment, {children: [p(.12, T), p(.88, T), d(.12, T, .32, .52), d(.32, .52, .68, .52), d(.68, .52, .88, T), d(.32, .52, .38, .28), d(.68, .52, .62, .28), d(.38, .28, .62, .28), r(.12, T), r(.88, T), r(.32, .52), r(.68, .52), r(.38, .28), r(.62, .28), r(.5, .28, .06)]}));
        case "crossedfb":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, M, .32), d(M, T, j, .32), d(j, .32, M, .32), r(j, T), r(M, T), r(j, .32), r(M, .32), r(.5, .57, .06)]}));
        case "whitworth":
            return S(ce(Fragment, {children: [p(.3, .6), p(.3, .28), d(.3, .28, .3, .6, .3), d(.3, .28, .52, .38), d(.52, .38, .3, .6), x(.8), d(.3, .6, .7, .8), d(.52, .38, .7, .8, .6), g(.7, .8), r(.3, .28), r(.3, .6), r(.52, .38)]}));
        case "grasshopper":
            return S(ce(Fragment, {children: [p(.18, .52), d(.18, .52, .82, .52), d(.18, .52, .28, .2), d(.28, .2, .28, .84, .45), d(.82, .52, .68, .28), d(.68, .28, .55, .52, .5), r(.18, .52), r(.28, .2), r(.82, .52), r(.68, .28), r(.55, .52)]}));
        case "jansen":
            return S(ce(Fragment, {children: [p(.35, .36), p(.55, .36), d(.35, .36, .22, .55), d(.22, .55, .3, .83), d(.3, .83, .5, .72), d(.55, .36, .68, .5), d(.68, .5, .5, .72), d(.35, .36, .55, .36, .25), ce("path", {
                    d: `M ${c(.14*l)},${c(.88*l)} Q ${c(.3*l)},${c(.6*l)} ${c(.5*l)},${c(.72*l)} Q ${c(.62*l)},${c(.82*l)} ${c(.52*l)},${c(.9*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.85",
                    opacity: "0.42",
                    strokeDasharray: "2,2"
                }), r(.35, .36), r(.55, .36), r(.22, .55), r(.3, .83), r(.5, .72), r(.68, .5)]}));
        case "klann":
            return S(ce(Fragment, {children: [p(.5, .28), d(.5, .28, .28, .48), d(.28, .48, .22, .78), d(.22, .78, .45, .9), d(.5, .28, .72, .48), d(.72, .48, .45, .9), d(.28, .48, .72, .48, .35), ce("path", {
                    d: `M ${c(.12*l)},${c(.78*l)} Q ${c(.3*l)},${c(.65*l)} ${c(.45*l)},${c(.9*l)} Q ${c(.56*l)},${c(.95*l)} ${c(.58*l)},${c(.82*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.85",
                    opacity: "0.42",
                    strokeDasharray: "2,2"
                }), r(.5, .28), r(.28, .48), r(.72, .48), r(.22, .78), r(.45, .9)]}));
        case "swingblock":
            return S(ce(Fragment, {children: [p(.2, .52), p(.5, .52), d(.2, .52, .38, .22), d(.5, .52, .72, .15), d(.5, .52, .72, .88, .3), d(.38, .22, .62, .42, .7), x(.92), d(.72, .15, .85, .92, .45), g(.85, .92), r(.2, .52), r(.5, .52), r(.38, .22), r(.62, .42)]}));
        case "bricard":
            return S(ce(Fragment, {children: [
                    [0, 1, 2, 3, 4, 5].map(k => {
                        const R = (k * 60 - 90) * Math.PI / 180,
                            L = ((k + 1) * 60 - 90) * Math.PI / 180,
                            C = .36,
                            N = .5 + C * Math.cos(R),
                            q = .5 + C * Math.sin(R),
                            I = .5 + C * Math.cos(L),
                            P = .5 + C * Math.sin(L);
                        return ce("g", {
                            children: [d(N, q, I, P), r(N, q, .07)]
                        }, k)
                    }), [30, 150, 270].map(k => {
                        const R = k * Math.PI / 180,
                            L = .5 + .36 * Math.cos(R),
                            C = .5 + .36 * Math.sin(R);
                        return ce("line", {
                            x1: c((L - .055 * Math.cos(R + 1.57)) * l),
                            y1: c((C - .055 * Math.sin(R + 1.57)) * l),
                            x2: c((L + .055 * Math.cos(R + 1.57)) * l),
                            y2: c((C + .055 * Math.sin(R + 1.57)) * l),
                            stroke: a,
                            strokeWidth: "1.5",
                            opacity: "0.5"
                        }, k)
                    })
                ]}));
        case "goldberg":
            return S(ce(Fragment, {children: [
                    [0, 1, 2, 3, 4].map(k => {
                        const R = (k * 72 - 90) * Math.PI / 180,
                            L = ((k + 1) * 72 - 90) * Math.PI / 180,
                            C = .36,
                            N = .5 + C * Math.cos(R),
                            q = .5 + C * Math.sin(R),
                            I = .5 + C * Math.cos(L),
                            P = .5 + C * Math.sin(L);
                        return ce("g", {
                            children: [d(N, q, I, P), r(N, q, .07)]
                        }, k)
                    }), ce("path", {
                        d: `M ${c(.5*l)},${c(.14*l)} Q ${c(.66*l)},${c(.3*l)} ${c(.5*l)},${c(.5*l)}`,
                        fill: "none",
                        stroke: a,
                        strokeWidth: "0.9",
                        opacity: "0.35",
                        strokeDasharray: "2,2"
                    })
                ]}));
        case "myard":
            return S(ce(Fragment, {children: [p(.5, .5), d(.5, .5, .2, .22), d(.5, .5, .8, .22), d(.2, .22, .2, .78), d(.8, .22, .8, .78), d(.2, .78, .8, .78), ce("line", {
                    x1: c(.5 * l),
                    y1: c(.1 * l),
                    x2: c(.5 * l),
                    y2: c(.5 * l),
                    stroke: a,
                    strokeWidth: "0.8",
                    opacity: "0.3",
                    strokeDasharray: "2,2"
                }), r(.5, .5), r(.2, .22), r(.8, .22), r(.2, .78), r(.8, .78)]}));
        case "deployable":
            return S(ce(Fragment, {children: [
                    [.1, .36, .62].map((k, R) => {
                        const L = k + .26;
                        return ce("g", {
                            children: [d(.18, k, .82, L), d(.82, k, .18, L), r(.5, (k + L) / 2, .065)]
                        }, R)
                    }), d(.18, .1, .18, .88, .28), d(.82, .1, .82, .88, .28), r(.18, .1, .07), r(.82, .1, .07), r(.18, .88, .07), r(.82, .88, .07)
                ]}));
        case "evans":
            return S(ce(Fragment, {children: [p(.18, T), p(.78, T), d(.18, T, .32, .45), d(.32, .45, .66, .42), d(.66, .42, .78, T), d(.32, .45, .5, .14), d(.66, .42, .5, .14, .6), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.14 * l),
                    r: c(.06 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.75",
                    style: {
                        filter: m
                    }
                }), r(.18, T), r(.78, T), r(.32, .45), r(.66, .42)]}));
        case "lemniscate":
            return S(ce(Fragment, {children: [p(.38, .56), p(.62, .56), d(.38, .56, .28, .38), d(.28, .38, .5, .28), d(.62, .56, .72, .38), d(.72, .38, .5, .28), ce("path", {
                    d: `M ${c(.5*l)},${c(.28*l)} Q ${c(.88*l)},${c(.1*l)} ${c(.88*l)},${c(.5*l)} Q ${c(.88*l)},${c(.9*l)} ${c(.5*l)},${c(.5*l)} Q ${c(.12*l)},${c(.1*l)} ${c(.12*l)},${c(.5*l)} Q ${c(.12*l)},${c(.9*l)} ${c(.5*l)},${c(.5*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.9",
                    opacity: "0.52",
                    style: {
                        filter: m
                    }
                }), r(.38, .56), r(.62, .56), r(.28, .38), r(.72, .38), r(.5, .28)]}));
        case "spherical":
            return S(ce(Fragment, {children: [ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    r: c(.42 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1",
                    opacity: "0.18"
                }), ce("ellipse", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    rx: c(.42 * l),
                    ry: c(.17 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.9",
                    opacity: "0.2"
                }), ce("path", {
                    d: `M ${c(.5*l)},${c(.08*l)} Q ${c(.88*l)},${c(.28*l)} ${c(.88*l)},${c(.5*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: c(l * .068),
                    strokeLinecap: "round",
                    opacity: "0.82",
                    style: {
                        filter: m
                    }
                }), ce("path", {
                    d: `M ${c(.5*l)},${c(.08*l)} Q ${c(.12*l)},${c(.28*l)} ${c(.12*l)},${c(.5*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: c(l * .068),
                    strokeLinecap: "round",
                    opacity: "0.72",
                    style: {
                        filter: m
                    }
                }), ce("path", {
                    d: `M ${c(.12*l)},${c(.5*l)} Q ${c(.3*l)},${c(.8*l)} ${c(.5*l)},${c(.88*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: c(l * .062),
                    strokeLinecap: "round",
                    opacity: "0.6",
                    style: {
                        filter: m
                    }
                }), ce("path", {
                    d: `M ${c(.88*l)},${c(.5*l)} Q ${c(.7*l)},${c(.8*l)} ${c(.5*l)},${c(.88*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: c(l * .058),
                    strokeLinecap: "round",
                    opacity: "0.55",
                    style: {
                        filter: m
                    }
                }), r(.5, .08, .07), r(.12, .5, .07), r(.88, .5, .07), r(.5, .88, .07)]}));
        case "cognate":
            return S(ce(Fragment, {children: [p(.2, T), p(.8, T), p(.5, .1), d(.2, T, .32, .5), d(.32, .5, .6, .42), d(.6, .42, .8, T), d(.2, T, .38, .35, .52), d(.38, .35, .5, .1, .52), d(.8, T, .62, .35, .42), d(.62, .35, .5, .1, .42), ce("path", {
                    d: `M ${c(.18*l)},${c(.28*l)} Q ${c(.5*l)},${c(.56*l)} ${c(.82*l)},${c(.28*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.9",
                    opacity: "0.4",
                    strokeDasharray: "2,2"
                }), r(.2, T), r(.8, T), r(.5, .1), r(.32, .5), r(.6, .42), r(.38, .35), r(.62, .35)]}));
        case "kempe":
            return S(ce(Fragment, {children: [p(.5, .88), [0, 60, 120, 180, 240, 300].map((k, R) => {
                    const L = k * Math.PI / 180,
                        C = .5 + .36 * Math.cos(L),
                        N = .5 + .36 * Math.sin(L),
                        q = (k + 60) * Math.PI / 180,
                        I = .5 + .36 * Math.cos(q),
                        P = .5 + .36 * Math.sin(q);
                    return ce("g", {
                        children: [d(.5, .5, C, N, .7), r(C, N, .065), R < 3 && d(C, N, I, P, .32)]
                    }, k)
                }), r(.5, .5), r(.5, .88)]}));
        case "ellipticslider":
            return S(ce(Fragment, {children: [p(.5, .5), x(.84), ce("line", {
                    x1: c(.5 * l),
                    y1: c(.12 * l),
                    x2: c(.5 * l),
                    y2: c(.88 * l),
                    stroke: a,
                    strokeWidth: "1.5",
                    opacity: "0.18"
                }), d(.5, .5, .5, .28), d(.5, .28, .78, .84), g(.5, .28), g(.78, .84), ce("ellipse", {
                    cx: c(.5 * l),
                    cy: c(.5 * l),
                    rx: c(.28 * l),
                    ry: c(.22 * l),
                    fill: "none",
                    stroke: a,
                    strokeWidth: "0.9",
                    opacity: "0.38",
                    strokeDasharray: "2,2"
                }), r(.5, .5)]}));
        case "wishbone":
            return S(ce(Fragment, {children: [p(.5, T), d(.18, .64, .82, .64, .45), d(.18, .64, .5, .38), d(.82, .64, .5, .38), d(.3, .44, .7, .44, .45), d(.3, .44, .5, .22), d(.7, .44, .5, .22), d(.5, .38, .5, .22), ce("circle", {
                    cx: c(.5 * l),
                    cy: c(.52 * l),
                    r: c(.06 * l),
                    fill: a,
                    opacity: "0.45",
                    style: {
                        filter: m
                    }
                }), r(.18, .64, .065), r(.82, .64, .065), r(.3, .44, .065), r(.7, .44, .065), r(.5, .38), r(.5, .22)]}));
        case "fivebar":
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .3, .42), d(M, T, .7, .42), d(.3, .42, .5, .2), d(.7, .42, .5, .2), d(j, T, M, T, .15), r(j, T), r(M, T), r(.3, .42), r(.7, .42), r(.5, .2)]}));
        case "isogonal":
            return S(ce(Fragment, {children: [p(.3, .68), p(.7, .68), d(.3, .68, .5, .32), d(.5, .32, .7, .68), d(.3, .68, .5, .9, .48), d(.5, .9, .7, .68, .48), ce("path", {
                    d: `M ${c(.38*l)},${c(.62*l)} A ${c(.1*l)},${c(.1*l)} 0 0,1 ${c(.38*l)},${c(.74*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1",
                    opacity: "0.5"
                }), ce("path", {
                    d: `M ${c(.62*l)},${c(.62*l)} A ${c(.1*l)},${c(.1*l)} 0 0,0 ${c(.62*l)},${c(.74*l)}`,
                    fill: "none",
                    stroke: a,
                    strokeWidth: "1",
                    opacity: "0.5"
                }), r(.3, .68), r(.7, .68), r(.5, .32), r(.5, .9)]}));
        case "walschaerts":
            return S(ce(Fragment, {children: [p(.2, .62), p(.7, .72), d(.2, .62, .48, .38), d(.48, .38, .7, .52), d(.7, .52, .7, .72), d(.48, .38, .48, .18), d(.48, .18, .82, .28), d(.7, .52, .58, .52, .6), r(.2, .62), r(.7, .72), r(.48, .38), r(.7, .52), r(.48, .18), r(.82, .28), r(.58, .52)]}));
        default:
            return S(ce(Fragment, {children: [p(j, T), p(M, T), d(j, T, .34, .4), d(.34, .4, .7, .38), d(.7, .38, M, T), d(j, T, M, T, .15), r(j, T), r(M, T), r(.34, .4), r(.7, .38)]}))
    }
}

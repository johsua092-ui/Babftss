function PS() {
    const i = [{
        icon: y.jsx(BS, {
            size: 18
        }),
        title: "INPUT",
        color: "#60a5fa",
        desc: "Kamu memberi perintah — tekan tombol untuk mengirim sinyal. Nilai: 1 (ON) atau 0 (OFF)."
    }, {
        icon: y.jsx(YS, {
            size: 18
        }),
        title: "PROCESS",
        color: "#4ade80",
        desc: "Gate mengolah sinyal sesuai aturannya dan memutuskan output-nya."
    }, {
        icon: y.jsx(HS, {
            size: 18
        }),
        title: "OUTPUT",
        color: "#f472b6",
        desc: "Hasil keputusan gate. Lampu menyala = 1, Lampu padam = 0."
    }];
    return y.jsxs("div", {
        style: {
            backgroundColor: "#0a0f1a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            padding: 14,
            marginBottom: 20
        },
        children: [y.jsx("p", {
            style: {
                fontFamily: "Orbitron,sans-serif",
                fontSize: 9,
                color: "#475569",
                letterSpacing: 2,
                textAlign: "center",
                margin: "0 0 12px"
            },
            children: "CARA KERJA LOGIC GATES"
        }), y.jsx("div", {
            style: {
                display: "flex",
                alignItems: "stretch",
                gap: 6
            },
            children: i.map((a, o) => y.jsxs(K.Fragment, {
                children: [y.jsxs("div", {
                    style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: `rgba(${fa(a.color)},0.06)`,
                        border: `1px solid rgba(${fa(a.color)},0.2)`,
                        borderRadius: 12,
                        padding: "10px 6px",
                        textAlign: "center"
                    },
                    children: [y.jsx("div", {
                        style: {
                            color: a.color
                        },
                        children: a.icon
                    }), y.jsx("span", {
                        style: {
                            fontFamily: "Orbitron,sans-serif",
                            fontWeight: 800,
                            fontSize: 9,
                            color: a.color
                        },
                        children: a.title
                    }), y.jsx("span", {
                        style: {
                            fontFamily: "Inter,sans-serif",
                            fontSize: 9,
                            color: "#64748b",
                            lineHeight: 1.5
                        },
                        children: a.desc
                    })]
                }), o < i.length - 1 && y.jsx("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0
                    },
                    children: y.jsx("span", {
                        style: {
                            color: "#334155",
                            fontSize: 14
                        },
                        children: "→"
                    })
                })]
            }, a.title))
        })]
    })
}

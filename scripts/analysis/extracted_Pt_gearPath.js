function Pt(i, a, o, f, m) {
    const l = 2 * Math.PI / m,
        c = l * .38,
        d = x => x.toFixed(1),
        r = (x, g) => [i + g * Math.cos(x), a + g * Math.sin(x)];
    let p = "";
    for (let x = 0; x < m; x++) {
        const g = x * l - Math.PI / 2;
        if (x === 0) {
            const [q, I] = r(g - c / 2, f);
            p += `M ${d(q)},${d(I)} `
        }
        const [S, j] = r(g - c / 2, o), [M, T] = r(g + c / 2, o), [k, R] = r(g + c / 2, f), L = (x < m - 1 ? (x + 1) * l : 2 * Math.PI) - Math.PI / 2, [C, N] = r(L - c / 2, f);
        p += `L ${d(S)},${d(j)} A ${d(o)},${d(o)} 0 0,1 ${d(M)},${d(T)} L ${d(k)},${d(R)} A ${d(f)},${d(f)} 0 0,1 ${d(C)},${d(N)} `
    }
    return p + "Z"
}

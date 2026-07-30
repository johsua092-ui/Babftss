function fa(i) {
    const a = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(i);
    return a ? `${parseInt(a[1],16)},${parseInt(a[2],16)},${parseInt(a[3],16)}` : "255,255,255"
}

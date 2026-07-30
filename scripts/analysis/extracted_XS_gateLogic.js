function XS(i, a, o) {
    switch (i) {
        case "wire":
            return a;
        case "not":
            return !a;
        case "and":
            return a && o;
        case "nand":
            return !(a && o);
        case "or":
            return a || o;
        case "nor":
            return !(a || o);
        case "xor":
            return a !== o;
        case "xnor":
            return a === o
    }
}

export function computeGateOutput(type, a, b) {
    switch (type) {
        case "wire":
            return a;
        case "not":
            return !a;
        case "and":
            return a && b;
        case "nand":
            return !(a && b);
        case "or":
            return a || b;
        case "nor":
            return !(a || b);
        case "xor":
            return a !== b;
        case "xnor":
            return a === b;
    }
}

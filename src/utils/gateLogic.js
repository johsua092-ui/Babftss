/**
 * Generate truth table for a gate with given number of inputs
 * @param {number} inputCount - Number of inputs (1 or 2)
 * @param {function} logicFn - Logic function that takes array of inputs and returns output
 * @returns {Array} Array of {inputs: number[], output: number} objects
 */
export function generateTruthTable(inputCount, logicFn) {
  const rows = []
  const totalCombinations = Math.pow(2, inputCount)

  for (let i = 0; i < totalCombinations; i++) {
    const inputs = []
    for (let bit = inputCount - 1; bit >= 0; bit--) {
      inputs.push((i >> bit) & 1)
    }
    const output = logicFn(inputs)
    rows.push({ inputs, output })
  }

  return rows
}

/**
 * Compute gate output for given inputs
 * @param {Array<number>} inputs - Array of input values (0 or 1)
 * @param {string} gateType - Gate type identifier
 * @returns {number} Output value (0 or 1)
 */
export function computeOutput(inputs, gateType) {
  switch (gateType) {
    case "and":
      return inputs.every(v => v === 1) ? 1 : 0
    case "or":
      return inputs.some(v => v === 1) ? 1 : 0
    case "not":
      return inputs[0] === 1 ? 0 : 1
    case "nand":
      return inputs.every(v => v === 1) ? 0 : 1
    case "nor":
      return inputs.some(v => v === 1) ? 0 : 1
    case "xor":
      return inputs.reduce((a, b) => a ^ b, 0)
    case "xnor":
      return inputs.reduce((a, b) => a ^ b, 0) === 0 ? 1 : 0
    default:
      return 0
  }
}
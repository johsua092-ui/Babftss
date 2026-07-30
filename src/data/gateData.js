export const gateData = [
  {
    id: 1,
    type: "wire",
    name: "Basic Wire",
    dualInput: false,
    label: "WIRE",
    color: "#60a5fa",
    description: "Sinyal mengalir langsung melewati kabel. Tekan saklar A → lampu output ikut menyala. Ini adalah dasar dari semua rangkaian elektronik — tanpa kabel, tidak ada sinyal yang bisa berjalan."
  },
  {
    id: 2,
    type: "not",
    name: "NOT Gate",
    dualInput: false,
    label: "NOT",
    color: "#f87171",
    description: "Pembalik sinyal (Inverter). Input A = 0 → Output = 1. Input A = 1 → Output = 0. Perhatikan: saat saklar OFF, output justru menyala! Karena NOT membalik segalanya."
  },
  {
    id: 3,
    type: "and",
    name: "AND Gate",
    dualInput: true,
    label: "AND",
    color: "#4ade80",
    description: "Output = 1 HANYA jika A dan B keduanya = 1. Seperti dua saklar seri — kedua saklar harus ON baru lampu menyala. Salah satu saja OFF, output langsung 0."
  },
  {
    id: 4,
    type: "nand",
    name: "NAND Gate",
    dualInput: true,
    label: "NAND",
    color: "#fb923c",
    description: "Kebalikan AND. Output = 0 HANYA jika A dan B keduanya = 1. Semua kombinasi lain (00, 01, 10) menghasilkan output = 1. NAND adalah gerbang universal."
  },
  {
    id: 5,
    type: "or",
    name: "OR Gate",
    dualInput: true,
    label: "OR",
    color: "#a78bfa",
    description: "Output = 1 jika SALAH SATU atau keduanya bernilai 1. Seperti dua saklar paralel — cukup satu saklar saja yang ON, lampu sudah menyala."
  },
  {
    id: 6,
    type: "nor",
    name: "NOR Gate",
    dualInput: true,
    label: "NOR",
    color: "#f472b6",
    description: "Kebalikan OR. Output = 1 HANYA jika A dan B keduanya = 0. Begitu ada satu saja input yang bernilai 1, output langsung jadi 0."
  },
  {
    id: 7,
    type: "xor",
    name: "XOR Gate",
    dualInput: true,
    label: "XOR",
    color: "#facc15",
    description: "Output = 1 jika A dan B BERBEDA (01 atau 10). Jika sama (00 atau 11), output = 0. Dipakai untuk mengecek perbedaan dua sinyal."
  },
  {
    id: 8,
    type: "xnor",
    name: "XNOR Gate",
    dualInput: true,
    label: "XNOR",
    color: "#2dd4bf",
    description: "Kebalikan XOR. Output = 1 HANYA jika A dan B SAMA (00 atau 11). Jika berbeda (01 atau 10), output = 0. Dipakai untuk mengecek kesamaan dua sinyal."
  }
]
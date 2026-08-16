# Canvas API — Dokumentasi untuk Frontend

Fitur Canvas (menu baru di atas "Shapes") membutuhkan login member. Guest
terblokir: menu tampil **redup** sampai user login.

Base URL: `https://babftss.vercel.app` (juga tersedia di
`babft-learning-project.zone.id` dan `babftlearning.dpdns.org`).

## Auth
Semua endpoint membutuhkan header:

```
Authorization: Bearer <idToken Firebase>
```

Ambil token dengan `await user.getIdToken()` (Firebase Auth v9). Token
otomatis refresh, jadi tidak perlu diurus manual.

Cara detect user login (tanpa blokir): panggil `GET /api/canvas/access`.

---

## 1. GET /api/canvas/access — Cek akses (gating menu)

Gunakan ini pas halaman dimuat untuk memutuskan apakah menu Canvas redup
atau aktif.

- **Tanpa login** (guest):
```json
{ "allowed": false, "reason": "Tolong masuk menjadi member untuk menggunakan Canvas", "code": "AUTH_REQUIRED" }
```

- **Sudah login**:
```json
{
  "allowed": true,
  "uid": "xxx",
  "maxSlots": 3,
  "slots": [
    { "slot": 0, "filled": true },
    { "slot": 1, "filled": false },
    { "slot": 2, "filled": true }
  ]
}
```

---

## 2. GET /api/canvas/prompts — Muat 3 slot prompt/memory

Header auth wajib. Tanpa `?slot` mengembalikan semua slot:

```json
{
  "slots": [
    { "slot": 0, "filled": true, "title": "Gipsy Danger", "content": "...", "updated_at": 1700000000000 },
    { "slot": 1, "filled": false, "title": null, "content": null, "updated_at": null },
    { "slot": 2, "filled": true, "title": "Slot 3", "content": "...", "updated_at": 1700000000000 }
  ],
  "maxSlots": 3
}
```

Dengan `?slot=0` mengembalikan satu slot:

```json
{ "slot": 0, "title": "Gipsy Danger", "content": "...", "updated_at": 1700000000000 }
```

Jika slot kosong: `{ "slot": 1, "content": null, "title": null }`.

---

## 3. POST /api/canvas/prompts — Simpan/upsert slot

Body:
```json
{ "slot": 0, "title": "Gipsy Danger", "content": "teks panjang ingatan ai..." }
```

- `slot`: 0..2 (wajib)
- `title`: opsional (default "Slot N")
- `content`: teks, wajib, max 20.000 karakter

Respons 201 (baru) / 200 (update):
```json
{ "slot": 0, "title": "Gipsy Danger", "content": "...", "updated_at": 1700000000000, "updated": false }
```

---

## 4. DELETE /api/canvas/prompts?slot=N — Kosongkan slot

Respons: `{ "ok": true, "deleted": 1 }` (atau `deleted: 0` kalau sudah kosong).

---

## 5. GET /api/canvas/strokes — Muat gambar coret-coret

```json
{ "strokes": { ... }, "updated_at": 1700000000000 }
```

Jika belum ada: `{ "strokes": null, "updated_at": null }`.

Struktur `strokes` bebas — frontend yang menentukan (misal array objek
stroke berisi `points`, `color`, `width`, `tool`, dsb). Backend hanya
menyimpan & mengembalikan apa adanya.

---

## 6. POST /api/canvas/strokes — Simpan coret-coret

Body:
```json
{ "data": { "strokes": [ ... ] } }
```

`data` boleh object JSON apa pun (max 500 KB). Respons:
```json
{ "ok": true, "updated": true, "updated_at": 1700000000000 }
```

---

## 7. DELETE /api/canvas/strokes — Hapus coret-coret

Respons: `{ "ok": true, "deleted": 1 }`.

---

## Catatan
- Semua endpoint member-auth. Guest mendapat `401` `AUTH_REQUIRED` untuk
  prompts/strokes, dan `200 allowed:false` untuk `/access`.
- Rate limit: 60 req/menit per IP (access: 120/menit).
- Data tersimpan di Firestore project `punya-si-jawa`, koleksi
  `canvas_prompts` (slot memory) dan `canvas_strokes` (coret-coret).

# Canvas API — Dokumentasi untuk Frontend

Fitur Canvas (menu baru di atas "Shapes") membutuhkan login member. Guest
terblokir: menu tampil **redup** sampai user login.

Base URL: `https://babftss.vercel.app` (juga tersedia di
`babft-learning-project.zone.id` dan `babftlearning.dpdns.org`).

Semua endpoint Canvas digabung di SATU route: `/api/canvas` dengan query
param `action`. (Digabung karena limit serverless function Vercel Hobby.)

## Auth
Semua request member membutuhkan header:

```
Authorization: Bearer <idToken Firebase>
```

Ambil token dengan `await user.getIdToken()` (Firebase Auth v9).

---

## 1. Cek akses (gating menu redup)

```
GET /api/canvas?action=access
```

- **Tanpa login** (guest) — HTTP 200:
```json
{ "allowed": false, "reason": "Tolong masuk menjadi member untuk menggunakan Canvas", "code": "AUTH_REQUIRED" }
```

- **Sudah login** — HTTP 200:
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

## 2. Slot prompt/memory (3 slot, 0..2)

### Muat semua slot
```
GET /api/canvas?action=prompts
```
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

### Muat satu slot
```
GET /api/canvas?action=prompts&slot=0
```
```json
{ "slot": 0, "title": "Gipsy Danger", "content": "...", "updated_at": 1700000000000 }
```
Slot kosong: `{ "slot": 1, "content": null, "title": null }`.

### Simpan/upsert slot
```
POST /api/canvas?action=prompts
Content-Type: application/json
```
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

### Kosongkan slot
```
DELETE /api/canvas?action=prompts&slot=0
```
Respons: `{ "ok": true, "deleted": 1 }`.

---

## 3. Coret-coret (strokes)

### Muat
```
GET /api/canvas?action=strokes
```
```json
{ "strokes": { ... }, "updated_at": 1700000000000 }
```
Belum ada: `{ "strokes": null, "updated_at": null }`.

### Simpan
```
POST /api/canvas?action=strokes
Content-Type: application/json
```
```json
{ "data": { "strokes": [ ... ] } }
```
`data` boleh object JSON apa pun (max 500 KB). Respons:
```json
{ "ok": true, "updated": true, "updated_at": 1700000000000 }
```

### Hapus
```
DELETE /api/canvas?action=strokes
```
Respons: `{ "ok": true, "deleted": 1 }`.

---

## Catatan
- `action=access` boleh guest (balikin `allowed:false`).
- Semua action lain WAJIB member; guest dapat `401 AUTH_REQUIRED`.
- Rate limit: 60 req/menit per IP.
- Data disimpan di Firestore project `punya-si-jawa`, koleksi
  `canvas_prompts` (slot memory) dan `canvas_strokes` (coret-coret).
- Struktur `strokes` bebas — frontend yang menentukan (points, color, width, dst.).

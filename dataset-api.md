# Dataset Image API — Dokumentasi Frontend

Fitur "Dataset Image" memungkinkan user mengupload sampai **100 gambar** yang
akan "dibaca" AI Helper (vision) untuk dijadikan bahan belajar/ingatan AI.

Base URL: `https://babftss.vercel.app`.
Auth: semua endpoint butuh header `Authorization: Bearer <idToken Firebase>`.

Route: `/api/canvas` dengan query param `action=dataset_*`.
(Digabung ke endpoint Canvas agar total serverless function tidak melebihi
limit 12 Vercel Hobby plan.)

---

## 1. Cek status kuota

```
GET /api/canvas?action=dataset_status
```
```json
{
  "total": 12,
  "max": 100,
  "remaining": 88,
  "processed": 5,
  "pending": 7,
  "failed": 0
}
```

- `processed` = sudah "dibaca" AI (status done)
- `pending` = menunggu/akan diproses
- `failed` = gagal diproses

---

## 2. List semua image

```
GET /api/canvas?action=dataset_list
```
```json
{
  "images": [
    {
      "id": "abc123",
      "filename": "gear-ref.png",
      "mime_type": "image/png",
      "size_bytes": 45123,
      "status": "done",
      "description": "Sebuah gear kuning dengan 8 gigi...",
      "created_at": 1700000000000,
      "updated_at": 1700000000000
    }
  ],
  "total": 1,
  "max": 100
}
```

Catatan: `list` TIDAK mengembalikan bytes gambar (hemat payload) — hanya metadata +
`description` (hasil AI baca).

---

## 2b. Ambil bytes gambar (untuk preview <img>)

```
GET /api/canvas?action=dataset_image&id=abc123
```
```json
{
  "id": "abc123",
  "filename": "gear-ref.png",
  "mime_type": "image/png",
  "size_bytes": 45123,
  "data_url": "data:image/png;base64,iVBORw0KGgo..."
}
```

Gunakan `data_url` langsung sebagai `src` pada tag `<img>` untuk menampilkan
preview/thumbnail. (List di atas hanya metadata — panggil endpoint ini per image
saat perlu menampilkan gambarnya.)

---

## 3. Upload image

Dua mode — **base64** atau **URL**:

### mode base64
```
POST /api/canvas?action=dataset_upload
Content-Type: application/json
```
```json
{
  "filename": "gear-ref.png",
  "data_base64": "iVBORw0KGgoAAAANSUhEUg... (boleh dengan prefix data:image/png;base64,)",
  "mime_type": "image/png"
}
```

### mode URL
```json
{ "filename": "ref.png", "url": "https://contoh.com/gambar.png" }
```

Respons 201:
```json
{
  "id": "abc123",
  "filename": "gear-ref.png",
  "mime_type": "image/png",
  "size_bytes": 45123,
  "status": "pending",
  "remaining": 99
}
```

**Kuota penuh** → HTTP 400 `{ "error": "...", "code": "QUOTA_FULL" }`.

---

## 4. Proses baca (vision) satu image

```
POST /api/canvas?action=dataset_process&id=abc123
```

Saat vision belum dikonfigurasi, respons 202:
```json
{ "id": "abc123", "status": "pending", "description": null, "note": "Vision belum dikonfigurasi (image/png)" }
```

Saat vision sudah aktif, respons 200:
```json
{ "id": "abc123", "status": "done", "description": "Sebuah roda gigi berwarna kuning..." }
```

---

## 5. Hapus satu image

```
DELETE /api/canvas?action=dataset_delete&id=abc123
```
Respons: `{ "ok": true, "deleted": 1 }`.

---

## 6. Hapus SEMUA image (clear all)

```
DELETE /api/canvas?action=dataset_clear
```
Respons: `{ "ok": true, "deleted": 12 }`.

> ⚠️ Dialog konfirmasi "Yakin ingin menghapus semua image?" ditampilkan di
> **frontend**. Backend langsung eksekusi `clear` begitu dipanggil — jadi
> pastikan tombol clear selalu memanggil endpoint ini SETELAH user menekan "Ya".

---

## Catatan
- Batas 100 image per user di-enforce server-side.
- Tipe gambar: png / jpeg / webp / gif. Max 8 MB per image.
- Status image: `pending` → `done` / `failed` (setelah vision aktif).
- Data tersimpan di Firestore `punya-si-jawa`, koleksi `dataset_images`.

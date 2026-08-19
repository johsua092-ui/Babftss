# PROMPT KERJA — SETUP TOKEN & PUSH COMMIT `714e46c` (BAGIAN 1 3D BLOCK SIMULATOR)

Token GitHub baru akan dikirim user di pesan berikutnya (langsung ke sesi ini, BUKAN ditaruh permanen di file manapun di repo). Ikuti langkah ini persis, supaya token tidak bocor ke commit history atau log permanen.

## LANGKAH 1 — Pakai token HANYA untuk sesi push ini, JANGAN simpan permanen

**JANGAN** taruh token di:
- File apapun di dalam repo (termasuk `.env`, config, script)
- `git remote set-url` dengan token tertanam permanen di URL (karena itu akan tersimpan di `.git/config` dalam bentuk plain text selamanya sampai diganti manual)
- Commit message atau komentar kode apapun

**Cara aman — pakai token cuma sekali via environment variable, tidak tersimpan ke disk:**
```bash
git push https://<TOKEN>@github.com/johsua092-ui/Babftss.git main
```
Ganti `<TOKEN>` dengan token yang dikirim user. Cara ini push langsung pakai URL sementara (tidak lewat `git remote set-url`), jadi token TIDAK tertulis permanen di `.git/config`.

Kalau command history shell kamu tersimpan (mis. `.bash_history`), setelah push sukses jalankan:
```bash
history -d $(history 1)
```
atau minimal pastikan command dengan token tidak ikut ter-log ke tempat yang bisa dibaca ulang nanti.

## LANGKAH 2 — Push commit yang SUDAH ADA (jangan bikin commit baru)

Commit `714e46c` (3 fix fondasi: orbit sign, hitTest, rotZ) **sudah selesai dan sudah di-commit lokal** dari task sebelumnya — cek dulu:
```bash
git log --oneline -3
git status
```
Pastikan HEAD masih di commit `714e46c` (atau turunannya kalau kamu sempat rebase/pull di antara sesi), dan working tree bersih. **Jangan buat perubahan kode baru di langkah ini** — ini murni push, bukan kerjaan baru.

## LANGKAH 3 — Push (bukan force)

```bash
git push https://<TOKEN>@github.com/johsua092-ui/Babftss.git main
```

**Kalau berhasil:** lapor commit hash & konfirmasi ke user, lalu **STOP** — jangan lanjut ke task apapun (Bagian 2 gizmo/paint itu prompt terpisah nanti).

**Kalau ditolak lagi (non-fast-forward / ada commit baru di remote):** JANGAN force push, JANGAN pull/merge/rebase sendiri. Fetch dulu (read-only) buat lihat apa yang berubah, laporkan lengkap ke user sebelum ambil tindakan apapun — sama seperti prosedur sebelumnya.

## LANGKAH 4 — Setelah push sukses

Ingatkan user (di laporan akhirmu) untuk **revoke token ini dari GitHub Settings** begitu tidak dipakai lagi, karena token sempat lewat percakapan chat dan harus dianggap berpotensi terekspos.

---

**Batasan:** task ini HANYA push commit `714e46c` yang sudah ada. Tidak ada perubahan kode baru. Tidak mulai Bagian 2.

# Setup: Backup Otomatis BABFTSS

> Backup harian Turso + Supabase + (opsional) Firestore → S3-compatible storage
> **Estimasi waktu setup**: 15–20 menit
> **Biaya bulanan**: $0 (Cloudflare R2 free tier) — ~$0.45 untuk 30 hari backup 50 MB/hari

---

## 1. Install dependencies di VPS

```bash
# System packages
sudo apt-get update
sudo apt-get install -y postgresql-client awscli gzip curl cron

# Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash
source ~/.bashrc  # atau reload shell

# Verify
turso --version
pg_dump --version
aws --version
```

---

## 2. Buat storage bucket (Cloudflare R2 recommended)

1. Buka https://dash.cloudflare.com → **R2 Object Storage** → **Create bucket**
2. Beri nama: `babftss-backups`
3. Klik **Manage R2 API Tokens** → **Create API Token**
4. Permission: **Object Read & Write** untuk bucket `babftss-backups`
5. Copy **Access Key ID** + **Secret Access Key** + **S3 endpoint URL**
   (format: `https://<account-id>.r2.cloudflarestorage.com`)

> Alternatif: Backblaze B2 (https://backblaze.com/b2), AWS S3, Google Cloud Storage

---

## 3. Dapatkan credentials database

### Turso
1. https://app.turso.tech → database Anda → **Settings**
2. Copy **URL** (format: `libsql://...turso.io`)
3. Buat **Auth Token** baru → copy token

### Supabase
1. https://supabase.com/dashboard → project Anda → **Database** → **Settings**
2. **Connection** → **Connection string** → pilih **URI** (bukan pooling)
3. Format: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`
4. Catat **password** juga

---

## 4. Konfigurasi script

```bash
# Buat direktori config aman
sudo mkdir -p /etc/babftss
sudo cp /home/z/my-project/download/backup-babftss.env.example /etc/babftss/backup.env
sudo nano /etc/babftss/backup.env
# (isi semua variabel — lihat komentar di file)

# PROTECT credentials
sudo chmod 600 /etc/babftss/backup.env
sudo chown root:root /etc/babftss/backup.env

# Buat script executable + tempat aman
sudo cp /home/z/my-project/download/backup-babftss.sh /usr/local/bin/backup-babftss.sh
sudo chmod +x /usr/local/bin/backup-babftss.sh

# Buat log file
sudo touch /var/log/babftss-backup.log
sudo chown root:root /var/log/babftss-backup.log
sudo chmod 644 /var/log/babftss-backup.log

# Buat local backup dir
sudo mkdir -p /var/backups/babftss
```

---

## 5. Test backup (dry-run dulu, lalu full run)

```bash
# Dry-run — cek config tanpa benar-benar backup
sudo /usr/local/bin/backup-babftss.sh --dry-run

# Kalau OK, jalankan full backup
sudo /usr/local/bin/backup-babftss.sh

# Cek hasil
ls -lh /var/backups/babftss/$(date -u +%Y%m%dT%H%M%SZ)/
tail -50 /var/log/babftss-backup.log

# Cek upload S3
aws s3 ls --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  s3://babftss-backups/ --recursive
```

---

## 6. Install cron job

```bash
sudo crontab -e

# Tambahkan baris ini (backup tiap hari jam 03:00 pagi):
0 3 * * * /usr/local/bin/backup-babftss.sh >> /var/log/babftss-backup.log 2>&1
```

---

## 7. Verifikasi jadwal cron

```bash
# Cek cron aktif
sudo systemctl status cron

# List jobs
sudo crontab -l

# (Opsional) Restart cron untuk apply
sudo systemctl restart cron
```

---

## 8. Test alerting (opsional)

Kalau Anda isi `DISCORD_WEBHOOK` di config, alert otomatis terkirim saat:
- ✅ Backup sukses → pesan hijau
- ⚠️ Backup ada error → pesan kuning dengan list error

Test webhook manual:
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"content":"🚨 BABFTSS Backup: test alert"}' \
  "https://discord.com/api/webhooks/YOUR/WEBHOOK"
```

---

## 9. Recovery — cara restore dari backup

### Restore Turso
```bash
# Buat database baru dari backup
gunzip /var/backups/babftss/<DATE>/turso-<DATE>.sql.gz
turso db create babftss-restored --from-file /var/backups/babftss/<DATE>/turso-<DATE>.sql

# Update env production untuk pakai database baru
# (swap TURSO_DATABASE_URL ke database restored, verifikasi, lalu swap permanent)
```

### Restore Supabase
```bash
gunzip /var/backups/babftss/<DATE>/supabase-<DATE>.sql.gz

# Via psql (di Supabase SQL Editor atau psql CLI)
psql "$SUPABASE_DB_URL" -f /var/backups/babftss/<DATE>/supabase-<DATE>.sql
```

### Restore Firestore (kalau enable `BACKUP_FIRESTORE=true`)
```bash
# Via Firebase Console → Firestore → Import/Export → Import → pilih GCS path
# Atau via CLI:
gcloud firestore import gs://babftss-firestore-backups/firestore-backup-<DATE> \
  --project=punya-si-jawa
```

---

## 10. Monitoring jangka panjang

Cek mingguan apakah backup masih jalan:
```bash
# Harus ada entry hari ini
ls -lh /var/backups/babftss/ | tail -5

# Cek ukuran backup jangan sampai membengkak
du -sh /var/backups/babftss/

# Cek log error terakhir
grep -i "error" /var/log/babftss-backup.log | tail -10
```

Kalau backup gagal 2 hari berturut-turut → Discord alert otomatis terkirim.

---

## Troubleshooting

| Error | Solusi |
|---|---|
| `turso: dump failed` | Cek `TURSO_AUTH_TOKEN` masih valid (bisa expire). Buat ulang token. |
| `supabase: pg_dump failed: connection refused` | Pakai **DIRECT connection** (port 5432), bukan pooler (port 6543). Atau IP VPS belum di-whitelist di Supabase → Settings → Database → Network restrictions. |
| `s3: upload failed: AccessDenied` | Cek bucket policy / API token permission. R2 perlu "Object Read & Write" untuk bucket spesifik. |
| `turso: empty dump` | Database mungkin kosong. Verifikasi dengan `turso db shell <db> "SELECT COUNT(*) FROM users;"`. |
| Script tidak jalan via cron | Pastikan PATH lengkap. Tambahkan `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.turso` di atas cron entry. |

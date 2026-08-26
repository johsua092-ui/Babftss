#!/usr/bin/env bash
# ============================================================================
# BABFTSS — Daily Backup Script (Turso + Supabase → S3-compatible storage)
# ============================================================================
# Cron schedule : 0 3 * * *  (every day at 03:00 server time)
# Retention    : 30 days local + 30 days remote
# Storage      : S3-compatible (AWS S3, Cloudflare R2, Backblaze B2, GCS)
#
# REQUIREMENTS (install di VPS):
#   sudo apt-get install -y postgresql-client awscli gzip curl
#   curl -sSfL https://get.tur.so/install.sh | bash  # turso CLI
#
# SETUP:
#   1. Copy /home/z/my-project/download/backup-babftss.env.example
#      ke /etc/babftss/backup.env  (atau path aman lainnya)
#   2. Isi semua variabel (lihat komentar di file .env.example)
#   3. chmod 600 /etc/babftss/backup.env  (PROTECT credentials!)
#   4. chmod +x /home/z/my-project/download/backup-babftss.sh
#   5. Test:  ./backup-babftss.sh --dry-run
#   6. Install cron:
#        sudo crontab -e
#        # Tambahkan baris:
#        0 3 * * * /home/z/my-project/download/backup-babftss.sh >> /var/log/babftss-backup.log 2>&1
# ============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Config loading ─────────────────────────────────────────────────────────
CONFIG_FILE="${BACKUP_CONFIG_FILE:-/etc/babftss/backup.env}"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "[$(date -Iseconds)] FATAL: Config file not found: $CONFIG_FILE"
  echo "  Copy backup-babftss.env.example → $CONFIG_FILE and fill in values."
  exit 2
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

# ── Defaults ───────────────────────────────────────────────────────────────
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-/var/backups/babftss}"
LOG_FILE="${LOG_FILE:-/var/log/babftss-backup.log}"
DRY_RUN=false
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"  # optional alert webhook

# ── Arg parsing ────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# ── Helpers ─────────────────────────────────────────────────────────────────
timestamp() { date -u +"%Y%m%dT%H%M%SZ"; }
log() { echo "[$(date -Iseconds)] $*"; }
err() { echo "[$(date -Iseconds)] ERROR: $*" >&2; }
alert() {
  # Optional: send Discord/Slack alert
  if [[ -n "$DISCORD_WEBHOOK" ]]; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"content\":\"🚨 BABFTSS Backup: $1\"}" \
      "$DISCORD_WEBHOOK" >/dev/null 2>&1 || true
  fi
}

DATE_STAMP=$(timestamp)
TODAY_DIR="$LOCAL_BACKUP_DIR/$DATE_STAMP"
mkdir -p "$TODAY_DIR"

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "BABFTSS Backup started (date: $DATE_STAMP, dry-run: $DRY_RUN)"
log "Output dir: $TODAY_DIR"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=()

# ============================================================================
# 1. TURSO BACKUP
# ============================================================================
backup_turso() {
  log "[Turso] Starting backup..."

  if [[ -z "${TURSO_DATABASE_URL:-}" || -z "${TURSO_AUTH_TOKEN:-}" ]]; then
    err "[Turso] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set — skipping"
    ERRORS+=("turso:missing-config")
    return
  fi

  local out_file="$TODAY_DIR/turso-$DATE_STAMP.sql"
  local out_gz="$out_file.gz"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[Turso] DRY-RUN: would dump to $out_gz"
    return
  fi

  # turso CLI uses `turso db shell <db> .dump`
  # Extract db name from URL: libsql://<db-name>.<org>.turso.io
  local db_name
  db_name=$(echo "$TURSO_DATABASE_URL" | sed -E 's|^libsql?://([^\.]+)\..*|\1|')
  if [[ -z "$db_name" ]]; then
    err "[Turso] Could not parse DB name from URL: $TURSO_DATABASE_URL"
    ERRORS+=("turso:bad-url")
    return
  fi

  # Use turso CLI with auth token via env var
  # Alternative: use libsql-shell-cli if turso CLI not available
  if command -v turso >/dev/null 2>&1; then
    log "[Turso] Using turso CLI (db: $db_name)"
    if ! TURSO_API_TOKEN="$TURSO_AUTH_TOKEN" turso db shell "$db_name" ".dump" > "$out_file" 2>/dev/null; then
      err "[Turso] turso CLI dump failed — trying libsql-shell-cli fallback"
      # Fallback: use libsql client directly
      if ! npx -y @libsql/client dump "$TURSO_DATABASE_URL" "$TURSO_AUTH_TOKEN" > "$out_file" 2>/dev/null; then
        err "[Turso] All dump methods failed"
        ERRORS+=("turso:dump-failed")
        return
      fi
    fi
  else
    log "[Turso] turso CLI not found — using libsql-shell-cli"
    if ! npx -y @libsql/client dump "$TURSO_DATABASE_URL" "$TURSO_AUTH_TOKEN" > "$out_file" 2>/dev/null; then
      err "[Turso] libsql dump failed"
      ERRORS+=("turso:dump-failed")
      return
    fi
  fi

  # Validate dump is not empty
  if [[ ! -s "$out_file" ]]; then
    err "[Turso] Dump file is empty — aborting"
    rm -f "$out_file"
    ERRORS+=("turso:empty-dump")
    return
  fi

  # Compress
  gzip -9 "$out_file"
  local size_bytes
  size_bytes=$(stat -c%s "$out_gz")
  log "[Turso] Backup OK: $out_gz ($(numfmt --to=iec $size_bytes))"

  # Upload to S3
  upload_to_s3 "$out_gz" "turso/turso-$DATE_STAMP.sql.gz"
}

# ============================================================================
# 2. SUPABASE BACKUP (via pg_dump)
# ============================================================================
backup_supabase() {
  log "[Supabase] Starting backup..."

  if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    err "[Supabase] SUPABASE_DB_URL not set — skipping"
    ERRORS+=("supabase:missing-config")
    return
  fi

  local out_file="$TODAY_DIR/supabase-$DATE_STAMP.sql"
  local out_gz="$out_file.gz"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[Supabase] DRY-RUN: would dump to $out_gz"
    return
  fi

  # pg_dump with service_role password via PGPASSWORD env var
  # The URL format from Supabase:
  #   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  # OR direct connection:
  #   postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
  if ! PGPASSWORD="${SUPABASE_DB_PASSWORD:-}" \
       pg_dump "$SUPABASE_DB_URL" \
         --no-owner --no-privileges --no-password \
         --format=plain --no-comments \
         --file="$out_file" 2>/tmp/pgdump_err.log; then
    err "[Supabase] pg_dump failed: $(cat /tmp/pgdump_err.log)"
    rm -f "$out_file"
    ERRORS+=("supabase:dump-failed")
    return
  fi

  if [[ ! -s "$out_file" ]]; then
    err "[Supabase] Dump file is empty — aborting"
    rm -f "$out_file"
    ERRORS+=("supabase:empty-dump")
    return
  fi

  gzip -9 "$out_file"
  local size_bytes
  size_bytes=$(stat -c%s "$out_gz")
  log "[Supabase] Backup OK: $out_gz ($(numfmt --to=iec $size_bytes))"

  upload_to_s3 "$out_gz" "supabase/supabase-$DATE_STAMP.sql.gz"
}

# ============================================================================
# 3. UPLOAD TO S3-COMPATIBLE STORAGE
# ============================================================================
upload_to_s3() {
  local local_file="$1"
  local remote_key="$2"

  if [[ -z "${S3_BUCKET:-}" ]]; then
    log "[S3] S3_BUCKET not set — skipping upload (local backup only)"
    return
  fi

  if [[ -z "${S3_ACCESS_KEY:-}" || -z "${S3_SECRET_KEY:-}" ]]; then
    err "[S3] S3_ACCESS_KEY or S3_SECRET_KEY not set — skipping upload"
    ERRORS+=("s3:missing-creds")
    return
  fi

  local endpoint_flag=""
  if [[ -n "${S3_ENDPOINT:-}" ]]; then
    endpoint_flag="--endpoint-url $S3_ENDPOINT"
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[S3] DRY-RUN: would upload $local_file → s3://$S3_BUCKET/$remote_key"
    return
  fi

  if ! AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
       AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
       AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
       aws s3 cp $endpoint_flag "$local_file" "s3://$S3_BUCKET/$remote_key" \
       --no-progress 2>/tmp/s3_err.log; then
    err "[S3] Upload failed: $(cat /tmp/s3_err.log)"
    ERRORS+=("s3:upload-failed")
    return
  fi

  log "[S3] Uploaded → s3://$S3_BUCKET/$remote_key"
}

# ============================================================================
# 4. RETENTION — delete local + remote backups older than RETENTION_DAYS
# ============================================================================
rotate_old_backups() {
  log "[Rotate] Cleaning up backups older than $RETENTION_DAYS days..."

  # Local rotation
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[Rotate] DRY-RUN: would delete local dirs older than $RETENTION_DAYS days"
  else
    find "$LOCAL_BACKUP_DIR" -maxdepth 1 -type d -name "20*T*Z" -mtime +"$RETENTION_DAYS" -print -exec rm -rf {} + 2>/dev/null || true
  fi

  # Remote rotation (S3)
  if [[ -n "${S3_BUCKET:-}" && -n "${S3_ACCESS_KEY:-}" && -n "${S3_SECRET_KEY:-}" ]]; then
    local cutoff_date
    cutoff_date=$(date -u -d "$RETENTION_DAYS days ago" +%Y-%m-%dT%H:%M:%S)
    log "[Rotate] Remote cutoff: $cutoff_date (objects older than this will be deleted)"

    if [[ "$DRY_RUN" == "true" ]]; then
      log "[Rotate] DRY-RUN: would delete remote objects older than $cutoff_date"
      return
    fi

    local endpoint_flag=""
    if [[ -n "${S3_ENDPOINT:-}" ]]; then
      endpoint_flag="--endpoint-url $S3_ENDPOINT"
    fi

    # List + delete objects older than cutoff (use lifecycle policy on bucket for better reliability)
    AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
      AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
      AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
      aws s3 ls $endpoint_flag "s3://$S3_BUCKET/" --recursive 2>/dev/null \
      | awk '{print $1" "$2" "$4}' \
      | while IFS=$' ' read -r d t key; do
          local obj_date="$d $t"
          if [[ "$obj_date" < "$cutoff_date" ]]; then
            log "[Rotate] Deleting remote: $key (modified: $obj_date)"
            AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
              AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
              AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
              aws s3 rm $endpoint_flag "s3://$S3_BUCKET/$key" 2>/dev/null || true
          fi
        done

    log "[Rotate] Remote cleanup done"
    log "[Rotate] TIP: For more reliable rotation, configure bucket Lifecycle rule → Expire after $RETENTION_DAYS days"
  fi
}

# ============================================================================
# 5. FIREBASE FIRESTORE BACKUP (optional)
# ============================================================================
backup_firestore() {
  if [[ "${BACKUP_FIRESTORE:-false}" != "true" ]]; then
    return
  fi

  log "[Firestore] Starting backup..."

  if [[ -z "${FIRESTORE_PROJECT_ID:-}" ]]; then
    err "[Firestore] FIRESTORE_PROJECT_ID not set — skipping"
    ERRORS+=("firestore:missing-config")
    return
  fi

  local out_dir="$TODAY_DIR/firestore-export"
  local out_gz="$out_dir.tar.gz"

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[Firestore] DRY-RUN: would export to $out_gz"
    return
  fi

  if ! command -v gcloud >/dev/null 2>&1; then
    err "[Firestore] gcloud CLI not installed — skipping"
    ERRORS+=("firestore:no-gcloud")
    return
  fi

  if [[ -z "${FIRESTORE_GCS_BUCKET:-}" ]]; then
    err "[Firestore] FIRESTORE_GCS_BUCKET not set — skipping"
    ERRORS+=("firestore:missing-bucket")
    return
  fi

  local gcs_path="gs://$FIRESTORE_GCS_BUCKET/firestore-backup-$DATE_STAMP"
  if ! gcloud firestore export "$gcs_path" --project="$FIRESTORE_PROJECT_ID" 2>/tmp/fs_err.log; then
    err "[Firestore] Export failed: $(cat /tmp/fs_err.log)"
    ERRORS+=("firestore:export-failed")
    return
  fi

  log "[Firestore] Backup OK → $gcs_path"
  log "[Firestore] (Stored directly in GCS — no local copy)"
}

# ============================================================================
# MAIN
# ============================================================================
backup_turso
backup_supabase
backup_firestore
rotate_old_backups

# ── Summary ────────────────────────────────────────────────────────────────
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  log "✅ All backups completed successfully"
  alert "✅ Backup completed OK at $DATE_STAMP"
  exit 0
else
  log "⚠️  Backup completed with ${#ERRORS[@]} errors:"
  for e in "${ERRORS[@]}"; do
    log "    - $e"
  done
  alert "⚠️ Backup completed with ${#ERRORS[@]} errors at $DATE_STAMP: ${ERRORS[*]}"
  exit 1
fi

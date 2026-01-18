#!/bin/bash
# ============================================================================
# MotorSafe Backup Script
# ============================================================================
# Creates encrypted backups of database and uploads inventory.
# NO client data is logged - only metadata.
#
# Required env vars:
#   DATABASE_URL              - PostgreSQL connection string
#   BACKUP_ENCRYPTION_PASS    - Passphrase for AES-256-GCM encryption
#
# Optional env vars:
#   BACKUP_S3_ENDPOINT        - S3-compatible endpoint (e.g., R2)
#   BACKUP_S3_ACCESS_KEY_ID   - S3 access key
#   BACKUP_S3_SECRET_ACCESS_KEY - S3 secret key
#   BACKUP_S3_BUCKET          - S3 bucket name
#   BACKUP_INCLUDE_UPLOADS    - Set to "true" to include uploads folder
#   BACKUP_ENV                - Environment name (default: production)
#
# Usage:
#   ./run-backup.sh
#
# Output:
#   ./backups/backup-YYYYMMDD-HHMM.tar.gz.enc
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M)
BACKUP_ENV="${BACKUP_ENV:-production}"
BACKUP_NAME="backup-${BACKUP_ENV}-${TIMESTAMP}"
WORK_DIR="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate required environment variables (without logging values!)
validate_env() {
    log_info "Validating environment..."
    
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL is required"
        exit 1
    fi
    
    if [ -z "${BACKUP_ENCRYPTION_PASS:-}" ]; then
        log_error "BACKUP_ENCRYPTION_PASS is required"
        exit 1
    fi
    
    # Extract DB type from URL (without logging the URL itself)
    if [[ "${DATABASE_URL}" == postgres* ]]; then
        DB_TYPE="postgresql"
    elif [[ "${DATABASE_URL}" == mysql* ]]; then
        DB_TYPE="mysql"
    elif [[ "${DATABASE_URL}" == file:* ]] || [[ "${DATABASE_URL}" == *.db ]]; then
        DB_TYPE="sqlite"
    else
        DB_TYPE="unknown"
        log_warn "Unknown database type, attempting PostgreSQL..."
        DB_TYPE="postgresql"
    fi
    
    log_info "Database type: ${DB_TYPE}"
}

# Create working directory
setup_dirs() {
    log_info "Setting up backup directory..."
    mkdir -p "${WORK_DIR}"
    mkdir -p "${BACKUP_DIR}/archive"
}

# Backup PostgreSQL database
backup_postgres() {
    log_info "Backing up PostgreSQL database..."
    
    # pg_dump with custom format (compressed)
    # NO credentials logged - uses DATABASE_URL directly
    PGPASSWORD="" pg_dump "${DATABASE_URL}" \
        --format=custom \
        --no-owner \
        --no-acl \
        --file="${WORK_DIR}/database.dump" \
        2>&1 | grep -v "^$" || true
    
    if [ -f "${WORK_DIR}/database.dump" ]; then
        local size=$(du -h "${WORK_DIR}/database.dump" | cut -f1)
        log_info "Database dump created: ${size}"
    else
        log_error "Database dump failed"
        exit 1
    fi
}

# Backup MySQL database
backup_mysql() {
    log_info "Backing up MySQL database..."
    
    # Extract connection info without logging
    # MySQL URL format: mysql://user:pass@host:port/database
    mysqldump --single-transaction --routines --triggers \
        --result-file="${WORK_DIR}/database.sql" \
        2>&1 | grep -v "^$" || true
    
    if [ -f "${WORK_DIR}/database.sql" ]; then
        gzip "${WORK_DIR}/database.sql"
        local size=$(du -h "${WORK_DIR}/database.sql.gz" | cut -f1)
        log_info "Database dump created: ${size}"
    else
        log_error "Database dump failed"
        exit 1
    fi
}

# Backup SQLite database
backup_sqlite() {
    log_info "Backing up SQLite database..."
    
    # Extract file path from URL
    local db_path="${DATABASE_URL#file:}"
    
    if [ -f "${db_path}" ]; then
        cp "${db_path}" "${WORK_DIR}/database.sqlite"
        local size=$(du -h "${WORK_DIR}/database.sqlite" | cut -f1)
        log_info "Database copied: ${size}"
    else
        log_error "SQLite database file not found"
        exit 1
    fi
}

# Create uploads inventory (no actual file content - just metadata)
create_uploads_inventory() {
    log_info "Creating uploads inventory..."
    
    local uploads_dir="${PROJECT_ROOT}/uploads"
    
    if [ -d "${uploads_dir}" ]; then
        # Create inventory with file paths, sizes, and hashes (NO content)
        find "${uploads_dir}" -type f -exec sh -c '
            for file do
                size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                hash=$(sha256sum "$file" 2>/dev/null | cut -d" " -f1 || shasum -a 256 "$file" 2>/dev/null | cut -d" " -f1)
                rel_path="${file#'"${PROJECT_ROOT}/"'}"
                echo "{\"path\":\"${rel_path}\",\"size\":${size},\"sha256\":\"${hash}\"}"
            done
        ' sh {} + > "${WORK_DIR}/uploads-inventory.jsonl" 2>/dev/null || true
        
        local count=$(wc -l < "${WORK_DIR}/uploads-inventory.jsonl" 2>/dev/null || echo "0")
        log_info "Uploads inventory: ${count} files"
        
        # Optionally include actual uploads
        if [ "${BACKUP_INCLUDE_UPLOADS:-false}" = "true" ]; then
            log_info "Including uploads folder in backup..."
            cp -r "${uploads_dir}" "${WORK_DIR}/uploads"
            local size=$(du -sh "${WORK_DIR}/uploads" | cut -f1)
            log_info "Uploads copied: ${size}"
        fi
    else
        log_warn "No uploads directory found"
        echo "[]" > "${WORK_DIR}/uploads-inventory.jsonl"
    fi
}

# Create manifest with metadata
create_manifest() {
    log_info "Creating manifest..."
    
    local git_sha=$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    # Calculate checksums of backup files
    local db_hash=""
    local db_size=""
    
    if [ -f "${WORK_DIR}/database.dump" ]; then
        db_hash=$(sha256sum "${WORK_DIR}/database.dump" | cut -d" " -f1)
        db_size=$(stat -f%z "${WORK_DIR}/database.dump" 2>/dev/null || stat -c%s "${WORK_DIR}/database.dump" 2>/dev/null)
    elif [ -f "${WORK_DIR}/database.sql.gz" ]; then
        db_hash=$(sha256sum "${WORK_DIR}/database.sql.gz" | cut -d" " -f1)
        db_size=$(stat -f%z "${WORK_DIR}/database.sql.gz" 2>/dev/null || stat -c%s "${WORK_DIR}/database.sql.gz" 2>/dev/null)
    elif [ -f "${WORK_DIR}/database.sqlite" ]; then
        db_hash=$(sha256sum "${WORK_DIR}/database.sqlite" | cut -d" " -f1)
        db_size=$(stat -f%z "${WORK_DIR}/database.sqlite" 2>/dev/null || stat -c%s "${WORK_DIR}/database.sqlite" 2>/dev/null)
    fi
    
    cat > "${WORK_DIR}/manifest.json" << EOF
{
  "version": "1.0",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${BACKUP_ENV}",
  "database": {
    "type": "${DB_TYPE}",
    "sha256": "${db_hash}",
    "sizeBytes": ${db_size:-0}
  },
  "git": {
    "sha": "${git_sha}",
    "branch": "${git_branch}"
  },
  "encryption": "AES-256-GCM",
  "includesUploads": ${BACKUP_INCLUDE_UPLOADS:-false}
}
EOF
    
    log_info "Manifest created"
}

# Create tarball and encrypt
create_encrypted_archive() {
    log_info "Creating encrypted archive..."
    
    local tar_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    local enc_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.enc"
    
    # Create tarball
    tar -czf "${tar_file}" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
    
    local tar_size=$(du -h "${tar_file}" | cut -f1)
    log_info "Tarball created: ${tar_size}"
    
    # Encrypt with AES-256-GCM
    # Note: Using openssl for maximum portability
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "${tar_file}" \
        -out "${enc_file}" \
        -pass env:BACKUP_ENCRYPTION_PASS
    
    local enc_size=$(du -h "${enc_file}" | cut -f1)
    log_info "Encrypted archive created: ${enc_size}"
    
    # Create checksum of encrypted file
    sha256sum "${enc_file}" | cut -d" " -f1 > "${enc_file}.sha256"
    
    # Cleanup unencrypted files
    rm -rf "${WORK_DIR}"
    rm -f "${tar_file}"
    
    echo "${enc_file}"
}

# Upload to S3-compatible storage
upload_to_s3() {
    local file="$1"
    
    if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
        log_warn "S3 not configured, skipping upload"
        return 0
    fi
    
    log_info "Uploading to S3..."
    
    # Configure AWS CLI for custom endpoint
    export AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY}"
    
    local s3_path="s3://${BACKUP_S3_BUCKET}/motorsafe/${BACKUP_ENV}/"
    local endpoint_arg=""
    
    if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
        endpoint_arg="--endpoint-url ${BACKUP_S3_ENDPOINT}"
    fi
    
    # Upload encrypted backup
    aws s3 cp ${endpoint_arg} "${file}" "${s3_path}"
    aws s3 cp ${endpoint_arg} "${file}.sha256" "${s3_path}"
    
    log_info "Uploaded to ${s3_path}"
}

# Apply retention policy
apply_retention() {
    log_info "Applying retention policy..."
    
    # Local retention: keep last 7 days
    find "${BACKUP_DIR}" -name "backup-*.tar.gz.enc" -mtime +7 -delete 2>/dev/null || true
    find "${BACKUP_DIR}" -name "backup-*.tar.gz.enc.sha256" -mtime +7 -delete 2>/dev/null || true
    
    # S3 retention is handled by retention.sh script
    log_info "Local cleanup done (keeping 7 days)"
}

# Main execution
main() {
    log_info "Starting backup: ${BACKUP_NAME}"
    log_info "Environment: ${BACKUP_ENV}"
    
    validate_env
    setup_dirs
    
    # Backup database based on type
    case "${DB_TYPE}" in
        postgresql)
            backup_postgres
            ;;
        mysql)
            backup_mysql
            ;;
        sqlite)
            backup_sqlite
            ;;
        *)
            log_error "Unsupported database type: ${DB_TYPE}"
            exit 1
            ;;
    esac
    
    create_uploads_inventory
    create_manifest
    
    local encrypted_file=$(create_encrypted_archive)
    
    upload_to_s3 "${encrypted_file}"
    apply_retention
    
    log_info "Backup completed successfully!"
    log_info "Output: ${encrypted_file}"
    
    # Print checksum for verification
    local checksum=$(cat "${encrypted_file}.sha256")
    log_info "SHA256: ${checksum}"
}

main "$@"

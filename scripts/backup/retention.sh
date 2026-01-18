#!/bin/bash
# ============================================================================
# MotorSafe Backup Retention Script
# ============================================================================
# Manages backup retention in S3-compatible storage.
# Policy: 30 daily + 12 monthly (1st of each month)
#
# Required env vars:
#   BACKUP_S3_ENDPOINT        - S3-compatible endpoint
#   BACKUP_S3_ACCESS_KEY_ID   - S3 access key
#   BACKUP_S3_SECRET_ACCESS_KEY - S3 secret key
#   BACKUP_S3_BUCKET          - S3 bucket name
#
# Optional env vars:
#   BACKUP_ENV                - Environment name (default: production)
#   BACKUP_DAILY_RETENTION    - Days to keep daily backups (default: 30)
#   BACKUP_MONTHLY_RETENTION  - Months to keep monthly backups (default: 12)
# ============================================================================

set -euo pipefail

# Configuration
BACKUP_ENV="${BACKUP_ENV:-production}"
DAILY_RETENTION="${BACKUP_DAILY_RETENTION:-30}"
MONTHLY_RETENTION="${BACKUP_MONTHLY_RETENTION:-12}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validate environment
if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
    log_error "BACKUP_S3_BUCKET is required"
    exit 1
fi

export AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_ACCESS_KEY}"

ENDPOINT_ARG=""
if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
    ENDPOINT_ARG="--endpoint-url ${BACKUP_S3_ENDPOINT}"
fi

S3_PREFIX="s3://${BACKUP_S3_BUCKET}/motorsafe/${BACKUP_ENV}/"

log_info "Applying retention policy for ${S3_PREFIX}"
log_info "Daily retention: ${DAILY_RETENTION} days"
log_info "Monthly retention: ${MONTHLY_RETENTION} months"

# List all backups
BACKUPS=$(aws s3 ls ${ENDPOINT_ARG} "${S3_PREFIX}" | grep "backup-.*\.tar\.gz\.enc$" | awk '{print $4}' | sort)

if [ -z "${BACKUPS}" ]; then
    log_info "No backups found"
    exit 0
fi

# Calculate cutoff dates
DAILY_CUTOFF=$(date -d "-${DAILY_RETENTION} days" +%Y%m%d 2>/dev/null || date -v-${DAILY_RETENTION}d +%Y%m%d)
MONTHLY_CUTOFF=$(date -d "-${MONTHLY_RETENTION} months" +%Y%m%d 2>/dev/null || date -v-${MONTHLY_RETENTION}m +%Y%m%d)

log_info "Daily cutoff: ${DAILY_CUTOFF}"
log_info "Monthly cutoff: ${MONTHLY_CUTOFF}"

# Process each backup
declare -A MONTHLY_KEPT

while IFS= read -r backup; do
    # Extract date from backup name: backup-production-20260117-0300.tar.gz.enc
    DATE_PART=$(echo "${backup}" | grep -oE '[0-9]{8}' | head -1)
    
    if [ -z "${DATE_PART}" ]; then
        log_warn "Could not parse date from: ${backup}"
        continue
    fi
    
    # Check if it's a monthly backup (1st of month)
    DAY="${DATE_PART:6:2}"
    MONTH="${DATE_PART:0:6}"  # YYYYMM
    
    if [ "${DAY}" = "01" ]; then
        # Monthly backup - check monthly retention
        if [ "${DATE_PART}" -ge "${MONTHLY_CUTOFF}" ]; then
            if [ -z "${MONTHLY_KEPT[${MONTH}]:-}" ]; then
                log_info "Keeping monthly: ${backup}"
                MONTHLY_KEPT[${MONTH}]="${backup}"
            else
                # Already have a monthly for this month, treat as daily
                if [ "${DATE_PART}" -lt "${DAILY_CUTOFF}" ]; then
                    log_info "Deleting (old daily duplicate): ${backup}"
                    aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}" || true
                    aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}.sha256" || true
                fi
            fi
        else
            log_info "Deleting (old monthly): ${backup}"
            aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}" || true
            aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}.sha256" || true
        fi
    else
        # Daily backup
        if [ "${DATE_PART}" -lt "${DAILY_CUTOFF}" ]; then
            log_info "Deleting (old daily): ${backup}"
            aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}" || true
            aws s3 rm ${ENDPOINT_ARG} "${S3_PREFIX}${backup}.sha256" || true
        else
            log_info "Keeping daily: ${backup}"
        fi
    fi
done <<< "${BACKUPS}"

log_info "Retention policy applied"

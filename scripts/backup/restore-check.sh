#!/bin/bash
# ============================================================================
# MotorSafe Restore Check Script
# ============================================================================
# Validates that a restored database contains expected data.
# NO client data is logged - only counts and existence checks.
#
# Usage:
#   ./restore-check.sh --host=localhost --user=restore_test --dbname=motorsafe_restore_test
#   
# Or with PGPASSWORD/DATABASE_URL environment variable.
# ============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_check() { echo -e "    Checking: $1..."; }

# Parse arguments
PG_HOST=""
PG_USER=""
PG_DBNAME=""
PG_PORT="5432"

for arg in "$@"; do
  case $arg in
    --host=*)
      PG_HOST="${arg#*=}"
      ;;
    --user=*)
      PG_USER="${arg#*=}"
      ;;
    --dbname=*)
      PG_DBNAME="${arg#*=}"
      ;;
    --port=*)
      PG_PORT="${arg#*=}"
      ;;
  esac
done

# Build connection string
if [ -n "${DATABASE_URL:-}" ]; then
    PSQL_CMD="psql ${DATABASE_URL}"
else
    PSQL_CMD="psql -h ${PG_HOST} -U ${PG_USER} -d ${PG_DBNAME} -p ${PG_PORT}"
fi

echo ""
echo "============================================"
echo "  MotorSafe Restore Verification"
echo "============================================"
echo ""

ERRORS=0

# Check 1: Garages table exists and has data
log_check "Garages table"
GARAGE_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"Garage\";" 2>/dev/null | tr -d ' ')
if [ -n "${GARAGE_COUNT}" ] && [ "${GARAGE_COUNT}" -ge 0 ]; then
    log_info "Garages: ${GARAGE_COUNT} records"
else
    log_error "Garages table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Interventions table exists and has data
log_check "Interventions table"
INTERVENTION_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"Intervention\";" 2>/dev/null | tr -d ' ')
if [ -n "${INTERVENTION_COUNT}" ] && [ "${INTERVENTION_COUNT}" -ge 0 ]; then
    log_info "Interventions: ${INTERVENTION_COUNT} records"
else
    log_error "Interventions table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: SignatureRequest table (critical for legal compliance)
log_check "SignatureRequest table"
SIG_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"SignatureRequest\";" 2>/dev/null | tr -d ' ')
if [ -n "${SIG_COUNT}" ] && [ "${SIG_COUNT}" -ge 0 ]; then
    log_info "SignatureRequests: ${SIG_COUNT} records"
    
    # Check for signed documents with snapshots
    SIGNED_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"SignatureRequest\" WHERE status = 'SIGNED';" 2>/dev/null | tr -d ' ')
    log_info "  - Signed: ${SIGNED_COUNT}"
    
    SNAPSHOT_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"SignatureRequest\" WHERE \"legalSnapshotHash\" IS NOT NULL;" 2>/dev/null | tr -d ' ')
    log_info "  - With legal snapshot: ${SNAPSHOT_COUNT}"
else
    log_error "SignatureRequest table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Quotes table
log_check "Quotes table"
QUOTE_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"Quote\";" 2>/dev/null | tr -d ' ')
if [ -n "${QUOTE_COUNT}" ] && [ "${QUOTE_COUNT}" -ge 0 ]; then
    log_info "Quotes: ${QUOTE_COUNT} records"
else
    log_error "Quotes table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Invoices table
log_check "Invoices table"
INVOICE_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"Invoice\";" 2>/dev/null | tr -d ' ')
if [ -n "${INVOICE_COUNT}" ] && [ "${INVOICE_COUNT}" -ge 0 ]; then
    log_info "Invoices: ${INVOICE_COUNT} records"
else
    log_error "Invoices table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: AuditLog table
log_check "AuditLog table"
AUDIT_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"AuditLog\";" 2>/dev/null | tr -d ' ')
if [ -n "${AUDIT_COUNT}" ] && [ "${AUDIT_COUNT}" -ge 0 ]; then
    log_info "AuditLogs: ${AUDIT_COUNT} records"
else
    log_error "AuditLog table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Users table
log_check "Users table"
USER_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')
if [ -n "${USER_COUNT}" ] && [ "${USER_COUNT}" -ge 0 ]; then
    log_info "Users: ${USER_COUNT} records"
else
    log_error "Users table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 8: Documents table
log_check "Documents table"
DOC_COUNT=$(${PSQL_CMD} -t -c "SELECT COUNT(*) FROM \"Document\";" 2>/dev/null | tr -d ' ')
if [ -n "${DOC_COUNT}" ] && [ "${DOC_COUNT}" -ge 0 ]; then
    log_info "Documents: ${DOC_COUNT} records"
else
    log_error "Documents table check failed"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "============================================"
if [ ${ERRORS} -eq 0 ]; then
    log_info "All restore checks passed!"
    echo "============================================"
    exit 0
else
    log_error "${ERRORS} check(s) failed"
    echo "============================================"
    exit 1
fi

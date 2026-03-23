#!/usr/bin/env bash
set -euo pipefail

########################################
# DailyDev Agent Runner (v2)
# Thin wrapper — launches the manager agent.
# All orchestration logic lives in CLAUDE.md.
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"
LOGS_DIR="${HARNESS_DIR}/logs"
LOCK_FILE="${HARNESS_DIR}/logs/runner.lock"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOGS_DIR}/run-${TIMESTAMP}.log"

mkdir -p "${LOGS_DIR}"

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "${LOG_FILE}"
}

########################################
# Lock (PID-based)
########################################
acquire_lock() {
  if [ -f "${LOCK_FILE}" ]; then
    local pid
    pid="$(cat "${LOCK_FILE}" 2>/dev/null || echo "")"
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      log "Another runner active (PID: ${pid}). Exiting."
      exit 1
    fi
    rm -f "${LOCK_FILE}"
  fi
  echo $$ > "${LOCK_FILE}"
  log "Lock acquired (PID: $$)"
}

cleanup() {
  cd "${PROJECT_DIR}"
  if [ -n "$(git status --porcelain -- src/ data/ __tests__/ 2>/dev/null)" ]; then
    log "Uncommitted changes detected. Rolling back."
    git checkout -- . 2>/dev/null || true
    git clean -fd -- src/ data/ __tests__/ 2>/dev/null || true
  fi
  rm -f "${LOCK_FILE}"
  find "${LOGS_DIR}" -name "run-*.log" -mtime +7 -delete 2>/dev/null || true
  log "Cleanup complete."
}
trap cleanup EXIT

########################################
# Main
########################################
main() {
  cd "${PROJECT_DIR}"
  acquire_lock

  log "=== DailyDev Harness Runner v2 ==="

  # Load env
  if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env"
    set +a
  fi

  # Sync
  log "Syncing with remote..."
  git pull --rebase >> "${LOG_FILE}" 2>&1 || log "Pull failed. Continuing."

  # Install deps if needed
  if git diff --name-only HEAD~1 2>/dev/null | grep -q 'package-lock.json'; then
    log "Dependencies changed. Running npm ci..."
    npm ci --silent >> "${LOG_FILE}" 2>&1 || log "npm ci failed (continuing)"
  fi

  # Launch manager (foreground, synchronous)
  # Use stdin pipe pattern (same as market-analyst) for reliable output capture
  log "Launching manager agent..."
  local manager_prompt="You are the DailyDev Harness Manager. Execute the Manager Protocol defined in CLAUDE.md now. Current time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  echo "${manager_prompt}" | claude -p \
    --allowedTools 'Bash(*),Read,Write,Edit,Glob,Grep' \
    --dangerously-skip-permissions \
    --output-format text >> "${LOG_FILE}" 2>&1 || log "Manager exited with error."

  log "=== Run complete ==="
}

main "$@"

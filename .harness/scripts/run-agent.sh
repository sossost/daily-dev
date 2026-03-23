#!/usr/bin/env bash
set -euo pipefail

########################################
# DailyDev Agent Runner
# Main orchestration script for autonomous agent execution.
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"
STATE_DIR="${HARNESS_DIR}/state"
LOGS_DIR="${HARNESS_DIR}/logs"
LOCK_FILE="${STATE_DIR}/runner.lock"
HISTORY_DIR="${STATE_DIR}/history"
RUN_COUNT_DIR="${STATE_DIR}/run-counts"

PROTECTED_PATTERN='\.harness/|CLAUDE\.md|jest\.config\.ts|next\.config\.ts|tsconfig\.json|package\.json|^package-lock\.json$'

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TODAY="$(date +%Y-%m-%d)"
LOG_FILE="${LOGS_DIR}/run-${TIMESTAMP}.log"

mkdir -p "${STATE_DIR}" "${LOGS_DIR}" "${HISTORY_DIR}" "${RUN_COUNT_DIR}"

########################################
# Logging
########################################
log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo "${msg}" | tee -a "${LOG_FILE}"
}

log_error() {
  local msg="[$(date '+%H:%M:%S')] ERROR: $1"
  echo "${msg}" | tee -a "${LOG_FILE}" >&2
}

########################################
# Lock Management (PID-based)
########################################
acquire_lock() {
  if [ -f "${LOCK_FILE}" ]; then
    local existing_pid
    existing_pid="$(cat "${LOCK_FILE}" 2>/dev/null || echo "")"
    if [ -n "${existing_pid}" ] && kill -0 "${existing_pid}" 2>/dev/null; then
      log_error "Another runner is active (PID: ${existing_pid}). Exiting."
      exit 1
    fi
    log "Stale lock found (PID: ${existing_pid}). Removing."
    rm -f "${LOCK_FILE}"
  fi
  echo $$ > "${LOCK_FILE}"
  log "Lock acquired (PID: $$)"
}

release_lock() {
  rm -f "${LOCK_FILE}"
}

# Ensure lock is always released
cleanup() {
  release_lock
  log "Cleanup complete."
}
trap cleanup EXIT

########################################
# Rollback
########################################
rollback() {
  log "Rolling back all changes..."
  cd "${PROJECT_DIR}"
  git reset HEAD -- . 2>/dev/null || true
  git checkout -- . 2>/dev/null || true
  # Remove untracked files in working directories
  local untracked
  untracked="$(git ls-files --others --exclude-standard -- src/ data/ __tests__/ 2>/dev/null || echo "")"
  if [ -n "${untracked}" ]; then
    echo "${untracked}" | while IFS= read -r f; do
      rm -f "${PROJECT_DIR}/${f}"
    done
  fi
  log "Rollback complete."
}

########################################
# State & History
########################################
write_state() {
  local agent="$1" status="$2" summary="${3:-}"
  local state_file="${STATE_DIR}/last-run"
  printf '%s|%s|%s|%s\n' \
    "${agent}" "${status}" "${summary}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${state_file}"
}

record_history() {
  local agent="$1" status="$2" summary="$3"
  local history_file="${HISTORY_DIR}/history-${agent}.log"
  printf '[%s] %s: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${status}" "${summary}" >> "${history_file}"
}

increment_run_count() {
  local agent="$1"
  local count_file="${RUN_COUNT_DIR}/${agent}-${TODAY}.count"
  local current=0
  if [ -f "${count_file}" ]; then
    current="$(tr -d '[:space:]' < "${count_file}" || echo "0")"
    if ! [[ "${current}" =~ ^[0-9]+$ ]]; then
      current=0
    fi
  fi
  printf '%d' "$((current + 1))" > "${count_file}"
}

########################################
# History Injection — build context from past runs
########################################
build_history_context() {
  local agent="$1"
  local history_file="${HISTORY_DIR}/history-${agent}.log"
  if [ ! -f "${history_file}" ]; then
    echo ""
    return
  fi
  local entries
  entries="$(tail -n 5 "${history_file}" 2>/dev/null || echo "")"
  if [ -z "${entries}" ]; then
    echo ""
    return
  fi
  printf '\n## Recent History (last 5 runs)\n\n```\n%s\n```\n\nAvoid repeating failed approaches. Build on successful ones.\n' "${entries}"
}

########################################
# SUMMARY / DETAILS extraction
########################################
extract_summary() {
  local output="$1"
  local summary

  summary="$(echo "${output}" | grep -o 'SUMMARY: .*' | tail -1 | sed 's/^SUMMARY: //')"

  if [ -z "${summary}" ]; then
    local diff_stat
    diff_stat="$(git diff --stat 2>/dev/null | tail -1 | sed 's/^ *//')"
    summary="${diff_stat:-auto-update}"
  fi

  # Truncate to 50 chars for commit title
  if [ "${#summary}" -gt 50 ]; then
    summary="$(echo "${summary}" | cut -c1-47)..."
  fi

  echo "${summary}"
}

extract_details() {
  local output="$1"

  # Try extracting DETAILS block from agent output
  local details
  details="$(echo "${output}" | sed -n '/^DETAILS:$/,/^$/p' | sed '1d;$d')"

  # Fallback: auto-generate from git diff
  if [ -z "${details}" ]; then
    local diff_stat files_changed insertions deletions
    diff_stat="$(git diff --stat 2>/dev/null | tail -1)"
    files_changed="$(echo "${diff_stat}" | grep -o '[0-9]* file' | grep -o '[0-9]*')"
    insertions="$(echo "${diff_stat}" | grep -o '[0-9]* insertion' | grep -o '[0-9]*')"
    deletions="$(echo "${diff_stat}" | grep -o '[0-9]* deletion' | grep -o '[0-9]*')"

    local new_files
    new_files="$(git ls-files --others --exclude-standard -- src/ data/ __tests__/ 2>/dev/null)"

    details=""
    if [ -n "${files_changed}" ]; then
      details="Files: ${files_changed:-0} changed, +${insertions:-0} -${deletions:-0}"
    fi
    if [ -n "${new_files}" ]; then
      local new_list
      new_list="$(echo "${new_files}" | head -5 | sed 's/^/  - /')"
      details="${details}${details:+\n}New:\n${new_list}"
    fi
  fi

  echo "${details}"
}

########################################
# Main
########################################
main() {
  cd "${PROJECT_DIR}"
  acquire_lock

  log "=== DailyDev Agent Runner ==="
  log "Project: ${PROJECT_DIR}"

  # ------------------------------------------
  # Agent Selection
  # ------------------------------------------
  local AGENT_TYPE="${1:-}"

  if [ -z "${AGENT_TYPE}" ]; then
    log "No agent specified. Running dynamic selection..."
    AGENT_TYPE="$(npm run --silent select-agent 2>/dev/null || echo "")"
    if [ -z "${AGENT_TYPE}" ]; then
      log_error "Agent selection failed. Exiting."
      write_state "unknown" "error" "Agent selection failed"
      record_history "unknown" "error" "Agent selection failed"
      exit 1
    fi
  fi

  # Sanitize and validate
  AGENT_TYPE="$(echo "${AGENT_TYPE}" | tr -d '[:space:]' | tr -cd 'a-z-')"

  local VALID_AGENTS="content code expansion feature"
  if ! echo "${VALID_AGENTS}" | grep -qw "${AGENT_TYPE}"; then
    log_error "Invalid agent type: '${AGENT_TYPE}'. Must be one of: ${VALID_AGENTS}"
    write_state "${AGENT_TYPE}" "error" "Invalid agent type"
    record_history "${AGENT_TYPE}" "error" "Invalid agent type"
    exit 1
  fi

  log "Selected agent: ${AGENT_TYPE}"

  # ------------------------------------------
  # Pre-checks
  # ------------------------------------------
  log "Running pre-checks..."
  if ! bash "${HARNESS_DIR}/scripts/pre-check.sh" "${AGENT_TYPE}"; then
    log "Pre-check blocked agent: ${AGENT_TYPE}"
    write_state "${AGENT_TYPE}" "skipped" "Pre-check blocked"
    record_history "${AGENT_TYPE}" "skipped" "Pre-check blocked"
    exit 0
  fi

  # ------------------------------------------
  # Build History Context
  # ------------------------------------------
  local history_context
  history_context="$(build_history_context "${AGENT_TYPE}")"

  # ------------------------------------------
  # Snapshot pre-agent state for boundary check
  # ------------------------------------------
  PRE_AGENT_UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | sort || true)
  PRE_AGENT_MODIFIED=$(git diff --name-only 2>/dev/null | sort || true)

  # ------------------------------------------
  # Phase 1: Run Work Agent
  # ------------------------------------------
  log "Phase 1: Running ${AGENT_TYPE} agent..."
  local agent_prompt_file="${HARNESS_DIR}/agents/${AGENT_TYPE}.md"
  if [ ! -f "${agent_prompt_file}" ]; then
    log_error "Agent prompt file not found: ${agent_prompt_file}"
    write_state "${AGENT_TYPE}" "error" "Agent prompt file missing"
    record_history "${AGENT_TYPE}" "error" "Agent prompt file missing"
    exit 1
  fi

  local agent_prompt
  agent_prompt="$(cat "${agent_prompt_file}")"

  local full_prompt
  full_prompt="$(printf '%s\n%s\n\nWork directory: %s\n\nIMPORTANT: End your output with:\nSUMMARY: <short title, max 50 chars>\nDETAILS:\n<structured body: what changed, counts, stats>' \
    "${agent_prompt}" "${history_context}" "${PROJECT_DIR}")"

  local agent_output=""
  agent_output="$(claude -p "${full_prompt}" \
    --allowedTools 'Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git ls-files:*),Bash(cat:*),Bash(ls:*),Bash(find:*),Bash(wc:*),Bash(mkdir:*),Bash(head:*),Bash(tail:*),Read,Write,Edit,Glob,Grep' \
    --dangerously-skip-permissions \
    --max-turns 50 2>&1)" || true

  log "Agent execution complete."

  local SUMMARY DETAILS
  SUMMARY="$(extract_summary "${agent_output}")"
  DETAILS="$(extract_details "${agent_output}")"
  log "Summary: ${SUMMARY}"

  # ------------------------------------------
  # Boundary Check: Verify all changes are within allowed paths
  # Only check NEWLY created/modified files by the agent (compare against pre-snapshot)
  # ------------------------------------------
  log "Verifying changes are within allowed paths (src/, data/, __tests__/)..."
  POST_AGENT_UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | sort || true)
  POST_AGENT_MODIFIED=$(git diff --name-only 2>/dev/null | sort || true)

  AGENT_NEW_FILES=$(comm -13 <(echo "$PRE_AGENT_UNTRACKED") <(echo "$POST_AGENT_UNTRACKED") || true)
  AGENT_MODIFIED_FILES=$(comm -13 <(echo "$PRE_AGENT_MODIFIED") <(echo "$POST_AGENT_MODIFIED") || true)

  OFFPATH=$(printf '%s\n%s' "$AGENT_NEW_FILES" "$AGENT_MODIFIED_FILES" | grep -vE '^(src/|data/|__tests__/)' | grep -v '^$' || true)

  if [ -n "$OFFPATH" ]; then
    log "CRITICAL: Agent changes detected outside allowed paths — rolling back"
    log "Off-path files: $OFFPATH"
    write_state "${AGENT_TYPE}" "fail" "changes outside allowed paths"
    record_history "${AGENT_TYPE}" "fail" "changes outside allowed paths"
    rollback
    exit 1
  fi

  # ------------------------------------------
  # Change Detection
  # ------------------------------------------
  log "Checking for changes..."
  local has_changes=false
  if [ -n "$(git diff --name-only 2>/dev/null)" ] || [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
    has_changes=true
  fi

  if [ "${has_changes}" = false ]; then
    log "No changes detected. Skipping commit."
    write_state "${AGENT_TYPE}" "no-changes" "${SUMMARY}"
    record_history "${AGENT_TYPE}" "no-changes" "${SUMMARY}"
    exit 0
  fi

  # ------------------------------------------
  # Protected File Detection
  # ------------------------------------------
  log "Checking for protected file modifications..."
  local changed_files
  changed_files="$(git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"

  local protected_violations
  protected_violations="$(echo "${changed_files}" | grep -E "${PROTECTED_PATTERN}" || echo "")"
  if [ -n "${protected_violations}" ]; then
    log_error "Protected files modified:"
    echo "${protected_violations}" | while IFS= read -r f; do log_error "  - ${f}"; done
    log "Rolling back due to protected file violation."
    rollback
    write_state "${AGENT_TYPE}" "rejected" "Protected files modified: ${protected_violations}"
    record_history "${AGENT_TYPE}" "rejected" "Protected files modified"
    exit 1
  fi

  # ------------------------------------------
  # Phase 2: Guardrails (validate)
  # ------------------------------------------
  log "Phase 2: Running guardrails..."
  if ! bash "${HARNESS_DIR}/scripts/validate.sh" "${AGENT_TYPE}" 2>&1 | tee -a "${LOG_FILE}"; then
    log_error "Guardrails failed."
    rollback
    write_state "${AGENT_TYPE}" "rejected" "Guardrails failed"
    record_history "${AGENT_TYPE}" "rejected" "Guardrails failed: ${SUMMARY}"
    exit 1
  fi

  # ------------------------------------------
  # Phase 3: Review with Retry
  # ------------------------------------------
  log "Phase 3: Review..."
  local review_prompt_file="${HARNESS_DIR}/agents/review.md"
  local max_review_attempts=3
  local review_attempt=0
  local approved=false

  while [ "${review_attempt}" -lt "${max_review_attempts}" ]; do
    review_attempt=$((review_attempt + 1))
    log "Review attempt ${review_attempt}/${max_review_attempts}"

    # Build diff for review
    local diff_content
    local diff_size
    diff_content="$(git diff 2>/dev/null; git diff --cached 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null | while IFS= read -r f; do echo "=== NEW FILE: ${f} ==="; cat "${f}" 2>/dev/null || true; done)"
    diff_size="$(echo "${diff_content}" | wc -c | tr -d '[:space:]')"

    if [ "${diff_size}" -gt 50000 ]; then
      log "Diff too large (${diff_size} bytes). Using stat summary."
      diff_content="$(git diff --stat 2>/dev/null; echo '---'; git ls-files --others --exclude-standard 2>/dev/null)"
    fi

    # Snapshot file state before review agent (to detect unintended modifications)
    local pre_review_diff
    pre_review_diff="$(git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"

    local review_prompt
    review_prompt="$(cat "${review_prompt_file}")

## Changes to Review

\`\`\`diff
${diff_content}
\`\`\`

Review these changes and output APPROVE or REJECT with reason.
If APPROVE, also output: SUMMARY: {one-line description of what was changed}"

    local review_output
    review_output="$(claude -p "${review_prompt}" \
      --allowedTools 'Bash(cat:*),Bash(ls:*),Bash(find:*),Read,Glob,Grep' \
      --dangerously-skip-permissions \
      --max-turns 10 2>&1)" || true

    # Verify review agent did not modify any files
    local post_review_diff
    post_review_diff="$(git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"
    if [ "${post_review_diff}" != "${pre_review_diff}" ]; then
      log "CRITICAL: Review agent modified files — rolling back"
      rollback
      write_state "${AGENT_TYPE}" "rejected" "Review agent modified files"
      record_history "${AGENT_TYPE}" "rejected" "Review agent modified files"
      exit 1
    fi

    # Extract verdict
    if echo "${review_output}" | grep -q '^APPROVE'; then
      log "Review: APPROVED"
      # If work agent didn't provide SUMMARY, try extracting from review
      local review_summary
      review_summary="$(echo "${review_output}" | grep -o 'SUMMARY: .*' | tail -1 | sed 's/^SUMMARY: //')"
      if [ -n "${review_summary}" ]; then
        SUMMARY="${review_summary}"
      fi
      approved=true
      break
    elif echo "${review_output}" | grep -q '^REJECT'; then
      local reject_reason
      reject_reason="$(echo "${review_output}" | grep -A1 '^REJECT' | tail -1 | sed 's/^Reason: //' || echo "")"
      if [ "${reject_reason}" = "REJECT" ] || [ -z "${reject_reason}" ]; then
        reject_reason="No specific reason provided. Review the changes carefully and fix any quality issues."
      fi
      log "Review: REJECTED — ${reject_reason}"

      if [ "${review_attempt}" -lt "${max_review_attempts}" ]; then
        log "Attempting fix (attempt ${review_attempt})..."

        local current_diff
        current_diff="$(git diff 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null | while IFS= read -r f; do echo "=== NEW FILE: ${f} ==="; cat "${f}" 2>/dev/null || true; done)"

        local fix_prompt
        fix_prompt="You are fixing issues found during code review.

## Rejection Reason
${reject_reason}

## Current Changes
\`\`\`diff
${current_diff}
\`\`\`

Fix the issues described in the rejection reason. Do NOT introduce new features — only fix what was flagged.
Your very last line of output must be SUMMARY: followed by a brief description of what you fixed."

        local fix_output
        fix_output="$(claude -p "${fix_prompt}" \
          --allowedTools 'Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(cat:*),Bash(ls:*),Bash(find:*),Read,Write,Edit,Glob,Grep' \
          --dangerously-skip-permissions \
          --max-turns 15 2>&1)" || true

        # Update summary from fix
        local fix_summary
        fix_summary="$(extract_summary "${fix_output}")"
        SUMMARY="${SUMMARY}; fix: ${fix_summary}"

        # Re-run guardrails after fix
        log "Re-running guardrails after fix..."
        if ! bash "${HARNESS_DIR}/scripts/validate.sh" "${AGENT_TYPE}" 2>&1 | tee -a "${LOG_FILE}"; then
          log_error "Guardrails failed after fix."
          rollback
          write_state "${AGENT_TYPE}" "rejected" "Guardrails failed after fix"
          record_history "${AGENT_TYPE}" "rejected" "Guardrails failed after fix: ${SUMMARY}"
          exit 1
        fi

        # Check protected files again after fix
        changed_files="$(git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"
        protected_violations="$(echo "${changed_files}" | grep -E "${PROTECTED_PATTERN}" || echo "")"
        if [ -n "${protected_violations}" ]; then
          log_error "Fix introduced protected file changes. Rolling back."
          rollback
          write_state "${AGENT_TYPE}" "rejected" "Fix modified protected files"
          record_history "${AGENT_TYPE}" "rejected" "Fix modified protected files"
          exit 1
        fi
      fi
    else
      log_error "Review did not produce a clear verdict."
      rollback
      write_state "${AGENT_TYPE}" "error" "Review produced no verdict"
      record_history "${AGENT_TYPE}" "error" "Review produced no verdict: ${SUMMARY}"
      exit 1
    fi
  done

  if [ "${approved}" = false ]; then
    log_error "Max review attempts reached. Rolling back."
    rollback
    write_state "${AGENT_TYPE}" "rejected" "Max review attempts exceeded"
    record_history "${AGENT_TYPE}" "rejected" "Max review attempts exceeded: ${SUMMARY}"
    exit 1
  fi

  # ------------------------------------------
  # Doc Auto-Update
  # ------------------------------------------
  log "Updating documentation..."
  npm run --silent generate-readme 2>/dev/null || log "README generation skipped (script error)"
  npm run --silent update-goals 2>/dev/null || log "GOALS update skipped (script error)"
  npx tsx .harness/scripts/generate-codemap.ts 2>/dev/null || log "Codemap generation skipped (script error)"

  # ------------------------------------------
  # Targeted Git Add
  # ------------------------------------------
  log "Staging changes..."
  cd "${PROJECT_DIR}"

  # Add specific directories
  git add src/ 2>/dev/null || true
  git add data/questions/ 2>/dev/null || true
  git add __tests__/ 2>/dev/null || true
  git add README.md 2>/dev/null || true
  git add GOALS.md 2>/dev/null || true
  git add .harness/docs/codemap.md 2>/dev/null || true

  # Stage tracked file modifications/deletions
  git add -u 2>/dev/null || true

  # ------------------------------------------
  # Final Protection Check
  # ------------------------------------------
  log "Final protection check on staged files..."
  local staged_files
  staged_files="$(git diff --cached --name-only 2>/dev/null || echo "")"

  local staged_violations
  staged_violations="$(echo "${staged_files}" | grep -E "${PROTECTED_PATTERN}" || echo "")"
  if [ -n "${staged_violations}" ]; then
    log_error "Protected files in staging area:"
    echo "${staged_violations}" | while IFS= read -r f; do log_error "  - ${f}"; done
    rollback
    write_state "${AGENT_TYPE}" "rejected" "Protected files staged: ${staged_violations}"
    record_history "${AGENT_TYPE}" "rejected" "Protected files staged"
    exit 1
  fi

  # ------------------------------------------
  # Commit
  # ------------------------------------------
  local commit_title="feat(${AGENT_TYPE}): ${SUMMARY}"
  log "Committing: ${commit_title}"

  local commit_body=""
  if [ -n "${DETAILS}" ]; then
    commit_body="$(printf '\n%b' "${DETAILS}")"
  fi

  git commit -m "${commit_title}${commit_body}" 2>&1 | tee -a "${LOG_FILE}" || {
    log_error "Commit failed."
    rollback
    write_state "${AGENT_TYPE}" "error" "Commit failed"
    record_history "${AGENT_TYPE}" "error" "Commit failed: ${SUMMARY}"
    exit 1
  }

  # ------------------------------------------
  # Push (with auto-rebase on conflict)
  # ------------------------------------------
  log "Pushing to remote..."
  if ! git push 2>&1 | tee -a "${LOG_FILE}"; then
    log "Push rejected. Attempting pull --rebase..."
    if git pull --rebase 2>&1 | tee -a "${LOG_FILE}"; then
      log "Rebase successful. Retrying push..."
      if ! git push 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "Push failed after rebase."
        write_state "${AGENT_TYPE}" "error" "Push failed after rebase"
        record_history "${AGENT_TYPE}" "error" "Push failed after rebase: ${SUMMARY}"
        exit 1
      fi
    else
      log_error "Rebase failed. Aborting rebase and rolling back."
      git rebase --abort 2>/dev/null || true
      rollback
      write_state "${AGENT_TYPE}" "error" "Rebase conflict"
      record_history "${AGENT_TYPE}" "error" "Rebase conflict: ${SUMMARY}"
      exit 1
    fi
  fi
  # ------------------------------------------
  # Record State
  # ------------------------------------------
  write_state "${AGENT_TYPE}" "success" "${SUMMARY}"
  record_history "${AGENT_TYPE}" "success" "${SUMMARY}"
  increment_run_count "${AGENT_TYPE}"

  # ------------------------------------------
  # Cleanup Old Files
  # ------------------------------------------
  log "Cleaning up old files..."
  find "${LOGS_DIR}" -name "*.log" -mtime +7 -delete 2>/dev/null || true
  find "${RUN_COUNT_DIR}" -name "*.count" -mtime +3 -delete 2>/dev/null || true

  log "=== Run complete: ${AGENT_TYPE} — ${SUMMARY} ==="
}

main "$@"

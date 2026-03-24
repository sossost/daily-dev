#!/usr/bin/env bash
set -euo pipefail

########################################
# DailyDev Agent Runner (v2)
# 1. Manager decides what to do (lightweight, max-turns 5)
# 2. Sub-agent executes (direct call, no nesting)
# 3. Validate → Review → Commit → Push
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"
LOGS_DIR="${HARNESS_DIR}/logs"
LOCK_FILE="${HARNESS_DIR}/logs/runner.lock"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOGS_DIR}/run-${TIMESTAMP}.log"

PROTECTED_PATTERN='\.harness/(agents|scripts|launchd)/|CLAUDE\.md|jest\.config\.ts|next\.config\.ts|tsconfig\.json|package\.json|^package-lock\.json$'

mkdir -p "${LOGS_DIR}"

log() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

notify() {
  local status="$1" title="$2" body="${3:-}"
  local webhook_url="${DISCORD_WEBHOOK_URL:-}"
  if [ -z "${webhook_url}" ] || [ "${webhook_url}" = "YOUR_WEBHOOK_URL_HERE" ]; then
    return 0
  fi
  local color
  case "${status}" in
    success) color=3066993 ;;
    error)   color=15158332 ;;
    *)       color=3447003 ;;
  esac
  curl -s -H "Content-Type: application/json" -d "{
    \"embeds\": [{
      \"title\": \"${title}\",
      \"description\": $(echo "${body}" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo '""'),
      \"color\": ${color},
      \"footer\": {\"text\": \"DailyDev Harness v2\"},
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }" "${webhook_url}" > /dev/null 2>&1 || true
}

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

rollback() {
  log "Rolling back..."
  cd "${PROJECT_DIR}"
  git reset HEAD -- . 2>/dev/null || true
  git checkout -- . 2>/dev/null || true
  local untracked
  untracked="$(git ls-files --others --exclude-standard -- src/ data/ __tests__/ 2>/dev/null || echo "")"
  if [ -n "${untracked}" ]; then
    echo "${untracked}" | while IFS= read -r f; do rm -f "${PROJECT_DIR}/${f}"; done
  fi
}

cleanup() {
  cd "${PROJECT_DIR}"
  if [ -n "$(git status --porcelain -- src/ data/ __tests__/ 2>/dev/null)" ]; then
    log "Uncommitted changes detected. Rolling back."
    rollback
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
  git pull --rebase 2>&1 | tee -a "${LOG_FILE}" || log "Pull failed. Continuing."

  if git diff --name-only HEAD~1 2>/dev/null | grep -q 'package-lock.json'; then
    log "Dependencies changed. Running npm ci..."
    npm ci --silent 2>&1 | tee -a "${LOG_FILE}" || log "npm ci failed (continuing)"
  fi

  # ----------------------------------------
  # Step 0: Generate dynamic context
  # ----------------------------------------
  log "Step 0: Generating dynamic context..."
  npx tsx "${HARNESS_DIR}/scripts/generate-context.ts" 2>&1 | tee -a "${LOG_FILE}" || log "Context generation failed (continuing)"

  local context_content=""
  if [ -f "${HARNESS_DIR}/docs/context.md" ]; then
    context_content="$(cat "${HARNESS_DIR}/docs/context.md")"
  fi

  # ----------------------------------------
  # Step 1: Manager decides (lightweight)
  # ----------------------------------------
  log "Step 1: Manager deciding..."
  local decision
  decision="$(claude -p "Read .harness/docs/status.md and .harness/docs/codemap.md.

## Dynamic Context

${context_content}

Based on current project state AND the dynamic context above, decide which ONE agent to run: content, code, expansion, or feature. Pay attention to the Avoid Directives — do not pick an agent+approach that recently produced no changes or failed. Output ONLY the agent name, nothing else." \
    --dangerously-skip-permissions \
    --max-turns 5 2>&1)"

  # Extract agent name
  local agent
  agent="$(echo "${decision}" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]' | grep -oE '(content|code|expansion|feature)' | head -1)"

  if [ -z "${agent}" ]; then
    log "Manager could not decide. Output: ${decision}"
    notify "error" "❌ Manager failed" "Could not select agent"
    exit 1
  fi
  log "Manager selected: ${agent}"

  # ----------------------------------------
  # Step 2: Run sub-agent directly
  # ----------------------------------------
  log "Step 2: Running ${agent} agent..."
  local agent_prompt
  agent_prompt="$(cat "${HARNESS_DIR}/agents/${agent}.md")

## Dynamic Context

${context_content}

## Agent Rules
1. Read existing files before writing. Never guess — verify first.
2. Changes must not crash for existing users with old localStorage data.
3. If you fail, explain WHY in your SUMMARY.
4. Only modify files within src/, data/questions/, __tests__/.
5. Check the Dynamic Context above — do not duplicate existing features or repeat failed approaches.

Work directory: ${PROJECT_DIR}

End your output with:
SUMMARY: <short title, max 50 chars>
DETAILS:
<what changed, counts, stats>"

  local agent_output
  agent_output="$(claude -p "${agent_prompt}" \
    --allowedTools 'Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git ls-files:*),Bash(cat:*),Bash(ls:*),Bash(find:*),Bash(wc:*),Bash(mkdir:*),Bash(head:*),Bash(tail:*),Read,Write,Edit,Glob,Grep' \
    --dangerously-skip-permissions \
    --max-turns 50 2>&1)" || true

  log "Agent complete."

  # Extract summary
  local summary
  summary="$(echo "${agent_output}" | grep -o 'SUMMARY: .*' | tail -1 | sed 's/^SUMMARY: //')"
  if [ -z "${summary}" ]; then
    summary="auto-update"
  fi
  if [ "${#summary}" -gt 50 ]; then
    summary="$(echo "${summary}" | cut -c1-47)..."
  fi
  log "Summary: ${summary}"

  # ----------------------------------------
  # Step 3: Check changes
  # ----------------------------------------
  log "Step 3: Checking changes..."
  local changed_files
  changed_files="$(git diff --name-only 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)"

  if [ -z "${changed_files}" ]; then
    log "No changes. Skipping."
    exit 0
  fi

  # Boundary check
  local offpath
  offpath="$(echo "${changed_files}" | grep -vE '^(src/|data/|__tests__/)' | grep -v '^$' || true)"
  if [ -n "${offpath}" ]; then
    log "Changes outside allowed paths: ${offpath}"
    rollback
    notify "error" "❌ ${agent} 실패" "Changes outside allowed paths"
    exit 1
  fi

  # Protected file check
  local violations
  violations="$(echo "${changed_files}" | grep -E "${PROTECTED_PATTERN}" || true)"
  if [ -n "${violations}" ]; then
    log "Protected files modified: ${violations}"
    rollback
    notify "error" "❌ ${agent} 실패" "Protected files modified"
    exit 1
  fi

  # ----------------------------------------
  # Step 4: Validate (with fix retry)
  # ----------------------------------------
  log "Step 4: Validating..."
  local validate_output
  local MAX_FIX_ATTEMPTS=2
  local fix_attempt=0
  local validation_passed=false

  validate_output="$(bash "${HARNESS_DIR}/scripts/validate.sh" "${agent}" 2>&1)" && validation_passed=true
  echo "${validate_output}" | tee -a "${LOG_FILE}"

  while [ "${validation_passed}" = false ] && [ "${fix_attempt}" -lt "${MAX_FIX_ATTEMPTS}" ]; do
    fix_attempt=$((fix_attempt + 1))
    log "Validation failed. Fix attempt ${fix_attempt}/${MAX_FIX_ATTEMPTS}..."

    # Send errors to a fix agent
    local fix_output
    fix_output="$(claude -p "You are a build-error fixer. Fix the errors below with MINIMAL changes. Do NOT refactor, add features, or change architecture. Only fix the exact errors shown.

## Errors

\`\`\`
${validate_output}
\`\`\`

Rules:
- Only modify files within src/, data/questions/, __tests__/.
- Make the smallest possible change to fix each error.
- Do NOT add new files unless absolutely necessary.

Work directory: ${PROJECT_DIR}" \
      --allowedTools 'Bash(cat:*),Bash(ls:*),Read,Write,Edit,Glob,Grep' \
      --dangerously-skip-permissions \
      --max-turns 15 2>&1)" || true

    log "Fix agent complete."

    # Re-validate
    validation_passed=false
    validate_output="$(bash "${HARNESS_DIR}/scripts/validate.sh" "${agent}" 2>&1)" && validation_passed=true
    echo "${validate_output}" | tee -a "${LOG_FILE}"
  done

  if [ "${validation_passed}" = false ]; then
    log "Validation still failing after ${MAX_FIX_ATTEMPTS} fix attempts."
    rollback
    notify "error" "❌ ${agent} 실패" "Validation failed after fix attempts: ${summary}"
    exit 1
  fi

  # ----------------------------------------
  # Step 5: Review
  # ----------------------------------------
  log "Step 5: Review..."
  local diff_content
  diff_content="$(git diff 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null | while IFS= read -r f; do echo "=== NEW FILE: ${f} ==="; cat "${f}" 2>/dev/null || true; done)"
  local diff_size
  diff_size="$(echo "${diff_content}" | wc -c | tr -d '[:space:]')"
  if [ "${diff_size}" -gt 50000 ]; then
    diff_content="$(git diff --stat 2>/dev/null)"
  fi

  local review_output
  review_output="$(claude -p "$(cat "${HARNESS_DIR}/agents/review.md")

## Changes to Review

\`\`\`diff
${diff_content}
\`\`\`

Review and output APPROVE or REJECT with reason." \
    --allowedTools 'Bash(cat:*),Bash(ls:*),Bash(find:*),Read,Glob,Grep' \
    --dangerously-skip-permissions \
    --max-turns 10 2>&1)" || true

  if echo "${review_output}" | grep -q 'REJECT'; then
    local reason
    reason="$(echo "${review_output}" | grep -A1 'REJECT' | tail -1)"
    log "Review REJECTED: ${reason}"
    rollback
    notify "warning" "⚠️ ${agent} 거부" "${reason}"
    exit 1
  fi
  log "Review: APPROVED"

  # ----------------------------------------
  # Step 6: Docs + Commit + Push
  # ----------------------------------------
  log "Step 6: Committing..."
  npm run --silent generate-readme 2>/dev/null || true
  npm run --silent update-goals 2>/dev/null || true
  npx tsx .harness/scripts/generate-codemap.ts 2>/dev/null || true
  npx tsx .harness/scripts/generate-changelog.ts 2>/dev/null || true

  git add src/ data/questions/ __tests__/ 2>/dev/null || true
  git add README.md GOALS.md CHANGELOG.md .harness/docs/codemap.md 2>/dev/null || true
  git add -u 2>/dev/null || true

  # Final protection check
  local staged_violations
  staged_violations="$(git diff --cached --name-only 2>/dev/null | grep -E "${PROTECTED_PATTERN}" || true)"
  if [ -n "${staged_violations}" ]; then
    log "Protected files staged: ${staged_violations}"
    rollback
    exit 1
  fi

  git commit -m "feat(${agent}): ${summary}" 2>&1 | tee -a "${LOG_FILE}" || {
    log "Commit failed."
    rollback
    notify "error" "❌ ${agent} 실패" "Commit failed"
    exit 1
  }

  if ! git push 2>&1 | tee -a "${LOG_FILE}"; then
    log "Push failed. Trying rebase..."
    if git pull --rebase 2>&1 | tee -a "${LOG_FILE}"; then
      git push 2>&1 | tee -a "${LOG_FILE}" || { log "Push failed after rebase."; exit 1; }
    else
      git rebase --abort 2>/dev/null || true
      log "Rebase failed."
      exit 1
    fi
  fi

  # ----------------------------------------
  # Step 7: Update status + notify
  # ----------------------------------------
  log "Step 7: Updating status..."
  claude -p "Read .harness/docs/status.md. Update it: last run was ${agent}, result success, summary '${summary}'. Add to recent runs table. Update project health if needed. Write the updated file. ALL text in status.md must be in English." \
    --dangerously-skip-permissions \
    --max-turns 5 2>&1 | tee -a "${LOG_FILE}" || true

  # Include status.md in the same commit (amend)
  git add -f .harness/docs/status.md 2>/dev/null && git commit --amend --no-edit 2>/dev/null || true
  git push --force-with-lease 2>&1 | tee -a "${LOG_FILE}" || git push 2>&1 | tee -a "${LOG_FILE}" || true

  notify "success" "✅ ${agent} 성공" "${summary}"
  log "=== Run complete: ${agent} — ${summary} ==="
}

main "$@"

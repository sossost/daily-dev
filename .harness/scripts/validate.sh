#!/usr/bin/env bash
set -euo pipefail

########################################
# Validate — 5-step guardrail pipeline
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"

AGENT_TYPE="${1:-unknown}"

cd "${PROJECT_DIR}"

echo "=== Validation Pipeline (agent: ${AGENT_TYPE}) ==="

########################################
# Step 1: TypeScript Type Check
########################################
echo "[1/5] Type checking..."
if ! npx tsc --noEmit 2>&1; then
  echo "FAIL: TypeScript type check failed." >&2
  exit 1
fi
echo "PASS: Type check"

########################################
# Step 2: Jest Tests
########################################
echo "[2/5] Running tests..."
case "${AGENT_TYPE}" in
  code|feature)
    if ! npx jest --ci --coverage --coverageThreshold='{"global":{"lines":80,"functions":80,"statements":80,"branches":70}}' 2>&1; then
      echo "FAIL: Tests failed or coverage below threshold." >&2
      exit 1
    fi
    ;;
  *)
    if ! npx jest --ci 2>&1; then
      echo "FAIL: Tests failed." >&2
      exit 1
    fi
    ;;
esac
echo "PASS: Tests"

########################################
# Step 3: Next.js Build (skip for content agent)
########################################
if [ "${AGENT_TYPE}" != "content" ]; then
  echo "[3/5] Building Next.js..."
  if ! npx next build 2>&1; then
    echo "FAIL: Next.js build failed." >&2
    exit 1
  fi
  echo "PASS: Build"
else
  echo "[3/5] Build skipped (content agent)"
fi

########################################
# Step 4: Question JSON Validation (content/expansion only)
########################################
if [ "${AGENT_TYPE}" = "content" ] || [ "${AGENT_TYPE}" = "expansion" ]; then
  echo "[4/5] Validating questions..."
  if ! npx tsx "${HARNESS_DIR}/scripts/validate-questions.ts" 2>&1; then
    echo "FAIL: Question validation failed." >&2
    exit 1
  fi
  echo "PASS: Questions"
else
  echo "[4/5] Question validation skipped (${AGENT_TYPE} agent)"
fi

########################################
# Step 5: File Count Check
########################################
echo "[5/5] Checking file count..."
changed_count=0

diff_count="$(git diff --name-only 2>/dev/null | wc -l | tr -d '[:space:]')"
untracked_count="$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d '[:space:]')"

changed_count=$((diff_count + untracked_count))

if [ "${changed_count}" -gt 20 ]; then
  echo "FAIL: Too many files changed (${changed_count} > 20)." >&2
  exit 1
fi
echo "PASS: File count (${changed_count} files)"

echo "=== All validations passed ==="
exit 0

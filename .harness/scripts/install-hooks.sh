#!/usr/bin/env bash
set -euo pipefail

########################################
# Install Git Hooks
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOOKS_DIR="${PROJECT_DIR}/.git/hooks"

mkdir -p "${HOOKS_DIR}"

# Protected pattern — MUST match run-agent.sh PROTECTED_PATTERN exactly
PROTECTED_PATTERN='\.harness/(agents|scripts|launchd)/|CLAUDE\.md|jest\.config\.ts|next\.config\.ts|tsconfig\.json|package\.json|^package-lock\.json$'

cat > "${HOOKS_DIR}/pre-commit" << 'HOOKEOF'
#!/usr/bin/env bash
set -euo pipefail

PROTECTED_PATTERN='\.harness/(agents|scripts|launchd)/|CLAUDE\.md|jest\.config\.ts|next\.config\.ts|tsconfig\.json|package\.json|^package-lock\.json$'

staged_files="$(git diff --cached --name-only 2>/dev/null || echo "")"

violations="$(echo "${staged_files}" | grep -E "${PROTECTED_PATTERN}" || echo "")"

if [ -n "${violations}" ]; then
  echo "ERROR: Attempting to commit protected files:"
  echo "${violations}" | while IFS= read -r f; do
    echo "  - ${f}"
  done
  echo ""
  echo "Protected files cannot be modified by agents."
  echo "To override, use: git commit --no-verify"
  exit 1
fi

exit 0
HOOKEOF

chmod +x "${HOOKS_DIR}/pre-commit"
echo "Git pre-commit hook installed at ${HOOKS_DIR}/pre-commit"

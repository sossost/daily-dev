#!/usr/bin/env bash
set -euo pipefail

########################################
# Install LaunchAgent for Periodic Execution
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"
TEMPLATE="${HARNESS_DIR}/launchd/com.dailydev.runner.plist.template"
PLIST_NAME="com.dailydev.runner"
PLIST_DIR="${HOME}/Library/LaunchAgents"
PLIST_PATH="${PLIST_DIR}/${PLIST_NAME}.plist"

# Install git hooks first
echo "Installing git hooks..."
bash "${HARNESS_DIR}/scripts/install-hooks.sh"

# Detect Node.js PATH
NODE_BIN="$(which node 2>/dev/null || echo "")"
if [ -z "${NODE_BIN}" ]; then
  echo "ERROR: Node.js not found in PATH." >&2
  exit 1
fi
NODE_DIR="$(dirname "${NODE_BIN}")"

# Detect Claude PATH
CLAUDE_BIN="$(which claude 2>/dev/null || echo "")"
if [ -z "${CLAUDE_BIN}" ]; then
  echo "ERROR: Claude CLI not found in PATH." >&2
  exit 1
fi
CLAUDE_DIR="$(dirname "${CLAUDE_BIN}")"

# Build PATH string
DYNAMIC_PATH="${NODE_DIR}:${CLAUDE_DIR}:/usr/local/bin:/usr/bin:/bin"

# Ensure template exists
if [ ! -f "${TEMPLATE}" ]; then
  echo "ERROR: Plist template not found at ${TEMPLATE}" >&2
  exit 1
fi

# Ensure LaunchAgents directory exists
mkdir -p "${PLIST_DIR}"

# Unload if already loaded
launchctl bootout "gui/$(id -u)/${PLIST_NAME}" 2>/dev/null || true

# Generate plist from template
sed \
  -e "s|__PROJECT_DIR__|${PROJECT_DIR}|g" \
  -e "s|__HOME_DIR__|${HOME}|g" \
  -e "s|__PATH__|${DYNAMIC_PATH}|g" \
  "${TEMPLATE}" > "${PLIST_PATH}"

echo "Plist written to ${PLIST_PATH}"

# Bootstrap the agent
launchctl bootstrap "gui/$(id -u)" "${PLIST_PATH}"

echo "LaunchAgent installed and started: ${PLIST_NAME}"
echo "  Schedule: twice daily at 10:00 and 22:00"
echo "  Logs: ${HARNESS_DIR}/logs/"

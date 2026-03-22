#!/usr/bin/env bash
set -euo pipefail

########################################
# Uninstall LaunchAgent
########################################

PLIST_NAME="com.dailydev.runner"
PLIST_PATH="${HOME}/Library/LaunchAgents/${PLIST_NAME}.plist"

# Bootout the agent
launchctl bootout "gui/$(id -u)/${PLIST_NAME}" 2>/dev/null || {
  echo "LaunchAgent was not loaded."
}

# Remove the plist file
if [ -f "${PLIST_PATH}" ]; then
  rm -f "${PLIST_PATH}"
  echo "Removed ${PLIST_PATH}"
else
  echo "Plist file not found at ${PLIST_PATH}"
fi

echo "LaunchAgent uninstalled: ${PLIST_NAME}"

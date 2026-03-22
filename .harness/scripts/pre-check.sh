#!/usr/bin/env bash
set -euo pipefail

########################################
# Pre-Check — Decides if an agent run should proceed
########################################

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HARNESS_DIR="${PROJECT_DIR}/.harness"
STATE_DIR="${HARNESS_DIR}/state"
HISTORY_DIR="${STATE_DIR}/history"
RUN_COUNT_DIR="${STATE_DIR}/run-counts"

TODAY="$(date +%Y-%m-%d)"
DAILY_CAP=6

AGENT_TYPE="${1:-}"

if [ -z "${AGENT_TYPE}" ]; then
  echo "ERROR: No agent type provided." >&2
  exit 1
fi

########################################
# Daily Run Cap
########################################
count_file="${RUN_COUNT_DIR}/${AGENT_TYPE}-${TODAY}.count"
current_count=0
if [ -f "${count_file}" ]; then
  raw="$(tr -d '[:space:]' < "${count_file}" || echo "0")"
  if [[ "${raw}" =~ ^[0-9]+$ ]]; then
    current_count="${raw}"
  fi
fi

if [ "${current_count}" -ge "${DAILY_CAP}" ]; then
  echo "Daily cap reached for ${AGENT_TYPE}: ${current_count}/${DAILY_CAP}" >&2
  exit 1
fi

########################################
# Cooldown on Consecutive Failure
# If the last 2 runs for this agent both failed (rejected/error),
# skip the run to avoid wasting resources on a recurring problem.
# The cooldown resets automatically once a non-failing run occurs.
########################################
history_file="${HISTORY_DIR}/history-${AGENT_TYPE}.log"
if [ -f "${history_file}" ]; then
  last_two="$(tail -n 2 "${history_file}" 2>/dev/null || echo "")"
  fail_count=0
  while IFS= read -r line; do
    if echo "${line}" | grep -qE '\] (rejected|error):'; then
      fail_count=$((fail_count + 1))
    fi
  done <<< "${last_two}"

  if [ "${fail_count}" -ge 2 ]; then
    echo "Cooldown: ${AGENT_TYPE} failed consecutively. Skipping." >&2
    exit 1
  fi
fi

########################################
# Per-Agent Checks
########################################
case "${AGENT_TYPE}" in
  content)
    questions_dir="${PROJECT_DIR}/data/questions"

    # If questions directory doesn't exist or is empty, allow run (initial creation)
    if [ ! -d "${questions_dir}" ] || [ -z "$(ls -A "${questions_dir}" 2>/dev/null)" ]; then
      echo "Questions directory missing or empty. Allowing initial content run."
      exit 0
    fi

    # Check if all topics have 20+ questions
    all_complete=true
    for qfile in "${questions_dir}"/*.json; do
      [ -f "${qfile}" ] || continue
      count=0
      if command -v jq &>/dev/null; then
        count="$(jq 'length' "${qfile}" 2>/dev/null || echo "0")"
      else
        # Fallback: count "id" occurrences
        count="$(grep -c '"id"' "${qfile}" 2>/dev/null || echo "0")"
      fi
      count="$(echo "${count}" | tr -d '[:space:]')"
      if ! [[ "${count}" =~ ^[0-9]+$ ]]; then
        count=0
      fi
      if [ "${count}" -lt 20 ]; then
        all_complete=false
        break
      fi
    done

    if [ "${all_complete}" = true ]; then
      echo "All topics have 20+ questions. Content agent not needed." >&2
      exit 1
    fi
    ;;

  code|expansion|feature)
    # Always pass — these agents self-assess what needs doing
    ;;

  *)
    echo "ERROR: Unknown agent type: ${AGENT_TYPE}" >&2
    exit 1
    ;;
esac

echo "Pre-check passed for ${AGENT_TYPE}."
exit 0

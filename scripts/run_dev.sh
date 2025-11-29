#!/usr/bin/env bash
# launcher for the Medication Tracker
set -euo pipefail

CLEAN=false
POPULATE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN=true
      shift
      ;;
    --populate)
      POPULATE=true
      shift
      ;;
    *)
      echo "Usage: $0 [--clean] [--sample]"
      exit 1
      ;;
  esac
done

BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
BACKEND_CMD="python3 backend.py"
FRONTEND_CMD="npm start"
BACKEND_PORT=5000
FRONTEND_PORT=3000

if [ "$CLEAN" = true ]; then
  echo " Removing existing backend database"
  rm -f "${BACKEND_DIR}/medications.db"
fi

if [ "$POPULATE" = true ]; then
  echo " Populating backend database with sample data"
  python3 "${BACKEND_DIR}/populate_db.py"
fi

# Start backend
(
  cd ".${BACKEND_DIR}" || exit 1
  ${BACKEND_CMD}
) &
BACKEND_PID=$!

# Start frontend
(
  cd ".${FRONTEND_DIR}" || exit 1
  ${FRONTEND_CMD}
) &
FRONTEND_PID=$!

echo " Dev environment is running"
echo " Backend : http://meds.local:${BACKEND_PORT}"
echo " Frontend: http://meds.local:${FRONTEND_PORT}"
wait

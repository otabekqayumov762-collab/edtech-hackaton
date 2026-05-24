#!/usr/bin/env sh
# -----------------------------------------------------------------------------
# Production entrypoint for the Django backend container.
#
# Responsibilities:
#   1. Wait until Postgres is reachable (pg_isready loop)
#   2. Apply database migrations (idempotent)
#   3. Collect static files into STATIC_ROOT (served by WhiteNoise)
#   4. Launch gunicorn bound to 0.0.0.0:8000
#
# NOTE: The Write tool used to create this file cannot set the executable bit.
# The Dockerfile runs `chmod +x /app/entrypoint.sh` so the file is executable
# inside the image. If you run this script directly on a host, first run:
#     chmod +x backend/entrypoint.sh
# -----------------------------------------------------------------------------

set -eu

# ---- Config (overridable from env) ------------------------------------------
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mfuser}"
GUNICORN_WORKERS="${GUNICORN_WORKERS:-3}"
GUNICORN_TIMEOUT="${GUNICORN_TIMEOUT:-60}"
GUNICORN_BIND="${GUNICORN_BIND:-0.0.0.0:8000}"

# ---- 1. Wait for Postgres ---------------------------------------------------
echo "[entrypoint] Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
ATTEMPTS=0
MAX_ATTEMPTS=60
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "${ATTEMPTS}" -ge "${MAX_ATTEMPTS}" ]; then
        echo "[entrypoint] Postgres did not become ready after ${MAX_ATTEMPTS} attempts; aborting." >&2
        exit 1
    fi
    sleep 1
done
echo "[entrypoint] Postgres is ready."

# ---- 2. Apply migrations ----------------------------------------------------
echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

# ---- 3. Collect static files ------------------------------------------------
echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

# ---- 4. Start gunicorn ------------------------------------------------------
echo "[entrypoint] Starting gunicorn on ${GUNICORN_BIND} (workers=${GUNICORN_WORKERS}, timeout=${GUNICORN_TIMEOUT})"
exec gunicorn config.wsgi:application \
    --bind "${GUNICORN_BIND}" \
    --workers "${GUNICORN_WORKERS}" \
    --timeout "${GUNICORN_TIMEOUT}" \
    --access-logfile - \
    --error-logfile -

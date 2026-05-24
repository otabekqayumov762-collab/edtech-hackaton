# syntax=docker/dockerfile:1.6
#
# Production Dockerfile for the MF platform Django backend.
# - Base: python:3.12-slim (small, current security updates)
# - Builds against libpq so psycopg2-binary works on slim Debian
# - Runs as non-root user "app"
# - Entrypoint script handles DB wait, migrate, collectstatic, gunicorn
#
# Build:   docker build -t mf-backend ./backend
# Run:     docker run --env-file backend/.env -p 8000:8000 mf-backend

FROM python:3.12-slim AS base

# Python / pip hygiene
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings

# System dependencies:
#   build-essential, libpq-dev - needed for compiling/linking psycopg2 and Pillow
#   postgresql-client          - provides pg_isready for the entrypoint wait loop
#   curl                       - useful for healthchecks / debugging
# We keep build-essential in the final image to keep the Dockerfile single-stage
# and small in complexity; switch to a multi-stage build if image size matters.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        postgresql-client \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and app directory
RUN groupadd --system app && useradd --system --gid app --home /app app
WORKDIR /app

# Install Python deps first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy application code
COPY . /app

# Make entrypoint executable (chmod here because Write tool can't set +x)
RUN chmod +x /app/entrypoint.sh \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R app:app /app

# Drop privileges
USER app

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

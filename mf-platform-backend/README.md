# MF Platform — Backend

Django 5 + Django REST Framework service for the MF platform.

## Production deploy with Docker

The backend ships with a production-ready `Dockerfile`, `entrypoint.sh` and an
extended `docker-compose.yml` that boots Postgres alongside the web service.

### 1. Prepare environment

```bash
cp .env.example .env
# edit .env: set SECRET_KEY, ALLOWED_HOSTS, DB_* and CORS_ALLOWED_ORIGINS
# IMPORTANT for compose: keep DB_HOST=db (overridden in docker-compose.yml)
```

Make sure the entrypoint script is executable on disk (Git can lose the bit):

```bash
chmod +x entrypoint.sh
```

### 2. Build the image

```bash
# from repo root
docker build -t mf-backend ./backend

# or via compose (also builds the db image)
docker compose -f backend/docker-compose.yml build
```

### 3. Run the full stack (Postgres + web)

```bash
docker compose -f backend/docker-compose.yml up -d

# tail logs
docker compose -f backend/docker-compose.yml logs -f web
```

The entrypoint will:

1. Wait for Postgres (`pg_isready` loop, up to ~60s).
2. Run `python manage.py migrate --noinput`.
3. Run `python manage.py collectstatic --noinput`.
4. Start `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60`.

The API will be available at <http://localhost:8000/>.

### 4. Standalone container (external Postgres)

```bash
docker run --rm -p 8000:8000 \
    --env-file backend/.env \
    -e DB_HOST=host.docker.internal \
    mf-backend
```

### 5. One-off management commands

```bash
docker compose -f backend/docker-compose.yml exec web python manage.py createsuperuser
docker compose -f backend/docker-compose.yml exec web python manage.py shell
```

### 6. Stop / clean up

```bash
docker compose -f backend/docker-compose.yml down            # stop containers
docker compose -f backend/docker-compose.yml down -v         # also drop volumes (DB data!)
```

### Security notes

- The container runs as the non-root `app` user.
- No secrets are baked into the image; everything comes from `.env` at runtime.
- `.dockerignore` keeps `.env`, `.git`, `__pycache__`, `staticfiles`, `media`
  and editor folders out of the build context.
- For real production, remove the `./:/app` bind mount in `docker-compose.yml`
  so the image is immutable, and front the service with HTTPS (nginx/Caddy).

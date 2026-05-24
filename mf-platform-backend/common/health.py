"""Health-check view.

Wire up manually in ``config/urls.py``::

    from common.health import health_check
    urlpatterns += [path("healthz/", health_check)]
"""
from __future__ import annotations

from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

VERSION = "1.0.0"


def _db_status() -> str:
    """Return ``'ok'`` if the default DB responds to ``SELECT 1``, else ``'down'``."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return "ok"
    except Exception:
        return "down"


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request: Request) -> Response:
    """Lightweight liveness/readiness probe.

    Returns ``{status, version, db}``. Always HTTP 200 — orchestrators
    can inspect the ``db`` field for readiness logic.
    """
    return Response(
        {
            "status": "ok",
            "version": VERSION,
            "db": _db_status(),
        }
    )


__all__ = ["health_check", "VERSION"]

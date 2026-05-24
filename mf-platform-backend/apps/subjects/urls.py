"""URL routes for the ``subjects`` app.

Registered at the root of this include (``/api/v1/subjects/``) so the
router yields the final URLs ``GET /api/v1/subjects/`` and
``GET /api/v1/subjects/<id>/``.
"""
from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import SubjectViewSet

router = DefaultRouter()
router.register(r'', SubjectViewSet, basename='subject')

urlpatterns = router.urls

"""URL routes for the ``flashcards`` app.

Mounted under ``/api/v1/flashcards/`` from :mod:`config.urls`. The
default router exposes ``GET /`` and ``GET /<id>/`` and the explicit
``finish/`` path receives the session submit payload.
"""
from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import FlashSessionFinishView, FlashTopicViewSet

router = DefaultRouter()
router.register(r'', FlashTopicViewSet, basename='flash-topic')

urlpatterns = [
    path('finish/', FlashSessionFinishView.as_view(), name='flash-session-finish'),
] + router.urls

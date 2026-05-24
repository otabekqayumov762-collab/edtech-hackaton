"""URL routes for the ``ai_assistant`` app.

Mounted under ``/api/v1/ai/`` so the final URLs are::

    GET    /api/v1/ai/sessions/         — list current user's sessions
    POST   /api/v1/ai/sessions/         — create a new session
    GET    /api/v1/ai/sessions/<id>/    — retrieve a session with history
    POST   /api/v1/ai/ask/              — post a message, get an AI reply
"""
from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AskView, ChatSessionViewSet

router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='ai-session')

urlpatterns = [
    path('ask/', AskView.as_view(), name='ai-ask'),
]

urlpatterns += router.urls

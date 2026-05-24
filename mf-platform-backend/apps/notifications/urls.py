"""URL routes for the ``notifications`` app.

Mounted under ``/api/v1/`` directly so URLs are::

    POST /api/v1/notifications/send
    GET  /api/v1/notifications/user
    POST /api/v1/notifications/<pk>/read
    GET/PUT /api/v1/notifications/prefs
"""
from __future__ import annotations

from django.urls import path

from .views import (
    MarkReadView,
    PrefsView,
    SendNotificationView,
    UserNotificationsView,
)


urlpatterns = [
    path('notifications/send', SendNotificationView.as_view(), name='notif-send'),
    path('notifications/user', UserNotificationsView.as_view(), name='notif-user'),
    path('notifications/<int:pk>/read', MarkReadView.as_view(), name='notif-read'),
    path('notifications/prefs', PrefsView.as_view(), name='notif-prefs'),
]

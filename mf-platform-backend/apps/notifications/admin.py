"""Django admin registration for the ``notifications`` app.

Unfold ModelAdmin'ga ko'chirilgan — paket o'rnatilmagan vaqtdagi fallback
toza django.contrib.admin.ModelAdmin'ga tushadi.
"""
from __future__ import annotations

from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    ModelAdmin = admin.ModelAdmin  # type: ignore[assignment,misc]

from .models import Notification, NotificationTemplate, UserNotificationPrefs


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    """Notification admin — yuborilgan xabarlar tarixi."""

    list_display = ('id', 'user', 'type', 'title', 'source', 'read_at', 'created_at')
    list_filter = ('type', 'source', 'created_at', 'read_at')
    search_fields = ('title', 'body', 'user__email', 'user__name')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(ModelAdmin):
    """Notification shabloni — slug + matn."""

    list_display = ('slug', 'type', 'title', 'active', 'updated_at')
    list_filter = ('type', 'active')
    search_fields = ('slug', 'title', 'body')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('type', 'slug')


@admin.register(UserNotificationPrefs)
class UserNotificationPrefsAdmin(ModelAdmin):
    """Foydalanuvchi notification afzalliklari."""

    list_display = (
        'user',
        'push_enabled',
        'morning_enabled',
        'day_enabled',
        'evening_enabled',
        'quiet_start',
        'quiet_end',
        'last_comeback_sent',
    )
    list_filter = ('push_enabled', 'morning_enabled', 'day_enabled', 'evening_enabled')
    search_fields = ('user__email', 'user__name')
    raw_id_fields = ('user',)

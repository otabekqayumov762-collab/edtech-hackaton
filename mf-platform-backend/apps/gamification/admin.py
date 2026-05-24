"""Django admin registration for the ``gamification`` app."""
from __future__ import annotations

from django.contrib import admin

from .models import Achievement, UserAchievement, XpLog


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`Achievement`."""

    list_display = ('id', 'title', 'metric', 'requirement', 'order', 'color')
    list_editable = ('order',)
    list_filter = ('metric',)
    search_fields = ('id', 'title', 'description')
    ordering = ('order', 'id')


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`UserAchievement`."""

    list_display = ('id', 'user', 'achievement', 'unlocked_at')
    list_filter = ('achievement',)
    search_fields = ('user__email', 'user__name', 'achievement__id')
    autocomplete_fields = ('user', 'achievement')
    ordering = ('-unlocked_at',)


@admin.register(XpLog)
class XpLogAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`XpLog`."""

    list_display = ('id', 'user', 'amount', 'reason', 'created_at')
    list_filter = ('reason',)
    search_fields = ('user__email', 'user__name', 'reason')
    autocomplete_fields = ('user',)
    ordering = ('-created_at',)

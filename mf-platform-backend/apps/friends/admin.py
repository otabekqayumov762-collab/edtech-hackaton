"""Django admin registration for the ``friends`` app.

Unfold ModelAdmin'ga ko'chirilgan.
"""
from __future__ import annotations

from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    ModelAdmin = admin.ModelAdmin  # type: ignore[assignment,misc]

from .models import Challenge, Friendship, WinStreak


@admin.register(Friendship)
class FriendshipAdmin(ModelAdmin):
    """Do'stlik munosabati."""

    list_display = ('id', 'from_user', 'to_user', 'status', 'created_at', 'accepted_at')
    list_filter = ('status', 'created_at')
    search_fields = (
        'from_user__email',
        'from_user__name',
        'to_user__email',
        'to_user__name',
    )
    raw_id_fields = ('from_user', 'to_user')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(Challenge)
class ChallengeAdmin(ModelAdmin):
    """Do'stlar orasidagi challenge (duel-light)."""

    list_display = (
        'id',
        'challenger',
        'opponent',
        'subject',
        'grade',
        'status',
        'winner',
        'created_at',
        'completed_at',
    )
    list_filter = ('status', 'subject', 'grade', 'created_at')
    search_fields = (
        'challenger__email',
        'challenger__name',
        'opponent__email',
        'opponent__name',
        'subject',
    )
    raw_id_fields = ('challenger', 'opponent', 'winner')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(WinStreak)
class WinStreakAdmin(ModelAdmin):
    """G'alaba seriyasi (challenge bo'yicha)."""

    list_display = ('id', 'user', 'current', 'best', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('user__email', 'user__name')
    raw_id_fields = ('user',)
    ordering = ('-best', '-current')

"""Django admin registration for the ``duels`` app.

Unfold ModelAdmin'ga ko'chirilgan.
"""
from __future__ import annotations

from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    ModelAdmin = admin.ModelAdmin  # type: ignore[assignment,misc]

from .models import Duel, DuelAnswer, DuelMatch, DuelMatchAnswer, DuelRating


@admin.register(Duel)
class DuelAdmin(ModelAdmin):
    """Admin configuration for :class:`Duel`."""

    list_display = (
        'id',
        'challenger',
        'opponent',
        'subject',
        'state',
        'challenger_score',
        'opponent_score',
        'winner',
        'question_count',
        'created_at',
        'finished_at',
    )
    list_filter = ('state', 'subject')
    search_fields = (
        'id',
        'challenger__email',
        'challenger__name',
        'opponent__email',
        'opponent__name',
    )
    raw_id_fields = ('challenger', 'opponent', 'winner')
    readonly_fields = ('id', 'created_at', 'finished_at')
    ordering = ('-created_at',)


@admin.register(DuelAnswer)
class DuelAnswerAdmin(ModelAdmin):
    """Admin configuration for :class:`DuelAnswer`."""

    list_display = ('id', 'duel', 'user', 'question_index', 'is_correct', 'answered_at')
    list_filter = ('is_correct',)
    search_fields = ('duel__id', 'user__email', 'user__name')
    raw_id_fields = ('duel', 'user')
    readonly_fields = ('answered_at',)
    ordering = ('-answered_at',)


@admin.register(DuelMatch)
class DuelMatchAdmin(ModelAdmin):
    """Admin configuration for :class:`DuelMatch` (arena)."""

    list_display = (
        'id',
        'challenger',
        'opponent',
        'subject',
        'grade',
        'status',
        'challenger_score',
        'opponent_score',
        'winner',
        'created_at',
        'completed_at',
    )
    list_filter = ('status', 'subject', 'grade')
    search_fields = (
        'id',
        'challenger__email',
        'challenger__name',
        'opponent__email',
        'opponent__name',
    )
    raw_id_fields = ('challenger', 'opponent', 'winner')
    readonly_fields = ('created_at', 'completed_at')
    ordering = ('-created_at',)


@admin.register(DuelMatchAnswer)
class DuelMatchAnswerAdmin(ModelAdmin):
    """Admin configuration for :class:`DuelMatchAnswer`."""

    list_display = (
        'id',
        'duel',
        'user',
        'question_idx',
        'question_type',
        'is_correct',
        'time_ms',
    )
    list_filter = ('is_correct', 'question_type')
    search_fields = ('duel__id', 'user__email', 'user__name', 'question_text')
    raw_id_fields = ('duel', 'user')
    ordering = ('-duel_id', 'user_id', 'question_idx')


@admin.register(DuelRating)
class DuelRatingAdmin(ModelAdmin):
    """Admin configuration for :class:`DuelRating` (ELO)."""

    list_display = (
        'user',
        'rating',
        'wins',
        'losses',
        'draws',
        'streak',
        'best_streak',
        'updated_at',
    )
    search_fields = ('user__email', 'user__name')
    raw_id_fields = ('user',)
    readonly_fields = ('updated_at',)
    ordering = ('-rating',)

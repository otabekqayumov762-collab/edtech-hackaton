"""Tournaments app uchun Django admin sozlamalari."""
from __future__ import annotations

from django.contrib import admin

from .models import Participation, Tournament, TournamentPrize


class TournamentPrizeInline(admin.TabularInline):
    """Turnir sahifasida ``TournamentPrize`` yozuvlarini inline tahrirlash."""

    model = TournamentPrize
    extra = 1
    ordering = ('rank',)


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    """``Tournament`` modeli uchun admin."""

    list_display = (
        'id',
        'title',
        'starts_at',
        'ends_at',
        'prize',
        'is_active',
    )
    list_filter = ('is_active',)
    search_fields = ('id', 'title')
    ordering = ('-starts_at',)
    inlines = (TournamentPrizeInline,)


@admin.register(TournamentPrize)
class TournamentPrizeAdmin(admin.ModelAdmin):
    """``TournamentPrize`` modeli uchun admin (alohida ko'rinish)."""

    list_display = ('tournament', 'rank', 'reward', 'xp')
    list_filter = ('tournament',)
    search_fields = ('tournament__id', 'tournament__title', 'reward')
    ordering = ('tournament', 'rank')


@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    """``Participation`` modeli uchun admin."""

    list_display = ('tournament', 'user', 'tournament_xp', 'joined_at')
    list_filter = ('tournament',)
    search_fields = (
        'tournament__id',
        'tournament__title',
        'user__email',
        'user__name',
    )
    ordering = ('-tournament_xp', 'joined_at')
    raw_id_fields = ('user',)

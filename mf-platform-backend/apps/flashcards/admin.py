"""Django admin registration for the ``flashcards`` app.

Unfold ModelAdmin'ga ko'chirilgan; TabularInline esa unfold.admin'dan.
"""
from __future__ import annotations

from django.contrib import admin

try:
    from unfold.admin import ModelAdmin, TabularInline
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    ModelAdmin = admin.ModelAdmin  # type: ignore[assignment,misc]
    TabularInline = admin.TabularInline  # type: ignore[assignment,misc]

from .models import FlashCard, FlashSession, FlashTopic


class FlashCardInline(TabularInline):
    """Edit cards directly from the parent :class:`FlashTopic` page."""

    model = FlashCard
    extra = 1
    fields = ('order', 'front', 'back', 'hint')
    ordering = ('order',)


@admin.register(FlashTopic)
class FlashTopicAdmin(ModelAdmin):
    """Admin configuration for :class:`FlashTopic`."""

    list_display = ('id', 'title', 'subject', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active', 'subject')
    search_fields = ('id', 'title', 'desc')
    ordering = ('order', 'title')
    inlines = (FlashCardInline,)


@admin.register(FlashCard)
class FlashCardAdmin(ModelAdmin):
    """Admin configuration for :class:`FlashCard`."""

    list_display = ('id', 'topic', 'order', 'front')
    list_filter = ('topic',)
    search_fields = ('front', 'back', 'hint')
    ordering = ('topic', 'order')


@admin.register(FlashSession)
class FlashSessionAdmin(ModelAdmin):
    """Admin configuration for :class:`FlashSession`."""

    list_display = (
        'id',
        'user',
        'topic',
        'known_count',
        'unknown_count',
        'xp_earned',
        'started_at',
        'finished_at',
    )
    list_filter = ('topic',)
    search_fields = ('user__email', 'topic__id', 'topic__title')
    ordering = ('-started_at',)
    readonly_fields = ('started_at',)

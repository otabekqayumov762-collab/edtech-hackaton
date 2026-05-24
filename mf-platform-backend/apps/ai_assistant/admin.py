"""Django admin registration for the ``ai_assistant`` app."""
from __future__ import annotations

from django.contrib import admin

from .models import ChatMessage, ChatSession


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`ChatSession`."""

    list_display = ('id', 'user', 'started_at')
    list_filter = ('started_at',)
    search_fields = ('id', 'user__email', 'user__name')
    raw_id_fields = ('user',)
    readonly_fields = ('id', 'started_at')
    ordering = ('-started_at',)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`ChatMessage`."""

    list_display = ('id', 'session', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('session__id', 'text')
    raw_id_fields = ('session',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

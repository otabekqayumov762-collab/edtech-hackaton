"""Django admin registration for the ``subjects`` app."""
from __future__ import annotations

from django.contrib import admin

from .models import Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    """Admin configuration for :class:`Subject`."""

    list_display = ('id', 'name', 'short', 'icon', 'color', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('id', 'name', 'short')
    ordering = ('order', 'name')

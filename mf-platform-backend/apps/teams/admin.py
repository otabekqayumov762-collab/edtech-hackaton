"""Teams app admin ro'yxati."""
from django.contrib import admin

from .models import Team, TeamMembership


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    """Team admin sozlamalari."""

    list_display = ('name', 'captain', 'color', 'max_members', 'is_open', 'created_at')
    list_filter = ('is_open', 'created_at')
    search_fields = ('name', 'description', 'captain__email', 'captain__name')
    autocomplete_fields = ('captain',)
    readonly_fields = ('id', 'created_at')


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    """TeamMembership admin sozlamalari."""

    list_display = ('team', 'user', 'weekly_xp', 'joined_at')
    list_filter = ('team', 'joined_at')
    search_fields = ('team__name', 'user__email', 'user__name')
    autocomplete_fields = ('team', 'user')

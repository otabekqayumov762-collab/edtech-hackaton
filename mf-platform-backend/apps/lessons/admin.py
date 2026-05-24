"""Lessons app admin ro'yxati."""
from django.contrib import admin

from .models import Lesson, LessonCompletion


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Lesson admin sozlamalari."""

    list_display = ('id', 'title', 'subject', 'level', 'duration_min', 'xp', 'order', 'is_active')
    list_filter = ('subject', 'level', 'is_active')
    search_fields = ('id', 'title', 'summary')
    ordering = ('subject_id', 'order', 'id')


@admin.register(LessonCompletion)
class LessonCompletionAdmin(admin.ModelAdmin):
    """LessonCompletion admin sozlamalari."""

    list_display = ('user', 'lesson', 'completed_at')
    list_filter = ('lesson__subject', 'completed_at')
    search_fields = ('user__email', 'lesson__id', 'lesson__title')
    autocomplete_fields = ('user', 'lesson')

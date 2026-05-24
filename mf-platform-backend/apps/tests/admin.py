"""Tests app uchun Django admin sozlamalari."""
from __future__ import annotations

from django.contrib import admin

from .models import Option, Question, Test, TestAttempt


class OptionInline(admin.TabularInline):
    """Savol ichidagi variantlar uchun inline forma."""

    model = Option
    extra = 4
    fields = ('order', 'text')
    ordering = ('order', 'id')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """Savollarni boshqarish — variantlar inline."""

    list_display = ('id', 'test', 'order', 'correct_index')
    list_filter = ('test',)
    search_fields = ('text',)
    ordering = ('test', 'order', 'id')
    inlines = [OptionInline]


class QuestionInline(admin.TabularInline):
    """Test ichidagi savollar uchun inline (faqat ko'rinish)."""

    model = Question
    extra = 0
    fields = ('order', 'text', 'correct_index')
    show_change_link = True
    ordering = ('order', 'id')


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    """Testlarni boshqarish, savollar inline shaklida."""

    list_display = (
        'id',
        'title',
        'subject',
        'difficulty',
        'duration_min',
        'xp',
        'is_active',
    )
    list_filter = ('subject', 'difficulty', 'is_active')
    search_fields = ('id', 'title')
    ordering = ('subject_id', 'order', 'id')
    inlines = [QuestionInline]


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    """Variantlarni alohida ham ko'rish/tahrirlash uchun."""

    list_display = ('id', 'question', 'order', 'text')
    list_filter = ('question__test',)
    search_fields = ('text',)
    ordering = ('question', 'order', 'id')


@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    """Test urinishlari (natija + XP) tarixini ko'rish."""

    list_display = (
        'id',
        'user',
        'test',
        'correct',
        'total',
        'xp_earned',
        'is_complete',
        'started_at',
    )
    list_filter = ('is_complete', 'test')
    search_fields = ('user__email', 'test__id')
    ordering = ('-started_at',)
    readonly_fields = ('started_at', 'finished_at')

"""Lesson va LessonCompletion modellari.

Lesson — fanga (Subject, slug PK) tegishli ta'lim birligi.
LessonCompletion — foydalanuvchining tugatgan darslarini va olingan XP holatini kuzatadi.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Lesson(models.Model):
    """Bitta dars: matnli kontent, daraja, davomiyligi va XP mukofoti."""

    LEVEL_BASIC = 'basic'
    LEVEL_MID = 'mid'
    LEVEL_HIGH = 'high'
    LEVEL_CHOICES = [
        (LEVEL_BASIC, 'Boshlangʻich'),
        (LEVEL_MID, 'Oʻrta'),
        (LEVEL_HIGH, 'Yuqori'),
    ]

    id = models.SlugField(primary_key=True, max_length=40)
    subject = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.PROTECT,
        related_name='lessons',
    )
    title = models.CharField(max_length=180)
    duration_min = models.PositiveSmallIntegerField(default=10)
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default=LEVEL_MID,
    )
    summary = models.TextField(blank=True)
    content = models.JSONField(default=list)
    xp = models.PositiveSmallIntegerField(default=30)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['subject_id', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.id} — {self.title}'


class LessonCompletion(models.Model):
    """Foydalanuvchi tomonidan tugatilgan dars yozuvi."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_completions',
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'lesson')]
        ordering = ['-completed_at']

    def __str__(self) -> str:
        return f'{self.user_id} → {self.lesson_id}'

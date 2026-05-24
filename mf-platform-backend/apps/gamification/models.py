"""Gamification models — Achievement catalog, UserAchievement unlocks, XpLog.

Aligned with the frontend ``Achievement`` interface in ``src/lib/types.ts``.

Each :class:`Achievement` is a static catalog entry with a ``metric``
(``xp``, ``streak``, ``tests``, ``lessons``, ``level``, ``perfect``) and a
numeric ``requirement``. The :class:`UserAchievement` table records when
a user unlocked a given achievement. :class:`XpLog` is an append-only
transaction log of XP awards (and negative adjustments).
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Achievement(models.Model):
    """Static achievement catalog entry shown on the user's profile.

    The primary key is a slug (e.g. ``a-first``, ``a-streak7``) so the
    seeding script and the frontend can reference achievements by a
    stable, human-readable identifier.
    """

    METRIC_XP = 'xp'
    METRIC_STREAK = 'streak'
    METRIC_TESTS = 'tests'
    METRIC_LESSONS = 'lessons'
    METRIC_LEVEL = 'level'
    METRIC_PERFECT = 'perfect'
    METRIC_CHOICES = [
        (METRIC_XP, 'XP'),
        (METRIC_STREAK, 'Streak'),
        (METRIC_TESTS, 'Tests'),
        (METRIC_LESSONS, 'Lessons'),
        (METRIC_LEVEL, 'Level'),
        (METRIC_PERFECT, 'Perfect tests'),
    ]

    id = models.SlugField(primary_key=True, max_length=40)
    title = models.CharField(max_length=120)
    description = models.TextField()
    icon = models.CharField(max_length=40, help_text='Lucide icon name')
    color = models.CharField(
        max_length=9,
        default='#4F3CC9',
        help_text='Hex colour, e.g. #6d4aff',
    )
    metric = models.CharField(max_length=20, choices=METRIC_CHOICES)
    requirement = models.PositiveIntegerField(
        help_text='Threshold value the user metric must reach to unlock.',
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ('order',)
        verbose_name = 'Achievement'
        verbose_name_plural = 'Achievements'

    def __str__(self) -> str:
        return f'{self.id} — {self.title}'


class UserAchievement(models.Model):
    """Record of a user unlocking a given :class:`Achievement`."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='unlocks',
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'achievement')]
        ordering = ['-unlocked_at']
        verbose_name = 'User achievement'
        verbose_name_plural = 'User achievements'

    def __str__(self) -> str:
        return f'{self.user_id} → {self.achievement_id}'


class XpLog(models.Model):
    """Append-only XP transaction log entry.

    ``amount`` may be negative to model adjustments / refunds.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='xp_logs',
    )
    amount = models.IntegerField(
        help_text='XP delta; may be negative for adjustments.',
    )
    reason = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'XP log entry'
        verbose_name_plural = 'XP log entries'

    def __str__(self) -> str:
        return f'{self.user_id} {self.amount:+d} ({self.reason})'

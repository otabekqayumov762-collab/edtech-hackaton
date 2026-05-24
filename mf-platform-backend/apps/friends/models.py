"""Models for the ``friends`` app — friendships, challenges, win streaks."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Friendship(models.Model):
    """Bir foydalanuvchi boshqasiga yuborgan do'stlik so'rovi."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='friendships_sent',
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='friendships_received',
    )
    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default='pending',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('from_user', 'to_user')]
        indexes = [
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
        ]

    def __str__(self) -> str:
        return f'{self.from_user_id} -> {self.to_user_id} ({self.status})'


class Challenge(models.Model):
    """Ikki do'st o'rtasidagi musobaqa — bitta fan/sinf bo'yicha."""

    STATUS_CHOICES = [
        ('open', 'Open'),  # waiting opponent
        ('done', 'Completed'),
        ('expired', 'Expired'),
    ]

    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges_sent',
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges_received',
    )
    subject = models.CharField(max_length=32)  # matematika / ona-tili / tarix
    grade = models.PositiveSmallIntegerField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='open',
    )

    challenger_score = models.IntegerField(null=True, blank=True)
    opponent_score = models.IntegerField(null=True, blank=True)
    challenger_time_ms = models.IntegerField(null=True, blank=True)
    opponent_time_ms = models.IntegerField(null=True, blank=True)

    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wins',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['challenger', 'status']),
            models.Index(fields=['opponent', 'status']),
        ]

    def __str__(self) -> str:
        return f'Challenge#{self.pk} {self.subject} ({self.status})'


class WinStreak(models.Model):
    """Foydalanuvchi challenge'larda ketma-ket g'alaba seriyasi."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='win_streak',
    )
    current = models.PositiveIntegerField(default=0)
    best = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'{self.user_id} streak={self.current}/{self.best}'

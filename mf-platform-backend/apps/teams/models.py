"""Teams app modellari — Jamoa va a'zolik (TeamMembership)."""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Team(models.Model):
    """Jamoa (study team) — foydalanuvchilar guruhi.

    Jamoaning umumiy XP'si a'zolarning XP yig'indisidan iborat.
    Haftalik XP esa har bir ``TeamMembership.weekly_xp`` yig'indisi sifatida hisoblanadi.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=9, default='#4F3CC9')
    captain = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='captained_teams',
    )
    max_members = models.PositiveSmallIntegerField(default=20)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name

    # ---------- yordamchi metodlar ----------
    @property
    def members_count(self) -> int:
        """Hozirgi a'zolar soni."""
        return self.memberships.count()

    @property
    def is_full(self) -> bool:
        """Jamoa to'lganmi?"""
        return self.members_count >= self.max_members

    def total_xp(self) -> int:
        """A'zolar XP yig'indisi (User.xp bo'yicha)."""
        return sum(m.user.xp for m in self.memberships.select_related('user'))

    def weekly_xp_sum(self) -> int:
        """A'zolarning haftalik XP yig'indisi."""
        return (
            self.memberships.aggregate(total=models.Sum('weekly_xp'))['total'] or 0
        )


class TeamMembership(models.Model):
    """Foydalanuvchining jamoaga a'zoligi.

    Bitta foydalanuvchi faqat bitta jamoada bo'la oladi (unique-together).
    """

    id = models.AutoField(primary_key=True)
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_memberships',
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    weekly_xp = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-joined_at']
        unique_together = ('team', 'user')

    def __str__(self) -> str:
        return f'{self.user} -> {self.team}'

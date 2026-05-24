"""Tournament app modellari — haftalik musobaqalar va sovrin fondi.

Frontend `Tournament` tipi (`src/lib/types.ts`) bilan moslashtirilgan.

Modellar:
    * :class:`Tournament` — musobaqaning umumiy ma'lumotlari.
    * :class:`TournamentPrize` — turnirning top sovrinlari (rank bo'yicha).
    * :class:`Participation` — foydalanuvchi turnirda qatnashishi va to'plagan XP'si.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Tournament(models.Model):
    """Haftalik musobaqa.

    Birlamchi kalit slug ko'rinishida bo'lib, URL'larda inson tushunarli
    identifikator sifatida ishlatiladi (masalan, ``/api/v1/tournaments/hafta-1/``).
    """

    id = models.SlugField(primary_key=True, max_length=40)
    title = models.CharField(max_length=180)
    desc = models.TextField(blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    prize = models.CharField(max_length=200, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-starts_at']

    def __str__(self) -> str:
        return f'{self.id} — {self.title}'


class TournamentPrize(models.Model):
    """Turnirning ma'lum bir o'rni uchun sovrin.

    Har bir turnir uchun rank yagona bo'lishi kerak.
    """

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='top_prizes',
    )
    rank = models.PositiveSmallIntegerField()
    reward = models.CharField(max_length=200)
    xp = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['rank']
        unique_together = [('tournament', 'rank')]

    def __str__(self) -> str:
        return f'{self.tournament_id} #{self.rank} → {self.reward}'


class Participation(models.Model):
    """Foydalanuvchining turnirda ishtiroki va to'plagan XP'si.

    Bir foydalanuvchi bir turnirda faqat bir marta ishtirok eta oladi
    (``unique_together``).
    """

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='participations',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tournament_participations',
    )
    tournament_xp = models.PositiveIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('tournament', 'user')]
        ordering = ['-tournament_xp', 'joined_at']

    def __str__(self) -> str:
        return f'{self.user_id} @ {self.tournament_id} ({self.tournament_xp} XP)'

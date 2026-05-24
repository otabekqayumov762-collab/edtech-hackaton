"""Models for the ``duels`` app — 1v1 quiz match (Duel Arena).

Legacy models (kept for backwards compatibility):

* :class:`Duel` — a head-to-head challenge between two users.
* :class:`DuelAnswer` — a single answer submitted by a participant
  during a duel, keyed by ``question_index``.

Arena models (1vs1 battle, ELO rating, error review):

* :class:`DuelMatch` — a richer arena match with explicit subject/grade,
  per-side time tracking and rating deltas.
* :class:`DuelMatchAnswer` — detailed per-question answers including
  prompt text, type, the user's reply, the correct answer and
  explanation — used to render the error-review screen.
* :class:`DuelRating` — per-user ELO rating with streak bookkeeping.
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Duel(models.Model):
    """A 1v1 quiz match between two users.

    Lifecycle: ``pending`` -> ``active`` -> ``finished`` (or ``cancelled``).
    The challenger initiates the duel; the opponent must accept to
    transition it from ``pending`` to ``active``. Scores are tallied as
    each side submits answers; once both sides have answered all
    ``question_count`` questions the duel is marked ``finished`` and a
    ``winner`` is computed.
    """

    STATE_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('active', 'Faol'),
        ('finished', 'Yakunlangan'),
        ('cancelled', 'Bekor'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='duels_initiated',
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='duels_received',
    )
    subject = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')
    challenger_score = models.PositiveSmallIntegerField(default=0)
    opponent_score = models.PositiveSmallIntegerField(default=0)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='duels_won',
    )
    question_count = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Duel<{self.id}> {self.challenger_id} vs {self.opponent_id} ({self.state})'

    def is_participant(self, user) -> bool:
        """Return True if ``user`` participates in this duel."""
        return user.is_authenticated and user.id in (self.challenger_id, self.opponent_id)


class DuelAnswer(models.Model):
    """A single answer submitted by a participant during a :class:`Duel`.

    The pair ``(duel, user, question_index)`` is unique — each user can
    answer a given question only once per duel.
    """

    duel = models.ForeignKey(Duel, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question_index = models.PositiveSmallIntegerField()
    is_correct = models.BooleanField()
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['duel', 'user', 'question_index'],
                name='duels_duelanswer_unique_duel_user_qidx',
            )
        ]
        ordering = ['duel_id', 'user_id', 'question_index']

    def __str__(self) -> str:
        return (
            f'DuelAnswer<duel={self.duel_id} user={self.user_id} '
            f'q={self.question_index} correct={self.is_correct}>'
        )


# ---------------------------------------------------------------------------
# Arena models — 1vs1 battle with ELO rating + error review
# ---------------------------------------------------------------------------


class DuelMatch(models.Model):
    """Arena duel — 1vs1 battle with explicit subject/grade and time.

    Lifecycle: ``lobby`` -> ``playing`` -> ``done`` (or ``cancelled``).
    Both sides submit ``DuelMatchAnswer`` rows; once both have submitted
    the duel is finalized via :func:`apps.duels.services.finalize_duel`,
    which awards XP/coins and updates ELO :class:`DuelRating`.
    """

    STATUS = [
        ('lobby', 'Lobby'),
        ('playing', 'Playing'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ]

    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='duels_as_challenger',
        on_delete=models.CASCADE,
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='duels_as_opponent',
        on_delete=models.CASCADE,
    )
    subject = models.CharField(max_length=32)
    grade = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=12, choices=STATUS, default='lobby')

    challenger_score = models.PositiveIntegerField(default=0)
    opponent_score = models.PositiveIntegerField(default=0)
    challenger_time_ms = models.IntegerField(default=0)
    opponent_time_ms = models.IntegerField(default=0)

    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='duel_matches_won',
    )
    challenger_rating_change = models.IntegerField(default=0)
    opponent_rating_change = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['challenger', 'status']),
            models.Index(fields=['opponent', 'status']),
        ]

    def __str__(self) -> str:
        return (
            f'DuelMatch#{self.pk} {self.challenger_id} vs {self.opponent_id} '
            f'({self.status})'
        )

    def is_participant(self, user) -> bool:
        """Return True if ``user`` participates in this match."""
        return user.is_authenticated and user.id in (
            self.challenger_id,
            self.opponent_id,
        )


class DuelMatchAnswer(models.Model):
    """Detailed per-question answer for a :class:`DuelMatch`.

    Stores the question prompt, type, the user's reply, the correct
    answer and an optional explanation so the arena can render an
    error-review screen after the match completes.
    """

    duel = models.ForeignKey(
        DuelMatch,
        related_name='match_answers',
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question_idx = models.PositiveSmallIntegerField()
    question_text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=12)  # choice / fill / speech
    user_answer = models.CharField(max_length=500, blank=True)
    correct_answer = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    time_ms = models.IntegerField(default=0)
    explanation = models.CharField(max_length=500, blank=True)

    class Meta:
        unique_together = [('duel', 'user', 'question_idx')]
        ordering = ['duel_id', 'user_id', 'question_idx']

    def __str__(self) -> str:
        return (
            f'DuelMatchAnswer<duel={self.duel_id} user={self.user_id} '
            f'q={self.question_idx} correct={self.is_correct}>'
        )


class DuelRating(models.Model):
    """Per-user ELO rating for the Duel Arena.

    ``rating`` starts at 1000 (standard ELO seed). ``streak`` tracks
    consecutive wins; ``best_streak`` remembers the user's all-time
    best. Updated by :func:`apps.duels.services.finalize_duel`.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='duel_rating',
    )
    rating = models.IntegerField(default=1000)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    draws = models.PositiveIntegerField(default=0)
    streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-rating']

    def __str__(self) -> str:
        return f'DuelRating<{self.user_id} {self.rating}>'

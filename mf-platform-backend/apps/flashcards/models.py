"""Models for the ``flashcards`` app.

Implements physical-style flash cards grouped by topic. Each
:class:`FlashTopic` holds ~20 :class:`FlashCard` instances with a
question (``front``) and answer (``back``). Users go through a topic
and mark each card as known / unknown — the result is persisted as a
:class:`FlashSession` so we can award a small amount of XP and bump the
user's daily-goal counter.

The shapes are designed to mirror the frontend ``FlashTopic`` and
``FlashCard`` interfaces declared in ``src/lib/types.ts``.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class FlashTopic(models.Model):
    """A bundle of ~20 flash cards belonging to a single subject.

    The primary key is a slug so the API exposes a human-readable id
    (e.g. ``algebra-formulalari``). Topics are scoped to a
    :class:`apps.subjects.Subject` via a protected foreign key — the
    subject cannot be deleted while topics still reference it.
    """

    id = models.SlugField(primary_key=True, max_length=40)
    subject = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.PROTECT,
        related_name='flash_topics',
    )
    title = models.CharField(max_length=200)
    desc = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('order', 'title')
        verbose_name = 'Flash topic'
        verbose_name_plural = 'Flash topics'

    def __str__(self) -> str:
        return f'{self.title} ({self.subject_id})'

    @property
    def card_count(self) -> int:
        """Number of cards attached to this topic."""
        return self.cards.count()


class FlashCard(models.Model):
    """A single flash card — a question (``front``) and answer (``back``).

    Ordering within a topic is controlled by the ``order`` field so the
    deck plays back in a stable sequence.
    """

    topic = models.ForeignKey(
        FlashTopic,
        on_delete=models.CASCADE,
        related_name='cards',
    )
    front = models.TextField()
    back = models.TextField()
    hint = models.CharField(max_length=200, blank=True, default='')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ('order',)
        verbose_name = 'Flash card'
        verbose_name_plural = 'Flash cards'

    def __str__(self) -> str:
        preview = self.front[:40].replace('\n', ' ')
        return f'#{self.pk} {preview}'


class FlashSession(models.Model):
    """A completed flash-card review session for a user + topic.

    The ``known_count`` / ``unknown_count`` totals are derived from the
    request payload at submit time; ``xp_earned`` records what the user
    actually received (so reverting an :func:`apps.users.models.User.add_xp`
    call later is straightforward).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flash_sessions',
    )
    topic = models.ForeignKey(
        FlashTopic,
        on_delete=models.CASCADE,
    )
    known_count = models.PositiveSmallIntegerField(default=0)
    unknown_count = models.PositiveSmallIntegerField(default=0)
    xp_earned = models.PositiveSmallIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-started_at',)
        verbose_name = 'Flash session'
        verbose_name_plural = 'Flash sessions'

    def __str__(self) -> str:
        return f'{self.user_id} · {self.topic_id} · +{self.xp_earned}XP'

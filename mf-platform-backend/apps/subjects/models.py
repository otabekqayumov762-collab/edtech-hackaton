"""Subject model — canonical subject category for the platform.

Aligned with the frontend `Subject` type defined in `src/lib/types.ts`.
Each subject has a slug `id` (e.g. ``matematika``, ``fizika``), a display
name, a short label, a lucide icon name, a hex colour and an ordering hint.
"""
from __future__ import annotations

from django.db import models


class Subject(models.Model):
    """Canonical subject category (Matematika, Fizika, Kimyo, ...).

    The primary key is a slug so the URL and API representation can use
    a human-readable identifier (e.g. ``/api/v1/subjects/matematika/``).
    """

    id = models.SlugField(primary_key=True, max_length=32)
    name = models.CharField(max_length=100)
    short = models.CharField(max_length=8)
    icon = models.CharField(max_length=40, help_text='Lucide icon name')
    color = models.CharField(max_length=9, default='#4F3CC9', help_text='Hex colour, e.g. #6d4aff')
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('order', 'name')
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self) -> str:
        return self.name

    @property
    def topics_count(self) -> int:
        """Count of related lessons (topics) for this subject.

        Resolves the reverse relation lazily — returns 0 when the
        related ``lessons`` app has no inbound relation yet.
        """
        manager = getattr(self, 'lessons', None)
        if manager is None:
            return 0
        try:
            return manager.count()
        except Exception:
            return 0

    @property
    def tests_count(self) -> int:
        """Count of related tests for this subject.

        Resolves the reverse relation lazily — returns 0 when the
        related ``tests`` app has no inbound relation yet.
        """
        manager = getattr(self, 'tests', None)
        if manager is None:
            return 0
        try:
            return manager.count()
        except Exception:
            return 0


class Topic(models.Model):
    """Fan ichidagi mavzu — mavzuli testlar uchun."""

    subject = models.ForeignKey(
        'Subject',
        on_delete=models.CASCADE,
        related_name='topics',
    )
    slug = models.SlugField(max_length=80)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=300, blank=True)
    grade = models.PositiveSmallIntegerField(default=9)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = [('subject', 'slug')]
        ordering = ['subject', 'grade', 'sort_order']
        verbose_name = 'Mavzu'
        verbose_name_plural = 'Mavzular'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'{self.subject_id} / {self.name}'

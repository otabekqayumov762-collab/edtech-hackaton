"""Tests app modellari.

Test — bir fanga tegishli ko'p-savolli quiz. Foydalanuvchi savollarga
javob berib o'tadi (LIVES sistemasi: noto'g'ri javob -1 jon, ketma-ket
5 ta to'g'ri +1 jon). Modellar frontenddagi ``Test`` / ``Question``
tiplariga mos keladi (``src/lib/types.ts``).
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Test(models.Model):
    """Bir fanga tegishli ko'p-savolli test (quiz)."""

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MID = 'mid'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Oson'),
        (DIFFICULTY_MID, 'Oʻrta'),
        (DIFFICULTY_HARD, 'Qiyin'),
    ]

    id = models.SlugField(primary_key=True, max_length=40)
    subject = models.ForeignKey(
        'subjects.Subject',
        on_delete=models.PROTECT,
        related_name='tests',
    )
    topic = models.ForeignKey(
        'subjects.Topic',
        on_delete=models.SET_NULL,
        related_name='tests',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default=DIFFICULTY_MID,
    )
    duration_min = models.PositiveSmallIntegerField(default=10)
    xp = models.PositiveSmallIntegerField(default=60)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['subject_id', 'order', 'id']

    def __str__(self) -> str:
        return f'{self.id} — {self.title}'


class Question(models.Model):
    """Test tarkibidagi bitta savol — choice / fill / speech."""

    TYPE_CHOICE = 'choice'
    TYPE_FILL = 'fill'
    TYPE_SPEECH = 'speech'
    TYPE_CHOICES = [
        (TYPE_CHOICE, 'Multiple Choice'),
        (TYPE_FILL, 'Fill in the Blank'),
        (TYPE_SPEECH, 'Speech / Tushuntirish'),
    ]

    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    qtype = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_CHOICE)
    text = models.TextField()
    correct_index = models.PositiveSmallIntegerField(default=0)
    correct_text = models.CharField(max_length=300, blank=True)
    explanation = models.TextField(blank=True)
    grade = models.PositiveSmallIntegerField(default=9)
    order = models.PositiveSmallIntegerField(default=0)
    points = models.PositiveSmallIntegerField(default=10)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f'Q{self.id} (test={self.test_id})'


class Option(models.Model):
    """Savolga tegishli javob varianti."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
    )
    text = models.CharField(max_length=300)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f'Opt{self.id} (q={self.question_id})'


class TestAttempt(models.Model):
    """Foydalanuvchining test urinishi (natija + XP)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_attempts',
    )
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
    )
    correct = models.PositiveSmallIntegerField(default=0)
    total = models.PositiveSmallIntegerField(default=0)
    xp_earned = models.PositiveSmallIntegerField(default=0)
    wrong_indices = models.JSONField(default=list)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    is_complete = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']

    def __str__(self) -> str:
        return f'{self.user_id} → {self.test_id} ({self.correct}/{self.total})'

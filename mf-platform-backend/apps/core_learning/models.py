"""Core learning domain models.

This app exposes the product's main learning flow:

subject -> grade -> audio + required practice + required test.
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class CoreSubject(models.Model):
    """Subject shown in the core learning selector."""

    id = models.SlugField(primary_key=True, max_length=40)
    name = models.CharField(max_length=120)
    short = models.CharField(max_length=24)
    icon = models.CharField(max_length=40, default='BookOpen')
    color = models.CharField(max_length=9, default='#2563eb')
    is_required = models.BooleanField(default=True)
    coming_soon = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self) -> str:
        return self.name


class GradeTrack(models.Model):
    """One subject + one school grade track, from grade 5 to grade 11."""

    GRADE_CHOICES = [(grade, f'{grade}-sinf') for grade in range(5, 12)]

    subject = models.ForeignKey(
        CoreSubject,
        on_delete=models.CASCADE,
        related_name='grades',
    )
    grade = models.PositiveSmallIntegerField(choices=GRADE_CHOICES)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['subject__order', 'grade']
        unique_together = [('subject', 'grade')]

    def __str__(self) -> str:
        return f'{self.subject_id} / {self.grade}-sinf'


class LearningUnit(models.Model):
    """The playable unit inside a grade track.

    The first version keeps one canonical unit per subject/grade, while
    the schema already supports more units as content grows.
    """

    id = models.SlugField(primary_key=True, max_length=64)
    track = models.ForeignKey(
        GradeTrack,
        on_delete=models.CASCADE,
        related_name='units',
    )
    title = models.CharField(max_length=180)
    summary = models.TextField(blank=True)
    estimated_minutes = models.PositiveSmallIntegerField(default=20)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['track__subject__order', 'track__grade', 'order', 'id']

    def __str__(self) -> str:
        return self.title

    @property
    def subject(self) -> CoreSubject:
        return self.track.subject

    @property
    def grade(self) -> int:
        return self.track.grade


class AudioLesson(models.Model):
    """Optional listening section for a unit."""

    unit = models.OneToOneField(
        LearningUnit,
        on_delete=models.CASCADE,
        related_name='audio',
    )
    title = models.CharField(max_length=180)
    audio_url = models.URLField(blank=True, default='')
    transcript = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=300)
    xp_reward = models.PositiveSmallIntegerField(default=10)
    coin_reward = models.PositiveSmallIntegerField(default=1)
    gem_reward = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title


class PracticeGame(models.Model):
    """Required game-style practice section for a unit."""

    TYPE_QUIZ = 'quiz'
    TYPE_MATCH = 'match'
    TYPE_DRAG_DROP = 'drag_drop'
    GAME_TYPE_CHOICES = [
        (TYPE_QUIZ, 'Quiz'),
        (TYPE_MATCH, 'Match'),
        (TYPE_DRAG_DROP, 'Drag & drop'),
    ]

    unit = models.OneToOneField(
        LearningUnit,
        on_delete=models.CASCADE,
        related_name='practice',
    )
    title = models.CharField(max_length=180)
    game_type = models.CharField(
        max_length=20,
        choices=GAME_TYPE_CHOICES,
        default=TYPE_QUIZ,
    )
    xp_per_correct = models.PositiveSmallIntegerField(default=8)
    coin_reward = models.PositiveSmallIntegerField(default=2)
    gem_reward_perfect = models.PositiveSmallIntegerField(default=1)
    is_required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title


class PracticeQuestion(models.Model):
    """A practice prompt. The answer is always checked server-side."""

    practice = models.ForeignKey(
        PracticeGame,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    prompt = models.TextField()
    question_type = models.CharField(max_length=20, default=PracticeGame.TYPE_QUIZ)
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.JSONField(default=dict)
    explanation = models.TextField(blank=True)
    difficulty = models.PositiveSmallIntegerField(default=1)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f'PracticeQ<{self.pk}>'


class CoreTest(models.Model):
    """Required game-style test section for a unit."""

    unit = models.OneToOneField(
        LearningUnit,
        on_delete=models.CASCADE,
        related_name='test',
    )
    title = models.CharField(max_length=180)
    question_limit = models.PositiveSmallIntegerField(default=5)
    xp_per_correct = models.PositiveSmallIntegerField(default=12)
    pass_bonus_xp = models.PositiveSmallIntegerField(default=20)
    perfect_bonus_xp = models.PositiveSmallIntegerField(default=40)
    coin_reward = models.PositiveSmallIntegerField(default=3)
    gem_reward_perfect = models.PositiveSmallIntegerField(default=2)
    is_required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title


class CoreTestQuestion(models.Model):
    """A test question. Correct answer is never exposed to the frontend."""

    test = models.ForeignKey(
        CoreTest,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    prompt = models.TextField()
    options = models.JSONField(default=list)
    correct_index = models.PositiveSmallIntegerField(default=0)
    explanation = models.TextField(blank=True)
    difficulty = models.PositiveSmallIntegerField(default=1)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        return f'TestQ<{self.pk}>'


class CoreProgress(models.Model):
    """Per-user progress across the three unit sections."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='core_progress',
    )
    unit = models.ForeignKey(
        LearningUnit,
        on_delete=models.CASCADE,
        related_name='progress_rows',
    )
    audio_completed = models.BooleanField(default=False)
    practice_completed = models.BooleanField(default=False)
    test_completed = models.BooleanField(default=False)
    best_practice_score = models.PositiveSmallIntegerField(default=0)
    best_test_score = models.PositiveSmallIntegerField(default=0)
    total_xp_earned = models.PositiveIntegerField(default=0)
    total_coins_earned = models.PositiveIntegerField(default=0)
    total_gems_earned = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'unit')]
        ordering = ['unit__track__subject__order', 'unit__track__grade']

    @property
    def completed(self) -> bool:
        return self.practice_completed and self.test_completed

    @property
    def progress_percent(self) -> int:
        score = 0
        if self.audio_completed:
            score += 20
        if self.practice_completed:
            score += 40
        if self.test_completed:
            score += 40
        return score


class CoreAttempt(models.Model):
    """A completed audio/practice/test action and its reward payload."""

    KIND_AUDIO = 'audio'
    KIND_PRACTICE = 'practice'
    KIND_TEST = 'test'
    KIND_CHOICES = [
        (KIND_AUDIO, 'Audio'),
        (KIND_PRACTICE, 'Practice'),
        (KIND_TEST, 'Test'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='core_attempts',
    )
    unit = models.ForeignKey(
        LearningUnit,
        on_delete=models.CASCADE,
        related_name='attempts',
    )
    kind = models.CharField(max_length=16, choices=KIND_CHOICES)
    total = models.PositiveSmallIntegerField(default=0)
    correct = models.PositiveSmallIntegerField(default=0)
    wrong_question_ids = models.JSONField(default=list, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    xp_earned = models.PositiveSmallIntegerField(default=0)
    coins_earned = models.PositiveSmallIntegerField(default=0)
    gems_earned = models.PositiveSmallIntegerField(default=0)
    hearts_lost = models.PositiveSmallIntegerField(default=0)
    payload = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(default=timezone.now)
    is_complete = models.BooleanField(default=True)

    class Meta:
        ordering = ['-finished_at']


class AiLearningSignal(models.Model):
    """Fine-grained events used to generate adaptive questions and daily plans."""

    SOURCE_PRACTICE = 'practice'
    SOURCE_TEST = 'test'
    SOURCE_AUDIO = 'audio'
    SOURCE_CHOICES = [
        (SOURCE_PRACTICE, 'Practice'),
        (SOURCE_TEST, 'Test'),
        (SOURCE_AUDIO, 'Audio'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='learning_signals',
    )
    subject = models.ForeignKey(
        CoreSubject,
        on_delete=models.CASCADE,
        related_name='learning_signals',
    )
    grade = models.PositiveSmallIntegerField()
    unit = models.ForeignKey(
        LearningUnit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='learning_signals',
    )
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES)
    question_model = models.CharField(max_length=40, blank=True, default='')
    question_id = models.CharField(max_length=64, blank=True, default='')
    is_correct = models.BooleanField(default=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    difficulty = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'is_correct']),
            models.Index(fields=['user', 'created_at']),
        ]


class DailyPlan(models.Model):
    """Cached daily plan generated from recent learning signals."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='core_daily_plans',
    )
    date = models.DateField()
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'date')]
        ordering = ['-date']

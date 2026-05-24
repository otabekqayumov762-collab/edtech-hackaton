"""Arena models migration — DuelMatch, DuelMatchAnswer, DuelRating.

Adds the 1vs1 battle arena tables: a richer match table with explicit
subject/grade and time tracking, a detailed per-question answer table
used for the error-review screen, and a per-user ELO rating table.
"""
from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create :class:`DuelMatch`, :class:`DuelMatchAnswer`, :class:`DuelRating`."""

    dependencies = [
        ('users', '0004_user_gems'),
        ('duels', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DuelMatch',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('subject', models.CharField(max_length=32)),
                ('grade', models.PositiveSmallIntegerField()),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('lobby', 'Lobby'),
                            ('playing', 'Playing'),
                            ('done', 'Done'),
                            ('cancelled', 'Cancelled'),
                        ],
                        default='lobby',
                        max_length=12,
                    ),
                ),
                ('challenger_score', models.PositiveIntegerField(default=0)),
                ('opponent_score', models.PositiveIntegerField(default=0)),
                ('challenger_time_ms', models.IntegerField(default=0)),
                ('opponent_time_ms', models.IntegerField(default=0)),
                ('challenger_rating_change', models.IntegerField(default=0)),
                ('opponent_rating_change', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                (
                    'challenger',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='duels_as_challenger',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'opponent',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='duels_as_opponent',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'winner',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='duel_matches_won',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='duelmatch',
            index=models.Index(
                fields=['challenger', 'status'],
                name='duels_duelm_challen_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='duelmatch',
            index=models.Index(
                fields=['opponent', 'status'],
                name='duels_duelm_opponen_idx',
            ),
        ),
        migrations.CreateModel(
            name='DuelMatchAnswer',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('question_idx', models.PositiveSmallIntegerField()),
                ('question_text', models.CharField(max_length=500)),
                ('question_type', models.CharField(max_length=12)),
                ('user_answer', models.CharField(blank=True, max_length=500)),
                ('correct_answer', models.CharField(max_length=500)),
                ('is_correct', models.BooleanField(default=False)),
                ('time_ms', models.IntegerField(default=0)),
                ('explanation', models.CharField(blank=True, max_length=500)),
                (
                    'duel',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='match_answers',
                        to='duels.duelmatch',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['duel_id', 'user_id', 'question_idx'],
                'unique_together': {('duel', 'user', 'question_idx')},
            },
        ),
        migrations.CreateModel(
            name='DuelRating',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('rating', models.IntegerField(default=1000)),
                ('wins', models.PositiveIntegerField(default=0)),
                ('losses', models.PositiveIntegerField(default=0)),
                ('draws', models.PositiveIntegerField(default=0)),
                ('streak', models.PositiveIntegerField(default=0)),
                ('best_streak', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='duel_rating',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-rating'],
            },
        ),
    ]

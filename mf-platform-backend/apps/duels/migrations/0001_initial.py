"""Initial migration for the ``duels`` app.

Creates :class:`Duel` and :class:`DuelAnswer` tables with FKs to
``users.User`` (via ``settings.AUTH_USER_MODEL``) and ``subjects.Subject``.
"""
from __future__ import annotations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create the :class:`Duel` and :class:`DuelAnswer` tables."""

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('subjects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Duel',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    'state',
                    models.CharField(
                        choices=[
                            ('pending', 'Kutilmoqda'),
                            ('active', 'Faol'),
                            ('finished', 'Yakunlangan'),
                            ('cancelled', 'Bekor'),
                        ],
                        default='pending',
                        max_length=20,
                    ),
                ),
                ('challenger_score', models.PositiveSmallIntegerField(default=0)),
                ('opponent_score', models.PositiveSmallIntegerField(default=0)),
                ('question_count', models.PositiveSmallIntegerField(default=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                (
                    'challenger',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='duels_initiated',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'opponent',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='duels_received',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'subject',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        to='subjects.subject',
                    ),
                ),
                (
                    'winner',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='duels_won',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='DuelAnswer',
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
                ('question_index', models.PositiveSmallIntegerField()),
                ('is_correct', models.BooleanField()),
                ('answered_at', models.DateTimeField(auto_now_add=True)),
                (
                    'duel',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='answers',
                        to='duels.duel',
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
                'ordering': ['duel_id', 'user_id', 'question_index'],
            },
        ),
        migrations.AddConstraint(
            model_name='duelanswer',
            constraint=models.UniqueConstraint(
                fields=('duel', 'user', 'question_index'),
                name='duels_duelanswer_unique_duel_user_qidx',
            ),
        ),
    ]

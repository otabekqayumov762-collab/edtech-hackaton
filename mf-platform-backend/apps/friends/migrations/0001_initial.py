"""Initial migration for the ``friends`` app.

Creates :class:`Friendship`, :class:`Challenge` and :class:`WinStreak` tables.
Qo'lda yozilgan — venv yo'q.
"""
from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create friendships, challenges, win streaks."""

    initial = True

    dependencies = [
        ('users', '0004_user_gems'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Friendship',
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
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('pending', 'Pending'),
                            ('accepted', 'Accepted'),
                            ('rejected', 'Rejected'),
                        ],
                        default='pending',
                        max_length=12,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('accepted_at', models.DateTimeField(blank=True, null=True)),
                (
                    'from_user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='friendships_sent',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'to_user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='friendships_received',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'unique_together': {('from_user', 'to_user')},
            },
        ),
        migrations.AddIndex(
            model_name='friendship',
            index=models.Index(
                fields=['from_user', 'status'],
                name='friends_fr_from_us_2c0e2f_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='friendship',
            index=models.Index(
                fields=['to_user', 'status'],
                name='friends_fr_to_user_b1c7a5_idx',
            ),
        ),
        migrations.CreateModel(
            name='Challenge',
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
                            ('open', 'Open'),
                            ('done', 'Completed'),
                            ('expired', 'Expired'),
                        ],
                        default='open',
                        max_length=10,
                    ),
                ),
                ('challenger_score', models.IntegerField(blank=True, null=True)),
                ('opponent_score', models.IntegerField(blank=True, null=True)),
                ('challenger_time_ms', models.IntegerField(blank=True, null=True)),
                ('opponent_time_ms', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                (
                    'challenger',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='challenges_sent',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'opponent',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='challenges_received',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'winner',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='wins',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name='challenge',
            index=models.Index(
                fields=['challenger', 'status'],
                name='friends_ch_challen_a83b71_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='challenge',
            index=models.Index(
                fields=['opponent', 'status'],
                name='friends_ch_opponen_7f1e84_idx',
            ),
        ),
        migrations.CreateModel(
            name='WinStreak',
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
                ('current', models.PositiveIntegerField(default=0)),
                ('best', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='win_streak',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]

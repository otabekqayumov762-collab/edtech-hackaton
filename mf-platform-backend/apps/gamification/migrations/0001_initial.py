"""Initial migration for the ``gamification`` app.

Creates the :class:`Achievement` catalog, :class:`UserAchievement`
unlock log, and :class:`XpLog` transaction log. Depends on the
swappable ``AUTH_USER_MODEL`` (``apps.users.User``).
"""
from __future__ import annotations

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create the gamification tables."""

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Achievement',
            fields=[
                (
                    'id',
                    models.SlugField(
                        max_length=40,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('title', models.CharField(max_length=120)),
                ('description', models.TextField()),
                (
                    'icon',
                    models.CharField(
                        help_text='Lucide icon name',
                        max_length=40,
                    ),
                ),
                (
                    'color',
                    models.CharField(
                        default='#4F3CC9',
                        help_text='Hex colour, e.g. #6d4aff',
                        max_length=9,
                    ),
                ),
                (
                    'metric',
                    models.CharField(
                        choices=[
                            ('xp', 'XP'),
                            ('streak', 'Streak'),
                            ('tests', 'Tests'),
                            ('lessons', 'Lessons'),
                            ('level', 'Level'),
                            ('perfect', 'Perfect tests'),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    'requirement',
                    models.PositiveIntegerField(
                        help_text=(
                            'Threshold value the user metric must reach '
                            'to unlock.'
                        ),
                    ),
                ),
                ('order', models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                'verbose_name': 'Achievement',
                'verbose_name_plural': 'Achievements',
                'ordering': ('order',),
            },
        ),
        migrations.CreateModel(
            name='UserAchievement',
            fields=[
                (
                    'id',
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('unlocked_at', models.DateTimeField(auto_now_add=True)),
                (
                    'achievement',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='unlocks',
                        to='gamification.achievement',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='achievements',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'User achievement',
                'verbose_name_plural': 'User achievements',
                'ordering': ['-unlocked_at'],
                'unique_together': {('user', 'achievement')},
            },
        ),
        migrations.CreateModel(
            name='XpLog',
            fields=[
                (
                    'id',
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'amount',
                    models.IntegerField(
                        help_text=(
                            'XP delta; may be negative for adjustments.'
                        ),
                    ),
                ),
                ('reason', models.CharField(max_length=60)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='xp_logs',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'XP log entry',
                'verbose_name_plural': 'XP log entries',
                'ordering': ['-created_at'],
            },
        ),
    ]

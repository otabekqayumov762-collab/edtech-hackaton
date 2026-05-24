"""Tournaments app boshlang'ich migratsiyasi.

Tournament, TournamentPrize va Participation jadvallarini yaratadi.
Foydalanuvchi modeli ``settings.AUTH_USER_MODEL`` orqali ulanadi.
"""
from __future__ import annotations

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Tournaments app jadvallarini yaratuvchi migratsiya."""

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                (
                    'id',
                    models.SlugField(
                        max_length=40,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('title', models.CharField(max_length=180)),
                ('desc', models.TextField(blank=True)),
                ('starts_at', models.DateTimeField()),
                ('ends_at', models.DateTimeField()),
                (
                    'prize',
                    models.CharField(blank=True, default='', max_length=200),
                ),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-starts_at'],
            },
        ),
        migrations.CreateModel(
            name='TournamentPrize',
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
                ('rank', models.PositiveSmallIntegerField()),
                ('reward', models.CharField(max_length=200)),
                ('xp', models.PositiveIntegerField(default=0)),
                (
                    'tournament',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='top_prizes',
                        to='tournaments.tournament',
                    ),
                ),
            ],
            options={
                'ordering': ['rank'],
                'unique_together': {('tournament', 'rank')},
            },
        ),
        migrations.CreateModel(
            name='Participation',
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
                ('tournament_xp', models.PositiveIntegerField(default=0)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                (
                    'tournament',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='participations',
                        to='tournaments.tournament',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='tournament_participations',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-tournament_xp', 'joined_at'],
                'unique_together': {('tournament', 'user')},
            },
        ),
    ]

"""``tests`` app uchun dastlabki migratsiya.

Test, Question, Option va TestAttempt jadvallarini yaratadi.
``apps.subjects.Subject`` va ``apps.users.User`` (AUTH_USER_MODEL) ga
tashqi kalitlar qo'yiladi.
"""
from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Tests app initial schema."""

    initial = True

    dependencies = [
        ('subjects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Test',
            fields=[
                (
                    'id',
                    models.SlugField(
                        max_length=40,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('title', models.CharField(max_length=200)),
                (
                    'difficulty',
                    models.CharField(
                        choices=[
                            ('easy', 'Oson'),
                            ('mid', 'Oʻrta'),
                            ('hard', 'Qiyin'),
                        ],
                        default='mid',
                        max_length=20,
                    ),
                ),
                ('duration_min', models.PositiveSmallIntegerField(default=10)),
                ('xp', models.PositiveSmallIntegerField(default=60)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'subject',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='tests',
                        to='subjects.subject',
                    ),
                ),
            ],
            options={
                'ordering': ['subject_id', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='Question',
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
                ('text', models.TextField()),
                ('correct_index', models.PositiveSmallIntegerField()),
                ('explanation', models.TextField(blank=True)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                (
                    'test',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='questions',
                        to='tests.test',
                    ),
                ),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='Option',
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
                ('text', models.CharField(max_length=300)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                (
                    'question',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='options',
                        to='tests.question',
                    ),
                ),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='TestAttempt',
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
                ('correct', models.PositiveSmallIntegerField(default=0)),
                ('total', models.PositiveSmallIntegerField(default=0)),
                ('xp_earned', models.PositiveSmallIntegerField(default=0)),
                ('wrong_indices', models.JSONField(default=list)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('is_complete', models.BooleanField(default=False)),
                (
                    'test',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to='tests.test',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='test_attempts',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-started_at'],
            },
        ),
    ]

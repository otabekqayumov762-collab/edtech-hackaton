"""Initial migration for the ``notifications`` app.

Creates :class:`Notification`, :class:`NotificationTemplate` and
:class:`UserNotificationPrefs` tables. Qo'lda yozilgan — venv yo'q.
"""
from __future__ import annotations

import datetime

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create notifications, templates, prefs."""

    initial = True

    dependencies = [
        ('users', '0002_user_coins'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
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
                    'type',
                    models.CharField(
                        choices=[
                            ('daily', 'Daily reminder'),
                            ('motivation', 'Motivation'),
                            ('streak', 'Streak'),
                            ('reward', 'Reward'),
                            ('comeback', 'Comeback'),
                        ],
                        max_length=16,
                    ),
                ),
                ('title', models.CharField(max_length=120)),
                ('body', models.CharField(max_length=300)),
                (
                    'source',
                    models.CharField(
                        choices=[('ai', 'AI'), ('template', 'Template')],
                        default='template',
                        max_length=12,
                    ),
                ),
                ('scheduled_for', models.DateTimeField(blank=True, null=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='notifications',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(
                fields=['user', 'read_at'],
                name='notif_user_read_idx',
            ),
        ),
        migrations.CreateModel(
            name='NotificationTemplate',
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
                ('slug', models.SlugField(max_length=64, unique=True)),
                (
                    'type',
                    models.CharField(
                        choices=[
                            ('daily', 'Daily reminder'),
                            ('motivation', 'Motivation'),
                            ('streak', 'Streak'),
                            ('reward', 'Reward'),
                            ('comeback', 'Comeback'),
                        ],
                        max_length=16,
                    ),
                ),
                ('title', models.CharField(max_length=120)),
                ('body', models.CharField(max_length=300)),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['type', 'slug'],
            },
        ),
        migrations.CreateModel(
            name='UserNotificationPrefs',
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
                ('push_enabled', models.BooleanField(default=True)),
                ('morning_enabled', models.BooleanField(default=True)),
                ('day_enabled', models.BooleanField(default=True)),
                ('evening_enabled', models.BooleanField(default=True)),
                ('quiet_start', models.TimeField(default=datetime.time(22, 0))),
                ('quiet_end', models.TimeField(default=datetime.time(7, 0))),
                ('last_comeback_sent', models.DateTimeField(blank=True, null=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='notif_prefs',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]

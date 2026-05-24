"""Initial migration for the ``flashcards`` app.

Creates the :class:`FlashTopic`, :class:`FlashCard` and
:class:`FlashSession` tables. References ``subjects.Subject`` (PROTECT)
and ``settings.AUTH_USER_MODEL`` (CASCADE).
"""
from __future__ import annotations

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Create FlashTopic, FlashCard and FlashSession tables."""

    initial = True

    dependencies = [
        ('subjects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FlashTopic',
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
                ('desc', models.TextField(blank=True)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'subject',
                    models.ForeignKey(
                        on_delete=models.deletion.PROTECT,
                        related_name='flash_topics',
                        to='subjects.subject',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Flash topic',
                'verbose_name_plural': 'Flash topics',
                'ordering': ('order', 'title'),
            },
        ),
        migrations.CreateModel(
            name='FlashCard',
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
                ('front', models.TextField()),
                ('back', models.TextField()),
                (
                    'hint',
                    models.CharField(
                        blank=True,
                        default='',
                        max_length=200,
                    ),
                ),
                ('order', models.PositiveSmallIntegerField(default=0)),
                (
                    'topic',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='cards',
                        to='flashcards.flashtopic',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Flash card',
                'verbose_name_plural': 'Flash cards',
                'ordering': ('order',),
            },
        ),
        migrations.CreateModel(
            name='FlashSession',
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
                ('known_count', models.PositiveSmallIntegerField(default=0)),
                ('unknown_count', models.PositiveSmallIntegerField(default=0)),
                ('xp_earned', models.PositiveSmallIntegerField(default=0)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                (
                    'topic',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to='flashcards.flashtopic',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='flash_sessions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Flash session',
                'verbose_name_plural': 'Flash sessions',
                'ordering': ('-started_at',),
            },
        ),
    ]

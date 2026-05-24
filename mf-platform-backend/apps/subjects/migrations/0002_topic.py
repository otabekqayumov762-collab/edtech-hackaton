"""Subjects app — Topic modeli uchun migratsiya.

Subject ichidagi mavzular jadvali (mavzuli testlar uchun).
"""
from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Topic modeli."""

    dependencies = [
        ('subjects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Topic',
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
                ('slug', models.SlugField(max_length=80)),
                ('name', models.CharField(max_length=120)),
                ('description', models.CharField(blank=True, max_length=300)),
                ('grade', models.PositiveSmallIntegerField(default=9)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
                (
                    'subject',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='topics',
                        to='subjects.subject',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Mavzu',
                'verbose_name_plural': 'Mavzular',
                'ordering': ['subject', 'grade', 'sort_order'],
                'unique_together': {('subject', 'slug')},
            },
        ),
    ]

"""Initial migration for the ``subjects`` app."""
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    """Create the :class:`Subject` table."""

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Subject',
            fields=[
                (
                    'id',
                    models.SlugField(
                        max_length=32,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('name', models.CharField(max_length=100)),
                ('short', models.CharField(max_length=8)),
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
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Subject',
                'verbose_name_plural': 'Subjects',
                'ordering': ('order', 'name'),
            },
        ),
    ]

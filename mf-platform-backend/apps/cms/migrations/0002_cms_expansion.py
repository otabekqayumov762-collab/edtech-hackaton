"""CMS expansion — yangi modellar.

Quyidagi modellar uchun jadval yaratadi:
PricingPlan, PricingFeature, ProcessStep, StatBadge, TeamMember,
NavLink, CTA, TextSnippet.
"""
from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Yangi CMS modellari."""

    dependencies = [
        ('cms', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PricingPlan',
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
                ('name', models.CharField(max_length=80)),
                ('price_text', models.CharField(max_length=40)),
                ('price_value', models.PositiveIntegerField(default=0)),
                ('icon', models.CharField(default='Crown', max_length=40)),
                ('description', models.CharField(blank=True, max_length=200)),
                ('is_popular', models.BooleanField(default=False)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Tarif rejasi',
                'verbose_name_plural': 'Tarif rejalari',
                'ordering': ['sort_order'],
            },
        ),
        migrations.CreateModel(
            name='PricingFeature',
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
                ('label', models.CharField(max_length=160)),
                ('included', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                (
                    'plan',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='features',
                        to='cms.pricingplan',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Tarif imkoniyati',
                'verbose_name_plural': 'Tarif imkoniyatlari',
                'ordering': ['plan', 'sort_order'],
            },
        ),
        migrations.CreateModel(
            name='ProcessStep',
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
                ('step_number', models.PositiveSmallIntegerField(unique=True)),
                ('title', models.CharField(max_length=80)),
                ('description', models.CharField(max_length=300)),
                ('icon', models.CharField(default='Target', max_length=40)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Jarayon qadami',
                'verbose_name_plural': 'Jarayon qadamlari',
                'ordering': ['step_number'],
            },
        ),
        migrations.CreateModel(
            name='StatBadge',
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
                    'kind',
                    models.CharField(
                        choices=[
                            ('users', 'Foydalanuvchilar'),
                            ('tests', 'Testlar'),
                            ('lessons', 'Darslar'),
                            ('xp', 'Jami XP'),
                            ('custom', 'Boshqa'),
                        ],
                        default='custom',
                        max_length=12,
                    ),
                ),
                ('label', models.CharField(max_length=80)),
                ('value', models.CharField(max_length=40)),
                ('icon', models.CharField(default='TrendingUp', max_length=40)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': "Statistika ko'rsatkichi",
                'verbose_name_plural': "Statistika ko'rsatkichlari",
                'ordering': ['sort_order'],
            },
        ),
        migrations.CreateModel(
            name='TeamMember',
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
                ('name', models.CharField(max_length=80)),
                ('role', models.CharField(max_length=120)),
                ('bio', models.TextField(blank=True)),
                (
                    'avatar_color',
                    models.CharField(default='#a5b4fc', max_length=12),
                ),
                ('telegram', models.CharField(blank=True, max_length=80)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': "Jamoa a'zosi",
                'verbose_name_plural': "Jamoa a'zolari",
                'ordering': ['sort_order'],
            },
        ),
        migrations.CreateModel(
            name='NavLink',
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
                    'location',
                    models.CharField(
                        choices=[
                            ('top', 'Top navbar'),
                            ('footer-product', 'Footer: Platforma'),
                            ('footer-company', 'Footer: Kompaniya'),
                            ('footer-help', 'Footer: Yordam'),
                        ],
                        max_length=18,
                    ),
                ),
                ('label', models.CharField(max_length=80)),
                ('url', models.CharField(max_length=200)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Navigatsiya havolasi',
                'verbose_name_plural': 'Navigatsiya havolalari',
                'ordering': ['location', 'sort_order'],
            },
        ),
        migrations.CreateModel(
            name='CTA',
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
                ('label', models.CharField(max_length=80)),
                ('url', models.CharField(max_length=200)),
                ('icon', models.CharField(blank=True, max_length=40)),
                ('variant', models.CharField(default='primary', max_length=20)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'CTA tugma',
                'verbose_name_plural': 'CTA tugmalar',
            },
        ),
        migrations.CreateModel(
            name='TextSnippet',
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
                ('key', models.SlugField(max_length=64, unique=True)),
                ('label', models.CharField(blank=True, max_length=120)),
                ('value', models.TextField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': "Matn bo'lagi",
                'verbose_name_plural': "Matn bo'laklari",
                'ordering': ['key'],
            },
        ),
    ]

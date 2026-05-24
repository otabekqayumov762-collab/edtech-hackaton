"""CMS app — initial migration.

`apps/cms/models.py` ichidagi modellar uchun jadval yaratadi:
SiteSetting, HeroContent, FeatureBlock, FaqItem, Testimonial, Announcement.
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    """Boshlang'ich CMS schema."""

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Announcement',
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
                ('text', models.CharField(max_length=300)),
                ('link_url', models.URLField(blank=True)),
                ('starts_at', models.DateTimeField(blank=True, null=True)),
                ('ends_at', models.DateTimeField(blank=True, null=True)),
                ('active', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': "E'lon",
                'verbose_name_plural': "E'lonlar",
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FaqItem',
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
                ('question', models.CharField(max_length=200)),
                ('answer', models.TextField()),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'FAQ savoli',
                'verbose_name_plural': 'FAQ savollari',
                'ordering': ['sort_order'],
            },
        ),
        migrations.CreateModel(
            name='FeatureBlock',
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
                    'icon',
                    models.CharField(
                        help_text='Lucide ikon nomi (masalan: Gamepad2)',
                        max_length=40,
                    ),
                ),
                ('title', models.CharField(max_length=80)),
                ('description', models.CharField(max_length=300)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Imkoniyat bloki',
                'verbose_name_plural': 'Imkoniyat bloklari',
                'ordering': ['sort_order'],
            },
        ),
        migrations.CreateModel(
            name='HeroContent',
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
                    'headline_line1',
                    models.CharField(default="Har kuni o'rgan.", max_length=120),
                ),
                (
                    'headline_line2',
                    models.CharField(
                        default='Har kuni darajangni oshir.',
                        max_length=120,
                    ),
                ),
                (
                    'description',
                    models.TextField(
                        default=(
                            "9–11 sinf uchun majburiy fanlar — Matematika, Ingliz, "
                            "Fanlar, Mantiq — qisqa, qiziqarli o'yin-darslar."
                        ),
                    ),
                ),
                (
                    'primary_button_text',
                    models.CharField(default='Bepul boshlash', max_length=40),
                ),
                (
                    'secondary_button_text',
                    models.CharField(
                        default="Demo bilan kirib ko'rish",
                        max_length=40,
                    ),
                ),
                ('active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Hero kontenti',
                'verbose_name_plural': 'Hero kontenti',
            },
        ),
        migrations.CreateModel(
            name='SiteSetting',
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
                ('site_name', models.CharField(default='MF Platform', max_length=120)),
                (
                    'tagline',
                    models.CharField(
                        blank=True,
                        default="Ta'limni o'yin darajasiga olib chiqamiz",
                        max_length=200,
                    ),
                ),
                (
                    'contact_email',
                    models.EmailField(default='info@mfplatform.uz', max_length=254),
                ),
                (
                    'contact_phone',
                    models.CharField(
                        blank=True,
                        default='+998 90 123 45 67',
                        max_length=40,
                    ),
                ),
                ('website_url', models.URLField(default='https://mfplatform.uz')),
                (
                    'telegram',
                    models.CharField(
                        blank=True,
                        default='@mfplatform_uz',
                        max_length=80,
                    ),
                ),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Sayt sozlamasi',
                'verbose_name_plural': 'Sayt sozlamasi',
            },
        ),
        migrations.CreateModel(
            name='Testimonial',
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
                ('region', models.CharField(blank=True, max_length=80)),
                (
                    'avatar_color',
                    models.CharField(default='#a5b4fc', max_length=8),
                ),
                ('quote', models.TextField()),
                ('rating', models.PositiveSmallIntegerField(default=5)),
                ('sort_order', models.PositiveIntegerField(default=100)),
                ('active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Foydalanuvchi sharhi',
                'verbose_name_plural': 'Foydalanuvchi sharhlari',
                'ordering': ['sort_order'],
            },
        ),
    ]

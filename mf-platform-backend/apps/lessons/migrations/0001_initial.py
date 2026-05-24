"""Lessons app boshlang'ich migratsiyasi."""
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Lesson va LessonCompletion jadvallarini yaratadi."""

    initial = True

    dependencies = [
        ('subjects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Lesson',
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
                ('duration_min', models.PositiveSmallIntegerField(default=10)),
                (
                    'level',
                    models.CharField(
                        choices=[
                            ('basic', 'Boshlangʻich'),
                            ('mid', 'Oʻrta'),
                            ('high', 'Yuqori'),
                        ],
                        default='mid',
                        max_length=20,
                    ),
                ),
                ('summary', models.TextField(blank=True)),
                ('content', models.JSONField(default=list)),
                ('xp', models.PositiveSmallIntegerField(default=30)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'subject',
                    models.ForeignKey(
                        on_delete=models.deletion.PROTECT,
                        related_name='lessons',
                        to='subjects.subject',
                    ),
                ),
            ],
            options={
                'ordering': ['subject_id', 'order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='LessonCompletion',
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
                ('completed_at', models.DateTimeField(auto_now_add=True)),
                (
                    'lesson',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='completions',
                        to='lessons.lesson',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='lesson_completions',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-completed_at'],
                'unique_together': {('user', 'lesson')},
            },
        ),
    ]

"""Teams app boshlang'ich migratsiyasi."""
import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """Team va TeamMembership jadvallarini yaratadi."""

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Team',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('color', models.CharField(default='#4F3CC9', max_length=9)),
                ('max_members', models.PositiveSmallIntegerField(default=20)),
                ('is_open', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'captain',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name='captained_teams',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TeamMembership',
            fields=[
                (
                    'id',
                    models.AutoField(
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('weekly_xp', models.PositiveIntegerField(default=0)),
                (
                    'team',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='memberships',
                        to='teams.team',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name='team_memberships',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ['-joined_at'],
                'unique_together': {('team', 'user')},
            },
        ),
    ]

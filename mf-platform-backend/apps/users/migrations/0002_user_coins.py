"""Add `coins` valyuta field to User.

Frontend `User.coins` bilan parallel — har 10 XP -> 1 coin nisbati
`apps.gamification.services.award_xp` ichida hisoblanadi.

Qo'lda yozilgan (venv yo'q), 0001_initial'dan keyin keladi.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='coins',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

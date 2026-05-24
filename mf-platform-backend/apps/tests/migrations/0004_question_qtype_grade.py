"""Question modeliga qtype/correct_text/grade/points qo'shish."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0003_test_topic'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='qtype',
            field=models.CharField(
                choices=[
                    ('choice', 'Multiple Choice'),
                    ('fill', 'Fill in the Blank'),
                    ('speech', 'Speech / Tushuntirish'),
                ],
                default='choice',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='correct_text',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='question',
            name='grade',
            field=models.PositiveSmallIntegerField(default=9),
        ),
        migrations.AddField(
            model_name='question',
            name='points',
            field=models.PositiveSmallIntegerField(default=10),
        ),
        migrations.AlterField(
            model_name='question',
            name='correct_index',
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]

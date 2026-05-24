"""Tests app — Test modeliga ``topic`` ForeignKey qo'shadi.

Mavzuli testlar uchun (``subjects.Topic`` bilan bog'lanish).
"""
from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Test.topic maydonini qo'shish."""

    dependencies = [
        ('tests', '0002_alter_option_id_alter_question_id_and_more'),
        ('subjects', '0002_topic'),
    ]

    operations = [
        migrations.AddField(
            model_name='test',
            name='topic',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tests',
                to='subjects.topic',
            ),
        ),
    ]

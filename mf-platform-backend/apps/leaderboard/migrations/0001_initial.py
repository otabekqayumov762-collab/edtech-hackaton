"""Initial (no-op) migration for the ``leaderboard`` app.

The leaderboard owns no models — this migration exists solely to mark the
app as migrated and unblock ``makemigrations``/``migrate`` discovery.
"""
from __future__ import annotations

from django.db import migrations


class Migration(migrations.Migration):
    """No-op initial migration; the app has no tables of its own."""

    initial = True

    dependencies: list = []

    operations: list = []

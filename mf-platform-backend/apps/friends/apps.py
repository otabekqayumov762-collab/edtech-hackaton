"""AppConfig for the ``friends`` app."""
from __future__ import annotations

from django.apps import AppConfig


class FriendsConfig(AppConfig):
    """Configuration for the friends + competition app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.friends'
    label = 'friends'

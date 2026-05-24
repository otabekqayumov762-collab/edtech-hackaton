"""AppConfig for the ``ai_assistant`` app."""
from __future__ import annotations

from django.apps import AppConfig


class AiAssistantConfig(AppConfig):
    """Configuration for the AI assistant proxy app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_assistant'
    label = 'ai_assistant'

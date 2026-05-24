"""Models for the ``ai_assistant`` app — chat sessions and messages.

Defines two models:

* :class:`ChatSession` — a single AI chat conversation owned by a user.
* :class:`ChatMessage` — a single message within a session, either from
  the user or the AI.
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class ChatSession(models.Model):
    """A single AI chat conversation owned by one user.

    Sessions are append-only — messages are added via
    :class:`ChatMessage`. The ``id`` is a UUID so that frontends can
    safely reference a session in URLs.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'ChatSession<{self.id}> user={self.user_id}'


class ChatMessage(models.Model):
    """A single message within a :class:`ChatSession`.

    ``role`` distinguishes user input from AI replies. Messages are
    ordered by ``created_at`` so iterating ``session.messages.all()``
    returns the conversation in chronological order.
    """

    ROLE_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=8, choices=ROLE_CHOICES)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'ChatMessage<{self.pk}> {self.role} session={self.session_id}'

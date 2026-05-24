"""Serializers for the ``ai_assistant`` app."""
from __future__ import annotations

from rest_framework import serializers

from .models import ChatMessage, ChatSession


class ChatMessageSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`ChatMessage`."""

    class Meta:
        model = ChatMessage
        fields = ('role', 'text', 'created_at')
        read_only_fields = fields


class ChatSessionSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`ChatSession` with nested messages."""

    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ('id', 'started_at', 'messages')
        read_only_fields = fields


class AskSerializer(serializers.Serializer):
    """Input serializer for the ``/ask/`` endpoint.

    Accepts an optional ``session_id`` (UUID of an existing session
    belonging to the user) and a required ``text`` payload. The view
    returns the persisted user/AI messages.
    """

    session_id = serializers.UUIDField(required=False, allow_null=True)
    text = serializers.CharField(max_length=4000)

    def validate_text(self, value: str) -> str:
        """Reject blank/whitespace-only input."""
        stripped = (value or '').strip()
        if not stripped:
            raise serializers.ValidationError('Matn bo‘sh bo‘lishi mumkin emas.')
        return stripped

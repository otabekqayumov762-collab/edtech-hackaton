"""Serializers for the ``flashcards`` app.

Shapes are aligned with the frontend ``FlashCard`` and ``FlashTopic``
interfaces in ``src/lib/types.ts`` so the React side can consume the
API without a translation layer.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import FlashCard, FlashTopic


class FlashCardSerializer(serializers.ModelSerializer):
    """Serialize a single :class:`FlashCard`."""

    topic_id = serializers.CharField(read_only=True)

    class Meta:
        model = FlashCard
        fields = ('id', 'topic_id', 'front', 'back', 'hint', 'order')
        read_only_fields = fields


class FlashTopicListSerializer(serializers.ModelSerializer):
    """Lightweight :class:`FlashTopic` representation for list views.

    Cards are not embedded here — clients fetch the detail endpoint to
    pull in the full deck.
    """

    subject = serializers.SlugRelatedField(slug_field='id', read_only=True)
    card_count = serializers.IntegerField(read_only=True)
    cards = FlashCardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashTopic
        fields = ('id', 'subject', 'title', 'desc', 'card_count', 'cards')
        read_only_fields = fields


class FlashTopicDetailSerializer(FlashTopicListSerializer):
    """Detail :class:`FlashTopic` representation with embedded cards."""


class FlashSessionSerializer(serializers.Serializer):
    """Input payload for the ``/finish/`` endpoint.

    Accepts the topic id alongside the two id lists; the view derives
    XP and persistence from the parsed data.
    """

    topic_id = serializers.SlugField(max_length=40)
    known_card_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
    )
    unknown_card_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
    )

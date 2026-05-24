"""Views for the ``flashcards`` app.

Read-only catalogue (topics + nested cards) for the frontend plus a
single write endpoint used when the user submits the result of a flash
review session.
"""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.services import award_xp

from .models import FlashSession, FlashTopic
from .serializers import (
    FlashSessionSerializer,
    FlashTopicDetailSerializer,
    FlashTopicListSerializer,
)


class FlashTopicViewSet(viewsets.ReadOnlyModelViewSet):
    """Public catalogue of flash-card topics.

    * ``GET /api/v1/flashcards/`` — list active topics. Supports
      ``?subject=<slug>`` filtering.
    * ``GET /api/v1/flashcards/<id>/`` — retrieve a topic with its
      cards embedded.
    """

    permission_classes = (permissions.AllowAny,)
    pagination_class = None
    lookup_field = 'pk'

    def get_queryset(self):
        """Return active topics, optionally filtered by ``?subject=``."""
        qs = (
            FlashTopic.objects.filter(is_active=True)
            .select_related('subject')
            .prefetch_related('cards')
        )
        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject_id=subject)
        return qs.order_by('order', 'title')

    def get_serializer_class(self):
        """Embed cards only on the detail view."""
        if self.action == 'retrieve':
            return FlashTopicDetailSerializer
        return FlashTopicListSerializer


class FlashSessionFinishView(APIView):
    """Submit the result of a flash-card review session.

    POST ``/api/v1/flashcards/finish/``::

        {
          "topic_id": "algebra-formulalari",
          "known_card_ids": [1, 2, 3],
          "unknown_card_ids": [4, 5]
        }

    XP formula: ``len(known) * 3 + (10 if no unknown else 0)`` capped at
    ``80``. On success the user's total XP and ``daily_done`` counter
    are bumped and a :class:`FlashSession` row is persisted.
    """

    permission_classes = (permissions.IsAuthenticated,)

    XP_PER_KNOWN = 3
    PERFECT_BONUS = 10
    MAX_XP = 80

    def post(self, request, *args, **kwargs) -> Response:
        """Validate the payload, compute XP, persist session, return summary."""
        serializer = FlashSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        topic = get_object_or_404(FlashTopic, pk=data['topic_id'])

        known_ids = list({int(i) for i in data['known_card_ids']})
        unknown_ids = list({int(i) for i in data['unknown_card_ids']})

        known_count = len(known_ids)
        unknown_count = len(unknown_ids)
        total = known_count + unknown_count

        xp = known_count * self.XP_PER_KNOWN
        if unknown_count == 0 and known_count > 0:
            xp += self.PERFECT_BONUS
        xp = min(xp, self.MAX_XP)

        with transaction.atomic():
            user = request.user
            award_xp(user, xp, reason='flash_session')

            FlashSession.objects.create(
                user=user,
                topic=topic,
                known_count=known_count,
                unknown_count=unknown_count,
                xp_earned=xp,
                finished_at=timezone.now(),
            )

        return Response(
            {
                'xp_earned': xp,
                'known': known_count,
                'unknown': unknown_count,
                'total': total,
            }
        )

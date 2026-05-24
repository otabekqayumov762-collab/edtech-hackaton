"""Views for the ``gamification`` app.

Endpoints:

* ``GET /api/v1/gamification/achievements/`` — public list of the
  Achievement catalog.
* ``GET /api/v1/gamification/me/achievements/`` — authenticated. Returns
  every catalog achievement with ``unlocked`` flag and the user's
  current value for the matching metric (mirrors the frontend
  ``locked / unlocked`` split).
* ``GET /api/v1/gamification/me/xp-log/`` — authenticated. Paginated
  reverse-chronological XP transaction log.
"""
from __future__ import annotations

from typing import Any, Dict, List

from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Achievement, UserAchievement, XpLog
from .serializers import (
    AchievementSerializer,
    XpLogSerializer,
)
from .services import compute_metric_value


class AchievementListView(generics.ListAPIView):
    """Public read-only list of all catalog achievements, ordered by ``order``."""

    serializer_class = AchievementSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None

    def get_queryset(self):
        """Return the full :class:`Achievement` catalog ordered for the UI."""

        return Achievement.objects.all().order_by('order', 'id')


class MyAchievementsView(generics.ListAPIView):
    """Per-user achievement status list (locked + unlocked).

    Returns a flat list of objects shaped as::

        {"achievement": {...}, "unlocked": bool, "current": int}

    where ``current`` is the user's live value for the achievement's
    metric (XP, streak, completed tests, ...).
    """

    serializer_class = AchievementSerializer  # documentation hint
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Build the ``{achievement, unlocked, current}`` payload."""

        user = request.user
        unlocked_ids = set(
            UserAchievement.objects.filter(user=user).values_list(
                'achievement_id',
                flat=True,
            )
        )
        achievements = Achievement.objects.all().order_by('order', 'id')
        payload: List[Dict[str, Any]] = []
        for achievement in achievements:
            current = compute_metric_value(user, achievement.metric)
            payload.append(
                {
                    'achievement': AchievementSerializer(achievement).data,
                    'unlocked': achievement.id in unlocked_ids,
                    'current': current,
                }
            )
        return Response(payload)


class MyXpLogView(generics.ListAPIView):
    """Paginated XP transaction history for the authenticated user."""

    serializer_class = XpLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        """Return the requesting user's XP log, newest first."""

        return XpLog.objects.filter(user=self.request.user)

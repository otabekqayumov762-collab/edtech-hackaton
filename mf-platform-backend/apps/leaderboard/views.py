"""Read-only ranking endpoints for the ``leaderboard`` app.

Three views are exposed:

* :class:`GlobalLeaderboardView` — paginated public list ordered by XP.
* :class:`WeeklyLeaderboardView` — top 50 users by weekly XP earned.
* :class:`MyRankView` — the request user's current global rank.
"""
from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from .serializers import LeaderEntrySerializer
from .services import level_from_xp, weekly_xp

User = get_user_model()


def _weekly_xp_bulk(user_ids: list) -> dict:
    """Bitta query bilan har bir user uchun haftalik XP yig'indisini qaytaradi.

    Returns: ``{user_id: int}``. XpLog mavjud bo'lmasa bo'sh dict.
    """
    try:
        from apps.gamification.models import XpLog  # type: ignore
    except Exception:
        return {}
    if not user_ids:
        return {}
    since = timezone.now() - timedelta(days=7)
    rows = (
        XpLog.objects.filter(user_id__in=user_ids, created_at__gte=since)
        .values('user_id')
        .annotate(total=Sum('amount'))
    )
    return {row['user_id']: int(row['total'] or 0) for row in rows}


def _current_user_id(request: Request) -> str | None:
    """Return the request user's id when authenticated, else ``None``."""
    user = getattr(request, 'user', None)
    if user is None or not getattr(user, 'is_authenticated', False):
        return None
    return str(getattr(user, 'id', '') or '') or None


class GlobalLeaderboardView(ListAPIView):
    """``GET /api/v1/leaderboard/`` — global ranking by lifetime XP.

    Public endpoint (``AllowAny``). Uses the project's default paginator
    so clients can page through the full ladder with ``?page=`` and
    ``?page_size=``. Rows are ordered by descending ``xp`` (ties broken
    by name for stability).
    """

    serializer_class = LeaderEntrySerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None

    def get_queryset(self):
        """Active users ordered by XP descending, then name."""
        return (
            User.objects.filter(is_active=True)
            .only('id', 'name', 'xp', 'streak', 'region', 'avatar_color')
            .order_by('-xp', 'name')
        )

    def get_serializer_context(self) -> dict[str, Any]:
        """Inject the current user's id so rows can be flagged."""
        ctx = super().get_serializer_context()
        ctx['current_user_id'] = _current_user_id(self.request)
        return ctx


class WeeklyLeaderboardView(APIView):
    """``GET /api/v1/leaderboard/weekly/`` — top 50 by last-7-days XP.

    Public endpoint. Computes :func:`weekly_xp` for a candidate pool of
    the top XP users, sorts the result by weekly score, trims to 50, and
    ensures the request user appears in the response (inserted at the
    end and marked ``is_current=True`` if they would otherwise be
    missing).
    """

    permission_classes = (permissions.AllowAny,)
    LIMIT = 50
    POOL = 200

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Return the weekly ranking as a flat list of leader entries."""
        pool = list(
            User.objects.filter(is_active=True)
            .only('id', 'name', 'xp', 'streak', 'region', 'avatar_color')
            .order_by('-xp', 'name')[: self.POOL]
        )

        current_id = _current_user_id(request)
        # N+1 oldini olish: bitta query bilan barcha user'lar uchun XpLog total.
        weekly_map = _weekly_xp_bulk([u.id for u in pool])
        scored: list[SimpleNamespace] = []
        for u in pool:
            week_xp = weekly_map.get(u.id)
            if week_xp is None:
                # XpLog yo'q yoki user uchun yozuv yo'q — fallback.
                week_xp = int(getattr(u, 'xp', 0) or 0) // 4
            scored.append(
                SimpleNamespace(
                    id=u.id,
                    name=u.name,
                    xp=week_xp,
                    streak=u.streak,
                    region=u.region,
                    avatar_color=u.avatar_color,
                    is_current=(current_id is not None and str(u.id) == current_id),
                )
            )

        scored.sort(key=lambda row: (-row.xp, row.name))
        top = scored[: self.LIMIT]

        # Make sure the request user is represented even if they fell
        # outside the trimmed pool/top-50.
        if current_id and not any(row.is_current for row in top):
            me = getattr(request, 'user', None)
            if me is not None and getattr(me, 'is_authenticated', False):
                top.append(
                    SimpleNamespace(
                        id=me.id,
                        name=getattr(me, 'name', '') or '',
                        xp=weekly_xp(me),
                        streak=getattr(me, 'streak', 0) or 0,
                        region=getattr(me, 'region', '') or '',
                        avatar_color=getattr(me, 'avatar_color', '') or '',
                        is_current=True,
                    )
                )

        serializer = LeaderEntrySerializer(
            top,
            many=True,
            context={'current_user_id': current_id},
        )
        return Response(serializer.data)


class MyRankView(APIView):
    """``GET /api/v1/leaderboard/me/`` — request user's global standing.

    Returns ``{rank, total_users, xp, level}``. Rank is computed as the
    number of active users with strictly greater XP than the request
    user, plus one — so the top scorer ranks ``#1``.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Return the authenticated user's rank summary."""
        user = request.user
        xp = int(getattr(user, 'xp', 0) or 0)

        ahead = User.objects.filter(is_active=True, xp__gt=xp).count()
        total_users = User.objects.filter(is_active=True).count()
        rank = ahead + 1

        return Response(
            {
                'rank': rank,
                'total_users': total_users,
                'xp': xp,
                'level': level_from_xp(xp),
            }
        )

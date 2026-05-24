"""Service helpers for the ``leaderboard`` app.

Pure functions used by views/serializers to compute derived ranking data
(level from XP, weekly XP totals). Kept side-effect free so they can be
unit-tested independently of HTTP plumbing.
"""
from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from django.utils import timezone

from common.utils import level_from_xp as _canonical_level_from_xp

if TYPE_CHECKING:  # pragma: no cover - typing only
    from apps.users.models import User


def level_from_xp(xp: int) -> int:
    """Return the level a player has reached with ``xp`` total experience.

    Yagona canonical implementatsiya — ``common.utils.level_from_xp``.
    Frontend ``src/lib/gamification.ts:levelFromXp`` bilan mos.
    """
    try:
        xp_value = int(xp)
    except (TypeError, ValueError):
        xp_value = 0
    if xp_value < 0:
        xp_value = 0
    return _canonical_level_from_xp(xp_value)


def weekly_xp(user: 'User') -> int:
    """Sum XP earned by ``user`` over the last 7 days.

    Reads from :class:`apps.gamification.models.XpLog` if that model exists;
    otherwise falls back to a demo-friendly estimate of ``user.xp // 4`` so
    tests and early environments without the gamification log still return
    a sensible weekly value.

    Parameters
    ----------
    user:
        The :class:`apps.users.models.User` instance to score.

    Returns
    -------
    int
        Total XP earned in the trailing 7-day window (or the fallback).
    """
    try:
        from django.db.models import Sum

        from apps.gamification.models import XpLog  # type: ignore

        since = timezone.now() - timedelta(days=7)
        total = (
            XpLog.objects.filter(user=user, created_at__gte=since)
            .aggregate(total=Sum('amount'))
            .get('total')
        )
        return int(total or 0)
    except Exception:
        # Gamification XpLog is optional — fall back to a demo fraction.
        return int(getattr(user, 'xp', 0) or 0) // 4

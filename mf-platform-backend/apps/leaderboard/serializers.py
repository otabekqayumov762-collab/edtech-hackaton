"""Serializers for the ``leaderboard`` app.

Shapes the :class:`apps.users.models.User` rows into the ``LeaderUser``
contract expected by the frontend (see ``src/lib/types.ts``).
"""
from __future__ import annotations

from rest_framework import serializers

from .services import level_from_xp


class LeaderEntrySerializer(serializers.Serializer):
    """Serialize a user as a leaderboard row.

    Matches the frontend ``LeaderUser`` interface — ``id`` is the UUID
    rendered as a string, ``level`` is computed from ``xp`` and
    ``is_current`` defaults to ``False``; the view flips it on for the
    request user when relevant.
    """

    id = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)
    xp = serializers.IntegerField(read_only=True)
    level = serializers.SerializerMethodField()
    streak = serializers.IntegerField(read_only=True)
    region = serializers.CharField(read_only=True)
    avatar_color = serializers.CharField(read_only=True)
    is_current = serializers.SerializerMethodField()

    def get_id(self, obj) -> str:
        """Return the user's UUID primary key as a string."""
        return str(getattr(obj, 'id', '') or '')

    def get_level(self, obj) -> int:
        """Compute level from the user's accumulated XP."""
        return level_from_xp(int(getattr(obj, 'xp', 0) or 0))

    def get_is_current(self, obj) -> bool:
        """Mark the row belonging to the request user.

        The view supplies ``current_user_id`` via serializer context; any
        object exposing ``is_current=True`` (e.g. a synthesized weekly
        row) also wins. Defaults to ``False`` when neither applies.
        """
        flag = getattr(obj, 'is_current', None)
        if flag is not None:
            return bool(flag)
        current_id = (self.context or {}).get('current_user_id')
        if current_id is None:
            return False
        return str(getattr(obj, 'id', '')) == str(current_id)

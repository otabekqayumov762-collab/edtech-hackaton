"""Serializers for the ``gamification`` app.

Shapes mirror the frontend ``Achievement`` interface defined in
``src/lib/types.ts``. ``UserAchievementSerializer`` nests the related
:class:`Achievement` payload alongside its ``unlocked_at`` timestamp.
``XpLogSerializer`` exposes minimal fields needed for the XP history UI.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Achievement, UserAchievement, XpLog


class AchievementSerializer(serializers.ModelSerializer):
    """Serialize :class:`Achievement` for catalog endpoints.

    Mirrors the frontend ``Achievement`` interface fields.
    """

    class Meta:
        model = Achievement
        fields = (
            'id',
            'title',
            'description',
            'icon',
            'color',
            'metric',
            'requirement',
        )
        read_only_fields = fields


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serialize a :class:`UserAchievement` with its nested catalog entry."""

    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ('achievement', 'unlocked_at')
        read_only_fields = fields


class XpLogSerializer(serializers.ModelSerializer):
    """Serialize a single :class:`XpLog` row for the XP history list."""

    class Meta:
        model = XpLog
        fields = ('amount', 'reason', 'created_at')
        read_only_fields = fields

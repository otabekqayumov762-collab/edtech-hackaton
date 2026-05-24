"""DRF serializers for the ``friends`` app."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Challenge, Friendship, WinStreak


User = get_user_model()


class MinimalUserSerializer(serializers.ModelSerializer):
    """Do'st/raqib uchun qisqacha foydalanuvchi ma'lumotlari."""

    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar_color', 'xp', 'level', 'streak']

    def get_level(self, obj) -> int:
        from common.utils import level_from_xp

        return level_from_xp(obj.xp)


class FriendshipSerializer(serializers.ModelSerializer):
    """Do'stlik so'rovi shakli."""

    from_user = MinimalUserSerializer(read_only=True)
    to_user = MinimalUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at', 'accepted_at']


class ChallengeSerializer(serializers.ModelSerializer):
    """Challenge ma'lumotlari ikki ishtirokchi bilan."""

    challenger = MinimalUserSerializer(read_only=True)
    opponent = MinimalUserSerializer(read_only=True)

    class Meta:
        model = Challenge
        fields = '__all__'


class WinStreakSerializer(serializers.ModelSerializer):
    """Foydalanuvchining g'alaba seriyasi."""

    class Meta:
        model = WinStreak
        fields = ['current', 'best', 'updated_at']

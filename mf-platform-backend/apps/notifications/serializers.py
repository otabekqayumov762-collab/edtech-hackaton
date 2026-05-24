"""DRF serializers for the ``notifications`` app."""
from __future__ import annotations

from rest_framework import serializers

from .models import Notification, UserNotificationPrefs


class NotificationSerializer(serializers.ModelSerializer):
    """Foydalanuvchiga qaytariladigan notification shakli."""

    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'body',
            'source',
            'sent_at',
            'read_at',
            'created_at',
            'createdAt',
            'read',
        ]
        read_only_fields = fields

    def get_read(self, obj: Notification) -> bool:
        return obj.read_at is not None


class PrefsSerializer(serializers.ModelSerializer):
    """Foydalanuvchi push sozlamalari."""

    class Meta:
        model = UserNotificationPrefs
        fields = [
            'push_enabled',
            'morning_enabled',
            'day_enabled',
            'evening_enabled',
            'quiet_start',
            'quiet_end',
            'last_comeback_sent',
        ]
        read_only_fields = ['last_comeback_sent']

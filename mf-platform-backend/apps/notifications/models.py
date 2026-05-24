"""Notification models — push xabarlar, shablonlar, foydalanuvchi sozlamalari."""
from __future__ import annotations

from datetime import time

from django.conf import settings
from django.db import models


NOTIFICATION_TYPE_CHOICES = [
    ('daily', 'Daily reminder'),
    ('motivation', 'Motivation'),
    ('streak', 'Streak'),
    ('reward', 'Reward'),
    ('comeback', 'Comeback'),
]

NOTIFICATION_SOURCE_CHOICES = [
    ('ai', 'AI'),
    ('template', 'Template'),
]


class Notification(models.Model):
    """Foydalanuvchiga jo'natilgan (yoki jo'natiladigan) yagona xabar."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=16, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=300)
    source = models.CharField(
        max_length=12,
        choices=NOTIFICATION_SOURCE_CHOICES,
        default='template',
    )
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read_at'], name='notif_user_read_idx'),
        ]

    def __str__(self) -> str:
        return f'[{self.type}] {self.title} -> {self.user_id}'


class NotificationTemplate(models.Model):
    """Statik shablon — AI ishlamaganda fallback sifatida ishlatiladi."""

    slug = models.SlugField(max_length=64, unique=True)
    type = models.CharField(max_length=16, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=300)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['type', 'slug']

    def __str__(self) -> str:
        return f'{self.slug} ({self.type})'


class UserNotificationPrefs(models.Model):
    """Foydalanuvchi push sozlamalari — slot'lar va quiet hours."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notif_prefs',
    )
    push_enabled = models.BooleanField(default=True)
    morning_enabled = models.BooleanField(default=True)
    day_enabled = models.BooleanField(default=True)
    evening_enabled = models.BooleanField(default=True)
    quiet_start = models.TimeField(default=time(22, 0))
    quiet_end = models.TimeField(default=time(7, 0))
    last_comeback_sent = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f'prefs<{self.user_id}>'

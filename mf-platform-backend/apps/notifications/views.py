"""Views for the ``notifications`` app."""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, UserNotificationPrefs
from .serializers import NotificationSerializer, PrefsSerializer
from .services import dispatch


ALLOWED_TYPES = {'daily', 'motivation', 'streak', 'reward', 'comeback'}


class SendNotificationView(APIView):
    """``POST /api/v1/notifications/send`` — yangi notification yaratadi.

    Body: ``{"type": "daily|motivation|streak|reward|comeback"}``
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        ntype = (request.data.get('type') or '').strip()
        if ntype not in ALLOWED_TYPES:
            return Response(
                {'detail': f'Invalid type. Allowed: {sorted(ALLOWED_TYPES)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notif = dispatch(request.user, ntype)
        return Response(
            NotificationSerializer(notif).data,
            status=status.HTTP_201_CREATED,
        )


class UserNotificationsView(APIView):
    """``GET /api/v1/notifications/user`` — foydalanuvchi notification'lari.

    Default: oxirgi 30 ta. ``?unread=1`` faqat o'qilmaganlarni qaytaradi.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        qs = Notification.objects.filter(user=request.user)
        unread = request.query_params.get('unread')
        if unread in ('1', 'true', 'True'):
            qs = qs.filter(read_at__isnull=True)
        qs = qs.order_by('-created_at')[:30]
        return Response(NotificationSerializer(qs, many=True).data)


class MarkReadView(APIView):
    """``POST /api/v1/notifications/<pk>/read`` — notification'ni o'qilgan deb belgilash."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        if notif.read_at is None:
            notif.read_at = timezone.now()
            notif.save(update_fields=['read_at'])
        return Response(NotificationSerializer(notif).data)


class PrefsView(APIView):
    """``GET/PUT /api/v1/notifications/prefs`` — foydalanuvchi push sozlamalari."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        prefs, _ = UserNotificationPrefs.objects.get_or_create(user=request.user)
        return Response(PrefsSerializer(prefs).data)

    def put(self, request: Request) -> Response:
        prefs, _ = UserNotificationPrefs.objects.get_or_create(user=request.user)
        serializer = PrefsSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

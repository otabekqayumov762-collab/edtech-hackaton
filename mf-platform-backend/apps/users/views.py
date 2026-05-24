"""Auth view'lari — register, login, refresh (default), me."""
from __future__ import annotations

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.throttling import LoginRateThrottle

from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
    tokens_for_user,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — yangi user yaratadi va JWT qaytaradi."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'user': UserSerializer(user).data,
                **tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/v1/auth/login/ — email+parolni tekshiradi, JWT qaytaradi."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        return Response(
            {
                'user': UserSerializer(user).data,
                **tokens_for_user(user),
            }
        )


class MeView(APIView):
    """GET/PATCH /api/v1/auth/me/ — joriy foydalanuvchi profili."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Har safar profil so‘ralganda kunlik counterlarni yangilaymiz.
        request.user.touch_daily()
        request.user.save(update_fields=['daily_done', 'daily_done_date',
                                          'lives', 'lives_reset_date'])
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

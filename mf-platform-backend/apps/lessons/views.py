"""Lessons app view'lari — ro'yxat, batafsil va tugatish endpointlari."""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.gamification.services import award_xp

from .models import Lesson, LessonCompletion
from .serializers import LessonDetailSerializer, LessonListSerializer


class LessonViewSet(ReadOnlyModelViewSet):
    """Faqat o'qish uchun ViewSet — `?subject=<slug>` orqali filtr, sarlavha bo'yicha qidiruv."""

    queryset = Lesson.objects.filter(is_active=True).select_related('subject')
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']

    def get_queryset(self):
        """Subject slug bo'yicha filter qo'shadi."""
        qs = super().get_queryset()
        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject_id=subject)
        return qs

    def get_serializer_class(self):
        """List uchun qisqa, detail uchun to'liq serializer."""
        if self.action == 'retrieve':
            return LessonDetailSerializer
        return LessonListSerializer


class LessonCompleteView(APIView):
    """Darsni tugatish: XP qo'shadi va kunlik hisoblagichni oshiradi.

    POST body: ``{"lesson_id": "<slug>"}``.

    Idempotent — agar foydalanuvchi avval tugatgan bo'lsa,
    ``xp_gained: 0`` qaytaradi va hech narsani o'zgartirmaydi.
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs) -> Response:
        """Darsni tugatish so'rovini bajaradi."""
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response(
                {'detail': 'lesson_id majburiy.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lesson = get_object_or_404(Lesson, pk=lesson_id, is_active=True)
        user = request.user

        completion, created = LessonCompletion.objects.get_or_create(
            user=user, lesson=lesson
        )

        if not created:
            return Response(
                {
                    'ok': True,
                    'xp_earned': 0,
                    'total_xp': user.xp,
                    'lesson_id': lesson.id,
                    'xp_gained': 0,
                    'completed': True,
                },
                status=status.HTTP_200_OK,
            )

        # XP berish + streak + XpLog + achievements — yagona quvur.
        xp_earned, unlocked = award_xp(user, lesson.xp, reason='lesson_complete')

        return Response(
            {
                'ok': True,
                'xp_earned': xp_earned,
                'total_xp': user.xp,
                'lesson_id': lesson.id,
                'xp_gained': xp_earned,
                'completed': True,
                'unlocked_achievements': [u.achievement_id for u in unlocked],
            },
            status=status.HTTP_201_CREATED,
        )

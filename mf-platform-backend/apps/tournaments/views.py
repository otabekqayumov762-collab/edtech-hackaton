"""Tournaments app view'lari.

Endpointlar:
    * ``GET  /api/v1/tournaments/``                    — faol turnirlar ro'yxati.
    * ``GET  /api/v1/tournaments/<id>/``                — turnir tafsiloti.
    * ``POST /api/v1/tournaments/<id>/join/``           — turnirga qo'shilish.
    * ``GET  /api/v1/tournaments/<id>/leaderboard/``    — top 50 ishtirokchi.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Participation, Tournament
from .serializers import (
    ParticipationSerializer,
    TournamentDetailSerializer,
    TournamentListSerializer,
)


class TournamentViewSet(ReadOnlyModelViewSet):
    """Faol turnirlar uchun faqat o'qish ViewSet.

    * ``GET /api/v1/tournaments/``      — faol turnirlar (ixcham shakl).
    * ``GET /api/v1/tournaments/<id>/`` — bitta turnir (to'liq shakl).
    """

    permission_classes = (permissions.AllowAny,)
    queryset = Tournament.objects.filter(is_active=True).prefetch_related(
        'top_prizes', 'participations'
    )
    lookup_field = 'pk'

    def get_queryset(self):
        """Faqat faol turnirlarni qaytaradi, ``-starts_at`` bo'yicha tartiblangan."""
        return (
            Tournament.objects.filter(is_active=True)
            .prefetch_related('top_prizes', 'participations')
            .order_by('-starts_at')
        )

    def get_serializer_class(self):
        """List uchun ixcham, retrieve uchun to'liq serializer."""
        if self.action == 'retrieve':
            return TournamentDetailSerializer
        return TournamentListSerializer


class JoinTournamentView(APIView):
    """Foydalanuvchini turnirga qo'shadi.

    ``POST /api/v1/tournaments/<tournament_id>/join/``

    Idempotent — agar foydalanuvchi avval qo'shilgan bo'lsa, mavjud
    yozuv qaytariladi (``200 OK``), aks holda yangi yozuv yaratiladi
    (``201 CREATED``).
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, tournament_id: str, *args, **kwargs) -> Response:
        """Qatnashish yozuvini yaratadi yoki mavjudini qaytaradi.

        Turnir oynasi (`starts_at` .. `ends_at`) tashqarisida qo'shilishga
        urinish 400 bilan rad etiladi.
        """
        tournament = get_object_or_404(
            Tournament, pk=tournament_id, is_active=True
        )
        now = timezone.now()
        if now < tournament.starts_at:
            return Response(
                {'detail': 'Turnir hali boshlanmagan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if now > tournament.ends_at:
            return Response(
                {'detail': 'Turnir yakunlangan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        participation, created = Participation.objects.get_or_create(
            tournament=tournament,
            user=request.user,
        )
        serializer = ParticipationSerializer(participation)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class TournamentLeaderboardView(APIView):
    """Turnirning top 50 ishtirokchisini qaytaradi.

    ``GET /api/v1/tournaments/<tournament_id>/leaderboard/``

    Ishtirokchilar ``tournament_xp`` bo'yicha kamayish tartibida tartiblanadi.
    """

    permission_classes = (permissions.AllowAny,)

    def get(self, request, tournament_id: str, *args, **kwargs) -> Response:
        """Top 50 yozuvni qaytaradi."""
        tournament = get_object_or_404(
            Tournament, pk=tournament_id, is_active=True
        )
        participations = list(
            tournament.participations
            .select_related('user')
            .order_by('-tournament_xp', 'joined_at')[:50]
        )
        # Rank'lar local order'dan derive — N+1 oldini olish.
        ranks_by_id = {p.pk: idx + 1 for idx, p in enumerate(participations)}
        serializer = ParticipationSerializer(
            participations,
            many=True,
            context={'ranks_by_id': ranks_by_id},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

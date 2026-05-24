"""Teams app view'lari — jamoa ro'yxati, batafsil, yaratish, qo'shilish va chiqish."""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Team, TeamMembership
from .serializers import (
    JoinTeamSerializer,
    TeamCreateSerializer,
    TeamDetailSerializer,
    TeamListSerializer,
    TeamMembershipNestedSerializer,
)


class TeamViewSet(ModelViewSet):
    """Jamoa CRUD.

    - ``list``/``retrieve`` — barchaga ochiq.
    - ``create`` — autentifikatsiyalangan foydalanuvchi yangi jamoa yaratadi
      va avtomatik kapitan + a'zo bo'lib qoladi.
    - ``update``/``destroy`` — faqat kapitan o'zgartira oladi.
    """

    queryset = Team.objects.all().select_related('captain').prefetch_related('memberships__user')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']

    def get_permissions(self):
        """Ko'rish ochiq, qolgan amallar autentifikatsiya talab qiladi."""
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        """Amal turiga qarab to'g'ri serializerni qaytaradi."""
        if self.action == 'list':
            return TeamListSerializer
        if self.action == 'create':
            return TeamCreateSerializer
        return TeamDetailSerializer

    @transaction.atomic
    def create(self, request: Request, *args, **kwargs) -> Response:
        """Yangi jamoa yaratadi.

        Foydalanuvchi avval boshqa jamoada bo'lmasligi kerak.
        """
        if TeamMembership.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Siz allaqachon jamoadasiz. Avval undan chiqing.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = serializer.save()
        detail = TeamDetailSerializer(team, context=self.get_serializer_context())
        return Response(detail.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer) -> None:
        """Faqat kapitan tahrirlay oladi."""
        team: Team = self.get_object()
        if team.captain_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('Faqat kapitan jamoani tahrirlay oladi.')
        serializer.save()

    def perform_destroy(self, instance: Team) -> None:
        """Faqat kapitan jamoani o'chira oladi."""
        if instance.captain_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied('Faqat kapitan jamoani o\'chira oladi.')
        instance.delete()


class JoinTeamView(APIView):
    """Jamoaga qo'shilish — ``POST /api/v1/teams/<id>/join/``.

    Talablar:
        * Jamoa ochiq (``is_open=True``) bo'lishi shart.
        * Jamoa to'lmagan bo'lishi shart (``members_count < max_members``).
        * Foydalanuvchi avvaldan boshqa jamoada bo'lmasligi kerak.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JoinTeamSerializer

    @transaction.atomic
    def post(self, request: Request, pk: str, *args, **kwargs) -> Response:
        """Foydalanuvchini berilgan jamoaga qo'shadi."""
        team = get_object_or_404(Team.objects.select_for_update(), pk=pk)

        if not team.is_open:
            return Response(
                {'detail': 'Jamoa yopiq.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if TeamMembership.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Siz allaqachon jamoadasiz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # member count tekshiruvi atomik tranzaksiya ichida.
        if team.memberships.count() >= team.max_members:
            return Response(
                {'detail': 'Jamoa to\'lgan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership = TeamMembership.objects.create(team=team, user=request.user)
        data = TeamMembershipNestedSerializer(membership).data
        return Response(data, status=status.HTTP_201_CREATED)


class LeaveTeamView(APIView):
    """Jamoadan chiqish — ``POST /api/v1/teams/<id>/leave/``.

    Agar foydalanuvchi kapitan bo'lsa, kapitanlik keyingi a'zoga o'tadi;
    agar boshqa a'zo qolmagan bo'lsa, jamoa butunlay o'chiriladi.
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, pk: str, *args, **kwargs) -> Response:
        """Foydalanuvchini jamoadan chiqaradi."""
        team = get_object_or_404(Team.objects.select_for_update(), pk=pk)
        membership = TeamMembership.objects.filter(
            team=team, user=request.user
        ).first()
        if membership is None:
            return Response(
                {'detail': 'Siz bu jamoaning a\'zosi emassiz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_captain = team.captain_id == request.user.id
        membership.delete()

        if was_captain:
            next_member = (
                team.memberships.exclude(user=request.user)
                .order_by('joined_at')
                .first()
            )
            if next_member is None:
                # Boshqa a'zo yo'q — jamoani o'chiramiz.
                team.delete()
                return Response(
                    {'detail': 'Jamoa o\'chirildi (a\'zolar qolmadi).'},
                    status=status.HTTP_200_OK,
                )
            team.captain = next_member.user
            team.save(update_fields=['captain'])

        return Response(
            {'detail': 'Jamoadan chiqildi.'},
            status=status.HTTP_200_OK,
        )


class MyTeamView(APIView):
    """Joriy foydalanuvchining jamoasini qaytaradi — ``GET /api/v1/teams/me/``.

    Agar foydalanuvchi hech qanday jamoada bo'lmasa, 404 qaytariladi.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, *args, **kwargs) -> Response:
        """Foydalanuvchining a'zoligi va jamoasi haqida ma'lumot."""
        membership = (
            TeamMembership.objects.select_related('team')
            .filter(user=request.user)
            .first()
        )
        if membership is None:
            return Response(
                {'detail': 'Siz hali biror jamoada emassiz.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        team_data = TeamDetailSerializer(
            membership.team, context={'request': request}
        ).data
        return Response(
            {
                'membership': TeamMembershipNestedSerializer(membership).data,
                'team': team_data,
            },
            status=status.HTTP_200_OK,
        )

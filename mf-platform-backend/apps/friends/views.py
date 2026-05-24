"""Views for the ``friends`` app — friend requests, challenges, leaderboards."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Challenge, Friendship
from .serializers import (
    ChallengeSerializer,
    FriendshipSerializer,
    MinimalUserSerializer,
)
from .services import finalize_challenge, list_friends, list_pending_incoming


User = get_user_model()


# ---------- Friends ----------


class SendRequestView(APIView):
    """``POST /api/v1/friends/request`` — yangi do'stlik so'rovi.

    Body: ``{"to_user_id": "<uuid>"}``
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        to_user_id = request.data.get('to_user_id')
        if not to_user_id:
            return Response(
                {'detail': 'to_user_id majburiy.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(to_user_id) == str(request.user.id):
            return Response(
                {'detail': "O'zingizga so'rov yubora olmaysiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            to_user = User.objects.get(pk=to_user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': 'Foydalanuvchi topilmadi.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Allaqachon mavjud bo'lsa qaytaring
        existing = Friendship.objects.filter(
            from_user=request.user, to_user=to_user
        ).first()
        if existing:
            return Response(
                FriendshipSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        # Teskari yo'nalish accepted bo'lsa — yangi so'rov shart emas
        reverse = Friendship.objects.filter(
            from_user=to_user, to_user=request.user, status='accepted'
        ).first()
        if reverse:
            return Response(
                FriendshipSerializer(reverse).data,
                status=status.HTTP_200_OK,
            )

        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=to_user,
        )
        return Response(
            FriendshipSerializer(friendship).data,
            status=status.HTTP_201_CREATED,
        )


class AcceptRequestView(APIView):
    """``POST /api/v1/friends/<pk>/accept`` — faqat ``to_user`` qabul qiladi."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        friendship = get_object_or_404(Friendship, pk=pk)
        if friendship.to_user_id != request.user.id:
            return Response(
                {'detail': "Faqat qabul qiluvchi tasdiqlay oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if friendship.status != 'pending':
            return Response(
                {'detail': "So'rov allaqachon ko'rib chiqilgan."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from .services import accept_friend

        accept_friend(friendship)
        return Response(FriendshipSerializer(friendship).data)


class RejectRequestView(APIView):
    """``POST /api/v1/friends/<pk>/reject`` — faqat ``to_user`` rad qiladi."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        friendship = get_object_or_404(Friendship, pk=pk)
        if friendship.to_user_id != request.user.id:
            return Response(
                {'detail': "Faqat qabul qiluvchi rad eta oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if friendship.status != 'pending':
            return Response(
                {'detail': "So'rov allaqachon ko'rib chiqilgan."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        friendship.status = 'rejected'
        friendship.save(update_fields=['status'])
        return Response(FriendshipSerializer(friendship).data)


class FriendsListView(APIView):
    """``GET /api/v1/friends/list`` — accepted do'stlar (ikki tomon)."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        friends = list_friends(request.user)
        return Response(MinimalUserSerializer(friends, many=True).data)


class PendingRequestsView(APIView):
    """``GET /api/v1/friends/pending`` — incoming pending so'rovlar."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        pending = list_pending_incoming(request.user)
        return Response(FriendshipSerializer(pending, many=True).data)


# ---------- Challenges ----------


class CreateChallengeView(APIView):
    """``POST /api/v1/challenges/create`` — yangi challenge yaratadi.

    Body: ``{"opponent_id": "<uuid>", "subject": "matematika", "grade": 11}``
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        opponent_id = request.data.get('opponent_id')
        subject = (request.data.get('subject') or '').strip()
        grade = request.data.get('grade')

        if not opponent_id or not subject or grade is None:
            return Response(
                {'detail': 'opponent_id, subject va grade majburiy.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            grade_int = int(grade)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'grade butun son bo\'lishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if grade_int <= 0:
            return Response(
                {'detail': 'grade musbat butun son bo\'lishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(opponent_id) == str(request.user.id):
            return Response(
                {'detail': "O'zingiz bilan challenge yarata olmaysiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            opponent = User.objects.get(pk=opponent_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': 'Raqib topilmadi.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        challenge = Challenge.objects.create(
            challenger=request.user,
            opponent=opponent,
            subject=subject[:32],
            grade=grade_int,
        )
        return Response(
            ChallengeSerializer(challenge).data,
            status=status.HTTP_201_CREATED,
        )


class SubmitChallengeView(APIView):
    """``POST /api/v1/challenges/<pk>/submit`` — natija yuborish.

    Body: ``{"score": 8, "time_ms": 42000}``
    Challenger yoki opponent yubora oladi. Ikkalasi yuborgach finalize bo'ladi.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        challenge = get_object_or_404(Challenge, pk=pk)
        user_id = request.user.id
        if user_id not in (challenge.challenger_id, challenge.opponent_id):
            return Response(
                {'detail': 'Siz bu challenge ishtirokchisi emassiz.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if challenge.status != 'open':
            return Response(
                {'detail': "Challenge yopilgan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        score = request.data.get('score')
        time_ms = request.data.get('time_ms')
        try:
            score_int = int(score)
            time_int = int(time_ms) if time_ms is not None else 0
        except (TypeError, ValueError):
            return Response(
                {'detail': 'score va time_ms butun son bo\'lishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = []
        if user_id == challenge.challenger_id:
            if challenge.challenger_score is not None:
                return Response(
                    {'detail': 'Natija allaqachon yuborilgan.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            challenge.challenger_score = score_int
            challenge.challenger_time_ms = time_int
            update_fields = ['challenger_score', 'challenger_time_ms']
        else:
            if challenge.opponent_score is not None:
                return Response(
                    {'detail': 'Natija allaqachon yuborilgan.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            challenge.opponent_score = score_int
            challenge.opponent_time_ms = time_int
            update_fields = ['opponent_score', 'opponent_time_ms']

        challenge.save(update_fields=update_fields)

        if (
            challenge.challenger_score is not None
            and challenge.opponent_score is not None
        ):
            finalize_challenge(challenge)

        challenge.refresh_from_db()
        return Response(ChallengeSerializer(challenge).data)


class ChallengeListView(APIView):
    """``GET /api/v1/challenges/list`` — foydalanuvchining barcha challenge'lari."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        qs = (
            Challenge.objects.filter(
                Q(challenger=request.user) | Q(opponent=request.user)
            )
            .filter(status__in=('open', 'done'))
            .select_related('challenger', 'opponent', 'winner')
            .order_by('-created_at')[:100]
        )
        return Response(ChallengeSerializer(qs, many=True).data)


# ---------- Leaderboards ----------


class GlobalLeaderboardView(APIView):
    """``GET /api/v1/leaderboard/global`` — top 100 by XP."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        top = User.objects.order_by('-xp')[:100]
        return Response(MinimalUserSerializer(top, many=True).data)


class FriendsLeaderboardView(APIView):
    """``GET /api/v1/leaderboard/friends`` — faqat do'stlar (XP bo'yicha)."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        friends_qs = list_friends(request.user)
        # Foydalanuvchining o'zini ham qo'shish — frontda osonroq bo'lsin
        ids = list(friends_qs.values_list('id', flat=True)) + [request.user.id]
        leaderboard = User.objects.filter(id__in=ids).order_by('-xp')
        return Response(MinimalUserSerializer(leaderboard, many=True).data)

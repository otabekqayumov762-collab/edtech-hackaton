"""Views for the ``duels`` app — Duel Arena REST endpoints."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tests.models import Question

from .models import Duel, DuelAnswer, DuelMatch, DuelMatchAnswer, DuelRating
from .serializers import (
    DuelAnswerSerializer,
    DuelCreateSerializer,
    DuelListSerializer,
    DuelMatchAnswerSerializer,
    DuelMatchAnswerWriteSerializer,
    DuelMatchSerializer,
    DuelRatingLeaderSerializer,
)
from .services import finalize_duel, get_or_create_rating

User = get_user_model()


class DuelViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD endpoints for :class:`Duel`.

    * ``GET /api/v1/duels/`` — list duels involving the current user.
    * ``POST /api/v1/duels/`` — create a duel with the current user as
      challenger.
    * ``GET /api/v1/duels/<id>/`` — retrieve a single duel (participants
      only).
    """

    permission_classes = (permissions.IsAuthenticated,)
    queryset = Duel.objects.select_related('challenger', 'opponent', 'subject', 'winner')

    def get_serializer_class(self):
        """Pick the serializer per action — create uses the write form."""
        if self.action == 'create':
            return DuelCreateSerializer
        return DuelListSerializer

    def get_queryset(self) -> QuerySet[Duel]:
        """Restrict listing/retrieval to duels the user participates in."""
        user = self.request.user
        if not user.is_authenticated:
            return Duel.objects.none()
        return (
            Duel.objects.select_related('challenger', 'opponent', 'subject', 'winner')
            .filter(Q(challenger=user) | Q(opponent=user))
            .order_by('-created_at')
        )


class _DuelActionMixin:
    """Helpers shared by single-duel action views."""

    permission_classes = (permissions.IsAuthenticated,)

    def get_duel(self, pk) -> Duel:
        """Fetch a duel by ``pk`` or raise 404."""
        return get_object_or_404(
            Duel.objects.select_related('challenger', 'opponent', 'subject', 'winner'),
            pk=pk,
        )


class AcceptDuelView(_DuelActionMixin, APIView):
    """POST ``/duels/<id>/accept/`` — opponent accepts a pending duel."""

    def post(self, request: Request, pk) -> Response:
        """Transition the duel from ``pending`` to ``active``.

        Only the duel's opponent may accept; the duel must be ``pending``.
        """
        duel = self.get_duel(pk)
        if request.user.pk != duel.opponent_id:
            return Response(
                {'detail': "Faqat raqib chaqiriqni qabul qila oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if duel.state != 'pending':
            return Response(
                {'detail': "Duelni faqat 'pending' holatida qabul qilish mumkin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duel.state = 'active'
        duel.save(update_fields=['state'])
        return Response(DuelListSerializer(duel).data, status=status.HTTP_200_OK)


class SubmitAnswerView(_DuelActionMixin, APIView):
    """POST ``/duels/<id>/answer/`` — submit a single answer for the duel.

    Body: ``{"question_index": int, "is_correct": bool}``.

    Behaviour:

    * Creates a :class:`DuelAnswer` for the requesting participant.
    * Increments the participant's score on the parent :class:`Duel`
      when ``is_correct`` is true.
    * If both participants have submitted answers for every question
      (``question_count``), the duel is moved to ``finished`` and a
      ``winner`` is computed (``None`` on a tie).
    """

    def post(self, request: Request, pk) -> Response:
        """Record an answer and finalize the duel if both sides are done."""
        serializer = DuelAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question_index: int = serializer.validated_data['question_index']
        question_id: int = serializer.validated_data['question_id']
        picked_index: int = serializer.validated_data['picked_index']

        # Server-side compute is_correct — mijozga ishonmaymiz.
        try:
            question = Question.objects.only('correct_index').get(pk=question_id)
        except Question.DoesNotExist:
            return Response(
                {'detail': 'Savol topilmadi.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        is_correct: bool = picked_index == question.correct_index

        with transaction.atomic():
            duel = (
                Duel.objects.select_for_update()
                .select_related('challenger', 'opponent')
                .get(pk=pk)
            )

            if not duel.is_participant(request.user):
                return Response(
                    {'detail': "Siz ushbu duelda ishtirok etmaysiz."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if duel.state != 'active':
                return Response(
                    {'detail': "Javob faqat faol duelga yuboriladi."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if question_index >= duel.question_count:
                return Response(
                    {'detail': "question_index doirasidan tashqarida."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            answer, created = DuelAnswer.objects.get_or_create(
                duel=duel,
                user=request.user,
                question_index=question_index,
                defaults={'is_correct': is_correct},
            )
            if not created:
                return Response(
                    {'detail': "Bu savolga allaqachon javob berilgan."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if is_correct:
                if request.user.pk == duel.challenger_id:
                    duel.challenger_score = (duel.challenger_score or 0) + 1
                    update_fields = ['challenger_score']
                else:
                    duel.opponent_score = (duel.opponent_score or 0) + 1
                    update_fields = ['opponent_score']
                duel.save(update_fields=update_fields)

            # Finish detection — both sides answered all questions.
            total = duel.question_count
            challenger_done = DuelAnswer.objects.filter(
                duel=duel, user_id=duel.challenger_id
            ).count()
            opponent_done = DuelAnswer.objects.filter(
                duel=duel, user_id=duel.opponent_id
            ).count()

            if challenger_done >= total and opponent_done >= total:
                duel.state = 'finished'
                duel.finished_at = timezone.now()
                if duel.challenger_score > duel.opponent_score:
                    duel.winner_id = duel.challenger_id
                elif duel.opponent_score > duel.challenger_score:
                    duel.winner_id = duel.opponent_id
                else:
                    duel.winner_id = None
                duel.save(update_fields=['state', 'finished_at', 'winner'])

        duel.refresh_from_db()
        return Response(
            {
                'answer': DuelAnswerSerializer(answer).data,
                'duel': DuelListSerializer(duel).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CancelDuelView(_DuelActionMixin, APIView):
    """POST ``/duels/<id>/cancel/`` — challenger cancels a pending duel."""

    def post(self, request: Request, pk) -> Response:
        """Move a pending duel to the ``cancelled`` state.

        Only the challenger may cancel, and only while ``pending``.
        """
        duel = self.get_duel(pk)
        if request.user.pk != duel.challenger_id:
            return Response(
                {'detail': "Faqat chaqiriq egasi duelni bekor qila oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if duel.state != 'pending':
            return Response(
                {'detail': "Faqat 'pending' duelni bekor qilish mumkin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duel.state = 'cancelled'
        duel.save(update_fields=['state'])
        return Response(DuelListSerializer(duel).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Arena endpoints — DuelMatch
# ---------------------------------------------------------------------------


def _serialize_match(duel: DuelMatch) -> dict:
    """Return :class:`DuelMatch` payload with embedded answers."""
    duel = (
        DuelMatch.objects.select_related('challenger', 'opponent', 'winner')
        .prefetch_related('match_answers')
        .get(pk=duel.pk)
    )
    return DuelMatchSerializer(duel).data


class CreateDuelMatchView(APIView):
    """``POST /api/v1/duels/create`` — yangi arena duelini yaratadi.

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
                {'detail': "grade butun son bo'lishi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if grade_int <= 0:
            return Response(
                {'detail': "grade musbat butun son bo'lishi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(opponent_id) == str(request.user.id):
            return Response(
                {'detail': "O'zingiz bilan duel yarata olmaysiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            opponent = User.objects.get(pk=opponent_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': 'Raqib topilmadi.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        match = DuelMatch.objects.create(
            challenger=request.user,
            opponent=opponent,
            subject=subject[:32],
            grade=grade_int,
            status='lobby',
        )
        return Response(_serialize_match(match), status=status.HTTP_201_CREATED)


class AcceptDuelMatchView(APIView):
    """``POST /api/v1/duels/<id>/accept`` — raqib chaqiriqni qabul qiladi."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        match = get_object_or_404(DuelMatch, pk=pk)
        if request.user.pk != match.opponent_id:
            return Response(
                {'detail': 'Faqat raqib chaqiriqni qabul qila oladi.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if match.status != 'lobby':
            return Response(
                {'detail': "Duelni faqat 'lobby' holatida qabul qilish mumkin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match.status = 'playing'
        match.save(update_fields=['status'])
        return Response(_serialize_match(match), status=status.HTTP_200_OK)


class DuelMatchDetailView(APIView):
    """``GET /api/v1/duels/<id>`` — duel state + answers."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request, pk: int) -> Response:
        match = get_object_or_404(DuelMatch, pk=pk)
        if not match.is_participant(request.user):
            return Response(
                {'detail': 'Siz ushbu duelda ishtirok etmaysiz.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(_serialize_match(match), status=status.HTTP_200_OK)


class SubmitDuelMatchView(APIView):
    """``POST /api/v1/duels/<id>/submit`` — joriy user javoblarini saqlaydi.

    Body: ``{"answers": [{"question_idx": 0, "question_text": "...",
    "question_type": "choice", "user_answer": "...", "correct_answer": "...",
    "is_correct": true, "time_ms": 4200, "explanation": "..."}]}``

    Ikkala user ham submit qilgan bo'lsa — :func:`finalize_duel` chaqiriladi.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        answers_payload = request.data.get('answers')
        if not isinstance(answers_payload, list) or not answers_payload:
            return Response(
                {'detail': 'answers ro\'yxati bo\'sh bo\'lmasligi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DuelMatchAnswerWriteSerializer(
            data=answers_payload, many=True
        )
        serializer.is_valid(raise_exception=True)
        validated_answers = serializer.validated_data

        with transaction.atomic():
            match = (
                DuelMatch.objects.select_for_update()
                .select_related('challenger', 'opponent')
                .get(pk=pk)
            )

            if not match.is_participant(request.user):
                return Response(
                    {'detail': 'Siz ushbu duelda ishtirok etmaysiz.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if match.status not in ('lobby', 'playing'):
                return Response(
                    {'detail': "Duel allaqachon yopilgan."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Transition lobby -> playing on first submit
            if match.status == 'lobby':
                match.status = 'playing'

            existing_idx = set(
                DuelMatchAnswer.objects.filter(
                    duel=match, user=request.user
                ).values_list('question_idx', flat=True)
            )

            score_delta = 0
            time_delta_ms = 0
            created_count = 0
            for ans in validated_answers:
                qidx = ans['question_idx']
                if qidx in existing_idx:
                    # Idempotent — skip duplicates rather than error out.
                    continue
                DuelMatchAnswer.objects.create(
                    duel=match,
                    user=request.user,
                    question_idx=qidx,
                    question_text=ans.get('question_text', '')[:500],
                    question_type=ans.get('question_type', 'choice')[:12],
                    user_answer=ans.get('user_answer', '')[:500],
                    correct_answer=ans.get('correct_answer', '')[:500],
                    is_correct=bool(ans.get('is_correct', False)),
                    time_ms=int(ans.get('time_ms', 0) or 0),
                    explanation=ans.get('explanation', '')[:500],
                )
                existing_idx.add(qidx)
                if ans.get('is_correct'):
                    score_delta += 1
                time_delta_ms += int(ans.get('time_ms', 0) or 0)
                created_count += 1

            # Update aggregate score/time on the match.
            if created_count:
                if request.user.pk == match.challenger_id:
                    match.challenger_score = (match.challenger_score or 0) + score_delta
                    match.challenger_time_ms = (
                        match.challenger_time_ms or 0
                    ) + time_delta_ms
                else:
                    match.opponent_score = (match.opponent_score or 0) + score_delta
                    match.opponent_time_ms = (
                        match.opponent_time_ms or 0
                    ) + time_delta_ms

            match.save(
                update_fields=[
                    'status',
                    'challenger_score',
                    'opponent_score',
                    'challenger_time_ms',
                    'opponent_time_ms',
                ]
            )

            # Did both sides submit? Use existence of any answer per side.
            challenger_done = DuelMatchAnswer.objects.filter(
                duel=match, user_id=match.challenger_id
            ).exists()
            opponent_done = DuelMatchAnswer.objects.filter(
                duel=match, user_id=match.opponent_id
            ).exists()

            if challenger_done and opponent_done and match.status != 'done':
                finalize_duel(match)

        match.refresh_from_db()
        return Response(_serialize_match(match), status=status.HTTP_200_OK)


class DuelMatchListView(APIView):
    """``GET /api/v1/duels/list`` — joriy user arena duellari."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        qs = (
            DuelMatch.objects.filter(
                Q(challenger=request.user) | Q(opponent=request.user)
            )
            .select_related('challenger', 'opponent', 'winner')
            .prefetch_related('match_answers')
            .order_by('-created_at')[:100]
        )
        return Response(DuelMatchSerializer(qs, many=True).data)


class DuelMatchReviewView(APIView):
    """``GET /api/v1/duels/<id>/review`` — joriy user javoblarining review'i."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request, pk: int) -> Response:
        match = get_object_or_404(DuelMatch, pk=pk)
        if not match.is_participant(request.user):
            return Response(
                {'detail': 'Siz ushbu duelda ishtirok etmaysiz.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        answers = (
            DuelMatchAnswer.objects.filter(duel=match, user=request.user)
            .order_by('question_idx')
        )
        return Response(
            {
                'duel_id': match.pk,
                'subject': match.subject,
                'grade': match.grade,
                'status': match.status,
                'answers': DuelMatchAnswerSerializer(answers, many=True).data,
            }
        )


class ArenaLeaderboardView(APIView):
    """``GET /api/v1/leaderboard/arena`` — top 100 :class:`DuelRating`."""

    permission_classes = (permissions.AllowAny,)

    def get(self, request: Request) -> Response:
        top = (
            DuelRating.objects.select_related('user')
            .order_by('-rating', '-wins')[:100]
        )
        return Response(DuelRatingLeaderSerializer(top, many=True).data)


class DuelMatchRematchView(APIView):
    """``POST /api/v1/duels/<id>/rematch`` — bir xil raqib/fan/sinf bilan yangi duel."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, pk: int) -> Response:
        original = get_object_or_404(DuelMatch, pk=pk)
        if not original.is_participant(request.user):
            return Response(
                {'detail': 'Siz ushbu duelda ishtirok etmaysiz.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if original.status != 'done':
            return Response(
                {'detail': "Faqat yakunlangan dueldan rematch yaratish mumkin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Rematch — request user becomes the new challenger, the other
        # party becomes the new opponent.
        if request.user.pk == original.challenger_id:
            challenger = original.challenger
            opponent = original.opponent
        else:
            challenger = original.opponent
            opponent = original.challenger

        new_match = DuelMatch.objects.create(
            challenger=challenger,
            opponent=opponent,
            subject=original.subject,
            grade=original.grade,
            status='lobby',
        )
        return Response(_serialize_match(new_match), status=status.HTTP_201_CREATED)


class MyDuelRatingView(APIView):
    """``GET /api/v1/duels/rating/me`` — joriy user reytingi."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        rating = get_or_create_rating(request.user)
        from .serializers import DuelRatingSerializer

        return Response(DuelRatingSerializer(rating).data)

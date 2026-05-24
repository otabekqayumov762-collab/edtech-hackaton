"""Tests app views.

`TestViewSet` — testlar ro'yxati / detal (ochiq, AllowAny).
`AnswerView` — savolga javob beradi va LIVES sistemasi orqali jonni
boshqaradi (noto'g'ri = -1 jon, ketma-ket 5 to'g'ri = +1 jon).
`FinishTestView` — test yakunida XP hisoblaydi va `TestAttempt` yozadi.
"""
from __future__ import annotations

from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.services import award_xp

from .models import Option, Question, Test, TestAttempt
from .serializers import (
    AnswerSubmitSerializer,
    TestDetailSerializer,
)
from .generator import generate_test


class GenerateTestView(APIView):
    """POST /api/v1/tests/generate/ body: { subject, grade, topic? }.

    Avtomatik mavzuli test yaratadi (15 ta savol — sinfga moslashgan).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        subject = (request.data.get('subject') or '').strip()
        grade = int(request.data.get('grade') or 9)
        topic = request.data.get('topic')
        if not subject:
            return Response({'detail': 'subject majburiy'}, status=400)
        if grade < 5 or grade > 11:
            return Response({'detail': 'grade 5-11 oralig\'ida bo\'lishi kerak'}, status=400)
        try:
            test = generate_test(subject_slug=subject, grade=grade, topic_slug=topic)
        except Exception as exc:
            return Response({'detail': f'Generator xatosi: {exc}'}, status=500)
        return Response(TestDetailSerializer(test).data, status=status.HTTP_201_CREATED)


class TestViewSet(viewsets.ReadOnlyModelViewSet):
    """Faol testlarni ro'yxat / detal qilib chiqaruvchi ochiq endpoint.

    * ``GET /api/v1/tests/`` — barcha faol testlar; ``?subject=<slug>``
      orqali fan bo'yicha filtr.
    * ``GET /api/v1/tests/<id>/`` — bitta testni savollari bilan
      (to'g'ri javob ko'rsatilmaydi).
    """

    permission_classes = (permissions.AllowAny,)
    pagination_class = None
    lookup_field = 'pk'

    def get_queryset(self):
        """Faqat faol testlar, kerak bo'lsa ``?subject=`` bo'yicha filtr."""
        qs = (
            Test.objects.filter(is_active=True)
            .select_related('subject')
            .prefetch_related(
                Prefetch(
                    'questions',
                    queryset=Question.objects.prefetch_related(
                        Prefetch('options', queryset=Option.objects.order_by('order', 'id'))
                    ).order_by('order', 'id'),
                )
            )
        )
        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject_id=subject)
        return qs.order_by('subject_id', 'order', 'id')

    def get_serializer_class(self):
        """List uchun yengil, retrieve uchun savollar bilan serializer."""
        return TestDetailSerializer


class AnswerView(APIView):
    """Bitta savolga javobni tekshiradi va LIVES sistemasini yangilaydi.

    POST ``/api/v1/tests/answer/`` body: ``{question_id, picked_index}``.
    Hech qachon to'g'ri javob indeksini qaytarmaydi.
    """

    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        """Javobni tekshirib, jonni ayiradi yoki ketma-ket sanoqni oshiradi."""
        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question_id = serializer.validated_data['question_id']
        picked_index = serializer.validated_data['picked_index']

        question = get_object_or_404(Question, pk=question_id)
        user = request.user
        is_correct = picked_index == question.correct_index

        if is_correct:
            life_gained = user.record_correct()
            return Response(
                {
                    'is_correct': True,
                    'lives': user.lives,
                    'life_gained': life_gained,
                },
                status=status.HTTP_200_OK,
            )

        user.lose_life()
        return Response(
            {
                'is_correct': False,
                'lives': user.lives,
            },
            status=status.HTTP_200_OK,
        )


class FinishTestView(APIView):
    """Test yakuni — XP hisoblab, TestAttempt yozadi.

    POST ``/api/v1/tests/finish/`` body:
    ``{test_id, correct, wrong_indices: [int]}``.

    XP formulasi:
        ``correct * 12 + (25 if accuracy >= 0.6 else 0) + (50 if perfect else 0)``
    """

    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        """Natijani saqlaydi, XP qo'shadi va kunlik faollikni belgilaydi."""
        test_id = request.data.get('test_id')
        wrong_indices = request.data.get('wrong_indices', []) or []

        if test_id is None:
            return Response(
                {'detail': 'test_id majburiy.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(wrong_indices, list) or not all(
            isinstance(i, int) and i >= 0 for i in wrong_indices
        ):
            return Response(
                {'detail': 'wrong_indices >=0 integerlar ro\'yxati bo\'lishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        test = get_object_or_404(Test, pk=test_id)
        total = test.questions.count()

        # `correct`ni mijozdan emas, balki yagona, doirasidan tashqarisi
        # filtirlangan wrong_indices to'plamidan derive qilamiz.
        unique_wrongs = {i for i in wrong_indices if 0 <= i < total}
        wrong_indices = sorted(unique_wrongs)
        correct = total - len(unique_wrongs)

        accuracy = (correct / total) if total else 0.0
        xp_earned = correct * 12
        if total and accuracy >= 0.6:
            xp_earned += 25
        if total and correct == total:
            xp_earned += 50

        user = request.user
        attempt = TestAttempt.objects.create(
            user=user,
            test=test,
            correct=correct,
            total=total,
            xp_earned=xp_earned,
            wrong_indices=wrong_indices,
            finished_at=timezone.now(),
            is_complete=True,
        )

        # Yagona XP quvuri — streak, XpLog, daily_done, achievements ham yangilanadi.
        award_xp(user, xp_earned, reason='test_finish')

        finished_at = attempt.finished_at or attempt.started_at
        data = {
            'id': str(attempt.id),
            'test_id': attempt.test_id,
            'subject': test.subject_id,
            'title': test.title,
            'total': attempt.total,
            'correct': attempt.correct,
            'xp_earned': attempt.xp_earned,
            'xp': attempt.xp_earned,
            'date': finished_at.isoformat() if finished_at else None,
            'dateISO': finished_at.isoformat() if finished_at else None,
            'wrong_indices': attempt.wrong_indices,
            'accuracy': round(accuracy, 4),
        }
        return Response(data, status=status.HTTP_201_CREATED)

"""API views for the core learning flow."""
from __future__ import annotations

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CoreProgress,
    CoreSubject,
    CoreTest,
    CoreTestQuestion,
    GradeTrack,
    LearningUnit,
    PracticeGame,
    PracticeQuestion,
)
from .serializers import (
    AudioCompleteSerializer,
    CoreAttemptSerializer,
    CoreProgressSerializer,
    CoreSubjectSerializer,
    CoreTestSerializer,
    GradeTrackSerializer,
    LearningUnitSerializer,
    PracticeGameSerializer,
    PracticeSubmitSerializer,
    TestSubmitSerializer,
)
from .services import (
    complete_audio,
    generate_daily_plan,
    submit_practice,
    submit_test,
    user_state,
    weak_subjects_for_user,
)


def _unit_queryset():
    return (
        LearningUnit.objects.filter(is_active=True)
        .select_related('track', 'track__subject', 'audio', 'practice', 'test')
        .prefetch_related(
            Prefetch(
                'practice__questions',
                queryset=PracticeQuestion.objects.order_by('difficulty', 'order', 'id'),
            ),
            Prefetch(
                'test__questions',
                queryset=CoreTestQuestion.objects.order_by('difficulty', 'order', 'id'),
            ),
        )
    )


def _serializer_context(request: Request) -> dict:
    return {
        'request': request,
        'user': request.user if request.user.is_authenticated else None,
    }


class SubjectListView(APIView):
    """GET /api/v1/core/subjects/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request) -> Response:
        subjects = CoreSubject.objects.all().order_by('order', 'name')
        return Response(
            CoreSubjectSerializer(subjects, many=True).data,
            status=status.HTTP_200_OK,
        )


class GradeListView(APIView):
    """GET /api/v1/core/subjects/<subject_id>/grades/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, subject_id: str) -> Response:
        subject = get_object_or_404(CoreSubject, pk=subject_id)
        if subject.coming_soon:
            return Response(
                {
                    'subject': CoreSubjectSerializer(subject).data,
                    'grades': [],
                    'detail': 'Bu fan tez kunda qo‘shiladi.',
                },
                status=status.HTTP_200_OK,
            )
        tracks = (
            GradeTrack.objects.filter(subject=subject, is_active=True)
            .prefetch_related('units')
            .order_by('grade')
        )
        return Response(
            {
                'subject': CoreSubjectSerializer(subject).data,
                'grades': GradeTrackSerializer(
                    tracks,
                    many=True,
                    context=_serializer_context(request),
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class GradeDetailView(APIView):
    """GET /api/v1/core/subjects/<subject_id>/grades/<grade>/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, subject_id: str, grade: int) -> Response:
        track = get_object_or_404(
            GradeTrack.objects.select_related('subject'),
            subject_id=subject_id,
            grade=grade,
            is_active=True,
        )
        units = _unit_queryset().filter(track=track)
        return Response(
            {
                'track': GradeTrackSerializer(
                    track,
                    context=_serializer_context(request),
                ).data,
                'units': LearningUnitSerializer(
                    units,
                    many=True,
                    context=_serializer_context(request),
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class UnitDetailView(APIView):
    """GET /api/v1/core/units/<unit_id>/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, unit_id: str) -> Response:
        unit = get_object_or_404(_unit_queryset(), pk=unit_id)
        return Response(
            LearningUnitSerializer(unit, context=_serializer_context(request)).data
        )


class MeStateView(APIView):
    """GET /api/v1/core/me/state/."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        request.user.touch_daily()
        request.user.save(
            update_fields=[
                'daily_done',
                'daily_done_date',
                'lives',
                'lives_reset_date',
            ]
        )
        return Response(user_state(request.user))


class MyProgressView(APIView):
    """GET /api/v1/core/me/progress/."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        rows = (
            CoreProgress.objects.filter(user=request.user)
            .select_related('unit', 'unit__track', 'unit__track__subject')
            .order_by('unit__track__subject__order', 'unit__track__grade')
        )
        return Response(
            [
                {
                    'unit_id': row.unit_id,
                    'subject_id': row.unit.track.subject_id,
                    'grade': row.unit.track.grade,
                    'unit_title': row.unit.title,
                    'progress': CoreProgressSerializer(row).data,
                }
                for row in rows
            ]
        )


class PracticeDetailView(APIView):
    """GET /api/v1/core/practice/<unit_id>/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, unit_id: str) -> Response:
        unit = get_object_or_404(_unit_queryset(), pk=unit_id)
        practice = get_object_or_404(PracticeGame, unit=unit, is_active=True)
        data = PracticeGameSerializer(practice).data
        data['unit_id'] = unit.id
        data['ai_hint'] = {
            'mode': 'adaptive',
            'basis': 'recent_wrong_answers_and_speed',
        }
        return Response(data)


class TestDetailView(APIView):
    """GET /api/v1/core/test/<unit_id>/."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, unit_id: str) -> Response:
        unit = get_object_or_404(_unit_queryset(), pk=unit_id)
        test = get_object_or_404(CoreTest, unit=unit, is_active=True)
        data = CoreTestSerializer(test).data
        data['unit_id'] = unit.id
        data['ai_hint'] = {
            'mode': 'adaptive',
            'basis': 'weak_subject_priority',
        }
        return Response(data)


class AudioCompleteView(APIView):
    """POST /api/v1/core/audio/complete/."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AudioCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = get_object_or_404(
            _unit_queryset(),
            pk=serializer.validated_data['unit_id'],
        )
        if not hasattr(unit, 'audio') or not unit.audio.is_active:
            return Response(
                {'detail': 'Audio dars topilmadi.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        attempt = complete_audio(
            request.user,
            unit.audio,
            duration_seconds=serializer.validated_data['duration_seconds'],
        )
        return Response(
            CoreAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class PracticeSubmitView(APIView):
    """POST /api/v1/core/practice/submit/."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = PracticeSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if request.user.lives <= 0:
            return Response(
                {'detail': 'Heart tugagan. Keyingi resetni kuting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        unit = get_object_or_404(
            _unit_queryset(),
            pk=serializer.validated_data['unit_id'],
        )
        practice = get_object_or_404(PracticeGame, unit=unit, is_active=True)
        attempt = submit_practice(
            request.user,
            practice,
            serializer.validated_data['answers'],
            duration_seconds=serializer.validated_data['duration_seconds'],
        )
        return Response(
            CoreAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class TestSubmitView(APIView):
    """POST /api/v1/core/test/submit/."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = TestSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if request.user.lives <= 0:
            return Response(
                {'detail': 'Heart tugagan. Keyingi resetni kuting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        unit = get_object_or_404(
            _unit_queryset(),
            pk=serializer.validated_data['unit_id'],
        )
        test = get_object_or_404(CoreTest, unit=unit, is_active=True)
        attempt = submit_test(
            request.user,
            test,
            serializer.validated_data['answers'],
            duration_seconds=serializer.validated_data['duration_seconds'],
        )
        return Response(
            CoreAttemptSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )


class DailyPlanView(APIView):
    """GET /api/v1/core/daily-plan/."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(generate_daily_plan(request.user))


class AiInsightsView(APIView):
    """GET /api/v1/core/ai/insights/."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(
            {
                'weak_subjects': weak_subjects_for_user(request.user),
                'daily_plan': generate_daily_plan(request.user),
            }
        )

"""Serializers for the core learning API."""
from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .models import (
    AudioLesson,
    CoreAttempt,
    CoreProgress,
    CoreSubject,
    CoreTest,
    CoreTestQuestion,
    GradeTrack,
    LearningUnit,
    PracticeGame,
    PracticeQuestion,
)


class CoreSubjectSerializer(serializers.ModelSerializer):
    grades_count = serializers.SerializerMethodField()

    class Meta:
        model = CoreSubject
        fields = [
            'id',
            'name',
            'short',
            'icon',
            'color',
            'is_required',
            'coming_soon',
            'order',
            'grades_count',
        ]
        read_only_fields = fields

    def get_grades_count(self, obj: CoreSubject) -> int:
        if obj.coming_soon:
            return 0
        return obj.grades.filter(is_active=True).count()


class GradeTrackSerializer(serializers.ModelSerializer):
    subject = CoreSubjectSerializer(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = GradeTrack
        fields = [
            'id',
            'subject',
            'grade',
            'title',
            'description',
            'is_active',
            'progress',
        ]
        read_only_fields = fields

    def get_progress(self, obj: GradeTrack) -> dict[str, int | bool]:
        user = self.context.get('user')
        if user is None or not getattr(user, 'is_authenticated', False):
            return {'percent': 0, 'completed_units': 0, 'total_units': obj.units.count()}
        units = list(obj.units.filter(is_active=True))
        if not units:
            return {'percent': 0, 'completed_units': 0, 'total_units': 0}
        rows = {
            row.unit_id: row
            for row in CoreProgress.objects.filter(user=user, unit__in=units)
        }
        total_percent = 0
        completed = 0
        for unit in units:
            row = rows.get(unit.id)
            if row:
                total_percent += row.progress_percent
                completed += 1 if row.completed else 0
        return {
            'percent': round(total_percent / len(units)),
            'completed_units': completed,
            'total_units': len(units),
        }


class PracticeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeQuestion
        fields = [
            'id',
            'prompt',
            'question_type',
            'options',
            'difficulty',
            'order',
        ]
        read_only_fields = fields


class CoreTestQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoreTestQuestion
        fields = [
            'id',
            'prompt',
            'options',
            'difficulty',
            'order',
        ]
        read_only_fields = fields


class AudioLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioLesson
        fields = [
            'id',
            'title',
            'audio_url',
            'transcript',
            'duration_seconds',
            'xp_reward',
            'coin_reward',
            'gem_reward',
            'is_active',
        ]
        read_only_fields = fields


class PracticeGameSerializer(serializers.ModelSerializer):
    questions = PracticeQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeGame
        fields = [
            'id',
            'title',
            'game_type',
            'xp_per_correct',
            'coin_reward',
            'gem_reward_perfect',
            'is_required',
            'questions',
        ]
        read_only_fields = fields


class CoreTestSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = CoreTest
        fields = [
            'id',
            'title',
            'question_limit',
            'xp_per_correct',
            'pass_bonus_xp',
            'perfect_bonus_xp',
            'coin_reward',
            'gem_reward_perfect',
            'is_required',
            'questions',
        ]
        read_only_fields = fields

    def get_questions(self, obj: CoreTest) -> list[dict[str, Any]]:
        limit = obj.question_limit or 5
        qs = obj.questions.all()[:limit]
        return CoreTestQuestionSerializer(qs, many=True).data


class CoreProgressSerializer(serializers.ModelSerializer):
    completed = serializers.BooleanField(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = CoreProgress
        fields = [
            'audio_completed',
            'practice_completed',
            'test_completed',
            'best_practice_score',
            'best_test_score',
            'total_xp_earned',
            'total_coins_earned',
            'total_gems_earned',
            'completed',
            'progress_percent',
            'updated_at',
        ]
        read_only_fields = fields


class LearningUnitSerializer(serializers.ModelSerializer):
    subject = serializers.CharField(source='track.subject_id', read_only=True)
    subject_name = serializers.CharField(source='track.subject.name', read_only=True)
    grade = serializers.IntegerField(source='track.grade', read_only=True)
    audio = AudioLessonSerializer(read_only=True)
    practice = PracticeGameSerializer(read_only=True)
    test = CoreTestSerializer(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = LearningUnit
        fields = [
            'id',
            'subject',
            'subject_name',
            'grade',
            'title',
            'summary',
            'estimated_minutes',
            'order',
            'audio',
            'practice',
            'test',
            'progress',
        ]
        read_only_fields = fields

    def get_progress(self, obj: LearningUnit) -> dict[str, Any]:
        user = self.context.get('user')
        if user is None or not getattr(user, 'is_authenticated', False):
            return {
                'audio_completed': False,
                'practice_completed': False,
                'test_completed': False,
                'completed': False,
                'progress_percent': 0,
            }
        progress = CoreProgress.objects.filter(user=user, unit=obj).first()
        if progress is None:
            return {
                'audio_completed': False,
                'practice_completed': False,
                'test_completed': False,
                'completed': False,
                'progress_percent': 0,
            }
        return CoreProgressSerializer(progress).data


class CoreAttemptSerializer(serializers.ModelSerializer):
    reward = serializers.SerializerMethodField()
    user_state = serializers.SerializerMethodField()

    class Meta:
        model = CoreAttempt
        fields = [
            'id',
            'unit',
            'kind',
            'total',
            'correct',
            'wrong_question_ids',
            'duration_seconds',
            'xp_earned',
            'coins_earned',
            'gems_earned',
            'hearts_lost',
            'payload',
            'finished_at',
            'reward',
            'user_state',
        ]
        read_only_fields = fields

    def get_reward(self, obj: CoreAttempt) -> dict[str, int]:
        return {
            'xp': obj.xp_earned,
            'coins': obj.coins_earned,
            'gems': obj.gems_earned,
            'hearts_lost': obj.hearts_lost,
            'life_gained': int((obj.payload or {}).get('life_gained') or 0),
        }

    def get_user_state(self, obj: CoreAttempt) -> dict[str, int]:
        from .services import user_state

        return user_state(obj.user)


class AudioCompleteSerializer(serializers.Serializer):
    unit_id = serializers.SlugField(max_length=64)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, default=0)


class PracticeAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer = serializers.JSONField(required=False)
    picked_answer = serializers.JSONField(required=False)
    picked_index = serializers.IntegerField(required=False)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, default=0)

    def validate(self, attrs):
        if (
            'answer' not in attrs
            and 'picked_answer' not in attrs
            and 'picked_index' not in attrs
        ):
            raise serializers.ValidationError('answer yoki picked_index majburiy.')
        return attrs


class PracticeSubmitSerializer(serializers.Serializer):
    unit_id = serializers.SlugField(max_length=64)
    answers = PracticeAnswerSerializer(many=True)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, default=0)


class TestAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    picked_index = serializers.IntegerField(min_value=0)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, default=0)


class TestSubmitSerializer(serializers.Serializer):
    unit_id = serializers.SlugField(max_length=64)
    answers = TestAnswerSerializer(many=True)
    duration_seconds = serializers.IntegerField(required=False, min_value=0, default=0)

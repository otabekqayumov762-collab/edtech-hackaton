"""Lessons app serializerlari."""
from __future__ import annotations

from rest_framework import serializers

from .models import Lesson, LessonCompletion


class LessonListSerializer(serializers.ModelSerializer):
    """Ro'yxat ko'rinishi — content yuborilmaydi."""

    subject = serializers.SlugRelatedField(read_only=True, slug_field='id')
    duration = serializers.IntegerField(source='duration_min', read_only=True)
    level = serializers.SerializerMethodField()
    level_key = serializers.CharField(source='level', read_only=True)
    completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id',
            'subject',
            'title',
            'duration',
            'duration_min',
            'level',
            'level_key',
            'summary',
            'xp',
            'completed',
        ]

    def get_level(self, obj: Lesson) -> str:
        """Frontend kutgan ko'rinishdagi daraja labeli."""
        return {
            Lesson.LEVEL_BASIC: 'Boshlang‘ich',
            Lesson.LEVEL_MID: 'O‘rta',
            Lesson.LEVEL_HIGH: 'Yuqori',
        }.get(obj.level, obj.get_level_display())

    def get_completed(self, obj: Lesson) -> bool:
        """Joriy foydalanuvchi shu darsni tugatganmi?"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return LessonCompletion.objects.filter(
            user=request.user, lesson=obj
        ).exists()


class LessonDetailSerializer(LessonListSerializer):
    """Batafsil ko'rinish — paragraflar bilan."""

    class Meta(LessonListSerializer.Meta):
        fields = LessonListSerializer.Meta.fields + ['content']


class LessonCompletionSerializer(serializers.ModelSerializer):
    """Tugatish yozuvining minimal serializeri."""

    class Meta:
        model = LessonCompletion
        fields = ['id', 'user', 'lesson', 'completed_at']
        read_only_fields = ['id', 'user', 'completed_at']

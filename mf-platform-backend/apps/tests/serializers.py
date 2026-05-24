"""Tests app serializerlari.

``correct_index`` va ``explanation`` maydonlari mijozga umuman
yuborilmaydi — javobni faqat backend tekshiradi (LIVES sistemasi:
noto'g'ri javobni ko'rsatmaymiz).
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Option, Question, Test


class OptionSerializer(serializers.ModelSerializer):
    """Bitta javob varianti — id/text/order."""

    class Meta:
        model = Option
        fields = ('id', 'text', 'order')
        read_only_fields = fields


class QuestionSerializer(serializers.ModelSerializer):
    """Savol — variantlari bilan. ``correct_index``/``explanation`` chiqarilmaydi."""

    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ('id', 'text', 'options', 'order')
        read_only_fields = fields

    def get_options(self, obj: Question) -> list[str]:
        return list(obj.options.order_by('order', 'id').values_list('text', flat=True))


class TestListSerializer(serializers.ModelSerializer):
    """Test ro'yxati uchun yengil serializer (savollarsiz)."""

    subject = serializers.SlugRelatedField(slug_field='id', read_only=True)
    difficulty = serializers.SerializerMethodField()
    difficulty_key = serializers.CharField(source='difficulty', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = (
            'id',
            'subject',
            'title',
            'difficulty',
            'difficulty_key',
            'duration_min',
            'xp',
            'question_count',
        )
        read_only_fields = fields

    def get_question_count(self, obj: Test) -> int:
        """Testdagi savollar sonini qaytaradi."""
        return obj.questions.count()

    def get_difficulty(self, obj: Test) -> str:
        return {
            Test.DIFFICULTY_EASY: 'Oson',
            Test.DIFFICULTY_MID: 'O‘rta',
            Test.DIFFICULTY_HARD: 'Qiyin',
        }.get(obj.difficulty, obj.get_difficulty_display())


class TestDetailSerializer(TestListSerializer):
    """Test detallari — savollar bilan, ammo to'g'ri javobsiz."""

    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(TestListSerializer.Meta):
        fields = TestListSerializer.Meta.fields + ('questions',)
        read_only_fields = fields


class AnswerSubmitSerializer(serializers.Serializer):
    """`/answer/` endpoint payload — savol id va tanlangan variant indeksi."""

    question_id = serializers.IntegerField()
    picked_index = serializers.IntegerField(min_value=0)


class AttemptResultSerializer(serializers.Serializer):
    """`/finish/` natijasi — XP va aniqlik."""

    correct = serializers.IntegerField()
    total = serializers.IntegerField()
    xp_earned = serializers.IntegerField()
    wrong_indices = serializers.ListField(child=serializers.IntegerField())
    accuracy = serializers.FloatField()

"""Serializers for the ``duels`` app."""
from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.subjects.models import Subject

from .models import Duel, DuelAnswer, DuelMatch, DuelMatchAnswer, DuelRating

User = get_user_model()


class _UserMiniSerializer(serializers.Serializer):
    """Compact ``(id, name)`` representation of a :class:`User`."""

    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)


class DuelListSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`Duel` used in list/retrieve responses."""

    challenger = _UserMiniSerializer(read_only=True)
    opponent = _UserMiniSerializer(read_only=True)
    subject = serializers.SlugRelatedField(slug_field='id', read_only=True)
    winner_id = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = Duel
        fields = (
            'id',
            'challenger',
            'opponent',
            'subject',
            'state',
            'challenger_score',
            'opponent_score',
            'winner_id',
            'question_count',
            'created_at',
        )
        read_only_fields = fields


class DuelCreateSerializer(serializers.Serializer):
    """Write serializer used to create a :class:`Duel`.

    Accepts ``opponent_id`` (UUID) and an optional ``subject`` slug.
    The challenger is taken from the request user in the view.
    """

    opponent_id = serializers.UUIDField()
    subject = serializers.SlugRelatedField(
        slug_field='id',
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate_opponent_id(self, value):
        """Ensure the opponent exists and is not the requesting user."""
        request = self.context.get('request')
        try:
            opponent = User.objects.get(pk=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Raqib topilmadi.') from exc

        if request is not None and request.user.is_authenticated and opponent.pk == request.user.pk:
            raise serializers.ValidationError("O'zingizga chaqiriq yubora olmaysiz.")
        return opponent

    def create(self, validated_data: dict[str, Any]) -> Duel:
        """Create a duel in the ``pending`` state."""
        request = self.context['request']
        opponent = validated_data['opponent_id']
        subject = validated_data.get('subject')
        return Duel.objects.create(
            challenger=request.user,
            opponent=opponent,
            subject=subject,
            state='pending',
        )

    def to_representation(self, instance: Duel) -> dict[str, Any]:
        """Return the freshly created duel via :class:`DuelListSerializer`."""
        return DuelListSerializer(instance, context=self.context).data


class DuelAnswerSerializer(serializers.ModelSerializer):
    """Write serializer for :class:`DuelAnswer` submissions.

    Client `is_correct` qiymatiga ishonmaymiz — `question_id` + `picked_index`
    yuboradi, server `Question.correct_index` bilan solishtirib hisoblab
    chiqaradi.
    """

    question_id = serializers.IntegerField(write_only=True)
    picked_index = serializers.IntegerField(write_only=True, min_value=0)
    is_correct = serializers.BooleanField(read_only=True)

    class Meta:
        model = DuelAnswer
        fields = ('question_index', 'question_id', 'picked_index', 'is_correct')


# ---------------------------------------------------------------------------
# Arena serializers — DuelMatch / DuelMatchAnswer / DuelRating
# ---------------------------------------------------------------------------


class MinimalUserSerializer(serializers.ModelSerializer):
    """Compact user representation embedded in arena responses."""

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar_color', 'xp']


class DuelRatingSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`DuelRating`."""

    class Meta:
        model = DuelRating
        fields = ['rating', 'wins', 'losses', 'draws', 'streak', 'best_streak']


class DuelRatingLeaderSerializer(serializers.ModelSerializer):
    """Leaderboard row — :class:`DuelRating` joined with user info."""

    user = MinimalUserSerializer(read_only=True)

    class Meta:
        model = DuelRating
        fields = [
            'user',
            'rating',
            'wins',
            'losses',
            'draws',
            'streak',
            'best_streak',
        ]


class DuelMatchAnswerSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`DuelMatchAnswer`."""

    class Meta:
        model = DuelMatchAnswer
        fields = '__all__'


class DuelMatchAnswerWriteSerializer(serializers.Serializer):
    """Write serializer for an individual answer in a submit payload."""

    question_idx = serializers.IntegerField(min_value=0)
    question_text = serializers.CharField(max_length=500, allow_blank=True, default='')
    question_type = serializers.CharField(max_length=12, default='choice')
    user_answer = serializers.CharField(
        max_length=500, allow_blank=True, default=''
    )
    correct_answer = serializers.CharField(
        max_length=500, allow_blank=True, default=''
    )
    is_correct = serializers.BooleanField(default=False)
    time_ms = serializers.IntegerField(min_value=0, default=0)
    explanation = serializers.CharField(
        max_length=500, allow_blank=True, default=''
    )


class DuelMatchSerializer(serializers.ModelSerializer):
    """Read serializer for :class:`DuelMatch` — embeds users + answers."""

    challenger = MinimalUserSerializer(read_only=True)
    opponent = MinimalUserSerializer(read_only=True)
    winner = MinimalUserSerializer(read_only=True)
    answers = DuelMatchAnswerSerializer(many=True, read_only=True, source='match_answers')

    class Meta:
        model = DuelMatch
        fields = '__all__'

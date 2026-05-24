"""Tournaments app serializerlari.

Frontend ``Tournament`` shaklini boyitilgan ko'rinishda qaytaradi:
qatnashchilar soni, foydalanuvchi qo'shilganligi, top sovrinlar va
shaxsiy XP / rank.
"""
from __future__ import annotations

from typing import Optional

from rest_framework import serializers

from .models import Participation, Tournament, TournamentPrize


class TournamentPrizeSerializer(serializers.ModelSerializer):
    """Top sovrin (rank, reward, xp)."""

    class Meta:
        model = TournamentPrize
        fields = ('rank', 'reward', 'xp')
        read_only_fields = fields


class TournamentListSerializer(serializers.ModelSerializer):
    """Turnirlar ro'yxati uchun ixcham shakl.

    ``joined`` — joriy foydalanuvchining ushbu turnirda qatnashayotganini
    ko'rsatadi (anonim foydalanuvchi uchun har doim ``False``).
    """

    participants_count = serializers.SerializerMethodField()
    joined = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = (
            'id',
            'title',
            'desc',
            'starts_at',
            'ends_at',
            'prize',
            'participants_count',
            'is_active',
            'joined',
        )
        read_only_fields = fields

    def get_participants_count(self, obj: Tournament) -> int:
        """Turnirdagi ishtirokchilar sonini qaytaradi."""
        return obj.participations.count()

    def get_joined(self, obj: Tournament) -> bool:
        """Joriy foydalanuvchining turnirga qo'shilganini tekshiradi."""
        request = self.context.get('request')
        if request is None:
            return False
        user = getattr(request, 'user', None)
        if user is None or not user.is_authenticated:
            return False
        return obj.participations.filter(user=user).exists()


class TournamentDetailSerializer(TournamentListSerializer):
    """To'liq turnir ma'lumoti: top sovrinlar, foydalanuvchining XP'si va rank'i."""

    top_prizes = TournamentPrizeSerializer(many=True, read_only=True)
    my_rank = serializers.SerializerMethodField()
    my_xp = serializers.SerializerMethodField()

    class Meta(TournamentListSerializer.Meta):
        fields = TournamentListSerializer.Meta.fields + (
            'top_prizes',
            'my_rank',
            'my_xp',
        )
        read_only_fields = fields

    def _get_user_participation(
        self, obj: Tournament
    ) -> Optional[Participation]:
        """Joriy foydalanuvchining ishtirok yozuvini qaytaradi (yoki ``None``)."""
        request = self.context.get('request')
        if request is None:
            return None
        user = getattr(request, 'user', None)
        if user is None or not user.is_authenticated:
            return None
        return obj.participations.filter(user=user).first()

    def get_my_rank(self, obj: Tournament) -> Optional[int]:
        """Joriy foydalanuvchining turnirda joriy o'rnini qaytaradi.

        Rank — ``tournament_xp`` bo'yicha kamayish tartibida hisoblanadi
        (1 = eng yuqori). Agar foydalanuvchi qatnashmagan bo'lsa, ``None``.
        """
        participation = self._get_user_participation(obj)
        if participation is None:
            return None
        higher = obj.participations.filter(
            tournament_xp__gt=participation.tournament_xp
        ).count()
        return higher + 1

    def get_my_xp(self, obj: Tournament) -> int:
        """Joriy foydalanuvchining ushbu turnirdagi XP'si (qatnashmasa 0)."""
        participation = self._get_user_participation(obj)
        if participation is None:
            return 0
        return participation.tournament_xp


class ParticipationSerializer(serializers.ModelSerializer):
    """Ishtirokchini leaderboard / response uchun serializatsiya qiladi."""

    user = serializers.UUIDField(source='user_id', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    xp = serializers.IntegerField(source='tournament_xp', read_only=True)
    rank = serializers.SerializerMethodField()

    class Meta:
        model = Participation
        fields = ('user', 'name', 'xp', 'rank')
        read_only_fields = fields

    def get_rank(self, obj: Participation) -> int:
        """Ushbu yozuvning turnir ichidagi rank'ini qaytaradi.

        Rank ``tournament_xp`` bo'yicha kamayish tartibida hisoblanadi
        (1 = eng yuqori).

        Performance: bir marotaba so'rov uchun context'da
        ``ranks_by_id`` keshini ishlatadi — N+1 query oldini oladi.
        """
        ctx = self.context if hasattr(self, 'context') else {}
        cache = ctx.get('ranks_by_id') if isinstance(ctx, dict) else None
        if cache is not None and obj.pk in cache:
            return cache[obj.pk]
        # Fallback (kesh kontekstdan kelmagan paytda — bitta yozuv uchun ok).
        higher = Participation.objects.filter(
            tournament_id=obj.tournament_id,
            tournament_xp__gt=obj.tournament_xp,
        ).count()
        return higher + 1

"""Teams app serializerlari — list, detail, create va join uchun."""
from __future__ import annotations

from django.db import models as djmodels
from rest_framework import serializers

from .models import Team, TeamMembership


class TeamMembershipNestedSerializer(serializers.ModelSerializer):
    """Jamoa ichidagi a'zolikni qisqa formatda chiqaradi."""

    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = TeamMembership
        fields = ['user_id', 'user_name', 'joined_at', 'weekly_xp']
        read_only_fields = fields


class CaptainNestedSerializer(serializers.Serializer):
    """Kapitan haqida minimal ma'lumot."""

    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)


class TeamListSerializer(serializers.ModelSerializer):
    """Ro'yxat ko'rinishi — yengilroq, faqat zarur maydonlar."""

    members_count = serializers.SerializerMethodField()
    total_xp = serializers.SerializerMethodField()
    weekly_xp = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id',
            'name',
            'color',
            'members_count',
            'total_xp',
            'weekly_xp',
            'is_open',
        ]
        read_only_fields = fields

    def get_members_count(self, obj: Team) -> int:
        """A'zolar soni — agar prefetch qilingan bo'lsa, undan foydalanadi."""
        return obj.memberships.count()

    def get_total_xp(self, obj: Team) -> int:
        """A'zolar User.xp yig'indisi."""
        return (
            obj.memberships.aggregate(total=djmodels.Sum('user__xp'))['total'] or 0
        )

    def get_weekly_xp(self, obj: Team) -> int:
        """Haftalik XP yig'indisi (TeamMembership.weekly_xp)."""
        return (
            obj.memberships.aggregate(total=djmodels.Sum('weekly_xp'))['total'] or 0
        )


class TeamDetailSerializer(TeamListSerializer):
    """Batafsil ko'rinish — tavsif, kapitan va a'zolar ro'yxati bilan."""

    description = serializers.CharField(read_only=True)
    captain = serializers.SerializerMethodField()
    memberships = TeamMembershipNestedSerializer(many=True, read_only=True)

    class Meta(TeamListSerializer.Meta):
        fields = TeamListSerializer.Meta.fields + [
            'description',
            'captain',
            'memberships',
            'max_members',
            'created_at',
        ]

    def get_captain(self, obj: Team) -> dict | None:
        """Kapitan ma'lumotini (id, name) qaytaradi."""
        if obj.captain is None:
            return None
        return {'id': str(obj.captain.id), 'name': obj.captain.name}


class TeamCreateSerializer(serializers.ModelSerializer):
    """Jamoa yaratish — yaratuvchi avtomatik kapitan va a'zo bo'ladi."""

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'color']
        read_only_fields = ['id']

    def create(self, validated_data: dict) -> Team:
        """Jamoani yaratadi va so'rov egasini kapitan + a'zo qilib qo'shadi."""
        request = self.context['request']
        user = request.user
        team = Team.objects.create(captain=user, **validated_data)
        TeamMembership.objects.create(team=team, user=user)
        return team


class JoinTeamSerializer(serializers.Serializer):
    """Jamoaga qo'shilish so'rovi — body bo'sh, team_id URL'dan keladi."""

    pass

"""User serializers — register, login, profil (`/auth/me/`)."""
from __future__ import annotations

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


GRADE_ALIASES = {
    '9-sinf': '9',
    '10-sinf': '10',
    '11-sinf': '11',
    'abituriyent': 'abit',
    'Abituriyent': 'abit',
    'boshqa': 'other',
    'Boshqa': 'other',
}

PLACEMENT_ALIASES = {
    'basic': 'Boshlang‘ich',
    'boshlangich': 'Boshlang‘ich',
    'boshlangʻich': 'Boshlang‘ich',
    'boshlang‘ich': 'Boshlang‘ich',
    'Boshlangʻich': 'Boshlang‘ich',
    'Boshlang‘ich': 'Boshlang‘ich',
    'mid': 'O‘rta',
    'orta': 'O‘rta',
    'oʻrta': 'O‘rta',
    'o‘rta': 'O‘rta',
    'Oʻrta': 'O‘rta',
    'O‘rta': 'O‘rta',
    'high': 'Yuqori',
    'yuqori': 'Yuqori',
    'Yuqori': 'Yuqori',
}


def normalize_grade(value: str) -> str:
    """Frontend label yoki backend choice qiymatini canonical grade'ga aylantir."""

    if value is None:
        return value
    cleaned = str(value).strip()
    return GRADE_ALIASES.get(cleaned, cleaned)


def normalize_placement_level(value: str | None) -> str | None:
    """Placement darajasini frontend label/backend key variantlaridan qabul qiladi."""

    if value in (None, ''):
        return None
    cleaned = str(value).strip()
    return PLACEMENT_ALIASES.get(cleaned, PLACEMENT_ALIASES.get(cleaned.lower(), cleaned))


class UserSerializer(serializers.ModelSerializer):
    """Profil ko'rsatuvchi ochiq serializer."""

    last_active = serializers.DateField(source='last_active_date', read_only=True)
    joined = serializers.DateTimeField(source='date_joined', read_only=True)
    completed_lessons = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    subject_progress = serializers.SerializerMethodField()
    team_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'name', 'region', 'grade', 'avatar_color', 'plan',
            'xp', 'streak', 'last_active_date', 'last_active',
            'daily_goal', 'daily_done', 'daily_minutes', 'weak_subjects',
            'placement_level',
            'lives', 'lives_max', 'lives_reset_date', 'consecutive_correct',
            'coins', 'gems',
            'completed_lessons', 'results', 'subject_progress', 'team_id',
            'date_joined', 'joined',
        )
        read_only_fields = (
            'id', 'xp', 'streak', 'last_active_date',
            'daily_done',
            'lives', 'lives_max', 'lives_reset_date', 'consecutive_correct',
            'coins', 'gems',
            'completed_lessons', 'results', 'subject_progress', 'team_id',
            'date_joined',
        )

    def get_completed_lessons(self, obj) -> list[str]:
        manager = getattr(obj, 'lesson_completions', None)
        if manager is None:
            return []
        try:
            return list(manager.values_list('lesson_id', flat=True))
        except Exception:
            return []

    def get_results(self, obj) -> list[dict]:
        manager = getattr(obj, 'test_attempts', None)
        if manager is None:
            return []
        try:
            attempts = (
                manager.filter(is_complete=True)
                .select_related('test', 'test__subject')
                .order_by('-finished_at', '-started_at')[:50]
            )
        except Exception:
            return []
        data = []
        for attempt in attempts:
            finished_at = attempt.finished_at or attempt.started_at
            data.append(
                {
                    'id': str(attempt.id),
                    'test_id': attempt.test_id,
                    'subject': attempt.test.subject_id,
                    'title': attempt.test.title,
                    'total': attempt.total,
                    'correct': attempt.correct,
                    'xp_earned': attempt.xp_earned,
                    'xp': attempt.xp_earned,
                    'date': finished_at.isoformat() if finished_at else None,
                    'dateISO': finished_at.isoformat() if finished_at else None,
                }
            )
        return data

    def get_subject_progress(self, obj) -> dict[str, int]:
        try:
            from apps.subjects.models import Subject
        except Exception:
            return {}

        progress = {
            subject_id: 0
            for subject_id in Subject.objects.filter(is_active=True).values_list('id', flat=True)
        }

        try:
            lesson_subjects = (
                obj.lesson_completions.select_related('lesson')
                .values_list('lesson__subject_id', flat=True)
            )
            for subject_id in lesson_subjects:
                progress[subject_id] = min(100, progress.get(subject_id, 0) + 6)
        except Exception:
            pass

        try:
            attempts = (
                obj.test_attempts.filter(is_complete=True, total__gt=0)
                .select_related('test')
                .only('correct', 'total', 'test__subject')
            )
            for attempt in attempts:
                delta = round((attempt.correct / attempt.total) * 10)
                subject_id = attempt.test.subject_id
                progress[subject_id] = min(100, progress.get(subject_id, 0) + delta)
        except Exception:
            pass

        return progress

    def get_team_id(self, obj) -> str | None:
        try:
            membership = obj.team_memberships.select_related('team').first()
        except Exception:
            return None
        if membership is None:
            return None
        return str(membership.team_id)


class RegisterSerializer(serializers.ModelSerializer):
    """Yangi user — email, name, parol, sinf, hudud."""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    grade = serializers.CharField(required=False, default='11')

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'region', 'grade', 'avatar_color')
        extra_kwargs = {
            'region': {'required': False, 'default': ''},
            'grade': {'required': False, 'default': '11'},
            'avatar_color': {'required': False, 'default': '#4F3CC9'},
        }

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Bu email allaqachon ro‘yxatdan o‘tgan.')
        return value.lower()

    def validate_grade(self, value: str) -> str:
        grade = normalize_grade(value)
        if grade not in dict(User.GRADE_CHOICES):
            raise serializers.ValidationError('Noto‘g‘ri grade qiymati.')
        return grade

    def create(self, validated):
        password = validated.pop('password')
        return User.objects.create_user(password=password, **validated)


class LoginSerializer(serializers.Serializer):
    """Email + parol bilan kirish — JWT qaytaradi."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower()
        user = authenticate(username=email, password=attrs['password'])
        if user is None or not user.is_active:
            raise serializers.ValidationError('Email yoki parol noto‘g‘ri.', code='auth')
        attrs['user'] = user
        return attrs


def tokens_for_user(user) -> dict[str, str]:
    """SimpleJWT refresh+access juftligini qaytaradi."""
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """PATCH /auth/me/ — foydalanuvchi o‘z profilini yangilaydi.

    `plan` bu yerda yo‘q — bepul plan'dan premium'ga o‘tish to'lov endpointi
    orqali bo'lishi kerak, profile patch orqali emas.
    """

    grade = serializers.CharField(required=False)
    placement_level = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = (
            'name',
            'region',
            'grade',
            'avatar_color',
            'daily_goal',
            'daily_minutes',
            'weak_subjects',
            'placement_level',
        )

    def validate_grade(self, value: str) -> str:
        grade = normalize_grade(value)
        if grade not in dict(User.GRADE_CHOICES):
            raise serializers.ValidationError('Noto‘g‘ri grade qiymati.')
        return grade

    def validate_daily_minutes(self, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 1 or value > 240:
            raise serializers.ValidationError('daily_minutes 1..240 oralig‘ida bo‘lishi kerak.')
        return value

    def validate_weak_subjects(self, value) -> list[str]:
        if not isinstance(value, list):
            raise serializers.ValidationError('weak_subjects ro‘yxat bo‘lishi kerak.')
        cleaned = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError('weak_subjects faqat string idlardan iborat bo‘lishi kerak.')
            item = item.strip()
            if item and item not in cleaned:
                cleaned.append(item)
        return cleaned

    def validate_placement_level(self, value: str | None) -> str | None:
        level = normalize_placement_level(value)
        if level is not None and level not in dict(User.PLACEMENT_LEVEL_CHOICES):
            raise serializers.ValidationError('Noto‘g‘ri placement_level qiymati.')
        return level

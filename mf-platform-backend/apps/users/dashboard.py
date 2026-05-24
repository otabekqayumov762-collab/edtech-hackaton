"""Dashboard summary endpoint — barcha dashboard widget'lari uchun data."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


def _level_from_xp(xp: int) -> tuple[int, int, int, int]:
    """Return (level, in_level, span, pct%)."""
    try:
        from common.utils import level_from_xp
    except Exception:
        level_from_xp = lambda v: max(1, int(v // 100) + 1)  # noqa: E731
    level = level_from_xp(int(xp or 0))
    span = max(100, level * 100)
    in_level = int(xp or 0) - (level - 1) * 100
    pct = min(100, int((in_level / span) * 100)) if span else 0
    return level, in_level, span, pct


def _continue_learning(user) -> list[dict]:
    """User test natijalari asosida davom etish kerak bo'lgan fanlarni qaytaradi."""
    out: list[dict] = []
    try:
        from apps.subjects.models import Subject
        attempts = (
            user.test_attempts.filter(is_complete=True)
            .order_by('-finished_at')[:6]
        )
        seen: set[str] = set()
        for a in attempts:
            sid = a.test.subject_id if a.test_id and a.test.subject_id else None
            if not sid or sid in seen:
                continue
            seen.add(sid)
            acc = (a.correct / a.total * 100) if a.total else 0
            out.append({
                'subject': sid,
                'subject_name': Subject.objects.filter(pk=sid).values_list('name', flat=True).first() or sid,
                'accuracy': round(acc),
                'last_attempt': a.finished_at.isoformat() if a.finished_at else None,
            })
            if len(out) >= 3:
                break
    except Exception:
        pass
    return out


def _daily_plan(user) -> dict:
    """Bugungi reja — daily_goal va daily_done asosida + tavsiya."""
    minutes = (getattr(user, 'daily_minutes', None) or 30)
    weak = getattr(user, 'weak_subjects', None) or []
    focus = weak[0] if weak else 'matematika'
    tasks = [
        {'kind': 'lesson', 'title': 'Mavzu darsi', 'minutes': max(8, minutes // 3), 'to': f'/app/fan/{focus}/sinf/9'},
        {'kind': 'test', 'title': 'Tezkor test', 'minutes': max(5, minutes // 4), 'to': '/app/testlar'},
        {'kind': 'challenge', 'title': 'Kunlik challenge', 'minutes': 10, 'to': '/app/mashqlar'},
    ]
    return {
        'minutes': minutes,
        'focus_subject': focus,
        'tasks': tasks,
        'done': int(getattr(user, 'daily_done', 0) or 0),
        'goal': int(getattr(user, 'daily_goal', 5) or 5),
    }


class DashboardSummaryView(APIView):
    """GET /api/v1/auth/dashboard — full dashboard data for current user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user
        level, in_lvl, span, pct = _level_from_xp(u.xp or 0)
        tests_done = u.test_attempts.filter(is_complete=True).count() if hasattr(u, 'test_attempts') else 0
        lessons_done = (
            u.lesson_completions.count()
            if hasattr(u, 'lesson_completions')
            else 0
        )
        return Response({
            'user': {
                'id': str(u.id),
                'name': u.name,
                'email': u.email,
                'avatar_color': u.avatar_color,
                'plan': u.plan,
                'region': u.region,
                'grade': u.grade,
            },
            'stats': {
                'xp': u.xp or 0,
                'level': level,
                'in_level': in_lvl,
                'level_span': span,
                'level_pct': pct,
                'streak': u.streak or 0,
                'coins': u.coins or 0,
                'gems': u.gems or 0,
                'tests_done': tests_done,
                'lessons_done': lessons_done,
            },
            'daily': _daily_plan(u),
            'continue_learning': _continue_learning(u),
            'greeting': f'Salom, {u.name.split()[0] if u.name else "doʼstim"}',
        })

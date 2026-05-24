"""Domain services for the ``gamification`` app.

These helpers translate :class:`apps.users.models.User` state into the
metric values referenced by the :class:`Achievement` catalog and award
any newly-satisfied achievements.

Counting "perfect" tests and lesson completions relies on reverse
relations defined elsewhere (``test_attempts``, ``lesson_completions``).
The resolvers degrade gracefully (return ``0``) when a relation is not
yet wired so the service stays usable during incremental development.
"""
from __future__ import annotations

import datetime as _dt
from typing import Iterable, List, Tuple

from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.utils import timezone

from common.utils import level_from_xp as _canonical_level_from_xp

from .models import Achievement, UserAchievement, XpLog

User = get_user_model()


def _level_from_xp(xp: int) -> int:
    """Yagona canonical level formulasi — `common.utils.level_from_xp`.

    Frontend `src/lib/gamification.ts:levelFromXp` bilan mos.
    """

    return _canonical_level_from_xp(int(xp or 0))


def _count_completed_tests(user) -> int:
    """Count the user's completed test attempts.

    Falls back to ``0`` when the ``test_attempts`` reverse relation is
    not available (e.g. tests app not yet migrated).
    """

    manager = getattr(user, 'test_attempts', None)
    if manager is None:
        return 0
    try:
        return manager.filter(is_complete=True).count()
    except Exception:
        return 0


def _count_perfect_tests(user) -> int:
    """Count tests where the user answered every question correctly."""

    manager = getattr(user, 'test_attempts', None)
    if manager is None:
        return 0
    try:
        # Perfect = is_complete AND correct == total AND total > 0.
        from django.db.models import F

        return (
            manager.filter(is_complete=True, total__gt=0)
            .filter(correct=F('total'))
            .count()
        )
    except Exception:
        return 0


def _count_completed_lessons(user) -> int:
    """Count the user's completed lessons."""

    manager = getattr(user, 'lesson_completions', None)
    if manager is None:
        return 0
    try:
        return manager.count()
    except Exception:
        return 0


def compute_metric_value(user, metric: str) -> int:
    """Return the user's current numeric value for ``metric``.

    ``metric`` must be one of the values defined on
    :class:`Achievement` (``xp``, ``streak``, ``tests``, ``lessons``,
    ``level``, ``perfect``). Unknown metrics resolve to ``0``.
    """

    if metric == Achievement.METRIC_XP:
        return int(getattr(user, 'xp', 0) or 0)
    if metric == Achievement.METRIC_STREAK:
        return int(getattr(user, 'streak', 0) or 0)
    if metric == Achievement.METRIC_LEVEL:
        return _level_from_xp(int(getattr(user, 'xp', 0) or 0))
    if metric == Achievement.METRIC_TESTS:
        return _count_completed_tests(user)
    if metric == Achievement.METRIC_PERFECT:
        return _count_perfect_tests(user)
    if metric == Achievement.METRIC_LESSONS:
        return _count_completed_lessons(user)
    return 0


def _bump_streak(user) -> None:
    """Foydalanuvchi streak'ini bugungi faollikka qarab yangilaydi.

    - last_active_date bugun bo'lsa: hech narsa.
    - last_active_date kecha bo'lsa: streak += 1.
    - Boshqa hollarda (None yoki uzilgan): streak = 1.
    """

    today = timezone.localdate()
    last = user.last_active_date
    if last == today:
        return
    yesterday = today - _dt.timedelta(days=1)
    if last == yesterday:
        user.streak = (user.streak or 0) + 1
    else:
        user.streak = 1
    user.last_active_date = today


@transaction.atomic
def award_xp(
    user,
    amount: int,
    reason: str,
    *,
    bump_daily_done: bool = True,
) -> Tuple[int, List[UserAchievement]]:
    """Markaziy XP berish quvuri.

    Bitta funksiya ichida:

    1. ``touch_daily`` — kunlik counter va lives reset.
    2. Streak / last_active_date yangilanadi.
    3. XP qo'shiladi (musbat amount uchun).
    4. ``XpLog`` yoziladi (har qanday amount uchun, hatto 0 bo'lmaganda).
    5. ``daily_done`` oshiriladi (bump_daily_done=True bo'lsa va goal ostida bo'lsa).
    6. User saqlanadi.
    7. Achievement'lar tekshiriladi va yangi unlock'lar qaytariladi.

    Return: ``(xp_earned, [new_unlocked_achievements])``.
    """

    amount = int(amount or 0)

    user.touch_daily()
    _bump_streak(user)

    if amount > 0:
        user.xp = (user.xp or 0) + amount
        # Coin valyuta: har 10 XP -> 1 coin (frontend
        # `xpToCoins`/`XP_TO_COIN_RATIO` bilan mos).
        coins_earned = amount // 10
        if coins_earned > 0:
            user.coins = (user.coins or 0) + coins_earned
        XpLog.objects.create(user=user, amount=amount, reason=reason[:60])

    if bump_daily_done and user.daily_done < user.daily_goal:
        user.daily_done += 1

    user.save(
        update_fields=[
            'xp',
            'coins',
            'streak',
            'last_active_date',
            'daily_done',
            'daily_done_date',
            'lives',
            'lives_reset_date',
        ]
    )

    if amount > 0:
        _propagate_to_tournaments(user, amount)
        _propagate_to_team(user, amount)

    unlocked = check_and_award_achievements(user)
    return amount, unlocked


def _propagate_to_tournaments(user, amount: int) -> None:
    """Foydalanuvchi qatnashayotgan FAOL turnirlarga XP qo'shadi.

    Faqat hozir oynasi ochiq turnirlar (starts_at <= now <= ends_at).
    """

    try:
        from apps.tournaments.models import Participation
    except Exception:  # tournaments app yo'q yoki migrate qilinmagan
        return

    now = timezone.now()
    Participation.objects.filter(
        user=user,
        tournament__is_active=True,
        tournament__starts_at__lte=now,
        tournament__ends_at__gte=now,
    ).update(tournament_xp=models.F('tournament_xp') + amount)


def _propagate_to_team(user, amount: int) -> None:
    """Foydalanuvchining jamoaga a'zoligida haftalik XP'sini oshiradi.

    Team.total_xp / weekly_xp_sum allaqachon membership.weekly_xp dan
    aggregate qilib hisoblanadi, shuning uchun faqat membership yangilanadi.
    """

    try:
        from apps.teams.models import TeamMembership
    except Exception:
        return

    TeamMembership.objects.filter(user=user).update(
        weekly_xp=models.F('weekly_xp') + amount
    )


@transaction.atomic
def check_and_award_achievements(user) -> List[UserAchievement]:
    """Award any achievements whose threshold ``user`` has now met.

    Iterates over every catalog :class:`Achievement`, computes the
    user's current value for that metric, and creates a
    :class:`UserAchievement` for thresholds that are now satisfied and
    not yet unlocked. The function is idempotent thanks to the
    ``(user, achievement)`` unique constraint.

    Returns the newly created :class:`UserAchievement` rows.
    """

    already_unlocked = set(
        UserAchievement.objects.filter(user=user).values_list(
            'achievement_id',
            flat=True,
        )
    )

    achievements: Iterable[Achievement] = Achievement.objects.all()
    created: List[UserAchievement] = []
    for achievement in achievements:
        if achievement.id in already_unlocked:
            continue
        current = compute_metric_value(user, achievement.metric)
        if current >= achievement.requirement:
            obj, was_created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=achievement,
            )
            if was_created:
                created.append(obj)
    return created

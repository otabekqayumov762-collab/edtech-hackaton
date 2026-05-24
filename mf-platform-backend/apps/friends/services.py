"""Business logic for the ``friends`` app — accept, list, streaks, awards."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Challenge, Friendship, WinStreak


def accept_friend(friendship: Friendship) -> Friendship:
    """So'rovni qabul qiladi va vaqtni belgilaydi."""
    friendship.status = 'accepted'
    friendship.accepted_at = timezone.now()
    friendship.save(update_fields=['status', 'accepted_at'])
    return friendship


def list_friends(user):
    """Ikki tomon (sent va received) bo'yicha qabul qilingan do'stlar ro'yxati."""
    sent_ids = Friendship.objects.filter(
        from_user=user, status='accepted'
    ).values_list('to_user_id', flat=True)
    recv_ids = Friendship.objects.filter(
        to_user=user, status='accepted'
    ).values_list('from_user_id', flat=True)
    user_model = get_user_model()
    return user_model.objects.filter(id__in=list(sent_ids) + list(recv_ids))


def list_pending_incoming(user):
    """Foydalanuvchiga kelgan, hali javob berilmagan so'rovlar."""
    return Friendship.objects.filter(
        to_user=user, status='pending'
    ).select_related('from_user')


def bump_streak(user, won: bool) -> WinStreak:
    """G'alaba bo'lsa ``current`` oshadi va ``best`` yangilanadi; aks holda 0."""
    streak, _ = WinStreak.objects.get_or_create(user=user)
    if won:
        streak.current += 1
        if streak.current > streak.best:
            streak.best = streak.current
    else:
        streak.current = 0
    streak.save()
    return streak


def xp_multiplier(streak_current: int) -> float:
    """Streak'ga qarab XP koeffitsiyenti."""
    if streak_current >= 5:
        return 1.5
    if streak_current >= 3:
        return 1.2
    return 1.0


def finalize_challenge(challenge: Challenge):
    """G'olibni aniqlash, XP/coin berish va streak'larni yangilash."""
    if challenge.challenger_score is None or challenge.opponent_score is None:
        return None

    c_score, o_score = challenge.challenger_score, challenge.opponent_score
    c_time = challenge.challenger_time_ms or 0
    o_time = challenge.opponent_time_ms or 0

    if c_score > o_score:
        winner, loser = challenge.challenger, challenge.opponent
    elif o_score > c_score:
        winner, loser = challenge.opponent, challenge.challenger
    else:
        # tie-break by time (faster wins)
        if c_time and o_time:
            if c_time < o_time:
                winner, loser = challenge.challenger, challenge.opponent
            else:
                winner, loser = challenge.opponent, challenge.challenger
        else:
            winner, loser = challenge.challenger, challenge.opponent

    challenge.winner = winner
    challenge.status = 'done'
    challenge.completed_at = timezone.now()
    challenge.save(update_fields=['winner', 'status', 'completed_at'])

    # Awards — gamification mavjud bo'lmasa ham challenge yopiladi
    try:
        from apps.gamification.services import award_xp

        ws = bump_streak(winner, True)
        mult = xp_multiplier(ws.current)
        award_xp(winner, int(30 * mult), 'Challenge yutdi')
        bump_streak(loser, False)
        award_xp(loser, 5, 'Challenge ishtiroki')
    except Exception:
        pass

    return winner

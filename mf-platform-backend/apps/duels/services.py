"""Domain services for the Duel Arena.

Hosts the ELO computation and the :func:`finalize_duel` pipeline that
runs once both arena participants have submitted their answers. The
service updates each player's :class:`DuelRating`, marks the match
``done``, persists rating deltas on the :class:`DuelMatch`, and awards
XP/coins via :mod:`apps.gamification`.
"""
from __future__ import annotations

import math

from django.db import transaction
from django.utils import timezone

from .models import DuelMatch, DuelRating

K_FACTOR = 32


def get_or_create_rating(user) -> DuelRating:
    """Return the user's :class:`DuelRating`, creating one if missing."""
    rating, _ = DuelRating.objects.get_or_create(user=user)
    return rating


def elo_expected(my_rating: int, opp_rating: int) -> float:
    """Standard ELO expected score for ``my_rating`` vs ``opp_rating``."""
    return 1 / (1 + math.pow(10, (opp_rating - my_rating) / 400))


def streak_bonus(streak: int) -> float:
    """XP multiplier based on the winner's current streak."""
    if streak >= 5:
        return 1.5
    if streak >= 3:
        return 1.2
    return 1.0


@transaction.atomic
def finalize_duel(duel: DuelMatch) -> DuelMatch | None:
    """Finalize a fully-submitted arena duel.

    Computes the winner (ties broken by faster total time), updates ELO
    ratings for both participants, persists per-side rating deltas and
    completion timestamp on the duel, then awards XP + coins via
    :func:`apps.gamification.services.award_xp` (best-effort).
    Returns the updated :class:`DuelMatch` (or ``None`` if already done).
    """
    if duel.status == 'done':
        return None

    challenger = duel.challenger
    opponent = duel.opponent
    challenger_rating = get_or_create_rating(challenger)
    opponent_rating = get_or_create_rating(opponent)

    c_score = duel.challenger_score
    o_score = duel.opponent_score

    if c_score > o_score:
        winner, loser = challenger, opponent
        winner_is_challenger = True
    elif o_score > c_score:
        winner, loser = opponent, challenger
        winner_is_challenger = False
    else:
        # Tie-break by total time — faster wins. Equal time still picks
        # the challenger (deterministic fallback).
        if duel.challenger_time_ms <= duel.opponent_time_ms:
            winner, loser = challenger, opponent
            winner_is_challenger = True
        else:
            winner, loser = opponent, challenger
            winner_is_challenger = False

    # ELO update — winner gets (1 - expected), loser gets (0 - expected).
    c_expected = elo_expected(challenger_rating.rating, opponent_rating.rating)
    o_expected = 1 - c_expected

    if winner_is_challenger:
        c_actual, o_actual = 1.0, 0.0
    else:
        c_actual, o_actual = 0.0, 1.0

    c_delta = round(K_FACTOR * (c_actual - c_expected))
    o_delta = round(K_FACTOR * (o_actual - o_expected))

    challenger_rating.rating += c_delta
    opponent_rating.rating += o_delta

    if winner_is_challenger:
        challenger_rating.wins += 1
        challenger_rating.streak += 1
        challenger_rating.best_streak = max(
            challenger_rating.best_streak, challenger_rating.streak
        )
        opponent_rating.losses += 1
        opponent_rating.streak = 0
    else:
        opponent_rating.wins += 1
        opponent_rating.streak += 1
        opponent_rating.best_streak = max(
            opponent_rating.best_streak, opponent_rating.streak
        )
        challenger_rating.losses += 1
        challenger_rating.streak = 0

    challenger_rating.save()
    opponent_rating.save()

    duel.winner = winner
    duel.status = 'done'
    duel.challenger_rating_change = c_delta
    duel.opponent_rating_change = o_delta
    duel.completed_at = timezone.now()
    duel.save(
        update_fields=[
            'winner',
            'status',
            'challenger_rating_change',
            'opponent_rating_change',
            'completed_at',
        ]
    )

    # Awards — best-effort, never break finalize.
    try:
        from apps.gamification.services import award_xp

        winner_rating = get_or_create_rating(winner)
        mult = streak_bonus(winner_rating.streak)
        award_xp(winner, int(40 * mult), 'Duel yutdi')
        award_xp(loser, 8, 'Duel ishtiroki')

        # Coin reward — winner gets +15.
        try:
            winner.coins = (winner.coins or 0) + 15
            winner.save(update_fields=['coins'])
        except Exception:
            pass
    except Exception:
        pass

    return duel

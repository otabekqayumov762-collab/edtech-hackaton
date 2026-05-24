"""Shared utility functions.

Includes a Python port of the frontend XP/level math located in
``src/lib/gamification.ts`` so the backend and the client agree on
level boundaries.
"""
from __future__ import annotations

from typing import TypedDict


class LevelBounds(TypedDict):
    """Level boundary breakdown for a given XP value."""

    level: int
    cur_base: int
    next_at: int
    in_level: int
    span: int
    pct: int


def level_from_xp(xp: int) -> int:
    """Return the level for a given total XP value.

    Mirrors the frontend ``levelFromXp`` in ``src/lib/gamification.ts``:
    starting level is 1 with a need of 200 XP, and each subsequent
    level's need grows by ``round(need * 1.25)``.
    """
    if xp < 0:
        xp = 0
    level = 1
    need = 200
    acc = 0
    while xp >= acc + need:
        acc += need
        level += 1
        need = round(need * 1.25)
    return level


def level_bounds(xp: int) -> LevelBounds:
    """Return level breakdown for ``xp``.

    Returned dict mirrors the frontend ``levelBounds``:
    ``{level, cur_base, next_at, in_level, span, pct}``.
    """
    if xp < 0:
        xp = 0
    level = 1
    need = 200
    acc = 0
    while xp >= acc + need:
        acc += need
        level += 1
        need = round(need * 1.25)
    in_level = xp - acc
    pct = min(100, round((in_level / need) * 100)) if need else 0
    return {
        "level": level,
        "cur_base": acc,
        "next_at": acc + need,
        "in_level": in_level,
        "span": need,
        "pct": pct,
    }


def rank_title(level: int) -> str:
    """Return the rank title for a given level.

    Mirrors the frontend ``rankTitle`` thresholds.
    """
    if level >= 30:
        return "Afsona"
    if level >= 22:
        return "Grandmaster"
    if level >= 16:
        return "Usta"
    if level >= 11:
        return "Ekspert"
    if level >= 7:
        return "Tajribali"
    if level >= 4:
        return "O‘rganuvchi"
    return "Yangi boshlovchi"


__all__ = ["level_from_xp", "level_bounds", "rank_title", "LevelBounds"]

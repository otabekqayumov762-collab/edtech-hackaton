"""Core learning game/reward/AI services."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from django.db import models, transaction
from django.utils import timezone

from apps.gamification.services import award_xp

from .models import (
    AiLearningSignal,
    AudioLesson,
    CoreAttempt,
    CoreProgress,
    CoreSubject,
    CoreTest,
    DailyPlan,
    LearningUnit,
    PracticeGame,
)


@dataclass(frozen=True)
class RewardResult:
    xp: int = 0
    coins: int = 0
    gems: int = 0
    hearts_lost: int = 0
    lives: int = 0
    life_gained: int = 0


def _xp_to_coins(xp: int) -> int:
    return max(0, int(xp or 0) // 10)


def _user_state(user) -> dict[str, int]:
    return {
        'xp': int(getattr(user, 'xp', 0) or 0),
        'coins': int(getattr(user, 'coins', 0) or 0),
        'gems': int(getattr(user, 'gems', 0) or 0),
        'lives': int(getattr(user, 'lives', 0) or 0),
        'lives_max': int(getattr(user, 'lives_max', 0) or 0),
        'streak': int(getattr(user, 'streak', 0) or 0),
        'daily_done': int(getattr(user, 'daily_done', 0) or 0),
        'daily_goal': int(getattr(user, 'daily_goal', 0) or 0),
    }


def user_state(user) -> dict[str, int]:
    """Public wrapper for serializer/view responses."""

    return _user_state(user)


def answers_match(correct: Any, picked: Any) -> bool:
    """Compare quiz/match/drag answers without trusting client labels."""

    if isinstance(correct, dict):
        if 'index' in correct:
            try:
                return int(picked) == int(correct['index'])
            except (TypeError, ValueError):
                return False
        if 'value' in correct:
            return str(picked).strip() == str(correct['value']).strip()
    return picked == correct


def _apply_bonus_currency(user, *, coins: int = 0, gems: int = 0) -> None:
    fields: list[str] = []
    if coins > 0:
        user.coins = int(getattr(user, 'coins', 0) or 0) + coins
        fields.append('coins')
    if gems > 0:
        user.gems = int(getattr(user, 'gems', 0) or 0) + gems
        fields.append('gems')
    if fields:
        user.save(update_fields=fields)


def _record_lives(user, correct_count: int, wrong_count: int) -> tuple[int, int]:
    """Apply heart loss and correct streak life gain."""

    life_gained = 0
    for _ in range(max(0, correct_count)):
        if user.record_correct():
            life_gained += 1
    for _ in range(max(0, wrong_count)):
        user.lose_life()
    user.refresh_from_db()
    return user.lives, life_gained


def _progress_for(user, unit: LearningUnit) -> CoreProgress:
    progress, _ = CoreProgress.objects.get_or_create(user=user, unit=unit)
    return progress


def _bump_progress_rewards(
    progress: CoreProgress,
    *,
    xp: int,
    coins: int,
    gems: int,
) -> None:
    progress.total_xp_earned = (progress.total_xp_earned or 0) + max(0, xp)
    progress.total_coins_earned = (progress.total_coins_earned or 0) + max(0, coins)
    progress.total_gems_earned = (progress.total_gems_earned or 0) + max(0, gems)


def _create_signal(
    *,
    user,
    unit: LearningUnit,
    source: str,
    question_model: str = '',
    question_id: str = '',
    is_correct: bool = True,
    duration_seconds: int = 0,
    difficulty: int = 1,
) -> None:
    AiLearningSignal.objects.create(
        user=user,
        subject=unit.subject,
        grade=unit.grade,
        unit=unit,
        source=source,
        question_model=question_model,
        question_id=str(question_id or ''),
        is_correct=is_correct,
        duration_seconds=max(0, int(duration_seconds or 0)),
        difficulty=max(1, int(difficulty or 1)),
    )


@transaction.atomic
def complete_audio(user, audio: AudioLesson, duration_seconds: int = 0) -> CoreAttempt:
    """Complete optional audio and award bonus currency once per unit."""

    unit = audio.unit
    progress = _progress_for(user, unit)

    xp = int(audio.xp_reward or 0)
    bonus_coins = int(audio.coin_reward or 0)
    gems = int(audio.gem_reward or 0)
    if progress.audio_completed:
        xp = 0
        bonus_coins = 0
        gems = 0

    award_xp(user, xp, reason='core_audio', bump_daily_done=False)
    _apply_bonus_currency(user, coins=bonus_coins, gems=gems)
    user.refresh_from_db()

    coins = _xp_to_coins(xp) + bonus_coins
    progress.audio_completed = True
    _bump_progress_rewards(progress, xp=xp, coins=coins, gems=gems)
    progress.save()

    _create_signal(
        user=user,
        unit=unit,
        source=AiLearningSignal.SOURCE_AUDIO,
        duration_seconds=duration_seconds,
    )
    return CoreAttempt.objects.create(
        user=user,
        unit=unit,
        kind=CoreAttempt.KIND_AUDIO,
        total=1,
        correct=1,
        duration_seconds=max(0, int(duration_seconds or 0)),
        xp_earned=xp,
        coins_earned=coins,
        gems_earned=gems,
        payload={'audio_id': audio.id},
    )


@transaction.atomic
def submit_practice(
    user,
    practice: PracticeGame,
    answers: Iterable[dict[str, Any]],
    duration_seconds: int = 0,
) -> CoreAttempt:
    """Check practice answers, reduce hearts, award XP/coin/gem."""

    unit = practice.unit
    questions = {q.id: q for q in practice.questions.all()}
    answer_rows = list(answers)
    total = len(questions)
    correct = 0
    wrong_ids: list[int] = []
    detail: list[dict[str, Any]] = []

    for row in answer_rows:
        try:
            qid = int(row.get('question_id'))
        except (TypeError, ValueError):
            continue
        question = questions.get(qid)
        if question is None:
            continue
        picked = row.get('answer', row.get('picked_answer', row.get('picked_index')))
        ok = answers_match(question.correct_answer, picked)
        if ok:
            correct += 1
        else:
            wrong_ids.append(qid)
        detail.append(
            {
                'question_id': qid,
                'is_correct': ok,
                'explanation': question.explanation,
            }
        )
        _create_signal(
            user=user,
            unit=unit,
            source=AiLearningSignal.SOURCE_PRACTICE,
            question_model='PracticeQuestion',
            question_id=str(qid),
            is_correct=ok,
            duration_seconds=int(row.get('duration_seconds') or 0),
            difficulty=question.difficulty,
        )

    wrong_count = max(0, total - correct)
    xp = correct * int(practice.xp_per_correct or 0)
    perfect = total > 0 and correct == total
    bonus_coins = int(practice.coin_reward or 0) if correct > 0 else 0
    gems = int(practice.gem_reward_perfect or 0) if perfect else 0

    lives, life_gained = _record_lives(user, correct, wrong_count)
    award_xp(user, xp, reason='core_practice', bump_daily_done=True)
    _apply_bonus_currency(user, coins=bonus_coins, gems=gems)
    user.refresh_from_db()

    coins = _xp_to_coins(xp) + bonus_coins
    progress = _progress_for(user, unit)
    progress.practice_completed = True
    progress.best_practice_score = max(progress.best_practice_score, correct)
    _bump_progress_rewards(progress, xp=xp, coins=coins, gems=gems)
    progress.save()

    return CoreAttempt.objects.create(
        user=user,
        unit=unit,
        kind=CoreAttempt.KIND_PRACTICE,
        total=total,
        correct=correct,
        wrong_question_ids=wrong_ids,
        duration_seconds=max(0, int(duration_seconds or 0)),
        xp_earned=xp,
        coins_earned=coins,
        gems_earned=gems,
        hearts_lost=wrong_count,
        payload={
            'practice_id': practice.id,
            'life_gained': life_gained,
            'lives_after': lives,
            'answers': detail,
            'perfect': perfect,
        },
    )


@transaction.atomic
def submit_test(
    user,
    test: CoreTest,
    answers: Iterable[dict[str, Any]],
    duration_seconds: int = 0,
) -> CoreAttempt:
    """Check test answers and apply result-based reward tiers."""

    unit = test.unit
    questions = {q.id: q for q in test.questions.all()[: test.question_limit]}
    answer_rows = list(answers)
    total = len(questions)
    correct = 0
    wrong_ids: list[int] = []
    detail: list[dict[str, Any]] = []

    for row in answer_rows:
        try:
            qid = int(row.get('question_id'))
            picked_index = int(row.get('picked_index'))
        except (TypeError, ValueError):
            continue
        question = questions.get(qid)
        if question is None:
            continue
        ok = picked_index == question.correct_index
        if ok:
            correct += 1
        else:
            wrong_ids.append(qid)
        detail.append(
            {
                'question_id': qid,
                'is_correct': ok,
                'correct_index': question.correct_index,
                'explanation': question.explanation,
            }
        )
        _create_signal(
            user=user,
            unit=unit,
            source=AiLearningSignal.SOURCE_TEST,
            question_model='CoreTestQuestion',
            question_id=str(qid),
            is_correct=ok,
            duration_seconds=int(row.get('duration_seconds') or 0),
            difficulty=question.difficulty,
        )

    wrong_count = max(0, total - correct)
    accuracy = (correct / total) if total else 0
    perfect = total > 0 and correct == total
    xp = correct * int(test.xp_per_correct or 0)
    if total and accuracy >= 0.6:
        xp += int(test.pass_bonus_xp or 0)
    if perfect:
        xp += int(test.perfect_bonus_xp or 0)

    bonus_coins = int(test.coin_reward or 0) if correct > 0 else 0
    gems = int(test.gem_reward_perfect or 0) if perfect else 0

    lives, life_gained = _record_lives(user, correct, wrong_count)
    award_xp(user, xp, reason='core_test', bump_daily_done=True)
    _apply_bonus_currency(user, coins=bonus_coins, gems=gems)
    user.refresh_from_db()

    coins = _xp_to_coins(xp) + bonus_coins
    progress = _progress_for(user, unit)
    progress.test_completed = True
    progress.best_test_score = max(progress.best_test_score, correct)
    _bump_progress_rewards(progress, xp=xp, coins=coins, gems=gems)
    progress.save()

    return CoreAttempt.objects.create(
        user=user,
        unit=unit,
        kind=CoreAttempt.KIND_TEST,
        total=total,
        correct=correct,
        wrong_question_ids=wrong_ids,
        duration_seconds=max(0, int(duration_seconds or 0)),
        xp_earned=xp,
        coins_earned=coins,
        gems_earned=gems,
        hearts_lost=wrong_count,
        payload={
            'test_id': test.id,
            'accuracy': round(accuracy, 4),
            'life_gained': life_gained,
            'lives_after': lives,
            'answers': detail,
            'perfect': perfect,
        },
    )


def weak_subjects_for_user(user, limit: int = 3) -> list[dict[str, Any]]:
    """Rank subjects by recent wrong answers and slow responses."""

    rows = (
        AiLearningSignal.objects.filter(user=user)
        .values('subject_id', 'subject__name', 'subject__color')
        .annotate(
            total=models.Count('id'),
            wrong=models.Count('id', filter=models.Q(is_correct=False)),
            avg_seconds=models.Avg('duration_seconds'),
        )
        .order_by('-wrong', '-avg_seconds', 'subject__order')[:limit]
    )
    result = []
    for row in rows:
        total = int(row['total'] or 0)
        wrong = int(row['wrong'] or 0)
        result.append(
            {
                'subject_id': row['subject_id'],
                'name': row['subject__name'],
                'color': row['subject__color'],
                'wrong': wrong,
                'total': total,
                'accuracy': round((total - wrong) / total, 3) if total else 1,
                'avg_seconds': round(float(row['avg_seconds'] or 0), 1),
            }
        )
    return result


def generate_daily_plan(user) -> dict[str, Any]:
    """Build a deterministic AI-style daily plan from weak signals."""

    today = timezone.localdate()
    weak = weak_subjects_for_user(user)
    weak_ids = [row['subject_id'] for row in weak]

    subjects = list(
        CoreSubject.objects.filter(is_required=True, coming_soon=False)
        .order_by('order', 'id')
    )
    ordered_subjects = sorted(
        subjects,
        key=lambda s: (0 if s.id in weak_ids else 1, s.order, s.id),
    )
    minutes = int(getattr(user, 'daily_minutes', None) or 20)
    per_task = max(5, min(20, minutes // 3 if minutes >= 15 else minutes))

    tasks = []
    for subject in ordered_subjects[:3]:
        unit = (
            LearningUnit.objects.filter(
                track__subject=subject,
                track__grade__gte=5,
                is_active=True,
            )
            .select_related('track', 'track__subject')
            .order_by('track__grade', 'order')
            .first()
        )
        if unit is None:
            continue
        focus = 'weak' if subject.id in weak_ids else 'daily'
        tasks.append(
            {
                'id': f'{today}:{unit.id}',
                'type': 'practice' if focus == 'weak' else 'test',
                'subject_id': subject.id,
                'subject': subject.name,
                'grade': unit.grade,
                'unit_id': unit.id,
                'title': unit.title,
                'minutes': per_task,
                'focus': focus,
                'reason': (
                    'So‘nggi xatolar ko‘p bo‘lgan fan'
                    if focus == 'weak'
                    else 'Kunlik majburiy fan ritmi'
                ),
            }
        )

    payload = {
        'date': today.isoformat(),
        'minutes': minutes,
        'weak_subjects': weak,
        'tasks': tasks,
    }
    DailyPlan.objects.update_or_create(
        user=user,
        date=today,
        defaults={'payload': payload},
    )
    return payload

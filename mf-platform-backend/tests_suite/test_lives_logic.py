"""Unit testlar — User.lose_life / record_correct / touch_daily (sana mock'lari bilan)."""
from __future__ import annotations

import datetime as dt
from unittest import mock

import pytest


@pytest.mark.django_db
class TestLoseLife:
    """`lose_life` jonni 1ga kamaytiradi, 0dan pastga tushmaydi."""

    def test_decrements_lives_by_one(self, user_factory):
        user = user_factory()
        user.lives = 5
        user.lives_max = 10
        user.consecutive_correct = 3
        user.save()

        result = user.lose_life()

        assert result == 4
        user.refresh_from_db()
        assert user.lives == 4
        assert user.consecutive_correct == 0

    def test_does_not_go_below_zero(self, user_factory):
        user = user_factory()
        user.lives = 0
        user.save()

        result = user.lose_life()

        assert result == 0
        user.refresh_from_db()
        assert user.lives == 0


@pytest.mark.django_db
class TestRecordCorrect:
    """`record_correct` har 5-chi to'g'ri javob uchun jon qaytaradi."""

    def test_first_four_no_award(self, user_factory):
        user = user_factory()
        user.lives = 3
        user.lives_max = 10
        user.consecutive_correct = 0
        user.save()

        results = [user.record_correct() for _ in range(4)]

        assert all(r is False for r in results)
        user.refresh_from_db()
        assert user.consecutive_correct == 4
        assert user.lives == 3

    def test_fifth_correct_awards_life(self, user_factory):
        user = user_factory()
        user.lives = 3
        user.lives_max = 10
        user.consecutive_correct = 0
        user.save()

        results = [user.record_correct() for _ in range(5)]

        assert results[-1] is True
        user.refresh_from_db()
        assert user.lives == 4
        assert user.consecutive_correct == 0

    def test_no_award_when_lives_at_max(self, user_factory):
        user = user_factory()
        user.lives = 10
        user.lives_max = 10
        user.consecutive_correct = 4
        user.save()

        gained = user.record_correct()

        user.refresh_from_db()
        assert gained is False
        assert user.lives == 10
        # max'da bo'lsa consecutive_correct 5 da qoladi, qayta nolga tushmaydi
        assert user.consecutive_correct == 5


@pytest.mark.django_db
class TestTouchDaily:
    """`touch_daily` kunlik counterlar va lives reset'ini hal qiladi."""

    def test_resets_daily_counter_on_new_day(self, user_factory):
        user = user_factory()
        yesterday = dt.date(2026, 5, 19)
        today = dt.date(2026, 5, 20)

        user.daily_done = 7
        user.daily_done_date = yesterday
        user.lives = 4
        user.lives_max = 10
        user.lives_reset_date = today  # lives bugun reset bo'lgan
        user.save()

        with mock.patch('apps.users.models.timezone.localdate', return_value=today):
            user.touch_daily()

        assert user.daily_done == 0
        assert user.daily_done_date == today
        # lives_reset_date bugun bo'lgani uchun lives o'zgarmasligi kerak
        assert user.lives == 4

    def test_resets_lives_to_max_on_new_day(self, user_factory):
        user = user_factory()
        yesterday = dt.date(2026, 5, 19)
        today = dt.date(2026, 5, 20)

        user.lives = 2
        user.lives_max = 10
        user.lives_reset_date = yesterday
        user.daily_done = 0
        user.daily_done_date = today
        user.save()

        with mock.patch('apps.users.models.timezone.localdate', return_value=today):
            user.touch_daily()

        assert user.lives == 10
        assert user.lives_reset_date == today

    def test_noop_when_same_day(self, user_factory):
        user = user_factory()
        today = dt.date(2026, 5, 20)

        user.daily_done = 3
        user.daily_done_date = today
        user.lives = 6
        user.lives_max = 10
        user.lives_reset_date = today
        user.save()

        with mock.patch('apps.users.models.timezone.localdate', return_value=today):
            user.touch_daily()

        assert user.daily_done == 3
        assert user.lives == 6

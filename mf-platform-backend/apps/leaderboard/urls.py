"""URL routes for the ``leaderboard`` app.

Mounted at ``/api/v1/leaderboard/`` in :mod:`config.urls`, so the final
routes are:

* ``GET /api/v1/leaderboard/`` — global leaderboard (paginated).
* ``GET /api/v1/leaderboard/weekly/`` — last-7-days leaderboard.
* ``GET /api/v1/leaderboard/me/`` — current user's rank summary.
"""
from __future__ import annotations

from django.urls import path

from .views import GlobalLeaderboardView, MyRankView, WeeklyLeaderboardView

app_name = 'leaderboard'

urlpatterns = [
    path('global/', GlobalLeaderboardView.as_view(), name='global-explicit'),
    path('', GlobalLeaderboardView.as_view(), name='global'),
    path('weekly/', WeeklyLeaderboardView.as_view(), name='weekly'),
    path('me/', MyRankView.as_view(), name='me'),
]

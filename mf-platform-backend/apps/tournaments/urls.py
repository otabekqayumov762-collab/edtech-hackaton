"""Tournaments app URL marshrutlari.

`/api/v1/tournaments/` ostida quyidagi yo'llarni e'lon qiladi:

* ``GET  ``                            — faol turnirlar ro'yxati.
* ``GET  <id>/``                       — turnir tafsiloti.
* ``POST <id>/join/``                  — turnirga qo'shilish.
* ``GET  <id>/leaderboard/``           — top 50 ishtirokchi.
"""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    JoinTournamentView,
    TournamentLeaderboardView,
    TournamentViewSet,
)

router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')

urlpatterns = [
    path(
        '<str:tournament_id>/join/',
        JoinTournamentView.as_view(),
        name='tournament-join',
    ),
    path(
        '<str:tournament_id>/leaderboard/',
        TournamentLeaderboardView.as_view(),
        name='tournament-leaderboard',
    ),
    path('', include(router.urls)),
]

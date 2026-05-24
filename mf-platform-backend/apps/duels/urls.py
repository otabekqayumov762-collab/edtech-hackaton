"""URL routes for the ``duels`` app.

Mounted under ``/api/v1/duels/``. The legacy :class:`Duel` viewset is
kept for backwards compatibility; the new arena endpoints expose the
:class:`DuelMatch` model. Final URLs:

Legacy (UUID-keyed :class:`Duel`)::

    GET    /api/v1/duels/                — list legacy duels
    POST   /api/v1/duels/                — create a legacy duel
    GET    /api/v1/duels/<uuid:pk>/      — retrieve a legacy duel
    POST   /api/v1/duels/<uuid:pk>/accept/  — accept legacy duel
    POST   /api/v1/duels/<uuid:pk>/answer/  — submit legacy answer
    POST   /api/v1/duels/<uuid:pk>/cancel/  — cancel legacy duel

Arena (integer-keyed :class:`DuelMatch`)::

    POST   /api/v1/duels/create               — create arena duel
    GET    /api/v1/duels/list                 — list arena duels
    GET    /api/v1/duels/rating/me            — current user's rating
    GET    /api/v1/duels/<int:pk>             — arena duel detail
    POST   /api/v1/duels/<int:pk>/accept      — accept arena duel
    POST   /api/v1/duels/<int:pk>/submit      — submit arena answers
    GET    /api/v1/duels/<int:pk>/review      — error review (own answers)
    POST   /api/v1/duels/<int:pk>/rematch     — start a rematch
    GET    /api/v1/leaderboard/arena          — top 100 by ELO (mounted in config)
"""
from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AcceptDuelMatchView,
    AcceptDuelView,
    CancelDuelView,
    CreateDuelMatchView,
    DuelMatchDetailView,
    DuelMatchListView,
    DuelMatchRematchView,
    DuelMatchReviewView,
    DuelViewSet,
    MyDuelRatingView,
    SubmitAnswerView,
    SubmitDuelMatchView,
)

router = DefaultRouter()
router.register(r'', DuelViewSet, basename='duel')

urlpatterns = [
    # Arena (DuelMatch) — listed before the router so static paths win.
    path('create', CreateDuelMatchView.as_view(), name='duelmatch-create'),
    path('create/', CreateDuelMatchView.as_view(), name='duelmatch-create-slash'),
    path('list', DuelMatchListView.as_view(), name='duelmatch-list'),
    path('list/', DuelMatchListView.as_view(), name='duelmatch-list-slash'),
    path('rating/me', MyDuelRatingView.as_view(), name='duelmatch-rating-me'),
    path('rating/me/', MyDuelRatingView.as_view(), name='duelmatch-rating-me-slash'),
    path('<int:pk>', DuelMatchDetailView.as_view(), name='duelmatch-detail'),
    path('<int:pk>/', DuelMatchDetailView.as_view(), name='duelmatch-detail-slash'),
    path('<int:pk>/accept', AcceptDuelMatchView.as_view(), name='duelmatch-accept'),
    path('<int:pk>/accept/', AcceptDuelMatchView.as_view(), name='duelmatch-accept-slash'),
    path('<int:pk>/submit', SubmitDuelMatchView.as_view(), name='duelmatch-submit'),
    path('<int:pk>/submit/', SubmitDuelMatchView.as_view(), name='duelmatch-submit-slash'),
    path('<int:pk>/review', DuelMatchReviewView.as_view(), name='duelmatch-review'),
    path('<int:pk>/review/', DuelMatchReviewView.as_view(), name='duelmatch-review-slash'),
    path('<int:pk>/rematch', DuelMatchRematchView.as_view(), name='duelmatch-rematch'),
    path('<int:pk>/rematch/', DuelMatchRematchView.as_view(), name='duelmatch-rematch-slash'),

    # Legacy (Duel, UUID-keyed).
    path('<uuid:pk>/accept/', AcceptDuelView.as_view(), name='duel-accept'),
    path('<uuid:pk>/answer/', SubmitAnswerView.as_view(), name='duel-answer'),
    path('<uuid:pk>/cancel/', CancelDuelView.as_view(), name='duel-cancel'),
]

urlpatterns += router.urls

"""URL routes for the ``friends`` app.

Mounted under ``/api/v1/`` directly so URLs are::

    POST /api/v1/friends/request
    POST /api/v1/friends/<pk>/accept
    POST /api/v1/friends/<pk>/reject
    GET  /api/v1/friends/list
    GET  /api/v1/friends/pending
    POST /api/v1/challenges/create
    POST /api/v1/challenges/<pk>/submit
    GET  /api/v1/challenges/list
    GET  /api/v1/leaderboard/global
    GET  /api/v1/leaderboard/friends
"""
from __future__ import annotations

from django.urls import path

from .views import (
    AcceptRequestView,
    ChallengeListView,
    CreateChallengeView,
    FriendsLeaderboardView,
    FriendsListView,
    GlobalLeaderboardView,
    PendingRequestsView,
    RejectRequestView,
    SendRequestView,
    SubmitChallengeView,
)


urlpatterns = [
    path('friends/request', SendRequestView.as_view(), name='friend-request'),
    path('friends/<int:pk>/accept', AcceptRequestView.as_view(), name='friend-accept'),
    path('friends/<int:pk>/reject', RejectRequestView.as_view(), name='friend-reject'),
    path('friends/list', FriendsListView.as_view(), name='friend-list'),
    path('friends/pending', PendingRequestsView.as_view(), name='friend-pending'),
    path('challenges/create', CreateChallengeView.as_view(), name='challenge-create'),
    path('challenges/<int:pk>/submit', SubmitChallengeView.as_view(), name='challenge-submit'),
    path('challenges/list', ChallengeListView.as_view(), name='challenge-list'),
    path('leaderboard/global', GlobalLeaderboardView.as_view(), name='leaderboard-global'),
    path('leaderboard/friends', FriendsLeaderboardView.as_view(), name='leaderboard-friends'),
]

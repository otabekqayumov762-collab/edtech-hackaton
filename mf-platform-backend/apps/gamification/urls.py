"""URL routes for the ``gamification`` app.

Mounted under ``/api/v1/gamification/`` by ``config.urls``::

* ``GET achievements/`` — public catalog.
* ``GET me/achievements/`` — authenticated, includes locked status.
* ``GET me/xp-log/`` — authenticated, paginated.
"""
from __future__ import annotations

from django.urls import path

from .views import AchievementListView, MyAchievementsView, MyXpLogView

urlpatterns = [
    path(
        'achievements/',
        AchievementListView.as_view(),
        name='gamification-achievements',
    ),
    path(
        'me/achievements/',
        MyAchievementsView.as_view(),
        name='gamification-my-achievements',
    ),
    path(
        'me/xp-log/',
        MyXpLogView.as_view(),
        name='gamification-my-xp-log',
    ),
]

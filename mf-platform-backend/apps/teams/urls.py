"""Teams app URL routerlari."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JoinTeamView, LeaveTeamView, MyTeamView, TeamViewSet

router = DefaultRouter()
router.register(r'', TeamViewSet, basename='team')

urlpatterns = [
    # Statik yo'llar router'dan oldin keladi.
    path('me/', MyTeamView.as_view(), name='team-me'),
    path('<uuid:pk>/join/', JoinTeamView.as_view(), name='team-join'),
    path('<uuid:pk>/leave/', LeaveTeamView.as_view(), name='team-leave'),
    path('', include(router.urls)),
]

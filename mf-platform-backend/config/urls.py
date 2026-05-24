"""URL router — barcha app'lar /api/ ostida."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import TokenRefreshView

from common.health import health_check

from apps.duels.views import ArenaLeaderboardView

api_v1 = [
    path('auth/', include('apps.users.urls')),
    path('subjects/', include('apps.subjects.urls')),
    path('lessons/', include('apps.lessons.urls')),
    path('tests/', include('apps.tests.urls')),
    path('flashcards/', include('apps.flashcards.urls')),
    path('gamification/', include('apps.gamification.urls')),
    # Arena leaderboard — defined before leaderboard include so the
    # static segment wins over the global `''` route inside that app.
    path('leaderboard/arena', ArenaLeaderboardView.as_view(), name='arena-leaderboard'),
    path('leaderboard/arena/', ArenaLeaderboardView.as_view(), name='arena-leaderboard-slash'),
    path('leaderboard/', include('apps.leaderboard.urls')),
    path('tournaments/', include('apps.tournaments.urls')),
    path('duels/', include('apps.duels.urls')),
    path('teams/', include('apps.teams.urls')),
    path('ai/', include('apps.ai_assistant.urls')),
    path('core/', include('apps.core_learning.urls')),
    path('', include('apps.notifications.urls')),
    path('', include('apps.friends.urls')),
    path('cms/', include('apps.cms.urls')),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1)),
    path('healthz/', health_check, name='healthz'),
]

# OpenAPI schema + Swagger UI — production'da yopiq (settings.EXPOSE_API_DOCS).
if getattr(settings, 'EXPOSE_API_DOCS', settings.DEBUG):
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

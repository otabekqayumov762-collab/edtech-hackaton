"""Lessons app URL routerlari."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LessonCompleteView, LessonViewSet

router = DefaultRouter()
router.register(r'', LessonViewSet, basename='lesson')

urlpatterns = [
    path('complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('', include(router.urls)),
]

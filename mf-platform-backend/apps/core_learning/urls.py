"""Core learning API routes.

Mounted at /api/v1/core/.
"""
from __future__ import annotations

from django.urls import path

from .views import (
    AiInsightsView,
    AudioCompleteView,
    DailyPlanView,
    GradeDetailView,
    GradeListView,
    MeStateView,
    MyProgressView,
    PracticeDetailView,
    PracticeSubmitView,
    SubjectListView,
    TestDetailView,
    TestSubmitView,
    UnitDetailView,
)

app_name = 'core_learning'

urlpatterns = [
    path('subjects/', SubjectListView.as_view(), name='subjects'),
    path('subjects/<slug:subject_id>/grades/', GradeListView.as_view(), name='grades'),
    path(
        'subjects/<slug:subject_id>/grades/<int:grade>/',
        GradeDetailView.as_view(),
        name='grade-detail',
    ),
    path('units/<slug:unit_id>/', UnitDetailView.as_view(), name='unit-detail'),
    path('audio/complete/', AudioCompleteView.as_view(), name='audio-complete'),
    path('practice/submit/', PracticeSubmitView.as_view(), name='practice-submit'),
    path('practice/<slug:unit_id>/', PracticeDetailView.as_view(), name='practice-detail'),
    path('test/submit/', TestSubmitView.as_view(), name='test-submit'),
    path('test/<slug:unit_id>/', TestDetailView.as_view(), name='test-detail'),
    path('daily-plan/', DailyPlanView.as_view(), name='daily-plan'),
    path('ai/insights/', AiInsightsView.as_view(), name='ai-insights'),
    path('me/state/', MeStateView.as_view(), name='me-state'),
    path('me/progress/', MyProgressView.as_view(), name='me-progress'),
]

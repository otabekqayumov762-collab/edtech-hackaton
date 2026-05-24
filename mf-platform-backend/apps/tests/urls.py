"""Tests app URL marshrutlari.

``/api/v1/tests/`` ostida:
    * ``GET /`` va ``GET /<id>/`` — testlar ro'yxati/detali.
    * ``POST /answer/`` — bitta savolga javob (LIVES boshqaruvi).
    * ``POST /finish/`` — test yakuni va XP hisobi.
"""
from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AnswerView, FinishTestView, TestViewSet, GenerateTestView

router = DefaultRouter()
router.register(r'', TestViewSet, basename='test')

urlpatterns = [
    path('answer/', AnswerView.as_view(), name='tests-answer'),
    path('finish/', FinishTestView.as_view(), name='tests-finish'),
    path('generate/', GenerateTestView.as_view(), name='tests-generate'),
]
urlpatterns += router.urls

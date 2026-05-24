"""Pytest fixtures — APIClient, user factory, JWT-auth client."""
from __future__ import annotations

import factory
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def api_client() -> APIClient:
    """Anonim DRF APIClient."""
    return APIClient()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory_boy — User uchun mantiqiy default qiymatlar."""

    class Meta:
        model = get_user_model()
        django_get_or_create = ('email',)

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    name = factory.Sequence(lambda n: f'Test User {n}')
    region = 'Toshkent'
    grade = '11'
    plan = 'free'
    is_active = True
    is_staff = False

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop('password', 'StrongPass123!')
        manager = cls._get_manager(model_class)
        return manager.create_user(*args, password=password, **kwargs)


@pytest.fixture
def user_factory():
    """factory_boy Factory — `user_factory()` chaqirsangiz, foydalanuvchi yaratiladi."""
    return UserFactory


@pytest.fixture
def auth_client(api_client):
    """`auth_client(user)` — berilgan user uchun JWT bilan APIClient qaytaradi."""

    def _make(user):
        refresh = RefreshToken.for_user(user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client

    return _make

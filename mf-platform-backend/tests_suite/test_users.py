"""User auth + lives API smoke testlari."""
from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestRegistration:
    """POST /api/v1/auth/register/ — yangi user yaratish."""

    def test_register_creates_user(self, api_client):
        payload = {
            'email': 'newbie@example.com',
            'name': 'Newbie',
            'password': 'StrongPass123!',
            'grade': '11',
            'region': 'Toshkent',
        }
        response = api_client.post('/api/v1/auth/register/', payload, format='json')

        assert response.status_code in (200, 201)
        assert User.objects.filter(email='newbie@example.com').exists()

    def test_register_rejects_duplicate_email(self, api_client, user_factory):
        user_factory(email='dup@example.com')
        payload = {
            'email': 'dup@example.com',
            'name': 'Dup',
            'password': 'StrongPass123!',
        }
        response = api_client.post('/api/v1/auth/register/', payload, format='json')
        assert response.status_code in (400, 409)


@pytest.mark.django_db
class TestLogin:
    """POST /api/v1/auth/login/ — JWT token oladi."""

    def test_login_returns_tokens(self, api_client, user_factory):
        user_factory(email='login@example.com', password='StrongPass123!')

        response = api_client.post(
            '/api/v1/auth/login/',
            {'email': 'login@example.com', 'password': 'StrongPass123!'},
            format='json',
        )

        assert response.status_code == 200
        body = response.json()
        assert 'access' in body
        assert 'refresh' in body

    def test_login_wrong_password_fails(self, api_client, user_factory):
        user_factory(email='login2@example.com', password='StrongPass123!')

        response = api_client.post(
            '/api/v1/auth/login/',
            {'email': 'login2@example.com', 'password': 'WrongPass!'},
            format='json',
        )
        assert response.status_code in (400, 401)


@pytest.mark.django_db
class TestMeEndpoint:
    """GET /api/v1/auth/me/ — JWT-bilan o'z profilini olish."""

    def test_me_requires_auth(self, api_client):
        response = api_client.get('/api/v1/auth/me/')
        assert response.status_code in (401, 403)

    def test_me_returns_profile(self, user_factory, auth_client):
        user = user_factory(email='me@example.com', name='Me User')
        client = auth_client(user)

        response = client.get('/api/v1/auth/me/')
        assert response.status_code == 200
        body = response.json()
        assert body.get('email') == 'me@example.com'


@pytest.mark.django_db
class TestLivesMechanics:
    """Integratsion: lose_life kamaytirishi, record_correct x5 jonni qaytarishi."""

    def test_lose_life_decrements(self, user_factory):
        user = user_factory()
        initial = user.lives

        new_lives = user.lose_life()

        assert new_lives == initial - 1
        user.refresh_from_db()
        assert user.lives == initial - 1
        assert user.consecutive_correct == 0

    def test_record_correct_five_in_row_awards_life(self, user_factory):
        user = user_factory()
        # bitta jon yo'qotamiz, keyin 5 to'g'ri javob
        user.lose_life()
        user.refresh_from_db()
        baseline = user.lives

        gained_flags = [user.record_correct() for _ in range(5)]

        user.refresh_from_db()
        assert gained_flags[-1] is True
        assert sum(1 for f in gained_flags if f) == 1
        assert user.lives == baseline + 1
        assert user.consecutive_correct == 0
